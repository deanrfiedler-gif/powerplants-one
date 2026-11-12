---
document_id: PPO-LIBRARY-RECORD-PROP
date: 2026-11-11
owner: Dean Fiedler
status: Proposed design drawn in the private Figma file "PPO - Library" on 11 November 2026 at Dean's request; the six items in section 6 were confirmed or decided by Dean on 11 November 2026; two parts were added on 12 November 2026 under audit direction B7, and their five items in section 7 were confirmed by him that day; every component is Status Proposed until Dean accepts the page; nothing published from the library; no application code, route, migration, permission or deployment; every record shown is synthetic
versioning: git
---

# Record · Details, tabs and history in PPO - Library — proposal

**Owner:** Dean Fiedler · **Date:** 11 November 2026 · **Status:** Proposed. The items in [section 6](#6-confirmed--11-november-2026) were confirmed by Dean on 11 November 2026. The five items in [section 7](#7-confirmed--12-november-2026), added on 12 November 2026, were confirmed by Dean that day. The page itself awaits acceptance.

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
| Reused components | <ul><li>Controls / Button, Icon button, Link, Chip, Filter chip, Tab, Menu item, Tooltip, Banner and Field</li><li>Form / Save bar</li><li>State / Placeholder, Inline notice, Outcome banner and Message panel</li><li>Existing icons: Calendar, Edit, Saved, Attention, Locked, Info, Blocked, Close, More, arrows and chevrons</li></ul>New in the library, all `Status: Proposed`: the Record parts in section 3 and five icons, and the four parts in section 7 |
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
| Record / Fact | `182:71` | 5: Value, Link, Unknown, Not read, Worked out. Option: Changed, added 12 November 2026 (section 7) |
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

Four parts were added on 12 November 2026; section 7 lists them.

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
| 10 · Worked-out values and what changed | `292:1223` | Added 12 November 2026 (section 7): a fact opening its working; a missing input, a proposed rule and a withheld input; the changes strip with changed facts and the History line; rules |
| 11 · Do and Don't (card 10 until 12 November 2026) | `199:980` | Three pairs: header actions, values nobody has yet, History |
| 12 · Values, sources and confirmed items (card 11 until 12 November 2026) | `200:1039` | The table in section 5, the items in sections 6 and 7, where the page is used, what is not here, change log |

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
| Working (new, 12 November 2026) | Record / Working: a 360 px popover (`drawer/narrow`) beside the fact, a bottom sheet on a phone; result in 20 Medium; rule; inputs with source and time read; Complete, Incomplete, Proposed | Audit B7; fertigation trace; States S4, S5 (R7, R8) |
| Changes strip (new, 12 November 2026) | Record / Changes strip: a 40 px bar on surface/navy-tint under the record header; an 8 px link-blue marker; count and time in words; up to five changes; Mark as seen | Audit B7; Account development D16; shell R10, R34 (R9 to R11) |
| History marker (new, 12 November 2026) | Record / History marker: a line above the entries new since the last visit; shown with the strip | Audit B7 (R11) |
| Fact, Changed (new, 12 November 2026) | An Info chip "Changed" beside the value; shown with the strip | Audit B7 (R11) |

## 6. Confirmed — 11 November 2026

On 11 November 2026 Dean confirmed five items as drawn: "Confirm R1–R4 and R6". He had decided R5 earlier the same day with the drawer widths. Card 11 (card 12 since 12 November 2026) and the page header now say so.
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

## 7. Confirmed — 12 November 2026

The [library audit](library-audit.md) direction B7, agreed by Dean on 11 November 2026, reads: draw "How this was worked out" and "Changed since you last looked" as Proposed parts on the Record page; AI features come later, each after a rules-based version. On 12 November 2026 Dean said: "I confirm that you can proceed however you believe is the most professional." Both parts were drawn that day, rules-based, with no AI. That go-ahead covered the drawing; it did not confirm the five items below. Later that day Claude listed them with a recommendation to confirm each as drawn, and Dean answered: "Proceed based on your recommendations." All five are confirmed.

**Sources.** No accepted decision sets either part. These were used:

| Source | Status of source | Use |
|---|---|---|
| [Fertigation workbench refinement](fertigation-workbench-refinement.md) and the built `src/components/fertigation-trace.tsx` | Direction given by Dean, 23 September 2026; the trace is built | A calculation trace in a drawer, titled "How this is calculated", with the result, the rule, the inputs and the line that it "restates how it was formed and never recalculates it" |
| [States](library-states.md) S4 and S5 | Confirmed, 11 November 2026 | A value that could not be read is a dash, never zero; a last read carries its time and day |
| [Account development](account-development-figma-design.md) D16 | Owner-accepted | "Since the last visit": a dated list of changes across permitted sources; restricted sources are left out rather than counted as nothing |
| [Shell rules](../design/development/systems/shell-refined-concept-rules.md) R10 and R34 | Owner-accepted | Unread carries a dot; a zero shows no badge |
| [Sales refined file](sales-module-refined-ui-proposal.md) N1 "Catch me up" | Owner-accepted, 9 November 2026 | The later AI summary, under the view tabs. The strip drawn here is the rules-based version and sits under the record header |
| Sales R07 and shell R122 | Owner-accepted | History is never edited; so what a person has seen is their own state and never an entry in History |
| Built application | Repository; built | Notifications hold a read flag per person and conversations a last-read position. No record holds a per-person "last opened" time |
| AGENTS.md | Repository guidance | A proposed calculation is never presented as a verified operating rule; no CREMS formula is reconstructed |

**Parts drawn** (all `Status: Proposed`, in section `182:41`)

| Component | Node | Variants and options |
|---|---|---|
| Record / Working input | `289:1177` | 3: Known, Missing, Not read. Options: Label, Value, Source |
| Record / Working | `289:1380` | 3: Complete, Incomplete, Proposed. Options: Fact name, Show withheld note. 360 px wide (`drawer/narrow`) |
| Record / Changes strip | `289:1499` | 2: Collapsed, Expanded. Options: Summary, Since |
| Record / History marker | `289:1644` | One component. Option: Label |
| Record / Fact | `182:71` | New option: Changed (a "Changed" chip beside the value) |

Card 10, "Worked-out values and what changed" `292:1223`, shows them in three steps with eight rules. The former cards 10 and 11 are now 11 and 12.

**Rules drawn**

- **How this was worked out.** The Worked out marker on a fact is a button. It opens a panel with:
  - the result;
  - the rule as one sentence;
  - each input with its value, where it came from and when it was read;
  - what is missing, in words.
- **Never worked out again.** The panel restates how the stored value was formed. Nothing is recalculated in the browser, and a recorded result is never worked out again.
- **Three states.**
  - Complete: every input is known.
  - Incomplete: an input is missing, so there is no result and the panel says what is needed.
  - Proposed: the rule is not an adopted business rule. The result carries "Proposed calculation" and a line saying not to rely on it for a decision.
- **Inputs.** A missing input reads "Not known yet" with the reason. An input that could not be read is a dash with a note, never zero (States S5). Amounts are A$ excluding GST.
- **Changed since you last looked.** Under the record header, a strip says how many changes someone else made since the person last opened the record, and since when. Expanded, it lists up to five, from and to in words, then links to History.
- **With the strip.** Each changed fact carries a Changed chip, and History draws a line above the entries that are new.
- **Quiet.** No strip on a first visit, when nothing changed, or after Mark as seen. There is never a "0 changes".
- **The person's own.** What a person has seen belongs to them. Mark as seen changes nothing on the record and adds nothing to History.
- **Nothing leaks.** An input or a change the person may not see is left out and never counted. If a result alone would reveal a withheld input, the value is not shown.
- **Words, not colour.** The marker is link blue, as unread markers are in the shell, and always sits with a count or the word Changed.
- **Not a notification.** My Work Updates stays the inbox. The strip marks no update read and is never the only signal for something that needs action.

**Items confirmed.** Each stands as drawn.

| ID | Item | Confirmed as drawn | Why it needed a decision |
|---|---|---|---|
| R7 | Name and how it opens | The panel is called "How this was worked out". It opens from the Worked out marker on a fact: a 360 px popover on a desktop, a bottom sheet on a phone | The fact's marker already says "Worked out"; the built fertigation trace is titled "How this is calculated" and opens in a drawer. It would align at its next reviewed change |
| R8 | What an explanation shows | The result, the rule as a sentence, each input with its source and when it was read, and what is missing. It never works the value out again; a proposed rule is labelled; withheld inputs are left out and the panel says so | No shared rule exists. Saying that inputs are withheld tells the person something exists; the alternative is to hide the whole value from them |
| R9 | What counts as a change | Changes to the record's facts and state that someone else made and the person may see. Notes, emails and files are not counted in the strip; they sit under the line in History | Counting every new entry would let a busy thread swamp the strip; counting only fact and state changes keeps it to what is now different about the record |
| R10 | When "last opened" moves | Kept per person and per record. The strip stays for the visit; leaving the record, or Mark as seen, moves the time on. No strip on a first visit | The application stores no such time today. Building it needs its own decision, a migration and tests; this record authorises none of them |
| R11 | Where it shows | A strip under the record header, a Changed chip on each changed fact and a line in History. Not in registers or boards, and not a notification | A "changed" marker in registers and on board cards is a larger change to accepted pages and to My Work |

**Limits.**
- The phone forms (the bottom sheet and a one-line strip) are stated as rules and not drawn.
- The three example rules (age in days, and margin as a share of the quoted value) are synthetic illustrations. They are not adopted business rules, and none is a CREMS formula.
- Nothing was wired for a prototype, and the three flows on the [Play page](library-play.md) do not include these parts.

## 8. Not done and open

- **Page acceptance and publishing.** As for the other library pages: the components stay `Status: Proposed` until Dean accepts the page, and the library is not published.
- **Shell components.** The record header and the snapshot drawer stay in the shell file until the shell move, which needs Dean's desktop copy.
- **Module files unchanged.** The accepted record pages keep their local parts and widths. They switch to these parts after acceptance and publishing; the built record pages change only through reviewed application work.
- **Not here.**
  - A module's own bars, such as the deal stage bar.
  - Related-record tables (Grid page).
  - Outputs and printing (DK-03).
  - Quick add from a register (Forms page, the 640 px drawer).
- **No proof beyond the design.** No prototype links were set on the Record parts; the [Play page](library-play.md) plays editing and saving a section from copies of the review examples. Keyboard behaviour in the tabs, focus after saving in the drawer, announcements and touch sizes need the browser proof once code exists.
- **Code.** No application code, component binding, register or page guide changed. The new variables have no CSS property yet.
- **Next in the recommended order.** Phone patterns, drawn on 11 November 2026 ([Phone record](library-phone.md)), then the shell and page template.

## 9. Checks

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
- **Parts added 12 November 2026.** The four new components, the Fact set and card 10 were rendered and inspected. The changed Read me texts, the card names, the items column and the component options were read back from the file. A structural read of the page (2,617 layers; outside instances) found no solid fill or stroke without a variable, no text without a text style, no default layer name and no component without a status line. The only plain corner radii are the frames Figma draws around the section and eleven component sets, which are not part of any component.
- **Repository checks for this change:** `python3 scripts/build_status.py --check`, `python3 scripts/check_naming.py`, `python3 scripts/check_foundation.py` and `python3 scripts/check_design_tokens.py`.
