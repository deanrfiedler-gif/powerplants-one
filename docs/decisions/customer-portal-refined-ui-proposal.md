---
document_id: PPO-PORTAL-REFINED-FIGMA-PROP
date: 2026-11-12
owner: Dean Fiedler
status: Proposal, 12 November 2026; design acceptance is Dean's and has not been given; no named version is saved yet; not an implementation baseline; no application code, route, read model, migration, permission, capability, grant, seed, identity provider, email channel or integration; no customer has seen or used any of it; every record shown is synthetic
source_commit: 1892f7a92784b811bd36f0ef289816cfcfd31d4c
versioning: git
---

# Customer portal refined UI pages — proposal

**Owner:** Dean Fiedler · **Date:** 12 November 2026 · **Status:** Proposal. Sections 1 to 8 are the proposal record and section 9 is the audit. Later sections will record Dean's acceptance, any further batches and the named versions exactly as the [Sales record](sales-module-refined-ui-proposal.md) does.

On 12 November 2026 Dean asked for the refined UI pages of the Powerplants One Customer portal to be built in Figma from a written brief with Addendum A1 (the shared record toolbar) and Addendum A3 (persona and story reconciliation), in the new private file "PPO - Customer portal module" that he created on 10 November 2026. The brief asks for two sides in one file: the customer portal as a customer sees it (the six scopes CP-01 to CP-06, in the accepted customer portal shell, phone first) and the staff **Customer portal workspace** (in the accepted staff shell, reached through More). His standing instruction applies: "If you need any decisions from me, just proceed however you believe is the most professional and advanced approach." The brief's ten questions were therefore answered by their stated defaults; each is recorded in section 5 and can be reversed. Addendum A2 (reference form) was not attached; its repository record, [readable reference namespaces](readable-reference-namespaces.md), and the brief's own rule on customer-facing references were followed.

This record is a **proposal**. It describes what was drawn, the rules applied, the assumptions made and the questions that remain. It changes no code, test, migration, seed, permission or route, and it authorises no business transaction, identity provider, email, MYOB integration or customer communication. It is the first repository record of the CP-03 (Projects) and CP-04 (Visits and reports) portal pages, which until now existed only as proposals in the design file. Four statements stay separate throughout:

- **Code delivery:** none. No portal route, capability or customer identity exists in the code, and this work creates none.
- **Design acceptance:** Dean's, and not given.
- **Production readiness:** not inferred. The acceptance cases [CPA-01 to CPA-16](../testing/customer-portal-acceptance.md) all remain Not run.
- **Customer release:** none. No customer has seen or used any of this; no identity provider, email channel or customer account exists; every member, request, report, quotation, invoice and article in the file is a synthetic placeholder.

## 1. Sources

| Source | Use |
|---|---|
| Private Figma file "PPO - Customer portal module" | The target file. It held one empty page on 10 November 2026. The [design-to-build standard](../standards/design-to-build-standard.md) names the domain file "PPO - Customer Portal"; the file's name is Dean's and nothing was renamed (A1) |
| Private Figma file "PPO - Shell (accepted)", named version "Shell refined concept — accepted · record header toolbar" (10 November 2026) | The staff shell: 48 px top bar, 80 px collapsed rail with More current (R107), 48 px right strip, content from x 80 to 1392, the 280 px docked workspace menu, the collapsed strip, the 1024 top bar (332 / 360 / 332), the accepted Customer portal flyout and docked menu with nested views (R108), and the record header toolbar (Addendum A1; R116 to R125). Copied into the target file under the same names, never redrawn |
| Private Figma file "PPO - Design", the pages under its Customer portal divider | The customer portal shell and the accepted rules and stories: Portal home & access CP-01 (named version "Portal home & access — accepted"), Support requests CP-02 ("Support requests — accepted"), Customer knowledge CP-05 ("Customer knowledge — accepted"), Quotations & account CP-06 ("Quotations & account — accepted"); and the Project updates CP-03 and Equipment & reports CP-04 proposals of 23 October 2026, which have no decision record. Frozen reference: read, never changed |
| Private Figma file "PPO - Sales module (accepted)", named version "PPO - Sales module (accepted) · batch 2 · N13" | Conventions mirrored: the page template, sheet labels, the page kit (chip, button, avatar, checkbox, filter chip, tab, KPI tile), the icon set and the helper approach |
| Accepted portal page decisions: [Portal home & access](portal-home-access-figma-design.md) (PPO-CP01-PORTAL-HOME-FIGMA-DEC), [Support requests](support-requests-figma-design.md) (PPO-CP02-SUPPORT-REQUESTS-FIGMA-DEC), [Customer knowledge](customer-knowledge-figma-design.md) (PPO-CP05-CUSTOMER-KNOWLEDGE-FIGMA-DEC), [Quotations & account](quotations-account-figma-design.md) (PPO-CP06-QUOTATIONS-ACCOUNT-FIGMA-DEC) | The decisions D and answers Q of each accepted page, carried into the redrawn pages |
| Adjacent decisions: [quotation page and customer views](quotation-page-customer-views-figma-design.md) (PPO-ES05-QUOTE-PAGE-FIGMA-DEC), [quotation response](quotation-response-figma-design.md), [customer response](customer-response-figma-design.md) (PPO-FI07-CUSTOMER-RESPONSE-FIGMA-DEC), [field customer response](field-customer-response.md), [stakeholder updates](stakeholder-updates-figma-design.md) (PPO-PJ08-STAKEHOLDER-UPDATES-FIGMA-DEC), [quote view tracking](quote-view-tracking.md), [knowledge](knowledge-figma-design.md), [knowledge authoring](knowledge-authoring-figma-design.md), [site readiness](site-readiness-figma-design.md), [stakeholders](stakeholders-figma-design.md), [system pages](system-pages-figma-design.md), [navigation architecture board](navigation-architecture-board.md) (NAD-06), [customer communications D-025](customer-communications-d025.md), [ADR-0058](ADR-0058-outbound-customer-email.md), [ADR-0043](ADR-0043-service-request-lifecycle.md) | The handover shapes the portal must match: no Accept or Sign anywhere; one immutable response per report revision; a sent update is never edited; internal notes never reach a customer; the payment gateway stays excluded; Resolved and Closed for requests are still proposed |
| [Customer portal design](../blueprints/customer-portal-design.md), [Customer portal direction](customer-portal-direction.md), [implementation plan](../delivery/customer-portal-implementation-plan.md), [acceptance cases](../testing/customer-portal-acceptance.md) | Roles and exclusions ("Default is no access"), allowlisted projections, publication ("Open/download is not acknowledgement"), the stages CP1 to CP5, and CPA-01 to CPA-16 |
| [BP-01](../blueprints/BP-01-master-blueprint.md) §4.1, §7.5, §13.7, §21.2, §21.4 and [BP-06](../blueprints/BP-06-projects-commercial-delivery.md) §8 | External access needs explicit organisation and site scope; a signature does not authorise extra charges; "Internal notes never flow directly to customer view". Parents CRM-01, CRM-03, CRM-06, EST-03, EST-07, EST-08, PRJ-02 to PRJ-08, SVC-01, SVC-02, SVC-06, SVC-10 to SVC-12, DOC-01 to DOC-06, FIN-01, FIN-02, FIN-06, FIN-07, NFR-01, NFR-02, NFR-08, NFR-09. No parent requirement ID is added or renamed; all 78 remain, and no `POR-` parent is invented |
| [Shell refined concept design](shell-refined-concept-design.md) sections 10 and 11 and its [rules](../design/development/systems/shell-refined-concept-rules.md) | Shell behaviour, R107, R108, R116 to R125 and the named version cited above |
| [PPO-STD-001](../standards/naming-conventions.md), [design-to-build standard](../standards/design-to-build-standard.md), [ADR-0067](ADR-0067-design-to-build-operating-model.md), [HTML module conformance](../standards/html-module-conformance.md), [named-version build handoff](figma-named-version-build-handoff.md), [design, build and review roles](design-build-review-roles.md), [documentation source isolation](documentation-source-isolation.md) | Naming, page order, the nine-field declaration, r20 page types, and the rule that a named version pins a build basis |
| `src/shell/navigation.ts`, `src/platform/permissions.ts`, `src/platform/identity.ts`, `db/migrations/` as listed in the brief | Read only, to state what does not exist: no `/portal` route, no `portal.*` or `customer.*` capability, staff principals only, and no Portal channel in the service request statements (migration 0112) |

The files' links and keys are not recorded in this public repository ([ADR-0050](ADR-0050-font-awesome-light-icons.md), [ADR-0053](ADR-0053-figma-page-design.md)). Node IDs are recorded so each sheet can be opened from the file.

## 2. Conformance declaration

### 2.1 The module

