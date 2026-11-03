---
document_id: PPO-DESIGN-AUDIT-OPEN-DEC
date: 2026-11-01
owner: Dean Fiedler
status: Dean adopted all seven recommendations on 1 November 2026; design direction only, with no build, account, connector or provider authorised beyond what each section states
source_commit: 5e2e7039033411f1156732fae3b4d1d8a6fe794c
versioning: git
---

# Design audit: seven open page decisions

## Decision

The Figma design file audit of 1 November 2026 listed seven possible pages that needed Dean's decision before anyone could draw them. Claude gave a recommendation for each, and Dean answered: "Adopt all seven".

| # | Page | Scope | Decision | Draw now? |
| --- | --- | --- | --- | --- |
| 1 | Native phone app screens | Calling stage 2 | Authorise the stage 2 spike only, not the build | No |
| 2 | Teams connector settings | Calling stage 3, AD-04 | Ask the IT contractor now; no separate page | No |
| 3 | Inventory stock counts, replenishment, locations, barcode scanning | SC-05, SC-04 | Split them; MYOB keeps stock authority | Replenishment review only |
| 4 | Planner map view | PL-01 | Yes, as a simple day map, after an architecture decision | No |
| 5 | Calendar month view and recurring meetings | EC-03 | No month view; show recurring meetings read-only | Small amendment |
| 6 | Departmental home variants | SH-01 | No separate pages; one My Work that varies by role | No |
| 7 | Request access flow | AD-01 | Name who to ask now; add a request button later | Yes, the first part |

Dean adopted the recommendations, which are his decisions. The audit is the working page behind them; this record is the authority. Claude's stated limit also stands: MYOB's capabilities, map provider pricing and phone behaviour were not tested when these recommendations were made.

## 1. Native phone app screens

Most customer calls go straight to staff mobiles and a web app cannot see incoming calls, so the need stands. [ADR-0063](ADR-0063-native-phone-app.md) has not yet proved that Capacitor can load hosted PPO in production, and Apple may reject an app it judges to be just a website.

- The spike in ADR-0063 is authorised. Its pass criteria stay as ADR-0063 lists them, on physical phones.
- The stage 2 build, store submission and release stay unauthorised. A spike result comes back to Dean before any of them.
- Dean or a company administrator creates the Apple and Google company accounts. The spike cannot finish on physical phones until they exist.
- Screens are drawn after the spike, because it decides what the phones can do. No app can prompt after an incoming call on an iPhone.
- The first rollout covers company phones. Personal mobiles are opt-in.

## 2. Teams connector settings

- Someone at Powerplants asks the IT contractor to confirm the tenant, the Teams Phone licences and who can grant admin consent. The email work needs the same tenant confirmation ([ADR-0059](ADR-0059-email-sending-from-ppo.md)).
- The connector stays behind the phone app in priority, because most calls do not go through Teams. The conditions in the [calling paper](calling-and-caller-id-design.md) still apply: a mocked adapter first, and a security review of the Graph permission.
- There is no separate page. The design is a connector entry in Integrations (AD-04) and a personal on/off switch in My account (SH-03), drawn when the connector starts.

## 3. Inventory functions

MYOB stays the stock authority. This applies [ADR-0049](ADR-0049-native-supply-chain.md), which rules out a second inventory ledger, and the [operating model](ppo-workspace-myob-book-of-record.md), which rejected PPO owning stock.

| Function | Decision |
| --- | --- |
| Locations | Shown read-only from MYOB. No location management in PPO |
| Barcode scanning | Yes, starting at Receiving (SC-04). A scan identifies an item and does not accept a receipt. A barcode decoder needs its own architecture decision first |
| Replenishment | A review list only, on Inventory (SC-05). No automatic reordering and no adopted reorder formula. Real reorder rules stay open |
| Stock counts | Later. Staff count in PPO, someone approves the count, and MYOB posts the adjustment. Confirm the route with the MYOB partner before designing it |

## 4. Planner map view

- The Service planner (PL-01) gains a simple day map: that day's appointments and their order.
- The first version has no route optimisation and no live technician tracking.
- An architecture decision comes first, and the page is drawn after it. It covers the provider, the cost and sending customer addresses to that provider. Google Maps is the first candidate, because [site addresses already link to it](customers-sites-maps-r03.md). The subscription idea means the provider must stay replaceable.
- Sites need reliable addresses or coordinates before a map can show them. Check what the current site forms capture when the decision is written.
- Existing Google Maps links and the "no embedded map until a map provider has an ADR" rule in the [facilities design](facilities-figma-design.md) continue until then.

## 5. Calendar

Outlook stays the place to manage meetings. PPO's calendar (EC-03) is for daily and weekly work.

- There is no Month view. Add one only if staff ask for it after using the calendar.
- Recurring meetings appear as individual occurrences with a small repeat marker, and the series is edited in Outlook. Writing to Outlook remains unapproved ([calendar design](calendar-figma-design.md), Q2).
- This is a small amendment to the accepted calendar page. It relies on the calendar read still to be built.

## 6. Departmental homes

- No departmental home pages are added. My Work stays the single home and its content varies by role.
- Each department's first page acts as its landing page, Reports (RP-01) serves managers, and My jobs can be the technicians' phone default. These are directions for later design, not new routes.

## 7. Request access

AD-01 does not support self-service requests today: `/admin/access/requests` needs admin read and propose, and hosted commands are refused.

- **Now:** the denied page names who to ask. The Request access button (departure D4) comes off the System pages proposal when that page is amended or accepted.
- **Later:** one self-service request in AD-01, shared with Conversations T6 ([T1 scope](conversations-t1-scope.md), T1-4). People can only request access for themselves, someone else approves it, and nothing is granted automatically. It needs its own decision, and any new capability follows the repository's permission rules.
- The sign-in page has no request option; [login access requests](login-r02-integration.md) go to the existing administrator. Portal access stays with Powerplants staff ([portal decision](portal-home-access-figma-design.md), Q3).

## What this changes and what it does not

- The audit's "Needs your decision first" items are closed as decisions. Their follow-up work is listed below.
- ADR-0063 now points here for the spike. Other records are unchanged, and no accepted design changes until its amendment is drawn and accepted.
- This record changes no application code, migration, permission, Figma page or external system. It sends nothing to anyone, and it creates no account.

## Follow-up work

| Item | Who |
| --- | --- |
| Create the Apple and Google company accounts | Dean or a company administrator |
| Ask the IT contractor the three tenant questions | Dean or a company administrator |
| Confirm the stock count route with the MYOB partner | Dean or a company administrator |
| Run the stage 2 spike | Claude, when the accounts and phones exist |
| Write the map provider and barcode decoder architecture decisions | Claude |
| Draw the replenishment review, the calendar amendment and the denied-page change | Claude, when asked |
