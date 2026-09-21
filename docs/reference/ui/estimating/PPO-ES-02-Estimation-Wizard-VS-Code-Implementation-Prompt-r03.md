---
document_id: PPO-ES-02-VSCODE-IMPLEMENTATION-PROMPT
revision: r03
supersedes_revision: r02
date: 2026-09-21
owner: Dean Fiedler
product: Powerplants One
scope_id: ES-02
status: Attachment-ready implementation instructions; native verification and owner acceptance pending
repository: https://github.com/deanrfiedler-gif/powerplants-one
inspected_main: b4806afeb0ded1931b844a997621e2e300f7c7b6
companion_plan: PPO-ES-02-Estimation-Wizard-Discovery-Alternatives-and-Revisions-Refinement-Build-Plan-r04.md
---

# Powerplants One — Estimation Wizard

## Attachment instructions for Dean

Attach this complete document to the VS Code Codex chat with the Powerplants One repository open. It contains the core build instructions, visual/functional contract, delivery sequence and full acceptance matrix; it is no longer limited to 8,000 characters. Attach the latest ES-02 desktop mockup r03 and r22 theme board for visual comparison when available. The full refinement plan r04 provides additional rationale and source detail.

Send this short instruction with the attachment:

> Use the attached ES-02 implementation brief as the task instructions. Read it fully, inspect the current repository, then implement the authorised independent scope through verification and handover. Preserve existing work and the adopted Powerplants One theme and data contracts.

The implementation instructions begin below. References called “proposed” describe work to create, not features already present. Tests in the acceptance matrix are requirements, not claims of executed results.

---

## 1. Your task and completion standard

Implement **Powerplants One — Estimation Wizard · discovery, alternatives & revisions (ES-02)** as a native refinement of the existing app. Complete the independent scope through W01–W06: current-code reconciliation, contract decisions, UI, structured persistence, alternatives/history/comparison, saved-cost integration, verification and handover.

This is one of the app's central estimating workspaces. It must let an estimator understand scope, coverage, evidence, unresolved decisions, alternative choices and the exact discovery basis of saved costs without having to infer state from colours or filenames. Native behaviour, readable design and data integrity are equally necessary.

A new HTML prototype, generated image, static UI, disabled scaffold, plan-only response or Configuration-only cosmetic pass does not complete the task. Preserve the existing working discovery and costing paths while delivering in bounded increments. Continue through the independent scope; identify unavailable external integrations honestly without substituting fabricated services or abandoning unrelated work.

Use this brief as the execution instructions. If the companion **Refinement Build Plan r04** is supplied, it governs the detailed behaviour/acceptance requirements where wording conflicts. Current user instructions take precedence. Existing repository contracts govern retained authority and history; explicit refinements here govern the requested new presentation/behaviour. Record and resolve material conflicts before changing the affected behaviour.

## 2. Inspect the actual starting point

Read current `AGENTS.md`, `README.md`, `docs/STATUS.md`, the relevant blueprint, naming/module-conformance standards, E2 contracts, ADR-0025/0026/0027 and relevant delivery notes. Inspect the current branch, worktree status, recent changes, unmerged work, available runtime and test setup. Do not reset a newer checkout to this document's inspected commit or overwrite unrelated local edits. Use a suitable existing feature branch or isolate the work in a new branch/worktree.

The last inspected GitHub `main` was `b4806afeb0ded1931b844a997621e2e300f7c7b6` on 21 September 2026. It already implements E2 discovery, commercial options, immutable revisions and explicit manual-costing adoption. It is a synthetic prototype, not authority to connect production systems or transact business data.

| Starting point | Implication for the build |
| --- | --- |
| Existing discovery register/create/detail/costing routes and services | Refine them; do not create a parallel wizard record universe. |
| Ten-question r01 definition, work tags and source attribution | Preserve legacy meaning, hidden answers, hashes and replay; version new structured configuration separately. |
| Owner/edit and whole-group Draft checks | Reuse them for mutations; a selected row or editable-looking control is not authority. |
| `previewDiscoveryCosting` requires the selected Active Complete saved revision and edit/owner authority | Add a proper read-only saved-cost summary; do not reuse or weaken adoption preview to fill the sidebar. |
| `scope.systems` has one to three work tags | It cannot hold the four proposed equipment systems shown in the fixture. |
| `Answer.source` is text; `FollowUp` has owner/reason only | Add typed evidence and due-date/link fields explicitly; do not pretend they already exist. |
| `CopyDiscovery` copies an exact saved source and rejects an edited discovery body | Copy first; edit the destination afterward. Preserve determinism and provenance. |
| `useUnsavedChanges` handles native unload and captured links | Inspect and implement coverage for router/history/selectors; importing the hook alone is not proof of those paths. |
| Form-option lists show at most 100 candidates with `more` flags | Implement real scoped search/paging or an honest boundary; preserve selected records beyond the first page. |

Reconcile obsolete UI text and DTO wording that implies manual costing is unavailable. In particular, distinguish the existing receiving flow from Excel import, and do not silently redefine `costing_import: NotImplemented` for old consumers. Early design-document statuses may predate implemented ADR-0027 behaviour; update maintained explanations without rewriting issued snapshots.

Likely anchors, subject to the actual checkout:

- `src/components/discovery-screens.tsx`, `discovery-fields.tsx`, `discovery-costing.tsx`, `crm-state.ts`, `record-ui.tsx`.
- `src/estimating/discovery-definition.ts`, `discovery.ts`, `discovery-context.ts`, `discovery-workspace-context.ts`, `discovery-workspaces.ts`, `discovery-workspace-validation.ts`, `discovery-form-options.ts`.
- `src/estimating/cost-basis-service.ts`, `cost-basis-validation.ts`, `context.ts`, `math.ts` and existing estimate/quote boundaries.
- `src/shell/secondary-menu.tsx`, `src/components/product-navigation.tsx`, shell content/control providers and `src/app/desktop-shell.css`.
- Existing API routes, scoped table/lookup primitives, migration registry and E2 tests.

Keep shared changes narrow and reuse existing dependencies. At the inspected commit the package declares Node 24.21.0 and npm 11.19.0; recheck the actual checkout. This task does not require a runtime/framework/design-system upgrade.

## 3. Domain boundaries and things that remain separate

| Concept | Required meaning |
| --- | --- |
| Workspace | Opportunity/company context, estimating owner, concurrency version and one selected Active commercial alternative. |
| Viewed alternative | The option being inspected or edited; viewing does not select it for costing. |
| Working discovery | In-memory proposal based on an exact saved revision; edits are not a saved revision. |
| Saved discovery revision | Immutable scope/answers/evidence/readiness with exact predecessor or copy provenance. |
| Proposed system | Stable estimating entity with family, intent, coverage and facts; it is not automatically an installed Asset. |
| Estimate version | Saved manual prices/content bound to an exact discovery basis; discovery edits do not recalculate it. |
| Draft quotation | Existing supported output from one exact saved estimate version, with separate rendering state and retained originals. |
| Configuration confirmation | Review of specified discovery facts; not engineering certification or commercial approval. |

