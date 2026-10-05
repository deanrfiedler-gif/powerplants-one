import {
  object,
  uuid,
  optionalId,
  choice,
  instant,
  label,
} from "../../shared/validation";
import { fields } from "../../supply/validation";
import { factSpecs, completeness } from "../../supply/model";
import { hashInput } from "../release/validation";
import { envelope, followupKeys } from "./validation";
export function receiptProposalInput(id: string, value: unknown) {
  const r = object(value, [
    ...followupKeys,
    "referral_id",
    "receiving_id",
    "predecessor_id",
    "dependency_id",
    "data",
    "completeness",
    "observed_at",
    "fact_evidence",
  ]);
  return {
    ...envelope(id, r),
    action: "ReceiptPropose" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    receiving_id: uuid(r.receiving_id, "receiving_id"),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    dependency_id: uuid(r.dependency_id, "dependency_id"),
    data: fields(r.data, factSpecs.Receipt.fields),
    completeness: choice(r.completeness, "completeness", completeness),
    observed_at: instant(r.observed_at, "observed_at"),
    fact_evidence: label(r.fact_evidence, "fact_evidence", 1000),
  };
}
export function receiptReceivingInput(id: string, value: unknown) {
  const r = object(value, [
    ...followupKeys,
    "referral_id",
    "proposal_id",
    "proposal_hash",
    "predecessor_id",
    "demand_id",
    "decision",
  ]);
  return {
    ...envelope(id, r),
    action: "ReceiptReceive" as const,
    referral_id: uuid(r.referral_id, "referral_id"),
    proposal_id: uuid(r.proposal_id, "proposal_id"),
    proposal_hash: hashInput(r.proposal_hash, "proposal_hash"),
    predecessor_id: optionalId(r.predecessor_id, "predecessor_id"),
    demand_id: uuid(r.demand_id, "demand_id"),
    decision: choice(r.decision, "decision", ["Accepted", "Returned", "Held"]),
  };
}
