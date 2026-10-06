import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { createSession } from "../../src/platform/identity";
import { hasPermission } from "../../src/platform/permissions";
import { conversionReadClient } from "../../src/estimating/conversion/source-authority";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { reset, migrate, seed } from "../../scripts/database";
import { readFile } from "node:fs/promises";
import { activityCommand } from "../../src/activities/activities";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  receiveSupply,
  referSupply,
  reviewSupply,
  applySupply,
} from "../../src/estimating/supply-followup/service";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import {
  dispositionReview,
  dispositionApply,
} from "../helpers/quotation-disposition";
import {
  acknowledgement,
  referral,
  reservationReview,
  supplyApply,
} from "../helpers/quotation-supply-followup";
import { taskInput } from "../helpers/projects";
import { crmBase } from "../helpers/crm";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { workspace } from "../../src/supply/reads";
import { saveRecord, recordFact } from "../../src/supply/commands";
import { saveTask } from "../../src/projects/service";
import { readOperation } from "../../src/shared/receipts";
import { draftBytes, retryQuote } from "../../src/estimating/worker";
import {
  materialFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  materialApply,
  receiveMaterial,
} from "../helpers/quotation-material-resolution";
import { currentFollowup } from "../helpers/quotation-supply-followup";
import { supplyInput, supplyFact } from "../helpers/supply";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const code = (v: string) => (e: unknown) => (e as { code: string }).code === v;

test("prepared reads work without migration-ledger privilege and refresh changed relation result shapes", async () => {
  const owner = (await createSession("coordinator")).principal;
  const c = await database().connect();
  // Generated identifiers contain only this fixed prefix and UUID hex.
  const suffix = randomUUID().replaceAll("-", "");
  const role = `ppo_material_read_${suffix}`;
  const table = `ppo.material_read_${suffix}`;
  try {
    await c.query("BEGIN");
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      owner.workspace_id,
    ]);
    await c.query(`CREATE ROLE ${role} NOLOGIN`);
    await c.query(`GRANT USAGE ON SCHEMA ppo TO ${role}`);
    await c.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ppo TO ${role}`);
    await c.query(`CREATE TABLE ${table}(value text NOT NULL)`);
    await c.query(`INSERT INTO ${table} VALUES('SYN original')`);
    await c.query(`GRANT SELECT ON ${table} TO ${role}`);
    await c.query(`SET LOCAL ROLE ${role}`);
    assert.equal(
      (
        await c.query(
          "SELECT has_table_privilege(current_user,'public.ppo_migrations','SELECT') allowed",
        )
      ).rows[0].allowed,
      false,
    );
    const read = await conversionReadClient(c, owner);
    assert.equal(await hasPermission(read, owner, "project.edit"), true);
    const sql = `SELECT * FROM ${table}`;
    assert.deepEqual((await read.query(sql)).rows, [{ value: "SYN original" }]);
    await c.query("RESET ROLE");
    await c.query(
      `ALTER TABLE ${table} ADD COLUMN consequence text NOT NULL DEFAULT 'SYN new field'`,
    );
    await c.query(`SET LOCAL ROLE ${role}`);
    const upgraded = await conversionReadClient(c, owner);
    assert.deepEqual((await upgraded.query(sql)).rows, [
      { value: "SYN original", consequence: "SYN new field" },
    ]);
    assert.equal(
      (
        await c.query(
          "SELECT has_table_privilege(current_user,'public.ppo_migrations','SELECT') allowed",
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await c.query("ROLLBACK");
    c.release();
  }
});

test("prepared read plans retain current actors, record changes, revoked grants and server-clock expiry", async () => {
  const owner = (await createSession("coordinator")).principal;
  const other = await secondOwner(owner);
  const c = await database().connect();
  try {
    await c.query("BEGIN");
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      owner.workspace_id,
    ]);
    const read = await conversionReadClient(c, owner);
    for (let n = 0; n < 6; n++)
      assert.equal(await hasPermission(read, other, "project.edit"), true);
    await c.query(
      "UPDATE ppo.users SET active=false WHERE workspace_id=$1 AND id=$2",
      [other.workspace_id, other.actor_id],
    );
    assert.equal(await hasPermission(read, other, "project.edit"), false);
    assert.equal(await hasPermission(read, owner, "project.edit"), true);
    await c.query(
      "UPDATE ppo.users SET active=true,display_name='SYN changed after preparation' WHERE workspace_id=$1 AND id=$2",
      [other.workspace_id, other.actor_id],
    );
    const sql =
      "SELECT display_name FROM ppo.users WHERE workspace_id=$1 AND id=$2";
    assert.equal(
      (await read.query(sql, [other.workspace_id, other.actor_id])).rows[0]
        .display_name,
      "SYN changed after preparation",
    );
    await c.query(
      "UPDATE ppo.users SET display_name='SYN fresh current record' WHERE workspace_id=$1 AND id=$2",
      [other.workspace_id, other.actor_id],
    );
    assert.equal(
      (await read.query(sql, [other.workspace_id, other.actor_id])).rows[0]
        .display_name,
      "SYN fresh current record",
    );
    await c.query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp()+interval '1 second' WHERE workspace_id=$1 AND user_id=$2 AND capability='project.edit'",
      [other.workspace_id, other.actor_id],
    );
    assert.equal(await hasPermission(read, other, "project.edit"), true);
    await c.query("SELECT pg_sleep(1.05)");
    assert.equal(await hasPermission(read, other, "project.edit"), false);
    assert.equal(await hasPermission(read, owner, "project.edit"), true);
  } finally {
    await c.query("ROLLBACK");
    c.release();
  }
});
async function secondOwner(p: Parameters<typeof executeMaterial>[0]) {
  const id = randomUUID();
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN independent material owner',true,true)",
    [id, p.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2",
    [id, p.actor_id],
  );
  return { ...p, actor_id: id, display_name: "SYN independent material owner" };
}
const rows = async (table: string) =>
  (
    await database().query(
      `SELECT to_jsonb(t) row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
    )
  ).rows;

