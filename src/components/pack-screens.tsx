"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  useResource,
  useCommand,
  ErrorNotice,
  type Envelope,
  Stamp,
} from "./business-ui";
import { useIdentity } from "./business-session";
import {
  sectionKeys,
  sectionLabels,
  type PackInput,
} from "../documents/validation";
import type { PackSnapshot } from "../documents/render";
// Render-only imports above are erased. No server module or document bytes are bundled into the client.
type Source = {
  id: string;
  title: string;
  available: boolean;
  content_hash: string;
  version_id: string;
};
type History = { id: string; kind: string; summary: string };
type Revision = {
  id: string;
  revision: number;
  input: PackInput;
  snapshot: PackSnapshot;
  content_hash: string;
  change_reason: string;
};
type Issue = {
  id: string;
  revision: number;
  issued_at: string;
  output_hash: string;
  manifest: {
    filename: string;
    pdf_bytes: number;
    pdf_hash: string;
    html_hash: string;
    renderer_version: string;
    browser_version: string;
  };
};
type Pack = {
  id: string;
  display_number: string;
  appointment_id: string;
  appointment_reference?: string;
  version: number;
  status: string;
  needs_review: boolean;
  current_issue_id: string | null;
  current_revision_id: string;
  revisions: Revision[];
  issues: Issue[];
  checks: {
    id: string;
    decision: string;
    reason: string;
    checked_at: string;
  }[];
  events: {
    id: string;
    issue_id: string;
    kind: string;
    reason: string;
    occurred_at: string;
  }[];
  jobs: {
    id: string;
    revision_id: string;
    state: string;
    attempts: number;
    error_code: string | null;
    recovery_owner_id: string;
    issue_id: string | null;
  }[];
  sources: Source[];
  history: History[];
  distribution: {
    id: string;
    recipient_id: string;
    display_name: string;
    kind: string;
    occurred_at: string;
  }[];
  readiness: {
    dispatch_hold: boolean;
    component_ready: boolean;
    actual_start_implemented: false;
    reasons: string[];
    recipients: {
      id: string;
      user_id: string;
      display_name: string;
      assignment_id: string;
      assignment_version: number;
      acknowledged_at: string | null;
    }[];
  };
  actions: {
    can_prepare: boolean;
    can_check: boolean;
    can_issue: boolean;
    can_acknowledge: boolean;
  };
};
const empty = () =>
  Object.fromEntries(sectionKeys.map((k) => [k, ""])) as PackInput["sections"];
