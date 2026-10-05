import type { Principal } from "../../platform/identity";
import type { QueryClient } from "../../platform/permissions";
import { AppError, unavailable } from "../../platform/errors";
import { supplyRecord, financeAllowed } from "../../supply/context";
import { conversionAuthority } from "../conversion/context";
import type { FollowupEvent } from "./model";
export function followupConflict(message: string): never {
  throw new AppError(409, "SupplyFollowupConflict", message);
}
export async function followupAvailable(c: QueryClient) {
  return !!(
    await c.query("SELECT to_regclass('ppo.quote_supply_events') present")
  ).rows[0].present;
}
export type Checked = {
  revisions: Set<string>;
  records: Set<string>;
  credits: Set<string>;
};
export async function followupEvidenceAuthority(
  c: QueryClient,
  p: Principal,
  e: Pick<FollowupEvent, "revision_id" | "target_id" | "basis"> & {
    receipt_proposal_id?: string | null;
  },
  checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  },
) {
  if (!checked.revisions.has(e.revision_id)) {
    await conversionAuthority(c, p, e.revision_id);
    checked.revisions.add(e.revision_id);
  }
  const plain = [
    e.target_id,
    ...e.basis.conversion.dependencies.supplies.map((s) => s.id),
    ...e.basis.conversion.dependencies.children.map((s) => s.id),
  ];
  const detailed = e.basis.position.flatMap((group) => [
    { record: group.supply, facts: group.facts },
    ...group.demands,
    ...group.demands.flatMap((d) => d.children),
  ]);
  for (const id of [...plain, ...detailed.map((x) => x.record.id)]) {
    if (!checked.records.has(id)) {
      await supplyRecord(c, p, id);
      checked.records.add(id);
    }
  }
  for (const x of detailed.filter((x) =>
    x.facts.some((f) => f.kind === "Credit"),
  )) {
    if (!checked.credits.has(x.record.id)) {
      const current = await supplyRecord(c, p, x.record.id);
      if (!(await financeAllowed(c, p, current))) throw unavailable();
      checked.credits.add(x.record.id);
    }
  }
  if (e.receipt_proposal_id) {
    const { receiptEvidenceAuthority } = await import("./receipt-context");
    const proposal = (
      await c.query(
        "SELECT * FROM ppo.quote_supply_receipt_events WHERE workspace_id=$1 AND id=$2",
        [p.workspace_id, e.receipt_proposal_id],
      )
    ).rows[0];
    if (!proposal) throw unavailable();
    await receiptEvidenceAuthority(c, p, proposal, checked);
  }
}
export async function followupHistory(
  c: QueryClient,
  p: Principal,
  target: string,
) {
  if (!(await followupAvailable(c))) return [];
  const events = (
    await c.query<FollowupEvent>(
      "SELECT * FROM ppo.quote_supply_events WHERE workspace_id=$1 AND target_id=$2 ORDER BY sequence",
      [p.workspace_id, target],
    )
  ).rows;
  const checked: Checked = {
    revisions: new Set(),
    records: new Set(),
    credits: new Set(),
  };
  for (const e of events) await followupEvidenceAuthority(c, p, e, checked);
  return events;
}
export async function followupReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  operation: string,
) {
  const e = (
    await c.query<FollowupEvent>(
      "SELECT * FROM ppo.quote_supply_events WHERE workspace_id=$1 AND revision_id=$2 AND created_by=$3 AND operation_id=$4",
      [p.workspace_id, id, p.actor_id, operation],
    )
  ).rows[0];
  if (!e) {
    const { receiptOriginalAuthority, receiptAvailable } =
      await import("./receipt-context");
    if (!(await receiptAvailable(c))) throw unavailable();
    return receiptOriginalAuthority(c, p, id, operation);
  }
  await conversionAuthority(c, p, id, true);
  await followupEvidenceAuthority(c, p, e);
  if (e.decision === "CorrectReceipt" && e.command && "record_id" in e.command)
    await supplyRecord(c, p, e.command.record_id, "supply.inspect");
  // Recovery never depends on current assignment; it does require the original
  // actor's current source/coordination/dependency authority.
}
export async function nativeFollowupReceiptAuthority(
  c: QueryClient,
  p: Principal,
  target: string,
  operation: string,
) {
  if (!(await followupAvailable(c))) return;
  const e = (
    await c.query<FollowupEvent>(
      "SELECT * FROM ppo.quote_supply_events WHERE workspace_id=$1 AND command->>'operation_id'=$2 ORDER BY sequence DESC LIMIT 1",
      [p.workspace_id, operation],
    )
  ).rows[0];
  if (!e) {
    const { receiptAvailable } = await import("./receipt-context");
    if (
      (await receiptAvailable(c)) &&
      (
        await c.query(
          "SELECT 1 FROM ppo.quote_supply_receipt_events WHERE workspace_id=$1 AND command->>'operation_id'=$2",
          [p.workspace_id, operation],
        )
      ).rowCount
    )
      followupConflict(
        "This native operation is reserved to its original Receipt proposal. Recover the original and apply its exact reviewed action.",
      );
    return;
  }
  if (
    (e.command && "record_id" in e.command
      ? e.command.record_id
      : e.target_id) !== target ||
    e.action !== "Apply" ||
    e.created_by !== p.actor_id
  )
    followupConflict(
      "This native operation is reserved to its exact Supply review. Apply that review before recovering the original native receipt.",
    );
  await conversionAuthority(c, p, e.revision_id, true);
  await followupEvidenceAuthority(c, p, e);
  if (e.decision === "CorrectReceipt")
    await supplyRecord(c, p, target, "supply.inspect");
}
