---
document_id: PPO-ES04-ESTIMATE-REVIEW-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design, 30 October 2026; native implementation, commercial policy and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Estimate review design — owner decision

The accepted [Reviews & approvals design](estimate-reviews-design.md) drew the queue of ES-04 estimate reviews and ES-05 quotation approvals. Its record window opens "Open review", `/estimating/estimates/[id]/review`, where decisions are recorded. That page is built (`EstimateReview` in `src/components/estimate-review.tsx`) but had no Figma design; its earlier design is the [ES-04 r01 HTML](estimate-review-pricing-exceptions-design.md).

On 23 October 2026 Dean asked Claude to design that page in Figma as a proposal for his review, on the current shell and record layout, following the [review rules](estimating-review-native.md) exactly. Claude drew it and asked: "Do you accept the ES-04 proposal and the recommended answers to Q1–Q7?" On 30 October 2026 Dean answered: "Accept and lock in".

Scope:
- Register entry `route:/estimating/estimates/[id]/review`, related to `scope:ES-04`. The route is unchanged.
- Parent requirements EST-03, EST-04, EST-05 and EST-07, with EST-02, EST-06 and EST-08 as context. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, migration, permission, capability, duty grant, pricing policy, threshold, commercial approval or quotation. The built page stays as it is until a build is decided.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the page on the current shell and record layout | User decision, 23 October 2026 | Dean's brief: "Your task is to design and build the Estimate review page (/estimating/estimates/[id]/review) in Figma as a proposal for my review" |
| Departures D1–D12 | Accepted as recommended, 30 October 2026 | Dean's words quoted above. Section 4 |
| Q1 Who holds each review duty | Resolved as recommended | Explicit Company/site-scoped grants per review kind, as built, given to named people in Users and access (AD-01). No estimator or hosted profile gets one by default, and the author, owner and submitter are always refused. This decision grants no duty |
| Q2 An "Approved" commercial state later | Resolved as recommended | Not in ES-04. Reviewed stays the only outcome here. If commercial approval is wanted, it is adopted in its own policy record (authority by role and value band, delegation, expiry) and enforced in ES-05 before issue |
| Q3 Which pricing exceptions become hard blocks | Resolved as recommended, as a direction only | When thresholds are adopted: below-minimum price as a hard block, margin below the floor as approval needed, markup as advisory, each with a policy version, owner and effective date. No policy, threshold or number is adopted here, so every kind still reads "Policy not configured" |
| Q4 All three reviews for small estimates | Resolved as recommended | Yes, until a policy says otherwise |
| Q5 "In review" | Resolved as recommended | Keep it as a non-binding signal, only while a duty holder has a draft open, with no claim or lock (D5) |
| Q6 Advisory findings | Resolved as recommended | Yes, as notes that need no response and never block. Only Required findings block Reviewed (D6) |
| Q7 Discovery costing's totals for the same opportunity | Resolved as recommended | Discovery costing `1431:809` shows SYN-OPP-000334 with different v2 totals and a v3 from discovery r02. It was a proposal when this page was drawn and has been accepted since. It is not edited here; it is aligned to this story when it is next amended. This page follows the accepted queue `56:2` |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team, page "Estimate review · ES-04" `2244:734679` (after Reviews & approvals `56:2`), at the named version "Estimate review — shared record layout, accepted". The file's link is not recorded here, because the file holds Font Awesome Pro artwork (ADR-0050, ADR-0053) |
| Desktop 1440 | Review overview `2245:767284` (flow start "Estimate review — desktop"); Source & price returning a finding `2245:767679`; Technical Reviewed `2245:786168`; Completeness Returned `2245:786703`; owner responding in a new submission `2245:800054`; unchanged fingerprint keeping a decision `2245:800606`; pricing exceptions `2248:11727`; self-review refused `2248:12413`; all three Reviewed, ready for ES-05 `2250:2793`; history `2250:3336` |
| Tablet and phone | Tablet 1024 `2255:7115`; phone 390 decision `2255:7766` and findings list `2255:7833` (flow start "Estimate review — phone"); phone 320 decision `2257:3832` and findings list `2257:3907` |
| States | Loading `2263:8121`, no access `2263:8304`, stale `2263:8426`, uncertain save `2263:8774`, no review duty `2263:9108` |
| Notes card | `2265:4716`: story, rules, D1–D12 with their basis, Q1–Q7 with the adopted answers, flows and what is not drawn |
| Page parts | Estimate review / Review chip `2245:744934` (7 states), Finding row `2245:745004` (Open, Responded, Closed), Change row `2245:745026` (4 states) and Pricing exceptions panel `2245:745027`. At acceptance they moved to the Components page `1:4`, section "Components · Estimating parts" |
| Shared parts | v2 / Rail (Estimating, Reviews & approvals selected); Shell / Top bar with the Conversations action (badge 3); Shell / Phone header · compact; Record / Header, Field, Section heading, View tab, History item, Filter chip and Banner; Quotation detail / Linked chain row; Grid / Header cell and Cell; Tag; Button; Brand / Logo |
| Retained captures | [Estimate review design r01](../reference/ui/estimating/estimate-review-design-r01/README.md): 20 icon-free PNGs at exact frame size, with hashes. The capture copies are on the Captures page from y = 480,000; the File index row is `2771:446735` |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `route:/estimating/estimates/[id]/review`, related to `scope:ES-04`; parent requirements as above, unchanged |
| Page type (r20) | Review / comparison with Record detail; supporting Document & evidence workspace and bounded decision forms. Phone: a full-screen record with a sticky action bar |
| Reused components | Section 2, shared parts |
| Source authority | [Review rules](estimating-review-native.md), followed exactly; [ES-04 r01](estimate-review-pricing-exceptions-design.md), earlier design; [queue](estimate-reviews-design.md); [Cost sources](cost-sources-design.md); [estimating model](estimating-configurator-model.md) CM3, CM6 and CM8. Fixture: synthetic references, people, dates and values |
| Incoming handover | One exact submission of a saved estimate version, opened from Reviews & approvals ("Open review") or the saved estimate. Read-only evidence: lines with their origins (Rule, Workbench, Manual), reasoned overrides, unmapped parts, discovery and ES-08 lineage, and cost source revisions |
| Outgoing handover | Per-kind decisions (Reviewed, or Returned with required findings) bound to that kind's fingerprint. Findings go to the estimate owner, who corrects in a new saved version and resubmits. When all three apply, "Ready to prepare a quotation" hands over to ES-05, which validates commercial authority before issue. Never an Approved state, a quotation, a price change or a source review |
| States shown | Section 4 |
| Departures | Section 4 |
| Verification | Section 6 |

