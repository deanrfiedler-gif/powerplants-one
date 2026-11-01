---
title: Retention and information lifecycle AD-08 design accepted
date: 2026-11-01
---

Dean accepted the Figma design for AD-08, retention and information lifecycle: "Accept, recommendations". The [design decision](../decisions/retention-lifecycle-figma-design.md) (PPO-AD08-RETENTION-FIGMA-DEC) records D1–D14 and the recommended answers to Q1–Q10:
- a policies register by status, with each adopted period shown with its source and everything else as "Policy not set";
- every legal basis reads "To be confirmed", and PPO gives no legal view;
- holds stop deletion in PPO, and held records show "On hold: deletion suspended";
- requests are verified, decided, and tracked to an actual outcome per system, and PPO deletes nothing from MYOB or SharePoint;
- an export file for a deletion request is removed once the handover is recorded, and the manifest and hash stay.

Q5 adopts the assistant's chat, draft and unresolved-intent periods, so section 7 of the [assistant specification](../blueprints/ppo-assistant-specification.md) changes in the same pull request. Q1–Q10 are design direction, not verified operating rules. Q7 stays open for advice before any build. Twenty-two icon-free captures with hashes are retained in [retention-lifecycle-design-r01](../reference/ui/retention-lifecycle-design-r01/README.md), and the design register page for `scope:AD-08` cites them.

Checked:
- No Font Awesome instance is left in the capture copies, which were temporary and were deleted from Figma after export.
- The page has no overlaps or off-page links.

Not done:
- The prototype flows weren't played in Figma Present mode. Devices, keyboard and screen reader weren't checked.
- `/admin/retention` isn't built.
- The named Figma version "Retention & lifecycle — accepted" waits for Dean.
- No privacy contact is named, no advice has been sought, and D-012, D-020, D-021 and D-024 stay open.

No application code, route, migration, permission, grant, adapter or parent ID changes.

<!-- decision-index -->
[Retention and information lifecycle design](../decisions/retention-lifecycle-figma-design.md) (PPO-AD08-RETENTION-FIGMA-DEC) records Dean's 1 November 2026 acceptance of the AD-08 design: policies by status with their sources, holds that stop deletion in PPO, and requests tracked to actual outcomes per system. It gives no legal view. Building `/admin/retention` isn't decided.