test("ES07 material: four separate acceptances apply exact Project forecast withdrawal and retain unmet Demand, Activities and original bytes", async () => {
  const f = await materialFixture();
  assert.ok(f.t.material_resolution.candidates.length);
  const bytes = await draftBytes(f.owner, f.id);
  const supply = await workspace(f.owner, f.supply.id);
  const demand = await workspace(f.owner, f.other.id);
  const activities = await rows("activities"),
    allocations = await rows("supply_allocations");
  const proposal = materialProposal(f.t, f.task.id);
  const result = await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    proposal,
  );
  assert.deepEqual(
    (await executeMaterial(f.owner, f.id, "MaterialPropose", proposal)).receipt,
    result.receipt,
  );
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...proposal,
      evidence: "SYN changed",
    }),
    code("OperationConflict"),
  );
  let t = await currentFollowup(f);
  const p = t.material_resolution.proposal!;
  assert.equal(t.status, "Downstream material receiving and review");
  assert.equal(p.allocation_outcome_id, f.t.outcome!.id);
  assert.deepEqual(
    t.material_resolution.required.map((r) => r.role),
    ["Demand", "Project", "Task", "MaterialAction"],
  );
  assert.ok(t.material_resolution.required.every((r) => !r.decision));
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialReview", materialReview(t)),
    code("SupplyFollowupConflict"),
  );
  const accept = materialReceiving(t, "Demand");
  const decisions = await Promise.all([
    executeMaterial(f.owner, f.id, "MaterialReceive", accept),
    executeMaterial(f.owner, f.id, "MaterialReceive", accept),
  ]);
  assert.deepEqual(decisions[0].receipt, decisions[1].receipt);
  for (const role of ["Project", "Task", "MaterialAction"] as const)
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), role),
    );
  t = await currentFollowup(f);
  assert.equal(
    t.material_resolution.required.filter(
      (r) => r.decision?.decision === "Accepted",
    ).length,
    4,
  );
  await executeMaterial(f.owner, f.id, "MaterialReview", materialReview(t));
  t = await currentFollowup(f);
  assert.equal(
    t.material_resolution.can_apply,
    true,
    t.material_resolution.review_holds.join(" "),
  );
  // Exact reserved originals cannot be stolen by their native routes or another family.
  const { project_id, ...pc } = p.project_command;
  const { record_id, ...ic } = p.impact_command;
  await assert.rejects(
    saveTask(f.owner, project_id, pc),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    recordFact(f.owner, record_id, ic),
    code("SupplyFollowupConflict"),
  );
  await assert.rejects(
    saveRecord(f.owner, { ...supplyInput(), operation_id: pc.operation_id }),
  );
  await assert.rejects(readOperation(f.owner, pc.operation_id));
  const apply = materialApply(t);
  const outcomes = await Promise.all([
    executeMaterial(f.owner, f.id, "MaterialApply", apply),
    executeMaterial(f.owner, f.id, "MaterialApply", apply),
  ]);
  assert.deepEqual(outcomes[0].receipt, outcomes[1].receipt);
  t = await currentFollowup(f);
  const outcome = t.material_resolution.applied!;
  assert.equal(outcome.native_receipts.length, 2);
  assert.deepEqual(
    await readOperation(f.owner, pc.operation_id),
    outcome.native_receipts[0],
  );
  assert.deepEqual(
    await readOperation(f.owner, ic.operation_id),
    outcome.native_receipts[1],
  );
  assert.deepEqual(
    (await saveTask(f.owner, project_id, pc)).receipt,
    outcome.native_receipts[0],
  );
  assert.deepEqual(
    (await recordFact(f.owner, record_id, ic)).receipt,
    outcome.native_receipts[1],
  );
  assert.equal(outcome.after!.project.task.start_date, null);
  assert.equal(outcome.after!.project.task.finish_date, null);
  assert.equal(outcome.after!.project.task.status, "Planned");
  assert.equal(
    outcome.after!.project.task.version,
    p.dependencies.project.task.version + 1,
  );
  assert.equal(
    outcome.after!.project.project.version,
    p.dependencies.project.project.version + 1,
  );
  assert.equal(outcome.after!.demand.version, demand.record.version + 1);
  assert.equal(outcome.after!.demand.quantity, "8");
  assert.deepEqual(outcome.after!.demand.data, demand.record.data);
  assert.equal(outcome.after!.unmet, "3.624999");
  assert.notEqual(
    outcome.after!.material.readiness.state,
    "Ready for the stated material scope",
  );
  const successor = outcome.after!.facts.find(
    (x) => x.predecessor_id === p.impact_id,
  )!;
  assert.equal(successor.data.state, "Reviewed");
  assert.equal(successor.activity_id, p.dependencies.activity.id);
  for (const other of p.dependencies.facts.filter((x) => x.id !== p.impact_id))
    assert.ok(outcome.after!.facts.some((x) => x.id === other.id));
  assert.deepEqual(await rows("activities"), activities);
  assert.deepEqual(await rows("supply_allocations"), allocations);
  assert.deepEqual(await workspace(f.owner, f.supply.id), supply);
  assert.deepEqual(await draftBytes(f.owner, f.id), bytes);
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", {
      ...apply,
      operation_id: randomUUID(),
    }),
  );
});

