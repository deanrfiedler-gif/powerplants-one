"use client";
import { useState, type ReactNode } from "react";
import { SelectField, Status } from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import type { Resource, Schedule } from "../../index";
import { localDateTime } from "../../time";
import {
  travelAvailabilityConflicts,
  travelSequences,
  type TravelVisit,
} from "../../workspace-model";
import {
  compareTravelOrder,
  moveTravelComparison,
  startingTravelResource,
  travelPartConflicts,
  type TravelPart,
} from "../../travel-review-model";
import "./travel-review.css";

type Context = { day: string; zone: string; site: string; resource: string };
function time(value: string, zone: string, day: string) {
  const local = localDateTime(value, zone);
  return local.slice(0, 10) === day ? local.slice(11) : local.replace("T", " ");
}
function interval(
  value: { start_at: string; end_at: string },
  context: Context,
) {
  return `${time(value.start_at, context.zone, context.day)}–${time(value.end_at, context.zone, context.day)}`;
}
function Conflicts({
  visit,
  resource,
  part,
  context,
}: {
  visit: TravelVisit;
  resource?: Resource;
  part: TravelPart;
  context: Context;
}) {
  const conflicts = travelPartConflicts(visit, resource, part);
  const target = part === "visit" ? "visit" : "travel";
  return (
    <>
      {conflicts.blocks.map((b) => (
        <p className="travel-conflict" key={b.id} role="status">
          Availability block {interval(b, context)} ({b.kind}) overlaps this{" "}
          {target}. Review with the coordinator.
        </p>
      ))}
      {conflicts.closures.map((b) => (
        <p className="travel-conflict" key={b.id} role="status">
          Calendar closure overlaps this {target}: {interval(b, context)} (
          {b.kind}
          {b.reason ? ` · ${b.reason}` : ""}). Review with the coordinator.
        </p>
      ))}
    </>
  );
}
function TravelLeg({
  visit,
  resource,
  part,
  from,
  to,
  context,
}: {
  visit: TravelVisit;
  resource?: Resource;
  part: "before" | "after";
  from: string;
  to: string;
  context: Context;
}) {
  const conflicts = travelPartConflicts(visit, resource, part);
  return (
    <div
      className={`travel-leg tl-travel${conflicts.blocks.length || conflicts.closures.length ? " travel-leg-conflict" : ""}`}
      data-travel-part={part}
      data-appointment={visit.appointment.id}
    >
      <div>
        <strong>
          Travel {visit[part]} min {part}
        </strong>{" "}
        <span>
          {from} → {to}
        </span>
      </div>
      <p>Basis: {visit.reason || "Unknown / unreviewed basis"}</p>
      <Conflicts {...{ visit, resource, part, context }} />
    </div>
  );
}
export function TravelReview({
  data,
  context,
  actorId,
  controls,
  refresh,
  selectResource,
}: {
  data: Schedule;
  context: Context;
  actorId: string;
  controls: ReactNode;
  refresh: () => void;
  selectResource: (id: string) => void;
}) {
  const resourceId = startingTravelResource(data, context.resource, actorId);
  const resource = data.resources.find((r) => r.id === resourceId);
  const visits = resource ? travelSequences(data.items, resource.id) : [];
  const [sequence, setSequence] = useState<string[]>([]);
  const { ordered, comparing, reversals } = compareTravelOrder(
    visits,
    sequence,
  );
  const conflicts = visits.flatMap((visit) => {
    const value = travelAvailabilityConflicts(visit, resource);
    return [
      ...value.blocks.map((b) => `block:${b.id}`),
      ...value.closures.map((b) => `closure:${b.id}`),
    ];
  });
  const conflictCount = new Set(conflicts).size;
  const overlapCount = visits.filter((v) => v.overlap).length;
  const unknownBasis = visits.filter((v) => v.unknown_basis).length;
  const planned = visits.reduce((sum, v) => sum + v.before + v.after, 0);
  const gaps = visits.reduce(
    (sum, v) => sum + Math.max(0, v.gap_minutes ?? 0),
    0,
  );
  const depot = "Depot (not supplied)";
  return (
    <>
      <div className="travel-toolbar">
        <SelectField
          name="travel-resource"
          label="Resource / crew member"
          value={resourceId}
          onChange={selectResource}
          empty="Choose a permitted person"
          options={data.resources.map((r) => ({
            id: r.id,
            display_name: r.name,
          }))}
        />
        {controls}
        <p className="read-meta">
          <span>{visits.length} visits</span>
          <span className="travel-read-time" aria-hidden="true">
            {" "}
            · Read at {time(data.observed_at, context.zone, context.day)}
          </span>
          <span className="travel-read-accessible">
            {" "}
            · Read at {time(data.observed_at, context.zone, context.day)}
          </span>
        </p>
        <p className="travel-phone-read" aria-hidden="true">
          Read {time(data.observed_at, context.zone, context.day)}
        </p>
        <Button
          className="travel-refresh"
          aria-label="Refresh visits"
          title="Refresh visits"
          onClick={refresh}
        >
          <span className="travel-refresh-icon" aria-hidden="true">
            ↻
          </span>
          <span className="travel-refresh-label">Refresh visits</span>
        </Button>
      </div>
      {context.site && (
        <p className="travel-filter-note">
          Site filter active: other visits may be outside this list. Busy
          intervals still include all reservations for the selected resource.
        </p>
      )}
      {!resource ? (
        <section className="travel-empty">
          <h2>
            {context.resource
              ? "Selected person is unavailable"
              : "No permitted people returned"}
          </h2>
          <p>
            Choose a permitted person. No route or availability can be confirmed
            from this result.
          </p>
        </section>
      ) : (
        <div
          className={`travel-layout${visits.length ? "" : " travel-layout-empty"}`}
        >
          <section aria-label="Visit route" className="travel-route">
            {visits.length > 0 && (
              <>
                <header className="travel-person">
                  <h2>
                    {resource.name}
                    {resource.resource_type
                      ? ` · ${resource.resource_type}`
                      : ""}
                  </h2>
                  <p>
                    {visits.length} visits on {context.day} · times in{" "}
                    {context.zone}
                  </p>
                </header>
                <p className="travel-note" role="status">
                  {comparing ? (
                    "Comparing a different order. Times stay as booked and gaps are not recalculated; nothing changes until a booking change is reviewed."
                  ) : (
                    <>
                      Route estimate:{" "}
                      <strong>Unknown — no provider configured</strong>. These
                      are planned travel allowances; actual field Travel is
                      recorded separately.
                    </>
                  )}
                </p>
              </>
            )}
            {!visits.length ? (
              <section className="travel-empty">
                <h3>No assigned visits for {resource.name}</h3>
                <p>
                  Proposed visits without a crew stay in the planner. An empty
                  list does not certify availability.
                </p>
                <ButtonLink
                  href={
                    "/schedule?" +
                    new URLSearchParams({
                      day: context.day,
                      timezone: context.zone,
                      ...(context.site ? { site_id: context.site } : {}),
                      resource_id: resource.id,
                    })
                  }
                >
                  Open the planner
                </ButtonLink>
              </section>
            ) : (
              <>
                <p className="travel-stop">
                  {!comparing && (
                    <time>
                      {time(
                        ordered[0].reserved_start,
                        context.zone,
                        context.day,
                      )}{" "}
                      ·{" "}
                    </time>
                  )}
                  Departure · depot not supplied
                </p>
                <ol className="scheduling-travel-list travel-route-list">
                  {ordered.map((visit, index) => {
                    const a = visit.appointment;
                    const previous = ordered[index - 1],
                      next = ordered[index + 1];
                    const original =
                      visits.findIndex((v) => v.key === visit.key) + 1;
                    const crew = a.assignments
                      .filter(
                        (x) =>
                          x.active &&
                          x.assignment_version === a.assignment_version,
                      )
                      .map((x) => x.name)
                      .join(", ");
                    return (
                      <li key={visit.key} data-visit={a.id}>
                        {!comparing && visit.gap_minutes !== null && (
                          <p
                            className={`travel-stop${visit.overlap ? " travel-conflict" : ""}`}
                          >
                            {visit.overlap
                              ? `Reservation overlap: ${-visit.gap_minutes} min — review conflict.`
                              : `Gap ${visit.gap_minutes} min · whether the route fits is unknown.`}
                          </p>
                        )}
                        <TravelLeg
                          {...{ visit, resource, context }}
                          part="before"
                          from={previous?.appointment.site_name ?? depot}
                          to={a.site_name}
                        />
                        <article className="travel-visit">
                          <div className="travel-visit-heading">
                            <strong>
                              {time(a.start_at, a.site_timezone, context.day)}–
                              {time(a.end_at, a.site_timezone, context.day)}
                            </strong>
                            <span>{a.display_number}</span>
                            <Status value={a.status} />
                          </div>
                          <h3>{a.scope_summary}</h3>
                          <p>
                            {a.customer_name ?? "Customer unavailable"} ·{" "}
                            {a.site_name} · {a.work_order_display_number}
                          </p>
                          <p>
                            Crew: {crew}
                            {a.site_timezone !== context.zone
                              ? ` · ${a.site_timezone}`
                              : ""}
                          </p>
                          <p>
                            Customer window:{" "}
                            {a.requested_window_start && a.requested_window_end
                              ? `${time(a.requested_window_start, a.site_timezone, context.day)}–${time(a.requested_window_end, a.site_timezone, context.day)}`
                              : "Not supplied"}
                          </p>
                          {comparing && (
                            <p className="travel-position">
                              Original order {original} · now {index + 1}
                            </p>
                          )}
                          <Conflicts
                            {...{ visit, resource, context }}
                            part="visit"
                          />
                          {reversals.includes(visit.key) && (
                            <p className="travel-conflict" role="status">
                              Proposed order reverses current booking times. A
                              controlled move is required through a booking
                              change.
                            </p>
                          )}
                          <div className="travel-actions">
                            <Button
                              disabled={index === 0}
                              onClick={() =>
                                setSequence(
                                  moveTravelComparison(
                                    ordered.map((v) => v.key),
                                    index,
                                    -1,
                                  ),
                                )
                              }
                              aria-label={`Move ${a.display_number} earlier in comparison`}
                            >
                              Earlier
                            </Button>
                            <Button
                              disabled={index === ordered.length - 1}
                              onClick={() =>
                                setSequence(
                                  moveTravelComparison(
                                    ordered.map((v) => v.key),
                                    index,
                                    1,
                                  ),
                                )
                              }
                              aria-label={`Move ${a.display_number} later in comparison`}
                            >
                              Later
                            </Button>
                            <ButtonLink
                              href={
                                "/schedule/changes?" +
                                new URLSearchParams({
                                  day: context.day,
                                  timezone: context.zone,
                                  appointment_id: a.id,
                                  resource_id: resource.id,
                                  ...(context.site
                                    ? { site_id: context.site }
                                    : {}),
                                })
                              }
                            >
                              Review booking change
                            </ButtonLink>
                          </div>
                        </article>
                        <TravelLeg
                          {...{ visit, resource, context }}
                          part="after"
                          from={a.site_name}
                          to={next?.appointment.site_name ?? depot}
                        />
                      </li>
                    );
                  })}
                </ol>
                <p className="travel-stop">
                  {!comparing && (
                    <time>
                      {time(
                        ordered[ordered.length - 1].reserved_end,
                        context.zone,
                        context.day,
                      )}{" "}
                      ·{" "}
                    </time>
                  )}
                  Return · depot not supplied
                </p>
                <p className="travel-source-note">
                  Depot endpoints are not supplied by the schedule. Times are
                  allowance boundaries, not a verified departure or arrival.
                  From/to labels describe this comparison, not a routed journey.
                </p>
              </>
            )}
          </section>
          {visits.length > 0 && (
            <aside className="travel-summary" aria-label="Day summary">
              <h2>Day summary</h2>
              <dl>
                <dt>Visits</dt>
                <dd>{visits.length}</dd>
                <dt>Planned travel</dt>
                <dd>
                  {planned} min in {visits.length * 2} allowances
                </dd>
                <dt>Gaps</dt>
                <dd>{comparing ? "Not recalculated" : `${gaps} min`}</dd>
                <dt>Issues</dt>
                <dd
                  className={
                    conflictCount +
                      overlapCount +
                      unknownBasis +
                      reversals.length >
                    0
                      ? "travel-conflict"
                      : undefined
                  }
                >
                  {conflictCount} overlapping blocks / closures · {overlapCount}{" "}
                  reservation overlaps
                  {unknownBasis > 0 &&
                    ` · ${unknownBasis} unreviewed travel bases`}
                  {reversals.length > 0 &&
                    ` · ${reversals.length} order reversal${reversals.length === 1 ? "" : "s"}`}
                </dd>
                <dt>Route estimate</dt>
                <dd>Unknown</dd>
                <dt>Busy</dt>
                <dd>
                  {resource.busy?.length
                    ? resource.busy.map((b, index) => (
                        <p key={index}>{interval(b, context)}</p>
                      ))
                    : "No busy intervals returned"}
                </dd>
                <dt>Blocks</dt>
                <dd>
                  {resource.blocks?.length
                    ? resource.blocks.map((b) => (
                        <p key={b.id}>
                          {b.kind} · {interval(b, context)}
                        </p>
                      ))
                    : "No availability blocks returned"}
                </dd>
                <dt>Closures</dt>
                <dd>
                  {resource.exceptions?.length
                    ? resource.exceptions.map((b) => (
                        <p key={b.id}>
                          {b.kind}
                          {b.reason ? ` · ${b.reason}` : ""} ·{" "}
                          {interval(b, context)}
                        </p>
                      ))
                    : "No calendar closures returned"}
                </dd>
              </dl>
              <section className="travel-compare">
                <h3>Compare another order</h3>
                <p>
                  Use Earlier and Later to compare a different order for this
                  person. Nothing changes; to apply it, review a booking change.
                </p>
                <Button disabled={!comparing} onClick={() => setSequence([])}>
                  Reset comparison
                </Button>
              </section>
            </aside>
          )}
        </div>
      )}
    </>
  );
}
