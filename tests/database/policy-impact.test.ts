import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { reset } from "../../scripts/database";
import { localConfig } from "../../src/platform/config";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { createSession } from "../../src/platform/identity";
import { readPolicyImpact } from "../../src/scheduling/policy-impact";
import { SCHEDULING_POLICY_ID } from "../../src/scheduling/validation";
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use ppo_synthetic_test only.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
before(reset);
after(closeDatabase);
const p = async (profile = "coordinator") =>
  (await createSession(profile)).principal;
const proposal = {
  policy_id: SCHEDULING_POLICY_ID,
  expected_version: "1",
  effective_from: "2031-09-21T00:00:00Z",
  max_visit_minutes: "60",
};
const id = (t: string, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
test("exact immutable source and changed duration identify permitted future bookings and owner", async () => {
  const actor = await p(),
    source = await readPolicyImpact(actor, {}),
    result = await readPolicyImpact(actor, proposal);
  assert.equal(source.scenario, null);
  assert.equal(source.policy.max_visit_minutes, 480);
  assert.match(source.policy.content_hash, /^[a-f0-9]{64}$/);
  assert.equal(result.policy.content_hash, source.policy.content_hash);
  assert.ok(result.compared > 0);
  const booking = result.items.find((a) => a.id === id("a8"));
  assert.ok(booking);
  assert.deepEqual(booking.reasons, ["DurationLimitExceeded"]);
  assert.equal(booking.service_owner_id, actor.actor_id);
  assert.ok(
    booking.work_order_version &&
      booking.schedule_version &&
      booking.assignment_version,
  );
  assert.ok(
    !result.items.some((a) => a.id === id("a8", 2)),
    "Unconfirmed proposal is excluded",
  );
  const repeat = await readPolicyImpact(actor, proposal);
  assert.deepEqual(repeat.items, result.items);
  assert.equal(repeat.scenario?.content_hash, result.scenario?.content_hash);
  const relaxed = await readPolicyImpact(actor, {
    ...proposal,
    max_visit_minutes: "1440",
  });
  assert.equal(relaxed.items.length, 0);
  assert.equal(relaxed.compared, result.compared);
  assert.notEqual(
    relaxed.scenario?.content_hash,
    result.scenario?.content_hash,
  );
});
test("effective boundary crossing flags review while ending exactly at the boundary does not", async () => {
  const actor = await p();
  const crossing = await readPolicyImpact(actor, {
    ...proposal,
    effective_from: "2031-09-22T01:00:00Z",
    max_visit_minutes: "480",
  });
  assert.deepEqual(crossing.items.find((a) => a.id === id("a8"))?.reasons, [
    "CrossesEffectiveDate",
  ]);
  const after = await readPolicyImpact(actor, {
    ...proposal,
    effective_from: "2031-09-22T02:00:00Z",
  });
  assert.ok(!after.items.some((a) => a.id === id("a8")));
});
test("current scope isolates company, site and workspace; systems has no publisher shortcut", async () => {
  const other = await readPolicyImpact(await p("second-company"), proposal);
  assert.ok(other.items.every((a) => a.site_id !== id("70")));
  const scoped = await readPolicyImpact(await p("site-observer"), proposal);
  assert.ok(scoped.items.every((a) => a.site_id === id("70")));
  await assert.rejects(readPolicyImpact(await p("systems"), proposal), {
    code: "Forbidden",
  });
  await assert.rejects(readPolicyImpact(await p("other-workspace"), proposal));
  await assert.rejects(
    readPolicyImpact(await p("second-company"), {
      ...proposal,
      site_id: id("70"),
    }),
    { code: "RecordUnavailable" },
  );
});
test("stale policy, partial proposals, operational edits and out-of-range times are refused", async () => {
  const actor = await p();
  await assert.rejects(
    readPolicyImpact(actor, { ...proposal, expected_version: "2" }),
    { code: "VersionConflict" },
  );
  for (const input of [
    { effective_from: proposal.effective_from },
    { ...proposal, max_visit_minutes: "0" },
    { ...proposal, max_visit_minutes: "1.5" },
    { ...proposal, max_visit_minutes: "1441" },
    { ...proposal, initial_contact_required: false },
    { ...proposal, publish: true },
    { ...proposal, effective_from: "2026-01-01T00:00:00Z" },
    { ...proposal, effective_from: "2032-01-02T00:00:00Z" },
  ])
    await assert.rejects(readPolicyImpact(actor, input), {
      code: "InvalidData",
    });
});
test("analysis leaves all persisted PPO records byte-identical, including source and receipt records", async () => {
  const actor = await p();
  const snapshot = async () => {
    const tables = (
      await database().query<{ tablename: string }>(
        "SELECT tablename FROM pg_tables WHERE schemaname='ppo' ORDER BY tablename",
      )
    ).rows;
    const values = [];
    for (const { tablename } of tables) {
      assert.match(tablename, /^[a-z_0-9]+$/);
      values.push(
        (
          await database().query(
            `SELECT '${tablename}' AS name,count(*)::int AS count,md5(COALESCE(string_agg(to_jsonb(t)::text,E'\\n' ORDER BY to_jsonb(t)::text),'')) AS hash FROM ppo.${tablename} t`,
          )
        ).rows[0],
      );
    }
    return values;
  };
  const original = await snapshot();
  assert.ok(original.find((r) => r.name === "appointments")?.count > 0);
  assert.ok(original.find((r) => r.name === "pack_sources")?.count > 0);
  await readPolicyImpact(actor, proposal);
  await readPolicyImpact(actor, { ...proposal, max_visit_minutes: "480" });
  assert.deepEqual(await snapshot(), original);
});
test("a revoked grant is enforced on refresh, not cached by the preview", async () => {
  const actor = await p();
  assert.ok((await readPolicyImpact(actor, proposal)).compared > 0);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE workspace_id=$1 AND user_id=$2 AND capability='schedule.read' AND valid_from<clock_timestamp()",
    [actor.workspace_id, actor.actor_id],
  );
  await assert.rejects(readPolicyImpact(actor, proposal), {
    code: "Forbidden",
  });
});

