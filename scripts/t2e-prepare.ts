import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { readCatalogue, validateCatalogue, catalogueHash, expandCatalogue } from "./t2e-catalogue";
import { exportPreparation, materialiseCatalogue, verifyPreparation, type Preparation } from "./t2e-preparation";
import { closeDatabase } from "../src/platform/database";
// No env-file loader, provider adapter, worker, approval fields or live-run manifest generator.
const [mode, directory, ownership] = process.argv.slice(2);
try {
  const c = validateCatalogue(readCatalogue());
  if (mode === "validate") console.log(JSON.stringify({ fixture_set: c.fixture_set, catalogue_hash: catalogueHash(c), calibration: 9, main: 108, proposed_turns: expandCatalogue(c).length, offline_proofs: c.offline_proofs.length }));
  else {
    assert.ok(["materialise", "export"].includes(mode) && directory && ownership === "--exclusive-local-owner", "Use validate, or materialise/export DIRECTORY --exclusive-local-owner");
    const dir = resolve(directory), statePath = resolve(dir, "preparation.json"), baseline = resolve(dir, "proposed-inventory.json");
    if (mode === "materialise") {
      // Before the first DB write: a failed or interrupted attempt remains visibly claimed.
      // Never delete this marker to retry; preserve partial state and ask for reviewed recovery.
      writeFileSync(resolve(dir, "preparation-started.json"), JSON.stringify({ kind: "OfflinePreparationAttempt", catalogue_hash: catalogueHash(c), source_commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() }), { flag: "wx" });
      const prep = await materialiseCatalogue(c);
      writeFileSync(statePath, JSON.stringify(prep, null, 2) + "\n", { flag: "wx" });
      const result = await exportPreparation(c, prep);
      writeFileSync(baseline, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
      console.log(JSON.stringify({ proposed_turns: prep.instances.length, inventory_hash: result.inventory_hash, forecast: result.report.forecast }));
    } else {
      const prep = JSON.parse(readFileSync(statePath, "utf8")) as Preparation;
      const expected = JSON.parse(readFileSync(baseline, "utf8"));
      const current = await verifyPreparation(c, prep, expected);
      console.log(JSON.stringify({ verified_members: current.report.instances.length, inventory_hash: current.inventory_hash, forecast: current.report.forecast }));
    }
  }
} catch {
  // Diagnostics never print command input, connection strings, rows or environment values.
  console.error("T2e preparation refused. Preserve the original state; inspect with the bounded offline tests and review the operator chapter.");
  process.exitCode = 1;
} finally { await closeDatabase(); }
