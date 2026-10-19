---
document_id: PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC
title: Phone header amendment
date: 2026-10-19
owner: Dean Fiedler
status: Owner-adopted rules; named Figma version saved and locked in on 19 October 2026; the application change built in PR #609 with owner review pending; the Emails · EC-01 and Customer messages · EC-04 swaps remain separate
versioning: git
---

# Phone header amendment — owner decision

On 19 October 2026, while reviewing the Calendar · EC-03 phone views, Dean asked for fewer boxes, buttons and rows at the top of phone screens, even if the main top bar had to go, and supplied Pipedrive mobile calendar screenshots for reference. The Emails · EC-01 and Customer messages · EC-04 phone views had already been simplified the same way in parallel sessions. Asked for a recommendation on Calendar question Q5, Claude recommended deciding it once, as a shell amendment for every phone page, and Dean adopted it.

This record states the adopted rules, where the design is drawn, and what is not yet done. It amends the [Shell top bar amendment](shell-top-bar-amendment.md) for phone widths only.

## 1. Dean's words

Quoted as written, 19 October 2026:

1. "Regarding the mobile phone view, I think we will need to reduce the number of boxes, buttons, features, etc., that are at the top of the screen to allow more room for the actual content that is being displayed on the screen. … This means you may have to remove the main top bar that is shown at the very top of the mobile phone view. What is your professional opinion regarding this?"
2. "Regarding Q5, the compact phone header, what is your professional recommendation?"
3. After the recommendation: "I am happy for you to proceed based on your professional recommendations." — recorded as adopting P1–P9 and the rollout in section 4.
4. Asked by the application session whether record headers need a Menu button, Dean asked "What is your professional opinion regarding the record headers and the menu button?" and, after Claude's recommendation, said "Ok.  I happy to proceed based on your professional recommendations." — recorded as the P3 note in section 3.

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Fewer controls at the top of phone screens, even without the main top bar | User decision | Quote 1 |
| One compact header for every phone page, decided once as a shell amendment | Claude's recommendation, adopted | Quotes 2 and 3 |
| Rules P1–P9 and the rollout order | Claude's recommendation, adopted | Quote 3 |
| Records have no Menu button; More starts with Open menu and Conversations (P3 note) | Claude's recommendation, adopted 19 October 2026 | Quote 4 |
| Acceptance of the drawn component | User decision: Dean said yes to saving the named version "Phone header amendment — accepted", saved 19 October 2026 | Section 6a |
| Keeping Conversations in the phone row | Dean's 18 October 2026 rule for the top bar, carried to the phone row | [Conversations T1 scope](conversations-t1-scope.md) |
| 320 px search and filter combined, 18 px title, outline Conversations icon | Dean's acceptance of three fixes on Customer messages · EC-04, 19 October 2026, carried into P7 | EC-04 Figma page, frame `1525:402853` |

## 3. Rules P1–P9, as adopted

| Rule | Text |
|---|---|
| P1 | Phone pages (below 768 px) use one compact 56 px header row instead of the global phone header. Desktop and tablet are unchanged. |
| P2 | List and calendar pages (Type=List): menu · view chooser (view name, count, chevron; opens Choose view, the phone form of the side menu) · at most three icons: one page action, Conversations with its badge, Filter. A page without views shows its title without the chevron. |
| P3 | Record pages (Type=Record): back · position ("1 of 3 to send") or the record reference · previous and next · More. Title and status move into the content; main actions sit in a sticky bottom bar; records have no tab bar. |
| P3 note | Records have no Menu button: Back keeps the left slot, and the menu holds list-level jobs that Back reaches in one tap. The record's More (…) menu starts with Open menu and Conversations (its unread count in the accessible name), then the record's own actions, so the menu and Conversations stay reachable when a record has no tab bar or no list behind it. |
| P4 | The menu holds the department menu, the account and working company, notifications, global search (at the top), the page guide and Design & build. A dot on the menu shows unread notifications. |
| P5 | Choose view opens a bottom sheet. Filter opens a full-screen panel with Reset and "Show N items"; a dot on Filter shows a filter is applied. |
| P6 | No toolbar or context rows under the header: views go into Choose view, filters into Filter, refresh is pull-down. Status lines appear only when something needs attention (out of date, offline, reconnect). |
| P7 | At 320 px the title drops to 18 px and truncates first. Where the page action is search, search and filter combine into one "Search and filter" control that opens one screen, as Dean accepted on Customer messages · EC-04. A record reference never truncates: previous and next move into More instead. Never more than three icons to the right of the title. |
| P8 | Accessibility: 44 px targets; every icon has an accessible name; badge counts are read out ("Conversations, 3 unread"); the view chooser is a button announcing the current view; the title is the page's heading. |
| P9 | Rollout: new phone frames use the component now; accepted pages swap their header in one batch after the named version is saved, and drop their toolbar rows when each page is next changed; the application changes the shared phone header once, in its own pull request, before the EC pages are built. |

