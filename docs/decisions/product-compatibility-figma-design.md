---
document_id: PPO-PD04-PRODUCT-COMPATIBILITY-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; restyling the built page, the new relationship words, lifecycle words and L/h unit are separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Product compatibility design — owner decision

On 24 October 2026 Dean asked Claude to design and build "the 'Compatibility, replacements and lifecycle (PD-04)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/products/compatibility` is built as a native synthetic implementation with acceptance pending, so this design sets what the built page moves to. Claude drew the page and presented it.

Claude then asked "Do you accept the PD-04 proposal?" and on 1 November 2026 Dean answered: "Accept all". That adopts departures D1–D14 and the recommended answers to Q1–Q7.

Claude drew the page from these sources:
- the [Products contract](../contracts/products-catalogue.md), on relationships, review and product use references;
- the [PD-04 page contract](../design/development/pages/scope-pd-04.md);
- the built page and rules: `src/products/components/compatibility.tsx`, `relationshipContent` and `relationshipOutcome` in `src/products/model.ts`;
- the accepted [Products design](products-figma-design.md), whose Q1 made PD-04 the home for comparing products;
- the [Engineering materials and substitutions](engineering-materials-substitutions-design.md), [Change impact review](engineering-change-impact-review-design.md) and [Equipment workspace](equipment-workspace-design.md) designs;
- the Products, Materials & substitutions, Technical queries and Bulletins & lifecycle Figma pages, read only, for the story.

