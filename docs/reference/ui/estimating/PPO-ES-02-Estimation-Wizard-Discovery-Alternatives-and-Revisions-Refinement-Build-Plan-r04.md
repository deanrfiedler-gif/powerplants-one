---
document_id: PPO-ES-02-REFINEMENT-PLAN
title: Estimation Wizard — discovery, alternatives and revisions — refinement build plan
revision: r04
date: 2026-09-21
owner: Dean Fiedler
product: Powerplants One
scope_id: ES-02
status: Implementation specification updated from UI audit; implementation and owner acceptance pending
repository: https://github.com/deanrfiedler-gif/powerplants-one
source_branch: main
source_commit: b4806afeb0ded1931b844a997621e2e300f7c7b6
design_reference: Latest ES-02 desktop mockup r03 generated in this conversation
functional_reference: PPO-Estimation-Wizard-Container-r03.html
supersedes_revision: r03
companion_prompt: PPO-ES-02-Estimation-Wizard-VS-Code-Implementation-Prompt-r03.md
theme_reference: powerplants-one-theme-style-board-r22(5).html
---

# Estimation Wizard · discovery, alternatives & revisions

**Refinement build plan r04 · ES-02 · Powerplants One · 21 September 2026 (Australia/Brisbane)**

## Revision r04 — attachment-ready implementation package

This revision preserves the established design, domain boundaries, W01–W06 and ES02-T01–T64. The companion is now a full attachment-ready execution brief; the former 8,000-character limit no longer applies. Six additional acceptance cases cover navigation interception, explicit coverage membership, deterministic copying, schema/confirmation dispatch, complete-request byte limits and the first valid incomplete save.

Use the plan as the detailed behaviour/acceptance contract and the companion as the ordered implementation instructions. The new brief expands implementation guidance without adding unapproved pricing, engineering or commercial authority. Native verification and owner acceptance remain pending.

| Audit finding | Resolution in r03 | Why it matters |
| --- | --- | --- |
| Existing costing preview requires edit authority and Complete selected discovery. | Separate read-only saved-cost summary from readiness and adoption previews, §8.5. | Incomplete, unselected and read-only views must still show their permitted saved basis accurately. |
| Existing `scope.systems` means one to three work tags; evidence source is text; follow-up contains owner/reason only. | Explicit legacy-to-extension boundary, §8.2. | Four proposed systems, versioned evidence and due dates cannot be squeezed into those existing fields. |
| Navigation and dirty-state requirements did not fully specify draft lifetime. | Action/guard matrix and working-copy lifecycle, §3.4–3.5. | Step changes must retain work; record changes must never mix or silently discard it. |
| Stable IDs alone do not define comparison between copied alternatives. | Qualified identity and copy-lineage matching, §8.6. | Copies need independent edit identity and reliable, non-heuristic comparison. |
| Validation, API projections and verification evidence were dispersed. | Finding classifications, read obligations and completion checklist, §8.5 and §12.1. | Builders and reviewers can assess concrete behaviour and evidence instead of interpreting broad aspirations. |

For implementation, read §3.4–3.5 and §8.2/8.5–8.7 before W01 design decisions. Use §4 for appearance and fixture content, §5–7 for workflow, §10 for delivery sequence and §11–12 for proof. Preserve mandatory features; unavailable integrations are the bounded exceptions in §2.4.

The latest image establishes the intended composition. Build the controls as native components using the actual PPO assets and shared tokens. The image is not a contract for persistence, permission, readiness or pricing, and its remaining raster defects are explicitly corrected in §4.6.

Use this plan with `PPO-ES-02-Estimation-Wizard-VS-Code-Implementation-Prompt-r03.md`. The companion starts the implementation; this document retains the full requirements and evidence checklist. Complete W01–W06 for the independently deliverable ES-02 scope, with bounded checkpoints. W02 alone is not completion of the module.

## 1. Intended outcome

Refine the existing Estimating discovery application into a coherent five-step workspace that helps an estimator establish scope, configure proposed systems, record responsibilities, review manual costs, compare alternatives and preserve an intelligible revision history.

Apply the accepted Powerplants One UI refinements: a compact breadcrumb header, collapsible secondary menu, full-width supporting tables, separate columns for important facts, restrained status colours and a square right-hand summary panel. Retain the current application shell, canonical records, permissions, immutable revisions and manual-costing workflow.

The completed page must answer:

1. Which opportunity, customer, site and alternative am I working on?
2. What is included, excluded, assumed or still unknown, and where did that information come from?
3. Which areas, facilities, existing equipment and proposed systems belong to this scope?
4. What changed between these exact revisions or alternatives?
5. Which saved discovery revision supports these costs and this Draft quotation?
6. What requires my action before the next permitted step?

Use the **latest ES-02 desktop mockup r03** as the composition study, the supplied **wizard HTML r03** as the functional study, **theme board r22** as the visual token reference, and the written refinements in this plan as the precise requirements. Integrate into the native application; do not embed the standalone HTML or create a second application shell.

This document specifies the build. It does not claim that the refinement, a pricing policy, owner acceptance or deployment has been completed.

## 2. Evidence, starting point and scope

### 2.1 Source register and precedence

| Source | What it establishes | How to use it |
| --- | --- | --- |
| Current request and accepted UI refinement direction | Build from the revised design; retain the equipment-family overview and estimator-led evidence message. | This plan resolves presentation and interaction details in §4.6–4.9. |
| Latest ES-02 desktop image r03 and mockup audit r01 | Configuration composition, family cards, shared infrastructure, table/editor and saved-versus-working summary. | Composition reference, not an owner-approved native baseline. Apply the written corrections in §4.6. |
| Current native shell at the source commit below | Actual logo asset, rail/header proportions, outline icons, global search, quick-add and account controls. | Reuse existing components and assets; apply only the explicit shared-shell refinements. |
| App Page Register r04, ES-02 | **Refine existing**; display title used here; rank 47, phase 03; placement Tabs. Retain E2 discovery/options/manual costing and complete broader comparison, multi-area scope and source-change handling. | Preserve scope identity and dependency boundaries. Rank is an ordering reference, not a delivery date. |
| `PPO-Estimation-Wizard-Container-r03.html` | Requirements, Configuration, Scope & delivery, Pricing and Review; areas, system families, evidence, packages, live summary and revision study. | Translate applicable behaviour into native components and reviewed contracts. Its synthetic rules, prices and local storage are not production services. |
| `powerplants-one-theme-style-board-r22(5).html` and supplied screenshots | Typography, semantic colours, tabs, tables, controls and surface treatment. | Reuse shared tokens. Preserve readable comparison and narrative content. |
| EQ-01 build plan r02 and existing-modules UI refinement prompt r01 | Accepted table, header, menu, More overlay, hierarchy and snapshot refinements. | Apply the applicable patterns without turning the wizard into an Equipment register. |
| Repository `main` at `b4806afeb0ded1931b844a997621e2e300f7c7b6` | Delivered E2 discovery, persisted options, immutable revisions and exact-basis manual costing. | This is the inspected implementation anchor. Recheck the actual checkout before coding. |
| ADR-0025, ADR-0026, ADR-0027 and current E2 handovers | Adopted questionnaire, source comparison, option persistence, costing, command and preservation rules. | Later implemented ADR-0027 behaviour supersedes earlier statements that manual-cost receiving is still unavailable. |

The repository anchor was rechecked for this revision on 21 September 2026. The prior r01 plan used `920b058a7ee6e20951edf36b21374f75f25dfd29`. Local work, later commits and unmerged branches may differ. Preserve them; do not reset a newer checkout to this evidence anchor. References inherited from r01, including the App Page Register and EQ-01 plan, retain their provenance; they were not independently re-audited for this update.

Precedence: current user instructions and this written behaviour contract; adopted current repository data/permission contracts; actual native shell assets and r22 tokens; latest ES-02 image for composition; original wizard HTML for applicable functional ideas. The explicit header/menu refinements supersede older shell presentation. A verified approved EQ-01 r10 screenshot may strengthen visual comparison if available at implementation time; no unavailable image is claimed as inspected.

Reference fingerprints:

| File | SHA-256 |
| --- | --- |
| Wizard r03 | `7ce47597beb1f16e161bac1381c7cfaaabaf4eff357dcbf65ef558f0c02252b2` |
| Theme board r22, supplied as r22(2), byte-identical to r22(5) | `a305361c5d937296a8837e751f1a80ac7e6ca7615013705c7ad55ad794957df0` |
| Supplied refinement plan r01(1), preserved source | `86910db7988f7bd594fcf8993ec4da14ceae40de2d8fa0a67a5621a6f80b7d10` |
| Latest generated desktop mockup r03 | `47b1fd984bb17aaf9d54e99c2646a3b7d5c748af4ce908d2137a06a77158f303` |

The attached plan, theme HTML, wizard HTML, family-feature screenshot and latest generated image were available for this update. The latest image is 1586 × 992; it is an approximate 16:10 raster, not evidence of a native 1920 × 1200 viewport or exact CSS measurements. Its session filename is `exec-5173b848-06f4-40d3-8250-d9c2d5e1b904.png`; `PPO-ES-02-Estimation-Wizard-Desktop-UI-Mockup-r03.png` is a suggested descriptive export name, not a verified repository path.

Evidence for r04 comprises these sources, the current contents of both issued documents and a further read-only GitHub inspection of navigation, command validation, form options and source validation. Main remained at the recorded source commit during that review. No application code, database, native browser journey or deployment was changed or executed by this document update. Earlier rendering limitations do not constitute a test result for the future implementation.

### 2.2 Verified capabilities and required refinement

| Area | Existing implementation | Required refinement |
| --- | --- | --- |
| Entry and identity | Discovery register, new discovery for an existing opportunity, workspace detail and costing routes. | Improve the existing routes and deep links; keep canonical opportunity/company ownership. |
| Discovery | Ten-question versioned definition; ProductSupply, DefinedLabour and Freight tags; attributed answers and server-derived readiness. | Organise the questions within the five-step presentation and add separately versioned structured scope. |
| Scope | Site / NoSiteRequired / Unknown; permitted facilities and equipment; current scope comparison. | Add estimating-area and proposed-system structure while retaining same-site validation and historical identity. |
| Alternatives | Up to ten options, including archived; first A selected; fresh/copy, select, archive and reopen. | Provide a readable alternatives table and exact side-by-side comparison. Viewing an option must not select it. |
| Revisions | Immutable saved snapshots, predecessor access, retained hidden answers and stale-source handling. | Add a revision register, explicit baseline/target selection and field-level differences. |
| Costing | Complete selected Discovery can create or update its own manual estimate through explicit basis adoption. | Bring the existing receiving flow into the five-step journey, showing saved basis and newer discovery separately. |
| Output | Draft quotation from one exact saved cost version; stored original output and customer-safe projection. | Expose clear links, source identity and render status without adding commercial issue/approval authority. |
| UI | Functional E2 screens; shared app shell and reusable menu/table primitives elsewhere. | Apply the agreed composition and component refinements, with regression coverage for shared consumers. |
| Advanced design study | Synthetic equipment, rates, price-source statuses, FX, generated rules, margin gates and local snapshots. | Separate useful presentation from unadopted domain policy. Do not convert example constants into live business rules. |

