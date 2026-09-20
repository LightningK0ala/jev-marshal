import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initConfig, loadConfig } from "../src/config.js";

describe("configuration", () => {
  it("creates and loads the starter configuration", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "jev-marshal-"));
    const path = await initConfig(cwd);
    expect(await readFile(path, "utf8")).toContain("adr-required");
    const { config } = await loadConfig(cwd);
    expect(config.rules).toHaveLength(3);
    expect(config.threshold).toBe(0.7);
  });

  it("loads a rule-specific threshold", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "jev-marshal-"));
    await initConfig(cwd);
    const path = join(cwd, "jev-marshal.yml");
    const source = await readFile(path, "utf8");
    await writeFile(path, source.replace("level: error", "level: error\n    threshold: 0.9"));

    const { config } = await loadConfig(cwd);
    expect(config.rules[0]?.threshold).toBe(0.9);
    expect(config.rules[1]?.threshold).toBeUndefined();
  });

  it("does not overwrite a configuration", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "jev-marshal-"));
    await initConfig(cwd);
    await expect(initConfig(cwd)).rejects.toThrow("already exists");
  });
});
