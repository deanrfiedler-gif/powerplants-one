/** Explicit, synthetic-only process-restart proof. Run write, restart PostgreSQL/app, then verify. */
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
import { createSession } from "../src/platform/identity";
import { saveRecord, recordFact } from "../src/supply/commands";
import { uploadEvidence, evidenceBytes } from "../src/supply/evidence";
import { recover, workspace } from "../src/supply/reads";
import { supplyBase, supplyFact, supplyInput } from "../tests/helpers/supply";
import { png } from "../tests/helpers/field";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use only ppo_synthetic_test");
const mode = process.argv[2];
if (!["write", "verify"].includes(mode)) throw Error("Choose write or verify");
const statePath = "tmp/supply-restart-proof.json";
const digest = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
async function snapshot(id: string) {
  const result: Record<string, unknown> = {};
  for (const [table, column] of [
    ["supply_records", "id"],
    ["supply_revisions", "record_id"],
    ["supply_facts", "record_id"],
    ["supply_attachments", "record_id"],
    ["operation_receipts", "record_id"],
    ["audit_events", "object_id"],
  ])
    result[table] = (
      await database().query(
        `SELECT to_jsonb(r) value FROM ppo.${table} r WHERE ${column}=$1 ORDER BY to_jsonb(r)::text`,
        [id],
      )
    ).rows;
  result.outbox = (
    await database().query(
      "SELECT to_jsonb(o) value FROM ppo.outbox_jobs o WHERE operation_id IN (SELECT operation_id FROM ppo.operation_receipts WHERE record_id=$1) ORDER BY to_jsonb(o)::text",
      [id],
    )
  ).rows;
  return result;
}
try {
  const p = (await createSession("coordinator")).principal;
  const startedAt = (
    await database().query("SELECT pg_postmaster_start_time() AS value")
  ).rows[0].value.toISOString();
  if (mode === "write") {
    const record = supplyInput("Supply"),
      photo = {
        ...supplyBase(),
        id: randomUUID(),
        expected_version: 1,
        caption: "SYN retained restart evidence",
        content_base64: png().toString("base64"),
      };
    await saveRecord(p, record);
    await uploadEvidence(p, record.id, photo);
    const fact = {
      ...supplyFact("Receipt", 2, {
        received: "4",
        inspected: "4",
        quarantined: "1",
        usable: "3",
        identity_status: "Verified",
      }),
      attachment_id: photo.id,
    };
    const saved = await recordFact(p, record.id, fact);
    const state = {
      actor: p.actor_id,
      postgres_started_at: startedAt,
      record,
      photo,
      fact,
      receipt: saved.receipt,
      hash: digest(await snapshot(record.id)),
    };
    await mkdir("tmp", { recursive: true });
    await writeFile(statePath, JSON.stringify(state, null, 2));
    console.log(
      JSON.stringify({
        phase: mode,
        record: record.id,
        version: 3,
        postgres_started_at: startedAt,
        snapshot_sha256: state.hash,
      }),
    );
  } else {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    assert.equal(p.actor_id, state.actor);
    assert.ok(
      new Date(startedAt).getTime() >
        new Date(state.postgres_started_at).getTime(),
      "Restart PostgreSQL between write and verify",
    );
    assert.equal(digest(await snapshot(state.record.id)), state.hash);
    assert.deepEqual(await recover(p, state.fact.operation_id), state.receipt);
    assert.deepEqual(
      Buffer.from(await evidenceBytes(p, state.photo.id)),
      png(),
    );
    assert.equal(
      (await recordFact(p, state.record.id, state.fact)).replayed,
      true,
    );
    assert.equal(
      (await uploadEvidence(p, state.record.id, state.photo)).replayed,
      true,
    );
    assert.equal(digest(await snapshot(state.record.id)), state.hash);
    assert.equal((await workspace(p, state.record.id)).current_facts.length, 1);
    const origin = localConfig().origin;
    const session = await fetch(origin + "/api/v1/local-session", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify({ profile: "coordinator" }),
    });
    assert.equal(session.status, 200);
    const cookie = session.headers.get("set-cookie")!.split(";")[0];
    const response = await fetch(
      origin + `/api/v1/supply/operations/${state.fact.operation_id}`,
      { headers: { cookie } },
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), state.receipt);
    console.log(
      JSON.stringify({
        phase: mode,
        record: state.record.id,
        postgres_started_at: startedAt,
        snapshot_sha256: state.hash,
        exact_png: true,
        original_receipt: true,
        replay_without_second_effect: true,
        restarted_application_http: true,
      }),
    );
  }
} finally {
  await closeDatabase();
}
