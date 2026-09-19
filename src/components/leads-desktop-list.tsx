"use client";
import Link from "next/link";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { ProductIcon } from "./product-icons";
import { WorklistMenu } from "./crm-worklist-tools";
import type { listLeads } from "../crm/leads/reads";

type Item = Awaited<ReturnType<typeof listLeads>>["items"][number];
export type RowAction =
  | "convert"
  | "archive"
  | "disqualify"
  | "unarchive"
  | "reopen";
const scrollPositions = new Map<string, { top: number; left: number }>();
const selectWidth = 46,
  actionWidth = 62;
const day = (s: string) =>
  new Date(s).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
const store = (key: string): { visible?: string[]; widths?: Record<string, number> } => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
};
const keep = (key: string, patch: object) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ...store(key), ...patch }));
  } catch {
    /* Columns still work without persistence. */
  }
  watchers.forEach((cb) => cb());
};
/* Column choice lives in storage, so it is read as an external store rather
   than mirrored into state after mount. */
const watchers = new Set<() => void>();
const watchColumns = (cb: () => void) => {
  watchers.add(cb);
  return () => {
    watchers.delete(cb);
  };
};
const storedColumns = (key: string) => (store(key).visible ?? []).join(",");
function Avatar({
  name,
  activity = false,
}: {
  name: string;
  activity?: boolean;
}) {
  return (
    <span
      className={`lead-avatar ${activity ? "lead-activity-avatar" : ""}`}
      title={`${activity ? "Activity" : "Lead"} owner: ${name}`}
      aria-label={`${activity ? "Activity" : "Lead"} owner: ${name}`}
    >
      {name
        .replace(/^SYN\s+/, "")
        .split(/\s+/)
        .slice(0, 2)
        .map((n) => n[0])
        .join("")}
    </span>
  );
}
type Column = {
  id: string;
  heading: string;
  min: number;
  max: number;
  weight: number;
  cell: (l: Item, href: (id: string) => string) => ReactNode;
};
const columns: Column[] = [
  {
    id: "title",
    heading: "Lead title",
    min: 190,
    max: 650,
    weight: 0.23,
    cell: (l, href) => (
      <>
        <Link href={href(l.id)} title={l.title}>
          {l.title}
        </Link>
        <small>{l.display_number}</small>
      </>
    ),
  },
  {
    id: "organisation",
    heading: "Organisation / contact",
    min: 170,
    max: 600,
    weight: 0.2,
    cell: (l) => (
      <>
        <span className="lead-truncate" title={l.organisation_name ?? undefined}>
          {l.organisation_name ?? "Organisation to confirm"}
        </span>
        <small title={l.contact_name ?? undefined}>
          {l.contact_name ?? "Contact to confirm"}
        </small>
      </>
    ),
  },
  {
    id: "status",
    heading: "Status",
    min: 110,
    max: 260,
    weight: 0.1,
    cell: (l) => (
      <span className="lead-status-stack">
        <span className={`lead-pill ${l.status.toLowerCase()}`}>{l.status}</span>
        {l.is_archived && <span className="lead-pill">Archived</span>}
      </span>
    ),
  },
  {
    id: "owner",
    heading: "Lead owner",
    min: 110,
    max: 300,
    weight: 0.11,
    cell: (l) => (
      <span className="lead-owner-cell">
        <Avatar name={l.owner_name} />
        <span title={l.owner_name}>
          {l.owner_name.replace(/^SYN\s+/, "").split(" ")[0]}
        </span>
      </span>
    ),
  },
  {
    id: "activity",
    heading: "Next activity",
    min: 205,
    max: 650,
    weight: 0.19,
    cell: (l) => (
      <>
        <span className="lead-truncate" title={l.next_activity?.summary}>
          {l.next_activity?.summary ??
            (l.next_action_state === "Unavailable"
              ? "Next action unavailable"
              : "Next action needed")}
        </span>
        {l.next_activity && (
          <span
            className={`lead-activity-meta ${l.next_action_state === "Overdue" ? "lead-attention" : ""}`}
          >
            <span>
              {l.next_action_state === "Overdue" ? "Overdue · " : ""}
              {l.next_activity.due_at
                ? day(l.next_activity.due_at)
                : "Due date needed"}
            </span>
            <Avatar name={l.next_activity.owner_name} activity />
          </span>
        )}
      </>
    ),
  },
  {
    id: "source",
    heading: "Source",
    min: 105,
    max: 300,
    weight: 0.09,
    cell: (l) => (
      <span className="lead-truncate" title={l.source_channel}>
        {l.source_channel}
      </span>
    ),
  },
  {
    id: "created",
    heading: "Date added",
    min: 110,
    max: 230,
    weight: 0.08,
    cell: (l) => <span className="lead-date">{day(l.created_at)}</span>,
  },
  {
    id: "reference",
    heading: "Lead ID",
    min: 130,
    max: 240,
    weight: 0.08,
    cell: (l) => <span className="lead-date">{l.display_number}</span>,
  },
  {
    id: "organisation_only",
    heading: "Organisation",
    min: 150,
    max: 400,
    weight: 0.12,
    cell: (l) => (
      <span className="lead-truncate" title={l.organisation_name ?? undefined}>
        {l.organisation_name ?? "Organisation to confirm"}
      </span>
    ),
  },
  {
    id: "contact_only",
    heading: "Contact",
    min: 140,
    max: 360,
    weight: 0.11,
    cell: (l) => (
      <span className="lead-truncate" title={l.contact_name ?? undefined}>
        {l.contact_name ?? "Contact to confirm"}
      </span>
    ),
  },
  {
    id: "activity_due",
    heading: "Next activity due",
    min: 140,
    max: 260,
    weight: 0.1,
    cell: (l) => (
      <span
        className={`lead-date ${l.next_action_state === "Overdue" ? "lead-attention" : ""}`}
      >
        {l.next_activity?.due_at
          ? day(l.next_activity.due_at)
          : "Due date needed"}
      </span>
    ),
  },
  {
    id: "activity_owner",
    heading: "Next activity owner",
    min: 150,
    max: 300,
    weight: 0.11,
    cell: (l) =>
      l.next_activity ? (
        <span className="lead-owner-cell">
          <Avatar name={l.next_activity.owner_name} />
          <span title={l.next_activity.owner_name}>
            {l.next_activity.owner_name.replace(/^SYN\s+/, "").split(" ")[0]}
          </span>
        </span>
      ) : (
        <span className="lead-truncate">Not scheduled</span>
      ),
  },
  {
    id: "archived",
    heading: "Archived",
    min: 100,
    max: 200,
    weight: 0.07,
    cell: (l) => (
      <span className="lead-date">{l.is_archived ? "Yes" : "No"}</span>
    ),
  },
];
const defaultVisible = [
  "title",
  "organisation",
  "status",
  "owner",
  "activity",
  "source",
  "created",
];
const rowActions = (view: string): { mode: RowAction; label: string }[] =>
  view === "Archived"
    ? [{ mode: "unarchive", label: "Restore from archive" }]
    : view === "Disqualified"
      ? [{ mode: "reopen", label: "Reopen lead" }]
      : view === "Converted"
        ? []
        : [
            { mode: "convert", label: "Convert to deal" },
            { mode: "archive", label: "Archive lead" },
            { mode: "disqualify", label: "Disqualify lead" },
          ];
