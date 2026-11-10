---
document_id: PPO-LIBRARY-GRID-INTERACTIONS-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 10 November 2026; decisions D1–D8 accepted by Dean on 10 November 2026 and applied to the page; the page and its components remain Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Grid · Table interactions in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 · **Status:** Proposed. Decisions D1–D8 accepted by Dean on 10 November 2026 ([section 6](#6-decisions-accepted--10-november-2026)); the page itself awaits acceptance.

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
| Reused components | None yet in the library; the Sales and Estimating local kits are the references. New, all `Status: Proposed`: Grid / Header cell, Grid / Row, Grid / Checkbox, Grid / Column divider, Grid / Drop indicator |
| Incoming handover | A module register page places these components |
| Outgoing handover | The record opened from a row (drawer preview or record page), unchanged |
| Departures from module sheets | D1 focus-ring colour and D2 frozen-edge treatment differ from one or both module sheets; accepted by Dean on 10 November 2026 |

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
| Review card 1 · Column reorder | `8:7` | Seven steps: at rest, hover, dragging, over the frozen zone, dropped, keyboard and non-drag alternative (header menu, now with Set width… and Resize column), touch and tablet (`15:361`) |
| Review card 2 · Column resize | `9:92` | Seven steps: divider hover with the 8 px hit zone, dragging with guide and width readout, minimum reached, released, double-click to fit, keyboard, Set width… popover (`15:423`) |
| Review card 3 · Sort, header states and frozen edge | `10:154` | All header variants with meanings; frozen edge at rest and scrolled sideways |
| Review card 4 · Row states | `10:399` | All row variants with meanings |
| Review card 5 · Values, sources and accepted decisions | `15:439` | The table in section 5 and the accepted decisions D1–D8. Replaces the earlier proposal card `10:510`, which was removed |
| Review card 6 · Keyboard contract, touch and shared views | `15:611` | The WAI-ARIA data grid keyboard contract (D6), touch rules (D7) and shared-view behaviour with the "Modified" bar (D4) |

All fills, strokes and text colours on the components and the board are bound to the PPO colour variables, except the frozen-edge gradient shadow, the lifted-header, menu and popover drop shadows, and two annotation overlays (hit zone, touch point), which use plain colours or node opacity.

## 4. Behaviour drawn

**Column reorder.** Any column outside the frozen zone (selection, record identity, row menu) can move; frozen columns never move and cannot be crossed. Hovering a movable header shows the grip and the sort hint; a click still sorts, and a move starts only after a 4 px travel with the button down. While dragging, the header lifts and follows the pointer, its column keeps an outlined slot, and a 3 px brand/green-deep indicator marks the landing gap. Over the frozen zone there is no indicator and release returns the column. Esc cancels. On drop the order saves to the person's layout for the view and is announced in a polite live region. Keyboard: Shift+F10, the Menu key or a right-click opens the header menu (Move left, Move right, Move to start, Move to end). The column chooser's Move up and Move down buttons are the single-pointer route. On touch, press and hold a header for 400 ms to lift it.

**Column resize.** An 8 px hit zone centred on the 1 px divider lights a 2 px brand/green-deep line and the col-resize cursor; the header keeps its rest fill while the pointer is on the divider (D8). While dragging, a 2 px guide runs the full visible height, the column resizes live and a navy readout gives the new width; widths stop at the limits set by the column's type. Release saves the width and announces it; Esc restores the starting width. Double-click fits to the widest value on the current page. Keyboard: Resize column in the header menu puts the divider in resize mode; arrows change the width by 8 px, Shift with an arrow by 32 px; Enter keeps, Esc restores; there is no separate shortcut. Set width… in the header menu opens a field in whole pixels within the limits, the single-pointer and touch route.

**Sort and frozen edge.** Click or Enter sorts ascending; a second click reverses. The frozen zone ends with a 2 px line/strong rule at all times and gains a 4 px shadow only while content has scrolled under it. The header row stays in place when the body scrolls vertically.

**Rows.** As the Sales and Estimating sheets, with the focus ring in text/link (D1) and attention shown by a 3 px marker and an icon, never by colour alone.

**Keyboard contract (D6).** The grid is one Tab stop. Read-only registers move by row with Up and Down and between a row's interactive cells with Left and Right; editable registers move by cell. Home and End go to the first or last cell in the row; Ctrl+Home and Ctrl+End to the first header or the last row loaded; Page Up and Page Down move by a visible page. Enter on a header sorts; Enter on a row opens the drawer preview; Space toggles the row checkbox and Shift with Up or Down extends the selection; Ctrl+A selects all rows loaded; Enter or F2 starts editing an editable cell; Esc cancels a drag, resize, edit or menu.

**Shared views (D4).** Order, widths and hidden columns are the person's own layout for the view and save automatically, with Reset to view default. Sort and filters belong to the view: changing them on a shared view shows a "Modified" bar with Reset, Save as new view, and Save (owner only). Personal views save every change automatically.

## 5. Values and sources

| Property | Value | Source |
|---|---|---|
| Header height | 36 px | Sales, Estimating |
| Row height | 40 px | Sales, Estimating |
| Focus ring | 2 px text/link; at least 5.9:1 on every grid surface | D1 |
| Frozen edge | 2 px line/strong rule; 4 px shadow once scrolled | D2 |
| Sticky header | Header stays visible when the body scrolls vertically | D5 |
| Drag start | 4 px with the button down; touch: press and hold 400 ms | D3, D7 |
| Lifted header | surface/canvas, 1 px line/strong, 6 px radius, shadow 0 8 24 at 18% | Shell R44; D3 |
| Origin slot | surface/hover, dashed line/control, content at 40% | D3 |
| Drop indicator | 3 px brand/green-deep with caps (3.57:1 on white) | Estimating |
| Auto-scroll zone | 48 px from the sideways scroll edge | D3 |
| Divider hit zone | 8 px centred on the 1 px divider; header keeps its rest fill while on it | D3, D8 |
| Resize line and guide | 2 px brand/green-deep | Sales, Estimating |
| Width limits | Set per column type in the column registry; defaults 96 px, identity column 160 px, maximum 480 px | D3 |
| Keyboard resize | Resize column in the header menu; 8 px per arrow, 32 px with Shift; no shortcut | D3 |
| Set width… | Single-pointer and touch route; whole pixels within the limits | D3, D7 |
| Settle motion | 150 ms ease-out; none under reduced motion | D3 |
| Persistence | Order, widths and hidden columns per person per view; sort and filters edit the view | D4 |
| Keyboard model | WAI-ARIA data grid with the full contract (section 4) | D6 |
| Announcements | Polite live region after a move or resize | D3 |

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

## 7. Not done and open

- **Page acceptance and publishing.** The components stay `Status: Proposed` until Dean accepts the page. Publishing then needs a release note under section 5 of the standard; the change of the Sales focus ring from green to text/link is Medium impact and needs Dean's acceptance recorded first.
- **Module files unchanged.** Sales ST01 and Estimating ST01 are untouched; the Projects and Supply interaction pages are empty. After publishing, each module saves a named version, enables the library, swaps its local grid parts for the library components, and replaces the grid sections of its States page with a reference card to this page. Enabling the library and accepting updates are desktop-app steps for Dean. Module-specific states (inline edit, address lookup, workbench and CPQ line states) stay in the module files; buttons, chips and checkboxes belong to a later Controls page in the library.
- **Not yet in the library.** Layout variables, effect styles, icons, the shell components and the page template. The shell has no text styles or layout collection to copy, so the seven text styles here are new and proposed.
- **Community libraries.** Dean switched off the eight community libraries on 10 November 2026; a read through the Figma connector the same day showed none added to the file.
- **No proof beyond the design.** No prototype links or motion. Behaviour is described, not demonstrated; the keyboard contract, screen-reader announcements, touch behaviour and the D3 values need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. RegisterTable alignment (D5, D6) and the column registry's per-type width limits (D3) are later reviewed changes.

## 8. Checks

- Every card on the review board was rendered and inspected after each change; no clipped text or overlap was found after the fixes made during drawing (icon glyphs re-centred, strokes excluded from layout so focus rings no longer shift content, an oversized stage trimmed on the Set width… step).
- Variable count read back from the file: 66 in "PPO colour", created fresh with none updated.
- Contrast ratios in D1 and D8 were computed from the PPO colour values with the WCAG relative-luminance formula.
- Repository checks for this change: `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py`.

## 9. Audit — 10 November 2026

Dean asked for an audit of the pages built in `PPO - Library` for gaps, refinements, a more professional look, and new ideas. The audit read the file itself: a structural pass over the 203 nodes of the components and the 864 nodes of the review board (variable bindings, text styles, layer names, effects, component properties, instance use), a search of every caption for wording that no longer matched the accepted decisions, contrast computed for the remaining colour pairs, and a visual pass over both pages. Nothing below is drawn yet except the four corrections; each item is a recommendation for Dean.

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
