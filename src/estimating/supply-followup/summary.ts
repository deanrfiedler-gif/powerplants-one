import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError } from "../../platform/errors";
import { supplyRecord } from "../../supply/context";
import { conversionAuthority, conversionScope } from "../conversion/context";
import { dispositionHistoryAuthority } from "../disposition/context";
import { allocationChanges } from "../../supply/reductions";
import { allocationPosition } from "./position";
import { followupHistory } from "./authority";
import { receiptHistory, effectOwner } from "./receipt-context";
import { shortfallHistory } from "./shortfall-context";
import { followupStatus } from "./model";

// The worklist exposes lifecycle and assignment, never a reviewed basis or
// action eligibility. Authorise all current and historical links without
// reconstructing every immutable proposal's arithmetic and receiving controls.
export async function receivingSummary(
  c: QueryClient,
  p: Principal,
  revision: string,
  target: string,
) {
  const source = await conversionAuthority(c, p, revision);
  const checked = {
    revisions: new Set([revision]),
    records: new Set<string>(),
    credits: new Set<string>(),
  };
  await dispositionHistoryAuthority(c, p, target, checked);
  const record = await supplyRecord(c, p, target);
  checked.records.add(target);
  const position = await allocationPosition(c, p, target);
  for (const group of position) {
    checked.records.add(group.supply.id);
    for (const demand of group.demands) {
      checked.records.add(demand.record.id);
      for (const child of demand.children) checked.records.add(child.record.id);
    }
  }
  const events = await followupHistory(c, p, target, checked);
  const receipts = await receiptHistory(c, p, target, checked);
  const shortfalls = await shortfallHistory(c, p, target, checked);
  const referral = events.filter((e) => e.action === "Refer").at(-1) ?? null;
  if (!referral) return null;
  const current = events.filter((e) => e.referral_id === referral.id);
  const receiving =
    current.filter((e) => e.action === "Receive").at(-1) ?? null;
  const review = current.filter((e) => e.action === "Review").at(-1) ?? null;
  const applied = current.filter((e) => e.action === "Apply").at(-1) ?? null;
  const proposals = [
    receipts
      .filter(
        (e) => e.action === "ReceiptPropose" && e.referral_id === referral.id,
      )
      .at(-1),
    shortfalls
      .filter(
        (e) => e.action === "ShortfallPropose" && e.referral_id === referral.id,
      )
      .at(-1),
  ].filter((e) => e !== undefined);
  // Proposal detail checks current alternative sources for every affected
  // Demand. A newly linked inaccessible source must also hide its worklist row.
  for (const proposal of proposals) {
    const group = position.find(
      (g) => g.supply.id === proposal.dependencies.group.supply.id,
    );
    if (!group) continue;
    for (const s of (
      await c.query<{ supply_id: string }>(
        "SELECT DISTINCT supply_id FROM ppo.supply_allocations WHERE workspace_id=$1 AND demand_id=ANY($2::uuid[])",
        [p.workspace_id, group.demands.map((d) => d.record.id)],
      )
    ).rows) {
      if (!checked.records.has(s.supply_id)) {
        await supplyRecord(c, p, s.supply_id);
        checked.records.add(s.supply_id);
      }
    }
  }
  let canWrite = false;
  try {
    await conversionScope(c, p, source, true);
    canWrite = true;
  } catch (e) {
    if (!(e instanceof AppError)) throw e;
  }
  let canReceive = false;
  if (!canWrite || referral.owner_id !== p.actor_id) {
    for (const proposal of proposals) {
      for (const demand of proposal.dependencies.group.demands.filter(
        (d) =>
          d.record.owner_id === p.actor_id &&
          ("record_id" in proposal.command ||
            allocationChanges(proposal.command).some(
              (a) => a.demand_id === d.record.id,
            )),
      )) {
        try {
          const owner = await effectOwner(
            c,
            p,
            proposal,
            demand.record.id,
            checked,
          );
          canReceive ||= owner.actor_id === p.actor_id;
        } catch (e) {
          if (!(e instanceof AppError)) throw e;
        }
      }
    }
  }
  if ((!canWrite || referral.owner_id !== p.actor_id) && !canReceive)
    return null;
  return {
    revision_id: revision,
    target_id: target,
    referral_id: referral.id,
    title: record.title,
    status:
      referral.owner_id === p.actor_id
        ? followupStatus(referral, receiving, review, applied)
        : "Affected-demand receiving",
    due_date: referral.due_date,
    date_needed: referral.date_needed,
    next_action: referral.next_action,
    owner_id: referral.owner_id,
  };
}
