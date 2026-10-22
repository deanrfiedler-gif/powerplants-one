---
document_id: PPO-USER-GUIDE-TOC
title: Powerplants One user guide, table of contents
date: 2026-10-23
owner: Dean Fiedler
status: Draft outline, proposed with PPO-USER-GUIDE-PROP; not adopted; no chapter is written
versioning: git
---

# Powerplants One user guide, table of contents

**State:** Draft outline, 23 October 2026. It is proposed together with the [user guide direction paper](../decisions/user-guide-direction.md) (PPO-USER-GUIDE-PROP) and is not adopted until Dean answers that paper's questions. No chapter below has been written.

This is the planned structure of the whole Powerplants One user guide for Powerplants staff. It covers every module in the design register and every journey between them. Its nine parts follow the direction paper, section 3.

## How to read this outline

- **Kind** says what the reader is doing: *Tutorial* (learning by doing it once), *How-to* (getting a task done), *Reference* (looking something up) or *Explanation* (understanding why).
- **Build state** is taken from the design register (`docs/design/development/register.json`) on 23 October 2026, simplified:
  - **Built:** the pages exist; acceptance may still be pending.
  - **Partly built:** the register says "refine".
  - **Not built:** no page yet.
  - **Conditional:** a Phase 11 option not on the design list (see [workshop, settings and preferences scope](../decisions/workshop-settings-preferences-scope.md), WS-D1).

  The register lags behind some recent work, so each chapter checks the current build when it is written.
- **Writing rule** (direction paper, section 9): the shared parts (front matter and parts 1, 2, 7 and 8) can be written now. A module chapter is written after its page design is accepted and built. A journey is written once every module it crosses has a published chapter.
- **Page guides are the module chapters.** Each scope in part 4 is one page guide, written to the [page guide template](../standards/page-guide-template.md). Its pages (routes) are sections inside it, and the in-app information icon opens the same text.
- **Stable keys, working titles.** Scope IDs and guide keys stay as registered, and this outline adds no scope ID. Chapter titles are working titles. Some use the names on screen rather than the register's internal titles; for example, CR-01 is "Opportunity detail and internal work" in the register but is shown here as "Deal detail", because the screen says Deals. Final titles follow the terminology sheet (direction paper, section 8).

## Front matter

| Section | Kind | Contents |
|---|---|---|
| About this guide | Reference | Who it is for, how it is organised, which release it describes, and the conventions used: on-screen labels in bold, synthetic examples, phone notes |
| Getting help and giving feedback | How-to | The information icon, the Help Centre (DK-07; the page guide panel exists, the `/help` page is not built), search, Quick Help, and how to report a wrong or missing instruction |

## Part 1. Getting started

For a new user on their first day. Kind: Tutorial, ending in short how-to sections.

| Chapter | Covers | Scopes | Build state |
|---|---|---|---|
| 1.1 Signing in | Microsoft sign-in, your company and workspace, signing out, what to do if access is refused | — (shell, `/login`) | Built |
| 1.2 Finding your way around | The rail, workspaces, the side menu, the top bar, the phone header, breadcrumbs, record pages and tabs | — (shell) | Built |
| 1.3 Searching | Finding pages and the records you are permitted to see | SH-04 | Partly built |
| 1.4 My Work | Your overview, actions, reviews and handovers, blocked and waiting, team queue | SH-01, SH-02, SH-06 | Built (SH-06 partly) |
| 1.5 Notifications and preferences | What notifies you and how to change it | SH-03 | Partly built |
| 1.6 Saved views | Saving and reusing your filters | SH-05 | Partly built |
| 1.7 Conversations | Record-linked conversations and the assistant, at a basic level (part 4.14 has the detail) | — (route `/conversations`); AI-01 | Built (assistant workspace not built) |
| 1.8 Using Powerplants One on your phone | The phone layout, quick add, what works on a phone, and the planned phone app ([ADR-0063](../decisions/ADR-0063-native-phone-app.md)) | — | Built (phone app not built) |

## Part 2. How Powerplants One works

The ideas a reader needs before the module chapters make sense. Kind: Explanation.

