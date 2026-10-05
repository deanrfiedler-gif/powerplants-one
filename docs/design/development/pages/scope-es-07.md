# Exact receiving, one-off resolution and controlled conversion

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Stable ES-07 / `route:/estimating/quotes/[id]/conversion`. Native `QuotationConversion`; r20 Document & evidence workspace with guided decisions. [Retained r01 HTML](../../../reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html) and its companion report remain unchanged. Accepted native desktop/mobile images are unavailable. Execution captures and actual validation are recorded separately in the [evidence ledger](../../../testing/evidence/quotation-conversion/README.md).

## Desktop

Use the PPO shell and one page scroll owner at 1440/1024 px. Exact issue/output/response/preparation and Not configured policy gaps precede original recovery. Four numbered panels separate receiving, resolution, reviewed plan and execution. Show every included Product quantity/unit and source UUID beside its explicit mapping, then intended company/entity/customer/site. Keep all accepted commercial lines available in a disclosure. Long identities and fingerprints wrap.

## Mobile

At 390/320 px stack labelled fields and panels. Recovery stays above decisions, keyboard focus remains visible and shared minimum targets remain. Preserve proposals on refresh; disable replacements for unknown, saving or stale results. Denied access removes protected evidence. No offline command exists.

## Components, states and handovers

Reuse Button/ButtonLink, Field, SelectField, Status, ValidationFields/ErrorNotice, permitted resource loading, useUnsavedChanges and the actor-bound recoverable command journal. Reuse ES-05 semantic panel/evidence styles; no new tokens or shared control behaviour. `tests/browser/quotation-conversion.spec.ts` uses real synthetic issues and target records.

States include missing preparation, owned Held/Returned, Received, Missing/Ambiguous/Obsolete/Incompatible/OneOff mappings, reviewed plan, stale basis, held plan, original unknown, converted, completed effects with changed applicability and denied access. All states use text.

Incoming: exact ES-06 preparation, issue/output and applicable recorded response. Outgoing: real native Supply Demand Forecast records and exact original receipts. Receiving, sending, commercial approval and work release remain distinct. No sending event is fabricated.

Declared departure from the broader reference: only included Product lines become native Forecast demand; other lines retain commercial evidence. OneOff creates a line-bound internal identity, no operational master or ERP mapping. ERP orders and multiple target aggregates remain deferred. See the [native decision](../../../decisions/quotation-conversion-native.md). Independent paired visual, physical-device, screen-reader and owner acceptance remain pending; no fingerprint is promoted.

## Completed-target disposition

Keep r20 Document & evidence workspace and scope ES-07. The fifth region reuses `QuotationDispositions`, shared labelled fields/selects/buttons/status, native disclosures and the same actor-bound recovery journal. Show a status for every target, then one selected target's exact original/current quantities, units, company/entity, source changes, native version, dependencies and immutable decisions. Distinguish source exceptions from downstream edits; record-only review does not clear the exception.

Desktop: place original/current comparison and dependency disclosures immediately before the review form; preserve the exact issued-output and native-target links. Mobile 390/320 px: stack form controls, wrap long IDs, preserve the selected target and text-based hold/resolution status. No horizontal document overflow or hidden recovery controls. Keyboard uses native labelled controls and visible focus. Unknown originals disable replacement reviews/actions. A stale selected-target basis retains entries and requires explicit comparison; a sibling edit does not reset this proposal.

Retain, ReviseQuantity and Hold are the only decisions. Show the exact proposed positive native quantity and reviewer/time/owner before separate application. Approved demand or consequential dependencies explain their hold and owning Supply follow-up. Show every preceding review, applied target version and original operation. New source or downstream changes reopen review while preserving completed facts. Incoming corrected/superseded source evidence and outgoing native Supply revision/Impact/Activity handovers remain explicit.

`tests/browser/quotation-disposition.spec.ts` supplies real host fixtures for review-only, retained, revised, continuing hold, stale comparison, committed lost response, unsent unknown/retry and denied access. This is host evidence, not an isolated catalogue fixture. [Follow-up evidence](../../../testing/evidence/quotation-disposition/README.md) records executed results separately. Accepted native disposition images remain unavailable; no review fingerprint or owner acceptance is promoted. The reference HTML's cancellation/replacement/multi-target proposals remain outside the native contract.

## Owned Supply follow-up — SYN-ES07-03

Retain ES-07 and SC-09 scope IDs and r20 Detail workspace / Review-comparison (ES-07) and Register-worklist (SC-09). The proposed native adaptation adds a sixth receiving panel and assigned queue using the current shell. Reuse `QuotationConversion`, `QuotationSupplyFollowups`, `SupplyFollowupQueue`, shared Button/Field/SelectField/Status, validation, read-state, unsaved-change and recoverable-command controls. No shared control implementation or second scroll owner is added.

Incoming: exact completed conversion, disposition/continuing hold, triggering source evidence, demand and shared Supply graph. Outgoing: explicit owner acceptance/return/hold, immutable review, actual existing `Supply:Allocate` quantity update, native impact and receipt, and explicit fresh ES-07 disposition. Approved demand remains Approved; no cancellation, reservation release or commercial authority is implied.

Desktop shows original/current evidence and dependency disclosures before forms. Mobile at 390/320 px stacks fields, wraps identifiers and keeps recovery above forms; use 16px input text, 44px targets, labels and visible keyboard focus. Dirty proposals remain after refresh for explicit comparison. Unknown outcomes block replacement and retain original content across reload.

Host fixtures: `tests/browser/quotation-supply-followup.spec.ts` (receiving, real effects, stale comparison, denied identity, lost response, inconclusive lookup and exact retry). Shared catalogue examples remain reference-only for domain behavior. See `docs/testing/evidence/quotation-supply-followup/README.md` for actual executions/captures. Exact retained references remain `docs/reference/ui/quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html` and `docs/reference/ui/supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html`; neither proves native execution. Accepted follow-up mockup images are missing. Owner, physical-device, screen-reader review and deployment remain separate and pending; no fingerprint is promoted.

Actual native follow-up captures: `docs/testing/evidence/quotation-supply-followup/supply-followup-desktop.png`, `supply-followup-mobile.png` and `supply-followup-320.png` in the same directory. Agent-inspected layout and automated functional proof are recorded in the execution ledger; owner acceptance remains pending.

## Owned reservation outcome dependency

SYN-ES07-04 retains ES-07/SC-09, r20 evidence/review workspace and receiving register. `QuotationSupplyFollowups` reuses Field, SelectField, Button, Status and original recovery. Incoming: exact accepted referral and current Unknown ExternalOutcome/Reservation fact. Show fact/predecessor, source operation, state, completeness, observation time and lookup evidence before forms, even without allocations. Select Confirmed/Failed/Absent, enter complete lookup evidence and UTC ISO time, save immutable review, inspect it, then Apply separately.

Outgoing: native successor, demand version/history, original receipt and new explicit ES-07 reassessment. Other quantities/allocations/demands are unchanged; consequential and Approved holds remain visible. Missing receipt is inconclusive. Desktop places evidence before actions. Mobile 390/320 px stacks labelled inputs, wraps identities, retains 44px controls and keyboard focus. Unknown originals block replacements through reload; stale proposals remain for comparison. Real host fixtures are in `tests/browser/quotation-supply-followup.spec.ts`. Accepted native images are missing; retained HTML and #344 captures keep their provenance. No review fingerprint or owner/device/screen-reader acceptance is promoted. Actual proof: `docs/testing/evidence/quotation-reservation-reconciliation/README.md`.
