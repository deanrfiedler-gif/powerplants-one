import type { DocumentKey } from "../adapters/contracts";
export type SourceInput =
  | { kind: "SyntheticText"; text: string }
  | { kind: "JobPackIssue" | "ReportIssue"; issue_id: string };
export type Source = {
  kind: SourceInput["kind"];
  issue_id: string | null;
  author_id: string;
  content_hash: string;
  byte_count: number;
  content_type: string;
  store_key: DocumentKey | null;
  envelope_hash: string | null;
  operation_id: string;
  command_hash: string;
};
export type DocumentRow = {
  id: string;
  workspace_id: string;
  company_id: string;
  organisation_id: string;
  site_id: string | null;
  display_number: string;
  version: number;
  current_revision_id: string;
  state: "Current" | "Withdrawn";
  created_by: string;
  created_at: Date;
  updated_by: string;
  updated_at: Date;
};
export type Revision = {
  id: string;
  workspace_id: string;
  document_id: string;
  revision: number;
  title: string;
  document_type: string;
  applicability: string;
  audience: string;
  owner_id: string;
  source: Source;
  created_by: string;
  created_at: Date;
  reason: string;
  document_version: number;
};
export type Duty = "document.read" | "document.register" | "document.review";
export const targetKinds = [
  "Organisation",
  "Site",
  "Asset",
  "Project",
  "WorkOrder",
  "EngineeringPackage",
] as const;
export type TargetKind = (typeof targetKinds)[number];
