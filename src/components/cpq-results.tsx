"use client";
import { useState } from "react";
import type {
  Calculation,
  CalculationInput,
  Definition,
  LineDetail,
  Override,
  ConditionEvidence,
} from "../cpq/types";
import { calculate } from "../estimating/math";
import { Button } from "./ui/button";
import { ProductIcon } from "./product-icons";
import {
  CpqDialog,
  CpqField,
  CpqNotice,
  CpqPill,
  money,
  quantity,
} from "./cpq-ui";
export function resultDetails(
  result: Calculation,
  d: Definition,
): LineDetail[] {
  return (
    result.explanation?.lines ??
    result.lines.map((l) => ({
      target: l.target,
      instance_id: l.target.split(":")[0],
      part: l.target.split(":")[1],
      description: l.line.description,
      unit: l.line.unit,
      resolver:
        d.parts.find((p) => p.key === l.target.split(":")[1])?.resolver ??
        "SUM",
      contributions: l.contributions,
      selected_rules: l.contributions.map((c) => c.rule),
      basis_hash: l.basis_hash,
      base_quantity: l.line.quantity,
      effective_quantity: l.line.quantity,
      state: "Ready",
      overrides: l.overrides,
      source: l.line.source,
      effective_from: l.line.effective_date,
      effective_to:
        d.parts.find((p) => p.key === l.target.split(":")[1])?.effective_to ??
        "",
      price_tier: null,
      unit_sell: l.line.unit_sell,
    }))
  );
}
export function CpqMaterials({
  result,
  definition,
  input,
  readOnly,
  onWhy,
  onAdjust,
}: {
  result: Calculation;
  definition: Definition;
  input: CalculationInput;
  readOnly: boolean;
  onWhy: (l: LineDetail) => void;
  onAdjust: (l: LineDetail) => void;
}) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All lines");
  const details = resultDetails(result, definition);
  return (
    <div className="cpq-stack">
      <div className="cpq-toolbar">
        <select
          aria-label="Show lines"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {["All lines", "Adjusted", "Needs review", "Excluded", "Labour"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
        <input
          aria-label="Search lines"
          placeholder="Search lines"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <small>
          {details.length} lines · cost {money(result.totals.cost)} · sell{" "}
          {money(result.totals.sell)}
        </small>
      </div>
      {(
        result.explanation?.instances ??
        input.instances.map((i) => ({ ...i, kind: "System" as const }))
      ).map((instance, index) => {
        const rows = details.filter(
          (l) =>
            l.instance_id === instance.id &&
            l.description.toLowerCase().includes(search.toLowerCase()) &&
            (filter === "All lines" ||
              (filter === "Adjusted" && l.overrides.length) ||
              (filter === "Needs review" && l.state === "NeedsReview") ||
              (filter === "Excluded" && l.state === "Excluded") ||
              (filter === "Labour" &&
                definition.parts.find((p) => p.key === l.part)?.category ===
                  "Labour")),
        );
        const total = calculate(
          result.lines
            .filter((l) => l.target.startsWith(instance.id + ":"))
            .map((l) => l.line),
        );
        return (
          !!rows.length && (
            <details key={instance.id} className="cpq-line-group" open>
              <summary>
                {instance.kind === "System" ? `System ${index + 1} · ` : ""}
                {instance.label}
                <small>
                  {rows.length} lines · Cost {money(total.cost)} · Sell{" "}
                  {money(total.sell)}
                </small>
              </summary>
              <table className="cpq-table cpq-table-responsive">
                <caption className="sr-only">
                  Materials and labour for {instance.label}
                </caption>
                <thead>
                  <tr>
                    <th>Item and purpose</th>
                    <th>Calculated</th>
                    <th>Yours</th>
                    <th>Effective</th>
                    <th>Unit</th>
                    <th>Cost</th>
                    <th>Sell</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((l) => {
                    const line = result.lines.find(
                        (x) => x.target === l.target,
                      ),
                      total = line ? calculate([line.line]) : null;
                    return (
                      <tr key={l.target}>
                        <td>
                          <strong>{l.description}</strong>
                          <small>
                            {l.contributions
                              .map(
                                (c) =>
                                  definition.rules.find((r) => r.key === c.rule)
                                    ?.description ?? c.rule,
                              )
                              .join(" · ")}
                          </small>
                          {l.state !== "Ready" && (
                            <CpqPill
                              tone={
                                l.state === "Excluded" ? "neutral" : "warning"
                              }
                            >
                              {l.state === "NeedsReview"
                                ? "Needs review"
                                : l.state}
                            </CpqPill>
                          )}
                        </td>
                        <td data-label="Calculated" className="cpq-number">
                          {quantity(l.base_quantity)}
                        </td>
                        <td data-label="Yours" className="cpq-number">
                          {l.overrides.find((o) => o.kind === "Quantity")?.value
                            ? quantity(
                                l.overrides.find((o) => o.kind === "Quantity")!
                                  .value,
                              )
                            : "—"}
                        </td>
                        <td data-label="Effective" className="cpq-number">
                          <strong>{quantity(l.effective_quantity)}</strong>
                        </td>
                        <td data-label="Unit">{l.unit}</td>
                        <td data-label="Cost" className="cpq-number">
                          {l.state === "Excluded"
                            ? "Excluded"
                            : money(total?.cost)}
                        </td>
                        <td data-label="Sell" className="cpq-number">
                          {l.state === "Excluded"
                            ? "Excluded"
                            : money(total?.sell)}
                        </td>
                        <td>
                          <button
                            className="cpq-row-action"
                            aria-label={`Why ${l.description}?`}
                            title="Why this line?"
                            onClick={() => onWhy(l)}
                          >
                            <ProductIcon name="info" />
                          </button>
                          {!readOnly && (
                            <button
                              className="cpq-row-action"
                              aria-label={`Adjust ${l.description}`}
                              title="Line actions"
                              onClick={() => onAdjust(l)}
                            >
                              <ProductIcon name="more" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          )
        );
      })}
      {!details.length && (
        <CpqNotice tone="warning">
          No material or labour lines were generated. Review the facts and
          calculation checks.
        </CpqNotice>
      )}
    </div>
  );
}
const opLabel: Record<string, string> = {
  IN: "is one of",
  EQ: "equals",
  NE: "does not equal",
  GT: "is greater than",
  GTE: "is at least",
  LT: "is less than",
  LTE: "is at most",
  KNOWN: "is known",
  NOT_APPLICABLE: "is not applicable",
};
function Trace({
  evidence,
  d,
}: {
  evidence: ConditionEvidence;
  d: Definition;
}) {
  const c = evidence.condition;
  return (
    <div className="cpq-stack-tight">
      <div className="cpq-section-head">
        <span>
          {"fact" in c
            ? `${d.facts.find((f) => f.key === c.fact)?.label ?? c.fact} ${opLabel[c.op]} ${"value" in c ? String(c.value) : "values" in c ? c.values.join(", ") : ""}`
            : c.op === "ALL"
              ? "All of these"
              : c.op === "ANY"
                ? "Any of these"
                : c.op === "ALWAYS"
                  ? "Always"
                  : "Not"}
        </span>
        <CpqPill
          tone={
            evidence.result === null
              ? "warning"
              : evidence.result
                ? "good"
                : "neutral"
          }
        >
          {evidence.result === null
            ? "Unknown"
            : evidence.result
              ? "True"
              : "False"}
        </CpqPill>
      </div>
      {"fact" in c && (
        <small>
          Actual:{" "}
          {evidence.actual === null ? "Unknown" : String(evidence.actual)}
        </small>
      )}
      {evidence.children?.map((x, i) => (
        <Trace key={i} evidence={x} d={d} />
      ))}
    </div>
  );
}
export function CpqWhy({
  line,
  result,
  definition,
  input,
  onClose,
}: {
  line: LineDetail;
  result: Calculation;
  definition: Definition;
  input: CalculationInput;
  onClose: () => void;
}) {
  const relevant = result.diagnostics.filter(
    (d) =>
      d.target === line.target ||
      line.contributions.some((c) => c.rule === d.target),
  );
  return (
    <CpqDialog title="Why this line?" drawer onClose={onClose}>
      <div className="cpq-stack">
        <div>
          <h2>{line.description}</h2>
          <small>
            {
              (result.explanation?.instances ?? input.instances).find(
                (i) => i.id === line.instance_id,
              )?.label
            }
          </small>
        </div>
        <dl className="cpq-dl">
          <dt>Calculated</dt>
          <dd>
            {quantity(line.base_quantity)} {line.unit}
          </dd>
          <dt>Your quantity</dt>
          <dd>
            {quantity(line.overrides.find((o) => o.kind === "Quantity")?.value)}
          </dd>
          <dt>Effective</dt>
          <dd>
            {quantity(line.effective_quantity)} {line.unit}
          </dd>
        </dl>
        <CpqPill tone={line.state === "Ready" ? "good" : "warning"}>
          {line.state === "NeedsReview" ? "Override needs review" : line.state}
        </CpqPill>
        {relevant.map((d, i) => (
          <CpqNotice key={i} tone="warning">
            {d.message}
          </CpqNotice>
        ))}
        <section>
          <h3>Resolution · {line.resolver}</h3>
          <p>
            {line.selected_rules.length
              ? `Selected: ${line.selected_rules.map((k) => definition.rules.find((r) => r.key === k)?.description ?? k).join(", ")}`
              : "No unambiguous contribution selected."}
          </p>
        </section>
        {line.contributions.map((c) => (
          <section className="cpq-stack-tight" key={c.rule}>
            <div className="cpq-section-head">
              <h3>
                {definition.rules.find((r) => r.key === c.rule)?.description ??
                  c.rule}
              </h3>
              <CpqPill>
                {line.selected_rules.includes(c.rule)
                  ? "Selected"
                  : "Not selected"}
              </CpqPill>
            </div>
            <code className="cpq-formula">{c.formula}</code>
            <dl className="cpq-dl">
              {Object.entries(c.facts).map(([key, value]) => (
                <div key={key}>
                  <dt>
                    {definition.facts.find((f) => f.key === key)?.label ?? key}
                  </dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <small>
              Result {c.quantity} · priority {c.priority} · exact{" "}
              {c.exact.numerator}/{c.exact.denominator}
            </small>
            {result.explanation?.rules
              .filter(
                (r) => r.rule === c.rule && r.instance_id === line.instance_id,
              )
              .map((r) => (
                <Trace key={r.rule} evidence={r.condition} d={definition} />
              ))}
          </section>
        ))}
        <section className="cpq-stack-tight">
          <h3>Price source and validity</h3>
          {definition.parts.find((p) => p.key === line.part)?.price_context &&
            (() => {
              const p = definition.parts.find(
                (p) => p.key === line.part,
              )!.price_context!;
              return (
                <dl className="cpq-dl">
                  <dt>Price book</dt>
                  <dd>{p.book}</dd>
                  <dt>Source unit cost</dt>
                  <dd>
                    {line.price_tier?.source_unit_cost} {p.source_currency}
                  </dd>
                  <dt>Conversion</dt>
                  <dd>
                    1 AUD = {p.currency_per_aud} {p.source_currency}
                  </dd>
                  <dt>Rate recorded</dt>
                  <dd>{p.recorded_at}</dd>
                  <dt>Policy</dt>
                  <dd>{p.policy}</dd>
                </dl>
              );
            })()}
          <p>{line.source}</p>
          <small>
            {line.effective_from} to {line.effective_to}
          </small>
          <dl className="cpq-dl">
            <dt>Unit cost</dt>
            <dd>{money(line.price_tier?.unit_cost)}</dd>
            <dt>Unit sell</dt>
            <dd>{money(line.unit_sell)}</dd>
            <dt>Price break from</dt>
            <dd>{quantity(line.price_tier?.minimum)}</dd>
          </dl>
        </section>
        {!!line.overrides.length && (
          <section>
            <h3>Retained adjustments</h3>
            {line.overrides.map((o) => (
              <p key={o.kind}>
                <strong>
                  {o.kind}: {o.value ?? "Excluded"}
                </strong>
                <br />
                {o.reason}
                <br />
                <small>
                  {o.basis_hash === line.basis_hash
                    ? "Based on this generated line"
                    : "Generated basis changed — review required"}
                </small>
              </p>
            ))}
          </section>
        )}
      </div>
    </CpqDialog>
  );
}
export function CpqAdjustment({
  line,
  onClose,
  onApply,
}: {
  line: LineDetail;
  onClose: () => void;
  onApply: (
    kind: Override["kind"],
    override: Override | null,
    reason: string,
  ) => void;
}) {
  const [kind, setKind] = useState<Override["kind"]>("Quantity"),
    [value, setValue] = useState(
      line.overrides.find((o) => o.kind === "Quantity")?.value ??
        line.effective_quantity ??
        "",
    ),
    [reason, setReason] = useState(""),
    [decision, setDecision] = useState<"Keep" | "Restore" | "New">("New");
  const current = line.overrides.find((o) => o.kind === kind),
    stale = current && current.basis_hash !== line.basis_hash;
  const resolved = decision === "Keep" ? (current?.value ?? value) : value;
  const valid =
    reason.trim().length > 0 &&
    (decision === "Restore" ||
      kind === "Suppress" ||
      /^\d+(\.\d{1,3})?$/.test(resolved ?? ""));
  return (
    <CpqDialog
      title={line.state === "NeedsReview" ? "Review adjustment" : "Adjust line"}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!valid}
            onClick={() =>
              onApply(
                kind,
                decision === "Restore"
                  ? null
                  : {
                      target: line.target,
                      basis_hash: line.basis_hash,
                      kind,
                      value: kind === "Suppress" ? null : resolved,
                      reason: reason.trim(),
                    },
                reason.trim(),
              )
            }
          >
            {decision === "Restore"
              ? "Restore calculated value"
              : "Apply adjustment"}
          </Button>
        </>
      }
    >
      <div className="cpq-stack">
        <div>
          <h2>{line.description}</h2>
          <small>
            Calculated {quantity(line.base_quantity)} {line.unit} · effective{" "}
            {quantity(line.effective_quantity)} {line.unit}
          </small>
        </div>
        <CpqField label="Adjustment">
          <select
            value={kind}
            onChange={(e) => {
              const k = e.target.value as Override["kind"];
              setKind(k);
              setDecision("New");
              setValue(
                line.overrides.find((o) => o.kind === k)?.value ??
                  (k === "SellPrice"
                    ? line.unit_sell
                    : line.effective_quantity) ??
                  "",
              );
            }}
          >
            <option value="Quantity">Quantity</option>
            <option value="SellPrice">Unit sell price</option>
            <option value="Suppress">Exclude line</option>
          </select>
        </CpqField>
        {stale && (
          <CpqNotice tone="warning">
            The calculated basis has changed. Your saved adjustment is retained.
            Choose how to continue.
          </CpqNotice>
        )}
        {current && (
          <CpqField label="Decision">
            <select
              value={decision}
              onChange={(e) => setDecision(e.target.value as typeof decision)}
            >
              <option value="New">Enter a new value</option>
              <option value="Keep">Keep my adjustment on this basis</option>
              <option value="Restore">Use the calculated value</option>
            </select>
          </CpqField>
        )}
        {kind !== "Suppress" && decision === "New" && (
          <CpqField
            label={kind === "Quantity" ? "Your quantity" : "Unit sell (AUD)"}
            help={
              kind === "Quantity"
                ? line.unit
                : "Subject to the release pricing policy"
            }
          >
            <input
              inputMode="decimal"
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </CpqField>
        )}
        <CpqField
          label="Reason"
          help="Retained with this configuration and its saved evaluation."
        >
          <textarea
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this adjustment is needed"
          />
        </CpqField>
        <CpqNotice>
          Save the configuration to retain this decision. A changed quantity
          also recalculates dependent labour and pricing.
        </CpqNotice>
      </div>
    </CpqDialog>
  );
}
export function CpqPricing({
  result,
  input,
  d,
  onPricing,
  readOnly,
}: {
  result: Calculation;
  input: CalculationInput;
  d: Definition;
  onPricing: (pricing: CalculationInput["pricing"]) => void;
  readOnly: boolean;
}) {
  const categories = [
    "Product",
    "Labour",
    "Freight",
    "Engineering",
    "Subcontract",
  ];
  return (
    <div className="cpq-stack">
      <div className="cpq-section-head">
        <div>
          <h2>Price build-up</h2>
          <small>AUD · effective quantities · excluding GST</small>
        </div>
        <CpqPill tone={result.ready ? "good" : "warning"}>
          {result.explanation?.readiness.price === "RequiresApproval"
            ? "Requires approval"
            : result.ready
              ? "Complete"
              : "Indicative"}
        </CpqPill>
      </div>
      <div className="cpq-split">
        <section>
          {categories.map((cat) => {
            const lines = result.lines.filter((l) => l.line.category === cat);
            return (
              !!lines.length && (
                <div className="cpq-price-row" key={cat}>
                  <span>
                    {cat === "Product" ? "Materials" : cat}
                    <small>{lines.length} lines</small>
                  </span>
                  <strong>
                    {money(calculate(lines.map((l) => l.line)).cost)}
                  </strong>
                </div>
              )
            );
          })}
          <div className="cpq-price-row">
            <span>Included cost</span>
            <strong>{money(result.totals.cost)}</strong>
          </div>
          <div className="cpq-price-row">
            <span>
              Commercial addition
              <small>
                {result.explanation?.pricing.mode ?? "Catalog"} pricing
              </small>
            </span>
            <strong>{money(result.totals.difference)}</strong>
          </div>
          <div className="cpq-price-row">
            <span>
              Proposed sell<small>Excluding GST</small>
            </span>
            <strong>AUD {money(result.totals.sell)}</strong>
          </div>
        </section>
        <section className="cpq-card cpq-stack">
          <h3>Margin and markup</h3>
          <dl className="cpq-dl">
            <dt>Gross margin</dt>
            <dd>{result.totals.margin_percent ?? "Unknown"}%</dd>
            <dt>Markup on cost</dt>
            <dd>{result.totals.markup_percent ?? "Unknown"}%</dd>
          </dl>
          <small>
            Margin = (sell − cost) ÷ sell. Markup = (sell − cost) ÷ cost.
          </small>
          {d.design?.pricing.allow_override && !readOnly && (
            <>
              <CpqField label="Pricing basis">
                <select
                  value={input.pricing?.mode ?? "Release"}
                  onChange={(e) =>
                    onPricing(
                      e.target.value === "Release"
                        ? null
                        : {
                            mode: e.target.value as "Margin" | "Markup",
                            percent: "0",
                          },
                    )
                  }
                >
                  <option value="Release">Use release policy</option>
                  <option>Margin</option>
                  <option>Markup</option>
                </select>
              </CpqField>
              {input.pricing && (
                <CpqField label={input.pricing.mode + " (%)"}>
                  <input
                    inputMode="decimal"
                    value={input.pricing.percent}
                    onChange={(e) =>
                      onPricing({ ...input.pricing!, percent: e.target.value })
                    }
                  />
                </CpqField>
              )}
            </>
          )}
        </section>
      </div>
      <section>
        <h3>By system</h3>
        <table className="cpq-table cpq-table-responsive">
          <thead>
            <tr>
              <th>System</th>
              <th>Cost</th>
              <th>Sell</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {(result.explanation?.instances ?? input.instances).map((i) => {
              const t = calculate(
                result.lines
                  .filter((l) => l.target.startsWith(i.id + ":"))
                  .map((l) => l.line),
              );
              return (
                <tr key={i.id}>
                  <td>{i.label}</td>
                  <td data-label="Cost">{money(t.cost)}</td>
                  <td data-label="Sell">{money(t.sell)}</td>
                  <td data-label="Margin">{t.margin_percent ?? "Unknown"}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      <CpqMilestones proposals={result.explanation?.milestones ?? []} />
      <CpqNotice>
        A proposed price is not an approved quotation or accepted contract
        value. Tax and quotation approval remain with quotation review (ES-05).
      </CpqNotice>
    </div>
  );
}
export function CpqMilestones({
  proposals,
}: {
  proposals: NonNullable<Calculation["explanation"]>["milestones"];
}) {
  if (!proposals.length) return null;
  return (
    <section className="cpq-stack-tight">
      <h3>Milestone proposals</h3>
      {proposals.map((m) => (
        <div className="cpq-card" key={m.instance_id + ":" + m.key}>
          <strong>{m.label}</strong>
          <p>
            {m.anchor} {m.offset_days >= 0 ? "+" : ""}
            {m.offset_days}{" "}
            {m.calendar === "BusinessDays" ? "business" : "calendar"} days
          </p>
          <CpqPill tone={m.state === "Unknown" ? "warning" : "neutral"}>
            {m.state} · date unresolved
          </CpqPill>
        </div>
      ))}
      <small>
        Retained with the evaluation and estimate handover. Project scheduling
        resolves dates; no scheduled event or billing allocation is created.
      </small>
    </section>
  );
}