function Intro({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <>
      <p className="eyebrow">SERVICE OPERATIONS · SYNTHETIC PROTOTYPE</p>
      <h1>{title}</h1>
      <p>Synthetic prototype — not for operational use</p>
      {children}
    </>
  );
}
function PreparationForm({
  appointment,
  pack,
  sources,
  history,
  onSaved,
}: {
  appointment?: { id: string; version: number };
  pack?: Pack;
  sources: Source[];
  history: History[];
  onSaved: (id: string) => void;
}) {
  const current = pack?.revisions[0];
  const [sections, setSections] = useState<PackInput["sections"]>(
      current?.input.sections ?? empty(),
    ),
    [sourceIds, setSourceIds] = useState<string[]>(
      current?.input.source_ids ?? [],
    ),
    [historyIds, setHistoryIds] = useState<string[]>(
      current?.input.history_ids ?? [],
    ),
    [reason, setReason] = useState(""),
    [id] = useState(() => crypto.randomUUID());
  const command = useCommand();
  return (
    <form
      className="pack-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await command.send<{ record_id: string }>(
          pack ? `packs/${pack.id}/amend` : "packs",
          {
            ...(pack
              ? { expected_version: pack.version }
              : {
                  id,
                  appointment_id: appointment!.id,
                  expected_appointment_version: appointment!.version,
                }),
            reason,
            content: {
              sections,
              source_ids: sourceIds,
              history_ids: historyIds,
            },
          },
        );
        if (result) onSaved(result.record_id);
      }}
    >
      <h2>
        {pack ? "Prepare successor revision" : "Prepare nine-section job pack"}
      </h2>
      <p>
        Each section includes server-derived authorised context. Add reviewed
        preparation notes, explicit limits or a reason where no additional
        information applies. These notes cannot extend authorised scope.
      </p>
      <fieldset disabled={command.busy}>
        <legend>Exact technical sources</legend>
        {sources.map((s) => (
          <label className="pack-choice" key={s.id}>
            <input
              type="checkbox"
              checked={sourceIds.includes(s.id)}
              disabled={!s.available}
              onChange={(e) =>
                setSourceIds((x) =>
                  e.target.checked ? [...x, s.id] : x.filter((v) => v !== s.id),
                )
              }
            />
            <span>
              {s.title}
              <small>
                {s.available
                  ? "Available exact version"
                  : "Unavailable — recover original source"}
              </small>
            </span>
          </label>
        ))}
      </fieldset>
      <fieldset disabled={command.busy}>
        <legend>Relevant service history</legend>
        {history.length ? (
          history.map((h) => (
            <label className="pack-choice" key={h.id}>
              <input
                type="checkbox"
                checked={historyIds.includes(h.id)}
                onChange={(e) =>
                  setHistoryIds((x) =>
                    e.target.checked
                      ? [...x, h.id]
                      : x.filter((v) => v !== h.id),
                  )
                }
              />
              <span>
                {h.kind}: {h.summary}
              </span>
            </label>
          ))
        ) : (
          <p>No permitted service history is available for selection.</p>
        )}
      </fieldset>
      {sectionKeys.map((k, i) => (
        <label className="pack-field" key={k} htmlFor={`section-${k}`}>
          <strong>
            {i + 1}. {sectionLabels[i]}
          </strong>
          <textarea
            id={`section-${k}`}
            required
            maxLength={6000}
            rows={3}
            value={sections[k]}
            disabled={command.busy}
            onChange={(e) =>
              setSections((x) => ({ ...x, [k]: e.target.value }))
            }
          />
        </label>
      ))}
      <label className="pack-field" htmlFor="pack-change-reason">
        Preparation / change reason
        <textarea
          id="pack-change-reason"
          required
          maxLength={2000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={command.busy}
        />
      </label>
      <ErrorNotice error={command.error} />
      <p role="status">
        {command.busy ? "Saving preparation…" : command.saved}
      </p>
      <button disabled={command.busy}>
        {pack ? "Save successor and hold dispatch" : "Save preparation"}
      </button>
    </form>
  );
}
export function PackListScreen() {
  const r = useResource<Envelope<Pack>>("packs");
  return (
    <div className="business-page">
      <Intro title="Job packs">
        <p>
          Prepare and check work instructions, issue exact documents, and follow
          each crew member’s acknowledgement.
        </p>
        <Link href="/schedule">Open service planner</Link>
      </Intro>
      <ErrorNotice error={r.error} />
      {r.loading ? (
        <p role="status">Loading job packs…</p>
      ) : r.data?.items.length ? (
        <div className="pack-list">
          {r.data.items.map((p) => (
            <article key={p.id}>
              <h2>
                <Link href={`/service/packs/${p.id}`}>{p.display_number}</Link>
              </h2>
              <p>
                {p.status} ·{" "}
                {p.needs_review ? "Preparation or review required" : "Issued"}
              </p>
              <Link href={`/service/appointments/${p.appointment_id}`}>
                {p.appointment_reference ?? "Appointment"}
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <p>
          No job packs are available to this identity. Open a confirmed
          appointment in the planner to prepare one.
        </p>
      )}
    </div>
  );
}
export function NewPackScreen({ appointmentId }: { appointmentId: string }) {
  const router = useRouter(),
    r = useResource<{
      appointment: { id: string; version: number; display_number: string };
      work_order_reference: string;
      sources: Source[];
      history: History[];
    }>(`appointments/${appointmentId}/pack-options`);
  return (
    <div className="business-page">
      <Intro title="Prepare job pack">
        <Link href={`/service/appointments/${appointmentId}`}>
          Back to appointment
        </Link>
      </Intro>
      <ErrorNotice error={r.error} />
      {r.data && (
        <>
          <p>
            {r.data.work_order_reference} · {r.data.appointment.display_number}
          </p>
          <PreparationForm
            appointment={r.data.appointment}
            sources={r.data.sources}
            history={r.data.history}
            onSaved={(id) => router.push(`/service/packs/${id}`)}
          />
        </>
      )}
      {r.loading && <p>Loading preparation context…</p>}
    </div>
  );
}
export function PackScreen({ id }: { id: string }) {
  const r = useResource<Envelope<Pack>>(`packs/${id}`),
    command = useCommand(),
    identity = useIdentity();
  const [reason, setReason] = useState(""),
    [editing, setEditing] = useState(false),
    [working, setWorking] = useState(false),
    [error, setError] = useState<unknown>(null);
  const acknowledgement = useRef<{ key: string; captured_at: string } | null>(
    null,
  );
  const p = r.data?.items[0],
    revision = p?.revisions.find((x) => x.id === p.current_revision_id),
    issue = p?.issues.find((x) => x.id === p.current_issue_id),
    mine = p?.readiness.recipients.find((x) => x.user_id === identity.actor_id);
  async function decide(action: string, extra: Record<string, unknown> = {}) {
    if (!p) return;
    const result = await command.send(`packs/${id}/${action}`, {
      expected_version: p.version,
      reason,
      ...extra,
    });
    if (result) {
      setEditing(false);
      r.reload();
    }
  }
  async function processJob(jobId: string) {
    setWorking(true);
    setError(null);
    try {
      await api(`render-jobs/${jobId}/retry`, {});
      r.reload();
    } catch (e) {
      setError(e);
    } finally {
      setWorking(false);
    }
  }
  const busy = working || command.busy || r.loading;
  return (
    <div className="business-page">
      <Intro title={p?.display_number ?? "Job pack"}>
        <Link href="/service/packs">All job packs</Link>
      </Intro>
      <ErrorNotice error={r.error ?? error} />
      {p && (
        <>
          <div
            className={`pack-status ${p.readiness.dispatch_hold ? "held" : "ready"}`}
          >
            <strong>
              {p.readiness.dispatch_hold
                ? "Dispatch held"
                : "P06 dispatch component ready"}
            </strong>
            <p>
              {p.status} ·{" "}
              {revision
                ? `Preparation r${String(revision.revision).padStart(2, "0")}`
                : "No visible preparation"}{" "}
              · Pack version {p.version}
            </p>
            {p.readiness.reasons.length > 0 && (
              <ul>
                {p.readiness.reasons.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            )}
            <p>
              Actual start and field capture are P07 dependencies and are not
              implemented.
            </p>
          </div>
          <div className="pack-toolbar">
            <Link
              className="button secondary"
              href={`/service/appointments/${p.appointment_id}`}
            >
              Appointment
            </Link>
            {revision && (p.actions.can_prepare || p.actions.can_check) && (
              <a
                className="button secondary"
                href={`/api/v1/packs/${id}/preview?revision_id=${revision.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Open preparation preview
              </a>
            )}
            {issue && (
              <Link className="button" href={`/documents/${issue.id}`}>
                Open exact issued document
              </Link>
            )}
          </div>
          {p.actions.can_prepare && (
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setEditing((x) => !x)}
            >
              {editing
                ? "Close preparation form"
                : "Prepare successor revision"}
            </button>
          )}
          {editing && (
            <PreparationForm
              key={p.version}
              pack={p}
              sources={p.sources}
              history={p.history}
              onSaved={() => {
                setEditing(false);
                r.reload();
              }}
            />
          )}
          {(p.actions.can_check || p.actions.can_issue) && (
            <section className="pack-panel">
              <h2>Review and controlled issue</h2>
              <label className="pack-field" htmlFor="decision-reason">
                Decision / change reason
                <textarea
                  id="decision-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                />
              </label>
              <div className="pack-toolbar">
                {p.actions.can_check &&
                  ["Draft", "Returned"].includes(p.status) && (
                    <>
                      <button
                        disabled={busy || !reason.trim()}
                        onClick={() => decide("check", { decision: "Checked" })}
                      >
                        Check this revision
                      </button>
                      <button
                        className="secondary"
                        disabled={busy || !reason.trim()}
                        onClick={() =>
                          decide("check", { decision: "Returned" })
                        }
                      >
                        Return preparation
                      </button>
                    </>
                  )}
                {p.actions.can_issue && p.status === "Checked" && (
                  <button
                    disabled={busy || !reason.trim()}
                    onClick={() => decide("issue")}
                  >
                    Queue exact output for issue
                  </button>
                )}
                {p.actions.can_issue && issue && p.status !== "Withdrawn" && (
                  <button
                    className="secondary"
                    disabled={busy || !reason.trim()}
                    onClick={() => decide("withdraw")}
                  >
                    Withdraw current issue
                  </button>
                )}
              </div>
              <ErrorNotice error={command.error} />
              <p role="status">
                {command.busy ? "Saving controlled decision…" : command.saved}
              </p>
              <p>
                Queued output is not issued. The worker verifies durable bytes
                and current authority before committing an issue.
              </p>
            </section>
          )}
          {p.jobs.length > 0 && (
            <section className="pack-panel">
              <h2>Output preparation and recovery</h2>
              {p.jobs.map((j) => (
                <article key={j.id}>
                  <strong>{j.state}</strong>
                  <p>
                    {j.attempts} attempt(s)
                    {j.error_code ? ` · ${j.error_code}` : ""}
                  </p>
                  <p className="pack-hash">
                    Recovery owner: {j.recovery_owner_id}
                  </p>
                  {p.actions.can_issue &&
                    !["Issued", "StaleSource"].includes(j.state) && (
                      <button disabled={busy} onClick={() => processJob(j.id)}>
                        {working
                          ? "Processing original output…"
                          : "Process or recover original output"}
                      </button>
                    )}
                  {p.actions.can_issue && j.attempts > 0 && (
                    <p>
                      <a
                        href={`/api/v1/render-jobs/${j.id}/html`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Inspect retained generated attempt
                      </a>{" "}
                      ·{" "}
                      <a href={`/api/v1/render-jobs/${j.id}/pdf`}>
                        Download retained attempt
                      </a>{" "}
                      (availability verified on retrieval)
                    </p>
                  )}
                  {j.state === "StaleSource" && (
                    <p>
                      Original attempt retained. Prepare and check a new
                      revision with current sources.
                    </p>
                  )}
                </article>
              ))}
            </section>
          )}
          <section className="pack-panel">
            <h2>Individual crew acknowledgements</h2>
            {p.readiness.recipients.length ? (
              <ul>
                {p.readiness.recipients.map((x) => (
                  <li key={x.id}>
                    {x.display_name}:{" "}
                    {x.acknowledged_at ? (
                      <>
                        Acknowledged <Stamp value={x.acknowledged_at} />
                      </>
                    ) : (
                      "Awaiting explicit response"
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Recipient tasks are created only after a durable issue.</p>
            )}
            {p.actions.can_acknowledge &&
              issue &&
              mine &&
              !mine.acknowledged_at &&
              !p.needs_review && (
                <>
                  <p>
                    Open the exact issued document first. Your response applies
                    only to this issue and your own assignment; it does not
                    record attendance.
                  </p>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      const key = `${issue.id}/${mine.assignment_id}/${identity.actor_id}`;
                      if (acknowledgement.current?.key !== key)
                        acknowledgement.current = {
                          key,
                          captured_at: new Date().toISOString(),
                        };
                      const result = await command.send(
                        `pack-issues/${issue.id}/acknowledge`,
                        {
                          reason:
                            "Explicit acknowledgement of the exact synthetic issue",
                          assignment_id: mine.assignment_id,
                          assignment_version: mine.assignment_version,
                          presented_hash: issue.output_hash,
                          captured_at: acknowledgement.current.captured_at,
                        },
                      );
                      if (result) {
                        acknowledgement.current = null;
                        r.reload();
                      }
                    }}
                  >
                    Acknowledge this exact issue as {identity.display_name}
                  </button>
                  <ErrorNotice error={command.error} />
                </>
              )}
          </section>
          <section className="pack-panel">
            <h2>Distribution facts</h2>
            <p>
              In-app tasks, simulated sending and retrieval are separate from
              explicit acknowledgement. No message is sent.
            </p>
            {p.distribution.map((d) => (
              <p key={d.id}>
                {d.display_name}: {d.kind} · <Stamp value={d.occurred_at} />
              </p>
            ))}
            {p.actions.can_issue &&
              issue &&
              p.readiness.recipients.map((recipient) => (
                <button
                  className="secondary"
                  key={recipient.id}
                  disabled={busy || !reason.trim()}
                  onClick={async () => {
                    const result = await command.send(
                      `pack-issues/${issue.id}/distribution`,
                      {
                        reason,
                        recipient_id: recipient.id,
                        kind: "SimulatedSent",
                        evidence: reason,
                      },
                    );
                    if (result) r.reload();
                  }}
                >
                  Record simulated sending to {recipient.display_name}
                </button>
              ))}
          </section>
          <section className="pack-panel">
            <h2>Revision and issue history</h2>
            {p.issues.map((i) => (
              <p key={i.id}>
                <Link href={`/documents/${i.id}`}>
                  r{String(i.revision).padStart(2, "0")} · {i.manifest.filename}
                </Link>{" "}
                · issued <Stamp value={i.issued_at} />
              </p>
            ))}
            {p.events.map((e) => (
              <p key={e.id}>
                <strong>{e.kind}</strong> · {e.reason} ·{" "}
                <Stamp value={e.occurred_at} />
              </p>
            ))}
            {p.checks.map((c) => (
              <p key={c.id}>
                {c.decision}: {c.reason} · <Stamp value={c.checked_at} />
              </p>
            ))}
          </section>
        </>
      )}
      {r.loading && !p && <p role="status">Loading job pack…</p>}
    </div>
  );
}
export function DocumentScreen({ id }: { id: string }) {
  const status = useResource<{
    pack_id: string;
    status: string;
    applicable: boolean;
    issued_at: string;
    as_at: string;
  }>(`pack-issues/${id}`);
  const r = useResource<
    Issue["manifest"] & {
      template: { version: number; hash: string };
      sources: {
        id: string;
        title: string;
        version_id: string;
        hash: string;
      }[];
    }
  >(`pack-issues/${id}/manifest`);
  return (
    <div className="business-page">
      <Intro title="Exact issued job pack">
        <Link href="/service/packs">Back to job packs</Link>
      </Intro>
      <ErrorNotice error={r.error} />
      {r.data && (
        <>
          <h2>{r.data.filename}</h2>
          <ErrorNotice error={status.error} />
          {status.data && (
            <p role="status">
              <strong>
                {status.data.applicable
                  ? "Current applicable issue"
                  : "Not currently applicable"}
              </strong>{" "}
              · {status.data.status} · issued{" "}
              <Stamp value={status.data.issued_at} /> · checked as at{" "}
              <Stamp value={status.data.as_at} />.{" "}
              <Link href={`/service/packs/${status.data.pack_id}`}>
                Open current pack status
              </Link>
            </p>
          )}
          <div className="pack-toolbar">
            <a
              className="button"
              href={`/api/v1/pack-issues/${id}/html`}
              target="_blank"
              rel="noreferrer"
            >
              Open accessible HTML
            </a>
            <a
              className="button secondary"
              href={`/api/v1/pack-issues/${id}/pdf`}
            >
              Download exact A4 PDF
            </a>
          </div>
          <p>
            The file retains its original bytes. Check the job pack for current
            applicability, withdrawal and acknowledgement status.
          </p>
          <p>
            PDF tagging is requested; PDF/UA conformance and screen-reader
            behaviour are not verified.
          </p>
          <dl className="pack-manifest">
            <dt>PDF bytes</dt>
            <dd>{r.data.pdf_bytes}</dd>
            <dt>PDF SHA-256</dt>
            <dd>{r.data.pdf_hash}</dd>
            <dt>HTML SHA-256</dt>
            <dd>{r.data.html_hash}</dd>
            <dt>Renderer</dt>
            <dd>
              {r.data.renderer_version} · Chromium {r.data.browser_version}
            </dd>
            <dt>Template version</dt>
            <dd>
              {r.data.template.version} · {r.data.template.hash}
            </dd>
          </dl>
          <h2>Exact technical source manifest</h2>
          {r.data.sources.map((s) => (
            <article key={s.id}>
              <h3>{s.title}</h3>
              <p className="pack-hash">
                {s.id}
                <br />
                {s.version_id}
                <br />
                {s.hash}
              </p>
            </article>
          ))}
        </>
      )}
      {r.loading && <p>Loading exact manifest…</p>}
    </div>
  );
}
