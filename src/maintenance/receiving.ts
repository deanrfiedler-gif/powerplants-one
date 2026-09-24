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
import { list } from "../service/work-scope-validation";
import { receiveOwnedRequest } from "../service/intake";
import { visibleTicket } from "../service/tickets";
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
      if (family === "due") {
        const o = row as Occurrence;
        if (!["Open", "Deferred"].includes(o.state))
          conflict(
            "This occurrence already has receiving work or a final disposition.",
          );
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
        tasks = plan.content.tasks;
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
      await receiveOwnedRequest(c, p, ticket_id, row.company_id, {
        received_at: new Date().toISOString(),
        channel: family === "due" ? "PlannedMaintenance" : "Manual",
        requester_id: null,
        requester_description: `Internal owned request from ${row.reference}`,
        site_id: row.site_id,
        site_identification_needed: false,
        asset_id: row.asset_id,
        summary: `${family === "due" ? "Maintenance" : "Warranty"} request · ${row.reference}`,
        symptom: tasks.map((t) => t.description).join("\n"),
        impact: null,
        priority: "Normal",
        priority_reason: "No urgency or response commitment inferred.",
        triage_owner_id: cmd.owner_id,
        next_action:
          "Review the exact source request, then prepare and authorise Work Order scope through Service. Booking and billing remain separate.",
      });
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
        },
        cmd.reason,
        family === "due" ? { state: "WorkRequested" } : {},
      );
    },
    family === "due" ? "MaintenanceOccurrence" : "WarrantyCase",
    family === "due" ? "MaintenanceChanged" : "WarrantyChanged",
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
