"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ErrorNotice, Field, SelectField } from "./business-ui";
import { useCrmResource, denied } from "./crm-state";
import { useUnsavedChanges } from "./record-ui";
import { Button } from "./ui/button";
import { TableScroll, Row } from "./estimation-wizard-ui";
import {
  useExcelCommand,
  CommandOutcome,
  ExcelFooterActions,
} from "./excel-import-command";
import { EvidenceValues, EvidenceDetails } from "./excel-import-review";
import {
  money,
  type Estimate,
  type PricingReview,
  type QuoteReview,
  type ReviewSummary,
} from "./excel-import-types";
import type { listCostSources } from "../estimating/sources/reads";
import type { refreshProposal } from "../estimating/sources/validation";
import type { LandedProposal } from "../estimating/sources/landed";
import type { Receipt } from "../shared/ui/use-recoverable-command";

type Sources = Awaited<ReturnType<typeof listCostSources>>;
type Proposal = ReturnType<typeof refreshProposal>;
export function ExcelPricing({
  estimate: e,
  onSaved,
  onReview,
  onStage,
}: {
  estimate: Estimate;
  onReview: (value: ReviewSummary | null) => void;
  onStage: (value: number) => void;
  onSaved: (r: Receipt) => Promise<void>;
}) {
  const [stage, setStage] = useState(0);
  const go = (value: number) => {
    setStage(value);
    onStage(value);
  };
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState("");
  const sources = useCrmResource<Sources>(
    `estimating/cost-sources?${new URLSearchParams({ q: query })}`,
    true,
  );
  const [selections, setSelections] = useState<
    Record<
      string,
      {
        source_id: string;
        revision_id: string;
        expected_source_version: number;
        label: string;
      }
    >
  >({});
  const [date, setDate] = useState(""),
    [charges, setCharges] = useState<LandedProposal["charges"]>([]),
    [exclusive, setExclusive] = useState(false),
    [review, setReview] = useState<PricingReview | null>(null),
    [reason, setReason] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [dirty, setDirty] = useState(false);
  const command = useExcelCommand(`pricing:${e.id}:${e.saved.id}`),
    serial = useRef(0);
  const frozen =
    busy ||
    command.busy ||
    !!command.pending ||
    !!command.accepted ||
    !command.ready;
  const editable = e.can_edit && e.saved.id === e.current_version_id;
  useUnsavedChanges(
    dirty && !command.accepted,
    command.busy || !!command.pending,
  );
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  const changed = () => {
    onReview(null);
    command.clear();
    setReview(null);
    setConfirmed(false);
    setDirty(true);
    setError(null);
  };
  const proposal = (): Proposal => ({
    estimate_version_id: e.saved.id,
    pricing_date: date,
    selections: Object.entries(selections).map(([line_id, s]) => ({
      line_id,
      source_id: s.source_id,
      revision_id: s.revision_id,
      expected_source_version: s.expected_source_version,
    })),
    ...(charges.length
      ? {
          landed_costs: {
            policy: "SYN-EST-LANDED-01",
            currency: "AUD",
            exclusive_cost_basis_confirmed: true,
            charges,
          },
        }
      : {}),
  });
  async function preview() {
    if (frozen || !editable) return;
    const token = ++serial.current;
    setBusy(true);
    command.clear();
    setError(null);
    setReview(null);
    setConfirmed(false);
    try {
      const r = await api<PricingReview>(
        `estimating/estimates/${e.id}/excel-source-pricing/preview`,
        proposal(),
      );
      if (token === serial.current) {
        setReview(r);
        go(2);
        onReview({
          label: "Proposed priced estimate",
          values: [
            ["Cost before", r.comparison.before.cost],
            ["Cost after", r.comparison.after.cost],
            ["Sell · unchanged", r.comparison.after.sell],
          ],
        });
      }
    } catch (err) {
      if (token === serial.current) setError(err);
    } finally {
      if (token === serial.current) setBusy(false);
    }
  }
  async function saved(r: Receipt) {
    try {
      await onSaved(r);
    } catch (err) {
      setError(err);
    }
  }
  const sourceOptions = (sources.data?.items ?? [])
    .filter((s) => s.company_id === e.company_id)
    .flatMap((s) =>
      s.reviewed_revisions.map((r) => ({
        id: `${s.id}:${r.id}`,
        display_name: `${s.reference} · reviewed r${r.revision} · ${s.item} / ${s.unit}`,
      })),
    );
  const setCharge = (
    index: number,
    patch: Partial<LandedProposal["charges"][number]>,
  ) => {
    setCharges(charges.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    changed();
  };
  if (denied(error) || denied(sources.error) || denied(command.error))
    return (
      <>
        <ErrorNotice error={error ?? sources.error} />
        <CommandOutcome command={command} onSaved={(r) => void saved(r)} />
      </>
    );
  return (
    <>
      <h2>Price from reviewed sources</h2>
      <p>
        Original workbook values stay unchanged. This comparison updates costs
        only; sell prices stay the same.
      </p>
      {!editable && (
        <p role="alert">
          Pricing requires the current saved estimate and current edit
          authority.
        </p>
      )}
      <ErrorNotice error={error} />
      <ErrorNotice error={sources.error} />
      <CommandOutcome command={command} onSaved={(r) => void saved(r)} />
      <fieldset className="xi-workflow" disabled={frozen || !editable}>
        <section className="es02-card" hidden={stage !== 0}>
          <h3>1. Select lines and reviewed source revisions</h3>
          <p>
            Up to {sources.data?.limit ?? 100} permitted matching sources.
            Search to narrow the available records; selected revisions retain
            their expected source versions.
          </p>
          <div className="xi-actions">
            <Field
              label="Search reviewed sources"
              name="source_search"
              value={search}
              onChange={setSearch}
            />
            <Button onClick={() => setQuery(search)}>Search sources</Button>
          </div>
          {sources.loading && <p role="status">Loading permitted sources…</p>}
          <Field
            label="Pricing date"
            name="pricing_date"
            type="date"
            value={date}
            onChange={(v) => {
              setDate(v);
              changed();
            }}
            required
          />
          {e.saved.lines.map((l) => (
            <div className="xi-confirmation" key={l.id}>
              <strong>
                {l.description} · {l.quantity} {l.unit}
              </strong>
              <p>
                Current cost {money(l.unit_cost)} · sell {money(l.unit_sell)}
              </p>
              <SelectField
                label={`Reviewed source for ${l.description}`}
                name={`source-${l.id}`}
                value={
                  selections[l.id]
                    ? `${selections[l.id].source_id}:${selections[l.id].revision_id}`
                    : ""
                }
                options={[
                  ...(selections[l.id] &&
                  !sourceOptions.some(
                    (o) =>
                      o.id ===
                      `${selections[l.id].source_id}:${selections[l.id].revision_id}`,
                  )
                    ? [
                        {
                          id: `${selections[l.id].source_id}:${selections[l.id].revision_id}`,
                          display_name: selections[l.id].label,
                        },
                      ]
                    : []),
                  ...sourceOptions,
                ]}
                onChange={(v) => {
                  const next = { ...selections };
                  if (!v) delete next[l.id];
                  else {
                    const [source_id, revision_id] = v.split(":");
                    const source = sources.data?.items.find(
                      (s) => s.id === source_id,
                    );
                    if (!source) return;
                    next[l.id] = {
                      source_id,
                      revision_id,
                      expected_source_version: source.version,
                      label: sourceOptions.find((o) => o.id === v)!
                        .display_name,
                    };
                  }
                  setSelections(next);
                  changed();
                }}
              />
            </div>
          ))}
        </section>
        <section className="es02-card" hidden={stage !== 1}>
          <h3>2. Freight and duty charges</h3>
          <p>
            Optional authored AUD charges. Select exact Product lines. All
            currently landed lines must be selected together; a new comparison
            replaces their old allocation.
          </p>
          {charges.map((c, i) => (
            <fieldset key={c.id} className="xi-charge">
              <legend>Charge {i + 1}</legend>
              <SelectField
                label={`Kind ${i + 1}`}
                name={`kind-${i}`}
                value={c.kind}
                options={["Freight", "Duty"].map((id) => ({
                  id,
                  display_name: id,
                }))}
                onChange={(v) =>
                  setCharge(i, { kind: v as "Freight" | "Duty" })
                }
              />
              <SelectField
                label={`Basis ${i + 1}`}
                name={`basis-${i}`}
                value={c.basis}
                options={["Unit", "Line", "Shipment"].map((id) => ({
                  id,
                  display_name: id,
                }))}
                onChange={(v) =>
                  setCharge(i, {
                    basis: v as "Unit" | "Line" | "Shipment",
                    allocation: v === "Shipment" ? "Equal" : null,
                  })
                }
              />
              {c.basis === "Shipment" && (
                <SelectField
                  label={`Allocation ${i + 1}`}
                  name={`allocation-${i}`}
                  value={c.allocation ?? "Equal"}
                  options={["Equal", "Quantity", "BaseCost"].map((id) => ({
                    id,
                    display_name: id,
                  }))}
                  onChange={(v) =>
                    setCharge(i, {
                      allocation: v as "Equal" | "Quantity" | "BaseCost",
                    })
                  }
                />
              )}
              <Field
                label={`Amount AUD ${i + 1}`}
                name={`amount-${i}`}
                value={c.amount}
                onChange={(v) => setCharge(i, { amount: v })}
              />
              <Field
                label={`Effective date ${i + 1}`}
                name={`charge_date-${i}`}
                type="date"
                value={c.effective_date}
                onChange={(v) => setCharge(i, { effective_date: v })}
              />
              <Field
                label={`Evidence reference ${i + 1}`}
                name={`evidence_reference-${i}`}
                value={c.evidence_reference}
                maxLength={200}
                onChange={(v) => setCharge(i, { evidence_reference: v })}
              />
              <Field
                label={`Evidence excerpt ${i + 1}`}
                name={`evidence_excerpt-${i}`}
                value={c.evidence_excerpt}
                maxLength={1000}
                multiline
                onChange={(v) => setCharge(i, { evidence_excerpt: v })}
              />
              <p>Charge targets</p>
              {e.saved.lines
                .filter((l) => l.category === "Product" && selections[l.id])
                .map((l) => (
                  <label key={l.id}>
                    <input
                      type="checkbox"
                      checked={c.line_ids.includes(l.id)}
                      onChange={(event) =>
                        setCharge(i, {
                          line_ids: event.target.checked
                            ? [...c.line_ids, l.id]
                            : c.line_ids.filter((id) => id !== l.id),
                        })
                      }
                    />
                    {l.description}
                  </label>
                ))}
              <Button
                onClick={() => {
                  setCharges(charges.filter((_, n) => n !== i));
                  changed();
                }}
              >
                Remove charge {i + 1}
              </Button>
            </fieldset>
          ))}
          <Button
            disabled={charges.length >= 20}
            onClick={() => {
              setCharges([
                ...charges,
                {
                  id: crypto.randomUUID(),
                  kind: "Freight",
                  basis: "Shipment",
                  allocation: "Equal",
                  amount: "",
                  line_ids: [],
                  effective_date: "",
                  evidence_reference: "",
                  evidence_excerpt: "",
                },
              ]);
              changed();
            }}
          >
            Add charge
          </Button>
          {charges.length > 0 && (
            <label className="xi-confirmation">
              <input
                type="checkbox"
                checked={exclusive}
                onChange={(event) => {
                  setExclusive(event.target.checked);
                  changed();
                }}
              />
              These charges are excluded from supplier prices and every other
              estimate line.
            </label>
          )}
        </section>
        {stage < 2 && (
          <ExcelFooterActions disabled={frozen || !editable}>
            {stage === 0 ? (
              <Button
                variant="primary"
                disabled={
                  !date || !Object.keys(selections).length || !!sources.error
                }
                onClick={() => go(1)}
              >
                Continue to charges
              </Button>
            ) : (
              <>
                <Button onClick={() => go(0)}>Previous</Button>
                <Button
                  variant="primary"
                  disabled={
                    !date ||
                    !Object.keys(selections).length ||
                    (charges.length > 0 && !exclusive) ||
                    !!sources.error
                  }
                  onClick={() => void preview()}
                >
                  Review pricing comparison
                </Button>
              </>
            )}
          </ExcelFooterActions>
        )}
        {review && (
          <section className="es02-card">
            <h3>3. Review exact prices and allocation</h3>
            <Button
              disabled={frozen}
              onClick={() => {
                changed();
                go(0);
              }}
            >
              Edit lines and charges
            </Button>
            <dl>
              <Row label="Cost before">
                {money(review.comparison.before.cost)}
              </Row>
              <Row label="Cost after">
                {money(review.comparison.after.cost)}
              </Row>
              <Row label="Sell · unchanged">
                {money(review.comparison.after.sell)}
              </Row>
            </dl>
            <TableScroll label="Reviewed source pricing">
              <table>
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Workbook cost</th>
                    <th>Current cost</th>
                    <th>Reviewed cost</th>
                    <th>Source / tier / evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {review.comparison.changes.map((c) => (
                    <tr key={c.line_id}>
                      <th>{c.description}</th>
                      <td>
                        {money(
                          review.workbook_values.find(
                            (v) => v.line_id === c.line_id,
                          )?.original?.unit_cost,
                        )}
                      </td>
                      <td>{money(c.old.unit_cost)}</td>
                      <td>{money(c.new.unit_cost)}</td>
                      <td>
                        {c.source_reference} · r{c.source_revision}
                        <p>
                          Expiry {c.valid_until ?? "Unknown"} · {c.warning}
                        </p>
                        <p>
                          Tier from{" "}
                          {
                            review.comparison.bindings.find(
                              (b) => b.line_id === c.line_id,
                            )?.tier_minimum_quantity
                          }
                        </p>
                        {c.foreign_price && (
                          <p>
                            {c.foreign_price.currency}{" "}
                            {c.foreign_price.unit_cost} · original foreign unit
                            price
                          </p>
                        )}
                        <EvidenceDetails title="Price evidence">
                          <EvidenceValues value={c} />
                          <EvidenceValues
                            value={review.comparison.bindings.find(
                              (b) => b.line_id === c.line_id,
                            )}
                          />
                        </EvidenceDetails>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
            {review.comparison.fx_sources && (
              <>
                <h3>Original foreign prices and recorded rates</h3>
                {review.comparison.fx_sources.map((fx) => (
                  <div className="xi-confirmation" key={fx.source_revision_id}>
                    <strong>
                      {fx.conversion.currency} · {fx.conversion.rate} AUD per{" "}
                      {fx.conversion.currency}
                    </strong>
                    <p>
                      Rate date {fx.conversion.rate_date} · effective{" "}
                      {fx.conversion.effective_from} to{" "}
                      {fx.conversion.valid_until}
                    </p>
                    <p>
                      {fx.conversion.evidence_reference} ·{" "}
                      {fx.conversion.evidence_excerpt}
                    </p>
                    <EvidenceDetails title="Recorded conversion and original tiers">
                      <EvidenceValues value={fx} />
                    </EvidenceDetails>
                  </div>
                ))}
              </>
            )}
            {review.comparison.landed_costs && (
              <>
                <h3>Charges and allocation to the cent</h3>
                <TableScroll label="Landed charges">
                  <table>
                    <thead>
                      <tr>
                        <th>Charge</th>
                        <th>Basis</th>
                        <th>Amount</th>
                        <th>Evidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {review.comparison.landed_costs.proposal.charges.map(
                        (c) => (
                          <tr key={c.id}>
                            <th>{c.kind}</th>
                            <td>
                              {c.basis} {c.allocation}
                            </td>
                            <td>{money(c.amount)}</td>
                            <td>
                              {c.evidence_reference} · {c.effective_date}
                              <p>{c.evidence_excerpt}</p>
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </TableScroll>
                <TableScroll label="Landed cost by line">
                  <table>
                    <thead>
                      <tr>
                        <th>Line</th>
                        <th>Base extension</th>
                        <th>Allocated</th>
                        <th>Landed extension</th>
                        <th>Unit cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {review.comparison.landed_costs.bindings.map((b) => (
                        <tr key={b.line_id}>
                          <th>
                            {
                              e.saved.lines.find((l) => l.id === b.line_id)
                                ?.description
                            }
                          </th>
                          <td>{money(b.landed.base_cost)}</td>
                          <td>{money(b.landed.allocated_cost)}</td>
                          <td>{money(b.landed.landed_cost)}</td>
                          <td>{money(b.unit_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </TableScroll>
                <p>
                  All allocated charges{" "}
                  {money(review.comparison.landed_costs.total)}
                </p>
                <EvidenceDetails title="Exact charge and allocation evidence">
                  <EvidenceValues value={review.comparison.landed_costs} />
                </EvidenceDetails>
              </>
            )}
            <h3>Totals · sell prices unchanged</h3>
            <TableScroll label="Pricing totals">
              <table>
                <thead>
                  <tr>
                    <th>Measure</th>
                    <th>Current</th>
                    <th>Proposed</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Cost</th>
                    <td>{money(review.comparison.before.cost)}</td>
                    <td>{money(review.comparison.after.cost)}</td>
                    <td>{money(review.comparison.cost_change)}</td>
                  </tr>
                  <tr>
                    <th>Sell</th>
                    <td>{money(review.comparison.before.sell)}</td>
                    <td>{money(review.comparison.after.sell)}</td>
                    <td>{money(review.comparison.sell_change)}</td>
                  </tr>
                  <tr>
                    <th>Margin</th>
                    <td>
                      {review.comparison.before.margin_percent == null
                        ? "Unknown"
                        : `${review.comparison.before.margin_percent}%`}
                    </td>
                    <td>
                      {review.comparison.after.margin_percent == null
                        ? "Unknown"
                        : `${review.comparison.after.margin_percent}%`}
                    </td>
                    <td>—</td>
                  </tr>
                </tbody>
              </table>
            </TableScroll>
            <label className="xi-confirmation">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              I reviewed every price, source revision, tier, warning, recorded
              FX rate and landed allocation shown here.
            </label>
            <Field
              label="Pricing reason"
              name="reason"
              value={reason}
              onChange={setReason}
              required
              maxLength={1000}
            />
            <ExcelFooterActions
              disabled={frozen || !editable || !!command.error}
            >
              <Button
                variant="primary"
                disabled={!confirmed || !reason.trim()}
                onClick={() =>
                  void command.send(
                    `estimating/estimates/${e.id}/excel-source-pricing`,
                    {
                      reason,
                      expected_version: review.comparison.expected_version,
                      proposal: review.proposal,
                      comparison_hash: review.review_hash,
                      reviewed: true,
                    },
                    "/estimating/import",
                    "Priced estimate",
                    e.id,
                  )
                }
              >
                Save priced estimate
              </Button>
            </ExcelFooterActions>
          </section>
        )}
      </fieldset>
    </>
  );
}
export function ExcelQuotation({
  estimate: e,
  onReview,
}: {
  estimate: Estimate;
  onReview: (value: ReviewSummary | null) => void;
}) {
  const router = useRouter(),
    [initial, setInitial] = useState<QuoteReview | null>(null),
    [review, setReview] = useState<QuoteReview | null>(null),
    [choices, setChoices] = useState<
      Record<string, { included?: boolean; print?: boolean }>
    >({}),
    [confirmations, setConfirmations] = useState<string[]>([]),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [epoch, setEpoch] = useState(0),
    [dirty, setDirty] = useState(false);
  const command = useExcelCommand(`quote:${e.id}:${e.saved.id}`),
    serial = useRef(0),
    editable =
      e.can_edit && e.can_prepare && e.saved.id === e.current_version_id;
  const frozen =
    busy ||
    command.busy ||
    !!command.pending ||
    !!command.accepted ||
    !command.ready;
  useUnsavedChanges(
    dirty && !command.accepted,
    command.busy || !!command.pending,
  );
  useEffect(() => {
    let live = true;
    api<QuoteReview>(`estimating/estimates/${e.id}/excel-quote/review`, {
      estimate_version_id: e.saved.id,
    }).then(
      (r) => {
        if (live) {
          setInitial(r);
          setChoices(
            Object.fromEntries(
              r.proposals.map((p) => [p.line_id, p.proposal ?? {}]),
            ),
          );
          setError(null);
        }
      },
      (err) => {
        if (live) {
          setInitial(null);
          setReview(null);
          setError(err);
        }
      },
    );
    return () => {
      live = false;
    };
  }, [e.id, e.saved.id, epoch]);
  useEffect(
    () => () => {
      serial.current++;
    },
    [],
  );
  const complete = initial?.proposals.every(
    (p) =>
      typeof choices[p.line_id]?.included === "boolean" &&
      typeof choices[p.line_id]?.print === "boolean",
  );
  async function preview() {
    if (!complete || !initial || frozen || !editable) return;
    const token = ++serial.current;
    setBusy(true);
    command.clear();
    onReview(null);
    setReview(null);
    setConfirmations([]);
    setError(null);
    try {
      const r = await api<QuoteReview>(
        `estimating/estimates/${e.id}/excel-quote/review`,
        {
          estimate_version_id: e.saved.id,
          choices: initial.proposals.map((p) => ({
            line_id: p.line_id,
            ...choices[p.line_id],
          })),
        },
      );
      if (token === serial.current) {
        setReview(r);
        onReview({
          label: "Draft reconciliation",
          values: Object.entries(r.reconciliation).map(([key, value]) => [
            key.replaceAll("_", " "),
            value,
          ]),
        });
      }
    } catch (err) {
      if (token === serial.current) setError(err);
    } finally {
      if (token === serial.current) setBusy(false);
    }
  }
  if (denied(error) || denied(command.error))
    return (
      <>
        <ErrorNotice error={error} />
        <CommandOutcome
          command={command}
          onSaved={(r) => router.push(`/estimating/quotes/${r.record_id}`)}
        />
      </>
    );
  return (
    <>
      <h2>Prepare Draft quotation</h2>
      <p>
        Review the exact saved estimate, included price and customer wording.
        This saves a Draft; it does not issue or send it.
      </p>
      {!editable && (
        <p role="alert">
          The current estimate, estimating edit and quotation prepare/read
          authority are required.
        </p>
      )}
      <ErrorNotice error={error} />
      <CommandOutcome
        command={command}
        onSaved={(r) => router.push(`/estimating/quotes/${r.record_id}`)}
      />
      {!initial && !error && <p role="status">Loading workbook proposals…</p>}
      {!!error && !command.pending && (
        <Button
          disabled={busy}
          onClick={() => {
            serial.current++;
            setReview(null);
            onReview(null);
            command.clear();
            setConfirmations([]);
            setEpoch((n) => n + 1);
          }}
        >
          Reload quotation review
        </Button>
      )}
      {initial && (
        <fieldset className="xi-workflow" disabled={frozen || !editable}>
          <section className="es02-card">
            <h3>Included price and printed detail</h3>
            <p>
              Kept lines without a workbook proposal need an explicit choice for
              both inclusion and printing. Included hidden lines contribute
              through Included scope allowance.
            </p>
            {initial.proposals.map((p) => (
              <div className="xi-confirmation" key={p.line_id}>
                <strong>{p.description}</strong>
                <p>
                  {p.proposal
                    ? `Workbook proposes include ${p.proposal.included ? "Yes" : "No"}, print ${p.proposal.print ? "Yes" : "No"}`
                    : "Kept line · no workbook proposal · choose explicitly"}
                </p>
                {(["included", "print"] as const).map((key) => (
                  <label key={key}>
                    {key === "included" ? "Include" : "Print"} {p.description}
                    <select
                      value={
                        choices[p.line_id]?.[key] === undefined
                          ? ""
                          : choices[p.line_id][key]
                            ? "Yes"
                            : "No"
                      }
                      onChange={(event) => {
                        setChoices({
                          ...choices,
                          [p.line_id]: {
                            ...choices[p.line_id],
                            [key]:
                              event.target.value === ""
                                ? undefined
                                : event.target.value === "Yes",
                          },
                        });
                        setReview(null);
                        onReview(null);
                        command.clear();
                        setConfirmations([]);
                        setDirty(true);
                      }}
                    >
                      <option value="">Choose</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </label>
                ))}
              </div>
            ))}
          </section>
          <Button
            variant="primary"
            disabled={!complete}
            onClick={() => void preview()}
          >
            Review Draft choices
          </Button>
          {review && (
            <>
              <section className="es02-card">
                <h3>Reconcile Draft total</h3>
                <dl>
                  {Object.entries(review.reconciliation).map(([k, v]) => (
                    <Row key={k} label={k.replaceAll("_", " ")}>
                      {money(v)}
                    </Row>
                  ))}
                </dl>
                <p>
                  {review.choice_changes.length} workbook choices changed.{" "}
                  {review.unresolved_line_ids.length} lines unresolved.
                </p>
                {!review.can_prepare && (
                  <p role="alert">
                    Choose at least one included line and resolve every retained
                    line.
                  </p>
                )}
              </section>
              {review.customer_content && (
                <article
                  className="es02-card xi-customer"
                  aria-label="Customer-safe Draft preview"
                >
                  <h3>{review.customer_content.title}</h3>
                  <p>
                    {review.customer_content.customer} ·{" "}
                    {review.customer_content.site}
                  </p>
                  <h4>Included scope</h4>
                  <p>{review.customer_content.scope.included}</p>
                  <TableScroll label="Customer Draft lines">
                    <table>
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>AUD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {review.customer_content.items.map((line, i) => (
                          <tr key={i}>
                            <td>{line.description}</td>
                            <td>
                              {line.quantity ?? "Included"} {line.unit}
                            </td>
                            <td>{line.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                  <strong>
                    Draft total {money(review.customer_content.total)}
                  </strong>
                  <h4>Excluded scope</h4>
                  <p>{review.customer_content.scope.excluded}</p>
                  <h4>Assumptions</h4>
                  <p>{review.customer_content.scope.assumptions}</p>
                </article>
              )}
              <section className="es02-card">
                <h3>Confirm Draft preparation</h3>
                {[
                  ["CustomerWording", "Customer wording"],
                  ["IncludePrint", "Include and print choices"],
                  ["Reconciliation", "Reconciliation"],
                ].map(([id, label]) => (
                  <label className="xi-confirmation" key={id}>
                    <input
                      type="checkbox"
                      checked={confirmations.includes(id)}
                      onChange={(event) =>
                        setConfirmations(
                          event.target.checked
                            ? [...confirmations, id]
                            : confirmations.filter((v) => v !== id),
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
                <Field
                  label="Draft preparation reason"
                  name="reason"
                  value={reason}
                  onChange={(v) => {
                    setReason(v);
                    setDirty(true);
                  }}
                  maxLength={1000}
                  required
                />
                <ExcelFooterActions
                  disabled={frozen || !editable || !!command.error}
                >
                  <Button
                    variant="primary"
                    disabled={
                      !review.can_prepare ||
                      !review.review_hash ||
                      confirmations.length !== 3 ||
                      !reason.trim()
                    }
                    onClick={() =>
                      void command.send(
                        `estimating/estimates/${e.id}/excel-quote`,
                        {
                          reason,
                          id: crypto.randomUUID(),
                          estimate_version_id: review.estimate_version_id,
                          expected_version: review.expected_version,
                          expected_quote_version: review.expected_quote_version,
                          choices: review.choices,
                          review_hash: review.review_hash,
                          confirmations,
                        },
                        "/estimating/import",
                        "Draft quotation",
                        e.id,
                      )
                    }
                  >
                    Prepare Draft quotation
                  </Button>
                </ExcelFooterActions>
                <p>
                  Draft saved and output ready are separate states. Open the
                  saved quotation to generate or recover its exact output.
                </p>
              </section>
            </>
          )}
        </fieldset>
      )}
    </>
  );
}
