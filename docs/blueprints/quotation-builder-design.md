---
document_id: PPO-010-QB-DESIGN
title: Quotation Builder design
revision: r01
date: 2026-09-09
owner: Dean Fiedler
status: Design for review; standalone synthetic demonstration
source_commit: f8035b5c55251da4da52430adf2f83094feccd6b
---

# Quotation Builder design

The estimator prepares the costed scope, adds customer wording, saves the inputs and generates a branded draft from that exact snapshot. Manual estimates and future supported costing engines use the same quotation structure. The first design uses templates and entered text; optional AI assistance follows later.

This is the bounded design Dean requested on 9 September 2026. It extends the direction in [BP-04](BP-04-estimating-quotation.md) and the existing [E1 contract](../contracts/estimating-e1.md). It adds a standalone demonstration, not application functionality, production policies or a customer offer. Review the [interactive example](quotation-builder.html).

## 1. Reference and current-state findings

The supplied equipment quotation was reviewed for its structure: cover metadata followed by twelve sections, with separate standard terms referenced at acceptance. Its customer details, equipment specifications, prices, supplier claims and operative clauses are not copied into the prototype. The source operational document remains outside Git.

Brand evidence: Powerplants Brand Identity Guidelines 2026, pages 17–18 and 39, plus the supplied intact logo. The design uses Roboto, navy `#242a37`, green `#62bb46`, white and A4 portrait. The repository's existing matching logo and font assets are reused; no invented contact block or logo is added.

Current `main` was read at `f8035b5c55251da4da52430adf2f83094feccd6b`, including AGENTS, README, STATUS, BP-04, E1, the estimating sequence and UI/naming standards. E1 already has manual Product/Labour/Freight lines, immutable saved versions, scope/exclusions/assumptions, include/print choices and draft HTML/PDF. E1 uses AUD excluding tax and does not calculate tax. Rich specification sections, commercial content templates, named pricing packages, formal issue and AI assistance are extensions; their appearance here does not imply runtime delivery. E2–E6 and P01–P12 retain their current dependencies.

GitHub currently reports the repository as public although maintained text calls it a private prototype. This contribution contains only synthetic design data and existing repository brand assets. No visibility setting is changed.

## 2. Estimator journey and screen design

The workspace uses three steps with a persistent quotation preview. A narrow navy product rail, compact heading and a navy primary action follow the PPO UI direction. On narrow screens, the rail disappears and editor/preview stack. The estimate table owns any necessary horizontal scrolling; the page itself should not overflow.

1. **Estimate.** Read the linked customer/opportunity and saved estimate. Select priced scope and detailed or grouped customer presentation. Show selected sell value separately from internal cost. The demonstration fixes five core scope lines and allows one optional local-freight line; it does not simulate arbitrary product substitution.
2. **Content.** Edit project context, scope, commissioning, responsibilities, assumptions, exclusions and delivery/commercial fields. Sections show where their content comes from. Long text is organised into meaningful fields; there is no requirement to compose the complete quotation in one text box. Specification and warranty values are fixed fictional fixtures in this first preview.
3. **Review draft.** Check required inputs, totals, source snapshot and commercial status. Save changes, enter a revision reason and generate a separate branded draft. Open an earlier draft or download the generated customer-only HTML. A supplied PDF demonstrates the baseline layout. Review does not issue, send or accept the quotation.

The live preview is explicitly a working preview. A generated draft shows its own estimate version and revision. Editing working inputs does not silently alter that draft. Save errors, unavailable browser storage and missing required fields are reported. The standalone example saves only in browser storage when available; it is not server persistence or offline estimating.

## 3. Reference sections mapped to inputs

Field names below are proposed logical fields, not an added API or database schema. Each sourced value needs a source identity/revision, author or generating engine, captured time and confirmation state. A costing-engine suggestion is not automatically a confirmed customer commitment.

