"use client";
import Link from "next/link";
import { useState } from "react";
import { emptyPrice } from "../estimating/specialist/definition";
import type { NativePriceProposal, Position } from "../estimating/specialist/types";
import { pricedLines } from "../estimating/specialist/workbench";
import type { Bench } from "./specialist-types";
import { Pill, Segmented, fmt, money } from "./specialist-ui";

// Pricing (design board artboard 04): the illustrative SYN-PRICE-02 lines with
// their extensions, the price bridge that reproduces the recovered rounding
// policy (DEC-R1) and the separate native AUD receiving proposal. A blank rate
// makes the total unavailable; zero is never assumed (board state 13).
const rules = [
  "Cost in EUR or AUD; sell is always AUD",
  "EUR cost ÷ quoted EUR per AUD",
  "Blank rate is unavailable; zero needs a reason",
  "No-purchase lines stay priced",
  "GST not calculated in this review",
];
export function PricingView({ bench }: { bench: Bench }) {
  const { calculation: c, proposal: p, change, frozen } = bench,
    lines = pricedLines(c, p),
    [editing, setEditing] = useState<string | null>(null),
    commercial = c?.commercial ?? null,
    missing = commercial?.missing ?? [],
    shownSum = lines.reduce((sum, l) => sum + (l.extended ? Number(l.extended) : 0), 0),
    fx = p.inputs.fx.raw,
    discount = p.inputs.discount.raw,
    freight = p.inputs.freight.raw === "Yes";
  const edit = (l: Position, key: string, value: string | boolean) =>
    change((next) => {
      const current = next.illustrative_prices.find((x) => x.key === l.key),
        price = { ...(current?.price ?? emptyPrice()), [key]: value, reason: bench.reason };
      if (current) current.price = price;
      else next.illustrative_prices.push({ key: l.key, price });
    });
  return (
    <div className="es08-view">
      <div className="es08-view-head">
        <div>
          <h2>Commercial review</h2>
          <p>Illustrative SYN-PRICE-02 rates demonstrate the recovered rounding policy. They are not a supplier offer or the historical quote.</p>
        </div>
        <Link className="ppo-button" href={`/estimating/configurations/${bench.id}/configure?section=commercial`}>
          Edit commercial inputs
        </Link>
      </div>
      <ul aria-label="Pricing rules" className="es08-rules">
        {rules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <div className="es08-pricegrid">
        <section className="es08-card es08-table-card" aria-labelledby="es08-lines-h">
          <div className="es08-card-head">
            <h3 id="es08-lines-h">Active lines</h3>
            <span className="es08-sub">
              {lines.length} active · rates from SYN-PRICE-02{missing.length ? ` · ${missing.length} without a rate` : ""}
            </span>
          </div>
          {!c && <p className="es08-empty">Waiting for the first calculation.</p>}
          {c && (
            <div className="es08-table-scroll" tabIndex={0} aria-label="Priced lines">
              <table className="es08-table es08-table--pricing">
                <thead>
                  <tr>
                    <th scope="col">Line</th>
                    <th scope="col" className="es08-num">Qty</th>
                    <th scope="col" className="es08-num">Unit cost</th>
                    <th scope="col" className="es08-num">Cost AUD</th>
                    <th scope="col" className="es08-num">Sell AUD</th>
                    <th scope="col" className="es08-num">Margin</th>
                    <th scope="col" className="es08-num">Extended AUD</th>
                    <th scope="col">
                      <span className="es08-sr">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const pos = l.position,
                      price = pos.price,
                      open = editing === pos.key;
                    return (
                      <RowGroup key={pos.key}>
                        <tr data-selected={open || undefined}>
                          <td>
                            <div className="es08-strong es08-line-title">
                              {pos.description}
                              {pos.manual && <span className="es08-tag">MANUAL QTY</span>}
                              {price.no_purchase && <span className="es08-tag">NO PURCHASE</span>}
                            </div>
                            <div className="es08-mono es08-sub">{pos.key}</div>
                          </td>
                          <td className="es08-num">
                            {l.quantity === "Unresolved" ? <span className="es08-tone-danger">Unresolved</span> : `${fmt(Number(l.quantity), l.quantity.includes(".") ? 2 : 0)} ${pos.unit}`}
                          </td>
                          <td className="es08-num">
                            {l.rateMissing ? (
                              <span className="es08-tone-danger es08-strong">Rate unavailable</span>
                            ) : (
                              <>
                                {fmt(Number(price.cost), 2)} <span className={`es08-tag ${price.currency === "EUR" ? "es08-tag--info" : ""}`}>{price.currency}</span>
                              </>
                            )}
                          </td>
                          <td className="es08-num">{l.costAud ? fmt(Number(l.costAud), 2) : "—"}</td>
                          <td className="es08-num">{l.rateMissing ? "—" : fmt(Number(price.sell), 2)}</td>
                          <td className="es08-num">{l.margin ? `${fmt(Number(l.margin), 1)}%` : "—"}</td>
                          <td className="es08-num es08-strong">{l.extended ? fmt(Number(l.extended), 2) : "—"}</td>
                          <td className="es08-actions-cell">
                            <button type="button" className="es08-link" aria-expanded={open} aria-label={`Edit rate for ${pos.description}`} onClick={() => setEditing(open ? null : pos.key)}>
                              {open ? "Done" : "Edit"}
                            </button>
                          </td>
                        </tr>
                        {open && (
                          <tr className="es08-edit-row">
                            <td colSpan={8}>
                              <div className="es08-edit-grid">
                                <label>
                                  Unit cost
                                  <input inputMode="decimal" disabled={frozen} value={price.cost} aria-label={`${pos.key} illustrative cost`} onChange={(e) => edit(pos, "cost", e.target.value)} />
                                </label>
                                <div className="es08-field">
                                  <span id={`es08-cur-${pos.key}`} className="es08-field-label">
                                    Cost currency
                                  </span>
                                  <Segmented
                                    labelledBy={`es08-cur-${pos.key}`}
                                    size="sm"
                                    disabled={frozen}
                                    options={[
                                      { value: "AUD", label: "AUD" },
                                      { value: "EUR", label: "EUR" },
                                    ]}
                                    value={price.currency}
                                    onChange={(x) => edit(pos, "currency", x)}
                                  />
                                </div>
                                <label>
                                  Unit sell AUD
                                  <input inputMode="decimal" disabled={frozen} value={price.sell} aria-label={`${pos.key} illustrative sell`} onChange={(e) => edit(pos, "sell", e.target.value)} />
                                </label>
                                <label>
                                  Source date
                                  <input type="date" disabled={frozen} value={price.effective_date ?? ""} aria-label={`${pos.key} illustrative date`} onChange={(e) => edit(pos, "effective_date", e.target.value || "")} />
                                </label>
                                <label className="es08-check">
                                  <input type="checkbox" disabled={frozen} checked={price.no_purchase} aria-label={`${pos.key} no purchase`} onChange={(e) => edit(pos, "no_purchase", e.target.checked)} />
                                  <span>No purchase · stays priced</span>
                                </label>
                              </div>
                              <p className="es08-sub">A blank cost or sell leaves this line without a rate and the total unavailable. Zero needs its reason recorded with the next save.</p>
                            </td>
                          </tr>
                        )}
                      </RowGroup>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row" colSpan={6}>
                      {lines.length} lines shown{missing.length ? ` · ${missing.length} without a rate` : ""}
                    </th>
                    <td className="es08-num">{commercial?.complete ? fmt(shownSum, 2) : `${fmt(shownSum, 2)} partial`}</td>
                    <td />
                  </tr>
                  <tr className="es08-total-row">
                    <th scope="row" colSpan={6}>
                      Materials, unrounded
                    </th>
                    <td className="es08-num es08-total">{commercial?.materials ? fmt(Number(commercial.materials.display), 2) : "Unavailable"}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
        <div className="es08-stack">
          <section className="es08-card" aria-labelledby="es08-bridge-h">
            <div className="es08-card-head">
              <h3 id="es08-bridge-h">Price bridge</h3>
              <Pill tone="neutral">Illustrative</Pill>
            </div>
            <dl className="es08-rows es08-rows--money">
              <div>
                <dt>Unrounded materials</dt>
                <dd>{money(commercial?.materials?.display ?? null)}</dd>
              </div>
              <div>
                <dt>
                  <span>Materials discount {discount}%</span>
                  <span className="es08-sub">{commercial?.discount ? `${fmt((Number(commercial.materials?.display ?? 0) * Number(discount)) / 100, 2)} floored to whole dollars` : "Floored to whole dollars"}</span>
                </dt>
                <dd>{commercial?.discount ? money(`-${commercial.discount.display}`) : "Unavailable"}</dd>
              </div>
              <div>
                <dt>
                  <span>Enabled freight</span>
                  <span className="es08-sub">{freight ? "Sea and local freight at the entered amounts" : "Transport not included · REV-03"}</span>
                </dt>
                <dd>{money(commercial?.freight?.display ?? null)}</dd>
              </div>
              <div>
                <dt>Before final rounding</dt>
                <dd>{money(commercial?.before?.display ?? null)}</dd>
              </div>
              <div>
                <dt>
                  <span>Upward $10 adjustment</span>
                  <span className="es08-sub">Final positive total rounds up</span>
                </dt>
                <dd>{commercial?.rounding_adjustment ? money(commercial.rounding_adjustment.display, true) : "Unavailable"}</dd>
              </div>
            </dl>
            <div className="es08-bridge-total">
              <div>
                <span className="es08-strong">Review total</span>
                <span className="es08-sub">AUD · GST not calculated</span>
              </div>
              {commercial?.complete && commercial.total ? (
                <span className="es08-huge">{money(commercial.total.display)}</span>
              ) : (
                <span className="es08-huge es08-tone-danger">Unavailable</span>
              )}
            </div>
            {!commercial?.complete && c && (
              <p className="es08-sub es08-card-note es08-card-note--danger" role="status">
                {missing.length ? `${missing.length} line${missing.length === 1 ? "" : "s"} without a rate or quantity: ${missing.slice(0, 4).join(", ")}${missing.length > 4 ? "…" : ""}. Enter a rate, or a zero rate with its reason.` : "The calculation is withheld, so no total exists."}
              </p>
            )}
          </section>
          <section className="es08-card" aria-labelledby="es08-policy-h">
            <div className="es08-card-head es08-card-head--stack">
              <h3 id="es08-policy-h">Rounding is part of the definition</h3>
              <p className="es08-sub">The source totals unrounded extensions, floors the materials discount to whole dollars and rounds the final positive total up to $10. The receiving estimate shows any difference from its own E1 rounding as a reconciliation line.</p>
            </div>
            <dl className="es08-rows es08-rows--tight">
              <div>
                <dt>Displayed-line sum</dt>
                <dd>{money(String(shownSum))}</dd>
              </div>
              <div>
                <dt>Quoted FX</dt>
                <dd>{fx} EUR per AUD</dd>
              </div>
              <div>
                <dt>Policy in this bridge</dt>
                <dd>Recovered historical</dd>
              </div>
              <div>
                <dt>E1 money contract</dt>
                <dd className="es08-tone-ok">Applies after handover · DEC-R1</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
      <NativePrices bench={bench} />
    </div>
  );
}
function RowGroup({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
// SYN-EST-ARITHMETIC-01: the native AUD receiving proposal for saved positions,
// independent of the illustrative bridge. Exact three-decimal quantities,
// two-decimal AUD rates and per-line half-up extensions.
export function NativePrices({ bench }: { bench: Bench }) {
  const { data, nativePrices: values, setNativePrices: set, frozen } = bench,
    rows =
      data.current_resolved?.snapshot.lines.filter((l) => l.row < 383 && !l.excluded && l.effective_quantity?.numerator !== "0") ?? [];
  return (
    <section className="es08-card" aria-labelledby="es08-native-h">
      <div className="es08-card-head es08-card-head--stack">
        <span className="es08-eyebrow">SYN-EST-ARITHMETIC-01</span>
        <h3 id="es08-native-h">Native AUD receiving proposal</h3>
        <p className="es08-sub">
          Exact three-decimal quantities, two-decimal AUD rates and per-line half-up extensions. Enter a source date and reason for every active saved contribution. Procurement packaging is not inferred.
        </p>
      </div>
      <details className="es08-details">
        <summary>Review native AUD rates for {rows.length} saved positions</summary>
        <div className="es08-details-body">
          <button
            type="button"
            className="ppo-button"
            disabled={frozen || rows.length === 0}
            onClick={() =>
              set(
                rows.map((l) => ({
                  key: l.key,
                  unit_cost: "1.00",
                  unit_sell: "2.00",
                  effective_date: "2026-09-21",
                  reason: "Explicit authored synthetic AUD rate per calculation unit; no supplier quote",
                })),
              )
            }
          >
            Use authored synthetic 1.00 / 2.00 rate proposal
          </button>
          <p className="es08-sub">This records an explicit synthetic proposal. Eligibility still depends on the server-owned fixture policy.</p>
          {rows.length === 0 ? (
            <p className="es08-empty">No saved run yet. Save a run first; its resolved lines become the positions a receiving proposal can price.</p>
          ) : (
            <div className="es08-table-scroll" tabIndex={0}>
              <table className="es08-table">
                <thead>
                  <tr>
                    <th scope="col">Position / quantity</th>
                    <th scope="col">Unit cost AUD</th>
                    <th scope="col">Unit sell AUD</th>
                    <th scope="col">Source date</th>
                    <th scope="col">Provenance / reason</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => {
                    const current: NativePriceProposal = values.find((x) => x.key === l.key) ?? { key: l.key, unit_cost: "", unit_sell: "", effective_date: "", reason: "" };
                    return (
                      <tr key={l.key}>
                        <td>
                          <div className="es08-mono es08-strong">{l.key}</div>
                          <div className="es08-sub">
                            {l.effective_quantity?.display ?? "Unresolved"} {l.unit}
                          </div>
                        </td>
                        {(["unit_cost", "unit_sell", "effective_date", "reason"] as const).map((k) => (
                          <td key={k}>
                            <input
                              className="es08-cell-input"
                              aria-label={`${l.key} native ${k}`}
                              type={k === "effective_date" ? "date" : "text"}
                              disabled={frozen}
                              value={current[k]}
                              onChange={(e) => set([...values.filter((x) => x.key !== l.key), { ...current, [k]: e.target.value }])}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}