Keep `ProductSupply`, `DefinedLabour` and `Freight` as questionnaire work tags. Equipment families, pricing categories, line participation and commercial alternatives are separate classifications. Do not substitute their IDs or infer mappings from labels.

Consume actual permitted Site/Facility/Asset records without modifying installed assets merely to make estimating scope fit. Keep one Site per saved scope under the current contract; multiple estimating areas at that Site are supported. Full/Express estimating effort differs from delivery routing.

Unavailable CS-08 survey, ES-03 supplier-price/source review or ES-08 specialist-calculator integrations must be identified honestly. Keep manual attributed discovery usable. Formal ES-04 commercial review, quote issue/acceptance, ERP posting, procurement commitments, imports and customer communications retain their own contracts. Do not adopt sample FX rates, margins, routing thresholds or engineering formulas from the original HTML.

## 4. W01 — resolve the implementation contract

Before new persistence, produce a short decision record and a concrete gap/route/schema map in the repository's established documentation locations. Reuse maintained documents where suitable. Preserve all parent IDs and issued references.

Resolve the following; do not leave them as critical TODOs or ask the owner to choose routine implementation details already governed by the repository:

1. Where the new area/system/fact/evidence/responsibility/follow-up data lives, using snapshot JSON or typed rows according to current conventions and constraints.
2. Explicit schema/definition dispatch, canonical ordering/hashing, strict allowed keys and compatibility for old r01 inputs.
3. Stable entity IDs, qualified ownership, copied destination IDs and exact source lineage; atomic child-reference remapping.
4. Exact field types, units, enums, required-confirmation rules and bounded counts/text lengths. Separate technical limits from commercial/engineering policy.
5. Whole-request size budget, including operation fields, IDs, reason, hashes and confirmations; read pagination/response bounds.
6. Current read/write/API reuse versus additive DTOs/endpoints, their safe error codes and consuming components.
7. Draft lifetime, navigation interception, preview version binding, source review, conflict recovery and unknown-operation handling.
8. The relationship between questionnaire, structured scope and configuration findings in the extended server-derived readiness result.
9. Role/capability/owner and current/historical reference access for reads, commands, comparisons, receipts and outputs.
10. Applicable parent requirements, W-package dependencies, migration/upgrade obligations and meaningful acceptance tests.

The new model must support these concepts:

| Entity/fact | Minimum contract |
| --- | --- |
| Estimating area | Stable ID, label, optional permitted Facility, growing/ancillary/unknown purpose, use/stage and attributed evidence/state. Purpose does not change Facility type. |
| Proposed system | Stable ID, one primary family/group, type, new/retain intent, proposed work, explicit coverage and permitted equipment references. |
| Coverage | Defined area IDs; or explicit Not area-specific with reason; or Unknown with an eligible owner/reason. No invented reference IDs. |
| Configuration fact | Stable entity/field identity; typed value and unit; requirement/observed/capability/assumption role; confirmation and exact source attribution. |
| Evidence observation | Permitted type/ID/version where real, recorded observation/hash/date and bounded note; legacy source text remains text. |
| Responsibility item | Stable ID, area/system membership, work item, participation where adopted, responsible party, requested timing, source/state and unknown owner. |
| Discovery follow-up | Existing eligible owner/reason semantics, explicit optional business due date, originating finding/fact and optional permitted Activity link. |

Final property/enum names follow current naming conventions. Do not invent catalogue IDs, rule-engine results or source versions to fill these structures. Preserve unsupported historical fields read-only and expose their absence/unknown state honestly.

An Activity link does not make the discovery follow-up's recorded due date identical to the Activity's current due date. Creating/completing an Activity is a separate authorised action; it does not automatically confirm a fact. Use the existing eligible-owner checks without granting estimating access to a follow-up owner.

## 5. W02 — build the native PPO shell and layout

Use the actual supplied/native Powerplants logo. At the inspected source its asset is `/brand/powerplants-logo-green-white.png` with the established 54 px shell treatment. Preserve its colours, proportions and clear space. Do not redraw a leaf, monogram or generic eco mark.

Use normal-width loaded Roboto, with the existing fallback stack. Nominal body text is 13–14 px, metadata 12–13 px, section headings 16–18 px and record identity 18–20 px. Do not stretch or condense a font to fit the image. Use one existing outline icon family with consistent stroke weight.

| Role | Token direction |
| --- | --- |
| Navy/text/primary action | `#242a37` |
| Secondary / muted text | `#596779` / `#667181` |
| Actual links / focus | `#355b80` / `#365d8b` |
| Menu/paper / content / hover | `#f5f6f8` / `#ffffff` / `#f0f2f5` |
| Borders/dividers | `#e1e5eb` / `#e9ecf1` |
| Confirmed text/fill | `#416d33` / `#edf5e9` |
| Warning text/fill | `#80530e` / `#fff2d9` |
| Neutral tag text/fill | `#526078` / `#edf0f5` |

Map these through shared tokens. Primary actions are navy, not bright green. Major table/panel surfaces are square and flat; small controls may use about 6 px corners and tags about 5 px. No gradients, glowing borders, heavy shadows or repeated nested cards.

At the desktop baseline, use the existing 76 px navy rail and 64 px white header, a 240 px expanded secondary menu, flexible main workspace and 360–400 px summary where space permits. Preserve the existing rail destinations/More location. Do not invent icons or a second app shell.

The continuous header contains an accessible icon-only menu toggle, about 12 px before **Estimating / Estimation Wizard**, the existing search plus quick-add and native information/help/notifications/account controls. Centre the combined search-plus-add group across the entire app width, including the rail; target within 2 CSS px across supported expanded/collapsed desktop compositions. Resolve collisions responsively. No visible Hide menu label, grey toggle block or divider immediately after it.

Secondary menu: grey paper, navy/slate labels, white active item, no coloured left border and no protruding collapse tab. Use an internal edge target with a larger accessible header alternative. Collapsed state is a 24 px strip with grip; hover alone does not open it. Reuse actor/module-scoped preferences and overlay/focus behaviour. More remains an overlay, without reflow, aligned to the expanded-menu boundary within 1 CSS px even when the secondary menu is collapsed. Cover affected My Work/Engineering consumers in regression evidence.

Use actual permitted navigation destinations: Discovery register, Estimation Wizard, Manual estimates and Draft quotations where supported. Do not fabricate links to unfinished modules. Keep existing paths:

| Route | Use |
| --- | --- |
| `/estimating/discovery` | Register/entry |
| `/estimating/discovery/new` | Creation with existing opportunity context |
| `/estimating/discovery/[id]` | Discovery, Alternatives and Revisions |
| `/estimating/discovery/[id]/costing` | Explicit manual-cost receiving flow |
| `/estimating/estimates/[id]` | Native manual workbook/history/output |

