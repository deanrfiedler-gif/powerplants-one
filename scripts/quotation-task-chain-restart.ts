// Run write and verify in different compiled application processes, with a real
// PostgreSQL restart between them. Never reset this retained proof database.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import {
  materialHttpFixture,
  materialProposal,
  materialReceiving,
  materialReview,
  materialApply,
  json,
  request,
  session,
  conversionDetail,
} from "../tests/helpers/quotation-material-resolution-http";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable ppo_synthetic_test only");
const directory =
  process.env.PPO_CHAIN_PROOF_DIRECTORY ??
  "verification-evidence/quotation-task-chain-restart";
const checkpoint = path.join(directory, "checkpoint.json");
const sha = (v: Uint8Array) => createHash("sha256").update(v).digest("hex");
const tables = [
  "permission_grants",
  "business_identities",
  "estimates",
  "estimate_versions",
  "estimate_review_events",
  "draft_quotes",
  "draft_quote_revisions",
  "estimate_quote_jobs",
  "estimate_quote_attempts",
  "quote_release_bases",
  "quote_release_events",
  "quote_response_events",
  "quote_conversion_events",
  "quote_conversion_targets",
  "quote_disposition_events",
  "quote_supply_events",
  "quote_supply_receipt_events",
  "quote_supply_shortfall_events",
  "quote_material_events",
  "supply_records",
  "supply_revisions",
  "supply_facts",
  "supply_allocations",
  "supply_allocation_history",
  "activities",
  "activity_links",
  "projects",
  "project_tasks",
  "project_dependencies",
  "project_schedule_events",
  "operation_receipts",
  "outbox_jobs",
];
async function snapshot(cutoff: string) {
  const rows = [];
  for (const table of tables)
    rows.push(
      ...(
        await database().query(
          `SELECT '${table}' kind,to_jsonb(t) value FROM ppo.${table} t ORDER BY to_jsonb(t)::text`,
        )
      ).rows,
    );
  rows.push(
    ...(
      await database().query(
        "SELECT 'audit_events' kind,to_jsonb(t) value FROM ppo.audit_events t WHERE object_type<>'Session' OR occurred_at<=$1::timestamptz ORDER BY to_jsonb(t)::text",
        [cutoff],
      )
    ).rows,
  );
  return rows;
}
const start = async () =>
  (await database().query("SELECT pg_postmaster_start_time()::text started"))
    .rows[0].started;
