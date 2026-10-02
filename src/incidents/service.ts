import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import type { QueryClient } from "../platform/permissions";
import { hasPermission } from "../platform/permissions";
import { sharedOperation } from "../platform/operations";
import { AppError, unavailable } from "../platform/errors";
import { visible } from "../shared/reads";
import { scopedOwner } from "../shared/authority";
import {
  authoriseActivityInput,
  insertActivity,
  visibleActivity,
  type ActivityInput,
} from "../activities/activities";
import { digest, documentStore } from "../documents/store";
import { inspectPng } from "../field/media";
import { evidenceBytes } from "../inspections/service";
import { loadServiceInspections } from "../inspections/service-context";
import {
  prepareBundle,
  readBundle,
} from "../engineering/commissioning/outputs";
import { escapeHtml } from "../documents/render";
import { parse } from "./validation";
import {
  access,
  closedEvidenceCurrent,
  appointmentAccess,
  binding,
  latestBinding,
  hash,
  refuse,
} from "./context";
import { policy, type Incident, type Evidence, type Action } from "./model";

async function incidentOwner(
  c: QueryClient,
  p: Principal,
  id: string,
  row: Incident,
) {
  const owner = await scopedOwner(
    c,
    p,
    id,
    row.company_id,
    row.site_id,
    "incident.report",
  );
  await appointmentAccess(c, owner, row.appointment_id, "incident.report");
  return owner;
}
export async function fileBytes(p: Principal, e: Evidence) {
  return evidenceBytes(p, {
    storage_id: e.id,
    content_hash: e.content_hash,
    byte_count: e.byte_count,
  });
}
async function graph(c: QueryClient, p: Principal, id: string) {
  const actions = (
    await c.query<Action & { owner_id: string; due_at: Date }>(
      "SELECT * FROM ppo.incident_actions WHERE workspace_id=$1 AND incident_id=$2 ORDER BY id",
      [p.workspace_id, id],
    )
  ).rows;
  const evidence = (
    await c.query<Evidence>(
      "SELECT * FROM ppo.incident_evidence WHERE workspace_id=$1 AND incident_id=$2 ORDER BY added_at,id",
      [p.workspace_id, id],
    )
  ).rows;
  const tasks = [];
  for (const a of actions) {
    const t = await visibleActivity(c, p, a.activity_id);
    tasks.push({
      ...a,
      activity: {
        id: t.id,
        version: t.version,
        owner_id: t.owner_id,
        due_at: t.due_at,
        status: t.status,
        overdue:
          t.status !== "Completed" &&
          !!t.due_at &&
          t.due_at.getTime() < Date.now(),
      },
      assignment_current:
        a.owner_id === t.owner_id &&
        a.due_at.toISOString() === t.due_at?.toISOString(),
    });
  }
  return { actions: tasks, evidence };
}
async function reviewedContent(c: QueryClient, p: Principal, row: Incident) {
  const b = await latestBinding(c, p, row.id),
    current = await binding(
      c,
      p,
      row.appointment_id,
      b.scope_item_id,
      b.asset_id,
    ),
    g = await graph(c, p, row.id);
  const linked = row.defect_id
    ? (
        await c.query(
          "SELECT id,state,closed_by_attempt_id,closed_review_id FROM ppo.inspection_defects WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, row.defect_id],
        )
      ).rows[0]
    : null;
  return {
    policy,
    facts: row.facts,
    assessment: row.assessment,
    priority: row.priority,
    owner_id: row.owner_id,
    due_at: row.due_at,
    binding: b,
    source_hash: current.source_hash,
    known: current.known,
    actions: g.actions,
    evidence: g.evidence,
    linked,
  };
}
async function independent(c: QueryClient, p: Principal, row: Incident) {
  const g = await graph(c, p, row.id);
  if (
    row.reporter_id === p.actor_id ||
    g.actions.some((a) => a.owner_id === p.actor_id) ||
    g.evidence.some((e) => e.added_by === p.actor_id)
  )
    refuse(
      "IndependentReviewRequired",
      "The reporter, action owner and evidence contributors cannot accept or close this incident.",
    );
}
async function closurePrerequisites(
  c: QueryClient,
  p: Principal,
  row: Incident,
) {
  await independent(c, p, row);
  const v = await reviewedContent(c, p, row);
  if (v.source_hash !== v.binding.source_hash || !v.known)
    refuse(
      "SourceChanged",
      "Review the current exact scope and configuration; rebind explicitly before acceptance.",
    );
  if (
    row.assessment !== "Assessed" ||
    row.priority === "Unknown" ||
    row.facts.classification === "Unknown" ||
    !row.owner_id ||
    !row.due_at
  )
    refuse(
      "AssessmentRequired",
      "Known classification, assessment, priority, owner and due date are required.",
    );
  await incidentOwner(c, p, row.owner_id!, row);
  if (
    !v.actions.length ||
    v.actions.some(
      (a) =>
        !a.assignment_current ||
        a.activity.status !== "Completed" ||
        !a.accepted_evidence_id ||
        !a.accepted_by,
    )
  )
    refuse(
      "ActionsIncomplete",
      "Every corrective action needs completed owned work and independently accepted evidence. Changed assignments require fresh review.",
    );
  for (const a of v.actions) {
    await incidentOwner(c, p, a.owner_id, row);
    try {
      await access(c, { ...p, actor_id: a.accepted_by! }, row.id, "accept");
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      refuse(
        "ReviewerAuthorityChanged",
        "Corrective evidence needs acceptance by a currently authorised reviewer.",
      );
    }
    const e = v.evidence.find(
      (e) => e.id === a.accepted_evidence_id && e.action_id === a.id,
    );
    if (!e || e.added_by === a.accepted_by || a.owner_id === a.accepted_by)
      refuse(
        "EvidenceRequired",
        "Exact independent corrective evidence is required.",
      );
  }
  if (row.state === "Accepted" && row.accepted_by) {
    try {
      await access(c, { ...p, actor_id: row.accepted_by }, row.id, "accept");
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      refuse(
        "ReviewerAuthorityChanged",
        "The closure reviewer no longer has current record authority.",
      );
    }
  }
  if (!v.evidence.length)
    refuse("EvidenceRequired", "Retained evidence is required for closure.");
  for (const e of v.evidence) await fileBytes(p, e);
  if (row.defect_id) {
    const inspections = await loadServiceInspections(
      c,
      p,
      row.appointment_id,
      "review",
    );
    const d = inspections.defects.find((d) => d.id === row.defect_id);
    const retest = inspections.attempts.find(
      (a) => a.row.id === d?.closed_by_attempt_id,
    );
    if (
      !d ||
      d.state !== "Closed" ||
      !retest ||
      retest.review !== "Accepted" ||
      retest.applicability !== "Current"
    )
      refuse(
        "DefectRetestRequired",
        "The linked inspection defect needs its own current independently accepted correction and retest.",
      );
  }
  return v;
}

