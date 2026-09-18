import type { Report } from "./types.js";

const symbol = {
  compliant: "PASS",
  non_compliant: "FAIL",
  not_applicable: "SKIP",
  unknown: "UNKNOWN",
} as const;

export function formatText(report: Report): string {
  const lines = [
    `Jev Marshal checked ${report.changedFiles} changed file${report.changedFiles === 1 ? "" : "s"}.`,
    `Comparison: ${report.comparison}`,
  ];
  if (!report.patchComplete) lines.push("The patch was truncated. Unknown results can block the check.");
  lines.push("");

  for (const result of report.results) {
    lines.push(`${symbol[result.decision]} [${result.id}] ${Math.round(result.confidence * 100)}%`);
    if (result.decision === "non_compliant" || result.decision === "unknown") {
      lines.push(`  ${result.message}`);
    }
  }

  lines.push("", `${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.unknown} unknown.`);
  return `${lines.join("\n")}\n`;
}

export function exitCode(report: Report): number {
  return report.summary.errors > 0 ? 1 : 0;
}
