import assert from "node:assert/strict";
import { after, test } from "node:test";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { migrate, seed } from "../../scripts/database";
import { migrationFiles, seedFiles } from "../../scripts/migration-registry";
import { createEstimate } from "../../src/estimating/service";
import { estimateInput } from "../helpers/estimating";
import { begin, newDeal, person, post, principal, profiles, rows } from "../helpers/conversations";
import { recoverSchema } from "../helpers/recover-schema";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
after(closeDatabase);
async function atVersion(version: number) {
  await recoverSchema();
  await database().query("DROP TABLE IF EXISTS public.ppo_migrations");
  await migrate(version);
  await seed(version);
}

for (const through of [109, 113, 114, 115, 116, 117, 118, 119, 120])
test(`populated ${through} history installs 0110 with every original row and ledger retained; seed 110 and replay are exact`, async () => {
  if (through === 109) await atVersion(through);
  else {
    // Reproduce main with its reserved 0110 gap, as the Products late-install proof does.
    const migrations = migrationFiles as unknown as string[], seeds = seedFiles as unknown as [number, string][];
    const mi = migrations.indexOf("0110-conversation-agent.sql"), si = seeds.findIndex(([v]) => v === 110);
    assert.ok(mi >= 0 && si >= 0);
    const [migration] = migrations.splice(mi, 1), [fixture] = seeds.splice(si, 1);
    try { await atVersion(through); }
    finally { migrations.splice(mi, 0, migration); seeds.splice(si, 0, fixture); }
  }
  const sam = await principal(profiles.coordinator), alex = await principal(profiles.dealReader);
  const deal = await newDeal(sam);
  const thread = await begin(sam, deal, {
    body: "SYN @{1} confirm the controls timing?",
    mentions: [person(alex.actor_id)],
    asks: [{ ordinal: 1, question: "SYN Confirm the controls timing", reply_by: null }],
  });
  await post(alex, thread);
  const tables = ["conversation_threads", "conversation_messages", "conversation_mentions", "conversation_participants",
    "conversation_asks", "notification_events", "notification_states", "audit_events", "operation_receipts",
    "outbox_jobs", "business_identities", "users", "reference_counters"];
  const snapshot = () => Promise.all(tables.map(t => rows(
    `SELECT to_jsonb(r)${t === "conversation_messages"
      ? " - 'author_kind' - 'acted_for_id' - 'turn_id' - 'agent_outcome' - 'adapter' - 'left_out_count'" : ""} row
     FROM ppo.${t} r ORDER BY 1`)));
  const original = await snapshot();
  const ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  const versions = new Set(ledger.map(r => r.version));
  const newerGuard = through >= 113
    ? await rows("SELECT pg_get_functiondef('ppo.check_sales_estimating_binding()'::regprocedure) AS definition") : null;
  const newerAllocator = through >= 114
    ? await rows("SELECT pg_get_functiondef('ppo.register_identity()'::regprocedure) AS definition") : null;
  const receipts = await rows("SELECT * FROM ppo.seed_receipts ORDER BY version");
  const grants = await rows("SELECT * FROM ppo.permission_grants ORDER BY id");
  await migrate();
  await seed();
  assert.deepEqual(await snapshot(), original);
  const migrated = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  assert.deepEqual(migrated.filter(r => versions.has(r.version)), ledger);
  assert.deepEqual(migrated.filter(r => !versions.has(r.version)).map(r => r.version), through === 109 ? [110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122] : through === 113 ? [110, 114, 115, 116, 117, 118, 119, 120, 121, 122] : through === 114 ? [110, 115, 116, 117, 118, 119, 120, 121, 122] : through === 115 ? [110, 116, 117, 118, 119, 120, 121, 122] : through === 116 ? [110, 117, 118, 119, 120, 121, 122] : through === 117 ? [110, 118, 119, 120, 121, 122] : through === 118 ? [110, 119, 120, 121, 122] : through === 119 ? [110, 120, 121] : [110, 121]);
  if (newerGuard) assert.deepEqual(
    await rows("SELECT pg_get_functiondef('ppo.check_sales_estimating_binding()'::regprocedure) AS definition"), newerGuard);
  if (newerAllocator) assert.deepEqual(
    await rows("SELECT pg_get_functiondef('ppo.register_identity()'::regprocedure) AS definition"), newerAllocator);
  assert.deepEqual(await rows("SELECT * FROM ppo.seed_receipts WHERE version<>110 AND version<=$1 ORDER BY version", [through]), receipts);
  assert.deepEqual(await rows("SELECT version FROM ppo.seed_receipts WHERE version=110 OR version>$1 ORDER BY version", [through]), through < 120 ? [{ version: 110 }, { version: 120 }, { version: 121 }] : [{ version: 110 }, { version: 121 }]);
  assert.deepEqual(await rows("SELECT version FROM ppo.seed_receipts WHERE version>109 ORDER BY version"), [{ version: 110 }, { version: 120 }, { version: 121 }]);
  assert.deepEqual(await rows("SELECT * FROM ppo.permission_grants WHERE capability<>'conversation.agent.ask' ORDER BY id"), grants);
  assert.deepEqual(await rows("SELECT DISTINCT author_kind FROM ppo.conversation_messages"), [{ author_kind: "Person" }]);
  const added = await rows(`SELECT g.id,source.id AS source_id,
    md5('ppo-conversations-t2b:'||source.id::text||':conversation.agent.ask')::uuid expected
    FROM ppo.permission_grants g JOIN ppo.permission_grants source ON source.workspace_id=g.workspace_id
    AND source.user_id=g.user_id AND source.capability='conversation.post' AND source.scope_type=g.scope_type
    AND source.scope_id=g.scope_id AND source.company_id IS NOT DISTINCT FROM g.company_id
    AND source.site_id IS NOT DISTINCT FROM g.site_id AND source.valid_from=g.valid_from
    AND source.valid_to IS NOT DISTINCT FROM g.valid_to WHERE g.capability='conversation.agent.ask'`);
  assert.ok(added.length > 0);
  for (const g of added) assert.equal(g.id, g.expected);
  for (const t of ["assistant_turns", "assistant_budget_entries", "conversation_message_claims", "conversation_message_sources"])
    assert.equal((await rows(`SELECT count(*)::int n FROM ppo.${t}`))[0].n, 0, t);
  assert.deepEqual(await rows("SELECT workspace_id,monthly_ceiling_micro::text n FROM ppo.assistant_budget_settings ORDER BY workspace_id"),
    await rows("SELECT id AS workspace_id,'30000000' AS n FROM ppo.workspaces ORDER BY id"));
  const complete = async () => Promise.all([
    snapshot(), rows("SELECT * FROM public.ppo_migrations ORDER BY version"),
    rows("SELECT * FROM ppo.seed_receipts ORDER BY version"), rows("SELECT * FROM ppo.permission_grants ORDER BY id"),
    rows("SELECT * FROM ppo.assistant_budget_settings ORDER BY workspace_id"),
  ]);
  const upgraded = await complete();
  await migrate();
  await seed();
  assert.deepEqual(await complete(), upgraded);
});

