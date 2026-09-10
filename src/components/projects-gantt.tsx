"use client";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import {
  addDays,
  clamp,
  columnBounds,
  columns,
  dayNumber,
  defaultWidths,
  formatDate,
  paneMaximum,
  phases,
  scheduleIssues,
  sheetWidth,
  timelineRange,
  todayInZone,
  type Column,
  type Schedule,
  type Task,
  type Widths,
} from "../projects/model";

export function GanttIcon({
  name,
}: {
  name:
    | "plus"
    | "gantt"
    | "list"
    | "search"
    | "calendar"
    | "chev"
    | "down"
    | "sliders"
    | "fit";
}) {
  const paths = {
    plus: "M12 5v14M5 12h14",
    gantt: "M3 4v16h18M7 6h7M10 11h9M15 16h6",
    list: "M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1",
    search: "M16 16l5 5",
    calendar: "M7 2v6M17 2v6M3 11h18M7 15h3m4 0h3",
    chev: "m9 5 7 7-7 7",
    down: "m5 9 7 7 7-7",
    sliders: "M4 6h5m5 0h6M4 12h10m5 0h1M4 18h2m5 0h9",
    fit: "M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4M8 12h8",
  };
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[name]} />
      {name === "search" && <circle cx="10.5" cy="10.5" r="6.5" />}
      {name === "calendar" && (
        <rect x="3" y="5" width="18" height="16" rx="2" />
      )}
      {name === "sliders" && (
        <>
          <circle cx="11" cy="6" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="8" cy="18" r="2" />
        </>
      )}
    </svg>
  );
}
const initials = (name: string | null) =>
  name
    ? name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0])
        .join("")
    : "–";
const statusClass = (t: Task) =>
  ({
    Planned: "planned",
    InProgress: "active",
    AtRisk: "risk",
    Complete: "complete",
  })[t.status];
