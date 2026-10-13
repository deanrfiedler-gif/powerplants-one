import assert from "node:assert/strict";
import { test } from "node:test";
import {
  outputQuery,
  outputDetailQuery,
  inOutputView,
  type OutputRow,
} from "../../src/outputs/model";

test("DK03 query rejects invented authority, invalid identifiers and unbounded windows", () => {
  for (const input of [
    { limit: "51" },
    { offset: "-1" },
    { kind: "Invoice" },
    { q: "\n" },
    { company_id: "all" },
    { issue: true },
  ])
    assert.throws(() => outputQuery(input));
  assert.throws(() => outputDetailQuery({ issue_id: "latest" }));
  assert.throws(() => outputDetailQuery({ kind: "JobPack", approved: true }));
  assert.equal(outputQuery({ limit: "2", q: " SYN " }).q, "syn");
});
test("DK03 preparation and exception views never manufacture an issue from durable bytes", () => {
  const row = {
    source_state: "Checked",
    current_issue: null,
    availability: "NotIssued",
    needs_review: false,
    preparation: { state: "Durable" },
  } as OutputRow;
  assert.equal(inOutputView(row, "issued"), false);
  assert.equal(inOutputView(row, "preparing"), true);
  assert.equal(inOutputView(row, "unissued"), true);
  row.preparation!.state = "Failed";
  assert.equal(inOutputView(row, "exceptions"), true);
  assert.equal(inOutputView(row, "issued"), false);
  row.source_state = "Withdrawn";
  row.current_issue = {
    id: "retained-exact-issue",
  } as OutputRow["current_issue"];
  assert.equal(inOutputView(row, "issued"), true);
  assert.equal(inOutputView(row, "exceptions"), true);
});
