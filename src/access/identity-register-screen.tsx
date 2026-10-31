"use client";
import "../app/styles/access-register.css";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { departmentHref } from "../shell/navigation";
import { formatDate, formatTimestamp } from "../shell/date-format";
import { useShell } from "../components/shell-provider";
import { useResource, ReadState } from "../components/business-ui";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "../components/crm-worklist-tools";
import { Button } from "../components/ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterFooter,
} from "../components/ui/register-table";
import { ShellIcon, type ShellIconName } from "../components/shell-icon";
import { FontAwesomeGlyph } from "../components/font-awesome";
import { Icon } from "../activities/components/client/my-work-ui";
import {
  identityViews,
  identityViewLabels,
  identityScope,
  identityStatus,
  type IdentityRegisterRow,
  type IdentityRegisterData,
} from "./identity-register-model";

const columns = {
  name: "Name",
  identity: "Identity",
  status: "Status",
  current: "Current",
  scheduled: "Scheduled",
  expired: "Expired",
  scope: "Scope reach",
  teams: "Teams",
  requests: "Open requests",
  changed: "Last recorded change",
};
type Column = keyof typeof columns;
const viewIcons: Record<string, ShellIconName> = {
  all: "nav-people",
  active: "contacts",
  inactive: "archive",
  hosted: "eye",
};
const links: { label: string; href: string; icon: ShellIconName }[] = [
  {
    label: "Capability catalogue",
    href: "/admin/access/capabilities",
    icon: "lock",
  },
  {
    label: "Role bundles (proposed)",
    href: "/admin/access/roles",
    icon: "nav-materials",
  },
  {
    label: "Local teams",
    href: "/admin/access/roles#saved-local-teams",
    icon: "nav-people",
  },
  { label: "Access requests", href: "/admin/access/requests", icon: "work" },
];

