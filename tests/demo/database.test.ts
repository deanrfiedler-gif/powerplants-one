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
import { reset } from "../../scripts/database";
import {
  migrateDemo,
  reconcileTesters,
  demoCapabilities,
  grantRuntimePrivileges,
} from "../../scripts/demo-database";
import { createInvitedSession } from "../../src/platform/demo-auth";
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
    expected_close_date: "2026-11-30",
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