test("ES07 material: corrected Returned/Held receiving invalidates frozen review and preserves predecessor decisions", async () => {
  const f = await materialFixture();
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(f.t, f.task.id),
  );
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  const old = materialApply(await currentFollowup(f));
  for (const decision of ["Returned", "Held"]) {
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), "Task", decision),
    );
    assert.equal(
      (await currentFollowup(f)).material_resolution.can_apply,
      false,
    );
    await assert.rejects(executeMaterial(f.owner, f.id, "MaterialApply", old));
  }
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReceive",
    materialReceiving(await currentFollowup(f), "Task"),
  );
  assert.equal((await currentFollowup(f)).material_resolution.can_apply, false);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  const t = await currentFollowup(f),
    history = t.material_resolution.events.filter((e) => e.role === "Task");
  assert.deepEqual(
    history.map((e) => e.decision),
    ["Accepted", "Returned", "Held", "Accepted"],
  );
  history
    .slice(1)
    .forEach((e, i) => assert.equal(e.predecessor_id, history[i].id));
  await executeMaterial(f.owner, f.id, "MaterialApply", materialApply(t));
});

test("ES07 material: late refusal rolls back both native effects, histories and receipts; absent lookup permits only unchanged original retry", async () => {
  const f = await materialFixture();
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(f.t, f.task.id),
  );
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  const t = await currentFollowup(f),
    cmd = materialApply(t),
    tables = [
      "projects",
      "project_tasks",
      "project_schedule_events",
      "supply_records",
      "supply_revisions",
      "supply_facts",
      "supply_allocations",
      "activities",
      "quote_material_events",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
  const before = await Promise.all(tables.map(rows));
  await database().query(
    "CREATE FUNCTION ppo.material_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='MaterialApply' THEN RAISE EXCEPTION 'SYN late refusal after both native effects'; END IF; RETURN NEW; END $$; CREATE TRIGGER material_injected BEFORE INSERT ON ppo.quote_material_events FOR EACH ROW EXECUTE FUNCTION ppo.material_injected()",
  );
  try {
    await assert.rejects(executeMaterial(f.owner, f.id, "MaterialApply", cmd));
  } finally {
    await database().query(
      "DROP TRIGGER material_injected ON ppo.quote_material_events; DROP FUNCTION ppo.material_injected()",
    );
  }
  assert.deepEqual(await Promise.all(tables.map(rows)), before);
  await assert.rejects(readOperation(f.owner, cmd.operation_id));
  for (const native of [
    t.material_resolution.proposal!.project_command,
    t.material_resolution.proposal!.impact_command,
  ])
    await assert.rejects(readOperation(f.owner, native.operation_id));
  const applied = await executeMaterial(f.owner, f.id, "MaterialApply", cmd);
  assert.deepEqual(
    await readOperation(f.owner, cmd.operation_id),
    applied.receipt,
  );
});