### 2.3 Current-code findings to resolve during implementation

- E2 already persists discovery, alternatives and immutable revisions. `src/components/discovery-costing.tsx` already reviews and adopts exact saved scope into manual costs. Refactor and connect that flow; do not create another costing subsystem.
- `DiscoveryList` in `src/components/discovery-screens.tsx` still says manual costing import is not yet available. Reconcile that obsolete wording with the delivered scope-to-manual-costing flow; do not imply Excel import is implemented.
- The workspace DTO also still returns `costing_import: { status: "NotImplemented" }`. Identify whether this is legacy generic costing wording or a distinct import capability before changing it. Add an explicit manual-costing availability projection without breaking existing consumers or claiming Excel import exists.
- Early wording in `docs/contracts/estimating-e2-design.md` predates implementation and the current one-estimate-per-option model. Reconcile maintained status statements against ADR-0027, current services and observed tests without rewriting issued historical evidence.
- `SecondaryMenuFrame` currently renders visible Show/Hide menu text. The requested icon-only control is an intentional refinement. Retain the accessible name, overlay behaviour and focus restoration when removing the visible label.
- The native rail is 76 CSS px and header 64 CSS px at the inspected source. Reuse `/brand/powerplants-logo-green-white.png` and its established 54 px shell treatment. Do not add rail destinations from a generated image. The current global search is a pill with a circular navy quick-add; centre their combined group, not the search alone.

### 2.4 Delivery boundaries

**In scope:** five-step presentation; existing-route integration; structured multi-area scope; proposed-system and evidence references; alternatives and revisions views; exact source-change review; manual-costing continuity; responsive/accessibility refinement; additive persistence and compatibility where required.

| Related scope | Boundary for ES-02 |
| --- | --- |
| ES-01 Estimating intake and workload | Consume the opportunity, estimating owner and available brief. Do not build intake allocation or a workload scheduler inside this wizard. |
| CS-08 Site survey and as-found brief | Declared source dependency. Support an exact reviewed survey reference when available; manual attributed discovery remains usable without inventing a survey integration. Record the missing integration explicitly. |
| CS-04/CS-05 and EQ-01 | Select permitted sites, facilities and existing equipment. Estimating labels do not create or modify installed assets or verified equipment configurations. |
| ES-03 Cost-source and supplier-price review | Owns controlled supplier source review, validity, currencies and refresh. Preserve source references and surface changes; do not hard-code the HTML price registry. |
| ES-04 Estimate review and pricing exceptions | Owns formal findings, approval and exception authority. The wizard's Review step is a completeness/source review, not commercial approval. |
| ES-08 Specialist configuration workbench | Owns the validated Screen Systems calculator and its governed generated parts. ES-02 captures general configuration and receives exact reviewed results; it does not implement a generic engineering rule engine. |
| Excel estimate import | A separate reviewed receiving workflow. Any future import must bind to the same exact option/revision/cost basis; no arbitrary HTML/local-storage import is added here. |
| Quotation Builder and formal quotation lifecycle | Consume an exact saved estimate version through their own contracts. Preserve current Draft output; issue, send, acceptance and customer commitments remain separate actions. |

The register recommends ES-01 before ES-02 and lists CS-08 as a dependency. Deliver the independent UI and existing E2 improvements while integrating each source only when its real contract is available. Do not report dependency-backed features as complete through mock data.

## 3. Routes, identities and workspace structure

### 3.1 Keep the existing routes

| Route | Refined purpose |
| --- | --- |
| `/estimating/discovery` | Permission-scoped workspace register and entry to existing opportunities. |
| `/estimating/discovery/new` | Start discovery; retain supported opportunity context, including the existing `opportunity` query parameter. |
| `/estimating/discovery/[id]` | Discovery, Alternatives and Revisions workspace views. |
| `/estimating/discovery/[id]/costing` | Existing explicit scope-to-manual-costing receiving flow; preserve supported `option` context. |
| `/estimating/estimates/[id]` | Existing manual estimate workbook, version history and available Draft output. |

Use URL state for the selected workspace view, wizard step, viewed option and comparison sources where appropriate, with the draft-lifetime rules in §3.5. Parse and validate it against permitted records; a deep link is not authority. Determine exact parameter names from the current router and document any additions. Do not create a parallel `/estimating/wizard` record universe.

### 3.2 Navigation composition

Use the existing navy primary rail, shared collapsible secondary menu, white header and content workspace. Under the compact record-context row, provide **Discovery / Alternatives / Revisions** tabs. Within Discovery, use the five named steps as a compact progress navigation. This keeps the five-step model without adding another permanent sidebar beside the app's menu.

The secondary menu retains actual Estimating destinations and permission filtering. Target Discovery register, Estimation Wizard (active in this workspace), Manual estimates and Draft quotations where their native routes are available. Resolve destination/action availability from current route registration; do not fabricate links to unfinished modules or add disabled navigation merely to fill the image. The right-hand live summary accompanies Discovery and may collapse when a comparison needs the width. Alternatives and Revisions are purposeful workspace views, not extra numbered steps.

Opening a different tab or step changes presentation only. It does not create a revision, select an alternative, adopt new cost scope or confirm answers. Previous/Continue navigate; save actions remain explicit and correctly named.

### 3.3 Keep these concepts separate

| Concept | Meaning and visible treatment |
| --- | --- |
| Workspace | One opportunity and company, with estimating owner, current version and one selected Active alternative. |
| Commercial alternative | Stable option UUID, editable label, Active/Archived state and its own revision chain. The UI may say “Alternative”; API/record identity remains Option. |
| Viewed alternative | The record currently inspected. Show it independently of the workspace's selected alternative. |
| Discovery revision | Immutable saved scope, answers, evidence and readiness. Unsaved edits are a working proposal, never a saved revision. |
| Estimate version | Saved manual cost content linked to one exact discovery basis; a newer discovery revision does not automatically update it. |
| Line participation | Base, optional extra or excluded participation within a proposal, only where defined by the adopted line contract. It is not another commercial alternative. |
| Draft quotation | Output from one exact saved estimate version, with its own render state and retained original bytes. |

Use explanatory labels such as “Viewing Alternative B · Discovery r03” and “Selected alternative: A”. Show “Cost basis: Discovery r02 · Estimate v04” when costs lag behind discovery. Never place a generic “Revision 3” beside costs without identifying what was revised.

### 3.4 Action and guard matrix

Resolve capabilities from the native server and apply guards again when accepting each command. Current discovery editing requires `estimating.edit`, related-record access, the workspace owner and the whole-group Draft guard. Ownership alone is insufficient. Quote-safe authority does not grant access to discovery or internal costs.

| Action | Working-copy behaviour | Persistence/authority boundary |
| --- | --- | --- |
| Previous, Continue, step/tab change in the same alternative | Retain one workspace-owned draft, field errors, selection/filter state and required save reason. | Presentation only; no revision, confirmation, selection or cost write. |
| Open/close editor, technical details, evidence, menu or summary | Preserve the working proposal and restore focus. | Read current permitted data; no write or implicit source adoption. |
| Add/edit/remove a system or area | Change only the local working proposal after dependent-membership validation. | No installed Asset/Facility or Activity is created. Save all scope changes through the revision command. |
| Save discovery revision | Validate the proposal, resolve explicit confirmation/source-review requirements and obtain a non-empty reason. | Owner/edit/Active/Draft/current-version/context guards. Incomplete valid scope can save. Show the returned revision only after acknowledgment. |
| Change editing context to another alternative/workspace or use history as a starting point | For unsaved work offer Stay, Save revision then continue, or Discard working changes then continue. Save is available only where valid and permitted. | Never copy A's draft into B, select B implicitly, or replace saved history with unsaved content. |
| Select, archive, reopen, fresh/copy alternative | Resolve a dirty proposal before changing the business context; keep those actions distinct from viewing. | Existing option commands, cap, owner and group guards. Archive of selected remains refused; reopen does not select. |
| Compare saved sources | Preserve the current draft while showing exact saved baseline/target labels. State that unsaved edits are outside this comparison. | Read-only, with authority on both sources. An explicit future working-copy comparison must be separately labelled. |
| Open manual estimate | Open the exact permitted saved estimate; preserve the draft in an existing inspector/new view or apply the leave-workspace guard. | Read access is independent of whether current discovery can be adopted. |
| Review scope for manual costing / adopt basis | Resolve unsaved discovery first. Save and adoption remain separate acknowledged actions. | Re-preview the current selected Active Complete saved revision, owner, group, context and estimate expectations. Do not fall back to an older Complete revision to bypass incomplete current scope. |
| Create/complete follow-up Activity or prepare Draft output | Invoke the separate supported command with its own fields/confirmation. | No side effect of saving discovery, confirming a fact or visiting Review. |

Use specific disabled explanations where the user may know the reason, such as “Save discovery before reviewing it for costing.” For denied resources return a non-disclosing unavailable state. Do not invent an edit role, override a group hold or reveal a hidden option in a tooltip. A no-change Save should be disabled/quiet in the UI; do not alter legacy server semantics or fabricate a change reason to create an empty revision.

### 3.5 Working-copy lifetime, previews and recovery

Maintain a single in-memory discovery draft above all five steps and the three workspace views, keyed by actor/session, workspace, alternative, base revision and source schema. It includes the new structured fields and existing answers; changing a tab must not remount the only copy of the form state. Any manual costing proposal is a separate draft with a separate exact saved discovery basis.

| State | Required behaviour |
| --- | --- |
| Saved, unchanged | Display exact saved revision/readiness; Save does not manufacture another revision. |
| Dirty, structurally valid | Show Unsaved changes; request a read-only working preview and retain navigation within the same draft. |
| Temporarily malformed input | Retain editable text and local field messages. Do not coerce an empty numeric control to zero, send an invalid canonical command, or show an old Complete result as current. |
| Preview pending/failed/stale | Show Checking / Not checked for the current draft, with retry when relevant. Saved cost/basis remains separately available. Only the latest matching preview may update findings. |
| Saving | Freeze the exact submitted payload and conflicting mutations; display progress once. Do not clear values or allocate a client revision number. |
| Rejected save | Preserve the permitted proposal and map server field errors/findings to step, entity and field. A stale predecessor offers an explicit current-source comparison. |
| Unknown save outcome | Retain the original operation ID and canonical payload; reconcile before another save or conflicting context change. Do not create a fresh operation as a timeout retry. |
| Accepted save | Load/verify the returned saved revision, clear only the acknowledged draft state, announce success and retain the user's step where valid. |
| Identity or permission loss | Stop commands, clear data no longer permitted and require a fresh authorised read. Do not restore revoked drafts. |

