"use client";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  api,
  ErrorNotice,
  isDenied,
  useResource,
  type Failure,
} from "./business-ui";
import { Button } from "./ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import {
  engineeringDate,
  coordinationStates,
  disciplines,
} from "../engineering/model";
import {
  engineeringViews,
  engineeringSorts,
  continuationExpired,
  engineeringCsv,
  type EngineeringRegisterData,
  type EngineeringRegisterRow,
  type EngineeringSort,
  type EngineeringView,
} from "../engineering/register-presentation";
import { RequestDialog } from "./engineering-workspace";
import { EngineeringSnapshot } from "./engineering-register-snapshot";
import { EngineeringIcon as Icon } from "./engineering-register-icon";
import { useUnsavedChanges } from "./record-ui";
import { navigateWithReview } from "./navigation-intent";
import { useShell } from "./shell-provider";
import { HeaderContent } from "./header-content";
import "./engineering-register.css";

const columns = [
  { id: "reference", label: "Reference", width: 164, sort: "Reference" },
  { id: "title", label: "Work package", width: 228, sort: "Name" },
  { id: "customer", label: "Customer", width: 172 },
  { id: "state", label: "Status", width: 172 },
  { id: "required", label: "Required by", width: 124, sort: "RequiredDate" },
  { id: "owner", label: "Engineer", width: 140 },
  { id: "action", label: "Next action", width: 252 },
  { id: "due", label: "Action due", width: 148, sort: "ActionDate" },
  { id: "deliverables", label: "Deliverables", width: 136 },
  { id: "discipline", label: "Discipline", width: 120 },
  { id: "context", label: "Project or opportunity", width: 232 },
] as const;
export function EngineeringStatus({ state }: { state: string }) {
  return (
    <RegisterChip
      tone={state === "Awaiting information" ? "attention" : "neutral"}
    >
      {state}
    </RegisterChip>
  );
}
function readFilters(params: Pick<URLSearchParams, "get">) {
  return {
    q: params.get("q") ?? "",
    owner_id: params.get("owner_id") ?? "",
    discipline: params.get("discipline") ?? "",
    view:
      engineeringViews.find((v) => v.id === params.get("view"))?.id ??
      ("all" as EngineeringView),
    state: coordinationStates.find((s) => s === params.get("state")) ?? "",
    attention: params.get("attention") === "true",
    sort:
      engineeringSorts.find((s) => s[0] === params.get("sort"))?.[0] ??
      ("RequiredDate" as EngineeringSort),
    direction: params.get("direction") === "desc" ? "desc" : "asc",
  };
}
export function EngineeringRegister() {
  const params = useSearchParams(),
    router = useRouter();
  const toolbar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = toolbar.current;
    if (!node) return;
    const measure = () =>
      node.parentElement?.style.setProperty(
        "--er-toolbar-height",
        node.offsetHeight + "px",
      );
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const filters = readFilters(params);
  const filterKey = JSON.stringify(filters);
  const [shownFilterKey, setShownFilterKey] = useState(filterKey);
  const [searchText, setSearchText] = useState(filters.q);
  const [seenSearch, setSeenSearch] = useState(filters.q);
  const [submittedSearch, setSubmittedSearch] = useState<string | null>(null);
  if (seenSearch !== filters.q) {
    setSeenSearch(filters.q);
    if (filters.q !== submittedSearch) setSearchText(filters.q);
  }
  const [readNotice, setReadNotice] = useState("");
  const [sequenceSource, setSequenceSource] = useState<{
    basis: string;
    query: string;
    ids: string[];
  } | null>(null);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filterOpen, setFilterOpen] = useState(false),
    [phoneSelect, setPhoneSelect] = useState(false);
  const [selected, setSelected] = useState<{
    basis: string;
    query: string;
    ids: string[];
  }>({ basis: "", query: "", ids: [] });
  const [hidden, setHidden] = useState<string[]>([]),
    [widths, setWidths] = useState<Record<string, number>>({});
  const [request, setRequest] = useState(params.get("create") === "1"),
    created = useRef<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({}),
    [exportError, setExportError] = useState<unknown>(null),
    [exporting, setExporting] = useState(false);
  const inspect = params.get("package_id");
  // A same-route link or browser history change also starts a new result set.
  // Reset before committing children, so no read can use the old cursor/selection.
  if (shownFilterKey !== filterKey) {
    setShownFilterKey(filterKey);
    setCursors([null]);
    setSelected({ basis: "", query: "", ids: [] });
    setSequenceSource(null);
    setReadNotice("");
    setExportError(null);
  }
  const query = new URLSearchParams({ limit: "50" });
  for (const [key, value] of Object.entries(filters)) {
    if (value !== "" && value !== false) query.set(key, String(value));
  }
  if (cursors.at(-1)) query.set("cursor", cursors.at(-1)!);
  const queryString = query.toString();
  const resource = useResource<EngineeringRegisterData>(
    "engineering/register?" + queryString,
  );
  // The rail describes the actor's whole permitted Author actions queue.
  // Menu counts remain bound to the active register's filters.
  const railResource = useResource<EngineeringRegisterData>(
    "engineering/register?view=author&limit=1",
  );
  const railCount =
    railResource.loading || railResource.error
      ? undefined
      : railResource.data?.matching_count;
  const reloadRegister = resource.reload;
  const reloadRail = railResource.reload;
  const shell = useShell();
  const busy = resource.loading || !!resource.error;
  const data = busy ? null : resource.data;
  const rows = data?.items ?? [];
  const selectedRows =
    data &&
    selected.basis === data.source_version &&
    selected.query === queryString
      ? rows.filter((r) => selected.ids.includes(r.id))
      : [];
  const sequence =
    data &&
    sequenceSource?.basis === data.source_version &&
    sequenceSource.query === queryString
      ? sequenceSource.ids.flatMap((id) => rows.filter((r) => r.id === id))
      : [];
  const selectedIndex = sequence.findIndex((r) => r.id === inspect);
  const allSelected = !!rows.length && selectedRows.length === rows.length;
  const selectAll = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate = !!selectedRows.length && !allSelected;
  }, [selectedRows.length, allSelected]);
  useUnsavedChanges(Object.values(notes).some(Boolean), false, [
    "package_id",
    "section",
  ]);
  const open = (id: string | null) => {
    if (id && !inspect && data)
      setSequenceSource({
        basis: data.source_version,
        query: queryString,
        ids: (selectedRows.some((r) => r.id === id) ? selectedRows : rows).map(
          (r) => r.id,
        ),
      });
    if (!id) setSequenceSource(null);
    const next = new URLSearchParams(params);
    next.delete("create");
    if (id) next.set("package_id", id);
    else {
      next.delete("package_id");
      next.delete("section");
    }
    const href = "/engineering" + (next.size ? "?" + next : "");
    navigateWithReview(() => router.push(href, { scroll: false }), { href });
  };
  useEffect(() => {
    if (request || !created.current) return;
    const id = created.current;
    created.current = null;
    const next = new URLSearchParams(params);
    next.delete("create");
    next.set("package_id", id);
    const href = "/engineering?" + next;
    navigateWithReview(() => router.push(href, { scroll: false }), { href });
  }, [request, params, router]);
  const clearSelection = useCallback(
    () => setSelected({ basis: "", query: "", ids: [] }),
    [],
  );
  const change = useCallback(
    (next: Partial<ReturnType<typeof readFilters>>) => {
      const target = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries({
        ...readFilters(target),
        ...next,
      })) {
        if (value !== "" && value !== false) target.set(key, String(value));
        else target.delete(key);
      }
      window.history.replaceState(null, "", "/engineering?" + target);
      setCursors([null]);
      clearSelection();
      setExportError(null);
      setReadNotice("");
    },
    [clearSelection, setCursors, setExportError, setReadNotice],
  );
  useEffect(() => {
    if (searchText === filters.q) return;
    const timer = setTimeout(() => {
      setSubmittedSearch(searchText);
      change({ q: searchText });
    }, 250);
    return () => clearTimeout(timer);
  }, [searchText, filters.q, change]);
  const refresh = () => {
    reloadRail();
    clearSelection();
    setExportError(null);
    if (cursors.length > 1) setCursors([null]);
    else reloadRegister();
  };
  // A source-bound cursor can only continue its original result. Never append or retain it after rejection.
  useEffect(() => {
    if (cursors.length > 1 && continuationExpired(resource.error)) {
      let active = true;
      // Respond to the failed asynchronous read on the next turn; a newer
      // query/unmount cancels this recovery before it can replace that read.
      queueMicrotask(() => {
        if (!active) return;
        setReadNotice(
          "The workload changed. Continue from the refreshed first page; the previous selection and sequence are no longer valid.",
        );
        setCursors([null]);
        setSelected({ basis: "", query: "", ids: [] });
        setSequenceSource(null);
      });
      return () => {
        active = false;
      };
    }
  }, [resource.error, cursors.length]);
  const currentSelection = useRef("");
  useEffect(() => {
    currentSelection.current = JSON.stringify([
      queryString,
      selected,
      inspect,
      selectionOpen,
    ]);
    return () => {
      currentSelection.current = "";
    };
  }, [queryString, selected, inspect, selectionOpen]);
  const checkSource = async () => {
    if (!data)
      throw {
        code: "ReadConflict",
        message: "Refresh the workload before using this selection.",
      };
    const current = await api<EngineeringRegisterData>(
      "engineering/register?" + queryString,
    );
    if (current.source_version !== data.source_version)
      throw {
        code: "ReadConflict",
        message:
          "The workload changed. Select packages again on a fresh first page.",
      };
    return current;
  };
  const changedSource = useCallback(
    (error: unknown) => {
      if (continuationExpired(error) || isDenied(error)) {
        clearSelection();
        setSequenceSource(null);
        setReadNotice(
          "The workload changed. Select packages again on the fresh first page.",
        );
        setExportError(isDenied(error) ? error : null);
        if (cursors.length > 1) setCursors([null]);
        else reloadRegister();
      } else {
        setExportError(error);
        setReadNotice(
          "The workload could not be rechecked. Showing the last confirmed results; retry the selected action or refresh.",
        );
      }
    },
    [
      clearSelection,
      cursors.length,
      reloadRegister,
      setSequenceSource,
      setReadNotice,
      setExportError,
      setCursors,
    ],
  );
  useEffect(() => {
    let active = true;
    const recheck = async () => {
      reloadRail();
      if (!data) return;
      try {
        const current = await api<EngineeringRegisterData>(
          "engineering/register?" + queryString,
        );
        if (active && current.source_version !== data.source_version) {
          changedSource({ code: "ReadConflict" });
        }
      } catch (error) {
        if (active) changedSource(error);
      }
    };
    window.addEventListener("focus", recheck);
    return () => {
      active = false;
      window.removeEventListener("focus", recheck);
    };
  }, [data, queryString, changedSource, reloadRail]);
  const navigateSequence = async (id: string) => {
    if (exporting || !data) return;
    setExportError(null);
    setExporting(true);
    const selectionKey = currentSelection.current;
    try {
      await checkSource();
      if (currentSelection.current !== selectionKey) return;
      setReadNotice("");
      setExportError(null);
      open(id);
      setSelectionOpen(false);
    } catch (error) {
      if (currentSelection.current === selectionKey) changedSource(error);
    } finally {
      setExporting(false);
    }
  };
  const choose = (id: string) => {
    if (!data) return;
    const ids = selectedRows.map((r) => r.id);
    setSelected({
      basis: data.source_version,
      query: queryString,
      ids: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    });
  };
  const page = (next: (string | null)[]) => {
    clearSelection();
    setCursors(next);
  };
  const sortBy = (value: EngineeringSort) =>
    change({
      sort: value,
      direction:
        filters.sort === value && filters.direction === "asc" ? "desc" : "asc",
    });
  const filtered = !!(
    filters.q ||
    filters.owner_id ||
    filters.discipline ||
    filters.attention ||
    filters.state ||
    filters.view !== "all"
  );
  const clear = () =>
    change({
      q: "",
      owner_id: "",
      discipline: "",
      view: "all",
      state: "",
      attention: false,
    });
  const exportSelection = async () => {
    if (!data || !selectedRows.length || exporting) return;
    setExporting(true);
    setExportError(null);
    const selectionKey = currentSelection.current;
    try {
      // Revalidate current source authority and the complete source basis before exporting.
      const current = await checkSource();
      if (currentSelection.current !== selectionKey) return;
      setReadNotice("");
      setExportError(null);
      const exact = current.items.filter((r) =>
        selectedRows.some((s) => s.id === r.id && s.version === r.version),
      );
      if (exact.length !== selectedRows.length)
        throw {
          code: "ReadConflict",
          message:
            "The selection changed. Refresh and select the packages again.",
        };
      const url = URL.createObjectURL(
        new Blob(["\ufeff" + engineeringCsv(exact)], {
          type: "text/csv;charset=utf-8",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "engineering-selected-packages.csv";
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      if (currentSelection.current === selectionKey) changedSource(error);
    } finally {
      setExporting(false);
    }
  };
  const ownerOptions = [
    { id: "", label: "All" },
    ...(data?.engineers.items ?? []).map((p) => ({
      id: p.id,
      label: p.name + (p.active ? "" : " (inactive recorded owner)"),
    })),
  ];
  if (filters.owner_id && !ownerOptions.some((o) => o.id === filters.owner_id))
    ownerOptions.push({
      id: filters.owner_id,
      label: "Selected recorded owner",
    });
  const filterControls = (
    <>
      <label className="er-search">
        <span className="sr-only">Search engineering packages</span>
        <Icon name="magnifying-glass" />
        <input
          type="search"
          maxLength={200}
          placeholder="Search packages, customers or projects"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </label>
      <WorklistChoice
        label="Engineer"
        prefix="Engineer: "
        value={filters.owner_id}
        options={ownerOptions}
        onChange={(owner_id) => change({ owner_id })}
      />
      <WorklistChoice
        label="Discipline"
        prefix="Discipline: "
        value={filters.discipline}
        options={[
          { id: "", label: "All" },
          ...disciplines.map((d) => ({ id: d, label: d })),
        ]}
        onChange={(discipline) => change({ discipline })}
      />
    </>
  );
  const count = data
    ? `${data.matching_count} package${data.matching_count === 1 ? "" : "s"}`
    : resource.loading
      ? "Loading…"
      : "Unavailable";
  const menuItem = (
    label: string,
    active: boolean,
    value: number | undefined,
    icon: string,
    action: () => void,
  ) => (
    <button
      type="button"
      className="er-menu-item"
      aria-pressed={active}
      onClick={() => {
        action();
        menu.closeOverlay();
      }}
    >
      <Icon name={icon} />
      <span>{label}</span>
      {value !== undefined && <small className="mw-badge">{value}</small>}
    </button>
  );
  const cell = (r: EngineeringRegisterRow, id: string) => {
    switch (id) {
      case "reference":
        return (
          <button className="er-cell-link" onClick={() => open(r.id)}>
            {r.display_number}
          </button>
        );
      case "title":
        return (
          <button className="er-cell-link" onClick={() => open(r.id)}>
            {r.title}
          </button>
        );
      case "customer":
        return r.customer_name;
      case "state":
        return <EngineeringStatus state={r.state} />;
      case "required":
      case "due": {
        const value = id === "required" ? r.required_date : r.action_due;
        return (
          <span
            className={
              value && value < (data?.observed_on ?? "")
                ? "er-overdue"
                : !value
                  ? "er-muted"
                  : ""
            }
          >
            {value && value < (data?.observed_on ?? "") && (
              <Icon name="circle-exclamation" />
            )}
            {value
              ? engineeringDate(value)
              : id === "required"
                ? "Date needed"
                : "Action date needed"}
          </span>
        );
      }
      case "owner":
        return r.owner_name + (r.owner_active ? "" : " (inactive)");
      case "action":
        return r.next_action;
      case "deliverables":
        return (
          <Link href={`/engineering/${r.id}/drawings/deliverables`}>
            {r.technical.deliverables} · {r.technical.blocked} blocked
          </Link>
        );
      case "discipline":
        return r.discipline;
      case "context":
        return (
          <Link
            href={`${r.context_kind === "Project" ? "/projects" : "/sales/opportunities"}/${r.context_id}`}
          >
            {r.context_reference} · {r.context_title}
          </Link>
        );
      default:
        return null;
    }
  };
  const resize = (id: string, width: number) =>
    setWidths((old) => ({ ...old, [id]: Math.min(800, Math.max(100, width)) }));
  const visible = columns.filter((c) => !hidden.includes(c.id));
  return (
    <SecondaryMenuFrame
      id="ppo-engineering"
      name="Engineering workload"
      menuId="engineering-views"
      contentId="engineering-content"
      attributes={{
        "data-native-register": "true",
        "data-ppo-workspace": "shared",
      }}
      state={menu}
      phoneHeader={{
        title:
          filters.view === "all"
            ? "Engineering workload"
            : engineeringViews.find((v) => v.id === filters.view)!.label,
        count: data?.matching_count,
        pageAction: {
          icon: "check",
          label: phoneSelect ? "Finish selecting packages" : "Select packages",
          onSelect: () => setPhoneSelect((v) => !v),
        },
        filter: { open: () => setFilterOpen(true), applied: filtered },
      }}
      message={
        data
          ? `${count}; ${rows.length} on this page. Counts cover all permitted matches.`
          : "Current results unconfirmed"
      }
      menu={
        <nav aria-label="Engineering views">
          {engineeringViews.map((v) => (
            <div key={v.id}>
              {menuItem(
                v.label,
                filters.view === v.id,
                data?.counts[v.id],
                v.icon,
                () => change({ view: v.id }),
              )}
            </div>
          ))}
          <h3>Status</h3>
          {coordinationStates.map((state, i) => (
            <div key={state}>
              {menuItem(
                state,
                filters.state === state,
                data?.counts.states[state],
                ["clock", "file-pen", "circle-exclamation"][i],
                () => change({ state: filters.state === state ? "" : state }),
              )}
            </div>
          ))}
          <h3>Attention</h3>
          {menuItem(
            "Needs attention",
            filters.attention,
            data?.counts.attention,
            "calendar-exclamation",
            () => change({ attention: !filters.attention }),
          )}
          {filtered && (
            <Button variant="quiet" onClick={clear}>
              Clear filters
            </Button>
          )}
        </nav>
      }
    >
      <HeaderContent slot="engineering-count">
        {railCount !== undefined && (
          <span
            className="er-rail-count"
            aria-label={
              railCount +
              " packages with author actions across all permitted packages"
            }
          >
            {railCount}
          </span>
        )}
      </HeaderContent>
      <div
        className="er-register"
        data-paged={!!data?.next_cursor || cursors.length > 1}
      >
        <h1 className="sr-only">Engineering workload</h1>
        <div className="er-toolbar" ref={toolbar}>
          {shell.context?.actions.some((a) => a.id === "engineering") && (
            <Button
              className="er-new"
              variant="primary"
              onClick={() => setRequest(true)}
            >
              <Icon name="plus" />
              New request
            </Button>
          )}
          <div className="er-desktop-filters">{filterControls}</div>
          <span
            className="er-count"
            title="All permitted matches for the selected view and filters"
          >
            {count}
          </span>
          <Button
            className="er-icon-button"
            aria-label="Refresh packages"
            disabled={resource.loading || exporting}
            onClick={refresh}
          >
            <Icon name="rotate-left" />
          </Button>
          <WorklistMenu label="Engineering register actions" icon="more">
            <Button data-menu-close onClick={() => setFilterOpen(true)}>
              Search and filter
            </Button>
            <Button data-menu-close onClick={() => setPhoneSelect((v) => !v)}>
              {phoneSelect ? "Finish selecting" : "Select packages"}
            </Button>
            <WorklistChoice
              label="Sort packages"
              value={filters.sort}
              options={engineeringSorts.map(([id, label]) => ({ id, label }))}
              onChange={(sort) => change({ sort: sort as EngineeringSort })}
            />
            <Button
              onClick={() =>
                change({
                  direction: filters.direction === "asc" ? "desc" : "asc",
                })
              }
            >
              Sort {filters.direction === "asc" ? "descending" : "ascending"}
            </Button>
            {filtered && (
              <Button data-menu-close onClick={clear}>
                Clear filters
              </Button>
            )}
          </WorklistMenu>
        </div>
        {phoneSelect && (
          <div className="er-phone-actions">
            <span>Select packages on this page</span>
            {selectedRows.length > 0 && (
              <Button onClick={() => setSelectionOpen(true)}>
                {selectedRows.length} selected
              </Button>
            )}
            <Button onClick={() => setPhoneSelect((v) => !v)}>
              Done selecting
            </Button>
          </div>
        )}
        {readNotice && (
          <p className="er-refresh-notice" role="status">
            {readNotice}
            <Button variant="quiet" onClick={() => setReadNotice("")}>
              Dismiss
            </Button>
          </p>
        )}
        {resource.error ? (
          <div className="er-notice">
            <h2>
              {continuationExpired(resource.error)
                ? "The workload changed"
                : [401, 403, 404].includes(
                      (resource.error as Failure).status ?? 0,
                    )
                  ? "Engineering access unavailable"
                  : "Packages could not be loaded"}
            </h2>
            <ErrorNotice error={resource.error} focusOnError={false} />
            <p>
              {continuationExpired(resource.error)
                ? "Start a fresh first page. Earlier rows and selections will not be combined with new results."
                : "Current rows, counts and choices cannot be confirmed."}
            </p>
            <Button onClick={refresh}>
              {continuationExpired(resource.error)
                ? "Refresh first page"
                : "Retry loading"}
            </Button>
          </div>
        ) : resource.loading ? (
          <div className="er-notice" role="status">
            Loading permitted engineering packages…
          </div>
        ) : data && !rows.length ? (
          <RegisterEmpty
            title={
              filtered
                ? "No packages match these filters"
                : "No engineering packages yet"
            }
          >
            <p>
              {filters.view === "review"
                ? "No submitted technical reviews are assigned to you in this matching set."
                : filters.view === "released"
                  ? "No matching package has a current exact formal issue. Coordination status does not release a package."
                  : "Start a request or adjust the filters."}
            </p>
            {filtered && <Button onClick={clear}>Clear filters</Button>}
          </RegisterEmpty>
        ) : null}
        <ErrorNotice error={exportError} focusOnError={false} />
        {data && rows.length > 0 && (
          <>
            <div
              className="er-grid"
              style={
                {
                  "--er-width": `${88 + visible.reduce((n, c) => n + (widths[c.id] ?? c.width), 0)}px`,
                } as CSSProperties
              }
            >
              <RegisterTable caption="Engineering packages. Open a snapshot, or select this page's rows to open in sequence or export.">
                <colgroup>
                  <col style={{ width: 44 }} />
                  {visible.map((c) => (
                    <col
                      key={c.id}
                      style={{ width: widths[c.id] ?? c.width }}
                    />
                  ))}
                  <col style={{ width: 44 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">
                      <input
                        ref={selectAll}
                        type="checkbox"
                        aria-label="Select all packages on this page"
                        checked={allSelected}
                        onChange={() =>
                          data &&
                          setSelected({
                            basis: data.source_version,
                            query: queryString,
                            ids: allSelected ? [] : rows.map((r) => r.id),
                          })
                        }
                      />
                    </th>
                    {visible.map((c) => (
                      <th
                        key={c.id}
                        scope="col"
                        aria-sort={
                          "sort" in c && filters.sort === c.sort
                            ? filters.direction === "asc"
                              ? "ascending"
                              : "descending"
                            : undefined
                        }
                      >
                        {"sort" in c ? (
                          <button
                            className="er-sort"
                            onClick={() => sortBy(c.sort)}
                          >
                            {c.label}
                            {filters.sort === c.sort && (
                              <span aria-hidden="true">
                                {filters.direction === "asc" ? "⌄" : "⌃"}
                              </span>
                            )}
                          </button>
                        ) : (
                          c.label
                        )}
                        <button
                          type="button"
                          className="er-resize"
                          aria-label={`Resize ${c.label} column`}
                          onKeyDown={(e) => {
                            if (
                              ["ArrowLeft", "ArrowRight", "Home"].includes(
                                e.key,
                              )
                            ) {
                              e.preventDefault();
                              resize(
                                c.id,
                                e.key === "Home"
                                  ? c.width
                                  : (widths[c.id] ?? c.width) +
                                      (e.key === "ArrowRight" ? 10 : -10),
                              );
                            }
                          }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            const start = e.clientX,
                              width = widths[c.id] ?? c.width,
                              target = e.currentTarget;
                            target.setPointerCapture(e.pointerId);
                            const move = (event: PointerEvent) =>
                              resize(c.id, width + event.clientX - start);
                            const end = () => {
                              target.removeEventListener("pointermove", move);
                              target.removeEventListener("pointerup", end);
                              target.removeEventListener("pointercancel", end);
                            };
                            target.addEventListener("pointermove", move);
                            target.addEventListener("pointerup", end);
                            target.addEventListener("pointercancel", end);
                          }}
                        />
                      </th>
                    ))}
                    <th scope="col">
                      <WorklistMenu label="Engineering columns" icon="settings">
                        {columns.map((c) => (
                          <label className="er-column-choice" key={c.id}>
                            <input
                              type="checkbox"
                              checked={!hidden.includes(c.id)}
                              disabled={
                                c.id === "reference" || c.id === "title"
                              }
                              onChange={() =>
                                setHidden((old) =>
                                  old.includes(c.id)
                                    ? old.filter((x) => x !== c.id)
                                    : [...old, c.id],
                                )
                              }
                            />
                            {c.label}
                          </label>
                        ))}
                        <Button
                          onClick={() => {
                            setHidden([]);
                            setWidths({});
                          }}
                        >
                          Reset columns
                        </Button>
                      </WorklistMenu>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      data-selected={
                        selectedRows.some((s) => s.id === r.id) || undefined
                      }
                      data-inspected={r.id === inspect || undefined}
                      onClick={(e) => {
                        if (
                          !(e.target as HTMLElement).closest("button,a,input")
                        )
                          open(r.id);
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${r.display_number}`}
                          checked={selectedRows.some((s) => s.id === r.id)}
                          onChange={() => choose(r.id)}
                        />
                      </td>
                      {visible.map((c) => (
                        <td key={c.id}>{cell(r, c.id)}</td>
                      ))}
                      <td>
                        <Button
                          variant="quiet"
                          aria-label={`Open snapshot for ${r.display_number}`}
                          onClick={() => open(r.id)}
                        >
                          <Icon name="ellipsis" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="er-phone-list">
              {rows.map((r) => (
                <div className="er-phone-row" key={r.id}>
                  {phoneSelect && (
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.display_number}`}
                      checked={selectedRows.some((s) => s.id === r.id)}
                      onChange={() => choose(r.id)}
                    />
                  )}
                  <button className="er-phone-open" onClick={() => open(r.id)}>
                    <span className="er-phone-main">
                      <strong>{r.title}</strong>
                      <span
                        className={
                          r.required_date && r.required_date < data.observed_on
                            ? "er-overdue"
                            : ""
                        }
                      >
                        {engineeringDate(r.required_date)}
                      </span>
                    </span>
                    <span className="er-phone-meta">
                      <span>{r.display_number}</span>
                      <EngineeringStatus state={r.state} />
                    </span>
                    <span className="er-phone-bottom">
                      <Icon name="building" />
                      <span>{r.customer_name}</span>
                      <span>
                        {r.owner_name}
                        {r.owner_active ? "" : " (inactive)"}
                      </span>
                    </span>
                  </button>
                  <Icon name="chevron-right" />
                </div>
              ))}
            </div>
            {(data.next_cursor || cursors.length > 1) && (
              <RegisterFooter>
                <span>
                  {rows.length} shown · {data.matching_count} matching · Page{" "}
                  {cursors.length}
                  {data.next_cursor ? " · More packages available" : ""}
                </span>
                <span>
                  <Button
                    disabled={cursors.length === 1 || busy}
                    onClick={() => page(cursors.slice(0, -1))}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={!data.next_cursor || busy}
                    onClick={() => page([...cursors, data.next_cursor])}
                  >
                    Next
                  </Button>
                </span>
              </RegisterFooter>
            )}
          </>
        )}
        {data?.engineers.has_more && (
          <p className="er-footnote">
            Showing 100 recorded owners. Refine search or discipline to find
            more. Filter choices are not assignment eligibility.
          </p>
        )}
        {!!selectedRows.length && !inspect && (
          <aside className="er-selection" aria-label="Selected packages">
            <header>
              <h2>{selectedRows.length} packages selected</h2>
            </header>
            <div className="er-selection-body">
              {selectedRows.map((r) => (
                <article key={r.id}>
                  <strong>{r.title}</strong>
                  <small>
                    {r.display_number} · {r.state}
                  </small>
                </article>
              ))}
              <p className="er-rule">
                Coordination is updated one package at a time, with a reason and
                its record version. These actions open or list packages; they
                change nothing.
              </p>
              <h3>For the selection</h3>
              <Button
                variant="quiet"
                disabled={exporting}
                onClick={() => void navigateSequence(selectedRows[0].id)}
              >
                <Icon name="arrow-right" />
                Open in sequence
              </Button>
              <p>Opens the selected packages on this page in register order.</p>
              <Button
                variant="quiet"
                disabled={exporting}
                onClick={() => void exportSelection()}
              >
                <Icon name="files" />
                {exporting ? "Checking selection…" : "Export list (CSV)"}
              </Button>
              <p>
                Selected rows only, rechecked against the current permitted
                source.
              </p>
            </div>
            <footer>
              <Button onClick={clearSelection}>Cancel</Button>
              <Button
                variant="primary"
                disabled={exporting}
                onClick={() => void navigateSequence(selectedRows[0].id)}
              >
                Open in sequence
              </Button>
            </footer>
          </aside>
        )}
        {inspect && (
          <EngineeringSnapshot
            key={inspect}
            id={inspect}
            draft={notes[inspect] ?? ""}
            onDraft={(value) =>
              setNotes((old) => ({ ...old, [inspect]: value }))
            }
            onClose={() => open(null)}
            onSaved={() => {
              refresh();
              setSequenceSource(null);
              setReadNotice(
                "Package saved. The workload source changed; continue from the fresh first page and select packages again.",
              );
            }}
            workloadNotice={readNotice}
            handoverError={exportError ?? resource.error}
            onRefreshRegister={refresh}
            previous={
              !exporting && selectedIndex > 0
                ? () => void navigateSequence(sequence[selectedIndex - 1].id)
                : undefined
            }
            next={
              !exporting &&
              selectedIndex >= 0 &&
              selectedIndex < sequence.length - 1
                ? () => void navigateSequence(sequence[selectedIndex + 1].id)
                : undefined
            }
            position={
              selectedIndex >= 0
                ? `${selectedIndex + 1} of ${sequence.length} on this page`
                : sequenceSource
                  ? "Sequence unavailable; close and select again"
                  : "Opened package"
            }
          />
        )}
        {selectionOpen && selectedRows.length > 0 && !inspect && (
          <WorklistPanel
            title="Selected engineering packages"
            onClose={() => setSelectionOpen(false)}
          >
            <p>{selectedRows.length} selected on this page.</p>
            {selectedRows.map((r) => (
              <p key={r.id}>
                {r.display_number} · {r.title}
              </p>
            ))}
            <Button
              disabled={exporting}
              onClick={() => void navigateSequence(selectedRows[0].id)}
            >
              Open in sequence
            </Button>
            <Button disabled={exporting} onClick={() => void exportSelection()}>
              Export list (CSV)
            </Button>
            <Button
              onClick={() => {
                clearSelection();
                setSelectionOpen(false);
              }}
            >
              Clear selection
            </Button>
          </WorklistPanel>
        )}
        {shell.context?.actions.some((a) => a.id === "engineering") && (
          <Button
            className="er-phone-new"
            variant="primary"
            aria-label="New request"
            onClick={() => setRequest(true)}
          >
            <Icon name="plus" />
          </Button>
        )}
        <RequestDialog
          open={request}
          onClose={() => setRequest(false)}
          onCreated={(id) => {
            created.current = id;
            setRequest(false);
            refresh();
          }}
        />
        {filterOpen && (
          <WorklistPanel
            title="Filter engineering packages"
            onClose={() => setFilterOpen(false)}
          >
            {filterControls}
            <WorklistChoice
              label="Sort packages"
              value={filters.sort}
              options={engineeringSorts.map(([id, label]) => ({ id, label }))}
              onChange={(sort) => change({ sort: sort as EngineeringSort })}
            />
            <Button
              onClick={() =>
                change({
                  direction: filters.direction === "asc" ? "desc" : "asc",
                })
              }
            >
              Sort {filters.direction === "asc" ? "descending" : "ascending"}
            </Button>
            <p>
              Engineer choices are recorded owners, including inactive people.
              New assignments use the package's separate eligibility check.
            </p>
            <Button onClick={clear}>Clear filters</Button>
            <Button disabled={resource.loading} onClick={refresh}>
              Refresh packages
            </Button>
            <Button onClick={() => setFilterOpen(false)}>
              {data
                ? "Show " + data.matching_count + " packages"
                : "Show packages"}
            </Button>
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
