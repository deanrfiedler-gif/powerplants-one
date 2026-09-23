# Visit route and travel review — design contract

Stable entry: `route:/schedule/travel`. Owner: Dean Fiedler. Status: **Draft for visual review**.

## S1–S5 native implementation

Page type: **Review / comparison**. Canonical destination: `/schedule/travel`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select one local day, timezone and permitted site. Choose a resource/crew member to review its ordered visits and anonymous busy intervals.
2. Check each site/customer, appointment time in site timezone, supplied customer window, travel-before/after allowance and recorded reason.
3. Review buffered gaps/overlaps, unavailable blocks and unknown route sufficiency. Select Earlier or Later to compare a manual sequence; booking times stay unchanged.
4. Use Review booking change to open PL-04 with the exact appointment, resource, day and timezone. Reset sequence comparison discards the analytical order.

No map, provider, inferred distance/speed, traffic or optimiser is configured. Planned travel allowance, unknown route estimate and actual field Travel are independent facts.

## Desktop

Toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards.

## Mobile

Stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
