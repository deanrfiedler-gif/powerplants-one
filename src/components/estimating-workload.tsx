"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import { api, ErrorNotice, isDenied, useResource } from "./business-ui";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { Button, ButtonLink } from "./ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterSortHeader,
} from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { ShellIcon } from "./shell-icon";
import { DiscoveryRegisterIcon } from "./discovery-register-icon";
import { WorkloadSnapshot } from "./estimating-workload-snapshot";
import {
  workloadLabels,
  type WorkloadState,
} from "../estimating/workload-query";
import {
  discoverySummary,
  workloadLocation,
  savedEstimateHref,
  workloadFilterKeys,
  workloadFingerprint,
  workloadSequence,
  workloadCsv,
  shortDate,
  readTime,
  type Workload,
  type WorkloadItem,
  type SavedEstimates,
} from "./estimating-workload-model";
import "./estimating-workload.css";

export const readinessOrder: WorkloadState[] = [
  "unstarted",
  "clarification",
  "ready",
  "legacy",
];
export function WorkloadReadiness({ item }: { item: WorkloadItem }) {
  return (
    <RegisterChip
      tone={
        item.state === "ready"
          ? "positive"
          : item.state === "clarification"
            ? "attention"
            : "neutral"
      }
    >
      {workloadLabels[item.state]}
    </RegisterChip>
  );
}
function useRegisterRead<T>(path: string) {
  const resource = useResource<T>(path),
    reload = useRef(resource.reload);
  useEffect(() => {
    reload.current = resource.reload;
  });
  useEffect(() => {
    const refresh = () => reload.current();
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, [path]);
  return resource;
}
export function EstimatingWorkload() {
  const params = useSearchParams(),
    identity = useIdentity();
  const [menuOpen, setMenuOpen] = useState(true);
  const basis = new URLSearchParams();
  for (const key of [...workloadFilterKeys, "tab", "estimate_q"])
    if (params.has(key)) basis.set(key, params.get(key)!);
  return (
    <Register
      key={identity.actor_id + "|" + basis}
      query={new URLSearchParams(params.toString())}
      menuOpen={menuOpen}
      setMenuOpen={setMenuOpen}
    />
  );
}
function IntakeRules() {
  return (
    <section className="ew-rules">
      <h3>Intake rules</h3>
      <dl>
        {[
          "Intake acceptance",
          "Estimator allocation",
          "Return decisions",
          "Priority rules",
        ].map((label) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>Not configured</dd>
          </div>
        ))}
        <div>
          <dt>Required response date</dt>
          <dd>Unknown</dd>
        </div>
      </dl>
      <p>
        Discovery complete is scope evidence only. It approves no price and
        issues no quotation.
      </p>
    </section>
  );
}
function Register({
  query,
  menuOpen,
  setMenuOpen,
}: {
  query: URLSearchParams;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const router = useRouter(),
    params = useSearchParams();
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filterOpen, setFilterOpen] = useState(false),
    [selection, setSelection] = useState<string[]>([]),
    [sequence, setSequence] = useState(false),
    [selectMode, setSelectMode] = useState(false);
  const [exporting, setExporting] = useState(false),
    [exportError, setExportError] = useState<unknown>(null),
    [notice, setNotice] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const saved = query.get("tab") === "estimates",
    view = (query.get("view") ?? "all") as WorkloadState | "all",
    owner = query.get("owner") ?? "all",
    sort = query.get("sort") ?? "updated";
  const filters = new URLSearchParams();
  for (const key of workloadFilterKeys)
    if (query.has(key)) filters.set(key, query.get(key)!);
  const endpoint = `estimating/workload?${filters}`;
  const workload = useRegisterRead<Workload>(endpoint);
  const estimates = useRegisterRead<SavedEstimates>(
    `estimating/estimates?${new URLSearchParams({ q: query.get("estimate_q") ?? "" })}`,
  );
  const current = saved ? estimates : workload;
  const data = workload.error ? null : workload.data,
    savedData = estimates.error ? null : estimates.data;
  const items = data?.items ?? [],
    activeData = saved ? savedData : data;
  const fresh = !!activeData && !current.loading && !current.error;
  const fingerprint = workloadFingerprint(items),
    [seen, setSeen] = useState(fingerprint);
  if (seen !== fingerprint) {
    setSeen(fingerprint);
    setSelection([]);
    setSequence(false);
  }
  const selected = workloadSequence(items, selection);
  const snapshot = items.find((i) => i.opportunity.id === params.get("record"));
  const navigation = sequence ? selected : items;
  const index = snapshot
    ? navigation.findIndex((i) => i.opportunity.id === snapshot.opportunity.id)
    : -1;
  function change(values: Record<string, string>, keepRecord = false) {
    router.push(
      workloadLocation(query, {
        ...(!keepRecord ? { record: "" } : {}),
        ...values,
      }),
      { scroll: false },
    );
  }
  function closeSnapshot() {
    change({ record: "" }, true);
    requestAnimationFrame(
      () =>
        opener.current?.isConnected &&
        opener.current.focus({ preventScroll: true }),
    );
  }
  function openSnapshot(id: string, source?: HTMLElement) {
    if (source) opener.current = source;
    change({ record: id }, true);
  }
  function toggle(id: string) {
    setSelection((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
    setSequence(false);
  }
  const viewName = saved
    ? "Saved estimates"
    : view !== "all"
      ? workloadLabels[view]
      : owner === "mine"
        ? "My estimating work"
        : "All workload";
  const count = fresh
    ? saved
      ? savedData!.items.length
      : items.length
    : undefined;
  const readNote = current.loading
    ? activeData
      ? "Refreshing — earlier results unconfirmed"
      : "Loading permitted " + (saved ? "saved estimates" : "workload") + "…"
    : current.error
      ? "Current results unavailable"
      : `${count ?? 0} ${saved ? "saved estimates" : "opportunities"}`;
  const counts = data && !workload.loading ? data.counts : null;
  const ownerCounts = data && !workload.loading ? data.owner_counts : null;
  async function exportList() {
    setExporting(true);
    setExportError(null);
    try {
      const checked = await api<Workload>(endpoint);
      const confirmed = workloadSequence(checked.items, selection);
      if (workloadFingerprint(confirmed) !== workloadFingerprint(selected)) {
        setSelection([]);
        setSequence(false);
        setNotice(
          "Selected records changed or are no longer available. Refresh and select the current records again.",
        );
        workload.reload();
        return;
      }
      const blob = new Blob(["\ufeff" + workloadCsv(confirmed)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "ppo-estimating-workload.csv";
      a.click();
      URL.revokeObjectURL(url);
      setNotice(
        `Exported ${confirmed.length} permitted selected opportunities. No intake decision was made.`,
      );
    } catch (error) {
      setExportError(error);
      setSelection([]);
      setSequence(false);
      workload.reload();
    } finally {
      setExporting(false);
    }
  }
  function menuLink(
    label: string,
    values: Record<string, string>,
    n: number | undefined,
    active: boolean,
    icon: "work" | "person" | "documents" | "check" | "clock" | "info",
  ) {
    return (
      <li>
        <Link
          href={workloadLocation(query, { record: "", ...values })}
          aria-current={active ? "page" : undefined}
          onClick={() => menu.closeOverlay(false)}
        >
          <ShellIcon name={icon} />
          <span>{label}</span>
          <span className="ew-menu-count">{n ?? "—"}</span>
        </Link>
      </li>
    );
  }
  const filterForm = (
    <form
      className="ew-filter-form"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setFilterOpen(false);
        change(
          saved
            ? { estimate_q: String(form.get("q") ?? "") }
            : {
                q: String(form.get("q") ?? ""),
                owner: String(form.get("owner") ?? "all"),
                sort: String(form.get("sort") ?? "updated"),
                view: String(form.get("view") ?? "all"),
              },
        );
      }}
    >
      <label>
        {saved ? "Search saved estimates" : "Search workload"}
        <input
          name="q"
          type="search"
          maxLength={100}
          defaultValue={query.get(saved ? "estimate_q" : "q") ?? ""}
        />
      </label>
      {!saved && (
        <>
          <label>
            Estimating owner
            <select name="owner" defaultValue={owner}>
              <option value="all">All permitted owners</option>
              <option value="mine">My estimating work</option>
            </select>
          </label>
          <label>
            Scope readiness
            <select name="view" defaultValue={view}>
              <option value="all">All readiness states</option>
              {readinessOrder.map((v) => (
                <option value={v} key={v}>
                  {workloadLabels[v]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sort workload
            <select name="sort" defaultValue={sort}>
              <option value="updated">Recently changed</option>
              <option value="customer">Customer</option>
            </select>
          </label>
        </>
      )}
      <Button type="submit" variant="primary">
        Apply filters
      </Button>
      <Button
        onClick={() => {
          setFilterOpen(false);
          change(
            saved
              ? { estimate_q: "" }
              : { q: "", owner: "", view: "", sort: "" },
          );
        }}
      >
        Clear filters
      </Button>
      <Button
        onClick={() => {
          setFilterOpen(false);
          current.reload();
        }}
      >
        Refresh
      </Button>
      {saved && savedData?.can_create && fresh && (
        <ButtonLink variant="primary" href="/estimating/new">
          New estimate
        </ButtonLink>
      )}
      {!saved && (
        <Button
          onClick={() => {
            setSelectMode(!selectMode);
            setFilterOpen(false);
          }}
        >
          {" "}
          {selectMode ? "Finish selecting" : "Select opportunities"}{" "}
        </Button>
      )}
    </form>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-estimating-workload"
      name="Intake & workload"
      menuId="estimating-views"
      contentId="estimating-content"
      state={menu}
      message={readNote}
      phoneHeader={{
        title: viewName,
        count,
        filter: {
          open: () => setFilterOpen(true),
          applied: !!(
            query.get(saved ? "estimate_q" : "q") ||
            owner === "mine" ||
            view !== "all" ||
            sort !== "updated"
          ),
        },
      }}
      menu={
        <>
          <nav aria-label="Estimating views">
            <ul>
              {menuLink(
                "All workload",
                { tab: "", view: "all", owner: "all" },
                ownerCounts?.all,
                !saved && view === "all" && owner === "all",
                "work",
              )}
              {menuLink(
                "My estimating work",
                { tab: "", view: "all", owner: "mine" },
                ownerCounts?.mine,
                !saved && view === "all" && owner === "mine",
                "person",
              )}
            </ul>
            <h3>Scope readiness</h3>
            <ul>
              {readinessOrder.map((v) => (
                <Fragment key={v}>
                  {menuLink(
                    workloadLabels[v],
                    { tab: "", view: v },
                    counts?.[v],
                    !saved && view === v,
                    v === "ready"
                      ? "check"
                      : v === "clarification"
                        ? "info"
                        : v === "legacy"
                          ? "documents"
                          : "clock",
                  )}
                </Fragment>
              ))}
            </ul>
            <h3>Estimates</h3>
            <ul>
              {menuLink(
                "Saved estimates",
                { tab: "estimates" },
                savedData && !estimates.loading
                  ? savedData.items.length
                  : undefined,
                saved,
                "documents",
              )}
            </ul>
          </nav>
          <IntakeRules />
        </>
      }
    >
      <div className="ew-register">
        <div className="ew-toolbar">
          {saved ? (
            <>
              {savedData?.can_create && (
                <ButtonLink variant="primary" href="/estimating/new">
                  <ShellIcon name="plus" />
                  New estimate
                </ButtonLink>
              )}
            </>
          ) : (
            <form
              className="ew-search"
              onSubmit={(e) => {
                e.preventDefault();
                change({
                  q: String(new FormData(e.currentTarget).get("q") ?? ""),
                });
              }}
            >
              <ShellIcon name="search" />
              <input
                aria-label="Search workload"
                name="q"
                type="search"
                placeholder="Search customer, opportunity or brief"
                maxLength={100}
                defaultValue={query.get("q") ?? ""}
              />
              <button type="submit" className="sr-only">
                Search workload
              </button>
            </form>
          )}
          {!saved && (
            <WorklistChoice
              label="Sort workload"
              prefix="Sort: "
              value={sort}
              options={[
                { id: "updated", label: "Recently changed" },
                { id: "customer", label: "Customer" },
              ]}
              onChange={(value) => change({ sort: value })}
            />
          )}
          <span className="ew-count" role="status">
            {readNote}
            {fresh && !saved && data?.observed_at && (
              <span className="ew-time">
                {" "}
                · updated {readTime(data.observed_at)} AEST
              </span>
            )}
          </span>
          <Button
            className="ew-icon-button"
            aria-label="Refresh register"
            disabled={current.loading}
            onClick={current.reload}
          >
            <DiscoveryRegisterIcon name="refresh" />
          </Button>
          <WorklistMenu label="Workload actions" icon="more">
            <Button data-menu-close onClick={() => setFilterOpen(true)}>
              Search and filters
            </Button>
            {!saved && (
              <Button
                data-menu-close
                onClick={() => setSelectMode(!selectMode)}
              >
                {selectMode ? "Finish selecting" : "Select opportunities"}
              </Button>
            )}
          </WorklistMenu>
        </div>
        {!saved && owner === "mine" && (
          <p className="ew-basis">
            Estimating owner: me · readiness counts use my estimating window.
          </p>
        )}
        {!!notice && (
          <p role="status" className="ew-basis">
            {notice}
          </p>
        )}
        <ErrorNotice error={exportError} />
        {!!current.error ? (
          <section className="ew-notice" role="alert">
            <h2>
              {isDenied(current.error)
                ? "Estimating is outside your access"
                : saved
                  ? "Saved estimates could not be loaded"
                  : "Workload could not be loaded"}
            </h2>
            <ErrorNotice error={current.error} focusOnError={false} />
            <p>
              No earlier rows or counts are shown as current.{" "}
              {isDenied(current.error)
                ? "Choose a permitted identity or ask your administrator about access."
                : "Retry when the connection is available."}
            </p>
            <Button onClick={current.reload}>Try loading again</Button>
          </section>
        ) : activeData ? (
          <>
            {!saved && selected.length > 0 && (
              <div className="ew-selection-bar">
                <Button onClick={() => setSelectMode(true)}>
                  {selected.length} selected
                </Button>
                <Button
                  onClick={() => {
                    setSelection([]);
                    setSequence(false);
                  }}
                >
                  Clear selection
                </Button>
              </div>
            )}
            <div
              className="ew-results"
              data-stale={current.loading || undefined}
              aria-busy={current.loading}
            >
              {saved ? (
                <SavedGrid data={savedData!} fresh={fresh} />
              ) : (
                <WorkloadGrid
                  items={items}
                  fresh={fresh}
                  selection={selection}
                  selectMode={selectMode}
                  toggle={toggle}
                  selectAll={() =>
                    setSelection(
                      selected.length === items.length
                        ? []
                        : items.map((i) => i.opportunity.id),
                    )
                  }
                  open={openSnapshot}
                  sort={sort}
                  changeSort={(value) => change({ sort: value })}
                />
              )}
              {(saved ? savedData!.items.length : items.length) === 0 && (
                <section className="ew-notice">
                  <h2>
                    {saved
                      ? "No saved estimates"
                      : query.get("q") || owner === "mine" || view !== "all"
                        ? "No workload matches these filters"
                        : "No permitted estimating workload"}
                  </h2>
                  <p>
                    {saved
                      ? "Unpriced scope is not zero."
                      : "An opportunity appearing here is a candidate brief, not an accepted estimating request."}
                  </p>
                  <Button
                    onClick={() =>
                      change(
                        saved
                          ? { estimate_q: "" }
                          : {
                              q: "",
                              view: "",
                              owner: "",
                              sort: "",
                            },
                      )
                    }
                  >
                    Clear filters
                  </Button>
                  <Link href="/sales/opportunities">
                    Open Sales opportunities
                  </Link>
                </section>
              )}
            </div>
            <p className="ew-window">
              {saved
                ? "Up to 100 permitted estimates, most recently saved first. Each row opens the exact saved revision. Saved sell is in AUD, excluding tax; tax is not calculated. An estimate without cost lines is Not estimated, not zero."
                : `Up to 100 search- and owner-matched opportunities are checked in ${sort === "customer" ? "Customer order" : "most recently changed order"}. Readiness counts apply before the readiness view within that window. All workload and My estimating work each count their own owner window. Search to find other work. Closed Sales records appear only where an estimating workspace exists.`}
            </p>
            {!saved && (
              <p className="ew-phone-rules">
                Intake acceptance, estimator allocation, return and priority
                rules: Not configured. Required response: Unknown.
              </p>
            )}
          </>
        ) : (
          <p className="ew-loading" role="status">
            {readNote}
          </p>
        )}
        {!saved && selected.length > 0 && !snapshot && (
          <aside className="ew-selection" aria-label="Selected opportunities">
            <header>
              <h2>{selected.length} opportunities selected</h2>
            </header>
            <div className="ew-selection-body">
              {selected.map((i) => (
                <div className="ew-selected-card" key={i.opportunity.id}>
                  <strong>
                    {i.opportunity.display_number} v{i.opportunity.version} ·{" "}
                    {workloadLabels[i.state]}
                  </strong>
                  <small>
                    {i.opportunity.title} ·{" "}
                    {i.estimating_owner ?? "Not allocated"}
                  </small>
                </div>
              ))}
              <p className="ew-rule">
                Nothing is accepted or assigned here: intake acceptance and
                estimator allocation are not configured. These actions only open
                or list the selected opportunities.
              </p>
              <h3>For the selection</h3>
              <Button
                disabled={!fresh}
                onClick={(e) => {
                  setSequence(true);
                  openSnapshot(selected[0].opportunity.id, e.currentTarget);
                }}
              >
                Open in sequence
              </Button>
              <small>
                Most recently changed first, regardless of register sort.
              </small>
              <Button
                disabled={!fresh || exporting}
                onClick={() => void exportList()}
              >
                Export list (CSV)
              </Button>
              <small>
                Reference, title, customer, readiness, both owners and last
                changed date. Current access is checked again.
              </small>
            </div>
            <footer>
              <Button onClick={() => setSelection([])}>Cancel</Button>
              <Button
                variant="primary"
                disabled={!fresh}
                onClick={(e) => {
                  setSequence(true);
                  openSnapshot(selected[0].opportunity.id, e.currentTarget);
                }}
              >
                Open in sequence
              </Button>
            </footer>
          </aside>
        )}
        {!saved && snapshot && !workload.error && (
          <WorkloadSnapshot
            item={snapshot}
            stale={workload.loading}
            onClose={closeSnapshot}
            previous={
              index > 0
                ? () => openSnapshot(navigation[index - 1].opportunity.id)
                : undefined
            }
            next={
              index >= 0 && index < navigation.length - 1
                ? () => openSnapshot(navigation[index + 1].opportunity.id)
                : undefined
            }
          />
        )}
        {!saved && params.has("record") && !snapshot && fresh && (
          <p className="ew-basis" role="status">
            The requested opportunity is outside this permitted window. Refine
            the search or{" "}
            <Button onClick={closeSnapshot}>close the snapshot</Button>.
          </p>
        )}
        {filterOpen && (
          <WorklistPanel
            title={saved ? "Saved estimate filters" : "Workload filters"}
            onClose={() => setFilterOpen(false)}
          >
            {filterForm}
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
function WorkloadGrid({
  items,
  fresh,
  selection,
  selectMode,
  toggle,
  selectAll,
  open,
  sort,
  changeSort,
}: {
  items: WorkloadItem[];
  fresh: boolean;
  selection: string[];
  selectMode: boolean;
  toggle: (id: string) => void;
  selectAll: () => void;
  open: (id: string, source?: HTMLElement) => void;
  sort: string;
  changeSort: (value: string) => void;
}) {
  const all = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (all.current)
      all.current.indeterminate =
        selection.length > 0 && selection.length < items.length;
  }, [selection.length, items.length]);
  return (
    <>
      <div className="ew-desktop-grid">
        <RegisterTable
          stale={!fresh}
          caption="Permitted estimating workload. Open a title to inspect; check rows for sequence or export."
        >
          <colgroup>
            {[44, 182, 262, 176, 156, 96, 150, 210, 210, 140, 90, 44].map(
              (n, i) => (
                <col
                  key={i}
                  className={i === 2 ? "ew-title-col" : undefined}
                  style={{ width: n }}
                />
              ),
            )}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <input
                  ref={all}
                  type="checkbox"
                  aria-label="Select all visible opportunities"
                  checked={
                    items.length > 0 && selection.length === items.length
                  }
                  disabled={!fresh || !items.length}
                  onChange={selectAll}
                />
              </th>
              <th scope="col">Opportunity</th>
              <th scope="col">Title</th>
              <RegisterSortHeader
                label="Customer"
                direction={sort === "customer" ? "ascending" : undefined}
                onSort={() => changeSort("customer")}
              />
              <th scope="col">Readiness</th>
              <RegisterSortHeader
                label="Changed"
                direction={sort === "updated" ? "descending" : undefined}
                onSort={() => changeSort("updated")}
              />
              {[
                "Estimating owner",
                "Discovery",
                "Site",
                "Sales owner",
                "Sales",
              ].map((s) => (
                <th scope="col" key={s}>
                  {s}
                </th>
              ))}
              <th scope="col">
                <WorklistMenu label="Workload columns" icon="settings">
                  <p>
                    Opportunity, Title, Customer, Readiness and Changed lead the
                    register. Scroll horizontally for both owners, Discovery,
                    Site and Sales. All columns are retained.
                  </p>
                </WorklistMenu>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr
                key={i.opportunity.id}
                data-selected={
                  selection.includes(i.opportunity.id) || undefined
                }
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${i.opportunity.display_number}`}
                    checked={selection.includes(i.opportunity.id)}
                    disabled={!fresh}
                    onChange={() => toggle(i.opportunity.id)}
                  />
                </td>
                <td>
                  <strong>{i.opportunity.display_number}</strong>{" "}
                  <small>v{i.opportunity.version}</small>
                </td>
                <td>
                  <button
                    className="ew-row-title"
                    disabled={!fresh}
                    onClick={(e) => open(i.opportunity.id, e.currentTarget)}
                  >
                    {i.opportunity.title}
                  </button>
                </td>
                <td title={i.customer}>{i.customer}</td>
                <td>
                  <WorkloadReadiness item={i} />
                </td>
                <td>{shortDate(i.updated_at)}</td>
                <td>{i.estimating_owner ?? "Not allocated"}</td>
                <td>{discoverySummary(i)}</td>
                <td>{i.site ?? "Site unknown or not required"}</td>
                <td>{i.sales_owner}</td>
                <td>{i.opportunity.close_outcome}</td>
                <td>
                  <Button
                    variant="quiet"
                    className="ew-icon-button"
                    aria-label={`Open snapshot for ${i.opportunity.display_number}`}
                    disabled={!fresh}
                    onClick={(e) => open(i.opportunity.id, e.currentTarget)}
                  >
                    <ShellIcon name="more" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </RegisterTable>
      </div>
      <div className="ew-phone-list">
        {items.map((i) => (
          <div className="ew-phone-row" key={i.opportunity.id}>
            {selectMode && (
              <input
                type="checkbox"
                aria-label={`Select ${i.opportunity.display_number}`}
                checked={selection.includes(i.opportunity.id)}
                disabled={!fresh}
                onChange={() => toggle(i.opportunity.id)}
              />
            )}
            <button
              disabled={!fresh}
              className="ew-phone-open"
              onClick={(e) => open(i.opportunity.id, e.currentTarget)}
            >
              <span className="ew-phone-body">
                <span className="ew-phone-title">
                  <strong>{i.opportunity.title}</strong>
                  <time>{shortDate(i.updated_at)}</time>
                </span>
                <span className="ew-phone-reference">
                  <span>
                    {i.opportunity.display_number} v{i.opportunity.version}
                  </span>
                  <WorkloadReadiness item={i} />
                </span>
                <span className="ew-phone-owner">
                  <ShellIcon name="customers" />
                  <span>{i.customer}</span>
                  <span>{i.estimating_owner ?? "Not allocated"}</span>
                </span>
              </span>
              <ShellIcon name="chevron-right" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
function SavedGrid({ data, fresh }: { data: SavedEstimates; fresh: boolean }) {
  return (
    <>
      <div className="ew-desktop-grid ew-saved">
        <RegisterTable
          stale={!fresh}
          caption="Saved estimates, most recently saved first. Links open the exact saved revision."
        >
          <colgroup>
            {[44, 150, 250, 192, 100, 180, 44].map((n, i) => (
              <col key={i} style={{ width: n }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Draft</span>
              </th>
              <th scope="col">Estimate</th>
              <th scope="col">Title</th>
              <th scope="col">Customer</th>
              <th scope="col" aria-sort="descending">
                Saved
              </th>
              <th scope="col" className="ew-amount">
                Saved sell, AUD excl. tax
              </th>
              <th scope="col">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((e) => (
              <tr key={e.id}>
                <td>
                  <ShellIcon name="documents" />
                </td>
                <td>
                  <strong>{e.display_number}</strong>{" "}
                  <small>v{e.version}</small>
                </td>
                <td>
                  {fresh ? (
                    <Link href={savedEstimateHref(e)}>{e.title}</Link>
                  ) : (
                    e.title
                  )}
                </td>
                <td>{e.customer}</td>
                <td>{shortDate(e.updated_at)}</td>
                <td className="ew-amount">
                  {e.sell_total == null
                    ? "Not estimated"
                    : new Intl.NumberFormat("en-AU", {
                        style: "currency",
                        currency: "AUD",
                        maximumFractionDigits: 2,
                      }).format(Number(e.sell_total))}
                </td>
                <td>
                  {fresh && (
                    <Link
                      aria-label={`Open ${e.display_number} version ${e.version}`}
                      href={savedEstimateHref(e)}
                    >
                      <ShellIcon name="chevron-right" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </RegisterTable>
      </div>
      <div className="ew-phone-list">
        {data.items.map((e) => (
          <div key={e.id} className="ew-phone-saved">
            <strong>
              {fresh ? (
                <Link href={savedEstimateHref(e)}>{e.title}</Link>
              ) : (
                e.title
              )}
            </strong>
            <span>
              {e.display_number} · v{e.version} · {e.state}
            </span>
            <span>
              {e.customer} · {shortDate(e.updated_at)}
            </span>
            <span>
              Saved sell, AUD excl. tax: {e.sell_total ?? "Not estimated"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
