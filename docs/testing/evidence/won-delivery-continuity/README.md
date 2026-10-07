# Native Won receiving execution

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 7 October 2026 by the implementation agent. Review: local synthetic functional proof; paired visual, owner, physical-device and screen-reader acceptance pending.

LC-16 implements accepted Won receiving and source-derived delivery progress in increments 4–5 of the [lead-to-delivery programme](../../../contracts/lead-to-delivery-continuity.md), under the [receiving decision](../../../decisions/won-delivery-continuity.md). Parent source is PR #363 at `f898b6d`. The manifest identifies the tested implementation and retained evidence. Return-to-Sales increment 6 remains separate work.

## Result and proof

The accepted receiving owner creates a native Project or Service work order, or selects an existing matching record, then reviews an explicit typed link to the exact Sales acceptance event. Native creation and linking have independent receipts and same-tab original-operation recovery. Service intake can save independently and return to work-order creation. The link compares current Sales source/version, native version/site, company, customer, current site relationship and current receiver/native owner authority. Unknown Sales site remains unchanged while the separately reviewed native site is retained in the binding.

The immutable companion, exact audit, receipt and publication commit together. Direct insertion without its required evidence fails at commit. Linking changes no Project task, Service scope, authorisation, booking, original Sales content or Activity owner/date. A successor leaves earlier attribution historical. Current access governs native/source reads and original recovery. The Deal reads actual receiving and native state, while its original Won accountability event remains retained. An accepted handover, a link and a completed delivery are distinct facts.

Environment: Windows, Node 24.21.0, PostgreSQL 16, isolated `ppo_synthetic_test`, compiled loopback application on port 3000, Playwright 1.63.0 and Chrome 154.0.8037.98. Migration 0076 adds an empty companion with deferred evidence constraints. No seed, capability, grant, user, dependency or external service is added.

| Check | Result |
|---|---|
| Focused database | 8/8 pass: Projects and Service concurrent duplicate/original recovery; unknown Sales site; stale native/source and wrong route/site; actual native grant removal; direct missing-evidence insert; late atomic rollback; populated 0075 upgrade |
| Selected upgrades | 13/13 pass: Estimating identity backfill, Field timer/grants, prior Leads and Sales companions, Leads/Projects registries, policy ledger and hosted-demo runtime/Windows upgrade paths |
| Compiled desktop/phone | 12/12 pass: eight new receiving scenarios plus four retained native Project/Service scenarios; initial and intermediate failures retained below |
| Registry units | 3/3 pass |
| Build, TypeScript, lint | Pass, including a completed focus-repair build and standalone final TypeScript/targeted lint |
| Foundation, prototype, naming, studio | Pass; final packaging logs retained separately. All 344 page and 39 component reviews remain pending |

## Retained failures and repairs

The initial browser run passed 11 of 12 cases. A new sibling Sales panel displaced the fixed Project Gantt workspace on phones. Its screenshot is retained. Project Sales context now opens through an optional action in the existing native-dialog pattern, with the schedule kept intact. The next run verified the schedule on both viewports but found that Escape did not restore focus to the opening button; explicit focus restoration repairs that defect without weakening the assertion.

That intermediate run passed nine of twelve cases: two focus-return assertions failed and the final retained Service case remained at Loading demonstration identity during an overlapping rebuild. It is not counted as final source verification. The final browser run uses a completed build with no concurrent build or database reset. A temporary unmodified-main diagnostic checkout could not build through a node_modules junction because Turbopack rejects a dependency link outside its filesystem root; its log is retained, no baseline application result is claimed, and the diagnostic checkout was archived. The introduced Project layout defect was identified and repaired in this contribution.

The browser uses real native create, handover and receipt HTTP commands. It loses successful native creation and link responses separately, reloads, creates an actual Sales successor, and recovers one original link. It creates a new Service intake, returns to a native draft work order, links it explicitly and verifies no scope/authorisation was fabricated. It changes a native Project after review, proves refresh retains the submitted old version, receives a refusal with no binding effect, then deliberately reviews again. UI denied refresh is mocked; actual grant removal and hidden native identities/original receipts are proved separately against PostgreSQL.

The agent inspected the final phone Project history dialog and desktop explicit-site comparison captures. The dialog wraps the reported Sales scope and reference, retains a visible close action and scrolls its content; the desktop view shows the fixed Sales/native versions, explicit unknown-site choice and link/discard actions. Six final captures are retained alongside the earlier captures and failed phone layout. This is limited layout inspection, not paired visual acceptance. Exact new-state mockups remain missing; no accepted review fingerprint is assigned. Escape/return focus is functionally asserted; a full keyboard, 200% zoom, screen-reader or physical-device review is not claimed.

No standalone HTTP suite, exact application/PostgreSQL restart or complete local regression was run for LC-16. Native HTTP commands are exercised through the compiled browser scenarios; selected upgrade cases are separately counted. Owner/business acceptance, final-head CI, merge and deployment remain separate. Parts has no native receiving destination here; its route remains explicitly unresolved.
