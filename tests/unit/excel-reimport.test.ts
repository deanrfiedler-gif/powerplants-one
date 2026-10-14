import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import {
  buildComparison,
  lineDecisions,
  projectComparison,
  workbookLine,
} from "../../src/estimating/import/comparison";
import { reviewWorkbook } from "../../src/estimating/import/review";
import { readWorkbook } from "../../src/estimating/import/reader";
import type { EstimateVersion } from "../../src/estimating/context";
import { nativeWorkbook, unitTarget, setCell } from "../helpers/excel-review";
import { workbookBytes } from "../helpers/excel-workbook";
import { reorderWorkbook } from "../helpers/excel-reimport";
async function fixture() {
  const target = unitTarget(),
    parts = nativeWorkbook(target);
  const review = reviewWorkbook(
    await readWorkbook(workbookBytes(parts), "SYN.xlsx"),
    target,
    "2026-10-14",
  );
  assert.equal(review.validation_passed, true);
  const version = randomUUID(),
    mappings = review.lines.map((l) => ({
      estimate_version_id: version,
      line_ref: l.line_ref!,
      line_id: randomUUID(),
    }));
  const current = {
    id: version,
    estimate_id: randomUUID(),
    version: 1,
    content_hash: "a".repeat(64),
    title: review.metadata.title,
    scope: {
      included: review.scope_comparison[0].proposed,
      excluded: review.scope_comparison[1].proposed,
      assumptions: review.scope_comparison[2].proposed,
    },
    lines: review.lines.map((l, i) => workbookLine(l, mappings[i].line_id)),
  } as EstimateVersion;
  const history = [{ estimate_version_id: version, version: 1, review }];
  const compare = (next = review) =>
    buildComparison(target.workspace_id, next, current, history, mappings);
  return { target, parts, review, current, history, mappings, compare };
}
test("XI05 reordered rows and decimal formatting do not manufacture changes or identities", async () => {
  const f = await fixture();
  reorderWorkbook(f.parts);
  f.current.lines[0].quantity = "1.000";
  f.current.lines[0].unit_cost = "14500.00";
  const review = reviewWorkbook(
    await readWorkbook(workbookBytes(f.parts), "SYN.xlsx"),
    f.target,
    "2026-10-14",
  );
  const compared = f.compare(review);
  assert.ok(compared.lines.every((l) => l.kind === "Unchanged"));
  assert.equal(compared.lines[0].line_id, f.mappings[1].line_id);
  assert.deepEqual(compared.omissions, []);
});
test("XI05 inclusion changes affect comparison even without native price changes; new keys are namespaced", async () => {
  const f = await fixture();
  setCell(f.parts, 5, "M6", "No");
  setCell(f.parts, 5, "A7", "NEW-STABLE");
  const review = reviewWorkbook(
    await readWorkbook(workbookBytes(f.parts), "SYN.xlsx"),
    f.target,
    "2026-10-14",
  );
  const compared = f.compare(review),
    again = f.compare(review);
  assert.equal(compared.lines[0].kind, "Changed");
  assert.deepEqual(
    compared.lines[0].changes.map((c) => c.field),
    ["print"],
  );
  assert.equal(compared.lines[1].line_id, again.lines[1].line_id);
  const other = buildComparison(
    randomUUID(),
    review,
    f.current,
    f.history,
    f.mappings,
  );
  assert.notEqual(compared.lines[1].line_id, other.lines[1].line_id);
  assert.throws(() => projectComparison(compared, []), {
    code: "ExcelImportDecisionsRequired",
  });
  const keep = projectComparison(compared, [
    { line_id: f.mappings[1].line_id, action: "Keep" },
  ]);
  assert.equal(keep.length, 13);
  assert.deepEqual(keep.at(-1)!.line, f.current.lines[1]);
  assert.equal(keep.at(-1)!.retained_from, f.current.id);
});
test("XI04 decisions are exact, bounded and canonical for original-operation recovery", () => {
  const a = randomUUID(),
    b = randomUUID();
  assert.deepEqual(
    lineDecisions([
      { line_id: a, action: "Keep" },
      { line_id: b, action: "Remove" },
    ]),
    lineDecisions([
      { line_id: b, action: "Remove" },
      { line_id: a, action: "Keep" },
    ]),
  );
  for (const value of [
    [
      { line_id: a, action: "Keep" },
      { line_id: a, action: "Remove" },
    ],
    [{ line_id: a, action: "Infer" }],
    [{ line_id: a, action: "Keep", price: 5 }],
    null,
  ])
    assert.throws(() => lineDecisions(value), { code: "InvalidData" });
});
