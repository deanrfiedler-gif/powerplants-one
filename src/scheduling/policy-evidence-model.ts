import type { OperationReceipt } from "../platform/operations";
import type {
  PolicyProposal,
  PolicyReview,
} from "./policy-publication-contracts";
import type { PolicyHold } from "./policy-holds";
import type { PolicyContent } from "./policy-chain";
import type { loadPolicyPopulation } from "./policy-population";
export type PolicyEvidence = {
  proposal: PolicyProposal;
  successor_proposal_id: string | null;
  latest_review_id: string | null;
  publication_id: string | null;
  review?: PolicyReview;
  candidate_labels?: {
    appointment_id: string;
    reference: string;
    site_name: string;
    owner_name: string;
  }[];
  context?: {
    content_hash: string;
    exclusions: Awaited<ReturnType<typeof loadPolicyPopulation>>["exclusions"];
    selected_policy: PolicyContent;
  };
  selected_policy?: { id: string; version: number; content_hash: string };
  publication?: {
    id: string;
    version: number;
    created_at: string;
    created_by: string;
    policy_id: string;
    policy_hash: string;
    head_version: number;
    receipt_id: string;
  };
  impacts?: (PolicyHold & {
    id: string;
    appointment_id: string;
    activity_id: string;
  })[];
  receipt?: OperationReceipt | null;
};
