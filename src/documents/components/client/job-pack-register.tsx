"use client";
import { Fragment, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useIdentity } from "../../../components/business-session";
import {
  useResource,
  ReadState,
  type Envelope,
} from "../../../components/business-ui";
import {
  WorklistChoice,
  WorklistMenu,
  WorklistPanel,
} from "../../../components/crm-worklist-tools";
import { Button, ButtonLink } from "../../../components/ui/button";
import {
  RegisterTable,
  RegisterChip,
  RegisterSortHeader,
  RegisterEmpty,
} from "../../../components/ui/register-table";
import { ProductIcon } from "../../../components/product-icons";
import {
  matchesPackView,
  packViews,
  packListCsv,
  registerStatus,
  visitGroup,
  withinSevenDays,
  type PackRegisterRow,
  type PackVisit,
} from "../../pack-register";
import {
  formatStamp,
  revisionLabel,
  readinessSummary,
  outcomeLabels,
} from "../../pack-view";
import type { Pack } from "./job-pack-types";
import { readSection } from "../../section-readers";
import { packTabKey } from "./job-pack-chrome";
import { JobPackWorkspace } from "./job-pack-workspace";

const columns = [
  "Job pack",
  "Visit",
  "Job",
  "State",
  "Readiness",
  "Crew acknowledged",
  "Dispatch",
  "Customer",
  "Site",
  "Technicians",
  "Prepared by",
  "Updated",
];
function useRegisterQuery() {
  const raw = useSyncExternalStore(
    (listener) => {
      window.addEventListener("popstate", listener);
      window.addEventListener("ppo:pack-view", listener);
      return () => {
        window.removeEventListener("popstate", listener);
        window.removeEventListener("ppo:pack-view", listener);
      };
    },
    () => window.location.search,
    () => "",
  );
  const query = new URLSearchParams(raw);
  return [
    query,
    (key: string, value: string) => {
      const url = new URL(window.location.href);
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
      window.history.pushState(null, "", url);
      window.dispatchEvent(new Event("ppo:pack-view"));
    },
  ] as const;
}
function exportRows(rows: PackRegisterRow[]) {
  const url = URL.createObjectURL(
    new Blob([packListCsv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "job-packs.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function PackWindow({
  ids,
  index,
  onIndex,
  onClose,
}: {
  ids: string[];
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
}) {
  const r = useResource<Envelope<Pack>>(`packs/${ids[index]}`),
    p = r.data?.items[0];
  const [tab, setTab] = useState("readiness");
  const revision = p?.revisions.find((x) => x.id === p.current_revision_id),
    issue = p?.issues.find((x) => x.id === p.current_issue_id);
  const scope = revision
    ? readSection("scope", revision.snapshot, revision.id, p?.section_view)
    : null;
  const summary = p?.criteria ? readinessSummary(p.criteria) : null;
  const staff =
    !!p &&
    (p.actions.can_prepare || p.actions.can_check || p.actions.can_issue);
  const acknowledged =
    p?.readiness.recipients.filter(
      (r) => r.acknowledged_at && r.presented_hash === issue?.output_hash,
    ).length ?? 0;
  return (
    <WorklistPanel title={p?.display_number ?? "Job pack"} onClose={onClose}>
      <div className="jpr-window-nav">
        <Button disabled={index === 0} onClick={() => onIndex(index - 1)}>
          Previous
        </Button>
        <span>
          {index + 1} of {ids.length}
        </span>
        <Button
          disabled={index === ids.length - 1}
          onClick={() => onIndex(index + 1)}
        >
          Next
        </Button>
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      {!r.loading && !r.error && p && (
        <>
          <div className="jpr-window">
            <div>
              <h3>
                {scope?.kind === "scope"
                  ? scope.value.summary
                  : (revision?.snapshot.work.reference ?? "Job pack")}
              </h3>
              <dl>
                <div>
                  <dt>Job pack</dt>
                  <dd>
                    {p.display_number} ·{" "}
                    {revision
                      ? revisionLabel(revision.revision)
                      : "No visible revision"}
                  </dd>
                </div>
                <div>
                  <dt>Customer / site</dt>
                  <dd>
                    {revision?.snapshot.customer.name} ·{" "}
                    {revision?.snapshot.site.name}
                  </dd>
                </div>
                <div>
                  <dt>Visit</dt>
                  <dd>
                    {revision &&
                      formatStamp(
                        revision.snapshot.appointment.start_at,
                        revision.snapshot.appointment.timezone,
                      )}
                  </dd>
                </div>
                <div>
                  <dt>Technicians</dt>
                  <dd>
                    {revision?.snapshot.recipients
                      .map((t) => t.name)
                      .join(", ")}
                  </dd>
                </div>
              </dl>
              <h4>
                {p.readiness.dispatch_hold
                  ? "Dispatch held"
                  : "Ready for dispatch"}
              </h4>
              <ul className="jpr-conditions">
                <li>
                  Pack{" "}
                  {p.status === "Issued" && !p.needs_review
                    ? "issued"
                    : "requires a current issue"}
                </li>
                <li>
                  {acknowledged} of {p.readiness.recipients.length} crew
                  acknowledged
                </li>
                <li>
                  Readiness:{" "}
                  {summary
                    ? `${summary.satisfied} of ${summary.total} satisfied`
                    : "Not available"}
                </li>
              </ul>
              {p.readiness.reasons.length > 0 && (
                <details>
                  <summary>All dispatch holds</summary>
                  <ul>
                    {p.readiness.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="jpr-rule">
                Checking applies to one saved revision. Dispatch also requires
                the current exact issue, every crew acknowledgement and the
                other work controls.
              </p>
            </div>
            <div>
              <div
                className="jpr-window-tabs"
                role="tablist"
                aria-label="Pack snapshot"
                onKeyDown={packTabKey}
              >
                {["readiness", "crew"].map((key) => (
                  <button
                    key={key}
                    role="tab"
                    type="button"
                    id={`jpr-tab-${key}`}
                    aria-selected={tab === key}
                    tabIndex={tab === key ? 0 : -1}
                    aria-controls={`jpr-${key}`}
                    onClick={() => setTab(key)}
                  >
                    {key === "readiness" ? "Readiness" : "Crew"}
                  </button>
                ))}
              </div>
              <section
                id="jpr-readiness"
                role="tabpanel"
                aria-labelledby="jpr-tab-readiness"
                hidden={tab !== "readiness"}
              >
                {p.criteria ? (
                  <>
                    <p>{summary?.text}</p>
                    {p.criteria.map((c) => (
                      <div className="jpr-criterion" key={c.criterion_code}>
                        <strong>{c.label}</strong>
                        <span>{outcomeLabels[c.outcome]}</span>
                        <small>
                          {c.blocking_stage} ·{" "}
                          {c.stale
                            ? "Changed scope: assess again"
                            : c.expired
                              ? "Evidence expired"
                              : (c.reason ?? "No assessment recorded")}
                        </small>
                      </div>
                    ))}
                  </>
                ) : (
                  <p>Readiness detail is unavailable to this identity.</p>
                )}
              </section>
              <section
                id="jpr-crew"
                role="tabpanel"
                aria-labelledby="jpr-tab-crew"
                hidden={tab !== "crew"}
              >
                {p.readiness.recipients.length ? (
                  p.readiness.recipients.map((r) => (
                    <div className="jpr-criterion" key={r.id}>
                      <strong>{r.display_name}</strong>
                      <span>
                        {r.acknowledged_at &&
                        r.presented_hash === issue?.output_hash
                          ? "Acknowledged this issue"
                          : "Awaiting acknowledgement"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>Crew acknowledgement is requested after issue.</p>
                )}
              </section>
              {staff && (
                <Link
                  className="jpr-history"
                  href={`/service/packs/${p.id}?view=revisions`}
                >
                  Revision history
                </Link>
              )}
            </div>
          </div>
          <div className="jpr-window-actions">
            {revision && staff && (
              <ButtonLink
                href={`/api/v1/packs/${p.id}/preview?revision_id=${revision.id}`}
                target="_blank"
                rel="noreferrer"
              >
                Print preview
              </ButtonLink>
            )}
            <ButtonLink variant="primary" href={`/service/packs/${p.id}`}>
              Open job pack
            </ButtonLink>
          </div>
        </>
      )}
    </WorklistPanel>
  );
}
export function PackListScreen({
  initialPrepare = false,
}: {
  initialPrepare?: boolean;
}) {
  const identity = useIdentity(),
    r = useResource<Envelope<PackRegisterRow>>("packs"),
    visits = useResource<Envelope<PackVisit>>("packs/visits");
  const [query, change] = useRegisterQuery(),
    [selection, setSelection] = useState<string[]>([]),
    [open, setOpen] = useState<{ ids: string[]; index: number } | null>(null),
    [prepare, setPrepare] = useState(initialPrepare),
    [hidden, setHidden] = useState<string[]>([]);
  const view = query.get("view") ?? "all",
    site = query.get("site") ?? "",
    technician = query.get("technician") ?? "",
    descending = query.get("sort") === "desc";
  const all = !r.error && !r.loading ? (r.data?.items ?? []) : [],
    now = r.data?.observed_at ?? new Date().toISOString();
  const rows = all
    .filter(
      (row) =>
        matchesPackView(row, view, identity.actor_id, now) &&
        (!site || row.site_id === site) &&
        (!technician || row.technicians.some((t) => t.id === technician)),
    )
    .toSorted(
      (a, b) =>
        (a.visit_at.localeCompare(b.visit_at) || a.id.localeCompare(b.id)) *
        (descending ? -1 : 1),
    );
  const selected = rows.filter((row) => selection.includes(row.id));
  const options =
    !visits.error && !visits.loading ? (visits.data?.items ?? []) : [];
  const nextVisits = options.filter((v) => withinSevenDays(v.start_at, now));
  const update = (key: string, value: string) => {
    change(key, value);
    setSelection([]);
    setOpen(null);
  };
  const toggle = (id: string) =>
    setSelection((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
    );
  const show = (id: string) =>
    setOpen({
      ids: rows.map((r) => r.id),
      index: rows.findIndex((r) => r.id === id),
    });
  const menu = (
    <nav className="jpr-menu" aria-label="Job pack register views">
      {packViews.map(([key, label, group], i) => (
        <Fragment key={key}>
          {group && group !== packViews[i - 1]?.[2] && <h2>{group}</h2>}
          <button
            type="button"
            data-pack-view
            aria-current={key === view ? "page" : undefined}
            onClick={() => update("view", key)}
          >
            <ProductIcon
              name={
                key === "all" ? "list" : key === "mine" ? "person" : "documents"
              }
            />
            <span>{label}</span>
            <small>
              {r.loading ||
              r.error ||
              (key === "visits" && (visits.loading || visits.error))
                ? "—"
                : key === "visits"
                  ? nextVisits.length
                  : all.filter((row) =>
                      matchesPackView(row, key, identity.actor_id, now),
                    ).length}
            </small>
          </button>
        </Fragment>
      ))}
    </nav>
  );
  const visitList = (list: PackVisit[]) => (
    <div className="jpr-visits">
      <ReadState
        loading={visits.loading}
        error={visits.error}
        retry={visits.reload}
      />
      {list.map((v) => (
        <article key={v.id}>
          <div>
            <strong>{v.display_number}</strong>
            <p>
              {v.work_order_reference} · {v.site_name}
            </p>
            <p>{formatStamp(v.start_at, v.site_timezone)}</p>
          </div>
          <ButtonLink href={`/service/packs/new?appointment_id=${v.id}`}>
            Prepare job pack
          </ButtonLink>
        </article>
      ))}
      {!visits.loading && !visits.error && !list.length && (
        <RegisterEmpty title="No confirmed visits without a pack">
          <p>Open the service planner to review appointments.</p>
          <Link href="/schedule">Open service planner</Link>
        </RegisterEmpty>
      )}
    </div>
  );
  return (
    <JobPackWorkspace register menu={menu}>
      <div className="jpr-toolbar">
        <Button variant="primary" onClick={() => setPrepare(true)}>
          <ProductIcon name="plus" />
          Prepare job pack
        </Button>
        <div className="jpr-phone-view">
          <WorklistChoice
            label="Job pack view"
            value={view}
            options={packViews.map(([id, label]) => ({ id, label }))}
            onChange={(v) => update("view", v)}
          />
        </div>
        <WorklistChoice
          label="Technician"
          className="jpr-desktop-filter"
          prefix="Technician: "
          value={technician}
          options={[
            { id: "", label: "Anyone" },
            ...[
              ...new Map(
                all
                  .flatMap((r) => r.technicians)
                  .map((t) => [t.id, { id: t.id, label: t.name }]),
              ).values(),
            ],
          ]}
          onChange={(v) => update("technician", v)}
        />
        <WorklistChoice
          label="Site"
          className="jpr-desktop-filter"
          prefix="Site: "
          value={site}
          options={[
            { id: "", label: "All sites" },
            ...[
              ...new Map(
                all.map((r) => [r.site_id, { id: r.site_id, label: r.site }]),
              ).values(),
            ],
          ]}
          onChange={(v) => update("site", v)}
        />
        <div className="jpr-phone-filter">
          <WorklistMenu label="Filter job packs" icon="filter">
            <label htmlFor="jpr-phone-technician">Technician</label>
            <select
              id="jpr-phone-technician"
              value={technician}
              onChange={(e) => update("technician", e.target.value)}
            >
              <option value="">Anyone</option>
              {[
                ...new Map(
                  all.flatMap((r) => r.technicians).map((t) => [t.id, t]),
                ).values(),
              ].map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <label htmlFor="jpr-phone-site">Site</label>
            <select
              id="jpr-phone-site"
              value={site}
              onChange={(e) => update("site", e.target.value)}
            >
              <option value="">All sites</option>
              {[...new Map(all.map((r) => [r.site_id, r.site])).entries()].map(
                ([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ),
              )}
            </select>
            <button data-menu-close onClick={() => setPrepare(true)}>
              Prepare job pack
            </button>
            <button
              data-menu-close
              onClick={() => {
                r.reload();
                visits.reload();
              }}
            >
              Refresh job packs
            </button>
          </WorklistMenu>
        </div>
        <span className="jpr-count">
          {r.loading
            ? "Loading…"
            : r.error
              ? "Unavailable"
              : view === "visits"
                ? `${nextVisits.length} visits`
                : `${rows.length} job pack${rows.length === 1 ? "" : "s"}`}
        </span>
        <Button
          aria-label="Refresh job packs"
          title="Refresh job packs"
          onClick={() => {
            setOpen(null);
            setSelection([]);
            r.reload();
            visits.reload();
          }}
        >
          <ProductIcon name="changes" />
        </Button>
        <WorklistMenu label="Register actions" icon="more">
          <button
            type="button"
            data-menu-close
            onClick={() => exportRows(rows)}
          >
            Export list
          </button>
          <Link href="/schedule">Open service planner</Link>
        </WorklistMenu>
      </div>
      <ReadState loading={r.loading} error={r.error} retry={r.reload} />
      <div className="jpr-body">
        {selected.length > 0 && (
          <div
            className="jpr-selection"
            role="region"
            aria-label="Selected job packs"
          >
            <strong>{selected.length} selected</strong>
            <Button
              onClick={() =>
                setOpen({ ids: selected.map((r) => r.id), index: 0 })
              }
            >
              Open in sequence
            </Button>
            <Button onClick={() => exportRows(selected)}>Export list</Button>
            <Button onClick={() => setSelection([])}>Clear selection</Button>
          </div>
        )}
        {view === "visits" ? (
          visitList(nextVisits)
        ) : (
          <>
            <div
              className="jpr-desktop"
              style={
                {
                  "--jpr-table-width": `${[44, 196, 120, 220, 190, 150, 150, 100, 190, 170, 180, 130, 100, 44].reduce((total, width, i) => total + (hidden.includes(columns[i - 1]) ? 0 : width), 0)}px`,
                } as React.CSSProperties
              }
            >
              <RegisterTable
                caption="Job packs grouped by visit date. Open a record to inspect it. Selection permits opening and export only."
                empty={
                  !r.loading && !r.error && !rows.length ? (
                    <RegisterEmpty
                      title={
                        all.length
                          ? "No job packs match this view"
                          : "No job packs are available"
                      }
                    >
                      <Button
                        onClick={() =>
                          all.length
                            ? (update("view", "all"),
                              update("site", ""),
                              update("technician", ""))
                            : setPrepare(true)
                        }
                      >
                        {all.length ? "Clear filters" : "Prepare job pack"}
                      </Button>
                    </RegisterEmpty>
                  ) : undefined
                }
              >
                <colgroup>
                  {[
                    44, 196, 120, 220, 190, 150, 150, 100, 190, 170, 180, 130,
                    100, 44,
                  ].map(
                    (width, i) =>
                      !hidden.includes(columns[i - 1]) && (
                        <col key={i} style={{ width }} />
                      ),
                  )}
                </colgroup>
                <thead>
                  <tr>
                    <th className="jpr-select">
                      <input
                        type="checkbox"
                        aria-label="Select all displayed job packs"
                        checked={
                          rows.length > 0 && selected.length === rows.length
                        }
                        ref={(node) => {
                          if (node)
                            node.indeterminate =
                              selected.length > 0 &&
                              selected.length < rows.length;
                        }}
                        onChange={() =>
                          setSelection(
                            selected.length === rows.length
                              ? []
                              : rows.map((r) => r.id),
                          )
                        }
                      />
                    </th>
                    {columns.map((label) =>
                      hidden.includes(label) ? null : label === "Visit" ? (
                        <RegisterSortHeader
                          key={label}
                          label={label}
                          direction={descending ? "descending" : "ascending"}
                          onSort={() =>
                            update("sort", descending ? "" : "desc")
                          }
                        />
                      ) : (
                        <th key={label} scope="col">
                          {label}
                        </th>
                      ),
                    )}
                    <th className="jpr-actions">
                      <WorklistMenu label="Column settings" icon="gear">
                        {columns.slice(2).map((label) => (
                          <label key={label}>
                            <input
                              type="checkbox"
                              checked={!hidden.includes(label)}
                              onChange={() =>
                                setHidden((old) =>
                                  old.includes(label)
                                    ? old.filter((x) => x !== label)
                                    : [...old, label],
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
                  {rows.map((row, index) => {
                    const group = visitGroup(row.visit_at, now, row.timezone),
                      status = registerStatus(row);
                    const cells = [
                      <button
                        key="pack"
                        className="jpr-reference"
                        onClick={() => show(row.id)}
                      >
                        {row.display_number}{" "}
                        <small>
                          {row.revision ? revisionLabel(row.revision) : ""}
                        </small>
                      </button>,
                      formatStamp(row.visit_at, row.timezone).replace(
                        / \d{4}/,
                        "",
                      ),
                      row.title,
                      <RegisterChip
                        key="state"
                        tone={
                          status.tone === "warning"
                            ? "attention"
                            : status.tone === "green"
                              ? "positive"
                              : "neutral"
                        }
                      >
                        {status.label}
                      </RegisterChip>,
                      row.readiness
                        ? `${row.readiness.satisfied} of ${row.readiness.total} satisfied`
                        : "Not available",
                      row.needs_review
                        ? "Fresh issue needed"
                        : row.recipients === null
                          ? "Not requested"
                          : `${row.acknowledged} of ${row.recipients}`,
                      row.dispatch_hold ? "Held" : "Clear",
                      row.customer,
                      row.site,
                      row.technicians.map((t) => t.name).join(", "),
                      row.prepared_by_name ?? "Not available",
                      formatStamp(row.updated_at, row.timezone),
                    ];
                    return (
                      <Fragment key={row.id}>
                        {(index === 0 ||
                          group !==
                            visitGroup(
                              rows[index - 1].visit_at,
                              now,
                              rows[index - 1].timezone,
                            )) && (
                          <tr className="jpr-group">
                            <th colSpan={columns.length - hidden.length + 2}>
                              {group}
                            </th>
                          </tr>
                        )}
                        <tr
                          data-selected={
                            selection.includes(row.id) || undefined
                          }
                        >
                          <td className="jpr-select">
                            <input
                              type="checkbox"
                              aria-label={`Select ${row.display_number}`}
                              checked={selection.includes(row.id)}
                              onChange={() => toggle(row.id)}
                            />
                          </td>
                          {cells.map(
                            (cell, i) =>
                              !hidden.includes(columns[i]) && (
                                <td
                                  key={columns[i]}
                                  title={
                                    typeof cell === "string" ? cell : undefined
                                  }
                                  className={
                                    i === 4 &&
                                    row.readiness &&
                                    row.readiness.satisfied <
                                      row.readiness.total
                                      ? "jpr-attention"
                                      : undefined
                                  }
                                >
                                  {cell}
                                </td>
                              ),
                          )}
                          <td className="jpr-actions">
                            <WorklistMenu
                              label={`Actions for ${row.display_number}`}
                              icon="more"
                            >
                              <button
                                data-menu-close
                                onClick={() => show(row.id)}
                              >
                                Inspect job pack
                              </button>
                              <Link href={`/service/packs/${row.id}`}>
                                Open job pack
                              </Link>
                            </WorklistMenu>
                          </td>
                        </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </RegisterTable>
            </div>
            <div className="jpr-phone-list">
              {rows.map((row, i) => {
                const group = visitGroup(row.visit_at, now, row.timezone);
                return (
                  <Fragment key={row.id}>
                    {(i === 0 ||
                      group !==
                        visitGroup(
                          rows[i - 1].visit_at,
                          now,
                          rows[i - 1].timezone,
                        )) && <h2>{group}</h2>}
                    <Link href={`/service/packs/${row.id}`}>
                      <div className="jpr-phone-title">
                        <strong>{row.title}</strong>
                        <time
                          dateTime={row.visit_at}
                          title={formatStamp(row.visit_at, row.timezone)}
                        >
                          {new Intl.DateTimeFormat("en-AU", {
                            timeZone: row.timezone,
                            day: "numeric",
                            month: "short",
                          }).format(new Date(row.visit_at))}
                        </time>
                      </div>
                      <span>
                        {row.display_number} · {row.customer}
                      </span>
                      <span className="jpr-state">
                        {registerStatus(row).label}
                        {row.status === "Issued" &&
                        !row.needs_review &&
                        row.recipients !== null
                          ? ` · ${row.acknowledged} of ${row.recipients} acknowledged`
                          : row.readiness &&
                              row.readiness.satisfied < row.readiness.total
                            ? ` · ${row.readiness.satisfied} of ${row.readiness.total} ready`
                            : ""}
                        {row.dispatch_hold ? " · Held" : " · Clear"}
                        <ProductIcon name="chevron" />
                      </span>
                    </Link>
                  </Fragment>
                );
              })}
              {!r.loading && !r.error && !rows.length && (
                <RegisterEmpty
                  title={
                    all.length
                      ? "No job packs match this view"
                      : "No job packs are available"
                  }
                >
                  {all.length ? (
                    <Button
                      onClick={() => {
                        update("view", "all");
                        update("site", "");
                        update("technician", "");
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Link href="/schedule">Open service planner</Link>
                  )}
                </RegisterEmpty>
              )}
            </div>
          </>
        )}
      </div>
      <p className="jpr-environment">
        Synthetic prototype · not for operational use
        {r.data &&
          ` · Updated ${formatStamp(r.data.observed_at, "Australia/Brisbane")}`}
      </p>
      {prepare && (
        <WorklistPanel
          title="Prepare job pack"
          onClose={() => setPrepare(false)}
        >
          <p>
            Choose a confirmed visit. Each appointment has one pack; a save
            creates its first immutable revision.
          </p>
          {visitList(options)}
        </WorklistPanel>
      )}
      {open && !r.loading && !r.error && (
        <PackWindow
          key={open.ids[open.index]}
          {...open}
          onIndex={(index) => setOpen({ ...open, index })}
          onClose={() => setOpen(null)}
        />
      )}
    </JobPackWorkspace>
  );
}
