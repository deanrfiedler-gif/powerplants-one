---
document_id: PPO-SHELL-PHONE-REGISTER-PATTERNS-DEC
title: Phone register patterns amendment
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; named Figma version saved 1 November 2026; application not built; owner visual review, device testing and deployment separate
versioning: git
---

# Phone register patterns amendment — owner decision

One item had stayed open since the early pages: "phone multi-select on most registers (not drawn)". On 31 October 2026 Dean asked Claude to design and build one shared pattern in Figma, covering multi-select, bulk actions and list actions on phone registers, demonstrated on Leads, Work orders and the My Work Updates inbox. Claude drew it, and audited and polished it twice at his request. On 1 November 2026 Dean accepted it.

This record states the adopted rules, what his acceptance covers, where the design is drawn and what is not yet done. It extends the [Phone header amendment](phone-header-amendment.md) for phone registers. No application code changes here.

## 1. Dean's words

Quoted as written:

1. 31 October 2026: "Your task is to design and build a shared "Phone register patterns" amendment in Figma, covering multi-select, bulk actions and list actions on phone registers, as a proposal for my review."
2. 31 October 2026, twice: "Give the pages an audit and polish" and "Give the pages one more final audit and polish", each to determine improvements, new and innovative features, whether the pages could be more professional, and any gaps.
3. 1 November 2026, asked "Do you accept the amendment with the recommended answers to Q1–Q17?": "Accept recommendations" — recorded as accepting the drawn design and adopting every recommended answer in section 4.
4. 1 November 2026: "I have saved the named version as Phone register patterns amendment — accepted"

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| One shared pattern; both ways in; selection bar; action bar of at most three; confirmation sheet; per-record results; recovery through the original operation; swipe only where a page defines it; no selection without bulk actions; never invent a bulk action | User decision | Dean's brief, 31 October 2026 |
| Rules PR1–PR17, decisions D1–D24 and answers Q1–Q17 | Claude's recommendations, adopted | Quote 3 |
| Acceptance of the drawn design | User decision | Quotes 3 and 4; the version is recorded on Dean's word, and Claude did not open the version history |
| Bulk actions listed in the affected-registers table | Read from source: documented decision or code. Not new decisions | Section 6 |
| Long press 550 ms, moving 10 px cancels, Shift+Space | Existing application behaviour on the Work orders phone row | `src/components/work-order-register.tsx` |
| Per-notice results, Next page unavailable while selecting, a sequence with a summary, Undo, share sheet, export history | Adopted design direction, not built and not verified | Sections 4 and 8 |

## 3. Rules PR1–PR17, as adopted

