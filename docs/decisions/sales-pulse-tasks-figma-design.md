---
document_id: PPO-SH02-SALES-PULSE-TASKS-FIGMA-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Owner-accepted design; changing the built pages and UI baseline acceptance separate
source_commit: 1fc002978ee2a6871121d9252609a49c6dc31b9a
versioning: git
---

# Sales Pulse and Tasks design — owner decision

On 31 October 2026 Dean asked for the design of these pages: "Your task is to design and build the Sales "Pulse" and "Tasks" pages (/sales/pulse and /sales/tasks) in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude read the built pages and drew them in Figma.

Dean then asked for an audit: "Give the pages an audit and polish". It compared the drawing with the code and corrected four errors of Claude's own (section 7). Asked whether to draw the recommended refinements and gaps, Dean answered: "Draw R1–R5 and G1–G7".

Asked "Do you accept the Pulse and Tasks proposal with its recommended answers?", Dean answered: "Accept, lock in". That adopts D1–D28 and the recommended answers to Q1–Q12.

Claude drew the pages from these sources:
- the built pages and reads: `src/components/sales-navigation-views.tsx`, `src/activities/work-overview.ts`, `src/crm/planning-gaps.ts`, `src/activities/components/client/my-work-dialogs.tsx`, `my-work-forms.tsx`, `my-work-list.tsx`, `src/components/business-ui.tsx` and `src/shell/navigation.ts`;
- the [My Work design](my-work-page-design.md) and its [Sales overview](my-work-sales-overview-integration.md) and [phone](my-work-sales-mobile-r07-integration.md) integrations;
- the [Leads design](leads-design.md) (L9, L10), the [Calling design](calling-and-caller-id-design.md) and the [phone header amendment](phone-header-amendment.md);
- Dean's owner review of 9 October 2026, which marked Tasks "Refine".