| Field | Declaration |
|---|---|
| Scope identity | The customer portal: `scope:CP-01` to `scope:CP-06`, and the staff Customer portal workspace as a proposal for the accepted shell's six Customer portal menu items. Routes are listed per scope in 2.2; the `/portal/visits` route holding equipment, reports and documents is a proposal (A3). No scope ID or parent requirement ID is added or renamed; all 78 remain |
| Page types (r20) | Customer side: Overview / dashboard (Home, Help home, the commercial Overview), customer lists (not registers: fixed and stated sort, filters as chips), Record detail (conversation, visit, equipment, report, project, update, article, quotation, invoice, Account and access), Form / guided workflow (New request, guided help, dialogs and full-screen phone sheets), states. Staff side: Overview / dashboard, Register / worklist, Record detail with the record header toolbar, Form as a 432 px right panel and centred dialogs, Review / comparison (the read-only preview), configuration editor (administration), states. Tablet and phone variants. Per scope in 2.2 |
| Reused components | Local copies of the accepted staff shell under the same names: Shell / Top bar, Shell / Rail · collapsed, Shell / Right rail · collapsed, Shell / Workspace menu · docked (Customer portal, with nested views), Shell / Workspace menu · collapsed strip, the 1024 top bar, Shell / Record header · toolbar and its phone variant (Addendum A1); the shell icon components (Lucide stand-ins for Font Awesome Light) with two added (camera, upload) and the brand mark; the "PPO colour" variable collection (66 variables, same names as the Shell and Sales files); the Sales page kit under its Sales names. New in this file and proposed: one consolidated customer portal shell family (Portal / Header, Nav bar, Tab bar, Footer, Button, Tag and the logo on navy and on light) with the selected page and the granted pages as properties (A2) |
| Source authority | Dean's brief and its decisions D1 to D14 as amended by Addendum A3; the four accepted portal page decisions in section 1; the CP-03 and CP-04 proposals as design direction, not accepted; this file's compositions as proposals. The fixture is fictional and synthetic: as at Thursday 5 November 2026, 09:00 AEDT, company Powerplants AU, signed in on the customer side as Priya Shah and on the staff side as Ravi Kumar unless a sheet's label names another person |
| Incoming handover | Per scope in 2.2. Arriving on a page creates no business record |
| Outgoing handover | Per scope in 2.2. Nothing drawn on a customer sheet grants access, changes a request's state, books a visit, authorises work, accepts, approves, signs, pays, applies a payment, edits a report, an equipment record, an order or an invoice, or treats opening or downloading as acknowledgement. Nothing drawn on a staff sheet grants access without an independent review and an application, or releases anything without an explicit audience |
| Exceptions and recovery | Drawn per page (section 3) and on the Interaction states page: loading with skeletons and no counts, true-empty with its own words, filtered-empty with the filter restated, could not load with the card named and no stale data, "This isn't available to you" (the same words whether or not the thing exists), access changed, session expired, portal unavailable, "We can't take requests online right now", "We are not sure your request was received" with Check if it arrived, a message arriving while writing, account figures not available, report can't be shown, file not accepted, offline on the phone, slow send, permission changed while open and preview not allowed |
| Departures | Section 5 |
| Verification | Section 6 |

Statements that hold for every scope:

- **The default is no access, and Powerplants grants every access after an independent review** ([portal design](../blueprints/customer-portal-design.md) §3; BP-01 §21.2; CP-01 D11, D14). A verified email or a matching domain never grants membership, a site contact role grants nothing, and a customer never grants access.
- **Customers see only released, allowlisted projections and never an internal note** (portal design §6; D-025 R6; BP-06 §8). Nothing hints at what was not released.
- **Opening or downloading is never acknowledgement, and no customer act accepts, signs, pays or changes a record it does not own** (portal design §8; BP-01 §7.5, §13.7; CP-06 D4, D11; NAD-06).
- **Status words come from facts** (CP-02 D1), with who acts next.
- **Identity is not chosen** (D-022). Sign-in, the second step and the session length are drawn as placeholders.

### 2.2 Per scope

