# Visit route and travel review — design reference

Stable entry: `scope:PL-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/schedule/travel`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Review / comparison**. Canonical destination: `/schedule/travel`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Choose a local day, timezone and permitted site. An explicit permitted person is retained; otherwise the first person with a reservation or availability conflict is selected, then the signed-in technician, then the first permitted person if no technician link exists.
2. Read each travel allowance, its basis, source endpoints and named block or closure on the affected leg or visit. Missing depot details stay not supplied.
3. Use Earlier or Later to compare another order. Booked times stay unchanged, gaps are not recalculated and a time reversal needs a controlled move.
4. Reset comparison discards the analytical order. Review booking change opens PL-04 with the exact appointment, person, day, timezone and optional site.

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
- The route implementation follows D1–D5 and Q1/Q2; [current proof and differences](../../../testing/evidence/scheduling-resources/travel-review.md) remain separate from owner acceptance.

Show one local day, permitted site and one person. The current Scheduling navigation is retained pending the separate Service planner build. Depot identity is not supplied by the source; display that absence and identify allowance boundaries rather than assert a routed journey.

## Mobile

Accepted design: captures 04–06 in [design r01](../../../reference/ui/service/travel-review-design-r01/README.md). The same route as one scroll with the day summary below it; Earlier and Later on one row and Review booking change on the next. At 320 px the title is "Travel" and each visit's top row wraps (D5). Two states: no assigned visits, with Open the planner; could not load, with no route shown and Retry loading.

At 390 x 844 and 320 CSS px, use a vertical visit sequence with wrapping context and labelled Earlier/Later controls. The exact Review booking change link stays reachable; route estimate and actual field Travel remain visibly distinct from planned buffers. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

TravelWorkspaceScreen, TravelReview, travelSequences and travelAvailabilityConflicts; TravelWindowControls over shared business-ui fields/read states, Status, Button/ButtonLink and SchedulingNavigation. The route legs reuse the planner tl-travel colour with page-local positioning. [Component bindings](../component-bindings/2026-10-31-travel-review.md) describe fixtures and limitations. No mapping or routing library is added.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: current permitted scheduling assignments and anonymous busy/block intervals. Outgoing: exact appointment/resource/day/timezone handover to PL-04. Sequence changes are browser-only comparisons; appointment times and reservations never change until the existing controlled workflow saves them.

## Visual references and verification

Accepted Figma design: [Travel review design r01 captures](../../../reference/ui/service/travel-review-design-r01/README.md) (six icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/travel-review-figma-design.md). Native route, comparison, summary, empty and failed/denied captures at 1440, 1024, 390 and 320 px are linked in the [Travel evidence](../../../testing/evidence/scheduling-resources/travel-review.md). Dedicated reservation-overlap, active-site-filter, loading and native-browser 200% zoom captures remain missing. This design starts on one person; an all-person route is not implemented.

No page-specific retained HTML exists. Accepted mockups are the six r01 captures above; current implementation comparison remains unaccepted.

[Executed checks, inspected captures and remaining review](../../../testing/evidence/scheduling-resources/README.md) identify the exact evidence. Draft guides, source presence, functional proof, owner visual acceptance and deployment remain separate. No review fingerprint is adopted by this edit.

## Post-merge refinement

Resource selection survives reload. Travel review flags calendar closures as well as availability blocks against the complete buffered reservation, using exclusive end boundaries. The baseline shows original buffered gaps; comparison says Not recalculated and does not relocate those gap figures. A site-filter warning explains omitted visits; the change handover retains exact site/resource/appointment/day/timezone. No routing estimate or booking mutation is introduced.

[Refinement verification](../../../testing/evidence/scheduling-refinement/README.md) records actual checks and review limits. Visual status remains Needs review; no fingerprint is adopted.

## NAV contextual navigation

Travel review has a specific breadcrumb. Retain existing day/timezone/site/resource context and source checks.

The retained shell and its navigation differences are recorded in the Travel evidence. Desktop retains the primary rail and horizontal Scheduling links; mobile retains the four-item bar with Schedule active; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
