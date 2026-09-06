---
document_id: PPO-010-EVID
revision: r01
date: 2026-09-06
owner: Dean Fiedler - private prototype
status: Targeted source assessment; operational validation incomplete
---

# Estimating evidence and CREMS behaviour assessment

## 1. Evidence used

This is targeted discovery under [BP-04](BP-04-estimating-quotation.md), not a repeat of the entire historical reconstruction audit. File hashes, byte counts and secure source identities are in the [source manifest](estimating-source-manifest.json). Original sources remain outside Git; synthetic design and source metadata are committed.

| Source | Inspection and authority |
|---|---|
| EST-SRC-01: supplied CREMS Field Guide PDF | Original 350-page PDF, p1 states accurate as of 1 September 2026. Local text extraction, targeted route/branching/costing/configuration/approval/quote/conversion reads, and visual inspection of pp46/167. Primary guide evidence; does not prove executable logic or live tenant state. |
| EST-SRC-02/03: supplied Field Guide HTML copies | Files resolved and hashed; same guide family with different file bytes. Retained as alternate source representations, not independent confirmations. Embedded viewer content is not treated as a separately validated application. |
| EST-SRC-04: CREMS reconstruction specification v05 | Targeted sections 6/10/12–22 and controlled-register navigation support the assessment. Secondary guide-derived reference; not executable formulas. |
| EST-SRC-05: v05 content assurance audit | Read its scope, conclusions and external-evidence dependencies. Its historical pass does not pass PPO acceptance. |
| Maintained PPO main | Initial `17f1505e` refreshed to `c3ac9b2a` after actual CRM I1 merge. All original snapshot file hashes and complete refreshed tree verified. Read AGENTS/README/STATUS, master section 10, BP-02/03, relevant ADRs, shared/CRM/Activity/operation/receipt and document contracts. |
| Supplied brand PDF/logo | Local supplied bytes, PDF p18 inspected visually; typography/colour/clear-space text checked against maintained shared UI r03. Exact navy `#242a37`, green `#62bb46`; logo remains unchanged. |

Connected Drive search for CREMS returned no matches in this run. Library search located the source files above. No live CREMS solution/configuration, MYOB endpoint, production pricing policy or operational quotation sample was obtained. Source gaps are explicit below. The supplied guide's footer and viewer URLs are provenance, not authorisation to access another app.

## 2. Evidence classification and contradictions

DG = documented guide behaviour. PR = proposed PPO disposition, subject to owner review. UQ = unavailable technical/business evidence. The assessment checks material guide outcomes; it does not copy every legacy layout, role name, numeric limit or device-local limitation into PPO.

- The guide introduction says three ERP write moments, but detailed customer/contact/location and item create/reactivate sections describe more. Use the full per-operation inventory, not the simplified count.
- The guide describes live pricing-policy effects on older lines (p129). PPO proposes explicit version visibility and deliberate reevaluation. Existing issued/accepted snapshots never change; this is an improvement proposal, not source parity.
- Quote zero unit price/100% discount is documented separately from the estimate below-cost save block. Retain separate validation contexts; a single global “sell must exceed cost” rule would be wrong.
- A quote can hide priced detail. Customer output must represent the full included price in explicit section/configuration totals, while internal costs stay out of the customer data altogether.
- The guide's broad branching locks require a complete policy decision. A visually attractive “Add option” control cannot bypass a pending quote/conversion elsewhere in the pursuit.
- The secondary v05 arithmetic is useful orientation but cannot establish actual calculation precision, tax, FX or threshold precedence. Demonstration fixtures are PR with explicit conventions.

## 3. CRE-01–CRE-26 dispositions

Every row is assessed against targeted guide evidence and the maintained master section 10.4. Disposition remains proposed. Page numbers refer to EST-SRC-01 PDF pages; chapter/section locators are included where a topic spans pages. “Reviewed” means documentary inspection, not functional verification or accepted replacement.

