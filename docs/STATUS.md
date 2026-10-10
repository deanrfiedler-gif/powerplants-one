# Current prototype status

**Updated:** 10 October 2026 (Australia/Brisbane). **Owner:** Dean Fiedler. Public repository; private synthetic prototype and demo. Code delivery, automated verification, visual review, owner acceptance and deployment are separate facts.

**Naming authority:** [PPO-STD-001](standards/naming-conventions.md) and [ADR-0005](decisions/ADR-0005-project-naming-adoption.md).

## PT-30 integration rehearsal — 10 October 2026

Dean authorised review/integration of PT-23 #387 and PT-29 #389 and preparation of the next owner walkthrough. The [decision](decisions/pt30-integration-rehearsal.md) joins both with PT-01 on candidate `caecf7b`; updated-head PR checks and merge remain separately recorded. The [fresh execution](testing/evidence/pt30-integration/README.md) passes all four compiled narrative phases and a settled-history recheck. Actual app/database restart preserves 368 compared tables, eight stored files and the migration ledger; the separate return preserves original Service/Finance outcomes and stored bytes. No runtime change is required. Test refinements wait for the completed history panel before capture and for a dropped Products response to settle before receipt recovery. The latter CI race is reproduced on unchanged main; its failure, correction and rerun remain separate in the execution record.

The [readiness record](testing/pt30-integration-readiness.md) and [current owner walkthrough](delivery/field-integrated-owner-walkthrough.md) use a fresh private session and exact saved entry records. The earlier session remains intact. PT-13's summary is reconciled to its retained approved-correction backend proof, PT-18's completed movement evidence is separated from its remaining channels, and PT-27 retains later source-specific timing misses. H01–H11, independent review, other applicable prerequisite dispositions and actual owner/device/accessibility observations remain pending. No full PT-30 acceptance or deployment is claimed.

Main advances to `794aee6` with PT-02 evidence and instruction edits during CI. Final integration uses combined PR #390, preserving main's exact PT-02 case/source, the reviewed PT-23/PT-29 ancestry and both document-register additions. The runtime remains the rehearsed source; final combined-head CI and merge remain separately recorded in that PR.

## PT-29 screen states — 10 October 2026

The authorised PT-29 continuation integrates PT-01 main `8869437` and completes the selected fifteen-screen desktop/phone state checklist. Thirty browser scenarios plus the 672-route warm-up pass: visible populated records, honest loading/error/empty or unavailable states, actual Systems denials, retained save/upload input, exact-byte recovery, partial account observations and applicable stale actions. The [decision](decisions/pt29-screen-state-verification.md), [checklist](testing/pt29-screen-states.md) and [execution evidence](testing/evidence/pt29-screen-states/README.md) record the precise source, build, injected-versus-real boundaries and corrected test-driver failures. This contribution changes tests and documentation only. Build, type/lint, studio and repository assurance are recorded separately; the existing design review status is preserved. The execution ledger records a bounded combined synthetic PT-29 pass; the original catalogue and 78 parent IDs are unchanged. PR CI, independent review, owner-led PT-30, physical devices, wider AT-23 acceptance and deployment remain separate.

## Controlled output generation and recovery — 10 October 2026

Dean authorised PT-23 in the isolated `codex/pt23-output-recovery` session alongside Claude's UI work. The joined OUT-09/OUT-10/OUT-14 tests challenge storage failure, corruption before release, rollback inside finalisation, concurrent original retries and source/template changes. Unchanged main reproduced a pack release without a final stored-byte check and a Finance retry that released an attempt previously observed against a changed template. The pack worker now rereads its exact bundle inside finalisation; Finance retains `TemplateUnavailable` as `StaleSource` for review. No template definition, migration, grant or UI file changes.

All 12 recovery scenarios and two long journeys pass locally. Eight retained PDFs cover 89 inspected pages; sparse-page and split-row observations remain open for template review. The [scope decision](decisions/controlled-output-recovery.md) and [verification record](testing/evidence/controlled-output-recovery/README.md) distinguish actual issued long outputs, an unissued twenty-asset pagination fixture, source-bound tests and page inspection from independent/owner approval. PT-01 PR #386 is separate. This contribution does not merge or deploy either branch.

## Icon style decision — 10 October 2026

