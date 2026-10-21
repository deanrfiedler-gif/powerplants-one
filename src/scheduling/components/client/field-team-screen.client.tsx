"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  SecondaryMenuFrame,
  useSecondaryMenu,
} from "../../../shell/secondary-menu";
import { ProductIcon } from "../../../components/product-icons";
import { Icon as MyWorkIcon } from "../../../activities/components/client/my-work-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import { RegisterTable } from "../../../components/ui/register-table";
import {
  WorklistMenu,
  WorklistPanel,
} from "../../../components/crm-worklist-tools";
import {
  isDenied,
  ReadState,
  Stamp,
  useResource,
  type Envelope,
  type Option,
} from "../../../components/business-ui";
import { FieldTechniciansScreen } from "../../../components/field-technicians-screen";
import {
  fieldTeamCriteria,
  fieldTeamHref,
  hoursLabel,
  personDay,
  personVisits,
  phoneStatus,
  resourceReadComplete,
  reviewWindow,
  shortDay,
  skillsSummary,
  teamRows,
  timeText,
  type FieldTeamSchedule,
} from "../../field-team-model";
import { plannerZones } from "../../navigation";
import { preparationReasons } from "../../field-technicians-view";
import { hoursText } from "../../day-timeline";
import { addDays } from "../../time";
import type { ResourceWorkspace } from "../../workspace-model";
import {
  SkillState,
  TeamAvatar,
  TeamDialog,
  TeamSites,
} from "./field-team-parts";

const views = [
  ["team", "Technicians", "customers"],
  ["visits", "Visits", "calendar"],
  ["attention", "Needs preparation", "flag"],
] as const;
const people = [
  ["active", "Active"],
  ["away", "Away today"],
  ["inactive", "Inactive"],
  ["competence", "Competence to review"],
] as const;
export function FieldTeamReadState({
  loading,
  error,
  incomplete,
  retry,
}: {
  loading: boolean;
  error: unknown;
  incomplete: boolean;
  retry: () => void;
}) {
  if (loading)
    return (
      <div className="pl02-loading" role="status">
        <p>Loading permitted records…</p>
        {Array.from({ length: 6 }, (_, i) => (
          <div className="pl02-skeleton" key={i} aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
        ))}
      </div>
    );
  if (error)
    return (
      <div className="pl02-notice pl02-error" role="alert">
        <strong>
          {isDenied(error)
            ? "Field team is outside your access"
            : "Technicians could not be loaded"}
        </strong>
        <p>
          No list or counts are shown, so nothing here is out of date.{" "}
          {isDenied(error)
            ? "Use an identity with permission to read this resource."
            : "Check your connection, then retry."}
        </p>
        <Button onClick={retry}>Retry loading</Button>
      </div>
    );
  if (incomplete)
    return (
      <div className="pl02-notice" role="status">
        <strong>The result is incomplete</strong>
        <p>
          Narrow the date or site and refresh before using these counts. No rows
          or counts are shown until the read is complete.
        </p>
      </div>
    );
  return null;
}

