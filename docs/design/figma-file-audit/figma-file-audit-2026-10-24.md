---
document_id: PPO-FIGMA-FILE-AUDIT-2026-10-24
title: Figma design file audit, stage 1 (read-only)
date: 2026-10-24
owner: Dean Fiedler
status: Stage 1 findings; Dean adopted the recommended answers to R1–R11 on 24 October 2026; stage 2 in progress (section 12)
versioning: git
---

# Figma design file audit, stage 1 (read-only)

Dean asked on 24 October 2026 for an audit of the private "PPO - Design" Figma file against seven questions, and then: "Proceed with the read-only Figma audit (stage 1) using your recommended approach." This record holds the stage 1 findings. Stage 2, the clean-up, starts only on Dean's answers to the decisions in [section 9](#9-decisions-for-dean).

The design file stays a proposal surface under [ADR-0053](../../decisions/ADR-0053-figma-page-design.md) and [ADR-0055](../../decisions/ADR-0055-figma-file-structure.md); Git remains the authority. This audit reports design-file state only. It grants no acceptance, records no visual review and changes no build or deployment status.

## 1. Method and coverage

- **Read, not changed.** 23 read-only plugin scripts ran on the evening of 24 October 2026. No node, name, variable, style or version in the file was changed. The Figma seat's call limit refused 14 further calls; a refused call changes nothing.
- **Pages.** All 172 pages were listed. 15 are department dividers. Of the other 157, the 150 design pages were each loaded and measured; Start here, Components, Template · App page, Captures (icon-free) and the three Archive pages were inspected for structure only.
- **What each page was measured for:** sections and loose top-level nodes; screen frames by width (1440, 1024, 390, 320); the top bar and phone header (linked instance or detached copy) and the Conversations action; text style use and font families; solid fills bound to a PPO variable, unbound but equal to a token value, or off the palette; main components held on the page; prototype flow starting points; the page header's scope, status, decision record and named version; record numbers by namespace.
- **Repository cross-checks** against `main` at `a06f3d41`: the 152 scope entries in `docs/design/development/register.json`, the decision records the page headers cite, open pull requests, and the File index on Start here (`630:2`).
- **Heuristics, not proof.** The counts are machine counts. "Off-palette" compares a fill with the core, shell and part of the proposal colour variables, so a few counted values are proposal variables used unbound (for example `#e9f1fa`, `proposal/cpq-info-surface`). Black fills may be scrims or zero-opacity hit areas. No frame was inspected visually, and no screenshot was taken.