| ID | Guide locator / assessed behaviour | Proposed disposition and PPO obligation | Remaining evidence / acceptance |
|---|---|---|---|
| CRE-01 | p46 routing precedence, Stop and prepayment | Preserve approved first-match logic and exact answer/rule snapshot; payment receipt separate | G02 routing/authority; EA-02, AT-26 |
| CRE-02 | Starting an enquiry, pp46/49; Full/Express entry | Preserve proportionate discovery and explicit route/class; no unnecessary Project wizard for defined supply | G02/G04; EA-02/04 |
| CRE-03 | Workspace, pp88–90; options and revisions | Preserve option vs estimation revision vs estimate version; one default is not forecast selection | G03 branch/default rules; EA-03, AT-03/26 |
| CRE-04 | pp89–90 option/opportunity-wide locks | Preserve conservative commitment locks; unknown status holds branching | G03 full concurrent matrix; EA-03/09 |
| CRE-05 | Facilities/scope and questionnaire chapters, pp97–120 | Preserve scoped questions, flags, assumptions, deferrals and overrides | G04 published definitions; EA-04, AT-27 |
| CRE-06 | pp90–92 re-snapshot compatibility | Preserve old answers in history, blank new questions and type-change block | G04 versions/type cases; EA-04 |
| CRE-07 | Cost estimate chapter, pp121–130 | Preserve line categories/provenance and staged save/discard; improve explicit last-accepted vs proposed totals | G01/G05 line inventory; EA-05/06 |
| CRE-08 | Costing line editor, pp125–129 | Preserve quantity/unit/FX/landed-cost distinctions and margin vs markup | G05 source formulas and rounding; EA-05/07, AT-04 |
| CRE-09 | p129 three pricing thresholds | Preserve block/escalate/advisory distinctions; no invented threshold | G02 approved policy; EA-08 |
| CRE-10 | p129 centrally changing pricing policy | Improve visible policy version and deliberate reevaluation; preserve issued prices | G02/G05 effective-date and refresh policy; EA-08/09 |
| CRE-11 | Costing save/refresh; configuration p148 totals failure | Improve atomic authoring where feasible; retain saved lines and separately repair stale totals after partial processing | G01 transaction evidence; EA-06/17 |
| CRE-12 | pp131–132 sections; pp166–169 quote membership | Preserve generated scope hierarchy and membership; deliberate comparisons before restructure | G04/G06 mappings; EA-04/10/16 |
| CRE-13 | Screen Systems, pp138–148; p146 diagnostics/no-purchase | Preserve versioned input/computation/override/diagnostics and priced non-purchase semantics | G06 executable formulas/ranges/maps; EA-16, AT-04/28 |
| CRE-14 | Screen Systems local drafts, pp147–151 | Improve durable authorised drafts where justified; preserve blanks and formula-version warning; offline estimating deferred | G06 storage/version semantics; EA-16/18 |
| CRE-15 | p148 apply and later totals failure | Preserve compound outcome and original run identity; reconcile without duplicate groups/parts | G01/G06 transaction boundaries; EA-17 |
| CRE-16 | pp149–150 rerun/hand-edit matching | Improve explicit diff and unmatched-edit resolution before replacement | G06 matching rules/reference cases; EA-17 |
| CRE-17 | p150 wizard rerun vs recipe Refetch Latest Version | Preserve distinct operations; recipe refresh cannot stand in for formula rerun | G06 formula/recipe evidence; EA-16/17 |
| CRE-18 | Estimate approval, pp152–161 | Preserve exact-content submission, approve/return/withdraw; separate quote issue authority | G02 self-approval/delegation; EA-09, AT-26 |
| CRE-19 | Quote pp166–170; narrative/annex settings | Preserve include/print/annex independently; zero quote prices distinct from estimate validation | G07 exact templates and oracle outputs; EA-10/15, AT-36 |
| CRE-20 | pp169–170 configuration/bulk discounts | Preserve replacement on included members, excluded members untouched; no stacking | G05 rounding/reference cases; EA-10 |
| CRE-21 | Conversion pp180–193 plus customer master chapter | Integrate via verified per-operation IF-01/02/03 contracts; enumerate master/item creates/reactivations | G08/G09 connection/write authority; EA-13/14, AT-05 |
| CRE-22 | Questionnaire and Documents chapters, pp194–205 | Preserve selected-scope answered/blank exports and internal PDF/CSV audience boundaries | G04/G07 export definitions; EA-15, AT-27/36 |
| CRE-23 | Documents, notes, tasks and activity chapters, pp194–220 | Integrate shared Activities/document references; do not copy private commercial data into unrestricted history | G10 ownership/retention; EA-01/18 |
| CRE-24 | Enquiry Confirm/recovery and troubleshooting chapters | Improve durable operation/resume evidence and duplicate prevention after interrupted creation | G01 actual compound outcomes; EA-06/13/18 |
| CRE-25 | Getting started/roles/phone chapters | Improve consistent accessible controls, permission-scoped actions, readable desktop and phone review | G11 actual devices/roles; EA-01/18 |
| CRE-26 | Opportunity summaries and AI assistance | Defer generative assistance; preserve source-linked factual summaries | D-027 remains open; no autonomous pricing/technical/customer commitment |

