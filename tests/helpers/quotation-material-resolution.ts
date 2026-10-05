import { randomUUID } from "node:crypto";
import {
  allocatedFixture,
  currentFollowup,
  followupEnvelope,
  referral,
  acknowledgement,
  supplyApply,
} from "./quotation-supply-followup";
import {
  receiptProposal,
  receiveAll,
  receiptReview,
} from "./quotation-receipt-correction";
import {
  shortfallProposal,
  receiveAllAllocations,
  shortfallReview,
} from "./quotation-allocation-shortfall";
import { projectInput, taskInput } from "./projects";
import { createProject, saveTask } from "../../src/projects/service";
import {
  referSupply,
  receiveSupply,
  reviewSupply,
  applySupply,
} from "../../src/estimating/supply-followup/service";
import { proposeReceipt } from "../../src/estimating/supply-followup/receipt-service";
import { proposeShortfall } from "../../src/estimating/supply-followup/shortfall-service";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import type { FollowupDetail } from "../../src/estimating/supply-followup/context";
import type { MaterialRole } from "../../src/estimating/supply-followup/material-input";

export const materialEnvelope = (t: FollowupDetail) => ({
  ...followupEnvelope(t),
  referral_id: t.referral!.id,
  expected_material_sequence: t.material_resolution.sequence,
});
export function materialProposal(t: FollowupDetail, taskId: string) {
  const c = t.material_resolution.candidates[0];
  return {
    ...materialEnvelope(t),
    allocation_outcome_id: c.outcome.id,
    demand_id: c.demand.id,
    impact_id: c.impact.id,
    task_id: taskId,
    predecessor_id: t.material_resolution.proposal?.id ?? null,
  };
}
export function materialReceiving(
  t: FollowupDetail,
  role: MaterialRole,
  decision = "Accepted",
) {
  const s = t.material_resolution;
  return {
    ...materialEnvelope(t),
    proposal_id: s.proposal!.id,
    proposal_hash: s.proposal!.proposal_hash,
    role,
    decision,
    predecessor_id:
      s.required.find((r) => r.role === role)?.decision?.id ?? null,
  };
}
export function materialReview(
  t: FollowupDetail,
  decision = "WithdrawForecast",
) {
  const s = t.material_resolution;
  return {
    ...materialEnvelope(t),
    proposal_id: s.proposal!.id,
    proposal_hash: s.proposal!.proposal_hash,
    predecessor_id: s.review?.id ?? null,
    decision,
  };
}
export function materialApply(t: FollowupDetail) {
  const s = t.material_resolution;
  return {
    ...materialEnvelope(t),
    review_id: s.review!.id,
    review_hash: s.review!.review_hash,
  };
}
export async function receiveMaterial(
  f: Parameters<typeof currentFollowup>[0],
) {
  for (const r of (await currentFollowup(f)).material_resolution.required)
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), r.role),
    );
  return currentFollowup(f);
}
export async function materialFixture(existing?: {
  project: ReturnType<typeof projectInput>;
  task: ReturnType<typeof taskInput>;
}) {
  const project = existing?.project ?? projectInput(),
    task = existing?.task ?? { ...taskInput(), status: "Planned", progress: 0 };
  const f = await allocatedFixture(true, "Shipment", async (f, other) => {
    project.coordinator_id = f.owner.actor_id;
    other.site_id = project.site_id;
    if (!existing) {
      await createProject(f.owner, project);
      task.owner_id = f.owner.actor_id;
      await saveTask(f.owner, project.id, task);
    }
    Object.assign(other.data, {
      origin_kind: "Project",
      origin_id: project.id,
      origin_reference: "SYN existing Project material requirement",
    });
  });
  await referSupply(f.owner, f.id, referral(f.t));
  await receiveSupply(f.owner, f.id, acknowledgement(await currentFollowup(f)));
  await proposeReceipt(
    f.owner,
    f.id,
    receiptProposal(await currentFollowup(f)),
  );
  await receiveAll(f);
  await reviewSupply(f.owner, f.id, receiptReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  await proposeShortfall(
    f.owner,
    f.id,
    shortfallProposal(await currentFollowup(f)),
  );
  await receiveAllAllocations(f);
  await reviewSupply(f.owner, f.id, shortfallReview(await currentFollowup(f)));
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  return { ...f, project, task, t: await currentFollowup(f) };
}
export const retryOperation = <T extends { operation_id: string }>(
  cmd: T,
): T => ({ ...cmd, operation_id: randomUUID() });
