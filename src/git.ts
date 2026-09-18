import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import type { ChangePacket, ChangedFile } from "./types.js";

const exec = promisify(execFile);

async function git(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await exec("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    const detail = error as { stderr?: string; message?: string };
    throw new Error((detail.stderr || detail.message || "Git command failed.").trim());
  }
}

function parseChangedFiles(output: string): ChangedFile[] {
  return output
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status = "M", first = "", second] = line.split("\t");
      if ((status.startsWith("R") || status.startsWith("C")) && second) {
        return { status: status[0]!, previousPath: first, path: second };
      }
      return { status: status[0]!, path: first };
    });
}

function truncatePatch(patch: string, maxChars: number): { patch: string; complete: boolean } {
  if (patch.length <= maxChars) return { patch, complete: true };
  return {
    patch: `${patch.slice(0, maxChars)}\n\n[Patch truncated by Jev Marshal]`,
    complete: false,
  };
}

async function untrackedFiles(root: string): Promise<ChangedFile[]> {
  const output = await git(root, ["ls-files", "--others", "--exclude-standard"]);
  return output.split("\n").filter(Boolean).map((path) => ({ status: "A", path }));
}

async function untrackedPatch(root: string, files: ChangedFile[], budget: number): Promise<string> {
  let result = "";
  for (const file of files) {
    if (result.length >= budget) break;
    const source = await readFile(`${root}/${file.path}`, "utf8").catch(() => undefined);
    if (source === undefined || source.includes("\0")) continue;
    result += `\ndiff --git a/${file.path} b/${file.path}\nnew file mode 100644\n--- /dev/null\n+++ b/${file.path}\n${source.split("\n").map((line) => `+${line}`).join("\n")}\n`;
  }
  return result;
}

export interface CollectOptions {
  cwd: string;
  base?: string;
  staged?: boolean;
  maxPatchChars: number;
  repository?: string;
  title?: string;
  description?: string;
}

export async function collectChangePacket(options: CollectOptions): Promise<ChangePacket> {
  if (options.base && options.staged) throw new Error("Use either --base or --staged, not both.");
  const root = (await git(options.cwd, ["rev-parse", "--show-toplevel"])).trim();
  let diffArgs: string[];
  let comparison: string;
  let includeUntracked = false;

  if (options.staged) {
    diffArgs = ["diff", "--cached"];
    comparison = "staged changes";
  } else if (options.base) {
    await git(root, ["rev-parse", "--verify", `${options.base}^{commit}`]);
    diffArgs = ["diff", `${options.base}...HEAD`];
    comparison = `${options.base}...HEAD`;
  } else {
    diffArgs = ["diff", "HEAD"];
    comparison = "working tree against HEAD";
    includeUntracked = true;
  }

  const [patchOutput, namesOutput] = await Promise.all([
    git(root, [...diffArgs, "--no-ext-diff", "--unified=3", "--"]),
    git(root, [...diffArgs, "--name-status", "--"]),
  ]);
  const tracked = parseChangedFiles(namesOutput);
  const untracked = includeUntracked ? await untrackedFiles(root) : [];
  const extraPatch = includeUntracked
    ? await untrackedPatch(root, untracked, options.maxPatchChars - patchOutput.length)
    : "";
  const limited = truncatePatch(patchOutput + extraPatch, options.maxPatchChars);

  return {
    kind: "pull_request_change",
    repository: options.repository,
    title: options.title,
    description: options.description,
    comparison,
    changedFiles: [...tracked, ...untracked],
    patch: limited.patch,
    patchComplete: limited.complete,
  };
}
