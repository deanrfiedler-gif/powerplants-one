---
title: Independent review of PPO - Library taken up
date: 2026-11-12
---

On 12 November 2026 Dean merged the [independent review](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) of the private Figma file "PPO - Library" and then said "Continue". That review was read-only and handed eight items to the session that holds the library. This session verified each in the file and took up the first five, in two passes. The [library audit](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC), section 9, holds the result.

- **Fault fixed.** Two variants of Grid / Cell · Edit painted a black background behind the value. `surface/hover` was re-applied and both now render the hover surface.
- **Audit record corrected.** It no longer says spacing was fully bound, and its open note on the Grid hover reading is closed.
- **Two smaller fixes.** The Form / Save bar set no longer clips its tallest variant. Time / Band's Not working and Unavailable kinds each start with their own name.
- **Option names.** One rule now holds on sixteen component sets, with no change to how anything looks:
  - `Rest` is the resting state, in place of `Default`;
  - `Kind` is the kind of part, in place of `Type` and `Style`;
  - Controls / Switch has `Checked` and `State`;
  - fourteen show-or-hide options start with "Show".
- **Ticked and chosen, apart from pointer state.** Checkbox, Radio, Check option, Form / Choice, Tab, Filter chip, Menu item and Segment each have two options in place of one, as Controls / Switch already had. A ticked box with focus, a disabled chosen radio and the current tab with focus can now be drawn. 38 variants were added; no placed instance changed.
- **Spacing.** 351 padding and gap values inside components now use a spacing variable. 103 remain because no variable holds their value (1, 5, 10, 20 and 32 px).
- **Records.** The Controls, Grid, Forms, Phone, Record and Time records name the options as they now are.

**Checked:** each changed set and two composed examples were rendered and inspected. The options of every set were read back after the renames. The 3,138 instances recorded beforehand each still point at the same component. The 33 placed bands were read back with their own labels. The eight restructured sets were rendered, and their 321 placed instances each still point at the same variant. Sweeps of every page for bound fills and outlines that store black found eight, all re-applied. Repository checks: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**Not done:**
- Five sets that the review did not name still mix a kind or a choice into `State`: Form / Option, Form / Match card, Time / Day header, Time / Lane header and Gantt / Dependency.
- One base for the banner-shaped parts, one count badge and shared placeholders (R5).
- A mark for unavailable days and buttons for lone phone links (R7, R9).
- New spacing steps for 20 and 32 px, the Danger button's Pressed layer (R6) and the disabled Menu item (R12) are left for Dean.
- Review-board texts were not re-read for the old option names.
- No page is accepted and the library is not published.
- No application code, binding, register or page guide changed, and no variable was added.

File links are not recorded here (ADR-0050, ADR-0053).

<!-- decision-index -->
[PPO - Library audit and decisions](../decisions/library-audit.md) (PPO-LIBRARY-AUDIT-DEC) now records, in section 9, what was taken up from the [independent review](../decisions/library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP) on 12 November 2026: a rendering fault fixed, a correction to its own spacing finding, one naming rule for component options applied to sixteen sets, ticked and chosen separated from pointer state on eight controls, and 351 spacing values bound. It authorises no application code, route, migration, permission or deployment.