export function AccessIdentityRegister() {
  return (
    <Suspense fallback={<p role="status">Loading identities…</p>}>
      <RegisterLocation />
    </Suspense>
  );
}
function RegisterLocation() {
  const query = useSearchParams();
  return (
    <IdentityList
      key={query.toString()}
      query={new URLSearchParams(query.toString())}
    />
  );
}
function IdentityList({ query }: { query: URLSearchParams }) {
  const shell = useShell(),
    router = useRouter(),
    pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true),
    [panel, setPanel] = useState<"filters" | "columns" | "about" | null>(null);
  const [search, setSearch] = useState(query.get("q") ?? ""),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState<string[]>([]);
  const [visible, setVisible] = useState<Column[]>(
    Object.keys(columns) as Column[],
  );
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const view =
    identityViews.find((v) => v === query.get("view")) ??
    (menu.phone ? "active" : "all");
  const sort = query.get("sort") ?? (menu.phone ? "changed" : "name");
  const direction =
    query.get("direction") ?? (sort === "changed" ? "desc" : "asc");
  const request = new URLSearchParams({
    register: "1",
    view,
    sort,
    direction,
    offset: String(offset),
  });
  for (const key of ["q", "company_id"])
    if (query.has(key)) request.set(key, query.get(key)!);
  const resource = useResource<IdentityRegisterData>(
    menu.phone === null ? null : `admin/access?${request}`,
  );
  // Never retain rows, totals, choices or selection during an unconfirmed read.
  const data =
    !resource.loading && !resource.error && menu.phone !== null
      ? resource.data
      : null;
  const selectedHere = selected.filter((id) =>
    data?.items.some((row) => row.id === id),
  );
  const href = (path: string) => departmentHref(path, shell.preview);
  const personHref = (id: string) => href(`/admin/access/${id}`);
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    next.set("view", view);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`${pathname}?${next}`, { scroll: false });
  }
  const refresh = () => {
    setSelected([]);
    resource.reload();
  };
  const companyOptions = [
    { id: "", label: "All" },
    ...(data?.companies ?? []).map((c) => ({
      id: c.id,
      label: `${c.erp_company_id} · ${c.display_name}`,
    })),
  ];
  const filtered = !!query.get("q") || !!query.get("company_id");
  const sortColumn = (key: string) =>
    change({
      sort: key,
      direction: key === sort && direction === "asc" ? "desc" : "asc",
    });
  function cell(row: IdentityRegisterRow, key: Column) {
    switch (key) {
      case "name":
        return (
          <Link prefetch={false} href={personHref(row.id)}>
            {row.display_name}
          </Link>
        );
      case "identity":
        return row.masked ? "Hosted (masked)" : "Local";
      case "status":
        return (
          <span className="access-tag" data-active={row.active}>
            {row.active ? "Active" : "Inactive"}
          </span>
        );
      case "current":
        return row.current_count;
      case "scheduled":
        return row.scheduled_count;
      case "expired":
        return row.expired_count;
      case "scope":
        return identityScope(row);
      case "teams":
        return data?.local_details_available
          ? row.teams.join("; ") || "—"
          : "Local only";
      case "requests":
        return data?.local_details_available
          ? [
              row.submitted_count ? `${row.submitted_count} submitted` : "",
              row.approved_count ? `${row.approved_count} approved` : "",
            ]
              .filter(Boolean)
              .join(" · ") || "—"
          : "Local only";
      case "changed":
        return row.last_changed_at ? (
          <time
            dateTime={row.last_changed_at}
            title="Latest applied access request"
          >
            {formatTimestamp(row.last_changed_at)}
          </time>
        ) : (
          "Not recorded"
        );
    }
  }
  const searchForm = (phone = false) => (
    <form
      className="access-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        change({ q: search });
        setPanel(null);
      }}
    >
      <Button variant="quiet" type="submit" aria-label="Search identities">
        <ShellIcon name="search" />
      </Button>
      <input
        aria-label="Find a person"
        placeholder="Find a person"
        value={search}
        maxLength={100}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus={phone}
      />
    </form>
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-access-register"
      name="Users and access"
      menuId="access-menu"
      contentId="access-content"
      message={
        resource.error
          ? "Identity inspection unavailable. No identities or counts are shown."
          : data
            ? `${data.total} identities`
            : "Loading identities…"
      }
      phoneHeader={{
        title: identityViewLabels[view],
        count: data?.total,
        pageAction: {
          icon: "search",
          search: true,
          label: "Search identities",
          onSelect: () => setPanel("filters"),
        },
        filter: { open: () => setPanel("filters"), applied: filtered },
      }}
      menu={
        <>
          <h2>Identities</h2>
          <nav aria-label="Identity views">
            {identityViews.map((v) => (
              <button
                key={v}
                type="button"
                aria-current={v === view ? "page" : undefined}
                onClick={() => {
                  change({ view: v });
                  menu.closeOverlay();
                }}
              >
                <FontAwesomeGlyph
                  className="access-glyph"
                  icon={
                    {
                      all: "users",
                      active: "user-check",
                      inactive: "ban",
                      hosted: "eye-slash",
                    }[v]
                  }
                  fallback={<ShellIcon name={viewIcons[v]} />}
                />
                <span>{identityViewLabels[v]}</span>
                {data && <small>{data.counts[v]}</small>}
              </button>
            ))}
          </nav>
          <h2>Access</h2>
          <nav aria-label="Access">
            {links.map((l) => (
              <Link key={l.label} href={href(l.href)}>
                <ShellIcon name={l.icon} />
                {l.label}
              </Link>
            ))}
          </nav>
          <h2>Administration</h2>
          <nav aria-label="Administration">
            <Link href={href("/admin")}>
              <ShellIcon name="settings" />
              Integrations &amp; recovery
            </Link>
            <Link href={href("/foundation")}>
              <ShellIcon name="settings" />
              Foundation checks
            </Link>
          </nav>
        </>
      }
    >
      <div className="access-register">
        <h1 className="sr-only">Users and access</h1>
        <div className="access-toolbar">
          {searchForm()}
          <WorklistChoice
            label="Identity status"
            prefix="Status: "
            value={view}
            options={identityViews.map((id) => ({
              id,
              label: id === "all" ? "All" : identityViewLabels[id],
            }))}
            onChange={(v) => change({ view: v })}
          />
          <WorklistChoice
            label="Company"
            prefix="Company: "
            value={query.get("company_id") ?? ""}
            options={companyOptions}
            disabled={!data}
            onChange={(v) => change({ company_id: v })}
          />
          <p className="access-count">
            {data ? (
              <>
                {data.total} identities
                <span> · grants as at {formatTimestamp(data.observed_at)}</span>
              </>
            ) : (
              "Current results unconfirmed"
            )}
          </p>
          <Button
            variant="secondary"
            className="access-icon-button"
            aria-label="Refresh identities"
            onClick={refresh}
          >
            <Icon name="refresh" />
          </Button>
          <WorklistMenu label="Identity register options" icon="more">
            <button
              type="button"
              data-menu-close
              onClick={() => setPanel("filters")}
            >
              Search and filter
            </button>
            <button
              type="button"
              data-menu-close
              onClick={() => setPanel("columns")}
            >
              Choose columns
            </button>
            <button
              type="button"
              data-menu-close
              onClick={() => setPanel("about")}
            >
              About these counts
            </button>
          </WorklistMenu>
        </div>
        <div className="access-read-state">
          <ReadState
            loading={resource.loading || menu.phone === null}
            error={resource.error}
            retry={refresh}
          />
        </div>
        {data && (
          <>
            {!data.items.length && (
              <div className="access-empty">
                <h2>No identities match these filters.</h2>
                <p>Try a different name, status or company.</p>
                <Button
                  variant="secondary"
                  onClick={() => change({ view: "all", q: "", company_id: "" })}
                >
                  Clear filters
                </Button>
              </div>
            )}
            {!!data.items.length && (
              <>
                <div className="access-desktop">
                  <RegisterTable caption="Workspace identities and recorded grants. Open a name to inspect access. Selection changes no access.">
                    <thead>
                      <tr>
                        <th className="access-check" scope="col">
                          <input
                            type="checkbox"
                            aria-label="Select all identities on this page"
                            checked={selectedHere.length === data.items.length}
                            ref={(el) => {
                              if (el)
                                el.indeterminate =
                                  selectedHere.length > 0 &&
                                  selectedHere.length < data.items.length;
                            }}
                            onChange={(e) =>
                              setSelected(
                                e.target.checked
                                  ? data.items.map((row) => row.id)
                                  : [],
                              )
                            }
                          />
                        </th>
                        {visible.map((key) =>
                          [
                            "name",
                            "current",
                            "scheduled",
                            "expired",
                            "changed",
                          ].includes(key) ? (
                            <RegisterSortHeader
                              key={key}
                              className={`access-col-${key}`}
                              label={columns[key]}
                              direction={
                                sort === key
                                  ? direction === "asc"
                                    ? "ascending"
                                    : "descending"
                                  : undefined
                              }
                              onSort={() => sortColumn(key)}
                            />
                          ) : (
                            <th
                              scope="col"
                              key={key}
                              className={`access-col-${key}`}
                            >
                              <span className="ppo-register-label">
                                {columns[key]}
                              </span>
                            </th>
                          ),
                        )}
                        <th className="access-actions" scope="col">
                          <Button
                            variant="quiet"
                            aria-label="Choose identity columns"
                            onClick={() => setPanel("columns")}
                          >
                            <ShellIcon name="settings" />
                          </Button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((row) => (
                        <tr
                          key={row.id}
                          data-selected={
                            selectedHere.includes(row.id) || undefined
                          }
                        >
                          <td className="access-check">
                            <input
                              type="checkbox"
                              aria-label={`Select ${row.display_name}`}
                              checked={selectedHere.includes(row.id)}
                              onChange={(e) =>
                                setSelected(
                                  e.target.checked
                                    ? [...selectedHere, row.id]
                                    : selectedHere.filter(
                                        (id) => id !== row.id,
                                      ),
                                )
                              }
                            />
                          </td>
                          {visible.map((key) => (
                            <td
                              key={key}
                              className={`access-col-${key}`}
                              title={
                                key === "scope"
                                  ? identityScope(row)
                                  : key === "teams"
                                    ? row.teams.join("; ")
                                    : undefined
                              }
                            >
                              {cell(row, key)}
                            </td>
                          ))}
                          <td className="access-actions">
                            <WorklistMenu
                              label={`Actions for ${row.display_name}`}
                              icon="more"
                            >
                              <Link prefetch={false} href={personHref(row.id)}>
                                Open person access
                              </Link>
                            </WorklistMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </RegisterTable>
                </div>
                <div className="access-phone-list">
                  {data.items.map((row) => (
                    <Link
                      prefetch={false}
                      key={row.id}
                      href={personHref(row.id)}
                      className="access-phone-row"
                    >
                      <div>
                        <div className="access-phone-title">
                          <strong>{row.display_name}</strong>
                          <time
                            dateTime={row.last_changed_at ?? undefined}
                            title={
                              row.last_changed_at
                                ? formatTimestamp(row.last_changed_at)
                                : "No applied access request recorded"
                            }
                          >
                            {row.last_changed_at
                              ? formatDate(row.last_changed_at)
                              : "Not recorded"}
                          </time>
                        </div>
                        <p>
                          {row.masked ? "Hosted · details masked" : "Local"} ·{" "}
                          {identityScope(row)}
                          {row.teams.length ? ` · ${row.teams.join(", ")}` : ""}
                        </p>
                        <p
                          className={row.expired_count ? "access-warning" : ""}
                        >
                          <FontAwesomeGlyph
                            className="access-glyph"
                            icon={
                              !row.active
                                ? "ban"
                                : row.expired_count
                                  ? "triangle-exclamation"
                                  : row.scheduled_count
                                    ? "clock"
                                    : row.masked
                                      ? "eye-slash"
                                      : "user-check"
                            }
                            fallback={
                              <ShellIcon
                                name={
                                  row.expired_count
                                    ? "warning"
                                    : row.masked
                                      ? "eye"
                                      : "contacts"
                                }
                              />
                            }
                          />
                          {identityStatus(row)}
                        </p>
                      </div>
                      <ShellIcon name="chevron-right" />
                    </Link>
                  ))}
                </div>
              </>
            )}
            {(offset > 0 || data.has_more || selectedHere.length > 0) && (
              <RegisterFooter>
                {selectedHere.length > 0 && (
                  <>
                    <span>{selectedHere.length} selected on this page</span>
                    {selectedHere.length === 1 && (
                      <Link href={personHref(selectedHere[0])}>
                        Open selected identity
                      </Link>
                    )}
                    <Button variant="quiet" onClick={() => setSelected([])}>
                      Clear selection
                    </Button>
                  </>
                )}
                <span>
                  {data.total
                    ? `${offset + 1}–${offset + data.items.length} of ${data.total}`
                    : "0 identities"}
                </span>
                <Button
                  variant="secondary"
                  disabled={!offset}
                  onClick={() => {
                    setSelected([]);
                    setOffset(Math.max(0, offset - 50));
                  }}
                >
                  Previous page
                </Button>
                <Button
                  variant="secondary"
                  disabled={!data.has_more}
                  onClick={() => {
                    setSelected([]);
                    setOffset(offset + 50);
                  }}
                >
                  Next page
                </Button>
              </RegisterFooter>
            )}
          </>
        )}
        <div className="access-phone-tools">
          <Button variant="quiet" onClick={refresh}>
            Refresh identities
          </Button>
          <Button variant="quiet" onClick={() => setPanel("about")}>
            About these counts
          </Button>
        </div>
      </div>
      {panel && (
        <WorklistPanel
          title={
            panel === "filters"
              ? "Search and filter identities"
              : panel === "columns"
                ? "Choose identity columns"
                : "About identity inspection"
          }
          onClose={() => setPanel(null)}
        >
          {panel === "filters" && (
            <>
              {searchForm(true)}
              <WorklistChoice
                label="Identity status"
                prefix="Status: "
                value={view}
                options={identityViews.map((id) => ({
                  id,
                  label: identityViewLabels[id],
                }))}
                onChange={(v) => {
                  change({ view: v });
                  setPanel(null);
                }}
              />
              <WorklistChoice
                label="Company"
                value={query.get("company_id") ?? ""}
                options={companyOptions}
                disabled={!data}
                onChange={(v) => {
                  change({ company_id: v });
                  setPanel(null);
                }}
              />
              <p>
                Company selects identities with a recorded grant at that company
                or its sites, including workspace grants. Counts describe all of
                each identity’s recorded grants.
              </p>
            </>
          )}
          {panel === "columns" && (
            <>
              {(Object.keys(columns) as Column[]).map((key) => (
                <label key={key} className="access-column-choice">
                  <input
                    type="checkbox"
                    checked={visible.includes(key)}
                    disabled={key === "name"}
                    onChange={(e) =>
                      setVisible(
                        (Object.keys(columns) as Column[]).filter((k) =>
                          k === key ? e.target.checked : visible.includes(k),
                        ),
                      )
                    }
                  />
                  {columns[key]}
                </label>
              ))}
            </>
          )}
          {panel === "about" && (
            <>
              <p>
                Current, scheduled and expired counts describe recorded grants
                at the displayed read time. Inactive identities have no
                effective current grants. Grant eligibility does not approve a
                business action or verify a hosted session.
              </p>
              <p>
                Scope reach includes all recorded grants, including scheduled
                and expired ones. Company keys distinguish companies with the
                same name. Teams grant no access and route no reviews.
              </p>
              <p>
                Open requests are Submitted or Approved; approval alone changes
                no access. Last recorded change is the latest applied access
                request. Original grants have no creation timestamp, so their
                change time is Not recorded.
              </p>
              <p>
                Hosted identities stay masked. Local teams and requests are
                shown only in the local synthetic app. Refresh rechecks
                inspection authority; a failed or denied read clears identities
                and counts.
              </p>
            </>
          )}
        </WorklistPanel>
      )}
    </SecondaryMenuFrame>
  );
}
