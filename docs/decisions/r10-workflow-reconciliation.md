---
document_id: PPO-R10-WORKFLOW-DEC
date: 2026-10-26
owner: Dean Fiedler
status: Workflow recommendations recorded; live Figma review completed in bounded sample; design acceptance pending; runtime unchanged
source_commit: 55722e8226b62c2a0e2e3bfe67b38b104bb09590
versioning: git
---

# Workflow reconciliation before design acceptance

## Authority and scope

After an independent repository review of the four R10 proposals, Dean instructed on 26 October 2026 (Australia/Brisbane): **"Proceed based on your professional recommendations."** This adopts the review's workflow recommendations and authorises their documentation and design reconciliation. The recommendation was to resolve the workflow contracts before accepting the four screens as implementation baselines. This instruction is therefore not recorded as visual acceptance of unseen frames, every D1–D10/Q1–Q6 on their notes cards, or an assertion that the proposed functions are already built.

This record owns the cross-module decision. Existing domain contracts continue to describe the implemented commands. The four working scope specifications link here; no issued source, parent requirement, accepted visual baseline, review fingerprint or runtime state is rewritten. No new technology is selected. MYOB, SharePoint and native CAD retain the [adopted authority boundaries](ppo-workspace-myob-book-of-record.md).

Evidence inspected: current main `55722e8226b62c2a0e2e3bfe67b38b104bb09590`; [PR #694](https://github.com/deanrfiedler-gif/powerplants-one/pull/694) at `918de070dc79545bfec91c7753161901f480f7bb`; its [audit sections 12.11–12.14](https://github.com/deanrfiedler-gif/powerplants-one/blob/918de070dc79545bfec91c7753161901f480f7bb/docs/design/figma-file-audit/figma-file-audit-2026-10-24.md). The audit is not yet on main. Dean subsequently supplied the private Figma link. All four live notes cards, page/frame inventories and desktop/phone flow starting points were read; one desktop and one 320px frame per proposal were visually inspected, with targeted node checks for findings below. No Present-mode run or application execution was performed. The public repository deliberately excludes the private file link and licensed-icon screenshots.

## Priority and confirmed findings

P0 means resolve before treating the proposal as an implementation baseline; P1 means resolve before accepting the affected journey. A missing implementation is not itself a design defect: the risk is accepting a screen that silently promises an undecided contract.

| Priority | Confirmed observation | Recommendation / decision boundary |
|---|---|---|
| P0 | ES-07 has no executable catalogue-mapped resolution. Its current five states execute only OneOff. | Specify exact product/revision/unit/company mapping and migration/recovery before drawing it as available. Keep the working OneOff path. |
| P0 | PJ-07 has no native worklist route or agreed cross-source reducer/request aggregate; genuine r02 bytes are absent. | Define applicability, source versions, ownership and movement-request recovery first; review a new honestly sourced baseline. |
| P1 | CR-03 Q4 proposes atomic create-and-link, but D6 and the drawn Delivery tab return to a separate comparison; LC-16 also separates the commands. | Keep one guided journey with separate durable create/link and original recovery. A combined transaction is a new contract decision. |
| P1 | CR-03 receivers have only a Sales-rail entry; native receiving also requires source visibility and destination ownership. | Add permission-aware Projects/Service/My Work entry to the canonical records, with mismatch/denied states. |
| P1 | EQ-04 D5 forbids self-apply, while current TypeScript and durable guards permit an otherwise authorised proposer. Reinstallation is absent. | Enforce independent review at both boundaries; specify retained-identity reinstatement before enabling it. |
| P1 | ES-07 Q4 adds a Won-or-purchase-order prerequisite absent from the current gates. Q6 defers already-built post-conversion controls. | Retain current sequencing and draw reachable disposition/Supply continuations. |
| P1 | Live CR-03 and PJ-07 narrow frames have clipping/impact-coverage problems; ES-07 inputs contradict the 16px mobile rule. | Correct the exact frames below and run Present-mode journeys. |

Visual placement choices (History versus a Movement tab, shared side forms, grouped rows and step strips) remain proposed adaptations, not confirmed architectural defects. All four visual baselines remain unaccepted.

## Adopted recommendations and bounded implementation choices

The recommendations below are adopted. The conservative first-slice choices stated alongside them are the author's professional implementation choices under Dean's delegation, not additional quoted owner observations. Changes to those choices must be explicit in the receiving design/build record. This document specifies future behaviour; it implements none of it.

### EQ-04 — lifecycle review and retained equipment identity

**Confirmed basis.** [Current lifecycle commands](../../src/equipment/changes.ts) and [ADR-0045](ADR-0045-equipment-native-workflows.md) preserve current context, versions, retained history and native source ownership. Apply currently permits the proposer when otherwise authorised; only Active assets can change. Replace leaves the original Removed, Retire leaves it Decommissioned. There is no Reinstall change kind. Physical changes require parent/components and served-area relationships to be resolved; the successor must be distinct, Active, at the same Site, with no parent or predecessor. Open Service work has its own guards and narrow Maintenance replacement-result exception.

1. **Separate physical-change proposer and reviewer.** The adopted direction requires a different authorised person for consequential physical changes: Relocate, CorrectLocation, Replace and Retire, and a future Reinstall. Configuration governance remains with its existing contract. This supersedes only ADR-0045's deferral of deciding whether independent physical-change review is required. The current command is unchanged. The build must enforce the rule at the server and durable evidence boundary, including original recovery and revoked access; a hidden button is insufficient. Whether an additional capability is necessary must be justified against existing scoped duties before any grant is added.
2. **Specify reinstatement instead of duplicating an asset.** Design an explicit reviewed return of the same Removed asset identity to service, retaining serial, former location, configuration, replacement lineage and all prior service evidence. Do not create another asset merely to return a loaned or repaired unit. A Decommissioned asset is not automatically eligible. Repeated loan/replacement cycles, the current single-predecessor representation, eligibility evidence and effective-time ordering must be reconciled in the bounded reinstatement contract before the UI promises this action. Until built, show reinstallation as unavailable.
3. **Review served relationships explicitly.** End the predecessor's applicable served-area relationships through their owning CS workflow, then explicitly establish the successor's relationships after review. Preserve ended links and event-time history; never copy warranty, unresolved defects, configuration verification or Service authority. Do not silently move an entire asset hierarchy.
4. **Refresh after consequences change.** The order is impact preview, source-owned resolution, fresh preview, proposal, independent review, apply/reject. Existing stale-basis checks remain. Record an actual effective time; a future planned movement stays a proposal outside the current physical-change command.

Design evidence required: independent actor and denied self-review; replacement held by served areas/open work; refreshed comparison; loan-unit return/reinstallation boundary; source-changed and uncertain-original states; both effective location and served areas visible on phones. Existing Maintenance replacement exceptions must remain reachable and explained.

### CR-03 — one receiving workflow with explicit accountability

**Confirmed basis.** [Handover service](../../src/sales/handover-service.ts), [delivery binding](../../src/sales/delivery-binding.ts) and [LC-16](won-delivery-continuity.md) already implement exact Won receiving and native Project/Service links. The Sales rail exposes `/sales/handoffs/won`; Projects and Service have no corresponding entry. Source CRM visibility plus the relevant native duty is required. The designated receiver must own the destination when making a new link. Parts has no native receiving contract.

1. **One canonical queue and record.** Retain `/sales/handoffs/won` and `/sales/handoffs/won/[id]`. Add permission-aware entry points from Projects, Service and My Work during the bounded navigation build; route to the same records, not copied queues or new lifecycle stores. The original source, destination, filters and return path must survive navigation. Navigation does not confer access; denied or restricted evidence is not an empty queue.
2. **Keep a named accountable receiver.** Sales prepares the handover and selects an eligible person. The receiver explicitly accepts, clarifies, returns or links within current authority. For the first slice retain LC-16's requirement that this person also owns the destination. Team-only responsibility, delegated linking and implicit reassignment are outside that slice. Show the owner mismatch and the source-owned correction path instead of broadening access.
3. **One guided journey, separate durable operations.** Retain native create-and-return followed by explicit comparison/link review. Existing destinations use the same comparison. If creation succeeds but linking fails or is interrupted, recover the created record and retry only the exact linking intent. Do not recreate it. This retains LC-16; no combined transaction is adopted. Known site must match; an unknown Sales site requires explicit native site review. Service request, scope and work-authorisation prerequisites remain.
4. **Keep Parts unsupported visibly.** Route it to an owned clarification/decision without claiming an executable Parts handover. No sales order, booking, purchasing or Finance effect is inferred.

The displayed facts remain independent: customer response, CRM Won, handover submitted, receiver accepted, native record created, link recorded, work authorised and delivery completed. Preserve the Won obligation and its Activity ownership. Update the stale CR-03 paragraphs that described ES-05/06/07 as unavailable; [lead-to-delivery continuity](../contracts/lead-to-delivery-continuity.md) superseded that checkpoint.

Design evidence required: receiver entry from each authorised workspace; unassigned/ineligible receiver; owner mismatch; existing Project link; unknown-site review; Service intake; clarification and return; created-but-not-linked recovery; changed source/version and denied refresh. No bulk receiving acceptance is introduced.

### ES-07 — exact quotation conversion and a separate catalogue extension

**Confirmed basis.** [The implemented conversion contract](../contracts/quotation-conversion.md) supports Missing, Ambiguous, Obsolete, Incompatible and OneOff; only OneOff is executable. It freezes the exact issue/output/response/preparation and one whole accepted manual option. Included Product lines become native Forecast Demand; other commercial lines remain evidence. Post-conversion disposition and Supply follow-ups are already built. The live notes and converted desktop frame confirm that these regions are not drawn in the R10 proposal.

1. **Retain the implemented path and its follow-ups.** The four initial steps remain receive/return, resolve, freeze reviewed plan and separately execute. Preserve Retain/ReviseQuantity/Hold, original/current target comparison, owned Supply follow-up, source-correction holds and exact original recovery after conversion. A completion card must not replace those regions.
2. **Specify catalogue mapping as an extension.** A future catalogue resolution must bind the exact source line, stable product ID, selected product revision, company context, compatible unit and explicit compatibility evidence into the reviewed plan. OneOff remains a deliberate alternative. Missing/ambiguous/obsolete/incompatible or changed applicability holds the affected review. No guessed latest revision, automatic substitution, unit conversion or silent quantity aggregation. Preserve the one-line/one-Demand boundary unless a later contract explicitly changes it. Catalogue edits do not rewrite the issued quotation or reprice its accepted commercial snapshot.
3. **Keep native product and external mapping distinct.** Catalogue selection does not assert that an ERP item exists or was synchronised. Retain explicit external provider/company/entity/key and mapping availability when supported; never fabricate them from a label. Products owns catalogue publication; MYOB financial and stock authority remain unchanged. The extension needs a versioned command/storage/upgrade specification before runtime work; old OneOff payloads, plans and receipts remain recoverable.
4. **Use the accepted quotation hub.** Preserve the [accepted Quotation detail design](quotation-detail-figma-design.md), exact revision UUID links, and the page's originating workspace. Use a named Supply coordinator with current source visibility and `supply.coordinate` for commands; show read-only/restricted states to others. Receiver work is discoverable through My Work and a Supply entry during the receiving-navigation build, without creating another quotation master.
5. **Keep conversion separate from delivery authorisation.** For the first slice add no mandatory Won/CR-03 acceptance/Project-creation prerequisite: the current exact accepted response and applicable preparation remain the gates. Show their separate progress and links. The result is Forecast Demand, not Approved demand, stock reservation, purchasing release, Project creation or work authority. Any later mandatory sequencing is a distinct contract change.

Design evidence required: all four steps at both phone widths; permission-limited entry from the quotation hub; catalogue-unavailable and explicit OneOff; held mapping; superseded/corrected response; immutable plan replacement; duplicate/uncertain execution; original targets retained; post-conversion disposition and owned follow-up. Do not label the catalogue extension built.

### PJ-07 — source-backed review, with separate delivery decisions

**Confirmed basis.** The existing Projects `readiness` rail destination is reserved and unavailable. [The programme reconciliation](../delivery/projects-completion-programme.md) records the missing genuine r02 source; the r02-named HTML has r01 bytes. Native Project scheduling, Supply, Engineering, CS, Service and PJ-09 acceptance retain their separate authorities.

1. **Reuse the reserved destination.** Implement one `/projects/readiness` worklist when its source reads exist, with a deep link to the selected Project's Readiness view and a reversible return path. Extend the accepted Project record deliberately; do not duplicate its Overview/Schedule or create a second readiness rail item. Retain exact route precedence, page guide, permission checks and unavailable status until the route exists.
2. **Coordinate; do not become the source of readiness.** The Project coordinator owns the consolidated review; each prerequisite and blocker retains its actual source owner. Each row must expose source identity, assessed scope, revision/as-of time, completeness, current state and next action. Restricted, missing, stale and not-applicable evidence are distinct. Filters change presentation, not the assessed scope. Zero visible blockers or completed Activities do not establish readiness. No percentage or manual green override is adopted.
3. **Preserve native meanings.** Forecast Demand stays Not assessed; incoming supply alone cannot establish Ready; only the native supplier-confirmed promise rules explain At risk cover. Retain Dean's [decision to keep both unallocated-demand rules](unallocated-demand-readiness-proposal.md): Supply shortage and field-gate Unknown are explained with their source and consequence. This decision does not unify them. The aggregate reducer and prerequisite applicability must be documented and verified against those source contracts before implementation; it must not hide missing evidence behind a ready summary.
4. **Request movement; do not silently execute it.** A named coordinator captures the affected records, current/proposed dates, exact source versions, reasons and named receiving owners. Each owning domain separately reviews and applies its authorised change. No automatic date cascade, appointment move, supplier/customer commitment, technical release or financial approval follows from the request. Preserve partial/returned/held and unknown outcomes; one requested change is not one universally authorised transaction. The source comparison becomes stale when relevant evidence changes and must be explicitly reviewed again.
5. **Define the change identity before adding a type.** Treat `SYN-CHG-000012` as a proposal fixture until its native owning aggregate is resolved. Use stable typed links to existing change/impact authorities where applicable; do not infer an Engineering change from a display prefix or mint a competing change master. A new cross-domain request type, if necessary, requires its own data/authority/receipt contract and naming registration. This document allocates no type or counter.
6. **Prepare a new baseline with honest provenance.** Proceed with a new Figma baseline derived from retained r01 semantics and current accepted PPO decisions, rather than making recovery of unavailable r02 bytes a prerequisite to design progress. This changes the future-source selection approach in the A0/A6 programme record; it does not claim r02 was recovered or accept the current drawing. Preserve both issued HTML files and the r02 change record. Carry forward responsive impact cards, clear Gantt legend, date formatting and usable tabs. The new baseline supersedes the missing-source dependency only when its exact frames and departures are reviewed and recorded under ADR-0053.

Design evidence required: mixed ready/blocked/missing/restricted/stale prerequisites; unchanged whole-scope result under filters; source drill-down and return; owned blocker without automatic clearance; current/proposed impact comparison; refused/returned/partial movement requests; confirmed booking unaffected by an unaccepted request; phone impact cards and usable tabs.

## Reconciliation of the live D/Q notes

These dispositions distinguish the delegated workflow direction from additional propositions first exposed by direct Figma access. No blanket D1–D10/Q1–Q6 acceptance is inferred.

| Proposal notes | Disposition |
|---|---|
| EQ Q1/Q2; D5 | Specify same-identity return of Removed equipment; require independent physical-change review. The extra equipment-review capability remains to be justified and registered, not silently granted. |
| EQ Q3 | Keep Facilities ownership, explicit ending/creation and history. A one-step served-link handover needs its own command/recovery contract; no silent transfer is approved. |
| EQ Q4 | Keep current customer-scoped identities for loan installations. Same-identity reinstatement applies within that scope; cross-customer canonical fleet identity is a separate unresolved model, not implied by reinstatement. |
| EQ Q5 | “Removed” for replacement and “Retired” as the display label for Decommissioned are reasonable wording recommendations. Preserve durable enum meanings; visual wording acceptance remains pending. |
| EQ Q6 | Do not bypass the current served-link guard for a location correction merely because no physical move occurred. Specify scope consistency and retrospective evidence first. |
| CR Q1/Q2/Q5/Q6 | Recommend receiver-workspace entry to one queue, Sales-proposed routing with named receiver review, owned Handover due visibility, and current Projects/Service capabilities plus source visibility. No automatic routing threshold or new grant. |
| CR Q3 | Parts remains unavailable. Do not automatically turn every parts-only deal into Service work: genuine Service intake/scope/authority is still required; otherwise retain an owned routing decision. |
| CR Q4 versus D6 | Keep the separately persisted native creation and reviewed link already drawn and implemented. Do not adopt the note's combined transaction. |
| ES Q1/D2 | A Supply receiving view is recommended, but it must identify quotations awaiting receiving; it must not present an unconverted quote as existing Material Demand. Preserve the accepted quotation hub and originating-workspace context. |
| ES Q2/Q3/Q5 | Future exact catalogue mapping with explicit OneOff fallback; named Supply coordinator with existing visibility; no new separation-of-persons rule; non-Product lines stay commercial evidence and go to delivery through CR-03. |
| ES Q4 | Retain exact accepted/prepared-response gates. Won or purchase-order evidence may be shown but is not a newly mandatory prerequisite. |
| ES Q6/D7 | Complete the existing post-conversion journey before accepting a replacement design. A second page is an optional composition choice only if its entry, identity, return path, permissions and all existing recovery remain defined. |
| PJ Q1 | CHG is an unregistered fixture prefix; decide native aggregate ownership and naming before creating records. |
| PJ Q2/Q3/Q4 | Coordinator owns the consolidated review; source owners own answers. Assess each relevant delivery scope and invalidate stale evidence. Movement requests do not apply source changes or change the retained baseline. |
| PJ Q5 | Showing commercial impact when a change has a cost effect is reasonable. This must not hide an independently applicable commercial work-release prerequisite merely because this change has no new cost. Applicability belongs in the source contract. |
| PJ Q6 | A new reference may proceed from retained r01/current decisions without recovering r02. Adopting this exact Figma drawing still requires the outstanding corrections and an explicit baseline decision. |

## Direct Figma observations

The inspected sample is intentionally bounded; it is not a full-file accessibility or visual acceptance audit.

| Finding | Exact evidence | Required follow-up |
|---|---|---|
| Confirmed actor mismatch | CR-03 desktop `2689:2057`: global Identity text `I2689:2076;35:178` is SC, while the acting receiving owner and destination coordinator are Morgan Lee (you). The separate Sales-owner metadata may correctly remain Sasha. | Change the acting-user identity to Morgan in the receiver journey; review the corresponding submitted/tablet states. |
| Confirmed clipped phone action | CR-03 `2699:2216` has height 844, clips content and has no frame overflow. Accept button `2699:2269` spans local y=800–848, four pixels beyond its bottom. | Provide bottom/safe-area space and scrolling for the sheet; test close, validation, keyboard and action reachability in Present and the eventual app. |
| Confirmed input-size departure | ES-07 `2713:1241`: reason value `I2713:1266;2649:7443` and evidence value `I2713:1267;2649:7301` are 14px. The working mobile spec requires 16px; D10 already acknowledges this R6 issue. | Use a reviewed mobile field variant and recheck wrap/height across consuming pages; do not change shared accepted components incidentally. |
| Confirmed incomplete narrow impact review | PJ-07 `2730:3046` shows four cards then text `2730:3096`, “3 more rows: site calendar, job pack and commercial.” The text and Cards parent have no reactions; Request delivery movement remains visible. | Expose all impacts or an explicit reachable full-review step before enabling the request. Inspect the equivalent 390px flow. |
| Confirmed ambiguous date variance | PJ-07 phone text `2730:3092` says Wed 2 Dec is +9 days on baseline. The retained baseline is Thu 19 Nov: 13 calendar days. Current Project overview computes calendar-day variance; nine weekdays assumes a calendar and ignores exceptions. | Display +13 calendar days or explicitly name and calculate working days using the reviewed site calendar. Do not silently switch units. |
| Confirmed missing coverage | EQ lacks the 1024 side form, phone relocation and reinstatement; ES lacks phone resolve/plan, tablet steps 2–4 and post-conversion continuation; PJ lacks phone blocker assignment and change close/history. CR omits native creation forms and references CR-02 for clarification/return. | Review the missing journeys or explicitly retain the corresponding accepted/current native view; the existence of a desktop and phone start point does not prove end-to-end coverage. |

Visual samples: EQ desktop `2662:156` and 320px `2676:2198`; CR desktop `2689:2057` and 320px `2699:2216`; ES desktop `2705:13667` and 320px `2713:1241`; PJ desktop `2720:10714` and 320px `2730:3046`. All four pages expose named desktop and phone prototype starting points. Reactions were inspected as metadata; none of the flows was played in Present mode. No tablet or 390px screenshot acceptance is claimed. EQ's open-work fixture must also be checked against the precise Maintenance replacement-result exception, not treated as evidence that any open work order can be ignored.

## Implementation order and coordination

| Step | Bounded result | Dependency and proof |
|---|---|---|
| 1 | This decision and working-spec reconciliation | Preserve implemented contracts, issued sources and review states; documentation/register checks |
| 2 | Live notes read; D/Q departures and bounded visual findings recorded below | Complete for the stated sample; no Figma modification or visual acceptance |
| 3 | Define PJ-07 source/authority/request contract and ES-07 catalogue extension | Highest rework risk; reuse native sources, retain one-off and recovery; no fabricated source or ERP mapping |
| 4 | Revise the four Figma proposals and missing states | Accepted shared patterns and current components; EQ reinstatement and CR ownership boundaries explicit; preserve existing accepted pages |
| 5 | Present-mode walkthrough and per-proposal baseline decision | Exact named version, icon-free captures/hashes, decision and File index; physical-device/accessibility evidence remains separate |
| 6 | Small synthetic runtime slices from accepted designs | Reserve migrations only when needed; current-main integration, authority/replay/upgrade proof, paired application comparison; no blanket four-module build |

PR #694 owns the audit/Figma clean-up. Open [PR #698](https://github.com/deanrfiedler-gif/powerplants-one/pull/698) owns Project record implementation, [PR #702](https://github.com/deanrfiedler-gif/powerplants-one/pull/702) owns Sales briefs receiving, and [PR #690](https://github.com/deanrfiedler-gif/powerplants-one/pull/690) owns field-readiness P4/P5. Their claims were inspected; none is treated as delivered by this record. This contribution edits none of their branches or shared runtime/register files. Sequence overlapping source/spec changes with their owners. New routes/components will require their normal register/guide/consumer updates during implementation, not fabricated registrations now.

## Direct design checks and acceptance evidence

| Proposal page | Notes card | Required flow coverage |
|---|---|---|
| EQ-04 `2662:87` | `2685:2625` | Propose/review, blocked/stale replacement, reject/cancel, uncertain result and reinstallation boundary |
| CR-03 `2689:87` | `2702:1959` | Receiver entry, clarify/return, existing link, create-return and interrupted-link recovery |
| ES-07 `2705:2415` | `2717:1322` | Four steps, held mappings, changed acceptance, duplicate prevention, post-conversion continuation |
| PJ-07 `2720:87` | `2736:2384` | Worklist/record/source/return, blocker assignment, impact review and movement request |

Inspect 1440, 1024, 390 and 320 widths, long/unknown values, overlays, scrolling, action reachability and the proposed R6 controls. Play desktop and phone prototypes in Present mode. Figma screenshots do not prove keyboard semantics, screen-reader behaviour, actual 200% browser zoom, persistence or network recovery; verify those on the implemented app with exact viewport and synthetic story.

No Figma page, shared component, index row, named version or capture is changed by this contribution. Dean's instruction to proceed is recorded as direction to develop the recommendations; it is not blanket acceptance of the proposals or of every newly read note. No owner walkthrough observation, different-model review, native implementation, merge, deployment or production readiness is asserted. The dated status fragment records the actual checks for this change.
