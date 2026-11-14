---
title: Projects module Figma file renamed to its proposal name
date: 2026-11-14
---

Dean renamed the Projects module Figma file "PPO - Projects module (proposal)" on 14 November 2026, as audit question AQ-6 recommended. The name now matches the Read me, the [proposal record](../decisions/projects-module-refined-ui-proposal.md) and both named versions, and the [alignment audit](../decisions/projects-module-figma-alignment-audit.md) marks finding PJA-20 fixed. The suffix changes to "(accepted)" only when Dean accepts the design.

Checked: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. No application code, route, migration, permission, design register or other record is changed, and all 78 parent requirement IDs remain.

<!-- decision-index -->
[Projects module refined UI proposal](../decisions/projects-module-refined-ui-proposal.md) (PPO-PROJECTS-REFINED-FIGMA-PROP) now records that the Figma file is named "PPO - Projects module (proposal)" (audit AQ-6, PJA-20 fixed, 14 November 2026). It remains a **proposal**: no design is accepted, and no application code, route, migration, permission or deployment is authorised; all data is synthetic.