Preserve supported `opportunity`/`option` query context and validate any new URL state. URL values do not confer authority. Keep a compact record-context area, exactly three tabs (**Discovery / Alternatives / Revisions**) and exactly five steps (**Requirements / Configuration / Scope & delivery / Pricing / Review**). Counts come from permitted saved records. Revisions counts the viewed alternative's history; a working copy is not another revision. Step completion reflects actual findings, not a visited step.

The summary is white, square, flush right and full-height beneath the shared header, with a fine left divider and left-only shadow fading 12–20 px. Keep one main vertical scroll owner, local horizontal table scroll and appropriate menu/summary scrolling. Bottom actions end at the main workspace boundary and never cover fields or extend under the summary. Do not add a permanent step sidebar.

## 6. W02–W03 — complete all five steps

### Requirements

Resolve canonical opportunity/company/customer/Site/owner context. Capture included work, exclusions, assumptions and Full/Express/Unknown effort with real attribution. Show an areas table with Area, Facility, Use/crop context, Stage, Evidence/state and actions. Preserve Site / NoSiteRequired / Unknown meanings and validate dependent references on a Site change.

The initial form can be editable but not yet command-valid. The current blank draft has no work tags and empty follow-up reasons. Make the first valid incomplete save understandable: choose at least one supported tag, establish the scope mode and fill the required eligible-owner/reason details for unknowns. Do not fabricate answers or reasons. Malformed and valid-incomplete are different states.

Retain one canonical answer per adopted question:

| Question | Primary step | Contract |
| --- | --- | --- |
| Q01 Included work | Requirements | Required text, maximum 2,000 characters. |
| Q02 Exclusions | Requirements; reviewed in Scope & delivery | Required text, maximum 2,000, or explicit NoneDeclared. |
| Q03 Assumptions | Requirements; reviewed in Scope & delivery | Required text, maximum 2,000, or explicit NoneDeclared. |
| Q04 Contract review need | Scope & delivery | Optional Required / NotRequired / Unknown; not pricing approval. |
| Q05 Product description | Configuration | Required for ProductSupply; maximum 500 characters. |
| Q06 Product count | Configuration | Required for ProductSupply; integer 1–100,000 Each; not an automatically generated cost quantity. |
| Q07 Work on site? | Scope & delivery | Required for DefinedLabour; Yes / No / Unknown. |
| Q08 On-site work description | Scope & delivery | Required for DefinedLabour when Q07 is Yes; maximum 1,000 characters. |
| Q09 Freight responsibility | Scope & delivery | Required for Freight; PPO / Customer / Unknown. |
| Q10 Delivery description | Scope & delivery | Required for Freight when Q09 is PPO; maximum 500 characters. |

Preserve Empty / Deferred / Answered / Confirmed / Assumed, source attribution, hidden-answer history and reactivation/reconfirmation. NoneDeclared is not blank. Assumed is not Confirmed. Use active-answer projection without destroying retained hidden answers. Do not duplicate Q05/Q06 per equipment system.

### Configuration

Build the family overview, systems table, focused selected-system editor and evidence interactions specified in sections 7–8. Required confirmation findings must be server-derived under the declared extension definition. Existing Asset selection must never auto-confirm suitability or overwrite customer requirements.

### Scope & delivery

Provide precise responsibility/work-item capture linked to areas/systems, with supported inclusion/exclusion, responsible party, requested timing, source/state and owned unknowns. Keep requested dates, durations and commitments distinct. Use actual adopted line participation if available; optional extras need explicit saved representation and separate totals, not a second commercial-option model.

Reuse Q04 and conditional DefinedLabour/Freight answers. Delivery routing remains **Not configured** without an adopted rule set. No automatic supplier booking, project allocation, procurement or customer commitment. Business dates follow native conventions and timezone handling.

### Pricing

Show the exact saved estimate and discovery basis. Offer **Review scope for manual costing** only through the existing guarded receiving flow. Unsaved discovery must be resolved first; saving and adoption are separately acknowledged operations. Do not hide both behind Continue.

Retain Product / Labour / Freight / Engineering / Subcontract categories, decimal-string values, supported source/effective-date fields, unit, quantity, cost/sell and Allowance schema compatibility. Reuse `SYN-EST-ARITHMETIC-01`, exact base-10 rounding, AUD, ExcludingTax and tax-not-calculated labels. Internal money/margin requires existing authority.

Line items use separate columns. Cost-type views aggregate the same included lines. Packages are available only with saved membership; do not infer them from description text. Filters change shown lines, not estimate participation or total. Label a filtered subtotal explicitly. Optional/excluded amounts and unpriced scope remain distinct; price pending is not zero. Preserve manual overrides and never sum mutually exclusive alternatives or silently change the CRM forecast.

### Review

Show all readiness categories, source changes, unanswered requirements, assumptions, exclusions, responsibility gaps and saved-cost alignment. Findings navigate to the correct step/entity/field while preserving the proposal. Separate malformed-command errors, readiness blockers, required source review and informational notes.

Expose supported actions: Save discovery revision, Compare revisions, Review scope for manual costing, Open manual estimate and View/Create Draft quotation. Rendering Pending/Running/Ready/Failed is not Approved/Issued. Keep quote-safe projection and current/historical permissions; internal costs, hidden answers and inaccessible source details must not appear in customer-safe output.

## 7. Required equipment-family overview and coverage rules

Retain **Equipment families in this estimate** in Requirements and a compact version in Configuration. Requirements offers **Configure systems →**, which navigates without saving. Configuration offers one family filter, **All families** reset and separate Add controls; do not nest interactive buttons.

| Group | Fixture member | Unique-system count |
| --- | --- | --- |
| Controls & climate | Climate control | 1 |
| Fertigation | Fertigation | 1 |
| Monitoring & weather | Crop monitoring | 1 |
| Nursery machinery | None yet; Add available | 0 |
| Shared infrastructure | Shared network | 1 |

Keep Shared infrastructure compact, separate from the four equipment cards. Every system has one primary presentation group. Multi-area coverage does not turn a climate system into infrastructure. Expose Unknown/Other if needed for historical values and include it in the total. Counts use unique system IDs across the whole viewed working scope, unaffected by search/area/family filters. Use neutral badges; membership alone is not a green confirmed state.

Combine filters and display **N of total systems · M selected** when filtered. Summary and family totals remain global for the viewed scope. Select at most one row. If a filter hides the selected row, retain edits in the workspace draft, clear selection/editor and show a neutral prompt; resolve an unadded draft before hiding it. Zero rows/counts are valid states with clear/reset and permitted Add actions.

