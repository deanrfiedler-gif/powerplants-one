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
