"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  api,
  useResource,
  useCommand,
  ErrorNotice,
  ReadState,
  ValidationFields,
  isDenied,
  type Envelope,
} from "../../../components/business-ui";
import { useUnsavedChanges } from "../../../components/record-ui";
import { useIdentity } from "../../../components/business-session";
import type { OperationReceipt } from "../../../platform/operations";
import { sectionKeys, type PackInput, type SectionKey } from "../../validation";
import { readSection } from "../../section-readers";
import {
  driftSources,
  emptyInput,
  formatDate,
  formatStamp,
  historyLabel,
  inputDiff,
  packTimeline,
  readinessSummary,
  revisionLabel,
  readableValue,
  statusPresentation,
  zoneLabel,
} from "../../pack-view";
import type {
  Pack,
  PackHistory,
  PackIssue,
  PackRecipient,
  PackRevision,
  PackSource,
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
import {
  PreparationForm,
  PreparationGuidanceCard,
  PreparationStatusCard,
  UnsavedBadge,
} from "./job-pack-preparation";
import {
  DiscardDialog,
  PreparationChangeDialog,
} from "./job-pack-change-dialog";

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

// Scroll-spy on the module's own scroll container: the last section whose top has passed the threshold,
// or the last section when the container cannot scroll further. A jump holds its selection for 600 ms.
function useSectionSpy(
  scroller: React.RefObject<HTMLElement | null>,
  panel: string | null,
  ready: unknown,
  onSelect: (id: string) => void,
) {
  // performance.now() counts from page load. A lock that starts at 0 would swallow every scroll in the first
  // 600 ms, which a compiled page reaches and a dev server never does.
  const jumpLock = useRef(Number.NEGATIVE_INFINITY),
    select = useRef(onSelect);
  // The listener is attached once per panel; the callback it calls is always the latest render's.
  useEffect(() => {
    select.current = onSelect;
  });
  useEffect(() => {
    const el = scroller.current;
    if (!el || !panel) return;
    let pending = false;
    const onScroll = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => {
        pending = false;
        if (performance.now() - jumpLock.current < 600) return;
        // Both panels hold sections; only the visible one is tracked.
        const sections = [
          ...el.querySelectorAll<HTMLElement>(`${panel} .jp-paper-section`),
        ];
        if (!sections.length) return;
        const top = el.getBoundingClientRect().top,
          atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
        let selected = sections[0];
        if (atEnd) selected = sections[sections.length - 1];
        else
          for (const s of sections)
            if (s.getBoundingClientRect().top - top <= 100) selected = s;
        select.current(selected.id);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scroller, panel, ready]);
  return jumpLock;
}
// A contents-rail jump focuses its section, scrolls it to the top of the module container and holds the
// rail's selection past the scroll it causes.
function jumpToSection(
  target: string,
  jumpLock: React.RefObject<number>,
  select: (id: string) => void,
) {
  const el = document.getElementById(target);
  if (!el) return;
  jumpLock.current = performance.now();
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: "auto", block: "start" });
  select(target);
}

