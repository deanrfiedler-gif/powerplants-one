---
document_id: PPO-LIBRARY-GRID-INTERACTIONS-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026; decisions D1–D8 accepted by Dean on 10 November 2026; the audit items were drawn the same day in the order Dean accepted (section 10), which replaced the first components and board; quick inline editing was added the same day at his request (section 11); the four values and rules in section 6.1 were confirmed by Dean the same day; the page and its components remain Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Grid · Table interactions in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. Decisions D1–D8 accepted by Dean on 10 November 2026 ([section 6](#6-decisions-accepted--10-november-2026)); audit items drawn the same day ([section 10](#10-audit-items-drawn--10-november-2026)); quick inline editing added the same day ([section 11](#11-quick-inline-editing--10-november-2026)); the four items in [section 6.1](#61-confirmed--10-november-2026) confirmed the same day. Sections 3, 4, 5, 7 and 8 describe the file as it now stands. The page itself awaits acceptance.

On 9 November 2026 Dean asked whether the module UIs needed one place that defines how shared elements behave and look, giving two examples: dragging a table column to a new position, and hovering a column divider to change its width. The recommendation was to draw these as shared patterns in `PPO - Library`, which section 3 of the [design-to-build standard](../standards/design-to-build-standard.md) already designates for "shared patterns", rather than in a new file or in each module file. Dean created the `PPO - Library` file and asked for the table interactions page to be drawn: "I have created the PPO - Library file. … You can now draw the table interactions page." He then supplied the links to the shell and module files as the source for the tokens and the existing interaction sheets.

This record is a **proposal**. It records what was drawn, where it came from, the values it sets and Dean's decisions. Drawing a pattern in the library does not accept the page, publish it or change any module file.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", collection "PPO colour" | The 66 colour variables and their role descriptions, copied into the library (section 3) |
| Private Figma file "PPO - Sales module (accepted)", page `133:27411`, sheet ST01 `94:22071` | Register row states (`94:22077`), column header states including resizing and frozen edge (`94:22147`), checkbox states (`94:22336`), sort and saved-view rule (X23), frozen-edge shadow (R13) |
| Private Figma file "PPO - Estimating module (proposal)", page `120:61151`, sheet ST01 `76:54660` | Row states (`76:54666`), header states including dragging with a drop indicator (`76:54818`, rule text `76:54860`), checkbox states (`76:55153`) |
| Private Figma files "PPO - Projects module (proposal)" page `12:16` and "PPO - Supply module (proposal)" page `11:17` | Both "Interaction states" pages are empty; these modules adopt the library page directly |
| [Shell refined concept rules](../design/development/systems/shell-refined-concept-rules.md) | Green-deep marker role (R58), popover shadow (R44), tooltip and live-region use (R17, R71), Roboto scale (C6) |
| [RegisterTable](../design/development/components/register-table.md), [Sales table](../design/development/components/sales-table.md), [component README](../design/development/components/README.md) | Current app behaviour (no column resizing in RegisterTable; keyboard and pointer resize and move in the Sales table); drag needs a labelled, non-drag alternative; no ARIA grid without its full keyboard contract |
| WCAG 2.2 AA and the WAI-ARIA data grid pattern | 1.4.11 non-text contrast, 2.5.7 dragging movements, 2.5.8 target size, and the grid keyboard contract (D1, D3, D6, D7, D8) |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each item can be opened from its file.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared register pattern used by every module's register pages; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Register / worklist: the grid inside it |
| Reused components | None yet in the library; the Sales and Estimating local kits are the references. New, all `Status: Proposed`: Grid / Header cell, Grid / Header cell · Select, Grid / Cell, Grid / Cell · Edit, Grid / Row, Grid / Row marker, Grid / Column divider. Buttons, chips, checkboxes, menus, tooltips and toasts come from the Controls page (section 12); the drop indicator is Move / Drop indicator on the Move page (section 13) |
| Incoming handover | A module register page places these components |
| Outgoing handover | The record opened from a row (drawer preview or record page), unchanged |
| Departures from module sheets | D1 focus-ring colour and D2 frozen-edge treatment differ from one or both module sheets; accepted by Dean on 10 November 2026 |

## 3. What is now in PPO - Library

The first components and review board were replaced on 10 November 2026 when the audit items were drawn (section 10), so the node IDs recorded before that date no longer exist. Grid / Column divider and Grid / Drop indicator kept their IDs.

**Pages**

| Page | Node | Holds |
|---|---|---|
| Read me | `0:1` | File cover `36:3`; Read me card `36:114` with purpose, page index, how to use the library, rules and contents |
| Foundations | `34:2` | Specimen board `34:3`: 66 colour swatches, 11 Gantt colour swatches, thirteen text styles (Text / 10 Medium was retired and Text / 11 Regular added on 11 November 2026), layout, density, control-size and motion variables, three effect styles |
| Icons | `46:2030` | 34 icons and 5 annotation cursors. Fourteen icons and the cursors moved from the Grid page when the Controls page was drawn (section 12); Chevron left and right came with the [Forms page](library-forms.md); Mail, File, Star, Printer and History came with the [Record page](library-record.md); Menu, Chat, Home, Person and Deal came with the [Phone page](library-phone.md) |
| Controls | `46:2031` | Sixteen control families and their review board, recorded in [Controls in PPO - Library](library-controls.md) |
| Grid · Table interactions | `4:76` | Components section `22:337`; review board `26:587`; playground frame `32:1736` |
| Move · Drag and drop | `66:37` | Six parts for moving things and their review board, recorded in [Move · Drag and drop in PPO - Library](library-move.md) |
| Board · Cards and stages | `82:37` | Five board parts and their review board, recorded in [Board · Cards and stages in PPO - Library](library-board.md) |
| Time · Planners and calendars | `97:37` | Nine time parts and their review board, recorded in [Time · Planners and calendars in PPO - Library](library-time.md) |
| Gantt · Bars and links | `116:37` | Six Gantt parts and their review board, recorded in [Gantt · Bars and links in PPO - Library](library-gantt.md) |
| Forms · Fields and validation | `140:37` | Ten form parts and their review board, recorded in [Forms · Fields and validation in PPO - Library](library-forms.md) |
| States · Loading, empty and errors | `162:37` | Six state parts and their review board, recorded in [States · Loading, empty and errors in PPO - Library](library-states.md) |
| Record · Details, tabs and history | `182:37` | Eleven record parts and their review board, recorded in [Record · Details, tabs and history in PPO - Library](library-record.md) |
| Phone · Lists, sheets and bars | `234:61` | Eight phone parts and their review board, recorded in [Phone · Lists, sheets and bars in PPO - Library](library-phone.md) |

**Variables and styles**

| Item | Count | Notes |
|---|---|---|
| Collection "PPO colour" | 66, one mode "Value" | Names, values, scopes and descriptions as in PPO - Shell. Web code syntax on the 20 whose value is identical to an existing CSS property in the app |
| Collection "PPO layout" | 49, one mode "Value" | `space/2` to `space/24`, `radius/checkbox`, `radius/chip`, `radius/control` (code name `--radius-control`), `radius/popover`, `radius/dialog`, `radius/pill`, `grid/marker-width`, `grid/divider-hit`, `grid/focus-ring`, `grid/frozen-rule`, and `move/handle-size`, `move/indicator`, `move/target-outline`, `move/scroll-zone` (section 13), and `board/stage-width`, `board/stage-collapsed` ([board record](library-board.md)), and `time/hour-height`, `time/hour-width`, `time/gutter`, `time/lane-height` ([time record](library-time.md)), and `gantt/bar-height`, `gantt/week-width`, `radius/milestone` ([Gantt record](library-gantt.md)), and `form/check-width`, `form/phone-action` ([Forms record](library-forms.md)), and `state/panel-width` ([States record](library-states.md)), and `record/details-width`, `record/details-folded` ([Record record](library-record.md)), and the drawer widths `drawer/narrow`, `drawer/standard`, `drawer/wide` (formerly `form/panel-width`) and `drawer/extra-wide` ([drawer widths](library-drawer-widths.md)), and `dialog/standard`, `dialog/wide` and four `breakpoint/` variables ([library audit](library-audit.md)), and `phone/width`, `phone/header-height`, `phone/tab-bar-height`, `phone/row-min-height` ([Phone record](library-phone.md)) |
| Collection "Gantt colour" | 11, one mode "Value" | The Gantt colours of PPO-GANTT-FIGMA-COLOURS-DEC; nine carry the built Gantt's `--gantt-*` code names ([Gantt record](library-gantt.md)) |
| Collection "Grid density" | 3, modes "Comfortable" and "Compact" | `grid/row-height` 40 / 32, `grid/header-height` 36 / 32, `grid/cell-padding-x` 12 / 10 |
| Collection "Motion" | 4, one mode "Value" | `motion/fast` 100, `motion/standard` 200, `motion/slow` 300 and `motion/delay` 300 ms; proposed, from the [library audit](library-audit.md) |
| Collection "Control size" | 5, modes "Medium", "Small" and "Touch" | `control/height` 32 / 28 / 44, `control/field-height` 36 / 32 / 44, `control/padding-x` 12 / 10 / 12 (section 12), `control/text-size` 13 / 13 / 16 and `control/line-height` 18 / 18 / 24; Touch and the two text variables came with the [Forms page](library-forms.md) |
| Text styles | 13 | Text / 20 Medium, 14 Medium, 13 Regular, 13 Medium, 12 Medium, 12 Regular, 11 Medium, 10 Medium; Display / 40 Medium for file covers; Text / Control, whose size follows the Control size mode, and Text / Section label ([Forms record](library-forms.md)); Text / 28 Medium and Text / Reference in Roboto Mono ([States record](library-states.md)) |
| Effect styles | 3 | Elevation / Card: 0 1 2 at 6% navy (accepted Sales board; [board record](library-board.md)). Elevation / Popover: 0 8 24 at 18% navy (shell R44). Elevation / Dialog: 0 16 48 at 24% navy (shell R70) |

**Components** (all `Status: Proposed`, in section `22:337`)

| Component | Node | Variants and options |
|---|---|---|
| Grid / Header cell | `23:640` | 20 variants: State (Default, Hover, Focus, Lifted, Origin slot), Sort (None, Ascending, Descending), Align (Left, Right). Options: Label, Filtered, Menu button, Frozen edge |
| Grid / Header cell · Select | `23:652` | 3: Selection None, Some, All |
| Grid / Cell | `24:537` | 18: Type (Text, Identity, Numeric, Chip, Checkbox, Row menu) by Row state (Default, Hover, Selected). Options: Value, Flag, Flag icon |
| Grid / Cell · Edit | `24:565` | 9: Rest, Editable hover, Editable focus, Editing, Saving, Saved, Failed, Locked, Reason required. Option: Value |
| Grid / Row | `24:759` | 8: Default, Hover, Selected, Focus, Previewed, Attention, Overdue, Loading. A reference row built from Grid / Cell |
| Grid / Row marker | `22:420` | 3: Previewed, Attention, Overdue |
| Controls / Checkbox | `22:416` | 10: State (Off, On, Mixed, Disabled, Focus) by Surface (White, Tint). Formerly Grid / Checkbox; renamed and moved to the Controls page with its node unchanged (section 12) |
| Grid / Column divider | `5:109` | 4: Rest, Hover, Active, Focus |
| Move / Drop indicator | `67:83` | 2: Orientation Vertical and Horizontal. Vertical is the former Grid / Drop indicator; its node `5:110` and both instances on this page are unchanged. The set sits on the Move page (section 13) |
| Icons and cursors | `22:338` to `22:387` | 14 icons (arrows, More, Grip, Filter, Attention, Overdue, Edit, Saving, Saved, Locked, Columns, Close, Undo) and 5 annotation cursors (Arrow, Grab, Grabbing, Col-resize, Not-allowed). The cursors are for annotation only. Moved to the Icons page with their nodes unchanged (section 12) |

**Review board** `26:587`

| Card | Node | Holds |
|---|---|---|
| Page header | `26:588` | Status, owner, dates, sources, contents, legend |
| Anatomy | `26:615` | One 1,276 px register with ten numbered callouts |
| 1 · Column reorder | `27:392` | Steps 1.1 to 1.10: rest, hover, dragging, frozen zone, dropped, touch, keyboard pick-up (three steps), header menu with its rules |
| 2 · Column resize | `28:723` | Steps 2.1 to 2.9: divider hover, dragging, minimum, released, fit, keyboard, Set width…, what a resize changes, frozen-zone limit |
| 3 · Sort, header options and frozen edges | `29:948` | Twelve header examples; both frozen edges at the start and scrolled to the end |
| 4 · Rows and selection | `29:1403` | Eight row states; row menu; truncation tooltip; bulk bar and "Select all N matching" |
| 5 · Grid states | `30:1416` | Loading, empty, no results, error, footer |
| 6 · Quick inline editing | `43:1858` | Steps 6.1 to 6.6, an editor for each field type, nine cell states, and where quick edit is offered |
| 7 · Columns, undo and personal layout | `30:1607` | Column chooser, undo toasts, personal-layout rules |
| 8 · Keyboard, touch and shared views | `31:1535` | Keyboard contract, touch rules, shared-view bar |
| 9 · Density | `31:1623` | The same register in Comfortable and Compact |
| 10 · Do and Don't | `31:1919` | Three pairs |
| 11 · Values, decisions and change log | `31:2027` | Values, accepted decisions, confirmed items, candidates, change log |

Every solid fill and stroke on the components, the board and the playground is bound to a PPO colour variable, every text node uses a library text style, and every shadow uses the effect style. The exceptions are the two frozen-edge gradients, node opacity on annotation overlays and disabled items, and some corner radii that are still plain numbers (13 layers in the components and 23 on the board, such as callout badges and the checkbox focus ring).

## 4. Behaviour drawn

**Column reorder.** Any column outside the frozen zone (selection, record identity, row menu) can move; frozen columns never move and cannot be crossed. Hovering a movable header shows the grip, the sort hint and the menu button; the label does not move. A click still sorts, and a move starts only after a 4 px travel with the button down. While dragging, the header lifts and follows the pointer, its column keeps an outlined slot, and a 3 px brand/green-deep indicator marks the landing gap. Over the frozen zone there is no indicator and release returns the column. Esc cancels. On drop the order saves to the person's layout for the view and is announced in a polite live region. Touch: the menu button is always shown; press and hold for 400 ms lifts a column. Keyboard: Space on a focused header picks the column up, Left and Right move it, Home and End jump, Space drops and Esc cancels, each step announced. Single pointer: the header menu (Move left, Move right, Move to start, Move to end) and the column chooser's Move up and Move down.

**Header menu.** Opens from the three-dot menu button, a right-click, Shift+F10 or the Menu key. Items: Sort ascending, Sort descending, the four Move items, Fit width, Set width…, Resize column, Reset width, Hide column. Items that cannot apply are shown as unavailable. Frozen columns have no Hide item.

**Column resize.** An 8 px hit zone centred on the 1 px divider lights a 2 px brand/green-deep line and the col-resize cursor; the header keeps its rest fill while the pointer is on the divider (D8). While dragging, a 2 px guide runs the full visible height, the column resizes live and a navy readout gives the new width; widths stop at the limits set by the column's type. Release saves the width and announces it; Esc restores the starting width. Double-click fits to the widest value on the current page. Keyboard: Resize column in the header menu puts the divider in resize mode; arrows change the width by 8 px, Shift with an arrow by 32 px; Enter keeps, Esc restores. Set width… opens a field in whole pixels within the limits. Only the resized column changes: columns to its right move along, no other column grows or shrinks, and the grid scrolls sideways when the columns no longer fit. The frozen zone stops at 40% of the grid's visible width (confirmed, section 6.1).

**Sort and frozen edges.** Click or Enter sorts ascending; a second click reverses. Sort uses up and down arrows; numbers and their header align right. The left frozen zone ends with a 2 px line/strong rule at all times; each frozen edge gains a 4 px shadow only while content is underneath it, including the row-menu column frozen on the right. The header row stays in place when the body scrolls vertically.

**Rows and selection.** Row states as the Sales and Estimating sheets, with the focus ring in text/link (D1), a white chip on a selected row, and attention shown by a 3 px marker and an icon, never by colour alone. The row menu button is always visible in the frozen right column. A truncated cell or header shows its full value in a tooltip on hover and focus. The header checkbox and Ctrl+A select the rows loaded; when all are selected a banner offers "Select all N matching". A bulk bar replaces the toolbar while anything is selected.

**Grid states and inline editing.** Loading (skeleton rows), empty, no results and error keep the header, the column widths and the person's layout in place. The footer gives the range and the total. Quick inline editing is described in section 11.

**Columns, undo and personal layout.** The column chooser lists every column, shows and hides them, reorders them with buttons or the grip, locks the frozen ones and offers Reset to view default. Hiding, moving or resetting shows a toast with Undo (shell R71). Order, widths and hidden columns are the person's own layout for the view and save automatically; sort and filters belong to the view, and changing them on a shared view shows a "Modified" bar with Reset, Save as new view, and Save (owner only). The rules for what happens to a personal layout when the view changes are in card 7 (confirmed, section 6.1).

**Keyboard contract (D6).** The grid is one Tab stop. Read-only registers move by row with Up and Down and between a row's interactive cells with Left and Right; editable registers move by cell. Home and End go to the first or last cell in the row; Ctrl+Home and Ctrl+End to the first header or the last row loaded; Page Up and Page Down move by a visible page. Enter on a header sorts and Space picks the column up; Enter on a row opens the drawer preview; Space toggles the row checkbox and Shift with Up or Down extends the selection; Ctrl+A selects all rows loaded; Enter or F2 starts editing an editable cell; Esc cancels a drag, pick-up, resize, edit or menu.

**Density.** Row height, header height and side padding are variables with Comfortable and Compact modes; setting the mode on a frame redraws every register in it.

## 5. Values and sources

| Property | Value | Source |
|---|---|---|
| Header height | 36 px; Compact 32 px | Sales, Estimating; audit N2 |
| Row height | 40 px; Compact 32 px | Sales, Estimating; audit N2 |
| Focus ring | 2 px text/link; at least 5.9:1 on every grid surface | D1 |
| Frozen edge | 2 px line/strong rule; 4 px shadow while content is underneath | D2 |
| Frozen zone limit | 40% of the grid's visible width | Audit G7; confirmed (section 6.1) |
| Sticky header | Header stays visible when the body scrolls vertically | D5 |
| Sort indicator | Arrow up or down in text/ink; hint arrow on hover in text/secondary | Audit R2, G12 |
| Menu button | Three dots in a 20 px tile; hover and focus, always on touch | Audit G1 |
| Grip | In the left padding; the label never moves | Audit R1 |
| Checkbox border | line/control on white; text/secondary on tinted rows (at least 4.9:1) | Audit G12 |
| Drag start | 4 px with the button down; touch: press and hold 400 ms | D3, D7 |
| Keyboard move | Space picks up, arrows move, Space drops, Esc cancels | Audit N3 |
| Lifted header | surface/canvas, 1 px line/strong, radius/control, Elevation / Popover | Shell R44; D3 |
| Origin slot | surface/hover, dashed line/control, content at 40% | D3 |
| Drop indicator | 3 px brand/green-deep with caps (3.57:1 on white) | Estimating |
| Auto-scroll zone | 48 px from the sideways scroll edge | D3 |
| Divider hit zone | 8 px centred on the 1 px divider; header keeps its rest fill while on it | D3, D8 |
| Resize line and guide | 2 px brand/green-deep | Sales, Estimating |
| Resize model | Only the resized column changes; the grid scrolls sideways | Audit G7 |
| Width limits | Per column type; defaults 96 px, identity column 160 px, maximum 480 px | D3 |
| Keyboard resize | Resize column in the header menu; 8 px per arrow, 32 px with Shift; no shortcut | D3 |
| Set width… | Single-pointer and touch route; whole pixels within the limits | D3, D7 |
| Settle motion | 150 ms ease-out; none under reduced motion | D3 |
| Persistence | Order, widths and hidden columns per person per view; sort and filters edit the view | D4; rules confirmed (section 6.1) |
| Undo | Toast with Undo after hide, move or reset; 6 s | Audit R3; shell R71 |
| Quick edit | 1 px text/link outline and a 24 px pencil button on hover; 2 px ring on focus; editor popover under the cell | Dean, 10 November 2026; rules confirmed (section 6.1) |
| Keyboard model | WAI-ARIA data grid with the full contract (section 4) | D6 |
| Announcements | Polite live region after a move, resize, save or selection change | D3 |

## 6. Decisions accepted — 10 November 2026

Dean first asked for the recommendations to be checked "to ensure they are the most professional approach". The check against WCAG 2.2 AA, the repository's component rules and established data-grid practice changed D3 and D4 and added D6–D8. Dean then answered: "Accept D1 to D8 as recommended and update the page."

| ID | Decision | Reason |
|---|---|---|
| D1 | Focus ring 2 px text/link on every light surface | PPO - Shell gives text/link the role "focus ring on light surfaces". Green marks current and active items (R58), and brand/green-deep measures 2.99:1 on surface/chrome-hover (the hovered header), below the 3:1 minimum of WCAG 1.4.11; text/link measures at least 5.9:1 on every grid surface. Sales ST01 (green) and Estimating ST01 (green-deep) follow when they adopt the library components |
| D2 | Frozen edge: the 2 px line/strong rule at all times, plus a 4 px shadow while content has scrolled under it | The boundary reads at rest; depth shows only while content is underneath |
| D3 | The values in section 5, with three changes from the proposal: no Ctrl+Alt+Right shortcut; Set width… added to the header menu; width limits set per column type in the column registry | Ctrl+Alt acts as AltGr on many European layouts and clashes with Windows graphics-driver rotation keys. WCAG 2.5.7 needs a single-pointer alternative that can set any width, which Fit and Reset alone do not give. Limits belong to the column definition, not one global number |
| D4 | Layout (order, widths, hidden columns) is personal and saves automatically, with Reset to view default; sort and filter changes mark a shared view Modified, saved only by its owner or as a new view | Separates a person's layout from what a shared view means, so nobody silently changes a view others rely on |
| D5 | Sticky header in this pattern; RegisterTable is brought to it in a later reviewed change | RegisterTable has neither today |
| D6 | The full WAI-ARIA data grid keyboard contract on every register (section 4) | The drawn behaviour (one Tab stop, arrows inside) is a grid model, which the component rules allow only with its full contract; Estimating's inline edit needs it in any case |
| D7 | Touch: press and hold 400 ms to lift a column; resize through Set width…; phones below 768 px use phone rows with no move or resize | An 8 px divider cannot be targeted reliably by finger; the hold keeps a quick drag free to scroll. The small divider target is allowed under WCAG 2.5.8 because an equivalent control exists |
| D8 | The header keeps its rest fill while the pointer is on a divider | The resize and drop markers measure 3.28–3.57:1 on white and the header fill, but 2.99:1 on the hovered header fill |

### 6.1 Confirmed — 10 November 2026

Drawing the audit items and quick inline editing introduced four things that Dean had not decided. On 10 November 2026 he confirmed them, together with the five items on the Controls page: "Confirm all nine items as recommended and draw the next page". The page now marks each as confirmed.

| Item | Confirmed as drawn | Where |
|---|---|---|
| Frozen zone limit | The frozen zone can be widened to at most 40% of the grid's visible width | Card 2, step 2.9 |
| Personal layout rules | Seven rules for what happens to a person's layout when the view changes, including widths saved separately for desktop and tablet | Card 7 |
| Compact density | Compact is offered to pointer devices only; touch stays Comfortable | Card 9 |
| Quick edit rules | Which cells offer quick edit; the editor popover replacing the in-place typing first taken from Estimating ST01; a 1 px outline on hover against the 2 px ring on focus | Card 6 |

## 7. Not done and open

- **Page acceptance and publishing.** The components stay `Status: Proposed` until Dean accepts the page. Publishing then needs a release note under section 5 of the standard; the change of the Sales focus ring from green to text/link is Medium impact and needs Dean's acceptance recorded first.
- **Named version and thumbnail.** No named version of the library exists; saving one, and setting the cover `36:3` as the file thumbnail, are steps for Dean in Figma (the connector cannot do either).
- **Module files unchanged.** Sales ST01 and Estimating ST01 are untouched; the Projects and Supply interaction pages are empty. After publishing, each module saves a named version, enables the library, swaps its local grid parts for the library components, and replaces the grid sections of its States page with a reference card to this page. Enabling the library and accepting updates are desktop-app steps for Dean. Address lookup and the workbench and CPQ line states stay in the module files.
- **Not yet in the library.** The full icon set, the shell components and the page template. Field boxes inside the quick-edit editors and the Set width… popover are still plain frames (section 12).
- **Code names.** 72 of the 93 library variables have no CSS property yet (46 colours, 20 layout, 3 density, 3 control size).
- **Candidates not drawn.** N4 user-set freeze, N5 layout-changed marker, N6 scroll-edge fade, N7 multi-column sort, N8 Dev Mode annotations and Code Connect, N10 motion.
- **No proof beyond the design.** The prototype links between variants were set and read back but not played, because the connector cannot run a Figma presentation. Dragging, the header menu and keyboard pick-up are drawn as steps, not played. Keyboard, screen-reader and touch behaviour and the D3 values need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. RegisterTable alignment (D5, D6) and the column registry's per-type width limits (D3) are later reviewed changes.

## 8. Checks

- Every card on the review board, the components section, the playground, the Foundations board and the cover were rendered and inspected. Defects found while drawing were fixed: cursor labels covering header text, a clipped announcement, a clipped line in card 11, and the grip sitting against the label.
- A structural read of the rebuilt Grid page (378 component nodes, 1,576 board nodes) found no solid fill or stroke without a variable, no text without a text style, no shadow without the effect style and no component without a status line. It also confirmed 37 prototype links across five component sets; reworking Grid / Cell · Edit for quick inline editing brought the total to 40.
- Variables read back from the file: 66 in "PPO colour", 15 in "PPO layout", 3 in "Grid density" with two modes.
- The 21 library variables with a code name were checked with the logic of `scripts/check_design_tokens.py`: each one's value is present on its CSS property in `src/`.
- Contrast ratios in D1, D8 and audit G12 were computed from the PPO colour values with the WCAG relative-luminance formula.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.

## 9. Audit — 10 November 2026

Dean asked for an audit of the pages built in `PPO - Library` for gaps, refinements, a more professional look, and new ideas. The audit read the file itself: a structural pass over the 203 nodes of the components and the 864 nodes of the review board (variable bindings, text styles, layer names, effects, component properties, instance use), a search of every caption for wording that no longer matched the accepted decisions, contrast computed for the remaining colour pairs, and a visual pass over both pages. When the audit was written nothing below was drawn except the four corrections. Dean then accepted the recommended order, and section 10 records what was drawn. The node IDs in 9.1 belong to the first board, which section 10 replaced.

**What already holds.** Every solid fill and stroke on the components and the board is bound to a PPO colour variable (the one exception is the frozen-edge gradient). Every text node uses a library text style. Every component description starts with its status. Body text, header labels, chips and markers all measure at least 4.8:1.

### 9.1 Corrections made in the file

| ID | Correction |
|---|---|
| C1 | Card 1 introduction (`8:9`) said the order saves to "the person's copy of the current view" and named step 6 only. Now "the person's layout for the current view (D4)" and "steps 6 and 7" |
| C2 | Card 1 step 5 caption (`8:337`) said "the person's view". Now "the person's layout for the view (D4)" |
| C3 | Card 2 step 4 caption (`9:348`): the same wording, corrected the same way |
| C4 | Read me contents paragraph (`12:7`) still described a four-part review board with everything proposed. Now six cards, decisions D1–D8 accepted, page and components still proposed |

### 9.2 Gaps

| ID | Gap | Recommendation |
|---|---|---|
| G1 | **The header menu has no pointer or touch opener.** It opens by right-click, Shift+F10 or the Menu key. On touch, press-and-hold is taken by lifting the column (D7), so Set width…, the only touch route for resizing under D7, cannot be reached. Mouse users also have no visible sign that the menu exists | Add a menu button to Grid / Header cell: shown on hover and focus, always shown on touch |
| G2 | **No Grid / Cell component.** Grid / Row is a fixed 700 px example with five built-in columns, so a module cannot build its own register from it. The board itself uses 268 hand-made cell frames | Add Grid / Cell (text, identity, numeric, chip, checkbox, row menu) and build rows and the board's tables from it |
| G3 | Grid / Checkbox has Off, On and Mixed. Both source sheets also have Disabled and Focus | Add the two states |
| G4 | Header variants not drawn: right-aligned numeric header, the select-all checkbox header, a filtered marker, a truncated label | Add them, as properties rather than more states (R6) |
| G5 | The row-menu column frozen on the right, with its shadow (Sales R13), and row actions shown on hover are not drawn | Draw both in card 3 and card 4 |
| G6 | Named in captions but never drawn: the column chooser (four captions), the truncation tooltip, and how a hidden column is shown again | Draw the column chooser panel and the tooltip |
| G7 | The resize layout model is not stated: what happens to the neighbouring columns and the table width, and how wide the frozen zone may grow | State it: only the resized column changes, the table grows and scrolls sideways (consistent with one line per cell), and the frozen zone stops at a share of the visible width |
| G8 | Personal layout edge cases are not covered: the owner changes the view after a person customised it, a column is added to or removed from the view, a person loses permission to a column, and widths saved on a desktop opened on a tablet | Add a rules table to card 6 |
| G9 | Grid-level states are missing: loading rows, empty, no results, error, the bulk-selection bar and the footer. Inline cell editing is also missing; Estimating ST01 calls it part of "the app-wide register standard", so it belongs here, which corrects the earlier note in section 7 that it stays in the module file | Add a states card, and move inline edit into the library with Estimating's seven states as the source |
| G10 | Foundations are incomplete: no layout variables (heights, paddings and seven different corner radii are plain numbers), no effect styles (six plain shadows), no specimen page for the colours and text styles, and 46 of 66 variables have no code name | Add a layout collection and effect styles before any module adopts the components; add a Foundations page |
| G11 | No named version of the library exists, and the page has no change log | Dean saves a named version after each accepted change; add a change-log strip to the page |
| G12 | Three non-text contrast shortfalls: the unchecked checkbox border (line/control) measures 2.96:1 on a hovered row and 2.85:1 on the selection tint, below the 3:1 minimum; the sort hint on a hovered header is drawn at 50% opacity, 1.99:1 | Darken the checkbox border on tinted rows (text/secondary measures 5.1:1) and draw the sort hint at full strength |

### 9.3 Refinements

| ID | Refinement |
|---|---|
| R1 | **The header label jumps on hover.** The grip is inserted before the label, moving it 14 px to the right in the Hover, Focus and Lifted states (label at x 12, then x 26). Reserve the grip's space, or place it in the left padding, so the label stays still |
| R2 | The sort indicator is a chevron, which reads as "opens a menu". Use up and down arrows for sort and keep the chevron or three dots for the new menu button (G1) |
| R3 | Add undo: after hiding, moving or resetting a column, a toast with Undo, using the shell toast pattern (R71) |
| R4 | Select all is ambiguous on a paged register. State that the header checkbox selects the rows loaded and offers "Select all N matching" |
| R5 | Step numbers collide with card numbers ("step 6" and "card 6"). Number steps 1.1 to 1.7 and 2.1 to 2.7 |
| R6 | Give the components a proper property set: on/off properties for the grip, sort indicator and menu button, and an alignment option, so modules do not need a variant per combination. Name the 64 unnamed vector, ellipse and rectangle layers inside the components |

### 9.4 Presentation

| ID | Item |
|---|---|
| P1 | Card 1 leaves a blank band: step 6 is 592 px tall beside steps of about 274 px, and step 7 sits alone on a row in cards 1 and 2. Give the header menu its own full-width row and lay the steps out four and three |
| P2 | Open the page with an anatomy figure: one realistic full-width register (selection column, identity, six columns, row menu) with numbered callouts. The three-column mini tables then only illustrate single steps |
| P3 | Add a page header band: status badge, date, owner, sources, a contents index and a legend for the annotation chips |
| P4 | Draw cursors as cursor glyphs at the pointer position instead of text chips |
| P5 | Add Do and Don't pairs for the main rules (never wrap a cell, never colour alone, never drag-only) |
| P6 | The scrolled example fakes a clipped column with the label "ner". Draw the real column inside a clipping frame |
| P7 | The Read me is a plain text card. The standard asks for a consistent file cover; add the cover, a page index and a short "how to use this library" |

### 9.5 New ideas and techniques

| ID | Idea | Kind |
|---|---|---|
| N1 | **Playable components.** Wire the variants with Figma's interactive-component links (hover to Hover, press to Lifted, click to sorted), so the page can be played instead of read | Figma technique |
| N2 | **Density as a variable mode.** A "Grid density" collection with Comfortable (40 px) and Compact (32 px) modes; switching the mode on a frame re-draws every register in it, and gives users a density setting later | Figma technique and feature |
| N3 | **Keyboard pick-up mode.** Space picks a column up, arrows move it, Space drops, Esc cancels, each step announced. The established accessible drag pattern, and faster than the menu | Behaviour |
| N4 | **User-set freeze.** "Freeze up to this column" in the header menu | Feature |
| N5 | **Layout-changed marker.** A dot on the Columns button when a person's layout differs from the view default, with one-click reset, and "Fit all columns" | Feature |
| N6 | **Scroll-edge fade.** A fade on the right edge while more columns lie off screen, pairing with the frozen-edge shadow | Behaviour |
| N7 | **Multi-column sort.** Shift-click adds a second sort, with priority numbers on the headers | Feature |
| N8 | **Specs attached to nodes.** Dev Mode annotations and measurements on the components, and Code Connect to RegisterTable once it is built, so the values travel with the component | Figma technique |
| N9 | **Token drift guard.** Refresh `docs/design/figma-variables.json` from the library, so the existing token check guards the library instead of the frozen file | Repository technique |
| N10 | **Motion.** Animate the drop and settle (150 ms) in Figma so the timing in D3 can be judged before it is built | Figma technique |

### 9.6 Recommended order

1. **Defects first:** G1 with R2, R1, G3 and G12. G1 is a fault in the pattern as accepted, because D7 depends on a menu that touch cannot open.
2. **Component structure, before any module adopts the library:** G2, G4, R6 and G10. Changing the structure after adoption means re-swapping every instance.
3. **Missing rules and drawings:** G7, G8, G5, G6, G9, R3, R4.
4. **Presentation:** P1 to P7 and R5.
5. **Ideas:** N1, N2, N3 and N9 first, as they add most for least risk; N4 to N8 and N10 as candidates for Dean to pick from.

G1, R2 and every N item change what users see or can do, so they need Dean's decision. The other items complete or tidy what is already accepted.

## 10. Audit items drawn — 10 November 2026

Dean answered the audit with "Accept the recommended order and draw them". The components and the board were rebuilt rather than patched, because the cell component and the header options change their structure. The first board `8:4` and the first Header cell, Row and Checkbox sets were removed; nothing used them outside the library.

| Item | Outcome |
|---|---|
| G1, R2 | Grid / Header cell has a three-dot menu button (hover, focus, and a Menu button option for touch) and uses arrows for sort |
| R1 | The grip sits in the left padding; the label is at the same position in every state |
| G3, G12 | Grid / Checkbox has Disabled and Focus, and a Surface option that darkens the unticked border on tinted rows. The hover sort hint is drawn at full strength |
| G2 | Grid / Cell added; Grid / Row and every table on the board are built from it |
| G4, R6 | Header options: Align, Filtered, Frozen edge, Label with truncation; Grid / Header cell · Select added. Layers are named; four divider layers are named "Line" on purpose |
| G10 | "PPO layout" and "Grid density" collections, the Elevation / Popover effect style and the Foundations page. Sizes and paddings on the components are bound; some corner radii are not (section 3) |
| G5, G6 | Right-frozen row menu with its shadow, row menu, column chooser and truncation tooltip drawn (cards 3, 4 and 7) |
| G7 | Resize model and frozen-zone limit drawn (steps 2.8 and 2.9); the 40% value was confirmed later (section 6.1) |
| G8 | Personal-layout rules table in card 7; confirmed later (section 6.1) |
| G9 | Loading, empty, no results, error, bulk bar and footer drawn; inline editing moved into the library as Grid / Cell · Edit |
| G11 | Change log added to card 11. Saving a named version remains a step for Dean |
| R3, R4, R5 | Undo toasts, "Select all N matching", and step numbers 1.1 to 1.10 and 2.1 to 2.9 |
| P1 to P7 | Header menu on its own row; anatomy figure; page header band with legend; cursor glyphs; Do and Don't; real clipping in the scrolled example; file cover, page index and "how to use" on the Read me. The cover could not be set as the file thumbnail through the connector |
| N1 | 37 prototype links between variants of the header, row, checkbox, divider and edit cell, and a playground frame `32:1736` set as a flow starting point. Set and read back, not played |
| N2 | Comfortable and Compact density modes; card 9 shows the same instances in both |
| N3 | Keyboard pick-up drawn as steps 1.7 to 1.9 and added to the keyboard contract |
| N9 | Done differently from the audit's wording. The enforced token check allows no new variable without a CSS name, and 63 library variables have none, so the check cannot be pointed at the library yet. Instead [`docs/design/library-variables.json`](../design/library-variables.json) records all 84 library variables so a change shows in Git review, and the 21 with a code name were verified against the app's CSS with the check's own logic. Pointing the enforced check at the library waits for the reconciliation in ADR-0067 stage 5 |
| N4 to N8, N10 | Not drawn; they remain candidates for Dean to pick from |

## 11. Quick inline editing — 10 November 2026

Dean asked: "I would like to include the feature where the user can make quick inline edits in certain cells where possible and appropriate", and attached a Pipedrive screenshot of a hovered cell with a blue outline and a pencil button. He asked whether something similar could be included in the page. Pipedrive's grammar is the stated starting point of the design-to-build standard (section 14), and only the pattern is borrowed, not its artwork.

**What was drawn**

| Item | Node | Change |
|---|---|---|
| Grid / Cell · Edit | `24:565` | Reworked from seven to nine states. Rest is a plain cell. Editable hover has a 1 px text/link outline and a 24 px pencil button. Editable focus has the 2 px focus ring (D1) and the pencil button. Editing is the cell while its editor is open. Saving, Saved, Failed, Locked and Reason required are kept. A Value option was added |
| Card 6 · Quick inline editing | `43:1858` | Replaces the earlier inline-editing card. Steps 6.1 to 6.6 (`43:1936`, `43:2010`, `43:2093`, `43:2166`, `43:2239`, `43:2316`); editors for text, number, date, single choice, person, and a value with a change reason; the nine cell states; the table of where quick edit is offered |
| Cards 8 and 11, page header | `31:1535`, `31:2027`, `26:588` | Keyboard row, values row, the item to confirm, the change log and the contents line updated |
| Playground | `32:1736` | Its editable cell now starts from Rest, so hover shows the outline and pencil |

**Behaviour**

- **Hover.** The row takes its hover tint. The cell under the pointer, if it can be edited, gains the outline and the pencil button. The pencil shows only on hover and focus. A click elsewhere in the row still does what the row does.
- **Editor.** Clicking the pencil, or Enter or F2 with focus on the cell, opens an editor under the cell with the value selected. Enter or Save keeps the change; Esc, Cancel or a click outside discards it and returns focus to the cell. Nothing changes until Save.
- **Editors by type.** Text; number, right-aligned with its unit; date, typed as dd/mm/yyyy or picked; single choice; person, with search; and any of these with a change-reason field, where Save stays unavailable until the reason is given.
- **Saving.** The cell shows the new value at once with a saving mark, then a tick for 2 s, announced in a polite live region. Only that cell is saved.
- **Failure.** The cell keeps what was typed, outlined in status/danger, with "Not saved · Retry".
- **Not editable.** No outline and no pencil; a lock on hover and focus and a tooltip with the reason.
- **Keyboard and touch.** In a register with editable cells the arrows move by cell (D6). Tab moves inside the editor. On touch, a tap on a cell shows its pencil and a tap on the pencil opens the editor.

**Where quick edit is offered** (confirmed, section 6.1)

| Kind of cell | Quick edit |
|---|---|
| Short text, number, date, single choice, person | Offered |
| A value that needs a change reason | Offered, with a reason |
| A value this person may not change; issued, approved or closed records | Locked, with the reason |
| Calculated or totalled values | Not offered; change the inputs on the record |
| Values owned by MYOB or another system of record | Not offered |
| Stage or status changes that start a workflow | Not offered; use the record's action |
| Long text, addresses, anything with a lookup or several fields | Not offered; open the record or the drawer |
| A register that is read-only for this person | No pencils at all |

Each module names its editable columns in its own page guide. Editing several selected rows at once is not part of this pattern.

**Differences from the earlier drawing.** Section 10 took inline editing from Estimating ST01 `76:54861`, which typed in the cell itself. The editor popover replaces that, because it gives pointer and touch users Save and Cancel buttons and works for every field type. The hover outline is 1 px so that the 2 px ring keeps its meaning as keyboard focus (D1); the Pipedrive example uses one outline for both. Dean confirmed both points on 10 November 2026 (section 6.1).

**Checked.** Card 6 and the reworked component were rendered and inspected; a cursor covering the pencil and columns too narrow for their values were corrected. The eight links on Grid / Cell · Edit were set and read back, not played.

## 12. Controls adopted on this page — 10 November 2026

Dean accepted the order for the next library pages and asked for the Controls page first ("Accept the recommended order and start with the Controls page"). [Controls in PPO - Library](library-controls.md) records that page. It changed this page in five ways.

| Change | Detail |
|---|---|
| Checkbox | Grid / Checkbox was renamed Controls / Checkbox and moved to the Controls page. Its node `22:416` and every instance are unchanged. It was aligned to the accepted Sales kit: 4 px corners (`radius/checkbox` changed from 3 to 4) and a 1 px border |
| Icons | The 14 icons and 5 annotation cursors moved to the new Icons page with their nodes unchanged. Five icons were added there |
| Plain frames replaced | 60 plain frames on the review board became Controls instances: 29 buttons, 9 chips, 2 tooltips, 3 toasts, 14 menu items and 3 menu dividers. None of those plain frames remain |
| Toasts | The undo toasts in card 7 now follow the accepted shell toast: a tone bar and icon, the message, the Undo link and a dismiss button |
| Cell chip | The chip inside Grid / Cell, Type=Chip, was set to 18 px to match Controls / Chip. It stays a local layer so the Value option can set its text |

Still plain frames on this page: the field boxes inside the quick-edit editors and the Set width… popover (the number editor needs a unit prefix that Controls / Field does not have yet), the bulk bar, the selection banner, the "Modified" bar and the column chooser panel, which are register-specific.

**Checked.** The header menu, the row menu, cards 4 and 7 and the anatomy were rendered and inspected after the swap; the header-menu step was made taller for the menu dividers.

## 13. Confirmations and the Move page — 10 November 2026

Dean confirmed the four items in section 6.1 and asked for the next page in the accepted order ("Confirm all nine items as recommended and draw the next page"). [Move · Drag and drop in PPO - Library](library-move.md) records that page. It changed this page in three ways.

| Change | Detail |
|---|---|
| Items confirmed | Step 2.9, card 6, card 7 and card 11 now say that Dean confirmed the frozen-zone limit, the personal-layout rules, Compact density for pointer devices only and the quick-edit rules. Card 11 lists them under "Confirmed · 10 November 2026" and has a change-log entry |
| Drop indicator | Grid / Drop indicator became the Vertical variant of Move / Drop indicator `67:83` and moved to the Move page. Its node `5:110` and the two instances in card 1 are unchanged. Its bar and caps are bound to the new `move/indicator` variable |
| Variables | Four `move/` variables joined "PPO layout", which now holds 21. The library holds 93 variables |

The page and its components remain `Status: Proposed`. Confirming the items is not acceptance of the page.

**Checked.** Card 11 was rendered and inspected after the change. The two drop indicator instances were read back at their original size.
