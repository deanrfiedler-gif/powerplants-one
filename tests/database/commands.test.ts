import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import pg from "pg";
import { database, closeDatabase } from "../../src/platform/database";
import { createSession, resolveIdentity } from "../../src/platform/identity";
import { readTicket, saveDraft } from "../../src/service/tickets";
import { reset, seed, migrate } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
const ticket = "40000000-0000-4000-8000-000000000001";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw new Error(
    "Database tests require the disposable ppo_synthetic_test database.",
  );
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const command = () => ({
  operation_id: randomUUID(),
  expected_version: 1,
  schema_version: 1,
  summary: "SYN inspection with recorded uncertainty",
  reason: "Clarify the synthetic request",
});
const principal = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const code = (expected: string) => (error: unknown) =>
  (error as { code?: string }).code === expected;
test("idle database disconnect is handled and accepted data survives reconnection", async () => {
  const p = await principal(),
    c = command();
  await saveDraft(p, ticket, c);
  const pool = database(),
    pid = (await pool.query("SELECT pg_backend_pid() pid")).rows[0].pid;
  const ended = once(pool, "error"),
    control = new pg.Client({ connectionString: localConfig().database_url });
  try {
    await control.connect();
    assert.equal(
      (await control.query("SELECT pg_terminate_backend($1) terminated", [pid]))
        .rows[0].terminated,
      true,
    );
    await ended;
    assert.equal((await readTicket(p, ticket)).summary, c.summary);
  } finally {
    await control.end();
  }
});
test("authorised read/save persists matching actor, version, audit, receipt and outbox", async () => {
  const p = await principal(),
    before = await readTicket(p, ticket),
    c = command();
  assert.equal(before.version, 1);
  assert.equal(before.synthetic, true);
  const receipt = await saveDraft(p, ticket, c);
  assert.equal(receipt.record_version, 2);
  assert.equal(receipt.state, "New");
  const t = await readTicket(p, ticket);
  assert.equal(t.summary, c.summary);
  assert.equal(t.version, 2);
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"]) {
    const r = await database().query(
      `SELECT * FROM ppo.${table} WHERE operation_id=$1`,
      [c.operation_id],
    );
    assert.equal(r.rowCount, 1);
    assert.equal(r.rows[0].actor_id, p.actor_id);
  }
  const out = await database().query(
    "SELECT status,attempts FROM ppo.outbox_jobs",
  );
  assert.deepEqual(out.rows, [{ status: "Ready", attempts: 0 }]);
});
test("read-only, systems, wrong company/workspace and forged input are rejected", async () => {
  const coordinator = await principal(),
    observer = await principal("observer"),
    systems = await principal("systems"),
    other = await principal("other-workspace");
  assert.equal((await readTicket(observer, ticket)).can_edit, false);
  await assert.rejects(
    saveDraft(observer, ticket, command()),
    code("Forbidden"),
  );
  await assert.rejects(readTicket(systems, ticket), code("Forbidden"));
  for (const target of [
    "40000000-0000-4000-8000-000000000002",
    "40000000-0000-4000-8000-000000000003",
    randomUUID(),
  ]) {
    await assert.rejects(
      readTicket(coordinator, target),
      code("RecordUnavailable"),
    );
    await assert.rejects(
      saveDraft(coordinator, target, command()),
      code("RecordUnavailable"),
    );
  }
  await assert.rejects(readTicket(other, ticket), code("RecordUnavailable"));
  await assert.rejects(
    saveDraft(coordinator, ticket, {
      ...command(),
      actor_id: systems.actor_id,
    }),
    code("InvalidData"),
  );
  assert.equal((await readTicket(coordinator, ticket)).version, 1);
});
test("stale edits fail; identical and genuinely concurrent retries return original receipt", async () => {
  const p = await principal(),
    c = command();
  const outcomes = await Promise.all([
    saveDraft(p, ticket, c),
    saveDraft(p, ticket, { ...c }),
  ]);
  assert.deepEqual(outcomes[0], outcomes[1]);
  assert.deepEqual(await saveDraft(p, ticket, c), outcomes[0]);
  await assert.rejects(
    saveDraft(p, ticket, { ...c, summary: "Different content" }),
    code("OperationConflict"),
  );
  await assert.rejects(
    saveDraft(p, ticket, { ...command(), summary: "Stale replacement" }),
    code("VersionConflict"),
  );
  assert.equal((await readTicket(p, ticket)).version, 2);
  const counts = await database().query(
    "SELECT (SELECT count(*)::int FROM ppo.operation_receipts) receipts,(SELECT count(*)::int FROM ppo.outbox_jobs) jobs,(SELECT count(*)::int FROM ppo.audit_events WHERE operation_id IS NOT NULL) audit",
  );
  assert.deepEqual(counts.rows[0], { receipts: 1, jobs: 1, audit: 1 });
});
test("failure in final outbox insert rolls back business change, audit and receipt; ID remains usable", async () => {
  const p = await principal(),
    c = command();
  await database().query(
    "CREATE FUNCTION ppo.force_test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'P01 deliberate transaction failure'; END $$; CREATE TRIGGER force_test_failure BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.force_test_failure()",
  );
  await assert.rejects(saveDraft(p, ticket, c));
  assert.equal((await readTicket(p, ticket)).version, 1);
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.equal(
      (
        await database().query(
          `SELECT count(*)::int AS n FROM ppo.${table} WHERE operation_id=$1`,
          [c.operation_id],
        )
      ).rows[0].n,
      0,
    );
  await database().query(
    "DROP TRIGGER force_test_failure ON ppo.outbox_jobs; DROP FUNCTION ppo.force_test_failure()",
  );
  assert.equal((await saveDraft(p, ticket, c)).record_version, 2);
});
test("replay rechecks current grants; sessions expire, switch actor and revoke prior token", async () => {
  const session = await createSession("coordinator"),
    p = await resolveIdentity(session.token),
    c = command();
  await saveDraft(p, ticket, c);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.ticket.edit'",
    [p.actor_id],
  );
  await assert.rejects(saveDraft(p, ticket, c), code("Forbidden"));
  const switched = await createSession("observer", session.token);
  assert.notEqual(switched.principal.actor_id, p.actor_id);
  await assert.rejects(
    resolveIdentity(session.token),
    code("AuthenticationRequired"),
  );
  await database().query(
    "UPDATE ppo.sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE actor_id=$1",
    [switched.principal.actor_id],
  );
  await assert.rejects(
    resolveIdentity(switched.token),
    code("AuthenticationRequired"),
  );
});
test("seed is repeatable, migration is idempotent and accepted evidence is append-only", async () => {
  const p = await principal(),
    c = command();
  await saveDraft(p, ticket, c);
  await seed();
  await migrate();
  assert.equal((await readTicket(p, ticket)).version, 2);
  await assert.rejects(
    database().query(
      "UPDATE ppo.audit_events SET reason='replacement' WHERE operation_id=$1",
      [c.operation_id],
    ),
  );
  await assert.rejects(
    database().query(
      "DELETE FROM ppo.operation_receipts WHERE operation_id=$1",
      [c.operation_id],
    ),
  );
  await closeDatabase();
  assert.equal((await readTicket(p, ticket)).summary, c.summary);
});
