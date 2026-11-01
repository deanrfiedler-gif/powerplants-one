"use client";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import { useCrmResource, denied } from "./crm-state";
import { api } from "./business-ui";
import { Button } from "./ui/button";
import {
  RegisterTable,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { SalesBriefSnapshot } from "./sales-briefs-snapshot";
import { BriefIcon, BriefState } from "./sales-briefs-ui";
import {
  briefHref,
  receivingStateLabel,
  receivingViews,
  type ReceivingBrief,
  type ReceivingQueue,
} from "../sales/receiving-queue-model";
import { formatDateTime } from "../shell/date-format";
import "./sales-briefs.css";
const endpoint = "sales/handovers/receiving";
const date = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
const updatedDate = (value: string, observed: string) => {
  // Brisbane day boundaries, tied to the read's as-at time rather than a fixture clock.
  const day = (v: string) =>
    Math.floor((Date.parse(v) + 10 * 3600000) / 86400000);
  const ago = day(observed) - day(value);
  return ago === 0 ? "Today" : ago === 1 ? "Yesterday" : date(value);
};
const time = (value: string) =>
  new Intl.DateTimeFormat("en-AU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Australia/Brisbane",
  }).format(new Date(value));
const columns = [
  ["Opportunity", 180],
  ["Title", 214],
  ["Customer", 150],
  ["State", 224],
  ["Updated", 100],
  ["Requested", 120],
  ["Receiving owner", 150],
  ["Sales owner", 140],
] as const;
export function SalesBriefsRegister() {
  const query = useSearchParams(),
    identity = useIdentity();
  return (
    <Queue
      key={`${identity.workspace_id}:${identity.actor_id}:${query}`}
      query={new URLSearchParams(query.toString())}
    />
  );
}
function Queue({ query }: { query: URLSearchParams }) {
  const router = useRouter(),
    [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filterOpen, setFilterOpen] = useState(false),
    [search, setSearch] = useState(query.get("q") ?? "");
  const [selectMode, setSelectMode] = useState(false),
    [readTick, setReadTick] = useState(0),
    [notice, setNotice] = useState("");
  const request = new URLSearchParams(query);
  request.set("read", String(readTick));
  const resource = useCrmResource<ReceivingQueue>(
    `${endpoint}?${request}`,
    true,
    false,
    true,
  );
  const data = resource.error ? null : resource.data;
  const view =
    receivingViews.find((v) => v.id === query.get("view")) ?? receivingViews[0];
  function href(values: Record<string, string>, paging = false) {
    const next = new URLSearchParams(query);
    if (!paging) {
      next.delete("offset");
      next.delete("basis");
    }
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/estimating/intake${next.size ? `?${next}` : ""}`;
  }
  const change = (values: Record<string, string>, paging = false) =>
    router.push(href(values, paging), { scroll: false });
  const refresh = () => {
    if (query.has("offset") || query.has("basis"))
      change({ offset: "", basis: "" });
    else setReadTick((n) => n + 1);
  };
  const count = data
    ? `${data.completeness === "Partial" ? "At least " : ""}${data.total} brief${data.total === 1 ? "" : "s"}`
    : resource.loading
      ? "Loading…"
      : "—";
  const filters = (
    <>
      <WorklistChoice
        label="Customer"
        prefix="Customer: "
        value={query.get("customer") ?? ""}
        options={[
          { id: "", label: "All customers" },
          ...(data?.customers ?? []).map((x) => ({ id: x.id, label: x.name })),
        ]}
        onChange={(customer) => change({ customer })}
      />
      <WorklistChoice
        label="Receiving owner"
        prefix="Receiving owner: "
        value={query.get("owner") ?? ""}
        options={[
          { id: "", label: "Anyone" },
          ...(data?.owners ?? []).map((x) => ({ id: x.id, label: x.name })),
        ]}
        onChange={(owner) => change({ owner })}
      />
    </>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-sales-briefs"
      attributes={{ "data-ppo-workspace": "shared" }}
      name="Sales briefs"
      menuId="sales-briefs-menu"
      contentId="sales-briefs-content"
      state={menu}
      message={
        resource.loading
          ? "Loading permitted Sales briefs"
          : resource.error
            ? "Sales briefs read unavailable"
            : count
      }
      phoneHeader={{
        title: view.id === "All" ? "Sales briefs" : view.label,
        count: data
          ? `${data.completeness === "Partial" ? "≥" : ""}${data.total}`
          : undefined,
        pageAction: {
          icon: "search",
          search: true,
          label: "Search briefs",
          onSelect: () => setFilterOpen(true),
        },
        filter: {
          open: () => setFilterOpen(true),
          applied: !!(
            query.get("q") ||
            query.get("customer") ||
            query.get("owner")
          ),
        },
      }}
      menu={
        <>
          <h2 className="mw-menu-title">Sales briefs</h2>
          {["Views", "State", "Attention"].map((group) => (
            <Fragment key={group}>
              {group !== "Views" && <h3>{group}</h3>}
              <ul>
                {receivingViews
                  .filter((v) => v.group === group)
                  .map((v) => (
                    <li key={v.id}>
                      <Link
                        href={href({ view: v.id === "All" ? "" : v.id })}
                        aria-current={view.id === v.id ? "page" : undefined}
                        onClick={() => menu.closeOverlay(false)}
                      >
                        <BriefIcon
                          name={
                            v.id === "SourceChanged"
                              ? "source"
                              : v.id === "Awaiting"
                                ? "clock"
                                : v.id === "Assigned"
                                  ? "owner"
                                  : "scope"
                          }
                        />
                        <span>{v.label}</span>
                        {data && v.count && (
                          <span className="mw-badge">
                            {data.completeness === "Partial" ? "≥" : ""}
                            {data.counts[v.id]}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
              </ul>
            </Fragment>
          ))}
        </>
      }
    >
      <div className="sb-register">
        <h1 className="sb-sr">Sales briefs</h1>
        <div className="sb-toolbar">
          <div className="sb-filters">{filters}</div>
          <span className="sb-count">
            {count}
            {data && <small> · updated {time(data.observed_at)} AEST</small>}
          </span>
          <Button
            variant="secondary"
            className="sb-icon-button"
            aria-label="Refresh briefs"
            onClick={refresh}
          >
            <BriefIcon name="refresh" />
          </Button>
          <WorklistMenu
            label="Brief list actions"
            icon="more"
            text={<span className="sb-sr">More</span>}
          >
            <button
              type="button"
              data-menu-close
              onClick={() => setFilterOpen(true)}
            >
              Search and filter
            </button>
            <button
              type="button"
              data-menu-close
              onClick={() => setSelectMode(!selectMode)}
            >
              {selectMode ? "Finish selection" : "Select briefs"}
            </button>
            <Link href="/sales/handoffs/estimating">Sales preparation</Link>
            <Link href="/estimating">Intake &amp; workload</Link>
          </WorklistMenu>
        </div>
        {notice && (
          <p className="sb-notice" role="status">
            {notice}
          </p>
        )}
        {resource.loading && (
          <div className="sb-notice" role="status">
            Loading permitted Sales briefs…
          </div>
        )}
        {!!resource.error && (
          <div className="sb-notice" role="alert">
            <h2>
              {denied(resource.error)
                ? "Sales briefs are outside your access"
                : (resource.error as { status: number }).status === 409
                  ? "The queue changed"
                  : "Sales briefs could not be loaded"}
            </h2>
            <p>
              Earlier rows, counts and selections have been cleared. Refresh to
              review the current permitted queue.
            </p>
            <Button onClick={refresh}>Retry loading briefs</Button>
          </div>
        )}
        {data && (
          <Rows
            key={data.basis}
            data={data}
            phone={menu.phone === true}
            selectMode={selectMode}
            setSelectMode={setSelectMode}
            onPage={(offset) =>
              change(
                {
                  offset: offset ? String(offset) : "",
                  basis: offset ? data.basis : "",
                },
                true,
              )
            }
            refresh={refresh}
            onExportError={(message) => {
              setNotice(message);
              refresh();
            }}
          />
        )}
      </div>
      {filterOpen && (
        <WorklistPanel
          title="Search and filter Sales briefs"
          onClose={() => setFilterOpen(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setFilterOpen(false);
              change({ q: search });
            }}
          >
            <label>
              Search briefs
              <input
                aria-label="Search briefs"
                maxLength={200}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Opportunity, title, customer or owner"
              />
            </label>
            <p className="sb-small">
              Search and filters apply to every permitted submitted brief before
              paging and view counts.
            </p>
            <div className="sb-filter-choices">{filters}</div>
            <Button type="submit">Apply search</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setFilterOpen(false);
                change({ q: "", customer: "", owner: "" });
              }}
            >
              Reset filters
            </Button>
          </form>
          <Button
            onClick={() => {
              setSelectMode(!selectMode);
              setFilterOpen(false);
            }}
          >
            {selectMode ? "Finish selection" : "Select briefs"}
          </Button>
          <Button
            onClick={() => {
              setFilterOpen(false);
              refresh();
            }}
          >
            Refresh briefs
          </Button>
          <p>
            <Link href="/sales/handoffs/estimating">Sales preparation</Link> ·{" "}
            <Link href="/estimating">Intake &amp; workload</Link>
          </p>
        </WorklistPanel>
      )}
    </SecondaryMenuFrame>
  );
}
function Rows({
  data,
  phone,
  selectMode,
  setSelectMode,
  onPage,
  refresh,
  onExportError,
}: {
  data: ReceivingQueue;
  phone: boolean;
  selectMode: boolean;
  setSelectMode: (value: boolean) => void;
  onPage: (offset: number) => void;
  refresh: () => void;
  onExportError: (message: string) => void;
}) {
  const [selected, setSelected] = useState<string[]>([]),
    [showPanel, setShowPanel] = useState(true),
    [phonePanel, setPhonePanel] = useState(false);
  const [snapshot, setSnapshot] = useState<ReceivingBrief | null>(null),
    [sequence, setSequence] = useState(false),
    [exporting, setExporting] = useState(false),
    [hidden, setHidden] = useState<string[]>([]);
  const live = useRef(true),
    touchStart = useRef<number | null>(null),
    list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const rows = data.items,
    chosen = rows.filter((r) => selected.includes(r.id));
  const sequenceRows = chosen.toSorted(
    (a, b) =>
      a.updated_at.localeCompare(b.updated_at) || a.id.localeCompare(b.id),
  );
  const flip = (id: string) => {
    setSelected((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
    setShowPanel(true);
  };
  const open = (row: ReceivingBrief) => {
    setSequence(false);
    setSnapshot(row);
  };
  const beginSequence = () => {
    setPhonePanel(false);
    setSequence(true);
    setSnapshot(sequenceRows[0]);
  };
  const clear = () => {
    setSelected([]);
    setPhonePanel(false);
  };
  async function exportList() {
    setExporting(true);
    try {
      const result = await api<{ csv: string; count: number }>(
        `${endpoint}?selection=${encodeURIComponent(chosen.map((r) => `${r.id}:${r.token}`).join(","))}`,
      );
      if (!live.current) return;
      const url = URL.createObjectURL(
          new Blob(["\uFEFF", result.csv], { type: "text/csv;charset=utf-8" }),
        ),
        a = document.createElement("a");
      a.href = url;
      a.download = "sales-briefs-selected.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (live.current)
        onExportError(
          "The selected list could not be exported. Review the refreshed queue and select current briefs again.",
        );
    } finally {
      if (live.current) setExporting(false);
    }
  }
  const selectionBody = (
    <>
      <div className="sb-selection-list">
        {chosen.map((r) => (
          <article key={r.id}>
            <strong>{r.opportunity.title}</strong>
            <small>
              {r.opportunity.reference} r{r.revision} ·{" "}
              {receivingStateLabel(r.state)}
            </small>
          </article>
        ))}
      </div>
      <p className="sb-rule">
        Receiving decisions are made one brief at a time, on its exact submitted
        revision. These actions open or list the briefs; they accept, return or
        assign nothing.
      </p>
      <h3>For the selection</h3>
      <Button variant="quiet" onClick={beginSequence}>
        <BriefIcon name="arrow" />
        Open in sequence
      </Button>
      <p className="sb-small">
        Each selected brief in turn, oldest update first.
      </p>
      <Button
        variant="quiet"
        busy={exporting}
        onClick={() => void exportList()}
      >
        <BriefIcon name="files" />
        Export list (CSV)
      </Button>
      <p className="sb-small">
        Selected rows on this page only. Current access and submitted versions
        are checked again.
      </p>
    </>
  );
  const cell = (r: ReceivingBrief, label: string) => {
    if (label === "Opportunity")
      return (
        <span className="sb-reference">
          <strong>{r.opportunity.reference}</strong>
          <small>r{r.revision}</small>
        </span>
      );
    if (label === "Title")
      return (
        <button className="sb-title" onClick={() => open(r)}>
          {r.opportunity.title}
        </button>
      );
    if (label === "Customer") return r.customer.name;
    if (label === "State") return <BriefState row={r} />;
    if (label === "Updated")
      return (
        <time dateTime={r.updated_at} title={formatDateTime(r.updated_at)}>
          {updatedDate(r.updated_at, data.observed_at)}
        </time>
      );
    if (label === "Requested")
      return r.requested_date ? date(r.requested_date) : "Date needed";
    if (label === "Receiving owner")
      return r.receiving_owner?.name ?? "Not recorded";
    return r.sales_owner.name;
  };
  return (
    <div
      className="sb-results"
      data-paging={data.has_more || data.offset > 0 || undefined}
      style={
        {
          "--sb-grid-width": `${88 + columns.filter(([name]) => !hidden.includes(name)).reduce((sum, [, width]) => sum + width, 0)}px`,
        } as React.CSSProperties
      }
    >
      {data.completeness === "Partial" && (
        <p className="sb-notice" role="status">
          Partial read: some permitted source reads are unavailable. Counts are
          lower bounds, not complete totals. Refresh to retry.
        </p>
      )}
      {!!selected.length && (
        <div className="sb-selection-toolbar">
          <Button variant="secondary" onClick={beginSequence}>
            <BriefIcon name="arrow" />
            Open in sequence
          </Button>
          <Button
            variant="secondary"
            busy={exporting}
            onClick={() => void exportList()}
          >
            Export list
          </Button>
          <span>{selected.length} selected on this page</span>
          <Button variant="quiet" onClick={clear}>
            Clear selection
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              phone ? setPhonePanel(true) : setShowPanel(!showPanel)
            }
          >
            {phone
              ? "Review selection"
              : showPanel
                ? "Hide panel"
                : "Show panel"}
          </Button>
        </div>
      )}
      <div className="sb-desktop-grid">
        <RegisterTable caption="Sales briefs at their latest submitted revision. Open a row to review its snapshot. Checkboxes select records without receiving decisions.">
          <colgroup>
            <col style={{ width: 44 }} />
            {columns
              .filter(([name]) => !hidden.includes(name))
              .map(([name, width]) => (
                <col key={name} style={{ width }} />
              ))}
            <col style={{ width: 44 }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col">
                <input
                  type="checkbox"
                  aria-label="Select all briefs on this page"
                  checked={!!rows.length && selected.length === rows.length}
                  ref={(node) => {
                    if (node)
                      node.indeterminate =
                        selected.length > 0 && selected.length < rows.length;
                  }}
                  disabled={!rows.length}
                  onChange={() =>
                    setSelected(
                      selected.length === rows.length
                        ? []
                        : rows.map((r) => r.id),
                    )
                  }
                />
              </th>
              {columns
                .filter(([name]) => !hidden.includes(name))
                .map(([name]) => (
                  <th
                    key={name}
                    scope="col"
                    aria-sort={name === "Updated" ? "descending" : undefined}
                  >
                    {name}
                    {name === "Updated" && <BriefIcon name="next" />}
                  </th>
                ))}
              <th scope="col">
                <WorklistMenu
                  label="Brief columns"
                  text={<BriefIcon name="settings" />}
                >
                  {columns.map(([name]) => (
                    <button
                      type="button"
                      key={name}
                      role="menuitemcheckbox"
                      aria-checked={!hidden.includes(name)}
                      disabled={name === "Opportunity" || name === "Title"}
                      onClick={() =>
                        setHidden((old) =>
                          old.includes(name)
                            ? old.filter((x) => x !== name)
                            : [...old, name],
                        )
                      }
                    >
                      {name}
                    </button>
                  ))}
                </WorklistMenu>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                data-selected={selected.includes(r.id) || undefined}
                onDoubleClick={() => open(r)}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={`Select ${r.opportunity.reference} r${r.revision}`}
                    checked={selected.includes(r.id)}
                    onChange={() => flip(r.id)}
                  />
                </td>
                {columns
                  .filter(([name]) => !hidden.includes(name))
                  .map(([name]) => (
                    <td
                      key={name}
                      title={
                        name === "Title"
                          ? r.opportunity.title
                          : name === "Customer"
                            ? r.customer.name
                            : undefined
                      }
                      onClick={name !== "Title" ? () => open(r) : undefined}
                    >
                      {cell(r, name)}
                    </td>
                  ))}
                <td>
                  <WorklistMenu
                    label={`Actions for ${r.opportunity.reference}`}
                    text={<BriefIcon name="more" />}
                  >
                    <button
                      type="button"
                      data-menu-close
                      onClick={() => open(r)}
                    >
                      Open snapshot
                    </button>
                    <Link href={briefHref(r)}>Open brief</Link>
                    <Link href={`/sales/opportunities/${r.opportunity.id}`}>
                      Open opportunity
                    </Link>
                  </WorklistMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </RegisterTable>
      </div>
      <div
        className="sb-phone-list"
        ref={list}
        onTouchStart={(e) => {
          touchStart.current =
            list.current?.scrollTop === 0 ? e.touches[0].clientY : null;
        }}
        onTouchEnd={(e) => {
          if (
            touchStart.current !== null &&
            e.changedTouches[0].clientY - touchStart.current > 90
          )
            refresh();
          touchStart.current = null;
        }}
      >
        {rows.map((r) => (
          <PhoneRow
            key={r.id}
            row={r}
            observed={data.observed_at}
            selecting={selectMode || !!selected.length}
            selected={selected.includes(r.id)}
            onSelect={() => flip(r.id)}
            onLongPress={() => {
              setSelectMode(true);
              if (!selected.includes(r.id)) flip(r.id);
            }}
            onOpen={() => open(r)}
          />
        ))}
      </div>
      {!rows.length && (
        <RegisterEmpty
          title={
            data.completeness === "Partial"
              ? "No briefs available in this partial read"
              : data.permitted_total === 0
                ? "No permitted submitted briefs"
                : "No briefs match this view"
          }
        >
          <p>
            {data.completeness === "Partial"
              ? "Some source reads are unavailable. Refresh before concluding that no briefs match."
              : data.permitted_total === 0
                ? "Submitted Sales work appears here after source and receiver permissions are checked."
                : "Change the view, customer, receiving owner or search."}
          </p>
        </RegisterEmpty>
      )}
      <RegisterFooter>
        <span>
          {data.total ? data.offset + 1 : 0}–{data.offset + rows.length} of{" "}
          {data.completeness === "Partial" ? "at least " : ""}
          {data.total} matching briefs · {data.completeness}
        </span>
        <Button
          variant="secondary"
          disabled={!data.offset}
          onClick={() => onPage(Math.max(0, data.offset - data.limit))}
        >
          Previous page
        </Button>
        <Button
          variant="secondary"
          disabled={!data.has_more}
          onClick={() => onPage(data.offset + data.limit)}
        >
          Next page
        </Button>
      </RegisterFooter>
      {!!chosen.length && showPanel && !phone && !snapshot && (
        <aside className="sb-selection-panel" aria-label="Selected briefs">
          <header>
            <h2>{chosen.length} briefs selected</h2>
          </header>
          <div>{selectionBody}</div>
          <footer>
            <Button variant="secondary" onClick={clear}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={beginSequence}>
              <BriefIcon name="arrow" />
              Open in sequence
            </Button>
          </footer>
        </aside>
      )}
      {phonePanel && !!chosen.length && (
        <WorklistPanel
          title={`${chosen.length} briefs selected`}
          onClose={() => setPhonePanel(false)}
        >
          {selectionBody}
          <Button onClick={clear}>Clear selection</Button>
        </WorklistPanel>
      )}
      {snapshot && (
        <SalesBriefSnapshot
          key={snapshot.id}
          row={snapshot}
          phone={phone}
          rows={sequence ? sequenceRows : rows}
          onSelect={setSnapshot}
          onClose={() => setSnapshot(null)}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}
function PhoneRow({
  row,
  observed,
  selecting,
  selected,
  onSelect,
  onOpen,
  onLongPress,
}: {
  row: ReceivingBrief;
  observed: string;
  selecting: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: () => void;
  onLongPress: () => void;
}) {
  const identity = useIdentity();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    held = useRef(false);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <div className="sb-phone-row" data-selected={selected || undefined}>
      {selecting && (
        <input
          type="checkbox"
          aria-label={`Select ${row.opportunity.reference} r${row.revision}`}
          checked={selected}
          onChange={onSelect}
        />
      )}
      <button
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") {
            held.current = false;
            timer.current = setTimeout(() => {
              held.current = true;
              onLongPress();
            }, 500);
          }
        }}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerMove={stop}
        onClick={() => {
          if (held.current) {
            held.current = false;
            return;
          }
          onOpen();
        }}
      >
        <span className="sb-phone-body">
          <span className="sb-phone-first">
            <strong>{row.opportunity.title}</strong>
            <time dateTime={row.updated_at}>
              {updatedDate(row.updated_at, observed)}
            </time>
          </span>
          <small>
            {row.opportunity.reference} r{row.revision} · {row.customer.name}
          </small>
          <span className="sb-phone-last">
            <BriefState
              row={row}
              receiver={
                row.receiving_owner?.id !== identity.actor_id &&
                !["Accepted", "Returned"].includes(row.state)
                  ? row.receiving_owner?.name
                  : undefined
              }
            />
            <small>
              {row.requested_date
                ? `Requested ${date(row.requested_date)}`
                : "Date needed"}
            </small>
          </span>
        </span>
        <BriefIcon name="next" />
      </button>
    </div>
  );
}
