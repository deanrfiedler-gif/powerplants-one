import { registerIntent, intentFailure } from "./intents";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../../platform/identity";
import { database, transaction } from "../../platform/database";
import { unavailable } from "../../platform/errors";
import { sharedOperation } from "../../platform/operations";
import { hasPermission, type QueryClient } from "../../platform/permissions";
import { visible } from "../../shared/reads";
import {
  authoriseActivityInput,
  insertActivity,
  type ActivityInput,
} from "../../activities/activities";
import {
  access,
  stageRow,
  member,
  loadDetail,
  sourcesFor,
  hash,
  fail,
  versionCheck,
  projectUnits,
  decisionsFor,
} from "./context";
import { type Action, type Command, need, parseCommand } from "./validation";
import { type Detail, type ProjectContext, type Stage } from "./model";
import {
  POLICY,
  projectClosureGates,
  residualAllowed,
  sameUnits,
  sourceEvidenceValid,
} from "./policy";
import {
  packProjection,
  preparePack,
  readBundle,
  acceptanceTemplate,
} from "./outputs";

import { actionDuty } from "./ui-actions";
export { actionDuty };
const controlled = new Set<Action>([
  "technical",
  "prepare",
  "issue",
  "validate",
  "receive",
  "commercial",
  "closeStage",
  "closeProject",
  "amendment",
]);
export async function receiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  name: string,
) {
  const action = name.replace("Acceptance:", "") as Action;
  if (!(action in actionDuty)) throw unavailable();
  const s = (
    await c.query<{ project_id: string }>(
      "SELECT project_id FROM ppo.acceptance_stages WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, id],
    )
  ).rows[0];
  const a = await access(c, p, s?.project_id ?? id, actionDuty[action]);
  if (
    action === "commercial" &&
    !(await hasPermission(
      c,
      p,
      "finance.read",
      a.project.company_id,
      a.project.site_id,
    ))
  )
    throw unavailable();
  if (s && controlled.has(action)) {
    const d = await loadDetail(
      c,
      p,
      await stageRow(c, p, id),
      await sourcesFor(c, p, a.project),
    );
    if (d.requirements.some((r) => r.source.availability === "Restricted"))
      throw unavailable();
  }
}
async function customer(
  c: QueryClient,
  p: Principal,
  project: ProjectContext,
  id: string,
) {
  const person = await visible(c, p, "Person", id);
  if (
    !person.active ||
    !(
      await c.query(
        "SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND company_id=$2 AND organisation_id=$3 AND person_id=$4 AND valid_from<=CURRENT_DATE AND (valid_to IS NULL OR valid_to>CURRENT_DATE)",
        [p.workspace_id, project.company_id, project.organisation_id, id],
      )
    ).rowCount
  )
    throw unavailable();
  return { id, name: person.display_name as string };
}
async function recipient(
  c: QueryClient,
  p: Principal,
  project: ProjectContext,
  audience: string,
  id: string,
) {
  if (audience === "Customer") return customer(c, p, project, id);
  const u = await member(c, p, project.id, id, "receive");
  if (id === p.actor_id)
    fail("The Service recipient must be independent of the sender.");
  return { id, name: u.display_name };
}
async function followup(
  c: PoolClient,
  p: Principal,
  project: ProjectContext,
  stage: Stage,
  cause: string,
  title: string,
  owner = stage.owner_id,
) {
  const prior = (
    await c.query<{ activity_id: string }>(
      "SELECT activity_id FROM ppo.acceptance_followups WHERE workspace_id=$1 AND stage_id=$2 AND cause=$3",
      [p.workspace_id, stage.id, cause],
    )
  ).rows[0];
  if (prior) return prior.activity_id;
  const input: ActivityInput = {
    id: randomUUID(),
    company_id: project.company_id,
    site_id: project.site_id,
    kind: "TechnicalFollowUp",
    owner_id: owner,
    summary: title.slice(0, 2000),
    due_at: null,
    due_needed: true,
    access_class: "Internal",
    links: [{ object_type: "Project", object_id: project.id }],
  };
  await authoriseActivityInput(c, p, input);
  await insertActivity(c, p, input);
  await c.query(
    "INSERT INTO ppo.acceptance_followups(workspace_id,project_id,stage_id,cause,activity_id) VALUES($1,$2,$3,$4,$5)",
    [p.workspace_id, project.id, stage.id, cause, input.id],
  );
  return input.id;
}
async function event(
  c: PoolClient,
  p: Principal,
  cmd: Command,
  kind: string,
  snapshot: unknown,
  subject: string | null = null,
) {
  await c.query(
    "INSERT INTO ppo.acceptance_events(id,workspace_id,project_id,stage_id,kind,subject_id,snapshot,reason,actor_id,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      randomUUID(),
      p.workspace_id,
      cmd.project_id,
      cmd.stage_id,
      kind,
      subject,
      snapshot,
      cmd.reason,
      p.actor_id,
      cmd.operation_id,
    ],
  );
}
async function decide(
  c: PoolClient,
  p: Principal,
  cmd: Command,
  d: Detail | null,
  kind: string,
  outcome: string,
  subject: string | null = null,
  extra: Record<string, unknown> = {},
) {
  const snapshot = {
    stage_id: d?.stage.id ?? null,
    revision: d?.stage.revision ?? null,
    units:
      d?.units.map((u) => ({
        id: u.id,
        disposition: u.disposition,
        configuration: u.configuration_version,
      })) ?? [],
    requirements:
      d?.requirements.map((r) => ({
        id: r.id,
        outcome: r.outcome,
        source_id: r.source.id,
        fingerprint: r.source.fingerprint,
      })) ?? [],
    obligations:
      d?.obligations.map((o) => ({
        id: o.id,
        version: o.version,
        state: o.state,
        transfer_accepted: o.transfer_accepted,
      })) ?? [],
    ...extra,
  };
  await c.query(
    "INSERT INTO ppo.acceptance_decisions(id,workspace_id,project_id,stage_id,revision,kind,outcome,subject_id,facts_hash,snapshot,reason,policy_version,actor_id,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
    [
      randomUUID(),
      p.workspace_id,
      cmd.project_id,
      cmd.stage_id,
      d?.stage.revision ?? null,
      kind,
      outcome,
      subject,
      d?.facts_hash ?? cmd.facts_hash ?? hash(snapshot),
      snapshot,
      cmd.reason,
      POLICY,
      p.actor_id,
      cmd.operation_id,
    ],
  );
}
async function allDetails(
  c: QueryClient,
  p: Principal,
  project: ProjectContext,
) {
  const sources = await sourcesFor(c, p, project);
  const rows = (
    await c.query<Stage>(
      "SELECT s.*,s.due::text,u.display_name AS owner_name FROM ppo.acceptance_stages s JOIN ppo.users u ON (u.workspace_id,u.id)=(s.workspace_id,s.owner_id) WHERE s.workspace_id=$1 AND s.project_id=$2 ORDER BY s.id",
      [p.workspace_id, project.id],
    )
  ).rows;
  const details: Detail[] = [];
  for (const s of rows) details.push(await loadDetail(c, p, s, sources));
  return details;
}
async function executeCommand(p: Principal, value: unknown) {
  const cmd = parseCommand(value),
    f = cmd.fields;
  // Preparation has a durable, recoverable byte reservation before its acceptance transaction. Re-check
  // every authority, source and version afterwards; failure never regenerates the original bundle.
  let output: Awaited<ReturnType<typeof preparePack>> | null = null,
    preparedManifest: ReturnType<typeof packProjection> | null = null;
  if (cmd.action === "prepare") {
    const existing = (
      await database().query(
        "SELECT 1 FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 AND operation_id=$3",
        [p.workspace_id, p.actor_id, cmd.operation_id],
      )
    ).rowCount;
    if (!existing) {
      preparedManifest = await transaction(async (c) => {
        await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR SHARE", [
          p.workspace_id,
        ]);
        const { project } = await access(c, p, cmd.project_id, "prepare"),
          s = await stageRow(c, p, need(cmd.stage_id ?? undefined, "stage_id"));
        if (s.project_id !== project.id) throw unavailable();
        versionCheck(s.version, cmd.expected_version);
        const d = await loadDetail(c, p, s, await sourcesFor(c, p, project));
        if (project.lifecycle === "Closed" || s.closeout === "Closed")
          fail(
            "Reopen or amend the closed basis before preparing changed handover content.",
          );
        if (cmd.facts_hash !== d.facts_hash)
          fail(
            "Review the changed scope and sources before preparing.",
            "VersionConflict",
            409,
          );
        if (d.handover_gates.length) fail(d.handover_gates.join(" "));
        return packProjection(
          project,
          d,
          need(f.audience, "audience"),
          await recipient(
            c,
            p,
            project,
            need(f.audience, "audience"),
            need(f.recipient_id, "recipient_id"),
          ),
          need(f.purpose, "purpose"),
        );
      });
      output = await preparePack(p, need(f.id, "id"), preparedManifest);
      await readBundle(p, output);
    }
  }
  return sharedOperation(
    p,
    cmd,
    `Acceptance:${cmd.action}`,
    async (c) => {
      const a = await access(c, p, cmd.project_id, actionDuty[cmd.action]);
      const stage = cmd.stage_id ? await stageRow(c, p, cmd.stage_id) : null;
      if (stage && stage.project_id !== cmd.project_id) throw unavailable();
      if (
        cmd.action === "commercial" &&
        !(await hasPermission(
          c,
          p,
          "finance.read",
          a.project.company_id,
          a.project.site_id,
        ))
      )
        throw unavailable();
      if (controlled.has(cmd.action)) {
        const sources = await sourcesFor(c, p, a.project);
        if (stage) {
          const d = await loadDetail(c, p, stage, sources);
          if (
            d.requirements.some((r) => r.source.availability === "Restricted")
          )
            throw unavailable();
        }
      }
      return { ...a, stage };
    },
    async (c, authority) => {
      let { project, stage } = authority;
      await c.query(
        "SELECT 1 FROM ppo.projects WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
        [p.workspace_id, project.id],
      );
      if (stage)
        await c.query(
          "SELECT 1 FROM ppo.acceptance_stages WHERE workspace_id=$1 AND id=$2 FOR UPDATE",
          [p.workspace_id, stage.id],
        );
      // Locks precede authoritative re-read: a waiting stale tab must see the committed version.
      project = (await access(c, p, cmd.project_id, actionDuty[cmd.action]))
        .project;
      stage = cmd.stage_id ? await stageRow(c, p, cmd.stage_id) : null;
      versionCheck(stage?.version ?? project.version, cmd.expected_version);
      const mutations = [
        "create",
        "edit",
        "unit",
        "disposition",
        "scope",
        "submit",
        "return",
        "successor",
        "requirement",
        "prepare",
        "issue",
      ] as Action[];
      if (
        (project.lifecycle === "Closed" || stage?.closeout === "Closed") &&
        mutations.includes(cmd.action)
      )
        fail(
          "This basis is closed. Use the authorised reopening or amendment path before changing scope or schedule.",
          "ClosedProject",
          409,
        );
      const sources = await sourcesFor(c, p, project),
        d = stage ? await loadDetail(c, p, stage, sources) : null;
      if (controlled.has(cmd.action) && d && cmd.facts_hash !== d.facts_hash)
        fail(
          "The exact source, scope or obligation changed. Retain your proposal and review the new facts.",
          "VersionConflict",
          409,
        );
      const requireStage = () => need(stage ?? undefined, "stage_id"),
        requireDetail = () => need(d ?? undefined, "stage_id");
      const unit = async (id: string) => {
        if (
          !(
            await c.query(
              "SELECT 1 FROM ppo.acceptance_units WHERE workspace_id=$1 AND project_id=$2 AND id=$3",
              [p.workspace_id, project.id, id],
            )
          ).rowCount
        )
          throw unavailable();
      };
      let resultId = stage?.id ?? project.id,
        subject: string | null = null;
      if (cmd.action === "create") {
        const id = need(f.id, "id");
        await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
        const number = (
          await c.query(
            "SELECT count(*)::int+1 AS n FROM ppo.acceptance_stages WHERE workspace_id=$1 AND project_id=$2",
            [p.workspace_id, project.id],
          )
        ).rows[0].n;
        await c.query(
          "INSERT INTO ppo.acceptance_stages(id,workspace_id,company_id,project_id,reference,title,owner_id,due,due_basis,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)",
          [
            id,
            p.workspace_id,
            project.company_id,
            project.id,
            `SYN-ACC-${String(number).padStart(3, "0")}`,
            need(f.title, "title"),
            f.owner_id,
            f.due ?? null,
            f.due_basis ?? "Review due",
            p.actor_id,
          ],
        );
        resultId = id;
        cmd.stage_id = id;
      } else if (cmd.action === "edit") {
        const s = requireStage();
        if (s.state !== "Draft")
          fail("Create a successor to change submitted content.");
        await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
        await c.query(
          "UPDATE ppo.acceptance_stages SET title=$3,owner_id=$4,due=$5,due_basis=$6,version=version+1,updated_by=$7,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [
            p.workspace_id,
            s.id,
            need(f.title, "title"),
            f.owner_id,
            f.due ?? null,
            f.due_basis ?? "Review due",
            p.actor_id,
          ],
        );
      } else if (cmd.action === "unit") {
        const id = need(f.id, "id");
        if (f.facility_id) {
          const a = await visible(c, p, "Facility", f.facility_id);
          if (a.site_id !== project.site_id) throw unavailable();
        }
        if (f.asset_id) {
          const a = await visible(c, p, "Asset", f.asset_id);
          if (a.site_id !== project.site_id) throw unavailable();
        }
        if (f.required === false && (!f.removal_reference || !f.removal_reason))
          fail(
            "Scope removal requires an authoritative change reference and reason.",
          );
        if (
          f.required === false &&
          !(await access(c, p, project.id, "reopen")).can.reopen
        )
          throw unavailable();
        await c.query(
          "INSERT INTO ppo.acceptance_units(id,workspace_id,company_id,project_id,reference,title,facility_id,asset_id,system_name,function_name,installed_at,served_areas,configuration_version,required,removal_reference,removal_reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)",
          [
            id,
            p.workspace_id,
            project.company_id,
            project.id,
            need(f.reference, "reference"),
            need(f.title, "title"),
            f.facility_id ?? null,
            f.asset_id ?? null,
            need(f.system_name, "system_name"),
            need(f.function_name, "function_name"),
            need(f.installed_at, "installed_at"),
            f.served_areas ?? [],
            need(f.configuration_version, "configuration_version"),
            f.required ?? true,
            f.removal_reference ?? null,
            f.removal_reason ?? null,
            p.actor_id,
          ],
        );
        subject = id;
      } else if (cmd.action === "disposition") {
        const target = need(f.unit_id, "unit_id");
        await unit(target);
        await c.query(
          "INSERT INTO ppo.acceptance_unit_dispositions(id,workspace_id,project_id,unit_id,required,source_reference,reason,actor_id,operation_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
          [
            randomUUID(),
            p.workspace_id,
            project.id,
            target,
            need(f.required, "required"),
            need(f.removal_reference, "removal_reference"),
            cmd.reason,
            p.actor_id,
            cmd.operation_id,
          ],
        );
        const affected = (
          await c.query<Stage>(
            "SELECT DISTINCT s.* FROM ppo.acceptance_stages s JOIN ppo.acceptance_stage_units l ON l.workspace_id=s.workspace_id AND l.stage_id=s.id AND l.revision=s.revision WHERE l.workspace_id=$1 AND l.unit_id=$2",
            [p.workspace_id, target],
          )
        ).rows;
        for (const s of affected) {
          await c.query(
            "UPDATE ppo.acceptance_stages SET reassessment=true,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, s.id, p.actor_id],
          );
          await followup(
            c,
            p,
            project,
            s,
            `scope-disposition:${cmd.operation_id}`,
            "Review authorised project scope disposition",
          );
        }
        subject = target;
      } else if (cmd.action === "scope") {
        const s = requireStage();
        if (s.state !== "Draft")
          fail("Submitted scope is immutable. Create a successor.");
        const units = need(f.units, "units");
        const revision = (
          await c.query(
            "SELECT 1 FROM ppo.acceptance_stage_units WHERE workspace_id=$1 AND stage_id=$2 AND revision=$3",
            [p.workspace_id, s.id, s.revision],
          )
        ).rowCount
          ? s.revision + 1
          : s.revision;
        for (const u of units) {
          await unit(u.unit_id);
          if (
            u.disposition === "Included" &&
            !u.relationship &&
            (
              await c.query(
                "SELECT 1 FROM ppo.acceptance_stage_units l JOIN ppo.acceptance_stages s ON s.workspace_id=l.workspace_id AND s.id=l.stage_id AND s.revision=l.revision WHERE l.workspace_id=$1 AND l.project_id=$2 AND l.unit_id=$3 AND l.stage_id<>$4 AND l.disposition='Included'",
                [p.workspace_id, project.id, u.unit_id, s.id],
              )
            ).rowCount
          )
            fail(
              "This unit already belongs to another current stage. Record its exact overlap or reassignment relationship.",
            );
          await c.query(
            "INSERT INTO ppo.acceptance_stage_units(workspace_id,project_id,stage_id,revision,unit_id,disposition,reason,relationship) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
            [
              p.workspace_id,
              project.id,
              s.id,
              revision,
              u.unit_id,
              u.disposition,
              u.reason,
              u.relationship,
            ],
          );
        }
        await c.query(
          "UPDATE ppo.acceptance_stages SET revision=$3,version=version+1,updated_at=clock_timestamp(),updated_by=$4 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, s.id, revision, p.actor_id],
        );
      } else if (cmd.action === "submit") {
        const s = requireStage(),
          detail = requireDetail();
        if (s.state !== "Draft") fail("Only a draft can be submitted.");
        if (!detail.units.some((u) => u.disposition === "Included"))
          fail("Include at least one exact scope unit.");
        const snapshot = {
          stage: s,
          units: detail.units,
          requirements: detail.requirements.map((r) => ({
            id: r.id,
            gate: r.gate,
            mandatory: r.mandatory,
            outcome: r.outcome,
            source_id: r.source.id,
            source_fingerprint: r.source.fingerprint,
          })),
          facts_hash: detail.facts_hash,
        };
        const previous = (
          await c.query(
            "SELECT id FROM ppo.acceptance_revisions WHERE workspace_id=$1 AND stage_id=$2 ORDER BY revision DESC LIMIT 1",
            [p.workspace_id, s.id],
          )
        ).rows[0];
        await c.query(
          "INSERT INTO ppo.acceptance_revisions(id,workspace_id,project_id,stage_id,revision,predecessor_id,snapshot,content_hash,reason,submitted_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
          [
            randomUUID(),
            p.workspace_id,
            project.id,
            s.id,
            s.revision,
            previous?.id ?? null,
            snapshot,
            hash(snapshot),
            cmd.reason,
            p.actor_id,
          ],
        );
        await c.query(
          "UPDATE ppo.acceptance_stages SET state='In review',version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, s.id, p.actor_id],
        );
        for (const r of detail.requirements.filter(
          (r) => !["Satisfied", "Not required"].includes(r.outcome),
        ))
          await followup(
            c,
            p,
            project,
            s,
            `requirement:${r.id}`,
            `Resolve acceptance requirement: ${r.title}`,
            r.owner_id,
          );
      } else if (cmd.action === "return") {
        const s = requireStage();
        if (s.state !== "In review")
          fail("Only a submitted stage can be returned.");
        await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
        await followup(
          c,
          p,
          project,
          s,
          `return:${s.revision}`,
          `Revise returned acceptance stage: ${s.title}`,
          f.owner_id,
        );
        await c.query(
          "UPDATE ppo.acceptance_stages SET state='Returned',version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, s.id, p.actor_id],
        );
      } else if (cmd.action === "successor") {
        const s = requireStage();
        if (s.state === "Draft")
          fail("Edit this draft before making a successor.");
        await c.query(
          "INSERT INTO ppo.acceptance_stage_units SELECT workspace_id,project_id,stage_id,revision+1,unit_id,disposition,reason,relationship FROM ppo.acceptance_stage_units WHERE workspace_id=$1 AND stage_id=$2 AND revision=$3",
          [p.workspace_id, s.id, s.revision],
        );
        await c.query(
          "UPDATE ppo.acceptance_stages SET revision=revision+1,state='Draft',closeout='Open',reassessment=false,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, s.id, p.actor_id],
        );
      } else if (cmd.action === "source") {
        const id = need(f.id, "id"),
          old = (
            await c.query(
              "SELECT * FROM ppo.acceptance_sources WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, id],
            )
          ).rows[0];
        if (old && old.project_id !== project.id) throw unavailable();
        if (old)
          versionCheck(
            old.version,
            need(f.source_expected_version, "source_expected_version"),
          );
        if (f.commissioning_id) {
          const row = (
            await c.query(
              "SELECT e.project_id AS context_id FROM ppo.commissioning_packages k JOIN ppo.engineering_packages e ON e.workspace_id=k.workspace_id AND e.id=k.package_id WHERE k.workspace_id=$1 AND k.id=$2",
              [p.workspace_id, f.commissioning_id],
            )
          ).rows[0];
          if (row?.context_id !== project.id) throw unavailable();
        }
        if (old && old.kind !== f.kind)
          fail(
            "Preserve the source kind; register a new exact source identity.",
          );
        const kind = need(f.kind, "kind"),
          outcome = need(f.outcome, "outcome"),
          details = f.details ?? {};
        if (
          kind === "Commercial" &&
          !(await hasPermission(
            c,
            p,
            "finance.read",
            project.company_id,
            project.site_id,
          ))
        )
          throw unavailable();
        if (
          !f.commissioning_id &&
          outcome === "Satisfied" &&
          !sourceEvidenceValid(kind, details)
        )
          fail(
            "This source lacks the separate evidence required for its named outcome.",
          );
        if (outcome === "Not required" && !details.authority_reference)
          fail("Not required needs its authorised applicability reference.");
        const values = [
          id,
          p.workspace_id,
          project.company_id,
          project.id,
          f.commissioning_id ? "EN08" : "SyntheticAcceptanceSource",
          f.commissioning_id ?? null,
          f.scope_key ?? null,
          need(f.title, "title"),
          kind,
          outcome,
          need(f.availability, "availability"),
          details,
          need(f.public_reference, "public_reference"),
          need(f.source_version, "source_version"),
          p.actor_id,
        ];
        if (!old)
          await c.query(
            "INSERT INTO ppo.acceptance_sources(id,workspace_id,company_id,project_id,adapter,commissioning_id,scope_key,title,kind,outcome,availability,details,public_reference,source_version,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
            values,
          );
        else {
          if (old.adapter === "EN08")
            fail(
              "EN-08 owns this evidence. Inspect and resolve its source record; PJ-09 cannot rewrite it.",
            );
          await c.query(
            "UPDATE ppo.acceptance_sources SET version=version+1,adapter=$5,commissioning_id=$6,scope_key=$7,title=$8,kind=$9,outcome=$10,availability=$11,details=$12,public_reference=$13,source_version=$14,updated_by=$15,updated_at=clock_timestamp() WHERE id=$1 AND workspace_id=$2 AND company_id=$3 AND project_id=$4",
            values,
          );
          const affected = (
            await c.query<Stage>(
              "SELECT DISTINCT s.* FROM ppo.acceptance_stages s JOIN ppo.acceptance_stage_units l ON l.workspace_id=s.workspace_id AND l.stage_id=s.id AND l.revision=s.revision JOIN ppo.acceptance_requirements r ON r.workspace_id=l.workspace_id AND r.unit_id=l.unit_id WHERE s.workspace_id=$1 AND r.source_id=$2 AND l.disposition='Included'",
              [p.workspace_id, id],
            )
          ).rows;
          for (const s of affected) {
            await c.query(
              "UPDATE ppo.acceptance_stages SET reassessment=true,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
              [p.workspace_id, s.id, p.actor_id],
            );
            await followup(
              c,
              p,
              project,
              s,
              `source:${id}:${old.version + 1}`,
              `Reassess changed source for ${s.title}`,
            );
          }
        }
        subject = id;
      } else if (cmd.action === "requirement") {
        await unit(need(f.unit_id, "unit_id"));
        if (!sources.some((s) => s.id === f.source_id)) throw unavailable();
        if (
          (
            await c.query(
              "SELECT 1 FROM ppo.acceptance_stages s JOIN ppo.acceptance_stage_units l ON l.workspace_id=s.workspace_id AND l.stage_id=s.id AND l.revision=s.revision WHERE s.workspace_id=$1 AND l.unit_id=$2 AND l.disposition='Included' AND s.state<>'Draft'",
              [p.workspace_id, f.unit_id],
            )
          ).rowCount
        )
          fail(
            "Create successors for every affected submitted stage before adding a shared requirement.",
          );
        await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
        await c.query(
          "INSERT INTO ppo.acceptance_requirements(id,workspace_id,project_id,unit_id,source_id,title,gate,mandatory,owner_id,due,due_basis,applicability_reference) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)",
          [
            need(f.id, "id"),
            p.workspace_id,
            project.id,
            f.unit_id,
            need(f.source_id ?? undefined, "source_id"),
            need(f.title, "title"),
            need(f.gate, "gate"),
            f.mandatory ?? true,
            f.owner_id,
            f.due ?? null,
            f.due_basis ?? null,
            f.applicability_reference ?? null,
          ],
        );
        subject = f.id!;
      } else if (cmd.action === "check") {
        const detail = requireDetail();
        await c.query(
          "INSERT INTO ppo.acceptance_checks(id,workspace_id,project_id,stage_id,facts_hash,result,checked_by,snapshot) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [
            randomUUID(),
            p.workspace_id,
            project.id,
            detail.stage.id,
            detail.facts_hash,
            detail.source_state,
            p.actor_id,
            JSON.stringify(
              detail.requirements.map((r) => ({
                id: r.id,
                source_id: r.source_id,
                availability: r.source.availability,
                fingerprint: r.source.fingerprint,
              })),
            ),
          ],
        );
        if (detail.stage.reassessment)
          await followup(
            c,
            p,
            project,
            detail.stage,
            `reassessment:${detail.facts_hash}`,
            `Review changed evidence for ${detail.stage.title}`,
          );
        for (const r of detail.requirements.filter(
          (r) => r.source.availability !== "Current",
        ))
          await followup(
            c,
            p,
            project,
            detail.stage,
            `availability:${r.source.id}:${r.source.fingerprint}`,
            `Restore access to required acceptance evidence`,
            r.owner_id,
          );
      } else if (cmd.action === "technical") {
        const detail = requireDetail();
        if (detail.stage.state !== "In review")
          fail("Submit the exact stage revision first.");
        if (detail.technical_gates.length)
          fail(detail.technical_gates.join(" "));
        if (!detail.requirements.some((r) => r.gate === "Technical"))
          fail("An explicit technical requirement profile is required.");
        const submitted = (
          await c.query(
            "SELECT snapshot FROM ppo.acceptance_revisions WHERE workspace_id=$1 AND stage_id=$2 AND revision=$3",
            [p.workspace_id, detail.stage.id, detail.stage.revision],
          )
        ).rows[0];
        if (submitted?.snapshot.facts_hash !== detail.facts_hash)
          fail(
            "Sources or requirements changed after submission. Create and submit a successor with the new exact evidence.",
            "SuccessorRequired",
            409,
          );
        await decide(c, p, cmd, detail, "Technical", "Accepted");
      } else if (cmd.action === "obligation") {
        const s = requireStage();
        await unit(need(f.unit_id, "unit_id"));
        if (!requireDetail().units.some((u) => u.id === f.unit_id))
          throw unavailable();
        await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
        await member(
          c,
          p,
          project.id,
          need(f.recipient_id, "recipient_id"),
          "receive",
        );
        const source = f.source_id
          ? sources.find((s) => s.id === f.source_id)
          : null;
        if (f.source_id && !source) throw unavailable();
        if (
          f.eligible &&
          (source?.kind === "Hold" ||
            source?.outcome === "Blocked" ||
            (source?.availability !== "Current" && source))
        )
          fail(
            "A hold, failed mandatory gate or unavailable source cannot be waived as residual work.",
          );
        const id = need(f.id, "id"),
          activity = await followup(
            c,
            p,
            project,
            s,
            `obligation:${id}`,
            need(f.title, "title"),
            f.owner_id,
          );
        await c.query(
          "INSERT INTO ppo.acceptance_obligations(id,workspace_id,project_id,stage_id,unit_id,source_id,title,owner_id,recipient_id,due,due_basis,required_evidence,control_reference,eligible,conditions,review_rule,activity_id,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)",
          [
            id,
            p.workspace_id,
            project.id,
            s.id,
            f.unit_id,
            f.source_id ?? null,
            f.title,
            f.owner_id,
            f.recipient_id,
            f.due ?? null,
            need(f.due_basis, "due_basis"),
            need(f.required_evidence, "required_evidence"),
            need(f.control_reference, "control_reference"),
            f.eligible ?? false,
            need(f.conditions, "conditions"),
            need(f.review_rule, "review_rule"),
            activity,
            p.actor_id,
          ],
        );
        subject = id;
      } else if (
        cmd.action === "transfer" ||
        cmd.action === "completeObligation"
      ) {
        const detail = requireDetail(),
          o = detail.obligations.find((o) => o.id === f.id);
        if (!o) throw unavailable();
        if (cmd.action === "transfer") {
          if (
            p.actor_id !== o.recipient_id ||
            p.actor_id === o.created_by ||
            p.actor_id === o.owner_id
          )
            fail(
              "Only the independent named receiving owner can accept this exact obligation.",
            );
          if (o.transfer_accepted)
            fail(
              "The independent transfer is already accepted for this exact obligation version.",
            );
          if (!o.eligible)
            fail("This work is not eligible to remain after closeout.");
          await decide(c, p, cmd, detail, "Transfer", "Accepted", o.id, {
            obligation_version: o.version,
          });
        } else {
          if (o.state === "Completed")
            fail(
              "Original completion evidence is retained. Record a new obligation for additional work.",
            );
          if (o.source_id) {
            const s = sources.find((s) => s.id === o.source_id);
            if (!s || s.outcome !== "Satisfied" || s.availability !== "Current")
              fail(
                "The owning source must accept completion evidence first. Activity completion does not resolve this obligation.",
              );
          }
          await c.query(
            "UPDATE ppo.acceptance_obligations SET state='Completed',completion_evidence=$3,version=version+1 WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, o.id, need(f.evidence, "evidence")],
          );
          await decide(
            c,
            p,
            cmd,
            detail,
            "Source completion",
            "Completed",
            o.id,
            {
              completion_evidence: f.evidence,
              source_fingerprint:
                sources.find((s) => s.id === o.source_id)?.fingerprint ?? null,
            },
          );
        }
        subject = o.id;
      } else if (cmd.action === "prepare") {
        const detail = requireDetail();
        if (detail.handover_gates.length) fail(detail.handover_gates.join(" "));
        const m = packProjection(
          project,
          detail,
          need(f.audience, "audience"),
          await recipient(
            c,
            p,
            project,
            need(f.audience, "audience"),
            need(f.recipient_id, "recipient_id"),
          ),
          need(f.purpose, "purpose"),
        );
        if (!output || !preparedManifest || hash(m) !== hash(preparedManifest))
          fail(
            "The prepared content changed. Original bytes are retained; review a new candidate.",
            "PreparedSourceChanged",
            409,
          );
        await readBundle(p, need(output ?? undefined, "prepared_output"));
        await c.query(
          "INSERT INTO ppo.acceptance_manifests(id,workspace_id,project_id,stage_id,revision,audience,recipient_id,purpose,manifest,content_hash,facts_hash,template_version,prepared,prepared_by,prepared_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)",
          [
            f.id,
            p.workspace_id,
            project.id,
            detail.stage.id,
            detail.stage.revision,
            f.audience,
            f.recipient_id,
            f.purpose,
            m,
            hash(m),
            detail.facts_hash,
            acceptanceTemplate,
            output,
            p.actor_id,
            output!.prepared_at,
          ],
        );
        subject = f.id!;
      } else if (cmd.action === "issue") {
        const detail = requireDetail(),
          m = detail.manifests.find((m) => m.id === f.id);
        if (!m) throw unavailable();
        await recipient(c, p, project, m.audience, m.recipient_id);
        if (
          detail.handover_gates.length ||
          m.revision !== detail.stage.revision ||
          m.facts_hash !== detail.facts_hash ||
          m.template_version !== acceptanceTemplate
        )
          fail(
            "Scope, evidence or template changed after preparation. Create a fresh reviewed candidate.",
            "PreparedSourceChanged",
            409,
          );
        if (m.issue_id)
          fail("This manifest is already issued. Open its original issue.");
        await readBundle(p, m.prepared);
        await c.query(
          "INSERT INTO ppo.acceptance_issues(id,workspace_id,project_id,manifest_id,issued_by) VALUES($1,$2,$3,$4,$5)",
          [randomUUID(), p.workspace_id, project.id, m.id, p.actor_id],
        );
        subject = m.id;
      } else if (cmd.action === "request") {
        const detail = requireDetail(),
          m = detail.manifests.find((m) => m.issue_id === f.issue_id);
        if (!m) throw unavailable();
        await recipient(c, p, project, m.audience, m.recipient_id);
        if (
          m.revision !== detail.stage.revision ||
          m.facts_hash !== detail.facts_hash
        )
          fail("This issue is no longer the current stage handover.");
        await c.query(
          "INSERT INTO ppo.acceptance_requests(id,workspace_id,project_id,issue_id,sender_id,requested_due) VALUES($1,$2,$3,$4,$5,$6)",
          [
            need(f.id, "id"),
            p.workspace_id,
            project.id,
            m.issue_id,
            p.actor_id,
            f.due ?? null,
          ],
        );
        subject = f.id!;
      } else if (cmd.action === "response") {
        const detail = requireDetail(),
          m = detail.manifests.find(
            (m) => m.request_id === f.request_id && m.audience === "Customer",
          );
        if (!m) throw unavailable();
        await customer(c, p, project, need(f.respondent_id, "respondent_id"));
        const units = need(f.unit_ids, "unit_ids");
        const issued = (
          m.manifest.scope as { id: string; disposition: string }[]
        )
          .filter((u) => u.disposition === "Included")
          .map((u) => u.id);
        if (!units.length || units.some((u) => !issued.includes(u)))
          fail("A response can only name units in its exact issued scope.");
        if (
          f.correction_of &&
          !detail.responses.some(
            (r) => r.id === f.correction_of && r.request_id === f.request_id,
          )
        )
          throw unavailable();
        const id = need(f.id, "id");
        await c.query(
          "INSERT INTO ppo.acceptance_responses(id,workspace_id,project_id,request_id,respondent_id,authority_basis,method,evidence,outcome,response_time,time_precision,conditions,recorded_by,correction_of) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)",
          [
            id,
            p.workspace_id,
            project.id,
            f.request_id,
            f.respondent_id,
            need(f.authority_basis, "authority_basis"),
            need(f.method, "method"),
            need(f.evidence, "evidence"),
            need(f.outcome, "outcome"),
            f.response_time ?? null,
            need(f.time_precision, "time_precision"),
            f.conditions ?? "",
            p.actor_id,
            f.correction_of ?? null,
          ],
        );
        for (const u of units)
          await c.query(
            "INSERT INTO ppo.acceptance_response_units VALUES($1,$2,$3,$4)",
            [p.workspace_id, project.id, id, u],
          );
        await followup(
          c,
          p,
          project,
          detail.stage,
          `response:${id}`,
          "Validate customer response authority and exact acceptance scope",
        );
        subject = id;
      } else if (cmd.action === "validate") {
        const detail = requireDetail(),
          r = detail.responses.find((r) => r.id === f.id);
        if (!r || r.audience !== "Customer") throw unavailable();
        await customer(c, p, project, r.respondent_id);
        if (r.recorded_by === p.actor_id)
          fail(
            "Response validation requires a reviewer independent of its recorder.",
          );
        if (
          /unknown|unverified|primary contact only/i.test(
            need(f.authority_basis, "authority_basis"),
          )
        )
          fail(
            "The responding person needs verified scope-specific authority. Primary contact alone is insufficient.",
          );
        if (
          r.revision !== detail.stage.revision ||
          !sameUnits(
            r.units,
            detail.units
              .filter((u) => u.disposition === "Included")
              .map((u) => u.id),
          )
        )
          fail(
            "This response covers a different or partial scope. Preserve it and prepare the appropriate stage amendment.",
          );
        if (r.outcome === "With conditions") {
          if (
            !r.conditions ||
            !detail.obligations.length ||
            detail.obligations.some((o) => !residualAllowed(o)) ||
            !detail.obligations.every((o) =>
              r.conditions.includes(o.conditions),
            )
          )
            fail(
              "Conditional acceptance needs actual-party agreement to every exact eligible obligation and independently accepted continuing responsibility.",
            );
        }
        if (
          r.outcome === "Accepted" &&
          detail.obligations.some((o) => o.state !== "Completed")
        )
          fail(
            "Unfinished obligations require explicit customer agreement and a With conditions response.",
          );
        await decide(c, p, cmd, detail, "Customer", r.outcome, r.id, {
          authority_basis: f.authority_basis,
          respondent_id: r.respondent_id,
        });
        subject = r.id;
      } else if (cmd.action === "receive") {
        const detail = requireDetail(),
          m = detail.manifests.find(
            (m) => m.request_id === f.request_id && m.audience === "Service",
          );
        if (!m) throw unavailable();
        if (
          p.actor_id !== m.recipient_id ||
          p.actor_id === m.sender_id ||
          p.actor_id === m.prepared_by
        )
          fail(
            "Only the independent named Service receiver can respond to this request.",
          );
        await member(c, p, project.id, p.actor_id, "receive");
        if (
          m.revision !== detail.stage.revision ||
          m.facts_hash !== detail.facts_hash
        )
          fail("The manifest changed. A new receiving review is required.");
        const outcome = need(f.outcome, "outcome");
        if (
          detail.decisions.some(
            (d) =>
              d.kind === "Service" &&
              d.subject_id === m.request_id &&
              d.outcome === outcome,
          )
        )
          fail(
            "This exact receiving response is already recorded. Open its original decision.",
          );
        if (!["Received", "Accepted", "Returned", "Declined"].includes(outcome))
          fail("Choose received, accepted, returned or declined.");
        if (
          detail.decisions.some(
            (d) =>
              d.kind === "Service" &&
              d.subject_id === m.request_id &&
              d.outcome !== "Received",
          )
        )
          fail(
            "A final receiving decision already exists. Issue a successor for changed content.",
          );
        if (
          outcome === "Accepted" &&
          !detail.decisions.some(
            (d) =>
              d.kind === "Service" &&
              d.subject_id === m.request_id &&
              d.outcome === "Received",
          )
        )
          fail("Record receipt of the exact manifest before accepting it.");
        if (["Returned", "Declined"].includes(outcome)) {
          await member(c, p, project.id, need(f.owner_id, "owner_id"), "scope");
          await followup(
            c,
            p,
            project,
            detail.stage,
            `receiving:${m.request_id}`,
            `Resolve ${outcome.toLowerCase()} Service handover`,
            f.owner_id,
          );
        }
        await decide(c, p, cmd, detail, "Service", outcome, m.request_id, {
          evidence: need(f.evidence, "evidence"),
          recipient_id: p.actor_id,
        });
        subject = m.request_id;
      } else if (cmd.action === "commercial") {
        const source = sources.find(
          (s) => s.id === f.source_id && s.kind === "Commercial",
        );
        if (!source) throw unavailable();
        if (source.availability !== "Current")
          fail("Commercial evidence cannot currently be assessed.");
        if (f.outcome === "Complete" && source.outcome !== "Satisfied")
          fail(
            "Outstanding or disputed commercial evidence cannot establish complete closeout.",
          );
        if (f.outcome === "Not required" && source.outcome !== "Not required")
          fail(
            "Commercial Not required needs explicit source applicability authority.",
          );
        await decide(
          c,
          p,
          cmd,
          d,
          "Commercial",
          need(f.outcome, "outcome"),
          source.id,
          {
            evidence: need(f.evidence, "evidence"),
            source_fingerprint: source.fingerprint,
          },
        );
        subject = source.id;
      } else if (cmd.action === "closeStage") {
        const detail = requireDetail();
        if (detail.stage.closeout === "Closed")
          fail("This stage already has a closeout decision.");
        if (detail.closeout_gates.length) fail(detail.closeout_gates.join(" "));
        await decide(c, p, cmd, detail, "Stage closeout", "Closed", null, {
          remaining_obligations: detail.obligations
            .filter((o) => o.state !== "Completed")
            .map((o) => o.id),
        });
        await c.query(
          "UPDATE ppo.acceptance_stages SET closeout='Closed',reassessment=false,version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, detail.stage.id, p.actor_id],
        );
      } else if (cmd.action === "closeProject") {
        if (stage) fail("Whole-project closure is a separate project command.");
        if (project.lifecycle === "Closed")
          fail("This project is already closed.");
        const details = await allDetails(c, p, project),
          ledger = await projectUnits(c, p, project.id),
          decisions = await decisionsFor(c, p, project.id),
          gates = projectClosureGates(ledger, details, decisions, sources);
        const current = hash({
          ledger,
          stages: details.map((d) => [
            d.stage.id,
            d.stage.version,
            d.facts_hash,
          ]),
          decisions: decisions
            .filter((d) => d.revision === null)
            .map((d) => d.id),
        });
        if (cmd.facts_hash !== current)
          fail(
            "The whole-project closeout review changed. Refresh and review its entire ledger.",
            "VersionConflict",
            409,
          );
        if (gates.length) fail(gates.join(" "));
        await decide(c, p, cmd, null, "Project closeout", "Closed", null, {
          ledger,
          stages: details.map((d) => ({
            id: d.stage.id,
            revision: d.stage.revision,
            facts_hash: d.facts_hash,
            decisions: d.decisions.map((x) => x.id),
          })),
        });
        await c.query(
          "UPDATE ppo.projects SET lifecycle='Closed',version=version+1,acceptance_version=acceptance_version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, project.id, p.actor_id],
        );
      } else if (cmd.action === "reopen" || cmd.action === "amendment") {
        const unitIds = need(f.unit_ids, "unit_ids");
        if (!unitIds.length) fail("Name the exact changed scope.");
        for (const id of unitIds) await unit(id);
        const prior = (await decisionsFor(c, p, project.id)).find(
          (x) =>
            x.kind === (stage ? "Stage closeout" : "Project closeout") &&
            (!stage ||
              (x as typeof x & { stage_id: string }).stage_id === stage.id),
        );
        if (!prior) fail("An original closeout decision is required.");
        if (cmd.action === "amendment" && d?.closeout_gates.length)
          fail(
            "Affected gates remain outstanding; reopen the affected basis before accepting an amendment.",
          );
        await decide(
          c,
          p,
          cmd,
          d,
          cmd.action === "reopen" ? "Reopen" : "Amendment",
          cmd.action === "reopen" ? "Reopened" : "Unaffected scope confirmed",
          prior!.id,
          { affected_units: unitIds },
        );
        if (stage) {
          await c.query(
            "UPDATE ppo.acceptance_stages SET closeout=$3,reassessment=false,version=version+1,updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [
              p.workspace_id,
              stage.id,
              cmd.action === "reopen" ? "Reopened" : stage.closeout,
              p.actor_id,
            ],
          );
          await followup(
            c,
            p,
            project,
            stage,
            `reopen:${cmd.operation_id}`,
            `Review reopened acceptance scope: ${stage.title}`,
          );
        }
        if (cmd.action === "reopen")
          await c.query(
            "UPDATE ppo.projects SET lifecycle='Active',version=version+1,acceptance_version=acceptance_version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, project.id, p.actor_id],
          );
      }
      // Touch once for decisions and related facts. Commands that changed the stage already advance it above.
      if (
        stage &&
        ![
          "edit",
          "scope",
          "submit",
          "return",
          "successor",
          "closeStage",
          "reopen",
          "amendment",
          "source",
        ].includes(cmd.action)
      )
        await c.query(
          "UPDATE ppo.acceptance_stages SET version=version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, stage.id, p.actor_id],
        );
      if (!["closeProject", "reopen"].includes(cmd.action))
        await c.query(
          "UPDATE ppo.projects SET version=version+1,acceptance_version=acceptance_version+1,updated_at=clock_timestamp(),updated_by=$3 WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, project.id, p.actor_id],
        );
      await c.query(
        `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot)
      SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'ProjectAcceptanceChanged',$4,to_jsonb(p) FROM ppo.projects p WHERE workspace_id=$5 AND id=$6`,
        [
          randomUUID(),
          p.actor_id,
          cmd.operation_id,
          cmd.reason.slice(0, 1000),
          p.workspace_id,
          project.id,
        ],
      );
      await event(
        c,
        p,
        cmd,
        cmd.action,
        {
          subject_id: subject,
          stage_revision: d?.stage.revision ?? null,
          scope_unit_ids: f.unit_ids ?? f.units?.map((u) => u.unit_id) ?? null,
          source_version: f.source_version ?? null,
          outcome: f.outcome ?? null,
        },
        subject,
      );
      const result = (
        await c.query(
          resultId === project.id
            ? "SELECT id,version,lifecycle AS state,updated_at FROM ppo.projects WHERE workspace_id=$1 AND id=$2"
            : "SELECT id,version,CASE WHEN closeout='Closed' THEN closeout ELSE state END AS state,updated_at FROM ppo.acceptance_stages WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, resultId],
        )
      ).rows[0];
      return {
        ...result,
        audit_details: {
          stage_id: cmd.stage_id,
          project_id: project.id,
          subject_id: subject,
        },
      };
    },
    cmd.stage_id || cmd.action === "create" ? "AcceptanceStage" : "Project",
    cmd.action === "issue"
      ? "AcceptanceIssued"
      : ["closeStage", "closeProject"].includes(cmd.action)
        ? "AcceptanceClosed"
        : "AcceptanceChanged",
  );
}

export async function command(p: Principal, value: unknown) {
  const cmd = parseCommand(value);
  await registerIntent(p, cmd);
  try {
    return await executeCommand(p, value);
  } catch (e) {
    await intentFailure(p, cmd, e);
    throw e;
  }
}
