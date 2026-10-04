import { randomUUID } from "node:crypto";
import { crmBase } from "./crm";
import { completedFixture, nativeRevision } from "./quotation-disposition";
import { supplyInput } from "./supply";
import { saveRecord, allocate } from "../../src/supply/commands";
import { workspace } from "../../src/supply/reads";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  referSupply,
  receiveSupply,
  reviewSupply,
} from "../../src/estimating/supply-followup/service";
import type { FollowupDetail } from "../../src/estimating/supply-followup/context";
export const followupEnvelope = (t: FollowupDetail) => ({
  ...crmBase(),
  synthetic_only: true,
  target_id: t.target_id,
  execution_id: t.execution_id,
  expected_sequence: t.sequence,
  basis_hash: t.basis_hash,
  evidence:
    "SYN exact source, shared Supply position and dependencies reviewed",
});
export const referral = (
  t: FollowupDetail,
  owner = t.basis.conversion.target.owner_id,
) => ({
  ...followupEnvelope(t),
  predecessor_id: t.referral?.id ?? null,
  owner_id: owner,
  due_date: null,
  date_needed: true,
  next_action:
    "SYN review existing allocations and return exact evidence to ES-07",
});
export const acknowledgement = (t: FollowupDetail, decision = "Accepted") => ({
  ...followupEnvelope(t),
  referral_id: t.referral!.id,
  predecessor_id: t.receiving?.id ?? null,
  decision,
});
export const supplyReview = (
  t: FollowupDetail,
  decision = "Retain",
  quantity: string | null = null,
  allocationId: string | null = null,
) => ({
  ...followupEnvelope(t),
  referral_id: t.referral!.id,
  receiving_id: t.receiving!.id,
  predecessor_id: t.review?.id ?? null,
  decision,
  quantity,
  allocation_id:
    decision === "AdjustAllocation"
      ? (allocationId ?? t.basis.conversion.dependencies.allocations[0].id)
      : null,
});
export const supplyApply = (t: FollowupDetail) => ({
  ...followupEnvelope(t),
  referral_id: t.referral!.id,
  review_id: t.review!.id,
  review_hash: t.review!.review_hash,
});
export const currentFollowup = async (f: {
  owner: Parameters<typeof readConversion>[0];
  id: string;
}) => (await readConversion(f.owner, f.id)).followups[0];
export async function allocatedFixture(shared = true) {
  const f = await completedFixture(),
    t = f.d.dispositions[0],
    r = t.basis.target;
  await saveRecord(
    f.owner,
    nativeRevision(t, {
      data: {
        ...r.data,
        demand_class: "Approved",
        authority:
          "SYN pre-existing adopted Supply classification; no procurement authority",
      },
    }),
    true,
  );
  const supply = supplyInput("Supply", {
    item: r.item,
    unit: r.unit,
    owner_id: f.owner.actor_id,
  });
  await saveRecord(f.owner, supply);
  const other = supplyInput("Demand", {
    item: r.item,
    unit: r.unit,
    quantity: "8",
    site_id: "70000000-0000-4000-8000-000000000002",
    owner_id: f.owner.actor_id,
  });
  if (shared) await saveRecord(f.owner, other);
  const cmds = [];
  for (const [demand, amount] of [
    [r.id, "2"],
    ...(shared ? [[other.id, "8"]] : []),
  ]) {
    const d = (await workspace(f.owner, demand)).record,
      s = (await workspace(f.owner, supply.id)).record;
    const cmd = {
      ...crmBase(),
      id: randomUUID(),
      expected_version: null,
      demand_id: d.id,
      supply_id: s.id,
      demand_version: d.version,
      supply_version: s.version,
      quantity: amount,
      unit: r.unit,
      basis: "Usable",
    };
    await allocate(f.owner, cmd);
    cmds.push(cmd);
  }
  return {
    ...f,
    supply,
    other,
    allocations: cmds,
    t: await currentFollowup(f),
  };
}
export async function acceptedFixture(shared = true) {
  const f = await allocatedFixture(shared);
  await referSupply(f.owner, f.id, referral(f.t));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  return { ...f, t: await currentFollowup(f) };
}
export async function reviewedFixture(quantity = "1.375001") {
  const f = await acceptedFixture();
  await reviewSupply(
    f.owner,
    f.id,
    supplyReview(f.t, "AdjustAllocation", quantity),
  );
  return { ...f, t: await currentFollowup(f) };
}

export const reservationReview = (t: FollowupDetail, state = "Confirmed") => ({
  ...supplyReview(t, "ReconcileReservationOutcome"),
  dependency_id: t.reservation_dependencies.find(x => !x.holds.length)?.fact.id,
  outcome_state: state, observed_at: "2026-10-04T00:00:00.000Z",
  lookup_evidence: "SYN complete lookup of exact original reservation operation",
});
