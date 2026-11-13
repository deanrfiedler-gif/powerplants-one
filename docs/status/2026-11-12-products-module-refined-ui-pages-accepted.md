---
title: Products module refined UI pages accepted, with record sub-lines shortened and Build difference cards on a switch
date: 2026-11-12
---

On 12 November 2026 Dean accepted the Products module refined UI pages ("accept"). The [proposal record](../decisions/products-module-refined-ui-proposal.md) (PPO-PRODUCTS-REFINED-FIGMA-PROP) records the acceptance in its section 11:

- It covers the 122 sheets and 7 notes cards, assumptions A1 to A24 with each page's own, and the audit's recommended order.
- It does not cover the build. The build differences stay design findings for separate, authorised steps.
- The proposed automation candidates N-P5 to N-P12 stay proposals.

Section 12 records the two refinements applied after it:

- **R1:** 53 record header sub-lines are cut to one line. The import batch records keep their stager, date, rows, hash and plan.
- **R2:** the 99 Build difference cards now follow a "PPO review" variable mode, so a page set to Presentation hides them all at once.

The seven scope pages moved above the "— Proposals —" separator with their node IDs unchanged. A named version is Dean's to save. Section 13 records it once saved; the suggested name is "PPO - Products module (accepted)".

Checked: the structural pass reports no issue on any of the seven pages after the changes. Every rewritten import sub-line fits one line. `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py` pass. Not done: the named version, which the tools cannot save; the design register and scope-page corrections (A24); any application code, route, migration, permission or integration. Every product, supplier, price, file and person shown is synthetic.
