import {
  object,
  uuid,
  optionalId,
  choice,
  invalid,
} from "../../shared/validation";
import { hashInput } from "../release/validation";
import { envelope, followupKeys } from "./validation";
export const materialRoles = [
  "Demand",
  "Project",
  "Task",
  "MaterialAction",
] as const;
export type MaterialRole =
  (typeof materialRoles)[number] | "Successor" | "ChainEnd" | "BranchSuccessor";
export function materialInput(
  id: string,
  action:
    "MaterialPropose" | "MaterialReceive" | "MaterialReview" | "MaterialApply",
  value: unknown,
) {
  const extra =
    action === "MaterialPropose"
      ? [
          "allocation_outcome_id",
          "demand_id",
          "impact_id",
          "task_id",
          "successor_task_id",
          "chain_end_task_id",
          "branch_successor_task_id",
          "predecessor_id",
        ]
      : action === "MaterialApply"
        ? ["review_id", "review_hash"]
        : [
            "proposal_id",
            "proposal_hash",
            "predecessor_id",
            "decision",
            ...(action === "MaterialReceive" ? ["role"] : []),
          ];
  const r = object(value, [
    ...followupKeys,
    "referral_id",
    "expected_material_sequence",
    ...extra,
  ]);
  if (
    !Number.isSafeInteger(r.expected_material_sequence) ||
    Number(r.expected_material_sequence) < 0
  )
    invalid(
      "expected_material_sequence",
      "Use the current material resolution sequence.",
    );
  if (r.chain_end_task_id !== undefined && r.successor_task_id === undefined)
    invalid(
      "chain_end_task_id",
      "Select the middle task before the third task.",
    );
  if (
    r.branch_successor_task_id !== undefined &&
    (r.successor_task_id === undefined || r.chain_end_task_id !== undefined)
  )
    invalid(
      "branch_successor_task_id",
      "Select B and C as direct successors of A; a branch cannot also be a linear chain.",
    );
  return {
    ...envelope(id, r),
    action,
    referral_id: uuid(r.referral_id, "referral_id"),
    expected_material_sequence: Number(r.expected_material_sequence),
    predecessor_id:
      action === "MaterialApply"
        ? null
        : optionalId(r.predecessor_id, "predecessor_id"),
    allocation_outcome_id:
      action === "MaterialPropose"
        ? uuid(r.allocation_outcome_id, "allocation_outcome_id")
        : null,
    demand_id:
      action === "MaterialPropose" ? uuid(r.demand_id, "demand_id") : null,
    impact_id:
      action === "MaterialPropose" ? uuid(r.impact_id, "impact_id") : null,
    task_id: action === "MaterialPropose" ? uuid(r.task_id, "task_id") : null,
    // Omission preserves the normalised input/hash of every earlier original.
    ...(action === "MaterialPropose" && r.successor_task_id !== undefined
      ? { successor_task_id: uuid(r.successor_task_id, "successor_task_id") }
      : {}),
    ...(action === "MaterialPropose" && r.chain_end_task_id !== undefined
      ? { chain_end_task_id: uuid(r.chain_end_task_id, "chain_end_task_id") }
      : {}),
    ...(action === "MaterialPropose" && r.branch_successor_task_id !== undefined
      ? {
          branch_successor_task_id: uuid(
            r.branch_successor_task_id,
            "branch_successor_task_id",
          ),
        }
      : {}),
    proposal_id: ["MaterialReceive", "MaterialReview"].includes(action)
      ? uuid(r.proposal_id, "proposal_id")
      : null,
    proposal_hash: ["MaterialReceive", "MaterialReview"].includes(action)
      ? hashInput(r.proposal_hash, "proposal_hash")
      : null,
    review_id:
      action === "MaterialApply" ? uuid(r.review_id, "review_id") : null,
    review_hash:
      action === "MaterialApply"
        ? hashInput(r.review_hash, "review_hash")
        : null,
    role:
      action === "MaterialReceive"
        ? choice(r.role, "role", [
            ...materialRoles,
            "Successor",
            "ChainEnd",
            "BranchSuccessor",
          ] as const)
        : null,
    decision:
      action === "MaterialReceive"
        ? choice(r.decision, "decision", [
            "Accepted",
            "Returned",
            "Held",
          ] as const)
        : action === "MaterialReview"
          ? choice(r.decision, "decision", [
              "WithdrawForecast",
              "Retain",
              "Hold",
            ] as const)
          : null,
  };
}
