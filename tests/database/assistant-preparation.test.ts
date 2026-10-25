import assert from "node:assert/strict";
import https from "node:https";
import pg from "pg";
import { after, before, mock, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase, transaction } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { materialiseCatalogue, exportPreparation, inspectInstance, syntheticPrincipal, verifyPreparation, rerecordPreparation, preparationBlockers, preparationSafety, assertExclusiveClients, type Preparation } from "../../scripts/t2e-preparation";
import { readCatalogue, catalogueHash } from "../../scripts/t2e-catalogue";
import { evaluationHash, parseEvaluation } from "../../src/assistant/evaluation";
import { chooseWorkingCompany } from "../../src/shell/company";
import { activityCommand } from "../../src/activities/activities";
import { randomUUID } from "node:crypto";
import { createOrganisation } from "../../src/shared/commands";
import { reserveCall, keepUnknown } from "../../src/assistant/budget";
import { priceFor } from "../../src/assistant/pricing";
import { turnLimits } from "../../src/assistant/model";
import { begin, newDeal, post } from "../helpers/conversations";
if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
const c = readCatalogue(); let prep: Preparation; let exported: Awaited<ReturnType<typeof exportPreparation>>;
const snapshot = async () => {
  const values = [];
  for (const table of ["assistant_turns", "assistant_budget_entries", "assistant_budget_settings", "conversation_messages", "audit_events", "operation_receipts", "outbox_jobs"])
    values.push((await database().query(`SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'' ORDER BY to_jsonb(t)::text),'')) AS hash FROM ppo.${table} t`)).rows[0].hash);
  return values;
};
before(async () => {
  mock.method(globalThis, "fetch", () => assert.fail("No network")); mock.method(https, "request", () => assert.fail("No HTTPS"));
  // Separate disposable regression fixture, never the retained proposed inventory workspace.
  process.env.PPO_ALLOW_RESET = "dispose-synthetic"; process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
  await reset();
});
test("T2e interrupted canonical preparation refuses replay and preserves partial state", async () => {
  const p = await syntheticPrincipal();
  await chooseWorkingCompany(p, { company_id: "20000000-0000-4000-8000-000000000001" });
  await createOrganisation(p, { operation_id: randomUUID(), schema_version: 1, reason: "SYN T2E-SYN-01 offline preparation",
    id: randomUUID(), company_id: "20000000-0000-4000-8000-000000000001", ...c.record_sets.organisation, owner_id: p.actor_id, access_class: "Internal" });
  assert.deepEqual(await preparationBlockers(), ["Prior or partial preparation"]);
  const partial = await snapshot(); await assert.rejects(materialiseCatalogue(c), /Prior or partial preparation/);
  assert.deepEqual(await snapshot(), partial);
  // Discard only this never-bound regression fixture; the retained proposed cluster is separate.
  await reset();
});
test("T2e materialises the complete canonical corpus once without a worker", async () => {
  prep = await materialiseCatalogue(c);
  assert.equal(prep.instances.length, 117);
});
after(async () => { mock.restoreAll(); await closeDatabase(); });
test("T2e 117 canonical queued members: read-only inventory, gold mappings, bounded requests, no ledger or answers", async () => {
  const before = await snapshot(); exported = await exportPreparation(c, prep); const again = await verifyPreparation(c, prep, exported);
  assert.equal(exported.inventory_hash, again.inventory_hash); assert.deepEqual(await snapshot(), before);
  assert.equal(exported.report.instances.length, 117); assert.equal(exported.report.forecast[0].turns, 9); assert.equal(exported.report.forecast[1].turns, 108);
  assert.ok(exported.report.instances.every(i => !i.bounds.irreducible));
  assert.ok(exported.report.instances.filter(i => ["C03", "L12"].includes(i.case_id)).every(i => i.bounds.fitted_omissions > 0));
  assert.equal((await database().query("SELECT count(*)::int AS n FROM ppo.assistant_turns WHERE state='Queued'")).rows[0].n, 117);
  assert.throws(() => parseEvaluation(exported.report, evaluationHash(exported.report), "Calibration"));
  assert.deepEqual(await preparationBlockers(), ["Existing preparation", "Prior or partial preparation", "Existing turns"]);
  await assert.rejects(materialiseCatalogue(c), /Existing preparation.*Prior or partial preparation.*Existing turns/);
});
test("T2e explicit re-recording preserves every instance and refuses evidence drift", async () => {
  const before = await snapshot();
  const prior = structuredClone(exported); prior.report.tool_source_hash = "0".repeat(64); prior.inventory_hash = evaluationHash(prior.report);
  await assert.rejects(verifyPreparation(c, prep, prior), /Preparation drift/);
  const recorded = await rerecordPreparation(c, prep, prior);
  assert.deepEqual(recorded.current, exported); assert.deepEqual(recorded.preparation, prep);
  assert.equal(recorded.provenance.previous_inventory_hash, prior.inventory_hash);
  assert.deepEqual(await snapshot(), before);
});
test("T2e reviewer reannotation retains the exact prior instance evidence", async () => {
  const before = await snapshot();
  const prior = structuredClone(exported);
  const oldCatalogue = structuredClone(c); oldCatalogue.cases.at(-1)!.recipe.history = "conflicting-padding";
  oldCatalogue.cases.at(-1)!.setup = "SYN original annotation"; oldCatalogue.schema_version = 2;
  const l03 = oldCatalogue.cases.find(k => k.id === "L03")!; l03.expected[1] = l03.gold[1].claim = "SYN original claim wording";
  for (const i of prior.report.instances.filter(i => i.case_id === "L03")) i.gold[1].claim = l03.gold[1].claim;
  const oldPrep = { ...prep, catalogue_hash: catalogueHash(oldCatalogue) };
  prior.report.catalogue_hash = oldPrep.catalogue_hash; prior.inventory_hash = evaluationHash(prior.report);
  await assert.rejects(rerecordPreparation(c, oldPrep, prior), /Previous catalogue required/);
  const unbound = structuredClone(prior); unbound.report.instances.find(i => i.case_id === "L03")!.gold[1].claim = "SYN unbound wording";
  unbound.inventory_hash = evaluationHash(unbound.report);
  await assert.rejects(rerecordPreparation(c, oldPrep, unbound, oldCatalogue), /Baseline gold annotations differ/);
  const annotated = await rerecordPreparation(c, oldPrep, prior, oldCatalogue);
  assert.deepEqual(annotated.current, exported); assert.deepEqual(annotated.preparation, prep);
  assert.deepEqual(annotated.provenance.annotation_changes.map(x => x.field), ["schema_version", "gold[1].claim", "setup", "recipe.history"]);
  assert.deepEqual(await snapshot(), before);
});
test("T2e re-recording rejects corrupt baselines and changed instance evidence", async () => {
  const before = await snapshot();
  const corrupt = structuredClone(exported); corrupt.inventory_hash = "0".repeat(64);
  await assert.rejects(rerecordPreparation(c, prep, corrupt), /Corrupt baseline/);
  const altered = structuredClone(exported); altered.report.instances[0].evidence_hash = "0".repeat(64); altered.inventory_hash = evaluationHash(altered.report);
  await assert.rejects(rerecordPreparation(c, prep, altered), /Re-recording changed instances/);
  assert.deepEqual(await snapshot(), before);
});
test("T2e wrong principal, context/access drift and missing/duplicate members fail", async () => {
  const i = prep.instances[0], p = await syntheticPrincipal();
  await assert.rejects(inspectInstance(c, i, await syntheticPrincipal("crm-receiver")), /Wrong principal/);
  await chooseWorkingCompany(p, { company_id: null }); await assert.rejects(inspectInstance(c, i, p), /Working-company drift/);
  await chooseWorkingCompany(p, { company_id: i.working_company_id });
  const broken = structuredClone(prep); broken.instances.pop(); await assert.rejects(exportPreparation(c, broken), /Missing or duplicate catalogue members/);
  const duplicate = structuredClone(prep); duplicate.instances[1] = duplicate.instances[0]; await assert.rejects(exportPreparation(c, duplicate), /Missing or duplicate catalogue members/);
  await assert.rejects(inspectInstance(c, { ...i, participants: [] }, p), /Reader drift/);
});
test("T2e canonical source change invalidates the original gold/evidence binding without replacing the trigger", async () => {
  const i = prep.instances.find(i => i.case_id === "L01")!, p = await syntheticPrincipal();
  const before = await inspectInstance(c, i, p);
  await activityCommand(p, i.aliases.A1, { operation_id: randomUUID(), schema_version: 1, reason: "SYN drift proof", expected_version: 1,
    owner_id: p.actor_id, summary: "SYN changed fact", due_at: null, due_needed: true }, "update");
  await assert.rejects(inspectInstance(c, i, p), /L01:A1.summary/);
  assert.equal((await database().query("SELECT state FROM ppo.assistant_turns WHERE id=$1", [before.turn_id])).rows[0].state, "Queued");
});

