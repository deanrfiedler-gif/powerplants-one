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

Accepted design: the [Travel review design decision](../../../decisions/travel-review-figma-design.md) of 18 October 2026, with captures 01–02 (desktop 1440 × 900) and 03 (tablet 1024) in [design r01](../../../reference/ui/service/travel-review-design-r01/README.md).

- **Route:** one person's day as stops, travel legs and visits in time order, from leaving the depot to returning (D1). Each leg shows its minutes, from and to, and its basis in the planner's travel tint; each visit card keeps its times, appointment and work order, site, crew, customer window, Earlier, Later and Review booking change.
- **Route estimate:** "Unknown" with no provider set up, and no map (Q1). Planned travel allowances, the route estimate and actual field travel stay separate.
- **Day summary:** visits, planned travel, gaps, issues, route estimate, busy intervals and availability blocks in one panel, with Compare another order and Reset comparison (D2).
- **Comparing an order:** each card shows its original and compared position, gaps are not recalculated, a reversal of booked times says a controlled move is needed, and Reset comparison is enabled only while comparing (D3).
- **Conflicts:** an availability block or calendar closure is named in words on the leg or visit it overlaps (D4).
- **Default:** one person, the first with a conflict or the signed-in technician, not All permitted resources (Q2).
- **Shell:** the proposed Conversations action sits left of the information icon.
- Nothing new is built.

Show one local day, permitted site and resource filters, followed by separately ordered resource visits. Cards retain customer/site, site-time interval, supplied customer window, before/after allowances, reasons and buffered gaps/overlaps. Compare a manual order only after selecting one resource.

## Mobile

Accepted design: captures 04–06 in [design r01](../../../reference/ui/service/travel-review-design-r01/README.md). The same route as one scroll with the day summary below it; Earlier and Later on one row and Review booking change on the next. At 320 px the title is "Travel" and each visit's top row wraps (D5). Two states: no assigned visits, with Open the planner; could not load, with no route shown and Retry loading.

At 390 x 844 and 320 CSS px, use a vertical visit sequence with wrapping context and labelled Earlier/Later controls. The exact Review booking change link stays reachable; route estimate and actual field Travel remain visibly distinct from planned buffers. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

TravelWorkspaceScreen, travelSequences, shared WindowControls/ReviewSelect over business-ui fields/read states, Button/ButtonLink and SchedulingNavigation. No mapping or routing library is added.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: current permitted scheduling assignments and anonymous busy/block intervals. Outgoing: exact appointment/resource/day/timezone handover to PL-04. Sequence changes are browser-only comparisons; appointment times and reservations never change until the existing controlled workflow saves them.

## Visual references and verification

Accepted Figma design: [Travel review design r01 captures](../../../reference/ui/service/travel-review-design-r01/README.md) (six icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/travel-review-figma-design.md). Images of all permitted resources at once, an overlap between reservations, the site filter note, denied access, the loading state, desktop and tablet states and 200% zoom are still missing.

No exact page-specific retained HTML or accepted mockup exists. The native composition is proposed for owner visual review.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Resource selection survives reload. Travel review flags calendar closures as well as availability blocks against the complete buffered reservation, using exclusive end boundaries. Displayed gap figures are explicitly the original schedule when comparing a manual order. A site-filter warning explains omitted visits; the change handover retains exact site/resource/appointment/day/timezone. No routing estimate or booking mutation is introduced.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## NAV contextual navigation

Travel review has a specific breadcrumb. Retain existing day/timezone/site/resource context and source checks.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