## 4. Open evidence and decisions

Dean owns prototype disposition of these questions. Proposed Commercial, Estimating, Engineering, Finance and Systems contributors are evidence roles, not assigned employees. Collect the smallest authorised/redacted examples needed; do not request bulk operational exports or raw secrets.

| Gap | Needed evidence and concrete decision | Risk / where it blocks |
|---|---|---|
| G01 | Current CREMS solution/configuration version; table/key/choice metadata and actual transaction/retry boundaries | Missing/duplicate records; blocks exact reconstruction and migration, not documentary design. D-009. |
| G02 | Approved route/pricing policy versions, thresholds/override precedence, approval and delegation/self-approval matrix | Incorrect offer or authority; blocks operational pricing/approval and general routing. E1 can use a named fictional manual policy only after explicit prototype adoption. D-010. |
| G03 | Accepted option/estimation/estimate/quote lock matrix, default/alternative rules and terminal/reopen cases | Competing offers and duplicated forecast; blocks multi-option runtime. D-009/D-010. |
| G04 | Published questionnaires, choices, conditional logic, scope mappings and accepted definition-change examples | Wrong scope/answers; blocks questionnaire replacement. D-009. |
| G05 | Cost/FX/landed-cost/discount/tax formulas with units, precision, rounding, effective dates and independently accepted intermediate/final results | Incorrect totals; blocks parity and operational calculation. Manually supplied AUD example inputs allow explicit synthetic arithmetic. D-009/D-010/D-017. |
| G06 | Screen Systems formula library, ranges, variants, part maps, overrides, no-purchase semantics and rerun examples | Incorrect configuration/materials; blocks configurator build and retirement. D-009. |
| G07 | Current quote/estimate/annex/questionnaire templates, redacted expected PDFs, permitted contact/terms/acceptance wording and version policy | Wrong offer, private-data exposure; blocks operational issue. Brand assets alone do not supply legal/commercial terms. D-024. |
| G08 | Actual MYOB company/modules/licence/auth scopes/endpoints, payloads, correlation and recovery examples for each IF-01–03 operation | Wrong-company or duplicate transaction; blocks live integration. D-005/D-006. |
| G09 | Item-resolution policies, generic item use, create/reactivate authority, units/warehouse/status and synchronisation evidence | Wrong item or duplicate master; blocks live resolution/conversion. D-005/D-006/D-019. |
| G10 | Document retention/legal hold, SharePoint exact-version storage/audience, business handover ownership | Lost or exposed evidence; blocks operational document cutover. D-012/D-024. |
| G11 | Actual user roles/devices, estimating-access scope, offline need and accessibility walkthrough | Unusable or over-permitted workflow; blocks real rollout; local prototype uses explicit synthetic roles. D-023 and permissions design. |
| G12 | Product/labour/freight quote sample with expected calculation and print decisions | Best first acceptance example. E1 synthetic fixture review can proceed without real customer data. |
| G13 | Upgrade/project and warranty/return boundary examples, reservations and variation handovers | Incomplete downstream ownership; blocks broad journey acceptance, not initial simple draft. |
| G14 | Dean's bounded E1 scope and sequencing decision, verified current CRM/main publication | Prevents accidental Wave B expansion or dependence on unmerged code. First implementation starter is prepared only. |

The next useful owner review is one synthetic product/labour/freight example: confirm its scope, price basis and desired quotation presentation, then decide whether to authorise E1. Full formula exports are needed before specialist replacement, not before continuing this design. Issue #10, D-009/D-010 and AT-04/26/27/28/36 remain open; no checkbox is marked accepted merely because its specification exists.
