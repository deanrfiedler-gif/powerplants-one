# Customers, Sites & Growing Areas Workspace

**Revision:** r01 · **Date:** 15 September 2026 · **Owner:** Dean Fiedler · **State:** Authorised standalone design delivered for review; browser visual acceptance and application integration pending.

The user instructed development of the recommended Customers, Sites & Growing Areas Workspace, starting with CS-04 and CS-05, using the PPO theme board and the refined navigation/dropdown patterns. The approved demonstration includes one organisation, two addressed sites, all six horticultural facility examples, one pump installed in a shed serving several growing areas, and contextual sourced assistance. This is a design deliverable under PPO-009 / CRM-01/04/08, not a new business approval or a completed runtime acceptance case.

[Open the HTML](../reference/ui/customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html) · [Model and DOM-emulation check](../../scripts/check-customers-sites-design.mjs) · [Exact check evidence](../testing/evidence/customers-sites-workspace-r01.json).

## Sources and current-code reconciliation

- Main was refreshed at `dcabfec1b5cde1c2cf220359e6cf1c63408512d6`, tree `39f462560154914360a93f71779ce8b68b9fc28b`. Equipment r01 is merged. The older main-head snapshot in STATUS is not used as current repository truth.
- Equipment r02 remains a separate open PR #192, inspected at `8535acd9e5909a0dff5f6ccde752bad6087ef1e6`. The workspace links that exact design reference and explicitly labels its synthetic fixture as separate. It does not pretend to resolve the new pump in the application or in Equipment r02.
- Existing customer context already has organisation details, site summaries and a Sites hierarchy. This design builds on those concepts rather than classifying customer runtime as absent. Sources include [BP-03](../blueprints/BP-03-crm.md), the [shared data dictionary](../contracts/service-data-dictionary.md), [approved facility fields](facility-field-proposal.md), and the [shared UI specification](../standards/ui-style-specification.md).
- The conversation's coverage register r06 carries r04 scope content. Its CS-01/02, CS-04/05/06 and EQ-03 references organise this work; this deliverable does not reclassify every register entry as implemented. CS-03/07 are not claimed complete. CS-08 remains the next extension.
- The actual supplied `powerplants-one-theme-style-board-r18(2).html` was inspected locally, not inferred from the attachment label. SHA-256: `e55ccbabef40a0b07a95ee5847f99147a8f29e8f7c84f90497df2b4d5e6696ab`. The older r16 copy was not used as the theme source. The later user-provided r18 components control this standalone design where older repository guidance differs.
- Publication reconciliation: main advanced to `64574208ca604fee381e45c1b7db1b2b03c1dc8b`, tree `ec43a7ca4373ff233bb58632f34a7f6b3d0f7a1f`, through the merge of naming/SharePoint #190. The design branch was rebased; both workstreams' document-register entries and status updates were retained. Naming standard r04 Section 24 was inspected: its explicit organisation/site/facility/area/equipment metadata boundary is consistent with this design. No live filing or communication action is added.
- The existing plain HTML/CSS/JavaScript design pattern is retained. No framework, package, server, migration, API, adapter, environment or hosting change is introduced. Naming/SharePoint #190 is now merged; Excel estimate-import #191 remains a separate workstream.

## Connected views and behaviour

| View | Register coverage | Delivered design behaviour |
|---|---|---|
| Customer overview | CS-01 / CS-02 | Fictional organisation, legal name, relationship owner, relevant contacts, separate site-party meanings, two site links and scoped counts. No new customer or ERP-account editor. |
| Site workspace | CS-04 | Two distinct addressed sites, exact IDs, IANA timezone, site contact, read-only access/delivery/visit detail, site-party roles, versioned site-information edit, source inspection and site change history. Site switching scopes every primary view. |
| Facilities and growing areas | CS-05 | Hierarchy and indicative site plan; search by name/crop/reference and structure filter; create/edit; separate structure/use/crop; optional same-site parent; conditional details; footprint; approximate dimensions; on-site position; retained before/after history. |
| Equipment relationships | CS-05 / EQ-03 | One stable pump identity, one installation location, separate served-area links, editable same-site service relationships, immutable source successors and link to the exact Equipment r02 design. Equipment creation, relocation, inspections and service history remain Equipment work. |
| Site and area readiness | CS-06 | Biosecurity, induction, crop access and shutdown information; fixed explicit scopes; responsible contacts; exact source records; review dates evaluated against a chosen visit date; source review creates a successor. Missing scoped categories are surfaced without inheriting parent or sibling clearance. |
| Contextual assistance | Cross-cutting | Scripted site summary, information-gap review and visit brief. Site or facility context, inspectable frozen sources, owned missing information and source-inclusive copy/download. No model service, live source retrieval, automatic updates, communications or booking. |

