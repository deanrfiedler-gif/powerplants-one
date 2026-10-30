---
document_id: PPO-CS03-STAKEHOLDERS-FIGMA-DEC
date: 2026-10-30
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: fa15714324b1dcb939355666023272e0a4ffb0f3
versioning: git
---

# Stakeholders CS-03 design — owner decision

Dean asked for the page on 23 October 2026: "Your task is to design and build the "Stakeholder and relationship view (CS-03)" UI page in Figma as a proposal for my review. Draw the page; do not stop at a written brief." Claude drew it from these sources:
- the CS-03 design register pages ([scope-cs-03](../design/development/pages/scope-cs-03.md), [route-customers-id-stakeholders](../design/development/pages/route-customers-id-stakeholders.md));
- [PPO-CS02-DES](contacts-stakeholders-design.md) and its [r01 HTML reference](../reference/ui/customers/PPO-Contacts-Stakeholders-and-Relationships-r01.html);
- the built `stakeholders()` read in `src/shared/contacts/reads.ts`;
- the accepted designs [Organisations CS-01](organisations-figma-design.md), [People CS-02](people-figma-design.md), [Sites CS-04](sites-figma-design.md) and [Access & readiness CS-06](access-readiness-figma-design.md), and the drawn Subcontractor packages PJ-06, Account development CS-07 and Data quality AD-03.

Before deciding, Dean asked for an audit: "Give the pages an audit and polish to ensure they are accurate, there are no gaps, and they are as professional as possible." On 30 October 2026, asked "Do you accept the CS-03 design?", he answered: "Accept as recommended". That adopts D1–D11 and the recommended answers to Q1–Q7. This is Dean's own acceptance, not an agent decision under the [standing order](autonomous-agent-operation.md). The named Figma version waits for him (section 7).

