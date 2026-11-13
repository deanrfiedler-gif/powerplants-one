---
title: Settings module audit items applied in Figma
date: 2026-11-13
---

After the Settings module record merged, Dean said "Continue". The audit's recommended order was then worked as far as it lies inside the private Figma file "PPO - Settings module (proposal)"; section 10 of the [proposal record](../decisions/settings-module-refined-ui-proposal.md) (PPO-SETTINGS-REFINED-FIGMA-PROP) records it. Three scans now cover every sheet. The story scan traced 22 thread references against the dataset and each sheet's moment. The independence scan read every two-person strip. The capability scan listed every enabled gated button against the person signed in. Their findings were fixed in the file as C8:
- a stale "three renders" description on OH13;
- five page states whose events or facts did not match their "as at" line;
- the Review button left enabled for a proposer on two sheets;
- Resolve left enabled for someone who is not the owner.

Also drawn or adjusted: tablet versions of the Publish version 2 dialog, the Apply dialog and the Retry panel (the file now holds 270 sheets); equal card widths; phone form headers without search and filter; one phone status time. For C7, the record now proposes a button fill of `#34842f` (4.65:1 with white text) in place of brand/green-deep `#3d9a37` (3.57:1); the decision belongs on the Shell file. The design is a proposal: Dean has not accepted it and no named version is saved. The file's link is not recorded here (ADR-0050, ADR-0053).

Checked: the scans and fixes above; a position check on the three pages that gained sheets (no overlap, every label in place); the regenerated Read me index (270 sheets). Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`. Still open, with reasons in record section 10.4: C7, R1, R2, G1, G4, P1 and P3. Nothing here changes code, routes, migrations, permissions or integrations. Every record, person, value and date shown is synthetic.
