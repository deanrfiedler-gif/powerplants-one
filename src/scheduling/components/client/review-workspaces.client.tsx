"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import {
  Field,
  SelectField,
  PageHeader,
  ReadState,
  Stamp,
  useResource,
  type Envelope,
} from "../../../components/business-ui";
import { Button, ButtonLink } from "../../../components/ui/button";
import type { Schedule, Appointment } from "../../index";
import { RequestDecision } from "./planner-screens.client";
import { SchedulingNavigation } from "./workspace-navigation.client";
import {
  plannerContext,
  plannerZones,
  safePlannerReturn,
  reviewCriteria,
  demandCommitments,
} from "../../navigation";
import { addDays, utcFromLocal } from "../../time";
import {
  travelSequences,
  scenarioSummary,
  hasOpenSchedulingFollowup,
  travelAvailabilityConflicts,
  type CapacityWorkspace,
  type ChangesWorkspace,
} from "../../workspace-model";

function ReviewSelect(props: ComponentProps<typeof SelectField>) {
  const all = props.options.find((option) => option.id === "");
  return (
    <SelectField
      {...props}
      empty={all?.display_name ?? "Choose..."}
      options={props.options.filter((option) => option.id !== "")}
    />
  );
}
function useReviewWindow(path: string, days = 7) {
  const search = useSearchParams(),
    context = plannerContext(new URLSearchParams(search.toString()));
  const horizon = [1, 7, 28, 90].includes(Number(search.get("days")))
    ? Number(search.get("days"))
    : days;
  const from = utcFromLocal(context.day + "T00:00", context.zone),
    to = utcFromLocal(addDays(context.day, horizon) + "T00:00", context.zone);
  const update = (values: Record<string, string>) => {
    const q = new URLSearchParams(search.toString());
    Object.entries(values).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
    window.history.replaceState(null, "", path + "?" + q);
  };
  const sites =
    useResource<Envelope<{ id: string; display_name: string }>>(
      "sites?limit=100",
    );
  const query = new URLSearchParams({
    from,
    to,
    timezone: context.zone,
    ...(context.site ? { site_id: context.site } : {}),
    ...(context.resource ? { resource_id: context.resource } : {}),
  });
  return { search, context, horizon, from, to, update, sites, query };
}
type ReviewWindow = ReturnType<typeof useReviewWindow>;
function WindowControls({
  w,
  dayOnly = false,
}: {
  w: ReviewWindow;
  dayOnly?: boolean;
}) {
  return (
    <div className="scheduling-toolbar">
      <Field
        name="review-day"
        label={dayOnly ? "Review day" : "Period starting"}
        type="date"
        value={w.context.day}
        onChange={(day) =>
          w.update({ day, appointment_id: "", selected_id: "" })
        }
      />
      {!dayOnly && (
        <ReviewSelect
          name="review-days"
          label="Horizon"
          value={String(w.horizon)}
          onChange={(days) =>
            w.update({ days, appointment_id: "", selected_id: "" })
          }
          options={[
            { id: "7", display_name: "7 days" },
            { id: "28", display_name: "28 days" },
            { id: "90", display_name: "90 days" },
          ]}
        />
      )}
      <ReviewSelect
        name="review-zone"
        label="Display timezone"
        value={w.context.zone}
        onChange={(timezone) => w.update({ timezone })}
        options={plannerZones.map((z) => ({ id: z, display_name: z }))}
      />
      <ReviewSelect
        name="review-site"
        label="Site"
        value={w.context.site}
        onChange={(site_id) =>
          w.update({
            site_id,
            appointment_id: "",
            selected_id: "",
            resource_id: "",
          })
        }
        options={[
          { id: "", display_name: "All permitted sites" },
          ...(w.sites.data?.items ?? []).map((s) => ({
            id: s.id,
            display_name: s.display_name,
          })),
        ]}
      />
      {!!w.sites.error && (
        <span>Site options unavailable. Refresh the page to retry.</span>
      )}
    </div>
  );
}
function AppointmentReview({
  a,
  returnTo,
  reload,
}: {
  a: Appointment;
  returnTo: string;
  reload: () => void;
}) {
  return (
    <article
      className="scheduling-card"
      aria-label={"Review " + a.display_number}
    >
      <h2 id="scheduling-review-heading" tabIndex={-1}>
        {a.display_number}
      </h2>
      <p>
        {a.customer_name ?? "Customer unavailable"} ·{" "}
        {a.work_order_display_number} · {a.site_name} · {a.scope_summary}
      </p>
      <p>
        <Stamp value={a.start_at} timezone={a.site_timezone} /> to{" "}
        <Stamp value={a.end_at} timezone={a.site_timezone} /> ·{" "}
        {a.site_timezone}
      </p>
      <p>
        Appointment v{a.version} · Schedule v{a.schedule_version} · Crew v
        {a.assignment_version} · {a.status}
      </p>
      <p>
        Customer commitment: <strong>{a.customer_commitment}</strong> ·
        Preparation: {a.preparation_status} · Dispatch{" "}
        {a.dispatch_hold ? "held" : "not held"} · Pack: {a.pack_requirement}
      </p>
      <p>
        Current crew:{" "}
        {a.assignments
          .filter(
            (x) => x.active && x.assignment_version === a.assignment_version,
          )
          .map((x) => x.name + " (" + x.crew_role + ")")
          .join(", ") || "Unassigned"}
      </p>
      {a.cancellation_reason && (
        <p>Cancellation reason: {a.cancellation_reason}</p>
      )}
      <p>
        Changed booking facts require fresh contact. Contact is not message
        delivery or crew pack acknowledgement.
      </p>
      {a.requests.map((r) => (
        <RequestDecision
          key={r.id + ":" + r.version}
          a={a}
          request={r}
          onSaved={reload}
        />
      ))}
      {!a.requests.length && (
        <p>
          No change requests. Use the appointment to propose a controlled move.
        </p>
      )}
      <h3>Owned follow-up</h3>
      {a.followups.map((f) => (
        <p key={f.activity_id}>
          <Link href={"/work/" + f.activity_id}>{f.summary}</Link> · {f.status}{" "}
          · {f.due_at ? <Stamp value={f.due_at} /> : "Due date needed"}
        </p>
      ))}
      {!a.followups.length && <p>No permitted follow-up returned.</p>}
      <details>
        <summary>Contact and booking history</summary>
        {a.contacts.map((c) => (
          <p key={c.id}>
            {c.outcome} · {c.recipient_name} · {c.channel} · Schedule v
            {c.schedule_version} · <Stamp value={c.occurred_at} />
          </p>
        ))}
        {a.history.map((h) => (
          <p key={h.version}>
            v{h.version}: {h.snapshot.status} ·{" "}
            <Stamp value={h.snapshot.start_at} timezone={a.site_timezone} /> ·
            Customer {h.snapshot.customer_commitment}
          </p>
        ))}
      </details>
      <ButtonLink
        href={
          "/service/appointments/" +
          a.id +
          "?returnTo=" +
          encodeURIComponent(returnTo)
        }
      >
        Open appointment controls
      </ButtonLink>
      {!a.actions.can_manage && (
        <p>
          Read-only booking access. Only actions permitted to this identity are
          available.
        </p>
      )}
    </article>
  );
}
export function ChangesWorkspaceScreen() {
  const w = useReviewWindow("/schedule/changes"),
    focus = w.search.get("appointment_id");
  if (focus && /^[0-9a-f-]{36}$/i.test(focus))
    w.query.set("appointment_id", focus);
  const read = useResource<ChangesWorkspace>("schedule/changes?" + w.query),
    data = !read.loading && !read.error ? read.data : null;
  const focusReview = useRef(false);
  useEffect(() => {
    if (data && focusReview.current) {
      document.getElementById("scheduling-review-heading")?.focus();
      focusReview.current = false;
    }
  }, [data]);
  const criteria = reviewCriteria(new URLSearchParams(w.search.toString())),
    view = criteria.queue,
    selected = criteria.selected;
  const items =
    data?.items.filter(
      (a) =>
        view === "history" ||
        (view === "requests" && a.requests.length > 0) ||
        (view === "cancellations" && a.status === "Cancelled") ||
        (view === "contact" && hasOpenSchedulingFollowup(a)) ||
        (view === "review" &&
          (a.requests.some((r) => r.status === "Pending") ||
            a.customer_commitment === "Changed" ||
            a.scope_review_required ||
            hasOpenSchedulingFollowup(a))),
    ) ?? [];
  const a = data?.focused
    ? data.items[0]
    : (items.find((a) => a.id === selected) ?? items[0]);
  const returnQuery = new URLSearchParams(w.search.toString());
  if (a) returnQuery.set("selected_id", a.id);
  const returnTo = safePlannerReturn("/schedule/changes?" + returnQuery);
  return (
    <section className="scheduling-workspace">
      <SchedulingNavigation />
      <PageHeader
        eyebrow="PL-04 · Scheduling"
        title="Changes & follow-up"
        description="Review proposed changes, customer contact and owned scheduling consequences."
      />
      <WindowControls w={w} />
      <div className="scheduling-toolbar">
        <ReviewSelect
          name="change-view"
          label="Queue"
          value={view}
          onChange={(queue) =>
            w.update({ queue, selected_id: "", appointment_id: "" })
          }
          options={[
            { id: "review", display_name: "Needs review" },
            { id: "requests", display_name: "Change requests" },
            { id: "contact", display_name: "Customer follow-up" },
            { id: "cancellations", display_name: "Cancellations" },
            { id: "history", display_name: "History / all visits" },
          ]}
        />
        <Button onClick={read.reload}>Refresh review</Button>
      </div>
      <ReadState {...read} retry={read.reload} />
      {data && (
        <>
          <p className="read-meta">
            Read at <Stamp value={data.observed_at} /> ·{" "}
            {data.focused
              ? "Exact appointment handover; date and queue filters do not hide this record"
              : data.completeness}
            .
          </p>
          {data.focused && (
            <Button onClick={() => w.update({ appointment_id: "" })}>
              Return to review queue
            </Button>
          )}
          <div className="scheduling-review-layout">
            <div className="scheduling-queue" aria-label="Review queue">
              {items.map((v) => (
                <Button
                  key={v.id}
                  aria-pressed={a?.id === v.id}
                  onClick={() => {
                    w.update({ selected_id: v.id, appointment_id: "" });
                  }}
                >
                  <span>
                    <strong>{v.display_number}</strong>
                    <br />
                    {v.site_name}
                    <br />
                    {v.status} ·{" "}
                    {v.requests.filter((r) => r.status === "Pending").length}{" "}
                    pending requests
                  </span>
                </Button>
              ))}
              {!items.length && !data.focused && (
                <p>
                  {data.items.length
                    ? "No visits match this queue. Choose History / all visits to review other states."
                    : "No permitted visits in this period."}
                </p>
              )}
            </div>
            {a && (
              <AppointmentReview
                key={a.id + ":" + a.version}
                a={a}
                returnTo={returnTo}
                reload={() => {
                  focusReview.current = true;
                  read.reload();
                }}
              />
            )}
          </div>
        </>
      )}
    </section>
  );
}
export function TravelWorkspaceScreen() {
  const w = useReviewWindow("/schedule/travel", 1);
  // Keep the permitted resource choices available when changing this local filter.
  w.query.delete("resource_id");
  // Travel always reads one local day, including DST transitions.
  w.query.set(
    "to",
    utcFromLocal(addDays(w.context.day, 1) + "T00:00", w.context.zone),
  );
  const read = useResource<Schedule>("schedule?" + w.query),
    data = !read.loading && !read.error ? read.data : null;
  return (
    <section className="scheduling-workspace">
      <SchedulingNavigation />
      <PageHeader
        eyebrow="PL-05 · Scheduling"
        title="Travel review"
        description="Review visit order, explicit travel allowances and gaps before requesting a booking change."
      />
      <WindowControls w={w} dayOnly />
      <Button onClick={read.reload}>Refresh visits</Button>
      <ReadState {...read} retry={read.reload} />
      {data && (
        <TravelReview
          key={w.search.toString() + data.observed_at}
          data={data}
          w={w}
        />
      )}
    </section>
  );
}
function TravelReview({ data, w }: { data: Schedule; w: ReviewWindow }) {
  const resource = w.context.resource;
  const [sequence, setSequence] = useState<string[]>([]);
  const visits = travelSequences(data.items, resource),
    selected = data.resources.find((r) => r.id === resource);
  const ordered = sequence.length
    ? sequence.map((k) => visits.find((v) => v.key === k)!).filter(Boolean)
    : visits;
  function move(index: number, direction: number) {
    const keys = ordered.map((v) => v.key),
      other = index + direction;
    if (other < 0 || other >= keys.length) return;
    [keys[index], keys[other]] = [keys[other], keys[index]];
    setSequence(keys);
  }
  return (
    <>
      <div className="scheduling-toolbar">
        <ReviewSelect
          name="travel-resource"
          label="Resource / crew member"
          value={resource}
          onChange={(v) => {
            w.update({ resource_id: v });
          }}
          options={[
            { id: "", display_name: "All permitted resources" },
            ...data.resources.map((r) => ({ id: r.id, display_name: r.name })),
          ]}
        />
        <Button disabled={!sequence.length} onClick={() => setSequence([])}>
          Reset sequence comparison
        </Button>
      </div>
      <p className="read-meta">
        Read at <Stamp value={data.observed_at} /> · {data.display_timezone}.
        Ordered separately per resource. Planned allowance, route estimate and
        actual field Travel are separate facts.
      </p>
      <p>
        Route estimate: <strong>Unknown — no provider configured</strong>.
        Sequence changes are analytical and do not change appointment times.
        Select one resource to compare a different order.
      </p>
      {w.context.site && (
        <p>
          Site filter active: other visits may be outside this list. Busy
          intervals still include all reservations for the selected resource.
        </p>
      )}
      {selected && (
        <details>
          <summary>Other busy intervals and availability blocks</summary>
          {selected.busy?.map((b, i) => (
            <p key={"busy" + i}>
              Busy including travel: <Stamp value={b.start_at} /> to{" "}
              <Stamp value={b.end_at} />
            </p>
          ))}
          {selected.blocks?.map((b) => (
            <p key={b.id}>
              {b.kind}: <Stamp value={b.start_at} /> to{" "}
              <Stamp value={b.end_at} />
            </p>
          ))}
        </details>
      )}
      {!visits.length && (
        <p>
          {data.items.length
            ? "No assigned open visits match this resource. Proposed visits without crew remain in the planner."
            : "No permitted visits in this day. Availability is not certified by an empty list."}
        </p>
      )}
      <ol className="scheduling-travel-list">
        {ordered.map((v, i) => {
          const a = v.appointment,
            original = visits.findIndex((x) => x.key === v.key) + 1;
          const reversed =
            i > 0 &&
            ordered[i - 1].resource_id === v.resource_id &&
            Date.parse(ordered[i - 1].appointment.start_at) >
              Date.parse(a.start_at);
          const conflicts = travelAvailabilityConflicts(
            v,
            data.resources.find((r) => r.id === v.resource_id),
          );
          return (
            <li key={v.key} className="scheduling-card">
              <h2>
                {v.resource_name} · {a.display_number}
              </h2>
              <p>
                {a.customer_name ?? "Customer unavailable"} · {a.site_name} ·{" "}
                {a.work_order_display_number} · {a.scope_summary}
              </p>
              <p>
                <Stamp value={a.start_at} timezone={a.site_timezone} /> to{" "}
                <Stamp value={a.end_at} timezone={a.site_timezone} /> ·{" "}
                {a.site_timezone} · {a.status}
              </p>
              <p>
                Customer window:{" "}
                {a.requested_window_start ? (
                  <>
                    <Stamp
                      value={a.requested_window_start}
                      timezone={a.site_timezone}
                    />{" "}
                    to{" "}
                    <Stamp
                      value={a.requested_window_end}
                      timezone={a.site_timezone}
                    />
                  </>
                ) : (
                  "Not supplied"
                )}
              </p>
              <p>
                Planned travel before <strong>{v.before} min</strong> · after{" "}
                <strong>{v.after} min</strong> ·{" "}
                {v.reason || "Unknown / unreviewed basis"}
              </p>
              <p>
                Original order {original}. Original schedule:{" "}
                {v.gap_minutes === null
                  ? "First reservation for this resource."
                  : v.overlap
                    ? `Reservation overlap: ${-v.gap_minutes} min — review conflict.`
                    : `Gap after previous buffered reservation: ${v.gap_minutes} min; route sufficiency unknown.`}
              </p>
              {conflicts.blocks.length > 0 && (
                <p role="status">
                  Availability block overlaps this reservation — review with the
                  coordinator.
                </p>
              )}
              {conflicts.closures.length > 0 && (
                <p role="status">
                  Calendar closure overlaps this visit or its travel allowance —
                  review with the coordinator.
                </p>
              )}
              {reversed && (
                <p role="status">
                  Proposed order reverses current booking times. A controlled
                  move is required to apply it.
                </p>
              )}
              <div className="button-row">
                <Button
                  disabled={!resource || i === 0}
                  onClick={() => move(i, -1)}
                  aria-label={
                    "Move " + a.display_number + " earlier in comparison"
                  }
                >
                  Earlier
                </Button>
                <Button
                  disabled={!resource || i === ordered.length - 1}
                  onClick={() => move(i, 1)}
                  aria-label={
                    "Move " + a.display_number + " later in comparison"
                  }
                >
                  Later
                </Button>
                <ButtonLink
                  href={
                    "/schedule/changes?" +
                    new URLSearchParams({
                      day: w.context.day,
                      timezone: w.context.zone,
                      appointment_id: a.id,
                      resource_id: v.resource_id,
                      ...(w.context.site ? { site_id: w.context.site } : {}),
                    })
                  }
                >
                  Review booking change
                </ButtonLink>
              </div>
            </li>
          );
        })}
      </ol>
      {data.items.some(
        (a) => a.status === "Proposed" && !a.assignments.some((x) => x.active),
      ) && (
        <p>
          Unassigned proposals have no resource sequence or travel basis. Review
          them in the Planner.
        </p>
      )}
    </>
  );
}
export function CapacityWorkspaceScreen() {
  const w = useReviewWindow("/schedule/capacity");
  // Resource is an analytical filter below: source domains without a mapping
  // must remain visible as Unknown, rather than disappear in a server join.
  w.query.delete("resource_id");
  const read = useResource<CapacityWorkspace>("schedule/capacity?" + w.query),
    data = !read.loading && !read.error ? read.data : null;
  return (
    <section className="scheduling-workspace">
      <SchedulingNavigation />
      <PageHeader
        eyebrow="PL-03 · Scheduling"
        title="Demand & capacity"
        description="Compare source-owned demand, known reservations and missing effort across Service, Projects and Engineering."
      />
      <WindowControls w={w} />
      <Button onClick={read.reload}>Refresh source snapshot</Button>
      <ReadState {...read} retry={read.reload} />
      {data && (
        <CapacityReview
          key={w.search.toString() + data.observed_at}
          data={data}
          w={w}
        />
      )}
    </section>
  );
}
function CapacityReview({
  data,
  w,
}: {
  data: CapacityWorkspace;
  w: ReviewWindow;
}) {
  const {
    domain,
    commitment,
    resource,
    skill,
    unknownEffort: unknown,
  } = reviewCriteria(new URLSearchParams(w.search.toString()));
  const [excluded, setExcluded] = useState<string[]>([]);
  const context = w.context;
  const items = data.items.filter(
    (i) =>
      (!domain || i.domain === domain) &&
      (!commitment || i.commitment === commitment) &&
      (!resource ||
        (resource === "unknown"
          ? !i.resource_ids.length
          : i.resource_ids.includes(resource))) &&
      (!skill ||
        (skill === "unknown" ? !i.skills.length : i.skills.includes(skill))) &&
      (!unknown || i.effort_minutes === null),
  );
  const original = scenarioSummary(items, []),
    scenario = scenarioSummary(items, excluded);
  return (
    <>
      <p className="read-meta">
        Snapshot <Stamp value={data.observed_at} /> · Source versions and source
        as-at remain separate. Refresh before acting; source owners recheck all
        changes.
      </p>
      <div className="scheduling-grid">
        {data.sources.map((s) => (
          <article className="scheduling-inset" key={s.domain}>
            <h2>
              {s.domain} · {s.state}
            </h2>
            <p>{s.basis}</p>
          </article>
        ))}
      </div>
      <div className="scheduling-toolbar">
        <ReviewSelect
          name="capacity-domain"
          label="Domain"
          value={domain}
          onChange={(domain) => w.update({ domain })}
          options={[
            { id: "", display_name: "All permitted domains" },
            ...data.sources.map((s) => ({
              id: s.domain,
              display_name: s.domain,
            })),
          ]}
        />
        <ReviewSelect
          name="capacity-class"
          label="Commitment"
          value={commitment}
          onChange={(commitment) => w.update({ commitment })}
          options={[
            { id: "", display_name: "All source commitments" },
            ...demandCommitments.map((v) => ({ id: v, display_name: v })),
          ]}
        />
        <ReviewSelect
          name="capacity-resource"
          label="Resource"
          value={resource}
          onChange={(resource_id) => w.update({ resource_id })}
          options={[
            { id: "", display_name: "All / unmapped" },
            { id: "unknown", display_name: "Unknown resource" },
            ...data.resources.map((r) => ({ id: r.id, display_name: r.name })),
          ]}
        />
        <ReviewSelect
          name="capacity-skill"
          label="Required skill"
          value={skill}
          onChange={(skill) => w.update({ skill })}
          options={[
            { id: "", display_name: "All / unknown" },
            { id: "unknown", display_name: "Unknown skill requirement" },
            ...[...new Set(data.items.flatMap((i) => i.skills))].map((s) => ({
              id: s,
              display_name: s,
            })),
          ]}
        />
        <label>
          <input
            type="checkbox"
            checked={unknown}
            onChange={(e) =>
              w.update({ unknown_effort: e.target.checked ? "1" : "" })
            }
          />{" "}
          Unknown effort only
        </label>
      </div>
      <article className="scheduling-card">
        <h2>Scenario comparison</h2>
        <p>
          Exclude contributions to explore a scenario. No source record changes;
          refresh or changing filters resets this comparison. Filters are
          retained in the page address.
        </p>
        <p>
          Visible baseline: {original.contributions} contributions ·{" "}
          {original.unknown_effort} unknown effort · {original.reserved_minutes}{" "}
          reserved resource minutes.
        </p>
        <p aria-live="polite">
          Scenario: {scenario.contributions} contributions ·{" "}
          {scenario.unknown_effort} unknown effort · {scenario.reserved_minutes}{" "}
          reserved resource minutes.
        </p>
        <p>
          Reservations count each crew member and explicit travel. They are not
          labour estimates or actual work. Net capacity, overload from unknown
          effort and utilisation: <strong>Unknown</strong>.
        </p>
        <Button disabled={!excluded.length} onClick={() => setExcluded([])}>
          Reset scenario
        </Button>
      </article>
      <h2>Capacity supply basis</h2>
      <div className="scheduling-grid">
        {data.resources.map((r) => (
          <article key={r.id} className="scheduling-inset">
            <h3>
              <Link
                href={
                  "/service/technicians/" +
                  r.id +
                  "?" +
                  new URLSearchParams({
                    day: context.day,
                    timezone: context.zone,
                  })
                }
              >
                {r.name}
              </Link>
            </h3>
            <p>
              {r.active ? r.status : "Inactive"} · {r.calendar.name} v
              {r.calendar.version} · {r.calendar.timezone}
            </p>
            <p>
              Source <Stamp value={r.source_as_at} /> ·{" "}
              {r.calendar.intervals.length} published working intervals ·{" "}
              {r.exceptions?.length ?? 0} exceptions · {r.blocks?.length ?? 0}{" "}
              blocks · {r.busy?.length ?? 0} busy reservations in horizon.
            </p>
            <p>
              Open resource evidence to review intervals and conflicts. These
              source facts do not define a net working-time denominator.
            </p>
          </article>
        ))}
      </div>
      {!data.resources.length && (
        <p>No permitted resource supply returned; capacity is unknown.</p>
      )}
      <h2>Contributing source records</h2>
      {!items.length && (
        <p>
          {data.items.length
            ? "No contributions match these filters. Unmapped resource and unknown effort remain separate filters."
            : "No contributions returned in the bounded source windows; inspect source completeness above."}
        </p>
      )}
      <div className="scheduling-grid">
        {items.map((i) => (
          <article key={i.key} className="scheduling-card">
            <p className="read-meta">
              {i.domain} · {i.commitment} · {i.source_state}
            </p>
            <h3>
              <Link href={i.href}>
                {i.reference} · {i.title}
              </Link>
            </h3>
            <p>
              {i.customer} · {i.site ?? "Site unknown"}
            </p>
            <p>
              Window: {i.window_start ?? "Start unknown"} to{" "}
              {i.window_end ?? "End unknown"} · {i.time_basis}
            </p>
            <p>
              Effort: <strong>Unknown</strong> · {i.completeness}.{" "}
              {i.reserved_minutes !== null && (
                <>Reserved resource minutes: {i.reserved_minutes}.</>
              )}
            </p>
            <p>
              Owner: {i.owner ?? "Unknown"} · Next: {i.next_action}
            </p>
            <p>
              Source v{i.source_version} · <Stamp value={i.source_as_at} />
            </p>
            <details>
              <summary>Exact provenance</summary>
              <p className="record-id">{i.key}</p>
              <p>
                Skills: {i.skills.join(", ") || "Unknown"} · Resource mapping:{" "}
                {i.resource_ids.length ? i.resource_ids.join(", ") : "Unknown"}
              </p>
            </details>
            <label>
              <input
                type="checkbox"
                checked={excluded.includes(i.key)}
                onChange={(e) =>
                  setExcluded(
                    e.target.checked
                      ? [...excluded, i.key]
                      : excluded.filter((k) => k !== i.key),
                  )
                }
              />{" "}
              Exclude from analytical scenario
            </label>
          </article>
        ))}
      </div>
    </>
  );
}
