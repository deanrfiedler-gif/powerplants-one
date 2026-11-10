---
document_id: PPO-LIBRARY-MOVE-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026 at Dean's request; five items await his confirmation (section 6); every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Move · Drag and drop in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. Five items to confirm ([section 6](#6-to-confirm)).

On 10 November 2026 Dean accepted an order for the next pages of `PPO - Library`: Controls, shared rules for moving things, board cards, planners and calendars with a shared time axis, and the Gantt chart kept in the Projects file ([Controls record](library-controls.md)). After the Controls page he answered: "Confirm all nine items as recommended and draw the next page". The nine items are recorded in section 6.1 of the [grid record](library-grid-table-interactions.md) and section 6 of the Controls record. This record covers the next page, named "Move · Drag and drop".

The page gives one set of rules for everything a person can pick up and move: register columns, list rows, board cards, planner appointments and Gantt bars. The pages that follow add only what is specific to their own items.

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

No accepted file draws a general pattern for moving things. The page generalises what Dean accepted on the grid page and applies the repository's component rules. Parts with no source are marked new.

| Source | Status of source | Use |
|---|---|---|
| [Grid · Table interactions](library-grid-table-interactions.md), decisions D1, D3 and D7 | Accepted by Dean, 10 November 2026 | 2 px text/link focus ring; 4 px drag start; 400 ms press and hold on touch; lifted look; origin slot; 3 px drop indicator; 48 px auto-scroll zone; 150 ms settle; Space to pick up and drop; phones below 768 px do not drag |
| "PPO - Estimating module (proposal)", ST01 header states `76:54818`, rule text `76:54860` | Proposal | The 3 px brand/green-deep drop indicator |
| [Component README](../design/development/components/README.md) | Repository | A keyboard and a non-drag pointer alternative wherever movement is supported |
| [Sales board](../design/development/components/sales-board.md), [planner](../design/development/components/planner.md), [appointment](../design/development/components/appointment.md) | Repository | Change stage is the keyboard and touch alternative to drag; a drop proposes a move and the host still owns the checks; Move or reassign stays available as a non-drag control |
| [Shell refined concept rules](../design/development/systems/shell-refined-concept-rules.md) | Accepted | R17 tooltips, R44 popover shadow, R71 toasts, R74 Customise my rail (drag to reorder, applied on Save) |
| WCAG 2.2 AA | Standard | 2.5.7 dragging movements, 2.5.8 target size, 1.4.11 non-text contrast |

File links and keys stay outside this public repository (ADR-0050, ADR-0053).

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared behaviour used by every page type that lets a person move something; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Not a page: parts and rules used by register, board, planner and schedule pages |
| Reused components | Controls / Tooltip, Menu item, Menu divider, Toast, Dialog, Chip, Checkbox and Icon button are placed as instances. New in the library, all `Status: Proposed`: the six parts in section 3 |
| Incoming handover | A module page places these parts from the library |
| Outgoing handover | None |
| Departures | The items in section 6 |

## 3. What was drawn

**Page** "Move · Drag and drop" `66:37`: components section `67:37`; review board `69:69`.

**Variables added** to "PPO layout", which now holds 21. The library holds 93 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

| Variable | Value | Use |
|---|---|---|
| `move/handle-size` | 24 | The drag handle tile |
| `move/indicator` | 3 | Weight of the drop indicator line |
| `move/target-outline` | 2 | Outline of a container that will take the lifted item |
| `move/scroll-zone` | 48 | Distance from a scroll edge at which dragging scrolls |

**Icon added** on the Icons page: Icon / Blocked `66:42`. The page now holds 20 icons and 5 annotation cursors.

**Components** (all `Status: Proposed`, in section `67:37`)

| Component | Node | Variants and options |
|---|---|---|
| Move / Handle | `67:78` | 5: Rest, Hover, Focus, Grabbing, Disabled |
| Move / Drop indicator | `67:83` | 2: Orientation Vertical (`5:110`, the former Grid / Drop indicator with its node unchanged) and Horizontal (`67:79`) |
| Move / Drop target | `67:87` | 2: Over, Refused. Resized to the container |
| Move / Origin slot | `67:88` | One component, resized to the item |
| Move / Count badge | `67:89` | One component. Option: Count |
| Move / Reason tag | `67:97` | One component. Option: Label |

