"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useIdentity } from "../../../components/business-session";
import { ErrorNotice, isDenied, type Failure } from "../../../components/business-ui";
import {
  activeFilterCount,
  criteriaSearch,
  defaultCriteria,
  overviewQuery,
  readCriteria,
  sameCriteria,
  TODAYS_FOCUS,
} from "../../work-criteria";
import type { readWorkOverview, WorkRow } from "../../work-overview";
import {
  activityTypeLabels,
  activityTypes,
  clockTime,
  durationLabel,
  durationMinutes,
  firstName,
  greeting,
  localDay,
  longDate,
  nextScheduleId,
  shortDate,
  WORK_TIMEZONE,
} from "../../work-view";
import type { WorkView, WorkViewCriteria } from "../../work-views";
import { typeIcons } from "./my-work-dialogs";
import { ActivityRow, PanelState, useWorkDialogs } from "./my-work-list";
import { CustomiseDialog, FiltersDialog, ViewsDialog } from "./my-work-settings";
import { useMyWork, type PanelId } from "./my-work-shell";
import { Icon, Menu, Tag, useWorkResource, type IconName } from "./my-work-ui";

type Overview = Awaited<ReturnType<typeof readWorkOverview>>;

// Criteria live in the address bar, so Back, Forward and a reload return to the same question.
export function useCriteria(views: WorkView[] | null) {
  const params = useSearchParams();
  const [criteria, setCriteria] = useState<WorkViewCriteria>(() => readCriteria(new URLSearchParams(params.toString())));
  const [viewId, setViewId] = useState<string | null>(() => params.get("view"));
  useEffect(() => {
    const query = new URLSearchParams(criteriaSearch(criteria, viewId));
    const department = new URLSearchParams(window.location.search).get("department");
    if (department) query.set("department", department);
    const search = query.size ? "?" + query.toString() : "";
    if (search !== window.location.search) window.history.replaceState(null, "", `${window.location.pathname}${search}`);
  }, [criteria, viewId]);
  const view = views?.find((v) => v.id === viewId) ?? null;
  return {
    criteria,
    view,
    viewId: view ? viewId : null,
    // A view that was retired or never existed falls back to the criteria already in the link.
    modified: view ? !sameCriteria(criteria, view.criteria) : !sameCriteria(criteria, defaultCriteria),
    set: (next: WorkViewCriteria | ((old: WorkViewCriteria) => WorkViewCriteria)) => setCriteria(next),
    use: (next: WorkView | null) => {
      setViewId(next?.id ?? null);
      setCriteria(next?.criteria ?? defaultCriteria);
    },
  };
}

function Attention({
  icon,
  tone,
  value,
  label,
  entity,
  href,
  status,
}: {
  icon: IconName;
  tone?: "overdue";
  value: number | null;
  label: string;
  entity: string;
  href: string;
  status: "ok" | "loading" | "not_permitted" | "unavailable";
}) {
  const shown = status === "ok" ? String(value) : status === "loading" ? "…" : "—";
  const name =
    status === "ok"
      ? `${value} ${label.toLowerCase()}, ${entity.toLowerCase()}. Open them.`
      : status === "not_permitted"
        ? `${label}: outside your current access`
        : status === "loading"
          ? `${label}: loading`
          : `${label}: could not be loaded. This is not zero.`;
  const body = (
    <>
      <span className={`mw-attention-icon${tone && status === "ok" && value ? " mw-tone-overdue" : ""}`}>
        <Icon name={icon} />
      </span>
      <span className="mw-attention-text">
        <strong className={tone && status === "ok" && value ? "mw-tone-overdue" : undefined}>{shown}</strong>
        <span>{label}</span>
        <small>{status === "unavailable" ? "Unavailable" : status === "not_permitted" ? "No access" : entity}</small>
      </span>
      {status === "ok" && <Icon name="chevron-right" />}
    </>
  );
  return status === "ok" ? (
    <Link className="mw-attention-cell" href={href} aria-label={name}>
      {body}
    </Link>
  ) : (
    <div className="mw-attention-cell" role="group" aria-label={name}>
      {body}
    </div>
  );
}

