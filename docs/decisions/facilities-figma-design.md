---
document_id: PPO-CS05-FACILITIES-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
versioning: git
---

# Facilities and growing areas design — owner decision

On 18 October 2026 Dean asked which UI page to design next in Figma. Claude recommended Facilities and growing areas, scope CS-05, because the Sites CS-04 side menu and Equipment tab already point to it and it was the only page in its build-sequence group without a design. Dean agreed: "Proceed with Facilities and growing areas (CS-05, /facilities)." The page covers four routes:
- the register at `/facilities`;
- the create form at `/facilities/new`;
- the facility record at `/facilities/[id]`;
- the correction and review at `/facilities/[id]/edit`.

Claude drew the page from these sources:
- the CS-05 design register pages ([scope-cs-05](../design/development/pages/scope-cs-05.md), [route-facilities](../design/development/pages/route-facilities.md), [route-facilities-new](../design/development/pages/route-facilities-new.md), [route-facilities-id](../design/development/pages/route-facilities-id.md), [route-facilities-id-edit](../design/development/pages/route-facilities-id-edit.md));
- [ADR-0037](ADR-0037-cs05-facilities-native.md) and the [CS-05 handover](../delivery/facilities-growing-areas-handover.md), with decisions CS05-D01 to D05;
- the field definitions in `src/shared/facilities/definition.ts`;
- the native captures in [cs05-native-r01](../testing/evidence/cs05-native-r01/README.md);
- copies of three accepted designs: the Sites CS-04 frames, the People CS-02 correction card and the Service requests SV-01 "Log a request" form.

Before deciding, Dean asked for an audit: "Give the pages an audit and polish to ensure they are as professional as possible." He then accepted the design: "I accept the Facilities and growing areas CS-05 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 and the recommended answers to Q1–Q4. After the captures were made, Dean asked for the named version: "Yes, save the named Figma version "Facilities and growing areas — accepted"." The design reference is that named version.

