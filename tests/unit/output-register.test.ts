import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acknowledged,
  canPrepare,
  coverageLabel,
  outputHref,
  progressLabel,
} from "../../src/outputs/presentation";
import {
  outputContext,
  outputDetail,
  outputList,
  oldIssue,
  recipientId,
} from "../helpers/output-workspace-fixture";
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

test("DK03 presentation keeps bounded coverage and personal response populations explicit", () => {
  assert.match(
    coverageLabel({
      ...outputList,
      total_matching: null,
      coverage: [{ kind: "JobPack", state: "BoundedWindow" }],
    }),
    /incomplete coverage/,
  );
  assert.match(
    coverageLabel({
      ...outputList,
      coverage: [
        { kind: "JobPack", state: "Complete" },
        { kind: "ServiceReport", state: "NotPermitted" },
      ],
    }),
    /incomplete coverage/,
  );
  assert.match(
    progressLabel({
      ...outputDetail.output.recipient_summary,
      visibility: "OwnRecipient",
      recipient_count: 1,
      acknowledged_count: 0,
    }),
    /0 of 1 acknowledged · your recipient row/,
  );
  assert.equal(
    progressLabel({
      ...outputDetail.output.recipient_summary,
      visibility: "NotProvided",
      recipient_count: null,
      acknowledged_count: null,
    }),
    "Not provided",
  );
  assert.match(
    outputHref("JobPack", outputDetail.output.id, oldIssue),
    new RegExp("job-packs/.+\\?issue=" + oldIssue),
  );
});
test("DK03 distribution eligibility and acknowledgement never infer a current issue or another actor's response", () => {
  const d = structuredClone(outputDetail),
    c = structuredClone(outputContext),
    r = d.selected_issue!.distribution.recipients[0];
  assert.equal(canPrepare(d, c, recipientId), true);
  r.acknowledgements = [
    { ...r.acknowledgements[0], actor_id: "someone-else" },
    { ...r.acknowledgements[0], presented_hash: "wrong" },
  ];
  assert.equal(acknowledged(r, d.selected_issue!.output_hash), undefined);
  d.availability = "ExactUnavailable";
  assert.equal(canPrepare(d, c, recipientId), false);
  d.availability = "Available";
  d.selected_issue!.is_current_issue = false;
  assert.equal(canPrepare(d, c, recipientId), false);
  d.selected_issue!.is_current_issue = true;
  c.version++;
  assert.equal(canPrepare(d, c, recipientId), false);
  c.version--;
  r.events.push({ id: "native", kind: "SimulatedSent", occurred_at: d.as_at });
  assert.equal(canPrepare(d, c, recipientId), false);
});
