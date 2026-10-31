import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { readCatalogue, validateCatalogue, catalogueHash, expandCatalogue, type Catalogue } from "./t2e-catalogue";
import { claimPreparationAttempt, exportPreparation, materialiseCatalogue, verifyPreparation, rerecordPreparation, type Preparation } from "./t2e-preparation";
import { checkReviewDocuments, checkReviewPackage, writeReviewPackage } from "./t2e-review";
import { closeDatabase } from "../src/platform/database";
// No env-file loader, provider adapter, worker, approval fields or live-run manifest generator.
const [mode, directory, ...args] = process.argv.slice(2);
try {
  const c = validateCatalogue(readCatalogue());
  if (mode === "validate") {
    assert.equal(directory, undefined); assert.equal(args.length, 0);
    console.log(JSON.stringify({ fixture_set: c.fixture_set, catalogue_hash: catalogueHash(c), calibration: 9, main: 108, proposed_turns: expandCatalogue(c).length, offline_proofs: c.offline_proofs.length }));
  } else if (mode === "review") {
    // Offline: the retained inventory, its catalogue binding and both review documents beside it.
    assert.ok(directory); assert.equal(args.length, 0);
    const result = checkReviewPackage(c, resolve(directory));
    console.log(JSON.stringify({ reviewed_members: result.report.instances.length, inventory_hash: result.inventory_hash, documents: ["cases.md", "review.md"] }));
  } else {
    assert.ok(["materialise", "export", "rerecord"].includes(mode) && directory);
    const options = new Map<string, string>();
    for (let n = 0; n < args.length; n++) {
      const flag = args[n]; assert.ok(!options.has(flag), "Duplicate option");
      if (flag === "--exclusive-local-owner") options.set(flag, "true");
      else { assert.ok(["--baseline", "--output", "--previous-catalogue"].includes(flag));
        const value = args[++n]; assert.ok(value && !value.startsWith("--")); options.set(flag, value); }
    }
    assert.ok(options.has("--exclusive-local-owner"), "Exclusive owner assertion required");
    assert.ok(mode === "rerecord" || (!options.has("--output") && !options.has("--previous-catalogue")));
    assert.ok(mode !== "materialise" || !options.has("--baseline"));
    const dir = resolve(directory), statePath = resolve(dir, "preparation.json");
    const baseline = resolve(options.get("--baseline") ?? resolve(dir, "proposed-inventory.json"));
    const attempt = () => ({ kind: "OfflinePreparationAttempt", catalogue_hash: catalogueHash(c), source_commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() });
    const write = (path: string, value: unknown) => writeFileSync(path, JSON.stringify(value, null, 2) + "\n", { flag: "wx" });
    if (mode === "materialise") {
      claimPreparationAttempt(resolve(dir, "preparation-started.json"), attempt());
      const prep = await materialiseCatalogue(c);
      write(statePath, prep);
      const result = await exportPreparation(c, prep); writeReviewPackage(baseline, c, result);
      console.log(JSON.stringify({ proposed_turns: prep.instances.length, inventory_hash: result.inventory_hash, forecast: result.report.forecast }));
    } else {
      const prep = JSON.parse(readFileSync(statePath, "utf8")) as Preparation;
      const expected = JSON.parse(readFileSync(baseline, "utf8"));
      if (mode === "export") {
        const current = await verifyPreparation(c, prep, expected);
        checkReviewDocuments(dirname(baseline), c, current);
        console.log(JSON.stringify({ verified_members: current.report.instances.length, inventory_hash: current.inventory_hash, forecast: current.report.forecast }));
      } else {
        assert.ok(options.has("--output"), "Separate output directory required");
        const out = resolve(options.get("--output")!); assert.notEqual(out, dir);
        claimPreparationAttempt(resolve(out, "preparation-started.json"), { ...attempt(), kind: "OfflineRerecordingAttempt", previous_inventory_hash: expected.inventory_hash });
        const previous = options.get("--previous-catalogue");
        const result = await rerecordPreparation(c, prep, expected, previous ? JSON.parse(readFileSync(resolve(previous), "utf8")) as Catalogue : undefined);
        write(resolve(out, "preparation.json"), result.preparation); writeReviewPackage(resolve(out, "proposed-inventory.json"), c, result.current);
        write(resolve(out, "rerecording-provenance.json"), result.provenance);
        console.log(JSON.stringify(result.provenance));
      }
    }
  }
} catch {
  // Diagnostics never print command input, connection strings, rows or environment values.
  console.error("T2e preparation refused. Preserve the original state; inspect with the bounded offline tests and review the operator chapter.");
  process.exitCode = 1;
} finally { await closeDatabase(); }
