"use client";
import { useId, useMemo, useState, type ReactNode } from "react";
import {
  capacityRows,
  type CandidateFailure,
  evidenceCoverage,
  evidenceStrengthLabels,
  guidanceFor,
  nextActions,
  outputReadiness,
  recordLocation,
  roleLabels,
  severityCounts,
  severityLabels,
  severityOrder,
  viewForFinding,
  type CapacityRow,
  type GuidanceView,
  type ResponsibleRole,
  type SeverityCounts,
} from "../estimating/fertigation/guidance";
import type {
  Calculation,
  Finding,
  Scope,
} from "../estimating/fertigation/types";
import {
  declaredCoverage,
  type Declaration,
} from "../estimating/fertigation/declarations";
import { WorklistMenu } from "./crm-worklist-tools";
import { ConflictMark, fertigationViews, type FertigationView } from "./fertigation-frame";

const viewLabel = (view: GuidanceView) =>
  fertigationViews.find(([id]) => id === view)?.[1] ?? "Scope review";

export function SeverityChip({ severity }: { severity: Finding["severity"] }) {
  return (
    <span className={`fn-chip fn-chip-${severity}`}>
      {severity === "conflict" && <ConflictMark />}
      {severityLabels[severity]}
    </span>
  );
}

export function RoleChip({ role }: { role: ResponsibleRole }) {
  return <span className="fn-role">{roleLabels[role]}</span>;
}

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

export const countsText = (c: SeverityCounts) =>
  c.total
    ? [
        c.conflict && plural(c.conflict, "conflict"),
        c.incomplete && `${c.incomplete} incomplete`,
        c.review && `${c.review} for review`,
      ]
        .filter(Boolean)
        .join(", ")
    : "No open findings";