try {
  if (process.argv[2] === "write") {
    const f = await materialHttpFixture(false, true, true),
      receipts: {
        path: string;
        command: Record<string, unknown>;
        receipt: unknown;
      }[] = [];
    const save = async (path: string, command: Record<string, unknown>) =>
      receipts.push({
        path,
        command,
        receipt: await json(f.owner, path, command),
      });
    await json(f.owner, `estimating/quotes/${f.draft.id}/render`, {});
    await save(f.path + "/material-propose", {
      ...materialProposal(await f.current(), f.task.id),
      successor_task_id: f.successor!.id,
      chain_end_task_id: f.chainEnd!.id,
    });
    for (const r of (await f.current()).material_resolution.required)
      await save(
        f.path + "/material-receive",
        materialReceiving(await f.current(), r.role),
      );
    await save(f.path + "/material-review", materialReview(await f.current()));
    const t = await f.current(),
      p = t.material_resolution.proposal!;
    await save(f.path + "/material-apply", materialApply(t));
    const { project_id, ...pc } = p.project_command,
      { record_id, ...ic } = p.impact_command;
    receipts.push({
      path: `projects/${project_id}/tasks`,
      command: pc,
      receipt: await json(f.owner, `operations/${pc.operation_id}`),
    });
    receipts.push({
      path: `supply/records/${record_id}/facts`,
      command: ic,
      receipt: await json(f.owner, `operations/${ic.operation_id}`),
    });
    const { project_id: successorProject, ...successorCommand } =
      p.successor_command!;
    receipts.push({
      path: `projects/${successorProject}/tasks`,
      command: successorCommand,
      receipt: await json(
        f.owner,
        `operations/${successorCommand.operation_id}`,
      ),
    });
    const { project_id: thirdProject, ...thirdCommand } = p.chain_end_command!;
    receipts.push({
      path: `projects/${thirdProject}/tasks`,
      command: thirdCommand,
      receipt: await json(f.owner, `operations/${thirdCommand.operation_id}`),
    });
    const after = await f.current(),
      originals = [];
    for (const e of [
      ...after.events,
      ...after.receipt_correction.events,
      ...after.allocation_shortfall.events,
      ...after.material_resolution.events,
    ])
      originals.push({
        operation_id: e.operation_id,
        receipt: await json(f.owner, `operations/${e.operation_id}`),
      });
    for (const e of after.events.filter((e) => e.native_receipt))
      originals.push({
        operation_id: e.native_receipt!.operation_id,
        receipt: await json(
          f.owner,
          `operations/${e.native_receipt!.operation_id}`,
        ),
      });
    await mkdir(directory, { recursive: true });
    const files = [];
    for (const id of [f.draft.id, f.id])
      for (const kind of ["html", "pdf"]) {
        const response = await request(
          f.owner,
          `estimating/quotes/${id}/file?kind=${kind}`,
        );
        assert.equal(response.status, 200);
        const bytes = new Uint8Array(await response.arrayBuffer()),
          name = `${id}.${kind}`;
        await writeFile(path.join(directory, name), bytes);
        files.push({ id, kind, name, hash: sha(bytes) });
      }
    const cutoff = (
      await database().query("SELECT clock_timestamp()::text cutoff")
    ).rows[0].cutoff;
    await writeFile(
      checkpoint,
      JSON.stringify(
        {
          revision: f.id,
          receipts,
          originals,
          files,
          cutoff,
          rows: await snapshot(cutoff),
          outcome: after.material_resolution.applied,
          postmaster: await start(),
        },
        null,
        2,
      ),
    );
    console.log(
      `Material checkpoint: ${receipts.length} exact replays, ${originals.length} original lookups, four output files.`,
    );
  } else if (process.argv[2] === "verify") {
    const data = JSON.parse(await readFile(checkpoint, "utf8"));
    assert.notEqual(
      await start(),
      data.postmaster,
      "Restart actual PostgreSQL first",
    );
    assert.deepEqual(await snapshot(data.cutoff), data.rows);
    const owner = await session("coordinator");
    for (const r of data.originals)
      assert.deepEqual(
        await json(owner, `operations/${r.operation_id}`),
        r.receipt,
      );
    for (const r of data.receipts) {
      assert.deepEqual(
        await json(owner, `operations/${r.command.operation_id}`),
        r.receipt,
      );
      assert.deepEqual(await json(owner, r.path, r.command), r.receipt);
    }
    for (const f of data.files) {
      const response = await request(
        owner,
        `estimating/quotes/${f.id}/file?kind=${f.kind}`,
      );
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(sha(bytes), f.hash);
      assert.deepEqual(bytes, await readFile(path.join(directory, f.name)));
    }
    const d = await conversionDetail(owner, data.revision),
      s = d.followups[0].material_resolution;
    assert.deepEqual(s.applied, data.outcome);
    assert.equal(s.can_apply, false);
    assert.equal(s.applied!.native_receipts.length, 4);
    assert.equal(s.applied!.effect_receiving_ids.length, 6);
    assert.equal(s.dependencies!.project.successor!.start_date, null);
    assert.equal(s.dependencies!.project.successor!.finish_date, null);
    assert.deepEqual(s.dependencies!.project.successor!.dependencies, [
      { task_id: s.dependencies!.project.task.id, kind: "FS" },
    ]);
    assert.equal(s.dependencies!.project.chainEnd!.start_date, null);
    assert.equal(s.dependencies!.project.chainEnd!.finish_date, null);
    assert.deepEqual(s.dependencies!.project.chainEnd!.dependencies, [
      { task_id: s.dependencies!.project.successor!.id, kind: "SS" },
    ]);
    assert.equal(s.dependencies!.unmet, "3.624999");
    assert.equal(s.dependencies!.project.task.start_date, null);
    assert.equal(s.dependencies!.project.task.finish_date, null);
    assert.ok(
      s.dependencies!.facts.some(
        (f) => f.kind === "Impact" && f.data.state === "Requested",
      ),
    );
    assert.equal(d.dispositions[0].status, "Review required");
    assert.deepEqual(await snapshot(data.cutoff), data.rows);
    const result = {
      source_head: process.env.PPO_SOURCE_HEAD ?? null,
      verified_at: new Date().toISOString(),
      original_postmaster: data.postmaster,
      restarted_postmaster: await start(),
      exact_replays: data.receipts.length,
      original_operation_receipts: data.originals.length,
      unchanged_snapshot_rows: data.rows.length,
      unchanged_output_files: data.files,
      allocation_outcome_id: s.applied!.allocation_outcome_id,
      impact_predecessor: s.applied!.impact_id,
      receiving_ids: s.applied!.effect_receiving_ids,
      native_receipts: s.applied!.native_receipts,
      unmet: s.dependencies!.unmet,
    };
    await writeFile(
      path.join(directory, "verification.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(
      `Material application/PostgreSQL restart: ${data.receipts.length} exact replays, ${data.originals.length} original receipts, ${data.rows.length} unchanged snapshot rows, four unchanged output files. Unmet Demand and independent Requested Impacts retained.`,
    );
  } else throw Error("Use write or verify");
} finally {
  await closeDatabase();
}
