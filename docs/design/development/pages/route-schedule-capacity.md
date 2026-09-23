# Cross-domain resource demand and capacity — design contract

Stable entry: `route:/schedule/capacity`. Owner: Dean Fiedler. Status: **Draft for visual review**.

## S1–S5 native implementation

Page type: **Review / comparison**. Canonical destination: `/schedule/capacity`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select a 7-, 28- or 90-day horizon, display timezone and permitted site. Review each source domain’s completeness or Unavailable state.
2. Filter by domain, source commitment, resource mapping, required skill or unknown effort. Unknown resource/skill filters explicitly retain missing mappings.
3. Review source references, UUIDs, versions/as-at, customer/site context, owner, time basis and next action. Follow the exact owning-domain link for resolution.
4. Exclude contributions from an analytical scenario and compare its count and reserved resource minutes against the visible baseline. Reset or refresh discards the scenario.

Project programme dates and Engineering required dates never become labour effort. Service reservations include crew and explicit buffers; they are not labour estimates. No utilisation denominator or percentage is claimed.

## Desktop

Toolbar wraps; PL-04 queue and comparison sit beside the exact record. PL-03/PL-05 use readable evidence cards.

## Mobile

Stack filters, queue/detail and current/proposed sections; preserve words, UUID context and reachable actions. The shared shell owns vertical scrolling. Use 1440 × 960, 1024 × 768, 390 × 844, 320 CSS px and 200% zoom for review.

Reuse: current shell, business-ui Field/SelectField/ReadState/Stamp, Button/ButtonLink, existing PlannerBoard and RequestDecision controls. Incoming: current scoped source/version evidence. Outgoing: existing owning-domain commands and exact PL-04 handovers; scenarios do not mutate.

No exact page-specific retained HTML or accepted mockup exists. The new composition is proposed for owner visual review.

[Executed evidence and remaining review](../../../testing/evidence/scheduling-resources/README.md). Application images are pending until that index identifies inspected captures. No review fingerprint or owner acceptance is created by this edit.
