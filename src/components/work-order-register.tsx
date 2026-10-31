"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ReadState, useResource, type Envelope } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { FontAwesomeGlyph } from "./font-awesome";
import { ShellIcon, type ShellIconName } from "./shell-icon";
import { HeaderContent } from "./header-content";
import { RecordTabs, RecordPanel } from "./record-ui";
import {
  formatTimestamp,
  formatTime,
  DEFAULT_ZONE,
  zoneAbbreviation,
} from "../shell/date-format";
import {
  workOrderViews,
  type WorkOrderView,
} from "../service/work-order-register-model";
import type { readWorkOrderRegister } from "../service/work-order-register";
import type { Order } from "./work-order-screens";
import "./work-order-register.css";

export type RegisterData = Awaited<ReturnType<typeof readWorkOrderRegister>>;
export type RegisterRow = RegisterData["items"][number];
export type RecordRead = {
  work_order: RegisterRow & { created_at: string };
  blockers: Order["blockers"];
  history: {
    items: {
      id: string;
      command: string;
      reason: string;
      actor_name: string | null;
      occurred_at: string;
      outcome: string;
    }[];
    offset: number;
    next_offset: number | null;
    scope: string;
  };
  evidence: {
    items: {
      id: string;
      title: string;
      source_reference: string;
      source_version: string;
      provider: string;
      status: string;
      content_hash: string;
      created_at: string;
    }[];
    offset: number;
    next_offset: number | null;
    scope: string;
  };
  as_of: string;
};
const views: { id: WorkOrderView; label: string; icon: string }[] = [
  { id: "all", label: "All work orders", icon: "list" },
  { id: "mine", label: "My work orders", icon: "user" },
  { id: "drafts", label: "Drafts", icon: "file-pen" },
  { id: "authorised", label: "Authorised", icon: "badge-check" },
  { id: "scope_needed", label: "Scope needed", icon: "circle-exclamation" },
  { id: "blocked", label: "Blocked at authorisation", icon: "lock" },
  {
    id: "ready_to_authorise",
    label: "Ready to authorise",
    icon: "circle-check",
  },
  { id: "successor_draft", label: "Successor in draft", icon: "files" },
  { id: "no_visit", label: "No visit proposed", icon: "calendar" },
  {
    id: "visit_review",
    label: "Visit needs review",
    icon: "calendar-exclamation",
  },
  {
    id: "coverage_unresolved",
    label: "Coverage unresolved",
    icon: "scale-balanced",
  },
];
export function WorkOrderIcon({
  name,
  fallback = "list",
}: {
  name: string;
  fallback?: ShellIconName;
}) {
  // ADR-0050: exact named Pro glyphs come from the existing private Kit; no Pro artwork is published.
  return (
    <FontAwesomeGlyph
      icon={name}
      className="wo-icon"
      fallback={<ShellIcon name={fallback} />}
    />
  );
}
export const revisionLabel = (revision: number | null) =>
  revision ? `r${String(revision).padStart(2, "0")}` : "";