test("T2e commitment guard observes and preserves an Unknown reservation in the separate regression fixture", async () => {
  const p = await syntheticPrincipal();
  const thread = await begin(p, await newDeal(p));
  const message = await post(p, thread, { body: "SYN @{1} separate budget guard fixture", mentions: [{ ordinal: 1, kind: "Agent" }] });
  const turn = (await database().query("SELECT id FROM ppo.assistant_turns WHERE trigger_message_id=$1", [message])).rows[0].id;
  // Separate schema-level budget fixture, never a retained corpus member; no worker or provider dispatch.
  await database().query("UPDATE ppo.assistant_turns SET state='Answering',version=version+1,started_at=clock_timestamp(),lease_until=clock_timestamp()+interval '2 minutes',adapter='Simulated',model='simulated-1' WHERE id=$1", [turn]);
  const id = await transaction(client => reserveCall(client, p.workspace_id, turn, 1, priceFor("Simulated", "simulated-1")!, turnLimits));
  await transaction(client => keepUnknown(client, p.workspace_id, id));
  const before = await snapshot(); assert.ok((await preparationBlockers()).includes("Existing commitments"));
  await assert.rejects(materialiseCatalogue(c), /Existing commitments/); assert.deepEqual(await snapshot(), before);
  assert.equal((await database().query("SELECT state FROM ppo.assistant_budget_entries WHERE id=$1", [id])).rows[0].state, "Unknown");
});

