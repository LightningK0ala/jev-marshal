import { callJev, createRequest } from "./jev.js";
import type { ChangePacket, Config, Decision, Report, RuleResult } from "./types.js";

export async function evaluateRules(input: {
  config: Config;
  packet: ChangePacket;
  apiKey: string;
  endpoint?: string;
  fetcher?: typeof fetch;
}): Promise<Report> {
  const request = createRequest(input.config, input.packet);
  const response = await callJev({
    apiKey: input.apiKey,
    request,
    endpoint: input.endpoint,
    fetcher: input.fetcher,
  });

  const results: RuleResult[] = input.config.rules.map((rule) => {
    const answer = response.answers[rule.id];
    if (!answer) throw new Error(`Jev did not return an answer for rule \"${rule.id}\".`);
    const decision: Decision = answer.confidence >= input.config.threshold ? answer.choice : "unknown";
    const isFinding = decision === "non_compliant" || decision === "unknown";
    return {
      id: rule.id,
      level: rule.level,
      decision,
      confidence: answer.confidence,
      probabilities: answer.probabilities,
      message: rule.message,
      blocks: isFinding && rule.level === "error",
    };
  });

  return {
    model: response.model,
    comparison: input.packet.comparison,
    changedFiles: input.packet.changedFiles.length,
    patchComplete: input.packet.patchComplete,
    results,
    summary: {
      errors: results.filter((result) => result.blocks).length,
      warnings: results.filter((result) => !result.blocks && (result.decision === "non_compliant" || result.decision === "unknown")).length,
      unknown: results.filter((result) => result.decision === "unknown").length,
    },
  };
}