## 4. What the design shows

The story is synthetic and keeps the accepted queue's row exactly: SYN-EST-0139 v2 "Shade screen replacement, Block B", $126,900 excluding GST, Completeness awaiting review, submitted by Sam Jordan on 9 October. Sam Jordan is author, owner and submitter. The reviewers are Alex Lee (Completeness), Riley (Technical) and Sasha Clarke, the signed-in Coordinator "SC" (Source & price). Line 2 uses SYN-SRC-0021 from Cost sources: r1 was reviewed on 4 July 2026 with supplier expiry 30 September 2026; r2 is valid from 1 October to 31 December 2026.

- **v2, submission 1:** Technical Reviewed on 10 October at 09:40. Source & price Returned on 11 October at 14:05 (SP1, required: line 2 is bound to expired r1; SP2, advisory: lines 1 and 3 have no typed source binding). Completeness in review from 13:20, then Returned at 16:30 (C1: line 6 allowance not recorded; C2: line 3 lot not described).
- **v3, submission 2, 12 October at 15:52:** line 2 is rebound to r2 at $1,229.00, line 3 is described and line 6 is declared an allowance. The Technical fingerprint is unchanged, so Riley's decision is kept; Completeness and Source & price changed.
- **13 October:** Completeness Reviewed at 10:05 and Source & price Reviewed at 11:30, so the page reads "Ready to prepare a quotation".
- **Values:** cost $94,814.00 (v2) and $95,366.00 (v3); sell $126,900.00 throughout; AUD excluding tax. The estimate's lines, quote and rate references and fingerprints are invented for this story. No existing reference is renamed.

