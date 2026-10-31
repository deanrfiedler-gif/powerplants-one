"use client";
import {
  Fragment,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useIdentity } from "./business-session";
import { api } from "./business-ui";
import { denied, useCrmResource } from "./crm-state";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { Button } from "./ui/button";
import { RegisterTable, RegisterChip } from "./ui/register-table";
import { WorklistChoice, WorklistPanel } from "./crm-worklist-tools";
import { FontAwesomeGlyph } from "./font-awesome";
import { ShellIcon, type ShellIconName } from "./shell-icon";
import { formatDateTime } from "../shell/date-format";
import {
  inQueueView,
  queueCounts,
  type QueueRow,
  type ReviewQueueData,
} from "../estimating/review/queue-model";
import {
  emptyQueueMessage,
  registerViews,
  reviewLabels,
  reviewStatus,
  reviewsCsv,
  reviewValue,
  selectionKey,
  waitingTime,
} from "../estimating/review/queue-presentation";
import { ReviewQueueSnapshot } from "./estimate-reviews-snapshot";
import "./estimate-reviews-register.css";

const reviewIconFallbacks: Record<string, ShellIconName> = {
  xmark: "close",
  "chevron-right": "chevron-right",
  ellipsis: "more",
  filter: "filter",
  gear: "settings",
  "rotate-left": "chevron-left",
  list: "work",
  "list-check": "check",
  "file-invoice-dollar": "finance",
  "circle-check": "check",
  user: "contacts",
};
export function ReviewQueueIcon({ name }: { name: string }) {
  return (
    <FontAwesomeGlyph
      icon={name}
      className="er-icon"
      fallback={<ShellIcon name={reviewIconFallbacks[name] ?? "documents"} />}
    />
  );
}
export function EstimateReviewsRegister() {
  const params = useSearchParams(),
    identity = useIdentity();
  const [refresh, setRefresh] = useState(0);
  const [menuOpen, setMenuOpen] = useState(true),
    [hidden, setHidden] = useState<string[]>([]);
  return (
    <Register
      key={`${identity.workspace_id}:${identity.actor_id}:${params}:${refresh}`}
      query={new URLSearchParams(params.toString())}
      display={{ menuOpen, setMenuOpen, hidden, setHidden }}
      refresh={() => setRefresh((x) => x + 1)}
    />
  );
}
function Register({
  query,
  refresh,
  display,
}: {
  query: URLSearchParams;
  refresh: () => void;
  display: {
    menuOpen: boolean;
    setMenuOpen: Dispatch<SetStateAction<boolean>>;
    hidden: string[];
    setHidden: Dispatch<SetStateAction<string[]>>;
  };
}) {
  const { menuOpen, setMenuOpen, hidden, setHidden } = display;
  const router = useRouter(),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filtersOpen, setFiltersOpen] = useState(false),
    [columnsOpen, setColumnsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]),
    [panel, setPanel] = useState<boolean | null>(null),
    [snapshot, setSnapshot] = useState<QueueRow | null>(null),
    [sequence, setSequence] = useState<QueueRow[] | null>(null),
    [exporting, setExporting] = useState(false),
    [error, setError] = useState("");
  const opener = useRef<HTMLElement | null>(null);
  const selectionPanel = useRef<HTMLElement | null>(null);
  const selectionOpener = useRef<HTMLElement | null>(null);
  function closeSelection() {
    setPanel(false);
    requestAnimationFrame(() =>
      (selectionOpener.current?.isConnected
        ? selectionOpener.current
        : document.querySelector<HTMLElement>(
            "#ppo-estimate-reviews .er-toolbar button",
          )
      )?.focus(),
    );
  }
  const view =
      registerViews.find((v) => v.id === query.get("view"))?.id ?? "all",
    kind = query.get("kind") ?? "",
    site = query.get("site") ?? "",
    q = query.get("q") ?? "";
  const offset = /^\d+$/.test(query.get("offset") ?? "")
    ? Number(query.get("offset"))
    : 0;
  const request = `estimating/reviews?${new URLSearchParams({ q, offset: String(offset), limit: "25" })}`;
  const resource = useCrmResource<ReviewQueueData>(request, true),
    data = resource.error ? null : resource.data;
  const filtered =
    data?.items.filter(
      (r) => (!kind || r.kind === kind) && (!site || r.site?.id === site),
    ) ?? [];
  const rows = filtered.filter((r) =>
    view === "quotations"
      ? r.source === "QuotationApproval"
      : inQueueView(r, view),
  );
  const counts = queueCounts(filtered),
    selectedRows = rows.filter((r) => selected.includes(selectionKey(r)));
  const panelOpen = panel ?? !menu.phone;
  function clearSelection() {
    setSelected([]);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(
          `#ppo-estimate-reviews ${menu.phone ? ".er-phone-list" : ".er-desktop-grid"} input`,
        )
        ?.focus(),
    );
  }
  const hasFilters = !!(q || kind || site || view !== "all");
  function change(values: Record<string, string>, reset = true) {
    const next = new URLSearchParams(query);
    if (reset) next.delete("offset");
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`/estimating/reviews${next.size ? `?${next}` : ""}`, {
      scroll: false,
    });
  }
  function open(row: QueueRow, source?: HTMLElement) {
    opener.current = source ?? opener.current;
    setSnapshot(row);
  }
  function close() {
    setSnapshot(null);
    setSequence(null);
    requestAnimationFrame(() => {
      const target = opener.current?.isConnected
        ? opener.current
        : document.querySelector<HTMLElement>(
            "#ppo-estimate-reviews .er-toolbar button",
          );
      target?.focus({ preventScroll: true });
    });
  }
  const toggle = (r: QueueRow) =>
    setSelected((old) =>
      old.includes(selectionKey(r))
        ? old.filter((k) => k !== selectionKey(r))
        : [...old, selectionKey(r)],
    );
  const startSequence = (source: HTMLElement) => {
    const ordered = [...selectedRows].sort(
      (a, b) =>
        a.submitted_at.localeCompare(b.submitted_at) ||
        a.id.localeCompare(b.id),
    );
    setSequence(ordered);
    if (ordered[0]) open(ordered[0], source);
  };
  async function exportSelection() {
    setExporting(true);
    setError("");
    try {
      const current = await api<ReviewQueueData>(request);
      const confirmed = selectedRows.map((r) =>
        current.items.find((x) => selectionKey(x) === selectionKey(r)),
      );
      if (confirmed.some((r) => !r)) {
        setSelected([]);
        setSnapshot(null);
        resource.reload();
        throw Error(
          "The selection changed or is no longer readable. Refresh and select the exact reviews again.",
        );
      }
      const blob = new Blob(
        ["\uFEFF", reviewsCsv(confirmed as QueueRow[], current.as_of)],
        { type: "text/csv;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = "selected-reviews.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(
        denied(e)
          ? "Access changed. Refresh the queue before exporting."
          : e instanceof Error
            ? e.message
            : "The selection could not be rechecked. Retry when connected.",
      );
      setSelected([]);
      setSnapshot(null);
      resource.reload();
    } finally {
      setExporting(false);
    }
  }
  const filters = (
    <>
      <WorklistChoice
        label="Review type"
        prefix="Review: "
        value={kind}
        options={[
          { id: "", label: "All types" },
          ...Object.entries(reviewLabels).map(([id, label]) => ({ id, label })),
        ]}
        onChange={(value) => change({ kind: value })}
      />
      <WorklistChoice
        label="Site"
        prefix="Site: "
        value={site}
        options={[
          { id: "", label: "All sites" },
          ...(data?.sites ?? []).map((s) => ({ id: s.id, label: s.name })),
          ...(site && !data?.sites.some((s) => s.id === site)
            ? [{ id: site, label: "Selected site (outside this window)" }]
            : []),
        ]}
        onChange={(value) => change({ site: value })}
      />
    </>
  );
  const columns = [
    { id: "reference", label: "Estimate / quotation", width: 134 },
    { id: "title", label: "Title", width: 210 },
    { id: "kind", label: "Review", width: 136 },
    { id: "state", label: "Status", width: 190 },
    { id: "waiting", label: "Waiting", width: 80 },
    { id: "value", label: "Value ex tax", width: 120 },
    { id: "submitter", label: "Submitted by", width: 160 },
  ].filter((c) => !hidden.includes(c.id));
  const cell = (row: QueueRow, id: string) =>
    id === "reference" ? (
      <>
        {row.reference}{" "}
        <small>
          {row.source === "EstimateReview" ? "v" : "r"}
          {row.revision}
        </small>
      </>
    ) : id === "title" ? (
      <button className="er-title" onClick={(e) => open(row, e.currentTarget)}>
        {row.title}
      </button>
    ) : id === "kind" ? (
      <RegisterChip tone="neutral">{reviewLabels[row.kind]}</RegisterChip>
    ) : id === "state" ? (
      <span className={row.state === "Returned" ? "er-returned" : ""}>
        {reviewStatus(row)}
      </span>
    ) : id === "waiting" ? (
      waitingTime(row, data!.as_of)
    ) : id === "value" ? (
      reviewValue(row)
    ) : (
      row.submitted_by
    );
  return (
    <SecondaryMenuFrame
      id="ppo-estimate-reviews"
      name="Reviews & approvals"
      menuId="estimate-review-views"
      contentId="estimate-review-content"
      state={menu}
      phoneHeader={{
        title: "Reviews & approvals",
        count: data ? rows.length : undefined,
        filter: { open: () => setFiltersOpen(true), applied: hasFilters },
      }}
      message={
        data
          ? `${rows.length} visible review rows in this window`
          : "Current reviews unconfirmed"
      }
      menu={
        <nav aria-label="Review views">
          {registerViews.map((v, i) => (
            <Fragment key={v.id}>
              {i === 3 && <h2 className="er-menu-heading">Status</h2>}
              <button
                type="button"
                className="mw-nav-item"
                aria-current={view === v.id ? "page" : undefined}
                onClick={() => {
                  change({ view: v.id });
                  menu.closeOverlay();
                }}
              >
                <ReviewQueueIcon name={v.icon} />
                <span>{v.label}</span>
                {data && (
                  <span
                    className="mw-count"
                    title="Readable review rows in this candidate window"
                  >
                    {v.id === "quotations"
                      ? filtered.filter((r) => r.source === "QuotationApproval")
                          .length
                      : counts[v.id]}
                  </span>
                )}
              </button>
            </Fragment>
          ))}
          <p className="er-menu-note">Counts cover this window only.</p>
        </nav>
      }
    >
      <div className="er-register">
        <div className="er-toolbar" inert={!!snapshot}>
          {selectedRows.length ? (
            <>
              <Button onClick={(e) => startSequence(e.currentTarget)}>
                Open in sequence
              </Button>
              <Button
                disabled={exporting}
                onClick={() => void exportSelection()}
              >
                Export list
              </Button>
              <span className="er-count">{selectedRows.length} selected</span>
              <Button
                onClick={(e) => {
                  selectionOpener.current = e.currentTarget;
                  setPanel(!panelOpen);
                  if (!panelOpen)
                    requestAnimationFrame(() =>
                      selectionPanel.current?.focus(),
                    );
                }}
              >
                {panelOpen ? "Hide panel" : "Show panel"}
              </Button>
              <Button
                variant="quiet"
                onClick={clearSelection}
                aria-label="Clear selection"
              >
                <ReviewQueueIcon name="xmark" />
              </Button>
            </>
          ) : (
            <>
              <div className="er-desktop-filters">{filters}</div>
              <div className="er-phone-view">
                <WorklistChoice
                  label="Review view"
                  value={view}
                  options={registerViews.map((v) => ({
                    id: v.id,
                    label: v.label,
                  }))}
                  onChange={(value) => change({ view: value })}
                />
              </div>
              <span className="er-count">
                {data
                  ? `${rows.length} review${rows.length === 1 ? "" : "s"} · this window`
                  : resource.error
                    ? "Unavailable"
                    : "Loading…"}
              </span>
              <Button
                variant="quiet"
                onClick={() => setFiltersOpen(true)}
                aria-label="Filter reviews"
              >
                <ReviewQueueIcon name="filter" />
              </Button>
              <Button
                variant="quiet"
                onClick={refresh}
                aria-label="Refresh reviews"
              >
                <ReviewQueueIcon name="rotate-left" />
              </Button>
            </>
          )}
        </div>
        <div className="er-scroll" inert={!!snapshot}>
          {!!error && (
            <div className="er-notice" role="alert">
              {error}
            </div>
          )}
          {resource.error ? (
            <div className="er-notice" role="alert">
              <h2>
                {denied(resource.error)
                  ? "Reviews are outside your access"
                  : "Reviews could not be loaded"}
              </h2>
              <p>
                No protected rows or counts are shown. Check your access or
                connection, then retry.
              </p>
              <Button onClick={refresh}>Retry loading</Button>
              <Button
                onClick={() =>
                  change(
                    { q: "", view: "", kind: "", site: "", offset: "" },
                    false,
                  )
                }
              >
                Reset filters
              </Button>
            </div>
          ) : resource.loading ? (
            <div className="er-notice" role="status">
              Loading permitted reviews…
            </div>
          ) : (
            data && (
              <>
                {data.completeness === "PartialWindow" && (
                  <p className="er-notice" role="status">
                    Partial window. Some sources are restricted or unavailable.
                    {data.quotation_source === "Denied"
                      ? " Quotation approvals are outside your read access."
                      : ""}{" "}
                    Visible counts exclude inaccessible records.
                  </p>
                )}
                {!!selected.length && !selectedRows.length && (
                  <p className="er-notice" role="status">
                    The selected review evidence changed. Select current rows
                    again.
                  </p>
                )}
                {!rows.length ? (
                  <div className="er-notice">
                    <h2>{emptyQueueMessage(data, hasFilters)}</h2>
                    <p>
                      {data.next_offset !== null
                        ? "Older candidates are available. Continue to the next window even when this one has no matching reviews."
                        : "This result describes the current readable window, not work outside your access."}
                    </p>
                    {hasFilters && (
                      <Button
                        onClick={() =>
                          change({ view: "", kind: "", site: "", q: "" })
                        }
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="er-desktop-grid">
                      <RegisterTable caption="Reviews and quotation approvals. Select rows to open snapshots in sequence or export; decisions stay in native workflows.">
                        <colgroup>
                          <col style={{ width: 44 }} />
                          {columns.map((c) => (
                            <col key={c.id} style={{ width: c.width }} />
                          ))}
                          <col style={{ width: 44 }} />
                        </colgroup>
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select all visible reviews"
                                checked={
                                  rows.length > 0 &&
                                  selectedRows.length === rows.length
                                }
                                onChange={(e) =>
                                  setSelected(
                                    e.target.checked
                                      ? rows.map(selectionKey)
                                      : [],
                                  )
                                }
                              />
                            </th>
                            {columns.map((c) => (
                              <th key={c.id} scope="col">
                                {c.label}
                              </th>
                            ))}
                            <th>
                              <Button
                                variant="quiet"
                                aria-label="Choose review columns"
                                onClick={() => setColumnsOpen(true)}
                              >
                                <ReviewQueueIcon name="gear" />
                              </Button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row) => (
                            <tr
                              key={row.id}
                              data-selected={
                                selectedRows.includes(row) || undefined
                              }
                              data-inspected={
                                snapshot?.id === row.id || undefined
                              }
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${row.reference} ${reviewLabels[row.kind]}`}
                                  checked={selectedRows.includes(row)}
                                  onChange={() => toggle(row)}
                                />
                              </td>
                              {columns.map((c) => (
                                <td
                                  key={c.id}
                                  title={
                                    c.id === "submitter"
                                      ? `${row.submitted_by} · ${formatDateTime(row.submitted_at)}`
                                      : undefined
                                  }
                                >
                                  {cell(row, c.id)}
                                </td>
                              ))}
                              <td>
                                <Button
                                  variant="quiet"
                                  aria-label={`Open ${row.reference} ${reviewLabels[row.kind]} snapshot`}
                                  onClick={(e) => open(row, e.currentTarget)}
                                >
                                  <ReviewQueueIcon name="ellipsis" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </RegisterTable>
                    </div>
                    <div className="er-phone-list">
                      {rows.map((row) => (
                        <article
                          key={row.id}
                          data-selected={
                            selectedRows.includes(row) || undefined
                          }
                        >
                          <input
                            type="checkbox"
                            aria-label={`Select ${row.reference} ${reviewLabels[row.kind]}`}
                            checked={selectedRows.includes(row)}
                            onChange={() => toggle(row)}
                          />
                          <button
                            onClick={(e) => open(row, e.currentTarget)}
                            aria-label={`Open ${row.reference} ${reviewLabels[row.kind]} snapshot`}
                          >
                            <span className="er-phone-title">{row.title}</span>
                            <span className="er-phone-value">
                              {reviewValue(row)}
                            </span>
                            <span className="er-phone-meta">
                              {row.reference}{" "}
                              {row.source === "EstimateReview" ? "v" : "r"}
                              {row.revision}{" "}
                              <RegisterChip tone="neutral">
                                {reviewLabels[row.kind]}
                              </RegisterChip>
                            </span>
                            <span className="er-phone-state">
                              {reviewStatus(row)}
                            </span>
                            <span className="er-phone-wait">
                              {waitingTime(row, data.as_of)}
                            </span>
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )
          )}
        </div>
        {data && (
          <footer className="er-window" inert={!!snapshot}>
            <div>
              <span>
                {rows.length} visible rows · up to {data.candidate_limit}{" "}
                estimate/quotation candidates per window.
              </span>
              <small>
                Updated {formatDateTime(data.as_of)}. Elapsed since submission;
                no SLA. Live windows may move after new submissions.
              </small>
            </div>
            <Button
              disabled={!offset}
              onClick={() =>
                change({ offset: String(Math.max(0, offset - 25)) }, false)
              }
            >
              Previous window
            </Button>
            <Button
              disabled={data.next_offset === null}
              onClick={() =>
                change({ offset: String(data.next_offset) }, false)
              }
            >
              Next window
            </Button>
          </footer>
        )}
        {!!selectedRows.length && panelOpen && !snapshot && (
          <aside
            className="er-selection"
            aria-label="Selected reviews"
            ref={selectionPanel}
            tabIndex={-1}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                closeSelection();
              }
            }}
          >
            <header>
              <h2>{selectedRows.length} reviews selected</h2>
              <Button
                variant="quiet"
                aria-label="Close selection panel"
                onClick={closeSelection}
              >
                ×
              </Button>
            </header>
            <div>
              {selectedRows.map((r) => (
                <article key={r.id}>
                  <strong>
                    {r.reference} {r.source === "EstimateReview" ? "v" : "r"}
                    {r.revision} · {reviewLabels[r.kind]}
                  </strong>
                  <p>
                    {r.title} · {waitingTime(r, data!.as_of)}
                  </p>
                </article>
              ))}
              <p className="er-rule">
                Each decision checks one exact saved version. Selection opens or
                lists reviews; it never decides anything.
              </p>
              <Button onClick={(e) => startSequence(e.currentTarget)}>
                Open in sequence
              </Button>
              <p>Oldest selected submission first.</p>
              <Button
                disabled={exporting}
                onClick={() => void exportSelection()}
              >
                Export list (CSV)
              </Button>
              <p>Selected readable rows only, rechecked before export.</p>
            </div>
            <footer>
              <Button onClick={clearSelection}>Cancel</Button>
            </footer>
          </aside>
        )}
        {snapshot && data && (
          <ReviewQueueSnapshot
            key={selectionKey(snapshot)}
            row={snapshot}
            rows={sequence ?? rows}
            asOf={data.as_of}
            onSelect={setSnapshot}
            onClose={close}
          />
        )}
      </div>
      {filtersOpen && (
        <WorklistPanel
          title="Filter reviews"
          onClose={() => setFiltersOpen(false)}
        >
          {filters}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = new FormData(e.currentTarget);
              change({ q: String(input.get("search") ?? "") });
            }}
          >
            <label>
              Search references, titles and customers
              <input name="search" defaultValue={q} maxLength={100} />
            </label>
            <Button type="submit">Search reviews</Button>
          </form>
          <p>
            Review type and site filter this candidate window. Use Next window
            for older candidates.
          </p>
          <Button
            onClick={() => change({ view: "", kind: "", site: "", q: "" })}
          >
            Clear filters
          </Button>
        </WorklistPanel>
      )}
      {columnsOpen && (
        <WorklistPanel
          title="Review columns"
          onClose={() => setColumnsOpen(false)}
        >
          {["reference", "kind", "state", "waiting", "value", "submitter"].map(
            (id) => (
              <label key={id}>
                <input
                  type="checkbox"
                  checked={!hidden.includes(id)}
                  onChange={(e) =>
                    setHidden((old) =>
                      e.target.checked
                        ? old.filter((x) => x !== id)
                        : [...old, id],
                    )
                  }
                />
                {
                  {
                    reference: "Estimate / quotation",
                    kind: "Review",
                    state: "Status",
                    waiting: "Waiting",
                    value: "Value ex tax",
                    submitter: "Submitted by",
                  }[id]
                }
              </label>
            ),
          )}
          <p>
            Title, selection and actions stay visible. Column choices last for
            this visit.
          </p>
        </WorklistPanel>
      )}
    </SecondaryMenuFrame>
  );
}