export async function incidentCommand(p: Principal, input: unknown) {
  const cmd = parse(input);
  // Free text reasons are retained only in the protected event, never generic
  // audit/outbox/receipt surfaces. Hash the original reason nevertheless.
  const original = {
    ...cmd,
    original_reason: cmd.reason,
    reason: "FI-06 incident command",
  };
  return sharedOperation(
    p,
    original,
    `Incident:${cmd.action}`,
    async (c) => {
      if (cmd.action === "create")
        return {
          ctx: await appointmentAccess(
            c,
            p,
            cmd.appointment_id,
            "incident.report",
          ),
          row: null,
        };
      const v = await access(c, p, cmd.id, cmd.action);
      if (["accept_action", "accept", "close"].includes(cmd.action))
        await independent(c, p, v.row);
      if (cmd.action === "evidence") {
        const action = cmd.action_id
          ? (await graph(c, p, cmd.id)).actions.find(
              (a) => a.id === cmd.action_id,
            )
          : null;
        if (
          v.row.reporter_id !== p.actor_id &&
          action?.activity.owner_id !== p.actor_id
        )
          throw unavailable();
        if (cmd.audience === "Restricted" && !v.sensitive) throw unavailable();
      }
      return { ctx: v, row: v.row };
    },
    async (c, auth) => {
      let row = auth.row;
      const addBinding = async (b: Awaited<ReturnType<typeof binding>>) => {
        await c.query(
          "INSERT INTO ppo.incident_bindings(id,workspace_id,incident_id,sequence,scope_item_id,asset_id,snapshot,source_hash,recorded_by) SELECT $1,$2,$3,COALESCE(MAX(sequence),0)+1,$4,$5,$6,$7,$8 FROM ppo.incident_bindings WHERE workspace_id=$2 AND incident_id=$3",
          [
            randomUUID(),
            p.workspace_id,
            cmd.id,
            b.scope_item_id,
            b.asset_id,
            JSON.stringify(b.snapshot),
            b.source_hash,
            p.actor_id,
          ],
        );
      };
      const update = async (fields: Record<string, unknown>) => {
        const entries = Object.entries(fields);
        row = (
          await c.query<Incident>(
            `UPDATE ppo.incidents SET ${entries.map(([k], i) => `${k}=$${i + 3}`).join(",")},version=version+1,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *`,
            [p.workspace_id, cmd.id, ...entries.map(([, v]) => v)],
          )
        ).rows[0];
      };
      let details: Record<string, unknown> = {};
      if (cmd.action === "create") {
        const b = await binding(
          c,
          p,
          cmd.appointment_id,
          cmd.scope_item_id,
          cmd.asset_id,
        );
        if (b.source_hash !== cmd.source_hash)
          refuse(
            "SourceChanged",
            "The selected source changed. Refresh context before reporting.",
          );
        row = (
          await c.query<Incident>(
            "INSERT INTO ppo.incidents(id,workspace_id,company_id,site_id,appointment_id,work_order_id,reporter_id,facts) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *",
            [
              cmd.id,
              p.workspace_id,
              auth.ctx.a.company_id,
              auth.ctx.a.site_id,
              cmd.appointment_id,
              auth.ctx.w.id,
              p.actor_id,
              JSON.stringify(cmd.facts),
            ],
          )
        ).rows[0];
        await addBinding(b);
      } else {
        if (!row) throw unavailable();
        if (row.version !== cmd.expected_version)
          throw new AppError(
            409,
            "VersionConflict",
            "This incident changed. Preserve your input, refresh the saved record and reconcile it before a new command.",
          );
        if (row.state === "Closed" && cmd.action !== "reopen")
          refuse(
            "IncidentClosed",
            "Reopen with a reason before changing this retained closed incident.",
          );
        if (
          row.state === "Draft" &&
          !["save", "submit", "evidence"].includes(cmd.action)
        )
          refuse(
            "SubmissionRequired",
            "Submit the factual report before review or owned corrective work.",
          );
        const changes: Record<string, unknown> = {
          accepted_hash: null,
          accepted_by: null,
        };
        if (row.state === "Accepted") changes.state = "InReview";
        if (cmd.action === "save") {
          changes.facts = JSON.stringify(cmd.facts);
          if (row.state !== "Draft") changes.state = "Submitted";
        } else if (cmd.action === "submit") {
          if (
            row.state !== "Draft" &&
            row.state !== "Returned" &&
            row.state !== "ClarificationRequired"
          )
            refuse(
              "InvalidTransition",
              "Only a draft or returned report can be submitted.",
            );
          changes.state = "Submitted";
          changes.hold = true;
        } else if (cmd.action === "triage") {
          await incidentOwner(c, p, cmd.owner_id, row);
          if (row.hold && !cmd.hold)
            refuse(
              "ClosureRequired",
              "An existing incident hold is removed only by independently reviewed closure.",
            );
          Object.assign(changes, {
            owner_id: cmd.owner_id,
            due_at: cmd.due_at,
            assessment: cmd.assessment,
            priority: cmd.priority,
            hold: cmd.hold,
            state: "InReview",
          });
        } else if (cmd.action === "review") {
          changes.state = cmd.decision;
          if (cmd.decision === "OnHold") changes.hold = true;
        } else if (cmd.action === "reopen") {
          if (row.state !== "Closed")
            refuse(
              "InvalidTransition",
              "Only a closed incident can be reopened.",
            );
          changes.state = "OnHold";
          changes.hold = true;
          await c.query(
            "UPDATE ppo.incident_actions SET accepted_evidence_id=NULL,accepted_by=NULL WHERE workspace_id=$1 AND incident_id=$2",
            [p.workspace_id, row.id],
          );
        } else if (cmd.action === "rebind") {
          const b = await binding(
            c,
            p,
            row.appointment_id,
            cmd.scope_item_id,
            cmd.asset_id,
          );
          if (b.source_hash !== cmd.source_hash)
            refuse(
              "SourceChanged",
              "Refresh the selected exact sources before rebinding.",
            );
          await addBinding(b);
          changes.state = "OnHold";
          changes.hold = true;
        } else if (cmd.action === "link") {
          if (cmd.repeated_report_id) {
            const linked = await access(c, p, cmd.repeated_report_id);
            if (linked.row.id === row.id || linked.row.site_id !== row.site_id)
              throw unavailable();
          }
          if (cmd.defect_id) {
            const b = await latestBinding(c, p, row.id);
            const d = (
              await c.query(
                "SELECT d.id FROM ppo.inspection_defects d JOIN ppo.service_inspection_bindings b ON b.workspace_id=d.workspace_id AND b.attempt_id=d.source_attempt_id WHERE d.workspace_id=$1 AND d.id=$2 AND d.host_id=$3 AND b.scope_item_id=$4 AND b.asset_id=$5",
                [
                  p.workspace_id,
                  cmd.defect_id,
                  row.appointment_id,
                  b.scope_item_id,
                  b.asset_id,
                ],
              )
            ).rows[0];
            if (!d) throw unavailable();
          }
          Object.assign(changes, {
            repeated_report_id: cmd.repeated_report_id,
            defect_id: cmd.defect_id,
          });
        } else if (cmd.action === "action") {
          await incidentOwner(c, p, cmd.owner_id, row);
          const activity: ActivityInput = {
            id: randomUUID(),
            company_id: row.company_id,
            site_id: row.site_id,
            kind: "TechnicalFollowUp",
            owner_id: cmd.owner_id,
            summary: `Incident corrective work. Review permitted instructions: /service/incidents/${row.id}`,
            due_at: cmd.due_at,
            due_needed: false,
            access_class: "RestrictedService",
            links: [{ object_type: "Site", object_id: row.site_id }],
          };
          await authoriseActivityInput(c, p, activity);
          await insertActivity(c, p, activity);
          await c.query(
            "INSERT INTO ppo.incident_actions(id,workspace_id,incident_id,activity_id,instruction,owner_id,due_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
            [
              cmd.action_id,
              p.workspace_id,
              row.id,
              activity.id,
              cmd.instruction,
              cmd.owner_id,
              cmd.due_at,
            ],
          );
          details = { action_id: cmd.action_id, activity_id: activity.id };
        } else if (cmd.action === "adopt_assignment") {
          const a = (await graph(c, p, row.id)).actions.find(
            (a) => a.id === cmd.action_id,
          );
          if (
            !a ||
            a.activity.version !== cmd.activity_version ||
            !a.activity.due_at
          )
            throw unavailable();
          await incidentOwner(c, p, a.activity.owner_id, row);
          await c.query(
            "UPDATE ppo.incident_actions SET owner_id=$3,due_at=$4,accepted_evidence_id=NULL,accepted_by=NULL WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, a.id, a.activity.owner_id, a.activity.due_at],
          );
          details = { action_id: a.id, activity: a.activity };
        } else if (cmd.action === "evidence") {
          if (
            cmd.action_id &&
            !(await graph(c, p, row.id)).actions.some(
              (a) => a.id === cmd.action_id,
            )
          )
            throw unavailable();
          const bytes = Buffer.from(cmd.content_base64, "base64");
          if (bytes.length !== cmd.byte_count || digest(bytes) !== cmd.sha256)
            refuse(
              "EvidenceHashMismatch",
              "The original bytes do not match the declared size and hash.",
            );
          try {
            if (cmd.media_type === "image/png") inspectPng(bytes);
            else {
              if (bytes.length > 65536 || bytes.includes(0)) throw Error();
              new TextDecoder("utf-8", { fatal: true }).decode(bytes);
            }
          } catch {
            refuse(
              "UnsupportedEvidence",
              "Use a verified PNG or UTF-8 plain text up to 64 KiB.",
            );
          }
          await documentStore().store(
            {
              workspace_id: p.workspace_id,
              actor_id: p.actor_id,
              operation_id: cmd.evidence_id,
            },
            bytes,
            cmd.sha256,
          );
          await c.query(
            "INSERT INTO ppo.incident_evidence(id,workspace_id,incident_id,action_id,audience,label,media_type,byte_count,content_hash,added_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
            [
              cmd.evidence_id,
              p.workspace_id,
              row.id,
              cmd.action_id,
              cmd.audience,
              cmd.label,
              cmd.media_type,
              cmd.byte_count,
              cmd.sha256,
              p.actor_id,
            ],
          );
          if (cmd.action_id)
            await c.query(
              "UPDATE ppo.incident_actions SET accepted_evidence_id=NULL,accepted_by=NULL WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, cmd.action_id],
            );
          details = { evidence_id: cmd.evidence_id };
        } else if (cmd.action === "accept_action") {
          await independent(c, p, row);
          const g = await graph(c, p, row.id),
            a = g.actions.find((a) => a.id === cmd.action_id),
            e = g.evidence.find(
              (e) => e.id === cmd.evidence_id && e.action_id === cmd.action_id,
            );
          if (!a || !e) throw unavailable();
          if (!a.assignment_current || a.activity.status !== "Completed")
            refuse(
              "ActionIncomplete",
              "Complete the owned Activity and review any changed assignment before accepting its evidence.",
            );
          const reset = (
            await c.query(
              "SELECT MAX(recorded_at) AS at FROM ppo.incident_events WHERE workspace_id=$1 AND incident_id=$2 AND (action='reopen' OR action='adopt_assignment' AND snapshot->'details'->>'action_id'=$3)",
              [p.workspace_id, row.id, a.id],
            )
          ).rows[0].at;
          if (
            e.added_by !== a.activity.owner_id ||
            (reset && e.added_at <= reset)
          )
            refuse(
              "FreshCorrectiveEvidenceRequired",
              "The current action owner must append fresh evidence after reassignment or reopening.",
            );
          await fileBytes(p, e);
          await c.query(
            "UPDATE ppo.incident_actions SET accepted_evidence_id=$3,accepted_by=$4 WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, a.id, e.id, p.actor_id],
          );
          details = {
            action_id: a.id,
            evidence_id: e.id,
            evidence_hash: e.content_hash,
          };
        } else if (cmd.action === "accept") {
          const v = await closurePrerequisites(c, p, row);
          Object.assign(changes, {
            state: "Accepted",
            accepted_hash: hash(v),
            accepted_by: p.actor_id,
          });
          details = { review_hash: hash(v), policy };
        } else if (cmd.action === "close") {
          const v = await closurePrerequisites(c, p, row);
          if (
            row.state !== "Accepted" ||
            row.accepted_hash !== hash(v) ||
            !row.accepted_by ||
            !(await hasPermission(
              c,
              { ...p, actor_id: row.accepted_by },
              "incident.review",
              row.company_id,
              row.site_id,
            )) ||
            !(await hasPermission(
              c,
              { ...p, actor_id: row.accepted_by },
              "incident.sensitive",
              row.company_id,
              row.site_id,
            ))
          )
            refuse(
              "FreshAcceptanceRequired",
              "Close only the exact current independently accepted record under current reviewer authority.",
            );
          const outputId = cmd.operation_id;
          const manifest = {
            schema_version: 1,
            synthetic: true,
            policy,
            audience: "Internal",
            incident_id: row.id,
            review_hash: row.accepted_hash,
            reviewer_id: row.accepted_by,
            closure_by: p.actor_id,
            scope: {
              appointment_id: row.appointment_id,
              work_order_id: row.work_order_id,
              company_id: row.company_id,
              site_id: row.site_id,
              scope_item_id: v.binding.scope_item_id,
              asset_id: v.binding.asset_id,
              source_hash: v.source_hash,
            },
            summary: row.facts.summary,
            occurred_at: row.facts.occurred_at,
            reported_at: row.reported_at,
            classification: row.facts.classification,
            assessment: row.assessment,
            actions: v.actions.map((a) => ({
              id: a.id,
              activity_id: a.activity_id,
              status: a.activity.status,
              evidence_id: v.evidence.some(
                (e) =>
                  e.id === a.accepted_evidence_id &&
                  e.audience === "Operational",
              )
                ? a.accepted_evidence_id
                : null,
              reviewer_id: a.accepted_by,
            })),
            evidence: v.evidence
              .filter((e) => e.audience === "Operational")
              .map((e) => ({
                id: e.id,
                label: e.label,
                hash: e.content_hash,
                added_by: e.added_by,
              })),
            linked_inspection: v.linked,
            exclusions: [
              "Restricted incident facts and evidence",
              "All other incidents and inspection defects",
              "Operational safety, regulatory reporting and equipment control",
              "Appointment, work-order, project, customer and Finance completion",
            ],
            remaining_work:
              "Recheck all current readiness, assignment, scheduling and inspection restrictions in their receiving domains.",
          };
          const bundle = await prepareBundle(p, {
            output_id: outputId,
            kind: "IncidentOutcome",
            audience: "Internal",
            manifest_hash: hash(manifest),
            template_version: "FI-06 scoped incident outcome 1",
            head: "Powerplants One — scoped incident outcome",
            foot: "Internal — synthetic",
            html: () =>
              `<!doctype html><html lang="en"><meta charset="utf-8"><title>Scoped incident outcome</title><style>body{font:16px/1.5 Verdana;margin:24px}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><main><h1>Scoped incident outcome</h1><p>Synthetic prototype — not for operational use. This closes only the identified incident; it grants no permission to proceed.</p><h2>${escapeHtml(manifest.summary)}</h2><p>Classification: ${escapeHtml(manifest.classification)}. Assessment: ${escapeHtml(manifest.assessment)}. All listed corrective Activities were completed and their exact evidence independently accepted.</p><h2>Affected scope</h2><p>Work order ${escapeHtml(auth.ctx.w.display_number)} · appointment ${escapeHtml(auth.ctx.a.display_number)}</p><p>Exact task: ${escapeHtml(String((v.binding.snapshot.scope_item as { task_description?: string }).task_description ?? v.binding.scope_item_id))}<br>Equipment identity: ${escapeHtml(v.binding.asset_id)}</p><h2>Reviewed operational evidence</h2><ul>${manifest.evidence.map((e) => `<li>${escapeHtml(e.label)}<br>SHA-256: ${escapeHtml(e.hash)}</li>`).join("")}</ul><h2>Exclusions</h2><ul>${manifest.exclusions.map((e) => `<li>${escapeHtml(e)}</li>`).join("")}</ul><h2>Remaining work</h2><p>${escapeHtml(manifest.remaining_work)}</p><h2>Exact retained source and review bindings</h2><pre>${escapeHtml(JSON.stringify(manifest, null, 2))}</pre></main></html>`,
          });
          await readBundle(p, bundle);
          // The graph is locked; expiring authority is checked again after rendering.
          await access(c, p, row.id, "close");
          if (hash(await closurePrerequisites(c, p, row)) !== row.accepted_hash)
            refuse(
              "FreshAcceptanceRequired",
              "Source or review authority changed during output preparation.",
            );
          await c.query(
            "INSERT INTO ppo.incident_outputs(id,workspace_id,incident_id,review_hash,manifest,manifest_hash,bundle,issued_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              outputId,
              p.workspace_id,
              row.id,
              row.accepted_hash,
              JSON.stringify(manifest),
              hash(manifest),
              JSON.stringify(bundle),
              p.actor_id,
            ],
          );
          Object.assign(changes, {
            state: "Closed",
            hold: false,
            accepted_hash: row.accepted_hash,
            accepted_by: row.accepted_by,
          });
          details = { output_id: outputId, review_hash: row.accepted_hash };
        }
        await update(changes);
      }
      if (!row) throw unavailable();
      const g = await graph(c, p, row.id);
      await c.query(
        "INSERT INTO ppo.incident_events(id,workspace_id,incident_id,version,action,reason,actor_id,operation_id,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          randomUUID(),
          p.workspace_id,
          row.id,
          row.version,
          cmd.action,
          cmd.reason,
          p.actor_id,
          cmd.operation_id,
          JSON.stringify({
            row,
            actions: g.actions,
            evidence: g.evidence,
            details,
            policy,
          }),
        ],
      );
      return {
        id: row.id,
        version: row.version,
        state: row.state,
        updated_at: row.updated_at,
      };
    },
    "Incident",
    "IncidentChanged",
  );
}

