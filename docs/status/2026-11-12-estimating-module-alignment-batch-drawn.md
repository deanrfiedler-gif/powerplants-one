---
title: Estimating module alignment batch drawn in the Figma file; awaits an independent check, Dean's acceptance and a new named version
date: 2026-11-12
---

The alignment batch Dean decided on 12 November 2026 is drawn in the Estimating module Figma file. Section 13 of the [proposal record](../decisions/estimating-module-refined-ui-proposal.md) (PPO-ESTIMATING-REFINED-FIGMA-PROP) lists it, and section 10 of the [independent review](../decisions/estimating-module-independent-review.md) (PPO-ESTIMATING-REVIEW-PROP) gives the status of each finding. The batch is an amendment: the build still reads the named version "PPO - Estimating module (accepted)".

- **Facts corrected.** The Riverbend estimate shows one state and the dataset's totals. One issued quotation document now reads the same everywhere, and the preview matches the customer page. The tablet and phone workload sheets follow E01. Sam Jordan replaces the retired persona.
- **Shell alignment.** 119 record headers follow rules R116 to R125, with a toolbar row, Outputs in place of Reports and one state-driven primary. Overlay drawers are 480 px.
- **Defects and conventions.** Clipped tables re-balanced, phone targets and inputs sized, contrast fixed. Revisions two-digit, SYN-ORG- organisations, six-digit references, one chip tone per word, validity printed as a date.
- **New proposed sheets.** The customer quotation page redrawn as a document, with tablet and phone 320 sheets (QP09 to QP12); options and written acceptance, waiting on D-024 (QP13); a read-only phone estimate summary (PH14); a source change watch (CO07); and similar delivered jobs (W17). The file now holds 305 sheets.

Checked: a walk of all fifteen scope pages after the batch found no loose node, no overlap, no unlabelled sheet, Roboto only, no unbound paint outside instances, weekdays true and no retired fact left. Renders of 20 changed and new sheets were read. `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py` were run. Not done: the Design ready check by another session, prototype flows for the new sheets, Ready for dev marks and the per-route page guidance. No application code changed.

<!-- decision-index -->
[Estimating module refined UI proposal](../decisions/estimating-module-refined-ui-proposal.md) (PPO-ESTIMATING-REFINED-FIGMA-PROP) section 13 records the alignment batch of 12 November 2026 drawn from the independent review PPO-ESTIMATING-REVIEW-PROP: corrected facts, record headers to Shell rules R116 to R125, Design ready fixes, conventions, eight proposed sheets and assumptions A34 to A37. It awaits an independent check, Dean's acceptance and a new named version, and authorises no application code or deployment.
