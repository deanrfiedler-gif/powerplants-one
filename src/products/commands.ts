import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Principal } from "../platform/identity";
import { AppError } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import {
  common,
  commonKeys,
  choice,
  dateOnly,
  invalid,
  label,
  object,
  optionalId,
  uuid,
  version,
} from "../shared/validation";
import { sourceContext, sourceRevision } from "../estimating/sources/context";
import {
  expectVersion,
  productAuthority,
  productContext,
  productRevision,
} from "./context";
import {
  hash,
  kinds,
  productContent,
  syntheticReference,
  type Content,
  type Product,
} from "./model";

type Command = ReturnType<typeof common>;
type NewProduct = Command & {
  id: string;
  company_id: string;
  reference: string;
  kind: Product["kind"];
  parent_id: string | null;
  provider: string;
  entity_key: string;
  content: Content;
};
export function createInput(value: unknown): NewProduct {
  const b = object(value, [
    ...commonKeys,
    "id",
    "company_id",
    "reference",
    "kind",
    "parent_id",
    "provider",
    "entity_key",
    "content",
  ]);
  const kind = choice(b.kind, "kind", kinds),
    parent_id = optionalId(b.parent_id, "parent_id");
  if ((kind === "Family") !== (parent_id === null))
    invalid(
      "parent_id",
      "A Model needs a Family; a Variant needs a Model; a Family has no parent.",
    );
  return {
    ...common(b),
    id: uuid(b.id, "id"),
    company_id: uuid(b.company_id, "company_id"),
    reference: syntheticReference(b.reference),
    kind,
    parent_id,
    provider: label(b.provider, "provider", 200),
    entity_key: label(b.entity_key, "entity_key", 200),
    content: productContent(b.content),
  };
}
export async function appendProductEvent(
  c: PoolClient,
  p: Principal,
  product: Product,
  input: Command,
  action: string,
  details: {
    revision_id?: string;
    supersedes_id?: string | null;
    purpose?: string;
    audience?: string;
    effective_on?: string;
  } = {},
) {
  await c.query(
    `INSERT INTO ppo.product_events(id,workspace_id,product_id,revision_id,product_version,action,reason,operation_id,created_by,supersedes_id,purpose,audience,effective_on) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [
      randomUUID(),
      p.workspace_id,
      product.id,
      details.revision_id ?? product.current_revision_id,
      product.version,
      action,
      input.reason,
      input.operation_id,
      p.actor_id,
      details.supersedes_id ?? null,
      details.purpose ?? null,
      details.audience ?? null,
      details.effective_on ?? null,
    ],
  );
  return {
    ...product,
    audit_details: {
      revision_id: details.revision_id ?? product.current_revision_id,
      action,
    },
  };
}
async function insertRevision(
  c: PoolClient,
  p: Principal,
  product: Product,
  content: Content,
  predecessor: string | null,
  reason: string,
) {
  await c.query(
    `INSERT INTO ppo.product_revisions(id,workspace_id,company_id,product_id,revision,predecessor_id,content,content_hash,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      product.current_revision_id,
      p.workspace_id,
      product.company_id,
      product.id,
      product.revision,
      predecessor,
      content,
      hash(content),
      reason,
      p.actor_id,
    ],
  );
}
// Internal transaction helpers are used only after domain authority checks (including import apply).
export async function insertProduct(
  c: PoolClient,
  p: Principal,
  input: NewProduct,
) {
  if (input.parent_id) {
    const parent = await productContext(c, p, input.parent_id);
    if (
      parent.company_id !== input.company_id ||
      parent.kind !== (input.kind === "Model" ? "Family" : "Model")
    )
      invalid(
        "parent_id",
        "Choose an exact permitted parent in the same company.",
      );
  }
  const product = (
    await c.query<Product>(
      `INSERT INTO ppo.products(id,workspace_id,company_id,reference,kind,parent_id,provider,entity_key,owner_id,current_revision_id,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$9,$9) RETURNING *`,
      [
        input.id,
        p.workspace_id,
        input.company_id,
        input.reference,
        input.kind,
        input.parent_id,
        input.provider,
        input.entity_key,
        p.actor_id,
        randomUUID(),
      ],
    )
  ).rows[0];
  await insertRevision(c, p, product, input.content, null, input.reason);
  return appendProductEvent(c, p, product, input, "Draft");
}
export async function successor(
  c: PoolClient,
  p: Principal,
  product: Product,
  input: Command & { expected_version: number; content: Content },
) {
  expectVersion(product.version, input.expected_version);
  if (product.state === "Submitted")
    throw new AppError(
      409,
      "ProductInReview",
      "Submitted content is frozen until its exact review decision.",
    );
  const prior = await productRevision(
    c,
    p,
    product,
    product.current_revision_id,
  );
  if (prior.content_hash === hash(input.content))
    invalid("content", "No changed content to save as a successor.");
  const updated = (
    await c.query<Product>(
      "UPDATE ppo.products SET version=version+1,revision=revision+1,current_revision_id=$3,state='Draft',updated_by=$4,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
      [p.workspace_id, product.id, randomUUID(), p.actor_id],
    )
  ).rows[0];
  await insertRevision(c, p, updated, input.content, prior.id, input.reason);
  return appendProductEvent(c, p, updated, input, "Draft");
}
export async function createProduct(p: Principal, value: unknown) {
  const input = createInput(value);
  return sharedOperation(
    p,
    input,
    "ProductCreate",
    (c) => productAuthority(c, p, input.company_id, "products.edit"),
    (c) => insertProduct(c, p, input),
    "Product",
    "ProductChanged",
  );
}
export async function reviseProduct(p: Principal, id: string, value: unknown) {
  const b = object(value, [...commonKeys, "expected_version", "content"]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    content: productContent(b.content),
  };
  return sharedOperation(
    p,
    input,
    "ProductRevise",
    (c) => productContext(c, p, input.id, "products.edit"),
    (c, row) => successor(c, p, row, input),
    "Product",
    "ProductChanged",
  );
}
export async function decideProduct(p: Principal, id: string, value: unknown) {
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "action",
    "purpose",
    "audience",
    "effective_on",
  ]);
  const action = choice(b.action, "action", [
    "Submit",
    "Reviewed",
    "Returned",
    "Published",
    "Withdrawn",
  ] as const);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    revision_id: uuid(b.revision_id, "revision_id"),
    action,
    ...(action === "Published"
      ? {
          purpose: label(b.purpose, "purpose", 200),
          audience: label(b.audience, "audience", 200),
          effective_on: dateOnly(b.effective_on, "effective_on"),
        }
      : {}),
  };
  const capability =
    action === "Submit"
      ? "products.edit"
      : ["Reviewed", "Returned"].includes(action)
        ? "products.review"
        : "products.publish";
  return sharedOperation(
    p,
    input,
    `Product${action}`,
    (c) => productContext(c, p, input.id, capability),
    async (c, row) => {
      expectVersion(row.version, input.expected_version);
      const withdrawing = action === "Withdrawn";
      if (
        input.revision_id !==
        (withdrawing ? row.published_revision_id : row.current_revision_id)
      )
        throw new AppError(
          409,
          "ProductRevisionChanged",
          "Choose the exact current revision, or the exact published revision to withdraw.",
        );
      const revision = await productRevision(c, p, row, input.revision_id);
      if (
        ["Reviewed", "Returned"].includes(action) &&
        revision.created_by === p.actor_id
      )
        throw new AppError(
          403,
          "IndependentReviewRequired",
          "The revision author cannot review their own content.",
        );
      const required =
        action === "Submit"
          ? "Draft"
          : ["Reviewed", "Returned"].includes(action)
            ? "Submitted"
            : "Reviewed";
      if (!withdrawing && row.state !== required)
        throw new AppError(
          409,
          "ProductStateChanged",
          `This action requires ${required} evidence.`,
        );
      const state = action === "Submit" ? "Submitted" : action;
      const published = withdrawing
        ? null
        : action === "Published"
          ? revision.id
          : row.published_revision_id;
      const updated = (
        await c.query<Product>(
          "UPDATE ppo.products SET version=version+1,state=$3,published_revision_id=$4,updated_by=$5,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, row.id, state, published, p.actor_id],
        )
      ).rows[0];
      return appendProductEvent(c, p, updated, input, state, {
        ...input,
        supersedes_id:
          action === "Published" ? row.published_revision_id : null,
      });
    },
    "Product",
    "ProductChanged",
  );
}
export async function bindProductSource(
  p: Principal,
  id: string,
  value: unknown,
) {
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "source_id",
    "source_revision_id",
    "status",
    "evidence",
  ]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    revision_id: uuid(b.revision_id, "revision_id"),
    source_id: uuid(b.source_id, "source_id"),
    source_revision_id: uuid(b.source_revision_id, "source_revision_id"),
    status: choice(b.status, "status", ["Mapped", "Unresolved"] as const),
    evidence: label(b.evidence, "evidence", 1000),
  };
  return sharedOperation(
    p,
    input,
    "ProductSourceBind",
    async (c) => {
      const product = await productContext(
        c,
        p,
        input.id,
        "products.sources.bind",
      );
      await productAuthority(
        c,
        p,
        product.company_id,
        "products.commercial.read",
      );
      const source = await sourceContext(c, p, input.source_id);
      if (source.company_id !== product.company_id)
        invalid(
          "source_id",
          "Source and product must belong to the same company.",
        );
      return { product, source };
    },
    async (c, { product, source }) => {
      expectVersion(product.version, input.expected_version);
      const revision = await productRevision(c, p, product, input.revision_id),
        sourceRev = await sourceRevision(
          c,
          p,
          source,
          input.source_revision_id,
        );
      if (
        input.status === "Mapped" &&
        revision.content.unit !== sourceRev.content.unit
      )
        invalid(
          "status",
          "Units differ; record Unresolved. No unit conversion is configured.",
        );
      await c.query(
        "INSERT INTO ppo.product_cost_source_bindings(id,workspace_id,company_id,product_id,product_revision_id,source_revision_id,status,evidence,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)",
        [
          randomUUID(),
          p.workspace_id,
          product.company_id,
          product.id,
          revision.id,
          sourceRev.id,
          input.status,
          input.evidence,
          p.actor_id,
        ],
      );
      const updated = (
        await c.query<Product>(
          "UPDATE ppo.products SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, product.id, p.actor_id],
        )
      ).rows[0];
      return appendProductEvent(c, p, updated, input, "SourceBound", {
        revision_id: revision.id,
      });
    },
    "Product",
    "ProductChanged",
  );
}