export function MyWorkOverview() {
  const me = useIdentity(),
    work = useMyWork(),
    router = useRouter();
  const c = useCriteria(work.views?.views ?? null);
  const read = useWorkResource<Overview>(`work/overview?${overviewQuery(c.criteria)}`);
  const data = read.data;
  // The server's observation time classifies every row, so the list and the counts always agree.
  const now = data?.observed_at ?? new Date().toISOString();
  const changed = (message: string) => {
    work.announce(message);
    read.reload();
    work.reloadNavigation();
  };
  const dialogs = useWorkDialogs(now, changed);
  const [settings, setSettings] = useState<"filters" | "customise" | "views" | null>(null);

  const query = (extra: Partial<WorkViewCriteria>) => `/work/actions${criteriaSearch({ ...c.criteria, sort: "Due", ...extra })}`;
  const denied = isDenied(read.error);
  const state = (panel?: { status: "ok" | "not_permitted" | "unavailable" }) => (!data ? (read.error ? "unavailable" : "loading") : (panel?.status ?? "ok"));
  const overdue = data?.activities.items.filter((r) => r.group === "Overdue") ?? [],
    today = data?.activities.items.filter((r) => r.group === "Today") ?? [];
  const filters = activeFilterCount(c.criteria, ["company_id", "kind"]);
  const next = useMemo(() => (data ? nextScheduleId(data.schedule.items, data.observed_at) : null), [data]);

  const panels: Record<PanelId, React.ReactNode> = {
    schedule: data && (
      <section className="mw-panel" aria-labelledby="mw-schedule-title" key="schedule">
        <header className="mw-panel-head">
          <span className="mw-panel-icon">
            <Icon name="calendar" />
          </span>
          <div>
            <h2 id="mw-schedule-title">Today&apos;s schedule</h2>
            <p>{WORK_TIMEZONE.split("/")[1].replace("_", " ")} time</p>
          </div>
          <Link className="mw-link mw-panel-link" href={`/calendar?day=${data.day}`}>
            Calendar <Icon name="arrow-right" />
          </Link>
        </header>
        {data.schedule.items.length || data.schedule.meetings?.length ? (
          <ol className="mw-schedule">
            {data.schedule.items.map((row) => (
              <li key={row.id} data-done={row.group === "Closed" || undefined}>
                <time dateTime={row.starts_at!}>{clockTime(row.starts_at!, WORK_TIMEZONE)}</time>
                <span className="mw-schedule-dot" aria-hidden="true" />
                <div>
                  <button type="button" className="mw-row-title" onClick={() => dialogs.open({ kind: "detail", row })}>
                    <span>{row.summary}</span>
                  </button>
                  <p>
                    {[row.linked.organisation_name ?? row.linked.title, durationLabel(durationMinutes(row)), c.criteria.owner === "all" ? row.owner_name : null]
                      .filter(Boolean)
                      .join(" · ")}
                    {row.group === "Closed" ? " · Completed" : row.group === "Overdue" ? " · Outcome due" : ""}
                  </p>
                </div>
                {row.id === next && <Tag tone="quiet">Next</Tag>}
                <span className="mw-schedule-type" title={activityTypeLabels[row.activity_type]}>
                  <Icon name={typeIcons[row.activity_type]} />
                </span>
              </li>
            ))}
            {data.schedule.meetings?.map((m) => (
              <li key={m.id} className="mw-schedule-meeting">
                <time dateTime={m.starts_at}>{clockTime(m.starts_at, WORK_TIMEZONE)}</time>
                <span className="mw-schedule-dot" aria-hidden="true" />
                <div>
                  <Link className="mw-row-title" href={`/calendar?day=${data.day}`}>
                    <span>{m.title}</span>
                  </Link>
                  <p>
                    {m.source} · {durationLabel(Math.round((Date.parse(m.ends_at) - Date.parse(m.starts_at)) / 60000))} · calendar entry, not an activity
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mw-panel-note">No appointments are booked for today.</p>
        )}
        {data.schedule.truncated && <p className="mw-panel-note">Showing the first 50 appointments. Open the calendar for the rest.</p>}
      </section>
    ),
    waiting: data && (
      <section className="mw-panel" aria-labelledby="mw-waiting-title" key="waiting">
        <header className="mw-panel-head">
          <span className="mw-panel-icon">
            <Icon name="mail" />
          </span>
          <div>
            <h2 id="mw-waiting-title">
              Waiting on others {data.waiting.status === "ok" && <span className="mw-count">{data.waiting.total}</span>}
            </h2>
          </div>
          <Link className="mw-link mw-panel-link" href={`/work/waiting${criteriaSearch({ ...defaultCriteria, owner: c.criteria.owner, company_id: c.criteria.company_id })}`}>
            View all <Icon name="arrow-right" />
          </Link>
        </header>
        {data.waiting.status !== "ok" ? (
          <PanelState status={data.waiting.status} what="Waiting requests" retry={read.reload} />
        ) : data.waiting.items.length ? (
          <ul className="mw-cards">
            {data.waiting.items.map((w) => (
              <li key={w.id}>
                <div>
                  <Link className="mw-row-title" href={w.href}>
                    <span>{w.awaited}</span>
                  </Link>
                  <p>{w.context ?? w.reference}</p>
                  <p>{[w.respondent_name ?? "Respondent not recorded", w.waiting_since ? `Since ${shortDate(w.waiting_since, WORK_TIMEZONE)}` : null].filter(Boolean).join(" · ")}</p>
                </div>
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
                  <small>{w.follow_up_at ? `Follow up ${followUpLabel(w.follow_up_at, data.day)}` : "Follow-up date needed"}</small>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mw-panel-note">Nothing you follow up is waiting on someone else.</p>
        )}
      </section>
    ),
    gaps:
      data && data.gaps.status !== "not_permitted" ? (
        <section className="mw-panel" aria-labelledby="mw-gaps-title" key="gaps">
          <header className="mw-panel-head">
            <span className="mw-panel-icon">
              <Icon name="clock" />
            </span>
            <div>
              <h2 id="mw-gaps-title">
                Needs a next activity {data.gaps.status === "ok" && <span className="mw-count">{data.gaps.total}</span>}
              </h2>
              <p>Open opportunities with no active next action</p>
            </div>
            <Link className="mw-link mw-panel-link" href="/sales/opportunities?next_action=Needed">
              View all <Icon name="arrow-right" />
            </Link>
          </header>
          {data.gaps.status !== "ok" ? (
            <PanelState status={data.gaps.status} what="Opportunities" retry={read.reload} />
          ) : data.gaps.items.length ? (
            <ul className="mw-cards">
              {data.gaps.items.map((g) => (
                <li key={g.id}>
                  <div>
                    <Link className="mw-row-title" href={`/sales/opportunities/${g.id}`}>
                      <span>{g.organisation_name}</span>
                    </Link>
                    <p>{[g.title, c.criteria.owner === "all" ? g.owner_name : null].filter(Boolean).join(" · ")}</p>
                  </div>
                  <Tag>{g.stage_id}</Tag>
                  <div className="mw-card-side">
                    {g.can_plan ? (
                      <button
                        type="button"
                        className="mw-button"
                        aria-label={`Plan activity: ${g.organisation_name}, ${g.title}`}
                        onClick={() => dialogs.open({ kind: "create", preset: { type: "Opportunity", ...g } })}
                      >
                        <Icon name="plus" />
                        Plan activity
                      </button>
                    ) : (
                      <small>Owner plans: {g.owner_name}</small>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mw-panel-note">Every open opportunity in this scope has an active next action.</p>
          )}
        </section>
      ) : null,
  };

  return (
    <div className="mw-page" aria-busy={read.loading}>
      <header className="mw-intro">
        <h1>
          {greeting(now)}, {firstName(me.display_name)}
        </h1>
        <Tag tone="quiet">{work.department}</Tag>
        <span className="mw-spacer" />
        <time className="mw-date" dateTime={data?.day}>
          {longDate(now)}
        </time>
        <button type="button" className="mw-button" onClick={() => setSettings("customise")}>
          <Icon name="sliders" />
          Customise
        </button>
      </header>

      <div className="mw-toolbar" role="toolbar" aria-label="My Work overview controls">
        {data?.capabilities.can_create !== false && (
          <button
            type="button"
            className="mw-button mw-button-primary"
            onClick={() => (work.navigation?.sales ? dialogs.open({ kind: "create" }) : router.push("/work/new"))}
          >
            <Icon name="plus" />
            Activity
          </button>
        )}
        <Menu
          name="Saved view"
          icon="bookmark"
          label={
            <>
              View: {c.view?.name ?? TODAYS_FOCUS}
              {c.modified && <em className="mw-modified"> · Modified</em>}
            </>
          }
          items={[
            { id: "focus", label: TODAYS_FOCUS, hint: "Built-in default", checked: !c.view && !c.modified, onSelect: () => c.use(null) },
            ...(work.views?.views ?? [])
              .filter((v) => v.target === "overview")
              .map((v) => ({ id: v.id, label: v.name, checked: c.viewId === v.id && !c.modified, onSelect: () => c.use(v) })),
            { id: "sep", separator: true as const },
            ...(c.modified ? [{ id: "reset", label: c.view ? `Reset to “${c.view.name}”` : `Reset to ${TODAYS_FOCUS}`, onSelect: () => c.use(c.view) }] : []),
            { id: "manage", label: "Save or manage views…", onSelect: () => setSettings("views") },
          ]}
        />
        <span className="mw-spacer" />
        <Menu
          name="Owner scope"
          icon="user"
          label={c.criteria.owner === "mine" ? "My work" : "Everyone I can see"}
          align="end"
          items={[
            { id: "mine", label: "My work", hint: "Work I own", checked: c.criteria.owner === "mine", onSelect: () => c.set({ ...c.criteria, owner: "mine" }) },
            { id: "all", label: "Everyone I can see", hint: "All owners within my access", checked: c.criteria.owner === "all", onSelect: () => c.set({ ...c.criteria, owner: "all" }) },
          ]}
        />
        <button type="button" className="mw-button" onClick={() => setSettings("filters")} aria-label={filters ? `Filters, ${filters} active` : "Filters"}>
          <Icon name="filter" />
          <span>Filters</span>
          {filters > 0 && <span className="mw-count">{filters}</span>}
        </button>
        <Menu
          name="More actions"
          icon="dots"
          label="More"
          iconOnly
          align="end"
          items={[
            { id: "refresh", label: "Refresh now", onSelect: () => read.reload() },
            { id: "views", label: "Save or manage views…", onSelect: () => setSettings("views") },
            { id: "calendar", label: "Open calendar", onSelect: () => router.push(`/calendar${data ? `?day=${data.day}` : ""}`) },
            { id: "full", label: "Full activity form", hint: "Sites, assets, customers and service requests", onSelect: () => router.push("/work/new") },
          ]}
        />
      </div>

      {denied ? (
        <ErrorNotice error={read.error} />
      ) : (
        <>
          {!!read.error && (
            <div className="mw-notice mw-notice-attention" role="alert">
              <strong>{data ? "My Work could not be refreshed." : "My Work could not be loaded."}</strong> {(read.error as Failure).message}{" "}
              {data ? `Showing what was read at ${clockTime(data.observed_at, WORK_TIMEZONE)}; it may be out of date.` : "No counts are shown, because an unread list is not an empty one."}{" "}
              <button type="button" className="mw-link" onClick={read.reload}>
                Try again
              </button>
            </div>
          )}
          <nav className="mw-attention" aria-label="Attention counts">
            <Attention icon="alert" tone="overdue" value={data?.counts.overdue ?? null} label="Overdue" entity="Activities" href={query({ due: "Overdue" })} status={state()} />
            <Attention icon="calendar" value={data?.counts.due_today ?? null} label="Due today" entity="Activities" href={query({ due: "Today" })} status={state()} />
            <Attention
              icon="mail"
              value={data?.waiting.status === "ok" ? data.waiting.total : null}
              label="Waiting on others"
              entity="Requests"
              href={`/work/waiting${criteriaSearch({ ...defaultCriteria, owner: c.criteria.owner, company_id: c.criteria.company_id })}`}
              status={state(data?.waiting)}
            />
            <Attention
              icon="clock"
              value={data?.gaps.status === "ok" ? data.gaps.total : null}
              label="No next activity"
              entity="Opportunities"
              href="/sales/opportunities?next_action=Needed"
              status={state(data?.gaps)}
            />
          </nav>

          {data && (
            <div className="mw-columns" data-stale={read.stale || undefined}>
              <div className="mw-main">
                <section className="mw-panel mw-activities" aria-labelledby="mw-activities-title">
                  <header className="mw-panel-head">
                    <div>
                      <h2 id="mw-activities-title">
                        {c.criteria.owner === "mine" ? "My activities" : "Activities"} <span className="mw-count">{data.activities.total}</span>
                      </h2>
                      <p>Overdue and today</p>
                    </div>
                    <span className="mw-spacer" />
                    <Menu
                      name="Activity type"
                      label={c.criteria.activity_type ? activityTypeLabels[c.criteria.activity_type] : "All activity types"}
                      align="end"
                      items={[
                        { id: "all", label: "All activity types", checked: !c.criteria.activity_type, onSelect: () => c.set({ ...c.criteria, activity_type: null }) },
                        ...activityTypes.map((t) => ({ id: t, label: activityTypeLabels[t], checked: c.criteria.activity_type === t, onSelect: () => c.set({ ...c.criteria, activity_type: t }) })),
                      ]}
                    />
                    <Menu
                      name="Sort activities"
                      label={`Sort: ${c.criteria.sort === "Title" ? "Title" : "Due time"}`}
                      align="end"
                      items={[
                        { id: "due", label: "Due time", hint: "Earliest first", checked: c.criteria.sort !== "Title", onSelect: () => c.set({ ...c.criteria, sort: "Due" }) },
                        { id: "title", label: "Title", hint: "A to Z within each group", checked: c.criteria.sort === "Title", onSelect: () => c.set({ ...c.criteria, sort: "Title" }) },
                      ]}
                    />
                  </header>
                  {!data.activities.items.length ? (
                    <p className="mw-panel-note">
                      {c.criteria.activity_type || filters
                        ? "No overdue or due-today activities match these filters."
                        : "Nothing is overdue or due today."}{" "}
                      {(c.criteria.activity_type || filters > 0) && (
                        <button type="button" className="mw-link" onClick={() => c.set({ ...c.criteria, activity_type: null, company_id: null, kind: null })}>
                          Clear filters
                        </button>
                      )}
                    </p>
                  ) : (
                    <>
                      <Group title="Overdue" tone="overdue" rows={overdue} now={now} open={dialogs.open} showOwner={c.criteria.owner === "all"} />
                      <Group title="Today" rows={today} now={now} open={dialogs.open} showOwner={c.criteria.owner === "all"} />
                    </>
                  )}
                  <footer className="mw-panel-foot">
                    <span>
                      {data.activities.completeness === "Complete"
                        ? "Open an activity for contact details and actions."
                        : `Showing the first ${data.activities.items.length} of ${data.activities.total}, most urgent first.`}
                    </span>
                    <Link className="mw-link" href={`/work/actions${criteriaSearch({ ...c.criteria, sort: "Due" })}`}>
                      View all activities <Icon name="arrow-right" />
                    </Link>
                  </footer>
                </section>

                <section className="mw-notices" aria-label="Work outside the dated list">
                  {data.date_needed.total > 0 && (
                    <div className="mw-strip">
                      <span className="mw-panel-icon">
                        <Icon name="calendar-alert" />
                      </span>
                      <div>
                        <strong>
                          {data.date_needed.total} {data.date_needed.total === 1 ? "activity needs" : "activities need"} a date
                        </strong>
                        <p>
                          {data.date_needed.items[0].summary}
                          {data.date_needed.total > 1 ? ` and ${data.date_needed.total - 1} more` : ""}
                        </p>
                      </div>
                      {data.date_needed.total === 1 && data.date_needed.items[0].can_edit ? (
                        <button type="button" className="mw-link" onClick={() => dialogs.open({ kind: "date", row: data.date_needed.items[0] })}>
                          Set date <Icon name="arrow-right" />
                        </button>
                      ) : (
                        <Link className="mw-link" href={query({ due: "Needed" })}>
                          Set dates <Icon name="arrow-right" />
                        </Link>
                      )}
                    </div>
                  )}
                  {data.reviews.status === "ok" && data.reviews.total > 0 && (
                    <div className="mw-strip">
                      <span className="mw-panel-icon">
                        <Icon name="document" />
                      </span>
                      <div>
                        <strong>
                          {data.reviews.bounded ? "At least " : ""}{data.reviews.total} {data.reviews.total === 1 ? "review awaits" : "reviews await"} your decision
                        </strong>
                        <p>
                          {data.reviews.items[0].reference} · {data.reviews.items[0].revision}
                          {data.reviews.total > 1 ? ` and ${data.reviews.total - 1} more` : ""}
                        </p>
                      </div>
                      <Link className="mw-link" href={data.reviews.total === 1 ? data.reviews.items[0].href : "/work/reviews"}>
                        Review <Icon name="arrow-right" />
                      </Link>
                    </div>
                  )}
                  {data.reviews.status === "unavailable" && <PanelState status="unavailable" what="Reviews" retry={read.reload} />}
                </section>
              </div>
              <aside className="mw-side" aria-label="Schedule and follow-up">
                {work.layout.panels.filter((id) => !work.layout.hidden.includes(id)).map((id) => panels[id])}
              </aside>
            </div>
          )}
          {read.loading && (
            <div className={data ? "mw-refreshing" : "mw-skeleton"} role="status">
              Loading your work…
            </div>
          )}
        </>
      )}

      <footer className="mw-foot">
        <span>
          Synthetic demo data
          {data && ` · Updated ${clockTime(data.observed_at, WORK_TIMEZONE)}${read.stale || read.error ? " (not current)" : ""}`}
        </span>
        <span>
          {work.department} workspace · {c.criteria.owner === "mine" ? "My work" : "Everyone I can see"}
        </span>
      </footer>

      {dialogs.element}
      {settings === "filters" && <FiltersDialog criteria={c.criteria} onApply={c.set} onClose={() => setSettings(null)} />}
      {(settings === "customise" || work.customise) && (
        <CustomiseDialog
          onClose={() => {
            setSettings(null);
            work.setCustomise(false);
          }}
        />
      )}
      {settings === "views" && <ViewsDialog target="overview" criteria={c.criteria} activeId={c.viewId} onUse={c.use} onClose={() => setSettings(null)} />}
    </div>
  );
}

export function followUpLabel(iso: string, today: string) {
  return localDay(iso) === today ? "today" : shortDate(iso, WORK_TIMEZONE);
}
function Group({
  title,
  tone,
  rows,
  now,
  open,
  showOwner,
}: {
  title: string;
  tone?: "overdue";
  rows: WorkRow[];
  now: string;
  open: Parameters<typeof ActivityRow>[0]["open"];
  showOwner: boolean;
}) {
  if (!rows.length) return null;
  return (
    <section aria-label={`${title}, ${rows.length}`}>
      <h3 className={`mw-group${tone ? ` mw-group-${tone}` : ""}`}>
        {title} <span aria-hidden="true">·</span> {rows.length}
      </h3>
      <ul className="mw-rows">
        {rows.map((row) => (
          <ActivityRow key={row.id} row={row} now={now} open={open} showOwner={showOwner} />
        ))}
      </ul>
    </section>
  );
}