**All areas** is derived from the exact covered area-ID set in that revision. It is not a live wildcard. Adding an area does not silently expand existing controller/network coverage; expose a reviewable change. Rename changes labels. Removal previews affected systems, responsibilities and evidence; explicitly reassign or remove the working dependants. Never delete historical snapshots or manual cost lines as a cascade.

Distinguish Defined coverage, attributed Not area-specific and owned Unknown coverage. A NoSiteRequired case must not need dummy greenhouse IDs. Preserve one logical shared system and count it once even across several areas.

The summary's “to confirm” counts unique systems with required unconfirmed configuration; the attention strip counts individual findings. They can differ when one system has multiple findings. Do not reuse an inaccurate total or treat configuration counts as the whole workspace's readiness.

## 8. Configuration table, editor and actual evidence actions

Use **Systems & configuration** with the short explanation **“Define systems, area coverage and the evidence behind each configuration.”** Align local search, All areas, Columns, supported overflow and navy **+ Add system**. Use the existing table preference mechanisms for meaningful columns, retaining identity and keyboard alternatives.

Default columns are exactly **System | Area coverage | Equipment ref. | Intent | Evidence | State**. Use 44–48 px rows, fine dividers and neutral row selection. The table meets the section's usable edges without a rounded padded wrapper. Use local horizontal scroll rather than tiny text or stacked unrelated facts. Long values and narrative evidence need an accessible complete view.

The slim attention strip has a small amber icon, readable dark text and **Review items**. Keep the separate quiet information row: **“Suggested configuration, estimator-led decisions.”** Supporting text: **“Requirements, source evidence and review decisions stay with the draft. Equipment suitability needs a technical review.”** Include **View configuration evidence** there.

| Action | Actual destination/behaviour |
| --- | --- |
| Review items | Relevant configuration findings and selected system/field; a clear return/reset path. |
| View configuration evidence | Configuration evidence collection with recorded/current states and permitted sources. |
| Row evidence / View evidence | The particular observation, exact source where real and access permits; plain source text remains plain text. |
| View equipment | The actual permitted installed-equipment record/inspector; retain working edits. |
| Technical details | Labelled expandable typed fact editor/inspection area, not a fake calculator link. |

Below the table, provide an aligned two-column editor: System name, Equipment reference, Area coverage and Proposed work, plus intent as its own saved fact. Show Existing equipment where appropriate. Source lookup may offer observations, but user requirements/manual proposals are not silently replaced. Reuse current labels, field heights, focus and validation patterns.

Each technical fact has field identity, typed value/unit, role, source and confirmation. Keep customer-required capacity separate from equipment capability. Eight climate zones is not eight physical I/O channels. Preserve unknowns, incompatible units and unverified equipment labels. Define a bounded field catalog in W01; do not create a generic engineering rule engine.

Add/edit/remove modifies the working scope. Save discovery revision persists the complete validated successor. Removal cannot mutate installed records, saved costs or history. A failed save retains permitted work; an unknown outcome freezes conflicting writes until reconciliation.

## 9. Draft lifetime, navigation and commands

Own one in-memory discovery proposal above the steps/tabs, keyed by actor/session, workspace, alternative, base revision and schema. It contains all existing/new fields and the save reason. Same-alternative step/tab/editor/menu/summary changes retain it without repetitive discard prompts. A manual-cost proposal is a separate draft with its own saved discovery basis.

When changing the editing context, offer **Stay**, **Save revision then continue** where permitted, or **Discard working changes then continue**. Wait for save acknowledgment before navigating. Viewing another alternative never selects it. Read-only comparison of saved revisions may preserve the draft while stating that unsaved changes are outside the comparison. Inspecting evidence should not force a save.

Cover links, breadcrumb navigation, record selectors, programmatic router transitions, query-state changes, browser Back/Forward and installed-app reload. The current `useUnsavedChanges` hook uses `beforeunload` and captured anchor clicks; it does not itself cover every router/history path. Avoid duplicate prompts, popstate loops or trapping clean navigation. Native unload warnings have browser limits; do not promise restoration after a closed unsaved tab or add browser persistence of business data.

| Draft/command state | Required handling |
| --- | --- |
| Saved unchanged | Exact saved revision/readiness; no fabricated no-change revision. |
| Dirty and valid | Unsaved changes; schedule a read-only preview. |
| Temporarily malformed | Keep editable input and field messages; do not coerce blank numeric input to zero. |
| Preview pending/failed | Checking / Not checked for current work; saved cost/basis remains separate. |
| Saving | Freeze exact submitted payload and conflicting mutations; accessible progress. |
| Rejected | Retain proposal; focus safe field/error summary; explicit current-source comparison for stale expectations. |
| Unknown outcome | Reconcile original operation ID and payload before another mutation; never retry under a fresh ID. |
| Accepted | Read the returned saved result, clear only acknowledged draft state and retain the current step where valid. |
| Identity/access lost | Stop writes and clear no-longer-permitted content; reauthorise before fresh reads. |

Mutations retain canonical operation ID/hash, expected versions, reason, server actor/time, audit and durable outbox. Same operation/same payload has one effect; changed same-key payload conflicts. Current authority is checked before receipt recovery. Concurrency/source conflicts are not permission to overwrite current content.

## 10. Separate three service responsibilities

| Responsibility | Input/result | Restrictions |
| --- | --- | --- |
| Saved summary read | Viewed alternative, exact saved estimate/version/basis, permitted total/currency/tax and safe availability states. | Read through native authority; no requirement to select/edit/complete discovery just to see a permitted saved total. |
| Working discovery preview | Exact draft/base/schema/context; validity, readiness, findings, counts and required acknowledgments. | Read-only; no saved revision, Activity, mutation receipt or prices. |
| Costing preview/adoption | Current selected Active Complete saved revision plus owner/group/context/estimate expectations and reviewed manual input. | Existing guarded receiving operation; never weakened to serve the sidebar. |

Do not load one alternative's title with another's saved money. No estimate, legacy basis, inaccessible estimate and saved zero are different cases. Quote-safe permissions do not grant discovery/internal-cost access. The current all-group authority/lock contract must not be weakened because the UI wants a partial count.

Debounce/coalesce valid previews and bind responses to the exact draft fingerprint, base revision, schema and observed context. Ignore late results and invalidate relevant confirmations when value/unit/source changes. Only current evaluated work can supply readiness; Save revalidates. A pending or failed preview cannot retain stale Complete status or enable adoption.

Use stable machine-readable findings with safe category, step/entity/field, message and permitted action. Malformed/denied references block acceptance; valid owned unknowns can save but remain Incomplete where mandatory; stale source requires review; unavailable optional routing/pricing integrations are not invented mandatory blockers. Overall readiness considers all required categories, not only the two pictured configuration findings.

Add bounded reads for saved summary, history enumeration, comparisons and evidence as needed. Specify DTOs, error envelopes, cursor ordering and consumers using current API conventions. Do not fetch all historical snapshots just to show a count, or issue remote requests per row merely for badge totals. Scope caches to actor/workspace and invalidate safely.

