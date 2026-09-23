import type { SectionView } from "../../section-readers";
// The pack read as the Job Pack page consumes it. Type-only imports are erased; no server module reaches the client.
import type { PackInput } from "../../validation";
import type { PackSnapshot } from "../../render";
import type { BasisDrift, PackBasis, PackCriterion } from "../../pack-view";

export type PackSource = {
  id: string;
  title: string;
  available: boolean;
  content_hash: string;
  version_id: string;
};
export type PackHistory = { id: string; kind: string; summary: string };
export type PackRevision = {
  id: string;
  revision: number;
  input: PackInput;
  snapshot: PackSnapshot;
  content_hash: string;
  change_reason: string;
  created_at: string;
  created_by_name: string | null;
};
export type PackIssue = {
  id: string;
  revision: number;
  revision_id: string;
  issued_at: string;
  issued_by_name: string | null;
  output_hash: string;
  manifest: {
    filename: string;
    pdf_bytes: number;
    pdf_hash: string;
    html_hash: string;
    renderer_version: string;
    browser_version: string;
  };
};
export type PackRecipient = {
  id: string;
  user_id: string;
  display_name: string;
  assignment_id: string;
  assignment_version: number;
  acknowledged_at: string | null;
};
export type Pack = {
  section_view?: SectionView | null;
  id: string;
  display_number: string;
  appointment_id: string;
  appointment_reference?: string;
  version: number;
  status: string;
  needs_review: boolean;
  current_issue_id: string | null;
  current_revision_id: string | null;
  revisions: PackRevision[];
  issues: PackIssue[];
  checks: {
    id: string;
    revision_id: string;
    decision: string;
    reason: string;
    checked_at: string;
    actor_name: string | null;
  }[];
  events: {
    id: string;
    issue_id: string;
    kind: string;
    reason: string;
    occurred_at: string;
    actor_name?: string | null;
  }[];
  jobs: {
    id: string;
    revision_id: string;
    state: string;
    attempts: number;
    error_code: string | null;
    requested_at: string;
    recovery_owner_id: string;
    issue_id: string | null;
    actor_name: string | null;
  }[];
  sources: PackSource[];
  history: PackHistory[];
  follow_ups: {
    activity_id: string;
    owner_id: string;
    status: string;
    summary: string;
  }[];
  distribution: {
    id: string;
    recipient_id: string;
    display_name: string;
    kind: string;
    occurred_at: string;
  }[];
  // Null means not provided to this identity, which is not the same as none.
  criteria: PackCriterion[] | null;
  readiness_policy: { key: string; version: number } | null;
  basis: PackBasis | null;
  current_basis: PackBasis | null;
  basis_drift: BasisDrift[] | null;
  readiness: {
    dispatch_hold: boolean;
    component_ready: boolean;
    actual_start_implemented: boolean;
    reasons: string[];
    recipients: PackRecipient[];
  };
  actions: {
    can_prepare: boolean;
    can_check: boolean;
    can_issue: boolean;
    can_acknowledge: boolean;
  };
};