Scope: `scope:PD-04` "Compatibility, replacements and lifecycle", route `/products/compatibility`, within the Products contract's retained parents. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, read model, route, migration, permission, grant or deployment. Nothing in it approves a product for installation, and it does not change any material line, substitution, change or asset.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PD-04 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| Departures D1–D14 | Accepted as recommended, 1 November 2026 | "Accept all". Section 4 |
| Q1 DP-25 against MD-20 | Resolved as recommended | Dean's brief asked for Conditional while Connector is Unresolved. The contract rule stands: it reads Unresolved with the drafted adaptor-kit condition, and a reviewer records Conditional once `SYN-SUB-000015` is accepted on EN-04 and Connector is Met |
| Q2 Who reviews | Resolved as recommended | Engineering reviews, through a technical reviewer. The product owner records and owns the relationship. Never the same person. No grant changes here |
| Q3 Standard criteria | Resolved as recommended | A starting set per product kind that the author can extend. Pumps: supply voltage, control signal, flow range, pressure, connector, mounting, wetted materials. Controllers: supply voltage, I/O, fieldbus, mounting, firmware and settings. Valves: connection, pressure rating, coil voltage, flow coefficient, materials. Drives: supply, torque, mounting, control. Each criterion needs evidence and an owner |
| Q4 What estimators see | Resolved as recommended | Conditional relationships with their conditions in words. Not reviewed and Unresolved stay visible but flagged and are never offered as a ready alternative. Rejected stays visible as evidence |
| Q5 Where lifecycle is recorded | Resolved as recommended; build separate | Product lifecycle (Current, Last-time buy, Discontinued, Unknown) is recorded here on the product revision with source and date. Support dates and installed impact stay in EQ-07, which reads PD-04's chain as evidence. Supported becomes Current across Products |
| Q6 Flow in L/h | Resolved as recommended; build separate | Add L/h as a typed flow unit, still never converted, so DP-25 and MD-20 compare as typed values. The contract's vocabulary has L/min only until that is built |
| Q7 Compare limit | Resolved as recommended | Up to four products |
| Named Figma version | Saved by Dean, 1 November 2026 | Dean: "I have saved the named version as Product compatibility — accepted" (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Product compatibility · PD-04" `2393:868573`, under "— Sales —", after Product pricing. The page header `2393:868574` holds the conformance declaration; the notes card `2399:3569` lists D1–D14, Q1–Q7, the flows and what is not drawn. File index row `3090:10734` |
| Desktop 1440 | Relationship register `2394:867833`; compare three pumps `2395:872036`; relationship record, full length `2395:880481`; review with conditions `2396:874453`; replacement chain `2397:873778`; needs reassessment `2398:879247`; hand over to EN-06 `2396:875064` |
| Tablet 1024 | Compare `2398:889853` |
| Phone 390 and 320 | What replaces this product `2398:882794` and `2398:882946`; relationship summary `2398:882857` and `2398:883009` |
| States | Loading `2398:893236`; nothing matches `2398:893265`; could not load `2398:893286`; read-only `2398:893301`; units not comparable `2398:893311`; evidence missing `2398:893325`; uses partly hidden `2398:893341`; reviewer is the author `2398:893347` |
| Parts | Moved on acceptance to Components › "Components · Sales parts" `1095:257410`: PD-04 / Relationship grid header `2394:867759`, Relationship grid row `2394:867797`, Group band `2394:867829`, Compare row `2395:872023`, Criterion row `2395:880467`, Chain step `2397:873759`, Chain link `2397:873767` |
| Prototype | Flows "PD-04 — desktop" (from the register) and "PD-04 — phone" (from What replaces this product at 390). The paths are on the notes card. The tablet, phone 320 and state frames are not linked |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST; the review form is drawn at Mon 12 Oct, 16:38, before the conclusion it records. `SYN-MAT-000031`, `SYN-SBS-000007`, `SYN-SUB-000011`, `SYN-DWG-000318`, `SYN-PPO-BLD-000042`, `SYN-PPO-AST-000102` and ClimaLogic notice CL-EOL-CX2 rev 2 appear exactly as on their owning pages. New references: `SYN-REL-000006`–`000016`, `SYN-PROD-MD20`, `SYN-PROD-AK8`, `SYN-PROD-CX2`, `SYN-PROD-CX4`, `SYN-PROD-IO416`, `SYN-PROD-IO16`, `SYN-SUB-000015`, ClimaLogic CL-LTB-IO16 and `SYN-PPO-AST-000188` |
| Retained captures | [Product compatibility design r01](../reference/ui/products/product-compatibility-design-r01/README.md): 20 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PD-04`, `/products/compatibility`, Sales rail › Products › Compatibility. Parents retained from the Products contract: CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08, IF-02/06/10/12/14; all 78 parent IDs preserved. Capabilities unchanged: `products.read`, `products.relationship.edit`, `products.relationship.review` |
| Page type (r20) | Document & evidence workspace; supporting Review / comparison. The register uses the grid, the relationship record uses the shared record layout, and review and handover are side forms |
| Reused components | Rail · Sales, Shell / Top bar with the Conversations action, the Products side menu, Grid / Header cell, Checkbox cell and Row actions cell, Tag, Button, Record / Header, View tab, Field, Section heading and History item, Shell / Phone header · compact. New parts as in section 2 |
| Source authority | Section 1 and the opening list. This record distinguishes Dean's decisions, the built behaviour, the accepted designs it follows and the synthetic story |
| Incoming handovers | Exact product revision and company context from Products PD-01 (read-only); supplier submittals from Technical queries EN-04 as evidence links (read-only); links back from Materials EN-06 and Bulletins & lifecycle EQ-07 to a relationship |
| Outgoing handovers | Materials & substitutions EN-06 (substitution evidence), Change review EN-07 (change) and Bulletins & lifecycle EQ-07 (replacement advice). ES-03 source review where a source changed. PD-04 sends evidence only: it never edits a material line, substitution, change or asset, never converts units and never approves installation |
| Exceptions and recovery | Loading, nothing matches, could not load, read-only, units not comparable, evidence missing, uses partly hidden, reviewer is the author |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

| ID | Rule or departure | Basis |
|---|---|---|
| D1 | DP-25 against MD-20 reads Unresolved, not Conditional, and keeps the drafted condition "Compatible if fitted with hose adaptor kit SYN-PROD-AK8 r01". EN-06's acceptance of `SYN-SBS-000007` remains EN-06's own decision | Contract; `relationshipOutcome` refuses Conditional unless every criterion is Met. Q1 |
| D2 | Five relationship words: Compatible with, Replaces, Replaced by, Alternative to, Requires accessory. Replaces and Replaced by are one stored relationship read from each side | Dean's brief. The app stores only Compatibility and CandidateReplacement today |
| D3 | Criteria read Met, Unresolved or Not met. Conclusions read Not reviewed, Conditional, Unresolved or Rejected, plus the derived Needs reassessment. Every status has words, never colour alone | Brief and contract. The app stores Met, Unknown and NotMet |
| D4 | Lifecycle reads Current, Last-time buy, Discontinued or Unknown, always with its source and date | Brief. Products and the app say Supported and also have Retired. Q5 |
| D5 | The register collapses the rail to icons so all eight columns fit at 1440 without horizontal scroll. Rows group by conclusion, and the bands span the checkbox and settings columns in the group colour | Pipedrive grid preference; band rule |
| D6 | The Products menu keeps its five pages. Under Compatibility, Quick views becomes Compatibility views: Needs reassessment, Awaiting review, Replacement chains | Views follow the selected page |
| D7 | Compare takes two to four exact revisions, states each difference in words and tints differing cells. Mismatched units and unknown values read "Not comparable", and nothing is calculated | Contract: no unit conversion. Products Q1 |
| D8 | The relationship record uses the shared record layout: header, exact-revision strip with the content hash, details column, tabs Criteria, Evidence, Review, Uses, Handovers, History | Accepted record pattern on Products `653:38` |
| D9 | Review is a side form. Conditional is shown but disabled with its reason. The reviewer can never be the author | Contract: separate reviewer, exact content hash |
| D10 | A changed revision on either side marks Needs reassessment. Reassessing creates a successor and keeps the predecessor unchanged | Contract: an immutable successor retains its predecessor |
| D11 | Uses show only what the viewer may see, with the observed version, and always say others may be hidden. Never "no impact" | Contract: `product_use_references` |
| D12 | Three handover cards name the owning page: EN-06 substitution, EN-07 change, EQ-07 replacement advice. Each sends evidence only | Contract and page contract |
| D13 | The phone uses the compact record header, with Conversations under More on records, and a full-width 48 px main action. It is drawn at full scroll length | [Phone header amendment](phone-header-amendment.md), rule P3 |
| D14 | PD-04 uses Products' `SYN-PROD-DP25`. Materials & substitutions and Search show `SYN-PRD-DP25`, an existing difference left unrewritten | Product pricing Q6; references are never rewritten |

Two more departures from the [page contract](../design/development/pages/scope-pd-04.md), declared with this record rather than on the notes card: the register is a grid, not readable cards, and review and handover are side forms, not "no new modal/drawer". The accepted design governs.

## 5. Not decided

- **Building the page.** Moving the built page to this design, the five relationship words and their storage (D2), the wording of criteria and lifecycle (D3, D4, Q5), the L/h unit (Q6), the standard criteria (Q3) and the estimator rule (Q4) each need their own go-ahead and pull request. The Products contract still describes what is built and is not changed here.
- **Other pages.** Products `653:38` keeps Supported until its next change.
- **Not drawn:** relationship import, the Evidence and History tabs on their own, a phone review form.

## 6. Differences left between pages

These are recorded, not changed:
- [Product pricing Q5](product-pricing-figma-design.md) keeps DP-25 at r03 · T2 and says Products and this page align at their next change. This page was accepted as drawn at r01 · T1.
- `SYN-SUB-000015` is new here and is not yet on Technical queries EN-04. EN-06's accepted criteria for `SYN-SBS-000007` have no connector criterion.
- Bulletins & lifecycle tells its story as at Fri 16 Oct 2026; this page uses Tue 13 Oct. The ClimaLogic notice and the CX4 advice agree.

## 7. Verification and limits

- Claude checked the frames with screenshots taken inside Figma, and scripted checks for overlaps, frames outside their section, truncated text, clipped text and links leaving the page. The last run found none, apart from the record scrolled behind the two side forms, which is intended.
- **Present mode was not run**, so the prototype links are untested in play.
- The 20 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A scan of the copies found no Font Awesome instance, no stray vector and no prototype link. They sit on the Captures page from y = 1,400,000.
- After acceptance Claude changed status wording on the page, the "Recommended" wording in the notes and the location of the parts, and added the File index row. Two small corrections followed, found while checking the captures: the register heading "Interface criteria" was clipped and now reads "Criteria", and the register footnote gained padding.
- Dean saved the named version "Product compatibility — accepted" on 1 November 2026: "I have saved the named version as Product compatibility — accepted". Claude did not open version history to confirm it. After the save, Claude changed only the named-version wording in the page header.
- Nothing is built by this record, so there is no application or device evidence, and no UI baseline.