Scope:
- Routes `/sales/pulse` and `/sales/tasks`, register entries `route:/sales/pulse` (related `scope:CR-04`, module CR) and `route:/sales/tasks` (related `scope:SH-02`, module SH), both served by `SalesWorkView`. The Figma page is named SH-02 as briefed (Q10). No scope is added.
- No parent requirement ID is added or renamed; all 78 remain. The pages elaborate CRM-02 and CRM-03.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed or deployment, and it changes no hosted authority. Every record, person, call and date shown is synthetic.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design the Pulse and Tasks pages | User decision, 31 October 2026 | Dean's request quoted above |
| Audit and polish | User decision, 31 October 2026 | Quoted above. Section 7 |
| Draw R1–R5 and G1–G7 | User decision, 31 October 2026 | "Draw R1–R5 and G1–G7" |
| Decisions D1–D28 | Accepted as drawn, 1 November 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Should Pulse be the Sales landing page instead of Deals? | Resolved as recommended | No. Deals stays the Sales primary page, as `src/shell/navigation.ts` has it. A personal start page can be decided later |
| Q2 Keep Tasks as its own item, or fold it into My actions? | Resolved as recommended | Keep the rail item, as a filtered view of the same records |
| Q3 Should Calls to log appear in Pulse? | Resolved as recommended | Yes, the same section as Calling, the person's own calls only |
| Q4 Which Deal attention signals matter most? | Resolved as recommended | In order: no next activity; overdue next action; close date passed; moved 3 or more times. Rotting stays out, as it was not adopted on the Deal record |
| Q5 Who gets "Owner: Everyone" on Tasks? | Resolved as recommended | Mine for all; Everyone only with `activity.edit`, as Team queue requires. The server already accepts `owner=all` |
| Q6 Is "Moved 3 times" worth a new read? | Resolved as recommended | Drawn now. Build "close date passed" first, and add moves when the deal-snapshot read behind Pipeline insights is built |
| Q7 Pulse upcoming actions as a count, or all rows? | Resolved as recommended | Count and link (D7) |
| Q8 Upcoming meetings window | Resolved as recommended | Next 7 days, linked meetings only |
| Q9 Priya Shah's organisation differs | Resolved as recommended | SYN Hillview Growers on Calling and SYN Northbank Nursery on Leads. This page keeps Calling's wording; correct Calling when it is next changed |
| Q10 Register relates Pulse to CR-04, and its page guide describes a Board and List | Resolved as recommended | Keep the SH-02 page name and leave the IDs as they are. The stale guide text is replaced in this change (section 6) |
| Q11 My Work on the Sales rail (My Work Q4, still open) | Resolved as recommended | Leave it out. Pulse carries an "All my work" link and the phone bar has My Work |
| Q12 Should Deal attention show value and expected close? | Resolved as recommended | Yes. It needs both fields added to two reads. **Not yet drawn:** the accepted frames and captures show the fields the reads return today (section 6) |
| Corrections made before acceptance | Claude's audit, disclosed here | Section 7 |
| Named Figma version | Not yet saved | "Sales Pulse & Tasks — accepted" awaits Dean. Section 8 |
| Changing the built pages | Not decided | Section 6 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Sales Pulse & Tasks · SH-02" `2966:12981`, first under "— Sales —", before Leads `190:20237`. The page header `2966:12982` holds the conformance declaration; the notes card `2976:6179` holds D1–D28, Q1–Q12 and what is not drawn. File index: the row "Row / Sales Pulse & Tasks · SH-02" `3093:508970`, first in the Sales group |
| Desktop 1440, Pulse | Full length `2968:152`; activity window `2969:710`; Record outcome `2970:1112`; outcome saved `2991:8652`; outcome saved, next activity not saved `2991:9266`; Plan activity `2972:3150`; Plan next from a row `2991:10781`; jump from the summary `2988:8020`; outside access `2970:1299`; deals-only person `2970:1436` |
| Desktop 1440, Tasks | List `2971:1719`; filtered to overdue `2971:2421`; Reschedule `2972:2692`; can no longer be changed `2991:9906`; newer saved version `2991:10367`; Set a date `2992:15009`; Owner menu `2992:12645`; Filters panel `2992:12710`; Owner: Everyone `2992:10365`; activity window, owner completes `2992:11556`; Next page `2992:13517` |
| Tablet 1024 | Pulse, rail collapsed and columns stacked `2973:3230` |
| Phone 390 | Pulse `2973:3975`; all sections open `2988:8634`; calls source down `2990:9494`; Activity `2974:4555`; Record outcome sheet `2989:6984`; Plan activity sheet `2989:7243`; Reschedule sheet `2989:7346`; Tasks `2973:4382`; Choose view `2990:8804`; filter panel `2989:7420`; states S9 `2990:7391`, S10 `2990:7691`, S11 `2990:7971`, S12 `2990:8249`, S13 `2990:8527` |
| Phone 320 | Pulse `2973:4541`; Record outcome sheet `2989:7114`; Tasks `2973:4895`; search and filter `2989:7517` |
| States | S1 loading `2975:4519`; S2 nothing due, "You're up to date" `2975:5143`; S3 could not load `2975:5744`; S4 partial `2975:6343`; S5 stale `2975:6922`; S6 no active tasks `2975:7502`; S7 leads-only person `2975:8121`; S8 long lists and long names `2988:7194`; S14 calls source down `2990:8856`; S16 filtered, nothing matches `2992:12902`; row, control and keyboard states `2993:14096` |
| Page parts | Pulse / Action row `2985:6303` (Default, Hover, Focus, Touch); Pulse / Deal attention row, whose Desktop variant is `2967:167` (Desktop, Phone); Icon/solid/heart-pulse `2967:126`; Icon/solid/clipboard-check `2967:130`. They stay on this page until another page needs them |
| Prototype | Flows "Pulse — desktop" from `2968:152` and "Pulse — phone" from `2973:3975`. Summary cells scroll to their sections. Row, ring, Plan next, rail, Owner, Filters and sheet links run between the frames. No link leaves the page |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 AEST, signed in as Dean Fiedler, matching Pipeline insights. Two deals have no next activity: Glasshouse climate renewal and Climate and dosing integration. LED propagation lighting moved three times (+56 days) and its date has passed. Deals-only frame: Kate Morgan. Leads-only frame: Alex Lee |
| Retained captures | [Sales Pulse and Tasks design r01](../reference/ui/crm/sales-pulse-tasks-design-r01/README.md): thirty icon-free PNGs with hashes. The copies were made on a temporary page and deleted after export |

