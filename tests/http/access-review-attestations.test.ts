import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

const origin = `http://127.0.0.1:${process.env.PPO_PORT ?? "3000"}`;
async function session(profile: string) {
  const r = await fetch(`${origin}/api/v1/local-session`, {
    method: "POST",
    headers: { origin, "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  assert.equal(r.status, 200);
  return r.headers.get("set-cookie")!.split(";")[0];
}
async function call(
  cookie: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const r = await fetch(`${origin}/api/v1/admin/access/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      cookie,
      origin,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(r.headers.get("cache-control"), "private, no-store");
  return { status: r.status, body: await r.json() };
}
test("AD01 review HTTP: exact basis, independent command and original receipt envelopes", async (t) => {
  const actor = await session("systems"),
    reader = await session("scheduling-policy-reviewer"),
    subject = "30000000-0000-4000-8000-000000000005";
  // Resolve the configured synthetic profile rather than relying on its display name.
  const people = await call(actor, "teams/context");
  assert.equal(people.status, 200);
  const member = people.body.people.find(
    (p: { id: string }) => p.id === subject,
  );
  assert(member);
  const team = randomUUID();
  const made = await call(actor, "teams", {
    schema_version: 1,
    operation_id: randomUUID(),
    team_id: team,
    expected_version: 0,
    name: "SYN HTTP review roster",
    purpose: "One explicitly selected member for HTTP proof.",
    reason: "Record an independent review command fixture.",
    lead_id: people.body.actor.actor_id,
    member_ids: [member.id],
  });
  assert.equal(made.status, 201);
  const person = await call(reader, member.id);
  assert.equal(person.status, 200);
  const grant =
    person.body.grants.find((g: { state: string }) => g.state === "Current") ??
    person.body.grants[0];
  assert(grant);
  const basisPath = `reviews/basis?team_id=${team}&grant_id=${grant.id}`;
  const basis = await call(reader, basisPath);
  assert.equal(basis.status, 200);
  const cmd = {
    schema_version: 1,
    operation_id: randomUUID(),
    attestation_id: randomUUID(),
    expected_version: 0,
    team_id: team,
    grant_id: grant.id,
    basis_hash: basis.body.basis_hash,
    decision: "Keep",
    reason: "SYN HTTP independent inspection of this current grant row.",
  };
  let receipt: Record<string, unknown>;
  await t.test(
    "reader can inspect basis but cannot attest; unauthenticated request is refused",
    async () => {
      assert.equal((await call(reader, "reviews", cmd)).status, 403);
      assert.equal((await call("", basisPath)).status, 401);
    },
  );
  await t.test("origin and payload guards precede writes", async () => {
    assert.equal(
      (await call(actor, "reviews", cmd, { origin: "https://invalid.example" }))
        .body.code,
      "OriginRejected",
    );
    assert.equal(
      (await call(actor, "reviews", { ...cmd, decision: "Revoke" })).status,
      422,
    );
    assert.equal(
      (await call(actor, "reviews", { ...cmd, basis_hash: "0".repeat(64) }))
        .body.code,
      "ReviewBasisChanged",
    );
  });
  await t.test(
    "accepted command, unchanged replay and lost-response recovery return one exact receipt",
    async () => {
      const first = await call(actor, "reviews", cmd);
      assert.equal(first.status, 201);
      receipt = first.body;
      const replay = await call(actor, "reviews", cmd);
      assert.equal(replay.status, 200);
      assert.deepEqual(replay.body, receipt);
      const recovered = await call(
        actor,
        `reviews/operations/${cmd.operation_id}`,
      );
      assert.equal(recovered.status, 200);
      assert.deepEqual(recovered.body, receipt);
      assert.equal(
        (
          await call(actor, "reviews", {
            ...cmd,
            reason: "SYN changed original command content",
          })
        ).status,
        409,
      );
    },
  );
  await t.test(
    "read-only history/filter handover retains exact team, subject, basis and audit linkage",
    async () => {
      const detail = await call(reader, `reviews/${cmd.attestation_id}`);
      assert.equal(detail.status, 200);
      assert.equal(detail.body.team_id, team);
      assert.equal(detail.body.subject_id, member.id);
      assert.equal(detail.body.decision, "Keep");
      assert.equal(detail.body.operation_id, cmd.operation_id);
      assert.match(detail.body.audit_id, /^[a-f0-9-]{36}$/);
      assert.deepEqual(detail.body.basis_snapshot, basis.body.snapshot);
      const list = await call(
        reader,
        `reviews?team_id=${team}&subject_id=${member.id}`,
      );
      assert.equal(list.status, 200);
      assert.deepEqual(
        list.body.items.map((r: { id: string }) => r.id),
        [cmd.attestation_id],
      );
      assert.equal(
        (await call(reader, `reviews/operations/${cmd.operation_id}`)).status,
        403,
      );
      assert.deepEqual(
        (await call(reader, member.id)).body.grants,
        person.body.grants,
      );
    },
  );
});
