import assert from "node:assert/strict";
import { test } from "node:test";
import { queueQuery } from "../../src/estimating/review/queue-model";

test("review queue refuses unbounded, ambiguous or invented query contracts", () => {
  assert.deepEqual(queueQuery({}), {
    q: "",
    source: "all",
    view: "all",
    offset: 0,
    limit: 25,
  });
  assert.deepEqual(
    queueQuery({
      q: "  %_  ",
      source: "quotations",
      view: "awaiting_me",
      offset: "25",
      limit: "1",
    }),
    {
      q: "%_",
      source: "quotations",
      view: "awaiting_me",
      offset: 25,
      limit: 1,
    },
  );
  for (const query of [
    { limit: "26" },
    { limit: "0" },
    { limit: "1.0" },
    { limit: "01" },
    { offset: "-1" },
    { offset: "1e2" },
    { offset: "1000001" },
    { offset: " 1" },
    { q: "a".repeat(101) },
    { q: "bad\ntext" },
    { source: "finance" },
    { view: "overdue" },
    { company_id: "invented" },
    { limit: 2 },
  ])
    assert.throws(() => queueQuery(query));
});