Reuse and extend the existing unsaved-work infrastructure for all departure paths. At the inspected commit, `useUnsavedChanges` in `src/components/record-ui.tsx` handles `beforeunload` and captured anchor clicks; it does not itself implement browser Back/Forward or programmatic router transitions. Inspect the full current router before implementing an adapter. Explicitly handle browser history, `router.push`/`replace`, record selectors, breadcrumb links, internal query-state transitions and the installed-app reload action; do not claim those paths work merely because the hook is imported. Keep unrelated consumers working and avoid duplicate prompts or history loops. Same-alternative presentation changes preserve the draft and should not trigger repetitive discard dialogs. Reload/tab close follows browser-supported warnings; unsaved recovery after closing the tab is not promised because this scope adds no persistent browser business-data cache. Saved revisions must reload and survive the persistence checks in §11.

Debounce/coalesce valid preview requests using the repository's established input pattern and cancel or ignore superseded responses. Bind a preview to the exact draft fingerprint, base revision, schema and observed source context; a late response from another option must not enable Save or adoption. Revalidate on save. Previewing never saves, confirms or generates costs. Do not rely on client-calculated readiness when the server has rejected or not evaluated the current proposal.

## 4. Apply the accepted UI refinements

### 4.1 Header and breadcrumb

- Use **Estimating / Estimation Wizard** in the shared breadcrumb; retain a navigable parent and accessible page heading. The workspace context row carries the opportunity/reference, customer/site, viewed alternative, revision and save state.
- Remove the duplicated large page title and generic description band. Keep identity, source warnings and unsaved state visible.
- Use an icon-only menu toggle with accessible name, tooltip, `aria-expanded` and `aria-controls`. Place it on the continuous white header, without a grey region or right divider, with approximately 12 px before the breadcrumb.
- Centre the existing global Search plus quick-add group across the complete app viewport, including the navy rail. Opening a menu or summary must not shift that centre. Target a difference of no more than 2 CSS px on supported desktop compositions.
- Resolve collisions responsively before controls overlap; do not shrink important text to maintain desktop geometry on a phone.

### 4.2 Secondary menu and More

- Expanded starting width: **240 px**, background **#f5f6f8**, white active item and no left active accent.
- Replace the protruding collapse control with a semantic edge button inside the menu's right boundary. Use an approximately 8–12 px hit region and a 2 px hover/focus highlight; support click, Enter and Space. The header toggle provides a larger accessible target.
- Collapsed state: **24 px** strip, centred grip, pale blue-grey hover and darker grip. Click expands; hover does not.
- Persist the preference using the shared actor/workspace/module-scoped mechanism. Validate old or malformed values and retain current defaults when no preference exists.
- The global More panel is a white overlay. Its right edge aligns with the expanded menu's right-edge coordinate, within 1 CSS px, including when the menu is collapsed. It does not reflow the workspace and restores prior menu state when closed.
- Retain the shared responsive overlay and focus behaviour. Do not make a narrow desktop edge the only touch control.

### 4.3 Tables and controls

Supporting tables meet the usable edges of their containing section, with no redundant rounded table card or inner horizontal gutters. Forms and narrative sections keep deliberate padding. Use compact titles/toolbars immediately above the table.

Use independent, single-line columns for area, facility, system, equipment reference, quantity, unit, responsibility, source state, revision and price where applicable. Start around 13–14 px body text and 44–48 px rows. Allow local horizontal scrolling instead of squeezing columns or stacking unrelated facts under one label.

Preserve meaningful wrapped evidence, validation and before/after comparison in an expanded detail area. Long values need an accessible full-value view/copy action. Narrative differences may wrap; the single-line rule must not conceal a source conflict.

Reuse existing table column IDs, resizing, ordering, visibility and preference mechanisms where suitable. Keep key identity columns available. If splitting an old combined column, migrate its preference deliberately so the new columns remain discoverable. Use keyboard alternatives to pointer reorder/resize.

Define one main vertical scroll owner per view, with local table horizontal scrolling, sticky table headers where useful and independently scrolling menu/summary. Avoid duplicate whole-page scrollbars and nested `100vh` app frames. Keep footer actions and horizontal scroll controls reachable.

Use a hierarchy only for real relationships such as area → proposed system. Indent approximately 16–20 px per level and leave 6–8 px above a child's connector. Cross-area/shared systems must not be falsely duplicated as separate priced systems. Retain Packages / Line items / Cost types where implemented; do not force List/Grid onto a wizard or comparison.

### 4.4 Live summary and inspectors

The live estimate summary is a white, square panel, flush right, full-height beneath the shared header, with a fine left divider and a left-only shadow fading approximately 12–20 px. Start around 360–400 px wide; collapse or use a sheet when it would make the main form unusable.

It shows the viewed alternative and draft/saved state, explicitly labelled area/system counts, unresolved items, scope readiness, exact cost basis and available totals. Summary counts use the entire viewed working scope, not the current table filter. A configuration confirmation count is not the count of every readiness finding in the five-step workspace. Compute working readiness/findings through a version-aware server preview and label them as a working preview until saved; show pending or unavailable status during refresh instead of retaining a stale Complete result. Saved readiness remains attached to its immutable revision. Distinguish known priced total from incomplete pricing. A draft calculation must be labelled as such and must not masquerade as the saved estimate.

This summary is not an Equipment record snapshot. If a user inspects source equipment or an evidence record, use an existing compatible inspector or a clearly titled detail surface; do not replace the summary's identity with mixed record data. Opening an inspector preserves edits, table state and scroll. Modal variants manage Escape and focus return; desktop complementary panels do not trap focus.

### 4.5 Theme tokens

| Role | r22 direction |
| --- | --- |
| Primary text / navy | `#242a37` |
| Secondary / muted text | `#596779` / `#667181` |
| Links / focus | `#355b80` / `#365d8b` |
| Paper / white / hover | `#f5f6f8` / `#ffffff` / `#f0f2f5` |
| Borders | `#e1e5eb` / `#e9ecf1` |
| Success text / background / border | `#416d33` / `#edf5e9` / `#d4e3cb` |
| Warning text / background / border | `#80530e` / `#fff2d9` / `#efdbb6` |
| Neutral tag text / background | `#526078` / `#edf0f5` |
| Typography and radii | Existing Roboto/Verdana stack; approximately 6 px control radius, 5 px tag radius. |

Map these through shared semantic tokens, not repeated component-specific literals. Use dark action labels, restrained blue links and muted status tags. Warning strips use neutral counts and small amber indicators. Reserve status colours for meaning; do not introduce bright green primary buttons.

### 4.6 Configuration composition and image corrections

Implement this order within Discovery: compact record context; exactly three tabs; exactly five steps; compact family overview; estimator-led information row; Systems & configuration toolbar and attention strip; flush systems table and footer; selected-system editor; compact bottom actions. The right summary starts immediately beneath the shared header and continues to the bottom edge. Do not add a permanent step sidebar.

- Tabs: **Discovery / Alternatives [count] / Revisions [count]**. Discovery is active in the visual fixture. Counts come from permitted saved records; unsaved changes are not another revision. Revisions counts the viewed alternative's history; Alternatives counts permitted alternatives, with archived status explicit in its register. Use r22 tabs attached to the workspace beneath them.
- Steps, once each: **Requirements / Configuration / Scope & delivery / Pricing / Review**. Configuration is active; Requirements may show a completed check instead of its numeral. Completion is based on actual step findings, never on whether a user visited the step. Use compact navy/neutral controls; no bright-blue onboarding timeline.
- Use normal-width loaded Roboto, navy/slate body text, 13–14 px nominal body, 12–13 px metadata, 16–18 px section headings and 18–20 px record identity. Do not use the image's narrow-looking text or scale a screenshot into an app surface.
- Reuse the exact original logo, existing global controls and one outline icon family. Use a suitable existing machinery glyph; the image's tractor-like approximation is not a new brand icon. Keep More in its current rail position, closed by default.
- Preserve the specified rail/header/menu/summary dimensions from code and this plan, not approximate raster proportions. Primary buttons are navy. Major surfaces are square and flat; status chips are restrained. Only genuine links use link colour.
- Retain both **Review items** in the attention strip and **View configuration evidence** by the evidence information row. They serve different purposes; do not reproduce the image's crowded/replaced action. Do not float either link over a divider or another control.
- Include exactly one discreet **Synthetic preview** marker in the synthetic demonstration workspace. Use the existing environment identification convention in other environments; the marker is not a business workflow state. The latest raster inadvertently omitted it.
- Bottom bar: left label **Working copy of discovery r03** in the fixture; **Previous**, **Save discovery revision**, **Continue →**. Continue navigates. The bar ends at the main workspace boundary and never covers fields or extends under the summary. Obtain the required save reason using the native command flow; do not invent one silently.

The main section's short explanation is **“Define systems, area coverage and the evidence behind each configuration.”** At a nominal 1920 × 1200 desktop viewport retain readable controls and a useful editor. When space is tighter, allow deliberate scrolling or summary collapse instead of shrinking text. One screenshot need not expose all five steps' content simultaneously.

### 4.7 Equipment-family overview — required feature

Retain **Equipment families in this estimate** from the original design. Requirements offers the fuller overview with **Configure systems →**, which navigates to Configuration without saving or confirming facts. Configuration shows the compact overview above the table, preserving space for the selected-system editor.

| Presentation group | Example system | Fixture count | Behaviour |
| --- | --- | --- | --- |
| Controls & climate | Climate control | 1 system | Filter this family's systems. |
| Fertigation | Fertigation | 1 system | Filter this family's systems. |
| Monitoring & weather | Crop monitoring | 1 system | Filter this family's systems. |
| Nursery machinery | None yet | 0 systems | Filter to its empty state; a separate Add action opens a new system draft prefilled with this family. |
| Shared infrastructure | Shared network | 1 system | Compact separate indicator/filter for infrastructure, not a fifth oversized family card. |

Assign every proposed system exactly one primary presentation family/group; coverage of several areas does not make a climate controller an infrastructure system. A family is separate from the existing ProductSupply / DefinedLabour / Freight tags. Do not map one to the other without an explicit adopted mapping. Preserve unsupported historical family values as readable Unknown/Other with an explicit filter, rather than dropping them from counts.

Family badges count unique systems included in the viewed working scope across all areas, unaffected by text/area/family filters. The four cards plus the separate infrastructure group reconcile to the fixture total; count each ID once. If unsupported historical values exist, expose a separate Unknown/Other count and include it in the reconciliation. Optional/excluded membership follows the adopted participation contract and must be labelled separately if implemented. A zero count is valid and is not a readiness failure. The summary’s “to confirm” count is unique systems with unresolved required configuration confirmations; the attention strip counts individual configuration findings. Multiple findings on one system can make these counts differ, so name each accurately instead of reusing one total. Use neutral count badges; green means an actual confirmed state, not merely membership.

Card selection sets one family filter. **All families** clears it. Area and text filters combine with it. No card action saves a revision, changes the selected commercial alternative, confirms equipment or generates lines. Card filter and Add controls are separate keyboard targets; do not nest buttons. Expose selected filter state and count accessibly.