| Chapter | Covers |
|---|---|
| 2.1 Records and how they connect | Customers, sites, facilities and growing areas, contacts, equipment; leads, deals, estimates, quotations, projects, work orders and visits; documents. One diagram of the main record chain |
| 2.2 Ownership, next actions and handovers | Every record has an accountable owner and a next action; how work passes between teams and what "received" and "accepted" mean |
| 2.3 Saving, submitting, approving and uncertain results | The difference between saved, submitted, reviewed and approved; what "could not confirm" means and why you must not repeat an action |
| 2.4 What you can see and do | Capabilities, company and site scope, and why a record or button may be missing |
| 2.5 Powerplants One and the other systems | MYOB Acumatica as the book of record for finance, stock and purchasing; SharePoint for business documents and SOPs; CAD tools for drawings; Microsoft 365 for email and calendar |
| 2.6 Record numbers and references | How record numbers are formed and where to find them |

## Part 3. Journeys

End-to-end work across modules, written for the job functions named in each row. Kind: Tutorial and how-to. Each journey links into the part 4 chapters rather than repeating them. They are organised by business flow, because AD-01's roles are not adopted (direction paper, section 6).

| Journey | Job functions | Modules crossed (scopes) |
|---|---|---|
| J1 From enquiry to qualified deal | Sales | Leads, Deals (CR-01, CR-04), Customer 360 and contacts (CS-01, CS-02), activities |
| J2 From deal to issued quotation | Sales, estimator | CR-02 → ES-01 → ES-02 → ES-03 → ES-08 or Configure & price → ES-04 → ES-05 → ES-06 |
| J3 From accepted quotation to project start | Estimator, sales, project manager | ES-07 → CR-03 → PJ-01 → PJ-02 |
| J4 From design basis to as-built release | Engineer | EN-01 → EN-02 → EN-03 → EN-04 → EN-05 → EN-06 → EN-07 → EN-08 |
| J5 From material demand to delivery on site | Project manager, purchasing, warehouse | SC-01 → SC-02 → SC-03 → SC-04 → workshop (CX-02) → SC-05 → SC-06 → SC-07 |
| J6 From project delivery to closeout and handover to service | Project manager, service coordinator | PJ-03 → PJ-07 → PJ-08 → PJ-09 → CR-05 and MA-01 |
| J7 From service request to completed visit | Service coordinator, field technician | SV-01 → SV-02 → SV-03 → PL-01 → SV-04 → SV-05 → FI-01 → SV-06 → SV-07 |
| J8 A field technician's day, including offline | Field technician | FI-01 → FI-02 → FI-05 → FI-03 → FI-06 → FI-07 |
| J9 From service agreement to renewal | Service coordinator, sales | MA-01 → MA-02 → MA-03 → MA-04 → MA-05, with installed equipment (EQ-01) |
| J10 From warranty case to supplier recovery | Service coordinator, purchasing | MA-06 → MA-07 → SC-08, with equipment movement (EQ-04) |
| J11 From service work to Finance and customer accounts | Service coordinator, finance | FN-01 → FN-02 (later FN-03 to FN-05) |
| J12 Keeping the customer informed | Everyone who deals with customers | EC-01, EC-03, Conversations, PJ-08, FI-07 |

The issued workflow maps in `docs/reference/ui/module-workflow-maps/` are a checklist of journeys. Each journey is written from the current build, not from the map.

## Part 4. Module reference

One chapter per module, in the order of the application's workspaces. Each row is one page guide. Kind: Reference and how-to.

### 4.1 Sales

| Page guide | Scope | Build state |
|---|---|---|
| Leads | — (route `/sales/leads`) | Built |
| Deals: pipeline and forecast review | CR-04 | Built |
| Deal detail and internal work | CR-01 | Built |
| Sales-to-Estimating handover | CR-02 | Built |
| Won-deal receiving | CR-03 | Built |
| Sales aftercare and renewals | CR-05 | Built |
| Sales pulse and sales tasks | — (routes `/sales/pulse`, `/sales/tasks`) | Partly built |

### 4.2 Customers, contacts and sites

