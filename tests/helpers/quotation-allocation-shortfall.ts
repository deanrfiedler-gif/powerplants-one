import type { FollowupDetail } from "../../src/estimating/supply-followup/context";
import {
  applySupply,
  reviewSupply,
} from "../../src/estimating/supply-followup/service";
import { proposeReceipt } from "../../src/estimating/supply-followup/receipt-service";
import { receiveAllocationEffect } from "../../src/estimating/supply-followup/shortfall-service";
import {
  receiptFixture,
  receiptProposal,
  receiveAll,
  receiptReview,
} from "./quotation-receipt-correction";
import {
  currentFollowup,
  followupEnvelope,
  supplyReview,
  supplyApply,
} from "./quotation-supply-followup";
export function shortfallProposal(t: FollowupDetail, multi = true) {
  const c = t.allocation_shortfall.candidates[0];
  return {
    ...followupEnvelope(t),
    referral_id: t.referral!.id,
    receiving_id: t.receiving!.id,
    predecessor_id: t.allocation_shortfall.proposal?.id ?? null,
    correction_id: c.correction.id,
    reductions: c.group.allocations
      .filter(
        (a) => a.basis === "Usable" && (multi || a.demand_id !== t.target_id),
      )
      .map((a) => ({
        allocation_id: a.id,
        quantity: a.demand_id === t.target_id ? "0" : "4.375001",
      })),
  };
}
export function shortfallReceiving(
  t: FollowupDetail,
  demand: string,
  decision = "Accepted",
) {
  const s = t.allocation_shortfall;
  return {
    ...followupEnvelope(t),
    referral_id: t.referral!.id,
    proposal_id: s.proposal!.id,
    proposal_hash: s.proposal!.proposal_hash,
    predecessor_id:
      s.required.find((r) => r.demand.id === demand)?.decision?.id ?? null,
    demand_id: demand,
    decision,
  };
}
export const shortfallReview = (t: FollowupDetail) => ({
  ...supplyReview(t, "ReduceAllocations"),
  allocation_proposal_id: t.allocation_shortfall.proposal!.id,
});
export async function shortfallFixture(usable = "4.375001", beforeCorrection?: (f: Awaited<ReturnType<typeof receiptFixture>>) => Promise<void>) {
  const f = await receiptFixture();
  await beforeCorrection?.(f);
  await proposeReceipt(f.owner, f.id, receiptProposal(await currentFollowup(f), usable));
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  return { ...f, t: await currentFollowup(f) };
}
export async function receiveAllAllocations(f: {
  owner: Parameters<typeof currentFollowup>[0]["owner"];
  id: string;
}) {
  for (const r of (await currentFollowup(f)).allocation_shortfall.required)
    await receiveAllocationEffect(
      f.owner,
      f.id,
      shortfallReceiving(await currentFollowup(f), r.demand.id),
    );
  return currentFollowup(f);
}
