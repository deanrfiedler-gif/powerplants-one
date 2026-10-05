import type { DispositionBasis } from "../disposition/context";
import type { AllocationPosition } from "./position";
import type { allocationCommand, factCommand } from "../../supply/validation";
import type { OperationReceipt } from "../../platform/operations";
export type FollowupBasis = {
  policy: "SYN-ES07-03";
  conversion: DispositionBasis;
  position: AllocationPosition;
  disposition: { id: string; sequence: number; decision: string } | null;
};
export type FollowupEvent = {
  id: string;
  workspace_id: string;
  revision_id: string;
  execution_id: string;
  target_id: string;
  sequence: number;
  action: "Refer" | "Receive" | "Review" | "Apply";
  referral_id: string;
  predecessor_id: string | null;
  receiving_id: string | null;
  review_id: string | null;
  decision:
    | "Requested"
    | "Accepted"
    | "Returned"
    | "Held"
    | "Retain"
    | "Hold"
    | "AdjustAllocation"
    | "ReconcileReservationOutcome"
    | "CorrectReceipt";
  basis: FollowupBasis;
  basis_hash: string;
  review_hash: string | null;
  command:
    | ReturnType<typeof allocationCommand>
    | (ReturnType<typeof factCommand> & { record_id: string })
    | null;
  owner_id: string;
  due_date: string | null;
  date_needed: boolean;
  next_action: string;
  activity_id: string;
  reason: string;
  evidence: string;
  created_by: string;
  created_at: Date;
  operation_id: string;
  native_receipt: OperationReceipt | null;
  receipt_proposal_id: string | null;
  effect_receiving_ids: string[];
};