| Page guide | Scope | Build state |
|---|---|---|
| Customer 360 | CS-01 | Built |
| People (contacts) | CS-02 | Built |
| Stakeholders and relationships | CS-03 | Built |
| Sites | CS-04 | Built |
| Facilities and growing areas | CS-05 | Built |
| Site access and readiness | CS-06 | Built |
| Account development and visit plans | CS-07 | Built |
| Site surveys | CS-08 | Built |

### 4.3 Estimating and quotation

| Page guide | Scope | Build state |
|---|---|---|
| Estimating intake and workload | ES-01 | Partly built |
| Estimation Wizard: discovery, alternatives and revisions | ES-02 | Partly built |
| Cost sources and supplier prices | ES-03 | Built |
| Saved estimate review | ES-04 | Built |
| Quotation approval, issue and distribution | ES-05 | Built |
| Quotation response and negotiation | ES-06 | Built |
| Receiving, one-off items and conversion | ES-07 | Built |
| Specialist configuration workbench | ES-08 | Built |
| Priva fertigation configurator | — (route `/estimating/fertigation`) | Partly built |
| Configure & price, and the Rules studio | — (routes `/estimating/cpq`, `/estimating/rules`) | Built |
| Excel estimate import | excel-import | Not built |
| Estimate-to-actual outcome review | ES-09 | Not built |
| Reference cases and calibration | ES-10 | Not built |

### 4.4 Products and catalogue

| Page guide | Scope | Build state |
|---|---|---|
| Catalogue and product technical workspace | PD-01 | Built |
| Catalogue authoring and publication | PD-02 | Built |
| Supplier sources and pricing | PD-03 | Built |
| Compatibility, replacements and lifecycle | PD-04 | Built |
| Catalogue import and exceptions | PD-05 | Built |

### 4.5 Engineering

| Page guide | Scope | Build state |
|---|---|---|
| Engineering workload and deliverables | EN-01 | Partly built |
| Design basis and interfaces | EN-02 | Built |
| Drawings and controlled documents | EN-03 | Built |
| Technical queries and supplier submittals | EN-04 | Built |
| Technical reviews, issues and transmittals | EN-05 | Built |
| Released materials and substitutions | EN-06 | Built |
| Engineering change-impact review | EN-07 | Built |
| Commissioning basis and as-built release | EN-08 | Built |

### 4.6 Projects

| Page guide | Scope | Build state |
|---|---|---|
| Project initiation and receiving review | PJ-01 | Partly built |
| Project overview and portfolio health | PJ-02 | Partly built |
| Baseline, forecast and dependencies (programme) | PJ-03 | Partly built |
| Risks, issues, decisions and actions | PJ-04 | Not built (back end only) |
| Contract obligations, notices and variations | PJ-05 | Not built |
| Subcontractor and specialist packages | PJ-06 | Not built |
| Readiness and change-impact review | PJ-07 | Not built |
| Stakeholder updates | PJ-08 | Not built |
| Staged acceptance and closeout | PJ-09 | Partly built |

### 4.7 Service operations

| Page guide | Scope | Build state |
|---|---|---|
| Service desk and triage | SV-01 | Partly built |
| Request detail and communication timeline | SV-02 | Partly built |
| Work orders and scope | SV-03 | Partly built |
| Appointment coordination | SV-04 | Built |
| Job packs: preparation and issue | SV-05 | Partly built |
| Service review and reports | SV-06 | Partly built |
| Unresolved findings and follow-up | SV-07 | Partly built |
| Remote diagnosis and OEM escalation | SV-08 | Not built |
| Service planner and unassigned demand | PL-01 | Built |
| Resource availability and competence (field team) | PL-02 | Built |
| Resource demand and capacity | PL-03 | Built |
| Schedule changes and follow-up | PL-04 | Built |
| Visit routes and travel review | PL-05 | Built |

### 4.8 Field work

| Page guide | Scope | Build state |
|---|---|---|
| My jobs: today and job execution | FI-01 | Built |
| Offline downloads, queue and conflicts | FI-02 | Built |
| Inspection and commissioning forms | FI-03 | Built |
| Inspection review, defects and retests | FI-04 | Built |
| Site induction, risk and biosecurity | FI-05 | Built |
| Incidents and corrective actions | FI-06 | Built |
| Customer attendance and report response | FI-07 | Built |

