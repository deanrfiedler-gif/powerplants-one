---
document_id: PPO-LIBRARY-PHONE-PROP
date: 2026-11-11
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 11 November 2026 at Dean's request; the seven items in section 6 were confirmed by Dean on 12 November 2026; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Phone · Lists, sheets and bars in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 11 November 2026 · **Status:** Proposed. The items in [section 6](#6-confirmed--12-november-2026) were confirmed by Dean on 12 November 2026. The page itself awaits acceptance.

After the [library audit](library-audit.md), Dean said on 11 November 2026: "Go ahead with the Phone patterns page". Phone patterns were the fourth of the groups that section 5 of the [design-to-build standard](../standards/design-to-build-standard.md) requires and the library did not yet hold. This record covers that page, named "Phone · Lists, sheets and bars".

The page holds the parts and rules every page shares below 768 px: the header row, the status line, the tab bar, list rows, selection, sheets and the bars at the foot. The phone record is on the [Record page](library-record.md) (card 9) and the phone form on the [Forms page](library-forms.md) (card 8); this page holds what is around them.

Almost every rule here is already accepted: the page gathers three owner decisions and the shell's phone rules into library parts. Where no accepted record speaks, the page proposed a rule and listed it in section 6; Dean has since confirmed each.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| [Phone header amendment](phone-header-amendment.md) (PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC) | Owner-adopted, 19 October 2026 | P1 to P9: one 56 px header row; the List and Record types; the menu; Choose view and Filter; no rows under the header except status lines; the 320 px rules; 44 px targets |
| [Phone register patterns amendment](phone-register-patterns-amendment.md) (PPO-SHELL-PHONE-REGISTER-PATTERNS-DEC) | Owner-accepted, 1 November 2026 | PR1 to PR17: who gets selection; long press and More, then Select; the selection bar; rows while selecting; the bottom action bar; confirmation sheets; results; swipe; sheet height; safe areas |
| [Phone tab bar decision](phone-tab-bar-labels-and-rail-colours.md) (PPO-PHONE-TAB-BAR-DEC) | Owner direction, 10 November 2026 | T1 to T8: the rail's colours, a visible label on every tab, 11 px on 14 px, 64 px cells, label fit at 320 px |
| [Shell refined concept](shell-refined-concept-design.md) and its [rules](../design/development/systems/shell-refined-concept-rules.md) | Owner-accepted | <ul><li>Below 768 px the accepted phone header applies (R19, R87)</li><li>A scrim on the phone shell (R61)</li><li>What the phone takes from the desktop shell: banners under the header, toasts above the bottom bar, dialogs as full-width sheets (R94)</li><li>The phone header keeps its back arrow (R123)</li><li>The toolbar becomes a sticky action bar with Actions and the primary; a desktop-only decision shows disabled with where it can be done (R124)</li></ul> |
| Dean's phone button rule, 19 October 2026 | Owner decision | Main actions are full-width 48 px buttons (`form/phone-action`) |
| The Create forms pattern, and the lead, estimate and quotation record pages | Owner-accepted | The form header and its leave check (D8); the phone footer buttons (lead R11); the phone summary with sticky 48 px actions (estimate D14; quotation D11) |
| The Service planner, appointment and My jobs designs | Owner-accepted | Visit details as a bottom sheet above the tab bar; a pinned action bar; the 56 px field dock (My jobs R3) |
| [Record](library-record.md), [Forms](library-forms.md), [States](library-states.md), [Controls](library-controls.md) and [drawer widths](library-drawer-widths.md) records | Proposed; items confirmed | The phone record and form; the save bar; the state parts and wording; buttons, chips, fields and tick boxes; what a desktop drawer becomes on a phone |
| WCAG 2.2 AA | Standard | 1.4.1 use of colour, 2.4.3 focus order, 2.5.3 label in name, 2.5.7 dragging movements, 2.5.8 target size |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). The frozen "PPO - Design" file and the module files that hold the accepted phone sheets were not opened; the decision records and their captures were the source.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared phone parts for every module; no new route. Each page keeps its own scope and route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Shared shell pattern; no page type changes |
| Reused components | Controls / Button, Icon button, Chip, Checkbox and Field; Form / Save bar; Record / Fact; existing icons. New in the library, all `Status: Proposed`: the eight Phone parts in section 3, five icons and one text style |
| Incoming handover | A page supplies its title, views, count, rows, actions and destinations; the parts read them |
| Outgoing handover | The record, the phone menu, the page's Choose view and Filter sheets, and each action's own confirmation |
| Departures | The items in section 6, confirmed |