| Scope and route | Page types | Owns | Incoming handover | Outgoing handover |
|---|---|---|---|---|
| CP-01 Portal shell and home, `/portal`, `/portal/account` | Overview; Record detail (Account and access); Form and dialogs; states | The portal owns memberships as proposed and what a member reads of their own access. Powerplants administers membership | An invitation link; a notice link; sign-in | Support, Visits, Projects, Help, Quotations & account; a correction request and "Ask Powerplants to add someone" to People (CS-02), which starts a staff proposal |
| CP-02 Support, `/portal/support`, `/portal/support/[reference]` | Customer list; Record detail (conversation); Form / guided workflow | The customer's own acts: requests sent and replies. Service owns the request, its review, its internal notes and who works on it | Home; Help (a request carrying a guided path); Visits (Ask about this visit); Account (Query an invoice); equipment | New requests on the proposed Portal channel, replies and checked files to Service requests (SV-01, SV-02); follow-ups to My Work through the request's service owner |
| CP-04 Visits and reports, `/portal/visits` with equipment, reports and documents as tabs | Customer list; Record detail (visit, equipment, report in an exact content frame); Form | The customer's own report response and uploads. Service owns scheduling, the report and the response rules; DK-03 owns the exact bytes; EQ-01 owns equipment identity and history | Home's Visit today card; a request's visit; the FI-07 report link page | A reply on the originating request; one immutable response on the exact report revision, with one follow-up for the Service owner when it is not Accepted (SV-06, FI-07); files to the check, then to the request |
| CP-03 Projects, `/portal/projects`, `/portal/projects/[reference]` | Customer list; Record detail (overview); exact content frame (update); Form and dialogs | Acknowledgements, answers and Mark as done. Projects owns updates, the baseline, stages and acceptance | Home's Latest update card; the M4 project update notice | Acknowledgements against the exact revision, answers, Mark as done follow-ups and questions to the project's Powerplants contact (PJ-08) |
| CP-05 Help and knowledge, `/portal/knowledge` | Overview; customer list (search); guided workflow; Record detail (article) | Feedback only. Knowledge owns the content and the approval of its customer audience (DK-04, DK-05) | Help in the header (in the account menu on a phone) | Feedback to Knowledge; a request carrying the article and the answers to Support, which the customer reviews and sends |
| CP-06 Quotations and account, `/portal/commercial` | Overview; customer list; exact content frame; Record detail (invoice); Form and dialogs | Replies and invoice queries. Estimating owns release and the response record (ES-05, ES-06); Projects owns variations (PJ-05); Supply owns dispatch and proof (SC-06, SC-07); Finance and MYOB own invoices, payments, queries and statements (FN-02) | Navigation only for a member with a commercial grant. The `/quote/[token]` link page stays with Estimating | Replies to the named sender kept with the exact revision; invoice queries as prefilled support requests that Finance reads; questions about a delivery |
| Staff Customer portal workspace (a proposal for the shell's six menu items; no scope ID added) | Overview / dashboard; Register / worklist; Record detail; Form (panel and dialogs); Review (read-only preview) | Nothing new: it reads what the owning modules hold. Systems applies grants; the reviewer approves | More; a People record (Propose portal access); My Work | Service requests (SV-02) for replies; the Users and access pattern (AD-01) for review and application; the owning module for every release |
| Interaction states and Administration · CP | States; configuration editor; Form (dialog) | The words, tones and rules the pages read by. Each module keeps its own release rule | The Customer portal workspace | A setting change to its reviewer; nothing to a customer |

Ownership: the portal owns memberships as proposed, the customer's own acts (requests sent, replies, uploads, acknowledgements, answers, report responses, queries) and publication reads. Service owns requests and reports, Projects owns updates and acceptance, Knowledge owns articles, Estimating and Projects own quotations and variations, Supply owns deliveries, Finance and MYOB own the account, People own contacts and preferences, and Systems applies grants.

## 3. Sheet inventory

184 sheets on nine scope pages: 143 customer sheets, 40 staff sheets and 1 that specifies both sides (ST01). By page: Portal shell and home · CP-01 29; Support · CP-02 24; Visits and reports · CP-04 26; Projects · CP-03 20; Help and knowledge · CP-05 15; Quotations and account · CP-06 25; Staff workspace · Customer portal 28; Interaction states · CP 7; Administration · CP 10.

Desktop sheets are 1440 wide, tablets 1024 and phones 390 or 320; a sheet marked "full length" is as tall as its content, otherwise 900, 768 or 844 high. Node IDs are those of the frame in the file. Every label in the file reads `CODE · Page — state (scope ID · stage) [customer · Name]` or `[staff · Name]`. The Read me page holds the header card `73:9240`, the "Sheet index and notes" card `73:9256`, the audit card `76:1195` and the Page template card `73:9355`; each scope page also holds a "Flows and notes" card.

### Portal shell and home · CP-01

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| HO05 | Home — full target, full length | Desktop 1440 | `/portal` | Overview | CP4 | customer · Priya Shah | `21:1201` |
| HO01 | Sign in | Desktop 1440 | `/portal` | Form / guided workflow | CP1 | customer · not signed in | `22:1507` |
| HO02 | First visit — invitation accepted 08:50 | Desktop 1440 | `/portal` | Form / guided workflow | CP1 | customer · Hana Moore | `22:1590` |
| HO06 | Home — CP1 only, as accepted | Desktop 1440 | `/portal` | Overview | CP1 | customer · Priya Shah | `22:1752` |
| HO08 | Home after switching — Main nursery, zero states | Desktop 1440 | `/portal` | Overview | CP4 | customer · Jo Marsh | `22:1931` |
| HO10 | Account and access — full length | Desktop 1440 | `/portal/account` | Record detail | CP1 | customer · Priya Shah | `22:2111` |
| HO07 | Choose a site — panel | Dialogs and panels | `/portal` | Form: panel | CP1 | customer · Jo Marsh | `22:2319` |
| HO09 | Help menu | Dialogs and panels | `/portal` | Menu | CP3 | customer · Priya Shah | `22:2505` |
| HO12 | Choose a site after the change — 10:12 | Dialogs and panels | `/portal` | Form: dialog | CP1 | customer · Graham Holt | `22:2695` |
| HO14 | Ask Powerplants to add someone — dialog | Dialogs and panels | `/portal/account` | Form: dialog | CP1 | customer · Priya Shah | `22:2822` |
| HO15 | Correction request — dialog | Dialogs and panels | `/portal/account` | Form: dialog | CP1 | customer · Priya Shah | `22:3070` |
| HO17 | Account menu — desktop | Dialogs and panels | `/portal` | Menu | CP1 | customer · Priya Shah | `62:3816` |
| HO03 | No access after sign-in | States | `/portal` | State | CP1 | customer · Tess Moran | `22:3323` |
| HO04 | Recovery sent | States | `/portal` | State | CP1 | customer · not signed in | `22:3390` |
| HO11 | Access changed — the open page clears at 10:12 | States | `/portal` | State | CP1 | customer · Graham Holt | `22:3458` |
| HO13 | Session expired | States | `/portal` | State | CP1 | customer · not signed in | `22:3569` |
| HO16 | Portal unavailable | States | `/portal` | State | CP1 | customer · any member | `22:3634` |
| TB HO10 | Account and access — tablet, full length | Tablet 1024 | `/portal/account` | Tablet variant | CP1 | customer · Priya Shah | `22:3700` |
| TB HO05 | Home — tablet, full length | Tablet 1024 | `/portal` | Tablet variant | CP4 | customer · Priya Shah | `23:3306` |
| PH03 | Home — full target, full length | Phone 390 and 320 | `/portal` | Phone variant | CP4 | customer · Priya Shah | `21:1431` |
| PH03-320 | Home — 320, full length | Phone 390 and 320 | `/portal` | Phone variant | CP4 | customer · Priya Shah | `21:1637` |
| PH01 | Sign in | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · not signed in | `22:3908` |
| PH02 | First visit | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · Hana Moore | `22:3973` |
| PH04 | Choose a site — sheet | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · Jo Marsh | `22:4114` |
| PH26 | Account and access — full length | Phone 390 and 320 | `/portal/account` | Phone variant | CP1 | customer · Priya Shah | `22:4280` |
| PH27 | Account menu — Help moves here | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · Priya Shah | `22:4466` |
| PH28 | Access changed | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · Graham Holt | `22:4651` |
| PH29 | Session expired | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · not signed in | `22:4700` |
| PH30 | Offline — nothing is kept on the phone | Phone 390 and 320 | `/portal` | Phone variant | CP1 | customer · Priya Shah | `22:4749` |

### Support · CP-02

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| SU01 | Your requests — Open, as at 09:30, full length | Desktop 1440 | `/portal/support` | Customer list | CP1 | customer · Priya Shah | `24:1201` |
| SU02 | Your requests — a requester sees their own | Desktop 1440 | `/portal/support` | Customer list | CP1 | customer · Ben Carter | `24:1375` |
| SU03 | New request — step 1 What and where, full length | Desktop 1440 | `/portal/support` | Form / guided workflow | CP1 | customer · Priya Shah | `24:1532` |
| SU04 | New request — step 2 Impact, step 3 Contact and Review, full length | Desktop 1440 | `/portal/support` | Form / guided workflow | CP1 | customer · Priya Shah | `24:1740` |
| SU05 | SYN-TKT-000209 — conversation at 09:00, full length | Desktop 1440 | `/portal/support/[reference]` | Record detail | CP2a | customer · Priya Shah | `24:2016` |
| SU06 | SYN-TKT-000209 — after the reply at 09:10, later frame, full length | Desktop 1440 | `/portal/support/[reference]` | Record detail | CP2a | customer · Priya Shah | `24:2198` |
| SU07 | SYN-TKT-000205 — Your reply needed, full length | Desktop 1440 | `/portal/support/[reference]` | Record detail | CP1 | customer · Ari Levin | `24:2386` |
| SU11 | Resolved and Closed — later stage · ADR-0043, full length | Desktop 1440 | `/portal/support/[reference]` | Customer list | later stage | customer · Owen Dunne | `24:2574` |
| SU03b | New request — an open request for the same equipment, offer to add to it · N-P2, full length | Dialogs and panels | `/portal/support` | Form: dialog | CP2a | customer · Priya Shah | `24:2768` |
| SU08 | Sent — Received at 09:22 | States | `/portal/support` | State | CP1 | customer · Priya Shah | `24:2996` |
| SU09 | Not sure it was received — Check if it arrived | States | `/portal/support` | State | CP1 | customer · Priya Shah | `24:3113` |
| SU10 | A message arrives while writing — full length | States | `/portal/support/[reference]` | State | CP1 | customer · Priya Shah | `24:3231` |
| SU12 | This isn't available to you — the same words whether or not it exists | States | `/portal/support` | State | CP1 | customer · Priya Shah | `24:3432` |
| SU13 | Can't take requests online — before anything is saved | States | `/portal/support` | State | CP1 | customer · Priya Shah | `24:3541` |
| SU14 | Photos coming soon — CP1 reply box, full length | States | `/portal/support/[reference]` | State | CP1 | customer · Priya Shah | `24:3649` |
| TB SU01 | Your requests — tablet, full length | Tablet 1024 | `/portal/support` | Tablet variant | CP1 | customer · Priya Shah | `24:3825` |
| TB SU05 | SYN-TKT-000209 conversation — tablet, full length | Tablet 1024 | `/portal/support/[reference]` | Tablet variant | CP2a | customer · Priya Shah | `24:3999` |
| PH05 | Your requests — as at 09:30, full length | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `24:4181` |
| PH06 | SYN-TKT-000209 conversation — reply box above the keyboard, full length | Phone 390 and 320 | `/portal/support/[reference]` | Phone variant | CP2a | customer · Priya Shah | `24:4327` |
| PH06-320 | SYN-TKT-000209 conversation — 320, reply box above the keyboard, full length | Phone 390 and 320 | `/portal/support/[reference]` | Phone variant | CP2a | customer · Priya Shah | `24:4434` |
| PH07 | New request — step 1, full-screen form with a sticky Continue, full length | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `24:4536` |
| PH08 | New request — steps 2 and 3, full length | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `24:4617` |
| PH09 | New request — Review and Send, sticky full-width primary, full length | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `24:4705` |
| PH09-320 | New request — Review and Send, sticky full-width primary, 320, full length | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `24:4767` |

### Visits and reports · CP-04

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| VR01 | Visits — today and past, full length | Desktop 1440 | `/portal/visits` | Customer list | CP2a | customer · Priya Shah | `25:1510` |
| VR02 | Equipment at Glasshouse 4 — five shared items, full length | Desktop 1440 | `/portal/visits/equipment` | Customer list | CP2a | customer · Priya Shah | `25:1698` |
| VR03 | Visit detail — Booked | Desktop 1440 | `/portal/visits` | Record detail | CP2a | customer · Priya Shah | `25:1882` |
| VR04 | Equipment detail — CP-4 panel, full length | Desktop 1440 | `/portal/visits/equipment` | Record detail | CP2a | customer · Priya Shah | `25:2044` |
| VR05 | Reports list | Desktop 1440 | `/portal/visits/reports/[reference]` | Customer list | CP2a | customer · Priya Shah | `25:2222` |
| VR06 | SYN-RPT-000036 r01 — exact report, full length | Desktop 1440 | `/portal/visits/reports/[reference]` | Record detail | CP2a | customer · Priya Shah | `25:2379` |
| VR09 | SYN-RPT-000039 — a newer revision was issued | Desktop 1440 | `/portal/visits/reports/[reference]` | Record detail | CP2b | customer · Owen Reilly | `25:2569` |
| VR10 | Documents shared with you | Desktop 1440 | `/portal/visits` | Customer list | CP2a | customer · Priya Shah | `25:2726` |
| VR11 | Add a photo or file — the four states, full length | Desktop 1440 | `/portal/visits` | Form / guided workflow | CP2a | customer · Priya Shah | `25:2876` |
| VR03 | Ask about this visit — dialog, adds to the request it came from · N-P2 | Dialogs and panels | `/portal/visits` | Form: dialog | CP2a | customer · Priya Shah | `25:3086` |
| VR03 | Add to calendar — dialog, one file per confirmed visit | Dialogs and panels | `/portal/visits` | Form: dialog | CP2a | customer · Priya Shah | `25:3281` |
| VR07 | SYN-RPT-000040 r01 — Respond, dialog | Dialogs and panels | `/portal/visits/reports/[reference]` | Form: dialog | CP2b | customer · Owen Dunne | `25:3470` |
| VR08 | Response recorded — 10:42, later frame, full length | States | `/portal/visits/reports/[reference]` | State | CP2b | customer · Owen Dunne | `25:3691` |
| VR14 | Response already recorded by the report link — never a second Respond, full length | States | `/portal/visits/reports/[reference]` | State | CP2b | customer · Owen Dunne | `25:3868` |
| VR12 | Report no longer shared; report can't be shown | States | `/portal/visits/reports/[reference]` | State | CP2a | customer · Priya Shah | `25:4045` |
| VR13 | Visit changed; visit cancelled | States | `/portal/visits` | State | CP2a | customer · Priya Shah | `25:4172` |
| TB VR01 | Visits — tablet, full length | Tablet 1024 | `/portal/visits` | Tablet variant | CP2a | customer · Priya Shah | `25:4339` |
| TB VR06 | SYN-RPT-000036 r01 exact report — tablet, full length | Tablet 1024 | `/portal/visits/reports/[reference]` | Tablet variant | CP2a | customer · Priya Shah | `25:4527` |
| PH10 | Visit detail — Add to calendar and Ask about this visit, full length | Phone 390 and 320 | `/portal/visits` | Phone variant | CP2a | customer · Priya Shah | `25:4717` |
| PH11 | Visits list — full length | Phone 390 and 320 | `/portal/visits` | Phone variant | CP2a | customer · Priya Shah | `25:4857` |
| PH12 | Add a photo — camera or file, four states, full length | Phone 390 and 320 | `/portal/visits` | Phone variant | CP2a | customer · Priya Shah | `25:5017` |
| PH12-320 | Add a photo — 320, full length | Phone 390 and 320 | `/portal/visits` | Phone variant | CP2a | customer · Priya Shah | `25:5138` |
| PH13 | Equipment list — full length | Phone 390 and 320 | `/portal/visits/equipment` | Phone variant | CP2a | customer · Priya Shah | `25:5259` |
| PH14 | Report SYN-RPT-000036 — the exact frame scrolls, 48 px Download PDF bar, full length | Phone 390 and 320 | `/portal/visits/reports/[reference]` | Phone variant | CP2a | customer · Priya Shah | `25:5407` |
| PH14-320 | Report SYN-RPT-000036 — 320, full length | Phone 390 and 320 | `/portal/visits/reports/[reference]` | Phone variant | CP2a | customer · Priya Shah | `25:5582` |
| PH15 | Respond to a report — full length | Phone 390 and 320 | `/portal/visits/reports/[reference]` | Phone variant | CP2b | customer · Owen Dunne | `25:5752` |

### Projects · CP-03

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| PU01 | Your projects | Desktop 1440 | `/portal/projects` | Customer list | CP4 | customer · Priya Shah | `26:1201` |
| PU02 | Glasshouse 4 climate screens — Overview at 09:45, full length | Desktop 1440 | `/portal/projects/[reference]` | Customer list | CP4 | customer · Priya Shah | `26:1324` |
| PU03 | Update 4 (r2) — exact update with Acknowledge, full length | Desktop 1440 | `/portal/projects/[reference]` | Record detail | CP4 | customer · Priya Shah | `26:1560` |
| PU05 | Your actions — one due | Desktop 1440 | `/portal/projects/[reference]` | Customer list | CP4 | customer · Priya Shah | `26:1746` |
| PU08 | Update history — as at 09:50 | Desktop 1440 | `/portal/projects/[reference]` | Customer list | CP4 | customer · Priya Shah | `26:1905` |
| PU09 | Released project documents | Desktop 1440 | `/portal/projects/[reference]` | Customer list | CP4 | customer · Priya Shah | `26:2103` |
| PU06 | Mark as done — dialog, 09:50 | Dialogs and panels | `/portal/projects/[reference]` | Form: dialog | CP4 | customer · Priya Shah | `26:2277` |
| PU07 | Answer a question — dialog, Update 7 | Dialogs and panels | `/portal/projects/[reference]` | Form: dialog | CP4 | customer · Dana Brooks | `26:2466` |
| PU11 | Ask about this — dialog, a question about one update, action or document | Dialogs and panels | `/portal/projects/[reference]` | Form: dialog | CP4 | customer · Priya Shah | `62:5771` |
| PU04 | Acknowledged — 09:47, later frame, full length | States | `/portal/projects/[reference]` | State | CP4 | customer · Priya Shah | `26:2635` |
| PU06 | Done · waiting on Powerplants — after Mark as done, 09:50 | States | `/portal/projects/[reference]` | State | CP4 | customer · Priya Shah | `26:2822` |
| PU07 | Answered · waiting on Powerplants — 10:15, later frame | States | `/portal/projects/[reference]` | State | CP4 | customer · Dana Brooks | `26:2977` |
| PU10 | No updates published yet | States | `/portal/projects/[reference]` | State | CP4 | customer · Ben Carter | `26:3112` |
| PU10 | Action states — corrected update, confirmed, not confirmed, full length | States | `/portal/projects/[reference]` | State | CP4 | customer · Priya Shah | `26:3240` |
| PU10 | Project no longer shared with you | States | `/portal/projects/[reference]` | State | CP4 | customer · Jo Marsh | `26:3398` |
| TB PU02 | Project overview — tablet, full length | Tablet 1024 | `/portal/projects/[reference]` | Tablet variant | CP4 | customer · Priya Shah | `26:3509` |
| PH18 | Projects overview — full length | Phone 390 and 320 | `/portal/projects/[reference]` | Phone variant | CP4 | customer · Priya Shah | `26:3745` |
| PH19 | Update 4 and Acknowledge — sticky primary, full length | Phone 390 and 320 | `/portal/projects/[reference]` | Phone variant | CP4 | customer · Priya Shah | `26:3959` |
| PH20 | Your actions — one due, full length | Phone 390 and 320 | `/portal/projects/[reference]` | Phone variant | CP4 | customer · Priya Shah | `26:4124` |
| PH20 | Mark as done — sheet | Phone 390 and 320 | `/portal/projects/[reference]` | Phone variant | CP4 | customer · Priya Shah | `26:4259` |

### Help and knowledge · CP-05

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| HK01 | Help home — full length | Desktop 1440 | `/portal/knowledge` | Overview | CP3 | customer · Priya Shah | `27:1201` |
| HK02 | Search results — screen won't move | Desktop 1440 | `/portal/knowledge` | Customer list | CP3 | customer · Priya Shah | `27:1408` |
| HK03 | Guided help — three questions and the result, full length | Desktop 1440 | `/portal/knowledge` | Form / guided workflow | CP3 | customer · Priya Shah | `27:1567` |
| HK04 | Article SYN-KA-000021 r02 — Applies: Yes, full length | Desktop 1440 | `/portal/knowledge` | Record detail | CP3 | customer · Priya Shah | `27:1733` |
| HK06 | Stop and call us — SYN-KA-000025 | Desktop 1440 | `/portal/knowledge` | Record detail | CP3 | customer · Priya Shah | `27:1919` |
| HK08 | Did this help? — No, with a comment, full length | Dialogs and panels | `/portal/knowledge` | Form: dialog | CP3 | customer · Priya Shah | `27:2374` |
| HK05 | This needs a technician — the request carries the path and answers, full length | States | `/portal/knowledge` | State | CP3 | customer · Priya Shah | `27:2056` |
| HK07 | Applies: Not sure — we won't guess, full length | States | `/portal/knowledge` | State | CP3 | customer · Priya Shah | `27:2194` |
| HK09 | Article updated; article no longer available | States | `/portal/knowledge` | State | CP3 | customer · Priya Shah | `27:2571` |
| HK10 | No results; Help is online only | States | `/portal/knowledge` | State | CP3 | customer · Priya Shah | `27:2706` |
| TB HK04 | Article — tablet, full length | Tablet 1024 | `/portal/knowledge` | Tablet variant | CP3 | customer · Priya Shah | `27:2833` |
| PH16 | Help with the guided path — question 2 of 3, full length | Phone 390 and 320 | `/portal/knowledge` | Phone variant | CP3 | customer · Priya Shah | `27:3019` |
| PH16 | Help home — full length | Phone 390 and 320 | `/portal/knowledge` | Phone variant | CP3 | customer · Priya Shah | `27:3138` |
| PH17 | Article — Applies: Yes, full length | Phone 390 and 320 | `/portal/knowledge` | Phone variant | CP3 | customer · Priya Shah | `27:3323` |
| PH17-320 | Article — 320, full length | Phone 390 and 320 | `/portal/knowledge` | Phone variant | CP3 | customer · Priya Shah | `27:3488` |

### Quotations and account · CP-06

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| QA01 | Overview — the tabs shared with Noah | Desktop 1440 | `/portal/commercial` | Overview | CP5 | customer · Noah Patel | `28:1201` |
| QA02 | Quotations | Desktop 1440 | `/portal/commercial` | Customer list | CP5 | customer · Mei Tran | `28:1358` |
| QA03 | SYN-PPO-QUO-000214 r01 — exact quotation, full length | Desktop 1440 | `/portal/commercial` | Record detail | CP5 | customer · Mei Tran | `28:1514` |
| QA05 | Quotations — response recorded and a replaced revision, full length | Desktop 1440 | `/portal/commercial` | Customer list | CP5 | customer · Ben Carter | `28:1703` |
| QA06 | Orders & deliveries — Block C, AEST, full length | Desktop 1440 | `/portal/commercial` | Customer list | CP5 | customer · Sam Okafor | `28:1886` |
| QA07 | Account — figures as at 06:00, full length | Desktop 1440 | `/portal/commercial` | Record detail | CP5 | customer · Noah Patel | `28:2051` |
| QA08 | Invoice SYN-INV-000431 | Desktop 1440 | `/portal/commercial` | Record detail | CP5 | customer · Noah Patel | `28:2277` |
| QA10 | Variations — issued, response recorded, exact frame, full length | Desktop 1440 | `/portal/commercial` | Customer list | CP5 | customer · Sam Okafor | `28:2438` |
| QA11 | Account — Riverbend, full length | Desktop 1440 | `/portal/commercial` | Record detail | CP5 | customer · Lena Ortiz | `28:2638` |
| QA04 | Reply about this — dialog, a message and never a response | Dialogs and panels | `/portal/commercial` | Form: dialog | CP5 | customer · Mei Tran | `28:2828` |
| QA09 | Query an invoice — dialog, a prefilled request | Dialogs and panels | `/portal/commercial` | Form: dialog | CP5 | customer · Noah Patel | `28:3052` |
| QA07 | Download statement — dialog | Dialogs and panels | `/portal/commercial` | Form: dialog | CP5 | customer · Noah Patel | `28:3252` |
| QA15 | Ask about this delivery — dialog, a question and never a change to the order | Dialogs and panels | `/portal/commercial` | Form: dialog | CP5 | customer · Sam Okafor | `62:7886` |
| QA09 | You queried it — 09:35, later frame | States | `/portal/commercial` | State | CP5 | customer · Noah Patel | `28:3511` |
| QA12 | Account figures not available — no balance and no partial list | States | `/portal/commercial` | State | CP5 | customer · Noah Patel | `28:3669` |
| QA13 | This isn't available to you — Quotations & account is not in Priya's navigation | States | `/portal/commercial` | State | CP5 | customer · Priya Shah | `28:3806` |
| QA14 | PROPOSAL · D-024 open · not part of the accepted design — approve a variation online · N-P6 | States | `/portal/commercial` | State | later | customer · Sam Okafor | `28:3917` |
| TB QA03 | Exact quotation — tablet, full length | Tablet 1024 | `/portal/commercial` | Tablet variant | CP5 | customer · Mei Tran | `28:4072` |
| PH21 | Quotations — full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Mei Tran | `28:4261` |
| PH22 | Quotation exact content — Download PDF bar, full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Mei Tran | `28:4388` |
| PH23 | Orders & deliveries — Copy for the tracking number, full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Sam Okafor | `28:4562` |
| PH23-320 | Orders & deliveries — 320, full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Sam Okafor | `28:4708` |
| PH24 | Account — the Account tab, full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Noah Patel | `28:4849` |
| PH24-320 | Account — 320, full length | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Noah Patel | `28:5026` |
| PH25 | Query an invoice — full-screen form | Phone 390 and 320 | `/portal/commercial` | Phone variant | CP5 | customer · Noah Patel | `28:5198` |

### Staff workspace · Customer portal

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| SW01 | Portal home & access — dashboard at 09:00, full length | Desktop 1440 | Workspace · Portal home & access | Overview / dashboard | proposal | staff · Ravi Kumar | `37:1201` |
| SW02 | Access register — 16 members, collapsed strip | Desktop 1440 | Workspace · Portal home & access | Register / worklist | proposal | staff · Ravi Kumar | `37:1700` |
| SW03 | Member record — Graham Holt, Glasshouse 4 ends 10:12 | Desktop 1440 | Workspace · Portal home & access | Record detail | proposal | staff · Ravi Kumar | `37:2619` |
| SW04 | Support requests — Waiting on Powerplants, oldest first | Desktop 1440 | Workspace · Support requests | Register / worklist | proposal | staff · Ravi Kumar | `37:3047` |
| SW14 | Project updates — Published, as at 09:45 | Desktop 1440 | Workspace · Project updates | Register / worklist | proposal | staff · Ravi Kumar | `37:3458` |
| SW15 | Quotations & account — Commercial grants, no figures | Desktop 1440 | Workspace · Quotations & account | Register / worklist | proposal | staff · Ravi Kumar | `37:3890` |
| SW16 | Customer knowledge — Published, with feedback | Desktop 1440 | Workspace · Customer knowledge | Register / worklist | proposal | staff · Ravi Kumar | `37:4388` |
| SW13 | Equipment & reports — Released reports, as at 09:10 | Desktop 1440 | Workspace · Equipment & reports | Register / worklist | proposal | staff · Jordan Kim | `38:2934` |
| SW05 | SYN-TKT-000214 — as the customer sees it, full length | Desktop 1440 | Workspace · Support requests | Review (read-only preview) | proposal | staff · Ravi Kumar | `38:3358` |
| SW06 | Open in Service requests — the hand-off and the Customer page entry | Desktop 1440 | Workspace · Support requests | Record detail | proposal | staff · Ravi Kumar | `38:3830` |
| SW10 | Member record — Ella Brandt, invitation sent 09:31 and accepted 10:05, later frame | Desktop 1440 | Workspace · Portal home & access | Record detail | proposal | staff · Ravi Kumar | `38:4187` |
| SW11 | View as customer — Ella Brandt at 09:32, read only, exposure guard · N-P4, full length | Desktop 1440 | Workspace · Portal home & access | Review (read-only preview) | proposal | staff · Ravi Kumar | `38:4545` |
| SW07 | Propose portal access — panel, from Ella Brandt's People record, 08:48 | Dialogs and panels | Workspace · Portal home & access | Form: panel | proposal | staff · Ravi Kumar | `38:5328` |
| SW08 | Review a proposal — dialog, 09:15 | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Jordan Kim | `38:5986` |
| SW09 | Apply a grant — dialog, 09:30 | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Taylor Quinn | `38:6693` |
| SW13 | Release to portal audience — dialog, 09:12 | Dialogs and panels | Workspace · Equipment & reports | Form: dialog | proposal | staff · Jordan Kim | `38:7375` |
| X | End a grant early — dialog, Systems only | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Taylor Quinn | `38:7604` |
| X | Resend an invitation — dialog, Rhea Kaur | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Taylor Quinn | `38:7864` |
| X | Withdraw a release — dialog | Dialogs and panels | Workspace · Equipment & reports | Form: dialog | proposal | staff · Jordan Kim | `38:8533` |
| X | View as customer — choose a member | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Ravi Kumar | `38:8754` |
| X | Filters — panel on the access register | Dialogs and panels | Workspace · Portal home & access | Form: panel | proposal | staff · Ravi Kumar | `38:9365` |
| X | Columns — panel, order, width and density | Dialogs and panels | Workspace · Portal home & access | Form: panel | proposal | staff · Ravi Kumar | `38:9989` |
| X | Export — members and grants, no customer content | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Ravi Kumar | `38:10730` |
| X | Saved view — name and share | Dialogs and panels | Workspace · Portal home & access | Form: dialog | proposal | staff · Ravi Kumar | `38:11333` |
| SW12 | Refusals — what a proposal, release or preview is refused for | States | Workspace · Equipment & reports | State | proposal | staff · Ravi Kumar | `38:4972` |
| SW17 | Access register — a viewer reads it, no commands | States | Workspace · Portal home & access | State | proposal | staff · Lee Nakamura | `73:8363` |
| TB SW02 | Access register — tablet 1024, top bar 332 / 360 / 332 and the collapsed strip | Tablet 1024 | Workspace · Portal home & access | Tablet variant | proposal | staff · Ravi Kumar | `38:11931` |
| PH (staff) | Access register on the phone — opened from More, commands done on a desktop (R124) | Phone 390 and 320 | Workspace · Portal home & access | Phone variant | proposal | staff · Ravi Kumar | `38:12460` |

### Interaction states · CP

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| ST01 | Interaction states and accessibility — customer and staff, full length | Desktop 1440 | All scopes | States specification | all stages | customer and staff · Priya Shah, Ravi Kumar | `42:1201` |
| PS01 | Loading — skeletons, no counts | States | `/portal` | State | CP1 | customer · Priya Shah | `42:2244` |
| PS02 | Filtered-empty — the filter is restated | States | `/portal/support` | State | CP1 | customer · Priya Shah | `42:2378` |
| PS03 | Could not load — the card is named and nothing stale is shown | States | `/portal` | State | CP1 | customer · Priya Shah | `42:2515` |
| PS05 | Permission changed while the page was open | States | Workspace · Portal home & access | State | proposal | staff · Ravi Kumar | `42:2682` |
| PS06 | Preview not allowed | States | Workspace · Portal home & access | State | proposal | staff · Ravi Kumar | `42:2966` |
| PS04 | Slow send on the phone — one Sending state, never a duplicate | Phone 390 and 320 | `/portal/support` | Phone variant | CP1 | customer · Priya Shah | `42:2659` |

### Administration · CP

| Code | Sheet | Section | Route or scope | Page type | Stage | Signed in | Node |
|---|---|---|---|---|---|---|---|
| AD01 | Customer portal settings hub — what can be changed, by whom, at which scope | Desktop 1440 | Workspace · Settings | Overview | proposal | staff · Taylor Quinn | `48:1201` |
| AD02 | Portal roles — what each role can see and do | Desktop 1440 | Workspace · Settings | Configuration editor | proposal | staff · Taylor Quinn | `48:1620` |
| AD03 | Invitations and sign-in — expiry, verification and the open sign-in decision | Desktop 1440 | Workspace · Settings | Configuration editor | proposal · D-022 open | staff · Taylor Quinn | `48:2054` |
| AD04 | Customer status mapping — internal fact to customer word, with who acts next | Desktop 1440 | Workspace · Settings | Configuration editor | proposal · ADR-0043 open for Resolved and Closed | staff · Taylor Quinn | `48:2417` |
| AD05 | Publication rules — what each module releases and who releases it | Desktop 1440 | Workspace · Settings | Configuration editor | proposal | staff · Taylor Quinn | `57:2057` |
| AD06 | Uploads — file types, the size limit, the separate check and what customers are told | Desktop 1440 | Workspace · Settings | Configuration editor | proposal | staff · Taylor Quinn | `57:2493` |
| AD07 | Branding and copy — the portal name, logo, urgent-help line and footer | Desktop 1440 | Workspace · Settings | Configuration editor | proposal · D-024 open | staff · Taylor Quinn | `57:2843` |
| AD08 | Notifications and nudges — My Work items with their day counts; saved views, columns and density | Desktop 1440 | Workspace · Settings | Configuration editor | proposal | staff · Taylor Quinn | `57:3209` |
| X | Change a setting — reason, effect and reviewer | Dialogs and panels | Workspace · Settings | Form: dialog | proposal | staff · Taylor Quinn | `57:3726` |
| AD09 | Portal settings — read only for a person who cannot change them | States | Workspace · Settings | State | proposal | staff · Ravi Kumar | `57:4054` |

## 4. Rules applied

- **Two sides, two shells (D1).** Customer sheets use one customer portal shell: an 88 px navy header with the Powerplants logo, "Customer portal", the organisation and site, Help and the account button, over a white navigation bar that shows only delivered and granted pages; a 1200 px content column; a footer. The phone has one 80 px header row and a bottom tab bar, and at 320 px the site icon and chevron drop. The portal is never called "PPO" or "Powerplants One" on a customer sheet. Staff sheets use the accepted staff shell with More current (R107), the accepted flyout and docked menu with nested views (R108), the collapsed strip and the record header toolbar (Addendum A1).
- **Default no access (D2).** A grant names one contact, one portal role (Requester, Site coordinator, Project contact, Commercial representative), explicit sites, the commercial slices (Orders & deliveries, Account, Quotations, Variations) and, for Account, one MYOB customer account, with a start, an optional end, an independent reviewer and a reason. Staff propose from the People record, a second person reviews and Systems applies. Drawn on SW07 to SW10 and explained on AD02.
- **Only what was released (D3).** Internal notes, owners, priorities, activities, internal statuses, work order and appointment references, costs, margins, the internal cost impact of a change, Finance's own reference for a query and a credit hold are never on a customer sheet. Staff appear as "Name, service team". One organisation and one site at a time, with no counts from other sites.
- **A customer's act is recorded and handed over (D4).** Every confirmation says what the act does and does not do in one sentence. There is no Accept, Approve or Sign; the proposed online approval is drawn only on the labelled proposal sheet QA14.
- **Status words from facts, with who acts next (D5).** One status family with fixed words and tones (ST01, AD04). No "In progress", no "Overdue" in red, "Delivered" only with proof of delivery, "Response recorded" only after staff record it.
- **Source and time on every list and figure (D6).** Each card names its source and when it was read; a failed card shows no stale data; account figures come from one complete MYOB read with "Figures as at".
- **Stages are labelled and the full target is drawn (D7).** CP1, CP2a, CP2b, CP3, CP4 and CP5 are on each sheet's label, on the Read me index and on each Flows card, never on a customer's screen.
- **Identity and session drawn honestly (D8).** Dashed purple "to be decided" placeholders carry D-022 wherever sign-in, the second step or the session length would appear.
- **Time and money (D9).** Site time with the zone named once per page; dates as "Thu 5 Nov 2026"; amounts in AUD with the GST basis the source states (quotations and variations excluding GST, invoices and the account including GST).
- **Customer-facing references only (D10)**, in the form set by [readable reference namespaces](readable-reference-namespaces.md).
- **Page patterns per side (D13).** Customer pages: 16 px text and inputs, 48 px controls, one primary per screen, tables on desktop and tablet that become labelled cards on the phone, plain language at about a Year 8 reading level. Staff pages: the app-wide register standard (one line per cell, ellipsis, sideways scroll; reorder, resize, no inline edit, no address lookup), specified on ST01 and shown on SW02.
- **Page template.** Pages in the order Read me, — Accepted — (empty), — Proposals — (empty), the nine scope pages, Shell and kit, Scratch. Every scope page has the six sections Desktop 1440, Dialogs and panels, States, Tablet 1024, Phone 390 and 320, Flows and notes. Every scope page sits below — Proposals — until Dean accepts.
- **Automation never decides.** N-P1 to N-P4 are drawn as integrated features; N-P5 to N-P12 are proposed on notes or the one proposal sheet. Each prepares, checks or suggests and never grants, releases, responds, accepts, sends or changes anything without a named person's act.

## 5. Assumptions and proposed departures

Questions answered by their defaults (the brief's section 13):

| # | Question | Taken as |
|---|---|---|
| Q1 | The target file | The file Dean created, named "PPO - Customer portal module" |
| Q2 | Both sides in one file | Yes; each sheet is labelled with its side, and the staff pages are proposals for the shell's six menu items |
| Q3 | One consolidated portal shell | Yes; one family with the selected page as a property (A2) |
| Q4 | CP-03 and CP-04 redrawn to the full target | Yes; this record is their first repository record (A11) |
| Q5 | Signed-in personas | Priya Shah on the customer side and Ravi Kumar on the staff side, with labelled persona sheets for the others |
| Q6 | Time zones | Site time per site: Melbourne (AEDT) for Hillview and staff, Brisbane (AEST) for Block C (A13) |
| Q7 | Online approval under D-024 | One labelled proposal sheet (QA14), never on an accepted flow |
| Q8 | View as customer | Drawn, with the preview bar and the exposure guard (SW11) |
| Q9 | Report responses through the portal beside the link page | Yes; both routes read the same response |
| Q10 | Upload limit | 20 MB; JPEG, PNG, HEIC, PDF, DOCX and XLSX (A9) |

Assumptions and departures:

| # | Assumption or departure |
|---|---|
| A1 | The file is named "PPO - Customer portal module" against the standard's "PPO - Customer Portal". Used as given; nothing renamed |
| A2 | One consolidated customer portal shell family as local components, in place of the accepted pages' twenty local parts (the 24 October audit's S10). Plugin reads of the frozen design file timed out repeatedly, so the family was rebuilt from the accepted header's specification, the page structure and renders rather than copied node for node; the logo is drawn from the repository's logo pack r01. A person should compare it side by side with the accepted CP-01 page (G7) |
| A3 | The route `/portal/visits` holds Visits, Equipment, Reports and Documents as four tabs; the register's `/portal/equipment` sits under it |
| A4 | The staff workspace's six pages are titled by the menu's labels, with nested views under each (Access register, Proposed, Ending soon; Waiting on Powerplants, Waiting on customer, All through the portal; Published, Updates to publish; Released reports, Released documents; Commercial grants, Visible items; Published articles, Guided help, Feedback). A proposal for the shell |
| A5 | The collapsed strip is drawn as the accepted shell file has it: 12 px wide with 1300 px of content. The brief (section 6.4) and Addendum A1.6 say 80 px with 1232 px. The shell file is the source of truth; the difference is for Dean to settle (C5) |
| A6 | Capabilities marked † are only proposed (Propose portal access, Release to portal audience, the second approval of a commercial grant): no `portal.*` capability exists. Those marked ◇ are assumptions about who holds an existing capability (`service.ticket.*` for Reply in Service requests, `report.issue` for release, `admin.access.approve`, `admin.access.apply`) |
| A7 | The Portal channel for service requests is proposed; migration 0112 has no such channel |
| A8 | Ask about this visit adds a reply to the request the visit came from, never a new request (N-P2) |
| A9 | Uploads: 20 MB for each file; JPEG, PNG, HEIC, PDF, DOCX and XLSX |
| A10 | Project stage words in customer terms: Not started, Under way, Final checks by Powerplants, Ready for your walk-through, Accepted by you on [date] as recorded by Powerplants |
| A11 | CP-03 and CP-04 are redrawn to the full target from proposals that have no decision record. Every difference from their notes cards follows the brief; this record is their first |
| A12 | Story reconciliation (D11; Addendum A3.11): Priya Shah is the signed-in member; Graham Holt, Ella Brandt and Ben Carter as the addendum sets them; the requests, reports, quotations and account figures of the brief's section 9; variation V-03 is not shown to Priya Shah. Earlier fixtures superseded: Grace Holt; Lena Ortiz at "SYN Riverbend Glasshouse 4"; Jamie Ellis as a Woodhaven representative; Sasha Cole as the service coordinator; requests SYN-TKT-000096 to 000105; reports SYN-RPT-000063, 000064 and 000066; CC-4 SYN-AST-000141; the Riverbend balance of A$27,379.00 |
| A13 | Site time per site: Melbourne (AEDT) for Hillview Growers and for staff, Brisbane (AEST) for Block C. Brisbane was the accepted pages' fixture for Hillview |
| A14 | Customer copy avoids internal words: "You don't give access yourself" replaces the brief's "You don't grant access"; the review step's link reads "Change", not "Edit"; the site menu reads "No counts or updates from other sites are shown" |
| A15 | The first-stage Home (HO06, as accepted) shows SYN-TKT-000209 as "Reviewed by service team", because the first stage delivers only the first three status words |
| A16 | Contact placeholders 03 5550 0142 and help@powerplants.example (a fictional number range and an `.example` domain) |
| A17 | Sheets added beyond the brief's list: SU03b (the duplicate offer, N-P2), HO17 (the desktop account menu), PU11 and QA15 (Ask about this), SW13 as a register behind the release dialog, SW17 (a viewer's read-only register), AD09 and the Change a setting dialog |
| A18 | The documents list (VR10) does not mention the unreleased as-built pack: nothing hints at what was not released |
| A19 | The report bodies for SYN-RPT-000036 and SYN-RPT-000040 are synthetic and in customer words, consistent with Addendum A3.4 |
| A20 | Projects: Update 2 (Thu 8 Oct 2026) and Update 1 (Thu 24 Sep 2026) are assumed at a fortnightly rhythm; "Screen layout drawing · revision B · released Mon 5 Oct 2026" is an assumed released document; the Woodhaven project reads "Potting machine project" without a reference; the body of Update 4 holds only released facts |
| A21 | Help: the article review date Mon 26 Oct 2026 is assumed; article steps are synthetic and customer-safe; the phone number on Stop and call us is a placeholder |
| A22 | Commercial: the quotation body shows one price line; the lines of invoice SYN-INV-000431 are worked out from Addendum A3.5 (A$53,150.00 less 5 % retention of A$2,657.50 = A$50,492.50, plus GST of A$5,049.25 = A$55,541.75 including GST); the amount of SYN-PPO-QUO-000177 r02 is not stated; MYOB customer account numbers (`SYN-C-`) show on the Account tab; the tabs are the granted slices plus Overview |
| A23 | Staff: SYN-TKT-000216 is assumed as the request recording Jo Marsh's ask to end Graham Holt's Glasshouse 4 access, applied Wed 4 Nov 16:45; the second approver for Lena Ortiz's Account slice is Avery Lin; "All through the portal 5" and "Visible items 9" are assumed counts |
| A24 | The staff phone has no workspace tab bar; Customer portal opens from More and reads the access register; Propose, Review, Apply and Release are done on a desktop (R124) |
| A25 | Icons are the Sales file's local Lucide stand-ins, with camera and upload added |
| A26 | The administration pages are drawn inside the Customer portal workspace (Customer portal › Settings) with More current, signed in as Taylor Quinn. Where they sit in the Settings workspace is for the Settings file. The "Due soon" threshold is not specified. The 20 MB to 25 MB change in the dialog is an illustration |
| A27 | The dataset's weekday for SYN-PPO-QUO-000214, "issued Fri 31 Oct 16:20, valid to Sun 30 Nov", does not match the 2026 calendar: 31 October 2026 is a Saturday and 30 November 2026 is a Monday. Drawn as the brief and Addendum A3.11 state it, to stay consistent with the Estimating file; the correction is Dean's to make across files (C4) |
| A28 | The green bar under the current navigation item and tab is 2.41 : 1 on white, below the 3 : 1 needed for a mark that carries meaning alone. It is never the only cue (the label is also Medium-weight ink). No token is changed (C6) |
| A29 | Addendum A2 was not attached. References follow the repository's [readable reference namespaces](readable-reference-namespaces.md) and the brief's D10 |
| A30 | Later stages are labelled: Resolved and Closed on SU11 wait on ADR-0043; QA14 is the one sheet with an approval control and is labelled "PROPOSAL · D-024 open · not part of the accepted design" |

