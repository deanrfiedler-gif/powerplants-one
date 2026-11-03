---
document_id: PPO-ESTIMATING-NAVIGATION-AMENDMENT-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-decided navigation amendment; dependent record links, Figma amendment, implementation and acceptance pending
source_commit: d5c1fb2b2c1deef2893deee4f596bb3c2be304ea
versioning: git
---

# Estimating navigation amendment

## Decision — 30 October 2026

At 10:07 UTC the coordinating assistant asked Dean which shared arrangement should resolve the rail conflict between ES-10 (#758) and ES-09 (#763). Option 1 was:

> Recommended: Outcomes after Reviews & approvals; Reference cases after Cost sources. This separates reviewing results from looking up reference material.

At 14:09 UTC Dean replied **"1"**. This directly verified choice adopts that shared arrangement for both pages. It supersedes only the ES-10 Q5 requirement to put ES-09 beside Reference cases and the statement that the rail still needs Dean's choice. It retains ES-09 D5's Outcomes placement and makes Reference cases part of the shared arrangement. Other design choices, icons, rules, destinations, parent requirement IDs and scope boundaries are unchanged.

This record is the single source of the amendment. It is a navigation decision, not evidence of amended Figma frames, application delivery or executed acceptance.

## Source records and preserved history

The following live heads were inspected on 30 October 2026. Both PRs were open, targeted main and had no discussion comments. Their descriptions attribute the design work to Claude; their branches remain with those sessions. No existing reconciliation PR or issue was found in the open-work inspection.

| Source | Recorded navigation and acceptance history |
|---|---|
| [ES-10 #758](https://github.com/deanrfiedler-gif/powerplants-one/pull/758), head `05bee09a29e4d4f7e78a272704398e6d5698bffd`; [PPO-ES10-REFERENCE-CALIBRATION-FIGMA-DEC](https://github.com/deanrfiedler-gif/powerplants-one/blob/05bee09a29e4d4f7e78a272704398e6d5698bffd/docs/decisions/reference-calibration-figma-design.md) | Section 1 Q5 and section 7 put Reference cases after Cost sources with ES-09 beside it and leave the conflict open. Those placement/conflict statements are superseded by this amendment. Section 6 records the named version **Reference cases & calibration — Pipedrive pattern, accepted**, saved 30 October 2026. |
| [ES-09 #763](https://github.com/deanrfiedler-gif/powerplants-one/pull/763), head `f54a6b84c6e5158160d976b77bee0ffbaaa7afbb`; [PPO-ES09-FIGMA-DEC](https://github.com/deanrfiedler-gif/powerplants-one/blob/f54a6b84c6e5158160d976b77bee0ffbaaa7afbb/docs/decisions/estimate-actual-review-figma-design.md) | Section 4 D5 puts Outcomes after Reviews & approvals; the accepted rail lacks Reference cases. Section 2 records the named version **Estimate-to-actual review · ES-09 — shared record layout, accepted**, saved 30 October 2026. |

The original acceptance choices and saved-version claims above are attributed to the inspected repository records, not independently reverified with Dean or Figma in this task. The fresh option-1 reply is directly verified conversation evidence. Preserve both named versions, original capture bytes and hashes, issued r01 reports/HTML, and the acceptance chronology. The newer navigation choice does not retroactively change what those versions showed.

## Sequenced documentation follow-through

This amendment is published additively against main under the [source-isolation convention](documentation-source-isolation.md). Neither unmerged design decision is copied into main and neither owner's branch is written. The [parallel contribution rules](../../CONTRIBUTING.md#working-in-parallel) require owner coordination for their existing files. The coordinating session must return the following narrow updates to the branch owners, or sequence them after those PRs land:

| Owner-controlled source | Required reference update |
|---|---|
| #758: `docs/decisions/reference-calibration-figma-design.md`, Q5 and section 7 | Preserve the earlier choice as dated history; link this amendment as the current decision. Replace the current claim that Dean's choice remains open with Figma/reference follow-through pending. |
| #763: `docs/decisions/estimate-actual-review-figma-design.md`, D5 and section 5 related-record note | Link this amendment beside the retained D5; distinguish the agreed shared rail from the still-unamended ES-10/ES-09 drawings. Do not imply that accepting ES-10 itself aligned the drawings or their synthetic fixtures. |
| Their respective `docs/design/development/pages/scope-es-10.md` and `scope-es-09.md` | Link this single amendment under Shared components and states. Keep capture provenance, visual-review status and fingerprints unchanged. |

Those links are pending; publication of this record does not claim the two owner branches have already been reconciled. Until they are updated, read their rail choices with this dated supersession. The Northbank fixture/state discrepancy is a separate matter and is not resolved here.

## Figma, application and acceptance follow-through

1. The design owner should make a subsequent, explicitly labelled rail amendment for both pages and their relevant shared rail instances, preserving the named accepted versions. Record changed nodes and new evidence separately; do not replace historical captures or imply that linked instances were already inspected.
2. Inspect the resulting desktop, collapsed/tablet and phone navigation, applicable prototype paths and layout/overflow. Record actual results, including Present-mode checks; neither source record's unplayed flows acquire a pass from this decision.
3. Application owners should carry the decision into the separately authorised ES-09/ES-10 implementation and shared navigation work, preserving destination/permission boundaries. This task introduces no route, component, capability, grant or estimating rule.
4. Compare the amended reference and implemented application and execute applicable acceptance procedures. Keep user design choice, visual verification, functional proof and owner/device acceptance separate.

| Claim | State for this contribution |
|---|---|
| Decision recorded | Yes: Dean's dated option-1 choice, with narrow supersession |
| Documentation verified | Source heads and conflicting text inspected; automated checks reported in the PR |
| Dependent record references updated | Pending branch-owner coordination described above |
| Figma amended or visually verified | Not performed |
| Application implemented | Not performed |
| Acceptance tested | Not performed |

Review of this owner decision amendment remains separate from authorship. No merge or deployment is included.
