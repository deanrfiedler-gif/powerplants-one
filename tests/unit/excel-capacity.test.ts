import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { readWorkbook } from "../../src/estimating/import/reader";
import { reviewWorkbook } from "../../src/estimating/import/review";
import { workbookLine } from "../../src/estimating/import/comparison";
import { costingInput } from "../../src/estimating/cost-basis-validation";
import { parseLines, parseQuoteChoices } from "../../src/estimating/validation";
import { EXCEL_CAPACITY } from "../../src/estimating/import/capacity";
import { canonical } from "../../src/platform/operations";
import { nativeWorkbook, unitTarget, setCell } from "../helpers/excel-review";
import { workbookBytes } from "../helpers/excel-workbook";
import { capacityWorkbook } from "../helpers/excel-capacity";
async function fixture(count: number) {
  const target = unitTarget(),
    parts = nativeWorkbook(target);
  capacityWorkbook(parts, count);
  return {
    target,
    review: reviewWorkbook(
      await readWorkbook(workbookBytes(parts), "SYN-capacity.xlsx"),
      target,
      "2026-10-14",
    ),
  };
}
test("XI07 250/500 complete rows reconcile independently and 501 is refused", async () => {
  for (const count of [250, 500]) {
    const { review } = await fixture(count);
    assert.equal(review.validation_passed, true);
    assert.equal(review.lines.length, count);
    assert.equal(review.totals.cost, (count * 1.25).toFixed(2));
    assert.equal(review.totals.sell, (count * 2.5).toFixed(2));
    assert.equal(review.capacity_version, "PPO-EXCEL-CAPACITY-1");
  }
  await assert.rejects(fixture(501), /500 populated/);
});
test("XI07 internal Excel capacity does not widen native manual or quote validation", async () => {
  const bad = (e: unknown) => (e as { code: string }).code === "InvalidData";
  const { target, review } = await fixture(500),
    lines = review.lines.map((l) => workbookLine(l, randomUUID()));
  assert.throws(() => parseLines(lines, 2), bad);
  assert.equal(parseLines(lines, 2, 500).length, 500);
  const choices = lines.map((l) => ({
    line_id: l.id,
    included: true,
    print: true,
  }));
  assert.throws(() => parseQuoteChoices(choices));
  assert.equal(parseQuoteChoices(choices, 500).length, 500);
  const input = {
    schema_version: 1,
    operation_id: randomUUID(),
    reason: "SYN capacity",
    estimate_id: randomUUID(),
    option_id: target.option_id,
    revision_id: target.revision_id,
    expected_workspace_version: 1,
    expected_estimate_version: 0,
    context_hash: target.context_hash,
    title: "SYN capacity",
    scope: { included: "SYN", excluded: "None", assumptions: "None" },
    lines,
    policy: "SYN-E1-AUD-EX-GST-1",
  };
  // Use the native policy from the review's unchanged decimal engine.
  const { arithmeticPolicy } = await import("../../src/estimating/math");
  input.policy = arithmeticPolicy;
  assert.throws(() => costingInput(target.workspace_id, input), bad);
  assert.equal(
    costingInput(target.workspace_id, input, EXCEL_CAPACITY).lines.length,
    500,
  );
  const over = {
    ...input,
    lines: [...lines, { ...lines[0], id: randomUUID() }],
  };
  assert.throws(
    () => costingInput(target.workspace_id, over, EXCEL_CAPACITY),
    bad,
  );
  const wide = {
    ...input,
    lines: lines.map((l) => ({
      ...l,
      description: "測".repeat(300),
      source: "測".repeat(500),
    })),
  };
  assert.ok(Buffer.byteLength(canonical(wide)) > 1048576);
  assert.throws(
    () => costingInput(target.workspace_id, wide, EXCEL_CAPACITY),
    bad,
  );
  // Reach the exact UTF-8 envelope boundary while every field remains independently valid.
  let excess = Buffer.byteLength(canonical(wide)) - 1048576;
  for (const line of wide.lines) {
    const n = Math.min(Math.floor(excess / 2), 500);
    line.source = "x".repeat(n) + "測".repeat(500 - n);
    excess -= n * 2;
    if (excess < 2) break;
  }
  if (excess === 1) wide.reason = wide.reason.slice(0, -1);
  assert.equal(Buffer.byteLength(canonical(wide)), 1048576);
  assert.equal(
    costingInput(target.workspace_id, wide, EXCEL_CAPACITY).lines.length,
    500,
  );
  wide.reason += "x";
  assert.throws(
    () => costingInput(target.workspace_id, wide, EXCEL_CAPACITY),
    bad,
  );
});

test("XI07 valid 500-row Unicode workbook is refused when the complete receiving payload exceeds 1 MiB", async () => {
  const target = unitTarget(),
    parts = nativeWorkbook(target);
  capacityWorkbook(parts, 500);
  for (let i = 0; i < 500; i++)
    setCell(parts, 5, `C${i + 6}`, "測".repeat(300));
  setCell(parts, 4, "C6", "測".repeat(200));
  setCell(parts, 4, "D6", "測".repeat(200));
  const review = reviewWorkbook(
    await readWorkbook(workbookBytes(parts), "SYN-unicode.xlsx"),
    target,
    "2026-10-14",
  );
  assert.equal(review.lines.length, 500);
  assert.equal(review.validation_passed, false);
  assert.ok(review.issues.some((i) => i.code === "ReceiverPayloadTooLarge"));
});
