// Read-only evidence across explicit operator-owned lifecycle boundaries.
// Private rows, profiles and recovery data are never copied into Git.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve, isAbsolute } from "node:path";
import { localConfig } from "../src/platform/config";
import { database, closeDatabase } from "../src/platform/database";

const [phase, directory, compareTo, mode = "exact"] = process.argv.slice(2);
assert(phase && directory);
assert(["exact", "upgrade", "originals", "publication"].includes(mode));
assert.equal(localConfig().database_name, "ppo_synthetic_test");
const root = resolve(directory), documents = resolve(process.env.PPO_DOCUMENT_DIRECTORY!);
for (const path of [root, documents]) {
  const r = relative(process.cwd(), path);
  assert(r.startsWith("..") || isAbsolute(r), "Evidence/store must be outside the checkout");
}
const hash = (v: string | Buffer) => createHash("sha256").update(v).digest("hex");
const digest = (v: unknown) => hash(JSON.stringify(v));
async function files(dir: string, prefix = ""): Promise<Record<string, { bytes: number; sha256: string }>> {
  const result: Record<string, { bytes: number; sha256: string }> = {};
  for (const f of await readdir(dir, { withFileTypes: true })) {
    assert(!f.isSymbolicLink());
    const name = prefix + f.name;
    if (f.isDirectory()) Object.assign(result, await files(join(dir, f.name), name + "/"));
    else { const bytes = await readFile(join(dir, f.name)); result[name] = { bytes: bytes.length, sha256: hash(bytes) }; }
  }
  return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
}
try {
  await mkdir(join(root, "private"), { recursive: true });
  await mkdir(join(root, "review"), { recursive: true });
  const tables = (await database().query("SELECT table_name FROM information_schema.tables WHERE table_schema='ppo' AND table_type='BASE TABLE' ORDER BY table_name")).rows;
  const rows: Record<string, Record<string, unknown>[]> = {};
  for (const { table_name: name } of tables) {
    assert.match(name, /^[a-z_]+$/);
    rows[name] = (await database().query(`SELECT to_jsonb(t) row FROM ppo."${name}" t ORDER BY to_jsonb(t)::text`)).rows.map(r => r.row);
    if (name === "audit_events") rows[name] = rows[name].filter(r => r.object_type !== "Session");
    if (name === "sessions") delete rows[name];
  }
  const ledger = (await database().query("SELECT version,sha256,applied_at FROM public.ppo_migrations ORDER BY version")).rows;
  const processIdentity = (await database().query("SELECT pg_postmaster_start_time() started, system_identifier::text system FROM pg_control_system()")).rows[0];
  const snapshot = { rows, ledger, files: await files(documents), processIdentity };
  const changes: { table: string; prior: number; current: number; changed_or_removed: number; added: number }[] = [];
  let comparedFiles = 0;
  if (compareTo && compareTo !== "-") {
    const before: typeof snapshot = JSON.parse(await readFile(join(root, "private", `${compareTo}-snapshot.json`), "utf8"));
    assert.equal(snapshot.processIdentity.system, before.processIdentity.system, "Same retained cluster; no restore");
    for (const [name, prior] of Object.entries(before.rows)) {
      const current = rows[name];
      assert(current, `Existing table ${name} remains installed`);
      const oldHashes = new Set(prior.map(digest)), newHashes = new Set(current.map(digest));
      const removed = [...oldHashes].filter(h => !newHashes.has(h)).length;
      const added = [...newHashes].filter(h => !oldHashes.has(h)).length;
      if (removed || added) changes.push({ table: name, prior: prior.length, current: current.length, changed_or_removed: removed, added });
      if (mode === "exact") assert.deepEqual(current, prior, `${name}: exact lifecycle preservation`);
      if (mode === "upgrade") assert.equal(removed, 0, `${name}: existing rows unchanged during upgrade`);
      if (mode === "publication" && name !== "scheduling_policy_heads") assert.equal(removed, 0, `${name}: publication cannot replace existing evidence`);
      if (mode === "originals" && (name === "operation_receipts" || name === "sync_acceptances" || name === "customer_responses" || name.startsWith("finance_") || name.startsWith("report_") || name === "service_reports" || name === "field_entries" || name === "field_attendances"))
        assert.equal(removed, 0, `${name}: original durable outcomes remain unchanged`);
    }
    for (const [name, old] of Object.entries(before.files)) {
      assert.deepEqual(snapshot.files[name], old, `Exact existing file ${name}`); comparedFiles++;
    }
    assert.deepEqual(snapshot.ledger.slice(0, before.ledger.length), before.ledger, "Installed ledger rows and bytes retained");
    if (mode === "upgrade") assert.deepEqual(snapshot.ledger.slice(before.ledger.length).map(r => r.version), [53, 54]);
    else assert.deepEqual(snapshot.ledger, before.ledger);
  }
  await writeFile(join(root, "private", `${phase}-snapshot.json`), JSON.stringify(snapshot));
  const review = {
    phase, compareTo, mode, at: new Date().toISOString(),
    harness: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    database: "ppo_synthetic_test", schema: ledger.at(-1).version,
    ledger, process_started: processIdentity.started, same_cluster_checked: !!compareTo,
    tables: Object.fromEntries(Object.entries(rows).map(([name, r]) => [name, { count: r.length, sha256: digest(r) }])),
    files: snapshot.files, compared_files: comparedFiles, changes,
  };
  await writeFile(join(root, "review", `${phase}-preservation.json`), JSON.stringify(review, null, 2));
  console.log(`${phase}: ${Object.keys(rows).length} tables, ${Object.keys(snapshot.files).length} files; ${compareTo ?? "initial"} / ${mode} passed.`);
} finally { await closeDatabase(); }
