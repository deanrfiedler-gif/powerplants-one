// Run write/verify around a real application AND PostgreSQL restart. Private
// originals and configuration stay outside Git. No service is managed here.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { request } from "playwright";
import { database, closeDatabase } from "../src/platform/database";
import { localConfig } from "../src/platform/config";
const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const [mode, directory, journeyPath] = process.argv.slice(2);
assert.ok(["write", "verify"].includes(mode) && directory);
const root = resolve(directory);
await mkdir(root, { recursive: true });
const originalPath = join(root, "original.json");
const original =
  mode === "verify" ? JSON.parse(await readFile(originalPath, "utf8")) : null;
const journey =
  original?.journey ?? JSON.parse(await readFile(journeyPath, "utf8"));
const client = await request.newContext({
  baseURL: config.origin,
  extraHTTPHeaders: { origin: config.origin },
});
const digest = (bytes: Buffer | string) =>
  createHash("sha256").update(bytes).digest("hex");
try {
  const login = await client.post("/api/v1/local-session", {
    data: { profile: "coordinator" },
  });
  assert.equal(login.status(), 200);
  const fetch = async (path: string) => {
    const r = await client.get(path);
    assert.equal(r.status(), 200, path);
    return r;
  };
  const v = await (
    await fetch(`/api/v1/service/incidents/${journey.incident}`)
  ).json();
  const tables: Record<string, unknown> = {};
  for (const table of [
    "incidents",
    "incident_bindings",
    "incident_actions",
    "incident_evidence",
    "incident_events",
    "incident_outputs",
  ])
    tables[table] = (
      await database().query(
        `SELECT to_jsonb(t) AS row FROM ppo.${table} t WHERE ${table === "incidents" ? "id" : "incident_id"}=$1 ORDER BY id`,
        [journey.incident],
      )
    ).rows;
  tables.receipts = (
    await database().query(
      "SELECT to_jsonb(t) AS row FROM ppo.operation_receipts t WHERE record_id=$1 ORDER BY id",
      [journey.incident],
    )
  ).rows;
  tables.activities = (
    await database().query(
      "SELECT to_jsonb(t) AS row FROM ppo.activities t WHERE id IN (SELECT activity_id FROM ppo.incident_actions WHERE incident_id=$1) ORDER BY id",
      [journey.incident],
    )
  ).rows;
  const files: Record<string, string> = {};
  for (const e of v.evidence)
    files[e.id] = digest(
      await (
        await fetch(
          `/api/v1/service/incidents/${journey.incident}/files?evidence_id=${e.id}`,
        )
      ).body(),
    );
  for (const o of v.outputs)
    for (const format of ["html", "pdf"])
      files[`${o.id}.${format}`] = digest(
        await (
          await fetch(
            `/api/v1/service/incidents/${journey.incident}/files?output_id=${o.id}&format=${format}`,
          )
        ).body(),
      );
  const snapshot = { tables, files, view: v };
  const identity = {
    build: (await readFile(".next/BUILD_ID", "utf8")).trim(),
    application_pid: Number(process.env.PPO_RESTART_SERVER_PID),
    ...(
      await database().query(
        "SELECT pg_postmaster_start_time() AS postgres_started, version() AS postgres",
      )
    ).rows[0],
    at: new Date().toISOString(),
  };
  assert.ok(
    identity.application_pid > 0,
    "Record the task-owned running application PID",
  );
  if (mode === "write")
    await writeFile(
      originalPath,
      JSON.stringify({ journey, snapshot, identity }, null, 2) + "\n",
    );
  else {
    assert.deepEqual(snapshot, original.snapshot);
    assert.equal(identity.build, original.identity.build);
    assert.notEqual(
      identity.application_pid,
      original.identity.application_pid,
    );
    assert.notEqual(
      identity.postgres_started.toISOString(),
      original.identity.postgres_started,
    );
    await writeFile(
      join(root, "verification.json"),
      JSON.stringify(
        {
          result: "Passed exact application/PostgreSQL restart comparison",
          before: original.identity,
          after: identity,
          table_counts: Object.fromEntries(
            Object.entries(tables).map(([k, v]) => [
              k,
              (v as unknown[]).length,
            ]),
          ),
          files,
          current_state: v.row.state,
          scope_held: v.operational_hold,
          original_sha256: digest(await readFile(originalPath)),
          limitations:
            "Synthetic local only. No owner/device/screen-reader or deployment approval.",
        },
        null,
        2,
      ) + "\n",
    );
  }
  console.log(
    `${mode}: exact incident, facts/history, actions, receipts and ${Object.keys(files).length} files retained.`,
  );
} finally {
  await client.dispose();
  await closeDatabase();
}
