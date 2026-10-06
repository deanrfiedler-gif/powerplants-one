import { randomUUID } from "node:crypto";
import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError, unavailable } from "../platform/errors";
import { sharedOperation } from "../platform/operations";
import { hasPermission, type QueryClient } from "../platform/permissions";
import { visible } from "../shared/reads";
import { materialsAccess } from "../engineering/materials/context";
import {
  choice,
  common,
  commonKeys,
  label,
  object,
  uuid,
  version,
} from "../shared/validation";
import { expectVersion, productContext, productRevision } from "./context";
import { appendProductEvent } from "./commands";
import type { Product } from "./model";

async function downstreamContext(
  c: QueryClient,
  p: Principal,
  kind: "Asset" | "MaterialLine",
  id: string,
) {
  if (kind === "Asset") {
    const asset = await visible(c, p, "Asset", id);
    return {
      id,
      company_id: asset.company_id as string,
      version: Number(asset.version),
      label: String(asset.display_number),
      href: `/equipment/${id}`,
      domain: "Equipment",
      basis: {
        model: asset.model,
        manufacturer: asset.manufacturer,
        serial: asset.serial,
        lifecycle_status: asset.lifecycle_status,
      },
    };
  }
  const line = (
    await c.query<{
      id: string;
      company_id: string;
      version: number;
      package_id: string;
      description: string;
      product_ref: string | null;
    }>(
      "SELECT l.*,s.package_id FROM ppo.material_lines l JOIN ppo.material_sets s ON (s.workspace_id,s.id)=(l.workspace_id,l.set_id) WHERE l.workspace_id=$1 AND l.id=$2",
      [p.workspace_id, uuid(id, "target_id")],
    )
  ).rows[0];
  if (!line) throw unavailable();
  await materialsAccess(c, p, line.package_id);
  return {
    id,
    company_id: line.company_id,
    version: line.version,
    label: line.description,
    href: `/engineering/${line.package_id}/materials`,
    domain: "Engineering",
    basis: { product_ref: line.product_ref },
  };
}
export async function previewProductUse(
  p: Principal,
  id: string,
  query: Record<string, string>,
) {
  const b = object(query, ["kind", "target_id"]),
    kind = choice(b.kind, "kind", ["Asset", "MaterialLine"] as const),
    target_id = uuid(b.target_id, "target_id");
  return transaction(async (c) => {
    const product = await productContext(
        c,
        p,
        id,
        "products.relationship.edit",
      ),
      target = await downstreamContext(c, p, kind, target_id);
    if (product.company_id !== target.company_id) throw unavailable();
    return {
      product_version: product.version,
      revision_id: product.current_revision_id,
      target,
      kind,
    };
  });
}
export async function linkProductUse(p: Principal, id: string, value: unknown) {
  const b = object(value, [
    ...commonKeys,
    "expected_version",
    "revision_id",
    "kind",
    "target_id",
    "target_version",
    "evidence",
  ]);
  const input = {
    ...common(b),
    id: uuid(id, "id"),
    expected_version: version(b.expected_version),
    revision_id: uuid(b.revision_id, "revision_id"),
    kind: choice(b.kind, "kind", ["Asset", "MaterialLine"] as const),
    target_id: uuid(b.target_id, "target_id"),
    target_version: version(b.target_version),
    evidence: label(b.evidence, "evidence", 1000),
  };
  return sharedOperation(
    p,
    input,
    "ProductUseLink",
    async (c) => {
      const product = await productContext(
          c,
          p,
          id,
          "products.relationship.edit",
        ),
        target = await downstreamContext(c, p, input.kind, input.target_id);
      if (product.company_id !== target.company_id) throw unavailable();
      return { product, target };
    },
    async (c, { product, target }) => {
      expectVersion(product.version, input.expected_version);
      expectVersion(target.version, input.target_version);
      await productRevision(c, p, product, input.revision_id);
      await c.query(
        "INSERT INTO ppo.product_use_references(id,workspace_id,company_id,product_id,product_revision_id,asset_id,material_line_id,target_version,snapshot,reason,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          randomUUID(),
          p.workspace_id,
          product.company_id,
          id,
          input.revision_id,
          input.kind === "Asset" ? target.id : null,
          input.kind === "MaterialLine" ? target.id : null,
          target.version,
          { ...target, evidence: input.evidence },
          input.reason,
          p.actor_id,
        ],
      );
      const updated = (
        await c.query<Product>(
          "UPDATE ppo.products SET version=version+1,updated_by=$3,updated_at=clock_timestamp() WHERE workspace_id=$1 AND id=$2 RETURNING *",
          [p.workspace_id, id, p.actor_id],
        )
      ).rows[0];
      // Keep the product-wide event free of private owner-domain context.
      return appendProductEvent(
        c,
        p,
        updated,
        {
          ...input,
          reason: "An exact permitted downstream-use reference was retained.",
        },
        "UseLinked",
        { revision_id: input.revision_id },
      );
    },
    "Product",
    "ProductChanged",
  );
}
export async function readProductUses(p: Principal, id: string) {
  return transaction(async (c) => {
    const product = await productContext(c, p, id);
    const rows = (
      await c.query<{
        id: string;
        asset_id: string | null;
        material_line_id: string | null;
        target_version: number;
        product_revision_id: string;
        snapshot: Awaited<ReturnType<typeof downstreamContext>> & {
          evidence: string;
        };
        reason: string;
      }>(
        "SELECT * FROM ppo.product_use_references WHERE workspace_id=$1 AND product_id=$2 ORDER BY created_at DESC LIMIT 100",
        [p.workspace_id, id],
      )
    ).rows;
    const items = [];
    for (const row of rows)
      try {
        const target = await downstreamContext(
          c,
          p,
          row.asset_id ? "Asset" : "MaterialLine",
          (row.asset_id ?? row.material_line_id)!,
        );
        items.push({
          ...row,
          current_version: target.version,
          currentness:
            target.version === row.target_version
              ? "Observed version retained"
              : "Owning record changed — reassessment required",
        });
      } catch (e) {
        if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      }
    return {
      items,
      limit: 100,
      can_link: await hasPermission(
        c,
        p,
        "products.relationship.edit",
        product.company_id,
      ),
      scope:
        "Only permitted explicitly linked uses. No complete discovery or no-impact assertion.",
    };
  });
}
