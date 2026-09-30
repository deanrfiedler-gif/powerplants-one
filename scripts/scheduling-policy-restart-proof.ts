// Caller owns the isolated database and compiled app and restarts both between phases.
// No reset or process termination is performed here. Private originals stay outside Git.
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { request } from "@playwright/test";
import { localConfig } from "../src/platform/config";
import { closeDatabase } from "../src/platform/database";
import {
  base,
  principal,
  reviewed,
  rows,
  snapshot,
  durableTables,
} from "../tests/helpers/policy-commands";
import { issued } from "../tests/helpers/packs";
import { png, startInput, entry } from "../tests/helpers/field";
import { operation, rehash } from "../tests/helpers/offline";
import { readFieldJob } from "../src/field/reads";
import {
  downloadContext,
  preserveRecovery,
  recoveryBytes,
} from "../src/offline/recovery";
import { readBundle } from "../src/documents/worker";

const config = localConfig();
assert.equal(config.database_name, "ppo_synthetic_test");
const phase = process.argv[2];
assert(["write", "verify"].includes(phase));
const root = process.env.PPO_POLICY_RESTART_DIRECTORY;
assert(
  root && !resolve(root).startsWith(resolve(process.cwd())),
  "Private proof directory outside this checkout required",
);
const pid = Number(process.env.PPO_RESTART_SERVER_PID);
assert(
  Number.isSafeInteger(pid) && pid > 0,
  "Verified task-owned compiled app PID required",
);
await mkdir(root, { recursive: true });
const api = await request.newContext({
  baseURL: config.origin,
  extraHTTPHeaders: { Origin: config.origin },
});
async function call(path: string, data?: unknown) {
  const response = await api.fetch(`/api/v1/${path}`, {
    method: data === undefined ? "GET" : "POST",
    data,
  });
  assert(response.ok(), await response.text());
  return response.json();
}
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const byteHash = (bytes: Buffer) =>
  createHash("sha256").update(bytes).digest("hex");
const tables = [
  ...durableTables,
  "appointment_revisions",
  "resource_reservations",
  "sync_acceptances",
  "offline_recovery_dispositions",
  "offline_recovery_grants",
];
async function fingerprints() {
  const saved = await snapshot(tables);
  // New local logins are audited during recovery. All business audit and receipt
  // records remain exact; session lifecycle writes are outside this snapshot.
  saved.audit_events = saved.audit_events.filter((e: {object_type: string}) => e.object_type !== "Session");
  return Object.fromEntries(Object.entries(saved).map(([k,v]) => [k,hash(v)]));
}

const postmaster = async () =>
  (await rows("SELECT pg_postmaster_start_time() at"))[0].at.toISOString();
