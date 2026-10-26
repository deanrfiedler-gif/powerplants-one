---
document_id: PPO-CS04-SITES-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design and 26 October focus amendment; focus implementation queued; visual and device acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Sites design — owner decision

Sections 1–7 retain the 18 October design decision and its evidence. The [26 October amendment](#8-keyboard-focus-during-follow-up-refresh--26-october-2026) supersedes the preamble's design-only scope solely for the bounded Owned follow-up focus correction. It records the subsequently authorised keyboard behaviour, with review corrections dated 27 October; it does not change the retained Figma version or claim that the focus correction is implemented.

On 18 October 2026 Claude recommended Sites as the next page to design, because every Service page links to a site. Dean replied "Proceed on that basis.", as the notes card records. Claude drew scope CS-04 in Figma: the site register at `/sites` and the site workspace at `/sites/[id]`. Sites is a shared record. It is opened from More, so the rail shows Service with More selected.

Claude drew the page from these sources:
- the CS-04 design register pages ([scope-cs-04](../design/development/pages/scope-cs-04.md), [route-sites](../design/development/pages/route-sites.md), [route-sites-id](../design/development/pages/route-sites-id.md));
- the built `ContextList` and `ContextDetail` in `src/components/context-screens.tsx`;
- the [Customers, Sites & Growing Areas workspace](customers-sites-workspace-design.md) r03 and its [map links](customers-sites-maps-r03.md), which remain the owning standalone design for CS-04, CS-05 and CS-06;
- [CS-06 Site access and horticultural readiness](site-access-readiness-design.md), [Field readiness over CS-06](field-readiness-native.md) and the [field readiness gate](field-readiness-gate-proposal.md) (PPO-SVC-FIELD-READINESS-GATE-PROP);
- [ADR-0037](ADR-0037-cs05-facilities-native.md) for facilities and [ADR-0045](ADR-0045-equipment-native-workflows.md) for equipment;
- the accepted record pattern in [Work order record](work-order-record-page-design.md) (PPO-SVC-WO-RECORD-DESIGN-DEC), [Appointment detail](appointment-detail-figma-design.md) (PPO-SV04-APPOINTMENT-FIGMA-DEC) and [Service review](service-review-figma-design.md) (PPO-SV06-REVIEW-FIGMA-DEC);
- copies of the [Incidents](incidents-figma-design.md) (FI-06) and [Findings](findings-figma-design.md) (SV-07) proposal frames, drawn and accepted the same day. No accepted frame or main component was edited.

Before accepting, Dean asked Claude to "give all the pages an audit and polish" (section 6). He then accepted the design: "I accept the Sites CS-04 design with your recommendations, including D1–D6 and Q1–Q3. Then lock in all seven accepted pages." The design reference is the named Figma version "Sites — accepted", saved on 18 October 2026 at Dean's request.

Scope:
- `scope:CS-04`, with `route:/sites` and `route:/sites/[id]`.
- Parent requirement IDs are unchanged. No parent requirement ID is added or renamed.

The 18 October decision authorised design work only. Section 8 supersedes that limitation solely for the bounded CS-04 Owned follow-up focus correction, whose implementation is authorised subject to the existing build rule. This documentation contribution does not implement the correction or authorise a merge, deployment, new route, read model, migration, permission or capability.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Sites (CS-04) next | User decision, 18 October 2026 | "Proceed on that basis.", recorded on the notes card, after Claude's recommendation |
| Conversations action in the top bar | User decision, 18 October 2026 | Dean asked for it on every new top bar. The shell amendment is a separate, still-open record (section 5) |
| Audit and polish before acceptance | User decision, 18 October 2026 | "give all the pages an audit and polish", recorded on the notes card. Section 6 |
| Departures D1–D6 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Primary action | Resolved as recommended | "Start service request" is the primary action. Scheduling a visit stays in the planner. The notes card calls this "as built"; the built site page labels its intake link "Start service intake" (to `/service/tickets/new?site=…`), so the label is settled when the page is built |
| Q2 Maps | Resolved as recommended | Keep the address handoff to external maps only, with the warning to confirm the arrival point. No embedded map |
| Q3 Site numbers | Resolved as recommended | Show the `SYN-SITE-…` number on every site so people can quote it. The built page shows a display number only when one exists |
| Readiness is never confirmed on this page | Rule shown in the accepted design | The overview says why readiness is needed and links to Access & readiness (CS-06, `/sites/[id]/readiness`) |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named version "Sites — accepted" | Done | Saved by Claude in the Figma desktop app on 18 October 2026 at Dean's request ("Yes, save the seven named Figma versions now"); confirmed in version history |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. Named version "Sites — accepted", saved 18 October 2026. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Sites · CS-04" `1375:2901`, under "— Shared records —", before People · CS-02 `1395:150275`. The page header `1375:2902` holds the conformance declaration; the notes card `1380:2175` is in Flows and notes. After acceptance on 18 October 2026, the page header was updated to "Accepted by Dean". File index row "Row / Sites · CS-04" `1396:355225` in the Shared records table |
| Desktop 1440 × 900 | Register, All sites `1375:2937`; site overview, SYN Glasshouse 4 `1375:3183`; Equipment tab, installed and served `1375:3312` |
| Tablet 1024 | Register with the side menu collapsed `1375:3449` |
| Phone 390 and 320 | All sites list `1375:328008`; site overview at 390 `1375:3678` and at 320 `1379:2365` |
| States | Phone 390: loading `1375:328046`; no matching sites `1375:328103`; could not load `1375:328145` |
| Prototype | No flow was designed for this page. After acceptance on 18 October 2026, Claude renamed the two copied flow starting points "CS-04 — desktop" and "CS-04 — phone" and removed three copied links to other pages, including the record header's primary action that led to a Service review frame. Row hover states and the rail and menu toggles remain. Claude did not play the prototype in Present mode |
| Page parts | Section "Page components (proposed)" `1380:2191`: Site grid header `1375:3745` and Site grid row `1375:3759` (Default, Hover and Selected). They stay on the page, as the Field team and Service review parts do |
| Story | Synthetic: SYN Glasshouse 4 (Hillview Growers, Gatton) needs readiness reconfirmed for SYN-PPO-APT-000052, moved to Thu 15 Oct 08:00–11:00. The move shows as accepted at 08:51, matching Changes and follow-up (PL-04); the "as at" times read 09:00. SYN-PPO-WO-000040 and survey SYN-SRV-000031 are the open work |
| Retained captures | [Sites design r01](../reference/ui/sites/sites-design-r01/README.md): eight icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-04`, `route:/sites` and `route:/sites/[id]`, reached from More › Shared records › Sites. Parent requirement IDs unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for the site register. Record detail with existing register for the site workspace |
| Reused components | Shell v2 (Rail · Service with More selected, top bar, side menu), Grid header and cells, Record / Header, Readiness bar, Field and View tab, Work order record / Blocker row, Tag, Button, Job pack list row (phone), and Shell / Top bar action · Conversations from the proposed shell amendment. New: Site grid header and row, and the equipment table |
| Incoming handovers | Any record that names a site (service requests, visits, work orders, findings, incidents, travel review) and the customer record |
| Outgoing handovers | Access & readiness (CS-06), Facilities & growing areas (CS-05), site surveys and as-found briefs, equipment records, a new service request and owned follow-up. An address handoff to external maps |
| Source authority | The CS-04 design register pages; the built `context-screens.tsx` (site detail); the navigation group Shared records; the decisions listed above |
| Proposed departures | D1–D6 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Sites — accepted", saved 18 October 2026 |

## 4. What the design shows

### Register

- **Grid:** one row per site (D1). Columns run Site, Customer, Location, Site readiness, Biosecurity, Areas, Equipment, Next visit, Primary contact and Time zone, scrolling sideways with fixed checkbox and settings columns.
- **Toolbar:** Customer and Readiness filters, the count with its "as at" time, and two icon buttons. Search uses the global search in the top bar.
- **Readiness words:** "Reconfirm for Thu 15 Oct", "Confirmed for today", "Not needed yet" and "Unknown". Biosecurity reads "Controls recorded" or "Unknown". A site with an unreviewed address shows "Address to review" as its location.
- **Side menu:** Organisations and People, then a Sites group with All sites (default), Readiness to confirm, Biosecurity unknown and Address to review, then Related records: Facilities & growing areas, Site surveys & as-found, and Equipment (D2).
- **Rail:** Service, with More selected, because Sites is a shared record.

### Site workspace

- **Header:** the site name with its readiness tag, `SYN-SITE-000012` (Q3), the customer and location, the primary contact, site time zone and last visit. The record position ("1 of 7 in All sites"), Access & readiness and the primary action Start service request (Q1).
- **Before the next visit bar:** address, access instructions, biosecurity controls, primary contact, readiness for the next visit and the delivery basis ("Delivery basis not verified") (D3).
- **Facts column:** Site (location, time zone, operator, owner, billing party, address, facilities and equipment counts); Access and biosecurity (contact, survey, equipment, and the access and biosecurity notes); Next visit.
- **Tabs:** Overview, Facilities & areas, Equipment, Work and visits, and History, each with a count (D3).
- **Overview:**
  - A readiness card for the next visit (D4). It says why readiness is needed ("The visit moved, so readiness has to be confirmed again for the new time (gate P4)"), lists the moved visit and the contact to make, and ends "Readiness is confirmed in Access & readiness (CS-06), not on this page."
  - Open work at this site, permitted records only: the appointment, the work order, an owned follow-up and the as-found survey.
  - The address handoff note: open the address in external maps, then confirm the arrival point with the contact; delivery instructions are not separately verified (Q2).
- **Equipment tab:** a table grouped by facility (D5), with "Installed in" and "Serves" as separate columns and identity status in words (Verified, Unconfirmed). A note explains that the two can differ, and another that an unconfirmed identity is still a separate record and does not authorise diagnostic work. "Show 8 more" opens the equipment register for the site. Add equipment and Record technical context are secondary buttons.

### Phone

- **List:** rows with the site name, customer and location, the next visit date or "None booked", and one status line with an icon (readiness to reconfirm, confirmed, biosecurity unknown, not needed yet, address needs review before booking). The view and customer filters, the count and the "as at" time sit above the list. Sites is reached from More, which is selected in the tab bar.
- **Site overview (D6):** the header shows the site, customer, location and position. Tabs Overview, Areas, Equipment and History are visible. Readiness comes first, then Access and biosecurity "before you go": address with Maps, gate code, footbath, and the primary contact with Call. The footer note repeats that access details do not establish readiness or authority to work.
- **Footer:** at 390 px, the "…" button, Readiness and Service request. At 320 px the footer keeps Service request and moves Readiness into "…" (D6).
- **States:** loading, with "Loading permitted sites…" and "Current results unconfirmed"; no matching sites, with Clear the search; could not load, with no list or counts and Retry loading.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register is a grid: site, customer, location, site readiness, biosecurity, areas, equipment, next visit, primary contact and time zone | Built: a grid of record cards under a search field |
| D2 | Sites is a shared record opened from More. The side menu lists Organisations and People, then the Sites views (All sites, Readiness to confirm, Biosecurity unknown, Address to review) and related records (Facilities & growing areas, Site surveys & as-found, Equipment) | Built: tabs across Organisations, People, Sites and Equipment above one search; no site views |
| D3 | The accepted record layout with a "Before the next visit" bar (address, access, biosecurity, contact, readiness for the next visit, delivery basis), site facts and parties on the left, and Overview, Facilities & areas, Equipment, Work and visits and History tabs | Built: Details and Facilities & areas tabs with stacked sections |
| D4 | When the next visit needs readiness confirmed, the overview says why and links to Access & readiness (CS-06). Readiness is never confirmed here | Built: an Access & readiness button above the tabs, with no readiness summary |
| D5 | Equipment is a table grouped by facility, with "Installed in" and "Serves" as separate columns and identity status in words | Built: an equipment tree |
| D6 | On a phone, the overview shows readiness first, then access and biosecurity "before you go". At 320 px the footer keeps Service request and moves Readiness into More | Not drawn |

Every top bar also carries the proposed Conversations action left of the information icon, as Dean asked on 18 October 2026.

## 5. Not decided and not drawn

- **Building the page.** The built `/sites` is the shared context list with tabs, a search and record cards. The built `/sites/[id]` has Details and Facilities & areas tabs with stacked sections. The build order is not decided.
- **Prerequisites for a build:**
  - a site readiness state per site and next visit for the register and the readiness card. The field readiness gate's customer site-readiness confirmation (P4) is not built. P4 records that confirmation as a contact against the visit; this design links readiness to Access & readiness (CS-06). Where the confirmation is made is settled when P4 is built;
  - a biosecurity summary, area and equipment counts, next visit and primary contact per site for the grid;
  - a `SYN-SITE-…` number on every site (Q3);
  - the Sites views and their counts (D2);
  - the primary action label, "Start service request" against the built "Start service intake" (Q1).
- **The Conversations action** is part of the proposed top-bar shell amendment in the [Conversations proposal](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP). That amendment is still open. `Shell / Top bar` and `Shell / Phone header` change only when it is accepted.
- **Prototype residue:** cleared after acceptance (section 2).
- **Not drawn:**
  - the Facilities & areas, Work and visits and History tabs;
  - editing site details and parties, and creating a site;
  - Access & readiness (CS-06) and Facilities (CS-05) themselves;
  - the Readiness to confirm, Biosecurity unknown and Address to review views;
  - denied and restricted states, desktop register states and the tablet site workspace;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the sites, customers, people, visits, equipment and times are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request, Claude audited the seven new proposal pages together. The audit checked:
- truncation and overflow;
- fonts (Roboto only) and labels;
- rail selection;
- the Conversations action on every top bar;
- icon placeholders;
- one story across the pages: people, sites, dates and record IDs.

White cards on the grey record background follow the accepted SV-06 pattern. Changed on this page: the Glasshouse 4 move now shows as accepted at 08:51, matching [Changes and follow-up](changes-follow-up-figma-design.md) (PL-04), and the "as at" times moved to 09:00, after it.

## 7. Verification

- Claude read the notes card, page header, prototype links and capture copies with read-only scripts on 18 October 2026, and viewed the eight downloaded captures.
- The eight captures are copies of the accepted frames on the "Captures (icon-free)" page `115:2`, from y = 216,000. Prototype links were removed and each of the 326 Font Awesome icon instances was swapped for `Icon/placeholder` `67:77` at its original size. A scan after the swap found no Font Awesome instance and no visible vector outside a placeholder or the Powerplants logo.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/sites/sites-design-r01/README.md).
- Claude did not play the prototype in Present mode.
- The named version "Sites — accepted" is saved. The File index row and the page header were updated on 18 October 2026.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.

## 8. Keyboard focus during follow-up refresh — 26 October 2026

### Decision and authority

After an independent investigation of test-only [PR #710](https://github.com/deanrfiedler-gif/powerplants-one/pull/710), Dean asked, "What is the next step?" Codex recommended adopting a bounded CS-04 focus contract, implementing it in a separate accessibility PR, proving direct focus and revocation behaviour, and reviewing keyboard and screen-reader use. The recommendation explicitly retained the [Codex build limit](parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit) and kept pause/hide controls as a separate design question. Dean replied on 26 October 2026: **"Proceed based on your professional recommendations."**

That instruction adopts the focus behaviour below and authorises its bounded implementation when the existing build rule permits. It does not waive that rule or authorise a merge or deployment. At this amendment's preflight, implementation PRs #690, #695, #696, #697, #700 and #701 were still open; this contribution records the decision and specification only. Their final status and available capacity must be checked again before implementation starts. No claim on another contributor's branch is transferred.

This amendment owns the new focus behaviour for **CS-04**, `route:/sites/[id]`, Work and visits → Owned follow-up. It extends the existing Sites decision; it supersedes the unresolved focus question recorded in #710, not the access-refresh contract. Traceability remains [NFR-08 and AT-23 in BP-01](../blueprints/BP-01-master-blueprint.md). No parent requirement, capability, grant, migration, API or new technology is introduced. Other consumers of the shared RelatedActivities control are outside this correction unless a later implementation explicitly identifies and verifies a necessary shared change.

### Established behaviour and evidence

At inspected main `f8ea675ef0c8394dc04b101f837fdcf445356f7e`, [useCrmResource](../../src/components/crm-state.ts) polls every 15 seconds and on window focus. [siteOverview](../../src/shared/sites.ts) supplies a fresh observation timestamp. [SiteWorkspace](../../src/components/site-workspace.tsx) passes that observation to [RelatedActivities](../../src/components/context-screens.tsx), whose keyed page child remounts while the selected cursor survives only if its owning RelatedActivities component stays mounted. Protected rows and controls therefore disappear while the current page is reread. A Restricted/Unavailable source removes that owner and its cursor; an unsuccessful Overview read clears the loaded Site and its cursor. The next permitted mount starts at the first page. [The existing CS-04 test](../../tests/browser/sites-native.spec.ts) verifies page scoping, clearing and rejection of an old reply after source revocation.

The disappearance of a focused DOM element explains the reported keyboard interruption. This investigation traced source and existing tests; it did not execute a new browser reproduction. ReadState also defaults to `focusOnError=true`, so a background error can take focus even after the user has moved elsewhere. That is a second case the correction must address.

The #710 description's pending full-browser evidence was subsequently available at head `8f2b9a363a4071c3bcbe272435c8581277e3fe29`: [desktop job 121083956047](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40164930472/job/121083956047) reports 612 passed, and [mobile job 121083956082](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40164930472/job/121083956082) reports 555 passed. Both logs include the selected P11 journey and `quality-owned-follow-up.spec.ts`. Those results establish the test-helper correction at that head; they do not prove preservation of a user's focus or apply to this unbuilt correction. #710 remains a separate test-only contribution.

### Adopted behaviour

1. **Keep the focus targets mounted.** Give the non-sensitive Owned follow-up heading `tabIndex=-1`, a visible focus indicator and a stable node outside the keyed activity-page read. It survives loading, page errors, Retry and page changes without an added ordinary Tab stop. The Work and visits heading sits outside the conditional Follow-ups subtree and survives source loss/recovery while that Site tab is active. A generic **Site view** heading sits in SiteWorkspace outside LoadedSite and all conditional loading/error blocks; the same target remains rendered, exposed and focusable through Overview failure, Retry and automatic recovery. Its accessible name contains no protected Site name/reference. Do not use a disappearing error message as the Site fallback.
2. **Capture before removal.** While the document is active, an automatic refresh about to remove the focused row/control captures its stable activity ID plus control identity. Non-row controls use a semantic identity (Next, First or Open My Work), without a fabricated activity ID. Scope this memory-only bookmark to actor/workspace session, Site, active Work and visits tab, selected cursor, availability-context epoch and current refresh generation. Old text, ordinal and DOM nodes are not restoration authority. Park focus on the Owned follow-up heading in the removal lifecycle, before the next keyboard interaction; a passive effect after deletion alone is insufficient. Verify React StrictMode and repeated refreshes.
3. **Preserve access clearing and freshness.** A fresh Overview observation still clears old activity rows, links and counts while that cursor is reread; this is not a new promise to clear at the instant a poll starts. Restricted/Unavailable source evidence removes the child. Failed/denied reads display no cached records. Beyond an eligible minimal ID/control bookmark, retain no old labels, hrefs, counts or row payloads in hidden/inert DOM, focus metadata or live announcements. Keep the 15-second and window-focus checks, current server authorization and `private, no-store` responses; no instantaneous server-pushed revocation is claimed. Preserve the full permission-filtered activity list and exact links, rather than replacing it with the Overview's ten-item Active-only preview.
4. **Restore only a current permitted target.** After the latest valid page response renders, restore once only if the exact target is present, enabled, visible and permitted on that page; context/availability epoch match; the document is active; focus remains on the exact managed anchor; and no cancellation/terminal event has occurred. Resolve the target from current data by ID/control identity. Never substitute another activity, fetch another page to find it or replay Enter. Carry an eligible bookmark to a newer same-context generation only while its anchor still owns focus. Old successes/errors cannot change current content, focus, cursor, error or bookmark state. Source/Site/session invalidation also invalidates responses from its previous availability epoch. Preserve scroll when possible; otherwise reveal only enough to keep focus unobscured.
5. **Define cancellation and terminal outcomes.** A terminal outcome permanently consumes/discards the bookmark: restoration; a missing/disabled/hidden target in the latest successful page; any accepted current-read failure (network, 5xx, 401/403/404, unreadable JSON or unusable response data); source/Site removal; session lock or context change; or user cancellation. An ignored stale error cannot cancel a newer bookmark. Tab, Shift+Tab, pointer/touch, explicit Retry or paging, tab/Site navigation, dialog interaction and window departure cancel restoration. Later returning to the anchor does not revive it. A refresh of an anchor alone cannot create a new activity bookmark. Do not trap Tab or queue/replay activation.
6. **Use safe fallbacks through recovery.** A missing activity/control leaves affected focus at Owned follow-up with a generic current-page explanation. Source Restricted/Unavailable removes the list and moves displaced focus to Work and visits. Overview failure removes LoadedSite and moves displaced focus to the persistent Site view heading. Source/Site removal discards the activity bookmark; recovery retains the surviving Work/Site target and never restores the old activity. For these safety transfers, act only when removal displaced focus; a surviving focused element elsewhere is unchanged. The success restoration in item 4 is separately guarded. Identity change discards all scoped state; the existing [session view boundary](../../src/components/session-view-boundary.tsx), including its focus handling, takes precedence.
7. **Keep failure and Retry from stealing focus.** Use the existing ReadState `focusOnError=false` option for this scoped background-read host, leaving shared defaults unchanged. SitesReadState is a separate control; its SiteWorkspace host owns Site-level focus transfer. A page-read failure while the owner survives destroys the bookmark but retains the cursor. Keep generic failure feedback and keyboard-reachable Retry. Retry does not recreate the old bookmark. On Retry or automatic success, retain the heading or a surviving user-selected control; if success/loading removes a focused Retry/error control, transfer to the persistent target at that same level. This also covers a focused Retry removed by automatic recovery. A user who moved elsewhere keeps focus on failure and success. Do not describe a failed read as proof that a named activity was deleted or access revoked.
8. **Keep feedback concise.** Mark updating results busy and provide a stable generic status message for loading, failure or changed availability. Essential loading feedback stays outside a busy region that would defer it. Do not make the list a live region or repeat unchanged content/failure announcements every poll. Targets remain visibly focused and unobscured on desktop and phone; announcement quality needs actual screen-reader review.
9. **Define the paging context.** Ordinary observations, Available/Partial transitions and page-read errors/Retry retain the cursor while the same Follow-ups owner stays mounted. Removing the source or loaded Site, leaving the owning tab, changing Site/session or locking the session ends that context: clear cursor/bookmark and recover with a fresh first-page read only when permitted source evidence returns. No activity-page reads run while the source is Restricted/Unavailable. Keep Work/Site fallback focus through recovery and explain generically, for example “Follow-ups are available again. Showing the first page.” Native Next/First activation commits one cursor change and parks affected focus on Owned follow-up. If activation commits before a refresh, reread that new cursor; if removal wins before activation, do not commit/replay a turn. Source/Site removal may then reset the context. An ordinary refresh never advances the cursor. A successful empty later page keeps its cursor and First control. An invalid signed cursor ends restoration, leaves a safe error state and offers explicit First-page recovery; do not silently decode, repair, cross-bind or follow tokens. The user's First action starts one fresh cursor-free read.

### Window departure and return

“Active” means `document.hasFocus() === true && document.visibilityState === "visible"`; recheck both immediately before a focus change by this host. Window blur or leaving visible state is departure. Element blur within the page alone is not window departure.

Departure cancels the activity/control bookmark. Polling and existing access clearing continue while inactive, but this host neither calls `focus()` nor captures an activity bookmark. Do not keep stale protected DOM to preserve focus or pause permission checks. Browser timer throttling does not change the configured refresh policy.

If an inactive refresh removes the last focused in-scope element, retain only a session/Site-scoped displacement marker: the safe target level and the fact that this removal displaced focus. It contains no activity ID, label, href, count, payload or cursor. If a later transition removes that target too, promote the level Owned follow-up → Work and visits → Site view; recovery never downgrades it automatically.

On return, handle either ordering of focus and visibilitychange. At the first event where both active conditions hold, a newer user-selected focus or dialog takes precedence. Otherwise, if focus is on the document/body because of the tracked removal, place it on the surviving generic target before the next in-page keyboard interaction. Leave focus on an already surviving managed target. Consume the marker; subsequent in-page user interaction, navigation, session change or lock cancels it. Body focus without tracked displacement never authorises a transfer.

If nothing removed the focused element while away, retain that live element. The normal window-focus refresh may capture a new bookmark from it once active and restore only under item 4. A bookmark cancelled on departure never revives. Returning after a tracked removal therefore yields a safe heading, not an automatic jump to the old activity.

### Failure and recovery transitions

All focus outcomes below apply only to displaced/managed focus. A user who moved elsewhere keeps that focus. While inactive, use the guarded return rule instead of moving focus.

| Transition | Cursor and bookmark | Focus during and after recovery |
|---|---|---|
| Ordinary observation → held page read → success | Retain cursor; carry eligible bookmark to newest same-context generation. | Owned follow-up during loading; exact current target only if every restoration guard passes. |
| Latest page has no usable target, including empty page or missing Next | Retain cursor; discard bookmark. | Owned follow-up with generic current-page feedback; no substitute target. |
| Activity-page network/5xx/malformed/401/403/404 → Retry or later successful observation | Retain cursor while owner survives; discard bookmark at failure. | Owned follow-up or surviving user-selected control; removing focused Retry transfers to that heading. Never restore the former activity. |
| Follow-ups Available/Partial → Restricted/Unavailable → Available/Partial | End context; discard cursor/bookmark and old requests. Fresh first page after renewed source evidence. | Work and visits survives source recovery and new page loading. |
| Overview failure → timer, window-focus or Retry success | Clear loaded Site, cursor/bookmark; recovery starts at first page. | The same Site view target remains through error/loading/success. Removing a focused error/Retry control transfers to it. |
| Departure during a pending refresh → inactive completion → return | Cancel bookmark on departure; no new activity bookmark while inactive. | Surviving anchor stays focused, or tracked removal is repaired to its generic fallback on active return. |
| Depart from live row → inactive refresh removes it → return | No activity bookmark; cursor survives only if owner does. | Safe heading on return, never the old row. |
| Depart from live row → no removal while away → return refresh | Live focus survives; a new active refresh may capture it. | Ordinary parking/restoration with current data and all guards. |
| User moves, opens dialog or navigates during loading/failure → recovery | Cancel bookmark/displacement marker. | Preserve new focus/dialog ownership. |
| Next/First races with refresh | Zero turns if activation did not commit; one if it did. Later source/Site loss may reset context. | Owned follow-up for committed paging; no queued Enter or extra turn. |
| Old success/error after newer result, restriction, recovery or identity change | Ignore old response and every associated effect. | No revival of old data, focus, cursor, error or bookmark. |

### Alternatives and separate question

| Approach | Disposition |
|---|---|
| Pause polling while keyboard focus is in the list | Rejected for this correction: delays fresh data and discovery of revoked access. |
| Retain rows and reconcile them by ID during refresh | Deferred: good continuity, but retaining unconfirmed rows conflicts with the current clear-while-rereading contract. Removing the observation key alone also removes its reread trigger. A broader authority/freshness design would be needed. |
| Remount, then restore after the request finishes | Rejected alone: focus is lost during loading and an unconditional late restore can interrupt the user's next action. |
| Persistent safe anchor plus guarded restoration | Adopted: preserves orientation while protected rows still clear. The trade-off is a brief loading interruption and lifecycle/race-handling logic. |

This focus correction makes no full WCAG conformance claim. [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) raises a separate presentation-control question for automatic updates. Pause/hide/frequency controls and any essential-update justification remain **undecided and outside this build**. A future presentation-only hide/show design could keep permission checks running and require fresh data when shown; that is an option, not an adopted control. The focus contract follows [W3C focus-persistence guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) and [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### Required implementation proof

Add direct browser assertions in proposed `tests/browser/sites-follow-up-focus.spec.ts`; it is not an existing/executed test in this contribution. Use the real Site UI with synthetic reads, controlled clocks installed before application timers, distinct Overview observations and explicitly held responses. Assert `document.activeElement`/`toBeFocused()` during loading, after completion and on the next Tab/Shift+Tab. Native traversal must expose focus loss, without #710's recovery helper. Inspect requested cursors and scope; repeated reads of one cursor are refreshes, not page turns.

Window-state automation is **simulated**: coherently stub `document.hasFocus()` and visibility state and dispatch window blur/focus and document visibilitychange. An event alone does not change native state. Reset these test seams between cases; keep them out of production behaviour. [Playwright's focus emulation tests](https://github.com/microsoft/playwright/blob/main/tests/library/emulation-focus.spec.ts) cover multiple pages reporting focus (EM-013/014) and interaction with another page not causing blur (EM-022). Switching Playwright pages or dispatching events is not proof of actual operating-system window departure/return. Confirm the pinned runner/browser behaviour when implementing.

| Case | Required observable result |
|---|---|
| 15-second timer and simulated window-focus trigger | Reread selected cursor, clear old rows, park safely during held response; restore exact current target only under the guards. Exercise row links and list controls. |
| Fresh content and changed row position | Current summary/status; match by ID/control rather than old text/ordinal. A second refresh obeys the same rules. |
| User action during loading | Tab, Shift+Tab, pointer/touch, explicit Retry/paging, dialog and tab/Site navigation cancel restoration. No trap, replayed activation or late pullback. |
| Focus outside removed content | Success, failure, Retry and automatic recovery leave surviving user focus unchanged. |
| Target absent/disabled/hidden, empty page or final page | Heading fallback and generic feedback; no stale target, hidden identity or substitute activity. Empty later page retains First and its cursor. |
| Activity-page failure then recovery | Network, 5xx, unreadable JSON/unusable data and 401/403/404, followed by Retry and by later automatic observation success. Cursor retained while owner survives; no old bookmark revival; exact heading/Retry-removal focus result. |
| Source removal/recovery on a later page | Parameterise Restricted and Unavailable → Available and Partial. No reads while removed; fresh query without cursor on return; Work heading focus during/after recovery and generic first-page explanation. |
| Overview automatic recovery on a later page | At minimum 503 and 403, each followed separately by timer and simulated window-focus success; also cover network, malformed data, 401 and 404. The same Site view node remains connected/focused during and after recovery; first-page query has no cursor. |
| Focused Retry removed by recovery | Cover explicit Retry and automatic success for activity-page and Site failures. Preserve a surviving Retry; if removed, transfer to its persistent same-level target. No old activity restoration. |
| Inactive refresh and return | Visible/unfocused and hidden/unfocused; depart before start and while pending; finish before and after return; repeated polls; source/Site removal; no-removal return. This host makes no inactive focus calls, with session-lock handling retaining precedence. Assert cancellation and safe fallback on return; only a surviving live control can supply a new bookmark. |
| Return event ordering and user intent | Both focus/visibilitychange orders, returning by clicking a different control, and dialog ownership. No untracked body-focus repair or stealing the user's new target. |
| Overlapping success and failure | Independently gate Overview/page requests. Old success/error after newer success, failure, restriction, recovery or session lock changes neither data nor focus and cannot cancel a newer bookmark. |
| Session and context boundaries | Actor/workspace change, lock, Site/tab/cursor change invalidate restoration. Session boundary focus cannot be overridden; no state crosses identities. |
| Paging/refresh race | Before activation, after committed Next/First, during page load and as target page arrives: zero/one deliberate turn as specified, no skipped/double page or automatic next_cursor traversal; explicit reset on source/Site removal. Invalid-token recovery requires a user First action. |
| Semantics and visibility | No positive tabindex, duplicate IDs, dangling ARIA references or hidden focusable remnants; busy/status semantics and visible unobscured targets. Old protected labels, hrefs and counts are absent from DOM and accessibility exposure after clearing. |
| Live permission boundary | On a disposable synthetic server/database, revoke source/Site access: current scoped reads refuse/filter data, late replies cannot revive it, and private/no-store remains. Restore access and prove fresh recovery. Mocked browser responses alone do not prove authorization. |

Run focused cases at desktop and 390/320 px; retain the existing CS-04 scoping/clearing/late-response regression. Inspect other RelatedActivities consumers if shared code changes. Rerun the compiled browser and complete desktop/mobile P01–P11 lanes at the implementation's final head. Existing #710 passes do not substitute for these executions.

Record **manual acceptance separately**, with implementation SHA, browser/OS/device/assistive-technology versions, steps, expected/observed results and any retest:
- Physical-keyboard traversal on a later page through held reads, failure, Retry and automatic recovery; verify next Tab/Shift+Tab, visible focus, no trap or unexpected activation.
- Actual departure to another application with the browser still visible, another browser tab, and minimised/hidden browser. Leave before/during a read and return before/after completion; verify no foregrounding while away, safe fallback after removal, live focus if nothing disappeared, both recovery triggers and a control clicked on return.
- Source Restricted/Unavailable and Overview 503/403 recovery by polling and real window return; verify Work/Site focus persists, first-page reset is explained generically and a disappearing focused Retry transfers safely.
- A supported desktop screen-reader/browser combination: logical reading order, heading/loading/failure/recovery feedback, no unchanged announcement spam or hidden record identity. DOM focus assertions do not prove virtual-cursor or speech behaviour.
- Actual 200% browser zoom, narrow reflow and sticky header/footer visibility; a physical phone with its screen reader and an external keyboard where supported. Viewport resizing is not actual zoom, and emulated phones do not establish physical-device acceptance.

### Delivery and review state

The current contribution changes documentation only. Implementation, new automated test execution, visual comparison, screen-reader/device acceptance and deployment remain unperformed for this correction. The Site page and ReadState specifications link to this amendment while retaining their descriptions of actual runtime behaviour. No component review fingerprint, runnable example, Figma frame or named version is promoted.

The later implementation uses a separate dedicated worktree and PR, updates applicable page/component contracts, fixtures and guides with actual behaviour, and declares any shared-source overlap. Respect the three-build limit and finish existing implemented builds first; the preflight list above is historical, not a current capacity assessment. Dean retains merge authority.

Claude Opus 5.5 [independently reviewed](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#pullrequestreview-5647371727) head `6c1a5a37a2707bb095111a6d75fba3670501c79a` on 26 October 2026 under [CONTRIBUTING](../../CONTRIBUTING.md#independent-review-by-a-second-model). The review reported three Medium and three Low findings and was not an approval. After the source-based correction instructions were prepared, Dean replied **"Proceed"** on 27 October to apply the documentation corrections, keep implementation separate and leave the PR unmerged.

Author dispositions for the 27 October correction are below. All six are addressed in the document; independent verification of the corrected head remains pending. The published correction SHA and its validation results are recorded in the [PR description](https://github.com/deanrfiedler-gif/powerplants-one/pull/715), separately from the reviewed SHA; this table is not an assertion that the reviewer approved the fixes.

| Finding | Author disposition |
|---|---|
| [Medium — Site fallback disappears](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373921787) | Accepted. Persistent Site view node survives failure, Retry and recovery; old bookmark is discarded. Automatic 503/403 recovery by timer and window focus now has exact focus/cursor assertions. |
| [Medium — cursor lost on source/Site removal](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373922138) | Accepted. Ordinary remount retains cursor only while owner survives; source/Site removal ends context and recovery starts at first page with generic feedback. Later-page removal/recovery is explicit in both matrices. |
| [Medium — bookmark lifecycle undefined](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373922510) | Accepted. Active-state predicate, terminal failure/cancellation list, no bookmark revival and fallback-only inactive displacement/return rules are explicit. Page error, automatic recovery and Retry have deterministic outcomes. |
| [Low — actual window departure in Playwright](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373922790) | Accepted. Automated focus/visibility cases are labelled simulated with coherent state stubs; real OS departure/return is specified as separate manual acceptance. |
| [Low — conflicting preamble authority](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373922961) | Accepted. Opening scope note and historical design-only preamble explicitly name section 8's bounded supersession. |
| [Low — stale review statements](https://github.com/deanrfiedler-gif/powerplants-one/pull/715#discussion_r4373923183) | Accepted. Decision and status fragment record the reviewer, date, reviewed SHA and these dispositions; status points to the decision rather than describing a PR as permanently draft. Corrected-head re-review is pending. |
