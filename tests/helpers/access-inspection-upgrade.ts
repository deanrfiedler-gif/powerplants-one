import assert from "node:assert/strict";
import { accessInspectionSeedGrants } from "./engineering-materials-grants";

type Row = Record<string, unknown>;
const grant = (r: Row) => (r.row ?? r.value ?? r.v ?? r) as Row;

/** Preserve the whole snapshot, allowing exactly seed 78's named, scoped grant. */
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
  assert.deepEqual(
    newRows.filter((r) => !ids.has(grant(r).id)).map(grant),
    accessInspectionSeedGrants(oldGrants).map((g) => ({
      ...g,
      id: "ad010078-0000-4000-8000-000000000001",
    })),
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
  assert.deepEqual(
    actual.filter((r) => r.version !== 78),
    original,
  );
  const added = actual.filter((r) => r.version === 78);
  assert.equal(added.length, 1);
  assert.deepEqual(Object.keys(added[0]).sort(), ["applied_at", "version"]);
  assert(
    Number.isFinite(new Date(added[0].applied_at as string | Date).getTime()),
  );
}