test("0110 flushes pending identity_target events when upgrading populated estimates across 0026", async () => {
  await atVersion(25);
  const sam = await principal(profiles.coordinator), deal = await newDeal(sam);
  const input = estimateInput(deal);
  await createEstimate(sam, input);
  const originals = await rows("SELECT to_jsonb(e) row FROM ppo.estimates e ORDER BY id");
  const ledger = await rows("SELECT * FROM public.ppo_migrations ORDER BY version");
  // migrate applies 0026 through 0114 in one transaction. 0026's backfill queues identity_target
  // events for this real estimate, so 0110's identity ALTER must explicitly flush the deferred check.
  await migrate();
  await seed();
  assert.deepEqual(await rows("SELECT to_jsonb(e) row FROM ppo.estimates e ORDER BY id"), originals);
  assert.deepEqual(await rows("SELECT * FROM public.ppo_migrations WHERE version<=25 ORDER BY version"), ledger);
  assert.equal((await rows("SELECT object_type FROM ppo.business_identities WHERE id=$1", [input.id]))[0].object_type, "Estimate");
  assert.equal((await rows("SELECT count(*)::int n FROM public.ppo_migrations WHERE version=110"))[0].n, 1);
  assert.equal((await rows("SELECT condeferred FROM pg_constraint WHERE conrelid='ppo.business_identities'::regclass AND conname='identity_target'"))[0].condeferred, true);
});
