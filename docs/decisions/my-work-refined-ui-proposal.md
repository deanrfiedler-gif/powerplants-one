---
document_id: PPO-MYWORK-REFINED-FIGMA-PROP
date: 2026-11-10
owner: Dean Fiedler
status: Proposal awaiting Dean's acceptance; 139 sheets and boards drawn on 10 to 12 November 2026 in a private Figma file, with three additions Dean asked for on 11 November 2026 (the after-call card, the full-screen phone call log and voice notes); not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed or deployment; every record shown is synthetic
source_commit: f03d8618fe32b11153d26c19df7af6983bb65223
versioning: git
---

# My Work refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 10 November 2026 (drawn 10 and 11 November 2026) · **Status:** Proposal awaiting Dean's acceptance. Sections 1 to 8 are the proposal record, section 9 the audit, section 10 the three additions Dean asked for while the file was being drawn, and section 11 the audit items applied on 12 November 2026.

On 10 November 2026 Dean asked for the refined UI pages of **My Work** to be built in a new private Figma file he created for the purpose ("PPO - My Work module"), inside the accepted shell and to at least the standard of the Sales module file, following the My Work UI pages brief with Addendum A3 (persona and story reconciliation, as amended for My Work in section A3.8). He added: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach", so every question in the brief was taken at its stated default and is recorded here for his decision.

My Work is the coordination layer: the Overview, My actions, Reviews & handovers, Blocked & waiting, Team queue, Notifications and updates, and the shell destinations Search and Conversations, with Calls to log and the Log call sheet. Nothing drawn completes, approves, closes, answers or sends anything that belongs to a source page.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions Dean has to decide. It changes no code, test, migration, seed, permission or route. Acceptance of the design would not make the drawn pages an implementation baseline: source presence, visual review of the built pages, functional proof and deployment stay separate.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Shell (accepted)": "Shell refined · desktop shell and menus" and "Workspace menus · flyout and docked (accepted 8 November 2026)", including the "Docked · My Work" sheet | Chrome and geometry, copied as local components under their own names: top bar with Conversations 2 and Notifications 3, collapsed rail with My Work current and its pill, right strip, the docked My Work menu (one variant per current view), the collapsed 80 px strip, the Notifications popover and its empty state, the Conversations peek, the search dropdown (recent and results), the right drawer, the incoming call card, the Call / Control set and the record header toolbar |
| Private Figma file "PPO - Sales module (accepted)" | The Sales kit (status chip, button, avatar, checkbox, filter chip, tab, KPI tile), the icon set, the tablet top bar, the phone header, status bar and Sales tab bar, the page template and the helper library, copied under the same names |
| Private Figma file "PPO - Design", pages under "— My Work —" | Frozen reference for content and accepted rules: My Work (accepted 12 October 2026), Reviews & handovers (accepted 1 November 2026), Sales Pulse & Tasks (accepted 1 November 2026), Calling (accepted 23 October 2026), Conversations (threads proposal, T1 and T2 scopes) and the Search proposal of 23 October 2026 |
| [My Work page design](my-work-page-design.md) (PPO-MYWORK-PAGE-DESIGN-DEC) | R1 to R7, Q1 to Q5 and the display rules |
| [Reviews and handovers design](reviews-handovers-figma-design.md) (PPO-SH06-FIGMA-DEC) | D1 to D14, Q1 to Q11 |
| [Sales Pulse and Tasks design](sales-pulse-tasks-figma-design.md) (PPO-SH02-SALES-PULSE-TASKS-FIGMA-DEC) and [Pipeline insights design](pipeline-insights-figma-design.md) | Scopes Mine and Everyone I can see, counts with rules, a dash never zero |
| [Calling design](calling-figma-design.md) (PPO-CALLS-FIGMA-DEC) and [calling and caller ID](calling-and-caller-id-design.md) (PPO-CALLS-CALLER-ID-PROP) | Log call, Calls to log, Skip, Wrong number, the R9 outage rule, stages 1a and 1b |
| [AI communications threads](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP), [Conversations T1 scope](conversations-t1-scope.md), [T2 scope](conversations-t2-scope.md), [T1d design](conversations-t1d-design.md), [reply-by reminders](conversations-reply-by-reminders.md) | Threads, asks, mentions, Carl, the Waiting on you panel |
| [Shell refined concept design](shell-refined-concept-design.md) and its [rules](../design/development/systems/shell-refined-concept-rules.md) | R5, R10, R13, R16, R34, R40 to R44, R51, R69, R78, R81, R87, R89, R91, R97, R98, R101 |
| `src/shell/navigation.ts`, `src/activities/`, `src/calls/`, `src/conversations/`, `src/platform/permissions.ts`, `src/platform/view-targets.ts` and the notification modules | Routes, state words, capabilities (`activity.read`, `activity.edit`, `conversation.read`, `conversation.post`), call sources (ClickToCall, PhoneApp, Teams), saved-view targets |
| [Sales module refined UI proposal](sales-module-refined-ui-proposal.md) (PPO-SALES-REFINED-FIGMA-PROP) | The record structure this record mirrors |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [HTML module conformance](../standards/html-module-conformance.md), [readable reference namespaces](readable-reference-namespaces.md) | Naming, the nine-field declaration and r20 page types, the separation of acceptance from shipped values, `SYN-` references |

The file's link and key are not recorded in this public repository (ADR-0050, ADR-0053). Node IDs are recorded so each sheet can be opened from the file. The file is the one Dean named for the shared My Work domain; the design-to-build standard names no My Work domain file, and nothing in it was changed.

## 2. Conformance declaration

