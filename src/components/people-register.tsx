"use client";
import "../app/styles/people-register.css";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { departmentHref } from "../shell/navigation";
import { formatTimestamp } from "../shell/date-format";
import { useShell } from "./shell-provider";
import { denied, useCrmResource } from "./crm-state";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { Button } from "./ui/button";
import {
  RegisterTable,
  RegisterSortHeader,
  RegisterFooter,
} from "./ui/register-table";
import { ShellIcon, type ShellIconName } from "./shell-icon";
import { Icon as WorkIcon } from "../activities/components/client/my-work-ui";
import { CrmDirectory } from "./crm-directory";
import {
  peopleViews,
  peopleViewLabels,
  peopleSorts,
  peopleStatusLine,
  type PeopleRegisterData,
  type PeopleRegisterRow,
} from "../shared/people-register-model";

const columns = {
  name: "Name",
  organisation: "Organisation",
  role: "Role (recorded)",
  phone: "Phone",
  email: "Email",
  status: "Status",
  preference: "Contact preference",
  sites: "Site contact for",
  notices: "Notices",
  corrected: "Last corrected",
};
type Column = keyof typeof columns;
const viewIcons: Record<string, ShellIconName> = {
  Active: "nav-people",
  SiteContacts: "sites",
  Channels: "warning",
  Inactive: "archive",
};

