---
title: Sales module refined UI pages proposed in Figma
date: 2026-11-09
---

Dean asked for refined desktop UI pages for the Sales module in a brand-new private Figma file, "PPO - Sales module (proposal)", composed inside the accepted shell ("PPO - Shell", named version "Shell refined concept — accepted", 8 November 2026) and using the trial "PPO - Shell concept" Sales sheets as reference only. The [proposal record](../decisions/sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) lists the 34 sheets at 1440 × 900 with their Figma node IDs across seven sections (Deals, Deal record, Leads and Sales Pulse, Tasks, Activities and Email, Handovers and aftercare, Contacts, customers, products and insights, Dialogs and states), the rules applied from his brief (one line per register cell with sideways scrolling; no second search box in the content area), assumptions A1–A10 for his decision and what is not drawn. The file's link is not recorded here (ADR-0050, ADR-0053).

Checked: every sheet was rendered and inspected after each change; a structural pass over all 34 sheets found no child outside its 1440 × 900 frame, no wrapped text in a register cell, no duplicate sheet labels and Roboto as the only font family. Repository checks run for this change: `python3 scripts/build_status.py --check`. Not done: owner review and acceptance, a named Figma version, phone and tablet variants, prototype links, page-guidance updates in `docs/design/development/pages/` (they follow acceptance), any application code. Every record, person, value and date shown is synthetic.

<!-- decision-index -->
[Sales module refined UI proposal](../decisions/sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) is a **proposal**: 34 desktop sheets for the Sales workspace drawn on 9 November 2026 inside the accepted shell in a new private Figma file, with one line per register cell and no second search box, awaiting Dean's review; it authorises no application code, route, migration, permission or deployment, and all data is synthetic.