test("started work is excluded and an oversized result is refused without partial success", async () => {
  await reset();
  const actor = await p();
  const original = await readPolicyImpact(actor, proposal);
  assert.ok(original.items.some((a) => a.id === id("a8")));
  // Explicit synthetic markers challenge the read boundary; no work approval is inferred.
  await database().query(
    "UPDATE ppo.appointments SET version=version+1,actual_start_at=clock_timestamp() WHERE id=$1",
    [id("a8")],
  );
  assert.ok(
    !(await readPolicyImpact(actor, proposal)).items.some(
      (a) => a.id === id("a8"),
    ),
  );
  await reset();
  // Load fixtures retain real identity/crew/reservation constraints. They test read
  // volume, not booking-command/calendar approval or issued historical content.
  await transaction(async (c) => {
    await c.query("SET LOCAL statement_timeout='120s'");
    await c.query(
      "CREATE TEMP TABLE policy_load ON COMMIT DROP AS SELECT gen_random_uuid() AS appointment_id,n FROM generate_series(1,201) n",
    );
    await c.query(
      `INSERT INTO ppo.appointments
      SELECT (jsonb_populate_record(NULL::ppo.appointments,to_jsonb(a)||jsonb_build_object(
        'id',m.appointment_id,'display_number',NULL,
        'start_at','2031-11-01T00:00:00Z'::timestamptz+make_interval(hours=>m.n*3),
        'end_at','2031-11-01T02:00:00Z'::timestamptz+make_interval(hours=>m.n*3)))).*
      FROM ppo.appointments a CROSS JOIN policy_load m WHERE a.id=$1`,
      [id("a8")],
    );
    await c.query(
      `INSERT INTO ppo.assignments
      SELECT (jsonb_populate_record(NULL::ppo.assignments,to_jsonb(x)||jsonb_build_object(
        'id',gen_random_uuid(),'appointment_id',m.appointment_id))).*
      FROM ppo.assignments x CROSS JOIN policy_load m WHERE x.appointment_id=$1 AND x.active`,
      [id("a8")],
    );
    await c.query(`INSERT INTO ppo.resource_reservations(id,workspace_id,assignment_id,resource_id,start_at,end_at,active)
      SELECT gen_random_uuid(),x.workspace_id,x.id,x.resource_id,
        a.start_at-make_interval(mins=>x.travel_before_minutes),a.end_at+make_interval(mins=>x.travel_after_minutes),true
      FROM policy_load m JOIN ppo.appointments a ON a.id=m.appointment_id
      JOIN ppo.assignments x ON x.appointment_id=a.id AND x.active`);
  });
  await assert.rejects(readPolicyImpact(actor, proposal), {
    code: "InvalidData",
  });
  const other = await readPolicyImpact(await p("second-company"), proposal);
  assert.equal(
    other.compared,
    0,
    "Hidden company's volume does not cause an over-limit refusal",
  );
});