test("ES07 material: unrelated Supply preserves applicability; a new native task dependency holds exact unexecuted work", async () => {
  const f = await materialFixture();
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(f.t, f.task.id),
  );
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  let t = await currentFollowup(f);
  await saveRecord(f.owner, supplyInput());
  assert.equal((await currentFollowup(f)).material_resolution.can_apply, true);
  const old = materialApply(t),
    pc = t.material_resolution.proposal!.project_command;
  await saveTask(f.owner, f.project.id, {
    ...taskInput(pc.expected_version),
    status: "Planned",
    progress: 0,
    dependencies: [{ task_id: f.task.id, kind: "FS" }],
  });
  t = await currentFollowup(f);
  assert.equal(t.material_resolution.can_apply, false);
  await assert.rejects(executeMaterial(f.owner, f.id, "MaterialApply", old));
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(t, f.task.id),
  );
  t = await currentFollowup(f);
  assert.ok(
    t.material_resolution.native_holds.some((h) =>
      h.includes("predecessors or successors"),
    ),
  );
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialReview", materialReview(t)),
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(t, "Hold"),
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialApply",
    materialApply(await currentFollowup(f)),
  );
  t = await currentFollowup(f);
  assert.equal(t.material_resolution.applied!.decision, "Hold");
  assert.deepEqual(t.material_resolution.applied!.native_receipts, []);
  assert.equal(
    t.material_resolution.applied!.after!.project.task.start_date,
    f.task.start_date,
  );
});

test("ES07 material: Activity completion and review notes cannot clear operational Impact or restore readiness", async () => {
  const f = await materialFixture(),
    candidate = f.t.material_resolution.candidates[0];
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(f.t, f.task.id),
  );
  let t = await currentFollowup(f);
  const d = t.material_resolution.dependencies!;
  await activityCommand(
    f.owner,
    candidate.activity_id,
    {
      ...crmBase(),
      expected_version: d.activity.version,
      outcome: "SYN note claims complete; no operational authority",
    },
    "complete",
  );
  t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  assert.equal(
    (await workspace(f.owner, f.other.id)).facts.find(
      (x) => x.id === candidate.impact.id,
    )!.data.state,
    "Requested",
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(t, f.task.id),
  );
  t = await currentFollowup(f);
  assert.ok(
    t.material_resolution.native_holds.some((h) =>
      h.includes("no longer actionable"),
    ),
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(t, "Retain"),
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialApply",
    materialApply(await currentFollowup(f)),
  );
  const outcome = (await currentFollowup(f)).material_resolution.applied!;
  assert.deepEqual(outcome.native_receipts, []);
  assert.equal(outcome.after!.unmet, "3.624999");
  assert.equal(
    outcome.after!.facts.find((x) => x.id === candidate.impact.id)!.data.state,
    "Requested",
  );
  const note = supplyFact("Impact", outcome.after!.demand.version, {
    ...candidate.impact.data,
    state: "Reviewed",
    review_reference: "SYN note only; no verified Project resolution",
  });
  await recordFact(f.owner, f.other.id, {
    ...note,
    predecessor_id: candidate.impact.id,
  });
  const current = await currentFollowup(f);
  assert.equal(
    current.material_resolution.candidates.some(
      (c) => c.impact.id === candidate.impact.id,
    ),
    false,
  );
  assert.equal(
    current.material_resolution.dependencies!.project.task.start_date,
    f.task.start_date,
  );
  assert.equal(current.material_resolution.dependencies!.unmet, "3.624999");
  assert.equal(
    current.material_resolution.events.some(
      (e) => e.action === "MaterialApply" && e.decision === "WithdrawForecast",
    ),
    false,
  );
});

