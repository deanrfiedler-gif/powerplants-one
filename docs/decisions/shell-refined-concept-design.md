---
document_id: PPO-SHELL-REFINED-FIGMA-DEC
date: 2026-11-08
owner: Dean Fiedler
status: Owner-accepted design (named version saved 8 November 2026); captures and application build separate
source_commit: 1672c062981402037355fb9d813dbedabd87cfbb
versioning: git
---

# Shell refined concept — owner decisions

On 8 November 2026 Dean asked for a new Figma design file holding one page with a refined concept of the Powerplants One shell, drawn from a review of the "Shell refinements" pages in his trial file of 4 November: one UI design only, states of that design allowed, no alternative concepts, no page content inside the shell container, and only the shell and its associated menus. Claude built the file "PPO - Shell refined concept" in Dean's Figma team and, through the day, extended it on Dean's instructions to two pages:

- "Shell refined · desktop shell and menus": 40 sheets A to AN of the desktop shell in its states, a refinement-notes card (rules R1 to R115, recorded differences D1 to D41, questions Q1 to Q22), and a Components section;
- "Workspace menus · flyout and docked": 25 sheets, a workspace flyout and a docked menu for each of the twelve workspaces and the My Work docked menu, built from the app's navigation definitions and the design register.

The file is private. Node IDs below identify frames inside it; the file itself is not linked from this public repository, and its logo artwork is not committed.

Claude drew from these sources:

- the trial file "PPO - Shell concept" of 4 November 2026 (Acumatica-inspired shell trial, frames A–I, proposal only);
- the accepted [shell top bar amendment](shell-top-bar-amendment.md), [rails and secondary menus aligned with Figma](shell-rail-menu-figma-alignment.md), [phone header amendment](phone-header-amendment.md), [phone register patterns](phone-register-patterns-amendment.md) and [system pages design](system-pages-figma-design.md);
- the [Figma application increment](figma-ui-implementation.md) (Shell v2, archived as a proposal under [Figma pages aligned with the Template](figma-page-template-alignment.md)) and the [navigation architecture board](navigation-architecture-board.md) (NAD-08, a Reports workspace);
- the accepted designs the shell must host: [Help Centre and page guides](help-centre-figma-design.md) (DK-07), [Assistant](assistant-figma-design.md) (AI-01), [Conversations T1c](conversations-t1c-design.md) (top-bar action) and [Calling](calling-figma-design.md) (stage 1a);
- the shell sources: `src/shell/navigation.ts` (workspaces, destinations, department rails, rail groups, My Work views), `src/supply/navigation.ts`, `src/engineering/control/navigation.ts`, `src/shell/secondary-menu.tsx`, `src/shell/module-workspaces.ts`;
- the design register `docs/design/development/register.json` (372 entries at `1672c062`) and the shell system page `docs/design/development/systems/shell.md`;
- [ADR-0053](ADR-0053-figma-page-design.md) for the Figma working practice.

## 1. What Dean decided

Dean directed the design sheet by sheet through the day, each audit ending in his instruction to apply the recommendations ("Apply all", "Yes, apply", "Yes, build it", "Build batch 1", "Build batch 2", "Build batch 3", "Build all six", "Apply option 2", "Apply 12 / 16 / 24", "Apply both", "Apply them"), and settled three points against the recommendation of the day or by his own preference: the right drawer always overlays the content ("I don't like to condense the contents of the page, especially when it comes to registers and tables"), the New button sits on the drawer's left edge, and the tenant chip is filled at rest. He also kept the bar at 48 px, declined dividers between bar elements ("Keep as is"), declined a scrim behind the desktop drawers ("Yes, no scrim"), and kept the More panel tiles without chevrons ("Yes, keep").

On 8 November 2026 Dean accepted the recommended answers to all twenty-two open questions by choosing "Accept as recommended". Section 3 lists them. Q8 had been resolved earlier the same day.

