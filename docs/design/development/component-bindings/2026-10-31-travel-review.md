# Travel review component consumers

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Route: `route:/schedule/travel`; scope: `scope:PL-05`. [Accepted design](../../../decisions/travel-review-figma-design.md). [Functional and visual evidence](../../../testing/evidence/scheduling-resources/travel-review.md). TravelReview is a page composition of existing controls; no standalone catalogue renderer or accepted shared route component is claimed.

## buttons

Earlier/Later compare local keys only; disabled boundaries, Reset comparison, Retry loading, Refresh visits and exact PL-04/planner handovers use existing controls. Keyboard uses native Tab/Enter/Space. Synthetic fixture includes two visits and reversal; writes are observed separately from URL navigation.

## fields

Permitted person, local day, IANA timezone and site retain native fields with accessible labels. Site filtering uses a native disclosure; the phone disclosure also holds timezone. Explicit person stays in the address. Default selection uses a conflict then signed-in actor/resource link; no name matching. Unknown/revoked selection clears the route. Synthetic fixture includes empty Pat, conflicting Casey and signed-in Riley.

## read-state

Loading, failed/denied refresh and stale reads withhold the route and summary. Retry refreshes current evidence; no cached route is labelled current. Empty assignments show one card and the planner link, without a route or summary, and do not certify availability. Synthetic delayed/failure responses are presentation challenges, not claims about production failures.

## status

Visit status uses the existing Status control. Warnings remain words, including exact block/closure kind and interval on affected booked segments; colour is supplemental. Fixture closure and zero-minute edge cases have separate unit proof.

## planner

Travel bands reuse the planner's tl-travel colour with page-local flow positioning, height and padding. No planner rules or shared CSS root lists change. Depot endpoints stay not supplied; synthetic frame-specific names are never substituted for missing source facts.

## application-shell

The existing Scheduling navigation remains. The shared phone-header API supplies Travel review and shortens it to Travel at 320 px; no shell source is changed. The page heading remains available to assistive technology through the shared register heading variant.

## Desktop

Route and 300 px day summary sit side by side, reducing the summary width at tablet sizes. Existing Scheduling navigation remains until Service planner moves it. Source and acceptance differences are in the evidence record.

## Mobile

One route scroll, then summary; Earlier/Later share a row and Review booking change occupies the next. At 320 px title and visit header wrap. Browser emulation does not grant physical-device or visual acceptance.
