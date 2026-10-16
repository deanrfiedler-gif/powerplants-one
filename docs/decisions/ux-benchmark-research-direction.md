---
document_id: PPO-UXB-DIRECTION
date: 2026-10-16
owner: Dean Fiedler
status: User direction for research and proposals; no recommendation adopted; authorises no design, code, migration or customer contact
source_commit: b223c5817be7a946b38c48c9838d9d9925298156
versioning: git
---

# UX benchmark research — owner direction

On 16 October 2026 Dean asked for deep research to make every Powerplants One module as professional and user friendly as possible. Claude proposed a research plan with five decisions, each with a recommended default. Dean approved it: "Approved. Proceed with the research plan using your recommended defaults for all five decisions."

After the first report he asked for user feedback to be added. His message began: "Yes, run the user-feedback top-up now…"

He then directed how to proceed: "I'm happy for you to proceed however you believe is the most professional approach. Our goal is to ensure the Powerplants One app is as professional as possible, and an exceptionally good world-class gold standard app. So proceed on that basis."

The research that followed is recorded in the [UX benchmark research record](../design/research/ux-benchmark/README.md). It produced:
- 92 recommendations (UXB-01 to UXB-92: 20 priority 1, 56 priority 2 and 16 priority 3);
- 24 amendment items against accepted designs (A01 to A24; A22 and A24 withdrawn after the check);
- 123 patterns and 13 draft cross-module principles;
- an independent check of 377 links, 105 claims and every PPO-today statement against `origin/main` at `b223c58` and the Figma file.

Scope: every PPO module, through the scope IDs and design register keys each recommendation names. No parent requirement ID is added, renamed or closed; all 78 remain.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Research every module to make it as professional and user friendly as possible | User request, 16 October 2026 | Dean's request that opened the work |
| Approve the research plan, taking the recommended default for each of its five decisions | User decision, 16 October 2026 | "Approved. Proceed with the research plan using your recommended defaults for all five decisions." |
| Add a user-feedback top-up | User decision, 16 October 2026 | "Yes, run the user-feedback top-up now…" |
| Proceed in the most professional way, towards a world-class app | User direction, 16 October 2026 | "I'm happy for you to proceed however you believe is the most professional approach. …" (quoted in full above) |
| Three operational pain points: technicians arriving without parts or to an unprepared site, no dispatch notice with freight tracking, no structured customer updates on long projects | User statements in conversation, 16 October 2026; not a repository decision | Used to weigh the recommendations; the pain points themselves are not decided here |
| The 92 recommendations, 24 amendment items, 13 draft principles, 123 patterns and the innovation radar | Proposals from Claude's research; **none adopted** | [Research record](../design/research/ux-benchmark/README.md), [recommendations](../design/research/ux-benchmark/recommendations.csv), [amendment items](../design/research/ux-benchmark/amendment-items.csv) |
| Record the research summary and registers in the repository as proposals | Taken under the 16 October direction | This record and the research record |
| Nine technology choices on the radar (maps and routing, SMS, weather, AI provider, supply barcode decoder, grid library, sync engine, Microsoft Graph mail and calendar, controller telemetry) | Open; each needs an architecture decision record first | Research record |
| Each recommendation and amendment item | Open until Dean decides it | — |

## 2. What the direction authorises

- The research already done: the ten research streams, the user-feedback top-up, the independent check and the horticulture pass, and the reviewed report they produced.
- Recording that research in the repository as evidence and proposals: the research record, the two registers derived from the report, this record, the status entry and the index entries.
- A private review document, owned by Dean and kept outside the repository, in which he records a decision against each item.

## 3. What it does not authorise

Without Dean's decision on the specific item, the direction authorises none of the following:
- adopting any recommendation, amendment item, draft principle or radar item, or treating any of them as an operating rule;
- any Figma design, or any change to an accepted design or its named version;
- application code, routes, read models, migrations, seeds, permissions or capabilities, dependencies, integrations or deployment;
- contact with customers or growers, or any customer communication. This includes the grower interviews or survey that UXB-92 proposes;
- research with Powerplants staff;
- choosing any of the nine technologies on the radar;
- business transactions;
- changes to the design register in `docs/design/development/`, to issued references or to parent requirement IDs.

MYOB remains the intended ERP authority, SharePoint owns business documents, and native CAD tools keep their authoring responsibilities.

## 4. How adopted items will be recorded

1. Dean decides each item: Adopt, Adopt with changes, Defer or Reject. Building against an item does not adopt it.
2. A decision is recorded in `docs/decisions/` in Dean's words, citing the UXB or amendment IDs, the scope IDs and register keys involved, and any parent requirement IDs it serves. Several items decided together may share one record.
3. The same pull request sets `status` and `decision_record` for those items in the [recommendations](../design/research/ux-benchmark/recommendations.csv) or [amendment items](../design/research/ux-benchmark/amendment-items.csv) register. The researched columns stay unchanged.
4. An adopted amendment item is recorded as an amendment in the accepted design's own decision record, with a named Figma version under [ADR-0053](ADR-0053-figma-page-design.md), as [Products Amendment A1](products-figma-design.md#8-amendment-a1--product-image-15-october-2026) was.
5. A technology choice gets its architecture decision record before any build.
6. Build work follows `AGENTS.md` in its own reviewable pull request:
   - the live design register is updated for page work;
   - schema work carries the full migration ripple;
   - delivery status, owner visual review and business acceptance stay separate.