## 11. W03–W04 — immutable scope, copies and history

Preserve stable estimating entity IDs through rename/reorder/successor revisions. New systems use new IDs; a reused label does not resurrect a removed record. IDs are qualified by workspace/alternative and do not impersonate Asset or Facility IDs.

Copies create independent destination entities and immutable provenance to the exact saved source revision/entity. Remap coverage, responsibility, fact, evidence and follow-up links atomically. Retain canonical external references only when permitted; never keep mutable child links into the source option. Copied Confirmed facts require reconfirmation; do not copy money, quotations or create Activities implicitly.

The existing exact-source `CopyDiscovery` command rejects an edited discovery body. Preserve that rule. Plan destination identity allocation so preview, acceptance and original-operation retry agree; do not generate a different random graph on each preview or break comparison hashes. Document the operation-bound mapping/hash rules and prove replay behaviour.

Alternatives view: real rows with label/selected/state/current revision/readiness/estimate-version/amount where permitted/updated/owner/actions. Preserve ten options including archived; archiving does not free a deleted slot. Selected cannot archive; reopen remains unselected. Fresh starts without inherited answers/money. Select, Archive, Reopen and Copy are explicit reasoned current-version commands with whole-group Draft guards.

Revisions view: real immutable history with revision, predecessor/copy source, author/time/reason/readiness/source state and linked basis where permitted. Paginate stably; do not truncate to ten snapshots. LegacyManual states **“E1 manual basis — E2 questionnaire not recorded.”** Use as starting point creates a new reviewed proposal, never rewinds or edits history. An older source revision needs a separate exact historical-source reference and current concurrency expectations; specify that receiving extension in W01 without disabling the existing current-revision guard.

Compare two exact saved discovery sources and independently chosen compatible cost versions. Show baseline/target IDs/labels/bases before differences. Match same-alternative entities by ID and copied entities by exact lineage; unrelated same-label entities are Added/Removed/Not comparable unless a separately adopted correspondence exists. No fuzzy automatic match. Report membership, quantity/unit, value, source/revision and confirmation changes deterministically. Preserve NoneDeclared, blank, missing, deferred and zero. Self-comparison is empty. Check permissions on both sides and keep uncosted distinct from zero.

## 12. Schema, confirmation and preservation engineering

Do not put new fields into the immutable ten-question definition or add configuration UUIDs to `confirmed_question_ids`. That validator accepts only existing Q01–Q10. Add a separate versioned configuration-confirmation representation with exact fact ownership/value/unit/source/review binding. Stale, forged, cross-system or changed-value confirmations must fail at the server.

Inventory every version-sensitive path: create/save/branch validation; current and historical reads; source-context preparation; hidden-answer restore; copy/inherit; comparison; saved summary; costing preview/adoption; ordinary cost saves; quote-safe output; historical receipts and original-output recovery. All must interpret the captured schema/definition and preserve old hashes/bytes. Unknown future versions fail explicitly; never silently strip fields or treat them as r01.

Keep the existing saved-scope limits of ten Facilities and one hundred equipment references, plus one to three work tags. New area/system/fact limits must be explicit in W01. Candidate lookup page limits are not saved-selection limits. Retain selected permitted records outside the visible first page.

Both discovery and costing enforce **65,536 bytes for the complete canonical UTF-8 request**, including envelope fields, IDs, reason, hashes and confirmations. Test multibyte text and envelope overhead; a character count is insufficient. Never truncate evidence/notes to fit silently. Evidence binaries belong in existing authorised document storage, not embedded/base64 command content.

Use additive forward migrations only where needed and allocate from the actual registry; no migration number is reserved here. Preserve old E1 A/r01, E2 options/revisions, cost-basis links, CRM primary references, canonical receipts and stored quote HTML/PDF. Changing selected alternative must not switch the primary forecast reference or sum estimates.

Follow current AGENTS cross-domain migration assertions and hosted-upgrade gates. When altering `ppo.business_identities`, settle pending `ppo.identity_target` checks before ALTER and restore deferral afterward, as current guidance requires. Prove upgrades across pending migrations with existing records, not only against a fully current empty database. Do not reset accepted originals to obtain a green result.

If justified capabilities/grants change, update generated access-review material, pinned counts and grant/reseed allowlists required by AGENTS. Do not invent a new role when existing scoped authority expresses the action. Existing quote-safe and internal-cost permissions remain distinct.

## 13. W05 — exact saved costs and output

The summary follows the viewed alternative, independently of which alternative is selected. Display its working/saved discovery identity, server readiness/findings, full-scope counts, exact saved estimate/version and exact discovery cost basis. If newer discovery is uncosted, say so while preserving saved prices.

For adoption, resolve unsaved discovery, save it explicitly if appropriate, then re-preview the current selected Active Complete saved revision. Preserve owner/edit, whole-group Draft, exact source-context, current revision and expected estimate-version checks. Do not fall back to an older Complete revision to bypass an incomplete current revision.

Ordinary manual estimate saves inherit their exact existing discovery basis. A newer scope is adopted only through the separate receiving command. Keep independent estimates per option, legacy exceptions, rounding, overrides and output provenance. Draft quotation comes from one exact saved cost version and the Site of that basis; historical originals are unchanged. Render Ready does not mean Approved or Issued.

Where a source integration is unavailable, show an accurate unavailable state and retain manual evidence/work. Do not generate fictional priced lines, supplier commitments, routing results, engineering calculations or approval states to make the workflow appear finished.

## 14. Reproducible Northbank Configuration fixture

Create this scenario with existing native fixture helpers/commands and the new validated contract. It is synthetic test data, never a production default or hard-coded UI fallback. Use canonical IDs and declared display-reference mappings.

| Context | Value |
| --- | --- |
| Record | Northbank climate & irrigation upgrade |
| Customer/Site | Northbank Nursery · Caboolture site |
| Viewed and selected | Alternative A — Base scope · Selected |
| Working identity | Working copy based on Discovery r03 · Unsaved changes |
| Owner | Dean Fiedler |
| Tabs | Discovery active; Alternatives 3; Revisions 3 for A |
| Step | Configuration active; Requirements may show a completed check |
| Scope | Greenhouse 1 and Greenhouse 2 are growing areas; Irrigation shed is ancillary at the same Site |
| Counts | 2 growing areas · 4 systems · 2 to confirm |
| Effort/routing | Full · Not configured |

| System | Area coverage | Equipment ref. | Intent | Evidence | State |
| --- | --- | --- | --- | --- | --- |
| Climate control | Greenhouses 1 + 2 | EQ-00142 | Retain + expand | Site notes r02 | Confirm capacity |
| Fertigation | Irrigation shed | Proposed | New | Estimator input | Confirmed |
| Crop monitoring | Greenhouses 1 + 2 | EQ-00158 | Retain | Equipment record | Confirm model |
| Shared network | All areas | Proposed | New | Scope brief r03 | Confirmed |

