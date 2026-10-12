import assert from "node:assert/strict";
import { test } from "node:test";
import {
  workloadOrder,
  workloadQuery,
} from "../../src/engineering/register-query";
import { AppError } from "../../src/platform/errors";

test("EN01 register accepts bounded literal filters and native choices", () => {
  const q = workloadQuery({
    q: " SYN 100%_Pump ",
    limit: "100",
    view: "review",
    attention: "true",
    sort: "ActionDate",
    direction: "desc",
  });
  assert.equal(q.q, "syn 100%_pump");
  assert.equal(q.limit, 100);
  assert.equal(q.attention, true);
  assert.equal(workloadOrder(q), "r.action_due DESC NULLS LAST,r.id ASC");
  assert.equal(
    workloadOrder(workloadQuery({})),
    "r.required_date ASC NULLS LAST,r.id ASC",
  );
});
test("EN01 register refuses unsupported scope, ordering, malformed identity and unbounded text", () => {
  for (const input of [
    { company_id: "invented" },
    { view: "approved" },
    { sort: "title;DELETE" },
    { direction: "sideways" },
    { owner_id: "wrong" },
    { attention: "yes" },
    { discipline: "Civil" },
    { limit: 0 },
    { limit: 101 },
    { limit: 1.5 },
    { q: "x".repeat(201) },
    { q: "line\nbreak" },
  ])
    assert.throws(
      () => workloadQuery(input),
      (e: unknown) => e instanceof AppError && e.status === 422,
    );
});
