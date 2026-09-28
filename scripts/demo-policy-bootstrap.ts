import type { PoolClient } from "pg";
import { canonical } from "../src/platform/operations";
import {
  POLICY_FAMILY,
  policyContent,
  policyReference,
} from "../src/scheduling/policy-chain";
import { loadPolicyChain } from "../src/scheduling/policy-persistence";
import { SCHEDULING_POLICY_ID } from "../src/scheduling/validation";
import { demoWorkspace } from "./demo-runtime";

// Exact P05 roots, before and after 3cb76a4's fresh-fixture date shift. Existing
// hosted databases deliberately retained the original expiry. This is an
// operator-only seed-53 compatibility path, not publication or an expiry change.
const retainedRootHash =
  "19874ea4e67397f9d197c181f84a97246925f3c9634fde8e6de6c3c2109ba304";
const currentRootHash =
  "130d586ec49c5e23dffd49916148babc6ddf329a442e054ecc1c29f9089cca44";
const refused = () =>
  new Error(
    "Unrecognised scheduling seed root; preserve and review this database.",
  );

/** Caller owns the existing upgrade transaction/lock and seed receipt. Keep the
 * installed SQL seed bytes unchanged; never update a policy or a saved head. */
export async function bootstrapDemoSchedulingPolicy(
  db: PoolClient,
  seedSql: string,
) {
  const row = (
    await db.query(
      `SELECT id,version,name,evidence,status,synthetic,
    effective_from,effective_to,source_as_at,initial_contact_required,changed_contact_allowed,
    all_crew_skilled,max_visit_minutes FROM ppo.scheduling_policies WHERE workspace_id=$1 AND id=$2`,
      [demoWorkspace, SCHEDULING_POLICY_ID],
    )
  ).rows[0];
  if (!row) throw refused();
  const { status, synthetic, ...stored } = row;
  if (status !== "Published" || synthetic !== true) throw refused();
  const content = policyContent({
    ...stored,
    effective_from: row.effective_from.toISOString(),
    effective_to: row.effective_to.toISOString(),
    source_as_at: row.source_as_at.toISOString(),
  });
  const root = policyReference(content);
  if (root.content_hash === currentRootHash) {
    await db.query(seedSql);
  } else if (root.content_hash === retainedRootHash) {
    console.log("Demo upgrade stage: bootstrap-retained-scheduling-root");
    await db.query(
      `INSERT INTO ppo.scheduling_policy_families(workspace_id,family,root_policy_id)
      VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
      [demoWorkspace, POLICY_FAMILY, root.id],
    );
    await db.query(
      `INSERT INTO ppo.scheduling_policy_members
      (workspace_id,family,policy_id,policy_version,chain_version,content,canonical_content,content_hash)
      VALUES($1,$2,$3,$4,1,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [
        demoWorkspace,
        POLICY_FAMILY,
        root.id,
        root.version,
        content,
        canonical(content),
        root.content_hash,
      ],
    );
    await db.query(
      `INSERT INTO ppo.scheduling_policy_heads(workspace_id,family,policy_id,version)
      VALUES($1,$2,$3,1) ON CONFLICT DO NOTHING`,
      [demoWorkspace, POLICY_FAMILY, root.id],
    );
  } else throw refused();
  // A conflicting pre-existing family must not be silently accepted by ON CONFLICT.
  // Validation also preserves a complete, legitimately advanced chain on replay.
  const chain = await loadPolicyChain(db, demoWorkspace);
  if (canonical(chain.seed_root) !== canonical(root)) throw refused();
}