function PersonSnapshot({
  navigation,
  id,
  day,
  zone,
  site,
  close,
}: {
  navigation?: ReactNode;
  id: string;
  day: string;
  zone: string;
  site: string;
  close: () => void;
}) {
  const read = useResource<ResourceWorkspace>(
    `resources/${id}/scheduling?` +
      new URLSearchParams({ ...reviewWindow(day, zone), timezone: zone }),
  );
  const data =
    !read.loading &&
    !read.error &&
    read.data &&
    resourceReadComplete(read.data.completeness)
      ? read.data
      : null;
  const [tab, setTab] = useState("competence"),
    r = data?.resource;
  const summary = r && data ? skillsSummary(r, data.from, data.to) : null;
  const days = r
    ? Array.from({ length: 7 }, (_, i) => personDay(r, addDays(day, i), zone))
    : [];
  return (
    <TeamDialog
      title={r?.name ?? "Person snapshot"}
      subtitle={
        r
          ? `${r.resource_type ?? "Technician"} · resource v${r.version} · ${r.base_timezone}`
          : undefined
      }
      snapshot
      navigation={navigation}
      onClose={close}
      footer={
        data && (
          <>
            <ButtonLink href={fieldTeamHref(day, zone, site, id)}>
              View visits
            </ButtonLink>
            <ButtonLink
              variant="primary"
              href={fieldTeamHref(day, zone, site, id, true)}
            >
              Availability &amp; competence
            </ButtonLink>
          </>
        )
      }
    >
      <ReadState {...read} retry={read.reload} />
      {read.data && !read.loading && !read.error && !data && (
        <p role="status">
          The result is incomplete. Refresh before using this evidence.
        </p>
      )}
      {data && r && (
        <div className="pl02-snapshot-columns">
          <section>
            <h2 className="pl02-snapshot-name">
              <TeamAvatar name={r.name} />
              {r.name}
            </h2>
            <small>
              {r.resource_type ?? "Technician"} · resource v{r.version} ·{" "}
              {r.base_timezone}
            </small>
            <p>
              <span className="pl02-tag">
                {r.active ? r.status : "Inactive"}
              </span>{" "}
              · {summary?.review} skills to review
            </p>
            <h3 className="pl02-section-label">Today · {shortDay(day)}</h3>
            <p>{hoursLabel(r, day, zone)}</p>
            <small>
              Standard 08:00–17:00 ·{" "}
              {personVisits(data.appointments, id, day, zone).length} visits
            </small>
            {personVisits(data.appointments, id, day, zone).map((a) => (
              <p key={a.id}>
                <Link href={`/service/appointments/${a.id}`}>
                  {timeText(a.start_at, zone)}–{timeText(a.end_at, zone)} ·{" "}
                  {a.scope_summary}
                </Link>
                <small>
                  {a.site_name} · {a.status}
                </small>
              </p>
            ))}
            <h3 className="pl02-section-label">
              Next seven days · {shortDay(day)} – {shortDay(addDays(day, 6))}
            </h3>
            <p>
              {hoursText(days.reduce((a, b) => a + b.bookedMinutes, 0))} of{" "}
              {hoursText(days.reduce((a, b) => a + b.capacityMinutes, 0))} h
              booked
            </p>
            {r.blocks?.map((b) => (
              <p key={b.id}>
                {b.kind} ·{" "}
                <Stamp value={b.start_at} timezone={r.base_timezone} /> to{" "}
                <Stamp value={b.end_at} timezone={r.base_timezone} />
              </p>
            ))}
            <p className="pl02-notice neutral">
              Read-only. Resource, calendar and competence records are published
              elsewhere and never edited here. Busy times can include visits
              outside your access.
            </p>
          </section>
          <section>
            <div className="pl02-card">
              <div
                className="pl02-snapshot-tabs"
                role="tablist"
                aria-label="Person evidence"
              >
                {["competence", "sites"].map((t) => (
                  <button
                    type="button"
                    key={t}
                    role="tab"
                    aria-selected={tab === t}
                    tabIndex={tab === t ? 0 : -1}
                    onKeyDown={(e) => {
                      if (
                        ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                          e.key,
                        )
                      ) {
                        e.preventDefault();
                        const next =
                          e.key === "Home"
                            ? "competence"
                            : e.key === "End"
                              ? "sites"
                              : tab === "sites"
                                ? "competence"
                                : "sites";
                        setTab(next);
                        (
                          e.currentTarget.parentElement?.querySelector(
                            `[data-tab=${next}]`,
                          ) as HTMLElement
                        )?.focus();
                      }
                    }}
                    data-tab={t}
                    onClick={() => setTab(t)}
                  >
                    {t === "sites"
                      ? `Sites · ${data.sites.length}`
                      : "Competence"}
                  </button>
                ))}
              </div>
              <div className="pl02-snapshot-tab" role="tabpanel">
                {tab === "sites" ? (
                  <TeamSites data={data} />
                ) : (
                  <>
                    <p>
                      For {shortDay(day)} – {shortDay(addDays(day, 6))} ·{" "}
                      {summary?.verified} verified, {summary?.review} to review
                    </p>
                    {r.skills.map((s) => (
                      <p key={s.id}>
                        <strong>{s.skill_code}</strong>
                        <SkillState skill={s} from={data.from} to={data.to} />
                        <small>
                          Source: {s.status} ·{" "}
                          {s.reviewed_at
                            ? "Reviewed evidence returned"
                            : "No reviewed evidence returned"}
                        </small>
                      </p>
                    ))}
                    <small>Certificate and renewal evidence: Unknown</small>
                  </>
                )}
              </div>
            </div>
            <h2>Upcoming visits</h2>
            {data.appointments.map((a) => (
              <p key={a.id}>
                <Link href={`/service/appointments/${a.id}`}>
                  {a.scope_summary}
                </Link>
                <small>
                  {timeText(a.start_at, zone)}–{timeText(a.end_at, zone)} ·{" "}
                  {a.site_name} · {a.status}
                </small>
              </p>
            ))}
          </section>
        </div>
      )}
    </TeamDialog>
  );
}

