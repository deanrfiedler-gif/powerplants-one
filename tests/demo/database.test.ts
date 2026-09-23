import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  database,
  closeDatabase,
  transaction,
} from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { createSession, readInvitedSession } from "../../src/platform/identity";
import { packReviewerCapabilities, readHostedRoles, switchHostedRole } from "../../src/platform/demo-roles";
import { reset } from "../../scripts/database";
import {
  migrateDemo,
  reconcileTesters,
  demoCapabilities,
  grantRuntimePrivileges,
} from "../../scripts/demo-database";
import { createInvitedSession } from "../../src/platform/demo-auth";
import { hostedDevelopmentAccess } from "../../src/development/access";
import { hasPermission } from "../../src/platform/permissions";
import { createOpportunity } from "../../src/crm/opportunities";
import { readOpportunity } from "../../src/crm/reads";
import { crmCreate, crmBase, CRM } from "../helpers/crm";
import {
  listEmail,
  readEmail,
  linkEmail,
  createEmailFollowup,
  readCalendar,
} from "../../src/email/service";
import { editDealInformation, editDealScope } from "../../src/crm/refinements";
import { readSchedule, readAppointment, confirmAppointment, moveAppointment, recordContact } from "../../src/scheduling/planner";
import { readUnassignedDemand } from "../../src/scheduling/demand";
import { authoriseWorkOrder, readWorkOrder, proposeVisit, assessWorkReadiness } from "../../src/service/work-orders";

if (localConfig().database_name !== "ppo_synthetic_test")
  throw Error("Disposable local test database required.");
const tenant = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  first = randomUUID(),
  second = randomUUID();
const expires_at = new Date(Date.now() + 86400000).toISOString();
before(async () => {
  process.env.PPO_ALLOW_RESET = "dispose-synthetic";
  process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
  await migrateDemo();
  await migrateDemo();
  await reconcileTesters(tenant, [
    { object_id: first, expires_at },
    { object_id: second, expires_at },
  ]);
});

// Each case begins with current invitations; revocation in one case must not
// leave the next case with an intentionally disabled actor.
beforeEach(async () => {
  await reconcileTesters(tenant, [{ object_id: first, expires_at }, { object_id: second, expires_at }]);
});

test("design workspace uses the owner's active Entra membership across roles and refuses revocation", async () => {
  const token = await transaction(c => createInvitedSession(c, tenant, first));
  const otherToken = await transaction(c => createInvitedSession(c, tenant, second));
  const access = () => hostedDevelopmentAccess(database(), token, tenant, first);
  assert.equal(await access(), true);
  assert.equal(await hostedDevelopmentAccess(database(), otherToken, tenant, first), false);
  assert.equal(await hostedDevelopmentAccess(database(), token, randomUUID(), first), false);
  await switchHostedRole(database(), token, tenant, "pack-reviewer");
  assert.equal(await access(), true);
  await database().query("UPDATE ppo.demo_tester_roles SET enabled=false WHERE tenant_id=$1 AND object_id=$2", [tenant, first]);
  assert.equal(await access(), false);
  await reconcileTesters(tenant, [{object_id:first, expires_at}, {object_id:second, expires_at}]);
  assert.equal(await access(), true);
  await database().query("UPDATE ppo.demo_testers SET expires_at=clock_timestamp()-interval '1 minute' WHERE tenant_id=$1 AND object_id=$2", [tenant, first]);
  assert.equal(await access(), false);
  await reconcileTesters(tenant, [{object_id:first, expires_at}, {object_id:second, expires_at}]);
  await database().query("UPDATE ppo.sessions SET expires_at=clock_timestamp()-interval '1 minute' WHERE token_hash=$1", [createHash("sha256").update(token).digest("hex")]);
  assert.equal(await access(), false);
});

