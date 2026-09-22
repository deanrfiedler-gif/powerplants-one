"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, ErrorNotice, isDenied, type Failure } from "../../../components/business-ui";
import { actionsQuery, criteriaSearch, defaultCriteria } from "../../work-criteria";
import type { listWork, readWorkWaiting, WorkRow } from "../../work-overview";
import { activityTypeLabels, activityTypes, clockTime, shortDate, WORK_TIMEZONE } from "../../work-view";
import type { WorkViewCriteria } from "../../work-views";
import { ActivityRow, PanelState, useWorkDialogs } from "./my-work-list";
import { followUpLabel, useCriteria } from "./my-work-overview";
import { CustomiseDialog, ViewsDialog } from "./my-work-settings";
import { defaultLayout, useMyWork } from "./my-work-shell";
import { Icon, Menu, Tag, useWorkResource } from "./my-work-ui";

type Work = Awaited<ReturnType<typeof listWork>>;
type Waiting = Awaited<ReturnType<typeof readWorkWaiting>>;

function PageHead({ title, lede, children }: { title: string; lede: string; children?: React.ReactNode }) {
  return (
    <header className="mw-intro mw-intro-view">
      <div>
        <h1>{title}</h1>
        <p>{lede}</p>
      </div>
      <span className="mw-spacer" />
      {children}
    </header>
  );
}
function Foot({ observed, stale, note }: { observed?: string; stale: boolean; note: string }) {
  return (
    <footer className="mw-foot">
      <span>
        Synthetic demo data{observed && ` · Updated ${clockTime(observed, WORK_TIMEZONE)}${stale ? " (not current)" : ""}`}
      </span>
      <span>{note}</span>
    </footer>
  );
}
const select = <T extends string>(
  id: string,
  label: string,
  value: T | "",
  options: readonly (readonly [T | "", string])[],
  onChange: (v: T | "") => void,
) => (
  <div className="mw-field mw-field-inline">
    <label htmlFor={id}>{label}</label>
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as T | "")}>
      {options.map(([v, text]) => (
        <option key={v} value={v}>
          {text}
        </option>
      ))}
    </select>
  </div>
);