| Reference section | Source inputs and editor | Template output and important rule |
|---|---|---|
| Cover / identification | Shared customer/contact/site display context; estimate UUID/version; quote identity/revision; `title`; `prepared_on`; author; `valid_until` | Populate exact references and recipient context. A draft has a prepared date; never relabel it as an issue date. Billing and delivery references remain distinct. |
| 01 Project summary | `project_context`; `included_scope`; selected product/service lines; estimator edits | Assemble need, proposed solution and included work. Only describe included equipment/services. Reuse selected scope facts rather than writing inconsistent duplicate statements. |
| 02 System specification | `specifications[]`: parameter, value, unit, source document/revision, applicable equipment/line, confirmation state | Produce a specification table. Unknowns remain explicit. Engine output must retain its input/rule version; manufacturer claims require a verified source. The example has a wholly fictional specification sheet. |
| 03 Commissioning | Selected installation/commissioning lines; `commissioning_activities[]`; prerequisites; attendance basis | State included activities and prerequisites. Separate equipment lead time from technician attendance; no inferred booking or readiness. |
| 04 Customer responsibilities & pre-works | `responsibilities[]`: action, responsible party, relevant equipment/site and prerequisite | Identify what the customer supplies or completes. Retain these separately from exclusions, even when they concern the same service. |
| 05 Assumptions | `assumptions[]`: statement, basis, owner and confirmation status | Show the assumptions supporting scope and price. A changed assumption requires review of affected lines and wording. |
| 06 Exclusions | `excluded_scope[]`; unselected offered scope; freight inclusion flags | Keep price and wording aligned. Local freight moves out of exclusions when selected. Hiding a priced line is not excluding it from the offer. |
| 07 Freight & lead times | `freight_components[]` with type, included/excluded status and cost-allocation reference; lead-time range/unit; trigger; source/as-at; attendance dependency | Separate international transport, duty and local freight. Preserve the range and its trigger. Include each charge once. Do not turn an indicative period into a delivery promise. |
| 08 Investment summary | Exact selected sell extensions; currency/tax basis; source-line/group mapping; applicable reviewed pricing policy | Show detailed lines or named package totals. The sum of customer amounts equals the selected offer total. Internal costs, margins, supplier allowances and source notes are excluded from the export data. |
| 09 Payment terms | Selected clause ID/revision; milestone trigger/share; amount basis; currency; reviewed exceptions | Calculate display amounts from the exact offer using declared rounding. Store whether the basis includes tax. A payment schedule is not an invoice, receipt or evidence of a deposit. |
| 10 Validity & exchange rate | `prepared_on`; `valid_until`; currency basis; applicable FX clause/source/revision | Show exact dates. Apply an FX clause only when explicitly applicable and reviewed. The AUD-only example has no FX adjustment clause. |
| 11 Warranty | Applicable equipment/supplier source; approved clause ID/revision; duration, trigger, exclusions and claim route | Select verified wording and identify conflicts. The example's demonstration clause is deliberately labelled and has no operational authority. AI cannot invent warranty coverage. |
| 12 Acceptance | Exact quotation/revision; commercial status; recipient/address context; standard-terms attachment revision; future response policy | Draft shows an inactive review panel. A later issued quotation must bind acceptance to exact content; a successor never inherits a signature or response. |
| Standard terms attachment | Approved document ID/revision, hash, attachment selection and distribution evidence | Reuse the exact approved attachment at future issue. The example explicitly states it has no attached operational terms; no fake attachment or signature is created. |

## 4. One complete synthetic example

**Customer:** Example Nursery (synthetic). **Contact:** Casey Green (fictional). **Site:** SYN-PPO Training Nursery. **Estimator:** Alex Taylor (synthetic). **Estimate:** `SYN-PPO-EST-000901`, saved version 1. **Quotation:** `SYN-PPO-QUO-000901`, draft revision 1. **Template:** `PPO-QB-EQUIPMENT-r01`. **Prepared:** 9 September 2026. **Demonstration validity:** 9 October 2026.

