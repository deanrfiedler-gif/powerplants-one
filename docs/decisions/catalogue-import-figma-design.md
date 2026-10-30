---
document_id: PPO-PD05-CATALOGUE-IMPORT-FIGMA-DEC
date: 2026-10-31
owner: Dean Fiedler
status: Owner-accepted design; restyling the built page, the Submit for review step, the Abandoned state and the duplicate matching rule are separate
source_commit: 6e939bf0b937fc05f9e477d1cd14f8838c92fd9a
versioning: git
---

# Catalogue import design — owner decision

On 24 October 2026 Dean asked Claude to design and build "the 'Catalogue import and exception review (PD-05)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/products/import` is built as a native synthetic implementation with acceptance pending, so this design sets what the built page moves to. There is no accepted HTML, so the composition is new. Claude drew the page and presented it with its recommended answers.

Asked "Do you accept the PD-05 design and its recommended answers?", Dean answered on 31 October 2026: "Accept and lock in". That adopts D1–D15, departures X1–X5 and the recommended answers to Q1–Q7. Departure X6 was named by Claude after that answer: section 4 says why, and Dean can overrule it.

Claude drew the page from these sources:
- the [Products contract](../contracts/products-catalogue.md), "Staged import";
- [ADR-0048](ADR-0048-products-native-catalogue.md) and the [PD-05 page contract](../design/development/pages/scope-pd-05.md);
- the built page and rules: `src/products/components/import.tsx` and `src/products/imports.ts`;
- the accepted [Excel estimate import](excel-import-figma-design.md) and [Products](products-figma-design.md) designs;
- the Product publication, Product pricing and Products Figma pages, read only, for people and the story.

