---
document_id: PPO-CS02-PEOPLE-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 4296429bb96b70c982d5e87201e83ed8f9e5fb22
versioning: git
---

# People design — owner decision

On 18 October 2026 Claude recommended People, scope CS-02 "Contact directory and contact detail", as the next Shared records page: the Sites CS-04 side menu already lists People, and Sites, Sales, Service and Projects pages all name people without a designed destination. Dean agreed: "Yes, draw People CS-02 in Figma next, following the Sites CS-04 pattern." The page covers the contact directory at `/people`, the People view of the `/contacts` hub, and the contact record at `/people/[id]`.

Claude drew the page from these sources:
- the CS-02 design register pages ([scope-cs-02](../design/development/pages/scope-cs-02.md), [route-people](../design/development/pages/route-people.md), [route-people-id](../design/development/pages/route-people-id.md), [route-contacts](../design/development/pages/route-contacts.md));
- [PPO-CS02-DES](contacts-stakeholders-design.md) and its retained [r01 design](../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html);
- the built contact workspace read (`src/shared/contacts/reads.ts`) and the customer notice preferences (`src/communications/preferences.ts`, message classes M1–M4 in `src/communications/model.ts`);
- [D-025 customer communications](customer-communications-d025.md): Powerplants One sends nothing itself, and the named person sends;
- copies of the Sites CS-04 proposal frames (accepted the same day and locked in separately) and the Findings and follow-up SV-07 form card.

Before deciding, Dean asked for an audit: "Give the People CS-02 page an audit and polish before I decide." He then accepted it: "I accept your recommendations for People CS-02." That adopts the recommended answers to D1–D6 and Q1–Q3. A named Figma version, "People — accepted", is proposed and waits for Dean's explicit yes.

