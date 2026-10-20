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
  ReadState,
  Stamp,
  useResource,
  ErrorNotice,
  type Envelope,
} from "../../../components/business-ui";
import { Button } from "../../../components/ui/button";
import { plannerContext, plannerZones } from "../../navigation";
import { utcFromLocal } from "../../time";
import {
  policyImpactLabels,
  type PolicyImpactReview,
} from "../../policy-impact-model";

import { ChangesFrame, useChangesWindow } from "./changes-frame.client";
import { changeQueueCounts } from "../../changes-model";
import type { ChangesWorkspace } from "../../workspace-model";
import { RegisterTable } from "../../../components/ui/register-table";
import { VisitTime } from "./changes-review.client";
import "../../../app/styles/changes-follow-up.css";

export function PolicyImpactScreen() {
  const { context } = useShell();
  if (!context) return <p role="status">Loading current Scheduling access…</p>;
  return <PolicyImpactBody key={context.preference_scope} />;
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
  const window = useChangesWindow("/schedule/policy-impact");
  const countQuery = new URLSearchParams(window.query);
  if (site) countQuery.set("site_id", site);
  else countQuery.delete("site_id");
  const countRead = useResource<ChangesWorkspace>(
    "schedule/changes?" + countQuery,
  );
  const counts =
    !countRead.loading && !countRead.error && countRead.data
      ? changeQueueCounts(countRead.data.items)
      : undefined;
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
  const navigationQuery = new URLSearchParams(window.search.toString());
  if (site) navigationQuery.set("site_id", site);
  else navigationQuery.delete("site_id");
  return (
    <ChangesFrame selected="policy" counts={counts} query={navigationQuery}>
      <section className="changes-policy">
        <header>
          <h1>Policy impact</h1>
          <p>
            Compare a scheduling rule change before publishing it. This
            temporary comparison does not change bookings.
          </p>
        </header>
        <ReadState {...source} retry={() => change(source.reload)} />
        {policy && (
          <div className="changes-policy-cards">
            <article>
              <h2>Published rule</h2>
              <strong>
                {policy.name} · v{policy.version}
              </strong>
              <dl>
                <dt>Maximum visit</dt>
                <dd>{policy.max_visit_minutes} minutes</dd>
                <dt>Effective from</dt>
                <dd>
                  <Stamp value={policy.effective_from} timezone={zone} />
                </dd>
                <dt>Effective to</dt>
                <dd>
                  <Stamp value={policy.effective_to} timezone={zone} />
                </dd>
                <dt>Time zone</dt>
                <dd>{zone}</dd>
              </dl>
              <p>{policy.evidence}</p>
              <p className="read-meta">
                Other rules and the original expiry remain fixed. Travel
                allowances are separate from visit duration.
              </p>
              <Button onClick={() => change(source.reload)}>
                Refresh published rule
              </Button>
            </article>
            <form onSubmit={analyse}>
              <h2>Temporary comparison</h2>
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
                  Site options unavailable. Results still enforce your current
                  access.
                </p>
              )}
              <Button type="submit" variant="primary" busy={review.loading}>
                Compare future bookings
              </Button>
            </form>
          </div>
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
            <RegisterTable
              caption="Bookings affected by the temporary policy comparison"
              variant="panel"
              empty={
                !data.items.length && (
                  <p>
                    No matching bookings require review. This is not publication
                    or dispatch approval.
                  </p>
                )
              }
            >
              <thead>
                <tr>
                  {[
                    "Visit",
                    "Work",
                    "Booked",
                    "Why review",
                    "Service owner",
                  ].map((h) => (
                    <th key={h} scope="col">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <Link
                        href={
                          "/schedule/changes?" +
                          new URLSearchParams({
                            day: initial.day,
                            timezone: zone,
                            ...(site ? { site_id: site } : {}),
                            appointment_id: a.id,
                          })
                        }
                      >
                        {a.display_number}
                      </Link>
                    </td>
                    <td>
                      {a.scope_summary}
                      <small>
                        {a.work_order_display_number} · {a.site_name}
                      </small>
                    </td>
                    <td>
                      <VisitTime
                        start={a.start_at}
                        end={a.end_at}
                        zone={zone}
                      />
                    </td>
                    <td className="changes-attention">
                      {a.reasons.map((r) => policyImpactLabels[r]).join(" · ")}
                    </td>
                    <td>
                      {a.service_owner_name}
                      <small>No new task saved</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </RegisterTable>
            <details className="changes-policy-provenance">
              <summary>Comparison provenance</summary>
              <p>
                Published policy: {data.policy.id} · v{data.policy.version}
              </p>
              <p>Policy hash: {data.policy.content_hash}</p>
              <p>Scenario hash: {data.scenario.content_hash}</p>
              <p>
                Hashes identify compared content. They are not a publication
                receipt.
              </p>
            </details>
          </div>
        )}
        <details
          className="changes-policy-saved"
          open={["proposal", "review", "publication"].some((k) =>
            window.search.has(k),
          )}
        >
          <summary>Saved policy reviews, publication and holds</summary>
          <PolicyPublicationWorkspace />
          <PolicyHolds />
        </details>
      </section>
    </ChangesFrame>
  );
}
