import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import http from "node:http";
import https from "node:https";
import { mock } from "node:test";
import { closeDatabase } from "../src/platform/database";
import { prepareCorpus, inspectCorpus, type Corpus } from "../tests/helpers/assistant-evaluation-corpus";
import { digest, loadCatalogue } from "./assistant-evaluation-catalogue";

// No worker, adapter.answer or credential loader is invoked. Defence in depth for accidental
// future network calls; PostgreSQL uses its separate local socket transport.
export function blockProviderNetwork() {
  const denied = () => { throw Error("T2e offline preparation forbids HTTP"); };
  mock.method(globalThis, "fetch", denied);
  mock.method(http, "request", denied); mock.method(http, "get", denied);
  mock.method(https, "request", denied); mock.method(https, "get", denied);
}
export async function runPreparation(command: string, folder: string, corpusPath?: string) {
  loadCatalogue();
  const output = resolve(folder);
  if (command === "prepare" || command === "export") {
    // Refuse overwrite before creating any records; a failed partial preparation stays visible.
    mkdirSync(output, { recursive: false });
    assert.equal(command === "export", !!corpusPath, "export requires an existing corpus file");
    const corpus: Corpus = corpusPath ? JSON.parse(readFileSync(corpusPath, "utf8")) : await prepareCorpus();
    writeFileSync(resolve(output, "corpus.json"), JSON.stringify(corpus, null, 2) + "\n", { flag: "wx" });
    const inventory = await inspectCorpus(corpus);
    const content = { ...inventory, preparation_commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
      tracked_changes_at_preparation: execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }).trim().split("\n").filter(Boolean) };
    const review = { ...content, inventory_hash: digest(content) };
    writeFileSync(resolve(output, "inventory.json"), JSON.stringify(review, null, 2) + "\n", { flag: "wx" });
    writeFileSync(resolve(output, "review.md"), reviewTable(review), { flag: "wx" });
    writeFileSync(resolve(output, "cases.md"), caseCards(review), { flag: "wx" });
    return { cases: review.instances.length, inventory_hash: review.inventory_hash };
  }
  assert.equal(command, "verify", "use prepare or verify");
  const corpus: Corpus = JSON.parse(readFileSync(resolve(output, "corpus.json"), "utf8"));
  const saved = JSON.parse(readFileSync(resolve(output, "inventory.json"), "utf8"));
  const current = await inspectCorpus(corpus);
  checkReviewSnapshot(current, saved);
  checkReviewArtifacts(output, saved);
  return { cases: current.instances.length, inventory_hash: saved.inventory_hash };
}
type Inventory = Awaited<ReturnType<typeof inspectCorpus>>;
export type ReviewSnapshot = Inventory & { preparation_commit: string; tracked_changes_at_preparation: string[]; inventory_hash: string };
export function reviewTable(review: ReviewSnapshot) {
  const lines = ["# T2e synthetic case review", "", "Proposed offline instances; no approved run, live results or model scores.",
      "", `Inventory hash: ${review.inventory_hash}`, "", "| Case | Model | Repeat | Sources | Input bound | History omitted |", "|---|---|---:|---:|---:|---:|",
      ...review.instances.map(i => `| ${i.case_id} | ${i.model} | ${i.repetition} | ${i.sources.length} | ${i.estimated_input_tokens} | ${i.history_left_out} |`),
      "", "Inspect inventory.json for exact questions, expected assertions, proposed source mappings, canonical fields, source versions, participants, excluded sentinel placement and rubric applicability.",
      "Input bounds are the existing conservative byte meter, not measured tokens. Review the corpus and source mappings before any approval.",
      "No approval_reference, run_id or usable live manifest is emitted. Re-verify against the retained database before review or later run preparation.", ""];
  return lines.join("\n");
}

// Verify the human-readable projections too: a valid JSON inventory alone does not
// establish that the cards/table presented for approval still describe that inventory.
export function checkReviewArtifacts(folder: string, review: ReviewSnapshot) {
  for (const [name, expected] of [["cases.md", caseCards(review)], ["review.md", reviewTable(review)]])
    assert.equal(readFileSync(resolve(folder, name), "utf8").replace(/\r\n/g, "\n"), expected, `${name} must match the retained inventory`);
}

export function caseCards(review: ReviewSnapshot) {
  const lines = ["# T2e synthetic cases for review", "", "Proposed offline review material; no model results, owner acceptance or live authority.", "",
    `Preparation commit: ${review.preparation_commit}. Inventory hash: ${review.inventory_hash}.`, "",
    "These cards show the first sample's gold bindings for each case; inventory.json contains all independently identified instances.",
    "Application invariants are pass/fail checks, excluded from model scores and gold denominators. Fixed CannotAnswer wording earns no model wording points.",
    "Review all model claims, including volunteered L11 facts. Compare citation identities with stored source mappings: displayed citation numbers can differ from envelope S numbers.",
    "Input bounds are conservative byte estimates, not measured token usage.", ""];
  for (const caseId of [...new Set(review.instances.map(i => i.case_id))]) {
    const instances = review.instances.filter(i => i.case_id === caseId), first = instances[0];
    lines.push(`## ${caseId} — ${first.stage}`, "", `${instances.length} independent samples.`, "",
      `**Question:** ${first.question}`, "", "**Expected assertions and source bindings:**", "");
    for (const gold of first.gold) {
      lines.push(`- ${gold.assertion}`, `  - Assessment: ${gold.assessment}`);
      for (const binding of gold.bindings)
        lines.push("rule" in binding ? `  - Rule: ${binding.rule}`
          : `  - ${binding.alias} / ${binding.source_id}, source version ${binding.source_version}: ${JSON.stringify(binding.fields)}`);
    }
    lines.push("", "**Scoring applicability (proposed):**", "",
      ...Object.entries(first.rubric).map(([key, rule]) => `- ${key.replaceAll("_", " ")}: ${rule}`), "",
      `Requirements: ${first.requirements.join(", ")}.`, "");
  }
  return lines.join("\n");
}
export function checkReviewSnapshot(current: Inventory, saved: ReviewSnapshot) {
  // Retrieved-at timestamps change on each read; the runtime evidence hash deliberately excludes them.
  // Compare exact stable facts/membership/request bounds and proposal content, not those read timestamps.
  const stable = (x: Inventory) => ({ ...x, instances: x.instances.map(i => ({ ...i,
    envelope: { ...i.envelope, items: i.envelope.items.map(({ retrieved_at: _, ...s }) => s) },
  })) });
  const { inventory_hash: savedHash, ...signedContent } = saved;
  const { preparation_commit, tracked_changes_at_preparation, ...savedInventory } = signedContent;
  assert.match(preparation_commit, /^[0-9a-f]{40}$/);
  assert.ok(Array.isArray(tracked_changes_at_preparation) && tracked_changes_at_preparation.every(p => typeof p === "string"));
  assert.equal(digest(stable(current)), digest(stable(savedInventory)), "prepared source or review material changed");
  assert.equal(savedHash, digest(signedContent), "review content and preparation metadata must match their retained hash");
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  blockProviderNetwork();
  try {
    const command = process.argv[2];
    assert.equal(process.argv.length, command === "export" ? 5 : 4);
    console.log(await runPreparation(command, command === "export" ? process.argv[4] : process.argv[3],
      command === "export" ? process.argv[3] : undefined));
  } catch {
    console.error("T2e offline preparation refused or validation failed. Retain partial artifacts; use focused synthetic tests to diagnose.");
    process.exitCode = 1;
  } finally { mock.restoreAll(); await closeDatabase(); }
}