type GripProps = {
  label: string;
  value: number;
  bounds: readonly [number, number];
  reset: number;
  className: string;
  onChange: (v: number) => void;
  onStart: () => () => void;
  onEnd: () => void;
};
function ResizeGrip({
  label,
  value,
  bounds,
  reset,
  className,
  onChange,
  onStart,
  onEnd,
}: GripProps) {
  const node = useRef<HTMLSpanElement>(null);
  const drag = useRef<{
    x: number;
    value: number;
    restore: () => void;
    pointer: number;
  } | null>(null);
  const frame = useRef<number | null>(null);
  const finish = (cancel = false) => {
    const d = drag.current;
    if (!d) return;
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    if (cancel) {
      onChange(d.value);
      d.restore();
    }
    drag.current = null;
    onEnd();
    if (node.current?.hasPointerCapture(d.pointer))
      node.current.releasePointerCapture(d.pointer);
  };
  const finishRef = useRef(finish);
  useLayoutEffect(() => {
    finishRef.current = finish;
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (drag.current && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finishRef.current(true);
      }
    };
    const cancel = () => finishRef.current(true);
    document.addEventListener("keydown", key, true);
    window.addEventListener("blur", cancel);
    return () => {
      document.removeEventListener("keydown", key, true);
      window.removeEventListener("blur", cancel);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, []);
  return (
    <span
      ref={node}
      className={className}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={bounds[0]}
      aria-valuemax={bounds[1]}
      aria-valuenow={Math.round(value)}
      aria-valuetext={`${Math.round(value)} pixels`}
      aria-controls="ppogantt-table"
      aria-describedby="ppogantt-resizeHelp"
      title={`${label}. Drag or use arrow keys; Enter resets. Escape cancels a drag.`}
      onDoubleClick={() => onChange(clamp(reset, ...bounds))}
      onPointerDown={(e) => {
        if (e.button !== 0 || drag.current) return;
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
        drag.current = {
          x: e.clientX,
          value,
          pointer: e.pointerId,
          restore: onStart(),
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        const next = clamp(Math.round(d.value + e.clientX - d.x), ...bounds);
        if (frame.current !== null) cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          frame.current = null;
          onChange(next);
        });
      }}
      onPointerUp={(e) => {
        const d = drag.current;
        if (!d || d.pointer !== e.pointerId) return;
        onChange(clamp(Math.round(d.value + e.clientX - d.x), ...bounds));
        finish();
      }}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish(true)}
      onKeyDown={(e) => {
        if (drag.current) return;
        const next =
          e.key === "Home"
            ? bounds[0]
            : e.key === "End"
              ? bounds[1]
              : e.key === "Enter"
                ? reset
                : e.key === "ArrowLeft"
                  ? value - (e.shiftKey ? 40 : 10)
                  : e.key === "ArrowRight"
                    ? value + (e.shiftKey ? 40 : 10)
                    : null;
        if (next !== null) {
          e.preventDefault();
          onChange(clamp(next, ...bounds));
        }
      }}
    />
  );
}
const columnNames: Record<Column, string> = {
  task: "Task name",
  owner: "Owner",
  start: "Start",
  finish: "Finish",
  progress: "Progress (%)",
};
type Layout = { pane: number; gantt: Widths; list: Widths };
const initialLayout = (): Layout => ({
  pane: 632,
  gantt: { ...defaultWidths.gantt },
  list: { ...defaultWidths.list },
});
function validLayout(v: unknown): v is Layout {
  if (!v || typeof v !== "object") return false;
  const x = v as Layout;
  return (
    Number.isFinite(x.pane) &&
    x.pane >= 240 &&
    x.pane <= 960 &&
    ["gantt", "list"].every((view) =>
      columns.every((c) => {
        const n = x[view as "gantt" | "list"]?.[c];
        return (
          Number.isFinite(n) &&
          n >= columnBounds[c][0] &&
          n <= columnBounds[c][1]
        );
      }),
    )
  );
}
export function ProjectsGantt({
  schedule,
  preferenceKey,
  onTask,
  onHistory,
  onRefresh,
  loading = false,
  saved = "",
}: {
  schedule: Schedule;
  preferenceKey: string;
  onTask: (task: Task | null) => void;
  onHistory: () => void;
  onRefresh: () => void;
  loading?: boolean;
  saved?: string;
}) {
  const { project, tasks } = schedule;
  // This component mounts after the current session's schedule fetch, on the client.
  const [layout, setLayout] = useState(() => {
    try {
      const v: unknown = JSON.parse(
        localStorage.getItem(preferenceKey) ?? "null",
      );
      if (validLayout(v)) return v;
    } catch {
      /* Optional geometry preferences. */
    }
    return initialLayout();
  });
  const [view, setView] = useState<"gantt" | "list">("gantt"),
    [scale, setScale] = useState<"week" | "month" | "fit">("fit");
  const [available, setAvailable] = useState(1240),
    [sheetOffset, setSheetOffset] = useState(0),
    [timelineOffset, setTimelineOffset] = useState(0);
  const [query, setQuery] = useState(""),
    [ownerFilter, setOwnerFilter] = useState("all"),
    [issueOnly, setIssueOnly] = useState(false),
    [undatedOnly, setUndatedOnly] = useState(false);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set()),
    [display, setDisplay] = useState(false),
    [links, setLinks] = useState(true),
    [labels, setLabels] = useState(true),
    [weekends, setWeekends] = useState(true);
  const [resizing, setResizing] = useState<"pane" | "column" | null>(null),
    [includeToday, setIncludeToday] = useState(false),
    [anchor, setAnchor] = useState<string | null>(null);
  const [today, setToday] = useState(() => todayInZone(project.timezone));
  const host = useRef<HTMLElement>(null),
    grid = useRef<HTMLDivElement>(null),
    sheetRail = useRef<HTMLDivElement>(null),
    timelineRail = useRef<HTMLDivElement>(null),
    displayPanel = useRef<HTMLDivElement>(null),
    displayToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!resizing)
      try {
        localStorage.setItem(preferenceKey, JSON.stringify(layout));
      } catch {
        /* In-memory resizing remains available. */
      }
  }, [layout, preferenceKey, resizing]);
  useEffect(() => {
    const tick = () => setToday(todayInZone(project.timezone));
    const timer = setInterval(tick, 60000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [project.timezone]);
  useLayoutEffect(() => {
    const node = grid.current;
    if (!node) return;
    const resize = () => {
      setAvailable(node.clientWidth);
      host.current?.style.setProperty(
        "--scroll-gutter",
        `${node.offsetWidth - node.clientWidth}px`,
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(node);
    resize();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!display) return;
    displayPanel.current?.querySelector("input")?.focus();
    const outside = (e: Event) => {
      if (
        !(e.target instanceof Node) ||
        displayPanel.current?.contains(e.target) ||
        displayToggle.current?.contains(e.target)
      )
        return;
      setDisplay(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDisplay(false);
        displayToggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, [display]);
  useEffect(() => {
    const node = grid.current;
    if (!node) return;
    const wheel = (e: WheelEvent) => {
      const horizontal = e.shiftKey ? e.deltaY || e.deltaX : e.deltaX;
      if (!horizontal) return;
      const isSheet = (e.target as Element).closest(".task-cells,.left-head");
      const rail =
        isSheet || host.current?.dataset.view === "list"
          ? sheetRail.current
          : timelineRail.current;
      if (rail) {
        rail.scrollLeft +=
          horizontal *
          (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? rail.clientWidth : 1);
        e.preventDefault();
      }
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, []);
  const effectiveView = available < 780 ? "list" : view,
    widths = layout[effectiveView],
    left =
      effectiveView === "list"
        ? available
        : clamp(layout.pane, 240, paneMaximum(available)),
    viewport = Math.max(1, available - left),
    sheet = sheetWidth(widths);
  const range = useMemo(
    () =>
      timelineRange(
        includeToday
          ? [...tasks, { start_date: today, finish_date: today } as Task]
          : tasks,
        today,
        project.target_date,
      ),
    [tasks, today, project.target_date, includeToday],
  );
  const day =
      scale === "fit"
        ? viewport / range.days
        : Math.min(scale === "week" ? 14 : 4, 8000000 / range.days),
    timeline = Math.max(viewport, range.days * day);
  useLayoutEffect(() => {
    if (!anchor || !timelineRail.current) return;
    timelineRail.current.scrollLeft =
      (dayNumber(anchor) - dayNumber(range.start) + 0.5) * day - viewport / 2;
    setTimelineOffset(timelineRail.current.scrollLeft);
    setAnchor(null);
  }, [anchor, day, range.start, viewport]);
  useLayoutEffect(() => {
    if (sheetRail.current) setSheetOffset(sheetRail.current.scrollLeft);
    if (timelineRail.current)
      setTimelineOffset(timelineRail.current.scrollLeft);
  }, [left, sheet, timeline, effectiveView]);
  const issues = useMemo(
    () => new Map(tasks.map((t) => [t.id, scheduleIssues(t, tasks)])),
    [tasks],
  );
  const filtered = tasks.filter(
    (t) =>
      (!query ||
        `${t.title} ${t.note ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase())) &&
      (!issueOnly || issues.get(t.id)!.length) &&
      (!undatedOnly || !t.start_date) &&
      (ownerFilter === "all" ||
        (ownerFilter === "unassigned"
          ? !t.owner_name
          : ownerFilter === "internal"
            ? !!t.owner_id
            : ownerFilter === "external"
              ? !!t.external_owner_id
              : (t.owner_id ?? t.external_owner_id) === ownerFilter)),
  );
  const activeFilters = !!(
    query ||
    issueOnly ||
    undatedOnly ||
    ownerFilter !== "all"
  );
  const phaseRanges = new Map(
    phases.map((phase) => {
      const items = filtered.filter(
        (t) => t.phase === phase && t.start_date && t.finish_date,
      );
      return [
        phase,
        items.length
          ? {
              start: items.reduce(
                (a, t) => (t.start_date! < a ? t.start_date! : a),
                items[0].start_date!,
              ),
              finish: items.reduce(
                (a, t) => (t.finish_date! > a ? t.finish_date! : a),
                items[0].finish_date!,
              ),
              complete: items.every((t) => t.status === "Complete"),
            }
          : null,
      ];
    }),
  );
  const rows = phases.flatMap((phase) => {
    const matches = filtered.filter((t) => t.phase === phase);
    return matches.length
      ? [
          { phase, task: null as Task | null },
          ...(!collapsed.has(phase)
            ? matches.map((task) => ({ phase, task }))
            : []),
        ]
      : [];
  });
  const positions = new Map(
    rows.flatMap((r, i) =>
      r.task?.start_date && r.task.finish_date
        ? [
            [
              r.task.id,
              {
                task: r.task,
                x:
                  (dayNumber(r.task.start_date) - dayNumber(range.start)) * day,
                end:
                  (dayNumber(r.task.finish_date) - dayNumber(range.start) + 1) *
                  day,
                y: i * 38 + 19,
              },
            ] as const,
          ]
        : [],
    ),
  );
  const clearFilters = () => {
    setQuery("");
    setOwnerFilter("all");
    setIssueOnly(false);
    setUndatedOnly(false);
  };
  const startResize = (kind: "pane" | "column") => {
    const so = sheetRail.current?.scrollLeft ?? 0,
      to = timelineRail.current?.scrollLeft ?? 0;
    setResizing(kind);
    return () => {
      requestAnimationFrame(() => {
        if (sheetRail.current) sheetRail.current.scrollLeft = so;
        if (timelineRail.current) timelineRail.current.scrollLeft = to;
        setSheetOffset(so);
        setTimelineOffset(to);
      });
    };
  };
  const changeScale = (next: typeof scale) => {
    setAnchor(
      addDays(range.start, Math.floor((timelineOffset + viewport / 2) / day)),
    );
    setScale(next);
  };
  const owners = [
    ...new Map(
      tasks
        .filter((t) => t.owner_name && (t.owner_id || t.external_owner_id))
        .map((t) => [t.owner_id ?? t.external_owner_id!, t.owner_name!]),
    ).entries(),
  ];
  const firstVisible = Math.max(0, Math.floor(timelineOffset / day)),
    lastVisible = Math.min(
      range.days - 1,
      Math.ceil((timelineOffset + viewport) / day),
    );
  const ticks = [],
    step = Math.max(7, Math.ceil(70 / day / 7) * 7);
  for (
    let i = Math.floor(firstVisible / step) * step;
    i <= lastVisible;
    i += step
  )
    ticks.push(i);
  const months: { x: number; width: number; title: string }[] = [];
  const monthStep = day * 28 >= 65 ? 1 : day * 90 >= 65 ? 3 : 12;
  const monthDate = new Date(addDays(range.start, firstVisible) + "T00:00:00Z");
  monthDate.setUTCDate(1);
  monthDate.setUTCMonth(
    Math.floor(monthDate.getUTCMonth() / monthStep) * monthStep,
  );
  // Header rendering depends on the visible window, even for multi-year schedules.
  if (lastVisible - firstVisible > 1461) {
    const chunk = Math.max(
      365,
      Math.ceil((lastVisible - firstVisible) / 12 / 365) * 365,
    );
    for (let i = firstVisible; i <= lastVisible; i += chunk)
      months.push({
        x: i * day,
        width: chunk * day,
        title: addDays(range.start, i).slice(0, 4),
      });
  }
  while (
    lastVisible - firstVisible <= 1461 &&
    dayNumber(monthDate.toISOString().slice(0, 10)) <=
      dayNumber(range.start) + lastVisible
  ) {
    const first = monthDate.toISOString().slice(0, 10);
    const year = monthDate.getUTCFullYear(),
      quarter = Math.floor(monthDate.getUTCMonth() / 3) + 1;
    monthDate.setUTCMonth(monthDate.getUTCMonth() + monthStep);
    const end = monthDate.toISOString().slice(0, 10);
    const from = Math.max(0, dayNumber(first) - dayNumber(range.start)),
      to = Math.min(range.days, dayNumber(end) - dayNumber(range.start));
    months.push({
      x: from * day,
      width: (to - from) * day,
      title:
        monthStep === 12
          ? String(year)
          : monthStep === 3
            ? `Q${quarter} ${year}`
            : new Intl.DateTimeFormat("en-AU", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(first + "T00:00:00Z")),
    });
  }
  const css = {
    "--left": `${left}px`,
    "--timeline": `${timeline}px`,
    "--day": `${day}px`,
    "--grid-step": `${day < 3 ? step * day : 7 * day}px`,
    "--sheet-columns": `32px ${columns.map((c) => widths[c] + "px").join(" ")}`,
    "--sheet-width": `${sheet}px`,
    "--sheet-offset": `${sheetOffset}px`,
    "--time-offset": `${timelineOffset}px`,
  } as CSSProperties;
  const revealColumn = (element: HTMLElement) => {
    const c = element.closest<HTMLElement>("[data-sheet-column]")?.dataset
      .sheetColumn as Column | undefined;
    if (!c || !sheetRail.current) return;
    const from =
        32 +
        columns
          .slice(0, columns.indexOf(c))
          .reduce((n, key) => n + widths[key], 0),
      to = from + widths[c];
    const point = element.getAttribute("role") === "separator" ? to + 5 : from;
    const rail = sheetRail.current;
    if (point < rail.scrollLeft + 8) rail.scrollLeft = Math.max(0, point - 8);
    else if (point > rail.scrollLeft + left - 10)
      rail.scrollLeft = point - left + 10;
  };
  return (
    <section
      id="ppo-gantt-page"
      ref={host}
      aria-label="Project schedule workspace"
      style={css}
      data-calendar-detail={day >= 3}
      data-view={effectiveView}
      data-owner-expanded={widths.owner >= 144}
      data-resizing={resizing === "pane"}
      data-column-resizing={resizing === "column"}
    >
      <div className="main">
        <div className="page">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li>
                <Link href="/projects">Projects</Link>
              </li>
              <li>
                <GanttIcon name="chev" />
                <span>{project.display_number}</span>
              </li>
              <li>
                <GanttIcon name="chev" />
                <span aria-current="page">Schedule</span>
              </li>
            </ol>
          </nav>
          <section className="project-header" aria-label="Project overview">
            <div className="project-title">
              <div className="eyebrow">
                {project.display_number}
                <span className="sep" />
                Project delivery
              </div>
              <h1>{project.title}</h1>
              <div className="identity">
                <Link href={`/customers/${project.organisation_id}`}>
                  {project.customer_name}
                </Link>
                <span className="sep" />
                <Link href={`/sites/${project.site_id}`}>
                  {project.site_name}
                </Link>
              </div>
            </div>
            <div className="project-outlook">
              <div className="outlook-item">
                <span>Target handover</span>
                <strong>
                  {project.target_date
                    ? formatDate(project.target_date)
                    : "Not set"}
                </strong>
                <span className="target-note">Project target</span>
              </div>
              <div className="outlook-item project-owner-block">
                <span>Project coordinator</span>
                <div className="project-owner">
                  <span className="avatar green" aria-hidden="true">
                    {initials(project.coordinator_name)}
                  </span>
                  <strong>{project.coordinator_name}</strong>
                </div>
              </div>
            </div>
          </section>
          <div className="section-tabs">
            <span className="current">
              Schedule <span className="count">{tasks.length}</span>
            </span>
            <button className="schedule-history" onClick={onHistory}>
              Change history
            </button>
            <span className="preview-state" role="status">
              {loading
                ? "Refreshing…"
                : saved || `Saved · version ${project.version}`}
            </span>
            <button
              className="icon-btn"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh schedule"
            >
              ↻
            </button>
          </div>
          <section className="schedule-card" aria-label="Project schedule">
            <div className="toolbar">
              <div
                className="seg schedule-view-toggle"
                aria-label="Schedule view"
                role="group"
              >
                <button
                  aria-pressed={effectiveView === "gantt"}
                  disabled={available < 780}
                  onClick={() => setView("gantt")}
                >
                  <GanttIcon name="gantt" />
                  Gantt
                </button>
                <button
                  aria-pressed={effectiveView === "list"}
                  onClick={() => setView("list")}
                >
                  <GanttIcon name="list" />
                  List
                </button>
              </div>
              {project.can_edit && (
                <button
                  className="btn primary"
                  id="ppogantt-addTask"
                  aria-label="Add task or milestone"
                  disabled={loading}
                  onClick={() => onTask(null)}
                >
                  <GanttIcon name="plus" />
                  Task
                </button>
              )}
              <span className="toolbar-line" />
              <div className="search">
                <GanttIcon name="search" />
                <input
                  aria-label="Search tasks"
                  placeholder="Search tasks"
                  maxLength={200}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCollapsed(new Set());
                  }}
                />
              </div>
              <select
                aria-label="Filter by owner"
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setCollapsed(new Set());
                }}
              >
                <option value="all">All owners</option>
                <option value="internal">Internal team</option>
                <option value="external">External stakeholders</option>
                <option value="unassigned">Unassigned</option>
                {owners.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              {effectiveView === "gantt" && (
                <div
                  className="range-controls"
                  role="group"
                  aria-label="Timeline navigation"
                >
                  <button
                    className="btn"
                    onClick={() => {
                      setIncludeToday(true);
                      setScale("week");
                      setAnchor(today);
                    }}
                  >
                    Today
                  </button>
                  <button
                    className="btn"
                    aria-pressed={scale === "fit"}
                    onClick={() => {
                      setIncludeToday(false);
                      setScale("fit");
                      setAnchor(null);
                    }}
                  >
                    <GanttIcon name="fit" />
                    Fit project
                  </button>
                  <div className="seg" role="group" aria-label="Timeline scale">
                    <button
                      aria-pressed={scale === "week"}
                      onClick={() => changeScale("week")}
                    >
                      Week
                    </button>
                    <button
                      aria-pressed={scale === "month"}
                      onClick={() => changeScale("month")}
                    >
                      Month
                    </button>
                  </div>
                </div>
              )}
              <div className="display-wrap">
                <button
                  className="btn"
                  ref={displayToggle}
                  aria-label="Display options"
                  aria-expanded={display}
                  aria-controls="ppogantt-display"
                  onClick={() => setDisplay(!display)}
                >
                  <GanttIcon name="sliders" />
                </button>
                <div
                  className="popover"
                  ref={displayPanel}
                  id="ppogantt-display"
                  hidden={!display}
                >
                  <h3>Display options</h3>
                  {[
                    ["Dependency links", links, setLinks],
                    ["Task labels", labels, setLabels],
                    ["Weekend shading", weekends, setWeekends],
                  ].map(([label, checked, set]) => (
                    <label key={String(label)}>
                      <input
                        type="checkbox"
                        checked={checked as boolean}
                        onChange={(e) =>
                          (set as (v: boolean) => void)(e.target.checked)
                        }
                      />
                      {label as string}
                    </label>
                  ))}
                  <p>
                    Dates are entered manually. Dependency links flag conflicts.
                  </p>
                </div>
              </div>
            </div>
            <div className="schedule-bar">
              <GanttIcon name="calendar" />
              <strong>
                {formatDate(range.start)} – {formatDate(range.end)}
              </strong>
              <span className="sep" />
              <span>
                {tasks.filter((t) => !t.milestone).length} tasks ·{" "}
                {tasks.filter((t) => t.milestone).length} milestones
              </span>
              <button
                className="issue-btn"
                aria-pressed={issueOnly}
                onClick={() => {
                  setIssueOnly(!issueOnly);
                  setCollapsed(new Set());
                }}
              >
                {tasks.filter((t) => issues.get(t.id)!.length).length} schedule
                issues
              </button>
              <button
                className="undated-link"
                aria-pressed={undatedOnly}
                onClick={() => {
                  setUndatedOnly(!undatedOnly);
                  setCollapsed(new Set());
                }}
              >
                {tasks.filter((t) => !t.start_date).length} unscheduled
              </button>
            </div>
            {activeFilters && (
              <div className="active-filters">
                <span>
                  {filtered.length} of {tasks.length} items match
                </span>
                <button className="clear-filters" onClick={clearFilters}>
                  Clear filters
                </button>
              </div>
            )}
            <div className="schedule-viewport">
              <div
                ref={grid}
                className={`grid-scroll ${effectiveView === "list" ? "list-mode" : ""}`}
                tabIndex={0}
                aria-label="Schedule rows. Use the separate horizontal scrollbars for columns and timeline."

                onFocusCapture={(e) => revealColumn(e.target as HTMLElement)}
              >
                <div
                  id="ppogantt-table"
                  className={`gantt ${links ? "" : "no-deps"} ${labels ? "" : "no-labels"} ${weekends ? "" : "no-weekends"}`}
                  role="table"
                  aria-label="Project tasks and timeline"
                  aria-colcount={effectiveView === "list" ? 6 : 7}
                >
                  <div className="grid-head" role="row">
                    <div className="left-head" role="presentation">
                      <div
                        className="sheet-row"
                        id="ppogantt-columnHeaderTrack"
                        role="presentation"
                      >
                        <div
                          role="columnheader"
                          className="row-num"
                          aria-label="Row number"
                        >
                          #
                        </div>
                        {columns.map((c, i) => (
                          <div
                            key={c}
                            role="columnheader"
                            aria-colindex={i + 2}
                            data-sheet-column={c}
                            className={
                              c === "task"
                                ? "task-head"
                                : c === "owner"
                                  ? "owner-head"
                                  : c === "progress"
                                    ? "percent-head"
                                    : "date-head"
                            }
                          >
                            {c === "task" && (
                              <button
                                className="icon-btn"
                                aria-label={
                                  collapsed.size === phases.length
                                    ? "Expand all phases"
                                    : "Collapse all phases"
                                }
                                onClick={() =>
                                  setCollapsed(
                                    collapsed.size === phases.length
                                      ? new Set()
                                      : new Set(phases),
                                  )
                                }
                              >
                                <GanttIcon
                                  name={
                                    collapsed.size === phases.length
                                      ? "chev"
                                      : "down"
                                  }
                                />
                              </button>
                            )}
                            <span>
                              {c === "progress" ? "%" : columnNames[c]}
                            </span>
                            <ResizeGrip
                              label={`Resize ${columnNames[c]} column`}
                              value={widths[c]}
                              bounds={columnBounds[c]}
                              reset={defaultWidths[effectiveView][c]}
                              className="column-resize"
                              onChange={(value) =>
                                setLayout((l) => ({
                                  ...l,
                                  [effectiveView]: {
                                    ...l[effectiveView],
                                    [c]: value,
                                  },
                                }))
                              }
                              onStart={() => startResize("column")}
                              onEnd={() => setResizing(null)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {effectiveView === "gantt" && (
                      <div
                        className="time-viewport"
                        role="columnheader"
                        aria-colindex={7}
                        aria-label="Timeline"
                      >
                        <div className="head-time">
                          <div className="month-line">
                            {months.map((m) => (
                              <div
                                key={m.x}
                                className="month-label"
                                style={{
                                  left: m.x,
                                  width: m.width,
                                  paddingLeft: Math.max(
                                    10,
                                    timelineOffset - m.x + 10,
                                  ),
                                }}
                              >
                                {m.title}
                              </div>
                            ))}
                          </div>
                          <div className="week-line">
                            {ticks.map((i) => (
                              <div
                                key={i}
                                className="week-label"
                                style={{ left: i * day, width: step * day }}
                              >
                                {formatDate(addDays(range.start, i), false)}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="body-rows" role="rowgroup">
                    {rows.map(({ phase, task }) =>
                      task ? (
                        <div
                          className={`task-row ${issues.get(task.id)!.length ? "conflict" : ""}`}
                          role="row"
                          key={task.id}
                          data-task-id={task.id}
                        >
                          <div className="task-cells" role="presentation">
                            <div className="sheet-row" role="presentation">
                              <div className="cell row-num" role="cell">
                                {tasks.indexOf(task) + 1}
                              </div>
                              <div
                                className="cell task-name"
                                role="rowheader"
                                data-sheet-column="task"
                              >
                                <i
                                  aria-hidden="true"
                                  className={
                                    task.milestone
                                      ? "tiny-diamond"
                                      : `task-dot ${statusClass(task)}`
                                  }
                                />
                                <button
                                  className="name"
                                  title={task.title}
                                  onClick={() => onTask(task)}
                                >
                                  {task.title}
                                </button>
                                {!!issues.get(task.id)!.length && (
                                  <span
                                    className="issue-mark"
                                    title={issues.get(task.id)!.join(" ")}
                                  >
                                    !<span className="sr">Schedule issue</span>
                                  </span>
                                )}
                              </div>
                              <div
                                className="cell owner-cell"
                                role="cell"
                                data-sheet-column="owner"
                              >
                                <button
                                  className="owner-button"
                                  title={task.owner_name ?? "Unassigned"}
                                  aria-label={`${task.owner_name ?? "Unassigned"}${task.external_owner_id ? ", external owner" : ""}`}
                                  onClick={() => onTask(task)}
                                >
                                  <span
                                    className={`avatar ${task.external_owner_id ? "gold" : "green"}`}
                                    aria-hidden="true"
                                  >
                                    {initials(task.owner_name)}
                                  </span>
                                  {task.external_owner_id && (
                                    <span
                                      className="ext-mark"
                                      aria-hidden="true"
                                    >
                                      EXT
                                    </span>
                                  )}
                                  <span
                                    className="owner-name"
                                    aria-hidden="true"
                                  >
                                    {task.owner_name ?? "Unassigned"}
                                  </span>
                                </button>
                              </div>
                              {(["start", "finish"] as const).map((c) => {
                                const date =
                                  c === "start"
                                    ? task.start_date
                                    : task.finish_date;
                                return (
                                  <div
                                    key={c}
                                    className="cell dates with-year"
                                    data-sheet-column={c}
                                    role="cell"
                                    aria-label={`${columnNames[c]}: ${formatDate(date)}`}
                                  >
                                    {date ? (
                                      <>
                                        {formatDate(date, false)}
                                        <span className="date-year">
                                          {date.slice(0, 4)}
                                        </span>
                                      </>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                );
                              })}
                              <div
                                className="cell pct"
                                role="cell"
                                data-sheet-column="progress"
                              >
                                {task.progress}%
                              </div>
                            </div>
                          </div>
                          {effectiveView === "gantt" && (
                            <div
                              className="time-viewport"
                              role="cell"
                              aria-colindex={7}
                            >
                              <div className="time-cell">
                                {task.start_date && task.finish_date ? (
                                  <button
                                    className={
                                      task.milestone
                                        ? "milestone-hit"
                                        : `bar ${statusClass(task)} ${issues.get(task.id)!.length ? "conflicted" : ""}`
                                    }
                                    style={{
                                      left:
                                        (dayNumber(task.start_date) -
                                          dayNumber(range.start) +
                                          (task.milestone ? 0.5 : 0)) *
                                        day,
                                      ...(task.milestone
                                        ? {}
                                        : {
                                            width: Math.max(
                                              8,
                                              (dayNumber(task.finish_date) -
                                                dayNumber(task.start_date) +
                                                1) *
                                                day,
                                            ),
                                          }),
                                    }}
                                    onClick={() => onTask(task)}
                                    title={`${task.title} · ${formatDate(task.start_date)} – ${formatDate(task.finish_date)} · ${task.progress}%`}
                                    aria-label={`${task.title}, ${formatDate(task.start_date)} to ${formatDate(task.finish_date)}, ${task.progress}%`}
                                    onFocus={() => {
                                      const position = positions.get(task.id)!;
                                      const rail = timelineRail.current;
                                      if (
                                        rail &&
                                        (position.x < rail.scrollLeft ||
                                          position.x >
                                            rail.scrollLeft + viewport - 30)
                                      )
                                        rail.scrollLeft = position.x - 40;
                                    }}
                                  >
                                    {task.milestone ? (
                                      <>
                                        <span
                                          className={`milestone-shape ${statusClass(task)}`}
                                        />
                                        <span className="milestone-label">
                                          {task.title}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span
                                          className="bar-fill"
                                          style={{ width: `${task.progress}%` }}
                                        />
                                        <span className="bar-title">
                                          {task.title}
                                        </span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    className="unscheduled-text"
                                    style={{ left: timelineOffset + 12 }}
                                  >
                                    Unscheduled
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="task-row group" role="row" key={phase}>
                          <div className="task-cells" role="presentation">
                            <div className="sheet-row" role="presentation">
                              <div
                                className="group-name"
                                role="rowheader"
                                aria-colspan={6}
                              >
                                <button
                                  aria-expanded={!collapsed.has(phase)}
                                  onClick={() =>
                                    setCollapsed((s) => {
                                      const next = new Set(s);
                                      if (next.has(phase)) next.delete(phase);
                                      else next.add(phase);
                                      return next;
                                    })
                                  }
                                >
                                  <GanttIcon
                                    name={
                                      collapsed.has(phase) ? "chev" : "down"
                                    }
                                  />
                                  <span>{phase}</span>
                                  <span className="group-count">
                                    {
                                      filtered.filter((t) => t.phase === phase)
                                        .length
                                    }
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                          {effectiveView === "gantt" && (
                            <div className="time-viewport" role="cell">
                              <div className="time-cell">
                                {phaseRanges.get(phase) && (
                                  <span
                                    className={`summary-bar ${phaseRanges.get(phase)!.complete ? "complete" : ""}`}
                                    style={{
                                      left:
                                        (dayNumber(
                                          phaseRanges.get(phase)!.start,
                                        ) -
                                          dayNumber(range.start)) *
                                        day,
                                      width: Math.max(
                                        4,
                                        (dayNumber(
                                          phaseRanges.get(phase)!.finish,
                                        ) -
                                          dayNumber(
                                            phaseRanges.get(phase)!.start,
                                          ) +
                                          1) *
                                          day,
                                      ),
                                    }}
                                    title={`${phase}: ${formatDate(phaseRanges.get(phase)!.start)} – ${formatDate(phaseRanges.get(phase)!.finish)}`}
                                  >
                                    <span className="summary-title">
                                      {phase}
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                    {effectiveView === "gantt" && (
                      <div className="timeline-overlay" aria-hidden="true">
                        <svg
                          className="dependencies"
                          width={timeline}
                          height={rows.length * 38}
                        >
                          <defs>
                            <marker
                              id="ppo-project-arrow"
                              markerWidth="5"
                              markerHeight="5"
                              refX="4"
                              refY="2.5"
                              orient="auto"
                            >
                              <path d="M0 0 5 2.5 0 5" fill="#899eb1" />
                            </marker>
                          </defs>
                          {[...positions.values()].flatMap((to) =>
                            to.task.dependencies.map((dep) => {
                              const from = positions.get(dep.task_id);
                              if (!from) return null;
                              const x1 =
                                  dep.kind === "SS" ? from.x : from.end - 1,
                                x2 = to.x,
                                bend = Math.max(x1 + 10, x2 - 9);
                              const path =
                                x2 >= x1 + 12
                                  ? `M${x1},${from.y} H${bend} V${to.y} H${x2 - 3}`
                                  : `M${x1},${from.y} H${x1 + 9} V${to.y - 16} H${x2 - 10} V${to.y} H${x2 - 3}`;
                              return (
                                <path
                                  key={`${dep.task_id}:${to.task.id}`}
                                  className="dependency"
                                  d={path}
                                  markerEnd="url(#ppo-project-arrow)"
                                />
                              );
                            }),
                          )}
                        </svg>
                        {today >= range.start && today <= range.end && (
                          <div
                            className="today-line"
                            style={{
                              left:
                                (dayNumber(today) -
                                  dayNumber(range.start) +
                                  0.5) *
                                  day -
                                timelineOffset,
                            }}
                          >
                            <span className="sr">Today</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!rows.length && (
                  <div className="empty">
                    <h3>
                      {tasks.length
                        ? "No tasks match these filters"
                        : "Plan your project schedule"}
                    </h3>
                    <p>
                      {tasks.length
                        ? "Try another owner or clear your filters."
                        : "Add the first task or milestone to begin."}
                    </p>
                    {tasks.length ? (
                      <button className="btn" onClick={clearFilters}>
                        Clear filters
                      </button>
                    ) : (
                      project.can_edit && (
                        <button className="btn" onClick={() => onTask(null)}>
                          Create first task
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
              <div className="scroll-rails">
                <div
                  ref={sheetRail}
                  className="scroll-rail sheet-scroll"
                  role="region"
                  aria-label="Task columns horizontal scroll"
                  tabIndex={0}
                  onScroll={(e) => setSheetOffset(e.currentTarget.scrollLeft)}
                >
                  <div style={{ width: sheet }} />
                </div>
                {effectiveView === "gantt" && (
                  <div
                    ref={timelineRail}
                    className="scroll-rail timeline-scroll"
                    role="region"
                    aria-label="Timeline horizontal scroll"
                    tabIndex={0}
                    onScroll={(e) =>
                      setTimelineOffset(e.currentTarget.scrollLeft)
                    }
                  >
                    <div style={{ width: timeline }} />
                  </div>
                )}
              </div>
              {effectiveView === "gantt" && (
                <ResizeGrip
                  className="pane-resize"
                  label="Resize task pane"
                  value={left}
                  bounds={[240, paneMaximum(available)]}
                  reset={632}
                  onChange={(pane) => setLayout((l) => ({ ...l, pane }))}
                  onStart={() => startResize("pane")}
                  onEnd={() => setResizing(null)}
                />
              )}
            </div>
            <div className="timeline-nav">
              {effectiveView === "gantt" ? (
                <>
                  <button
                    className="icon-btn"
                    aria-label="Earlier dates"
                    disabled={timelineOffset <= 0}
                    onClick={() => {
                      if (timelineRail.current)
                        timelineRail.current.scrollLeft -= viewport * 0.8;
                    }}
                  >
                    ‹
                  </button>
                  <button
                    className="icon-btn"
                    aria-label="Later dates"
                    disabled={timelineOffset >= timeline - viewport - 1}
                    onClick={() => {
                      if (timelineRail.current)
                        timelineRail.current.scrollLeft += viewport * 0.8;
                    }}
                  >
                    ›
                  </button>
                  <span className="timeline-range">
                    {formatDate(addDays(range.start, firstVisible))} –{" "}
                    {formatDate(addDays(range.start, lastVisible))}
                  </span>
                  <span className="timeline-hint">
                    Scroll horizontally to explore the schedule
                  </span>
                </>
              ) : (
                <span>
                  {available < 780
                    ? "List view · open on desktop to use the timeline"
                    : "Scroll horizontally to reveal task columns"}
                </span>
              )}
            </div>
            <div className="legend">
              <span>
                <i className="legend-bar complete" />
                Complete
              </span>
              <span>
                <i className="legend-bar active" />
                In progress
              </span>
              <span>
                <i className="legend-bar risk" />
                At risk
              </span>
              <span>
                <i className="milestone-key" />
                Milestone
              </span>
              <span className="legend-note">
                Manual dates · Mon–Fri reference calendar
              </span>
            </div>
          </section>
          <p className="page-footer">
            External owners indicate responsibility. Assigning a task does not
            grant app access.
          </p>
          <p id="ppogantt-resizeHelp" className="sr">
            Arrow keys resize by 10 pixels; Shift plus arrows by 40. Home and
            End choose limits. Enter or double-click resets. Escape cancels a
            drag. The main divider covers columns without changing their widths.
          </p>
        </div>
      </div>
    </section>
  );
}
