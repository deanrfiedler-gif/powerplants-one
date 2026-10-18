---
document_id: PPO-CS04-SITES-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; named Figma version, native implementation and UI baseline acceptance separate
source_commit: 3bd12c428ec1db087d35bf2e6e55f8845a78b9db
versioning: git
---

# Sites design — owner decision

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
