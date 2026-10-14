import type { CostLine } from "../estimating/math";

export type Scalar = string | boolean | null;
export type Fact = {
  key: string;
  label: string;
  type: "Decimal" | "Integer" | "Boolean" | "Choice" | "Text";
  unit: string;
  required: boolean;
  choices: string[];
  description?: string;
  scope?: "System" | "Global" | "Shared";
  source?: string;
  minimum?: string | null;
  maximum?: string | null;
  binding?: { question_id: string } | null;
};
export type Condition =
  | { op: "ALWAYS" }
  | { op: "IN"; fact: string; values: (string | boolean)[] }
  | { op: "KNOWN" | "NOT_APPLICABLE"; fact: string }
  | { op: "ALL" | "ANY"; items: Condition[] }
  | { op: "NOT"; item: Condition }
  | {
      op: "EQ" | "NE" | "GT" | "GTE" | "LT" | "LTE";
      fact: string;
      value: string | boolean;
    };
export type Part = {
  product?: ProductReference;
  scope?: {
    kind: "System" | "Shared" | "Configuration";
    group_fact: string | null;
  };
  key: string;
  description: string;
  category: CostLine["category"];
  unit: string;
  resolver: "SUM" | "MAX" | "UNIQUE" | "PRIORITY";
  source: string;
  effective_from: string;
  effective_to: string;
  tiers: {
    minimum: string;
    unit_cost: string;
    unit_sell: string;
    source_unit_cost?: string;
  }[];
  price_context?: {
    book: string;
    policy: string;
    source_currency: string;
    currency_per_aud: string;
    recorded_at: string;
  };
};
export type ProductReference = {
  product_id: string;
  revision_id: string;
  content_hash: string;
  relationships: { id: string; content_hash: string; review_id: string }[];
};
export type ProductSnapshot = ProductReference & {
  part_key: string;
  reference: string;
  provider: string;
  entity_key: string;
  parent_id: string;
  revision: number;
  content: import("../products/model").Content;
  publication: {
    id: string;
    details: {
      purpose: string;
      audience: string;
      effective_on: string;
      supersedes_id: string | null;
      reason: string;
    };
    created_by: string;
    created_at: string;
  };
  availability: "Unknown";
  supplier_lead_time: "Unknown";
  compatibility: "NotAssessed" | "ConditionalEvidence";
  relationship_evidence: {
    id: string;
    content_hash: string;
    from_revision_id: string;
    to_revision_id: string;
    content: import("../products/model").RelationshipContent;
    review: {
      id: string;
      outcome: string;
      reason: string;
      created_by: string;
      created_at: string;
    };
  }[];
};
export type Rule = {
  key: string;
  description: string;
  phase: "Materials" | "Labour";
  when: Condition;
  part: string;
  quantity: string;
  priority: number;
  parameters?: { key: string; label: string; value: string; unit: string }[];
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
  not_applicable?: string[];
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
  pricing?: { mode: "Margin" | "Markup"; percent: string } | null;
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
  schema_version: 1 | 2 | 3;
  label: string;
  currency: "AUD";
  facts: Fact[];
  parts: Part[];
  rules: Rule[];
  constraints: Constraint[];
  fixtures: Fixture[];
  design?: DesignContract;
};
export type DesignContract = {
  milestones?: {
    key: string;
    label: string;
    when: Condition;
    anchor: string;
    offset_days: number;
    calendar: "BusinessDays" | "CalendarDays";
  }[];
  option_sets: {
    key: string;
    label: string;
    fact: string;
    options: {
      value: string;
      label: string;
      available_when: Condition;
      reason: string;
    }[];
  }[];
  structure: {
    key: string;
    label: string;
    parent: string | null;
    option_sets: string[];
  }[];
  shared_capacity: {
    key: string;
    label: string;
    group_fact: string;
    demand_fact: string;
    capacity_fact: string;
    message: string;
  }[];
  decision_tables: {
    key: string;
    label: string;
    hit_policy: "UNIQUE" | "PRIORITY";
    required: boolean;
    columns: string[];
    rows: { key: string; when: Condition; rules: string[]; priority: number }[];
  }[];
  pricing: {
    mode: "Catalog" | "Margin" | "Markup";
    percent: string;
    allow_override: boolean;
  };
};
export type ConditionEvidence = {
  condition: Condition;
  result: boolean | null;
  actual?: Scalar;
  children?: ConditionEvidence[];
};
export type RuleTrace = {
  instance_id: string;
  rule: string;
  condition: ConditionEvidence;
  outcome:
    | "Applied"
    | "NotApplicable"
    | "Unknown"
    | "Zero"
    | "Error"
    | "TableExcluded";
  error?: string;
};
export type LineDetail = {
  target: string;
  instance_id: string;
  part: string;
  description: string;
  unit: string;
  resolver: Part["resolver"];
  contributions: Contribution[];
  selected_rules: string[];
  basis_hash: string;
  base_quantity: string | null;
  effective_quantity: string | null;
  state: "Ready" | "Excluded" | "Conflict" | "Incomplete" | "NeedsReview";
  overrides: Override[];
  source: string;
  effective_from: string;
  effective_to: string;
  price_tier: Part["tiers"][number] | null;
  unit_sell: string | null;
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
  engine: "PPO-CPQ-1" | "PPO-CPQ-3";
  ready: boolean;
  lines: ResultLine[];
  diagnostics: Diagnostic[];
  totals: ReturnType<typeof import("../estimating/math").calculate>;
  input_hash: string;
  definition_hash: string;
  result_hash: string;
  explanation?: {
    instances: {
      id: string;
      label: string;
      kind: "System" | "Shared" | "Configuration";
    }[];
    rules: RuleTrace[];
    lines: LineDetail[];
    options: {
      instance_id: string;
      set: string;
      value: string;
      available: boolean | null;
      reason: string;
    }[];
    capacity: {
      key: string;
      group: string;
      demand: string | null;
      capacity: string | null;
      state: "Ready" | "Exceeded" | "Unknown";
    }[];
    tables: {
      key: string;
      instance_id: string;
      matches: string[];
      selected: string[];
      state: "Matched" | "Gap" | "Conflict" | "Unknown";
    }[];
    pricing: {
      mode: "Catalog" | "Margin" | "Markup";
      percent: string;
      source: "Release" | "Configuration";
    };
    milestones: {
      key: string;
      instance_id: string;
      label: string;
      anchor: string;
      offset_days: number;
      calendar: "BusinessDays" | "CalendarDays";
      date: null;
      state: "Proposed" | "Unknown";
    }[];
    readiness: {
      configuration: "Complete" | "NeedsAttention";
      price: "Complete" | "Indicative" | "RequiresApproval";
      adoption: "Ready" | "Blocked";
    };
  };
};