All areas explicitly covers the two growing areas and ancillary shed. Family counts are 1/1/1/0 plus infrastructure 1. Select Climate control and show **4 systems · 1 selected** plus **Shared systems are counted once.** The strip says **2 configuration items need confirmation** with Review items.

Editor: Existing equipment; View equipment; Technical details; System name Climate control; Equipment reference EQ-00142 · Climate controller; Greenhouse 1/Greenhouse 2 chips; Proposed work Retain controller and expand zones.

| Evidence fact | Value/state |
| --- | --- |
| Customer requirement | 8 climate zones — Estimator brief · confirmed |
| Equipment capability | Not yet verified — Capacity check required |
| Follow-up | Confirm controller capacity · Dean Fiedler · Due 23 Sep 2026 · View evidence |

The two summary findings are **Confirm controller capacity — Climate control** and **Confirm existing sensor model — Crop monitoring**. Create valid attributed facts to justify the two other Confirmed rows; do not paint a green state over missing data.

Set up A's r01→r02→r03 history with exactly three saved revisions. r02 must be Complete before costing; advance the manual estimate to **Estimate v04**, totalling **AUD 58,400.00** using supported manual arithmetic. Save an incomplete r03 with changed/unverified facts, then make a visible unsaved edit. Create B fresh and C from an exact permitted copy so three alternatives are real. Preserve v04's r02 basis throughout; avoid incidental extra A saves during setup.

The summary displays:

- Estimate summary; Alternative A; Selected alternative.
- Viewing: working copy of r03; Discovery readiness: Incomplete; the compact scope counts.
- Saved estimate · Estimate v04; AUD 58,400.00; Excluding tax · tax not calculated.
- Cost basis: Discovery r02.
- Newer discovery is not yet costed. Saved prices remain unchanged.
- Open manual estimate; the two findings; Estimating effort: Full; Delivery routing: Not configured.
- Compare alternatives; View revision history.

Use exactly one discreet Synthetic preview marker. Bottom actions: Working copy of discovery r03; Previous; Save discovery revision; Continue →. Obtain a real save reason through the command flow. The amount is loaded from v04, not recalculated from r03 or inferred from the image.

The generated image is a 1586 × 992 composition reference, not native CSS evidence. Correct its narrow-looking type, bright active-step treatment, approximate icon/geometry and omitted/crowded controls using this written contract and actual assets. Preserve both Review items and View configuration evidence.

## 15. W06 — native verification and evidence

Use meaningful tests for changed behaviour and all applicable required repository gates. Current scripts include `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:db`, `npm run test:http` and `npm run test:browser`. Use the current compiled-browser setup, environment conventions and dependencies; do not run against guessed connection settings or expose credentials.

Database suites must use **`ppo_synthetic_test`**. Extend existing `tests/browser/estimating-discovery.spec.ts` and `tests/browser/estimating-cost-basis.spec.ts` where appropriate. Preserve their conflict, lost-response and narrow-screen proofs. Add tests at the layer that owns the risk; do not replace service/database assertions with screenshots or add tests that merely mirror implementation branches.

| Evidence type | Required proof |
| --- | --- |
| Unit/contract | Definition dispatch, counts, filters, lineage, deterministic diffs, units, confirmation binding and boundary validation. |
| Database/service | Same-site/option integrity, immutable history, operation replay, races, exact basis, authority and atomic rollback. |
| HTTP | Strict request/error envelope, actual capability/reference checks, bounded reads and safe denied responses. |
| Native browser | All five steps/tabs, family/editor/evidence actions, dirty navigation, stale preview rejection, read-only/incomplete summary, exact adoption and original-operation recovery. |
| Upgrade/restart | Affected legacy records, hashes, receipts, outputs, registry/grant assertions and saved recovery after the required separate restarts. |
| Visual/accessibility | Actual font/assets, shell geometry, readable fields/tables, focus/labels/announcements, contrast, responsive behaviour and unobscured actions. |

Measure 1920 × 1200 and 1440 × 900 CSS-pixel desktop layouts, then widths 1280/1024, 768/390 and 320. Test 200% zoom and reflow. Reuse shared breakpoints; collapse the summary/use accessible overlays when the main editor needs room. No body-level horizontal overflow. Tables can scroll locally; comparisons can stack on narrow screens. Modal views manage Escape/focus return; complementary desktop panels do not trap focus.

Cover loading, empty/no-match, no estimate, read-only, denied/stale source, archived option, option cap, invalid/incomplete draft, stale workspace, unknown save outcome, unavailable integration and output rendering/failure. Do not communicate status only through colour or show old content under a newly selected identity.

Record maximum-supported fixture size, complete request bytes, read/request counts and measured main-read/preview/save/compare timings with a named environment. Avoid unbounded history requests and per-row remote badges. Do not invent a production SLA or broaden testing without a concrete risk.

Run applicable foundation/naming/documentation checks required by AGENTS. Distinguish tests authored, executed, failed, blocked and not run. Compare environmental failures against unchanged main before attributing them to this work. Fix observed material defects before handover; retain historical failed evidence.

## 16. Delivery sequence and continuation

| Package | Deliverable | Exit proof |
| --- | --- | --- |
| W01 | Current-code gap map; decided schema/DTO/limits/readiness/lineage/guard contracts; migration decision | No critical representation ambiguity before persistence work. |
| W02 | Shared-shell refinement, native five-step presentation, tabs/family overview and existing-field flow | Current E2 journey remains usable in desktop/compact shell; shared consumers retain navigation. |
| W03 | Structured scope, editor/evidence/follow-up fields, previews and validation | Actual save/reload, bounded references, schema compatibility and no implicit side effects. |
| W04 | Alternatives, immutable history and exact comparison | Independent viewing/selection, copy lineage, current authority and deterministic differences. |
| W05 | Saved-summary reads, exact-basis costing and Review/output links | New discovery leaves older saved costs/output unchanged; adoption remains explicit and guarded. |
| W06 | Executed verification, measured native captures and maintained handover | Exact tested source, acceptance mapping and specific remaining limits. |

W02 can begin with existing-field mappings; W03 requires W01's contract; W04 uses the adopted identity/source model; W05 preserves the current costing path throughout. Do not label W02 alone as module completion. Avoid long-lived nonfunctional scaffolds that obscure missing W03/W04/W05 behaviour.

Maintain one concise continuation record in the established delivery location, using an existing file where suitable. Record branch/commit, current package, decisions, completed behaviour, tests/results, defects, pending operations, blocked dependencies and next action. Update it at meaningful checkpoints and before ending a long session. Context compaction is not completion; resume from the record and current worktree.

Continue routine authorised implementation choices without repeated approval requests. Stop only for a concrete access/environment blocker or new business-policy decision outside scope that prevents the remaining action. Complete unrelated independent work first and identify the exact blocked behaviour. This brief does not authorise production integration, external messages or deployment; commit/push/PR/merge/deploy authority comes from the execution session's current instructions.

