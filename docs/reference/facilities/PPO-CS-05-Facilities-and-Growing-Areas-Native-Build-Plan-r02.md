# Powerplants One — Facilities and growing areas
## Native build plan · CS-05 · registers, detail and forms

**Revision:** r02  
**Date:** 21 September 2026  
**Product owner:** Dean Fiedler  
**State:** Prepared for native implementation; implementation and acceptance pending  
**Repository checkpoint:** [6a4303a](https://github.com/deanrfiedler-gif/powerplants-one/commit/6a4303a0ad74be994f08e71127b987c496a86612)

This plan turns the approved Facility field rules and Customers, Sites & Growing Areas design into a native delivery contract. It covers the complete register, hierarchy, canonical detail, conditional forms, change history, local position, map pin and equipment relationship journey.

The current repository already has canonical Facility records and basic hierarchy. This delivery extends them, preserves their links and supplies the richer fields and interaction behaviour that the standalone design does not yet persist in the app.

The principal integrity requirements are stable identity, exact Site scope, deliberate clearing on type/use changes, equipment installation separated from service coverage, no nested-area totals and immutable saved estimating/work context.

### What changed in r02

- Removed mandatory FAC-number backfill because the existing identity registry is append-only; use an existing reference or the correctly labelled canonical UUID.
- Protected legacy list, detail and create APIs and specified richer route/payload contracts.
- Defined omitted-versus-null updates, no-op saves, exact preview acknowledgements and current source/parent checks.
- Corrected grouping-versus-containment wording and disclosed the actual memory-only save-recovery limit.
- Added query/reload controls, source/related-state contracts, visual evidence requirements and twenty targeted acceptance cases.

Section 18 records all fourteen audit findings and the additional implementation detail. These revisions improve implementation precision without claiming runtime acceptance.

### How to use this plan

Use it for scope, implementation sequencing and review. For a VS Code coding chat, attach **PPO-CS-05-Facilities-and-Growing-Areas-VS-Code-Implementation-Prompt-r02.md**. That companion includes the complete contract below and can be used by itself. Neither document needs to fit the short ChatGPT project-instructions limit.

This is a plan based on the inspected sources, not a claim that the module is implemented or that its eighty acceptance cases have passed. Refresh the checkout before coding. The date-specific checkpoint identifies what was reviewed; newer compatible work must be preserved.

### Contents

- [CS-05 delivery contract](#cs-05-delivery-contract)
- [1. Purpose and intended result](#1-purpose-and-intended-result)
- [2. Source authority and inspected repository baseline](#2-source-authority-and-inspected-repository-baseline)
- [3. Scope and ownership](#3-scope-and-ownership)
- [4. Domain meanings and invariant rules](#4-domain-meanings-and-invariant-rules)
- [5. Navigation and screen composition](#5-navigation-and-screen-composition)
- [6. Form contract and field dictionary](#6-form-contract-and-field-dictionary)
- [7. Controlled changes, parent graph and save behaviour](#7-controlled-changes-parent-graph-and-save-behaviour)
- [8. Growing context, measurements and source history](#8-growing-context-measurements-and-source-history)
- [9. Location pin and map handoff](#9-location-pin-and-map-handoff)
- [10. Data model, references and migration](#10-data-model-references-and-migration)
- [11. Read and command contracts](#11-read-and-command-contracts)
- [12. Permissions, privacy and receiving integrations](#12-permissions-privacy-and-receiving-integrations)
- [13. Accessibility, responsive behaviour and application states](#13-accessibility-responsive-behaviour-and-application-states)
- [14. Synthetic fixtures and exact demo journey](#14-synthetic-fixtures-and-exact-demo-journey)
- [15. Implementation work packages](#15-implementation-work-packages)
- [16. Acceptance matrix](#16-acceptance-matrix)
- [17. Verification, documentation and definition of done](#17-verification-documentation-and-definition-of-done)
- [18. R02 audit resolution and implementation precision](#18-r02-audit-resolution-and-implementation-precision)

---

## CS-05 delivery contract

## 1. Purpose and intended result

Build **Facilities and growing areas: registers, detail and forms** as a native Powerplants One module. A permitted user must be able to find an exact location, understand its place on a site, record useful incomplete information, save a deliberate change and inspect its history. Equipment, estimating and work records must continue to refer to the same location identities.

The module covers structures, rooms, named growing areas and outdoor fields. It must work for a greenhouse grower, a berry operation and a mixed nursery without forcing all of them into a building hierarchy. Professional quality means clear information, reliable persistence, precise authority, recoverable failures and a consistent PPO interface.

**Delivery target:** a complete synthetic native application journey, suitable for review in the existing app. This document does not establish operational readiness, owner visual acceptance or production integration. All implementation acceptance cases below start **Not run**.

Keep scope ID **CS-05**. Retain the existing Facility entity and parent requirement IDs. The approved first-increment decisions **FAC-D01, FAC-D02 and FAC-D03** remain controlling. A newly proposed implementation detail in this document does not silently supersede an approved business rule. Their recorded approval on 8 September 2026 does not need to be requested again.

## 2. Source authority and inspected repository baseline

Repository: `deanrfiedler-gif/powerplants-one`.

R02 audit checkpoint: `main` **`6a4303a0ad74be994f08e71127b987c496a86612`**, checked 21 September 2026; merge of PR #266, EN-07 Engineering Change-Impact Review. R01 used `f977bf8626d6eeca26cae2031eae92dffbe43cfb`, the earlier inspected EN-08 merge checkpoint. Direct reads at the new commit confirm the relevant Facility commands, reads, receipt code, shared operations, approved field decision and migration registry remain unchanged. This is a planning checkpoint, not an instruction to reset a newer checkout to it.

Use sources in this order:

1. The current user instruction.
2. Approved FAC-D01–03 and the current shared data/authority contracts for business meaning; this CS-05 contract defines their bounded native implementation and explicitly labels new refinements.
3. The current module coverage register/audit for CS-05 scope and adjacent module boundaries.
4. Customers, Sites & Growing Areas r03 and its r02 audit for facility interactions, hierarchy, examples, equipment service relationships and map-pin behaviour.
5. Current native PPO components and r22 tokens for the application shell, typography and surface treatment.
6. Older HTML and screenshots as explicitly identified historical references.

The r03 HTML is a standalone design demonstration. Its browser storage, scripted Assistant, references, validation and role simulation are not native server functionality. Its historical workspace-only instruction means the module should not recreate an app shell inside its content. The native module still belongs inside PPO's existing shell. Its r20 appearance must not overwrite current r22 shell refinements.

| Inspected source | Relevance and boundary |
|---|---|
| `AGENTS.md`, `README.md`, `docs/STATUS.md` | Repository rules, synthetic scope and receiving workstreams. STATUS can lag a merged commit; use the inspected tree for implementation facts. |
| `docs/decisions/facility-field-proposal.md` r02 | Approved common/conditional fields, explicit unknowns, type-change clearing, authority and FAC-A01–07. Its PR #61 sequencing paragraph is historical. |
| `docs/decisions/customers-sites-workspace-design.md` r03 | Nine-area/two-site example, hierarchy, one inspection dock, exact context and equipment installed/served distinction. |
| `docs/decisions/customers-sites-workspace-audit-r02.md` | Eighteen addressed design findings; useful acceptance obligations and expressly deferred lifecycle/provider work. |
| `docs/decisions/customers-sites-maps-r03.md` | Optional facility pin, separate site arrival point, confirmation, sources and removal history. |
| `docs/reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html` | Actual retained design source; use its model and interactions selectively. No rendered visual acceptance was performed for this build-plan task. |
| `docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Audit-r04.md` | CS-05 registers, detail/forms, use/season context, dimensions, location and downstream coverage. |
| `docs/blueprints/BP-03-crm.md`, `docs/contracts/service-data-dictionary.md` | Organisation/SiteParty/Site/Facility/Asset separation; current scoped reads and owning boundaries. |
| `src/shared/commands.ts`, `src/shared/reads.ts`, `src/components/context-screens.tsx` | Current Facility creation, projection and basic Site/Organisation hierarchy. |
| `src/shared/http.ts`, `src/shared/authority.ts`, `src/shared/receipts.ts`, `src/platform/operations.ts`, `src/platform/permissions.ts` | Native HTTP, authority, original-operation, audit and permission integration. |
| `src/app/api/v1/facilities/route.ts`, `src/app/api/v1/facilities/[id]/route.ts` | Existing GET list, GET detail envelope and POST legacy create. Preserve all three contracts. |
| `db/migrations/0002-shared-foundation.sql`, `scripts/migration-registry.ts` | Original Facility constraints/identity registration; current registry runs through 0031 with 0016 reserved. Inspect the resulting live schema before changing it. |
| `src/estimating/discovery-context.ts` | E2 already reads exact Facility IDs, names and versions into captured discovery context. Do not repeat the older claim that structured estimating Facility scope is absent. |
| `src/app/globals.css` | Current Roboto asset and r22 semantic tokens. |
| `src/components/crm-state.ts`, `src/shared/validation.ts`, `src/platform/validation.ts`, `src/platform/http.ts`, `src/app/api/v1/operations/[id]/route.ts` | In-memory command recovery, schema-version-1 envelope, strict field errors, current HTTP transport and original receipt lookup. |
| `docs/standards/naming-conventions.md` | Shared reference allocation and documentation conventions; do not invent a disconnected local numbering system. |

For any path above, the R02 native-source checkpoint URL is `https://github.com/deanrfiedler-gif/powerplants-one/blob/6a4303a0ad74be994f08e71127b987c496a86612/<path>`. The retained r03 HTML and broader blueprint were inspected for R01 at `f977bf8626d6eeca26cae2031eae92dffbe43cfb`; their design handovers and current Facility/data contracts were re-read for R02. Do not describe an earlier source inspection as a new rendered review. Open the current equivalent before implementation. A missing file or changed contract must be reported as such, not reconstructed from its name.

### 2.1 Confirmed native starting point

The inspected create command accepts the existing command envelope, Facility UUID, company, site, name and optional parent. The Facility projection exposes basic identity/version and site/name/parent. It does not expose the richer approved horticultural fields. The Site and Organisation context components provide basic Facility listings. Their current “Within”/“within” parent labels conflate grouping with physical containment. Correct these existing projections as part of the native integration, not just the new detail screen.

Facility rows already have protected UUID identity, workspace/company/site keys, optimistic version metadata, same-site parent foreign keys, graph protection and protected deletion. Keep these controls. A Facility has no allocated `FAC` display number in the inspected original identity registration: `ppo.register_identity('Facility','')`. The r03 `SYN-PPO-FAC-…` labels are design fixtures, not proof of a native allocator. The original `identity_append_only` trigger forbids updating existing `ppo.business_identities`, including replacing a null display number. R01 did not resolve this conflict before requiring a backfill; R02 removes that requirement (§10.2).

The generic Facility search currently searches name and orders by UUID. A professional register requires a separate compatible query contract for richer filters and sorting. Do not sort only the first returned page in the browser.

The shared receipt fallback recognises only a limited set of edit command names; everything else in that branch defaults to `shared.create`. New Facility edit and Asset service-link commands must be added to explicit receipt-authority handling. An edit working once does not prove replay or original-receipt access is correct.

The inspected `sharedOperation` already locks the workspace row before current authority and original-receipt resolution. The original database graph guard uses the same workspace serialization, including direct SQL writes. Reuse this proven ordering; a new Site-only lock must not bypass the existing protection or introduce an opposite lock order.

Search results show engineering `served_areas` descriptions and snapshots. They do not establish a canonical Asset-to-Facility service-link table. Verify the current live schema and Equipment contract before introducing that relation. Reuse one if it has since landed; otherwise implement the bounded relationship specified below.

### 2.2 New decisions made by this build specification

These are implementation refinements for review through the CS-05 change, not claims of prior approval or existing runtime behaviour:

- Existing Facility reference or canonical UUID display without changing protected identity history; future FAC numbering is a separate shared-reference enhancement.
- Exact on-site position, optional dimension provenance and dated growing-context metadata.
- A parent relationship qualifier distinguishing grouping from explicitly recorded physical containment.
- A bounded native Asset-to-Facility service relation, if no authoritative equivalent exists.
- The pagination, command, concurrency and acceptance details in this document.

Record these as local **CS05-D01–D05** decisions in the working handover, in the order listed. R02 revises CS05-D01 explicitly: safe existing identity display replaces mandatory FAC-number backfill. It does not retroactively claim the original proposal was implemented. Preserve all existing FAC-D and parent IDs. Resolve technical names to current repository conventions without weakening these meanings.

## 3. Scope and ownership

### 3.1 Required in this delivery

- Cross-site, permission-scoped Facility/area register with exact Site filter, search, structure/use filters and stable server sorting/pagination.
- Site Facilities & areas view with list and collapsible hierarchy presentations, using the same saved records as the register.
- Canonical Facility detail route and one modeless inspection panel for quick review.
- Create, edit, change comparison, cancel, save, conflict and original-operation recovery journeys.
- Approved conditional structure fields, use/crop, footprint and explicit unknowns.
- Local position, optional approximate dimensions, measurement/source context and optional facility map pin.
- Dated growing/use/season context and readable immutable change history.
- Equipment installed here and equipment serving here, with their different meanings and exact identities.
- Exact linked work/document navigation where a supported relationship exists; honest availability states where it does not.
- Additive migration, compatible legacy reads/creation, scoped server authority, repeat-safe fixtures and meaningful evidence.

### 3.2 Adjacent boundaries

| Owning module | CS-05 responsibility | Remains with the owner |
|---|---|---|
| CS-01/02/04 Customer, contact and Site | Show current permitted context; deep-link to the exact Site/Organisation/contact where relevant. | Organisation/contact CRUD, Site lifecycle, postal address, time zone, SiteParty operator/owner/bill payer and arrival entrances. |
| CS-06 Site access/readiness | Link explicitly scoped requirements and their current source/review state if available. | Inductions, crop entry, biosecurity, shutdown decisions and permission to perform work. |
| CS-08 Survey/as-found | Retain a local location description and optional referenced evidence/pin/dimensions. | Survey capture, annotated plans, measured geometry, photo workflows and engineering review. |
| EQ Equipment | Show canonical installed location; maintain bounded service-area relationships with Equipment authority. | Moving/replacing/verifying equipment, model/configuration changes, lifecycle, maintenance and backups. |
| ES-02 / ES-08 Estimating | Resolve exact selected Facility IDs and current context through existing receiving contracts. | Discovery revisions, specialist decisions, alternative selection, costing adoption, prices and quotation output. |
| Projects / Service / Engineering | Open existing permitted records with explicit Facility links. | Creating work, attendance, technical acceptance, commissioning and release. |
| Document owner / SharePoint | Preserve exact document/version links and current access checks. | Provider authentication, uploads, folders, records management and operational document migration. |

**Excluded:** cross-site Facility moves; merge/split identity workflows; archive/restore/hard delete; bulk imports; GIS boundaries; automatic geocoding; irrigation control groups; crop production, varieties, harvest or yield ledger; automatic area totals; autonomous Assistant actions; new external integrations. Do not expose a nonfunctional Archive/Delete button or a fabricated Active/Archived filter. The current Facility has a recorded identity, not a newly invented lifecycle state.

If archive or cross-site relocation later becomes necessary, it needs an explicit receiving contract for descendants, installed assets, service links, work and historical snapshots. That future contract is not a prerequisite for this create/edit delivery.

## 4. Domain meanings and invariant rules

| Concept | Exact meaning | Must not imply |
|---|---|---|
| Organisation | Commercial/legal relationship context through SiteParty. | Unique site operator, bill payer, record visibility or Facility ownership. |
| Site | An addressed physical location and its own time zone/instructions. | Every Facility needs its own copied postal address. |
| Facility / growing area | One stable named location under an exact Site. | Equipment identity, a production batch, a pricing line or permission to enter. |
| Structure type | What kind of structure/area is recorded. | Its crop, activity, suitability, certification or condition. |
| Use | Recorded activity: propagation, production, trials, mixed, non-growing or unknown. | Construction type or a crop-cycle history. |
| Crop / crop group | Optional reported context for an applicable use. | Crop identity, variety allocation, yield or a complete production register. |
| Parent | Same-site organisational grouping; explicit containment is separately qualified. | Inherited type, dimensions, service, access or authority. |
| Installed location | The Facility/site physically housing a canonical Asset. | Every area that Asset serves. |
| Served facility | An explicitly recorded Asset-to-Facility service association. | Physical installation, verified capacity or membership of an irrigation control group. |
| Footprint | An independently recorded ground footprint in m². | Covered area, productive area, site area, usable area or a measured union. |
| Source / observed date | Basis and time of a reported fact. | Technical verification or an independently approved document. |

Never deduplicate records by name. Never match a supplied Facility or Site using a label when an exact ID is required. Record names can repeat within one Site. Show Site, location path and permanent reference or full canonical record ID wherever a choice could be ambiguous.

### 4.1 Required horticultural examples

| User-facing example | Structure mapping | Use/function and context |
|---|---|---|
| Greenhouse | Greenhouse | Actual cladding/bays; use/crop and footprint separately recorded. |
| Tunnel | Polytunnel when the actual structure matches | Tunnel count and cover; do not infer classification solely from the name. |
| Propagation House | Actual structure: e.g. Greenhouse, Polytunnel, Shade/net house or Indoor growing room | Propagation is the use. It is not a ninth structure type. |
| Pack Room | Non-growing facility for the example; optional parent structure | Non-growing use and Packing function; no compulsory crop. |
| Irrigation Block / Field | Open growing area for a physical outdoor block/field | Layout and crop/use as known. A purely logical valve/control group is not a Facility. |
| Irrigation Shed | Non-growing facility | Pump/equipment room function; equipment remains separate Assets. |

Retain all **eight** approved structure types and all **six** approved uses. The six examples are not a replacement taxonomy.

## 5. Navigation and screen composition

### 5.1 Native routes and entry points

Proposed page routes, to reconcile with existing route conventions: `/facilities`, `/facilities/[id]`, `/facilities/new?site_id=<id>` and `/facilities/[id]/edit`. Creation/edit may render the same accessible form in an overlay when entered from a Site; the URL and refresh/back behaviour must still be useful. Do not create two independent form implementations.

Provide entry from the current Customer/Sites secondary menu, Site Facilities & areas tab, Organisation Sites hierarchy and existing exact Facility links in Equipment/Estimating. Reuse the current customer/location navigation group. Do not add arbitrary destinations to the primary rail.

Site-scoped entry fixes Site context. A global Add facility / area first selects a permitted exact Site. Changing an unsaved creation Site clears incompatible parent/source selections through an explicit review if values have been entered. Editing an existing Facility never changes its company or Site.

Global register context is all permitted facilities or the selected exact Site. Selecting an Organisation filters through current permitted SiteParty relationships, with its relationship role labelled. Do not invent a Facility `organisation_id` owner or treat bill payer as operator.

### 5.2 Shared shell and theme

Use the current shared header, actual Powerplants logo asset, narrow navy rail, expanded secondary menu, global search/quick-add and account controls. Do not copy the standalone HTML shell or create a second logo/header. Preserve accepted icon-only menu toggle, white active menu row without coloured left edge, internal collapse target and globally centred search-plus-add group. If a current shell differs, inspect the owning component and accepted refinements before changing it; do not restyle unrelated modules opportunistically.

Use normal-width **Roboto**, with Verdana/sans-serif fallback. Body text roughly 13–14px, metadata 12–13px, section headings 16–18px, record identity 18–20px. Phone text inputs should remain comfortably readable. Use the current shared icon family with consistent stroke weight.

| Semantic role | Expected current theme value |
|---|---|
| Navy / primary text / primary action | `#242a37` |
| Secondary text | `#596779` |
| Link | `#355b80` |
| Neutral hover | `#f0f2f5` |
| Soft divider | `#e9ecf1` |
| Focus | `#365d8b` |
| Success text / surface | `#416d33` / `#edf5e9` |
| Warning text / surface | `#80530e` / `#fff2d9` |
| Neutral tag text / surface | `#526078` / `#edf0f5` |

Use named shared tokens instead of duplicating this palette inside the module. Older root tokens and r20 green selections coexist in the codebase; choose current r22 module components deliberately. Major tables and inspection surfaces should be flat and square. Controls use about 6px corners. Do not add green primary buttons, invented eco icons, oversized metric tiles, decorative gradients or deeply nested cards.

Use one compact heading, **Facilities & growing areas**, with a short line of context. The detail view uses the record name once, plus reference, Site/path and concise context. Avoid a large hero banner and repeated toolbar rows.

### 5.3 Register

Toolbar: local Search facilities, Site, Structure type, Use, optional columns control, Clear filters when relevant, and navy **Add facility / area**. The global search is not the local register search. Keep controls aligned and preserve a useful table width.

Default columns: **Name | Reference | Site | Structure | Use | Crop / crop group | Footprint (m²)**. Optional columns: Parent, On-site position, Context observed, Last updated. Show actual links in the link colour; ordinary row text remains navy/slate. Blank optional data reads **Not recorded**, never `0`, “None” or an empty semantic status.

The table meets the usable content edges without a padded surrounding card. Use fine row dividers, a neutral header, about 44–48px rows and restrained neutral selection. Long names may wrap without hiding reference or Site. Local horizontal scrolling is preferable to microscopic text. Name opens the canonical record; row selection opens quick inspection. Do not let nested buttons trigger unintended row navigation.

Search covers name, an existing reference when supported, exact canonical UUID and on-site position; filter by exact Site ID, structure code and use code. Support explicit **Not recorded** filters separate from **Unknown**. Stable server sorting supports Name, Site/name, Structure/name and Updated, each with UUID as a final tie-breaker. Site labels used for display are not identity keys.

Page counts must come from the permitted filtered dataset, not the current page length. Show either an exact authorised count or an honest loaded count with more available. Do not label a capped first page as the complete register. Record totals count each Facility UUID once, even with multiple SiteParty or equipment relationships.

Persist safe view preferences using existing app conventions, scoped to actor/workspace. Keep filters/sort/cursor in validated URL state where supported. On scope/filter changes reset pagination and cancel stale requests. Do not retain record content, secrets or editable drafts in unscoped browser storage.

### 5.4 Site hierarchy

Within one Site provide **List | Hierarchy** using the applicable shared control. List is flat; hierarchy shows same-site parent relationships. Outdoor records can sit directly below Site. Expand controls appear only on records with permitted children. Depth is real, not one generic child indent.

Default children sort by name then UUID. Root and child pages have explicit loading/More controls. Search returns matching records plus the permitted ancestor paths needed to understand them. Ancestors shown only as context must not be counted as additional matches. Never hide an unloaded match merely because its parent is collapsed.

Use a normal semantic list with expand buttons unless a complete keyboard-accessible tree component already exists. Do not add `role=tree` without implementing its keyboard contract. Expose full accessible path; bound visual indentation on narrow screens.

If filtering or collapsing removes the inspected row, close the dock and clear its contextual actions. If edits are open, run the unsaved-draft guard before the context change. Clear filters is available whenever filters are active, including nonempty result sets.

### 5.5 Detail and inspection

The canonical detail has three local tabs: **Overview | Related records | History**. Overview includes identity/location, structure details, growing context, measurements and optional pin. Related records contains Installed equipment, Serving equipment, linked work and documents. Do not duplicate the whole five-tab Customer workspace inside Facility detail.

Quick inspection is one modeless white dock, with fine left divider and the app's restrained left-edge shadow. Its heading contains record name/reference, Open full record, Edit when permitted and Close. Only one record/Assistant dock may occupy that slot. No second panel should squeeze the central table beyond usable width. At narrower sizes use a sheet or full detail page.

Detail data, related counts and history must identify their loading/failure states independently. Never replace failed related data with zero. A saved record can be viewed even when a nonessential related service is unavailable.

## 6. Form contract and field dictionary

Use one shared form model and server schema for create/edit. Desktop uses aligned two-column groups; phone uses one column. Required indicators and hints are explicit. Do not infer values from names. Optional values can remain unrecorded. Save is explicit; form navigation does not save.

Suggested order: **Identity & location → Structure → Growing context → Measurements → Source & notes**. Pin capture uses a focused subform or dialog; it is not compulsory for Facility save.

| Field | Required / validation | Ownership and display |
|---|---|---|
| Company / Site | Exact permitted IDs; Site required | Derived from selected Site; immutable on edit. Never caller-authoritative workspace/actor. |
| Facility / area name | Trimmed 1–200 characters | Duplicate names allowed. |
| Reference / record ID | Existing permanent reference when supported, otherwise the canonical UUID | Read-only, clearly labelled; never a generated browser counter. Display and compatibility are specified in §10.2. |
| Parent facility | Optional same-site ID | Self/cycle rejected. No inherited field values. |
| Parent relationship | `Grouping` or `Physically within` when recording/changing a parent | New selection is explicit. Legacy parent displays Grouping under the approved original meaning; no invented containment. No parent means no qualifier. |
| On-site position | Optional trimmed text, maximum 1,000 characters | E.g. “East side, beyond propagation house”. Distinct from Site postal address and access permission. |
| Location evidence | Optional exact source link or bounded reported note | Never an invented document ID or an unrestricted executable URL. |
| Structure type | Required on new rich create/edited details | Greenhouse; Polytunnel; Shade/net house; Open growing area; Indoor growing room; Non-growing facility; Other; Unknown. Legacy absence remains Not recorded. |
| Type description | Required only for Other; 1–200 characters | Otherwise absent. |
| Type unknown reason | Required when actively saving Unknown; 1–1,000 characters | Do not manufacture reasons for legacy rows. |
| Use | Optional controlled selection | Propagation; Production; Trials; Mixed; Non-growing; Unknown. Blank is Not recorded. |
| Crop / crop group | Optional trimmed 1–200 characters when supplied | Allowed for Propagation, Production, Trials, Mixed or Unknown use. With blank or Non-growing use it is inapplicable. |
| Context observed on | Required when actively recording/changing use, crop or season | Date-only, not future in the Site time zone; preserve absent legacy dates. See §8. |
| Season / context label | Optional trimmed 1–100 characters | E.g. “Spring 2026”; informative label, not a controlled crop season or scheduler. |
| Footprint area | Optional decimal m², positive, at most 2 decimals | Approved range equivalent to `numeric(12,2)`: maximum 9,999,999,999.99. Blank is unknown. |
| Approximate length / width / maximum height | Optional positive decimal metres, at most 3 decimals, maximum 9,999,999.999 each | CS-05 design extension; dimensions do not calculate footprint. No count multiplier. |
| Measurement basis | Optional `Reported`, `Approximate` or `Measured` | A recorded assertion; not technical certification. Blank remains Not recorded. |
| Measurement observed on | Optional valid date-only, not future | Distinct from server saved time; do not require a fabricated date. |
| Measurement source | Optional source title 1–200 plus note up to 2,000 characters and exact source reference when available | The UI shows missing source as missing; it must not imply measured/verified provenance. |
| Detail notes | Optional, up to 2,000 characters | Descriptive context, not a substitute for access/safety/equipment authority. |
| Change reason | Required for revisions under native command conventions | A readable explanation, including type/use clearing where relevant. |
| Saved actor/time/version | Server-derived | Separate from observation dates and source authors. |

Blank optional strings normalise to null. Validate trimmed values; preserve internal user text and punctuation. Reject unknown keys and invalid enum codes. Use consistent source limits across location, measurement, context, pin and service-link forms: title 200, note 2,000, optional source date valid/not future. Do not claim all facts have one shared source when their source records differ.

For decimal inputs accept ordinary base-10 strings, not `NaN`, Infinity, exponent notation, thousands separators or silent rounding. Label units next to fields. This first delivery accepts footprint in m² and dimensions in metres; a unit-conversion interface is unnecessary. DB guards must preserve bounds and applicability. A bare cast to `numeric(12,2)` can round excess input precision before a constraint sees it: validate before casting. If enforcing direct-SQL precision rejection, use unconstrained `numeric` with scale/range/finite checks that preserve the approved numeric(12,2) value domain, and document this physical-storage refinement.

### 6.1 Conditional structure fields

| Structure | Allowed extra fields | Validation |
|---|---|---|
| Greenhouse | Cladding: Glass / Plastic film / Rigid plastic / Mixed / Other / Unknown; bay count | Count integer 1–10,000 if supplied. Other cladding requires description 1–200. |
| Polytunnel | Cover: Plastic film / Net / Mixed / Other / Unknown; tunnel count | Count integer 1–10,000 if supplied. Other cover requires description 1–200. |
| Shade/net house | Cover: Shade cloth / Insect net / Mixed / Other / Unknown | Other cover requires description 1–200. No shade-performance calculation. |
| Open growing area | Layout: Beds / Rows / Benches / Containers / Mixed / Other / Unknown | Other layout requires description 1–200. |
| Indoor growing room | Growing levels | Integer 1–100 if supplied; not a footprint or yield multiplier. |
| Non-growing facility | Function: Pump/equipment room / Storage / Packing / Other / Unknown | Optional. An Other function description, 1–200, is a CS-05 consistency refinement and must be recorded as such. |
| Other / Unknown | No typed extra structure fields | Retain applicable common fields and explicit description/reason. |

Fields absent because they do not apply must not be resubmitted from hidden stale controls. The server rejects irrelevant submitted non-null fields independently of the UI. Other descriptions are absent unless their owning selection is Other. Unknown conditional values retain their meaning without fabricating knowledge.

If native codes are still absent, use one central stable code/label mapping: `greenhouse`, `polytunnel`, `shade_net_house`, `open_growing_area`, `indoor_growing_room`, `non_growing_facility`, `other`, `unknown`; uses `propagation`, `production`, `trials`, `mixed`, `non_growing`, `unknown`. These are proposed storage spellings of the approved labels. If the current shared schema already defines codes, reuse those instead. Label edits never rewrite historical codes or snapshots.

Do not silently impose unapproved combinations such as “Greenhouse must have Production use”. A physical greenhouse can currently be used for storage; structure and use remain different facts. Use determines crop applicability.

## 7. Controlled changes, parent graph and save behaviour

### 7.1 Type/use impact review

On a change that makes currently saved values inapplicable, derive an exact before/after list. Include field labels, existing values, proposed type/use and each value that will be cleared. Show any linked equipment associations that need human applicability review, but do not remove them automatically.

Require a reason and an explicit **Confirm these changes** decision. The server recomputes the affected set from the locked current record and the proposed values. Bind confirmation to record ID, expected version, proposed content hash and affected field/value set. A client `confirmed=true` flag or omission of a hidden input is insufficient.

Example: Greenhouse with Glass cladding and eight bays becomes Open growing area. Review clears cladding and bay count; name, footprint, Site, permitted parent and applicable use/crop stay unless deliberately changed. Changing use from Production to Non-growing clears a saved crop with the same explicit review. Changing Other to a named type clears its description deliberately.

Cancel leaves the saved record untouched and returns to the draft. Saving writes current details, any context/source events, human-readable before/after audit and original-operation receipt atomically. A stale version requires a fresh comparison. Switching back later does not resurrect old hidden values automatically.

### 7.2 Parent integrity and physical nesting

Keep parent optional. Parent choices show reference, Site/path and relationship meaning. The server verifies complete ancestry, not merely the currently loaded tree. Reject self-parent, descendants, missing/inaccessible parent, wrong company/Site and any cycle.

Concurrent reparenting must not create a cycle through separate individually valid requests. Retain the current shared-operation and database workspace graph lock, then recheck ancestry under that lock. A narrower Site-scoped strategy is optional future optimisation and requires all service/trigger write paths to be reconciled and proved together. Apply a consistent lock order for create/update and record it in the handover.

Parent changes and qualifier changes retain before/after history and a reason. An existing grouping edge is not automatically upgraded to physical containment. Do not automatically move descendants, assets, sources or work when reparenting within the same Site. A parent relation has no authority inheritance.

Physical containment is recorded context, not surveyed topology. Show nested paths and the qualifier clearly. An outdoor Facility need not have a parent. No artificial placeholder “building” is created to accommodate a field.

### 7.3 Draft, conflict and uncertain result

- Distinguish saved record, editable draft and server-accepted receipt.
- Dirty navigation prompts offer Continue editing or Discard changes; Save is offered only where validation can complete. Cancel/escape must not silently save.
- A validation response retains all permitted draft values and links errors to fields.
- A version conflict retains the proposal and offers a comparison with the latest permitted record. Do not silently overwrite, auto-merge or retry with a bumped version.
- A lost response retains the exact operation ID and exact submitted content; reconcile using the original receipt. Do not generate a new operation for the same uncertain submission.
- Identical retry returns one original effect. Reusing an operation ID with changed content conflicts.
- Identity/workspace changes clear loaded record data and drafts immediately. Access revocation prevents returning stale sensitive data or receipts, even when a mutation had succeeded earlier.
- Offline editing/queueing is not introduced. Show unavailable connection honestly and preserve an in-session proposal where authorised. Do not copy the HTML localStorage backup/restore system into the app.

## 8. Growing context, measurements and source history

### 8.1 Dated use/crop/season context

Treat use, crop and season as a dated informational snapshot. A create with recorded growing context captures its observation date; a revision of that context captures a new observation date, source basis and reason. Legacy absent context dates remain Not recorded. Saving unrelated notes must not manufacture a new crop observation.

Store immutable context observations alongside the current projection, using the existing audit/history mechanism where it can retain the full before/after snapshot. Record structure independently. The current projection is the last explicitly accepted current context, not a production timeline calculated from dates.

A user can report an earlier observation date. If it predates the current saved observation, show an explicit review that this older observation is being adopted as current reported context, retain the reason, and bind that acknowledgement to the save comparison. It does not overwrite the earlier event or establish continuous validity between dates. Do not support a future scheduled change, auto-effective season, harvest ledger or overlapping effective-date intervals in this delivery.

History shows **Observed on**, **Recorded by/at**, use, crop, season, source and reason as separate facts. Date-only values are rendered in the Site context without UTC day shifts. Server instants remain instants. Missing/changed time-zone data must not fall back silently to the developer's computer time zone.

### 8.2 Area and dimensions

Display each recorded footprint independently. Do not sum parent and child values. A grouping parent gives no basis for subtracting or excluding anything. Explicit containment alone also does not prove siblings are disjoint or that recorded boundaries cover the same measurement basis.

This delivery shows counts of records and completeness counts, **no aggregate Site/growing/covered-area total**. It does not multiply length × width, growing levels × footprint, bay count × any area or served memberships × footprint. A future total requires a defined area metric, exact included IDs, measurement basis, overlap policy and review evidence. Do not label a sum of entered values as a physical area.

Changing dimensions does not change parentage, equipment design capacity, crop yield, estimate quantities or saved prices. The source panel can show a previously recorded measurement without labelling it current verified truth.

### 8.3 Source handling

Reuse existing immutable source/history primitives where available. Sources identify a title, reported date when known, note/excerpt, recorded actor/time and exact external/internal version link when one exists. A local estimator/user note must be labelled as a reported note. Do not convert a supplied arbitrary string into an authoritative SharePoint document reference.

Capture the source version/hash when the source service supports it; otherwise state the available identity and date honestly. Reading a historical source still requires current permission to that source and its context. Store historical label snapshots for readability, but do not disclose inaccessible related IDs/names through diffs or counts. A removed link retains its permitted historical event.

## 9. Location pin and map handoff

On-site position and a plan/photo/drawing reference are useful without any map. Do not make a pin compulsory. Do not infer coordinates from an indicative rectangle or a fictional address.

Facility pin fields: optional signed decimal latitude and longitude, both supplied together; at most seven decimal places; latitude −90 to 90, longitude −180 to 180; zero is valid. Include proposed/confirmed state, source basis and checked date. The responsible actor and saved timestamp are server-derived. Check date cannot be future.

Confirmation requires valid coordinates, a source and explicit review of those exact coordinates. Editing either coordinate resets confirmation and checked date in the draft. Server validation enforces the same rule; typed coordinates plus a carried-over confirmed flag are insufficient. Confirmed means a user recorded a check, not independent survey verification.

Pin changes/removal require a reason, version comparison and retained before/after source history. Removal has an exact-point confirmation. Cancel leaves the saved point intact. Neither adding nor removing a pin changes the Facility identity, hierarchy, Site address or equipment relationships.

Use the r03 fixed-origin Google Maps URL pattern for deliberate **View pin** activation; construct parameters with safe URL encoding and honour the documented URL-length limit. Facility pins are inspection destinations and do not replace the Site's visitor/delivery/service entrance. Link to the existing Site arrival context when available. Do not implement a duplicate arrival-point editor in CS-05.

No SDK, API key, embedded map, automatic geocoding, device-location capture or background request is needed. No provider is contacted merely by loading the page. If the map URL cannot be constructed, retain useful location text and a clear unavailable state. Verify the current official Maps URL contract if implementation changes link behaviour.

## 10. Data model, references and migration

### 10.1 Extend the canonical record

Prefer an additive, typed extension to `ppo.facilities`, or a strict one-to-one details row keyed by its existing workspace/company/Site/Facility identity where repository conventions favour it. Do not create a second `GrowingArea` identity table with duplicate records. Details, pin and context changes participate in one Facility version boundary and audit transaction. Use an explicit `version=version+1`, server actor and server timestamp once per accepted Facility mutation, following the current native pattern; a one-to-one details row must not quietly acquire a second independent content version.

The logical aggregate contains identity/site/parent, parent qualifier, approved type/use/conditional fields, position, measurement data, current growing-context metadata, optional pin and references to immutable source/history records. Use controlled columns or validated tagged structures; a free-form custom-fields JSON object is not an acceptable replacement for the field rules.

History/source/context child records may use UUID keys without becoming new top-level business identity types. Prefer existing Facility/Asset audit objects and outbox event families. Do not expand business identity enums merely to store a detail row.

### 10.2 Safe identity display and reference compatibility

**R02 correction:** new FAC allocation/backfill is not a CS-05 completion gate. The existing append-only identity registry cannot be updated as if null display numbers were ordinary editable fields. Do not drop, disable or weaken that protection to deliver a nicer table reference. Do not create a second Facility identity, a parallel ungoverned number register or a browser-generated FAC number.

Use the authoritative existing reference if the reconciled native schema already supplies one. Otherwise display **Record ID** using the canonical Facility UUID. In a narrow table it may be visually abbreviated with an ellipsis, but its accessible text, copy action and full record expose the complete UUID. An abbreviation is not guaranteed unique and is never submitted as a lookup key. Ambiguous choices show the full ID, exact Site and path. Do not prefix an abbreviation with `FAC-` and imply it is an allocated business reference.

For an unnumbered dataset the default table heading is **Record ID**; if records legitimately have mixed supported identities, use **Reference / record ID** and make the value kind clear in detail. Exact UUID search works across server pages. Existing issued snapshots keep their original labels.

If FAC numbering is implemented by a newer shared identity workstream, reuse its canonical allocator/resolver and preserve its references. A future proposal to add FAC numbering here must explicitly resolve append-only identity compatibility, all reference readers, namespace/counter constraints, old snapshots, upgrade/reseed and direct SQL invariants in a separate reviewed shared-reference contract. It may be delivered later without blocking the required Facility forms. No change to existing central identity display numbers or existing Facility versions is authorised by a presentation-only fallback.

### 10.3 Relationship persistence

Retain canonical physical installation through the existing Asset facility/site link. If no native served relationship exists, add a bounded Asset-to-Facility service-link relation with workspace/company/Site, Asset ID, Facility ID, source, recorded actor/time and retained change history. Enforce same-site membership for active links and prevent duplicate active pairs. Ending a link is a retained event; it does not delete either identity.

The relationship belongs to the Asset aggregate. Version-lock and increment the Asset for each accepted service-membership change, with an Asset receipt/audit. Do not bump the Facility's version merely because an external Asset now serves it. Its related-data view refreshes independently. Implement explicit add and end operations rather than replacing an entire set from a possibly filtered picker.

Same-site moves of an Asset retain same-site service links. A future cross-site installation move must not leave active old-site service links: integrate an invariant guard with the owning move path, rejecting the move until those links are explicitly ended/reviewed. Do not automatically discard service relationships. Historical ended links keep their original Site context and must remain representable after a later Asset move; do not use a mutable current-Site foreign key that makes historical links impossible.

Use foreign keys for stable identity and DB guards for active same-site consistency, including updates to the Asset itself. If no cross-site move command exists currently, document that fact and still enforce the invariant at the database boundary. Avoid copying free-text engineering `served_areas` into this relation by matching labels.

### 10.4 Upgrade safety

At the inspected checkpoint the registry ends at **0031**, and **0016 is reserved**. Allocate the next available migration against the live branch/reservations when coding; this plan reserves no number. Read the live resulting schema, not only migration 0002. Preserve old migration bytes/checksums and prior seeds.

Existing Facility attributes remain null/Not recorded until actually recorded. Do not backfill Unknown, a guessed structure from its name, crop, coordinates, measurement dates, containment or technical verification. Legacy create remains accepted with absent rich details; rich form creation requires explicit classification.

Repeat seed must preserve user edits. Restrict new fixtures to deterministic synthetic identities and only the intended additions. Do not broaden permission grants to make the demo easy to use.

Follow `AGENTS.md` migration obligations: update exact registry expectations in `tests/database/field.test.ts`, `finance-upgrade.test.ts`, `offline.test.ts`, `packs.test.ts`, `planner.test.ts`, `reports.test.ts`; the `atVersion(N)` and `>=18` expectations in `leads-projects-integration.test.ts`; and migration counts in `tests/demo/upgrade.test.ts`. Inspect these live files rather than mechanically replacing every number.

Registry seeds must reference an existing migration in increasing order. Read the `latestMigrationVersion` hosted upgrade gate before changing it. If a migration alters `ppo.business_identities`, honour the documented deferred `identity_target` handling around the ALTER and prove a multi-migration upgrade across 0026 with estimates present. Testing only a fresh database is insufficient.

No new capabilities are expected. If reconciliation demonstrates one is necessary, document the reason and follow all generated AD-01 capability, seed/grant allowlist and upgrade obligations in AGENTS. Do not bypass these by granting an existing broad capability to every fixture actor.

## 11. Read and command contracts

Preserve existing HTTP wrappers, current-session identity, failure envelope, strict validation and `OperationReceipt` semantics. The following names/routes are proposed integration contracts, not claims of existing endpoints. Adapt spelling to the repository without combining unrelated actions into a generic unrestricted PATCH.

### 11.1 Reads

| Read | Required contract |
|---|---|
| Rich Facility register | Exact scoped filters, stable sort with UUID tie-breaker, bounded page size, opaque cursor, authorised count/has-more semantics and capabilities. Use a separate `/api/v1/facilities/register` read if extending the existing generic GET would change its contract. |
| Facility detail | Exact UUID, permitted Site/parent path, current version/reference, saved field projection and allowed actions. |
| Site hierarchy | Root/child pages and ancestor paths; exact Site; independent child counts/loading state; search may include permitted context ancestors. |
| Parent picker | Scoped same-site server search and paging, exclude self/descendants from choices, then revalidate complete ancestry on save. No first-100-record assumption. |
| Related equipment/work/documents | Exact typed relation and current target access; paginated where needed. Distinguish installed, served and site-wide context. |
| History/source | Immutable event/source identity and original permitted label snapshot, with current access checks. |
| Save-impact preview | Read-only derivation of exact values to clear and context/pin/parent review, bound to a version and canonical proposal hash. Save recomputes it. |

Bind register cursors to actor/workspace and normalised query/sort/filter shape using the existing signed cursor pattern. Every subsequent page rechecks current permission. Stable ordering is not snapshot isolation: on concurrent edits the user may refresh results; deduplicate loaded UUIDs and do not promise a frozen count across requests. Changing filters cannot reuse an incompatible cursor.

Do not require a full hierarchy download to open one Facility. Avoid N+1 requests per row or client fetches for every Asset. Batch current permitted joins, use indexes suited to Site/parent/name and active link lookups, and bound result sizes. A lookup must be able to reach a valid record beyond the first page.

### 11.2 Writes

| Logical command | Aggregate / authority | Accepted effect |
|---|---|---|
| Existing `CreateFacility` | Facility; shared.read + shared.create in exact scope | Existing legacy identity/name/site/parent creation remains valid. Do not loosen its strict whitelist accidentally. |
| Rich `CreateFacilityDetails` | Facility; same scoped read/create | Atomically create canonical identity, approved details, sources, history and original receipt; an existing reference mechanism may be reused without a new backfill requirement. May use a dedicated `/api/v1/facilities/create-details` endpoint to preserve legacy POST. |
| `ReviseFacilityDetails` | Facility; shared.read + shared.edit | Versioned name/parent/type/use/measurements/position/source revision with exact impact review. Company/Site immutable. |
| `SetFacilityPin` / `RemoveFacilityPin` | Facility; shared.read + shared.edit | Exact pin revision or confirmed removal, original history preserved. |
| `AddAssetServedFacility` / `EndAssetServedFacility` | Asset; current Equipment/shared edit authority plus read access to exact Asset, Site and Facility | One explicit service relationship change; installation remains unchanged. |

Use existing command-envelope conventions for `operation_id`, reason, entity ID and expected version. Do not invent a new global schema-version format merely for this module. New endpoints avoid overloading the legacy strict create parser. For updates, immutable context fields are either omitted from editable content or exact checked values; forged mismatches are rejected.

The current `GET /api/v1/facilities/[id]` returns `envelope([projectedFacility])`; it is already implemented. Keep its wrapper and legacy fields compatible. A richer workspace DTO may use `/api/v1/facilities/[id]/workspace`; do not silently convert the old response to a different object shape.

Each command is independently permission checked before returning an original receipt. Explicitly map every new command to its correct capability in `src/shared/receipts.ts`, including Asset service-link commands whose receipts point at the Asset. Keep shared.history.record authority for independently authored history where applicable; a normal edit's automatic audit is part of the edit command, not a second user action.

### 11.3 Transaction sequence

1. Validate strict command shape, limits and primitive types; resolve the current actor/workspace from session.
2. Use the existing operation lock/idempotency pattern and current scope checks. An existing original may be returned only after present authority is established; changed payload reuse conflicts.
3. For a new mutation, retain the existing workspace graph lock and then lock the aggregate in the documented order. Do not acquire a Facility/Asset row lock first and then reverse the shared graph-lock order. Lock/recheck related rows or scope as needed.
4. Verify expected version, exact Site/company/relations, field applicability and current source access.
5. Recompute comparison/clearing/pin/older-observation review from current locked data. Reject missing/stale acknowledgement.
6. Apply one canonical change; record source/context/history, audit/outbox and receipt in the same transaction. No partial Facility/source creation.
7. Return the native receipt. Refresh a permitted current projection separately; the receipt remains the original accepted result, not a regenerated current-state response.

Preserve existing meanings for unavailable, validation, stale version and operation conflict. Add narrowly named field/review errors only when needed. A response must never disclose an inaccessible Site/parent/Asset name through a helpful validation message.

In the shared-operation integration, distinguish current authority from mutation preconditions. Current authority runs before original-receipt access; expected-version and impact-preview freshness apply only to a new mutation after the original-receipt check. Otherwise a successful retry after its first version increment would incorrectly fail as stale. Do not replace the immutable original receipt with a freshly projected result.

## 12. Permissions, privacy and receiving integrations

Check workspace, company, exact Site and current relationship visibility on register, counts, hierarchy, pickers, detail, history, sources, commands and original receipts. Disabled UI is a convenience; the server is authoritative. Parent/child relationships and SiteParty roles do not confer access. Scope is not inferred from a query-string label.

Create-only, edit-only, read-only, wrong-company and wrong-site actors need distinct negative cases. An edit-only actor must be able to reconcile an authorised edit without requiring shared.create; a create-only actor cannot inspect/replay an edit receipt simply because of the existing fallback. Unknown command names must not silently receive a permissive authority default.

Permission-filtered service links require explicit operations: adding/removing a visible relationship cannot remove invisible ones through full-set replacement. Counts must be described as visible records if not globally complete. History may show an appropriately redacted change, but it must not reveal inaccessible target labels, IDs or counts.

### 12.1 Equipment receiving contract

For each Facility show two sections: **Installed here** and **Serves this area**. A single Asset can appear in both with its roles visible. The total of unique related equipment is deduplicated by Asset ID. The same pump serving three areas is one Asset, not three pumps.

Service-link creation shows Asset reference, physical installation, selected Facility/path and a source/reason. Non-growing support Facilities can also be served. A structure/use change flags applicability review in the comparison but preserves associations. Do not mark capacity or equipment suitability Confirmed as a side effect.

Provide **Open equipment** to the canonical permitted Asset. Installation changes route to its owning workflow. Do not copy model, manufacturer or serial number into editable Facility fields.

### 12.2 Estimating receiving contract

E2 currently captures Facility `id`, `version` and `name` under exact Site/company and hashes the context. New Facility edits can therefore change the current context seen by a future save. Preserve that contract and its `DiscoveryContextChanged` conflict semantics.

Old saved discovery references, source labels, adopted cost basis, estimates, totals and issued output remain immutable. A Facility rename does not rename a saved snapshot. A new measurement does not recalculate quantity or price. Reopening an authorised historical discovery must not be rejected just because a Facility's current version changed; historical reads recheck current visibility while returning the retained original snapshot.

The Facility module does not silently add the areas served by selected equipment to discovery scope. If a receiving picker exposes Facility context, it selects exact IDs through the existing boundary. Any new attribute snapshot must be versioned in that receiving contract, not appended silently to old documents.

### 12.3 Work, documents and engineering

Show exact linked work/documents only when their owning module exposes a structured relation and current access. A shared Site, matching name or free-text `served_areas` field is not enough to claim a Facility link. Broader Site records can be presented separately with their Site scope stated explicitly.

The Related records surface distinguishes **No linked records**, **Unavailable**, and **This relation is not yet supported**. It must not fabricate zero counts or dummy links. This delivery may add an explicitly bounded read adapter over an existing relation, but must not build missing Project/Service/provider workflows just to populate a panel.

Preserve current EN-06/07/08 engineering and commissioning snapshots, Asset references, installed-location descriptions and release hashes. CS-05 does not technically accept an as-built configuration or rewrite engineering sources. Integrate only through the owning exact receiving contract.

## 13. Accessibility, responsive behaviour and application states

Provide visible labels, associated hints and inline errors, an error summary linked to each invalid control, visible focus and correct disabled/read-only semantics. Status uses text as well as colour. Do not make a hover tooltip the sole source of a name, error or location path.

Local tabs, choice controls and dialogs follow existing keyboard patterns. Focus returns to a valid origin after dialog/dock closure or after the originating row changes. Escape closes the topmost eligible surface after the dirty-draft guard. Avoid nested dialogs; a review can replace the form's focused content or use the shared supported dialog stack.

At 1920×1200 and 1440×900 retain readable table and inspector. At 1280×800, collapse the dock or navigate to detail before crushing columns. Verify 390px and 320px widths, 200% zoom and a short-height layout. Stack fields and related sections; keep save controls clear of the keyboard and content. Horizontally scroll the table locally if needed; the whole page must not overflow sideways.

Use a compact action footer: Cancel and navy Save facility / Save changes. Display unsaved state quietly. The footer must not cover fields or extend beneath a dock. A Synthetic preview marker comes from the app's established treatment, not a large development banner.

| State | Required user experience |
|---|---|
| Initial loading | Structured loading indication; no temporary zero-count claim. |
| Empty permitted register | Clear empty explanation and Add action only if permitted. |
| Filtered empty | Current filters and Clear filters; creation permission remains independent. |
| Detail not available | Generic native unavailable handling; no leak of an inaccessible identity. |
| Legacy incomplete | Existing record visible; missing type/source/dates are Not recorded, not failed/unsafe. |
| Read-only | View useful detail/history; hide or explain unavailable edit actions consistently. |
| Field validation | Retained draft, linked errors, focus to summary/first invalid control. |
| Impact review | Exact values and consequences, reason, explicit confirm and cancel. |
| Saving | Prevent duplicate submission without discarding the operation identity. |
| Confirmed save | Receipt-backed success and refreshed permitted data. |
| Conflict | Latest saved comparison plus retained proposal; deliberate retry as a new operation after review. |
| Unknown result | Reconcile original operation; do not claim save failed or succeeded without evidence. |
| Related source unavailable | Saved Facility still useful; related section reports its own limitation. |
| Session/permission change | Clear sensitive loaded data/drafts, recover through current sign-in/authority flow. |

## 14. Synthetic fixtures and exact demo journey

Retain the r03 demonstration's meaning while allocating repository-conventional deterministic synthetic IDs. Label names/addresses/people as synthetic. Do not import real grower data or infer coordinates for fictional addresses.

Organisation: **Willowbank Horticulture**. Sites: **Nursery & propagation** and **Field production**. Nine Facility identities:

| Site | Facility | Parent / relationship | Example classification and values |
|---|---|---|---|
| Nursery & propagation | Greenhouse 01 | Site root | Greenhouse; Glass; 8 bays; Production; young vegetable plants; 2,400 m². |
| Nursery & propagation | Tunnel 01 | Site root | Polytunnel; Plastic film; 6 tunnels; Production; berry liners; footprint Not recorded. |
| Nursery & propagation | Propagation House 01 | Site root | Greenhouse; Rigid plastic; 4 bays; Propagation; mixed nursery stock; 1,200 m². |
| Nursery & propagation | Propagation Bay A | Physically within Propagation House 01 in this explicitly authored fixture | Named growing compartment; actual structure classification explicitly recorded, not inherited; Propagation; rooted cuttings; 240 m². |
| Nursery & propagation | Pack Room 01 | Site root | Non-growing facility; Packing; Non-growing; 360 m². |
| Nursery & propagation | Irrigation Shed 01 | Site root | Non-growing facility; Pump/equipment room; Non-growing; 48 m². |
| Nursery & propagation | Irrigation Block 01 | Site root | Open growing area; Containers; Production; container nursery stock; 1,800 m². |
| Field production | Irrigation Block 02 / Field | Site root | Open growing area; Rows; Production; field nursery stock; 12,500 m². |
| Field production | Tunnel 02 | Site root | Polytunnel; Plastic film; 4 tunnels; Trials; berry varieties; footprint Not recorded. |

For Propagation Bay A, use the r03 fixture's explicit Greenhouse classification as a recorded example, with no automatic inference or additional bay count. Its nested footprint must not be added to its parent's footprint. Record observed dates only as deliberately authored synthetic inputs.

One canonical pump is installed in Irrigation Shed 01 and explicitly serves Greenhouse 01, Tunnel 01 and Propagation House 01. It initially does not serve Propagation Bay A merely because its parent is served. All facility map pins start unrecorded. Add pin coordinates only inside an explicitly labelled test scenario.

Keep the approved FAC-A01 greenhouse/berry/mixed-nursery scenarios as acceptance fixtures too; the nine-record showcase does not replace their boundary coverage. Include duplicate Facility names, a legacy Facility with absent attributes, Other/Unknown, every conditional type, and a Site with more than one page of records in separate test data.

Demonstration journey: find Propagation Bay A through a Site search; inspect its exact parent/path and footprint; open its canonical detail; record a dated crop/context change; reload; inspect history; show the pump's installation and three served relationships; create a direct-to-Site outdoor area; perform and cancel a type-change comparison; finally confirm a change and inspect the cleared-field history. Saved estimate values remain unchanged throughout.

## 15. Implementation work packages

Work in focused reviewable increments. Each package ends with a functioning vertical slice or a concrete contract review; do not leave all authority and error handling until the final phase.

| Package | Work | Exit evidence |
|---|---|---|
| WP0 — Reconcile | Read current AGENTS/README/STATUS, scope/decisions, live schema, route/component owners, Equipment and E2 contracts. Record current HEAD and drift from this checkpoint. | Actual reuse map, local decision entries, migration reservation check and scoped implementation checklist. |
| WP1 — Canonical persistence | Add approved fields, provenance/context, identity-safe projections and constraints; preserve legacy create. Implement rich create/revise, exact impact review and correct receipt authority. | DB/API happy path, strict validation, original retry, conflict, upgrade and legacy compatibility. |
| WP2 — Registers and identity navigation | Rich register, Site hierarchy, scoped search/pagination/parent picker, canonical detail and existing Site/Organisation links. | Exact record found beyond first page; duplicate names and filtered ancestor/count correctness; direct route reload/back behaviour. |
| WP3 — Forms and history | Shared conditional form, source/context fields, comparisons, dirty navigation, error/receipt recovery, readable history and responsive detail/dock. | Create/edit/reload/restart plus type/use clear/cancel/stale and dated-context journeys. |
| WP4 — Location and related equipment | Optional pin with confirmation/source/removal; installed/served relation and authority; exact work/document read adapters and availability states. | One-pump/three-areas proof, active-link move invariant, no inherited service, pin reset and source-access tests. |
| WP5 — Receiving regression | E2 exact context, old discovery/price/output preservation; Equipment/engineering receiving invariants; aggregate count and performance checks. | Original saved bytes/hashes unchanged and fresh context conflict behaves correctly. |
| WP6 — Review handover | Compiled desktop/phone captures, meaningful adverse-case evidence, docs/register updates, final diff and limitations. | Exact candidate commit/tree, tests/captures, requirement mapping and honest remaining acceptance. |

Prefer current React/Next/TypeScript/PostgreSQL tools, shared components and service functions. No new framework, database service, map SDK, date library, generic schema builder or dependency is required by this plan. Inspect the current `package.json`; the planning checkpoint has `lint`, `typecheck`, `test:unit`, `test:db`, `test:http`, `test:browser`, `build` and `check` scripts.

Suggested new service modules may live under `src/shared/facilities/` with validation, reads, commands and projections separated. Reuse existing transaction/authority utilities rather than copying them. Choose component/file names after inspecting the current tree. Do not claim a proposed path already exists.

## 16. Acceptance matrix

**Status for every case: Not run.** These are local delivery cases, not new master requirements. Attach actual evidence at implementation time. UI-only checks do not prove database or authority behaviour; source inspection does not prove a rendered interface.

| ID | Observable acceptance result | Primary evidence |
|---|---|---|
| CS05-T01 | Register, Site hierarchy and canonical detail resolve the same Facility UUID and reference after reload. | HTTP/browser |
| CS05-T02 | All six named horticultural examples fit the eight-type/six-use model without a new Propagation structure enum. | Domain/browser |
| CS05-T03 | Legacy Facility with absent details remains readable; no guessed type, crop, coordinates or observation date appears. | Upgrade/HTTP |
| CS05-T04 | Duplicate names within/across Sites remain separate and distinguishable in table, picker, history and route. | DB/browser |
| CS05-T05 | Rich create requires explicit type or Unknown reason; optional unknown measurements do not block save. | HTTP/browser |
| CS05-T06 | Existing legacy POST create accepts its original payload and returns native receipt semantics. | HTTP/regression |
| CS05-T07 | Every conditional type shows/persists only applicable values, including Other descriptions and maximum counts. | Unit/DB/browser |
| CS05-T08 | Unknown differs from Other and from Not recorded in fields, filters and history. | Unit/browser |
| CS05-T09 | Blank optional values persist as null; zero/negative/NaN/infinite/exponent/overprecision/out-of-range values are rejected. | Unit/HTTP/DB |
| CS05-T10 | Direct SQL cannot violate same-site identity, graph, active served-link or chosen decimal/applicability invariants. | DB |
| CS05-T11 | Overlong names/notes, unknown keys and irrelevant submitted fields fail without a partial save. | HTTP/DB |
| CS05-T12 | A greenhouse may record Non-growing use without changing its physical structure; crop applicability follows use. | Domain/HTTP |
| CS05-T13 | Type-change comparison lists exact saved values to clear; cancelling changes no saved row/history/version. | Browser/DB |
| CS05-T14 | Confirmed type/use changes clear only inapplicable fields and retain readable before/after values and reason atomically. | DB/browser |
| CS05-T15 | Omitting hidden inputs or forging a confirmation boolean cannot bypass clearing review. | HTTP |
| CS05-T16 | Stale comparison or modified proposal hash fails; switching back never silently restores old hidden values. | HTTP/browser |
| CS05-T17 | Same-site parent selection supports direct-to-Site outdoors and explicitly contained child areas. | Browser/DB |
| CS05-T18 | Self, descendant, cross-site/company and inaccessible parents are rejected; complete ancestry is checked beyond loaded pages. | HTTP/DB |
| CS05-T19 | Two simultaneous reparenting operations cannot create a cycle; losing proposals remain recoverable. | Concurrent DB/browser |
| CS05-T20 | Legacy grouping is not converted to physical containment; changing parent/qualifier retains history without moving Assets. | Upgrade/DB |
| CS05-T21 | Use/crop/season edits retain observed date, server-recorded date, source and reason separately; unrelated edits add no crop observation. | DB/browser |
| CS05-T22 | Older observation adoption needs exact review; future observation dates fail; date-only values do not shift on display. | Unit/HTTP/browser |
| CS05-T23 | Parent and child footprints are shown separately with no aggregate area or automatic multiplication. | Domain/browser |
| CS05-T24 | Measurement source/basis can remain unknown; Measured text does not generate technical approval or estimating changes. | HTTP/browser |
| CS05-T25 | Optional pins start absent; paired coordinate/range/precision checks accept valid zero and reject malformed values. | Unit/HTTP/DB |
| CS05-T26 | Coordinate edits reset confirmation; confirmation requires source/date and review of exact coordinates. | HTTP/browser |
| CS05-T27 | Pin removal shows exact comparison; cancel preserves saved point; confirm retains history and leaves Site/Asset links unchanged. | DB/browser |
| CS05-T28 | Map links use fixed origin/encoded parameters and explicit activation; no background geocoding or invented directions gate. | Unit/browser |
| CS05-T29 | One pump has one Asset identity, one installed location and three service links; unique count stays one. | DB/browser |
| CS05-T30 | Serving a parent does not automatically serve children; non-growing Facilities can be explicit service targets. | DB/HTTP |
| CS05-T31 | Add/end service links preserves installation; duplicates/cross-site targets fail; ending retains history. | DB/HTTP/browser |
| CS05-T32 | Active old-site links prevent any supported cross-site Asset move; ending a link preserves its original Site history. If moves are unsupported, the existing move rejection remains and no new move capability is introduced. | DB/owning command |
| CS05-T33 | Service-link changes version-lock the Asset and use correct Asset receipt authority; Facility content version is unaffected. | DB/HTTP |
| CS05-T34 | Search/filter/sort are server-wide; a permitted target beyond page one is reachable in register and parent picker. | HTTP/browser |
| CS05-T35 | Cursor/query mismatch, stale responses and scope changes cannot mix results or leak data. | HTTP/browser |
| CS05-T36 | Hierarchy search includes context ancestors without inflating match counts; unloaded descendants remain discoverable. | HTTP/browser |
| CS05-T37 | Filtering/collapsing away selection clears dock actions; dirty edits invoke their guard. | Browser |
| CS05-T38 | Scoped counts deduplicate UUIDs across SiteParty and served joins; a failed related read is not presented as zero. | HTTP/browser |
| CS05-T39 | Read-only, create-only and edit-only actors see correct actions and cannot call unauthorised writes directly. | HTTP/browser |
| CS05-T40 | Cross-workspace/company/Site access fails for lists, detail, parent choices, source/history, counts and receipts. | HTTP/DB |
| CS05-T41 | Revoked permissions prevent original receipt/history disclosure; edit receipts do not incorrectly require create capability. | HTTP |
| CS05-T42 | Partial relationship visibility cannot cause hidden service links to be cleared or leaked. | HTTP/DB |
| CS05-T43 | Two edits at one version yield one accepted change and one conflict; no automatic overwrite/retry with new version occurs. | Concurrent DB/browser |
| CS05-T44 | Lost response plus identical original retry yields one mutation/audit/source set and the original receipt. | HTTP/DB/browser |
| CS05-T45 | Reused operation ID with changed content conflicts; replay after later edits returns its permitted original result. | HTTP/DB |
| CS05-T46 | Forced failure rolls back identity/details/source/history/outbox/receipt consistently. | DB |
| CS05-T47 | Sign-out/actor/workspace switch clears sensitive loaded content and drafts, including an open picker/dock. | Browser |
| CS05-T48 | Dirty navigation, validation failure, unavailable connection and uncertain result preserve or discard the draft only through stated actions. | Browser |
| CS05-T49 | E2 fresh context detects Facility version/name changes, while authorised old discovery reads retain their captured labels. | Integration/DB |
| CS05-T50 | Facility edits/service links never reprice estimates or mutate saved cost basis, issued output or commissioning release hashes. | Regression/hash proof |
| CS05-T51 | Work/document links use exact supported relationships and current permission; matching names/Site do not fabricate Facility links. | HTTP/browser |
| CS05-T52 | Existing references and UUIDs remain unchanged; unnumbered records use a clearly labelled, searchable/copyable canonical UUID; no identity backfill or false FAC number is introduced. | Fresh/upgrade DB |
| CS05-T53 | Migration from the inspected prior schema and multi-migration upgrade across 0026 preserve unrelated records, grants and originals. | Upgrade DB |
| CS05-T54 | Repeated seed does not overwrite user edits; registry/generated-contract expectations are updated only where necessary. | Reseed/CI |
| CS05-T55 | Data and history survive actual app/database restart for greenhouse, berry and mixed-nursery scenarios. | Restart proof |
| CS05-T56 | Header/logo/navigation/controls/tabs/table/dock match current native r22 references; no duplicate shell or green primary action. | Reviewed captures |
| CS05-T57 | 1920/1440/1280 desktop, 390/320 phone, zoom and short-height layouts retain useful fields/actions without clipped content. | Browser/captures |
| CS05-T58 | Keyboard labels/errors/focus/escape/draft guard work; screen reader and physical-device checks are separately recorded. | Browser/manual |
| CS05-T59 | Realistic larger register/hierarchy/search load remains bounded with no per-row request fan-out and no false complete-page counts. | Timed HTTP/query evidence |
| CS05-T60 | Scope/decision/data dictionary/status/handover accurately identify implemented, verified and still-unaccepted behaviour. | Documentation review |

### Additional R02 acceptance cases

The original T01–T60 identities are retained; these twenty cases close the audit gaps. All remain **Not run** until executed against an implementation candidate.

| ID | Observable acceptance result | Primary evidence |
|---|---|---|
| CS05-T61 | Existing Site/Organisation summaries use Grouped under for legacy parentage and Within only for explicit containment; full path/ID is consistent across surfaces. | Browser/projection |
| CS05-T62 | Legacy GET list, GET detail envelope and POST create keep their supported contract; rich endpoints do not silently change them. | HTTP/regression |
| CS05-T63 | Omitted patch keys remain unchanged; explicit null clears only allowed optional fields; merged type/use changes require exact review before clearing old values. | HTTP/DB |
| CS05-T64 | Empty/no-effect new revisions return validation with no version/audit/receipt; identical accepted originals still replay after later edits. | DB/HTTP |
| CS05-T65 | Read-only POST preview enforces origin/current authority/size limits and creates no operation receipt, history or outbox effect. | HTTP/DB |
| CS05-T66 | Parent/path or source basis changed after preview invalidates the exact review; unrelated changes do not; forged before-values cannot authorise it. | Concurrent HTTP/DB |
| CS05-T67 | Schema-version-1 envelope/reason limits and unknown-key rules are enforced; a nested service-link route resolves both IDs and rejects wrong-Asset links. | HTTP |
| CS05-T68 | Confirmed save followed by a failed refresh remains visibly saved with a refresh error; no second mutation is issued. | Browser/HTTP |
| CS05-T69 | An absent/hidden receipt lookup only permits retry of the in-memory original, never a new intent or a broadened permission bypass. | HTTP/browser |
| CS05-T70 | Forced reload demonstrates the documented memory-only limitation; no lost original is reconstructed or silently resubmitted; exact saved records can be inspected. | Browser/manual |
| CS05-T71 | New CS-05 validators do not change legacy optional-text rules or old operation hashes; invalid precision is rejected before lossy numeric casting. | Unit/DB/regression |
| CS05-T72 | A process restart invalidating a cursor resets to a fresh first page with the same filters, without an error loop or a data-loss claim. | HTTP/browser |
| CS05-T73 | Delayed responses from another Site/actor or older picker request cannot overwrite the current selection, draft or submitted intent. | Controlled browser/network |
| CS05-T74 | Source-date, observed-date and server-instant cases include leap dates and Site midnight boundaries; no developer-time-zone fallback manufactures a date. | Unit/HTTP |
| CS05-T75 | Changing pin source/check date requires renewed confirmation; unrelated Facility notes preserve the pin; no-op pin saves do not add a version. | HTTP/DB/browser |
| CS05-T76 | Source correction preserves original text/version; current history uses Facility audit or explicit typed child records without inventing legacy history kinds. | DB/HTTP |
| CS05-T77 | Related states distinguish supported-empty, unsupported, unavailable, stale and loading; no dummy actions or misleading zero counts appear. | Browser/HTTP |
| CS05-T78 | Canonical UUID copy/search works beyond page one; abbreviated display is not accepted as an identity key; protected central identity rows remain unchanged. | DB/HTTP/browser |
| CS05-T79 | Actual workspace/company/Site permission fixtures prove isolation; finer unavailable ACL scenarios are labelled accurately and no test-only broad grants are introduced. | DB/HTTP/evidence review |
| CS05-T80 | The handover records exact reused UI/source paths, before/after views, slice checkpoint and case evidence; no runtime pass is inferred from document assurance. | Review/captures |


### 16.1 Existing acceptance trace

| Existing anchor | CS-05 coverage |
|---|---|
| FAC-D01 | Field dictionary, eight structures/six uses, conditional validation: T02, T05–12. |
| FAC-D02 | Useful incomplete context, Unknown/Other/legacy distinction: T03, T05, T08–09, T24–25. |
| FAC-D03 | Deliberate type/use clearing with immutable history: T13–16, T43–46. |
| FAC-A01 | Save/reload/restart greenhouse, berry and mixed-nursery scenarios: T01–07, T55. |
| FAC-A02 | Same-site graph/Asset boundaries: T10, T17–20, T29–33, T40. |
| FAC-A03 | Field and number boundaries: T07–12, T22, T25–26. |
| FAC-A04 | Comparison/cancel/history/concurrency: T13–22, T43. |
| FAC-A05 | Permission, original-operation and revocation: T39–47. |
| FAC-A06 | Upgrade/reseed/original-output compatibility: T49–55. |
| FAC-A07 | Mobile, accessibility, errors, dirty state and identity clearing: T47–48, T56–58. |
| CRM-04/08; CA-05/06/10/13; AT-02/23/25 components | Retain the approved Facility proposal's trace; link evidence without marking the broader parent cases complete. |
| CS-05 coverage audit | Registers/detail/forms, local position, nested/direct areas, dated context and no overlap totals: T01–04, T17–24, T34–38, T51. |

## 17. Verification, documentation and definition of done

Run meaningful tests as each behaviour becomes real. Do not create assertion-only tests that merely repeat constants or scan source text to claim business acceptance. Use real PostgreSQL for constraint, transaction, concurrency, scope, migration and restart claims. The repository database tests must use **`ppo_synthetic_test`**.

Use the current Node/npm versions and lockfile. Run relevant focused unit/HTTP/DB/browser tests, `npm run lint`, `npm run typecheck` and `npm run build`. Run `python3 scripts/check_foundation.py` for foundation/docs changes and `python3 scripts/check_naming.py` where naming guidance changes; retain applicable prototype checks. Run the required compiled application/CRM/Estimating and affected upgrade regression gates described by the live repository. Do not substitute a development-server screenshot for compiled application evidence.

Migration changes have repository-wide required checks even if UI scope is small. Broaden tests to satisfy those documented gates or investigate a concrete risk. If an environmental failure occurs, compare it with unchanged main before calling it a regression. Preserve original failures and exact limits; never remove business assertions merely to turn a job green.

For T59 use a repeatable synthetic dataset (for example, 5,000 Facilities across permitted Sites with one Site exceeding 500 records, deep paths and repeated names). Record environment, dataset, query count and timings. Proposed review budgets: warmed register/detail API p95 within 500ms on the recorded review environment and search-to-result within 1s after debounce. These are design targets, not measured guarantees or substitutes for existing PT requirements. Investigate a miss before adopting a baseline; do not publish an unsupported speed claim.

Document the new native delivery through reviewed working files such as `docs/decisions/facilities-growing-areas-native-design.md` and `docs/delivery/facilities-growing-areas-handover.md`, plus the shared data dictionary and appropriate CS-05 register/status entry. Select names under current PPO naming rules. Keep issued r01/r02/r03 HTML and their evidence unchanged. Preserve master IDs, unrelated STATUS entries and adjacent workstream outcomes.

The final handover must include:

1. Actual branch, commit/tree and source checkpoint; reconciled deviations from this plan.
2. What users can now do, routes and reused components.
3. Logical/physical schema, allocated migration and reference compatibility, API/authority/receipt mappings and lock order.
4. Exact changed files and integration boundaries, including Equipment and E2.
5. Acceptance-case results with evidence, not just a count of tests.
6. Fresh/upgrade/reseed/restart/concurrency/original-output evidence and any failures.
7. Reviewed desktop/phone captures and separate keyboard/screen-reader/device status.
8. Known limits, unsupported related integrations and owner acceptance still outstanding.

**Complete** means the required native journeys persist and recover correctly, invariants and authority are proved, current shell conformity is reviewed, required checks are resolved and the handover accurately describes the exact candidate. A local HTML demonstration, a build that compiles, or prospective test rows is not completion evidence.

Implement on a focused branch and prepare reviewable changes. Do not merge, deploy, change production data, connect providers or send external messages merely because this implementation plan is attached. Complete all authorised reversible work and tests first; report any actual blocked final action and its specific source rather than requesting a general extra approval round.

## 18. R02 audit resolution and implementation precision

This section closes specific R01 gaps. It adds concrete contracts where R01 allowed materially different implementations. The existing scope and FAC-D decisions remain in force; more words alone are not evidence of completeness.

### 18.1 Audit findings and dispositions

These severities describe implementation risk in a planning document, not a demonstrated production vulnerability. All dispositions below are document changes; runtime acceptance remains pending.

| Audit ID | Priority | R01 gap / inspected evidence | R02 resolution |
|---|---|---|---|
| CS05-AUD01 | High | Mandatory FAC backfill conflicted with the original `identity_append_only` trigger. A trigger-code change would not resolve an existing null central reference. | Remove backfill from CS-05. Use an existing reference or correctly labelled canonical UUID. Preserve immutable identities; a future numbering contract is separate. |
| CS05-AUD02 | High | The create boundary was identified, but the existing detail GET envelope was not explicitly protected. | Retain legacy list/detail/create contracts; add rich reads on a distinct workspace/register route. |
| CS05-AUD03 | High | “Strict update” did not settle omitted fields, null clearing, merged applicability or no-op saves. | Define an explicit patch grammar, canonical merge/clear algorithm, atomic scopes and no-op outcome. |
| CS05-AUD04 | High | Original-operation recovery was described without acknowledging that `useCrmCommand` retains the original only in memory. | Specify honest in-session reconciliation and reload boundaries; no claim of durable/offline recovery. Never invent a new operation after an ambiguous result. |
| CS05-AUD05 | Medium | Existing `context-screens.tsx` labels parent relationships “Within” even though original parents are grouping only. | Correct existing Site/Organisation summaries along with new screens; use recorded relationship semantics consistently. |
| CS05-AUD06 | High | Save review bound the main record but did not fully define related-label/source freshness and a read-only preview transport. | Bind exact review dependencies and define same-origin POST preview with no operation/receipt/write. Save recomputes under native locks. |
| CS05-AUD07 | Medium | Source/date limits and numeric rules could be implemented by changing shared helpers and invalidating unrelated hashes. | Add dedicated CS-05 validators; preserve existing global helper behaviour and old command canonicalisation. |
| CS05-AUD08 | High | Existing Site-scoped permission granularity and hypothetical per-record visibility were mixed. | State the actual grant model, enforce it now, and apply any finer owning-source restrictions without pretending they already exist for Facility rows. |
| CS05-AUD09 | Medium | Concurrent loading, process-local cursor signatures and draft refresh ownership were underspecified. | Define request-generation protection, cursor-reset recovery and immutable saved baseline versus draft. |
| CS05-AUD10 | Medium | Dates, pin verification and old observation adoption lacked several exact transition cases. | Separate source dates, observed dates and server instants; reset stale pin reviews and require acknowledgement for older-context adoption. |
| CS05-AUD11 | High | Served-link lifecycle, canonical Asset versioning and unsupported Asset moves needed a clearer release boundary. | Use add/end events, one Asset version per membership mutation, safe foreign keys and current move rejection where moves remain unsupported. |
| CS05-AUD12 | Medium | Related work/document cards could become convincing placeholders for unsupported receiving integrations. | Require an explicit adapter inventory and distinguish supported-empty, unsupported, unavailable and stale states. |
| CS05-AUD13 | Medium | Sixty cases were useful but did not explicitly test several newly identified boundary failures. | Preserve T01–T60 and add T61–T80; organise evidence by risk and behaviour rather than passing a test-count target. |
| CS05-AUD14 | Medium | The prompt was long but still lacked precise slice handover, source manifests and incomplete-environment dispositions. | Add reusable checkpoint, evidence and completion rules so coding can continue across sessions without losing decisions. |

### 18.2 Confirmed facts, delivery decisions and deferred contracts

| Area | Confirmed source fact | R02 delivery decision | Future boundary |
|---|---|---|---|
| Facility identity | Stable UUID; original central identity is append-only and has no allocated FAC number. | Reuse reference if present; otherwise full UUID with safe visual abbreviation. | Shared reference-allocation enhancement. |
| Structure/use | FAC-D01–03 accepted the eight types, six uses and deliberate clearing rules. | Implement exactly, with explicitly identified bounded metadata refinements. | Wider controlled horticultural taxonomy. |
| Permission granularity | `scopeSql`/`hasPermission` use workspace/company/Site grants. Facilities in one permitted Site do not currently have separate Facility ACLs. | Enforce actual scope and every owning source/Asset capability; do not add a pretend per-row role model. | A genuinely approved finer-grained authority model. |
| Parent | Existing grouping and cycle/same-site protection; current UI wording overstates containment. | Correct wording; new physical-containment qualifier is an explicit CS-05 design decision. | Surveyed spatial topology or area unions. |
| Browser recovery | Current CRM hook is online, in-memory only. | Use its original-intent recovery while the page is alive; protect navigation and disclose the reload limit. | Durable command recovery under a separately accepted storage/authority contract. |
| E2 snapshot | Captured Facility ID/version/name; exact current permission checks on history. | Preserve that schema; no automatic historical rewrite or repricing. | Explicit versioned adoption of richer attributes in Estimating. |
| Maps | R03 provides sourced, deliberate link handoff and optional points. | Native optional Facility pin with confirmation; no provider SDK. | Survey/GIS and routing workflows. |

“Partial relationship visibility” cases in this specification mean restrictions imposed by the real owning service or future-compatible explicit operations. They do not claim that two Facilities in the same Site currently have different Facility ACLs. For the present implementation, prove site/company isolation and the actual independent source/Asset restrictions; do not invent grants solely to manufacture a test scenario. Where a future-specific case has no native fixture, record that limited applicability explicitly while still proving that add/end never performs a hidden full-set replacement.

### 18.3 Concrete HTTP integration map

Use the existing local/authenticated HTTP wrappers, same-origin checks and native failure envelope. Inspect the live routes first. The proposed new paths below are deliberately separated from the three legacy contracts; if an equivalent native route now exists, reuse it and record the mapping.

| Method / path | Contract |
|---|---|
| `GET /api/v1/facilities` | Existing generic read. Preserve envelope, recognised query keys and default behaviour. |
| `POST /api/v1/facilities` | Existing schema-version-1 identity/name/site/parent create; preserve its strict payload and hash semantics. |
| `GET /api/v1/facilities/[id]` | Existing envelope containing the basic Facility projection; preserve backward compatibility. |
| `GET /api/v1/facilities/register` | New richer server-side filters/sorts and richer rows. Reuse the native envelope or add explicitly documented pagination metadata without redefining the old GET. |
| `GET /api/v1/facilities/[id]/workspace` | Exact saved aggregate, capabilities, Site/path, source metadata and loading boundaries; may fetch related collections separately. |
| `POST /api/v1/facilities/create-details` | Rich create using the current common envelope and strict details object. |
| `POST /api/v1/facilities/[id]/revise` | One versioned Facility patch plus exact review acknowledgement. |
| `POST /api/v1/facilities/[id]/preview-change` | Read-only impact calculation. It is POST so a proposed record/source body is not exposed in URL history. No operation ID, receipt, audit mutation or outbox event is created. |
| `POST /api/v1/facilities/[id]/pin` | Versioned set/revise pin. |
| `POST /api/v1/facilities/[id]/pin/remove` | Versioned exact-point removal. |
| `POST /api/v1/assets/[id]/served-facilities/add` | Add one exact Asset-to-Facility association with source/reason. |
| `POST /api/v1/assets/[id]/served-facilities/[linkId]/end` | End one exact current association with retained history. |
| `GET /api/v1/operations/[id]` | Existing original receipt lookup; use the operation UUID, not record UUID. |

A nested `[linkId]` route must explicitly resolve and validate that parameter. The inspected generic `RouteContext` currently only types `id`; do not pretend the existing wrapper already supplies every nested parameter. Extend a typed route helper compatibly or write a small adapter that retains its authentication, origin, size, error and no-store behaviour.

The read-only preview route uses the same authenticated boundary and a bounded JSON parser. It requires read/edit authority for the target and all previewed sources; it must not be implemented with `commandRoute` expecting an accepted mutation receipt. Never put source notes or a complete draft in a query string.

### 18.4 Payload and mutation grammar

The inspected `common()` requires **`schema_version: 1`**, a valid operation UUID and a trimmed single-line reason of **1–1,000 characters**. Reuse it unchanged. The Facility rich payload is a new command contract under that envelope; it is not global schema version 2.

| Operation | Accepted top-level fields |
|---|---|
| Rich create | `schema_version`, `operation_id`, `reason`, `id`, `company_id`, `site_id`, `details` |
| Detail revision | `schema_version`, `operation_id`, `reason`, `expected_version`, `changes`, optional `review` |
| Change preview | `expected_version`, `changes`; no mutation envelope |
| Set pin | `schema_version`, `operation_id`, `reason`, `expected_version`, `pin`, optional `review` |
| Remove pin | `schema_version`, `operation_id`, `reason`, `expected_version`, `review` |
| Add service link | `schema_version`, `operation_id`, `reason`, `expected_version`, `facility_id`, `source` |
| End service link | `schema_version`, `operation_id`, `reason`, `expected_version`; Asset and link IDs come from the route |

The route ID is authoritative after UUID validation; duplicate body IDs are rejected when not part of the grammar. Workspace, actor, server timestamps, reference, receipt, lifecycle state and current saved version are never accepted as caller-controlled fields. New create `id` is a proposed canonical UUID under the existing native convention; identity collision fails rather than finding a same-named record to overwrite.

`details` and `changes` have a closed key set covering the fields in §6. Recommended key groups are `name`, `parent_facility_id`, `parent_relationship`, `on_site_position`, `location_source`, `structure_type`, `type_description`, `type_unknown_reason`, `use`, `crop`, `context_observed_on`, `season_label`, `context_source`, `footprint_m2`, `length_m`, `width_m`, `maximum_height_m`, `measurement_basis`, `measurement_observed_on`, `measurement_source`, `detail_notes`, and the applicable explicitly named structure fields. No `pin`, service-link array, Site/company reassignment or uncontrolled `custom_fields` object is accepted in a details revision.

Use separate structure-specific keys where vocabularies differ, such as greenhouse cladding, polytunnel cover and shade-house cover. Do not coerce a persisted Net cover value into a Shade cloth field merely because both controls are labelled Cover. One central schema maps all permitted keys, labels, applicability and validation limits for UI, preview and server.

A new Facility is accepted before its optional pin is edited. Offer Record pin from the saved record; do not secretly follow Create with a second mutation and present a partial result as one atomic save. A full form may explain that a pin is available after initial save without making location text or evidence compulsory.

For new CS-05-owned source inputs, use a closed union: a **Reported note** supplies kind, title, optional source date and bounded note; an **Existing source** supplies an exact supported source ID and version ID when its owner provides versioning. Resolve the existing source's labels/content and current access on the server. Do not trust caller-provided copies as authoritative source facts. An unversioned source must be labelled identity-only; no fabricated hash or version is accepted. Reuse an equivalent existing typed source contract when one exists. Provider lookup/upload is not implicitly enabled by allowing an Existing source reference.

Patch semantics:

1. An omitted optional key means **leave its current value unchanged**. Explicit null means **clear this optional value**. Required name/type cannot be null. New-create optional omissions become null.
2. Rich create and a rich details revision must explicitly choose a structure type, including choosing the same current type. Pin/service-link commands do not force a legacy Facility through unrelated classification.
3. Parse and normalise only supplied keys with dedicated CS-05 helpers. Merge them onto the locked saved aggregate. Do not pass absent keys through a shared helper that silently converts them to null.
4. Determine the final structure/use applicability. Reject any explicitly supplied non-null field that is inapplicable in that final state. A formerly applicable saved value inherited from the baseline is instead included in the clearing review.
5. Compute and preview the exact set of saved values that must become null. Only a matching reviewed save may apply those automatic clearings. Unrelated omitted fields remain untouched.
6. Evaluate context/source changes after normalisation. New observed date/source or changed use/crop/season is meaningful even when some labels remain the same. Unrelated detail-note edits do not create context observations.
7. If the normalised request makes no meaningful change, return `422 InvalidData` on `changes` with “There are no changes to save.” Do not consume a Facility version or create an accepted audit/outbox/receipt solely because a new reason was typed. UI Save remains disabled for such a no-op.
8. Apply the accepted aggregate change once, with one version increment and atomic audit/source/context effects. Checking for a prior accepted original always precedes mutation-only no-op/version/review checks.

Required paired transitions include clearing a parent together with its qualifier, selecting Other together with its description, selecting Unknown together with its reason, and changing use to Non-growing together with reviewed crop clearing. A source object is atomic: either omit it, deliberately clear it where allowed, or supply a complete valid proposed source; do not partially mutate an immutable source record.

### 18.5 Exact review contract and state transitions

The preview response has a target UUID/version, canonical proposed-content hash, exact before/after field rows, values to clear, required acknowledgements and current permitted dependency references. Dependencies include a selected parent/path label basis and any source versions actually shown in the review. The save sends a closed `review` object with those binding values and the accepted acknowledgement keys. A free-form array of arbitrary field names cannot authorise clearing.

Hash only a deterministic validated representation. Sort keys canonically and define array order for actual sets. Do not include volatile presentation strings, current clock time, generated request correlation IDs or random values in a content hash. Do not change the canonicalisation of issued legacy commands. Do not hash caller-supplied “before” values as a substitute for the locked saved state.

On save, recompute review and dependencies under the existing workspace/aggregate lock order. If the parent/name/path or selected source basis actually used in the comparison has changed, return a stale-review outcome and show a fresh permitted comparison. A changed permission or inaccessible source yields native unavailable handling without leaking an old label. Unrelated records not used in the review must not invalidate it.

Keep three independent client states: the last saved baseline, the current editable proposal, and the frozen submitted intent. Background refetch may update a latest-saved comparison but must not overwrite the draft or the submitted intent. Changing fields invalidates an earlier preview. While a submitted outcome is uncertain, edits cannot turn that frozen intent into a new payload under the same operation ID.

Pin transitions require their own precise basis:

- New coordinates begin Proposed. Choosing Confirmed is a deliberate review of the exact coordinates, check date and source.
- Any coordinate change invalidates previous confirmation and checked date. Changing the supporting source or check date also requires a fresh explicit confirmation basis; an old confirmed flag cannot attest to a different source.
- Editing unrelated Facility notes leaves the pin untouched.
- Removal acknowledges the exact current pin/version, not merely a generic delete checkbox.
- A fresh no-op pin save is rejected without a new version. An identical retry of an earlier accepted pin operation returns the original receipt.

Older observed-context adoption binds the previous observed date and proposed date/source in its acknowledgement. Both the earlier observation and later recorded acceptance remain visible in history. Historical source dates do not become effective production intervals. A blank existing date is unrecorded; it is never converted to today's date by loading a form.

### 18.6 Error, retry and reload outcomes

Preserve the inspected native error fields: `code`, `message`, `field_errors`, `correlation_id`, `retryable`. The shared mutation wrapper limits the JSON body to **65,536 bytes**; keep the new commands within that limit and apply equivalent bounds to preview. Do not raise global limits to accommodate unbounded history/source bodies.

| Outcome | Behaviour |
|---|---|
| `201` fresh create / `200` accepted replay or revision | Confirm receipt-backed acceptance, then refresh the current permitted projection. A failed refresh is “Saved; latest details could not be loaded”, not a failed save. |
| `422 InvalidData` | Keep the draft, show linked errors, no accepted effect. New edit after a definitive rejection gets a new operation ID. |
| `409 VersionConflict` | Keep the proposal, fetch permitted current state and review differences; never silently bump the expected version. |
| `409 OperationConflict` | The same operation ID was used for different content. Preserve diagnostic context and stop that submission; do not conceal it with an automatic new ID. |
| Stale review | Use a narrowly documented conflict code mapped to a new comparison; no partial write. |
| `401` / `403` / `404 RecordUnavailable` | Apply current identity/access handling. A receipt lookup's 404 can mean absent or hidden; it is not proof that a previous write failed. |
| Network interruption / retryable `503` / uncertain server failure | Keep the frozen original; reconcile its operation ID. Only the exact original may be resubmitted after an absent lookup. |

The inspected `useCrmCommand` uses a React ref for the pending original and explicitly states online memory only. It does not survive a forced page reload or closed tab. R02 does not add localStorage/IndexedDB persistence, a service-worker queue or a new offline-recovery contract. Do not promise that the proposal or pending original survives those events.

While saving or uncertain, use the existing navigation/before-unload guard and provide **Check original action**. While the original remains in memory, an absent/hidden receipt lookup may be followed only by resubmission of that exact original through the fully authorised command. Permission failure stays a failure; no new operation is invented.

If a reload has already discarded the original, reopen the exact saved record when its identity is known and inspect its permitted current/history state. Do not reconstruct an original operation from form values or names, or automatically create a replacement record. If the original operation UUID is available from an existing approved recovery surface, use its receipt lookup. Otherwise clearly state that the previous proposal/outcome could not be recovered and require deliberate review of saved records before starting a new action. This is a bounded limitation, not a successful recovery test. The implementation handover must state it.

Do not clear an accepted original merely because its subsequent detail refresh fails. Do not display “Saved” because a dialog closed, a request was sent or optimistic local state changed. Scope/identity clearing and original-result uncertainty are different states; clear sensitive data on denial while retaining only the non-sensitive error/support reference allowed by the native flow.

### 18.7 Query, refresh and projection discipline

The current generic page contract has default limit **50**, range **1–200**, search up to **200 characters**, and an actor/workspace/query-bound signed cursor. Its signing key is process-local. A restart can invalidate an old cursor; the UI should clear that cursor and issue a fresh first-page read with the same permitted filters. Do not report data loss, reuse the invalid cursor repeatedly or claim cross-instance cursor portability.

The rich register must explicitly document its chosen compatible limits and supported sort codes. Sort the entire authorised dataset on the server using a consistent normalised text/collation policy and UUID tie-breaker; specify nulls last and direction for each tuple. The keyset cursor includes the actual sort tuple, not just a UUID when sorting by name or updated time. Never fabricate a page number or total from a continuation token.

An exact UUID search must resolve a permitted Facility beyond the loaded page without prefix guessing. Matching only an abbreviated displayed UUID is not authoritative lookup. Search normalisation is defined once; do not strip accents from stored names or translate names into asserted external identities.

Use a monotonically increasing request generation or equivalent cancellation contract keyed to actor/workspace, route, exact Site, filters and selection. A slow response for Site A must not replace Site B's hierarchy or details. Parent picker responses also follow this rule. Ignore responses from a prior actor even if the route string happens to match.

Keep counted rows and context ancestors distinct. If permission means the complete count is unknown, say so without a hidden-count hint. Avoid constructing “Within unavailable parent” messages that reveal an otherwise inaccessible related identity; follow actual current scope/redaction rules.

A parent rename changes a current displayed path without automatically incrementing every descendant Facility version. E2 captures selected Facility IDs/names/versions, not complete ancestry or all measurements. Do not claim an ancestor rename automatically invalidates every descendant snapshot. Any expanded receiving snapshot is a separately versioned contract. In the current UI use **Grouped under** for the original grouping relation and **Within** only for explicit physical containment; apply the same projection to existing Customer/Site summaries.

### 18.8 Source model, related-data states and diagnostics

Before coding, list each source/related primitive the live application actually provides. The original `history_records` table has Site/optional Asset context and restricted history kinds; it is not already a general Facility change-event table. Reuse Facility `audit_events` for automatic change history where they hold the exact snapshots. If new typed observation/source child rows are needed, define their Facility ownership and immutability explicitly. Do not insert invented history kinds into the existing table or mark a local note as a provider document.

For a source owned by CS-05, store immutable identity, Facility/Site scope, source kind, title, note, source/observation date as applicable, recorded actor/instant and any exact provider/version reference. Inline reported notes are source records with Reported meaning, not Verified evidence. Correction creates a successor/replacement link and retains the original; editing current details does not mutate old source text. Source absence is allowed except where a specific confirmation requires a source.

Related adapters must declare: owner, exact relationship key, required capability/scope, pagination/count meaning, availability state and version/snapshot behaviour. Do not query an unrelated module's entire dataset and infer Facility relationships from text.

| Related state | Meaning |
|---|---|
| Loaded with zero rows | The supported relationship query completed for current permitted scope and found none. |
| Loaded with rows | Show exact role/relationship and open the owning record. |
| Loading | No zero-count or “not linked” claim yet. |
| Unavailable | A supported read failed or a required service is unavailable; retain the useful Facility view. |
| Unsupported | This owning relation is not implemented; say so plainly without an active dummy action. |
| Stale | Earlier loaded data remains visible only where current access is still valid, with refresh state identified. |

Use the existing correlation IDs and fixed failure categories for diagnostics. Do not log draft/source bodies, raw SQL, connection strings or hidden target names. Useful review evidence records command name, acceptance case, permitted synthetic IDs, versions, outcome and timing. Do not add broad analytics or a telemetry service to this module.

### 18.9 Visual implementation contract

At WP0 identify the actual shell/header, secondary menu, tab, table, dialog, choice/picker, record footer and inspector components that the module will reuse. Record their repository paths in the handover; do not leave “use existing components” as an unverified promise. If a shared component is unsuitable, state the specific limitation and implement a bounded extension with an adjacent-screen regression check.

Maintain a compact source manifest: file/path, source revision/commit, relevant role and whether it was inspected as code, rendered reference or owner-approved capture. Attach current before/after native captures to the review. A CSS token comparison is useful evidence but cannot prove geometry, legibility or focus behaviour.

Review the default register, filtered hierarchy, duplicate-name selection, full detail, conditional form, clearing comparison, conflict/uncertain state, pin dialog and related-equipment panel. Include long names, missing values, multi-line sources and narrow viewports. Do not select an unusually empty fixture to hide density problems.

Compare the shell and neighbouring established screen at the same viewport and browser zoom. Use actual logo/font assets. Record unresolved visual deviations specifically. “Looks professional” is not a pass criterion if controls are clipped, body text is tiny, tabs do not meet their panel or the table is boxed inside extra padded containers.

### 18.10 Work checkpoints, evidence and completion

The attachment is sufficient to start a coding chat. It does not justify skipping live repository reconciliation. Keep one working handover that survives a long implementation session and contains:

- Source HEAD, branch and latest checked candidate; uncommitted work that must be preserved.
- Implemented work package and next concrete step.
- Resolved code paths, command names, fields, owning capabilities and migration reservation.
- Any departure from the plan with its reason and evidence.
- Acceptance cases implemented/executed, actual outcomes and evidence locations.
- Current failure/blocker and the smallest next action that resolves it.

On session continuation read that checkpoint and the live diff before editing. Do not recreate completed migrations, duplicate fixtures or infer a pass from a previous session's intended command. Persist small reviewable slices; avoid a single unreviewable wholesale rewrite of shared context screens.

Use these completion states consistently: **Specified**, **Implemented**, **Verified on candidate**, **Owner reviewed**, **Deployed**. A document can be ready for implementation while every runtime case remains Not run. A candidate can be implemented but unverified in an environment without PostgreSQL/browser access. The handover must identify that exact limit and must not present it as a passed gate.

Define a local evidence record for each executed case with case ID, requirement/decision link, candidate commit, dataset, environment, command or manual procedure, result, artifact path and limitation. Existing evidence conventions take precedence over introducing a new tracking tool. A group test may support several cases only when its assertions actually prove each outcome.

Reconcile the API/DB and visual gates before considering CS-05 done. Required native delivery includes canonical create/edit/reload, useful registers/hierarchy, controlled changes/history, pin and service relationships, supported receiving reads, authority and recovery within the stated online boundary. Unsupported unrelated provider/workflows and future FAC numbering are declared boundaries, not reasons to leave a fake completed UI.


---

## Document assurance and revision note

R02 replaces the earlier r01 working documents. The earlier revision remains in file history. Both current documents were read in full before revision, and relevant source files were re-read at the checkpoint cited above. The review checked the eight-type/six-use taxonomy, current native API/envelope/validator and receipt contracts, append-only identities, workspace locking, online in-memory recovery, exact E2 snapshots and the migration registry through 0031. The audit resolves fourteen documented findings, preserves T01–T60 and adds T61–T80.

The plan and implementation prompt contain an identical delivery-contract body. All eighty CS05-T cases are prospective and each has an observable outcome/evidence layer; existing FAC-A and parent acceptance status is preserved. No application code, database, GitHub branch, PR or deployment was changed by this audit. Document checks cover consistency and structure; they are not runtime tests. The prompt can be attached by itself. Correct implementation still requires its source reconciliation and acceptance work. Native visual/device review and runtime tests remain implementation work.

**Contract SHA-256:** `ec4be2a880eb33135209001a1bd96f2f00fd656e654f12b873cefb9cf3b83b1f`  
**Companion:** `PPO-CS-05-Facilities-and-Growing-Areas-VS-Code-Implementation-Prompt-r02.md`
