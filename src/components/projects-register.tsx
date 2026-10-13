"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useIdentity } from "./business-session";
import { ReadState, Stamp, useResource } from "./business-ui";
import { useShell } from "./shell-provider";
import { HeaderContent } from "./header-content";
import { ShellIcon, type ShellIconName } from "./shell-icon";
import { FontAwesomeGlyph } from "./font-awesome";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import { WorklistChoice, WorklistMenu } from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import {
  formatDate,
  phases,
  todayInZone,
  type Schedule,
  type ProjectHistory,
} from "../projects/model";
import {
  projectCsv,
  projectSorts,
  projectViews,
  type ProjectRegisterData,
  type ProjectRegisterRow,
  type ProjectSort,
  type ProjectView,
} from "../projects/register-model";
import type { readDeliverySalesSources } from "../sales/delivery-binding";

const views: { id: ProjectView; label: string; icon: string }[] = [
  { id: "Active", label: "Active projects", icon: "diagram-project" },
  { id: "Mine", label: "My projects", icon: "user" },
  { id: "Closed", label: "Closed", icon: "circle-check" },
  { id: "All", label: "All projects", icon: "list" },
  { id: "Overdue", label: "Overdue milestones", icon: "calendar-exclamation" },
  { id: "AtRisk", label: "Tasks at risk", icon: "triangle-exclamation" },
  { id: "NoTarget", label: "No target date", icon: "calendar" },
];
// Reuse the licensed Kit's exact named assets. Public/offline builds retain the existing local glyph.
function Icon({ name }: { name: string }) {
  const fallbackNames: Record<string, ShellIconName> = {
    xmark: "close",
    plus: "plus",
    ellipsis: "more",
    user: "contacts",
    "magnifying-glass": "search",
    "diagram-project": "projects",
    "circle-check": "check",
    "triangle-exclamation": "warning",
    "chevron-right": "chevron-right",
    "chevron-down": "down",
    "chevron-up": "down",
    "arrow-right": "chevron-right",
    "flag-checkered": "flag",
    "rotate-left": "changes",
    files: "documents",
    building: "customers",
    "location-dot": "sites",
    "circle-dollar": "deals",
    "square-check": "check",
    square: "board",
    "chart-gantt": "calendar",
  };
  return (
    <FontAwesomeGlyph
      icon={name}
      className="pj-icon"
      fallback={
        <span
          className="pj-icon"
          style={
            name === "chevron-up" ? { transform: "rotate(180deg)" } : undefined
          }
        >
          <ShellIcon
            name={
              fallbackNames[name] ??
              (name.includes("calendar") ? "calendar" : "list")
            }
          />
        </span>
      }
    />
  );
}
const buttonClass = "mw-button";
const shortDate = (date: string | null, observed: string) =>
  date
    ? formatDate(date, date.slice(0, 4) !== observed.slice(0, 4))
    : "Not set";
function milestoneLabel(row: ProjectRegisterRow, observed: string) {
  return row.next_milestone
    ? `${row.milestone_overdue ? "Overdue · " : ""}${row.next_milestone.finish_date ? shortDate(row.next_milestone.finish_date, observed) : "Unscheduled"}`
    : "—";
}
const columns: {
  key: string;
  title: string;
  width: number;
  sort?: ProjectSort;
}[] = [
  { key: "title", title: "Project", width: 240, sort: "title" },
  { key: "milestone", title: "Next milestone", width: 200 },
  { key: "date", title: "Milestone date", width: 120, sort: "milestone" },
  { key: "target", title: "Target date", width: 110, sort: "target" },
  { key: "risk", title: "At risk", width: 80, sort: "risk" },
  { key: "customer", title: "Customer", width: 180, sort: "customer" },
  { key: "site", title: "Site", width: 190 },
  { key: "coordinator", title: "Coordinator", width: 140, sort: "coordinator" },
  { key: "status", title: "Status", width: 90, sort: "status" },
  { key: "reference", title: "Reference", width: 170, sort: "reference" },
];

