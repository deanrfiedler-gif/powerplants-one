---
document_id: PPO-AUDIT-CONTINUATION-HO
revision: r06
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Source components reviewed; combined E2 and performance integration awaiting CI
source_commit: b8d3369626810c18bd430d57ba251114934dbfb1
---

# Repository audit continuation

Dean authorised the audit's next ten tasks and asked Codex to continue until his input is genuinely necessary. This is the current writing session, using isolated checkouts in workspace `8a52d8ce4e35`. Existing working copies and issued originals are preserved. GitHub PRs/issues retain exact source, CI, merge and failure evidence; this file records scope and remaining work, not its own future publication.

## Current evidence

Current main `b8d3369626810c18bd430d57ba251114934dbfb1`, tree `845971cd7eeceafd939914d776d1f00747739289`, contains normally merged #169 and #171. Their exact sources passed all 17 and 16 checks respectively, including the broad application suite; all 16 E2 screen originals were reviewed. Current-main compiled browser, E1 and CRM jobs passed; its broad application run is still in progress at this writing.

The earlier E2-foundation main `3a27728c`, tree `5f19f79eeb7c4322c47fcffae740af429843bb7e`, contains the owner-merged E2 foundation #168 after the verified P12/transfer/taxonomy integration. All twelve actual-main checks passed; broad Application `34811459586` / job `103873481814` passed 103 unit (100 plus three preparation cases), 400 DB, 26 HTTP and 168 browser cases plus three skips, retained component/restart proofs and P12 isolated restore in 71.040 seconds. #168's corrected source passed all thirteen checks, including 103 unit, 400 DB, 26 HTTP and 168 browser cases plus three skips. This does not certify changed E2 workspace or costing source.

Earlier main `aeaf966a` and reviewed source `d28cfc25` have the identical tree `11c4e91f5fb9c67cfb5aed8947f3232453e31c9e`. Actual-main Application `34805010402` / job `103855071686` completed successfully: 90 unit, 393 DB, 26 HTTP and 168 browser cases plus three explicit skips, retained component/restart proofs and the P12 test in 74.104 seconds. #165's bounded implementation is published and closed. PT-22's executed synthetic procedure and reviewed original restore evidence are reconciled in the [P12 handover](p12-handover.md); full PT-28/PT-30 and owner acceptance remain open.
Issues #129, #135 and #136 are closed with evidence. Actual-main CRM run `34805010388` / job `103855071697` passed 44 database cases, 23 browser cases with two explicit phone drag skips, 13 retained I2 cases and the actual restart proof. Desktop refused-drag/Undo and accepted-lost-response recovery passed; native keyboard stage movement passed on desktop and phone. The omissions in those three issues are repaired; full business/device acceptance is separate.

Taxonomy #164 and the later duplicate transfer PR #174 are closed as incorporated. All 1,168 blob paths on #174 head `310291c9` were compared with current main: every runtime, migration, test and workflow file matches. Nine differing files are superseded README/status/register and handover records. No old feature-base merge was performed. #145 remains open for complete written HV and remaining original/independent review; combined code inclusion and actual-main component verification are complete.
Owner-triggered Azure run `34808448458` succeeded for `aeaf966a`, image `sha256:39fe553bcc1318a8bbbb9018bc4812ac0108d76c87c92ef6a6970a4381d2e00f`. Job `103864845600` records selected web revision readiness, matching worker image, health and anonymous refusal. This session inspected the logs and performed no deployment. Signed-in acceptance and actual managed PostgreSQL minor remain unverified.

