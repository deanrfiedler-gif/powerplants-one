import { randomUUID } from "node:crypto";
import { database, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { createProject } from "../../src/projects/service";
import { createEngineeringRequest } from "../../src/engineering/service";
import { insert } from "../../src/documents/packs";
import {
  CHANGES,
  changeScenarioIds,
  seedChangesScenario,
} from "./engineering-changes";
import { directSignIn } from "./engineering-changes-direct";
import { CRM } from "./crm";
import { engineeringInput } from "./engineering";
import { projectInput } from "./projects";
import { confirmed } from "./packs";

// Read-model fixture only, in the disposable synthetic database. Native EN-07
// commands build the rich case; SQL adds schema-valid read states and scale.
// No renderer, issued bytes or operational evidence is claimed by these rows.
export async function reviewSourcesFixture(count = 64) {
  if (localConfig().database_name !== "ppo_synthetic_test")
    throw Error("Disposable synthetic database only");
  const c = database(),
    ids = changeScenarioIds(false);
  // Keep the rich package inside the bounded window, independently of UUID luck.
  ids.materials.package = `0${ids.materials.package.slice(1)}`;
  const made = await seedChangesScenario(directSignIn, ids);
  const broad = (await createSession("coordinator")).principal,
    reviewer = (await createSession(CHANGES.reviewer.profile)).principal,
    author = (await createSession(CHANGES.author.profile)).principal,
    other = (await createSession("second-company")).principal,
    denied = (await createSession("finance")).principal;
  const supply = await directSignIn(CHANGES.supply.profile);
  const h = (
    await c.query(
      `SELECT h.*,s.id AS submission_id FROM ppo.change_handovers h JOIN ppo.change_submissions s ON s.handover_id=h.id WHERE h.change_id=$1 ORDER BY s.submission_number DESC LIMIT 1`,
      [made.changes["003"]],
    )
  ).rows[0];
  const returned = await supply(
    `engineering/${made.package_id}/changes/handovers`,
    {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN review equivalence returned handover",
      action: "decide",
      change_id: h.change_id,
      handover_id: h.id,
      submission_id: h.submission_id,
      expected_version: h.version,
      outcome: "Returned",
      outcome_reason: "SYN exact correction required",
      owner_id: CHANGES.engineer.id,
      due: "2031-10-02",
    },
  );
  if (returned.status >= 300) throw Error(JSON.stringify(returned.body));
  const engineer = await directSignIn(CHANGES.engineer.profile);
  const version = (
    await c.query("SELECT version FROM ppo.engineering_changes WHERE id=$1", [
      made.changes["007"],
    ])
  ).rows[0].version;
  const revised = await engineer(
    `engineering/${made.package_id}/changes/impact`,
    {
      operation_id: randomUUID(),
      schema_version: 1,
      reason: "SYN review equivalence stale receiving request",
      action: "revise",
      change_id: made.changes["007"],
      expected_version: version,
      id: randomUUID(),
    },
  );
  if (revised.status >= 300) throw Error(JSON.stringify(revised.body));
  const packageIds = [made.package_id];
  // Distinct sites and companies exercise both visibility and scoped duties.
  const project = projectInput();
  await createProject(broad, project);
  const otherProject = {
    ...projectInput(),
    company_id: CRM.companyB,
    organisation_id: CRM.orgB,
    site_id: "70000000-0000-4000-8000-000000000003",
    coordinator_id: other.actor_id,
  };
  await createProject(other, otherProject);
  const extra = [];
  for (const [p, projectId] of [
    [broad, project.id],
    [other, otherProject.id],
  ] as const) {
    const input = {
      ...engineeringInput(projectId),
      id: `1${randomUUID().slice(1)}`,
      owner_id: p.actor_id,
    };
    await createEngineeringRequest(p, input);
    extra.push(input.id);
    packageIds.push(input.id);
  }
  // >50 readable packages for broad/author; many empty packages must still be checked.
  for (let i = 0; i < count - 3; i++) {
    const id = `8${randomUUID().slice(1)}`;
    packageIds.push(id);
    await createEngineeringRequest(broad, {
      ...engineeringInput(ids.materials.project),
      id,
      title: `SYN review page package ${i}`,
    });
  }
  // Clone only the retained review inputs. The oracle still computes its full
  // source workspace independently, including empty source/overlap collections.
  for (const [index, packageId] of [
    extra[0],
    extra[1],
    packageIds.slice(3).sort().at(-1)!,
  ].entries()) {
    const changeId = randomUUID(),
      revisionId = randomUUID(),
      company = index === 1 ? CRM.companyB : CRM.company;
    await c.query(
      `INSERT INTO ppo.engineering_changes SELECT (jsonb_populate_record(NULL::ppo.engineering_changes,
      to_jsonb(t)||jsonb_build_object('id',$2::text,'package_id',$3::text,'company_id',$4::text,'stage',$5::text))).*
      FROM ppo.engineering_changes t WHERE id=$1`,
      [
        made.changes["001"],
        changeId,
        packageId,
        company,
        index === 2 ? "Closed" : "InReview",
      ],
    );
    await c.query(
      `INSERT INTO ppo.change_revisions SELECT (jsonb_populate_record(NULL::ppo.change_revisions,
      to_jsonb(t)||jsonb_build_object('id',$2::text,'change_id',$3::text,'company_id',$4::text))).*
      FROM ppo.change_revisions t WHERE change_id=$1 AND revision_number=1`,
      [made.changes["001"], revisionId, changeId, company],
    );
    await c.query(
      `INSERT INTO ppo.change_reviews SELECT (jsonb_populate_record(NULL::ppo.change_reviews,
      to_jsonb(t)||jsonb_build_object('id',$2::text,'change_id',$3::text,'revision_id',$4::text,'company_id',$5::text,'reviewer_id',$6::text))).*
      FROM ppo.change_reviews t WHERE change_id=$1`,
      [
        made.changes["001"],
        randomUUID(),
        changeId,
        revisionId,
        company,
        index === 1 ? other.actor_id : reviewer.actor_id,
      ],
    );
  }
  // Site-only read and review. A company-wide expired grant must not widen it.
  await c.query(
    "UPDATE ppo.permission_grants SET scope_type='Site',scope_id=$2,site_id=$2 WHERE user_id=$1 AND capability IN ('engineering.read','engineering.change.review')",
    [reviewer.actor_id, ids.materials.site],
  );
  for (const capability of ["engineering.read", "engineering.change.review"])
    await c.query(
      `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from,valid_to)
       VALUES($1,$2,$3,$4,'Company',$5,$5,'2020-01-01','2021-01-01')`,
      [randomUUID(), CRM.workspace, reviewer.actor_id, capability, CRM.company],
    );
  await c.query(
    `INSERT INTO ppo.permission_grants(id,workspace_id,user_id,capability,scope_type,scope_id,company_id,valid_from,valid_to)
    VALUES($1,$2,$3,'engineering.change.review','Company',$4,$4,'2020-01-01','2021-01-01')`,
    [randomUUID(), CRM.workspace, author.actor_id, CRM.company],
  );
  await c.query(
    `INSERT INTO ppo.change_policies(id,workspace_id,company_id,site_id,policy_version,grants,effective_from)
    SELECT $1,workspace_id,company_id,$2,policy_version+1,
      (SELECT jsonb_agg(CASE WHEN g->>'actor_id'=$4 THEN g||'{"disciplines":["Hydraulics"]}'::jsonb ELSE g END) FROM jsonb_array_elements(grants) g),
      '2020-01-01' FROM ppo.change_policies WHERE company_id=$3 AND site_id IS NULL ORDER BY policy_version DESC LIMIT 1`,
    [randomUUID(), ids.materials.site, CRM.company, reviewer.actor_id],
  );
  await reviewOtherDomains();
  return {
    broad,
    reviewer,
    author,
    other,
    denied,
    packageIds,
    made,
    site: ids.materials.site,
    extra,
  };
}

async function reviewOtherDomains() {
  const p = (await createSession("coordinator")).principal;
  // Finance context and readFinance remain real, including the incomplete-Draft
  // readiness result. No rendering or financial processing is needed for reads.
  for (const status of ["Draft", "ReadyForReview", "Returned", "Cancelled"]) {
    await transaction(async (client) => {
      const h = (
        await client.query(
          `INSERT INTO ppo.finance_handoffs(id,workspace_id,company_id,site_id,work_order_id,customer_id,account_id,display_number,status,mode,currency,owner_id,correlation_id,created_by,updated_by)
        SELECT gen_random_uuid(),w.workspace_id,w.company_id,w.site_id,w.id,w.customer_id,a.id,NULL,'Draft','SyntheticManual',a.currency,$1,gen_random_uuid(),$1,$1
        FROM ppo.work_orders w JOIN ppo.finance_accounts a ON (a.workspace_id,a.company_id,a.organisation_id)=(w.workspace_id,w.company_id,w.customer_id)
        WHERE w.company_id=$2 ORDER BY w.id LIMIT 1 RETURNING *`,
          [p.actor_id, CRM.company],
        )
      ).rows[0];
      const revision = randomUUID();
      await client.query(
        `INSERT INTO ppo.finance_revisions(id,workspace_id,handoff_id,revision,definition_id,definition_version,policy_version,source_snapshot,source_hash,treatment_basis,remaining_work_basis,reason,actor_id,operation_id)
        SELECT $1,$2,$3,1,d.id,d.version,fp.version,'{"reports":[]}',repeat('0',64),'SYN projection fixture only','SYN no operational work','SYN reader equivalence',$4,$5
        FROM ppo.finance_policy fp JOIN ppo.finance_definitions d ON d.id=fp.definition_id WHERE fp.workspace_id=$2`,
        [revision, p.workspace_id, h.id, p.actor_id, randomUUID()],
      );
      await insert(client, "finance_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: h.id,
        version: 1,
        status: "Draft",
        revision_id: null,
        actor_id: p.actor_id,
        kind: "Prepared",
        reason: "SYN read fixture",
      });
      await client.query(
        "UPDATE ppo.finance_handoffs SET version=2,revision=1,current_revision_id=$2,status=$3 WHERE id=$1",
        [h.id, revision, status],
      );
      await insert(client, "finance_events", {
        id: randomUUID(),
        workspace_id: p.workspace_id,
        handoff_id: h.id,
        version: 2,
        status,
        revision_id: revision,
        actor_id: p.actor_id,
        kind: status === "Draft" ? "Prepared" : "Submitted",
        reason: "SYN read fixture",
      });
    });
  }
  // Minimal retained Draft report: an actual confirmed appointment/assignment,
  // synthetic pack retention rows and a guarded attendance. No PDF is fabricated.
  const q = await confirmed();
  await transaction(async (client) => {
    const a = (
      await client.query("SELECT * FROM ppo.appointments WHERE id=$1", [q.id])
    ).rows[0];
    const assignments = (
      await client.query(
        `SELECT x.*,r.user_id FROM ppo.assignments x JOIN ppo.resources r ON r.id=x.resource_id WHERE x.appointment_id=$1 AND x.active AND r.user_id IS NOT NULL ORDER BY x.id`,
        [a.id],
      )
    ).rows;
    const pack = randomUUID(),
      revision = randomUUID(),
      check = randomUUID(),
      job = randomUUID(),
      issue = randomUUID();
    const hash = "0".repeat(64),
      scope = { workspace_id: p.workspace_id },
      provenance = { created_by: p.actor_id, updated_by: p.actor_id };
    await insert(client, "packs", {
      id: pack,
      ...scope,
      company_id: a.company_id,
      site_id: a.site_id,
      appointment_id: a.id,
      display_number: null,
      ...provenance,
    });
    await insert(client, "pack_revisions", {
      id: revision,
      ...scope,
      pack_id: pack,
      revision: 1,
      input: {},
      snapshot: {},
      content_hash: hash,
      change_reason: "SYN read projection only",
      created_by: p.actor_id,
    });
    await insert(client, "pack_checks", {
      id: check,
      ...scope,
      pack_id: pack,
      revision_id: revision,
      decision: "Checked",
      reason: "SYN read fixture",
      actor_id: p.actor_id,
      content_hash: hash,
    });
    await insert(client, "pack_render_jobs", {
      id: job,
      ...scope,
      pack_id: pack,
      revision_id: revision,
      check_id: check,
      actor_id: p.actor_id,
      operation_id: randomUUID(),
      finalisation_operation_id: randomUUID(),
      input_hash: hash,
      render_snapshot: { issue_id: issue },
      state: "Durable",
      output_manifest: { synthetic_read_fixture: true, pdf_hash: hash },
      recovery_owner_id: p.actor_id,
    });
    await client.query(
      "UPDATE ppo.packs SET version=version+1,current_revision_id=$2,status='Checked' WHERE id=$1",
      [pack, revision],
    );
    await insert(client, "pack_issues", {
      id: issue,
      ...scope,
      pack_id: pack,
      revision_id: revision,
      render_job_id: job,
      issued_by: p.actor_id,
      manifest: { synthetic_read_fixture: true, pdf_hash: hash },
      output_hash: hash,
      snapshot_hash: hash,
      assignment_version: a.assignment_version,
      schedule_version: a.schedule_version,
    });
    await client.query(
      "UPDATE ppo.packs SET version=version+1,current_revision_id=$2,current_issue_id=$3,status='Issued',needs_review=false WHERE id=$1",
      [pack, revision, issue],
    );
    const crew = (
      await client.query(
        "SELECT x.*,r.user_id FROM ppo.assignments x JOIN ppo.resources r ON r.id=x.resource_id WHERE x.appointment_id=$1 AND x.active",
        [a.id],
      )
    ).rows;
    for (const member of crew) {
      const recipient = randomUUID();
      await insert(client, "pack_recipients", {
        id: recipient,
        ...scope,
        issue_id: issue,
        assignment_id: member.id,
        assignment_version: member.assignment_version,
        user_id: member.user_id,
      });
      await insert(client, "pack_acknowledgements", {
        id: randomUUID(),
        ...scope,
        recipient_id: recipient,
        actor_id: member.user_id,
        operation_id: randomUUID(),
        presented_hash: hash,
        captured_at: new Date(),
      });
    }
    await client.query(
      "UPDATE ppo.appointments SET version=version+1,dispatch_hold=false,pack_requirement='Acknowledged' WHERE id=$1",
      [a.id],
    );
    for (const assignment of assignments) {
      const attendance = randomUUID();
      await client.query(
        `INSERT INTO ppo.field_attendances(id,workspace_id,company_id,site_id,appointment_id,actor_id,assignment_id,assignment_version,schedule_version,scope_revision_id,scope_version,scope_hash,issue_id,issue_hash,captured_at,authority_snapshot,authority_hash,operation_id,reason)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$12,clock_timestamp(),'{}',encode(sha256(convert_to('{}','UTF8')),'hex'),$14,'SYN read fixture')`,
        [
          attendance,
          p.workspace_id,
          a.company_id,
          a.site_id,
          a.id,
          assignment.user_id,
          assignment.id,
          a.assignment_version,
          a.schedule_version,
          a.scope_revision_id,
          a.scope_version,
          hash,
          issue,
          randomUUID(),
        ],
      );
      await insert(client, "service_reports", {
        id: randomUUID(),
        ...scope,
        company_id: a.company_id,
        site_id: a.site_id,
        appointment_id: a.id,
        attendance_id: attendance,
        actor_id: assignment.user_id,
        display_number: null,
        status: "Draft",
        ...provenance,
      });
    }
  });
}