export function ProjectsRegister() {
  const params = useSearchParams();
  // Re-mount transient selection and paging whenever the restorable filter changes (including Back).
  return <RegisterView key={params.toString()} query={params.toString()} />;
}
function RegisterView({ query }: { query: string }) {
  const router = useRouter(),
    shell = useShell(),
    params = new URLSearchParams(query);
  const view = projectViews.includes(params.get("view") as ProjectView)
    ? (params.get("view") as ProjectView)
    : "Active";
  const sort = projectSorts.includes(params.get("sort") as ProjectSort)
    ? (params.get("sort") as ProjectSort)
    : "target";
  const direction = params.get("direction") === "desc" ? "desc" : "asc";
  const [cursors, setCursors] = useState<(string | null)[]>([null]),
    [selected, setSelected] = useState<string[]>([]),
    [inspect, setInspect] = useState<string | null>(null);
  const [bulkVisible, setBulkVisible] = useState(true),
    [hidden, setHidden] = useState<string[]>([]),
    [menuOpen, setMenuOpen] = useState(true),
    [search, setSearch] = useState(params.get("q") ?? "");
  const menu = useSecondaryMenu(menuOpen, setMenuOpen),
    selectAll = useRef<HTMLInputElement>(null);
  const readParams = new URLSearchParams({ view, sort, direction });
  for (const key of ["q", "customer", "coordinator"])
    if (params.get(key)) readParams.set(key, params.get(key)!);
  if (cursors.at(-1)) readParams.set("cursor", cursors.at(-1)!);
  const resource = useResource<ProjectRegisterData>(
      `projects/register?${readParams}`,
    ),
    data = resource.data;
  const items = data?.items ?? [],
    selectedRows = items.filter((p) => selected.includes(p.id)),
    sequence = selectedRows.length ? selectedRows : items;
  const busy = resource.loading || !!resource.error;
  const allSelected = items.length > 0 && selectedRows.length === items.length;
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate = selectedRows.length > 0 && !allSelected;
  }, [selectedRows.length, allSelected]);
  const change = (values: Record<string, string>) => {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/projects${next.size ? `?${next}` : ""}`, { scroll: false });
  };
  const choose = (id: string) =>
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const exportRows = (rows: ProjectRegisterRow[]) => {
    if (busy || !rows.length) return;
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + projectCsv(rows)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "projects.csv";
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const refresh = () => {
    setSelected([]);
    setInspect(null);
    if (cursors.length > 1) setCursors([null]);
    else resource.reload();
  };
  const menuContent = (
    <nav aria-label="Project views">
      <ul>
        {views.map((v, i) => (
          <li key={v.id}>
            {i === 4 && <h2 className="pj-menu-heading">Needs attention</h2>}
            <Link
              href={`/projects?${new URLSearchParams({ ...Object.fromEntries(params), view: v.id })}`}
              aria-current={view === v.id ? "page" : undefined}
              onClick={() => menu.closeOverlay(false)}
            >
              <Icon name={v.icon} />
              <span>{v.label}</span>
              <small>{!busy ? data?.counts[v.id] : "—"}</small>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
  const filters = (
    <>
      <WorklistChoice
        label="Coordinator"
        prefix="Coordinator: "
        value={params.get("coordinator") ?? ""}
        options={[
          { id: "", label: "Everyone" },
          ...(data?.options.coordinators ?? []).map((p) => ({
            id: p.id,
            label: p.name,
          })),
        ]}
        onChange={(coordinator) => change({ coordinator })}
      />
      <WorklistChoice
        label="Customer"
        prefix="Customer: "
        value={params.get("customer") ?? ""}
        options={[
          { id: "", label: "All customers" },
          ...(data?.options.customers ?? []).map((p) => ({
            id: p.id,
            label: p.name,
          })),
        ]}
        onChange={(customer) => change({ customer })}
      />
    </>
  );
  const more = (
    <WorklistMenu label="Project register actions" icon="more">
      <form
        className="pj-search"
        onSubmit={(e) => {
          e.preventDefault();
          change({ q: search.trim() });
        }}
      >
        <label>
          Search projects
          <input
            type="search"
            value={search}
            maxLength={200}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Button type="submit">Search</Button>
      </form>
      <Button
        data-menu-close
        disabled={busy || !items.length}
        onClick={() => exportRows(items)}
      >
        Export this page (CSV)
      </Button>
      <Button data-menu-close onClick={() => router.push("/projects")}>
        Clear filters
      </Button>
    </WorklistMenu>
  );
  const currentIndex = sequence.findIndex((p) => p.id === inspect),
    inspected = items.find((p) => p.id === inspect);
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-projects"
      name="Projects"
      menuId="projects-menu"
      contentId="projects-content"
      menu={menuContent}
      message={
        selectedRows.length ? `${selectedRows.length} projects selected` : ""
      }
    >
      <HeaderContent slot="project-count">
        {!busy && data && (
          <span className="pj-rail-count" title="Active permitted projects">
            {data.active_count}
          </span>
        )}
      </HeaderContent>
      <h1 className="mw-sr">Project register</h1>
      <div className="pj-toolbar pj-desktop">
        {selectedRows.length ? (
          <>
            <Button
              className={buttonClass}
              disabled={busy}
              onClick={() => setInspect(selectedRows[0].id)}
            >
              <Icon name="arrow-right" />
              Open in sequence
            </Button>
            <Button
              className={buttonClass}
              disabled={busy}
              onClick={() => exportRows(selectedRows)}
            >
              <Icon name="files" />
              Export list
            </Button>
            <span className="mw-spacer" />
            <button
              className="pj-selected"
              aria-label="Clear selection"
              onClick={() => setSelected([])}
            >
              {selectedRows.length} selected <Icon name="xmark" />
            </button>
            <Button
              className={buttonClass}
              onClick={() => setBulkVisible((v) => !v)}
            >
              {bulkVisible ? "Hide panel" : "Show panel"}
            </Button>
            {more}
          </>
        ) : (
          <>
            {filters}
            <span className="mw-spacer" />
            <span className="pj-observed">
              {data
                ? `${data.total} projects · updated ${new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", timeZone: "Australia/Brisbane", timeZoneName: "short" }).format(new Date(data.observed_at))}`
                : resource.error
                  ? "Unavailable"
                  : "Loading…"}
            </span>
            <Button
              className="mw-button mw-button-icon"
              aria-label="Refresh projects"
              disabled={resource.loading}
              onClick={refresh}
            >
              <Icon name="rotate-left" />
            </Button>
            {shell.context?.actions.some((a) => a.id === "project") && (
              <ButtonLink
                href="/projects/new"
                variant="primary"
                className="mw-button mw-button-primary"
              >
                <Icon name="plus" />
                Project
              </ButtonLink>
            )}
            {more}
          </>
        )}
      </div>
      <div className="pj-toolbar pj-phone">
        <WorklistChoice
          label="Project view"
          value={view}
          options={views.map((v) => ({ id: v.id, label: v.label }))}
          onChange={(view) => change({ view })}
        />
        <span className="mw-spacer" />
        <span>{data?.total ?? "—"} projects</span>
        <WorklistMenu label="Filter projects" icon="filter">
          {filters}
          <form
            className="pj-search"
            onSubmit={(e) => {
              e.preventDefault();
              change({ q: search.trim() });
            }}
          >
            <label>
              Search projects
              <input
                value={search}
                maxLength={200}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Button type="submit">Search</Button>
          </form>
          <Button onClick={refresh}>Refresh projects</Button>
          <Button data-menu-close onClick={() => router.push("/projects")}>
            Clear filters
          </Button>
        </WorklistMenu>
      </div>
      {(params.get("q") ||
        params.get("coordinator") ||
        params.get("customer")) && (
        <div className="pj-filter-summary">
          Filtered projects{params.get("q") ? ` · ${params.get("q")}` : ""}
          <button onClick={() => router.push("/projects")}>
            Clear filters
          </button>
        </div>
      )}
      <ReadState
        loading={resource.loading}
        error={resource.error}
        retry={resource.reload}
        retained={!!data}
      />
      <div className="pj-results" aria-busy={resource.loading}>
        <div
          className="pj-desktop pj-table-host"
          style={
            {
              "--pj-table-width": `${88 + columns.filter((c) => !hidden.includes(c.key)).reduce((sum, c) => sum + c.width, 0)}px`,
            } as CSSProperties
          }
        >
          <RegisterTable
            caption="Projects. Open a project snapshot or select rows to open in sequence and export."
            stale={busy}
          >
            <colgroup>
              <col style={{ width: 44 }} />
              {columns
                .filter((c) => !hidden.includes(c.key))
                .map((c) => (
                  <col key={c.key} style={{ width: c.width }} />
                ))}
              <col style={{ width: 44 }} />
            </colgroup>
            <thead>
              <tr>
                <th className="ppo-register-check">
                  <input
                    ref={selectAll}
                    type="checkbox"
                    aria-label="Select all projects on this page"
                    checked={allSelected}
                    disabled={busy || !items.length}
                    onChange={() =>
                      setSelected(allSelected ? [] : items.map((p) => p.id))
                    }
                  />
                </th>
                {columns
                  .filter((c) => !hidden.includes(c.key))
                  .map((c) =>
                    c.sort ? (
                      <RegisterSortHeader
                        key={c.key}
                        label={c.title}
                        direction={
                          sort === c.sort
                            ? direction === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                        onSort={() =>
                          change({
                            sort: c.sort!,
                            direction:
                              sort === c.sort && direction === "asc"
                                ? "desc"
                                : "asc",
                          })
                        }
                      />
                    ) : (
                      <th key={c.key} scope="col">
                        {c.title}
                      </th>
                    ),
                  )}
                <th className="pj-actions">
                  <WorklistMenu label="Project columns" icon="settings">
                    {columns.map((c) => (
                      <label key={c.key} className="pj-column-choice">
                        <input
                          type="checkbox"
                          checked={!hidden.includes(c.key)}
                          disabled={c.key === "title"}
                          onChange={() =>
                            setHidden((old) =>
                              old.includes(c.key)
                                ? old.filter((k) => k !== c.key)
                                : [...old, c.key],
                            )
                          }
                        />
                        {c.title}
                      </label>
                    ))}
                  </WorklistMenu>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr
                  key={p.id}
                  data-selected={selected.includes(p.id) || undefined}
                  data-inspected={inspect === p.id || undefined}
                  onClick={(e) => {
                    if (
                      !busy &&
                      !(e.target as HTMLElement).closest("a,button,input")
                    )
                      setInspect(p.id);
                  }}
                >
                  <td className="ppo-register-check">
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      disabled={busy}
                      aria-label={`Select ${p.title}`}
                      onChange={() => choose(p.id)}
                    />
                  </td>
                  {columns
                    .filter((c) => !hidden.includes(c.key))
                    .map((c) => (
                      <td
                        key={c.key}
                        className={c.key === "risk" ? "pj-number" : undefined}
                      >
                        {c.key === "title" ? (
                          <button
                            className="ppo-register-row-title"
                            disabled={busy}
                            onClick={() => setInspect(p.id)}
                            title={p.title}
                          >
                            {p.title}
                          </button>
                        ) : c.key === "milestone" ? (
                          <span title={p.next_milestone?.title}>
                            {p.next_milestone?.title ??
                              "No remaining milestones"}
                          </span>
                        ) : c.key === "date" ? (
                          <span
                            className={
                              p.milestone_overdue
                                ? "pj-overdue"
                                : !p.next_milestone?.finish_date
                                  ? "mw-muted"
                                  : ""
                            }
                          >
                            {milestoneLabel(p, data!.observed_at)}
                          </span>
                        ) : c.key === "target" ? (
                          <span className={!p.target_date ? "mw-muted" : ""}>
                            {shortDate(p.target_date, data!.observed_at)}
                          </span>
                        ) : c.key === "risk" ? (
                          p.at_risk
                        ) : c.key === "customer" ? (
                          p.customer_name
                        ) : c.key === "site" ? (
                          p.site_name
                        ) : c.key === "coordinator" ? (
                          p.coordinator_name
                        ) : c.key === "status" ? (
                          <span className="mw-tag">{p.lifecycle}</span>
                        ) : (
                          p.display_number
                        )}
                      </td>
                    ))}
                  <td className="pj-actions">
                    <WorklistMenu
                      label={`Actions for ${p.title}`}
                      icon="more"
                      choices
                      disabled={busy}
                    >
                      <button data-menu-close onClick={() => setInspect(p.id)}>
                        Open snapshot
                      </button>
                      <Link href={`/projects/${p.id}`}>Open schedule</Link>
                      <Link href={`/projects/acceptance?project=${p.id}`}>
                        Acceptance &amp; closeout
                      </Link>
                    </WorklistMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </RegisterTable>
        </div>
        <div className="pj-phone pj-phone-list">
          {items.map((p) => (
            <PhoneRow
              key={p.id}
              row={p}
              observed={data!.observed_at}
              disabled={busy}
              selected={selected.includes(p.id)}
              selecting={!!selectedRows.length}
              onSelect={() => choose(p.id)}
              onOpen={() => setInspect(p.id)}
            />
          ))}
        </div>
        {!busy && !items.length && (
          <RegisterEmpty
            title={
              view !== "Active" || query
                ? "No matching projects"
                : "No projects yet"
            }
          >
            <p>
              {query
                ? "Try another view or clear the filters."
                : "Create a project to start planning tasks and milestones."}
            </p>
            {query && (
              <Button onClick={() => router.push("/projects")}>
                Clear filters
              </Button>
            )}
            {shell.context?.actions.some((a) => a.id === "project") && (
              <ButtonLink href="/projects/new">+ Project</ButtonLink>
            )}
          </RegisterEmpty>
        )}
      </div>
      {(cursors.length > 1 || data?.next_cursor) && (
        <RegisterFooter>
          <span>
            {items.length} of {data?.total} matching projects
          </span>
          <span className="mw-spacer" />
          <Button
            className={buttonClass}
            disabled={busy || cursors.length === 1}
            onClick={() => {
              setSelected([]);
              setCursors((c) => c.slice(0, -1));
            }}
          >
            Previous
          </Button>
          <Button
            className={buttonClass}
            disabled={busy || !data?.next_cursor}
            onClick={() => {
              setSelected([]);
              setCursors((c) => [...c, data!.next_cursor]);
            }}
          >
            Next
          </Button>
        </RegisterFooter>
      )}
      {!inspect && selectedRows.length > 0 && (
        <>
          {bulkVisible && (
            <aside
              className="pj-bulk pj-desktop"
              aria-label="Selected projects"
            >
              <header>{selectedRows.length} projects selected</header>
              <div className="pj-bulk-body">
                {selectedRows.map((p) => (
                  <div className="pj-selection-card" key={p.id}>
                    <strong>
                      {p.display_number} · {p.lifecycle}
                    </strong>
                    <small>
                      {p.title} · {p.coordinator_name}
                    </small>
                  </div>
                ))}
                <p className="pj-note">
                  Projects change one at a time, in their own schedule. This
                  panel only opens or exports the selection; it changes no task,
                  milestone or closeout.
                </p>
                <h2>For the selection</h2>
                <Fact
                  icon="arrow-right"
                  label="Opens each selected project in turn, in the register’s order."
                >
                  Open in sequence
                </Fact>
                <Fact
                  icon="files"
                  label="Project, next milestone and date, target date, tasks at risk, customer, site, coordinator, status and reference."
                >
                  Export list (CSV)
                </Fact>
              </div>
              <footer>
                <Button className={buttonClass} onClick={() => setSelected([])}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="mw-button mw-button-primary"
                  disabled={busy}
                  onClick={() => setInspect(selectedRows[0].id)}
                >
                  Open in sequence
                </Button>
              </footer>
            </aside>
          )}
          <div className="pj-mobile-selection pj-phone">
            <span>{selectedRows.length} selected</span>
            <Button
              disabled={busy}
              onClick={() => setInspect(selectedRows[0].id)}
            >
              Open
            </Button>
            <Button disabled={busy} onClick={() => exportRows(selectedRows)}>
              Export
            </Button>
            <Button
              aria-label="Clear selection"
              onClick={() => setSelected([])}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
      {!selectedRows.length &&
        shell.context?.actions.some((a) => a.id === "project") && (
          <Link
            href="/projects/new"
            className="pj-phone pj-quick-add"
            aria-label="New project"
          >
            <Icon name="plus" />
          </Link>
        )}
      {inspected && !busy && (
        <Snapshot
          key={inspected.id}
          row={inspected}
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
  observed,
  disabled,
  selecting,
  selected,
  onSelect,
  onOpen,
}: {
  row: ProjectRegisterRow;
  observed: string;
  disabled: boolean;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
}) {
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false),
    origin = useRef({ x: 0, y: 0 });
  const cancel = () => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  };
  useEffect(
    () => () => {
      if (hold.current) clearTimeout(hold.current);
    },
    [],
  );
  return (
    <button
      className="pj-phone-row"
      disabled={disabled}
      aria-label={`Open ${row.title}`}
      aria-pressed={selecting ? selected : undefined}
      data-selected={selected || undefined}
      onPointerDown={(e) => {
        held.current = false;
        origin.current = { x: e.clientX, y: e.clientY };
        if (e.pointerType !== "mouse")
          hold.current = setTimeout(() => {
            held.current = true;
            onSelect();
          }, 550);
      }}
      onPointerMove={(e) => {
        if (
          Math.abs(e.clientX - origin.current.x) +
            Math.abs(e.clientY - origin.current.y) >
          10
        )
          cancel();
      }}
      onPointerUp={cancel}
      onPointerCancel={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.shiftKey && e.key === " ") {
          e.preventDefault();
          held.current = true;
          onSelect();
        }
      }}
      onClick={() => {
        if (held.current) {
          held.current = false;
          return;
        }
        if (selecting) onSelect();
        else onOpen();
      }}
    >
      <strong>{row.title}</strong>
      <span className="pj-phone-meta">
        {row.customer_name} ·{" "}
        {row.target_date
          ? `target ${shortDate(row.target_date, observed)}`
          : "no target date"}
        {row.at_risk > 0 && (
          <span className="mw-tag">{row.at_risk} at risk</span>
        )}
      </span>
      <span className="pj-phone-milestone">
        <Icon name="flag-checkered" />
        <span>{row.next_milestone?.title ?? "No remaining milestones"}</span>
        <span className={row.milestone_overdue ? "pj-overdue" : ""}>
          {milestoneLabel(row, observed)}
        </span>
      </span>
      <span className="pj-phone-chevron">
        <Icon
          name={
            selecting ? (selected ? "square-check" : "square") : "chevron-right"
          }
        />
      </span>
    </button>
  );
}
function Fact({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="pj-fact">
      <Icon name={icon} />
      <div>
        <div className="pj-fact-value">{children}</div>
        <small>{label}</small>
      </div>
    </div>
  );
}
function Snapshot({
  row,
  onClose,
  previous,
  next,
}: {
  row: ProjectRegisterRow;
  onClose: () => void;
  previous?: () => void;
  next?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    identity = useIdentity();
  const schedule = useResource<Schedule>(`projects/${row.id}`),
    history = useResource<ProjectHistory>(`projects/${row.id}/history`);
  const sales = useResource<
    Awaited<ReturnType<typeof readDeliverySalesSources>>
  >(`projects/${row.id}/sales-handovers`);
  const [tab, setTab] = useState<"risk" | "milestones">("risk"),
    [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const older = useResource<ProjectHistory>(
    historyCursor
      ? `projects/${row.id}/history?cursor=${encodeURIComponent(historyCursor)}`
      : null,
  );
  useEffect(() => {
    const dialog = ref.current!,
      opener = document.activeElement;
    const size = () => {
      const bounds = document
        .getElementById("projects-content")!
        .getBoundingClientRect();
      dialog.style.setProperty("--pj-top", `${bounds.top}px`);
      dialog.style.setProperty("--pj-height", `${bounds.height}px`);
    };
    size();
    dialog.showModal();
    window.addEventListener("resize", size);
    return () => {
      window.removeEventListener("resize", size);
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected)
        opener.focus({ preventScroll: true });
    };
  }, []);
  const p = schedule.data?.project,
    tasks = schedule.data?.tasks ?? [],
    risk = tasks.filter((t) => !t.milestone && t.status === "AtRisk"),
    milestones = tasks
      .filter((t) => t.milestone)
      .toSorted(
        (a, b) =>
          (a.finish_date ?? "9999").localeCompare(b.finish_date ?? "9999") ||
          a.id.localeCompare(b.id),
      );
  const milestone = milestones.find((t) => t.status !== "Complete"),
    overdue = !!(
      p &&
      milestone?.finish_date &&
      milestone.finish_date <
        todayInZone(p.timezone, new Date(schedule.data!.observed_at))
    );
  const projectTasks = tasks.filter((t) => !t.milestone),
    currentHistory = historyCursor ? older : history;
  return (
    <dialog
      ref={ref}
      className="pj-snapshot"
      aria-labelledby="pj-snapshot-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="pj-record-controls">
        <button aria-label="Close project snapshot" onClick={onClose}>
          <Icon name="xmark" />
        </button>
        <button
          aria-label="Previous project"
          disabled={!previous}
          onClick={previous}
        >
          <Icon name="chevron-up" />
        </button>
        <button aria-label="Next project" disabled={!next} onClick={next}>
          <Icon name="chevron-down" />
        </button>
      </div>
      <div className="pj-snapshot-inner">
        <div className="pj-record">
          <div className="pj-record-scroll">
            <header>
              <h2 id="pj-snapshot-title">
                {schedule.error
                  ? "Project unavailable"
                  : (p?.title ?? row.title)}
              </h2>
              {!schedule.error && (
                <small>
                  {row.display_number} · created{" "}
                  <StampDate value={row.created_at} timezone={row.timezone} /> ·
                  site time {row.timezone}
                </small>
              )}
            </header>
            <ReadState
              loading={schedule.loading}
              error={schedule.error}
              retry={schedule.reload}
            />
            {p && !schedule.error && (
              <>
                <div className="pj-record-status">
                  <span className="mw-tag">{p.lifecycle}</span>
                  {overdue && (
                    <span className="pj-overdue">
                      <Icon name="calendar-exclamation" />
                      Next milestone overdue ·{" "}
                      {formatDate(milestone!.finish_date, false)}
                    </span>
                  )}
                </div>
                <section>
                  <h3>Project</h3>
                  <Fact icon="building" label="Customer">
                    {p.customer_name}
                  </Fact>
                  <Fact
                    icon="location-dot"
                    label={`Site · schedule dates use ${p.timezone}`}
                  >
                    {p.site_name}
                  </Fact>
                  <Fact
                    icon="user"
                    label={`Coordinator${p.coordinator_id === identity.actor_id ? " (you)" : ""}`}
                  >
                    {p.coordinator_name}
                  </Fact>
                  <Fact icon="calendar" label="Target date">
                    {p.target_date ? formatDate(p.target_date) : "Not set"}
                  </Fact>
                  <Fact
                    icon="circle-dollar"
                    label="Sales source · accepted won handover"
                  >
                    {sales.loading ? (
                      "Loading Sales source…"
                    ) : sales.error ? (
                      <>
                        <span>Sales source unavailable. </span>
                        <button onClick={sales.reload}>Retry</button>
                      </>
                    ) : sales.data?.items.length ? (
                      sales.data.items.map((s, i) => (
                        <p key={i}>
                          {s.access === "Restricted" ? (
                            "A linked Sales handover is restricted."
                          ) : (
                            <Link href={`/sales/handoffs/won/${s.handover_id}`}>
                              {s.opportunity_title}
                              {s.current ? "" : " · historical"}
                            </Link>
                          )}
                        </p>
                      ))
                    ) : (
                      "No accepted Sales handover linked"
                    )}
                  </Fact>
                </section>
                <section>
                  <h3>Schedule</h3>
                  <Fact icon="list-check" label="Tasks">
                    {projectTasks.length} tasks ·{" "}
                    {projectTasks.filter((t) => t.status === "Complete").length}{" "}
                    complete · {risk.length} at risk
                  </Fact>
                  <Fact
                    icon="flag-checkered"
                    label={`Next milestone${overdue ? " · not complete, date has passed" : ""}`}
                  >
                    {milestone
                      ? `${milestone.title} · ${formatDate(milestone.finish_date, false)}`
                      : "No remaining milestones"}
                  </Fact>
                  <Fact icon="chart-gantt" label="Tasks complete by phase">
                    {phases
                      .map(
                        (phase) =>
                          `${phase} ${projectTasks.filter((t) => t.phase === phase && t.status === "Complete").length} of ${projectTasks.filter((t) => t.phase === phase).length}`,
                      )
                      .join(" · ")}
                  </Fact>
                </section>
                <p className="pj-note">
                  Phases group the schedule; they do not set the project’s
                  status. Dependency warnings never move dates, and every
                  schedule change keeps its reason. A closed project reopens
                  only through Acceptance &amp; closeout.
                </p>
              </>
            )}
          </div>
          {p && !schedule.error && (
            <footer>
              <ButtonLink
                className={buttonClass}
                href={`/projects/acceptance?project=${row.id}`}
              >
                Acceptance &amp; closeout
              </ButtonLink>
              <ButtonLink
                className="mw-button mw-button-primary"
                variant="primary"
                href={`/projects/${row.id}`}
              >
                Open schedule
              </ButtonLink>
            </footer>
          )}
        </div>
        {p && !schedule.error && (
          <div className="pj-activity">
            <div className="pj-tabs-card">
              <div
                className="pj-tabs"
                role="tablist"
                aria-label="Schedule facts"
                onKeyDown={(e) => {
                  if (
                    ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const nextTab =
                      e.key === "Home"
                        ? "risk"
                        : e.key === "End"
                          ? "milestones"
                          : tab === "risk"
                            ? "milestones"
                            : "risk";
                    setTab(nextTab);
                    document.getElementById(`pj-tab-${nextTab}`)?.focus();
                  }
                }}
              >
                <button
                  role="tab"
                  id="pj-tab-risk"
                  aria-controls="pj-facts"
                  tabIndex={tab === "risk" ? 0 : -1}
                  aria-selected={tab === "risk"}
                  onClick={() => setTab("risk")}
                >
                  <Icon name="triangle-exclamation" />
                  At risk ({risk.length})
                </button>
                <button
                  role="tab"
                  id="pj-tab-milestones"
                  aria-controls="pj-facts"
                  tabIndex={tab === "milestones" ? 0 : -1}
                  aria-selected={tab === "milestones"}
                  onClick={() => setTab("milestones")}
                >
                  <Icon name="flag-checkered" />
                  Milestones ({milestones.length})
                </button>
              </div>
              <div
                role="tabpanel"
                id="pj-facts"
                aria-labelledby={`pj-tab-${tab}`}
                tabIndex={0}
                className="pj-tab-body"
              >
                {(tab === "risk" ? risk : milestones).map((t) => (
                  <p key={t.id}>
                    <Link href={`/projects/${row.id}`}>{t.title}</Link> ·{" "}
                    {tab === "risk"
                      ? t.phase
                      : t.status === "AtRisk"
                        ? "At risk"
                        : t.status}{" "}
                    · {formatDate(t.finish_date, false)}
                    {t.owner_name ? ` · ${t.owner_name}` : ""}
                  </p>
                ))}
                {!(tab === "risk" ? risk : milestones).length && (
                  <p>
                    {tab === "risk"
                      ? "No tasks marked at risk."
                      : "No milestones recorded."}
                  </p>
                )}
              </div>
            </div>
            <details open>
              <summary>History</summary>
              <ReadState
                loading={currentHistory.loading}
                error={currentHistory.error}
                retry={currentHistory.reload}
              />
              <ol className="pj-history">
                {!currentHistory.error &&
                  currentHistory.data?.items.map((event, index) => (
                    <li key={index}>
                      <p>
                        {event.event_type === "ProjectCreated"
                          ? "Project created"
                          : "Schedule updated"}{" "}
                        · version {event.project_version}
                      </p>
                      <small>
                        <Stamp value={event.created_at} timezone={p.timezone} />{" "}
                        · {event.actor_name} · {event.reason}
                      </small>
                    </li>
                  ))}
              </ol>
              {currentHistory.data?.next_cursor && (
                <Button
                  onClick={() =>
                    setHistoryCursor(currentHistory.data!.next_cursor)
                  }
                >
                  Earlier history
                </Button>
              )}
              {historyCursor && (
                <Button onClick={() => setHistoryCursor(null)}>
                  Latest history
                </Button>
              )}
            </details>
          </div>
        )}
      </div>
    </dialog>
  );
}
function StampDate({ value, timezone }: { value: string; timezone: string }) {
  return (
    <>
      {new Intl.DateTimeFormat("en-AU", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: timezone,
      }).format(new Date(value))}
    </>
  );
}