test("ES07 material: quotation retention leaves owned work actionable and returned native evidence requires fresh explicit disposition", async () => {
  const f = await materialFixture();
  let q = await readConversion(f.owner, f.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(q.dispositions[0], "Retain"),
  );
  q = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(q.dispositions[0]));
  q = await readConversion(f.owner, f.id);
  assert.equal(q.dispositions[0].status, "Resolved");
  const t = await currentFollowup(f);
  assert.ok(t.material_resolution.candidates.length);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(t, f.task.id),
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Resolved",
  );
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  assert.equal(
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Resolved",
  );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialApply",
    materialApply(await currentFollowup(f)),
  );
  q = await readConversion(f.owner, f.id);
  assert.equal(q.dispositions[0].status, "Review required");
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(q.dispositions[0], "Retain"),
  );
  q = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(q.dispositions[0]));
  assert.equal(
    (await currentFollowup(f)).material_resolution.dependencies!.unmet,
    "3.624999",
  );
});

test("ES07 material: explicit referral return enables reassignment and new receiving while original decisions remain recoverable", async () => {
  const f = await materialFixture();
  const successor = await secondOwner(f.owner);
  const prop = materialProposal(f.t, f.task.id);
  await executeMaterial(f.owner, f.id, "MaterialPropose", prop);
  let t = await currentFollowup(f);
  const old = t.material_resolution.proposal!;
  assert.equal(t.can_refer, false);
  await receiveSupply(f.owner, f.id, acknowledgement(t, "Returned"));
  t = await currentFollowup(f);
  assert.equal(t.can_refer, true);
  await referSupply(f.owner, f.id, referral(t, successor.actor_id));
  await receiveSupply(
    successor,
    f.id,
    acknowledgement(await currentFollowup(f)),
  );
  t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  await executeMaterial(
    successor,
    f.id,
    "MaterialPropose",
    materialProposal(t, f.task.id),
  );
  t = await currentFollowup(f);
  assert.equal(t.material_resolution.proposal!.predecessor_id, old.id);
  assert.ok(t.material_resolution.required.every((r) => !r.decision));
  assert.deepEqual(
    (await executeMaterial(f.owner, f.id, "MaterialPropose", prop)).receipt,
    await readOperation(f.owner, prop.operation_id),
  );
});

test("ES07 material: a task owner receives without Supply write authority; revoked or changed source authority holds execution and disclosure", async () => {
  const f = await materialFixture(),
    owner = await secondOwner(f.owner);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability IN ('supply.coordinate','project.edit')",
    [owner.actor_id],
  );
  await saveTask(f.owner, f.project.id, {
    ...f.task,
    ...crmBase(),
    expected_version: 2,
    owner_id: owner.actor_id,
  });
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(f), f.task.id),
  );
  let t = await currentFollowup(f);
  assert.ok(
    (await receivingWorklist(owner)).rows.some(
      (r) => r.target_id === t.target_id,
    ),
  );
  const cmd = materialReceiving(t, "Task");
  await assert.rejects(executeMaterial(f.owner, f.id, "MaterialReceive", cmd));
  const accepted = await executeMaterial(owner, f.id, "MaterialReceive", cmd);
  for (const role of ["Demand", "Project", "MaterialAction"] as const)
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), role),
    );
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  t = await currentFollowup(f);
  const apply = materialApply(t);
  const grants = (
    await database().query(
      "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='estimating.quote.read' RETURNING *",
      [owner.actor_id],
    )
  ).rows;
  try {
    assert.equal(
      (await currentFollowup(f)).material_resolution.can_apply,
      false,
    );
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialApply", apply),
    );
    await assert.rejects(readOperation(owner, cmd.operation_id));
    await assert.rejects(readConversion(owner, f.id));
  } finally {
    for (const g of grants)
      await database().query(
        "INSERT INTO ppo.permission_grants SELECT * FROM jsonb_populate_record(NULL::ppo.permission_grants,$1)",
        [g],
      );
  }
  assert.deepEqual(
    await readOperation(owner, cmd.operation_id),
    accepted.receipt,
  );
  // A newly issued effective grant is current authority, but is changed evidence.
  await database().query(
    "UPDATE ppo.permission_grants SET id=gen_random_uuid() WHERE user_id=$1 AND capability='estimating.quote.read'",
    [owner.actor_id],
  );
  assert.equal((await currentFollowup(f)).material_resolution.can_apply, false);
  await assert.rejects(executeMaterial(f.owner, f.id, "MaterialApply", apply));
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(f), f.task.id),
  );
  t = await currentFollowup(f);
  assert.ok(t.material_resolution.required.every((r) => !r.decision));
  assert.deepEqual(
    await readOperation(owner, cmd.operation_id),
    accepted.receipt,
  );
});

