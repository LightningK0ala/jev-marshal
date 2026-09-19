#!/usr/bin/env node
import { Command, Option } from "commander";
import { initConfig, loadConfig } from "./config.js";
import { credentialsPath, readStoredKey, removeKey, resolveApiKey, storeKey } from "./credentials.js";
import { evaluateRules } from "./evaluate.js";
import { collectChangePacket } from "./git.js";
import { createRequest } from "./jev.js";
import { githubMetadata } from "./metadata.js";
import { readSecret } from "./prompt.js";
import { exitCode, formatText } from "./report.js";

interface CheckOptions {
  base?: string;
  staged?: boolean;
  config?: string;
  format?: "text" | "json";
  dryRun?: boolean;
  title?: string;
  description?: string;
}

function useColors(): boolean {
  if ("NO_COLOR" in process.env || process.env.FORCE_COLOR === "0") return false;
  return Boolean(process.stdout.isTTY || process.env.FORCE_COLOR);
}

function addCheckOptions(command: Command): Command {
  return command
    .option("--base <ref>", "compare HEAD with this Git ref")
    .option("--staged", "check staged changes")
    .option("--config <path>", "use this configuration file")
    .addOption(new Option("--format <format>", "set the output format").choices(["text", "json"]).default("text"))
    .option("--dry-run", "print the exact Jev request and do not call the API")
    .option("--title <text>", "set the change title")
    .option("--description <text>", "set the change description");
}

async function check(options: CheckOptions): Promise<number> {
  const cwd = process.cwd();
  const [{ config }, metadata] = await Promise.all([
    loadConfig(cwd, options.config),
    githubMetadata(),
  ]);
  const packet = await collectChangePacket({
    cwd,
    base: options.staged ? undefined : options.base ?? metadata.base ?? config.base,
    staged: options.staged,
    maxPatchChars: config.maxPatchChars,
    repository: metadata.repository,
    title: options.title ?? metadata.title,
    description: options.description ?? metadata.description,
  });
  const request = createRequest(config, packet);

  if (options.dryRun) {
    process.stdout.write(`${JSON.stringify(request, null, 2)}\n`);
    return 0;
  }
  if (packet.changedFiles.length === 0) {
    const output = { message: "No changed files.", comparison: packet.comparison };
    process.stdout.write(options.format === "json" ? `${JSON.stringify(output, null, 2)}\n` : "No changed files.\n");
    return 0;
  }

  let apiKey = await resolveApiKey();
  if (!apiKey) {
    process.stdout.write("No TypeSafe API key found.\n");
    apiKey = await readSecret("TypeSafe API key: ");
    const path = await storeKey(apiKey);
    process.stdout.write(`Saved the key in ${path}.\n`);
  }

  const report = await evaluateRules({
    config,
    packet,
    apiKey,
    endpoint: process.env.JEV_MARSHAL_API_URL,
  });
  process.stdout.write(
    options.format === "json" ? `${JSON.stringify(report, null, 2)}\n` : formatText(report, { colors: useColors() }),
  );
  return exitCode(report);
}

const program = addCheckOptions(
  new Command()
    .name("jev-marshal")
    .description("Check pull requests against repository rules with Jev.")
    .version("0.1.0"),
);

program.action(async (options: CheckOptions) => {
  process.exitCode = await check(options);
});

addCheckOptions(program.command("check").description("check the current change"))
  .action(async (options: CheckOptions) => {
    process.exitCode = await check(options);
  });

program
  .command("init")
  .description("create a starter configuration")
  .option("--config <path>", "write to this path")
  .action(async (options: { config?: string }) => {
    const path = await initConfig(process.cwd(), options.config);
    process.stdout.write(`Created ${path}.\n`);
  });

const auth = program.command("auth").description("manage the local TypeSafe API key");
auth.command("set").description("save an API key for local use").action(async () => {
  const key = await readSecret("TypeSafe API key: ");
  const path = await storeKey(key);
  process.stdout.write(`Saved the key in ${path}.\n`);
});
auth.command("status").description("show whether an API key is available").action(async () => {
  if (process.env.TYPESAFE_API_KEY?.trim()) {
    process.stdout.write("A key is available from TYPESAFE_API_KEY.\n");
    return;
  }
  process.stdout.write((await readStoredKey()) ? `A local key is stored in ${credentialsPath()}.\n` : "No API key is available.\n");
});
auth.command("logout").description("remove the stored API key").action(async () => {
  process.stdout.write((await removeKey()) ? "Removed the stored API key.\n" : "No stored API key was found.\n");
});

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const json = process.argv.includes("--format") && process.argv[process.argv.indexOf("--format") + 1] === "json";
  process.stdout.write(json ? `${JSON.stringify({ error: { message } }, null, 2)}\n` : `jev-marshal: ${message}\n`);
  process.exitCode = 2;
});
