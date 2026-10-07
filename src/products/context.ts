import type { Principal } from "../platform/identity";
import { AppError, unavailable } from "../platform/errors";
import type { QueryClient } from "../platform/permissions";
import { companyContext } from "../shared/authority";
import { uuid } from "../shared/validation";
import {
  hash,
  productContent,
  type Product,
  type ProductCapability,
  type Revision,
} from "./model";

export async function productAuthority(
  c: QueryClient,
  p: Principal,
  company: string,
  capability: ProductCapability = "products.read",
) {
  await companyContext(c, p, company, null, "products.read");
  if (capability !== "products.read")
    await companyContext(c, p, company, null, capability);
}
export async function productContext(
  c: QueryClient,
  p: Principal,
  id: string,
  capability: ProductCapability = "products.read",
) {
  const row = (
    await c.query<Product>(
      "SELECT * FROM ppo.products WHERE workspace_id=$1 AND id=$2",
      [p.workspace_id, uuid(id, "product_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await productAuthority(c, p, row.company_id, capability);
  return row;
}
export async function productRevision(
  c: QueryClient,
  p: Principal,
  product: Product,
  id: string,
) {
  const row = (
    await c.query<Revision>(
      "SELECT * FROM ppo.product_revisions WHERE workspace_id=$1 AND product_id=$2 AND id=$3",
      [p.workspace_id, product.id, uuid(id, "revision_id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  const content = productContent(row.content);
  if (hash(content) !== row.content_hash)
    throw new AppError(
      409,
      "ProductEvidenceMismatch",
      "The retained catalogue content does not match its hash.",
    );
  return { ...row, content };
}
export function expectVersion(actual: number, expected: number) {
  if (actual !== expected)
    throw new AppError(
      409,
      "StaleVersion",
      "The record changed. Retain your inputs and compare the current revision before creating a new command.",
    );
}
export const productCommandCapabilities: Record<string, ProductCapability> = {
  ProductUseLink: "products.relationship.edit",
  ProductCreate: "products.edit",
  ProductRevise: "products.edit",
  ProductSubmit: "products.edit",
  ProductReviewed: "products.review",
  ProductReturned: "products.review",
  ProductPublished: "products.publish",
  ProductWithdrawn: "products.publish",
  ProductSourceBind: "products.sources.bind",
  ProductRelationshipCreate: "products.relationship.edit",
  ProductRelationshipReview: "products.relationship.review",
  ProductImportStage: "products.import.stage",
  ProductImportMap: "products.import.stage",
  ProductImportReviewed: "products.import.review",
  ProductImportReturned: "products.import.review",
  ProductImportApply: "products.import.apply",
};
export async function productReceiptAuthority(
  c: QueryClient,
  p: Principal,
  id: string,
  command: string,
  type: string,
) {
  const capability = productCommandCapabilities[command];
  if (!capability) throw unavailable();
  if (type === "Product") {
    const product = await productContext(c, p, id, capability);
    if (command === "ProductSourceBind") {
      await productAuthority(
        c,
        p,
        product.company_id,
        "products.commercial.read",
      );
      await companyContext(c, p, product.company_id, null, "estimating.read");
    }
    return product;
  }
  const table =
    type === "ProductRelationship"
      ? "product_relationships"
      : type === "ProductImport"
        ? "product_imports"
        : null;
  if (!table) throw unavailable();
  const row = (
    await c.query<{ company_id: string }>(
      `SELECT company_id FROM ppo.${table} WHERE workspace_id=$1 AND id=$2`,
      [p.workspace_id, uuid(id, "id")],
    )
  ).rows[0];
  if (!row) throw unavailable();
  await productAuthority(c, p, row.company_id, capability);
}