export function PeopleRegister() {
  return (
    <Suspense fallback={<p role="status">Loading permitted people…</p>}>
      <PeopleLocation />
    </Suspense>
  );
}
function PeopleLocation() {
  const query = useSearchParams();
  const pathname = usePathname();
  // Preserve the account saved-view workflow until its new presentation is designed.
  if (query.get("people_layout") === "directory")
    return (
      <CrmDirectory kind="people" contactsHub={pathname === "/contacts"} />
    );
  return (
    <PeopleList
      key={query.toString()}
      query={new URLSearchParams(query.toString())}
    />
  );
}
function PeopleList({ query }: { query: URLSearchParams }) {
  const shell = useShell(),
    router = useRouter(),
    pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(true),
    [panel, setPanel] = useState<"filters" | "columns" | null>(null);
  const [search, setSearch] = useState(query.get("q") ?? ""),
    [visible, setVisible] = useState<Column[]>(() => {
      const requested = query
        .get("columns")
        ?.split(",")
        .filter((c): c is Column => Object.hasOwn(columns, c));
      return requested?.includes("name")
        ? requested
        : (Object.keys(columns) as Column[]);
    });
  const [organisation, setOrganisation] = useState(
    query.get("organisation") ?? "",
  );
  const [notices, setNotices] = useState(query.get("notices") ?? "All");
  const pullStart = useRef<{ x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<string[]>([]),
    [cursors, setCursors] = useState<(string | null)[]>([null]);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const view =
    peopleViews.find((v) => v === query.get("people_view")) ?? "Active";
  const request = new URLSearchParams({ view });
  for (const key of [
    "q",
    "organisation",
    "notices",
    "sort",
    "direction",
    "limit",
  ])
    if (query.has(key)) request.set(key, query.get(key)!);
  if (cursors.at(-1)) request.set("cursor", cursors.at(-1)!);
  const resource = useCrmResource<PeopleRegisterData>(
    `people/register?${request}`,
    true,
  );
  const data = resource.data;
  const appliedOrganisation = data?.organisations.find(
    (option) => option.id === query.get("organisation"),
  )?.label;
  const selectedHere = selected.filter((id) =>
    data?.items.some((row) => row.id === id),
  );
  function change(values: Record<string, string>) {
    const next = new URLSearchParams(query);
    if (visible.length !== Object.keys(columns).length)
      next.set("columns", visible.join(","));
    else next.delete("columns");
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }
  const href = (path: string) => departmentHref(path, shell.preview);
  const personHref = (id: string) => href(`/people/${id}`);
  const filtered = ["q", "organisation", "notices"].some(
    (key) => query.has(key) && query.get(key) !== "All",
  );
  const options = [
    { id: "", label: "All" },
    ...(data?.organisations ?? []).map((o) => ({ id: o.id, label: o.label })),
  ];
  const refresh = () => {
    setCursors([null]);
    setSelected([]);
    resource.reload();
  };
  function cell(row: PeopleRegisterRow, column: Column) {
    switch (column) {
      case "name":
        return (
          <Link prefetch={false} href={personHref(row.id)}>
            {row.display_name}
          </Link>
        );
      case "organisation":
        return row.organisations.length
          ? row.organisations.map((o) => (
              <Link
                prefetch={false}
                key={`${o.id}:${o.role}`}
                href={href(`/customers/${o.id}`)}
              >
                {o.name}
              </Link>
            ))
          : row.notices_restricted
            ? "Affiliations restricted"
            : "No current affiliation";
      case "role":
        return (
          row.organisations.map((o) => o.role).join("; ") || "Not recorded"
        );
      case "phone":
        return row.phone ? (
          <a href={`tel:${row.phone.replace(/[^+0-9]/g, "")}`}>{row.phone}</a>
        ) : (
          "Not recorded"
        );
      case "email":
        return row.email ? (
          <a href={`mailto:${row.email}`}>{row.email}</a>
        ) : (
          "Not recorded"
        );
      case "status":
        return (
          <span className="people-tag">
            {row.active ? "Active" : "Inactive"}
          </span>
        );
      case "preference":
        return row.contact_preference || "Not recorded";
      case "sites":
        return row.sites.length
          ? row.sites.map((s) => (
              <Link prefetch={false} key={s.id} href={href(`/sites/${s.id}`)}>
                {s.name}
              </Link>
            ))
          : "None in your access";
      case "notices":
        return (
          <>
            {row.notice_exceptions
              ? `${row.notice_exceptions} do not notify`
              : row.notices_restricted
                ? "Restricted"
                : "No exceptions"}
            {row.notices_restricted &&
              row.notice_exceptions > 0 &&
              " · partial"}
          </>
        );
      case "corrected":
        return row.history_restricted ? (
          "Restricted"
        ) : row.last_correction ? (
          <time dateTime={row.last_correction}>
            {formatTimestamp(row.last_correction)}
          </time>
        ) : (
          "None recorded"
        );
    }
  }
  return (
    <SecondaryMenuFrame
      id="ppo-people"
      name="People"
      menuId="people-menu"
      contentId="people-content"
      state={menu}
      message={
        resource.error
          ? "People could not be loaded. No list or counts are shown."
          : resource.loading
            ? "Loading permitted people…"
            : `${data?.total ?? 0} permitted people`
      }
      phoneHeader={{
        title: view === "Active" ? "People" : peopleViewLabels[view],
        count: data?.total,
        pageAction: {
          icon: "search",
          search: true,
          label: "Search people",
          onSelect: () => setPanel("filters"),
        },
        filter: { open: () => setPanel("filters"), applied: filtered },
      }}
      menu={
        <>
          <nav aria-label="Shared records">
            <Link href={href("/customers")}>
              <ShellIcon name="nav-organisations" />
              Organisations
            </Link>
            <Link href={href("/sites")}>
              <ShellIcon name="sites" />
              Sites
            </Link>
          </nav>
          <h2>People</h2>
          <nav aria-label="People views">
            {peopleViews.map((v) => (
              <button
                key={v}
                type="button"
                aria-current={v === view ? "page" : undefined}
                onClick={() => {
                  change({ people_view: v });
                  menu.closeOverlay();
                }}
              >
                <ShellIcon name={viewIcons[v]} />
                <span>{peopleViewLabels[v]}</span>
                {data && <small>{data.counts[v]}</small>}
              </button>
            ))}
          </nav>
          <h2>Related</h2>
          <nav aria-label="Related records">
            <Link
              href={href("/customers")}
              title="Choose an organisation to open its stakeholders"
            >
              <ShellIcon name="contacts" />
              Stakeholders
            </Link>
            <Link href={href("/service/tickets")}>
              <ShellIcon name="nav-requests" />
              Service requests
            </Link>
          </nav>
        </>
      }
    >
      <div
        className="people-register"
        onTouchStart={(e) => {
          const scroller = e.currentTarget.closest(".mw-content");
          pullStart.current =
            menu.phone &&
            e.touches.length === 1 &&
            !scroller?.scrollTop &&
            window.scrollY === 0
              ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
              : null;
        }}
        onTouchEnd={(e) => {
          const start = pullStart.current;
          pullStart.current = null;
          const end = e.changedTouches[0];
          if (
            start &&
            end &&
            end.clientY - start.y >= 80 &&
            Math.abs(end.clientX - start.x) < 40
          )
            refresh();
        }}
        onTouchCancel={() => {
          pullStart.current = null;
        }}
      >
        <h1 className="sr-only">People</h1>
        <div className="people-toolbar">
          <WorklistChoice
            label="Organisation"
            prefix="Organisation: "
            value={query.get("organisation") ?? ""}
            options={options}
            onChange={(v) => change({ organisation: v })}
          />
          <WorklistChoice
            label="Notices"
            prefix="Notices: "
            value={query.get("notices") ?? "All"}
            options={[
              { id: "All", label: "All" },
              { id: "DoNotNotify", label: "Do not notify" },
            ]}
            onChange={(v) => change({ notices: v })}
          />
          <p className="people-count">
            {data ? (
              <>
                {data.total} people
                <span className="people-as-at">
                  {" "}
                  · as at {formatTimestamp(data.observed_at)}
                </span>
              </>
            ) : (
              "Current results unconfirmed"
            )}
          </p>
          <Button
            variant="secondary"
            className="people-icon-button"
            aria-label="Refresh people"
            onClick={refresh}
          >
            <WorkIcon name="refresh" />
          </Button>
          <WorklistMenu label="People options" icon="more">
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
            <Link href={href("/customers/new?kind=person")} data-menu-close>
              Create person
            </Link>
            <Link
              href={href(
                `${pathname}?${new URLSearchParams({ ...Object.fromEntries(query), people_layout: "directory" })}`,
              )}
              data-menu-close
            >
              Saved views (earlier directory)
            </Link>
          </WorklistMenu>
        </div>
        {resource.loading && (
          <div className="people-loading" role="status">
            <p>Loading permitted people…</p>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="people-skeleton" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>
            ))}
          </div>
        )}
        {!!resource.error && (
          <section className="people-state people-error" role="alert">
            <strong>
              {denied(resource.error)
                ? "People is outside your access"
                : "People could not be loaded"}
            </strong>
            <p>
              No list or counts are shown, so nothing here is out of date. Check
              your connection, then refresh.
            </p>
            <Button variant="secondary" onClick={refresh}>
              Retry loading
            </Button>
          </section>
        )}
        {data && !data.items.length && (
          <section className="people-state">
            <strong>No matching people</strong>
            <p>
              No permitted person
              {appliedOrganisation ? ` at ${appliedOrganisation}` : ""} matches
              {query.get("q") ? ` “${query.get("q")}”` : " these filters"}.
              People in companies you cannot see are not shown or counted. Check
              the spelling, or clear the search.
            </p>
            <Button variant="secondary" onClick={() => change({ q: "" })}>
              Clear the search
            </Button>
          </section>
        )}
        {data && data.items.length > 0 && (
          <>
            <div className="people-desktop">
              <RegisterTable caption="People in your access. Names open the exact person; selection is for this page only.">
                <thead>
                  <tr>
                    <th className="people-check" scope="col">
                      <input
                        type="checkbox"
                        aria-label="Select people on this page"
                        checked={selectedHere.length === data.items.length}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked ? data.items.map((r) => r.id) : [],
                          )
                        }
                      />
                    </th>
                    {visible.map((key) =>
                      peopleSorts.some((s) => s === key) ? (
                        <RegisterSortHeader
                          key={key}
                          className={`people-col-${key}`}
                          label={columns[key]}
                          direction={
                            (query.get("sort") ?? "name") === key
                              ? query.get("direction") === "desc"
                                ? "descending"
                                : "ascending"
                              : undefined
                          }
                          onSort={() =>
                            change({
                              sort: key,
                              direction:
                                (query.get("sort") ?? "name") === key &&
                                query.get("direction") !== "desc"
                                  ? "desc"
                                  : "asc",
                            })
                          }
                        />
                      ) : (
                        <th
                          key={key}
                          className={`people-col-${key}`}
                          scope="col"
                        >
                          <span className="ppo-register-label">
                            {columns[key]}
                          </span>
                        </th>
                      ),
                    )}
                    <th scope="col" className="people-actions">
                      <button
                        type="button"
                        aria-label="Choose columns"
                        onClick={() => setPanel("columns")}
                      >
                        <ShellIcon name="settings" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((row) => (
                    <tr
                      key={row.id}
                      data-selected={selectedHere.includes(row.id) || undefined}
                    >
                      <td className="people-check">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.display_name}`}
                          checked={selectedHere.includes(row.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selectedHere, row.id]
                                : selectedHere.filter((id) => id !== row.id),
                            )
                          }
                        />
                      </td>
                      {visible.map((key) => (
                        <td className={`people-col-${key}`} key={key}>
                          {cell(row, key)}
                        </td>
                      ))}
                      <td className="people-actions">
                        <WorklistMenu
                          label={`Actions for ${row.display_name}`}
                          icon="more"
                        >
                          <Link prefetch={false} href={personHref(row.id)}>
                            Open person
                          </Link>
                        </WorklistMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="people-phone-list">
              {data.items.map((row) => (
                <Link
                  prefetch={false}
                  key={row.id}
                  href={personHref(row.id)}
                  className="people-phone-row"
                >
                  <div>
                    <div className="people-phone-title">
                      <strong>{row.display_name}</strong>
                      <span>{row.contact_preference || "Not recorded"}</span>
                    </div>
                    <p>
                      {row.organisations
                        .map((o) => `${o.name} · ${o.role}`)
                        .join("; ") ||
                        (row.notices_restricted
                          ? "Affiliations restricted"
                          : "No current affiliation")}
                    </p>
                    <p
                      className={
                        !row.email || !row.phone ? "people-channel-warning" : ""
                      }
                    >
                      <ShellIcon
                        name={
                          !row.email || !row.phone
                            ? "warning"
                            : row.sites.length
                              ? "sites"
                              : row.notice_exceptions
                                ? "info"
                                : "nav-people"
                        }
                      />
                      {peopleStatusLine(row)}
                    </p>
                  </div>
                  <ShellIcon name="chevron-right" />
                </Link>
              ))}
            </div>
            {(data.next_cursor ||
              cursors.length > 1 ||
              selectedHere.length > 0) && (
              <RegisterFooter>
                {selectedHere.length > 0 && (
                  <>
                    <span>{selectedHere.length} selected on this page</span>
                    <Button variant="quiet" onClick={() => setSelected([])}>
                      Clear selection
                    </Button>
                  </>
                )}
                <Button
                  variant="secondary"
                  disabled={cursors.length === 1}
                  onClick={() => {
                    setSelected([]);
                    setCursors((c) => c.slice(0, -1));
                  }}
                >
                  Previous page
                </Button>
                <Button
                  variant="secondary"
                  disabled={!data.next_cursor}
                  onClick={() => {
                    setSelected([]);
                    setCursors((c) => [...c, data.next_cursor]);
                  }}
                >
                  Next page
                </Button>
              </RegisterFooter>
            )}
          </>
        )}
        {panel && (
          <WorklistPanel
            title={
              panel === "filters"
                ? "Search and filter people"
                : "Choose columns"
            }
            onClose={() => setPanel(null)}
          >
            {panel === "columns" ? (
              <fieldset>
                <legend>Visible columns</legend>
                {(Object.keys(columns) as Column[]).map((key) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={visible.includes(key)}
                      disabled={key === "name"}
                      onChange={(e) =>
                        setVisible(
                          e.target.checked
                            ? (Object.keys(columns) as Column[]).filter(
                                (c) => c === key || visible.includes(c),
                              )
                            : visible.filter((c) => c !== key),
                        )
                      }
                    />
                    {columns[key]}
                  </label>
                ))}
              </fieldset>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  change({ q: search, organisation, notices });
                  setPanel(null);
                }}
              >
                <label>
                  Search people
                  <input
                    type="search"
                    maxLength={200}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label>
                  Organisation
                  <select
                    aria-label="Organisation"
                    value={organisation}
                    onChange={(e) => setOrganisation(e.target.value)}
                  >
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Notices
                  <select
                    aria-label="Notices"
                    value={notices}
                    onChange={(e) => setNotices(e.target.value)}
                  >
                    <option value="All">All</option>
                    <option value="DoNotNotify">Do not notify</option>
                  </select>
                </label>
                <div className="people-filter-actions">
                  <Button variant="primary" type="submit">
                    Show people
                  </Button>
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setSearch("");
                      setOrganisation("");
                      setNotices("All");
                    }}
                  >
                    Reset
                  </Button>
                  <Button variant="secondary" onClick={refresh}>
                    Refresh people
                  </Button>
                </div>
                <p>
                  <Link href={href("/customers/new?kind=person")}>
                    Create person
                  </Link>
                </p>
                <p>
                  <Link
                    href={href(
                      `${pathname}?${new URLSearchParams({ ...Object.fromEntries(query), people_layout: "directory" })}`,
                    )}
                  >
                    Saved views (earlier directory)
                  </Link>
                </p>
                <p>
                  Online only. Counts cover permitted records. Notice exceptions
                  are per company and message class.
                </p>
              </form>
            )}
          </WorklistPanel>
        )}
      </div>
    </SecondaryMenuFrame>
  );
}