When the selected system falls outside a new filter, retain its edits in the workspace working copy, clear table selection and show a neutral editor prompt. A new system draft that has not yet been added must be resolved explicitly before it is hidden. Never keep an apparently selected editor for an invisible row. Clearing filters restores the rows, not an implicit business mutation.

Keep the quiet information row: **“Suggested configuration, estimator-led decisions.”** Supporting text: **“Requirements, source evidence and review decisions stay with the draft. Equipment suitability needs a technical review.”** Show **View configuration evidence** to inspect the exact recorded evidence and its current access/state. This does not imply a recommendation engine exists.

### 4.8 Table, selected editor and evidence behaviour

Default table columns, in order: **System | Area coverage | Equipment ref. | Intent | Evidence | State**. Family is available through the overview/filter and optional Columns control; it is not a seventh mandatory fixture column. Use local search, All areas, Columns, overflow and navy **+ Add system** in one aligned toolbar. Only expose supported overflow actions. Use neutral row selection; selecting a row opens its editor without changing commercial selection.

**Review items** filters/opens the active configuration findings (two in the fixture) and focuses the chosen system/field. Returning clears the temporary findings view explicitly. **View configuration evidence** opens the configuration evidence collection. Each row's evidence reference and the editor's **View evidence** open the particular accessible observation. Handle missing, stale and denied sources honestly; no dead links or fabricated document previews.

The table footer shows **4 systems · 1 selected** with **Shared systems are counted once.** in the unfiltered fixture. A filtered result uses **N of 4 systems · M selected**; a no-match result has no selection and retains clear/reset controls. Summary and family totals remain overall totals. Selection is at most one row in this editor view.

Below the table, use a padded two-column form with **Climate control**, an **Existing equipment** tag, **View equipment** and **Technical details**. Fields: System name; Equipment reference; Area coverage; Proposed work. Coverage is a validated multi-select of scoped areas, not a free-text list. Separate intent from proposed-work wording in the saved model. Selecting equipment offers observed facts; it does not silently overwrite or confirm user-entered requirements.

**Technical details** expands a labelled, keyboard-accessible section of typed configuration facts for the selected system. Define the bounded supported field catalog, value types and units in W01; allow attributed unknowns. Preserve recorded unsupported historical fields read-only. It is a precise editing/inspection surface, not a calculator or a navigation placeholder. The customer-required zone count and verified equipment capacity are different field identities; zones are not silently converted into physical I/O channels.

Evidence comparison in the fixture:

| Fact | Display | Meaning |
| --- | --- | --- |
| Customer requirement | **8 climate zones** — Estimator brief · confirmed | An attributed customer requirement has been confirmed. |
| Equipment capability | **Not yet verified** — Capacity check required | Existing controller capacity has not been established; no equal confirmation styling. |
| Follow-up | **Confirm controller capacity · Dean Fiedler · Due 23 Sep 2026** · View evidence | An owned discovery follow-up with an explicit new due-date field; an Activity link appears only if an actual permitted Activity exists. See the legacy-field boundary in §8.2. |

The table's **Confirmed** means the required configuration facts for that system have the confirmations specified by the versioned discovery contract. User-authored requirements and unknowns are supported without an automatic product-selection rule; any template-supplied field requirement must identify its adopted definition/version. It does not mean engineering certification, complete overall discovery, commercial approval or permission to issue. Distinguish confirmation findings from missing source access. Persist the fact state, attribution and exact observed source; do not derive confirmation solely from the existence of an equipment ID.

Add/edit/remove changes the working scope until **Save discovery revision** is acknowledged. Removal checks area, evidence and responsibility dependencies and preserves immutable history. A failed save retains the permitted proposal; an unknown result freezes conflicting mutation until the original operation is reconciled.

The words **All areas** are a display derived from explicit scope membership, not a saved wildcard. At each revision, persist the system's actual covered area IDs. Adding a new area leaves existing memberships unchanged and produces a reviewable coverage finding where relevant; it must not silently extend a retained controller/network's scope. Rename changes labels only. Removal previews impacted systems/responsibilities/evidence and requires explicit reassignment or removal in the working proposal. Do not cascade-delete saved history or manual estimate lines.

W01 must distinguish **Defined area coverage**, **Not area-specific** with an attributed reason, and **Unknown coverage** with an eligible owner/reason. The final enum/field names follow native conventions. Defined coverage requires valid duplicate-free area IDs; the other modes do not carry invented IDs. This allows genuine NoSiteRequired or project-wide work without creating a dummy greenhouse. Unknown coverage affects readiness only according to the adopted extended definition. Family, coverage and work tags remain independent facts.

### 4.9 Reproducible synthetic Configuration scenario

Use this as an integration/visual fixture through existing native fixture helpers and commands. Values are synthetic test data, never production defaults or a hard-coded UI fallback. Use canonical UUIDs and PPO naming mappings; equipment labels below are display references only, not database IDs.

| Context | Required value or derivation |
| --- | --- |
| Record | Northbank climate & irrigation upgrade |
| Customer/site | Northbank Nursery · Caboolture site |
| Viewed/selected alternative | Alternative A — Base scope · Selected |
| Working state | Working copy based on Discovery r03 · Unsaved changes |
| Owner | Dean Fiedler |
| Workspace tabs | Discovery active; Alternatives 3; Revisions 3 for A |
| Area model | Greenhouse 1 and Greenhouse 2 are two growing areas; Irrigation shed is an ancillary scoped location at the same Site. |
| Counts | 2 growing areas; 4 unique systems; 2 systems with configuration confirmation findings. |
| Effort/routing | Estimating effort: Full; Delivery routing: Not configured. |

Do not equate “2 growing areas” with all scoped locations: the shed is not a third greenhouse. Define explicit estimating-area purpose metadata in the extension and count only the growing subset for this label. This does not change canonical Facility types. All areas covers the two growing areas and the ancillary location. Show total scoped-location counts under an accurately named label elsewhere when needed.

| System | Area coverage | Equipment ref. | Intent | Evidence | State |
| --- | --- | --- | --- | --- | --- |
| Climate control | Greenhouses 1 + 2 | EQ-00142 | Retain + expand | Site notes r02 | Confirm capacity |
| Fertigation | Irrigation shed | Proposed | New | Estimator input | Confirmed |
| Crop monitoring | Greenhouses 1 + 2 | EQ-00158 | Retain | Equipment record | Confirm model |
| Shared network | All areas | Proposed | New | Scope brief r03 | Confirmed |

Select Climate control; its editor uses **EQ-00142 · Climate controller**, both greenhouse chips and **Retain controller and expand zones**. Create enough valid attributed configuration facts to justify the two Confirmed states. The two unresolved findings are exactly **Confirm controller capacity — Climate control** and **Confirm existing sensor model — Crop monitoring**.

Create A's r01→r02→r03 chain through valid transitions: r02 must be Complete before costing; create and advance A's manual estimate to **Estimate v04**, with supported manual lines and arithmetic totalling **AUD 58,400.00**; save an incomplete r03 with changed/unverified facts; then make a visible unsaved edit. Preserve the r02 basis on v04. Create B fresh and C from a permitted copy so the alternative count is real. The fixture must have exactly three A revisions; do not manufacture extra saves just to reach the screen. Setup helpers may prepare records efficiently but must uphold the same validation and integrity contracts.

The summary must read **Viewing: working copy of r03**, **Discovery readiness: Incomplete**, and the compact scope counts. After a divider show **Saved estimate · Estimate v04**, **AUD 58,400.00**, **Excluding tax · tax not calculated**, **Cost basis: Discovery r02**, and **Newer discovery is not yet costed. Saved prices remain unchanged.** Include **Open manual estimate**, the two findings, effort/routing, **Compare alternatives** and **View revision history**. Those actions open the actual permitted view/record and preserve or guard the working proposal as appropriate.

The amount is loaded from the saved estimate version. Never derive it from working r03, family counts, the mockup or summed alternatives. Users without internal-cost access receive the permitted summary projection, not hidden money in the DOM. If A has no estimate, show Not yet costed; do not borrow another alternative's amount.

## 5. Step-by-step functional refinement

The five steps reorganise the adopted questionnaire without changing its identity. Keep one canonical answer for each question even where a summary appears in another step.

| Existing question | Primary editing step | Retained rule |
| --- | --- | --- |
| Q01 Included work | Requirements | Required text, up to 2,000 characters. |
| Q02 Exclusions | Requirements; review in Scope & delivery | Required text up to 2,000 characters or explicit NoneDeclared. |
| Q03 Assumptions | Requirements; review in Scope & delivery | Required text up to 2,000 characters or explicit NoneDeclared. |
| Q04 Contract review need | Scope & delivery | Optional Required / NotRequired / Unknown; not a pricing-approval decision. |
| Q05 Product description | Configuration | Required when ProductSupply is active; up to 500 characters. |
| Q06 Product count | Configuration | Required when ProductSupply is active; integer 1–100,000 Each. Discovery count does not automatically become a cost-line quantity. |
| Q07 Is work on site? | Scope & delivery | Required when DefinedLabour is active; Yes / No / Unknown. |
| Q08 On-site work description | Scope & delivery | Required when DefinedLabour is active and Q07 is Yes; up to 1,000 characters. |
| Q09 Freight responsibility | Scope & delivery | Required when Freight is active; PPO / Customer / Unknown. |
| Q10 Delivery description | Scope & delivery | Required when Freight is active and Q09 is PPO; up to 500 characters. |

Pricing and Review consume these facts through the existing readiness and receiving contracts. The new multi-area structure does not silently repeat Q05/Q06 per system or alter the meaning of this r01 definition.

### Step 1 — Requirements · project & areas

Resolve opportunity, customer and site through canonical records rather than the HTML's free-text customer/site fields. Show the estimating owner and attributed Full/Express effort or an owned unresolved item; this is separate from delivery classification.

Capture the existing included-work brief, exclusions and assumptions without flattening `NoneDeclared` into blank text. Preserve the adopted answer states **Empty / Deferred / Answered / Confirmed / Assumed** and source attribution. Only the server determines active mandatory questions and readiness; an Assumed answer does not satisfy a required Confirmed answer.

Add the structured areas table:

| Column | Contract |
| --- | --- |
| Area | Stable estimating-area ID and descriptive label, not a reused row number. |
| Facility | Explicit permitted Facility reference, or an attributed unresolved/proposed area with no invented Facility ID. |
| Use / crop context | Optional attributed discovery fact; do not turn free text into a product selector or agronomic recommendation. |
| Stage | Proposed work stage/phase, separate from a Facility type and commercial workflow status. |
| Evidence / state | Source reference and confirmation/unknown state. |
| Actions | Inspect, edit and remove from the working proposal with explicit handling of dependent systems. |

Keep one Site per saved scope revision under the current contract. Multiple areas/facilities within that Site are supported. Changing Site requires a reviewed successor and revalidation of all dependent references; it does not relabel history. Multi-site costing is a separate contract change, not an inferred feature of “multi-area”.

