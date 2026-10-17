---
document_id: PPO-FIGMA-COMPONENTS-PAGE
title: Figma Components page as the single component source
date: 2026-10-17
owner: Dean Fiedler
status: Adopted in the design file on 17 October 2026; the component register mapping is proposed in this change
versioning: git
---

# Figma Components page as the single component source

## Context

On 17 October 2026 Dean asked whether the Components page of the private "PPO - Design" Figma file (`1:4`) needed updating after the UX benchmark exemplars. A read-only inventory of all 52 pages found the page held 176 icons and seven early parts, while the main components the accepted designs use were spread over about 25 design pages. Some accepted pages depended on components held on proposal or archive pages: Shell v2 (proposal) `73:4`, the historical Shell page `31:214` and Deals (proposal) `549:2`. The early Rail item and Menu item duplicated v2 / Rail item and v2 / Menu item, and the Deals page carried a second icon set.

## Decision

Dean approved the consolidation plan: "Proceed with the plan and your recommended answers to D1–D6."

| ID | Decision |
|---|---|
| D1 | Move shared parts and module parts (register rows, headers, phone rows and snapshots) to the Components page, in sections: Icons, Controls, Shell and navigation, Grid, Record, Job pack, Field, then My Work, Sales, Estimating, Engineering and Projects, and Service, Supply chain and Shared records parts. |
| D2 | CPQ / * (23) stays on CPQ · 2 Foundations & components (`464:3`), an accepted component page that the CPQ records cite. |
| D3 | Retire Rail item, Menu item, Attention item, Activity row and Side panel to "Legacy · superseded components" on Shell (`31:214`). No instance swaps: they differ visually from their replacements and only archive pages use them. |
| D4 | Keep the 24 px Deals r37 stroke icons as a legacy group in the Icons section. No swap to the Font Awesome set now; decide when Deals is redrawn for acceptance. |
| D5 | The proposed top bar with centred search (`1046:259953`) and breadcrumb (`1037:103`) move after the Shell top bar amendment's lock-in, when they replace Shell / Top bar (`35:138`). |
| D6 | Leave a one-line note where a page's component section was emptied. |

Proposal-only parts stay on their proposal pages until those designs are accepted: Deals/Card, Form field and Checkbox option; CS-01 / Summary tile; the 27 ES-08 Workbench, Drawing and Parts grid parts; and the exemplar Marker and Note card.

## Result in the design file

- 212 main components moved by reparenting, keeping their node IDs; every instance stayed linked. All 390 components on the page have a description, with a Source line naming the page each was drawn on.
- PNG export hashes of 90 frames (82 at quarter scale, 8 at full scale) on My Work, Leads, Lead record, Deal record, Projects, Work orders, Job pack and My jobs matched before and after. No accepted frame changed.
- The File index rows for Components, Shell v2 and Shell were reworded. No page was renamed and no named version was saved.

## Repository consequence

Each component register record carries a `figma` mapping (status, location, node IDs and names, note), and each specification has a "Figma components" section. The development register check rejects malformed mappings and any link. The mapping says where a design component is; it does not record visual alignment, review or acceptance, and no review fingerprint is created.

## Open

- Whether to replace the Deals r37 icons with Icon/* at the Deals lock-in (D4).
- Moving the amendment's top bar and breadcrumb after its lock-in (D5).
- 24 register entries have no matching Figma component; add components only when an accepted design needs them.
