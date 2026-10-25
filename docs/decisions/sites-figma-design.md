---
document_id: PPO-CS04-SITES-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design and 26 October focus amendment; focus implementation queued; visual and device acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Sites design — owner decision

Sections 1–7 retain the 18 October design decision and its evidence. The [26 October amendment](#8-keyboard-focus-during-follow-up-refresh--26-october-2026) records the subsequently authorised keyboard behaviour; it does not change the retained Figma version or claim that the focus correction is implemented.

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

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

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

At inspected main `f8ea675ef0c8394dc04b101f837fdcf445356f7e`, [useCrmResource](../../src/components/crm-state.ts) polls every 15 seconds and on window focus. [siteOverview](../../src/shared/sites.ts) supplies a fresh observation timestamp. [SiteWorkspace](../../src/components/site-workspace.tsx) passes that observation to [RelatedActivities](../../src/components/context-screens.tsx), whose keyed child remounts while the selected cursor survives. Protected rows and controls therefore disappear while the current page is reread. A Restricted/Unavailable source removes the child; an unsuccessful Overview read clears the loaded Site. [The existing CS-04 test](../../tests/browser/sites-native.spec.ts) verifies page scoping, clearing and rejection of an old reply after source revocation.

The disappearance of a focused DOM element explains the reported keyboard interruption. This investigation traced source and existing tests; it did not execute a new browser reproduction. ReadState also defaults to `focusOnError=true`, so a background error can take focus even after the user has moved elsewhere. That is a second case the correction must address.

The #710 description's pending full-browser evidence was subsequently available at head `8f2b9a363a4071c3bcbe272435c8581277e3fe29`: [desktop job 121083956047](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40164930472/job/121083956047) reports 612 passed, and [mobile job 121083956082](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/40164930472/job/121083956082) reports 555 passed. Both logs include the selected P11 journey and `quality-owned-follow-up.spec.ts`. Those results establish the test-helper correction at that head; they do not prove preservation of a user's focus or apply to this unbuilt correction. #710 remains a separate test-only contribution.

### Adopted behaviour

1. **Keep a safe anchor mounted.** Keep the non-sensitive Owned follow-up heading outside the remounted activity read. Give it `tabIndex=-1` and a visible focus indicator. It is available for programmatic focus, without an added ordinary Tab stop. Its accessible name never depends on retained activity content.
2. **Capture before removal.** If the refresh is about to remove the focused row or control, capture its stable activity ID and control identity, not its label, position or old DOM node as restoration authority. Scope the in-memory bookmark to the actor/workspace session, Site, selected cursor and latest refresh generation. Transfer focus to the safe heading in the same update, before the next keyboard interaction can fall through to the document. A passive effect after deletion alone is insufficient. The implementation must verify this lifecycle under React StrictMode and repeated refreshes.
3. **Preserve access clearing and freshness.** A fresh Overview observation still clears the old activity rows, links and counts while that cursor is reread. This is the current boundary, not a new promise to clear at the instant a poll starts. Restricted/Unavailable source evidence still removes the child. Failed/denied reads do not display cached records. Beyond the minimal ID/control bookmark, retain no old labels, hrefs, counts or row payloads in hidden DOM, an inert subtree, focus metadata or a live announcement. Keep the 15-second and window-focus checks, current server authorization and `private, no-store` responses. This preserves the existing revocation-detection timing; it does not claim instantaneous server-pushed revocation.
4. **Restore only a current permitted target.** Once the latest successful read is rendered, restore the exact activity/control only if it exists in the permitted current page, the context is unchanged, the document is active, focus is still on the anchor placed by this refresh, and no intervening user action has cancelled the bookmark. Match by stable ID plus control identity, never by row number or summary. Do not load another page to find the target or substitute another activity. Clear the bookmark on restoration, cancellation, denial or a terminal fallback. Use scroll preservation when the target remains visible; if layout changes put it outside the viewport or behind a sticky header/footer, reveal only enough to keep focus visible.
5. **Respect the user's subsequent actions.** Tab, Shift+Tab, pointer/touch interaction, a deliberate page turn, navigation, a dialog interaction or window departure cancels pending automatic restoration. A request finishing later must not pull focus back. Do not trap Tab on the loading heading or queue/replay Enter against a replacement control. A refresh that leaves the active element mounted must not move it. Carry a still-valid bookmark forward to the newest same-context generation only while focus remains on the managed anchor; replies from older generations can restore neither content nor focus.
6. **Use safe fallbacks.** If the activity/control is absent, keep focus on the Owned follow-up heading and provide a generic current-page explanation, without identifying hidden records. If the entire Follow-ups source becomes Restricted/Unavailable, remove it and transfer affected focus to the surviving Work and visits heading. If the whole Site becomes unavailable, use a generic unavailable-state target outside the protected record. These fallbacks must be owned by a boundary that survives the removed subtree and apply only when that removal displaced focus. Identity change discards the bookmark; the existing [session view boundary](../../src/components/session-view-boundary.tsx) takes precedence, including its own focus handling.
7. **Handle background failure without stealing focus.** Use the existing ReadState `focusOnError=false` option for this background-read host and let the scoped focus boundary manage any required transfer. Keep a labelled, keyboard-reachable Retry control. Retry must apply the same capture and no-steal rules if its focused control is removed. A user who has moved elsewhere keeps that focus on both failure and later recovery; the default shared error behaviour for other consumers is unchanged.
8. **Keep feedback concise.** Mark the updating results region busy and provide a stable, generic status message for loading, failure or changed availability. Keep any essential loading message outside a busy region that would defer its announcement. Do not make the entire list a live region or repeatedly announce unchanged content on every poll. The temporary anchor and restored control must remain visibly focused and unobscured on desktop and phone. Announcement quality requires actual screen-reader review.
9. **Distinguish explicit paging.** Native Next/First activation changes the cursor once and places affected focus at the new page's heading so the following Tab enters its results. Background refresh retains the selected cursor and restores the former target only under the conditions above. A disappearing Next control on the final page falls back to the heading; an automatic refresh must never advance the cursor.

### Alternatives and separate question

| Approach | Disposition |
|---|---|
| Pause polling while keyboard focus is in the list | Rejected for this correction: delays fresh data and discovery of revoked access. |
| Retain rows and reconcile them by ID during refresh | Deferred: good continuity, but retaining unconfirmed rows conflicts with the current clear-while-rereading contract. Removing the observation key alone also removes its reread trigger. A broader authority/freshness design would be needed. |
| Remount, then restore after the request finishes | Rejected alone: focus is lost during loading and an unconditional late restore can interrupt the user's next action. |
| Persistent safe anchor plus guarded restoration | Adopted: preserves orientation while protected rows still clear. The trade-off is a brief loading interruption and lifecycle/race-handling logic. |

This focus correction makes no full WCAG conformance claim. [WCAG 2.2.2](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) raises a separate presentation-control question for automatic updates. Pause/hide/frequency controls and any essential-update justification remain **undecided and outside this build**. A future presentation-only hide/show design could keep permission checks running and require fresh data when shown; that is an option, not an adopted control. The focus contract follows [W3C focus-persistence guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) and [status-message guidance](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

### Required implementation proof

Add direct browser assertions in proposed `tests/browser/sites-follow-up-focus.spec.ts`. That path is planned, not an existing or executed test. Reuse the real Site page and synthetic read fixtures; assert `document.activeElement`/`toBeFocused()` during a held read and after it completes. Native keyboard traversal must expose any focus loss rather than using #710's retry helper to recover it. Install controlled clocks before application timers start; gate responses explicitly instead of relying on sleep durations. Give each new Overview response distinct observation evidence.

| Case | Required observable result |
|---|---|
| 15-second timer and window-focus trigger | Each trigger rereads the selected cursor, clears old rows, parks affected focus safely during a held response and restores the same permitted target on completion. Include actual window departure/return as well as a controlled focus event. |
| Fresh content and changed row position | Current summary/status is displayed and restoration follows ID/control identity, not old text or ordinal. A second automatic refresh behaves identically. |
| User action during loading | Parameterise Tab, Shift+Tab, pointer/touch, dialog, tab/Site navigation and window departure; completion never steals focus back. Tab can leave without a trap. |
| Focus outside the removed content | Successful refresh, failed refresh and retry completion leave the surviving focused element unchanged. |
| Activity/control absent, empty or final page | No stale target remains; the safe heading receives/retains focus, and generic feedback discloses no hidden identity. |
| Source Restricted/Unavailable and Site denial | Parameterise source states and 401/403/404; protected labels, hrefs and counts leave both DOM and accessibility exposure, with the correct surviving fallback. |
| Overlapping success and failure | Deliver an old success/error after a newer response or restriction. Neither stale data nor stale focus is restored. |
| Session and context boundaries | Changing actor/workspace, locking the session, changing Site or cursor invalidates restoration; the session boundary's focus cannot be overridden. |
| Network/5xx/malformed-response failure and Retry | Old rows remain absent, Retry is keyboard reachable, focus is safe throughout retry loading, and recovery honours cancellation. |
| Paging/refresh race | Refresh during Next/First keyboard activation, during a page load and just as a target page arrives; one deliberate turn only, no skipped/double page, selected cursor retained during automatic refresh. |
| Semantics and visibility | No positive tabindex, duplicate target IDs, dangling ARIA references or hidden focusable remnants; busy/status semantics are correct; focus ring and target are visible and not obscured by sticky UI. |
| Live permission boundary | On a disposable synthetic server/database, revoke relevant source/Site access and verify current scoped reads refuse/hide the data, late replies do not revive it, and cache-control remains private/no-store. Mocked browser responses alone do not prove authorization. |

Run the focused cases at desktop and 390/320 px, with keyboard navigation and 200% zoom/reflow checks. Retain the existing CS-04 clearing/late-response regression, inspect other RelatedActivities consumers if any shared code changes, and rerun the compiled browser and complete P01–P11 lanes at the implementation's final head. Record browser/OS/assistive-technology versions and results separately for manual keyboard and screen-reader review; emulated phones do not establish physical-device acceptance. Existing passing #710 runs are not substituted for these executions.

### Delivery and review state

The current contribution changes documentation only. Implementation, new automated test execution, visual comparison, screen-reader/device acceptance and deployment remain unperformed for this correction. The Site page and ReadState specifications link to this amendment while retaining their descriptions of actual runtime behaviour. No component review fingerprint, runnable example, Figma frame or named version is promoted.

The later implementation should use a separate dedicated worktree and PR, update the applicable page/component contracts, fixture states and guides with actual behaviour, and declare any shared-source overlap before editing. Respect the three-build limit and finish the already implemented builds first. A different-model review of this owner-decision amendment is required before merge under [CONTRIBUTING](../../CONTRIBUTING.md#independent-review-by-a-second-model); none has taken place in this contribution. Dean retains merge authority.
