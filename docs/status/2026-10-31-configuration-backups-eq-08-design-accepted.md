---
title: Configuration backups EQ-08 design accepted
date: 2026-10-31
---

Dean accepted the Figma design for EQ-08, configuration backups and recovery evidence: "Accept as drawn". The [design decision](../decisions/configuration-backups-figma-design.md) (PPO-EQ08-CONFIGURATION-BACKUPS-FIGMA-DEC) records rules D1–D10 and answers Q1–Q4:
- status in words: Current, Unverified, Out of date and No backup;
- every backup names one exact configuration revision, and history is only ever added to;
- PPO keeps references and checksums, never the file or credentials, and never operates a controller;
- four evidence stages, with the verifier different from the tester;
- a gaps worklist with owners and due dates.

Nineteen icon-free captures with hashes are retained in [configuration-backups-design-r01](../reference/ui/equipment/configuration-backups-design-r01/README.md), and the design register page for `scope:EQ-08` cites them. In Figma the capture copies sit on the Captures page at y = 630,000.

Checked:
- No Font Awesome instance is left in the capture copies, and no copy carries a prototype link.
- All 16 prototype links stay on the page; they were traced in code. The flows were not played in Present mode.

Not done:
- The built `/equipment/backups` page is unchanged; restyling it is not decided, and the design needs fields the model doesn't have.
- The 5-working-day rule and required test-restores are not operating procedure, and where backup files are kept today hasn't been checked.
- The Equipment, EN-08, Kitting, Bench testing and Change review pages that EQ-08 draws on are still proposals; accepting EQ-08 doesn't accept them.
- The named Figma version "Configuration backups — accepted" waits for Dean.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Configuration backups design](../decisions/configuration-backups-figma-design.md) (PPO-EQ08-CONFIGURATION-BACKUPS-FIGMA-DEC) records Dean's 31 October 2026 acceptance of the EQ-08 design: a register of exact-configuration backups with status in words, asset history, recorded restore evidence and a gaps worklist. PPO keeps references and checksums and never operates a controller. Restyling the built page is not decided.
