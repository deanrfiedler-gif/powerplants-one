"use client";
import { PolicyHolds } from "./policy-holds.client";
import { PolicyPublicationWorkspace } from "./policy-publication.client";
import { useShell } from "../../../components/shell-provider";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Field,
  SelectField,
  PageHeader,
  ReadState,
  Stamp,
  useResource,
  ErrorNotice,
  type Envelope,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import { SchedulingNavigation } from "./workspace-navigation.client";
import { plannerContext, plannerZones } from "../../navigation";
import { utcFromLocal } from "../../time";
import {
  policyImpactLabels,
  type PolicyImpactReview,
} from "../../policy-impact-model";

export function PolicyImpactScreen() {
  const { context } = useShell();
  if (!context) return <p role="status">Loading current Scheduling access…</p>;
  return <PolicyImpactBody key={context.preference_scope}/>;
}
function PolicyImpactBody() {
  const initial = plannerContext(
    new URLSearchParams(useSearchParams().toString()),
  );
  const [effective, setEffective] = useState(initial.day + "T08:00"),
    [zone, setZone] = useState(initial.zone),
    [minutes, setMinutes] = useState(""),
    [site, setSite] = useState(initial.site),
    [query, setQuery] = useState<string | null>(null),
    [localError, setLocalError] = useState<unknown>(null);
  const source = useResource<PolicyImpactReview>("schedule/policy-impact"),
    sites =
      useResource<Envelope<{ id: string; display_name: string }>>(
        "sites?limit=100",
      ),
    review = useResource<PolicyImpactReview>(
      query ? "schedule/policy-impact?" + query : null,
    );
  const policy = !source.loading && !source.error ? source.data?.policy : null,
    data = !review.loading && !review.error && !localError ? review.data : null;
  function change(work: () => void) {
    setQuery(null);
    setLocalError(null);
    work();
  }
  function analyse(event: FormEvent) {
    event.preventDefault();
    if (!policy) return;
    try {
      const next = new URLSearchParams({
        policy_id: policy.id,
        expected_version: String(policy.version),
        effective_from: utcFromLocal(effective, zone),
        max_visit_minutes: minutes,
        ...(site ? { site_id: site } : {}),
      }).toString();
      setLocalError(null);
      setQuery(next);
      if (query === next) review.reload();
    } catch (e) {
      setQuery(null);
      setLocalError({
        message:
          e instanceof Error ? e.message : "Check the proposed effective time.",
      });
    }
  }
  return (
    <section className="scheduling-workspace">
      <SchedulingNavigation />
      <PageHeader
        eyebrow="PL-04 · Policy impact"
        title="Review a scheduling rule change"
        description="Compare a visit-duration change, or reopen saved policy evidence under your current duty."
      />
      <p>
        The temporary comparison leaves the published rule, bookings and documents unchanged.
      </p>
      <PolicyPublicationWorkspace />
      <PolicyHolds />
      <h2>Temporary scoped comparison</h2>
      <ReadState {...source} retry={() => change(source.reload)} />
      {policy && (
        <>
          <article className="scheduling-card">
            <h2>Published rule</h2>
            <p>
              {policy.name} · Version {policy.version} · Maximum visit{" "}
              {policy.max_visit_minutes} minutes
            </p>
            <p>
              Valid <Stamp value={policy.effective_from} timezone={zone} /> to{" "}
              <Stamp value={policy.effective_to} timezone={zone} /> · {zone}
            </p>
            <p>{policy.evidence}</p>
            <p>
              Other rules and the original expiry remain fixed. Travel
              allowances are separate from visit duration.
            </p>
          </article>
          <form onSubmit={analyse}>
            <div className="scheduling-toolbar">
              <Field
                name="policy-effective"
                label="Proposed effective time"
                type="datetime-local"
                value={effective}
                onChange={(v) => change(() => setEffective(v))}
                required
              />
              <SelectField
                name="policy-zone"
                label="Timezone"
                value={zone}
                onChange={(v) => change(() => setZone(v))}
                options={plannerZones.map((v) => ({ id: v, display_name: v }))}
              />
              <Field
                name="policy-minutes"
                label="Proposed maximum visit (minutes)"
                type="number"
                value={minutes}
                onChange={(v) => change(() => setMinutes(v))}
                hint="Enter 1–1440 whole minutes. This does not include travel."
                required
              />
              <SelectField
                name="policy-site"
                label="Site restriction"
                value={site}
                onChange={(v) => change(() => setSite(v))}
                empty="All permitted sites"
                options={sites.data?.items ?? []}
              />
              {!!sites.error && (
                <p>
                  Site options unavailable. All results still enforce your
                  current access.
                </p>
              )}
            </div>
            <div className="scheduling-toolbar">
              <Button type="submit" variant="primary" busy={review.loading}>
                Compare future bookings
              </Button>
              <Button onClick={() => change(source.reload)}>
                Refresh published rule
              </Button>
            </div>
          </form>
        </>
      )}
      <ErrorNotice error={localError} />
      <ReadState {...review} retry={review.reload} />
      {data?.scenario && (
        <div aria-live="polite">
          <h2>Bookings requiring review</h2>
          <p role="status">
            {data.items.length} requiring review from {data.compared} compared
            bookings.
          </p>
          <p className="read-meta">
            Read at <Stamp value={data.observed_at} timezone={zone} /> ·{" "}
            {data.completeness}
          </p>
          <p>
            Proposed limit: {data.scenario.max_visit_minutes} minutes from{" "}
            <Stamp value={data.scenario.effective_from} timezone={zone} />.
            Started, completed, cancelled, proposed and differently pinned
            visits are outside this comparison.
          </p>
          {!data.items.length && (
            <p>
              No matching bookings require review under this comparison. This is
              not publication or dispatch approval.
            </p>
          )}
          <div className="scheduling-grid">
            {data.items.map((a) => (
              <article className="scheduling-card" key={a.id}>
                <h3>
                  {a.display_number} · {a.site_name}
                </h3>
                <p>
                  <Stamp value={a.start_at} timezone={a.site_timezone} /> to{" "}
                  <Stamp value={a.end_at} timezone={a.site_timezone} /> ·{" "}
                  {a.site_timezone}
                </p>
                <ul>
                  {a.reasons.map((reason) => (
                    <li key={reason}>{policyImpactLabels[reason]}</li>
                  ))}
                </ul>
                <p>
                  Service owner: {a.service_owner_name}. No new task has been
                  saved.
                </p>
                <p>
                  Appointment v{a.version} · Schedule v{a.schedule_version} ·
                  Crew v{a.assignment_version}
                </p>
                <Link
                  href={
                    "/schedule/changes?" +
                    new URLSearchParams({
                      day: a.start_at.slice(0, 10),
                      timezone: a.site_timezone,
                      appointment_id: a.id,
                    })
                  }
                >
                  Review {a.display_number}
                </Link>
              </article>
            ))}
          </div>
          <details>
            <summary>Comparison provenance</summary>
            <p>
              Published policy: {data.policy.id} · v{data.policy.version}
            </p>
            <p style={{ overflowWrap: "anywhere" }}>
              Policy hash: {data.policy.content_hash}
            </p>
            <p style={{ overflowWrap: "anywhere" }}>
              Scenario hash: {data.scenario.content_hash}
            </p>
            <p>
              Hashes identify compared content. They are not a publication
              receipt.
            </p>
          </details>
        </div>
      )}
    </section>
  );
}
