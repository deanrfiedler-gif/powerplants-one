# Service requests implementation evidence

<!-- versioning: git; committed history is authoritative -->

Scope SV-01/SV-02, draft PR #636. Design: **PPO - Design**, page **1249:9313**, named version **Service requests — accepted**. Dean's design acceptance and scoped backend authorisation are recorded separately from implementation evidence. Owner implementation visual review is **pending**; no deployment or business acceptance is asserted.

## Reproduction and source

The existing register, record and logging routes were refined in a dedicated worktree. Synthetic fixtures use stable IDs and explicit SYN references. The browser fixture suite exercises the real UI with mocked authorised reads; `tests/browser/intake.spec.ts` separately exercises native HTTP commands. PostgreSQL checks use only an isolated `ppo_synthetic_test` database on PostgreSQL 16.

The retained [icon-free design captures](../../../reference/ui/service/service-requests-design-r01/README.md) are unchanged. Live frames, notes card 1261:289978, index 630:2 and row 1262:5220 were inspected. Runtime captures and raw logs remain outside tracked files; screenshots containing licensed artwork are not public evidence.

## Checks on 20 October 2026

| Check | Actual result |
| --- | --- |
| `npm run lint` | Passed. Focused lint also passed after the visual refinements. |
| `npm run typecheck` | Passed, including the final conflict presentation. Full non-incremental TypeScript checks also passed at earlier source checkpoints. |
| `npm run studio:check` | Passed: 366 entries, 48 components, 210 source routes; no errors. The 338 unreviewed and 28 stale entries remain visible. |
| `python scripts/check_naming.py` | Passed; no naming errors. |
| `python scripts/check_foundation.py` | Passed: all 78 requirements retained, 22 issued sources, 60 status fragments; no errors. This is documentation assurance. |
| `python scripts/check_migrations.py` | Passed: migration numbers unique, registered and unreserved. |
| `python scripts/build-ui-sequence.py` | Regenerated the disposable sequence from the register: 366 entries, 363 placed, 3 excluded. |
| `python scripts/build_status.py` | Regenerated STATUS and the decisions index from 60 fragments. |
| `node --import tsx --test --test-concurrency=1 tests/unit/*.test.ts` | 949 tests: 944 passed, 5 failed. Three Windows filesystem failures reproduced on unchanged main; two operator-process timeouts passed on a focused rerun. Details below. The full run is not labelled passed. |
| Service UI browser fixtures | All 11 cases passed across final runs: nine in the full recapture, plus the corrected compact-tablet selector and the new bounded-evidence/discard-focus case. The full recapture initially failed its tablet test because the test used the wrong accessible name; correcting the locator made that case pass. Earlier all 10 existing cases and five affected visual reruns passed. |
| Native intake database suite | Passed: all 18 tests, including the five new statement/atomic-triage/upgrade cases. Command: `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=180000 tests/database/intake.test.ts`. The final upgrade case took 178.9 seconds on this Windows host. |
| Native Site → request → statement → atomic triage browser journey | Passed against real HTTP commands and PostgreSQL. The final combined run passed this journey and the duplicate/delayed-selector case (2/2). It verifies original symptom retention, statement revision 2, then atomic request revision 4 with High priority and a Completed clarification carrying the same outcome. |
| Production build | No successful local production build. Windows Turbopack rejected the external dependency junction; the webpack build did not finish within the local attempt. CI build results are separate below. |
| `git diff --check` | Passed. |

The full unit run's two `document-store.test.ts` failures (`ExactDocumentUnavailable`) and one `recovery.test.ts` path-message mismatch also occurred on an unmodified main checkout at `8f5ad31b69643d50a3d333ebad7314b128831512`. Both operator CLI probes in `azure-demo.test.ts` timed out at 15 seconds during the full run; all nine tests in that file passed on both the baseline and a focused branch rerun. No unrelated filesystem or operator implementation was changed.

Earlier local database runs failed during schema reset/seed, before command assertions, including a 120-second timeout reproduced on unchanged main. The isolated instance needed `max_locks_per_transaction=512`; Windows timezone catalogue warming and crash recovery also delayed setup. These failed attempts are not passing evidence. The completed 18-test command suite above supersedes those setup attempts; it does not establish a pass for every database suite.

The application ran using the repository's existing `IS_WEBPACK_TEST=1` development option. No dependency or framework was added. The shared local dependency junction held Next 16.4.0 while the unchanged repository lockfile specifies 16.4.2; CI installs from the lockfile.