Scope: `scope:PD-05` "Catalogue import and exception review", route `/products/import`, within the Products contract's retained parents. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, read model, route, migration, permission, grant or deployment. Applying an import creates drafts only: it never publishes, converts a unit, merges similar records or edits a reviewed plan.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design PD-05 in Figma | User decision, 24 October 2026 | Dean's request quoted above |
| D1–D15 and departures X1–X5 | Accepted as recommended, 31 October 2026 | "Accept and lock in". Section 4 |
| Departure X6 | Claude's correction after acceptance | Section 4 |
| Q1 Spreadsheets later | Resolved as recommended | Not in this increment. Only PPO synthetic catalogue 1 JSON stays configured. A supplier spreadsheet or CSV format needs its own ADR, a redacted sample and mapping rules before it is designed |
| Q2 Who stages and who reviews | Resolved as recommended; no grant changes here | Products authors stage and map (`products.import.stage`). A different Products reviewer reviews (`products.import.review`). The person who staged it may then apply (`products.import.apply`), because the review binds the exact hash. The story has Alex Nguyen staging and applying, and Jordan Hale reviewing |
| Q3 Submit for review as its own step | Resolved as recommended; build separate | Yes, giving the In review state, so that reviewers see only plans the stager declares ready. Today any Mapped plan with no errors can be reviewed |
| Q4 Abandoned state | Resolved as recommended; build separate | Yes. A stager can close a batch that will never be applied. Its file and plans stay as evidence, and identical content may be staged again |
| Q5 Excluded rows kept for audit | Resolved as recommended | Yes, as the contract requires. Original values, row number and rationale stay with the batch and appear in every plan and in the result |
| Q6 Is 50 rows enough | Resolved as recommended | Yes for the synthetic pilot. Measure a real supplier file before raising it; the 12,000-byte bound usually limits first |
| Q7 Story extension | Resolved as recommended | This story assumes more accessories and pumps on the catalogue (`SYN-PROD-000041` to `000050`) and uses `SYN-PROD-000051` to `000054` for new products. Rows 5, 8 and 14 carry `SYN-PROD-000039`, `000038` and `000055` as supplied, and create nothing. Products `653:38` stays unchanged |
| Named Figma version | Awaiting Dean's yes | "Catalogue import — accepted" (section 7) |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Catalogue import · PD-05" `2404:211`, under "— Sales —", after Product compatibility. The page header `2404:212` holds the conformance declaration; the notes cards `2412:889561` and `2412:889639` list D1–D15, Q1–Q7, the flows and what is not drawn. File index row `2912:8526` |
| Desktop 1440 | 1 Import history `2404:280`; 2 Stage file `2405:436`; 3 Map rows with exceptions `2406:877265`; 4 Row detail `2407:880062`; 5 Plan summary `2408:883379`; 6 Review `2410:2225`; 7 Returned and corrected `2410:885638`; 8 Apply confirmation `2410:886177`; 9 Applied result `2410:895156` |
| Tablet 1024 | Map rows `2410:895932` |
| Phone 390 and 320 | Plan summary `2410:902260` and `2410:902440`; review `2410:902320` and `2410:902500`; mapping is a desktop task `2410:902398` |
| States | Loading `2412:887306`; No imports yet `2412:887315`; Could not load `2412:887330`; No permission `2412:887340`; File refused, over the limit `2412:887348`; File refused, format not supported `2412:887365`; Unresolved errors block submission `2412:887375`; Target changed since mapping `2412:887398`; Apply failed and rolled back `2412:887408`; Outcome unknown `2412:887418`; Batch already applied `2412:887441`; Reviewer staged the batch `2412:887451` |
| Parts | Moved on acceptance to Components › "Components · Sales parts" `1095:257410`: PD-05 / Action cell `2406:877264` (Set, Missing) and PD-05 / Phone change row `2410:902255` |
| Prototype | Flows "PD-05 — desktop" (from Import history) and "PD-05 — phone" (from the 390 plan summary). The paths are on the notes card. Opening plan 3 from the plan history stands in for the undrawn plan 3 review. The tablet, phone 320 and state frames are not linked |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Fictional supplier Northgate Fluid Systems (`SYN-NFS`), Company A, file `nfs-dosing-2026-10-12.json`, 18 rows. Plan 1 has 11 Resolve, 4 New, 2 Exclude (discontinued) and row 14 blocked. Row 14 is `DP25-25LH`, sold per pack of 2 and similar to DP-25, matching the Product pricing story for the same item. Plan 2 excludes it (11, 4, 3) and is returned over the row 4 rationale. Plan 3 corrects that, is reviewed and creates 15 Drafts. All hashes and proposed IDs are illustrative |
| Retained captures | [Catalogue import design r01](../reference/ui/products/catalogue-import-design-r01/README.md): 27 icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:PD-05`, `/products/import`, Sales rail › Products › Import. The contract's retained parents CRM-08, DOC-01/02, ENG-02–06, EST-02–08, NFR-05, SCM-02/03/08 and IF-02/06/10/12/14; all 78 parent IDs preserved. Capabilities unchanged: `products.import.stage`, `products.import.review` and `products.import.apply` |
| Page type (r20) | Form / guided workflow (Stage, Map rows, Review, Apply), supporting Review / comparison (row detail, plan summary, exact before and after) and a Register / worklist for import history |
| Reused components | Rail · Sales (Expanded and Collapsed), Shell / Top bar with the Conversations action, the Products side menu as on `653:38`, Grid / Header cell, Cell and Row actions cell, My Work / Group row, Tag, Button, Record / Banner, Filter chip and Section heading, Wizard / Step and Excel confirmation row, Shell / Phone header · compact. New parts as in section 2 |
| Source authority | The opening list. This record distinguishes Dean's decisions, the built behaviour, the accepted designs it follows and the synthetic story |
| Incoming handovers | Products menu Import, with the exact company and workspace; a history row opens its batch (`batch_id`); Stage file takes the exact provider and Company A. Data quality AD-03 and Mappings & reconciliation AD-05 may link to a batch read-only |
| Outgoing handovers | An applied batch hands its Drafts to Product publication PD-02 by `product_id` and `revision_id`; targets open Products PD-01 records; pack pricing stays with Product pricing PD-03 and ES-03. The page never publishes, converts a unit, merges similar records or edits a reviewed plan |
| Exceptions and recovery | The twelve states in section 2. Outcome unknown reads the original operation; a retry sends the identical request |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. Display rules and departures

| ID | Rule | Basis |
|---|---|---|
| D1 | Four steps (Stage, Map rows, Review, Apply) with the accepted step cards and a bottom action bar that says what happens next | Excel import design; page contract tasks 1–5 |
| D2 | History is a grouped register: Returned, In review, Reviewed, Mapping and Staged first, then Applied and Abandoned. No counts in the menu | Pipedrive grid preference; Products R4 |
| D3 | Staging shows what PPO read before anything is stored: rows and bytes against the limits, SHA-256 and the same-content check. Refused files are not kept | Contract |
| D4 | Every row needs Resolve, New or Exclude with a rationale. The Action cell reads "Choose" in red until decided | Contract |
| D5 | Exceptions stay visible: banner, Exceptions column and the filters Needs decision, Exceptions, Duplicates and Excluded | Contract; Dean's brief |
| D6 | Row detail shows the exceptions, the duplicate candidate side by side, why each action is or is not available, and the rationale (X6) | Products snapshot |
| D7 | Similar records are never merged. Resolve is offered only for one exact provider, company and entity key | Contract |
| D8 | Units stay as supplied: "pack of 2" never becomes "each". Row 14 is excluded and pack pricing stays in Pricing | Contract; [Product pricing Q3](product-pricing-figma-design.md) |
| D9 | Duplicate matching ignores case, spaces and hyphens (X3) | Dean's brief |
| D10 | Plan summary gives counts by action, exceptions left, the comparison hash and the whole change set. Submit for review is unavailable while errors remain | Contract; Dean's brief |
| D11 | Review shows the exact plan read-only, the bound hash and the independence checks. Returned needs a reason; the correction becomes a new plan and the returned plan stays | Contract |
| D12 | Apply is an in-page confirmation listing every Draft it will create, with three confirmations kept under the applier's name | Excel import Confirm and save |
| D13 | An applied batch is final. The result links each Draft to Publication; excluded rows create nothing and stay as evidence | Contract |
| D14 | Phone: plan summary and review only, compact record header, sticky 48 px action and 16 px inputs. Mapping says it is a desktop task | Dean's brief; phone header amendment |
| D15 | Story counts: 18 rows are 11 Resolve, 4 New, 2 Exclude and row 14. Excluding row 14 makes the applied plan 11, 4 and 3 | Dean's brief |

| ID | Departure | Built page or contract today |
|---|---|---|
| X1 | Mapping and In review split the built Mapped state behind an explicit Submit for review (Q3). Display also keeps Staged, Returned, Reviewed and Applied | `product_imports.state` holds Staged, Mapped, Reviewed, Returned and Applied |
| X2 | Abandoned is a proposed state (Q4) | No such state or command |
| X3 | Duplicate candidates ignore case, spaces and hyphens, so DP25 meets DP-25 | `src/products/imports.ts` compares whole titles and models in lower case, so it would not flag DP25 |
| X4 | Mapping frames collapse the rail so that all nine columns fit. The tablet moves Kind and Parent into the row detail | Native cards |
| X5 | No row checkboxes in the import grids: there is no bulk import command | The Pipedrive register pattern has a checkbox column |
| X6 | Row detail is a flush right panel | Page contract: "No new modal/drawer". The presentation to Dean said this page had no modal. A flush panel departs from that contract line in the same way as [Product pricing D10](product-pricing-figma-design.md), so Claude declares it here and on the page |

Apply confirmation stays in the page, so it adds no dialog. The Products contract is not changed: it describes the built behaviour, and X1 to X3 change it only when they are built.

## 5. Not decided

- **Building the page.** Moving the built page to this design, the Submit for review step (Q3), the Abandoned state (Q4) and the duplicate matching rule (X3) each need their own go-ahead and pull request.
- **Real formats.** Spreadsheets and supplier formats stay Not configured (Q1).
- **Not drawn:** pasted-JSON staging, the operating-system file chooser, the Abandon confirmation, open history filters, row detail for a Resolve row, and the plan 3 review, which is the plan 2 frame with Reviewed chosen.

## 6. Consequences

- The `scope:PD-05` register entry and page contract cite this design and its captures. Visual status stays "Needs review": the built page has not moved.
- Later changes receive a new named version and a new capture revision folder.
- No parent requirement ID changes.

## 7. Verification and limits

- Claude checked the frames with screenshots taken inside Figma, and scripted checks for overlaps, frames outside their section, clipped text and links leaving the page. The last run on 24 October found none.
- **Present mode was not run**, so the prototype links are untested in play.
- The 27 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`. A scan of the copies found no Font Awesome instance, no stray vector and no prototype link. They sit on the Captures page from y = 1,100,000.
- The first exports showed swapped icons that should be hidden in the step cards. Claude re-hid every icon to match its source frame, then re-exported captures 02 to 10. Three retained images were opened and read by eye (05, 08 and 15); the rest were checked by scan and PNG header.
- After the owner's acceptance Claude changed the page's status wording, departure X6, the D6 wording and the notes card's answers, moved the two parts to Components and added the File index row. One visible change reached the frames: the "Changes · 18 rows" label on the two phone review frames gained its 16 px left margin.
- Nothing is built by this record, so there is no application or device evidence, and no UI baseline.
