# Resource detail — design contract

Stable entry: `route:/service/technicians/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.

## S1–S5 native implementation

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians/[id]`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

## Desktop

Toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards.

## Mobile

Stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
