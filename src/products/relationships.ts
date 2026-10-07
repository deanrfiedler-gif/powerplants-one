import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  hasPermission,
  requireCapability,
  scopeSql,
  type QueryClient,
} from "../platform/permissions";
import {
  common,
  commonKeys,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import {
  expectVersion,
  productAuthority,
  productContext,
  productRevision,
} from "./context";
import {
  exactRevisionIds,
  hash,
  relationshipContent,
  relationshipOutcome,
  type RelationshipContent,
} from "./model";

export type Relationship = {
  id: string;
  workspace_id: string;
  company_id: string;
  from_revision_id: string;
  to_revision_id: string;
  predecessor_id: string | null;
  content: RelationshipContent;
  content_hash: string;
  version: number;
  state: string;
  created_by: string;
  updated_at: Date;
  created_at: Date;
};
async function context(
  c: QueryClient,
  p: Principal,
  id: string,
  review = false,
) {
  const row = (
    await c.query<Relationship>(
      "SELECT * FROM ppo.product_relationships WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await productAuthority(
    c,
    p,
    row.company_id,
    review ? "products.relationship.review" : "products.read",
  );
  return row;
}
export async function createRelationship(p: Principal, value: unknown) {
  const b = object(value, [
    ...commonKeys,
    "id",
    "from",
    "to",
    "predecessor_id",
    "content",
  ]);
  const input = {
    ...common(b),
    id: uuid(b.id, "id"),
    from: exactRevisionIds(b.from),
    to: exactRevisionIds(b.to),
    predecessor_id: optionalId(b.predecessor_id, "predecessor_id"),
    content: relationshipContent(b.content),
  };
  return sharedOperation(
    p,
    input,
    "ProductRelationshipCreate",
    async (c) => {
      const from = await productContext(
          c,
          p,
          input.from.product_id,
          "products.relationship.edit",
        ),
        to = await productContext(c, p, input.to.product_id);
      if (from.company_id !== to.company_id || from.id === to.id)
        throw new AppError(
          422,
          "InvalidRelationship",
          "Choose distinct exact products in the same permitted company.",
        );
      await productRevision(c, p, from, input.from.revision_id);
      await productRevision(c, p, to, input.to.revision_id);
      if (
        input.predecessor_id &&
        (await context(c, p, input.predecessor_id)).company_id !==
          from.company_id
      )
        throw unavailable();
      return from;
    },
    async (c, from) =>
      (
        await c.query<Relationship>(
          `INSERT INTO ppo.product_relationships(id,workspace_id,company_id,from_revision_id,to_revision_id,predecessor_id,content,content_hash,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
          [
            input.id,
            p.workspace_id,
            from.company_id,
            input.from.revision_id,
            input.to.revision_id,
            input.predecessor_id,
            input.content,
            hash(input.content),
            input.reason,
            p.actor_id,
          ],
        )
      ).rows[0],
    "ProductRelationship",
    "ProductRelationshipChanged",
  );
}
export async function reviewRelationship(
  p: Principal,
  id: string,
  value: unknown,
) {
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "content_hash",
    "outcome",
  ]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    content_hash: String(b.content_hash),
    outcome: String(b.outcome),
  };
  return sharedOperation(
    p,
    input,
    "ProductRelationshipReview",
    (c) => context(c, p, id, true),
    async (c, row) => {
      expectVersion(row.version, input.expected_version);
      if (row.created_by === p.actor_id)
        throw new AppError(
          403,
          "IndependentReviewRequired",
          "The relationship author cannot review their own evidence.",
        );
      if (input.content_hash !== row.content_hash)
        throw new AppError(
          409,
          "RelationshipChanged",
          "Review the exact saved relationship.",
        );
      const outcome = relationshipOutcome(row.content, input.outcome);
      await c.query(
        "INSERT INTO ppo.product_relationship_reviews(id,workspace_id,relationship_id,outcome,reason,created_by) VALUES($1,$2,$3,$4,$5,$6)",
        [
          randomUUID(),
          p.workspace_id,
          row.id,
          outcome,
          input.reason,
          p.actor_id,
        ],
      );
      return {
        ...row,
        state: outcome,
        updated_at: new Date(),
        audit_details: { content_hash: row.content_hash },
      };
    },
    "ProductRelationship",
    "ProductRelationshipChanged",
  );
}
export async function listRelationships(
  p: Principal,
  query: Record<string, string> = {},
) {
  const b = object(query, ["product_id"]),
    product_id = optionalId(b.product_id, "product_id");
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireCapability(c, p, "products.read");
    if (product_id) await productContext(c, p, product_id);
    const rows = (
      await c.query<
        Relationship & {
          from_product_id: string;
          to_product_id: string;
          from_content: import("./model").Content;
          to_content: import("./model").Content;
          from_revision: number;
          to_revision: number;
          outcome: string | null;
          review_reason: string | null;
          reviewer: string | null;
        }
      >(
        `SELECT r.*,f.product_id AS from_product_id,t.product_id AS to_product_id,f.content AS from_content,t.content AS to_content,f.revision AS from_revision,t.revision AS to_revision,v.outcome,v.reason AS review_reason,v.created_by AS reviewer FROM ppo.product_relationships r JOIN ppo.product_revisions f ON (f.workspace_id,f.id)=(r.workspace_id,r.from_revision_id) JOIN ppo.product_revisions t ON (t.workspace_id,t.id)=(r.workspace_id,r.to_revision_id) LEFT JOIN ppo.product_relationship_reviews v ON (v.workspace_id,v.relationship_id)=(r.workspace_id,r.id) WHERE r.workspace_id=$1 AND ${scopeSql("r.company_id", "NULL", "products.read")} AND ${scopeSql("r.company_id", "NULL", "shared.read")} AND ($3::uuid IS NULL OR f.product_id=$3 OR t.product_id=$3) ORDER BY r.created_at DESC LIMIT 100`,
        [p.workspace_id, p.actor_id, product_id],
      )
    ).rows;
    const items = [];
    for (const row of rows)
      items.push({
        ...row,
        can_review:
          !row.outcome &&
          row.created_by !== p.actor_id &&
          (await hasPermission(
            c,
            p,
            "products.relationship.review",
            row.company_id,
          )),
      });
    return { items, limit: 100, synthetic: true };
  });
}
