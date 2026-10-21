import { randomUUID, createHash } from "node:crypto";
import type { Principal } from "../../platform/identity";
import { transaction } from "../../platform/database";
import { AppError, unavailable } from "../../platform/errors";
import { canonical, sharedOperation } from "../../platform/operations";
import {
  hasPermission,
  requireCapability,
  type QueryClient,
} from "../../platform/permissions";
import { companyContext, scopedOwner } from "../../shared/authority";
import {
  common,
  commonKeys,
  instant,
  invalid,
  narrative,
  object,
  optionalNarrative,
  uuid,
} from "../../shared/validation";
import {
  activityLinks,
  authoriseActivityInput,
  insertActivity,
  mutateActivity,
  type ActivityInput,
} from "../../activities/activities";
import { activityRequirements } from "../../activities/requirements";
import { authorise, candidateSql, project, type Candidate } from "./sources";
import { findingKey, isOverdue } from "./model";

export const nextActionCommand = "ServiceFinding:SetNextAction";
export function nextActionInput(key: string, input: unknown) {
  const r = object(input, [
    ...commonKeys,
    "source_token",
    "expected_version",
    "owner_id",
    "due_at",
    "instruction",
    "required_evidence",
  ]);
  const parsed = findingKey(key);
  if (
    typeof r.source_token !== "string" ||
    !/^[a-f0-9]{64}$/.test(r.source_token)
  )
    invalid("source_token", "Reload the finding before saving.");
  if (
    typeof r.expected_version !== "number" ||
    !Number.isSafeInteger(r.expected_version) ||
    r.expected_version < 0
  )
    invalid(
      "expected_version",
      "Use the current Activity version, or zero when no Activity exists.",
    );
  if (r.required_evidence === undefined)
    invalid(
      "required_evidence",
      "State the evidence needed, or explicitly use null.",
    );
  return {
    ...common(r),
    source: parsed.source,
    source_id: parsed.id,
    source_token: r.source_token,
    expected_version: r.expected_version,
    owner_id: uuid(r.owner_id, "owner_id"),
    due_at: instant(r.due_at, "due_at"),
    instruction: narrative(r.instruction, "instruction", 2000),
    required_evidence: optionalNarrative(
      r.required_evidence,
      "required_evidence",
      4000,
    ),
  };
}

