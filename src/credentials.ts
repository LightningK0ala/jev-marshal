import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";

function configHome(environment: NodeJS.ProcessEnv): string {
  if (environment.XDG_CONFIG_HOME) return environment.XDG_CONFIG_HOME;
  if (platform() === "darwin") return join(homedir(), "Library", "Application Support");
  if (platform() === "win32" && environment.APPDATA) return environment.APPDATA;
  return join(homedir(), ".config");
}

export function credentialsPath(environment: NodeJS.ProcessEnv = process.env): string {
  return join(configHome(environment), "jev-marshal", "credentials.json");
}

export async function readStoredKey(environment: NodeJS.ProcessEnv = process.env): Promise<string | undefined> {
  const source = await readFile(credentialsPath(environment), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!source) return undefined;
  const value = JSON.parse(source) as { apiKey?: unknown };
  return typeof value.apiKey === "string" && value.apiKey.trim() ? value.apiKey.trim() : undefined;
}

export async function resolveApiKey(environment: NodeJS.ProcessEnv = process.env): Promise<string | undefined> {
  const fromEnvironment = environment.TYPESAFE_API_KEY?.trim();
  return fromEnvironment || readStoredKey(environment);
}

export async function storeKey(apiKey: string, environment: NodeJS.ProcessEnv = process.env): Promise<string> {
  const key = apiKey.trim();
  if (!key) throw new Error("The API key cannot be empty.");
  const path = credentialsPath(environment);
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  await chmod(dirname(path), 0o700).catch(() => undefined);
  await writeFile(path, `${JSON.stringify({ apiKey: key }, null, 2)}\n`, { mode: 0o600 });
  await chmod(path, 0o600).catch(() => undefined);
  return path;
}

export async function removeKey(environment: NodeJS.ProcessEnv = process.env): Promise<boolean> {
  return rm(credentialsPath(environment)).then(() => true).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return false;
    throw error;
  });
}
