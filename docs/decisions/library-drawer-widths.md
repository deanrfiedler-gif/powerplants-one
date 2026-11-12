---
document_id: PPO-LIBRARY-DRAWER-WIDTHS-DEC
date: 2026-11-11
owner: Dean Fiedler
status: Owner decision, 11 November 2026, recorded as four width variables in the private Figma file "PPO - Library"; the library is not published; accepted module pages and the built application keep their current widths until a reviewed change aligns them; no application code, route, migration, permission or deployment
versioning: git
---

# Right-hand drawer widths in PPO - Library

**Owner:** Dean Fiedler · **Date:** 11 November 2026 · **Status:** Owner decision. Recorded in the library's variables; accepted pages and built screens align at their next reviewed change.

## 1. The question

While the [Record page](library-record.md) was being drawn, Dean asked whether 432 px, the width of the edit panel taken from the accepted Sales file (A5), was the most professional width for a desktop drawer.

The answer recommended 480 px:
- Sales A5 says its forms open in a right panel "like the preview drawer".
- The shell had since set that drawer at 480 px, overlaying the page at every width (shell R98, 8 November 2026).
- PPO was using four drawer widths for no stated reason: 380 px (the built drawer), 432 px (Sales), 480 px (the shell's snapshot drawer) and 680 px (quick add in the Create forms pattern).

Dean then gave the widths he considers usable: "For right drawers in the desktop views, I think we can use any of the following widths, depending on what content is included in the actual drawer. 1. 360px 2. 480px 3. 640px 4. 720px 5. 800px".

Two choices followed:
- **Which widths.** Asked whether to adopt all five, four or three, Dean chose "Four: 360, 480, 640, 800 (Recommended)". 720 px is dropped because it sits 80 px from both 640 and 800, so choosing between them would come down to taste rather than content.
- **Narrow screens.** Asked what a drawer should do when the screen leaves too little room beside it, Dean chose "Go full width under 1280 px if wider than 480 (Recommended)".

## 2. Decision

| Variable | Width | Content |
|---|---|---|
| `drawer/narrow` | 360 px | Filters, column choosers and short lists |
| `drawer/standard` | 480 px | The snapshot drawer, editing a record section, an activity, an email or a file |
| `drawer/wide` | 640 px | Two-column create forms, such as quick add |
| `drawer/extra-wide` | 800 px | Previews and comparisons, such as a document, an email thread or two versions side by side |

Rules:
- **Overlay.** Drawers open from the right and overlay the page without a scrim; registers and tables beside them keep their widths (shell R98).
- **Narrow screens.** Below 1280 px, a drawer wider than 480 px fills the content area.
- **Phones.** On a phone every drawer is full screen.
- **Dialogs.** Dialogs are not drawers and keep their accepted widths of 560 to 720 px (Sales A5).

## 3. What changed in the library

The variables live in "PPO layout". With them the library held 124 variables, 134 once the audit added dialog, breakpoint and motion variables, and 138 with the [Phone page](library-phone.md)'s four; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

- `record/panel-width`, created for the Record page's edit drawer, became `drawer/standard` at 480 px. Its binding on the Record page's card 7 carried over.
- `form/panel-width` (680 px) became `drawer/wide` at 640 px. The Forms page's quick-add texts and card 8 now say 640 px ([Forms record](library-forms.md)).
- `drawer/narrow` and `drawer/extra-wide` are new.
- The Foundations layout table lists all four. The Read me names the scale. The Record page's edit drawer is 480 px, and its item R5 is recorded as decided ([Record record](library-record.md), section 6).

**Drawer part.** After the [library audit](library-audit.md), also on 11 November 2026, the library gained Controls / Drawer `217:656`: one part in the four widths, each tied to its variable, with a title and Close, a content slot and a Form / Save bar footer ([Controls record](library-controls.md)). The Record page's card 7 places this component for both of its drawers, changed when the [Phone page](library-phone.md) was drawn. On a phone a drawer becomes a full-screen sheet.

## 4. To align at the next reviewed change

None of these is changed by this record.

| Where | Today | Under this decision |
|---|---|---|
| Sales refined file, A5 (accepted 9 November 2026) | Forms open in a 432 px right panel | 480 px, or 640 px for two-column create forms |
| Create forms pattern, Q1 (accepted 1 November 2026) | Quick add in a 680 px panel | 640 px |
| PJ-03 working calendar, D3 ([baseline and forecast design](baseline-forecast-figma-design.md)) | A 680 px drawer | 640 px, or 800 px if its redraw shows it needs the room |
| Projects refined proposal (awaiting review) | Drawers and panels 432 px; the working calendar 680 px | 480 px; 640 or 800 px |
| Built application: the Organisations drawer (`.crm-r38-drawer` in `src/app/styles/organisations.css`) | 380 px | 360 or 480 px by its content |
| Shell snapshot drawer (R98) | 480 px | Unchanged: `drawer/standard` |

## 5. Not done

- The library is not published; module files keep their local widths.
- No application code changed. The four variables have no CSS property yet.
