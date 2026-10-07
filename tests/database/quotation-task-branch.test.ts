import { createEngineeringRequest } from "../../src/engineering/service";
import { engineeringInput } from "../helpers/engineering";
import { activityCommand } from "../../src/activities/activities";
import { crmBase } from "../helpers/crm";
import { recordFact } from "../../src/supply/commands";
import { supplyFact } from "../helpers/supply";
import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { reset, migrate, seed } from "../../scripts/database";
import { readFile } from "node:fs/promises";
import { draftBytes } from "../../src/estimating/worker";
import { readConversion } from "../../src/estimating/conversion/reads";
import {
  reviewDisposition,
  applyDisposition,
} from "../../src/estimating/disposition/service";
import {
  dispositionReview,
  dispositionApply,
} from "../helpers/quotation-disposition";
import {
  receiveSupply,
  referSupply,
} from "../../src/estimating/supply-followup/service";
import {
  acknowledgement,
  referral,
} from "../helpers/quotation-supply-followup";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import {
  saveTask,
  readSchedule,
  createProject,
} from "../../src/projects/service";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { readOperation } from "../../src/shared/receipts";
import { receivingWorklist } from "../../src/estimating/supply-followup/reads";
import {
  materialFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  materialApply,
  receiveMaterial,
} from "../helpers/quotation-material-resolution";
import { currentFollowup } from "../helpers/quotation-supply-followup";
import { taskInput } from "../helpers/projects";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const conflict = (e: unknown) =>
  (e as { code: string }).code === "SupplyFollowupConflict";
