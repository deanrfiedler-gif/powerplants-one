---
document_id: PPO-SUPPLIER-PRICING-REPORT
title: Supplier Pricing and Cost Sources — Detailed Design Report
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Proposed standalone design; owner acceptance and application integration separate
source_commit: d565a9de01b94aa7ad3fffe3a996f78c3aee589b
---

# Supplier Pricing & Cost Sources

## 1. Executive overview

This package provides a complete standalone design for maintaining supplier price evidence and reviewing how proposed changes would affect an estimate. Its central question is: **Where did this cost come from, is it still valid, and what would change if we refreshed it?**

The [interactive HTML](PPO-Supplier-Pricing-and-Cost-Sources-r01.html) contains five connected views: Supplier price sources, Source detail, Price-change review, Estimate cost review and Refresh impact. It includes authored supplier extracts, different currencies and units, quantity breaks, source review decisions, exact historical cost snapshots and a deliberately incomplete estimate. Users can prepare and edit a source draft, submit its exact revision, record an independent review and create a separate estimate draft from selected eligible changes.

The module covers **PD-03 — Price books and supplier-source maintenance** and the connected **ES-03 — Cost-source and supplier-price review** from the HTML page coverage register. It uses the existing Products catalogue as its product context and prepares cost evidence for the later ES-04 estimate review and pricing-exception workspace.

The deliverable is a synthetic design, not a live catalogue or an application release. MYOB Acumatica remains the intended ERP authority. SharePoint remains the intended business-document repository. This file neither reads nor writes those systems. Successful source review does not approve a commercial estimate, publish prices or issue a quotation.

## 2. Authority, scope and traceability

Dean authorised this build after the five-view recommendation, including a professional companion Markdown report and alignment to the Powerplants One theme. The package creates an independently reviewable HTML module without introducing application routes, database changes, frameworks or external services.