Main's PT-27 load job `103855071769` completed all 320 core reads without error, but all 16 groups missed the candidate 3,000 ms p95. Warm values were 5,365–11,538 ms under the recorded CI development profile. PR [#175](https://github.com/deanrfiedler-gif/powerplants-one/pull/175) then completed 640 original development/compiled reads on one unchanged fingerprinted fixture. Every group in each profile still missed the candidate. All 16 original page PNGs and source/tree/run/hash manifests were reviewed; exact measurements and limits are in the [performance record](../decisions/ci-performance-profiles.md). The follow-through [#176](https://github.com/deanrfiedler-gif/powerplants-one/pull/176) defers the closed work-order scope editor until first opening and retains it afterward; the original benchmark and fixture are unchanged. Its performance job passed with 640 original successful reads; compiled warm work-order p95 is 2.623s desktop and 2.319s phone. Original archive/hash/fixture and all image manifests were verified, and the four original work-order PNGs reviewed. Eight of sixteen compiled groups meet the candidate; all sixteen development groups still miss it. Other views improved too, so this cross-run observation does not isolate causation or certify full PT-27.

## Ordered continuation

| Priority | Outcome | Remaining work |
|---|---|---|
| 1 | Current-main verification and accurate backlog | Verified #166 actual main; closed #129/#135/#136/#165 and duplicate #174; #168 now on main. New main passed; finish #145 complete-HV evidence without closing owner obligations |
| 2 | E2 backend | #168 and #169 merged; corrected #169 source `02fddd74` passed all 17 checks, including 412 DB, 28 HTTP and 168 browser cases plus three skips |
| 3 | Saved E2 screens | #171 merged after source `45de8e3e` passed all 16 checks, including broad 412 DB, 29 HTTP and 176 browser cases plus three skips. All 16 original E2 captures and exact manifests reviewed; combined integration remains |
| 4 | E2 manual-estimate receiving basis | #173 source `46d65048` passes 104 unit, 22 focused DB including all eight new cases, retained E1 HTTP/browser and real cost-basis write/recover/verify; compiled costing originals reviewed. Broad source and combined integration remain |
| 5 | Complete PP-01 acceptance | PT-22 synthetic execution reconciled as passed; full PT-28 compatible-update/scheduling-rule impact and continuous PT-30 narrative remain incomplete. Owner demonstration is separate |
| 6 | Performance | #175 original comparison reviewed; #176 closed-editor remedy implemented with proposal preservation and unchanged measurement. Original performance archive and changed-view captures reviewed; broad and combined integration remain. No threshold or timeout waiver |
| 7 | Hosted/device acceptance | Verify signed-in permitted journeys in the actual authorised environment and representative physical-device/screen-reader use; no new access or deployment assumed |
| 8 | E3 costing/review | [Concrete decision pack](estimating-e3-decision-pack.md) prepared: recommended manual-source slice, FX rounding alternatives, allocation conservation and reviewer/self-review choices; numerical/business decisions remain open |
| 9 | Projects coordination | [Current-code reconciliation and receiving contract](projects-j1-reconciliation.md) prepared: preserve Gantt semantics; add typed shared Activities and manual assessment in the next integrated migration |
| 10 | Supply Chain readiness contract | [Candidate contract and exact cases](../contracts/supply-chain-readiness.md) prepared across SCM-01–08; selected synthetic role/target/quantity/completeness choices and real ERP evidence remain open |

The E2 screen contribution reuses the maintained UI/domain architecture and existing workflow globs. It adds no workflow, dependency or new migration beyond #169's 0026. Local source `e554ad4` was copied and reverified in an isolated checkout, not overwritten. UI, API and source-definition components retain their separate review boundaries. Current permissions precede historical/receipt recovery; option selection never changes CRM forecast or stored quote bytes.

DR-03–DR-06, estimating-container propositions, E3/E4 operational rules and Finance/MYOB ownership remain unresolved where the current contracts say so. This continuation does not invent formulas, pricing thresholds, corporate roles or approval authority. Repository implementation does not authorise paid services, access changes, live integrations, customer messages, operational migration or another hosted release.


## Current E2 failure dispositions

#169's original source failed two DB fixtures (an empty required system selection and a Site grant missing its explicit `site_id`) and an HTTP expectation reading the CRM envelope at the wrong level. Corrections keep the domain constraints and assertions. #171's original compiled run `34809674630` failed the two stale-proposal cases because checkbox enumeration preceded rendering; corrected run `34811201250` passed 176 cases plus three explicit skips. Current source `45de8e3e` also passed its compiled suite. Direct archive-host access initially failed; supported file-reference materialization subsequently succeeded. All 16 corrected-source originals in artifact `10336190630` were inspected, with ZIP integrity and every image manifest verified. This does not turn the original failed source into a pass.

