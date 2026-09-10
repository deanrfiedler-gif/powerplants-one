"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import {
  ReadState,
  useResource,
  type Envelope,
  type Option,
} from "./business-ui";
import { ProductIcon } from "./product-icons";
import type { Appointment, Resource, Schedule } from "./planner-screens";
import type { Order } from "./work-order-screens";
import {
  currentCrew,
  dayWindow,
  filterVisits,
  label,
  nextAction,
  preparationReasons,
  visitStatuses,
  type VisitFilters,
} from "../scheduling/field-technicians-view";
import { localDateTime } from "../scheduling/time";

const zone = "Australia/Brisbane";
type View = "visits" | "team" | "attention";
const views = [
  ["visits", "Visits"],
  ["team", "Technicians"],
  ["attention", "Needs preparation"],
] as const;
const sections = [
  ["summary", "Overview"],
  ["pack", "Job pack"],
  ["history", "Asset history"],
  ["notes", "Field notes"],
] as const;
const blank = (): VisitFilters => ({
  search: "",
  person: "",
  status: "",
  sort: "time",
});
const time = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
const stamp = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: zone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
function tabKeys(event: KeyboardEvent<HTMLDivElement>) {
  const tabs = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ];
  const index = tabs.indexOf(event.target as HTMLButtonElement);
  if (index < 0) return;
  const next =
    event.key === "ArrowRight"
      ? (index + 1) % tabs.length
      : event.key === "ArrowLeft"
        ? (index + tabs.length - 1) % tabs.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? tabs.length - 1
            : -1;
  if (next >= 0) {
    event.preventDefault();
    tabs[next].focus();
    tabs[next].click();
  }
}
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`ft-status ${value === "InProgress" ? "progress" : value === "CompletedPendingReview" ? "attention" : ""}`}
    >
      {label(value)}
    </span>
  );
}
function Person({ name }: { name: string }) {
  return (
    <div className="ft-person">
      <span className="ft-avatar" aria-hidden="true">
        {name
          .split(/\s+/)
          .slice(0, 2)
          .map((s) => s[0])
          .join("")}
      </span>
      <span>{name}</span>
    </div>
  );
}
function Assets({ appointment }: { appointment: Appointment }) {
  const read = useResource<Envelope<Order>>(
    `service/work-orders/${appointment.work_order_id}`,
  );
  const order = !read.loading && !read.error ? read.data?.items[0] : null;
  const scope = order?.scopes.find(
    (s) =>
      s.id === appointment.scope_revision_id &&
      s.version === appointment.scope_version,
  );
  const assets = [
    ...new Map(
      scope?.items.flatMap((i) => i.assets).map((a) => [a.asset_id, a]) ?? [],
    ).values(),
  ];
  return (
    <>
      <ReadState {...read} retry={read.reload} />
      {order && (
        <>
          {!scope ? (
            <p className="ft-callout">
              The visit’s scope version has changed or is unavailable. Reopen
              the visit to review its current equipment.
            </p>
          ) : (
            <>
              <p className="ft-detail-note">
                Equipment attached to scope revision {scope.revision}. Open an
                equipment record for its configuration and service history.
              </p>
              {assets.length ? (
                assets.map((a) => (
                  <div className="ft-check-row" key={a.asset_id}>
                    <ProductIcon name="service" />
                    <div>
                      <Link href={`/equipment/${a.asset_id}`}>
                        {a.display_name ||
                          a.display_number ||
                          "Equipment record"}
                      </Link>
                      <small>
                        {[
                          a.model,
                          a.serial && `Serial ${a.serial}`,
                          label(a.identity_status),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <p className="ft-detail-block">
                  No equipment is attached to this scope revision.
                </p>
              )}
            </>
          )}
        </>
      )}
    </>
  );
}
function VisitDetails({ id, close }: { id: string; close: () => void }) {
  const read = useResource<Envelope<Appointment>>(`appointments/${id}`);
  const a = !read.loading && !read.error ? read.data?.items[0] : null;
  const [tab, setTab] = useState<string>("summary");
  const dialog = useRef<HTMLDialogElement>(null);
  const outside = useRef(false);
  useEffect(() => {
    const d = dialog.current;
    d?.showModal();
    return () => d?.close();
  }, []);
  const isOutside = (event: { clientX: number; clientY: number }) => {
    const bounds = dialog.current?.getBoundingClientRect();
    return (
      !!bounds &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    );
  };
  return (
    <dialog
      ref={dialog}
      id="ft-job-dialog"
      aria-labelledby="ft-dialog-title"
      onCancel={close}
      onClose={(e) => {
        if (!e.currentTarget.open) close();
      }}
      onPointerDown={(e) => {
        outside.current = e.target === e.currentTarget && isOutside(e);
      }}
      onClick={(e) => {
        if (outside.current && e.target === e.currentTarget && isOutside(e))
          close();
        outside.current = false;
      }}
    >
      <header className="ft-dialog-head">
        <p className="ft-dialog-ref">{a?.display_number ?? "Visit details"}</p>
        <h2 id="ft-dialog-title">{a?.scope_summary || "Service visit"}</h2>
        {a && (
          <>
            <p className="ft-dialog-sub">
              {a.site_name} · {stamp(a.start_at)} AEST
            </p>
            <div className="ft-dialog-tags">
              <Badge value={a.status} />
              <span className="ft-small">
                Scope revision {a.scope_revision}
              </span>
            </div>
          </>
        )}
        <button
          className="ft-close ft-quiet"
          onClick={close}
          aria-label="Close job details"
        >
          <ProductIcon name="close" />
        </button>
      </header>
      <div
        className="ft-tabs"
        role="tablist"
        aria-label="Job information"
        onKeyDown={tabKeys}
      >
        {sections.map(([key, title]) => (
          <button
            key={key}
            role="tab"
            id={`ft-tab-${key}`}
            aria-controls="ft-details-panel"
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            onClick={() => setTab(key)}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="ft-dialog-body">
        <ReadState {...read} retry={read.reload} />
        {!read.loading && !read.error && !a && (
          <p>No permitted visit details are available.</p>
        )}
        {a && (
          <div
            id="ft-details-panel"
            role="tabpanel"
            aria-labelledby={`ft-tab-${tab}`}
            tabIndex={0}
          >
            {tab === "summary" && (
              <>
                <dl className="ft-info-grid">
                  <div>
                    <dt>Work order</dt>
                    <dd>
                      <Link href={`/service/work-orders/${a.work_order_id}`}>
                        {a.work_order_display_number}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt>Assigned crew</dt>
                    <dd>
                      {currentCrew(a)
                        .map((c) => c.name)
                        .join(", ") || "Unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt>Visit window · AEST</dt>
                    <dd>
                      {time(a.start_at)} – {time(a.end_at)}
                    </dd>
                  </div>
                  <div>
                    <dt>Customer commitment</dt>
                    <dd>{label(a.customer_commitment)}</dd>
                  </div>
                </dl>
                <h3>Preparation and dispatch</h3>
                <p className="ft-detail-note">
                  {preparationReasons(a).join(" · ") ||
                    (a.status.startsWith("Completed") ||
                    a.status === "Cancelled"
                      ? "Dispatch is not applicable to this visit status."
                      : "No preparation flags in this record. Check current readiness before dispatch.")}
                </p>
                {a.authorisation_blockers.length > 0 && (
                  <ul className="ft-list">
                    {a.authorisation_blockers.map((b, i) => (
                      <li key={i}>{b.message}</li>
                    ))}
                  </ul>
                )}
                <div className="ft-actions">
                  <Link href={`/service/appointments/${id}`}>
                    Open full visit
                  </Link>
                  <Link href={`/service/work-orders/${a.work_order_id}`}>
                    Open work order
                  </Link>
                </div>
              </>
            )}
            {tab === "pack" && (
              <>
                <dl className="ft-info-grid">
                  <div>
                    <dt>Pack requirement</dt>
                    <dd>{label(a.pack_requirement)}</dd>
                  </div>
                  <div>
                    <dt>Dispatch hold</dt>
                    <dd>{a.dispatch_hold ? "Held" : "No hold recorded"}</dd>
                  </div>
                </dl>
                <p className="ft-detail-note">
                  Job packs are prepared, issued and acknowledged through
                  controlled records. Acknowledgement alone does not authorise
                  field work.
                </p>
                <h3>Recorded readiness</h3>
                {a.readiness.length ? (
                  a.readiness.map((r, i) => (
                    <div key={i} className="ft-check-row">
                      <div>
                        <p>
                          {r.label} · {label(r.outcome)}
                        </p>
                        <small>{r.reason || "No reason recorded"}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No readiness assessments returned.</p>
                )}
                <div className="ft-actions">
                  <Link href="/service/packs">Open job packs</Link>
                  <Link href={`/service/appointments/${id}`}>
                    Review visit readiness
                  </Link>
                </div>
              </>
            )}
            {tab === "history" && <Assets appointment={a} />}
            {tab === "notes" && (
              <>
                <p className="ft-detail-note">
                  Assigned technicians record notes, time, parts and evidence in
                  My Jobs. Save and submit there to retain the controlled visit
                  record.
                </p>
                <h3>Coordinator follow-up</h3>
                {a.followups.length ? (
                  a.followups.map((f) => (
                    <div className="ft-check-row" key={f.activity_id}>
                      <div>
                        <Link href={`/work/${f.activity_id}`}>{f.summary}</Link>
                        <small>
                          {label(f.status)} ·{" "}
                          {f.due_at
                            ? `${stamp(f.due_at)} AEST`
                            : f.due_needed
                              ? "Due date needed"
                              : "No due date"}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No linked follow-up returned.</p>
                )}
                <div className="ft-actions">
                  <Link href="/my-jobs">Open My Jobs</Link>
                  <Link href={`/service/appointments/${id}`}>
                    Open visit handover
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      <footer className="ft-dialog-foot">
        <p>
          Visit completion, customer acceptance and billing remain separate
          steps.
        </p>
        <button className="ft-primary" onClick={close}>
          Close details
        </button>
      </footer>
    </dialog>
  );
}

export function FieldTechniciansScreen() {
  const [day, setDay] = useState(() =>
    localDateTime(new Date().toISOString(), zone).slice(0, 10),
  );
  const [site, setSite] = useState("");
  const [view, setView] = useState<View>("visits");
  const [filters, setFilters] = useState<Record<View, VisitFilters>>({
    visits: blank(),
    team: blank(),
    attention: blank(),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const returnFocus = useRef<HTMLButtonElement | null>(null);
  let path: string | null = null,
    dateError: unknown = null;
  try {
    path =
      "schedule?" +
      new URLSearchParams({
        ...dayWindow(day, zone),
        timezone: zone,
        ...(site ? { site_id: site } : {}),
      });
  } catch {
    dateError = { message: "Choose a valid date to load visits." };
  }
  const read = useResource<Schedule>(path);
  const sites = useResource<Envelope<Option>>("sites?limit=50");
  const available =
    !dateError &&
    !read.loading &&
    !read.error &&
    read.data?.completeness === "Complete";
  const data = available ? read.data : null;
  const visits = data?.items ?? [],
    resources = data?.resources ?? [];
  const f = filters[view];
  const change = (partial: Partial<VisitFilters>) =>
    setFilters((old) => ({ ...old, [view]: { ...old[view], ...partial } }));
  const filtered = filterVisits(visits, f, view === "attention");
  const team = resources
    .filter(
      (r) =>
        (!f.person || r.id === f.person) &&
        (!f.status || (f.status === "active" ? r.active : !r.active)) &&
        [r.name, r.base_timezone, ...r.skills.map((s) => s.skill_code)]
          .join(" ")
          .toLowerCase()
          .includes(f.search.trim().toLowerCase()),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  const counts = {
    visits: visits.length,
    team: resources.length,
    attention: visits.filter((v) => preparationReasons(v).length).length,
  };
  const open = (id: string, target: HTMLButtonElement | null) => {
    returnFocus.current = target;
    setSelected(id);
  };
  const close = () => {
    setSelected(null);
    returnFocus.current?.focus();
  };
  const teamVisits = (r: Resource) =>
    filterVisits(visits, { ...blank(), person: r.id });
  const selectPerson = (r: Resource) => {
    setFilters((old) => ({ ...old, visits: { ...blank(), person: r.id } }));
    setView("visits");
    document.getElementById("ft-view-visits")?.focus();
  };
  const clear = () => setFilters((old) => ({ ...old, [view]: blank() }));
  const hasFilters = !!(f.search || f.person || f.status);
  return (
    <section
      id="ppo-field-technicians"
      className="field-technicians-workspace"
      aria-labelledby="ft-page-title"
    >
      <div className="ft-breadcrumb">
        <Link href="/schedule">Service</Link>
        <span aria-hidden="true">›</span>
        <span>Field operations</span>
      </div>
      <header className="ft-heading">
        <div>
          <div className="ft-title-group">
            <h1 id="ft-page-title">Field technicians</h1>
            <span
              className="ft-total"
              aria-label={
                data
                  ? `${resources.length} technicians`
                  : "Technician count unavailable"
              }
            >
              {data ? resources.length : "—"}
            </span>
          </div>
          <p>Daily visits, job readiness and technician handover</p>
        </div>
        <div className="ft-outlook" aria-label="Selected day summary">
          <div>
            <span>Visits on selected day</span>
            <strong>{data ? visits.length : "—"}</strong>
          </div>
          <div>
            <span>In progress</span>
            <strong>
              {data
                ? `${visits.filter((v) => v.status === "InProgress").length} visits`
                : "—"}
            </strong>
          </div>
          <div>
            <span>Preparation needed</span>
            <strong className="ft-attention-text">
              {data ? `${counts.attention} visits` : "—"}
            </strong>
          </div>
        </div>
      </header>
      <div
        className="ft-views"
        role="tablist"
        aria-label="Field operations view"
        onKeyDown={tabKeys}
      >
        {views.map(([key, title]) => (
          <button
            key={key}
            role="tab"
            id={`ft-view-${key}`}
            aria-controls="ft-workspace"
            aria-selected={view === key}
            tabIndex={view === key ? 0 : -1}
            onClick={() => setView(key)}
          >
            {title}
            <span className="ft-count">{data ? counts[key] : "—"}</span>
          </button>
        ))}
      </div>
      <section
        className="ft-workspace"
        id="ft-workspace"
        role="tabpanel"
        aria-labelledby={`ft-view-${view}`}
      >
        <div className="ft-toolbar">
          <label className="ft-search">
            <span className="ft-sr">
              {view === "team" ? "Search technicians" : "Search visits"}
            </span>
            <ProductIcon name="search" />
            <input
              type="search"
              placeholder={
                view === "team" ? "Search technicians" : "Search visits"
              }
              value={f.search}
              onChange={(e) => change({ search: e.target.value })}
              aria-controls="ft-results"
            />
          </label>
          <select
            aria-label="Technician"
            value={f.person}
            onChange={(e) => change({ person: e.target.value })}
          >
            <option value="">All technicians</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <select
            aria-label={view === "team" ? "Resource status" : "Visit status"}
            value={f.status}
            onChange={(e) => change({ status: e.target.value })}
          >
            <option value="">All statuses</option>
            {(view === "team" ? ["active", "inactive"] : visitStatuses).map(
              (s) => (
                <option key={s} value={s}>
                  {label(s)}
                </option>
              ),
            )}
          </select>
          {hasFilters && (
            <button className="ft-quiet ft-clear" onClick={clear}>
              Clear filters
            </button>
          )}
          {view !== "team" && (
            <label className="ft-sort">
              <span className="ft-sr">Sort results</span>
              <select
                value={f.sort}
                onChange={(e) => change({ sort: e.target.value })}
              >
                <option value="time">Start time</option>
                <option value="name">Visit title A–Z</option>
              </select>
            </label>
          )}
        </div>
        <div className="ft-context">
          <label>
            <span className="ft-sr">Visit date</span>
            <input
              type="date"
              value={day}
              onChange={(e) => {
                setSelected(null);
                setDay(e.target.value);
              }}
            />
          </label>
          <span>AEST · Australia/Brisbane</span>
          <label>
            <span className="ft-sr">Site</span>
            <select
              value={site}
              onChange={(e) => {
                setSelected(null);
                setSite(e.target.value);
              }}
            >
              <option value="">All permitted sites</option>
              {!sites.loading &&
                !sites.error &&
                sites.data?.items.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.display_name || s.display_number}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="ft-quiet"
            disabled={read.loading}
            onClick={() => {
              setSelected(null);
              read.reload();
            }}
          >
            Refresh
          </button>
          <span className="ft-update">
            {data
              ? `Read ${stamp(data.observed_at)} AEST`
              : "Current results unconfirmed"}
          </span>
        </div>
        <div className="ft-read-state">
          <ReadState
            loading={read.loading}
            error={dateError || read.error}
            retry={read.reload}
          />
          {!!sites.error && (
            <p>
              Site choices could not be loaded.{" "}
              <button onClick={sites.reload}>Retry site choices</button>
            </p>
          )}
          {!read.loading && !read.error && read.data && !data && !dateError && (
            <p role="status">
              The result is incomplete. Narrow the date or site and refresh
              before using these counts.
            </p>
          )}
        </div>
        <div
          className="ft-list-scroll"
          id="ft-results"
          tabIndex={0}
          role="region"
          aria-label="Field operations results"
          aria-busy={read.loading}
        >
          {data &&
            (view === "team" ? team.length > 0 : filtered.length > 0) &&
            (view === "team" ? (
              <table className="ft-team-table" aria-label="Field technicians">
                <colgroup>
                  {[17, 17, 12, 8, 20, 26].map((w, i) => (
                    <col key={i} style={{ width: `${w}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {[
                      "Technician",
                      "Skills / time zone",
                      "Resource status",
                      "Visits",
                      "First scheduled visit",
                      "Coordinator handover",
                    ].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {team.map((r) => {
                    const assigned = teamVisits(r),
                      needs = assigned.filter(
                        (v) => preparationReasons(v).length,
                      ).length;
                    return (
                      <tr
                        key={r.id}
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest("button"))
                            selectPerson(r);
                        }}
                      >
                        <td className="ft-person-cell">
                          <Person name={r.name} />
                          <button
                            className="ft-record-link"
                            aria-label={`View visits for ${r.name}`}
                            onClick={() => selectPerson(r)}
                          >
                            View visits
                          </button>
                        </td>
                        <td data-label="Skills / time zone">
                          {r.skills
                            .map(
                              (s) =>
                                `${label(s.skill_code)} (${label(s.status)})`,
                            )
                            .join(", ") || "No skill evidence returned"}
                          <span className="ft-cell-sub">{r.base_timezone}</span>
                        </td>
                        <td data-label="Resource status">
                          <Badge value={r.active ? r.status : "Inactive"} />
                        </td>
                        <td data-label="Visits">
                          {assigned.length}
                          <span className="ft-cell-sub">
                            {needs
                              ? `${needs} need preparation`
                              : "No preparation flags"}
                          </span>
                        </td>
                        <td data-label="First scheduled visit">
                          {assigned[0] ? (
                            <>
                              {time(assigned[0].start_at)} ·{" "}
                              {assigned[0].scope_summary ||
                                assigned[0].display_number}
                              <span className="ft-cell-sub">
                                {assigned[0].site_name}
                              </span>
                            </>
                          ) : (
                            "No visits in this view"
                          )}
                        </td>
                        <td
                          className="ft-team-handover-cell"
                          data-label="Coordinator handover"
                        >
                          <span className="ft-team-handover">
                            {needs
                              ? "Review preparation for assigned visits."
                              : "Check calendar and commitments before assigning work."}
                          </span>
                          <span className="ft-cell-sub">
                            {r.calendar.name} · {r.calendar.timezone}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table aria-label="Scheduled service visits">
                <colgroup>
                  {[8, 28, 14, 12, 18, 20].map((w, i) => (
                    <col key={i} style={{ width: `${w}%` }} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    {[
                      "Time",
                      "Visit / site",
                      "Technician",
                      "Status",
                      "Job readiness",
                      "Next action",
                    ].map((h) => (
                      <th key={h} scope="col">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v) => {
                    const crew = currentCrew(v),
                      reasons = preparationReasons(v);
                    return (
                      <tr
                        key={v.id}
                        className={selected === v.id ? "ft-selected" : ""}
                        onClick={(e) => {
                          if (!(e.target as HTMLElement).closest("button,a"))
                            open(v.id, e.currentTarget.querySelector("button"));
                        }}
                      >
                        <td data-label="Time">
                          <div className="ft-time">
                            {localDateTime(v.start_at, zone).slice(0, 10) ===
                            day
                              ? time(v.start_at)
                              : stamp(v.start_at)}
                            <small>
                              –{" "}
                              {localDateTime(v.end_at, zone).slice(0, 10) ===
                              day
                                ? time(v.end_at)
                                : stamp(v.end_at)}
                            </small>
                          </div>
                        </td>
                        <td className="ft-job-cell">
                          <button
                            className="ft-record-link"
                            aria-label={`Open visit: ${v.display_number}`}
                            onClick={(e) => open(v.id, e.currentTarget)}
                          >
                            {v.scope_summary || v.display_number}
                          </button>
                          <span className="ft-cell-sub">{v.site_name}</span>
                          <span className="ft-asset">
                            <ProductIcon name="service" />
                            {v.display_number} · {v.work_order_display_number}
                          </span>
                        </td>
                        <td data-label="Technician">
                          {crew.length ? (
                            crew.map((c) => <Person key={c.id} name={c.name} />)
                          ) : (
                            <span className="ft-muted">Unassigned</span>
                          )}
                        </td>
                        <td data-label="Status">
                          <Badge value={v.status} />
                        </td>
                        <td data-label="Job readiness">
                          <div
                            className={`ft-readiness-line ${reasons.length ? "ft-warn" : ""}`}
                          >
                            {reasons.length > 0 && (
                              <ProductIcon name="warning" />
                            )}
                            {reasons[0] ||
                              (v.status.startsWith("Completed") ||
                              v.status === "Cancelled"
                                ? "Dispatch not applicable"
                                : "No preparation flags")}
                          </div>
                          <span className="ft-cell-sub">
                            {reasons.slice(1).join(" · ") ||
                              `Pack: ${label(v.pack_requirement)}`}
                          </span>
                        </td>
                        <td className="ft-next-cell" data-label="Next action">
                          <div
                            className={`ft-next ${reasons.length ? "ft-warn" : ""}`}
                          >
                            {nextAction(v)}
                          </div>
                          <span className="ft-cell-sub">
                            Open visit details
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ))}
          {data && (view === "team" ? !team.length : !filtered.length) && (
            <div className="ft-empty">
              <ProductIcon name="search" />
              <h2>
                {hasFilters
                  ? "No matching results"
                  : view === "team"
                    ? "No technicians returned"
                    : "No visits in this view"}
              </h2>
              <p>
                {hasFilters
                  ? "Try another search or clear the filters."
                  : "Choose another date or check the Service planner."}
              </p>
              {hasFilters ? (
                <button onClick={clear}>Clear filters</button>
              ) : (
                <Link href="/schedule">Open Service planner</Link>
              )}
            </div>
          )}
        </div>
        <footer className="ft-list-foot">
          <span role="status">
            {data
              ? `${view === "team" ? team.length : filtered.length} ${view === "team" ? "technicians" : "visits"} · ${views.find((v) => v[0] === view)?.[1]}`
              : "Results unavailable"}
          </span>
          <span>Counts reflect permitted records for this date and site</span>
        </footer>
      </section>
      <footer className="ft-page-foot">
        <span>Powerplants One · Service</span>
        <Link href="/schedule">Open Service planner</Link>
      </footer>
      {selected && data && (
        <VisitDetails key={selected} id={selected} close={close} />
      )}
    </section>
  );
}
