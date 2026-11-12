---
document_id: PPO-LIBRARY-AUDIT-DEC
date: 2026-11-11
owner: Dean Fiedler
status: Audit of the private Figma file "PPO - Library" carried out on 11 November 2026 at Dean's request, with Dean's decisions of the same day; the fixes in section 4 are drawn in the library, the motion timings were confirmed by Dean on 12 November 2026, the directions in section 5 guide later work, and section 9 takes up the independent review of 12 November 2026; the library is not published; no application code, route, migration, permission or deployment
versioning: git
---

# PPO - Library audit and decisions, 11 November 2026

**Owner:** Dean Fiedler · **Date:** 11 November 2026 · **Status:** Owner decisions on an audit. The fixes are drawn; every library component stays `Status: Proposed` until Dean accepts its page.

## 1. The request

Dean asked for an audit of every page built in `PPO - Library`, to find:
1. any gaps;
2. improvements or refinements;
3. anything that could look more professional and be more user friendly;
4. whether it aligns with industry best practice;
5. new and innovative features that should or could be added.

## 2. Basis and limits

- **Measured scan.** A read of all twelve pages: about 21,600 layers and 54 component sets. It checked every text layer's contrast and size, every interactive part's size and states, token binding, text styles, component descriptions, prototype links and truncation.
- **Sources.** The accepted decisions behind each page, as its record lists them.
- **Limits.**
  - Contrast was measured only against solid backgrounds.
  - Two Grid cell hover readings (dark text on what read as black) look like a see-through overlay, not a fault; this was not confirmed. The [independent review](library-independent-review.md) of 12 November 2026 confirmed it as a fault, fixed the same day (section 9).
  - The "more professional" findings rest on the renders made while drawing, not a fresh visual review of every card.

## 3. Findings

**Strengths**
- No colour or corner left unbound across the scanned layers; one text layer without a style. Spacing was not measured, and this line first said none was unbound. The independent review found 342 of 1,130 padding and gap values inside components without a variable; 351 were bound on 12 November 2026 and 103 remain (section 9).
- Every component has a status line; one description was short.
- Decisions, sources and a change log are recorded per page.
- Density and control-size modes exist, including Touch.

**Gaps**

| Area | Gap |
|---|---|
| Groups | Phone patterns; the shell and page template |
| Drawer | Four widths existed as variables, with no Drawer component |
| Controls | Switch, segmented control, search field, pagination, multi-select with chips, date range, file drop zone, progress bar |
| Data display | No stat tile and no chart parts |
| Collaboration | No comment or mention thread; no notification item |
| Decisions | No shared "decision with a reason" dialog |
| Foundations | No motion, breakpoint or dialog-width variables; 29 icons against the shell's 101 |
| Handoff | 30 of the then 124 variables carry a CSS name; no component is mapped to code |
| Prototypes | Few wired parts on Time (5) and Gantt (3) |

**Measured defects**

| Finding | Evidence |
|---|---|
| Contrast failure on the Now pill | White 10 px text on brand/green-deep: 3.57:1 against the 4.5:1 of WCAG 1.4.3; six cases on Time, one on Gantt |
| Small targets | Checkbox and Radio 16 × 16 px with no stated hit area |
| Missing states | No focus on Form / Day; no disabled state on Controls / Tab and Filter chip; no hover on Checkbox, Radio and Form / Choice |
| Tab differs from the built app | Library 38 px with a brand/green-deep marker and an untied height; built record tabs at least 48 px with a navy underline |
| Tiny text | Text / 10 Medium in use; scaled Board thumbnails down to 8 px |
| Truncation | Text cut off 572 times on Grid, 140 on Time and 120 on Board, while forms and facts follow "never cut off" |
| Read me | The cover label had no text style |

**Against common practice.** The library is strong on token binding, documentation and decision history. It lacks:
- a second tier of colour tokens;
- a second theme;
- design-to-code mapping;
- accessibility notes in the file;
- motion and breakpoint tokens.

## 4. Decisions and what was done

All decisions are Dean's, on 11 November 2026.

