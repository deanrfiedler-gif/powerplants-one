---
document_id: PPO-AD01-USERS-ACCESS-FIGMA-DEC
date: 2026-10-19
owner: Dean Fiedler
status: Owner-accepted design; native implementation and UI baseline acceptance separate
source_commit: e9f28b6955d62cc33408e418f43f00ce5b937551
versioning: git
---

# Users and access design — owner decision

On 19 October 2026 Dean asked which UI page to design next in Figma. Claude recommended Users and access, scope AD-01. It is the first scope in the [UI build sequence](../design/development/ui-build-sequence.md) without a Figma design: every phase 00 scope already had one, and AD-01 is the first phase 01 entry. Dean agreed: "Yes, draw the Users and access AD-01 page in Figma next, following the People CS-02 pattern." The page covers the built AD-01 routes:
- the identity register at `/admin/access` (More › Administration & support › Users and access);
- person access at `/admin/access/[id]`, with Check eligibility and Compare bundle (`/admin/access/[id]/roles`);
- the capability catalogue at `/admin/access/capabilities`;
- access-change requests at `/admin/access/requests` and `/admin/access/requests/[id]`, with the independent decision and the propose form.

Claude drew the page from these sources:
- the AD-01 design register pages ([scope-ad-01](../design/development/pages/scope-ad-01.md) and the eight `route-admin-access*` pages);
- the built pages in `src/access/` (`screens.tsx`, `role-screens.tsx`, `catalogue-screens.tsx`, `request-screens.tsx`, `local-team-screens.tsx`), the request rules in `src/access/requests.ts`, the grant matching rule in `src/platform/permissions.ts` and the labels in `src/access/capabilities.ts`;
- the decisions [access-review-native](access-review-native.md), [access-change-requests](access-change-requests.md), [access-request-withdrawal](access-request-withdrawal.md), [access-team-creation](access-team-creation.md) and [access-review-attestations](access-review-attestations.md);
- the [AD-01 working HTML](../design/access-review/access-review.html), as reference only;
- copies of the accepted People CS-02 page (cloned whole), the Create discovery workspace dialog and the adopted compact phone header.

Before deciding, Dean asked for an audit: "Give the Users and access AD-01 page an audit and polish before I decide." He then accepted the design: "I accept the Users and access AD-01 design with your recommendations, including D1–D8 and Q1–Q6." That adopts D1–D8 and the recommended answers to Q1–Q6. At his "Yes, save the named Figma version "Users and access — accepted" and lock in the AD-01 design.", the named version was saved (section 7).

Scope:
- `scope:AD-01` "Users, roles, teams and access review", with `route:/admin/access`, `route:/admin/access/[id]`, `route:/admin/access/[id]/roles`, `route:/admin/access/capabilities`, `route:/admin/access/requests` and `route:/admin/access/requests/[id]`.
- AD-01 is page-register coverage under NFR-01–NFR-12, CRM-08 and FIN-06, as the r01 report traces. No parent requirement ID is added or renamed.

This is a design decision. It authorises no application code, route, read model, migration, permission, capability, grant, seed or deployment, and it changes no hosted authority.

## 1. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| Design AD-01 next, on the People CS-02 pattern | User decision, 19 October 2026 | Dean's request quoted above |
| Audit and polish before acceptance | User decision, 19 October 2026 | Quoted above. Section 6 |
| Departures D1–D8 | Accepted as recommended, 19 October 2026 | Dean's acceptance, quoted above. Section 4 |
| Q1 List counts | Resolved as recommended | The identity list read gains current, scheduled and expired grant counts, scope reach, local teams and open requests, computed when read. The built directory reads only a recorded-grant count, so this is a build prerequisite (section 5) |
| Q2 Nearest grant | Resolved as recommended | When an eligibility check fails, the result names the nearest current grant for the same capability, for example the same capability at a same-name company. It explains and never permits |
| Q3 Request numbers | Resolved as recommended | Access-change requests take a business number `SYN-PPO-ACR-000nnn` that people can quote. The UUID stays in the saved history |
| Q4 Primary action | Resolved as recommended | "Check eligibility" is the person record's primary action. "Propose access change" is secondary and appears only with propose authority |
| Q5 Next frames | Resolved as recommended | Role bundles (proposed), Local teams, and the apply, return and withdraw request states are drawn after this page as AD-01 amendments. Review attestations stay API-only until a campaign decision |
| Q6 Identifiers | Resolved as recommended | Site identities use the built `SYN-PPO-SITE-000nnn` format everywhere. The accepted Sites design shows `SYN-SITE-000012`; that text is corrected at its next amendment, and this decision does not change it |
| Accept the design | User decision, 19 October 2026 | Quoted above |
| Named Figma version | Saved, 19 October 2026 | "Users and access — accepted", at Dean's yes quoted above. Section 7 |
| Building the page | Not decided | Section 5 |

