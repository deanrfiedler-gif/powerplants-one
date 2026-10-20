import assert from "node:assert/strict";
import { after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { startThread } from "../../src/conversations/commands";
import { listThreads, readThread } from "../../src/conversations/reads";
import { notificationInbox } from "../../src/notifications/service";
import { createActivity } from "../../src/activities/activities";
import { randomUUID } from "node:crypto";
import { CRM, crmBase } from "../helpers/crm";
import { conversationSeedGrants } from "../helpers/engineering-materials-grants";
import { newDeal, newProject, person, principal, profiles, threadInput } from "../helpers/conversations";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);

// Conversations T1b: a populated 0107 installation (deal, project, existing notices, receipts) upgrades to 0108
// with every earlier row, hash and receipt exact. Only the new nullable notice column, one seed receipt and the
// conversation grants of seed 108 are new; the new tables start empty, and the capability opens a real thread.
test("populated 0107 upgrade keeps every earlier row, adds exactly seed 108's grants and opens a thread on an old deal; repeat adds nothing", async () => {
  const c = database();
  await c.query(await readFile("db/migrations/0001-recover.sql", "utf8"));
  await c.query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(107);
  await seed(107);
  const sam = await principal(profiles.coordinator);
  const deal = await newDeal(sam),
    project = await newProject(sam);
  // An existing OwnedWork notice, so the notice table holds a row from before the Conversation source existed.
  await createActivity(sam, {
    ...crmBase(), id: randomUUID(), company_id: CRM.company, site_id: CRM.site, kind: "CustomerContact", owner_id: CRM.owner,
    summary: "SYN Earlier owned work", due_at: null, due_needed: true, access_class: "RestrictedService",
    links: [{ object_type: "Site", object_id: CRM.site }],
  });
  assert.ok((await notificationInbox(sam)).items.length > 0);
  // A source grant that is already revoked and a profile that is inactive: neither may be copied as a live duty.
  await c.query("UPDATE ppo.permission_grants SET valid_to=clock_timestamp()-interval '1 second',valid_from=clock_timestamp()-interval '1 day' WHERE capability='crm.opportunity.read' AND user_id=(SELECT id FROM ppo.users WHERE subject_id='quotation-issuer')");
  await c.query("UPDATE ppo.users SET active=false WHERE subject_id='quotation-approver'");
  const inactive = (await c.query("SELECT id FROM ppo.users WHERE subject_id='quotation-approver'")).rows[0].id;

  const tables = [
    "opportunities", "projects", "activities", "notification_events", "notification_states", "operation_receipts", "audit_events",
    "outbox_jobs", "business_identities", "permission_grants", "users", "seed_receipts", "reference_counters",
  ];
  const snapshot = async () =>
    Promise.all(
      tables.map(async (t) =>
        (
          await c.query(
            `SELECT to_jsonb(x)${t === "notification_events" ? " - 'reason'" : ""} row FROM ppo.${t} x${t === "seed_receipts" ? " WHERE x.version<>108" : ""}${
              t === "permission_grants" ? ` WHERE x.capability NOT LIKE 'conversation.%'` : ""
            } ORDER BY to_jsonb(x)::text`,
          )
        ).rows,
      ),
    );
  const before = await snapshot(),
    ledger = (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows,
    oldGrants = (await c.query("SELECT * FROM ppo.permission_grants ORDER BY id")).rows;
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), before);
  assert.deepEqual((await c.query("SELECT * FROM public.ppo_migrations WHERE version<=107 ORDER BY version")).rows, ledger);
  assert.deepEqual((await c.query("SELECT version FROM public.ppo_migrations WHERE version>107 ORDER BY version")).rows, [{ version: 108 }, { version: 109 }, { version: 113 }, { version: 115 }]);
  assert.deepEqual((await c.query("SELECT version FROM ppo.seed_receipts WHERE version>107 ORDER BY version")).rows, [{ version: 108 }]);
  // Exactly the live Opportunity and Project readers of active local profiles gain the two duties, in their own scopes.
  const added = (await c.query("SELECT * FROM ppo.permission_grants WHERE capability LIKE 'conversation.%' ORDER BY id")).rows;
  const expected = conversationSeedGrants(oldGrants.filter((g) => g.user_id !== inactive));
  assert.ok(expected.length > 0);
  const key = (g: Record<string, unknown>) => JSON.stringify(Object.fromEntries(Object.entries(g).sort(([a], [b]) => (a < b ? -1 : 1))));
  assert.deepEqual(added.map(key).sort(), expected.map(key).sort());
  assert.ok(added.every((g) => g.user_id !== inactive));
  // The new notice column is null on every existing row, which are all Activity notices.
  assert.deepEqual((await c.query("SELECT DISTINCT source_type,category,reason FROM ppo.notification_events")).rows, [{ source_type: "Activity", category: "OwnedWork", reason: null }]);
  // New tables start empty.
  for (const t of ["conversation_threads", "conversation_messages", "conversation_mentions", "conversation_participants", "conversation_asks"])
    assert.equal((await c.query(`SELECT count(*)::int n FROM ppo.${t}`)).rows[0].n, 0, t);
  // The old deal and project open threads through the upgraded schema.
  const other = await principal(profiles.dealReader);
  const started = await startThread(sam, threadInput(deal, { body: "SYN Hello @{1}", mentions: [person(other.actor_id)] }));
  assert.equal((await readThread(other, started.receipt.record_id)).anchor.id, deal);
  const onProject = await startThread(sam, threadInput(project, { anchor_type: "Project" }));
  assert.equal((await listThreads(sam, { anchor_type: "Project", anchor_id: project })).items[0].id, onProject.receipt.record_id);
  // The existing OwnedWork inbox still works beside the new source.
  assert.ok((await notificationInbox(sam)).items.length > 0);

  // A repeat migration and seed changes nothing.
  const upgraded = (await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows;
  const grants = (await c.query("SELECT * FROM ppo.permission_grants ORDER BY id")).rows;
  await migrate();
  await seed();
  assert.deepEqual((await c.query("SELECT * FROM public.ppo_migrations ORDER BY version")).rows, upgraded);
  assert.deepEqual((await c.query("SELECT * FROM ppo.permission_grants ORDER BY id")).rows, grants);
});