export function LeadsDesktopList({
  items,
  selected,
  href,
  preferenceKey,
  view,
  more,
  onNext,
  onFirst,
  firstPage,
  onEmpty,
  emptyLabel,
  filtered,
  queryKey,
  onAction,
}: {
  items: Item[];
  selected?: string;
  href: (id: string) => string;
  preferenceKey: string;
  view: string;
  more: boolean;
  onNext: () => void;
  onFirst: () => void;
  firstPage: boolean;
  onEmpty: () => void;
  emptyLabel: string;
  filtered: boolean;
  queryKey: string;
  onAction: (id: string, mode: RowAction) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    reset = useRef<() => void>(() => {}),
    everyBox = useRef<HTMLInputElement>(null),
    help = useId();
  const key = `ppo.leads.columns.v2:${preferenceKey}`;
  const [chosen, setChosen] = useState<string[]>([]);
  const [columnSearch, setColumnSearch] = useState("");
  const saved = useSyncExternalStore(
    watchColumns,
    () => storedColumns(key),
    () => "",
  );
  const stored = saved ? saved.split(",") : [];
  const preferred = columns.map((c) => c.id).filter((id) => stored.includes(id));
  const visible = preferred.includes("title") ? preferred : defaultVisible;
  const shown = visible
    .map((id) => columns.find((c) => c.id === id))
    .filter((c): c is Column => !!c);
  const shownKey = shown.map((c) => c.id).join(",");
  /* Selections are scoped to the rows on screen, so a page or view change
     retires them without a reset pass. */
  const present = new Set(items.map((i) => i.id));
  const ticked = chosen.filter((id) => present.has(id));
  const every = items.length > 0 && ticked.length === items.length;
  const showVisible = (next: string[]) => keep(key, { visible: next });
  useEffect(() => {
    if (everyBox.current)
      everyBox.current.indeterminate = ticked.length > 0 && !every;
  }, [ticked, every]);
  useEffect(() => {
    const el = container.current!,
      table = el.querySelector("table")!,
      scroll = el.querySelector<HTMLElement>(".lead-table-wrap")!;
    const cols = [...table.querySelectorAll<HTMLElement>("col.lead-col")],
      handles = [
        ...table.querySelectorAll<HTMLElement>(".lead-column-resizer"),
      ];
    const live = shownKey
      .split(",")
      .map((id) => columns.find((c) => c.id === id))
      .filter((c): c is Column => !!c);
    if (cols.length !== live.length || handles.length !== live.length) return;
    const fixed = selectWidth + actionWidth;
    const defaults = () => {
      const floor = live.reduce((a, c) => a + c.min, 0);
      const share = live.reduce((a, c) => a + c.weight, 0) || 1;
      const extra = Math.max(0, scroll.clientWidth - fixed - floor);
      return live.map((c) => Math.round(c.min + extra * (c.weight / share)));
    };
    const clamp = (n: number, i: number) =>
      Math.round(Math.max(live[i].min, Math.min(live[i].max, n)));
    const saved = store(key).widths ?? {};
    const base = defaults();
    let widths = live.map((c, i) =>
      Number.isFinite(saved[c.id]) ? clamp(saved[c.id], i) : base[i],
    );
    let custom = live.some((c) => Number.isFinite(saved[c.id]));
    let drag: {
      index: number;
      start: number;
      width: number;
      before: number[];
      custom: boolean;
      pointer: number;
      handle: HTMLElement;
    } | null = null;
    const apply = () => {
      table.style.width = `${widths.reduce((a, b) => a + b, 0) + fixed}px`;
      cols.forEach((c, i) => {
        c.style.width = `${widths[i]}px`;
        handles[i].setAttribute("aria-valuenow", String(widths[i]));
        handles[i].setAttribute("aria-valuetext", `${widths[i]} pixels`);
      });
    };
    const save = () =>
      keep(key, {
        widths: {
          ...(store(key).widths ?? {}),
          ...Object.fromEntries(live.map((c, i) => [c.id, widths[i]])),
        },
      });
    const end = (cancel = false) => {
      if (!drag) return;
      const old = drag;
      drag = null;
      if (cancel) {
        widths = old.before;
        custom = old.custom;
        apply();
      } else save();
      el.classList.remove("lead-resizing");
      old.handle.classList.remove("is-dragging");
      if (old.handle.hasPointerCapture(old.pointer))
        old.handle.releasePointerCapture(old.pointer);
    };
    const abort = new AbortController(),
      opts = { signal: abort.signal };
    handles.forEach((h, i) => {
      h.addEventListener(
        "pointerdown",
        (e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          h.classList.add("pointer-focus");
          h.focus({ preventScroll: true });
          drag = {
            index: i,
            start: e.clientX,
            width: widths[i],
            before: [...widths],
            custom,
            pointer: e.pointerId,
            handle: h,
          };
          custom = true;
          h.setPointerCapture(e.pointerId);
          h.classList.add("is-dragging");
          el.classList.add("lead-resizing");
        },
        opts,
      );
      h.addEventListener(
        "pointermove",
        (e) => {
          if (drag?.handle !== h) return;
          widths[i] = clamp(drag.width + e.clientX - drag.start, i);
          apply();
        },
        opts,
      );
      h.addEventListener("pointerup", () => end(), opts);
      h.addEventListener("pointercancel", () => end(true), opts);
      h.addEventListener("lostpointercapture", () => end(true), opts);
      h.addEventListener(
        "blur",
        () => h.classList.remove("pointer-focus"),
        opts,
      );
      h.addEventListener(
        "keydown",
        (e) => {
          h.classList.remove("pointer-focus");
          if (e.key === "Escape" && drag) {
            e.preventDefault();
            end(true);
            return;
          }
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
            return;
          e.preventDefault();
          const step = e.shiftKey ? 50 : 10;
          widths[i] = clamp(
            e.key === "Home"
              ? live[i].min
              : e.key === "End"
                ? live[i].max
                : widths[i] + (e.key === "ArrowRight" ? step : -step),
            i,
          );
          custom = true;
          apply();
          save();
        },
        opts,
      );
      h.addEventListener(
        "dblclick",
        () => {
          const ctx = document.createElement("canvas").getContext("2d");
          if (!ctx) return;
          ctx.font = getComputedStyle(table).font;
          const text = [
            live[i].heading,
            ...[...table.tBodies[0].rows].flatMap((r) =>
              r.cells[i + 1]
                ? [...r.cells[i + 1].querySelectorAll("a,span,small")]
                    .filter((n) => !n.children.length)
                    .map((n) => n.textContent ?? "")
                : [],
            ),
          ];
          widths[i] = clamp(
            Math.ceil(Math.max(...text.map((s) => ctx.measureText(s).width))) +
              (live[i].id === "owner" ? 70 : live[i].id === "activity" ? 78 : 50),
            i,
          );
          custom = true;
          apply();
          save();
        },
        opts,
      );
    });
    reset.current = () => {
      end(true);
      custom = false;
      widths = defaults();
      apply();
      try {
        localStorage.removeItem(key);
      } catch {
        /* Reset still applies to the current view. */
      }
      watchers.forEach((cb) => cb());
      scroll.scrollLeft = 0;
    };
    apply();
    const scrollKey = `${preferenceKey}:${queryKey}`,
      prior = scrollPositions.get(scrollKey);
    if (prior) {
      scroll.scrollTop = prior.top;
      scroll.scrollLeft = prior.left;
    }
    scroll.addEventListener(
      "scroll",
      () => {
        scrollPositions.set(scrollKey, {
          top: scroll.scrollTop,
          left: scroll.scrollLeft,
        });
        if (scrollPositions.size > 20)
          scrollPositions.delete(scrollPositions.keys().next().value!);
      },
      opts,
    );
    const observer = new ResizeObserver(() => {
      if (!custom && !drag) {
        widths = defaults();
        apply();
      }
    });
    observer.observe(scroll);
    return () => {
      end(true);
      observer.disconnect();
      abort.abort();
      reset.current = () => {};
    };
  }, [preferenceKey, queryKey, key, shownKey]);
  const search = columnSearch.trim().toLowerCase();
  return (
    <div className="lead-desktop-results" ref={container}>
      <p id={help} className="sr-only">
        Drag the divider to resize. Left and Right change width by 10 pixels,
        Shift by 50. Home and End set minimum and maximum widths. Double-click
        fits this page’s content. Escape cancels dragging.
      </p>
      {ticked.length > 0 && (
        <div className="lead-selection-bar" role="status">
          <strong>
            {ticked.length} {ticked.length === 1 ? "lead" : "leads"} selected
          </strong>
          <button className="secondary" onClick={() => setChosen([])}>
            Clear selection
          </button>
        </div>
      )}
      <div
        className="lead-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Leads list"
      >
        <table className="lead-table">
          <colgroup>
            <col className="lead-col-select" />
            {shown.map((c) => (
              <col key={c.id} className="lead-col" />
            ))}
            <col className="lead-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="lead-cell-select">
                <input
                  ref={everyBox}
                  type="checkbox"
                  aria-label="Select all leads on this page"
                  checked={every}
                  disabled={!items.length}
                  onChange={(e) =>
                    setChosen(e.target.checked ? items.map((i) => i.id) : [])
                  }
                />
              </th>
              {shown.map((c) => (
                <th key={c.id} scope="col">
                  {c.heading}
                  <span
                    className="lead-column-resizer"
                    role="separator"
                    tabIndex={0}
                    aria-orientation="vertical"
                    aria-label={`Resize ${c.heading} column`}
                    aria-describedby={help}
                    aria-valuemin={c.min}
                    aria-valuemax={c.max}
                    aria-valuenow={c.min}
                    title="Drag to resize · double-click to fit content"
                  />
                </th>
              ))}
              <th scope="col" className="lead-cell-actions">
                <WorklistMenu
                  label="Columns"
                  className="lead-columns-menu"
                  text={<ProductIcon name="gear" />}
                >
                  <label className="lead-column-search">
                    <span className="sr-only">Search columns</span>
                    <input
                      type="search"
                      value={columnSearch}
                      placeholder="Search columns"
                      onChange={(e) => setColumnSearch(e.target.value)}
                    />
                  </label>
                  {columns
                    .filter((c) => c.heading.toLowerCase().includes(search))
                    .map((c) => {
                      const on = visible.includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          className="secondary lead-column-toggle"
                          role="menuitemcheckbox"
                          aria-checked={on}
                          disabled={c.id === "title"}
                          onClick={() =>
                            showVisible(
                              on
                                ? visible.filter((id) => id !== c.id)
                                : columns
                                    .map((x) => x.id)
                                    .filter(
                                      (id) =>
                                        visible.includes(id) || id === c.id,
                                    ),
                            )
                          }
                        >
                          <span className="lead-column-tick">
                            {on && <ProductIcon name="check" />}
                          </span>
                          <span>{c.heading}</span>
                        </button>
                      );
                    })}
                  {!columns.some((c) => c.heading.toLowerCase().includes(search)) && (
                    <p className="lead-menu-note">No columns match.</p>
                  )}
                </WorklistMenu>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr
                key={l.id}
                className={selected === l.id ? "lead-selected" : ""}
              >
                <td className="lead-cell-select">
                  <input
                    type="checkbox"
                    aria-label={`Select ${l.title}`}
                    checked={ticked.includes(l.id)}
                    onChange={(e) =>
                      setChosen((prior) =>
                        e.target.checked
                          ? [...prior, l.id]
                          : prior.filter((id) => id !== l.id),
                      )
                    }
                  />
                </td>
                {shown.map((c) => (
                  <td key={c.id}>{c.cell(l, href)}</td>
                ))}
                <td className="lead-cell-actions">
                  {rowActions(view).length > 0 && (
                    <WorklistMenu
                      label={`Actions for ${l.title}`}
                      className="lead-row-menu"
                      choices
                      text={<ProductIcon name="more" />}
                    >
                      {rowActions(view).map((a) => (
                        <button
                          key={a.mode}
                          type="button"
                          className="secondary"
                          role="menuitem"
                          data-menu-close
                          onClick={() => onAction(l.id, a.mode)}
                        >
                          {a.label}
                        </button>
                      ))}
                    </WorklistMenu>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <div className="lead-empty">
            <ProductIcon name="sales" />
            <h2>
              {filtered
                ? "No leads match your filters"
                : `No ${view === "Active" ? "active" : view.toLowerCase()} leads`}
            </h2>
            <p>
              {filtered
                ? "Try a different search or clear the filters."
                : "Leads will appear here as you work through enquiries."}
            </p>
            <button className="secondary" onClick={onEmpty}>
              {emptyLabel}
            </button>
          </div>
        )}
      </div>
      <footer className="lead-list-footer">
        <span>
          {items.length} {items.length === 1 ? "lead" : "leads"} on this page ·{" "}
          {view === "Active" ? "Inbox" : view}
        </span>
        <div>
          <button
            className="lead-reset-columns"
            onClick={() => reset.current()}
          >
            Reset columns
          </button>
          {!firstPage && (
            <button className="secondary" onClick={onFirst}>
              First page
            </button>
          )}
          {more && (
            <button className="secondary" onClick={onNext}>
              Next page
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
