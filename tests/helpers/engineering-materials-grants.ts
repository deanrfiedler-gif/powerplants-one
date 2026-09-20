import assert from "node:assert/strict";

// Seed 29 (EN-06) is the first seed since 0020 to add permission grants, so an upgrade proof that snapshots
// ppo.permission_grants from a version where the coordinators already hold the Projects and Engineering
// capabilities (18 or later) expects exactly this set and nothing else. It mirrors db/seed-engineering-materials.sql.
type Grant = Record<string, unknown>;

const coordinator = "30000000-0000-4000-8000-000000000001", secondCompany = "30000000-0000-4000-8000-000000000008";
const companyA = "20000000-0000-4000-8000-000000000001";
const profiles = { author: "30000000-0000-4000-8000-000000000016", engineer: "30000000-0000-4000-8000-000000000017", reviewer: "30000000-0000-4000-8000-000000000018",
  release: "30000000-0000-4000-8000-000000000019", supply: "30000000-0000-4000-8000-000000000020", viewer: "30000000-0000-4000-8000-000000000021" };
const reads = ["shared.read", "shared.internal.read", "project.read", "engineering.read"];
const duties: [string, string][] = [[profiles.reviewer, "engineering.material.review"], [profiles.release, "engineering.material.release"], [profiles.supply, "engineering.material.receive"]];

function seed29Grants(original: Grant[], at: Date): Grant[] {
  const time = (v: unknown) => new Date(v as string | Date).getTime();
  const live = (g: Grant) => time(g.valid_from) <= at.getTime() && (g.valid_to === null || time(g.valid_to) > at.getTime());
  const own = original.filter(g => g.user_id === coordinator && g.company_id === companyA && g.scope_type === "Company" && live(g));
  return [
    ...own.filter(g => reads.includes(String(g.capability))).flatMap(g => Object.values(profiles).map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.edit").flatMap(g => [profiles.author, profiles.engineer].map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.read").flatMap(g => duties.map(([user_id, capability]) => ({ ...g, user_id, capability }))),
    ...original.filter(g => [coordinator, secondCompany].includes(String(g.user_id)) && g.capability === "engineering.edit" && live(g))
      .map(g => ({ ...g, capability: "engineering.material.source" })),
  ];
}

/** Every earlier grant survives byte for byte, revoked ones included, and the only additions are seed 29's. */
export function assertOnlySeed29GrantsAdded(original: Grant[], upgraded: Grant[], at = new Date()) {
  const ids = new Set(original.map(g => g.id));
  assert.deepEqual(upgraded.filter(g => ids.has(g.id)), original);
  // An exact allowlist: an unrelated new grant must fail, even if its scope matches an old grant.
  const sorted = (gs: Grant[]) => gs.map(g => JSON.stringify(Object.fromEntries(Object.entries(g).filter(([k]) => k !== "id")))).sort();
  const expected = seed29Grants(original, at);
  assert.equal(expected.length, 31);
  assert.deepEqual(sorted(upgraded.filter(g => !ids.has(g.id))), sorted(expected));
}