test("ES07 material: another accepted allocation target cannot compete for the same Project task", async () => {
  const first = await materialFixture();
  await executeMaterial(
    first.owner,
    first.id,
    "MaterialPropose",
    materialProposal(first.t, first.task.id),
  );
  const second = await materialFixture(first);
  const rejected = materialProposal(second.t, second.task.id);
  await assert.rejects(
    executeMaterial(second.owner, second.id, "MaterialPropose", rejected),
    code("SupplyFollowupConflict"),
  );
  assert.equal(
    (await currentFollowup(second)).material_resolution.proposal,
    null,
  );
  await assert.rejects(readOperation(second.owner, rejected.operation_id));
  await receiveSupply(
    first.owner,
    first.id,
    acknowledgement(await currentFollowup(first), "Returned"),
  );
  await executeMaterial(
    second.owner,
    second.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(second), second.task.id),
  );
  assert.equal(
    (await currentFollowup(first)).material_resolution.events.length,
    1,
  );
  assert.equal(
    (await currentFollowup(second)).material_resolution.proposal!.task_id,
    first.task.id,
  );
});

test("ES07 material: populated 0066 upgrade preserves every prior table, grant, receipt and issued byte", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(66);
  await seed(66);
  const f = await materialFixture();
  // Populate #345 on the converted target; the independently affected Project
  // Demand and exact #347 reduction outcome remain unchanged.
  await recordFact(
    f.owner,
    f.t.target_id,
    supplyFact("ExternalOutcome", f.t.basis.conversion.target.version, {
      source_operation: "SYN-upgrade-reservation-" + randomUUID(),
      effect: "Reservation",
      state: "Unknown",
      lookup_evidence: "SYN original response unavailable",
    }),
  );
  await reviewSupply(
    f.owner,
    f.id,
    reservationReview(await currentFollowup(f), "Absent"),
  );
  await applySupply(f.owner, f.id, supplyApply(await currentFollowup(f)));
  let conversion = await readConversion(f.owner, f.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(conversion.dispositions[0], "Retain"),
  );
  conversion = await readConversion(f.owner, f.id);
  await applyDisposition(
    f.owner,
    f.id,
    dispositionApply(conversion.dispositions[0]),
  );
  await retryQuote(f.owner, f.draft.id);
  const bytes = await draftBytes(f.owner, f.id),
    draft = await draftBytes(f.owner, f.draft.id);
  const tables = (
    await database().query(
      "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
    )
  ).rows.map((x) => x.tablename as string);
  const before = await Promise.all(tables.map(rows));
  const ledger = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  await migrate();
  await seed();
  assert.deepEqual(await Promise.all(tables.map(rows)), before);
  const updated = (
    await database().query(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    updated.filter((r) => r.version <= 66),
    ledger,
  );
  assert.deepEqual(
    updated.filter((r) => r.version > 66).map((r) => r.version),
    [67, 68],
  );
  assert.deepEqual(await draftBytes(f.owner, f.id), bytes);
  assert.deepEqual(await draftBytes(f.owner, f.draft.id), draft);
  for (const e of f.t.events) {
    assert.ok(await readOperation(f.owner, e.operation_id));
    if (e.native_receipt)
      assert.deepEqual(
        await readOperation(f.owner, e.native_receipt.operation_id),
        e.native_receipt,
      );
  }
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(f), f.task.id),
  );
  assert.equal(
    (await currentFollowup(f)).material_resolution.proposal!.dependencies
      .allocation_outcome.id,
    f.t.outcome!.id,
  );
});
