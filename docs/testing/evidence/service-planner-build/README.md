# Service planner accepted design implementation evidence

<!-- versioning: git; committed history is authoritative -->

Scope: PL-01, route:/schedule; SVC-03, SVC-04 and SCM-08. Owner: Dean Fiedler. Builder: Codex. Draft PR #808. Accepted source: [design decision](../../../decisions/service-planner-figma-design.md) and [icon-free captures](../../../reference/ui/service/service-planner-design-r01/README.md). Synthetic fixtures only.

## Functional proof

Validation in progress. Focused planner/working-hours/workspace units: 24 passed. Chrome 156.0.8078.80 passes the runtime/PDF check. Real npm ci completed with Node 24.22.2 and npm 11.19.0, no engine override or junction. Dedicated local app port 3818; dedicated PostgreSQL test cluster port 5648. Typecheck, lint, studio:check, foundation, naming, prototype and status checks passed during development; final checks after subsequent refinements remain required.

The original focused database run exceeded the unchanged 120-second deadline. An unchanged-main test (`SV04 detail projects…`, base `1402c87b`) reproduced that timeout. A second run timed out in the retained read/access test, then failed in the new test’s reset hook with the native 3-second connection timeout. The supplemental run of the exact new hold assertions, after separate native migrate/seed and with permission grants restored in finally, passed in 4679 ms. That verifies the current gate values, bounded fields and revoked pack access; it does not turn the official database suite green.

The first browser run failed at sign-in while the database test reset the same fixtures. The server was stopped, native setup restored and later runs are serialized. HTTP, scheduling/P-series browser proof and application visual comparison remain in progress. No unexecuted check is claimed as passing.

## Visual comparison and differences

The accepted Day, move dialog and phone sheet references were inspected before implementation. Application capture comparison at 1440×960, 1024, 390 and 320 is pending. No visual acceptance is claimed.

- On hold contains current filtered held visits. Native work orders have only Draft and Authorised states, so the design's typed held-order causes and release dates cannot be presented truthfully. Missing evidence stays reason unavailable. Source corrections appear on a fresh read; there is no invented timed automatic return.
- Gate reasons are verbatim and may be longer than the frames. One Review appointment link is the action, using existing source-owned controls. Suggestions are excluded.
- Existing policy preparation, reviewed versions, complete crew/travel and uncertain-save recovery remain in the forms, making them longer than the compact compositions. No rule or endpoint is added.
- Existing Appointment state and alternate-timezone list support remain. Retained synthetic seeds differ in labels/counts from the design story; native fallback icons replace Pro artwork.
- Historical 9 October owner review is stale. Its date, reviewer and fingerprint are preserved; these changes grant no new review.

## Acceptance and deployment

Functional proof and visual inspection are separate from owner/device/screen-reader acceptance. Owner acceptance of this implementation is pending. Deployment not performed. Exact-head Claude review and all CONTRIBUTING merge gates remain required.
