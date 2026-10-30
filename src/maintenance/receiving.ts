import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import { companyContext } from "../shared/authority";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  narrative,
} from "../shared/validation";
import type { QueryClient } from "../platform/permissions";
import { list, scopeFields } from "../service/work-scope-validation";
import { receiveOwnedRequest } from "../service/intake";
import { visibleTicket } from "../service/tickets";
import {
  authoriseCreateWorkOrder,
  insertWorkOrder,
  startDraftScope,
  visibleWorkOrder,
  type CreateWorkOrderCommand,
} from "../service/work-orders";
import { reportContext } from "../reports/context";
import { currentAssessment } from "./assessments";
import { planRevision } from "./plans";
import { exactPlan } from "./warranty";
import { agreementCurrentness } from "./model";
import {
  agreementRevision,
  assetSnapshot,
  bump,
  expected,
  hash,
  history,
  insert,
  record,
  conflict,
  type Assessment,
  type AssetSnapshot,
  type Occurrence,
  type WarrantyCase,
  type WorkRequest,
  type Family,
} from "./context";

export async function prepareWork(
  p: Principal,
  family: "due" | "cases",
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "assessment_id",
    "plan_id",
    "owner_id",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    family,
    expected_version: version(r.expected_version),
    assessment_id: uuid(r.assessment_id, "assessment_id"),
    plan_id: family === "cases" ? uuid(r.plan_id, "plan_id") : null,
    owner_id: uuid(r.owner_id, "owner_id"),
  };
  return sharedOperation(
    p,
    cmd,
    `Maintenance:PrepareWork:${family}`,
    async (c) => {
      const row = await record<Occurrence | WarrantyCase>(
        c,
        p,
        family,
        id,
        family === "due" ? "maintenance.manage" : "warranty.manage",
      );
      await companyContext(
        c,
        p,
        row.company_id,
        row.site_id,
        "service.ticket.edit",
      );
      // M-R2: preparing maintenance work also creates its work order.
      if (family === "due")
        await companyContext(
          c,
          p,
          row.company_id,
          row.site_id,
          "service.work_order.edit",
        );
      return row;
    },
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      const assessment = await currentAssessment(c, p, cmd.assessment_id),
        asset = await assetSnapshot(c, p, row.asset_id);
      if (
        assessment.asset_id !== row.asset_id ||
        assessment.site_id !== row.site_id ||
        assessment.customer_id !== row.customer_id
      )
        invalid(
          "assessment_id",
          "Use the exact asset, site and customer assessment.",
        );
      if (asset.site_id !== row.site_id || asset.lifecycle_status !== "Active")
        conflict(
          "Equipment has moved or been removed. Review future maintenance before requesting work.",
        );
      let tasks: WorkRequest["content"]["tasks"],
        target_date: string,
        source_revision_id: string,
        occurrence_id: string | null = null,
        resolution_plan_id: string | null = null;
      let agreement: Awaited<ReturnType<typeof agreementRevision>> | null =
        null;
      if (family === "due") {
        const o = row as Occurrence;
        if (!["Open", "Deferred"].includes(o.state))
          conflict(
            "This occurrence already has receiving work or a final disposition.",
          );
        const basis = await coveredDue(c, p, o, assessment, asset);
        agreement = basis.agreement;
        tasks = basis.plan.content.tasks;
        target_date = o.target_date;
        source_revision_id = o.plan_revision_id;
        occurrence_id = id;
      } else {
        const w = row as WarrantyCase,
          { plan } = await exactPlan(c, p, w, cmd.plan_id!);
        if (plan.assessment_id !== assessment.id)
          invalid(
            "assessment_id",
            "Use the assessment bound to this exact resolution plan.",
          );
        const authority = (await history(c, p, id))
          .filter(
            (e) => e.action === "Authority" && e.content.plan_id === plan.id,
          )
          .at(-1);
        if (
          authority?.content.decision !== "Approved" ||
          authority.content.content_hash !== plan.content_hash
        )
          conflict(
            "The exact current resolution plan requires separate Service authority.",
          );
        const goodwill = (await history(c, p, id))
          .filter(
            (e) => e.action === "Goodwill" && e.content.plan_id === plan.id,
          )
          .at(-1);
        if (
          plan.remedy !== "Investigate" &&
          assessment.status !== "Covered" &&
          (goodwill?.content.decision !== "Approved" ||
            goodwill.content.content_hash !== plan.content_hash)
        )
          conflict(
            "The current exact-plan goodwill decision no longer supports this intervention request.",
          );
        tasks = [
          {
            id: plan.id,
            description: plan.scope,
            expected_outcome: `Reviewed ${plan.remedy.toLowerCase()} result`,
            completion_requirements: plan.access_review,
            kind:
              plan.remedy === "Investigate" ? "Identification" : "Intervention",
          },
        ];
        target_date = plan.target_date;
        source_revision_id = plan.id;
        resolution_plan_id = plan.id;
      }
      const request_id = randomUUID(),
        ticket_id = randomUUID();
      const content = {
        tasks,
        target_date,
        source_id: id,
        source_revision_id,
        asset,
      };
      await ownedTicket(c, p, row, ticket_id, family, tasks, cmd.owner_id);
      // M-R2: a maintenance occurrence's request also gets its Draft work order, in this operation.
      const work_order_id = agreement
        ? await preparedWorkOrder(
            c,
            p,
            row as Occurrence,
            ticket_id,
            cmd.owner_id,
            tasks,
            assessment,
            agreement,
            "Planned maintenance",
          )
        : null;
      await insert(c, "maintenance_work_requests", {
        id: request_id,
        workspace_id: p.workspace_id,
        company_id: row.company_id,
        occurrence_id,
        resolution_plan_id,
        ticket_id,
        assessment_id: assessment.id,
        content,
        content_hash: hash(content),
        created_by: p.actor_id,
        // Omitted for warranty remedies, which keep today's ticket-only request.
        ...(work_order_id ? { work_order_id } : {}),
      });
      return bump(
        c,
        p,
        family,
        row,
        "WorkRequested",
        {
          request_id,
          ticket_id,
          content_hash: hash(content),
          assessment_id: assessment.id,
          ...(work_order_id ? { work_order_id } : {}),
        },
        cmd.reason,
        family === "due" ? { state: "WorkRequested" } : {},
      );
    },
    family === "due" ? "MaintenanceOccurrence" : "WarrantyCase",
    family === "due" ? "MaintenanceChanged" : "WarrantyChanged",
  );
}
// The checks every maintenance Service request shares (M-R2, M-R4): a current Covered assessment
// for this obligation's original due date and exact agreement revision, current agreement terms
// at the target date, and the equipment exactly as it was when the occurrence was generated.
async function coveredDue(
  c: QueryClient,
  p: Principal,
  o: Occurrence,
  assessment: Assessment,
  asset: AssetSnapshot,
) {
  const plan = await planRevision(c, p, o.plan_revision_id),
    agreement = await agreementRevision(c, p, plan.agreement_revision_id);
  if (
    assessment.event_date !== o.original_due ||
    assessment.agreement_revision_id !== plan.agreement_revision_id
  )
    invalid(
      "assessment_id",
      "The assessment must name this obligation's original due date and exact agreement revision.",
    );
  if (
    assessment.status !== "Covered" ||
    agreement.row.current_revision_id !== plan.agreement_revision_id ||
    agreementCurrentness(
      agreement.row.state,
      agreement.revision.content,
      o.target_date,
    ) !== "Current"
  )
    conflict(
      "Ordinary maintenance requests need current covered terms. Unknown or Disputed remains in owned review.",
    );
  if (hash(asset) !== hash(o.asset_snapshot))
    conflict(
      "Equipment changed after generation. Review this original obligation without silently transferring it.",
    );
  return { plan, agreement };
}
async function ownedTicket(
  c: QueryClient,
  p: Principal,
  row: Occurrence | WarrantyCase,
  ticket_id: string,
  family: "due" | "cases",
  tasks: WorkRequest["content"]["tasks"],
  owner_id: string,
  followOn = false,
) {
  await receiveOwnedRequest(c, p, ticket_id, row.company_id, {
    received_at: new Date().toISOString(),
    channel: family === "due" ? "PlannedMaintenance" : "Manual",
    requester_id: null,
    requester_description: `Internal owned request from ${row.reference}`,
    site_id: row.site_id,
    site_identification_needed: false,
    asset_id: row.asset_id,
    summary: `${family === "due" ? "Maintenance" : "Warranty"} ${followOn ? "follow-on request" : "request"} · ${row.reference}`,
    symptom: tasks.map((t) => t.description).join("\n"),
    impact: null,
    priority: "Normal",
    priority_reason: "No urgency or response commitment inferred.",
    triage_owner_id: owner_id,
    next_action:
      "Review the exact source request, then prepare and authorise Work Order scope through Service. Booking and billing remain separate.",
  });
}
// M-R2: a Draft work order receiving the request, with one scope item per task carrying the task's
// exact description and kind, the occurrence's asset bound to each item, and coverage from the
// Covered assessment. It goes through the work-order create and draft-scope rules; authority
// evidence, exclusions, Finance route and shutdown conditions stay for a person to complete.
async function preparedWorkOrder(
  c: QueryClient,
  p: Principal,
  o: Occurrence,
  ticket_id: string,
  owner_id: string,
  tasks: WorkRequest["content"]["tasks"],
  assessment: Assessment,
  agreement: Awaited<ReturnType<typeof agreementRevision>>,
  label: string,
) {
  const id = randomUUID(),
    terms = agreement.revision.content;
  const create: CreateWorkOrderCommand = {
    id,
    company_id: o.company_id,
    site_id: o.site_id!,
    customer_id: o.customer_id,
    service_owner_id: owner_id,
    project_reference: null,
    opportunity_reference: null,
    tickets: [
      {
        ticket_id,
        issue_disposition: `${label} for ${o.reference}, original due ${o.original_due}; tasks copied exactly from the plan.`,
      },
    ],
  };
  await authoriseCreateWorkOrder(c, p, create);
  await insertWorkOrder(c, p, create);
  const w = await visibleWorkOrder(c, p, id, "service.work_order.edit");
  await startDraftScope(
    c,
    p,
    w,
    scopeFields({
      summary: `${label} for ${o.reference}, original due ${o.original_due}, under agreement ${agreement.row.reference}.`,
      exclusions: null,
      diagnostic_limit: null,
      pending_account_plan: null,
      authority_evidence: null,
      coverage: {
        status: "Covered",
        entitlement_assessment_id: assessment.id,
        agreement_reference: agreement.row.reference,
        source_version: terms.source.revision,
        effective_from: terms.effective_from,
        effective_to: terms.effective_to,
        assessment: assessment.basis,
        reason: `Covered by agreement ${agreement.row.reference} (assessment ${assessment.reference}, original due ${o.original_due}).`,
        charging_route: "ContractReference",
      },
      items: tasks.map((t) => ({
        task_kind: t.kind,
        task_description: t.description,
        expected_outcome: t.expected_outcome,
        completion_requirements: [t.completion_requirements],
        required_skill_codes: [],
        shutdown_condition: null,
        access_condition: null,
        assets: [
          { asset_id: o.asset_id, configuration_id: null, identification_plan: null },
        ],
      })),
    }),
  );
  return id;
}
// M-R4: an occurrence received as Partial offers one follow-on request at a time. It names the
// tasks the latest result left outstanding and creates a request and Draft work order as M-R2 does.
export async function prepareFollowOn(p: Principal, id: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "assessment_id",
    "owner_id",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    assessment_id: uuid(r.assessment_id, "assessment_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
  };
  return sharedOperation(
    p,
    cmd,
    "Maintenance:PrepareFollowOn:due",
    async (c) => {
      const row = await record<Occurrence>(
        c,
        p,
        "due",
        id,
        "maintenance.manage",
      );
      await companyContext(c, p, row.company_id, row.site_id, "service.ticket.edit");
      await companyContext(c, p, row.company_id, row.site_id, "service.work_order.edit");
      return row;
    },
    async (c, o) => {
      expected(o.version, cmd.expected_version);
      if (o.state !== "Partial")
        conflict(
          "Follow-on work is offered only for an occurrence received as Partial.",
        );
      const latest = (
        await c.query<{
          id: string;
          request_id: string;
          outcome: string;
          task_mapping: { task_id: string; outcome: string }[];
        }>(
          "SELECT s.* FROM ppo.maintenance_service_results s JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(s.workspace_id,s.request_id) WHERE s.workspace_id=$1 AND q.occurrence_id=$2 ORDER BY s.created_at DESC,s.id DESC LIMIT 1",
          [p.workspace_id, id],
        )
      ).rows[0];
      if (latest?.outcome !== "Partial")
        conflict("The latest received result for this occurrence is not Partial.");
      const open = (
        await c.query<{ id: string }>(
          "SELECT q.id FROM ppo.maintenance_work_requests q WHERE q.workspace_id=$1 AND q.occurrence_id=$2 AND NOT EXISTS(SELECT 1 FROM ppo.maintenance_service_results s WHERE s.workspace_id=q.workspace_id AND s.request_id=q.id)",
          [p.workspace_id, id],
        )
      ).rows[0];
      if (open)
        conflict(
          "Follow-on work is already open for this occurrence. Receive its result before preparing another.",
        );
      const prior = (
        await c.query<WorkRequest>(
          "SELECT * FROM ppo.maintenance_work_requests WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, latest.request_id],
        )
      ).rows[0];
      await visibleTicket(c, p, prior.ticket_id);
      const assessment = await currentAssessment(c, p, cmd.assessment_id),
        asset = await assetSnapshot(c, p, o.asset_id);
      if (
        assessment.asset_id !== o.asset_id ||
        assessment.site_id !== o.site_id ||
        assessment.customer_id !== o.customer_id
      )
        invalid("assessment_id", "Use the exact asset, site and customer assessment.");
      if (asset.site_id !== o.site_id || asset.lifecycle_status !== "Active")
        conflict(
          "Equipment has moved or been removed. Review future maintenance before requesting work.",
        );
      const { agreement } = await coveredDue(c, p, o, assessment, asset);
      const done = new Set(
        latest.task_mapping
          .filter((m) => m.outcome === "Complete")
          .map((m) => m.task_id),
      );
      const tasks = prior.content.tasks.filter((t) => !done.has(t.id));
      if (!tasks.length)
        conflict("The latest result leaves no outstanding task.");
      const request_id = randomUUID(),
        ticket_id = randomUUID();
      const content = {
        tasks,
        target_date: o.target_date,
        source_id: id,
        source_revision_id: o.plan_revision_id,
        asset,
      };
      await ownedTicket(c, p, o, ticket_id, "due", tasks, cmd.owner_id, true);
      const work_order_id = await preparedWorkOrder(
        c,
        p,
        o,
        ticket_id,
        cmd.owner_id,
        tasks,
        assessment,
        agreement,
        "Follow-on maintenance",
      );
      await insert(c, "maintenance_work_requests", {
        id: request_id,
        workspace_id: p.workspace_id,
        company_id: o.company_id,
        occurrence_id: id,
        resolution_plan_id: null,
        ticket_id,
        assessment_id: assessment.id,
        content,
        content_hash: hash(content),
        created_by: p.actor_id,
        work_order_id,
        follow_on_result_id: latest.id,
      });
      // The occurrence stays Partial while follow-on work is open.
      return bump(
        c,
        p,
        "due",
        o,
        "FollowOnRequested",
        {
          request_id,
          ticket_id,
          work_order_id,
          follow_on_result_id: latest.id,
          outstanding_task_ids: tasks.map((t) => t.id),
          content_hash: hash(content),
          assessment_id: assessment.id,
        },
        cmd.reason,
      );
    },
    "MaintenanceOccurrence",
    "MaintenanceChanged",
  );
}
export async function receiveResult(
  p: Principal,
  family: "due" | "cases",
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "request_id",
    "report_revision_id",
    "task_mapping",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    family,
    expected_version: version(r.expected_version),
    request_id: uuid(r.request_id, "request_id"),
    report_revision_id: uuid(r.report_revision_id, "report_revision_id"),
    task_mapping: list(
      r.task_mapping,
      "task_mapping",
      (v) => {
        const x = object(v, ["task_id", "scope_item_id", "basis"]);
        return {
          task_id: uuid(x.task_id, "task_id"),
          scope_item_id: uuid(x.scope_item_id, "scope_item_id"),
          basis: narrative(x.basis, "basis", 2000),
        };
      },
      1,
      20,
    ),
  };
  return sharedOperation(
    p,
    cmd,
    `Maintenance:ReceiveResult:${family}`,
    async (c) => {
      const row = await record<Occurrence | WarrantyCase>(
        c,
        p,
        family,
        id,
        family === "due" ? "maintenance.assess" : "warranty.assess",
      );
      const request = (
        await c.query<WorkRequest>(
          "SELECT * FROM ppo.maintenance_work_requests WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, cmd.request_id],
        )
      ).rows[0];
      if (!request) conflict("The exact receiving request is unavailable.");
      if (family === "due" && request.occurrence_id !== id)
        invalid("request_id", "Choose this occurrence's receiving request.");
      if (
        family === "cases" &&
        !(
          await c.query(
            "SELECT 1 FROM ppo.warranty_resolution_plans WHERE workspace_id=$1 AND id=$2 AND case_id=$3",
            [p.workspace_id, request.resolution_plan_id, id],
          )
        ).rowCount
      )
        invalid("request_id", "Choose this case's exact remedy request.");
      await visibleTicket(c, p, request.ticket_id);
      const revision = (
        await c.query<{
          id: string;
          report_id: string;
          snapshot: {
            scope: { id: string };
            tasks: { id: string; task_description: string }[];
            completion: {
              task_outcomes: {
                scope_item_id: string;
                outcome: string;
                reason: string;
              }[];
            };
            assets: { id: string }[];
          };
        }>(
          "SELECT * FROM ppo.report_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, cmd.report_revision_id],
        )
      ).rows[0];
      if (!revision) conflict("The Service report revision is unavailable.");
      const ctx = await reportContext(c, p, revision.report_id);
      return { row, request, revision, ctx };
    },
    async (c, { row, request, revision, ctx }) => {
      expected(row.version, cmd.expected_version);
      // M-R4: once a follow-on carries a request's remaining work, results are received there.
      if (
        family === "due" &&
        (
          await c.query(
            "SELECT 1 FROM ppo.maintenance_work_requests f JOIN ppo.maintenance_service_results s ON (s.workspace_id,s.id)=(f.workspace_id,f.follow_on_result_id) WHERE f.workspace_id=$1 AND s.request_id=$2",
            [p.workspace_id, request.id],
          )
        ).rowCount
      )
        conflict(
          "A follow-on request now carries this request's outstanding tasks. Receive the result on the follow-on request.",
        );
      if (
        !["Reviewed", "Issued"].includes(ctx.report.status) ||
        ctx.report.current_revision_id !== revision.id ||
        !(
          await c.query(
            "SELECT 1 FROM ppo.report_reviews WHERE workspace_id=$1 AND revision_id=$2 AND decision='Approved'",
            [p.workspace_id, revision.id],
          )
        ).rowCount
      )
        conflict("Use the exact current reviewed Service report revision.");
      if (
        ctx.w.site_id !== row.site_id ||
        ctx.w.customer_id !== row.customer_id ||
        !(
          await c.query(
            "SELECT 1 FROM ppo.work_order_tickets WHERE workspace_id=$1 AND work_order_id=$2 AND ticket_id=$3",
            [p.workspace_id, ctx.w.id, request.ticket_id],
          )
        ).rowCount
      )
        invalid(
          "report_revision_id",
          "The reviewed result must come from the Work Order receiving this exact request.",
        );
      if (
        !revision.snapshot.assets.some((a) => a.id === request.content.asset.id)
      )
        invalid(
          "report_revision_id",
          "The report must retain this obligation's original asset identity.",
        );
      if (
        cmd.task_mapping.length !== request.content.tasks.length ||
        new Set(cmd.task_mapping.map((t) => t.task_id)).size !==
          cmd.task_mapping.length ||
        new Set(cmd.task_mapping.map((t) => t.scope_item_id)).size !==
          cmd.task_mapping.length
      )
        invalid(
          "task_mapping",
          "Map every original task once to a distinct exact Service scope item.",
        );
      const authority = (
        await c.query<{ approved_snapshot: { tickets: { id: string }[] } }>(
          "SELECT approved_snapshot FROM ppo.scope_revisions WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, revision.snapshot.scope.id],
        )
      ).rows[0];
      if (
        !authority?.approved_snapshot?.tickets?.some(
          (t) => t.id === request.ticket_id,
        )
      )
        invalid(
          "report_revision_id",
          "The immutable authorised Service scope must name the exact original request.",
        );
      const boundItems = new Set(
        (
          await c.query<{ scope_item_id: string }>(
            "SELECT scope_item_id FROM ppo.scope_assets WHERE workspace_id=$1 AND scope_revision_id=$2 AND asset_id=$3",
            [
              p.workspace_id,
              revision.snapshot.scope.id,
              request.content.asset.id,
            ],
          )
        ).rows.map((x) => x.scope_item_id),
      );
      const outcomes = cmd.task_mapping.map((m) => {
        const task = request.content.tasks.find((t) => t.id === m.task_id),
          scope = revision.snapshot.tasks.find((t) => t.id === m.scope_item_id),
          outcome = revision.snapshot.completion.task_outcomes.find(
            (t) => t.scope_item_id === m.scope_item_id,
          );
        if (
          !task ||
          !scope ||
          !outcome ||
          !boundItems.has(m.scope_item_id) ||
          task.description !== scope.task_description
        )
          invalid(
            "task_mapping",
            "The retained original task and reviewed Service task description must match exactly; do not close unrelated obligations.",
          );
        return {
          ...m,
          outcome: outcome.outcome,
          source_reason: outcome.reason,
        };
      });
      const outcome = outcomes.every((o) => o.outcome === "Complete")
          ? "Completed"
          : "Partial",
        result_id = randomUUID();
      await insert(c, "maintenance_service_results", {
        id: result_id,
        workspace_id: p.workspace_id,
        request_id: request.id,
        report_revision_id: revision.id,
        task_mapping: JSON.stringify(outcomes),
        outcome,
        created_by: p.actor_id,
      });
      return bump(
        c,
        p,
        family as Family,
        row,
        "ServiceResultReceived",
        {
          result_id,
          request_id: request.id,
          report_revision_id: revision.id,
          outcome,
        },
        cmd.reason,
        family === "due" ? { state: outcome } : {},
      );
    },
    family === "due" ? "MaintenanceOccurrence" : "WarrantyCase",
    family === "due" ? "MaintenanceChanged" : "WarrantyChanged",
  );
}