## 3. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | `route:/sales/pulse` and `route:/sales/tasks`, `SalesWorkView`; parents CRM-02 and CRM-03; Figma page name SH-02 (Q10) |
| Page type (r20) | Pulse: Overview / dashboard. Tasks: Register / worklist. Activity window: Record detail. Record outcome, Plan activity and Reschedule: Form / guided workflow. Phone: overview and list, with a full-screen record and sheets |
| Reused components | Rail · Sales (L9), Shell / Top bar `35:138` (linked, with Conversations), Shell / Phone header · compact `1530:110`, the Sales phone bar and Quick add (L10). My Work / Summary cell, Group row, Side row, Activity grid row and header, Activity list row (phone), Grid / Done cell, activity window `413:1812`, Record outcome dialog `413:92879` and phone Activity `414:2309`. The Calling section `2127:689244` and outage notice `2127:690503`. Controls / Form field, Controls / Choice option, Button and Tag. New: the page parts in section 2 |
| Source authority | The code and decisions listed above. Dean's 9 October review. The fixture is synthetic |
| Incoming handover | The Sales rail (Pulse, Tasks); the Deal record's open work and Open in My Work; notification and search links to an activity. Arriving creates no business record |
| Outgoing handover | Open deal to the Deal record `879:44`; open lead to the Lead record `224:2`; open activity to the activity window; All my work to My Work `404:2`; Pipeline insights `2336:155`, never repeated here; Activities to the Calendar `1511:396797`; Log and Skip to Calling `2125:688373`. Outcomes and dates are saved on the original activity |
| Exceptions and recovery | Loading, nothing due, could not load, partial, stale, no access, leads-only, deals-only, filtered-empty, source outage, next activity not saved, can no longer be changed, newer saved version and view-only rows are drawn. A count that cannot be read shows a dash, never zero |
| Departures | Section 5 |
| Verification | Section 8 |

## 4. Decisions accepted as drawn