Stale register notes observed and left as they are, because the design register follows in its own change: no route entry exists for any `/portal` path; CP-03 and CP-04 have no images; the register lists `/portal/equipment` where this design proposes `/portal/visits`.

## 6. Verification

Done in the file on 12 November 2026:

- **Renders.** Every sheet was rendered and read during its batch (desktop at 1100 to 1440 px, phones at 390) and the defects found were corrected. One post-fix render is final.
- **Structural pass and position audit**, by routine, on all nine scope pages, the Read me page and the Shell and kit page: no loose node on a scope page; every sheet and label inside its section; no overlap between sheets, labels, sections or cards; every sheet has a label that matches its name and the label form; every label is no wider than its sheet; direct children inside each sheet's bounds; Roboto the only font family; no staff register cell taller than one line; nothing hidden or transparent at sheet level; the separator pages and Scratch empty. Three sheets shorter than the standard frame were brought to 900 and 844. On the Shell and kit page three position findings were fixed.
- **Exposure scan**, by routine, over every text on all 143 customer sheets: no internal word (ticket, work order, appointment, triage, priority, owner, SLA, internal, hold, dispute, quarantine, grant, capability, tenant, activity, handoff, exception, cost, margin, PPO, Powerplants One), no internal reference family, no internal status name. Five strings failed the first run and were reworded (A14); the scan then passed. The "New" marker on a message that arrives while writing is the brief's own wording and is kept.
- **Authority scan.** No Accept, Approve, Sign, Pay, Book, Authorise, Confirm delivery, Grant or Edit control on any customer sheet except QA14.
- **Evidence scan**, by routine: every reference and amount on every sheet was matched against every reference and amount in the brief and its addenda. All match, except SYN-TKT-000216 (assumed, A23) and the two worked-out invoice lines (A22).
- **Date style and zone.** No date in another style; the zone line appears at most once on a customer sheet.
- **Contrast and size.** 22 colour pairs computed from the PPO colour variables on ST01: 21 pass and one is below (A28). Customer text is 16 px with 12 px as the smallest (source lines); customer controls are 48 px.
- **Counts.** 16 members (15 applied, 1 proposed); Support requests 3 waiting on Powerplants, equal to the flyout's count; totals shown only where every permitted item has loaded.

