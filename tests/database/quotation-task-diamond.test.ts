import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { migrate, reset, seed } from "../../scripts/database";
import { conversionReadClient } from "../../src/estimating/conversion/source-authority";
import { materialDependencies } from "../../src/estimating/supply-followup/material-context";
import { executeMaterial } from "../../src/estimating/supply-followup/material-service";
import { draftBytes } from "../../src/estimating/worker";
import { localConfig } from "../../src/platform/config";
import { closeDatabase, database } from "../../src/platform/database";
import { readSchedule, saveTask } from "../../src/projects/service";
import { readOperation } from "../../src/shared/receipts";
import { taskInput } from "../helpers/projects";
import {
  materialApply,
  materialFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  receiveMaterial,
} from "../helpers/quotation-material-resolution";
import { currentFollowup } from "../helpers/quotation-supply-followup";
import { conflict, fixture, rows } from "../helpers/quotation-task-diamond";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const combinations = Array.from({ length: 16 }, (_, n) =>
  Array.from(
    { length: 4 },
    (_, i) => (n & (1 << i) ? "SS" : "FS") as "FS" | "SS",
  ),
);
for (const [kind, kind2, kind3, kind4] of combinations)
  test(`${kind}/${kind2}/${kind3}/${kind4} diamond: seven decisions, four task saves, D once, four retained edges and one Impact successor`, async () => {
    const f = await fixture(kind, true, kind2, kind3, kind4);
    let t = await currentFollowup(f);
    const original = t.material_resolution.proposal!;
    assert.equal(t.material_resolution.required.length, 7);
    assert.equal(t.material_resolution.native_holds.length, 0);
    assert.equal(original.successor_command, null);
    assert.equal(original.merge_successor_command, null);
    assert.equal(original.dependencies.project.topology, "Diamond");
    assert.equal(original.diamond_commands!.d.id, f.d.id);
    assert.equal(original.chain_end_command, null);
    assert.deepEqual(
      t.material_resolution.required.map((r) => r.role),
      [
        "Demand",
        "Project",
        "Task",
        "MaterialAction",
        "DiamondB",
        "DiamondC",
        "DiamondD",
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
      "DiamondB",
      "DiamondC",
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
    const receiving = materialReceiving(await currentFollowup(f), "DiamondD");
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
    assert.equal(after.project.version, before.project.version + 4);
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
    for (const [index, count] of [4, 1, 1, 1, 6, 6, 6].entries()) {
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
    for (const [i, taskId] of [f.task.id, f.b.id, f.c.id, f.d.id].entries()) {
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
    assert.equal(e.after!.project.topology, "Diamond");
    assert.equal(e.native_receipts.length, 5);
    assert.equal(e.allocation_outcome_id, original.allocation_outcome_id);
    assert.deepEqual(
      e.dependencies.allocation_outcome,
      original.dependencies.allocation_outcome,
    );
    assert.equal(e.impact_command.predecessor_id, original.impact_id);
    for (const command of [
      e.project_command,
      e.diamond_commands!.b,
      e.diamond_commands!.c,
      e.diamond_commands!.d,
    ])
      assert.ok(
        e.impact_command.data.review_reference!.includes(command.operation_id),
      );
    assert.equal(e.review_id, t.material_resolution.review!.id);
    assert.deepEqual(
      e.after!.project.dependencies,
      original.dependencies.project.dependencies,
    );
    assert.equal(e.effect_receiving_ids.length, 7);
    assert.equal(
      (
        await database().query(
          "SELECT count(*)::int n FROM ppo.project_schedule_events WHERE operation_id=ANY($1::uuid[]) AND task_snapshot->>'id'=$2",
          [e.native_receipts.map((r) => r.operation_id), f.d.id],
        )
      ).rows[0].n,
      1,
    );
    for (const originalRow of original.dependencies.project.diamond!
      .nativeTasks) {
      const saved = e.after!.project.diamond!.nativeTasks.find(
        (r) => r.id === originalRow.id,
      )!;
      const omit = (r: Record<string, unknown>) =>
        Object.fromEntries(
          Object.entries(r).filter(
            ([k]) =>
              ![
                "version",
                "project_version",
                "updated_by",
                "updated_at",
                "start_date",
                "finish_date",
              ].includes(k),
          ),
        );
      assert.deepEqual(omit(saved), omit(originalRow));
    }
    assert.equal(e.after!.unmet, "3.624999");
    for (const task of after.tasks) {
      const old = before.tasks.find((v) => v.id === task.id)!;
      if (![f.task.id, f.b.id, f.c.id, f.d.id].some((id) => id === task.id)) {
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
          e.native_receipts.slice(0, 4).map((r) => r.operation_id),
        ],
      )
    ).rows;
    assert.equal(scheduleEvents.length, 4);
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
        6,
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
        "ProjectTaskSaved",
        "QuotationSupplyRecorded",
        "SupplyRecorded",
      ],
    );
  });
const legacyRows = async (table: string) =>
  (await rows(table)).map(({ value }) => {
    const old = { ...value };
    if (Object.hasOwn(old, "diamond_commands")) {
      assert.equal(old.diamond_commands, null);
      delete old.diamond_commands;
    }
    return { value: old };
  });
// Retain every table/row while bounding pool acquisition: hundreds of queued
// acquires can expire before a query begins on a busy Windows test host.
async function legacySnapshot(tables: string[]) {
  const values: Awaited<ReturnType<typeof legacyRows>>[] = [];
  for (let i = 0; i < tables.length; i += 4)
    values.push(...(await Promise.all(tables.slice(i, i + 4).map(legacyRows))));
  return values;
}
for (const topology of [
  "isolated-task",
  "two-task",
  "linear-chain",
  "branch",
  "merge",
])
  test(`populated 0071 upgrade preserves ${topology} originals, every old row and output byte`, async () => {
    await database().query(
      await readFile("db/migrations/0001-recover.sql", "utf8"),
    );
    await database().query("DROP TABLE public.ppo_migrations");
    await migrate(71);
    await seed(71);
    const originals = [];
    {
      const f = await materialFixture();
      const b = {
        ...taskInput(2),
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
        start_date: "2027-12-01",
        finish_date: "2027-12-10",
        dependencies:
          topology === "merge"
            ? []
            : [{ task_id: f.task.id, kind: "FS" as const }],
      };
      if (topology !== "isolated-task")
        await saveTask(f.owner, f.project.id, b);
      const c = {
        ...taskInput(3),
        start_date: "2027-12-13",
        finish_date: "2027-12-17",
        owner_id: f.owner.actor_id,
        status: "Planned",
        progress: 0,
        dependencies: [
          ...(topology === "merge"
            ? [{ task_id: f.task.id, kind: "FS" as const }]
            : []),
          {
            task_id: topology === "branch" ? f.task.id : b.id,
            kind: "SS" as const,
          },
        ],
      };
      if (
        topology === "linear-chain" ||
        topology === "branch" ||
        topology === "merge"
      )
        await saveTask(f.owner, f.project.id, c);
      const proposal = {
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
    const before = await legacySnapshot(tables);
    const ledger = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
    await migrate();
    await seed();
    assert.deepEqual(await legacySnapshot(tables), before);
    const now = (
      await database().query(
        "SELECT * FROM public.ppo_migrations ORDER BY version",
      )
    ).rows;
    assert.deepEqual(
      now.filter((r) => r.version <= 71),
      ledger,
    );
    assert.deepEqual(
      now.filter((r) => r.version > 71).map((r) => r.version),
      [72, 73, 74, 75, 76, 77],
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
    assert.deepEqual(await legacySnapshot(tables), before);
  });

test("restricted runtime prepared diamond reads expose all four tasks only with current authority and no ledger privilege", async () => {
  const f = await fixture();
  const proposal = (await currentFollowup(f)).material_resolution.proposal!;
  const client = await database().connect();
  const role = `ppo_diamond_read_${randomUUID().replaceAll("-", "")}`;
  try {
    await client.query("BEGIN");
    await client.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      f.owner.workspace_id,
    ]);
    await client.query(`CREATE ROLE ${role} NOLOGIN`);
    await client.query(`GRANT USAGE ON SCHEMA ppo TO ${role}`);
    await client.query(`GRANT SELECT ON ALL TABLES IN SCHEMA ppo TO ${role}`);
    await client.query(`SET LOCAL ROLE ${role}`);
    const read = await conversionReadClient(client, f.owner);
    const current = () =>
      materialDependencies(
        read,
        f.owner,
        proposal.basis,
        proposal.dependencies.allocation_outcome,
        proposal.demand_id,
        proposal.impact_id,
        f.task.id,
        f.owner.actor_id,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { b: f.b.id, c: f.c.id, d: f.d.id },
      );
    const position = await current();
    assert.deepEqual(
      position.project.diamond,
      proposal.dependencies.project.diamond,
    );
    assert.equal(
      (
        await client.query(
          "SELECT has_table_privilege(current_user,'public.ppo_migrations','SELECT') allowed",
        )
      ).rows[0].allowed,
      false,
    );
    await client.query("RESET ROLE");
    await client.query(
      "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='project.read'",
      [f.owner.workspace_id, f.owner.actor_id],
    );
    await client.query(`SET LOCAL ROLE ${role}`);
    await assert.rejects(current);
    assert.equal(
      (
        await client.query(
          "SELECT has_table_privilege(current_user,'public.ppo_migrations','SELECT') allowed",
        )
      ).rows[0].allowed,
      false,
    );
  } finally {
    await client.query("ROLLBACK");
    client.release();
  }
});