test("each invited tester retains a private mailbox, CRM follow-up and calendar across reconciliation", async () => {
  await reconcileTesters(tenant, [
    { object_id: first, expires_at },
    { object_id: second, expires_at },
  ]);
  const session = async (objectId: string) => {
    const token = await transaction((c) =>
      createInvitedSession(c, tenant, objectId),
    );
    return readInvitedSession(database(), token, tenant);
  };
  const p = await session(first),
    other = await session(second);
  const inbox = await listEmail(p, {}),
    theirs = await listEmail(other, {});
  assert.equal(inbox.items.length, 2);
  assert.equal(theirs.items.length, 2);
  assert.ok(inbox.items.every((m) => !theirs.items.some((n) => n.id === m.id)));
  const message = inbox.items[0].id;
  const unavailable = (e: unknown) =>
    (e as { code: string }).code === "RecordUnavailable";
  await assert.rejects(readEmail(other, message), unavailable);
  await assert.rejects(
    readEmail(p, "ec000000-0000-4000-8000-000000000001"),
    unavailable,
  );
  const o = crmCreate();
  o.owner_id = p.actor_id;
  o.initial_action.owner_id = p.actor_id;
  await createOpportunity(p, o);
  await editDealInformation(p, o.id, {
    ...crmBase(),
    expected_version: 1,
    title: "SYN Private mailbox review",
    primary_person_id: CRM.person,
    contact_unknown_reason: null,
    value_amount: "12500.50",
    expected_close_date: "2031-12-01",
  });
  await editDealScope(p, o.id, {
    ...crmBase(),
    expected_version: 2,
    need_summary: "SYN Confirm irrigation requirements",
    scope_details: {
      inclusions: "SYN Site visit",
      exclusions: "SYN Civil works",
      acceptance: "SYN Scope review",
    },
  });
  await linkEmail(p, message, {
    ...crmBase(),
    expected_version: 1,
    opportunity_id: o.id,
  });
  const day = new Date(Date.now() + 10 * 3600000).toISOString().slice(0, 10);
  const follow = {
    ...crmBase(),
    expected_version: 2,
    activity_id: randomUUID(),
    summary: "SYN Confirm invitation journey",
    due_at: new Date(`${day}T23:30:00+10:00`).toISOString(),
  };
  await createEmailFollowup(p, message, follow);
  assert.equal((await createEmailFollowup(p, message, follow)).replayed, true);
  await assert.rejects(
    linkEmail(other, message, {
      ...crmBase(),
      expected_version: 3,
      opportunity_id: o.id,
    }),
    unavailable,
  );
  const savedMail = await readEmail(p, message),
    before = await readCalendar(p, { day });
  assert.equal(before.meetings.length, 2);
  assert.equal(
    before.activities.filter((a) => a.id === follow.activity_id).length,
    1,
  );
  const otherCalendar = await readCalendar(other, { day });
  assert.equal(otherCalendar.meetings.length, 2);
  assert.ok(
    before.meetings.every(
      (m) => !otherCalendar.meetings.some((n) => n.id === m.id),
    ),
  );
  assert.equal(
    otherCalendar.activities.some((a) => a.id === follow.activity_id),
    false,
  );
  const saved = await readOpportunity(p, o.id);
  assert.equal(saved.value_amount, "12500.50");
  assert.equal(saved.scope_details.inclusions, "SYN Site visit");
  assert.equal(saved.next_activity?.id, o.initial_action.id);
  assert.ok(saved.actions.some((a) => a.id === follow.activity_id));
  assert.equal(JSON.stringify(saved).includes(savedMail.body_text), false);
  await closeDatabase();
  await reconcileTesters(tenant, [
    { object_id: first, expires_at },
    { object_id: second, expires_at },
  ]);
  assert.equal((await session(first)).actor_id, p.actor_id);
  assert.equal((await listEmail(p, {})).items.length, 2);
  assert.deepEqual(await readEmail(p, message), savedMail);
  assert.deepEqual(await readCalendar(p, { day }), before);
  await database().query(
    "UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='email.read'",
    [p.actor_id],
  );
  await assert.rejects(readEmail(p, message), unavailable);
  assert.equal((await readCalendar(p, { day })).meetings.length, 0);
  await reconcileTesters(tenant, [{ object_id: second, expires_at }]);
  await assert.rejects(readEmail(p, message), unavailable);
  assert.equal(
    (await readEmail(other, theirs.items[0].id)).owner_id,
    other.actor_id,
  );
});
after(closeDatabase);

