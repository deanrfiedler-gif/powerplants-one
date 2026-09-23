import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  previewImport,
  requireConfirmableImport,
} from "../../src/estimating/fertigation/interchange";
import {
  bindingPaths,
  proposedPlacement,
  type Placement,
} from "../../src/estimating/fertigation/import-placement";
import { valveCsv } from "../../src/estimating/fertigation/output";
import { AppError } from "../../src/platform/errors";
import { scenarioComparisonScope } from "../helpers/fertigation-scenarios";

// r02's own synthetic sample project, read from the issued r02 workbench
// (reference/ui/priva-fertigation-scoping-workbench-r02.html) with the two
// file-level keys its "Download project" adds.
const raw = readFileSync(
  "tests/fixtures/fertigation-r02-sample-export.json",
  "utf8",
);
const target = "7a1c3f4e-2b5d-4c6e-8f90-1a2b3c4d5e6f";
const proposed = (preview: ReturnType<typeof previewImport>): Placement[] =>
  preview.losses.map((l) => ({
    path: l.path,
    disposition: proposedPlacement(l.path),
  }));
const code = (name: string) => (e: unknown) =>
  e instanceof AppError && e.code === name;

test("FN-T109 a genuine r02 project is held until every field is placed, then imports with each kept value exactly once", () => {
  const preview = previewImport(raw, target);
  assert.equal(preview.held, true);
  assert.ok(preview.losses.length >= 80);
  assert.throws(
    () =>
      requireConfirmableImport(
        preview,
        preview.source_hash,
        preview.preview_hash,
      ),
    code("HeldFertigationImport"),
  );
  const placements = proposed(preview);
  const scope = requireConfirmableImport(
    preview,
    preview.source_hash,
    preview.preview_hash,
    placements,
  );
  const text = JSON.stringify(scope);
  const kept = placements.filter((p) => p.disposition === "keep_as_note");
  assert.equal(
    (text.match(/\(unverified source value\)/g) ?? []).length,
    kept.length,
    "every kept value appears exactly once",
  );
  assert.equal(
    placements.length - kept.length,
    bindingPaths.length,
    "only the project identity is left to the Discovery binding",
  );
  assert.ok(!text.includes("Northbank Berries — synthetic"));
  const generated = scope.evidence.filter((e) =>
    e.label.startsWith("Legacy r02 source values"),
  );
  assert.ok(generated.length >= 1);
  assert.ok(generated.every((e) => e.sha256 === preview.source_hash));
  assert.ok(generated.every((e) => e.notes.length <= 4000));
  const area = scope.areas.find((a) => a.label === "A · Blueberries")!;
  assert.match(area.notes, /Legacy r02 rows: 40 \(unverified source value\)/);
  assert.match(
    scope.hydraulics.notes,
    /Legacy r02 loss_flow_basis: Assumed losses at 28/,
  );
  assert.deepEqual(
    requireConfirmableImport(
      preview,
      preview.source_hash,
      preview.preview_hash,
      placements,
    ),
    scope,
    "placement is deterministic",
  );
});

test("FN-T110 incomplete, unknown, duplicate or disallowed placements are refused, as is any placement on a preview that is not held", () => {
  const preview = previewImport(raw, target);
  const all = proposed(preview);
  const confirm = (placements: Placement[]) =>
    requireConfirmableImport(
      preview,
      preview.source_hash,
      preview.preview_hash,
      placements,
    );
  assert.throws(() => confirm(all.slice(1)), code("HeldFertigationImport"));
  assert.throws(
    () =>
      confirm([
        ...all,
        { path: "project.unknown", disposition: "keep_as_note" },
      ]),
    code("InvalidData"),
  );
  assert.throws(() => confirm([...all, all[0]]), code("InvalidData"));
  const notBinding = all.find(
    (p) => !(bindingPaths as readonly string[]).includes(p.path),
  )!;
  assert.throws(
    () =>
      confirm(
        all.map((p) =>
          p === notBinding
            ? { ...p, disposition: "covered_by_discovery_binding" as const }
            : p,
        ),
      ),
    code("InvalidData"),
  );
  const unheld = previewImport(valveCsv(scenarioComparisonScope()), target);
  assert.equal(unheld.held, false);
  assert.throws(
    () =>
      requireConfirmableImport(
        unheld,
        unheld.source_hash,
        unheld.preview_hash,
        [{ path: "project.name", disposition: "keep_as_note" }],
      ),
    code("InvalidData"),
  );
});
