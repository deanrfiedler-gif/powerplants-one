"use client";
// Service requests — accepted, SV-01/SV-02. Shared shell and current server authority.
import Link from "next/link";
import { SecondaryMenuFrame, useSecondaryMenu } from "../../../shell/secondary-menu";
import { TicketRecord, ServiceDialog } from "./ticket-record";
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
import { Board, columns, MoveDialog, PhoneCards, Table, type ColumnKey } from "./ticket-register-parts";

type Queues = Record<QueueKey, number> & { as_at: string };
type Filters = {
  q: string;
  company_id: string;
  site_id: string;
  owner_id: string;
  priority: string;
};
const filterKeys = ["company_id", "site_id", "owner_id", "priority"] as const;
const queues: {
  key: QueueKey;
  label: string;
  short: string;
  tone?: "danger";
}[] = [
  { key: "all_open", label: "All open", short: "All open" },
  { key: "my_requests", label: "My requests", short: "Mine" },
  { key: "new", label: "New to triage", short: "New" },
  { key: "urgent", label: "Urgent", short: "Urgent" },
  {
    key: "needs_information",
    label: "Needs information",
    short: "Information",
  },
  {
    key: "overdue_clarifications",
    label: "Overdue clarifications",
    short: "Overdue",
    tone: "danger",
  },
  { key: "no_work_order", label: "No work order yet", short: "No work order" },
  {
    key: "work_order_linked",
    label: "Work order linked",
    short: "Linked work",
  },
];
const queueIcons = {all_open:"list",my_requests:"person",new:"inbox",urgent:"warning",needs_information:"help",overdue_clarifications:"clock",no_work_order:"documents",work_order_linked:"work",triaged:"check"} as const;
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