## 2. Design reference

| Reference | Identity |
|---|---|
| Accepted design | Figma file "PPO - Design", private to Dean's Figma team. The file's link is not recorded in this public repository (ADR-0050, ADR-0053) |
| Page | "Users and access · AD-01" `1551:23774`, under a new divider page "— Administration —" `1551:23773`, before "— Evidence —". The page header `1551:23775` holds the conformance declaration; the notes card `1551:24765` is in Flows and notes. File index: a new Administration group `1577:428949` with the row "Row / Users and access · AD-01" `1577:429014`, after Shared records |
| Desktop 1440 | Register, All identities `1551:23811`; Sasha Cole, Grants, full length (1440 × 1715) `1551:23904`; Check eligibility, not permitted at SYN-B `1558:3760`; Compare bundle, Service coordinator r02 at SYN-A, full length (1440 × 1602) `1560:3026`; Capability catalogue `1561:3310`; Access requests `1563:4219`; access request SYN-PPO-ACR-000004 with the independent decision `1564:4486`; Propose one additional capability dialog (1440 × 980) `1564:7152` |
| Tablet 1024 | Register with the side menu collapsed `1551:24304` |
| Phone 390 and 320 | Active list, last grant change first `1551:24382`; Sasha Cole, grants by scope, at 390 `1551:24422` and 320 `1565:5476` |
| States | Phone 390: loading `1551:24559`; no identities match `1551:24617`; could not load `1551:24660`; inspection not permitted `1565:5653`; working company selected `1565:5694` |
| Page parts | Section "Page components (proposed)": Identity grid header `1556:198716` and row `1551:24788`, Capability grid header `1561:3137` and row `1561:3094`, Request grid header `1563:4020` and row `1563:3977` (variant sets), Grant row `1557:418190` and Grant list header `1557:418199`. They stay on the page, as the People parts do |
| Prototype | Flows "AD-01 — desktop" (from the register) and "AD-01 — phone" (from the list): register row to Sasha Cole, the Grants, Check eligibility and Compare bundle tabs, the breadcrumb back, the side menu between identities, the capability catalogue and requests, the request row to the decision, Propose capability to the dialog and back; on phone, list to record, Back, and More to the action sheet |
| Story | Synthetic, as at Tue 13 Oct 2026, 09:00 Brisbane time, signed in as Taylor Quinn, systems administrator with Workspace `admin.access.read`, propose and apply. Jordan Kim is the named independent reviewer (`admin.access.approve`). Fourteen identities, two hosted and masked. SYN-A and SYN-B are both named "SYN Greenhouse Demonstration", so every company shows its ERP key. Sasha Cole holds 18 grants: 16 current (15 at SYN-A and `incident.report` at site SYN-PPO-SITE-000012 SYN Glasshouse 4), `customer_message.send` scheduled from Mon 19 Oct by applied request ACR-000003, and `pack.issue`, which expired on Fri 2 Oct. ACR-000005 (`pack.check` at SYN-A) is Approved and not applied; Riley Tran's ACR-000004 (`report.read` at SYN-A) waits for Jordan's decision. Story people follow the accepted pages, not the seed's "SYN …" labels |
| Retained captures | [Users and access design r01](../reference/ui/access-review/users-and-access-design-r01/README.md): thirteen icon-free PNGs with hashes |

## 3. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | `scope:AD-01` and the six routes above (More › Administration & support › Users and access). Page-register coverage under NFR-01–NFR-12, CRM-08 and FIN-06, unchanged. Capabilities unchanged |
| Page type (r20) | Register or worklist for identities, capabilities and requests. Record detail for person access and the access request. Form for Check eligibility, Compare bundle, the independent decision and Propose |
| Reused components | Shell v2 (Rail · Service with More selected, the top bar with the proposed Conversations action, side menu), Grid header and cells, Toolbar search, Record / Header, Record / Readiness bar and Check item, Record / Field, Section heading, View tab and Filter chip, Record / Banner, Work order record / Blocker row, Planner / Input (proposed), Tag, Button, the phone list row, tab bar and quick add, and the adopted Shell / Phone header · compact. The dialog copies the accepted Create discovery workspace dialog. New, proposed: Identity, Capability and Request grid headers and rows, Grant row and Grant list header |
| Incoming handovers | More › Administration & support; capability holder links, which preselect the capability and scope and never carry a result; request links from person access; Foundation checks |
| Outgoing handovers | Person access, Check eligibility, Compare bundle, the capability catalogue, access requests and the independent decision; Integrations & recovery (AD-04) and Foundation checks (AD-09). Grants change only through an applied request |
| Source authority | The AD-01 design register pages; `src/access/*`; `src/platform/permissions.ts`; the decisions listed above; the working HTML as reference |
| Proposed departures | D1–D8 in section 4, accepted |
| Status | Owner-accepted design, 19 October 2026 |
| Decision record | This file |
| Named version | "Users and access — accepted", saved 19 October 2026 |