export function FieldTeamScreen() {
  const query = useSearchParams(),
    router = useRouter(),
    criteria = fieldTeamCriteria(new URLSearchParams(query.toString()));
  const { day, zone, site, view } = criteria;
  const update = (patch: Record<string, string>) => {
    const q = new URLSearchParams(query.toString());
    Object.entries(patch).forEach(([key, value]) =>
      value ? q.set(key, value) : q.delete(key),
    );
    window.history.replaceState(null, "", "/service/technicians?" + q);
    setSnapshot("");
    setSelected([]);
  };
  const [menuOpen, setMenuOpen] = useState(true),
    menu = useSecondaryMenu(menuOpen, setMenuOpen);
  const [filterOpen, setFilterOpen] = useState(false),
    [snapshot, setSnapshot] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const read = useResource<FieldTeamSchedule>(
    "schedule?" +
      new URLSearchParams({
        ...reviewWindow(day, zone),
        timezone: zone,
        ...(site ? { site_id: site } : {}),
      }),
  );
  const sites = useResource<Envelope<Option>>("sites?limit=50");
  const data =
    !read.loading && !read.error && read.data?.completeness === "Complete"
      ? read.data
      : null;
  const rows = data ? teamRows(data, criteria) : [],
    resources = data?.resources ?? [];
  const allRows = data
    ? teamRows(data, { ...criteria, resource: "", people: "", search: "" })
    : [];
  const visits =
    data?.items.filter((a) =>
      allRows.some((r) => r.visits.some((v) => v.id === a.id)),
    ) ?? [];
  const counts = {
    team: resources.length,
    visits: visits.length,
    attention: visits.filter((v) => preparationReasons(v).length).length,
  };
  const chooseView = (key: string, personView = "") => {
    update({ view: key, people: personView, resource_id: "" });
    menu.closeOverlay();
  };
  const openPerson = (id: string) =>
    menu.phone
      ? router.push(fieldTeamHref(day, zone, site, id, true))
      : setSnapshot(id);
  const clear = () =>
    update({ search: "", people: "", resource_id: "", site_id: "" });
  const search = (
    <label className="pl02-search">
      <ProductIcon name="search" />
      <span className="sr-only">Search technicians</span>
      <input
        type="search"
        placeholder="Search technicians"
        value={criteria.search}
        onChange={(e) => update({ search: e.target.value })}
      />
    </label>
  );
  const filters = (
    <>
      {search}
      <label>
        Site
        <select
          value={site}
          onChange={(e) => update({ site_id: e.target.value })}
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
      <label>
        Display timezone
        <select
          value={zone}
          onChange={(e) => update({ timezone: e.target.value })}
        >
          {plannerZones.map((z) => (
            <option key={z}>{z}</option>
          ))}
        </select>
      </label>
      <label>
        People
        <select
          value={criteria.people}
          onChange={(e) => update({ people: e.target.value })}
        >
          <option value="">All people</option>
          {people.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <Button onClick={clear}>Clear filters</Button>
    </>
  );
  return (
    <SecondaryMenuFrame
      id="ppo-field-team"
      name="Field team"
      state={menu}
      menuId="field-team-menu"
      contentId="field-team-content"
      attributes={{ "data-module-scope": "PL-02" }}
      message=""
      phoneHeader={{
        title: "Field team",
        count: data && view === "team" ? rows.length : undefined,
        pageAction: {
          label: "Search technicians",
          icon: "search",
          search: true,
          onSelect: () => setFilterOpen(true),
        },
        filter: {
          open: () => setFilterOpen(true),
          applied: !!(criteria.search || criteria.people || site),
          searchAndFilter: () => setFilterOpen(true),
        },
      }}
      menu={
        <nav aria-label="Field team views">
          <ul>
            {views.map(([key, label, icon]) => (
              <li key={key}>
                <button
                  type="button"
                  aria-current={
                    view === key && !criteria.people ? "page" : undefined
                  }
                  onClick={() => chooseView(key)}
                >
                  <ProductIcon name={icon} />
                  <span>{label}</span>
                  {data && <small>{counts[key]}</small>}
                </button>
              </li>
            ))}
          </ul>
          <h2 className="pl02-section-label">People</h2>
          <ul>
            {people.map(([key, label]) => (
              <li key={key}>
                <button
                  type="button"
                  aria-current={criteria.people === key ? "page" : undefined}
                  onClick={() => chooseView("team", key)}
                >
                  <ProductIcon name="person" />
                  <span>{label}</span>
                  {data && (
                    <small>
                      {
                        teamRows(data, {
                          ...criteria,
                          people: key,
                          search: "",
                          resource: "",
                        }).length
                      }
                    </small>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      }
    >
      {view === "team" && (
        <>
          <h1 className="sr-only">Field team</h1>
          <div className="pl02-toolbar">
            <div className="pl02-desktop">{search}</div>
            <Button
              className="pl02-phone pl02-choose"
              onClick={(e) => menu.toggle(e.currentTarget)}
            >
              Technicians <ProductIcon name="chevron" />
            </Button>
            <label className="pl02-day-control">
              <span className="sr-only">Visit date</span>
              <input
                type="date"
                value={day}
                onChange={(e) => {
                  if (e.target.value) update({ day: e.target.value });
                }}
              />
            </label>
            <label className="pl02-desktop pl02-site-control">
              <span className="sr-only">Site</span>
              <select
                value={site}
                onChange={(e) => update({ site_id: e.target.value })}
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
            <label className="pl02-desktop pl02-zone-control">
              <span className="sr-only">Display timezone</span>
              <select
                value={zone}
                onChange={(e) => update({ timezone: e.target.value })}
              >
                {plannerZones.map((z) => (
                  <option key={z} value={z}>
                    {z === "Australia/Brisbane"
                      ? "AEST"
                      : z === "Australia/Melbourne"
                        ? "Melbourne"
                        : "UTC"}
                  </option>
                ))}
              </select>
            </label>
            <span className="pl02-count">
              {data
                ? criteria.search || criteria.people
                  ? `${rows.length} of ${resources.length}`
                  : `${rows.length} technicians`
                : read.loading
                  ? "Loading…"
                  : "—"}
            </span>
            <span className="pl02-read-time">
              {data
                ? `Read ${timeText(data.observed_at, zone)}`
                : "Current results unconfirmed"}
            </span>
            <Button
              className="pl02-refresh"
              aria-label="Refresh"
              disabled={read.loading}
              onClick={() => {
                setSnapshot("");
                setSelected([]);
                read.reload();
              }}
            >
              <MyWorkIcon name="refresh" />
            </Button>
            <Button
              className="pl02-phone pl02-filter"
              aria-label="Filters"
              onClick={() => setFilterOpen(true)}
            >
              <ProductIcon name="filter" />
            </Button>
            <WorklistMenu
              label="Field team actions"
              icon="more"
              className="pl02-desktop"
            >
              <p>Read-only resource evidence.</p>
              <Link href="/schedule">Open Service planner</Link>
            </WorklistMenu>
          </div>
          {(criteria.search || criteria.people || criteria.resource) && (
            <div className="pl02-chips">
              {criteria.search && (
                <Button onClick={() => update({ search: "" })}>
                  Search: {criteria.search} <ProductIcon name="close" />
                </Button>
              )}
              {criteria.people && (
                <Button onClick={() => update({ people: "" })}>
                  Status: {people.find((p) => p[0] === criteria.people)?.[1]}{" "}
                  <ProductIcon name="close" />
                </Button>
              )}
              {criteria.resource && (
                <Button onClick={() => update({ resource_id: "" })}>
                  Person filter <ProductIcon name="close" />
                </Button>
              )}
            </div>
          )}
          <FieldTeamReadState
            loading={read.loading}
            error={read.error}
            incomplete={!!read.data && !data}
            retry={read.reload}
          />
          {data && !rows.length && (
            <div className="pl02-empty">
              <h2>No matching results</h2>
              <p>
                Try another search or clear the filters. {resources.length}{" "}
                technicians are hidden by the current filters.
              </p>
              <Button onClick={clear}>Clear filters</Button>
            </div>
          )}
          {data && rows.length > 0 && (
            <>
              <div className="pl02-desktop pl02-grid">
                <RegisterTable caption="Field technicians — open a person snapshot; selection is local to this read">
                  <colgroup>
                    {[
                      "select",
                      "person",
                      "role",
                      "hours",
                      "competence",
                      "visits",
                      "first",
                      "status",
                      "zone",
                      "calendar",
                      "handover",
                      "actions",
                    ].map((c) => (
                      <col key={c} className={`pl02-col-${c}`} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th scope="col">
                        <input
                          type="checkbox"
                          aria-label="Select all technicians"
                          checked={rows.every((x) =>
                            selected.includes(x.resource.id),
                          )}
                          onChange={(e) =>
                            setSelected(
                              e.target.checked
                                ? rows.map((x) => x.resource.id)
                                : [],
                            )
                          }
                        />
                      </th>
                      {[
                        "Technician",
                        "Role",
                        "Hours today",
                        "Competence",
                        "Visits today",
                        "First scheduled visit",
                        "Resource status",
                        "Time zone",
                        "Calendar",
                        "Coordinator handover",
                      ].map((t) => (
                        <th scope="col" key={t}>
                          {t}
                        </th>
                      ))}
                      <th scope="col">
                        <Button
                          variant="quiet"
                          disabled
                          aria-label="Column settings not specified in the accepted design"
                        >
                          <ProductIcon name="settings" />
                        </Button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(
                      ({ resource: r, lane, skills, visits: assigned }) => (
                        <tr
                          key={r.id}
                          data-away={!r.active || lane.away || undefined}
                          data-selected={selected.includes(r.id) || undefined}
                          onClick={(e) => {
                            if (
                              !(e.target as HTMLElement).closest(
                                "button,a,input",
                              )
                            )
                              openPerson(r.id);
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              aria-label={`Select ${r.name}`}
                              checked={selected.includes(r.id)}
                              onChange={(e) =>
                                setSelected(
                                  e.target.checked
                                    ? [...selected, r.id]
                                    : selected.filter((x) => x !== r.id),
                                )
                              }
                            />
                          </td>
                          <th scope="row">
                            <button
                              type="button"
                              className="pl02-person"
                              onClick={() => openPerson(r.id)}
                            >
                              <TeamAvatar
                                name={r.name}
                                away={!r.active || lane.away}
                              />
                              {r.name}
                            </button>
                          </th>
                          <td>{r.resource_type ?? "Technician"}</td>
                          <td>{hoursLabel(r, day, zone)}</td>
                          <td
                            className={
                              skills.expired
                                ? "pl02-danger"
                                : skills.review
                                  ? "pl02-warning"
                                  : ""
                            }
                          >
                            {skills.text}
                          </td>
                          <td>
                            {assigned.length} ·{" "}
                            {
                              assigned.filter(
                                (a) => preparationReasons(a).length,
                              ).length
                            }{" "}
                            needs preparation
                          </td>
                          <td>
                            {assigned[0]
                              ? `${timeText(assigned[0].start_at, zone)} · ${assigned[0].scope_summary}`
                              : "No scheduled visits"}
                          </td>
                          <td>
                            <span className="pl02-tag">
                              {r.active ? r.status : "Inactive"}
                            </span>
                          </td>
                          <td>{r.base_timezone}</td>
                          <td>{r.calendar.name}</td>
                          <td>
                            {assigned.some((a) => preparationReasons(a).length)
                              ? "Review preparation for assigned visits."
                              : "Review availability and competence before booking."}
                          </td>
                          <td>
                            <WorklistMenu
                              label={`Actions for ${r.name}`}
                              icon="more"
                            >
                              <Link href={fieldTeamHref(day, zone, site, r.id)}>
                                View visits
                              </Link>
                              <Link
                                href={fieldTeamHref(
                                  day,
                                  zone,
                                  site,
                                  r.id,
                                  true,
                                )}
                              >
                                Availability &amp; competence
                              </Link>
                            </WorklistMenu>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </RegisterTable>
              </div>
              <div className="pl02-phone pl02-phone-list">
                {rows.map(({ resource: r, lane, skills, visits: assigned }) => (
                  <Link
                    className="pl02-phone-row"
                    key={r.id}
                    href={fieldTeamHref(day, zone, site, r.id, true)}
                    data-away={!r.active || lane.away || undefined}
                  >
                    <TeamAvatar name={r.name} away={!r.active || lane.away} />
                    <span className="pl02-phone-person">
                      <span>
                        <strong>{r.name}</strong>
                        <small>{hoursLabel(r, day, zone)}</small>
                      </span>
                      <small>
                        {r.resource_type ?? "Technician"} ·{" "}
                        {assigned.length
                          ? `${assigned.length} visit${assigned.length === 1 ? "" : "s"} today`
                          : "no visits today"}
                      </small>
                      <small
                        className={
                          skills.review ||
                          assigned.some((a) => preparationReasons(a).length)
                            ? "pl02-warning"
                            : "pl02-success"
                        }
                      >
                        <ProductIcon name={skills.review ? "info" : "check"} />
                        {phoneStatus(r, skills, assigned)}
                      </small>
                    </span>
                    <ProductIcon name="expand" />
                  </Link>
                ))}
              </div>
            </>
          )}
          {!!sites.error && (
            <p className="pl02-card-note">
              Site choices could not be loaded.{" "}
              <Button onClick={sites.reload}>Retry site choices</Button>
            </p>
          )}
        </>
      )}
      {view !== "team" && (
        <div className="pl02-legacy">
          <FieldTechniciansScreen embeddedView={view} />
        </div>
      )}
      {filterOpen && (
        <WorklistPanel
          title="Search and filter technicians"
          onClose={() => setFilterOpen(false)}
          drawer
        >
          <div className="pl02-filters">{filters}</div>
        </WorklistPanel>
      )}
      {snapshot && data && resources.some((r) => r.id === snapshot) && (
        <PersonSnapshot
          key={`${snapshot}:${read.data?.observed_at}`}
          id={snapshot}
          day={day}
          zone={zone}
          site={site}
          close={() => setSnapshot("")}
          navigation={
            <>
              {[-1, 1].map((offset) => {
                const target =
                  rows[
                    rows.findIndex((x) => x.resource.id === snapshot) + offset
                  ]?.resource;
                return (
                  <Button
                    key={offset}
                    variant="quiet"
                    disabled={!target}
                    aria-label={
                      offset < 0 ? "Previous technician" : "Next technician"
                    }
                    onClick={() => target && setSnapshot(target.id)}
                  >
                    <ProductIcon name={offset < 0 ? "collapse" : "expand"} />
                  </Button>
                );
              })}
            </>
          }
        />
      )}
    </SecondaryMenuFrame>
  );
}
