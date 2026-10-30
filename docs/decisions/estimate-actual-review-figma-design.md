---
document_id: PPO-ES09-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation, financial definitions and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Estimate-to-actual review design — owner decision

The issued [ES-09 r01 workspace](estimate-actual-outcome-review-design.md) drew the module only: no shell, no rail, and five view tabs under a context card. On 23 October 2026 Dean asked Claude to bring it onto the current Figma shell and record layout as a proposal, holding its rules exactly and keeping its fixture figures and SYN-EAR labels. Claude drew the page from these sources:
- the r01 decision, HTML and [22-section report](../reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-Report-r01.md);
- the [estimate-to-actual feedback proposal r05](../blueprints/estimate-actual-feedback-design.md), in which nothing is adopted;
- the register entry `scope:ES-09` and its [design page](../design/development/pages/scope-es-09.md);
- the FN-03 record layout and side forms, for the shell pattern, and FN-06 as a proposal only.

Claude asked "Do you accept the ES-09 proposal?". On 30 October 2026 Dean answered: "Accept all". This adopts departures D1–D12 and the recommended answers to Q1–Q7.

Scope:
- Register entry `scope:ES-09`, destination `/estimating/outcomes`, which is not built.
- Parent requirements EST-03, EST-04, EST-06, PRJ-05, PRJ-08, SVC-10, SCM-05, SCM-06, SCM-07, FIN-04, FIN-07, NFR-01, NFR-07 and NFR-09. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or integration. It adopts no margin, posted-cost or committed-cost definition, no materiality threshold, no variance reason or allocation registry, and no reference type code for an outcome review. D-017 stays open.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Draw ES-09 on the current shell | User decision, 23 October 2026 | Dean's brief: "design and build the 'Estimate-to-actual outcome review (ES-09)' UI page in Figma as a proposal for my review" |
| Departures D1–D12 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Which jobs need an outcome review | Resolved as recommended | Every delivered job with an accepted Project Quote, and every quoted Service work order, opens a review at closeout. Accepted Sales Quotes stay out for now (r05 decision 1f). There is no value threshold, because a threshold is a materiality policy and none is adopted. Major jobs also keep the pre-bid review (r05 decision 1d) |
| Q2 Who prepares and who reviews | Resolved as recommended | The delivery owner prepares. An Estimating and commercial reviewer who is neither the preparer nor the job's estimator reviews and signs off. Finance validates the basis but does not sign off. Names stay fictional and capabilities proposed until AD-01 grants them |
| Q3 When a review is due | Resolved as recommended | It opens automatically when PJ-09 closes the project or the work order closes. The preparer submits within 20 working days and the reviewer concludes within 10 working days of submission. A provisional conclusion is allowed, so open matters do not hold the learning back |
| Q4 Decide D-017 before building | Resolved as recommended | No. ES-09/A1 comes first (Service work orders, P09-reviewed quantities only, margin withheld with its reason named). FD-05 and FD-06 are resolved under D-017 before any Projects cost read is trusted and before any margin is shown |
| Q5 Five review states | Resolved as recommended | Not started, Collecting, In review, Returned and Reviewed, with provisional and not comparable shown as qualifiers (D3) |
| Q6 The r01 claim and Returns & claims | Resolved as recommended | SYN-CLM-00318 keeps its r01 identity and links to Returns & claims (SC-08) by page only. SC-08 draws the DP-25 pump claims instead. They align when SC-08 owns real claims |
| Q7 Which ES-09 meaning is canonical | Resolved as recommended | The register meaning, estimate-to-actual outcome review. This answers item 1 of r01 report section 20.5. The estimating screen specification still uses the identifier for issue and response and is not edited here |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Estimate-to-actual review · ES-09" `2244:50439`, at the named version "Estimate-to-actual review · ES-09 — shared record layout, accepted". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Outcome register `2244:733390` (flow start "ES-09 — desktop"); SYN-EAR-0001 record, Overview, full length `2245:735333`; comparison basis declaration `2245:747016`; SCR-CLOTH line drill-down `2245:748014`; possible-duplicate block `2245:751599`; review and sign-off `2245:752746`; hand to ES-10 `2245:753618` |
| Tablet and phone | Tablet 1024 register `2245:776157` and record `2245:776432`; phone outcome summary 390 `2245:766098` (flow start "ES-09 — phone") and 320 `2245:766267`; reviewer approve screen 390 `2245:766436` and 320 `2245:766490` |
| States | Loading `2245:777244`, nothing matches `2245:777891`, could not load `2245:778481`, read-only `2245:788978`, actuals incomplete `2245:798257`, possible duplicate `2245:798319`, definition missing `2245:790022`, changed source after review `2245:791070`, returned `2245:798372` |
| Notes card | `2248:9431`: D1–D12, Q1–Q7 with the adopted answers, flows and what is not drawn |
| Page parts | Rail · Estimating with Outcomes `2244:50786` (Expanded `2244:50652`, Collapsed `2244:50785`), Outcome / Register grid header `2244:733337` and row `2244:733389`. At acceptance they moved to the Components page `1:4`, sections "Components · Shell and navigation" and "Components · Estimating parts" |
| Shared parts | Rail items, Shell top bar with the Conversations action (badge 3), Menu heading, item and edge, Grid header cell, Grid cell, checkbox and row-actions cells, Group row, Summary cell, Tag, Button, Record header, View tab, Field, Section heading, Banner, History item, Shell / Phone header · compact |
| Prototype | Flows "ES-09 — desktop" and "ES-09 — phone": 62 links. Not played in Present mode |
| Retained captures | [Estimate-to-actual review design r01](../reference/ui/estimating/estimate-actual-review-design-r01/README.md): 22 icon-free PNGs at exact frame size, with hashes. The capture copies are on the Captures page from y = 480,000; the File index row is in Table / Estimating & quotation |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-09` Estimate-to-actual outcome review, destination `/estimating/outcomes`; the parent requirements listed above, unchanged. Reached from the proposed Outcomes item in the Estimating rail |
| Page type (r20) | Review / comparison, with Register / worklist and Record detail. Phone: one summary page with the compact record header and a sticky action bar, and a full-screen approve screen |
| Reused components | Section 2, shared parts |
| Incoming handover | Read only: issued and accepted estimate cost versions (Estimation Wizard, ES-08 workbench), the accepted quotation and issue (Quotations, Quotation detail), approved changes with their own cost basis (Change review EN-07), actuals in FN-03 categories, purchase and receipt records, Service-reviewed labour, supplier claims (Returns & claims), service stock, the closeout trigger (PJ-09) and definitions from FN-06, which is a proposal and is not adopted |
| Outgoing handover | Lessons prepared locally for Reference cases ES-10 and Knowledge authoring DK-05: prepared, not sent, and no record is created in either. Outstanding matters stay owned on the review. ES-09 never changes a formula, input range, parts mapping, labour rate, catalogue price, estimate, quotation or past result, and closes no project, work order, claim or Finance matter |
| States shown | Section 4 |
| Departures | Section 4 |
| Verification | Section 7 |

## 4. What the design shows

The story is synthetic, as at Tue 13 Oct 2026, 09:00 AEST. Sam Whitfield is signed in as the reviewer; Jordan Blake prepares; Dana Okafor estimated; Priya Raman validates for Finance; Lee Nakamura is the read-only observer. All r01 figures are kept: comparison basis 51,339.20, attributable actual 60,933.54, delivery variance +9,594.34 (+18.69% of 51,339.20), +10,509.54 against the issued 50,424.00, the 3,620.00 scope reduction, the 4,500.00 discount at close, and five drives in actual cost with 1,850.00 as an owned outstanding matter.

### Desktop

- **Outcome register**: closed or closing jobs grouped by review state, with reference, state, comparison basis, actuals, open matters, next step owner, customer and site, delivery target, estimate and quotation, and next action. It has no margin column and shows no amounts.
- **Outcome record**: the shared record layout with a comparison basis strip and a details column (review, commercial references, delivery and site, definitions in use). Tabs: Overview, Basis, Comparison, Sources, Matters, Review, Lessons and History. The Overview carries the outcome at a glance, the declared basis, the comparison by cost category and line, the quantity, rate and joint effects, the reconciliation with its identity check, sources of actuals, price movements, outstanding matters, variance reasons, review and sign-off, lessons and recent history.
- **Focused frames**: declare the comparison basis; drill down into a line; resolve a possible duplicate; conclude as provisional, with "Reviewed — complete" not offered while matters are open; prepare the ES-10 handover.

### States

Loading, nothing matches, could not load, read-only (amounts and narrative withheld), actuals incomplete (SYN-EAR-0005), possible duplicate, definition missing (SYN-EAR-0003, quantity only), changed source after review (frozen +9,594.34, live +10,034.34, successor SYN-EAR-0001-S2) and returned.

### Tablet and phone

At 1024 the rail collapses, the side menu or details column collapses, and Return to preparer leaves the record header. On the phone the compact record header leads to the title, state, comparison basis, outcome tiles, the lines as a list, price movements, matters, and a sticky 48 px Review and sign off action. The approve screen is full screen, with 16 px input text.

### Departures, accepted

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | The r01 rules hold exactly: three separate basis records and a declaration that overwrites none; price movements outside cost; an approved variation's selling price refused as a cost budget; commitments, captured hours and customer invoices refused as cost; a shared source key blocks as a possible duplicate; no conversion without a reviewed basis; an unissued credit never netted | r01 decision; report sections 4 and 7–10 |
| D2 | The current shell and the FN-03 record layout replace r01's module-only workspace, context card and five view tabs | Dean's brief; phone header amendment |
| D3 | Five review states: Not started (closed job, no review), Collecting (r01 Draft, AwaitingEvidence), In review (ReadyForReview, InReview), Returned, Reviewed (Reviewed, ReviewedProvisional). Not comparable stays a visible qualifier | Dean's brief; r05 section 6.2 |
| D4 | The register shows no amounts, so a restricted value cannot leak into a list, search or export | Report sections 6 and 11.2; D-017 open |
| D5 | A new Outcomes item after Reviews & approvals in the Estimating rail, with the chart-column icon | Dean's brief; the `scope:ES-09` destination |
| D6 | Lines group by the estimate's cost schema with subtotals that state their denominator. Sources group by the FN-03 categories, whose map is the FN-06 proposal and is not adopted | Report section 12; FN-03, FN-06 |
| D7 | Variance is actual − estimated with an explicit sign and the words "more cost"; a percentage states its denominator or shows n/a; negatives in parentheses; Not established, never 0.00; colour is never the only signal | Report sections 9.1 and 15 |
| D8 | Decisions open in 480 px right side panels, matching FN-01 and FN-03 side forms. The conformance standard prefers centred dialogs for short decisions, so this is a declared departure | PPO-UI-CONFORMANCE |
| D9 | Each proposed reason code carries evidence and an evidence owner, who keeps the evidence current. Codes name causes, never people; remainders stay visible as unexplained | Report section 9.6 |
| D10 | r01 SYN-EAR-0001–0005 and every SYN-PPO- reference are unchanged. Added for the 13 October story: submission on Fri 9 Oct, claim on Mon 12 Oct, materiality declared by Sam Whitfield, the reason shares, lessons L1–L3, the Glasshouse 4 register row, the r01 model-check duplicate SYN-INV-88118, and freight 4,620.00 derived from r01's successor figure 10,034.34. r01 due dates are kept, so its matters show Overdue | Dean's brief: keep r01 identities |
| D11 | Lessons hand on as local proposals, with the refusal stated on screen | Report section 14.2 |
| D12 | Exact r01 timestamps are shown in AEST: r04, saved 26 May 23:40 UTC, appears as 27 May 2026 09:40 | r01 fixture |

## 5. Not decided and not drawn

- **Building the page.** The first slice stays ES-09/A1 as r01 sets it out, and it needs its own authorisation and pull request. Commercial lineage, a versioned basis record and server-enforced restricted reads do not exist yet (r01 report section 14.3).
- **Still open from r01 report section 20.5:** the reference type code, the owners and contents of the variance reason and allocation registries, materiality per size band, non-punitive use as policy, and finding narrative visibility.
- **Not drawn:** the successor review record, the History and Matters tabs as separate views, observer export, More panel overlays, a phone register list, 200% zoom.
- **Related records not edited:** the Reference cases ES-10 page, drawn before this one, says ES-09 is not drawn and shows the r01 Northbank job as Draft / Partial; it aligns when ES-10 is accepted. The Returns & claims claims (Q6). Other Estimating rail instances do not gain the Outcomes item until they are next changed.

## 6. Changes at lock-in

After the acceptance Claude made only record-keeping changes to the page: the header, status and notes now say accepted and list the adopted answers; "Proposal" was removed from the register banner; the note that ES-10 and DK-05 were not drawn was corrected, because both have since been drawn as separate proposals; "(proposal)" was removed from the rail's name; and the parts moved to Components. No layout, figure or rule changed.

## 7. Verification

- Before acceptance a scripted check found no overlapping frame and nothing outside its section, and a measured check of truncated text found clipped cells, which were fixed by shorter wording and rebalanced columns. Frames and record sections were inspected by screenshot, and figures were compared with r01 report section 12.
- The prototype has 62 links and two flows. It was not played in Present mode.
- The 22 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder` (640 in all); a check after the swap found none left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/estimate-actual-review-design-r01/README.md).