| ID | Decision | Basis |
|---|---|---|
| D1 | Same records, same dialogs; no second task store | `SalesWorkView` reuses `ActivityRow` and `useWorkDialogs` |
| D2 | Pulse has no side menu, reviews, waiting, updates, schedule or weather | The built page has none, and they are My Work's |
| D3 | Two scopes, shown as two sets. Actions go by activity owner; Deal attention goes by deal owner. So Dean's overdue action on Kate Morgan's deal is in his Deal actions, and on Kate's Deal attention "with Dean Fiedler" | `listWork` and `src/crm/planning-gaps.ts` |
| D4 | Every count states its rule. Overdue, today, no next activity, meetings and calls are never added together. "Due today 3" is lead plus deal actions under one rule. A count that cannot be read shows a dash, never zero | My Work display rules |
| D5 | Item actions. At rest an activity row shows the done ring and "…"; Record outcome and Plan next appear on hover and focus, and stay visible on touch screens. Plan next on an activity row adds a linked follow-up and never moves the record's next action, so it cannot hide an overdue action. Only Record outcome, or Plan on a deal with no next activity, sets that pointer, and only for the record's owner. A deal with no next activity has Plan next and Open deal. A deal whose action is someone else's has Open action and Open deal. Calls have Log and Skip. A meeting has Open | My Work R1; built `can_plan`; R1 of the audit |
| D6 | The row title opens the activity window over Pulse. Plan next is added to the window footer | Departure from `413:1812` |
| D7 | Pulse rows are overdue and today; upcoming is a count with a link | Pulse stays a short daily read; 9 October pagination finding |
| D8 | Deal attention rows use only what the reads return: organisation, stage, contact and time without a next action; on overdue rows the action, its due date and its owner. References are not shown, because Deals and Pipeline insights show none and none is invented | `PlanningGap`, `OverdueOpportunity`. See Q12 |
| D9 | Proposed signal: "Close date passed" and "Moved 3 times" on LED propagation lighting. No chart or list is repeated; the row links to Pipeline insights | Values match Pipeline insights. Needs expected close and deal snapshots |
| D10 | Upcoming meetings: Meeting activities you own, linked to a lead or deal, next 7 days. They also count within upcoming actions, so the two are not added. An Outlook meeting shows only if linked | The built line says "upcoming work" but has no section |
| D11 | Calls to log is the Calling section, your own calls only, and is absent until Calling stages 1b and 1c are built | Calling Q4 |
| D12 | Tasks lists `activity_type = Task` only. Calls and meetings stay on Pulse and Activities | Built |
| D13 | Tasks takes the Leads register pattern: side menu for due views and linked type, Owner and Linked filters, My Work grid, no checkbox, one grid grouped by due. Fixes the 9 October findings: no pagination without tasks, no empty sub-tabs, zone stated once | My Work R2 and R5; Leads |
| D14 | Reschedule uses the built dialog's fields, words and required reason. An undated task's "…" says Set date | `RescheduleForm` |
| D15 | Plan activity is the built form with the deal preset. Only the entry point from Pulse is new. It says "this deal" where the built hint says "opportunity" and a number | `ActivityFormDialog` |
| D16 | Access: the exact built message; lead sections need lead access, deal sections deal access | `SalesWorkView`; `navigation.ts` |
| D17 | Phone: Pulse has stacked sections and no summary strip; a row opens the activity screen, which holds Plan next, Reschedule and Complete. Tasks is the My Work list. Sales bar with no tab current | L10; My Work phone |
| D18 | Story: Dean Fiedler, as on Pipeline insights. New synthetic activities and times without a next action are listed on the notes card. Existing references are unchanged. Dates count back from Deals' Thu 15 Oct, so one falls on Sat 17 Oct | Pipeline insights; Deals |
| D19 | Each group shows 5 rows, longest overdue first, then "Show all n". Deal attention keeps the built wording, "12 in your permitted scope; first 5 shown" | Audit R2 |
| D20 | Phone sections with nothing overdue or due today start collapsed. Calls to log opens itself when a source is down | Audit R3 |
| D21 | A summary cell jumps to its section and moves focus. The toolbar and strip stay pinned while the columns scroll | Audit R4 |
| D22 | Owner: Mine hides the Owner column, so Organisation is in view. Owner: Everyone shows it | Audit R5; departs from My Work R5 |
| D23 | Phone forms are full-screen sheets (✕ left, centred title, 48 px save, 16 px inputs) following Log call. Filters follow Deals' full-screen panel; at 320 px search and filter are one screen | Audit G1, G5 |
| D24 | Result wording is the built wording, except the newer-version sentence, which is new. After saving, the row leaves, counts update and the built message confirms | Audit G2; `OutcomeDialog` |
| D25 | On Everyone, others' rings are disabled ("Owner completes", or "View only" with no edit access). Complete is replaced by "Owner completes" in the window | Audit G3; built `can_complete`, `can_edit` |
| D26 | Owner choices are the built mine and all, labelled "Mine" and "Everyone I can see". Filters use built criteria. First page and Next page appear only beyond 25 tasks | Audit G4; `work-criteria.ts` |
| D27 | Calling R9 wording. The count stays, the cell says "May be missing calls", and the list never claims to be complete | Audit G6 |
| D28 | States, keyboard order and long-name rules are on the states sheet | Audit G7 |

## 5. Departures from today's pages

