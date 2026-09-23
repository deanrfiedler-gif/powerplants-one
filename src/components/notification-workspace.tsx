"use client";
import Link from "next/link";
import { MyWorkLayoutPreferences } from "../activities/components/client/my-work-views";
import { SavedViewControls } from "./saved-view-controls";
import { useState } from "react";
import { api, ErrorNotice } from "./business-ui";
import { usePlatformResource } from "./platform-resource";
import { WorkDialog } from "../activities/components/client/my-work-ui";
import type {
  Notice,
  notificationInbox,
  notificationPreferences,
} from "../notifications/service";
import {
  categories,
  emailModes,
  type NotificationPreferences,
} from "../notifications/model";
import { navigateWithReview } from "./navigation-intent";
import { useUnsavedPreferences } from "./use-unsaved-preferences";

type Inbox = Awaited<ReturnType<typeof notificationInbox>>;
const categoryLabels = {
  OwnedWork: "Owned work",
  Changes: "Changes",
  Mentions: "Mentions",
  Documents: "Documents",
};
const changed = () =>
  window.dispatchEvent(new Event("ppo-notifications-changed"));
export function NotificationBell({ close }: { close: () => void }) {
  const read = usePlatformResource<Inbox>("notifications");
  return (
    <div>
      {read.loading && <p role="status">Loading updates…</p>}
      <ErrorNotice error={read.error} />
      {read.error && <button onClick={read.reload}>Retry notifications</button>}
      {read.data && (
        <>
          {read.data.state !== "unavailable" && (
            <p>
              {read.data.unread}
              {read.data.bounded || read.data.state === "partial"
                ? "+"
                : ""}{" "}
              unread · {read.data.owned} owned activities
            </p>
          )}
          {read.data.state !== "complete" && (
            <p role="alert">Some updates could not be checked.</p>
          )}
          <ul className="sh-bell-list">
            {read.data.items
              .filter((n) => !n.archived || n.required)
              .slice(0, 5)
              .map((n) => (
                <li key={n.id}>
                  <Link href={`/work/updates?notice=${n.id}`} onClick={close}>
                    {!n.is_read && "Unread · "}
                    {n.title}
                  </Link>
                  <small>{new Date(n.event_at).toLocaleString("en-AU")}</small>
                </li>
              ))}
          </ul>
          {!read.data.items.length && read.data.state === "complete" && (
            <p>No permitted updates yet.</p>
          )}
        </>
      )}
      <Link className="ppo-account-link" href="/work/updates" onClick={close}>
        Open Notifications
      </Link>
    </div>
  );
}
function PreferencesForm({
  saved,
  reload,
}: {
  saved: Awaited<ReturnType<typeof notificationPreferences>>;
  reload: () => void;
}) {
  const [draft, setDraft] = useState(saved.settings),
    [version, setVersion] = useState(saved.version),
    [baseline, setBaseline] = useState(saved.settings),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  // Source workflows use the same navigation review mechanism; preferences retain their draft.
  useUnsavedPreferences(dirty);
  const set = (patch: Partial<NotificationPreferences>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setMessage("");
  };
  return (
    <form
      className="sh-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(undefined);
        try {
          const next = await api<typeof saved>("notifications/preferences", {
            expected_version: version,
            settings: draft,
          });
          setVersion(next.version);
          setDraft(next.settings);
          setBaseline(next.settings);
          setMessage("Preferences saved. No messages were sent.");
          changed();
        } catch (e) {
          setError(e);
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>
        In-app notices stay visible. Email, push and SMS delivery are not
        connected. These settings record your preferences only.
      </p>
      <fieldset>
        <legend>Channels by category</legend>
        {categories.map((k) => (
          <label key={k}>
            {categoryLabels[k]} · In-app always on
            <select
              value={draft.categories[k].email}
              onChange={(e) =>
                set({
                  categories: {
                    ...draft.categories,
                    [k]: {
                      in_app: true,
                      email: e.target.value as (typeof emailModes)[number],
                    },
                  },
                })
              }
            >
              {emailModes.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Digest</legend>
        <label>
          Cadence
          <select
            value={draft.cadence}
            onChange={(e) =>
              set({ cadence: e.target.value as "Daily" | "Weekly" })
            }
          >
            <option>Daily</option>
            <option>Weekly</option>
          </select>
        </label>
        <label>
          Digest time
          <input
            type="time"
            value={draft.time}
            onChange={(e) => set({ time: e.target.value })}
            required
          />
        </label>
        {draft.cadence === "Weekly" && (
          <label>
            Weekday
            <select
              value={draft.weekday}
              onChange={(e) => set({ weekday: Number(e.target.value) })}
            >
              {[
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
              ].map((d, i) => (
                <option key={d} value={i}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Time zone
          <input
            value={draft.timezone}
            onChange={(e) => set({ timezone: e.target.value })}
            list="sh-timezones"
            required
          />
          <datalist id="sh-timezones">
            {[
              "Australia/Brisbane",
              "Australia/Sydney",
              "Australia/Perth",
              "UTC",
            ].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </datalist>
        </label>
        <label className="sh-check">
          <input
            type="checkbox"
            checked={draft.grouped}
            onChange={(e) => set({ grouped: e.target.checked })}
          />
          Group digest by source
        </label>
      </fieldset>
      <fieldset>
        <legend>Quiet hours</legend>
        <label className="sh-check">
          <input
            type="checkbox"
            checked={draft.quiet_enabled}
            onChange={(e) => set({ quiet_enabled: e.target.checked })}
          />
          Enable quiet hours
        </label>
        <label>
          Quiet hours start
          <input
            type="time"
            value={draft.quiet_start}
            onChange={(e) => set({ quiet_start: e.target.value })}
          />
        </label>
        <label>
          Quiet hours end
          <input
            type="time"
            value={draft.quiet_end}
            onChange={(e) => set({ quiet_end: e.target.value })}
          />
        </label>
        <p className="sh-muted">
          Quiet hours may cross midnight. They never hide required work. No
          delivery schedule is running.
        </p>
      </fieldset>
      <ErrorNotice error={error} />
      {(error as { code?: string })?.code === "VersionConflict" && (
        <button
          type="button"
          className="mw-button"
          onClick={async () => {
            const current = await api<typeof saved>(
              "notifications/preferences",
            );
            setVersion(current.version);
            setBaseline(current.settings);
            setMessage(
              "Current saved version loaded; your draft is retained. Review it before saving over the current copy.",
            );
          }}
        >
          Load current version and retain draft
        </button>
      )}
      <div className="sh-actions">
        <button
          className="mw-button mw-button-primary"
          disabled={busy || !dirty}
        >
          Save preferences
        </button>
        <button
          type="button"
          className="mw-button"
          disabled={busy}
          onClick={() => {
            setDraft(baseline);
            setError(undefined);
            reload();
          }}
        >
          Discard changes
        </button>
        <span role="status">
          {dirty ? "Unsaved changes" : message || "Saved preferences"}
        </span>
      </div>
    </form>
  );
}
function Preferences() {
  const read = usePlatformResource<
    Awaited<ReturnType<typeof notificationPreferences>>
  >("notifications/preferences", false);
  return (
    <>
      <ErrorNotice error={read.error} />
      {read.loading && <p role="status">Loading preferences…</p>}
      {read.data && <PreferencesForm saved={read.data} reload={read.reload} />}
    </>
  );
}
function NoticePreview({
  id,
  close,
  action,
}: {
  id: string;
  close: () => void;
  action: (action: string, items: Notice[]) => Promise<void>;
}) {
  const read = usePlatformResource<Notice>(`notifications/${id}`);
  return (
    <WorkDialog drawer title="Notification detail" onClose={close}>
      <ErrorNotice error={read.error} />
      {read.loading && <p role="status">Checking current source access…</p>}
      {read.error && (
        <>
          <p>
            The target is unavailable or access has changed. No source details
            are retained here.
          </p>
          <button className="mw-button" onClick={read.reload}>
            Retry source
          </button>
        </>
      )}
      {read.data && (
        <>
          <p className="sh-eyebrow">
            Activity · {read.data.is_read ? "Read" : "Unread"}
          </p>
          <h2>{read.data.title}</h2>
          <p>{read.data.context}</p>
          {read.data.stale && (
            <p className="sh-notice">
              This event refers to version {read.data.source_version}. The
              current authorised source is version {read.data.current_version}.
            </p>
          )}
          <dl className="sh-facts">
            <dt>Event time</dt>
            <dd>{new Date(read.data.event_at).toLocaleString("en-AU")}</dd>
            <dt>Current owner</dt>
            <dd>{read.data.owner_name}</dd>
            <dt>Due</dt>
            <dd>
              {read.data.due_at
                ? new Date(read.data.due_at).toLocaleString("en-AU")
                : "Date needed"}
            </dd>
            <dt>Source status</dt>
            <dd>{read.data.status}</dd>
          </dl>
          <p>
            You receive Activity events for work you own. Reading changes only
            your notification state.
          </p>
          <div className="sh-actions">
            <Link className="mw-button mw-button-primary" href={read.data.href}>
              Open source workflow
            </Link>
            <button
              className="mw-button"
              onClick={() =>
                void action(read.data!.is_read ? "unread" : "read", [
                  read.data!,
                ])
              }
            >
              {read.data.is_read ? "Mark unread" : "Mark read"}
            </button>
          </div>
        </>
      )}
    </WorkDialog>
  );
}
export function NotificationWorkspace() {
  const [view, setView] = useState("Inbox"),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState("All"),
    [archived, setArchived] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [notice, setNotice] = useState<string | null>(() =>
      typeof window === "undefined"
        ? null
        : new URLSearchParams(window.location.search).get("notice"),
    ),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const read = usePlatformResource<Inbox>("notifications"),
    data = read.data;
  const items = (data?.items ?? []).filter(
    (n) =>
      (archived ? n.archived && !n.required : !n.archived || n.required) &&
      (filter === "All" || (filter === "Unread" ? !n.is_read : n.is_read)) &&
      [n.title, n.context].join(" ").toLowerCase().includes(q.toLowerCase()),
  );
  async function action(name: string, notices: Notice[]) {
    setBusy(true);
    setError(undefined);
    try {
      await api("notifications/state", {
        action: name,
        items: notices.map((n) => ({ id: n.id, expected_version: n.version })),
      });
      setSelected([]);
      setMessage("Personal inbox state saved. Source work is unchanged.");
      changed();
      read.reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const row = (n: Notice) => (
    <li key={n.id}>
      <input
        type="checkbox"
        aria-label={`Select ${n.title}`}
        checked={selected.includes(n.id)}
        onChange={(e) =>
          setSelected(
            e.target.checked
              ? [...selected, n.id]
              : selected.filter((id) => id !== n.id),
          )
        }
      />
      <div>
        <button
          className={`sh-title ${n.is_read ? "" : "sh-unread"}`}
          onClick={() => setNotice(n.id)}
        >
          {n.title}
        </button>
        <p>
          {n.is_read ? "Read" : "Unread"} · Activity ·{" "}
          {new Date(n.event_at).toLocaleString("en-AU")}
          {n.required ? " · Required work" : ""}
        </p>
        <p>{n.context}</p>
      </div>
      <button
        className="mw-button"
        disabled={busy}
        onClick={() => void action(n.is_read ? "unread" : "read", [n])}
      >
        {n.is_read ? "Mark unread" : "Mark read"}
      </button>
    </li>
  );
  const groups = [...new Set(items.map((n) => n.source_id))];
  return (
    <div className="sh-workspace">
      <header className="sh-heading">
        <div>
          <p className="sh-eyebrow">My Work</p>
          <h1>Notifications</h1>
          <p>
            Updates and owned work, with decisions kept in their source
            workflows.
          </p>
        </div>
        <div className="sh-actions">
          {view !== "Preferences" && (
            <SavedViewControls
              target="updates"
              criteria={{ view, q, state: filter, archived: String(archived) }}
              apply={(c) => {
                setView(c.view ?? "Inbox");
                setQ(c.q ?? "");
                setFilter(c.state ?? "All");
                setArchived(c.archived === "true");
                setSelected([]);
              }}
            />
          )}
          <button className="mw-button" onClick={read.reload}>
            Refresh notifications
          </button>
        </div>
      </header>
      <nav className="sh-tabs" aria-label="Notification views">
        {["Inbox", "Grouped changes", "Owned escalations", "Preferences"].map(
          (v) => (
            <button
              key={v}
              aria-pressed={view === v}
              onClick={() =>
                navigateWithReview(() => {
                  setView(v);
                  setError(undefined);
                  setMessage("");
                  setSelected([]);
                })
              }
            >
              {v}
            </button>
          ),
        )}
      </nav>
      {view === "Preferences" ? (
        <>
          <Preferences />
          <MyWorkLayoutPreferences />
        </>
      ) : (
        <>
          <ErrorNotice error={read.error} />
          {read.loading && <p role="status">Loading notifications…</p>}
          {data && (
            <>
              {data.state !== "unavailable" && (
                <div className="sh-stats">
                  <span>
                    <strong>
                      {data.unread}
                      {data.bounded || data.state === "partial" ? "+" : ""}
                    </strong>
                    unread
                  </span>
                  <span>
                    <strong>{data.owned}</strong>owned activities
                  </span>
                  <span>
                    <strong>
                      {data.obligations.filter((a) => !a.due_at).length}
                    </strong>
                    date needed
                  </span>
                </div>
              )}
              {data.state !== "complete" && (
                <p className="sh-notice" role="alert">
                  {data.state === "partial"
                    ? "Partial source"
                    : "Source unavailable"}
                  . These counts are incomplete.{" "}
                  <button onClick={read.reload}>Retry</button>
                </p>
              )}
              {data.bounded && (
                <p className="sh-notice">
                  Showing the latest 200 permitted notices. Owned work remains
                  independent of this event window.
                </p>
              )}
              {view === "Owned escalations" ? (
                <>
                  <p>
                    Current owned Activities requiring action. No escalation
                    threshold is inferred; read and archived notices cannot
                    clear these obligations.
                  </p>
                  <ul className="sh-register">
                    {data.obligations.map((a) => (
                      <li key={a.id}>
                        <div>
                          <Link className="sh-title" href={a.href}>
                            {a.summary}
                          </Link>
                          <p>
                            {a.due_at
                              ? `${new Date(a.due_at) < new Date() ? "Overdue · " : "Due · "}${new Date(a.due_at).toLocaleString("en-AU")}`
                              : "Date needed"}{" "}
                            · {a.notice_count} related notices in this window
                          </p>
                        </div>
                        <Link className="mw-button" href={a.href}>
                          Open source workflow
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {!data.owned && (
                    <p className="sh-empty">
                      No active owned Activities within your access.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="sh-toolbar">
                    <label>
                      Find updates
                      <input
                        type="search"
                        maxLength={200}
                        value={q}
                        onChange={(e) => {
                          setQ(e.target.value);
                          setSelected([]);
                        }}
                      />
                    </label>
                    <label>
                      Read state
                      <select
                        value={filter}
                        onChange={(e) => {
                          setFilter(e.target.value);
                          setSelected([]);
                        }}
                      >
                        {["All", "Unread", "Read"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Location
                      <select
                        value={archived ? "Archived" : "Inbox"}
                        onChange={(e) => {
                          setArchived(e.target.value === "Archived");
                          setSelected([]);
                        }}
                      >
                        <option>Inbox</option>
                        <option>Archived</option>
                      </select>
                    </label>
                  </div>
                  <div className="sh-actions">
                    <button
                      className="mw-button"
                      onClick={() => setSelected(items.map((n) => n.id))}
                    >
                      Select visible
                    </button>
                    {["read", "unread", archived ? "restore" : "archive"].map(
                      (a) => (
                        <button
                          key={a}
                          className="mw-button"
                          disabled={busy || !selected.length}
                          onClick={() =>
                            void action(
                              a,
                              items.filter((n) => selected.includes(n.id)),
                            )
                          }
                        >
                          {a === "read"
                            ? "Mark selected read"
                            : a === "unread"
                              ? "Mark selected unread"
                              : a === "archive"
                                ? "Archive selected"
                                : "Restore selected"}
                        </button>
                      ),
                    )}
                  </div>
                  {view === "Grouped changes" ? (
                    groups.map((id) => (
                      <section className="sh-group" key={id}>
                        <div className="sh-actions">
                          <h2>
                            {items.find((n) => n.source_id === id)!.title}
                          </h2>
                          <button
                            className="mw-button"
                            disabled={busy}
                            onClick={() =>
                              void action(
                                "read",
                                items.filter((n) => n.source_id === id),
                              )
                            }
                          >
                            Mark displayed group read
                          </button>
                        </div>
                        <ul className="sh-register">
                          {items.filter((n) => n.source_id === id).map(row)}
                        </ul>
                      </section>
                    ))
                  ) : (
                    <ul className="sh-register">{items.map(row)}</ul>
                  )}
                  {!items.length && data.state === "complete" && (
                    <p className="sh-empty">
                      No permitted updates match these filters.
                    </p>
                  )}
                </>
              )}
              <p className="sh-muted">
                {data.source} · Observed{" "}
                {new Date(data.observed_at).toLocaleString("en-AU")}.{" "}
                {data.delivery}
              </p>
            </>
          )}
        </>
      )}
      <ErrorNotice error={error} />
      <p role="status">{message}</p>
      {notice && (
        <NoticePreview
          id={notice}
          close={() => setNotice(null)}
          action={action}
        />
      )}
    </div>
  );
}
