# Customers, Sites & Growing Areas — r02 audit

**Date:** 15 September 2026 · **Owner:** Dean Fiedler · **Scope:** audit and refine the standalone HTML; align it with the supplied r20 theme; remove the application shell and left rail. **Outcome:** 18 findings addressed in r02. Remaining product extensions and native visual acceptance are recorded separately below.

[Revised HTML](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r02.html) · [Current design handover](customers-sites-workspace-design.md) · [Retained r01](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html) · [72 model/DOM check results](../testing/evidence/customers-sites-workspace-r02.json).

## Overall assessment

R01 established the right commercial horticulture model: an organisation can operate multiple addressed sites; facilities and growing areas retain exact site identity; structure, use and crop have separate meanings; one pump can be physically installed in a shed while serving multiple areas. These foundations are retained.

The audit found genuine interaction and data-validation gaps, as well as opportunities to simplify the presentation. The current deliverable is a **workspace-only r02**. Its horizontal tabs are local views of this customer/location workspace, not global application navigation. The left rail, brand masthead, global breadcrumb, synthetic identity footer and app status strip are removed. Related equipment and visit requirements remain contextual views because they are necessary to understand the selected location.

The supplied r20 board is the controlling reference for this refinement. Its Intake profile suits this data/form workspace; its navy primary actions, green context accents, local navigation, modeless inspection, selection rules and source-freshness guidance inform the implementation. Source profiles are not averaged into an invented universal palette.

## Sources and repository reconciliation

| Source | Inspected basis / implication |
|---|---|
| Current repository | `main` `64574208ca604fee381e45c1b7db1b2b03c1dc8b`; tree `ec43a7ca4373ff233bb58632f34a7f6b3d0f7a1f`. Refreshed again before publication. Naming/SharePoint #190 is merged. |
| R01 review package | PR #193 head `0e5f26d0757a3c2ed21f4871227e70c41c1e0b35`; tree `6cb3cdb2cb3eb3b64651ef7decf73da3f740413f`. The original HTML is retained unchanged. |
| Theme attachment | Actual local `powerplants-one-theme-style-board-r20(2).html`, title **Powerplants One — Theme & Style Board · r20**, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The attachment itself is not edited. |
| Theme source profiles | `board-data.tokens.intake`; shared board typography/geometry; page-layout r20 record context, hierarchy and selection rules; shared choice-card and modeless panel guidance. The board itself describes its newer compositions as proposals with native acceptance outstanding. |
| CRM policy | [BP-03](../blueprints/BP-03-crm.md): distinct organisation, person, site, facility/equipment and site-party relationships; permission-scoped reads/counts; source preservation and no inferred billing authority. |
| Approved facility policy | [FAC-D01–03](facility-field-proposal.md): structure/use/crop vocabulary, incomplete context, conditional values, same-site parents, positive m² and deliberate clearing with history. |
| Current runtime | [Shared commands](../../src/shared/commands.ts) still create Facility identity/name/site/optional parent; this audit does not mistake the HTML's richer taxonomy and dimensions for current application persistence. [Shared data dictionary](../contracts/service-data-dictionary.md) retains SiteParty and Asset relationships. |
| Naming / document context | [PPO-STD-001 r04](../standards/naming-conventions.md), particularly Section 24: stable references and exact context; documents may serve multiple records; no compulsory folder path through every horticultural level. |
| Adjacent work | Equipment r02 #192, Excel import #191 and MYOB handbook #194 were open at the inspected checkpoint. Their runtime/provider work is not absorbed into this HTML. |

The user's explicit instruction to omit the shell takes precedence over generic board guidance to embed modules in the application frame. The workspace still follows the board's module content and interaction patterns.

## Findings and applied refinements

“High” means a material context, information-integrity or missing-journey issue in the local prototype; it does not assert a production security incident. “Medium” means a meaningful usability or alignment gap. No percentage of app completion is inferred.

