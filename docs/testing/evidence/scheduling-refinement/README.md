# Scheduling refinement — verification evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 24 September 2026 · **Review:** implementation verification recorded; owner acceptance pending.

Refreshed base: `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. PR #310 already merged S1–S5 at `3040387`. Its retained [programme evidence](../scheduling-resources/README.md) remains historical evidence, not a claim that those tests were rerun here.

This follow-up corrects multi-day calendar-closure display, travel closure warnings, cancelled follow-up classification and restorable scheduling context. Field Team honours incoming date/site/timezone; resource detail returns that context. No API, migration, permission, source editor, provider or command authority changes.

## Environment and execution

Isolated worktree `tmp/scheduling-resources-refinement`, branch `feat/scheduling-resources-refinement`. Verified runtime and final browser tests: `1bce81239a6ba0982201985ba9b40061c9f2f50c`. Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, maintained Chrome 154.0.8037.58 / Playwright 1.63.0. Own disposable `ppo_synthetic_test` clusters on loopback ports 55536 (database regressions) and 55537 (browser fixtures); compiled application preview port 3156. Existing worktrees and databases are untouched. Copied locked dependencies match `npm ls --depth=0`; no dependency version changes.

Windows sandbox refused PostgreSQL process startup and the TypeScript runner's user-context lookup before tests executed. Both ran through the authorised tool escalation; no sandbox, runtime or application guard was disabled.

## Executed results

| Check | Actual result |
|---|---|
| Focused scheduling-workspaces and planner-time units | 11 passed, 0 failed |
| Planner, Quality/Planner, demand and scheduling-workspaces database suites | One complete run: 34 passed, 0 failed, 1,528.8 seconds |
| Existing compiled scheduling-workspaces, planner, pl01 and field-technicians browser cases | All 36 passed on desktop/phone; route warm-up also passed (519 routes, 0 unreachable) |
| New scheduling-refinement browser cases | Final focused run: 10 passed, 0 failed, 1.8 minutes |
| Initial combined browser run | 45 passed, 2 failed, 11.0 minutes. Both failures were the new Field Team select locator; corrected before the final ten-case run |
| Required `npm run check` | Studio, lint and TypeScript passed. Units: 426 total, 422 passed, 4 failed. Chain stopped before build; **the command is not green** |
| Untouched current-main comparison | 7 cases: 3 passed, the same 4 failed; base `0f10b7f`, no source changes |
| Separate `npm run build` | Passed on the verified runtime; all six affected routes compiled |
| Foundation / prototype / naming / studio checks | Passed; 78 parent requirements retained; studio: 309 entries, 28 components, 19 runnable examples, 155 routes, 0 errors, 309 unreviewed, 0 stale |
| Native Chrome 200% zoom | All six surfaces: 1440 × 960 outer window, 711 × 432 CSS viewport, devicePixelRatio 2, visualViewport.scale 1, no document horizontal overflow |

Database command: `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/planner.test.ts tests/database/quality-planner.test.ts tests/database/demand.test.ts tests/database/scheduling-workspaces.test.ts`. The suites keep their disposable database-name guards. The loaded Windows host used a 300-second test bound; no application timeout or constraint changed. Live schema inspection confirmed migration 0048, calendar exceptions restricted to Closed and half-open reservation exclusion. No migration was allocated.

Browser commands used the repository's compiled Playwright configuration, maintained Chrome projects, one worker, explicit ownership of the already-started preview and local 90-second test / 15-second assertion allowances. The existing viewport loop retains its 180-second bound. The final ten-case run used `--no-deps` after the successful warm-up. There was no single clean 47-case run; the final targeted run proves the corrected cases. A role-based combobox locator replaced exact label-text lookup, which included nested option text. No application assertion or guard was weakened.

The four full-unit failures are both document-store cases, the P12 private recovery-directory case and the route-warmup POSIX separator assertion. All four reproduced in a newly created, untouched `origin/main` worktree. They remain Windows baseline limitations, not passes. A separate full build passed because the chained check stopped at units.

Focused regression proves authorised demand → proposal → contact/readiness → full crew confirmation, stale/conflicting moves, atomic reservation replacement, explicit travel including zero, request accept/reject/cancel, unchanged retry/receipt recovery and retained history. Resource/capacity tests prove current permissions, site scope, anonymous busy periods, competence validity, cross-domain provenance, unknown effort and no analytical source writes. New browser cases cover keyboard selection, restorable Field Team/resource context, queue selection, exact travel handover, closure warnings and disposable scenario exclusions.

No full-repository database, HTTP, browser or hosted-demo upgrade sweep was executed. There is no new API, command, migration or hosted-only identity change. Required PR CI remains separate from these local results.

## Visual review

[Manifest](manifest.json) retains 48 original PNGs, 42 explicitly inspected, with dimensions, SHA-256 and inspection status. All five Scheduling workspaces were inspected at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 844. Field Team was inspected at desktop and 320 px. Native 200% captures and scrolled detail captures verify wrapping, usable controls, explicit timezone and source-state wording. The existing shell remains the content scroll owner; week lanes retain their documented horizontal scrolling and keyboard/day alternatives.

[Capture helper](capture-zoom.mjs) and [measured zoom metrics](zoom-metrics.json) reproduce the native zoom using the maintained Chrome runtime. The first planner detail capture was taken while its independent demand read was loading; the final helper waits for both reads and the retained detail captures show loaded demand. The 720 × 480 browser exercise is reflow evidence only, not native zoom.

The continuing-closure images use the maintained synthetic component fixture. Travel-closure images are a **read-only response challenge**, not a persisted contradictory calendar: the authoritative publisher refuses a closure conflicting with an existing booking. The test supplies a closed interval to verify warning rendering and exact handover without any booking write. Other native images show the synthetic database after exercised journeys, so counts differ between captures. No image was edited or composited.

The exact Scheduling r01 HTML remains unchanged and its desktop capture was inspected. Current authorised work-order demand supersedes its Proposed-appointment lane; appointment controls remain in their native record workflow, and secondary Scheduling navigation uses the existing shell. Field Team r05 is the accepted successor to retained r04; resource detail, capacity and travel still lack exact issued mockups. Captures are implementation review evidence, not adoption of a new visual baseline.

## Handover limits

The final remote refresh still had main `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. Open #314 advanced to `6133d2282efb89ae5bc1984e8d95d8c61b14451f`; it remains an ES-02 design/documentation change with no Scheduling code or migration. Shared STATUS/register edits require normal merge review.

All existing expected-version checks, company/site/resource scope, atomic reservations, customer-contact consequences, immutable history, receipts and outbox remain authoritative. No command engine was duplicated. URL criteria carry presentation context only; source reads reauthorise it. Scenario exclusions and sequence proposals remain disposable local analysis.

Owner/device and independent accessibility acceptance are pending. Page reviews remain Needs review, guides Draft, fingerprints unadopted and deployment unverified. Approved effort and net-capacity denominators, certificate/renewal evidence, cross-domain resource mappings and live route estimates remain unavailable/Unknown. No live integration, source editor, customer message, production transaction, merge or deployment is included.
