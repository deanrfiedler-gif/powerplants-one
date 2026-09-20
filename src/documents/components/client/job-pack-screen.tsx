"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  api,
  useResource,
  useCommand,
  ErrorNotice,
  ReadState,
  isDenied,
  type Envelope,
} from "../../../components/business-ui";
import { useIdentity } from "../../../components/business-session";
import { PreparationForm } from "../../../components/pack-screens";
import { sectionKeys, type SectionKey } from "../../validation";
import {
  driftSources,
  formatDate,
  formatStamp,
  packTimeline,
  readinessSummary,
  revisionLabel,
  statusPresentation,
  zoneLabel,
} from "../../pack-view";
import type {
  Pack,
  PackIssue,
  PackRecipient,
  PackRevision,
} from "./job-pack-types";
import {
  Badge,
  Icon,
  KeyRow,
  PackDialog,
  Person,
  type IconName,
} from "./job-pack-ui";
import {
  ContentsRail,
  PackSections,
  sectionSources,
} from "./job-pack-sections";
import {
  CrewCard,
  OutputCard,
  ReadinessCard,
  RecordCard,
} from "./job-pack-rail";

type View = "pack" | "prepare" | "revisions";
type Decision =
  | { kind: "check"; decision: "Checked" | "Returned" }
  | { kind: "issue" }
  | { kind: "withdraw" }
  | { kind: "send"; recipient: PackRecipient };
type Command = ReturnType<typeof useCommand>;