### Desktop

- **Header** (Record / Header): the title, the state in words, the estimate and version under review, the owner and submitter, and the submission time.
- **Review bar:** one chip per review kind and a fourth cell, "Commercial approval · Not configured".
- **Details column:** the submission, changed since last review, a pricing-exceptions summary and the linked-records chain.
- **Tabs:** Overview; the review tab for the duty held, or Respond and resubmit for the owner; Findings; Pricing exceptions; Changes; History.

### States

Loading, no access, stale (a newer submission exists), uncertain save (the original action is checked, never recorded again) and no review duty held (read only, with no review tab).

### Tablet and phone

At 1024 the rail collapses and the Details column folds into a "Show details" line. On the phone the reviewer gets a decision screen and a findings list, with the compact record header, flush sections, 16 px inputs and a 48 px sticky action.

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | The r01 six-view workspace with a 320 px queue column becomes the shared record layout used by Quotation detail: record header, Details column, tabs and main column. The queue stays on Reviews & approvals | Dean's brief; accepted record pages |
| D2 | The review bar described above | Brief item 1; the Quotation detail lifecycle bar |
| D3 | One review tab per duty held. The owner gets "Respond and resubmit"; a person without a duty gets no review tab. Built: one form with a review-kind picker | Brief item 2 |
| D4 | The decision form: Reviewed, or Returned with required findings; a rationale; one draft per finding (applies to a line, finding, required action); the footer names the fingerprint the decision binds to | Review rules; the built form |
| D5 | "In review" shows while a duty holder has a draft open. It is not a decision, holds no lock and blocks nobody. Built: no such state | Brief item 1; Q5 |
| D6 | Finding severity: Required blocks Reviewed until closed; Advisory is a note that needs no response and stays on record. Built: required findings only | Brief item 2; Q6 |
| D7 | Findings name their line and evidence. The owner responds per finding in the next submission; a reviewer of that kind closes it in that submission's review | Review rules; brief item 3 |
| D8 | Changed since last review, per kind, from the fingerprints: "Unchanged: earlier decision kept", "Changed: needs review", "Changed: reviewed on this version" and "First submission". Only a Reviewed decision can be kept | Review rules; brief item 5 |
| D9 | The pricing exceptions panel by policy version and kind (hard block, approval needed, advisory), with every cell reading "Policy not configured". Margin and markup show as calculated facts. SYN-EST-ARITHMETIC-01 shows as an adopted arithmetic rule, not a policy | ES-04 r01; no thresholds adopted |
| D10 | When all three apply: "Ready to prepare a quotation", with "Prepare quotation (ES-05)" as a prepared handover. Nothing is approved here | Review rules; brief item 8 |
| D11 | The phone composition described above | Phone header amendment |
| D12 | The tablet composition described above | Shared shell behaviour below 1200 px |

## 5. Not decided and not drawn

- **Building the page.** Moving the built page to this layout, the "In review" signal and finding severity need their own authorisation and pull requests. No capability is proposed here.
- **Commercial policy.** Commercial estimate approval, exception thresholds, quotation authority and terms remain Not configured.
- **Not drawn:** a read error other than no access; empty (no submission yet); 200% zoom, keyboard order and screen-reader proof.
- **Related records not edited:** Discovery costing (Q7) and the accepted queue.

## 6. Verification

- A scripted check found no text past a frame edge and no clipped record-header action. "Approved" appears only in negations, and no threshold number is drawn.
- The prototype has two flows. It was not played in Present mode before acceptance.
- The 20 captures are copies of the accepted frames with every Font Awesome icon swapped for `Icon/placeholder`; a recursive check after the swap found no Font Awesome instance left. They were exported at scale 1 with the Figma connector. Hashes are in the [captures README](../reference/ui/estimating/estimate-review-design-r01/README.md).
- The named Figma version "Estimate review — shared record layout, accepted" was saved on 31 October 2026 at Dean's "You save it", and reads back at the top of the file's version history. It was saved after the captures were exported. The only later edit to this page recorded here is the header's Named version field, which says it is saved.
- Nothing is built from this design, so there is no application or device evidence. This record implies no visual review of the application and no UI baseline.
