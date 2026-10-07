import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  dateOnly,
} from "../shared/validation";
import {
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../activities/activities";
import { text } from "./model";
import {
  agreementRevision,
  bump,
  contextAuthority,
  event,
  expected,
  insert,
  meta,
  owner,
  record,
  reference,
  conflict,
  type Renewal,
} from "./context";

export async function createRenewal(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "agreement_revision_id",
    "site_id",
    "owner_id",
    "review_from",
    "next_date",
    "next_action",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    agreement_revision_id: uuid(
      r.agreement_revision_id,
      "agreement_revision_id",
    ),
    site_id: uuid(r.site_id, "site_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    review_from: dateOnly(r.review_from, "review_from"),
    next_date: dateOnly(r.next_date, "next_date"),
    next_action: text(r.next_action, "next_action"),
  };
  return sharedOperation(
    p,
    cmd,
    "Maintenance:CreateRenewal",
    async (c) => {
      const a = await agreementRevision(
        c,
        p,
        cmd.agreement_revision_id,
        "maintenance.manage",
      );
      if (!a.revision.content.sites.some((s) => s.site_id === cmd.site_id))
        conflict("Use a site included in the reviewed agreement source.");
      await contextAuthority(
        c,
        p,
        a.row.company_id,
        cmd.site_id,
        a.row.customer_id,
        "maintenance.manage",
      );
      await owner(
        c,
        p,
        { company_id: a.row.company_id, site_id: cmd.site_id },
        cmd.owner_id,
        "maintenance.manage",
      );
      return a;
    },
    async (c, a) => {
      const row = await insert<Renewal>(c, "renewal_reviews", {
        ...meta(p),
        id: cmd.id,
        company_id: a.row.company_id,
        customer_id: a.row.customer_id,
        site_id: cmd.site_id,
        owner_id: cmd.owner_id,
        reference: reference("REN", cmd.id),
        agreement_id: a.row.id,
        agreement_revision_id: cmd.agreement_revision_id,
        review_from: cmd.review_from,
        next_date: cmd.next_date,
        next_action: cmd.next_action,
      });
      await event(
        c,
        p,
        row,
        "Created",
        { agreement_revision_id: cmd.agreement_revision_id },
        cmd.reason,
      );
      return row;
    },
    "RenewalReview",
    "MaintenanceChanged",
  );
}
export async function renewalCommand(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "proposal",
    "customer_response",
    "next_action",
    "next_date",
    "owner_id",
  ]);
  const action = choice(r.action, "action", [
    "Proposal",
    "CustomerReview",
    "FollowUp",
    "CrmHandoff",
    "ServiceHandoff",
    "Close",
  ] as const);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    proposal: r.proposal == null ? null : text(r.proposal, "proposal"),
    customer_response:
      r.customer_response == null
        ? null
        : text(r.customer_response, "customer_response"),
    next_action: text(r.next_action, "next_action"),
    next_date: dateOnly(r.next_date, "next_date"),
    owner_id: uuid(r.owner_id, "owner_id"),
  };
  return sharedOperation(
    p,
    cmd,
    `Maintenance:Renewal:${action}`,
    async (c) => {
      const row = await record<Renewal>(
        c,
        p,
        "renewals",
        id,
        "maintenance.manage",
      );
      await agreementRevision(c, p, row.agreement_revision_id);
      return row;
    },
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      const changes: Record<string, unknown> = {
        next_action: cmd.next_action,
        next_date: cmd.next_date,
      };
      const detail: Record<string, unknown> = {
        agreement_revision_id: row.agreement_revision_id,
        next_action: cmd.next_action,
        next_date: cmd.next_date,
      };
      if (action === "CrmHandoff" || action === "ServiceHandoff") {
        const field =
          action === "CrmHandoff" ? "crm_activity_id" : "service_activity_id";
        if (row[field])
          conflict(
            "This review already has that owned handoff. Open its existing Activity.",
          );
        const aid = randomUUID();
        const activity: ActivityInput = {
          id: aid,
          company_id: row.company_id,
          site_id: row.site_id,
          kind:
            action === "CrmHandoff"
              ? "RelationshipReview"
              : "TechnicalFollowUp",
          owner_id: cmd.owner_id,
          summary: `${row.reference} · ${cmd.next_action}`,
          due_at: `${cmd.next_date}T12:00:00.000Z`,
          due_needed: false,
          access_class: "Internal",
          links: [
            { object_type: "Organisation", object_id: row.customer_id },
            { object_type: "Site", object_id: row.site_id! },
          ],
        };
        await authoriseActivityInput(c, p, activity);
        await insertActivity(c, p, activity);
        changes[field] = aid;
        detail.activity_id = aid;
        detail.owner_id = cmd.owner_id;
      } else {
        await owner(c, p, row, cmd.owner_id, "maintenance.manage");
        changes.owner_id = cmd.owner_id;
        changes.state = action === "Close" ? "Closed" : action;
        if (action === "Proposal") {
          if (!cmd.proposal)
            conflict(
              "Retain the exact proposed terms; no acceptance or extension is inferred.",
            );
          changes.proposal = cmd.proposal;
          changes.revision = row.revision + 1;
          detail.proposal = cmd.proposal;
          detail.revision = row.revision + 1;
        }
        if (action === "CustomerReview") {
          if (!cmd.customer_response)
            conflict(
              "Retain the customer response context without treating it as agreement acceptance.",
            );
          changes.customer_response = cmd.customer_response;
          detail.customer_response = cmd.customer_response;
        }
      }
      return bump(c, p, "renewals", row, action, detail, cmd.reason, changes);
    },
    "RenewalReview",
    "MaintenanceChanged",
  );
}