Not done, and stated so: times, dates and names were checked by eye in the renders, not by routine; no review by a person with a keyboard, a screen reader, 200 % zoom or a device; no prototype links; dark mode is not drawn; the side-by-side comparison of the consolidated shell with the accepted CP-01 page (A2).

Repository checks run for this change: `python3 scripts/build_status.py --check` and `python3 scripts/check_foundation.py`.

## 7. Not drawn and open questions

| Item | State |
|---|---|
| D-022 identity provider, invitations, multi-factor and session length | Open. Drawn as placeholders on HO01, HO02, PH01, PH02 and AD03 |
| D-024 branding, templates, signature and online acceptance | Open. QA14 is a labelled proposal; AD07 holds a placeholder |
| D-020 roles, and a consultant with two organisations | Open. Not drawn |
| D-011, D-012, D-027 | Open. The footer's privacy and retention link cites D-012 |
| ADR-0043, Resolved and Closed for requests | Proposed. Drawn as a later stage on SU11 and AD04 |
| The portal-access capability (CP-01 D11) and the second approval of a commercial grant | Not in the code. Marked † wherever drawn; the second approval has no dialog (G1) |
| The read-only MYOB adapter for the Account slice (EI-7, EI-9) | Not built. The Account tab draws its result |
| CP-01 Q3 customer-administered members; CP-01 Q8 a live calendar feed | Q3 proposed as N-P9; Q8 not proposed |
| CP-02 Q5; CP-05 Q3; CP-06 Q3 and Q4 | Open as the accepted records leave them |
| Site readiness Q4 | Proposed as N-P7 |
| The M10 support request notice and the D-025 extension | Proposed as N-P8 |
| The Portal channel in the service request statements | Proposed (A7) |
| Dark mode | Not drawn |
| Not proposed, and recorded so | A payment link or gateway (NAD-06); a live calendar feed; generated answers to customers (CP-05 D14); an offline copy of customer content (portal design §9) |

