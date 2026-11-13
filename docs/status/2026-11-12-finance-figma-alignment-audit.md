---
title: Finance module Figma file alignment audit
date: 2026-11-12
---

Dean asked for the Finance module's Figma file to be audited against the accepted shell, the shared addenda, the file's own record and "PPO - Library". The audit read all 15 pages and 222 sheets read-only and found 30 misalignments (no Blocker, 9 Major, 14 Minor, 7 Polish). The Majors are the dispute reference family `SYN-DSP-`, which clashes with Supply's dispatch family; 13 gendered pronouns; the My Work count; phone record headers redrawn instead of instanced; tablet sheets without the accepted right strip; chip tones that differ for the same word; Jamie Rossi's role; the contrast of the accepted record header primary; and the drawer-width conflict between the Shell and the Library. Eight questions go to Dean. A per-file alignment batch is ready for the file's next build session. No Figma file, other record or code was changed.

Checked: structure, labels, grid, overlaps, shell instances, fonts, paints, chip tones, references, names and text rules were extracted by script from every scope page; the recorded node IDs were compared with the file (222 of 222 resolve); Library variables, text styles and components, the Shell's docked Finance menu and its 1024 sheet were read for comparison; facts were tested against the sibling refined-UI records. Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

<!-- decision-index -->
[Finance module Figma alignment audit](../decisions/finance-figma-alignment-audit.md) (PPO-FINANCE-FIGMA-ALIGNMENT-AUDIT) records the read-only audit of 12 November 2026 of the Finance module's Figma file: 30 findings with node IDs, the alignment matrix, eight questions for Dean and the order in which the file's next build session should fix them. It changes no design and accepts nothing.