### 4.9 Maintenance, warranty and equipment

| Page guide | Scope | Build state |
|---|---|---|
| Service agreements | MA-01 | Built |
| Coverage and entitlement | MA-02 | Built |
| Maintenance plans | MA-03 | Built |
| Due maintenance | MA-04 | Built |
| Renewals and relationship review | MA-05 | Built |
| Warranty cases | MA-06 | Built |
| Supplier recovery | MA-07 | Built |
| Installed base and equipment workspace | EQ-01 | Built |
| Identifying equipment | EQ-02 | Built |
| Configuration succession | EQ-03 | Built |
| Movement, replacement and retirement | EQ-04 | Built |
| Equipment documents and service timeline | EQ-05 | Built |
| Service bulletins | EQ-06 | Built |
| Support lifecycle and obsolescence | EQ-07 | Built |
| Configuration backups and recovery evidence | EQ-08 | Built |
| Test instruments and calibration | EQ-09 | Built |

### 4.10 Supply chain

| Page guide | Scope | Build state |
|---|---|---|
| Material demand and readiness | SC-01 | Built |
| Purchasing and supplier commitments | SC-02 | Built |
| Inbound shipments | SC-03 | Built |
| Receiving and inspection | SC-04 | Built |
| Stock and reservations | SC-05 | Built |
| Picking and dispatch | SC-06 | Built |
| Customer deliveries | SC-07 | Built |
| Returns and claims | SC-08 | Built |
| Material change-impact review | SC-09 | Built |
| Service stock custody | SC-10 | Built |

### 4.11 Workshop

| Page guide | Scope | Build state |
|---|---|---|
| Workshop builds | CX-02 | Not built |
| Kitting and controller preparation | CX-02/kitting | Not built |
| Bench testing and returned units | CX-02/bench-testing | Not built |

### 4.12 Finance

| Page guide | Scope | Build state |
|---|---|---|
| Finance workspace and service handoffs | FN-01 | Partly built |
| Customer accounts | FN-02 | Partly built |
| Project financial performance | FN-03 | Not built |
| Milestone claims and commercial obligations | FN-04 | Not built |
| Cash timing and commercial outlook | FN-05 | Not built |
| Financial measure definitions and reconciliation | FN-06 | Not built |

### 4.13 Email, calendar and documents

| Page guide | Scope | Build state |
|---|---|---|
| Emails: connected inbox and record linking | EC-01 | Partly built |
| Mailbox connection and synchronisation | EC-02 | Not built |
| Calendar and activities | EC-03 | Partly built |
| Drafts, approval and delivery of messages | EC-04 | Not built |
| Document register and library | DK-01 | Not built |
| Document viewer, revisions and review | DK-02 | Partly built |
| Output, issue and distribution | DK-03 | Partly built |
| Knowledge search and articles | DK-04 | Not built |
| Knowledge authoring and review | DK-05 | Not built |

### 4.14 Conversations and the assistant

| Page guide | Scope | Build state |
|---|---|---|
| Conversations | — (route `/conversations`) | Built |
| Assistant workspace and docked conversation | AI-01 | Not built |
| Reviewing assistant proposals | AI-02 | Not built |
| Checking sources and evidence | AI-03 | Not built |
| Assisted drafting | AI-04 | Not built |
| Voice capture and transcripts | AI-05 | Not built |
| Recurring checks and automations | AI-07 | Not built |

### 4.15 Reports

| Page guide | Scope | Build state |
|---|---|---|
| Management overview and report catalogue | RP-01 | Not built |
| Sales and quotation performance | RP-02 | Not built |
| Engineering and project delivery performance | RP-03 | Not built |
| Service, maintenance and resource performance | RP-04 | Not built |
| Supply and Finance exceptions | RP-05 | Not built |
| Report definitions, saved views and scheduled reviews | RP-06 | Not built |

### 4.16 Conditional modules

