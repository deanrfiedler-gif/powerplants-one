---
document_id: PPO-LIBRARY-RECORD-PROP
date: 2026-11-11
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 11 November 2026 at Dean's request; the six items in section 6 were confirmed or decided by Dean on 11 November 2026; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Record · Details, tabs and history in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 11 November 2026 · **Status:** Proposed. The items in [section 6](#6-confirmed--11-november-2026) were confirmed by Dean on 11 November 2026. The page itself awaits acceptance.

After the [Gantt, Forms and States items were confirmed](library-states.md#6-confirmed--11-november-2026), Dean answered for the third time: "Proceed however you believe is the most professional." Record came next in the recommended order of the groups that section 5 of the [design-to-build standard](../standards/design-to-build-standard.md) requires and the library did not yet hold. This record covers that page, named "Record · Details, tabs and history".

The page holds the parts every record page shares below its header: the page's own bar, the details column and its facts, state banners, the next activity, the composer, History and files. It brings the layout the accepted record pages share into the library. That layout runs from the lead record page of 11 October 2026 to the Sales and Estimating files accepted on 9 and 10 November.

The record header and the snapshot drawer are accepted shell components:
- `Shell / Record header · toolbar`, accepted on 9 November 2026;
- the 480 px right drawer.

They move into the library with the shell, which needs Dean's desktop copy (section 6 of the standard). This page draws them as layouts only, so the library never holds a second master of an accepted component (item R1).

This record is a **proposal**. Drawing the page does not accept it, publish it or change any module file.

## 1. Sources

| Source | Status of source | Use |
|---|---|---|
| [Shell refined concept](shell-refined-concept-design.md) (PPO-SHELL-REFINED-FIGMA-DEC), section 10, and its [rules](../design/development/systems/shell-refined-concept-rules.md) | Owner-accepted; record header toolbar accepted 9 November 2026 | <ul><li>One record header on every record page: breadcrumb, title with state chip and star, sub-line, toolbar, hairline, then the page's own bar (R116)</li><li>One primary action by state, disabled with the reason, or "Read only" with its date (R117)</li><li>A labelled Actions menu (R118); Outputs only on records with outputs (R119)</li><li>Previous and next in view, "n of N in view" (R120)</li><li>No record-level Undo (R122); no New or desktop back arrow (R123)</li><li>Phone sticky action bar (R124)</li><li>The 480 px snapshot drawer with Snapshot, Activity, Files and Conversations, overlaying at every width (R66, R98, R112)</li><li>File drop on record pages (R93)</li><li>Below 768 px the phone header rules (R94)</li></ul> |
| [Lead record page](lead-record-page-design.md) (PPO-CRM-LEAD-RECORD-DESIGN-DEC) | Owner-accepted, 11 October 2026 | The shared layout: <ul><li>one header row (R2)</li><li>readiness bar (R3)</li><li>state banners (R4)</li><li>380 px details column with collapsible sections that scrolls on its own (R5)</li><li>composer with Note, Activity, Email and File (R6)</li><li>Focus with Tomorrow, Next week and Pick a date (R7)</li><li>History by day with filter counts (R8)</li><li>files as SharePoint links (R10)</li><li>phone tabs and footer buttons (R11)</li></ul> |
| [Work order record page](work-order-record-page-design.md) and [Project record page](project-record-page-design.md) | Owner-accepted, 12 October 2026 | <ul><li>View tabs at the top of the main column (work order R2)</li><li>The review form in a side panel (Q3)</li><li>A record outside access reads as not found</li><li>Key-dates strip instead of a readiness bar (project R3)</li><li>The details column folds to a 44 px labelled strip (project R4)</li></ul> |
| [Deal record page](deal-record-page-design.md) (PPO-CRM-DEAL-RECORD-DESIGN-DEC) | Owner-accepted, 16 October 2026 | <ul><li>Seven view tabs (R2)</li><li>Advisory exit readiness (R4)</li><li>Header actions (R5)</li><li>Overview always the default tab (Q6)</li><li>Tablet folds the details column to 44 px (Q7)</li><li>Record states in banners (D12)</li></ul> |
| [Organisations](organisations-figma-design.md) and [People](people-figma-design.md) | Owner-accepted, 18 October 2026 | Correct details as one form with a required reason that names the changed values and the relying records (People D6) |
| [Quotation detail](quotation-detail-figma-design.md) and [Estimate detail](estimate-detail-figma-design.md) | Owner-accepted, 23 and 30 October 2026 | <ul><li>Primary action by state (D3)</li><li>Seven tabs with neutral counts and attention in words (D4)</li><li>First tab chosen by state and kept in the link (Q3)</li><li>Tablet details column 300 px, and phone summary with sticky 48 px actions (estimate D14)</li></ul> |
| [Phone header amendment](phone-header-amendment.md) | Owner-accepted, 19 October 2026 | Phone record header: back, position, previous and next, More; title and status move into the content; main actions in a sticky bottom bar (P1, P3) |
| [Sales](sales-module-refined-ui-proposal.md) and [Estimating](estimating-module-refined-ui-proposal.md) refined files | Owner-accepted, 9 and 10 November 2026 | <ul><li>Every record uses the shared layout, and forms open in a 432 px right panel without a scrim, "like the preview drawer" (Sales A5)</li><li>Documents are links only (R06); History is immutable (R07)</li><li>A labelled Actions menu (Estimating A15)</li><li>Previous and next at the right of the breadcrumb row (A16)</li><li>A "Reports" menu of outputs (A17)</li></ul> |
| [Drawer widths](library-drawer-widths.md) (PPO-LIBRARY-DRAWER-WIDTHS-DEC) | Owner decision, 11 November 2026 | Right-hand drawers of 360, 480, 640 and 800 px by content; editing a section in the 480 px drawer |
| Built application: `src/components/ui/shared-record.tsx`, `src/components/record-ui.tsx`, `src/app/styles/organisations.css` | Repository; built | <ul><li>380 px facts column on the left; 130 px labels with a 12 px gap</li><li>280 px at 900 px or less; stacked at 600 px or less</li><li>Tabs at least 48 px with a 2 px underline</li></ul> |
| [Forms](library-forms.md), [States](library-states.md) and [Controls](library-controls.md) records | Proposed; items confirmed | Fields and the save bar for edit drawers; placeholders, notices and the Outcome unknown wording on record pages; buttons, links, tabs, chips and banners |
| WCAG 2.2 AA | Standard | 1.3.1 info and relationships, 1.4.1 use of colour, 2.4.3 focus order, 2.4.6 headings and labels, 4.1.2 name, role, value |

File links and keys stay outside this public repository (ADR-0050, ADR-0053). The frozen "PPO - Design" file and the shell file that hold the accepted record pages and header were not opened; the decision records and their captures were the source.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | Shared record-page parts for every module; no new route. Each record page keeps its own scope and route. No parent requirement ID is added or renamed; all 78 remain |
| Page type (r20) | Record / detail page |
| Reused components | <ul><li>Controls / Button, Icon button, Link, Chip, Filter chip, Tab, Menu item, Tooltip, Banner and Field</li><li>Form / Save bar</li><li>State / Placeholder, Inline notice, Outcome banner and Message panel</li><li>Existing icons: Calendar, Edit, Saved, Attention, Locked, Info, Blocked, Close, More, arrows and chevrons</li></ul>New in the library, all `Status: Proposed`: the eleven Record parts in section 3 and five icons |
| Incoming handover | A register row, search result, link or notification opens the record |
| Outgoing handover | The record's own decisions (each in its dialog or page), related records through links, the edit drawer |
| Departures | The items in section 6, confirmed |

## 3. What was drawn

**Page** "Record · Details, tabs and history" `182:37`: components section `182:41`; review board `187:148`.

**Variables added** to "PPO layout":

| Variable | Value | Use |
|---|---|---|
| `record/details-width` | 380 | Details column |
| `record/details-folded` | 44 | Details column folded to a strip |

The edit drawer uses `drawer/standard` (480). It was created as `record/panel-width` and renamed when Dean set the drawer widths ([drawer widths](library-drawer-widths.md)). With those widths, "PPO layout" holds 39 and the library 124 variables; [`docs/design/library-variables.json`](../design/library-variables.json) is updated.

**Icons added** on the Icons page, drawn like the existing set (14 px, a 1.3 px stroke bound to text/secondary): Icon / Mail `183:40`, File `183:44`, Star `183:47`, Printer `183:52` and History `183:57`. The library holds 29 icons; the Icons section was widened to hold them.

**Components** (all `Status: Proposed`, in section `182:41`)

| Component | Node | Variants and options |
|---|---|---|
| Record / Fact | `182:71` | 5: Value, Link, Unknown, Not read, Worked out |
| Record / Details section | `182:103` | 2: Open, Closed. Option: Show edit |
| Record / Details strip | `182:104` | One component |
| Record / Readiness bar | `184:118` | 2: Ready, Gaps |
| Record / Key dates | `184:119` | One component |
| Record / State banner | `184:186` | 4: Read only, Converted, Archived, Closed. Option: Show action. Exposed: Action |
| Record / Focus | `184:222` | 2: Planned, None |
| Record / Composer | `185:151` | 2: Rest, Writing |
| Record / History day | `185:152` | One component |
| Record / History item | `185:218` | 6: Note, Activity, Email, File, Change, Decision |
| Record / File row | `185:242` | 2: Linked, Unavailable |

**Review board** `187:148`

| Card | Node | Holds |
|---|---|---|
| Page header | `187:149` | Status, owner, date, Dean's request, sources, contents |
| 1 · Anatomy of a record page | `187:157` | A synthetic lead at 1312 px with eight numbered parts, and the snapshot drawer named but not drawn |
| 2 · Header and bars | `193:310` | Toolbars by state, drawn as layouts; readiness and key-dates bars; four state banners; rules |
| 3 · Details column | `194:459` | Sections, facts in words, the folded strip; rules |
| 4 · View tabs | `194:586` | Lead, deal and quotation tab rows; More when the tabs don't fit; rules |
| 5 · Next activity and composer | `195:568` | Next activity planned and none; the composer at rest and writing; rules |
| 6 · History and files | `195:667` | History by day with filter counts and six kinds of entry; file rows; rules |
| 7 · Editing a record | `196:719` | A section edited in the 480 px drawer; a correction with a required reason; rules. Since the [Phone page](library-phone.md) was drawn, both drawers are placed Controls / Drawer parts |
| 8 · States on a record | `197:826` | Loading with placeholders, can't be shown, a part not refreshed, outcome unknown; rules |
| 9 · Tablet and phone | `198:899` | The tablet with the folded column; a 390 px phone record in Touch size; rules |
| 10 · Do and Don't | `199:980` | Three pairs: header actions, values nobody has yet, History |
| 11 · Values, sources and confirmed items | `200:1039` | The table in section 5, the items in section 6, where the page is used, what is not here, change log |

The Read me page and the Foundations board were updated:
- **Read me:** the page index, rules 2 and 4, the variable and component lists, the confirmed items and the next steps.
- **Foundations:** the drawer and record rows in the layout table.

## 4. Rules drawn

- **One header, then one bar.** Every record page opens with the shell's record header (R116), then the page's own bar.
  - Where a decision has checks, the bar is the readiness checks, in words with gaps in amber; it is advisory and never a gate the server lacks (lead R3; deal R4).
  - Where there is no gate, it is the key dates (project R3).
  - A state banner says what happened, when, who and why, and offers one way on to people allowed to take it (lead R4).
- **Header actions** (drawn as layouts):
  - one primary action chosen by state, disabled with the reason or "Read only" with its date (R117);
  - a labelled Actions menu (R118);
  - Outputs only where outputs exist (R119);
  - "n of N in view" with previous and next (R120).
- **Details column.** 380 px on the left, scrolling on its own, in sections that open and close per person.
  - Labels are 130 px and values wrap; nothing is cut off.
  - A value nobody knows yet says so with the reason. A value that could not be read is a dash with a note, never zero. A derived value is marked Worked out.
  - Edit belongs to a section. Viewers who may not edit see no Edit.
- **Folded column.** On tablets and wide pages such as a Gantt, the column folds to a 44 px labelled strip that opens over the content (project R4; deal Q7).
- **View tabs.** At the top of the main column, never in a secondary menu (work order R2).
  - Overview comes first and is the default, and History last; the tabs between come from the record's own decision (deal R2, Q6; quotation D4).
  - A state-led first tab is kept in the link (quotation Q3).
  - Counts are neutral; attention is in words.
  - Tabs that don't fit go under More; the selected tab stays visible (estimate D14).
- **Next activity and composer.** The next step shows on every tab, or a prompt to plan one (lead R7).
  - Mark as done asks for the outcome (lead R6).
  - Note is written in place. Activity, Email and File open in the 480 px drawer.
  - Files are SharePoint links with version and who added them (lead R10; Sales R06).
- **History.** By day, newest first, with filter chips that count each kind (lead R8).
  - Changes are said from and to in words.
  - Entries are never edited or deleted; a reversal is a new decision (Sales R07; shell R122).
  - A file dropped on a record page goes to Files (R93).
- **Editing.** One section at a time, in the 480 px drawer without a scrim (`drawer/standard`).
  - Details other records rely on are corrected with a required reason that names the changed values and the relying records (People D6).
  - Decisions are made from the header, never as fields.
  - There is no editing in place on a record page.
- **States.** Loading keeps the real header, labels and tabs, with placeholders after about 300 ms (States S2).
  - A record that doesn't exist and one the person may not see read the same.
  - A part that couldn't be refreshed keeps its last read with its time and day (S4).
  - A save whose outcome is unknown shows the Outcome unknown banner under the header (S1).
- **Tablet and phone.** Tablets fold the column.
  - Phones use a 56 px header with back, position, previous and next and More (P3), with the title in the content.
  - Sections become 48 px links, and Actions and the primary action sit in a 48 px sticky bar (R124).
  - Phones use the Touch size.

## 5. Values and sources

| Part | Value | Source |
|---|---|---|
| Record header | Shell / Record header · toolbar; drawn here as a layout | Shell R116 to R125 (R1, R2) |
| Page's own bar | Readiness (checks in words, gaps in amber) or key dates, under the header; advisory | Lead R3; deal R4; project R3 |
| State banner | Read only, Converted, Archived, Closed; when, who and why; one action | Lead R4 |
| Details column | 380 px (`record/details-width`) on the left; scrolls on its own; sections divided by line/soft | Lead R5; built shared record |
| Fact | 130 px label in 12 Regular text/secondary, 12 px gap, value in 13 Regular that wraps; unknown, not read and worked out in words | Built; Create forms D4, D14; States S5 |
| Folded column | 44 px strip labelled Details (`record/details-folded`) | Project R4; deal Q7 (R3) |
| View tabs | Controls / Tab at the top of the main column; Overview first, History last; More for the rest; neutral counts | Work order R2; deal R2, Q6; quotation D4, Q3 (R6) |
| Next activity | Card at the top of the main column on every tab; Mark as done asks for the outcome | Lead R6, R7; deal Q6 |
| Composer | Note in place; Activity, Email and File open in the drawer | Lead R6, R10 |
| History | By day, newest first; filter chips with counts; 28 px icon tiles; never edited | Lead R8; Sales R07; shell R122 |
| Files | SharePoint links with version, who added and when | Lead R10; Sales R06 |
| Edit drawer | 480 px (`drawer/standard`) on the right, no scrim; Forms fields and save bar | Drawer widths, 11 November 2026; shell R98; Sales A5 drew 432 px (R5) |
| Phone | 56 px header; title in the content; 48 px section links; 48 px sticky actions; Touch size | Phone header P1, P3; R124; estimate D14 (R4) |
| Snapshot drawer | 480 px overlay from the right rail; not drawn here | Shell R66, R98, R112 (R1) |

## 6. Confirmed — 11 November 2026

On 11 November 2026 Dean confirmed five items as drawn: "Confirm R1–R4 and R6". He had decided R5 earlier the same day with the drawer widths. Card 11 and the page header now say so.
- **R2** means the Estimating file's stepper by the breadcrumb (A16) and its Reports menu (A17) align with the shell rules at their next reviewed change.
- **R3** means the estimate page's 300 px tablet column and the built 280 px column fold to the strip.
- **R4** means the shell's phone record header aligns with the phone header amendment at the shell move.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| R1 | Header stays with the shell | The record header and snapshot drawer are not redrawn here; they move into the library with the shell, and the cards draw them as layouts | Redrawing them would make a second master of accepted shell components |
| R2 | Shell rules for the header | Previous and next in the toolbar with "n of N in view" (R120); the outputs menu named Outputs (R119); Estimating's stepper by the breadcrumb (A16) and its Reports menu (A17) align at their next reviewed change | Both were accepted on 9 November 2026 and differ |
| R3 | Folded column on tablets | At 1024 px the details column folds to the 44 px strip and opens over the content | The project and deal pages fold it (R4, Q7); the estimate page keeps 300 px (D14); the built page uses 280 px |
| R4 | Phone title in the content | Below 768 px the title and state sit in the content under the 56 px header | The phone header amendment moves them into the content (P3); the shell's phone record header keeps a shortened title |
| R5 | Edit drawer width | Editing a section opens the 480 px drawer (`drawer/standard`) | Sales A5 drew 432 px. On 11 November 2026 Dean set right-hand drawers at 360, 480, 640 and 800 px by content, with editing a section at 480 ([drawer widths](library-drawer-widths.md)) |
| R6 | Default tab | Overview opens by default unless a record's own decision sets a first tab by state; the selected tab is kept in the link | Deal Q6 always opens Overview; quotation Q3 chooses the first tab by state |

## 7. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Shell components.** The record header and the snapshot drawer stay in the shell file until the shell move, which needs Dean's desktop copy.
- **Module files unchanged.** The accepted record pages keep their local parts and widths. They switch to these parts after acceptance and publishing; the built record pages change only through reviewed application work.
- **Not here.**
  - A module's own bars, such as the deal stage bar.
  - Related-record tables (Grid page).
  - Outputs and printing (DK-03).
  - Quick add from a register (Forms page, the 640 px drawer).
- **No proof beyond the design.** No prototype links were set on the Record parts. Keyboard behaviour in the tabs, focus after saving in the drawer, announcements and touch sizes need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The new variables have no CSS property yet.
- **Next in the recommended order.** Phone patterns, drawn on 11 November 2026 ([Phone record](library-phone.md)), then the shell and page template.

## 8. Checks

- **Rendered and inspected.** The components section and every card of the review board.
- **Defects fixed while drawing:**
  - component variants stacked on one another;
  - state-banner action buttons hidden on every variant by the shared option's default;
  - composer tabs touching;
  - a header toolbar row made too tall by an empty spacer;
  - number badges over content on card 1;
  - a tablet drawing whose scaling detached its text styles, redrawn at its width;
  - phone previous and next icons that were hard to tell apart;
  - a Do and Don't caption that named the wrong icon;
  - the new icons sitting outside the Icons section.
- **Structural read.** The Record page has 1,985 nodes and 394 instances. Outside instances, it found:
  - no solid fill or stroke without a variable;
  - no text without a text style;
  - no shadow without an effect style;
  - no plain corner radius;
  - no component without a status line.

  Fourteen layers with default names were renamed.
- **Variables read back from the file:** 66 in "PPO colour", 39 in "PPO layout", 11 in "Gantt colour", 3 in "Grid density" and 5 in "Control size" (124). The record and drawer variables read 380, 44, 360, 480, 640 and 800.
- **Read me and Foundations.** The Read me texts and the Foundations layout table were rendered after their update.
- **Tool-call limit.** The Figma connection's tool-call limit (200 a day on a Professional Full seat, freed over a rolling day) refused several calls during the drawing. None of those calls changed the file; each was sent again once capacity returned.
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
