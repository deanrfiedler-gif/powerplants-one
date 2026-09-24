import assert from "node:assert/strict";
import { test } from "node:test";
import {
  workloadQuery,
  workloadState,
} from "../../src/estimating/workload-query";

test("ES01 query accepts bounded literal search and rejects unsupported policy or sort inputs", () => {
  assert.deepEqual(
    workloadQuery({ q: "  SYN %_  ", owner: "mine", view: "ready" }),
    { q: "SYN %_", owner: "mine", view: "ready", sort: "updated" },
  );
  const invalidQueries: Record<string, string>[] = [
    { q: "x".repeat(101) },
    { view: "approved" },
    { owner: "admin" },
    { sort: "cost" },
    { priority: "high" },
  ];
  for (const query of invalidQueries) {
    assert.throws(
      () => workloadQuery(query),
      (e: unknown) => (e as { status: number }).status === 422,
    );
  }
});
test("ES01 legacy, incomplete and unstarted scopes remain different from complete discovery", () => {
  assert.deepEqual(
    [null, "NotRecorded", "Incomplete", "Complete"].map((value) =>
      workloadState(value as Parameters<typeof workloadState>[0]),
    ),
    ["unstarted", "legacy", "clarification", "ready"],
  );
});
