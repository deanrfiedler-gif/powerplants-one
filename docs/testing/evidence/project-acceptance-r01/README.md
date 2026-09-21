---
document_id: PPO-PJ09-EVD
revision: r01
date: 2026-09-21
status: Executed local component evidence; owner and parent acceptance separate
---

# PJ-09 verification record

Source: `feat/pj09-staged-acceptance`, [PR #269](https://github.com/deanrfiedler-gif/powerplants-one/pull/269), based on EN-08 with main `920b058` and EN-08 `f8d2b3d` incorporated. [Handover](../../../delivery/pj09-staged-acceptance-handover.md), [decision and adaptations](../../../decisions/ADR-0033-staged-acceptance.md), [unchanged supplied plan](../../../reference/project-acceptance/PPO-PJ-09-Staged-Acceptance-and-Closeout-Build-Plan-r02.md).

Windows local environment: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Next 16.3.4, Playwright 1.63.0, pinned Chrome channel 153.0.8010.53. Development uses `ppo_synthetic` at 55438; all database suites use the separate `ppo_synthetic_test` at 55439 with one database worker. Renderer available. Build/browser IDs and raw measurements are retained in the JSON records. These are synthetic component checks, not parent AT, owner, deployed or physical-device acceptance.

## Executed checks

| Proof | Result / reproducible command |
|---|---|
| Build and static checks | `npm run build`, `npm run typecheck`, `npm run lint`; result logs retained |
| Policy and affected unit modules | 40 passed: `node --import tsx --test tests/unit/{project-acceptance,projects-gantt,engineering-commissioning,work-view,migration-registry,azure-demo}.test.ts` (expand file list in PowerShell) |
| Acceptance and Project database | 19 passed: `node --env-file=.env.pj09-test.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/project-acceptance.test.ts tests/database/projects-gantt.test.ts tests/database/leads-projects-integration.test.ts`; includes 10 PJ-09 groups |
| Registry/upgrade | 18 passed, 261.867s; same runner with pattern `upgrade|migration formalises|DR01-DB03|P09 fresh|combined installation`, files estimating-workspaces, estimating, quality-upgrade, reports, finance-upgrade, leads-projects-integration, field, offline, packs, planner and demo/upgrade |
| HTTP | One connected group passed: `node --env-file=.env.pj09-restart.local --import tsx --test tests/http/project-acceptance.test.ts`; actual local test server required |
| Real EN-08 source | `node --env-file=.env.pj09-restart.local --import tsx scripts/check-project-acceptance-source.ts`; actual source change retained original technical decision and created one follow-up; EN-08 training gate consumed |
| Actual process restart/lost response | `node --env-file=.env.pj09-restart.local --import tsx scripts/check-project-acceptance-restart.ts`; owns port 3010 and verifies the exact task-owned PostgreSQL data directory before restart. Upstream closeout committed, browser response aborted, both processes restarted, original recovered once |
| Compiled visual and navigation | `PJ09_REVIEW_ORIGIN=http://127.0.0.1:3001 node --env-file=.env.local --import tsx scripts/check-project-acceptance-browser.ts`; six views, selection/Back, actual r22 comparison, full stylesheet order, flush-edge negative control, menu/inspector states, wide/narrow/390px layout and focus |
| Native Chrome 200% Page zoom | `node --env-file=.env.local --import tsx scripts/check-project-acceptance-zoom.ts`; disposable Chrome profile, physical 1920×1200/CSS 960×600, DPR 2, no page overflow, inspector and dialog focus/Escape |
| Existing My Work/Projects/shell browser | 30 passed in 59.8s; 20 intentional platform skips. Original four specs run unchanged except local Origin 3000→3010 and temporary relative helper paths; one worker, 1440×1000 desktop and 390×844 phone |
| Existing Intake and Quality browser | Six Intake checks plus four Quality screen-family checks passed across desktop/mobile. Temporary helpers change Origin only; mobile project name matches the original fixture date partition. No transport reset was absorbed in the successful Quality logs. The first local run used the original hard-coded helper Origin and then an incorrectly named phone project, causing an Origin refusal and fixture booking collision respectively; unchanged assertions passed with the correct local Origin and original mobile date partition |
| Contacts source contract | Deterministic build unchanged; 103 model and 62 native browser groups passed after rereading the Project visibility precedent and refreshing its source pin |
| Historical CRM owner upgrade | HV-19/22 passed after adding only the new nullable Project-link default to expected upgraded rows; original values and receipts remain exact |
| Registered module host | The existing CRM UI host-contract test passes for both Deals and PJ-09 |
| AD-01 affected generated contract | 107 model checks and 40 native browser groups passed; `node scripts/check-access-review-model.mjs`, `node scripts/check-access-review-browser.mjs` |
| Historical baseline diagnosis | Clean main `920b058` selected database baseline: seven checks passed. Existing document-store unit failures reproduced on the same clean baseline, as detailed below |

The process restart record is from build `cYYjWLUDFuRdMBeyeGr02`, before the isolated My Work SQL-space/legacy Gantt/host-contract and remaining-work presentation fixes. Final visual/regression results use the later compiled build identified in `browser-results.json`. No acceptance command/storage change followed the restart proof; later context changes only select the visible next action and closed-with-obligations label. Document template change between prepare and issue is independently exercised by the HTTP test, which restores the exact source bytes in `finally`.

`restart-results.json` records different application PIDs 15800→2796 and PostgreSQL PIDs 3520→2260; one closeout, three requests including the retained return, one response and five distinct owned follow-ups. Issued PDF SHA-256 `b070fde64706e93c1bfa07423faf792df63e27c3ef706fc89e6555491f7987bb` was identical after restart. This is an actual process restart, separate from the database suite's pool-reopen/reseed proof.

## PJ09-01–56 traceability

“Executed” identifies the component assertions actually run; it does not claim every possible combination, a parent AT procedure or independent business acceptance. “Inspection” distinguishes a code/fixture review from an automated assertion. U = policy unit; D = acceptance database; H = HTTP journey; B = compiled native browser; R = actual restart; S = actual EN-08 source proof; X = adjoining regression/upgrade.

| ID | Evidence and boundary |
|---|---|
| PJ09-01 | B six destinations, detail selection and Back; X project navigation. Executed |
| PJ09-02 | B shared rail/header/breadcrumb/full-bleed composition; registered host contract. Executed |
| PJ09-03 | B actual My Work primitive, collapsed scoped default, dock/overlay, focus/Escape; X unchanged My Work default. Executed |
| PJ09-04 | B complete stylesheet header/row/footer geometry plus introduced 16px gutter failing negative control. Executed |
| PJ09-05 | B independently rendered r22 tag specimens, loaded normal Roboto and navy controls; U neutral icon semantics. Executed |
| PJ09-06 | B 1920/1440/390 and native Chrome Page zoom 200%; screenshots inspected. Physical devices unexecuted |
| PJ09-07 | B focus/Escape/return and accessible controls; X keyboard flows. Screen-reader acceptance unexecuted |
| PJ09-08 | B server-returned counts/selection; D restricted and filtered project closure. Large catalogue/permutation acceptance unexecuted |
| PJ09-09 | D/H strict payload, create, context/owner validation and incomplete draft. Executed |
| PJ09-10 | D immutable snapshot SQL guard, return/successor retains original. Executed |
| PJ09-11 | D exact installed/served units and shared source with excluded installed location. Executed |
| PJ09-12 | D mandatory source across explicit excluded scope; overlap relationship/version checks inspected. Exhaustive reassignment sequences unexecuted |
| PJ09-13 | U/D unallocated/removed/filtered scope cannot make project closure pass. Executed |
| PJ09-14 | D failed shared source blocks served unit even when installed location excluded; A–L D/H fixtures. Executed |
| PJ09-15 | U all five requirement outcomes, unavailable and mandatory applicability; D no waiver. Executed |
| PJ09-16 | U/D missing/restricted/changed sources; D unavailable original stays unavailable until successful check. Executed |
| PJ09-17 | D changed source prevents stale issue/decision; H actual template change rejects prepared issue; S source version change. Executed |
| PJ09-18 | S relevant stage flagged and original decision retained; deduplicated source follow-up. Executed |
| PJ09-19 | S consumes actual EN-08 holds/releases; D synthetic corrected retest. Source ownership/no Activity waiver inspected; full EN-08 retest user journey remains adjoining evidence |
| PJ09-20 | U eligible residual conditions; A–L C actual accepted-party conditions and closed remaining obligation. Source gates cannot be waived. Executed component/fixture evidence |
| PJ09-21 | U independent accepted responsibility, C transfer through receiver command. Executed |
| PJ09-22 | U distinct training evidence; S actual planned EN-08 training blocks pack despite supplemental completion. Executed |
| PJ09-23 | D/H exact originals, missing original 503 and owned recovery; typed manual reference/availability inspected. Executed |
| PJ09-24 | U available/identity/restore are independent requirements. No credentials/controller writes. Executed |
| PJ09-25 | No automatic warranty start or recurrence; sourced obligation fields inspected. Live warranty/maintenance adapter deliberately absent |
| PJ09-26 | D/H respondent/recorder and unknown authority retained until independent validation. Executed |
| PJ09-27 | H partial units cannot qualify full stage; fixture G retains second-compartment reservation. Executed |
| PJ09-28 | H returned/partial response evidence retained; response follow-up and immutable history inspected. Exhaustive dispute combinations unexecuted |
| PJ09-29 | D/H prepare/issue/local request/receive/accept separate. UI explicitly labels local transport. Executed |
| PJ09-30 | D/H sender/receiver separation and current receiver rights. Executed |
| PJ09-31 | D/H returned original and successor review; R history persists. Executed |
| PJ09-32 | D/H request retry uniqueness; technical-only EN-08 purpose is explicitly incompatible with broader stage pack. No incompatible acceptance reused |
| PJ09-33 | D independent commercial decision; fixture F dispute survives technical/customer/Service acceptance. Executed |
| PJ09-34 | D private Finance canaries removed from limited reads, manifests and HTML projection. Executed |
| PJ09-35 | D/H guarded stage closeout; required missing-original failure; R one committed closeout. Executed |
| PJ09-36 | U/D/H complete project ledger, all stages and independent whole-project commercial disposition. Executed |
| PJ09-37 | D actual saveTask before close, exact original receipt after close, new write refused, stale post-reopen version refused; X Gantt compatibility. Executed |
| PJ09-38 | D/H authorised reason/scope, original closure retained and current version renewed. Executed |
| PJ09-39 | D/S later source change keeps closed history, flags reassessment and owned follow-up. Executed |
| PJ09-40 | D/H exact issued HTML/PDF hash, immutable template/input, timestamp separation. Executed |
| PJ09-41 | D allowlist/canary assertions on content/projection; no private names/provider metadata added. Executed |
| PJ09-42 | D deliberately interrupted database finalisation after storage; original bundle recovered. Executed |
| PJ09-43 | D unavailable retained original produces one owned recovery and blocks closure; IDs resolve independently of labels. Executed |
| PJ09-44 | D/H original replay/conflict, revocation before receipt disclosure; X legacy schedule receipts. Executed |
| PJ09-45 | D competing writes and stale facts; X schedule concurrency. Shared workspace lock order inspected; exhaustive multi-source stress unexecuted |
| PJ09-46 | R successful upstream response aborted; app/PG restarted; original recovered and acknowledged without duplicate. Executed |
| PJ09-47 | D refusal of every acceptance action with only project.edit, inactive identity read denied, revoked original denied; H cross-company and current duties. Executed |
| PJ09-48 | D mixed-target Activity needs all targets, limited Finance/history/intent/file reads; H cross-company detail/intent denial. Executed |
| PJ09-49 | D one Activity per cause, typed Project FK and all-target permission; S source replay does not duplicate; X My Work. Executed |
| PJ09-50 | U work-view civil dates; H response precision validation; relative site-zone fixture anchor inspected. Cross-zone physical-device acceptance unexecuted |
| PJ09-51 | B natural wrapping/phone/zoom, R unknown-outcome recovery, D 409/503 with originals preserved; full error/long-content combinatorial acceptance unexecuted |
| PJ09-52 | D repeat seed/pool restart originals; 18 X additive upgrades and 0036 exact-encoding negative unit test. Executed |
| PJ09-53 | D/H/R blocked→corrected→issue→returned→successor→independent acceptance→closeout, actual restart. Executed |
| PJ09-54 | B independent compiled conformance; X My Work/Projects/shell, document and operation regression results. Final PR CI tracked separately |
| PJ09-55 | B five observed eleven-stage query timings in JSON; server paging/batched source inspection. No production-scale/SLA claim |
| PJ09-56 | Maintained status, ADR, handover, original references and this evidence distinguish code/tests/owner/hosted. No parent AT pass claimed |

## Screenshots and measurements

[Wide menu and inspector](1920-open.png), [first-use collapsed menu](1920-collapsed.png), [inspector closed](1920-inspector-closed.png), [decision dialog](decision-dialog.png), [narrow desktop](1440-narrow-inspector.png), [390px phone](390-phone.png), [phone inspector](390-phone-inspector.png), [native 200%](200-percent-native.png), [200% dialog](200-percent-native-dialog.png), [lost response](lost-response.png), [recovered original](restart-recovery.png).

The actual mockup/r22/My Work were inspected, not inferred from the implementation's tokens. Named r22 decision tags compare exact padding 3px 8px, radius 5px, 12px/500/18px text and semantic foreground/background pairs. Native full stylesheet results assert flush header/rows/footer, 220px menu, 464px inspector and normal 14/20 Roboto, loaded with 100% stretch and no transform. The selected tint denotes inspection only. Initial fixture differences (r03, 11 rows, explicit RL-017→RL-001 mapping and shared-hold priority) are documented adaptations.

## Failure dispositions and honest limits

- The new My Work Project join lacked one SQL space, causing a 503. Corrected; 30 compiled adjoining checks pass. The earlier PR snapshot's My Work failure is superseded by this local rerun.
- Real EN-08 source change exposed an invalid trigger variable qualification. Forward migration 0038 fixes it; the real source proof passes and prior technical decisions survive.
- Stable test output IDs collided with prior runs' write-once files after template changes. The test now creates a distinct external store per disposable database run, preserving old originals and the production guard.
- Early parallel reset suites conflicted/timed out, and a machine reboot interrupted build/testing. They are not counted as passes. Final database suites run sequentially; clean-main comparison was performed for baseline diagnosis.
- Existing document-store tests initially reject Windows short-form TEMP identity. Using the canonical long-form TEMP path passes write-once/hash checks; symlink creation still fails EPERM on both this branch and unmodified main `920b058`. No symlink security assertion or store guard is removed. Connected exact-output tests pass.
- PR #269's earlier `765a071` CI exposed pre-0032 Gantt lifecycle SQL and stale CRM Activity-link/Contacts/module-host contracts. These were corrected with explicit compatibility/default expectations and a reread of unchanged Contacts visibility semantics. Current-head CI remains a separate record, never inferred from local passes.
- Physical devices, screen-reader testing, independent owner visual/business acceptance, parent AT procedures, production load, live SharePoint/MYOB/CAD/Service transports and hosted deployment remain unexecuted. All fixture/adapters and receiving decisions are local synthetic scope.

Final local compiled visual build: `qVKiscOiUpufrz7eyd21W`. Eleven-stage reads measured 282, 227, 220, 206 and 208 ms in this run; this is a local observation, not a performance acceptance threshold. The residual-work row and its actual outstanding-work route are asserted in the compiled browser proof.

## Main merge verification, 21 September 2026

PR #269 reconciles main `b4806af` (PR #268) with pre-merge PJ-09 `ae077b6`. EN-06 keeps the refined two-row/grid register and direct workspace entry. EN-07/EN-08 retain their existing flex composition in `engineering-review-base.css`; breadcrumb rules are scoped to the matching modules, preserving PJ-09's compact Projects breadcrumb. The EN-06 status duplicate was combined with the actual PR #265/#268 merge history. No database migration, grant, command namespace, receipt or output template changes belong to this reconciliation.

Executed on Windows with the pinned Node/Chrome stack above:

- `npm run typecheck`, `npm run lint`, `npm run build`, `python scripts/check_foundation.py`, `python scripts/check_naming.py` and `git diff --check` passed.
- Existing `tests/browser/engineering-materials.spec.ts` and `engineering-changes.spec.ts`: **9 passed, 9 intentional platform skips, 0 unexpected or flaky**, 77.813 seconds. Compiled build `mpkMDIGGCGBz1Wqj4klTg`, test server 3011, `ppo_synthetic_test` at 55439. A temporary Playwright config retained the original assertions, helpers, desktop/mobile project names, 1440×1000 / 390×844 viewports and Chrome channel; only the base URL/server ownership changed. Command: `npx playwright test -c tmp/pj09-merge.config.ts`. [Case results](main-merge-2026-09-21/engineering-browser-results.json).
- After the EN-08 phone correction below, the final compiled build is **`1nNig3oTUTIkTxkk5GAZb`**. `PJ09_REVIEW_ORIGIN=http://127.0.0.1:3001 node --env-file=.env.local --import tsx scripts/check-project-acceptance-browser.ts` passed again: six views, selection/Back, independently rendered r22 tags, loaded Roboto, flush edges with the deliberate gutter negative control, menu/inspector states, narrow desktop and 390px layouts. [Measurements](main-merge-2026-09-21/browser-results.json), [1920px menu and inspector](main-merge-2026-09-21/1920-open.png).
- `node --env-file=.env.local --import tsx scripts/check-project-acceptance-zoom.ts` passed again on the final build: real Chrome Page zoom 200%, CSS viewport 960×600, inspector/dialog controls, focus and Escape, no page overflow. [Zoom result](main-merge-2026-09-21/zoom-results.json).
- EN-08 read-only native check followed Greenhouse 01's actual permitted source from PJ-09, visited its register and five detail views, checked the retained flex context, flush table, 220px docked menu, 480px desktop inspector, 390px phone inspector, reachable close button and phone menu/Escape. Command: `node --env-file=.env.local --import tsx tmp/pj09-merge-en08.ts`; this temporary harness reads the existing synthetic fixture and makes no domain mutations. [Measurements](main-merge-2026-09-21/en08-results.json), [desktop](main-merge-2026-09-21/en08-desktop.png), [phone](main-merge-2026-09-21/en08-phone.png).

The EN-08 phone check exposed the existing `inset:0` inspector beneath the shared header's higher stacking level: its close button was covered. The same declaration is present at `ae077b6`; the [before capture](main-merge-2026-09-21/en08-phone-before.png) records the failure. Reserving the shared 64px header fixes it, and the final check clicks the actual close control without force. Earlier temporary-harness errors (an esbuild helper inside `evaluate`, a wrong detail selector and the desktop name used for a phone menu) were corrected to the actual components before the final passing run; no application assertion was relaxed.

The EN-06/EN-07 suites preceded only that EN-08-scoped phone inset change; the final EN-08 and PJ-09 checks include it. Original screenshots and restart/decision evidence elsewhere in this directory remain unchanged. PostgreSQL suites and restart proofs were not repeated for this UI-only merge; their earlier evidence remains separately identified above. CI on the pushed merge commit, owner acceptance, physical-device review and hosted deployment remain distinct from these local checks.