## 17. Required handover and completion statement

Deliver:

1. Exact branch/commit and implemented W packages; changed routes/components and any migration.
2. Actual new schema/DTO/command/confirmation/readiness/lineage decisions and source fingerprints.
3. Acceptance IDs mapped to test/run or measured evidence; unavailable dependencies and justified non-applicability distinguished from missing mandatory work.
4. Native desktop/compact captures with viewport, route, fixture/schema and tested source; targeted evidence of other steps and Alternatives/Revisions.
5. Compatibility/restart evidence for old records, cost bases, receipts and original output.
6. Remaining defects with practical impact, environmental blocks, unrun checks and the next concrete action.

Update maintained decisions, STATUS, requirement/document/UI registers and delivery notes where applicable. Preserve parent IDs and issued sources. Do not claim owner acceptance, business approval, deployment or production readiness from a green test run or a generated image.

Before finishing, reconcile every visible control with a real permitted destination/action, every new field with save/reload/copy/compare behaviour, and every summary label with its actual data basis. Mandatory native features cannot be marked complete through fake data, disabled buttons or an unimplemented integration stub.

## 18. Full acceptance matrix

These local IDs preserve the existing plan lineage and do not replace parent PPO/EST requirements. Record applicability and executed evidence. The matrix below is synchronised with refinement plan r04.

