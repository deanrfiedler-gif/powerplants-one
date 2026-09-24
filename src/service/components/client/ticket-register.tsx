"use client";
// SV-01 service requests register (build plan I2; frames 1–3, 6, 14, 16, 19, 20 and 23 for the three native
// states). A full-bleed module workspace: the shell supplies the rail, header and breadcrumb, and this module
// draws no masthead. The server read decides every state, blocker and permitted action.
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ErrorNotice,
  isDenied,
  ReadState,
  SelectField,
  useResource,
  type Envelope,
  type Option,
} from "../../../components/business-ui";
import { useIdentity } from "../../../components/business-session";
import { ProductIcon } from "../../../components/product-icons";
import { usePublishPageDescription } from "../../../shell/page-description";
import { formatWhen, type MoveTarget, type QueueKey, type RegisterItem } from "../../ticket-register-view";
import { Board, columns, MoveDialog, PhoneCards, Preview, Table, type ColumnKey } from "./ticket-register-parts";

type Queues = Record<QueueKey, number> & { as_at: string };
type Filters = { q: string; company_id: string; site_id: string; owner_id: string };
const filterKeys = ["company_id", "site_id", "owner_id"] as const;
const queues: { key: QueueKey; label: string; short: string; tone?: "danger" }[] = [
  { key: "all_open", label: "All open", short: "All open" },
  { key: "new", label: "New to triage", short: "New" },
  { key: "urgent", label: "Urgent", short: "Urgent" },
  { key: "needs_information", label: "Needs information", short: "Information" },
  { key: "overdue_clarifications", label: "Overdue clarifications", short: "Overdue", tone: "danger" },
];
const queueKeys = new Set<string>(queues.map((queue) => queue.key));
const query = (fields: Record<string, string>) =>
  new URLSearchParams(Object.entries(fields).filter(([, value]) => value)).toString();
const pageSize = 25,
  boardLimit = 200,
  columnStore = "ppo.sv01.hidden-columns";

function useMedia(media: string) {
  return useSyncExternalStore(
    (change) => {
      const list = window.matchMedia(media);
      list.addEventListener("change", change);
      return () => list.removeEventListener("change", change);
    },
    () => window.matchMedia(media).matches,
    () => true,
  );
}