async function fixture(
  kind: "FS" | "SS" = "FS",
  unrelated = false,
  kind2: "FS" | "SS" = "SS",
) {
  const f = await materialFixture();
  const b = {
    ...taskInput(2),
    title: "SYN dependent installation",
    start_date: "2027-12-01",
    finish_date: "2027-12-10",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    dependencies: [{ task_id: f.task.id, kind }],
  };
  await saveTask(f.owner, f.project.id, b);
  const c = {
    ...taskInput(3),
    title: "SYN third task",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    start_date: "2027-12-13",
    finish_date: "2027-12-17",
    dependencies: [{ task_id: f.task.id, kind: kind2 }],
  };
  await saveTask(f.owner, f.project.id, c);
  if (unrelated)
    await saveTask(f.owner, f.project.id, {
      ...taskInput(4),
      title: "SYN unrelated task",
      owner_id: f.owner.actor_id,
    });
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    successor_task_id: b.id,
    branch_successor_task_id: c.id,
  });
  return { ...f, b, c };
}
for (const [kind, kind2] of [
  ["FS", "FS"],
  ["FS", "SS"],
  ["SS", "FS"],
  ["SS", "SS"],
] as const)
  test(`${kind}/${kind2} branch requires six exact decisions and atomically preserves both dependencies with three native task saves and one Impact successor`, async () => {
    const f = await fixture(kind, true, kind2);
    let t = await currentFollowup(f);
    const original = t.material_resolution.proposal!;
    assert.equal(t.material_resolution.required.length, 6);
    assert.equal(t.material_resolution.native_holds.length, 0);
    assert.equal(original.successor_command!.id, f.b.id);
    assert.equal(original.dependencies.project.topology, "Branch");
    assert.equal(original.branch_successor_command!.id, f.c.id);
    assert.equal(original.chain_end_command, null);
    assert.deepEqual(
      t.material_resolution.required.map((r) => r.role),
      [
        "Demand",
        "Project",
        "Task",
        "MaterialAction",
        "Successor",
        "BranchSuccessor",
      ],
    );
    await assert.rejects(
      executeMaterial(
        f.owner,
        f.id,
        "MaterialReceive",
        materialReceiving(t, "ChainEnd"),
      ),
      (e: unknown) => (e as { status: number }).status === 404,
    );
    const before = await readSchedule(f.owner, f.project.id);
    for (const role of [
      "Demand",
      "Project",
      "Task",
      "MaterialAction",
      "Successor",
    ] as const)
      await executeMaterial(
        f.owner,
        f.id,
        "MaterialReceive",
        materialReceiving(await currentFollowup(f), role),
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
    const receiving = materialReceiving(
      await currentFollowup(f),
      "BranchSuccessor",
    );
    const pair = await Promise.all([
      executeMaterial(f.owner, f.id, "MaterialReceive", receiving),
      executeMaterial(f.owner, f.id, "MaterialReceive", receiving),
    ]);
    assert.deepEqual(pair[0].receipt, pair[1].receipt);
    assert.deepEqual(pair.map((r) => r.replayed).sort(), [false, true]);
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    );
    const cmd = materialApply(await currentFollowup(f));
    const identityIds = (
      await database().query<{ id: string }>(
        "SELECT id FROM ppo.business_identities WHERE workspace_id=$1",
        [f.owner.workspace_id],
      )
    ).rows.map((r) => r.id);
    const unchangedTables = [
      "supply_allocations",
      "supply_allocation_history",
      "activities",
      "activity_links",
      "reference_counters",
      "draft_quote_revisions",
      "quote_conversion_events",
      "quote_supply_events",
      "quote_supply_receipt_events",
      "quote_supply_shortfall_events",
    ];
    const unchanged = await Promise.all(unchangedTables.map(rows));
    const outputBytes = await draftBytes(f.owner, f.id);
    const appendedTables = [
      "project_schedule_events",
      "supply_revisions",
      "supply_facts",
      "quote_material_events",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
    const appendBefore = await Promise.all(appendedTables.map(rows));
    const results = await Promise.all([
      executeMaterial(f.owner, f.id, "MaterialApply", cmd),
      executeMaterial(f.owner, f.id, "MaterialApply", cmd),
    ]);
    assert.deepEqual(results[0].receipt, results[1].receipt);
    assert.deepEqual(results.map((r) => r.replayed).sort(), [false, true]);
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialApply", {
        ...cmd,
        evidence: "SYN changed original",
      }),
      (e: unknown) => (e as { code: string }).code === "OperationConflict",
    );
    t = await currentFollowup(f);
    const e = t.material_resolution.applied!,
      after = await readSchedule(f.owner, f.project.id);
    assert.equal(after.project.version, before.project.version + 3);
    assert.deepEqual(
      {
        ...after.project,
        version: before.project.version,
        updated_at: before.project.updated_at,
      },
      before.project,
    );
    assert.deepEqual(await Promise.all(unchangedTables.map(rows)), unchanged);
    assert.deepEqual(await draftBytes(f.owner, f.id), outputBytes);
    const appendAfter = await Promise.all(appendedTables.map(rows));
    for (const [index, count] of [3, 1, 1, 1, 5, 5, 5].entries()) {
      assert.equal(
        appendAfter[index].length,
        appendBefore[index].length + count,
        appendedTables[index],
      );
      for (const old of appendBefore[index])
        assert.ok(
          appendAfter[index].some(
            (r) => JSON.stringify(r) === JSON.stringify(old),
          ),
          appendedTables[index],
        );
    }
    for (const [i, taskId] of [f.task.id, f.b.id, f.c.id].entries()) {
      assert.equal(
        (
          await database().query(
            "SELECT project_version FROM ppo.project_tasks WHERE id=$1",
            [taskId],
          )
        ).rows[0].project_version,
        before.project.version + i + 1,
      );
    }
    assert.deepEqual(e.after!.demand.data, original.dependencies.demand.data);
    assert.equal(
      e.after!.demand.owner_id,
      original.dependencies.demand.owner_id,
    );
    assert.equal(e.after!.project.topology, "Branch");
    assert.equal(e.native_receipts.length, 4);
    assert.equal(e.allocation_outcome_id, original.allocation_outcome_id);
    assert.deepEqual(
      e.dependencies.allocation_outcome,
      original.dependencies.allocation_outcome,
    );
    assert.equal(e.impact_command.predecessor_id, original.impact_id);
    for (const command of [
      e.project_command,
      e.successor_command!,
      e.branch_successor_command!,
    ])
      assert.ok(
        e.impact_command.data.review_reference!.includes(command.operation_id),
      );
    assert.equal(e.review_id, t.material_resolution.review!.id);
    assert.deepEqual(
      e.after!.project.dependencies,
      original.dependencies.project.dependencies,
    );
    assert.equal(e.effect_receiving_ids.length, 6);
    assert.equal(e.after!.unmet, "3.624999");
    for (const task of after.tasks) {
      const old = before.tasks.find((v) => v.id === task.id)!;
      if (task.id !== f.task.id && task.id !== f.b.id && task.id !== f.c.id) {
        assert.deepEqual(task, old);
        continue;
      }
      assert.equal(task.version, old.version + 1);
      assert.equal(task.start_date, null);
      assert.equal(task.finish_date, null);
      assert.equal(task.status, "Planned");
      assert.equal(task.progress, 0);
      assert.deepEqual(task.dependencies, old.dependencies);
      assert.deepEqual(
        {
          ...task,
          version: old.version,
          start_date: old.start_date,
          finish_date: old.finish_date,
        },
        old,
      );
    }
    assert.deepEqual(
      e.after!.material.allocations,
      original.dependencies.material.allocations,
    );
    assert.deepEqual(e.after!.activity, original.dependencies.activity);
    assert.equal(
      e.after!.demand.version,
      original.dependencies.demand.version + 1,
    );
    assert.equal(
      e.after!.demand.quantity,
      original.dependencies.demand.quantity,
    );
    assert.ok(
      e.after!.facts.some(
        (x) => x.id === e.impact_command.id && x.predecessor_id === e.impact_id,
      ),
    );
    assert.ok(
      e.after!.facts.some(
        (x) => x.kind === "Impact" && x.data.state === "Requested",
      ),
    );
    for (const receipt of e.native_receipts)
      assert.deepEqual(
        await readOperation(f.owner, receipt.operation_id),
        receipt,
      );
    const scheduleEvents = (
      await database().query<{ id: string }>(
        "SELECT id FROM ppo.project_schedule_events WHERE workspace_id=$1 AND operation_id=ANY($2::uuid[]) ORDER BY id",
        [
          f.owner.workspace_id,
          e.native_receipts.slice(0, 3).map((r) => r.operation_id),
        ],
      )
    ).rows;
    assert.equal(scheduleEvents.length, 3);
    assert.deepEqual(
      (
        await database().query(
          "SELECT id,object_type FROM ppo.business_identities WHERE workspace_id=$1 AND NOT(id=ANY($2::uuid[])) ORDER BY id",
          [f.owner.workspace_id, identityIds],
        )
      ).rows,
      scheduleEvents.map((r) => ({
        id: r.id,
        object_type: "ProjectScheduleEvent",
      })),
    );
    const operations = [
      e.operation_id,
      ...e.native_receipts.map((r) => r.operation_id),
    ];
    for (const table of ["operation_receipts", "audit_events", "outbox_jobs"])
      assert.equal(
        (
          await database().query(
            `SELECT count(*)::integer n FROM ppo.${table} WHERE workspace_id=$1 AND operation_id=ANY($2::uuid[])`,
            [f.owner.workspace_id, operations],
          )
        ).rows[0].n,
        5,
      );
    assert.deepEqual(
      (
        await database().query(
          "SELECT kind FROM ppo.outbox_jobs WHERE workspace_id=$1 AND operation_id=ANY($2::uuid[]) ORDER BY kind",
          [f.owner.workspace_id, operations],
        )
      ).rows.map((r) => r.kind),
      [
        "ProjectTaskSaved",
        "ProjectTaskSaved",
        "ProjectTaskSaved",
        "QuotationSupplyRecorded",
        "SupplyRecorded",
      ],
    );
  });
