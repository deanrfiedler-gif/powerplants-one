import { AppError } from "../platform/errors";
import type { QueryClient } from "../platform/permissions";
import type { Communication } from "../communications/records";
import {
  currentCustomerDelivery,
  noticeSnapshot,
  noticeSourceHash,
} from "./customer-delivery";
import type { SupplyRecord } from "./model";

// Older S2 messages retain their original semantics. S3 messages must still match the named
// delivery role and exact native facts at confirmation and immediately before synthetic handover.
export async function supplyCustomerNoticeGate(
  c: QueryClient,
  m: Communication,
) {
  if (
    !(
      await c.query(
        "SELECT to_regclass('ppo.supply_customer_notice_sources') AS relation",
      )
    ).rows[0].relation
  )
    return null;
  const source = (
    await c.query(
      "SELECT * FROM ppo.supply_customer_notice_sources WHERE workspace_id=$1 AND communication_id=$2",
      [m.workspace_id, m.id],
    )
  ).rows[0];
  if (!source) return null;
  const r = (
    await c.query(
      "SELECT * FROM ppo.supply_records WHERE workspace_id=$1 AND id=$2",
      [m.workspace_id, m.source_id],
    )
  ).rows[0] as SupplyRecord;
  if (
    !r ||
    r.company_id !== m.company_id ||
    r.data.customer_id !== m.organisation_id ||
    r.site_id !== m.site_id
  )
    return "SourceChanged" as const;
  const current = await currentCustomerDelivery(c, m.workspace_id, m.source_id);
  if ((current?.contact_id ?? null) !== m.recipient_contact_id)
    return "RecipientChanged" as const;
  try {
    const snapshot = await noticeSnapshot(
      c,
      {
        workspace_id: m.workspace_id,
        actor_id: m.prepared_by,
        display_name: "Recorded preparer",
      },
      r,
      source.dispatch_fact_id,
    );
    if (snapshot?.hold) return snapshot.hold;
    if (!snapshot || noticeSourceHash(snapshot.basis) !== source.source_hash)
      return "SourceChanged" as const;
  } catch (e) {
    if (e instanceof AppError && e.code === "DispatchNotCurrent")
      return "SourceChanged" as const;
    throw e;
  }
  return null;
}