export async function readIncident(c: QueryClient, p: Principal, id: string) {
  const ctx = await access(c, p, id),
    { row, sensitive } = ctx,
    b = await latestBinding(c, p, id),
    g = await graph(c, p, id);
  let current: Awaited<ReturnType<typeof binding>> | null = null;
  try {
    current = await binding(
      c,
      p,
      row.appointment_id,
      b.scope_item_id,
      b.asset_id,
    );
  } catch (e) {
    if (!(e instanceof AppError) || ![403, 404, 422].includes(e.status))
      throw e;
  }
  const events = (
    await c.query(
      "SELECT * FROM ppo.incident_events WHERE workspace_id=$1 AND incident_id=$2 ORDER BY version",
      [p.workspace_id, id],
    )
  ).rows;
  const outputs = (
    await c.query(
      "SELECT id,review_hash,manifest,bundle,issued_at FROM ppo.incident_outputs WHERE workspace_id=$1 AND incident_id=$2 ORDER BY issued_at",
      [p.workspace_id, id],
    )
  ).rows;
  const duties: Record<string, boolean> = {};
  for (const action of [
    "save",
    "submit",
    "triage",
    "review",
    "action",
    "evidence",
    "accept_action",
    "accept",
    "close",
    "reopen",
    "rebind",
    "link",
    "adopt_assignment",
  ]) {
    try {
      await access(c, p, id, action);
      duties[action] = true;
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      duties[action] = false;
    }
  }
  const originalsCurrent =
    row.state !== "Closed" || (await closedEvidenceCurrent(c, p, id));
  const equipment = await visible(c, p, "Asset", b.asset_id),
    site = await visible(c, p, "Site", row.site_id);
  const reporter = (
    await c.query(
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, row.reporter_id],
    )
  ).rows[0];
  return {
    context: {
      appointment: ctx.a.display_number,
      work_order: ctx.w.display_number,
      site: site.name ?? site.display_name ?? site.display_number,
      equipment: equipment.display_number,
      task: (b.snapshot.scope_item as { task_description?: string })
        ?.task_description,
      reporter: reporter?.display_name ?? row.reporter_id,
    },
    row: {
      ...row,
      facts: {
        ...row.facts,
        restricted_details: sensitive ? row.facts.restricted_details : null,
      },
    },
    sensitive,
    binding: {
      id: b.id,
      scope_item_id: b.scope_item_id,
      asset_id: b.asset_id,
      source_hash: b.source_hash,
    },
    source_current: !!current?.known && current.source_hash === b.source_hash,
    operational_hold:
      row.state !== "Draft" &&
      (row.state === "Closed"
        ? !current?.known ||
          current.source_hash !== b.source_hash ||
          !originalsCurrent
        : row.hold || row.assessment === "Unassessed"),
    actions: g.actions.map((a) => ({
      ...a,
      accepted_evidence_id:
        sensitive ||
        g.evidence.some(
          (e) =>
            e.id === a.accepted_evidence_id && e.audience === "Operational",
        )
          ? a.accepted_evidence_id
          : null,
    })),
    evidence: g.evidence.filter(
      (e) => e.audience === "Operational" || sensitive,
    ),
    events: events.map((e) => ({
      id: e.id,
      version: e.version,
      action: e.action,
      actor_id: e.actor_id,
      recorded_at: e.recorded_at,
      reason: sensitive ? e.reason : null,
      facts: {
        ...e.snapshot.row.facts,
        restricted_details: sensitive
          ? e.snapshot.row.facts.restricted_details
          : null,
      },
    })),
    outputs: outputs.map((o) => ({
      ...o,
      current:
        row.state === "Closed" &&
        originalsCurrent &&
        o.review_hash === row.accepted_hash &&
        current?.source_hash === b.source_hash,
    })),
    duties,
  };
}
export async function incidentReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
  operation: string,
) {
  const action = command.replace(/^Incident:/, "");
  const v = await access(c, p, id, action === "create" ? "save" : action);
  if (["accept_action", "accept", "close"].includes(action))
    await independent(c, p, v.row);
  if (action === "evidence") {
    const event = (
      await c.query(
        "SELECT snapshot FROM ppo.incident_events WHERE workspace_id=$1 AND incident_id=$2 AND operation_id=$3 AND actor_id=$4",
        [p.workspace_id, id, operation, p.actor_id],
      )
    ).rows[0];
    const g = await graph(c, p, id),
      e = g.evidence.find(
        (e) => e.id === event?.snapshot?.details?.evidence_id,
      );
    const a = g.actions.find((a) => a.id === e?.action_id);
    if (
      !e ||
      (e.audience === "Restricted" && !v.sensitive) ||
      (v.row.reporter_id !== p.actor_id && a?.activity.owner_id !== p.actor_id)
    )
      throw unavailable();
  }
}
export const incidentRead = (p: Principal, id: string) =>
  transaction((c) => readIncident(c, p, id));