// ───────────────────────── My actions and Team queue ─────────────────────────
function ActionList({ team }: { team: boolean }) {
  const work = useMyWork();
  const c = useCriteria(work.views?.views ?? null);
  const criteria: WorkViewCriteria = team ? { ...c.criteria, owner: "all" } : c.criteria;
  const [ownerId, setOwnerId] = useState("");
  const [search, setSearch] = useState(criteria.q);
  // Typing is applied after a pause, so each keystroke is not a new read.
  const pause = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (pause.current && clearTimeout(pause.current)), []);
  const typed = (value: string) => {
    setSearch(value);
    if (pause.current) clearTimeout(pause.current);
    pause.current = setTimeout(() => c.set((old) => ({ ...old, q: value })), 300);
  };
  const base = `work/${team ? "team" : "actions"}?${actionsQuery(criteria, team && ownerId ? { owner_id: ownerId } : {})}`;
  const first = useWorkResource<Work>(base);
  // Later pages are appended to the first; any change of scope or a refresh starts again.
  const [more, setMore] = useState<{ base: string; stamp: string; rows: WorkRow[]; cursor: string | null } | null>(null),
    [moreError, setMoreError] = useState<unknown>(null),
    [loadingMore, setLoadingMore] = useState(false);
  const data = first.data;
  const extra = more && data && more.base === base && more.stamp === data.observed_at ? more : null;
  const rows = data ? [...data.items, ...(extra?.rows ?? [])] : [];
  const cursor = extra ? extra.cursor : (data?.next_cursor ?? null);
  const now = data?.observed_at ?? new Date().toISOString();
  const dialogs = useWorkDialogs(now, (message) => {
    work.announce(message);
    setMore(null);
    first.reload();
    work.reloadNavigation();
  });
  const [views, setViews] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  async function loadMore() {
    if (!data || !cursor) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await api<Work>(`${base}&cursor=${encodeURIComponent(cursor)}`);
      setMore({ base, stamp: data.observed_at, rows: [...(extra?.rows ?? []), ...page.items], cursor: page.next_cursor });
    } catch (e) {
      setMoreError(e);
    } finally {
      setLoadingMore(false);
    }
  }
  const set = (patch: Partial<WorkViewCriteria>) => c.set((old) => ({ ...old, ...patch }));
  const clear = () => {
    if (pause.current) clearTimeout(pause.current);
    c.use(null);
    setSearch("");
    setOwnerId("");
  };
  const denied = isDenied(first.error);
  const groups = ["Overdue", "Today", "Upcoming", "DateNeeded", "Closed"] as const;
  const groupNames = { Overdue: "Overdue", Today: "Today", Upcoming: "Upcoming", DateNeeded: "Date needed", Closed: "Completed or cancelled" };
  return (
    <div className="mw-page" aria-busy={first.loading} ref={top}>
      <PageHead
        title={team ? "Team queue" : "My actions"}
        lede={
          team
            ? "Work owned by everyone within your access. Counts are obligations, not capacity or hours."
            : "Every activity in your scope, ordered on the server. Reviews and waiting requests keep their own views."
        }
      >
        <Menu
          name="Saved view"
          icon="bookmark"
          label={
            <>
              View: {c.view?.name ?? "All criteria"}
              {c.view && c.modified && <em className="mw-modified"> · Modified</em>}
            </>
          }
          align="end"
          items={[
            ...(work.views?.views ?? [])
              .filter((v) => v.target === (team ? "team" : "actions"))
              .map((v) => ({ id: v.id, label: v.name, checked: c.viewId === v.id && !c.modified, onSelect: () => c.use(v) })),
            { id: "clear", label: "Clear all criteria", onSelect: clear },
            { id: "manage", label: "Save or manage views…", onSelect: () => setViews(true) },
          ]}
        />
      </PageHead>
      {team && data?.owners && (
        <ul className="mw-owners" aria-label="Active work by owner">
          <li>
            <button type="button" className="mw-owner" aria-pressed={!ownerId} onClick={() => setOwnerId("")}>
              <strong>{data.owners.reduce((n, o) => n + o.active, 0)}</strong>
              <span>All owners</span>
              <small>active obligations</small>
            </button>
          </li>
          {data.owners.map((o) => (
            <li key={o.owner_id}>
              <button type="button" className="mw-owner" aria-pressed={ownerId === o.owner_id} onClick={() => setOwnerId(ownerId === o.owner_id ? "" : o.owner_id)}>
                <strong>{o.active}</strong>
                <span>{o.owner_name}</span>
                <small>
                  {o.overdue} overdue · {o.date_needed} date needed
                </small>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mw-filterbar" role="search" aria-label="Find actions">
        <div className="mw-field mw-field-inline mw-field-search">
          <label htmlFor="mw-q">Search activities</label>
          <input id="mw-q" type="search" maxLength={200} placeholder="Activity title" value={search} onChange={(e) => typed(e.target.value)} />
        </div>
        {!team &&
          select("mw-f-owner", "Owner", criteria.owner, [["mine", "My work"], ["all", "Everyone I can see"]] as const, (v) => set({ owner: (v || "mine") as WorkViewCriteria["owner"] }))}
        {select("mw-f-status", "Status", criteria.status, [["Active", "Active"], ["Completed", "Completed"], ["Cancelled", "Cancelled"], ["All", "All"]] as const, (v) => set({ status: (v || "Active") as WorkViewCriteria["status"], due: v && v !== "Active" && v !== "All" ? null : criteria.due }))}
        {select("mw-f-due", "Due date", criteria.due ?? "", [["", "Any time"], ["Overdue", "Overdue"], ["Today", "Today"], ["Upcoming", "Upcoming"], ["Needed", "Date needed"]] as const, (v) => set({ due: (v || null) as WorkViewCriteria["due"] }))}
        {select("mw-f-linked", "Source", criteria.linked ?? "", [["", "Any record"], ["Lead", "Leads"], ["Opportunity", "Opportunities"], ["Ticket", "Service requests"], ["Other", "Sites, assets and customers"]] as const, (v) => set({ linked: (v || null) as WorkViewCriteria["linked"] }))}
        {select("mw-f-type", "Type", criteria.activity_type ?? "", [["", "All types"], ...activityTypes.map((t) => [t, activityTypeLabels[t]] as const)], (v) => set({ activity_type: (v || null) as WorkViewCriteria["activity_type"] }))}
        {select("mw-f-sort", "Sort", criteria.sort, [["Due", "Due time"], ["Title", "Title"], ["Updated", "Recently updated"]] as const, (v) => set({ sort: (v || "Due") as WorkViewCriteria["sort"] }))}
        <button type="button" className="mw-button mw-button-quiet" onClick={clear}>
          Clear
        </button>
        <button
          type="button"
          className="mw-button mw-button-quiet"
          onClick={() => {
            setMore(null);
            first.reload();
          }}
        >
          <Icon name="refresh" />
          Refresh activities
        </button>
      </div>
      {denied ? (
        team ? (
          <p className="mw-notice">The team queue is for people who can reassign and date other people&apos;s activities. Your own work is under My actions.</p>
        ) : (
          <ErrorNotice error={first.error} />
        )
      ) : (
        <>
          {!!first.error && (
            <div className="mw-notice mw-notice-attention" role="alert">
              <strong>{data ? "This list could not be refreshed." : "This list could not be loaded."}</strong> {(first.error as Failure).message}{" "}
              {data ? "What is shown may be out of date." : "That is not the same as having no work."}{" "}
              <button type="button" className="mw-link" onClick={first.reload}>
                Try again
              </button>
            </div>
          )}
          {data && (
            <section className="mw-panel" aria-label={team ? "Team activities" : "My actions"} data-stale={first.stale || undefined}>
              <header className="mw-panel-head">
                <div>
                  <h2>
                    {data.total} matching {data.total === 1 ? "activity" : "activities"}
                  </h2>
                  <p>
                    In this scope: {data.counts.overdue} overdue · {data.counts.today} today · {data.counts.upcoming} upcoming · {data.counts.date_needed} date needed
                  </p>
                </div>
              </header>
              {rows.length ? (
                groups.map((g) => {
                  const list = rows.filter((r) => r.group === g);
                  return list.length ? (
                    <section key={g} aria-label={groupNames[g]}>
                      <h3 className={`mw-group${g === "Overdue" ? " mw-group-overdue" : ""}`}>{groupNames[g]}</h3>
                      <ul className="mw-rows">
                        {list.map((row) => (
                          <ActivityRow key={row.id} row={row} now={now} open={dialogs.open} showOwner={criteria.owner === "all"} ownerAction={team} />
                        ))}
                      </ul>
                    </section>
                  ) : null;
                })
              ) : (
                <p className="mw-panel-note">
                  No permitted activities match these filters.{" "}
                  <button type="button" className="mw-link" onClick={clear}>
                    Clear criteria
                  </button>
                </p>
              )}
              <footer className="mw-panel-foot">
                <span>
                  Showing {rows.length} of {data.total}
                </span>
                {cursor && (
                  <button type="button" className="mw-button" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? "Loading…" : "Show more"}
                  </button>
                )}
              </footer>
              <ErrorNotice error={moreError} />
            </section>
          )}
          {first.loading && (
            <div className={data ? "mw-refreshing" : "mw-skeleton"} role="status">
              Loading activities…
            </div>
          )}
        </>
      )}
      <Foot observed={data?.observed_at} stale={first.stale || !!first.error} note={team ? "Team queue · permitted owners" : criteria.owner === "mine" ? "My work" : "Everyone I can see"} />
      {dialogs.element}
      {views && <ViewsDialog target={team ? "team" : "actions"} criteria={criteria} activeId={c.viewId} onUse={c.use} onClose={() => setViews(false)} />}
    </div>
  );
}
export const MyWorkActions = () => <ActionList team={false} />;
export const MyWorkTeam = () => <ActionList team />;

// ───────────────────────── Blocked & waiting ─────────────────────────
export function MyWorkWaiting() {
  const work = useMyWork();
  const c = useCriteria(null);
  const read = useWorkResource<Waiting>(`work/waiting?${new URLSearchParams({ owner: c.criteria.owner, ...(c.criteria.company_id ? { company_id: c.criteria.company_id } : {}) })}`);
  const now = read.data?.observed_at ?? new Date().toISOString();
  const dialogs = useWorkDialogs(now, (message) => {
    work.announce(message);
    read.reload();
  });
  const panel = read.data?.waiting;
  return (
    <div className="mw-page" aria-busy={read.loading}>
      <PageHead title="Blocked & waiting" lede="Requests where someone else has the next move and you own the follow-up. Chasing updates the follow-up; only the source workflow clears the request.">
        <Menu
          name="Owner scope"
          icon="user"
          label={c.criteria.owner === "mine" ? "My work" : "Everyone I can see"}
          align="end"
          items={[
            { id: "mine", label: "My work", checked: c.criteria.owner === "mine", onSelect: () => c.set({ ...c.criteria, owner: "mine" }) },
            { id: "all", label: "Everyone I can see", checked: c.criteria.owner === "all", onSelect: () => c.set({ ...c.criteria, owner: "all" }) },
          ]}
        />
      </PageHead>
      {isDenied(read.error) ? (
        <ErrorNotice error={read.error} />
      ) : !panel ? (
        read.error ? (
          <PanelState status="unavailable" what="Waiting requests" retry={read.reload} />
        ) : (
          <div className="mw-skeleton" role="status">
            Loading waiting requests…
          </div>
        )
      ) : panel.status !== "ok" ? (
        <section className="mw-panel">
          <PanelState status={panel.status} what="Waiting requests" retry={read.reload} />
        </section>
      ) : (
        <section className="mw-panel" aria-label="Waiting on others" data-stale={read.stale || undefined}>
          <header className="mw-panel-head">
            <div>
              <h2>
                Waiting on others <span className="mw-count">{panel.total}</span>
              </h2>
              <p>Next follow-up first</p>
            </div>
          </header>
          {panel.items.length ? (
            <ul className="mw-cards mw-cards-wide">
              {panel.items.map((w) => (
                <li key={w.id}>
                  <div>
                    <Link className="mw-row-title" href={w.href}>
                      <span>
                        {w.awaited}
                        <Icon name="chevron-right" />
                      </span>
                    </Link>
                    <p>{[w.reference, w.context].filter(Boolean).join(" · ")}</p>
                    <p>
                      {[
                        w.respondent_name ? `Waiting on ${w.respondent_name}${w.respondent_role ? ` (${w.respondent_role})` : ""}` : "Respondent not recorded by the source",
                        w.waiting_since ? `since ${shortDate(w.waiting_since, WORK_TIMEZONE)}` : null,
                        `follow-up owner ${w.owner_name}`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Tag>{w.source === "ServiceRequest" ? "Service request" : "Engineering"}</Tag>
                  <div className="mw-card-side">
                    {w.activity?.can_edit ? (
                      <button type="button" className="mw-button" onClick={() => dialogs.open({ kind: "followup", activityId: w.activity!.id })} aria-label={`Follow up: ${w.awaited}`}>
                        <Icon name="mail" />
                        Follow up
                      </button>
                    ) : (
                      <Link className="mw-button" href={w.href}>
                        Open source
                      </Link>
                    )}
                    <small>{w.follow_up_at ? `Follow up ${followUpLabel(w.follow_up_at, read.data!.day)}` : "Follow-up date needed"}</small>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mw-panel-note">Nothing in this scope is waiting on someone else.</p>
          )}
        </section>
      )}
      <section className="mw-panel mw-panel-quiet" aria-label="Sources">
        <p className="mw-panel-note">
          Shown here: Service requests waiting for information, with their owned follow-up, and Engineering packages with a recorded blocker. Sales records no waiting request of its own
          yet, so supplier and customer chases appear as ordinary activities under My actions.
        </p>
      </section>
      <Foot observed={read.data?.observed_at} stale={read.stale || !!read.error} note={c.criteria.owner === "mine" ? "My follow-ups" : "Everyone I can see"} />
      {dialogs.element}
    </div>
  );
}

// ───────────────────────── Updates & preferences ─────────────────────────
export function MyWorkLayoutPreferences() {
  const work = useMyWork(),
    router = useRouter();
  const [customise, setCustomise] = useState(false);
  return (
    <div className="mw-page">
      <section className="mw-panel" aria-labelledby="mw-prefs-title">
        <header className="mw-panel-head">
          <span className="mw-panel-icon">
            <Icon name="sliders" />
          </span>
          <div>
            <h2 id="mw-prefs-title">My Work preferences</h2>
            <p>Remembered for you in this browser. They change layout only, never access.</p>
          </div>
        </header>
        <ul className="mw-cards mw-cards-wide">
          <li>
            <div>
              <strong>My Work menu</strong>
              <p>{work.layout.menu === "open" ? "Shown beside the content on wide screens." : "Hidden on wide screens until you choose Show menu."}</p>
            </div>
            <div className="mw-card-side">
              <button type="button" className="mw-button" onClick={() => work.saveLayout({ ...work.layout, menu: work.layout.menu === "open" ? "closed" : "open" })}>
                {work.layout.menu === "open" ? "Hide menu" : "Show menu"}
              </button>
            </div>
          </li>
          <li>
            <div>
              <strong>Overview panels</strong>
              <p>
                {work.layout.hidden.length ? `${work.layout.hidden.length} hidden` : "All shown"} · order: {work.layout.panels.map((p) => ({ schedule: "schedule", waiting: "waiting", gaps: "next activity" })[p]).join(", ")}
              </p>
            </div>
            <div className="mw-card-side">
              <button type="button" className="mw-button" onClick={() => setCustomise(true)}>
                Customise
              </button>
            </div>
          </li>
          <li>
            <div>
              <strong>Saved views</strong>
              <p>
                {work.views ? `${work.views.views.length} saved, ${work.views.views.filter((v) => v.pinned).length} pinned` : work.viewsError ? "Could not be loaded" : "Loading…"} · stored with
                your account
              </p>
            </div>
            <div className="mw-card-side">
              <button type="button" className="mw-button" onClick={() => router.push(`/work${criteriaSearch(defaultCriteria)}`)}>
                Manage from Overview
              </button>
            </div>
          </li>
          <li>
            <div>
              <strong>Department view</strong>
              <p>{work.department}. A presentation choice made from your account menu; it never changes what you are permitted to see.</p>
            </div>
          </li>
        </ul>
        <footer className="mw-panel-foot">
          <span>Reset returns the menu and panels to the {work.department} default. Saved views are kept.</span>
          <button
            type="button"
            className="mw-button"
            onClick={() => {
              work.saveLayout(defaultLayout);
              work.announce("My Work layout reset to the default.");
            }}
          >
            Reset layout
          </button>
        </footer>
      </section>
      <Foot stale={false} note="Preferences" />
      {customise && <CustomiseDialog onClose={() => setCustomise(false)} />}
    </div>
  );
}