export function JobPackScreen({ id }: { id: string }) {
  const r = useResource<Envelope<Pack>>(`packs/${id}`),
    command = useCommand(),
    identity = useIdentity();
  const [view, setView] = useState<View>("pack"),
    [decision, setDecision] = useState<Decision | null>(null),
    // null means "no edits yet": the saved revision is shown as it stands, so a reload never
    // resurrects a stale draft and a fresh save clears the dirty state without waiting for the read.
    [draft, setDraft] = useState<PackInput | null>(null),
    [prep, setPrep] = useState<null | "save" | "discard">(null),
    [printChoice, setPrintChoice] = useState(false),
    [printAfterSave, setPrintAfterSave] = useState(false),
    [savedPrint, setSavedPrint] = useState<{
      revision: number;
      version: number;
    } | null>(null),
    [working, setWorking] = useState(false),
    [error, setError] = useState<unknown>(null),
    [current, setCurrent] = useState({ pack: "s-1", prepare: "p-1" });
  const acknowledgement = useRef<{ key: string; captured_at: string } | null>(
      null,
    ),
    scroller = useRef<HTMLElement>(null),
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
  // Readable names for the change record: a stored history code never reaches the dialog or the timeline.
  const names = {
      sources: Object.fromEntries(
        (p?.sources ?? []).map((s) => [s.id, s.title]),
      ),
      history: Object.fromEntries(
        (p?.history ?? []).map((h) => [h.id, historyLabel(h)]),
      ),
    },
    baseline = revision?.input ?? null,
    value = draft ?? baseline ?? emptyInput(),
    // The change list and the dirty state are the same comparison, so what the dialog records is
    // exactly what the action bar reports.
    changes = staff ? inputDiff(baseline, value, names) : [],
    dirty = !!draft && changes.length > 0;
  useUnsavedChanges(dirty, command.busy);

  const select = (target: string) =>
      setCurrent((c) => {
        const key = target.startsWith("p-") ? "prepare" : "pack";
        return c[key] === target ? c : { ...c, [key]: target };
      }),
    jumpLock = useSectionSpy(
      scroller,
      view === "revisions" ? null : `#jp-panel-${view}`,
      hasRevision,
      select,
    );
  const jump = (target: string) => jumpToSection(target, jumpLock, select);
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
  // The dialog supplies only the reason; the body is built here and not rebuilt on a retry, so an
  // uncertain save replays byte-identically instead of creating a second revision.
  async function savePreparation(reason: string) {
    if (!p) return;
    const result = await command.send<OperationReceipt>(`packs/${p.id}/amend`, {
      expected_version: p.version,
      reason,
      content: value,
    });
    if (result) {
      if (printAfterSave && revision)
        setSavedPrint({
          revision: revision.revision + 1,
          version: result.record_version,
        });
      setPrintAfterSave(false);
      setPrep(null);
      setDraft(null);
      show("pack");
      r.reload();
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
    sourceChanged =
      drifted.length > 0 ||
      (p?.status === "Issued" && p.needs_review) ||
      jobState === "StaleSource",
    printRevision =
      savedPrint && p && p.version >= savedPrint.version
        ? p.revisions.find((item) => item.revision === savedPrint.revision)
        : undefined,
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
    ];
  const scopeView = revision
    ? readSection("scope", revision.snapshot, revision.id, p?.section_view)
    : null;
  const scopeHeading = scopeView?.kind === "scope" ? scopeView.value : null;
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

  const sourceNotice =
    p && sourceChanged && staff ? (
      <div
        className="jp-notice"
        role="region"
        aria-label="Changed pack sources"
      >
        <Icon name="warning" />
        <div>
          <strong>Source changed since this draft was prepared</strong>
          <span>
            The saved revision is retained. Prepare a successor with current
            sources; checking and issuing still verify the exact source content.
          </span>
          {!!p.basis_drift?.length && (
            <ul>
              {p.basis_drift.map((item) => (
                <li key={item.field}>
                  {item.source} {item.label}: {String(item.from)} →{" "}
                  {item.to == null
                    ? "Current source unavailable"
                    : String(item.to)}
                </li>
              ))}
            </ul>
          )}
          {p.actions.can_prepare && (
            <button
              type="button"
              className="jp-text-button"
              disabled={busy}
              onClick={() => {
                if (view === "prepare") {
                  setPrintAfterSave(false);
                  setPrep("save");
                } else {
                  show("prepare");
                  document.getElementById("jp-tab-prepare")?.focus();
                }
              }}
            >
              {view === "prepare"
                ? "Refresh saved sources…"
                : "Review changed sources"}
            </button>
          )}
        </div>
      </div>
    ) : null;

  return frame(
    <>
      <nav className="jp-breadcrumb" aria-label="Page location">
        <Link href="/service/tickets">Service</Link>
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
            {scopeHeading?.summary ||
              (revision
                ? `${revision.snapshot.work.reference} · ${revision.snapshot.appointment.reference}`
                : (p?.display_number ?? "Job pack"))}
          </h1>
          {scopeHeading && (
            <p className="jp-work-context">
              {[
                ...new Set(
                  scopeHeading.items.map((i) => readableValue(i.task_kind)),
                ),
              ].join(" · ")}{" "}
              · {revision?.snapshot.work.reference} ·{" "}
              {revision?.snapshot.appointment.reference}
            </p>
          )}
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
              {dirty && <UnsavedBadge />}
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
              {revision && issue?.revision_id !== revision.id && staff && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setPrintChoice(true)}
                >
                  <Icon name="print" />
                  Print preview
                </button>
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
            <span
              className={`jp-tab-trailing${dirty ? " changed" : ""}`}
              role="presentation"
            >
              <Icon name={dirty ? "warning" : "document"} />
              {dirty
                ? "Unsaved preparation changes"
                : revision
                  ? `${revisionLabel(revision.revision)} saved ${formatStamp(revision.created_at, zone)}`
                  : "No saved revision"}
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
                {view === "pack" && sourceNotice}
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
              <div className="jp-layout">
                <ContentsRail
                  prefix="p"
                  title="Preparation"
                  label="Preparation sections"
                  current={current.prepare}
                  flagged={flagged}
                  onJump={jump}
                  foot={
                    <>
                      The job records supply the context.
                      <br />
                      Add the instructions this visit needs.
                    </>
                  }
                />
                <div className="jp-main-column">
                  {view === "prepare" && sourceNotice}
                  {p.actions.can_prepare ? (
                    <ValidationFields error={prep ? null : command.error}>
                      <PreparationForm
                        pack={p}
                        revision={revision}
                        sources={p.sources}
                        history={p.history}
                        value={value}
                        onChange={setDraft}
                        dirty={dirty}
                        busy={command.busy}
                        saveState={
                          command.busy
                            ? "Saving preparation…"
                            : dirty
                              ? "Unsaved changes"
                              : command.saved && revision
                                ? `Saved as ${revisionLabel(revision.revision)}`
                                : "No unsaved changes"
                        }
                        error={prep ? null : command.error}
                        onSave={() => {
                          setPrintAfterSave(false);
                          setPrep("save");
                        }}
                        onDiscard={() => setPrep("discard")}
                      />
                    </ValidationFields>
                  ) : (
                    <article className="jp-paper">
                      <div className="jp-paper-heading">
                        <div>
                          <h2>Preparation</h2>
                          <p>
                            This identity can review the preparation but cannot
                            save a revision.
                          </p>
                        </div>
                      </div>
                    </article>
                  )}
                </div>
                <aside
                  className="jp-right-rail"
                  aria-label="Preparation guidance"
                >
                  <PreparationStatusCard pack={p} revision={revision} />
                  <PreparationGuidanceCard />
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
                        {e.revision != null && (
                          <Badge>{revisionLabel(e.revision)}</Badge>
                        )}{" "}
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
                    <KeyRow label="Status">
                      {status?.label ?? readableValue(p.status)}
                    </KeyRow>
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
          {prep === "save" && (
            <PreparationChangeDialog
              title={
                revision
                  ? "Record preparation change"
                  : "Record the first preparation"
              }
              subtitle={`${p.display_number} · ${changes.length} field${changes.length === 1 ? "" : "s"} changed`}
              lead={`The changed fields below are recorded with your reason in the revision history. This save creates ${revision ? revisionLabel(revision.revision + 1) : revisionLabel(1)}.`}
              amendment={
                issue && p.status !== "Withdrawn"
                  ? "Dispatch is held as soon as this revision is saved, and a fresh check, issue and every crew acknowledgement are required."
                  : undefined
              }
              changes={changes}
              command={command}
              onConfirm={savePreparation}
              onClose={() => {
                setPrep(null);
                setPrintAfterSave(false);
              }}
            />
          )}
          {printChoice && revision && (
            <PackDialog
              title={
                dirty
                  ? "Print with unsaved preparation?"
                  : "Print saved preparation"
              }
              subtitle={`${p.display_number} · ${revisionLabel(revision.revision)}`}
              onClose={() => setPrintChoice(false)}
              actions={
                <>
                  <a
                    className="jp-button"
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/v1/packs/${id}/preview?revision_id=${revision.id}`}
                  >
                    Print saved draft
                  </a>
                  {dirty && p.actions.can_prepare && (
                    <button
                      type="button"
                      className="jp-primary"
                      data-primary
                      onClick={() => {
                        setPrintChoice(false);
                        setPrintAfterSave(true);
                        setPrep("save");
                      }}
                    >
                      Save and print…
                    </button>
                  )}
                </>
              }
            >
              <p>
                {dirty
                  ? "Your unsaved entries are not in the saved draft. Save a successor with a reason before printing those changes, or open the saved draft and keep editing."
                  : "Open the controlled preview of this saved revision, then use your browser’s Print command."}
              </p>
              <p>
                Preparation preview — not issued. Printing does not check, issue
                or acknowledge a pack.
              </p>
            </PackDialog>
          )}
          {savedPrint && (
            <PackDialog
              title="Saved preparation — ready to print"
              subtitle={p.display_number}
              onClose={() => setSavedPrint(null)}
              actions={
                printRevision && !r.error && !r.loading ? (
                  <a
                    className="jp-button jp-primary"
                    data-primary
                    target="_blank"
                    rel="noreferrer"
                    href={`/api/v1/packs/${id}/preview?revision_id=${printRevision.id}`}
                  >
                    Print saved revision {revisionLabel(printRevision.revision)}
                  </a>
                ) : undefined
              }
            >
              <p>
                The save succeeded. Open the exact saved successor preview, then
                use your browser’s Print command. Preparation preview — not
                issued.
              </p>
              <ReadState loading={r.loading} error={r.error} retry={r.reload} />
              {!r.loading && !r.error && !printRevision && (
                <p>
                  The saved revision is not available in this read.{" "}
                  <button type="button" onClick={r.reload}>
                    Reload saved revision
                  </button>
                </p>
              )}
            </PackDialog>
          )}
          {prep === "discard" && (
            <DiscardDialog
              subtitle={`${p.display_number} · ${changes.length} field${changes.length === 1 ? "" : "s"} changed`}
              onConfirm={() => {
                setDraft(null);
                setPrep(null);
              }}
              onClose={() => setPrep(null)}
            />
          )}
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

type PreparationOptions = {
  appointment: {
    id: string;
    version: number;
    display_number: string;
    site_timezone: string;
  };
  work_order_reference: string;
  // Non-null when a pack already exists for this appointment: one pack per appointment, so this page
  // opens that pack instead of failing the unique constraint on save.
  existing_pack_id: string | null;
  sources: PackSource[];
  history: PackHistory[];
};

// First preparation. The same frame and the same preparation view as the pack page, with only the
// Preparation view available: there is no revision, no readiness and no record until the first save.
export function NewJobPackScreen({ appointmentId }: { appointmentId: string }) {
  const router = useRouter(),
    r = useResource<PreparationOptions>(
      `appointments/${appointmentId}/pack-options`,
    ),
    command = useCommand();
  const [draft, setDraft] = useState<PackInput | null>(null),
    [prep, setPrep] = useState<null | "save" | "discard">(null),
    [current, setCurrent] = useState("p-1"),
    // The identity of the pack this page is preparing, fixed for the life of the page so that an
    // uncertain first save replays instead of creating a second pack.
    [packId] = useState(() => crypto.randomUUID());
  const scroller = useRef<HTMLElement>(null);
  const options = r.data,
    existing = options?.existing_pack_id ?? null,
    value = draft ?? emptyInput(),
    names = {
      sources: Object.fromEntries(
        (options?.sources ?? []).map((s) => [s.id, s.title]),
      ),
      history: Object.fromEntries(
        (options?.history ?? []).map((h) => [h.id, historyLabel(h)]),
      ),
    },
    changes = inputDiff(null, value, names),
    dirty = !!draft && changes.length > 0;
  useUnsavedChanges(dirty, command.busy);
  useEffect(() => {
    if (existing) router.replace(`/service/packs/${existing}`);
  }, [existing, router]);
  const select = (target: string) => setCurrent(target),
    jumpLock = useSectionSpy(
      scroller,
      existing ? null : "#jp-panel-prepare",
      !!options,
      select,
    );
  const jump = (target: string) => jumpToSection(target, jumpLock, select);
  async function savePreparation(reason: string) {
    if (!options) return;
    const result = await command.send<{ record_id: string }>("packs", {
      id: packId,
      appointment_id: options.appointment.id,
      expected_appointment_version: options.appointment.version,
      reason,
      content: value,
    });
    if (result) {
      setPrep(null);
      setDraft(null);
      router.push(`/service/packs/${result.record_id}`);
    }
  }
  if (isDenied(r.error))
    return (
      <section id="ppo-job-pack" data-module-layout="full-bleed">
        <h1 className="jp-sr">Job pack</h1>
        <ErrorNotice error={r.error} />
      </section>
    );
  return (
    <section
      id="ppo-job-pack"
      data-module-layout="full-bleed"
      aria-labelledby="jp-page-title"
      ref={scroller}
    >
      <nav className="jp-breadcrumb" aria-label="Page location">
        <Link href="/service/tickets">Service</Link>
        <span aria-hidden="true">›</span>
        <Link href="/service/packs">Job packs</Link>
        <span aria-hidden="true">›</span>
        <span>Prepare</span>
      </nav>
      <header className="jp-heading">
        <div>
          <div className="jp-reference-line">
            <span>{options?.work_order_reference ?? "Job pack"}</span>
            <span>Job pack · first preparation</span>
          </div>
          <h1 id="jp-page-title">
            {options
              ? `${options.work_order_reference} · ${options.appointment.display_number}`
              : "Prepare job pack"}
          </h1>
          <div className="jp-subtitle">
            <Badge>Not yet saved</Badge>
            {dirty && <UnsavedBadge />}
          </div>
        </div>
        <div className="jp-heading-right">
          <div className="jp-button-row">
            <Link
              className="jp-button"
              href={`/service/appointments/${appointmentId}`}
            >
              Appointment
            </Link>
          </div>
        </div>
      </header>
      <div className="jp-read-state">
        <ReadState
          loading={r.loading}
          error={r.error}
          retry={r.reload}
          retained={!!options}
        />
        {existing && (
          <p role="status">
            A job pack already exists for this appointment — opening it.
          </p>
        )}
      </div>
      {options && !existing && (
        <>
          <div className="jp-tabs" role="tablist" aria-label="Job pack view">
            <button
              type="button"
              role="tab"
              id="jp-tab-prepare"
              aria-controls="jp-panel-prepare"
              aria-selected="true"
              aria-label="Preparation, 9 outstanding items"
            >
              Preparation
              <span className="jp-count" aria-hidden="true">
                9
              </span>
            </button>
            <span className="jp-tab-trailing" role="presentation">
              <Icon name={dirty ? "warning" : "document"} />
              {dirty ? "Unsaved preparation changes" : "No saved revision"}
            </span>
          </div>
          <section
            id="jp-panel-prepare"
            role="tabpanel"
            aria-labelledby="jp-tab-prepare"
          >
            <div className="jp-layout">
              <ContentsRail
                prefix="p"
                title="Preparation"
                label="Preparation sections"
                current={current}
                flagged={[]}
                onJump={jump}
                foot={
                  <>
                    The job records supply the context.
                    <br />
                    Add the instructions this visit needs.
                  </>
                }
              />
              <div className="jp-main-column">
                <ValidationFields error={prep ? null : command.error}>
                  <PreparationForm
                    timeZone={options.appointment.site_timezone}
                    sources={options.sources}
                    history={options.history}
                    value={value}
                    onChange={setDraft}
                    dirty={dirty}
                    busy={command.busy}
                    saveState={
                      command.busy
                        ? "Saving preparation…"
                        : dirty
                          ? "Unsaved changes"
                          : "No unsaved changes"
                    }
                    error={prep ? null : command.error}
                    onSave={() => setPrep("save")}
                    onDiscard={() => setPrep("discard")}
                  />
                </ValidationFields>
              </div>
              <aside
                className="jp-right-rail"
                aria-label="Preparation guidance"
              >
                <PreparationStatusCard />
                <PreparationGuidanceCard />
              </aside>
            </div>
          </section>
          <footer className="jp-page-foot">
            <span>Powerplants One · Service operations</span>
            <span>Synthetic prototype — not for operational use</span>
          </footer>
          {prep === "save" && (
            <PreparationChangeDialog
              title="Record the first preparation"
              subtitle={`${options.appointment.display_number} · ${changes.length} field${changes.length === 1 ? "" : "s"} changed`}
              lead="Every entry below is recorded as added, with your reason, in the revision history. This save creates r01."
              changes={changes}
              command={command}
              onConfirm={savePreparation}
              onClose={() => setPrep(null)}
            />
          )}
          {prep === "discard" && (
            <DiscardDialog
              subtitle={`${options.appointment.display_number} · ${changes.length} field${changes.length === 1 ? "" : "s"} changed`}
              onConfirm={() => {
                setDraft(null);
                setPrep(null);
              }}
              onClose={() => setPrep(null)}
            />
          )}
        </>
      )}
    </section>
  );
}
