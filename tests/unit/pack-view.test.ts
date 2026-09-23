import assert from "node:assert/strict";
import test from "node:test";
import { sectionKeys, type PackInput } from "../../src/documents/validation";
import {
  basisDrift,
  driftSources,
  emptyInput,
  formatStamp,
  historyKindLabel,
  historyLabel,
  initials,
  inputDiff,
  packTimeline,
  preparationFieldLabels,
  preparationHelp,
  readableValue,
  readinessSummary,
  revisionLabel,
  statusPresentation,
  visitWindow,
  type PackBasis,
  type PackCriterion,
  type TimelineSource,
} from "../../src/documents/pack-view";

const names = {
  sources: { s1: "SYN visual inspection reference", s2: "SYN inspection kit" },
  history: { h1: "SYN reported alarm" },
};
const input = (overrides: Partial<PackInput> = {}): PackInput => ({
  sections: Object.fromEntries(
    sectionKeys.map((k) => [k, `SYN ${k} note`]),
  ) as PackInput["sections"],
  source_ids: ["s1"],
  history_ids: [],
  ...overrides,
});
const criterion = (overrides: Partial<PackCriterion>): PackCriterion => ({
  criterion_code: "SYN",
  label: "SYN criterion",
  blocking_stage: "Dispatch",
  exception_allowed: false,
  not_applicable_allowed: false,
  outcome: "Pass",
  recorded_outcome: "Pass",
  stale: false,
  expired: false,
  reason: null,
  assessed_by_name: null,
  assessed_at: null,
  valid_until: null,
  evidence_title: null,
  ...overrides,
});
const basis = (overrides: Partial<PackBasis> = {}): PackBasis => ({
  appointment_version: 3,
  schedule_version: 1,
  assignment_version: 1,
  booking_hash: "a".repeat(64),
  work_version: 4,
  scope_id: "b1000000-0000-4000-8000-000000000001",
  scope_version: 2,
  scope_hash: "c".repeat(64),
  site_version: 2,
  customer_version: 1,
  template_version: 1,
  policy_version: 1,
  ...overrides,
});

test("event stamps use one format and take the zone from the site record, never from a literal", () => {
  assert.equal(
    formatStamp("2026-09-10T04:18:00Z", "Australia/Brisbane"),
    "10 Sep 2026 · 14:18 AEST",
  );
  // The same instant at a site that observes daylight saving carries that site's label.
  assert.equal(
    formatStamp("2026-12-10T04:18:00Z", "Australia/Sydney"),
    "10 Dec 2026 · 15:18 AEDT",
  );
  assert.equal(
    visitWindow(
      "2026-09-10T23:00:00Z",
      "2026-09-11T02:00:00Z",
      "Australia/Brisbane",
    ),
    "09:00–12:00 · AEST (UTC+10:00)",
  );
  assert.equal(revisionLabel(3), "r03");
  assert.equal(initials("SYN Morgan Technician"), "MT");
});

test("a change record lists only what changed, with selections as added and removed records", () => {
  assert.deepEqual(inputDiff(input(), input(), names), []);
  const long = "SYN " + "x".repeat(90);
  const changes = inputDiff(
    input({ history_ids: ["h1"] }),
    input({
      sections: { ...input().sections, scope: long },
      source_ids: ["s2"],
      history_ids: [],
    }),
    names,
  );
  assert.deepEqual(
    changes.map((c) => c.field),
    ["scope", "source_ids", "history_ids"],
  );
  assert.equal(changes[0].label, "Technician briefing");
  assert.equal(changes[0].from, "SYN scope note");
  assert.equal(changes[0].to.length, 68);
  assert.ok(changes[0].to.endsWith("…"));
  assert.equal(changes[1].from, "removed SYN visual inspection reference");
  assert.equal(changes[1].to, "added SYN inspection kit");
  assert.equal(changes[2].from, "removed SYN reported alarm");
  assert.equal(changes[2].to, "");
  // A record that is no longer selectable is still reported, not silently dropped.
  assert.equal(
    inputDiff(input(), input({ source_ids: ["gone"] }), names)[0].to,
    "added Record no longer listed",
  );
});

test("the first revision is compared with an empty preparation", () => {
  const changes = inputDiff(null, input(), names);
  assert.equal(changes.length, sectionKeys.length + 1);
  assert.ok(changes.every((c) => c.from === "(empty)" || c.from === ""));
  assert.deepEqual(emptyInput().source_ids, []);
});

