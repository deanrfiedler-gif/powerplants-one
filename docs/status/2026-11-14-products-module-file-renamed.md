---
title: Products module Figma file renamed "PPO - Products module (accepted)"
date: 2026-11-14
---

Dean renamed the private Figma file that holds the accepted Products module pages to "PPO - Products module (accepted)" on 14 November 2026. This follows the convention he has used for the module files: "(proposal)" before acceptance, "(accepted)" after it. Section 15 of the [proposal record](../decisions/products-module-refined-ui-proposal.md#15-file-name--14-november-2026) (PPO-PRODUCTS-REFINED-FIGMA-PROP) records the new name. It is the same file, so every citation of "PPO - Products module" means it and none is rewritten. The named versions keep their titles, and the build basis is still "PPO - Products module (accepted) · alignment batch". The file's link and key are not recorded (ADR-0050, ADR-0053).

Checked:
- Through the Figma connector, the file has the same key and the same twelve pages with the same IDs.
- `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass.

Not checked: the name itself, because the connector returns only the generic name "Document"; it rests on Dean's word. Not done: nothing in the file was edited, and no other record or the design-to-build standard was changed.
