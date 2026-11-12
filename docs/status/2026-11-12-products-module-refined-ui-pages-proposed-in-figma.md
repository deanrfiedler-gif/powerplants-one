---
title: Products module refined UI pages proposed in Figma
date: 2026-11-12
---

Dean asked for the complete, refined UI page set of Products (PD-01 to PD-05: the catalogue and product record, publication, pricing, compatibility and import) to be designed in a new private Figma file, "PPO - Products module", inside the accepted shell and to at least the standard of the Sales module file. All five Products pages already have owner-accepted designs that the native build of 7 October 2026 has not reached, so the file redraws those designs in the refined shell as the target and marks every sheet where the build or its data contract differs with a Build difference card. The [proposal record](../decisions/products-module-refined-ui-proposal.md) (PPO-PRODUCTS-REFINED-FIGMA-PROP) holds the sources, the conformance declaration for each scope, the rules applied, the assumptions and departures, and the build differences as an ordered list of 15 UI changes and 17 contract changes for a later, separately authorised build step. The drawing is in progress; the sheet inventory with node IDs, the verification and the audit are added when it is complete.

Checked: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. No application code, route, migration, permission or integration changed, and no Figma link or file key is recorded; acceptance and a named version are Dean's.

<!-- decision-index -->
[Products module refined UI proposal](../decisions/products-module-refined-ui-proposal.md) (PPO-PRODUCTS-REFINED-FIGMA-PROP) records the Products sheets being drawn on 12 November 2026 inside the accepted shell in a new private Figma file. It gives the conformance declaration for PD-01 to PD-05, the assumptions and departures, and the differences between the native build and the five accepted designs as findings for a separate build step. It is a **proposal** awaiting completion and Dean's acceptance and authorises no application code, route, migration, permission, integration or deployment; all data is synthetic.