## 3. What was drawn

**Page** "Phone · Lists, sheets and bars" `234:61`: components section `234:62`; review board `237:273`.

**Variables added** to "PPO layout":

| Variable | Value | Use |
|---|---|---|
| `phone/width` | 390 | The width phone pages are drawn at; layouts must also work at 320 |
| `phone/header-height` | 56 | Header row (P1) |
| `phone/tab-bar-height` | 64 | Tab bar (T4) |
| `phone/row-min-height` | 56 | Smallest list row (Ph2) |

"PPO layout" now holds 49 variables and the library 138; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

**Text style added:** Text / 11 Regular (11 px on 14 px), for tab labels that are not current (T3). The library holds thirteen text styles.

**Icons added** on the Icons page, drawn like the existing set: Icon / Menu `234:45`, Chat `234:48`, Home `234:52`, Person `234:56` and Deal `234:60`. The library holds 34 icons.

**Components** (all `Status: Proposed`, in section `234:62`, drawn in the Touch size with their width tied to `phone/width`)

| Component | Node | Variants and options |
|---|---|---|
| Phone / Header | `235:88` | 3: List, Record, Form |
| Phone / Status line | `235:108` | 3: Out of date, Offline, Reconnecting |
| Phone / Tab bar | `235:161` | 2: Five cells, Four cells |
| Phone / List row | `235:195` | 3: Rest, Selecting, Selected. Options: Title, Meta |
| Phone / Selection bar | `235:196` | One component |
| Phone / Menu row | `236:139` | 4: Default, Selected, Destructive, Disabled. Options: Label, Leading icon, Icon |
| Phone / Sheet | `236:177` | 2: Bottom, Full screen. Options: Show footer, Second action, Content (a slot) |
| Phone / Action bar | `236:213` | 3: One action, Two actions, Selection |

Five `_Example /` components hold the board's example sheet content. The leading underscore keeps them out of the published library.

**Review board** `237:273`

| Card | Node | Holds |
|---|---|---|
| Page header | `237:274` | Status, owner, date, Dean's request, sources, contents |
| 1 · Anatomy of a phone page | `237:282` | A synthetic list page and record page at 390 px with eight numbered parts |
| 2 · Header and status line | `239:360` | The three header types; List and Record at 320 px; three status lines; rules |
| 3 · Tab bar and menu | `239:522` | Five and four cells; rules |
| 4 · Lists, views, filters and selection | `239:611` | Choose view, Filter and a selection in progress; three row states; rules |
| 5 · Sheets | `240:718` | An actions sheet, a confirmation, a full-screen sheet, and a long sheet on a 320 × 568 px phone; rules |
| 6 · Action bars | `240:934` | One action, two actions, selection and the form's save bar; rules |
| 7 · Do and Don't | `241:850` | Ten pairs |
| 8 · Values, sources and confirmed items | `241:887` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

**Changed elsewhere in the library**
- **Read me:** the page index, rules 2 and 4, the variable, style, component and icon counts, the items awaiting confirmation and the next steps.
- **Foundations:** four phone rows in the layout table and a Text / 11 Regular specimen.
- **Controls / Dialog** `51:295` now has four variants: Confirm and Destructive, each Standard (560 px, `dialog/standard`) or Wide (720 px, `dialog/wide`). The Controls board's card 8 was laid out again, and the dialogs placed on the Move and Forms boards were fitted to their stages. This closes an item the [audit](library-audit.md) left open.
- **Record page, card 7** now places Controls / Drawer for both of its drawers, with two `_Example /` content components. This closes the other open audit item.