test("invited tester can read the Company A planner, demand and linked work with bounded scheduling authority", async () => {
  const token = await transaction(c => createInvitedSession(c, tenant, first));
  const p = await readInvitedSession(database(), token, tenant);
  const schedule = await readSchedule(p, {
    from: "2031-09-21T14:00:00Z", to: "2031-09-28T14:00:00Z", timezone: "Australia/Brisbane",
  });
  assert.ok(schedule.items.length > 0, "seeded visits must be visible, not an empty permission-filtered result");
  assert.ok(schedule.resources.length > 0);
  for (const a of schedule.items) {
    assert.equal(a.company_id, CRM.company);
    assert.equal(a.actions.can_manage, true);
    assert.equal(a.actions.can_request, false);
    assert.equal(a.actions.can_contact, true);
  }
  assert.equal((await readAppointment(p, schedule.items[0].id)).items[0].id, schedule.items[0].id);
  // Authorise a disposable seeded draft as the local coordinator, then prove
  // the invited actor sees real demand and can follow its work-order link.
  const coordinator = (await createSession("coordinator")).principal;
  const work = (await readWorkOrder(coordinator, "90000000-0000-4000-8000-000000000001")).items[0];
  const scope = work.scopes.find(s => s.id === work.scope_revision_id)!;
  await authoriseWorkOrder(coordinator, work.id, {
    operation_id: randomUUID(), schema_version: 1, reason: "SYN invited planner read proof",
    expected_version: work.version, scope_revision_id: scope.id, scope_version: scope.version,
    policy_version_id: scope.policy_version_id,
  });
  const demand = await readUnassignedDemand(p);
  assert.ok(demand.items.some(w => w.id === work.id));
  assert.ok(demand.items.every(w => w.company_id === CRM.company));
  const linked = (await readWorkOrder(p, work.id)).items[0];
  assert.deepEqual(linked.actions, { can_edit: true, can_authorise: false, can_assess: true });
  for (const capability of ["schedule.request", "service.scope.authorise"] as const)
    assert.equal(await hasPermission(database(), p, capability, CRM.company), false);
  for (const capability of ["schedule.read", "service.work_order.read", "service.ticket.read", "schedule.manage", "schedule.contact", "service.work_order.edit", "service.readiness.assess"] as const)
    assert.equal(await hasPermission(database(), p, capability, CRM.companyB), false);
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.read'", [p.actor_id]);
  await assert.rejects(readUnassignedDemand(p), (e: unknown) => (e as { code: string }).code === "Forbidden");
});

