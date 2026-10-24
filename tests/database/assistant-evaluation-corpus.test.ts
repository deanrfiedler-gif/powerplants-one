import assert from "node:assert/strict";
import { after, mock, test } from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { reset } from "../../scripts/database";
import { closeDatabase } from "../../src/platform/database";
import { localConfig } from "../../src/platform/config";
import { blockProviderNetwork, caseCards, runPreparation } from "../../scripts/assistant-evaluation-prepare";
import { prepareCorpus, inspectCorpus, type Corpus } from "../helpers/assistant-evaluation-corpus";
import { loadCatalogue, digest } from "../../scripts/assistant-evaluation-catalogue";
import { rows, principal, profiles } from "../helpers/conversations";
import { activityCommand } from "../../src/activities/activities";
import { crmBase } from "../helpers/crm";

if (localConfig().database_name !== "ppo_synthetic_test") throw Error("Only disposable ppo_synthetic_test");
process.env.PPO_ALLOW_RESET = "dispose-synthetic"; process.env.PPO_RESET_DATABASE = "ppo_synthetic_test";
process.env.PPO_ASSISTANT = "off"; process.env.PPO_T2E_PREPARATION = "exclusive-offline-synthetic";
blockProviderNetwork();
after(async () => { mock.restoreAll(); await closeDatabase(); });
// This new full-matrix proof creates 117 isolated samples, including 18 long histories,
// then verifies every sample twice. It has its own bounded deadline; no existing suite is relaxed.
test("T2e canonical 117-instance corpus exports and revalidates offline, rejecting reuse, tamper and source drift", { timeout: 900000 }, async () => {
  await reset();
  // The existing CI review-artifact step retains this explicitly synthetic material.
  // No workflow or provider payload capture is added.
  mkdirSync("verification-evidence/t2e-preparation", { recursive: true });
  const root = mkdtempSync(join("verification-evidence/t2e-preparation", "corpus-")), folder = join(root, "review");
  const result = await runPreparation("prepare", folder);
  assert.equal(result.cases, 117);
  const corpus: Corpus = JSON.parse(readFileSync(join(folder, "corpus.json"), "utf8"));
  const saved = JSON.parse(readFileSync(join(folder, "inventory.json"), "utf8"));
  assert.equal(saved.instances.length, 117);
  assert.equal(readFileSync(join(folder, "cases.md"), "utf8"), caseCards(saved), "review cards must be generated from the exact retained inventory");
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.assistant_turns WHERE state='Queued' AND model_calls=0"))[0].n, 117);
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.assistant_budget_entries"))[0].n, 0);
  await closeDatabase();
  const readOnlyCounts = () => rows("SELECT (SELECT count(*)::int FROM ppo.audit_events) AS audit, (SELECT count(*)::int FROM ppo.sessions) AS sessions, (SELECT count(*)::int FROM ppo.operation_receipts) AS receipts");
  const beforeVerify = await readOnlyCounts();
  assert.deepEqual(await runPreparation("verify", folder), result);
  assert.deepEqual(await readOnlyCounts(), beforeVerify, "inspection must not create sessions, audit or receipts");
  for (const name of ["cases.md", "review.md"]) {
    const path = join(folder, name), originalReview = readFileSync(path, "utf8");
    writeFileSync(path, originalReview + "\nSYN tampered approval\n");
    await assert.rejects(runPreparation("verify", folder), /must match the retained inventory/);
    writeFileSync(path, originalReview);
  }
  await assert.rejects(runPreparation("prepare", folder));
  await assert.rejects(prepareCorpus());
  const bad = structuredClone(corpus); bad.instances[0].message_id = bad.instances[1].message_id;
  await assert.rejects(inspectCorpus(bad));
  const changed = loadCatalogue(); changed.cases[0].question += " SYN changed";
  await assert.rejects(inspectCorpus(corpus, changed));
  const original = readFileSync(join(folder, "inventory.json"), "utf8");
  saved.instances[0].gold[0].assertion = "SYN tampered approval";
  writeFileSync(join(folder, "inventory.json"), JSON.stringify(saved));
  await assert.rejects(runPreparation("verify", folder));
  writeFileSync(join(folder, "inventory.json"), original);
  const p = await principal(profiles.coordinator), activity = corpus.instances.find(i => i.case_id === "L03")!.aliases.A2;
  const a = (await rows("SELECT version,summary,owner_id FROM ppo.activities WHERE id=$1", [activity]))[0];
  await activityCommand(p, activity, { ...crmBase(), expected_version: a.version, owner_id: a.owner_id, summary: a.summary,
    due_at: "2027-12-01T23:00:00.000Z", due_needed: false }, "update");
  await assert.rejects(runPreparation("verify", folder));
  assert.equal((await rows("SELECT count(*)::int AS n FROM ppo.assistant_budget_entries"))[0].n, 0);
  assert.equal(corpus.catalogue_hash, digest(loadCatalogue()));
  // Restore the intended value through the service, retaining both revisions. A new offline
  // export binds the changed version; it never overwrites the original review or grants approval.
  await activityCommand(p, activity, { ...crmBase(), expected_version: a.version + 1, owner_id: a.owner_id, summary: a.summary,
    due_at: "2027-11-29T23:00:00.000Z", due_needed: false }, "update");
  const refreshed = join(root, "refreshed-review");
  const next = await runPreparation("export", refreshed, join(folder, "corpus.json"));
  assert.notEqual(next.inventory_hash, result.inventory_hash);
  assert.deepEqual(await runPreparation("verify", refreshed), next);
  writeFileSync(join(root, "proof.json"), JSON.stringify({ evidence_class: "Persisted synthetic integration",
    cases: 117, calibration: 9, evaluation: 108, provider_calls: 0, budget_entries: 0,
    initial_inventory_hash: result.inventory_hash, refreshed_inventory_hash: next.inventory_hash,
    verified: ["matrix", "sentinels", "gold", "fitting", "read-only", "reopen", "reuse refusal", "tamper refusal", "source drift", "re-export"],
    acceptance: "Proposed review material only; no live authority" }, null, 2) + "\n");
});