After a local comparison of the app's icons with Font Awesome Classic Light, Regular and Free, Dean chose Font Awesome Pro Classic Light, with Classic Solid for selected items. [ADR-0050](decisions/ADR-0050-font-awesome-light-icons.md) records the decision, the comparison mapping and the delivery options. Packages need annual billing, so Dean chose to stay on the monthly plan and load the icons through his Kit script on online pages; the offline field workspace keeps its local shapes. Kit limits, licence terms after a lapse, the Kit's allowed addresses and the full icon mapping remain open. Dean then asked for the build. The first increment maps the 198 names in the five shared icon sets and loads the Kit when `PPO_FONT_AWESOME_KIT` is set. Every icon keeps its local drawing until the Kit is running, so CI, offline use and outages are unaffected. A second increment maps the nine module icon sets (81 names), keeping the job pack's accepted r03 drawings as the fallback. The hosted demo's Kit address and Dean's visual review remain. Pro icon files and captures stay out of this public repository.

## Same-name customer mapping and backend integration — 10 October 2026

Dean authorised sequential review/merge of #379, #380 and #381, combined verification and the next PT-02 proof alongside Claude's UI work. All three PRs merged in that order on 10 October after 51 successful checks each, preserving their evidence and register entries. Combined main `e5a9473` has the same file tree as reviewed #381 source `f4ade08`; all 41 focused backend scenarios pass on the actual merged commit. The [integration record](testing/evidence/same-name-finance-mapping/README.md#validation-and-integration) retains exact heads, check links and the separate interrupted local attempt. Post-merge CI is recorded separately; no deployment is included.

PT-02 now has a [joined synthetic backend proof](testing/evidence/same-name-finance-mapping/README.md): new Q01 work, issued Service evidence, wrong-company and absent/ambiguous account refusal, stale mapping blocks through dispatch, and exact immutable debtor identity through target/reconciliation and later mapping changes. Six nested checks, including unversioned debtor-case drift, pass on test source `da0c096`; existing runtime satisfies the exercised contract. [Decision](decisions/same-name-finance-mapping.md). The acceptance ledgers retain the distinction between this technical pass, conceptual VAL-01 versus actual runtime codes, SyntheticVerified context, and independent/owner/operational acceptance. No UI or production integration changes.

## Parallel backend access and recovery — 9 October 2026

**Current PT-01 contribution — 10 October:** Dean authorised completion of the company/site, search, notification, export and document-download matrix alongside Claude's UI work. Repository writer for this backend scope: `codex/pt01-permissions-matrix`, isolated from main `e5a9473` and Claude's UI worktrees. The [decision](decisions/permissions-matrix.md) and [joined matrix evidence](testing/evidence/permissions-matrix/README.md) cover eleven identities and the written PT-01 procedure. Four storage-time failures on unchanged main exposed field-photo metadata/bytes and response marks after grant expiry. Reusing current authority checks fixes those paths without a migration, seed, grant, dependency or UI change. All 47 final matrix scenarios, 24 retained download scenarios, nine field/photo/response regressions and 18 focused units pass. Build, typecheck and lint pass; repository assurance is recorded in the evidence. The design register retains 28 stale reviews. Contribution CI/review, merge, deployment and owner acceptance remain separate. This source baseline includes the merged #379/#380/#381 work described at its earlier checkpoints below.

10 October continuation: Dean authorised reconciliation of #379/#380 and PT-13 approved time/material correction proof in the isolated `codex/approved-evidence-corrections` session alongside Claude's UI work. #378 is merged. #380's document-register conflict was resolved with both contributions retained; its nine scenarios pass on the integrated branch. #379's 16 download scenarios pass after its main integration; blocked Copilot-triggered checks were restarted under the owner account. The subsequent authorised sequence merged #379, #380 and #381 after their checks passed, as recorded above. Earlier contribution checkpoints remain retained; no deployment is claimed.

The joined PT-13 proof exercises both approved unprocessed and reconciled synthetic handoffs: immutable 90 MIN / 2 EA originals, reasoned 75 MIN / 3 EA successors, fresh Service/Finance review and preservation of processed outcomes with a linked correction request. Existing runtime behaviour satisfies the exercised contract; this contribution adds tests and [evidence](testing/evidence/approved-evidence-corrections/README.md), with its [scope decision](decisions/approved-evidence-corrections.md). Independent review, owner/device observation, operational accounting policy and full PP-01 acceptance remain open.