function ColumnsMenu({
  hidden,
  toggle,
  compact,
}: {
  hidden: ColumnKey[];
  toggle: (key: ColumnKey) => void;
  compact: boolean;
}) {
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
      <summary
        className={compact ? "button secondary sr-icon-button" : "button secondary"}
        aria-label={compact ? "Columns" : undefined}
      >
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
            <input type="checkbox" checked={!hidden.includes(column.key)} onChange={() => toggle(column.key)} />{" "}
            {column.label}
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
    sites = useResource<Envelope<Option>>(
      draft.company_id ? `sites?${query({ company_id: draft.company_id, limit: "200" })}` : null,
    ),
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
        <button
          type="button"
          className="secondary sr-icon-button"
          aria-label="Close filters"
          onClick={() => dialog.current?.close()}
        >
          <ProductIcon name="close" />
        </button>
        <h2 id="sr-filters-title">Filters</h2>
        <button
          type="button"
          className="secondary sr-quiet"
          onClick={() =>
            setDraft({
              ...draft,
              company_id: "",
              site_id: "",
              owner_id: "",
              priority: "",
            })
          }
        >
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
          onChange={(value) =>
            setDraft({
              ...draft,
              company_id: value,
              site_id: "",
              owner_id: draft.owner_id === p.actor_id ? p.actor_id : "",
            })
          }
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
        <SelectField
          name="sr-filter-priority"
          label="Priority"
          value={draft.priority}
          options={["Urgent", "High", "Normal", "Low"].map((value) => ({
            id: value,
            display_name: value,
          }))}
          empty="Any priority"
          onChange={(value) => setDraft({ ...draft, priority: value })}
        />
        {!draft.company_id && (
          <p className="sr-muted">Choose a company context to filter by another owner or a site.</p>
        )}
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
        {[0, 1, 2, 3, 4, 5].map((row) => (
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
    wide = useMedia("(min-width: 781px)"),
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
    priority: params.get("priority") ?? "",
  };
  const requested = params.get("queue") ?? "all_open",
    queue = (queueKeys.has(requested) ? requested : "all_open") as QueueKey,
    view = wide ? (params.get("view") === "board" ? "board" : "list") : "cards";
  const [menuOpen, setMenuOpen] = useState(true),
    menuState = useSecondaryMenu(menuOpen, setMenuOpen);
  const [search, setSearch] = useState(filters.q),
    [addressQ, setAddressQ] = useState(filters.q),
    [cursors, setCursors] = useState<string[]>([]),
    [preview, setPreview] = useState<string | null>(null),
    [move, setMove] = useState<{
      item: RegisterItem;
      target?: MoveTarget;
    } | null>(null),
    [filtersOpen, setFiltersOpen] = useState(false),
    [feedback, setFeedback] = useState(""),
    [hidden, toggleColumn] = useHiddenColumns();
  // Follow the address when it changes elsewhere (back button, Clear filters), keeping text still being typed.
  if (filters.q !== addressQ) {
    setAddressQ(filters.q);
    if (filters.q !== search.trim()) setSearch(filters.q);
  }
  const returnFocus = useRef<HTMLElement | null>(null),
    [focusTicket, setFocusTicket] = useState<string | null>(null);

  // Reads the current address, not this render's parameters, so a debounced search cannot undo a later change.
  const navigate = (change: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(change)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    setCursors([]);
    setPreview(null);
    menuState.closeOverlay(false);
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
  const filtered = !!(filters.q || filters.company_id || filters.site_id || filters.owner_id || filters.priority),
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
        : document.querySelector<HTMLElement>(
            `[data-ticket-id="${id}"] [data-move]:not([disabled]), [data-ticket-id="${id}"] a`,
          );
      target?.focus();
    });
  };
  const moved = (item: RegisterItem, target: MoveTarget) => {
    setFeedback(
      `${item.display_number}: ${target === "Triaged" ? "triage" : "information request"} saved. The register shows its current stage.`,
    );
    setMove(null);
    setFocusTicket(item.id);
    reload();
  };
  // A saved move remounts the card in its new lane, so focus follows it there once the fresh read lands.
  useEffect(() => {
    if (!focusTicket || list.loading) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(`[data-ticket-id="${focusTicket}"] a`);
      target?.scrollIntoView({ block: "nearest", inline: "nearest" });
      target?.focus();
      setFocusTicket(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusTicket, list.loading, items]);
  const clearAll = () => {
    clearTimeout(searchTimer.current);
    setSearch("");
    navigate({
      q: "",
      company_id: "",
      site_id: "",
      owner_id: "",
      queue: "",
      priority: "",
    });
  };

  // Names for the active filter chips come from the same permitted selectors the panel uses.
  const companies = useResource<Envelope<Option>>(filters.company_id ? "selectors/companies" : null),
    sites = useResource<Envelope<Option>>(
      filters.company_id && filters.site_id ? `sites?${query({ company_id: filters.company_id, limit: "200" })}` : null,
    );
  const chipLabel = (key: (typeof filterKeys)[number]) => {
    if (key === "priority") return `Priority: ${filters.priority}`;
    if (key === "owner_id") return filters.owner_id === p.actor_id ? "Owner: me" : "Owner: selected person";
    const source = key === "company_id" ? companies : sites;
    const name = source.data?.items.find((option) => option.id === filters[key])?.display_name;
    return `${key === "company_id" ? "Company" : "Site"}: ${name ?? "selected"}`;
  };
  const activeFilters = filterKeys.filter((key) => filters[key]);

  if (isDenied(list.error))
    return (
      <section
        id="ppo-service-requests"
        data-module-layout="full-bleed"
        data-module-scope="SV-01"
        aria-label="Service requests"
      >
        <h1 className="sr-only">Service requests</h1>
        <div className="sr-state">
          <ReadState loading={false} error={list.error} retry={list.reload} />
        </div>
      </section>
    );

  const readOnly =
    items.some((item) => item.status !== "Triaged") &&
    items.every((item) => item.status === "Triaged" || !item.can_edit_intake);

  return (
    <SecondaryMenuFrame
      state={menuState}
      id="ppo-service-requests"
      name="Service requests"
      menuId="sv-queues"
      contentId="sv-register"
      message={feedback}
      phoneHeader={{
        title: "Service requests",
        count: total,
        filter: { open: () => setFiltersOpen(true), applied: filtered },
      }}
      attributes={{ "data-module-scope": "SV-01", "data-view": view }}
      menu={
        <nav aria-label="Service request queues">
          {["Requests", "Triage", "After triage"].map((heading, index) => (
            <section key={heading}>
              {index > 0 && <h2>{heading}</h2>}
              <ul>
                {queues
                  .slice(index === 0 ? 0 : index === 1 ? 2 : 6, index === 0 ? 2 : index === 1 ? 6 : 8)
                  .map((entry) => (
                    <li key={entry.key}>
                      <Link
                        href={`/service/tickets?${query({ ...filters, queue: entry.key })}`}
                        aria-current={queue === entry.key ? "page" : undefined}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate({
                            queue: entry.key === "all_open" ? "" : entry.key,
                          });
                        }}
                      >
                        <ProductIcon name={queueIcons[entry.key]}/><span className="sr-queue-label">{entry.label}</span>
                        <span className="mw-badge">{counts.data?.[entry.key] ?? "–"}</span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </nav>
      }
    >
      <h1 className="sr-only">Service requests</h1>
      <div className="sr-toolbar">
        <Link className="button sr-primary" href="/service/tickets/new">
          <ProductIcon name="plus" />
          Log a request
        </Link>
        <label className="sr-toolbar-select">
          <span className="sr-only">Owner</span>
          <select aria-label="Owner" value={filters.owner_id} onChange={(e) => navigate({ owner_id: e.target.value })}>
            <option value="">Owner: Anyone</option>
            <option value={p.actor_id}>Owner: Me</option>
            {[
              ...new Map(
                items
                  .filter((i) => i.triage_owner_id && i.triage_owner_id !== p.actor_id)
                  .map((i) => [i.triage_owner_id!, i.triage_owner_name]),
              ).entries(),
            ].map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="sr-toolbar-select">
          <span className="sr-only">Priority</span>
          <select
            aria-label="Priority"
            value={filters.priority}
            onChange={(e) => navigate({ priority: e.target.value })}
          >
            <option value="">Priority: Any</option>
            {["Urgent", "High", "Normal", "Low"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <div className="sr-segmented" role="group" aria-label="Presentation">
          {(["list", "board"] as const).map((value) => (
            <button
              type="button"
              key={value}
              className="secondary"
              aria-label={value === "list" ? "List" : "Board"}
              aria-pressed={view === value}
              onClick={() => navigate({ view: value === "list" ? "" : value })}
            >
              <ProductIcon name={value} />
            </button>
          ))}
        </div>
        <span className="sr-toolbar-count">
          {list.loading ? "Loading…" : list.error ? "" : `${total ?? items.length} open requests${list.data ? ` · updated ${new Intl.DateTimeFormat("en-AU", {timeStyle:"short",timeZone:"Australia/Brisbane"}).format(new Date(list.data.observed_at))} AEST` : ""}`}
        </span>
        <button className="secondary sr-icon-button" aria-label="Refresh requests" onClick={reload}>
          <ProductIcon name="changes" />
        </button>
        <details
          className="sr-more-menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.currentTarget.open = false;
              e.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary className="button secondary" aria-label="More register actions">
            …
          </summary>
          <div>
            <label className="sr-search">
              <span className="sr-only">Search service requests by title or reference</span>
              <input
                type="search"
                name="sr-search"
                placeholder="Search requests"
                value={search}
                maxLength={200}
                onChange={(e) => typeSearch(e.target.value)}
              />
            </label>
            <button className="secondary" onClick={() => setFiltersOpen(true)}>
              Filters
            </button>
            {view === "list" && <ColumnsMenu hidden={hidden} toggle={toggleColumn} compact={false} />}
          </div>
        </details>
      </div>
      <div className="sr-phone-queue">
        <button className="secondary" onClick={(e) => menuState.toggle(e.currentTarget)}>
          {queues.find((q) => q.key === queue)?.label}
          <ProductIcon name="chevron" />
        </button>
        <span>{total ?? "–"} open</span>
        <button className="secondary sr-icon-button" aria-label="Filters" onClick={() => setFiltersOpen(true)}>
          <ProductIcon name="filter" />
        </button>
      </div>
      {(activeFilters.length > 0 || filters.q) && (
        <div className="sr-filter-chips" aria-label="Active filters">
          {filters.q && (
            <button
              type="button"
              className="secondary"
              aria-label={`Remove search ${filters.q}`}
              onClick={() => {
                clearTimeout(searchTimer.current);
                setSearch("");
                navigate({ q: "" });
              }}
            >
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
            <strong>You can view service requests.</strong> Moving a request needs service request edit permission for
            its site. Move stays visible, disabled, with this reason.
          </p>
        </div>
      )}
      <div className="sr-body" data-preview={selected ? (roomy ? "docked" : "overlay") : undefined}>
        <div className="sr-scroll">
          {list.error ? (
            <div className="sr-state">
              <h2>Could not load service requests</h2>
              <ErrorNotice error={list.error} />
              <p>Nothing was changed. Check the connection and try again.</p>
              <button type="button" className="secondary" onClick={reload}>
                Try again
              </button>
            </div>
          ) : list.loading ? (
            <Skeleton />
          ) : empty ? (
            filtered || queue !== "all_open" ? (
              <div className="sr-state sr-empty">
                <ProductIcon name="search" />
                <h2>No requests match these filters</h2>
                <p>
                  {(() => {
                    const all = filtered ? everything.data?.all_open : counts.data?.all_open;
                    return all === undefined
                      ? "Some open requests may be hidden by the current filters."
                      : `${all} open ${all === 1 ? "request is" : "requests are"} hidden by the current filters.`;
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
              {list.loading && (
                <p className="sr-refreshing" role="status">
                  Refreshing…
                </p>
              )}
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
              <p className="sr-phone-meta">{total ?? items.length} open · urgent first</p>
              <PhoneCards items={items} now={now} />
            </>
          )}
        </div>
        {selected && wide && (
          <ServiceDialog title="Request snapshot" onClose={closePreview}>
            <TicketRecord id={selected.id} snapshot />
          </ServiceDialog>
        )}
      </div>
      <Link className="sr-phone-create" href="/service/tickets/new" aria-label="Log a request">
        <ProductIcon name="plus" />
      </Link>
      {/* On a phone the count sits above the cards, so the footer appears only when there is another page. */}
      {view !== "board" &&
        list.data &&
        !list.error &&
        items.length > 0 &&
        (cursors.length > 0 || !!list.data.next_cursor) && (
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
      {move && (
        <MoveDialog key={move.item.id} item={move.item} target={move.target} onClose={endMove} onMoved={moved} />
      )}
      {filtersOpen && (
        <FiltersPanel
          filters={filters}
          queue={queue}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) =>
            navigate({
              company_id: next.company_id,
              site_id: next.site_id,
              owner_id: next.owner_id,
              priority: next.priority,
            })
          }
        />
      )}
    </SecondaryMenuFrame>
  );
}
