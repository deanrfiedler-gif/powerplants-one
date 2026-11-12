---
document_id: PPO-LIBRARY-BOARD-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 as the next page in the order Dean accepted; the five items in section 6 were confirmed by Dean the same day, and the six in section 7 were decided by him on 12 November 2026 after he reviewed the built Deals board; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Board · Cards and stages in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. The five items in [section 6](#6-confirmed--10-november-2026) were confirmed by Dean on 10 November 2026. The six in [section 7](#7-decided--12-november-2026) were decided by him on 12 November 2026 and amend B1, B3 and Move M1. The page itself awaits acceptance.

On 10 November 2026 Dean accepted an order for the next pages of `PPO - Library`: Controls, shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart kept in the Projects file ([Controls record](library-controls.md)). Controls and [Move · Drag and drop](library-move.md) were drawn that day. After the Move page was reported, with Board cards named as next in the order, Dean answered "Continue". This record covers that page, named "Board · Cards and stages".

The page gives one card and one stage for every board in the app: deals by stage, service requests by status, project tasks by phase. Moving cards follows the Move page; the controls come from the Controls page.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| "PPO - Sales module (accepted)", page "Deals · CR-01 · CR-04" `133:27404`, sheet D04 `14:1487` (board view), stage `14:1771`, card `14:1784` | Accepted by Dean, 9 November 2026 | 240 px stages, 224 px cards, the card's rows and their order, health signals, stage counts and totals, the board summary, the footer hint "Drag a card to move it one stage" |
| Same page, states X08 `47:12538` (filtered, nothing matches), X09 `47:13455` (loading), S02 `61:12297` (could not load) | Accepted | Counts read 0 only after a successful read; a dash while unread or failed; filters restated |
| The built Deals board: four screenshots Dean supplied on 12 November 2026 | Built application, reviewed by Dean | Arrow-shaped stage headers; the green stage under a dragged card; the Won, Lost, Delete and Move boxes shown while a card is dragged; the two-line next activity; the card's quick actions |
| [Sales board](../design/development/components/sales-board.md) | Repository | Change stage is the keyboard and touch alternative to drag; stage headers disclose their basis; amounts excluding GST; unknown estimates stay explicit; a narrow screen shows one stage with a stage picker |
| [Service requests page guide](../design/development/pages/route-service-tickets.md) | Repository | Preview and Move in a labelled per-card menu; the board discloses its bounds |
| [Move · Drag and drop](library-move.md) | Proposed | Lifted look, drop target and refusal, reason tag, keyboard pick-up, Move menu, after the drop |
| [Controls](library-controls.md), shell rules R17, R44, R71, R88, R101 | Proposed; accepted | Buttons, chips, avatars, menus, toasts, banners; tooltips, popovers, toasts, bulk bar, person colours |
| WCAG 2.2 AA | Standard | 1.4.1 use of colour, 2.5.7 dragging movements, 2.5.8 target size |

File links and keys stay outside this public repository (ADR-0050, ADR-0053).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared board pattern used by every module's board views; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Register / worklist: the board view of a register |
| Reused components | Controls / Icon button, Chip, Avatar, Button, Menu item, Menu divider, Field, Toast and Banner; Move / Drop target, Origin slot and Reason tag. New in the library, all `Status: Proposed`: the seven parts in section 3 |
| Incoming handover | A module board view places these components |
| Outgoing handover | The record opened from a card (drawer preview or record page), unchanged |
| Departures | The items in sections 6 and 7 |

## 3. What was drawn

**Page** "Board · Cards and stages" `82:37`: components section `83:37`; review board `85:153`.

**Variables added** to "PPO layout", which now holds 23. The library holds 95 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

| Variable | Value | Use |
|---|---|---|
| `board/stage-width` | 240 | The narrowest board stage; five fit beside the collapsed rail at 1440 |
| `board/stage-max-width` | 360 | The widest a stage grows to fill the page; added 12 November 2026 (B11) |
| `board/stage-collapsed` | 40 | A collapsed stage |

With `board/stage-max-width`, "PPO layout" holds 50 variables and the library 139.

**Effect style added:** Elevation / Card, 0 1 2 at 6% navy, the accepted Sales card at rest.

**Icons added** on the Icons page: Icon / Calendar `82:41` and Icon / Clock `82:46`. The page then held 22 icons and 5 annotation cursors. Icon / Eye `252:1331` (Preview) was added on 12 November 2026; the library holds 35 icons.

**Components** (all `Status: Proposed`, in section `83:37`)

| Component | Node | Variants and options |
|---|---|---|
| Board / Card | `83:287` | 7 states: Rest, Hover, Focus, Selected, Lifted, Saving, Skeleton. Options: Title, Subtitle, Fact, Date, Age; Show subtitle, Show fact row, Show activity, Show state chip, Show signals; Attention (the 3 px marker, B6). Hover and Focus show Preview, Plan activity and Email (B7). Exposed: Activity line, Owner, State chip, Signal 1, Signal 2 |
| Board / Activity line | `83:55` | 3 tones: Planned, Overdue, None. Two lines since 12 November 2026. Options: Label, Detail, Show detail |
| Board / Count | `83:56` | One component. Option: Count |
| Board / Stage header | `252:12950` | 7 since 12 November 2026: Plain (one line, 36 px; the original component, node `83:288` unchanged), and Flow start, Flow and Flow end (arrow-shaped, two lines, 56 px), each at rest or as the Target of a lifted card (B8, B10). Options: Name, Total, Show total. Exposed: Count |
| Board / Stage · Collapsed | `83:300` | One component. Option: Name. Exposed: Count |
| Board / Drop action | `252:13005` | 9: Warning, Success or Info, each Rest, Over or Unavailable. Options: Label, Hint, Icon. Added 12 November 2026 (B9) |
| Board / Drop bar | `252:13015` | One component holding three drop actions: Lost, Won and Move. Exposed: each action. Added 12 November 2026 (B9) |

The stage itself (header, then a surface/chrome column of cards) is drawn as a layout on the board, because a component cannot hold the cards a module places in it.

**Review board** `85:153`

| Card | Node | Holds |
|---|---|---|
| Page header | `85:154` | Status, owner, date, sources, contents |
| 1 · Anatomy of a board | `85:162` | Three stages and a collapsed one with eight numbered callouts: stage, count, total, stage menu, card, Show more, collapsed stage, board summary |
| 2 · The card | `85:526` | The six rows with callouts and rules; one card configured for a deal and a service request, and described for a project task |
| 3 · Card states | `87:484` | The seven states with captions |
| 4 · Stages | `87:731` | More than one page, empty, could not load, the stage menu, collapsed |
| 5 · Moving cards | `87:886` | To another stage; a stage that will not take the card; from the card's menu; after the drop; rules |
| 6 · Pipeline boards | `255:1558` | Added 12 November 2026: a Deals board with flow headers, a lifted card over a green target stage and the drop bar; flow headers; a card that needs attention; a command the card is over; a command that cannot take it; actions on hover; rules |
| 7 · Board states | `88:1059` | Loading, nothing yet, no matches, could not load |
| 8 · Keyboard, touch and phone | `88:1151` | Keys, touch rules, a 320 px phone with a stage picker |
| 9 · Do and Don't | `89:1182` | Three pairs |
| 10 · Values, sources and confirmed items | `89:1399` | The table in section 5, the items in sections 6 and 7, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated for the new page, variables and effect style. Read me also now says that the nine Grid and Controls items are confirmed.

## 4. Rules drawn

- **One card for every board.** Rows in a fixed order: title (one or two lines, then an ellipsis and a tooltip), who it is for, the main fact and its date, the next action on two lines (what it is, then who it waits on and when), then owner, state and age, then at most two signals. Amounts are whole dollars; cents stay on the record. A module turns rows off rather than leave them empty or move them, and names its rows in its page guide.
- **Say what is missing.** An unknown value reads "Value not set"; no next step reads "No next activity" in status/warning. Never "A$0" or a dash.
- **Signals in words.** At most two Controls / Chip, then "+N". Never colour alone (WCAG 1.4.1).
- **Card states.** A click or Enter opens the record. Preview, Plan activity and Email appear on hover and focus in place of the age, with More beside the title; on touch only More shows, always (B7). A card that needs action has a 3 px status/danger marker on its left edge, with the reason in words; it is never tinted (B6). A card the person may not change is never greyed out; its menu shows Move as unavailable, with the reason.
- **Stages.** The header stays in place while the stage scrolls. Counts cover all matching records; totals are A$ excluding GST and say if they cover only the loaded cards. 20 cards a stage, then Show more. A failed read shows a dash, never 0, and one failed stage does not blank the others. Collapsing and hiding stages are the person's own layout.
- **Moving cards.** A drop is the stage-change command, the same as Move to stage in the card's menu, with the same permission, dialog, audit and Undo. A stage ordered by a rule shows the outline; only a hand-ordered stage shows the line. Where a board shows Won or Lost as stages, they refuse a drop with a reason; the Deals board offers both in the drop bar. After a move the board keeps its scroll position and focus stays on the card.
- **Pipeline boards** (12 November 2026).
  - Where stages are a sequence (deals, estimates) the headers are arrows; boards whose stages are states keep the plain header (B10).
  - Stages share the page width, from 240 px to 360 px, and cards fill their stage (B11).
  - The stage a lifted card is over takes status/success-surface on its lane and header, with the 2 px outline. A stage that cannot take the card shows the refusal with its reason; it never fades (B8).
  - While a card is lifted a drop bar offers Lost, Won and Move. A drop opens the command's own step and commits nothing alone. A command that cannot take the card says why. Delete and Archive are never in the bar (B9).
  - Every command in the bar is also in the card's menu, the keyboard and touch route.
- **Board states.** Loading, empty, no matches and a failed read keep the stages and the person's layout in place.
- **Keyboard.** The board is one Tab stop; Up and Down move within a stage, Left and Right between stages; Enter opens; Shift+F10 or the Menu key opens the card's menu; Space picks the card up (Move page).
- **Touch and phone.** A tap opens; a 400 ms hold lifts. Below 768 px the board shows one stage with a stage picker, cards fill the width, and Move to stage is in each card's menu.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Stage | 240 to 360 px (`board/stage-width`, `board/stage-max-width`), sharing the page width; Plain header 36 px, Flow header 56 px; body surface/chrome, radius/popover, 8 px padding and gap; 16 px between stages, 8 px with flow headers | Sales D04; Dean, 12 November 2026 (B10, B11) |
| Collapsed stage | 40 px (`board/stage-collapsed`), surface/chrome, name read top to bottom, count | New |
| Card | Fills its stage (224 px in a 240 px stage), 12 px padding, 6 px between rows, radius/control, surface/canvas, 1 px line/soft, Elevation / Card | Sales D04 |
| Title | 13 Medium, one or two lines then an ellipsis | Sales D04 |
| Who it is for | 12 Regular text/secondary, one line | Sales D04 |
| Main fact and date | 13 Medium; Calendar icon and 12 Regular text/secondary; whole dollars, A$ excluding GST; "Value not set" when unknown | Sales D04; Sales board rules |
| Next action | Board / Activity line on two lines: what it is, then who it waits on and when. Planned text/secondary, Overdue status/danger, None status/warning, each with an icon and words | Sales D04; Deals card health line; built Deals card |
| Owner, state and age | Controls / Avatar 24 (shell R101), one Controls / Chip, age in 12 Regular text/secondary | Sales D04 (age at 11 px there) |
| Signals | At most two Controls / Chip, then "+N" | Sales D04 (10 px pills there); new size |
| Actions | On hover and focus: Preview, Plan activity and Email in the footer and More beside the title (Controls / Icon button, Small); on touch More only, always; their space kept | New; Dean, 12 November 2026 (B7) |
| Attention | 3 px status/danger marker on the card's left edge (`grid/marker-width`); the reason in words; the card is never tinted | Grid row marker; Dean, 12 November 2026 (B6) |
| Count | Board / Count: 18 px pill, 1 px line/strong, 11 Medium status/neutral; a dash when not read | Sales D04, X09, S02 |
| Total | 12 Regular text/secondary with its basis | Sales D04; Sales board rules |
| Page size | 20 cards per stage, then Show more | New |
| Moving | The Move page parts; the stage-change command; the target stage in status/success-surface with a 2 px outline; Board / Drop bar for Lost, Won and Move; Undo for 6 s | Move page; shell R71; Dean, 12 November 2026 (B8, B9) |
| Phone | Below 768 px one stage with a stage picker; Move to stage in the card menu | Sales board rules; Move M5 |

## 6. Confirmed — 10 November 2026

On 10 November 2026 Dean confirmed these five items, together with the five on the [Move page](library-move.md): "Confirm all ten items as recommended and draw the next page". The values card (now card 10), the page header and the rule on moving to any stage in card 5 say so. When Sales adopts the library, its board hint "Drag a card to move it one stage" becomes "Drag a card to another stage" (B5).

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| B1 | Card rows and their order | The six rows of the accepted Sales deal card, made the card for every board | The Sales card was accepted for deals only; service and project boards have not been drawn |
| B2 | Signals and age at 12 px | Controls / Chip (12 Medium) for signals and 12 Regular for age; at most two signals, then "+N" | The accepted Sales card uses 10 px pills and 11 px age text |
| B3 | Menu button on cards | On hover and focus, always on touch, with its space kept | The accepted Sales card has none; the Move menu and Preview need one, and service requests already use a per-card menu |
| B4 | Stage paging and collapsing | 20 cards a stage, then Show more; collapsed 40 px stages kept for the person | No accepted source draws either |
| B5 | Any permitted stage | A drag can reach any stage the rules allow; skipped stages are checked the same way | The Sales D04 footer says "Drag a card to move it one stage", which could mean one stage at a time |

## 7. Decided — 12 November 2026

On 12 November 2026 Dean supplied four screenshots of the built Deals board and asked whether the library should be updated. He asked for arrow-shaped stage headers, a green stage under a dragged card, and Won, Lost, Delete and Move boxes shown while a card is dragged. Claude recommended adopting each in a refined form and listed six decisions. Dean answered: "Proceed based on your recommendaitons." Card 6, card 10 and the page header now say so.

| ID | Item | Decided | What it changes |
|---|---|---|---|
| B6 | Attention marker | A card that needs action has a 3 px status/danger marker on its left edge, with the reason in words. The card is never tinted | Amends B1. The built card turns pink |
| B7 | Card actions | Preview, Plan activity and Email on hover and focus, with More; on touch More only | Amends B3. The built card shows six icons at all times |
| B8 | Target stage | The stage a lifted card is over takes status/success-surface on its lane and header, with the 2 px brand/green-deep outline | Amends [Move M1](library-move.md): the container tint goes from 6% to 14%, and a board stage changes its own fill |
| B9 | Drop bar | While a card is lifted: Lost, Won and Move, each opening its own step. Delete is not in the bar; it stays in the card's menu | New. The built bar includes Delete |
| B10 | Flow headers | Arrow-shaped stage headers for ordered pipelines; the plain header for boards whose stages are states | New |
| B11 | Stage width | Stages share the page width, from 240 px to 360 px | The 240 px stage becomes the narrowest |

Adopted with the same answer, as refinements of the card: the two-line next action, whole dollars on cards and stage totals, and a title of one or two lines with no reserved band.

## 8. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Module files unchanged.** The accepted Sales board keeps its local cards. After publishing, Sales would place Board / Card; that changes its signal and age text size (B2) and adds the menu button (B3).
- **The built Deals board differs** from these decisions and is unchanged: pink attention cards, six icons on every card, a Delete box in the drag bar, a see-through bar, cents on amounts and faded stages. It aligns at its next reviewed change. The accepted Sales file's board sheet aligns the same way.
- **Avatars on the built card.** The screenshots show pairs such as "DI DF" that look like one person drawn twice. This was not checked in the application.
- **Target colour.** The flow header's Target state uses status/success-surface, a solid colour, because a see-through tint could not be tied to a variable on the arrow shapes. The lane uses the same colour, so they match.
- **Scaled examples.** The seven cards on card 3 are shown at 82%. Figma keeps their shadows as scaled copies with no effect style; the component itself keeps Elevation / Card.
- **Project task card** is described in words on card 2, not drawn.
- **Candidates, not drawn.** Swimlanes by owner (a follow-up on the Sales Deals page), limits on cards per stage, a compact card, cover images.
- **No proof beyond the design.** No prototype links were set on the Board parts. Keyboard, screen-reader and touch behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The two `board/` variables have no CSS property yet.
- **Next pages in the accepted order.** Time · Planners and calendars was drawn on 10 November 2026 and has [its own record](library-time.md). At Dean's choice the Gantt parts were drawn on a library page, Gantt · Bars and links, instead of in the Projects file ([its record](library-gantt.md)).

## 9. Checks

**12 November 2026**
- **Rendered and inspected.** The components section; cards 1, 2, 3, 5, 6 and 10 of the review board; the Foundations layout table; the Time page's first card.
- **Defects fixed while drawing:**
  - the card grew 4 px on hover once the actions were added;
  - two example stages on card 5 were too short for the taller card;
  - the new icon first landed on the wrong page;
  - a long activity detail was cut off, so the examples use shorter wording;
  - the flow headers did not show against a grey stage, so that example sits on white;
  - the Time page's untimed items became two lines, and were put back to one.
- **Existing instances.** The fourteen placed stage headers kept their names and totals after the header became a set of variants.
- **Structural read of the Board page** (2,827 nodes, 619 instances). Outside instances it found no solid fill or stroke without a variable, no text without a text style, no plain corner radius, no default layer name and no component without a status line. The seven scaled cards on card 3 have no effect style (section 8).
- **Variables read back from the file:** 66 in "PPO colour", 50 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density", 5 in "Control size" and 4 in "Motion" (139).
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.

**10 November 2026**

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: spacers that made cards 330 px tall, titles that did not wrap or lost their two-line limit, a Show more button clipped out of its stage, callouts covering header text, cursors and menus covering labels, a menu divider wider than its menu, a truncated banner message, effect styles dropped when card instances were scaled, and a stray empty frame.
- A structural read of the page (1,888 nodes, 416 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no default layer name, no plain corner radius and no component without a status line. It found seven scaled card instances whose shadows had lost their effect style; the styles were re-applied and read back.
- Variables read back from the file: 66 in "PPO colour", 23 in "PPO layout", 3 in "Grid density", 3 in "Control size" (95).
- The Read me card and the Foundations elevation card were rendered and inspected after their updates; the elevation specimen no longer clips the dialog shadow.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