The per-page measurements are in [Appendix A](#appendix-a-per-page-measurements).

## 2. Summary

The file is in better shape than its growth suggests. 172 pages hold about 2,840 screen frames; 89.6% of solid fills are bound to PPO variables, every page uses Roboto and the PPO text styles, no page shows an operational `PPO-` record number, and the File index lists every accepted page. The problems are concentrated, and most can be fixed by script once decided:

1. **The shell is copied, not shared.** 1,346 top bars and phone headers are detached copies, against 631 linked instances, because the accepted top-bar amendment (16 Oct) and the Conversations action (17–18 Oct) were never merged into `Shell / Top bar` `35:138` (decision D5 of [the Components page decision](../../decisions/figma-components-page.md) is still open). Any future shell change has to be hand-applied to every copy.
2. **Three page headers are wrong.** Receiving · SC-04 carries the Workshop builds CX-02 header and claims acceptance; Cash outlook · FN-05 and Bulletins & lifecycle · EQ-06 · EQ-07 carry the unfilled template header.
3. **The lock-in backlog is large.** Six accepted designs wait for their decision record or named version (pull requests #671, #676, #677, #678, #685 and #687), and 28 accepted pages still hold 107 main components that the Components rule says move to Components at acceptance.
4. **27 page names have no scope ID,** all on pages that repository records cite by name, so they cannot be renamed without a decision (section 3).
5. **Controls are missing from the library.** Components holds Button, Tag, Toolbar search and Call / Control only, so pages draw their own form fields, switches, choice options and metric tiles; 79 proposal pages hold 372 local components, many of them near-duplicates (section 5).
6. **Ten scope IDs have no design** (section 8), and Customer 360 (proposal) `554:2` overlaps the accepted Organisations · CS-01 page.

## 3. Question 1: scope IDs in page names

ADR-0055 rule 3 names new pages "[Page name] · [scope ID]". 123 of the 150 design pages comply. The 27 that do not:

| Group | Pages without a scope ID | Scope the page covers (from its header or File index row) |
|---|---|---|
| System | UX benchmark exemplars `986:47`, Shell top bar amendment `1035:48`, Phone header amendment `1530:70` | None by design: cross-module and shell pages. No change proposed. |
| My Work | My Work (accepted) `404:2` | SH-01 · SH-02 |
| My Work | Conversations `1141:49` | **No scope ID exists.** The header says AI1–AI4 are slice labels, not scope IDs. |
| Sales | Leads (accepted) `190:20237`, Lead record page (accepted) `224:2` | **No scope ID exists** for leads in the register (route keys only). |
| Sales | Customer 360 (proposal) `554:2` | CS-01 (see section 7, conflict C4) |
| Estimating | Intake & workload (accepted) `128:8845` | ES-01 |
| Estimating | Sales briefs (accepted) `152:1122` | CR-02 |
| Estimating | Estimation Wizard (accepted) `383:2` | ES-02 |
| Estimating | Excel estimate import `711:38` | Register key `excel-import` (no scope ID) |
| Estimating | CPQ · 1 to CPQ · 6 (accepted) `464:2`–`464:7` | ES-02 · ES-03 (the File index cites EST-02 to EST-07) |
| Estimating | Cost sources (accepted) `133:2366` | ES-03 |
| Estimating | Quotations (accepted) `123:40` | ES-05 · ES-06 · ES-07 |
| Estimating | Reviews & approvals (accepted) `56:2` | ES-04 · ES-05 |
| Engineering | Engineering workload (accepted) `184:1047` | EN-01 |
| Projects | Projects (accepted) `209:46`, Project record page (accepted) `345:2` | PJ-02 |
| Service | Work orders (accepted) `193:18953`, Work order record page (accepted) `312:2` | SV-03 |
| Service | Job pack (accepted) `272:2` | SV-05 |

Two more pages carry the ID in a non-standard position or with a stale suffix: **ES-02 Priva Fertigation Workbench (accepted)** `408:4` (ID first) and **ES-08 · Screen Configurator Workbench** `406:2` (ID first), and **Products · PD-01 · discovery proposal** `653:38`, whose suffix says proposal although the page and its record are accepted.

**Constraint.** Every one of these names is cited by at least one repository record (1 to 27 files each; `Conversations` and `Screens` are also ordinary words). ADR-0055 rule 2 and the File index say a cited page name does not change. Renaming therefore needs a decision that allows it together with an update to the citing records, or an alias column in the File index. See decision R1.

The "(accepted)" and "(proposal)" suffixes on 21 older names also duplicate the status the File index now carries, and the suffix goes stale (Customer 360 and Products show this).

## 4. Question 2: style, theme and format

**Variables and styles.**

- Four variable collections: PPO colour (78 variables, one mode named "My Work"), PPO layout (18), Prototype (17 booleans and one string) and Deals · r37 reference (14).
- 29 local text styles, all Roboto or Roboto Mono. There are no paint styles and no effect styles.
- PPO colour holds 27 `proposal/*` variables, several used by accepted pages: `proposal/row-selected`, `proposal/menu-selected`, the rail text and badge colours, the Gantt and planner colours and the annotation colours. The `proposal/` prefix no longer says what they are.
- Small text styles: `PPO/Deals/Task badge` is 8 px, `PPO/Deals/Avatar` 9 px, and `PPO/Deals/Signal` and `PPO/Section label` 10 px.
- No elevation (shadow) style exists. Shadows on drawers, dialogs and menus are hand-set on each frame.

**Colour binding.** Across the 150 design pages, 191,672 solid fills (89.6%) are bound to variables. 18,425 are unbound but equal to a token value, and 3,736 are off the palette. The off-palette fills concentrate on a few pages:

| Kind | Where | Note |
|---|---|---|
| `#000000` | Field team · PL-02 (1,075), Pipeline insights · CR-04 (585), Service planner · PL-01 (340), ES-08 (267) and about 20 other pages | Probably scrims or transparent hit areas; to confirm |
| Chart colours `#1baf7a`, `#2a78d6`, `#eb6834`, `#e8f1fb` | Pipeline insights · CR-04, Service performance · RP-04 and other reporting pages | There is no data-visualisation palette in the variables |
| `#242938` | 1 to 10 fills on about 45 pages | One step off `brand/navy` `#242a37`; a copy-paste near-miss |
| Cool greys `#f5f7fa`, `#eff4fd`, `#fafbfc`, `#6b7380`, `#333b4a`, `#0f1729`, `#111827` | Supply chain, Engineering, Shared records and Administration proposals | Not in the palette; the nearest tokens are `surface/2`, `surface/subtle` and `text/secondary` |
| Blues `#1b5ea8`, `#2563a8` | Drafting & domain help · AI-04 (28), Quotations & account · CP-06 (46) | Not in the palette; `text/link` is `#355b80` |

The unbound token-value fills are largest on Service performance · RP-04 (1,166), Delivery performance · RP-03 (1,087), Pipeline insights · CR-04 (1,022), Answer evidence · AI-03 (838), Quotations & account · CP-06 (827) and Product compatibility · PD-04 (786). They look right today but do not follow a token change.

**Text.** 18% of the 107,733 text layers drawn on pages (not inside instances) have no text style. The largest counts are ES-02 Priva Fertigation Workbench (1,640 of 1,873), Delivery performance · RP-03 (809), Quotations & account · CP-06 (786), CPQ · 2 (730), Materials & substitutions · EN-06 (687), Automation Configurator (651), CPQ · 3 (626) and Drawings · EN-03 (597). Two text layers on Drafting & domain help · AI-04 use Inter; every other text is Roboto or Roboto Mono.

**Layout format (ADR-0055 rule 4, template sections).**

- 141 design pages use the template sections.
- Not on the template: Customer 360 (proposal), CPQ · 1–6, ES-08 and Quotations (accepted). ADR-0055 lets existing pages keep their layout, so this is not a defect, but these nine pages have no conformance header.
- Six pages have a header under a variant name ("Page header · Products …", "Page header · Product pricing", "Page header · Product compatibility", "Page header · Excel estimate …", "Page header · Inventory", "Page header · Document library"), which a reader or a script looking for "Page header" misses.
- **Missing breakpoints:**
  - No Tablet 1024 frame on 26 pages, mostly the pages accepted on 11–12 October and the CPQ and ES-08 sets. Voice capture · AI-05, Calling and Quotation page & customer views are the newer exceptions.
  - No Phone 320 frame on 23 pages: the older accepted pages, CPQ, ES-08 and Customer 360.
  - The five CPQ desktop pages have no phone frames of their own; CPQ · 6 holds them.
- **Pages over the ADR-0055 rule 9 size of about 30 frames:** My jobs · FI-01 (45 screens), Quotations (37), Estimation Wizard (34) and My account and preferences (33, a proposal). ADR-0055 does not split existing modules, so only the My account proposal could still be split before acceptance.

**Theme of the shell.**

- **Desktop frames.** Of 2,840 screen frames, those drawn before the Conversations decision of 17–18 October (My Work, Leads, Lead record, Deal record, Intake, Sales briefs, Wizard, Fertigation, Cost sources, Quotations, Reviews, Engineering workload, Projects, Project record, Work orders, Work order record, Job pack, PJ-05, the DK pages, CPQ, ES-08 and My jobs) show the top bar without the Conversations action. That is history, because those pages were accepted before the rule. Even so, the file shows two shells.
- **Phone frames.** Most phone frames without a Conversations layer are records, which the [phone header amendment](../../decisions/phone-header-amendment.md) P3 note covers: Conversations sits in the record's More menu. List and calendar phone frames should carry it in the row (P2). These proposal pages have list-type phone frames with no Conversations layer, and each needs a visual check:
  - Site readiness · FI-05 (19 frames)
  - Catalogue import · PD-05 (5)
  - Material demand · SC-01 (4)
  - the Engineering registers (4 to 5 each)

## 5. Question 3: shared components to add

**Component holdings.**

- Components `1:4` holds 470 main components in 16 sections. 240 are icons.
- CPQ · 2 holds 23 CPQ components, as decision D2 intends.
- Design pages hold another 504 main components on 94 pages:
  - 372 sit on 79 proposal pages. They stay there until acceptance, under the rule of the [Components page decision](../../decisions/figma-components-page.md).
  - 107 sit on 28 accepted pages that should already have moved them (see section 7, C6).

**Recommended additions.**

| # | Proposed shared component | Replaces or unifies (examples, with page) | Why |
|---|---|---|---|
| S1 | **Shell / Top bar** with the accepted amendment and the Conversations action, and **Shell / Phone header · compact** with the P2 Conversations slot | 1,346 detached copies; `Shell / Top bar (proposed, centred search)` and `Shell / Breadcrumb (proposed)` on `1035:48`; `Shell / Top bar action · Conversations` on `1141:49` | Turns the largest maintenance risk into one component (D5) |
| S2 | **Controls / Form field** (input, select, textarea, date; label, help, error, required and optional) | Deals/Form field, Basis / Form field, Maintenance / Form field, AI-07 / Form field, Job pack / Form field, Response / Input, Planner / Input | Controls has no input of any kind |
| S3 | **Controls / Switch** and **Controls / Choice option** (radio and checkbox row) | Account / Switch, Send / Switch, Deals/Checkbox option, Warranty / Choice option, Support / Choice, AI-06 / Option row | Six local versions |
| S4 | **Grid / Group band** | Register / Group band, Change review / Group band, Authoring / Group band, PD-04 / Group band, Stakeholder group band | Your grid band rule: the band spans the checkbox and settings columns in the group's own colour |
| S5 | **Grid / Phone list row** (title, meta and tag slots) | About 25 "… list row (phone)" and "… card (phone)" parts | Same anatomy everywhere |
| S6 | **Metric / Tile** with the report table set (**Report / Cell, Header cell, Section header, Legend item**) | Sales report / Tile, Trust report / Tile, Service report / Rate tile and Withheld tile, Insights / KPI tile, CS-01 / Summary tile, Fertigation / Metric tile; the Sales report and Trust report cell sets are duplicates | RP-01 to RP-06 and Pipeline insights all need them |
| S7 | **Stepper** (stage step) | Aftercare / Stage step, Project / Stage step, Wizard / Step, Quotation detail / Lifecycle step | One lifecycle pattern |
| S8 | **Assistant / Provenance** set (source line, provenance tag and banner, evidence card) | Evidence / Source card, Drafting / Provenance banner, Drafting / Source line, AI-02 / Provenance tag | AI-02 to AI-07 share one evidence model |
| S9 | **Record / Banner** variants for hold, notice and evidence | Evidence / Notice, Response / Hold banner, Quote page / Notice | Record / Banner exists; add its variants rather than new parts |
| S10 | **Customer portal shell** (logo, header, nav bar, phone tab bar) | 20 local parts on CP-01 and the per-page Portal / Nav bar and Tab bar variants on CP-04 and CP-06 | Six portal pages, one shell |
| S11 | **Rail** with a department property (adding My Work, Estimating, Shared records, Administration and Reporting) | Rail · Estimating with Outcomes, Rail · Projects with Subcontracts, Rail · Supply chain with Service stock and Rail · Reports on their pages, and six "Rail · … (proposal)" mains | Rail variants are multiplying page by page |
| S12 | Icons drawn on pages | Icon/microphone, microphone-slash, stop, waveform-lines, wifi-slash, hourglass-end, steering-wheel (AI-05); Icon/solid/pen-ruler (EN-03); Icon/solid/scale-balanced (FN-06) | Icons belong in Components · Icons (Font Awesome Kit rules unchanged) |
| S13 | **Grid / Register header** and **Grid / Register row** with column slots | About 60 module "… grid header" and "… grid row" pairs | Larger change; candidate only, see R6 |

## 6. Question 4: superseded or unneeded pages and content

Nothing should be deleted outright: node IDs are cited across the repository. The recommendation is to move to "— Archive —" and record it in the File index.

| Item | Recommendation |
|---|---|
| Customer 360 (proposal) `554:2`. Drawn 13–14 Oct, record "Proposed; owner review pending"; `/customers` and CS-01 were since accepted on Organisations · CS-01 `1443:2615` (18 Oct). | Archive as superseded, unless Dean wants the 360 overview kept as a future CS-01 amendment (R4) |
| Section "Superseded · first draft" inside Products · PD-01 `653:38` | Move the section to an Archive page |
| Shell top bar amendment `1035:48` and Phone header amendment `1530:70` | Archive once S1 merges them into Components (the pages stay as evidence) |
| Shell `31:214`, Screens `1:5` and Shell v2 (proposal) `73:4` | Already in Archive; keep (cited) |
| Working frames: "Shell master (delete before …)" on Report definitions · RP-06; "FN-05 shell base (working)" and 11 loose frames outside the sections on Cash outlook · FN-05; two empty "Frame" nodes on Product publication · PD-02; two loose text layers on Drafting & domain help · AI-04 | Delete or move into the page's sections (safe: nothing cites them). RP-06 may still be in progress in another session, so check first. |
| Deals · r37 reference variable collection (14) and `PPO/Deals/*` text styles (8) | Decide with the Deals lock-in (R8). Deals was accepted on 24 Oct, and decision D4 ties the r37 icons to that moment. |

## 7. Question 5: conflicts

| # | Conflict | Evidence | Recommended fix |
|---|---|---|---|
| C1 | **Receiving · SC-04 `2089:535413` has the wrong page header.** The header is Workshop builds CX-02's, with "Accepted 19 Oct 2026" and its decision record and named version. | Page header texts read "CX-02 Workshop assembly …" and "Accepted 19 Oct 2026" | Rewrite the header as the SC-04 proposal (high priority: it misstates acceptance) |
| C2 | **Unfilled template headers** on Cash outlook · FN-05 `2097:681762` and Bulletins & lifecycle · EQ-06 · EQ-07 `2280:85`; the decision record and named version fields on Quotations & account · CP-06 `2281:149` | Fields read "[Scope ID] · [route] …" and "Proposal · Accepted (named version saved) · Superseded" | Fill them from the pages' notes |
| C3 | **Products · PD-01 · discovery proposal `653:38`** is accepted, but its name says proposal; its flows include "Leads — desktop (proposal)" and "Projects — phone (proposal)" copied from other pages | File index row "Accepted"; flow list | Correct the flows now; rename under R1 |
| C4 | **Customer 360 (proposal) `554:2` and Organisations · CS-01 `1443:2615`** both claim `/customers` and CS-01 | Page frames and File index rows | R4 |
| C5 | **Shell inconsistency.** Accepted amendment parts were never merged (D5 open); detached copies differ in when they were taken (with or without Conversations, old or new breadcrumb) | 1,346 detached copies; older accepted pages show the shell before Conversations | S1 and R2 |
| C6 | **Accepted pages still hold their components.** 28 accepted pages hold 107 main components (for example Emails · EC-01 7, Field team · PL-02 9, Service planner · PL-01 8, Users and access · AD-01 8, Settings · AD-02 6, Portal home & access · CP-01 20) | Components rule D1: parts move to Components at acceptance | Move them by reparenting (keeps node IDs and instances), as on 17 Oct |
| C7 | **Accepted, but the lock-in is incomplete.** Assistant AI-01 (#687), Automation Configurator (#671), Quotation detail (#677) and Portal home & access CP-01 (#678) have no record on `main` and no named version. Calling (#676) has its named version saved; its record is in the ready pull request. Deals (#685) is ready. Organisations · CS-01 and Field team · PL-02 headers say the named version is not saved yet. | Page headers; open pull requests | Finish these lock-ins before new drawing (R3) |
| C8 | **The File index says "Every page in this file" but lists 81 of 157 pages** (accepted and reference pages only; rule 6 adds rows at acceptance) | File index `630:2` | Change the subtitle, or add proposal rows (R5) |
| C9 | **Stale and duplicate flow starting points.** Calling: six flows all named "My Work — desktop" and two "My Work — phone". Phone header amendment: "PL-04 — phone" twice. Quotations & account · CP-06: 27 starting points. CPQ, Quotations, Products: "Flow 1", "Flow 2", "Flow 3". About 20 accepted pages still name their flows "… (proposal)". | Flow lists | Rename and deduplicate (low risk; accepted pages only at a lock-in pass) |
| C10 | **Near-miss colour.** `#242938` is used for `brand/navy` `#242a37` on about 45 pages | Fill scan | Rebind to `brand/navy` |
| C11 | **ADR-0055 lists seven department groups.** The file now has Supply chain, Finance, Reporting, Shared records, Administration and Customer portal dividers too. | Page list | Record the current groups when ADR-0055's File index note is next updated (R5) |

**No conflict found:** record numbers. No page shows a bare operational `PPO-<TYPE>-` reference. Pages mix legacy `SYN-PPO-` references (existing records) with `SYN-<TYPE>-` references (new records), as the [reference namespace decision](../../decisions/readable-reference-namespaces.md) intends. Deals and Pipeline insights both carry CR-04 by design (Q7 of the Deals decision).

## 8. Question 6: gaps

**Scopes with no Figma design.** Checked against the register's 152 scope entries, with text searches of the related pages.

| Scope | Title (register) | Note |
|---|---|---|
| SH-06 | Reviews and handovers (`/work/reviews`) | Not drawn |
| CR-03 | Won-deal receiving handover | Only a link on Quotation detail |
| ES-07 | Receiving, one-off resolution and controlled conversion | Covered as a register state on Quotations; no conversion page |
| PJ-01 | Project initiation and receiving review | Not drawn |
| PJ-07 | Readiness and change-impact review | Only mentioned on Project record page |
| SC-09 | Material change-impact review | Not drawn |
| EQ-04 | Movement, replacement and retirement | Equipment · EQ-01 names EQ-02, EQ-03 and EQ-05 as parts of the record, but not EQ-04 |
| DK-07 | Page guides and contextual help (`/help`) | User guide direction accepted 23 Oct; its stages wait for a go-ahead |
| AD-08 | Retention and information lifecycle | Paused 24 Oct (Figma call limit); resume notes exist |
| AD-10 | User onboarding, learning and support | Not drawn |

CX-01 and CX-03 to CX-06 are "conditional" in the register, and Dean set the other CX modules aside on 19 Oct. They are not design gaps, but the register still lists them.

**Library gaps.** Controls holds only Button, Tag, Toolbar search and Call / Control. There is no input, select, textarea, checkbox row, radio, switch, date picker, dialog, drawer, toast, tooltip, empty state, loading skeleton or pagination component. There are no effect styles for elevation and no data-visualisation colour set.

**Coverage gaps on pages.**

- Tablet 1024 frames are missing on 26 pages and Phone 320 frames on 23 (section 4).
- The nine pages off the template have no conformance header.
- Engineering Technical queries · EN-04 has no "Scope identity" row in its header.

## 9. Decisions for Dean

Question 7 asked for improvements. Each improvement below is put as a decision with a recommended answer; "Proceed with your recommendations" adopts them all.

**Owner decision, 24 October 2026.** Dean: "Proceed with your recommendations for R1–R11 and start stage 2 with the safe fixes first." The recommended answers below are adopted as written. Adoption authorises the stage 2 work in the design file and the repository changes each answer names; it does not accept any page design.

| ID | Decision | Recommended answer |
|---|---|---|
| R1 | Page names without a scope ID (section 3) | Allow a one-time rename to "[Page name] · [scope ID]" for the 20 pages in section 3 that have a scope ID, and normalise the three non-standard names (ID first or stale suffix), dropping the "(accepted)" and "(proposal)" suffixes, in one maintenance PR that updates every citing record and keeps the old name in a File index "Former name" column. Leave Conversations, Leads, Lead record page and Excel estimate import until those scopes get IDs, and leave the three system pages as they are. |
| R2 | Merge the shell amendments into the shared components (S1, C5) | Yes. Merge the accepted top-bar amendment and the Conversations action into `Shell / Top bar` `35:138` and the phone header, then relink the detached copies on **proposal** pages by script. Leave accepted pages' frames as drawn until each page's next amendment, so no accepted design changes silently; their captures and named versions already hold the history. |
| R3 | Lock-in backlog (C7, C6) | Finish the six open lock-ins (#671, #676, #677, #678, #685, #687) and the two unsaved named versions before new drawing starts. At the same time, move the 107 components on accepted pages to Components by reparenting. |
| R4 | Customer 360 (proposal) `554:2` | Archive it as superseded by Organisations · CS-01, with a File index row "Archived 2026-10-…", and mark its record superseded. |
| R5 | File index | Change the subtitle to "Every accepted and reference page" (keeping proposals out, as now), add the Reporting group heading and record the current department groups. |
| R6 | New shared components (S2 to S12) | Build S2 to S5 now (form field, switch and choice option, group band, phone list row), then S6 to S12 as their pages are accepted. Treat S13 (a generic register row) as a later option, not now. |
| R7 | Token binding and tidy-up (section 4) | For proposal pages only:<br>• bind fills that equal a token value to the variable;<br>• rebind `#242938` to `brand/navy`;<br>• apply the matching PPO text style to unstyled text;<br>• replace the off-palette greys and blues with the nearest token.<br>Report every change by page and leave accepted pages until their next amendment. |
| R8 | Variable and style names | Rename the PPO colour mode "My Work" to "Light", and promote the `proposal/*` variables that accepted pages use to permanent names (for example `surface/row-selected`). Add a chart colour set and elevation effect styles. Raise the 8 and 9 px Deals styles to at least 11 px at the Deals lock-in, and decide the r37 icons and variables there (D4). |
| R9 | Header and working-frame fixes (C1, C2, C9; section 6) | Fix the SC-04, FN-05, EQ-06 · EQ-07 and CP-06 headers, deduplicate flows and remove the working frames. These change no design. |
| R10 | Scope gaps (section 8) | Draw EQ-04, then CR-03, ES-07 conversion and PJ-07, in that order, as separate page requests. Leave SH-06, PJ-01, SC-09 and AD-10 until their build is planned, and AD-08 and DK-07 on their existing plans. |
| R11 | Phone list Conversations slot (section 4) | Check the listed proposal list frames against P2 and add the action where it is missing, as part of R7. |

## 10. Stage 2 plan (only after Dean's answers)

1. Dean saves a named version first, for example "Before audit clean-up — 2026-10-25".
2. Make the safe fixes with no design effect (R9 and the File index wording) in one pass.
3. Merge the shell (R2), then relink the proposal pages by script, a department at a time, within the Figma call limit.
4. Do the token and text-style binding on proposal pages (R7 and R11), reporting by page.
5. Build the new components on Components (R6) and swap them into proposal pages.
6. Renames (R1) in one maintenance PR with the citing records.
7. After each step, repeat this audit's read-only measurements and compare.

Stage 2 needs roughly 60 to 100 plugin calls. At the seat's limit of about 10 calls a minute and 200 a day, shared with any drawing session, it fits in one or two days with no parallel drawing.

## 11. Limits

- The counts come from scripts, not from visual review. Hidden layers, components nested in instances, and variable-bound paints that render differently were not inspected.
- Page headers were read at their first eight fields, and status was taken from the header and the File index. A page whose header is wrong (C1) shows why the two can disagree.
- Repository state is `main` at `a06f3d41` and the open pull requests on 24 Oct 2026. Draft lock-ins may change the picture.
- Other sessions may have been drawing during the audit (RP-06 and AD-08 were active on 24 Oct), so pages changed after about 20:30 AEDT are not reflected.

## 12. Stage 2 progress

### 12.1 Safe fixes, 24 October 2026

Done in the design file under R9 and R5. No design, component or variable changed, no accepted page's frames moved, and no page was renamed. The named version recommended in section 10 step 1 had not been saved before these fixes; they are text, flow-name and layout corrections only, and Figma's autosaved history holds the prior state.

| Fix | Pages and nodes | Result |
|---|---|---|
| Page header corrected | Receiving · SC-04 (`2089:540378`) | It now reads as a draft in progress for scope:SC-04, not an accepted CX-02 page. The 23 "TMP …" frames are unedited Workshop builds copies, and the header says so. |
| Template placeholders replaced | Cash outlook · FN-05 (`2097:681763`) | Scope identity and draft status are filled in. The undeclared fields read "Not declared yet". |
| Header and notes written | Bulletins & lifecycle · EQ-06 · EQ-07 (`2280:86`, notes card `2553:86`) | Uses the header and notes text its drawing session had prepared but not run, with the status amended to say the layout pass, flows and checks are unfinished. |
| Placeholder fields | Quotations & account · CP-06 (`2281:181`, `2281:184`) | The record and named version fields read "None yet". |
| Header labels aligned with the template | Technical queries · EN-04 | "Scope identity", "Page type (r20)" and "Proposed departures" |
| Flows renamed or deduplicated | Calling (8 flows, all named "My Work — …"); Phone header amendment (2 named "PL-04 — phone"); Quotations & account · CP-06 (27 starting points named "CP-04 — …", now 4 named "CP-06 — …"); Products · PD-01 (7 to 3, dropping copied Leads and Projects names and the superseded and evidence-copy starts); Quotations (accepted) "Flow 1–3"; CPQ · 6 "Flow 1" | Each flow has a unique, descriptive name. No decision record cites any of the renamed names. |
| Empty nodes removed | Product publication · PD-02 (2 empty frames); Drafting & domain help · AI-04 (2 empty text layers) | Removed |
| Template layout pass | Quotations & account · CP-06 (91 overlapping frames); Bulletins & lifecycle · EQ-06 · EQ-07 (19 frames outside their sections) | Frames are gridded with labels (up to three desktop frames per row, phone frames side by side), two template placeholder frames are removed, and sections are fitted and restacked. Checked afterwards: no overlaps and nothing outside a section. |
| Sections fitted and restacked | Returns & claims · SC-08, Dispatch & delivery · SC-06 · SC-07, Test instruments · EQ-09, Knowledge authoring · DK-05, Warranty cases · MA-06 · MA-07 | One spill or section overlap each, now none |
| File index | Subtitle; new "Group / Reporting" (`2553:6326`) | The subtitle now says "Every accepted and reference page" and that proposals are added at acceptance. The Reporting group lists no accepted page yet. |

### 12.2 Corrections to the stage 1 findings

- **C2 and C1.** Receiving · SC-04, Cash outlook · FN-05 and Bulletins & lifecycle · EQ-06 · EQ-07 are unfinished drafts whose drawing stopped at the Figma call limit on 23 October. A wrong or empty header was a symptom; finishing those pages is page work, not audit clean-up.
- **C9.** 17 decision records cite the "… (proposal)" flow names of their pages (for example leads-design.md, quotations-design.md and service-requests-figma-design.md), and access-readiness-figma-design.md cites its "Flow 1" residue. Those flow names stay as recorded, under the same rule as page names.
- **New layout check.** Stage 1 did not measure overlaps. A read-only pass over all 150 design pages on 24 October found the cases fixed above, plus some left as they are:
  - Report definitions · RP-06: in progress in another session; its "Shell master (delete before presenting)" frame is that session's to remove.
  - Rules studio · ES-02 · ES-03: two rule-set frames loose on the page.
  - Accepted pages: Shell top bar amendment (12 overlapping annotation frames), Discovery register, Automation Configurator (lock-in in progress) and Portal home & access CP-01 (one each).
  - Pre-template layouts: Customer 360, CPQ, ES-08 and Quotations.

### 12.3 R2: Conversations action merged into the shared top bar, 25 October 2026

Dean: "Yes, save the named Figma version "Before audit clean-up — 2026-10-25" in the desktop app, then continue with R2." The named version was saved first and checked in version history.

**Correction to stage 1.** The R1–R9 top-bar amendment was already merged into `Shell / Top bar` `35:138` on 17 October ([shell top bar amendment](../../decisions/shell-top-bar-amendment.md), section 6). Its proposed components stay on the amendment page by that decision, so decision D5 is effectively closed. What was missing was the Conversations action. The [Conversations T1 scope](../../decisions/conversations-t1-scope.md) planned to add it to `Shell / Top bar` and `Shell / Phone header` "so that every accepted page changes in one reviewed step". The phone header (`Shell / Phone header · compact` `1530:110`) already carried it.

The work, in order:

1. **Captures protected.** The 30 linked top bars on Captures (icon-free) `115:2` were detached first, so issued evidence keeps its look, as the 17 October lock-in did.
2. **Component changed.** `Shell / Top bar` `35:138` gained the Conversations action, left of Page guide (Actions: Design and build workspace, Conversations, Page guide, Quick Help, Notifications). The action's component set moved from the Conversations page to Components › Shell and navigation, renamed "Shell / Top bar action · Conversations" without "(proposed)".
3. **Existing linked instances.** The other 323 linked instances now show the action, including those on accepted pages, as the T1 scope intended. On their 25 tablet-width (948 px) instances the builder icon and the shortcut hint are hidden (the 1024 px departure accepted in the T1 scope), so the same number of items shows as before.
4. **Detached copies relinked.** 937 detached top-bar copies on 70 proposal pages were replaced by linked instances carrying the same breadcrumb, initials, menu toggle, visibility, nested properties and prototype reactions. Page titles move 12 px right to the component's accepted spacing. On the 70 relinked tablet copies, the side zones hug and the search fills, with the builder icon, shortcut hint and spacer hidden, as the drawn copies did.
5. **Checks.** Screenshots of a desktop register bar, a record bar with a parent breadcrumb and a tablet bar matched the drawn copies apart from that spacing. `35:138` now has 1,252 linked instances.

**Left detached by design:**

- accepted pages (to change at their next amendment), including those whose lock-in is still open
- the unfinished drafts Receiving · SC-04, Cash outlook · FN-05 and Report definitions · RP-06
- the 329 capture copies

**Repository work not done here.** The T1c-2 lock-in also asks for icon-free captures of the accepted T1 frames, and the application change belongs to the T1c-2 pull request. Both remain with that work.

### 12.4 R7: tokens and text styles on proposal pages, 25 October 2026

Dean: "Proceed with R7: bind token-valued fills, fix the near-miss navy, apply text styles and replace off-palette colours on proposal pages, reporting by page."

**Scope.** 75 proposal pages. Accepted pages, the unfinished SC-04, FN-05 and RP-06 drafts, Customer 360 (R4) and the UX benchmark exemplars were not touched. Only solid fills drawn on the page were changed; instance sublayers follow their components.

**Rules applied:**

1. **Exact token value.** An unbound fill whose colour equals a PPO colour variable is bound to it. Where several variables share a value, text takes `text/*` first and shapes take `surface/*`, `border/*` or `status/*` first.
2. **Near-miss.** A colour within 3.5 RGB units of a token is bound to that token, for example `#242938` and `#292e38` to `brand/navy`, `#e4e8ee` to `proposal/menu-selected` and `#333b4a` to `shell/rail-hover`.
3. **Off-palette greys and the two off-palette blues.** These are replaced by the nearest token within 50 RGB units, with a coloured tint only taking a token of the same hue (within 20°). Blue text takes `text/link`. Replacements seen include:
   - `#6b7380` → `text/muted`
   - `#f5f7fa` → `surface/subtle`
   - `#e8ebf0` → `shell/current-link`
   - `#dbe0e8` → `shell/panel-border`
   - `#fdf6e7` and `#fff8ea` → `status/warning/tint`
   - `#eaf2fc` and `#ecf3fe` → `proposal/gantt-blue-fill`
   - `#2563a8` and `#1b5ea8` → `text/link` on text, `border/focus` on shapes

   One mistaken grey replacement of the pink Closing group band on Pipeline insights (`2340:801610`) was restored to `#fcedf3` straight away, and the hue rule was tightened before the remaining pages.
4. **Not changed:**
   - Black (`#000000`), which marks scrims and hit areas.
   - The chart colours `#1baf7a`, `#2a78d6`, `#eb6834` and `#e8f1fb`; R8 adds a chart colour set.
   - Saturated colours with no token of the same hue.
   - Fills with paint opacity below 100%, because Figma drops paint opacity when a paint is bound. They need tint variables under R8.
5. **Text styles.** A PPO text style is applied only where the text already matches it exactly: font, size, line height and letter spacing. That changes nothing visible. Most unstyled text uses automatic line height, while every PPO style has a fixed line height (Body is 14/20), so applying styles there would move layouts. That text is left unstyled; see R8 below.

**Result**, measured read-only on all 75 pages afterwards:

- **Fills:** no opaque token-valued fill is left unbound (107,646 fills are now bound). 2,910 semi-transparent token-valued fills and 1,492 off-palette fills remain, mostly scrims and chart colours.
- **Text:** no text that exactly matches a style is left without one. Unstyled text fell from 8,832 to 5,310 layers. The stage 1 figure also counted top-bar copies that R2 replaced.
- **Check:** a screenshot of Materials & substitutions · EN-06 after replacement shows no visible change.

**Follow-on for R8.** To style the remaining text without moving layouts, the type ramp needs auto-line-height variants or a decision to adopt fixed line heights page by page. To bind the semi-transparent fills, tint variables are needed. Both belong with R8's variable work.

Per-page results are in [Appendix B](#appendix-b-r7-results-by-page).

### 12.5 R3: lock-in backlog and components on accepted pages, 25 October 2026

Dean: "Do R3 next: finish the lock-in backlog and move the 107 components on accepted pages to the Components page."

**Lock-in backlog (C7).** By 25 October the sessions that drew these designs had finished their own lock-ins.

| Design | Pull request | State on 25 October |
|---|---|---|
| Deals · CR-04 | #685 | Merged |
| Calling stage 1a | #676 | Merged |
| Assistant AI-01 | #687 | Named version saved by Dean; ready for review; CI running |
| Automation Configurator | #671 | Named version saved by Dean; ready for review; CI running |
| Quotation detail | #677 | Named version saved by Dean; ready for review; CI running |
| Portal home & access CP-01 | #678 | Named version saved by Dean; ready for review; CI running |

The two "not saved" named versions were already in version history. "Organisations — accepted" and "Field team — accepted" were both saved on 18 October. Their page headers (`1443:2650`, `1289:89`) and the [Organisations decision record](../../decisions/organisations-figma-design.md) still said they were waiting; those three places are corrected. No new named version was saved, because none was missing. Merging the four open pull requests stays with Dean.

**Components (C6).** 104 main components moved from 26 accepted pages to the Components page by reparenting, so every node ID and instance is unchanged. The 107 in stage 1 also counted the two shell-amendment parts, which stay on their page by decision, and the Conversations action moved under R2. Where they went:

| Components section | Moved from | Count |
|---|---|---|
| Sales parts | Deals, Emails, Customer messages | 13 |
| Estimating parts | Discovery register, Create discovery workspace, Automation Configurator | 6 |
| Engineering and Projects parts | Baseline, forecast and dependency review; Stakeholder updates | 5 |
| Service, Supply chain and Shared records | Service requests, Service planner, Changes and follow-up, Appointment detail, Field team, Service review and reports, Findings, Remote diagnosis, Inspections, Incidents, Organisations, Sites, Facilities, People, Site surveys | 46 |
| Administration parts (new section `2613:6746`) | Users and access, Settings | 14 |
| Customer portal (new section `2613:6751`) | Portal home & access | 20 |

How the move was done:

- Each group sits under a label naming its source page.
- Each component's description gained a "Source:" line where it lacked one.
- Each emptied page-components section now holds a one-line note saying where its components went (decision D6 of the [Components page decision](../../decisions/figma-components-page.md)).
- Names were not changed, so the "(proposed)" suffixes remain, because records cite these components by name and node ID.

**Checks:**

- No accepted page holds a main component any more.
- The Components page has no overlapping sections; the top-row sections from Grid rightwards were shifted 400 px to clear the wider Shell section.
- Nested text properties on the moved component sets were refreshed, the known fix for cross-page set moves.
- A screenshot of Service planner · PL-01 `1205:52` shows the moved planner components rendering correctly.
- The [component register](../development/components.json) mappings for `sales-board` (Deals/Card `551:947`) and `forecast` (Deals/Forecast card `2362:63788`) now give their new location, with their specifications updated. `npm run studio:check` passes with no errors, and its stale-review count is unchanged at 26.

### 12.6 R8: variables and styles, 25 October 2026

Dean: "Do R8 next: rename the colour mode, promote proposal/* variables, add tint variables, a chart colour set, elevation styles and auto line-height text styles."

**Colour mode.** The single mode of the "PPO colour" collection is renamed from "My Work" to "Light".

**Promoted variables.** All 27 `proposal/*` colour variables were in use on accepted pages, so all were renamed. Bindings follow the variable ID, so nothing on any page changed.

| Old name | New name | Code variable now recorded |
|---|---|---|
| `proposal/menu-selected` | `shell/menu-selected` | `var(--ppo-shell-selected)` |
| `proposal/row-selected` | `surface/row-selected` | none in the code yet |
| `proposal/rail-text`, `rail-muted`, `rail-badge` | `shell/rail-text`, `shell/rail-muted`, `shell/rail-badge` | `--ppo-rail-text`, `--ppo-rail-muted`, `--ppo-rail-rule` |
| `proposal/attention-dot` | `status/attention-dot` | none yet |
| `proposal/cpq-info-surface`, `cpq-info-border` | `cpq/info-surface`, `cpq/info-border` | none yet |
| `proposal/annotation`, `annotation-surface`, `annotation-border` | `annotation/text`, `annotation/surface`, `annotation/border` | design notes only |
| `proposal/gantt-*` (9) | `gantt/*` | already `var(--gantt-*)` |
| `proposal/planner-*` (7) | `planner/*` | `--pl02-visit`, `--pl02-visit-border`, `--pl02-travel`, `--pl02-attention-travel`, `--pl02-avatar-surface`, `--pl02-avatar-text` (attention-selected has none) |

A code variable is recorded only where the stylesheet defines the same value. Records written before today cite the old `proposal/` names as they stood: [Gantt colours](../../decisions/gantt-figma-colours.md), [project record page](../../decisions/project-record-page-design.md), [estimate reviews](../../decisions/estimate-reviews-design.md) and the earlier library check. The Gantt record's note that the prefix was out of date is now resolved.

**Tint variables.** Seven tint variables with built-in transparency replace paint opacity, which Figma drops when a paint is bound:

- `tint/white-80`
- `tint/navy-45`, `tint/navy-42`, `tint/navy-40` (modal scrims)
- `tint/navy-32` (drawer scrim)
- `tint/navy-18`, `tint/navy-16` (light scrims)

They were made only for combinations already drawn, and bound by exact match on proposal pages; Pipeline insights alone took 964 bindings of `tint/white-80`.

**Chart colours.** The six categorical colours drawn on Pipeline insights failed the colour-safety check in their drawn order:

- `#7aa6dd` falls below the chroma floor.
- Amber and orange are too close to tell apart when adjacent.

The adopted set, assigned in this fixed order, passes lightness, chroma, colour-vision separation and the normal-vision floor:

| Slot | Colour | Hex |
|---|---|---|
| `chart/1` | blue | `#2a78d6` |
| `chart/2` | orange | `#eb6834` |
| `chart/3` | green | `#1baf7a` |
| `chart/4` | violet (the `gantt/today` value) | `#7c5cc4` |
| `chart/5` | amber | `#eda100` |
| `chart/6` | pink | `#e87ba4` |

`chart/neutral` (`#9db4cc`) and `chart/neutral-strong` (`#8aa0b8`) cover Other, target and prior-period series. Slots 3, 5 and 6 are below 3:1 against white, so charts keep visible labels or a table view; the report designs already have tables. The chart colours on Pipeline insights are bound (90 fills and strokes). `#7aa6dd` (2 fills) stays unbound and needs a redraw when that page is reviewed.

**Elevation styles.** Eight effect styles, named by role from the layers that carried each shadow, all with "show behind transparent areas" as drawn:

| Style | Shadow | Role |
|---|---|---|
| `PPO/Elevation/Flyout` | 6 0 18, navy 16% | More panel |
| `PPO/Elevation/Menu` | 0 6 18, navy 14% | Record actions menu, popovers |
| `PPO/Elevation/Floating action` | 0 6 16, navy 20% | Quick add |
| `PPO/Elevation/Side panel` | −6 0 18, navy 12% | Snapshots, side forms |
| `PPO/Elevation/Drawer` | −8 0 24, navy 14% | Wide drawers |
| `PPO/Elevation/Dialog` | 0 12 32, `#141a24` 22% | Dialogs |
| `PPO/Elevation/Raised control` | 0 1 2, navy 12% | Selected segmented option |
| `PPO/Elevation/Paper` | 0 2 8, black 8% | Document page on a surface |

The near-miss `#242938` shadow colour is normalised to `brand/navy`, a one-step difference that cannot be seen. The styles were applied to 6 main components on the Components page, including More panel, Quick add and the dialogs, so every instance inherits them. They were also applied to 443 drawn shadows on proposal pages; instances were not given overrides. 126 one-off shadows on proposal pages match no style and stay as drawn.

**Text styles with automatic line height.** Thirteen `PPO/Auto/*` styles mirror the ramp without a fixed line height:

- Body, Body strong, Small, Small strong, Label, Label strong
- Caption, Row text, Row title, Body large, Heading
- Code and Code small (Roboto Mono)

They were applied on proposal pages where text matched exactly, so nothing moved. Unstyled text on the 75 proposal pages fell from 5,310 to 3,036 layers:

- 2,693 use a fixed line height that is not in the ramp, for example 16/24, Medium 12/16 and Bold 16/24.
- 144 mix styles within one layer.
- 199 are automatic combinations with no style.

The largest group is 723 layers of Medium 11/16 with 4% letter spacing, which differs from `PPO/Overline` (6%). Applying Overline there would widen text slightly, so it is a candidate for the next amendment of each page, not an automatic change.

**Deals text styles and D4.**

- **Styles raised:** `PPO/Deals/Avatar` (9/12 → 11/14, used 372 times on Deals) and `PPO/Deals/Task badge` (8/12 → 11/14, unused). A screenshot of a Deals card shows the initials still fit their 23 px avatar.
- **D4 decided from the evidence:** the accepted Deals page already uses the Font Awesome icons, while the `Deals · r37 reference` variables (939 bindings) and the `PPO/Deals/*` styles are the accepted page's own tokens, so they stay.
- **`Deals/Icon/*` (30 components, 147 instances):** these stay in Components › Icons as a legacy group. They are still used on Deal record page · CR-01 (accepted 16 October) and Pipeline insights · CR-04 (proposal), and should be swapped when each of those pages is next amended.

**Not changed.** The 1,870 fully transparent white fills on proposal pages are invisible hit areas, not tints, and are left as they are. Accepted pages were not rebound or restyled, apart from inheriting the renamed variables and the library component styles.

### 12.7 R4: Customer 360 archived, 25 October 2026

- **Page.** "Customer 360 (proposal)" `554:2` moved to the end of the Archive group, after Shell v2. Its name is unchanged and `554:2` still resolves, so the records that cite it still find it.
- **Note.** An "Archived note" frame `2636:2408` at the top of the page says the page was never accepted and is superseded by Organisations · CS-01 `1443:2615`.
- **File index.** Row `630:131` moved to Evidence and archive. It now carries the Archived tag and "Archived 25 Oct 2026 · superseded by Organisations · CS-01 (1443:2615)".
- **Records.** The [Customer 360 record](../../decisions/customer-360-figma-design.md) is marked superseded by the [Organisations and Customer 360 decision](../../decisions/organisations-figma-design.md) (accepted 18 October). The component register entries `customer-360-summary` and `crm-directory`, and the CS-01 scope page, now say the page is archived. `customer-360-summary` stays reference-only.

### 12.8 R1: page names, 25 October 2026

Sixteen pages were renamed once to "[Page name] · [scope ID]". Node IDs did not change.

| Node | Former name | Name now |
|---|---|---|
| `404:2` | My Work (accepted) | My Work · SH-01 · SH-02 |
| `128:8845` | Intake & workload (accepted) | Intake & workload · ES-01 |
| `152:1122` | Sales briefs (accepted) | Sales briefs · CR-02 |
| `383:2` | Estimation Wizard (accepted) | Estimation Wizard · ES-02 |
| `408:4` | ES-02 Priva Fertigation Workbench (accepted) | Priva Fertigation Workbench · ES-02 |
| `406:2` | ES-08 · Screen Configurator Workbench | Screen Configurator Workbench · ES-08 |
| `133:2366` | Cost sources (accepted) | Cost sources · ES-03 |
| `123:40` | Quotations (accepted) | Quotations · ES-05 · ES-06 · ES-07 |
| `56:2` | Reviews & approvals (accepted) | Reviews & approvals · ES-04 · ES-05 |
| `184:1047` | Engineering workload (accepted) | Engineering workload · EN-01 |
| `209:46` | Projects (accepted) | Projects · PJ-02 |
| `345:2` | Project record page (accepted) | Project record page · PJ-02 |
| `193:18953` | Work orders (accepted) | Work orders · SV-03 |
| `312:2` | Work order record page (accepted) | Work order record page · SV-03 |
| `272:2` | Job pack (accepted) | Job pack · SV-05 |
| `653:38` | Products · PD-01 · discovery proposal | Products · PD-01 |

**Not renamed.**

- **CPQ · 1 to CPQ · 6** `464:2`–`464:7`. Section 3 offered ES-02 · ES-03, but the [CPQ record](../../decisions/cpq-figma-design.md) says no page-scope ID covers the two workspaces and none is created. ADR-0055 rule 3 names such a page without an ID, so these pages keep their names until a scope is assigned. This corrects section 3, which counted them among the 20.
- **Customer 360 (proposal)** `554:2`. It was archived under R4 instead.
- **Conversations, Leads (accepted), Lead record page (accepted) and Excel estimate import, and the three system pages.** These stay as R1 says.

**In the file.**

- **Page headers.** Every renamed page's header already showed the bare page name, except Priva Fertigation Workbench, whose title `1126:11083` lost its "ES-02 " prefix.
- **Left as written.** Screen titles, flow names, notes and named-version titles that quote an old name are history and were not changed.
- **File index.** The File index `630:2` widened from 1,240 to 1,456 px. Every table gained a "Former name" column after Page: 95 header and data rows, with "—" where a page kept its name. The Start here and Foundations frames moved 216 px right to stay clear of it.
- **Naming rule.** Rule 2 of "How pages are organised" now records this one exception.

**In the repository.**

- **Updated.** 26 files cite a renamed page by its current name: 22 decision records (mostly their Accepted frames or Page rows), `components.json`, two component pages and the ES-08 route page. Each now gives the new name, with the former name in brackets. The page's own record also gives the date and links this section.
- **Re-checked.** `estimate-reviews-design.md` still said "Reviews & approvals (proposal)", and now gives both former names. `products-figma-design.md` no longer says the name is kept, or that Products follows Customer 360.
- **ADR-0055.** An amendment records the one-time exception to its rule 3.
- **Not changed.** These records quote an old name as it was at the time, and were left as written:
  - narrative of past events in `cost-sources-design.md`, `intake-workload-design.md` and `engineering-workload-design.md`;
  - the 17 October re-skin table in `figma-page-template-alignment.md`, which gains a note pointing to the new names;
  - the stage 1 tables in this report;
  - status fragments, the status log, issued references and test evidence.

### 12.9 R11: phone list Conversations slot, 25 October 2026

- **Nothing to add.** Every list-type phone screen on the proposal pages already uses `Shell / Phone header · compact` `1530:110` at Type=List, which carries the Conversations action (P2). Across the whole file, all 362 Type=List instances on 89 pages show it.
- **Stage 1 corrected.** Section 4 listed Site readiness, Catalogue import, Material demand and the Engineering registers as having list frames without a Conversations layer. That count looked only at layers drawn on the page, not inside instances, where the compact header holds the action. The list screens on those ten pages all carry it.
- **Swept.** The phone screens on all 75 proposal pages (390 and 320 px frames placed directly in a section) were checked. 159 use the List header and 288 the Record header, where Conversations sits in the record's More menu (P3 note). The other 136 use neither header:
  - 81 customer portal screens (CP-02 to CP-06) with the portal's own header; the portal has no staff Conversations;
  - 5 screens of the customer's quotation page (Quotation page & customer views);
  - 46 full-screen forms, sheets and search panels, such as Record result on EN-08 and Count my van on SC-10. They are tasks opened from a list or record, and the phone header amendment gives them no Conversations slot, as with its filter panel (P5);
  - 4 Screen Configurator Workbench · ES-08 screens with the workbench's own header, drawn on 12 October before the compact header existed. They are record screens and should take the Record header at ES-08's next amendment.
- **No frame was changed.**

### 12.10 R6: shared components S2 to S5, 25 October 2026

Five proposed component sets are now on Components `1:4`, in the Controls and Grid sections. They follow the Components Read me naming rule: "(proposed)" until a page that uses them is accepted, and "(phone)" for phone parts, so S5 is named "Grid / List row (phone, proposed)". Each description says what the set unifies and gives its source.

| Component | Node | Variants | Properties |
|---|---|---|---|
| Controls / Form field (proposed) | `2649:7479` | Control: Input, Select, Date, Textarea × State: Default, Focus, Error, Disabled (16) | Label, Requirement, Help, Value, Message, Counter; show requirement, help and counter |
| Controls / Switch (proposed) | `2648:7306` | State: On, Off, Not available, Locked on | None |
| Controls / Choice option (proposed) | `2648:7409` | Type: Radio, Checkbox × State: Default, Selected, Error, Disabled × Style: Card, Plain (16) | Label, Description; show description |
| Grid / Group band (proposed) | `2651:7352` | Tone: Neutral, Info, Success, Warning, Danger | Label, Count, Detail; show detail, chevron, select column and settings column |
| Grid / List row (phone, proposed) | `2651:7385` | State: Default, Selected | Title, Trailing, Meta, Detail, Detail trailing, Detail icon (swap); show trailing, tag, line 3, detail icon and chevron; the Tag inside is exposed |

**How they were built.**

- **Anatomy.** Each set takes the shared anatomy of the local versions:
  - the label, help, 44 px control and error footer of Job pack / Form field and Planner / Input;
  - the switch of Account / Switch;
  - the card and radio of Warranty / Choice option and AI-06 / Option row;
  - the band of PD-04 and Authoring;
  - the 390 px three-line row of the accepted phone list rows.
- **Tokens.** Every colour is a PPO colour variable. Padding, gaps and radii use PPO layout variables where a token matches, and all text uses PPO text styles. The switch knob uses `PPO/Elevation/Raised control`, and the checkbox option reuses Grid / Checkbox.
- **Grid band rule.** Group band includes 44 px select and settings columns, so its colour spans them.
- **Info tone.** Three variables were added from the stylesheet's `--info` set: `status/info/text` `#346580`, `status/info/surface` `#e9f2f8` and `status/info/border` `#cfe0ec`. Each has its CSS name as code syntax.
- **Checked.** Each set was checked in a screenshot. Two faults were found and fixed: choice cards were clipped at a fixed height, and strokes counted in layout made the selected cards 2 px taller.

**Departures to note.**

- **Sample text.** Text properties are shared by every variant, so the samples are neutral: "Field label", "Value" and "Option label".
- **Phone input text.** Value text is 14 px, as on the accepted pages, but the runtime uses at least 16 px on phones (mobile form rule). The register records this.
- **List row height.** The row hugs its content with 8 px vertical padding: 82 px with three lines. The accepted rows are fixed at 80 px with 12 px padding, which their three lines overflow.
- **Selected row.** On a selected list row, the Neutral tag's surface is close to the row's selected colour.

**Not changed.** No local version was swapped for a shared one. Read me rule 4 allows a swap only when the result looks identical, and these differ in small ways, so each page adopts the shared component at its next amendment.

**Also updated.**

- **Read me.** The Components Read me now records the R6 exception to its rule 1. It no longer lists the Deals parts that R3 moved as kept elsewhere, and it shows Customer 360 as archived.
- **Register.** The `fields`, `validation`, `mobile-form` and `register-table` mappings in the [component register](../development/components.json) and their specification pages now list the proposed components. `mobile-form` moves from None to Partial.

### 12.11 R10: EQ-04 proposal drawn, 25 October 2026

Dean: "Keep PR #694 in draft and start R10 with the EQ-04 page design." The page "Movement, replacement & retirement · EQ-04" `2662:87` sits right after Equipment · EQ-01. It is a proposal only: there is no decision record, File index row or named version until Dean accepts it.

- **What it draws.** How equipment is recorded as moved, corrected, replaced by a separate record or retired: the impact is checked first and a separate reviewer decides. It extends the EQ-01 equipment record and follows the built rules in `src/equipment/changes.ts`.
- **Story.** It follows EQ-01's own: the Block C dosing unit `SYN-PPO-AST-000311` is replaced by loan unit `SYN-AST-000216` on Wed 14 Oct and applied by Jordan Kim at 15:30. The other cases use records from EQ-01's register: Shade house climate sensor SH-1 for a relocation, Boiler controller BC-1 for retirement and Temperature sensor TS-5 for a correction.
- **Frames.**
  - Desktop: review decision `2662:156`, relocation side form `2662:315`, the loan unit after apply `2668:1003` and retirement `2669:10867`.
  - Tablet: review decision `2671:1640`.
  - Phone: three 390 px steps and two 320 px screens.
  - Nine states, a notes card `2685:2625`, and prototype flows "EQ-04 — desktop review" and "EQ-04 — phone".
- **Shared components.** The side forms and phone steps are the first use of the proposed Controls / Form field and Choice option from R6.
- **Waiting for Dean.** Decisions D1–D10 and questions Q1–Q6 are in the notes card. Q1–Q3 concern gaps in the built code: reinstalling a removed unit, the proposer being able to apply, and moving served areas on replacement.
- **Checks.** Every frame was screenshotted and the faults found were fixed. Labels, gaps and sections follow the Template, with no overlaps and nothing outside its section; visible text was checked for clipping. The flows have not been played in Present mode.

### 12.12 Not done yet

R10's remaining pages: CR-03, ES-07 conversion and PJ-07, in that order, each as its own request. Follow-ups:

- **From R8:** the 723 Overline-like text layers, the remaining fixed-line-height text, the r37 icon swaps on Deal record page and Pipeline insights, and the `#7aa6dd` chart redraw.
- **From R6:** S6 to S12 as their pages are accepted, and each page's adoption of S2 to S5 at its next amendment.
- **From R11:** the compact Record header for the four ES-08 phone screens.

## Appendix A: per-page measurements

Screens are counted as 1440 / 1024 / 390 / 320 frames in the page's sections. The top bar column counts linked instances / detached copies of `Shell / Top bar` and the phone headers; the customer portal pages use their own header, so they show 0 / 0. Unstyled text counts text layers drawn on the page with no text style. Fills shows unbound token-value fills / off-palette fills. Local components counts main components on the page.

| Page | Node | Status | Screens | Top bar | Unstyled text | Fills | Local components |
|---|---|---|---|---|---|---|---|
| **System** | | | | | | | |
| UX benchmark exemplars | `986:47` | Reference | 13 / 0 / 3 / 0 | 0 / 0 | 86 of 982 | 58 / 1 | 2 |
| Shell top bar amendment | `1035:48` | Accepted | 4 / 0 / 0 / 0 | 6 / 0 | 26 of 565 | 5 / 0 | 2 |
| Phone header amendment | `1530:70` | Accepted | 0 / 0 / 2 / 0 | 19 / 1 | 40 of 58 | 0 / 0 | 0 |
| **My Work** | | | | | | | |
| My Work (accepted) | `404:2` | Accepted | 8 / 0 / 3 / 0 | 2 / 0 | 20 of 230 | 25 / 0 | 0 |
| Conversations | `1141:49` | Accepted | 8 / 2 / 9 / 3 | 4 / 10 | 39 of 359 | 20 / 34 | 1 |
| Assistant · AI-01 | `2367:85` | Accepted | 10 / 2 / 6 / 4 | 0 / 12 | 114 of 828 | 39 / 4 | 0 |
| Answer evidence · AI-03 | `2389:273553` | Proposal | 9 / 1 / 3 / 3 | 0 / 9 | 30 of 809 | 838 / 20 | 7 |
| Proposal review · AI-02 | `2389:278889` | Proposal | 9 / 1 / 3 / 3 | 0 / 10 | 58 of 724 | 20 / 0 | 5 |
| Voice capture · AI-05 | `2394:866287` | Proposal | 6 / 0 / 12 / 10 | 0 / 5 | 117 of 769 | 589 / 6 | 15 |
| Drafting & domain help · AI-04 | `2393:864503` | Proposal | 7 / 1 / 4 / 2 | 0 / 8 | 324 of 510 | 339 / 82 | 7 |
| Recurring checks · AI-07 | `2403:47777` | Proposal | 14 / 1 / 2 / 2 | 4 / 15 | 37 of 669 | 45 / 0 | 6 |
| My account and preferences · SH-03 · SH-05 · EC-02 | `2105:638399` | Proposal | 16 / 1 / 12 / 4 | 16 / 17 | 14 of 783 | 55 / 42 | 8 |
| Search · SH-04 | `2105:638924` | Proposal | 13 / 2 / 4 / 2 | 1 / 15 | 21 of 371 | 17 / 0 | 7 |
| Calling and call logging · CS-01 · CS-02 · CR-01 | `2125:688373` | Accepted | 13 / 0 / 6 / 1 | 2 / 11 | 11 of 1103 | 37 / 0 | 0 |
| **Sales** | | | | | | | |
| Leads (accepted) | `190:20237` | Accepted | 2 / 0 / 1 / 0 | 1 / 0 | 19 of 138 | 6 / 0 | 0 |
| Lead record page (accepted) | `224:2` | Accepted | 5 / 0 / 7 / 0 | 1 / 0 | 53 of 392 | 11 / 4 | 0 |
| Deals · CR-04 | `549:2` | Accepted | 23 / 2 / 1 / 2 | 2 / 25 | 48 of 922 | 251 / 5 | 4 |
| Pipeline insights · CR-04 | `2336:155` | Proposal | 9 / 1 / 2 / 2 | 0 / 9 | 11 of 820 | 1022 / 698 | 1 |
| Deal record page · CR-01 | `879:44` | Accepted | 16 / 0 / 5 / 0 | 1 / 0 | 102 of 910 | 77 / 2 | 0 |
| Emails · EC-01 | `1499:392390` | Accepted | 12 / 2 / 11 / 2 | 0 / 14 | 52 of 590 | 79 / 5 | 7 |
| Calendar · EC-03 | `1511:396797` | Accepted | 11 / 1 / 6 / 1 | 7 / 11 | 462 of 603 | 42 / 3 | 0 |
| Customer messages · EC-04 | `1509:394554` | Accepted | 11 / 1 / 7 / 3 | 8 / 12 | 341 of 732 | 310 / 23 | 2 |
| Customer 360 (proposal) | `554:2` | Proposal | 17 / 0 / 7 / 0 | 21 / 0 | 3 of 1520 | 0 / 0 | 1 |
| Sales aftercare · CR-05 | `2294:85` | Proposal | 8 / 1 / 2 / 2 | 0 / 8 | 24 of 632 | 17 / 0 | 4 |
| Products · PD-01 · discovery proposal | `653:38` | Accepted | 13 / 3 / 6 / 3 | 3 / 3 | 17 of 729 | 8 / 1 | 0 |
| Product publication · PD-02 | `2393:864572` | Proposal | 8 / 1 / 3 / 2 | 5 / 9 | 11 of 884 | 8 / 0 | 0 |
| Product pricing · PD-03 | `2393:859137` | Proposal | 8 / 1 / 2 / 1 | 3 / 7 | 11 of 375 | 6 / 0 | 4 |
| Product compatibility · PD-04 | `2393:868573` | Proposal | 9 / 1 / 2 / 2 | 0 / 0 | 11 of 662 | 786 / 5 | 7 |
| Catalogue import · PD-05 | `2404:211` | Proposal | 10 / 1 / 3 / 2 | 5 / 10 | 11 of 476 | 10 / 0 | 2 |
| **Estimating** | | | | | | | |
| Intake & workload (accepted) | `128:8845` | Accepted | 4 / 0 / 1 / 0 | 1 / 1 | 21 of 153 | 9 / 0 | 0 |
| Estimate detail · ES-01 | `2244:733125` | Proposal | 16 / 1 / 2 / 2 | 4 / 17 | 11 of 729 | 0 / 0 | 0 |
| Sales briefs (accepted) | `152:1122` | Accepted | 3 / 0 / 1 / 0 | 1 / 1 | 19 of 169 | 6 / 0 | 0 |
| Sales brief page · CR-02 | `2245:736961` | Proposal | 20 / 1 / 2 / 2 | 4 / 21 | 36 of 854 | 0 / 25 | 0 |
| Discovery register · ES-02 | `1400:345306` | Accepted | 5 / 1 / 4 / 1 | 5 / 6 | 48 of 167 | 35 / 0 | 2 |
| Create discovery workspace · ES-02 | `1414:356570` | Accepted | 7 / 1 / 4 / 1 | 0 / 8 | 57 of 489 | 50 / 17 | 1 |
| Estimation Wizard (accepted) | `383:2` | Accepted | 28 / 1 / 4 / 1 | 0 / 3 | 76 of 1685 | 3 / 26 | 0 |
| Discovery costing · ES-02 | `1431:809` | Accepted | 5 / 1 / 3 / 1 | 0 / 6 | 56 of 378 | 30 / 24 | 0 |
| ES-02 Priva Fertigation Workbench (accepted) | `408:4` | Accepted | 16 / 0 / 3 / 0 | 3 / 3 | 1640 of 1873 | 74 / 0 | 0 |
| Automation Configurator · ES-02 | `2043:80` | Accepted | 18 / 1 / 5 / 2 | 4 / 18 | 651 of 2501 | 19 / 0 | 3 |
| Excel estimate import | `711:38` | Accepted | 11 / 1 / 2 / 1 | 0 / 2 | 15 of 1098 | 0 / 1 | 0 |
| CPQ · 1 Read me, sources & decisions (accepted) | `464:2` | Accepted | 1 / 0 / 0 / 0 | 0 / 0 | 227 of 237 | 0 / 0 | 0 |
| CPQ · 2 Foundations & components (accepted) | `464:3` | Accepted | 0 / 0 / 0 / 0 | 0 / 0 | 730 of 793 | 0 / 0 | 23 |
| CPQ · 3 Rules studio (accepted) | `464:4` | Accepted | 17 / 0 / 0 / 0 | 0 / 1 | 626 of 653 | 47 / 0 | 0 |
| CPQ · 4 Configure & price (accepted) | `464:5` | Accepted | 26 / 0 / 0 / 0 | 0 / 15 | 243 of 731 | 34 / 0 | 0 |
| CPQ · 5 Compare, history & overrides (accepted) | `464:6` | Accepted | 17 / 0 / 0 / 0 | 0 / 4 | 161 of 265 | 42 / 0 | 0 |
| CPQ · 6 Responsive & states (accepted) | `464:7` | Accepted | 0 / 3 / 12 / 2 | 0 / 1 | 356 of 478 | 7 / 0 | 0 |
| ES-08 · Screen Configurator Workbench | `406:2` | Proposal | 14 / 0 / 4 / 0 | 0 / 4 | 202 of 1365 | 32 / 270 | 27 |
| Cost sources (accepted) | `133:2366` | Accepted | 3 / 0 / 2 / 0 | 2 / 1 | 19 of 212 | 30 / 0 | 0 |
| Quotations (accepted) | `123:40` | Accepted | 36 / 0 / 1 / 0 | 1 / 32 | 16 of 1143 | 12 / 0 | 0 |
| Quotation detail · ES-05 · ES-06 | `2142:82` | Accepted | 17 / 1 / 2 / 2 | 4 / 18 | 29 of 1260 | 0 / 0 | 0 |
| Quotation release · ES-05 | `2244:50245` | Proposal | 19 / 1 / 3 / 3 | 6 / 20 | 33 of 1337 | 0 / 0 | 0 |
| Quotation page & customer views · ES-05 | `2221:85` | Proposal | 15 / 0 / 5 / 2 | 2 / 6 | 29 of 1103 | 5 / 0 | 9 |
| Customer response · ES-06 | `2244:50787` | Proposal | 17 / 1 / 2 / 2 | 4 / 18 | 34 of 602 | 0 / 0 | 6 |
| Reviews & approvals (accepted) | `56:2` | Accepted | 17 / 0 / 1 / 0 | 1 / 15 | 19 of 517 | 6 / 0 | 0 |
| Estimate review · ES-04 | `2244:734679` | Proposal | 15 / 1 / 2 / 2 | 4 / 16 | 33 of 506 | 0 / 0 | 4 |
| Reference cases & calibration · ES-10 | `2244:48064` | Proposal | 10 / 1 / 2 / 2 | 4 / 10 | 21 of 986 | 28 / 0 | 0 |
| Estimate-to-actual review · ES-09 | `2244:50439` | Proposal | 14 / 2 / 5 / 2 | 5 / 15 | 13 of 717 | 16 / 0 | 3 |
| Rules studio · rule sets, derived values & tables · ES-02 · ES-03 | `2315:792701` | Proposal | 21 / 1 / 2 / 1 | 3 / 21 | 161 of 1702 | 63 / 2 | 0 |
| **Engineering** | | | | | | | |
| Engineering workload (accepted) | `184:1047` | Accepted | 2 / 0 / 1 / 0 | 1 / 0 | 28 of 178 | 6 / 0 | 0 |
| Design basis & interfaces · EN-02 | `2091:552579` | Proposal | 19 / 1 / 3 / 2 | 4 / 20 | 11 of 1187 | 45 / 0 | 4 |
| Drawings & controlled documents · EN-03 | `2091:592460` | Proposal | 20 / 1 / 3 / 2 | 5 / 20 | 597 of 826 | 40 / 0 | 4 |
| Technical queries · EN-04 | `2091:586789` | Proposal | 18 / 1 / 3 / 2 | 4 / 19 | 30 of 574 | 85 / 2 | 0 |
| Materials & substitutions · EN-06 | `2092:1424` | Proposal | 9 / 1 / 11 / 2 | 11 / 10 | 687 of 1061 | 563 / 61 | 2 |
| Technical reviews · EN-05 | `2091:595141` | Proposal | 19 / 1 / 8 / 2 | 7 / 20 | 139 of 713 | 157 / 36 | 0 |
| Change review · EN-07 | `2097:583371` | Proposal | 20 / 2 / 3 / 2 | 0 / 21 | 14 of 1289 | 5 / 32 | 5 |
| Commissioning & as-built · EN-08 | `2091:542313` | Proposal | 16 / 1 / 7 / 2 | 5 / 16 | 104 of 738 | 143 / 29 | 6 |
| **Projects** | | | | | | | |
| Projects (accepted) | `209:46` | Accepted | 2 / 0 / 1 / 0 | 1 / 0 | 21 of 138 | 6 / 0 | 0 |
| Project record page (accepted) | `345:2` | Accepted | 8 / 0 / 5 / 0 | 1 / 0 | 31 of 744 | 18 / 4 | 0 |
| Baseline, forecast and dependency review · PJ-03 | `1743:5636` | Accepted | 9 / 1 / 4 / 1 | 5 / 10 | 98 of 1942 | 22 / 4 | 3 |
| Risks & issues · PJ-04 | `2097:630918` | Proposal | 13 / 1 / 3 / 2 | 4 / 14 | 39 of 716 | 640 / 0 | 7 |
| Contract obligations, notices and variations · PJ-05 | `933:11285` | Accepted | 14 / 2 / 3 / 1 | 2 / 0 | 12 of 433 | 43 / 3 | 0 |
| Subcontractor packages · PJ-06 | `2097:655149` | Proposal | 20 / 1 / 2 / 2 | 2 / 21 | 49 of 837 | 58 / 2 | 3 |
| Stakeholder updates · PJ-08 | `1577:10373` | Accepted | 19 / 1 / 4 / 1 | 5 / 20 | 148 of 1086 | 162 / 13 | 2 |
| Acceptance & closeout · PJ-09 | `2097:6900` | Proposal | 12 / 1 / 3 / 2 | 5 / 13 | 23 of 408 | 30 / 29 | 2 |
| **Service** | | | | | | | |
| Service requests · SV-01 · SV-02 | `1249:9313` | Accepted | 7 / 1 / 8 / 1 | 6 / 0 | 51 of 405 | 20 / 2 | 4 |
| Work orders (accepted) | `193:18953` | Accepted | 2 / 0 / 1 / 0 | 1 / 0 | 20 of 163 | 6 / 0 | 0 |
| Work order record page (accepted) | `312:2` | Accepted | 10 / 0 / 5 / 0 | 1 / 0 | 30 of 564 | 22 / 4 | 0 |
| Service planner · PL-01 | `1203:5805` | Accepted | 5 / 1 / 8 / 1 | 9 / 0 | 131 of 521 | 59 / 342 | 8 |
| Changes and follow-up · PL-04 | `1326:4525` | Accepted | 7 / 1 / 6 / 1 | 4 / 8 | 332 of 542 | 370 / 7 | 2 |
| Travel review · PL-05 | `1371:3488` | Accepted | 2 / 1 / 3 / 1 | 4 / 3 | 277 of 318 | 301 / 25 | 0 |
| Capacity review · PL-03 | `2244:50314` | Proposal | 13 / 1 / 2 / 2 | 4 / 14 | 19 of 1735 | 39 / 0 | 0 |
| Appointment detail · SV-04 | `1187:50` | Accepted | 2 / 1 / 8 / 1 | 0 / 0 | 18 of 338 | 1 / 0 | 1 |
| Field team · PL-02 | `1289:54` | Accepted | 4 / 1 / 7 / 2 | 6 / 5 | 87 of 528 | 11 / 1075 | 9 |
| Job pack (accepted) | `272:2` | Accepted | 18 / 0 / 11 / 0 | 1 / 0 | 41 of 1055 | 63 / 10 | 0 |
| Service review and reports · SV-06 | `1265:53` | Accepted | 6 / 1 / 8 / 1 | 5 / 0 | 43 of 334 | 15 / 2 | 3 |
| Customer response · FI-07 | `1490:70` | Accepted | 7 / 1 / 9 / 1 | 8 / 7 | 65 of 453 | 44 / 8 | 0 |
| Findings and follow-up · SV-07 | `1358:3488` | Accepted | 4 / 1 / 6 / 1 | 4 / 5 | 190 of 348 | 208 / 1 | 2 |
| Remote diagnosis and escalation · SV-08 | `1365:2901` | Accepted | 4 / 1 / 5 / 1 | 4 / 5 | 65 of 296 | 48 / 2 | 2 |
| My jobs · FI-01 | `845:44` | Accepted | 10 / 8 / 26 / 1 | 7 / 0 | 168 of 1193 | 0 / 0 | 0 |
| Site readiness · FI-05 | `2336:85` | Proposal | 4 / 1 / 13 / 6 | 19 / 4 | 79 of 602 | 0 / 0 | 3 |
| Inspections · FI-03 · FI-04 | `1339:4184` | Accepted | 5 / 1 / 7 / 1 | 1 / 6 | 115 of 401 | 89 / 16 | 2 |
| Incidents and corrective actions · FI-06 | `1348:2972` | Accepted | 6 / 1 / 5 / 1 | 0 / 7 | 103 of 391 | 92 / 7 | 2 |
| Service agreements · MA-01 · MA-02 | `2089:548670` | Proposal | 22 / 1 / 2 / 2 | 0 / 22 | 11 of 1091 | 54 / 0 | 6 |
| Maintenance · MA-03 · MA-04 | `2091:545925` | Proposal | 16 / 1 / 6 / 2 | 8 / 16 | 29 of 507 | 264 / 3 | 6 |
| Warranty cases · MA-06 · MA-07 | `2089:15560` | Proposal | 11 / 1 / 10 / 2 | 11 / 12 | 56 of 782 | 33 / 30 | 5 |
| **Supply chain** | | | | | | | |
| Material demand · SC-01 | `2089:529958` | Proposal | 15 / 1 / 5 / 2 | 7 / 15 | 498 of 956 | 491 / 32 | 5 |
| Purchasing · SC-02 | `2089:544463` | Proposal | 14 / 1 / 6 / 2 | 7 / 15 | 502 of 915 | 628 / 60 | 4 |
| Inbound shipments · SC-03 | `2089:531469` | Proposal | 6 / 1 / 9 / 2 | 11 / 7 | 195 of 437 | 286 / 5 | 2 |
| Receiving · SC-04 | `2089:535413` | Proposal | 8 / 1 / 12 / 1 | 9 / 9 | 277 of 638 | 277 / 15 | 0 |
| Inventory · SC-05 | `697:39` | Accepted | 5 / 1 / 2 / 1 | 1 / 0 | 17 of 246 | 8 / 1 | 0 |
| Workshop builds · CX-02 | `1690:76` | Accepted | 6 / 1 / 8 / 1 | 8 / 7 | 133 of 382 | 119 / 6 | 0 |
| Kitting and controller preparation · CX-02 | `2044:488208` | Proposal | 7 / 1 / 8 / 1 | 8 / 8 | 133 of 389 | 122 / 6 | 4 |
| Bench testing and returned units · CX-02 | `2083:82` | Proposal | 6 / 1 / 10 / 1 | 7 / 7 | 118 of 435 | 110 / 4 | 2 |
| Returns & claims · SC-08 | `2089:527625` | Proposal | 8 / 1 / 10 / 1 | 10 / 9 | 179 of 616 | 154 / 34 | 3 |
| Dispatch & delivery · SC-06 · SC-07 | `2089:15629` | Proposal | 9 / 1 / 12 / 1 | 12 / 10 | 75 of 815 | 31 / 8 | 2 |
| Service stock · SC-10 | `2091:539160` | Proposal | 11 / 1 / 8 / 2 | 6 / 12 | 345 of 747 | 345 / 94 | 3 |
| **Finance** | | | | | | | |
| Finance handoffs · FN-01 | `2091:592837` | Proposal | 18 / 1 / 3 / 2 | 5 / 19 | 14 of 920 | 116 / 107 | 3 |
| Customer accounts · FN-02 | `2097:606288` | Proposal | 16 / 1 / 2 / 2 | 4 / 17 | 44 of 662 | 42 / 0 | 11 |
| Project financial performance · FN-03 | `1580:4165` | Accepted | 17 / 1 / 3 / 1 | 4 / 18 | 40 of 788 | 81 / 1 | 0 |
| Claims & obligations · FN-04 | `2097:611315` | Proposal | 19 / 1 / 2 / 1 | 3 / 20 | 0 of 999 | 194 / 1 | 6 |
| Cash outlook · FN-05 | `2097:681762` | Proposal | 11 / 1 / 4 / 2 | 4 / 9 | 18 of 902 | 27 / 0 | 7 |
| Measure definitions · FN-06 | `2105:626649` | Proposal | 20 / 1 / 2 / 2 | 4 / 21 | 11 of 856 | 66 / 0 | 5 |
| **Reporting** | | | | | | | |
| Reports overview · RP-01 | `2199:595` | Proposal | 14 / 1 / 3 / 2 | 5 / 15 | 13 of 2319 | 70 / 0 | 5 |
| Sales performance · RP-02 | `2404:876863` | Proposal | 11 / 1 / 3 / 2 | 5 / 12 | 13 of 1481 | 36 / 19 | 5 |
| Service performance · RP-04 | `2411:33278` | Proposal | 13 / 1 / 2 / 2 | 4 / 14 | 11 of 1416 | 1166 / 24 | 2 |
| Supply & Finance trust · RP-05 | `2410:885569` | Proposal | 14 / 1 / 2 / 2 | 4 / 15 | 37 of 1789 | 42 / 0 | 5 |
| Delivery performance · RP-03 | `2413:127` | Proposal | 11 / 1 / 1 / 1 | 3 / 12 | 809 of 1335 | 1087 / 0 | 0 |
| Report definitions · RP-06 | `2466:3344` | Proposal | 3 / 1 / 1 / 1 | 0 / 3 | 11 of 203 | 297 / 2 | 0 |
| **Shared records** | | | | | | | |
| Organisations · CS-01 | `1443:2615` | Accepted | 5 / 1 / 6 / 1 | 4 / 6 | 134 of 321 | 108 / 9 | 2 |
| Account development · CS-07 | `2302:786940` | Proposal | 13 / 1 / 5 / 2 | 5 / 14 | 11 of 836 | 32 / 0 | 0 |
| Stakeholders · CS-03 | `2288:761` | Proposal | 6 / 1 / 10 / 2 | 12 / 7 | 11 of 938 | 21 / 0 | 6 |
| Sites · CS-04 | `1375:2901` | Accepted | 3 / 1 / 5 / 1 | 4 / 4 | 89 of 281 | 71 / 5 | 2 |
| Facilities and growing areas · CS-05 | `1415:357158` | Accepted | 11 / 1 / 6 / 1 | 4 / 12 | 214 of 507 | 123 / 19 | 2 |
| People · CS-02 | `1395:150275` | Accepted | 4 / 1 / 6 / 1 | 4 / 5 | 89 of 226 | 73 / 7 | 2 |
| Access & readiness · CS-06 | `1400:346423` | Accepted | 4 / 1 / 3 / 1 | 0 / 5 | 97 of 278 | 86 / 8 | 0 |
| Site surveys · CS-08 | `1464:2918` | Accepted | 8 / 1 / 7 / 1 | 4 / 9 | 144 of 458 | 120 / 5 | 3 |
| Equipment · EQ-01 | `2089:526174` | Proposal | 11 / 1 / 6 / 1 | 7 / 12 | 263 of 557 | 404 / 5 | 2 |
| Test instruments & calibration · EQ-09 | `2089:536153` | Proposal | 12 / 1 / 10 / 2 | 10 / 12 | 39 of 749 | 723 / 5 | 4 |
| Bulletins & lifecycle · EQ-06 · EQ-07 | `2280:85` | Proposal | 14 / 1 / 4 / 2 | 4 / 15 | 184 of 627 | 158 / 72 | 7 |
| Configuration backups · EQ-08 | `2278:452` | Proposal | 11 / 1 / 6 / 2 | 8 / 11 | 54 of 551 | 72 / 2 | 4 |
| Document library · DK-01 · DK-02 | `744:2609` | Accepted | 14 / 1 / 2 / 1 | 1 / 0 | 124 of 347 | 32 / 2 | 0 |
| Output, issue and distribution · DK-03 | `770:42` | Accepted | 15 / 1 / 2 / 1 | 1 / 0 | 45 of 538 | 39 / 2 | 0 |
| Template management · DK-06 | `793:6155` | Accepted | 15 / 1 / 2 / 1 | 2 / 0 | 104 of 570 | 41 / 1 | 0 |
| Knowledge · DK-04 | `2200:833` | Proposal | 10 / 1 / 6 / 3 | 8 / 11 | 54 of 707 | 27 / 0 | 9 |
| Knowledge authoring · DK-05 | `2244:734610` | Proposal | 16 / 1 / 2 / 2 | 4 / 17 | 82 of 930 | 43 / 0 | 7 |
| **Administration** | | | | | | | |
| Users and access · AD-01 | `1551:23774` | Accepted | 8 / 1 / 7 / 1 | 8 / 9 | 96 of 266 | 126 / 3 | 8 |
| Settings · AD-02 | `2049:11645` | Accepted | 8 / 1 / 6 / 1 | 7 / 9 | 66 of 390 | 120 / 4 | 6 |
| Mappings & reconciliation · AD-05 | `2097:685460` | Proposal | 15 / 1 / 5 / 2 | 7 / 16 | 30 of 456 | 45 / 2 | 12 |
| Integrations · AD-04 | `2097:678714` | Proposal | 11 / 1 / 13 / 2 | 15 / 11 | 11 of 569 | 31 / 36 | 5 |
| Data quality · AD-03 | `2097:614223` | Proposal | 19 / 1 / 7 / 2 | 9 / 20 | 76 of 667 | 90 / 3 | 4 |
| Audit history · AD-07 | `2097:668418` | Proposal | 9 / 1 / 9 / 2 | 11 / 10 | 28 of 737 | 36 / 6 | 9 |
| Operational health · AD-09 | `2333:797215` | Proposal | 9 / 1 / 7 / 2 | 9 / 9 | 11 of 575 | 25 / 3 | 0 |
| Assistant settings · AI-06 | `2393:852796` | Proposal | 10 / 1 / 9 / 2 | 11 / 11 | 12 of 610 | 30 / 0 | 8 |
| Migration & cutover · AD-06 | `2438:893312` | Proposal | 13 / 1 / 5 / 2 | 7 / 13 | 64 of 524 | 38 / 2 | 0 |
| **Customer portal** | | | | | | | |
| Portal home & access · CP-01 | `2105:659722` | Accepted | 16 / 1 / 12 / 4 | 0 / 2 | 323 of 574 | 53 / 0 | 20 |
| Support requests · CP-02 | `2179:85` | Proposal | 15 / 2 / 17 / 7 | 0 / 0 | 283 of 638 | 3 / 0 | 11 |
| Project updates · CP-03 | `2179:237` | Proposal | 16 / 1 / 8 / 4 | 0 / 0 | 171 of 721 | 3 / 0 | 8 |
| Equipment & reports · CP-04 | `2199:85` | Proposal | 15 / 1 / 9 / 5 | 0 / 0 | 248 of 545 | 0 / 0 | 12 |
| Customer knowledge · CP-05 | `2244:41313` | Proposal | 13 / 1 / 9 / 6 | 0 / 0 | 277 of 555 | 0 / 0 | 9 |
| Quotations & account · CP-06 | `2281:149` | Proposal | 12 / 1 / 9 / 4 | 0 / 0 | 786 of 954 | 827 / 67 | 5 |

## Appendix B: R7 results by page

Measured read-only after R7 on 25 October 2026. "Before" is the stage 1 measurement of 24 October, which still included the top-bar copies replaced under R2. Every page now has no opaque token-valued fill left unbound and no exactly matching text left without a style.

| Page | Node | Unstyled text (before → after) | Unbound token-value fills (before, all → after, opaque) | Semi-transparent token fills left | Off-palette fills left |
|---|---|---|---|---|---|
| Material demand · SC-01 | `2089:529958` | 498 → 442 | 491 → 0 | 29 | 30 |
| Quotations & account · CP-06 | `2281:149` | 786 → 749 | 827 → 0 | 0 | 0 |
| Answer evidence · AI-03 | `2389:273553` | 30 → 12 | 838 → 0 | 23 | 0 |
| Proposal review · AI-02 | `2389:278889` | 58 → 14 | 20 → 0 | 20 | 0 |
| Voice capture · AI-05 | `2394:866287` | 117 → 108 | 589 → 0 | 14 | 0 |
| Drafting & domain help · AI-04 | `2393:864503` | 324 → 283 | 339 → 0 | 14 | 1 |
| Recurring checks · AI-07 | `2403:47777` | 37 → 10 | 45 → 0 | 45 | 0 |
| My account and preferences · SH-03 · SH-05 · EC-02 | `2105:638399` | 14 → 13 | 55 → 0 | 55 | 42 |
| Search · SH-04 | `2105:638924` | 21 → 20 | 17 → 0 | 13 | 0 |
| Pipeline insights · CR-04 | `2336:155` | 11 → 10 | 1022 → 0 | 982 | 677 |
| Sales aftercare · CR-05 | `2294:85` | 24 → 23 | 17 → 0 | 17 | 0 |
| Product publication · PD-02 | `2393:864572` | 11 → 10 | 8 → 0 | 8 | 0 |
| Product pricing · PD-03 | `2393:859137` | 11 → 10 | 6 → 0 | 6 | 0 |
| Product compatibility · PD-04 | `2393:868573` | 11 → 10 | 786 → 0 | 6 | 0 |
| Catalogue import · PD-05 | `2404:211` | 11 → 10 | 10 → 0 | 10 | 0 |
| Estimate detail · ES-01 | `2244:733125` | 11 → 10 | 0 → 0 | 0 | 0 |
| Sales brief page · CR-02 | `2245:736961` | 36 → 14 | 0 → 0 | 0 | 25 |
| ES-08 · Screen Configurator Workbench | `406:2` | 202 → 145 | 32 → 0 | 31 | 270 |
| Quotation release · ES-05 | `2244:50245` | 33 → 14 | 0 → 0 | 0 | 0 |
| Quotation page & customer views · ES-05 | `2221:85` | 29 → 13 | 5 → 0 | 5 | 0 |
| Customer response · ES-06 | `2244:50787` | 34 → 15 | 0 → 0 | 0 | 0 |
| Estimate review · ES-04 | `2244:734679` | 33 → 32 | 0 → 0 | 0 | 0 |
| Reference cases & calibration · ES-10 | `2244:48064` | 21 → 10 | 28 → 0 | 28 | 0 |
| Estimate-to-actual review · ES-09 | `2244:50439` | 13 → 10 | 16 → 0 | 16 | 0 |
| Rules studio · rule sets, derived values & tables · ES-02 · ES-03 | `2315:792701` | 161 → 10 | 63 → 0 | 63 | 2 |
| Design basis & interfaces · EN-02 | `2091:552579` | 11 → 10 | 45 → 0 | 45 | 0 |
| Drawings & controlled documents · EN-03 | `2091:592460` | 597 → 437 | 40 → 0 | 40 | 0 |
| Technical queries · EN-04 | `2091:586789` | 30 → 7 | 85 → 0 | 54 | 2 |
| Materials & substitutions · EN-06 | `2092:1424` | 687 → 160 | 563 → 0 | 22 | 15 |
| Technical reviews · EN-05 | `2091:595141` | 139 → 78 | 157 → 0 | 42 | 33 |
| Change review · EN-07 | `2097:583371` | 14 → 13 | 5 → 0 | 5 | 32 |
| Commissioning & as-built · EN-08 | `2091:542313` | 104 → 68 | 143 → 0 | 31 | 28 |
| Risks & issues · PJ-04 | `2097:630918` | 39 → 24 | 640 → 0 | 38 | 0 |
| Subcontractor packages · PJ-06 | `2097:655149` | 49 → 38 | 58 → 0 | 54 | 2 |
| Acceptance & closeout · PJ-09 | `2097:6900` | 23 → 22 | 30 → 0 | 30 | 29 |
| Capacity review · PL-03 | `2244:50314` | 19 → 18 | 39 → 0 | 39 | 0 |
| Site readiness · FI-05 | `2336:85` | 79 → 66 | 0 → 0 | 0 | 0 |
| Service agreements · MA-01 · MA-02 | `2089:548670` | 11 → 10 | 54 → 0 | 54 | 0 |
| Maintenance · MA-03 · MA-04 | `2091:545925` | 29 → 13 | 264 → 0 | 40 | 3 |
| Warranty cases · MA-06 · MA-07 | `2089:15560` | 56 → 12 | 33 → 0 | 24 | 30 |
| Purchasing · SC-02 | `2089:544463` | 502 → 139 | 628 → 0 | 32 | 30 |
| Inbound shipments · SC-03 | `2089:531469` | 195 → 68 | 286 → 0 | 16 | 0 |
| Kitting and controller preparation · CX-02 | `2044:488208` | 133 → 67 | 122 → 0 | 16 | 4 |
| Bench testing and returned units · CX-02 | `2083:82` | 118 → 67 | 110 → 0 | 13 | 3 |
| Returns & claims · SC-08 | `2089:527625` | 179 → 61 | 154 → 0 | 17 | 30 |
| Dispatch & delivery · SC-06 · SC-07 | `2089:15629` | 75 → 35 | 31 → 0 | 22 | 8 |
| Service stock · SC-10 | `2091:539160` | 345 → 123 | 345 → 0 | 25 | 79 |
| Finance handoffs · FN-01 | `2091:592837` | 14 → 13 | 116 → 0 | 55 | 27 |
| Customer accounts · FN-02 | `2097:606288` | 44 → 43 | 42 → 0 | 42 | 0 |
| Claims & obligations · FN-04 | `2097:611315` | 0 → 0 | 194 → 0 | 61 | 1 |
| Measure definitions · FN-06 | `2105:626649` | 11 → 10 | 66 → 0 | 66 | 0 |
| Reports overview · RP-01 | `2199:595` | 13 → 10 | 70 → 0 | 42 | 0 |
| Sales performance · RP-02 | `2404:876863` | 13 → 12 | 36 → 0 | 36 | 19 |
| Service performance · RP-04 | `2411:33278` | 11 → 10 | 1166 → 0 | 39 | 0 |
| Supply & Finance trust · RP-05 | `2410:885569` | 37 → 36 | 42 → 0 | 42 | 0 |
| Delivery performance · RP-03 | `2413:127` | 809 → 56 | 1087 → 0 | 22 | 0 |
| Account development · CS-07 | `2302:786940` | 11 → 10 | 32 → 0 | 32 | 0 |
| Stakeholders · CS-03 | `2288:761` | 11 → 10 | 21 → 0 | 21 | 0 |
| Equipment · EQ-01 | `2089:526174` | 263 → 250 | 404 → 0 | 26 | 4 |
| Test instruments & calibration · EQ-09 | `2089:536153` | 39 → 18 | 723 → 0 | 24 | 5 |
| Bulletins & lifecycle · EQ-06 · EQ-07 | `2280:85` | 184 → 193 | 158 → 0 | 33 | 7 |
| Configuration backups · EQ-08 | `2278:452` | 54 → 38 | 72 → 0 | 27 | 2 |
| Knowledge · DK-04 | `2200:833` | 54 → 12 | 27 → 0 | 27 | 0 |
| Knowledge authoring · DK-05 | `2244:734610` | 82 → 16 | 43 → 0 | 43 | 0 |
| Mappings & reconciliation · AD-05 | `2097:685460` | 30 → 16 | 45 → 0 | 37 | 2 |
| Integrations · AD-04 | `2097:678714` | 11 → 10 | 31 → 0 | 22 | 36 |
| Data quality · AD-03 | `2097:614223` | 76 → 51 | 90 → 0 | 46 | 3 |
| Audit history · AD-07 | `2097:668418` | 28 → 27 | 36 → 0 | 30 | 6 |
| Operational health · AD-09 | `2333:797215` | 11 → 10 | 25 → 0 | 22 | 3 |
| Assistant settings · AI-06 | `2393:852796` | 12 → 11 | 30 → 0 | 30 | 0 |
| Migration & cutover · AD-06 | `2438:893312` | 64 → 63 | 38 → 0 | 36 | 2 |
| Support requests · CP-02 | `2179:85` | 283 → 243 | 3 → 0 | 2 | 0 |
| Project updates · CP-03 | `2179:237` | 171 → 161 | 3 → 0 | 3 | 0 |
| Equipment & reports · CP-04 | `2199:85` | 248 → 177 | 0 → 0 | 0 | 0 |
| Customer knowledge · CP-05 | `2244:41313` | 277 → 271 | 0 → 0 | 0 | 0 |
