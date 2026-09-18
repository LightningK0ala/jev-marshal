import { describe, expect, it } from "vitest";
import { evaluateRules } from "../src/evaluate.js";
import { createRequest } from "../src/jev.js";
import type { ChangePacket, Config } from "../src/types.js";

const config: Config = {
  version: 1,
  model: "jev-latest",
  threshold: 0.7,
  maxPatchChars: 24_000,
  rules: [{ id: "adr", question: "Does this change include a required ADR?", level: "error", message: "Add an ADR." }],
};
const packet: ChangePacket = {
  kind: "pull_request_change",
  comparison: "main...HEAD",
  changedFiles: [{ status: "M", path: "src/auth.ts" }],
  patch: "diff --git a/src/auth.ts b/src/auth.ts",
  patchComplete: true,
};

describe("Jev evaluation", () => {
  it("builds a choice question with untrusted-input guidance", () => {
    const request = createRequest(config, packet);
    expect(request.questions.adr!.criteria).toHaveProperty("not_applicable");
    expect(request.questions.adr!.instructions).toContain("untrusted evidence");
  });

  it("blocks an error rule when the change is not compliant", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      model: "jev-test",
      answers: {
        adr: {
          type: "choice",
          choice: "non_compliant",
          confidence: 0.91,
          probabilities: { compliant: 0.02, non_compliant: 0.91, not_applicable: 0.02, unknown: 0.05 },
        },
      },
    }), { status: 200, headers: { "content-type": "application/json" } });

    const report = await evaluateRules({ config, packet, apiKey: "test", fetcher });
    expect(report.summary.errors).toBe(1);
    expect(report.results[0]?.blocks).toBe(true);
  });

  it("turns low-confidence decisions into unknown", async () => {
    const fetcher = async () => new Response(JSON.stringify({
      model: "jev-test",
      answers: {
        adr: {
          type: "choice",
          choice: "compliant",
          confidence: 0.55,
          probabilities: { compliant: 0.4, non_compliant: 0.2, not_applicable: 0.2, unknown: 0.2 },
        },
      },
    }), { status: 200 });

    const report = await evaluateRules({ config, packet, apiKey: "test", fetcher });
    expect(report.results[0]?.decision).toBe("unknown");
    expect(report.summary.errors).toBe(1);
  });
});
