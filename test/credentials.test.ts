import { mkdtemp, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { credentialsPath, readStoredKey, removeKey, resolveApiKey, storeKey } from "../src/credentials.js";

describe("credentials", () => {
  it("stores a local key with restricted permissions", async () => {
    const home = await mkdtemp(join(tmpdir(), "jev-marshal-"));
    const environment = { XDG_CONFIG_HOME: home };
    await storeKey(" secret ", environment);
    expect(await readStoredKey(environment)).toBe("secret");
    expect((await stat(credentialsPath(environment))).mode & 0o777).toBe(0o600);
    expect(await removeKey(environment)).toBe(true);
  });

  it("prefers the environment key", async () => {
    expect(await resolveApiKey({ TYPESAFE_API_KEY: "env-key", XDG_CONFIG_HOME: "/missing" })).toBe("env-key");
  });
});
