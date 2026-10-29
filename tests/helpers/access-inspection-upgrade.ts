import assert from "node:assert/strict";
import {
  accessInspectionSeedGrants,
  accessRequestSeedGrants,
  accessApplicationSeedGrants, accessTeamSeedGrants, accessReviewSeedGrants, conversationSeedGrants, agentAskSeedGrants,
} from "./engineering-materials-grants";

type Row = Record<string, unknown>;
const grant = (r: Row) => (r.row ?? r.value ?? r.v ?? r) as Row;

/** Preserve the whole snapshot, allowing exactly the named seed 78/79/80/83/84 duties and seeds 107/120's readiness policies. */
export function assertAccessInspectionSnapshot(
  actual: Row[][] | Record<string, Row[]>,
  original: Row[][] | Record<string, Row[]>,
  names?: string[],
) {
  const index = names?.indexOf("permission_grants");
  const oldRows = Array.isArray(original)
    ? original[index!]
    : original.permission_grants;
  const newRows = Array.isArray(actual)
    ? actual[index!]
    : actual.permission_grants;
  assert(
    oldRows && newRows,
    "Both snapshots must include all permission grants",
  );
  const oldGrants = oldRows.map(grant),
    ids = new Set(oldGrants.map((g) => g.id));
  assert.deepEqual(
    newRows.filter((r) => ids.has(grant(r).id)),
    oldRows,
  );
  const expected = [
    ...conversationSeedGrants(oldGrants),
    ...accessReviewSeedGrants(oldGrants).map(g => ({ ...g, id: "ad010084-0000-4000-8000-000000000001" })),
    ...accessTeamSeedGrants(oldGrants).map(g => ({ ...g, id: "ad010082-0000-4000-8000-000000000001" })),
    ...accessApplicationSeedGrants(oldGrants).map(g => ({ ...g, id: "ad010080-0000-4000-8000-000000000001" })),
    ...accessInspectionSeedGrants(oldGrants).map((g) => ({
      ...g,
      id: "ad010078-0000-4000-8000-000000000001",
    })),
    ...accessRequestSeedGrants(oldGrants).map((g, i) => ({
      ...g,
      id: `ad010079-0000-4000-8000-00000000000${i + 1}`,
    })),
  ].filter((g) => !ids.has(g.id));
  const byId = (a: Row, b: Row) => String(a.id).localeCompare(String(b.id));
  assert.deepEqual(
    newRows
      .filter((r) => !ids.has(grant(r).id) && grant(r).capability !== "conversation.agent.ask")
      .map(grant)
      .sort(byId),
    expected.sort(byId),
  );
  assert.deepEqual(newRows.map(grant).filter(g => !ids.has(g.id) && g.capability === "conversation.agent.ask").sort(byId),
    agentAskSeedGrants([...oldGrants, ...expected]).sort(byId));
  const preserved: Row[][] | Record<string, Row[]> = Array.isArray(actual)
    ? actual.map((rows, i) => (i === index ? oldRows : rows))
    : { ...actual, permission_grants: oldRows };
  const seedIndex = names?.indexOf("seed_receipts") ?? -1;
  const oldSeeds = Array.isArray(original)
    ? original[seedIndex]
    : original.seed_receipts;
  if (oldSeeds) {
    const newSeeds = Array.isArray(actual)
      ? actual[seedIndex]
      : actual.seed_receipts;
    assert(newSeeds, "The upgraded snapshot must retain the seed ledger");
    assertAccessInspectionSeedLedger(oldSeeds.map(grant), newSeeds.map(grant));
    if (Array.isArray(preserved)) preserved[seedIndex] = oldSeeds;
    else preserved.seed_receipts = oldSeeds;
  }
  // Seed 107 publishes readiness policy SYN-PPO-P04 v2 (field readiness gate): exactly one
  // version row and its nine criteria are added; every earlier policy row stays exact.
  const readinessV2 = "94000000-0000-4000-8000-000000000002";
  const readinessV3 = "94000000-0000-4000-8000-000000000003";
  for (const [table, isV2, count] of [
    ["policy_versions", (r: Row) => r.id === readinessV2, 1],
    ["policy_criteria", (r: Row) => r.policy_version_id === readinessV2, 9],
    ["policy_versions", (r: Row) => r.id === readinessV3, 1],
    ["policy_criteria", (r: Row) => r.policy_version_id === readinessV3, 10],
  ] as const) {
    const i = names?.indexOf(table) ?? -1;
    const oldPolicy = Array.isArray(original)
      ? i >= 0 ? original[i] : undefined
      : original[table];
    const newPolicy = Array.isArray(actual)
      ? i >= 0 ? actual[i] : undefined
      : actual[table];
    if (!oldPolicy || !newPolicy || oldPolicy.some((r) => isV2(grant(r))))
      continue;
    assert.equal(newPolicy.filter((r) => isV2(grant(r))).length, count);
    const previous = Array.isArray(preserved) ? preserved[i] : preserved[table];
    const kept = previous.filter((r) => !isV2(grant(r)));
    if (Array.isArray(preserved)) preserved[i] = kept;
    else preserved[table] = kept;
  }
  const ci = names?.indexOf("contact_outcomes") ?? -1;
  const oldContacts = Array.isArray(original) ? original[ci] : original.contact_outcomes;
  if (oldContacts?.length && !("purpose" in grant(oldContacts[0]))) {
    const newContacts = Array.isArray(actual) ? actual[ci] : actual.contact_outcomes;
    assert.deepEqual(newContacts.map(grant), oldContacts.map(r => ({...grant(r), purpose:"DateAgreement", site_checks:null})));
    if (Array.isArray(preserved)) preserved[ci] = oldContacts;
    else preserved.contact_outcomes = oldContacts;
  }
  assert.deepEqual(preserved, original);
}

export function assertAccessInspectionSeedLedger(
  original: Row[],
  actual: Row[],
) {
  const versions = new Set(original.map((r) => r.version));
  assert.deepEqual(
    actual.filter((r) => versions.has(r.version)),
    original,
  );
  const added = actual.filter((r) => !versions.has(r.version));
  // Snapshots order rows by their JSON text, where 107 sorts before 78; compare the versions as numbers.
  assert.deepEqual(
    added.map((r) => Number(r.version)).sort((a, b) => a - b),
    [78, 79, 80, 83, 84, 107, 108, 110, 120, 121].filter((v) => !versions.has(v)),
  );
  for (const row of added) {
    assert.deepEqual(Object.keys(row).sort(), ["applied_at", "version"]);
    assert(
      Number.isFinite(new Date(row.applied_at as string | Date).getTime()),
    );
  }
}
