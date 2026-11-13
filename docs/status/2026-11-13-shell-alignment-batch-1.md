---
title: Shell alignment batch 1 applied; the accepted Shell file awaits Dean's acceptance and a new named version
date: 2026-11-13
---

On Dean's instruction of 13 November 2026 to proceed on the review's recommendations, alignment batch 1 applied the [independent Shell review](../decisions/shell-independent-review.md) (PPO-SHELL-REVIEW-PROP) to the private Figma file "PPO - Shell". [Shell decision record section 14](../decisions/shell-refined-concept-design.md#14-alignment-batch-1--13-november-2026) records the change. The file's link and key are not recorded (ADR-0050, ADR-0053).

- **Fixed in the file.**
  - Facts: the demo chip's contrast (now 12.97 : 1), five weekdays, the Riverbend deal, site and contact role, and the technician, authoriser and engineer personas.
  - Type: section eyebrows at 11 px, with 10 px kept only for badge numerals and avatar initials (C6).
  - References and copy: the menus' references and copy, and stale labels and descriptions.
  - Rules cards: the notes card and the toolbar rules card now carry the rules export word for word.
- **New components.**
  - Shell / Workspace flyout and Shell / Workspace menu · docked, with a Workspace property.
  - A Tab property on the right drawer, a Width property on the top bar, and a twelve-workspace variant of the expanded rail.
  - Every menu, drawer and narrow-bar sheet now holds an instance.
- **Variables.** Role scopes and CSS names on all 66, the mode renamed "Value", and `accent/estimating-ink` set to #156e64.
- **Repository.** The rules export is marked as the governing text, with the C6 and R15 sentences the batch added; the shell system page and the review record are updated.

Checked through the Figma connector on all three pages:
- No detached frame except AH's declared copies, no child outside its bounds and no overlaps.
- Type is on the scale and every weekday is true.
- The only plain paints are the three R15 names; contrast passes except the annotations and a disabled control.
- Every menu sheet holds its variant, and the page totals match the footers.
- Five sheets were rendered and inspected.

Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_foundation.py` and `python3 scripts/check_naming.py`.

Not done:
- **Acceptance and named version.** Dean's acceptance in words and a new named version: the version saved as "alignment batch 1" predates the batch.
- **Addendum A3.** It should confirm the personas and reference families.
- **Module files.** Their copies follow in their own changes.
- **Application code.** None changed.

<!-- decision-index -->
[Shell refined concept decision record, section 14](../decisions/shell-refined-concept-design.md#14-alignment-batch-1--13-november-2026) (PPO-SHELL-REFINED-FIGMA-DEC) records alignment batch 1 of 13 November 2026: the Shell review's findings SR-01 to SR-22 applied to the accepted file, new component sets for the workspace menus, the right drawer, the top bar and the expanded rail, and the rules export confirmed as the governing text. It awaits Dean's acceptance and a new named version and authorises no application code.
