---
title: Drawer widths measured as the panel, with the tab strip outside
date: 2026-11-14
---

Dean decided on 14 November 2026 what the library's drawer widths measure: "drawer widths are the panel; the tab strip sits outside". The widths of 11 November 2026 (360, 480, 640 and 800 px) are unchanged; each is now the drawer panel's own width, and on desktop the shell's 48 px tab strip stands beside it, so a standard drawer and the strip together cover 528 px. The [drawer widths record](../decisions/library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) gains section 6: the question, the decision and its reasons, and the alignment table.

The decision settles a split among the module files. On 13 November 2026 the Projects alignment audit (AQ-1) counted the tab strip inside 480 px, while the Products review (Q-1) and the Estimating alignment batch placed 480 px panels beside it; the Service and Engineering decisions waited for the two to be reconciled, and seven other reviews and audits asked. Projects AQ-1 and the record's earlier row "Shell snapshot drawer: unchanged" are superseded. The shell's snapshot drawer and Assistant panel move from a 432 px panel to a 480 px panel with alignment batch 1's acceptance and its new named version; the module files align in their own batches; the library adds a note to its Drawer part. Products and Estimating already follow the decision. The file links are not recorded (ADR-0050, ADR-0053).

Checked: the record's sources were read on `main` (the shell rules R45, R67, R98 and R112, the Projects, Products, Estimating, Service, Engineering and other alignment records); the library file's Drawer part `217:656` and the Record page's card 7 were read through the Figma connector, and they show a 480 px panel with no tab strip. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`. Not done: no Figma file, variable, design register entry, page guide or application code is changed; each file's change, and each accepted file's new named version, follows in its own session.

<!-- decision-index -->
[Right-hand drawer widths in PPO - Library](../decisions/library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) now records Dean's decision of 14 November 2026 that each drawer width is the panel's own width, with the shell's 48 px tab strip outside it. It changes no width, variable, Figma file or application code; the shell, library and module files align in their own reviewed changes.