The fictional TF-100 specification assumes up to 400 trays/hour, maximum tray size 500 × 300 × 120 mm, 230 V single phase at 50 Hz, 2.0 kW and no compressed-air requirement. These are demonstration facts, not claims about real supplier equipment. The example assumes no import duty; operational treatment remains to be established.

| Line | Category | Quantity × unit sell (AUD) | Selected sell amount | Offer status |
|---|---|---|---:|---|
| SYN-PPO TF-100 tray filler | Product | 1 × 18,950.50 | 18,950.50 | Included |
| SYN-PPO 3 m roller conveyor | Product | 1 × 2,450.00 | 2,450.00 | Included |
| Installation | Labour | 12 hours × 145.00 | 1,740.00 | Included |
| Commissioning and operator training | Labour | 8 hours × 145.00 | 1,160.00 | Included |
| International transport | Freight | 1 allowance × 380.00 | 380.00 | Included |
| Local delivery to site | Freight | 1 allowance × 500.00 | — | Excluded initially |
| **Draft total** | | | **24,680.50** | **Excluding tax; tax not calculated** |

The grouped presentation produces Equipment **AUD 21,400.50**, Installation & commissioning **AUD 2,900.00**, and Freight **AUD 380.00**. These sum to **AUD 24,680.50**. Internal selected cost is **AUD 17,150.00**, visible only in the estimator demonstration and absent from the exported customer document. These are fictional amounts and not an approved pricing policy.

Demonstration payment: 50% on order and 50% before dispatch, each **AUD 12,340.25 excluding tax**. The final milestone carries any rounding remainder. Selecting 100% on order creates one **AUD 24,680.50** milestone. These are arithmetic examples, not payment requests.

Selecting local freight changes the selected total to **AUD 25,180.50**, changes the freight inclusion wording and removes the local-freight exclusion. After saving version 2, generation creates draft 2; draft 1 retains its original bytes and **AUD 24,680.50** total. Changing presentation alone never changes the total.

### Baseline document layout

| Page | Contents |
|---|---|
| 1 | Branded heading and recipient metadata; 01 Project summary; prominent draft investment; 02 System specification |
| 2 | 03 Commissioning; 04 Customer responsibilities; 05 Assumptions; 06 Exclusions |
| 3 | 07 Freight & lead times; 08 Investment summary; 09 Payment terms |
| 4 | 10 Validity & exchange rate; 11 Warranty; 12 Acceptance and draft/source status |

All pages carry the quotation identity, synthetic draft status and page number. The final PDF is generated from the customer-only template output and uses the supplied brand assets. Future production rendering must handle long text and additional pages with repeated table headings, no orphaned headings and actual page counts; the four-page baseline is not a promise that every quote has four pages.

## 5. Common input contract for costing engines

Manual entry is the only connected source in this demonstration. A future adapter maps each engine's output into a common proposal containing `engine_id`, engine/rule version, run ID, input snapshot hash, source line IDs, quantities/units, source and estimate currency, sell amounts, customer descriptions, scope/specification suggestions and diagnostics. Unsupported fields, unresolved currency conversions and missing units block application of the affected proposal.

The estimator first compares proposed additions, changes and removals against the current saved estimate. Manual edits and their provenance must remain visible. Accepting a refresh creates a successor snapshot; it never reprices an existing draft or issue. Engine cost results and confirmed sell values remain distinct. Supplier descriptions are not automatically safe customer copy.

**Customer export is a separate allowlisted object.** It contains only the reviewed recipient context, narrative, selected specification fields, selected commercial lines/groups, sell totals, currency/tax basis, selected terms and draft identity. It omits internal notes, costs, margins, hidden descriptions, supplier allowances and raw engine payloads. The production server must enforce this boundary before rendering or returning data; hiding fields in the browser is insufficient.

## 6. Template and editing rules

Each template has a stable identity and immutable revision: section definitions, applicable job type, required fields, approved clause references, brand assets and layout. The draft retains the exact template/input/output identities and bytes. Ordinary wording edits are estimator-authored values; they do not silently change the reusable template for other estimates.

