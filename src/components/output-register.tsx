"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ReadState, Status, useResource } from "./business-ui";
import { Button, ButtonLink } from "./ui/button";
import { RegisterTable } from "./ui/register-table";
import { ProductIcon } from "./product-icons";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "./crm-worklist-tools";
import { SecondaryMenuFrame, useSecondaryMenu } from "../shell/secondary-menu";
import { usePublishPageDescription } from "../shell/page-description";
import {
  coverageLabel,
  familyLabel,
  outputHref,
  outputViews,
  progressLabel,
  revisionLabel,
  type OutputList,
  type OutputListRow,
} from "../outputs/presentation";

export function OutputTime({ value }: { value?: string | null }) {
  return value ? (
    <time dateTime={value}>
      {new Intl.DateTimeFormat("en-AU", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "Australia/Brisbane",
      }).format(new Date(value))}
    </time>
  ) : (
    <>Not recorded</>
  );
}
export function OutputFacts({ row }: { row: OutputListRow }) {
  return (
    <dl className="output-facts">
      <dt>Family</dt>
      <dd>
        {familyLabel(row.kind)} · {row.kind === "JobPack" ? "OUT-09" : "OUT-10"}
      </dd>
      <dt>Source state</dt>
      <dd>
        <Status value={row.source_state} />
      </dd>
      <dt>Current revision</dt>
      <dd>{revisionLabel(row.current_revision_number)}</dd>
      <dt>Current issue</dt>
      <dd>
        {row.current_issue ? (
          <>
            {revisionLabel(row.current_issue.revision_number)} ·{" "}
            <OutputTime value={row.current_issue.issued_at} />
          </>
        ) : row.availability === "NotProvided" ? (
          "Not provided"
        ) : (
          "Not issued"
        )}
      </dd>
      <dt>Preparation</dt>
      <dd>
        {row.preparation ? (
          <>
            {row.preparation.state} ·{" "}
            {revisionLabel(row.preparation.revision_number)}
          </>
        ) : row.availability === "NotProvided" ? (
          "Not provided"
        ) : (
          "Not recorded"
        )}
      </dd>
      <dt>Review</dt>
      <dd>
        {row.needs_review === null
          ? "Not provided"
          : row.needs_review
            ? "Needs review"
            : "No flag"}
      </dd>
      <dt>Recipient progress</dt>
      <dd>{progressLabel(row.recipient_summary)}</dd>
      <dt>Required recipients</dt>
      <dd>
        {row.recipient_summary.required_recipient_count === null
          ? "Not provided"
          : `${row.recipient_summary.required_acknowledged_count} of ${row.recipient_summary.required_recipient_count} acknowledged${row.recipient_summary.visibility === "OwnRecipient" ? " · your row only" : ""}`}
      </dd>
      <dt>Work order</dt>
      <dd>
        <Link href={`/service/work-orders/${row.work_order.id}`}>
          {row.work_order.reference}
        </Link>
      </dd>
      <dt>Appointment</dt>
      <dd>
        <Link href={`/service/appointments/${row.appointment.id}`}>
          {row.appointment.reference}
        </Link>
      </dd>
      <dt>Customer</dt>
      <dd>{row.labels.customer ?? "Not provided"}</dd>
      <dt>Site</dt>
      <dd>{row.labels.site ?? "Not provided"}</dd>
      <dt>Service owner</dt>
      <dd>{row.labels.service_owner ?? "Not provided"}</dd>
      <dt>Company</dt>
      <dd>{row.labels.company ?? "Not provided"}</dd>
    </dl>
  );
}
function OutputSnapshot({
  row,
  onClose,
  onMove,
  position,
}: {
  row: OutputListRow;
  onClose: () => void;
  onMove: (step: number) => void;
  position: string;
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
      className="output-snapshot"
      aria-label={`Snapshot of ${row.reference}`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <header>
        <div>
          <small>Output snapshot · {position}</small>
          <h2>{row.reference}</h2>
        </div>
        <Button aria-label="Close snapshot" onClick={onClose}>
          <ProductIcon name="close" />
        </Button>
      </header>
      <div className="output-snapshot-body">
        <OutputFacts row={row} />
        <h3>Current issued output</h3>
        <p>
          Exact bytes:{" "}
          {row.availability === "NotChecked"
            ? "Not checked"
            : row.availability === "NotProvided"
              ? "Not provided"
              : "Not issued"}
        </p>
        {row.current_issue && (
          <p className="output-hash">{row.current_issue.output_hash}</p>
        )}
        <p className="output-note">
          This snapshot does not open files or record distribution. Open the
          exact issue to check its retained bytes and responses.
        </p>
      </div>
      <footer>
        <div className="output-actions">
          <Button onClick={() => onMove(-1)} aria-label="Previous output">
            <ProductIcon name="collapse" />
          </Button>
          <Button onClick={() => onMove(1)} aria-label="Next output">
            <ProductIcon name="expand" />
          </Button>
        </div>
        <ButtonLink variant="primary" href={outputHref(row.kind, row.id)}>
          Open output
        </ButtonLink>
        <ButtonLink href={row.native_href}>
          Open {familyLabel(row.kind).toLowerCase()}
        </ButtonLink>
      </footer>
    </aside>
  );
}
export function OutputsRegisterScreen() {
  const params = useSearchParams();
  return <OutputRegister key={params.toString()} />;
}
function OutputRegister() {
  const router = useRouter(),
    params = useSearchParams(),
    query = params.toString();
  const serverQuery = new URLSearchParams(
    [...params].filter(([key]) =>
      [
        "kind",
        "q",
        "company_id",
        "site_id",
        "organisation_id",
        "owner_id",
        "view",
        "offset",
        "limit",
      ].includes(key),
    ),
  ).toString();
  const resource = useResource<OutputList>(
    `document-outputs${serverQuery ? `?${serverQuery}` : ""}`,
  );
  const data = !resource.loading && !resource.error ? resource.data : null;
  const [menuOpen, setMenuOpen] = useState(true),
    [filters, setFilters] = useState(false),
    [search, setSearch] = useState(params.get("q") ?? ""),
    [snapshot, setSnapshot] = useState<string | null>(null),
    [selected, setSelected] = useState<string[]>([]);
  const [contextColumns, setContextColumns] = useState(true);
  const menu = useSecondaryMenu(menuOpen, setMenuOpen),
    view = params.get("view") ?? "all";
  usePublishPageDescription(
    "Outputs",
    "Find permitted job packs and service reports, inspect exact retained issues and recover supported native actions. Families and counts are bounded by the source contracts. Synthetic distribution is not external delivery.",
  );
  const key = (row: OutputListRow) => `${row.kind}:${row.id}`;
  const update = (name: string, value: string) => {
    const q = new URLSearchParams(query);
    if (value) q.set(name, value);
    else q.delete(name);
    if (name !== "offset") q.delete("offset");
    router.replace(`/documents/issues${q.size ? `?${q}` : ""}`);
  };
  const refresh = () => {
    setSnapshot(null);
    setSelected([]);
    resource.reload();
  };
  const current = data?.items.find((row) => key(row) === snapshot),
    chosen = data?.items.filter((row) => selected.includes(key(row))) ?? [];
  const scope = chosen.length ? chosen : (data?.items ?? []),
    position = current
      ? scope.findIndex((row) => key(row) === key(current))
      : -1;
  const move = (step: number) => {
    if (scope.length)
      setSnapshot(
        key(
          scope[(Math.max(0, position) + step + scope.length) % scope.length],
        ),
      );
  };
  const filterControls = (
    <>
      <WorklistChoice
        label="Family"
        value={params.get("kind") ?? ""}
        options={[
          { id: "", label: "All families" },
          { id: "JobPack", label: "Job packs" },
          { id: "ServiceReport", label: "Service reports" },
        ]}
        onChange={(v) => update("kind", v)}
      />
      {(
        [
          ["organisation_id", "customers", "Customer"],
          ["site_id", "sites", "Site"],
          ["owner_id", "owners", "Service owner"],
        ] as const
      ).map(([field, facet, label]) => (
        <WorklistChoice
          key={field}
          label={label}
          value={params.get(field) ?? ""}
          options={[{ id: "", label }, ...(data?.facets[facet] ?? [])]}
          onChange={(v) => update(field, v)}
          disabled={!data}
        />
      ))}
    </>
  );
  const searchForm = (
    <form
      className="output-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        update("q", search.trim());
      }}
    >
      <input
        aria-label="Search output, work order or appointment reference"
        value={search}
        maxLength={200}
        placeholder="Search outputs"
        onChange={(e) => setSearch(e.target.value)}
      />
      <Button type="submit" aria-label="Search outputs">
        <ProductIcon name="search" />
      </Button>
    </form>
  );
  return (
    <SecondaryMenuFrame
      state={menu}
      id="ppo-outputs"
      name="Outputs"
      menuId="output-menu"
      contentId="output-content"
      message="Outputs views"
      phoneHeader={{
        title: outputViews.find((v) => v.id === view)?.label ?? "Outputs",
        count: data ? coverageLabel(data) : undefined,
        filter: { open: () => setFilters(true), applied: !!query },
        pageAction: {
          label: "Search outputs",
          icon: "search",
          search: true,
          onSelect: () => setFilters(true),
        },
      }}
      menu={
        <nav aria-label="Output views">
          {outputViews.map((item) => (
            <div key={item.id}>
              {item.id === "exceptions" && <h2>Needs attention</h2>}
              <button
                aria-current={view === item.id ? "page" : undefined}
                onClick={() => {
                  update("view", item.id);
                  menu.closeOverlay();
                }}
              >
                <ProductIcon
                  name={
                    item.id === "exceptions"
                      ? "warning"
                      : item.id === "preparing"
                        ? "clock"
                        : "documents"
                  }
                />
                {item.label}
              </button>
            </div>
          ))}
          <h2>Other document pages</h2>
          <button
            disabled
            title="Document library workspace is not available in this build"
          >
            <ProductIcon name="documents" />
            Document library <small>Unavailable</small>
          </button>
          <button
            disabled
            title="Templates workspace is not available in this build"
          >
            <ProductIcon name="documents" />
            Templates <small>Unavailable</small>
          </button>
        </nav>
      }
    >
      <div className="output-register">
        <h1 className="sr-only">Outputs</h1>
        <div className="output-toolbar">
          {searchForm}
          <div className="output-filters">{filterControls}</div>
          <Button
            aria-label="Refresh outputs"
            onClick={refresh}
            disabled={resource.loading}
          >
            <ProductIcon name="changes" />
          </Button>
          <WorklistMenu label="Output options" icon="more">
            <label>
              <input
                type="checkbox"
                checked={contextColumns}
                onChange={(e) => setContextColumns(e.target.checked)}
              />{" "}
              Show context columns
            </label>
            <p>
              Sorted by source update, newest first. Other output families are
              unavailable in this build.
            </p>
          </WorklistMenu>
        </div>
        {!!serverQuery && (
          <div className="output-filter-summary">
            <span>
              {outputViews.find((v) => v.id === view)?.label ?? view}
              {params.get("q")
                ? ` · Reference contains “${params.get("q")}”`
                : ""}
            </span>
            <Button
              variant="quiet"
              onClick={() => router.replace("/documents/issues")}
            >
              Clear filters
            </Button>
          </div>
        )}
        <div className="output-register-body">
          <div className="output-results">
            <div className="output-read-state">
              <ReadState
                loading={resource.loading}
                error={resource.error}
                retry={refresh}
              />
            </div>
            {data && (
              <>
                <div className="output-coverage" role="status">
                  <span>{coverageLabel(data)}</span>
                  {data.coverage.some(
                    (c) =>
                      c.state === "BoundedWindow" || c.state === "NotPermitted",
                  ) && (
                    <p>
                      {data.coverage
                        .filter((c) => c.state !== "NotSelected")
                        .map(
                          (c) =>
                            `${familyLabel(c.kind)}: ${c.state === "BoundedWindow" ? `first ${data.window_limit_per_family} permitted outputs only` : c.state === "NotPermitted" ? "not permitted" : "complete permitted read"}`,
                        )
                        .join(" · ")}
                      . No complete total is claimed.
                    </p>
                  )}
                </div>
                {selected.length > 0 && (
                  <div className="output-selection">
                    <strong>{selected.length} selected on this page</strong>
                    <Button onClick={() => setSnapshot(key(chosen[0]))}>
                      Review selected
                    </Button>
                    <Button variant="quiet" onClick={() => setSelected([])}>
                      Clear selection
                    </Button>
                    <span>Review one output at a time.</span>
                  </div>
                )}
                {!data.items.length ? (
                  <div className="output-empty">
                    <ProductIcon name="documents" />
                    <h2>
                      {data.coverage.some(
                        (c) =>
                          c.state === "BoundedWindow" ||
                          c.state === "NotPermitted",
                      )
                        ? "No matches in the permitted windows"
                        : "No matching outputs"}
                    </h2>
                    <p>
                      Try another view or clear filters. Only job packs and
                      service reports are supported.
                    </p>
                    <Button onClick={() => router.replace("/documents/issues")}>
                      Clear filters
                    </Button>
                  </div>
                ) : (
                  <>
                    <div
                      className="output-grid"
                      tabIndex={0}
                      role="region"
                      aria-label="Outputs table; scroll for additional columns"
                    >
                      <RegisterTable caption="Permitted Outputs. Open a reference for its exact issue, or select outputs to review snapshots individually.">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                aria-label="Select all outputs on this page"
                                checked={data.items.every((r) =>
                                  selected.includes(key(r)),
                                )}
                                onChange={(e) =>
                                  setSelected(
                                    e.target.checked ? data.items.map(key) : [],
                                  )
                                }
                              />
                            </th>
                            {[
                              "Output",
                              "Family",
                              "Source state",
                              "Current issue",
                              "Current revision",
                              "Recipient progress",
                              "Preparation",
                              "Review",
                              ...(contextColumns
                                ? [
                                    "Work order",
                                    "Appointment",
                                    "Customer",
                                    "Site",
                                    "Service owner",
                                  ]
                                : []),
                              "Updated",
                            ].map((label) => (
                              <th key={label} scope="col">
                                {label}
                              </th>
                            ))}
                            <th scope="col" className="output-row-action">
                              <span className="sr-only">Snapshot</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.items.map((row) => (
                            <tr
                              key={key(row)}
                              aria-selected={selected.includes(key(row))}
                            >
                              <td>
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${row.reference}`}
                                  checked={selected.includes(key(row))}
                                  onChange={(e) =>
                                    setSelected((old) =>
                                      e.target.checked
                                        ? [...old, key(row)]
                                        : old.filter((id) => id !== key(row)),
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <Link href={outputHref(row.kind, row.id)}>
                                  {row.reference}
                                </Link>
                              </td>
                              <td>{familyLabel(row.kind)}</td>
                              <td>
                                <Status value={row.source_state} />
                              </td>
                              <td>
                                {row.current_issue
                                  ? `${revisionLabel(row.current_issue.revision_number)} · Issued`
                                  : row.availability === "NotProvided"
                                    ? "Not provided"
                                    : "Not issued"}
                              </td>
                              <td>
                                {revisionLabel(row.current_revision_number)}
                              </td>
                              <td>{progressLabel(row.recipient_summary)}</td>
                              <td>
                                {row.preparation?.state ?? "Not recorded"}
                              </td>
                              <td>
                                {row.needs_review === null
                                  ? "Not provided"
                                  : row.needs_review
                                    ? "Needs review"
                                    : "No flag"}
                              </td>
                              {contextColumns && (
                                <>
                                  <td>{row.work_order.reference}</td>
                                  <td>{row.appointment.reference}</td>
                                  <td>
                                    {row.labels.customer ?? "Not provided"}
                                  </td>
                                  <td>{row.labels.site ?? "Not provided"}</td>
                                  <td>
                                    {row.labels.service_owner ?? "Not provided"}
                                  </td>
                                </>
                              )}
                              <td>
                                <OutputTime value={row.updated_at} />
                              </td>
                              <td className="output-row-action">
                                <Button
                                  variant="quiet"
                                  aria-label={`Snapshot ${row.reference}`}
                                  onClick={() => setSnapshot(key(row))}
                                >
                                  <ProductIcon name="eye" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </RegisterTable>
                    </div>
                    <div className="output-phone-list">
                      {data.items.map((row) => (
                        <Link
                          key={key(row)}
                          href={outputHref(row.kind, row.id)}
                          className="output-phone-row"
                        >
                          <div>
                            <strong>{row.reference}</strong>
                            <Status value={row.source_state} />
                          </div>
                          <p>
                            {familyLabel(row.kind)} · {row.work_order.reference}
                          </p>
                          <p>
                            {row.current_issue
                              ? `Current issue ${revisionLabel(row.current_issue.revision_number)}`
                              : row.availability === "NotProvided"
                                ? "Issue not provided"
                                : "Not issued"}{" "}
                            ·{" "}
                            {row.preparation?.state ??
                              "No preparation recorded"}
                          </p>
                          <small>
                            {progressLabel(row.recipient_summary)} ·{" "}
                            <OutputTime value={row.updated_at} />
                          </small>
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                <footer className="output-window">
                  <span>
                    As at <OutputTime value={data.as_at} /> · Brisbane ·{" "}
                    {data.offset + 1 > data.matching_in_window
                      ? 0
                      : data.offset + 1}
                    –
                    {Math.min(
                      data.offset + data.items.length,
                      data.matching_in_window,
                    )}{" "}
                    in this window
                  </span>
                  <div className="output-actions">
                    <Button
                      disabled={!data.offset}
                      onClick={() =>
                        update(
                          "offset",
                          String(Math.max(0, data.offset - data.limit)),
                        )
                      }
                    >
                      Previous page
                    </Button>
                    <Button
                      disabled={!data.has_more_in_window}
                      onClick={() =>
                        update("offset", String(data.offset + data.limit))
                      }
                    >
                      Next page
                    </Button>
                  </div>
                </footer>
              </>
            )}
          </div>
          {current && (
            <OutputSnapshot
              row={current}
              onClose={() => setSnapshot(null)}
              onMove={move}
              position={`${position + 1} of ${scope.length}`}
            />
          )}
        </div>
      </div>
      {filters && (
        <WorklistPanel
          title="Search and filter outputs"
          onClose={() => setFilters(false)}
          drawer
        >
          <div className="output-filter-panel">
            {searchForm}
            {filterControls}
            <p>
              Filter choices cover the permitted family windows. Other families
              are unavailable.
            </p>
            <Button onClick={() => router.replace("/documents/issues")}>
              Clear filters
            </Button>
            <Button onClick={refresh}>Refresh outputs</Button>
          </div>
        </WorklistPanel>
      )}
    </SecondaryMenuFrame>
  );
}