| ID | Priority | R01 finding | R02 disposition |
|---|---|---|---|
| CS-A01 | High · user direction | The HTML included an app-wide left rail, brand header, breadcrumb and status chrome. This exceeded the user's requested workspace-only composition. | Removed the shell. One workspace heading, selected organisation/site context and five local tabs remain. No recreated logo or global navigation is included. |
| CS-A02 | High · theme | R01 used r18 and green-filled primary buttons. R20 explicitly uses white text on navy primary actions, with green for active context. | Uses the actual supplied r20 Intake profile, source fonts, navy actions, green tab/selection accents and shared geometry. Buttons are not merely relabelled as r20. |
| CS-A03 | Medium | Inspection and Assistant were modal, and several docked dialogs could remain open together. This obstructed the workspace and did not match r20's shared modeless dock. | Record inspection and Assistant share one modeless dock. Forms, focused source reading and explicit decisions retain modal handling. Closing restores a valid control even if the original trigger was rerendered. |
| CS-A04 | High | Selecting an area in Visit requirements and using its primary Assistant action broadened the response to the whole site. The r01 reproduction selected Propagation Bay A/Tunnel 01 but the Assistant subtitle identified only the site. | The same area context now flows to Assistant. Opening Assistant from an inspected facility carries that exact record. Current scope remains visible in the panel and exported draft. |
| CS-A05 | High | Readiness narrative used current requirement fields while some citations pointed only to the separate evidence note. After edits, that note alone might not support the displayed owner, review date or applicability. | Readiness citations freeze both the exact requirement and its source body. Local query snapshots support statements about missing scoped records. |
| CS-A06 | High | The retained-data validator accepted an invalid source date, `history: [null]`, duplicate readiness IDs and a negative asset version. These were reproduced directly against r01. | Whole-state validation rejects malformed histories/dates/versions, duplicate or missing stable IDs, invalid source relationships and mutation of original source content. Invalid stored data remains available for recovery and is not silently overwritten. |
| CS-A07 | High | Missing area-specific crop-access/shutdown information was identified, but there was no action to add a requirement to resolve the gap. | Added an owned requirement form with category, exact site/area scope, status, source title/date/excerpt, review date and reason. New records retain stable identity and history. |
| CS-A08 | Medium | Readiness applicability was fixed, preventing a useful review when a requirement applied to a different set of areas. | Existing category/scope amendments show exact before/after scope and require explicit confirmation. Cancelling retains both the saved record and the reviewable proposal. No parent, child or sibling clearance is inferred. |
| CS-A09 | Medium | Exported backups had no restoration journey. | Added bounded JSON validation, a counts preview, explicit replacement review and a fresh storage-basis check. Invalid/cancelled/stale restores do not change the current example. R01 saved examples can be read without altering their original storage key. |
| CS-A10 | Medium | Clear filters appeared only in the empty state, so a non-empty narrowed result had no direct clear action. | Added an independent Clear control whenever a search or structure filter is active. Result counts update with the displayed hierarchy. |
| CS-A11 | Medium | Hierarchy nesting used one generic child indent and lacked expand/collapse. | Added depth-aware indentation, collapsible parents and descendant discovery during search. Full location path remains available in inspection; long paths are visually bounded without removing their accessible text. |
| CS-A12 | Medium | Repeated facility names were permitted but not distinguished clearly in the list. | Each row displays its permanent SYN-PPO-FAC reference. Current inspected selection is visible. Filtering out or collapsing away a selected row clears its inspection/Assistant context. |
| CS-A13 | Medium | History was mainly a JSON before/after dump. | Added readable field-level Before/After summaries for names, taxonomy, dimensions, location, contacts, requirements, sources and relationships. Exact JSON remains available in a collapsed disclosure. |
| CS-A14 | Medium | Draft text flattened headings and paragraphs into one dense block. | Downloads/copy retain section breaks, list entries, selected site/area identity and exact source bodies. Filenames use the selected stable site reference and draft purpose. |
| CS-A15 | High | A changed-tab signal could leave an older Assistant draft available for regeneration/export against stale in-memory records. | The draft is marked stale. Regeneration, copy and download are refused until saved data is reloaded/refreshed. The earlier draft remains inspectable. This is a local freshness guard, not a multi-user transaction guarantee. |
| CS-A16 | Medium | Some field descriptions were not programmatically associated; validation lacked links to the exact failing control. | Added linked error summaries, field/hint associations and focus routing to the enhanced select trigger. Local tabs support arrow/Home/End focus and labelled panels. Native screen-reader/device acceptance remains unverified. |
| CS-A17 | Medium | Site telephone was shown as missing but could not be recorded through the site editor. | Added an optional site telephone field with source/history retention. Blank remains Not recorded; contact identity is not rewritten. |
| CS-A18 | Low · professionalism | Business screens contained development-oriented links and explanations, with repeated title/context and limited long-content handling. | Removed repository/design links from the equipment business view, shortened the workspace framing, aligned spacing/type hierarchy, wrapped long names/references and placed preview/recovery information behind Workspace information. |

