"use client";
// My Work on a phone: build report r02, mockup r07. One vertically scrolling page: greeting, optional
// weather, Quick Actions, Needs attention, one weekly agenda, waiting follow-ups and the opportunity
// gap link, with one floating Create control. It is a second presentation of the same reads, dialogs
// and commands as the desktop overview; it stores nothing and decides nothing of its own.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useIdentity } from "../../../components/business-session";
import { ErrorNotice, isDenied, type Failure } from "../../../components/business-ui";
import { useShell } from "../../../components/shell-provider";
import type { PlanningGap } from "../../../crm/planning-gaps";
import { addDays } from "../../../scheduling/time";
import { criteriaSearch, defaultCriteria, overviewQuery, sameCriteria } from "../../work-criteria";
import type { readWorkAgenda, readWorkGaps, readWorkOverview, WorkRow } from "../../work-overview";
import {
  agendaDayLabel,
  agendaSlot,
  clockTime,
  dayParts,
  durationLabel,
  durationMinutes,
  firstName,
  greeting,
  isCivilDay,
  localDay,
  longDate,
  nextScheduleId,
  shortDate,
  weekLabel,
  weekOf,
  WORK_TIMEZONE,
} from "../../work-view";
import type { WeatherCondition, WeatherPeriod, WeatherReport } from "../../work-weather";
import { PanelState, useWorkDialogs, type DialogRequest } from "./my-work-list";
import { followUpLabel, MyWorkOverview, useCriteria } from "./my-work-overview";
import { CustomiseDialog } from "./my-work-settings";
import { useMyWork } from "./my-work-shell";
import { Icon, Menu, Tag, useWorkResource, WorkDialog, type IconName } from "./my-work-ui";

type Overview = Awaited<ReturnType<typeof readWorkOverview>>;
type Agenda = Awaited<ReturnType<typeof readWorkAgenda>>;
type Gaps = Awaited<ReturnType<typeof readWorkGaps>>;
type Status = "ok" | "loading" | "not_permitted" | "unavailable";

// The overview a person sees depends on the screen, never on a guess made on the server: until the
// browser has answered, neither presentation is painted.
export function MyWorkResponsiveOverview() {
  const work = useMyWork();
  if (work.phone === null)
    return (
      <div className="mw-page" aria-busy="true">
        <div className="mw-skeleton" role="status">
          Loading your work…
        </div>
      </div>
    );
  return work.phone ? <MyWorkMobileOverview /> : <MyWorkOverview />;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);
const subscribeOnline = (changed: () => void) => {
  window.addEventListener("online", changed);
  window.addEventListener("offline", changed);
  return () => {
    window.removeEventListener("online", changed);
    window.removeEventListener("offline", changed);
  };
};
const calm = () => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth");

// The agenda's day and expansion travel with this history entry, so Back from a record (or a reload)
// returns to the same day. A fresh visit starts on today, and so does a memory made on an earlier
// day: a tab left open overnight never comes back parked on a stale date. `day: null` means "today,
// and follow it past midnight".
type AgendaMemory = { day: string | null; expanded: boolean; on: string };
function rememberedAgenda(): AgendaMemory {
  const on = localDay(new Date().toISOString());
  const saved = (window.history.state as { mwAgenda?: Partial<AgendaMemory> } | null)?.mwAgenda;
  return saved?.on === on ? { day: isCivilDay(saved.day) ? saved.day : null, expanded: saved.expanded === true, on } : { day: null, expanded: false, on };
}

