"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Stamp, useResource } from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import { ProductIcon } from "../../../components/product-icons";
import { Icon as MyWorkIcon } from "../../../activities/components/client/my-work-ui";
import { WorklistMenu } from "../../../components/crm-worklist-tools";
import { usePhoneHeader } from "../../../shell/phone-header";
import { usePublishRecordIdentity } from "../../../shell/record-identity";
import {
  fieldTeamCriteria,
  fieldTeamHref,
  resourceReadComplete,
  reviewWindow,
  shortDay,
  skillsSummary,
  teamRows,
  type FieldTeamSchedule,
} from "../../field-team-model";
import { plannerHref, plannerZones } from "../../navigation";
import { addDays } from "../../time";
import { clockText } from "../../day-timeline";
import type { ResourceWorkspace } from "../../workspace-model";
import {
  Availability,
  Competence,
  SkillEvidence,
  TeamAvatar,
  TeamDate,
  TeamFields,
  TeamSites,
  UpcomingVisits,
} from "./field-team-parts";
import { FieldTeamReadState } from "./field-team-screen.client";

export function ResourceWorkspaceScreen({ id }: { id: string }) {
  const query = useSearchParams(),
    router = useRouter(),
    context = fieldTeamCriteria(new URLSearchParams(query.toString()));
  const { day, zone, site } = context,
    period = reviewWindow(day, zone);
  const [evidence, setEvidence] = useState("");
  const read = useResource<ResourceWorkspace>(
    `resources/${id}/scheduling?` +
      new URLSearchParams({ ...period, timezone: zone }),
  );
  const roster = useResource<FieldTeamSchedule>(
    "schedule?" +
      new URLSearchParams({
        ...period,
        timezone: zone,
        ...(site ? { site_id: site } : {}),
      }),
  );
  const data =
      !read.loading &&
      !read.error &&
      read.data &&
      resourceReadComplete(read.data.completeness)
        ? read.data
        : null,
    r = data?.resource;
  const rows =
    !roster.loading && !roster.error && roster.data?.completeness === "Complete"
      ? teamRows(roster.data, {
          ...context,
          resource: "",
          people: "",
          search: "",
        })
      : [];
  const index = rows.findIndex((x) => x.resource.id === id),
    previous = rows[index - 1]?.resource,
    next = index >= 0 ? rows[index + 1]?.resource : null;
  const position =
    index >= 0 && data
      ? `${index + 1} of ${rows.length} in Technicians`
      : undefined;
  const recordHref = (resource: string) =>
    fieldTeamHref(day, zone, site, resource, true);
  usePublishRecordIdentity(r?.name ?? null, r?.resource_type ?? "");
  usePhoneHeader({
    title: r?.name ?? "Field team",
    record: {
      position,
      previous:
        previous && data
          ? {
              label: `Previous technician: ${previous.name}`,
              onSelect: () => router.push(recordHref(previous.id)),
            }
          : undefined,
      next:
        next && data
          ? {
              label: `Next technician: ${next.name}`,
              onSelect: () => router.push(recordHref(next.id)),
            }
          : undefined,
    },
  });
  const update = (patch: Record<string, string>) => {
    const q = new URLSearchParams(query.toString());
    Object.entries(patch).forEach(([k, v]) => q.set(k, v));
    setEvidence("");
    window.history.replaceState(
      null,
      "",
      recordHref(id).split("?")[0] + "?" + q,
    );
  };
  const summary = data && r ? skillsSummary(r, period.from, period.to) : null;
  const anonymous = !!r?.busy?.length && !data?.appointments.length;
  const visitsHref = fieldTeamHref(day, zone, site, id),
    planner = plannerHref({
      day,
      zone,
      site,
      resource: id,
      mode: "day",
      status: "",
    });
  const actions = data && (
    <>
      <ButtonLink href={visitsHref}>View visits</ButtonLink>
      <ButtonLink href={planner}>Open in planner</ButtonLink>
      <WorklistMenu label="Person record actions" icon="more">
        <Link href={fieldTeamHref(day, zone, site)}>Back to Field team</Link>
        <p>Source editors are not available here.</p>
      </WorklistMenu>
    </>
  );
  const skills = data?.resource.skills.find((s) => s.id === evidence);
  const calendarFields = r
    ? ([
        ["Calendar", r.calendar.name],
        ["Version", `v${r.calendar.version} · ${r.calendar.status}`],
        ["Time zone", r.calendar.timezone],
        [
          "Weekly hours",
          <span key="intervals">
            {r.calendar.intervals.map((i) => (
              <span
                className="pl02-interval"
                key={`${i.weekday}:${i.start_minute}`}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i.weekday]}{" "}
                {clockText(i.start_minute)}–{clockText(i.end_minute)}
              </span>
            ))}
          </span>,
        ],
        ["Standard hours", "08:00–17:00"],
        [
          "Effective",
          <span key="dates">
            <TeamDate value={r.calendar.effective_from} timezone={zone} /> –{" "}
            <TeamDate value={r.calendar.effective_to} timezone={zone} />
          </span>,
        ],
      ] as [string, React.ReactNode][])
    : [];
  const resourceFields =
    data && r
      ? ([
          ["State", `${r.status} · ${r.active ? "active" : "inactive"}`],
          ["Role", r.resource_type ?? "Technician"],
          ["Resource type", r.resource_type ?? "Technician"],
          ["Version", `v${r.version}`],
          ["Time zone", r.base_timezone],
          [
            "Effective",
            <span key="effective">
              <TeamDate value={r.effective_from} timezone={zone} /> –{" "}
              <TeamDate value={r.effective_to} timezone={zone} />
            </span>,
          ],
          [
            "Source as at",
            <Stamp key="source" value={r.source_as_at} timezone={zone} />,
          ],
          [
            "Read at",
            <Stamp key="read" value={data.observed_at} timezone={zone} />,
          ],
        ] as [string, React.ReactNode][])
      : [];
  return (
    <section
      id="ppo-field-team-record"
      data-module-layout="full-bleed"
      data-module-scope="PL-02"
    >
      <header className="pl02-record-header">
        <div>
          <h1>{r?.name ?? "Resource availability & competence"}</h1>
          {r && (
            <span className="pl02-tag">{r.active ? r.status : "Inactive"}</span>
          )}
          <span className="pl02-position">
            {position}
            {previous && data && (
              <Link
                aria-label={`Previous technician: ${previous.name}`}
                href={recordHref(previous.id)}
              >
                <ProductIcon name="collapse" />
              </Link>
            )}
            {next && data && (
              <Link
                aria-label={`Next technician: ${next.name}`}
                href={recordHref(next.id)}
              >
                <ProductIcon name="expand" />
              </Link>
            )}
          </span>
          <div className="pl02-record-actions">{actions}</div>
        </div>
        {r && (
          <p>
            Resource v{r.version} ·{" "}
            <TeamAvatar name={r.name} away={!r.active} />{" "}
            {r.resource_type ?? "Technician"} · Base time zone {r.base_timezone}{" "}
            · source as at <Stamp value={r.source_as_at} timezone={zone} />
          </p>
        )}
      </header>
      {r && (
        <div className="pl02-phone pl02-phone-heading">
          <h1>{r.name}</h1>
          <p>
            {r.resource_type ?? "Resource"} · resource v{r.version}
          </p>
        </div>
      )}
      {data && r && (
        <div className="pl02-evidence-bar">
          <span className="pl02-phone pl02-tag">
            {r.active ? r.status : "Inactive"}
          </span>
          <strong>
            Evidence · {shortDay(day)} – {shortDay(addDays(day, 6))}
          </strong>
          <span>
            Resource {r.status.toLowerCase()} · v{r.version}
          </span>
          <span>
            Calendar {r.calendar.status.toLowerCase()} · v{r.calendar.version}
          </span>
          <span className={summary?.review ? "pl02-warning" : "pl02-success"}>
            {summary?.text}
          </span>
          <span>{data.sites.length} permitted sites</span>
        </div>
      )}
      <div className="pl02-record-columns">
        <aside className="pl02-details">
          {data && r && (
            <>
              <section>
                <h2 className="pl02-section-label">Summary</h2>
                <TeamFields items={resourceFields} />
              </section>
              <section>
                <h2 className="pl02-section-label">Published calendar</h2>
                <TeamFields items={calendarFields} />
                <p>
                  Outside 08:00–17:00 is extended hours: bookable within the
                  published hours, with a warning.
                </p>
              </section>
              <TeamSites data={data} />
            </>
          )}
        </aside>
        <div className="pl02-record-main">
          <div className="pl02-review-controls">
            <label>
              <span className="sr-only">Week starting</span>
              <span className="pl02-control-prefix">Week starting</span>
              <input
                type="date"
                value={day}
                onChange={(e) => {
                  if (e.target.value) update({ day: e.target.value });
                }}
              />
            </label>
            <label>
              <span className="sr-only">Review timezone</span>
              <select
                value={zone}
                onChange={(e) => update({ timezone: e.target.value })}
              >
                {plannerZones.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
            <Button
              disabled={read.loading}
              onClick={() => {
                setEvidence("");
                read.reload();
                roster.reload();
              }}
            >
              <MyWorkIcon name="refresh" />
              <span>Refresh evidence</span>
            </Button>
          </div>
          <p className="pl02-review-meta">
            Review window: {shortDay(day)} – {shortDay(addDays(day, 6))} ·{" "}
            {zone} ·{" "}
            {data ? (
              <>
                read <Stamp value={data.observed_at} timezone={zone} /> ·
                Complete.
              </>
            ) : (
              "Current results unconfirmed."
            )}{" "}
            Source editors are not available here.
          </p>
          <FieldTeamReadState
            loading={read.loading}
            error={read.error}
            incomplete={!!read.data && !data}
            retry={read.reload}
          />
          {data && r && (
            <>
              {anonymous && (
                <div className="pl02-view-only">
                  <div className="pl02-notice neutral">
                    <strong>
                      View only: visit details outside your access
                    </strong>
                    <p>
                      Busy times are shown without details. Open an appointment
                      you can read for its booking history.
                    </p>
                  </div>
                  <UpcomingVisits data={data} zone={zone} />
                  <div className="pl02-card">
                    <TeamSites data={data} />
                  </div>
                </div>
              )}
              <Availability data={data} day={day} zone={zone} />
              <Competence data={data} zone={zone} review={setEvidence} />
              {!anonymous && <UpcomingVisits data={data} zone={zone} />}
              <div className="pl02-phone pl02-card pl02-mobile-sites">
                <TeamSites data={data} />
              </div>
              <section className="pl02-phone pl02-card pl02-mobile-resource">
                <header>
                  <h2>Resource and calendar</h2>
                </header>
                <TeamFields items={resourceFields} />
                <TeamFields items={calendarFields} />
                <p className="pl02-code">
                  <span>Resource ID</span>
                  <code>{r.id}</code>
                </p>
                <p className="pl02-card-note">
                  Resource publication history beyond the returned bundle is not
                  supplied.
                </p>
              </section>
            </>
          )}
        </div>
      </div>
      <footer className="pl02-phone pl02-record-footer">
        {actions ?? (
          <ButtonLink href={fieldTeamHref(day, zone, site)}>
            Back to Field team
          </ButtonLink>
        )}
      </footer>
      {skills && data && (
        <SkillEvidence
          key={`${skills.id}:${day}:${zone}`}
          skill={skills}
          data={data}
          zone={zone}
          close={() => setEvidence("")}
        />
      )}
    </section>
  );
}
