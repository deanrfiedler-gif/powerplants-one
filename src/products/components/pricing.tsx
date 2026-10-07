"use client";
import Link from "next/link";
import { useState } from "react";
import { Field, SelectField } from "../../components/business-ui";
import { useCrmResource } from "../../components/crm-state";
import type { listCostSources } from "../../estimating/sources/reads";
import type { productPricing } from "../reads";
import {
  ProductsFrame,
  SelectedProduct,
  ProductContext,
  ResourceState,
  RecoveryAction,
  options,
  type Detail,
} from "./shared";

function PricingDetail({ detail }: { detail: Detail }) {
  const id = detail.product.id,
    pricing = useCrmResource<Awaited<ReturnType<typeof productPricing>>>(
      detail.capabilities.includes("products.commercial.read")
        ? `products/${id}/pricing?revision_id=${detail.revision.id}`
        : null,
      true,
    );
  const sources = useCrmResource<Awaited<ReturnType<typeof listCostSources>>>(
    pricing.data?.can_bind ? "estimating/cost-sources" : null,
    true,
  );
  const [sourceId, setSourceId] = useState(""),
    [revisionId, setRevisionId] = useState(""),
    [mapping, setMapping] = useState("Unresolved"),
    [evidence, setEvidence] = useState(""),
    [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const selected = sources.data?.items.find((s) => s.id === sourceId);
  return (
    <>
      <ProductContext detail={detail} />
      {!detail.capabilities.includes("products.commercial.read") ? (
        <p>
          Commercial evidence unavailable under current permissions. Technical
          catalogue access does not include supplier prices.
        </p>
      ) : (
        <>
          <ResourceState resource={pricing} />
          {pricing.data && !pricing.error && (
            <>
              <Field
                name="pricing-date"
                label="Source validity assessment date"
                type="date"
                value={date}
                onChange={setDate}
              />
              {pricing.data.sources.length === 0 && (
                <section className="pd-panel">
                  <h2>No exact source bindings</h2>
                  <p>
                    Cost is unknown. An authorised source maintainer can record
                    a mapping; catalogue publication does not imply pricing
                    readiness.
                  </p>
                </section>
              )}
              {pricing.data.sources.map((item, i) => {
                if (!item.source || !item.binding)
                  return (
                    <p key={i}>
                      Linked source evidence is unavailable under current source
                      permissions.
                    </p>
                  );
                const s = item.source,
                  c = s.revision.content,
                  b = item.binding;
                const validity = !date
                  ? "Assessment date needed"
                  : date < c.effective_from
                    ? "Not yet effective"
                    : c.valid_until && date > c.valid_until
                      ? "Expired"
                      : c.valid_until
                        ? "Within stated dates"
                        : "Unknown validity end";
                return (
                  <section className="pd-panel" key={b.id}>
                    <h2>{c.title}</h2>
                    <p>
                      {c.supplier_label} · {c.item_reference} · {c.unit}
                    </p>
                    <p>
                      Exact source revision r{s.revision.revision} · Mapping{" "}
                      {b.status} · Source header {s.source.state}
                    </p>
                    <p>{b.evidence}</p>
                    <dl className="pd-facts">
                      <div>
                        <dt>Source date</dt>
                        <dd>{c.source_date}</dd>
                      </div>
                      <div>
                        <dt>Effective / valid through</dt>
                        <dd>
                          {c.effective_from} / {c.valid_until ?? "Unknown"}
                        </dd>
                      </div>
                      <div>
                        <dt>Assessment</dt>
                        <dd>{validity}</dd>
                      </div>
                      <div>
                        <dt>Currency / tax basis</dt>
                        <dd>
                          {c.currency} / {c.tax_basis}
                        </dd>
                      </div>
                    </dl>
                    {c.unit !== detail.revision.content.unit && (
                      <p className="pd-issue">
                        Unit mismatch: no automatic conversion or ready-for-use
                        claim.
                      </p>
                    )}
                    <h3>Exact price tiers</h3>
                    {c.tiers.map((t) => (
                      <p key={t.minimum_quantity}>
                        From {t.minimum_quantity} {c.unit}: {c.currency}{" "}
                        {t.unit_cost} per {c.unit} · {c.tax_basis}
                      </p>
                    ))}
                    <p>
                      {c.evidence_reference} · {c.evidence_excerpt}
                    </p>
                    <Link
                      href={`/estimating/cost-sources/${s.source.id}?revision_id=${s.revision.id}`}
                    >
                      Open exact source authoring / review history
                    </Link>
                    <h3>Permitted affected estimates</h3>
                    {s.affected.length ? (
                      s.affected.map((a) => (
                        <p key={`${a.estimate_version_id}:${a.line_id}`}>
                          <Link
                            href={`/estimating/estimates/${a.estimate_id}/sources`}
                          >
                            {a.display_number}: deliberate source comparison
                          </Link>{" "}
                          · Saved cost version {a.version} ·{" "}
                          {a.is_current
                            ? "Current saved basis"
                            : "Historical basis retained"}
                        </p>
                      ))
                    ) : (
                      <p>
                        No permitted estimate uses in this bounded source view.
                        This is not a universal no-impact finding.
                      </p>
                    )}
                  </section>
                );
              })}
              {pricing.data.can_bind && (
                <section className="pd-panel">
                  <h2>Bind an exact existing CostSource revision</h2>
                  <ResourceState resource={sources} />
                  {sources.data && (
                    <>
                      <SelectField
                        name="source_id"
                        label="Supplier cost source"
                        value={sourceId}
                        onChange={(v) => {
                          setSourceId(v);
                          setRevisionId("");
                        }}
                        options={sources.data.items.map((s) => ({
                          id: s.id,
                          display_name: `${s.title} · ${s.supplier} / ${s.item} / ${s.unit}`,
                        }))}
                      />
                      {selected && (
                        <SelectField
                          name="source_revision_id"
                          label="Exact source revision"
                          value={revisionId}
                          onChange={setRevisionId}
                          options={Array.from(
                            new Map(
                              [
                                {
                                  id: selected.revision_id,
                                  revision: selected.revision,
                                },
                                ...selected.reviewed_revisions,
                              ].map((r) => [r.id, r]),
                            ).values(),
                          ).map((r) => ({
                            id: r.id,
                            display_name: `r${r.revision} · ${r.id}`,
                          }))}
                        />
                      )}
                      <SelectField
                        name="mapping-status"
                        label="Product / source mapping status"
                        value={mapping}
                        onChange={setMapping}
                        options={options(["Mapped", "Unresolved"])}
                      />
                      <Field
                        name="mapping-evidence"
                        label="Identity and unit mapping evidence"
                        value={evidence}
                        onChange={setEvidence}
                      />
                      <RecoveryAction
                        label="Record exact source binding"
                        id={id}
                        path={`products/${id}/pricing`}
                        fields={{
                          expected_version: pricing.data.product.version,
                          revision_id: detail.revision.id,
                          source_id: sourceId,
                          source_revision_id: revisionId,
                          status: mapping,
                          evidence,
                        }}
                        target={`/products/pricing?product_id=${id}&revision_id=${detail.revision.id}`}
                        onSaved={pricing.reload}
                      />
                    </>
                  )}
                  <Link href="/estimating/cost-sources/new">
                    Author a source using ES-03
                  </Link>
                </section>
              )}
            </>
          )}
        </>
      )}
      <aside className="pd-boundary">
        Native ES-03 uses synthetic AUD excluding-tax evidence. Mixed-currency
        totals, FX and unit conversion, landed cost, freight and tax rules are
        Not configured. A source update never reprices a saved estimate or
        issued quotation.
      </aside>
    </>
  );
}
export function PricingPage() {
  return (
    <ProductsFrame title="Price books and supplier sources">
      <SelectedProduct retainRevision>
        {(detail) => <PricingDetail detail={detail} />}
      </SelectedProduct>
    </ProductsFrame>
  );
}
