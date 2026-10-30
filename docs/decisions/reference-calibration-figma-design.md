---
document_id: PPO-ES10-REFERENCE-CALIBRATION-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; application build, governed adoption and operating policy separate
source_commit: 01cef3916c874159a9404f737065292ae2466046
versioning: git
---

# Reference cases and calibration proposals design — owner decision

On 23 October 2026 Dean asked Claude to "design and build the 'Reference cases and calibration proposals (ES-10)' UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." `/estimating/reference-cases` is not built, so this design defines the build.

On 30 October 2026, asked "Do you accept the ES-10 proposal with the recommended answers?", Dean chose "Accept as proposed". That adopts departures D1–D13 and the recommended answers to Q1–Q5.

Claude drew the page from these sources:
- the [issued ES-10 design decision](reference-calibration-design.md) and its [r01 HTML and report](../reference/ui/reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-Report-r01.md), which stay unchanged;
- the [r01 model](../design/reference-calibration/model.js), for the fixture and the eligibility rules;
- the [estimate-to-actual feedback proposal](../blueprints/estimate-actual-feedback-design.md), in which nothing is adopted;
- the [ES-09 design decision](estimate-actual-outcome-review-design.md), for the incoming handover;
- the [ES-08 Figma design](es08-figma-design.md) and the [Workshop builds design](workshop-builds-figma-design.md), for the estimate context and the Block C unit.

Scope:
- `scope:ES-10` "Reference cases and calibration proposals", destination `/estimating/reference-cases`. ES-10 is a page ID, not a parent requirement.
- Principal parents EST-04 and EST-06; EST-03, FIN-04 and FIN-07 are receiving dependencies. All 78 parent IDs are unchanged.

