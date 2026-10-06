import type { Principal } from "../platform/identity";
import { transaction } from "../platform/database";
import { AppError } from "../platform/errors";
import {
  hasPermission,
  requireCapability,
  scopeSql,
} from "../platform/permissions";
import { choice, object, optionalId, optionalText } from "../shared/validation";
import { readCostSource } from "../estimating/sources/reads";
import {
  compareContent,
  kinds,
  productCapabilities,
  states,
  type Product,
  type Revision,
} from "./model";
import { productAuthority, productContext, productRevision } from "./context";

export async function listProducts(
  p: Principal,
  query: Record<string, string> = {},
) {
  const b = object(query, ["q", "kind", "state", "lifecycle"]),
    q = optionalText(b.q, "q", 100) ?? "";
  const kind = b.kind ? choice(b.kind, "kind", kinds) : null,
    state = b.state ? choice(b.state, "state", states) : null;
  const lifecycle = b.lifecycle
    ? choice(b.lifecycle, "lifecycle", [
        "Unknown",
        "Supported",
        "Discontinued",
        "Retired",
      ] as const)
    : null;
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    await requireCapability(c, p, "products.read");
    const items = (
      await c.query<Product & { content: Revision["content"] }>(
        `SELECT s.*,r.content FROM ppo.products s JOIN ppo.product_revisions r ON (r.workspace_id,r.id)=(s.workspace_id,s.current_revision_id)
      WHERE s.workspace_id=$1 AND ${scopeSql("s.company_id", "NULL", "products.read")} AND ${scopeSql("s.company_id", "NULL", "shared.read")}
      AND ($3='' OR strpos(lower(s.reference||' '||s.id::text||' '||s.provider||' '||s.entity_key||' '||(r.content->>'title')||' '||(r.content->>'manufacturer')||' '||(r.content->>'model')||' '||(r.content->>'variant')),lower($3))>0)
      AND ($4::text IS NULL OR s.kind=$4) AND ($5::text IS NULL OR s.state=$5) AND ($6::text IS NULL OR r.content->>'lifecycle'=$6) ORDER BY r.content->>'title',s.id LIMIT 100`,
        [p.workspace_id, p.actor_id, q, kind, state, lifecycle],
      )
    ).rows;
    const companies = (
      await c.query<{ id: string; display_name: string }>(
        `SELECT c.id,c.display_name FROM ppo.companies c WHERE c.workspace_id=$1 AND ${scopeSql("c.id", "NULL", "products.read")} AND ${scopeSql("c.id", "NULL", "shared.read")} ORDER BY c.display_name`,
        [p.workspace_id, p.actor_id],
      )
    ).rows;
    const access: {
      company_id: string;
      capabilities: (typeof productCapabilities)[number][];
    }[] = [];
    for (const company of companies) {
      const capabilities: (typeof productCapabilities)[number][] = [];
      for (const cap of productCapabilities)
        if (await hasPermission(c, p, cap, company.id)) capabilities.push(cap);
      access.push({ company_id: company.id, capabilities });
    }
    return {
      items,
      companies,
      access,
      filters: { q, kind, state, lifecycle },
      limit: 100,
      synthetic: true,
      stock: { state: "NotConfigured", observation: null },
    };
  });
}
export async function readProduct(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const b = object(query, ["revision_id"]);
  return transaction(async (c) => {
    await c.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
    const product = await productContext(c, p, id),
      revision = await productRevision(
        c,
        p,
        product,
        optionalId(b.revision_id, "revision_id") ?? product.current_revision_id,
      );
    const previous = revision.predecessor_id
      ? await productRevision(c, p, product, revision.predecessor_id)
      : null;
    const commercial =
      (await hasPermission(
        c,
        p,
        "products.commercial.read",
        product.company_id,
      )) && (await hasPermission(c, p, "estimating.read", product.company_id));
    const history = (
      await c.query<{
        id: string;
        revision_id: string;
        product_version: number;
        action: string;
        reason: string;
        purpose: string | null;
        audience: string | null;
        effective_on: string | null;
        supersedes_id: string | null;
        created_by: string;
        created_at: Date;
      }>(
        "SELECT id,revision_id,product_version,action,reason,purpose,audience,effective_on,supersedes_id,created_by,created_at FROM ppo.product_events WHERE workspace_id=$1 AND product_id=$2 AND (action<>'SourceBound' OR $3) ORDER BY product_version DESC",
        [p.workspace_id, product.id, commercial],
      )
    ).rows;
    const revisions = (
      await c.query<Revision>(
        "SELECT * FROM ppo.product_revisions WHERE workspace_id=$1 AND product_id=$2 ORDER BY revision DESC",
        [p.workspace_id, product.id],
      )
    ).rows;
    const capabilities: (typeof productCapabilities)[number][] = [];
    for (const cap of productCapabilities)
      if (await hasPermission(c, p, cap, product.company_id))
        capabilities.push(cap);
    const published = product.published_revision_id
      ? await productRevision(c, p, product, product.published_revision_id)
      : null;
    const selectedEvent = history.find(
      (e) =>
        e.revision_id === revision.id &&
        !["SourceBound", "UseLinked"].includes(e.action),
    );
    const selected_state = history.some((e) => e.supersedes_id === revision.id)
      ? "Superseded"
      : (selectedEvent?.action ?? "Draft");
    return {
      product,
      revision,
      selected_state,
      previous,
      published,
      changes: compareContent(previous?.content ?? null, revision.content),
      revisions,
      history,
      capabilities,
      actor_id: p.actor_id,
      synthetic: true,
      stock: { state: "NotConfigured", observation: null },
    };
  });
}
export async function productPricing(
  p: Principal,
  id: string,
  query: Record<string, string> = {},
) {
  const b = object(query, ["revision_id"]);
  const data = await transaction(async (c) => {
    const product = await productContext(c, p, id, "products.commercial.read"),
      revision = await productRevision(
        c,
        p,
        product,
        optionalId(b.revision_id, "revision_id") ?? product.current_revision_id,
      );
    const bindings = (
      await c.query<{
        id: string;
        source_id: string;
        source_revision_id: string;
        status: string;
        evidence: string;
        created_at: Date;
      }>(
        "SELECT b.*,r.source_id FROM ppo.product_cost_source_bindings b JOIN ppo.cost_source_revisions r ON (r.workspace_id,r.id)=(b.workspace_id,b.source_revision_id) WHERE b.workspace_id=$1 AND b.product_revision_id=$2 ORDER BY b.created_at DESC",
        [p.workspace_id, revision.id],
      )
    ).rows;
    return {
      product,
      revision,
      bindings,
      can_bind: await hasPermission(
        c,
        p,
        "products.sources.bind",
        product.company_id,
      ),
    };
  });
  const sources = [];
  for (const binding of data.bindings) {
    try {
      sources.push({
        binding,
        source: await readCostSource(p, binding.source_id, {
          revision_id: binding.source_revision_id,
        }),
        unavailable: false,
      });
    } catch (e) {
      if (!(e instanceof AppError) || ![403, 404].includes(e.status)) throw e;
      sources.push({ binding: null, source: null, unavailable: true });
    }
  }
  // No amounts or supplier identity are returned by technical reads. This projection
  // delegates every commercial/affected-estimate read to the existing owner service.
  return {
    product: data.product,
    revision: data.revision,
    can_bind: data.can_bind,
    sources,
    currency: "AUD",
    tax_basis: "ExcludingTax",
    synthetic: true,
  };
}
export async function productReadAuthority(p: Principal, company: string) {
  return transaction((c) => productAuthority(c, p, company));
}
