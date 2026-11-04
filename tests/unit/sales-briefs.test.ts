import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyHandover } from "../../src/sales/handover-model";
import type { Handover, HandoverEvent } from "../../src/sales/handover-service";
import {
  briefHref,
  matchesReceivingView,
  receivingCsv,
  submittedRevision,
} from "../../src/sales/receiving-queue-model";
import { briefsFixture, briefActor } from "../helpers/sales-briefs";
test("Awaiting my decision follows the exact receiver and Submitted/Answered rule, including changed sources", () => {
  const rows = briefsFixture().items;
  assert.deepEqual(
    rows
      .filter((r) => matchesReceivingView(r, "Awaiting", briefActor))
      .map((r) => r.opportunity.reference),
    ["SYN-PPO-OPP-000031", "SYN-PPO-OPP-000030", "SYN-PPO-OPP-000028"],
  );
  assert.equal(matchesReceivingView(rows[4], "Awaiting", briefActor), false);
  assert.equal(matchesReceivingView(rows[3], "Assigned", briefActor), true);
  assert.equal(
    matchesReceivingView(
      { ...rows[6], source_changed: true },
      "SourceChanged",
      briefActor,
    ),
    false,
  );
});
test("a successor draft cannot replace submitted content, state, update or receiver", () => {
  const content = emptyHandover();
  const events = [
    {
      id: "submission",
      action: "Submit",
      revision: 1,
      version: 3,
      content,
      recorded_by: "sales",
    },
    {
      id: "return",
      action: "Return",
      revision: 1,
      version: 4,
      content,
      recorded_by: "receiver",
    },
    {
      id: "successor",
      action: "Successor",
      revision: 2,
      version: 5,
      content,
      recorded_by: "sales",
    },
    {
      id: "save",
      action: "Save",
      revision: 2,
      version: 6,
      content: { ...content, problem: "Unsubmitted" },
      recorded_by: "sales",
    },
  ] as HandoverEvent[];
  const row = {
    revision: 2,
    state: "Draft",
    receiving_owner_id: "another receiver",
  } as Handover;
  const result = submittedRevision(row, events)!;
  assert.equal(result.submitted.id, "submission");
  assert.equal(result.decision.id, "return");
  assert.equal(result.state, "Returned");
  assert.equal(result.receiver, "receiver");
  assert.equal(result.events.length, 2);
  assert.equal(result.submitted.content.problem, "");
  events[1].action = "Accept";
  assert.equal(submittedRevision(row, events)!.state, "Accepted");
  assert.equal(
    submittedRevision(
      row,
      events.filter((e) => e.action !== "Submit"),
    ),
    null,
  );
});
test("CSV exports selected list fields with safe cells and revision-bound exact handovers", () => {
  const row = {
    ...briefsFixture().items[0],
    opportunity: {
      ...briefsFixture().items[0].opportunity,
      title: ' =HYPERLINK("bad")',
    },
  };
  const csv = receivingCsv([row]);
  assert.match(csv, /"' =HYPERLINK\(""bad""\)"/);
  assert.ok(csv.includes(briefHref(row)));
  assert.ok(briefHref(row).endsWith("?revision=1"));
  assert.equal(csv.split("\r\n").length, 2);
  assert.ok(!csv.includes("problem"));
});
