import assert from "node:assert/strict";

// Seed 29 (EN-06) is the first seed since 0020 to add permission grants, and seed 30 (EN-07) is the second, so an
// upgrade proof that snapshots ppo.permission_grants from a version where the coordinators already hold the Projects
// and Engineering capabilities (18 or later) expects exactly these two sets and nothing else. They mirror
// db/seed-engineering-materials.sql and db/seed-engineering-changes.sql.
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

// Seed 30 (EN-07): three more fictional profiles read Company A through copies of the coordinator's own scope, nobody
// gains engineering.edit, and review, technical decision, closure, receiving and verification are one capability each,
// held only where the seed names the person. The coordinator receives for Projects, so one grant is their own.
const changeProfiles = { releaseOwner: "30000000-0000-4000-8000-000000000022", service: "30000000-0000-4000-8000-000000000023", verifier: "30000000-0000-4000-8000-000000000024" };
const changeDuties: [string, string][] = [[profiles.reviewer, "engineering.change.review"], [profiles.release, "engineering.change.decide"], [profiles.release, "engineering.change.close"],
  [profiles.supply, "engineering.change.receive"], [changeProfiles.releaseOwner, "engineering.change.receive"], [changeProfiles.service, "engineering.change.receive"],
  [changeProfiles.verifier, "engineering.change.receive"], [changeProfiles.verifier, "engineering.change.verify"], [coordinator, "engineering.change.receive"]];
function seed30Grants(original: Grant[], at: Date): Grant[] {
  const time = (v: unknown) => new Date(v as string | Date).getTime();
  const live = (g: Grant) => time(g.valid_from) <= at.getTime() && (g.valid_to === null || time(g.valid_to) > at.getTime());
  const own = original.filter(g => g.user_id === coordinator && g.company_id === companyA && g.scope_type === "Company" && live(g));
  return [
    ...own.filter(g => reads.includes(String(g.capability))).flatMap(g => Object.values(changeProfiles).map(user_id => ({ ...g, user_id }))),
    ...own.filter(g => g.capability === "engineering.read").flatMap(g => changeDuties.map(([user_id, capability]) => ({ ...g, user_id, capability }))),
  ];
}

/** Every earlier grant survives byte for byte, revoked ones included, and the only additions are those of seeds 29 and 30. */
export function assertOnlyEngineeringSeedGrantsAdded(original: Grant[], upgraded: Grant[], at = new Date()) {
  const ids = new Set(original.map(g => g.id));
  assert.deepEqual(upgraded.filter(g => ids.has(g.id)), original);
  // An exact allowlist: an unrelated new grant must fail, even if its scope matches an old grant.
  const sorted = (gs: Grant[]) => gs.map(g => JSON.stringify(Object.fromEntries(Object.entries(g).filter(([k]) => k !== "id")))).sort();
  const materials = seed29Grants(original, at), changes = seed30Grants(original, at), expected = [...materials, ...changes];
  assert.equal(materials.length, 31);
  assert.equal(changes.length, 21); // twelve reads for three profiles and nine duty grants
  assert.deepEqual(sorted(upgraded.filter(g => !ids.has(g.id))), sorted(expected));
}
