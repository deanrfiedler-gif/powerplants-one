import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import { reset } from "../../scripts/database";
import { activityCommand } from "../../src/activities/activities";
import { createEngineeringRequest } from "../../src/engineering/service";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  applyDisposition,
  reviewDisposition,
} from "../../src/estimating/disposition/service";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
import {
  receiveSupply,
  referSupply,
} from "../../src/estimating/supply-followup/service";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import {
  createProject,
  readSchedule,
  saveTask,
} from "../../src/projects/service";
import { readOperation } from "../../src/shared/receipts";
import { recordFact } from "../../src/supply/commands";
import { crmBase } from "../helpers/crm";
import { engineeringInput } from "../helpers/engineering";
import { taskInput } from "../helpers/projects";
import {
  dispositionApply,
  dispositionReview,
} from "../helpers/quotation-disposition";
import {
  materialApply,
  materialFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  receiveMaterial,
} from "../helpers/quotation-material-resolution";
import {
  acknowledgement,
  currentFollowup,
  referral,
} from "../helpers/quotation-supply-followup";
import {
  conflict,
  fixture,
  freezeDiamond,
  roles,
  rows,
} from "../helpers/quotation-task-diamond";
import { supplyFact } from "../helpers/supply";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
test("quotation retention remains resolved through diamond review; native result requires fresh explicit ES07 disposition", async () => {
  const f = await fixture("SS");
  let q = await readConversion(f.owner, f.id);
  await reviewDisposition(
    f.owner,
    f.id,
    dispositionReview(q.dispositions[0], "Retain"),
  );
  q = await readConversion(f.owner, f.id);
  await applyDisposition(f.owner, f.id, dispositionApply(q.dispositions[0]));
  // The earlier proposal predates disposition. Receive a fresh exact proposal.
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    diamond_b_task_id: f.b.id,
    diamond_c_task_id: f.c.id,
    diamond_d_task_id: f.d.id,
  });
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
    (await readConversion(f.owner, f.id)).dispositions[0].status,
    "Resolved",
  );
  assert.equal(
    (await currentFollowup(f)).material_resolution.dependencies!.unmet,
    "3.624999",
  );
});
test("third task cannot be claimed by another accepted target; returned referral permits explicit reassignment without losing originals", async () => {
  const first = await fixture();
  const second = await materialFixture({
    project: first.project,
    task: first.c,
  });
  await assert.rejects(
    executeMaterial(
      second.owner,
      second.id,
      "MaterialPropose",
      materialProposal(await currentFollowup(second), first.c.id),
    ),
    conflict,
  );
  await receiveSupply(
    first.owner,
    first.id,
    acknowledgement(await currentFollowup(first), "Returned"),
  );
  await executeMaterial(
    second.owner,
    second.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(second), first.c.id),
  );
  assert.equal(
    (await currentFollowup(first)).material_resolution.events.length,
    1,
  );
  await referSupply(
    first.owner,
    first.id,
    referral(await currentFollowup(first)),
  );
  assert.ok((await currentFollowup(first)).material_resolution.holds.length);
});
test("new consequential Project Engineering after review holds the complete diamond without partial task effects", async () => {
  const f = await fixture();
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  const before = await readSchedule(f.owner, f.project.id);
  await createEngineeringRequest(f.owner, {
    ...engineeringInput(f.project.id),
    owner_id: f.owner.actor_id,
  });
  const t = await currentFollowup(f);
  assert.ok(
    t.material_resolution.native_holds.some((h) => h.includes("Engineering")),
  );
  assert.equal(t.material_resolution.can_apply, false);
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", materialApply(t)),
    conflict,
  );
  const after = await readSchedule(f.owner, f.project.id);
  assert.deepEqual(after.project, before.project);
  assert.deepEqual(after.tasks, before.tasks);
});
test("ES07 diamond: Activity completion and review notes cannot clear operational Impact or restore readiness", async () => {
  const f = await fixture(),
    candidate = (await currentFollowup(f)).material_resolution.candidates[0];
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    diamond_b_task_id: f.b.id,
    diamond_c_task_id: f.c.id,
    diamond_d_task_id: f.d.id,
  });
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
    (await currentFollowup(f)).material_resolution.dependencies!.facts.find(
      (x) => x.id === candidate.impact.id,
    )!.data.state,
    "Requested",
  );
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(t, f.task.id),
    diamond_b_task_id: f.b.id,
    diamond_c_task_id: f.c.id,
    diamond_d_task_id: f.d.id,
  });
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