## 4. Rules drawn

- **One header row.** Below 768 px every page has one 56 px row in place of the desktop top bar (P1).
  - List: menu, the view chooser and at most three icons (P2). On a register with bulk actions the page-action slot holds More (PR3).
  - Record: back, the position in the view or the reference, previous and next, More. The title and state are in the content. There is no Menu button; More starts with Open menu and Conversations (P3).
  - Form: back and the form's name. Save and Cancel are in the save bar.
  - At 320 px the title truncates first, search and filter combine, and a record reference never truncates: previous and next move into More (P7).
- **Nothing under the header** except a status line, and only while something needs attention: out of date, offline, reconnecting, or the result of a bulk action (P6; PR9, PR16). Views go into Choose view and filters into Filter (P5). Refresh is pull-down, paused while selecting (PR17).
- **Tab bar.** The desktop rail's colours, a visible label on every tab, 64 px high, on list pages only (T1 to T7). A record, a form and a selection each replace it with their own bar, so there is never more than one bar at the foot (P3, PR6).
- **Lists.** A row has a title that wraps, one line of facts, then the state and next step in words. The whole row opens the record.
- **Selection.** Only where the register's source defines a bulk action (PR1). Long press, or More then Select (PR2). The header becomes the selection bar and the tab bar becomes the action bar; Done restores both (PR4, PR6, PR12). A tick box in a 44 px target leads each row and the chevron goes (PR5). A selection reaches this page only (PR7).
- **Sheets.** A bottom sheet for a menu, a short choice or a confirmation; a full-screen sheet for Filter and for what is a drawer on a desktop. Desktop dialogs become bottom sheets at full width (R94).
  - A sheet never grows past the screen less the header row; its content scrolls and its buttons stay (PR14).
  - A confirmation says what changes and on how many, lists each record, and names the action and count on its button (PR8, PR16).
  - Focus moves into the sheet and returns to what opened it (PR12).
- **Action bars.** Main actions are full-width 48 px buttons, one main action to a page. With two, Actions sits beside the main action (R124). The selection bar shows at most three actions as an icon over a word, with the rest under More (PR6).
- **Results.** The result of an action is a line that stays until the next action, never a passing toast, with Undo where a reverse exists (PR9, PR16).
- **Swipe.** Only where a page defines it, only for a reversible action, and always also in the row's menu (PR11).
- **Targets and names.** Targets are at least 44 px. Every icon has an accessible name and counts are read out (P8).

## 5. Values and sources

| Value | Number | Source |
|---|---|---|
| `phone/width` | 390 px | The width phone pages are drawn at; also checked at 320 px (P7, T5) |
| `phone/header-height` | 56 px | P1 |
| `phone/tab-bar-height` | 64 px | T4 |
| `phone/row-min-height` | 56 px | Proposed here and confirmed by Dean on 12 November 2026 (Ph2) |
| `form/phone-action` | 48 px | Dean, 19 October 2026; also the menu row's height |
| Touch target | 44 px | P8, PR5, PR12; the Touch mode of "Control size" |
| `breakpoint/tablet` | 768 px | Phone pages are below it (P1; R87) |
| Tab label | 11 px on 14 px | T3: Text / 11 Medium on the current tab, Text / 11 Regular on the others |
| Tab label width | 60 px or 76 px | T5: the widest label at 320 px with five cells or four |
| Long press | 550 ms; moving 10 px cancels | PR2, PR13 |
| Sheet height | Screen less 56 px | PR14; the shortest phone drawn is 320 × 568 px |

## 6. Confirmed — 12 November 2026

