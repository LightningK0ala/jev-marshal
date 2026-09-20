export type Decision =
  | "compliant"
  | "non_compliant"
  | "not_applicable"
  | "unknown";

export type Level = "warning" | "error";

export interface Rule {
  id: string;
  question: string;
  level: Level;
  message: string;
  threshold?: number;
}

export interface Config {
  version: 1;
  model: string;
  base?: string;
  threshold: number;
  maxPatchChars: number;
  rules: Rule[];
}

export interface ChangedFile {
  status: string;
  path: string;
  previousPath?: string;
}

export interface ChangePacket {
  kind: "pull_request_change";
  repository?: string;
  title?: string;
  description?: string;
  comparison: string;
  changedFiles: ChangedFile[];
  patch: string;
  patchComplete: boolean;
}

export interface ChoiceAnswer {
  type: "choice";
  choice: Decision;
  confidence: number;
  probabilities: Record<Decision, number>;
}

export interface RuleResult {
  id: string;
  level: Level;
  decision: Decision;
  confidence: number;
  probabilities: Record<Decision, number>;
  message: string;
  blocks: boolean;
}

export interface Report {
  model: string;
  comparison: string;
  changedFiles: number;
  patchComplete: boolean;
  results: RuleResult[];
  summary: {
    errors: number;
    warnings: number;
    unknown: number;
  };
}
