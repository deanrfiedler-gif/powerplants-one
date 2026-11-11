---
document_id: PPO-LIBRARY-AUDIT-DEC
date: 2026-11-11
owner: Dean Fiedler
status: Audit of the private Figma file "PPO - Library" carried out on 11 November 2026 at Dean's request, with Dean's decisions of the same day; the fixes in section 4 are drawn in the library, the motion timings are proposed, and the directions in section 5 guide later work; the library is not published; no application code, route, migration, permission or deployment
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
  - Two Grid cell hover readings (dark text on what read as black) look like a see-through overlay, not a fault; this was not confirmed.
  - The "more professional" findings rest on the renders made while drawing, not a fresh visual review of every card.

## 3. Findings

**Strengths**
- No colour, spacing or corner left unbound across the scanned layers; one text layer without a style.
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
| A7 | Dialog widths of 560 and 720 px | `dialog/standard` and `dialog/wide`. Controls / Dialog is still 400 px wide (open) |
| A8 | Breakpoints | `breakpoint/tablet` 768, `breakpoint/laptop` 1024, `breakpoint/desktop` 1280 and `breakpoint/wide` 1440, from shell R94 and R75, the drawer rule and the shell sheets |
| A9 | Motion timings, as proposed values | A "Motion" collection: `motion/fast` 100 ms, `motion/standard` 200 ms, `motion/slow` 300 ms and `motion/delay` 300 ms. With reduced motion nothing slides and fades are 100 ms or less. The delay is already decided (States S2; shell R93); the other three await confirmation once they can be judged in a prototype |

Dean also confirmed the Record page's items R1 to R4 and R6 ([Record record](library-record.md), section 6).

The library now holds 134 variables in six collections; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

## 5. Directions for later work

Dean agreed these on 11 November 2026. None is drawn yet.

| # | Direction |
|---|---|
| B1 | **Themes.** Light only for now. A high-contrast mode comes before any dark mode |
| B2 | **Base colour palette.** Deferred until a second theme or brand exists |
| B3 | **CSS names.** Every variable gets its code name before the library is first published, as one reconciliation against the built application (ADR-0067 stage 5) |
| B4 | **Prototypes.** After Phone patterns, wire three flows: editing a record section and saving; a save whose outcome is unknown, then Check the outcome; moving a card on a board |
| B5 | **Missing controls, in order.** Search field and multi-select; file drop zone; pagination; switch and segmented control |
| B6 | **Stat tiles and charts.** After the shell and page template, before any reporting or dashboard design |
| B7 | **New features.** Draw "How this was worked out" and "Changed since you last looked" as Proposed parts on the Record page. AI features come later, each after a rules-based version |
| B8 | **Publishing.** After the shell move and page template and Dean's first page acceptances; then the standard's pilot on a copy of one module file |

Order of work: Phone patterns, then the shell and page template (which needs Dean's desktop copy of the shell components), then B5 to B7.

## 6. To align at the next reviewed change

None of these is changed by this record.

| Where | Today | Under these decisions |
|---|---|---|
| Sales kit tab and shell R58 | 38 px with a brand/green-deep marker | 48 px with a brand/navy marker |
| Accepted Sales week view (A01) and the built Service planner | Now line and pill in brand/green-deep | status/success |
| Sales kit avatar | 10 px initials at 24 px | 11 px |

## 7. Not done and open

- **Dialog.** Controls / Dialog is not yet resized to the dialog widths.
- **Record card 7.** Its drawers are assembled from parts, not from Controls / Drawer.
- **Controls page leftovers.** A structural read after the changes found the focus rings' corner radii are plain numbers and two layers are named "Text". Both predate the audit.
- **Not addressed.** The Board page's scaled thumbnails with text below 11 px; the Grid hover reading in section 2.
- **Motion.** The three proposed timings are not confirmed.
- **Proof.** No prototype links were added. Keyboard, focus and reduced-motion behaviour need the browser proof once code exists.
- **Code.** No application code, binding, register or page guide changed. The new variables have no CSS property.

## 8. Checks

- Each changed component was rendered and inspected: tabs, filter chips, tick boxes, radios, choices, the date picker's day, the Now line and the Drawer.
- The Drawer card, the Controls values card, the Record page's card 11 and the Foundations layout and motion tables were rendered and inspected.
- A defect found on the way was fixed: the save bar's sentence was squeezed beside its buttons in the Narrow drawer, so the desktop save bar now wraps its buttons below the sentence.
- Text / 10 Medium was deleted only after a read of every page found no layer using it.
- Variables read back from the file: 66 in "PPO colour", 45 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density", 5 in "Control size" and 4 in "Motion" (134). Twelve text styles.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
