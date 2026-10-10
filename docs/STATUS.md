# Current prototype status

**Updated:** 10 October 2026 (Australia/Brisbane). **Owner:** Dean Fiedler. Public repository; private synthetic prototype and demo. Code delivery, automated verification, visual review, owner acceptance and deployment are separate facts.

**Naming authority:** [PPO-STD-001](standards/naming-conventions.md) and [ADR-0005](decisions/ADR-0005-project-naming-adoption.md).

## Icon style decision — 10 October 2026

After a local comparison of the app's icons with Font Awesome Classic Light, Regular and Free, Dean chose Font Awesome Pro Classic Light, with Classic Solid for selected items. [ADR-0050](decisions/ADR-0050-font-awesome-light-icons.md) records the decision, the comparison mapping and the delivery options. Delivery is proposed: the Kit package built into the app needs annual billing, which Dean's monthly plan excludes, so the alternative is the Kit script on online pages only. Dean's billing choice, the licence terms and offline treatment remain open. No dependency, configuration or icon is changed yet; implementation needs Dean's separate go-ahead. Pro icon files and captures stay out of this public repository.

## Parallel backend access and recovery — 9 October 2026

Dean authorised backend permissions and recovery work alongside his UI work in Claude. The isolated `codex/backend-access-recovery` contribution starts at main `184b933` and leaves UI files/worktrees untouched. Four actual HTTP job-pack download challenges reproduced a permission revocation gap during storage on unchanged main. The backend rechecks current exact-issue/render-job authority before returning HTML/PDF or recording retrieval. Eight focused scenarios now pass, including company/site/search/notification isolation and exact original recovery after a dropped successful response. [Decision](decisions/backend-access-recovery.md) and [evidence](testing/evidence/backend-access-recovery/README.md). Complete PT-01/PT-18/PT-30, independent/owner review, contribution CI, merge and deployment remain separate.

## UI build and review sequence — 9 October 2026

Dean asked for one page showing every UI page still to create or refine, in working order from the home page. The [record](decisions/ui-build-sequence.md) derives the [sequence](design/development/ui-build-sequence.md) from the live register and the issued r02 build plan using `scripts/build-ui-sequence.py`. No rank, scope ID or issued byte changes.

- **Coverage:** all 350 register entries are accounted for: 347 placed in phases 00 to 11 and 3 development-tool routes excluded.
- **Workload:** 190 entries are built and awaiting owner review, 105 are to refine, 46 to build and 6 await a scope decision. 28 phase 00 entries have an owner visual review, stale after refinement batch 1.
- **Adopted rules:** Dean adopted SD-01 to SD-05 on 9 October and started the phase 00 review. The review track starts at phase 00, which contains the home page, My Work and the existing service and field baseline. The build track starts at phase 01 with AD-01.
- **Phase 00 review, session 1:** Dean accepted the proposed verdicts on 9 October. 28 owner visual reviews are recorded and 2 are deferred. Refinement batch 1 fixed shared findings S1, S2, S4 and S7 in the shell and withdrew S3 after verification ([evidence](testing/evidence/ui-refinement-batch-1/README.md)). The 28 reviews are now stale, as intended. The [evidence](testing/evidence/ui-review-phase-00-r01/README.md) holds 42 captures, automated checks and shared findings S1 to S9. The verdicts are 7 accept, 5 minor, 16 refine, 1 own session and 1 later phase.
- **Phase 00 refinement canvas:** proposed shared rules S5, S6 and S9 and My Work layouts are on a [separate canvas](https://claude.ai/artifact/E5wdx1FiF3ZUVb86oXps2E). On 9 October Dean adopted S6 with 24-hour times, S5, S9 and all four My Work proposals, including the working-company prefill on Create activity ([record](decisions/ui-build-sequence.md#owner-decisions-9-october-2026)). Refinement batch 2 built them on the My Work pages, with the S6 formatter and the My Work guide ([evidence](testing/evidence/ui-refinement-batch-2/README.md)); owner re-review is pending. Proposals for the Sales and Service phase 00 pages are now on the canvas and await Dean's decision ([record](decisions/ui-build-sequence.md#sales-and-service-pages-on-the-canvas-9-october-2026)).
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