test("T2e current ask-duty revocation is rejected before envelope export", async () => {
  const p = await syntheticPrincipal();
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='conversation.agent.ask'", [p.workspace_id, p.actor_id]);
  await assert.rejects(inspectInstance(c, prep.instances[0], p), /Tagger authority drift/);
});

test("T2e client ownership fails closed for unowned sessions and insufficient statistics visibility", async () => {
  const other = new pg.Client({ connectionString: localConfig().database_url, application_name: "SYN separate worker" });
  await other.connect();
  try {
    await assert.rejects(preparationSafety(), /Other clients present/);
    await other.query("SET application_name='PPO-P01'");
    await assert.rejects(preparationSafety(), /Unowned connections present/);
  } finally { await other.end(); }
  const witness = await database().connect();
  try { await transaction(async client => {
    await client.query("SET LOCAL ROLE pg_read_all_settings");
    // This built-in role has no pg_read_all_stats. No grant/account/credential mutation.
    const hidden = await client.query("SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND backend_type IS NULL");
    assert.ok(hidden.rows[0].n > 0, "Other roles' backend type is hidden without statistics visibility");
    await assert.rejects(assertExclusiveClients(client, database().totalCount), /Full client statistics visibility required/);
  }); } finally { witness.release(); }
  await preparationSafety();
});