| # | Decision | Done in the library |
|---|---|---|
| A1 | The Now pill, and the Now line with it, use status/success | Time / Now line: pill and rule on status/success, time in 11 Medium (6.1:1). The Gantt page's planner example follows through its instance |
| A2 | Tabs are 48 px with a navy marker | Controls / Tab: 48 px, 2 px brand/navy marker, and a Disabled state |
| A3 | Retire 10 px text | Text / 10 Medium deleted after its nine uses moved to Text / 11 Medium; twelve text styles remain |
| A4 | Add the missing states and the target-size rule | Added: <ul><li>Disabled on Filter chip</li><li>Hover on Checkbox and Radio</li><li>Hover on Form / Choice</li><li>Focus on Form / Day</li></ul>The Checkbox and Radio descriptions set a target of at least 24 px, the whole row with a label, and 44 px in Touch |
| A5 | One truncation rule | Read me rule 6: text is cut off only in dense lists, always with the full value on hover and focus and on the record; fields, facts and messages wrap |
| A6 | One Drawer component, on the Controls page | Controls / Drawer in the four [drawer widths](library-drawer-widths.md), with a title and Close, a content slot and a Form / Save bar footer; a Drawer card on the Controls board. Form / Save bar's desktop buttons now wrap together below the sentence, so the bar fits the Narrow drawer |
| A7 | Dialog widths of 560 and 720 px | `dialog/standard` and `dialog/wide`. Controls / Dialog has a Width option: Standard 560 px and Wide 720 px, tied to them |
| A8 | Breakpoints | `breakpoint/tablet` 768, `breakpoint/laptop` 1024, `breakpoint/desktop` 1280 and `breakpoint/wide` 1440, from shell R94 and R75, the drawer rule and the shell sheets |
| A9 | Motion timings; proposed on 11 November and confirmed by Dean on 12 November 2026 | A "Motion" collection: `motion/fast` 100 ms, `motion/standard` 200 ms, `motion/slow` 300 ms and `motion/delay` 300 ms. With reduced motion nothing slides and fades are 100 ms or less. The delay is already decided (States S2; shell R93); Dean confirmed the other three on 12 November 2026; they are still to be judged in a prototype |

Dean also confirmed the Record page's items R1 to R4 and R6 ([Record record](library-record.md), section 6).

