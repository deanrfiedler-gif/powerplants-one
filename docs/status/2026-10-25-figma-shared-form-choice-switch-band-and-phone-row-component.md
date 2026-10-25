---
title: Figma shared form, choice, switch, band and phone row components under audit R6
date: 2026-10-25
---

Audit decisions R11 and R6 are done in the private "PPO - Design" file.

- **R11:** no change was needed. Every list-type phone screen already carries the Conversations action in the compact phone header. The stage 1 finding missed it because it counted only layers drawn on the page, not inside instances. The remaining phone screens without that header are customer portal pages, task forms and sheets, and four older ES-08 screens that take the Record header at ES-08's next amendment.
- **R6:** five proposed shared component sets are on the Components page: Controls / Form field, Switch and Choice option, Grid / Group band, and Grid / List row (phone). They unify the page-local versions and use the PPO tokens and text styles. Three `status/info/*` variables were added from the stylesheet's `--info` set for the band's Info tone.
- **Adoption:** no page was changed. Pages adopt the shared components at their next amendment.
- **Register:** the [component register](../design/development/components.json) mappings for fields, validation, mobile form and register table list the new components.

Details are in sections 12.9 and 12.10 of the [Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md). No build, review, acceptance or deployment status changes.