| Item | Today | Accepted design | Reason |
|---|---|---|---|
| Shell | The rail and header in use today | Sales rail (L9), linked top bar, compact phone header | Aligns with accepted pages |
| Pulse layout | Page heading, then a card per section | Toolbar, summary strip with labelled rules, two columns | A short daily read, distinct from My Work |
| Activity rows on Pulse | `ActivityRow`, all active rows paged at 25 | Quiet rows with hover actions, overdue and today only, capped at 5 | D5, D7, D19 |
| Plan next on a row | Offered only after Record outcome | Also on the row, as a linked follow-up | D5 |
| Deal attention rows | "number · title" links | Title, organisation, stage, contact and time without a next action | D8 |
| Close date signals | None | Proposed group, linking to Pipeline insights | D9 |
| Upcoming meetings | None | New section | D10 |
| Calls to log | None | The Calling section | D11; not built |
| Tasks | Lead tasks and Deal tasks cards, each paged | One grid grouped by due, with a side menu and an Owner filter | D13, D26 |
| Owner column | My Work R5 keeps it after Due | Hidden on Owner: Mine | D22 |

## 6. What follows, and what is not decided

- **Stale guide text:** this change replaces the Purpose and task text in the design pages and the draft `guides.json` articles for both routes, which described a Board, a List, a Forecast, an Archive and My Work views the routes do not have. The new text describes the built pages. The articles stay drafts.
- **Q12, not yet drawn:** value and expected close are accepted for Deal attention but need two reads extended. The frames and captures show today's fields. Drawing them is an amendment to this page, with a new capture revision.
- **Still Dean's decision:** R6, a 44 px hit area on the shared phone row's done ring, in its own change. New features F1 Start here, F2 Work through, F3 customer signals in Deal attention, F4 voice outcome on phone, F5 suggested next activity, F6 Reschedule presets and F7 saved views on Tasks. Each needs building and its own go-ahead.
- **Not decided:** changing the built pages, Calling stages 1b and 1c, and extending the reads.
- **Not drawn:** phone Plan activity and Reschedule at 320 px (same as 390), Skip reasons (Calling has them), Everyone on a phone.
- **Ready for dev:** not set. The Figma plugin refuses `devStatus`, so it needs the desktop app if the frames are to be marked.

## 7. Corrections made before acceptance

The audit compared the drawing with the code. These were Claude's errors, corrected before Dean accepted:
- Deal attention showed value, expected close and a total that the reads do not return. They were removed (Q12 now covers adding them).
- As first drawn, Plan next on a row could have moved a deal's next action while the overdue one stayed open, clearing the Overdue flag. It now adds a linked follow-up (D5).
- Plan activity and Reschedule did not match the built dialogs, and D15 wrongly said no separate form existed.
- Kate Morgan's overdue deal offered actions she cannot take, because the action is Dean's.

Polish in the same pass: design wording removed from page copy, purple annotation tags added to the full-length Pulse frame (review marks, not part of the page), redundant tags and a toolbar sentence removed, record names made links, phone buttons raised to 44 and 48 px, and one shared activity removed from Alex's frame.

## 8. Verification

| Check | Result |
|---|---|
| Layout audit | No frame overlaps another or sits outside its section |
| Prototype links | Every navigation link leads to a frame on the page; none to another page |
| Phone targets | No visible Button under 44 px on a phone frame. The shared phone row's 20 px done ring is R6, still open |
| Icon-free captures | 2,153 Font Awesome instances swapped for `Icon/placeholder` in the capture copies, and a recount found none left. All prototype links stripped from the copies. The temporary page was deleted after export |
| Retained bytes | The thirty PNGs and their SHA-256 hashes are listed in the [captures README](../reference/ui/crm/sales-pulse-tasks-design-r01/README.md) |
| Present mode | Not played. The summary-cell scroll links are set but untested |
| Named version | Not yet saved |
| Repository checks | Recorded in the pull request that adds this record |