| Reference | Contribution to this design |
|---|---|
| [Page coverage register r06](../module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | PD-03 supplier versions, currency, validity and reviewed changes; ES-03 source provenance, FX, freight, commissioning and deliberate refresh. |
| [BP-04 estimating blueprint](../../../blueprints/BP-04-estimating-quotation.md), section 7 | Explicit cost provenance, unknown amounts, retained source revisions, declared arithmetic, no duplicate freight and successor-only refresh. Operational costing decisions remain open. |
| [Estimating screen specification](../../../blueprints/estimating-screen-specification.md) | Saved versus proposed totals, ownership, source dates, retained input, readable phone cost cards and internal cost visibility. Its historical ES screen numbers differ from the coverage register's page identifiers. |
| [Products catalogue r04](../products/PPO-Products-Preview-r04.html) | Existing catalogue/product context; this module extends supplier-source review rather than replacing technical product detail. |
| [Theme board r20](../theme-style-board/powerplants-one-theme-style-board-r20.html) | Register, detail, guided form and comparison composition; neutral cards, Roboto, navy controls, green selection and docked snapshots. |
| [Shared UI specification](../../../standards/ui-style-specification.md) | Source/evidence distinctions, keyboard feedback, responsive layout, readable monetary values and preservation of domain controls. |
| [Naming standard](../../../standards/naming-conventions.md) | Local synthetic references remain distinct from governed record types, external IDs and production identity. |

Main was inspected at `d565a9de01b94aa7ad3fffe3a996f78c3aee589b` and the contribution was subsequently reconciled onto `e1b705acc5457dab6fc0b6a2f0c977132cbd2215`, preserving the newly merged modules. Existing parent requirement IDs are preserved. Principal estimating links are EST-04 cost provenance, EST-05 price/precision/refresh and EST-07 distinct approval authority. Product source evidence also supports the PD family links to SCM-02, ENG-05 and DOC-04 without claiming their acceptance.

`PD-03` and `ES-03` here are coverage-register page identifiers. They must not be confused with parent requirement numbers or older screen-specification numbering. The design does not redefine either register.

## 3. Design composition and navigation

The workspace is a module interior intended to sit inside the existing PPO application shell. It does not duplicate the global rail, logo, search, help or notifications. A clear module heading, short purpose statement and synthetic-preview badge lead the page. A shared context strip identifies the demonstration company and AUD estimate context, and exposes the local preview role.

Five tabs retain the current module context. Desktop tabs remain visible with the context strip; on phones the row scrolls horizontally while content stacks vertically. Tab buttons expose selected state and support Left/Right, Home and End keyboard navigation. View changes return the viewport to the heading without placing it behind sticky navigation.

A right-side source snapshot offers the concise supplier basis and an **Open full source** action. It uses a native modal dialog so focus remains inside the open panel. At narrow phone widths it fills the viewport. Escape closes the panel and the browser returns focus to the invoking control. Other tasks use focused dialogs for source editing, source decisions, evidence inspection and successor creation.

## 4. Supplier price sources

This is the starting register. Eight supplier sources cover Screen Systems, Irrigation, Climate, Sensors and Logistics. The register identifies source name, supplier, product reference, current revision, product family, original currency/unit cost, validity, latest proposed revision and an appropriate next action.

Four overview cards show source count, revisions awaiting review, sources needing attention and estimate lines with eligible updates. They count different things deliberately: source problems are counted once per source, while eligible updates are counted at estimate-line level. No total is calculated across EUR, USD and AUD supplier prices.

Search matches source names, supplier names, product references and current document references. The status filter supports all sources, needs attention, awaiting review and source checks complete. Clearing filters restores the complete register. A no-results state explains how to recover instead of suggesting the underlying catalogue is empty.

Clicking a source name opens its snapshot. **Review change** navigates to that exact proposed revision; sources without a proposal open their detail. Supporting cards offer a guided drive-price review and an entry point into the saved estimate.

The current column continues to display the retained r3 supplier basis after r4 is reviewed. A reviewed proposal has not silently become a published catalogue price. The latest-revision column makes that distinction visible.

## 5. Source detail and authored evidence

The full-source page combines identity, provenance, commercial assumptions and revision history. A selector opens any of the eight source fixtures without returning to the register.

| Information | Displayed treatment |
|---|---|
| Identity | Supplier, demonstration company, synthetic product reference, source reference and revision. |
| Units and price breaks | Original supplier unit, minimum source quantities and unit costs in the source currency. |
| Validity | Effective and expiry dates, checked against the fixed demonstration date. |
| Exchange rate | AUD per one unit of supplier currency, evidence reference and evidence date. Unknown rates remain unknown. |
| Lead time | Whole-day assumption from the source, including an explicit Unknown state where no value is supplied. |
| Supply terms | Freight exclusions, complete-roll requirements or whole-shipment allocation context. |
| Ownership and review | Named fictional owner, historical source review and subsequent source revision decisions. |
| Availability and mapping | Whether the authored extract is available and whether company/product/unit mapping is declared resolved. |

**Read authored source extract** opens the source document content actually included in the design. It clearly labels itself as an authored synthetic extract. It does not claim to have downloaded a supplier PDF or verified external document bytes. The unavailable service-parts fixture keeps its source identity and previous prices visible while disabling the extract action.

History retains previous candidate revisions and their decisions. A newer source does not remove earlier reviewed, returned or rejected evidence. Proposed revisions link directly to their comparisons.

## 6. Source preparation and maintenance

The Data steward can prepare a successor source revision when no current draft or submitted revision is waiting for completion. The source form captures the supplier reference, first-tier cost, any existing quantity-break cost, effective date, expiry date, AUD conversion rate, rate evidence, lead time and change reason.

The selected source's company, product, currency, supplier unit and quantity-break thresholds remain fixed. This scope avoids pretending that editing a cost resolves a company or product mapping. The unresolved valve source and unavailable service-parts source retain their blockers; submission requires those dependencies to be resolved through future receiving work.

Positive source costs accept up to four decimal places. FX accepts up to six. Dates must be real ISO dates and expiry cannot precede effectiveness. Lead time is a whole number of days, including zero when explicitly confirmed. AUD sources use a rate of exactly 1. Empty references, missing rationale, exponent notation, negative values and unsupported numeric formats are rejected. These are preview input constraints, not approved commercial policy.

Saving creates a separate **Draft**. The author can edit that draft before submission. Edits retain its revision identity and do not touch earlier submitted evidence or estimate snapshots. **Submit revision** locks the draft content for independent review. Returned or rejected revisions remain in history; preparing a later revision does not inherit their decision.

## 7. Price-change review

The review view presents a selectable revision list beside a detailed comparison. The list includes previous proposals, so reviewers can reopen earlier evidence rather than being forced onto the latest revision.

The comparison shows saved and proposed supplier prices, all quantity breaks, FX rate and date, FX evidence, effective/expiry dates, lead time, company/product identity and source unit. Changed fields receive a pale green background on desktop. Text labels and actual values communicate the difference independently of colour.

The headline percentage is the change in the first supplier price tier in its original currency. It explicitly excludes FX effects and is not the estimate's cost-impact percentage. The Refresh impact view calculates the AUD extended-line difference using each line's actual quantity and applicable tier.

The source reviewer may record **Reviewed**, **Returned** or **Rejected**, with a mandatory rationale. The model prevents the author and other preview roles from making the independent decision. A source with expired validity, unavailable evidence, unresolved mapping or missing FX evidence cannot newly receive a Reviewed outcome. Returned and rejected decisions can record why the evidence is unsuitable.

Some starting fixtures intentionally show previously reviewed evidence that is now expired or incomplete for use. A historical review is not an evergreen applicability permission. The current checks still block its use.

There is no catalogue-publish or ERP-update action. The reviewed state means that the exact source evidence is reviewed within this synthetic workspace. Estimate cost review, commercial approval and publication remain separate decisions.

## 8. Estimate cost review

The example is `SYN-EST-2407`, revision 3, for the fictional Fernhaven Demonstration Nursery. It covers a growing-house screen and irrigation upgrade and retains `SYN-SCOPE-02`. Seven lines show equipment, materials, freight and commissioning.

Each line includes description, line identity, category, quantity/unit, exact source reference, applicable supplier unit price and quantity tier, saved AUD extended cost and review condition. Source-linked actions open the exact saved source attached to that line. They do not substitute a newer proposal.

The saved **known cost subtotal is AUD 6,494.00**. One sensor line has unknown cost because the USD-to-AUD evidence is absent. The display therefore avoids calling the subtotal a final or complete cost. Other lines have known arithmetic but still require review: the climate source has expired and the manual commissioning allowance needs confirmation.

A separate preserved quotation, `SYN-QUO-2407` r2, displays its historical AUD 14,850.00 sell value and issue date. This is deliberately distinct from the draft estimate's cost subtotal. No margin or markup is inferred between these two different revisions.

Saved draft successors appear below the cost lines. Opening a successor shows its predecessor, creator, reason, known subtotal, unresolved items, exact retained source references and unchanged historical quotation.

## 9. Refresh impact and successor creation

The refresh view compares each saved cost line with the latest proposed source revision. Only applicable Reviewed evidence is selectable. Expired sources, missing FX evidence and unreviewed or returned proposals display their reason instead of a checkbox. A dash indicates that no eligible proposed amount is available; it does not mean zero cost.

Users can select individual eligible lines or select all eligible updates. The table shows saved and proposed extended AUD amounts, change, source revision movement and FX basis. The summary recalculates the known subtotal and selected difference while retaining the unknown-cost warning. If a previously unknown cost becomes known, it marks the overall difference Not comparable because the two known subtotals cover different sets of costs. Saved unresolved findings are derived from the exact refreshed lines.

The starting selection contains the reviewed rail and tube revisions. It produces a proposed known subtotal of **AUD 6,603.12**, an increase of **AUD 109.12**. After the drive r4 source receives independent review, selecting all three eligible changes produces **AUD 6,843.92**, an increase of **AUD 349.92**.

The Estimator must enter a reason and acknowledge remaining incomplete costs before saving. The command creates a new local draft, `SYN-EST-2407-D4` for the first successor, with no inherited approval. The source r3 estimate and historical quotation remain unchanged. Further distinct saved refreshes receive separate draft identifiers and remain explicitly linked to r3; they are sibling alternatives, not a silently advanced current estimate.

A retained fingerprint binds the command to the exact selected source evidence shown in the preview. If the relevant source changes, the command refuses the stale comparison. Repeating the same exact refresh does not create another successor. Refreshes remain draft work while incomplete costs, expired evidence, commissioning assumptions or duty policy are unresolved.

## 10. Worked calculation and rounding basis

All figures below are authored demonstration values. The UI uses fixed-decimal integer arithmetic for extended costs, not floating-point accumulation.

| Line | Saved basis | Saved AUD cost | Eligible revised basis | Revised AUD cost |
|---|---|---:|---|---:|
| L01 Screen drive | 4 each × EUR 320 × 1.65 AUD/EUR | 2,112.00 | 4 × EUR 346 × 1.70, after independent source review | 2,352.80 |
| L02 Screen rail | 24 lengths × USD 42 at the 20+ tier × 1.50 | 1,512.00 | 24 × USD 44 at the 20+ tier × 1.52 | 1,605.12 |
| L03 Irrigation tube | 200 m × 0.01 roll/m × AUD 200 | 400.00 | 200 m × 0.01 × AUD 208 | 416.00 |
| L04 Climate interface | 1 each × AUD 1,250 | 1,250.00 | Proposed source expired; retain saved basis | 1,250.00 retained |
| L05 Humidity sensors | 4 each × USD 120; FX unknown | Unknown | Proposed FX also unknown; blocked | Unknown |
| L06 Import freight | 1 shipment × AUD 460 | 460.00 | No eligible update selected | 460.00 retained |
| L07 Commissioning | 8 h × AUD 95/h | 760.00 | Manual allowance retained | 760.00 retained |

The declared `SYN-COST-01` convention rounds each extended line once to cents using half-up rounding, then sums the rounded line amounts. Quantity supports three decimal places; source quantity conversion supports six; supplier price supports four; FX supports six. The model uses scaled integers and preserves cents as strings in saved/exported records.

Quantity breaks are assessed in supplier units. The highest qualifying minimum applies to the whole line. The 24 rail lengths therefore use the 20+ price. The tube conversion carries its explicit evidence: 200 m equals two complete 100 m rolls. Partial rolls are blocked, rather than automatically rounded or purchased. A different required quantity needs an explicit sourcing decision beyond this example.

Freight is represented exactly once, as standalone L06. It is not also embedded in supplier line costs. Duty, tariff classification, import allocation policy and operational GST treatment are not invented. The example has no tax calculation, no automatic selling-price calculation and no adopted margin threshold.

## 11. Included sources and exception coverage

| Supplier source | Purpose of the fixture |
|---|---|
| Northline Motion screen drives | EUR costs, quantity breaks, increased price, changed FX and longer lead time; starts In review. |
| Cedar Mechanical screen rail | USD costs, 20+ quantity break and a reviewed proposed refresh. |
| Clearwater irrigation tube | AUD cost, metres-to-rolls conversion and reviewed price/lead-time changes. |
| Canopy climate interface | Expired current and proposed evidence, known historical arithmetic and unknown lead time. |
| Greenline humidity sensors | Missing FX evidence; unknown extended cost retained. |
| Clearwater valve assembly | Unresolved variant mapping prevents submission/use from being inferred. |
| Example Freight | Whole-shipment allowance counted once, with retained allocation explanation. |
| Northline service parts | Unavailable source extract; previous identity and costs remain visible. |

Suppliers, products, customers and people are fictional. The fixed as-at date is **17 September 2026** so validity demonstrations are reproducible when the HTML is opened later. Browser-local command timestamps record when the reviewer performed the demonstration; they do not change that assessment date.

## 12. Roles and state transitions

| Preview role | Permitted local actions |
|---|---|
| Data steward — Alex Morgan | Prepare/edit source drafts and submit their exact revisions. |
| Source reviewer — Sam Taylor | Independently mark submitted source evidence Reviewed, Returned or Rejected, with rationale. |
| Estimator — Riley Chen | Inspect cost provenance, compare eligible changes and create an acknowledged draft successor. |
| Observer — Jordan Lee | Inspect the internal synthetic evidence and export a review copy; no source or estimate mutations. |

Role selection is a demonstration control. It is not authentication, server permission enforcement or an approval-authority registry. Every supplied HTML copy contains all synthetic internal data. Production integration must enforce permitted company/workspace scope and commercial visibility on reads, searches, aggregates, source files, commands and exports.

Source progression is Draft → In review → Reviewed / Returned / Rejected. Draft editing stops at submission. Reviewing a source never changes an estimate. Estimate refresh creates a separate Draft requiring cost review; there is no approve, issue, send or convert transition in this module.

## 13. Local persistence, conflict and recovery

Saved source revisions, decisions, draft successors and command events use the browser storage key `ppo.supplier-pricing.r01`. Storage is scoped to the browser origin. Opening the file in a different browser or context does not imply that prior work will be available.

The interface reports a successful save only after browser storage accepts the complete new state. A failed save leaves the form contents visible and permits retry. The Review guide includes **Fail next save once** to make this recovery path reproducible without disconnecting any external service.

Each command checks the expected state version. The interface also checks whether the stored bytes changed since loading and listens for changes from another tab. Conflicts pause saving, retain entered text and offer reload/export/reset recovery. This is a browser-local conflict demonstration, not a substitute for atomic server concurrency controls.

Malformed or incompatible saved data is retained instead of overwritten. Shape, dates, numeric fields, source identities, saved line quantities, policy, totals and historical quotation are validated before persisted state is accepted. These checks are integrity safeguards for the preview, not cryptographic authenticity or protection from a user editing their own storage.

**Export review copy** downloads JSON containing the synthetic warning, fixed assessment date, original estimate, source fixtures and saved state. **Export stored copy** preserves unreadable stored text for recovery. **Reset demo** asks for explicit confirmation before removing this module's locally saved state. It does not clear unrelated browser storage.

## 14. Theme-board alignment and accessibility

The implementation reuses the r20-aligned presentation primitives and embedded Roboto already used in the repository's standalone workspace designs. The self-contained HTML makes no network or external-font requests.

| Theme feature | Application in this module |
|---|---|
| Navy `#242a37` | Headings, key text, primary actions and cost-summary panel. |
| Green `#62bb46` | Selected-tab underline and restrained selection accents. |
| Neutral white and grey surfaces | Workspace background, compact cards, table headers and evidence groupings. |
| Typography | Embedded Roboto with Verdana fallback; tabular, right-aligned monetary values. |
| Register/detail composition | Persistent context, filters, structured source rows, compact summary cards and docked snapshot. |
| Review/comparison composition | Saved/proposed columns, highlighted changed fields, visible decision scope and rationale. |
| Guided forms | Labelled inputs, fixed identity context, preserved errors, explicit submit/save/cancel actions. |
| Mobile presentation | Stacked cost cards, wrapping metadata, full-width snapshot and touch-sized controls. |

Verified visual examples: [desktop price comparison](../../../testing/evidence/supplier-pricing-r01/desktop-price-comparison.png) and [phone refresh impact](../../../testing/evidence/supplier-pricing-r01/phone-refresh-impact.png). These are original browser captures of the starting synthetic state.

The module does not introduce a new global navigation system or redraw the Powerplants logo. Standard native selects are retained for the small fixed role/status/source choices; the r20 custom dropdown-card interaction is not reproduced. This deliberate implementation simplification preserves platform keyboard behaviour and is not an accepted change to the app-wide component standard.

Semantic headings, visible focus outlines, labelled fields, live status messages, tab semantics and native dialogs support keyboard use. Text accompanies all coloured states. Screen-reader review, forced-colour assessment, 200% zoom, physical-device testing and owner design acceptance remain separate from the executed browser checks. Browser printing is incidental review output, not a controlled supplier or customer document service.

## 15. Suggested review walkthrough

1. Open the HTML and inspect the eight-source register. Search for Northline, filter awaiting review, and recover from a no-results search.
2. Open Screen drive assemblies in the snapshot, then open the full source and its authored extract.
3. Compare drive r3 and r4, including both quantity tiers, FX evidence and lead time.
4. Switch to Source reviewer. Record Reviewed with a meaningful rationale.
5. Open Estimate cost review. Confirm the original AUD 6,494.00 known subtotal and the unchanged issued quotation.
6. Open Refresh impact and select all eligible updates. Confirm AUD 6,843.92 known subtotal and AUD 349.92 selected difference.
7. Switch to Estimator. Create a draft successor with a reason and incomplete-cost acknowledgement.
8. Inspect its retained source revisions, original quotation, unknown sensor cost and remaining review items. Reload and reopen the saved draft.
9. As Data steward, prepare and edit a new irrigation-tube source draft, then submit it. Return it as Source reviewer. Confirm that the previously saved estimate still retains its earlier reviewed tube source.
10. Exercise the failed-save retry, JSON export, phone layout and explicit reset controls.

This walkthrough is a design review, not a procurement, exchange-rate, pricing or acceptance procedure.

## 16. Receiving contracts for application work

| Boundary | Required implementation contract |
|---|---|
| Products / PD-01 | Stable product/model/variant identity; exact supplier item and units; source revision and technical applicability. |
| External mapping / AD-05 | Authoritative external company/entity keys, reviewed mappings and unresolved mapping ownership. A matching label is insufficient. |
| MYOB / IF-02 | Installed endpoint/schema evidence, allowed company scope, item/price authority and explicit permitted operations. No endpoint is invented here. |
| Documents / SharePoint | Permission-checked original supplier evidence, stable version identity, content hashes, availability, access and retention. |
| Cost engine / EST-04–05 | Decimal representation, declared rounding order, FX direction/date, pack rules, freight/import allocation, tax context and completeness. D-009 remains open. |
| Estimate refresh | Immutable source/line/scope versions, atomic successor command, durable receipt/idempotency, current-authority checks and stale-preview refusal. |
| Commercial review / ES-04 | Exact estimate snapshot, unresolved cost findings, adopted pricing policy and separate commercial approval. |
| Controlled quotations | Exact issued content and acceptance remain bound to their original revisions; a refreshed draft needs its own downstream review and issue process. |

The first useful runtime increment would be permission-scoped, read-only source provenance alongside an existing saved estimate. Source maintenance and successor creation should follow only after the data, calculation and command contracts are settled. This recommendation does not expand the current authorisation beyond the standalone design package.

## 17. Implementation and maintainability

The source directory contains `template.html`, `fonts.css`, `workspace.css`, `model.js` and `workspace.js`. A small Python builder embeds those sources into the delivered HTML deterministically. No framework, runtime dependency or production route is added.

The model owns sources, estimate snapshots, arithmetic, eligibility and transitions. The browser layer owns rendering, dialogs, filters, role selection, local persistence and export. User-entered text is escaped before HTML rendering. Monetary values and source review outcomes remain explicit fields rather than being inferred from display strings.

The [source README](../../../design/supplier-pricing/README.md) documents build/check commands. The [design decision and handover](../../../decisions/supplier-pricing-cost-sources-design.md) records architecture rationale, boundaries and verification. Synthetic references are local demonstration labels; production records need immutable internal IDs and adopted external mappings.

## 18. Verification and evidence

The local model suite contains **26 checks** covering exact totals, quantity tiers, complete-pack conversion, integer rounding, FX direction, missing sources, invalid inputs, role transitions, stale versions, exact review, retained snapshots, duplicate prevention and malformed saved state.

The dedicated browser suite exercises the generated HTML with the repository's pinned native Chrome runtime. It covers the complete source-review/refresh journey, draft editing, cancellation, input escaping, failed-save retry, persisted history, role restrictions, keyboard navigation, export, cross-tab conflict, corrupt-state recovery and responsive presentation at 1440, 1024, 820, 390 and 320 px.

**Executed verification:** final HTML source `71d486f39d11fb7420b2e6885e1c15b055f33bed` passed 26 model groups and all 20 native-browser groups in [run 35163851488](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35163851488), using Chrome 153.0.8010.47. No page or console errors were reported. Focused lint, deterministic assembly, foundation, prototype and naming checks also passed. All 29 returned screenshots and the delivered HTML were checked against their hashes. Desktop and phone captures were inspected during verification.

The first native run identified a form-ID shadowing bug in review submission. The corrected run completed the workflow and responsive gallery, then identified a phone snapshot focus-cycle issue. Both defects were corrected and the full final suite passed. Original run history, source hashes, captures and remaining acceptance limits are recorded in the [verification record](../../../testing/evidence/supplier-pricing-r01/README.md).

Browser execution and complete-repository assurance ran in GitHub CI; no local native-browser or full-repository pass is claimed. Later report/evidence-only publication leaves the verified HTML unchanged.

## 19. Explicit exclusions and open decisions

This module does not provide live supplier pricing, actual exchange rates, purchase orders, cost-book publication, operational price approval, new catalogue item creation, supplier onboarding, product substitution, automatic FX refresh, tax advice, duty calculation, automatic landed-cost allocation, sell-price/margin calculation, quotation issue, business messaging or ERP writes.

Before application integration, decide source-review authority, who may see commercial costs, valid currencies and units, source expiry policy, FX evidence and update policy, pack/quantity rules, freight and import allocations, tax treatment, approved rounding, duplicate-source resolution, catalogue publication lifecycle and retention. The fixture's reviewed states and selected values do not adopt those policies.

## 20. Handover

The HTML and this report form one revisioned review package. Review the normal journey and the expired, unavailable, unmapped and unknown-FX examples together. Record owner design feedback against the exact revision. Publication, automated verification, owner acceptance, application integration and deployment remain separate milestones.

The next related design is ES-04 — Estimate review and pricing exceptions, which can receive the exact source evidence and unresolved findings demonstrated here without treating source review as commercial approval.
