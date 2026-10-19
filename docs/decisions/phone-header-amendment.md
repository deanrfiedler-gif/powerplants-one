---
document_id: PPO-SHELL-PHONE-HEADER-AMENDMENT-DEC
title: Phone header amendment
date: 2026-10-19
owner: Dean Fiedler
status: Owner-adopted rules (in words); Figma amendment drawn; named version, lock-in on accepted pages and the application change not done
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

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Fewer controls at the top of phone screens, even without the main top bar | User decision | Quote 1 |
| One compact header for every phone page, decided once as a shell amendment | Claude's recommendation, adopted | Quotes 2 and 3 |
| Rules P1–P9 and the rollout order | Claude's recommendation, adopted | Quote 3 |
| Acceptance of the drawn component | Not yet: the named version "Phone header amendment — accepted" waits for Dean's yes | Section 6 |
| Keeping Conversations in the phone row | Dean's 18 October 2026 rule for the top bar, carried to the phone row | [Conversations T1 scope](conversations-t1-scope.md) |

## 3. Rules P1–P9, as adopted

| Rule | Text |
|---|---|
| P1 | Phone pages (below 768 px) use one compact 56 px header row instead of the global phone header. Desktop and tablet are unchanged. |
| P2 | List and calendar pages (Type=List): menu · view chooser (view name, count, chevron; opens Choose view, the phone form of the side menu) · at most three icons: one page action, Conversations with its badge, Filter. A page without views shows its title without the chevron. |
| P3 | Record pages (Type=Record): back · position ("1 of 3 to send") or the record reference · previous and next · More. Title and status move into the content; main actions sit in a sticky bottom bar; records have no tab bar. |
| P4 | The menu holds the department menu, the account and working company, notifications, global search (at the top), the page guide and Design & build. A dot on the menu shows unread notifications. |
| P5 | Choose view opens a bottom sheet. Filter opens a full-screen panel with Reset and "Show N items"; a dot on Filter shows a filter is applied. |
| P6 | No toolbar or context rows under the header: views go into Choose view, filters into Filter, refresh is pull-down. Status lines appear only when something needs attention (out of date, offline, reconnect). |
| P7 | At 320 px the same icons stay and the title truncates first. A record reference never truncates: previous and next move into More instead. Never more than three icons to the right of the title. |
| P8 | Accessibility: 44 px targets; every icon has an accessible name; badge counts are read out ("Conversations, 3 unread"); the view chooser is a button announcing the current view; the title is the page's heading. |
| P9 | Rollout: new phone frames use the component now; accepted pages swap their header in one batch after the named version is saved, and drop their toolbar rows when each page is next changed; the application changes the shared phone header once, in its own pull request, before the EC pages are built. |

Unchanged: the phone tab bar (five icon-only tabs), quick add, and the desktop and tablet top bar.

## 4. Design reference

| Reference | Identity |
|---|---|
| Design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Phone header amendment" `1530:70`, under "— System —" after "Shell top bar amendment" |
| Header and rules | Page header `1531:83` (conformance declaration); rules card `1531:118` with Dean's words |
| Component | Component set "Shell / Phone header · compact" `1530:110`: Type=List `1530:108`, Type=Record `1530:109`. Properties: Title, Count, Show count, Show view chooser, Show page action, Page action icon, Show filter, Unread notifications dot, Position, Show previous and next. Built from the Customer messages · EC-04 compact headers (`1516:4177`, `1516:402151`) |
| Examples | Section `1531:131`: Calendar, Emails, Customer messages, Work orders, a page without views and three record cases at 390 and 320 px; before and after on the accepted Changes and follow-up PL-04 phone list (`1531:507`, `1531:543`) |
| First consumer | Calendar · EC-03 (proposal, page `1511:396797`): every phone frame uses instances of `1530:110` |

## 5. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | The shared application shell on phone widths. No page, route, scope ID, capability or parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Shared shell component; no page type changes |
| Reused components | Shell / Phone header `38:282` (gains these variants at lock-in), Shell / Top bar action · Conversations `1175:2205`, Icon components on Components `1:4` |
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

Not done, in order (P9):

1. Dean saves the named version "Phone header amendment — accepted"; then the File index row and icon-free captures (`docs/reference/ui/application-shell/phone-header-amendment-r01/`) are made.
2. Lock-in: the library component `Shell / Phone header` `38:282` takes the List and Record variants on Components `1:4`, and the accepted pages' phone headers are swapped in one batch. Their toolbar and context rows stay until each page is next changed.
3. Emails · EC-01 and Customer messages · EC-04, still being drawn in other sessions, swap their detached compact headers for the component.
4. The application's phone header (`ProductHeader` and the phone shell in `src/components/`) changes once, in its own pull request, before the EC pages are built.

## 7. Verification

The component was checked visually at 390 and 320 px in Figma for every example in section 4, including truncation and the record reference at 320 px. The Calendar · EC-03 phone frames and their prototype links were re-checked after the swap. No application code, route, migration, permission or parent ID changes in this record; owner acceptance of the drawn component is pending.
