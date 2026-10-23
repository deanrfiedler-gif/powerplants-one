import assert from "node:assert/strict";
import https from "node:https";
import { after, before, mock, test } from "node:test";
import { reset } from "../../scripts/database";
import { database, closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { materialiseCatalogue, exportPreparation, inspectInstance, syntheticPrincipal, verifyPreparation, type Preparation } from "../../scripts/t2e-preparation";
import { readCatalogue } from "../../scripts/t2e-catalogue";
import { evaluationHash, parseEvaluation } from "../../src/assistant/evaluation";
import { chooseWorkingCompany } from "../../src/shell/company";
import { activityCommand } from "../../src/activities/activities";
import { randomUUID } from "node:crypto";
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
  await reset(); prep = await materialiseCatalogue(c);
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
  await assert.rejects(materialiseCatalogue(c), /Existing preparation/);
});
test("T2e wrong principal, context/access drift and missing/duplicate members fail", async () => {
  const i = prep.instances[0], p = await syntheticPrincipal();
  await assert.rejects(inspectInstance(c, i, await syntheticPrincipal("crm-receiver")), /Wrong principal/);
  await chooseWorkingCompany(p, { company_id: null }); await assert.rejects(inspectInstance(c, i, p), /Working-company drift/);
  await chooseWorkingCompany(p, { company_id: i.working_company_id });
  const broken = structuredClone(prep); broken.instances.pop(); await assert.rejects(exportPreparation(c, broken));
  const duplicate = structuredClone(prep); duplicate.instances[1] = duplicate.instances[0]; await assert.rejects(exportPreparation(c, duplicate));
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

test("T2e current ask-duty revocation is rejected before envelope export", async () => {
  const p = await syntheticPrincipal();
  await database().query("DELETE FROM ppo.permission_grants WHERE workspace_id=$1 AND user_id=$2 AND capability='conversation.agent.ask'", [p.workspace_id, p.actor_id]);
  await assert.rejects(inspectInstance(c, prep.instances[0], p), /Tagger authority drift/);
});
