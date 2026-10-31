"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, ReadState, Status, Stamp } from "./business-ui";
import { ShellIcon } from "./shell-icon";
import { Button } from "./ui/button";
import { RegisterTable, RegisterSortHeader } from "./ui/register-table";
import { WorklistMenu, WorklistPanel } from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePublishPageDescription } from "../shell/page-description";
import {
  libraryViews,
  reviewLabel,
  revisionName,
  recordHref,
  currentUseReasons,
  type LibraryItem,
  type LibraryPage,
} from "../library/model";
import { LibraryCommand } from "./library-command";
import { LibraryChoice } from "./library-choice";
import "./library.css";

// Re-read the displayed window when loading more so revoked rows are not retained.
export function useLibraryWindow(path: string | null, pages = 1) {
  const [window, setWindow] = useState({ pages, attempt: 0 });
  const [result, setResult] = useState<{
    path: string;
    request: typeof window;
    data: LibraryPage | null;
    error: unknown;
  } | null>(null);
  useEffect(() => {
    if (!path) return;
    let live = true;
    async function read() {
      let cursor: string | null = null;
      const items = new Map<string, LibraryItem>();
      let page: LibraryPage;
      for (let i = 0; i < window.pages; i++) {
        page = await api<LibraryPage>(
          `${path}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`,
        );
        if (!live) return;
        for (const item of page.items) items.set(item.document.id, item);
        cursor = page.next_cursor;
        if (!cursor) break;
      }
      return { ...page!, items: [...items.values()] };
    }
    void read().then(
      (data) => {
        if (live && data)
          setResult({ path, request: window, data, error: null });
      },
      (error) => {
        if (live) setResult({ path, request: window, data: null, error });
      },
    );
    return () => {
      live = false;
    };
  }, [path, window]);
  const current = result?.path === path && result.request === window;
  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: !!path && !current,
    pages: window.pages,
    reload: () => setWindow((w) => ({ ...w, attempt: w.attempt + 1 })),
    more: () => setWindow((w) => ({ ...w, pages: w.pages + 1 })),
  };
}