Later on 8 November 2026 Dean saved the named Figma version. Claude recommended the title "Shell refined concept — accepted", following the other accepted designs; Dean's words were "It has been saved." Claude did not open version history, so the title rests on his word. The page header, notes card and section names were then updated to say the design is accepted; no frame changed after the save. No icon-free, logo-free captures are retained in this repository yet.

## 2. Scope and limits

- The shell only: top bar, navigation rail, workspace flyout, docked workspace menu, More panel, global search, New menu, Notifications, Conversations peek, Account menu, tenant switcher, status pills and offline queue, right rail strip and right drawer with its six tabs, banners, toasts, dialogs, page states, focus order and the responsive cases at 1920, 1440, 1280, 1024, 834 and 768. Content regions are empty by design except where a skeleton or a page state is the point.
- Below 768 px the accepted phone header applies. R94 lists what the phone header absorbs from this shell.
- Design register: the shell is `system:shell`; no page scope is added, renamed or removed. No parent requirement ID changes; all 78 remain. The workspace menus list pages the app's navigation already defines plus designed pages in the register; they add no route.
- This is a design decision. It authorises no application code, route, capability, grant, migration, token change in `src/`, telephony, or deployment. Every record, person, count and tenant shown is synthetic. The Lucide icons in the file stand in for Font Awesome Light, which the application uses; the logo mark is the one asset that is not synthetic and it stays out of this repository.
- The application build is a separate decision with its own plan. Dean's rule of 2 November 2026 stands: no new builds until the pull-request backlog drains.

## 3. The twenty-two questions and their decisions

| Question | Decision, 8 November 2026 |
|---|---|
| Q1 Centred or left search | Centred, 448 px at x 496–944 on 1440 (R1, R99) |
| Q2 My Work count | Keep it; it counts overdue plus due today |
| Q3 Hover peek on the collapsed rail | Click opens; the 400 ms hover peek stays as a preview and is off on touch |
| Q4 More panel page counts | Names plus page counts, the audited totals |
| Q5 Default rail | The seven departments filtered to the role, with Customise my rail for personal order |
| Q6 Notifications | The popover, with See all notifications leading to the page |
| Q7 New menu | Follows the active workspace; shared records always present |
| Q8 Right strip presence | Resolved earlier: only on pages with something to preview |
| Q9 Logo | Dean to supply a mark-only logo as SVG; the current mark stays until then |
| Q10 Counts on workspace glyphs | None; one number on My Work only |
| Q11 Favourites | One global list drives the Favourites page; each workspace menu shows its subset |
| Q12 Search dimming | None; the search card is a plain popover |
| Q13 Tenants | Powerplants Australia and Demo company only for now; every staff account may switch into the demo tenant under the amber signal; customers never see tenants |
| Q14 Assistant and Page guide | Strip tabs, as drawn |
| Q15 Demo signal | Stripe plus chip |
| Q16 Shortcut letters | Proposals; reserve the global set; audit the app's key handling in the build plan |
| Q17 Calling | Align the card with Calling stage 1a; telephony is that decision's; the shell reserves the card and pill slots |
| Q18 Focus mode | Per page for the session |
| Q19 Tablet | Calendar leaves the bar below 1024 |
| Q20 Bulk actions | Registers name their actions; up to five plus Clear; deals are marked lost or archived, never deleted |
| Q21 Page views | Nested rows under the current page in the docked menu |
| Q22 Counts and the admin rail | Worklist counts only; Reporting, Knowledge and Administration stay under More for everyone |

## 4. The sheets

Page "Shell refined · desktop shell and menus", section "Refined shell · 1440 × 900 · content region empty". Frames are 1440 × 900 unless stated.

