# Lead continuity execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Review: synthetic functional checks and two conversion-form captures inspected; paired visual, owner, physical-device and screen-reader acceptance pending.

Implementation: `0a3f191`, based on Maintenance PR #357 at `e17aca5` including main #356. Checks exercised the working implementation before formatting-only and evidence commits. They do not establish final-head CI, merge, deployment or the completion of the full [lead-to-delivery programme](../../../contracts/lead-to-delivery-continuity.md).

## Result and environment

LC-11 resolves the previous conversion refusal when follow-up was recorded before the Site was known. Exact source-activity comparisons retain the original scoped obligations and create an explicitly owned, dated RelationshipReview on the new Deal. Both records expose the review and current source status. The original command without the additive review retains its prior incompatibility refusal and hash shape. There is no migration, seed, new capability or external business effect.

Windows, Node 24.21.0, PostgreSQL 16, isolated disposable `ppo_synthetic_test`, loopback compiled application, Playwright 1.63.0 and Chrome 154.0.8037.98. Private connection settings and reset fixtures remain outside version control. [Manifest](manifest.json) records exact retained bytes.

| Check | Observed result |
|---|---|
| `tests/database/leads-continuity.test.ts` and complete existing `leads.test.ts` | 13/13 pass under the unchanged 120-second per-test limit |
| Complete compiled `tests/browser/leads.spec.ts`, desktop and phone, without warm-up dependency | 9 pass; one retained desktop-only test skipped on phone |
| `tests/unit/leads-validation.test.ts` | 3/3 pass |
| Build, TypeScript, lint | Pass |
| Foundation, prototype, naming, studio | Pass; all 344 page and 39 component reviews remain pending |

The new database cases cover exact retained source rows, changed membership/version, required owned/dated review, incompatible carrying, current permission revocation, restricted historical disclosure, original receipt lookup/replay, simultaneous identical retries, competing intent and late outbox failure with complete rollback. The existing LC-04 tests still prove competing conversion intents create only one Deal. Browser cases exercise HTTP, actual controls, source context selection, original-response loss/recovery, reload and the Deal's source follow-up. No additional standalone HTTP suite or application/PostgreSQL stop/start was run for this increment; those are not implied by browser reload or the existing test's fresh-process read.

## Captures

The agent inspected [desktop conversion](desktop-lead-site-review.png) and [phone conversion](mobile-lead-site-review.png). Labels and long review text wrap, the review owner is explicit, the required date is reachable and the footer stays visible. [Desktop Deal](desktop-deal-retained-lead-follow-up.png) and [phone Deal](mobile-deal-retained-lead-follow-up.png) are automated captures, not separately visually reviewed. Existing tests also cover 320 px modal/reflow behavior; the new LC-11 journey itself ran at 1440 and 390 px. The exact new review mockup is missing, so no paired-source acceptance or review fingerprint was assigned.

## Earlier failures retained

The first database execution passed the new happy path, then database reset exhausted PostgreSQL's default lock budget (`out of shared memory`, `max_locks_per_transaction`). The task-owned disposable cluster was configured with 512 locks per transaction and restarted. The complete 13-case rerun passed. This was a local fixture configuration failure, not an application regression claim.

The first browser execution failed because the new test used an exact label locator for a native select; the accessible combobox was present and disabled. The locator now uses its role/name. Its failed, unconverted fixture also matched the existing desktop table's shared title, so the new fixture now uses a unique title. The complete rerun passed. Deliberately aborting the accepted conversion response produces the expected `net::ERR_FAILED` console entry; recovery proves that no second conversion POST is sent.

Raw earlier and corrected logs are retained separately. Source presence, these checks, CI, human review and deployment remain separate facts. Prospect creation/return, accountable Lead ownership/context correction, accepted estimating brief binding, exact quotation/outcome links and native receiving remain subsequent programme increments.
