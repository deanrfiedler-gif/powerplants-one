"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePlatformResource } from "../../components/platform-resource";
import { Button, ButtonLink } from "../../components/ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterEmpty,
} from "../../components/ui/register-table";
import { ErrorNotice } from "../../components/business-ui";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../shell/secondary-menu";
import { usePublishPageDescription } from "../../shell/page-description";
import {
  inventoryLocation,
  inventoryIdentity,
  inventoryQuantityKeys,
  inventoryQuantityText,
  type InventoryItem,
} from "../inventory-model";
import type { InventoryRead } from "../inventory";
import type { SupplyRecord } from "../model";
import { formatTimestamp } from "../../shell/date-format";
import "./inventory.css";
function Stamp({ value }: { value: string }) {
  return <time dateTime={value}>{formatTimestamp(value)}</time>;
}

const views = [
  ["all", "All items"],
  ["linked", "Linked to products"],
  ["unlinked", "Not linked to a product"],
  ["unknown", "Unknown quantities"],
  ["held", "Held or quarantined"],
  ["partial", "Partial observations"],
];
const labels = {
  on_hand: "On hand",
  available: "Source available",
  reserved: "Source reserved",
  held: "Held or quarantined",
  usable: "Evidenced usable",
};
const notes = {
  on_hand: "Counted or reported by the source",
  available: "The source’s own figure, not a promise",
  reserved: "Live reservation policy is not configured",
  held: "Held or quarantined at the observation",
  usable: "Requires complete usable evidence; not a readiness decision",
};
function Completeness({ item }: { item: InventoryItem }) {
  return (
    <RegisterChip
      tone={
        item.completeness === "Complete"
          ? "positive"
          : item.completeness === "Partial"
            ? "attention"
            : "negative"
      }
    >
      {item.completeness}
    </RegisterChip>
  );
}
function nativeHref(record?: string) {
  return `/supply/stock?native=1&observation=1${record ? `&record=${encodeURIComponent(record)}` : ""}`;
}
function activityHref(r: SupplyRecord) {
  return r.kind === "Supply"
    ? r.data.supply_kind === "Shipment"
      ? `/supply/receipts?record=${r.id}`
      : `/supply/stock?native=1&record=${r.id}`
    : `/supply/${r.kind === "Demand" ? "material-readiness" : r.kind === "Custody" ? "service-stock" : "returns"}?record=${r.id}`;
}