| Sheet | Node | What it proves |
|---|---|---|
| A Default, rail collapsed | 6:584 | Bar zones 496 / 448 / 496, 80 px rail, 48 px right strip with six tabs |
| B Rail expanded | 6:753 | 240 px labelled rail, workspaces only |
| C Workspace flyout · Sales | 6:944 | 760 px overlay drawer from the rail, Find at x 496 |
| D Workspace menu docked | 6:1281 | 280 px docked menu, Favourites first, pin and collapse |
| E More workspaces panel | 6:1521 | Twelve workspace tiles with accent chips, shared records, administration |
| F, L Global search | 7:2255, 36:3620 | 448 px card from the field: empty and typing states |
| G New menu | 6:1963 | Workspace-aware create menu with accelerator chips |
| H Notifications | 7:2524 | Right-aligned to the bell |
| I Account menu | 6:2197 | Role · tenant line, Switch tenant, last sign-in |
| J Offline pill, U Offline queue | 18:2826, 64:4381 | Status slot and its queue |
| K Docked menu collapsed | 29:3122 | 12 px strip with a grip |
| M, AI–AL Right drawer | 39:3676, 110:8595, 110:8813, 110:9043, 110:9274 | Overlay drawer: nothing selected, then Snapshot, Activity, Files and Conversations with a record |
| N Tenant switcher | 47:3916 | Current tenant ticked, demo tenant named |
| O Assistant, Q Page guide | 67:6098, 67:6397 | Shell helpers in the drawer's strip tabs |
| P Conversations peek | 64:4139 | Threads, unread and mentions |
| R Keyboard shortcuts, AF Discard changes | 66:5455, 79:8186 | The dialog pattern: 12 px radius, 32 % navy scrim |
| S Banner and toasts | 66:6247 | Banner at the top of the content region, toasts bottom-left |
| T Demo tenant active | 64:4428 | Amber chip and 3 px stripe |
| V Customise my rail | 66:5590 | Reorder, add and remove workspaces |
| W 1024 × 768, AC 834 × 1194, AN 1440 × 768 | 66:6462, 79:7381, 110:10173 | Narrow, tablet and short screens |
| X Incoming call | 71:6646 | Caller-ID card bottom-right |
| Y First paint | 71:6685 | Shell chrome at once, page skeleton |
| Z Sparse rail | 71:7120 | A Service technician's rail |
| AA Focus mode | 71:7310 | Rail and strip hidden, exit pill |
| AB Focus order | 71:7519 | Skip link, tab sequence, landmarks |
| AD Bulk selection | 79:7586 | Floating bar bottom-centre |
| AE Page error | 79:7935 | Shell-owned page state |
| AG New user | 79:8285 | No counts, Notifications empty |
| AH Stress test | 79:8667 | 99+ counts, truncation, twelve workspaces |
| AM Rail expanded with the flyout | 110:9961 | Flyout anchors at 240 |

Page "Workspace menus · flyout and docked": a flyout and a docked menu for Sales (101:8979, 101:9340, instances of the shell components), Estimating & quotation (103:9365, 103:10187), Engineering (103:10751, 103:11497), Projects (103:12056, 103:12782), Service operations (103:13303, 103:14098), Supply chain (103:14659, 103:15374), Finance (103:15896, 103:16615), Reporting (103:17132, 103:17816), Knowledge (103:18325, 103:19012), Customer portal (103:19521, 103:20179), Administration (103:20658, 103:21403) and Assistant (103:21959, 103:22673), and the My Work docked menu (101:9606). Page totals: Sales 14, Estimating 14, Engineering 9, Projects 11, Service 16, Supply 11, Finance 9, Reporting 7, Knowledge 7, Customer portal 6, Administration 14, Assistant 8.

Components: 36 shell components and sets (top bar, rails, strip, flyout, docked menu and strip, More panel, search set and small states, New menu, Notifications and its empty state, Account menu, tenant switcher, Conversations peek, Offline queue, right drawer in three forms, two dialogs and a dialog set, banner and toast sets, incoming call, selection bar, page state set, file drop overlay, focus exit pill, skip link, tooltip, status pill set, focus marker annotation) and 101 `Icon/*` components. Variables: 66 in the collection "PPO colour" (30 core, 12 person, 24 workspace accent), each with a role description.