| Field | Declaration |
|---|---|
| Scope identity | SH-01 and SH-02 (`route:/work`, `route:/work/actions`, `route:/work/[id]`, `route:/work/new`, `route:/work/waiting`, `route:/work/team`), SH-03 (`route:/work/updates` and the bell), SH-04 (`route:/search` and the shell search field, a proposal until Dean accepts Search), SH-06 (`route:/work/reviews`), and SH for the shell destinations `route:/conversations` and `route:/conversations/[id]`, the Calls to log section and Log call (Calling stages 1a and 1b), the interaction-state boards and the administration sheets (`route:/work/settings`, proposed). No parent requirement ID is added or renamed; all 78 remain (SH-06: CRM-03, DOC-06, NFR-01, NFR-05, NFR-08, NFR-11; Calling: CRM-02, CRM-03, CRM-08, PAR-05, NFR-01, NFR-02, NFR-05, NFR-08, NFR-09; Search: BR-22, DOC-06, AT-01, C08) |
| Page types (r20) | Overview / dashboard (OV01, OV03, OV07 to OV10, TB01, TB09, PH01, PH06); Register / worklist (AC01, AC04, AC07, BW01, BW03, TQ01, NU02, NU05, NU06, SR04 and the phone lists); Record detail (AC05, PH04, the full-page thread CV01); Work queue + persistent detail (RH01 to RH08 at 728 + 376 px, SR03 list and preview, CV01 sidebar, thread and context panel); Form / guided workflow (AC06, PH15, CL02, PH07, PH07b); centred dialogs and 432 px right panels (the Dialogs and panels sections); states (the States sections); specification boards (ST01a to ST01f); settings hub and read-only registers (AD01 to AD08) |
| Reused components | Local copies of the accepted Shell components and the Sales kit, named as in their source files: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked · My Work (a variant per current view), Shell / Workspace menu · collapsed strip, Shell / Notifications popover and empty state, Shell / Conversations peek, Shell / Search recent and results, Shell / Right drawer, Shell / Incoming call card, Shell / Call / Control (ten states), the record header toolbar set and its phone component; Sales / Status chip, Button, Avatar, Checkbox, Filter chip, Tab, KPI tile; the icon set (Lucide stand-ins for Font Awesome Light, ADR-0050) with play and delete added on 11 November 2026; the "PPO colour" variable collection (66 variables) |
| Source authority | The accepted records listed in section 1, the brief's decisions D1 to D13 and Dean's three requests of 11 November 2026. The fixture is synthetic: Thursday 5 November 2026, 09:00 AEDT (Melbourne), signed in as Dean Fiedler, with persona sheets for Ravi Kumar, Avery Lin, Alex Morgan, Jamie Rossi, Jamie Park, Taylor Quinn, Casey Ward and Lee Nakamura as Addendum A3.8 sets them |
| Incoming handover | Items arrive from their sources with the module files' words (every module file's section 6.9) in four families: owned follow-ups (activities by due), reviews and approvals routed by SH-06, Waiting on others and Waiting on you, and rule-based nudges and alerts, each naming its rule and its source; plus call events To log (Calling) and conversation asks, mentions and Carl's turns (migrations 0108, 0110). Reading an item creates no business record |
| Outgoing handover | Record outcome, Reschedule, Set date, Plan next and Cancel activity on the person's own activities (the activity service owns activities, outcomes and reschedules); Follow up on a waiting item (the follow-up only); "Decide in", "Correct in" or "Open in [source page]" on every review and handover (each source page owns its reviews, handovers and waiting requests); Reply and No answer needed in a thread (Conversations owns threads, asks and Carl's turns); Log call and Skip (Calling owns call events), now also from the after-call card and the full-screen phone log; mark read and archive on notices (the notification projection owns notices); saved views and saved searches as criteria (the search service owns results and saved criteria). The Shell owns the popover, peek, dropdown, drawer and call card. My Work completes, approves, closes, answers and sends nothing (My Work R1; SH-06 D7; T1d; Calling R1) |
| Exceptions and recovery | Every count states its rule and a count that could not be read is a dash with "Unavailable" or "No access", never zero; "+" marks a partial count (My Work summary strip; Pulse D4; SH-06 D12; BP-01 20.1). Every view reads under the person's own capabilities; the Team queue needs `activity.edit` (BR-22; DOC-06; the My Work tests). Drawn states: loading, true-empty, filtered-empty, could not load, one source failed, not permitted, stale, partial counts, offline on the phone, new user, permission changed while open, Carl unavailable and an answer discarded, the call outage, a failed save, the microphone turned off |
| Departures | Section 5 |
| Verification | Section 6 |

## 3. Sheet inventory

Sheets are 1440 × 900 desktop frames unless their size says otherwise (full-length frames, 1024 × 768 tablets, 390 × 844 and 320 × 844 phones). Every scope page holds the six sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, and Flows and notes, in that order.

| Page | Read me and notes cards | Node |
|---|---|---|
| Read me | Header · Sheet index and notes · Audit · Page template | `85:2291` · `85:2322` · `85:2406` · `85:2447` |
| Flows and notes, one per scope page | OV · AC · RH · BW · TQ · NU · SR · CV · CL · ST · AD | `53:4976` · `62:5933` · `64:3803` · `65:2342` · `66:2258` · `71:4297` · `73:3568` · `75:3910` · `83:3473` · `80:1749` · `82:3760` |
| Shell and kit | Shell icons · Shell components · Build helpers · Shell · My Work chrome and overlays · Sales kit · Tablet and phone chrome | `3:2` · `3:18` · `11:11` · `14:11` · `40:432` · `44:436` |

Totals: 50 desktop sheets and boards, 27 dialogs and panels, 24 states, 11 tablet sheets and 27 phone sheets (21 at 390 px and 6 at 320 px: PH01-320, PH06-320, PH11-320, PH13-320, PH07b-320 and the touch-target board ST01f). TB11 and PH07b-320 were added on 12 November 2026 (section 11).

