import type { Report } from "./types.js";

const ansi = {
  bold: "\u001B[1m",
  dim: "\u001B[2m",
  green: "\u001B[32m",
  yellow: "\u001B[33m",
  red: "\u001B[31m",
  cyan: "\u001B[36m",
  reset: "\u001B[0m",
} as const;

interface FormatOptions {
  colors?: boolean;
}

function paint(text: string, color: keyof typeof ansi, enabled: boolean): string {
  return enabled ? `${ansi[color]}${text}${ansi.reset}` : text;
}

function resultAppearance(result: Report["results"][number]) {
  if (result.decision === "compliant") return { icon: "✓", label: "PASS", color: "green" } as const;
  if (result.decision === "not_applicable") return { icon: "–", label: "SKIP", color: "dim" } as const;
  if (result.decision === "unknown") return { icon: "?", label: "UNKNOWN", color: "yellow" } as const;
  if (result.level === "warning") return { icon: "!", label: "WARN", color: "yellow" } as const;
  return { icon: "✗", label: "FAIL", color: "red" } as const;
}

export function formatText(report: Report, options: FormatOptions = {}): string {
  const colors = options.colors ?? false;
  const fileCount = `${report.changedFiles} changed file${report.changedFiles === 1 ? "" : "s"}`;
  const lines = [
    paint("Jev Marshal", "bold", colors),
    `${fileCount} ${paint("·", "dim", colors)} ${paint(report.comparison, "cyan", colors)}`,
  ];
  if (!report.patchComplete) {
    lines.push(paint("! Patch truncated — unknown results can block this check.", "yellow", colors));
  }
  lines.push("", paint("Results", "bold", colors));

  for (const result of report.results) {
    const appearance = resultAppearance(result);
    const status = `${appearance.icon} ${appearance.label.padEnd(7)}`;
    const isFinding = result.decision === "non_compliant" || result.decision === "unknown";
    const level = isFinding
      ? `${paint(`[${result.level}]`, result.level === "error" ? "red" : "yellow", colors)} `
      : "";
    const confidence = paint(`${Math.round(result.confidence * 100)}%`, "dim", colors);
    lines.push(`${paint(status, appearance.color, colors)} ${level}${result.id}  ${confidence}`);
    if (isFinding) {
      lines.push(`  ${paint("↳", appearance.color, colors)} ${result.message}`);
    }
  }

  const failed = report.summary.errors > 0;
  const outcomeCounts = {
    passed: report.results.filter((result) => result.decision === "compliant").length,
    violations: report.results.filter((result) => result.decision === "non_compliant").length,
    skipped: report.results.filter((result) => result.decision === "not_applicable").length,
    unknown: report.results.filter((result) => result.decision === "unknown").length,
  };
  const outcomes = [
    outcomeCounts.passed ? `${outcomeCounts.passed} passed` : undefined,
    outcomeCounts.violations ? `${outcomeCounts.violations} violation${outcomeCounts.violations === 1 ? "" : "s"}` : undefined,
    outcomeCounts.skipped ? `${outcomeCounts.skipped} skipped` : undefined,
    outcomeCounts.unknown ? `${outcomeCounts.unknown} unknown` : undefined,
  ].filter((value): value is string => Boolean(value));
  const impact = [
    report.summary.errors
      ? `${report.summary.errors} blocking error${report.summary.errors === 1 ? "" : "s"}`
      : undefined,
    report.summary.warnings
      ? `${report.summary.warnings} warning${report.summary.warnings === 1 ? "" : "s"}`
      : undefined,
  ].filter((value): value is string => Boolean(value));
  const conclusion = failed ? "✗ Check failed" : "✓ Check passed";
  lines.push("", paint(conclusion, failed ? "red" : "green", colors));
  if (outcomes.length > 0) lines.push(`  ${paint(outcomes.join(" · "), "dim", colors)}`);
  if (impact.length > 0) lines.push(`  ${paint(impact.join(" · "), "dim", colors)}`);
  return `${lines.join("\n")}\n`;
}

export function exitCode(report: Report): number {
  return report.summary.errors > 0 ? 1 : 0;
}
