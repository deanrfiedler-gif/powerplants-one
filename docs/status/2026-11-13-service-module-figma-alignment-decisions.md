---
title: Service module Figma alignment decisions
date: 2026-11-13
---

Dean accepted all 13 recommendations of the Service module Figma alignment audit on 13 November 2026. The Service file's next build session can therefore start the alignment batch without waiting on him. The [audit record](../decisions/service-module-figma-alignment-audit.md) (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT) is updated in place with the decisions and the batch.

What the decisions settle:
- **Policy editors:** Settings owns the scheduling-policy, preparation-policy and record-reference editors. Service keeps Policy impact and shows the published versions read-only. Settings must add a preparation-policy editor.
- **Facts:** A3.8 governs Casey Ward's morning. Supply's parts-ready signal is the source of truth. Supply owns supplier claims. Projects' Block C dates and the Shared records customer name apply. The portal response at 10:42 is the response for SYN-RPT-000040 r01.
- **Handovers:** Service sends Sales a renewal brief.
- **Conventions:** Reporting defines the KPI-01 period. Instrument tags are asset tags, CMS is to be registered, and INS means inspections only.
- **Library and Shell timing:**
  - Panels stay 432 px until the Library publishes, and avatar initials become 11 px at Library adoption.
  - The goodwill limit stays proposed.
  - The ban on sync words holds on technician phones; the Shell's "Syncing" pill changes at its next named version.

Dean also confirmed the file's name: "PPO - Service module". The batch renames the file's Read me header to match, and the Service record changes its references in its next change.

The record's new section 10 holds the alignment batch with these decisions applied: 41 items for the Service file in order, plus the items for the Settings, Supply, Finance, Sales, Reporting, Engineering, Projects, Shared records, Shell, Library and repository changes. Still open: the text of Addendum A3, on which the Q2 and Q4 decisions partly rest. Nothing in any Figma file or other record was changed, and no design is accepted.

Checked: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. The decisions were cross-checked against the Settings record as it stands on `main`. That record now says Settings edits the scheduling policy and record references and that every module publishes its own other policy families, which fits Q1. Every record, person, value and date shown is synthetic.

<!-- decision-index -->
[Service module Figma alignment audit](../decisions/service-module-figma-alignment-audit.md) (PPO-SERVICE-FIGMA-ALIGNMENT-AUDIT) now records Dean's decisions of 13 November 2026 on the audit's 13 questions, all accepted as recommended, and the alignment batch for the Service file with those decisions applied. It changes no design and accepts nothing; all data is synthetic.
