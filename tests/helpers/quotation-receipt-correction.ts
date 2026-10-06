import type { FollowupDetail } from "../../src/estimating/supply-followup/context";
import {
  allocatedFixture,
  referral,
  acknowledgement,
  currentFollowup,
  followupEnvelope,
  supplyReview,
} from "./quotation-supply-followup";
import {
  referSupply,
  receiveSupply,
} from "../../src/estimating/supply-followup/service";
import {
  proposeReceipt,
  receiveReceiptEffect,
} from "../../src/estimating/supply-followup/receipt-service";
export function receiptProposal(t: FollowupDetail, usable = "4.375001") {
  const c = t.receipt_correction.candidates[0];
  return {
    ...followupEnvelope(t),
    referral_id: t.referral!.id,
    receiving_id: t.receiving!.id,
    predecessor_id: t.receipt_correction.proposal?.id ?? null,
    dependency_id: c.fact.id,
    data: {
      ...c.fact.data,
      usable,
      quarantined: "5",
      damaged: "1",
      inspection: "SYN corrected inspection finding",
    },
    completeness: "Complete",
    observed_at: "2026-10-05T00:00:00.000Z",
    fact_evidence: "SYN exact receipt inspection correction",
  };
}
export function receiptReceiving(
  t: FollowupDetail,
  demandId: string,
  decision = "Accepted",
) {
  const s = t.receipt_correction;
  return {
    ...followupEnvelope(t),
    referral_id: t.referral!.id,
    proposal_id: s.proposal!.id,
    proposal_hash: s.proposal!.proposal_hash,
    predecessor_id:
      s.required.find((x) => x.demand.id === demandId)?.decision?.id ?? null,
    demand_id: demandId,
    decision,
  };
}
export const receiptReview = (t: FollowupDetail) => ({
  ...supplyReview(t, "CorrectReceipt"),
  receipt_proposal_id: t.receipt_correction.proposal!.id,
});
export async function receiptFixture(kind: "Stock" | "Shipment" = "Shipment") {
  const f = await allocatedFixture(true, kind);
  if (kind === "Stock") {
    const { recordFact } = await import("../../src/supply/commands");
    const { workspace } = await import("../../src/supply/reads");
    const { supplyFact } = await import("./supply");
    await recordFact(
      f.owner,
      f.supply.id,
      supplyFact(
        "Receipt",
        (await workspace(f.owner, f.supply.id)).record.version,
        { received: "10", inspected: "10", usable: "10" },
      ),
    );
  }
  await referSupply(f.owner, f.id, referral(await currentFollowup(f)));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  return { ...f, t: await currentFollowup(f) };
}
export async function proposedReceiptFixture() {
  const f = await receiptFixture();
  const proposal = receiptProposal(f.t),
    saved = await proposeReceipt(f.owner, f.id, proposal);
  return { ...f, proposal, saved, t: await currentFollowup(f) };
}
export async function receiveAll(
  f: Awaited<ReturnType<typeof receiptFixture>>,
) {
  const ids = (await currentFollowup(f)).receipt_correction.required.map(
    (x) => x.demand.id,
  );
  for (const id of ids)
    await receiveReceiptEffect(
      f.owner,
      f.id,
      receiptReceiving(await currentFollowup(f), id),
    );
  return currentFollowup(f);
}