The existing limits remain ten Facilities and one hundred equipment references per scope, with a 64 KiB canonical command bound. The complete canonical UTF-8 request is bounded, including IDs, reason, comparison/context hashes and confirmation fields; 65,536 characters is not the same test. Keep evidence binary content outside discovery commands and use the existing authorised document mechanism when available. The current selectors return a bounded first page; expose real scoped search/pagination or an explicit truncation message, and retain already-selected permitted records outside the returned page. Never imply that the visible first hundred records are the complete site inventory.

Provide the required equipment-family overview and Configure systems navigation in §4.7. Keep those presentation families distinct from the adopted ProductSupply/DefinedLabour/Freight question tags. Any mapping must be explicit and reviewed, with no silent category-ID substitution.

The initial form is deliberately editable before it is command-valid: `blankDiscovery` starts with no work tags and empty follow-up reasons, which the strict parser cannot save. Provide a clear first-save path: choose at least one supported work tag, resolve Site/NoSiteRequired/Unknown correctly, enter required source/owner reasons for unknowns and answer or explicitly defer applicable questions. Explain the difference between an incomplete valid proposal and an unfilled invalid form. Never invent answers, reasons, confirmations or a Site to make Save succeed.

**Exit state:** a saved or unsaved, clearly labelled scope proposal; incomplete discovery can be saved. Missing required confirmations block Complete readiness and later basis adoption, not access to unrelated steps or preservation of work.

### Step 2 — Configuration · systems & evidence

Provide the family overview, area/system worklist and focused editor specified in §4.7–4.8. Use the six default columns System, Area coverage, Equipment ref., Intent, Evidence and State. Family/type remains a separate fact exposed by filtering, the editor and optional columns.

- Give proposed systems stable estimating identities. A proposed new system is not an installed Asset; “Retain” references an existing permitted Asset where known.
- Model shared systems once with explicit coverage of multiple areas. A shared controller/network must not multiply quantities merely because it appears under more than one area.
- Capture values with field identity, value, unit, source, observed revision and confirmation state. Distinguish customer requirements, observed equipment facts, catalogue capability and estimator assumptions.
- Do not substitute product maximum capacity for required capacity. Do not silently coerce incompatible units, missing values or an unverified equipment label into confirmed configuration.
- Show evidence origin, observed version/date, current/stale/inaccessible state and a permitted source link. Preserve a user's manual value as a proposal when its source changes.
- Permit explicit unknowns with reason, owner and follow-up linkage. Creating or completing a follow-up Activity requires its existing command and authority; a save must not do this implicitly.

Use product/configuration sources actually available in the application. The r03 fictional Priva/Javo/Da Ros items, sample capacities and rate entries are demonstration content, not an authorised catalogue or validated calculator.

For a future ES-08 result, retain the exact calculation revision, input/output manifest and reviewed adoption event. Changes return a comparison proposal; they never silently replace accepted configuration or manual cost lines. Until integrated, show an honest unavailable state instead of a functioning-looking calculation button.

**Exit state:** explicit system membership, configuration evidence and owned unknowns. Selecting equipment or a family does not auto-confirm discovery or generate approved prices.

### Step 3 — Scope & delivery · responsibilities & timing

Present scope participation, responsibilities, exclusions, assumptions and timing in distinct sections. Preserve the existing conditional DefinedLabour and Freight questions and the independent contract-review answer.

Recommended scope/responsibility columns: area/system, work item, inclusion, responsible party, required timing, source, confirmation and unresolved action. Powerplants, Customer and Supplier can be readable proposed responsibility labels only when backed by the saved contract; they do not create a supplier booking, customer acceptance or project allocation.

Keep these distinctions visible:

- Included work versus excluded work versus an optional extra.
- “No exclusions declared” versus exclusions not yet captured.
- Requested date versus estimated duration versus an agreed commitment.
- Estimating Full/Express effort versus delivery route.
- Contract review requested versus pricing approval granted.

The current delivery-routing result remains **Not configured** until a rule set is adopted. Do not enable the HTML's numerical routing or commercial thresholds by inference. Store business dates using the app's business-date conventions and timezone, not a UTC-day truncation copied from the preview.

Optional extras need explicit participation and separate totals under a reviewed extension. The r03 “Alternative” line state must not become a second competing alternative mechanism. Materially different customer solutions use the workspace's real alternatives.

**Exit state:** a reviewable scope and responsibility proposal with clear unresolved items; no procurement, delivery or approval commitment is created.

### Step 4 — Pricing · costs, sources & manual estimate

Integrate the existing manual-costing flow. Show costs already bound to an exact saved discovery revision, and show a clear action to **Review scope for manual costing** when the current viewed option is also the selected Active option, its Discovery is Complete, ownership/source permissions hold and the whole group meets the Draft guard.

Unsaved discovery cannot become a costing basis. Save it explicitly, then perform the existing source comparison and receiving command. Do not hide these two durable operations behind an apparently atomic “Continue” action.

Use the current categories **Product / Labour / Freight / Engineering / Subcontract**, decimal string inputs, source and effective date, unit, quantity, unit cost/sell and explicit Allowance choice. Retain schema compatibility where older lines have no Allowance field. Display internal cost/margin only to permitted users.

| Pricing presentation | Required behaviour |
| --- | --- |
| Line items | Dedicated columns for description, category, quantity, unit, unit cost, cost total, unit sell, sell total, source/effective date and allowance where permitted. |
| Packages | A grouping projection only after line-to-package membership is saved. Do not infer packages from description text or duplicate a shared line across areas. |
| Cost types | Aggregate the exact same included lines by their adopted cost category. |
| Search and excluded filters | Change the displayed subset; label any subtotal “Shown lines”. They do not change estimate inclusion or the full estimate total. |
| Summary | Identify alternative, discovery basis, estimate version, currency and tax basis. Optional/excluded totals remain separate. Never sum mutually exclusive alternatives. |

Retain `SYN-EST-ARITHMETIC-01`: exact base-10 calculation, current rounding rules, AUD and ExcludingTax with tax not calculated. Do not replace it with JavaScript floating-point arithmetic, the HTML's cents helper, or a new currency/tax policy.

Price pending is not zero cost; no-charge requires an explicit supported meaning. Until a reviewed contract can represent pending prices, keep pending items as unresolved scope and block a claim of fully priced completeness. Distinguish known totals, unpriced items, allowances and excluded lines.

The HTML's EUR/AUD conversions, sample labour rates, supplier prices, minimum margins and discount thresholds are illustrative. Controlled FX/source refresh belongs with ES-03; approval/exception policy belongs with ES-04. Margin and markup must remain separately labelled calculations, not authority gates invented here.

Source changes create reviewable differences. Keep manual prices and adjustments intact; where a future generated proposal exists, identify unchanged, changed, added, removed and detached/overridden lines, and require explicit adoption. Never overwrite an override on rerun or generate prices from questionnaire quantities without a separately adopted rule.

**Exit state:** an explicitly saved manual estimate version tied to an exact Complete basis, or an honest not-yet-costed/incomplete state. Ordinary price saves retain their existing basis until a separate adoption command changes it.

### Step 5 — Review · decisions & revision

Present a compact readiness summary followed by source changes, unanswered requirements, assumptions, exclusions, responsibility gaps and cost-basis alignment. Every finding links to the relevant step/field without losing the working proposal.

Classify findings by their actual effect: prevents saving this malformed command; prevents Complete discovery; prevents current scope adoption; or informational/review item. Saving an incomplete discovery revision remains allowed. Do not impose the HTML's blanket hard-blocker logic on all native saves, and do not treat all warnings as commercial rejection.

The action area distinguishes:

- **Save discovery revision** — reasoned immutable successor, including incomplete discovery where valid.
- **Compare revisions** — exact saved sources, no mutation.
- **Review scope for manual costing** — explicit receiving flow subject to existing guards.
- **Open manual estimate** — permitted existing workbook and exact saved basis.
- **View/Create Draft quotation** — only the existing supported command and its own permission/source requirements.

Show actor, server timestamp, revision reason and the saved result after acknowledgment. Do not allocate revision numbers or audit time in the browser. Retain every saved revision; the HTML's last-ten-snapshots truncation is not acceptable for native history.

Label quotation render state separately from commercial state: Pending/Running/Ready/Failed does not change Draft to Approved or Issued. A customer-safe preview must not expose internal costs, margin, supplier sources, routing notes, hidden answers or inaccessible record names.

## 6. Alternatives and revision comparison

### 6.1 Alternatives view

Use a full-width table with Alternative, Selected, State, Current discovery revision, Scope readiness, Estimate/version, Priced amount where permitted, Updated, Owner and Actions. Keep numbers and states in their own columns. Surface the ten-option cap, including archived options; archiving does not free a slot through deletion.

Fresh creation starts without copied answers or money. Copying identifies an exact source revision, retains provenance and downgrades copied Confirmed answers to Answered for reconfirmation. A copied alternative is Active and unselected and does not inherit costs or change the quotation.

Select, Archive and Reopen are explicit reasoned actions with current version checks. The selected option cannot be archived. Reopening does not select it. Viewing B, editing B or comparing B with A must not change selection. The existing whole-group Draft guard applies to every relevant mutation, including mutations initiated from another surface.

### 6.2 Compare alternatives

Choose exact saved revision sources and, independently, any exact compatible estimate versions. Show baseline/target labels, captured dates and readiness before the comparison table. Default to two sources for readability; additional comparisons must remain bounded and responsive.

Compare included work, area/system membership, quantities/units, responsibilities, assumptions, exclusions, unanswered requirements, evidence versions and comparable permitted costs. Show Missing/Unknown/Not comparable explicitly. An uncosted option is not an option worth zero.

Compare like-for-like currency/tax/participation bases only. Explain when the two cost versions use different discovery revisions. Preserve permissions for both sides; do not leak a denied alternative through difference counts or totals. Selection is a separate action after review, not a side effect of choosing a comparison target.

### 6.3 Revisions view

Provide a paginated immutable revision table with revision, predecessor/copy source, author, saved time, reason, readiness, source state and linked estimate basis where permitted. Filters and sort affect the view only. A LegacyManual record displays **“E1 manual basis — E2 questionnaire not recorded”**; do not manufacture missing questionnaire values.

The comparison engine matches stable IDs, not labels or array order. It reports added, removed, changed and unchanged records/fields, including quantity/unit changes, confirmation/source changes and membership movement. Removing a system from a new revision does not delete it from a previous snapshot.

Provide a summary plus readable before/after detail. Preserve explicit NoneDeclared, blank, deferred, zero and missing values as distinct states. Allow meaningful narrative wrapping and keyboard navigation to a change. Comparing a revision with itself produces a clear “No differences” result.