The main fictional grower is **Willowbank Horticulture**. Its **Nursery & propagation** site contains Greenhouse 01, Tunnel 01, Propagation House 01, nested Propagation Bay A, Pack Room 01, Irrigation Shed 01 and Irrigation Block 01. **Field production** contains Irrigation Block 02 / Field and Tunnel 02. The two addresses, people, email addresses and all asset information are fabricated. `.example` email addresses are displayed as fictional contact context and are not send actions.

Pump `SYN-PPO-AST-000501` is installed in Irrigation Shed 01 and initially serves Greenhouse 01, Tunnel 01 and Propagation House 01. These are links to one Asset, not three duplicate assets and not parent-child equipment containment. Served facilities may also be non-growing support facilities; structure/use changes keep existing relationships and call for applicability review. A service grouping is not itself a physical irrigation block.

## Facility policy fidelity and proposed extensions

FAC-D01–03 are retained: controlled type vocabulary, separate use/crop, Other description, Unknown reason, explicit unknown optional values, same-site parent graph guards, immutable site within the facility editor, positive decimal m² with at most two places, bounded conditional counts, and no automatic footprint roll-up. Greenhouse includes propagation houses by use. Packing and pump/equipment rooms remain non-growing facilities without a crop requirement.

Type/use changes show the exact saved values that become inapplicable. Save requires a reason and explicit confirmation to clear those values in the same local revision as the before/after history. Cancel leaves the saved record unchanged. Switching back does not silently recover cleared historic fields. Names can repeat while UUIDs/references remain separate.

Approximate length, width, maximum height, a measurement source/date note, and descriptive on-site position extend the approved footprint field for this design only. They are optional, independently recorded and never calculate footprint, loads, capacity, design suitability or compliance. Structured units/source contracts and runtime adoption of these additional fields remain receiving decisions. The site plan is an illustrative starter layout, not GIS, a survey or a map editor; new/nested/unmapped records remain accessible in the hierarchy.

Organisation ownership is not copied onto Facility. Site parties show Operator, Owner and Billing party separately; unrecorded property ownership remains explicit. Effective party amendment and real ERP authority are outside this editor. Site address changes preserve previous source and history rather than rewriting prior context.

## Readiness and assistance boundaries

“Current source” means the record's review date has not passed for the chosen visit date. It is not Ready, inducted, safe to enter, dispatched or shutdown-approved. A Not applicable rationale also needs a current review date. Missing information remains distinct from overdue information. Requirement scope is fixed to the site or explicitly listed facilities; scope creation/amendment is deferred in r01.

Site-wide requirements may apply generally. An individual facility never inherits an adjacent or parent area's permission. Where no applicable crop-access or shutdown record exists, the workspace names the gap and site contact instead of manufacturing an affirmative clearance. Pesticide re-entry intervals, chemical records and operational procedures are not invented.

Assistant responses use deterministic templates over the selected synthetic context. Every factual context section has inspectable retained source content, including exact local facility/scope query snapshots where an absence is reported. Downloads contain the draft and the cited source bodies. They are a starting point for human review, not generated operational instructions. Copy uses the clipboard when available and otherwise selects the visible text for manual copying. Nothing is sent externally.

## Theme, interaction and local persistence

The HTML embeds the supplied r18 board's 39 core tokens, all three Roboto font faces, the exact compact PPO symbol on navy, and the shell's line icons. Typography, controls, cards and decision dialogs use the source scale and radii. The sidebar has a spacious brand header, five concise navigation choices, independent desktop navigation scrolling and a mobile menu. The supplied compact symbol is reused; no new logo is drawn.

Choice cards use r18's 14 px container corners, 1 px border, 7 px inset, exact layered shadow and 7 px option rows. They measure natural height after width, choose above/below placement, clamp to viewport gutters and use internal scrolling. Menu panels stay inside their open dialog's top-layer context. Arrow keys, Home/End, typeahead, Enter, Space, Escape, Tab and outside dismissal are implemented. Form drawers use the board's bottom-corner treatment and inspection drawers remain square.