test("hosted identity mapping, persisted CRM and immediate removal stay scoped", async () => {
  const db = database();
  const users = await db.query(
    "SELECT t.object_id,u.id,u.workspace_id,u.display_name FROM ppo.demo_testers t JOIN ppo.users u ON u.id=t.user_id ORDER BY t.object_id",
  );
  assert.equal(users.rowCount, 2);
  assert.notEqual(users.rows[0].id, users.rows[1].id);
  assert.ok(users.rows.every((u) => u.id !== CRM.owner));
  const u = users.rows.find((u) => u.object_id === first)!;
  const token = randomBytes(32).toString("hex"),
    hash = createHash("sha256").update(token).digest("hex");
  await db.query(
    "INSERT INTO ppo.sessions VALUES($1,$2,$3,clock_timestamp()+interval '1 hour')",
    [hash, u.workspace_id, u.id],
  );
  const p = await readInvitedSession(db, token, tenant);
  assert.equal(p.actor_id, u.id);
  // Exercise the real sign-in SQL as a role that cannot alter users or tester grants.
  const role = `ppo_demo_test_${randomBytes(6).toString("hex")}`;
  const client = await db.connect();
  try {
    await client.query(`CREATE ROLE ${role}`);
    await grantRuntimePrivileges(client, "ppo_synthetic_test", role);
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    const session = await createInvitedSession(client, tenant, first);
    assert.equal(
      (await readInvitedSession(client, session, tenant)).actor_id,
      p.actor_id,
    );
    await client.query("COMMIT");
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    await assert.rejects(
      client.query("UPDATE ppo.demo_testers SET enabled=true"),
      /permission denied/,
    );
    await client.query("ROLLBACK");
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE ${role}`);
    await assert.rejects(
      client.query("UPDATE ppo.demo_tester_roles SET enabled=true"),
      /permission denied/,
    );
    await client.query("ROLLBACK");
  } finally {
    await client.query("ROLLBACK");
    await client.query(`DROP OWNED BY ${role}`);
    await client.query(`DROP ROLE ${role}`);
    client.release();
  }
  for (const cap of demoCapabilities)
    assert.equal(await hasPermission(db, p, cap, CRM.company), true);
  for (const cap of [
    "finance.read",
    "service.scope.authorise",
    "pack.issue",
  ] as const)
    assert.equal(await hasPermission(db, p, cap, CRM.company), false);
  assert.equal(await hasPermission(db, p, "shared.read", CRM.companyB), false);
  const proposal = crmCreate();
  proposal.owner_id = p.actor_id;
  proposal.initial_action.owner_id = p.actor_id;
  await createOpportunity(p, proposal);
  assert.equal((await readOpportunity(p, proposal.id)).owner_id, p.actor_id);
  await closeDatabase();
  assert.equal((await readOpportunity(p, proposal.id)).title, proposal.title);
  const local = await createSession("coordinator");
  await assert.rejects(readInvitedSession(database(), local.token, tenant));
  await assert.rejects(readInvitedSession(database(), token, randomUUID()));
  await database().query(
    "UPDATE ppo.demo_testers SET expires_at=clock_timestamp()-interval '1 second' WHERE object_id=$1",
    [first],
  );
  await assert.rejects(readInvitedSession(database(), token, tenant));
  await reconcileTesters(tenant, [
    { object_id: first, expires_at },
    { object_id: second, expires_at },
  ]);
  assert.equal(
    (await readInvitedSession(database(), token, tenant)).actor_id,
    p.actor_id,
  );
  await reconcileTesters(tenant, [{ object_id: second, expires_at }]);
  await assert.rejects(readInvitedSession(database(), token, tenant));
  assert.equal(
    (
      await database().query("SELECT 1 FROM ppo.sessions WHERE token_hash=$1", [
        hash,
      ])
    ).rowCount,
    0,
  );
  assert.equal(
    await hasPermission(database(), p, "crm.opportunity.edit", CRM.company),
    false,
  );
  assert.equal(
    (
      await database().query(
        "SELECT owner_id FROM ppo.opportunities WHERE id=$1",
        [proposal.id],
      )
    ).rows[0].owner_id,
    p.actor_id,
  );
});

test("hosted tester switches to an attributable pack reviewer without widening T6", async () => {
  const token = await transaction(c => createInvitedSession(c, tenant, first));
  const tester = await readInvitedSession(database(), token, tenant);
  assert.deepEqual(await readHostedRoles(database(), token, tenant), {
    current: "tester",
    available: ["tester", "pack-reviewer"],
  });
  const reviewer = await transaction(c => switchHostedRole(c, token, tenant, "pack-reviewer"));
  assert.notEqual(reviewer.actor_id, tester.actor_id);
  assert.match(reviewer.display_name, /^SYN Pack reviewer /);
  assert.equal((await readInvitedSession(database(), token, tenant)).actor_id, reviewer.actor_id);
  assert.deepEqual(await readHostedRoles(database(), token, tenant), {
    current: "pack-reviewer",
    available: ["tester", "pack-reviewer"],
  });
  for (const capability of packReviewerCapabilities)
    assert.equal(await hasPermission(database(), reviewer, capability, CRM.company), true);
  for (const capability of [
    "pack.issue", "pack.acknowledge", "schedule.manage", "schedule.contact",
    "service.work_order.edit", "service.readiness.assess", "finance.read", "field.read.own",
  ] as const)
    assert.equal(await hasPermission(database(), reviewer, capability, CRM.company), false);
  assert.equal(await hasPermission(database(), tester, "pack.read", CRM.company), false);
  const restored = await transaction(c => switchHostedRole(c, token, tenant, "tester"));
  assert.equal(restored.actor_id, tester.actor_id);
});

test("invited actor persists proposal, preparation, contact and crew; conflicting move and revoked authority preserve booking", async () => {
  const token = await transaction(c => createInvitedSession(c, tenant, first));
  const actor = await readInvitedSession(database(), token, tenant);
  const id = (prefix: string, n = 1) => `${prefix}000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
  const base = () => ({ operation_id: randomUUID(), schema_version: 1, reason: "SYN invited booking workflow proof" });
  const work = (await readWorkOrder(actor, id("a9"))).items[0];
  const scope = work.scopes.find(s => s.id === work.authorised_scope_revision_id)!;
  const visit = randomUUID();
  const proposal = { ...base(), id: visit, expected_version: work.version,
    scope_revision_id: scope.id, scope_version: scope.version,
    start_at: "2031-10-07T00:00:00Z", end_at: "2031-10-07T02:00:00Z",
    customer_commitment: "Proposed", preparation_status: "Preparing" };
  await proposeVisit(actor, work.id, proposal);
  await proposeVisit(actor, work.id, proposal); // Same operation recovers the original, without another visit.
  const read = async () => (await readAppointment(actor, visit)).items[0];
  const crew = [1, 2].map((n, i) => ({ resource_id: id("a4", n), resource_version: 1,
    calendar_version: 1, crew_role: i ? "Technician" : "Lead", travel_before_minutes: 0,
    travel_after_minutes: 0, travel_reason: "SYN explicit same-site zero travel allowance" }));
  const booking = async () => { const a = await read(); return { ...base(),
    expected_version: a.version, expected_work_order_version: a.work_order_version,
    expected_assignment_version: a.assignment_version, scope_revision_id: a.scope_revision_id,
    scope_version: a.scope_version, policy_version_id: a.policy_version_id,
    scheduling_policy_id: id("a0"), scheduling_policy_version: 1, crew }; };
  const code = (value: string) => (e: unknown) => (e as { code: string }).code === value;
  await assert.rejects(confirmAppointment(actor, visit, await booking()), code("BookingBlocked"));
  await assessWorkReadiness(actor, work.id, { ...base(), expected_version: (await read()).work_order_version,
    assessment: { scope_revision_id: scope.id, scope_version: scope.version, appointment_id: visit,
      criterion_code: "ToolPreparation", outcome: "Pass", reason: "SYN inspection kit preparation reviewed",
      source_as_at: "2026-09-19T00:00:00Z", evidence: { title: "SYN booking preparation",
        content_text: "SYN inspection kit ready; dispatch remains held.", source_reference: "SYN-PPO-HOSTED-BOOKING", source_version: "1" } } });
  await assert.rejects(confirmAppointment(actor, visit, await booking()), code("CustomerContactRequired"));
  await recordContact(actor, visit, { ...base(), id: randomUUID(), expected_version: (await read()).version,
    recipient_id: id("60"), channel: "Simulated", outcome: "Confirmed", occurred_at: new Date().toISOString(),
    notes: "SYN customer agreed to these exact proposed dates; no communication sent." });
  await confirmAppointment(actor, visit, await booking());
  const confirmed = await read();
  assert.equal(confirmed.status, "Confirmed");
  assert.equal(confirmed.assignments.length, 2);
  assert.equal(confirmed.start_at.toISOString(), proposal.start_at.replace("Z", ".000Z"));
  // Seeded Monday appointment occupies these exact resources. Failure preserves all versions and reservations.
  await assert.rejects(moveAppointment(actor, visit, { ...await booking(),
    start_at: "2031-09-22T00:00:00Z", end_at: "2031-09-22T02:00:00Z" }), code("ResourceConflict"));
  const afterConflict = await read();
  assert.equal(afterConflict.version, confirmed.version);
  assert.deepEqual(afterConflict.assignments, confirmed.assignments);
  assert.equal(afterConflict.start_at.toISOString(), confirmed.start_at.toISOString());
  await moveAppointment(actor, visit, { ...await booking(), start_at: "2031-10-08T00:00:00Z", end_at: "2031-10-08T02:00:00Z" });
  const moved = await read();
  assert.equal(moved.schedule_version, confirmed.schedule_version + 1);
  assert.equal(moved.customer_commitment, "Changed");
  const freshActor = await readInvitedSession(database(), token, tenant);
  assert.equal((await readAppointment(freshActor, visit)).items[0].start_at.toISOString(), "2031-10-08T00:00:00.000Z");
  await database().query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp() WHERE user_id=$1 AND capability='schedule.manage'", [actor.actor_id]);
  await assert.rejects(moveAppointment(actor, visit, { ...await booking(), start_at: "2031-10-09T00:00:00Z", end_at: "2031-10-09T02:00:00Z" }), code("Forbidden"));
  assert.equal((await read()).version, moved.version);
});