“Use as starting point” creates a new reviewed proposal from permitted history, with provenance and reconfirmation rules. It never rewinds the current pointer or edits a historical revision. When the source is an older revision, keep the exact historical source identity separate from the current option/workspace concurrency expectations. The existing current-revision guard must not be disabled or passed an old revision as if it were current. W01 must specify the additive historical-source review/receiving contract, or record its concrete implementation gap; no functioning-looking action may bypass that contract.

## 7. Source-change and conflict handling

| Event | Required response |
| --- | --- |
| Site/facility/equipment facts changed | Show observed versus current permitted context, affected memberships/answers and required acknowledgments. Revalidate before accepting a successor. |
| Selected Site changed | Revalidate all dependent references against the new Site; preserve the old revision and its cost/output labels. Do not silently discard references or make them valid by changing labels. |
| Question definition changed | Compare field identity, type, unit, choices, activation and required rules. Preserve captured definitions; adoption is explicit. |
| A question becomes hidden | Retain its prior answer in history; omit it from active/customer-safe content. Reactivation offers a proposal requiring confirmation, not an automatic Confirmed answer. |
| Survey/calculation/document source advanced | Identify exact old/new versions and affected data. Offer a proposal/diff when the real integration exists; no automatic adoption. |
| Another user saves/selects/archives | Refuse the stale mutation, preserve the permitted local proposal and offer comparison with the current version. Never silently apply last-write-wins. |
| Source access is revoked | Reauthorise reads, previews, history and receipts. Clear content no longer permitted; generic errors must not expose identities or private states. |
| Save response is lost | Freeze further conflicting mutations and reconcile the original operation ID. Do not create a new operation as a timeout retry. |
| Manual/generated value diverges | Keep the manual proposal, show its source and the changed producer basis; require an explicit keep/replace decision where that producer is supported. |
| New discovery is incomplete | Keep the earlier saved cost basis intact and clearly labelled. Do not silently attach the incomplete successor to an existing cost version. |

Keep the user's draft through recoverable version/source conflicts. After identity or permission loss, protection of revoked data takes precedence over restoring that content. A retry uses the original canonical operation until its outcome is known.

## 8. Data, APIs and persistence

### 8.1 Reuse the delivered core

Reuse EstimatingWorkspace, CommercialOption, EstimationRevision, ScopeSnapshot, AnswerSnapshot and the exact estimate-version basis links. Preserve existing UUIDs, immutable payloads, content hashes, schema dispatch and receipts. Do not mutate an old definition to make it support new fields.

Existing relevant routes include workspace collection/detail, preview, options and revisions under `/api/v1/estimating/workspaces`, plus the existing `/:id/costing/preview` and `/:id/costing` receiving routes. Reuse their current namespaces and methods as defined in the checkout; do not repurpose E1's `estimating/options` eligible-opportunity selector.

`AdoptDiscoveryCosting` remains the explicit basis-adoption command. It checks the expected workspace, selected option, current Complete revision, current context and expected estimate version, then atomically creates that option's estimate or a successor.

### 8.2 Proposed additive scope representation

The following are logical extensions to specify in the implementation ADR, not a claim that these SQL tables or endpoints already exist. The second source audit confirmed these boundaries:

| Existing field/behaviour | Actual current contract | Required ES-02 extension |
| --- | --- | --- |
| `DiscoveryScope.systems` | One to three distinct ProductSupply/DefinedLabour/Freight tags with Facility membership. | Keep it intact. Store proposed equipment systems in a distinct versioned structure; the four-row fixture must not violate the tag-list limit. |
| `Answer.source` | Bounded source text, not a typed document/equipment revision reference. | Retain old text as attributed narrative. Add exact evidence observations separately; never invent source IDs or revisions from the string. |
| `FollowUp` | `owner_id` and `reason` only. | Define the structured discovery follow-up's optional business due date, originating fact/finding and optional Activity link in the new schema. No implicit upgrade of old follow-ups with invented dates. |
| `scope_readiness` | Complete/Incomplete from the immutable r01 questionnaire/scope compiler. | Dispatch legacy and extended definitions explicitly. New configuration requirements must be included in the extended server compiler and costing guards. |
| Current workspace read | Workspace, current option/revision pairs, `can_edit`, legacy routing/import flags. | Add the justified read projections in §8.5; do not imply history enumeration or a universal saved-cost summary already exists. |

New follow-up due dates are requested follow-up dates, not a delivery commitment. Validate business dates and owner references using current conventions; preserve unknown dates. If linked to an Activity, show recorded discovery due date separately from that Activity's current date/state. Completion of one does not automatically confirm a configuration fact or complete the other. Source access is rechecked on every link.

| Extension | Minimum content | Integrity rule |
| --- | --- | --- |
| Estimating area | Stable UUID, label, optional canonical Facility ID, estimating purpose (growing/ancillary/unknown), use/stage, source and confirmation. | Scoped to this workspace/revision; a proposed area does not create a Facility. |
| Proposed system | Stable UUID, one primary presentation family/group, type, new/retain intent, explicit area coverage and equipment references. | One logical shared system, duplicate-free membership, valid same-site references. |
| Configuration fact | Stable field identity, typed value/unit, state, source reference/version and attribution. | Preserve unknowns and incompatible evidence; no confirmed value inferred from display labels. |
| Scope/responsibility item | Stable UUID, system/area membership, participation, responsible party, timing, evidence and unresolved owner. | No silent downstream task, commitment or option creation. |
| Evidence observation | Permitted source type/ID/version, bounded note, observed context/hash. | Immutable in the saved revision; live access checked on every use. |
| Comparison projection | Exact baseline and target IDs plus versioned difference classification. | Read-only, deterministic and permission-filtered on both sides. |

Choose snapshot JSON versus typed child rows using current repository conventions and actual constraints. Document canonical ordering, schema/version dispatch, copy behaviour, maximum new area/system/fact counts, text limits and error responses before implementation. Keep the current 64 KiB command limit unless a separately reviewed extension justifies another bound; reject over-limit input without truncation.

Do not overfill the immutable ten-question r01 definition with unrelated configuration fields. Introduce an explicit new schema/definition for added facts while keeping r01 readable and replayable. Readiness mapping must be specified and server-derived; new field presence alone does not imply a Confirmed answer.

Before adding persistence, W01 must resolve and record this contract checklist:

1. Exact schema/version dispatch, DTO/command changes and backward-compatible reads; snapshot versus child-row representation; ordered canonical hashing; which revision owns each area, system, evidence observation and follow-up.
2. Explicit maximum areas, systems, facts, evidence entries and responsibility items, plus per-field limits, within the existing 64 KiB command bound. Reject duplicate IDs, duplicate coverage, missing referenced areas, incompatible units and invalid states at the server boundary.
3. Growing/ancillary/unknown area purpose, primary family membership, global versus filtered counts, and handling of unsupported historical values. Purpose is estimating metadata, not a reclassification of installed assets.
4. Versioned configuration fields and required confirmation rules by supported system type, plus how questionnaire, scope and configuration findings combine into server-derived readiness. Preserve legacy r01 semantics. A required capacity/model unknown makes the extended discovery Incomplete; it cannot be hidden by a Completed step indicator or an equipment selection.
5. Copy behaviour for every new fact and follow-up: copied confirmations require reconfirmation; current authority is checked; no Activity, cost line, quote or approval is created by copying.
6. Exact source/evidence links and permission projections; recorded versus current observations; stale-source adoption acknowledgments; field-level comparison and retained manual proposals.
7. NoSiteRequired/Unknown and no-growing-area cases. Avoid mandatory fabricated greenhouse/site records just to satisfy the demonstration design.

These are implementation decisions within the authorised scope. Resolve routine representation choices from current conventions and record the reason; do not leave them as TODOs inside delivered forms or introduce unsupported business policy to close them.

### 8.3 Transaction and authority rules

Every mutation retains operation ID, command schema, canonical payload hash, expected versions, change reason, server actor/time, audit and durable outbox handling. Same operation/same payload has one effect; changed payload under the same ID conflicts. An old receipt is returned only after current authority checks.

Serialize relevant changes through the existing workspace/estimate lock discipline. Validate selected-option membership, same company/site references, immutable predecessors and basis links in the database as well as the service. An inaccessible lock context is not an empty unlocked group.

Use the existing canonical server hash implementation. The HTML's small browser signature is a preview change detector, not a durable integrity or security mechanism. No localStorage record or browser “saved” flag substitutes for a server acknowledgment.

UI preferences may use the app's scoped preference mechanism. Any draft recovery uses the existing authorised mechanism; do not introduce persistent browser copies of sensitive discovery/cost data merely because r03 stores its demo state locally.

### 8.4 Compatibility and migration

Preserve old E1 A/r01 identities, E2 options/revisions, exact cost hashes, stored quote HTML/PDF, receipts and CRM references. Keep the stable legacy primary estimate or first-created primary; changing selected alternative must not change the opportunity forecast or sum alternatives.

Use an additive forward migration only if the agreed representation requires it. Allocate against the actual current registry; do not reserve a number in this plan. The inspected main includes 0029, reserves 0016 and records separate local 0030 work. Recheck all of this before selecting a number.

Update exact migration assertions and hosted upgrade checks where affected. If altering business-identity structures, account for pending deferred checks across multi-migration transactions. Regenerate capability documentation and grant fixtures only if a justified capability change is actually introduced. No reset/reseed of accepted originals is a compatibility proof.

### 8.5 Read projections, findings and service obligations

The inspected `previewDiscoveryCosting` calls `selectedBasis`, which requires edit/owner authority, whole-group Draft state and the current selected Active Complete revision. It is an adoption review, not a general sidebar read. Do not invoke it merely to render the summary, or relax its guards to make the summary work.

| Projection/operation | Minimum response and behaviour | Service obligation |
| --- | --- | --- |
| Workspace/alternative read | Viewed and selected IDs separately; exact current revision; recorded schema; scoped edit/action availability; safe reason codes. | Retain current group/reference authority. A new UI filter must not weaken an existing all-group permission or lock check. |
| Saved-cost summary read | Viewed option's permitted estimate ID and version, amount/currency/tax basis, exact discovery revision, and explicit No estimate / Legacy basis / Unavailable distinctions. | Read through existing estimate/version/basis authority without requiring costing-adoption eligibility. No write locks added merely for sidebar rendering unless required by current read semantics. Never substitute another option's amount. |
| Working-discovery preview | Echo draft fingerprint/base/schema; validity; readiness; step findings; unique-system counts and finding counts; required source acknowledgments. | No persistence or price generation. The server evaluates the current extension definition; malformed transient inputs remain editable and are not falsely Complete. |
| Revision register | Permitted saved rows, exact IDs, author/time/reason/readiness, predecessor/copy source, stable ordering, bounded page and cursor/continuation. | Real enumeration and totals under current authority; do not request every historical payload to count rows or pretend current option rows are the full history. |
| Comparison | Exact baseline/target IDs and schema versions; summary plus bounded entity/field differences; source accessibility and incomparable states. | Read both sides under current access. Retain stable identity/lineage rules in §8.6; no implicit selection/adoption. |
| Evidence inspector | Recorded source type/identity/version, attributed note, recorded observation and current permitted state/link. | Plain legacy source text remains text. Missing, stale and denied sources are distinct internally; external errors disclose only permitted information. |