Scope:
- `scope:CS-05` "Facilities and growing areas", with `route:/facilities`, `route:/facilities/new`, `route:/facilities/[id]` and `route:/facilities/[id]/edit`.
- Parent requirement IDs are as traced by ADR-0037 and the CS-05 handover. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design Facilities (CS-05) next | User decision, 18 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Facility numbers | Resolved as recommended | No new numbers. The path (site › parent › area) is the readable identity, and the record ID can be copied. Numbering needs its own decision (CS05-D01) |
| Q2 Location pin | Resolved as recommended | The pin is proposed or checked, with a handoff to external maps only. No embedded map until a map provider has an ADR |
| Q3 Details to complete | Resolved as recommended | The view lists areas with an Unknown structure or use, or no footprint |
| Q4 Work on an area | Resolved as recommended | Work orders and visits stay linked to the site. The record shows "Site context" until a decision adds links to areas |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | User decision, 18 October 2026 | "Yes, save the named Figma version "Facilities and growing areas — accepted"." Saved in the Figma desktop app at about 19:20 by a Claude session on Dean's yes, and seen in version history as Dean Fiedler's "just now" entry after the panel was reopened |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053), at the named version "Facilities and growing areas — accepted" |
| Page | "Facilities and growing areas · CS-05" `1415:357158`, under "— Shared records —", after Sites · CS-04 `1375:2901` and before People · CS-02. The page header `1415:357159` holds the conformance declaration. The notes card `1415:358266` is in Flows and notes. File index row "Row / Facilities and growing areas · CS-05" `1423:376950`, after the Sites row |
| Desktop 1440 | Register, All facilities `1415:357195`; register with the Bay 4 snapshot `1416:363644`; Hierarchy for SYN Glasshouse 4 `1416:365147`; Bay 4 Overview `1415:357445`; Equipment, installed and serving `1416:366300`; Correct details (1440 × 1033) `1416:366753`; Review saved and proposed values (1440 × 1120) `1416:367175`; Add facility or area `1416:367649` |
| Tablet 1024 | Register with the side menu collapsed `1415:357718` |
| Phone 390 and 320 | SYN Glasshouse 4 areas list `1415:357952`; Bay 4 Overview at 390 `1415:357991` and 320 `1416:369291`; Review saved and proposed values at 390 `1416:369765` |
| States | Phone 390: loading `1415:358128`, no matching areas `1415:358186`, could not load `1415:358229`. Desktop: Bay 4 changed since you opened it, with the proposal kept (`1418:362899`); result not confirmed, with the entries kept (`1418:363291`); view only (`1418:363685`) |
| Page parts | Section "Page components (proposed)": Facility grid header `1415:358287` and Facility grid row `1415:358302` (variant set). They stay on the page, as the Sites and People parts do |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Sasha Cole. The register holds 31 facilities across the seven sites on the Sites page, matching its Areas counts: 17 growing areas, 13 non-growing and 1 unknown. Bay 4 is physically within Glasshouse 4 at SYN Glasshouse 4, where Thursday's shade screen motor work happens. Its equipment: shade screen motor M-4 is installed there and serves Glasshouse 4; temperature sensor TS-5 is installed there and serves Bay 4; irrigation valve bank VB-4 serves it from the Pump shed; vent actuator VA-41's service link ended on 2 October. The correction changes the footprint from 1,152 to 1,188 m² and clears the season label, so version 7 becomes 8. The create form records Bay 2 |
| Retained captures | [Facilities design r01](../reference/ui/customers/facilities-design-r01/README.md): seventeen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-05`, `route:/facilities`, `route:/facilities/new`, `route:/facilities/[id]` and `route:/facilities/[id]/edit` (More › Shared records › Facilities & growing areas). Parent requirements as traced by ADR-0037, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist; record detail; form or guided workflow; review or comparison |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Readiness bar (as "Details recorded"), Field, View tab, Section heading, Work order record / Blocker row, Record / Banner, Tag, Button, Excel confirmation row, Planner / Input (proposed) and the phone list row. New, proposed: Facility grid header and row |
| Incoming handovers | The Sites (CS-04) related menu and its Facilities & areas count; the filtered register embedded in Site details; equipment records, which name where they are installed; the More panel |
| Outgoing handovers | The site record, equipment records and their service links, Estimating (which keeps its own copy of the name and version and is never repriced), and an address handoff to external maps. Never permission to work or technical approval |
| Source authority | The CS-05 design register pages; ADR-0037 and the CS-05 handover (CS05-D01 to D05); `src/shared/facilities/definition.ts`; the native captures cs05-native-r01 |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Facilities and growing areas — accepted", saved 18 October 2026 |

## 4. What the design shows

### Register

- **Grid:** the accepted register grid, one row per facility or area (D1). Columns: Facility / area, Site, Within, Structure, Use, Crop / crop group, Footprint (m²), Basis, Installed equipment and Last changed. Footprint and equipment counts are right-aligned. A value that was not recorded reads "Not recorded" or "—", never zero. An Unknown structure shows as a tag.
- **Toolbar:** a primary "+ Facility / area" button, then Site, Structure and Use filters, the count with its read time ("31 facilities · as at Tue 13 Oct, 09:00"), a List and Hierarchy toggle, Refresh and "…". At 1024 the Use filter moves into "…".
- **Side menu:** Organisations, People and Sites, then a Facilities & areas group: All facilities (31, the default), Growing areas (17), Non-growing (13) and Details to complete (4). Related: Site surveys & as-found, and Equipment (D2).
- **Snapshot:** selecting a row opens a read-only snapshot over the grid (D3). It shows identity and location, structure, context and measurements, the equipment links and the latest history, with Open site and Open facility.
- **Hierarchy:** the same grid with recorded parents indented. A Relationship column shows "Physically within" or "Grouping". A banner says nothing is inherited from a parent.

### Facility record

- **Identity:** the record uses the accepted shared record layout (D4, D5). The header shows the name and structure, the path SYN Glasshouse 4 › Glasshouse 4 › Bay 4, who last changed it and when, the record ID with Copy and the version, and the position ("13 of 31 in All facilities"). Open site and Correct details sit top right.
- **Details recorded:** a bar listing structure type, use and crop, on-site position and footprint, then "Pin not checked" and "Measurements approximate".
- **Details column:** Area (site, within, relationship, structure, cladding, bay count, use, crop), Location (on-site position, its source, the pin, and the external-maps note) and Site context. Site context says that access, biosecurity, readiness and visits are kept on the site, and that work is not linked to individual areas (Q4).
- **Tabs:** Overview, Equipment, Sources and History. The Overview has a Measurements card and a Growing context card. Each shows its basis, observation date and source beside the values. A note says Estimating keeps its own copy and is never repriced.
- **Equipment:** three groups (D6). The first is equipment installed here. The second serves this area but is installed elsewhere. The third holds ended service links. "Installed in" and "Serves" are separate columns, and linking or ending a link needs a reason and source. The ended link's reason and a link to the site's equipment register sit below the table.

### Correct, review and add

- **Correct details:** a form inside the record, with Measurements and Growing context groups and a required reason (D7). Optional values are not marked Required. A field that will be cleared says so and shows its saved value.
- **Review changes:** saved and proposed values side by side, grouped as Changed, Will be cleared and Parent path. An acknowledgement must be ticked before "Confirm these changes", which saves version 8. A version conflict keeps the proposal for review against the new version. An unconfirmed result keeps the entries and points to History before trying again. Reloading discards the proposal, as built.
- **Add facility or area:** follows the accepted Log a request form. Site and name, structure and use, and measurements and reason are grouped. A "Check before creating" column lists the areas already recorded at the site, highlights the closest name and says the check is a prompt, not a block.

### Phone and tablet

- **Tablet:** the register with the side menu collapsed.
- **List:** a site's areas, each with structure and parent, footprint and one status line. The area with an Unknown structure says "Details to complete".
- **Record:** Measurements and Location cards, with Open site and Correct details in the footer. At 320 the details are shortened, not clipped.
- **Review:** the same saved-to-proposed changes as a list, with the acknowledgement and Confirm.
- **States:** loading; no matching areas, with the active filter chips, which says areas hidden by site access are not counted; could not load, with no list or counts.

### Departures, accepted

| ID | Departure | Built pattern |
|---|---|---|
| D1 | The register is a grid: facility, site, within, structure, use, crop, footprint, basis, installed equipment and last changed | A filter form above a table, with an Inspect button in every row and the record ID as a column |
| D2 | Facilities is a shared record opened from More, beside Sites. Its views are All facilities, Growing areas, Non-growing and Details to complete. Site, structure and use are toolbar filters, and List and Hierarchy stay as a toggle | A filter form with Search, Site, Structure type, Use and Sort, and the Customer locations menu |
| D3 | Selecting a row opens a read-only snapshot over the grid | An inspection dock at 1920 only, and full records below that |
| D4 | No facility number. The path is the readable identity, and the record ID with Copy sits in the header line | A labelled canonical UUID in the register and the record |
| D5 | The accepted record layout with a "Details recorded" bar, details on the left, and Overview, Equipment, Sources and History tabs. Measurements and context show basis, date and source beside the values | Overview, Related records and History tabs with stacked groups of fields |
| D6 | Equipment in three groups, with Installed in and Serves as separate columns. Linking and ending need a reason and source | Related records with add and end controls |
| D7 | Correct details opens in the record. Review changes compares values side by side, with an acknowledgement, and the failure states keep the entries. Add facility or area follows Log a request, with "Check before creating" | An edit page with inline comparison, and a create form |

## 5. Not decided and not drawn

- **Building the page.** The built `/facilities` routes keep the native register, record and edit pages from PR #274. The build order is not decided.
- **Prerequisites for a build:**
  - a register read that returns the grid columns, including the parent, installed equipment counts and last change;
  - the counts for the side menu views, including Details to complete (Q3);
  - the snapshot read, which can reuse the workspace read;
  - the "Check before creating" lookup of areas at the chosen site.
- **The Conversations action** is part of the proposed top-bar shell amendment.
- **Not drawn:**
  - the Sources and History tabs at full size, and pin review;
  - the Link serving equipment and End a service link dialogs;
  - a Grouping parent;
  - Add facility or area at tablet and phone, and the tablet record;
  - denied access, hover states and 200% zoom.
- **Data in the frames:** the sites, facilities, equipment, people and records are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude checked every frame for truncation and overflow, fonts (Roboto only), leftover Sites content and rail selection. It also checked that every top bar and phone header carries the Conversations action, and that the story matches the accepted Sites, People and Access & readiness pages.

- **Corrected:**
  - The register and tablet list all 31 facilities, matching the Sites Areas counts and the view counts.
  - The snapshot counts two items serving Bay 4.
  - VB-4 serves Glasshouse 4, Bay 3 and Bay 4, matching the Sites equipment table.
  - The phone no-matches state shows its filter chips at 09:00, and the Site filter no longer has a calendar icon.
- **Polished:**
  - Footprint and equipment counts are right-aligned numbers.
  - The ended-service reason and the register link are separate.
  - Form group headings match Log a request.
  - The cleared season label reads as "Not recorded".
  - Review status words are neutral, and amber only in the two failure states.
  - Frame labels sit 10 px above their frames.

The audit and the acceptance are recorded on the notes card `1415:358266`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit. A measured scan found no clipped single-line text.
- The seventeen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 240,000. Image 14 is a frame holding copies of the three phone states. Prototype links were removed, and each of the 794 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 2,299 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/customers/facilities-design-r01/README.md).
- Before the captures were made, the notes card's Accepted paragraph and the page header's Status field were updated. The header's Decision record and Named version fields were then pointed at this lock-in, before the named version was saved. The frames themselves were not changed.
- The page has no prototype flow. Claude did not play the shared components' hover interactions in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
