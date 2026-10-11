# PJ-03 baseline and forecast verification

Owner: Dean Fiedler. Review: local implementation verification recorded 11 October 2026; paired visual and business acceptance pending.

Scope: AC-PJ-BASELINE-01–04 in [the decision](../../../decisions/project-schedule-baselines.md). Synthetic fixtures only. Implementation adds a baseline companion, comparison dialog and successor preview; existing schedule/material and Service authorities remain independent.

Verified application source: `ccaab5a281d6e055babdd04317381708fdc5cbf1`. The subsequent integration of main `8e178bc` changes documentation only, retaining ADR-0053 and both new audit/baseline document-register entries.

## Results

| Check | Result and boundary |
| --- | --- |
| Unit contracts | 11 passed: baseline comparison, existing Gantt date/graph rules and migration registry. |
| Database and upgrades | Nine focused cases passed across the baseline suite (five), Products historical 0025/0077/0081 upgrades (three), and existing Gantt persistence/replay (one). Original rows, ledgers, users, grants and receipts are preserved; reserved Products 0052 installs after 0081. |
| Browser | Four passed: two journeys each at 1440×1000 and 390×844, Chrome 155, local synthetic server. Exact lost-response retry, successor review, milestone variance, reload, stale refresh/review, denied-content removal and Escape/focus return. |
| Static and design assurance | TypeScript, focused ESLint, foundation (78 parents and 22 issued sources), naming and studio checks passed. Studio retains 322 unreviewed entries and 28 stale reviews. |
| Production build | Final source build passed, including TypeScript and static page generation. |
| Deployment / owner approval | Not performed or granted by these checks. |

Tests: `tests/unit/project-baselines.test.ts`, `tests/database/project-baselines.test.ts`, `tests/browser/project-baselines.spec.ts`, existing Gantt and populated-upgrade suites. Test database is the task's isolated `ppo_synthetic_test`; no operational data or provider is involved. No matching issued baseline-dialog image exists; r10 remains the schedule reference, not approval of this addition.

## Captures and review

[Desktop comparison](desktop.png), [phone comparison](phone.png), [phone schedule after correction](phone-schedule-after.png), [phone before correction](phone-before.png), [unchanged main control](phone-main-control.png). Codex inspected the working UI; these captures do not grant Dean's visual acceptance. Dialog text/controls wrap, content scrolls, and the close control remains reachable. The phone task click and the full save/retry/comparison journey pass after the layout correction.

The local capture environment has no configured Font Awesome Kit; icons are the repository's local fallback drawings. No Pro artwork or private Figma source is retained.

The control uses unchanged main application sources at `74981bec40cf6e7baf176ddd1eba3c25e2fed755`, a clean tracked tree and the same synthetic project at 390×844. An ignored copy of the local launcher selects webpack for this control because Turbopack rejected a dependency junction; every loopback/identity gateway check is retained. Main also gives the task scroller only 2.28px and the task click fails. The corrected branch gives it 338px inside a 360px schedule viewport, with vertical page scrolling; the same click passes. This establishes the underlying phone list collapse as pre-existing.

## Earlier failures and corrections

Local setup required an increased PostgreSQL `max_locks_per_transaction` for the repository-wide reset. The initial four tests failed in their reset hook before reaching feature assertions; the disposable cluster was restarted with 1024. No application regression is inferred from that setup failure.

The first baseline database run after setup exposed the missing latest-version update in the migration registry; it stopped at 0077 despite listing 0081. Both registry entries now agree and the feature/upgrade checks pass. One Products 0077 upgrade exceeded its unchanged 120-second deadline during a concurrent build; the isolated rerun passed in 21 seconds. No deadline was increased.

Initial phone workflow failed after recording the baseline: the legend intercepted the task click. Keeping the action strip at 42px alone did not fix the collapsed task scroller. The final correction also lets the phone page grow and scroll around a 240–360px task viewport; dialog controls still wrap. The initial trace remains locally in ignored test evidence; the public captures retain only synthetic visible content.

## Contacts CI repair — 11 October 2026

The [original CI failure](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38124416939/job/114425685332) rejected two stale working source hashes. The [contract re-read](../../../design/contacts/README.md#project-baseline-contract-re-read--11-october-2026) records the precise Projects and Reports changes and their unchanged contact boundary. The deterministic builder reproduces the original 254,547-byte HTML with SHA-256 `aa97680dadf459aa6fbeaf39c761df124adf6737fb68c62b106589c38eac9a52`; all Contacts model and native-browser checks pass locally. No issued HTML, historical evidence, source provenance or visual-review status changes. Updated-head CI remains the merge gate.

## Access-stack integration — 11 October 2026

The authorised PR repair pass integrates `8800193` (#410 → #413 → #414 → #415 → #417) before Projects 0081. All four migration registrations remain in order; seeds end at 80 because 0081 adds no grant or user. The hosted-upgrade review gate describes both local-only access changes and the empty Projects companions, while retaining hosted grant write restrictions.

Every affected historical migration assertion retains its original rows and exact added versions. The Projects populated-0077 case allows exactly the named AD-01 seed grants/receipts, compares all other original rows, and preserves the complete settled snapshot on repeat. AD-01 request/application upgrade cases gain 0081 only in their migration expectations. Products retains every original history and adds reserved 0052 after integrated 0081. The joined design register passes with 358 entries, 204 routes and zero integrity errors; 330 unreviewed pages, 28 stale visual reviews and 42 pending component reviews remain visible. Final combined-head tests and CI are recorded separately; this is not owner acceptance or deployment.

The integrated typecheck, focused ESLint, studio, foundation and PP-01 assurance pass. Naming initially found 8,006 characters in the joined project instructions; removing the repeated independence sentence (retained in section 5) restores the 8,000-character limit without changing authority. Combined database proof and CI remain separate.

The combined-history local run at `d1ef6fb` runtime/database sources (the later `f42cf2b` changes only instructions/evidence) passes all five focused cases: AD-01 requests from 0078, application from 0079, PJ-03 populated 0077, Products from 0025 and reserved Products 0052 after 0081. Original snapshots/ledgers, exact additions and inert repeated migration/seeding are asserted. No failure, cancellation or skip; 802,431 ms. The subsequent design-index integration changes documentation only. Full CI and hosted-demo upgrade verification remain separate.