This is a design decision. It authorises no application code, route, read model, migration, permission, rule registry, rate, formula, mapping or estimate change. It adopts no estimating rule, and it does not make any threshold, review authority or adoption route operative.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design ES-10 in Figma | User decision, 23 October 2026 | Dean's request, quoted above |
| Accept the design | User decision, 30 October 2026 | "Accept as proposed", quoted above |
| Departures D1–D13 | Accepted as recommended, 30 October 2026 | Section 4 |
| Q1 Minimum sample size | Accepted as design direction; not an operating policy | n ≥ 5 to show a median and full range, with no indicative band below it; below 5 show per-job ratios only. Revisit after 12 months of real ES-09 outcomes. The screens keep the label "proposed, not adopted" until a governed policy exists |
| Q2 Who reviews proposals | Accepted as design direction; authority still to be granted | An estimating lead who is not the author, consulting the ES-08 owner whenever a specialist formula is involved. The role is granted later in Users and access |
| Q3 Who adopts, and how | Accepted as direction for later work; adoption stays unavailable | Dean, or an estimating manager he names, through a separate governed rule registry with versioned definition packs. Adoption invalidates dependants and never edits past estimates. Not part of ES-10's first build |
| Q4 Where the panel appears | Resolved as recommended | ES-08 first, then Estimation Wizard lines, then Discovery costing, Automation and Fertigation once they have reviewed outcomes |
| Q5 Rail item | Resolved as recommended; one conflict open | "Reference cases" after Cost sources with the chart-column icon, with ES-09 beside it. See section 7 |
| Named Figma version | Saved on Dean's instruction, 30 October 2026 | Section 6 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Reference cases & calibration · ES-10" `2244:48064`, under "— Estimating & quotation —", after Estimate-to-actual review · ES-09. The page header `2244:48065` holds the conformance declaration; the notes card `2248:771192` is in Flows and notes |
| Desktop 1440 | Case register `2245:733046`; Case register, menu folded, last columns `2245:737030`; Case detail, Willowbank `2245:741363`; Comparison, 5 eligible jobs `2245:750791`; Comparison withheld, 3 of the proposed 5 `2245:751205`; Calibration proposal, draft `2245:763200`; Preview scenario `2245:775017`; Independent review `2245:775528`; Estimator panel amendment over a copy of ES-08 `2245:787972` |
| Tablet 1024 | Comparison `2245:796591` |
| Phone 390 and 320 | Case detail `2245:801087`, `2245:801342`; Independent review `2245:801197`, `2245:801453` |
| States | S1–S8 `2247:2647`: loading, nothing matches, could not load, read-only, source changed, sample too small, proposal returned, adoption unavailable |
| Prototype | Flows "ES-10 — desktop" and "ES-10 — phone" |
| Retained captures | [Design r01](../reference/ui/estimating/reference-calibration-design-r01/README.md): fifteen icon-free PNGs with hashes |
| File index | Row added under Estimating & quotation |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:ES-10` and `/estimating/reference-cases` (not built). Parents as above; all 78 preserved. No new capability drawn |
| Page type (r20) | Register / worklist (reference cases). Record detail (case). Review / comparison (comparable jobs, independent review). Form / guided workflow (calibration proposal, preview scenario). The estimator panel is a docked panel inside the ES-08 workbench |
| Reused components | Estimating rail with a proposed item, Shell / Top bar with the Conversations action, side menu parts, Grid cells, My Work / Group row, Record / Header, Record / View tab, Tag, Button, Grid / Checkbox and Shell / Phone header · compact. New parts stay on the page: ratio dot plot, mini dot plot, lifecycle stepper, evidence snapshot and integrity tables, estimator reference panel and sticky Case column |
| Source authority | The sources listed above. r01's nine cases are a synthetic fixture kept exactly; crop, region and case owner are added synthetic fields |
| Incoming handovers | Reviewed outcomes from ES-09, read-only: exact outcome identity and revision, comparison basis, line identity, completeness and applicability. None is accepted operationally today. Estimate context from ES-08, Estimation Wizard and Discovery costing, read-only |
| Outgoing handovers | A calibration proposal: Draft, Submitted, then independent review (Accepted as reviewed, Returned or Rejected). A reviewed proposal may ask ES-08 for validation, as a request. A "Use as reference" note on an estimate line, written by the estimator |
| Exceptions and recovery | S1–S8. A changed source returns the proposal and needs a successor |
| Proposed departures | D1–D13 in section 4, accepted |
| Verification | Section 6 |

## 4. What the design shows

The six decisions of the issued r01 hold: original evidence stays apart from the current source; excluded evidence keeps its reasons; per-job ratios, median, n and full range are shown, and aggregates are withheld below the threshold, which is labelled unadopted; draft, submission, independent review and adoption stay separate, with adoption unavailable; a changed source needs return or a successor and inherits no approval; scenarios affect only the preview.

| ID | Departure or rule | Basis |
|---|---|---|
| D1 | Current shell and record layout in place of r01's standalone tabbed module. The side menu headings are r01's views, the snapshot becomes the case record and the summary tiles become menu counts | Departure from r01; Dean's shell and register preferences |
| D2 | Register grouped Eligible to compare 5, Excluded 3, Expired 1. Bands span the checkbox and settings columns; status tags carry the reason in words; eligible rows start selected. Ten columns scroll, with a proposed fixed Case column | Register rules; r01 |
| D3 | Case detail: reviewed outcome, line ratio, applicability and which dimensions decide eligibility, limitations, r01's seven eligibility checks, source revision with the changed-source slot, and the proposals using the case. One case's ratio is never a benchmark | r01 |
| D4 | Comparison: estimate context, metrics, a dot plot with every value printed (each job, median, full-range band, 1.00× line), then counted and not-counted tables with every reason. Used ÷ estimated per job, median of those ratios, full range, duplicates counted once | r01 |
| D5 | Median, range and band withheld below 5; per-job ratios stay; Prepare proposal unavailable. r01 showed an indicative median at n 3–4 | Departure from r01; Dean's brief; Q1 |
| D6 | Lifecycle stepper: Draft, Submitted, Independent review, Rule adoption, the last always Unavailable with its reason. The evidence snapshot is rechecked at submission and review | r01 |
| D7 | Preview scenario: hours × factor, bounded 1–10,000 h and 0.10–5.00. The line stays at 184 h and there is no "Apply to estimate" | r01 |
| D8 | Independent review: author differs from reviewer; Accept as reviewed, Return for revision or Reject; rationale required; Adopt visible but unavailable, with its reason | r01; Dean's brief |
| D9 | Changed source: the case keeps r1 with a warning, proposals using r1 are returned, and a successor (SYN-ES10-CAL-000002) uses r2 with no review | r01 |
| D10 | Estimator panel as an amendment over a copy of ES-08 Parts & working `419:94560`: context match, n, median and range, the value at this line for reference, three example cases, the not-counted note, and "Use as reference", which adds a note and never changes hours. ES-08 has no labour line today, so the 184 h line exists only in this amendment. The ES-08 page is not edited | Dean's brief |
| D11 | Crop, region and case owner are added synthetic fields. Crop and region are descriptive and limit the sample only when the estimator narrows by them | Feedback proposal: segmentation must be earned |
| D12 | The Block C 4-channel dosing unit is left out: SYN-PPO-BLD-000042 is still in build on 13 October 2026 in Workshop builds, so ES-09 has no reviewed outcome for it. The proposal uses r01's retractable-shade installation labour | Dean's brief; Workshop builds decision |
| D13 | Phone: compact record header, flush sections, a sticky full-width 48 px primary action, 16 px input text and 48 px option rows | Phone header amendment |

Story: synthetic, as at Tue 13 Oct 2026 09:00 AEST. Alex Morgan estimates and Sam Taylor reviews. r01's labels `SYN-ES10-REF-000001` to `000009`, hours and states are unchanged. The five reviewed shade jobs give median 1.20×, n 5, range 1.10–1.30×. Northbank `SYN-EAR-0001` stays Draft / Partial and excluded. The 184 h line and the crop and region values are synthetic additions, not operating data.

## 5. Not decided or not built

- `/estimating/reference-cases` and the estimator panel are not built, and no build is authorised here.
- No threshold, reviewer role, rule registry, definition pack or adoption route exists. The issued r01 record's receiving boundaries still apply, including the ES-09 receiving contract.
- Not drawn: the successor draft (its entry is S7), Knowledge lesson links and a review-copy export.
- The frames keep their "(proposal)" names so that the node IDs and names cited here stay stable.

## 6. Verification and named version

Checked on the Figma page and the capture copies:
- No overlaps, and every frame inside its section, at drawing on 23 October 2026.
- No Font Awesome instance or stray vector in any capture copy, and no prototype link left on a copy.
- The Captures page and the ES-10 page keep their flow starting points.

Not done:
- The two flows were linked and their targets set by script; they were not played in Figma Present mode.
- No visual review evidence is recorded in the design register; its status stays "Needs review".

Named version: asked whether he had saved it, Dean answered "Save it for me". Claude saved "Reference cases & calibration — Pipedrive pattern, accepted" in the Figma desktop app on 30 October 2026 and confirmed it at the top of the version history.

## 7. Open item: the rail

Q5 accepts "Reference cases" after Cost sources, with ES-09 beside it. ES-09 was drawn separately, without that item, and with its own "Outcomes" item after Reviews & approvals. The two pages therefore show different rails. Reconciling them needs Dean's choice; nothing in this record changes the ES-09 page.