Explicit local saves use a versioned browser-storage object and preserve prior record/source snapshots. Record version and changed-tab generation checks refuse detected stale writes while retaining the draft. This is not an atomic multi-user transaction or server receipt implementation: simultaneous localStorage read/write races are not solved by this design. Actual runtime must reuse the approved server transaction, command receipt, author, permission and audit contracts.

Malformed retained storage is left intact and can be exported. Storage refusal/quota failure is shown as session-only data with an export path, never as durable server success. Reset requires an explicit destructive confirmation. Backup export is limited to the Coordinator demo view; there is no import workflow in this increment. A Nursery-only viewer scenario clears dialogs and exposes only its scoped navigation, contacts/counts and disabled editors. The HTML still embeds all fixtures and is inspectable; this scenario is not a security boundary or an offline-access grant.

## Verification and remaining acceptance

The committed check runs **49 model and DOM-emulation groups** using optional jsdom 27.0.1 outside application dependencies. It covers fixture identities, the six examples, both-site navigation, read-only site details, hierarchy/filter/map record resolution, field boundaries, graph guards, unknowns, duplicate names, type/crop clearing and cancellation, exact history, asset relationships, readiness scopes/dates, source successors, site-address preservation, scoped assistance, viewer presentation, changed-tab refusal, reload, corrupt storage, storage failure, escaped text, unique IDs, theme tokens and keyboard/menu logic. Menu geometry uses explicitly synthetic rectangles and scroll heights.

Run with an installed optional jsdom module:

```sh
PPO_DESIGN_JSDOM_MODULE=/absolute/path/to/jsdom/lib/api.js node scripts/check-customers-sites-design.mjs
```

The path override is converted through `pathToFileURL`; native Windows paths can also be supplied through the environment. `--write-evidence` records the current artifact hash and actual group results. Evidence contains no real customer data.

A native browser URL was rejected by the authoring environment's access policy in the preceding workspace work. It was not bypassed with another URL, renderer or hosting surface. Therefore **no rendered screenshot, real browser layout, native focus trap, clipboard/download execution, phone, print, accessibility or owner visual acceptance is claimed**. jsdom stubs native dialog and scroll methods; its measurements are not screenshots. The actual r18 source treatment is present, but visual approval remains a review task.

The first check run reached 35 passing groups then found that the CSS-token assurance did not see the site-plan's inline coordinate variables. Explicit map-variable defaults were added and the complete checks rerun. No product assertion was removed. Subsequent scoped-readiness, menu and read-only site-detail cases bring the final run to 49 passing groups.

Repository documentation assurance also passed: `check_foundation.py` (2,017 local links), `check_prototype.py` (78 parent dispositions preserved), `check_naming.py` (175 document records), and `git diff --check`. These remain documentation consistency checks.

These groups do not pass FAC-A01–07, MC-A, master AT/PT cases, backend validation, negative-authorisation, lost-response reconciliation, database concurrency or restart acceptance. The existing application is unchanged. Application CI may run for the PR; its results must be assessed separately from this standalone evidence.

## Next increments

1. Owner review of the actual HTML at desktop and 390/320 px widths, normal zoom, keyboard-only navigation, open dropdowns near every viewport edge and native modal focus. Record rendered evidence before claiming visual acceptance.
2. CS-08 site-survey capture: owned capture tasks, dimensions with explicit units and evidence/source dates, photos/annotations, uncertain coordinates, review/acceptance and exact current-to-reviewed snapshot handling.
3. Runtime receiving contract: reuse current scoped shared reads/commands and server-derived identity, history and receipts. Reconcile actual-main Facility implementation, decide approximate-dimension fields, preserve source originals, and verify FAC-A cases through the database, HTTP and real browser.
4. Explicit location receiving references for Equipment, Estimating, Projects and Service. Define field-level scope junctions and immutable work/estimate snapshots rather than copying notes or treating this design link as live integration.
5. Service Agreements & Maintenance as the next substantial module after the survey extension. Effective party changes, facility archive/move, GIS, crop cycles, source-document storage, broad CRM account management and customer portal rights remain separate scope.
