# Saved-estimate review implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 3 October 2026. Source implementation and automated evidence are separate from owner/visual/device acceptance, merge and deployment.

## Reconciliation and delivered increment

Started from fetched `origin/main` `6e8b898` after #337, with no open PRs, in the isolated managed worktree `codex/estimating-review`. Main now includes scheduling 0053/0054, inspections 0055, incidents 0056 and response evidence 0057. Older Estimating handover statements ending at 0044 or proposing 0045 are historical; cost sources are integrated at 0048. Reserved 0051/0052 remain untouched.

ES-04 now has the native `/estimating/estimates/[id]/review` page, exact current-revision submission, separately scoped completeness/source-price/technical decisions, immutable returned findings, attributable correction responses and successor submission. Earlier unchanged decisions remain explicitly linked to their original evidence. Changes invalidate only the applicable fingerprints. Reviewed is separate from commercial approval, which remains Not configured. The existing saved-estimate page links the review and now honours exact `version_id` entry links so history opens its original cost version.

Migration/seed 0058 and the migration/grant/access-review consumers are updated together. The original Estimate identity remains the receipt target. Recovery checks current authority for the original revision/duty and retains the original command after a lost response. E1 output and all existing specialist/cost-source identities remain unchanged. The [contract](../contracts/estimating-review.md) and [decision](../decisions/estimating-review-native.md) specify the bounds.

## Verification ledger

Local runtime: Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and repository-pinned Playwright/Chrome. A task-owned loopback PostgreSQL instance contains only `ppo_synthetic_test`; unrelated checkouts, databases and worktrees are preserved. Live 0057 constraints were inspected before allocating 0058. Private configuration, logs and exact output bytes remain outside Git.

