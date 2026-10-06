import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { envelope, page } from "../shared/reads";
import { object, invalid } from "../shared/validation";
import { policyReadAuthority } from "./policy-authority";

export type PolicyRecordKind = "proposal" | "review" | "publication";
export type PolicyRecord = {
  id: string;
  version: number;
  saved_at: string;
  actor_name: string;
  proposal_id: string | null;
};
// A small, signed, actor-bound discovery projection. It cannot define review scope.
export async function readPolicyRecords(p: Principal, input: unknown) {
  const raw = object(input, ["kind", "limit", "cursor"]);
  const kind = raw.kind ?? "proposal";
  if (!["proposal", "review", "publication"].includes(String(kind)))
    invalid("kind", "Choose proposals, reviews or publications.");
  const selected = kind as PolicyRecordKind;
  const pg = page(
    { limit: raw.limit, ...(raw.cursor ? { cursor: raw.cursor } : {}) },
    {
      workspace: p.workspace_id,
      actor: p.actor_id,
      kind: `policy-${selected}`,
    },
  );
  const source = {
    proposal: [
      "scheduling_policy_proposals",
      "proposed_at",
      "proposer_id",
      "NULL::uuid",
    ],
    review: [
      "scheduling_policy_reviews",
      "evaluated_at",
      "reviewer_id",
      "r.proposal_id",
    ],
    publication: [
      "scheduling_policy_publications",
      "created_at",
      "created_by",
      "r.proposal_id",
    ],
  }[selected];
  return transaction(async (c) => {
    await c.query("SELECT 1 FROM ppo.workspaces WHERE id=$1 FOR UPDATE", [
      p.workspace_id,
    ]);
    await policyReadAuthority(c, p);
    const rows = (
      await c.query<PolicyRecord>(
        `SELECT r.id,r.version,r.${source[1]} AS saved_at,u.display_name AS actor_name,${source[3]} AS proposal_id
      FROM ppo.${source[0]} r JOIN ppo.users u ON (u.workspace_id,u.id)=(r.workspace_id,r.${source[2]})
      WHERE r.workspace_id=$1 AND ($2::uuid IS NULL OR r.id>$2) ORDER BY r.id LIMIT $3`,
        [p.workspace_id, pg.after, pg.limit + 1],
      )
    ).rows;
    const permissions = await policyReadAuthority(c, p);
    const items = rows.slice(0, pg.limit);
    return {
      ...envelope(
        items,
        rows.length > pg.limit ? pg.cursor(items.at(-1)!.id) : null,
      ),
      ...permissions,
      kind: selected,
    };
  });
}
