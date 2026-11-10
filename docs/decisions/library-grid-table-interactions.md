---
document_id: PPO-LIBRARY-GRID-INTERACTIONS-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design for Dean's review; drawn in the private Figma file "PPO - Library" on 10 November 2026; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Grid · Table interactions in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed, awaiting Dean's decisions D1–D5 (section 6).

On 9 November 2026 Dean asked whether the module UIs needed one place that defines how shared elements behave and look, giving two examples: dragging a table column to a new position, and hovering a column divider to change its width. The recommendation was to draw these as shared patterns in `PPO - Library`, which section 3 of the [design-to-build standard](../standards/design-to-build-standard.md) already designates for "shared patterns", rather than in a new file or in each module file. Dean created the `PPO - Library` file and asked for the table interactions page to be drawn: "I have created the PPO - Library file. … You can now draw the table interactions page." He then supplied the links to the shell and module files as the source for the tokens and the existing interaction sheets.

This record is a **proposal**. It records what was drawn, where it came from, the values it sets and the decisions Dean has to make. Drawing a pattern in the library does not accept it, publish it or change any module file.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)", collection "PPO colour" | The 66 colour variables and their role descriptions, copied into the library (section 3) |
| Private Figma file "PPO - Sales module (accepted)", page `133:27411`, sheet ST01 `94:22071` | Register row states (`94:22077`), column header states including resizing and frozen edge (`94:22147`), checkbox states (`94:22336`), sort and saved-view rule (X23), frozen-edge shadow (R13) |
| Private Figma file "PPO - Estimating module (proposal)", sheet ST01 `76:54660` | Row states (`76:54666`), header states including dragging with a drop indicator (`76:54818`, rule text `76:54860`), checkbox states (`76:55153`) |
| [Shell refined concept rules](../design/development/systems/shell-refined-concept-rules.md) | Green-deep marker role (R58), popover shadow (R44), tooltip and live-region use (R17, R71), Roboto scale (C6) |
| [RegisterTable](../design/development/components/register-table.md), [Sales table](../design/development/components/sales-table.md), [component README](../design/development/components/README.md) | Current app behaviour (no column resizing in RegisterTable; keyboard and pointer resize and move in the Sales table) and the rule that drag needs a labelled, non-drag alternative |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each item can be opened from its file.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared register pattern used by every module's register pages; no new route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Register / worklist: the grid inside it |
| Reused components | None yet in the library; the Sales and Estimating local kits are the references. New, all `Status: Proposed`: Grid / Header cell, Grid / Row, Grid / Checkbox, Grid / Column divider, Grid / Drop indicator |
| Incoming handover | A module register page places these components |
| Outgoing handover | The record opened from a row (drawer preview or record page), unchanged |
| Proposed departures | D1 focus-ring colour and D2 frozen-edge treatment differ from one or both module sheets; D3 values come from neither (section 6) |

## 3. What is now in PPO - Library

| Item | Node or count | Notes |
|---|---|---|
| Page "Read me" | `0:1`, card `12:2` | Purpose, current contents, rules, what is not yet in the library |
| Collection "PPO colour" | 66 variables, one mode "Value" | Names, values, scopes and descriptions as in PPO - Shell. Web code syntax on the 20 whose value is identical to an existing CSS property in the app (`--navy`, `--green`, `--ink`, `--text-secondary`, `--link`, `--paper`, `--surface-white`, `--surface-hover`, `--line-soft`, `--line-strong`, `--control-border`, and the nine `--success`, `--warning`, `--danger`, `--info` and `--neutral` text and surface properties). The other 46 have no code name yet |
| Text styles | 7: Text / 20 Medium, 14 Medium, 13 Regular, 13 Medium, 12 Medium, 12 Regular, 11 Medium | Roboto, from the shell scale (C6); `Status: Proposed` |
| Page "Grid · Table interactions" | `4:76` | Components in section `5:2`; review board `8:4` |
| Grid / Header cell | set `5:99`, 8 variants | Default, Hover, Sorted ascending, Sorted descending, Focus, Lifted, Origin slot, Frozen edge; text property Label |
| Grid / Row | set `6:95`, 7 variants | Default, Hover, Selected, Focus, Previewed, Attention, Overdue; text property Identity |
| Grid / Checkbox | set `5:10`, 3 variants | Off, On, Mixed |
| Grid / Column divider | set `5:109`, 4 variants | Rest, Hover, Active, Focus |
| Grid / Drop indicator | component `5:110` | 3 px bar with caps, stretches to the table height |
| Review card 1 · Column reorder | `8:7` | Six steps: at rest, hover, dragging, over the frozen zone, dropped, keyboard and non-drag alternative (header menu) |
| Review card 2 · Column resize | `9:92` | Six steps: divider hover with the 8 px hit zone, dragging with guide and width readout, minimum reached, released, double-click to fit, keyboard |
| Review card 3 · Sort, header states and frozen edge | `10:154` | All header variants with meanings; frozen edge at rest and scrolled sideways |
| Review card 4 · Row states | `10:399` | All row variants with meanings |
| Review card 5 · Values and decisions | `10:510` | The table in section 5 and decisions D1–D5 |

All fills, strokes and text colours on the components and the board are bound to the PPO colour variables, except the frozen-edge gradient shadow and the lifted-header and menu drop shadows, which are plain effect colours.

## 4. Behaviour drawn