Validation source: `8e3d348` ([PR #338](https://github.com/deanrfiedler-gif/powerplants-one/pull/338)). Documentation-only evidence follow-up does not alter runtime source. All commands ran from the contribution checkout with task-owned configuration outside Git.

| Check | Executed result |
|---|---|
| `node --import tsx --test tests/unit/estimating-review.test.ts tests/unit/estimating.test.ts tests/unit/estimating-sources.test.ts tests/unit/migration-registry.test.ts` | 15 passed |
| `npm run build` | Production compilation, TypeScript and static generation passed |
| `npm run lint` | Passed |
| New database suite `tests/database/estimating-review.test.ts` | Final six cases passed, including original recovery, concurrent submission/decision, independent duty/current entity access, immutable originals, correction responses, price-only applicability, stale observed source refusal, duplicate current submission refusal and injected late-failure rollback |
| Compiled HTTP: `estimating-review.test.ts`, `estimating.test.ts`, `estimating-sources.test.ts` | Seven passed on the actual compiled server |
| `npx playwright test --config=playwright.compiled.config.ts tests/browser/estimating-review.spec.ts tests/browser/estimating.spec.ts tests/browser/estimating-sources.spec.ts` | 25 passed (24 desktop/mobile cases plus route warm-up); includes 320px, retained stale proposals, lost submission/decision responses, inconclusive receipt lookup, exact retry, changed identities, historical links and E1/source regressions |
| `scripts/estimating-review-restart.ts write` → actual application and PostgreSQL restart → `verify` | Passed: distinct PostgreSQL start time, exact retained rows, four original review receipt replays and byte-identical original Draft HTML/PDF |
| Foundation, prototype and naming | Passed; preserved 78 parent IDs and issued references; project instructions 7,995 characters |
| `npm run studio:check` | Passed: 327 entries, 173 routes, 34 components, 19 runnable component fixtures. Review and owner acceptance remain pending |
| AD-01 model/browser checks | 107 model cases and 40 pinned-Chrome browser groups passed with the 108-capability contract |
| Broader database/upgrade | All 73 cases covered: 64 passed initially and nine reset-blocked cases passed after the documented test-only lock-capacity correction. This includes E1, discovery, sources, ES-04, field timers, policy persistence, Leads/Projects, Quality and hosted-upgrade simulation. The six final ES-04 cases separately reran against the final basis guard |
| Additional exact-ledger consumers | Seven focused upgrade cases passed across field, Finance, offline, packs, planner and reports suites |
| Original source CI | At `0e3e54f`, [Application run 37100584107](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37100584107/job/111139157139) passed 695 of 696 database cases. FI07-07 failed because its 0056 upgrade snapshot did not allow the five seed-58 grants or migration 0058. The dependent aggregate check also failed. This supersedes the earlier in-progress capture; the original failure remains retained |

An initial additional test instance used Windows' default WIN1252 encoding. Fixture seeding failed with `22P05` for an existing Unicode arrow; a pristine detached `origin/main` (`6e8b898`) reproduced the same failure. Recreating that disposable test database as UTF-8 allowed all six final ES-04 cases to pass. A separate broad run used PostgreSQL's default 64 lock slots and failed a full-schema reset with `53200`; unchanged `origin/main` reproduced that reset failure. The task-owned test instance was restarted with `max_locks_per_transaction=256`, matching `scripts/configure-test-postgres.sh`; all nine affected checks then passed. No application assertion was relaxed. An initial HTTP launch ran before the server became ready; the readiness-checked run passed all seven cases. Earlier new-test locator/type errors were corrected before the final compiled and database runs.

[Two original viewport captures and their provenance](../testing/evidence/estimating-review/manifest.json) retain agent-inspected desktop and 320px evidence. They show readable, unclipped native content, not the entire scrollable record. Exact native accepted reference images remain unavailable; UUID-heavy attribution, physical-device, 200% ES-04 zoom and screen-reader acceptance remain open. No review fingerprint is promoted. The broad command used `node --env-file=<private-test-config> --import tsx --test --test-concurrency=1 --test-timeout=120000` with the nine suites named above. The seven additional suites used the unchanged `upgrade|arrival after already-applied` name filter; only the nine reset-blocked cases were rerun after the test-instance correction. Private logs, PostgreSQL files and output checkpoints remain outside Git; automated CI uploads its own synthetic evidence.

## PR #338 assurance repair

The FI07-07 failure reproduced locally on the unchanged PR head. This was an omitted cross-module upgrade expectation in this contribution, not a baseline or application failure. The corrected test preserves every earlier grant including its ID and validity, asserts exactly the five seed-58 additions using the existing explicit fixture expectation, and still compares all original users, business records, responses, receipts and issued HTML/PDF bytes. It now checks the exact added migration versions `[57, 58]` and seed version `[58]`, retains all previous ledger rows, and compares the first upgrade with a second migration/seed run. Generated grant IDs alone are excluded from comparison of new rows; timestamps and scope remain checked. No application, seed, migration, permission or issued output is changed by this repair.

The entire `tests/database/field-customer-response.test.ts` suite passes **9/9** locally with the same isolated PostgreSQL/renderer configuration; the originally failing populated upgrade passes. TypeScript and full ESLint pass. `AGENTS.md` now includes this cross-module consumer in the migration, grant and user checklist. Foundation, prototype, naming and studio checks also pass; all 78 parent IDs and 22 issued sources remain intact. Fresh final-head CI remains pending and is separate from these local results. After repair commit `a1cb353`, GitHub reported a `docs/STATUS.md` conflict with newer main and therefore scheduled no PR checks. Reconciliation retains both ES-04 and the merged Field Work status from `8c14233`; it does not merge the contribution PR. Refreshed main is `8c14233` after #339; its FI07 test has the same earlier expectations. PR #340 must additionally account for its own seed/migration 0059, thirteen grants and two users.

## Subsequent compiled Scheduling failure

At `6ba8b1e`, the isolated mobile Scheduling successor journey failed heading focus. The code/test are unchanged from current main; ordinary main replays passed three times, while deliberately delaying the separate current-head read reproduced the same failure. The repair retains the explicit focus request until the permitted form mounts and preserves typing/repeated-Edit behaviour. [Original CI artifact, unchanged-main comparison and exact checks](../testing/evidence/scheduling-successor-focus/README.md) remain separate from the earlier FI07 repair and final-head CI. The policy-impact guide, page and component bindings are maintained with the fix; no schema, command authority or issued bytes change.

## Remaining programme and decisions

| Scope | Current reconciliation and next concrete work |
|---|---|
| ES-05 | Extend the existing DraftQuote/revision/renderer; exact terms, recipient/options/template binding, commercial approval, issue and synthetic distribution must remain separate. The user has delegated synthetic policy selection: the next increment will record separate local preparer, approver and issuer duties, no self-approval, and a versioned demonstration template with no commercial validity. Real operative terms and thresholds remain Not configured. ES-04 itself grants no commercial authority. |
| ES-06 | Exact issued-offer response and controlled successor negotiation follow ES-05; no acceptance may transfer to changed content. |
| ES-07 | Accepted exact issue, exceptional item/target-line review and independently received Sales/Projects/Service handover precede idempotent conversion. No MYOB endpoint or write authority is established. |
| Excel import | `tmp/estimating-excel-import` / `feat/estimating-excel-import` retains its uncommitted package pins, native ADR and `src/estimating/import` parser work. Do not overwrite or duplicate it. Reconcile that branch with current main, verify its bounded OOXML/parser dependencies and contract fixtures, then add controlled upload, immutable source retention, full validation/rejected-line review, section/provenance sidecars and reviewed estimate creation. Allocate storage/migration only after that reconciliation. Manual review needs none of it. |
| ES-02 | Five-step structured discovery, multiple areas/systems, historical definitions and saved-cost guards already exist. Category/family adoption and usability proposals need a current-code finding and explicit adoption evidence before changes; no historical configuration is relabelled. |
| ES-08 | Retained accepted geometry programme begins at WP-G00: reconcile current specialist schemas, source/axis mapping, live constraints and concurrent work. No competing geometry contribution was found. The new review sidecar does not change recovered quantities; geometry studies remain distinct from authoritative calculation. |
| ES-09/10 | Subsequent estimate-to-actual comparisons, reference cases and calibration need reliable comparable evidence and separate proposal review. |
| ES-01/03 | Preserve delivered workload, versioned sources and refresh. The demonstrated exact-history link gap is fixed here; no rebuild of those workspaces. |

No merge, deployment, external message, production integration or business transaction is included. MYOB, SharePoint and native CAD retain their boundaries. Owner/device/screen-reader/visual review and commercial policy are still open.
