# Create discovery workspace — execution evidence

<!-- versioning: git -->

Scope ES-02, route `/estimating/discovery/new`. Reference: **PPO - Design**, page `1414:356570`, named version **Create discovery workspace — accepted**. The [page contract](../../../design/development/pages/route-estimating-discovery-new.md) records every frame, adopted decision and journey adaptation. Owner visual review remains **pending**.

## Executed checks

| Check | Result |
|---|---|
| `npm run studio:check` | Passed: 366 entries, 48 component entries; no integrity errors. Pending/stale reviews remain visible. Initial reference-root and heading errors were corrected before the passing run. |
| `npm run lint` | Passed after removing one unused import left by replacing the old form. The final added database/browser test files also passed a focused ESLint check. |
| `tsc --noEmit --pretty false` | Passed, including the new page, fixtures, browser tests and database read proof. |
| Full unit command, serial execution | 955 tests: 952 passed, 3 failed in existing document-store/recovery tests. Baseline comparison is recorded below. New creation page and contract tests passed, 3 each. |
| Page database read proof | 1/1 passed on isolated `ppo_synthetic_test`: eligible metadata, disappearance after creation, permitted existing-workspace metadata, cross-workspace refusal and revoked-access refusal. |
| Creation prerequisite database proof | All eight cases have passing assertion evidence across the initial 7/8 run and corrected 1/1 timestamp-comparison rerun. See the [separate prerequisite record](../discovery-creation/README.md). |
| Browser page/state proof | Final 8/8 passed at desktop 1440×1000, tablet 1024×768 and phone 390/320×844. Covers selection/search, loading/empty/denied reads, direct Sales entry, validation focus, reviewed estimator/source, exact original retry through access loss, duplicate/denied outcomes and frozen creation. |
| Search hint follow-up | 4/4 choose/search/wrapping cases passed again at 1440, 1024, 390 and 320 px after restoring the accepted shorter hint. |
| Phone dialogs | 2/2 additional cases passed at 390×844 with mobile/touch emulation: recovery and busy/duplicate/denied outcomes. Dialog bounds and return of focus to answer-state openers are asserted. |
| Existing journey compatibility | Four affected real-database journeys passed on desktop and again with 390×844 mobile/touch emulation, across targeted runs: workload entry, scoped creation with uncertain-outcome recovery, incomplete first revision, and exact accepted Sales brief creation/linking. The final phone recovery rerun passed after waiting for the original operation-receipt response. |
| Naming | Passed; 78 parent requirement IDs preserved. |
| Foundation | Passed: 78 requirements, 22 issued sources and 12,889 local links checked. Documentation assurance only. |
| Generated records | `build_status.py` rendered 61 fragments after merging the prerequisite; `build-ui-sequence.py` regenerated the temporary sequence (366 entries). No generated index was hand-edited. |
| Standard `npm run build` | Failed before application compilation: Turbopack cannot resolve the dependency junction outside its filesystem root. No successful standard build is claimed. |
| CI | Latest inspected page/prerequisite runs were queued or pending. No complete passing CI result is claimed. |

The full unit command was `node --import tsx --test --test-concurrency=1 tests/unit/*.test.ts`, equivalent to the repository's unit script with serial execution to limit Windows memory pressure. The three failures were two `ExactDocumentUnavailable` results in `document-store.test.ts` and the recovery test expecting “outside Git” while receiving “Unsafe recovery directory”. Unmodified main `0909db97aff551e37fbd349b43e797f5793e8cba`, in a separate clean worktree using the same installed runtime, reproduced exactly those three failures (1 passed, 3 failed across the two files). Its standard build reproduced the same Turbopack junction error. These are confirmed baseline limitations; neither the full unit run nor the standard build is labelled passed.

Initial browser retries exposed a five-second shared identity-shell hydration limit on this host. The tests now wait for the actual creation-page boundary (up to 20 seconds), then retain the normal business-state assertion timeout. The final eight-case run after the started-step correction completed in 32 seconds; the two additional phone cases also passed again. Navigation assertions keep a started Requirements step “In progress” while an untouched Configuration step remains “Not started”. A separate busy-label regression introduced during verification was corrected before the passing run; no failed run is presented as passing evidence.

The local real-database walkthrough also created the reviewed workspace with Morgan as estimator and the exact accepted Sales brief linked. The saved workspace remained Incomplete with the original owned follow-ups; the creator correctly received a view-only saved page. A direct persisted-result assertion confirmed one workspace, the chosen estimator, original creator, exact brief and unchanged Answered states/follow-up owners. This is synthetic end-to-end evidence, not business acceptance.

