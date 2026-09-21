// Authored expectations for seed 41's additive showcase, independent of the SQL.
// Existing identities remain byte-exact; only ORG/SITE/AST counters advance.
import assert from "node:assert/strict";

type Counter = { workspace_id: string; record_type: string; namespace: string; last_value: string | number };
const workspace = "10000000-0000-4000-8000-000000000001";
const additions: Readonly<Record<string, number>> = { ORG: 1, SITE: 2, AST: 1 };

export function facilitySeedCounters<T extends Counter>(before: readonly T[]): T[] {
  for (const code of Object.keys(additions))
    assert.equal(before.filter(row => row.workspace_id === workspace && row.namespace === "SYN-PPO" && row.record_type === code).length, 1);
  return before.map(row => {
    const delta = row.workspace_id === workspace && row.namespace === "SYN-PPO" ? additions[row.record_type] ?? 0 : 0;
    const value = BigInt(row.last_value) + BigInt(delta);
    return { ...row, last_value: typeof row.last_value === "number" ? Number(value) : value.toString() };
  });
}

export function facilitySeedIdentities(before: readonly Counter[]) {
  const number = (code: string, offset: number) => {
    const counter = before.find(row => row.workspace_id === workspace && row.namespace === "SYN-PPO" && row.record_type === code);
    assert.ok(counter, `Expected existing ${code} counter`);
    return `SYN-PPO-${code}-${(BigInt(counter.last_value) + BigInt(offset)).toString().padStart(6, "0")}`;
  };
  const identity = (id: string, object_type: string, display_number: string | null = null) => ({ workspace_id: workspace, id, object_type, display_number, synthetic: true });
  return [
    identity("c5050000-0000-4000-8000-000000000001", "Organisation", number("ORG", 1)),
    identity("c5050001-0000-4000-8000-000000000001", "Site", number("SITE", 1)),
    identity("c5050001-0000-4000-8000-000000000002", "Site", number("SITE", 2)),
    ...Array.from({ length: 9 }, (_, index) => identity(`c5050002-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, "Facility")),
    identity("c5050003-0000-4000-8000-000000000001", "Asset", number("AST", 1)),
    identity("c5050004-0000-4000-8000-000000000001", "SiteParty"),
    identity("c5050004-0000-4000-8000-000000000002", "SiteParty"),
    identity("c5050005-0000-4000-8000-000000000001", "AssetLocationEvent"),
  ];
}
