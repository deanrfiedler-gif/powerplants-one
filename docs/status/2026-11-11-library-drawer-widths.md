---
title: Right-hand drawer widths set for PPO - Library
date: 2026-11-11
---

Dean asked whether 432 px, the Sales file's edit panel, was the most professional width for a desktop drawer. The answer recommended 480 px, the shell's snapshot drawer, which the Sales file says its panel should match. Dean then listed the widths he considers usable, 360, 480, 640, 720 and 800 px, and chose four of them with a rule for narrow screens. The [decision record](../decisions/library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) has the detail.

- **Widths.** By content:
  - `drawer/narrow` 360 px: filters, column choosers and short lists;
  - `drawer/standard` 480 px: the snapshot, editing a section, an activity, an email or a file;
  - `drawer/wide` 640 px: two-column create forms;
  - `drawer/extra-wide` 800 px: previews and comparisons.

  720 px was dropped because it sits 80 px from both neighbours.
- **Narrow screens.** Below 1280 px a drawer wider than 480 px fills the content area; on phones every drawer is full screen. Drawers overlay the page without a scrim.
- **In the library.**
  - The Record page's edit drawer is 480 px.
  - Quick add on the Forms page moved from 680 to 640 px, and `form/panel-width` became `drawer/wide`.
  - The Foundations layout table and the Read me list the scale.
- **To align later.** Accepted pages and built screens keep their current widths until a reviewed change aligns them: Sales A5 (432 px), Create forms Q1 (680 px), the PJ-03 working calendar (680 px), the Projects proposal and the built Organisations drawer (380 px).

**Checked:** the four variables were read back from the file. The Record and Forms cards that use them, and the Foundations table, were rendered. Repository checks as for the Record page.

**Not done:** no module page, built screen or application code changed; the library is not published.

<!-- decision-index -->
[Right-hand drawer widths in PPO - Library](../decisions/library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) records Dean's decision of 11 November 2026. Right-hand drawers are 360, 480, 640 or 800 px by content, overlay the page without a scrim, fill the content area below 1280 px when wider than 480, and are full screen on phones. It lists the accepted pages and built screens that align at their next reviewed change, and authorises no application code or deployment.