| ID | Required proof |
| --- | --- |
| ES02-T01 | Existing register, create, workspace, costing and estimate deep links resolve with current permissions and preserved opportunity/option context. |
| ES02-T02 | One shell, compact breadcrumb and essential record/revision/save context; no duplicate large title band. |
| ES02-T03 | Search/quick-add centre stays within 2 CSS px across expanded/collapsed menu and open/closed summary on supported desktop layouts. |
| ES02-T04 | Menu uses accepted expanded/24 px collapsed treatment; edge/header controls work by keyboard; hover alone never opens it. |
| ES02-T05 | More overlays without reflow, aligns within 1 CSS px of the expanded-menu coordinate and restores state/focus. |
| ES02-T06 | Flush tables, separate important columns, readable row density and local horizontal scroll; no unintended outer overflow or clipped validation. |
| ES02-T07 | Column preferences survive changes; stale preferences recover; sticky offsets and pointer/keyboard actions remain correct. |
| ES02-T08 | Switching step/tab or viewing another alternative does not save, select, confirm or adopt scope. Unsaved navigation is guarded. |
| ES02-T09 | Canonical opportunity/customer/site identities and owner rules hold; free-text labels cannot impersonate record IDs. |
| ES02-T10 | All ten adopted questions retain type, activation, limits and source states; server derives Complete only from required confirmations. |
| ES02-T11 | NoneDeclared, unanswered, Deferred, Assumed, zero and blank remain distinct through save, copy, compare and customer-safe projection. |
| ES02-T12 | Hidden answers remain in history; reactivated/copied answers require appropriate reconfirmation. |
| ES02-T13 | Multi-area scope reloads with stable IDs, valid Facility/Asset references and one-Site membership; no implied child membership. |
| ES02-T14 | Shared systems cover multiple areas without duplicate quantities/costs. Removing/reordering a row does not change another row's identity. |
| ES02-T15 | Reference selectors preserve permitted selections beyond the first page; truncation/search/pagination are honest and access-scoped. |
| ES02-T16 | Existing facility/equipment/option/payload limits and adopted extension limits reject excess without silent truncation. |
| ES02-T17 | Configuration keeps customer requirement, observed fact, product capability and assumption distinct; incompatible units are not auto-confirmed. |
| ES02-T18 | Unknowns retain reason/source/owner; saving a revision creates no implicit follow-up Activity or downstream commitment. |
| ES02-T19 | Delivery routing remains Not configured without an adopted definition; no sample margin/discount/routing rule becomes authority. |
| ES02-T20 | First save atomically creates workspace/A/r01/selection; incomplete discovery is permitted and clearly labelled. |
| ES02-T21 | Fresh/copy alternatives retain correct provenance, confirmation downgrades and unselected state; costs and quotes are not copied implicitly. |
| ES02-T22 | Selected option cannot archive; reopen stays unselected; cap includes archived; all relevant actions respect whole-group Draft guards. |
| ES02-T23 | Alternative comparison uses exact sources; uncosted is not zero; inaccessible records do not leak through counts, diffs or totals. |
| ES02-T24 | Revision comparison detects add/remove/value/unit/source/state/membership changes by ID; self-comparison is empty; narrative remains readable. |
| ES02-T25 | History is immutable and paginated without the preview's ten-snapshot deletion; LegacyManual remains explicitly legacy. |
| ES02-T26 | New source adoption presents affected facts and required acknowledgment; deactivation and Site change preserve historical meaning. |
| ES02-T27 | Stale workspace/source/estimate-version commands refuse atomically, preserve permitted drafts and support current-source comparison. |
| ES02-T28 | Same-operation replay has one effect; changed same-key content conflicts; lost responses reconcile the original ID before further mutation. |
| ES02-T29 | Revoked current/historical source access is rechecked for reads, preview, comparison, mutation, receipt and output recovery. |
| ES02-T30 | Cost adoption requires selected Active Complete discovery, current owner/permissions, exact expectations and permitted group state. |
| ES02-T31 | Each option has its own estimate; ordinary cost saves inherit exact basis; newer incomplete discovery leaves prior costs intact. |
| ES02-T32 | Decimal rounding and quantities match existing arithmetic; margin and markup differ correctly; currency/tax labels remain accurate. |
| ES02-T33 | Known total, displayed subtotal, optional/excluded scope and unpriced items reconcile; alternative amounts never aggregate into the forecast. |
| ES02-T34 | Manual overrides survive source changes; unavailable pricing/calculation integrations remain honestly unavailable. |
| ES02-T35 | Quote-safe access works without internal-cost permission where already supported, and never exposes internal costs, hidden answers or denied sources. |
| ES02-T36 | Draft output uses one exact saved cost version and its Site; render status is distinct from approval/issue; prior bytes remain unchanged. |
| ES02-T37 | Concurrent save/select/archive/first-cost operations cannot produce inconsistent selection, partial records or mismatched basis links. |
| ES02-T38 | Database constraints refuse direct invalid cross-company, cross-option, predecessor and immutable-history mutations. Audit/receipt/outbox failures roll back. |
| ES02-T39 | Forward upgrade and repeated synthetic seed preserve old identities, DTOs, hashes, receipts, CRM primary reference and exact quote files. |
| ES02-T40 | Reload and, where persistence changes, separate application/database restart recover saved scope, selection, costs and original receipts/output. |
| ES02-T41 | Desktop, tablet, phone and 320 px layouts keep actions reachable, tables locally scrollable and comparison readable. |
| ES02-T42 | Keyboard/focus, labels, step semantics, modal return and announcements work; colour is not the only status/difference signal. |
| ES02-T43 | Rapid option/source navigation cannot mix old content with new actions; failed/unknown saves never show false success. |
| ES02-T44 | Shared-shell regression checks cover actual affected consumers, including My Work and Engineering materials; no application-wide restyle regression. |
| ES02-T45 | The required family overview appears in Requirements and Configuration with correct navigation/filter semantics, neutral badges and separate keyboard-operable Add controls. All families resets the filter without mutation. |
| ES02-T46 | Four family groups plus infrastructure count unique system IDs and reconcile to the summary; multi-area coverage never duplicates a system. Global totals remain stable under combined filters; filtered footers and empty states are correct. |
| ES02-T47 | Two growing areas plus the ancillary shed are represented and labelled accurately; All areas covers the whole scoped set. No Facility type, question tag or family ID is silently substituted. |
| ES02-T48 | Filtering out the selected row retains working edits, clears its selection/editor and never presents a hidden record as selected; a new unadded draft cannot be discarded silently. |
| ES02-T49 | Add/edit/remove and Technical details use persisted typed fields, explicit units, coverage validation and native permissions. Unsupported historical fields remain readable; no fake calculator or dead action is presented. |
| ES02-T50 | Review items, View configuration evidence, View evidence and View equipment reach their distinct permitted targets and preserve/guard edits; stale/denied evidence does not leak names or content. |
| ES02-T51 | Confirmed requirement for eight zones remains distinct from unverified capacity; two system findings match the table/summary. Configuration confirmation is not global readiness, engineering approval or costing adoption. |
| ES02-T52 | The native Northbank fixture has three alternatives, three saved A revisions, unsaved r03 changes and Estimate v04 on Complete r02. AUD 58,400.00 remains unchanged before/after discovery edits and save; no cross-alternative total is used. |
| ES02-T53 | Each workspace tab/step has correct semantics and appears once; fixture labels, one synthetic marker, navy controls, actual logo/font and both evidence/attention links conform to §4.6. Verify native rendering rather than pixel-tracing raster defects. |
| ES02-T54 | Saved state/revision/time appears only after server acknowledgment. Previous/Continue/filter navigation cannot allocate a revision; stale or unknown outcomes retain/reconcile the original operation and never report success prematurely. |
| ES02-T55 | The summary follows the viewed alternative and its permitted estimate basis during rapid navigation; no old-option amount flashes under a new identity or appears in a denied DOM projection. |
| ES02-T56 | New schema readiness, limits, canonical ordering and copy/reconfirmation rules preserve legacy r01 reads, hashes and prior Complete bases; incomplete extended scope cannot pass basis adoption through the old questionnaire alone. |
| ES02-T57 | A read-only user or viewer of an unselected/archived/incomplete alternative receives only the permitted saved-cost projection without invoking adoption preview or weakening its owner/Complete/selected guards. No-estimate, denied and legacy states remain distinct. |
| ES02-T58 | Edits across all five steps survive same-alternative tab/step/editor changes; record changes and browser navigation apply the documented guard. Save-then-continue waits for acknowledgment; discard is explicit; identity loss clears protected content. |
| ES02-T59 | Late/failed previews cannot replace findings for a newer draft, mark malformed input Complete, enable adoption or overwrite saved costs. A preview has no durable business revision, mutation receipt, Activity or cost effect; routine access logging remains permitted. |
| ES02-T60 | Four proposed systems coexist with one to three unchanged work tags. Legacy source strings and owner/reason follow-ups remain readable; new dates/typed evidence/Activity links are versioned and not fabricated for historical rows. |
| ES02-T61 | Copied alternatives have independent child identities and exact lineage; all child memberships remap correctly. Rename/reorder preserves identity; same-label unrelated entities are never silently paired or coupled. |
| ES02-T62 | Revision/history counts and pagination use real permitted saved sources, stable ordering and bounded reads; a comparison request cannot leak denied data, fetch unbounded history or manufacture a revision. |
| ES02-T63 | Save-blocking validation, readiness blockers, informational findings and group/authority holds produce the specified actions. An empty configuration strip cannot override required findings elsewhere. |
| ES02-T64 | W06 records actual request/payload bounds and native evidence at the tested source, including read-only/incomplete summary, dirty navigation and maximum-supported scope; unrun checks and unavailable integrations remain explicit. |
| ES02-T65 | Browser Back/Forward, programmatic router changes, record selectors, anchor links and installed-app reload handle dirty/pending work correctly; same-alternative presentation changes retain edits without duplicate prompts or history loops. |
| ES02-T66 | All areas is derived from explicit revision membership. Adding/renaming/removing areas does not silently expand coverage or cascade-delete history/costs; Defined/Not area-specific/Unknown coverage validates its own fields. |
| ES02-T67 | CopyDiscovery preserves exact-source/no-edited-body rules; destination IDs, remapped membership and lineage remain stable through preview, acceptance, lost response and replay. |
| ES02-T68 | Every compiler/read/basis/output path dispatches captured schema correctly; extended confirmations are separate from the ten question IDs and reject forged, cross-system, stale-value/unit/source or future-version inputs. |
| ES02-T69 | Complete discovery and costing envelopes enforce the 65,536-byte canonical UTF-8 limit with multibyte notes, IDs/reasons/hashes/confirmations included; lookup-page and saved-reference limits remain distinct. |
| ES02-T70 | The first-save journey turns an initially unfilled draft into a valid incomplete revision through explicit work tags, scope mode and eligible owned unknowns; it never fabricates confirmations, reasons or reference records. |

## 19. Reference identity and evidence limits

| Reference | Verified identity |
| --- | --- |
| Wizard HTML r03 | SHA-256 `7ce47597beb1f16e161bac1381c7cfaaabaf4eff357dcbf65ef558f0c02252b2` |
| Theme board r22, supplied r22(2), identical to r22(5) | SHA-256 `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |
| Latest generated ES-02 desktop mockup r03 | SHA-256 `47b1fd984bb17aaf9d54e99c2646a3b7d5c748af4ce908d2137a06a77158f303` |
| Repository anchor | `b4806afeb0ded1931b844a997621e2e300f7c7b6` |

The image's session filename was `exec-5173b848-06f4-40d3-8250-d9c2d5e1b904.png`; `PPO-ES-02-Estimation-Wizard-Desktop-UI-Mockup-r03.png` is a suggested descriptive name, not a verified repository path. The approved native shell and actual logo/tokens control appearance when a reference is missing. Never claim to have inspected an unavailable EQ-01 r10 image or another missing attachment.

The plan and this brief were prepared from source/document/image inspection. No native ES-02 refinement was implemented or tested by their preparation. Repository behaviour may change after the anchor; recheck it and preserve newer work.
