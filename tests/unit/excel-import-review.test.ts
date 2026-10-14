import assert from "node:assert/strict";
import { test } from "node:test";
import { readWorkbook } from "../../src/estimating/import/reader";
import { reviewWorkbook } from "../../src/estimating/import/review";
import {
  workbookDate,
  workbookNumber,
} from "../../src/estimating/import/values";
import { unitTarget, nativeWorkbook, setCell } from "../helpers/excel-review";
import {
  workbookBytes,
  linesSheet,
  linesTable,
  type WorkbookParts,
} from "../helpers/excel-workbook";

const target = unitTarget();
async function review(edit: (parts: WorkbookParts) => void = () => {}) {
  const parts = nativeWorkbook(target);
  edit(parts);
  return reviewWorkbook(
    await readWorkbook(workbookBytes(parts), "SYN-review.xlsx"),
    target,
    "2026-10-14",
  );
}
const codes = (r: Awaited<ReturnType<typeof review>>) =>
  r.issues.map((i) => i.code);

test("XI01 review retains all 12 lines, seven sections, hidden rows, original formulas and exact totals without import authority", async () => {
  const r = await review();
  assert.equal(r.validation_passed, true, JSON.stringify(r.issues));
  assert.equal(r.state, "ReviewRequired");
  assert.equal(r.can_import, false);
  assert.equal(r.durable, false);
  assert.equal(r.review.recorded, false);
  assert.deepEqual(r.totals, {
    line_count: 12,
    cost: "62952.38",
    sell: "85607.63",
    included_sell: "85607.63",
  });
  assert.equal(r.sections.length, 7);
  assert.equal(r.lines[1].line_ref, "L-002");
  assert.deepEqual(r.lines[3].locator, {
    sheet: "SYN Lines",
    table: "PPO_Lines",
    row: 9,
    range: "A9:Q9",
  });
  assert.equal(r.lines[3].declared_origin.row, "9");
  assert.ok(r.original_tables.PPO_Lines[3].cells.workbook_cost.formula);
  assert.equal(r.issues.filter((i) => i.code === "SourceExpired").length, 6);
  assert.equal(r.review_hash, (await review()).review_hash);
});
test("XI02 offsetting line errors block even when the control total still agrees", async () => {
  const r = await review((p) => {
    setCell(p, 5, "P6", 14501);
    setCell(p, 5, "P7", 1349);
  });
  assert.equal(
    r.reconciliation.find((c) => c.control === "workbook_cost")!.matches,
    true,
  );
  assert.equal(r.validation_passed, false);
  assert.equal(r.issues.filter((i) => i.code === "LineCostMismatch").length, 2);
  assert.equal(r.lines[0].cost_difference, "-1.00");
  assert.equal(r.lines[1].cost_difference, "1.00");
});
test("XI02 missing cost and include preserve independent complete sell and unknown aggregates", async () => {
  const r = await review((p) => {
    setCell(p, 5, "G6", null);
    setCell(p, 5, "L7", null);
  });
  assert.equal(r.totals.cost, null);
  assert.equal(r.totals.sell, "85607.63");
  assert.equal(r.totals.included_sell, null);
  assert.equal(r.section_totals[0].cost, null);
  assert.equal(r.lines[0].unit_cost, null);
  assert.equal(r.lines[0].cost_difference, null);
});
test("XI02 missing references stay inspectable by immutable row locator; duplicate keys and orphan memberships block", async () => {
  const r = await review((p) => {
    setCell(p, 5, "A6", null);
    setCell(p, 5, "A8", "L-002");
    setCell(p, 5, "B9", "not-a-section");
    setCell(p, 5, "J10", "not-a-source");
  });
  assert.equal(r.lines.length, 12);
  assert.equal(r.lines[0].locator.row, 6);
  assert.equal(r.lines[0].line_ref, null);
  for (const code of ["DuplicateKey", "UnknownSection", "UnknownSource"])
    assert.ok(codes(r).includes(code));
});
test("XI02 typed decimals, explicit choices, date agreement, units, categories and below-cost rules apply even to excluded lines", async () => {
  const r = await review((p) => {
    setCell(p, 5, "L6", false);
    setCell(p, 5, "E6", 1.0001);
    setCell(p, 5, "G7", "225");
    setCell(p, 5, "F8", "metres");
    setCell(p, 5, "D9", "Discount");
    setCell(p, 5, "I10", null);
    setCell(p, 5, "H11", 1);
    setCell(p, 5, "K12", "2026-09-12");
  });
  for (const code of [
    "InvalidNumber",
    "UnknownUnit",
    "UnknownCategory",
    "InvalidChoice",
    "BelowCost",
    "SourceDateMismatch",
  ])
    assert.ok(codes(r).includes(code), code);
  assert.equal(r.state, "Blocked");
});
test("XI03 exact context, scope, Facility and Growing-area mismatches cannot be cleared by workbook declarations", async () => {
  const r = await review((p) => {
    setCell(p, 1, "B11", "SYN-other-opportunity");
    setCell(p, 3, "C6", "Changed work");
    setCell(p, 2, "C6", "unknown-facility");
    setCell(p, 2, "D7", "unknown-area");
  });
  for (const code of [
    "MetadataMismatch",
    "ScopeChanged",
    "FacilityOutsideScope",
    "AreaOutsideScope",
  ])
    assert.ok(codes(r).includes(code), code);
});
test("XI02 date validity, unknown validity and review fingerprint remain distinct from business approval", async () => {
  const r = await review((p) => {
    setCell(p, 4, "F6", null);
    setCell(p, 4, "E7", "2026-02-30");
  });
  assert.ok(codes(r).includes("SourceValidityUnknown"));
  assert.ok(codes(r).includes("InvalidDate"));
  const original = await review(),
    changed = await review((p) =>
      setCell(p, 4, "G6", "Changed retained source note"),
    );
  assert.notEqual(original.review_hash, changed.review_hash);
  const book = await readWorkbook(
    workbookBytes(nativeWorkbook(target)),
    "SYN-review.xlsx",
  );
  assert.notEqual(
    original.review_hash,
    reviewWorkbook(book, target, "2026-10-15").review_hash,
  );
});
test("XI07 zero/one/100/500/501 rows and whole-command capacity are explicit; no truncation", async () => {
  const empty = await review((p) => {
    p[linesSheet] = p[linesSheet].replace(
      /<row r="(?:[6-9]|1[0-7])"[^>]*>[\s\S]*?<\/row>/g,
      "",
    );
  });
  assert.equal(empty.totals.cost, null);
  assert.ok(codes(empty).includes("LineCount"));
  const one = await review((p) => {
    p[linesSheet] = p[linesSheet].replace(
      /<row r="(?:[7-9]|1[0-7])"[^>]*>[\s\S]*?<\/row>/g,
      "",
    );
  });
  assert.equal(one.lines.length, 1);
  assert.equal(one.totals.cost, "14500.00");
  assert.equal(one.validation_passed, false);
  const grow = (p: WorkbookParts, count: number, long = false) => {
    const first = p[linesSheet].match(/<row r="6">[\s\S]*?<\/row>/)![0];
    const rows = Array.from({ length: count }, (_, i) =>
      first
        .replace(/r="([A-Z]*)6"/g, (_, col) => `r="${col}${i + 6}"`)
        .replace("L-001", `L-${i + 1}`)
        .replace(
          "Climate controller and interface",
          long ? "測".repeat(300) : "SYN line",
        ),
    ).join("");
    p[linesSheet] = p[linesSheet].replace(
      /<sheetData>[\s\S]*?<\/sheetData>/,
      (all) =>
        all.replace(/<row r="6">[\s\S]*<\/sheetData>/, rows + "</sheetData>"),
    );
    p[linesTable] = p[linesTable].replace("Q105", `Q${count + 5}`);
  };
  const hundred = await review((p) => grow(p, 100));
  assert.equal(hundred.lines.length, 100);
  const large = await review((p) => grow(p, 100, true));
  assert.ok(!codes(large).includes("ReceiverPayloadTooLarge"));
  assert.equal((await review((p) => grow(p, 500))).lines.length, 500);
  await assert.rejects(
    review((p) => grow(p, 501)),
    /500 populated/,
  );
});
test("exact numeric conversion accepts exponent/trailing zeros but refuses precision loss, bounds and false dates", () => {
  const n = (value: string) => ({
    kind: "number" as const,
    value,
    formula: null,
  });
  for (const value of ["1", "1.0000", "1e0", "100e-2", "+.1e1"])
    assert.equal(workbookNumber(n(value), 3, 100000000n), "1.000");
  for (const value of ["1.0001", "-1", "1e99999", "100001", "NaN"])
    assert.equal(workbookNumber(n(value), 3, 100000000n), null);
  assert.equal(workbookDate(n("1")), "1900-01-01");
  assert.equal(workbookDate(n("59")), "1900-02-28");
  assert.equal(workbookDate(n("61")), "1900-03-01");
  assert.equal(workbookDate(n("60")), null);
  assert.equal(workbookDate(n("61.5")), null);
  assert.equal(workbookDate(n("2958465")), "9999-12-31");
});