Dean authorised backend permissions and recovery work alongside his UI work in Claude. The isolated `codex/backend-access-recovery` contribution starts at main `184b933` and leaves UI files/worktrees untouched. Four actual HTTP job-pack download challenges reproduced a permission revocation gap during storage on unchanged main. The backend rechecks current exact-issue/render-job authority before returning HTML/PDF or recording retrieval. Eight focused scenarios now pass, including company/site/search/notification isolation and exact original recovery after a dropped successful response. [Decision](decisions/backend-access-recovery.md) and [evidence](testing/evidence/backend-access-recovery/README.md). Complete PT-01/PT-18/PT-30, independent/owner review, contribution CI, merge and deployment remain separate.

## UI build and review sequence — 9 October 2026

Dean asked for one page showing every UI page still to create or refine, in working order from the home page. The [record](decisions/ui-build-sequence.md) derives the [sequence](design/development/ui-build-sequence.md) from the live register and the issued r02 build plan using `scripts/build-ui-sequence.py`. No rank, scope ID or issued byte changes.

- **Coverage:** all 350 register entries are accounted for: 347 placed in phases 00 to 11 and 3 development-tool routes excluded.
- **Workload:** 190 entries are built and awaiting owner review, 105 are to refine, 46 to build and 6 await a scope decision. 28 phase 00 entries have an owner visual review, stale after refinement batch 1.
- **Adopted rules:** Dean adopted SD-01 to SD-05 on 9 October and started the phase 00 review. The review track starts at phase 00, which contains the home page, My Work and the existing service and field baseline. The build track starts at phase 01 with AD-01.
- **Phase 00 review, session 1:** Dean accepted the proposed verdicts on 9 October. 28 owner visual reviews are recorded and 2 are deferred. Refinement batch 1 fixed shared findings S1, S2, S4 and S7 in the shell and withdrew S3 after verification ([evidence](testing/evidence/ui-refinement-batch-1/README.md)). The 28 reviews are now stale, as intended. The [evidence](testing/evidence/ui-review-phase-00-r01/README.md) holds 42 captures, automated checks and shared findings S1 to S9. The verdicts are 7 accept, 5 minor, 16 refine, 1 own session and 1 later phase.
- **Phase 00 refinement canvas:** proposed shared rules S5, S6 and S9 and My Work layouts are on a [separate canvas](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E). On 9 October Dean adopted S6 with 24-hour times, S5, S9 and all four My Work proposals, including the working-company prefill on Create activity ([record](decisions/ui-build-sequence.md#owner-decisions-9-october-2026)). Refinement batch 2 built them on the My Work pages, with the S6 formatter and the My Work guide ([evidence](testing/evidence/ui-refinement-batch-2/README.md)); owner re-review is pending. Proposals for the Sales and Service phase 00 pages are now on the canvas and await Dean's decision ([record](decisions/ui-build-sequence.md#sales-and-service-pages-on-the-canvas-9-october-2026)). On 10 October Dean adopted planner working hours: calendars published 07:00 to 18:00, with a warning outside the 08:00 to 17:00 standard hours. This is not built yet ([record](decisions/ui-build-sequence.md#planner-working-hours-10-october-2026)).
- **Display:** shown as the UI build sequence board on the navigation canvas. The repository is the authority, and the board has no retained capture.

## Navigation architecture proposal — 9 October 2026

Dean requested a six-domain navigation architecture, seven improvements and then an audit. The [record](decisions/navigation-architecture-board.md) retains a private claude.ai board as [r02 captures](reference/ui/application-shell/navigation-architecture-board-r02/README.md): 33 hashed images and two Mermaid sources. The earlier r01 set is retained unchanged. The board:

- maps the six domains onto the seven built department rails and a Reports workspace;
- proposes rules NR-01 to NR-20 and NR-A1 to NR-A7, and handovers HO-01 to HO-23;
- adds a record page pattern, a record relationship map, and landing, routing and access-scope tables;
- wireframes existing scopes RP-01, RP-05 and PJ-02 at 1440, 390 and 320 px;
- records audit findings AU-01 to AU-23 with their resolution.

Dean adopted NAD-08, the Reports workspace, as a design decision, then approved professional refinements generally. Under that approval:

- **Adopted:** NAD-01, NAD-02 (design), NAD-03, NAD-05 and NAD-06. NAD-04 and NAD-07 remain open.
- **Built in the shell:**
  - per-page browser titles (AU-01);
  - the Sales phone bar hides unavailable destinations (AU-23), and a dated /crm routing note is added;
  - number search for work orders and estimates (AU-13, partly);
  - a working company chosen in the account panel, which narrows every access check that names a company (shared record scope and company-level permission checks) and never widens access; migration 0077 (AU-02);
  - a grouped Service operations rail (AU-08).
- **Still open:** quotation and purchase-order number search, AU-07 speed, AU-14 tree test, and owner visual review of the new shell controls.

The captures are linked from `system:shell` and those scopes.

The board itself is design reference only. The shell increments add migration 0077 (`ppo.working_companies`) and one API route (`POST /api/v1/shell/company`). They add no capability, grant, seed, user or scope. No owner visual review is recorded.

## Current bounded step — Customers first load

Repository writer: **Audit powerplants-one repository**, branch `codex/customer-first-load`, based on merged main `dcec2cf05e82e1eaf2c7f90f136701d080cb6248`; **Find the next project step** reviews read-only. Dean authorised verification of merged main/the already-running demo update and one bounded first-load correction. [Decision](decisions/customer-first-load.md) and [evidence](testing/evidence/customer-first-load/README.md).

The unchanged notification bell now has its own client module, so the global shell no longer pulls in the full Notifications/My Work workspace on Customers. Local cold JavaScript transfer falls from 257,595 to 225,730 encoded bytes (12.37%); CSS is unchanged. Both builds pass 12 directory samples and six actual record visits. Three-context timing medians improve modestly; no ten-user, hosted or whole-app target attainment is claimed. Eight selected compiled functional cases and two warm-ups pass. Contribution CI/review remains separate; no merge or deployment is part of this step. Stop at its handover.

## Merged quality increments — #370–#373

GitHub confirms all four contributions merged by 9 October Brisbane time. Their original source-specific failures, corrections and evidence remain retained; earlier draft/next-step language is historical.

| Contribution | Delivered result | Evidence and remaining boundary |
|---|---|---|
| [#370](https://github.com/deanrfiedler-gif/powerplants-one/pull/370) | Large-queue completion/timer handoff, scoped directory query and independent PPO product direction | [Quality evidence](testing/evidence/product-quality-next/README.md); full-page performance and owner/device acceptance remain open. CREMS is historical background. |
| [#371](https://github.com/deanrfiedler-gif/powerplants-one/pull/371) | Exact submitted Service photo inspection with current review authority | [Photo evidence](testing/evidence/report-photo-inspection/README.md); private output boundaries retained, owner/device review pending. |
| [#372](https://github.com/deanrfiedler-gif/powerplants-one/pull/372) | Local compiled asset caching plus gateway/timing diagnosis | [Loading evidence](testing/evidence/customer-loading-diagnosis/README.md), [gateway evidence](testing/evidence/customer-server-diagnosis/README.md); old 120-second phone timeout and timing target remain open. |
| [#373](https://github.com/deanrfiedler-gif/powerplants-one/pull/373) | Directory links load destinations on activation | [Navigation evidence](testing/evidence/customer-directory-prefetch/README.md); actual receiving/saved views verified, zero customer-record prefetch in the probe. Prior ten-user CI still misses 12/16 compiled timing groups. |

## Merged recovery verification — 8 October 2026

Completed recovery verification: PR #369 at `723613d` passed all 51 checks and merged at 09:30 UTC on 8 October into main `f0953c5`. Its source baseline was `11e8298e6270c085d3ed149208a524ddeb52395c`. Dean requested proceeding with the audit roadmap: reconcile the release record and join PT-11/PT-12/PT-24's recovery procedures. [Decision](decisions/offline-recovery-acceptance.md) and [execution record](testing/evidence/offline-recovery-acceptance/README.md). The 35-case selected offline regression passed on desktop and phone. Strengthened exact-100 replay passed 3/3 including warm-up; authorised-scope/issued-pack successor checks passed 5/5 including warm-up. The live ledger records combined synthetic proof; the later large-queue UI handoff belongs to the current increment. Owner/device acceptance and deployment remain separate from #369’s completed CI and merge.

## Merged navigation and correction

GitHub records [PR #368](https://github.com/deanrfiedler-gif/powerplants-one/pull/368) merged on 8 October at 06:07 UTC. Its head `31d8fe0f19be2decca99432d3336cda4fcd3e6da` and main `11e8298` have the same tree, `2db3f8524e854d6ebb96a409fce10afa3f0a2a7b`. The PR head passed 51 checks, including 629 unit tests on Ubuntu; main passed all 50 checks. The [current-page correction evidence](testing/evidence/navigation-current-page/README.md) retains the original desktop/phone reproduction and four pointer/touch/keyboard regressions. Windows unit limitations and earlier failures keep their original evidence; no hosted deployment or owner acceptance follows from these passes.

[PR #367](https://github.com/deanrfiedler-gif/powerplants-one/pull/367) merged at 03:49 UTC after 54 successful checks; #366 merged at 00:58 UTC after 51. The [repair evidence](testing/evidence/pr366-pr367-repair/README.md) separates environment cancellations, source defects and fixture corrections. These sessions are complete; pre-merge checkpoints remain in Git and their original ledgers.

The [navigation implementation](delivery/navigation-implementation.md) delivers permission-aware entry/workspaces, canonical Equipment/Activity links, all-of Inspection review, shared leave intent, truthful recovery, partial quotation continuation and URL state. The [runtime matrix](testing/evidence/navigation/README.md) still has six bounded passes, 27 partial scenarios and one deferred login-return scenario. [Regenerated destination coverage](delivery/department-navigation-coverage.md) records 57 wired positions among 68 department-rail positions, and 62 ready destinations among 75 distinct catalogue entries. Source presence, runtime coverage, device review and owner acceptance remain distinct.

## Integrated journey checkpoint

Completed delivery session: **Find the next Powerplants One step**, isolated branch `codex/integrated-journey-acceptance`, based on main `4f883d145b18876840c5ce5522059c95448dc086`. Dean authorised a connected synthetic customer journey, demonstrated gap fixes, status reconciliation, owner-walkthrough preparation and refresh of the existing private demo after verification. [Decision and boundaries](decisions/integrated-journey-acceptance.md).

The connected scenario follows the same Lead, Deal, accepted estimating brief, discovery revision, manual cost version, released quotation and staff-recorded response into an explicitly recorded Won outcome, native Project receiving and an owned returned Lead. Both desktop and phone pass; the six surrounding suites pass 43 cases with one existing mobile-only skip. A real retained-cluster restart preserves 367 checked tables, the 75-entry migration ledger through 0076 (0016 remains reserved) and 19 exact stored files. Native HTTP preparation and browser handovers remain separate from human acceptance. Initial harness failures and final evidence are retained in the [execution ledger](testing/evidence/integrated-journey/README.md); no application defect was demonstrated. The [owner walkthrough](delivery/integrated-journey-owner-walkthrough.md) awaits actual observations.

The root checkout and pre-existing worktrees/databases remain unchanged. Excel import is preserved and outside this task.

## Observed source and deployment

| Area | Current observation | Limit |
|---|---|---|
| Main | `dcec2cf`, merging #373 after #370–#372. [Release snapshot](testing/evidence/customer-first-load/release-snapshot.json) records actual main check states. | Main checks are still in progress at the snapshot; prior PR passes do not substitute for them. |
| PR assurance | #373 head `4738572` completed 51 successful checks before merge; prior contributions retain their exact histories. Current first-load contribution has separate source/check identity. | Source review, contribution CI and owner acceptance remain distinct. |
| Private demo | Externally initiated [Azure update 37842108771](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37842108771) successfully deployed `dcec2cf`. Existing invited sign-in reopened a saved customer, quotation Draft and exact HTML revision 1. | This first-load extraction is not deployed. No duplicate update; actual worker execution, managed PostgreSQL minor and owner acceptance remain separate. |
| Database | Main registry ends at **0076**. Former reserved slots **0051 Maintenance/Warranty** and **0052 Products** are implemented and merged. Fresh isolated installation/seed completed for this task. | Preserve applied bytes and exact upgrade/reseed ledgers; this task adds no migration or grant. |
| Complete PP-01 acceptance | P01–P12 code and written PT-22 recovery are delivered; Scheduling Step 6 records the bounded PT-28 local synthetic procedure pass. | Full PT-30/PP-01, owner/device/accessibility acceptance and benefit measurement remain open. |
| Performance | Prior #373 [CI evidence](testing/evidence/customer-first-load/pr373-profile-comparison.json): 320 samples/profile, zero failures; 12/16 compiled groups miss the three-second target. Current local extraction removes 31,865 cold JS bytes; descriptive three-context timing and exact record checks are in its own evidence. | Successful collection and reduced transfer do not establish ten-user, hosted or owner/device performance acceptance. |

## Delivered programmes and remaining boundaries

| Programme | Delivered source | Remaining boundary |
|---|---|---|
| Shared platform | SH search/views/notifications/review coordination and Git-backed development workspace. [SH handover](delivery/sh-platform-handover.md), [design workflow](design/development/README.md). | Source adapters, canonical teams, guide/visual and owner acceptance. |
| Customers and locations | Native CS, Facilities and durable readiness. [Handover](delivery/cs-native-completion-handover.md). | Operational definitions, live integration and owner/device review. |
| Equipment | EQ-01–09 through #302, migration 0045. [Handover](delivery/equipment-native-completion-handover.md). | Owner/device and operational acceptance. |
| Sales and continuity | CR-01–05 through #303; Lead context/ownership, accepted estimating brief, exact commercial evidence, outcome provenance, native receiving and reviewed return-to-Sales through #359–#365. Joined current-main desktop/phone proof passes. [Contract](contracts/lead-to-delivery-continuity.md). | Owner/device acceptance and external commercial authority remain separate. |
| Engineering | EN-01–05 through #305/#307, migration 0047; existing EN-06/07/08 engines retained. [Handover](delivery/engineering-native-control-handover.md). | Technical authority, family review and owner acceptance. |
| Estimating | Discovery/manual cost sources, ES-04 review, ES-05 release, ES-06 response, ES-07 conversion/disposition and Supply/Project continuation through #356. [Programme](delivery/estimating-programme-handover.md), [diamond handover](delivery/quotation-task-diamond-handover.md). | Excel import, ES-09/10, accepted Screen geometry, ES-02 decisions/source obligations and independent acceptance. Earlier ES-04–07 “not implemented” checkpoints are historical. |
| Scheduling | S1–S5, refinement #315, policy publication Steps 1–5 and Step 6 technical verification through #333. [Policy handover](delivery/scheduling-policy-impact-handover.md). | Owner/device acceptance and full PP-01 obligations; publication is online only. |
| Service | Request register I1/I2, Job Pack integration, controlled return journeys and native Won receiving through #364. [Programme](delivery/service-operations-programme.md). | Remaining SV scopes, request refinements and PT-30 owner prerequisites. ADR-0043 lifecycle proposal remains separate. |
| Field and quality | Timer/offline #321, return evidence #322, inspections #334, incidents #335, customer response #336 and closed-visit guidance #337. [Acceptance ledger](testing/field-integrated-acceptance-ledger.md). | Owner-led PT-30 demonstration, prior-case adjudication, physical device/screen-reader/visual review and benefit measurement. |
| Supply Chain | SC-01–10 through #317; later exact Supply receiving/correction and ES-07 coordination retain native authorities. [Handover](delivery/supply-chain-native-handover.md). | Synthetic coordination; ERP authority, business and visual/device acceptance remain separate. |
| Projects | Native project/programme/acceptance foundations, A0 reconciliation, exact dependency continuation and Won receiving. [Programme](delivery/projects-completion-programme.md). | Broader A1–A8 coverage and PJ-07 controlling r02 source gap require reconciliation against later bounded increments; no blanket completion. |
| Maintenance/Warranty | #357 merged; migration/seed 0051 and native Service/aftercare integration. [Handover](delivery/maintenance-warranty-handover.md). | Supply return receiving, live ERP and owner/business/device review. |
| Products | #358 merged; migration/seed 0052, catalogue/publication/pricing/compatibility/synthetic import and exact revision recovery. [Handover](delivery/products-native-handover.md). | Owner/business/device review; synthetic source context does not grant ERP pricing authority. |
| Excel estimate import | Unfinished local implementation and [bounded plan](delivery/excel-estimate-import-plan.md) retained. | Inventory and reconcile against current main before a separate implementation; no new work in this pass. |
| Finance and external systems | P10 controlled synthetic Finance handoff/reconciliation. | MYOB tenant evidence and live integration remain unproven; SharePoint and CAD authority unchanged. |

## Required checks and open obligations

The protected-main required contexts were read on 8 October: **Check documentation foundation**; **CRM desktop and mobile persistence and interaction proof**; **CRM header and board visual checks**; **Desktop and mobile browser suite against the compiled application**; **E1 manual estimate, draft output and restart proof**; **Email Calendar persisted journey and server permissions**; **P01–P11 and CRM I1–I2 local application and PostgreSQL proof**. Exact configured names remain unchanged. Source self-review is separate from independent review.

- Preserve migration/seed/grant assertions through 0076, including installation of earlier reserved slots after later applied versions and hosted upgrade preservation. Main's 0051/0052 supersede old unfinished 0049 proposals. [Consolidation decision](decisions/repository-consolidation.md).
- #120/#121 and older delivery records need evidence reconciliation, not automatic reimplementation or blanket closure. #145/#167 retain acceptance boundaries; #160 retains the managed PostgreSQL minor obligation. Source/policy work in #2/#10/#12/#13/#15/#16/#66/#76 remains separately scoped.
- The [decision register](decisions/decision-register.csv), current domain decisions and [quality plan](delivery/product-quality-plan.md) retain their authority. Operational policy, MYOB evidence and role/source gaps are not resolved by synthetic fixtures. CREMS reconstruction is superseded by the current independent PPO direction; source-bound operational claims remain separate. Items still held back or shaped by CREMS are recorded for later uplift in the [CREMS constraint uplift backlog](delivery/crems-constraint-uplift-backlog.md) (CU-01–CU-21; register only, no work authorised).
- [Field owner walkthrough](delivery/field-integrated-owner-walkthrough.md), [benefit instrument](testing/field-benefit-measurement.md) and the joined journey retain their own source and review boundaries. A test pass is not a participant observation.
- Maintain the [project instructions](standards/chatgpt-project-instructions.md), [blueprint](blueprints/BP-01-master-blueprint.md) and [design workflow](design/development/README.md). Pending visual reviews stay visible; no review fingerprint is invented.

## Boundaries and history

No production integration, operational migration, business transaction or customer communication is authorised. MYOB remains intended ERP authority, SharePoint business-document authority and native CAD authoring authority. The application refuses production startup.

All 78 parent IDs and issued reference bytes remain unchanged. The 24 Core, 25 Partial and 29 Deferred dispositions classify scope; they do not record completion.

Earlier snapshots remain in [STATUS-log.md](STATUS-log.md) and Git history. This current snapshot replaces accumulated pre-merge chronology; earlier failures, repairs and source-specific evidence remain in their original handovers and ledgers. Historical branch, migration reservation, deployment and writing-slot statements do not override current source or GitHub observations.

## Document identity and recovery — 10 October 2026

The authorised PT-18 continuation adds regression proof on unchanged main `184b933`, independently of PRs #378/#379 and Claude's UI work. Actual synthetic source movement, missing/changed versions, explicit reviewed successor selection and exact retained pack/report/Finance recovery are exercised. [Decision](decisions/document-identity-recovery.md), [evidence](testing/evidence/document-identity-recovery/README.md). The tested runtime already enforces these boundaries; this contribution changes tests/evidence only. Authenticated customer-channel, live SharePoint and independent owner/device acceptance remain open; no merge or deployment is included.

## Service and Finance download access — 10 October 2026

The authorised backend continuation runs independently from main `184b933` alongside Claude's UI work and the separate job-pack PR #378. Thirteen storage-time access failures were reproduced for Service issued/generated HTML/PDF, the issued manifest and Finance evidence; three existing context rechecks now pass all sixteen focused HTTP scenarios, including unchanged-original recovery. [Decision](decisions/report-finance-download-access.md), [execution evidence](testing/evidence/report-finance-download-access/README.md). No UI, schema, grant, dependency or integration change; code delivery and synthetic verification remain separate from merge/deployment, independent review, full PT-01/18/23/29 coverage and owner-led PT-30.