try {
  if (phase === "write") {
    const pack = await issued(),
      tech = await principal("assigned-technician");
    let accepted;
    for (const profile of ["assigned-technician", "second-technician"]) {
      const p = await principal(profile),
        j = (await readFieldJob(p, pack.pack.appointment_id)).items[0];
      const original = operation(
        p,
        j,
        "Acknowledge",
        {
          ...base(),
          assignment_id: j.assignment.id,
          assignment_version: j.assignment_version,
          presented_hash: j.pack!.output_hash,
          captured_at: new Date().toISOString(),
        },
        [],
        pack.issue_id,
      );
      await call("local-session", { profile });
      const result = await call("sync/operations", { operations: [original] });
      assert.equal(result.outcomes[0].state, "ServerSaved");
      if (profile === "assigned-technician")
        accepted = { original, receipt: result.outcomes[0].receipt };
    }
    assert(accepted);
    const job = (await readFieldJob(tech, pack.pack.appointment_id)).items[0];
    assert.equal(job.readiness.component_ready, true);
    const start = operation(tech, job, "Start", startInput(job));
    const context = await downloadContext(tech, job.id, {}),
      bytes = png();
    const capture = operation(
      tech,
      job,
      "Capture",
      {
        ...entry({ ...job, attendance: { id: randomUUID() } }),
        attendance_id: { operation_id: start.operation_id },
      },
      [start.operation_id],
    );
    const upload = operation(
      tech,
      job,
      "AttachmentUpload",
      {
        ...base(),
        expected_version: 1,
        sha256: byteHash(bytes),
        byte_count: bytes.length,
      },
      [],
      randomUUID(),
    );
    const factual = await preserveRecovery(tech, {
      grant_id: context.recovery.id,
      token: context.recovery.token,
      operation: capture,
    });
    const photo = await preserveRecovery(tech, {
      grant_id: context.recovery.id,
      token: context.recovery.token,
      operation: upload,
      content_base64: bytes.toString("base64"),
    });
    const f = await reviewed();
    await call("local-session", { profile: "scheduling-policy-publisher" });
    const publication = await call("schedule/policy-publications", f.publish);
    await call("local-session", { profile: "assigned-technician" });
    const refused = await call("sync/operations", { operations: [start] });
    assert.equal(refused.outcomes[0].state, "ReviewRequired");
    assert.equal(refused.outcomes[0].code, "StartBlocked");
    const manifest = (
      await rows("SELECT manifest FROM ppo.pack_issues WHERE id=$1", [
        pack.issue_id,
      ])
    )[0].manifest;
    const bundle = await readBundle(tech, manifest);
    await writeFile(
      join(root, "originals.json"),
      JSON.stringify(
        {
          pid,
          postmaster: await postmaster(),
          appointment: job.id,
          accepted,
          start,
          capture,
          upload,
          factual,
          photo,
          publication,
          publish: f.publish,
          manifest,
          html: hash(bundle.html),
          pdf: byteHash(bundle.pdf),
          png: byteHash(bytes),
          snapshots: await fingerprints(),
        },
        null,
        2,
      ),
    );
    console.log(
      "Scheduling restart write: exact accepted acknowledgement, held Start, factual recovery and PNG retained.",
    );
  } else {
    const raw = await readFile(join(root, "originals.json"), "utf8"),
      proof = JSON.parse(raw);
    assert.notEqual(
      pid,
      proof.pid,
      "Compiled app process must actually restart",
    );
    assert.notEqual(
      await postmaster(),
      proof.postmaster,
      "PostgreSQL must actually restart",
    );
    assert.deepEqual(await fingerprints(), proof.snapshots);
    await call("local-session", { profile: "assigned-technician" });
    const recovered = await call("sync/operations", {
      operations: [proof.accepted.original, proof.start],
    });
    assert.deepEqual(recovered.outcomes[0].receipt, proof.accepted.receipt);
    assert.equal(recovered.outcomes[1].state, "ReviewRequired");
    assert.equal(recovered.outcomes[1].code, "StartBlocked");
    const changed = rehash({
      ...proof.accepted.original,
      payload: {
        ...proof.accepted.original.payload,
        reason: "Altered original",
      },
    });
    assert.equal(
      (await call("sync/operations", { operations: [changed] })).outcomes[0]
        .state,
      "Conflict",
    );
    await call("local-session", { profile: "scheduling-policy-publisher" });
    assert.deepEqual(
      await call("schedule/policy-publications", proof.publish),
      proof.publication,
    );
    const owner = await principal(),
      bundle = await readBundle(owner, proof.manifest);
    assert.equal(hash(bundle.html), proof.html);
    assert.equal(byteHash(Buffer.from(bundle.html)), proof.manifest.html_hash);
    assert.equal(byteHash(bundle.pdf), proof.pdf);
    assert.equal(
      byteHash(await recoveryBytes(owner, proof.photo.case_id)),
      proof.png,
    );
    assert.deepEqual(await fingerprints(), proof.snapshots);
    assert.equal(await readFile(join(root, "originals.json"), "utf8"), raw);
    const result = {
      source_head: process.env.PPO_SOURCE_HEAD ?? null,
      app_pids: [proof.pid, pid],
      postgres_started: [proof.postmaster, await postmaster()],
      preserved_tables: tables.length,
      originals_sha256: byteHash(Buffer.from(raw)),
      html_sha256: proof.manifest.html_hash,
      pdf_sha256: proof.pdf,
      png_sha256: proof.png,
      accepted_operation: proof.accepted.original.operation_id,
      held_start: proof.start.operation_id,
      result:
        "Exact accepted recovery, delayed Start ReviewRequired, altered retry Conflict, publication replay and all snapshots/files unchanged",
    };
    await writeFile(
      join(root, "verified.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  }
} finally {
  await api.dispose();
  await closeDatabase();
}