export function LibraryFacts({ item }: { item: LibraryItem }) {
  return (
    <dl className="library-facts">
      <dt className="library-facts-section">Document</dt>
      <dd className="sr-only">Exact revision details</dd>
      <dt>Number</dt>
      <dd>{item.document.display_number}</dd>
      <dt>Type</dt>
      <dd>{item.revision.document_type}</dd>
      <dt>Revision</dt>
      <dd>
        {revisionName(item.revision.revision)} ·{" "}
        {item.library_current ? "Current" : "Historical"}
      </dd>
      <dt>State</dt>
      <dd>{item.document.state}</dd>
      <dt>Owner</dt>
      <dd>{item.owner_name}</dd>
      <dt>Audience</dt>
      <dd>{item.revision.audience}</dd>
      <dt>Applicability</dt>
      <dd>{item.revision.applicability}</dd>
      <dt className="library-facts-section">Context</dt>
      <dd className="sr-only">Fixed at registration</dd>
      <dt>Company</dt>
      <dd>{item.company_name ?? "Unavailable"}</dd>
      <dt>Customer</dt>
      <dd>
        <Link href={`/customers/${item.document.organisation_id}`}>
          {item.organisation_name}
        </Link>
      </dd>
      <dt>Site</dt>
      <dd>
        {item.document.site_id && item.site_name ? (
          <Link href={`/sites/${item.document.site_id}`}>{item.site_name}</Link>
        ) : item.document.site_id ? (
          "Unavailable"
        ) : (
          "No site"
        )}
      </dd>
      <dt className="library-facts-section">
        Source · {revisionName(item.revision.revision)}
      </dt>
      <dd className="sr-only">Exact source identity</dd>
      <dt>Kind</dt>
      <dd>
        {
          {
            SyntheticText: "Synthetic text",
            JobPackIssue: "Issued job pack",
            ReportIssue: "Issued service report",
          }[item.revision.source.kind]
        }
      </dd>
      <dt>Author</dt>
      <dd>{item.source_author_name}</dd>
      <dt>Size</dt>
      <dd>{item.revision.source.byte_count.toLocaleString()} bytes</dd>
      <dt>SHA-256</dt>
      <dd className="library-hash">{item.revision.source.content_hash}</dd>
      <dt>Registered</dt>
      <dd>
        <Stamp value={item.revision.created_at} />
      </dd>
      <dt>Reason</dt>
      <dd>{item.revision.reason}</dd>
    </dl>
  );
}
export function LibraryEligibility({ item }: { item: LibraryItem }) {
  return (
    <div className="library-eligibility">
      <strong>
        {item.eligible_for_current_use ? "Eligible" : "Not eligible"} for
        current use
      </strong>
      {currentUseReasons(item).map((reason) => (
        <span key={reason.label} data-ok={reason.ok}>
          {reason.ok ? "✓ " : "– "}
          {reason.label}
        </span>
      ))}
      <small>Library evidence, not permission to work</small>
    </div>
  );
}
export function LibraryRegister() {
  const params = useSearchParams(),
    router = useRouter(),
    query = params.toString();
  return (
    <LibraryRegisterView
      key={query}
      query={query}
      navigate={(q) => router.replace(`/documents${q ? `?${q}` : ""}`)}
    />
  );
}
function LibraryRegisterView({
  query,
  navigate,
}: {
  query: string;
  navigate: (q: string) => void;
}) {
  const params = new URLSearchParams(query),
    requestedView = params.get("view") ?? "Current documents",
    view = libraryViews.includes(requestedView)
      ? requestedView
      : "Current documents";
  const server = new URLSearchParams();
  for (const key of [
    "q",
    "company_id",
    "organisation_id",
    "site_id",
    "owner_id",
    "document_type",
    "sort",
    "direction",
  ]) {
    const value = params.get(key);
    if (value) server.set(key, value);
  }
  server.delete("view");
  if (view === "My documents") server.set("mine", "true");
  if (view === "Withdrawn" || view === "All documents")
    server.set("state", view === "Withdrawn" ? "Withdrawn" : "All");
  if (["Unreviewed", "Review outdated", "Returned", "Reviewed"].includes(view))
    server.set(
      "review_state",
      view.replace("Review outdated", "ReviewOutdated"),
    );
  if (view === "Content unavailable")
    server.set("availability", "ExactUnavailable");
  const resource = useLibraryWindow(`document-library?${server}`),
    data = !resource.loading && !resource.error ? resource.data : null;
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [search, setSearch] = useState(params.get("q") ?? ""),
    [filters, setFilters] = useState(false),
    [snapshot, setSnapshot] = useState<string | null>(null),
    [create, setCreate] = useState(false),
    [selected, setSelected] = useState<string[]>([]);
  usePublishPageDescription(
    "Document library",
    "Find exact permitted revisions. Content, source currency and review remain separate. Library evidence never grants permission to work.",
  );
  const update = (name: string, value: string) => {
    const q = new URLSearchParams(query);
    q.delete("cursor");
    if (name === "organisation_id") q.delete("site_id");
    if (name === "view" && value === "My documents") q.delete("owner_id");
    if (value) q.set(name, value);
    else q.delete(name);
    navigate(q.toString());
  };
  const refresh = () => {
    setSnapshot(null);
    setSelected([]);
    resource.reload();
  };
  const controls = (
    <>
      <LibraryChoice
        label="Customer"
        kind="Organisation"
        value={params.get("organisation_id") ?? ""}
        onChange={(v) => update("organisation_id", v)}
      />
      <LibraryChoice
        label="Site"
        kind="Site"
        value={params.get("site_id") ?? ""}
        onChange={(v) => update("site_id", v)}
        scope={{ organisation_id: params.get("organisation_id") ?? "" }}
      />
      {view !== "My documents" && (
        <LibraryChoice
          label="Owner"
          kind="RecordedOwner"
          value={params.get("owner_id") ?? ""}
          onChange={(v) => update("owner_id", v)}
        />
      )}
      <label className="library-type-filter">
        Type
        <select
          value={params.get("document_type") ?? ""}
          onChange={(e) => update("document_type", e.target.value)}
        >
          <option value="">All types</option>
          {[
            "Installation notes",
            "Procedure",
            "Schedule",
            "Issued job pack",
            "Issued service report",
            "Commissioning record",
          ].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
    </>
  );
  const searchForm = (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update("q", search.trim());
      }}
    >
      <input
        aria-label="Search title, number, type"
        placeholder="Search title, number, type"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        maxLength={200}
      />
      <Button type="submit" aria-label="Search documents">
        <ShellIcon name="search" />
      </Button>
    </form>
  );
  const current = data?.items.find((i) => i.document.id === snapshot);
  const listContext = {
    query,
    listQuery: server.toString(),
    pages: resource.pages,
  };
  const sort = (name: string) => {
    const q = new URLSearchParams(query);
    q.delete("cursor");
    q.set("sort", name);
    q.set(
      "direction",
      params.get("sort") === name && params.get("direction") !== "desc"
        ? "desc"
        : "asc",
    );
    navigate(q.toString());
  };
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-library"
      attributes={{ "data-ppo-workspace": "shared" }}
      name="Document library"
      menuId="library-menu"
      contentId="library-content"
      message="Document views"
      phoneHeader={{
        title: view,
        count: data ? `${data.items.length} shown` : undefined,
        filter: { open: () => setFilters(true), applied: !!query },
        pageAction: data?.can_register
          ? {
              label: "Register document",
              icon: "plus",
              onSelect: () => setCreate(true),
            }
          : undefined,
      }}
      menu={
        <nav aria-label="Document views">
          <ul>
            {libraryViews.map((v, i) => (
              <li key={v}>
                {i === 4 && <h2>Review</h2>}
                {i === 8 && <h2>Needs attention</h2>}
                <Link
                  href={`/documents?view=${encodeURIComponent(v)}`}
                  aria-current={view === v ? "page" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    update("view", v);
                    menu.closeOverlay();
                  }}
                >
                  <ShellIcon name="nav-documents" />
                  {v}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/documents/issues">
                <ShellIcon name="nav-documents" />
                Outputs
              </Link>
            </li>
          </ul>
        </nav>
      }
    >
      <div className="library-register">
        <h1 className="sr-only">Document library</h1>
        <div className="library-toolbar">
          {searchForm}
          {controls}
          <Button
            onClick={refresh}
            disabled={resource.loading}
            aria-label="Refresh documents"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={() => setCreate(true)}
            disabled={!data?.can_register}
          >
            Register document
          </Button>
          <WorklistMenu label="Library options" icon="more">
            <Button onClick={() => setFilters(true)}>Search and filters</Button>
            <Button onClick={() => navigate("")}>Reset filters</Button>
            <p>Live permitted results; no total is claimed.</p>
          </WorklistMenu>
        </div>
        <ReadState
          loading={resource.loading}
          error={resource.error}
          retry={refresh}
        />
        {data && (
          <>
            <div className="library-desktop">
              <RegisterTable
                caption="Document library. Open a title for its exact revision; use Snapshot to inspect it here."
                empty={
                  !data.items.length ? (
                    <p>
                      No matching documents. Change filters or register a
                      document.
                    </p>
                  ) : undefined
                }
              >
                <thead>
                  <tr>
                    <th scope="col">Select</th>
                    <th scope="col">Document</th>
                    <th scope="col">Rev</th>
                    <th scope="col">Current use</th>
                    <th scope="col">Review</th>
                    <th scope="col">Content</th>
                    <th scope="col">Source</th>
                    <th scope="col">Type</th>
                    <th scope="col">Unresolved</th>
                    <th scope="col">Source kind</th>
                    <RegisterSortHeader
                      label="Number"
                      direction={
                        params.get("sort") === "number"
                          ? params.get("direction") === "desc"
                            ? "descending"
                            : "ascending"
                          : undefined
                      }
                      onSort={() => sort("number")}
                    />
                    <th scope="col">Customer</th>
                    <th scope="col">Site</th>
                    <th scope="col">Owner</th>
                    <RegisterSortHeader
                      label="Updated"
                      direction={
                        params.get("sort") === "updated"
                          ? params.get("direction") === "desc"
                            ? "descending"
                            : "ascending"
                          : undefined
                      }
                      onSort={() => sort("updated")}
                    />
                    <th scope="col">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.document.id}
                      data-selected={
                        selected.includes(item.document.id) || undefined
                      }
                      data-inspected={
                        snapshot === item.document.id || undefined
                      }
                    >
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.revision.title}`}
                          checked={selected.includes(item.document.id)}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? [...selected, item.document.id]
                                : selected.filter(
                                    (id) => id !== item.document.id,
                                  ),
                            )
                          }
                        />
                      </td>
                      <td>
                        <Link href={recordHref(item, listContext)}>
                          {item.revision.title}
                        </Link>
                      </td>
                      <td>{revisionName(item.revision.revision)}</td>
                      <td>
                        {item.eligible_for_current_use
                          ? "Eligible"
                          : "Not eligible"}
                      </td>
                      <td>
                        <Status value={reviewLabel(item.review_state)} />
                      </td>
                      <td>
                        {item.availability === "Available"
                          ? "Available"
                          : "Unavailable"}
                      </td>
                      <td>{item.source_current ? "Current" : "Superseded"}</td>
                      <td>{item.revision.document_type}</td>
                      <td>{item.unresolved_findings}</td>
                      <td>{item.revision.source.kind}</td>
                      <td>{item.document.display_number}</td>
                      <td>{item.organisation_name}</td>
                      <td>{item.site_name ?? "No site"}</td>
                      <td>{item.owner_name}</td>
                      <td>
                        {new Date(item.document.updated_at).toLocaleDateString(
                          "en-AU",
                        )}
                      </td>
                      <td>
                        <Button
                          onClick={() => setSnapshot(item.document.id)}
                          aria-label={`Snapshot of ${item.revision.title}`}
                        >
                          Snapshot
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RegisterTable>
            </div>
            <div className="library-phone-list">
              {!data.items.length && (
                <p>
                  No matching documents. Change filters or register a document.
                </p>
              )}
              {data.items.map((item) => (
                <article key={item.document.id}>
                  <Link href={recordHref(item, listContext)}>
                    <strong>{item.revision.title}</strong>
                    <span>
                      {item.document.display_number} ·{" "}
                      {revisionName(item.revision.revision)}
                    </span>
                  </Link>
                  <Status value={reviewLabel(item.review_state)} />
                  <p>
                    {item.eligible_for_current_use
                      ? "Eligible for current use"
                      : currentUseReasons(item)
                          .filter((r) => !r.ok)
                          .map((r) => r.label)
                          .join(" · ")}
                  </p>
                  <Button onClick={() => setSnapshot(item.document.id)}>
                    Snapshot
                  </Button>
                </article>
              ))}
            </div>
            <footer className="library-footer">
              {data.items.length} shown · Live read · No total claimed{" "}
              {data.next_cursor ? (
                <Button
                  onClick={() => {
                    setSnapshot(null);
                    setSelected([]);
                    resource.more();
                  }}
                >
                  Load 25 more
                </Button>
              ) : (
                <span>End of list</span>
              )}
              {selected.length > 0 && (
                <Button onClick={() => setSnapshot(selected[0])}>
                  Inspect {selected.length} selected on this page
                </Button>
              )}
            </footer>
          </>
        )}
        {filters && (
          <WorklistPanel
            title="Search and filter documents"
            onClose={() => setFilters(false)}
          >
            {searchForm}
            {controls}
            <Button onClick={() => navigate("")}>Reset filters</Button>
          </WorklistPanel>
        )}
        {current && (
          <LibrarySnapshot
            item={current}
            href={recordHref(current, listContext)}
            close={() => setSnapshot(null)}
            next={
              selected.length > 1
                ? () =>
                    setSnapshot(
                      selected[
                        (selected.indexOf(current.document.id) + 1) %
                          selected.length
                      ],
                    )
                : undefined
            }
          />
        )}
        {create && (
          <LibraryCommand
            intent="Register"
            onClose={() => setCreate(false)}
            onSaved={(id) => {
              setCreate(false);
              navigate("");
              window.location.assign(`/documents/library/${id}`);
            }}
          />
        )}
      </div>
    </SecondaryMenuFrame>
  );
}

function LibrarySnapshot({
  item,
  href,
  close,
  next,
}: {
  item: LibraryItem;
  href: string;
  close: () => void;
  next?: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <aside
      ref={ref}
      tabIndex={-1}
      className="library-snapshot"
      aria-label={`Snapshot of ${item.revision.title}`}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          close();
        }
      }}
    >
      <header>
        <h2>{item.revision.title}</h2>
        <Button onClick={close} aria-label="Close snapshot">
          Close
        </Button>
      </header>
      <LibraryEligibility item={item} />
      <LibraryFacts item={item} />
      <Link href={href}>Open exact record</Link>
      {next && <Button onClick={next}>Next selected</Button>}
    </aside>
  );
}
