---
title: Customer 360 archived and 16 Figma pages renamed under audit R4 and R1
date: 2026-10-25
---

Audit decisions R4 and R1 are done in the private "PPO - Design" file and the records that cite it.

- **R4:** the never-accepted Customer 360 proposal page `554:2` is in the Archive group, with a note and an archived File index row. It is superseded by Organisations · CS-01. Its [record](../decisions/customer-360-figma-design.md) and the component register say so.
- **R1:** 16 pages that had a scope ID, or a non-standard name, now carry "[Page name] · [scope ID]" names without "(accepted)" or "(proposal)". Node IDs did not change. The File index gained a "Former name" column.
- **Records:** 26 records that cite those pages now give the new name with the former one. [ADR-0055](../decisions/ADR-0055-figma-file-structure.md) records the one-time exception to its naming rule.
- **Not renamed:** the CPQ pages, which have no page-scope ID under their record, and the pages R1 leaves until their scopes get IDs.

The mapping and the records left as written are in sections 12.7 and 12.8 of the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md). No build, review, acceptance or deployment status changes.
