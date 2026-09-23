"use client";
import { useId, useMemo, useState } from "react";
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
import { fertigationViews, type FertigationView } from "./fertigation-frame";

const viewLabel = (view: GuidanceView) =>
  fertigationViews.find(([id]) => id === view)?.[1] ?? "Scope review";

export function SeverityChip({ severity }: { severity: Finding["severity"] }) {
  return (
    <span className={`fn-chip fn-chip-${severity}`}>
      {severity === "conflict" && (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M12 4 2.5 20h19z" />
          <path d="M12 10v4" />
        </svg>
      )}
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
}: {
  input: Parameters<typeof outputReadiness>[0];
  onView: (view: FertigationView) => void;
}) {
  const rows = outputReadiness(input);
  const stateLabel = {
    available: "Available",
    blocked: "Unavailable",
    needs: "Needs a step",
  };
  return (
    <section className="fn-panel" aria-labelledby="fn-outputs-title">
      <header className="fn-panel-head">
        <h2 id="fn-outputs-title">What this scope can produce now</h2>
        <p>
          The server&rsquo;s own preconditions. Open findings travel with each
          output; they never block it.
        </p>
      </header>
      <ul className="fn-output-list">
        {rows.map((r) => (
          <li key={r.key}>
            <div>
              <strong>{r.label}</strong>
              <small>{r.reason}</small>
            </div>
            <span
              className={`fn-chip fn-chip-${r.state === "available" ? "success" : r.state === "needs" ? "neutral" : "incomplete"}`}
            >
              {stateLabel[r.state]}
            </span>
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

export function NextActionsPanel({
  scope,
  findings,
  basis,
  onView,
  candidates = [],
  canResolve,
  onResolve,
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
  limit?: number;
}) {
  const actions = useMemo(
    () => nextActions(scope, findings),
    [scope, findings],
  );
  return (
    <section className="fn-panel" aria-labelledby="fn-actions-title">
      <header className="fn-panel-head">
        <h2 id="fn-actions-title">Next actions</h2>
        <p>Conflicts first, then missing inputs, then review · {basis}</p>
      </header>
      {actions.length === 0 && !candidates.length ? (
        <p className="fn-panel-empty">No open findings on this calculation.</p>
      ) : (
        <ol className="fn-next-list">
          {candidates.map((c) => (
            <li key={`candidate|${c.candidate_id}`}>
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
              <span className="fn-next-actions">
                {canResolve?.("injection") && (
                  <button
                    type="button"
                    onClick={() => onResolve?.("injection")}
                  >
                    Resolve
                  </button>
                )}
                <button type="button" onClick={() => onView("configurator")}>
                  Open Unit configurator
                </button>
              </span>
            </li>
          ))}
          {actions.slice(0, Math.max(limit - candidates.length, 3)).map((a) => (
            <li key={`${a.severity}|${a.code}`}>
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
              <span className="fn-next-actions">
                {a.severity === "conflict" && canResolve?.(a.code) && (
                  <button type="button" onClick={() => onResolve?.(a.code)}>
                    Resolve
                  </button>
                )}
                <button type="button" onClick={() => onView(a.view)}>
                  Open {viewLabel(a.view)}
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
      {actions.length > limit && (
        <p className="fn-panel-foot">
          <button
            type="button"
            className="fn-link"
            onClick={() => onView("review")}
          >
            All {findings.length} findings by responsible role
          </button>
        </p>
      )}
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
        <h2 id={titleId}>Capacity headroom</h2>
        <p>
          Each limit the scope records, loaded by its calculated demand. The
          line marks 100%; entered capacities stay unverified until evidence is
          recorded.
        </p>
      </header>
      <div className="fn-table-scroll">
        <table className="fn-capacity">
          <thead>
            <tr>
              <th scope="col">Constraint</th>
              <th scope="col">
                Load <span className="fn-scale">on a 0–200% scale</span>
              </th>
              <th scope="col" className="fn-number">
                Load
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
                  <td className="fn-number">
                    {pct === null ? "—" : `${pct}%`}
                  </td>
                  <td>
                    <span
                      className={`fn-chip fn-chip-${r.state === "over" ? "conflict" : r.state === "storage" ? "incomplete" : r.state === "unknown" ? "neutral" : "success"}`}
                    >
                      {stateText[r.state]}
                    </span>
                    <small>{r.note}</small>
                    {onTrace && r.key === "pump_head" && (
                      <button
                        type="button"
                        className="fn-link"
                        onClick={() => onTrace("required_head")}
                      >
                        How this is calculated
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
        <h2 id="fn-evidence-title">Evidence coverage</h2>
        <p>
          {coverage.total} active records, each counted once by its strongest
          linked evidence
        </p>
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
          Weakest links:{" "}
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
