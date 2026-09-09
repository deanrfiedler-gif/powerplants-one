"use client";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { api, ErrorNotice, Field, PageHeader, Stamp } from "./business-ui";
import { denied, useCrmResource } from "./crm-state";
import type {
  DirectoryKind,
  DirectoryRow,
  DirectoryView,
  readDirectory,
} from "../crm/directory";
const columns: Record<DirectoryKind, string[]> = {
  organisations: [
    "name",
    "reference",
    "status",
    "sector",
    "owner",
    "sites",
    "facilities",
    "deals",
  ],
  people: [
    "name",
    "organisations",
    "email",
    "phone",
    "preference",
    "status",
    "deals",
  ],
};
const labels: Record<string, string> = {
  name: "Name",
  reference: "Reference",
  status: "Status",
  sector: "Sector",
  owner: "Relationship owner",
  sites: "Sites",
  facilities: "Facilities",
  deals: "Open deals",
  organisations: "Organisations / roles",
  email: "Email",
  phone: "Phone",
  preference: "Contact preference",
};
const defaults = {
  q: "",
  status: "",
  mine: "false",
  sort: "name",
  direction: "asc",
  limit: "25",
};
export function CrmDirectory({ kind }: { kind: DirectoryKind }) {
  const controlId = useId();
  const [filters, setFilters] = useState(defaults),
    [settled, setSettled] = useState(""),
    [page, setPage] = useState(1),
    [visible, setVisible] = useState(columns[kind]),
    [controls, setControls] = useState(false),
    [viewName, setViewName] = useState(""),
    [selectedView, setSelectedView] = useState(""),
    [saving, setSaving] = useState(false),
    [saveError, setSaveError] = useState<unknown>(null),
    [message, setMessage] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setSettled(filters.q), 200);
    return () => clearTimeout(timer);
  }, [filters.q]);
  const result = useCrmResource<Awaited<ReturnType<typeof readDirectory>>>(
    `crm/directory?${new URLSearchParams({ kind, ...filters, q: settled, page: String(page) })}`,
    true,
  );
  const views = useCrmResource<{ version: number; views: DirectoryView[] }>(
    `crm/directory/views?kind=${kind}`,
    true,
  );
  const title = kind === "people" ? "People" : "Organisations",
    locked = denied(result.error) || denied(views.error) || denied(saveError);
  const change = (key: keyof typeof defaults, value: string) => {
    setFilters((old) => ({ ...old, [key]: value }));
    setPage(1);
    setSelectedView("");
  };
  async function save(remove = false) {
    if (!views.data || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const name = viewName.trim();
      const next = remove
        ? views.data.views.filter((v) => v.name !== selectedView)
        : [
            ...views.data.views.filter((v) => v.name !== name),
            { ...filters, name, columns: visible },
          ];
      await api("crm/directory/views", {
        kind,
        expected_version: views.data.version,
        views: next,
      });
      setMessage(
        remove ? "Saved view removed." : "View saved for your account.",
      );
      setSelectedView(remove ? "" : name);
      views.reload();
    } catch (e) {
      setSaveError(e);
    } finally {
      setSaving(false);
    }
  }
  const apply = (name: string) => {
    const v = views.data?.views.find((v) => v.name === name);
    setSelectedView(name);
    setViewName(name);
    if (v) {
      setFilters({
        q: v.q,
        status: v.status,
        mine: v.mine,
        sort: v.sort,
        direction: v.direction,
        limit: v.limit,
      });
      setVisible(v.columns);
      setPage(1);
    }
  };
  const sort = (key: string) => {
    setFilters((old) => ({
      ...old,
      sort: key,
      direction: old.sort === key && old.direction === "asc" ? "desc" : "asc",
    }));
    setPage(1);
    setSelectedView("");
  };
  function cell(row: DirectoryRow, key: string) {
    switch (key) {
      case "name":
        return (
          <Link
            href={`/${kind === "people" ? "people" : "customers"}/${row.id}`}
          >
            {row.display_name}
          </Link>
        );
      case "reference":
        return row.display_number;
      case "owner":
        return row.owner_name || "Not recorded";
      case "organisations":
        return row.organisations.length ? (
          <ul className="crm-affiliation-list">
            {row.organisations.map((o, i) => (
              <li key={`${o.id}-${i}`}>
                <Link href={`/customers/${o.id}`}>{o.name}</Link>
                <small>{o.role}</small>
              </li>
            ))}
          </ul>
        ) : (
          "No current affiliation"
        );
      case "email":
        return row.email ? (
          <a href={`mailto:${row.email}`}>{row.email}</a>
        ) : (
          "Not recorded"
        );
      case "phone":
        return row.phone ? (
          <a href={`tel:${row.phone.replace(/[^+0-9]/g, "")}`}>{row.phone}</a>
        ) : (
          "Not recorded"
        );
      case "preference":
        return row.contact_preference || "Not recorded";
      case "sites":
      case "facilities":
        return <Link href={`/customers/${row.id}`}>{row[key]}</Link>;
      case "deals":
        return row.deals;
      case "sector":
        return row.sector || "Not recorded";
      case "status":
        return (
          <span
            className={`crm-directory-status status-${row.status.toLowerCase()}`}
          >
            {row.status}
          </span>
        );
      default:
        return null;
    }
  }
  return (
    <section className="crm-directory" aria-label={`${title} directory`}>
      <PageHeader
        eyebrow="CRM · Customer context"
        title={title}
        description={
          kind === "people"
            ? "Customer contacts and their organisation roles."
            : "Customer relationships, sites and facilities."
        }
        action={
          <Link
            className="primary-link"
            href={`/customers/new?kind=${kind === "people" ? "person" : "customer"}`}
          >
            + {kind === "people" ? "Person" : "Organisation"}
          </Link>
        }
      />
      <nav className="record-tabs" aria-label="Customer context sections">
        {[
          ["customers", "Organisations"],
          ["people", "People"],
          ["sites", "Sites"],
          ["equipment", "Equipment"],
        ].map(([path, label]) => (
          <Link
            key={path}
            href={`/${path}`}
            aria-current={
              (kind === "people" ? path === "people" : path === "customers")
                ? "page"
                : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      {locked ? (
        <ErrorNotice error={[result.error, views.error, saveError].find(denied)} />
      ) : (
        <>
          <ErrorNotice error={result.error} />
          <ErrorNotice error={views.error} />
          <ErrorNotice error={saveError} />
        </>
      )}
      {!locked && (
        <>
          <div className="crm-directory-toolbar">
            <Field
              name="context-search"
              type="search"
              label={`Search ${title.toLowerCase()}`}
              value={filters.q}
              onChange={(v) => change("q", v)}
              placeholder={
                kind === "people"
                  ? "Name, organisation, email or phone"
                  : "Name, reference, sector or owner"
              }
            />
            <div className="crm-directory-select">
              <label htmlFor={`${controlId}-status`}>Status</label>
              <select
                id={`${controlId}-status`}
                value={filters.status}
                onChange={(e) => change("status", e.target.value)}
              >
                <option value="">All statuses</option>
                {(kind === "people"
                  ? ["Active", "Inactive"]
                  : ["Prospect", "Active", "Inactive"]
                ).map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
            <div className="crm-directory-select">
              <label htmlFor={`${controlId}-saved-view`}>Saved view</label>
              <select
                id={`${controlId}-saved-view`}
                value={selectedView}
                onChange={(e) => apply(e.target.value)}
              >
                <option value="">Custom view</option>
                {views.data?.views.map((v) => (
                  <option key={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
            <button
              className="secondary"
              aria-expanded={controls}
              aria-controls="crm-directory-options"
              onClick={() => setControls(!controls)}
            >
              Columns and views
            </button>
          </div>
          {controls && (
            <section
              id="crm-directory-options"
              className="crm-directory-options"
            >
              <fieldset>
                <legend>Visible desktop columns</legend>
                {columns[kind].map((key) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={visible.includes(key)}
                      disabled={key === "name"}
                      onChange={(e) =>
                        setVisible((old) =>
                          e.target.checked
                            ? columns[kind].filter(
                                (k) => k === key || old.includes(k),
                              )
                            : old.filter((k) => k !== key),
                        )
                      }
                    />
                    {labels[key]}
                  </label>
                ))}
              </fieldset>
              <div className="crm-directory-view-editor">
                <Field
                  name="view-name"
                  label="View name"
                  value={viewName}
                  onChange={setViewName}
                  maxLength={60}
                />
                <button
                  onClick={() => void save()}
                  disabled={saving || !viewName.trim() || !views.data}
                >
                  Save view
                </button>
                <button
                  className="secondary"
                  onClick={() => void save(true)}
                  disabled={saving || !selectedView}
                >
                  Delete view
                </button>
                {kind === "organisations" && (
                  <label className="crm-check">
                    <input
                      type="checkbox"
                      checked={filters.mine === "true"}
                      onChange={(e) => change("mine", String(e.target.checked))}
                    />
                    Relationships owned by me
                  </label>
                )}
                <button
                  className="secondary"
                  onClick={() => {
                    setFilters(defaults);
                    setVisible(columns[kind]);
                    setPage(1);
                    setSelectedView("");
                  }}
                >
                  Reset view
                </button>
              </div>
            </section>
          )}
          <p role="status">
            {message}
            {(result.loading || settled !== filters.q) &&
              " Loading permitted records…"}
          </p>
          {!!result.error && (
            <button onClick={result.reload}>Retry directory</button>
          )}
          {!!views.error && (
            <button onClick={views.reload}>Reload saved views</button>
          )}
          {result.data && !result.error && settled === filters.q && (
            <>
              <div className="crm-directory-summary">
                <strong>
                  {result.data.total} {title.toLowerCase()}
                </strong>
                <small>
                  Permitted records · As at{" "}
                  <Stamp value={result.data.observed_at} />
                </small>
              </div>
              {!result.data.items.length ? (
                <div className="empty-state">
                  <p>
                    {page > 1
                      ? "This page is empty because the results changed."
                      : "No permitted records match this view."}
                  </p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setFilters(defaults);
                      setPage(1);
                    }}
                  >
                    Show all permitted records
                  </button>
                </div>
              ) : (
                <>
                  <div
                    className="crm-directory-table-scroll"
                    role="region"
                    aria-label={`${title} table — scroll for more columns`}
                    tabIndex={0}
                  >
                    <table className="crm-directory-table">
                      <caption>
                        {title} · page {page}
                      </caption>
                      <thead>
                        <tr>
                          {visible.map((key) => (
                            <th
                              key={key}
                              scope="col"
                              aria-sort={
                                filters.sort === key
                                  ? filters.direction === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : undefined
                              }
                            >
                              {["organisations", "preference"].includes(key) ? (
                                labels[key]
                              ) : (
                                <button onClick={() => sort(key)}>
                                  {labels[key]}
                                  {filters.sort === key ? (
                                    <span aria-hidden="true">
                                      {" "}
                                      {filters.direction === "asc" ? "↑" : "↓"}
                                    </span>
                                  ) : null}
                                </button>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.data.items.map((row) => (
                          <tr key={row.id}>
                            {visible.map((key) =>
                              key === "name" ? (
                                <th key={key} scope="row">
                                  {cell(row, key)}
                                </th>
                              ) : (
                                <td key={key}>{cell(row, key)}</td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ul className="crm-directory-mobile">
                    {result.data.items.map((row) => (
                      <li key={row.id}>
                        <Link
                          className="crm-directory-mobile-main"
                          aria-label={row.display_name}
                          href={`/${kind === "people" ? "people" : "customers"}/${row.id}`}
                        >
                          <strong>{row.display_name}</strong>
                          <span>
                            {kind === "people"
                              ? row.organisations
                                  .map((o) => `${o.name} · ${o.role}`)
                                  .join("; ") || "No current affiliation"
                              : `${row.sector ?? row.display_number} · ${row.sites} sites · ${row.facilities} facilities`}
                          </span>
                          <small>
                            {row.status} · {row.deals} open deals
                          </small>
                        </Link>
                        {kind === "people" && (
                          <div className="crm-mobile-contact-actions">
                            {row.phone && (
                              <a
                                href={`tel:${row.phone.replace(/[^+0-9]/g, "")}`}
                              >
                                Call
                              </a>
                            )}
                            {row.email && (
                              <a href={`mailto:${row.email}`}>Email</a>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <footer className="crm-directory-pagination">
                <span>
                  Page {page} of{" "}
                  {Math.max(
                    1,
                    Math.ceil(result.data.total / Number(filters.limit)),
                  )}
                </span>
                <div className="crm-directory-select">
                  <label htmlFor={`${controlId}-page-size`}>
                    Rows per page
                  </label>
                  <select
                    id={`${controlId}-page-size`}
                    value={filters.limit}
                    onChange={(e) => change("limit", e.target.value)}
                  >
                    {[25, 50, 100].map((n) => (
                      <option key={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <button
                  className="secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous page
                </button>
                <button
                  className="secondary"
                  disabled={page * Number(filters.limit) >= result.data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next page
                </button>
              </footer>
            </>
          )}
        </>
      )}
    </section>
  );
}
