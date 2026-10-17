// Boundaries only. Provider/company/entity/external keys remain exact and separate from PPO UUIDs.
export type ExternalKey = {
  provider: "Synthetic" | "MYOB";
  erp_connection_id: string;
  erp_company_id: string;
  entity_type: string;
  external_id: string;
};
export type AdapterContext = {
  workspace_id: string;
  actor_id: string;
  operation_id: string;
};
export type Observation = {
  key: ExternalKey;
  observed_at: string;
  source_as_at: string | null;
  completeness: "Complete" | "Partial" | "Unknown";
  synthetic: true;
  data: Readonly<Record<string, unknown>>;
};
export interface ErpReadAdapter {
  read(context: AdapterContext, key: ExternalKey): Promise<Observation>;
}
export type CommandOutcome = {
  outcome: "NotProcessed" | "Unknown";
  synthetic: true;
  reason: string;
};
export interface ErpCommandAdapter {
  execute(
    context: AdapterContext,
    key: ExternalKey,
    command: Readonly<Record<string, unknown>>,
  ): Promise<CommandOutcome>;
}
export type DocumentKey = {
  provider: "Synthetic" | "SharePoint";
  tenant_id: string | null;
  site_id: string | null;
  drive_id: string | null;
  item_id: string;
  version_id: string;
  sha256: string;
};
export interface DocumentStoreAdapter {
  read(context: AdapterContext, key: DocumentKey): Promise<Uint8Array>;
  store(
    context: AdapterContext,
    content: Uint8Array,
    sha256: string,
  ): Promise<DocumentKey>;
}
export interface DistributionAdapter {
  prepare(
    context: AdapterContext,
    document: DocumentKey,
    recipient_ref: string,
  ): Promise<{ state: "Prepared"; synthetic: true; delivered: false }>;
}
// ADR-0058: the provider-neutral customer email channel. Synthetic is the only implementation;
// Microsoft Graph (S4) and any successor provider replace the adapter, never the message states.
export type OutboundCustomerMessage = {
  workspace_id: string;
  // PPO's message identifier, carried to the provider so its copy can be found before any retry.
  communication_id: string;
  to: { name: string; address: string };
  subject: string;
  body: string;
  content_hash: string;
};
export type ChannelSubmission =
  | { outcome: "Submitted"; provider_message_id: string }
  | { outcome: "Failed"; error_code: string; detail: string };
// What the provider shows for one message: its sent copy, any non-delivery report and any
// positive delivery evidence. Absence of evidence is never delivery.
export type ChannelObservation =
  | { found: false }
  | {
      found: true;
      provider_message_id: string;
      sent: true;
      failed: { detail: string } | null;
      delivered: boolean;
    };
export class ChannelOutcomeUnknown extends Error {}
export interface CustomerMessageChannel {
  readonly name: "Synthetic";
  // Throws ChannelOutcomeUnknown when the hand-over's result cannot be known.
  submit(message: OutboundCustomerMessage): Promise<ChannelSubmission>;
  observe(workspace_id: string, communication_id: string): Promise<ChannelObservation>;
}
