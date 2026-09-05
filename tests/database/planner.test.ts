import assert from "node:assert/strict";
import { beforeEach, after, test } from "node:test";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  database,
  transaction,
  closeDatabase,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession } from "../../src/platform/identity";
import { reset, migrate, seed } from "../../scripts/database";
import {
  readAppointment,
  readSchedule,
  listResources,
  confirmAppointment,
  moveAppointment,
  cancelAppointment,
  recordContact,
  createChangeRequest,
  decideChangeRequest,
} from "../../src/scheduling/planner";
import {
  crewFields,
  SCHEDULING_POLICY_ID,
} from "../../src/scheduling/validation";
import { readOperation } from "../../src/shared/receipts";
import {
  assessWorkReadiness,
  readWorkOrder,
  saveWorkScope,
  proposeVisit,
} from "../../src/service/work-orders";
const id = (t: string | number, n = 1) =>
  `${t}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const workspace = id(10),
  company = id(20),
  site = id(70),
  owner = id(30),
  wo = id("a9"),
  scope = id("aa");
if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Use ppo_synthetic_test only.");
process.env.PPO_ALLOW_RESET = "dispose-synthetic";
process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
beforeEach(reset);
after(closeDatabase);
const p = async (name = "coordinator") => (await createSession(name)).principal;
const base = () => ({
  operation_id: randomUUID(),
  schema_version: 1,
  reason: "SYN P05 component challenge",
});
const rows = async (sql: string, values: unknown[] = []) =>
  (await database().query(sql, values)).rows;
const code = (value: string) => (e: unknown) =>
  (e as { code?: string }).code === value;
const appointment = async (n = 2) =>
  (await readAppointment(await p(), id("a8", n))).items[0];
const crew = (n = 5, second?: number) =>
  crewFields(
    [n, ...(second ? [second] : [])].map((r, i) => ({
      resource_id: id("a4", r),
      resource_version: 1,
      calendar_version: 1,
      crew_role: i ? "Technician" : "Lead",
      travel_before_minutes: 0,
      travel_after_minutes: 0,
      travel_reason:
        "SYN explicit zero allowance for same-site demonstration; not a real route.",
    })),
  );
async function cmd(n = 2, members = crew()) {
  const a = await appointment(n);
  return {
    ...base(),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version,
    policy_version_id: a.policy_version_id,
    scheduling_policy_id: SCHEDULING_POLICY_ID,
    scheduling_policy_version: 1,
    crew: members,
  };
}
const period = {
  from: "2026-09-20T14:00:00Z",
  to: "2026-09-27T14:00:00Z",
  timezone: "Australia/Brisbane",
};
const doc = () => ({
  title: "SYN planner control",
  content_text: "SYN exact reviewed preparation evidence.",
  source_reference: "SYN-PPO-P05-CONTROL",
  source_version: "1",
});
async function assess(
  n: number,
  outcome = "Pass",
  valid_until = "2027-01-01T00:00:00Z",
) {
  const a = await appointment(n);
  return assessWorkReadiness(await p(), wo, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: scope,
      scope_version: 1,
      appointment_id: a.id,
      criterion_code: "ToolPreparation",
      outcome,
      reason: "SYN current preparation assessment",
      evidence: doc(),
      source_as_at: "2026-09-05T00:00:00Z",
      valid_until,
    },
  });
}
async function contact(n: number, outcome = "Confirmed") {
  const a = await appointment(n);
  return recordContact(await p(), a.id, {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: id(60),
    channel: "Simulated",
    outcome,
    occurred_at: new Date().toISOString(),
    notes: "SYN manually recorded customer date outcome; no message sent.",
  });
}
async function snapshot(n: number) {
  return {
    a: await rows("SELECT * FROM ppo.appointments WHERE id=$1", [id("a8", n)]),
    assignments: await rows(
      "SELECT * FROM ppo.assignments WHERE appointment_id=$1 ORDER BY id",
      [id("a8", n)],
    ),
    reservations: await rows(
      "SELECT r.* FROM ppo.resource_reservations r JOIN ppo.assignments x ON x.id=r.assignment_id WHERE x.appointment_id=$1 ORDER BY r.id",
      [id("a8", n)],
    ),
  };
}
test("P05 additive upgrade preserves exact P04 proposal bytes, receipts, source hashes and revoked grants; repeat seed preserves edits", async () => {
  await database().query(
    await readFile("db/migrations/0001-recover.sql", "utf8"),
  );
  await database().query("DROP TABLE public.ppo_migrations");
  await migrate(4);
  await seed(4);
  const oldActor = await p(),
    oldOrder = (await readWorkOrder(oldActor, id(90, 2))).items[0],
    oldScope = oldOrder.scopes.find(
      (x) => x.id === oldOrder.authorised_scope_revision_id,
    )!;
  const originalOperation = {
    ...base(),
    id: randomUUID(),
    expected_version: oldOrder.version,
    scope_revision_id: oldScope.id,
    scope_version: oldScope.version,
    start_at: "2026-09-17T00:00:00Z",
    end_at: "2026-09-17T02:00:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  };
  await proposeVisit(oldActor, oldOrder.id, originalOperation);
  const originalEvidence: Record<string, unknown[]> = {};
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    originalEvidence[table] = await rows(
      `SELECT to_jsonb(t) evidence FROM ppo.${table} t WHERE operation_id=$1`,
      [originalOperation.operation_id],
    );
  const before = await rows(
      "SELECT id,to_jsonb(a) snapshot FROM ppo.appointments a ORDER BY id",
    ),
    orderBefore = await rows("SELECT * FROM ppo.work_orders ORDER BY id"),
    scopeBefore = await rows("SELECT * FROM ppo.scope_revisions ORDER BY id"),
    migrations = await rows(
      "SELECT * FROM public.ppo_migrations ORDER BY version",
    );
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='service.work_order.edit'",
    [owner],
  );
  await migrate();
  await seed();
  for (const table of ["audit_events", "operation_receipts", "outbox_jobs"])
    assert.deepEqual(
      await rows(
        `SELECT to_jsonb(t) evidence FROM ppo.${table} t WHERE operation_id=$1`,
        [originalOperation.operation_id],
      ),
      originalEvidence[table],
    );
  for (const a of before) {
    const original = (
      await rows(
        "SELECT snapshot FROM ppo.appointment_proposals WHERE appointment_id=$1",
        [a.id],
      )
    )[0].snapshot;
    assert.deepEqual(original, a.snapshot);
    assert.equal(
      (await rows("SELECT status FROM ppo.appointments WHERE id=$1", [a.id]))[0]
        .status,
      "Proposed",
    );
  }
  for (const r of orderBefore)
    assert.deepEqual(
      (await rows("SELECT * FROM ppo.work_orders WHERE id=$1", [r.id]))[0],
      r,
    );
  assert.deepEqual(
    await rows(
      "SELECT * FROM ppo.scope_revisions WHERE id::text LIKE '91000000-%' ORDER BY id",
    ),
    scopeBefore,
  );
  assert.deepEqual(
    await rows(
      "SELECT * FROM public.ppo_migrations WHERE version<=4 ORDER BY version",
    ),
    migrations,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.manage'",
        [owner],
      )
    )[0].n,
    0,
  );
  const all = await rows("SELECT * FROM ppo.appointments ORDER BY id");
  await migrate();
  await seed();
  assert.deepEqual(
    await rows("SELECT * FROM ppo.appointments ORDER BY id"),
    all,
  );
  assert.equal(
    (await rows("SELECT count(*)::int n FROM public.ppo_migrations"))[0].n,
    6,
  );
});
test("confirmation reserves full crew with exact evidence and immutable original receipt; changed operation and stale retry refused", async () => {
  const actor = await p(),
    input = await cmd(6, crew(1, 5)),
    before = await snapshot(6);
  const a = await confirmAppointment(actor, id("a8", 6), input),
    b = await confirmAppointment(actor, id("a8", 6), input);
  assert.deepEqual(a.receipt, b.receipt);
  assert.deepEqual(await readOperation(actor, input.operation_id), a.receipt);
  assert.equal(a.receipt.state, "Confirmed");
  const current = await appointment(6);
  assert.equal(current.dispatch_hold, true);
  assert.equal(current.assignments.filter((x) => x.active).length, 2);
  assert.equal(current.pack_requirement, "PreparationRequired");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.resource_reservations r JOIN ppo.assignments x ON x.id=r.assignment_id WHERE x.appointment_id=$1 AND r.active",
        [id("a8", 6)],
      )
    )[0].n,
    2,
  );
  assert.equal(
    (
      await rows(
        "SELECT booking_hash=encode(sha256(convert_to(booking_snapshot::text,'UTF8')),'hex') ok FROM ppo.appointments WHERE id=$1",
        [id("a8", 6)],
      )
    )[0].ok,
    true,
  );
  assert.equal(current.proposal.snapshot.status, "Proposed");
  assert.equal(before.a[0].id, current.id);
  await assert.rejects(
    confirmAppointment(actor, id("a8", 6), {
      ...input,
      reason: "Changed reuse",
    }),
    code("OperationConflict"),
  );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 6), { ...input, ...base() }),
    code("VersionConflict"),
  );
});
test("different appointments competing for full crews: exactly one wins and no losing partial reservations", async () => {
  const actor = await p(),
    a = await cmd(6, crew(1, 2)),
    b = await cmd(7, crew(1, 5));
  const results = await Promise.allSettled([
    confirmAppointment(actor, id("a8", 6), a),
    confirmAppointment(actor, id("a8", 7), b),
  ]);
  assert.equal(results.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    results.filter(
      (x) => x.status === "rejected" && x.reason.code === "ResourceConflict",
    ).length,
    1,
  );
  const counts = await rows(
    "SELECT a.id,a.status,count(x.id)::int n FROM ppo.appointments a LEFT JOIN ppo.assignments x ON x.appointment_id=a.id AND x.active WHERE a.id=ANY($1::uuid[]) GROUP BY a.id ORDER BY a.status",
    [[id("a8", 6), id("a8", 7)]],
  );
  assert.deepEqual(
    counts.map((x) => [x.status, x.n]),
    [
      ["Confirmed", 2],
      ["Proposed", 0],
    ],
  );
});
test("simultaneous same-appointment changes reject stale input; failed move leaves old complete reservations intact", async () => {
  const actor = await p(),
    input = await cmd(1, crew(1, 2)),
    before = await snapshot(1);
  await assert.rejects(
    moveAppointment(actor, id("a8", 1), {
      ...input,
      start_at: "2026-09-22T03:30:00Z",
      end_at: "2026-09-22T04:30:00Z",
      crew: crew(5),
    }),
    code("ResourceConflict"),
  );
  assert.deepEqual(await snapshot(1), before);
  const result = await Promise.allSettled([
    moveAppointment(actor, id("a8", 1), {
      ...input,
      start_at: "2026-09-22T00:00:00Z",
      end_at: "2026-09-22T02:00:00Z",
    }),
    moveAppointment(actor, id("a8", 1), {
      ...input,
      ...base(),
      start_at: "2026-09-23T00:00:00Z",
      end_at: "2026-09-23T02:00:00Z",
    }),
  ]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    result.filter(
      (x) => x.status === "rejected" && x.reason.code === "VersionConflict",
    ).length,
    1,
  );
  const a = await appointment(1);
  assert.equal(a.customer_commitment, "Changed");
  assert.equal(a.pack_requirement, "ReviewRequired");
  assert.equal(a.dispatch_hold, true);
  assert.equal(a.followups.length, 2);
  await moveAppointment(actor, a.id, {
    ...(await cmd(1, crew(1, 5))),
    start_at: "2026-09-24T04:00:00Z",
    end_at: "2026-09-24T05:00:00Z",
  });
  const reassigned = await appointment(1);
  assert.deepEqual(
    reassigned.assignments
      .filter((x) => x.active)
      .map((x) => x.resource_id)
      .sort(),
    [id("a4", 1), id("a4", 5)],
  );
  assert.equal(
    reassigned.assignments.find((x) => x.resource_id === id("a4", 2))!.active,
    false,
  );
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.resource_reservations r JOIN ppo.assignments x ON x.id=r.assignment_id WHERE x.appointment_id=$1 AND r.active",
        [a.id],
      )
    )[0].n,
    2,
  );
});
test("half-open adjacency permits exact buffered boundary and refuses overlapping travel", async () => {
  const actor = await p();
  // Original ends 02:00 UTC with 30 minutes after; exact adjacent reservation starts 02:30.
  const w = (await readWorkOrder(actor, wo)).items[0];
  const aid = randomUUID();
  await proposeVisit(actor, wo, {
    ...base(),
    id: aid,
    expected_version: w.version,
    scope_revision_id: scope,
    scope_version: 1,
    start_at: "2026-09-21T02:30:00Z",
    end_at: "2026-09-21T03:30:00Z",
    customer_commitment: "Proposed",
    preparation_status: "Preparing",
  });
  let a = (await readAppointment(actor, aid)).items[0];
  await assessWorkReadiness(actor, wo, {
    ...base(),
    expected_version: a.work_order_version,
    assessment: {
      scope_revision_id: scope,
      scope_version: 1,
      appointment_id: aid,
      criterion_code: "ToolPreparation",
      outcome: "Pass",
      reason: "SYN adjacent preparation",
      evidence: doc(),
      source_as_at: "2026-09-05T00:00:00Z",
    },
  });
  await recordContact(actor, aid, {
    ...base(),
    id: randomUUID(),
    expected_version: a.version,
    recipient_id: id(60),
    channel: "Simulated",
    outcome: "Confirmed",
    occurred_at: new Date().toISOString(),
    notes: "SYN adjacent window explicitly agreed.",
  });
  a = (await readAppointment(actor, aid)).items[0];
  const input = {
    ...(await cmd()),
    expected_version: a.version,
    expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version,
    crew: crew(1),
  };
  await assert.rejects(
    confirmAppointment(actor, aid, {
      ...input,
      crew: [{ ...crew(1)[0], travel_before_minutes: 1 }],
    }),
    code("ResourceConflict"),
  );
  assert.equal(
    (await confirmAppointment(actor, aid, { ...input, ...base() })).receipt
      .state,
    "Confirmed",
  );
});
test("calendar, leave, closed exception, skill expiry, active eligibility and explicit travel are mandatory", async () => {
  const actor = await p();
  for (const [members, expected] of [
    [crew(3), "SkillOrTravelInvalid"],
    [crew(4), "ResourceConflict"],
    [crew(8), "SkillOrTravelInvalid"],
  ] as const)
    await assert.rejects(
      confirmAppointment(actor, id("a8", 2), await cmd(2, members)),
      code(expected),
    );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 2), {
      ...(await cmd()),
      crew: [{ ...crew()[0], travel_before_minutes: 200 }],
    }),
    code("SkillOrTravelInvalid"),
  );
  for (const [start_at, end_at] of [
    ["2026-09-26T00:00:00Z", "2026-09-26T02:00:00Z"],
    ["2026-09-30T00:00:00Z", "2026-09-30T02:00:00Z"],
  ])
    await assert.rejects(
      moveAppointment(actor, id("a8", 1), {
        ...(await cmd(1, crew(1, 2))),
        start_at,
        end_at,
      }),
    );
  const missing = { ...crew()[0] } as Record<string, unknown>;
  delete missing.travel_before_minutes;
  await assert.rejects(
    confirmAppointment(actor, id("a8", 2), {
      ...(await cmd()),
      crew: [missing],
    }),
    code("InvalidData"),
  );
  assert.throws(
    () => crewFields([{ ...crew()[0], travel_after_minutes: -1 }]),
    code("InvalidData"),
  );
});
test("missing contact and failed/no-response attempts never imply commitment; manual exact agreement permits booking", async () => {
  const actor = await p();
  await assert.rejects(
    confirmAppointment(actor, id("a8", 3), await cmd(3)),
    code("CustomerContactRequired"),
  );
  for (const outcome of ["Attempted", "NoResponse", "Failed"]) {
    await contact(3, outcome);
    const a = await appointment(3);
    assert.equal(a.customer_commitment, "Proposed");
    assert.equal(a.status, "Proposed");
    await assert.rejects(
      confirmAppointment(actor, a.id, await cmd(3)),
      code("CustomerContactRequired"),
    );
  }
  await contact(3);
  assert.equal(
    (await confirmAppointment(actor, id("a8", 3), await cmd(3))).receipt.state,
    "Confirmed",
  );
  assert.equal((await appointment(3)).followups.length, 4);
});
test("wrong site/company, narrow fields, scope and policy versions, urgent priority, mandatory versus permitted preparation", async () => {
  const actor = await p();
  for (const n of [6, 7])
    await assert.rejects(
      confirmAppointment(actor, id("a8", 2), await cmd(2, crew(n))),
      code("RecordUnavailable"),
    );
  for (const extra of [
    { actor_id: owner },
    { workspace_id: workspace },
    { exception_allowed: true },
    { status: "Confirmed" },
  ])
    await assert.rejects(
      confirmAppointment(actor, id("a8", 2), { ...(await cmd()), ...extra }),
      code("InvalidData"),
    );
  for (const extra of [
    { scope_version: 2 },
    { scheduling_policy_version: 2 },
    { expected_assignment_version: 2 },
  ])
    await assert.rejects(
      confirmAppointment(actor, id("a8", 2), { ...(await cmd()), ...extra }),
      code("VersionConflict"),
    );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 2), {
      ...(await cmd()),
      policy_version_id: randomUUID(),
    }),
    code("ScopeReviewRequired"),
  );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 4), await cmd(4)),
    code("BookingBlocked"),
  );
  await assess(4, "Blocked");
  await assert.rejects(
    confirmAppointment(actor, id("a8", 4), await cmd(4)),
    code("BookingBlocked"),
  );
  await assess(4, "PermittedException");
  assert.equal(
    (await confirmAppointment(actor, id("a8", 4), await cmd(4))).receipt.state,
    "Confirmed",
  );
  // Every linked request is already Urgent; priority never cleared the missing preparation gate.
  await assess(5, "Pass", "2026-09-20T00:00:00Z");
  await assert.rejects(
    confirmAppointment(actor, id("a8", 5), await cmd(5)),
    code("BookingBlocked"),
  );
});
test("successor scope does not transfer authority and existing booking exposes review hold", async () => {
  const actor = await p(),
    w = (await readWorkOrder(actor, wo)).items[0],
    r = w.scopes[0];
  await saveWorkScope(
    actor,
    wo,
    {
      ...base(),
      expected_version: w.version,
      change_reason: "SYN extra request must not inherit booking authority",
      scope: {
        summary: "SYN successor",
        exclusions: "No intervention",
        diagnostic_limit: null,
        pending_account_plan: "Finance review",
        authority_evidence: doc(),
        coverage: {
          status: "Covered",
          agreement_reference: null,
          source_version: null,
          effective_from: null,
          effective_to: null,
          assessment: "SYN",
          reason: "SYN",
          charging_route: "FinanceReview",
        },
        items: r.items.map((i: Record<string, unknown>) => ({
          task_kind: i.task_kind,
          task_description: i.task_description,
          expected_outcome: i.expected_outcome,
          completion_requirements: i.completion_requirements,
          required_skill_codes: i.required_skill_codes,
          shutdown_condition: null,
          access_condition: null,
          assets: [
            {
              asset_id: id(80),
              configuration_id: null,
              identification_plan: null,
            },
          ],
        })),
      },
    },
    true,
  );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 2), await cmd()),
    code("ScopeReviewRequired"),
  );
  assert.equal((await appointment(1)).scope_review_required, true);
});
test("current site source changes and immutable customer windows block booking without reservation loss", async () => {
  const actor = await p(),
    before = await snapshot(1);
  await confirmAppointment(actor, id("a8", 10), await cmd(10, crew(1, 2)));
  const windowBooking = await snapshot(10);
  await assert.rejects(
    moveAppointment(actor, id("a8", 10), {
      ...(await cmd(10, crew(1, 2))),
      start_at: "2026-09-25T00:00:00Z",
      end_at: "2026-09-25T02:00:00Z",
    }),
    code("BookingBlocked"),
  );
  assert.deepEqual(await snapshot(10), windowBooking);
  assert.deepEqual(await snapshot(1), before);
  await database().query(
    "UPDATE ppo.sites SET version=version+1,updated_at=clock_timestamp() WHERE id=$1",
    [site],
  );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 2), await cmd()),
    code("ScopeReviewRequired"),
  );
  assert.deepEqual(await snapshot(1), before);
});
test("project/manual requests reserve nothing; accept/reject/cancel are versioned and accepted moves keep contact/pack hold", async () => {
  const actor = await p(),
    before = await snapshot(1),
    requestId = randomUUID(),
    a = await appointment(1);
  const input = {
    ...base(),
    id: requestId,
    expected_version: a.version,
    source_type: "ProjectReference",
    source_reference: "SYN-PPO-PROJECT-PLANNER",
    source_version: "1",
    start_at: "2026-09-23T00:00:00Z",
    end_at: "2026-09-23T02:00:00Z",
    crew: crew(1, 2),
  };
  const receipt = await createChangeRequest(actor, a.id, input);
  assert.equal(receipt.receipt.state, "Pending");
  assert.deepEqual(await snapshot(1), before);
  assert.deepEqual(
    (await createChangeRequest(actor, a.id, input)).receipt,
    receipt.receipt,
  );
  await assert.rejects(
    database().query(
      "INSERT INTO ppo.schedule_request_crew SELECT workspace_id,request_id,$2,1,1,'Specialist',0,0,'SYN forged addition' FROM ppo.schedule_request_crew WHERE request_id=$1 LIMIT 1",
      [requestId, id("a4", 5)],
    ),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.schedule_change_requests SET crew_snapshot='[]' WHERE id=$1",
      [requestId],
    ),
  );
  const { crew: _crew, ...versions } = await cmd(1);
  void _crew;
  const accepted = await decideChangeRequest(
    actor,
    requestId,
    { ...versions, expected_request_version: 1 },
    "accept",
  );
  assert.equal(accepted.receipt.state, "Accepted");
  assert.equal((await appointment(1)).pack_requirement, "ReviewRequired");
  assert.equal(
    (
      await rows(
        "SELECT count(*)::int n FROM ppo.outbox_jobs WHERE operation_id=$1 AND kind='AppointmentChanged'",
        [versions.operation_id],
      )
    )[0].n,
    1,
  );
  for (const action of ["reject", "cancel"] as const) {
    const current = await appointment(1),
      rid = randomUUID();
    await createChangeRequest(actor, a.id, {
      ...input,
      ...base(),
      id: rid,
      expected_version: current.version,
    });
    const decision = {
      ...base(),
      expected_version: current.version,
      expected_request_version: 1,
    };
    const result = await decideChangeRequest(actor, rid, decision, action);
    assert.equal(
      result.receipt.state,
      action === "reject" ? "Rejected" : "Cancelled",
    );
    assert.deepEqual(
      (await decideChangeRequest(actor, rid, decision, action)).receipt,
      result.receipt,
    );
  }
});
test("technician source requires its active assignment and never confers booking/Systems authority", async () => {
  const tech = await p("assigned-technician"),
    a = await appointment(1),
    input = {
      ...base(),
      id: randomUUID(),
      expected_version: a.version,
      source_type: "TechnicianRequest",
      source_reference: "SYN technician review",
      source_version: "1",
      start_at: "2026-09-23T00:00:00Z",
      end_at: "2026-09-23T02:00:00Z",
      crew: crew(1, 2),
    };
  assert.equal(
    (await createChangeRequest(tech, a.id, input)).receipt.state,
    "Pending",
  );
  await assert.rejects(
    createChangeRequest(tech, a.id, {
      ...input,
      ...base(),
      id: randomUUID(),
      source_type: "ProjectReference",
    }),
    code("Forbidden"),
  );
  await assert.rejects(
    confirmAppointment(tech, id("a8", 2), await cmd()),
    code("Forbidden"),
  );
  await assert.rejects(
    decideChangeRequest(
      tech,
      input.id,
      { ...base(), expected_version: a.version, expected_request_version: 1 },
      "reject",
    ),
    code("Forbidden"),
  );
  for (const name of ["technician", "systems"]) {
    await assert.rejects(
      readSchedule(await p(name), period),
      code("Forbidden"),
    );
    await assert.rejects(
      moveAppointment(await p(name), a.id, {
        ...(await cmd(1)),
        start_at: input.start_at,
        end_at: input.end_at,
      }),
      code("Forbidden"),
    );
  }
  await assert.rejects(
    createChangeRequest(tech, id("a8", 6), {
      ...input,
      ...base(),
      id: randomUUID(),
      expected_version: (await appointment(6)).version,
    }),
    code("RecordUnavailable"),
  );
});
test("read/filter/selector/receipt traversal applies current capability and record scope with same 404 semantics", async () => {
  const other = await p("second-company");
  assert.equal((await readSchedule(other, period)).items.length, 0);
  for (const path of [id("a8", 1), randomUUID()])
    await assert.rejects(
      readAppointment(other, path),
      code("RecordUnavailable"),
    );
  for (const query of [
    { ...period, site_id: site },
    { ...period, resource_id: id("a4", 1) },
  ])
    await assert.rejects(readSchedule(other, query), code("RecordUnavailable"));
  await assert.rejects(
    listResources(other, { site_id: site }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    listResources(other, { resource_id: id("a4", 1) }),
    code("RecordUnavailable"),
  );
  await assert.rejects(
    readSchedule(await p(), { ...period, actor_id: owner }),
    code("InvalidData"),
  );
  await assert.rejects(
    readSchedule(await p(), { ...period, to: "2026-10-10T00:00:00Z" }),
    code("BookingBlocked"),
  );
  const actor = await p(),
    input = await cmd(6);
  await confirmAppointment(actor, id("a8", 6), input);
  await database().query(
    "DELETE FROM ppo.permission_grants WHERE user_id=$1 AND capability='schedule.manage'",
    [owner],
  );
  await assert.rejects(
    readOperation(actor, input.operation_id),
    code("Forbidden"),
  );
  await assert.rejects(
    confirmAppointment(actor, id("a8", 6), input),
    code("Forbidden"),
  );
  const dto = JSON.stringify(
    await readSchedule(await p("site-observer"), period),
  );
  assert.ok(!dto.includes(id("a4", 6)));
  assert.ok(!dto.includes("erp_company_id"));
  assert.ok(!dto.includes("erp_connection_id"));
});
test("cancellation releases once, preserves original evidence and receipt, records typed contact consequences and refuses actual work", async () => {
  const actor = await p(),
    a = await appointment(1),
    input = {
      ...base(),
      expected_version: a.version,
      expected_work_order_version: a.work_order_version,
      expected_assignment_version: a.assignment_version,
    };
  const accepted = await cancelAppointment(actor, a.id, input);
  assert.equal(accepted.receipt.state, "Cancelled");
  assert.deepEqual(
    (await cancelAppointment(actor, a.id, input)).receipt,
    accepted.receipt,
  );
  const cancelled = await appointment(1);
  assert.equal(cancelled.assignments.filter((x) => x.active).length, 0);
  assert.equal(cancelled.assignments.length, 2);
  assert.equal(cancelled.history.length, a.history.length + 1);
  assert.equal(cancelled.customer_commitment, "Changed");
  assert.equal(cancelled.followups.length, 2);
  await contact(1, "Confirmed");
  assert.equal((await appointment(1)).customer_commitment, "Changed");
  await confirmAppointment(actor, id("a8", 6), await cmd(6));
  await database().query(
    "UPDATE ppo.appointments SET actual_start_at=clock_timestamp(),version=version+1 WHERE id=$1",
    [id("a8", 6)],
  );
  const current = await appointment(6),
    before = await snapshot(6);
  await assert.rejects(
    cancelAppointment(actor, current.id, {
      ...base(),
      expected_version: current.version,
      expected_work_order_version: current.work_order_version,
      expected_assignment_version: current.assignment_version,
    }),
    code("ActualWorkRecorded"),
  );
  assert.deepEqual(await snapshot(6), before);
});
test("published calendar/resource/skill/availability roots and child mutation paths cannot silently invalidate existing bookings", async () => {
  const before = await snapshot(1);
  for (const sql of [
    "UPDATE ppo.resources SET active=false WHERE id=$1",
    "DELETE FROM ppo.resources WHERE id=$1",
    "UPDATE ppo.skill_evidence SET valid_to='2026-09-20' WHERE resource_id=$1",
    "DELETE FROM ppo.resource_sites WHERE resource_id=$1",
    "INSERT INTO ppo.availability_blocks(id,workspace_id,resource_id,version,start_at,end_at,kind,active,source_as_at,evidence) VALUES(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',$1,1,'2026-09-21','2026-09-22','Leave',true,'2026-09-05','SYN unsafe insertion')",
  ])
    await assert.rejects(database().query(sql, [id("a4", 1)]));
  for (const sql of [
    "UPDATE ppo.working_calendars SET timezone='UTC' WHERE id=$1",
    "DELETE FROM ppo.calendar_intervals WHERE calendar_id=$1",
    "INSERT INTO ppo.calendar_exceptions VALUES(gen_random_uuid(),'10000000-0000-4000-8000-000000000001',$1,'2026-09-21','2026-09-22','Closed','SYN insertion')",
  ])
    await assert.rejects(database().query(sql, [id("a1")]));
  await assert.rejects(
    database().query(
      "UPDATE ppo.availability_blocks SET active=false WHERE resource_id=$1",
      [id("a4", 4)],
    ),
  );
  await assert.rejects(
    database().query(
      "UPDATE ppo.scheduling_policies SET evidence='changed' WHERE id=$1",
      [SCHEDULING_POLICY_ID],
    ),
  );
  assert.deepEqual(await snapshot(1), before);
});
test("injected appointment/assignment/reservation/history/activity/audit/receipt/outbox failures roll back confirmation and full replacement", async () => {
  const actor = await p();
  for (const table of [
    "appointments",
    "assignments",
    "resource_reservations",
    "appointment_revisions",
    "activities",
    "schedule_follow_ups",
    "audit_events",
    "operation_receipts",
    "outbox_jobs",
  ]) {
    for (const move of [false, true]) {
      const n = move ? 1 : 6,
        before = await snapshot(n),
        input = await cmd(n, crew(1, 2));
      await database().query(
        `CREATE FUNCTION ppo.inject_p05_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN P05 injected rollback'; END$$; CREATE TRIGGER inject_p05 BEFORE ${table === "appointments" ? "UPDATE" : "INSERT"} ON ppo.${table} FOR EACH ROW EXECUTE FUNCTION ppo.inject_p05_failure();`,
      );
      await assert.rejects(
        move
          ? moveAppointment(actor, id("a8", n), {
              ...input,
              start_at: "2026-09-23T00:00:00Z",
              end_at: "2026-09-23T02:00:00Z",
            })
          : confirmAppointment(actor, id("a8", n), input),
      );
      await database().query(
        `DROP TRIGGER inject_p05 ON ppo.${table};DROP FUNCTION ppo.inject_p05_failure();`,
      );
      assert.deepEqual(
        await snapshot(n),
        before,
        `${table} ${move ? "move" : "confirm"}`,
      );
      for (const t of ["audit_events", "operation_receipts", "outbox_jobs"])
        assert.equal(
          (
            await rows(
              `SELECT count(*)::int n FROM ppo.${t} WHERE operation_id=$1`,
              [input.operation_id],
            )
          )[0].n,
          0,
        );
    }
  }
});
test("contact, request acceptance and cancellation roll back owned consequences and original booking on late outbox failure", async () => {
  const actor = await p(),
    a = await appointment(1),
    rid = randomUUID();
  await createChangeRequest(actor, a.id, {
    ...base(),
    id: rid,
    expected_version: a.version,
    source_type: "Manual",
    source_reference: "SYN rollback",
    source_version: "1",
    start_at: "2026-09-23T00:00:00Z",
    end_at: "2026-09-23T02:00:00Z",
    crew: crew(1, 2),
  });
  const before = await snapshot(1),
    followups = await rows(
      "SELECT * FROM ppo.schedule_follow_ups ORDER BY activity_id",
    ),
    contacts = await rows("SELECT * FROM ppo.contact_outcomes ORDER BY id");
  await database().query(
    "CREATE FUNCTION ppo.inject_p05_failure() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN RAISE EXCEPTION 'SYN P05 late rollback'; END$$; CREATE TRIGGER inject_p05 BEFORE INSERT ON ppo.outbox_jobs FOR EACH ROW EXECUTE FUNCTION ppo.inject_p05_failure();",
  );
  const { crew: _crew, ...versions } = await cmd(1);
  void _crew;
  for (const action of [
    () => contact(1, "Failed"),
    () =>
      decideChangeRequest(
        actor,
        rid,
        { ...versions, expected_request_version: 1 },
        "accept",
      ),
    () =>
      cancelAppointment(actor, a.id, {
        ...base(),
        expected_version: a.version,
        expected_work_order_version: a.work_order_version,
        expected_assignment_version: a.assignment_version,
      }),
  ]) {
    await assert.rejects(action());
    assert.deepEqual(await snapshot(1), before);
    assert.deepEqual(
      await rows("SELECT * FROM ppo.schedule_follow_ups ORDER BY activity_id"),
      followups,
    );
    assert.deepEqual(
      await rows("SELECT * FROM ppo.contact_outcomes ORDER BY id"),
      contacts,
    );
    assert.equal(
      (
        await rows(
          "SELECT status FROM ppo.schedule_change_requests WHERE id=$1",
          [rid],
        )
      )[0].status,
      "Pending",
    );
  }
  await database().query(
    "DROP TRIGGER inject_p05 ON ppo.outbox_jobs;DROP FUNCTION ppo.inject_p05_failure();",
  );
});
test("PostgreSQL exclusion is authoritative across independent transactions, not only same-record versions", async () => {
  const make = async (n: number) =>
    transaction(async (c) => {
      const aid = id("a8", n),
        x = randomUUID();
      await c.query(
        "INSERT INTO ppo.assignments(id,workspace_id,company_id,site_id,appointment_id,resource_id,assignment_version,crew_role,travel_before_minutes,travel_after_minutes,travel_reason,active,resource_version,calendar_version,created_by) VALUES($1,$2,$3,$4,$5,$6,2,'Lead',0,0,'SYN direct constraint proof',true,1,1,$7)",
        [x, workspace, company, site, aid, id("a4", 5), owner],
      );
      await c.query(
        "INSERT INTO ppo.resource_reservations VALUES($1,$2,$3,$4,'2026-09-22T00:00:00Z','2026-09-22T02:00:00Z',true)",
        [randomUUID(), workspace, x, id("a4", 5)],
      );
      await c.query(
        'UPDATE ppo.appointments SET status=\'Confirmed\',version=version+1,assignment_version=2,scheduling_policy_id=$2,booking_snapshot=\'{"synthetic":true,"source":"direct constraint component fixture"}\',booking_hash=encode(sha256(convert_to(\'{"synthetic":true,"source":"direct constraint component fixture"}\'::jsonb::text,\'UTF8\')),\'hex\') WHERE id=$1',
        [aid, SCHEDULING_POLICY_ID],
      );
    });
  const result = await Promise.allSettled([make(6), make(7)]);
  assert.equal(result.filter((x) => x.status === "fulfilled").length, 1);
  assert.equal(
    result.filter((x) => x.status === "rejected" && x.reason.code === "23P01")
      .length,
    1,
  );
});
test("unchanged accepted operation recovers after connection restart and repeat seed retains booking history", async () => {
  const actor = await p(),
    input = await cmd(6);
  const a = await confirmAppointment(actor, id("a8", 6), input);
  const before = await snapshot(6);
  await closeDatabase();
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(6), before);
  assert.deepEqual(await readOperation(actor, input.operation_id), a.receipt);
});
