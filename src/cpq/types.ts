import type { CostLine } from "../estimating/math";

export type Scalar = string | boolean | null;
export type Fact = {
  key: string;
  label: string;
  type: "Decimal" | "Boolean" | "Choice";
  unit: string;
  required: boolean;
  choices: string[];
};
export type Condition =
  | { op: "ALL" | "ANY"; items: Condition[] }
  | { op: "NOT"; item: Condition }
  | {
      op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE";
      fact: string;
      value: string | boolean;
    };
export type Part = {
  key: string;
  description: string;
  category: CostLine["category"];
  unit: string;
  resolver: "SUM" | "MAX" | "UNIQUE" | "PRIORITY";
  source: string;
  effective_from: string;
  effective_to: string;
  tiers: { minimum: string; unit_cost: string; unit_sell: string }[];
};
export type Rule = {
  key: string;
  description: string;
  phase: "Materials" | "Labour";
  when: Condition;
  part: string;
  quantity: string;
  priority: number;
};
export type Constraint = {
  key: string;
  when: Condition;
  require: Condition;
  message: string;
};
export type Instance = {
  id: string;
  label: string;
  facts: Record<string, Scalar>;
};
export type Override = {
  target: string;
  basis_hash: string;
  kind: "Quantity" | "SellPrice" | "Suppress";
  value: string | null;
  reason: string;
};
export type CalculationInput = {
  pricing_date: string;
  instances: Instance[];
  overrides: Override[];
};
export type Fixture = {
  name: string;
  input: CalculationInput;
  expected: {
    ready: boolean;
    cost: string | null;
    sell: string | null;
    diagnostic_codes: string[];
  };
};
export type Definition = {
  schema_version: 1;
  label: string;
  currency: "AUD";
  facts: Fact[];
  parts: Part[];
  rules: Rule[];
  constraints: Constraint[];
  fixtures: Fixture[];
};
export type Diagnostic = {
  code: string;
  message: string;
  instance_id: string | null;
  target: string | null;
};
export type Contribution = {
  rule: string;
  quantity: string;
  exact: { numerator: string; denominator: string };
  priority: number;
  formula: string;
  facts: Record<string, string>;
};
export type ResultLine = {
  target: string;
  basis_hash: string;
  line: CostLine;
  contributions: Contribution[];
  overrides: Override[];
};
export type Calculation = {
  engine: "PPO-CPQ-1";
  ready: boolean;
  lines: ResultLine[];
  diagnostics: Diagnostic[];
  totals: ReturnType<typeof import("../estimating/math").calculate>;
  input_hash: string;
  definition_hash: string;
  result_hash: string;
};