for (const role of roles)
  test(`${role} requires a distinct current decision; Held, Returned and corrected acceptance invalidate frozen review`, async () => {
    const f = await fixture();
    for (const other of roles.filter((r) => r !== role))
      await executeMaterial(
        f.owner,
        f.id,
        "MaterialReceive",
        materialReceiving(await currentFollowup(f), other),
      );
    await assert.rejects(
      executeMaterial(
        f.owner,
        f.id,
        "MaterialReview",
        materialReview(await currentFollowup(f)),
      ),
      conflict,
    );
    for (const decision of ["Held", "Returned"]) {
      await executeMaterial(
        f.owner,
        f.id,
        "MaterialReceive",
        materialReceiving(await currentFollowup(f), role, decision),
      );
      await assert.rejects(
        executeMaterial(
          f.owner,
          f.id,
          "MaterialReview",
          materialReview(await currentFollowup(f)),
        ),
        conflict,
      );
    }
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
    const cmd = materialApply(await currentFollowup(f));
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), role, "Returned"),
    );
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), role),
    );
    const before = await rows("project_tasks");
    await assert.rejects(executeMaterial(f.owner, f.id, "MaterialApply", cmd), {
      code: "VersionConflict",
      status: 409,
    });
    // A refreshed envelope cannot revive the review's superseded receiving IDs.
    const current = await currentFollowup(f);
    const refreshed = materialApply(current);
    assert.equal(refreshed.review_id, cmd.review_id);
    assert.equal(refreshed.review_hash, cmd.review_hash);
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialApply", refreshed),
      conflict,
    );
    assert.deepEqual(await rows("project_tasks"), before);
    await assert.rejects(readOperation(f.owner, cmd.operation_id));
    await assert.rejects(readOperation(f.owner, refreshed.operation_id));
    assert.equal(
      (await currentFollowup(f)).material_resolution.can_apply,
      false,
    );
  });
for (const key of ["b", "c", "d"] as const)
  test(`independent diamond ${key.toUpperCase()} owner sees its worklist and receives without edit authority; revocation holds disclosure`, async () => {
    const f = await fixture(),
      owner = {
        ...f.owner,
        actor_id: randomUUID(),
        display_name: "SYN independent diamond owner",
      };
    await database().query(
      "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN independent diamond owner',true,true)",
      [owner.actor_id, owner.workspace_id],
    );
    await database().query(
      "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability NOT IN ('project.edit','supply.coordinate','activity.edit')",
      [owner.actor_id, f.owner.actor_id],
    );
    await saveTask(f.owner, f.project.id, {
      ...f[key],
      operation_id: randomUUID(),
      expected_version: 5,
      owner_id: owner.actor_id,
    });
    await executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...materialProposal(await currentFollowup(f), f.task.id),
      diamond_b_task_id: f.b.id,
      diamond_c_task_id: f.c.id,
      diamond_d_task_id: f.d.id,
    });
    const role =
      key === "b" ? "DiamondB" : key === "c" ? "DiamondC" : "DiamondD";
    for (const other of roles.filter((r) => r !== role))
      await executeMaterial(
        f.owner,
        f.id,
        "MaterialReceive",
        materialReceiving(await currentFollowup(f), other),
      );
    const cmd = materialReceiving(await currentFollowup(f), role);
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialReceive", cmd),
    );
    assert.ok(
      (await receivingWorklist(owner)).rows.some(
        (r) => r.target_id === cmd.target_id,
      ),
    );
    await executeMaterial(owner, f.id, "MaterialReceive", cmd);
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    );
    await database().query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.read'",
      [owner.actor_id],
    );
    await assert.rejects(readOperation(owner, cmd.operation_id));
    assert.equal(
      (await currentFollowup(f)).material_resolution.can_apply,
      false,
    );
  });
for (const path of ["b", "c"] as const)
  test(`change on path ${path.toUpperCase()} invalidates the whole diamond; unrelated Project remains irrelevant`, async () => {
    const f = await fixture(),
      cmd = await freezeDiamond(f);
    await createProject(f.owner, {
      ...f.project,
      id: randomUUID(),
      operation_id: randomUUID(),
    });
    assert.equal(
      (await currentFollowup(f)).material_resolution.can_apply,
      true,
    );
    await saveTask(f.owner, f.project.id, {
      ...f[path],
      expected_version: 5,
      operation_id: randomUUID(),
      note: "SYN path changed",
    });
    const before = await rows("project_tasks");
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialApply", cmd),
      conflict,
    );
    assert.deepEqual(await rows("project_tasks"), before);
  });

