"use client";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCrmResource } from "../../components/crm-state";
import { ButtonLink } from "../../components/ui/button";
import {
  ProductsFrame,
  ResourceState,
  ProductContext,
  TechnicalContent,
  type Detail,
} from "./shared";

export { CataloguePage } from "./catalogue-register";
import { catalogueHref } from "../catalogue-navigation";
import { useCatalogueReturn } from "./catalogue-return";

export function ProductDetailPage() {
  const returns = useCatalogueReturn();
  const { id } = useParams<{ id: string }>(),
    params = useSearchParams(),
    revision = params.get("revision_id"),
    resource = useCrmResource<Detail>(
      `products/${id}${revision ? `?revision_id=${revision}` : ""}`,
      true,
    );
  const catalogueReturn =
    params.get("from_catalogue") === "1" && returns.value?.selected === id
      ? returns.value
      : null;
  const fromCatalogue = catalogueReturn ? "&from_catalogue=1" : "";
  return (
    <ProductsFrame title="Product technical workspace">
      <ButtonLink
        href={
          catalogueReturn ? catalogueHref(catalogueReturn.query) : "/products"
        }
        variant="secondary"
      >
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
                href={`/products/${id}?revision_id=${resource.data.published.id}${fromCatalogue}`}
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
                <Link
                  href={`/products/${id}?revision_id=${r.id}${fromCatalogue}`}
                >
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