Scope:
- `scope:CS-03` "Stakeholder and relationship view", with `route:/customers/[id]/stakeholders`.
- Parent requirement IDs CRM-01, CRM-03 and CRM-06 are unchanged. No parent requirement ID is added or renamed; all 78 remain.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed, notice or deployment.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design CS-03 in Figma as a proposal | User decision, 23 October 2026 | Dean's request quoted above |
| Audit and polish before deciding | User decision | Quoted above. Section 6 |
| Departures D1–D11 | Accepted as recommended, 30 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 Primary-contact purposes | Resolved as recommended | Four: Sales and Accounts for the organisation, Service and Site access per site. Service maps to the existing site primary contact. After-hours, on-site and safety induction are site responsibilities, not purposes |
| Q2 Portal access on this page | Resolved as recommended | Shown read-only ("portal user"), linking to Portal home & access (CP-01); never granted or removed here |
| Q3 Technicians and personal mobiles | Resolved as recommended | Only for people who hold a responsibility at a site where the technician has assigned work; otherwise "restricted" with a lock, which never reads as none recorded |
| Q4 External parties | Resolved as recommended | People at their own organisation, linked to the customer through a site responsibility; not notes |
| Q5 Glasshouse 4 story clash | Resolved as recommended | Organisations, People and CP-01 place SYN Glasshouse 4 at Hillview Growers, so this page does. Riverbend's site is to read "SYN Riverbend Glasshouse 4" everywhere at the next story audit |
| Q6 Per-person relationship owner | Resolved as recommended | Not now. The organisation's owner shows on the group band |
| Q7 Accepted pages that do not yet show this page's additions | Resolved as recommended | Accepted as the story; each page is brought in line when it is next amended. Section 5 lists them |
| Accept the design | User decision, 30 October 2026 | Quoted above |
| Named Figma version | Waiting for Dean | Proposed title "Stakeholders — accepted". Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Stakeholders · CS-03" `2288:761`, under "— Shared records —", after Account development · CS-07 and before Sites · CS-04. The page header `2288:762` holds the conformance declaration; the notes card `2325:9850` is in Flows and notes. File index row "Row / Stakeholders · CS-03" `2792:4764`, after the Organisations row |
| Desktop 1440 | People, full length `2292:778894`; Site parties `2299:1440`; Relationship map with its list `2306:789765`; Change primary contact `2301:785477`; Gaps `2299:2304`; Marcus Webb, who has left `2301:786092`; History `2771:533095` |
| Tablet 1024 | People, rail and side menu collapsed `2307:4893` |
| Phone 390 and 320 | Stakeholder list `2308:3846` and `2308:4105`; Who to contact at SYN Glasshouse 4 `2308:4021` and `2308:4272`; Choose view sheet `2771:508722` |
| States | Phone 390: loading `2310:2501`; no stakeholders recorded `2310:2682`; could not load `2310:2843`; read-only `2310:2997`; restricted contact details `2310:3101`; primary contact missing `2310:3217`; person left `2310:3332`; possible duplicate `2310:3427`. Desktop: read-only with restricted contact details `2771:533843` |
| New parts | On Components, section "Service, Supply chain and Shared records parts": Stakeholders / Site party row `2325:9932` and Stakeholders / Phone contact row (phone) `2325:9986`. Stakeholder grid rows and map nodes stay page-specific frames because their cells differ row by row |
| Prototype | Flows "CS-03 — desktop" (from People) and "CS-03 — phone" (from the list): tabs, Change primary contact and Cancel, the Choose links, Marcus Webb's row; on phone, Choose view, the gaps notice to Who to contact, next site, and the P. Shah and Marcus Webb states |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00, signed in as Sasha Cole (SC), as on Organisations. Read from the owning pages: Hillview Growers `SYN-PPO-ORG-000007` (relationship owner Jamie Park) operates SYN Glasshouse 4 `SYN-SITE-000012`, owned by Valley Land Trust, and SYN Hillview Growers; Priya Shah (Grower, recorded; portal site coordinator; contact on `SYN-PPO-OPP-000118`; confirmed visit `SYN-PPO-APT-000052` on Mon 12 Oct at 11:02), Noah Clarke (Accounts payable), Grace Lin (Valley Land Trust, Property manager), and Ellis Grant of SYN Brightline Electrical (licensed electrician). Added on this page: Graham Holt (owner and director, contact on `SYN-PPO-OPP-000131`), Aroha Ngata (head grower), Marcus Webb (maintenance lead, left Fri 28 Aug 2026), P. Shah (possible duplicate of Priya Shah), Data quality finding `SYN-DQF-000046`, Ellis Grant's phone and email, and who holds each site responsibility. Phone numbers are in the ACMA fictional ranges and emails end in `.example` |
| Retained captures | [Stakeholders design r01](../reference/ui/customers/stakeholders-design-r01/README.md): fifteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:CS-03`, `route:/customers/[id]/stakeholders`, reached from Customer 360 "…" › Stakeholders and side menu Related › Stakeholders. Parent requirements CRM-01, CRM-03 and CRM-06 unchanged. Capabilities unchanged |
| Page type (r20) | Record detail; Review / comparison: current relationships, historic relationships, site parties and contact gaps |
| Reused components | Shell v2 (Rail · Service with More selected, Shell / Top bar with the Conversations action, side menu), Record / Header, Record / Readiness bar and Check item, Record / View tab, Grid header, checkbox and row-actions cells, Tag, Button, Work order record / Blocker row, Shell / Phone header · compact and v2 Tab bar (phone). Shared but still proposed: Grid / Group band, Grid / List row (phone), Controls / Form field. New: Stakeholders / Site party row and Stakeholders / Phone contact row (phone) |
| Incoming handovers | Customer 360 and the side menu, for the exact organisation; People and Sites records (read); Access & readiness site access contacts (read); deal contacts (read). Account development and Sales aftercare read the same people from People; notice preferences stay on People and Customer messages |
| Outgoing handovers | People (CS-02) Correct details with a prepared primary-contact change and its reason; Sites (CS-04) for site responsibilities and parties; Organisations (CS-01); Data quality (AD-03) for a possible duplicate; Portal home & access (CP-01), read-only here; phone and email open the user's own apps. It never edits a person, site or organisation, never merges and never sends |
| Source authority | The CS-03 design register pages; PPO-CS02-DES; `src/shared/contacts/reads.ts`; the accepted designs named above; Dean's [8 October direction](product-direction-quality.md) |
| Proposed departures | D1–D11 in section 4, accepted |
| Status | Owner-accepted design, 30 October 2026 |
| Decision record | This file |
| Named version | Waiting for Dean |

## 4. What the design shows

### Departures, accepted

| ID | Departure | Basis |
|---|---|---|
| D1 | Opens from Customer 360 "…" › Stakeholders and from Related › Stakeholders, with the customer's record position. The breadcrumb reads Hillview Growers / Stakeholders because the shared top bar holds two levels | CS-01 Q1 and D2; Shell / Top bar |
| D2 | Five tabs: People, Site parties, Relationship map, Gaps and History | scope-cs-03; the built read |
| D3 | People is a grid grouped by organisation on the shared group band: the customer first, then external parties. Our relationship owner sits on the band because no per-person owner exists | Dean's Pipedrive preference; the built read |
| D4 | Primary contacts by purpose, always in words. Service is the existing site primary contact, which service report approval relies on (ADR-0014); the other three are proposed designations | PPO-CS02-DES, ContactDesignation (proposed) |
| D5 | Site parties per site: recorded organisation roles and the service primary contact first, then proposed responsibility classes, with every gap named, such as "No after-hours contact for Glasshouse 4" | `site_parties` in the built read; PPO-CS02-DES, ResponsibilityClass (proposed) |
| D6 | A relationship map in three columns whose lines are only recorded organisation roles at sites, each labelled. The same 12 relationships follow as a list for screen readers and keyboards; phone uses the list. No scores, strength or sentiment | Dean's brief |
| D7 | Change primary contact is a handover: a side panel prepares the change with a required reason and says what will change, then opens Correct details on People. The earlier holder stays in history with an end date; nothing saves here | Dean's brief; People D6 |
| D8 | Gaps lists missing primary contacts, responsibility gaps, people who have left (still listed with the end date) and possible duplicates (sent to Data quality, never merged). Each row names the page that fixes it | Dean's brief; PPO-CS02-DES |
| D9 | Last interaction is derived from permitted links only and labelled so, because activities do not link to people. Portal use is read-only; notice preferences stay on People | PPO-CS02-DES |
| D10 | Phone uses the compact header, a list grouped by organisation, a Choose view sheet for the other tabs, and Who to contact per site: role first, name and how to reach, Call and Email into the phone's own apps, the gap at the top and one sticky call action | Phone header amendment |
| D11 | Read-only and restricted are separate from empty: view only removes the change actions and keeps every fact; restricted channels read "Mobile restricted" and "Email restricted", never "Not recorded" | PPO-CS02-DES decision 1 |

## 5. Not decided and not drawn

- **Building the page.** The built route keeps its native treatment. The build order is not decided.
- **Prerequisites for a build**, none adopted by this decision: a designation store and command for Sales, Accounts and Site access (PPO-CS02-DES ContactDesignation); a responsibility class over `role_label` and a place to hold site responsibilities (ResponsibilityClass); a rule for restricting personal channels by assigned work (Q3); derived last-interaction reads over permitted links; and a read of portal use from CP-01.
- **Accepted and drawn pages that do not yet show this page's additions (Q7):** Organisations shows People (2); People's register shows 8 people; Account development lists only Priya Shah and Noah Clarke at Hillview; Data quality stops at `SYN-DQF-000045`; Subcontractor packages has SYN Brightline Electrical engaged by SYN Riverbend Growers; Customer messages spells Priya's email at `hillview-growers.example`, where People and this page use `hillview.example`. Organisations and People's register also still show Priya's earlier number 0491 570 006; this page uses 0491 570 806, the number after the correction People draws.
- **Not drawn:** desktop loading and error states, hover states, 200% zoom, changing a primary contact on a phone, and the People Correct details screen after Continue (the accepted People design).
- **Data in the frames:** the organisations, sites, people, phone numbers and records are synthetic. They are not operational records.

## 6. Audit and polish

At Dean's request Claude checked each frame against the owning pages. Corrected: Grace Lin added, because People records her at Valley Land Trust and the page had said no people were recorded; the empty state moved from SYN Riverbend Nursery, which has an owner in People, to Greenvale Produce; Noah Clarke's number; Graham Holt moved off Priya's deal to `SYN-PPO-OPP-000131`; Priya's last interaction; Ellis Grant's recorded role; an invented error reference removed; the finding renumbered to the next free `SYN-DQF-000046`. Added: the History tab, the desktop read-only state and the phone Choose view sheet. Moved to shared parts: the top bar, group band, phone list row and form field.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma, and measured every truncated text against its rendered width; none was clipped. A programmatic check found no overlaps and nothing outside its section. Roboto is the only font.
- The fifteen captures are copies on the "Captures (icon-free)" page, from y = 600,000 (`2792:353414`–`2792:362042`). Prototype links and flow starting points were removed and each of the 1,071 Font Awesome icon instances was swapped for `Icon/placeholder`. A scan found no Font Awesome instance, no visible vector outside a placeholder or the logo, and no navigation link left. The images were exported at scale 1 and the hashes are in the [captures README](../reference/ui/customers/stakeholders-design-r01/README.md).
- The named Figma version "Stakeholders — accepted" is not saved yet. This pull request stays in draft until Dean confirms it.
- Claude did not play the flows in Present mode.
- Nothing new is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
