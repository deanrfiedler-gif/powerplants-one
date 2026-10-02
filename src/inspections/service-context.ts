import { incidentHolds } from "../incidents/holds";
import { createHash } from "node:crypto";
import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import {
  hasPermission,
  type QueryClient,
  type Capability,
} from "../platform/permissions";
import { canonical } from "../platform/operations";
import { visibleAppointment } from "../scheduling/planner";
import {
  fieldContext,
  attendanceContext,
  currentCaptureState,
} from "../field/context";
import { dispatchReadiness } from "../documents/packs";
import { visible } from "../shared/reads";
import { csRecord, sourceBasis } from "../shared/cs/service";
import { assessPreparation } from "../shared/cs/readiness";
import type { ReadinessContent } from "../shared/cs/model";
import type { CheckDefinition, Host } from "./model";
import {
  loadInspections,
  instrumentColumns,
  type InstrumentRow,
} from "./service";

export const hash = (v: unknown) =>
  createHash("sha256")
    .update(canonical(JSON.parse(JSON.stringify(v))))
    .digest("hex");
export const serviceHost = (id: string): Host => ({
  host_type: "ServiceAppointment",
  host_id: id,
});
export const stop = (code: string, message: string): never => {
  throw new AppError(422, code, message);
};
export type Mode = "capture" | "review";
export async function serviceInspectionAccess(
  c: QueryClient,
  p: Principal,
  id: string,
  mode: Mode,
  action?: string,
) {
  if (mode === "capture") {
    const cap: Capability = !action
      ? "field.read.own"
      : action === "submit"
        ? "field.completion.own"
        : "field.capture.own";
    const ctx = await fieldContext(c, p, id, cap);
    if (
      action &&
      !(await hasPermission(
        c,
        p,
        "field.capture.own",
        ctx.a.company_id,
        ctx.a.site_id,
      ))
    )
      throw unavailable();
    return ctx;
  }
  const cap: Capability =
    action === "release"
      ? "report.issue"
      : action
        ? "report.review"
        : "report.read";
  const ctx = await visibleAppointment(c, p, id, cap);
  if (
    !(await hasPermission(
      c,
      p,
      "report.read",
      ctx.a.company_id,
      ctx.a.site_id,
    )) ||
    !(await hasPermission(
      c,
      p,
      "service.work_order.edit",
      ctx.a.company_id,
      ctx.a.site_id,
    )) ||
    ctx.w.service_owner_id !== p.actor_id
  )
    throw unavailable();
  return ctx;
}
export async function requireCapture(c: QueryClient, p: Principal, id: string) {
  const row = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
      [p.workspace_id, id, p.actor_id],
    )
  ).rows[0];
  if (!row)
    stop(
      "AttendanceRequired",
      "Record your own actual attendance from My Jobs before inspecting.",
    );
  const ctx = await attendanceContext(c, p, id, row.id);
  if ((await currentCaptureState(c, p, ctx, true)) !== "Current")
    stop(
      "InspectionHeld",
      "Current scope, assignment, issued pack and readiness must permit this inspection.",
    );
  return ctx.attendance;
}
export type Template = {
  id: string;
  procedure_key: string;
  revision: number;
  title: string;
  source_reference: string;
  source_content: string;
  task_kinds: string[];
  checks: CheckDefinition[];
  retired: boolean;
};
export async function templates(c: QueryClient, p: Principal, company: string) {
  return (
    await c.query<Template>(
      `SELECT t.*,EXISTS(SELECT 1 FROM ppo.service_inspection_template_retirements r WHERE r.workspace_id=t.workspace_id AND r.template_id=t.id) AS retired
    FROM ppo.service_inspection_templates t WHERE t.workspace_id=$1 AND t.company_id=$2 ORDER BY t.procedure_key,t.revision`,
      [p.workspace_id, company],
    )
  ).rows;
}
export async function serviceBinding(
  c: QueryClient,
  p: Principal,
  appointment: string,
  template: Template,
  scopeItem: string,
  assetId: string,
  performer = p.actor_id,
) {
  const { a, w } = await visibleAppointment(c, p, appointment);
  const asset = await visible(c, p, "Asset", assetId);
  if (asset.company_id !== a.company_id || asset.site_id !== a.site_id)
    throw unavailable();
  const scope = (
    await c.query(
      `SELECT i.*,sa.configuration_id FROM ppo.scope_items i JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_item_id)=(i.workspace_id,i.id)
    WHERE i.workspace_id=$1 AND i.scope_revision_id=$2 AND i.id=$3 AND sa.asset_id=$4`,
      [p.workspace_id, a.scope_revision_id, scopeItem, assetId],
    )
  ).rows[0];
  if (!scope) throw unavailable();
  const configurations = (
    await c.query(
      `SELECT ac.*,
    EXISTS(SELECT 1 FROM ppo.asset_configuration_successions s WHERE s.workspace_id=ac.workspace_id AND s.predecessor_id=ac.id AND s.effective_at<=clock_timestamp()) AS superseded
    FROM ppo.asset_configurations ac WHERE workspace_id=$1 AND asset_id=$2 AND
      ($3::uuid IS NOT NULL AND id=$3 OR $3::uuid IS NULL AND valid_from<=clock_timestamp() AND (valid_to IS NULL OR valid_to>clock_timestamp()) AND NOT EXISTS(SELECT 1 FROM ppo.asset_configuration_successions s WHERE s.workspace_id=ac.workspace_id AND s.predecessor_id=ac.id AND s.effective_at<=clock_timestamp())) ORDER BY revision`,
      [p.workspace_id, assetId, scope.configuration_id],
    )
  ).rows;
  // A scope-pinned version wins. An unpinned task must have exactly one current
  // Equipment version, shown explicitly in the opening preview.
  const configuration = configurations.length === 1 ? configurations[0] : null;
  const pack =
    (
      await c.query(
        `SELECT k.id,k.status,k.current_issue_id,k.needs_review,i.output_hash FROM ppo.packs k LEFT JOIN ppo.pack_issues i ON i.workspace_id=k.workspace_id AND i.id=k.current_issue_id WHERE k.workspace_id=$1 AND k.appointment_id=$2`,
        [p.workspace_id, appointment],
      )
    ).rows[0] ?? null;
  const readiness = await dispatchReadiness(c, p, appointment, true, true);
  const sources = (
    await c.query<{ id: string }>(
      "SELECT id FROM ppo.site_readiness WHERE workspace_id=$1 AND site_id=$2 ORDER BY id",
      [p.workspace_id, a.site_id],
    )
  ).rows;
  const preparations = [];
  for (const s of sources) {
    const row = await csRecord(c, p, "Readiness", s.id),
      basis = await sourceBasis(c, p, "Readiness", row);
    const assessment = assessPreparation(
      row.content as ReadinessContent,
      {
        facility_ids: asset.facility_id ? [asset.facility_id] : [],
        activity: "Inspection",
        starts_at: a.start_at.toISOString(),
        ends_at: a.end_at.toISOString(),
        person_ids: [],
      },
      a.site_timezone,
      basis.reviews.map((r) => r.details.evidence_hash),
    );
    preparations.push({ id: s.id, basis, assessment });
  }
  const assessments = (
    await c.query(
      "SELECT id,criterion_code,outcome,scope_version,assessment_version,evidence_ref,valid_until FROM ppo.readiness_assessments WHERE workspace_id=$1 AND scope_revision_id=$2 AND (appointment_id IS NULL OR appointment_id=$3) ORDER BY id",
      [p.workspace_id, a.scope_revision_id, a.id],
    )
  ).rows;
  const attendance =
    (
      await c.query(
        "SELECT id,actor_id,captured_at,issue_id,issue_hash,assignment_id,assignment_version,scope_revision_id,scope_version FROM ppo.field_attendances WHERE workspace_id=$1 AND appointment_id=$2 AND actor_id=$3",
        [p.workspace_id, appointment, performer],
      )
    ).rows[0] ?? null;
  const blockers = [
    ...readiness.reasons,
    ...preparations.flatMap((x) => x.assessment.blockers),
  ];
  if (!preparations.length)
    blockers.push(
      "Site inspection preparation has no authoritative readiness source.",
    );
  if (template.retired) blockers.push("This template version is retired.");
  if (!template.task_kinds.includes(scope.task_kind))
    blockers.push("This procedure is not applicable to this work scope.");
  if (asset.identity_status !== "Verified")
    blockers.push("Equipment identity is not verified.");
  if (
    !configuration ||
    configuration.superseded ||
    new Date(configuration.valid_from) > new Date() ||
    (configuration.valid_to && new Date(configuration.valid_to) <= new Date())
  )
    blockers.push(
      "The exact in-scope equipment configuration is unavailable or no longer current.",
    );
  const snapshot = JSON.parse(
    JSON.stringify({
      appointment: {
        id: a.id,
        schedule_version: a.schedule_version,
        assignment_version: a.assignment_version,
        scope_revision_id: a.scope_revision_id,
        scope_version: a.scope_version,
        start_at: a.start_at,
        end_at: a.end_at,
        status: a.status,
        dispatch_hold: a.dispatch_hold,
        policy_version_id: a.policy_version_id,
        scheduling_policy_id: a.scheduling_policy_id,
      },
      work: {
        id: w.id,
        scope_revision_id: w.scope_revision_id,
        authorised_scope_revision_id: w.authorised_scope_revision_id,
        status: w.status,
      },
      scope,
      asset,
      configuration,
      pack,
      preparations,
      assessments,
      attendance,
      template: {
        id: template.id,
        procedure_key: template.procedure_key,
        revision: template.revision,
        source_reference: template.source_reference,
        source_content: template.source_content,
        checks: template.checks,
        retired: template.retired,
      },
    }),
  ) as Record<string, unknown>;
  return {
    snapshot,
    binding_hash: hash(snapshot),
    blockers,
    configuration_reference: configuration
      ? `${asset.display_number} · configuration ${configuration.revision} · ${configuration.id}`
      : null,
    timezone: a.site_timezone,
  };
}
export function boundChecks(
  t: Template,
  scope: string,
  asset: string,
): CheckDefinition[] {
  return t.checks.map((d) => ({
    ...d,
    key: hash([t.procedure_key, scope, asset, d.key]),
    scope_key: scope,
    criterion_source_id: t.id,
  }));
}
export async function loadServiceInspections(
  c: QueryClient,
  p: Principal,
  id: string,
  mode: Mode,
) {
  const ctx = await serviceInspectionAccess(c, p, id, mode);
  const loaded = await loadInspections(
    c,
    p,
    "ServiceAppointment",
    [id],
    new Date().toISOString().slice(0, 10),
  );
  const catalogue = await templates(c, p, ctx.a.company_id);
  const bindings = (
    await c.query<{
      attempt_id: string;
      template_id: string;
      scope_item_id: string;
      asset_id: string;
      snapshot: Record<string, unknown>;
      binding_hash: string;
    }>(
      "SELECT * FROM ppo.service_inspection_bindings WHERE workspace_id=$1 AND appointment_id=$2",
      [p.workspace_id, id],
    )
  ).rows;
  const attempts = [];
  for (const at of loaded.attempts) {
    const binding = bindings.find((b) => b.attempt_id === at.row.id),
      template = catalogue.find((t) => t.id === binding?.template_id);
    if (!binding || !template) continue; // Unbound legacy attempts are never promoted to a Service workflow.
    let current: Awaited<ReturnType<typeof serviceBinding>> | null = null;
    try {
      current = await serviceBinding(
        c,
        p,
        id,
        template,
        binding.scope_item_id,
        binding.asset_id,
        at.row.performer_id,
      );
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
    }
    const reasons = [
      ...(current?.blockers ?? ["Current source access is unavailable."]),
    ];
    if (current && current.binding_hash !== binding.binding_hash)
      reasons.push(
        "Appointment, preparation, template or equipment source changed; retained evidence requires reassessment.",
      );
    for (const i of at.instruments)
      if (at.row.state === "Submitted" && i.assessment !== "ValidAtUse")
        reasons.push(
          `${i.snapshot.reference}: ${i.reason ?? "calibration unverified"}`,
        );
    attempts.push({
      ...at,
      binding,
      applicability: reasons.length ? "ReassessmentRequired" : "Current",
      applicability_reasons: reasons,
    });
  }
  const targets = (
    await c.query<{
      scope_item_id: string;
      asset_id: string;
      task_description: string;
      task_kind: string;
    }>(
      `SELECT i.id AS scope_item_id,sa.asset_id,i.task_description,i.task_kind FROM ppo.scope_items i JOIN ppo.scope_assets sa ON (sa.workspace_id,sa.scope_item_id)=(i.workspace_id,i.id) WHERE i.workspace_id=$1 AND i.scope_revision_id=$2 ORDER BY i.sequence,sa.asset_id`,
      [p.workspace_id, ctx.a.scope_revision_id],
    )
  ).rows;
  const permittedTargets = [];
  for (const t of targets) {
    try {
      const a = await visible(c, p, "Asset", t.asset_id);
      permittedTargets.push({
        ...t,
        asset_reference: String(a.display_number),
      });
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
    }
  }
  const instruments = (
    await c.query<InstrumentRow>(
      `SELECT ${instrumentColumns} FROM ppo.inspection_instruments WHERE workspace_id=$1 AND company_id=$2 ORDER BY reference`,
      [p.workspace_id, ctx.a.company_id],
    )
  ).rows;
  const outputs = (
    await c.query<{
      id: string;
      attempt_id: string;
      review_id: string;
      manifest_hash: string;
      issued_at: Date;
      bundle: Record<string, unknown>;
    }>(
      "SELECT id,attempt_id,review_id,manifest_hash,issued_at,bundle FROM ppo.service_inspection_outputs WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY issued_at",
      [p.workspace_id, id],
    )
  ).rows;
  const events = (
    await c.query(
      "SELECT actor_id,action,details,recorded_at FROM ppo.service_inspection_events WHERE workspace_id=$1 AND appointment_id=$2 ORDER BY recorded_at,id",
      [p.workspace_id, id],
    )
  ).rows;
  return {
    actor_id: p.actor_id,
    appointment: ctx.a,
    work_order: ctx.w,
    catalogue,
    targets: permittedTargets,
    instruments,
    attempts,
    defects: loaded.defects,
    links: loaded.links,
    outputs,
    incident_holds:await incidentHolds(c,p,id),
    events,
    mode,
  };
}
