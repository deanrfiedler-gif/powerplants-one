"use client";
import Link from "next/link";
import {
  notifyLocationSearchChanged,
  useCurrentLocationSearch,
} from "../../../components/current-location-search";
import { useState, useSyncExternalStore, type ComponentProps } from "react";
import {
  Field,
  SelectField,
  PageHeader,
  ReadState,
  Stamp,
  useResource,
  type Envelope,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import { TravelReview } from "./travel-review.client";
import { usePhoneHeader } from "../../../shell/phone-header";
import { useIdentity } from "../../../components/business-session";
import type { Schedule } from "../../index";
import { SchedulingNavigation } from "./workspace-navigation.client";
import {
  plannerContext,
  plannerZones,
  demandCommitments,
  reviewCriteria,
} from "../../navigation";
import { addDays, utcFromLocal } from "../../time";
import { scenarioSummary, type CapacityWorkspace } from "../../workspace-model";

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
  const search = useCurrentLocationSearch(),
    context = plannerContext(new URLSearchParams(search.toString()));
  const horizon = [1, 7, 28, 90].includes(Number(search.get("days")))
    ? Number(search.get("days"))
    : days;
  const from = utcFromLocal(context.day + "T00:00", context.zone),
    to = utcFromLocal(addDays(context.day, horizon) + "T00:00", context.zone);
  const update = (values: Record<string, string>) => {
    const q = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
    window.history.replaceState(null, "", path + "?" + q);
    notifyLocationSearchChanged();
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
function TravelWindowControls({
  w,
  phone,
}: {
  w: ReviewWindow;
  phone: boolean;
}) {
  const zone = (
    <ReviewSelect
      name="review-zone"
      label="Display timezone"
      value={w.context.zone}
      onChange={(timezone) => w.update({ timezone })}
      options={plannerZones.map((id) => ({ id, display_name: id }))}
    />
  );
  return (
    <>
      <div className="travel-date">
        <Field
          name="review-day"
          label="Review day"
          type="date"
          value={w.context.day}
          onChange={(day) =>
            w.update({ day, appointment_id: "", selected_id: "" })
          }
        />
      </div>
      {!phone && <div className="travel-zone">{zone}</div>}
      <details className="travel-filters">
        <summary aria-label="Time zone and site filters">
          {phone ? "Filters" : w.context.site ? "Site · filtered" : "Site"}
        </summary>
        <div className="travel-filter-body">
          {phone && zone}
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
              ...(w.sites.data?.items ?? []),
            ]}
          />
          {!!w.sites.error && (
            <p>Site options unavailable. Refresh the page to retry.</p>
          )}
        </div>
      </details>
    </>
  );
}
const phoneTravelQuery = "(max-width: 780px)";
const subscribePhoneTravel = (changed: () => void) => {
  const media = window.matchMedia(phoneTravelQuery);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
const compactTravelQuery = "(max-width: 350px)";
const subscribeCompactTravel = (changed: () => void) => {
  const media = window.matchMedia(compactTravelQuery);
  media.addEventListener("change", changed);
  return () => media.removeEventListener("change", changed);
};
export function TravelWorkspaceScreen() {
  const phone = useSyncExternalStore(
    subscribePhoneTravel,
    () => window.matchMedia(phoneTravelQuery).matches,
    () => false,
  );
  const compact = useSyncExternalStore(
    subscribeCompactTravel,
    () => window.matchMedia(compactTravelQuery).matches,
    () => false,
  );
  usePhoneHeader({ title: compact ? "Travel" : "Travel review" });
  const w = useReviewWindow("/schedule/travel", 1);
  const identity = useIdentity();
  w.query.delete("resource_id");
  w.query.set(
    "to",
    utcFromLocal(addDays(w.context.day, 1) + "T00:00", w.context.zone),
  );
  const read = useResource<Schedule>("schedule?" + w.query);
  const data = !read.loading && !read.error ? read.data : null;
  return (
    <section
      id="ppo-travel-review"
      className="scheduling-workspace travel-workspace"
    >
      <SchedulingNavigation />
      <PageHeader
        variant="register"
        eyebrow="PL-05 · Scheduling"
        title="Travel review"
        description="Review planned allowances and visit order; bookings remain unchanged."
      />
      {!data && (
        <>
          <div className="travel-toolbar travel-unconfirmed-toolbar">
            <TravelWindowControls w={w} phone={phone} />
            <p className="read-meta">— visits · Current results unconfirmed</p>
          </div>
          <div className={read.error ? "travel-load-error" : undefined}>
            {!!read.error && (
              <>
                <h2>Travel could not be loaded</h2>
                <p>No route is shown. Bookings are unchanged.</p>
              </>
            )}
            <ReadState {...read} retry={read.reload} />
          </div>
        </>
      )}
      {data && (
        <TravelReview
          key={w.search.toString() + data.observed_at}
          data={data}
          context={w.context}
          actorId={identity.actor_id}
          controls={<TravelWindowControls w={w} phone={phone} />}
          refresh={read.reload}
          selectResource={(id) => w.update({ resource_id: id })}
        />
      )}
    </section>
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
