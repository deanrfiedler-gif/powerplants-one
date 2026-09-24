import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { database, transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { companyContext, scopedOwner } from "../shared/authority";
import { visible } from "../shared/reads";
import { customer360 } from "../shared/customer-360";
import { activityLinks, visibleActivity } from "../activities/activities";
import { visibleOpportunity } from "../crm/context";
import { visibleTicket } from "../service/tickets";
import { reportContext } from "../reports/context";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  choice,
  narrative,
  dateOnly,
  invalid,
} from "../shared/validation";
import {
  emptyAftercare,
  emptyTraining,
  parseReview,
  reviewBlockers,
  type AftercareContent,
  type Referral,
} from "./aftercare-model";
import { conflict, hashBasis } from "./handover-service";
export type Aftercare = {
  id: string;
  workspace_id: string;
  company_id: string;
  organisation_id: string;
  site_id: string;
  source_report_id: string;
  owner_id: string;
  review_owner_id: string;
  version: number;
  revision: number;
  state: "Open" | "ReviewCompleted" | "Closed";
  content: AftercareContent;
  updated_at: Date;
};
export type AftercareEvent = {
  id: string;
  version: number;
  revision: number;
  action: string;
  content: AftercareContent;
  note: string;
  recorded_by: string;
  recorded_at: Date;
};
async function basis(c: QueryClient, p: Principal, row: Aftercare) {
  const { report, w, a } = await reportContext(c, p, row.source_report_id);
  if (
    w.customer_id !== row.organisation_id ||
    w.company_id !== row.company_id ||
    w.site_id !== row.site_id
  )
    throw unavailable();
  const org = await visible(c, p, "Organisation", row.organisation_id),
    site = await visible(c, p, "Site", row.site_id);
  return {
    report: {
      id: report.id,
      version: report.version,
      status: report.status,
      current_issue_id: report.current_issue_id,
    },
    work_order: { id: w.id, version: w.version },
    visit: { id: a.id, version: a.version, status: a.status },
    organisation: {
      id: org.id,
      version: org.version,
      owner_id: org.owner_id ?? null,
    },
    site: { id: site.id, version: site.version },
  };
}
async function actionContext(
  c: QueryClient,
  p: Principal,
  row: Aftercare,
  id: string,
  required = false,
) {
  const a = await visibleActivity(c, p, id),
    links = await activityLinks(c, p, id);
  if (
    a.company_id !== row.company_id ||
    !links.some(
      (l) =>
        (l.object_type === "Organisation" &&
          l.object_id === row.organisation_id) ||
        (l.object_type === "Site" && l.object_id === row.site_id),
    )
  )
    throw unavailable();
  if (required && (!a.owner_id || !a.due_at || a.status === "Cancelled"))
    invalid(
      "activity_id",
      "A follow-up needs an owned, dated, non-cancelled shared Activity.",
    );
  return a;
}
async function contentAuthority(
  c: QueryClient,
  p: Principal,
  row: Aftercare,
  x: AftercareContent,
  complete = false,
) {
  for (const id of new Set([
    ...x.review.activity_ids,
    ...x.review.commitments.flatMap((v) =>
      v.activity_id ? [v.activity_id] : [],
    ),
    ...x.training.flatMap((v) => (v.activity_id ? [v.activity_id] : [])),
    ...[x.service_referral, x.crm_handover].flatMap((v) =>
      v ? [v.next_activity_id] : [],
    ),
  ]))
    await actionContext(c, p, row, id, complete);
  for (const id of new Set([
    ...x.review.participants.map((v) => v.person_id),
    ...x.review.feedback.map((v) => v.person_id),
  ])) {
    await visible(c, p, "Person", id);
    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.person_company_contexts WHERE workspace_id=$1 AND company_id=$2 AND person_id=$3",
          [p.workspace_id, row.company_id, id],
        )
      ).rowCount
    )
      throw unavailable();
  }
  for (const training of x.training) {
    const a = await visible(c, p, "Asset", training.asset_id);
    if (a.company_id !== row.company_id || a.site_id !== row.site_id)
      throw unavailable();
  }
  for (const id of [
    ...x.case_ids,
    ...(x.service_referral?.receiving_id
      ? [x.service_referral.receiving_id]
      : []),
  ]) {
    const ticket = await visibleTicket(c, p, id);
    if (ticket.company_id !== row.company_id || ticket.site_id !== row.site_id)
      throw unavailable();
  }
  for (const id of [x.opportunity_id, x.crm_handover?.receiving_id].filter(
    (v): v is string => !!v,
  )) {
    const o = await visibleOpportunity(c, p, id);
    if (
      o.company_id !== row.company_id ||
      o.organisation_id !== row.organisation_id ||
      o.site_id !== row.site_id
    )
      throw unavailable();
  }
}
export async function aftercareRecord(
  c: QueryClient,
  p: Principal,
  id: string,
  edit = false,
) {
  const row = (
    await c.query<Aftercare>(
      "SELECT * FROM ppo.sales_aftercare WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await companyContext(
    c,
    p,
    row.company_id,
    row.site_id,
    "shared.internal.read",
  );
  if (edit) {
    await companyContext(
      c,
      p,
      row.company_id,
      row.site_id,
      "shared.history.record",
    );
    if (![row.owner_id, row.review_owner_id].includes(p.actor_id))
      throw unavailable();
  }
  await basis(c, p, row);
  await contentAuthority(c, p, row, row.content);
  const history = (
    await c.query<AftercareEvent>(
      "SELECT * FROM ppo.sales_workflow_events WHERE workspace_id=$1 AND record_id=$2 ORDER BY version",
      [p.workspace_id, id],
    )
  ).rows;
  for (const event of history) await contentAuthority(c, p, row, event.content);
  return { row, history };
}
export async function readAftercare(p: Principal, id: string) {
  const result = await transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const { row, history } = await aftercareRecord(c, p, id),
      current = await basis(c, p, row);
    const can_manage =
      [row.owner_id, row.review_owner_id].includes(p.actor_id) &&
      (await hasPermission(
        c,
        p,
        "shared.history.record",
        row.company_id,
        row.site_id,
      ));
    return {
      record: row,
      history,
      current_basis: current,
      source_changed:
        !!row.content.source_hash &&
        hashBasis(current) !== row.content.source_hash,
      blockers: reviewBlockers(row.content.review),
      can_manage,
      owner_conflict:
        !!current.organisation.owner_id &&
        current.organisation.owner_id !== row.owner_id,
      can_receive_service:
        row.content.service_referral?.receiving_owner_id === p.actor_id &&
        (await hasPermission(
          c,
          p,
          "service.ticket.edit",
          row.company_id,
          row.site_id,
        )),
      can_receive_crm:
        row.content.crm_handover?.receiving_owner_id === p.actor_id &&
        (await hasPermission(
          c,
          p,
          "crm.opportunity.create",
          row.company_id,
          row.site_id,
        )),
      observed_at: new Date().toISOString(),
    };
  });
  return {
    ...result,
    customer: await customer360(p, result.record.organisation_id),
    agreements: {
      state: "Unavailable",
      basis:
        "Native Service Agreements and MA-05 renewal source not implemented",
      observed_at: new Date().toISOString(),
    },
  };
}
export async function listAftercare(p: Principal, opportunity_id?: string) {
  if (opportunity_id)
    await visibleOpportunity(
      database(),
      p,
      uuid(opportunity_id, "opportunity_id"),
    );
  const candidates = (
      await database().query<{ id: string }>(
        "SELECT id FROM ppo.sales_aftercare WHERE workspace_id=$1 ORDER BY updated_at DESC,id",
        [p.workspace_id],
      )
    ).rows,
    items: Awaited<ReturnType<typeof readAftercare>>[] = [];
  for (const { id } of candidates)
    try {
      const value = await readAftercare(p, id);
      if (
        !opportunity_id ||
        value.record.content.opportunity_id === opportunity_id ||
        value.record.content.crm_handover?.receiving_id === opportunity_id
      )
        items.push(value);
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  const sources: { id: string; display_name: string }[] = [];
  for (const { id } of (
    await database().query<{ id: string }>(
      "SELECT id FROM ppo.service_reports WHERE workspace_id=$1 AND status='Issued' AND NOT $2::boolean ORDER BY created_at DESC,id",
      [p.workspace_id, !!opportunity_id],
    )
  ).rows)
    try {
      const { report, w } = await reportContext(database(), p, id);
      await companyContext(
        database(),
        p,
        w.company_id,
        w.site_id,
        "shared.history.record",
      );
      if (!items.some((x) => x.record.source_report_id === id))
        sources.push({
          id,
          display_name: `${w.display_number} · issued Service report v${report.version}`,
        });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
    }
  return {
    items,
    sources,
    completeness: "Complete" as const,
    observed_at: new Date().toISOString(),
  };
}
async function event(
  c: QueryClient,
  p: Principal,
  row: Aftercare,
  action: string,
  note: string,
) {
  await c.query(
    "INSERT INTO ppo.sales_workflow_events(id,workspace_id,record_id,version,revision,action,content,basis,source_hash,note,recorded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
    [
      randomUUID(),
      p.workspace_id,
      row.id,
      row.version,
      row.revision,
      action,
      row.content,
      row.content.preparation,
      row.content.source_hash,
      note,
      p.actor_id,
    ],
  );
  return row;
}
export async function createAftercare(p: Principal, value: unknown) {
  const r = object(value, [...commonKeys, "id", "source_report_id"]),
    input = {
      ...common(r),
      id: uuid(r.id, "id"),
      source_report_id: uuid(r.source_report_id, "source_report_id"),
    };
  return sharedOperation(
    p,
    input,
    "Aftercare:Create",
    async (c) => {
      const ctx = await reportContext(c, p, input.source_report_id);
      await companyContext(
        c,
        p,
        ctx.w.company_id,
        ctx.w.site_id,
        "shared.history.record",
      );
      await companyContext(
        c,
        p,
        ctx.w.company_id,
        ctx.w.site_id,
        "shared.internal.read",
      );
      return ctx;
    },
    async (c, { report, w }) => {
      if (report.status !== "Issued")
        invalid(
          "source_report_id",
          "Start from an issued Service report. Draft or reviewed reports do not establish the source event.",
        );
      const row = (
        await c.query<Aftercare>(
          "INSERT INTO ppo.sales_aftercare(id,workspace_id,company_id,organisation_id,site_id,source_report_id,owner_id,review_owner_id,content,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$7,$8,$7,$7) RETURNING *",
          [
            input.id,
            p.workspace_id,
            w.company_id,
            w.customer_id,
            w.site_id,
            report.id,
            p.actor_id,
            emptyAftercare(),
          ],
        )
      ).rows[0];
      return event(c, p, row, "Create", input.reason);
    },
    "AftercareRecord",
    "SharedRecordCreated",
  );
}
const actions = [
  "SaveReview",
  "ChangeOwners",
  "PrepareReview",
  "CompleteReview",
  "CorrectReview",
  "LinkCase",
  "PrepareService",
  "SubmitService",
  "ServiceOutcome",
  "ReviseService",
  "TrainingNeed",
  "TrainingArrangement",
  "TrainingAttendance",
  "TrainingDelivery",
  "TrainingAssessment",
  "PrepareCommercial",
  "LinkOpportunity",
  "PrepareCrm",
  "SubmitCrm",
  "CrmOutcome",
  "ReviseCrm",
  "Close",
] as const;
export async function aftercareReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
) {
  const receive =
    command.endsWith("ServiceOutcome") || command.endsWith("CrmOutcome");
  const ctx = await aftercareRecord(c, p, id, !receive);
  if (receive) {
    const service = command.endsWith("ServiceOutcome"),
      ref = service
        ? ctx.row.content.service_referral
        : ctx.row.content.crm_handover;
    if (!ref || ref.receiving_owner_id !== p.actor_id) throw unavailable();
    await companyContext(
      c,
      p,
      ctx.row.company_id,
      ctx.row.site_id,
      service ? "service.ticket.edit" : "crm.opportunity.create",
    );
  }
  return ctx;
}
export async function commandAftercare(
  p: Principal,
  id: string,
  value: unknown,
) {
  const r = object(value, [
      ...commonKeys,
      "expected_version",
      "action",
      "data",
    ]),
    action = choice(r.action, "action", actions),
    data = object(r.data ?? {}, [
      "review",
      "owner_id",
      "review_owner_id",
      "id",
      "summary",
      "context",
      "impact",
      "next_activity_id",
      "receiving_owner_id",
      "duplicate_check",
      "outcome",
      "receiving_id",
      "note",
      "asset_id",
      "configuration",
      "material_basis",
      "date",
      "index",
      "activity_id",
      "assessment",
      "method",
      "limits",
      "observation",
      "need",
      "assumptions",
      "existing_checked",
    ]);
  const input = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    data,
  };
  return sharedOperation(
    p,
    input,
    `Aftercare:${action}`,
    (c) => aftercareReceiptAuthority(c, p, id, `Aftercare:${action}`),
    async (c, { row }) => {
      if (row.version !== input.expected_version)
        conflict("Aftercare changed. Reload and compare before retrying.");
      if (row.state === "Closed" && action !== "CorrectReview")
        conflict("This record is closed; make a deliberate correction first.");
      const x = structuredClone(row.content);
      let state = row.state,
        revision = row.revision,
        owner = row.owner_id,
        review_owner = row.review_owner_id;
      if (action === "ChangeOwners") {
        owner = uuid(data.owner_id, "owner_id");
        review_owner = uuid(data.review_owner_id, "review_owner_id");
        for (const who of [owner, review_owner]) {
          await scopedOwner(
            c,
            p,
            who,
            row.company_id,
            row.site_id,
            "shared.history.record",
          );
          const receiver = { ...p, actor_id: who };
          await companyContext(
            c,
            receiver,
            row.company_id,
            row.site_id,
            "shared.internal.read",
          );
          await basis(c, receiver, row);
        }
      } else if (action === "SaveReview") {
        if (state !== "Open")
          conflict("A completed review is immutable. Create a correction.");
        const next = parseReview(data.review);
        for (const existing of x.review.commitments)
          if (!next.commitments.some((a) => a.id === existing.id))
            invalid(
              "commitments",
              "Retain every commitment with its disposition.",
            );
        x.review = next;
      } else if (action === "PrepareReview") {
        if (state !== "Open") conflict("Prepare an open review or correction.");
        x.preparation = await basis(c, p, row);
        x.source_hash = hashBasis(x.preparation);
      } else if (action === "CompleteReview") {
        if (state !== "Open") conflict("Only an open review can be completed.");
        const gaps = reviewBlockers(x.review);
        if (gaps.length) invalid("review", `Complete ${gaps.join("; ")}.`);
        if (
          !x.source_hash ||
          x.source_hash !== hashBasis(await basis(c, p, row))
        )
          conflict(
            "Refresh preparation: source changed or preparation is missing.",
          );
        await contentAuthority(c, p, row, x, true);
        state = "ReviewCompleted";
      } else if (action === "CorrectReview") {
        if (state === "Open")
          conflict("Only a completed review needs a correction.");
        state = "Open";
        revision++;
        x.preparation = null;
        x.source_hash = null;
      } else if (action === "LinkCase") {
        const id = uuid(data.id, "case_id");
        if (x.case_ids.includes(id))
          invalid("case_id", "This case is already linked.");
        x.case_ids.push(id);
      } else if (
        ["PrepareService", "PrepareCrm", "ReviseService", "ReviseCrm"].includes(
          action,
        )
      ) {
        const service = action.endsWith("Service"),
          key = service ? "service_referral" : "crm_handover",
          prior = x[key];
        if (prior && prior.state !== "Returned")
          conflict(
            "An existing referral must be returned before a successor; unknown outcomes must be reconciled.",
          );
        if (!service && x.opportunity_id)
          invalid(
            "opportunity_id",
            "An opportunity is already linked; use that source record.",
          );
        if (!service && (!x.commercial || !x.commercial.existing_checked))
          invalid(
            "commercial",
            "Review existing opportunities and prepare the commercial discussion first.",
          );
        if (data.duplicate_check !== true)
          invalid(
            "duplicate_check",
            "Acknowledge the explicit existing-record check.",
          );
        const receiving_owner_id = uuid(
          data.receiving_owner_id,
          "receiving_owner_id",
        );
        await scopedOwner(
          c,
          p,
          receiving_owner_id,
          row.company_id,
          row.site_id,
          service ? "service.ticket.edit" : "crm.opportunity.create",
        );
        const ref: Referral = {
          revision: (prior?.revision ?? 0) + 1,
          state: "Prepared",
          summary: narrative(data.summary, "summary", 2000),
          context: narrative(data.context, "context", 4000),
          impact: narrative(data.impact, "impact", 2000),
          next_activity_id: uuid(data.next_activity_id, "next_activity_id"),
          receiving_owner_id,
          duplicate_check: true,
          submitted_at: null,
          receiving_id: null,
          note: "",
        };
        await actionContext(c, p, row, ref.next_activity_id, true);
        x[key] = ref;
      } else if (action === "SubmitService" || action === "SubmitCrm") {
        const ref =
          action === "SubmitService" ? x.service_referral : x.crm_handover;
        if (!ref || ref.state !== "Prepared")
          conflict(
            "Submit a prepared exact referral. Unknown outcomes cannot be resubmitted.",
          );
        ref.state = "Submitted";
        ref.submitted_at = new Date().toISOString();
      } else if (action === "ServiceOutcome" || action === "CrmOutcome") {
        const service = action === "ServiceOutcome",
          ref = service ? x.service_referral : x.crm_handover;
        if (!ref || !["Submitted", "Unknown"].includes(ref.state))
          conflict("A submitted or unknown referral is required.");
        const outcome = choice(data.outcome, "outcome", [
          "Accepted",
          "Returned",
          "Unknown",
        ]);
        ref.note = narrative(data.note, "note", 4000);
        if (outcome === "Accepted") {
          const id = uuid(data.receiving_id, "receiving_id");
          if (service) {
            const t = await visibleTicket(c, p, id);
            if (t.company_id !== row.company_id || t.site_id !== row.site_id)
              throw unavailable();
          } else {
            const o = await visibleOpportunity(c, p, id);
            if (
              o.organisation_id !== row.organisation_id ||
              o.site_id !== row.site_id ||
              o.company_id !== row.company_id
            )
              throw unavailable();
            if (o.created_at.toISOString() < ref.submitted_at!)
              invalid(
                "receiving_id",
                "Use a confirmed CRM record created after this submission; link pre-existing opportunities separately.",
              );
          }
          ref.receiving_id = id;
        }
        ref.state = outcome;
      } else if (action === "TrainingNeed") {
        x.training.push({
          ...emptyTraining(),
          need: narrative(data.need, "need", 2000),
          asset_id: uuid(data.asset_id, "asset_id"),
          configuration: narrative(data.configuration, "configuration", 2000),
          material_basis: narrative(
            data.material_basis,
            "material_basis",
            4000,
          ),
        });
      } else if (action.startsWith("Training")) {
        const index = Number(data.index);
        if (!Number.isSafeInteger(index) || index < 0 || !x.training[index])
          invalid("index", "Choose a recorded training need.");
        const t = x.training[index];
        if (action === "TrainingArrangement") {
          if (t.arranged_on)
            conflict(
              "Retain the recorded arrangement; record a separate corrected training need.",
            );
          t.arranged_on = dateOnly(data.date, "date");
          t.arrangement_note = narrative(data.note, "note", 4000);
        }
        if (action === "TrainingAttendance") {
          if (!t.arranged_on || t.attendance)
            conflict("Record attendance once after a confirmed arrangement.");
          t.attendance = narrative(data.note, "note", 4000);
        }
        if (action === "TrainingDelivery") {
          if (!t.attendance || t.delivery)
            conflict("Delivery evidence requires recorded attendance.");
          t.delivery = narrative(data.note, "note", 4000);
          t.activity_id = uuid(data.activity_id, "activity_id");
          await actionContext(c, p, row, t.activity_id, true);
        }
        if (action === "TrainingAssessment") {
          if (!t.delivery)
            conflict("Record delivery before a bounded assessment.");
          t.assessment = choice(data.assessment, "assessment", [
            "Not assessed",
            "Assessed",
          ]);
          t.method = narrative(data.method, "method", 2000);
          t.limits = narrative(data.limits, "limits", 2000);
        }
      } else if (action === "PrepareCommercial") {
        if (data.existing_checked !== true)
          invalid(
            "existing_checked",
            "Review the permitted existing-opportunity source first.",
          );
        x.commercial = {
          observation: narrative(data.observation, "observation", 4000),
          need: narrative(data.need, "need", 4000),
          assumptions: narrative(data.assumptions, "assumptions", 4000),
          existing_checked: true,
        };
      } else if (action === "LinkOpportunity") {
        if (data.existing_checked !== true)
          invalid(
            "existing_checked",
            "Acknowledge existing-opportunity review.",
          );
        if (
          x.crm_handover &&
          ["Submitted", "Unknown"].includes(x.crm_handover.state)
        )
          conflict("Resolve the outstanding CRM handover first.");
        x.opportunity_id = uuid(data.id, "opportunity_id");
      } else if (action === "Close") {
        if (state !== "ReviewCompleted")
          conflict("Complete the review before closure.");
        if (x.source_hash !== hashBasis(await basis(c, p, row)))
          conflict("Source changed; correct and reassess the review.");
        if (reviewBlockers(x.review).length)
          conflict("Disposition every commitment.");
        for (const ref of [x.service_referral, x.crm_handover])
          if (ref && ref.state !== "Accepted")
            conflict("Resolve every receiving outcome before closure.");
        for (const t of x.training)
          if (!t.delivery)
            conflict(
              "Complete or carry training through an owned follow-up before closure.",
            );
        for (const activity of new Set([
          ...x.review.activity_ids,
          ...x.review.commitments.flatMap((a) =>
            a.activity_id ? [a.activity_id] : [],
          ),
          ...x.training.flatMap((t) => (t.activity_id ? [t.activity_id] : [])),
          ...[x.service_referral, x.crm_handover].flatMap((a) =>
            a ? [a.next_activity_id] : [],
          ),
        ])) {
          const a = await actionContext(c, p, row, activity, true);
          if (a.status !== "Completed")
            conflict("An owned Activity remains open; complete it in My Work.");
        }
        state = "Closed";
      }
      await contentAuthority(c, p, row, x);
      const updated = (
        await c.query<Aftercare>(
          "UPDATE ppo.sales_aftercare SET version=version+1,revision=$3,state=$4,content=$5,owner_id=$6,review_owner_id=$7,updated_by=$8,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [
            p.workspace_id,
            id,
            revision,
            state,
            x,
            owner,
            review_owner,
            p.actor_id,
          ],
        )
      ).rows[0];
      return event(c, p, updated, action, input.reason);
    },
    "AftercareRecord",
    "SharedRecordUpdated",
  );
}
