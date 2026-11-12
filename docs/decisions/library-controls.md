---
document_id: PPO-LIBRARY-CONTROLS-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; the five items in section 6 were confirmed by Dean the same day; the six in section 7, for the controls added on 12 November 2026, were confirmed by him that day; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Controls in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. The five items in [section 6](#6-confirmed--10-november-2026) were confirmed by Dean on 10 November 2026. The six in [section 7](#7-confirmed--12-november-2026) were confirmed by Dean on 12 November 2026. The page itself awaits acceptance.

On 10 November 2026 Dean asked whether pages for other interactions (Gantt charts, board cards, planners and calendars) should be added to `PPO - Library`. The recommendation was to add them in this order: a Controls page, a page of shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart kept in the Projects file using those shared parts. Controls came first because the [Grid · Table interactions](library-grid-table-interactions.md) page drew its buttons, chips, menus, tooltips and toasts as plain frames, and every later page would otherwise redraw them. Dean answered: "Accept the recommended order and start with the Controls page."

This record is a **proposal**. Accepting the order did not confirm the four open items on the grid page (section 6.1 of that record). Dean confirmed those, and the five on this page, later the same day (section 6).

## 1. Sources

The page consolidates what the accepted files already draw. Where no source draws a state, it is marked new.

| Source | Status of source | Use |
|---|---|---|
| "PPO - Sales module (accepted)", kit `9:165` on page `133:27412` | Accepted | Button `9:212`, Status chip `9:193`, Avatar `9:249`, Checkbox `9:260`, Filter chip `9:271`, Tab `9:282` |
| Same file, sheet ST01: buttons `94:22194`, chips `94:22279` | Accepted | Button states (default, hover, pressed, focus, disabled at 45%, loading keeps width); one meaning per chip tone |
| Same file, side panel "New organisation" `89:20270` | Accepted | Field label, required marker, input, placeholder, select, textarea, checkbox with helper, footer buttons |
| "PPO - Shell (accepted)", sheets R `66:5455`, S `66:6247`, AF `79:8186` | Accepted | Dialog, banner and toasts, destructive confirmation |
| [Shell refined concept rules](../design/development/systems/shell-refined-concept-rules.md) | Accepted | R17 tooltips, R44 popovers, R58 current marker, R61 and R70 dialogs and scrim, R71 banners and toasts, C6 control sizes |
| "PPO - Estimating module (proposal)", ST01 buttons `76:54961`, chips `76:55087` | Proposal | A second description of button states and chip meanings; a link button kind |
| [Buttons](../design/development/components/buttons.md), [fields](../design/development/components/fields.md), [status](../design/development/components/status.md), [menu](../design/development/components/menu.md), [dialog](../design/development/components/dialog.md), [tabs](../design/development/components/tabs.md), [validation](../design/development/components/validation.md) | Repository | The app's current rules: one primary action per region, visible labels, a label with every tone, menu and tab keys, modal focus, error summary |
| Decision D1 of the grid record | Accepted | 2 px text/link focus ring on every light surface |

File links and keys stay outside this public repository (ADR-0050, ADR-0053).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared controls used by every page type; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Not a page: components used by all page types |
| Reused components | The Sales kit and the shell sheets are the references. New in the library, all `Status: Proposed`: the sixteen families in section 3 |
| Incoming handover | A module page places these components from the library |
| Outgoing handover | None |
| Departures | The items in section 6, confirmed by Dean on 10 November 2026, and the items in section 7, to confirm |

## 3. What was drawn

**Pages**

| Page | Node | Holds |
|---|---|---|
| Icons | `46:2030` | Section `46:2032`: 20 icons and 5 annotation cursors. Fourteen icons and the cursors moved from the Grid page with their nodes unchanged; five were added: Chevron down `46:2034`, Plus `46:2036`, Search `46:2038`, Info `46:2041`, Spinner `46:2045`. Blocked `66:42` came with the [Move page](library-move.md) |
| Controls | `46:2031` | Components section `46:2033`; review board `52:126` |

**Variables and styles added**

| Item | Value | Use |
|---|---|---|
| Collection "Control size", modes "Medium" and "Small" | `control/height` 32 / 28, `control/field-height` 36 / 32, `control/padding-x` 12 / 10 | One component serves pages (Medium) and toolbars, popovers and tables (Small); the mode is set on a frame. The [Forms page](library-forms.md) added a Touch mode (44 / 44 / 12) and `control/text-size` and `control/line-height` |
| `radius/dialog` | 12 | Dialogs (shell R70) |
| `radius/pill` | 999 | Filter chips and avatars |
| `radius/checkbox` | Changed from 3 to 4 | The accepted Sales kit |
| Text style "Text / 10 Medium" | 10 / 12 | Initials in a 24 px avatar, as the Sales kit. Retired on 11 November 2026 after the [library audit](library-audit.md); the initials use Text / 11 Medium |
| Effect style "Elevation / Dialog" | 0 16 48 at 24% navy | Dialogs (shell R70) |

A paint bound to a colour variable loses its opacity in this Figma environment, so the dialog scrim and the button state layers are rectangles with a bound fill and a layer opacity.

**Components** (all `Status: Proposed`, in section `46:2033`)

| Component | Node | Variants and options |
|---|---|---|
| Controls / Button | `47:177` | 30: Kind (Primary, Secondary, Quiet, Ghost, Danger) by State (Rest, Hover, Pressed, Focus, Disabled, Loading). Options: Label, Show leading icon, Icon |
| Controls / Link | `47:187` | 4: Rest, Hover, Focus, Disabled. Option: Label |
| Controls / Icon button | `47:206` | 5: Rest, Hover, Pressed, Focus, Disabled. Option: Icon |
| Controls / Chip | `50:71` | 9 tones: Neutral, Info, Success, Warning, Danger, Tint, Grey, Navy, Accent. Option: Label |
| Controls / Filter chip | `50:81` | 8: Selected (false, true) by State (Rest, Hover, Focus, Disabled); Selected was the Active state until 12 November 2026. Option: Label. Disabled came with the [library audit](library-audit.md) |
| Controls / Tab | `50:92` | 8: Selected (false, true) by State (Rest, Hover, Focus, Disabled); Selected was the Current state until 12 November 2026. Option: Label. 48 px with a navy marker, and Disabled, since the audit |
| Controls / Avatar | `50:117` | 12: six hues by 24 and 32 px. Option: Initials |
| Controls / Checkbox | `22:416` | 24: Checked (Off, On, Mixed) by State (Rest, Hover, Focus, Disabled) by Surface (White, Tint); one State option held all six until 12 November 2026. Formerly Grid / Checkbox. Hover and the target-size rule came with the audit |
| Controls / Radio | `137:654` | 16: Checked (Off, On) by State (Rest, Hover, Focus, Disabled) by Surface (White, Tint); one State option held all five until 12 November 2026. Added with the [Forms page](library-forms.md); Hover and the target-size rule came with the audit |
| Controls / Checkbox field | `51:250` | Checkbox with label and helper. Options: Label, Show helper, Helper text |
| Controls / Field | `51:249` | 24: Kind (Text, Select, Date, Textarea) by State (Rest, Placeholder, Focus, Error, Disabled, Read-only). Options: Label, Show label, Required, Requirement, Value, Show helper, Helper text, Error text. The Date type, the requirement in words, the hint under the label and wrapping values came with the [Forms page](library-forms.md) |
| Controls / Menu item | `50:146` | 8: Selected (false, true) by State (Rest, Hover, Focus, Disabled). Options: Label, Show leading icon, Icon, Show shortcut, Shortcut text |
| Controls / Menu divider | `50:147` | One component |
| Controls / Tooltip | `50:118` | One component. Options: Label, Show shortcut, Shortcut text |
| Controls / Toast | `50:196` | 4 tones: Info, Success, Warning, Danger. Options: Message, Show action |
| Controls / Banner | `50:240` | 4 tones. Options: Message, Show action, Show dismiss. The wrapping message and the Show dismiss option came with the [Forms page](library-forms.md) |
| Controls / Dialog | `51:295` | 4: Confirm or Destructive, each Standard (560 px) or Wide (720 px). Options: Title, Body; footer buttons exposed |
| Controls / Drawer | `217:656` | 4: Width (Narrow 360, Standard 480, Wide 640, Extra-wide 800), each tied to its [drawer width](library-drawer-widths.md). Options: Title, Show footer, Content (swap). Exposed: Footer (Form / Save bar). Added on 11 November 2026 |
| Controls / Drawer content | `217:578` | One component: the placeholder the Content option swaps out |
| Controls / Search field | `274:723` | 4: Empty, Focus, Filled, Disabled. Option: Text. Added 12 November 2026, as are the ten below |
| Controls / Removable chip | `274:734` | 3: Rest, Focus, Disabled. Option: Label |
| Controls / Check option | `274:753` | 6: Checked (Off, On) by State (Rest, Hover, Focus). Option: Label |
| Controls / Multi-select | `274:851` | 5: Empty, Filled, Focus, Error, Disabled. Options: Label, Placeholder |
| Controls / File drop | `274:877` | 3: Rest, Over, Focus. Option: Hint |
| Controls / Upload row | `274:918` | 3: Uploading, Failed, Refused. Option: Name |
| Controls / Pager | `274:994` | 5: Pages at the first, a middle and the last page; Load more with more to load and with all shown. Option: Count |
| Controls / Switch | `274:1021` | 8: Checked (Off, On) by State (Rest, Hover, Focus, Disabled) |
| Controls / Switch field | `274:1022` | One component: a label and a switch. Option: Label. Exposed: Switch |
| Controls / Segment | `274:1037` | 8: Selected (false, true) by State (Rest, Hover, Focus, Disabled). Option: Label |
| Controls / Segmented | `274:1059` | 3: two, three or four options. Exposed: each segment |

The review board gained a Drawer card `220:615` and a Drawer row in card 9's values.

**Review board** `52:126`

| Card | Node | Holds |
|---|---|---|
| Page header | `52:127` | Status, owner, date, sources, contents |
| 1 · Buttons | `52:135` | Kinds by states; rules; Medium and Small; link; icon button |
| 2 · Status chips | `52:435` | Nine tones with one meaning and examples each |
| 3 · Filter chips, tabs and avatars | `52:539` | States of each |
| 4 · Fields | `53:266` | Six states; types; a form example; rules |
| 5 · Checkboxes | `53:435` | States on white and on a tinted row; with a label; rules |
| 6 · Menus and tooltips | `53:523` | A composed menu; tooltips; rules for menus, popovers and tooltips |
| 7 · Toasts and banners | `53:602` | Four tones of each; rules |
| 8 · Dialogs | `53:709` | Destructive over a scrim; Confirm; rules. Laid out again on 11 November 2026 for the dialog widths |
| Search and multi-select | `277:1104` | Added 12 November 2026: the search field's states; a multi-select with its list open; nothing matches; the other states; rules |
| Files | `277:1299` | Added 12 November 2026: the drop zone at rest and with files held over it; files on their way in; a page that names what it takes; rules |
| Paging | `277:1410` | Added 12 November 2026: pages at the first, a middle and the last page; Load more; rules |
| Switch and segmented | `277:1532` | Added 12 November 2026: switches with labels and their states; two, three and four segments; a Gantt toolbar; rules |
| 9 · Values, sources and confirmed items | `53:773` | The table in section 5, the items in section 6, what is not yet here, change log |

Every solid fill and stroke on the components and the board is bound to a PPO colour variable, every text node uses a library text style, every shadow uses an effect style, and no layer has a default name. Sizes, paddings and most corner radii are bound to variables; 24 layers in the components and 3 on the board (focus rings, state layers, tone bars) still have a plain radius.

## 4. Rules drawn

- **Buttons.** One Primary per task region. Danger only inside a confirmation. Labels are verbs. Disabled keeps its label at 45% and gives the reason on hover and focus. Loading keeps the button's width. The main action is last in a footer. A button does something; a link goes somewhere.
- **Status chips.** One meaning per tone in every module, always with a readable label; tone never carries meaning alone. A business state and a tone are not the same thing.
- **Fields.** Every field has a visible label; a placeholder is never the label. Required is marked and announced. An error says what is wrong and how to fix it, under the field with an icon; errors appear on leaving the field or on submit, and on submit focus moves to an error summary that links to each field. Disabled means the value cannot be changed now; Read-only shows the value as plain text.
- **Menus and popovers.** Arrow keys, Home and End move; Enter chooses; Esc closes and returns focus to the trigger. A choice that cannot apply is shown as disabled with the reason. Menus, pickers and small editors share one container: 8 px corners, 1 px line/soft, Elevation / Popover, no scrim.
- **Tooltips.** On hover and on keyboard focus; every icon-only control has one; never the only place something can be read.
- **Toasts and banners.** As shell R71: toasts bottom-left, at most three, 6 s except Danger; banners one at a time at the top of the content region. One action at most.
- **Dialogs.** Only when the person must decide before going on. The title asks the question, the body says what will happen, the buttons name the two outcomes. Focus stays inside; Esc and the close button do what the safe button does.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Button | 32 px (Small 28 px), 6 px corners, 12 px side padding, 13 Medium; five kinds | Sales kit `9:212` |
| Button states | Hover and Pressed state layers; Focus ring 2 px text/link; Disabled 45%; Loading keeps width | Sales ST01; D1; layer values new |
| Link | 13 Medium text/link; underline on hover | Sales kit |
| Status chip | 18 px, 4 px corners, 12 Medium; nine tones | Sales kit `9:193` |
| Filter chip | 28 px pill; Rest and Active; Disabled at 45% | Sales kit `9:271`; Hover, Focus and Disabled new |
| Tab | 48 px, 13 Medium; 2 px brand/navy marker; Disabled at 45% | Dean, 11 November 2026, matching the built record tabs. The Sales kit `9:282` and shell R58 draw 38 px with a brand/green-deep marker and align at their next reviewed change |
| Avatar | 24 and 32 px, six hues; initials 11 Medium at 24 px | Sales kit `9:249`; 10 px text retired |
| Checkbox and Radio | 16 px, 4 px corners (radio round), 1 px border; Hover, Disabled, Focus, tinted-row border. Target at least 24 px, the whole row with a label, 44 px in Touch | Sales kit `9:260`; Sales and Estimating ST01; WCAG 2.5.8 |
| Field | Label 12 Medium; input 36 px (Small 32 px), 6 px corners, 1 px line/control, 13 Regular | Sales forms `89:20270` |
| Field states | Focus 2 px text/link; Error 2 px status/danger with a message; Disabled; Read-only | New; D1 |
| Menu item | 32 px, 13 Regular; hover surface/hover; selected surface/navy-tint | Shell menus; grid page |
| Popover | 8 px corners, 1 px line/soft, Elevation / Popover | Shell R44 |
| Tooltip | brand/navy, 12 Regular white, 4 px corners | Shell R17 |
| Toast | 360 px, tone bar and icon, one action, dismiss | Shell sheet S; R71 |
| Banner | 40 px, tone surface and icon, one action, dismiss | Shell sheet S; R71 |
| Dialog | 560 px (`dialog/standard`) or 720 px (`dialog/wide`), 12 px corners, Elevation / Dialog, 32% brand/navy scrim | Shell sheets R and AF; R70; [library audit](library-audit.md) A7. The shell sheets drew 400 px |
| Drawer | 360, 480, 640 or 800 px by content; 14 Medium title and Close; Form / Save bar footer; Elevation / Dialog; no scrim | Dean, 11 November 2026; shell R98 |
| Search field | Controls / Field's box with the Search icon and Clear; 36 px, 32 Small, 44 Touch; results about 200 ms after typing stops | Shell Find fields R21, R39; built registers; new (C6) |
| Multi-select | Controls / Field with Removable chips (20 px, `radius/chip`, surface/navy-tint) that wrap; a list of Check options at `control/height` with a search field, a count and Clear | Forms option rules; new (C7) |
| File drop | 104 px area, dashed 1 px line/strong; over: status/success-surface with a 2 px brand/green-deep outline; hint in 12 Regular | Lead R10; Sales R06; shell R93; new (C8) |
| Upload row | File icon, name in 13 Medium, status in 12 Regular; 4 px progress bar in brand/navy; Cancel, Try again or Remove | New; States wording |
| Pager | Count rule in 12 Regular; Rows per page 25, 50 or 100; Previous and Next as Secondary buttons, disabled at the ends; Load more for lists read in order | Estimating A6; built directory; new (C9) |
| Switch | 32 by 18 px track, 14 px knob; on brand/navy, off line/control; 2 px text/link focus ring | Built conversations switch; new (C10) |
| Segmented | `control/height` (32, 28, 44); track surface/hover with 1 px line/strong; chosen segment surface/canvas with Elevation / Card and an ink label | Built view switch; ES08 proposal; new (C11) |

## 6. Confirmed — 10 November 2026

Five things on this page had no single accepted source. On 10 November 2026 Dean confirmed them, together with the four open items on the grid page: "Confirm all nine items as recommended and draw the next page". Card 9 and the notes on cards 1 and 2 now say so.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| C1 | Hover and Pressed on buttons | A state layer over the kind's colour: brand/navy at 6% and 12% on the light kinds, brand/white at 12% and 24% on Primary and Danger | Sales ST01 says "hover darkens one step, pressed two"; Estimating ST01 draws 88% and 76% opacity. Neither gives values that work for every kind |
| C2 | Chip tone meanings | One merged meaning per tone (section 3, card 2). "Draft" is Neutral | The Sales kit (accepted) has "Draft" as Warning; Estimating has it as Neutral. Tint and Navy are also described differently. The Sales chips that show Draft change when Sales adopts these components |
| C3 | New states | Field Focus, Error, Disabled and Read-only; Hover and Focus on filter chips and tabs | No accepted source draws them |
| C4 | Small size | A "Control size" mode: buttons 28 px and fields 32 px in toolbars, popovers and tables | The shell allows 28 px as a minimum (C6); using a variable mode for it is new |
| C5 | Checkbox | 4 px corners and a 1 px border, as the Sales kit | The grid page first drew 3 px and 1.5 px; this changes every checkbox on that page |

## 7. Confirmed — 12 November 2026

The [library audit](library-audit.md) listed controls the library lacked and Dean agreed an order for them (B5). On 12 November 2026, asked for the next steps, Claude recommended drawing them while the page acceptances and the shell copy were with Dean. Dean answered: "Proceed based on your recommendations." Eleven parts and four review cards were drawn that day.

A search of the repository found one accepted rule that bears on them and little else:
- **"No second search"** (Sales refined file, 9 November 2026; Estimating refined file, 10 November 2026): "No search box appears in the content area of any page." The search field is therefore drawn for pickers, popovers, drawers and phone sheets only (C6).
- **Files:** SharePoint stores the file and PPO keeps the link (lead record R10; Sales R06); a record page takes dropped files into Files (shell R93).
- **Paging:** every register has a footer with the count rule and a pager (Estimating register standard A6).
- **No accepted source** for a multi-select, a switch, a segmented control, file types and sizes, or the rows-per-page choice.

Each item was drawn as recommended. Later on 12 November 2026 Claude listed the six with a recommendation to confirm each as drawn, and Dean answered: "Proceed based on your recommendations." All six are confirmed.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| C6 | Where a search field goes | Only inside pickers, popovers, drawers and phone sheets; never in page content | The accepted "No second search" rule says so, but about forty built screens have their own search box, with three different Clear wordings. They would align later |
| C7 | Multi-select | Chips in the field and a ticked list with search; for six or more options | No accepted source draws one. The Forms rules cover one choice only |
| C8 | File types and size | The library sets none; each page's hint names what it takes | No accepted record sets a limit or a list of types |
| C9 | Rows per page | 25, 50 or 100, starting at 25 | The built directory offers this; it has no design source |
| C10 | Switch | Only for settings that act at once; on is brand/navy, like a ticked box | The built conversations switch uses the link colour. No accepted rule exists |
| C11 | Segmented control | A white chosen segment on a grey track, at the Control size heights | The built view switch is 30 px; the ES08 proposal drew navy at 44 and 32 px |

**Rules drawn with them**
- **Search field.** It names what is searched in its placeholder and carries the same accessible name. The list narrows about 200 ms after typing stops. Esc clears the text, then closes. Nothing matches says what was searched and offers Clear search.
- **Multi-select.** Chosen values are chips that wrap; none is hidden behind a count. The list stays open while choosing, lists only what the person may choose, ticks the chosen rows and says how many are chosen.
- **Files.** Two ways in: drop, or "choose files". One row a file, with how much is done in words and as a bar. A failure says nothing was saved; a file the page does not take says what the page does take. Never a disabled drop zone.
- **Paging.** The count rule in words on the left, the pager on the right. A button that cannot be used is disabled, not hidden. Load more is for lists read in order. Changing page keeps the filters.
- **Switch.** For a setting that takes effect at once; in a saved form, yes or no is a tick box. If the change cannot be saved, the switch returns to its last state and the page says why.
- **Segmented control.** Two to five views of the same content, one always chosen. Not for page sections (tabs), filters (filter chips) or more than five options (a select).

The Gantt page's toolbar example now uses the segmented control for Week, Month and Fit.

## 8. Not done and open

- **Page acceptance and publishing.** As for the grid page: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Not yet here.** Breadcrumb, progress bar, date range and empty-state parts, because no accepted page draws them yet. Switch, search field, segmented control and pagination were added on 12 November 2026 (section 7). Radio and the date picker were added with the [Forms page](library-forms.md). Accent chips for workspaces other than Sales. A field with a unit prefix, which the grid page's number editor needs.
- **Audit, 11 November 2026.** The [library audit](library-audit.md) changed this page: tabs, the new Disabled and Hover states, the target-size rule, the retired 10 px style and Controls / Drawer.
  - The Dialog component was fitted to the dialog widths with the [Phone page](library-phone.md): Standard 560 px and Wide 720 px. On a phone a dialog becomes a bottom sheet (Phone / Sheet).
  - A structural read after the changes found the focus rings' corner radii are plain numbers and two layers are named "Text". Both predate the audit. The layer names were fixed on 12 November 2026; the fourteen plain radii remain.
- **Icons.** PPO - Shell holds 101 icons. The Icons page holds the 20 the library uses so far, drawn by hand, and is not the shared icon set.
- **Module files unchanged.** The Sales kit and every module's local copies are untouched. After publishing, modules swap them for these components.
- **No proof beyond the design.** 32 prototype links (button, link, icon button and checkbox states) were set and read back, not played. Keyboard and screen-reader behaviour needs the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The Control size variables and the new layout variables have no CSS property yet.
- **Next pages in the accepted order.** Move · Drag and drop (the shared rules for moving things) was drawn on 10 November 2026 and has [its own record](library-move.md). Board · Cards and stages followed the same day ([its record](library-board.md)). Time · Planners and calendars followed ([its record](library-time.md)). At Dean's choice the Gantt parts were drawn on a library page, Gantt · Bars and links, instead of in the Projects file ([its record](library-gantt.md)); every page in the accepted order is now drawn. Forms · Fields and validation followed ([its record](library-forms.md)) and changed Controls / Field and Controls / Banner and added Controls / Radio, as the rows above now say.

## 9. Checks

**12 November 2026**
- **Rendered and inspected.** Each of the eleven new parts, the four new cards and card 9.
- **Defects fixed while drawing:**
  - the removable chip was 100 px tall, which stretched the multi-select;
  - the multi-select's box kept its height after the chips shrank;
  - the focused check option showed two focus rings;
  - a preview step left a stray copy of the whole components section on the page. Nothing used it, and it was removed.
- **Structural read of the Controls page** (2,716 nodes, 526 instances, 30 families). Outside instances it found no solid fill or stroke without a variable, no text without a text style, no default layer name and no component without a status line. Fourteen plain corner radii remain on older focus rings and example frames. The four Drawer examples are scaled, so their shadows carry no effect style.
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**10 and 11 November 2026**

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: a misshapen spinner arc, a link focus ring that was too tight, fixed-width buttons that clipped long labels in the dialog footer, and example frames that clipped focus rings.
- A structural read of the Controls page (457 component nodes, 626 board nodes) found no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no default layer name and no component without a status line.
- Variables read back from the file: 66 in "PPO colour", 17 in "PPO layout", 3 in "Grid density", 3 in "Control size". [`docs/design/library-variables.json`](../design/library-variables.json) was updated to match.
- After the swap on the grid page, no plain button, tooltip, toast or menu-item frame remained there, and the affected cards were rendered and inspected.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
- After the confirmation, card 9 and the notes on cards 1 and 2 were updated; card 9 was rendered and inspected.
