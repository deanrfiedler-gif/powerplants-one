import type { Principal } from "../platform/identity";
import type { QueryClient } from "../platform/permissions";
import { AppError, unavailable } from "../platform/errors";
import {
  productAuthority,
  productContext,
  productRevision,
} from "../products/context";
import {
  hash,
  relationshipContent,
  relationshipOutcome,
} from "../products/model";
import type { Definition, ProductSnapshot } from "./types";
import type { Run } from "./context";

const refusal = (code: string, message: string): never => {
  throw new AppError(409, code, message);
};

// Historical reads check current authority, not current publication. New commands
// call with current=true while holding the shared workspace mutation lock.
export async function productBindings(
  c: QueryClient,
  p: Principal,
  company: string,
  definition: Definition,
  current = false,
): Promise<ProductSnapshot[]> {
  if (definition.schema_version !== 2) return [];
  await productAuthority(c, p, company);
  const parts = definition.parts.filter((part) => part.product);
  const snapshots: ProductSnapshot[] = [];
  for (const part of parts) {
    const ref = part.product!;
    const product = await productContext(c, p, ref.product_id);
    if (product.company_id !== company) throw unavailable();
    const revision = await productRevision(c, p, product, ref.revision_id);
    if (product.kind !== "Variant")
      refusal(
        "CpqProductVariantRequired",
        "Bind an exact catalogue Variant, not a Family or Model.",
      );
    if (revision.content_hash !== ref.content_hash)
      refusal(
        "CpqProductEvidenceChanged",
        "Use the exact retained Product revision and content hash.",
      );
    if (revision.content.unit !== part.unit)
      refusal(
        "CpqProductUnitMismatch",
        "The component and published Variant must use the same unit. Conversion is not configured.",
      );
    if (current && product.published_revision_id !== revision.id)
      refusal(
        "CpqProductPublicationChanged",
        "A mapped Variant is unpublished, withdrawn or superseded. Review a new release mapping; no newer revision is substituted.",
      );
    const event = (
      await c.query<{
        id: string;
        purpose: string;
        audience: string;
        effective_on: string;
        supersedes_id: string | null;
        reason: string;
        created_by: string;
        created_at: Date;
      }>(
        "SELECT id,purpose,audience,effective_on::text,supersedes_id,reason,created_by,created_at FROM ppo.product_events WHERE workspace_id=$1 AND product_id=$2 AND revision_id=$3 AND action='Published' ORDER BY product_version DESC LIMIT 1",
        [p.workspace_id, product.id, revision.id],
      )
    ).rows[0];
    if (!event)
      refusal(
        "CpqProductPublicationChanged",
        "The exact Product revision has no publication evidence.",
      );
    const relationship_evidence: ProductSnapshot["relationship_evidence"] = [];
    for (const selected of ref.relationships) {
      const row = (
        await c.query<{
          company_id: string;
          from_revision_id: string;
          to_revision_id: string;
          content: unknown;
          content_hash: string;
          created_by: string;
        }>(
          "SELECT * FROM ppo.product_relationships WHERE workspace_id=$1 AND id=$2",
          [p.workspace_id, selected.id],
        )
      ).rows[0];
      if (!row || row.company_id !== company) throw unavailable();
      if (
        ![row.from_revision_id, row.to_revision_id].includes(revision.id) ||
        ![row.from_revision_id, row.to_revision_id].every((id) =>
          parts.some((part) => part.product!.revision_id === id),
        )
      )
        refusal(
          "CpqProductRelationshipMismatch",
          "A selected relationship must connect this exact revision to another explicitly bound revision.",
        );
      const content = relationshipContent(row.content);
      if (
        row.content_hash !== selected.content_hash ||
        hash(content) !== selected.content_hash
      )
        refusal(
          "CpqProductEvidenceChanged",
          "Review the exact retained relationship content hash.",
        );
      const review = (
        await c.query<
          Omit<
            ProductSnapshot["relationship_evidence"][number]["review"],
            "created_at"
          > & {
            created_at: Date;
          }
        >(
          "SELECT id,outcome,reason,created_by,created_at FROM ppo.product_relationship_reviews WHERE workspace_id=$1 AND relationship_id=$2 AND id=$3",
          [p.workspace_id, selected.id, selected.review_id],
        )
      ).rows[0];
      if (
        !review ||
        review.outcome !== "Conditional" ||
        review.created_by === row.created_by ||
        content.type !== "Compatibility"
      )
        refusal(
          "CpqProductCompatibilityReviewRequired",
          "Select independently reviewed Conditional compatibility evidence. Replacement nominations and unresolved/rejected assessments do not establish compatibility.",
        );
      relationshipOutcome(content, review.outcome);
      if (
        current &&
        (
          await c.query(
            "SELECT 1 FROM ppo.product_relationships WHERE workspace_id=$1 AND predecessor_id=$2 LIMIT 1",
            [p.workspace_id, selected.id],
          )
        ).rowCount
      )
        refusal(
          "CpqProductRelationshipSuperseded",
          "The selected compatibility evidence has a successor. Review an exact new mapping before use.",
        );
      relationship_evidence.push({
        id: selected.id,
        content_hash: selected.content_hash,
        from_revision_id: row.from_revision_id,
        to_revision_id: row.to_revision_id,
        content,
        review: { ...review, created_at: review.created_at.toISOString() },
      });
    }
    const { id, created_by, created_at, ...details } = event;
    snapshots.push({
      part_key: part.key,
      ...ref,
      reference: product.reference,
      provider: product.provider,
      entity_key: product.entity_key,
      parent_id: product.parent_id!,
      revision: revision.revision,
      content: revision.content,
      publication: {
        id,
        details,
        created_by,
        created_at: created_at.toISOString(),
      },
      availability: "Unknown",
      supplier_lead_time: "Unknown",
      compatibility: relationship_evidence.length
        ? "ConditionalEvidence"
        : "NotAssessed",
      relationship_evidence,
    });
  }
  return snapshots;
}

// Exact line attribution stays outside the native customer-safe cost line shape.
export function productLineEvidence(saved: Pick<Run, "binding" | "result">) {
  return saved.result.lines.flatMap((line) => {
    const product = saved.binding.products?.find((p) =>
      line.target.endsWith(`:${p.part_key}:${p.content.unit}`),
    );
    return product
      ? [
          {
            line_id: line.line.id,
            target: line.target,
            basis_hash: line.basis_hash,
            product,
          },
        ]
      : [];
  });
}
