import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { sharedOperation } from "../platform/operations";
import type { QueryClient, Capability } from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  uuid,
  version,
  invalid,
  choice,
  dateOnly,
  label,
} from "../shared/validation";
import {
  visibleActivity,
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../activities/activities";
import { readEquipmentChange } from "../equipment/changes";
import {
  currentAssessment,
  latestAssessment,
  assessmentContext,
} from "./assessments";
import { reviewedResult } from "./service-evidence";
import { sourceFields, text, remedyTypes, responseStates } from "./model";
import {
  calendarDates,
  assetSnapshot,
  bump,
  contextAuthority,
  event,
  expected,
  hash,
  history,
  insert,
  meta,
  owner,
  record,
  reference,
  conflict,
  sourceAccess,
  type Assessment,
  type WarrantyCase,
  type Resolution,
} from "./context";

export async function createCase(p: Principal, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "id",
    "company_id",
    "site_id",
    "customer_id",
    "owner_id",
    "asset_id",
    "event_date",
    "symptoms",
    "source",
    "next_review",
    "next_action",
  ]);
  const cmd = {
    ...common(r),
    id: uuid(r.id, "id"),
    company_id: uuid(r.company_id, "company_id"),
    site_id: uuid(r.site_id, "site_id"),
    customer_id: uuid(r.customer_id, "customer_id"),
    owner_id: uuid(r.owner_id, "owner_id"),
    asset_id: uuid(r.asset_id, "asset_id"),
    event_date: dateOnly(r.event_date, "event_date"),
    symptoms: text(r.symptoms, "symptoms"),
    source: sourceFields(r.source),
    next_review: dateOnly(r.next_review, "next_review"),
    next_action: text(r.next_action, "next_action"),
  };
  return sharedOperation(
    p,
    cmd,
    "Warranty:Create",
    async (c) => {
      await contextAuthority(
        c,
        p,
        cmd.company_id,
        cmd.site_id,
        cmd.customer_id,
        "warranty.manage",
      );
      await owner(c, p, cmd, cmd.owner_id, "warranty.manage");
      await sourceAccess(
        c,
        p,
        cmd.company_id,
        cmd.site_id,
        cmd.source.access_class,
      );
      const a = await assetSnapshot(c, p, cmd.asset_id);
      if (a.site_id !== cmd.site_id)
        invalid("asset_id", "Choose equipment at the case site.");
      return a;
    },
    async (c, asset) => {
      const { operation_id: _o, schema_version: _s, reason, ...fields } = cmd;
      void _o;
      void _s;
      const row = await insert<WarrantyCase>(c, "warranty_cases", {
        ...meta(p),
        ...fields,
        reference: reference("WAR", cmd.id),
        asset_snapshot: asset,
      });
      await event(
        c,
        p,
        row,
        "Created",
        { asset_snapshot: asset, source: cmd.source },
        reason,
      );
      return row;
    },
    "WarrantyCase",
    "WarrantyChanged",
  );
}
export async function latestPlan(c: QueryClient, p: Principal, id: string) {
  return calendarDates(
    (
      await c.query<Resolution>(
        "SELECT * FROM ppo.warranty_resolution_plans WHERE workspace_id=$1 AND case_id=$2 ORDER BY revision DESC LIMIT 1",
        [p.workspace_id, id],
      )
    ).rows[0] ?? null,
  );
}
export async function exactPlan(
  c: QueryClient,
  p: Principal,
  row: WarrantyCase,
  id: string,
) {
  const plan = await latestPlan(c, p, row.id);
  if (!plan || plan.id !== id)
    conflict(
      "Use the exact current resolution plan; older decisions cannot authorise changed content.",
    );
  const assessment = await currentAssessment(c, p, plan.assessment_id);
  if (
    assessment.warranty_case_id !== row.id ||
    plan.context_hash !== assessment.context_hash
  )
    conflict("Review the current case assessment and plan basis.");
  return { plan, assessment };
}
export async function followup(
  c: QueryClient,
  p: Principal,
  row: WarrantyCase,
  owner_id: string,
  due: string,
  summary: string,
  kind: ActivityInput["kind"] = "CustomerContact",
) {
  const input: ActivityInput = {
    id: randomUUID(),
    company_id: row.company_id,
    site_id: row.site_id,
    kind,
    owner_id,
    summary,
    due_at: `${due}T12:00:00.000Z`,
    due_needed: false,
    access_class: "Internal",
    links: [
      { object_type: "Site", object_id: row.site_id! },
      { object_type: "Asset", object_id: row.asset_id },
    ],
  };
  await authoriseActivityInput(c, p, input);
  await insertActivity(c as Parameters<typeof insertActivity>[0], p, input);
  return input.id;
}
const commands = [
  "AddEvidence",
  "ReviewEvidence",
  "ReviseSource",
  "Plan",
  "Goodwill",
  "Authority",
  "UpdateCustomer",
  "CustomerResponse",
  "ResolveCustomer",
  "ReviewReplacement",
  "AssignReview",
] as const;
export function warrantyCapability(action: string): Capability {
  return action === "Goodwill"
    ? "warranty.goodwill"
    : action === "Authority"
      ? "service.scope.authorise"
      : [
            "ReviewEvidence",
            "Plan",
            "ResolveCustomer",
            "ReviewReplacement",
          ].includes(action)
        ? "warranty.assess"
        : "warranty.manage";
}
export async function warrantyCommand(
  p: Principal,
  id: string,
  input: unknown,
) {
  const r = object(input, [
    ...commonKeys,
    "expected_version",
    "action",
    "data",
  ]);
  const action = choice(r.action, "action", commands);
  const data = object(r.data, [
    "source",
    "basis",
    "assessment_id",
    "remedy",
    "scope",
    "access_review",
    "target_date",
    "owner_id",
    "plan_id",
    "decision",
    "authority_reference",
    "recipient",
    "content",
    "update_id",
    "response",
    "evidence",
    "due_date",
    "equipment_change_id",
    "result_id",
    "next_action",
  ]);
  // Normalised closed command bytes are retained by the shared receipt framework.
  const cmd = {
    ...common(r),
    id: uuid(id, "id"),
    expected_version: version(r.expected_version),
    action,
    data,
  };
  return sharedOperation(
    p,
    cmd,
    `Warranty:${action}`,
    async (c) => {
      const row = await record<WarrantyCase>(
        c,
        p,
        "cases",
        id,
        warrantyCapability(action),
      );
      if (["AddEvidence", "ReviseSource"].includes(action))
        await sourceAccess(
          c,
          p,
          row.company_id,
          row.site_id,
          sourceFields(data.source).access_class,
        );
      return row;
    },
    async (c, row) => {
      expected(row.version, cmd.expected_version);
      let detail: Record<string, unknown> = {},
        changes: Record<string, unknown> = {};
      if (action === "AddEvidence") {
        const source = sourceFields(data.source),
          eid = randomUUID();
        await insert(c, "warranty_evidence", {
          id: eid,
          workspace_id: p.workspace_id,
          case_id: id,
          revision: row.evidence_revision + 1,
          reference: source.reference,
          source,
          created_by: p.actor_id,
        });
        detail = { evidence_id: eid, source };
        changes = {
          evidence_revision: row.evidence_revision + 1,
          state: "Open",
        };
      } else if (action === "ReviseSource") {
        const source = sourceFields(data.source);
        if (hash(source) === hash(row.source))
          invalid("source", "Retain a changed exact source revision.");
        detail = { predecessor: row.source, source };
        changes = { source, state: "Open" };
      } else if (action === "ReviewEvidence") {
        detail = {
          basis: text(data.basis, "basis"),
          evidence_revision: row.evidence_revision,
          source_hash: hash(row.source),
        };
      } else if (action === "Plan") {
        const assessment = await currentAssessment(
          c,
          p,
          uuid(data.assessment_id, "assessment_id"),
        );
        if (assessment.warranty_case_id !== id)
          invalid("assessment_id", "Choose this case's current assessment.");
        const previous = await latestPlan(c, p, id),
          pid = randomUUID(),
          owner_id = uuid(data.owner_id, "owner_id");
        await owner(c, p, row, owner_id, "warranty.manage");
        const fields = {
          case_id: id,
          revision: (previous?.revision ?? 0) + 1,
          predecessor_id: previous?.id ?? null,
          assessment_id: assessment.id,
          remedy: choice(data.remedy, "remedy", remedyTypes),
          scope: text(data.scope, "scope"),
          access_review: text(data.access_review, "access_review"),
          target_date: dateOnly(data.target_date, "target_date"),
          owner_id,
          context_hash: assessment.context_hash,
        };
        await insert(c, "warranty_resolution_plans", {
          id: pid,
          workspace_id: p.workspace_id,
          company_id: row.company_id,
          ...fields,
          content_hash: hash(fields),
          created_by: p.actor_id,
        });
        detail = { plan_id: pid, content_hash: hash(fields) };
        changes = { state: "Open" };
      } else if (action === "Goodwill" || action === "Authority") {
        const { plan, assessment } = await exactPlan(
          c,
          p,
          row,
          uuid(data.plan_id, "plan_id"),
        );
        const decision = choice(data.decision, "decision", [
          "Approved",
          "Declined",
        ] as const);
        if (action === "Authority" && decision === "Approved") {
          const asset = await assetSnapshot(c, p, row.asset_id);
          if (
            asset.identity_status !== "Verified" ||
            row.source.availability !== "Available"
          )
            conflict(
              "Work authority needs verified identity and available terms; goodwill cannot establish missing facts.",
            );
          const goodwill = (await history(c, p, id))
            .filter(
              (e) => e.action === "Goodwill" && e.content.plan_id === plan.id,
            )
            .at(-1);
          if (
            plan.remedy !== "Investigate" &&
            assessment.status !== "Covered" &&
            goodwill?.content.decision !== "Approved"
          )
            conflict(
              "This remedy needs covered entitlement or a separate approved goodwill decision for this exact plan.",
            );
        }
        detail = {
          plan_id: plan.id,
          content_hash: plan.content_hash,
          decision,
          authority_reference: text(
            data.authority_reference,
            "authority_reference",
          ),
          basis: text(data.basis, "basis"),
        };
      } else if (action === "UpdateCustomer") {
        const plan = await latestPlan(c, p, id);
        if (!plan) conflict("A reviewed remedy result is required.");
        const result = (
          await c.query<{ id: string }>(
            "SELECT r.id FROM ppo.maintenance_service_results r JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) WHERE r.workspace_id=$1 AND q.resolution_plan_id=$2 AND r.outcome='Completed' ORDER BY r.created_at DESC LIMIT 1",
            [p.workspace_id, plan.id],
          )
        ).rows[0];
        if (!result)
          conflict(
            "A completed reviewed Service result for the exact current remedy is required.",
          );
        await reviewedResult(c, p, result.id);
        const revision = Number(
            (
              await c.query(
                "SELECT coalesce(max(revision),0)+1 AS revision FROM ppo.warranty_customer_updates WHERE workspace_id=$1 AND case_id=$2",
                [p.workspace_id, id],
              )
            ).rows[0].revision,
          ),
          uid = randomUUID();
        const fields = {
          case_id: id,
          revision,
          result_id: result.id,
          recipient: label(data.recipient, "recipient", 200),
          content: text(data.content, "content"),
        };
        await insert(c, "warranty_customer_updates", {
          id: uid,
          workspace_id: p.workspace_id,
          ...fields,
          content_hash: hash(fields),
          created_by: p.actor_id,
        });
        detail = { update_id: uid, content_hash: hash(fields) };
        changes = { state: "Open" };
      } else if (action === "CustomerResponse") {
        const update = (
          await c.query<{ id: string; content_hash: string }>(
            "SELECT id,content_hash FROM ppo.warranty_customer_updates WHERE workspace_id=$1 AND case_id=$2 ORDER BY revision DESC LIMIT 1",
            [p.workspace_id, id],
          )
        ).rows[0];
        if (!update || update.id !== uuid(data.update_id, "update_id"))
          conflict("Record the response to the exact current customer update.");
        const response = choice(data.response, "response", responseStates),
          response_id = randomUUID();
        const followup_id =
          response === "Accepted"
            ? null
            : await followup(
                c,
                p,
                row,
                uuid(data.owner_id, "owner_id"),
                dateOnly(data.due_date, "due_date"),
                `Customer follow-up for ${row.reference}: ${text(data.next_action, "next_action")}`,
              );
        await insert(c, "warranty_customer_responses", {
          id: response_id,
          workspace_id: p.workspace_id,
          case_id: id,
          update_id: update.id,
          response,
          evidence: text(data.evidence, "evidence"),
          followup_id,
          created_by: p.actor_id,
        });
        detail = {
          response_id,
          update_id: update.id,
          content_hash: update.content_hash,
          response,
          followup_id,
        };
        changes = { state: "Open" };
      } else if (action === "ResolveCustomer") {
        const current = await latestPlan(c, p, id);
        if (!current) conflict("Review the current remedy first.");
        const replacement = (await history(c, p, id))
          .filter(
            (e) =>
              e.action === "ReviewReplacement" &&
              e.content.plan_id === current.id,
          )
          .at(-1);
        if (current.remedy === "Replace" && replacement) {
          const a = await record<Assessment>(
            c,
            p,
            "coverage",
            current.assessment_id,
          );
          await latestAssessment(c, p, a);
          const currentContext = await assessmentContext(c, p, a);
          if (
            hash({ ...currentContext, asset: a.context.asset }) !==
              a.context_hash ||
            hash(await assetSnapshot(c, p, row.asset_id)) !==
              hash(replacement.content.original_current)
          )
            conflict(
              "Replacement or failure evidence changed after the owned maintenance review.",
            );
        } else await exactPlan(c, p, row, current.id);
        const binding = (
          await c.query(
            `SELECT q.resolution_plan_id,r.outcome,r.id AS result_id FROM ppo.warranty_customer_updates u JOIN ppo.maintenance_service_results r ON (r.workspace_id,r.id)=(u.workspace_id,u.result_id) JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) WHERE u.workspace_id=$1 AND u.case_id=$2 ORDER BY u.revision DESC LIMIT 1`,
            [p.workspace_id, id],
          )
        ).rows[0];
        if (
          binding?.resolution_plan_id !== current.id ||
          binding.outcome !== "Completed"
        )
          conflict(
            "The current customer update must describe the exact completed current remedy.",
          );
        await reviewedResult(c, p, binding.result_id);
        const update = (
          await c.query<{ id: string; content_hash: string }>(
            "SELECT id,content_hash FROM ppo.warranty_customer_updates WHERE workspace_id=$1 AND case_id=$2 ORDER BY revision DESC LIMIT 1",
            [p.workspace_id, id],
          )
        ).rows[0];
        const response = update
          ? (
              await c.query<{ id: string; response: string }>(
                "SELECT id,response FROM ppo.warranty_customer_responses WHERE workspace_id=$1 AND case_id=$2 AND update_id=$3 ORDER BY created_at DESC,id DESC LIMIT 1",
                [p.workspace_id, id, update.id],
              )
            ).rows[0]
          : null;
        if (!update || !response || response.response !== "Accepted")
          conflict(
            "Customer resolution requires Accepted against the current reviewed remedy update.",
          );
        const followups = (
          await c.query<{ followup_id: string }>(
            "SELECT followup_id FROM ppo.warranty_customer_responses WHERE workspace_id=$1 AND case_id=$2 AND followup_id IS NOT NULL",
            [p.workspace_id, id],
          )
        ).rows;
        for (const f of followups) {
          const a = await visibleActivity(c, p, f.followup_id);
          if (a.status !== "Completed" || !a.outcome)
            conflict(
              "Complete each owned customer follow-up with an outcome before recording resolution.",
            );
        }
        detail = {
          update_id: update.id,
          response_id: response!.id,
          content_hash: update.content_hash,
          basis: text(data.basis, "basis"),
        };
        changes = { state: "Resolved" };
      } else if (action === "ReviewReplacement") {
        const change = await readEquipmentChange(
          c,
          p,
          uuid(data.equipment_change_id, "equipment_change_id"),
        );
        if (
          (await history(c, p, id)).some(
            (e) =>
              e.action === "ReviewReplacement" &&
              e.content.equipment_change_id === change.id,
          )
        )
          conflict(
            "This replacement already has an owned future-maintenance review.",
          );
        const plan = await latestPlan(c, p, id);
        if (
          !change ||
          change.asset_id !== row.asset_id ||
          change.kind !== "Replace" ||
          change.state !== "Applied" ||
          plan?.remedy !== "Replace"
        )
          conflict(
            "First review and apply the replacement through the canonical Equipment workflow.",
          );
        const result = (
          await c.query(
            "SELECT r.id FROM ppo.maintenance_service_results r JOIN ppo.maintenance_work_requests q ON (q.workspace_id,q.id)=(r.workspace_id,r.request_id) WHERE r.workspace_id=$1 AND q.resolution_plan_id=$2 AND r.outcome='Completed'",
            [p.workspace_id, plan.id],
          )
        ).rows[0];
        if (!result)
          conflict(
            "The exact replacement requires a completed reviewed Service result.",
          );
        await reviewedResult(c, p, result.id);
        const successor = await assetSnapshot(
          c,
          p,
          change.proposal.successor_id!,
        );
        const activity_id = await followup(
          c,
          p,
          row,
          uuid(data.owner_id, "owner_id"),
          dateOnly(data.due_date, "due_date"),
          `Review future maintenance after replacement of ${row.reference}. No automatic transfer.`,
          "TechnicalFollowUp",
        );
        detail = {
          equipment_change_id: data.equipment_change_id,
          plan_id: plan.id,
          original: row.asset_snapshot,
          original_current: await assetSnapshot(c, p, row.asset_id),
          successor,
          activity_id,
          result_id: result.id,
        };
      } else {
        const owner_id = uuid(data.owner_id, "owner_id");
        await owner(c, p, row, owner_id, "warranty.manage");
        changes = {
          owner_id,
          next_review: dateOnly(data.due_date, "due_date"),
          next_action: text(data.next_action, "next_action"),
        };
        detail = changes;
      }
      return bump(c, p, "cases", row, action, detail, cmd.reason, changes);
    },
    "WarrantyCase",
    "WarrantyChanged",
  );
}
