"use client";
import Link from "next/link";
import { useShell } from "./shell-provider";
import { departmentHref } from "../shell/navigation";
import { formatCivilDay, formatDateTime } from "../shell/date-format";
const Stamp = ({ value }: { value: string }) => (
  <time dateTime={value}>
    {value.length === 10 ? formatCivilDay(value) : formatDateTime(value)}
  </time>
);
import { ProductIcon } from "./product-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageHeader, ReadState } from "./business-ui";
import { useCrmResource } from "./crm-state";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterEmpty,
  RegisterFooter,
} from "./ui/register-table";
import { Button, ButtonLink } from "./ui/button";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { OrganisationViews } from "./organisation-views";
import type {
  OrganisationRegisterData,
  OrganisationRegisterRow,
  OrganisationSort,
} from "../shared/organisation-register-model";
import {
  organisationViews,
  organisationSorts,
} from "../shared/organisation-register-model";

const viewLabels = {
  All: "All organisations",
  Prospects: "Prospects",
  Duplicates: "Possible duplicates",
  NoSite: "Without a current site",
  Inactive: "Inactive",
};
const labels: Record<string, string> = {
  name: "Name",
  status: "Status",
  owner: "Relationship owner",
  sites: "Sites",
  deals: "Open deals",
  service: "Open service",
  follow_up: "Next follow-up",
  sector: "Sector",
  areas: "Areas",
  reference: "Reference",
};
const defaultColumns = Object.keys(labels);
export function OrganisationRegister() {
  const params = useSearchParams();
  // A new URL population invalidates transient selections and the cursor trail.
  return (
    <Register
      key={params.toString()}
      query={new URLSearchParams(params.toString())}
    />
  );
}
function Register({ query }: { query: URLSearchParams }) {
  const router = useRouter(),
    shell = useShell();
  const [menuOpen, setMenuOpen] = useState(true),
    [columns, setColumns] = useState(() => {
      const requested = query
        .get("columns")
        ?.split(",")
        .filter((c) => defaultColumns.includes(c));
      return requested?.includes("name") ? requested : defaultColumns;
    }),
    [options, setOptions] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [snapshot, setSnapshot] = useState<string | null>(null),
    [search, setSearch] = useState(query.get("q") ?? ""),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const request = new URLSearchParams();
  for (const key of [
    "q",
    "view",
    "status",
    "owner",
    "mine",
    "sort",
    "direction",
    "limit",
  ])
    if (query.has(key)) request.set(key, query.get(key)!);
  if (cursors.at(-1)) request.set("cursor", cursors.at(-1)!);
  const resource = useCrmResource<OrganisationRegisterData>(
      `customers/register?${request}`,
      true,
    ),
    data = resource.data;
  const rawView = query.get("view"),
    view = organisationViews.find((v) => v === rawView) ?? "All";
  const sort = query.get("sort") ?? "name",
    direction = query.get("direction") ?? "asc";
  const recordHref = (id: string) =>
    departmentHref(
      `/customers/${id}?${new URLSearchParams({ from: query.toString() })}`,
      shell.preview,
    );
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/customers${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  function cell(row: OrganisationRegisterRow, key: string) {
    if (key === "name")
      return (
        <>
          <Link prefetch={false} href={recordHref(row.id)}>
            {row.display_name}
          </Link>
          {row.possible_duplicate && (
            <span className="org-duplicate" title="Possible duplicate">
              {" "}
              · Possible duplicate
            </span>
          )}
        </>
      );
    if (key === "status")
      return (
        <span className={`org-status org-status-${row.status.toLowerCase()}`}>
          {row.status}
        </span>
      );
    if (key === "owner") return row.owner_name ?? "Not recorded";
    if (key === "reference") return row.display_number;
    if (key === "sector") return row.sector ?? "Unknown";
    if (key === "service")
      return (
        <span title="The source does not establish a combined open-service count.">
          Unknown
        </span>
      );
    if (key === "deals") return row.deals === null ? "Restricted" : row.deals;
    if (key === "follow_up")
      return row.follow_up_state === "Restricted" ? (
        "Restricted"
      ) : row.next_follow_up ? (
        <Link href={`/work/${row.next_follow_up.id}`}>
          <span>{row.next_follow_up.summary}</span>
          <small>
            {row.next_follow_up.due_at ? (
              <Stamp value={row.next_follow_up.due_at} />
            ) : (
              "Due date needed"
            )}
          </small>
        </Link>
      ) : (
        "None recorded"
      );
    return (
      <Link prefetch={false} href={`${recordHref(row.id)}&view=sites`}>
        {row[key as "sites" | "areas"]}
      </Link>
    );
  }
  const selectedRow = data?.items.find((r) => r.id === snapshot);
  return (
    <SecondaryMenuFrame
      id="ppo-organisations"
      name="Organisations"
      menuId="org-menu"
      contentId="org-content"
      state={menu}
      message="Permitted organisations only"
      menu={
        <>
          <nav aria-label="Shared records">
            <Link href="/people">People</Link>
            <Link href="/sites">Sites</Link>
          </nav>
          <h2>Organisations</h2>
          <nav aria-label="Organisation views">
            {organisationViews.map((v) => (
              <button
                key={v}
                type="button"
                aria-current={v === view ? "page" : undefined}
                onClick={() => {
                  change({ view: v });
                  menu.closeOverlay();
                }}
              >
                <span>{viewLabels[v]}</span>
                {data && <small>{data.counts[v]}</small>}
              </button>
            ))}
          </nav>
          <h2>Related</h2>
          <p className="org-menu-note">
            Open an organisation for Stakeholders and Account development.
          </p>
        </>
      }
    >
      <div className="org-register">
        <PageHeader variant="register" eyebrow="CS-01" title="Organisations" />
        <div className="org-local-search">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              change({ q: search });
            }}
            className="org-search"
          >
            <label className="sr-only" htmlFor="org-search">
              Search organisations
            </label>
            <input
              id="org-search"
              type="search"
              placeholder="Search organisations"
              value={search}
              maxLength={200}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="secondary">
              Search
            </button>
          </form>
        </div>
        <div className="org-toolbar">
          <div className="org-phone-view">
            <WorklistChoice
              label="Organisation view"
              value={view}
              options={organisationViews.map((v) => ({
                id: v,
                label: viewLabels[v],
              }))}
              onChange={(v) => change({ view: v })}
            />
          </div>
          <WorklistChoice
            label="Status"
            prefix="Status: "
            value={query.get("status") ?? ""}
            options={[
              { id: "", label: "All" },
              ...["Active", "Prospect", "Inactive"].map((id) => ({
                id,
                label: id,
              })),
            ]}
            onChange={(status) => change({ status })}
          />
          <WorklistChoice
            label="Relationship owner"
            prefix="Owner: "
            value={query.get("owner") ?? ""}
            options={[
              { id: "", label: "All" },
              ...(data?.owners ?? []).map((o) => ({
                id: o.id,
                label: o.label,
              })),
            ]}
            onChange={(owner) => change({ owner, mine: "" })}
          />
          <p className="org-read-time" aria-live="polite">
            {data ? (
              <>
                {data.total} organisations · as at{" "}
                <Stamp value={data.observed_at} />
              </>
            ) : resource.loading ? (
              "Loading… Current results unconfirmed"
            ) : (
              "Current results unconfirmed"
            )}
          </p>
          <Button
            variant="secondary"
            onClick={() => {
              setSnapshot(null);
              setSelected([]);
              setCursors([null]);
              resource.reload();
            }}
          >
            Refresh
          </Button>
          <WorklistMenu label="Organisation actions" text="…">
            <ButtonLink href="/customers/new">Create organisation</ButtonLink>
            <button
              type="button"
              className="secondary"
              data-menu-close
              onClick={() => setOptions(true)}
            >
              Columns and views
            </button>
          </WorklistMenu>
        </div>
        <ReadState
          loading={resource.loading}
          error={resource.error}
          retry={resource.reload}
        />
        {resource.error != null && (
          <div className="org-failure" role="status">
            <h2>Organisations could not be loaded</h2>
            <p>
              No list or counts are shown. Check your connection or access, then
              retry.
            </p>
            <Button onClick={resource.reload}>Retry loading</Button>
          </div>
        )}
        {data && (
          <>
            <div className="org-desktop-grid">
              <RegisterTable
                caption="Permitted organisations. Open a name for the record; select a row or use its menu for a snapshot."
                empty={
                  !data.items.length && (
                    <RegisterEmpty title="No matching organisations">
                      <p>
                        Organisations in companies you cannot see are not shown
                        or counted.
                      </p>
                      <Button
                        onClick={() =>
                          change({
                            q: "",
                            owner: "",
                            status: "",
                            mine: "",
                            view: "All",
                          })
                        }
                      >
                        Clear filters
                      </Button>
                    </RegisterEmpty>
                  )
                }
              >
                <thead>
                  <tr>
                    <th className="org-pin-check">
                      <input
                        type="checkbox"
                        aria-label="Select all organisations on this page"
                        checked={
                          data.items.length > 0 &&
                          selected.length === data.items.length
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? data.items.map((r) => r.id) : [],
                          )
                        }
                      />
                    </th>
                    {columns.map((key) =>
                      organisationSorts.includes(key as OrganisationSort) ? (
                        <RegisterSortHeader
                          key={key}
                          className={`org-col-${key}`}
                          label={labels[key]}
                          direction={
                            sort === key
                              ? direction === "asc"
                                ? "ascending"
                                : "descending"
                              : undefined
                          }
                          onSort={() =>
                            change({
                              sort: key,
                              direction:
                                sort === key && direction === "asc"
                                  ? "desc"
                                  : "asc",
                            })
                          }
                        />
                      ) : (
                        <th key={key} className={`org-col-${key}`}>
                          {labels[key]}
                        </th>
                      ),
                    )}
                    <th className="org-pin-actions">
                      <Button
                        aria-label="Columns and views"
                        onClick={() => setOptions(true)}
                      >
                        <ProductIcon name="settings" />
                      </Button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr
                      key={row.id}
                      data-selected={selected.includes(row.id) || undefined}
                      data-inspected={snapshot === row.id || undefined}
                    >
                      <td className="org-pin-check">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.display_name}`}
                          checked={selected.includes(row.id)}
                          onChange={(e) => {
                            setSelected((old) =>
                              e.target.checked
                                ? [...old, row.id]
                                : old.filter((id) => id !== row.id),
                            );
                            if (e.target.checked) setSnapshot(row.id);
                          }}
                        />
                      </td>
                      {columns.map((key) => (
                        <td key={key} className={`org-col-${key}`}>
                          {cell(row, key)}
                        </td>
                      ))}
                      <td className="org-pin-actions">
                        <WorklistMenu
                          label={`Actions for ${row.display_name}`}
                          text="…"
                        >
                          <button
                            type="button"
                            className="secondary"
                            data-menu-close
                            onClick={() => setSnapshot(row.id)}
                          >
                            Open snapshot
                          </button>
                          <Link
                            prefetch={false}
                            href={recordHref(row.id)}
                            aria-label={row.display_name}
                          >
                            Open organisation
                          </Link>
                          <Link
                            href={`/work/new?${new URLSearchParams({ type: "Organisation", id: row.id, company: row.company_id })}`}
                          >
                            Create follow-up
                          </Link>
                        </WorklistMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="org-phone-list">
              {!data.items.length && (
                <RegisterEmpty title="No matching organisations">
                  <p>
                    Organisations in companies you cannot see are not shown or
                    counted. Search before you create a new one.
                  </p>
                  <Button
                    onClick={() =>
                      change({
                        q: "",
                        owner: "",
                        status: "",
                        mine: "",
                        view: "All",
                      })
                    }
                  >
                    Clear filters
                  </Button>
                </RegisterEmpty>
              )}
              {data.items.map((row) => (
                <article key={row.id}>
                  <Link
                    prefetch={false}
                    href={recordHref(row.id)}
                    aria-label={row.display_name}
                  >
                    <div>
                      <strong>{row.display_name}</strong>
                      <span
                        className={`org-status org-status-${row.status.toLowerCase()}`}
                      >
                        {row.status}
                      </span>
                    </div>
                    <p>
                      {row.display_number} ·{" "}
                      {row.owner_name ?? "Owner not recorded"}
                    </p>
                    <p>
                      {row.possible_duplicate
                        ? "Possible duplicate"
                        : row.sites === 0
                          ? "No current site"
                          : `${row.sites} sites · ${row.deals === null ? "Deals restricted" : `${row.deals} open deals`}`}{" "}
                      · Open service unknown
                    </p>
                  </Link>
                  <Button
                    aria-label={`Snapshot for ${row.display_name}`}
                    onClick={() => setSnapshot(row.id)}
                  >
                    <ProductIcon name="more" />
                  </Button>
                </article>
              ))}
            </div>
            <RegisterFooter>
              <span>
                {selected.length > 0 && `${selected.length} selected · `}
                {data.items.length} of {data.total} matching organisations
              </span>
              <label>
                Rows
                <select
                  value={query.get("limit") ?? "25"}
                  onChange={(e) => change({ limit: e.target.value })}
                >
                  {[25, 50, 100].map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </label>
              <Button
                disabled={cursors.length < 2}
                onClick={() => {
                  setSnapshot(null);
                  setSelected([]);
                  setCursors((old) => old.slice(0, -1));
                }}
              >
                Previous
              </Button>
              <Button
                disabled={!data.next_cursor}
                onClick={() => {
                  setSnapshot(null);
                  setSelected([]);
                  setCursors((old) => [...old, data.next_cursor]);
                }}
              >
                Next
              </Button>
            </RegisterFooter>
          </>
        )}
        {options && (
          <WorklistPanel
            title="Columns and views"
            onClose={() => setOptions(false)}
          >
            <fieldset>
              <legend>Visible desktop columns</legend>
              {defaultColumns.map((key) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={columns.includes(key)}
                    disabled={key === "name"}
                    onChange={(e) =>
                      setColumns((old) =>
                        e.target.checked
                          ? defaultColumns.filter(
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
            <label>
              <input
                type="checkbox"
                checked={query.get("mine") === "true"}
                onChange={(e) =>
                  change({ mine: e.target.checked ? "true" : "", owner: "" })
                }
              />
              Relationships owned by me
            </label>
            <OrganisationViews
              query={query}
              columns={columns}
              apply={(v) => {
                setColumns(
                  v.columns.map((c) => (c === "facilities" ? "areas" : c)),
                );
                change({
                  q: v.q,
                  status: v.status,
                  mine: v.mine,
                  sort: v.sort === "facilities" ? "areas" : v.sort,
                  direction: v.direction,
                  limit: v.limit,
                  columns: v.columns
                    .map((c) => (c === "facilities" ? "areas" : c))
                    .join(","),
                  view: "All",
                  owner: "",
                });
              }}
            />
          </WorklistPanel>
        )}
        {selectedRow && (
          <WorklistPanel
            title="Organisation snapshot"
            drawer
            onClose={() => setSnapshot(null)}
          >
            <h3>{selectedRow.display_name}</h3>
            <p>{selectedRow.display_number}</p>
            <dl>
              {[
                "status",
                "owner",
                "sites",
                "deals",
                "service",
                "follow_up",
                "sector",
              ].map((key) => (
                <div key={key}>
                  <dt>{labels[key]}</dt>
                  <dd>{cell(selectedRow, key)}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={recordHref(selectedRow.id)}>
              Open organisation
            </ButtonLink>
            <ButtonLink
              href={`/work/new?${new URLSearchParams({ type: "Organisation", id: selectedRow.id, company: selectedRow.company_id })}`}
            >
              Create follow-up
            </ButtonLink>
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
