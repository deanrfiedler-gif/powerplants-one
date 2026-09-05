import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { setTimeout as pause } from "node:timers/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate } from "../../scripts/database";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw new Error("Reservation proof requires ppo_synthetic_test.");
before(() => migrate());
after(closeDatabase);
test("competing PostgreSQL transactions cannot commit overlapping active reservations", async () => {
  const pool = database(),
    a = await pool.connect(),
    b = await pool.connect(),
    watch = await pool.connect();
  const workspace = randomUUID(),
    resource = randomUUID(),
    winner = randomUUID();
  const sql =
    "INSERT INTO ppo_proof.reservations(id,workspace_id,resource_id,start_at,end_at) VALUES($1,$2,$3,$4,$5)";
  let pending: Promise<unknown> | undefined;
  try {
    await a.query("BEGIN");
    await b.query("BEGIN");
    const apid = (await a.query("SELECT pg_backend_pid() pid")).rows[0].pid,
      bpid = (await b.query("SELECT pg_backend_pid() pid")).rows[0].pid;
    assert.notEqual(apid, bpid);
    await a.query(sql, [
      winner,
      workspace,
      resource,
      "2026-09-07T09:00:00Z",
      "2026-09-07T11:00:00Z",
    ]);
    pending = b
      .query(sql, [
        randomUUID(),
        workspace,
        resource,
        "2026-09-07T10:00:00Z",
        "2026-09-07T12:00:00Z",
      ])
      .then(
        () => ({ accepted: true }),
        (e) => ({ code: e.code }),
      );
    let blocked = false;
    for (let i = 0; i < 100; i++) {
      const r = await watch.query(
        "SELECT $1=ANY(pg_blocking_pids($2)) AS blocked",
        [apid, bpid],
      );
      if (r.rows[0].blocked) {
        blocked = true;
        break;
      }
      await pause(20);
    }
    assert.equal(
      blocked,
      true,
      "Second live backend must demonstrably wait on the first transaction",
    );
    await a.query("COMMIT");
    assert.deepEqual(await pending, { code: "23P01" });
    await b.query("ROLLBACK");
    assert.equal(
      (
        await watch.query(
          "SELECT count(*)::int n FROM ppo_proof.reservations WHERE workspace_id=$1",
          [workspace],
        )
      ).rows[0].n,
      1,
    );
    console.log(
      JSON.stringify({
        proof: "P01 reservation contention",
        backend_a: apid,
        backend_b: bpid,
        blocked_before_commit: blocked,
        rejected_sqlstate: "23P01",
        committed_reservations: 1,
      }),
    );
    // Adjacent boundary accepted; changing it to overlap rolls back and preserves its original interval.
    const adjacent = randomUUID();
    await a.query(sql, [
      adjacent,
      workspace,
      resource,
      "2026-09-07T11:00:00Z",
      "2026-09-07T12:00:00Z",
    ]);
    await a.query("BEGIN");
    await assert.rejects(
      a.query("UPDATE ppo_proof.reservations SET start_at=$1 WHERE id=$2", [
        "2026-09-07T10:59:59Z",
        adjacent,
      ]),
      (e: unknown) => (e as { code: string }).code === "23P01",
    );
    await a.query("ROLLBACK");
    const original = (
      await watch.query(
        "SELECT start_at,end_at,lower_inc(during) lower,upper_inc(during) upper FROM ppo_proof.reservations WHERE id=$1",
        [adjacent],
      )
    ).rows[0];
    assert.equal(original.start_at.toISOString(), "2026-09-07T11:00:00.000Z");
    assert.equal(original.lower, true);
    assert.equal(original.upper, false);
    // Partial multi-resource write is lost when a later conflicting insert rejects the transaction.
    const extra = randomUUID();
    await b.query("BEGIN");
    await b.query(sql, [
      extra,
      workspace,
      randomUUID(),
      "2026-09-07T09:00:00Z",
      "2026-09-07T11:00:00Z",
    ]);
    await assert.rejects(
      b.query(sql, [
        randomUUID(),
        workspace,
        resource,
        "2026-09-07T09:00:00Z",
        "2026-09-07T11:00:00Z",
      ]),
    );
    await b.query("ROLLBACK");
    assert.equal(
      (
        await watch.query("SELECT id FROM ppo_proof.reservations WHERE id=$1", [
          extra,
        ])
      ).rowCount,
      0,
    );
    for (const [start, end] of [
      ["2026-09-08T09:00:00Z", "2026-09-08T09:00:00Z"],
      ["2026-09-08T10:00:00Z", "2026-09-08T09:00:00Z"],
      ["2026-09-08T09:00:00Z", "infinity"],
    ])
      await assert.rejects(
        watch.query(sql, [randomUUID(), workspace, resource, start, end]),
      );
    await watch.query(
      "UPDATE ppo_proof.reservations SET active=false WHERE id=$1",
      [winner],
    );
    await watch.query(sql, [
      randomUUID(),
      workspace,
      resource,
      "2026-09-07T09:00:00Z",
      "2026-09-07T11:00:00Z",
    ]);
  } finally {
    await a.query("ROLLBACK");
    await b.query("ROLLBACK");
    if (pending) await pending;
    a.release();
    b.release();
    watch.release();
  }
});