With these the library held 134 variables in six collections (138 since the [Phone page](library-phone.md)); [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

## 5. Directions for later work

Dean agreed these on 11 November 2026. B4, B5 and B7 have since been drawn, as their rows say; the others are not.

| # | Direction |
|---|---|
| B1 | **Themes.** Light only for now. A high-contrast mode comes before any dark mode |
| B2 | **Base colour palette.** Deferred until a second theme or brand exists |
| B3 | **CSS names.** Every variable gets its code name before the library is first published, as one reconciliation against the built application (ADR-0067 stage 5). The independent review adds two points to it: `radius/dialog` is 12 where the application has 10, and the colour variables copied from the shell have no scopes |
| B4 | **Prototypes.** After Phone patterns, wire three flows: editing a record section and saving; a save whose outcome is unknown, then Check the outcome; moving a card on a board. Drawn on 12 November 2026 ([Play record](library-play.md)) |
| B5 | **Missing controls, in order.** Search field and multi-select; file drop zone; pagination; switch and segmented control. Drawn on 12 November 2026 ([Controls record](library-controls.md), section 7) |
| B6 | **Stat tiles and charts.** After the shell and page template, before any reporting or dashboard design |
| B7 | **New features.** Draw "How this was worked out" and "Changed since you last looked" as Proposed parts on the Record page. AI features come later, each after a rules-based version. Drawn on 12 November 2026, rules-based, with five items to confirm ([Record record](library-record.md), section 7) |
| B8 | **Publishing.** After the shell move and page template and Dean's first page acceptances; then the standard's pilot on a copy of one module file |

Order of work: Phone patterns (drawn on 11 November 2026, [Phone record](library-phone.md)), then the shell and page template (which needs Dean's desktop copy of the shell components), then B5 to B7.

## 6. To align at the next reviewed change

None of these is changed by this record.

| Where | Today | Under these decisions |
|---|---|---|
| Sales kit tab and shell R58 | 38 px with a brand/green-deep marker | 48 px with a brand/navy marker |
| Accepted Sales week view (A01) and the built Service planner | Now line and pill in brand/green-deep | status/success |
| Sales kit avatar | 10 px initials at 24 px | 11 px |

## 7. Not done and open

- **Closed with the Phone page.** Two items first listed here were done when the [Phone page](library-phone.md) was drawn, also on 11 November 2026: Controls / Dialog was fitted to the dialog widths, and the Record page's card 7 now places Controls / Drawer.
- **Controls page leftovers.** A structural read after the changes found the focus rings' corner radii are plain numbers and two layers are named "Text". Both predate the audit. The layer names were fixed on 12 November 2026.
- **Not addressed.** The Board page's scaled thumbnails with text below 11 px. The Grid hover reading in section 2 was a fault and is fixed (section 9).
- **Motion.** Dean confirmed the three timings on 12 November 2026: "Confirm Ph1–Ph7 as recommended and the motion timings". They have not been judged in a prototype or in code.
- **Proof.** No prototype links were added. Keyboard, focus and reduced-motion behaviour need the browser proof once code exists.
- **Code.** No application code, binding, register or page guide changed. The new variables have no CSS property.

## 8. Checks

- Each changed component was rendered and inspected: tabs, filter chips, tick boxes, radios, choices, the date picker's day, the Now line and the Drawer.
- The Drawer card, the Controls values card, the Record page's card 11 and the Foundations layout and motion tables were rendered and inspected.
- A defect found on the way was fixed: the save bar's sentence was squeezed beside its buttons in the Narrow drawer, so the desktop save bar now wraps its buttons below the sentence.
- Text / 10 Medium was deleted only after a read of every page found no layer using it.
- Variables read back from the file: 66 in "PPO colour", 45 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density", 5 in "Control size" and 4 in "Motion" (134). Twelve text styles.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

## 9. Independent review taken up — 12 November 2026

On 12 November 2026 Dean asked a second session to review the library. Its record is the [independent review](library-independent-review.md) (PPO-LIBRARY-REVIEW-PROP), which Dean merged the same day. It was read-only and handed eight items to this session, which holds the library. Dean then said "Continue". Each item is a finding to verify; each was read in the file before anything changed.

| # | Item | Result |
|---|---|---|
| 1 | R1: Grid / Cell · Edit paints black | **Confirmed and fixed.** Both variants held a paint bound to `surface/hover` that stored black. The variable was re-applied; the set and the Playground render the hover surface. The cause was not established |
| 2 | Correct this record | **Done.** Sections 2, 3 and 7 now say what the file shows |
| 3 | R8: Form / Save bar set clips a variant. R13: two band labels | **Done.** The set is 1274 × 604 px and clips nothing. Time / Band's Not working and Unavailable each have their own label option, so each starts with its own name; the 33 placed bands kept their labels |
| 4 | R4: one naming rule for options. R3: separate chosen from pointer state | **Done for the eight controls the review names.** The renames below are made, and ticked and chosen are now separate from pointer state. Five other sets are listed below and not changed |
| 5 | R2: bind plain spacing | **Done.** 351 values were bound first. After Dean's decision below, the rest were bound or moved to a step; only 1 px offsets remain plain |
| 6 | R5: one base for banners, one count badge, shared placeholders | **Done in part, by choice.** One count badge and shared placeholders are made. The seven banner-shaped parts stay separate, for the reason below |
| 7 | R7: a mark for unavailable days. R9: buttons for lone links on a phone | **Done** |
| 8 | R10 and R11 join the B3 reconciliation | **Noted** in direction B3 |

**Option names changed (item 4).** No variant changed its look, and every placed instance kept its variant.
- **`Default` became `Rest`** as the resting pointer state on eleven sets: Button, Link, Icon button, Filter chip, Tab, Menu item, Removable chip, Segment, Grid / Header cell, Grid / Row and Phone / Menu row. Grid / Cell's Row state follows.
- **`Type` and `Style` became `Kind`** on Controls / Field, Grid / Cell, Phone / Header and Form / Choice.
- **Controls / Switch:** `State` (Off, On) became `Checked`, and `Interaction` became `State`.
- **Parts that can be hidden start with "Show".** Fourteen options were renamed: Show leading icon (Button, Menu item, Phone / Menu row), Show shortcut (Menu item, Tooltip), Show action (Toast, Banner), Show dismiss (Banner), Show helper (Field, Checkbox field), Show menu button (Grid / Header cell), Show flag (Grid / Cell), Show second action (Phone / Sheet) and Show withheld note (Record / Working).
- **Kept as they are:** Required, Filtered, Frozen edge, Attention and Changed. Each says a condition is true; none hides a part.
- **Ticked and chosen separated (R3).** Each of the eight controls now has two options in place of one, in the shape Controls / Switch already had. Existing variants were renamed and the missing combinations drawn; no placed instance changed.

  | Control | Options now | Variants | Added |
  |---|---|---|---|
  | Controls / Checkbox | Checked (Off, On, Mixed) by State (Rest, Hover, Focus, Disabled) by Surface | 24, from 12 | Ticked and mixed, each with hover, focus and disabled |
  | Controls / Radio | Checked (Off, On) by State by Surface | 16, from 10 | Chosen with hover, focus and disabled |
  | Controls / Check option | Checked (Off, On) by State (Rest, Hover, Focus) | 6, from 4 | Ticked with hover and focus |
  | Form / Choice | Kind by Checked (Off, On) by State | 16, from 10 | Chosen with hover, focus and disabled, as a row and as a card |
  | Controls / Tab | Selected (false, true) by State | 8, from 5 | The current tab with hover, focus and disabled |
  | Controls / Filter chip | Selected (false, true) by State | 8, from 5 | An applied filter with hover, focus and disabled |
  | Controls / Menu item | Selected (false, true) by State | 8, from 5 | The current choice with hover, focus and disabled |
  | Controls / Segment | Selected (false, true) by State | 8, from 5 | The chosen view with hover, focus and disabled |

  - Hover on a ticked box, a chosen radio and a chosen card darkens to brand/navy-deep or a brand/navy outline. Hover on the current tab, menu item and segment looks the same as rest. An applied filter chip gains a link-blue outline on hover.
  - Disabled with a tick or a choice is the same drawing at 45%, the accepted rule (Sales ST01).
  - `Selected` replaces the Current state on Tab and the Active state on Filter chip.
- **Five more sets, renamed later the same day.** No placed instance changed (39 read back).
  - Form / Match card: Selected (false, true), in place of Default and Chosen.
  - Form / Option: Selected (the chosen match) by State (Rest, Highlighted). Highlighted is the keyboard position, so it stays a state. One variant was added: a chosen match that is also highlighted.
  - Time / Day header: Kind (Day, Today, Warning).
  - Time / Lane header: Status (Available, Away).
  - Gantt / Dependency: Tone (Neutral, Warning).

**Spacing bound (item 5).** Inside components, outside nested instances:

| Page | Newly bound | Already bound | Still plain |
|---|---|---|---|
| Controls | 86 | 489 | 28 |
| Grid | 2 | 147 | 6 |
| Move | 4 | 3 | 0 |
| Board | 74 | 62 | 3 |
| Time | 106 | 0 | 10 |
| Gantt | 15 | 1 | 0 |
| Forms | 4 | 184 | 10 |
| States | 56 | 48 | 46 |
| Record | 2 | 244 | 0 |
| Phone | 2 | 166 | 0 |

After that pass, 103 were still plain: 39 of 1 px, 4 of 5 px, 14 of 10 px, 16 of 20 px and 30 of 32 px. The spacing variables were then 2, 4, 6, 8, 12, 16 and 24. The table shows that first pass; the decision below dealt with the rest.

**Decided by Dean — 12 November 2026.** Claude recommended three changes, and Dean answered: "Proceed based on your recommendations." All three are drawn.

| Decision | Done in the library |
|---|---|
| Add spacing steps of 20 and 32 px | `space/20` and `space/32` in "PPO layout", which now holds 52 variables (141 in the library). 16 values of 20 px and 30 of 32 px on the States parts use them. The Foundations table lists both |
| Move the 5 and 10 px values to the nearest step | <ul><li>12 px: the gap in Controls / Toast and Banner; the left padding of the plain Board / Stage header</li><li>8 px: the gap in Controls / Checkbox field, the Board / Card placeholder, Board / Stage · Collapsed and Time / Lane header</li><li>4 px: the side padding of the Time / Now line pill</li></ul>Each sat halfway between two steps; the choice was made case by case |
| Danger, Pressed: an 18% white layer in place of 24% | The label on it measures 4.70:1 (4.12:1 before). Primary keeps 24%. This amends Controls C1 for Danger only |
| Disabled Menu item at 45% | The row's content dims to 45%, the accepted rule (Sales ST01), in place of a 70% label |

Inside components, 1,813 padding and gap values now use a variable. The 45 that do not are all 1 px offsets.

**The last three review items (6 and 7).**
- **One count badge.** Board / Count and Move / Count badge are now one set, Controls / Count `314:17992`, with Tone (Neutral, Navy). All 58 placed badges kept their numbers.
- **Shared placeholders.** The Board / Card placeholder and the Grid / Row loading row are built from State / Placeholder (11 shapes replaced).
- **Banners stay separate.** The seven banner-shaped parts were read side by side. They share an anatomy (a status surface, a 14 px icon, the message in 13 px text/ink, any action at the end) but hold different content: one line, a heading with a body and buttons, a title with a detail, a checklist, a list of links. One structural base would drop the text set on about fifty placed parts and force slots most of them do not use. The description of Controls / Banner now names the seven and their shared anatomy. This is Claude's choice under Dean's instruction to proceed; Dean reverses it by saying so.
- **Unavailable days (R7).** Form / Day, Unavailable is in text/secondary with a 1 px line through the number, so it differs from Outside by more than colour.
- **Phone links (R9).** The action on Phone / Status line, Out of date is a Quiet button at Touch size, and Select all on Phone / Selection bar is a Ghost button at Touch size. Both are 44 px high. The Out of date line is 45 px, from 35 px.

**Checks.**
- The Grid / Cell · Edit set, the Grid Playground, the Form / Save bar set, the Time / Band set, the Button set and a Play frame were rendered and inspected after the changes.
- A sweep of every page found four more bound fills that stored black: one text on Controls, two on Board and a scrim on Phone. Each was re-applied with its variable's colour as a precaution; whether any had rendered wrongly was not established.
- A second sweep, of outlines, found four that stored black, and one was seen rendering black: the tick box on a tinted surface at hover. All four were re-applied (two on Controls / Checkbox, two rows of an example list on the Move page). No bound fill or outline in the file now stores black.
- After the eight controls were restructured, each set was rendered and inspected, and the 321 placed instances of those sets were read back: every one still points at the same variant.
- A first attempt at the band labels unlinked the shared label, which reset the labels on the 33 placed bands. It was reversed in the next step: each label was restored from its stored value, and all 33 were read back with no mismatch.
- After the renames, the options of every set were read back. None still uses `Type`, `Style` or `Interaction`, and `Default` remains only on the four sets listed above.
- 3,138 instances were recorded before the renames, and each still pointed at the same component afterwards. Renamed show-or-hide options still hold values on placed instances (23 buttons show an icon, 6 banners an action, 3 header cells a menu button, 3 fields a helper). These were not tallied beforehand, so this confirms values survived, not that every one did.
- Component descriptions were searched for the old option names; eight were corrected.
- A first attempt at the unavailable-day mark used a text strike-through. Because the day number is one shared option, the strike-through spread to six of the seven variants. It was removed in the next step and replaced by a line layer on the one variant. A deep read of every page then found no struck text, and the date picker was rendered.
- After the decision of 12 November 2026: the Button, Menu item, Form / Day, Form / Option, Phone / Status line, Phone / Selection bar, card placeholder, loading row and Controls / Count sets were rendered and inspected. Variables were read back: 66, 52, 3, 5, 11 and 4 (141). A read of every page found no solid fill or outline without a variable outside the section frames Figma draws, no text without a text style, no bound colour that stores black and no component without a status line. Default layer names remain inside icons on the Icons page (21) and the Grid page (199); they predate this work.
- **Not checked:** review-board texts were not re-read for the old option names. The Grid review board was not re-rendered beyond the Playground. In the options panel, State on Checkbox, Radio and Form / Choice lists Rest last; the variants themselves are in order and Rest is the default.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
