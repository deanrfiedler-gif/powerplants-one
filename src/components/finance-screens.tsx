"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ErrorNotice, useResource, type Failure } from "./business-ui";
import { useIdentity } from "./business-session";
import type {
  financeOptions,
  financeSources,
  listFinance,
} from "../finance/reads";
import type { readAccount } from "../finance/accounts";
import type { SourceEntry } from "../finance/context";
import styles from "./finance.module.css";
type Options = Awaited<ReturnType<typeof financeOptions>>;
type Sources = Awaited<ReturnType<typeof financeSources>>;
type Queue = Awaited<ReturnType<typeof listFinance>>;
type Line = {
  id: string;
  entry_id: string;
  entry_version: number;
  allocated_quantity: string;
  captured_quantity: string;
  reviewed_quantity: string;
  billable_quantity: string | null;
  disposition: string;
  reason: string;
  target_group: string | null;
  uom: string;
  direction: string;
};
type Revision = {
  id: string;
  revision: number;
  source_hash: string;
  treatment_basis: string;
  remaining_work_basis: string;
  source_snapshot: { reports: { report_id: string }[] };
};
type Detail = {
  handoff: {
    id: string;
    display_number: string;
    status: string;
    version: number;
    revision: number;
    current_revision_id: string;
    work_order_id: string;
    account_id: string;
    mode: string;
    currency: string;
    owner_id: string;
    processing_owner_id: string | null;
    active_attempt_id: string | null;
    customer_id: string;
  };
  work: { reference: string; customer: string; site: string };
  account: { fixture_key: string };
  lines: Line[];
  revisions: Revision[];
  reviews: {
    id: string;
    revision_id: string;
    decision: string;
    reason: string;
  }[];
  outcomes: {
    id: string;
    outcome: string;
    observed_at: string;
    evidence: unknown;
  }[];
  reconciliations: { id: string; revision_id: string; basis: string }[];
  corrections: { id: string; disposition: string; reason: string }[];
  jobs: {
    id: string;
    state: string;
    error_code: string | null;
    attempts: number;
  }[];
  issues: { id: string; issued_at: string; output_hash: string }[];
  events: {
    id: string;
    kind: string;
    reason: string;
    status: string;
    occurred_at: string;
  }[];
  readiness: { ready: boolean; reason?: string };
  capabilities: Record<string, boolean>;
  targets: unknown[];
};
const stateLabel = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2");
const date = (s: string | null) =>
  s
    ? new Date(s).toLocaleString("en-AU", { timeZone: "UTC" }) + " UTC"
    : "Not recorded";