On 12 November 2026 Dean confirmed all seven items as drawn: "Confirm Ph1–Ph7 as recommended and the motion timings". Card 8, the page header and the rules on cards 5 and 6 now say so.
- **Ph3** leaves the Service field dock at 56 px as the one exception to 48 px bars.
- **Ph6** means the built application's 780 px switch aligns with 768 px at its next reviewed change.
- **Ph7** means the built application's More dropdown on a phone record becomes a bottom sheet at its next reviewed change.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| Ph1 | Closing a sheet | Close, the sheet's buttons, a tap on the dimmed page or a downward swipe; never a swipe alone; a handle on bottom sheets only | No accepted record covers how a sheet closes or whether it has a handle |
| Ph2 | List rows | At least 56 px; a title of up to two lines, one line of facts, then the state and next step | No accepted record sets a list row's height or general contents |
| Ph3 | Bar heights | 48 px buttons in every action bar; the Service field dock (56 px) stays the one exception | The field dock differs from Dean's 48 px rule |
| Ph4 | Where the tab bar shows | On list pages only; a record, a form and a selection replace it | P3 and PR6 say this for records and selections; forms are added here, and the field timer's visit page keeps its dock |
| Ph5 | Toasts and results | A toast sits above whichever bar shows (R94); the result of an action is a line, never a toast (PR16) | R94 allows toasts on a phone; PR16 rules them out for results |
| Ph6 | Where phone starts | Below 768 px, as accepted | The built application switches at 780 px; it aligns at its next reviewed change |
| Ph7 | More on a record | An icon without a label, opening a bottom sheet | The shell's Actions is a labelled menu, never an ellipsis (R118); P3 uses More on a phone, and the built application opens a dropdown |

## 7. Not done and open

- **Page acceptance and publishing.** The components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Not drawn here.**
  - The open phone menu, notifications and Quick add: they come with the shell move.
  - Result rows, the sequence bar and the swipe drawing from the register patterns amendment: accepted in the design file, not redrawn.
  - Keyboard types and field behaviour (Forms page).
  - Landscape, tablets between 768 and 1024 px, safe-area sizes and the Service timer dock: no accepted source yet.
- **Tab labels at 84%.** Tabs that are not current are drawn at 84% through their cell's opacity. The alpha colour variable the tab bar decision proposed for this was not created.
- **18 px title.** P7 drops the title to 18 px at 320 px. The library has no 18 px text style, so the 320 px examples show the truncation and not the smaller size.
- **Module files unchanged.** The accepted phone sheets keep their local parts. They switch to these parts after acceptance and publishing; the built phone pages change only through reviewed application work.
- **No proof beyond the design.** No prototype links were set. Long press, swipe, focus return, announcements and safe areas need device and browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The new variables have no CSS property yet.
- **Next in the recommended order.** The shell and page template, which needs Dean's desktop copy of the shell components.

## 8. Checks

- **Rendered and inspected.** Every component and every card of the review board, the short-phone example on its own, and the tab bar at double size. Card 8 was rendered again after the items were marked confirmed.
- **Defects fixed while drawing:**
  - the list header's page-action icon was white on a white header;
  - the dimmed page behind the short-phone sheet drew as solid navy;
  - tab labels that are not current were Medium, not Regular (T3);
  - the bottom sheet had no second button for a confirmation;
  - resizing the dialog broke the Controls board's card 8 and overflowed two placed dialogs.
- **Structural read of the Phone page.** Outside instances it found no text without a text style, no shadow without an effect style, no layer with a default name and no component without a status line. The only plain fills, strokes and corner radii are Figma's own section and component-set containers.
- **Variables read back from the file:** 66 in "PPO colour", 49 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density", 5 in "Control size" and 4 in "Motion" (138). The four phone variables read 390, 56, 64 and 56. Thirteen text styles.
- **Read me and Foundations.** Each changed text was read back from the file after its update.
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