for (const topology of [
  "isolated-task",
  "two-task",
  "linear-chain",
  "branch",
  "merge",
] as const)
  test(`earlier ${topology} acceptance and reserved operations do not authorise the explicit diamond`, async () => {
    const f = await materialFixture();
    const b = {
      ...taskInput(),
      title: "SYN B",
      start_date: "2027-12-01",
      finish_date: "2027-12-10",
      status: "Planned",
      progress: 0,
      owner_id: f.owner.actor_id,
      dependencies:
        topology === "merge"
          ? []
          : [{ task_id: f.task.id, kind: "FS" as const }],
    };
    const c = {
      ...taskInput(),
      title: "SYN C",
      start_date: "2027-12-13",
      finish_date: "2027-12-17",
      status: "Planned",
      progress: 0,
      owner_id: f.owner.actor_id,
      dependencies:
        topology === "merge"
          ? [
              { task_id: f.task.id, kind: "FS" as const },
              { task_id: b.id, kind: "SS" as const },
            ]
          : [
              {
                task_id: topology === "linear-chain" ? b.id : f.task.id,
                kind: "FS" as const,
              },
            ],
    };
    const save = async (task: typeof b | typeof c) =>
      saveTask(f.owner, f.project.id, {
        ...task,
        operation_id: randomUUID(),
        expected_version: (await readSchedule(f.owner, f.project.id)).project
          .version,
      });
    if (topology !== "isolated-task") await save(b);
    if (["linear-chain", "branch", "merge"].includes(topology)) await save(c);
    const earlier = {
      ...materialProposal(await currentFollowup(f), f.task.id),
      ...(topology !== "isolated-task" && topology !== "merge"
        ? { successor_task_id: b.id }
        : {}),
      ...(topology === "linear-chain" ? { chain_end_task_id: c.id } : {}),
      ...(topology === "branch" ? { branch_successor_task_id: c.id } : {}),
      ...(topology === "merge"
        ? { merge_predecessor_task_id: b.id, merge_successor_task_id: c.id }
        : {}),
    };
    const original = await executeMaterial(
      f.owner,
      f.id,
      "MaterialPropose",
      earlier,
    );
    await receiveMaterial(f);
    const accepted = (await currentFollowup(f)).material_resolution;
    assert.equal(accepted.native_holds.length, 0);
    assert.ok(
      accepted.required.every((r) => r.decision?.decision === "Accepted"),
    );
    const oldIds = accepted.required.map((r) => r.decision!.id),
      oldProposal = accepted.proposal!;
    if (topology === "isolated-task" || topology === "merge")
      await save({ ...b, dependencies: [{ task_id: f.task.id, kind: "FS" }] });
    if (topology !== "branch")
      await save({ ...c, dependencies: [{ task_id: f.task.id, kind: "SS" }] });
    const d = {
      ...c,
      id: randomUUID(),
      title: "SYN D",
      start_date: "2027-12-20",
      finish_date: "2027-12-24",
      dependencies: [
        { task_id: b.id, kind: "FS" as const },
        { task_id: c.id, kind: "SS" as const },
      ],
    };
    await save(d);
    await executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...materialProposal(await currentFollowup(f), f.task.id),
      diamond_b_task_id: b.id,
      diamond_c_task_id: c.id,
      diamond_d_task_id: d.id,
    });
    const now = (await currentFollowup(f)).material_resolution;
    assert.equal(now.proposal!.predecessor_id, oldProposal.id);
    assert.equal(now.native_holds.length, 0);
    assert.equal(now.required.length, 7);
    assert.ok(now.required.every((r) => !r.decision));
    for (const id of oldIds) assert.ok(now.events.some((e) => e.id === id));
    await assert.rejects(
      executeMaterial(
        f.owner,
        f.id,
        "MaterialReview",
        materialReview(await currentFollowup(f)),
      ),
      conflict,
    );
    assert.deepEqual(
      (await executeMaterial(f.owner, f.id, "MaterialPropose", earlier))
        .receipt,
      original.receipt,
    );
    const { project_id, ...reserved } = oldProposal.project_command;
    await assert.rejects(
      saveTask(f.owner, project_id, {
        ...reserved,
        id: d.id,
        expected_version: (await readSchedule(f.owner, f.project.id)).project
          .version,
      }),
      conflict,
    );
  });