**My Work overview · SH-01 · SH-02** (19 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| OV01 | My Work overview — Today's focus, Dean Fiedler, full length (SH-01 · SH-02) | `route:/work` | Desktop | 1440×1234 | `49:8` |
| OV03 | My Work overview — Everyone I can see, Dean Fiedler with activity.edit (SH-01 · SH-02) | `route:/work` | Desktop | 1440×900 | `49:796` |
| OV07 | My Work overview — Ravi Kumar, Service coordinator (SH-01 · SH-02) | `route:/work` | Desktop | 1440×900 | `50:805` |
| OV08 | My Work overview — Avery Lin, Finance lead (SH-01 · SH-02) | `route:/work` | Desktop | 1440×900 | `50:1470` |
| OV09 | My Work overview — Alex Morgan, Engineering lead (SH-01 · SH-02) | `route:/work` | Desktop | 1440×900 | `50:2041` |
| OV10 | My Work overview — Jamie Rossi, project manager Glasshouse 4 (SH-01 · SH-02) | `route:/work` | Desktop | 1440×900 | `50:2599` |
| OV02 | About this count — Waiting on others, right panel over the Overview (SH-01) | `route:/work` | Dialog or panel | 1440×900 | `51:2129` |
| OV06 | Needs a next activity — expanded with Plan next, right panel over the Overview (SH-01 · SH-02) | `route:/work` | Dialog or panel | 1440×900 | `51:2501` |
| X09 | Customise overview — panel order and hidden panels, saved per person (SH-01) | `route:/work` | Dialog or panel | 1440×900 | `51:2901` |
| OV04 | Overview — a source unavailable: Service requests could not be read (SH-01) | `route:/work` | State | 1440×900 | `51:3370` |
| OV05 | Overview — new user, first sign-in: no counts, Notifications empty, no Favourites (SH-01) | `route:/work` | State | 1440×900 | `51:4075` |
| PS01 | Overview — loading: no counts are shown until every source is read (SH-01) | `route:/work` | State | 1440×900 | `51:4374` |
| TB01 | My Work overview at 1024 — Dean Fiedler, full length (SH-01) | `route:/work` | Tablet 1024 | 1024×952 | `52:4149` |
| TB09 | My Work overview at 1024 — Ravi Kumar, Service coordinator (SH-01) | `route:/work` | Tablet 1024 | 1024×768 | `52:4636` |
| PH01 | My Work overview — phone, Dean Fiedler, Sales bar, full length (SH-01) | `route:/work` | Phone | 390×1397 | `52:5016` |
| PH06 | My Work overview — phone, Casey Ward, technician bar, 4 unsent items, full length (SH-01) | `route:/work` | Phone | 390×1104 | `52:5238` |
| PH01-320 | My Work overview — phone 320, Dean Fiedler (SH-01) | `route:/work` | Phone | 320×1397 | `52:5421` |
| PH06-320 | My Work overview — phone 320, Casey Ward (SH-01) | `route:/work` | Phone | 320×1104 | `52:5625` |
| PH17 | Waiting to send — Casey Ward offline, 4 unsent items (SH-01) | `route:/work` | Phone | 390×844 | `52:5791` |

**My actions · SH-02** (22 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| AC01 | My actions — register, Mine, grouped by due, full length (SH-02) | `route:/work/actions` | Desktop | 1440×900 | `56:8` |
| AC04 | My actions — Everyone I can see, grouped by due with Owner after Due (SH-02) | `route:/work/actions` | Desktop | 1440×900 | `56:717` |
| AC05 | Activity window — /work/[id], Send revised proposal, with the record header toolbar (SH-02) | `route:/work/[id]` | Desktop | 1440×900 | `56:1293` |
| AC07 | My actions — collapsed 80 px strip, Compact density, window title "(3) My Work · Powerplants One" (SH-02) | `route:/work/actions` | Desktop | 1440×900 | `56:1630` |
| AC06 | New activity — /work/new, the shared create form; Save is not Complete (SH-02) | `route:/work/new` | Desktop | 1440×1061 | `62:3932` |
| AC02 | Record outcome — the overdue task, What happened? required, What happens next? defaults to Plan the next activity (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:1126` |
| AC02-F | Record outcome — could not save: nothing changed, the text is kept (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:1524` |
| AC03 | Reschedule with a reason — the Lakeside meeting 14:00 → 15:00 (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:1887` |
| X02 | Set date — Date needed row, a reason is required (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:2260` |
| X03 | Cancel activity — a reason is required; the activity stays in History as Cancelled (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:2629` |
| X10 | Save view — criteria only, at most twelve per target, team sharing Not configured (SH-05) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:2991` |
| X04 | Columns — order, visibility, widths and density for My actions (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:3366` |
| X05 | Filters — My actions (SH-02) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:3833` |
| X06 | Keyboard shortcuts — My Work (SH-01 to SH-06) | `route:/work/actions` | Dialog or panel | 1440×900 | `57:4227` |
| AC08a | My actions — filtered-empty, filters restated (SH-02) | `route:/work/actions` | State | 1440×900 | `62:4259` |
| AC08b | My actions — You're up to date, true-empty (SH-02) | `route:/work/actions` | State | 1440×900 | `62:4554` |
| PS02 | My actions — stale: an activity rescheduled by someone else while open (SH-02) | `route:/work/actions` | State | 1440×900 | `62:4834` |
| TB02 | My actions at 1024 — register, Mine, grouped by due (SH-02) | `route:/work/actions` | Tablet 1024 | 1024×768 | `62:5191` |
| PH02 | My actions — phone list grouped by due (SH-02) | `route:/work/actions` | Phone | 390×844 | `62:5584` |
| PH03 | Record outcome — phone full-screen sheet, 60 px header, one sticky primary (SH-02) | `route:/work/actions` | Phone | 390×844 | `62:5728` |
| PH04 | Activity window — phone, sticky action bar, full length (SH-02) | `route:/work/[id]` | Phone | 390×844 | `62:5782` |
| PH15 | New activity — phone full-screen sheet (SH-02) | `route:/work/new` | Phone | 390×844 | `62:5865` |

**Reviews and handovers · SH-06** (15 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| RH01 | Reviews & handovers — Owned reviews with the persistent pane on REP-02 v1, full length (SH-06) | `route:/work/reviews` | Desktop | 1440×900 | `63:8` |
| RH03 | Reviews & handovers — All permitted open tasks (24) by source in the Q3 order, full length (SH-06) | `route:/work/reviews` | Desktop | 1440×1528 | `64:1385` |
| RH04 | Reviews & handovers — Jamie Park: REP-02 v1 returned Wed 28 Oct, resubmitted Tue 3 Nov, now in Sent submissions (SH-06) | `route:/work/reviews` | Desktop | 1440×900 | `63:1295` |
| RH05 | Reviews & handovers — Handovers: Sent, Received and Accepted kept separate; Greenhill Berries over the 5-day limit (SH-06) | `route:/work/reviews` | Desktop | 1440×900 | `63:1598` |
| RH06 | Reviews & handovers — Historical outcomes, read only, with Sent submissions (SH-06) | `route:/work/reviews` | Desktop | 1440×900 | `63:1952` |
| RH08 | Reviews & handovers — collapsed strip, Lee Nakamura (viewer): No reviews need you (SH-06) | `route:/work/reviews` | Desktop | 1440×900 | `63:2341` |
| RH02 | Pane states — revision changed, no longer permitted, a source failed (SH-06) | `route:/work/reviews` | Dialog or panel | 1440×900 | `64:2202` |
| RH07 | Filters — Source module (eight), Type, Age, Due date; saved with the view (SH-06) | `route:/work/reviews` | Dialog or panel | 1440×900 | `64:2290` |
| RH-S1 | Reviews & handovers — loading: counts appear only when each source has been read (SH-06) | `route:/work/reviews` | State | 1440×900 | `64:2514` |
| RH-S2 | Reviews & handovers — one source failed: Finance handoffs not read, "+" on the total, a dash on its count (SH-06) | `route:/work/reviews` | State | 1440×900 | `64:2746` |
| RH-S3 | Reviews & handovers — Returned submissions, Dean: Nothing returned to you (SH-06) | `route:/work/reviews` | State | 1440×900 | `64:3000` |
| TB03 | Reviews & handovers at 1024 — the pane opens as an overlay (SH-06) | `route:/work/reviews` | Tablet 1024 | 1024×768 | `64:3207` |
| PH05 | Reviews & handovers — phone list, Owned reviews (SH-06) | `route:/work/reviews` | Phone | 390×844 | `64:3514` |
| PH05b | Reviews & handovers — phone item, Back to list returns to the same row (SH-06) | `route:/work/reviews` | Phone | 390×844 | `64:3649` |
| PH18 | More — phone sheet reaching Reviews, Waiting, Updates, Conversations and Search (SH-01 to SH-06) | Phone More sheet | Phone | 390×844 | `64:3697` |

**Blocked and waiting · SH-02** (8 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| BW01 | Blocked & waiting — next follow-up first, Dean Fiedler, full length (SH-02) | `route:/work/waiting` | Desktop | 1440×900 | `65:8` |
| BW03 | Blocked & waiting — Jamie Rossi: Waiting on customer and the module waiting sources (SH-02) | `route:/work/waiting` | Desktop | 1440×900 | `65:527` |
| BW02 | Follow up — updates the follow-up date and note only; the source workflow clears the request (SH-02) | `route:/work/waiting` | Dialog or panel | 1440×900 | `65:979` |
| BW04a | Blocked & waiting — a waiting source unavailable: Operational health not read (SH-02) | `route:/work/waiting` | State | 1440×900 | `65:1188` |
| BW04b | Blocked & waiting — an ask on a thread you can no longer read is neither listed nor counted (SH-02) | `route:/work/waiting` | State | 1440×900 | `65:1566` |
| TB04 | Blocked & waiting at 1024 (SH-02) | `route:/work/waiting` | Tablet 1024 | 1024×768 | `65:1877` |
| PH08 | Blocked & waiting — phone list (SH-02) | `route:/work/waiting` | Phone | 390×844 | `65:2157` |
| PH14 | Waiting on you — phone panel, at most two asks (Dean has one) (SH-02) | `route:/work/waiting` | Phone | 390×844 | `65:2280` |

**Team queue · SH-02** (5 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| TQ01 | Team queue — Everyone I can see, Sales team grouped by owner, full length (SH-02) | `route:/work/team` | Desktop | 1440×1332 | `66:8` |
| TQ02 | Reassign — proposed: the owner's consent is recorded; the code has no reassign command (SH-02) | `route:/work/team` | Dialog or panel | 1440×900 | `66:856` |
| TQ03 | Team queue — Not permitted for Lee Nakamura (viewer): Team queue needs activity.edit (SH-02) | `route:/work/team` | State | 1440×900 | `66:1402` |
| TB10 | Team queue at 1024 — grouped by owner (SH-02) | `route:/work/team` | Tablet 1024 | 1024×784 | `66:1688` |
| PH16 | Team queue — phone, Casey Ward: not on the phone and needs activity.edit (SH-02) | `route:/work/team` | Phone | 390×844 | `66:2188` |

**Notifications and updates · SH-03** (11 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| NU01 | Bell popover over the Overview — 3 unread, Owned work only (SH-03) | Shell bell over `route:/work` | Desktop | 1440×900 | `71:8` |
| NU02 | Updates & preferences — Inbox, the only bulk actions in My Work, full length (SH-03) | `route:/work/updates` | Desktop | 1440×1036 | `71:431` |
| NU05 | Updates & preferences — Grouped changes: 4 groups, each with its count and records (SH-03) | `route:/work/updates` | Desktop | 1440×982 | `71:1128` |
| NU06 | Updates & preferences — Owned escalations, Jamie Park: the Greenhill Berries handover 6 days over the 5-day limit (SH-03) | `route:/work/updates` | Desktop | 1440×900 | `71:1485` |
| NU03 | Notice detail — a conversation notice shows the reason and Open conversation, never the message text (SH-03) | `route:/work/updates` | Dialog or panel | 1440×900 | `71:1756` |
| X11 | Mark all read — confirm: marking read completes nothing (SH-03) | `route:/work/updates` | Dialog or panel | 1440×900 | `71:2152` |
| NU04a | Inbox — archive refused for required work (SH-03) | `route:/work/updates` | State | 1440×900 | `71:2531` |
| NU04b | Inbox — a notice for a thread you can no longer read is dropped, not listed and not counted (SH-03) | `route:/work/updates` | State | 1440×900 | `71:3057` |
| NU07 | Updates & preferences — the Preferences tab hands off to My account and preferences (Settings file) (SH-03 · SH-05) | `route:/work/updates` | State | 1440×900 | `71:3474` |
| TB05 | Updates & preferences at 1024 — Inbox (SH-03) | `route:/work/updates` | Tablet 1024 | 1024×768 | `71:3746` |
| PH09 | Updates — phone inbox (SH-03) | `route:/work/updates` | Phone | 390×844 | `71:4143` |

**Search · SH-04** (13 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| SR01 | Search — empty field focused: recently opened records, recent searches, actions; the field never moves (SH-04) | Shell search field | Desktop | 1440×900 | `73:8` |
| SR02a | Search — typing "glasshouse 4": best match, records with their type, actions (SH-04) | Shell search field | Desktop | 1440×900 | `73:451` |
| SR02b | Search — "#SYN-TKT-000212": the exact match first and already focused; Enter opens it (SH-04) | Shell search field | Desktop | 1440×900 | `73:938` |
| SR03 | Search results — /search, All types, three per type, the rail with nothing selected, full length (SH-04) | `route:/search` | Desktop | 1440×1560 | `73:1389` |
| SR04 | Search results — one type (Equipment), pages of 20, Hide closed on, the preview of SYN-AST-000214 (SH-04) | `route:/search` | Desktop | 1440×900 | `73:1900` |
| SR05 | Saved searches — criteria that run again with current access; one that can no longer run says why (SH-04 · SH-05) | `route:/search` | Dialog or panel | 1440×900 | `73:2261` |
| SR05b | Save this search — name and criteria (SH-04 · SH-05) | `route:/search` | Dialog or panel | 1440×900 | `73:2504` |
| SR06 | Search states — searching slowly, could not search, no results, one type failed (SH-04) | `route:/search` | State | 1440×900 | `73:2747` |
| SR07 | Search sources — built today and proposed, not searched today (SH-04) | `route:/search` | State | 1440×900 | `73:2829` |
| TB06 | Search results at 1024 — preview 380 px (SH-04) | `route:/search` | Tablet 1024 | 1024×768 | `73:2940` |
| PH10 | Search — phone full screen: the search row replaces the compact header (SH-04) | Shell search (phone) | Phone | 390×844 | `73:3218` |
| PH11 | Search results — phone, type chips (SH-04) | `route:/search` | Phone | 390×844 | `73:3301` |
| PH11-320 | Search results — phone 320: Search and filter, Show results (SH-04) | `route:/search` | Phone | 320×844 | `73:3441` |

**Conversations · SH** (17 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| CV01 | Conversations — All threads, the open thread on SYN-PRJ-000024 with the context panel, full length (SH) | `route:/conversations` | Desktop | 1440×1240 | `74:8` |
| CV02 | Thread with an ask — Dean replies; the reply answers the ask; No answer needed is the other way out (SH) | `route:/conversations/[id]` | Desktop | 1440×900 | `74:509` |
| CV03 | Carl tagged — Queued, Answering, Answered; a person sends every draft (SH) | `route:/conversations/[id]` | Desktop | 1440×900 | `74:917` |
| CV06 | Mention — Avery Lin on SYN-PRJ-000027 with a #SYN-INV-000356 link (SH) | `route:/conversations` | Desktop | 1440×900 | `74:987` |
| CV06b | Mention as Lee Nakamura (viewer): the #link to a record he cannot open reads "A record you can't open" (SH) | `route:/conversations` | Desktop | 1440×900 | `74:1296` |
| CV09 | Conversations peek over a page — unread 2, mentions; the badge counts on this icon only (SH) | Shell Conversations peek | Desktop | 1440×900 | `74:1538` |
| CV05 | Start a conversation — about a deal or project; any reader with conversation.post may start one (SH) | `route:/conversations` | Dialog or panel | 1440×900 | `75:1415` |
| CV07a | Make it a task — from a message; owner and due confirmed by the person (SH) | `route:/conversations` | Dialog or panel | 1440×900 | `75:1680` |
| CV07b | Mark as a decision — pins the words to the record's History with who decided (SH) | `route:/conversations` | Dialog or panel | 1440×900 | `75:1931` |
| CV08a | Add a participant — warned when earlier answers cite sources they cannot read (SH) | `route:/conversations` | Dialog or panel | 1440×900 | `75:2158` |
| CV08b | Mark resolved — the thread stays readable; open asks must be answered first (SH) | `route:/conversations` | Dialog or panel | 1440×900 | `75:2391` |
| CV04a | Carl unavailable — the provider is paused; the turn says so and people can still message (SH) | `route:/conversations` | State | 1440×900 | `75:2608` |
| CV04b | An answer discarded because a source's readers changed while Carl answered; retried once (SH) | `route:/conversations` | State | 1440×900 | `75:3008` |
| TB07 | Conversations at 1024 — list and thread; the context panel opens on demand (SH) | `route:/conversations` | Tablet 1024 | 1024×768 | `75:3433` |
| PH12 | Conversations — phone list with Waiting on you and Mentions (SH) | `route:/conversations` | Phone | 390×844 | `75:3682` |
| PH13 | Thread — phone, the ask and Reply; Carl labelled on every message (SH) | `route:/conversations/[id]` | Phone | 390×844 | `75:3798` |
| PH13-320 | Thread — phone 320, the ask and Reply (SH) | `route:/conversations/[id]` | Phone | 320×844 | `75:3854` |

**Calls to log · SH-02** (15 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| CL01 | Calls to log on the Overview — the 08:42 call, 3 matches: choose who; Log and Skip; the fifth summary cell (SH-02) | `route:/work` | Desktop | 1440×900 | `76:8` |
| CL06 | After-call card — the 08:42 call ended at 08:48; the card offers to log it without taking focus (SH-02) | Shell layer, any page | Desktop | 1440×900 | `81:2431` |
| CL02 | Log call — Record outcome plus Who, Linked to and Call; Who not chosen so Save says what is missing (SH-02) | `route:/work` | Dialog or panel | 1440×900 | `76:682` |
| CL03 | Skip call — Personal, Not business, Already logged or no reason; skips are deleted after 30 days (SH-02) | `route:/work` | Dialog or panel | 1440×900 | `76:1141` |
| CL04 | Log call — Wrong number: Number needs checking is ticked by default; the flag goes to the shared record (SH-02) | `route:/work` | State | 1440×900 | `76:1510` |
| CL05a | Outage — Teams calls could not be checked since 07:10; the count is partial (+) (SH-02) | `route:/work` | State | 1440×900 | `76:1936` |
| CL05b | Calls to log — empty after the 08:42 call was logged (SH-02) | `route:/work/actions` (Calls to log view) | State | 1440×900 | `76:2538` |
| CL07 | After-call card states — known person and a planned call, minimised, saved, save failed, no match, phone off (SH-02) | Shell layer, any page | State | 1440×900 | `81:2894` |
| CL08 | Voice note states — idle, recording, recorded, queued on the phone, microphone off, transcript not available (SH-02) | `route:/work` | State | 1440×900 | `83:3271` |
| TB08 | Log call at 1024 — the desktop dialog, two columns, over the Overview (SH-02) | `route:/work` | Tablet 1024 | 1024×768 | `76:2781` |
| TB11 | After-call card at 1024 — bottom right over the page (SH-02), added 12 November 2026 | Shell layer, any page | Tablet 1024 | 1024×768 | `100:2918` |
| PH07 | Log call — Casey Ward's 08:15 call to Jo Marsh about site access; 60 px header, close left, centred title, sticky primary, full length (SH-02) | `route:/work` | Phone | 390×1322 | `76:3131` |
| PH07b | Log your call — full screen when Casey Ward comes back to PPO at 08:18 after the 08:15 call in the phone app; Who known; duration Not known; full length (SH-02) | Phone, on return to PPO | Phone | 390×1188 | `83:3020` |
| PH07c | Log your call — recording a voice note; Save waits until the recording stops; full length (rule example) (SH-02) | Phone, on return to PPO | Phone | 390×1330 | `83:3128` |
| PH07b-320 | Log your call — phone 320, Casey Ward back in PPO at 08:18; fields stack, Later and Save share the sticky bar; full length (SH-02), added 12 November 2026 | Phone, on return to PPO | Phone | 320×1410 | `100:3272` |

**Interaction states · SH** (6 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| ST01a | Interaction states — the Item family: leading marks and row states (SH) | cross-cutting | Desktop | 1440×998 | `78:1127` |
| ST01b | Interaction states — summary cells, due and state chips, unread versus alert, pill and badge ramps (SH) | cross-cutting | Desktop | 1440×1198 | `78:1407` |
| ST01c | Interaction states — Call control, register rows, column headers, inline edit and checks-bar chips (SH) | cross-cutting | Desktop | 1440×1176 | `78:2119` |
| ST01d | Interaction states — buttons, checkbox, radio and toggle, the search listbox, keyboard order, address lookup (SH) | cross-cutting | Desktop | 1440×1470 | `80:810` |
| ST01e | Interaction states — contrast proof computed from the PPO colour variables (text 4.5:1, UI edges 3:1) (SH) | cross-cutting | Desktop | 1440×1606 | `80:1041` |
| ST01f | Touch targets and stacking at 320 — rows and buttons 44 px, inputs 16 px, actions stack (SH) | cross-cutting | Phone | 320×844 | `80:1639` |

**Administration · SH** (8 sheets)

| Code | Sheet | Route or scope | Kind | Size | Node |
|---|---|---|---|---|---|
| AD01 | My Work settings hub — what can be changed, by whom, at which scope (SH) | `route:/work/settings` (proposed) | Desktop | 1440×900 | `82:552` |
| AD02 | Attention and nudge rules — the catalogue; each defined by its module, shown here, never edited here, full length (SH) | `route:/work/settings` (proposed) | Desktop | 1440×1074 | `82:987` |
| AD03 | Overview panels and default view per role — Weather pending the provider ADR (SH) | `route:/work/settings` (proposed) | Desktop | 1440×900 | `82:1515` |
| AD04 | Notification categories and the bell rule — Owned work only on the bell; channels Not connected (SH) | `route:/work/settings` (proposed) | Desktop | 1440×900 | `82:1908` |
| AD05 | Personal saved views — at most twelve per target; criteria never records; team sharing Not configured (SH) | `route:/work/settings` (proposed) | Desktop | 1440×900 | `82:2262` |
| AD06 | Reviews & handovers sources — sixteen source pages in eight modules in the Q3 order; six built today, full length (SH-06) | `route:/work/settings` (proposed) | Desktop | 1440×914 | `82:2602` |
| AD07 | Conversations and Carl — who reads and posts; Carl off by default, Simulated, answer only, labelled every time (SH) | `route:/work/settings` (proposed) | Desktop | 1440×900 | `82:3064` |
| AD08 | Calling — stages 1a and 1b built; skips deleted after 30 days; the outage rule; numbers as entered; the after-call card preference (SH-02) | `route:/work/settings` (proposed) | Desktop | 1440×901 | `82:3386` |

## 4. Rules applied

- **Coordination only.** No Approve, Complete, Close, Resolve, Answer or Send control on any sheet. The done ring opens Record outcome and nothing completes without an outcome (R1); reviews carry only "Decide in", "Correct in" or "Open in [source page]" (SH-06 D7); waiting rows carry Follow up, which changes the follow-up and never the source; asks carry Reply, which opens the thread; calls carry Log, with Skip in the row menu; marking a notice read completes nothing and archiving required work is refused; Plan next never moves a record's next action (Pulse D5). The thread's own "Mark resolved" lives in its Actions menu on the Conversations page.
- **Counts.** Every count states its rule on hover and in About this count; counts are never added across rules; a count not read is a dash with Unavailable or No access, never zero; "+" marks a partial count; menu badges count items waiting for the person and hide at zero (R34); the rail pill is overdue plus due today (R5); the bell counts unread Owned work only; the Conversations badge counts unread asks and mentions on that icon only (threads D7); the window title carries the unread count (R97).
- **Permission before display.** Every view reads under the person's own capabilities; Not permitted and Unavailable are distinct from empty; the Team queue needs `activity.edit`; a notice or ask on a thread the person can no longer read is neither listed nor counted; search lists and counts only records the person can open; a `#` link to a record the reader cannot open reads "A record you can't open"; Carl uses only what every participant can see.
- **Item family.** One 56 px two-line row for every item (activity, review, handover, waiting item, ask, notice, call event, search result, thread): leading mark, title and linked record, state and due or age words with the source, one action, the row menu. Every item says where it came from and where it clears.
- **Register standard.** One line per cell with an ellipsis and sideways scroll; done ring at the row start; no selection column except the Inbox; Owner after Due; row actions on hover and focus; column reorder and resize, inline edit on the person's own Title, Due and Owner, and the never-editable reasons, as specified on ST01c. Address lookup is not used in My Work.
- **Shell geometry.** Top bar 48, rail 80, docked My Work menu 280 or the 80 px strip, right strip 48 (none on the Overview, R13); dialogs 560 to 720 px over a 32 % navy scrim; right panels 432 px at x 960 without a scrim; tablet 1024 × 768 with the docked menu never docked (R87); phone 390 × 844 with 44 px targets and 16 px inputs, stacking at 320.
- **Language and time.** Australian English; 24-hour times; "Thu 5 Nov 2026" and "Thu 5 Nov 2026, 11:40"; the zone once per list (AEDT; Block C site facts in Australia/Brisbane); "2 days overdue · due Tue 3 Nov 17:00"; review ages in calendar days; working days only where the source rule says so; phone numbers as entered; `SYN-` references only; Carl labelled "Carl · AI assistant" with "Simulated".

## 5. Assumptions and proposed departures

Each item is for Dean's decision. The recommendation in every case is to keep it as drawn unless he says otherwise. A15 was withdrawn during the build (PH14 now shows Dean's single ask).

| ID | Assumption or departure |
|---|---|
| A1 | The viewer's own zone: Dean is in Melbourne, so lists say AEDT once; the accepted My Work page drew Brisbane (brief Q2 default) |
| A2 | Persona sheets draw only the badges the module files state; other personas' bell and Conversations badges are not drawn |
| A3 | Activity titles and due times that A3.8 gives only as counts are synthetic wording matched to their sources |
| A4 | Casey Ward's day follows A3.8 (Woodhaven pump service 09:30, Hillview 13:00 to 16:00, the pack to acknowledge), not the brief's "three visits · Hillcrest check" |
| A5 | The new-user sheet uses the neutral name "New user" |
| A6 | Rows in Today's focus carry one Record outcome button; Reschedule and Plan next sit in the row menu, as on the registers |
| A7 | AC01 shows the docked menu open so the current view and its count are visible; 6.4 opens My actions collapsed by default, drawn on AC07 |
| A8 | The Activity window relabels the accepted toolbar's Draft state (Open; primary Record outcome; Outputs hidden) |
| A9 | Activity kinds are written in words (Customer contact, Relationship review, Technical follow-up) |
| A10 | "Completed or cancelled this week 19" for everyone is a synthetic total beside Dean's 7 |
| A11 | Reviews & handovers moves its six views into a 208 px side menu inside the page while the docked menu stays closed, keeping 728 + 376 px at 1440; with the collapsed strip (RH08) the queue narrows |
| A12 | Item names and people in the Service, Engineering and Estimating rows of All permitted are synthetic wording; the counts are A3.8's |
| A13 | SYN-EXP-000052 is listed under Report definitions in Owned reviews and under Settings in All permitted, as the brief states both |
| A14 | Next follow-up dates on Blocked & waiting are synthetic |
| A16 | Kate Morgan's, Sasha Clarke's and Tom Reid's activity titles are synthetic, built to A3.8's counts and the Sales file's deals |
| A17 | Reassign is drawn as a proposal (TQ02, brief Q7 default): the code has no reassign command |
| A18 | The six read notices of yesterday and the grouped-change entries are synthetic, drawn from the module stories |
| A19 | The popover's Mentions tab shows no count because mentions belong to the Conversations icon (T1d D7) |
| A20 | The search dropdown keeps the accepted Shell component (one Records group with the type in each row, best match first); groups of three per type apply on `/search` (departure from SH-04 D3 in the dropdown only) |
| A21 | SYN-OPP-000226 and SYN-PRJ-000014 titles are synthetic |
| A22 | Equipment shows strong matches in the dropdown and "20+" on `/search`, where every asset at the Glasshouse 4 site matches |
| A23 | Carl is the assistant's name in threads, as the accepted threads records fix it; no person is called Carl |
| A24 | Dean's reply text, Jess Wong's, Morgan Lee's and Kate Morgan's messages and the CV05 draft are synthetic |
| A25 | "Mark resolved" is the thread's own command in its Actions menu; My Work never resolves anything |
| A26 | Casey's 08:15 call went through the phone app, so PPO knows its start and her return at 08:18, not its duration |
| A27 | The Log call dialog is two columns at 720 px so it fits 900 and 768 without scrolling the page (TB08 scrolls its body) |
| A28 | PH07 is drawn online; offline, Save keeps the call on the phone and the unsent-items banner counts it |
| A29 | The purple dashed annotation markers on CL01 and CL06 are review notes, not UI |
| A30 | Hover and pressed are drawn one and two steps darker with an 8 % and 16 % shade over the kit fill; the exact tokens are the kit's to set |
| A31 | The stale examples on ST01 use synthetic changes by Kate Morgan, Jamie Park and Sasha Clarke at 08:58 |
| A32 | The window-title ramp shows the unread notice count, as R97 states |
| A33 | Dean and Casey each chose Later on their after-call prompts, so both calls are still To log at 09:00 |
| A34 | The 10:30 to 10:41 call in CL07 is a rule example later than the story time |
| A35 | A planned Call activity matches a call when it is for the same person or record and starts within two hours either side of the call |
| A36 | The administration sheets sit under My Work › Updates & preferences › My Work settings; the Settings workspace owns organisation-wide changes and is linked, not drawn |
| A37 | AD02 lists each rule under the module whose section 6.9 sends that kind of item; the rule wording, day counts and recipients are summarised from the brief and the module files remain the authority |
| A38 | The source page names Inspections, Monthly reviews, Project updates and "Exports, backups and bulletins" are this file's working names; RH03 groups the same items |
| A39 | The role defaults in AD03 are proposed starting points |
| A40 | Stage 1c and stage 4 contents are as the Calling decision defines; only stages 1a and 1b are built |
| A41 | Voice notes are limited to 5 minutes and one per call log |
| A42 | The play and delete icons were added to the kit from the Lucide set the kit already follows |

Proposed departures and earlier fixtures, also for Dean's decision:

- **Reviews & handovers reads 4 for Dean** against the Shell docked menu's 3, which is a stand-in (brief Q3 default).
- **Search and Conversations are drawn in this file** as shell destinations the code maps to My Work (Q5 default); Search stays a proposal until Dean accepts it.
- **"Date needed" and "No due date"** are kept per accepted page (Q4 default); alignment is raised in section 9.
- **The Preferences tab hands off** to My account and preferences in the Settings file (NU07); nothing of that page is drawn here.
- **Reassign** (TQ02) and the **Everyone I can see** recount (OV03, AC04) are drawn as proposals (Q7, Q10 defaults).
- **The technician phone quick actions** My jobs, My time and Van stock are drawn as proposed beside the salesperson's Emails, Leads and Tasks (Q9 default).
- **The Waiting on you panel and the fifth summary cell** (Calls to log) are drawn as accepted amendments (T1d 3.3; Calling D5).
- **The persona queues of Addendum A3.8** replace the earlier fixtures: Sasha Clarke's 12 October queue, Dean's 13 October reviews, Robin Hale's search story, Jamie Park's calling story and the "LED propagation lighting" deal; the module files' counts that A3.8 corrected are listed for alignment in section 8.
- **The Call / Control set** is a local copy; **Carl** is the assistant, and the Settings file's "Carl" note refers to a person on the My account page (Q6 default).
- **Calls to log and Log call** are drawn as accepted (stage 1a and 1b), stating that stage 1c has not built a screen (Q8 default).
- **The `/work/settings` hub** (AD01) is a proposed route.
- **The after-call card, the full-screen phone call log and voice notes** (section 10) are new surfaces Dean asked for on 11 November 2026, awaiting his acceptance.

## 6. Verification

Every sheet was rendered after its batch where its layout was new, and the defects found were fixed before the next batch: phone tab bars showing the wrong current item, a record header without padding, register tables that collapsed to one row inside a hugging wrap, a clipped full-length queue, a loose temporary frame, a forbidden control label ("Close" became "Done"), invented or unsafe data, overflowing radio and checkbox labels, and a dialog taller than the tablet frame.

On 11 November 2026 a scripted pass read every scope page:

- **Structural pass.** Every sheet carries a label with its code. No sheet sits outside its section and no child sits outside its sheet; the 27 dialog and state sheets that cloned a full-length backdrop had their bodies trimmed. Roboto is the only font family, no table cell text is taller than one line, and nothing is loose at page level. Separator, Shell and kit and Scratch pages hold only what they should.
- **Position audit.** No overlap between sheets, labels or sections on any page. Sections are stacked 360 px apart and refitted with 60 px padding. Unused sections carry an "About this section" note.
- **Counts scan.** Every summary strip, docked-menu badge and rail pill was read from the file. They matched the brief's section 9 and Addendum A3.8 in every case:
  - Dean: 1 · 3 · 2 · 1 · 1, menu 6 · 4 · 2, pill 4.
  - Everyone I can see: 2 · 9 · 2 · 1 · 1.
  - Ravi Kumar: 2 · 6 · 4 · — · 0, menu 8 · 6 · 4, pill 8.
  - Avery Lin: 0 · 3 · 5 · — · 0, menu 3 · 7 · 5, pill 3.
  - Alex Morgan: 1 · 1 · 3 · — · 0, pill 2.
  - Jamie Rossi: 1 · 2 · 3 · — · 0, pill 3.
  - Casey Ward: 0 · 3 · 1 · 1.
  - The outage example reads "1+".
  - One inconsistency was found and fixed: AC08b ("You're up to date") hid the My actions badge but kept the pill.
- **Contrast.** ST01e computes 34 text and edge pairs from the "PPO colour" variables, including the six avatar colours and the unread marker. 33 pass. White text on brand/green-deep is 3.57:1, below 4.5:1 (finding C6).
- **Story scan.** No leftover Shell sample text, no withdrawn reference and no unsafe data were found.
- **Capability and authority scan.** The forbidden-word scan over every text found one hit: the activity title "Send revised proposal", which is a title and not a control. The Team queue is denied where `activity.edit` is absent (TQ03, PH16).
- **Repository checks:** `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

Limits:

- This is a visual proposal. There are no prototype links and no screen-reader testing.
- The renders were spot checks of new layouts, not a final render of all 139 sheets.
- The scan read the strip, menu and pill counts. It did not read every in-page count, such as view tiles and group bands, which were checked by eye as each batch was built.

## 7. Not drawn and open questions

Not drawn:

- Dark mode.
- Prototype links.
- The phone Team queue (not on the phone by rule).
- Incoming calls and their after-call prompt (Calling stage 2).
- The tablet and 320 px variants of the after-call card and Log your call.
- Team sharing of saved views beyond its Not configured label.
- The Settings workspace pages that own organisation-wide settings.
- The module pages the items link to.

Open questions, with the repository's numbers where they exist:

- **My Work:** Q1, the weather provider ADR; Q2, the "No next activity" rule (`next_action_state = 'Needed'`).
- **Earlier decisions:** SH-06 Q1 to Q11 as they stand; SH-04 D1 to D14 and Q1 to Q7 until Dean accepts Search; threads Q1 to Q12 beyond Q1 to Q5; the reply-by reminder option (A, B or C); delivery channels (D-025); delegation and leave cover (D-002); Teams calling and synchronisation; team sharing of views; dark mode.
- **Raised by this file:**
  - Q-CL1: which call source will report the end of a desktop call.
  - Q-CL2: the two-hour window for matching a planned call.
  - Q-CL3: push notification for the phone log once push is connected.
  - Q-CL4: where voice-note audio is stored and for how long.
  - Q-CL5: whether a voice note is ever transcribed, and by which provider (an ADR).
  - Q-AD1: the sixteen source page names.
  - Q-AD2: the role defaults.
  - Q-AD3: whether the after-call preference is per person only.
  - Q-AD4: duplicates Q-CL4.

## 8. Boundary and next steps

This record authorises nothing in the application: no code, route, migration, permission, capability, scheduler or integration. Every count in the file is a synthetic placeholder computed by hand from the module stories.

There are no integrations with Teams, email, push, SMS, a weather provider, a speech-to-text provider or an AI provider beyond the simulated adapter, and none is authorised.

Next steps:

1. Dean reviews the file, decides the A-list and the departures in section 5 and the audit in section 9, and saves a named Figma version.
2. The design register and the page guidance in `docs/design/development/pages/` follow in their own reviewed change, with the exact sheet references.
3. The module files' section 6.9 lists and counts are aligned where Addendum A3.8 corrected them.
4. Further records follow Dean's decisions:
   - a Search decision record once he accepts Search;
   - Calling stage 1c's register entries;
   - a Calling amendment for the after-call card, the phone log and voice notes once he accepts them.

## 9. Audit — 11 November 2026

Every page was read against the brief's audit framework (first impression, usability, hierarchy, consistency, accessibility; whether a person can tell in one glance what is theirs, what waits on whom and where each item clears), the counts, capability and authority checks above, and the scenario list. The same findings are on the Read me audit card.

### 9.1 Corrections (C)

| ID | Finding | State |
|---|---|---|
| C1 | TQ02 had grown past 900 px when its backdrop was refitted | Fixed in the file |
| C2 | TB08's Log call was taller than the 1024 × 768 frame | Fixed: capped at 720 px with a scrolling body and a fixed footer |
| C3 | Radio and checkbox labels overflowed narrow columns | Fixed: the helper truncates them; four sheets refitted |
| C4 | 27 dialog and state sheets kept their backdrop's full-length body under the clip | Fixed: bodies trimmed |
| C5 | Casey's call duration had been assumed although the call ran in the phone app | Fixed: Not known, with an optional duration |
| C6 | White text on brand/green-deep is 3.57:1, below 4.5:1 | Narrowed on 12 November 2026: no My Work sheet places text on that fill; the only cases are the primary buttons of the accepted Shell record header toolbar, copied unchanged into the kit page. Open against the Shell file: keep text off that fill (brand/navy) or darken the token; Dean's decision |

### 9.2 Refinements (R)

- R1 one due word across My Work ("Date needed" for activities and "No due date" for reviews are kept per accepted page).
- R2 confirm the sixteen review source page names; RH03 shows Inspections as its own source page while AD06 uses the working names.
- R3 bind the hover and pressed shades (A30) to kit tokens.
- R4 draw tablet and 320 px variants of the after-call card and Log your call. Applied 12 November 2026 (TB11, PH07b-320).

### 9.3 Gaps (G)

- G1 incoming calls (stage 2) and their after-call prompt.
- G2 the source that reports the end of a desktop call (Teams call records, stage 3; Q-CL1).
- G3 voice-note storage and retention (Q-CL4) and any transcript provider (Q-CL5, an ADR).
- G4 the weather provider ADR (My Work Q1).
- G5 team sharing of saved views, dark mode and delivery channels (D-025).
- G6 the module files' section 6.9 lists and counts to align where A3.8 corrected them, outside this file.

### 9.4 New features (N), proposed

- N1 the after-call card on desktop (Dean, 11 November 2026).
- N2 the full-screen Log your call on the phone (Dean, 11 November 2026).
- N3 voice notes on every call log (Dean, 11 November 2026).
- N4 a matching planned call receives the outcome instead of a second activity (A35).
- N5 the "Carl could answer N of these questions" check (threads N1) and the owned Watch (N-N6), drawn on CV01 and CV05.
- N6 the `/work/settings` hub (AD01).

### 9.5 Polish (P)

- P1 remove the review annotation markers on CL01 and CL06 before acceptance.
- P2 AD08 is 901 px high; trim to 900. Applied 12 November 2026.
- P3 the search dropdown rows keep the Shell's original type icons; match them to the result types. Applied 12 November 2026.

### 9.6 Recommended order

1. C6, the contrast decision, raised against the Shell file.
2. Q-CL1, Q-CL4 and Q-CL5: the call-end source, voice-note storage and transcripts.
3. Accept or amend N1 to N3.
4. R2, the source page names.
5. R1, the due words.
6. R3.
7. The G items, into the next planning round.
8. P1, before a named version is accepted.

## 10. Additions Dean asked for on 11 November 2026

While the Calls to log page was being drawn, Dean added three requirements.

### 10.1 The after-call card

Dean wrote: "Pipedrive also has a feature where if a call number is linked to a contact, after the call is completed, the app automatically pops up after the call which then allows the user to log the call, enter any notes, details, etc. We will need to include a UI design for this feature also."

PPO's version keeps every Calling rule. Rules:

- It is a non-modal card in the Shell layer, bottom right on whatever page the person is on, that never takes focus.
- It appears only for the person who made or took the call, only when the number matches someone they can read, and only while "Ask me to log calls when they end" is on (default on, per person, AD08).
- Who is filled in when the call started from a person or the number matches exactly one permitted person; otherwise the person chooses (Calling D3). The Result is never guessed.
- Nothing is logged until the person saves. Later or Esc keeps the event To log as a pill; one card shows at a time; Undo is offered for 10 seconds after saving.
- When the call matches a planned Call activity, Save records the outcome on it instead of creating a second activity (A35).

Sheets: CL06, CL07.

### 10.2 The full-screen phone log

Dean wrote: "The after call log can be full screen on the mobile view, as the call will at most times be made via that native smartphone app, and not via the Powerplants One app."

On the phone, Click to call hands the number to the phone's own app. PPO cannot see the call or when it ends: the code names a PhoneApp call source, and whether it can report an end time is Q-CL1.

- **When it opens.** Log your call opens full screen when the person comes back to PPO, using the Calling D2 pattern: 60 px header, close left, centred title, sticky Later and Save.
- **Duration.** It reads Not known and can be added.
- **Calls made outside PPO.** Calls dialled in the phone app without PPO are not seen, and can be logged as a new Call activity.

Sheets: PH07b, PH07c, and PH07 as corrected (C5).

### 10.3 Voice notes

Dean wrote: "The user should also be able to record a voice note regarding the conversation."

A voice note is offered wherever notes are taken: the after-call card, Log call, and the phone log. Rules:

- **What it records.** The person records themself after the call, up to 5 minutes. PPO never records the call itself: recording a call needs the consent of the people on it and is out of scope.
- **Where it lives.** The note is kept with the Call activity and read by the same people.
- **Saving.** Save waits until a recording stops.
- **Offline.** On the phone the note waits with the unsent items.
- **Transcripts.** There is no transcript until a speech-to-text provider is chosen by ADR. Typed notes stay the searchable record.

States drawn on CL08 are idle, recording, recorded, queued offline, microphone off and transcript not available.

Storage and retention (Q-CL4) and any transcription (Q-CL5) are Dean's to decide. The [boundary](#8-boundary-and-next-steps) is unchanged: none of this authorises an integration, a storage location or a provider.

## 11. Audit items applied — 12 November 2026

After Dean marked the pull request ready for review and asked to continue, the audit items that need no decision of his were applied in the file. Everything that needs his judgement stayed open.

| Item | What changed | Node |
|---|---|---|
| R4 | TB11 draws the after-call card at 1024, bottom right over the Overview. PH07b-320 draws Log your call at 320: fields stack one per row, Save call and Later share the sticky bar, and every target stays at least 44 px | `100:2918`, `100:3272` |
| P2 | AD08 trimmed from 901 to 900 px | `82:3386` |
| P3 | Search dropdown rows now carry their result type's icon (project, deal, organisation, site, equipment, work order); recent searches show the history icon; the best-match glyphs show the project and the service request | SR01 `73:8`, SR02a `73:451`, SR02b `73:938` |
| C6 | A scan of every text on every page for white on brand/green-deep found none on a My Work sheet. The five cases are the primary buttons in the local copy of the accepted Shell record header toolbar, which no My Work sheet uses. The finding stays open against the Shell file | Shell and kit page |

The Calls to log notes card and the Read me index and audit cards were updated to match. Both new sheets were rendered and checked. The file now holds 139 sheets and boards.

Still for Dean: C6 against the Shell file; Q-CL1 to Q-CL5; acceptance of N1 to N3; R1 to R3; the G items; P1, the review annotations, which stay until he accepts the file.

