import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { prepareSupplyReturn } from "../src/maintenance/supply-return";
import { hash } from "../src/maintenance/context";
import { readOperation } from "../src/shared/receipts";
import { recordFact } from "../src/supply/commands";
import { supplyFact } from "../tests/helpers/supply";
import { warrantyReturnFixture } from "../tests/helpers/warranty-supply-return";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
const mode = process.argv[2],
  path = process.argv[3];
if (!["write", "verify"].includes(mode) || !path)
  throw Error("Usage: write|verify <evidence-path>");
type Fixture = Awaited<ReturnType<typeof warrantyReturnFixture>>;
async function snapshot(f: Fixture) {
  const c = database(),
    data: Record<string, unknown> = {};
  for (const [key, sql, args] of [
    [
      "claim",
      "SELECT * FROM ppo.supplier_claims WHERE workspace_id=$1 AND id=$2",
      [f.p.workspace_id, f.claimId],
    ],
    [
      "bridge",
      "SELECT * FROM ppo.maintenance_events WHERE workspace_id=$1 AND record_id=$2 ORDER BY version",
      [f.p.workspace_id, f.claimId],
    ],
    [
      "return",
      "SELECT * FROM ppo.supply_records WHERE workspace_id=$1 AND id=$2",
      [f.p.workspace_id, f.cmd.return_id],
    ],
    [
      "facts",
      "SELECT * FROM ppo.supply_facts WHERE workspace_id=$1 AND record_id=$2 ORDER BY version,id",
      [f.p.workspace_id, f.cmd.return_id],
    ],
    [
      "receipts",
      "SELECT * FROM ppo.operation_receipts WHERE workspace_id=$1 AND actor_id=$2 ORDER BY id",
      [f.p.workspace_id, f.p.actor_id],
    ],
    [
      "audits",
      "SELECT * FROM ppo.audit_events WHERE workspace_id=$1 AND actor_id=$2 ORDER BY id",
      [f.p.workspace_id, f.p.actor_id],
    ],
    [
      "outbox",
      "SELECT * FROM ppo.outbox_jobs WHERE workspace_id=$1 AND actor_id=$2 ORDER BY id",
      [f.p.workspace_id, f.p.actor_id],
    ],
  ] as const)
    data[key] = (await c.query(sql, [...args])).rows;
  return hash(data);
}
try {
  const started = (
    await database().query("SELECT pg_postmaster_start_time()::text AS started")
  ).rows[0].started as string;
  if (mode === "write") {
    const f = await warrantyReturnFixture();
    const receipt = (await prepareSupplyReturn(f.p, f.claimId, f.cmd)).receipt;
    const proposed = supplyFact("ReturnAuthorisation", 1, {
      state: "Proposed",
      quantity: "2",
    });
    await recordFact(f.p, f.cmd.return_id, proposed);
    await recordFact(f.p, f.cmd.return_id, {
      ...supplyFact("ReturnAuthorisation", 2, {
        state: "Approved",
        quantity: "2",
      }),
      predecessor_id: proposed.id,
    });
    await recordFact(
      f.p,
      f.cmd.return_id,
      supplyFact("ReturnReceipt", 3, {
        received: "1",
        usable: "0",
        quarantined: "1",
      }),
    );
    const native = await readOperation(f.p, f.cmd.supply_operation_id);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(
      path,
      JSON.stringify(
        { f, receipt, native, started, snapshot_hash: await snapshot(f) },
        null,
        2,
      ) + "\n",
    );
    console.log(
      "Retained bridge, native partial receipt and both original operations before database restart.",
    );
  } else {
    const saved = JSON.parse(await readFile(path, "utf8"));
    assert.notEqual(
      started,
      saved.started,
      "Restart PostgreSQL between write and verify.",
    );
    assert.equal(await snapshot(saved.f), saved.snapshot_hash);
    assert.deepEqual(
      await readOperation(saved.f.p, saved.f.cmd.operation_id),
      saved.receipt,
    );
    assert.deepEqual(
      await readOperation(saved.f.p, saved.f.cmd.supply_operation_id),
      saved.native,
    );
    const replay = await prepareSupplyReturn(
      saved.f.p,
      saved.f.claimId,
      saved.f.cmd,
    );
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.receipt, saved.receipt);
    assert.equal(
      await snapshot(saved.f),
      saved.snapshot_hash,
      "Recovery/replay must add no effects.",
    );
    console.log(
      JSON.stringify({
        result: "passed",
        different_database_start: true,
        snapshot_hash: saved.snapshot_hash,
        exact_originals: 2,
        replay_added_effects: 0,
      }),
    );
  }
} finally {
  await closeDatabase();
}
