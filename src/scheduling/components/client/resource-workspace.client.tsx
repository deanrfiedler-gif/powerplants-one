"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  PageHeader,
  ReadState,
  Stamp,
  useResource,
  Field,
  SelectField,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import { SchedulingNavigation } from "./workspace-navigation.client";
import { plannerContext, plannerZones } from "../../navigation";
import { addDays, utcFromLocal } from "../../time";
import { competenceState, type ResourceWorkspace } from "../../workspace-model";

const minute = (n: number) =>
  String(Math.floor(n / 60)).padStart(2, "0") +
  ":" +
  String(n % 60).padStart(2, "0");
export function ResourceWorkspaceScreen({ id }: { id: string }) {
  const initial = plannerContext(
    new URLSearchParams(useSearchParams().toString()),
  );
  const day = initial.day;
  const update = (values: Record<string, string>) => {
    const q = new URLSearchParams(window.location.search);
    Object.entries(values).forEach(([key, value]) =>
      value ? q.set(key, value) : q.delete(key),
    );
    window.history.replaceState(null, "", window.location.pathname + "?" + q);
  };
  const context = plannerContext(
    new URLSearchParams({ day, timezone: initial.zone }),
  );
  const from = utcFromLocal(context.day + "T00:00", context.zone),
    to = utcFromLocal(addDays(context.day, 7) + "T00:00", context.zone);
  const read = useResource<ResourceWorkspace>(
    "resources/" +
      id +
      "/scheduling?" +
      new URLSearchParams({ from, to, timezone: context.zone }),
  );
  const data = !read.loading && !read.error ? read.data : null,
    r = data?.resource;
  return (
    <section className="scheduling-workspace">
      <SchedulingNavigation />
      <PageHeader
        eyebrow="PL-02 · Resources"
        title={r?.name ?? "Resource availability & competence"}
        description="Published scheduling evidence, availability and current commitments."
      />
      <div className="scheduling-toolbar">
        <Field
          name="resource-week"
          label="Week starting"
          type="date"
          value={day}
          onChange={(day) => {
            if (day) update({ day });
          }}
        />
        <SelectField
          name="resource-zone"
          label="Review timezone"
          value={context.zone}
          onChange={(timezone) => update({ timezone })}
          options={plannerZones.map((zone) => ({
            id: zone,
            display_name: zone,
          }))}
        />
        <Button onClick={read.reload}>Refresh evidence</Button>
        <Link
          href={
            "/service/technicians?" +
            new URLSearchParams({
              day,
              timezone: context.zone,
              ...(initial.site ? { site_id: initial.site } : {}),
            })
          }
        >
          Back to Field Team
        </Link>
      </div>
      <p className="read-meta">
        Review window: {context.day} for seven days · {context.zone}. Source
        editors are not available here.
      </p>
      <ReadState {...read} retry={read.reload} />
      {data && r && (
        <>
          <p className="read-meta">
            Read at <Stamp value={data.observed_at} /> · {data.completeness}
          </p>
          <div className="scheduling-grid">
            <article className="scheduling-card">
              <h2>Resource overview</h2>
              <p>
                <strong>{r.active ? r.status : "Inactive"}</strong> · Resource v
                {r.version} · {r.base_timezone}
              </p>
              <p className="record-id">Resource {r.id}</p>
              <p>
                Source as at <Stamp value={r.source_as_at} /> · Effective{" "}
                <Stamp value={r.effective_from} /> to{" "}
                <Stamp value={r.effective_to} />
              </p>
              <h3>Permitted site eligibility</h3>
              {data.sites.length ? (
                <ul>
                  {data.sites.map((s) => (
                    <li key={s.id}>
                      <Link href={"/sites/" + s.id}>{s.display_name}</Link> ·{" "}
                      {s.timezone}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No permitted sites returned.</p>
              )}
              <p>
                Site eligibility alone does not establish availability or
                competence for a particular work scope.
              </p>
            </article>
            <article className="scheduling-card">
              <h2>Published calendar</h2>
              <p>
                {r.calendar.name} · v{r.calendar.version} · {r.calendar.status}{" "}
                · {r.calendar.timezone}
              </p>
              <p>
                Effective <Stamp value={r.calendar.effective_from} /> to{" "}
                <Stamp value={r.calendar.effective_to} /> · Source as at{" "}
                <Stamp value={r.calendar.source_as_at} />
              </p>
              <ul>
                {r.calendar.intervals.map((i) => (
                  <li key={i.weekday + ":" + i.start_minute}>
                    {
                      [
                        "Sunday",
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                      ][i.weekday]
                    }{" "}
                    {minute(i.start_minute)}–{minute(i.end_minute)}
                  </li>
                ))}
              </ul>
              <h3>Exceptions and unavailable / other work</h3>
              <p>
                Intervals below use {r.base_timezone}; weekly working hours
                above use {r.calendar.timezone}.
              </p>
              {[...(r.exceptions ?? []), ...(r.blocks ?? [])].map((b) => (
                <p key={b.id}>
                  <strong>{b.kind}</strong> ·{" "}
                  <Stamp value={b.start_at} timezone={r.base_timezone} /> to{" "}
                  <Stamp value={b.end_at} timezone={r.base_timezone} />
                </p>
              ))}
              {!r.exceptions?.length && !r.blocks?.length && (
                <p>No blocks or exceptions returned in this period.</p>
              )}
            </article>
          </div>
          <article className="scheduling-card">
            <h2>Competence & evidence</h2>
            <p>
              Validity is evaluated for the selected seven-day period. Synthetic
              skill evidence is not statutory certification. Certificate and
              renewal evidence: Unknown.
            </p>
            <div className="scheduling-grid">
              {r.skills.map((s) => (
                <section className="scheduling-inset" key={s.id}>
                  <h3>{s.skill_code}</h3>
                  <strong>{competenceState(s, from, to)}</strong>
                  <p>
                    Source status: {s.status} · v{s.version}
                  </p>
                  <p>
                    Valid from <Stamp value={s.valid_from} /> to{" "}
                    <Stamp value={s.valid_to} />
                  </p>
                  <p>
                    Source as at <Stamp value={s.source_as_at} />
                  </p>
                  <details>
                    <summary>Review evidence</summary>
                    <p>Evidence: {s.evidence_ref ?? "Unknown"}</p>
                    <p>
                      Reviewed <Stamp value={s.reviewed_at} /> · Reviewer{" "}
                      {s.reviewer_id ?? "Unknown"}
                    </p>
                    <p className="record-id">
                      Hash: {s.content_hash ?? "Unknown"}
                    </p>
                  </details>
                </section>
              ))}
            </div>
            {!r.skills.length && (
              <p>No competence evidence returned. Eligibility is unknown.</p>
            )}
          </article>
          <div className="scheduling-grid">
            <article className="scheduling-card">
              <h2>Busy reservations</h2>
              <p>
                Includes explicit travel. Busy intervals can include bookings
                whose details are outside your access.
              </p>
              {r.busy?.map((b, i) => (
                <p key={i}>
                  <Stamp value={b.start_at} timezone={r.base_timezone} /> to{" "}
                  <Stamp value={b.end_at} timezone={r.base_timezone} />
                </p>
              ))}
              {!r.busy?.length && (
                <p>
                  No busy reservation returned in this period; this does not
                  certify capacity.
                </p>
              )}
            </article>
            <article className="scheduling-card">
              <h2>Current commitments & history</h2>
              {data.appointments.map((a) => (
                <p key={a.id}>
                  <Link href={"/service/appointments/" + a.id}>
                    {a.display_number}
                  </Link>{" "}
                  · {a.status} ·{" "}
                  <Stamp value={a.start_at} timezone={a.site_timezone} /> ·{" "}
                  {a.site_name} · {a.site_timezone}
                </p>
              ))}
              {!data.appointments.length && (
                <p>No permitted current assignments in this period.</p>
              )}
              <p>
                Open an appointment for immutable booking history.
                Resource-source publication history beyond the returned bundle
                is not supplied.
              </p>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