## 4. What the design shows

### Identity register

- **Grid:** one row per identity (D1): name, identity (Local, or Hosted with the details masked), status, current, scheduled and expired grant counts, scope reach, local teams, open requests and last grant change. The checkbox and settings columns are fixed, and a column ends at the visible edge at 1440.
- **Toolbar:** the built "Find a person" search, Status and a proposed Company filter, the count with its read time ("14 identities · grants as at Tue 13 Oct, 09:00"), Refresh and "…".
- **Side menu (D2):** Users and access keeps its place under More › Administration & support, with no rail of its own. Identities: All identities, Active, Inactive, Hosted (masked). Access: Capability catalogue, Role bundles (proposed), Local teams, Access requests. Administration: Integrations & recovery, Foundation checks.

### Person access

- **Layout:** the accepted shared record layout (D3). The header shows the name and status, "Local identity · 18 recorded grants", the inspector, the read time and the position in the list. Its actions are Check eligibility (primary, Q4), Propose access change and "…".
- **Grant states bar:** 16 current, 1 scheduled from Mon 19 Oct, 1 expired Fri 2 Oct, working company none selected, and session not checked here.
- **Details column:** identity and sign-in (identity, status, working company, session, last grant change), the local team with its lead and the statement that teams grant no access and route no reviews, and recent access requests with their states.
- **Tabs:** Grants, Check eligibility, Compare bundle, Requests and Teams.
- **Grants (D4):** one group per company, with the ERP key beside the name, and one per site. Each lists the capability key and label, valid from, valid to and state (Current, Scheduled or Expired). Expired and scheduled grants stay listed. The company group says that SYN-B shares the name and that none of these grants reach it.
- **Check eligibility (D5):** capability key, company with its ERP key, and site (a company-level check by default). The result names exactly what was checked and, when it fails, the nearest current grant (Q2), then the limitation ("Grant eligibility only…") and the session line. Changing any input clears the result.
- **Compare bundle:** proposed bundle, source revision, company and site. The result reads "13 of 14 capabilities permit this scope" with the r02 change from r01, and a row per capability with the matching current grant and Permits or Not permitted. Bundles are not adopted policy (D-020) and assign nothing.

### Capability catalogue

- A grid of capability key, current, recorded, label, domain, scheduled, expired, scopes in use, whether it can be requested ("No · administrative" for `admin.*`) and a note. It is sorted by current grants, and the toolbar has the built "Find a capability" search and a Domain filter. Counts are grants, not people.

### Access requests

- **Register (D6):** a grid of request number (Q3), person, capability, state (Submitted, Approved, Applied, Returned or Withdrawn), named reviewer, last change, scope, start, requester and version, under the built boundary: approval records a review and does not make access effective, and applying is a separate step by someone who is neither the reviewer nor the person.
- **Record:** the exact proposal and the people on the left; the checks before the decision (named independent reviewer, requestable capability, no grant at this exact scope, start in the future) and the request reason; the Independent decision form, shown only to the named reviewer, with Approve proposal only or Return for correction and a required reason; and the saved history.
- **Propose (D7):** a dialog for one person, one capability and one scope, with the independent reviewer, the UTC start beside its Brisbane reading, an optional end, the checks before submission and a required reason. It submits for independent review and changes no grant.

### Phone (D8)

- **List:** the adopted compact header (Active 13, search, Conversations, filter) and rows with the name, last grant change, identity and scope, and one status line.
- **Person:** a compact record header, then the name, grants by scope as counts, the site grants, and Check eligibility as the one main action. Compare bundle and Propose access change move into More, which opens a sheet with the adopted heading.
- **States:** loading; no identities match; could not load, with no identities, grants or counts shown; inspection not permitted; and working company selected. Denied and working-company states clear all data.

### Departures, accepted

