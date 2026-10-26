---
title: Figma proposal pages bound to PPO tokens and text styles
date: 2026-10-25
---

Audit decision R7 is done on 75 proposal pages of the private "PPO - Design" file. Accepted pages, unfinished drafts, Customer 360 and the UX exemplars were not touched. What changed:

- Fills whose colour equals a PPO colour variable are bound to it.
- Near-miss colours such as `#242938` are bound to the token they missed (`brand/navy`).
- Off-palette greys and two off-palette blues are replaced by the nearest token of the same hue.
- PPO text styles are applied wherever text already matched one exactly.

A read-only check afterwards found, on every page, no opaque token-valued fill left unbound and no exactly matching text left without a style. A screenshot spot-check showed no visible change.

Left as drawn, with the reasons in section 12.4 of the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md):

- scrims and the chart colours
- 2,910 semi-transparent token fills, because Figma drops paint opacity on binding
- 5,310 unstyled text layers that use automatic line height, which no PPO style has

The last two are added to R8. Appendix B of the report has the per-page results. No build, review, acceptance or deployment status changes.
