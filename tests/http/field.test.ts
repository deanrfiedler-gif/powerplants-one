import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prepareFieldAppointment } from "../helpers/field-http";
import {
  base,
  entry,
  materialPayload,
  startInput,
  png,
  draft,
} from "../helpers/field";
import { digest } from "../../src/documents/store";
const origin = "http://127.0.0.1:3000";
async function session(profile: string) {
  const r = await fetch(origin + "/api/v1/local-session", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(cookie: string, path: string, body?: unknown) {
  const r = await fetch(origin + "/api/v1/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Cookie: cookie,
      ...(body === undefined
        ? {}
        : { Origin: origin, "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await r.json();
  return { status: r.status, body: result, headers: r.headers };
}
test("P07 real HTTP visit executes start, exact photo transfer, typed evidence, correction and a Partial completion draft", async () => {
  const co = await session("coordinator"),
    p = await session("assigned-technician"),
    m = await session("second-technician");
  const setup = await prepareFieldAppointment(async (path, body) => {
    const r = await call(co, path, body);
    assert.ok(r.status < 300, JSON.stringify(r));
    return r.body;
  }, "2026-12-01");
  let job = (await call(p, `my-jobs/${setup.appointment_id}`)).body.items[0];
  const pack = setup.pack;
  for (const cookie of [p, m]) {
    const actor = (await call(cookie, "local-session")).body;
    const recipient = pack.readiness.recipients.find(
      (r: { user_id: string }) => r.user_id === actor.actor_id,
    );
    assert.equal(
      (
        await call(cookie, `pack-issues/${pack.current_issue_id}/acknowledge`, {
          ...base(),
          assignment_id: recipient.assignment_id,
          assignment_version: recipient.assignment_version,
          presented_hash: pack.issues[0].output_hash,
          captured_at: new Date().toISOString(),
        })
      ).status,
      201,
    );
  }
  job = (await call(p, `my-jobs/${job.id}`)).body.items[0];
  const start = startInput(job),
    accepted = await call(p, `appointments/${job.id}/start`, start);
  assert.equal(accepted.status, 201, JSON.stringify(accepted));
  assert.deepEqual(
    (await call(p, `appointments/${job.id}/start`, start)).body,
    accepted.body,
  );
  assert.equal(
    (
      await call(p, `appointments/${job.id}/start`, {
        ...start,
        reason: "changed",
      })
    ).status,
    409,
  );
  job = (await call(p, `my-jobs/${job.id}`)).body.items[0];
  const bytes = png(),
    id = randomUUID();
  assert.equal(
    (
      await call(p, "attachments/initiate", {
        ...base(),
        id,
        appointment_id: job.id,
        attendance_id: job.attendance.id,
        filename: "SYN-http.png",
        media_type: "image/png",
        byte_count: bytes.length,
        sha256: digest(bytes),
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await call(p, `attachments/${id}/upload`, {
        ...base(),
        expected_version: 1,
        content_base64: bytes.toString("base64"),
      })
    ).body.state,
    "Uploaded",
  );
  assert.equal(
    (
      await call(p, `attachments/${id}/finalise`, {
        ...base(),
        expected_version: 2,
      })
    ).body.state,
    "Available",
  );
  const file = await fetch(origin + `/api/v1/attachments/${id}/bytes`, {
    headers: { Cookie: p },
  });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("cache-control"), "private, no-store");
  assert.equal(digest(Buffer.from(await file.arrayBuffer())), digest(bytes));
  const cmd = entry(job, "Material", materialPayload());
  assert.equal((await call(p, "field-entries", cmd)).status, 201);
  assert.equal(
    (
      await call(p, `field-entries/${cmd.id}/correct`, {
        ...cmd,
        ...base(),
        id: randomUUID(),
        expected_version: 1,
        payload: { ...materialPayload(), quantity: "1" },
        reason: "SYN actual HTTP correction",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await call(
        p,
        "field-entries",
        entry(job, "Photo", {
          attachment_id: id,
          caption: "SYN original HTTP inspection view",
        }),
      )
    ).status,
    201,
  );
  job = (await call(p, `my-jobs/${job.id}`)).body.items[0];
  assert.equal(
    job.entries.filter((x: { superseded: boolean }) => x.superseded).length,
    1,
  );
  assert.equal(
    (await call(p, `appointments/${job.id}/completion-draft`, draft(job))).body
      .state,
    "Draft",
  );
  assert.equal(
    (await call(p, `my-jobs/${job.id}`)).body.items[0].status,
    "InProgress",
  );
  assert.equal(
    (await call(p, `my-jobs/${job.id}?actor_id=${randomUUID()}`)).status,
    422,
  );
  assert.equal(
    (await call(m, `operations/${accepted.body.operation_id}`)).status,
    404,
  );
  assert.equal((await call(co, `attachments/${id}`)).status, 403);
  assert.equal(
    (await call(p, "field-entries", { ...entry(job), actor_id: randomUUID() }))
      .status,
    422,
  );
  assert.doesNotMatch(
    JSON.stringify(job),
    /pending_account_plan|CONFIDENTIAL-MARGIN|PRIVATE_FINANCE/,
  );
});
test("P07 persisted start, capture, correction, attachment and draft survive PostgreSQL restart through actual HTTP reads", async () => {
  const proof = JSON.parse(await readFile("/tmp/ppo-p07-restart.json", "utf8")),
    p = await session("assigned-technician");
  const r = await call(p, `my-jobs/${proof.appointment_id}`);
  assert.equal(r.status, 200);
  const job = r.body.items[0];
  assert.equal(job.attendance.authority_hash, proof.authority_hash);
  assert.equal(job.draft.id, proof.draft_id);
  assert.ok(
    job.entries.some((e: { id: string }) => e.id === proof.corrected_entry_id),
  );
  const file = await fetch(
    origin + `/api/v1/attachments/${proof.attachment_id}/bytes`,
    { headers: { Cookie: p } },
  );
  assert.equal(file.status, 200);
  assert.equal(digest(Buffer.from(await file.arrayBuffer())), proof.photo_hash);
  assert.deepEqual(
    (await call(p, `operations/${proof.operation_id}`)).body,
    proof.receipt,
  );
});
