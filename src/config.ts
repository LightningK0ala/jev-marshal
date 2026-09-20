import { access, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import YAML from "yaml";
import { z } from "zod";
import type { Config } from "./types.js";

export const DEFAULT_CONFIG_FILE = "jev-marshal.yml";

const ruleSchema = z.object({
  id: z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/),
  question: z.string().trim().min(1),
  level: z.enum(["warning", "error"]).default("error"),
  message: z.string().trim().min(1),
  threshold: z.number().min(0.5).max(1).optional(),
});

const configSchema = z.object({
  version: z.literal(1),
  model: z.string().trim().min(1).default("jev-latest"),
  base: z.string().trim().min(1).optional(),
  threshold: z.number().min(0.5).max(1).default(0.7),
  maxPatchChars: z.number().int().min(1_000).max(100_000).default(24_000),
  rules: z.array(ruleSchema).min(1),
});

export const starterConfig = `version: 1
model: jev-latest
base: origin/main
threshold: 0.7
maxPatchChars: 24000

rules:
  - id: adr-required
    question: Does this change include an ADR when it makes an important architectural decision?
    level: error
    message: Add an ADR for the architectural decision.

  - id: storybook-required
    question: Does this change update Storybook when it adds, removes, or materially changes a UI component, page, or screen?
    level: error
    message: Add or update the related Storybook stories.

  - id: changenote-required
    question: Does this change include a changenote proposal for user-visible behavior?
    level: warning
    message: Add a changenote proposal.
`;

export async function loadConfig(cwd: string, configPath?: string): Promise<{ config: Config; path: string }> {
  const path = resolve(cwd, configPath ?? DEFAULT_CONFIG_FILE);
  const source = await readFile(path, "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") {
      throw new Error(`No ${DEFAULT_CONFIG_FILE} file found. Run \"jev-marshal init\".`);
    }
    throw error;
  });

  const parsed = configSchema.parse(YAML.parse(source));
  const ids = new Set<string>();
  for (const rule of parsed.rules) {
    if (ids.has(rule.id)) throw new Error(`Rule ID \"${rule.id}\" is not unique.`);
    ids.add(rule.id);
  }
  return { config: parsed, path };
}

export async function initConfig(cwd: string, configPath?: string): Promise<string> {
  const path = resolve(cwd, configPath ?? DEFAULT_CONFIG_FILE);
  const exists = await access(path).then(() => true).catch(() => false);
  if (exists) throw new Error(`${path} already exists.`);
  await writeFile(path, starterConfig, { encoding: "utf8", flag: "wx" });
  return path;
}
