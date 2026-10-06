import { object, uuid, optionalId, invalid } from "../../shared/validation";
import { exactQuantity } from "../../supply/validation";
import { envelope, followupKeys } from "./validation";
import { receiptReceivingInput } from "./receipt-input";
export function shortfallProposalInput(id: string, value: unknown) {
  const r = object(value, [
    ...followupKeys,
    "referral_id",
    "receiving_id",
    "predecessor_id",
    "correction_id",
    "reductions",
  ]);
  if (
    !Array.isArray(r.reductions) ||
    !r.reductions.length ||
    r.reductions.length > 100
  )
    invalid("reductions", "Select 1–100 existing allocations to reduce.");
  const reductions = r.reductions
    .map((value) => {
      const x = object(value, ["allocation_id", "quantity"]);
      return {
        allocation_id: uuid(x.allocation_id, "allocation_id"),
        quantity: exactQuantity(x.quantity, "quantity"),
      };
    })
    .sort((a, b) => a.allocation_id.localeCompare(b.allocation_id));
  if (
    new Set(reductions.map((x) => x.allocation_id)).size !== reductions.length
  )
    invalid("reductions", "Name each allocation once.");
  return {
    ...envelope(id, r),
    action: "ShortfallPropose" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    receiving_id: uuid(r.receiving_id, "receiving_id"),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    correction_id: uuid(r.correction_id, "correction_id"),
    reductions,
  };
}
export function shortfallReceivingInput(id: string, value: unknown) {
  return {
    ...receiptReceivingInput(id, value),
    action: "ShortfallReceive" as const,
  };
}