W01 must map each projection to an existing read or specify an additive endpoint/DTO using current naming conventions. Record request limits, response types, error codes, cursor ordering and the consuming component. Maintain compatibility for old DTO consumers; do not silently repurpose `costing_import`. Extend existing shared validation/error envelopes rather than inventing a second API style.

Use machine-readable findings with a stable key, category, affected step/entity/field, safe message and permitted next action. Keep these effects distinct:

| Finding effect | Save valid incomplete discovery? | Complete readiness / costing adoption |
| --- | --- | --- |
| Malformed type, invalid membership, duplicate ID, payload limit, denied reference | No; retain the proposal and identify the actionable error safely. | Not eligible. |
| Required unconfirmed configuration/answer with a valid owned unknown | Yes. | Incomplete; current basis adoption blocked. |
| Stale predecessor or changed source requiring review | Only after the exact current-source/reconfirmation contract is satisfied. | Never use an earlier preview as authority. |
| Informational scope note, not-yet-costed discovery, routing Not configured | Yes, if the command is otherwise valid. | Not itself a new discovery blocker; use adopted readiness rules. |
| Commercial group hold or missing edit/owner authority | No mutation. | A permitted saved read may remain available; no guard bypass. |

The right summary may show the two configuration findings in the fixture while Review shows all categories. Do not derive overall readiness by checking whether the configuration attention strip is empty. Do not turn the absence of a future routing, supplier-price or calculator integration into an invented mandatory blocker.

Bound lookups, history and comparison responses; avoid per-row remote calls for counts or summary totals. Keep input responsive while previews run, reuse current scoped caches and never cache private reads across actor/workspace boundaries. In W06 record maximum-supported fixture size, payload bytes, request counts and observed timings for main read/preview/save/comparison. Establish any performance target against a named environment; do not claim an unmeasured production SLA.

### 8.6 Identity, copy lineage and comparison matching

Stable estimating IDs are qualified by workspace and alternative; they are not installed equipment IDs. Within an alternative, successor revisions retain an area's/system's/fact's identity through rename, reordering and membership changes. Removal followed by adding a genuinely new system uses a new identity; reusing its label does not resurrect a historical record.

Copying an alternative creates independent destination entities and an immutable provenance map to the exact source revision/entity. Current `CopyDiscovery` accepts an exact retained source and rejects an accompanying edited `discovery` body. Preserve that boundary: copy first, then edit the destination in a subsequent proposal. Derived new identities and lineage must remain consistent across preview, acceptance and same-operation reconciliation. Do not generate a different random child graph each time a preview is recomputed. W01 must specify a validated operation-bound allocation or equivalent native deterministic mechanism, plus the canonical hash inputs. Remap child coverage, evidence/follow-up references and responsibility links atomically to their destination identities. Retain canonical Facility/equipment references only when currently permitted. New copied facts require the existing reconfirmation rules. Do not retain mutable cross-alternative child links or silently copy Activity ownership/completion as a new task.

Match within-alternative comparisons by stable entity/field IDs. Across copied alternatives, use exact recorded lineage to show related before/after facts while keeping independent identities visible. Unrelated alternatives have Added/Removed or Not comparable entities unless there is an explicit reviewed correspondence; never match solely by label, row index or similar wording. Any future manual correspondence feature requires its own contract, not a fuzzy automatic match.

Make difference ordering deterministic. Report quantity/unit, family/coverage, source/version, confirmation and removal separately. Preserve older schema fields as recorded; new fields are Not recorded on an older revision, not empty confirmed values. No definition upgrade or comparison may rewrite historical content/hash to fit the current editor.

### 8.7 Version dispatch, confirmation boundaries and full-request limits

This is an extension of a strict versioned contract, not simply additional JSON properties on a form. Trace every reader/writer that compiles a discovery input or checks its integrity before changing schema dispatch:

| Path | Required handling |
| --- | --- |
| Create/save/branch proposal and command parsers | Accept only the declared supported version; retain strict allowed keys, limits and canonical operation identity. |
| Current workspace and historical revision reads | Interpret the captured schema/definition; verify original hashes without normalising old data into today's schema. |
| Source-context preview and current-source adoption | Compare the correct versioned facts, observed references and required acknowledgments; never silently upgrade them. |
| Copy/inherit and hidden-answer reactivation | Preserve exact source provenance and independent IDs; apply the correct reconfirmation rules to the declared version. |
| Saved summary, costing preview/adoption and ordinary cost saves | Read the exact saved basis, compile extended readiness where applicable, and preserve ordinary saves' existing basis. |
| Quote-safe output and historical receipt/output recovery | Recheck current authority using the specific historical basis; no access broadening or rewriting retained bytes. |
| Comparison and error projection | Preserve missing/unknown/NoneDeclared/zero distinctions across versions and return actionable field paths without leaking denied content. |

The existing `confirmed_question_ids` validator accepts only the ten adopted question IDs and caps the list accordingly. Do not append configuration-fact UUIDs or invented Q11+ values to it. Give extended confirmations their own versioned representation and validate fact ownership, field identity, exact proposed value/unit/source and review context. Editing any of those facts after preview invalidates the corresponding confirmation/preview token until explicitly reviewed again. A forged or stale confirmation must fail at the server.

Unknown future schema versions must fail explicitly and safely; they must not be treated as legacy r01 or have unknown fields dropped during save. Backward-compatible read support, forward write adoption and business readiness are separate decisions. Record the dispatch inventory and compatibility fixtures in W01 and prove them in W03/W06.

The discovery and costing validators currently measure `Buffer.byteLength(canonical(value), "utf8")` for the complete request against 65,536 bytes. Preserve that interpretation. W01 must budget maximum field/entity counts with realistic bounded notes and envelope overhead; reaching all individual field limits simultaneously may still exceed the request limit. Show a safe size/limit error without truncating data. Test multibyte text and command overhead at the boundary, not just ASCII character counts. Existing lookup page limits are separate from saved-reference limits; the 100 displayed Facility candidates do not authorise 100 selected Facilities.

## 9. Responsive, accessible and exceptional states

Test the primary Configuration composition at 1920 × 1200 and 1440 × 900 CSS px, then widths 1280/1024, 768/390 and 320 px. These are verification samples, not a mandate to replace shared breakpoint definitions. Start from the existing menu dock/overlay and phone conventions, then prove the wizard fits.

On compact widths, the secondary menu is an accessible overlay, the step navigation exposes the current step and reachable other steps, the right summary becomes a labelled sheet/section, and primary actions remain reachable without covering form fields. Tables retain local scrolling; use a labelled before/after stack for narrow comparisons. Avoid body-level horizontal overflow.

Use native labels, semantic headings/tables, tab/tabpanel semantics, `aria-current` for the step, keyboard-operable menus and visible focus. Meet WCAG 2.2 AA in the implemented interactions, including readable contrast, non-colour state labels and accessible control targets. Test 200% zoom and reflow; the narrow menu-edge target is supplementary to the full header control. Announce validation/save results without reading an entire table on each keystroke. Focus the first actionable error or error summary when an attempted action fails. Do not communicate Added/Removed/Changed, selection or readiness by colour alone.

Required states: initial loading; no workspace; no matching filter results; unsaved edits; incomplete discovery; no costing; unpriced scope; legacy basis; archived option; option cap reached; read-only user; denied source; stale source; stale workspace; invalid command; unknown save outcome; unavailable integration; output rendering/failed rendering; recovery after reload.

Keep workspace identity visible while loading, but never combine a newly selected option's title with the previous option's data/actions. Abort or ignore stale requests. Navigating away with unsaved changes uses the existing unsaved-work guard; a failed save does not clear the draft or show “Saved”.

## 10. Implementation work packages

Use dependency order rather than a speculative delivery date. Each package produces reviewable native behaviour and its evidence; no new standalone mockup is a prerequisite.

| Package | Work | Completion evidence |
| --- | --- | --- |
| ES02-W01 — Reconcile and specify | Inspect current branch/working tree, AGENTS/README/STATUS, E2 contracts, routes, permissions and shared UI. Resolve §3.4–3.5 and §8.2/8.5–8.6: draft ownership, read DTOs, definition/schema, counts, readiness, lineage and integration boundaries. | Short ADR, capability/gap matrix, source fingerprints and migration decision. Resolve new field contracts before schema work. |
| ES02-W02 — Shell and five-step presentation | Apply breadcrumb/menu/header/summary/table refinements and exact §4.6 composition; add family overview and working filter interactions; reorganise existing discovery fields into five steps; retain explicit save and current routes. | Existing E2 flow works in the refined shell at desktop/phone sizes; shared menu consumers retain working navigation. |
| ES02-W03 — Structured scope | Implement reviewed area/system/evidence/responsibility and due-date representation, family/count rules, technical details, bounded selectors, independent copy identities/lineage and versioned readiness previews. | Server-validated save/reload, conditional/hidden-answer preservation, same-site and bounds refusals, forward compatibility proof. |
| ES02-W04 — Alternatives and comparison | Add alternatives register, immutable revision register, exact comparison selectors, field-level differences and source-change review. | Independent viewing/selection, deterministic differences, permission-safe history and retained drafts after conflicts. |
| ES02-W05 — Costing and Review integration | Implement permission-safe saved-summary reads separately from guarded adoption; connect exact-basis manual costing, basis labels, readiness actions, supported line/group views and Draft output links. | Different alternatives retain different estimates; changed discovery never silently changes costs or historical output. |
| ES02-W06 — Verification and handover | Complete meaningful database/API/browser tests, migration/restart checks where affected, visual measurements, accessibility review and documentation. | Exact tested source, executed results, screenshots, known limits and next bounded task recorded. |

W02 can progress once existing-field mappings are understood. W03 requires W01's data contract. W04 depends on the adopted stable identity and source representation. W05 preserves the current costing path throughout and extends it only after source/basis semantics are proven. Integrations with unavailable CS-08/ES-03/ES-08 sources remain explicitly incomplete rather than being simulated as delivered.

Likely implementation anchors, subject to the current checkout:

- `src/components/discovery-screens.tsx`, `discovery-fields.tsx`, `discovery-costing.tsx`.
- `src/estimating/discovery-definition.ts`, `discovery.ts`, `discovery-context.ts`, `discovery-workspace-context.ts`, `discovery-workspaces.ts`, `discovery-form-options.ts`.
- `src/estimating/cost-basis-service.ts`, `math.ts` and existing estimate/quote service boundaries.
- `src/shell/secondary-menu.tsx`, `src/components/product-navigation.tsx`, shell content/control providers and module workspace registration/styles.
- Existing Leads table primitives as a behavioural reference, with no CRM field coupling.
- Current Estimating API routes, migration registry, tests and delivery documentation.

