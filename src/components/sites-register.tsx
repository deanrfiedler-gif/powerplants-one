"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCrmResource, denied } from "./crm-state";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { ProductIcon } from "./product-icons";
import { Button } from "./ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterChip,
  RegisterFooter,
} from "./ui/register-table";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import {
  siteViews,
  siteSorts,
  type SitesData,
  type SiteRow,
  type SiteView,
} from "../shared/sites-model";
import { formatDateTime } from "../shell/date-format";

const columns = {
  name: "Site",
  customer: "Customer",
  location: "Location",
  readiness: "Site readiness",
  biosecurity: "Biosecurity",
  areas: "Areas",
  equipment: "Equipment",
  next_visit: "Next visit",
  contact: "Primary contact",
  timezone: "Time zone",
};
const readinessOptions = [
  { id: "", label: "Any readiness" },
  { id: "Upcoming", label: "Upcoming visit" },
  { id: "None", label: "No upcoming permitted visit" },
  { id: "Restricted", label: "Visit access restricted" },
];
export function SiteReadiness({ site }: { site: SiteRow }) {
  return (
    <RegisterChip
      tone={
        site.next_visit || site.visits_state === "Restricted"
          ? "attention"
          : "neutral"
      }
      icon={<ProductIcon name={site.next_visit ? "warning" : "info"} />}
    >
      {site.readiness}
    </RegisterChip>
  );
}
export function SitesReadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: unknown;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="sites-loading" role="status">
        <p>
          <ProductIcon name="clock" /> Loading permitted sites…
        </p>
        <small>Current results unconfirmed</small>
        <div aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="sites-skeleton" key={i}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      </div>
    );
  if (!error) return null;
  return (
    <div className="sites-failure" role="alert">
      <ProductIcon name={denied(error) ? "lock" : "warning"} />
      <h2>
        {denied(error)
          ? "Sites unavailable with this access"
          : "Could not load sites"}
      </h2>
      <p>
        {denied(error)
          ? "The record may be unavailable or your access may have changed."
          : "Current results are unconfirmed. Try loading the permitted sites again."}
      </p>
      <Button onClick={retry}>Retry loading</Button>
    </div>
  );
}
export function SitesRegister() {
  const params = useSearchParams();
  return (
    <Register
      key={params.toString()}
      query={new URLSearchParams(params.toString())}
    />
  );
}
function Register({ query }: { query: URLSearchParams }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(true),
    [filterOpen, setFilterOpen] = useState(false),
    [search, setSearch] = useState(query.get("q") ?? ""),
    [selected, setSelected] = useState<string[]>([]),
    [shown, setShown] = useState(Object.keys(columns)),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const request = new URLSearchParams();
  for (const key of [
    "view",
    "q",
    "customer_id",
    "readiness",
    "sort",
    "direction",
  ])
    if (query.has(key)) request.set(key, query.get(key)!);
  if (cursors.at(-1)) request.set("cursor", cursors.at(-1)!);
  const resource = useCrmResource<SitesData>(`sites/register?${request}`, true),
    data = resource.data;
  const view = Object.hasOwn(siteViews, query.get("view") ?? "")
    ? (query.get("view") as SiteView)
    : "All";
  const customerOptions = [
    { id: "", label: "All customers" },
    ...(data?.customers ?? []),
  ];
  const sort = query.get("sort") ?? "name",
    descending = query.get("direction") === "desc";
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [k, v] of Object.entries(values)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`/sites?${next}`, { scroll: false });
  }
  const href = (id: string) =>
    `/sites/${id}?${new URLSearchParams({ from: query.toString(), ...(query.has("department") ? { department: query.get("department")! } : {}) })}`;
  function cell(row: SiteRow, key: string) {
    if (key === "name")
      return (
        <Link prefetch={false} href={href(row.id)}>
          <strong>{row.display_name}</strong>
          <small>{row.display_number}</small>
        </Link>
      );
    if (key === "customer")
      return row.customers.length ? (
        <Link href={`/customers/${row.customers[0].id}`}>
          {row.customers[0].name}
          {row.customers.length > 1 ? ` +${row.customers.length - 1}` : ""}
        </Link>
      ) : (
        "Not recorded"
      );
    if (key === "location") return row.location_description ?? "Not recorded";
    if (key === "readiness")
      return (
        <Link href={`/sites/${row.id}/readiness`}>
          <SiteReadiness site={row} />
        </Link>
      );
    if (key === "biosecurity")
      return (
        <RegisterChip tone={row.biosecurity_recorded ? "neutral" : "attention"}>
          {row.biosecurity_recorded ? "Recorded" : "Unknown"}
        </RegisterChip>
      );
    if (key === "areas" || key === "equipment")
      return <Link href={`${href(row.id)}&tab=${key}`}>{row[key]}</Link>;
    if (key === "next_visit")
      return row.next_visit ? (
        <Link href={`/service/appointments/${row.next_visit.id}`}>
          {formatDateTime(row.next_visit.start_at, row.timezone)}
        </Link>
      ) : row.visits_state === "Restricted" ? (
        "Restricted"
      ) : (
        "None in permitted visits"
      );
    if (key === "contact")
      return row.primary_contact ? (
        <Link href={`/people/${row.primary_contact.id}`}>
          {row.primary_contact.name}
        </Link>
      ) : (
        "Not recorded"
      );
    return row.timezone;
  }
  const filters = (
    <>
      <label htmlFor="sites-search">Search sites</label>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          change({ q: search });
        }}
      >
        <input
          id="sites-search"
          type="search"
          value={search}
          maxLength={200}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button type="submit">Search</Button>
      </form>
      <label htmlFor="sites-customer">Customer</label>
      <select
        id="sites-customer"
        value={query.get("customer_id") ?? ""}
        onChange={(e) => change({ customer_id: e.target.value })}
      >
        {customerOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <label htmlFor="sites-readiness">Readiness</label>
      <select
        id="sites-readiness"
        value={query.get("readiness") ?? ""}
        onChange={(e) => change({ readiness: e.target.value })}
      >
        {readinessOptions.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
      <p>
        Readiness to confirm lists upcoming permitted visits. Customer
        confirmation (P4) is not available here; check Access & readiness.
      </p>
      <Button
        variant="quiet"
        onClick={() => change({ q: "", customer_id: "", readiness: "" })}
      >
        Clear filters
      </Button>
    </>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-sites"
      name="Sites"
      menuId="sites-menu"
      contentId="sites-content"
      state={menu}
      phoneHeader={{
        title: siteViews[view],
        count: data?.total,
        pageAction: {
          label: "Search sites", icon: "search", search: true,
          onSelect: () => setFilterOpen(true),
        },
        filter: {
          open: () => setFilterOpen(true),
          applied: !!(query.get("q") || query.get("customer_id") || query.get("readiness")),
          searchAndFilter: () => setFilterOpen(true),
        },
      }}
      message={
        data ? `${data.total} permitted sites` : "Current results unconfirmed"
      }
      menu={
        <>
          <nav aria-label="Shared records">
            <Link href="/customers"><ProductIcon name="customers" /><span>Organisations</span></Link>
            <Link href="/people"><ProductIcon name="person" /><span>People</span></Link>
          </nav>
          <h2>Sites</h2>
          <nav aria-label="Sites views">
            {Object.entries(siteViews).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-current={view === key ? "page" : undefined}
                onClick={() => {
                  change({ view: key });
                  menu.closeOverlay();
                }}
              >
                <ProductIcon name={key === "All" ? "sites" : key === "Readiness" ? "warning" : "info"} /><span>{label}</span>
                {data && <small>{data.counts[key as SiteView]}</small>}
              </button>
            ))}
          </nav>
          <h2>Related</h2>
          <nav aria-label="Related records">
            <Link href="/facilities"><ProductIcon name="nav-facilities" /><span>Facilities & growing areas</span></Link>
            <Link href="/surveys"><ProductIcon name="work" /><span>Site surveys & as-found</span></Link>
            <Link href="/equipment"><ProductIcon name="nav-equipment" /><span>Equipment</span></Link>
          </nav>
        </>
      }
    >
      <div className="sites-register">
        <h1 className="sr-only">Sites</h1>
        <div className="sites-toolbar">
          <WorklistChoice
            label="Customer"
            value={query.get("customer_id") ?? ""}
            options={customerOptions}
            onChange={(id) => change({ customer_id: id })}
            icon="customers"
          />
          <WorklistChoice
            label="Readiness"
            value={query.get("readiness") ?? ""}
            options={readinessOptions}
            onChange={(id) => change({ readiness: id })}
            icon="filter"
          />
          <p className="sites-read-time">
            {data
              ? `${data.total} sites · as at ${formatDateTime(data.observed_at)}`
              : "Current results unconfirmed"}
          </p>
          <Button
            variant="quiet"
            aria-label="Search and filter sites"
            onClick={() => setFilterOpen(true)}
          >
            <ProductIcon name="search" />
          </Button>
          <Button
            variant="quiet"
            aria-label="Refresh sites"
            onClick={() => {
              setSelected([]);
              resource.reload();
            }}
          >
            <ProductIcon name="changes" />
          </Button>
          <WorklistMenu label="Sites options" icon="more">
            <p>
              Permitted synthetic records only. Counts use the current search
              and filters.
            </p>
            <Button variant="quiet" onClick={() => setSelected([])}>
              Clear selection
            </Button>
          </WorklistMenu>
        </div>
        <SitesReadState
          loading={resource.loading}
          error={resource.error}
          retry={resource.reload}
        />
        {data &&
          (data.items.length ? (
            <>
              <div className="sites-desktop-grid">
                <RegisterTable caption="Permitted sites. Open a site by its name; selection does not perform a business action.">
                  <thead>
                    <tr>
                      <th className="sites-pin-check">
                        <input
                          type="checkbox"
                          aria-label="Select all sites on this page"
                          checked={
                            !!data.items.length &&
                            data.items.every((r) => selected.includes(r.id))
                          }
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? data.items.map((r) => r.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      {Object.entries(columns)
                        .filter(([key]) => shown.includes(key))
                        .map(([key, label]) =>
                          siteSorts.some((s) => s === key) ? (
                            <RegisterSortHeader
                              key={key}
                              className={`sites-col-${key}`}
                              label={label}
                              direction={
                                sort === key
                                  ? descending
                                    ? "descending"
                                    : "ascending"
                                  : undefined
                              }
                              onSort={() =>
                                change({
                                  sort: key,
                                  direction:
                                    sort === key && !descending
                                      ? "desc"
                                      : "asc",
                                })
                              }
                            />
                          ) : (
                            <th
                              scope="col"
                              className={`sites-col-${key}`}
                              key={key}
                            >
                              {label}
                            </th>
                          ),
                        )}
                      <th className="sites-pin-actions">
                        <WorklistMenu label="Site grid columns" icon="settings">
                          {Object.entries(columns).map(([key, label]) => (
                            <label key={key}>
                              <input
                                type="checkbox"
                                checked={shown.includes(key)}
                                disabled={key === "name"}
                                onChange={(e) =>
                                  setShown((s) =>
                                    e.target.checked
                                      ? [...s, key]
                                      : s.filter((c) => c !== key),
                                  )
                                }
                              />
                              {label}
                            </label>
                          ))}
                        </WorklistMenu>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((row) => (
                      <tr
                        key={row.id}
                        data-selected={selected.includes(row.id) || undefined}
                      >
                        <td className="sites-pin-check">
                          <input
                            type="checkbox"
                            aria-label={`Select ${row.display_name}`}
                            checked={selected.includes(row.id)}
                            onChange={(e) =>
                              setSelected((s) =>
                                e.target.checked
                                  ? [...s, row.id]
                                  : s.filter((id) => id !== row.id),
                              )
                            }
                          />
                        </td>
                        {Object.keys(columns)
                          .filter((k) => shown.includes(k))
                          .map((key) => (
                            <td key={key} className={`sites-col-${key}`}>
                              {cell(row, key)}
                            </td>
                          ))}
                        <td className="sites-pin-actions">
                          <WorklistMenu
                            label={`Actions for ${row.display_name}`}
                            icon="more"
                            choices
                          >
                            <Link role="menuitem" href={href(row.id)}>
                              Open site
                            </Link>
                            <Link
                              role="menuitem"
                              href={`/sites/${row.id}/readiness`}
                            >
                              Access & readiness
                            </Link>
                          </WorklistMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RegisterTable>
              </div>
              <div className="sites-phone-list">
                {data.items.map((row) => (
                  <article key={row.id}>
                    <Link href={href(row.id)}>
                      <div>
                        <strong>{row.display_name}</strong>
                        <small>
                          {row.next_visit
                            ? formatDateTime(
                                row.next_visit.start_at,
                                row.timezone,
                              )
                            : row.visits_state === "Restricted"
                              ? "Visit restricted"
                              : "None booked in permitted visits"}
                        </small>
                      </div>
                      <p>
                        {row.customers[0]?.name ?? "Customer not recorded"} ·{" "}
                        {row.location_description ?? "Location not recorded"}
                      </p>
                      <small className="sites-phone-reference">
                        {row.display_number}
                      </small>
                      <div className="sites-phone-status">
                        <ProductIcon
                          name={
                            !row.address_recorded ||
                            !row.biosecurity_recorded ||
                            row.next_visit
                              ? "warning"
                              : "info"
                          }
                        />
                        {!row.address_recorded
                          ? "Address to review before booking"
                          : !row.biosecurity_recorded
                            ? "Biosecurity unknown"
                            : row.readiness}
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="sites-empty">
              <ProductIcon name="search" />
              <h2>No matching sites</h2>
              <p>No permitted sites match this search and these filters.</p>
              <Button
                onClick={() =>
                  change({ q: "", customer_id: "", readiness: "", view: "All" })
                }
              >
                Clear the search
              </Button>
            </div>
          ))}
        {data && (
          <RegisterFooter>
            <span>
              {selected.filter((id) => data.items.some((r) => r.id === id))
                .length
                ? `${selected.length} selected · `
                : ""}
              {data.items.length} of {data.total} permitted sites
            </span>
            <Button
              variant="quiet"
              disabled={cursors.length === 1}
              onClick={() => {
                setSelected([]);
                setCursors((c) => c.slice(0, -1));
              }}
            >
              Previous
            </Button>
            <Button
              variant="quiet"
              disabled={!data.next_cursor}
              onClick={() => {
                setSelected([]);
                setCursors((c) => [...c, data.next_cursor]);
              }}
            >
              Next
            </Button>
            <small>
              Counts are permitted records. P4 confirmation unavailable.
            </small>
          </RegisterFooter>
        )}
        {filterOpen && (
          <WorklistPanel
            title="Search and filter sites"
            onClose={() => setFilterOpen(false)}
          >
            {filters}
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