async function sourceContext(c: QueryClient, p: Principal, key: string) {
  await requireCapability(c, p, "shared.read");
  await requireCapability(c, p, "service.work_order.read");
  await requireCapability(c, p, "schedule.read");
  const parsed = findingKey(key);
  const source = (
    await c.query<Candidate>(
      `SELECT * FROM (${candidateSql}) f WHERE source=$2 AND id=$3::uuid`,
      [p.workspace_id, parsed.source, parsed.id],
    )
  ).rows[0];
  if (!source) throw unavailable();
  const authority = await authorise(c, p, source);
  const item = await project(c, p, source);
  // Retain native state/versions, including report successors, response corrections
  // and incident evidence acceptance. Activity freshness is checked separately.
  const native = (
    await c.query<{ snapshot: unknown }>(
      `SELECT CASE $2::text
    WHEN 'inspection' THEN (SELECT to_jsonb(d) FROM ppo.inspection_defects d WHERE workspace_id=$1 AND id=$3)
    WHEN 'incident' THEN (SELECT jsonb_build_object('action',to_jsonb(a),'incident',to_jsonb(i)) FROM ppo.incident_actions a JOIN ppo.incidents i ON (i.workspace_id,i.id)=(a.workspace_id,a.incident_id) WHERE a.workspace_id=$1 AND a.id=$3)
    WHEN 'completion' THEN (SELECT jsonb_build_object('revision',to_jsonb(r),'report',to_jsonb(s)) FROM ppo.report_revisions r JOIN ppo.service_reports s ON (s.workspace_id,s.id)=(r.workspace_id,r.report_id) WHERE r.workspace_id=$1 AND r.id=$3)
    WHEN 'response' THEN (SELECT jsonb_build_object('response',to_jsonb(r),'report',to_jsonb(s),'superseded',EXISTS(SELECT 1 FROM ppo.customer_response_contexts x WHERE x.workspace_id=r.workspace_id AND x.supersedes_response_id=r.id)) FROM ppo.customer_responses r JOIN ppo.service_reports s ON (s.workspace_id,s.id)=(r.workspace_id,r.report_id) WHERE r.workspace_id=$1 AND r.id=$3)
    WHEN 'schedule' THEN (SELECT to_jsonb(f) FROM ppo.schedule_follow_ups f WHERE workspace_id=$1 AND activity_id=$3)
    END AS snapshot`,
      [p.workspace_id, source.source, source.id],
    )
  ).rows[0].snapshot;
  const source_token = createHash("sha256")
    .update(
      canonical(
        JSON.parse(
          JSON.stringify({
            source: source.source,
            id: source.id,
            parent: source.parent_id,
            native,
            appointment: authority.ctx.a,
            work_order: authority.ctx.w,
            equipment: authority.equipment,
          }),
        ),
      ),
    )
    .digest("hex");
  return { source, authority, item, source_token };
}
async function writeAuthority(c: QueryClient, p: Principal, key: string) {
  const ctx = await sourceContext(c, p, key);
  await companyContext(
    c,
    p,
    ctx.item.company_id,
    ctx.item.site.id,
    "service.work_order.edit",
  );
  await companyContext(
    c,
    p,
    ctx.item.company_id,
    ctx.item.site.id,
    "activity.edit",
  );
  return ctx;
}
function blocked(ctx: Awaited<ReturnType<typeof sourceContext>>) {
  if (["Closed", "Superseded"].includes(ctx.item.state))
    return "SourceDispositionRequired";
  if (
    ctx.authority.activity &&
    !["Open", "InProgress"].includes(ctx.authority.activity.status)
  )
    return "ActivityDispositionRequired";
  return null;
}
export async function readNextAction(
  p: Principal,
  key: string,
  input: unknown = {},
) {
  object(input, []);
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    const ctx = await sourceContext(c, p, key);
    const now = (await c.query<{ now: Date }>("SELECT clock_timestamp() now"))
      .rows[0].now;
    ctx.item.overdue = isOverdue(ctx.item, now);
    const permitted =
      (await hasPermission(
        c,
        p,
        "service.work_order.edit",
        ctx.item.company_id,
        ctx.item.site.id,
      )) &&
      (await hasPermission(
        c,
        p,
        "activity.edit",
        ctx.item.company_id,
        ctx.item.site.id,
      ));
    return {
      item: ctx.item,
      source_token: ctx.source_token,
      expected_version: ctx.item.action?.version ?? 0,
      can_edit: permitted && !blocked(ctx),
      blocked_reason: permitted ? blocked(ctx) : "ViewOnly",
      synthetic: true,
    };
  });
}
export async function setNextAction(p: Principal, key: string, input: unknown) {
  const command = nextActionInput(key, input);
  return sharedOperation(
    p,
    command,
    nextActionCommand,
    (c) => writeAuthority(c, p, key),
    async (c, ctx) => {
      if (ctx.source_token !== command.source_token)
        throw new AppError(
          409,
          "FindingChanged",
          "The source changed. Keep your entries and reload the finding.",
        );
      if ((ctx.authority.activity?.version ?? 0) !== command.expected_version)
        throw new AppError(
          409,
          "VersionConflict",
          "This Activity changed. Keep your entries and compare its current version.",
        );
      const reason = blocked(ctx);
      if (reason)
        throw new AppError(
          422,
          reason,
          "Use the owning workflow to resolve this source or terminal Activity.",
        );
      const a = ctx.authority.activity;
      const changes = {
        owner_id: command.owner_id,
        summary: command.instruction,
        due_at: command.due_at,
        due_needed: false,
        due_date_only: false,
      };
      const fields: ActivityInput = a
        ? { ...a, ...changes, links: await activityLinks(c, p, a.id) }
        : {
            id: randomUUID(),
            company_id: ctx.item.company_id,
            site_id: ctx.item.site.id,
            kind: "TechnicalFollowUp",
            access_class: "RestrictedService",
            ...changes,
            links: [
              { object_type: "Site", object_id: ctx.item.site.id },
              ...(ctx.item.equipment
                ? [
                    {
                      object_type: "Asset" as const,
                      object_id: ctx.item.equipment.id,
                    },
                  ]
                : []),
            ],
          };
      await authoriseActivityInput(c, p, fields);
      const owner = await scopedOwner(
        c,
        p,
        fields.owner_id,
        fields.company_id,
        fields.site_id ?? undefined,
        "activity.edit",
      );
      await authorise(c, owner, ctx.source);
      const previousEvidence = a
        ? await activityRequirements(c, p, a.id)
        : null;
      const result = a
        ? await mutateActivity(
            c,
            p,
            a,
            command.expected_version,
            changes,
            "update",
          )
        : await insertActivity(c, p, fields);
      await c.query(
        `INSERT INTO ppo.service_finding_activity_bindings(workspace_id,source,source_id,parent_id,activity_id)
        VALUES($1,$2,$3,$4,$5) ON CONFLICT(workspace_id,source,source_id) DO NOTHING`,
        [
          p.workspace_id,
          ctx.source.source,
          ctx.source.id,
          ctx.source.parent_id,
          result.id,
        ],
      );
      await c.query(
        `INSERT INTO ppo.service_finding_action_details(workspace_id,activity_id,required_evidence,updated_by)
        VALUES($1,$2,$3,$4) ON CONFLICT(workspace_id,activity_id) DO UPDATE SET
        required_evidence=EXCLUDED.required_evidence,updated_by=EXCLUDED.updated_by,updated_at=clock_timestamp()`,
        [p.workspace_id, result.id, command.required_evidence, p.actor_id],
      );
      return {
        ...result,
        audit_details: {
          ...result.audit_details,
          finding_key: `${command.source}:${command.source_id}`,
          source_token: command.source_token,
          before: a
            ? {
                ...result.audit_details.before,
                required_evidence: previousEvidence,
              }
            : null,
          after: {
            ...(result.audit_details?.after ?? {
              ...changes,
              status: result.state,
            }),
            required_evidence: command.required_evidence,
          },
        },
      };
    },
    "Activity",
    command.expected_version === 0 ? "ActivityCreated" : "ActivityUpdated",
  );
}

// Receipt lookup must retain the original source's current authority, not merely
// generic Activity edit permission. It is actor-private in the caller.
export async function nextActionReceiptAuthority(
  c: QueryClient,
  p: Principal,
  activityId: string,
  operationId: string,
) {
  const audit = (
    await c.query<{ key: string }>(
      `SELECT details->>'finding_key' AS key FROM ppo.audit_events
    WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3 AND object_type='Activity' AND object_id=$4
    AND details->>'command'=$5 AND outcome='Accepted'`,
      [p.workspace_id, p.actor_id, operationId, activityId, nextActionCommand],
    )
  ).rows[0];
  if (!audit) throw unavailable();
  const ctx = await writeAuthority(c, p, audit.key);
  if (ctx.authority.activity?.id !== activityId) throw unavailable();
}