## Commercial horticulture alignment

| User's facility example | Representation retained in r02 | Why the distinction matters |
|---|---|---|
| Greenhouse | Structure: Greenhouse; use/crop/cladding/bay count separate | Crops can change without changing physical identity. |
| Tunnel | Structure: Polytunnel; cover and tunnel count | A tunnel is not treated as a greenhouse bay or automatically as an Asset. |
| Propagation House | Greenhouse structure with Propagation use; optional nested bay | Propagation describes the activity rather than a new structural taxonomy. |
| Pack Room | Non-growing facility; Packing function; Non-growing use | Does not demand an irrelevant crop field. |
| Irrigation Block / Field | Open growing area; Containers or Rows layout | Physical outdoor areas remain distinct from service/control groupings. |
| Irrigation Shed | Non-growing facility; Pump/equipment room function | Equipment has an installed location independent of the areas it serves. |

The demonstration remains one organisation, two distinct addressed sites and nine facilities/areas. Pump `SYN-PPO-AST-000501` is one record, installed in Irrigation Shed 01 and initially serving three growing areas. Operator, property owner and billing party remain separate SiteParty meanings. Property ownership and ERP linkage are not invented.

Footprint is separately recorded in m²; optional approximate length/width/height do not calculate it. Parent and child footprints may overlap, so no automatic site total is presented. Indicative map rectangles are not cadastral/GIS or irrigation-design evidence. New/unmapped/nested records remain accessible through the hierarchy.

Readiness labels concern the quality and review date of information. They do not certify induction, entry, chemical re-entry, isolation, shutdown, dispatch or attendance. “Not applicable” also requires a current review basis. The HTML contains no invented pesticide intervals or operating instructions.

## Theme mapping

| Element | Applied r20 basis |
|---|---|
| Colours | All 41 Intake source tokens, plus shared font/radius/shadow entries: 47 resolved keys. Distinct Deals/Product profile values are not averaged. |
| Typography | Three embedded source Roboto faces; 24 px workspace title, 20 px current view/detail title, 18 px sections, 14 px body, 12–13 px supporting/form text and 16 px phone inputs. |
| Actions / selection | White on navy for primary actions. Green underlines and selected-context accents. Status colour remains paired with text. |
| Geometry | 6 px controls, 7 px record cards, 10 px focused dialogs; 14 px choice cards with 7 px inset/rows and the shared layered shadow. |
| Composition | One main content scroll, sticky local context/tabs, flexible content and 292 px support column; support stacks on narrower widths. No application rail. |
| Panels | One active modeless record/Assistant dock. Editable forms and explicit decisions use modal context; choice cards remain inside their owning dialog. |
| Responsive content | Local tabs can scroll horizontally; short landscape screens release sticky context; names/references wrap; phone forms stack; source/history content does not rely on fixed height. |

The source-asset and HTML hashes are retained in metadata/evidence. These source comparisons and DOM checks establish implementation alignment, not rendered visual certification.