For the first implementation, use one equipment-supply template. Keep customer content separate from internal notes; allow optional applicable sections but require scope, selected prices and explicit commercial unknowns. Clause edits should be shown as departures for the relevant reviewer. Rendering success, commercial approval, issue and customer delivery are separate outcomes.

A production save must validate expected versions and current permissions, retain the original operation receipt and reconcile an uncertain outcome. Generation binds a saved estimate and a saved content snapshot. On conflicting edits, retain the user's proposal and show differences; do not overwrite. Revocation removes both content and file access under current server authority. Browser storage in this design does not implement any of those production guarantees.

## 7. Optional AI assistance after template proof

Keep manual completion available. AI may propose a clearer summary, organise rough notes into existing fields, suggest relevant approved sections and identify potential missing or inconsistent information. Suggestions show their input sources and a before/after comparison. The estimator can accept or reject each suggestion.

AI must not set or recalculate prices, invent equipment performance, change units, create delivery promises, approve clauses, omit exclusions or issue/send a quotation. Unknowns should produce questions or explicit draft gaps. It should receive only the currently authorised minimum data; a real provider, account, budget, retention policy and data boundary require the later selected integration scope. No provider or model is selected or called by this design.

## 8. Verification and review boundary

The [recorded verification evidence](../testing/quotation-builder-design-evidence.json) contains 21 passing local model checks, three passing repository documentation checks, and the inspected four-page PDF output hashes. The companion local model check verifies arithmetic, grouped/detailed selection, explicit freight treatment, required inputs, saved-source generation, revision retention, restoration from stored data, markup escaping and draft-only wording. It executes the authored JavaScript using a minimal control shim. It is not a browser, accessibility, real storage, server, database, permission or restart test.

The cloud review browser rejected local-file navigation under its URL policy. No alternate browser route was used. Live desktop/390px/320px visual review remains outstanding. The PDF is separately rendered and visually inspected; its text and amounts are checked against the generated customer HTML. A renderer-library bootstrap failure is not reported as a product failure.

Repository checks: `check_foundation.py`, `check_prototype.py`, `check_naming.py`, and the focused model check. No runtime source, migration, application dependency or workflow is changed. Existing full application/acceptance statuses are not promoted by this design.

| Future implementation case | Expected result | Related existing scope |
|---|---|---|
| Save, generate and reload one complete quote | Exact saved source and draft bytes survive server restart | EST-03/08; EA-09/18 |
| Different costing engine, same mapped inputs | Same reviewed quotation facts; engine trace retained | EST-04/06; EA-05/16 |
| Group or hide selected details | Visible amounts reconcile; hidden internal fields absent from HTML/PDF/metadata | EST-05/08; EA-10/11 |
| Exclude/include freight or labour | Price and narrative agree; no double count | EST-02/04/08; EA-06/10 |
| Change source after generation | Old draft unchanged; regeneration requires deliberate successor | EST-03/08; EA-09/12 |
| Unknown specification, lead time or clause | Explicit owned gap; cannot pass later issue readiness | EST-02/07/08; EA-04/09 |
| Permission loss or stale version | Server denies access/mutation; user's authorised proposal is recoverable | EST-07; EA-01/15 |
| Long descriptions, keyboard and 320px use | Readable, navigable UI and properly paginated customer output | EST-08; EA-10/18 |

These are prospective cases, not newly passed EA/AT acceptance. All 78 parent requirements remain unchanged.

## 9. Next bounded implementation

After design review, implement one template-backed content editor and saved draft generation journey in the existing E1 application, with additive content snapshots, current permissions and exact output recovery. Resolve the selected synthetic clause/validity/specification contract and verify desktop/mobile output first. Retain the current no-tax boundary unless a separate reviewed calculation scope changes it. Formal issue/response remains E4 after its E3 and applicable E2 dependencies. Specialist engines and live AI remain later work.

The current review should settle section order, grouped pricing, the content editor and the balance of quotation detail. It does not require selecting a real AI provider or changing the active CRM, Email & Calendar, Azure or assistant workstreams.