**Review board** `69:69`

| Card | Node | Holds |
|---|---|---|
| Page header | `69:70` | Status, owner, date, sources, contents |
| 1 · The move, step by step | `69:78` | Six moments: rest, ready, lifted, over a target, dropped, cancelled. Three kinds of target: a position, a container, a time |
| 2 · Handle or whole item | `70:271` | Handle states; three examples; five rules |
| 3 · Reorder in a list | `70:393` | Between two items; first and last; fixed items; back where it started |
| 4 · Move between containers | `72:476` | Lifted; over a container that will take it; a position inside; a container that will not take it; an empty container; a drop that needs a decision |
| 5 · Several items at once | `72:644` | Grab any selected item; lifted as a stack; dropped together |
| 6 · Scrolling and reaching | `73:622` | Auto-scroll near an edge; a closed container opens; outside every target |
| 7 · Without dragging | `73:811` | Keyboard pick-up, move and drop; the Move menu; touch rules; keys |
| 8 · After the drop | `74:852` | Saved with Undo; still saving; refused by the server; announcements; rules |
| 9 · Do and Don't | `74:1030` | Three pairs |
| 10 · Values, sources and items to confirm | `76:1061` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The example lists, cards and containers on the board are plain frames, not library components; the Board cards page will supply the card. The Read me page and the Foundations board were updated for the new page and variables.

## 4. Rules drawn

- **Six moments.** Rest, ready, lifted, over a target, dropped, cancelled. Each has one look. A click is still a click: the move starts after 4 px of travel.
- **Three kinds of target.** A line when the person chooses a position; an outline when the person chooses only the container and a rule orders its contents; a ghost when the person chooses a time (drawn in full on the Planners and calendars page). Never a line and an outline together.
- **Handle or whole item.** A handle when the item has its own links, checkboxes or text to select. The whole surface for cards and bars, except on their own buttons and links. An item that can never move has no handle; one that cannot move right now has a disabled handle and a reason. Space for the handle is always reserved.
- **Refusals.** A target that will not take the item shows a dashed outline, the not-allowed cursor and a reason tag that names the rule. A release there returns the item and is not an error.
- **Several items.** Dragging a selected item moves the selection as a stack with a count. The items land together in their order, or none do. One announcement and one Undo cover the move.
- **Reaching.** Dragging near a scroll edge scrolls the container. Holding an item over a closed container opens it. Outside every target, a release cancels.
- **Without dragging.** Everything that can be dragged can be moved from the keyboard (Space, arrows, Home, End, Enter, Esc) and from a Move menu (Move up, Move down, Move to top, Move to bottom, Move to…). On touch, a handle drags at once and a whole item lifts after a hold; phones use the Move menu.
- **After the drop.** A drop proposes the move and the server decides. Dragging, the keyboard and the menu call the same command, so permission, confirmation, required reasons, audit and Undo are identical. A command that opens a dialog opens it after a drop too. A refusal returns the item with a Danger toast that says why.
- **Announcements.** A polite live region speaks on pick-up, each move, drop, cancel and undo; a refusal speaks the reason tag's sentence.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Drag start | 4 px of travel with the button down. Touch: at once on a handle; a 400 ms hold on a whole item | Grid D3, D7; handle rule new |
| Handle | 24 px tile, grip in text/secondary; 44 px touch target; focus ring 2 px text/link | New; grid D1 |
| Lifted item | surface/canvas, 1 px line/strong, radius/control, Elevation / Popover; follows the pointer from the grab point | Grid D3; shell R44 |
| Origin slot | surface/hover with a dashed 1 px line/control outline | Grid D3 |
| Position target | 3 px brand/green-deep line with caps (3.57:1 on white) | Estimating ST01; grid D3 |
| Container target | 2 px brand/green-deep outline and a 6% tint (3.31:1 on surface/workspace) | New |
| Refused target | 2 px dashed status/danger outline (6.4:1 on surface/workspace), the not-allowed cursor and a reason tag | New |
| Reason tag | brand/navy, 12 Regular white, Blocked icon; 12 px below and to the right of the pointer | New; the look of shell R17 |
| Several items | A stack with a count badge; lands together in order, or not at all | New |
| Auto-scroll | Within 48 px of a scroll edge, both directions, faster nearer the edge | Grid D3 |
| Opening a closed container | After 600 ms with an item held over it; closes if the item leaves | New |
| Settle and shift | 150 ms ease-out; none under reduced motion | Grid D3 |
| Keyboard | Space picks up and drops, arrows move, Home and End jump, Enter drops, Esc cancels | Grid audit N3 |
| Single pointer | Move menu: Move up, Move down, Move to top, Move to bottom, Move to… | WCAG 2.5.7; component rules |
| Phones | Below 768 px: the Move menu only | Grid D7 |
| After the drop | Shows at once; the server checks again; a refusal returns the item with a Danger toast | Planner and board component rules |
| Undo | Toast with Undo for 6 s | Shell R71; grid audit R3 |
| Announcements | Polite live region on pick-up, each move, drop, cancel and undo | Grid D3 |

