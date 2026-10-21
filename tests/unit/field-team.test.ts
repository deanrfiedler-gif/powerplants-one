import { test } from "node:test";
import assert from "node:assert/strict";
import {
  fieldTeamCriteria,
  fieldTeamHref,
  hoursLabel,
  personDay,
  personVisits,
  phoneStatus,
  resourceReadComplete,
  reviewWindow,
  skillsSummary,
  teamRows,
} from "../../src/scheduling/field-team-model";
import {
  teamDay,
  teamFixture,
  teamId,
  teamPerson,
  teamZone,
} from "../helpers/field-team-fixture";

test("Field team starts seven days at the incoming date and preserves the person handover", () => {
  const period = reviewWindow(teamDay, teamZone);
  assert.equal(period.from, "2026-10-12T14:00:00.000Z");
  assert.equal(period.to, "2026-10-19T14:00:00.000Z");
  const url = new URL(
    fieldTeamHref(teamDay, teamZone, teamId(500), teamId(1)),
    "http://localhost",
  );
  assert.equal(url.searchParams.get("view"), "visits");
  assert.equal(fieldTeamCriteria(url.searchParams).resource, teamId(1));
  assert.equal(fieldTeamCriteria(url.searchParams).site, teamId(500));
  assert.equal(fieldTeamCriteria(url.searchParams).day, teamDay);
  assert.equal(
    fieldTeamCriteria(
      new URLSearchParams("view=visits&view=attention&people=admin"),
    ).view,
    "team",
  );
});
test("booked hours include anonymous busy intervals and travel but only standard working hours", () => {
  const r = teamPerson();
  r.busy = [
    { start_at: "2026-10-12T21:00:00Z", end_at: "2026-10-13T00:00:00Z" },
    { start_at: "2026-10-12T23:00:00Z", end_at: "2026-10-13T02:00:00Z" },
  ];
  r.blocks = [
    {
      id: "block",
      kind: "OtherWork",
      start_at: "2026-10-13T01:00:00Z",
      end_at: "2026-10-13T02:00:00Z",
    },
  ];
  const lane = personDay(r, teamDay, teamZone);
  assert.equal(lane.bookedMinutes, 180);
  assert.equal(lane.capacityMinutes, 480);
  assert.equal(hoursLabel(r, teamDay, teamZone), "3 of 8 h booked");
  r.active = false;
  assert.equal(hoursLabel(r, teamDay, teamZone), "Inactive · cannot book");
});
test("competence summaries use reviewed evidence and expose all unresolved categories", () => {
  const r = teamPerson(),
    p = reviewWindow(teamDay, teamZone),
    base = r.skills[0];
  r.skills.push(
    { ...base, id: "expired", valid_to: p.from },
    { ...base, id: "future", valid_from: p.to },
    { ...base, id: "inactive", active: false },
  );
  const s = skillsSummary(r, p.from, p.to);
  assert.deepEqual(
    [
      s.verified,
      s.expiring,
      s.expired,
      s.unknown,
      s.future,
      s.inactive,
      s.review,
    ],
    [1, 1, 1, 1, 1, 1, 5],
  );
  assert.match(phoneStatus(r, s, []), /expired/);
  r.skills = [];
  assert.match(phoneStatus(r, skillsSummary(r, p.from, p.to), []), /Unknown/);
});
test("register filters only returned people, puts away people last and never treats partial reads as complete", () => {
  const data = teamFixture(),
    criteria = fieldTeamCriteria(
      new URLSearchParams({ day: teamDay, timezone: teamZone }),
    );
  assert.equal(teamRows(data, criteria).at(-1)?.resource.name, "Jamie Chen");
  assert.equal(teamRows(data, { ...criteria, people: "away" }).length, 1);
  assert.equal(
    teamRows(data, { ...criteria, search: "Casey" })[0].resource.id,
    teamId(1),
  );
  assert.equal(teamRows(data, { ...criteria, resource: teamId(99) }).length, 0);
  assert.equal(
    personVisits(data.items, teamId(1), teamDay, teamZone).length,
    2,
  );
  assert.equal(resourceReadComplete("Complete"), true);
  assert.equal(resourceReadComplete("Incomplete"), false);
});
