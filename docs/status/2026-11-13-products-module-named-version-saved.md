---
title: Products module named version saved
date: 2026-11-13
---

Dean saved the named version "PPO - Products module (accepted)" of the private Figma file "PPO - Products module" on 13 November 2026. He saved it after accepting the Products module refined UI pages and after refinements R1 and R2 were applied. The [proposal record](../decisions/products-module-refined-ui-proposal.md#13-named-version--13-november-2026) (PPO-PRODUCTS-REFINED-FIGMA-PROP) now records the version in section 13, and its front matter names it as the build basis.

Under [Build from the named Figma version](../decisions/figma-named-version-build-handoff.md), that record is now the lock-in for Products PD-01 to PD-05. It gives the file name, this version and the node IDs of the 122 sheets in section 3. Each build step from the record's section 6 cites the file, the sheet's node ID and this version. The shell chrome keeps its own named version, "Shell refined concept — accepted · record header toolbar". The file's link and key are not recorded (ADR-0050, ADR-0053).

Checked: the version is recorded on Dean's statement. This session cannot read the file's version history, so the version was not compared with the file. Nothing in the file was changed after the R1 and R2 work. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. Not done: any build step, application code, route, migration, permission or integration; the design register and scope-page corrections (A24).