The existing journey checks exposed omitted work-tag facility membership and specialist clarification in the replacement form. The site/effort dialog now reuses those existing `DiscoveryFields` controls through its documented `scope-and-work` variant. The checks retain their original scope, confirmation, persisted-revision and recovery assertions while entering through the accepted controls. Initial failed runs also exposed obsolete selectors and a receipt-response timing assumption; these were corrected before the passing targeted reruns. Existing-workspace Sales linking remains a separate unchanged journey.

## Local runtime and scope

Existing installed dependencies were reused through a junction; no package installation or dependency change was made. Installed Next.js was 16.4.0, React 19.3.0, Playwright test 1.64.0 and TypeScript 6.0.3. The manifest declares newer patch versions for the first three. CI with the pinned lockfile is therefore still required.

The standard Windows development launcher hit the same Turbopack junction boundary. An ignored local copy of the loopback launcher selected installed Webpack on port 3107 for browser verification. It was stopped before the standard build attempt. This is development-runtime evidence, not a compiled production build or deployment.

The dedicated page/state browser tests use stable synthetic API fixtures with real page controls. They prove requests and interaction states, not database transaction acceptance. Separate database tests and the existing journey browser tests use the isolated synthetic database. No offline support, reload persistence, renderer proof or operational integration is claimed.

## Visual comparison

[Capture manifest](captures.json) records dimensions, source commits and SHA-256 hashes for 28 icon-free application captures. These are evidence hashes, not owner-review fingerprints. Runtime icon glyphs were hidden by the screenshot style; no Pro artwork is retained. Issued reference bytes are unchanged.

| Accepted reference | Application capture / comparison |
|---|---|
| Choose opportunity `1415:1065` | [Desktop](captures/choose-1440.png): 240 px rail, 380 px summary, compact radio rows and 64 px footer. The synthetic fixture has two candidates rather than the six illustrated candidates. |
| Tablet `1416:361254` | [1024×768](captures/requirements-1024.png): 76 px rail and full usable main column; Summary opens a dialog. |
| Phones `1416:361934`, `1416:364983` | [390](captures/choose-390.png), [320](captures/choose-320.png): wrapped selection rows and reachable footer. The shared compact header replaces the earlier task header. The visible search hint now uses the accepted “Search opportunity or customer” wording and fits at 320 px. The full accessible label and search continue to include opportunity numbers. |
| Requirements `1414:356639`, `1416:363399`, `1416:364882` | [Desktop full content](captures/requirements-full-1440.png), [390 full content](captures/requirements-full-390.png), [320 full content](captures/requirements-full-320.png). Full-content captures expand height while keeping the drawn width; separate viewport captures show scrolling. The fixture starts with three accepted statements and empty technical configuration, rather than inventing the Figma example's manually entered area/system. |
| Review `1416:2974` | [Review](captures/review.png), [phone review](captures/phone-dialog-review.png): existing 640 px native dialog, scrollable body, fixed actions and focus handling. The reviewed assigned estimator and exact Sales acceptance replace the older separate-link journey. Actual required follow-ups make this example longer than the design's two-item example. |
| Creating / uncertain / duplicate / denied `1416:7553`, `1416:7630`, `1416:7715`, `1416:7799` | [Creating](captures/creating.png), [uncertain](captures/outcome-not-confirmed.png), [existing](captures/already-exists.png), [not permitted](captures/creation-not-permitted.png). The same states have phone captures. Uncertain recovery never asserts that nothing was saved. |
| Empty / attention / loading `1416:359903`, `1416:359389`, `1416:365050` | [Empty desktop](captures/empty-desktop.png), [validation](captures/needs-attention.png), [loading 390](captures/loading-390.png). Validation captures the focused first incomplete field; the alert remains in the scroll region and the footer retains the count. |

Remaining visual differences are explicit: current permission-filtered shell shortcuts and breadcrumb; shared field and family-card copy; editable work tags, scope/effort details and answer-state dialogs; no readiness assertion before preview; no copied technical configuration; phone area/family controls below the brief. The existing phone family strip scrolls horizontally within its own region. These are recorded adaptations or review items, not a claim of pixel identity. Desktop summary spacing and choice-heading size were tightened after comparison.

## Downstream observation outside this page

The existing saved wizard’s view-only fallback offers only the workspace owner in follow-up owner selectors. A recorded follow-up assigned to a different person can therefore display “Choose…” even though its original owner is preserved in the saved revision. The same fallback is present in unmodified main `0909db97`. This needs a separate saved-wizard read/display correction; creation does not silently reassign follow-ups to conceal it.

## Review and delivery

Owner visual review, independent review, physical-device testing, screen-reader review and 200% browser zoom review remain pending. Deployment was not performed. Source presence, automated functional proof, visual comparison and business acceptance remain separate.
