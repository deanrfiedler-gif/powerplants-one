# Visit route and travel review — design reference

Stable entry: `scope:PL-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule/travel`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Review / comparison**. Canonical destination: `/schedule/travel`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Select one local day, timezone and permitted site. Choose a resource/crew member to review its ordered visits and anonymous busy intervals.
2. Check each site/customer, appointment time in site timezone, supplied customer window, travel-before/after allowance and recorded reason.
3. Review buffered gaps/overlaps, unavailable blocks and unknown route sufficiency. Select Earlier or Later to compare a manual sequence; booking times stay unchanged.
4. Use Review booking change to open PL-04 with the exact appointment, resource, day and timezone. Reset sequence comparison discards the analytical order.

No map, provider, inferred distance/speed, traffic or optimiser is configured. Planned travel allowance, unknown route estimate and actual field Travel are independent facts.

## Desktop

Show one local day, permitted site and resource filters, followed by separately ordered resource visits. Cards retain customer/site, site-time interval, supplied customer window, before/after allowances, reasons and buffered gaps/overlaps. Compare a manual order only after selecting one resource.

## Mobile

At 390 x 844 and 320 CSS px, use a vertical visit sequence with wrapping context and labelled Earlier/Later controls. The exact Review booking change link stays reachable; route estimate and actual field Travel remain visibly distinct from planned buffers. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

TravelWorkspaceScreen, travelSequences, shared WindowControls/ReviewSelect over business-ui fields/read states, Button/ButtonLink and SchedulingNavigation. No mapping or routing library is added.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: current permitted scheduling assignments and anonymous busy/block intervals. Outgoing: exact appointment/resource/day/timezone handover to PL-04. Sequence changes are browser-only comparisons; appointment times and reservations never change until the existing controlled workflow saves them.

## Visual references and verification

No exact page-specific retained HTML or accepted mockup exists. The native composition is proposed for owner visual review.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.