const rows = async (table: string) =>
  (
    await database().query(
      `SELECT to_jsonb(t) value FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
    )
  ).rows;
for (const failure of ["SecondTask", "ThirdTask", "Impact", "Outcome"] as const)
  test(`late ${failure} refusal rolls back all task effects; missing original is inconclusive and exact retry succeeds`, async () => {
    const f = await fixture();
    await receiveMaterial(f);
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    );
    const t = await currentFollowup(f),
      cmd = materialApply(t),
      prop = t.material_resolution.proposal!;
    const tables = [
      "business_identities",
      "reference_counters",
      "projects",
      "project_tasks",
      "project_dependencies",
      "project_schedule_events",
      "supply_records",
      "supply_revisions",
      "supply_facts",
      "supply_allocations",
      "activities",
      "activity_links",
      "quote_material_events",
      "operation_receipts",
      "audit_events",
      "outbox_jobs",
    ];
    const before = await Promise.all(tables.map(rows));
    const failTable = ["SecondTask", "ThirdTask"].includes(failure)
      ? "project_tasks"
      : failure === "Impact"
        ? "supply_facts"
        : "quote_material_events";
    const condition =
      failure === "SecondTask"
        ? `NEW.id='${f.b.id}'::uuid`
        : failure === "ThirdTask"
          ? `NEW.id='${f.c.id}'::uuid`
          : failure === "Impact"
            ? "NEW.kind='Impact'"
            : "NEW.action='MaterialApply'";
    await database().query(
      `CREATE FUNCTION ppo.branch_injected() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${condition} THEN RAISE EXCEPTION 'SYN late native refusal'; END IF; RETURN NEW; END $$; CREATE TRIGGER branch_injected BEFORE ${["SecondTask", "ThirdTask"].includes(failure) ? "UPDATE" : "INSERT"} ON ppo.${failTable} FOR EACH ROW EXECUTE FUNCTION ppo.branch_injected()`,
    );
    try {
      await assert.rejects(
        executeMaterial(f.owner, f.id, "MaterialApply", cmd),
      );
    } finally {
      await database().query(
        `DROP TRIGGER branch_injected ON ppo.${failTable}; DROP FUNCTION ppo.branch_injected()`,
      );
    }
    assert.deepEqual(await Promise.all(tables.map(rows)), before);
    for (const op of [
      cmd,
      prop.project_command,
      prop.successor_command!,
      prop.branch_successor_command!,
      prop.impact_command,
    ])
      await assert.rejects(readOperation(f.owner, op.operation_id));
    const { project_id, ...reserved } = prop.branch_successor_command!;
    await assert.rejects(saveTask(f.owner, project_id, reserved), conflict);
    const result = await executeMaterial(f.owner, f.id, "MaterialApply", cmd);
    assert.deepEqual(
      await readOperation(f.owner, cmd.operation_id),
      result.receipt,
    );
  });
test("third task owner receives independently; corrected Held and Returned decisions invalidate review and revoked authority hides originals", async () => {
  const f = await fixture(),
    owner = {
      ...f.owner,
      actor_id: randomUUID(),
      display_name: "SYN third task owner",
    };
  await database().query(
    "INSERT INTO ppo.users(id,workspace_id,issuer,subject_id,display_name,active,synthetic) VALUES($1::uuid,$2,'PPO-LocalSynthetic',$1::text,'SYN third task owner',true,true)",
    [owner.actor_id, owner.workspace_id],
  );
  await database().query(
    "INSERT INTO ppo.permission_grants(workspace_id,user_id,company_id,capability,valid_from,valid_to,id,scope_type,scope_id,site_id) SELECT workspace_id,$1,company_id,capability,valid_from,valid_to,gen_random_uuid(),scope_type,scope_id,site_id FROM ppo.permission_grants WHERE user_id=$2 AND capability NOT IN ('project.edit','supply.coordinate','activity.edit')",
    [owner.actor_id, f.owner.actor_id],
  );
  await saveTask(f.owner, f.project.id, {
    ...f.c,
    operation_id: randomUUID(),
    expected_version: 4,
    owner_id: owner.actor_id,
  });
  let t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(t, f.task.id),
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
  });
  for (const role of [
    "Demand",
    "Project",
    "Task",
    "MaterialAction",
    "Successor",
  ] as const)
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(await currentFollowup(f), role),
    );
  t = await currentFollowup(f);
  await assert.rejects(
    executeMaterial(
      f.owner,
      f.id,
      "MaterialReceive",
      materialReceiving(t, "BranchSuccessor"),
    ),
  );
  const decision = materialReceiving(t, "BranchSuccessor");
  assert.ok(
    (await receivingWorklist(owner)).rows.some(
      (r) => r.target_id === t.target_id,
    ),
  );
  await executeMaterial(owner, f.id, "MaterialReceive", decision);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  await executeMaterial(
    owner,
    f.id,
    "MaterialReceive",
    materialReceiving(await currentFollowup(f), "BranchSuccessor", "Held"),
  );
  t = await currentFollowup(f);
  assert.equal(t.material_resolution.can_apply, false);
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", materialApply(t)),
    conflict,
  );
  await executeMaterial(
    owner,
    f.id,
    "MaterialReceive",
    materialReceiving(t, "BranchSuccessor", "Returned"),
  );
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='project.read'",
    [owner.actor_id],
  );
  await assert.rejects(readOperation(owner, decision.operation_id));
  assert.ok((await currentFollowup(f)).material_resolution.holds.length);
});
test("quotation retention remains resolved through branch review; native result requires fresh explicit ES07 disposition", async () => {
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
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
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
// Only legacy upgrade rows may omit the newly introduced nullable column.
// Rollback snapshots above retain every field, including the third command.
const legacyRows = async (table: string) =>
  (await rows(table)).map(({ value }) => {
    const old = { ...value };
    if (Object.hasOwn(old,"diamond_commands")) { assert.equal(old.diamond_commands,null); delete old.diamond_commands; }
    if (Object.hasOwn(old, "branch_successor_command")) {
      assert.equal(old.branch_successor_command, null);
      delete old.branch_successor_command;
    }
    if (Object.hasOwn(old, "merge_successor_command")) {
      assert.equal(old.merge_successor_command, null);
      delete old.merge_successor_command;
    }
    return { value: old };
  });
for (const topology of ["isolated-task", "two-task", "linear-chain"])
  test(`populated 0069 upgrade preserves ${topology} originals, every old row and output byte`, async () => {
    await database().query(
      await readFile("db/migrations/0001-recover.sql", "utf8"),
    );
    await database().query("DROP TABLE public.ppo_migrations");
    await migrate(69);
    await seed(69);
    const originals = [];
    {
      const f = await materialFixture();
      const b = {
        ...taskInput(2),
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
        dependencies: [{ task_id: f.task.id, kind: "FS" as const }],
      };
      if (topology !== "isolated-task")
        await saveTask(f.owner, f.project.id, b);
      const c = {
        ...taskInput(3),
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
        dependencies: [{ task_id: b.id, kind: "SS" as const }],
      };
      if (topology === "linear-chain") await saveTask(f.owner, f.project.id, c);
      const proposal = {
        ...materialProposal(await currentFollowup(f), f.task.id),
        ...(topology !== "isolated-task" ? { successor_task_id: b.id } : {}),
        ...(topology === "linear-chain" ? { chain_end_task_id: c.id } : {}),
      };
      const proposalOriginal = await executeMaterial(
        f.owner,
        f.id,
        "MaterialPropose",
        proposal,
      );
      await receiveMaterial(f);
      await executeMaterial(
        f.owner,
        f.id,
        "MaterialReview",
        materialReview(await currentFollowup(f)),
      );
      const cmd = materialApply(await currentFollowup(f));
      const original = await executeMaterial(
        f.owner,
        f.id,
        "MaterialApply",
        cmd,
      );
      originals.push({
        proposal,
        proposalOriginal,
        f,
        cmd,
        original,
        bytes: await draftBytes(f.owner, f.id),
      });
    }
    const tables = (
      await database().query(
        "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
      )
    ).rows.map((r) => r.tablename as string);
    const before = await Promise.all(tables.map(legacyRows));
    const ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
    await migrate();
    await seed();
    assert.deepEqual(await Promise.all(tables.map(legacyRows)), before);
    const now = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
    assert.deepEqual(
      now.filter((r) => r.version <= 69),
      ledger,
    );
    assert.deepEqual(
      now.filter((r) => r.version > 69).map((r) => r.version),
      [70, 71, 72, 73],
    );
    for (const {
      f,
      cmd,
      original,
      bytes,
      proposal,
      proposalOriginal,
    } of originals) {
      assert.deepEqual(
        (await executeMaterial(f.owner, f.id, "MaterialPropose", proposal))
          .receipt,
        proposalOriginal.receipt,
      );
      assert.deepEqual(await draftBytes(f.owner, f.id), bytes);
      assert.deepEqual(
        (await executeMaterial(f.owner, f.id, "MaterialApply", cmd)).receipt,
        original.receipt,
      );
    }
    await migrate();
    await seed();
    assert.deepEqual(await Promise.all(tables.map(legacyRows)), before);
  });
test("Three-task branch accepts the native direction; reversed and newly added dependencies hold unexecuted receiving", async () => {
  const f = await fixture("SS");
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialPropose",
    materialProposal(await currentFollowup(f), f.task.id),
  );
  await receiveMaterial(f);
  await assert.rejects(
    executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    ),
    conflict,
  );
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
  });
  assert.ok(
    (await currentFollowup(f)).material_resolution.required.every(
      (r) => r.decision === null,
    ),
  );
  let t = await receiveMaterial(f);
  await executeMaterial(f.owner, f.id, "MaterialReview", materialReview(t));
  await createProject(f.owner, {
    ...f.project,
    id: randomUUID(),
    operation_id: randomUUID(),
  });
  assert.equal((await currentFollowup(f)).material_resolution.can_apply, true);
  const extra = {
    ...taskInput(4),
    title: "SYN additional consequence",
    owner_id: f.owner.actor_id,
    status: "Planned",
    progress: 0,
    dependencies: [{ task_id: f.c.id, kind: "FS" as const }],
  };
  await saveTask(f.owner, f.project.id, extra);
  t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  assert.ok(
    t.material_resolution.native_holds.some((x) => x.includes("additional")),
  );
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", materialApply(t)),
    conflict,
  );
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(t, f.b.id),
    successor_task_id: f.task.id,
  });
  t = await currentFollowup(f);
  assert.ok(
    t.material_resolution.native_holds.some((x) => x.includes("reversed")),
  );
});

for (const linear of [false, true])
  test(`${linear ? "linear-chain" : "two-task"} receiving never authorises a branch`, async () => {
    const f = await materialFixture();
    const b = {
      ...taskInput(2),
      owner_id: f.owner.actor_id,
      status: "Planned",
      progress: 0,
      dependencies: [{ task_id: f.task.id, kind: "FS" as const }],
    };
    await saveTask(f.owner, f.project.id, b);
    const c = {
      ...taskInput(3),
      owner_id: f.owner.actor_id,
      status: "Planned",
      progress: 0,
      dependencies: [
        { task_id: linear ? b.id : f.task.id, kind: "SS" as const },
      ],
    };
    if (linear) await saveTask(f.owner, f.project.id, c);
    await executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...materialProposal(await currentFollowup(f), f.task.id),
      successor_task_id: b.id,
      ...(linear ? { chain_end_task_id: c.id } : {}),
    });
    await receiveMaterial(f);
    await executeMaterial(
      f.owner,
      f.id,
      "MaterialReview",
      materialReview(await currentFollowup(f)),
    );
    const prior = (await currentFollowup(f)).material_resolution.review!;
    if (linear) {
      await saveTask(f.owner, f.project.id, {
        ...c,
        operation_id: randomUUID(),
        expected_version: 4,
        dependencies: [{ task_id: f.task.id, kind: "SS" }],
      });
    } else await saveTask(f.owner, f.project.id, c);
    await assert.rejects(
      executeMaterial(
        f.owner,
        f.id,
        "MaterialApply",
        materialApply(await currentFollowup(f)),
      ),
      conflict,
    );
    await executeMaterial(f.owner, f.id, "MaterialPropose", {
      ...materialProposal(await currentFollowup(f), f.task.id),
      successor_task_id: b.id,
      branch_successor_task_id: c.id,
    });
    const t = await currentFollowup(f);
    assert.equal(t.material_resolution.required.length, 6);
    assert.equal(t.material_resolution.native_holds.length, 0);
    assert.ok(t.material_resolution.required.every((r) => r.decision === null));
    assert.ok(t.material_resolution.events.some((e) => e.id === prior.id));
    await assert.rejects(
      executeMaterial(f.owner, f.id, "MaterialReview", materialReview(t)),
      conflict,
    );
  });

test("new consequential Project Engineering after review holds the complete branch without partial task effects", async () => {
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
test("ES07 branch: Activity completion and review notes cannot clear operational Impact or restore readiness", async () => {
  const f = await fixture(),
    candidate = (await currentFollowup(f)).material_resolution.candidates[0];
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
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
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
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

// Dependency writes are native task saves: the database also requires the exact
// schedule snapshot. Separate graph-specific assertions prove fresh edge inspection.
async function changeDependencies(
  f: Awaited<ReturnType<typeof fixture>>,
  id: string,
  dependencies: { task_id: string; kind: "FS" | "SS" }[],
) {
  const schedule = await readSchedule(f.owner, f.project.id);
  const task = schedule.tasks.find((t) => t.id === id)!;
  await saveTask(f.owner, f.project.id, {
    ...taskInput(schedule.project.version),
    id,
    title: task.title,
    phase: task.phase,
    status: task.status,
    milestone: task.milestone,
    progress: task.progress,
    start_date: task.start_date,
    finish_date: task.finish_date,
    note: task.note,
    owner_id: task.owner_id,
    external_owner_id: task.external_owner_id,
    dependencies,
  });
}
async function freezeBranch(f: Awaited<ReturnType<typeof fixture>>) {
  await executeMaterial(f.owner, f.id, "MaterialPropose", {
    ...materialProposal(await currentFollowup(f), f.task.id),
    successor_task_id: f.b.id,
    branch_successor_task_id: f.c.id,
  });
  await receiveMaterial(f);
  await executeMaterial(
    f.owner,
    f.id,
    "MaterialReview",
    materialReview(await currentFollowup(f)),
  );
  return materialApply(await currentFollowup(f));
}
async function assertGraphRefusal(
  f: Awaited<ReturnType<typeof fixture>>,
  command: ReturnType<typeof materialApply>,
) {
  const before = await readSchedule(f.owner, f.project.id);
  const t = await currentFollowup(f);
  assert.ok(t.material_resolution.holds.length);
  assert.ok(
    t.material_resolution.native_holds.some((h) => h.includes("additional")),
  );
  assert.equal(t.material_resolution.can_apply, false);
  await assert.rejects(
    executeMaterial(f.owner, f.id, "MaterialApply", command),
    conflict,
  );
  const after = await readSchedule(f.owner, f.project.id);
  assert.deepEqual(after.project, before.project);
  assert.deepEqual(after.tasks, before.tasks);
  assert.equal((await currentFollowup(f)).material_resolution.applied, null);
}

for (const outgoing of [false, true])
  for (const selectedName of ["A", "B", "C"] as const)
    test(`a new ${outgoing ? "outgoing" : "incoming"} edge at branch task ${selectedName} holds frozen review and is explicitly identified by fresh graph inspection`, async () => {
      const f = await fixture();
      const other = {
        ...taskInput(4),
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
      };
      await saveTask(f.owner, f.project.id, other);
      const command = await freezeBranch(f);
      const selected =
        selectedName === "A"
          ? f.task.id
          : selectedName === "B"
            ? f.b.id
            : f.c.id;
      const changed = outgoing ? other.id : selected;
      const schedule = await readSchedule(f.owner, f.project.id);
      const oldDependencies = schedule.tasks.find(
        (t) => t.id === changed,
      )!.dependencies;
      await changeDependencies(f, changed, [
        ...oldDependencies,
        { task_id: outgoing ? selected : other.id, kind: "FS" },
      ]);
      await assertGraphRefusal(f, command);
      // Restoring the topology does not revive earlier consent across the native versions.
      await changeDependencies(f, changed, oldDependencies);
      const restored = await currentFollowup(f);
      assert.equal(restored.material_resolution.native_holds.length, 0);
      assert.equal(restored.material_resolution.can_apply, false);
      assert.ok(restored.material_resolution.holds.length);
    });

for (const shape of [
  "B to C",
  "C to B",
  "merge",
  "reversed A-B",
  "missing A-B",
  "missing A-C",
] as const)
  test(`branch review refuses ${shape} introduced by native dependency saves`, async () => {
    const f = await fixture();
    const command = await freezeBranch(f);
    const dep = (task_id: string, kind: "FS" | "SS" = "FS") => ({
      task_id,
      kind,
    });
    if (shape === "B to C")
      await changeDependencies(f, f.c.id, [dep(f.task.id, "SS"), dep(f.b.id)]);
    else if (shape === "C to B")
      await changeDependencies(f, f.b.id, [dep(f.task.id), dep(f.c.id)]);
    else if (shape === "merge") {
      await changeDependencies(f, f.b.id, []);
      await changeDependencies(f, f.c.id, [dep(f.task.id, "SS"), dep(f.b.id)]);
    } else if (shape === "reversed A-B") {
      await changeDependencies(f, f.b.id, []);
      await changeDependencies(f, f.task.id, [dep(f.b.id)]);
    } else
      await changeDependencies(
        f,
        shape === "missing A-B" ? f.b.id : f.c.id,
        [],
      );
    await assertGraphRefusal(f, command);
  });
