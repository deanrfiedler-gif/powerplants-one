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

import {
  workloadCsv,
  workloadLocation,
  workloadSequence,
  savedEstimateHref,
  shortDate,
  workloadFingerprint,
  type WorkloadItem,
} from "../../src/components/estimating-workload-model";

function row(id: string, updated_at: string, title = id): WorkloadItem {
  return {
    opportunity: {
      id,
      display_number: "SYN-PPO-OPP-" + id,
      version: 3,
      company_id: "synthetic",
      title,
      need_summary: "Scope only",
      close_outcome: "Open",
    },
    customer: "SYN customer",
    site: null,
    estimating_owner: null,
    sales_owner: "Sales owner",
    estimating_owner_id: null,
    state: "unstarted",
    updated_at,
    response_date: null,
    intake_acceptance: "NotConfigured",
    priority: "NotConfigured",
    sales_handover_due: null,
    sales_action: null,
    can_start: true,
    sales_brief: null,
    readiness_reasons: [],
    readiness_findings: [],
    workspace: null,
    estimates: [],
  };
}
test("ES01 URL restoration retains workload filters across Saved estimates and removes only the closed snapshot", () => {
  const p = new URLSearchParams(
    "q=literal%25&owner=mine&view=ready&sort=customer&record=one",
  );
  const saved = workloadLocation(p, { tab: "estimates", record: "" });
  const restored = new URL(saved, "http://localhost").searchParams;
  assert.equal(restored.get("tab"), "estimates");
  assert.equal(restored.get("q"), "literal%");
  assert.equal(restored.get("owner"), "mine");
  assert.equal(restored.get("view"), "ready");
  assert.equal(restored.get("sort"), "customer");
  assert.equal(restored.has("record"), false);
  assert.equal(
    new URL(
      workloadLocation(restored, { tab: "" }),
      "http://localhost",
    ).searchParams.has("tab"),
    false,
  );
});
test("ES01 sequence is most recently changed first, independent of displayed customer order", () => {
  const older = row("a", "2026-10-01T00:00:00Z"),
    newer = row("b", "2026-10-20T00:00:00Z"),
    same = row("c", "2026-10-20T00:00:00Z");
  assert.deepEqual(
    workloadSequence([older, same, newer], ["a", "b", "c"]).map(
      (x) => x.opportunity.id,
    ),
    ["b", "c", "a"],
  );
  assert.deepEqual(
    workloadSequence([older, newer], ["a", "hidden"]).map(
      (x) => x.opportunity.id,
    ),
    ["a"],
  );
});
test("ES01 exact saved links and selection freshness include linked facts and permissions", () => {
  assert.equal(
    savedEstimateHref({ id: "estimate", version_id: "saved-revision" }),
    "/estimating/estimates/estimate?version_id=saved-revision",
  );
  const original = row("a", "2026-10-01T00:00:00Z");
  assert.notEqual(
    workloadFingerprint([original]),
    workloadFingerprint([{ ...original, can_start: false }]),
  );
  assert.notEqual(
    workloadFingerprint([original]),
    workloadFingerprint([{ ...original, sales_owner: "New owner" }]),
  );
});
test("ES01 list export has an allowlist, escaped quotes and formula-injection protection", () => {
  const csv = workloadCsv([
    row("1", "2026-10-01T00:00:00Z", ' =HYPERLINK("bad")'),
    row("2", "2026-10-01T00:00:00Z", "Plain, title"),
  ]);
  assert.match(csv, /"'=HYPERLINK|"\' =HYPERLINK/);
  assert.ok(csv.includes('""bad""'));
  assert.ok(csv.includes('"Plain, title"'));
  assert.equal(
    csv.includes("Scope only"),
    false,
    "brief and hidden source content is not exported",
  );
  assert.equal(csv.split("\r\n").length, 3);
  assert.ok(
    csv.startsWith(
      '"Opportunity","Sales source version","Title","Customer","Readiness","Estimating owner","Sales owner","Last changed"',
    ),
  );
});

test("ES01 short dates choose the year in Brisbane across browser time zones", (t) => {
  const previousZone = process.env.TZ;
  t.after(() => {
    if (previousZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousZone;
  });
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2027-01-01T00:30:00+10:00"),
  });
  for (const zone of ["UTC", "America/Los_Angeles", "Pacific/Auckland"]) {
    process.env.TZ = zone;
    assert.equal(shortDate("2027-01-02T00:30:00+10:00"), "2 Jan", zone);
    assert.equal(shortDate("2026-12-31T23:30:00+10:00"), "31 Dec 2026", zone);
  }
});
