import assert from "node:assert/strict";
import {
  accessInspectionSeedGrants,
  accessRequestSeedGrants,
} from "./engineering-materials-grants";

type Row = Record<string, unknown>;
const grant = (r: Row) => (r.row ?? r.value ?? r.v ?? r) as Row;

/** Preserve the whole snapshot, allowing exactly the named seed 78/79 duties. */
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
      .filter((r) => !ids.has(grant(r).id))
      .map(grant)
      .sort(byId),
    expected.sort(byId),
  );
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
  assert.deepEqual(
    added.map((r) => r.version),
    [78, 79].filter((v) => !versions.has(v)),
  );
  for (const row of added) {
    assert.deepEqual(Object.keys(row).sort(), ["applied_at", "version"]);
    assert(
      Number.isFinite(new Date(row.applied_at as string | Date).getTime()),
    );
  }
}
