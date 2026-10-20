// PPO-CONV-T2-SCOPE / PPO-CONV-T2B-DESIGN: server-only, bounded, read-only assistance.
export const agentName = "Carl";
export const agentLabel = `${agentName} · AI assistant`;
export const turnStates = ["Queued", "Answering", "Answered", "CannotAnswer", "Unavailable", "Failed", "Discarded"] as const;
export type TurnState = (typeof turnStates)[number];
export const turnReasons = [
  "FeatureOff", "BudgetSpent", "PriceMissing", "CreditExhausted", "ProviderUnavailable",
  "Declined", "NoEvidence", "InvalidCitation", "UnsafeOutput", "TurnLimit", "Timeout",
  "Interrupted", "AccessChanged", "ThreadResolved", "ActorLostAccess", "RateLimited",
  "MalformedOutput", "InternalError",
] as const;
export type TurnReason = (typeof turnReasons)[number];
export const turnLimits = Object.freeze({ calls: 6, input_tokens: 48_000, output_tokens: 8_000, ms: 60_000 });
export const envelopeLimits = Object.freeze({ opportunities: 10, activities: 20, tasks: 20, raid: 20, messages: 20 });
export const answerLimits = Object.freeze({ claims: 12, claim_chars: 500, gaps: 5, gap_chars: 300, body_chars: 4000 });
export const monthlyCeilingMicro = 30_000_000;
export type SourceType = "Opportunity" | "Organisation" | "Activity" | "Project" | "ProjectTask" | "ProjectRaid" | "AcceptanceStage";
export type AdapterLabel = "Simulated" | "Claude";
export type Usage = { input_tokens: number; output_tokens: number };
export type UntrustedText = { text: string; untrusted: true };
export type EvidenceValue = string | number | boolean | null | EvidenceValue[] | { [key: string]: EvidenceValue };
export type EvidenceItem = {
  source_id: string;
  type: SourceType;
  record_id: string;
  source_version: string;
  retrieved_at: string;
  route: string;
  fields: Record<string, EvidenceValue>;
  untrusted_fields: string[];
};
export type Coverage = { returned: number; limit: number; more: boolean };
export type EvidenceEnvelope = {
  anchor_type: "Opportunity" | "Project";
  readers: string[];
  question: UntrustedText;
  messages: UntrustedText[];
  items: EvidenceItem[];
  coverage: Partial<Record<keyof typeof envelopeLimits | "acceptance_stages", Coverage>>;
  left_out: number;
};
// Internal record IDs, routes and reader identities never cross the adapter boundary.
export type AdapterRequest = {
  question: UntrustedText;
  envelope: Pick<EvidenceEnvelope, "anchor_type" | "messages" | "coverage" | "left_out"> & {
    items: Pick<EvidenceItem, "source_id" | "fields" | "untrusted_fields">[];
  };
  allowance: Usage;
};
export type CheckedClaim = { text: string; source_ids: string[] };
export type AdapterResult =
  | { kind: "Answer"; claims: CheckedClaim[]; gaps: string[]; usage: Usage }
  | { kind: "Decline"; usage: Usage };
export type StoredClaim = { ordinal: number; kind: "Fact" | "Gap"; text: string; source_numbers: number[] };
export type StoredSource = {
  number: number; type: SourceType; record_id: string; source_version: string; retrieved_at: string;
};
export class AdapterError extends Error {
  constructor(
    readonly code: "Unavailable" | "CreditExhausted" | "RateLimited" | "MalformedOutput" | "Timeout",
    readonly usage: Usage | null = null,
    readonly sent = false,
  ) {
    // Fixed codes only: provider text, questions and evidence do not belong in error logs.
    super(code);
    this.name = "AdapterError";
  }
}
export interface AssistantAdapter {
  readonly label: AdapterLabel;
  readonly model: string;
  answer(request: AdapterRequest, signal: AbortSignal): Promise<AdapterResult>;
}
export const requestTokens = (request: Pick<AdapterRequest, "question" | "envelope">) =>
  Math.ceil(JSON.stringify({ question: request.question, envelope: request.envelope }).length / 4);
