---
document_id: PPO-PD03-PRODUCT-PRICING-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; restyling the built page, the new reads, the owner field and the Mapped rule are separate
source_commit: 7eb4432baefcf8b098a37726b250a311f21e67dc
versioning: git
---

# Product pricing design — owner decision

On 24 October 2026 Dean asked Claude to design and build "the 'Product supplier-source context (PD-03)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/products/pricing` is built as a native synthetic implementation with acceptance pending, so this design sets what the built page moves to. Claude drew the page and presented it.

On 31 October 2026 Dean asked for an audit: "Give the pages an audit and polish to determine the following: 1. If any improvements or refinements can be applied. 2. If any new and innovative features could be included. 3. If they could be made more professional. 4. If there are any gaps." Claude checked the design against the schema, the bind command and the source read, corrected three errors (section 6), drew the gaps and drew five optional additions apart from the main frames.

Claude then asked "Do you accept PD-03 with the recommended answers to Q1–Q12?" and Dean answered: "Accept with recs". That adopts departures D1–D15, the recommended answers to Q1–Q12 and, through Q12, additions F1, F2 and F5.

Claude drew the page from these sources:
- the [Products contract](../contracts/products-catalogue.md), "Pricing and downstream use";
- the [PD-03 page contract](../design/development/pages/scope-pd-03.md) and the [Supplier Pricing r01 HTML](../reference/ui/supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html), as earlier direction;
- the built page and reads: `src/products/components/pricing.tsx`, `productPricing` in `src/products/reads.ts`, the bind command in `src/products/commands.ts`, migration `0052-products-catalogue.sql`, `readCostSource` and `sourcePrice` in `src/estimating/sources/`;
- the accepted [Products](products-figma-design.md) and [Cost sources](cost-sources-design.md) designs and the [reviewed FX decision](excel-import-reviewed-fx.md);
- the Purchasing, Mappings & reconciliation, Intake & workload, Product compatibility, Estimation Wizard, ES-08 and CPQ Figma pages, read only, for the story.