test("readiness counts come from the rows; exceptions and not-applicable are satisfied and named", () => {
  const summary = readinessSummary([
    criterion({ outcome: "Pass" }),
    criterion({ outcome: "PermittedException" }),
    criterion({ outcome: "NotApplicable" }),
    criterion({ outcome: "Blocked" }),
    // A stale or expired assessment is served as Unknown and must never count as satisfied.
    criterion({ outcome: "Unknown", recorded_outcome: "Pass", stale: true }),
  ]);
  assert.equal(summary.satisfied, 3);
  assert.equal(summary.total, 5);
  assert.equal(summary.blocked.length, 2);
  assert.equal(
    summary.text,
    "3 of 5 criteria satisfied · 1 permitted exception · 1 not applicable",
  );
  assert.equal(readinessSummary([]).text, "0 of 0 criteria satisfied");
});

test("basis drift names the changed source and keeps an unreadable record apart from an unchanged one", () => {
  assert.deepEqual(basisDrift(basis(), basis()), []);
  const drift = basisDrift(
    basis(),
    basis({
      appointment_version: 4,
      schedule_version: 2,
      scope_hash: "d".repeat(64),
      site_version: null,
    }),
  );
  assert.deepEqual(
    drift.map((d) => [d.source, d.field, d.from, d.to]),
    [
      ["Appointment", "appointment_version", "v3", "v4"],
      ["Appointment", "schedule_version", "v1", "v2"],
      ["Work order", "scope_hash", "cccccccc", "dddddddd"],
      ["Site record", "site_version", "v2", null],
    ],
  );
  assert.deepEqual(driftSources(drift), [
    "Appointment",
    "Work order",
    "Site record",
  ]);
  // Issue and acknowledgement advance the appointment record version themselves. Once the revision is
  // issued only a schedule or crew change is reported, matching the server's applicability rule.
  assert.deepEqual(
    basisDrift(basis(), basis({ appointment_version: 9 }), true),
    [],
  );
  assert.deepEqual(
    basisDrift(
      basis(),
      basis({ appointment_version: 9, assignment_version: 2 }),
      true,
    ).map((d) => d.field),
    ["assignment_version"],
  );
});

test("the status shown is derived from the server state and never implies an issue that has not happened", () => {
  const pack = (
    status: string,
    needs_review = true,
    current_issue_id: string | null = null,
  ) => ({ status, needs_review, current_issue_id });
  assert.equal(statusPresentation(pack("Draft")).label, "Draft · not issued");
  assert.equal(
    statusPresentation(pack("Draft", true, "issue")).label,
    "Successor draft · not issued",
  );
  assert.equal(
    statusPresentation(pack("Returned")).label,
    "Returned for preparation",
  );
  assert.equal(
    statusPresentation(pack("Checked")).label,
    "Checked · not issued",
  );
  for (const state of ["Queued", "Running", "Durable"])
    assert.equal(
      statusPresentation(pack("Checked"), state).label,
      "Output in preparation",
    );
  assert.equal(
    statusPresentation(pack("Checked"), "Failed").label,
    "Output recovery needed",
  );
  assert.equal(
    statusPresentation(pack("Checked"), "StaleSource").label,
    "Source changed · successor needed",
  );
  assert.deepEqual(statusPresentation(pack("Issued", false, "issue")), {
    label: "Issued",
    tone: "green",
  });
  assert.equal(
    statusPresentation(pack("Issued", true, "issue")).label,
    "Review required",
  );
  assert.equal(
    statusPresentation(pack("Withdrawn", true, "issue")).label,
    "Withdrawn",
  );
});