## 8. Boundary and next steps

This is design only. It adds no application code, route, migration, permission, capability, identity provider, email or integration, contacts no customer, and changes no other Figma file. The design register and per-route page guidance follow in their own reviewed change. CPA-01 to CPA-16 remain Not run.

Next steps, in order:

1. Dean reviews the file and decides C4 and C5 (section 9), which other files share.
2. Dean confirms or reverses the defaults taken for Q1 to Q10 and the assumptions A1 to A30.
3. On acceptance, Dean saves a named version of the file and it is recorded here. A named version pins a build basis; any later design change needs a new one.
4. The "as the customer sees it" previews in the Service, Projects, Estimating, Supply, Finance and Customers files are aligned where Addendum A3.11 corrected them.
5. The design register and page guidance for `scope:CP-01` to `scope:CP-06` are updated in their own change.

## 9. Audit — 12 November 2026

### 9.1 Critique

- **Customer side, first impression.** A grower on a phone can tell in one glance what is happening, who acts next and what to do: one status word, one who-acts-next line and one primary action per screen, with the source and time on every card. Nothing reads as a booking, an authorisation, an acceptance, a signature, a payment or a delivery that did not happen.
- **Usability.** Every customer flow completes at 390 px with a sticky primary and no hover-only information. Forms are full-screen sheets on the phone. The request form keeps contact details read only and says where to change them.
- **Hierarchy.** Page title and one line of context, then cards; exact issued content sits in its own bordered frame and is never reflowed with portal chrome inside.
- **Consistency.** One shell family, one status family, one button and tag set across all six customer pages; the staff pages reuse the accepted shell and the Sales kit without redrawing.
- **Accessibility.** 16 px text and inputs, 48 px controls, a 2 px focus ring with a 3 px offset, words with every colour. One contrast finding (C6). A person's review is still needed (G3).
- **Staff side.** The workspace reads as part of the accepted shell. Every access change is a command with a reason and a reviewer, and the three steps are taken by three different people.

