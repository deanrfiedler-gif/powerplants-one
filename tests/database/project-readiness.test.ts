import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { withWorkingCompany } from "../../src/platform/working-company";
import { createProject } from "../../src/projects/service";
import {
  createEngineeringRequest,
  coordinateEngineering,
} from "../../src/engineering/service";
import { saveRecord, allocate, recordFact } from "../../src/supply/commands";
import {
  createActivity,
  activityCommand,
} from "../../src/activities/activities";
import { commandPackage } from "../../src/projects/specialist/commands";
import { readProjectReadiness } from "../../src/projects/readiness/reads";
import { readinessFixture } from "../helpers/project-readiness";
import {
  specialistFixture,
  packageAction,
} from "../helpers/project-specialist";
import { projectInput } from "../helpers/projects";
import { engineeringInput, engineeringUpdate } from "../helpers/engineering";
import { supplyInput, supplyBase, supplyFact } from "../helpers/supply";
import { todayInZone } from "../../src/projects/model";
import { raidAction } from "../helpers/project-raid";
import { crmBase } from "../helpers/crm";
import { canonical } from "../../src/platform/operations";
import { digest } from "../../src/documents/store";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const code = (name: string) => (e: unknown) =>
  (e as { code: string }).code === name;
const family = (
  read: Awaited<ReturnType<typeof readProjectReadiness>>,
  kind: string,
) => read.sources.find((s) => s.kind === kind)!;
async function snapshot() {
  const result = [];
  for (const table of [
    "projects",
    "engineering_packages",
    "engineering_events",
    "supply_records",
    "supply_facts",
    "supply_allocations",
    "project_specialist_packages",
    "project_specialist_events",
    "activities",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ])
    result.push(
      (
        await database().query(
          `SELECT to_jsonb(t) AS row FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
        )
      ).rows,
    );
  return result;
}

test("PJ07-01 native source versions, owners and blockers are read without business effects; empty is not ready", async () => {
  const f = await readinessFixture();
  const before = await snapshot();
  const read = await readProjectReadiness(f.p, f.project.id);
  assert.equal(read.summary.state, "Blocked");
  assert.equal(read.summary.blocked, 1);
  assert.equal(read.summary.can_release, false);
  assert.equal(read.summary.full_scope_assessed, false);
  assert.equal(family(read, "EngineeringPackage").items[0].version, 1);
  const demand = family(read, "MaterialDemand").items[0];
  assert.equal(demand.id, f.demand.id);
  assert.equal(demand.owner_id, f.p.actor_id);
  assert.equal(demand.state, "Blocked");
  assert.match(demand.source_hash, /^[a-f0-9]{64}$/);
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual(
    (await readProjectReadiness(f.p, f.project.id)).sources,
    read.sources,
  );
  const empty = projectInput();
  await createProject(f.p, empty);
  const nothing = await readProjectReadiness(f.p, empty.id);
  assert.equal(nothing.summary.state, "NotAssessed");
  assert.equal(nothing.summary.blocked, 0);
  assert.equal(family(nothing, "MaterialDemand").evidence, "Missing");
});

test("PJ07-02 native source revisions and allocations change readiness; completing a follow-up cannot clear a source blocker", async () => {
  const f = await readinessFixture();
  await coordinateEngineering(f.p, f.engineering.id, {
    ...engineeringUpdate(),
    state: "Awaiting information",
    blocker: "SYN missing controlled drawing",
  });
  const first = await readProjectReadiness(f.p, f.project.id);
  assert.equal(first.summary.blocked, 2);
  assert.equal(family(first, "EngineeringPackage").items[0].version, 2);
  const action = raidAction(f.project.id);
  await createActivity(f.p, action);
  await activityCommand(
    f.p,
    action.id,
    {
      ...crmBase(),
      expected_version: 1,
      outcome: "SYN follow-up completed; evidence still absent",
    },
    "complete",
  );
  assert.deepEqual(
    (await readProjectReadiness(f.p, f.project.id)).sources,
    first.sources,
  );
  const supply = supplyInput("Supply");
  await saveRecord(f.p, supply);
  await allocate(f.p, {
    ...supplyBase(),
    id: randomUUID(),
    demand_id: f.demand.id,
    supply_id: supply.id,
    demand_version: 1,
    supply_version: 1,
    expected_version: null,
    quantity: "10",
    unit: "EA",
    basis: "Usable",
  });
  const second = await readProjectReadiness(f.p, f.project.id);
  assert.equal(second.summary.blocked, 1);
  assert.equal(
    family(second, "MaterialDemand").items[0].state,
    "SatisfiedForSourceScope",
  );
  assert.notEqual(
    family(second, "MaterialDemand").items[0].source_hash,
    family(first, "MaterialDemand").items[0].source_hash,
  );
  await coordinateEngineering(f.p, f.engineering.id, engineeringUpdate(2));
  const third = await readProjectReadiness(f.p, f.project.id);
  assert.equal(third.summary.state, "NotAssessed");
  assert.equal(third.summary.can_release, false);
  const material = family(third, "MaterialDemand").items[0];
  assert.equal(
    material.source_hash,
    digest(canonical(JSON.parse(JSON.stringify(material.basis)))),
  );
  await saveRecord(
    f.p,
    {
      ...supply,
      ...supplyBase(),
      expected_version: 2,
      completeness: "Partial",
    },
    true,
  );
  const changedMaterial = family(
    await readProjectReadiness(f.p, f.project.id),
    "MaterialDemand",
  );
  assert.equal(changedMaterial.coverage, "Partial");
  assert.equal(changedMaterial.items[0].state, "EvidenceNeeded");
  assert.equal(changedMaterial.items[0].source_status, "Changed");
  assert.notEqual(changedMaterial.items[0].source_hash, material.source_hash);
});

test("PJ07-03 project, company and revoked source permissions do not disclose source identities or counts", async () => {
  const f = await readinessFixture();
  const other = (await createSession("second-company")).principal;
  await assert.rejects(
    readProjectReadiness(other, f.project.id),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    withWorkingCompany(f.p.actor_id, randomUUID(), () =>
      readProjectReadiness(f.p, f.project.id),
    ),
    code("RecordUnavailable"),
  );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='supply.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  const read = await readProjectReadiness(f.p, f.project.id);
  const hidden = family(read, "MaterialDemand");
  assert.equal(hidden.coverage, "Unavailable");
  assert.equal(hidden.count, null);
  assert.deepEqual(hidden.items, []);
  assert.ok(!JSON.stringify(read).includes(f.demand.id));
  assert.ok(!JSON.stringify(read).includes(f.demand.reference));
  assert.equal(read.summary.can_release, false);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
    [f.p.workspace_id, f.p.actor_id],
  );
  await assert.rejects(
    readProjectReadiness(f.p, f.project.id),
    code("RecordUnavailable"),
  );
});

test("PJ07-04 incomplete demand evidence is explicit and strict reads cannot filter away blockers", async () => {
  const f = await readinessFixture();
  await saveRecord(
    f.p,
    {
      ...f.demand,
      ...supplyBase(),
      expected_version: 1,
      completeness: "Partial",
    },
    true,
  );
  const read = await readProjectReadiness(f.p, f.project.id);
  const material = family(read, "MaterialDemand");
  assert.equal(material.coverage, "Partial");
  assert.equal(material.items[0].state, "EvidenceNeeded");
  assert.equal(read.summary.state, "NotAssessed");
  for (const query of [
    { state: "Ready" },
    { limit: "0" },
    { company_id: randomUUID() },
    { source: "Engineering" },
  ])
    await assert.rejects(
      readProjectReadiness(f.p, f.project.id, query),
      code("InvalidData"),
    );
  await assert.rejects(
    readProjectReadiness(f.p, "invalid"),
    code("InvalidData"),
  );
});

test("PJ07-05 bounded candidate coverage cannot imply full project readiness or disclose another project's sources", async () => {
  const f = await readinessFixture();
  for (let i = 0; i < 50; i++)
    await createEngineeringRequest(f.p, engineeringInput(f.project.id));
  const otherProject = projectInput();
  await createProject(f.p, otherProject);
  const other = engineeringInput(otherProject.id);
  await createEngineeringRequest(f.p, other);
  const read = await readProjectReadiness(f.p, f.project.id);
  const source = family(read, "EngineeringPackage");
  assert.equal(source.coverage, "Partial");
  assert.equal(source.count, 50);
  assert.equal(source.items.length, 50);
  assert.equal(source.count_scope, "PermittedCandidateWindow");
  assert.ok(!JSON.stringify(read).includes(other.id));
  assert.equal(read.summary.full_scope_assessed, false);
});

test("PJ07-06 accepted specialist evidence becomes stale after native Engineering change and is hidden after source revocation", async () => {
  const f = await specialistFixture();
  await commandPackage(f.owner, f.project.id, f.package);
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(f.package.id, 1, "Submit"),
  );
  await commandPackage(
    f.reviewer,
    f.project.id,
    packageAction(f.package.id, 2, "Accept"),
  );
  const first = await readProjectReadiness(f.owner, f.project.id);
  const accepted = family(first, "SpecialistPackage").items[0];
  assert.equal(accepted.source_state, "Accepted");
  assert.equal(accepted.version, 3);
  assert.equal(accepted.source_status, "Current");
  assert.equal(accepted.state, "EvidenceNeeded");
  await coordinateEngineering(f.owner, f.engineering.id, engineeringUpdate());
  const changed = family(
    await readProjectReadiness(f.owner, f.project.id),
    "SpecialistPackage",
  ).items[0];
  assert.equal(changed.source_status, "Changed");
  assert.equal(changed.state, "Blocked");
  assert.equal(changed.version, 3);
  assert.equal(changed.source_hash, accepted.source_hash);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='engineering.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  const hidden = await readProjectReadiness(f.owner, f.project.id);
  assert.equal(family(hidden, "SpecialistPackage").coverage, "Partial");
  assert.deepEqual(family(hidden, "SpecialistPackage").items, []);
  assert.ok(!JSON.stringify(hidden).includes(f.package.id));
  assert.ok(!JSON.stringify(hidden).includes(accepted.source_hash));
});

test("PJ07-07 promises use the demand's current civil date and never turn a shortage into project Ready", async () => {
  const f = await readinessFixture();
  const now = (await database().query<{ now: Date }>("SELECT now() AS now"))
    .rows[0].now;
  const today = todayInZone("Australia/Sydney", now);
  const yesterday = todayInZone(
    "Australia/Sydney",
    new Date(now.getTime() - 86400000),
  );
  await saveRecord(
    f.p,
    {
      ...f.demand,
      ...supplyBase(),
      expected_version: 1,
      data: { ...f.demand.data, required_on: today },
    },
    true,
  );
  const promise = supplyFact("Promise", 2, {
    promised_on: today,
    basis: "SupplierConfirmed",
    quantity: "10",
  });
  await recordFact(f.p, f.demand.id, promise);
  const first = await readProjectReadiness(f.p, f.project.id);
  assert.equal(first.summary.state, "AtRisk");
  assert.equal(first.summary.at_risk, 1);
  assert.equal(first.summary.can_release, false);
  assert.equal(
    family(first, "MaterialDemand").items[0].source_state,
    "At risk",
  );
  await recordFact(f.p, f.demand.id, {
    ...supplyFact("Promise", 3, {
      promised_on: yesterday,
      basis: "SupplierConfirmed",
      quantity: "10",
    }),
    predecessor_id: promise.id,
  });
  const second = await readProjectReadiness(f.p, f.project.id);
  assert.equal(second.summary.state, "Blocked");
  assert.equal(second.summary.at_risk, 0);
  assert.notEqual(
    family(first, "MaterialDemand").items[0].source_hash,
    family(second, "MaterialDemand").items[0].source_hash,
  );
});

test("PJ07-08 withdrawn specialist packages are omitted with or without retained-source drift (review scenario A)", async () => {
  const f = await specialistFixture();
  await commandPackage(f.owner, f.project.id, f.package);
  const current = { id: randomUUID() };
  await commandPackage(f.owner, f.project.id, {
    ...f.package,
    ...packageAction(current.id, 0, "Create"),
  });
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(current.id, 1, "Withdraw"),
  );
  const beforeDrift = await readProjectReadiness(f.owner, f.project.id);
  assert.deepEqual(
    family(beforeDrift, "SpecialistPackage").items.map((item) => item.id),
    [f.package.id],
  );
  assert.ok(!JSON.stringify(beforeDrift).includes(current.id));

  await coordinateEngineering(f.owner, f.engineering.id, engineeringUpdate());
  const drifted = await readProjectReadiness(f.owner, f.project.id);
  assert.equal(drifted.summary.blocked, 2);
  assert.equal(family(drifted, "SpecialistPackage").items[0].state, "Blocked");
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(f.package.id, 1, "Withdraw"),
  );
  const before = await snapshot();
  const withdrawn = await readProjectReadiness(f.owner, f.project.id);
  const source = family(withdrawn, "SpecialistPackage");
  assert.deepEqual(source.items, []);
  assert.equal(source.count, 0);
  assert.equal(source.coverage, "Complete");
  assert.equal(source.evidence, "Missing");
  assert.equal(withdrawn.summary.blocked, 1); // Only the unallocated demand.
  assert.ok(!JSON.stringify(withdrawn).includes(f.package.id));
  assert.deepEqual(await snapshot(), before);

  // Resolve the remaining native blocker: terminal history must not keep the
  // Project Blocked, while the explicit non-release boundary remains intact.
  const supply = supplyInput("Supply");
  await saveRecord(f.owner, supply);
  await allocate(f.owner, {
    ...supplyBase(),
    id: randomUUID(),
    demand_id: f.demand.id,
    supply_id: supply.id,
    demand_version: 1,
    supply_version: 1,
    expected_version: null,
    quantity: "10",
    unit: "EA",
    basis: "Usable",
  });
  const cleared = await readProjectReadiness(f.owner, f.project.id);
  assert.equal(cleared.summary.blocked, 0);
  assert.equal(cleared.summary.state, "NotAssessed");
  assert.equal(cleared.summary.can_release, false);
  assert.equal(cleared.summary.full_scope_assessed, false);
});

test("PJ07-09 a successor carries the specialist assessment and clears the predecessor blocker (review scenario B)", async () => {
  const f = await specialistFixture();
  await commandPackage(f.owner, f.project.id, f.package);
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(f.package.id, 1, "Submit"),
  );
  await commandPackage(
    f.reviewer,
    f.project.id,
    packageAction(f.package.id, 2, "Accept"),
  );
  await coordinateEngineering(f.owner, f.engineering.id, engineeringUpdate());
  assert.equal(
    (await readProjectReadiness(f.owner, f.project.id)).summary.blocked,
    2,
  );
  const successor = { id: randomUUID() };
  await commandPackage(f.owner, f.project.id, {
    ...f.package,
    ...packageAction(successor.id, 0, "Create"),
    predecessor_id: f.package.id,
    content: {
      ...f.package.content,
      engineering: { id: f.engineering.id, version: 2 },
    },
  });
  const draft = await readProjectReadiness(f.owner, f.project.id);
  assert.deepEqual(
    family(draft, "SpecialistPackage").items.map((item) => item.id),
    [successor.id],
  );
  assert.equal(draft.summary.blocked, 1);
  await commandPackage(
    f.owner,
    f.project.id,
    packageAction(successor.id, 1, "Submit"),
  );
  await commandPackage(
    f.reviewer,
    f.project.id,
    packageAction(successor.id, 2, "Accept"),
  );
  const read = await readProjectReadiness(f.owner, f.project.id);
  const source = family(read, "SpecialistPackage");
  assert.equal(source.count, 1);
  assert.equal(source.coverage, "Complete");
  assert.equal(source.items[0].id, successor.id);
  assert.equal(source.items[0].source_state, "Accepted");
  assert.equal(source.items[0].source_status, "Current");
  assert.equal(source.items[0].state, "EvidenceNeeded");
  assert.equal(read.summary.blocked, 1); // Only the unallocated demand.
  assert.ok(!JSON.stringify(read).includes(f.package.id));

  await database().query(
    "DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='engineering.read'",
    [f.owner.workspace_id, f.owner.actor_id],
  );
  const hidden = await readProjectReadiness(f.owner, f.project.id);
  assert.equal(family(hidden, "SpecialistPackage").coverage, "Partial");
  assert.deepEqual(family(hidden, "SpecialistPackage").items, []);
  assert.equal(family(hidden, "SpecialistPackage").count, 0);
  assert.ok(!JSON.stringify(hidden).includes(successor.id));
  assert.ok(!JSON.stringify(hidden).includes(f.package.id));
  assert.equal(hidden.summary.can_release, false);
});
