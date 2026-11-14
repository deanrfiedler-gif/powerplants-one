---
title: Estimating module Figma file renamed "PPO - Estimating module (accepted)"; the design-to-build standard names it
date: 2026-11-14
---

Dean renamed the Estimating module Figma file "PPO - Estimating module (accepted)" on 14 November 2026, matching the suffix the Sales and Settings module files carry. Section 14 of the [proposal record](../decisions/estimating-module-refined-ui-proposal.md) (PPO-ESTIMATING-REFINED-FIGMA-PROP) records it.

- **Figma.** The Read me header title now matches the file name. Its description already says the alignment batch of 12 November awaits Dean's acceptance and a new named version.
- **Standard.** Section 3 of the [design-to-build standard](../standards/design-to-build-standard.md) names the domain file `PPO - Estimating module` in place of `PPO - Estimating & Quotation`, with the same coverage. As for Settings, the row gives the name without its status suffix.
- **Unchanged.** Earlier citations of the file keep their names. The build still reads the named version "PPO - Estimating module (accepted)" until Dean saves a new one.

Checked: the header title read back and rendered after the change; `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`. The plugin API reports the file's name as "Document", so the rename itself was confirmed from the file name in Dean's link, not read from the file. No application code changed.

<!-- decision-index -->
[Estimating module refined UI proposal](../decisions/estimating-module-refined-ui-proposal.md) (PPO-ESTIMATING-REFINED-FIGMA-PROP) section 14 records Dean's renaming of the Estimating module Figma file to "PPO - Estimating module (accepted)" on 14 November 2026 and the matching row in section 3 of the design-to-build standard. It changes no design, accepts nothing in the alignment batch of 12 November and authorises no application code.