### 9.2 Coverage

Scenarios (the brief's section 4.3), each drawn:

| Scenario | Sheets |
|---|---|
| S-01 Priya's Home at 09:00 | HO05, PH03, PH03-320, TB HO05 |
| S-02 SYN-TKT-000209 and the 09:10 reply | SU05, SU06, PH06 |
| S-03 Ask about this visit; Add to calendar | VR03 and its two dialogs, PH10 |
| S-04 A new request, sent 09:22 | SU03, SU04, SU08, SU14, PH07, PH08, PH09 |
| S-05 Not sure it was received | SU09 |
| S-06 Update 4 published at 09:40 while the email is held | PU02, PU03 |
| S-07 Mark as done | PU05, PU06, PH20 |
| S-08 Acknowledge Update 4 | PU04, PH19 |
| S-09 Dana Brooks answers a question | PU07 |
| S-10 Visits, past visits and equipment | VR01, VR02, VR05, PH11, PH13 |
| S-11 The exact report SYN-RPT-000036 r01 | VR06, PH14, TB VR06 |
| S-12 Owen Dunne responds to SYN-RPT-000040 | VR07, VR08, VR14, PH15 |
| S-13 A newer revision of SYN-RPT-000039 | VR09 |
| S-14 Adding a photo; files not accepted | VR11, PH12 |
| S-15 Help, the guided path and the article | HK02, HK03, HK04, PH16, PH17 |
| S-16 This needs a technician | HK05 |
| S-17 Graham Holt's access changes at 10:12 | HO11, HO12, PH28 |
| S-18 Noah Patel's Account tab | QA07, QA08, PH24 |
| S-19 Query an invoice | QA09, PH25 |
| S-20 Mei Tran's quotation | QA02, QA03, QA04, PH21, PH22, TB QA03 |
| S-21 Response recorded and a replaced revision | QA05 |
| S-22 Sam Okafor's deliveries and variations | QA06, QA10, PH23 |
| S-23 Ben Carter's request and no updates yet | SU02, PU10 |
| S-24 Ari Levin replies | SU07 |
| S-25 Ravi Kumar's workspace at 09:00 | SW01, SW04, SW05, SW06 |
| S-26 Ella Brandt's access: propose, review, apply | SW07, SW08, SW09, SW10 |
| S-27 View as customer | SW11 and the member picker |
| S-28 Access edge cases | SW02, SW03, SW12, Resend an invitation, End a grant early |
| S-29 Release to the portal audience | SW13 and its dialog, Withdraw a release |
| S-30 No membership; a first visit | HO02, HO03, HO10, PH02 |

Acceptance cases, with the sheets that show the intended behaviour. A design shows intent only; all sixteen remain Not run.

| Case | Sheets |
|---|---|
| CPA-01 scope and non-enumerating denial | SU02, SU12, QA13, HO03, HO07, PH04 |
| CPA-02 access loss and session expiry | HO11, HO12, HO13, PH28, PH29 |
| CPA-03 request validation and no eligible owner | SU03, SU04, SU08, SU13, VR04 |
| CPA-04 exactly one request after an interrupted send | SU09, PS04 |
| CPA-05 unsent text and uncertain state | SU09, HO11, PH30, PS04 |
| CPA-06 public and internal messages; no state change by a customer | SU05, SU06, SU07, SU10, SW05, AD04 |
| CPA-07 exact issued report bytes and audience | VR06, VR12, SW13 |
| CPA-08 uploads and the separate check | VR11, PH12, AD06 |
| CPA-09 the customer's report response | VR07, VR08, VR09, VR14, PH15 |
| CPA-10 published project revisions | PU02, PU03, PU04, PU08, PU10 |
| CPA-11 published knowledge and search | HK02, HK04, HK07, HK09, HK10, SW16 |
| CPA-12 no internal canaries | The exposure scan over all customer sheets; SW11 |
| CPA-13 keyboard, reflow and announcements | ST01; the eight 320 px sheets |
| CPA-14 restart and recovery | SU09, PH30, AD03 |
| CPA-15 commercial reads | QA01 to QA13; QA14 as a proposal only |
| CPA-16 live activation | Cannot be shown by a design |

Against the brief's minimums: 31 sheets in the Dialogs and panels sections plus the full-page forms (30 asked); 18 page states (18); 10 tablets (10); phone codes PH01 to PH30 with eight 320 px variants (30 and 8); administration AD01 to AD08 and two more (8).

### 9.3 Checks

- **Exposure:** pass after five corrections (C1).
- **Authority:** pass. QA14 is the only sheet with an approval control and is labelled as the D-024 proposal.
- **Evidence:** pass, with the two exceptions in section 6.
- **Capability:** each enabled command matches the brief's persona matrix. Priya Shah has no Quotations & account; Noah Patel has Overview, Orders & deliveries and Account; Mei Tran Quotations only; Lena Ortiz Account only; Ben Carter Quotations and Orders & deliveries; Sam Okafor Orders & deliveries and Variations. Ravi Kumar proposes, Jordan Kim reviews and releases, Taylor Quinn applies, ends and resends, and Lee Nakamura reads only.

### 9.4 Findings

**C · Corrections**

| # | Correction | State |
|---|---|---|
| C1 | Five customer strings used an internal word or an Edit control | Done: reworded (A14) |
| C2 | Three sheets were shorter than the standard frame | Done: brought to 900 and 844 |
| C3 | Staff dialogs and panels sat inside the sheet's layout | Done: now overlays |
| C4 | The dataset's weekday for SYN-PPO-QUO-000214 does not match the 2026 calendar (A27) | Dean to decide, across files |
| C5 | The collapsed strip: 80 px in the brief and Addendum A1.6, 12 px in the accepted shell file (A5) | Dean to decide |
| C6 | The green bar under the current navigation item is 2.41 : 1 on white (A28) | For the library: a darker green would let it stand alone |

**R · Refinements**

| # | Refinement |
|---|---|
| R1 | Mark a new reply on the desktop requests list as the phone list does |
| R2 | State the basis of the payment line on the Account tab, or one "All amounts include GST" line for the card |
| R3 | Use the desktop width better on the Account tab |
| R4 | Order Home's cards by who acts next, You first |
| R5 | Give the staff dashboard tiles room for full captions |
| R6 | Confirm the wrapped rules tables on the administration pages against the Settings file's configuration editor |
| R7 | Let View as customer move between the member's pages inside the preview |

**G · Gaps**

| # | Gap |
|---|---|
| G1 | The second approval of a commercial grant has no dialog; it is named on SW15, AD02 and AD08 |
| G2 | A contact with two organisations (D-020) is not drawn |
| G3 | No review by a person with a keyboard, screen reader, 200 % zoom or a device; 320 px is drawn for the eight sheets in the minimum |
| G4 | Dark mode is not drawn |
| G5 | Ask about this is drawn for an update and a delivery; the action, document and invoice forms reuse it and are not drawn one by one |
| G6 | Prototype links between sheets are not wired |
| G7 | The consolidated shell family was rebuilt rather than copied node for node (A2) and needs a side-by-side look by a person |

**N · New features.** Integrated: N-P1 status from facts, N-P2 duplicate avoidance, N-P3 the Applies check, N-P4 the exposure guard in View as customer. Proposed, each preparing, checking or suggesting and never deciding: N-P5 help while typing a request, N-P6 online approval under D-024 (QA14), N-P7 a readiness summary for each visit, N-P8 the support request notice, N-P9 customer-administered members, N-P10 access review reminders, N-P11 statement and invoice notices, N-P12 a plain-language check at authoring.

**P · Polish.** P1 Icons are local stand-ins until the library is published. P2 Sheet labels are long and are cut early on phone sheets. P3 The tablet rail is shown scrolled so More is in view; confirm against the shell at 768 px.

### 9.5 Recommended order

1. Decide C4 and C5, because other files share them.
2. Confirm or reverse the defaults for Q1 to Q10 and the assumptions A1 to A30.
3. R1 to R3.
4. G1 and G5.
5. G3, a person's accessibility review, before anything is built.
6. The proposals in this order: N-P8, N-P7, N-P5, N-P10, N-P12, N-P9, N-P11, then N-P6 once D-024 is decided.
7. Polish, then save a named version.