export function InventoryPage() {
  const params = useSearchParams();
  const search = params.get("q") ?? "";
  const [settledSearch, setSettledSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setSettledSearch(search), 200);
    return () => clearTimeout(timer);
  }, [search]);
  const selected = params.get("record"),
    snapshot = params.get("snapshot") === "1",
    tab = params.get("tab") ?? "quantities";
  const recordView = !!selected && !snapshot;
  const [menuOpen, setMenuOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [recordMenuOpen, setRecordMenuOpen] = useState(false);
  const menu = useSecondaryMenu(
    recordView ? recordMenuOpen : menuOpen,
    recordView ? setRecordMenuOpen : setMenuOpen,
  );
  const listQuery = new URLSearchParams({ view: "inventory" });
  for (const k of ["q", "unit", "location", "completeness"])
    if (params.get(k)) listQuery.set(k, params.get(k)!);
  listQuery.set("inventory_view", params.get("view") ?? "all");
  const list = usePlatformResource<InventoryRead>(
    search === settledSearch ? `supply/records?${listQuery}` : null,
  );
  const detail = usePlatformResource<InventoryRead>(
    selected
      ? `supply/records?view=inventory&record=${encodeURIComponent(selected)}`
      : null,
    false,
  );
  const item = detail.data?.selected;
  const isSelected = (candidate: InventoryItem) =>
    !!selected &&
    (candidate.id === selected ||
      (!!item && inventoryIdentity(candidate) === inventoryIdentity(item)));
  const position = item
    ? (list.data?.items.findIndex(
        (i) =>
          i.company_id === item.company_id &&
          i.item === item.item &&
          i.unit === item.unit,
      ) ?? -1)
    : -1;
  const previous = position > 0 ? list.data?.items[position - 1] : undefined;
  const nextItem = position >= 0 ? list.data?.items[position + 1] : undefined;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (item && recordView) heading.current?.focus({ preventScroll: true });
  }, [item, recordView]);
  usePublishPageDescription(
    "Inventory",
    "Read dated source observations. MYOB remains the intended ERP authority. PPO posts no stock movement.",
  );
  function href(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    return `/supply/stock${next.size ? `?${next}` : ""}`;
  }
  function change(changes: Record<string, string | null>, push = false) {
    window.history[push ? "pushState" : "replaceState"](
      null,
      "",
      href(changes),
    );
  }
  function filter(key: string, value: string) {
    change({ [key]: value, record: null, snapshot: null });
    menu.closeOverlay(false);
  }
  const count = list.data
    ? `${list.data.items.length} shown · limit ${list.data.limit}`
    : list.error
      ? "Inventory unavailable"
      : "Reading inventory…";
  const refresh = () => {
    list.reload();
    detail.reload();
  };
  const quantity = (i: InventoryItem, key: keyof InventoryItem["quantities"]) =>
    inventoryQuantityText(i.quantities[key]);
  const menuContent = (
    <>
      <h2 className="iv-menu-heading">Inventory</h2>
      <nav aria-label="Inventory views">
        <ul>
          {views.slice(0, 3).map(([key, label]) => (
            <li key={key}>
              <button
                aria-current={
                  (params.get("view") ?? "all") === key ? "page" : undefined
                }
                onClick={() => filter("view", key)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
        <h3 className="iv-menu-heading">By location</h3>
        <ul>
          {list.data?.locations.map((location) => (
            <li key={location}>
              <button
                aria-current={
                  params.get("location") === location ? "page" : undefined
                }
                onClick={() => filter("location", location)}
              >
                {location}
              </button>
            </li>
          ))}
        </ul>
        <h3 className="iv-menu-heading">Needs attention</h3>
        <ul>
          {views.slice(3).map(([key, label]) => (
            <li key={key}>
              <button
                aria-current={params.get("view") === key ? "page" : undefined}
                onClick={() => filter("view", key)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <p className="iv-menu-note">
        No product links are recorded. Items are shown from Supply observations.
      </p>
      <Link className="iv-menu-note" href="/supply/service-stock">
        Service stock custody
      </Link>
    </>
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-inventory"
      name="Inventory"
      menuId="inventory-menu"
      contentId="inventory-content"
      attributes={{
        "data-ppo-workspace": "shared",
        "data-record": recordView ? "true" : undefined,
      }}
      menu={menuContent}
      message={
        recordView
          ? item
            ? `${item.title} · ${item.completeness}`
            : "Reading item…"
          : count
      }
      phoneHeader={{
        record: recordView
          ? {
              position:
                position >= 0
                  ? `${position + 1} of ${list.data!.items.length} shown`
                  : undefined,
              previous: previous
                ? {
                    label: "Previous item",
                    onSelect: () => change({ record: previous.id }, true),
                  }
                : undefined,
              next: nextItem
                ? {
                    label: "Next item",
                    onSelect: () => change({ record: nextItem.id }, true),
                  }
                : undefined,
            }
          : undefined,
        title: recordView ? (item?.title ?? "Inventory item") : "Inventory",
        count: recordView ? undefined : list.data?.items.length,
      }}
    >
      {!recordView && (
        <>
          <h1 className="iv-sr">Inventory</h1>
          <div className="iv-phone-toolbar">
            <Button onClick={(e) => menu.toggle(e.currentTarget)}>
              All items
            </Button>
            <span>{count}</span>
            <Button
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Search and filter
            </Button>
          </div>
          {snapshot && selected && (
            <div className="iv-selection-toolbar">
              <ButtonLink href={href({ snapshot: null })}>Open item</ButtonLink>
              <Button disabled>Open product</Button>
              <span>1 selected</span>
              <Button
                onClick={() => change({ record: null, snapshot: null }, true)}
              >
                Hide panel
              </Button>
            </div>
          )}
          <div
            className={`iv-toolbar${snapshot && selected ? " iv-selection-hidden" : ""}`}
            data-phone-open={filtersOpen || undefined}
          >
            <label className="iv-search">
              <span className="iv-sr">Search inventory</span>
              <input
                type="search"
                placeholder="Search inventory"
                value={params.get("q") ?? ""}
                onChange={(e) => filter("q", e.target.value)}
              />
            </label>
            <label>
              <span className="iv-sr">Location</span>
              <select
                aria-label="Location"
                value={params.get("location") ?? ""}
                onChange={(e) => filter("location", e.target.value)}
              >
                <option value="">Location</option>
                {list.data?.locations.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="iv-sr">Unit</span>
              <select
                aria-label="Unit"
                value={params.get("unit") ?? ""}
                onChange={(e) => filter("unit", e.target.value)}
              >
                <option value="">Unit</option>
                {list.data?.units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="iv-sr">Completeness</span>
              <select
                aria-label="Completeness"
                value={params.get("completeness") ?? ""}
                onChange={(e) => filter("completeness", e.target.value)}
              >
                <option value="">Completeness</option>
                {["Complete", "Partial", "Unavailable"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <span className="iv-count">{count}</span>
            {list.data?.can_record && (
              <ButtonLink
                variant="primary"
                aria-label="Record observation"
                href={nativeHref()}
              >
                Observation
              </ButtonLink>
            )}
            <Button onClick={refresh} aria-label="Refresh inventory">
              ↻
            </Button>
          </div>
          {(params.get("q") ||
            params.get("unit") ||
            params.get("location") ||
            params.get("completeness") ||
            (params.get("view") && params.get("view") !== "all")) && (
            <div className="iv-filter-status">
              <Button
                variant="quiet"
                onClick={() =>
                  change({
                    q: null,
                    unit: null,
                    location: null,
                    completeness: null,
                    view: null,
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          )}
          <ErrorNotice error={list.error} />
          {list.loading && (
            <p className="iv-message" role="status">
              Loading permitted inventory…
            </p>
          )}
          {list.error && <Button onClick={list.reload}>Retry read</Button>}
          {list.data && (
            <div
              className={`iv-register-layout${selected ? " iv-snapshot-open" : ""}`}
            >
              <div className="iv-results">
                <div className="iv-desktop-grid">
                  <RegisterTable
                    caption="Inventory items. Open an item to review observations, or select its snapshot."
                    empty={
                      !list.data.items.length && (
                        <RegisterEmpty title="No items match">
                          Clear filters or record a source observation.
                        </RegisterEmpty>
                      )
                    }
                  >
                    <thead>
                      <tr>
                        <th scope="col">
                          <span className="iv-sr">Snapshot</span>
                        </th>
                        <th scope="col">Item</th>
                        <th scope="col">Unit</th>
                        {[
                          "On hand",
                          "Available",
                          "Reserved",
                          "Held",
                          "Usable",
                          "Completeness",
                          "Observed",
                        ].map((l) => (
                          <th scope="col" key={l}>
                            {l}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {list.data.items.map((i) => (
                        <tr
                          key={i.id}
                          data-selected={isSelected(i) || undefined}
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Snapshot ${i.title}`}
                              checked={isSelected(i)}
                              onChange={() =>
                                change(
                                  {
                                    record: isSelected(i) ? null : i.id,
                                    snapshot: isSelected(i) ? null : "1",
                                  },
                                  true,
                                )
                              }
                            />
                          </td>
                          <td>
                            <Link
                              href={href({
                                record: i.id,
                                snapshot: null,
                                tab: null,
                              })}
                            >
                              {i.title}
                            </Link>
                          </td>
                          <td>{i.unit}</td>
                          {inventoryQuantityKeys.map((k) => (
                            <td
                              key={k}
                              className={
                                i.quantities[k] === null
                                  ? "iv-unknown"
                                  : "iv-number"
                              }
                            >
                              {quantity(i, k)}
                            </td>
                          ))}
                          <td>
                            <Completeness item={i} />
                          </td>
                          <td>
                            <Stamp value={i.observed_at} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <div className="iv-phone-list">
                  {list.data.items.map((i) => (
                    <article key={i.id}>
                      <Link
                        href={href({ record: i.id, snapshot: null, tab: null })}
                      >
                        <strong>{i.title}</strong>
                        <span>
                          {i.item} · {i.unit}
                        </span>
                        <span>
                          On hand {quantity(i, "on_hand")} · Available{" "}
                          {quantity(i, "available")}
                        </span>
                      </Link>
                      <Completeness item={i} />
                      <small>
                        Observed <Stamp value={i.observed_at} />
                      </small>
                    </article>
                  ))}
                  {!list.data.items.length && (
                    <RegisterEmpty title="No items match">
                      Clear filters to recover the permitted list.
                    </RegisterEmpty>
                  )}
                </div>
                <p className="iv-footnote">
                  {count}. This bounded read is not the whole stock list.
                  Quantities combine distinct permitted locations at their
                  recorded times; the latest observation time is shown. Unknown
                  is never shown as 0. MYOB remains the intended ERP authority;
                  PPO posts no stock movement.
                </p>
                {list.data.source_scan_limited && (
                  <p className="iv-warning">
                    Source read is partial. Quantities remain Unknown until a
                    complete item read is available.
                  </p>
                )}
              </div>
              {selected && (
                <aside className="iv-snapshot" aria-label="Inventory snapshot">
                  <Button
                    variant="quiet"
                    onClick={() =>
                      change({ record: null, snapshot: null }, true)
                    }
                  >
                    Close snapshot
                  </Button>
                  {detail.loading && <p role="status">Loading item…</p>}
                  <ErrorNotice error={detail.error} />
                  {detail.error && (
                    <Button onClick={detail.reload}>Retry read</Button>
                  )}
                  {item && (
                    <>
                      <h2>{item.title}</h2>
                      <p>
                        {item.item} · {item.unit}
                      </p>
                      <Completeness item={item} />
                      <p>No link recorded</p>
                      <p className="iv-muted">
                        A product link has not been recorded.
                      </p>
                      <dl>
                        {inventoryQuantityKeys.map((k) => (
                          <div key={k}>
                            <dt>{labels[k]}</dt>
                            <dd>
                              {inventoryQuantityText(
                                item.quantities[k],
                                item.unit,
                              )}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <p>
                        Observed <Stamp value={item.observed_at} />
                      </p>
                      <Link href={href({ snapshot: null })}>
                        Open item record
                      </Link>
                    </>
                  )}
                </aside>
              )}
            </div>
          )}
        </>
      )}
      {recordView && (
        <>
          <div className="iv-record-top">
            <Button
              variant="quiet"
              onClick={() =>
                change({ record: null, snapshot: null, tab: null }, true)
              }
            >
              Back to inventory
            </Button>
            <Button onClick={refresh} aria-label="Retry read">
              Retry read
            </Button>
          </div>
          {detail.loading && (
            <p className="iv-message" role="status">
              Loading exact item and source observations…
            </p>
          )}
          <ErrorNotice error={detail.error} />
          {item && (
            <>
              <header className="iv-record-header">
                <div>
                  <h1 ref={heading} tabIndex={-1}>
                    {item.title} <Completeness item={item} />
                  </h1>
                  <p>
                    {item.item} · Unit {item.unit}
                    <span className="iv-company"> · {item.company_name}</span>
                  </p>
                </div>
                <div className="iv-record-actions">
                  <nav
                    className="iv-position"
                    aria-label="Inventory item navigation"
                  >
                    {position >= 0 && (
                      <span>
                        {position + 1} of {list.data!.items.length} shown
                      </span>
                    )}
                    {previous && (
                      <Link
                        href={href({ record: previous.id })}
                        aria-label="Previous item"
                      >
                        ←
                      </Link>
                    )}
                    {nextItem && (
                      <Link
                        href={href({ record: nextItem.id })}
                        aria-label="Next item"
                      >
                        →
                      </Link>
                    )}
                  </nav>
                  <Button disabled title="No product link is recorded">
                    Open product
                  </Button>
                  {detail.data?.can_record && (
                    <ButtonLink variant="primary" href={nativeHref(item.id)}>
                      Record observation
                    </ButtonLink>
                  )}
                </div>
              </header>
              <div className="iv-phone-observation">
                <Completeness item={item} />
                <span>
                  Observed <Stamp value={item.observed_at} />
                </span>
              </div>
              <div className="iv-product-strip">
                <strong>Product</strong>
                <span>No link recorded</span>
                <span className="iv-muted">
                  No product match is inferred from name, SKU or family.
                </span>
              </div>
              <div className="iv-record-body">
                <aside className="iv-context">
                  <h2>Item</h2>
                  <dl>
                    <div>
                      <dt>Reference</dt>
                      <dd>{item.item}</dd>
                    </div>
                    <div>
                      <dt>Unit</dt>
                      <dd>{item.unit}</dd>
                    </div>
                    <div>
                      <dt>Company</dt>
                      <dd>{item.company_name}</dd>
                    </div>
                  </dl>
                  <h2>Observation</h2>
                  <dl>
                    <div>
                      <dt>Latest observed</dt>
                      <dd>
                        <Stamp value={item.observed_at} />
                      </dd>
                    </div>
                    <div>
                      <dt>Completeness</dt>
                      <dd>{item.completeness}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>{item.observations[0].source_reference}</dd>
                    </div>
                    <div>
                      <dt>Record owner</dt>
                      <dd>{item.observations[0].owner_name}</dd>
                    </div>
                  </dl>
                  <h2>Product link</h2>
                  <p>No link recorded</p>
                  <p className="iv-muted">No Product mapping is inferred.</p>
                </aside>
                <div className="iv-record-main">
                  <nav className="iv-tabs" aria-label="Item views">
                    {[
                      "quantities",
                      "locations",
                      "demand",
                      "activity",
                      "source",
                    ].map((t) => (
                      <Button
                        key={t}
                        variant="quiet"
                        aria-pressed={tab === t}
                        onClick={() => change({ tab: t }, true)}
                      >
                        {t === "source"
                          ? "Source evidence"
                          : t[0].toUpperCase() + t.slice(1)}
                      </Button>
                    ))}
                  </nav>
                  <div className="iv-tab-content">
                    {tab === "quantities" && (
                      <>
                        <h2>Quantities</h2>
                        <p className="iv-muted iv-quantity-date">
                          Observed <Stamp value={item.observed_at} /> · latest
                          source time · each meaning is in its own row
                        </p>
                        {(item.completeness === "Unavailable" ||
                          item.ambiguous_locations ||
                          detail.data?.source_scan_limited) && (
                          <p className="iv-warning">
                            Quantities are Unknown.{" "}
                            {item.ambiguous_locations
                              ? "Overlapping or missing location evidence cannot establish a total."
                              : "The source observation is unavailable or incomplete."}{" "}
                            Unknown is never shown as 0.
                          </p>
                        )}
                        <div className="iv-phone-quantities">
                          {item.completeness !== "Unavailable" &&
                            inventoryQuantityKeys.map((k) => (
                              <div key={k}>
                                <strong>
                                  {inventoryQuantityText(
                                    item.quantities[k],
                                    item.unit,
                                  )}{" "}
                                  {labels[k].toLowerCase()}
                                </strong>
                                <small>{notes[k]}</small>
                              </div>
                            ))}
                        </div>
                        <div className="iv-quantity-table">
                          <RegisterTable
                            variant="panel"
                            caption="Observed quantities and their separate meanings"
                          >
                            <thead>
                              <tr>
                                <th>Meaning</th>
                                <th>Quantity</th>
                                <th>Basis</th>
                                <th>Note</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inventoryQuantityKeys.map((k) => (
                                <tr key={k}>
                                  <td>{labels[k]}</td>
                                  <td>
                                    {inventoryQuantityText(
                                      item.quantities[k],
                                      item.unit,
                                    )}
                                  </td>
                                  <td>
                                    {item.quantities[k] === null
                                      ? "Evidence required"
                                      : "Source observation"}
                                  </td>
                                  <td className="ppo-register-wrap">
                                    {notes[k]}
                                  </td>
                                </tr>
                              ))}
                              <tr>
                                <td>Incoming allocation</td>
                                <td>
                                  {detail.data?.source_scan_limited
                                    ? "Unknown"
                                    : detail.data?.allocations
                                        .filter((a) => a.basis === "Incoming")
                                        .map((a) => `${a.quantity} ${a.unit}`)
                                        .join(" + ") || "None recorded"}
                                </td>
                                <td>PPO allocation</td>
                                <td className="ppo-register-wrap">
                                  Not a source reservation; coordination only
                                </td>
                              </tr>
                            </tbody>
                          </RegisterTable>
                        </div>
                        <section className="iv-mobile-product">
                          <h2>Product and locations</h2>
                          <p>No link recorded</p>
                          <p className="iv-muted">
                            No match by name, SKU or family
                          </p>
                        </section>
                        <Locations item={item} />
                        <Demand data={detail.data!} />
                      </>
                    )}
                    {tab === "locations" && <Locations item={item} />}
                    {tab === "demand" && <Demand data={detail.data!} />}
                    {tab === "activity" && (
                      <>
                        <h2>Activity</h2>
                        <p className="iv-muted">
                          Supply records mentioning this exact company, item and
                          unit. Evidence history, not a ledger. PPO posts no
                          stock movement.
                        </p>
                        <ol className="iv-activity">
                          {detail.data?.activity.map((r) => (
                            <li key={r.id}>
                              <h3>
                                <Link href={activityHref(r)}>{r.title}</Link>
                              </h3>
                              <p>
                                {r.kind} · {r.reference} · version {r.version}
                              </p>
                              <p>
                                <Stamp value={r.observed_at} /> ·{" "}
                                {r.completeness}
                              </p>
                              <p>{r.source_reference}</p>
                            </li>
                          ))}
                        </ol>
                      </>
                    )}
                    {tab === "source" && (
                      <>
                        <h2>Source evidence</h2>
                        <p className="iv-muted">
                          Current native source observations; revisions and
                          attachments remain in their original records.
                        </p>
                        {item.observations.map((o) => (
                          <section className="iv-source" key={o.id}>
                            <h3>
                              <Link href={activityHref(o)}>{o.reference}</Link>
                            </h3>
                            <p>
                              {inventoryLocation(o)} · version {o.version} ·{" "}
                              <Stamp value={o.observed_at} />
                            </p>
                            <p>{o.source_reference}</p>
                            <p>
                              Record owner: {o.owner_name} · {o.completeness}
                            </p>
                            <p>
                              {o.external_key
                                ? Object.values(o.external_key).join(" / ")
                                : "No external source key recorded"}
                            </p>
                          </section>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </SecondaryMenuFrame>
  );
}
function Locations({ item }: { item: InventoryItem }) {
  return (
    <section className="iv-locations">
      <h2>Locations</h2>
      <p className="iv-muted">
        Flat observation rows · units as recorded · no location management
      </p>
      <RegisterTable variant="panel" caption="Source observations by location">
        <thead>
          <tr>
            <th>Location</th>
            <th>On hand</th>
            <th>Observed</th>
            <th>Basis</th>
          </tr>
        </thead>
        <tbody>
          {item.observations.map((o) => (
            <tr key={o.id}>
              <td className="ppo-register-wrap">{inventoryLocation(o)}</td>
              <td>
                {inventoryQuantityText(
                  o.completeness === "Unavailable" ? null : o.data.on_hand,
                  o.unit,
                )}
              </td>
              <td>
                <Stamp value={o.observed_at} />
              </td>
              <td>
                <Link href={activityHref(o)}>
                  Source observation · v{o.version}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </RegisterTable>
    </section>
  );
}
function Demand({ data }: { data: InventoryRead }) {
  return (
    <section className="iv-demand">
      <h2>Linked demand</h2>
      <p className="iv-muted">
        Readiness is reviewed in Material demand; this item view makes no
        job-readiness decision.
      </p>
      {data.allocations.map((a) => (
        <p key={a.id}>
          <Link href={`/supply/material-readiness?record=${a.demand_id}`}>
            {a.demand_title}
          </Link>{" "}
          · {a.quantity} {a.unit} · {a.basis} · Readiness Unknown
        </p>
      ))}
      {data.source_scan_limited ? (
        <p>Demand evidence is partial; further allocations are Unknown.</p>
      ) : (
        !data.allocations.length && (
          <p>No permitted demand allocation recorded.</p>
        )
      )}
    </section>
  );
}
