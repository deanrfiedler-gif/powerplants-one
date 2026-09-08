"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { ErrorNotice, isDenied, useCommand, useResource } from "./business-ui";
import { useIdentity } from "./business-session";
import { ProductIcon } from "./product-icons";
import "./email-calendar.css";
type Summary = {
  id: string;
  subject: string;
  sender_name: string;
  received_at: string;
  opportunity_id: string | null;
  followup_id: string | null;
};
type Message = Summary & {
  version: number;
  body_text: string;
  sender_address: string;
  opportunity: { id: string; title: string; display_number: string } | null;
  followup: {
    id: string;
    summary: string;
    due_at: string;
    status: string;
  } | null;
};
const localDate = (
  v: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) =>
  new Date(v).toLocaleString("en-AU", {
    timeZone: "Australia/Brisbane",
    ...options,
  });
function Tabs({ calendar = false }: { calendar?: boolean }) {
  return (
    <nav className="ec-tabs" aria-label="Email and Calendar">
      <Link href="/email" aria-current={!calendar ? "page" : undefined}>
        Email
      </Link>
      <Link href="/calendar" aria-current={calendar ? "page" : undefined}>
        Calendar
      </Link>
    </nav>
  );
}
export function EmailInbox() {
  const [search, setSearch] = useState("");
  const r = useResource<{ items: Summary[]; truncated: boolean }>(
    `email?search=${encodeURIComponent(search)}`,
  );
  return (
    <section className="ec-page">
      <Tabs />
      <div className="ec-heading">
        <div>
          <h1>Email</h1>
          <p>Private synthetic mailbox</p>
        </div>
        <Link href="/calendar">Open calendar</Link>
      </div>
      <label className="ec-search">
        Search email
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Sender or subject"
        />
      </label>
      <ErrorNotice error={r.error} />
      {r.loading ? (
        <p role="status">Loading email…</p>
      ) : (
        <div className="ec-inbox">
          {r.data?.items.map((m) => (
            <Link className="ec-mail" key={m.id} href={`/email/${m.id}`}>
              <span className="ec-sender">{m.sender_name}</span>
              <time>
                {localDate(m.received_at, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
              <strong>{m.subject}</strong>
              <span className="ec-muted">
                Private ·{" "}
                {m.opportunity_id ? "Linked to opportunity" : "Not linked"}
                {m.followup_id ? " · Follow-up planned" : ""}
              </span>
            </Link>
          ))}
          {r.data && !r.data.items.length && <p>No matching emails.</p>}
        </div>
      )}
      {r.data?.truncated && (
        <p>Showing the first 100 results. Narrow your search.</p>
      )}
      <p className="ec-note">
        Fictional correspondence. Microsoft is not connected.
      </p>
    </section>
  );
}
export function EmailDetail({ id }: { id: string }) {
  const r = useResource<Message>(`email/${id}`),
    options = useResource<{
      items: { id: string; title: string; display_number: string }[];
      truncated: boolean;
    }>(`email/${id}/options`),
    cmd = useCommand(),
    identity = useIdentity();
  const [selected, setSelected] = useState(""),
    [summary, setSummary] = useState(""),
    [due, setDue] = useState("2026-09-09T09:00");
  const activityId = useRef<string | null>(null);
  const m = isDenied(cmd.error) ? null : r.data;
  async function saveLink() {
    if (!m || !selected) return;
    const saved = await cmd.send(`email/${id}/link`, {
      expected_version: m.version,
      opportunity_id: selected,
      reason: "Explicitly link private email to opportunity",
    });
    if (saved) r.reload();
  }
  async function followup() {
    if (!m) return;
    if (!activityId.current) activityId.current = crypto.randomUUID();
    const instant = new Date(due + ":00+10:00");
    if (!due || !Number.isFinite(instant.getTime())) return;
    const saved = await cmd.send(`email/${id}/follow-up`, {
      expected_version: m.version,
      activity_id: activityId.current,
      summary,
      due_at: instant.toISOString(),
      reason: "Create internal follow-up from private email",
    });
    if (saved) r.reload();
  }
  return (
    <section className="ec-page">
      <Tabs />
      <Link href="/email">← Back to email</Link>
      <ErrorNotice error={r.error} />
      <ErrorNotice error={cmd.error} />
      {r.loading ? (
        <p role="status">Loading email…</p>
      ) : (
        m && (
          <>
            <div className="ec-heading">
              <div>
                <h1>{m.subject}</h1>
                <p>Private · only your mailbox</p>
              </div>
            </div>
            <div className="ec-detail">
              <article className="ec-message">
                <strong>{m.sender_name}</strong>
                <p className="ec-muted">{m.sender_address}</p>
                <p className="ec-muted">
                  To {identity.display_name} · {localDate(m.received_at)} AEST
                </p>
                <div className="ec-body">{m.body_text}</div>
              </article>
              <aside className="ec-context">
                <section>
                  <h2>Linked opportunity</h2>
                  {m.opportunity ? (
                    <Link href={`/crm/opportunities/${m.opportunity.id}`}>
                      {m.opportunity.display_number} · {m.opportunity.title}
                    </Link>
                  ) : (
                    <p>Choose the opportunity this email belongs to.</p>
                  )}
                  {!m.followup && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void saveLink();
                      }}
                    >
                      <label>
                        Opportunity
                        <select
                          aria-label="Opportunity"
                          required
                          value={selected}
                          onChange={(e) => setSelected(e.target.value)}
                          disabled={cmd.busy}
                        >
                          <option value="">Choose an opportunity</option>
                          {options.data?.items.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.display_number} · {o.title}
                            </option>
                          ))}
                        </select>
                      </label>
                      <ErrorNotice error={options.error} />
                      {options.data && !options.data.items.length && (
                        <Link href="/crm/opportunities/new">
                          Create an opportunity
                        </Link>
                      )}
                      <button disabled={cmd.busy || !selected}>
                        Save link
                      </button>
                      <p className="ec-muted">
                        Linking keeps the email private.
                      </p>
                    </form>
                  )}
                </section>
                <section>
                  <h2>Follow-up</h2>
                  {m.followup ? (
                    <>
                      <p>
                        <strong>{m.followup.summary}</strong>
                      </p>
                      <p>
                        {localDate(m.followup.due_at)} AEST ·{" "}
                        {m.followup.status}
                      </p>
                      <Link
                        href={`/calendar?day=${new Date(Date.parse(m.followup.due_at) + 36000000).toISOString().slice(0, 10)}`}
                      >
                        View on calendar
                      </Link>
                    </>
                  ) : m.opportunity ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void followup();
                      }}
                    >
                      <label>
                        Action
                        <input
                          required
                          maxLength={160}
                          value={summary}
                          onChange={(e) => setSummary(e.target.value)}
                          disabled={cmd.busy}
                          placeholder="For example, confirm the site visit"
                        />
                      </label>
                      <label>
                        Due date and time · Brisbane
                        <input
                          required
                          type="datetime-local"
                          value={due}
                          onChange={(e) => setDue(e.target.value)}
                          disabled={cmd.busy}
                        />
                      </label>
                      <p className="ec-muted">
                        Owner: {identity.display_name}. This activity is visible
                        to permitted opportunity viewers.
                      </p>
                      <button disabled={cmd.busy}>Create follow-up</button>
                    </form>
                  ) : (
                    <p>Link an opportunity to plan a follow-up.</p>
                  )}
                </section>
                {cmd.saved && <p role="status">{cmd.saved}</p>}
              </aside>
            </div>
          </>
        )
      )}
    </section>
  );
}
type CalendarEvent = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  private: boolean;
  source: string;
};
type CalendarActivity = {
  id: string;
  title: string;
  due_at: string;
  status: string;
  source: string;
};
export function EmailCalendar({ initialDay }: { initialDay: string }) {
  const [day, updateDay] = useState(initialDay),
    [view, setView] = useState<"day" | "agenda">("day"),
    [source, setSource] = useState("all"),
    [selectedId, setSelectedId] = useState<string | null>(null);
  const modal = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const r = useResource<{
    meetings: CalendarEvent[];
    activities: CalendarActivity[];
    truncated: boolean;
  }>(`calendar?day=${day}`);
  const selected = [
    ...(r.data?.meetings ?? []),
    ...(r.data?.activities ?? []),
  ].find((item) => item.id === selectedId);
  const setDay = (value: string) => {
    updateDay(value);
    window.history.replaceState(
      window.history.state,
      "",
      `/calendar?day=${value}`,
    );
  };
  const date = new Date(day + "T12:00:00Z"),
    monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const shift = (n: number) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + n);
    setDay(d.toISOString().slice(0, 10));
  };
  const meetings = source === "activities" ? [] : (r.data?.meetings ?? []),
    activities = source === "meetings" ? [] : (r.data?.activities ?? []);
  function open(e: CalendarEvent | CalendarActivity) {
    opener.current = document.activeElement as HTMLElement;
    setSelectedId(e.id);
    modal.current?.showModal();
  }
  const minutes = (s: string) =>
    (Date.parse(s) - Date.parse(day + "T00:00:00+10:00")) / 60000;
  const start = Math.min(
      9,
      ...meetings.map((e) =>
        Math.max(0, Math.floor(minutes(e.starts_at) / 60)),
      ),
    ),
    end = Math.max(
      17,
      ...meetings.map((e) => Math.min(24, Math.ceil(minutes(e.ends_at) / 60))),
    );
  const dense = meetings.some(
    (e, i) =>
      minutes(e.ends_at) - minutes(e.starts_at) < 30 ||
      meetings.some(
        (f, j) =>
          i !== j &&
          Date.parse(e.starts_at) < Date.parse(f.ends_at) &&
          Date.parse(f.starts_at) < Date.parse(e.ends_at),
      ),
  );
  return (
    <section className="ec-page">
      <Tabs calendar />
      <div className="ec-calendar">
        <div className="ec-heading">
          <h1>Calendar</h1>
          <span className="ec-muted">Brisbane · AEST</span>
          <button className="secondary" onClick={() => r.reload()}>
            Refresh calendar
          </button>
        </div>
        <div className="ec-month">
          <button
            className="secondary"
            aria-label="Previous week"
            onClick={() => shift(-7)}
          >
            ‹
          </button>
          <label>
            Calendar date
            <input
              type="date"
              required
              value={day}
              onChange={(e) => {
                if (e.target.value) setDay(e.target.value);
              }}
            />
          </label>
          <button
            className="secondary"
            aria-label="Next week"
            onClick={() => shift(7)}
          >
            ›
          </button>
        </div>
        <nav className="ec-week" aria-label="Choose a day">
          {Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setUTCDate(d.getUTCDate() + i);
            const value = d.toISOString().slice(0, 10);
            return (
              <button
                key={value}
                className="secondary"
                aria-pressed={day === value}
                aria-label={d.toLocaleDateString("en-AU", {
                  timeZone: "UTC",
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                onClick={() => setDay(value)}
              >
                <span>
                  {d.toLocaleDateString("en-AU", {
                    timeZone: "UTC",
                    weekday: "short",
                  })}
                </span>
                <strong>{d.getUTCDate()}</strong>
              </button>
            );
          })}
        </nav>
        <div className="ec-controls">
          <h2>
            {date.toLocaleDateString("en-AU", {
              timeZone: "UTC",
              weekday: "long",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </h2>
          <div role="group" aria-label="Calendar view">
            <button
              className="secondary"
              aria-pressed={view === "day"}
              onClick={() => setView("day")}
            >
              Day
            </button>
            <button
              className="secondary"
              aria-pressed={view === "agenda"}
              onClick={() => setView("agenda")}
            >
              Agenda
            </button>
          </div>
          <label>
            Show
            <select
              aria-label="Show"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="all">All items</option>
              <option value="meetings">Meetings</option>
              <option value="activities">Activities</option>
            </select>
          </label>
        </div>
        <ErrorNotice error={r.error} />
        {r.loading ? (
          <p role="status">Loading calendar…</p>
        ) : (
          r.data && (
            <>
              <section className="ec-due">
                <h2>Due this day</h2>
                <p className="ec-muted">
                  PPO Activities · due times do not reserve calendar time
                </p>
                {activities.map((a) => (
                  <button
                    className="ec-activity secondary"
                    key={a.id}
                    onClick={() => open(a)}
                  >
                    <span>{localDate(a.due_at, { timeStyle: "short" })}</span>
                    <strong>{a.title}</strong>
                    <span>{a.status}</span>
                  </button>
                ))}
                {!activities.length && <p>No activities due.</p>}
              </section>
              {view === "day" && !dense && meetings.length > 0 ? (
                <div
                  className="ec-timeline"
                  style={{ height: (end - start) * 112 + 30 }}
                >
                  {Array.from({ length: end - start + 1 }, (_, i) => (
                    <div className="ec-hour" key={i} style={{ top: i * 112 }}>
                      <span>
                        {(start + i) % 12 || 12} {start + i < 12 ? "AM" : "PM"}
                      </span>
                    </div>
                  ))}
                  {meetings.map((e) => (
                    <button
                      className={`ec-time-event secondary ${e.private ? "ec-private" : ""}`}
                      key={e.id}
                      style={{
                        top:
                          ((Math.max(start * 60, minutes(e.starts_at)) -
                            start * 60) *
                            112) /
                          60,
                        height:
                          ((Math.min(end * 60, minutes(e.ends_at)) -
                            Math.max(start * 60, minutes(e.starts_at))) *
                            112) /
                            60 -
                          3,
                      }}
                      onClick={() => open(e)}
                      aria-label={`${e.title}, ${localDate(e.starts_at)} to ${localDate(e.ends_at)} AEST`}
                    >
                      <strong>{e.title}</strong>
                      <span>
                        {localDate(e.starts_at, { timeStyle: "short" })}–
                        {localDate(e.ends_at, { timeStyle: "short" })} ·{" "}
                        {e.private ? "Private" : "Synthetic Outlook"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <section className="ec-meetings">
                  <h2>Meetings</h2>
                  {dense && view === "day" && (
                    <p className="ec-muted">
                      Agenda shown to keep short or overlapping meetings
                      readable.
                    </p>
                  )}
                  {meetings.map((e) => (
                    <button
                      key={e.id}
                      className={`ec-meeting secondary ${e.private ? "ec-private" : ""}`}
                      onClick={() => open(e)}
                    >
                      <span>
                        {localDate(e.starts_at, { timeStyle: "short" })}–
                        {localDate(e.ends_at, { timeStyle: "short" })}
                      </span>
                      <strong>{e.title}</strong>
                      <span>{e.private ? "Private" : "Synthetic Outlook"}</span>
                    </button>
                  ))}
                  {!meetings.length && <p>No meetings for this date.</p>}
                </section>
              )}
              {r.data.truncated && <p>First 100 items per source shown.</p>}
            </>
          )
        )}
        <p className="ec-note">
          Fictional meetings · No Outlook connection or invitations.
        </p>
      </div>
      <dialog
        className="ec-dialog"
        ref={modal}
        aria-labelledby="ec-event-title"
        onClose={() => opener.current?.focus()}
      >
        <div className="ec-heading">
          <h2 id="ec-event-title">
            {r.data && !isDenied(r.error)
              ? selected?.title
              : "Event unavailable"}
          </h2>
          <button
            className="secondary"
            aria-label="Close event details"
            onClick={() => modal.current?.close()}
          >
            <ProductIcon name="close" />
          </button>
        </div>
        {selected && r.data && !isDenied(r.error) && (
          <>
            <p>{selected.source}</p>
            <p>
              {localDate(
                "due_at" in selected ? selected.due_at : selected.starts_at,
              )}{" "}
              AEST
            </p>
            {"due_at" in selected ? (
              <>
                <p>{selected.status} · Internal follow-up</p>
                <Link
                  href={`/work/${selected.id}`}
                  onClick={() => modal.current?.close()}
                >
                  Open activity
                </Link>
              </>
            ) : (
              <p>Ends {localDate(selected.ends_at)} AEST · Read only</p>
            )}
          </>
        )}
      </dialog>
    </section>
  );
}