#173 source `285e78d6` failed restart run `34812983052` at first costing COMMIT because SQL alias `old` conflicted with the trigger record. Corrected `578125c1` uses `predecessor_basis` with identical constraints. Run `34813617871` recorded two exact cost-version bases, seven original receipts and the stored interrupted quote, then its runner shut down during recovery. Only that failed job was rerun on unchanged source; attempt 2 also received a runner shutdown. Review found a definite JSON Buffer-checkpoint mismatch in the proof; #173 now retains original bundle bytes separately and compares exact key/bytes/hash after restart. Source `46d65048` passed all write/recover/verify phases and the eight newly registered focused DB cases in run `34815664425`. Its original restart and compiled screen artifacts were reviewed. No shutdown cause is claimed; earlier failures remain failures. Broad and integrated verification are still required.

## Combined contribution

Branch `feat/audit-integration` combines the exact #173 E2 source (including #169/#171), #176 performance follow-through (including #175) and #172 audit/receiving documents. Documentation conflicts were resolved against the current evidence while preserving every runtime component. No workflow, dependency, issued source or historical payload hash is changed by integration. Full source verification and original evidence review remain prerequisites to normal merge; the resulting actual-main tree needs its own verification. Separate PRs retain their original failures and component histories until inclusion is published.

The integration also closes a specific CRM evidence gap. Original transfer archive `10327701645` was downloaded and verified (6,771,809 bytes, SHA-256 `516a1274706b300e62cf013e9f370aaf95c9b8842c542f9834c87126d319cefe`). Desktop text wraps, but the 390/320px locator screenshots named full comparison are clipped by the scroll container and fixed dialog regions. They cannot demonstrate the entire Activity text or consequence. The existing browser case now adds overlapping original viewport captures while scrolling the unchanged dialog, with exact source/tree/run/viewport/PNG hashes and covered intervals. It exercises a 2,000-character Activity and retains the 1,000-character reason and existing keyboard/save checks. No CSS, dialog resizing, stitched image, assertion removal or timeout increase is used. Fresh originals remain to be reviewed; complete HV/AT-25 and independent device/owner acceptance remain open.


## Broad costing HTTP finding

The #173 source `46d65048` passed all 420 database and 178 browser cases plus three skips, but one of its 30 HTTP cases failed: the test JSON-parsed the local server origin guard's intentional plain-text 403 refusal. The corrected raw-response assertion preserves that guard and all actual API JSON assertions. The complete case now registers once through the existing required estimating HTTP entrypoint, alongside the three retained cases, and is removed from the standalone full-suite glob. The same correction is included in this combined source. This is a proof correction, not an application change; original failed source results remain failed. Corrected-source CI, normal integration and current-main verification remain required.

The independent #172 documentation source completed broad Application `34816131759` / job `103887084514`: 100 unit plus three preparation cases, 400 DB, 26 HTTP, 168 browser cases plus three skips, retained restarts and the P12 isolated restore test in 69.842 seconds. Its documentation is incorporated here; its older runtime tree does not certify this newer E2 integration.


## Development-browser request-count correction

The original #176 and `7bfde787` broad browser reports each contain two P04 failures: the new instrumentation expected one first-open asset request while the development client's Strict Mode effect replay produced two. The reports and all four original failure PNGs were inspected; 166/176 other cases passed respectively, with three explicit skips and no flaky retries. The corrected assertion uses the declared development/compiled launcher to require exactly two/one initial requests, still zero while closed and no additional request or lost proposal on reopening. Application behavior, Strict Mode and every existing invalid/stale/keyboard assertion remain unchanged. The [performance record](../decisions/ci-performance-profiles.md) retains original archive hashes, the slower integrated measurements and this exact correction. Current-source CI is required before integration.