Scope:
- `scope:CS-02` "Contact directory and contact detail", with `route:/people`, `route:/people/[id]` and `route:/contacts`.
- Parent requirement IDs are as traced by [PPO-CS02-DES](contacts-stakeholders-design.md). No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, notice or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design People (CS-02) next, on the Sites CS-04 pattern | User decision, 18 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Departures D1–D6 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Primary action | Resolved as recommended | "Correct details" is the record's primary action. There is no Log activity, because Activities cannot link to a person |
| Q2 Role text | Resolved as recommended | The role stays recorded free text, marked "(recorded)". No role list and no purchasing authority until a decision adds one |
| Q3 Inactivating a site contact | Resolved as recommended | Allowed, with a warning that report approval at those sites needs a new active primary contact. It is not blocked |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | Not decided | Waits for Dean's explicit yes |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053). The named version "People — accepted" is proposed, not saved |
| Page | "People · CS-02" `1395:150275`, under "— Shared records —", after Sites · CS-04 `1375:2901` and before Access & readiness · CS-06. The page header `1395:150276` holds the conformance declaration; the notes card `1395:151383` is in Flows and notes. File index row "Row / People · CS-02" `1406:62`, after the Sites row |
| Desktop 1440 × 900 | Register, Active people `1395:150312`; Priya Shah Overview, full length (1440 × 1234) `1395:150562`; Relationships `1396:175528`; Correct details with the reliance warning `1396:354723` |
| Tablet 1024 | Register with the side menu collapsed `1395:150835` |
| Phone 390 and 320 | Active people list `1395:151069`; Priya Shah Overview at 390 `1395:151108` and 320 `1396:355861` |
| States | Phone 390: loading `1395:151245`; no matching people `1395:151303`; could not load `1395:151346`; record in view only, with history restricted `1396:355987` |
| Page parts | Section "Page components (proposed)" `1395:151403`: Person grid header `1395:151404` and Person grid row `1395:151419` (variant set). They stay on the page, as the Sites and Service requests parts do |
| Story | Synthetic, as at Tue 13 Oct 2026 09:00: Priya Shah (Hillview Growers, recorded role Grower, as on Sites), primary contact at SYN Glasshouse 4 and SYN Hillview Growers, requester of SYN-PPO-TKT-000095. She changed her mobile number to 0491 570 806 and asked for texts before 10:00. M4 Project update is Do not notify. Phone numbers are in the ACMA fictional range and email domains end in `.example` |
| Retained captures | [People design r01](../reference/ui/customers/people-design-r01/README.md): nine icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-02`, `route:/people`, `route:/people/[id]` and `route:/contacts` (More › Shared records › People). Parent requirements as traced by PPO-CS02-DES, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for the directory. Record detail for the contact record |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Readiness bar, Field and View tab, Work order record / Blocker row, Planner / Input (proposed), Tag, Button and the phone list row. New, proposed: Person grid header and row |
| Incoming handovers | Any record that names a person (sites, opportunities, service requests, project tasks); organisations and stakeholders; global search |
| Outgoing handovers | The organisation (CS-01) and its stakeholders (CS-03), each site (CS-04), each relying record, Correct details, and notice preferences (D-025). Phone and email hand off to the user's own apps; nothing is sent or logged from the page |
| Source authority | The CS-02 design register pages; PPO-CS02-DES; `src/shared/contacts/reads.ts`; `src/communications/preferences.ts`; D-025 |
| Proposed departures | D1–D6 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "People — accepted" proposed; not saved |

## 4. What the design shows

### Register

- **Grid:** the accepted register grid, one row per person (D1). Columns run Name, Organisation, Role (recorded), Phone, Email, Status, Contact preference, Sites where primary contact, Notice preferences and Last correction, scrolling sideways with fixed checkbox and settings columns. A missing channel reads "Not recorded".
- **Toolbar:** Organisation and Notices filters, the count with its read time ("8 people · as at Tue 13 Oct, 09:00"), Refresh and "…".
- **Side menu:** Organisations and Sites, then a People group with Active people (default), Site contacts, Channels to review and Inactive, then Related: Stakeholders and Service requests (D2). The `/contacts` hub keeps its People and Organisations switch.

### Contact record

- **Layout:** the accepted shared record layout (D3). The header shows the name and status, organisation and recorded role, the sites the person is primary contact for, and the last correction with its version. Notice preferences and Correct details sit top right, with the record position ("7 of 8 in Active people").
- **Before you rely on this contact:** a bar listing phone, email, contact preference, current affiliation, notice exceptions and "Authority not recorded".
- **Details column:** Identity and channels, Current affiliation (with the note that the role is recorded text, not authority to approve, buy or accept work) and Primary contact at, with each site's readiness and next visit.
- **Tabs:** Overview, Relationships, Relied on by, Notices and History.
- **What relies on the person:** each relying record from permitted links only (site primary contact, opportunity contact, service requester, external project task), with its consequence in words and an Open link. "Derived from permitted links only; not a complete interaction log. Activities do not link to people." (D4)
- **Notice preferences:** M1 Dispatch notice, M2 Delay notice, M3 Visit confirmation and M4 Project update, each with its basis: being the named recipient when nothing is recorded, otherwise Allowed or Do not notify with who recorded it, when and why. Changing one sends nothing; the named person sends (D5).
- **Relationships:** current and earlier affiliations and the site primary contact roles, each with the recorded role, period and status. Affiliations in companies the user cannot see are not shown or counted. Ending an affiliation asks for an end date and a reason; site contacts are changed on the site.
- **Correct details:** one form for name, status, email, phone and contact preference with a required reason. Before saving it names the changed values, the version it will save and the relying records that will show the new details, and says nothing is sent to the person (D6).

### Phone

- **List:** rows with the name and the preferred channel, the organisation and recorded role, and one status line (primary contact at, a missing channel, or notice classes set to Do not notify).
- **Record:** a compact header with the status and notice exception, Overview, Relations, Notices and History tabs, a Contact card whose phone and email open the user's own apps, and Relied on by. Correct details is the sticky primary action.
- **States:** loading; no matching people, which says people in companies the user cannot see are not shown or counted; could not load, with no list or counts; view only, where correction history is shown only to people who can correct the contact.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register is a grid: name, organisation, recorded role, phone, email, status, contact preference, sites where primary contact, notice preferences and last correction | The shared CrmDirectory table and phone cards |
| D2 | People is a shared record opened from More. The side menu lists Organisations and Sites, then People views (Active people, Site contacts, Channels to review, Inactive) and related records (Stakeholders, Service requests). The `/contacts` hub keeps its People and Organisations switch | The directory with saved views and the Contacts hub switch only |
| D3 | The accepted record layout with a "Before you rely on this contact" bar, identity, current affiliation and site roles on the left, and Overview, Relationships, Relied on by, Notices and History tabs | Identity & channels, Relationships, Downstream reliance and Correction history tabs |
| D4 | The overview lists what relies on the person, each consequence in words, from permitted links only. It is never called an interaction log | Downstream reliance as its own tab |
| D5 | Notice preferences M1–M4 on the record, per class, with the basis. Changing one sends nothing | Preferences recorded by the D-025 core with no designed place on the record |
| D6 | Correct details is one form with a required reason that names the changed values and the relying records before saving | Inline fields with a reason |

## 5. Not decided and not drawn

- **Building the page.** The built `/people`, `/contacts` and `/people/[id]` routes keep the CrmDirectory register and the tabbed contact workspace. The build order is not decided.
- **Prerequisites for a build:**
  - a register read that returns the grid columns, including sites where primary contact, notice preference summaries and last correction;
  - the reliance read for the overview card, from permitted links only;
  - notice preference reads and the record command on the contact record (D-025 core);
  - the inactivation warning for site primary contacts (Q3).
- **The Conversations action** is part of the proposed top-bar shell amendment. As on Sites, the phone record header has no Conversations action.
- **Not drawn:**
  - the Organisations view of the `/contacts` hub;
  - the Notices and History tabs at full size;
  - ending an affiliation and creating a person;
  - restricted-affiliation and denied states, desktop register states and hover states;
  - 200% zoom, which the spec reviews separately.
- **Data in the frames:** the people, organisations, sites, phone numbers and records are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude checked every frame for truncation, clipping, placeholders, fonts (Roboto only) and stale links, and the story against the accepted Sites and Service requests pages.

- **Corrected:** Priya's recorded role is Grower, as on Sites; her service request is SYN-PPO-TKT-000095 (Hillview Growers), because SYN-PPO-TKT-000088 belongs to Northbank Farm.
- **Polished:** the overview is full length, with the notice card's rule and footnote shown; amber icons left from warning rows are neutral; the record buttons open Correct details; the no-matches filter and time match the other states; the 390 footer no longer repeats the Notices tab.
- **Left as on Sites:** the phone record header has no Conversations action, and the record header avatar shows the person's own initials.

The audit is recorded on the notes card `1395:151383`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit.
- The nine captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 220,000. Prototype links were removed and each of the 345 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 768 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/customers/people-design-r01/README.md).
- The page header's Status and Decision record fields now point at this lock-in. The frames themselves were not changed.
- The page has no prototype flow. The source frames carry four navigation links and the shared components' hover interactions; Claude did not play them in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
