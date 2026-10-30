---
document_id: PPO-CS01-ORGANISATIONS-FIGMA-DEC
date: 2026-10-18
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: 1eccd20520aaf2ae98bcc7c64f1d87baa3ebe8a5
versioning: git
---

# Organisations and Customer 360 design — owner decision

On 18 October 2026 Dean asked which UI page to design next in Figma. Claude recommended the customer register and Customer 360, scope CS-01, because it was the last page in the customer and site records group without an accepted design, it is the first step of the build sequence's synthetic job walk, and the earlier Customer 360 proposal had no named version and predated the page template. Dean agreed: "Yes, draw the Customer register and Customer 360 CS-01 page in Figma next, following the Sites and People pattern." The page covers three routes:
- the register at `/customers`, labelled Organisations in the app;
- the Customer 360 record at `/customers/[id]`;
- the create form at `/customers/new`.

Claude drew the page from these sources:
- the CS-01 design register pages ([scope-cs-01](../design/development/pages/scope-cs-01.md), [route-customers](../design/development/pages/route-customers.md), [route-customers-id](../design/development/pages/route-customers-id.md), [route-customers-new](../design/development/pages/route-customers-new.md));
- the built organisation directory columns (`src/components/crm-directory.tsx`), the Customer 360 read and its source states Complete, Partial, Restricted, Unavailable and Not configured (`src/shared/customer-360.ts`, `src/components/customer-workspace.tsx`) and the shared create form (`src/components/shared-create-form.tsx`);
- the earlier [Customer 360 Figma proposal](customer-360-figma-design.md) (page `554:2`), kept unchanged as history;
- copies of three accepted designs: the People CS-02 page, the Facilities CS-05 "Add facility or area" form with "Check before creating", and the Sites CS-04 story.

Before deciding, Dean asked for an audit: "Give the Organisations CS-01 page an audit and polish before I decide." During the audit he asked for a filter on the Sales tab: "I think we would need to add a filter to the section in the attached screenshot so we can filter quotations, sales orders, deals, etc." He then accepted the design: "I accept the Organisations CS-01 design with your recommendations, including D1–D7 and Q1–Q4." That adopts D1–D7 and the recommended answers to Q1–Q4. The named Figma version waits for Dean's explicit yes (section 7).

