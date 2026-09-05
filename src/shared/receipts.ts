import { visibleWorkOrder } from "../service/work-orders";
import { database } from "../platform/database";
import { unavailable } from "../platform/errors";
import type { Principal } from "../platform/identity";
import type { OperationReceipt } from "../platform/operations";
import { hasPermission, type Capability } from "../platform/permissions";
import { visibleTicket } from "../service/tickets";
import { visibleActivity } from "../activities/activities";
import { visible } from "./reads";
import { uuid } from "./validation";
export async function readOperation(
  p: Principal,
  operation_id: string,
): Promise<OperationReceipt> {
  const client = database();
  const result = await client.query(
    `SELECT r.result,r.record_id,i.object_type,a.details->>'command' AS command FROM ppo.operation_receipts r JOIN ppo.business_identities i ON (i.workspace_id,i.id)=(r.workspace_id,r.record_id)
    JOIN ppo.audit_events a ON (a.workspace_id,a.actor_id,a.operation_id)=(r.workspace_id,r.actor_id,r.operation_id)
    WHERE r.workspace_id=$1 AND r.actor_id=$2 AND r.operation_id=$3`,
    [p.workspace_id, p.actor_id, uuid(operation_id, "operation_id")],
  );
  const r = result.rows[0];
  if (!r) throw unavailable();
  if (r.object_type === "WorkOrder" || r.object_type === "Appointment") {
    const cap =
      r.command === "AuthoriseWorkOrder"
        ? "service.scope.authorise"
        : r.command === "AssessWorkReadiness"
          ? "service.readiness.assess"
          : "service.work_order.edit";
    let id = r.record_id;
    if (r.object_type === "Appointment") {
      const v = (
        await client.query(
          "SELECT work_order_id FROM ppo.appointments WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, id],
        )
      ).rows[0];
      if (!v) throw unavailable();
      id = v.work_order_id;
    }
    await visibleWorkOrder(client, p, id, cap);
  } else if (r.object_type === "Ticket") {
    const t = await visibleTicket(client, p, r.record_id);
    if (
      !(await hasPermission(
        client,
        p,
        "service.ticket.edit",
        t.company_id,
        t.site_id ?? undefined,
      ))
    )
      throw unavailable();
    if (
      r.command === "RequestTicketInformation" &&
      t.clarification_activity_id
    ) {
      const a = await visibleActivity(client, p, t.clarification_activity_id);
      if (
        !(await hasPermission(
          client,
          p,
          "activity.edit",
          a.company_id,
          a.site_id ?? undefined,
        ))
      )
        throw unavailable();
    }
  } else if (r.object_type === "Activity") {
    const a = await visibleActivity(client, p, r.record_id);
    if (
      !(await hasPermission(
        client,
        p,
        "activity.edit",
        a.company_id,
        a.site_id ?? undefined,
      ))
    )
      throw unavailable();
    if (
      ["StartActivity", "CompleteActivity", "CancelActivity"].includes(
        r.command,
      ) &&
      a.owner_id !== p.actor_id
    )
      throw unavailable();
  } else {
    const cap: Capability =
      r.command === "RecordSharedHistory"
        ? "shared.history.record"
        : [
              "ReviseOrganisationIdentity",
              "ReviseAssetIdentity",
              "AddAffiliation",
              "AddSiteParty",
              "ProposeMapping",
            ].includes(r.command)
          ? "shared.edit"
          : "shared.create";
    if (r.object_type === "Person") {
      await visible(client, p, "Person", r.record_id);
      const companies = await client.query(
        "SELECT company_id FROM ppo.person_company_contexts WHERE workspace_id=$1 AND person_id=$2",
        [p.workspace_id, r.record_id],
      );
      for (const c of companies.rows)
        if (!(await hasPermission(client, p, cap, c.company_id)))
          throw unavailable();
    } else {
      let row;
      if (["Organisation", "Site", "Asset", "Facility"].includes(r.object_type))
        row = await visible(client, p, r.object_type, r.record_id);
      else {
        const table = (
          {
            Relationship: "relationships",
            SiteParty: "site_parties",
            ErpAccountMapping: "erp_account_mappings",
            HistoryRecord: "history_records",
          } as Record<string, string>
        )[r.object_type];
        if (!table) throw unavailable();
        row = (
          await client.query(
            `SELECT * FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`,
            [p.workspace_id, r.record_id],
          )
        ).rows[0];
        await visible(
          client,
          p,
          row.site_id ? "Site" : "Organisation",
          row.site_id ?? row.organisation_id,
        );
        if (
          row.access_class === "RestrictedFinance" &&
          !(await hasPermission(
            client,
            p,
            "shared.finance.read",
            row.company_id,
            row.site_id,
          ))
        )
          throw unavailable();
      }
      if (
        !(await hasPermission(
          client,
          p,
          cap,
          row.company_id,
          r.object_type === "Site" ? row.id : row.site_id,
        ))
      )
        throw unavailable();
    }
  }
  return r.result as OperationReceipt;
}