Scope: `scope:PD-03` "Product supplier-source context", route `/products/pricing`, within the Products contract's retained parents. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, read model, route, migration, permission, grant or deployment. It does not make a binding an approval of a price, and it does not change the behaviour of any estimate or quotation.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PD-03 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| Audit and polish the page | User decision, 31 October 2026 | Dean's request quoted above. Section 6 |
| Departures D1–D15 | Accepted as recommended, 31 October 2026 | "Accept with recs". Section 4 |
| Q1 Who may bind | Resolved as recommended | Estimating. `products.sources.bind` goes to the estimating lead and source owners, who answer for estimate cost. Purchasing keeps read access and brings supplier changes in as ES-03 sources. The grant follows a seeded duty, never a job title. No grant changes here |
| Q2 Expired sources in new estimates | Resolved as recommended | Keep today's rule. ES-03 already refuses a pricing date outside the recorded dates (Expired and Not yet effective) and warns on Unknown. PD-03 shows the state and decides nothing |
| Q3 Pack-size conversion | Resolved as recommended | Not now. If needed later, an explicit, independently reviewed pack factor recorded in ES-03 under its own decision. Until then a mismatch stays Unresolved |
| Q4 CPQ and pricing readiness | Resolved as recommended | No hiding. CPQ keeps showing published products. A price-dependent line needs a Mapped binding with Known, current validity on the evaluation date, otherwise it reads "Cost unknown" and cannot be priced. This is direction for CPQ, not built here |
| Q5 DP-25 revision | Resolved as recommended | This page keeps r03 · T2 as Dean briefed. Products `653:38` and Product compatibility `2393:868573` show DP-25 at r01 · T1 and align at their next change. They are not edited now |
| Q6 DP-25 reference | Resolved as recommended | `SYN-PROD-DP25`, as on Products, which owns product identity. Mappings & reconciliation keeps `SYN-PRD-DP25` as drawn |
| Q7 Unresolved bindings in My Work | Resolved as recommended | Not in this increment. Add later only with a recorded rule, since no thresholds or due dates exist |
| Q8 Owner on a binding | Resolved as recommended; build separate | A binding stores status, evidence, reason, who and when, with no owner. The build adds an owner field by migration, required only for Unresolved |
| Q9 Mapped on an unreviewed source | Resolved as recommended; build separate | Mapped needs a Reviewed revision. Unresolved can use any offered revision, so evidence is still captured. New rule: today's command accepts any offered revision as Mapped when units match |
| Q10 Reads the design relies on | Resolved as recommended; build separate | Add a bounded, permission-filtered read for the worklist, and extend an affected-estimate row with its source revision, line, quantity and amount. Until built, those cells are design intent |
| Q11 Contract wording on FX | Resolved as recommended; applied | The Products contract now says PD-03 performs no FX and shows the original price and rate when ES-03 holds them |
| Q12 Optional additions | Resolved as recommended | F1 price check, F2 validity timeline and F5 follow-up actions are accepted. F4 readiness strip follows the worklist read. F3 cost trail is later. F6, the Assistant drafting mismatch evidence for review, is not taken now |
| Named Figma version | Saved 31 October 2026 | Asked whether Claude should save it, Dean answered "Yes, save it"; Claude saved "Product pricing — accepted" in the Figma desktop app (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Product pricing · PD-03" `2393:859137`, under "— Sales —", after Products. The page header `2393:859138` holds the conformance declaration; the notes card `2395:873163` lists D1–D15, Q1–Q12, the story, the flows and what is not drawn. File index row `2878:3918` |
| Desktop 1440 | 1 Pricing, Unresolved binding selected `2393:867343`; 2 Bind `2393:872259`; 3 Unit mismatch `2393:872666`; 4 Affected estimates `2394:864010`; 5 Worklist `2394:864399`; 6 Restricted `2394:864868`; 7 Mapped binding with row menu `2864:17164`; 8 Revision switcher `2864:17585`; 9 History `2864:17986`; 10 Bind with equal units `2864:18408` |
| Tablet 1024 | Pricing `2394:871543` |
| Phone 390 and 320 | Summary `2394:871960` and `2394:872029`; source view `2394:872098` and `2866:46787`; revision sheet `2866:46899`; restricted `2866:46868` |
| States | S1 Loading `2395:868624`; S2 No sources bound `2395:868710`; S3 Could not load `2395:868755`; S4 Restricted without ES-03 access `2395:868801`; S5 Expired `2395:868870`; S6 Returned in ES-03 `2395:868983`; S7 Mixed currencies `2395:869097`; S8 Stale revision in the URL `2395:869235`; S9 Read only `2866:38996`; S10 Filtered empty `2866:39103`; S11 Validation `2866:39118`; S12 Saving `2866:39141`; S13 Stale version `2866:39152`; S14 Outcome unknown and recovered `2866:39171`; S15 Recorded `2866:39201`; S16 List at its limit `2866:39319` |
| Additions | F1 price check, F2 validity timeline and F3 cost trail on `2866:46963`; F4 readiness strip and F5 follow-up actions on `2866:47390` |
| Parts | Moved on acceptance to Components › "Components · Sales parts" `1095:257410`: Pricing / Cell `2393:867296`, Pricing / Tag cell `2393:867299`, Pricing / Unit check `2393:867333` (Differs, Equal), Pricing / Phone source row `2393:867334` |
| Prototype | Flows "PD-03 — desktop" (from the worklist) and "PD-03 — phone" (from the 390 summary). The paths are on the notes card. Frame 10, the additions and the states are not linked |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. New references, six-digit under the [namespace decision](readable-reference-namespaces.md): `SYN-SRC-000024` (r1 $412.00 to 31 Aug; r2 $428.00 from 1 Sep to 31 Dec 2026), `SYN-SRC-000025` r1 ($842.00 per PK2 from 12 Oct, no end date, awaiting review), `SYN-SRC-000026` (DP-12; r2 $356.00 ended 30 Sep; r3 $362.00 reviewed 12 Oct). `SYN-SRC-0019` and `SYN-SRC-0023` appear exactly as on Cost sources. $428.00, the pack-of-two change and receipt `SYN-RCT-000081` come from Mappings & reconciliation. `SYN-EST-0144` v1 and `SYN-EST-0142` v3 exist on Intake & workload; their DP-25 lines are invented here. S6 and the `SYN-SRC-000027` row in S7 are illustrative |
| Retained captures | [Product pricing design r01](../reference/ui/products/product-pricing-design-r01/README.md): 35 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PD-03`, `/products/pricing`, Sales rail › Products › Pricing. Principal parents EST-04, EST-05, EST-07 and SCM-02 within the contract's retained set; all 78 parent IDs preserved. Capabilities unchanged: `products.read` and `shared.read`; supplier evidence needs `products.commercial.read` and current ES-03 reads; binding needs `products.sources.bind` |
| Page type (r20) | Review / comparison: one product revision against exact ES-03 source revisions. Supporting Register / worklist across products. A record-style header with view tabs (Sources, Affected estimates, History) and a flush right panel for Bind. Phone: read-only summary with a full-screen source view |
| Reused components | Rail · Sales, Shell / Top bar with the Conversations action, the Products side menu as on `653:38`, Record / View tab, Record / Banner, Grid / Header cell, Checkbox cell and Row actions cell, Tag, Button, Product thumbnail, Shell / Phone header · compact. New parts as in section 2 |
| Source authority | Section 1 and the opening list. This record distinguishes Dean's decisions, the built behaviour, the accepted designs it follows and the synthetic story |
| Incoming handovers | Products record and catalogue (exact `product_id` and `revision_id`, read-only identity); Products menu Pricing (worklist); ES-03 revisions the viewer may read; estimate versions using those sources, filtered to the ones the viewer may see |
| Outgoing handovers | Open in Cost sources (exact source and revision) for any source edit, review, tier, precision or validity change. Open or compare in the estimate for a deliberate refresh under ES-03 rules. F5 asks the owner in Conversations and links read-only to Mappings & reconciliation. CPQ and Purchasing may read the binding status. The page never edits a source, converts a unit or currency, totals money, reprices saved work or touches MYOB item mapping |
| Exceptions and recovery | Loading, no sources, could not load, restricted at two levels, expired, returned, mixed currencies, stale revision, read only, filtered empty, validation, saving, stale version, outcome unknown and recovered, recorded and list at its limit (S1–S16) |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

| ID | Rule or departure | Basis |
|---|---|---|
| D1 | Pricing is a Products workspace. No product in the URL opens the worklist; `product_id` and `revision_id` open that revision and survive reload | Contract routes |
| D2 | The header holds product identity, catalogue state and a switcher of exact revisions with their state and binding counts. A newer publication never moves a binding (S8, frame 8) | Contract: exact revisions |
| D3 | Bindings are a grid, one row each: source and revision, supplier and item, unit check, tier 1 cost with currency and tax basis, validity, ES-03 review, binding status. Replaces the built card per source | Pipedrive register preference; Cost sources C1 |
| D4 | Validity is assessed as at a date, default today: Known, Unknown, Expired, Not yet effective. No "expiring soon" | Built assessment; thresholds Not configured |
| D5 | Mapped needs exactly equal units. When units differ, Mapped is disabled and the binding is saved Unresolved with evidence, an owner and a reason. No conversion is offered | Contract; bind command |
| D6 | Every source change goes to ES-03 through Open in Cost sources | Contract |
| D7 | Affected estimates lists only versions the viewer may see, grouped by source with bands across the fixed columns. A limited or empty list says it is not a full impact check | Contract |
| D8 | With technical read only, "Supplier pricing is restricted" shows no supplier, figures, validity, estimates or count (frame 6). With commercial read but no ES-03 access, rows read "evidence unavailable" (S4, as built) | Contract; `productPricing` |
| D9 | No total across sources or estimates, ever | Contract |
| D10 | Bind is a flush right panel with a sticky footer. This departs from the page contract's "no new modal/drawer" and the built inline form, reusing the adopted snapshot pattern | Dean's Pipedrive preference; accepted here |
| D11 | The phone is read-only for estimators, with 16 px inputs, 48 px controls and the compact record header. Binding is desk work | Cost sources C7; phone header amendment |
| D12 | Sales rail with Products selected, Products menu unchanged with Pricing selected and no counts, Conversations in the top bar. Worklist filters live in the toolbar | Products R4 |
| D13 | Bindings are permanent. There is no edit or delete, and one source revision binds once to a product revision. A correction is a new binding to another source revision; both stay listed, newest first | Migration 0052; `productPricing` order |
| D14 | Estimates belong to the source: a line binds to a source, not a product revision, so no row names a product revision. "Current saved basis" is the built wording | `estimate_cost_source_bindings`; `readCostSource` |
| D15 | Mixed currencies arise through FX sources: AUD plus the original price and one reviewed, dated rate. PD-03 shows them as recorded, with no total or ranking, and converts nothing | [Reviewed FX decision](excel-import-reviewed-fx.md) |

Additions: F1 runs the ES-03 tier and date rule for a quantity and date, read-only with nothing saved, and shows the same refusals. F2 draws the recorded dates with an as-at marker. F5 adds row actions to ask the owner in Conversations and open the related unit issue in Mappings & reconciliation. Both links carry context only and change nothing.

## 5. Not decided

- **Building the page.** Moving the built page to this design, the new reads (Q10), the owner field and its migration (Q8) and the Mapped rule (Q9) each need their own go-ahead and pull request.
- **Later additions.** F4 after the worklist read; F3 later; F6 not taken.
- **Not drawn:** bulk actions on selected rows, the column settings panel, the Needs attention filter menu, a phone worklist, and the Products record's Pricing tab, which hands over here.

## 6. Corrections found by the audit

Three things in the first drawing were wrong against the code, and are corrected in the accepted frames:
1. It listed the oldest binding first and implied that a binding could be replaced or removed. Bindings are immutable and listed newest first.
2. Affected-estimate rows named a product revision. An estimate line links to the source only.
3. S7 said mixed currencies could not occur. FX sources exist, so S7 now shows the recorded original price and rate.

Smaller refinements: the column settings gear in every grid header, rebalanced columns, one wording for source review, the 1,000-character evidence limit, visible neutral tags on selected rows and a chevron on phone source rows.

## 7. Verification and limits

- Claude checked the frames with screenshots taken inside Figma, and scripted checks for overlaps, frames outside their section, overflow, clipped text at desktop and links leaving the page. The last run found none, apart from the tablet frame, whose content scrolls by design.
- **Present mode was not run**, so the prototype links are untested in play. The tablet, phone 320, additions and state frames are outside the flows and were checked by screenshot and script only.
- The 35 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A scan of the copies found no Font Awesome instance, no stray vector and no prototype link. They sit on the Captures page from y = 900,000.
- The named version "Product pricing — accepted" was saved on 31 October 2026 and seen in version history. After the save, Claude changed only the named-version wording in the page header and the File index row.
- Nothing is built by this record, so there is no application or device evidence, and no UI baseline.
