# AD-01 access-request evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded local verification complete; CI, visual/owner acceptance and deployment separate.

## Scope and exact source

[Decision](../../../decisions/access-change-requests.md). Branch codex/ad01-access-requests continues PR #414 at 35435a34bb642dcbf64832a28c7599a8224f4c2d. Application/build source: **66aece17c8dc5436c729020dc2cd44876926933e**. Browser harness correction: **62b3da1961fcf683ee4d8f52792f30d4f1d0defd**. Hosted-boundary assertion: **32bd8fe**. Quotation-upgrade assertion correction: **08fc1671467714a1d28e2892a5c626f0a1f1eb61**. LC-15 original-ledger correction: **cb6b0ccf9db22c1e42430bdc9d3c610db065f9cd**. Later delivery edits contain evidence/register updates only.

Local synthetic single-add requests and independent Approved/Returned decisions persist exact audit-linked history and actor-bound receipts. Migration/seed 0079 adds three explicit Workspace duties to two existing local identities; no new user or hosted duty. No request or decision changes an effective grant. Applying access, administrative proposals, external messages, team membership and review campaigns remain outside this increment.

## Executed checks

| Check | Result and limits |
|---|---|
| Compiled application | Build and application type check pass; [output](build.txt). No package/dependency, hosting or deployment change. |
| Request database proof | All 14 checks pass in [upgrade first pass](upgrade-first-pass.txt): fresh/populated preservation, exact three duties, repeat seed/migration, current authority, independent named reviewer, future/expired/local/hosted limits, exact scope, duplicate grants/requests, unchanged operation replay, conflicting payload, actor-bound receipt, working-company refusal, stale/concurrent decisions, late grant/start refusal, immutable audit evidence and unchanged users/grants. |
| Wider upgrade run | The first 26-check run passed 24; ES-06/ES-07 still expected only seed 78 in a shared test helper. The helper now requires exact seed 78/79 IDs, scopes and ledgers while retaining every original row. The [helper rerun](upgrade-helper-rerun.txt) passes both quotation cases and the hosted boundary, but exposed an LC-15 ledger slice that still excluded four rather than five new migrations. After correcting that count, the [final LC-15 check](lc15-final.txt) passes, preserving every original ledger row and requiring exact added versions 75–79. |
| Clean main comparison | Both original quotation upgrade cases and LC-15 pass on unmodified main ba1f4e3 in the same task-owned PostgreSQL environment; [quotation baseline](main-baseline.txt), [LC-15 baseline](main-lc15-baseline.txt). The failures were new-grant and migration-count assertions, not loss of original records. |
| Earlier regression | [47 checks passed](intermediate-database.txt), including all existing AD-01 inspection, nine Products historical/reserved-0052 upgrade paths and three Finance preservation cases. This intermediate run precedes the final additional receipt-integrity/late-approval proof; it is not substituted for the final request checks. |
| Native browser | [33 checks pass](browser.txt) in compiled Chrome at 1440×960, 390×844 and 320×740. Includes submit/reopen/Return, lost committed-response recovery after reload, approval without grant changes, concurrent stale refusal, denied-context clearing and prior AD-01 inspection/comparison regressions. |
| Source/navigation | [18 checks pass](unit.txt). The two nested request routes resolve before the generic person route. |
| Retained design | [107 model checks](design-model.json) and [40 browser checks](design-browser.json) pass against the regenerated 134-capability working HTML. Issued reference bytes remain unchanged. These preview checks do not prove native enforcement. |
| Assurance | Changed-source ESLint, studio, foundation, naming and prototype checks pass. Register: 358 entries / 204 routes; 330 unreviewed, 28 stale and 41 component reviews pending. No accepted fingerprint is assigned. |

Commands use Node 24.21.0, PostgreSQL 16 and Chrome 155.0.8059.40. Database tests use only `ppo_synthetic_test`; compiled browser fixtures use the separate task-owned synthetic application database. Configuration and connection strings remain outside Git. Console outputs retain their content with LF endings and trailing whitespace/blank lines removed; `checks.json` records their committed-text hashes. `captures.json` binds every image to its source, viewport and exact bytes.

## Retained failed attempts

The [initial migration run](initial-migration-failure.txt) failed on a CASE expression needing parentheses; subsequent cases could not use the unapplied migration. The [next run](initial-hosted-fixture-failure.txt) exposed a test that tried a hosted issuer before installing the hosted identity fixture; 11 checks passed and two failed including the parent group. Both were corrected before the final request proof.

The [initial browser run](initial-browser-harness-failures.txt) passed 27 and failed six: pending recovery controls appear while a command is still in flight, so the loss interceptor must finish before teardown; the error selector must be scoped to main to exclude Next.js's announcer. The corrected run waits for an enabled retry and the completed interception, retaining the same committed request. No application change was needed for these failures. The stale quotation and LC-15 expectations remain visible in their original logs rather than being relabelled successful.

## Visual observations and remaining review

Twelve [source-bound captures](captures.json) compare native proposal, Submitted review and Approved states with the working Access changes reference at matching widths. The implementer inspected representative desktop, phone and narrow images. Native controls stack, long record identities wrap, and no page-wide overflow was found. Long closed-select labels can truncate; the saved review repeats the exact capability and company key. History and later form fields remain reachable by scrolling on phones.

The retained page has an in-page request list/inspector, Draft editing, generated ACR preview references and simulated apply. The native adaptation uses a register/form and separate UUID record, one immutable addition and a named independent decision. Broader edit/apply/review controls are explicitly absent. These are proposed layout adaptations, not an accepted visual match. Accepted native/mobile mockup images are missing. Physical-device, zoom, screen-reader, independent security and owner visual acceptance remain open. D-020 operational policy and deployment are separate.
