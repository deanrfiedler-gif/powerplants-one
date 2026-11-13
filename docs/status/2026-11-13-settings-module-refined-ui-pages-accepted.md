---
title: Settings module refined UI pages accepted; reference families adopted
date: 2026-11-13
---

Dean asked for professional recommendations on the Settings module decisions still open, then answered: "I am happy for you to proceed based on all your professional recommendations." Section 11 of the [Settings refined UI record](../decisions/settings-module-refined-ui-proposal.md) (PPO-SETTINGS-REFINED-FIGMA-PROP) records each decision and the design's acceptance. The acceptance covers all 270 sheets in the private Figma file, on desktop, tablet and phone. It does not cover prototype behaviour, built pages, capabilities, integrations or business approval.

Applied in the file:
- **Primary colour.** The record toolbar primary now uses brand/navy, 14.37:1 with white text. This is Dean's Q-B decision of 12 November 2026, which closes C7; the darker-green proposal is withdrawn.
- **Scrims.** All 21 scrims are bound to brand/navy at 32 %.
- **References.** The Goulburn dispute now reads `SYN-DPT-000003`, and the order revision reads `r02`.
- **Later frames.** The five sheets after the 09:40 publication are labelled as later frames.
- **Wording.** "Safe retry" now reads "Retry with checks".
- **Numbering registry (GL04).** It now shows the fourteen Settings families as adopted, and carries a proposed settlement of the reference-family clashes between module files.
- **Read me and page order.** The Read me page and the audit card record the acceptance. The scope pages sit under "— Accepted —".

In the repository:
- [PPO-STD-001](../standards/naming-conventions.md) section 10.2 adopts the fourteen Settings families, from ACR to TDF, with a dated amendment. They name synthetic design records only, and no counter is implemented.
- The [design-to-build standard](../standards/design-to-build-standard.md) names the file `PPO - Settings module`.
- The fourteen design register pages (AD-01 to AD-10, AI-06, EC-02, SH-03, SH-05) point to their page in the file, with the status "refined design accepted, not built to it".

The named version "PPO - Settings module (accepted)" and the file rename are Dean's. Until that version exists, no build basis is pinned. The file's link is not recorded here (ADR-0050, ADR-0053).

Checked:
- position checks on the Global configuration and Read me pages;
- renders of the changed sheets;
- a words scan that finds no "safe";
- the toolbar contrast recomputed;
- repository checks `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py`, `python3 scripts/check_naming.py` and `npm run studio:check`.

Still open:
- the keyboard, screen-reader and zoom review with a person and a device, and prototype links;
- the state-to-tone table across files;
- adopting the cross-file clash settlement;
- the Shell's Recent-row stand-ins and the remaining register notes;
- two polish items.

Nothing here changes code, routes, migrations, permissions or integrations. Every record, person, value and date shown is synthetic.
