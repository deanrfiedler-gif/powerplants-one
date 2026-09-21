import { acknowledgeIntent } from "../../src/projects/acceptance/intents";
import { createHash, randomUUID } from "node:crypto";
import { database, transaction } from "../../src/platform/database";
import {
  createOrganisation,
  createSite,
  createPerson,
} from "../../src/shared/commands";
import { command } from "../../src/projects/acceptance/commands";
import { readWorkspace } from "../../src/projects/acceptance/reads";
import { principalOf } from "./engineering-materials-direct";
import type { Action, Fields } from "../../src/projects/acceptance/validation";
import { dayNumber, addDays, todayInZone } from "../../src/projects/model";
export const W = "10000000-0000-4000-8000-000000000001",
  C = "20000000-0000-4000-8000-000000000001";
export const stable = (key: string) => {
  const h = createHash("sha256")
    .update("ppo-pj09:" + key)
    .digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
export const PJ = {
  project: stable("project"),
  organisation: stable("organisation"),
  site: stable("site"),
  person: stable("person"),
  coordinator: "30000000-0000-4000-8000-000000000001",
  sam: "30000000-0000-4000-8000-000000000017",
  alex: "30000000-0000-4000-8000-000000000016",
  receiver: "30000000-0000-4000-8000-000000000023",
};
export const base = (key: string) => ({
  operation_id: stable("op:" + key),
  schema_version: 1,
  reason: "SYN PJ-09 fixture: " + key,
});
export async function contextFixture(
  projectId = PJ.project,
  reference = "SYN-PPO-PRJ-000701",
) {
  const p = await principalOf("coordinator");
  for (const [table, id, run] of [
    [
      "organisations",
      PJ.organisation,
      () =>
        createOrganisation(p, {
          ...base("customer"),
          id: PJ.organisation,
          company_id: C,
          display_name: "Willowbank Horticulture",
          relationship_status: "Active",
          owner_id: p.actor_id,
          sector: "Nursery",
          access_class: "Internal",
        }),
    ],
    [
      "sites",
      PJ.site,
      () =>
        createSite(p, {
          ...base("site"),
          id: PJ.site,
          company_id: C,
          display_name: "Nursery & propagation site",
          location_description: "Fictional PJ-09 nursery site.",
          timezone: "Australia/Brisbane",
          owner_id: p.actor_id,
          parties: [
            {
              organisation_id: PJ.organisation,
              role: "Operator",
              valid_from: "2026-01-01T00:00:00.000Z",
            },
          ],
        }),
    ],
    [
      "people",
      PJ.person,
      () =>
        createPerson(p, {
          ...base("customer-person"),
          id: PJ.person,
          company_ids: [C],
          display_name: "SYN Rowan Ellis",
          email: "rowan@example.invalid",
        }),
    ],
  ] as const)
    if (
      !(await database().query(`SELECT 1 FROM ppo.${table} WHERE id=$1`, [id]))
        .rowCount
    )
      await run();
  await transaction(async (c) => {
    // Explicit synthetic reference reservation through the existing PRJ allocator trigger. No existing
    // project is renamed; the EN-08 fixture's original project and receipts remain untouched.
    if (
      !(await c.query("SELECT 1 FROM ppo.projects WHERE id=$1", [projectId]))
        .rowCount
    ) {
      await c.query(
        "INSERT INTO ppo.projects(id,workspace_id,company_id,display_number,title,organisation_id,site_id,coordinator_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8,$8)",
        [
          projectId,
          W,
          C,
          reference,
          projectId === PJ.project
            ? "Nursery irrigation upgrade"
            : "SYN Complete acceptance journey",
          PJ.organisation,
          PJ.site,
          p.actor_id,
        ],
      );
      await c.query(
        `INSERT INTO ppo.project_schedule_events(id,workspace_id,company_id,project_id,created_by,updated_by,operation_id,project_version,event_type,reason,project_snapshot) SELECT $1,workspace_id,company_id,id,$2,$2,$3,version,'ProjectCreated','SYN PJ-09 explicit fixture reference',to_jsonb(p) FROM ppo.projects p WHERE id=$4`,
        [
          stable(projectId + ":created-event"),
          p.actor_id,
          stable(projectId + ":created-op"),
          projectId,
        ],
      );
    }

    if (
      !(
        await c.query(
          "SELECT 1 FROM ppo.relationships WHERE workspace_id=$1 AND organisation_id=$2 AND person_id=$3",
          [W, PJ.organisation, PJ.person],
        )
      ).rowCount
    )
      await c.query(
        "INSERT INTO ppo.relationships(id,workspace_id,company_id,organisation_id,person_id,role_label,valid_from,created_by,updated_by) VALUES($1,$2,$3,$4,$5,'ProjectContact','2026-01-01',$6,$6)",
        [stable("relationship"), W, C, PJ.organisation, PJ.person, p.actor_id],
      );
  });
  return p;
}
export async function act(
  profile: string,
  project: string,
  stage: string | null,
  action: Action,
  fields: Fields = {},
  operation_id: string = randomUUID(),
  reason = "SYN acceptance journey: " + action,
) {
  const p = await principalOf(profile),
    data = await readWorkspace(p, { project, ...(stage ? { stage } : {}) });
  const body = {
    operation_id,
    schema_version: 1,
    reason,
    action,
    project_id: project,
    stage_id: stage,
    expected_version: stage
      ? data.selected!.stage.version
      : data.project.version,
    facts_hash: stage ? data.selected!.facts_hash : data.project_facts_hash,
    fields: JSON.parse(JSON.stringify(fields)),
  };
  const result = await command(p, body);
  await acknowledgeIntent(p, operation_id);
  return { ...result, body };
}
export async function seedStage(
  project: string,
  key: string,
  title: string,
  sourceOutcome = "Satisfied",
  technicalId?: string,
  scopeKey?: string,
) {
  const stage = stable(`${project}:${key}:stage`),
    unit = stable(`${project}:${key}:unit`),
    source = stable(`${project}:${key}:source`);
  const coordinator = await principalOf("coordinator");
  const exists = async (table: string, id: string) =>
    (await database().query(`SELECT 1 FROM ppo.${table} WHERE id=$1`, [id]))
      .rowCount;
  const current = (
    await database().query(
      "SELECT state FROM ppo.acceptance_stages WHERE id=$1",
      [stage],
    )
  ).rows[0];
  if (current?.state === "In review") {
    if (
      !(
        await database().query(
          "SELECT 1 FROM ppo.acceptance_checks WHERE stage_id=$1",
          [stage],
        )
      ).rowCount
    )
      await act("coordinator", project, stage, "check");
    if (
      sourceOutcome === "Satisfied" &&
      !(
        await database().query(
          "SELECT 1 FROM ppo.acceptance_decisions WHERE stage_id=$1 AND kind='Technical'",
          [stage],
        )
      ).rowCount
    )
      await act("materials-reviewer", project, stage, "technical");
    return { stage, unit, source };
  }
  const saved = (
    await database().query(
      "SELECT min(created_at)::date::text AS anchor FROM ppo.acceptance_events WHERE project_id=$1",
      [project],
    )
  ).rows[0]?.anchor;
  const anchor = saved ?? todayInZone("Australia/Brisbane");
  const due = addDays(anchor, key === "A" ? 1 : key === "H" ? 0 : 2);
  if (!(await exists("acceptance_units", unit)))
    await act("coordinator", project, null, "unit", {
      id: unit,
      reference: `SYN-UNIT-${key}`,
      title,
      system_name: "Irrigation",
      function_name: "Delivery and support",
      installed_at: key === "A" ? "Greenhouse 01" : title,
      served_areas: [title],
      configuration_version: "SYN-CFG-r01",
      required: true,
    });
  if (!(await exists("acceptance_sources", source)))
    await act("coordinator", project, null, "source", {
      id: source,
      title:
        key === "A" ? "As-built release pending" : "Technical release evidence",
      kind: "Technical",
      outcome: sourceOutcome,
      availability:
        sourceOutcome === "Cannot assess" ? "Unavailable" : "Current",
      details: {
        evidence:
          key === "A"
            ? "Redline RL-017 still needs valve V-07 label incorporation."
            : "SYN reviewed exact release source",
        tests_accepted: 12,
        tests_required: 12,
        release: "SYN-TECH-" + key + "-r01",
      },
      public_reference: "SYN-TECH-" + key,
      source_version: "r01",
      ...(technicalId
        ? { commissioning_id: technicalId, scope_key: scopeKey }
        : {}),
    });
  if (!(await exists("acceptance_stages", stage)))
    await act("coordinator", project, null, "create", {
      id: stage,
      title,
      owner_id: key === "B" ? PJ.alex : PJ.sam,
      due: key === "H" ? null : due,
      due_basis: "Acceptance review due",
    });
  if (
    !(
      await database().query(
        "SELECT 1 FROM ppo.acceptance_stage_units WHERE stage_id=$1",
        [stage],
      )
    ).rowCount
  )
    await act("coordinator", project, stage, "scope", {
      units: [
        {
          unit_id: unit,
          disposition: "Included",
          reason: "Exact synthetic delivery scope",
          relationship: null,
        },
      ],
    });
  if (!(await exists("acceptance_requirements", stable(stage + ":req-tech"))))
    await act("coordinator", project, stage, "requirement", {
      id: stable(stage + ":req-tech"),
      unit_id: unit,
      source_id: source,
      title:
        key === "A" ? "Incorporate redline RL-017" : "Exact technical release",
      gate: "Technical",
      mandatory: true,
      owner_id: PJ.sam,
      due: key === "H" ? null : due,
      due_basis: "Release required before acceptance",
    });
  for (const kind of ["Training", "Manual", "Backup", "Commercial"]) {
    const sid = stable(stage + ":" + kind),
      detail =
        kind === "Training"
          ? {
              evidence: "SYN training evidence",
              planned_on: anchor,
              delivered_on: anchor,
              attendance: "SYN signed operator attendance r01",
              competence: "SYN separate competence assessment r01",
            }
          : kind === "Manual"
            ? {
                evidence: "SYN exact manual",
                source_reference: "SYN-MANUAL-r01",
                availability_evidence:
                  "Exact synthetic version verified available",
              }
            : kind === "Backup"
              ? {
                  evidence: "SYN restore test report r01",
                  backup_available: true,
                  identity_verified: true,
                  restore_verified: true,
                }
              : {
                  evidence: "SYN authorised commercial closeout source",
                  source_reference: "SYN-COMM-r01",
                  as_at: new Date().toISOString(),
                  completeness: "Complete",
                  currency: "AUD",
                  private_note: "PRIVATE_FINANCE_CANARY_PJ09",
                };
    if (!(await exists("acceptance_sources", sid)))
      await act(
        kind === "Commercial" ? "finance-reviewer" : "coordinator",
        project,
        null,
        "source",
        {
          id: sid,
          title: kind + " evidence",
          kind,
          outcome:
            key === "F" && kind === "Commercial" ? "Blocked" : "Satisfied",
          availability: "Current",
          details: detail,
          public_reference: "SYN-" + kind.toUpperCase() + "-" + key,
          source_version: "r01",
        },
      );
    if (
      !(await exists("acceptance_requirements", stable(stage + ":req-" + kind)))
    )
      await act("coordinator", project, stage, "requirement", {
        id: stable(stage + ":req-" + kind),
        unit_id: unit,
        source_id: sid,
        title: kind + " evidence",
        gate: kind === "Commercial" ? "Commercial" : "Handover",
        mandatory: true,
        owner_id: PJ.sam,
        due: null,
        due_basis: "Required before handover",
      });
  }
  await act(
    "coordinator",
    project,
    stage,
    "submit",
    {},
    stable(stage + ":submit"),
  );
  await act("coordinator", project, stage, "check");
  void coordinator;
  void dayNumber;
  if (sourceOutcome === "Satisfied")
    await act("materials-reviewer", project, stage, "technical");
  return { stage, unit, source };
}
export async function handover(
  project: string,
  stage: string,
  audience: "Customer" | "Service",
  key: string,
) {
  const id = stable(stage + ":manifest:" + key);
  let data = await readWorkspace(await principalOf("coordinator"), {
      project,
      stage,
    }),
    m = data.selected!.manifests.find((m) => m.id === id);
  if (!m) {
    await act("coordinator", project, stage, "prepare", {
      id,
      audience,
      recipient_id: audience === "Customer" ? PJ.person : PJ.receiver,
      purpose: "Stage acceptance and continuing support",
    });
    data = await readWorkspace(await principalOf("coordinator"), {
      project,
      stage,
    });
    m = data.selected!.manifests.find((m) => m.id === id)!;
  }
  if (!m.issue_id) {
    await act("coordinator", project, stage, "issue", { id });
    data = await readWorkspace(await principalOf("coordinator"), {
      project,
      stage,
    });
    m = data.selected!.manifests.find((m) => m.id === id)!;
  }
  if (!m.request_id) {
    await act("coordinator", project, stage, "request", {
      id: stable(id + ":request"),
      issue_id: m.issue_id!,
      due: null,
    });
    data = await readWorkspace(await principalOf("coordinator"), {
      project,
      stage,
    });
    m = data.selected!.manifests.find((m) => m.id === id)!;
  }
  return m;
}