Scope:
- `scope:CS-01` "Customer register and customer 360", with `route:/customers`, `route:/customers/[id]` and `route:/customers/new`.
- Parent requirement IDs CRM-01, CRM-04, CRM-06 and SVC-06, as traced by the earlier proposal, are unchanged. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, ERP connection or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CS-01 next, on the Sites and People pattern | User decision, 18 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 18 October 2026 | Quoted above. Section 6 |
| Type and status filter on the Sales tab | User decision, 18 October 2026 | Dean's request quoted above. Drawn as D6 |
| Departures D1–D7 | Accepted as recommended, 18 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Primary action | Resolved as recommended | "Create follow-up" (an owned activity in My Work) is the primary action, Account development is second, and Stakeholders, Correct details, Refresh sources and Copy link sit under "…" |
| Q2 Organisations that are not customers | Resolved as recommended | One Organisations register. The relationship to each site is shown in words (operator, owner, billing party); there is no separate customer type until a decision adds one |
| Q3 Accounts tab | Resolved as recommended | Each Finance account is listed by company with its source "as at" time and never combined into one balance. People without Finance access see Restricted and no counts |
| Q4 Phone | Resolved as recommended | Overview, Sales, Service and Sites are the phone tabs; Projects, Accounts and Activity are reached by scrolling the tab strip. The sticky action is Create follow-up |
| Accept the design | User decision, 18 October 2026 | Quoted above |
| Named Figma version | Saved | "Organisations — accepted", 18 October 2026; confirmed in version history on 25 October 2026 ([Figma file audit](../design/figma-file-audit/figma-file-audit-2026-10-24.md) R3). Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Organisations · CS-01" `1443:2615`, first under "— Shared records —", before Sites · CS-04 `1375:2901`. The page header `1443:2616` holds the conformance declaration; the notes card `1443:3606` is in Flows and notes. File index row "Row / Organisations · CS-01" `1452:385287`, before the Sites row. The earlier page "Customer 360 (proposal)" `554:2` is unchanged |
| Desktop 1440 | Register, All organisations `1443:2652`; Hillview Growers Customer 360 overview, full length (1440 × 1234) `1443:2745`; Sales, full length (1440 × 1078) `1445:381060`; Sales filtered to quotations with the Status menu open `1449:381169`; Create organisation with "Check before creating" `1445:381483` |
| Tablet 1024 | Register with the side menu collapsed `1443:3145` |
| Phone 390 and 320 | All organisations list `1443:3223`; Hillview Growers overview at 390 `1443:3263` and 320 `1443:3332` |
| States | Phone 390: loading `1443:3400`; no matching organisations `1443:3458`; could not load `1443:3501`; Service could not be read `1443:3537` |
| Page parts | Section "Page components (proposed)" `1443:3626`: Organisation grid header `1443:6191` and Organisation grid row `1443:3629` (variant set). They stay on the page, as the Sites, People and Facilities parts do |
| Prototype | Flows "CS-01 — desktop" (from the register) and "CS-01 — phone" (from the list): register row to Customer 360, Overview and Sales tabs, the filter and Status menu, breadcrumb back, quick add to Create organisation and Cancel back; on phone, list to record and Back |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Sasha Cole (Service). Ten organisations `SYN-PPO-ORG-…`. Hillview Growers (`SYN-PPO-ORG-000007`, relationship owner Jamie Park) operates SYN Glasshouse 4 (owned by Valley Land Trust) and SYN Hillview Growers; Priya Shah is primary contact at both and Noah Clarke is accounts payable. Its open work: deals `SYN-PPO-OPP-000118` and `-000131`, quotation `SYN-PPO-QUO-000151` r2, request `SYN-PPO-TKT-000095`, work order `SYN-PPO-WO-000040`, visit `SYN-PPO-APT-000052` (moved to Thu 15 Oct) and project `SYN-PPO-PRJ-000014`. Sales orders and documents are not connected and Accounts are restricted for Sasha. SYN Northbank Nursery has site SYN Northbank Farm and requests `SYN-PPO-TKT-000088` and `-000091`, as on Service requests and Discovery. The create form records Coastal Berry Farm and flags the prospect Coastal Berry Farms as the closest name |
| Retained captures | [Organisations design r01](../reference/ui/customers/organisations-design-r01/README.md): ten icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-01`, `route:/customers`, `route:/customers/[id]` and `route:/customers/new` (More › Shared records › Organisations). Parent requirements CRM-01, CRM-04, CRM-06 and SVC-06 unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for the directory. Record detail with an overview dashboard for Customer 360. Form for the create page |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Record / Header, Record / Readiness bar and Check item, Record / Field and View tab, Record / Filter chip, Work order record / Blocker row, Planner / Input (proposed), Tag, Button and the phone list row. The create form copies the accepted Facilities "Add facility or area". New, proposed: Organisation grid header and row |
| Incoming handovers | Leads (create an organisation from a lead), deals, sites, people and service requests that name the organisation; global search |
| Outgoing handovers | Each permitted source record: deals (CR-01), quotations (ES-05, ES-06), service requests (SV-01), work orders (SV-03), visits (SV-04), projects (PJ-02); sites (CS-04), people (CS-02), stakeholders (CS-03), account development (CS-07), Finance accounts (FN-02), owned follow-up in My Work and Create deal in Sales |
| Source authority | The CS-01 design register pages; `src/shared/customer-360.ts`; `src/components/crm-directory.tsx`; `src/components/shared-create-form.tsx`; the earlier Customer 360 proposal as history |
| Proposed departures | D1–D7 in section 4, accepted |
| Status | Owner-accepted design, 18 October 2026 |
| Decision record | This file |
| Named version | "Organisations — accepted" (saved 18 October 2026) |

## 4. What the design shows

### Register

- **Grid:** one row per organisation (D1). Name, Status, Relationship owner, Sites, Open deals, Open service and Next follow-up are visible at 1440; Sector, Areas and Reference follow by scrolling sideways, with fixed checkbox and settings columns. Counts are of permitted records only. A possible duplicate carries a copy icon beside its name.
- **Toolbar:** Status and Relationship owner filters, the count with its read time ("10 organisations · as at Tue 13 Oct, 09:00"), Refresh and "…".
- **Side menu:** People and Sites, then an Organisations group with All organisations (default), Prospects, Possible duplicates, Without a current site and Inactive, then Related: Stakeholders and Account development (D2).

### Customer 360

- **Layout:** the accepted shared record layout (D3). The header shows the name and status, reference and sector, the relationship owner and the version with who changed it last. Account development and Create follow-up sit top right, with the record position ("5 of 10 in All organisations").
- **Sources for this customer:** a bar that states each source's state in words: Deals, Quotations, Service and Projects complete; "Orders and documents not connected"; "Accounts restricted for you".
- **Details column:** Identity (legal name, reference, status, sector, relationship owner, company), with the note that an organisation is not automatically an ERP debtor account; Sites, each with the organisation's relationship and its readiness; People, with their recorded roles.
- **Tabs:** Overview, Sales, Service, Projects, Sites, Accounts and Activity (D5).
- **Open work:** open records from each permitted source, with that source's own state and an Open link, then owned follow-ups. There is never a total, margin or balance, and a restricted, unavailable or unconnected source is never shown as zero (D4). Possible duplicates are reported in words; records are never merged automatically.
- **Sales tab:** deals, quotations and sales orders in one table (D6). Type chips (All, Deals, Quotations, Sales orders, each with its count) and a Status filter (all statuses, open or awaiting a decision, closed) sit above it. Every quotation revision is listed and never added to another; amounts keep their own currency and tax basis; sales orders say "Not connected" until MYOB orders are read. Create deal opens Sales with the organisation filled in.

### Create organisation

- The accepted Facilities create form (D7): Organisation (company, display name, sector, status, legal name), Owner and source (relationship owner, and "Created from" read-only when opened from a lead) and Notes.
- **Check before creating:** similar names in permitted companies, the closest first, with Open and "Use this record", which links the lead to the existing organisation and creates nothing. The check is a prompt, never a block, and records are never merged automatically. Organisations in companies the user cannot see are not checked or shown.

### Phone

- **List:** rows with the name and status, the reference and owner, and one status line (sites and open work, a possible duplicate, or no current site).
- **Record:** a compact header with the status and the restricted source, Overview, Sales, Service and Sites tabs, a Primary contact card whose phone and email open the user's own apps, and Open work. Create follow-up is the sticky action.
- **States:** loading; no matching organisations, which says organisations in companies the user cannot see are not shown or counted; could not load, with no list or counts; and Service could not be read, where the other sources stay as at 09:00 and service work is not shown or counted until it loads.

### Departures, accepted

| ID | Departure | Earlier pattern |
|---|---|---|
| D1 | The register is a grid: name, status, relationship owner, sites, open deals, open service and next follow-up, then sector, areas and reference | The shared CrmDirectory table (name, reference, status, sector, owner, sites, facilities, open deals) and phone cards |
| D2 | Organisations is a shared record opened from More. The side menu lists People and Sites, then organisation views (All organisations, Prospects, Possible duplicates, Without a current site, Inactive) and related records (Stakeholders, Account development) | Saved views and a "Relationships owned by me" filter |
| D3 | The accepted record layout with a "Sources for this customer" bar, identity, sites and people on the left, and Overview, Sales, Service, Projects, Sites, Accounts and Activity tabs | A page header, four equal action buttons and eight tabs |
| D4 | The overview lists open work by source with each source's state, then owned follow-ups; never a total, and an unavailable or restricted source is never zero | A "Source availability" list and one section per source |
| D5 | Seven short tabs: Sales (deals, quotations, sales orders), Service (requests, work orders, visits), Projects, Sites (sites, areas and equipment through current site relationships), Accounts (by company, from Finance) and Activity (activities and documents) | Eight tabs, with Deals & quotations and Sales orders apart |
| D6 | The Sales tab is one table with type chips and a Status filter; revisions are never totalled and sales orders say "Not connected" | Separate Deals, Estimates & quotations and Sales orders sections |
| D7 | Create organisation follows the accepted Facilities create form with "Check before creating" | The shared create form, with duplicate candidates shown on the record |

## 5. Not decided and not drawn

- **Building the page.** The built `/customers`, `/customers/[id]` and `/customers/new` routes keep the CrmDirectory register, the tabbed Customer workspace and the shared create form. The build order is not decided.
- **Prerequisites for a build:**
  - a register read that returns open service, next follow-up and areas, and the possible-duplicate and without-a-site views;
  - a per-source open-work read for the overview, from permitted links only, that keeps each source's state;
  - type and status filtering on the Sales tab over the existing deal and quotation reads;
  - the duplicate check on the create form, scoped to permitted companies.
- **The Conversations action** is part of the proposed top-bar shell amendment. As on Sites and People, the phone record header has no Conversations action.
- **Not drawn:**
  - the Service, Projects, Sites, Accounts and Activity tabs at full size (each takes the same type chips and Status filter as Sales);
  - reviewing a possible duplicate on Coastal Berry Farms;
  - Correct details for an organisation;
  - the Accounts tab for a Finance user;
  - desktop register states and hover states;
  - 200% zoom, which the spec reviews separately.
- **Open item:** the accepted Sites register (`sites-figma-design.md`) lists seven sites and does not include SYN Northbank Farm, which Service requests, Discovery and this page use.
- **Data in the frames:** the organisations, sites, people, phone numbers and records are synthetic. They are not operational records, and the amounts are not prices.

## 6. Audit and polish

At Dean's request Claude checked every frame for truncation, clipping, placeholders, fonts (Roboto only), stale links and leftover People text, and the story against the accepted Sites, People, Facilities, Service requests and Discovery pages.

- **Added:** the type chips and Status filter on the Sales tab, with a second frame showing Quotations selected and the Status menu open; the Sales tab count is 6, matching All.
- **Corrected:** the customer is SYN Northbank Nursery, as on Discovery, with site SYN Northbank Farm and requests `SYN-PPO-TKT-000088` and `-000091`, as on Service requests. Without a current site is now 2, and SYN Riverbend Nursery has no open service.
- **Polished:** "Created from" is read-only on the create form; layer names left from People were renamed; the desktop and phone flows were added.

The audit is recorded on the notes card `1443:3606`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit, and measured every single-line text with an ending truncation against its rendered width; none was clipped.
- The ten captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 250,000. Image 10 is a frame holding copies of the four phone state frames. Prototype links were removed and each of the 384 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 935 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link or a flow starting point.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/customers/organisations-design-r01/README.md).
- The named Figma version "Organisations — accepted" was saved on 18 October 2026. The Figma file audit confirmed it in version history on 25 October 2026; until then this record and the page header still said it was waiting.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
