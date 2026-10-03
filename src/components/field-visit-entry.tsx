"use client";
import { ButtonLink } from "./ui/button";
import { Stamp, Status } from "./business-ui";
import { visitPreparationGuidance } from "../field/visit-guidance";
import type { Job } from "./field-screens";

export function FieldVisitEntry({
  navigation,
}: {
  navigation: NonNullable<Job["visit_navigation"]>;
}) {
  return (
    <section
      className="business-card field-visit-entry"
      aria-labelledby="further-attendance"
    >
      <h2 id="further-attendance">Further attendance</h2>
      <p>
        Service must review outstanding work and choose an appropriate separate
        visit. Earlier attendance, customer responses and pack acknowledgements
        stay with their original records.
      </p>
      <ButtonLink href={navigation.work_order_href} variant="secondary">
        {navigation.can_propose
          ? "Review visits / prepare a proposal"
          : "Review work-order visits"}
      </ButtonLink>
      {!navigation.can_propose && (
        <p>
          You can review permitted records. Ask the Service owner to prepare
          further attendance; this view grants no preparation or scheduling
          authority.
        </p>
      )}
      <h3>Other visits on this work order</h3>
      <p>
        Recent permitted records only. A shared work order does not establish a
        return or replacement relationship. Confirm suitability with Service
        before using an existing proposal.
      </p>
      {!navigation.visits.length && (
        <p>
          No other accessible visit is shown. Use the permitted work-order
          record or ask the Service owner; do not record another arrival here.
        </p>
      )}
      {navigation.visits.map((v) => (
        <article className="field-task" key={v.id}>
          <h4>{v.reference}</h4>
          <Status value={v.status} />
          <p>
            <Stamp value={v.start_at} timezone={v.site_timezone} /> –{" "}
            <Stamp value={v.end_at} timezone={v.site_timezone} /> ·{" "}
            {v.site_timezone}
          </p>
          <p>
            Preparation: {v.preparation_status} · Customer date agreement:{" "}
            {v.customer_commitment}
          </p>
          <p>
            {visitPreparationGuidance(
              v.status,
              v.preparation_status,
              v.scope_review_required,
            )}
          </p>
          <div className="actions">
            <ButtonLink href={v.appointment_href} variant="secondary">
              Review appointment {v.reference}
            </ButtonLink>
            {v.field_href && (
              <ButtonLink href={v.field_href} variant="secondary">
                Open my assigned job {v.reference}
              </ButtonLink>
            )}
          </div>
        </article>
      ))}
      <p>
        Opening a record does not authorise work. Preparation, booking, customer
        agreement, assignment, competency, readiness, pack issue, personal
        acknowledgement and actual arrival remain separate.
      </p>
    </section>
  );
}
