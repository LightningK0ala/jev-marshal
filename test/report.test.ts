import { describe, expect, it } from "vitest";
import { formatText } from "../src/report.js";
import type { Report } from "../src/types.js";

const report: Report = {
  model: "jev-latest",
  comparison: "main...HEAD",
  changedFiles: 2,
  patchComplete: true,
  results: [
    {
      id: "tests-required",
      level: "error",
      decision: "compliant",
      confidence: 0.96,
      probabilities: { compliant: 0.96, non_compliant: 0.01, not_applicable: 0.01, unknown: 0.02 },
      message: "Add tests.",
      blocks: false,
    },
    {
      id: "docs-required",
      level: "error",
      decision: "non_compliant",
      confidence: 0.88,
      probabilities: { compliant: 0.03, non_compliant: 0.88, not_applicable: 0.02, unknown: 0.07 },
      message: "Update the documentation.",
      blocks: true,
    },
  ],
  summary: { errors: 1, warnings: 0, unknown: 0 },
};

describe("text report", () => {
  it("formats a readable plain-text report", () => {
    expect(formatText(report)).toBe(
      [
        "Jev Marshal",
        "2 changed files · main...HEAD",
        "",
        "Results",
        "✓ PASS    tests-required  96%",
        "✗ FAIL    [error] docs-required  88%",
        "  ↳ Update the documentation.",
        "",
        "✗ Check failed",
        "  1 passed · 1 violation",
        "  1 blocking error",
        "",
      ].join("\n"),
    );
  });

  it("adds ANSI styling only when requested", () => {
    expect(formatText(report, { colors: true })).toContain("\u001B[32m✓ PASS");
    expect(formatText(report, { colors: true })).toContain("\u001B[31m✗ Check failed");
    expect(formatText(report)).not.toContain("\u001B[");
  });

  it("shows the configured level on findings", () => {
    const warningReport: Report = {
      ...report,
      results: [{ ...report.results[1]!, level: "warning", blocks: false }],
      summary: { errors: 0, warnings: 1, unknown: 0 },
    };

    expect(formatText(report)).toContain("[error] docs-required");
    expect(formatText(warningReport)).toContain("[warning] docs-required");
  });

  it("separates rule outcomes from their impact", () => {
    const mixedReport: Report = {
      ...report,
      results: [
        { ...report.results[1]!, id: "adr-required", decision: "unknown", confidence: 0.47 },
        { ...report.results[0]!, id: "storybook-required", decision: "not_applicable", confidence: 0.96 },
        {
          ...report.results[1]!,
          id: "changenote-required",
          level: "warning",
          decision: "unknown",
          confidence: 0.26,
          blocks: false,
        },
      ],
      summary: { errors: 1, warnings: 1, unknown: 2 },
    };

    expect(formatText(mixedReport)).toContain(
      "✗ Check failed\n  1 skipped · 2 unknown\n  1 blocking error · 1 warning\n",
    );
  });
});