| Rule | Subject | Text |
|---|---|---|
| PR1 | Who gets it | Only a register whose source defines a bulk action. Any other register has no More, no Select and no selection on long press. Actions are read from the page's record and code, never invented. |
| PR2 | Entering | Long press a row (550 ms, as the Work orders app row does), with a light vibration where the phone supports it, or More, then Select, which needs no long press. Long press selects that row; Select starts with none selected. |
| PR3 | Where More sits | The compact list header has no More today (P2). On a register with bulk actions the page-action slot holds More. Where that slot held search, search and filter combine, as P7 does at 320. Never more than three icons. |
| PR4 | Selection bar | The header row becomes: "3 selected", Select all on this page (Select all at 320, same accessible name), Done. Menu, view chooser, Conversations and Filter leave until Done. |
| PR5 | Rows | A 44 px checkbox leads each row and the whole row toggles it. A tap toggles and does not open. The chevron goes. Selected rows are tinted and ticked, never colour alone. |
| PR6 | Bottom action bar | Replaces the tab bar and Quick add. At most three actions visible; any others go under More, in the desktop's order. Disabled, with its label kept, until one row is selected. At large text sizes the bar folds into one Actions button. Today no drawn register needs More. |
| PR7 | Reach of a selection | This page only. Select all never reaches beyond the loaded page and never selects a record you can't see. Changing page, view or filter clears the selection, and the bar says so before you do. |
| PR8 | Confirmation sheet | An action that changes a record or makes a file opens a sheet saying exactly what changes and on how many, with each record listed. Two exceptions: Open in sequence, which changes nothing, and Mark read and Mark unread, which reverse in one tap. |
| PR9 | Results | One row per record with its outcome in words and the source's own reason. Nothing is skipped silently. What can be known in advance is shown on the sheet, before anything is sent. Where the action has an existing reverse, Undo sits in the result line. |
| PR10 | Uncertain outcomes | If the result can't be confirmed, say so. Recovery is the same original operation on the same records. Never assume success, and never retry without being asked. |
| PR11 | Quick actions | Swipe only where a page defines it, only for a reversible action, and always also in the row's menu. Never swipe-only. Today only Updates defines it: Mark read and Mark unread. |
| PR12 | Done and access | Done clears the selection and restores the header and tab bar. Focus returns to what started selection: the row (or the next row if it has gone), or More. Count changes are announced. Targets 44 px; any input 16 px text. |
| PR13 | Back and scrolling | Back, by gesture or browser, ends selection first and never leaves the page with a selection open. Scrolling never selects: moving more than 10 px cancels a long press. |
| PR14 | Long sheets, short phones | A sheet never grows past the screen less the header row. Its records scroll and its buttons stay. Many real 320 px phones are 568 px tall. Bars and sheets respect the phone's safe area. |
| PR15 | Views and groups | Selection belongs to a view: only a view with actions offers Select, so Owned escalations and Preferences have none. A group band spans the checkbox column, and a group action sits in its band. |
| PR16 | Wording and empties | Counts are singular at one ("Archive 1 notice"). With no rows, More leaves out Select. An action the person's role can't use isn't shown. A result line stays until the next action, so it is never a passing toast. |
| PR17 | Live changes | Pull-to-refresh pauses while selecting, because a refresh clears the selection today. A row that changes or goes while selected stays in the count and gets its own result row. Nothing leaves a selection silently. |

## 4. Questions, with the answers adopted

| Question | Answer adopted |
|---|---|
| Q1 Long press, the Select action, or both? | Both. Select is the accessible route; long press is the fast one |
| Q2 Should Select all reach beyond the loaded page? | No. It would select records you cannot see |
| Q3 Are swipe actions wanted at all? | Yes, on Updates only, for Mark read and Mark unread. PR11 holds for any later page. Frames Q1 and Q2 govern; the other Updates frames keep their chevrons until the page is built |
| Q4 Which registers adopt it first? | Updates inbox (it needs the server change), then Work orders (long press exists), then Leads with its L7 actions, then the others as each page is next changed, as P9 does |
| Q5 Is More in the page-action slot right, given it holds only Select today? | Yes |
| Q6 Should Open in sequence skip the sheet? | Yes. This differs from the brief's wording, which gave every bulk action a sheet |
| Q7 Should Mark read and Mark unread have a sheet? | No. Both reverse in one tap and the app applies them directly today. This also differs from the brief. No Mark read sheet is drawn |
| Q8 Change `notifications/state` to report per notice? | Yes, when Updates is built |
| Q9 Next page unavailable while selecting, or clear silently as today? | Unavailable, with the words in S1 |
| Q10 Do Materials and Output adopt, and what of My jobs? | Materials and Output yes, with the code's actions, recorded when next changed. My jobs gets no selection until Dean names its actions |
| Q11 Undo in the result line, using the existing Restore? | Yes (I1) |
| Q12 Select by read state? | Later (I2) |
| Q13 Drag down the checkboxes to select a range? | Later, after device testing (I3) |
| Q14 Hand exports to the phone's share sheet? | Yes, tested on real phones, with Save as the fallback (I4) |
| Q15 Should an export leave a trace in history? | Yes, a decision for the app build. An export records nothing today |
| Q16 Keep a selection through an interruption? | Yes, for that session only, rechecked on return. Not drawn |
| Q17 Tap the count to review only what is selected? | Yes (I5) |

## 5. Design reference