function MyWorkMobileOverview() {
  const me = useIdentity(),
    work = useMyWork(),
    shell = useShell(),
    router = useRouter();
  const c = useCriteria(work.views?.views ?? null);
  const read = useWorkResource<Overview>(`work/overview?${overviewQuery(c.criteria)}`);
  const data = read.data;
  const now = data?.observed_at ?? new Date().toISOString();
  const today = data?.day ?? localDay(now);

  const [memory, setMemory] = useState<AgendaMemory>(rememberedAgenda);
  const selected = memory.day ?? today;
  const scope = useMemo(() => {
    const p = new URLSearchParams({ owner: c.criteria.owner });
    if (c.criteria.company_id) p.set("company_id", c.criteria.company_id);
    return p;
  }, [c.criteria.owner, c.criteria.company_id]);
  const agendaPath = useMemo(() => {
    const p = new URLSearchParams(scope);
    if (c.criteria.kind) p.set("kind", c.criteria.kind);
    // Today is asked for without a date, so the server's own local day answers across midnight.
    if (memory.day) p.set("day", memory.day);
    return `work/agenda?${p}`;
  }, [scope, c.criteria.kind, memory.day]);
  const agenda = useWorkResource<Agenda>(agendaPath);
  useEffect(() => {
    window.history.replaceState({ ...(window.history.state ?? {}), mwAgenda: memory }, "");
  }, [memory]);

  const changed = (message: string) => {
    work.announce(message);
    read.reload();
    agenda.reload();
    work.reloadNavigation();
  };
  const dialogs = useWorkDialogs(now, changed);
  const [sheet, setSheet] = useState<"create" | "scan" | "map" | "gaps" | null>(null);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);

  const denied = isDenied(read.error);
  const state = (panel?: { status: "ok" | "not_permitted" | "unavailable" }): Status =>
    !data ? (read.error ? "unavailable" : "loading") : (panel?.status ?? "ok");
  const mine = c.criteria.owner === "mine";
  const queue = (extra: Partial<typeof defaultCriteria>) => `/work/actions${criteriaSearch({ ...defaultCriteria, owner: c.criteria.owner, company_id: c.criteria.company_id, kind: c.criteria.kind, ...extra })}`;
  const waitingHref = `/work/waiting${criteriaSearch({ ...defaultCriteria, owner: c.criteria.owner, company_id: c.criteria.company_id })}`;
  const opportunitiesHref = `/sales/opportunities?${new URLSearchParams({ next_action: "Needed", ...(mine ? { owner_id: me.actor_id } : {}) })}`;
  const can = (id: string) => shell.context?.navigation.includes(id) ?? false;
  const name = firstName(me.display_name);
  const hidden = work.layout.hidden;

  // Needs attention: different kinds of obligation, each with its own unit and its own queue. They are
  // never added together. A category with nothing in it is left out; one that could not be read says so.
  const attention: { id: string; icon: IconName; status: Status; count: number | null; label: (n: number) => string; tone?: "overdue"; href?: string; onOpen?: () => void }[] = [
    { id: "overdue", icon: "calendar-alert", tone: "overdue", status: state(), count: data?.counts.overdue ?? null, label: (n) => plural(n, "overdue activity", "overdue activities"), href: queue({ due: "Overdue" }) },
    { id: "reviews", icon: "clock", status: state(data?.reviews), count: data?.reviews.status === "ok" ? data.reviews.total : null, label: (n) => `${plural(n, "review awaits", "reviews await")} your decision`, href: "/work/reviews" },
    { id: "gaps", icon: "briefcase", status: state(data?.gaps), count: data?.gaps.status === "ok" ? data.gaps.total : null, label: (n) => `${plural(n, "opportunity", "opportunities")} without a next activity`, onOpen: () => setSheet("gaps") },
    { id: "undated", icon: "calendar", status: state(), count: data?.counts.date_needed ?? null, label: (n) => `${plural(n, "activity needs", "activities need")} a date`, href: queue({ due: "Needed" }) },
  ];
  const raised = attention.filter((a) => a.status === "unavailable" || (a.status === "ok" && (a.count ?? 0) > 0));
  const shown = raised.slice(0, 3);

  const createActivity = () => {
    setSheet(null);
    // The quick form plans against a lead or an opportunity; anything else uses the full form.
    if (work.navigation?.sales) dialogs.open({ kind: "create", day: selected === today ? undefined : selected });
    else router.push("/work/new");
  };

  return (
    <div className="mw-page mw-mobile" aria-busy={read.loading}>
      {!online && (
        <p className="mw-notice mw-notice-attention" role="status">
          <strong>You are offline.</strong> My Work needs a connection. What you see was read earlier and may be out of date, and nothing can be saved until you reconnect.
        </p>
      )}
      <header className="mw-hello">
        <div>
          <h1>{name === "there" ? greeting(now) : `${greeting(now)}, ${name}`}</h1>
          <time className="mw-date" dateTime={today}>
            {longDate(now).replace(/ \d{4}$/, "")}
          </time>
        </div>
        <Tag tone="quiet">{work.department}</Tag>
      </header>
      {!sameCriteria(c.criteria, defaultCriteria) && (
        <p className="mw-scope-note">
          Showing {c.view ? `the saved view “${c.view.name}”${c.modified ? ", modified" : ""}` : "a filtered scope"}
          {mine ? "" : " for everyone you can see"}.{" "}
          <button type="button" className="mw-link" onClick={() => c.use(null)}>
            Show my work
          </button>
        </p>
      )}

      <WeatherCard />

      <section aria-labelledby="mw-quick-title">
        <h2 id="mw-quick-title" className="mw-section-title">
          Quick Actions
        </h2>
        <ul className="mw-tiles">
          <Tile icon="mail" label="Emails" href={can("mail") ? "/email" : null} />
          <Tile icon="target" label="Leads" href={can("leads") ? `/sales/leads?${new URLSearchParams({ owner_id: me.actor_id })}` : null} />
          <Tile icon="map" label="Map" onOpen={() => setSheet("map")} />
          <Tile icon="task" label="Tasks" href={queue({ activity_type: "Task" })} />
        </ul>
      </section>

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

          <section aria-labelledby="mw-attention-title" data-stale={read.stale || undefined}>
            <div className="mw-section-head">
              <h2 id="mw-attention-title" className="mw-section-title">
                Needs attention
              </h2>
              <Link className="mw-link" href={queue({})}>
                View all <Icon name="chevron-right" />
              </Link>
            </div>
            {!data && !read.error ? (
              <ul className="mw-list-panel" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="mw-attention-row mw-placeholder" />
                ))}
              </ul>
            ) : shown.length ? (
              <ul className="mw-list-panel">
                {shown.map((a) => {
                  const ok = a.status === "ok";
                  const body = (
                    <>
                      <span className="mw-attention-row-icon">
                        <Icon name={a.icon} />
                      </span>
                      <strong className={ok && a.tone ? "mw-tone-overdue" : undefined}>{ok ? a.count : "—"}</strong>
                      <span>{ok ? a.label(a.count!) : `${a.label(2)}: could not be loaded. This is not zero.`}</span>
                      {ok && <Icon name="chevron-right" />}
                    </>
                  );
                  return (
                    <li key={a.id}>
                      {!ok ? (
                        <div className="mw-attention-row">{body}</div>
                      ) : a.href ? (
                        <Link className="mw-attention-row" href={a.href}>
                          {body}
                        </Link>
                      ) : (
                        <button type="button" className="mw-attention-row" aria-haspopup="dialog" onClick={a.onOpen}>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mw-list-panel mw-all-clear">Nothing of yours is overdue, undated or waiting on your decision right now. View all shows the rest of your work.</p>
            )}
            {raised.length > shown.length && (
              <p className="mw-quiet-note">
                {raised.length - shown.length} more {plural(raised.length - shown.length, "category", "categories")} in View all.
              </p>
            )}
          </section>

          <AgendaSection
            agenda={agenda}
            today={today}
            selected={selected}
            expanded={memory.expanded}
            showOwner={!mine}
            pick={(day) => setMemory((old) => ({ ...old, day: day === today ? null : day, on: today }))}
            setExpanded={(expanded) => setMemory((old) => ({ ...old, expanded, on: today }))}
            open={dialogs.open}
            moreHref={queue({})}
          />

          {data && !hidden.includes("waiting") && data.waiting.status !== "not_permitted" && (
            <section aria-labelledby="mw-waiting-title" data-stale={read.stale || undefined}>
              <div className="mw-section-head">
                <h2 id="mw-waiting-title" className="mw-section-title">
                  Waiting on others {data.waiting.status === "ok" && <span className="mw-count">{data.waiting.total}</span>}
                </h2>
                <Link className="mw-link" href={waitingHref}>
                  View all <Icon name="chevron-right" />
                </Link>
              </div>
              {data.waiting.status !== "ok" ? (
                <div className="mw-list-panel">
                  <PanelState status={data.waiting.status} what="Waiting requests" retry={read.reload} />
                </div>
              ) : data.waiting.items.length ? (
                <ul className="mw-waiting">
                  {data.waiting.items.slice(0, 2).map((w) => {
                    const late = !!w.follow_up_at && Date.parse(w.follow_up_at) < Date.parse(now);
                    return (
                      <li key={w.id} className="mw-list-panel">
                        <span className="mw-waiting-icon">
                          <Icon name="chat" />
                        </span>
                        <div>
                          <Link className="mw-row-title" href={w.href}>
                            <span>{w.awaited}</span>
                          </Link>
                          <p>{[w.context ?? w.reference, w.respondent_name ?? "Respondent not recorded"].filter(Boolean).join(" · ")}</p>
                          <p className={late ? "mw-tone-overdue" : undefined}>
                            {w.follow_up_at ? `${late ? "Follow-up overdue · " : "Follow up "}${followUpLabel(w.follow_up_at, data.day)}` : "No follow-up date"}
                            {w.waiting_since ? ` · waiting since ${shortDate(w.waiting_since, WORK_TIMEZONE)}` : ""}
                          </p>
                          {/* The action sits at the leading edge, so it never ends up beneath the floating Create control. */}
                          {w.activity?.can_edit ? (
                            <button type="button" className="mw-button" onClick={() => dialogs.open({ kind: "followup", activityId: w.activity!.id })} aria-label={`${w.follow_up_at ? "Follow up" : "Set follow-up date"}: ${w.awaited}`}>
                              {w.follow_up_at ? "Follow up" : "Set follow-up date"}
                            </button>
                          ) : (
                            <Link className="mw-button" href={w.href}>
                              Open source
                            </Link>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mw-list-panel mw-all-clear">Nothing you follow up is waiting on someone else.</p>
              )}
              {data.waiting.status === "ok" && data.waiting.total > 2 && <p className="mw-quiet-note">2 of {data.waiting.total} shown.</p>}
            </section>
          )}

          {data && !hidden.includes("gaps") && data.gaps.status === "ok" && data.gaps.total > 0 && (
            <button type="button" className="mw-list-panel mw-gap-link" aria-haspopup="dialog" onClick={() => setSheet("gaps")}>
              <Icon name="briefcase" />
              <span>
                {data.gaps.total} {plural(data.gaps.total, "opportunity needs", "opportunities need")} a next activity
              </span>
              <Icon name="chevron-right" />
            </button>
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
        <span>{WORK_TIMEZONE.split("/")[1].replace("_", " ")} time</span>
      </footer>

      {!denied && (
        <button type="button" className="mw-fab" aria-label="Create" aria-haspopup="dialog" onClick={() => setSheet("create")}>
          <Icon name="plus" />
        </button>
      )}

      {dialogs.element}
      {sheet === "create" && (
        <CreateSheet
          canCreateActivity={data?.capabilities.can_create !== false}
          agendaDay={selected === today ? null : agendaDayLabel(selected, today)}
          onActivity={createActivity}
          onScan={() => setSheet("scan")}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === "scan" && <ScanSheet onClose={() => setSheet(null)} />}
      {sheet === "map" && <MapSheet can={can} onClose={() => setSheet(null)} />}
      {sheet === "gaps" && (
        <GapsSheet
          query={scope.toString()}
          showOwner={!mine}
          fullHref={can("deals") ? opportunitiesHref : null}
          onPlan={(g) => {
            setSheet(null);
            dialogs.open({ kind: "create", preset: { type: "Opportunity", ...g } });
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {work.customise && <CustomiseDialog onClose={() => work.setCustomise(false)} />}
    </div>
  );
}

// ───────────────────────── Quick Actions ─────────────────────────
// A tile is a link to something that exists, a door to an honest explanation, or plainly unavailable
// to this identity. It never carries a number the application cannot vouch for: the mailbox records
// no read state, so Emails has no unread badge.
function Tile({ icon, label, href, onOpen }: { icon: IconName; label: string; href?: string | null; onOpen?: () => void }) {
  const body = (
    <>
      <Icon name={icon} />
      <span>{label}</span>
    </>
  );
  return (
    <li>
      {href ? (
        <Link className="mw-tile" href={href}>
          {body}
        </Link>
      ) : onOpen ? (
        <button type="button" className="mw-tile" aria-haspopup="dialog" onClick={onOpen}>
          {body}
        </button>
      ) : (
        <span className="mw-tile" aria-disabled="true" title={`${label} is outside your current access`}>
          {body}
          <small>No access</small>
        </span>
      )}
    </li>
  );
}

// ───────────────────────── Weekly agenda ─────────────────────────
function AgendaSection({
  agenda,
  today,
  selected,
  expanded,
  showOwner,
  pick,
  setExpanded,
  open,
  moreHref,
}: {
  agenda: ReturnType<typeof useWorkResource<Agenda>>;
  today: string;
  selected: string;
  expanded: boolean;
  showOwner: boolean;
  pick: (day: string) => void;
  setExpanded: (expanded: boolean) => void;
  open: (request: DialogRequest) => void;
  moreHref: string;
}) {
  const week = useMemo(() => weekOf(selected), [selected]);
  const heading = useRef<HTMLHeadingElement>(null),
    strip = useRef<HTMLDivElement>(null);
  // Only the answer for the selected day is shown; an earlier day's rows are never relabelled.
  const data = agenda.data && agenda.data.day === selected ? agenda.data : null;
  const next = useMemo(() => (data && selected === today ? nextScheduleId(data.items, data.observed_at) : null), [data, selected, today]);
  useEffect(() => {
    // Centre the chosen day within the strip. Only the strip moves: the page's own scroll is the reader's.
    const bar = strip.current,
      day = bar?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (bar && day) bar.scrollLeft += day.getBoundingClientRect().left - bar.getBoundingClientRect().left - (bar.clientWidth - day.offsetWidth) / 2;
  }, [selected]);

  const label = agendaDayLabel(selected, today);
  const rows = data ? (expanded ? data.items : data.items.slice(0, 1)) : [];
  return (
    <section aria-labelledby="mw-agenda-title" className="mw-agenda">
      <div className="mw-section-head">
        <h2 id="mw-agenda-title" className="mw-section-title" ref={heading} tabIndex={-1}>
          Weekly agenda
        </h2>
        <div className="mw-week-nav">
          <button type="button" className="mw-icon-button" onClick={() => pick(addDays(selected, -7))} aria-label="Previous week">
            <Icon name="chevron-left" />
          </button>
          <span>{weekLabel(week)}</span>
          <button type="button" className="mw-icon-button" onClick={() => pick(addDays(selected, 7))} aria-label="Next week">
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>
      <div className="mw-week" role="group" aria-label={`Days of the week of ${weekLabel(week)}`} ref={strip}>
        {week.map((day) => {
          const p = dayParts(day);
          return (
            <button
              key={day}
              type="button"
              className="mw-day"
              aria-pressed={day === selected}
              aria-current={day === today ? "date" : undefined}
              aria-label={`${p.weekday} ${p.date} ${p.month}${day === today ? ", today" : ""}`}
              onClick={() => pick(day)}
            >
              <span>{p.weekday}</span>
              <strong>{p.date}</strong>
            </button>
          );
        })}
      </div>
      <div className="mw-agenda-bar">
        <p className="mw-agenda-count" role="status">
          {label} <span aria-hidden="true">·</span>{" "}
          {data ? `${data.total} ${plural(data.total, "activity", "activities")}` : agenda.error ? "unavailable" : "loading…"}
        </p>
        {selected !== today && (
          <button type="button" className="mw-link" onClick={() => pick(today)}>
            Today
          </button>
        )}
        <label className="mw-goto">
          <Icon name="calendar" />
          <span className="mw-sr">Go to a date</span>
          <input
            type="date"
            value={selected}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {
                /* The field still takes a typed date. */
              }
            }}
            onChange={(e) => isCivilDay(e.target.value) && pick(e.target.value)}
          />
        </label>
        {data && data.total > 1 && (
          <button
            type="button"
            className="mw-link"
            aria-expanded={expanded}
            aria-controls="mw-agenda-list"
            onClick={() => {
              setExpanded(!expanded);
              // Panel 02 of r07: the same agenda, opened in place and brought to the top.
              if (!expanded) requestAnimationFrame(() => heading.current?.scrollIntoView({ block: "start", behavior: calm() }));
            }}
          >
            {expanded ? "Show less" : "View day"} <Icon name={expanded ? "chevron-down" : "chevron-right"} />
          </button>
        )}
      </div>
      <div id="mw-agenda-list">
        {agenda.error && !data ? (
          <div className="mw-list-panel">
            <PanelState status="unavailable" what="This day's activities" retry={agenda.reload} />
          </div>
        ) : !data ? (
          <ul className="mw-list-panel" aria-hidden="true">
            <li className="mw-agenda-row mw-placeholder" />
          </ul>
        ) : rows.length ? (
          <ul className="mw-list-panel">
            {rows.map((row) => (
              <AgendaRow key={row.id} row={row} next={row.id === next} showOwner={showOwner} open={open} />
            ))}
          </ul>
        ) : (
          <p className="mw-list-panel mw-all-clear">{data.completed ? "Nothing is outstanding for this day." : "No activities planned for this day."} Use Create to add one.</p>
        )}
        {data && !expanded && data.total > 1 && <p className="mw-quiet-note">1 of {data.total} shown.</p>}
        {data && expanded && data.completeness !== "Complete" && (
          <p className="mw-quiet-note">
            The first {data.items.length} of {data.total} are shown.{" "}
            <Link className="mw-link" href={moreHref}>
              Open My actions for the rest
            </Link>
          </p>
        )}
        {data && data.completed > 0 && (
          <p className="mw-quiet-note">
            {data.completed} already completed on this day {plural(data.completed, "is", "are")} not listed.
          </p>
        )}
      </div>
    </section>
  );
}

// One row, one target: it opens the activity's details, where Complete and Reschedule live. No
// checkbox, and no repeated buttons to crowd a phone.
function AgendaRow({ row, next, showOwner, open }: { row: WorkRow; next: boolean; showOwner: boolean; open: (request: DialogRequest) => void }) {
  const slot = agendaSlot(row);
  const l = row.linked;
  const context = [l.organisation_name ?? l.title, l.type === "Lead" ? "Lead" : null, durationLabel(durationMinutes(row)) || null, showOwner ? row.owner_name : null].filter(Boolean).join(" · ");
  return (
    <li>
      <button type="button" className="mw-agenda-row" data-activity={row.id} onClick={() => open({ kind: "detail", row })}>
        <time dateTime={row.starts_at ?? row.due_at ?? undefined} title={slot.spoken}>
          {slot.label}
        </time>
        <span className="mw-agenda-text">
          <span className="mw-agenda-title">{row.summary}</span>
          {/* Marks ride with the context line, so the title keeps the row's full width. */}
          <span className="mw-agenda-context">
            {context}
            {row.group === "Overdue" && <Tag tone="overdue">Overdue</Tag>}
            {next && <Tag tone="quiet">Next</Tag>}
          </span>
        </span>
        <Icon name="chevron-right" />
      </button>
    </li>
  );
}

// ───────────────────────── Weather ─────────────────────────
const weatherIcons: Record<WeatherCondition, IconName> = { Clear: "sun", PartlyCloudy: "cloud-sun", Cloudy: "cloud", Rain: "rain", Storm: "rain", Fog: "cloud", Wind: "cloud" };
const degrees = (n: number | null) => (n === null ? "—" : `${Math.round(n)}°`);
function periodFacts(p: WeatherPeriod) {
  // A chance of rain and an amount of rain are different facts and are never merged into one number.
  return [`High ${degrees(p.high_c)}`, `Low ${degrees(p.low_c)}`, p.rain_chance_pct === null ? null : `Rain chance ${Math.round(p.rain_chance_pct)}%`, p.rain_mm === null ? null : `Rainfall ${p.rain_mm} mm`].filter(Boolean) as string[];
}
function WeatherCard() {
  const work = useMyWork();
  const prefs = work.layout.weather;
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [sheet, setSheet] = useState<"forecast" | "location" | null>(null);
  const query = new URLSearchParams(coordinates ? { latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) } : prefs.location ? { location: prefs.location } : {});
  // Weather fails or loads on its own; it never holds up, hides or re-announces the work beneath it.
  const read = useWorkResource<WeatherReport>(prefs.hidden ? null : `work/weather${query.size ? `?${query}` : ""}`, 900000);
  if (prefs.hidden) return null;
  const w = read.data;
  const hide = () => {
    work.saveLayout({ ...work.layout, weather: { ...prefs, hidden: true } });
    work.announce("Weather hidden. Customise overview in the My Work menu brings it back.");
  };
  const menu = (
    <Menu
      name="Weather options"
      icon="dots"
      label="Weather options"
      iconOnly
      quiet
      align="end"
      items={[...(w && w.status !== "not_configured" ? [{ id: "location", label: "Change location", onSelect: () => setSheet("location") }] : []), { id: "hide", label: "Hide weather", onSelect: hide }]}
    />
  );
  return (
    <section className="mw-list-panel mw-weather" aria-label="Local weather" data-status={w?.status ?? (read.error ? "failed" : "loading")}>
      {!w ? (
        <div className="mw-weather-quiet">
          <Icon name="cloud" />
          <p role="status">
            {read.error ? "Weather could not be loaded. " : "Checking local weather…"}
            {!!read.error && (
              <button type="button" className="mw-link" onClick={read.reload}>
                Try again
              </button>
            )}
          </p>
          {menu}
        </div>
      ) : w.status === "not_configured" ? (
        <div className="mw-weather-quiet">
          <Icon name="cloud-off" />
          <p>
            <strong>Weather is not connected</strong>
            <span>Powerplants One has no weather provider yet, so no forecast is shown.</span>
          </p>
          {menu}
        </div>
      ) : w.status === "unavailable" ? (
        <div className="mw-weather-quiet">
          <Icon name="cloud-off" />
          <p role="status">
            <strong>Weather is unavailable right now</strong>
            <span>
              {w.location ? `${w.location} is still your chosen place. ` : ""}
              {w.retryable && (
                <button type="button" className="mw-link" onClick={read.reload}>
                  Try again
                </button>
              )}
            </span>
          </p>
          {menu}
        </div>
      ) : (
        <>
          <div className="mw-weather-top">
            <button type="button" className="mw-weather-place" aria-haspopup="dialog" onClick={() => setSheet("location")} aria-label={`Weather location: ${w.location}. Change location`}>
              <Icon name="pin" />
              <span>{w.location}</span>
              <Icon name="chevron-down" />
            </button>
            {menu}
          </div>
          <div className="mw-weather-now">
            <Icon name={weatherIcons[w.condition]} />
            <strong>{degrees(w.temperature_c)}</strong>
            <span>{w.summary}</span>
          </div>
          <div className="mw-weather-foot">
            <span>{periodFacts(w.today).slice(0, 3).join(" · ")}</span>
            <button type="button" className="mw-link" aria-haspopup="dialog" onClick={() => setSheet("forecast")}>
              View forecast <Icon name="chevron-right" />
            </button>
          </div>
          {w.stale && (
            <p className="mw-quiet-note">
              Updated {shortDate(w.issued_at, WORK_TIMEZONE)}, {clockTime(w.issued_at, WORK_TIMEZONE)}; it may be out of date.
            </p>
          )}
        </>
      )}
      {sheet === "forecast" && w?.status === "ok" && (
        <WorkDialog sheet title={`Forecast for ${w.location}`} subtitle={`Updated ${shortDate(w.issued_at, WORK_TIMEZONE)}, ${clockTime(w.issued_at, WORK_TIMEZONE)}${w.stale ? " · may be out of date" : ""}`} onClose={() => setSheet(null)}>
          <ul className="mw-forecast">
            {[w.today, ...w.forecast].map((p) => (
              <li key={p.valid_from}>
                <Icon name={weatherIcons[p.condition]} />
                <div>
                  <strong>{p.label}</strong>
                  <span>{p.summary}</span>
                  <small>{periodFacts(p).join(" · ")}</small>
                  <small>
                    Valid {shortDate(p.valid_from, WORK_TIMEZONE)}, {clockTime(p.valid_from, WORK_TIMEZONE)} to {clockTime(p.valid_to, WORK_TIMEZONE)}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <p className="mw-hint">
            Temperatures are in degrees Celsius. {w.provider.attribution ?? `Source: ${w.provider.name}.`}{" "}
            {w.provider.url && (
              <a className="mw-link" href={w.provider.url} target="_blank" rel="noreferrer">
                {w.provider.name}
              </a>
            )}{" "}
            A forecast is general information, not advice about whether a site visit should go ahead.
          </p>
        </WorkDialog>
      )}
      {sheet === "location" && w && w.status !== "not_configured" && (
        <LocationSheet
          current={w.location}
          offered={w.status === "ok" ? w.locations : []}
          onChoose={(location) => {
            setCoordinates(null);
            work.saveLayout({ ...work.layout, weather: { hidden: false, location } });
            setSheet(null);
          }}
          onLocate={(found) => {
            setCoordinates(found);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </section>
  );
}
function LocationSheet({
  current,
  offered,
  onChoose,
  onLocate,
  onClose,
}: {
  current: string | null;
  offered: string[];
  onChoose: (location: string) => void;
  onLocate: (coordinates: { latitude: number; longitude: number }) => void;
  onClose: () => void;
}) {
  const [place, setPlace] = useState(current ?? ""),
    [problem, setProblem] = useState(""),
    [locating, setLocating] = useState(false);
  return (
    <WorkDialog sheet title="Weather location" subtitle="Remembered for you in this browser" dirty={place.trim() !== (current ?? "")} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!place.trim()) return setProblem("Type a town, suburb or city.");
          onChoose(place.trim().slice(0, 80));
        }}
      >
        <div className="mw-field">
          <label htmlFor="mw-weather-place">Place</label>
          <input id="mw-weather-place" type="text" maxLength={80} autoComplete="address-level2" value={place} onChange={(e) => setPlace(e.target.value)} data-autofocus />
        </div>
        {offered.length > 0 && (
          <div className="mw-actions" role="group" aria-label="Suggested places">
            {offered.map((o) => (
              <button key={o} type="button" className="mw-button" onClick={() => onChoose(o)}>
                {o}
              </button>
            ))}
          </div>
        )}
        {problem && (
          <p className="mw-inline-error" role="alert">
            {problem}
          </p>
        )}
        <div className="mw-sheet-actions">
          <button type="submit" className="mw-button mw-button-primary">
            Use this place
          </button>
          {/* Device location is asked for only here, after this press. Never when the page loads. */}
          <button
            type="button"
            className="mw-button"
            disabled={locating}
            onClick={() => {
              if (!navigator.geolocation) return setProblem("This browser cannot share a location. Type a place instead.");
              setLocating(true);
              navigator.geolocation.getCurrentPosition(
                (p) => onLocate({ latitude: Number(p.coords.latitude.toFixed(3)), longitude: Number(p.coords.longitude.toFixed(3)) }),
                () => {
                  setLocating(false);
                  setProblem("Your location was not shared. Type a place instead.");
                },
                { maximumAge: 600000, timeout: 15000 },
              );
            }}
          >
            <Icon name="pin" />
            {locating ? "Finding you…" : "Use my current location"}
          </button>
        </div>
        <p className="mw-hint">Your current location is used for this forecast only. It is rounded, is not saved, and is never shown to anyone else.</p>
      </form>
    </WorkDialog>
  );
}

// ───────────────────────── Create ─────────────────────────
// A menu, not a form: it has no Save. Each choice hands over to the record's own form, under that
// form's own permission. The record choices come from the shell's list of what this identity may
// create, so nothing appears here that the server would then refuse.
const createCopy = {
  opportunity: { label: "Opportunity", copy: "Start a sales opportunity", icon: "briefcase" },
  lead: { label: "Lead", copy: "Capture a new enquiry", icon: "target" },
  contact: { label: "Contact", copy: "Add a person", icon: "user" },
  customer: { label: "Organisation", copy: "Customer, supplier or other organisation", icon: "building" },
} as const;
function CreateSheet({
  canCreateActivity,
  agendaDay,
  onActivity,
  onScan,
  onClose,
}: {
  canCreateActivity: boolean;
  agendaDay: string | null;
  onActivity: () => void;
  onScan: () => void;
  onClose: () => void;
}) {
  const shell = useShell();
  const permitted = shell.context?.actions ?? [];
  const records = (["opportunity", "lead", "contact", "customer"] as const).flatMap((id) => {
    const action = permitted.find((a) => a.id === id);
    return action ? [{ id, href: action.href, ...createCopy[id] }] : [];
  });
  const option = (icon: IconName, label: string, copy: string) => (
    <>
      <Icon name={icon} />
      <span>
        <strong>{label}</strong>
        <small>{copy}</small>
      </span>
      <Icon name="chevron-right" />
    </>
  );
  return (
    <WorkDialog sheet title="Create" onClose={onClose}>
      {!shell.context ? (
        <p className="mw-hint" role="status">
          {shell.error ? `${shell.error} ` : "Loading what you can create…"}
          {shell.error && (
            <button type="button" className="mw-link" onClick={shell.reload}>
              Try again
            </button>
          )}
        </p>
      ) : (
        <ul className="mw-create">
          {records.some((r) => r.id === "contact") && (
            <li>
              <button type="button" className="mw-create-option" onClick={onScan}>
                {option("camera", "Scan business card", "Capture and review contact details")}
              </button>
            </li>
          )}
          {canCreateActivity && (
            <li>
              <button type="button" className="mw-create-option" onClick={onActivity}>
                {option("calendar-check", "Activity", agendaDay ? `Call, meeting or task · for ${agendaDay}` : "Call, meeting or task")}
              </button>
            </li>
          )}
          {records.map((r) => (
            <li key={r.id}>
              <Link className="mw-create-option" href={r.href} onClick={onClose}>
                {option(r.icon, r.label, r.copy)}
              </Link>
            </li>
          ))}
          {!canCreateActivity && !records.length && <li className="mw-hint">Your current access does not include creating records.</li>}
        </ul>
      )}
    </WorkDialog>
  );
}

// Reading a card needs a text-extraction service and an image intake for contacts. Neither exists,
// so nothing is captured and no success is imitated; the contact form is the working route.
function ScanSheet({ onClose }: { onClose: () => void }) {
  const shell = useShell();
  const contact = shell.context?.actions.find((a) => a.id === "contact");
  return (
    <WorkDialog sheet title="Scan business card" onClose={onClose}>
      <p className="mw-notice">
        <strong>Card scanning is not available yet.</strong> Reading a card needs a text-extraction service, and Powerplants One has none connected. Nothing is photographed, uploaded or stored from this screen.
      </p>
      <p className="mw-hint">Until it is, add the person yourself. The contact form checks the details and saves only when you choose to, and you can link the person to an existing organisation there.</p>
      <div className="mw-sheet-actions">
        {contact ? (
          <Link className="mw-button mw-button-primary" href={contact.href} onClick={onClose} data-autofocus>
            <Icon name="user" />
            Add the contact manually
          </Link>
        ) : (
          <p className="mw-hint">Your current access does not include creating contacts.</p>
        )}
        <button type="button" className="mw-button" onClick={onClose}>
          Close
        </button>
      </div>
    </WorkDialog>
  );
}

// No map or geocoding provider exists, and the application does not yet capture site coordinates,
// so there is nothing that could be plotted truthfully. The lists are the working alternative.
function MapSheet({ can, onClose }: { can: (id: string) => boolean; onClose: () => void }) {
  const lists = [
    { id: "sites", href: "/sites", label: "Sites", copy: "Addresses and location notes", icon: "pin" },
    { id: "customers", href: "/customers", label: "Organisations", copy: "Customers and prospects", icon: "building" },
    { id: "contacts", href: "/people", label: "Contacts", copy: "People and how to reach them", icon: "user" },
  ] as const;
  return (
    <WorkDialog sheet title="Map" onClose={onClose}>
      <p className="mw-notice">
        <strong>The map is not available yet.</strong> Powerplants One has no map or geocoding provider, and saved sites do not yet carry coordinates, so nothing could be placed on a map truthfully.
      </p>
      <p className="mw-hint">When it arrives it will show saved addresses of organisations, contacts and sites you are permitted to see. It will never track where people are. For now, the same records are in these lists:</p>
      <ul className="mw-create">
        {lists
          .filter((l) => can(l.id))
          .map((l) => (
            <li key={l.id}>
              <Link className="mw-create-option" href={l.href} onClick={onClose}>
                <Icon name={l.icon} />
                <span>
                  <strong>{l.label}</strong>
                  <small>{l.copy}</small>
                </span>
                <Icon name="chevron-right" />
              </Link>
            </li>
          ))}
      </ul>
    </WorkDialog>
  );
}

// ───────────────────────── Opportunities without a next activity ─────────────────────────
// The queue behind both the attention row and the link under Waiting: one read, one population.
function GapsSheet({
  query,
  showOwner,
  fullHref,
  onPlan,
  onClose,
}: {
  query: string;
  showOwner: boolean;
  fullHref: string | null;
  onPlan: (gap: PlanningGap) => void;
  onClose: () => void;
}) {
  const read = useWorkResource<Gaps>(`work/gaps?${query}`, 0);
  const gaps = read.data?.gaps;
  return (
    <WorkDialog sheet title="Opportunities without a next activity" subtitle="Open opportunities whose planned next action is finished" onClose={onClose}>
      {!gaps ? (
        read.error ? (
          <PanelState status="unavailable" what="Opportunities" retry={read.reload} />
        ) : (
          <p role="status">Loading opportunities…</p>
        )
      ) : gaps.status !== "ok" ? (
        <PanelState status={gaps.status} what="Opportunities" retry={read.reload} />
      ) : gaps.items.length ? (
        <ul className="mw-gaps">
          {gaps.items.map((g) => (
            <li key={g.id}>
              <div>
                <Link className="mw-row-title" href={`/sales/opportunities/${g.id}`} onClick={onClose}>
                  <span>{g.title}</span>
                </Link>
                <p>{[g.organisation_name, showOwner ? g.owner_name : null].filter(Boolean).join(" · ")}</p>
                <Tag>{g.stage_id}</Tag>
              </div>
              {g.can_plan ? (
                <button type="button" className="mw-button" aria-label={`Plan activity: ${g.organisation_name}, ${g.title}`} onClick={() => onPlan(g)}>
                  <Icon name="plus" />
                  Plan activity
                </button>
              ) : (
                <small>Owner plans: {g.owner_name}</small>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mw-hint">Every open opportunity in this scope has an active next action.</p>
      )}
      {gaps?.status === "ok" && gaps.total > gaps.items.length && (
        <p className="mw-quiet-note">
          The first {gaps.items.length} of {gaps.total} are listed, longest without a next action first.
        </p>
      )}
      {fullHref && (
        <p className="mw-hint">
          <Link className="mw-link" href={fullHref} onClick={onClose}>
            Open these in Opportunities <Icon name="arrow-right" />
          </Link>
        </p>
      )}
    </WorkDialog>
  );
}