## 5. Rules, in summary

The notes card carries R1 to R115, reproduced in the repository as [Shell refined concept — rules, differences and decisions](../design/development/systems/shell-refined-concept-rules.md) so the build and its reviewers can read them without Figma access. The headlines are:

- **Top bar (R1, R3, R20, R60, R99, R100, R103).** 48 px, navy-deep, never two lines tall. Zones 496 / 448 / 496 at 1440: brand tile and tenant chip, a centred 448 px search with 16 px gaps either side, New as a 32 px white circle whose left edge sits on the right drawer's left edge at x 960, five utilities centred between New and the account by twin spacers, one hairline before the account. The tenant chip is a field: 12 % white at rest, 16 % hover, 24 % open, 28 % border. Zones 440 / 400 / 440 at 1280, 332 / 360 / 332 at 1024, 272 / 262 / 300 at 834, 720 / 480 / 720 at 1920.
- **Rail (R5, R78, R83, R105, R113).** 80 px collapsed with 11 px labels truncated at 72 px, 240 px expanded; surface/rail one clear step lighter than the bar, hover and active stepped above it; green current marker; counts cap at 99+; twelve workspaces scroll behind a 48 px fade with the footer fixed; the rail lists only what the role may open and the first visible workspace takes the current state.
- **Menus (R29, R61, R63, R77, R106–R115).** The flyout is a 760 px full-height overlay with no scrim, Create tiles at a fixed 169 px only where a create route exists, three 219 px columns of page links using the rail labels, Favourites, Saved views and two-line Recent rows; the docked menu is 280 px, pushes the content, lists the same pages, nests a current page's views, scrolls between Find and footer; the expanded rail and the docked menu are never open together; every row carries the page's one-line purpose as its tooltip; menus show only ready pages.
- **Right side (R66, R98, R112).** A 48 px strip with Snapshot, Activity, Files, Conversations, a divider, Assistant and Page guide; the drawer is 480 px and always overlays the content with a left shadow; with a record it names the record on two lines and each tab has its own footer action.
- **Layers (R62, R70, R71, R79, R96).** Popovers anchor to the trigger edge nearest the screen edge, 4 px below the bar; dialogs are the only scrimmed surface; banners sit at the top of the content region one at a time, toasts bottom-left, the selection bar bottom-centre, the call card bottom-right; layers never create browser history; one elevation ladder and one set of motion timings.
- **Colour (R15, R57–R59, R101, R102, R105).** Grey chrome panels on a white canvas; brand green on navy only, brand/green-deep for current markers on light surfaces; status colours exclusive to status; six person colours for avatars; twelve workspace accents only on icon chips.
- **Situations (R72–R76, R81–R92, R94, R95, R97).** Demo tenant in amber with a stripe; offline, syncing and saved pills with a queue; first-paint skeleton; focus mode; incoming call; new-user empty states; page error inside the shell; tablet and touch rules; phone alignment; the window title carries the unread count.
- **Accessibility (R85, R86, R110).** Skip link first, grouped controls as single tab stops, 2 px text/link focus ring, layers trap and return focus, Esc closes the newest layer, toasts never take focus; all text pairs at 4.5:1 or better and all markers at 3:1 or better.

## 6. Differences from what is built and from earlier accepted designs

The notes card records D1 to D41. The ones that change the build:

| Area | Built or accepted today | Refined concept |
|---|---|---|
| Bar height and layout | 64 px desktop header; search at `clamp(232px, 28vw, 420px)` centred; breadcrumb in the start zone | 48 px bar; fixed zones; brand tile and tenant chip in the start zone; breadcrumb and page title belong to the page header |
| Rail | 76 px compact, 232–240 px labelled, navy `#242a37` | 80 px collapsed, 240 px expanded, a lighter `surface/rail` with the bar darker |
| Workspace menus | Page-level secondary menus (My Work, Materials, Changes, Commissioning, Schedule, Acceptance, Returns) docked from 1200 px | One docked menu per workspace listing all its pages, with a page's views nested under it; the flyout from the collapsed rail |
| More | Workspaces, My workspace, Shared records, Administration groups | Tiles with accent chips and page counts, Shared records, Administration, Customise my rail |
| Right side | Page guide from the information icon; Conversations and bell in the header; no persistent strip or drawer | A persistent 48 px strip and a 480 px overlay drawer hosting Snapshot, Activity, Files, Conversations, Assistant and Page guide |
| Working company | Dot on the avatar and a choice in the account panel (C1, 17 October) | A tenant chip and switcher in the bar, repeated in the Account menu; the demo tenant signalled in amber |
| Tokens | Theme tokens in `src/app/styles` | 66 PPO colour variables, including person and accent sets, to be mapped to the theme |

These are departures from the accepted top bar amendment and rail alignment of October, proposed here and decided by Dean on 8 November 2026; those records remain the description of what is built until the build lands.

## 7. Open items

- Q9: a mark-only logo asset from Dean.
- Retained captures: the file carries the logo artwork and Lucide stand-ins, so capture copies need the same logo-free, icon-free treatment as earlier designs before PNGs are retained under `docs/reference/ui/application-shell/`.
- Q16: an audit of the application's existing keyboard handling before shortcut letters are fixed.
- Q17: alignment of the call card and on-call pill with Calling stage 1a when telephony is decided.
- The build plan, staged and sequenced, after the backlog rule allows a new build; the design register's `system:shell` entry and the component bindings update with that build.

## 8. Verification

- Claude measured, after every change, that no child lay outside its sheet, no sheets or labels overlapped, sections kept 80 px gaps and no single-line label wrapped, on both pages; and viewed screenshots of every sheet in Figma after it was built or changed.
- Contrast was computed for every text pairing (4.5:1 or better), for brand green on light surfaces (2.2–2.4:1, failing, which is why brand/green-deep exists at 3.6:1 on white), for the person pairs (5.0–6.5:1) and the accent pairs (3.1–12.3:1).
- The workspace menus were built from the navigation definitions in `src/shell/navigation.ts`, `src/supply/navigation.ts` and `src/engineering/control/navigation.ts` and from `register.json`, so every page link names a defined destination or a registered scope.
- Nothing is built: there is no application, keyboard, screen-reader, zoom or device evidence, and the sheets set no UI baseline.
- Dean saved the named Figma version on 8 November 2026 ("It has been saved."); the file history holds every earlier change.

## 9. File name — 9 November 2026

The private Figma file is now named "PPO - Shell (accepted)". Every citation in this record, in the [rules export](../design/development/systems/shell-refined-concept-rules.md) and in the shell system page that names "PPO - Shell refined concept" means this file; node IDs are unchanged, so no citation is rewritten. On 9 November 2026 the file holds two pages, "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)". The earlier "Sales module · refined UI pages (proposal)" page is no longer in it; the Sales pages are recorded in the [Sales module refined UI record](sales-module-refined-ui-proposal.md) against their own file, "PPO - Sales module (accepted)". The named version cited for builds remains "Shell refined concept — accepted" (8 November 2026) until a later named version of this file is recorded.

## 10. Record header toolbar — 9 November 2026

Dean asked, from a screenshot of a quotation record header (breadcrumb, title with a Draft chip and a favourite star, a sub-line, and a toolbar with back, undo, new, duplicate, first, previous, next and last record buttons, Actions, Reports and Issue & send), whether its elements belonged on the module pages. Claude recommended a shared record header for every record page in every module, drew it in this file as a proposal on a new page, and Dean accepted it the same day: "Accept the record header toolbar as drawn."

