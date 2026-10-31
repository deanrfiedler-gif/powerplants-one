---
title: Figma variables and styles reconciled under audit R8
date: 2026-10-25
---

Audit decision R8 is done in the private "PPO - Design" file. What changed:

- **Colour mode:** the "PPO colour" mode is now "Light".
- **Promoted variables:** all 27 `proposal/*` variables have permanent names (`shell/*`, `surface/row-selected`, `status/attention-dot`, `cpq/*`, `annotation/*`, `gantt/*`, `planner/*`). They record the matching CSS variable where the stylesheet defines the same value.
- **Tints:** seven tint variables replace paint opacity on proposal pages.
- **Chart colours:** a six-slot chart set, reordered so it passes the colour-safety checks, plus two neutrals.
- **Elevation:** eight effect styles, applied to library components and to 443 drawn shadows.
- **Text:** thirteen text styles with automatic line height cut unstyled text on proposal pages from 5,310 to 3,036 layers without moving anything.
- **Deals styles:** the 8 and 9 px Deals styles are now 11 px.
- **D4:** the Deals variables and styles stay as the accepted page's tokens, and the r37 icons stay as a legacy group until Deal record page and Pipeline insights are next amended.

Details, the old-to-new name table and the follow-ups are in section 12.6 of the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md). No build, review, acceptance or deployment status changes.
