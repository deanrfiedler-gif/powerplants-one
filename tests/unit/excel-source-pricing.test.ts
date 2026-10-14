import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import {
  refreshProposal,
  refreshCommand,
} from "../../src/estimating/sources/validation";
import { EXCEL_CAPACITY } from "../../src/estimating/import/capacity";
import { sourceHash } from "../../src/estimating/sources/context";
test("XI exact managed selections are canonical, capped at 500 and do not widen native refresh", () => {
  const selections = Array.from({ length: 500 }, () => ({
    line_id: randomUUID(),
    source_id: randomUUID(),
    revision_id: randomUUID(),
    expected_source_version: 3,
  }));
  const proposal = {
    estimate_version_id: randomUUID(),
    pricing_date: "2026-10-14",
    selections,
  };
  const parsed = refreshProposal(proposal, EXCEL_CAPACITY.lines);
  assert.equal(parsed.selections.length, 500);
  assert.equal(
    sourceHash(parsed),
    sourceHash(
      refreshProposal(
        { ...proposal, selections: [...selections].reverse() },
        EXCEL_CAPACITY.lines,
      ),
    ),
  );
  assert.throws(() => refreshProposal(proposal));
  assert.throws(() =>
    refreshProposal(
      {
        ...proposal,
        selections: [
          ...selections,
          { ...selections[0], line_id: randomUUID() },
        ],
      },
      EXCEL_CAPACITY.lines,
    ),
  );
  assert.throws(() =>
    refreshProposal(
      { ...proposal, selections: [selections[0], selections[0]] },
      EXCEL_CAPACITY.lines,
    ),
  );
  assert.throws(() =>
    refreshProposal(
      { ...proposal, selections: [{ ...selections[0], unit_cost: "0" }] },
      EXCEL_CAPACITY.lines,
    ),
  );
  assert.throws(() =>
    refreshCommand(
      randomUUID(),
      {
        schema_version: 1,
        operation_id: randomUUID(),
        reason: "Synthetic",
        expected_version: 1,
        proposal,
        comparison_hash: "a".repeat(64),
        reviewed: false,
      },
      EXCEL_CAPACITY.lines,
    ),
  );
});