**What was drawn and where.** Page "Record header toolbar (accepted 9 November 2026)" (`170:9926`): header card `170:9927`; the navigation-states strip `170:10179` (first in view, middle, last in view, opened by link); the in-context sheet RH01 `170:10244`, a quotation record at Approved · not issued inside the accepted top bar, rail and right strip; the rules card `170:10581`. The component set **Shell / Record header · toolbar** `170:10178` (1312 px wide; variants State = Draft `170:9933`, Awaiting approval · approver `170:9973`, Awaiting approval · preparer `170:10015`, Approved · not issued `170:10056`, Issued `170:10099`, Closed `170:10139`) and the component **Shell / Record header · toolbar · phone** `170:10215` (390 px) were moved on acceptance into the accepted Components section `7:2767` on the first page, below the File drop overlay with their labels `179:15138` and `179:15139`; node IDs are unchanged. Both are built from this file's own top bar, rail, right rail and icon components and the PPO colour variables, so they need no new token.

**What it is.** Four rows: the breadcrumb; a one-row title with the state chip and a favourite star; a one-line sub-line; and the toolbar: previous and next within the register view the record was opened from with "n of N in view", a labelled **Actions** menu, an **Outputs** menu with the printer glyph, and one state-driven primary action; then a hairline rule. On the phone: back arrow, truncated title, star and more menu, a status row, and a sticky action bar with Actions and the primary. The six variants show the quotation's primary action by state: Submit for approval; Return and Approve… for the approver; Approve… disabled for the preparer with the reason beside it ("You prepared this revision, so you cannot approve it. Jordan Blake can."); Issue & send for the issuer; Record response; and Read only with the closing date.

**Not adopted from the screenshot, and why.** A record-level Undo (saves are reasoned, versioned decisions; undo lives inside a draft editor before save); a New (+) button (quick create stays in the flyout and the top bar, C5 and R9); first and last record jumps (no clear meaning on a filtered, sorted view); a desktop back arrow (the breadcrumb returns; the phone header keeps its own). "Reports" is named Outputs, after DK-03. "Issue & send" is kept but only at Approved · not issued and only for the issuer; a Draft shows Submit for approval, so the three-person rule of the quotation release design holds.

**Rules.** R116 to R125 in the [rules export](../design/development/systems/shell-refined-concept-rules.md#rules-r1r125), reproduced from the rules card: the header on every record page; the singular state-driven primary; Actions as a labelled menu with Duplicate; Outputs where a record has outputs; previous and next in view; the favourite star feeding Favourites; no record-level Undo; no New or desktop back arrow; the phone sticky bar; tooltips, accessible names and focus order.

**Consequences.** The Sales file adopts the header on its record pages in a follow-up batch (replacing the "…" menu and adding Outputs, the star and previous and next); the Estimating, Projects and Supply module files use it from the start, their briefs citing this section. No lettered sheet was added to the shell page, so the sheet index A–AN is unchanged; the in-context sheet lives on the toolbar page. Nothing is built: the toolbar is a design, and the shell build gates apply to it when a page that uses it is built.

**Verification.** Every frame was rendered and inspected after a sizing correction (vertical auto-layout frames whose height `resize()` had fixed were set back to hug); the page's top-level nodes do not overlap and every section contains its children; after the move the Components section was extended to 8,978 px and the new items sit 120 px below its lowest earlier component; the 17 references on the page use the short form of the [readable reference namespaces decision](readable-reference-namespaces.md) (`SYN-QUO-000214`, `SYN-EST-000312`). The synthetic story on the sheet is the Sales file's Riverbend quotation.

**Named version.** A new named version of this file is Dean's to save, for example "Shell refined concept — accepted · record header toolbar"; under [Build from the named Figma version](figma-named-version-build-handoff.md) rule 5 the 8 November version does not carry the toolbar, so until the new one is recorded builds cite "Shell refined concept — accepted" for the shell and this section for the toolbar.
