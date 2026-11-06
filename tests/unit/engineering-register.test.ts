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

test("EN01 Reference ordering is server-defined in both directions with stable ties", () => {
  for (const direction of ["asc", "desc"]) {
    assert.equal(
      workloadOrder(workloadQuery({ sort: "Reference", direction })),
      'lower(r.display_number) COLLATE "C" ' +
        direction.toUpperCase() +
        " NULLS LAST,r.id ASC",
    );
  }
});

import {
  engineeringCsv,
  continuationExpired,
} from "../../src/engineering/register-presentation";

test("EN01 selected CSV exports recorded facts and quotes formula-like, multiline and empty cells", () => {
  const csv = engineeringCsv([
    {
      display_number: "SYN-EN-001",
      title: '=HYPERLINK("synthetic"), test',
      customer_name: "SYN Customer",
      state: "Queued",
      owner_name: "SYN Recorded owner",
      required_date: null,
      next_action: "SYN first line\nsecond line",
      action_due: null,
      discipline: "Hydraulics",
      context_reference: "SYN-PJ-001",
      version: 3,
    },
  ]);
  assert(csv.includes('"\'=HYPERLINK(""synthetic""), test"'));
  assert(csv.includes('"SYN first line\nsecond line"'));
  assert(csv.includes('"SYN Recorded owner","","SYN first line'));
  assert(csv.endsWith('"SYN-PJ-001","3"\r\n'));
  assert.equal(engineeringCsv([]).split("\r\n").length, 2);
  assert(!csv.includes("Effort"));
  assert(!csv.includes("Utilisation"));
});

test("EN01 only source conflicts or rejected continuations restart the first page", () => {
  assert.equal(continuationExpired({ code: "ReadConflict" }), true);
  assert.equal(
    continuationExpired({
      code: "InvalidData",
      field_errors: [{ field: "cursor" }],
    }),
    true,
  );
  assert.equal(continuationExpired({ code: "Forbidden" }), false);
  assert.equal(
    continuationExpired({
      code: "InvalidData",
      field_errors: [{ field: "q" }],
    }),
    false,
  );
  assert.equal(continuationExpired(null), false);
});