## 6. To confirm

| ID | Item | Drawn | Why it needs a decision |
|---|---|---|---|
| M1 | Target feedback | A line for a position; a 2 px brand/green-deep outline and 6% tint for a container; a dashed status/danger outline with a reason tag for a refusal | Only the line has a source. The outline, the refusal and the reason tag are new |
| M2 | Handle or whole item | A handle where the item has its own actions; the whole surface for cards and bars | No source states which items carry a handle |
| M3 | Several items at once | A stack with a count; all land together or none do | No module moves a selection today |
| M4 | Opening a closed container | A collapsed group, stage or tab opens after 600 ms with an item held over it | The behaviour and the 600 ms value are new |
| M5 | Touch | A handle drags at once; a whole item lifts after 400 ms; phones below 768 px use the Move menu | Grid D7 set the hold and the phone rule for columns; extending them to every item, and the immediate handle drag, is new |

## 7. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Not here.** Resizing by an edge (columns are on the grid page; appointments and bars belong to the Planners and calendars page). Dropping files from the desktop. Showing every available target as soon as an item lifts is a candidate, not drawn.
- **The time target** is shown as one small figure. The Planners and calendars page draws it in full.
- **Other pages unchanged.** The grid page's lifted header and origin-slot states stay as Grid / Header cell variants. No module file changed.
- **No proof beyond the design.** The steps are drawn, not played; no prototype links were set on the Move components. Timing, auto-scroll, keyboard and screen-reader behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The four `move/` variables have no CSS property yet.
- **Next pages in the accepted order.** Board cards, planners and calendars with a shared time axis, and the Gantt chart in the Projects file. None is started.

## 8. Checks

- The components section and every card of the review board were rendered and inspected. Defects found while drawing were fixed: a caption overlapping a container, a tooltip covering a step title, example rows with a dark outline, cursors and tooltips covering labels, a lifted card hiding the card under it, and a dialog shadow crossing the card edge.
- A structural read of the page (2,120 nodes, 347 instances) found, outside instances, no solid fill or stroke without a variable, no text without a text style, no shadow without an effect style, no default layer name and no component without a status line. Two layers keep a plain radius: the caps of the Vertical drop indicator.
- The two Grid page instances of the former Grid / Drop indicator were read back unchanged after the component moved.
- Variables read back from the file: 66 in "PPO colour", 21 in "PPO layout", 3 in "Grid density", 3 in "Control size".
- The contrast ratios in section 5 were computed from the PPO colour values with the WCAG relative-luminance formula.
- The Read me card and the Foundations layout card were rendered and inspected after their updates.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`, `python3 scripts/check_design_tokens.py`.