test("the timeline is one newest-first record with a reason and field delta on every save", () => {
  const source: TimelineSource = {
    revisions: [
      {
        id: "r2",
        revision: 2,
        input: input({ source_ids: ["s1", "s2"] }),
        change_reason: "SYN kit reference added",
        created_at: "2026-09-10T05:00:00Z",
        created_by_name: "SYN Coordinator",
      },
      {
        id: "r1",
        revision: 1,
        input: input(),
        change_reason: "SYN initial preparation",
        created_at: "2026-09-10T04:00:00Z",
        created_by_name: "SYN Coordinator",
      },
    ],
    checks: [
      {
        id: "c1",
        revision_id: "r1",
        decision: "Returned",
        reason: "SYN kit reference missing",
        checked_at: "2026-09-10T04:30:00Z",
        actor_name: "SYN Reviewer",
      },
      {
        id: "c2",
        revision_id: "r2",
        decision: "Checked",
        reason: "SYN exact sources reviewed",
        checked_at: "2026-09-10T05:30:00Z",
        actor_name: "SYN Reviewer",
      },
    ],
    jobs: [
      {
        id: "j1",
        revision_id: "r2",
        state: "Issued",
        attempts: 1,
        error_code: null,
        requested_at: "2026-09-10T05:40:00Z",
        actor_name: "SYN Coordinator",
      },
    ],
    issues: [
      {
        id: "i1",
        revision: 2,
        issued_at: "2026-09-10T05:41:00Z",
        manifest: { filename: "SYN-PPO-PACK-000001-job-pack-r02.pdf" },
        issued_by_name: "SYN Coordinator",
      },
    ],
    events: [
      {
        id: "e1",
        kind: "Issued",
        reason: "SYN issue",
        occurred_at: "2026-09-10T05:41:00Z",
      },
      {
        id: "e2",
        kind: "ReviewRequired",
        reason: "SYN confirmed schedule move",
        occurred_at: "2026-09-10T07:00:00Z",
        actor_name: "SYN Coordinator",
      },
    ],
    distribution: [
      {
        id: "d1",
        display_name: "SYN Riley Technician",
        kind: "TaskCreated",
        occurred_at: "2026-09-10T05:41:30Z",
      },
    ],
    readiness: {
      recipients: [
        {
          id: "p1",
          display_name: "SYN Riley Technician",
          acknowledged_at: "2026-09-10T06:00:00Z",
        },
        {
          id: "p2",
          display_name: "SYN Morgan Technician",
          acknowledged_at: null,
        },
      ],
    },
  };
  const events = packTimeline(source, names);
  assert.deepEqual(
    events.map((e) => e.title),
    [
      "Review required",
      "Acknowledged by SYN Riley Technician",
      "TaskCreated · SYN Riley Technician",
      "Issued r02",
      "Exact output requested for r02",
      "Revision r02 checked",
      "Preparation r02 saved",
      "Preparation r01 returned",
      "Draft r01 prepared",
    ],
  );
  // The issue row already records the Issued event; it is not listed twice.
  assert.equal(events.filter((e) => e.id === "e1").length, 0);
  assert.equal(events[0].kind, "source");
  assert.equal(events[3].href, "/documents/i1");
  const saved = events.find((e) => e.id === "r2")!;
  assert.equal(saved.detail, "SYN kit reference added");
  assert.equal(saved.actor, "SYN Coordinator");
  assert.deepEqual(
    saved.changes.map((c) => [c.field, c.to]),
    [["source_ids", "added SYN inspection kit"]],
  );
  // An unacknowledged recipient produces no event.
  assert.equal(events.filter((e) => e.title.includes("Morgan")).length, 0);
});

// SC-06 I3 — preparation entry labels, help and the change record the save dialog shows.
test("every section has a distinct entry label and help sentence", () => {
  const labels = sectionKeys.map((k) => preparationFieldLabels[k]),
    help = sectionKeys.map((k) => preparationHelp[k]);
  assert.equal(new Set(labels).size, sectionKeys.length);
  assert.equal(new Set(help).size, sectionKeys.length);
  for (const text of [...labels, ...help]) {
    assert.ok(text.trim().length > 0);
    // No entry label may contain a name a suite looks up without exact matching.
    assert.ok(!/criteria satisfied/.test(text));
  }
  // The boundaries the plan's D4 and DP-5 fix are stated where the coordinator types.
  assert.match(preparationHelp.scope, /cannot extend the approved scope/);
  assert.match(preparationHelp.readiness, /assessed at the appointment/);
  assert.match(preparationHelp.site_controls, /Do not create permits/);
});

test("stored vocabulary values are shown as words, never as codes", () => {
  assert.equal(historyKindLabel("PriorWork"), "Prior work");
  assert.equal(historyKindLabel("KnownIssue"), "Known issue");
  assert.equal(historyKindLabel("AttemptedFix"), "Attempted fix");
  assert.equal(historyKindLabel("TechnicalAdvice"), "Technical advice");
  // A value the map does not name is still split into words rather than shown as stored.
  assert.equal(historyKindLabel("SomeFutureKind"), "Some future kind");
  assert.equal(readableValue("NotApplicable"), "Not applicable");
  assert.equal(
    historyLabel({ kind: "KnownIssue", summary: "SYN reported alarm" }),
    "Known issue: SYN reported alarm",
  );
});

test("the save dialog's change list is the page's dirty state", () => {
  const saved = input();
  // An unchanged entry, and whitespace around one, are not a change.
  assert.deepEqual(inputDiff(saved, input(), names), []);
  assert.deepEqual(
    inputDiff(saved, input({ sections: { ...saved.sections, scope: "  SYN scope note  " } as PackInput["sections"] }), names),
    [],
  );
  const edited = inputDiff(
    saved,
    input({
      sections: { ...saved.sections, scope: "SYN amended scope note" } as PackInput["sections"],
      history_ids: ["h1"],
    }),
    names,
  );
  assert.deepEqual(
    edited.map((c) => [c.field, c.label]),
    [
      ["scope", preparationFieldLabels.scope],
      ["history_ids", "Service history"],
    ],
  );
  assert.equal(edited[0].from, "SYN scope note");
  assert.equal(edited[0].to, "SYN amended scope note");
  assert.equal(edited[1].to, "added SYN reported alarm");
  // A first preparation records every entry as added, so the dialog can list them all.
  const first = inputDiff(null, saved, names);
  assert.equal(first.length, sectionKeys.length + 1);
  assert.ok(first.every((c) => c.from === "(empty)" || c.from === ""));
});
