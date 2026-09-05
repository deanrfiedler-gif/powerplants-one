import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
const origin = "http://127.0.0.1:3000";
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P06 HTTP proof",
});
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
    method: body ? "POST" : "GET",
    headers: {
      Cookie: cookie,
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  return {
    status: r.status,
    headers: r.headers,
    body: r.headers.get("content-type")?.includes("application/json")
      ? JSON.parse(text)
      : text,
  };
}
test("P06 HTTP narrow issue and file scope reject unauthorised identities, arbitrary fields and traversal consistently", async () => {
  const coordinator = await session("coordinator"),
    technician = await session("assigned-technician"),
    other = await session("other-workspace");
  assert.equal((await call(coordinator, "packs")).status, 200);
  assert.equal((await call(technician, "packs/" + randomUUID())).status, 404);
  for (const path of [
    "pack-issues/" + randomUUID() + "/manifest",
    "pack-issues/" + randomUUID() + "/pdf",
    "pack-issues/" + randomUUID() + "/html",
  ]) {
    assert.equal((await call(technician, path)).status, 404);
    assert.equal((await call(other, path)).status, 403);
  }
  const options = await call(
    coordinator,
    `appointments/${id("a8", 10)}/pack-options`,
  );
  assert.equal(options.status, 200);
  assert.doesNotMatch(
    JSON.stringify(options.body),
    /PRIVATE_FINANCE|CONFIDENTIAL-MARGIN/,
  );
  assert.equal(
    (
      await call(coordinator, "packs", {
        ...base(),
        id: randomUUID(),
        appointment_id: id("a8", 10),
        expected_appointment_version: options.body.appointment.version,
        actor_id: randomUUID(),
        content: {},
      })
    ).status,
    422,
  );
});
test("P06 real issued preview/download/manifest/job/receipt traversal uses current file and record scope", async () => {
  const coordinator = await session("coordinator"),
    technician = await session("assigned-technician"),
    other = await session("second-company");
  const packs = (await call(coordinator, "packs")).body.items;
  assert.ok(packs.length);
  const pack = (await call(coordinator, `packs/${packs[0].id}`)).body.items[0];
  const issue = pack.issues[0],
    job = pack.jobs[0];
  assert.ok(issue && job);
  for (const path of [
    `packs/${pack.id}`,
    `packs/${pack.id}/preview`,
    `pack-issues/${issue.id}`,
    `pack-issues/${issue.id}/manifest`,
    `pack-issues/${issue.id}/html`,
    `pack-issues/${issue.id}/pdf`,
    `render-jobs/${job.id}`,
    `render-jobs/${job.id}/html`,
    `render-jobs/${job.id}/pdf`,
  ]) {
    const response = await call(other, path);
    assert.equal(response.status, 404, path + JSON.stringify(response.body));
    assert.equal(response.body.code, "RecordUnavailable");
  }
  assert.equal(
    (await call(technician, `packs/${pack.id}/preview`)).status,
    404,
  );
  assert.equal(
    (await call(technician, `render-jobs/${job.id}/pdf`)).status,
    403,
  );
  const manifest = await call(technician, `pack-issues/${issue.id}/manifest`);
  assert.equal(manifest.status, 200);
  assert.doesNotMatch(
    JSON.stringify(manifest.body),
    /PRIVATE_FINANCE|CONFIDENTIAL-MARGIN|pending_account_plan/,
  );
  const html = await call(technician, `pack-issues/${issue.id}/html`);
  assert.equal(html.status, 200);
  assert.equal(html.headers.get("cache-control"), "private, no-store");
  assert.doesNotMatch(html.body, /PRIVATE_FINANCE|CONFIDENTIAL-MARGIN/);
  assert.equal(
    (
      await call(
        coordinator,
        `packs/${pack.id}/preview?revision_id=${randomUUID()}`,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await call(
        coordinator,
        `pack-issues/${issue.id}/manifest?actor_id=${randomUUID()}`,
      )
    ).status,
    422,
  );
  const { readFile } = await import("node:fs/promises");
  const proof = JSON.parse(await readFile("/tmp/ppo-p06-restart.json", "utf8"));
  assert.equal(
    (await call(other, `operations/${proof.operation_id}`)).status,
    404,
  );
});
