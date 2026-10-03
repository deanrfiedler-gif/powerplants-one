"use client";
import { visitArrivalGuidance } from "../field/visit-guidance";
import Link from "next/link";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "./ui/button";
import { ErrorNotice, ReadState, Stamp, useResource } from "./business-ui";
import { useCrmCommand } from "./crm-state";
import { LocalDateTimeField } from "./record-ui";
import type { Job } from "./field-screens";
import {
  elapsedLabel,
  pauseLabels,
  pauseNeedsNote,
  pauseReasons,
  wholeSecond,
  timerInstant,
  type PauseReason,
  type TimerAction,
  type TimerView,
} from "../field/timer-model";

type TimeEntry = Job["entries"][number];
type DialogState = {
  action: "Start" | "Resume" | "Pause" | "Finish" | "Menu";
  version: number;
};
const time = (value: string, zone: string) =>
  new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: zone,
  }).format(new Date(value));
function TimerDialog({
  title,
  children,
  onClose,
  locked,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  locked: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const d = ref.current;
    d?.showModal();
    return () => {
      d?.close();
      previous?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby="timer-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose();
      }}
    >
      <header className="sheet-head">
        <h2 id="timer-dialog-title">{title}</h2>
        <Button
          aria-label="Close timer dialog"
          disabled={locked}
          onClick={onClose}
        >
          Close
        </Button>
      </header>
      {children}
    </dialog>
  );
}
function VisitTrack({
  job,
  entries,
  open,
  now,
}: {
  job: Job;
  entries: TimeEntry[];
  open: { start: string; kind: string } | null;
  now: number;
}) {
  const starts = [
    Date.parse(job.scheduled_start_at),
    ...entries.map((e) => Date.parse(String(e.payload.start_at))),
    ...(open ? [Date.parse(open.start)] : []),
  ];
  const ends = [
    Date.parse(job.scheduled_end_at),
    ...entries.map((e) => Date.parse(String(e.payload.end_at))),
    ...(open ? [now] : []),
  ];
  const first = Math.floor(Math.min(...starts) / 300000) * 300000,
    last = Math.max(first + 3600000, ...ends),
    span = last - first;
  const percent = (n: number) =>
    Math.max(0, Math.min(100, ((n - first) / span) * 100));
  const step = Math.max(300000, Math.ceil(span / 96 / 300000) * 300000),
    ticks = [];
  for (let n = first; n <= last; n += step) ticks.push(n);
  const ranges = entries.map((e) => ({
    id: e.id,
    start: Date.parse(String(e.payload.start_at)),
    end: Date.parse(String(e.payload.end_at)),
    kind: String(e.payload.time_kind),
  }));
  if (open)
    ranges.push({
      id: "open",
      start: Date.parse(open.start),
      end: Math.max(Date.parse(open.start), now),
      kind: open.kind,
    });
  return (
    <div
      className="track"
      role="img"
      aria-label={`Visit track: booked ${time(job.scheduled_start_at, job.site_timezone)} to ${time(job.scheduled_end_at, job.site_timezone)}; ${entries.length} saved intervals${open ? " and one open stretch" : ""}. Exact times are listed below.`}
    >
      <span className="booked-label">Booked visit</span>
      <i
        className="booked"
        style={{
          left: `${percent(Date.parse(job.scheduled_start_at))}%`,
          width: `${percent(Date.parse(job.scheduled_end_at)) - percent(Date.parse(job.scheduled_start_at))}%`,
        }}
      />
      <div className="rail">
        {ranges.map((x) => (
          <i
            key={x.id}
            className={`seg k-${x.kind}${x.id === "open" ? " running" : ""}`}
            style={{
              left: `${percent(x.start)}%`,
              width: `${percent(x.end) - percent(x.start)}%`,
            }}
          />
        ))}
      </div>
      <div className="ticks">
        {ticks.map((n) => (
          <i
            key={n}
            className={n % 3600000 === 0 ? "h" : n % 900000 === 0 ? "q" : ""}
            style={{ left: `${percent(n)}%` }}
          />
        ))}
      </div>
      <div className="labels">
        {[0, 1 / 3, 2 / 3, 1].map((f, i) => (
          <span
            key={i}
            className={i === 0 ? "first" : i === 3 ? "last" : ""}
            style={{ left: `${f * 100}%` }}
          >
            {time(new Date(first + span * f).toISOString(), job.site_timezone)}
          </span>
        ))}
      </div>
      {open && <i className="pointer" style={{ left: `${percent(now)}%` }} />}
    </div>
  );
}
export function RunningTimerBanner() {
  const r = useResource<{
    timer: {
      appointment_id: string;
      reference: string;
      state: string;
      pause_reason: PauseReason | null;
    } | null;
    unavailable: boolean;
  }>("my-jobs/timer");
  const reloadTimer = r.reload;
  useEffect(() => {
    const refresh = () => reloadTimer();
    window.addEventListener("focus", refresh);
    const handle = setInterval(refresh, 15000);
    return () => {
      window.removeEventListener("focus", refresh);
      clearInterval(handle);
    };
  }, [reloadTimer]);
  if (r.error)
    return <ReadState loading={false} error={r.error} retry={r.reload} />;
  if (r.data?.unavailable)
    return (
      <p className="business-notice">
        Your open timer is retained for work that is no longer accessible. Ask
        Service to restore legitimate access so you can resolve it before timing
        another job.
      </p>
    );
  const t = r.data?.timer;
  if (!t) return null;
  return (
    <aside className="field-timer-banner">
      <div>
        <strong>
          {t.state === "Running"
            ? "Your work timer is running"
            : "Your work timer is paused"}
        </strong>
        <p>
          {t.reference}
          {t.pause_reason ? ` · ${pauseLabels[t.pause_reason]}` : ""}
        </p>
      </div>
      <Link href={`/my-jobs/${t.appointment_id}`}>Open this timer</Link>
    </aside>
  );
}
export function WorkTimer({
  job,
  jobCurrent,
  reloadJob,
  onCorrect,
  onSection,
  children,
}: {
  job: Job;
  jobCurrent: boolean;
  reloadJob: () => void;
  onCorrect: (entry: TimeEntry) => void;
  onSection: (section: string) => void;
  children: ReactNode;
}) {
  const r = useResource<TimerView>(`my-jobs/${job.id}/timer`),
    v = r.data,
    t = v?.timer;
  const reloadTimer = r.reload;
  const [now, setNow] = useState(() => Date.now()),
    [compact, setCompact] = useState(false),
    [dialog, setDialog] = useState<DialogState | null>(null);
  const [task, setTask] = useState(""),
    [asset, setAsset] = useState(""),
    [pause, setPause] = useState<PauseReason>("Break"),
    [note, setNote] = useState(""),
    [finish, setFinish] = useState("");
  const figure = useRef<HTMLDivElement>(null),
    work = useRef<HTMLDivElement>(null);
  const command = useCrmCommand(() => {
    setDialog(null);
    r.reload();
    reloadJob();
  });
  const blocked = command.busy || command.uncertain;
  const offset = useRef(0);
  useEffect(() => {
    if (v) offset.current = Date.parse(v.server_now) - Date.now();
  }, [v]);
  useEffect(() => {
    const h = setInterval(() => setNow(Date.now() + offset.current), 1000);
    return () => clearInterval(h);
  }, []);
  useEffect(() => {
    const target = figure.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      // A clock below a narrow viewport has not been scrolled past. Treating
      // both directions alike alternately shrinks/expands the header until
      // the clock crosses the lower edge on every frame.
      ([e]) =>
        setCompact(
          !e.isIntersecting &&
            e.boundingClientRect.bottom <= (e.rootBounds?.top ?? 0),
        ),
      { threshold: 0, root: work.current?.closest("main") ?? null },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [job.id]);
  const refreshCurrent = useEffectEvent(() => {
    if (!blocked && !dialog) {
      reloadTimer();
      reloadJob();
    }
  });
  const attendanceId = job.attendance?.id;
  const observedAttendance = useRef(attendanceId);
  const refreshArrival = useEffectEvent(() => reloadTimer());
  useEffect(() => {
    // Arrival is saved by the surrounding field workspace. Its refreshed job
    // must immediately invalidate our pre-arrival timer authority; waiting for
    // the periodic refresh leaves a newly authorised Start disabled.
    if (observedAttendance.current !== attendanceId) {
      observedAttendance.current = attendanceId;
      refreshArrival();
    }
  }, [attendanceId]);
  useEffect(() => {
    // The elapsed display renders every second. Keep this subscription stable
    // while its event reads current callbacks and command/dialog state.
    const refresh = () => refreshCurrent();
    window.addEventListener("focus", refresh);
    const h = setInterval(refresh, 15000);
    return () => {
      clearInterval(h);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const mine = job.entries.filter(
    (e) =>
      e.attendance_id === job.attendance?.id &&
      e.kind === "Time" &&
      !e.superseded,
  );
  const totals = mine.reduce(
    (out, e) => {
      const key = String(e.payload.time_kind);
      out[key] = (out[key] ?? 0) + Number(e.payload.elapsed_seconds);
      return out;
    },
    {} as Record<string, number>,
  );
  const openSeconds = t?.open_since
    ? Math.max(0, Math.floor((now - Date.parse(t.open_since)) / 1000))
    : 0;
  const labour =
      (totals.Labour ?? 0) + (t?.state === "Running" ? openSeconds : 0),
    notLabour =
      Object.entries(totals)
        .filter(([k]) => k !== "Labour")
        .reduce((n, [, x]) => n + x, 0) +
      (t?.state === "Paused" ? openSeconds : 0);
  const closedWithoutAttendance =
    !job.attendance && visitArrivalGuidance(job.status, false).closed;
  const label = closedWithoutAttendance
    ? "Visit closed"
    : v?.capture_closed
    ? "Timer closed"
    : t?.state === "Running"
      ? openSeconds > 43200
        ? "Timer still running"
        : "Working"
      : t?.state === "Paused"
        ? "Paused"
        : t?.state === "Stopped"
          ? "Stopped"
          : v?.currentness === "Current"
            ? "Ready to start"
            : "Can't start yet";
  const state = closedWithoutAttendance || v?.capture_closed
    ? "closed"
    : t?.state === "Running"
      ? openSeconds > 43200
        ? "alert"
        : "working"
      : t?.state === "Paused"
        ? "paused"
        : t?.state === "Stopped"
          ? "stopped"
          : v?.currentness === "Current"
            ? "ready"
            : "blocked";
  const current =
    jobCurrent &&
    !!v &&
    !r.loading &&
    !r.error &&
    v.currentness === "Current" &&
    !v.capture_closed;
  const canFinish =
    jobCurrent &&
    !!v &&
    !r.loading &&
    !r.error &&
    !v.capture_closed &&
    !!t &&
    t.state !== "Stopped";
  const undoSeconds = v?.undo
    ? Math.max(0, Math.ceil((Date.parse(v.undo.expires_at) - now) / 1000))
    : 0;
  const begin = (action: DialogState["action"]) => {
    if (blocked) return;
    command.discard();
    setTask(t?.scope_item_id ?? job.scope.items[0]?.id ?? "");
    setAsset(t?.asset_id ?? "");
    setNote("");
    setPause("Break");
    setFinish(wholeSecond());
    setDialog({ action, version: t?.version ?? 0 });
  };
  const close = () => {
    if (blocked) return;
    if (
      command.hasUnsavedChanges &&
      !window.confirm("Discard the unsaved timer note?")
    )
      return;
    command.discard();
    setDialog(null);
  };
  async function send(
    action: TimerAction,
    extra: Record<string, unknown> = {},
  ) {
    if (!job.attendance) return;
    await command.send(`my-jobs/${job.id}/timer`, {
      attendance_id: job.attendance.id,
      expected_version: dialog?.version ?? t?.version ?? 0,
      action,
      occurred_at: timerInstant(
        t?.last_occurred_at ?? job.attendance.captured_at,
      ),
      scope_item_id: null,
      asset_id: null,
      pause_reason: null,
      note: null,
      undo_event_id: null,
      reason: `${action} work timer`,
      ...extra,
    });
  }
  const section = (name: string) => {
    setDialog(null);
    onSection(name);
    requestAnimationFrame(() =>
      document
        .getElementById("field-execution")
        ?.scrollIntoView({ block: "start" }),
    );
  };
  const menu = (
    <>
      <div className="menu-title">
        <strong>Job</strong>
        <span>{job.reference}</span>
      </div>
      <nav aria-label="Job sections">
        <ul>
          <li>
            <a
              href="#timer-overview"
              onClick={() => setDialog(null)}
              aria-current="page"
            >
              Overview
            </a>
          </li>
          <li>
            {job.pack?.current_issue_id ? (
              <Link href={`/documents/${job.pack.current_issue_id}`}>
                Job pack
              </Link>
            ) : (
              <span>Job pack unavailable</span>
            )}
          </li>
          <li>
            <a
              href="#field-execution"
              onClick={(e) => {
                e.preventDefault();
                section("Capture");
              }}
            >
              Field notes and parts
            </a>
          </li>
          <li>
            <a href="#field-context" onClick={() => setDialog(null)}>
              Scope and limits
            </a>
          </li>
          <li>
            <a href="#field-equipment" onClick={() => setDialog(null)}>
              Equipment
            </a>
          </li>
          <li>
            <a href="#field-contact" onClick={() => setDialog(null)}>
              Customer contact
            </a>
          </li>
          <li>
            <a
              href="#field-execution"
              onClick={(e) => {
                e.preventDefault();
                section("Completion");
              }}
            >
              Completion{" "}
              <span className="meta">
                {job.report?.status ?? "Not submitted"}
              </span>
            </a>
          </li>
        </ul>
      </nav>
      <div className="menu-group">
        <h2>Job details</h2>
        <dl className="facts">
          <div>
            <dt>Work order</dt>
            <dd>{job.work_order.reference}</dd>
          </div>
          <div>
            <dt>Site</dt>
            <dd>{job.site.name}</dd>
          </div>
          <div>
            <dt>Visit</dt>
            <dd>
              <Stamp
                value={job.scheduled_start_at}
                timezone={job.site_timezone}
              />
            </dd>
          </div>
          <div>
            <dt>Job labour allowance</dt>
            <dd>Not established</dd>
          </div>
        </dl>
      </div>
    </>
  );
  const controls = (phone = false) => (
    <>
      {closedWithoutAttendance ? (
        <Button variant="primary" className="primary" disabled>
          Visit closed
        </Button>
      ) : !t || t.state === "Stopped" ? (
        <Button
          variant="primary"
          className="primary"
          disabled={!current || blocked}
          onClick={() => begin(t ? "Resume" : "Start")}
        >
          {t ? "Resume work" : "Start work"}
        </Button>
      ) : t.state === "Running" ? (
        <>
          <Button
            disabled={!canFinish || blocked}
            onClick={() => begin("Pause")}
          >
            Pause
          </Button>
          <Button
            variant="primary"
            className="primary"
            disabled={!canFinish || blocked || openSeconds > 172800}
            onClick={() => void send("Stop")}
          >
            Stop work
          </Button>
        </>
      ) : (
        <>
          <Button
            disabled={!canFinish || blocked || openSeconds > 172800}
            onClick={() => void send("Stop")}
          >
            Stop work
          </Button>
          <Button
            variant="primary"
            className="primary"
            disabled={!current || blocked || openSeconds > 172800}
            onClick={() => begin("Resume")}
          >
            Resume work
          </Button>
        </>
      )}
      {t && t.state !== "Stopped" && openSeconds > 43200 && (
        <Button
          disabled={!canFinish || blocked}
          onClick={() => begin("Finish")}
        >
          {phone ? "Set when I finished" : "Set finish time"}
        </Button>
      )}
    </>
  );
  const clock = elapsedLabel(labour);
  return (
    <div id="ppo-work-timer" data-menu="docked">
      <div className="frame">
        <aside className="menu">{menu}</aside>
        <div className="work" ref={work}>
          <header className="head" data-compact={compact ? "1" : "0"}>
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href="/my-jobs">My Jobs</Link>
              <span>/</span>
              <span>{job.reference}</span>
              <Button
                className="timer-menu-toggle quiet"
                onClick={() => begin("Menu")}
              >
                Job sections
              </Button>
            </nav>
            <div className="title-row">
              <h1>{job.scope.summary}</h1>
              <p className="tag" data-state={state}>
                {t?.state === "Running" && (
                  <span className="live" aria-hidden="true" />
                )}
                {label}
              </p>
              <span className="mini" aria-hidden="true">
                <span className="num">{clock.slice(0, -3)}</span>
                <span className="note">Labour</span>
              </span>
            </div>
            <div className="actions">{controls()}</div>
            <p className="context">
              <span>
                <strong>{job.customer_name}</strong> · {job.site.name}
              </span>
              <span>
                {time(job.scheduled_start_at, job.site_timezone)}–
                {time(job.scheduled_end_at, job.site_timezone)} ·{" "}
                {job.site_timezone}
              </span>
            </p>
          </header>
          <ReadState
            loading={r.loading}
            error={r.error}
            retry={r.reload}
            retained={!!v}
          />
          <div className="banner-row info">
            <p>
              Work timer records attributable job-cost time. Arrival, customer
              agreement, payroll and billability are separate.
            </p>
            <Link href={`/my-jobs/site-readiness?appointment_id=${job.id}`}>
              Site readiness
            </Link>
            <a href="/offline/index.html">Saved offline jobs</a>
          </div>
          {v?.currentness !== "Current" && (
            <div className="banner-row">
              <p>
                {v?.capture_closed
                  ? "This attendance's evidence is frozen. Timer history remains; further physical work needs a separate visit."
                  : visitArrivalGuidance(job.status, !!job.attendance).closed
                    ? visitArrivalGuidance(job.status, !!job.attendance).visit +
                      (job.attendance
                        ? " Your own attendance and timer history remain. Resolve already observed time under the existing evidence rules."
                        : " You have no recorded arrival here. Further attendance requires a separate visit.")
                    : job.attendance
                      ? "Work authority needs review. You can retain already observed time; starting or resuming requires current authority."
                      : visitArrivalGuidance(job.status, false).next}
              </p>
            </div>
          )}
          {openSeconds > 43200 && (
            <div className="banner-row danger">
              <p>
                <strong>
                  This stretch has been open for more than 12 hours.
                </strong>{" "}
                Set when you actually finished; no automatic finish has been
                invented.
              </p>
            </div>
          )}
          <section
            id="timer-overview"
            className="timer"
            data-still={t?.state !== "Running"}
            data-idle={!t}
            aria-label="Work timer"
          >
            <div className="timer-body">
              <div className="timer-top">
                <div className="figure" ref={figure}>
                  <span className="figure-label">Labour on this visit</span>
                  <div className="elapsed" aria-label={`${clock} labour`}>
                    <span className="hm">{clock.slice(0, -3)}</span>
                    <span className="ss">{clock.slice(-3)}</span>
                  </div>
                </div>
                <dl className="readouts">
                  <div className="readout">
                    <dt>This stretch</dt>
                    <dd>{elapsedLabel(openSeconds).slice(0, -3)}</dd>
                    <dd>{t?.time_kind ?? "Not running"}</dd>
                  </div>
                  <div className="readout">
                    <dt>Booking</dt>
                    <dd>
                      {elapsedLabel(
                        (Date.parse(job.scheduled_end_at) -
                          Date.parse(job.scheduled_start_at)) /
                          1000,
                      ).slice(0, -3)}
                    </dd>
                    <dd>Scheduled visit</dd>
                  </div>
                  <div className="readout">
                    <dt>Not counted as labour</dt>
                    <dd>{elapsedLabel(notLabour).slice(0, -3)}</dd>
                    <dd>Travel, breaks and waiting</dd>
                  </div>
                </dl>
              </div>
              <VisitTrack
                job={job}
                entries={mine}
                open={
                  t?.open_since
                    ? { start: t.open_since, kind: t.time_kind! }
                    : null
                }
                now={now}
              />
              {t?.pause_reason && (
                <p className="reason">
                  <strong>{pauseLabels[t.pause_reason]}</strong>
                  {t.note}
                </p>
              )}
            </div>
            <footer className="timer-foot">
              <p className="save-line" role="status">
                {command.status === "Unsaved"
                  ? t
                    ? "Timer saved to the server"
                    : "No timer started"
                  : command.status}
              </p>
              <Button
                className="quiet"
                disabled={blocked}
                onClick={() => {
                  r.reload();
                  reloadJob();
                }}
              >
                Refresh timer
              </Button>
            </footer>
          </section>
          <ErrorNotice error={command.error} />
          {command.uncertain && (
            <div className="banner-row danger">
              <p>
                The result is unknown. Confirm the original action before taking
                another timer action.
              </p>
              <Button
                onClick={() => void command.reconcile()}
                busy={command.busy}
              >
                Confirm original action
              </Button>
            </div>
          )}
          {undoSeconds > 0 && v?.undo && (
            <div className="banner-row info">
              <p>
                Original time is saved. Undo appends a reversing event; history
                is retained.
              </p>
              <Button
                disabled={blocked}
                onClick={() =>
                  void send("Undo", { undo_event_id: v.undo!.event_id })
                }
              >
                Undo · {undoSeconds}s
              </Button>
            </div>
          )}
          <section aria-labelledby="timer-time-title">
            <div className="section-head">
              <div>
                <h2 id="timer-time-title">Time recorded</h2>
                <p>
                  Captured on this visit · Service review and charging remain
                  separate
                </p>
              </div>
              <Button className="text" onClick={() => section("Capture")}>
                Add time manually
              </Button>
            </div>
            {!mine.length && !t?.open_since ? (
              <p className="timer-empty">
                No time recorded yet. Start work or record an attributable
                manual interval.
              </p>
            ) : (
              <table className="stretches">
                <thead>
                  <tr>
                    <th>Kind</th>
                    <th>Time ({job.site_timezone}) and note</th>
                    <th className="c-dur">Duration</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mine.map((e) => (
                    <tr key={e.id}>
                      <td className="c-kind">
                        <span className={`chip ${e.payload.time_kind}`}>
                          {e.payload.time_kind}
                        </span>
                      </td>
                      <td className="c-when">
                        <span className="when">
                          {time(String(e.payload.start_at), job.site_timezone)}–
                          {time(String(e.payload.end_at), job.site_timezone)}
                        </span>
                        <span className="note">
                          {String(e.payload.note ?? "")}
                          {e.supersedes_entry_id
                            ? " · Corrected; original retained"
                            : ""}
                        </span>
                      </td>
                      <td className="c-dur">
                        {elapsedLabel(Number(e.payload.elapsed_seconds))}
                      </td>
                      <td className="c-state">
                        {e.authority_state === "Current"
                          ? "Server saved"
                          : "Review required"}
                      </td>
                      <td className="c-act">
                        <Button className="quiet" onClick={() => onCorrect(e)}>
                          Correct
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {t?.open_since && (
                    <tr
                      className={`running${t.state === "Paused" ? " waiting" : ""}`}
                    >
                      <td className="c-kind">{t.time_kind}</td>
                      <td className="c-when">
                        {time(t.open_since, job.site_timezone)}–now
                      </td>
                      <td className="c-dur">{elapsedLabel(openSeconds)}</td>
                      <td className="c-state">Open stretch</td>
                      <td className="c-act">
                        {t.state === "Paused" ? "Paused" : "Running"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
            <div className="totals">
              <ul>
                {Object.entries(totals).map(([kind, total]) => (
                  <li key={kind}>
                    <i className={`k-${kind}`} aria-hidden="true" />
                    {kind} <b>{elapsedLabel(total)}</b>
                  </li>
                ))}
              </ul>
              <span>Corrections need a reason and keep the original.</span>
            </div>
          </section>
          <section aria-labelledby="timer-activity-title">
            <div className="section-head">
              <h2 id="timer-activity-title">Activity</h2>
            </div>
            <ol className="timer-events">
              {v?.events
                .slice()
                .reverse()
                .map((e) => (
                  <li key={e.id}>
                    <Stamp value={e.occurred_at} timezone={job.site_timezone} />
                    <div>
                      <strong>
                        {e.action === "Undo"
                          ? "Timer action reversed"
                          : `${e.action} work timer`}
                      </strong>
                      <p>
                        {e.pause_reason
                          ? pauseLabels[e.pause_reason]
                          : e.state_after}{" "}
                        · {job.assignment.name}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                      <small>
                        {e.authority_state === "Current"
                          ? "Server saved"
                          : "Review required"}{" "}
                        · {e.reason}
                      </small>
                    </div>
                  </li>
                ))}
            </ol>
            {!v?.events.length && (
              <p className="timer-empty">No timer activity has been saved.</p>
            )}
          </section>
          <div className="timer-existing">{children}</div>
          <div className="dock">
            <div className="compact">
              <span>{label}</span>
              <span className="num">{clock}</span>
            </div>
            <div className="dock-buttons">{controls(true)}</div>
          </div>
        </div>
      </div>
      {dialog && (
        <TimerDialog
          title={
            dialog.action === "Menu"
              ? "Job sections"
              : dialog.action === "Pause"
                ? "Pause work"
                : dialog.action === "Finish"
                  ? "Set when you finished"
                  : `${dialog.action} work`
          }
          onClose={close}
          locked={blocked}
        >
          {dialog.action === "Menu" ? (
            <div className="sheet-body timer-menu-dialog">{menu}</div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (dialog.action === "Menu") return;
                void send(dialog.action === "Finish" ? "Stop" : dialog.action, {
                  ...(dialog.action === "Start" || dialog.action === "Resume"
                    ? { scope_item_id: task, asset_id: asset || null }
                    : {}),
                  ...(dialog.action === "Pause" ? { pause_reason: pause } : {}),
                  note: note || null,
                  ...(dialog.action === "Finish"
                    ? {
                        occurred_at: finish,
                        reason: `Finish time set by you: ${note}`,
                      }
                    : {}),
                });
              }}
            >
              <div className="sheet-body">
                <p>
                  {dialog.action === "Start"
                    ? "Starting creates a retained timer event for this task. It does not record arrival or approve payment."
                    : dialog.action === "Pause"
                      ? "The chosen pause will be recorded separately from labour."
                      : dialog.action === "Finish"
                        ? "Choose the actual finish in Site time. The original start and your reason are retained."
                        : "Your earlier time stays recorded. Resume only the current authorised work."}
                </p>
                {(dialog.action === "Start" || dialog.action === "Resume") && (
                  <>
                    <label className="field">
                      Authorised task
                      <select
                        value={task}
                        required
                        onChange={(e) => {
                          setTask(e.target.value);
                          setAsset("");
                          command.dirty();
                        }}
                      >
                        {job.scope.items.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.sequence}. {x.description}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      Affected equipment
                      <select
                        value={asset}
                        required={
                          !!job.scope.items.find((x) => x.id === task)?.assets
                            .length
                        }
                        onChange={(e) => {
                          setAsset(e.target.value);
                          command.dirty();
                        }}
                      >
                        <option value="">
                          Choose equipment where required
                        </option>
                        {job.scope.items
                          .find((x) => x.id === task)
                          ?.assets.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.reference} · {a.description}
                            </option>
                          ))}
                      </select>
                    </label>
                  </>
                )}
                {dialog.action === "Pause" && (
                  <fieldset>
                    <legend>Reason for pausing</legend>
                    <div className="timer-pause-options">
                      {pauseReasons.map((x) => (
                        <Button
                          key={x}
                          aria-pressed={pause === x}
                          disabled={blocked}
                          onClick={() => {
                            setPause(x);
                            if (!pauseNeedsNote(x))
                              void send("Pause", { pause_reason: x });
                            else command.dirty();
                          }}
                        >
                          {pauseLabels[x]}
                          {pauseNeedsNote(x) ? " · note required" : ""}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                )}
                {dialog.action === "Finish" && (
                  <LocalDateTimeField
                    name="timer-finish"
                    label="Actual finish (Site time)"
                    value={finish}
                    timezone={job.site_timezone}
                    onChange={(value) => {
                      setFinish(value);
                      command.dirty();
                    }}
                  />
                )}
                <label className="field">
                  {dialog.action === "Finish"
                    ? "Reason for setting the finish time"
                    : "Short note"}
                  <textarea
                    value={note}
                    required={
                      dialog.action === "Finish" ||
                      (dialog.action === "Pause" && pauseNeedsNote(pause))
                    }
                    maxLength={2000}
                    onChange={(e) => {
                      setNote(e.target.value);
                      command.dirty();
                    }}
                  />
                </label>
                <ErrorNotice error={command.error} />
                <p role="status">{command.status}</p>
              </div>
              <footer className="sheet-actions">
                <Button onClick={close} disabled={blocked}>
                  Cancel
                </Button>
                {command.uncertain ? (
                  <Button
                    onClick={() => void command.reconcile()}
                    busy={command.busy}
                  >
                    Confirm original action
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="primary"
                    className="primary"
                    busy={command.busy}
                  >
                    {dialog.action === "Finish"
                      ? "Save actual finish"
                      : dialog.action === "Pause"
                        ? "Pause with this reason"
                        : `${dialog.action} work`}
                  </Button>
                )}
              </footer>
            </form>
          )}
        </TimerDialog>
      )}
    </div>
  );
}