Written only if Dean adopts them. They stay in the register as conditional scopes (WS-D1).

| Page guide | Scope | Build state |
|---|---|---|
| Company tools, loan units and calibration | CX-01 | Conditional |
| Remote monitoring and alarm review | CX-03 | Conditional |
| Advanced customer training and subscriptions | CX-04 | Conditional |
| Grower production and traceability | CX-05 | Conditional |
| Water and energy improvement review | CX-06 | Conditional |

## Part 5. Tasks and procedures

A task index, not new content. Kind: How-to. Each entry links to the page guide section that explains the task, and to the approved SharePoint SOP where one exists. Where none is linked, it says "No approved SOP linked yet", as the contextual help design (PPO-HELP-DES, section 4.1) allows. The index is built from the published page guides' task sections, grouped as:

1. Finding and opening records
2. Creating and updating records
3. Next actions, activities and follow-up
4. Handing over and receiving work
5. Reviewing and approving
6. Issuing quotations, reports and documents
7. Working on site and offline
8. Changing your own settings

## Part 6. Administration

For administrators and access approvers. Kind: How-to and reference.

| Page guide | Scope | Build state |
|---|---|---|
| Users, roles, teams and access review | AD-01 | Partly built |
| Settings hub and business configuration | AD-02 | Not built (design lock-in is in open PR #670) |
| My account and preferences | — ([WS-D7](../decisions/workshop-settings-preferences-scope.md)) | Not built |
| Data-quality workbench | AD-03 | Not built |
| Integration health and exception recovery | AD-04 | Partly built |
| External mapping and reconciliation | AD-05 | Not built |
| Migration, coexistence and cutover | AD-06 | Not built |
| Audit history and controlled export | AD-07 | Partly built |
| Retention and information lifecycle | AD-08 | Not built |
| Operational health, recovery and release readiness | AD-09 | Partly built |
| Document and form templates | DK-06 | Not built |
| Assistant settings and quality review | AI-06 | Not built |

## Part 7. Reference

Kind: Reference.

| Chapter | Contents |
|---|---|
| 7.1 Glossary and terminology | Every business term used on screen, with the PPO terminology sheet (direction paper, section 8) |
| 7.2 Statuses | Every record status by module: what it means, how it is reached and what comes next |
| 7.3 Record numbers | Number formats by record type |
| 7.4 Capabilities and access | What each capability allows, taken from the capability catalogue; job-function bundles once D-020 roles are adopted |
| 7.5 Keyboard shortcuts | All shortcuts in one place |
| 7.6 Phone and offline support | Which pages work on a phone and which work offline |
| 7.7 Systems Powerplants One works with | What each connected system owns, and what moves between them |

## Part 8. Troubleshooting

Kind: How-to. Each chapter: the symptom you see, what it means, the safe thing to do, and who to ask.

| Chapter | Covers |
|---|---|
| 8.1 A page or record is missing or refused | Access, company and site scope |
| 8.2 "Could not confirm" and uncertain saves | Checking the result before trying again |
| 8.3 Someone else changed the record | Stale revisions and how to reload safely |
| 8.4 Offline queue and conflicts | Field work when the connection returns (FI-02) |
| 8.5 Email and calendar connection problems | Mailbox synchronisation (EC-02) |
| 8.6 Integration exceptions | Records that did not reach MYOB Acumatica or another system (AD-04) |
| 8.7 Getting support | Who to contact, what to include, and how to report a guide error |

## Part 9. What's new

One page per release, newest first: new pages, changed workflows, and guide chapters added or changed. Kind: Reference. Scope: AD-10 (not built). The onboarding path for each job function (AD-10) links from here and from part 1.

## Outside this guide

- **The customer guide.** The customer portal (CP-01, CP-02, CP-03, CP-04, CP-05 and CP-06, none built) gets its own guide, for customers, when the portal is built. Its readers, permissions and wording differ from the staff guide.
- **The development pages.** These sit under `/development`: the page register, design system and component preview. They are design-workspace tools documented in `docs/design/development/README.md`, not in the user guide.
- **SOPs.** Business procedures stay in SharePoint. The guide links to them and never copies them.