Avoid replacing a functioning component merely because its current filename differs. Keep shared changes narrow, preserve unrelated work and use the repository's existing dependencies.

### 10.1 Execution and verification instructions

1. Read current `AGENTS.md`, `README.md`, `docs/STATUS.md`, relevant blueprint/standards, E2 ADRs and this plan. Inspect the actual branch, working tree and existing unmerged work. Reuse an appropriate existing feature branch or isolate ES-02 in a new branch/worktree. Do not reset or overwrite unrelated edits.
2. Record the current implementation gap matrix against W01–W06. Keep the working specification in the repository's established versionless location; preserve issued source snapshots unchanged and link this r04 revision. Do not upload temporary screenshots or source documents indiscriminately into a public repository.
3. Reuse current dependencies and components. At the inspected source the project declares Node 24.21.0 and npm 11.19.0; check the actual checkout before setup. This task does not require a framework, runtime or design-system upgrade.
4. Implement bounded packages continuously, preserving the current working discovery/costing routes between checkpoints. Do not stop after a plan, static screen, disabled feature scaffold or W02 cosmetic pass. For an unavailable external contract, finish the independent scope and identify that specific integration as unavailable.
5. Verify meaningful changed behaviour and required repository gates. Current scripts include `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:db`, `npm run test:http` and `npm run test:browser`. Follow current environment setup and compiled-browser conventions. Do not start services using guessed database settings or print credentials.
6. Extend the existing `tests/browser/estimating-discovery.spec.ts` and `tests/browser/estimating-cost-basis.spec.ts` journeys where appropriate. Add focused tests for new family/filter/evidence/count/readiness behaviours and exact revision diffs; preserve their existing conflict, unknown-result and narrow-screen proofs. Cover affected shell consumers. Do not replace established assertions with screenshot-only checks.
7. Database suites must target **`ppo_synthetic_test`**. Additive migration checks must follow the complete current AGENTS registry/upgrade requirements, including cross-domain assertions. If altering `ppo.business_identities`, settle `ppo.identity_target` with `SET CONSTRAINTS ppo.identity_target IMMEDIATE` before the ALTERs and restore DEFERRED afterward. Prove upgrades across pending migrations with existing E1 data. Never reset/reseed accepted originals to obtain a green result.
8. If adding capabilities or grants, follow AGENTS' generated access-review documentation, pinned-count and grant-allowlist obligations. Avoid a capability change when existing authority already expresses the action. Run applicable documentation/naming gates for maintained documents: `python3 scripts/check_foundation.py` and, when relevant, `python3 scripts/check_naming.py`; use `check_prototype.py` only for PP-01 package changes.
9. Capture native desktop and phone evidence at the exact tested commit. Verify shared geometry, readable text, all five steps, three workspace tabs, the synthetic §4.9 scenario and meaningful exceptional states. Compare actual browser rendering with the supplied assets and written rules. Fix observed defects before handover; disclose environmental blocks and tests not run separately from failures.
10. Produce the handover in §12 and follow the repository's branch/PR workflow. Commit/push/PR/merge/deploy authority comes from the execution session's current instructions; this reusable specification does not grant external publication or deployment authority. Do not treat old design-approval wording as a reason to re-request an already authorised local implementation step.

### 10.2 Attachment workflow and continuation record

The user can attach the complete companion prompt to VS Code; do not truncate it to a chat-paste limit. Read the whole brief and the relevant full plan sections before implementing. Filenames establish reference identity; the verified bytes and current repository determine their contents. Missing appearance references do not justify inventing branding or blocking independent contract work.

Maintain one concise continuation record in the established delivery location. Record the actual branch/commit, current W package, completed behaviours, schema/route decisions, tests run, defects, pending operations, dependencies and the next concrete action. Reuse a suitable existing record instead of adding overlapping status documents. Update it at meaningful package boundaries and before ending a long session; do not treat context compaction as completion.

Finish all authorised independent work. Stop only for a concrete unavailable capability, unresolved business policy outside the task's authority, or an environment/access block that prevents the remaining action; state the exact blocked behaviour and what has already been completed. Historical approval language does not require another approval for an already authorised routine implementation choice. Publication/deployment authority continues to come from the execution session.

The attachment brief adds execution detail; this plan governs behaviour and acceptance if wording diverges. Record and resolve a real conflict against the current user instruction and source contract before changing the affected behaviour. Do not silently pick whichever wording is easier to implement.

## 11. Verification and acceptance matrix

The IDs below are local plan test references, not replacements for PPO-010, EST-01–EST-09 or existing acceptance requirements. Record the applicable parent mapping in W01; a visual pass does not close broader business acceptance.

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

Use meaningful unit tests for comparison, definitions and arithmetic boundaries; database/API tests for integrity, permissions and receiving commands; browser tests for the actual journeys and shared shell geometry. Preserve existing required gates. Do not substitute new tests that merely mirror the implementation or expand unrelated testing without a concrete risk.

Use fictional fixtures for: one-area ProductSupply; multi-area shared equipment; retained unidentified equipment; customer-responsible freight; no-site/unknown scope; fresh and copied alternatives; legacy E1; changed Site; hidden/reactivated answer; incomplete successor with older cost basis; denied source; conflicting saves; lost accepted response. Keep source IDs, versions and expected outcomes explicit.

## 12. Definition of done and handover

The refinement is ready for owner review when the five-step workspace, Alternatives and Revisions views operate against real persisted E2 records; structured scope and differences preserve exact identities; the accepted UI rules are measured; existing manual costing and Draft output remain correct; and the applicable acceptance cases have evidence at the exact delivered source.

The implementation handover must include:

1. Current branch/commit, implemented packages, changed routes/components and any additive migration.
2. Design-source fingerprints, applicable UI rules, measured screenshots and justified exceptions.
3. Actual data/command extensions and the distinction between implemented integrations and unavailable dependencies.
4. Tests executed with results and source/run references; tests authored but not run listed separately.
5. Compatibility evidence for legacy records, exact cost bases, receipts and original output.
6. Remaining defects, business-policy decisions, owner visual/accessibility acceptance and the next bounded task.

Update maintained decisions, delivery notes, STATUS, document/UI registers and requirement traceability where applicable. Preserve parent requirement IDs and historical failed evidence. Register a UI baseline only from the exact approved source, not a different screenshot with a matching filename.

For implementation, start with **ES02-W01**, then deliver **ES02-W02** against the current working discovery flow and continue through the independent **W03–W06** scope. Report package completion separately from unavailable integrations and owner acceptance. The mandatory family overview, real editor/evidence actions, consistent counts and exact saved-versus-working distinction are part of completion, not optional polish. Do not adopt synthetic pricing, calculator output, approval authority or external integration to make the page appear finished.

This specification is ready to use as implementation input. It is not evidence that native behaviour, database compatibility, WCAG conformance or business acceptance has already passed.

### 12.1 Completion evidence and release boundaries

| Checkpoint | Required concrete record | Does not establish |
| --- | --- | --- |
| Ready to implement persistence | W01 ADR with resolved schema/limits, command/read DTO map, action guards, lineage and readiness dispatch; no critical model TODOs. | Owner acceptance of a new commercial or engineering policy. |
| Feature complete for independent ES-02 scope | W02–W05 native journeys, family/editor/evidence/summary actions, all five steps and real Alternatives/Revisions; unavailable integrations explicitly separated. | Completion from a static screenshot or disabled scaffolding. |
| Technically verified | W06 matrix mapping each applicable T01–T70 to an executed test, manual measurement or justified non-applicability, at the exact source; compatibility and rollback/recovery notes for changed persistence. | Passing tests that were merely authored, or claims about a different commit. |
| Ready for owner review | Measured native desktop/phone captures and representative loading, empty, denied, stale and dirty states; unresolved defects with impact and next action. | Visual approval, deployment or production readiness. |

Capture the primary Northbank Configuration state with the original logo/assets and the exact fixture source. Include separate evidence of another step, Alternatives/Revisions and compact layouts; use targeted captures or journey recordings to prove these views without creating a large decorative screenshot pack. Store evidence under the repository's established convention and identify viewport, route, fixture, schema, test/run and commit.

Before delivery, the builder must reconcile every UI action in §3.4 with a functioning native destination/command and every new field in §8.2 with a save/reload/compare rule. Record any unresolved critical dependency as a concrete gap; do not label the whole module complete while a mandatory native feature is absent. Technical implementation and owner approval are separate statuses.

## 13. Repository references

These links are pinned to the inspected source. Reconcile their successors with current instructions during implementation.

- [ADR-0025 — E2 discovery foundation](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/decisions/ADR-0025-e2-discovery-foundation.md)
- [ADR-0026 — E2 option persistence](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/decisions/ADR-0026-e2-option-persistence.md)
- [ADR-0027 — Exact discovery basis for manual estimate versions](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/decisions/ADR-0027-estimating-discovery-cost-basis.md)
- [E2 receiving and preservation contract](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/contracts/estimating-e2-design.md)
- [E2 screens handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/delivery/estimating-e2-screens-handover.md)
- [E2 cost-basis handover](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/delivery/estimating-e2-cost-basis-handover.md)
- [Discovery screens](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/discovery-screens.tsx)
- [Discovery definition](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-definition.ts)
- [Discovery workspace service](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-workspaces.ts)
- [Existing manual arithmetic](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/math.ts)

Additional r02 inspection anchors:

- [Repository instructions](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/AGENTS.md)
- [Current status](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/docs/STATUS.md)
- [Native shell styles](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/app/desktop-shell.css)
- [Native product navigation](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/product-navigation.tsx)
- [Shared secondary menu](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/shell/secondary-menu.tsx)
- [Implemented discovery costing](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/discovery-costing.tsx)
- [Package scripts and runtime declarations](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/package.json)
- [Discovery browser journeys](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/tests/browser/estimating-discovery.spec.ts)
- [Exact-basis browser journey](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/tests/browser/estimating-cost-basis.spec.ts)

Additional r03 source checks (same inspected commit):

- [Legacy discovery input, work-tag limits, source text and follow-up fields](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery.ts)
- [Workspace commands, revisions and current read DTO](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-workspaces.ts)
- [Workspace owner, reference and whole-group authority](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-workspace-context.ts)
- [Costing preview and adoption guards](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/cost-basis-service.ts)
- [Estimate/version permission context](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/context.ts)
- [Current command/draft and unknown-outcome helper](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/crm-state.ts)

Additional r04 source checks (same inspected commit):

- [Current unsaved-work interception](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/record-ui.tsx)
- [Complete-request bounds, copy and question-confirmation validators](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-workspace-validation.ts)
- [Initial draft, active-answer projection and editing controls](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/components/discovery-fields.tsx)
- [Scoped lookup limits and eligible owners](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-form-options.ts)
- [Source references and follow-up owner validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/discovery-context.ts)
- [Complete costing-request validation](https://github.com/deanrfiedler-gif/powerplants-one/blob/b4806afeb0ded1931b844a997621e2e300f7c7b6/src/estimating/cost-basis-validation.ts)
