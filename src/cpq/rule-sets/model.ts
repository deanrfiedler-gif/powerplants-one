// Configuration rule sets (ADR-0066), definition schema 5.
// A rule set is data: formulas are parsed by the restricted language in language.ts and never executed as code.

export type ValueType = "Number" | "Text" | "YesNo";

export type RuleSetInput = {
  key: string;
  label: string;
  question: string;
  unit: string;
  type: "Number" | "WholeNumber" | "YesNo" | "Choice";
  choices: string[];
  minimum: string | null;
  maximum: string | null;
  default: string | null;
  required: boolean;
  asked_when: string | null;
};

export type RuleSetDerived = {
  key: string;
  label: string;
  unit: string;
  formula: string;
};

export type RuleSetTable = {
  key: string;
  label: string;
  source: string;
  columns: { key: string; type: "Number" | "Text" }[];
  keys: { column: string; match: "Exact" | "AtLeast" | "AtMost" }[];
  rows: Record<string, string>[];
};

export type Ordering =
  | { kind: "AsCalculated" }
  | { kind: "Whole" }
  | { kind: "StockLength"; length: string }
  | { kind: "Pack"; size: string };

export type RuleSetPart = {
  key: string;
  description: string;
  unit: string;
  group: string;
  ordering: Ordering;
  install_minutes: string;
};

export type RuleSetRule = {
  key: string;
  description: string;
  phase: "Materials" | "Labour";
  when: string;
  part: string | null;
  choose: string | null;
  quantity: string;
  unit: string | null;
};

export type ExpectedLines = {
  lines: { part: string; quantity: string }[];
  values: Record<string, string>;
};

export type ReferenceCase = {
  key: string;
  label: string;
  source: string;
  inputs: Record<string, string>;
  expected: ExpectedLines | { stop: string };
};

export type RuleSetDefinition = {
  schema_version: 5;
  kind: "RuleSet";
  key: string;
  label: string;
  family: string;
  inputs: RuleSetInput[];
  derived: RuleSetDerived[];
  tables: RuleSetTable[];
  parts: RuleSetPart[];
  rules: RuleSetRule[];
  reference_cases: ReferenceCase[];
  passes: { key: string; value: string }[];
};

export const LIMITS = Object.freeze({
  bytes: 524_288,
  inputs: 100,
  derived: 100,
  tables: 50,
  columns: 20,
  rows: 2_000,
  parts: 1_000,
  rules: 500,
  cases: 200,
  passes: 50,
  choices: 100,
  text: 300,
  formulaCharacters: 2_048,
  formulaTokens: 256,
  formulaDepth: 32,
  evaluationSteps: 200_000,
  /** Shared by every case in one test or job, so a large rule set stops cleanly inside the worker's time limit. */
  totalSteps: 2_000_000,
  jobSteps: 20,
  /**
   * A whole request to the worker, measured as JSON before it is copied in: room for a full job of the
   * largest rule sets, and far below the worker's memory, which does not cover the copy itself.
   */
  requestCharacters: 12_582_912,
});

/** Words the formula language uses, which cannot name an input, derived value or table. */
export const RESERVED = new Set(["true", "false", "and", "or", "not", "if", "ceil", "floor", "round", "min", "max", "lookup", "qty", "minutes"]);

export const KEY = /^[a-z][a-z0-9_]{0,47}$/;
export const PART_KEY = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
export const DECIMAL = /^-?\d{1,18}(?:\.\d{1,12})?$/;

/** Shortens a name echoed in a message or path, so an oversized untrusted key cannot make an oversized result. */
export const brief = (s: string) => (s.length > 64 ? `${s.slice(0, 64)}…` : s);

/** What a case used, kept when it stops as well as when it finishes, so coverage never guesses. */
export type Trace = {
  inputs: { key: string; value: string; asked: boolean; from: "Given" | "Default" }[];
  applied: string[];
  rows_read: { table: string; row: number }[];
  /** The part each applied rule gave, including a rule whose quantity was zero. */
  chosen: { rule: string; part: string }[];
};

/** Why a case could not be worked out, with a reason an engineer can act on. */
export class RuleSetStop extends Error {
  /** What the case had used when it stopped; absent when it stopped before running (a job-level stop). */
  trace?: Trace;
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "RuleSetStop";
  }
}

export type Issue = { path: string; code: string; message: string };

/** The rule set could not be saved: every problem found, each with a path and a code. */
export class RuleSetInvalid extends Error {
  constructor(readonly issues: Issue[]) {
    super(issues.map((i) => `${i.path}: ${i.message}`).join("; "));
    this.name = "RuleSetInvalid";
  }
}
