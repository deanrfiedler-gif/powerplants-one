"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Field, SelectField } from "../../components/business-ui";
import { useCrmResource } from "../../components/crm-state";
import { Button, ButtonLink } from "../../components/ui/button";
import {
  RegisterEmpty,
  RegisterTable,
} from "../../components/ui/register-table";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import { usePublishPageDescription } from "../../shell/page-description";
import { catalogueHref, catalogueQuery } from "../catalogue-navigation";
import { useCatalogueReturn } from "./catalogue-return";
import { ResourceState, options, type Catalogue } from "./shared";
import "./catalogue-register.css";

export function CataloguePage() {
  const params = useSearchParams(),
    router = useRouter();
  const query = catalogueQuery(params);
  const resource = useCrmResource<Catalogue>(`products?${query}`, true);
  const [menuOpen, setMenuOpen] = useState(true);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const returns = useCatalogueReturn();
  const previous = returns.value?.query === query ? returns.value : null;
  const selected = previous?.selected;
  const results = useRef<HTMLDivElement>(null);
  const restored = useRef<string | null>(null);
  usePublishPageDescription(
    "/products",
    "Find exact catalogue identities within your company permissions. Search and filters show at most 100 records. Catalogue publication does not establish technical suitability. Stock observations are not configured.",
  );
  useEffect(() => {
    if (
      !previous ||
      !resource.data ||
      resource.error ||
      restored.current === query
    )
      return;
    const link = Array.from(
      results.current?.querySelectorAll<HTMLAnchorElement>(
        `[data-product="${previous.selected}"] a`,
      ) ?? [],
    ).find((node) => node.getClientRects().length);
    if (link) {
      link.focus({ preventScroll: true });
      results.current!.scrollTop = previous.scroll;
    }
    restored.current = query;
  }, [previous, resource.data, resource.error, query]);
  function filter(key: string, value: string) {
    const next = new URLSearchParams(query);
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(catalogueHref(next.toString()), { scroll: false });
  }
  const data = !resource.error ? resource.data : null;
  const count = data
    ? `${data.items.length} shown · maximum ${data.limit}`
    : resource.error
      ? "Catalogue unavailable"
      : "Reading catalogue…";
  const canCreate = data?.access.some((a) =>
    a.capabilities.includes("products.edit"),
  );
  function productLink(p: Catalogue["items"][number]) {
    return (
      <Link
        href={`/products/${p.id}?from_catalogue=1`}
        onClick={() =>
          returns.remember({
            query,
            selected: p.id,
            scroll: results.current?.scrollTop ?? 0,
          })
        }
      >
        <span>{p.content.title}</span>
        <small>
          {p.content.model} · {p.content.variant}
        </small>
      </Link>
    );
  }
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-products"
      name="Products"
      menuId="pd-catalogue-menu"
      contentId="pd-catalogue-content"
      attributes={{ "data-catalogue": "true" }}
      message={data ? count : ""}
      menu={
        <>
          <h2 className="pd-menu-heading">Workspaces</h2>
          <nav aria-label="Products workspaces">
            <ul>
              {[
                ["Catalogue", "/products"],
                ["Publication", "/products/publication"],
                ["Pricing", "/products/pricing"],
                ["Compatibility", "/products/compatibility"],
                ["Import", "/products/import"],
              ].map(([label, href]) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={href === "/products" ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="pd-catalogue-filters">
            <h2 className="pd-menu-heading">Filters</h2>
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
              options={options([
                "Unknown",
                "Supported",
                "Discontinued",
                "Retired",
              ])}
              empty="All lifecycle states"
            />
            <Button
              className="mw-button"
              onClick={() => router.replace("/products", { scroll: false })}
            >
              Clear filters
            </Button>
            {canCreate && (
              <ButtonLink
                className="pd-phone-create mw-button mw-button-primary"
                href="/products/publication?new=1"
                variant="primary"
              >
                New catalogue draft
              </ButtonLink>
            )}
          </div>
        </>
      }
    >
      <div className="pd-catalogue-toolbar">
        <Field
          name="q"
          label="Search exact identity, model or name"
          placeholder="Search products"
          maxLength={100}
          value={params.get("q") ?? ""}
          onChange={(v) => filter("q", v)}
        />
        <Button
          className="pd-desktop-clear mw-button"
          onClick={() => filter("q", "")}
        >
          Clear
        </Button>
        <span className="pd-desktop-count">{count}</span>
        <Button
          className="pd-phone-filters mw-button"
          aria-expanded={menu.open}
          aria-controls="pd-catalogue-menu"
          onClick={(e) => menu.toggle(e.currentTarget)}
        >
          Filters
          {["kind", "state", "lifecycle"].filter((k) => params.get(k)).length
            ? " •"
            : ""}
        </Button>
        {canCreate && (
          <ButtonLink
            className="pd-desktop-create mw-button mw-button-primary"
            href="/products/publication?new=1"
            variant="primary"
          >
            New catalogue draft
          </ButtonLink>
        )}
      </div>
      <p className="pd-phone-count">{count}</p>
      <div className="pd-catalogue-read-state">
        <ResourceState resource={resource} />
      </div>
      <div className="pd-catalogue-results" ref={results}>
        {data && (
          <>
            {!data.items.length ? (
              <RegisterEmpty
                title={
                  query
                    ? "No products match these filters"
                    : "No catalogue records yet"
                }
              >
                <p>
                  {query
                    ? "Clear the filters or search by the exact identity."
                    : "An authorised author can prepare a synthetic catalogue draft."}
                </p>
                {query && (
                  <Button
                    onClick={() =>
                      router.replace("/products", { scroll: false })
                    }
                  >
                    Clear filters
                  </Button>
                )}
              </RegisterEmpty>
            ) : (
              <>
                <div className="pd-catalogue-desktop">
                  <RegisterTable caption="Products catalogue. Open a product to inspect its exact technical evidence.">
                    <thead>
                      <tr>
                        {[
                          "Product / model",
                          "Kind",
                          "Revision",
                          "Publication",
                          "Lifecycle",
                          "Supply evidence",
                        ].map((label) => (
                          <th key={label} scope="col">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((p) => (
                        <tr
                          key={p.id}
                          data-product={p.id}
                          data-selected={selected === p.id || undefined}
                        >
                          <td>{productLink(p)}</td>
                          <td>{p.kind}</td>
                          <td>r{p.revision}</td>
                          <td>{p.state}</td>
                          <td>{p.content.lifecycle}</td>
                          <td>Not configured</td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <ul
                  className="pd-catalogue-phone"
                  aria-label="Products catalogue"
                >
                  {data.items.map((p) => (
                    <li
                      key={p.id}
                      data-product={p.id}
                      data-selected={selected === p.id || undefined}
                    >
                      {productLink(p)}
                      <p>
                        {p.kind} · r{p.revision} · {p.state} ·{" "}
                        {p.content.lifecycle}
                      </p>
                      <p>Supply evidence: Not configured</p>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <p className="pd-catalogue-note">
              Stock availability: Unknown — source observations are Not
              configured. Listed products do not establish technical
              suitability. Synthetic data.
            </p>
          </>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
