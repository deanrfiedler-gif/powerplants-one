"use client";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Field, SelectField } from "../../components/business-ui";
import { useCrmResource } from "../../components/crm-state";
import { Button, ButtonLink } from "../../components/ui/button";
import {
  ProductsFrame,
  ResourceState,
  ProductContext,
  TechnicalContent,
  options,
  type Catalogue,
  type Detail,
} from "./shared";

export function CataloguePage() {
  const params = useSearchParams(),
    router = useRouter();
  const query = new URLSearchParams();
  for (const key of ["q", "kind", "state", "lifecycle"])
    if (params.get(key)) query.set(key, params.get(key)!);
  const resource = useCrmResource<Catalogue>(`products?${query}`, true);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`/products?${next}`);
  }
  return (
    <ProductsFrame title="Products catalogue">
      <div className="pd-toolbar">
        <Field
          name="q"
          label="Search exact identity, model or name"
          value={params.get("q") ?? ""}
          onChange={(v) => filter("q", v)}
        />
        <SelectField
          name="kind"
          label="Record kind"
          value={params.get("kind") ?? ""}
          onChange={(v) => filter("kind", v)}
          options={options(["Family", "Model", "Variant"])}
          empty="All kinds"
        />
        <SelectField
          name="state"
          label="Publication state"
          value={params.get("state") ?? ""}
          onChange={(v) => filter("state", v)}
          options={options([
            "Draft",
            "Submitted",
            "Reviewed",
            "Returned",
            "Published",
            "Withdrawn",
          ])}
          empty="All states"
        />
        <SelectField
          name="lifecycle"
          label="Lifecycle"
          value={params.get("lifecycle") ?? ""}
          onChange={(v) => filter("lifecycle", v)}
          options={options(["Unknown", "Supported", "Discontinued", "Retired"])}
          empty="All lifecycle states"
        />
      </div>
      <ResourceState resource={resource} />
      {resource.data && !resource.error && (
        <>
          <div className="pd-actions">
            <p>
              {resource.data.items.length} records in a bounded{" "}
              {resource.data.limit}-record view.
            </p>
            {resource.data.access.some((a) =>
              a.capabilities.includes("products.edit"),
            ) && (
              <ButtonLink href="/products/publication?new=1">
                New catalogue draft
              </ButtonLink>
            )}
          </div>
          {!resource.data.items.length && (
            <section className="pd-panel">
              <h2>
                {query.size
                  ? "No products match these filters"
                  : "No catalogue records yet"}
              </h2>
              <p>
                {query.size
                  ? "Clear the filters or search by the exact identity."
                  : "An authorised author can prepare a synthetic catalogue draft."}
              </p>
              {query.size > 0 && (
                <Button onClick={() => router.replace("/products")}>
                  Clear filters
                </Button>
              )}
            </section>
          )}
          <div className="pd-cards pd-register">
            {resource.data.items.map((p) => (
              <article key={p.id}>
                <p className="pd-eyebrow">
                  {p.kind} · {p.reference}
                </p>
                <h2>
                  <Link href={`/products/${p.id}`}>{p.content.title}</Link>
                </h2>
                <p>{p.content.manufacturer}</p>
                <p>
                  <strong>
                    {p.content.model} / {p.content.variant}
                  </strong>
                </p>
                <dl>
                  <dt>Catalogue / technical revision</dt>
                  <dd>
                    r{p.revision} / {p.content.technical_revision}
                  </dd>
                  <dt>Publication / lifecycle</dt>
                  <dd>
                    {p.state} / {p.content.lifecycle}
                  </dd>
                  <dt>Source as at</dt>
                  <dd>{p.content.source_date}</dd>
                </dl>
                <p className="pd-muted">
                  {p.provider} / {p.entity_key}
                </p>
              </article>
            ))}
          </div>
          <p>
            Stock availability: Unknown — source observations are Not
            configured. Listed products do not establish technical suitability.
          </p>
        </>
      )}
    </ProductsFrame>
  );
}
export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>(),
    params = useSearchParams(),
    revision = params.get("revision_id"),
    resource = useCrmResource<Detail>(
      `products/${id}${revision ? `?revision_id=${revision}` : ""}`,
      true,
    );
  return (
    <ProductsFrame title="Product technical workspace">
      <ButtonLink href="/products" variant="secondary">
        Back to catalogue
      </ButtonLink>
      <ResourceState resource={resource} />
      {resource.data && !resource.error && (
        <>
          <ProductContext detail={resource.data} />
          <nav className="pd-actions" aria-label="Exact product workflows">
            {resource.data.capabilities.some((c) =>
              ["products.edit", "products.review", "products.publish"].includes(
                c,
              ),
            ) && (
              <Link href={`/products/publication?product_id=${id}`}>
                Authoring and publication
              </Link>
            )}
            {resource.data.capabilities.includes(
              "products.commercial.read",
            ) && (
              <Link
                href={`/products/pricing?product_id=${id}&revision_id=${resource.data.revision.id}`}
              >
                Supplier pricing
              </Link>
            )}
            <Link href={`/products/compatibility?product_id=${id}`}>
              Compatibility and replacements
            </Link>
          </nav>
          <p>
            {resource.data.revision.id ===
            resource.data.product.current_revision_id
              ? "Current working revision"
              : "Historical revision — read only"}
            . Currently published catalogue basis:{" "}
            {resource.data.published ? (
              <Link
                href={`/products/${id}?revision_id=${resource.data.published.id}`}
              >
                r{resource.data.published.revision}
              </Link>
            ) : (
              "None"
            )}
            .
          </p>
          <TechnicalContent content={resource.data.revision.content} />
          <section className="pd-panel">
            <h2>Retained revision history</h2>
            {resource.data.revisions.map((r) => (
              <p key={r.id}>
                <Link href={`/products/${id}?revision_id=${r.id}`}>
                  Catalogue r{r.revision}
                </Link>{" "}
                · {r.reason} · {String(r.created_at)}
              </p>
            ))}
            <h3>Review and publication evidence</h3>
            {resource.data.history.map((e) => (
              <article key={e.id}>
                <p>
                  {e.action} · {String(e.created_at)} · actor {e.created_by}
                </p>
                <p>{e.reason}</p>
                {e.purpose && (
                  <p>
                    Purpose {e.purpose} · Audience {e.audience} · Effective{" "}
                    {e.effective_on}
                  </p>
                )}
                {e.supersedes_id && (
                  <p>Supersedes retained revision {e.supersedes_id}</p>
                )}
              </article>
            ))}
          </section>
        </>
      )}
    </ProductsFrame>
  );
}