type CommandReceipt = { record_id?: string; receipt_id?: string };
function useCommand(done: (receipt?: CommandReceipt) => void) {
  const [pending, setPending] = useState<{
      path: string;
      body: Record<string, unknown>;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(null),
    [receipt, setReceipt] = useState<string | null>(null);
  async function send(
    path: string,
    body: Record<string, unknown>,
    original = false,
  ) {
    const item = original
      ? { path, body }
      : {
          path,
          body: {
            schema_version: 1,
            operation_id: crypto.randomUUID(),
            ...body,
          },
        };
    setPending(item);
    setBusy(true);
    setError(null);
    try {
      const r = await api<CommandReceipt>(path, item.body);
      setPending(null);
      setReceipt(r.receipt_id ?? "Original output worker examined");
      done(r);
      return r;
    } catch (e) {
      setError(e);
      const f = e as Failure;
      if (!f.retryable && (f.status ?? 0) < 500) {
        setPending(null);
        done();
      }
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    pending,
    error,
    receipt,
    send,
    notice: (
      <>
        <ErrorNotice error={error} />
        {pending && !busy && (
          <div className={styles.notice} role="status">
            <p>
              Result not yet confirmed. The original action and operation ID are
              retained.
            </p>
            <button onClick={() => void send(pending.path, pending.body, true)}>
              Retry original action
            </button>
          </div>
        )}
        {receipt && (
          <p className={styles.meta} role="status">
            Accepted receipt: {receipt}
          </p>
        )}
      </>
    ),
  };
}
function Frame({
  title,
  children,
  subtitle,
}: {
  title: string;
  children: React.ReactNode;
  subtitle: string;
}) {
  return (
    <section className={styles.finance}>
      <p className={styles.eyebrow}>Finance · Synthetic · Private</p>
      <h1>{title}</h1>
      <p className={styles.intro}>{subtitle}</p>
      {children}
    </section>
  );
}
export function FinanceQueue() {
  const [state, setState] = useState(""),
    [after, setAfter] = useState(""),
    q = useResource<Queue>(
      `finance/handoffs?${new URLSearchParams({ ...(state ? { status: state } : {}), ...(after ? { after } : {}) })}`,
    ),
    o = useResource<Options>("finance/options");
  return (
    <Frame
      title="Finance handoffs"
      subtitle="Review exact service evidence, control the original processing action and reconcile its synthetic result."
    >
      <div className={styles.toolbar}>
        <label>
          Queue state
          <select
            aria-label="Queue state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setAfter("");
            }}
          >
            <option value="">All permitted states</option>
            {[
              "Draft",
              "ReadyForReview",
              "Returned",
              "Approved",
              "AwaitingERP",
              "OutcomeUnknown",
              "ReconciliationRequired",
              "Reconciled",
              "Cancelled",
            ].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <Link className="button" href="/finance/handoffs/new">
          Prepare handoff
        </Link>
        <button className="secondary" onClick={q.reload}>
          Refresh queue
        </button>
      </div>
      <ErrorNotice error={q.error} />
      {q.loading && <p role="status">Loading permitted Finance work…</p>}
      {q.data && (
        <>
          <div className={styles.notice}>
            Owned Finance work · dates shown in UTC · due and overdue policy not
            defined · customer distribution disabled
          </div>
          {q.data.items.length === 0 ? (
            <div className={styles.empty}>
              <h2>No Finance handoffs</h2>
              <p>
                Prepare a handoff when exact issued service evidence and a
                synthetic account context are available.
              </p>
            </div>
          ) : (
            <div className={styles.cards}>
              {q.data.items.map((r) => (
                <article key={r.id} className={styles.card}>
                  <div className={styles.row}>
                    <Link href={`/finance/handoffs/${r.id}`}>
                      <h2>{r.display_number}</h2>
                    </Link>
                    <span className={styles.badge}>{stateLabel(r.status)}</span>
                  </div>
                  <p>
                    {r.customer_name} · {r.work_reference}
                  </p>
                  <dl>
                    <dt>Legal company</dt>
                    <dd>{r.company_id}</dd>
                    <dt>Account / currency</dt>
                    <dd>
                      {r.account_reference} · {r.currency}
                    </dd>
                    <dt>Owner</dt>
                    <dd>{r.owner}</dd>
                    <dt>Age</dt>
                    <dd>
                      {Math.floor(r.age_seconds / 60)} minutes · {r.age_basis}
                    </dd>
                    <dt>Submitted</dt>
                    <dd>{date(r.submitted_at)}</dd>
                    <dt>Reviewed / claimed</dt>
                    <dd>
                      {date(r.reviewed_at)} / {date(r.claimed_at)}
                    </dd>
                  </dl>
                  {r.source_blocker && (
                    <p role="status" className={styles.warning}>
                      {r.source_blocker}
                    </p>
                  )}
                  <Link href={`/finance/handoffs/${r.id}`}>
                    Open exact evidence →
                  </Link>
                </article>
              ))}
            </div>
          )}
          {q.data.next_cursor && (
            <button
              className="secondary"
              onClick={() => setAfter(q.data!.next_cursor!)}
            >
              Next page of permitted handoffs
            </button>
          )}
        </>
      )}
      {o.data && (
        <section className={styles.panel}>
          <h2>Customer account simulation</h2>
          <p>
            Source balances, reversals and unapplied cash remain separate.
            Partial or failed extraction never becomes a zero balance.
          </p>
          {o.data.accounts.map((a) => (
            <p key={a.id}>
              <Link
                href={`/customers/${a.customer_id}/account?account_id=${a.id}`}
              >
                {a.fixture_key} · {a.currency} · synthetic account observations
              </Link>
            </p>
          ))}
        </section>
      )}
    </Frame>
  );
}
type DraftLine = {
  entry_id: string;
  quantity: string;
  disposition: string;
  reason: string;
  target_group: string | null;
};
export function FinanceForm({
  id,
  initial,
  onSaved,
}: {
  id?: string;
  initial?: Detail;
  onSaved?: () => void;
}) {
  const router = useRouter(),
    options = useResource<Options>("finance/options"),
    [work, setWork] = useState(initial?.handoff.work_order_id ?? ""),
    [account, setAccount] = useState(initial?.handoff.account_id ?? ""),
    [mode, setMode] = useState(initial?.handoff.mode ?? "SyntheticManual"),
    sources = useResource<Sources>(
      work ? `finance/work-orders/${work}/sources` : null,
    ),
    [selected, setSelected] = useState<string[]>(
      initial?.revisions[0]?.source_snapshot.reports.map((s) => s.report_id) ??
        [],
    ),
    [lines, setLines] = useState<DraftLine[]>(
      initial?.lines.map((l) => ({
        entry_id: l.entry_id,
        quantity: l.allocated_quantity,
        disposition: l.disposition,
        reason: l.reason,
        target_group: l.target_group,
      })) ?? [],
    ),
    [treatment, setTreatment] = useState(
      initial?.revisions[0]?.treatment_basis ?? "",
    ),
    [remaining, setRemaining] = useState(
      initial?.revisions[0]?.remaining_work_basis ?? "",
    ),
    [reason, setReason] = useState(""),
    cmd = useCommand((receipt) => {
      if (!receipt?.record_id) return;
      if (onSaved) onSaved();
      else {
        router.push(`/finance/handoffs/${receipt.record_id}`);
        router.refresh();
      }
    });
  const entries = new Map<string, SourceEntry>();
  for (const s of sources.data?.items ?? [])
    if ("source" in s)
      for (const e of s.source?.entries ?? []) entries.set(e.id, e);
  function choose(report: string, checked: boolean) {
    setSelected((v) =>
      checked ? [...v, report] : v.filter((x) => x !== report),
    );
    const source = sources.data?.items.find((s) => s.id === report);
    if (source && "source" in source && source.source) {
      const ids = source.source.entries.map((e: SourceEntry) => e.id);
      setLines((v) =>
        checked
          ? [
              ...v,
              ...source.source!.entries.map((e: SourceEntry) => ({
                entry_id: e.id,
                quantity: e.quantity,
                disposition: "Pending",
                reason: "",
                target_group: null,
              })),
            ]
          : v.filter((l) => !ids.includes(l.entry_id)),
      );
    }
  }
  const patch = (i: number, v: Partial<DraftLine>) =>
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...v } : l)));
  async function save() {
    if (!options.data || !sources.data) return;
    const refs = selected.map((report_id) => {
        const s = sources.data!.items.find((s) => s.id === report_id)!;
        return {
          report_id,
          revision_id: s.revision_id,
          review_id: s.review_id,
          issue_id: s.issue_id,
        };
      }),
      body = {
        ...(id
          ? { expected_version: initial!.handoff.version }
          : { id: crypto.randomUUID() }),
        reason,
        work_order_id: work,
        account_id: account,
        mode,
        definition_id: options.data.definition.id,
        definition_version: options.data.definition.version,
        policy_version: options.data.definition.policy_version,
        reports: refs,
        lines,
        treatment_basis: treatment,
        remaining_work_basis: remaining,
      };
    await cmd.send(
      id ? `finance/handoffs/${id}/revise` : "finance/handoffs",
      body,
    );
  }
  return (
    <Frame
      title={id ? "Revise Finance handoff" : "Prepare Finance handoff"}
      subtitle="Keep captured and reviewed quantities intact. Give every selected source quantity an explicit disposition and reason."
    >
      <Link href="/finance/handoffs">← Finance queue</Link>
      <ErrorNotice error={options.error} />
      <ErrorNotice error={sources.error} />
      {cmd.notice}
      {options.loading && <p role="status">Loading Finance context…</p>}
      {options.data && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <fieldset disabled={cmd.busy || !!cmd.pending}>
            <div className={styles.grid}>
              <label>
                Work order
                <select
                  aria-label="Work order"
                  value={work}
                  disabled={!!id}
                  onChange={(e) => {
                    setWork(e.target.value);
                    setAccount("");
                    setSelected([]);
                    setLines([]);
                  }}
                  required
                >
                  <option value="">Choose work order</option>
                  {options.data.works.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.display_number} · {w.customer_name} · {w.site_name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Synthetic account
                <select
                  aria-label="Synthetic account"
                  value={account}
                  disabled={!!id}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                >
                  <option value="">Choose exact account</option>
                  {options.data.accounts
                    .filter(
                      (a) =>
                        a.customer_id ===
                        options.data!.works.find((w) => w.id === work)
                          ?.customer_id,
                    )
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.fixture_key} · {a.currency} · {a.status}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Processing mode
                <select
                  aria-label="Processing mode"
                  value={mode}
                  disabled={!!id}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option>SyntheticManual</option>
                  <option>SyntheticApi</option>
                </select>
                <small>
                  SyntheticApi supports the bounded F-07 timeout simulator.
                </small>
              </label>
            </div>
            <section className={styles.panel}>
              <h2>Exact issued sources</h2>
              {sources.loading && (
                <p role="status">
                  Checking original report bytes and dependencies…
                </p>
              )}
              {sources.data?.items.length === 0 && (
                <p>No report sources exist for this work order.</p>
              )}
              {sources.data?.items.map((s) => (
                <div className={styles.source} key={s.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      disabled={!s.ready}
                      onChange={(e) => choose(s.id, e.target.checked)}
                    />
                    {s.display_number} · {s.status}
                  </label>
                  {s.ready ? (
                    <small>
                      Exact issued revision, technical review, declarations and
                      original bytes checked.
                    </small>
                  ) : (
                    <p className={styles.warning}>
                      {"blocker" in s ? s.blocker : "Source unavailable"}
                    </p>
                  )}
                </div>
              ))}
            </section>
            <h2>Source allocations</h2>
            <p>
              Each selected report must be fully allocated, including
              non-billable quantities. A shared target group requires the same
              unit and direction.
            </p>
            {lines.map((l, i) => {
              const e = entries.get(l.entry_id);
              return (
                <section
                  className={styles.allocation}
                  key={`${l.entry_id}-${i}`}
                >
                  <div className={styles.row}>
                    <h3>
                      Allocation {i + 1} · {e?.description ?? l.entry_id}
                    </h3>
                    <span className={styles.meta}>
                      Captured / reviewed: {e?.quantity ?? "Unknown"} {e?.uom}
                    </span>
                  </div>
                  {e?.direction === "Travel" && (
                    <p>
                      Travel stays separate from Labour. Select NonBillable and
                      explain the no-posting disposition. This does not define
                      staff pay or cost.
                    </p>
                  )}
                  <div className={styles.grid}>
                    <label>
                      Allocated quantity
                      <input
                        aria-label={`Allocated quantity ${i + 1}`}
                        value={l.quantity}
                        onChange={(e) => patch(i, { quantity: e.target.value })}
                        inputMode="decimal"
                        required
                      />
                    </label>
                    <label>
                      Disposition
                      <select
                        aria-label={`Disposition ${i + 1}`}
                        value={l.disposition}
                        onChange={(e) =>
                          patch(i, {
                            disposition: e.target.value,
                            target_group:
                              e.target.value === "Billable"
                                ? `TARGET-${i + 1}`
                                : null,
                          })
                        }
                      >
                        {(e?.direction === "Travel"
                          ? ["Pending", "NonBillable"]
                          : [
                              "Pending",
                              "Billable",
                              "NonBillable",
                              "WarrantyReview",
                              "GoodwillReview",
                            ]
                        ).map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    {l.disposition === "Billable" && (
                      <label>
                        Target group
                        <input
                          aria-label={`Target group ${i + 1}`}
                          value={l.target_group ?? ""}
                          onChange={(e) =>
                            patch(i, { target_group: e.target.value })
                          }
                          required
                        />
                      </label>
                    )}
                  </div>
                  <label>
                    Exact disposition reason
                    <textarea
                      aria-label={`Disposition reason ${i + 1}`}
                      value={l.reason}
                      onChange={(e) => patch(i, { reason: e.target.value })}
                      minLength={10}
                      required
                    />
                  </label>
                  <div className={styles.toolbar}>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setLines((v) => [
                          ...v,
                          {
                            ...l,
                            quantity: "0",
                            disposition: "Pending",
                            target_group: null,
                            reason: "",
                          },
                        ])
                      }
                    >
                      Add split allocation {i + 1}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        setLines((v) => v.filter((_, j) => i !== j))
                      }
                    >
                      Remove allocation {i + 1}
                    </button>
                  </div>
                </section>
              );
            })}
            <label>
              Finance treatment basis
              <textarea
                aria-label="Finance treatment basis"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                minLength={10}
                required
              />
            </label>
            <label>
              Remaining work and dependency basis
              <textarea
                aria-label="Remaining work and dependency basis"
                value={remaining}
                onChange={(e) => setRemaining(e.target.value)}
                minLength={10}
                required
              />
            </label>
            <label>
              Reason for this saved revision
              <textarea
                aria-label="Reason for this saved revision"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                minLength={10}
                required
              />
            </label>
            <p className={styles.notice}>
              No operational rates, tax, warranty decisions, price, payroll
              rounding or stock movements are inferred.
            </p>
            <button
              disabled={!selected.length || !lines.length || sources.loading}
            >
              {cmd.busy ? "Saving exact draft…" : "Save Finance draft"}
            </button>
          </fieldset>
        </form>
      )}
    </Frame>
  );
}
export function FinanceDetail({ id }: { id: string }) {
  const p = useIdentity(),
    r = useResource<Detail>(`finance/handoffs/${id}`),
    [editing, setEditing] = useState(false),
    [reason, setReason] = useState(""),
    [scenario, setScenario] = useState("Accepted"),
    [correction, setCorrection] = useState("Investigate"),
    cmd = useCommand(r.reload),
    d = r.data,
    h = d?.handoff,
    locked = cmd.busy || !!cmd.pending || r.loading;
  if (editing && d)
    return (
      <>
        <button
          className="secondary"
          onClick={() => {
            setEditing(false);
            r.reload();
          }}
        >
          Back to retained handoff
        </button>
        <FinanceForm
          id={id}
          initial={d}
          onSaved={() => {
            setEditing(false);
            r.reload();
          }}
        />
      </>
    );
  const act = (action: string, extra: Record<string, unknown> = {}) =>
    void cmd.send(`finance/handoffs/${id}/${action}`, {
      expected_version: h!.version,
      reason,
      ...extra,
    });
  return (
    <Frame
      title={h?.display_number ?? "Finance handoff"}
      subtitle="Original sources, approvals, operations and outcomes remain distinct and auditable."
    >
      <Link href="/finance/handoffs">← Finance queue</Link>
      <ErrorNotice error={r.error} />
      {cmd.notice}
      {r.loading && <p role="status">Loading exact Finance evidence…</p>}
      {d && h && (
        <>
          <div className={styles.row}>
            <p>
              {d.work.customer} · {d.work.site} · {d.work.reference}
            </p>
            <span className={styles.badge}>{stateLabel(h.status)}</span>
          </div>
          <p className={styles.meta}>
            {d.account.fixture_key} · {h.currency} · {h.mode} · record version{" "}
            {h.version}, factual Finance revision {h.revision}
          </p>
          {!d.readiness.ready && (
            <p className={styles.warning} role="status">
              {d.readiness.reason}
            </p>
          )}
          <div className={styles.toolbar}>
            <button className="secondary" onClick={r.reload}>
              Refresh exact evidence
            </button>
            {d.capabilities["finance.account.read"] && (
              <Link
                href={`/customers/${h.customer_id}/account?account_id=${h.account_id}`}
              >
                Account observations
              </Link>
            )}
          </div>
          <section className={styles.panel}>
            <h2>Next Finance action</h2>
            <fieldset disabled={locked}>
              <label>
                Precise action / correction reason
                <textarea
                  aria-label="Precise action / correction reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Record what was checked or exactly what needs correction."
                />
              </label>
              <div className={styles.toolbar}>
                {d.capabilities["finance.prepare"] &&
                  h.owner_id === p.actor_id &&
                  ["Draft", "Returned"].includes(h.status) && (
                    <button
                      className="secondary"
                      onClick={() => setEditing(true)}
                    >
                      Revise retained draft
                    </button>
                  )}
                {d.capabilities["finance.prepare"] && h.status === "Draft" && (
                  <button
                    disabled={reason.length < 10 || !d.readiness.ready}
                    onClick={() => act("submit")}
                  >
                    Submit for Finance review
                  </button>
                )}
                {d.capabilities["finance.prepare"] &&
                  ["Draft", "Returned", "ReadyForReview", "Approved"].includes(
                    h.status,
                  ) && (
                    <button
                      className="secondary"
                      disabled={reason.length < 10}
                      onClick={() => act("cancel")}
                    >
                      Cancel before effects
                    </button>
                  )}
                {d.capabilities["finance.review"] &&
                  ["ReadyForReview", "Approved"].includes(h.status) && (
                    <>
                      <button
                        disabled={
                          reason.length < 10 ||
                          !d.readiness.ready ||
                          h.status !== "ReadyForReview"
                        }
                        onClick={() =>
                          act("review", {
                            revision_id: h.current_revision_id,
                            source_hash: d.revisions[0].source_hash,
                            decision: "Approved",
                          })
                        }
                      >
                        Approve exact revision
                      </button>
                      <button
                        className="secondary"
                        disabled={reason.length < 10}
                        onClick={() =>
                          act("review", {
                            revision_id: h.current_revision_id,
                            source_hash: d.revisions[0].source_hash,
                            decision: "Returned",
                          })
                        }
                      >
                        Return with correction reason
                      </button>
                    </>
                  )}
                {d.capabilities["finance.process"] &&
                  h.status === "Approved" && (
                    <>
                      <label>
                        Synthetic outcome scenario
                        <select
                          aria-label="Synthetic outcome scenario"
                          value={scenario}
                          onChange={(e) => setScenario(e.target.value)}
                        >
                          {[
                            "Accepted",
                            "NotProcessed",
                            "Partial",
                            ...(h.mode === "SyntheticApi"
                              ? ["AcceptedThenTimeout"]
                              : []),
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        disabled={reason.length < 10 || !d.readiness.ready}
                        onClick={() => act("begin-processing", { scenario })}
                      >
                        Claim original processing action
                      </button>
                    </>
                  )}
                {d.capabilities["finance.process"] &&
                  ["AwaitingERP", "OutcomeUnknown"].includes(h.status) &&
                  h.processing_owner_id === p.actor_id && (
                    <>
                      {h.status === "AwaitingERP" && (
                        <button
                          disabled={reason.length < 10 || !d.readiness.ready}
                          onClick={() =>
                            act("record-outcome", {
                              attempt_id: h.active_attempt_id,
                              action: "Dispatch",
                            })
                          }
                        >
                          Execute synthetic action and record outcome
                        </button>
                      )}
                      <button
                        className="secondary"
                        disabled={reason.length < 10}
                        onClick={() =>
                          act("record-outcome", {
                            attempt_id: h.active_attempt_id,
                            action: "LookupOriginal",
                          })
                        }
                      >
                        Look up original operation
                      </button>
                    </>
                  )}
                {d.capabilities["finance.reconcile"] &&
                  h.status === "ReconciliationRequired" &&
                  d.outcomes[0] && (
                    <button
                      disabled={reason.length < 10 || !d.readiness.ready}
                      onClick={() =>
                        act("reconcile", {
                          outcome_id: d.outcomes[0].id,
                          basis: reason,
                        })
                      }
                    >
                      Reconcile exact source and target
                    </button>
                  )}
                {d.capabilities["finance.reconcile"] &&
                  [
                    "OutcomeUnknown",
                    "ReconciliationRequired",
                    "Reconciled",
                  ].includes(h.status) && (
                    <>
                      <label>
                        Linked correction decision
                        <select
                          aria-label="Linked correction decision"
                          value={correction}
                          onChange={(e) => setCorrection(e.target.value)}
                        >
                          {[
                            "Investigate",
                            "CorrectionRequested",
                            "ReversalRequested",
                          ].map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="secondary"
                        disabled={reason.length < 10}
                        onClick={() =>
                          act("request-correction", { disposition: correction })
                        }
                      >
                        Record linked correction request
                      </button>
                    </>
                  )}
                {d.capabilities["finance.issue"] &&
                  h.status === "Reconciled" &&
                  !d.jobs.length && (
                    <button
                      disabled={reason.length < 10 || !d.readiness.ready}
                      onClick={() =>
                        act("request-evidence", {
                          revision_id: h.current_revision_id,
                          review_id: d.reviews[0].id,
                          reconciliation_id: d.reconciliations[0].id,
                        })
                      }
                    >
                      Prepare OUT-14 evidence
                    </button>
                  )}
              </div>
            </fieldset>
            {h.status === "OutcomeUnknown" && (
              <p className={styles.warning}>
                A target may exist. Retain the original attempt and use lookup.
                A timeout does not authorise another action.
              </p>
            )}
          </section>
          <section className={styles.panel}>
            <h2>Exact allocation evidence</h2>
            <p>{d.revisions[0].treatment_basis}</p>
            <p>{d.revisions[0].remaining_work_basis}</p>
            <div
              className={styles.table}
              tabIndex={0}
              aria-label="Allocation table, scroll horizontally when needed"
            >
              <table>
                <thead>
                  <tr>
                    <th>Source / version</th>
                    <th>Captured</th>
                    <th>Reviewed</th>
                    <th>Allocated</th>
                    <th>Billable</th>
                    <th>Unit / direction</th>
                    <th>Disposition</th>
                  </tr>
                </thead>
                <tbody>
                  {d.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        {l.entry_id}
                        <small>v{l.entry_version}</small>
                      </td>
                      <td>{l.captured_quantity}</td>
                      <td>{l.reviewed_quantity}</td>
                      <td>{l.allocated_quantity}</td>
                      <td>{l.billable_quantity ?? "Unknown"}</td>
                      <td>
                        {l.uom} / {l.direction}
                      </td>
                      <td>
                        {l.disposition}
                        <small>{l.reason}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className={styles.panel}>
            <h2>Recorded outcomes and target evidence</h2>
            {!d.outcomes.length && (
              <p>No outcome recorded. A claim does not prove processing.</p>
            )}
            {d.outcomes.map((o) => (
              <details key={o.id} open>
                <summary>
                  {o.outcome} · {date(o.observed_at)}
                </summary>
                <pre>{JSON.stringify(o.evidence, null, 2)}</pre>
              </details>
            ))}
            {d.reconciliations.map((x) => (
              <p key={x.id}>Reconciled: {x.basis}</p>
            ))}
            {d.corrections.map((x) => (
              <p key={x.id}>
                {x.disposition}: {x.reason}
              </p>
            ))}
          </section>
          <section className={styles.panel}>
            <h2>OUT-14 original evidence</h2>
            <p>
              Current Finance audience only. Customer distribution is disabled.
            </p>
            {d.jobs.map((j) => (
              <div key={j.id}>
                <p>
                  {j.state} · attempt {j.attempts} / 5
                  {j.error_code ? ` · ${j.error_code}` : ""}
                </p>
                {d.capabilities["finance.issue"] &&
                  !["Issued", "StaleSource"].includes(j.state) && (
                    <button
                      className="secondary"
                      disabled={locked}
                      onClick={() =>
                        void api(`finance/jobs/${j.id}/retry`, {}).then(
                          r.reload,
                          r.reload,
                        )
                      }
                    >
                      Recover original output operation
                    </button>
                  )}
              </div>
            ))}
            {d.issues.map((i) => (
              <p key={i.id}>
                <a
                  href={`/api/v1/finance/issues/${i.id}/bytes?format=pdf`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open original PDF
                </a>
                {" · "}
                <a
                  href={`/api/v1/finance/issues/${i.id}/bytes?format=html`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Original HTML
                </a>
                <small className={styles.meta}>
                  Issued {date(i.issued_at)} · SHA-256 {i.output_hash}
                </small>
              </p>
            ))}
          </section>
          <details className={styles.panel}>
            <summary>Retained review and transition history</summary>
            {d.reviews.map((v) => (
              <p key={v.id}>
                {v.decision}: {v.reason}
              </p>
            ))}
            {d.events.map((e) => (
              <p key={e.id}>
                {date(e.occurred_at)} · {stateLabel(e.status)} · {e.reason}
              </p>
            ))}
          </details>
        </>
      )}
    </Frame>
  );
}
export function AccountScreen({
  customerId,
  accountId,
}: {
  customerId: string;
  accountId: string;
}) {
  const r = useResource<Awaited<ReturnType<typeof readAccount>>>(
      `customers/${customerId}/account-observations?account_id=${accountId}`,
    ),
    [fixture, setFixture] = useState("F-01"),
    [invoiceOnly, setInvoiceOnly] = useState(false),
    cmd = useCommand(r.reload),
    d = r.data;
  return (
    <Frame
      title="Customer account observations"
      subtitle="Exact synthetic source context and extraction history. Missing values remain unavailable."
    >
      <Link href="/finance/handoffs">← Finance queue</Link>
      <ErrorNotice error={r.error} />
      {cmd.notice}
      {d?.context_error && <p className={styles.warning}>{d.context_error}</p>}
      {r.loading && (
        <p role="status">Loading permitted account observations…</p>
      )}
      {d && (
        <>
          <p>
            {d.account.status} · {d.account.currency} · legal company{" "}
            {d.account.company_id}
          </p>
          <div className={styles.toolbar}>
            <label>
              Independent fixture
              <select
                aria-label="Independent fixture"
                value={fixture}
                onChange={(e) => setFixture(e.target.value)}
              >
                {["F-01", "F-02", "F-03", "F-04", "F-05", "Failed"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              disabled={cmd.busy || !!cmd.pending || r.loading || !!r.error}
              onClick={() =>
                void cmd.send(`finance/accounts/${accountId}/observe`, {
                  expected_version: d.account.version,
                  fixture,
                  reason: `Inspect independently specified synthetic account fixture ${fixture}.`,
                })
              }
            >
              Record synthetic extraction
            </button>
            <button className="secondary" onClick={r.reload}>
              Refresh observations
            </button>
          </div>
          <div className={styles.metrics}>
            <div>
              <span>Supplied account balance</span>
              <strong>
                {r.loading || r.error || d.account_balance === null
                  ? "Unavailable"
                  : `${d.account.currency} ${d.account_balance}`}
              </strong>
              <small>
                {r.error
                  ? "Refresh failed — current total unavailable"
                  : r.loading
                    ? "Refreshing exact source observation"
                    : d.balance_status}
              </small>
            </div>
            <div>
              <span>Separate unapplied cash</span>
              <strong>
                {r.loading || r.error || d.unapplied_cash === null
                  ? "Unknown"
                  : `${d.account.currency} ${d.unapplied_cash}`}
              </strong>
              <small>Never netted against invoices</small>
            </div>
            <div>
              <span>Committed cost</span>
              <strong>Not defined</strong>
              <small>Not comparable</small>
            </div>
          </div>
          {d.current ? (
            <>
              <div className={styles.notice}>
                <p>
                  {d.current.completeness === "Partial"
                    ? "Incomplete extraction"
                    : d.current.completeness}{" "}
                  · source as at {date(d.current.source_as_at)} · observed{" "}
                  {date(d.current.observed_at)}
                </p>
                <p>
                  Pages {d.current.received_pages} / {d.current.expected_pages};
                  records {d.current.received_count} /{" "}
                  {d.current.expected_count}; cutoff {date(d.current.cutoff)}
                </p>
                <p>{d.current.basis}</p>
              </div>
              <div
                className={styles.table}
                tabIndex={0}
                aria-label="Account transaction table"
              >
                <label>
                  <input
                    type="checkbox"
                    checked={invoiceOnly}
                    onChange={(e) => setInvoiceOnly(e.target.checked)}
                  />
                  Show invoice rows only
                </label>
                <p className={styles.meta}>
                  Visible rows are a display filter. The account total comes
                  from the declared complete source extraction. Scroll this
                  table horizontally to view all source fields on a narrow
                  screen.
                </p>
                <table>
                  <thead>
                    <tr>
                      <th>Source identity / type</th>
                      <th>Original amount</th>
                      <th>Source remaining</th>
                      <th>Status / reversal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.current.observations
                      .filter(
                        (o: { type: string }) =>
                          !invoiceOnly || o.type === "SyntheticInvoice",
                      )
                      .map(
                        (o: {
                          id: string;
                          type: string;
                          original_amount: string;
                          remaining_amount: string | null;
                          status: string;
                          reverses?: string;
                        }) => (
                          <tr key={o.id}>
                            <td>
                              {o.id}
                              <small>{o.type}</small>
                            </td>
                            <td>{o.original_amount}</td>
                            <td>{o.remaining_amount ?? "Unavailable"}</td>
                            <td>
                              {o.status}
                              {o.reverses && (
                                <small>Reverses {o.reverses}</small>
                              )}
                            </td>
                          </tr>
                        ),
                      )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              No extraction recorded. Account total unavailable.
            </div>
          )}
          {(r.error ||
            d.context_error ||
            d.current?.completeness !== "Complete") &&
            d.last_good && (
              <p className={styles.warning}>
                Last good observation: {d.last_good.source_balance}{" "}
                {d.account.currency}, as at {date(d.last_good.source_as_at)}.
                This is historical; the current total is unavailable.
              </p>
            )}
          <details className={styles.panel}>
            <summary>Extraction scope and retained history</summary>
            <pre>
              {JSON.stringify(d.current?.extraction_scope ?? {}, null, 2)}
            </pre>
            {d.history.map((x) => (
              <p key={x.id}>
                {x.fixture} · {x.completeness} · {date(x.observed_at)} · source
                remaining {x.source_balance ?? "Unavailable"}
              </p>
            ))}
          </details>
        </>
      )}
    </Frame>
  );
}
