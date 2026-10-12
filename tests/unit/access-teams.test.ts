import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import { teamExampleDate, teamProposals } from "../../src/access/teams";

test("AD-01 team examples preserve source IDs, people, lead, dates and fixed example clock", () => {
  type SourcePerson = { id: string; name: string; designOnly: boolean };
  const context = {} as {
    ACCESS_MODEL: {
      seed: () => {
        people: SourcePerson[];
        teams: {
          id: string;
          name: string;
          purpose: string;
          lead: string;
          members: { userId: string; from: string; to?: string }[];
        }[];
      };
      NOW: string;
    };
  };
  for (const file of ["capabilities.js", "model.js"])
    runInNewContext(
      readFileSync(
        new URL(`../../docs/design/access-review/${file}`, import.meta.url),
        "utf8",
      ),
      context,
    );
  const source = context.ACCESS_MODEL.seed();
  const person = (id: string) => {
    const p = source.people.find((item) => item.id === id)!;
    return { id: p.id, name: p.name, designOnly: p.designOnly };
  };
  const expected = source.teams.map((team) => ({
    ...team,
    lead: person(team.lead),
    members: team.members.map((m) => ({
      ...person(m.userId),
      from: m.from,
      to: m.to ?? null,
    })),
  }));
  assert.deepEqual(teamProposals, JSON.parse(JSON.stringify(expected)));
  assert.equal(teamProposals.length, 2);
  assert.equal(teamExampleDate, context.ACCESS_MODEL.NOW.slice(0, 10));
});
