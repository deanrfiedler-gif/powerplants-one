import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { assessPreparation, withinWindow } from "../../src/shared/cs/readiness";
import {
  parseContent,
  type ReadinessContent,
  type WorkWindow,
  type PreparationBasis,
} from "../../src/shared/cs/model";
import { hash } from "../../src/shared/cs/service";
const f = randomUUID(),
  child = randomUUID(),
  person = randomUUID();
const window: WorkWindow = {
  id: randomUUID(),
  facility_id: f,
  activity: "Inspection",
  from_date: "2026-01-01",
  to_date: "2026-12-31",
  season_from: "11-01",
  season_to: "02-28",
  start_time: "08:00",
  end_time: "17:00",
  source: "SYN seasonal window",
};
test("CS06 seasonal boundaries include both dates, span new year and refuse uncovered seconds", () => {
  assert.equal(
    withinWindow(window, "2026-01-02T08:00:00Z", "2026-01-02T17:00:00Z", "UTC"),
    true,
  );
  assert.equal(
    withinWindow(window, "2026-02-28T08:00:00Z", "2026-02-28T17:00:01Z", "UTC"),
    false,
  );
  assert.equal(
    withinWindow(window, "2026-03-01T08:00:00Z", "2026-03-01T09:00:00Z", "UTC"),
    false,
  );
  assert.equal(
    withinWindow(window, "2026-11-01T08:00:00Z", "2026-11-01T09:00:00Z", "UTC"),
    true,
  );
});
test("CS06 overnight windows retain the evening anchor; DST repeated hours cannot conceal a gap", () => {
  const night = {
    ...window,
    from_date: "2026-11-01",
    start_time: "22:00",
    end_time: "04:00",
  };
  assert.equal(
    withinWindow(night, "2026-11-01T01:00:00Z", "2026-11-01T02:00:00Z", "UTC"),
    false,
  );
  assert.equal(
    withinWindow(night, "2026-11-01T23:00:00Z", "2026-11-02T03:00:00Z", "UTC"),
    true,
  );
  assert.equal(
    withinWindow(night, "2026-11-02T01:00:00Z", "2026-11-02T02:00:00Z", "UTC"),
    true,
  );
  const fall = {
    ...window,
    season_from: "01-01",
    season_to: "12-31",
    start_time: "02:20",
    end_time: "02:40",
  };
  assert.equal(
    withinWindow(
      fall,
      "2026-04-04T15:25:00Z",
      "2026-04-04T16:35:00Z",
      "Australia/Sydney",
    ),
    false,
  );
  assert.equal(
    withinWindow(
      { ...fall, start_time: "01:00", end_time: "04:00" },
      "2026-04-04T15:25:00Z",
      "2026-04-04T16:35:00Z",
      "Australia/Sydney",
    ),
    true,
  );
});
test("CS06 evidence remains individual, reviewed, exact-revision and exact-Facility; missing windows are not unrestricted", () => {
  const req = {
    id: randomUUID(),
    revision: 1,
    title: "SYN induction",
    kind: "Induction" as const,
    facility_id: f,
    activity: "Inspection",
    source: "SYN requirement",
  };
  const evidence = {
    id: randomUUID(),
    requirement_id: req.id,
    requirement_revision: 1,
    facility_id: f,
    activity: "Inspection",
    person_id: person,
    captured_on: "2026-01-01",
    expires_on: "2026-02-01",
    source: "SYN evidence",
  };
  const content: ReadinessContent = {
    schema_version: 1,
    requirements: [req],
    evidence: [evidence],
    windows: [window],
  };
  const basis: PreparationBasis = {
    facility_ids: [f],
    person_ids: [person],
    activity: "Inspection",
    starts_at: "2026-01-02T09:00:00Z",
    ends_at: "2026-01-02T10:00:00Z",
  };
  const assess = (c = content, b = basis, reviewed = [hash(evidence)]) =>
    assessPreparation(c, b, "UTC", reviewed);
  assert.equal(assess().blockers.length, 0);
  assert.equal(assess().work_authority, "Not granted");
  assert.ok(assess(content, basis, []).blockers.length);
  assert.ok(
    assess(content, { ...basis, person_ids: [randomUUID()] }).blockers.length,
  );
  assert.ok(
    assess({ ...content, requirements: [{ ...req, revision: 2 }] }).blockers
      .length,
  );
  assert.ok(assess({ ...content, windows: [] }).blockers.length);
  assert.ok(
    assess(content, { ...basis, facility_ids: [child] }).blockers.some((x) =>
      x.includes("unknown"),
    ),
  );
  assert.ok(
    assess(content, {
      ...basis,
      starts_at: "2026-02-02T09:00:00Z",
      ends_at: "2026-02-02T10:00:00Z",
    }).blockers.length,
  );
  const updated = parseContent(
    "Readiness",
    {
      ...content,
      requirements: [{ ...req, revision: 900, source: "SYN successor" }],
    },
    content,
  ) as ReadinessContent;
  assert.equal(updated.requirements[0].revision, 2);
  assert.equal(updated.evidence[0].requirement_revision, 1);
});
