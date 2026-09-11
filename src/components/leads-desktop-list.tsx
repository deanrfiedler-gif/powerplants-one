"use client";
import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import type { listLeads } from "../crm/leads/reads";

type Item = Awaited<ReturnType<typeof listLeads>>["items"][number];
const scrollPositions = new Map<string, { top: number; left: number }>();
const headings = [
  "Lead title",
  "Organisation / contact",
  "Status",
  "Lead owner",
  "Next activity",
  "Source",
  "Date added",
];
const minimum = [190, 170, 110, 110, 205, 105, 110];
const maximum = [650, 600, 260, 300, 650, 300, 230];
const weights = [0.23, 0.2, 0.1, 0.11, 0.19, 0.09, 0.08];
const day = (s: string) =>
  new Date(s).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Australia/Brisbane",
  });
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
}) {
  const container = useRef<HTMLDivElement>(null),
    reset = useRef<() => void>(() => {}),
    help = useId();
  useEffect(() => {
    const el = container.current!,
      table = el.querySelector("table")!,
      scroll = el.querySelector<HTMLElement>(".lead-table-wrap")!;
    const cols = [...table.querySelectorAll("col")],
      handles = [
        ...table.querySelectorAll<HTMLElement>(".lead-column-resizer"),
      ];
    const key = `ppo.leads.columns.v1:${preferenceKey}`;
    const defaults = () => {
      const extra = Math.max(
        0,
        scroll.clientWidth - minimum.reduce((a, b) => a + b, 0),
      );
      return minimum.map((n, i) => Math.round(n + extra * weights[i]));
    };
    let widths = defaults(),
      custom = false;
    let drag: {
      index: number;
      start: number;
      width: number;
      before: number[];
      custom: boolean;
      pointer: number;
      handle: HTMLElement;
    } | null = null;
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (
        Array.isArray(saved) &&
        saved.length === 7 &&
        saved.every(
          (n, i) => Number.isFinite(n) && n >= minimum[i] && n <= maximum[i],
        )
      ) {
        widths = saved;
        custom = true;
      }
    } catch {
      /* Storage is optional. */
    }
    const apply = () => {
      table.style.width = `${widths.reduce((a, b) => a + b, 0)}px`;
      cols.forEach((c, i) => {
        c.style.width = `${widths[i]}px`;
        handles[i].setAttribute("aria-valuenow", String(widths[i]));
        handles[i].setAttribute("aria-valuetext", `${widths[i]} pixels`);
      });
    };
    const save = () => {
      try {
        localStorage.setItem(key, JSON.stringify(widths));
      } catch {
        /* Resize still works without persistence. */
      }
    };
    const clamp = (n: number, i: number) =>
      Math.round(Math.max(minimum[i], Math.min(maximum[i], n)));
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
              ? minimum[i]
              : e.key === "End"
                ? maximum[i]
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
            headings[i],
            ...[...table.tBodies[0].rows].flatMap((r) =>
              r.cells[i]
                ? [...r.cells[i].querySelectorAll("a,span,small")]
                    .filter((n) => !n.children.length)
                    .map((n) => n.textContent ?? "")
                : [],
            ),
          ];
          widths[i] = clamp(
            Math.ceil(Math.max(...text.map((s) => ctx.measureText(s).width))) +
              (i === 3 ? 70 : i === 4 ? 78 : 50),
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
      } catch {}
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
  }, [preferenceKey, queryKey]);
  return (
    <div className="lead-desktop-results" ref={container}>
      <p id={help} className="sr-only">
        Drag the divider to resize. Left and Right change width by 10 pixels,
        Shift by 50. Home and End set minimum and maximum widths. Double-click
        fits this page’s content. Escape cancels dragging.
      </p>
      <div
        className="lead-table-wrap"
        tabIndex={0}
        role="region"
        aria-label="Leads list"
      >
        <table className="lead-table">
          <colgroup>
            {headings.map((h) => (
              <col key={h} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {headings.map((h, i) => (
                <th key={h} scope="col">
                  {h}
                  <span
                    className="lead-column-resizer"
                    role="separator"
                    tabIndex={0}
                    aria-orientation="vertical"
                    aria-label={`Resize ${h} column`}
                    aria-describedby={help}
                    aria-valuemin={minimum[i]}
                    aria-valuemax={maximum[i]}
                    aria-valuenow={minimum[i]}
                    title="Drag to resize · double-click to fit content"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((l) => (
              <tr
                key={l.id}
                className={selected === l.id ? "lead-selected" : ""}
              >
                <td>
                  <Link href={href(l.id)} title={l.title}>
                    {l.title}
                  </Link>
                  <small>{l.display_number}</small>
                </td>
                <td>
                  <span
                    className="lead-truncate"
                    title={l.organisation_name ?? undefined}
                  >
                    {l.organisation_name ?? "Organisation to confirm"}
                  </span>
                  <small title={l.contact_name ?? undefined}>
                    {l.contact_name ?? "Contact to confirm"}
                  </small>
                </td>
                <td>
                  <span className="lead-status-stack">
                    <span className={`lead-pill ${l.status.toLowerCase()}`}>
                      {l.status}
                    </span>
                    {l.is_archived && (
                      <span className="lead-pill">Archived</span>
                    )}
                  </span>
                </td>
                <td>
                  <span className="lead-owner-cell">
                    <Avatar name={l.owner_name} />
                    <span title={l.owner_name}>
                      {l.owner_name.replace(/^SYN\s+/, "").split(" ")[0]}
                    </span>
                  </span>
                </td>
                <td>
                  <span
                    className="lead-truncate"
                    title={l.next_activity?.summary}
                  >
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
                </td>
                <td>
                  <span className="lead-truncate" title={l.source_channel}>
                    {l.source_channel}
                  </span>
                </td>
                <td>
                  <span className="lead-date">{day(l.created_at)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!items.length && (
          <div className="lead-empty">
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
