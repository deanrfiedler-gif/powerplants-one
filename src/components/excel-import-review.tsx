"use client";
import { proposedTotals } from "./excel-import-types";
import { useState, type ReactNode } from "react";
import { Row, Tag, TableScroll, ChangeMarker } from "./estimation-wizard-ui";
import { Button } from "./ui/button";
import {
  money,
  type WorkbookReview,
  type WorkbookComparison,
} from "./excel-import-types";
export const confirmations = [
  [
    "SourceCalculation",
    "Source calculation",
    "I reviewed the workbook’s calculations and saved it after recalculating. PPO cannot prove the formulas are right.",
  ],
  [
    "Scope",
    "Scope",
    "I checked the workbook scope against this exact Complete discovery revision and option.",
  ],
  [
    "Reconciliation",
    "Reconciliation",
    "I reviewed every line, section and control total, including excluded lines and Unknown values.",
  ],
  [
    "SourceWarnings",
    "Source warnings",
    "I reviewed the source evidence, dates and all warnings shown in this review.",
  ],
] as const;
export function EvidenceDetails({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{title}</summary>
      {open && children}
    </details>
  );
}
export function EvidenceValues({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span>Unknown</span>;
  if (typeof value !== "object")
    return (
      <span>
        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
      </span>
    );
  if (Array.isArray(value))
    return (
      <ol className="xi-evidence-list">
        {value.map((v, i) => (
          <li key={i}>
            <EvidenceValues value={v} />
          </li>
        ))}
      </ol>
    );
  return (
    <dl className="xi-values">
      {Object.entries(value).map(([key, v]) => (
        <div key={key}>
          <dt>{key.replaceAll("_", " ")}</dt>
          <dd>
            <EvidenceValues value={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
export function ImportTotals({ review }: { review: WorkbookReview }) {
  return (
    <dl className="xi-totals">
      <Row label="Sell · calculated by PPO">
        <strong>{money(review.totals.sell)}</strong>
      </Row>
      <Row label="Cost">{money(review.totals.cost)}</Row>
      <Row label="Included in the price">
        {money(review.totals.included_sell)}
      </Row>
      <Row label="Lines · sections">
        {review.lines.length} · {review.sections.length}
      </Row>
    </dl>
  );
}
export function ReviewWorkbook({ review }: { review: WorkbookReview }) {
  const [filter, setFilter] = useState("All"),
    [all, setAll] = useState(false);
  const rows = review.lines.filter(
    (l) =>
      filter === "All" ||
      (filter === "Excluded"
        ? l.included === false
        : review.issues.some(
            (i) =>
              i.locator?.sheet === l.locator.sheet &&
              i.locator?.row === l.locator.row,
          )),
  );
  return (
    <>
      <div
        className={`xi-banner ${review.validation_passed ? "xi-ready" : "xi-blocked"}`}
        role="status"
      >
        <strong>
          {review.validation_passed
            ? "Ready for your review"
            : "Saving is blocked"}
        </strong>
        <p>
          {review.validation_passed
            ? "Automated checks passed. Confirm the source calculation, scope, reconciliation and warnings before saving."
            : "Correct the errors in Excel, recalculate and upload the corrected file. Nothing has been saved."}
        </p>
      </div>
      <div className="xi-review-tiles">
        <section className="es02-card">
          <h2>Validation</h2>
          <Tag tone={review.validation_passed ? "success" : "danger"}>
            {review.validation_passed ? "Passed" : "Blocked"}
          </Tag>
        </section>
        <section className="es02-card">
          <h2>Reconciliation</h2>
          <Tag
            tone={
              review.reconciliation.every((r) => r.matches)
                ? "success"
                : "warning"
            }
          >
            {review.reconciliation.every((r) => r.matches)
              ? "Exact to the cent"
              : "Review differences"}
          </Tag>
        </section>
        <section className="es02-card">
          <h2>Scope</h2>
          <p>Exact selected discovery</p>
        </section>
      </div>
      <div className="xi-phone-totals">
        <ImportTotals review={review} />
      </div>
      {(["Error", "Warning"] as const)
        .filter((severity) =>
          review.issues.some((issue) => issue.severity === severity),
        )
        .map((severity) => (
          <section className="es02-card xi-findings" key={severity}>
            <h2>
              {severity === "Error"
                ? "Prevents saving"
                : "Confirm before saving"}{" "}
              <Tag>
                {review.issues.filter((i) => i.severity === severity).length}
              </Tag>
            </h2>
            {review.issues
              .filter((i) => i.severity === severity)
              .map((issue, i) => (
                <article key={i}>
                  <strong>
                    {issue.code.replace(/([a-z])([A-Z])/g, "$1 $2")}
                  </strong>
                  <p>{issue.message}</p>
                  <small>
                    {issue.locator
                      ? `${issue.locator.sheet} · ${issue.locator.table} · row ${issue.locator.row} · ${issue.locator.range}`
                      : "Workbook"}{" "}
                    · {issue.field}
                  </small>
                </article>
              ))}
            {!review.issues.some((i) => i.severity === severity) && (
              <p>None found in this review.</p>
            )}
          </section>
        ))}
      <section className="es02-card">
        <h2>Informational</h2>
        <p>
          {review.lines.filter((l) => l.included === false).length} lines
          excluded from price; include and print remain separate choices.
        </p>
        <p>
          Formula review declared by{" "}
          {review.metadata.formula_reviewed_by ?? "Unknown"} ·{" "}
          {review.metadata.formula_reviewed_at ?? "Unknown"}. This is workbook
          evidence, not PPO approval.
        </p>
      </section>
      <Button
        className="xi-show-lines"
        aria-expanded={all}
        onClick={() => setAll(!all)}
      >
        {all ? "Hide line list" : `Show all ${review.lines.length} lines`}
      </Button>
      <section className="es02-card xi-line-list" data-expanded={all}>
        <h2>Workbook lines</h2>
        <div className="xi-actions" role="group" aria-label="Line filters">
          {["All", "With findings", "Excluded"].map((f) => (
            <Button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <p>
          {rows.length} of {review.lines.length} lines. Every populated row
          remains inspectable.
        </p>
        <TableScroll label="Workbook line review">
          <table>
            <thead>
              <tr>
                {[
                  "Line / location",
                  "Description / section",
                  "Quantity",
                  "Unit cost",
                  "Unit sell",
                  "PPO cost",
                  "PPO sell",
                  "Include / print",
                  "Evidence",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((l, i) => (
                <tr key={`${l.locator.sheet}:${l.locator.row}:${i}`}>
                  <td>
                    {l.line_ref ?? "Missing key"}
                    <small>
                      {l.locator.sheet} · row {l.locator.row}
                    </small>
                  </td>
                  <td>
                    {l.description ?? "Unknown"}
                    <small>{l.section_ref}</small>
                  </td>
                  <td>
                    {l.quantity ?? "Unknown"} {l.unit}
                  </td>
                  <td>{money(l.unit_cost)}</td>
                  <td>{money(l.unit_sell)}</td>
                  <td>{money(l.cost)}</td>
                  <td>{money(l.sell)}</td>
                  <td>
                    {String(l.included ?? "Unknown")} /{" "}
                    {String(l.print ?? "Unknown")}
                  </td>
                  <td>
                    <EvidenceDetails title={`Inspect row ${l.locator.row}`}>
                      <EvidenceValues value={l} />
                      <EvidenceValues
                        value={review.original_tables.PPO_Lines.find(
                          (r) =>
                            r.locator.sheet === l.locator.sheet &&
                            r.locator.row === l.locator.row,
                        )}
                      />
                    </EvidenceDetails>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
        {!rows.length && <p>No lines match this filter.</p>}
      </section>
      <section className="es02-card">
        <h2>Section totals</h2>
        {review.section_totals.map((s, i) => (
          <p key={i}>
            {review.sections.find((x) => x.section_ref === s.section_ref)
              ?.label ?? s.section_ref}{" "}
            · cost {money(s.cost)} · sell {money(s.sell)}
          </p>
        ))}
        <h2>Control totals</h2>
        <TableScroll label="Workbook control totals">
          <table>
            <thead>
              <tr>
                <th>Control</th>
                <th>Workbook</th>
                <th>PPO</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {review.reconciliation.map((r) => (
                <tr key={r.control}>
                  <th>{r.control.replaceAll("_", " ")}</th>
                  <td>{r.workbook ?? "Unknown"}</td>
                  <td>{r.calculated ?? "Unknown"}</td>
                  <td>{r.difference ?? "Unknown"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableScroll>
      </section>
      <EvidenceDetails title="Scope, sources and original evidence">
        <EvidenceValues value={review.scope_comparison} />
        <EvidenceValues value={review.sources} />
        <EvidenceValues value={review.original_tables} />
      </EvidenceDetails>
    </>
  );
}
export function CompareWorkbook({
  comparison: c,
  decisions,
  setDecisions,
  disabled,
}: {
  comparison: WorkbookComparison;
  decisions: Record<string, "Keep" | "Remove">;
  setDecisions: (v: Record<string, "Keep" | "Remove">) => void;
  disabled: boolean;
}) {
  const totals = proposedTotals(c, decisions);
  return (
    <section className="es02-card">
      <h2>Compare revised workbook</h2>
      <p>
        {["Added", "Changed", "Unchanged"]
          .map((k) => `${c.lines.filter((l) => l.kind === k).length} ${k}`)
          .join(" · ")}{" "}
        · {c.omissions.filter((l) => l.kind === "RemovedImported").length} Not
        in workbook · {c.omissions.filter((l) => l.kind === "PPOOnly").length}{" "}
        PPO-only
      </p>
      <p>
        Current estimate version {c.predecessor.version}. The workbook replaces
        incoming lines; kept lines retain their current saved values.
      </p>
      <fieldset disabled={disabled}>
        {c.omissions.map((l) => (
          <div className="xi-confirmation" key={l.line_id}>
            <strong>{l.before.description}</strong>
            <p>
              {l.kind === "PPOOnly" ? "PPO-only line" : "Not in this workbook"}{" "}
              · {l.before.quantity} {l.before.unit} · cost{" "}
              {money(l.before.unit_cost)} · sell {money(l.before.unit_sell)}
            </p>
            <label>
              Decision for {l.before.description}
              <select
                value={decisions[l.line_id] ?? ""}
                onChange={(e) =>
                  setDecisions({
                    ...decisions,
                    [l.line_id]: e.target.value as "Keep" | "Remove",
                  })
                }
              >
                <option value="">Choose Keep or Remove</option>
                <option>Keep</option>
                <option>Remove</option>
              </select>
            </label>
          </div>
        ))}
      </fieldset>
      <h3>Proposed estimate totals</h3>
      <p>
        All saved lines, including explicit Keep choices. Workbook included sell
        remains separate for Draft preparation.
      </p>
      <TableScroll label="Comparison totals">
        <table>
          <thead>
            <tr>
              <th>Total</th>
              <th>Current estimate</th>
              <th>Proposed estimate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Cost</th>
              <td>{money(c.predecessor.totals.cost)}</td>
              <td>{money(totals?.cost)}</td>
            </tr>
            <tr>
              <th>Sell</th>
              <td>{money(c.predecessor.totals.sell)}</td>
              <td data-testid="proposed-sell">{money(totals?.sell)}</td>
            </tr>
          </tbody>
        </table>
      </TableScroll>
      {!totals && (
        <p>
          Choose Keep or Remove for every omitted line to calculate the proposed
          totals.
        </p>
      )}
      <h3>Incoming lines and changes</h3>
      {c.lines.map((l) => (
        <details key={l.line_id}>
          <summary>
            <ChangeMarker change={l.kind} /> {l.line_ref} ·{" "}
            {l.proposed.description}
          </summary>
          <h3>Current PPO value</h3>
          <EvidenceValues value={l.before} />
          <h3>Previous workbook</h3>
          <EvidenceValues value={l.previous_workbook} />
          <h3>Incoming workbook</h3>
          <EvidenceValues value={l.proposed} />
          <h3>Changed fields</h3>
          <TableScroll label={`Changed fields for ${l.line_ref}`}>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Current / previous value</th>
                  <th>Incoming value</th>
                </tr>
              </thead>
              <tbody>
                {l.changes.map((change) => (
                  <tr key={change.field}>
                    <th>{change.field.replaceAll("_", " ")}</th>
                    <td>
                      <EvidenceValues value={change.before} />
                    </td>
                    <td>
                      <EvidenceValues value={change.after} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        </details>
      ))}
      <details>
        <summary>Scope, section and source changes</summary>
        <EvidenceValues value={c.changes} />
      </details>
      {c.source_binding_changes && (
        <>
          <h3>Reviewed source prices affected</h3>
          <EvidenceValues value={c.source_binding_changes} />
        </>
      )}
    </section>
  );
}