/** Segmented bar plus words; colour never carries the meaning alone. */
export function ReadinessSummary({
  counts,
  basis,
  compact = false,
}: {
  counts: SeverityCounts;
  basis: string;
  compact?: boolean;
}) {
  return (
    <div
      className={compact ? "fn-readiness fn-readiness-compact" : "fn-readiness"}
    >
      {compact && <p className="fn-readiness-eyebrow">Scope readiness</p>}
      <p className="fn-readiness-total">
        <strong>{counts.total}</strong> open{" "}
        {counts.total === 1 ? "finding" : "findings"}
        <small className="fn-readiness-basis">{basis}</small>
      </p>
      {counts.total > 0 && (
        <div className="fn-readiness-bar" aria-hidden="true">
          {severityOrder.map((s) =>
            counts[s] ? (
              <span
                key={s}
                className={`fn-bar-${s}`}
                style={{ flexGrow: counts[s] }}
              />
            ) : null,
          )}
        </div>
      )}
      <ul className="fn-readiness-legend">
        {severityOrder.map((s) => (
          <li key={s}>
            <span className={`fn-key fn-bar-${s}`} aria-hidden="true" />
            {s === "conflict"
              ? plural(counts[s], "conflict")
              : s === "review"
                ? `${counts[s]} for review`
                : `${counts[s]} incomplete`}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function OutputReadinessPanel({
  input,
  onView,
  links,
}: {
  input: Parameters<typeof outputReadiness>[0];
  onView: (view: FertigationView) => void;
  /** Where an available output opens: the exact export and the saved customer report. */
  links?: { export?: string; report?: string };
}) {
  const rows = outputReadiness(input);
  const stateLabel = {
    available: "Available",
    blocked: "Unavailable",
    needs: "Needs a step",
  };
  const action = (key: (typeof rows)[number]["key"], state: (typeof rows)[number]["state"]) => {
    if (key === "export" && links?.export)
      return (
        <a className="fn-button fn-button-secondary fn-button-sm" href={links.export} download>
          <span>Export</span>
        </a>
      );
    if (key === "report" && links?.report)
      return (
        <a className="fn-button fn-button-secondary fn-button-sm" href={links.report} target="_blank" rel="noreferrer">
          <span>Preview report</span>
        </a>
      );
    if (key === "review")
      return (
        <button type="button" className="fn-button fn-button-secondary fn-button-sm" onClick={() => onView("review")}>
          <span>{state === "available" ? "Record review" : "Open review"}</span>
        </button>
      );
    if (key === "handover")
      return (
        <button type="button" className="fn-button fn-button-secondary fn-button-sm" onClick={() => onView("review")}>
          <span>Requirements</span>
        </button>
      );
    return null;
  };
  return (
    <section className="fn-panel" aria-labelledby="fn-outputs-title">
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id="fn-outputs-title">What this scope can produce now</h3>
          <p>Each output is gated by the server&rsquo;s own preconditions, never by a percentage score. Open findings travel with it.</p>
        </div>
      </header>
      <ul className="fn-output-list">
        {rows.map((r) => (
          <li key={r.key}>
            <div className="fn-output-body">
              <strong>{r.label}</strong>
              <small>{r.reason}</small>
            </div>
            <span
              className={`fn-chip fn-chip-${r.state === "available" ? "success" : r.state === "needs" ? "outline" : "incomplete"}`}
            >
              {stateLabel[r.state]}
            </span>
            <span className="fn-output-action">{action(r.key, r.state)}</span>
          </li>
        ))}
      </ul>
      <p className="fn-panel-foot">
        Reviews, handovers and retained reports are recorded in{" "}
        <button
          type="button"
          className="fn-link"
          onClick={() => onView("review")}
        >
          Scope review
        </button>
        .
      </p>
    </section>
  );
}

function NextActionControls({ label, children }: { label: string; children: ReactNode }) {
  return <div className="fn-next-action-set"><span className="fn-next-actions">{children}</span><WorklistMenu label={`Actions for ${label}`} icon="more" className="fn-next-menu">{children}</WorklistMenu></div>;
}

export function NextActionsPanel({
  scope,
  findings,
  basis,
  onView,
  candidates = [],
  canResolve,
  onResolve,
  canDeclare,
  onDeclare,
  limit = 5,
}: {
  scope: Scope;
  findings: readonly Finding[];
  basis: string;
  onView: (view: FertigationView) => void;
  candidates?: CandidateFailure[];
  /** code → whether a registered resolution applies; "injection" for candidates. */
  canResolve?: (code: string) => boolean;
  onResolve?: (code: string) => void;
  /** code → whether a declaration offers a draft edit for a missing input. */
  canDeclare?: (code: string) => boolean;
  onDeclare?: (code: string) => void;
  limit?: number;
}) {
  const actions = useMemo(
    () => nextActions(scope, findings),
    [scope, findings],
  );
  return (
    <section className="fn-panel fn-next-panel" aria-labelledby="fn-actions-title">
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id="fn-actions-title">Next actions</h3>
          <p>Conflicts first, then what gates the most outputs · {basis}</p>
        </div>
        {findings.length > 0 && <button type="button" className="fn-link" onClick={() => onView("review")}>All {findings.length} open checks</button>}
      </header>
      {actions.length === 0 && !candidates.length ? (
        <p className="fn-panel-empty">No open findings on this calculation.</p>
      ) : (
        <ol className="fn-next-list">
          {candidates.map((c, index) => (
            <li key={`candidate|${c.candidate_id}`} className="fn-next-conflict">
              <span className="fn-next-number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="fn-next-body">
                <strong>{c.label} is outside its entered limits</strong>
                <small>{c.failures.join(" ")}</small>
                <span className="fn-next-meta">
                  <span className="fn-chip fn-chip-conflict">
                    Candidate failure
                  </span>
                  <RoleChip role="priva_specialist" />
                </span>
              </div>
              <NextActionControls label={c.label}>
                {canResolve?.("injection") && (
                  <button
                    data-menu-close
                    type="button"
                    onClick={() => onResolve?.("injection")}
                  >
                    Resolve
                  </button>
                )}
                <button data-menu-close type="button" onClick={() => onView("configurator")}>
                  Open Unit configurator
                </button>
              </NextActionControls>
            </li>
          ))}
          {actions.slice(0, Math.max(limit - candidates.length, 3)).map((a, index) => (
            <li key={`${a.severity}|${a.code}`} className={`fn-next-${a.severity}`}>
              <span className="fn-next-number" aria-hidden="true">
                {candidates.length + index + 1}
              </span>
              <div className="fn-next-body">
                <strong>
                  {a.summary}
                  {a.count > 1 && <span className="fn-count"> ×{a.count}</span>}
                </strong>
                <small>{a.message}</small>
                <span className="fn-next-meta">
                  <SeverityChip severity={a.severity} />
                  <RoleChip role={a.role} />
                </span>
              </div>
              <NextActionControls label={a.summary}>
                {a.severity === "conflict" && canResolve?.(a.code) && (
                  <button data-menu-close type="button" onClick={() => onResolve?.(a.code)}>
                    Resolve
                  </button>
                )}
                {a.severity !== "conflict" && canDeclare?.(a.code) && (
                  <button data-menu-close type="button" onClick={() => onDeclare?.(a.code)}>
                    Declare
                  </button>
                )}
                <button data-menu-close type="button" onClick={() => onView(a.view)}>
                  Open {viewLabel(a.view)}
                </button>
              </NextActionControls>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export type DeclarationBasis = "recorded" | "declared" | "new_input";
export const declarationBasis = (d: Declaration): DeclarationBasis =>
  d.options.some((o) => o.transform && o.basis === "recorded")
    ? "recorded"
    : d.options.some((o) => o.transform)
      ? "declared"
      : "new_input";
const basisText: Record<DeclarationBasis, [string, string]> = {
  recorded: ["From recorded values", "fn-chip fn-chip-success"],
  declared: ["Your declaration", "fn-chip fn-chip-review"],
  new_input: ["Needs new input", "fn-chip"],
};
export function BasisChip({ basis }: { basis: DeclarationBasis }) {
  const [text, className] = basisText[basis];
  return <span className={className}>{text}</span>;
}

/** Declarations the draft needs (feature F1): what each finding group waits
 * on, and whether the draft already records the answer. */
export function DeclarationsPanel({
  items,
  findings,
  basis,
  onView,
  canOpen,
  onDeclare,
}: {
  items: Declaration[];
  findings: number;
  basis: string;
  onView: (view: FertigationView) => void;
  /** The drawer needs a calculation that belongs to the current draft. */
  canOpen: boolean;
  onDeclare: (key: string) => void;
}) {
  if (!items.length) return null;
  const covered = declaredCoverage(items);
  return (
    <section className="fn-panel" aria-labelledby="fn-declarations-title">
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id="fn-declarations-title">Declarations this draft needs</h3>
          <p>
            {items.length} {items.length === 1 ? "declaration" : "declarations"}{" "}
            address {covered} of {findings}{" "}
            {findings === 1 ? "finding" : "findings"} · {basis}
          </p>
        </div>
      </header>
      <ol className="fn-next-list">
        {items.map((d) => {
          const b = declarationBasis(d);
          return (
            <li key={d.key}>
              <div className="fn-next-body">
                <strong>
                  {d.id} · {d.title}
                  {d.findingIds.length > 0 && (
                    <span className="fn-count"> ×{d.findingIds.length}</span>
                  )}
                </strong>
                <small>{d.message}</small>
                <span className="fn-next-meta">
                  <BasisChip basis={b} />
                  <RoleChip role={d.role} />
                </span>
              </div>
              <span className="fn-next-actions">
                {b !== "new_input" && canOpen && (
                  <button type="button" onClick={() => onDeclare(d.key)}>
                    Declare
                  </button>
                )}
                {b === "new_input" && canOpen && (
                  <button type="button" onClick={() => onDeclare(d.key)}>
                    What is needed
                  </button>
                )}
                {d.view !== "overview" && (
                  <button type="button" onClick={() => onView(d.view)}>
                    Open {viewLabel(d.view)}
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="fn-panel-foot">
        Each edit is previewed by the server and applied to the working draft
        only. Nothing is saved until you save a revision with a reason.
      </p>
    </section>
  );
}

const stateText: Record<CapacityRow["state"], string> = {
  within: "Within",
  storage: "Relies on storage",
  over: "Over capacity",
  unknown: "Not assessable",
};

export function CapacityPanel({
  scope,
  calculation,
  onView,
  onTrace,
}: {
  scope: Scope;
  calculation: Calculation;
  onView: (view: FertigationView) => void;
  onTrace?: (key: string) => void;
}) {
  const rows = useMemo(
    () => capacityRows(scope, calculation),
    [scope, calculation],
  );
  const titleId = useId();
  if (!rows.length) return null;
  return (
    <section className="fn-panel" aria-labelledby={titleId}>
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id={titleId}>Capacity headroom</h3>
          <p>
            Every capacity limit in the circuit on one scale · demand as a share of the entered capacity
          </p>
        </div>
        <ul className="fn-legend fn-panel-actions">
          <li><span className="fn-swatch fn-swatch-within" aria-hidden="true" />Within capacity</li>
          <li><span className="fn-swatch fn-swatch-storage" aria-hidden="true" />Relies on storage</li>
          <li><span className="fn-swatch fn-swatch-over" aria-hidden="true" />Over capacity</li>
        </ul>
      </header>
      <div className="fn-table-scroll">
        <table className="fn-capacity">
          <thead>
            <tr>
              <th scope="col">Constraint</th>
              <th scope="col" className="fn-capacity-axis">
                <span className="fn-scale" aria-hidden="true">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                </span>
                <span className="sr-only">Load on a 0–200% scale</span>
              </th>
              <th scope="col" className="fn-number">
                Use
              </th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const pct = r.ratio === null ? null : Math.round(r.ratio * 100);
              return (
                <tr key={r.key}>
                  <th scope="row">
                    <button
                      type="button"
                      className="fn-link"
                      onClick={() => onView(r.view as FertigationView)}
                    >
                      {r.label}
                    </button>
                    <small>{r.detail}</small>
                  </th>
                  <td className="fn-capacity-bar-cell">
                    <div className="fn-capacity-bar" aria-hidden="true">
                      {pct !== null && (
                        <span
                          className={`fn-capacity-fill fn-capacity-${r.state}`}
                          style={{ width: `${Math.min(pct, 200) / 2}%` }}
                        />
                      )}
                      <span className="fn-capacity-limit" />
                    </div>
                  </td>
                  <td className={`fn-number fn-capacity-use fn-capacity-use-${r.state}`}>
                    {pct === null ? "—" : `${pct}%`}
                  </td>
                  <td className="fn-capacity-status">
                    {r.state === "over" ? (
                      <span className="fn-chip fn-chip-conflict">
                        <ConflictMark />
                        {r.candidate ? "Candidate failure" : "Conflict"}
                      </span>
                    ) : r.state === "unknown" ? (
                      <span className="fn-chip fn-chip-unknown">Not assessable</span>
                    ) : null}
                    <small>{r.note || stateText[r.state]}</small>
                    {onTrace && r.key === "pump_head" && (
                      <button
                        type="button"
                        className="fn-link"
                        onClick={() => onTrace("required_head")}
                      >
                        trace
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="fn-panel-foot">
        Each bar divides a calculated demand by the entered capacity for the selected scenario. The 100% rule is the
        limit; entered capacities remain unverified until evidence is recorded.
      </p>
    </section>
  );
}

export function EvidencePanel({
  scope,
  onView,
}: {
  scope: Scope;
  onView: (view: FertigationView) => void;
}) {
  const coverage = useMemo(() => evidenceCoverage(scope), [scope]);
  const order = [
    "document_reference",
    "observation",
    "assumption",
    "none",
  ] as const;
  return (
    <section className="fn-panel" aria-labelledby="fn-evidence-title">
      <header className="fn-panel-head">
        <div className="fn-panel-title">
          <h3 id="fn-evidence-title">Evidence maturity</h3>
          <p>
            {coverage.total} active records, each counted once by its strongest
            linked evidence
          </p>
        </div>
      </header>
      {coverage.total > 0 && (
        <div className="fn-evidence-bar" aria-hidden="true">
          {order.map((k) =>
            coverage.counts[k] ? (
              <span
                key={k}
                className={`fn-ev-${k}`}
                style={{ flexGrow: coverage.counts[k] }}
              />
            ) : null,
          )}
        </div>
      )}
      <dl className="fn-evidence-counts">
        {order.map((k) => (
          <div key={k}>
            <dt>{evidenceStrengthLabels[k]}</dt>
            <dd>{coverage.counts[k]}</dd>
          </div>
        ))}
      </dl>
      {coverage.weakest.length > 0 && (
        <p className="fn-panel-foot">
          Weakest links in the sizing chain:{" "}
          {coverage.weakest
            .slice(0, 6)
            .map((w) => w.label || "Unnamed record")
            .join(" · ")}
          {coverage.weakest.length > 6 &&
            ` and ${coverage.weakest.length - 6} more`}
          .{" "}
          <button
            type="button"
            className="fn-link"
            onClick={() => onView("evidence")}
          >
            Open Evidence &amp; delivery
          </button>
        </p>
      )}
    </section>
  );
}

/** Scope review worklist: grouped by the view that resolves each finding. */
export function FindingsReview({
  scope,
  calculation,
  onOpenRecord,
  onView,
  canResolve,
  onResolve,
}: {
  scope: Scope;
  calculation: Calculation;
  onOpenRecord: (recordId: string) => void;
  onView: (view: FertigationView) => void;
  canResolve?: (findingId: string) => boolean;
  onResolve?: (findingId: string) => void;
}) {
  const [severity, setSeverity] = useState<"all" | Finding["severity"]>("all");
  const [role, setRole] = useState<"all" | ResponsibleRole>("all");
  const counts = severityCounts(calculation.findings);
  const roles = useMemo(() => {
    const out = new Map<ResponsibleRole, number>();
    for (const f of calculation.findings) {
      const r = guidanceFor(f).role;
      out.set(r, (out.get(r) ?? 0) + 1);
    }
    return [...out.entries()].sort((a, b) => b[1] - a[1]);
  }, [calculation.findings]);
  const shown = calculation.findings.filter(
    (f) =>
      (severity === "all" || f.severity === severity) &&
      (role === "all" || guidanceFor(f).role === role),
  );
  const groups = new Map<GuidanceView, Finding[]>();
  for (const f of shown) {
    const view = viewForFinding(scope, f);
    groups.set(view, [...(groups.get(view) ?? []), f]);
  }
  const ordered = fertigationViews
    .map(([id]) => id as GuidanceView)
    .filter((id) => groups.has(id));
  return (
    <div className="fn-review">
      <div className="fn-review-filters">
        <div
          role="group"
          aria-label="Filter findings by severity"
          className="fn-segmented"
        >
          {(["all", ...severityOrder] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={severity === s}
              onClick={() => setSeverity(s)}
            >
              {s === "all" ? "All" : severityLabels[s]} ·{" "}
              {s === "all" ? counts.total : counts[s]}
            </button>
          ))}
        </div>
        <label className="fn-inline-label">
          Responsible
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
          >
            <option value="all">
              All roles · {calculation.findings.length}
            </option>
            {roles.map(([r, n]) => (
              <option key={r} value={r}>
                {roleLabels[r]} · {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!shown.length && (
        <p className="fn-empty">No findings match these filters.</p>
      )}
      {ordered.map((view) => {
        const list = groups.get(view)!;
        const c = severityCounts(list);
        return (
          <section
            key={view}
            className="fn-review-group"
            aria-label={`${viewLabel(view)} findings`}
          >
            <header>
              <h3>
                {viewLabel(view)} <small>· {countsText(c)}</small>
              </h3>
              {view !== "review" && (
                <button
                  type="button"
                  className="fn-link"
                  onClick={() => onView(view as FertigationView)}
                >
                  Open {viewLabel(view)}
                </button>
              )}
            </header>
            <ul>
              {list.map((f) => {
                const guide = guidanceFor(f),
                  where = recordLocation(scope, f.record_id);
                return (
                  <li key={f.id}>
                    <SeverityChip severity={f.severity} />
                    <div className="fn-review-body">
                      <strong>
                        {where?.label ? `${where.label}: ` : ""}
                        {f.message}
                      </strong>
                      <span className="fn-next-meta">
                        <RoleChip role={guide.role} />
                        <code>{guide.code}</code>
                        <small>{f.field}</small>
                      </span>
                    </div>
                    <span className="fn-next-actions">
                      {canResolve?.(f.id) && (
                        <button type="button" onClick={() => onResolve?.(f.id)}>
                          Resolve
                        </button>
                      )}
                      {f.record_id && where && (
                        <button
                          type="button"
                          onClick={() => onOpenRecord(f.record_id!)}
                        >
                          Open affected record
                        </button>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
