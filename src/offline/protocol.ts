// Browser/server wire contract. No platform, database or Node imports.
export type Owner = {
  actor_id: string;
  workspace_id: string;
  display_name: string;
};
export type Authority = {
  assignment_id: string;
  assignment_version: number;
  schedule_version: number;
  scope_revision_id: string;
  scope_version: number;
  scope_hash: string;
  issue_id: string;
  issue_hash: string;
};
export const commands = [
  "Start",
  "Acknowledge",
  "Capture",
  "Correct",
  "AttachmentInitiate",
  "AttachmentUpload",
  "AttachmentFinalise",
  "CompletionDraft",
  "SubmitCompletion",
  "CustomerResponse",
  "Timer",
  "FieldReadiness",
] as const;
export type Command = (typeof commands)[number];
export type Original = {
  schema_version: number;
  operation_id: string;
  actor_id: string;
  workspace_id: string;
  appointment_id: string;
  command: Command;
  target_id: string | null;
  authority: Authority;
  depends_on: string[];
  supersedes_operation_id: string | null;
  payload: Record<string, unknown>;
};
export type WireOperation = Original & { payload_hash: string };
export type Receipt = {
  operation_id: string;
  receipt_id: string;
  record_id: string;
  record_version: number;
  state: string;
  accepted_at: string;
  warnings: string[];
  task_ids: string[];
};
export type Outcome = {
  operation_id: string;
  state: "ServerSaved" | "Conflict" | "ReviewRequired" | "Failed" | "Pending";
  receipt?: Receipt;
  code?: string;
  message?: string;
  retryable?: boolean;
};
// Keys sort by English collation, named explicitly rather than taken from the runtime default
// locale: a browser or server in another locale (Estonian puts "zone" before "type") would
// otherwise hash identical content differently. English is the order existing hashes were
// made in; plain code-unit order would change stored hashes for keys that mix case.
const keyOrder = new Intl.Collator("en").compare;
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => keyOrder(a, b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function sha256(value: string | Uint8Array): Promise<string> {
  const bytes =
    typeof value === "string"
      ? new TextEncoder().encode(value)
      : new Uint8Array(value);
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function original(wire: WireOperation): Original {
  const { payload_hash: _hash, ...value } = wire;
  void _hash;
  return value;
}
export const ownerKey = (p: Owner) => `${p.workspace_id}:${p.actor_id}`;