// A per-viewer convenience only; the register works the same when storage is unavailable.
function useHiddenColumns() {
  const [hidden, setHidden] = useState<ColumnKey[]>([]);
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(columnStore) ?? "[]");
      if (Array.isArray(saved)) {
        const known = saved.filter((key) => columns.some((column) => column.key === key));
        queueMicrotask(() => setHidden(known));
      }
    } catch {
      /* storage unavailable: show every column */
    }
  }, []);
  const toggle = (key: ColumnKey) =>
    setHidden((old) => {
      const next = old.includes(key) ? old.filter((value) => value !== key) : [...old, key];
      try {
        window.localStorage.setItem(columnStore, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  return [hidden, toggle] as const;
}

function ColumnsMenu({ hidden, toggle, compact }: { hidden: ColumnKey[]; toggle: (key: ColumnKey) => void; compact: boolean }) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);
  return (
    <details
      ref={menu}
      className="sr-columns"
      onKeyDown={(event) => {
        if (event.key === "Escape" && menu.current?.open) {
          menu.current.open = false;
          menu.current.querySelector("summary")?.focus();
        }
      }}
    >
      <summary className={compact ? "button secondary sr-icon-button" : "button secondary"} aria-label={compact ? "Columns" : undefined}>
        <ProductIcon name="list" />
        {!compact && <span>Columns</span>}
      </summary>
      <fieldset>
        <legend>Show columns</legend>
        <label className="sr-check">
          <input type="checkbox" checked disabled /> Request (always shown)
        </label>
        {columns.map((column) => (
          <label className="sr-check" key={column.key}>
            <input type="checkbox" checked={!hidden.includes(column.key)} onChange={() => toggle(column.key)} /> {column.label}
          </label>
        ))}
      </fieldset>
    </details>
  );
}

// Filters apply together: entries stay a draft until "Show n requests", with n read live for the draft.
function FiltersPanel({
  filters,
  queue,
  onApply,
  onClose,
}: {
  filters: Filters;
  queue: QueueKey;
  onApply: (next: Filters) => void;
  onClose: () => void;
}) {
  const p = useIdentity(),
    dialog = useRef<HTMLDialogElement>(null),
    [draft, setDraft] = useState(filters);
  const companies = useResource<Envelope<Option>>("selectors/companies"),
    sites = useResource<Envelope<Option>>(draft.company_id ? `sites?${query({ company_id: draft.company_id, limit: "200" })}` : null),
    owners = useResource<Envelope<Option>>(
      draft.company_id
        ? `selectors/owners?${query({ company_id: draft.company_id, site_id: draft.site_id, purpose: "Ticket" })}`
        : null,
    ),
    count = useResource<Queues>(`service/tickets/queues?${query(draft)}`);
  useEffect(() => {
    const node = dialog.current;
    if (node && !node.open) node.showModal();
  }, []);
  const ownerOptions = [
    { id: p.actor_id, display_name: `Me (${p.display_name})` },
    ...(owners.data?.items ?? []).filter((owner) => owner.id !== p.actor_id),
  ];
  const n = count.data?.[queue];
  return (
    <dialog ref={dialog} className="sr-filters" aria-labelledby="sr-filters-title" onClose={onClose}>
      <header className="sr-filters-head">
        <button type="button" className="secondary sr-icon-button" aria-label="Close filters" onClick={() => dialog.current?.close()}>
          <ProductIcon name="close" />
        </button>
        <h2 id="sr-filters-title">Filters</h2>
        <button type="button" className="secondary sr-quiet" onClick={() => setDraft({ ...draft, company_id: "", site_id: "", owner_id: "" })}>
          Clear all
        </button>
      </header>
      <div className="sr-filters-body">
        <SelectField
          name="sr-filter-company"
          label="Company visibility context"
          value={draft.company_id}
          options={companies.data?.items ?? []}
          empty="Any permitted company"
          onChange={(value) => setDraft({ ...draft, company_id: value, site_id: "", owner_id: draft.owner_id === p.actor_id ? p.actor_id : "" })}
        />
        <SelectField
          name="sr-filter-site"
          label="Site"
          value={draft.site_id}
          options={sites.data?.items ?? []}
          empty={draft.company_id ? "Any permitted site" : "Choose a company context first"}
          onChange={(value) => setDraft({ ...draft, site_id: value })}
        />
        <SelectField
          name="sr-filter-owner"
          label="Request owner"
          value={draft.owner_id}
          options={ownerOptions}
          empty="Anyone"
          onChange={(value) => setDraft({ ...draft, owner_id: value })}
        />
        {!draft.company_id && <p className="sr-muted">Choose a company context to filter by another owner or a site.</p>}
        {[companies, sites, owners].map((read, index) => (
          <ErrorNotice key={index} error={read.error} />
        ))}
      </div>
      <footer className="sr-filters-foot">
        <button
          type="button"
          onClick={() => {
            onApply(draft);
            dialog.current?.close();
          }}
        >
          {n === undefined ? "Show requests" : `Show ${n} ${n === 1 ? "request" : "requests"}`}
        </button>
      </footer>
    </dialog>
  );
}

function Skeleton() {
  return (
    <div className="sr-state" aria-busy="true">
      <ul className="sr-skeleton" aria-hidden="true">
        {[0, 1, 2, 3].map((row) => (
          <li key={row}>
            <span />
            <span />
            <span />
          </li>
        ))}
      </ul>
      <p role="status">Loading permitted requests…</p>
    </div>
  );
}

export function TicketRegister() {
  const params = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    p = useIdentity(),
    wide = useMedia("(min-width: 1024px)"),
    roomy = useMedia("(min-width: 1200px)");
  usePublishPageDescription(
    "Service requests",
    "Capture the issue, clarify what is unknown and prepare it for a separate work-scope decision. Intake does not authorise work or confirm a booking.",
  );
  const filters: Filters = {
    q: params.get("q") ?? "",
    company_id: params.get("company_id") ?? "",
    site_id: params.get("site_id") ?? "",
    owner_id: params.get("owner_id") ?? "",
  };
  const requested = params.get("queue") ?? "all_open",
    queue = (queueKeys.has(requested) ? requested : "all_open") as QueueKey,
    view = wide ? (params.get("view") === "list" ? "list" : "board") : "cards";
  const [search, setSearch] = useState(filters.q),
    [cursors, setCursors] = useState<string[]>([]),
    [preview, setPreview] = useState<string | null>(null),
    [move, setMove] = useState<{ item: RegisterItem; target?: MoveTarget } | null>(null),
    [filtersOpen, setFiltersOpen] = useState(false),
    [feedback, setFeedback] = useState(""),
    [hidden, toggleColumn] = useHiddenColumns();
  const returnFocus = useRef<HTMLElement | null>(null);

  const navigate = (change: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(change)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setCursors([]);
    setPreview(null);
    const text = next.toString();
    router.replace(text ? `${path}?${text}` : path, { scroll: false });
  };
  // Search is debounced into the address so a deep link and the back button keep it.
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(searchTimer.current), []);
  const typeSearch = (value: string) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => navigate({ q: value.trim() }), 300);
  };

  const board = view === "board";
  const listPath = `service/tickets?${query({
    ...filters,
    queue,
    sort: "urgency",
    limit: String(board ? boardLimit : pageSize),
    cursor: board ? "" : (cursors.at(-1) ?? ""),
  })}`;
  const list = useResource<Envelope<RegisterItem>>(listPath),
    counts = useResource<Queues>(`service/tickets/queues?${query(filters)}`);
  const filtered = !!(filters.q || filters.company_id || filters.site_id || filters.owner_id),
    empty = !!list.data && !list.error && list.data.items.length === 0,
    everything = useResource<Queues>(empty && filtered ? "service/tickets/queues" : null);

  const items = useMemo(() => (list.error ? [] : (list.data?.items ?? [])), [list.data, list.error]);
  // Relative times read against the list's own as-at time, never the viewer's clock.
  const now = useMemo(() => new Date(list.data?.observed_at ?? 0), [list.data?.observed_at]);
  const selected = items.find((item) => item.id === preview) ?? null;
  const total = counts.data?.[queue];
  const firstRow = cursors.length * pageSize + 1;

  const reload = () => {
    list.reload();
    counts.reload();
  };
  const openPreview = (item: RegisterItem) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setPreview((current) => (current === item.id ? null : item.id));
  };
  const closePreview = () => {
    setPreview(null);
    returnFocus.current?.focus();
  };
  const startMove = (item: RegisterItem, target?: MoveTarget) => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setFeedback("");
    setMove({ item, target });
  };
  const endMove = () => {
    const id = move?.item.id;
    setMove(null);
    requestAnimationFrame(() => {
      const target = returnFocus.current?.isConnected
        ? returnFocus.current
        : document.querySelector<HTMLElement>(`[data-ticket-id="${id}"] [data-move]:not([disabled]), [data-ticket-id="${id}"] a`);
      target?.focus();
    });
  };
  const moved = (item: RegisterItem, target: MoveTarget) => {
    setFeedback(`${item.display_number}: ${target === "Triaged" ? "triage" : "information request"} saved. The register shows its current stage.`);
    endMove();
    reload();
  };
  const clearAll = () => {
    clearTimeout(searchTimer.current);
    setSearch("");
    navigate({ q: "", company_id: "", site_id: "", owner_id: "", queue: "" });
  };

  // Names for the active filter chips come from the same permitted selectors the panel uses.
  const companies = useResource<Envelope<Option>>(filters.company_id ? "selectors/companies" : null),
    sites = useResource<Envelope<Option>>(filters.company_id && filters.site_id ? `sites?${query({ company_id: filters.company_id, limit: "200" })}` : null);
  const chipLabel = (key: (typeof filterKeys)[number]) => {
    if (key === "owner_id") return filters.owner_id === p.actor_id ? "Owner: me" : "Owner: selected person";
    const source = key === "company_id" ? companies : sites;
    const name = source.data?.items.find((option) => option.id === filters[key])?.display_name;
    return `${key === "company_id" ? "Company" : "Site"}: ${name ?? "selected"}`;
  };
  const activeFilters = filterKeys.filter((key) => filters[key]);

  if (isDenied(list.error))
    return (
      <section id="ppo-service-requests" data-module-layout="full-bleed" data-module-scope="SV-01" aria-label="Service requests">
        <h1 className="sr-only">Service requests</h1>
        <div className="sr-state">
          <ReadState loading={false} error={list.error} retry={list.reload} />
        </div>
      </section>
    );

  const readOnly = items.some((item) => item.status !== "Triaged") && items.every((item) => item.status === "Triaged" || !item.can_edit_intake);

  return (
    <section
      id="ppo-service-requests"
      data-module-layout="full-bleed"
      data-module-scope="SV-01"
      data-view={view}
      aria-label="Service requests"
    >
      <h1 className="sr-only">Service requests</h1>
      <div className="sr-toolbar">
        {wide && (
          <div className="sr-segmented" role="group" aria-label="Presentation">
            {(["board", "list"] as const).map((value) => (
              <button
                key={value}
                type="button"
                className="secondary"
                aria-pressed={view === value}
                onClick={() => navigate({ view: value === "board" ? "" : value })}
              >
                <ProductIcon name={value} />
                <span>{value === "board" ? "Board" : "List"}</span>
              </button>
            ))}
          </div>
        )}
        <label className="sr-search">
          <ProductIcon name="search" />
          <span className="sr-only">Search service requests by title or reference</span>
          <input
            type="search"
            name="sr-search"
            placeholder={roomy ? "Search requests by title or reference" : "Search requests"}
            value={search}
            maxLength={200}
            onChange={(event) => typeSearch(event.target.value)}
          />
        </label>
        <div className="sr-toolbar-actions">
          <button
            type="button"
            className="secondary sr-filter-button"
            aria-haspopup="dialog"
            aria-label={activeFilters.length ? `Filters, ${activeFilters.length} active` : "Filters"}
            onClick={() => setFiltersOpen(true)}
          >
            <ProductIcon name="filter" />
            <span className="sr-filter-label">Filters</span>
            {activeFilters.length > 0 && <span className="sr-badge">{activeFilters.length}</span>}
          </button>
          {view === "list" && <ColumnsMenu hidden={hidden} toggle={toggleColumn} compact={!roomy} />}
          <Link className="button sr-primary" href="/service/tickets/new">
            <ProductIcon name="plus" />
            Log a request
          </Link>
        </div>
      </div>
      <div className="sr-queues">
        <div className="sr-queue-row" role="group" aria-label="Queues">
          {queues.map((entry) => {
            const count = counts.data?.[entry.key];
            return (
              <button
                key={entry.key}
                type="button"
                className="secondary"
                data-tone={entry.tone && count ? entry.tone : undefined}
                aria-pressed={queue === entry.key}
                onClick={() => navigate({ queue: entry.key === "all_open" ? "" : entry.key })}
              >
                <span className="sr-queue-label">{roomy ? entry.label : entry.short}</span>
                <span className="sr-badge" aria-label={count === undefined ? "count unavailable" : `${count}`}>
                  {count ?? "–"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="sr-queue-meta">
          {total !== undefined && (
            <span>
              {total} {total === 1 ? "request" : "requests"}
            </span>
          )}
          {wide && <span className="sr-sort">Sorted by urgency</span>}
        </p>
      </div>
      {(activeFilters.length > 0 || filters.q) && (
        <div className="sr-filter-chips" aria-label="Active filters">
          {filters.q && (
            <button type="button" className="secondary" aria-label={`Remove search ${filters.q}`} onClick={() => {
                clearTimeout(searchTimer.current);
                setSearch("");
                navigate({ q: "" });
              }}>
              <span>Search: {filters.q}</span>
              <ProductIcon name="close" />
            </button>
          )}
          {activeFilters.map((key) => (
            <button
              key={key}
              type="button"
              className="secondary"
              aria-label={`Remove ${chipLabel(key)}`}
              onClick={() => navigate(key === "company_id" ? { company_id: "", site_id: "" } : { [key]: "" })}
            >
              <span>{chipLabel(key)}</span>
              <ProductIcon name="close" />
            </button>
          ))}
        </div>
      )}
      {feedback && (
        <div className="sr-feedback" role="status">
          <span>{feedback}</span>
          <button type="button" className="secondary sr-quiet" onClick={() => setFeedback("")}>
            Dismiss
          </button>
        </div>
      )}
      {readOnly && (
        <div className="sr-notice tone-neutral sr-readonly">
          <p>
            <strong>You can view service requests.</strong> Moving a request needs service request edit permission for its site. Move stays visible, disabled, with this reason.
          </p>
        </div>
      )}
      <div className="sr-body" data-preview={selected ? (roomy ? "docked" : "overlay") : undefined}>
        <div className="sr-scroll">
          {list.error ? (
            <div className="sr-state">
              <ErrorNotice error={list.error} />
              <p>Nothing was changed. Check the connection and try again.</p>
              <button type="button" className="secondary" onClick={reload}>
                Try again
              </button>
            </div>
          ) : list.loading && !list.data ? (
            <Skeleton />
          ) : empty ? (
            filtered || queue !== "all_open" ? (
              <div className="sr-state sr-empty">
                <ProductIcon name="search" />
                <h2>No requests match these filters</h2>
                <p>
                  {(() => {
                    const all = filtered ? everything.data?.all_open : counts.data?.all_open;
                    return all === undefined ? "Some open requests may be hidden by the current filters." : `${all} open ${all === 1 ? "request is" : "requests are"} hidden by the current filters.`;
                  })()}
                </p>
                <button type="button" className="secondary" onClick={clearAll}>
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="sr-state sr-empty">
                <ProductIcon name="inbox" />
                <h2>No open service requests</h2>
                <p>New calls appear here as soon as they are logged.</p>
                <Link className="button" href="/service/tickets/new">
                  <ProductIcon name="plus" />
                  Log a request
                </Link>
              </div>
            )
          ) : view === "board" ? (
            <>
              {list.loading && <p className="sr-refreshing" role="status">Refreshing…</p>}
              <Board items={items} now={now} selected={preview} onPreview={openPreview} onMove={startMove} />
              {list.data?.next_cursor && (
                <p className="sr-muted sr-board-limit">
                  The board shows the {boardLimit} most urgent requests. Use List or a queue to see the rest.
                </p>
              )}
            </>
          ) : view === "list" ? (
            <Table items={items} now={now} hidden={hidden} selected={preview} onPreview={openPreview} />
          ) : (
            <>
              <p className="sr-phone-meta">
                {total ?? items.length} open · urgent first
              </p>
              <PhoneCards items={items} now={now} />
            </>
          )}
        </div>
        {selected && wide && <Preview item={selected} now={now} onClose={closePreview} onMove={(item) => startMove(item)} />}
      </div>
      {view !== "board" && list.data && !list.error && items.length > 0 && (
        <footer className="sr-footer">
          <span>
            {total ?? items.length} {queue === "all_open" ? "open" : ""} {total === 1 ? "request" : "requests"}
            {roomy ? " · urgent first, then oldest received" : ""} · as at {formatWhen(list.data.observed_at, now)}
          </span>
          <span className="sr-pager">
            <span>
              {firstRow}–{firstRow + items.length - 1}
              {total !== undefined ? ` of ${total}` : ""}
            </span>
            <button
              type="button"
              className="secondary sr-icon-button"
              aria-label="Previous page"
              disabled={!cursors.length}
              onClick={() => setCursors((old) => old.slice(0, -1))}
            >
              <ProductIcon name="collapse" />
            </button>
            <button
              type="button"
              className="secondary sr-icon-button"
              aria-label="Next page"
              disabled={!list.data.next_cursor}
              onClick={() => setCursors((old) => [...old, list.data!.next_cursor!])}
            >
              <ProductIcon name="expand" />
            </button>
          </span>
        </footer>
      )}
      {move && <MoveDialog key={move.item.id} item={move.item} target={move.target} onClose={endMove} onMoved={moved} />}
      {filtersOpen && (
        <FiltersPanel
          filters={filters}
          queue={queue}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => navigate({ company_id: next.company_id, site_id: next.site_id, owner_id: next.owner_id })}
        />
      )}
    </section>
  );
}