Earlier native browser attempts exposed two loading defects (a handed-over Site appeared unidentified while options loaded, and Create could be pressed before owner options were ready) and an ambiguous test selector. Both UI defects and the selector were fixed; the final native and delayed-selector runs passed. An earlier identity-loading attempt also hit the local database connection timeout; the application timeout was not relaxed.

## Visual comparison

These are implementer observations, not Dean's review. Functional assertions and viewport fit do not establish pixel equivalence.

| Accepted reference | Runtime comparison |
| --- | --- |
| 1249:9382, desktop register, 1440 × 900 | Compact toolbar, flush queues, 40 px rows and fixed checkbox/reference/summary/stage/priority/attention/action columns inspected. Shared chips and unfilled attention text replace the earlier oversized pills. |
| 1254:3846, request snapshot, 1440 × 900 | 960 px dialog with 440 px summary and remaining triage/history region; tabs, close focus return and native statement action inspected. |
| 1255:2587, Board, 1440 × 900 | Three native lanes, compact request cards and labelled per-card actions inspected. No proposed lifecycle stage introduced. |
| 1259:3354, logging and possible duplicate, 1440 × 900 | Two-region form and advisory candidate inspected. Statement handover retains customer words; cancel preserves the new-request draft. |
| 1255:3172, 1256:287381 and 1257:3058, desktop record/triage/linked work | Header, readiness strip, details column, five tabs, inline edit and linked-work authority separation inspected. |
| 1259:288310, tablet register, 1024 × 900 | Fit and list controls passed. The matching capture uses the shared rail's existing compact user preference; the module does not override a person's rail choice. |
| 1259:289789 and 1259:290489, phone register, 390/320 × 844 | Dense rows, queue selector, floating create action and no page overflow checked. Shared shell differences are listed below. |
| 1259:290111 and 1259:290321, phone record and one-error triage, 390 × 844 | Full-screen triage, retained entries, request context and one validation error inspected. |
| 1261:4946, 1261:5127 and 1261:5300, loading/no matches/load failure, 390 × 844 | Skeleton, clear-filters and retry states inspected; failed reads show no stale rows. Loading and failure suppress the count. |
| 1261:289734 and 1261:289886, view only/refused newer revision, 390 × 844 | Permission explanation, hidden write paths and retained conflict entries checked. Conflict requires explicit revision comparison before retry. |

## Deviations and questions for owner review

- Customer identity is derived from the visible current Site Operator or one unambiguous visible requester relationship. There is no new persisted customer picker. Should a later change introduce explicit customer binding?
- The later shared compact phone-header contract shows the reference/revision and bottom navigation. The accepted Service record shows a summary/reference header without bottom navigation. This build retains the shared shell contract; alignment remains open.
- Native limits, required audit reasons, native selects and permitted owner choices replace several drawn counters or free-text controls. Equipment remains optional under the existing server gate. Request information remains available only from New; it is disabled while already awaiting clarification.
- Duplicate matching is an advisory, permission-filtered 20-result site/equipment window. Earlier on this equipment shows visible Triaged requests within that window and labels the date as received, not triaged or resolved. Broader matching rules remain unspecified.
- Board Preview and Move remain in a labelled card menu. A standalone snapshot has no invented previous/next sequence; Open in sequence supplies that context for selected records.
- Phone tabs can scroll because all native record tabs remain available. The shared header, bottom navigation, native form labels and safe permission explanations produce spacing and copy differences from the Service-only frames. Navigation item counts follow actual grants.
- Undrawn Reported issue, Updates, History, Request information, Update details, phone filters and tablet record layouts reuse native controls. Their final visual treatment remains open.
- Conflict feedback does not invent the other editor's name or save time: the native conflict response supplies a revision refusal, and a permitted fresh read supplies comparison values.

## CI and delivery

At code checkpoint `d41f975c5ff09b93feb2dbefa8a875310584fbf1`, 15 workflows passed: Documentation, Dependency audit, Merged-tree check, Development register integrity, Document library, Output actions, Output register, Engineering native workflow, CRM Leads, Azure demo preparation, Email Calendar, PJ-06 specialist package, Quotation response, Quotation disposition and Quotation conversion. Application, compiled-browser, Estimating and Quotation Supply were queued; Products, Projects Gantt and CRM refinements were still running when inspected. Earlier merged-tree assurance passed at `ddb6acc35e2b6e8fd51e6b8d9c89aa5c7d118717`. Earlier CI TypeScript errors in three redundant triage comparisons were fixed; those failed runs are not counted as passing final evidence.

The final source includes subsequent loading and conflict-presentation refinements covered by the local checks above. Final-head CI is pending at delivery; earlier checkpoint results are not final-head results. The PR remains draft for CI and owner visual review. No owner review fingerprint, reviewer or date has been supplied.