**Column reorder.** Any column outside the frozen zone (selection, record identity, row menu) can move; frozen columns never move and cannot be crossed. Hovering a movable header shows the grip and the sort hint; a click still sorts, and a move starts only after a 4 px travel with the button down. While dragging, the header lifts and follows the pointer, its column keeps an outlined slot, and a 3 px brand/green-deep indicator marks the landing gap. Over the frozen zone there is no indicator and release returns the column. Esc cancels. On drop the order saves to the person's copy of the view and is announced in a polite live region. The keyboard and non-drag route is the header menu (Move left, Move right, Move to start, Move to end), reached by Enter on a focused header inside a single-Tab-stop header region, and the column chooser's Move up and Move down.

**Column resize.** An 8 px hit zone centred on the 1 px divider lights a 2 px brand/green-deep line and the col-resize cursor. While dragging, a 2 px guide runs the full visible height, the column resizes live and a navy readout gives the new width; widths stop at the limits. Release saves the width and announces it; Esc restores the starting width. Double-click fits to the widest value on the current page. Keyboard: Resize in the header menu focuses the divider; arrows change the width by 8 px, Shift with an arrow by 32 px; Enter keeps, Esc restores.

**Sort and frozen edge.** Click sorts ascending; a second click reverses; sort, order and widths save with the view. The frozen zone ends with a 2 px line/strong rule at all times and gains a 4 px shadow only while content has scrolled under it.

**Rows.** As the Sales and Estimating sheets, with the focus ring in text/link (D1) and attention shown by a 3 px marker and an icon, never by colour alone.

## 5. Values and sources

| Property | Value | Source |
|---|---|---|
| Header height | 36 px | Sales, Estimating |
| Row height | 40 px | Sales, Estimating |
| Frozen edge | 2 px line/strong rule; 4 px shadow once scrolled | Estimating; Sales R13 (D2) |
| Focus ring | 2 px text/link | PPO - Shell token role (D1) |
| Drag start threshold | 4 px with the button down | Proposed (D3) |
| Lifted header | surface/canvas, 1 px line/strong, 6 px radius, shadow 0 8 24 at 18% | Popover shadow R44; rest proposed |
| Origin slot | surface/hover, dashed line/control, content at 40% | Proposed (D3) |
| Drop indicator | 3 px brand/green-deep with caps | Estimating |
| Auto-scroll zone | 48 px from the sideways scroll edge | Proposed (D3) |
| Divider hit zone | 8 px centred on the 1 px divider | Proposed (D3) |
| Resize line and guide | 2 px brand/green-deep | Sales, Estimating |
| Width limits | 96 px; identity column 160 px; maximum 480 px | Proposed (D3) |
| Keyboard resize | 8 px per arrow; 32 px with Shift | Proposed (D3) |
| Settle motion | 150 ms ease-out; none under reduced motion | Proposed (D3) |
| Persistence | Order, widths and sort per person, with the view | Sales X23, Estimating (D4) |
| Announcements | Polite live region after a move or resize | Proposed |

## 6. Decisions for Dean

| ID | Question | Drawn | Recommendation |
|---|---|---|---|
| D1 | Focus-ring colour. PPO - Shell gives text/link the role "focus ring on light surfaces"; Sales ST01 draws the ring green and Estimating ST01 brand/green-deep | text/link | text/link, because green marks current and active items (R58) and a green ring would read as "current". Sales and Estimating then follow when they adopt the library components |
| D2 | Frozen edge. Estimating: 2 px line/strong rule always. Sales R13: shadow only once scrolled | Both | Both: the boundary reads at rest and depth shows only while content is underneath |
| D3 | The values marked Proposed in section 5, and the Ctrl+Alt+Right shortcut for keyboard resize, come from neither module sheet | As section 5 | Accept as starting values, to be tuned at the browser proof |
| D4 | Moving or resizing a column in a shared view | Saves to the person's own copy | Keep: only the view owner saves to the shared view |
| D5 | RegisterTable has no sticky header and no column resizing today; the Sales table has resize and move | Sticky header described as proposed | Adopt a sticky header in this pattern and bring RegisterTable to it after acceptance, as a separate reviewed change |

## 7. Not done and open

- **Not published.** The library has not been published, and no module file uses these components yet. Publishing waits for Dean's acceptance and a release note under section 5 of the standard.
- **Module sheets unchanged.** Sales ST01 and Estimating ST01 are untouched. After acceptance, each module's States section should reference this page instead of redrawing the grid states.
- **Not yet in the library.** Layout variables, effect styles, icons, the shell components and the page template. The shell has no text styles or layout collection to copy, so the seven text styles here are new and proposed.
- **Community libraries.** Eight community libraries (Material 3 Design Kit, Simple Design System and six Apple kits) are enabled on `PPO - Library`. Section 5 of the standard says unwanted community libraries are not enabled; turning them off is a desktop-app step for Dean.
- **No proof beyond the design.** No prototype links or motion. Behaviour is described, not demonstrated; keyboard, screen-reader and pointer behaviour need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. RegisterTable alignment (D5) is a later reviewed change.

## 8. Checks

- Every card on the review board was rendered and inspected; no clipped text or overlap was found after two fixes made during drawing: icon glyphs were re-centred in their frames, and strokes were excluded from layout so focus rings no longer shift content.
- Variable count read back from the file: 66 in "PPO colour", created fresh with none updated.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`.