// Every controlled decision records its own reason at the moment it is made; the page holds no standing reason field.
function DecisionDialog({
  pack,
  revision,
  issue,
  decision,
  command,
  onDone,
  onClose,
}: {
  pack: Pack;
  revision?: PackRevision;
  issue?: PackIssue;
  decision: Decision;
  command: Command;
  onDone: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState(""),
    [missing, setMissing] = useState(false);
  const label = revision ? revisionLabel(revision.revision) : "this revision",
    copy =
      decision.kind === "check" && decision.decision === "Checked"
        ? {
            title: `Check revision ${label}`,
            body: "Checking freezes this exact preparation revision. The server first recomputes the source snapshot and refuses if the scope, crew, appointment or a selected source has changed since it was saved.",
            confirm: "Record check",
            path: `packs/${pack.id}/check`,
            fields: { expected_version: pack.version, decision: "Checked" },
          }
        : decision.kind === "check"
          ? {
              title: `Return preparation ${label}`,
              body: "The preparation returns to the coordinator. Your comments are retained with this revision.",
              confirm: "Record return",
              path: `packs/${pack.id}/check`,
              fields: { expected_version: pack.version, decision: "Returned" },
            }
          : decision.kind === "issue"
            ? {
                title: `Queue exact output for ${label}`,
                body: "This queues the exact output. A queued or generated output is not an issue: the worker verifies durable bytes and current authority before an issue is committed.",
                confirm: "Queue output",
                path: `packs/${pack.id}/issue`,
                fields: { expected_version: pack.version },
              }
            : decision.kind === "withdraw"
              ? {
                  title: `Withdraw the current issue${issue ? ` ${revisionLabel(issue.revision)}` : ""}`,
                  body: "Dispatch is held immediately and an owned contact task is created. The original issued bytes and every recorded response are retained.",
                  confirm: "Withdraw issue",
                  path: `packs/${pack.id}/withdraw`,
                  fields: { expected_version: pack.version },
                }
              : {
                  title: "Record simulated sending",
                  body: `Records a distribution fact for ${decision.recipient.display_name}. No message is sent, and this is not an acknowledgement.`,
                  confirm: "Record sending",
                  path: `pack-issues/${issue?.id}/distribution`,
                  fields: {
                    recipient_id: decision.recipient.id,
                    kind: "SimulatedSent",
                  },
                };
  async function confirm() {
    const text = reason.trim();
    setMissing(!text);
    if (!text) return;
    // The same fields on a retry keep the original operation identity, so an uncertain response is replayed, not repeated.
    const result = await command.send(copy.path, {
      ...copy.fields,
      reason: text,
      ...(decision.kind === "send" ? { evidence: text } : {}),
    });
    if (result) onDone();
  }
  return (
    <PackDialog
      title={copy.title}
      subtitle={`${pack.display_number} · record version ${pack.version}`}
      onClose={onClose}
      busy={command.busy}
      actions={
        <button
          type="button"
          className="jp-primary"
          data-primary
          disabled={command.busy}
          onClick={confirm}
        >
          {command.busy ? "Saving controlled decision…" : copy.confirm}
        </button>
      }
    >
      <p>{copy.body}</p>
      {/* The message is a sibling of the label, not inside it, so it never becomes part of the field's name. */}
      <div className="jp-field">
        <label htmlFor="jp-decision-reason">Decision / change reason</label>
        <textarea
          id="jp-decision-reason"
          rows={3}
          maxLength={2000}
          data-autofocus
          value={reason}
          disabled={command.busy}
          aria-invalid={missing || undefined}
          aria-describedby={missing ? "jp-decision-reason-error" : undefined}
          onChange={(e) => {
            setReason(e.target.value);
            setMissing(false);
          }}
        />
        {missing && (
          <span
            id="jp-decision-reason-error"
            className="jp-field-error"
            role="alert"
          >
            Enter the reason for this decision.
          </span>
        )}
      </div>
      <ErrorNotice error={command.error} />
    </PackDialog>
  );
}

// What the page says happens next. Read from the server state; it grants and implies nothing.
function nextStep(
  pack: Pack,
  issue: PackIssue | undefined,
  jobState: string | undefined,
  mine: PackRecipient | undefined,
): {
  tone: "" | "info" | "complete";
  icon: IconName;
  title: string;
  text: string;
} {
  const staff =
      pack.actions.can_prepare ||
      pack.actions.can_check ||
      pack.actions.can_issue,
    warning = (title: string, text: string) => ({
      tone: "" as const,
      icon: "warning" as const,
      title,
      text,
    }),
    info = (title: string, text: string) => ({
      tone: "info" as const,
      icon: "info" as const,
      title,
      text,
    });
  if (!staff)
    return !issue
      ? info(
          "No current issue for your assignment",
          "The pack appears here once it has been issued to you.",
        )
      : // A recipient still holds the withdrawn or superseded file, so the page must say plainly that it no longer applies.
        pack.status === "Withdrawn"
        ? warning(
            "This issue has been withdrawn",
            "Do not rely on it. A successor must be issued to you and acknowledged before you attend.",
          )
        : pack.needs_review
          ? warning(
              "This issue is under review",
              "The crew, schedule or scope changed after it was issued. Wait for the successor and acknowledge that.",
            )
          : mine && !mine.acknowledged_at
            ? warning(
                "Your acknowledgement is required",
                "Open the exact issued document, then record your own response in Crew acknowledgement.",
              )
            : info(
                `Issued ${revisionLabel(issue.revision)}`,
                "Check this page for current applicability before attending.",
              );
  if (pack.status === "Withdrawn")
    return warning(
      "Issue withdrawn",
      "Prepare, check and issue a successor before dispatch. The original issued bytes are retained.",
    );
  if (pack.status === "Issued")
    return pack.needs_review
      ? warning(
          "Review required",
          "The crew, schedule or scope changed after this issue. Prepare a successor revision.",
        )
      : pack.readiness.dispatch_hold
        ? warning(
            `Issued ${issue ? revisionLabel(issue.revision) : ""} · dispatch still held`,
            "See Pack readiness for what remains outstanding.",
          )
        : {
            tone: "complete",
            icon: "circle",
            title: `Issued ${issue ? revisionLabel(issue.revision) : ""} · every crew member has acknowledged`,
            text: "Each technician records their own actual start and field evidence in My Jobs.",
          };
  if (pack.status === "Checked")
    return jobState === "StaleSource"
      ? warning(
          "The checked source changed",
          "The original attempt is retained. Prepare and check a new revision with current sources.",
        )
      : jobState === "Failed"
        ? warning(
            "Output recovery needed",
            "Recover the original output in Output and distribution. No issue has been made.",
          )
        : jobState && jobState !== "Issued"
          ? info(
              "Exact output in preparation",
              "A queued or generated output is not an issue.",
            )
          : info(
              "Checked · not issued",
              pack.actions.can_issue
                ? "Queue the exact output to issue this revision."
                : "An issuer queues the exact output for this checked revision.",
            );
  if (pack.status === "Returned")
    return warning(
      "Returned for preparation",
      pack.checks.find((c) => c.decision === "Returned")?.reason ??
        "See Revision history for the reviewer's comments.",
    );
  const blocked = pack.criteria ? readinessSummary(pack.criteria).blocked : [];
  return blocked.length
    ? warning(
        `${blocked.length} readiness ${blocked.length === 1 ? "criterion needs" : "criteria need"} attention`,
        blocked.map((c) => c.label).join(" · ") +
          ". Preparation and check can continue while dispatch is held.",
      )
    : info(
        "Draft · awaiting check",
        pack.actions.can_check
          ? "Check this exact revision, or return it with comments."
          : "A reviewer checks this revision before it can be issued.",
      );
}

export function JobPackScreen({ id }: { id: string }) {
  const r = useResource<Envelope<Pack>>(`packs/${id}`),
    command = useCommand(),
    identity = useIdentity();
  const [view, setView] = useState<View>("pack"),
    [decision, setDecision] = useState<Decision | null>(null),
    [working, setWorking] = useState(false),
    [error, setError] = useState<unknown>(null),
    [current, setCurrent] = useState({ pack: "s-1", prepare: "p-1" });
  const acknowledgement = useRef<{ key: string; captured_at: string } | null>(
      null,
    ),
    scroller = useRef<HTMLElement>(null),
    jumpLock = useRef(0),
    positions = useRef<Record<View, number>>({
      pack: 0,
      prepare: 0,
      revisions: 0,
    });
  const p = r.data?.items[0],
    revision = p?.revisions.find((x) => x.id === p.current_revision_id),
    issue = p?.issues.find((x) => x.id === p.current_issue_id),
    mine = p?.readiness.recipients.find((x) => x.user_id === identity.actor_id),
    jobState = p?.jobs.find(
      (j) => j.revision_id === p.current_revision_id,
    )?.state,
    staff =
      !!p &&
      (p.actions.can_prepare || p.actions.can_check || p.actions.can_issue),
    zone = revision?.snapshot.appointment.timezone ?? "Australia/Brisbane",
    busy = working || command.busy || r.loading || !!r.error,
    hasRevision = !!revision;

  // Scroll-spy on the module's own scroll container: the last section whose top has passed the threshold,
  // or the last section when the container cannot scroll further. A jump holds its selection for 600 ms.
  useEffect(() => {
    const el = scroller.current;
    if (!el || view !== "pack") return;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (performance.now() - jumpLock.current < 600) return;
        // The hidden Preparation panel has sections too; only the visible pack is tracked.
        const sections = [
          ...el.querySelectorAll<HTMLElement>(
            "#jp-panel-pack .jp-paper-section",
          ),
        ];
        if (!sections.length) return;
        const top = el.getBoundingClientRect().top,
          atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
        let selected = sections[0];
        if (atEnd) selected = sections[sections.length - 1];
        else
          for (const s of sections)
            if (s.getBoundingClientRect().top - top <= 100) selected = s;
        setCurrent((c) =>
          c.pack === selected.id ? c : { ...c, pack: selected.id },
        );
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [view, hasRevision]);
  function jump(target: string) {
    const el = document.getElementById(target);
    if (!el) return;
    jumpLock.current = performance.now();
    el.focus({ preventScroll: true });
    el.scrollIntoView({ behavior: "auto", block: "start" });
    setCurrent((c) => ({ ...c, pack: target }));
  }
  function show(next: View) {
    const el = scroller.current;
    if (el && next !== view) positions.current[view] = el.scrollTop;
    setView(next);
    requestAnimationFrame(() => {
      if (el) el.scrollTop = positions.current[next];
    });
  }
  async function recover(jobId: string) {
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
  async function acknowledge() {
    if (!p || !issue || !mine) return;
    const key = `${issue.id}/${mine.assignment_id}/${identity.actor_id}`;
    // The captured time belongs to the first attempt; a retry after an uncertain response must send identical bytes.
    if (acknowledgement.current?.key !== key)
      acknowledgement.current = { key, captured_at: new Date().toISOString() };
    const result = await command.send(`pack-issues/${issue.id}/acknowledge`, {
      reason: "Explicit acknowledgement of the exact synthetic issue",
      assignment_id: mine.assignment_id,
      assignment_version: mine.assignment_version,
      presented_hash: issue.output_hash,
      captured_at: acknowledgement.current.captured_at,
    });
    if (result) {
      acknowledgement.current = null;
      r.reload();
    }
  }

  const frame = (children: React.ReactNode) => (
    <section
      id="ppo-job-pack"
      data-module-layout="full-bleed"
      aria-labelledby="jp-page-title"
      ref={scroller}
    >
      {children}
    </section>
  );
  if (isDenied(command.error) || isDenied(error))
    return frame(
      <>
        <h1 id="jp-page-title" className="jp-sr">
          Job pack
        </h1>
        <ErrorNotice error={isDenied(command.error) ? command.error : error} />
      </>,
    );

  const status = p ? statusPresentation(p, jobState) : null,
    step = p ? nextStep(p, issue, jobState, mine) : null,
    summary = p?.criteria ? readinessSummary(p.criteria) : null,
    drifted = driftSources(p?.basis_drift ?? []),
    flagged: SectionKey[] = sectionKeys.filter(
      (k) =>
        (k === "readiness" && !!summary?.blocked.length) ||
        sectionSources[k].some((s) => drifted.includes(s)),
    ),
    outstanding = (summary?.blocked.length ?? 0) + (drifted.length ? 1 : 0),
    views: [View, string][] = [
      ["pack", "Job pack"],
      ...(staff ? ([["prepare", "Preparation"]] as [View, string][]) : []),
      ["revisions", "Revision history"],
    ],
    names = {
      sources: Object.fromEntries(
        (p?.sources ?? []).map((s) => [s.id, s.title]),
      ),
      history: Object.fromEntries(
        (p?.history ?? []).map((h) => [h.id, `${h.kind}: ${h.summary}`]),
      ),
    };
  const tabKeys = (e: React.KeyboardEvent) => {
    const i = views.findIndex(([v]) => v === view),
      next =
        e.key === "ArrowRight"
          ? (i + 1) % views.length
          : e.key === "ArrowLeft"
            ? (i + views.length - 1) % views.length
            : e.key === "Home"
              ? 0
              : e.key === "End"
                ? views.length - 1
                : -1;
    if (next < 0) return;
    e.preventDefault();
    show(views[next][0]);
    document.getElementById(`jp-tab-${views[next][0]}`)?.focus();
  };

  return frame(
    <>
      <nav className="jp-breadcrumb" aria-label="Page location">
        <Link href="/service/tickets">Service operations</Link>
        <span aria-hidden="true">›</span>
        <Link href="/service/packs">Job packs</Link>
        <span aria-hidden="true">›</span>
        <span>{p?.display_number ?? "Job pack"}</span>
      </nav>
      <header className="jp-heading">
        <div>
          <div className="jp-reference-line">
            <span>{p?.display_number ?? "Job pack"}</span>
            {p && (
              <span>
                Job pack · {p.status}
                {revision ? ` ${revisionLabel(revision.revision)}` : ""}
              </span>
            )}
            <span>Synthetic prototype</span>
          </div>
          <h1 id="jp-page-title">
            {revision
              ? `${revision.snapshot.work.reference} · ${revision.snapshot.appointment.reference}`
              : (p?.display_number ?? "Job pack")}
          </h1>
          {p && (
            <div className="jp-subtitle">
              {revision && (
                <>
                  <strong>{revision.snapshot.customer.name}</strong>
                  <span aria-hidden="true">·</span>
                  <span>{revision.snapshot.site.name}</span>
                </>
              )}
              {status && <Badge tone={status.tone}>{status.label}</Badge>}
            </div>
          )}
        </div>
        {p && (
          <div className="jp-heading-right">
            <div className="jp-button-row">
              <Link
                className="jp-button"
                href={`/service/appointments/${p.appointment_id}`}
              >
                Appointment
              </Link>
              {revision && (p.actions.can_prepare || p.actions.can_check) && (
                <a
                  className="jp-button"
                  href={`/api/v1/packs/${id}/preview?revision_id=${revision.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Icon name="print" />
                  Open preparation preview
                </a>
              )}
              {issue && (
                <Link
                  className="jp-button jp-primary"
                  href={`/documents/${issue.id}`}
                >
                  <Icon name="document" />
                  Open exact issued document
                </Link>
              )}
              {p.actions.can_prepare && (
                <button
                  type="button"
                  className={issue ? undefined : "jp-primary"}
                  disabled={busy}
                  onClick={() => {
                    show("prepare");
                    document.getElementById("jp-tab-prepare")?.focus();
                  }}
                >
                  <Icon name="edit" />
                  Prepare successor revision
                </button>
              )}
            </div>
            {revision?.created_by_name && (
              <div className="jp-person jp-small jp-muted">
                <span>Prepared by</span>
                <Person name={revision.created_by_name} />
              </div>
            )}
          </div>
        )}
      </header>
      <div className="jp-read-state">
        <ReadState
          loading={r.loading}
          error={r.error ?? (decision ? null : error)}
          retry={r.reload}
          retained={!!p}
        />
      </div>
      {p && (
        <>
          <div
            className="jp-tabs"
            role="tablist"
            aria-label="Job pack view"
            onKeyDown={tabKeys}
          >
            {views.map(([v, title]) => (
              <button
                key={v}
                type="button"
                role="tab"
                id={`jp-tab-${v}`}
                aria-controls={`jp-panel-${v}`}
                aria-selected={view === v}
                tabIndex={view === v ? 0 : -1}
                aria-label={
                  v === "pack"
                    ? "Job pack, 9 sections"
                    : v === "prepare"
                      ? `Preparation, ${outstanding} outstanding ${outstanding === 1 ? "item" : "items"}`
                      : undefined
                }
                onClick={() => show(v)}
              >
                {title}
                {v === "pack" && (
                  <span className="jp-count" aria-hidden="true">
                    9
                  </span>
                )}
                {v === "prepare" && (
                  <span className="jp-count" aria-hidden="true">
                    {outstanding}
                  </span>
                )}
              </button>
            ))}
            <span className="jp-tab-trailing" role="presentation">
              <Icon name="document" />
              Record version {p.version}
            </span>
          </div>
          <section
            id="jp-panel-pack"
            role="tabpanel"
            aria-labelledby="jp-tab-pack"
            hidden={view !== "pack"}
          >
            <div className="jp-layout">
              {revision ? (
                <ContentsRail
                  prefix="s"
                  title="Pack contents"
                  label="Job pack sections"
                  current={current.pack}
                  flagged={flagged}
                  onJump={jump}
                  foot={
                    <>
                      Prepared against work order v
                      {revision.snapshot.work.version} · appointment v
                      {revision.snapshot.appointment.version}
                      <br />
                      Visit ·{" "}
                      {formatDate(revision.snapshot.appointment.start_at, zone)}
                      <br />
                      Times in{" "}
                      {zoneLabel(
                        revision.snapshot.appointment.start_at,
                        zone,
                      )}{" "}
                      ({zone})
                    </>
                  }
                />
              ) : (
                <aside className="jp-contents" aria-label="Pack contents" />
              )}
              <div className="jp-main-column">
                {step && (
                  <div className={`jp-notice ${step.tone}`.trim()}>
                    <Icon name={step.icon} />
                    <div>
                      <strong>{step.title}</strong>
                      <span>{step.text}</span>
                    </div>
                  </div>
                )}
                {!decision && <ErrorNotice error={command.error} />}
                {revision ? (
                  <article
                    className="jp-paper"
                    aria-label="Full technician job pack"
                  >
                    <div className="jp-paper-heading">
                      <div>
                        <h2>Technician job pack</h2>
                        <p>
                          {issue && issue.revision_id === revision.id
                            ? `Issued ${revisionLabel(revision.revision)}`
                            : `${p.status} ${revisionLabel(revision.revision)} · Not issued`}{" "}
                          · saved {formatStamp(revision.created_at, zone)}
                        </p>
                      </div>
                      <Badge>9 sections</Badge>
                    </div>
                    <PackSections pack={p} revision={revision} />
                  </article>
                ) : (
                  <article className="jp-paper">
                    <div className="jp-paper-heading">
                      <div>
                        <h2>Technician job pack</h2>
                        <p>
                          No preparation revision is visible to this identity.
                        </p>
                      </div>
                    </div>
                  </article>
                )}
              </div>
              <aside
                className="jp-right-rail"
                aria-label="Preparation and issue summary"
              >
                <ReadinessCard pack={p} revision={revision}>
                  {p.actions.can_check &&
                    ["Draft", "Returned"].includes(p.status) && (
                      <>
                        <button
                          type="button"
                          className="jp-primary jp-side-action"
                          disabled={busy}
                          onClick={() =>
                            setDecision({ kind: "check", decision: "Checked" })
                          }
                        >
                          Check this revision
                        </button>
                        <button
                          type="button"
                          className="jp-side-action"
                          disabled={busy}
                          onClick={() =>
                            setDecision({ kind: "check", decision: "Returned" })
                          }
                        >
                          Return preparation
                        </button>
                      </>
                    )}
                  {p.actions.can_issue && p.status === "Checked" && (
                    <button
                      type="button"
                      className="jp-primary jp-side-action"
                      disabled={busy}
                      onClick={() => setDecision({ kind: "issue" })}
                    >
                      Queue exact output for issue
                    </button>
                  )}
                  {p.actions.can_issue && issue && p.status !== "Withdrawn" && (
                    <button
                      type="button"
                      className="jp-side-action"
                      disabled={busy}
                      onClick={() => setDecision({ kind: "withdraw" })}
                    >
                      Withdraw current issue
                    </button>
                  )}
                </ReadinessCard>
                <CrewCard pack={p} revision={revision} issue={issue}>
                  {p.actions.can_acknowledge &&
                    issue &&
                    mine &&
                    !mine.acknowledged_at &&
                    !p.needs_review && (
                      <button
                        type="button"
                        className="jp-primary jp-side-action"
                        disabled={busy}
                        onClick={acknowledge}
                      >
                        Acknowledge this exact issue as {identity.display_name}
                      </button>
                    )}
                </CrewCard>
                <RecordCard pack={p} revision={revision} issue={issue} />
                {staff && (
                  <OutputCard
                    pack={p}
                    revision={revision}
                    issue={issue}
                    busy={busy}
                    working={working}
                    onRecover={recover}
                    onSend={(recipient) =>
                      setDecision({ kind: "send", recipient })
                    }
                  />
                )}
              </aside>
            </div>
          </section>
          {staff && (
            <section
              id="jp-panel-prepare"
              role="tabpanel"
              aria-labelledby="jp-tab-prepare"
              hidden={view !== "prepare"}
            >
              <div className="jp-revision-layout">
                <div className="jp-paper">
                  <div className="jp-form-intro">
                    <h2>
                      Prepare{" "}
                      {revision
                        ? `the successor to ${revisionLabel(revision.revision)}`
                        : "the first revision"}
                    </h2>
                    <p>
                      Every save is a new immutable revision with its own
                      reason.
                      {issue
                        ? " Saving now raises an amendment: dispatch is held at once, and a fresh check, issue and every crew acknowledgement are required."
                        : ""}
                    </p>
                  </div>
                  <div className="jp-paper-section">
                    {p.actions.can_prepare ? (
                      <PreparationForm
                        key={p.version}
                        pack={p}
                        sources={p.sources}
                        history={p.history}
                        onSaved={() => {
                          show("pack");
                          r.reload();
                        }}
                      />
                    ) : (
                      <p className="jp-muted">
                        This identity can review the preparation but cannot save
                        a revision.
                      </p>
                    )}
                  </div>
                </div>
                <aside className="jp-side-card">
                  <div className="jp-side-heading">
                    <h2>Where information comes from</h2>
                  </div>
                  <div className="jp-side-body">
                    <p>
                      <strong className="jp-ink">Linked records</strong>
                      <br />
                      Customer, appointment, approved scope, site record and
                      equipment are composed by the server when you save, each
                      at its current version.
                    </p>
                    <p className="jp-gap-top">
                      <strong className="jp-ink">Preparation entries</strong>
                      <br />
                      Nine reviewed notes, the exact document versions and the
                      service history you select. Notes cannot extend the
                      authorised scope.
                    </p>
                  </div>
                </aside>
              </div>
            </section>
          )}
          <section
            id="jp-panel-revisions"
            role="tabpanel"
            aria-labelledby="jp-tab-revisions"
            hidden={view !== "revisions"}
          >
            <div className="jp-revision-layout">
              <article className="jp-paper">
                <div className="jp-paper-heading">
                  <div>
                    <h2>Revision history</h2>
                    <p>
                      Preparation, review, issue and response events for this
                      pack
                    </p>
                  </div>
                  {revision && (
                    <Badge>{revisionLabel(revision.revision)}</Badge>
                  )}
                </div>
                <div className="jp-timeline">
                  {packTimeline(p, names).map((e) => (
                    <article
                      className={`jp-event ${e.kind}`}
                      key={e.kind + e.id}
                    >
                      <h3>
                        {e.href ? (
                          <Link href={e.href}>{e.title}</Link>
                        ) : (
                          e.title
                        )}
                      </h3>
                      <p>{e.detail}</p>
                      {e.changes.length > 0 && (
                        <ul
                          className="jp-event-changes"
                          aria-label="Changed fields"
                        >
                          {e.changes.map((c) => (
                            <li key={c.field}>
                              <strong>{c.label}</strong>:{" "}
                              {c.from && c.to
                                ? `${c.from} → ${c.to}`
                                : c.from || c.to}
                            </li>
                          ))}
                        </ul>
                      )}
                      <small>
                        {formatStamp(e.at, zone)}
                        {e.actor ? ` · ${e.actor}` : ""}
                      </small>
                    </article>
                  ))}
                </div>
              </article>
              <aside className="jp-side-card">
                <div className="jp-side-heading">
                  <h2>Current version</h2>
                </div>
                <div className="jp-side-body">
                  <dl>
                    <KeyRow label="Revision">
                      {revision
                        ? revisionLabel(revision.revision)
                        : "Not visible"}
                    </KeyRow>
                    <KeyRow label="Status">{p.status}</KeyRow>
                    <KeyRow label="Issued version">
                      {issue ? revisionLabel(issue.revision) : "None"}
                    </KeyRow>
                    {p.basis && (
                      <KeyRow label="Prepared against">
                        WO v{p.basis.work_version} · APT v
                        {p.basis.appointment_version}
                      </KeyRow>
                    )}
                  </dl>
                  <p className="jp-gap-top-lg">
                    Every save is a new immutable revision recorded with its
                    reason and changed fields. A change to issued work
                    instructions holds dispatch and needs a fresh check, issue
                    and acknowledgement.
                  </p>
                </div>
              </aside>
            </div>
          </section>
          <footer className="jp-page-foot">
            <span>Powerplants One · Service operations</span>
            <span>Synthetic prototype — not for operational use</span>
          </footer>
          {decision && (
            <DecisionDialog
              pack={p}
              revision={revision}
              issue={issue}
              decision={decision}
              command={command}
              // An uncertain command keeps its identity after the dialog closes, so the same decision can still be replayed.
              onClose={() => setDecision(null)}
              onDone={() => {
                setDecision(null);
                r.reload();
              }}
            />
          )}
        </>
      )}
    </>,
  );
}