Unchanged: the phone tab bar (five icon-only tabs), quick add, and the desktop and tablet top bar.

## 4. Design reference

| Reference | Identity |
|---|---|
| Design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Phone header amendment" `1530:70`, under "— System —" after "Shell top bar amendment" |
| Header and rules | Page header `1531:83` (conformance declaration); rules card `1531:118` with Dean's words |
| Component | Component set "Shell / Phone header · compact" `1530:110`, since the lock-in on Components `1:4` › Shell and navigation beside `Shell / Phone header` `38:282`: Type=List and Type=Record, each at Width=390 and Width=320 (`1530:108` and `1530:109` are the 390 px variants). Properties: Title, Count, Show count, Show view chooser, Show page action, Page action icon, Show filter, Unread notifications dot, Position, Show previous and next. Built from the Customer messages · EC-04 compact headers (`1516:4177`, `1516:402151`) |
| Examples | Section `1531:131`: Calendar, Emails, Customer messages, Work orders, a page without views and three record cases at 390 and 320 px; before and after on the accepted Changes and follow-up PL-04 phone list (`1531:507`, `1531:543`) |
| First consumer | Calendar · EC-03 (proposal, page `1511:396797`): every phone frame uses instances of `1530:110` |
| Named version | "Phone header amendment — accepted", saved 19 October 2026 in the Figma desktop app on Dean's yes, before any lock-in change |
| Captures | [phone-header-amendment-r01](../reference/ui/application-shell/phone-header-amendment-r01/README.md): rules, component, examples and one before and after, icon-free; copies on "Captures (icon-free)" `115:2` under `1556:417691` |
| File index | Row `1557:2645` in the System table of the File index (Start here, frame `630:2`) |

## 5. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The shared application shell on phone widths. No page, route, scope ID, capability or parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Shared shell component; no page type changes |
| Reused components | Shell / Phone header · compact `1530:110` (replaces Shell / Phone header `38:282` on accepted phone frames), Shell / Top bar action · Conversations `1175:2205`, Icon components on Components `1:4` |
| Incoming handovers | None; the header reads the title, current view and count the page already shows |
| Outgoing handovers | Menu, the page's Choose view sheet and its filter panel |
| States shown | List with and without views, with a page action, at 390 and 320 px; record with position, with a reference, and without previous/next |
| Departures | Section 6 |

## 6. What changes, and what it amends

| Record | What changes |
|---|---|
| [Shell top bar amendment](shell-top-bar-amendment.md) R7 ("Phone is unchanged: page name only, with the header's back chevron") | On phone the page name sits in the compact row; list pages add the view chooser and record pages the position or reference (P2, P3) |
| Shell phone title rule S2 ([shell system](../design/development/systems/shell.md)): 17 px page title, home tile or section menu | Replaced on phone by P2: menu button and view chooser on every page |
| Conversations T1c-2 mobile requirements (Page guide moves into the identity menu at 360 px and narrower) | The page guide, notifications and global search move into the menu at every phone width (P4); Conversations stays in the row |

## 6a. Figma lock-in pass

Made on 19 October 2026, after Dean said yes and the named version "Phone header amendment — accepted" was saved and confirmed in version history:

- **Library.** The component set `1530:110` was moved with its four variants onto Components `1:4` › Shell and navigation, beside `Shell / Phone header` `38:282`, by `appendChild`. Node IDs, component properties and all 33 existing instances (Calendar · EC-03 and the examples) were kept; the examples were re-checked visually after the move. `38:282` stays in the library with a description marking it superseded on phone pages, because 69 instances remain on frames this lock-in does not touch (below). The emptied section `1530:71` on the amendment page now carries a note pointing to Components.
- **Accepted pages.** 106 phone headers on 38 accepted pages (every page with an Accepted row in the File index except Emails · EC-01, which its own session swaps) were replaced in one batch, one script per page: 54 instances of `38:282` and 52 detached "Shell / Phone header with Conversations action (proposed amendment)" frames. Each became an instance at the same position, filling the frame width: Width=320 in 320 px frames, otherwise Width=390. The title keeps the old header's page title. The count is the page's own count where the list shows one ("12 work orders" gives 12, "0 of 9" gives 0) and is hidden in loading and error states. The view chooser shows wherever the page has views; pages without views (My Work, My jobs, Inspections, Fertigation, Contract obligations, Conversations, Template management's Site use) show the title only. The page action (search) shows only on pages that have list search (Changes and follow-up, Travel review, Field team, Findings, Escalations, Discovery register, Organisations, Sites, Facilities, People, Site surveys, Products); at 320 px it folds into Filter as P7 requires. Filter shows where the frame has a filter control. Conversations and the unread dot keep the component defaults. Toolbar and context rows stay until each page is next changed (P9).
- **One record header.** The Service planner "Needs attention and tray" phone frame `1223:8067` already had a back arrow in place of the menu, so it became Type=Record with the position "Needs attention and tray", no previous and next, and its prototype link to the Day view moved onto the new back control. Every other frame is Type=List; no other old header carried a prototype link.
- **Not touched:** the proposal pages (Deals `549:2`, Customer 360 `554:2`, ES-08 `406:2`, Customer response · FI-07 `1490:70`, and Calendar · EC-03, which already uses the component), the UX benchmark exemplars, the Template page `626:20`, Template / Phone `39:809` on the Shell page, the Products PD-01 evidence copy `666:161169`, every frame on "Captures (icon-free)" `115:2`, and Emails · EC-01 `1499:392390` and Customer messages · EC-04 `1509:394554`, which their own sessions are drawing. Accepted pages with no phone header of either kind (Deal record CR-01, Create discovery workspace, Estimation Wizard, Discovery costing, Excel estimate import, the six CPQ pages, Appointment detail, Incidents FI-06, Access & readiness) needed nothing.
- **Captures** for this record: copies on "Captures (icon-free)" under the heading `1556:417691` (`1556:417692` … `1556:417875`), compact headers detached, 154 icons swapped for `Icon/placeholder` and none left.
- **Records in the file:** the page header `1531:83` now reads Accepted with the named version, and the File index has the row `1557:2645`.

Still to do, in order (P9):

1. Emails · EC-01 and Customer messages · EC-04 swap their detached compact headers for instances of `1530:110`, in their own sessions.
2. The application's phone header was built in PR #609 before the EC pages are built; see the [application shell master](../design/development/components/application-shell.md#phone-header-amendment--19-october-2026) and [measured evidence](../testing/evidence/phone-header/README.md). Owner review of the running app remains pending.
3. Each accepted page drops its toolbar and context rows when it is next changed.

## 7. Verification

The component was checked visually at 390 and 320 px in Figma for every example in section 4, including truncation and the record reference at 320 px. The Calendar · EC-03 phone frames and their prototype links were re-checked after the swap. Dean accepted the drawn component by having the named version saved on 19 October 2026; it appears in the file's version history.

After the lock-in a sweep of the 38 swapped pages found 106 compact header instances and no remaining instance of `38:282` or detached global phone header outside the PD-01 evidence copy; the 69 instances of `38:282` left in the file are all on the untouched frames listed in section 6a. Screenshots spot-checked a 390 px list with search (Sites), a 320 px list with filter (Travel review), a page with its own search row (Products), a page without views at 320 px (Template management · Site use), My jobs and the planner's record header. Frames that hug their content are 8 px shorter; fixed-height frames keep their height. No application code, route, migration, permission or parent ID changes in this record.
