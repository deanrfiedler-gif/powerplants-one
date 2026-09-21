import { randomUUID } from "node:crypto";
import type { QueryClient } from "../../platform/permissions";
import type { Principal } from "../../platform/identity";
import type { EstimateVersion } from "../context";
import { available, mismatch } from "./context";
import { hash } from "./hash";
import type { Contribution, LineageSnapshot } from "./types";
type Manifest = {
  id: string;
  snapshot: LineageSnapshot;
  content_hash: string;
  estimate_content_hash: string;
  basis_revision_id: string | null;
};
function estimateHash(v: EstimateVersion) {
  return hash({
    title: v.title,
    scope: v.scope,
    lines: v.lines,
    policy: v.policy,
    ...(v.cost_schema_version === 2 ? { cost_schema_version: 2 } : {}),
  });
}
export async function readLineage(
  c: QueryClient,
  p: Principal,
  v: EstimateVersion,
): Promise<Manifest | null> {
  if (!(await available(c))) return null;
  const m = (
    await c.query<Manifest>(
      "SELECT * FROM ppo.estimate_specialist_lineage WHERE workspace_id=$1 AND estimate_version_id=$2",
      [p.workspace_id, v.id],
    )
  ).rows[0];
  if (!m) return null;
  const basis =
    (
      await c.query(
        "SELECT revision_id FROM ppo.estimate_discovery_bases WHERE workspace_id=$1 AND estimate_version_id=$2",
        [p.workspace_id, v.id],
      )
    ).rows[0]?.revision_id ?? null;
  if (
    estimateHash(v) !== v.content_hash ||
    hash(m.snapshot) !== m.content_hash ||
    m.snapshot.estimate_version_id !== v.id ||
    m.snapshot.estimate_id !== v.estimate_id ||
    m.snapshot.estimate_content_hash !== v.content_hash ||
    m.estimate_content_hash !== v.content_hash ||
    m.snapshot.basis_revision_id !== basis ||
    m.basis_revision_id !== basis
  )
    mismatch();
  const owned = new Set<string>(),
    keys = new Set<string>();
  for (const x of m.snapshot.contributions) {
    const key = `${x.configuration_id}:${x.key}`;
    if (keys.has(key)) mismatch();
    keys.add(key);
    const line = v.lines.find((l) => l.id === x.line_id) ?? null;
    if (hash(line) !== hash(x.current)) mismatch();
    if (x.disposition === "Owned" && line) {
      if (owned.has(x.line_id)) mismatch();
      owned.add(x.line_id);
    }
  }
  return m;
}
export async function writeLineage(
  c: QueryClient,
  p: Principal,
  versionId: string,
  predecessorVersionId: string | null,
  contributions?: Contribution[],
) {
  if (!(await available(c))) return null;
  const v = (
    await c.query<EstimateVersion>(
      "SELECT * FROM ppo.estimate_versions WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, versionId],
    )
  ).rows[0];
  if (!v) mismatch();
  const old = predecessorVersionId
      ? (
          await c.query<EstimateVersion>(
            "SELECT * FROM ppo.estimate_versions WHERE workspace_id=$1 AND id=$2",
            [p.workspace_id, predecessorVersionId],
          )
        ).rows[0]
      : null,
    prior = old ? await readLineage(c, p, old) : null;
  const basis =
    (
      await c.query(
        "SELECT revision_id FROM ppo.estimate_discovery_bases WHERE workspace_id=$1 AND estimate_version_id=$2",
        [p.workspace_id, v.id],
      )
    ).rows[0]?.revision_id ?? null;
  const entries =
    contributions ??
    (prior?.snapshot.contributions ?? []).map((x) => ({
      ...x,
      current: v.lines.find((l) => l.id === x.line_id) ?? null,
      source_basis_changed: x.source_revision_id !== basis,
    }));
  const snapshot: LineageSnapshot = {
    schema_version: 1,
    estimate_id: v.estimate_id,
    estimate_version_id: v.id,
    estimate_content_hash: v.content_hash,
    basis_revision_id: basis,
    predecessor_id: prior?.id ?? null,
    contributions: entries,
  };
  const id = randomUUID();
  await c.query(
    "INSERT INTO ppo.estimate_specialist_lineage(id,workspace_id,company_id,estimate_id,estimate_version_id,basis_revision_id,predecessor_id,estimate_content_hash,snapshot,content_hash) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
    [
      id,
      p.workspace_id,
      v.company_id,
      v.estimate_id,
      v.id,
      basis,
      prior?.id ?? null,
      v.content_hash,
      snapshot,
      hash(snapshot),
    ],
  );
  return { id, snapshot, content_hash: hash(snapshot) };
}