| ID | Departure | Built pattern |
|---|---|---|
| D1 | The identity register is a grid with grant counts by state, scope reach, teams, open requests and last change | A search form and stacked person cards with one recorded-grant count, 50 per page |
| D2 | One side menu for identities, access and administration; Users and access stays under More › Administration & support | Separate pages joined by text links |
| D3 | The accepted record layout with a Grant states bar, identity, teams and recent requests on the left, and five tabs | One page with the Explain form above stacked grant cards |
| D4 | Grants grouped by company (with ERP key) and by site, each as a capability, validity and state table, expired and scheduled grants included | One card per grant with Scope, Company, Site and validity fields |
| D5 | The eligibility result names what was checked and the nearest current grant when it fails | Reason, limitation, authentication line and time |
| D6 | A requests grid and a request record with the proposal, independence checks, the decision form for the named reviewer only, and the saved history | A card list and a record page with the same forms |
| D7 | Propose as a dialog, with the UTC start and its Brisbane reading together and the server checks listed before submission | An inline form on the requests page |
| D8 | Phone: compact list header and status rows; person record as grants-by-scope counts with one main action; denied and working-company states | Stacked cards on narrow screens |

## 5. Not decided and not drawn

- **Building the page.** The built AD-01 routes keep their native pages. The build order is not decided.
- **Prerequisites for a build:**
  - an identity list read that returns grant counts by state, scope reach, local teams and open requests (Q1);
  - a company filter on that read;
  - the nearest-grant explanation in the eligibility result (Q2);
  - the request number `SYN-PPO-ACR-000nnn` (Q3);
  - catalogue reads for scheduled and expired counts and scopes in use.
- **The Conversations action** is part of the proposed top-bar shell amendment, as on the People page.
- **Not drawn:**
  - Role bundles (proposed) and Local teams views, and the Capability grants holder view (Q5);
  - applying, returning and withdrawing a request, and lost-response recovery (Q5);
  - review attestations, which are API only;
  - the phone request decision, and the Requests and Teams tabs at full size;
  - 200% zoom, which the spec reviews separately.
- **Open item:** the accepted Sites design shows `SYN-SITE-000012` (Q6).
- **Data in the frames:** the identities, grants, requests, companies and sites are synthetic. They are not operational records and grant no access.

## 6. Audit and polish

At Dean's request Claude checked every frame against the built rules, the story across frames, clipping and truncation, fonts and prototype links.

- **Corrected:** Sasha's expired grant is `pack.issue`. The built rules refuse a request when any grant, even an expired one, exists for that capability at the same scope ("A grant already exists at this exact scope, including scheduled or expired grants."), so ACR-000005 for `pack.check` could not otherwise exist. The record header names the inspector instead of the team. The session check reads "not checked here" for a local identity. The applier wording matches the rule (neither the reviewer nor the person, so the requester may apply).
- **Polished:** the built search fields are in the toolbars; the catalogue leads with Current and Recorded, as built; every desktop grid has a column ending at the visible edge; the requests grid shows the named reviewer and last change first; the phone action sheets use the adopted heading and open from More.
- **Left as designed:** grid columns beyond the visible width scroll sideways, and the phone list's last row continues under the tab bar.

The audit is recorded on the notes card `1551:24765`.

## 7. Verification

- Claude checked the frames with screenshots taken inside Figma during the drawing and the audit, and measured every visible truncating text against its rendered width. After the audit no text is truncated or clipped except grid columns that scroll sideways.
- The thirteen captures are copies of the accepted frames on the "Captures (icon-free)" page, from y = 290,000. Image 13 is a frame holding copies of the five phone state frames. The 226 prototype reactions were removed and each of the 588 Font Awesome icon instances was swapped for `Icon/placeholder`. Three scans followed:
  - no Font Awesome instance and no visible vector outside a placeholder or the logo was left;
  - none of 1,553 visible texts had a stored colour that differed from its bound variable;
  - no copy carries a prototype link, and the Captures page keeps its 103 flow starting points.
- The captures were exported at scale 1 with the Figma connector and downloaded directly into the captures folder. The hashes are in the [captures README](../reference/ui/access-review/users-and-access-design-r01/README.md).
- The named Figma version "Users and access — accepted" was saved in the Figma desktop app at Dean's yes and confirmed at the top of version history. The page header was then updated with the lock-in details.
- Claude did not play the flows in Present mode.
- Nothing is built, so there is no application or device evidence. No owner device, accessibility or operational review is recorded. The captures are design compositions, not application captures, and set no UI baseline.