export function authorisationLabel(row: RegisterRow) {
  switch (row.authorisation) {
    case "ScopeNeeded":
      return "Scope needed";
    case "Blocked":
      return `Blocked · ${row.blocker_count} items`;
    case "ReadyToAuthorise":
      return "Ready to authorise";
    case "SuccessorDraft":
      return `Successor ${revisionLabel(row.scope_revision)} in draft`;
    case "Authorised":
      return `Authorised ${revisionLabel(row.scope_revision)}`;
  }
}
export function AuthorisationLabel({ row }: { row: RegisterRow }) {
  const icon = {
    ScopeNeeded: "circle-exclamation",
    Blocked: "lock",
    ReadyToAuthorise: "circle-check",
    SuccessorDraft: "files",
    Authorised: "badge-check",
  }[row.authorisation];
  return (
    <span
      className="wo-authority"
      data-attention={row.authorisation === "Blocked" || undefined}
    >
      <WorkOrderIcon name={icon} />
      {authorisationLabel(row)}
    </span>
  );
}
export function nextVisitLabel(row: RegisterRow) {
  const visit = row.next_visit;
  if (!visit) return row.status === "Authorised" ? "Not proposed" : "—";
  if (visit.scope_review_required) return "Review required";
  return `${visit.status} · ${new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", timeZone: visit.site_timezone }).format(new Date(visit.start_at))}`;
}
const columns = [
  ["reference", "Work order", 176],
  ["summary", "Scope summary", 250],
  ["customer", "Customer", 180],
  ["state", "State", 110],
  ["authorisation", "Authorisation", 210],
  ["coverage", "Coverage", 130],
  ["visit", "Next visit", 140],
  ["site", "Site", 170],
  ["requests", "Requests", 84],
  ["owner", "Service owner", 140],
  ["updated", "Updated", 160],
] as const;
function exportRows(rows: RegisterRow[]) {
  const cell = (value: unknown) =>
    `"${String(value ?? "")
      .replace(/^[=+@\-\t\r]/, "'$&")
      .replaceAll('"', '""')}"`;
  const csv = [
    [
      "Work order",
      "Summary",
      "Customer",
      "Site",
      "State",
      "Authorisation",
      "Coverage",
      "Next visit",
      "Updated (WorkOrder)",
    ],
    ...rows.map((r) => [
      r.display_number,
      r.summary,
      r.customer_name,
      r.site_name,
      r.status,
      authorisationLabel(r),
      r.coverage_status,
      nextVisitLabel(r),
      r.updated_at,
    ]),
  ]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "selected-work-orders.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function WorkOrderList() {
  const router = useRouter(),
    params = useSearchParams(),
    query = params.toString();
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [selected, setSelected] = useState<string[]>([]),
    [inspect, setInspect] = useState<string | null>(null),
    [filters, setFilters] = useState(false);
  const [search, setSearch] = useState(params.get("q") ?? ""),
    [hidden, setHidden] = useState<string[]>([]);
  const allRef = useRef<HTMLInputElement>(null),
    pullStart = useRef<number | null>(null);
  const view = workOrderViews.includes(params.get("view") as WorkOrderView)
    ? (params.get("view") as WorkOrderView)
    : "all";
  const sort = params.get("sort") ?? "reference_desc",
    offset = Math.max(0, Number(params.get("offset")) || 0);
  const read = new URLSearchParams({ view, sort, offset: String(offset) });
  for (const key of ["q", "owner_id", "site_id"])
    if (params.get(key)) read.set(key, params.get(key)!);
  const resource = useResource<RegisterData>(
      `service/work-orders/register?${read}`,
    ),
    data = resource.data;
  const items = data?.items ?? [],
    busy = resource.loading || !!resource.error;
  const selectedRows = items.filter((row) => selected.includes(row.id)),
    sequence = selectedRows.length ? selectedRows : items;
  const currentIndex = sequence.findIndex((row) => row.id === inspect);
  useEffect(() => {
    if (allRef.current)
      allRef.current.indeterminate =
        selectedRows.length > 0 && selectedRows.length < items.length;
  }, [selectedRows.length, items.length]);
  const change = (values: Record<string, string>, paging = false) => {
    const next = new URLSearchParams(query);
    if (!paging) next.delete("offset");
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setSelected([]);
    setInspect(null);
    router.push(`/service/work-orders?${next}`, { scroll: false });
  };
  const refresh = () => {
    setSelected([]);
    setInspect(null);
    resource.reload();
  };
  const choose = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const count = data
    ? `${data.completeness === "Partial" ? "At least " : ""}${data.total}`
    : "—";
  const viewName = views.find((v) => v.id === view)!.label;
  const filterFields = (
    <>
      <WorklistChoice
        label="Owner"
        prefix="Owner: "
        value={params.get("owner_id") ?? ""}
        options={[{ id: "", label: "Anyone" }, ...(data?.options.owners ?? [])]}
        onChange={(owner_id) => change({ owner_id })}
      />
      <WorklistChoice
        label="Site"
        prefix="Site: "
        value={params.get("site_id") ?? ""}
        options={[
          { id: "", label: "All sites" },
          ...(data?.options.sites ?? []),
        ]}
        onChange={(site_id) => change({ site_id })}
      />
    </>
  );
  const searchForm = (
    <form
      className="wo-search"
      onSubmit={(e) => {
        e.preventDefault();
        change({ q: search.trim() });
      }}
    >
      <label>
        Search work orders
        <input
          type="search"
          maxLength={200}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      <Button type="submit">Search</Button>
    </form>
  );
  const menuContent = (
    <nav aria-label="Work order views">
      <ul>
        {views.map((v, i) => (
          <li key={v.id}>
            {i === 4 && <h2>Needs attention</h2>}
            {i === 8 && <h2>Planning</h2>}
            <a
              href={`?${new URLSearchParams({ ...Object.fromEntries(read), view: v.id, offset: "0" })}`}
              aria-current={view === v.id ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                change({ view: v.id });
                menu.closeOverlay();
              }}
            >
              <WorkOrderIcon name={v.icon} />
              <span>{v.label}</span>
              <small>
                {busy
                  ? "—"
                  : `${data?.completeness === "Partial" ? "≥" : ""}${data?.counts[v.id] ?? "—"}`}
              </small>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-work-orders"
      name="Work orders"
      menuId="wo-menu"
      contentId="wo-content"
      menu={menuContent}
      message={
        selectedRows.length
          ? `${selectedRows.length} work orders selected on this page`
          : ""
      }
      phoneHeader={{
        title: view === "all" ? "Work orders" : viewName,
        count: !busy ? count : undefined,
        pageAction: {
          label: "New work order",
          icon: "plus",
          onSelect: () => router.push("/service/work-orders/new"),
        },
        filter: {
          open: () => setFilters(true),
          applied: !!(
            params.get("q") ||
            params.get("owner_id") ||
            params.get("site_id")
          ),
        },
      }}
    >
      <HeaderContent slot="work-order-count">
        {!busy &&
          view === "all" &&
          !params.get("q") &&
          !params.get("owner_id") &&
          !params.get("site_id") &&
          data?.completeness === "Complete" && (
            <span title="Ready to authorise">
              {data.counts.ready_to_authorise}
            </span>
          )}
      </HeaderContent>
      <h1 className="mw-sr">Work orders register</h1>
      <div className="wo-toolbar wo-desktop">
        {selectedRows.length ? (
          <>
            <strong>{selectedRows.length} selected on this page</strong>
            <Button
              onClick={() => setInspect(selectedRows[0].id)}
              disabled={busy}
            >
              Open in sequence
            </Button>
            <Button onClick={() => exportRows(selectedRows)} disabled={busy}>
              Export list
            </Button>
            <Button onClick={() => setSelected([])}>Cancel selection</Button>
          </>
        ) : (
          <>
            <ButtonLink variant="primary" href="/service/work-orders/new">
              <WorkOrderIcon name="plus" fallback="plus" />
              New work order
            </ButtonLink>
            {filterFields}
            <span
              className="wo-count"
              title="Readable orders matching search, owner and site filters; views overlap"
            >
              {count} work orders
              {data && (
                <>
                  {" "}
                  · updated {formatTime(data.as_of, DEFAULT_ZONE)}{" "}
                  {zoneAbbreviation(data.as_of, DEFAULT_ZONE)}
                </>
              )}
            </span>
            <Button
              aria-label="Refresh work orders"
              onClick={refresh}
              disabled={resource.loading}
            >
              <WorkOrderIcon name="rotate-left" fallback="changes" />
            </Button>
            <WorklistMenu label="Work order register actions" icon="more">
              {searchForm}
              <Button
                data-menu-close
                onClick={() =>
                  change({ q: "", owner_id: "", site_id: "", view: "all" })
                }
              >
                Reset filters
              </Button>
              <Button data-menu-close onClick={refresh}>
                Refresh
              </Button>
            </WorklistMenu>
          </>
        )}
      </div>
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={refresh}
      />
      {data?.completeness === "Partial" && (
        <p className="wo-notice" role="status">
          Some sources could not be read. Counts are partial. Refresh before
          relying on this view.
        </p>
      )}
      {!resource.error && data && (
        <div
          className="wo-results"
          onTouchStart={(e) => {
            pullStart.current =
              e.currentTarget.scrollTop === 0 ? e.touches[0].clientY : null;
          }}
          onTouchEnd={(e) => {
            if (
              pullStart.current !== null &&
              e.changedTouches[0].clientY - pullStart.current > 90
            )
              refresh();
            pullStart.current = null;
          }}
        >
          <div className="wo-desktop">
            <RegisterTable
              caption="Work orders. Open a snapshot with a reference or select rows for export and sequential review."
              stale={busy}
              empty={
                !items.length && (
                  <RegisterEmpty title="No work orders in this view">
                    Adjust the filters or create a draft from a service request.
                  </RegisterEmpty>
                )
              }
            >
              <colgroup>
                <col style={{ width: 44 }} />
                {columns
                  .filter((c) => !hidden.includes(c[0]))
                  .map((c) => (
                    <col key={c[0]} style={{ width: c[2] }} />
                  ))}
                <col style={{ width: 44 }} />
              </colgroup>
              <thead>
                <tr>
                  <th className="wo-fixed-start">
                    <input
                      ref={allRef}
                      type="checkbox"
                      aria-label="Select all work orders on this page"
                      checked={
                        items.length > 0 && selectedRows.length === items.length
                      }
                      disabled={busy || !items.length}
                      onChange={() =>
                        setSelected(
                          selectedRows.length === items.length
                            ? []
                            : items.map((r) => r.id),
                        )
                      }
                    />
                  </th>
                  {columns
                    .filter((c) => !hidden.includes(c[0]))
                    .map((c) =>
                      c[0] === "reference" || c[0] === "updated" ? (
                        <RegisterSortHeader
                          key={c[0]}
                          label={c[1]}
                          direction={
                            sort.startsWith(c[0])
                              ? sort.endsWith("asc")
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                          onSort={() =>
                            change({
                              sort: `${c[0]}_${sort === `${c[0]}_desc` ? "asc" : "desc"}`,
                            })
                          }
                        />
                      ) : (
                        <th key={c[0]} scope="col">
                          <span className="ppo-register-label">{c[1]}</span>
                        </th>
                      ),
                    )}
                  <th className="wo-fixed-end">
                    <WorklistMenu label="Work order columns" icon="settings">
                      {columns
                        .filter((c) => c[0] !== "reference")
                        .map((c) => (
                          <label key={c[0]}>
                            <input
                              type="checkbox"
                              checked={!hidden.includes(c[0])}
                              onChange={() =>
                                setHidden((old) =>
                                  old.includes(c[0])
                                    ? old.filter((k) => k !== c[0])
                                    : [...old, c[0]],
                                )
                              }
                            />
                            {c[1]}
                          </label>
                        ))}
                    </WorklistMenu>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => {
                  const cells: Record<string, ReactNode> = {
                    reference: (
                      <button
                        className="wo-open"
                        onClick={() => setInspect(row.id)}
                        disabled={busy}
                      >
                        {row.display_number}
                        <small>{revisionLabel(row.scope_revision)}</small>
                      </button>
                    ),
                    summary: row.summary ?? "Scope needed",
                    customer: row.customer_name,
                    state: (
                      <span className="mw-tag" data-state={row.status}>
                        {row.status}
                      </span>
                    ),
                    authorisation: <AuthorisationLabel row={row} />,
                    coverage: row.coverage_status ?? "Not assessed",
                    visit: nextVisitLabel(row),
                    site: row.site_name,
                    requests: row.linked_request_count,
                    owner: row.owner_name,
                    updated: formatTimestamp(row.updated_at, DEFAULT_ZONE),
                  };
                  return (
                    <tr
                      key={row.id}
                      data-selected={selected.includes(row.id) || undefined}
                      data-inspected={inspect === row.id || undefined}
                      onClick={(e) => {
                        if (
                          !busy &&
                          !(e.target as HTMLElement).closest(
                            "button,a,input,select",
                          )
                        )
                          setInspect(row.id);
                      }}
                    >
                      <td className="wo-fixed-start">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.display_number}`}
                          checked={selected.includes(row.id)}
                          disabled={busy}
                          onChange={() => choose(row.id)}
                        />
                      </td>
                      {columns
                        .filter((c) => !hidden.includes(c[0]))
                        .map((c) => (
                          <td
                            key={c[0]}
                            title={
                              typeof cells[c[0]] === "string"
                                ? (cells[c[0]] as string)
                                : undefined
                            }
                          >
                            {cells[c[0]]}
                          </td>
                        ))}
                      <td className="wo-fixed-end">
                        <WorklistMenu
                          label={`Actions for ${row.display_number}`}
                          icon="more"
                          disabled={busy}
                        >
                          <Button
                            data-menu-close
                            onClick={() => setInspect(row.id)}
                          >
                            Open snapshot
                          </Button>
                          <Link
                            href={`${row.href}?return_to=${encodeURIComponent(`/service/work-orders?${read}`)}`}
                          >
                            Open work order
                          </Link>
                        </WorklistMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </RegisterTable>
          </div>
          <div className="wo-phone-list">
            {items.map((row) => (
              <PhoneRow
                key={row.id}
                row={row}
                selected={selected.includes(row.id)}
                selecting={selectedRows.length > 0}
                disabled={busy}
                onSelect={() => choose(row.id)}
                onOpen={() =>
                  router.push(
                    `${row.href}?return_to=${encodeURIComponent(`/service/work-orders?${read}`)}`,
                  )
                }
              />
            ))}
            {!items.length && (
              <RegisterEmpty title="No work orders in this view">
                Change view or reset filters.
              </RegisterEmpty>
            )}
          </div>
          <RegisterFooter>
            <span>
              {items.length
                ? `${offset + 1}–${offset + items.length} of ${count}`
                : `0 of ${count}`}{" "}
              · matching permitted work orders
            </span>
            <Button
              disabled={busy || !offset}
              onClick={() =>
                change({ offset: String(Math.max(0, offset - 25)) }, true)
              }
            >
              Previous page
            </Button>
            <Button
              disabled={busy || data.next_offset === null}
              onClick={() => change({ offset: String(data.next_offset) }, true)}
            >
              Next page
            </Button>
          </RegisterFooter>
        </div>
      )}
      {!!selectedRows.length && !inspect && (
        <aside className="wo-selection" aria-label="Selected work orders">
          <h2>{selectedRows.length} work orders selected</h2>
          <p>
            Selection covers this page. Authorise each exact scope on its
            work-order page.
          </p>
          <Button
            onClick={() => setInspect(selectedRows[0].id)}
            disabled={busy}
          >
            Open in sequence
          </Button>
          <Button onClick={() => exportRows(selectedRows)} disabled={busy}>
            Export list
          </Button>
          <Button onClick={() => setSelected([])}>Cancel selection</Button>
        </aside>
      )}
      {filters && (
        <WorklistPanel
          title="Filter work orders"
          onClose={() => setFilters(false)}
        >
          {searchForm}
          {filterFields}
          <WorklistChoice
            label="Sort work orders"
            value={sort}
            options={[
              { id: "reference_desc", label: "Newest reference" },
              { id: "reference_asc", label: "Oldest reference" },
              { id: "updated_desc", label: "Recently updated" },
              { id: "updated_asc", label: "Oldest update" },
            ]}
            onChange={(sort) => change({ sort })}
          />
          <Button
            onClick={() => {
              setSearch("");
              change({ q: "", owner_id: "", site_id: "" });
            }}
          >
            Reset
          </Button>
          <Button onClick={refresh}>Refresh</Button>
          <Button variant="primary" onClick={() => setFilters(false)}>
            Show {count} work orders
          </Button>
        </WorklistPanel>
      )}
      {inspect && !busy && (
        <WorkOrderSnapshot
          key={inspect}
          id={inspect}
          returnTo={`/service/work-orders?${read}`}
          position={`${currentIndex + 1} of ${sequence.length} on this page`}
          onClose={() => setInspect(null)}
          previous={
            currentIndex > 0
              ? () => setInspect(sequence[currentIndex - 1].id)
              : undefined
          }
          next={
            currentIndex < sequence.length - 1
              ? () => setInspect(sequence[currentIndex + 1].id)
              : undefined
          }
        />
      )}
    </SecondaryMenuFrame>
  );
}
function PhoneRow({
  row,
  selected,
  selecting,
  disabled,
  onSelect,
  onOpen,
}: {
  row: RegisterRow;
  selected: boolean;
  selecting: boolean;
  disabled: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const press = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false),
    origin = useRef({ x: 0, y: 0 });
  const cancel = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };
  useEffect(
    () => () => {
      if (press.current) clearTimeout(press.current);
    },
    [],
  );
  return (
    <button
      className="wo-phone-row"
      disabled={disabled}
      data-selected={selected || undefined}
      aria-label={`${row.display_number}: ${row.summary ?? "Scope needed"}${selecting ? (selected ? ", selected" : ", not selected") : ""}`}
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") {
          origin.current = { x: e.clientX, y: e.clientY };
          held.current = false;
          press.current = setTimeout(() => {
            held.current = true;
            onSelect();
          }, 550);
        }
      }}
      onPointerUp={cancel}
      onPointerMove={(e) => {
        if (
          Math.hypot(
            e.clientX - origin.current.x,
            e.clientY - origin.current.y,
          ) > 10
        )
          cancel();
      }}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        if (selecting) onSelect();
        else onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === " " && e.shiftKey) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <span className="wo-phone-body">
        <span className="wo-phone-title">
          <strong>{row.summary ?? "Scope needed"}</strong>
          <span>
            {new Intl.DateTimeFormat("en-AU", {
              day: "numeric",
              month: "short",
              timeZone: DEFAULT_ZONE,
            }).format(new Date(row.updated_at))}
          </span>
        </span>
        <small>
          {row.display_number} · {row.customer_name}
        </small>
        <span className="wo-phone-position">
          <AuthorisationLabel row={row} />
          <small>
            {row.next_visit?.scope_review_required
              ? "Visit review required"
              : row.next_visit
                ? nextVisitLabel(row)
                : row.status === "Draft"
                  ? "Draft"
                  : "No visit proposed"}
          </small>
        </span>
      </span>
      <WorkOrderIcon
        name={selected ? "square-check" : "chevron-right"}
        fallback={selected ? "check" : "chevron-right"}
      />
    </button>
  );
}
export function NativeHistory({ id }: { id: string }) {
  const [offset, setOffset] = useState(0),
    r = useResource<RecordRead>(
      `service/work-orders/${id}/record?history_offset=${offset}`,
    );
  return (
    <section className="wo-history">
      <h3>History</h3>
      <p className="wo-source-note">
        Work-order commands and visit proposals only. Scheduling, field, Finance
        and legacy activity are not a complete cross-domain audit trail here.
      </p>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {r.data && !r.error && (
        <>
          <ol>
            {r.data.history.items.map((e) => (
              <li key={e.id}>
                <strong>{e.command.replace(/([a-z])([A-Z])/g, "$1 $2")}</strong>
                <small>
                  {formatTimestamp(e.occurred_at, DEFAULT_ZONE)} ·{" "}
                  {e.actor_name ?? "Recorded actor"} · {e.outcome}
                </small>
                <p>{e.reason}</p>
              </li>
            ))}
          </ol>
          {!r.data.history.items.length && (
            <p>
              No native command events in this page. This does not mean no
              earlier activity.
            </p>
          )}
          <Button
            disabled={r.loading || !offset}
            onClick={() => setOffset(Math.max(0, offset - 25))}
          >
            Newer history
          </Button>
          <Button
            disabled={r.loading || r.data.history.next_offset === null}
            onClick={() => setOffset(r.data!.history.next_offset!)}
          >
            Older history
          </Button>
        </>
      )}
    </section>
  );
}
export function WorkOrderSnapshot({
  id,
  returnTo,
  position,
  onClose,
  previous,
  next,
}: {
  id: string;
  returnTo: string;
  position: string;
  onClose: () => void;
  previous?: () => void;
  next?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    [tab, setTab] = useState("readiness");
  const detail = useResource<Envelope<Order>>(`service/work-orders/${id}`),
    summary = useResource<RecordRead>(`service/work-orders/${id}/record`);
  const w = detail.data?.items[0],
    row = summary.data?.work_order,
    scope = w?.scopes.find((s) => s.id === w.scope_revision_id);
  useEffect(() => {
    const d = ref.current!,
      opener = document.activeElement;
    d.showModal();
    return () => {
      d.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="wo-snapshot"
      aria-labelledby="wo-snapshot-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="wo-snapshot-nav">
        <Button aria-label="Close work order snapshot" onClick={onClose}>
          <WorkOrderIcon name="xmark" fallback="close" />
        </Button>
        <span>{position}</span>
        <Button
          aria-label="Previous work order"
          disabled={!previous}
          onClick={previous}
        >
          <WorkOrderIcon name="chevron-up" fallback="chevron-left" />
        </Button>
        <Button aria-label="Next work order" disabled={!next} onClick={next}>
          <WorkOrderIcon name="chevron-down" fallback="chevron-right" />
        </Button>
      </header>
      <ReadState
        loading={detail.loading || summary.loading}
        error={detail.error || summary.error}
        retry={() => {
          detail.reload();
          summary.reload();
        }}
      />
      {w && row && w.version !== row.version && (
        <p role="status">
          This work order changed while loading.{" "}
          <Button
            onClick={() => {
              detail.reload();
              summary.reload();
            }}
          >
            Refresh snapshot
          </Button>
        </p>
      )}
      {w &&
        row &&
        w.version === row.version &&
        !detail.error &&
        !summary.error && (
          <>
            <div className="wo-snapshot-body">
              <section className="wo-snapshot-record">
                <h2 id="wo-snapshot-title">
                  {scope?.summary ?? "Scope needed"}
                </h2>
                <small>
                  {w.display_number} · current scope{" "}
                  {revisionLabel(row.scope_revision) || "not saved"}
                </small>
                <p>
                  <span className="mw-tag">{w.status}</span>{" "}
                  <AuthorisationLabel row={row} />
                </p>
                <h3>Summary</h3>
                <dl>
                  <dt>Customer</dt>
                  <dd>{w.customer_name}</dd>
                  <dt>Site</dt>
                  <dd>{w.site_name}</dd>
                  <dt>Service owner</dt>
                  <dd>{w.owner_name}</dd>
                  <dt>Coverage</dt>
                  <dd>{row.coverage_status ?? "Not assessed"}</dd>
                  <dt>Linked requests</dt>
                  <dd>
                    {w.tickets.map((t) => (
                      <p key={t.id}>
                        <Link href={`/service/tickets/${t.id}`}>
                          {t.display_number}
                        </Link>{" "}
                        · {t.status}
                      </p>
                    ))}
                  </dd>
                </dl>
                <h3>Scope {revisionLabel(row.scope_revision)}</h3>
                {scope?.items.map((i) => (
                  <p key={i.id}>
                    <strong>
                      {i.task_kind} · {i.task_description}
                    </strong>
                    <small>{i.expected_outcome}</small>
                  </p>
                ))}
                <p>Exclusions: {scope?.exclusions ?? "None recorded"}</p>
                <p>
                  Diagnostic limit: {scope?.diagnostic_limit ?? "None recorded"}
                </p>
                <p className="wo-rule">
                  Authorising approves one exact scope revision with its
                  evidence and plans. Every linked request must be Triaged. A
                  later change creates a successor draft; the authorised scope
                  stays exact.
                </p>
              </section>
              <section className="wo-snapshot-activity">
                <RecordTabs
                  label="Work order snapshot"
                  id="wo-snapshot"
                  value={tab}
                  onChange={setTab}
                  tabs={[
                    { id: "readiness", label: "Readiness" },
                    { id: "visits", label: "Visits" },
                  ]}
                />
                <RecordPanel id="wo-snapshot" tab={tab} value={tab}>
                  <h3>
                    {tab === "readiness" ? "Authorisation stage" : "Visits"}
                  </h3>
                  {tab === "readiness" ? (
                    <>
                      {scope?.readiness
                        .filter((a) => a.blocking_stage === "Authorisation")
                        .map((a) => (
                          <p key={a.criterion_code}>
                            <strong>
                              {a.label}: {a.outcome}
                            </strong>
                            <small>
                              {a.expired
                                ? "Evidence expired"
                                : a.stale
                                  ? "Evidence stale after a scope change"
                                  : (a.reason ?? "No assessment recorded")}
                            </small>
                          </p>
                        ))}
                      {w.blockers.map((b, i) => (
                        <p key={i} className="wo-attention">
                          {b.message}
                        </p>
                      ))}
                    </>
                  ) : (
                    <>
                      {w.visits.map((v) => (
                        <p key={v.id}>
                          <Link href={`/service/appointments/${v.id}`}>
                            {v.display_number}
                          </Link>{" "}
                          · {v.status}
                          <small>
                            {formatTimestamp(v.start_at, v.site_timezone)} ·{" "}
                            {v.scope_review_required
                              ? "Scope review required"
                              : "Exact current authorised scope"}
                          </small>
                        </p>
                      ))}
                      {!w.visits.length && <p>No visit proposed.</p>}
                      <p>Proposals do not book or dispatch a crew.</p>
                      <Link href="/schedule">Open Schedule</Link>
                    </>
                  )}
                </RecordPanel>
                <NativeHistory id={id} />
              </section>
            </div>
            <footer className="wo-snapshot-footer">
              {w.tickets[0] && (
                <ButtonLink href={`/service/tickets/${w.tickets[0].id}`}>
                  Open request
                </ButtonLink>
              )}
              <ButtonLink
                variant="primary"
                href={`/service/work-orders/${id}?return_to=${encodeURIComponent(returnTo)}`}
              >
                Open work order
              </ButtonLink>
            </footer>
          </>
        )}
    </dialog>
  );
}