## Remaining gaps and expansion opportunities

These are explicit future boundaries, not functions silently represented as complete in r02.

| Priority / follow-on | Remaining work | Recommended handling |
|---|---|---|
| Next extension: CS-08 | Survey tasks, measured dimensions with evidence/date/units, photo/annotation capture, uncertain location and reviewed site-plan updates | Build as a dedicated extension of this workspace; retain original capture and later review separately. |
| Broader CS-01/02/04 | Organisation/contact CRUD, adding/archiving sites, address quality/duplicate review and effective site-party changes | Connect to the existing CRM/shared commands. Preserve legal/billing and site-location distinctions. The current demonstration deliberately has one grower and two starter sites. |
| Facility lifecycle | Controlled archive, cross-site move, effects on equipment, scope references and historic records | Requires a reviewed receiving contract. Editing a Facility here cannot silently move its site or erase historic work context. |
| Source documents | Authorised SharePoint retrieval/upload, document permissions and exact version binding | Reuse the merged naming/SharePoint package. Local source excerpts are demonstrations, not provider documents. |
| Native receiving integration | Facility context in Equipment, Estimating, Projects and Service; exact work/estimate snapshots | Reconcile actual main and approved Facility fields before introducing migrations/API/output changes. A design page is not runtime evidence. |
| Readiness policy | Operational applicability rules, individual induction evidence, work-specific crop/shutdown decisions and owned review workflows | Use the actual Service/planning authority and evidence. A current date on a note cannot replace work-specific clearance. |
| Multi-user / offline | Server permissions, atomic concurrency, original-operation receipts, durable offline authority and recovery | Required at application integration. Browser localStorage and a read-only presentation scenario are not these controls. |
| Visual / accessibility acceptance | Rendered desktop/phone/short-height layouts, native dialogs/focus, screen reader, touch, clipboard/download, print and zoom | Execute on an authorised native browser/device surface before recording visual acceptance. |
| Next substantial module | Service Agreements & Maintenance | Follow the survey/location foundation rather than enlarging this workspace into unrelated app modules. |

## Verification and evidence limits

The r02 check runs **72 model/DOM-emulation groups**: the retained 49 r01 behaviour groups plus 23 audit-driven groups for composition, local tabs, hierarchy collapse/search, filtered selection, one modeless dock, exact Assistant area, requirement/source snapshots, readable output, new requirement capture, scope comparison/cancel/confirm, linked validation, malformed-state rejection, original-source preservation, telephone/history, backup preview/cancel/restore/stale refusal and stale Assistant output.

The original four validation defects and incorrect area Assistant scope were reproduced against r01 before correction. New checks also exposed the absence of a Clear control for non-empty filtered results; that control was added. The CSS-variable check prompted explicit hierarchy-depth defaults. No failing product assertion was removed to obtain a pass.

Direct source comparison confirmed all 41 Intake tokens and all three embedded font faces match the supplied r20 board. Foundation checks passed with 2,033 local links; naming checks passed with 177 document records; prototype checks retained all 78 parent requirement dispositions. Whitespace checks also passed.

The test uses optional jsdom 27.0.1 outside application dependencies. Native `show`, `showModal`, scrolling and menu rectangles are simulated. FileReader-based backup validation/preview/restore is exercised in DOM emulation. No clipboard, actual downloaded file, browser rendering, physical device, backend, database or server authorisation result is claimed.

The environment previously rejected native local-HTML preview through its browser URL security policy. This was not bypassed with an alternative URL, renderer or hosting surface. Consequently visual polish is based on the directly inspected r20 source, responsive CSS and interaction checks; a screenshot or 100% visual-acceptance claim would be unsupported.

R01 SHA-256 remains `4d7fcff923005ac9ac30f011799d82cf1c17b19ad623e3ef319442270e6890b8`. The current r02 artifact hash is in the [test evidence](../testing/evidence/customers-sites-workspace-r02.json). All source, decision, requirement and master AT/PT acceptance boundaries remain intact.