| Reference | Identity |
|---|---|
| Design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Phone register patterns · amendment" `3036:32928`, under "— System —" after "Phone header amendment" |
| Declaration, rules and new parts | Page header `3036:32929`; rules `3040:11906`; instances of the new parts `3036:38330` |
| Register flows | Leads `3036:32982`, Work orders `3036:38325`, Updates inbox `3036:38326`: list, long press, More then Select, selection, confirmation sheet, partial result and Done, at 390 and 320 |
| Completing a selection | `3044:37382`: Open in sequence on Work orders (C1–C3) and Leads (C6–C8); export finished (C4, C5) |
| Quick actions and no bulk actions | `3036:38327`: swipe `3040:9254`, the same action in the row's menu `3040:9439`, My actions `3040:9611`, each also at 320 |
| Affected registers | Table `3040:23619` |
| Accessibility | `3036:38329`: focus order, announced count, focus return; path table `3041:18282` |
| States | `3036:32989`: S1 page boundary, S2 refused for some, S3 offline, S4 outcome unknown, S5 nothing selected, S6 long selection, S7 Grouped changes, S8 Archived, S9 offline per action, S10 short phone, S11 landscape, S12 text at 200%, S13 no rows |
| Ideas | `3044:39915`: I1, I4 and I5 adopted; I2 and I3 later |
| Decisions and answers | D1–D24 `3041:18392`, Q1–Q17 `3041:18474`, audit card `3045:28186`, in section `3036:32993` |
| Prototype | Flow "Phone register patterns — phone" starts at `3038:6205`. Links cover the 390 frames only |
| New components | On Components `1:4` › Shell and navigation `1095:257404` since the named version: Shell / Phone header · selection `3036:38343`, Phone action bar `3036:38353`, Phone action bar / Item `3036:38352`, Phone row checkbox `3047:24512`, Phone sheet heading `3047:24513`, Phone status line `3047:24519`, Phone result row `3036:38374`, Phone menu row `3036:38381`. "(proposed)" was dropped from their names |
| Named version | "Phone register patterns amendment — accepted", saved by Dean on 1 November 2026, before the lock-in pass in section 8 |
| Captures | [phone-register-patterns-r01](../reference/ui/application-shell/phone-register-patterns-r01/README.md): thirteen icon-free images; copies on "Captures (icon-free)" `115:2` under the heading "Phone register patterns amendment r01" |
| File index | Row `3093:580733` in the System table of the File index |

## 6. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The shared application shell on phone widths (below 768 px). No page, route, scope ID, capability or parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Shared shell pattern; no page type changes. Register / worklist with a multi-select action panel keeps its type; on the phone the panel becomes the selection bar and the bottom action bar |
| Reused components | Shell / Phone header · compact `1530:110`, Grid / Checkbox `74:47`, Grid / List row (phone, proposed) `2651:7385`, Tag `3:13`, Button `3:41`, v2 / Tab bar (phone) `107:149`, Shell / Quick add (phone) `38:342`, Lead list row `197:1184`, Work order list row `196:24594`, Activity list row `408:431`, Icons on Components `1:4` |
| Incoming handovers | None. A register supplies its rows, its page and its bulk actions; the pattern reads them |
| Outgoing handovers | Each action hands to what it already calls: Open in sequence to the record, Export list to a CSV file, Open source workflow to the source, and notice state to `notifications/state` |
| Source authority | [Phone header amendment](phone-header-amendment.md) P1–P9; [Leads design](leads-design.md) L7; [Work orders design](work-orders-design.md) W6; [My Work page design](my-work-page-design.md) R2; `src/components/leads-desktop-list.tsx`; `src/components/work-order-register.tsx`; `src/components/notification-workspace.tsx`; `src/notifications/service.ts` |
| Departures | Section 7 |

### Affected registers

The table `3040:23619` lists 70 registers: 14 with bulk actions from source, 2 with bulk actions in code only (Materials & substitutions, Output, issue and distribution), 1 undecided (My jobs), 47 with none and 6 with no record to read from. The full table is capture 08. "No record" is not a No, and "silent" means a record was searched for bulk, selection and checkbox wording and says nothing.

Change review EN-07 (Export N selected (CSV)) and Time & labour review FI-01 (Accept together) have bulk actions on desktop but no phone list drawn, so they aren't listed. They adopt this pattern if a phone list is drawn.

The actions drawn, read from source:

| Register | Actions | Source |
|---|---|---|
| Leads | Open in sequence, Export list (CSV) | [Leads design](leads-design.md) L7, frame `190:21123`. The app shows only the count and Clear selection (`leads-desktop-list.tsx:576`) |
| Work orders | Open in sequence, Export list | [Work orders design](work-orders-design.md) W6; `work-order-register.tsx:693` |
| Updates inbox | Mark selected read, Mark selected unread, Archive selected (Restore selected in Archived); in Grouped changes, Mark displayed group read | [My Work page design](my-work-page-design.md) R2; `notification-workspace.tsx:593` and `:641` |

## 7. What changes, and what it amends

| Record | What changes |
|---|---|
| [Phone header amendment](phone-header-amendment.md) P2 | On a register with bulk actions, the one page action is More. On Updates, search and filter combine at 390 as P7 does at 320, to free that slot |
| [Phone header amendment](phone-header-amendment.md) P6 | The status line also carries the result of a bulk action |
| Dean's 19 October 2026 phone button rule (main actions are full-width 48 px buttons) | The selection action bar uses icon-over-word items, because three full-width buttons don't fit at 320. The sheets and the sequence bar keep 48 px buttons |
| [Work orders design](work-orders-design.md), [Projects register design](projects-register-design.md) "press and hold, not drawn" | Now drawn, by this pattern. The other records that left phone multi-select open follow it when each page is next changed |
| Application: Open in sequence | Today it opens the first selected record. The adopted design is a sequence with a position, Next and a summary (C1–C3, C6–C8) |
| Application: `changeNotices` | Today it runs one transaction, so one refusal refuses all and changes nothing. Q8 adopts per-notice results. Until then, Updates frame 06 cannot happen |
| Application: page changes | Today a page change clears the selection. Q9 adopts Next page unavailable while selecting, with the words in S1 |
| Application: Grouped changes | The code titles a band by its first notice. The design names the band by the shared source and shortens the action to Mark group read (Mark read at 320) |

Unchanged: the desktop and tablet panels, the tab bar outside selection, and every existing reference. S1 uses an illustrative longer view of 27 work orders over 2 pages; the accepted page shows 12.

## 8. Figma lock-in pass

Made on 1 November 2026, after Dean said the named version was saved:

- **Library.** The eight new parts moved to Components `1:4` › Shell and navigation by `appendChild`. Node IDs were kept, and 1,306 instances stay linked across their variants. Nothing overlaps or sits outside the section. The frame `3036:38330` on the amendment page now shows instances.
- **Records in the file.** The page header reads Accepted with the named version, and File index row `3093:580733` names it.
- **Captures predate this pass.** They were made before the named version, so capture 01 reads "Named version waits" and capture 02 shows the parts on the amendment page. Their bytes stay as retained.

## 9. Not done

- **Application.** Nothing is built, and this record authorises no build. Adoption follows Q4.
- **Prototype.** It has not been played in Present. Its links were checked by reading them: all stay on the page, and they cover the 390 frames only.
- **Real phones.** Nothing has been tried on one. Long press may trigger the browser's own text selection or link menu on iPhone or Android. Landscape and 200% text are proposals, not measurements.
- **The table.** Its "No" rows rest on a keyword search of records and code, not a full reading of each page.
- **Considered and left out:** selecting across pages; swipe to archive; asking Carl to act on a selection, which would be a new bulk action and remains Dean's to propose.

## 10. Verification

Checked in Figma on 31 October and 1 November 2026, all by script and screenshot, none on a device:

- All 70 frame IDs in the table exist and are phone frames.
- A search of component code found no bulk action missing from the table.
- No overlaps, and nothing outside its section.
- Every prototype link stays on the page.
- Colours on drawn frames use tokens. The 200% text state overrides font sizes on purpose, so its text carries no text style.
- Tappable parts checked are 44 px or larger; neutral tags remain visible on the selected tint; rows hold their height on entering selection.
- After the move to Components, the Updates section and the parts frame were compared by eye with the earlier render. A byte comparison was not made: the script that would have taken it timed out, though its move had landed.

## 11. Boundaries

This record authorises no business transaction, production integration, customer communication, migration, permission or capability change. A Figma design is not a production claim. Owner visual review of the application and deployment are separate.
