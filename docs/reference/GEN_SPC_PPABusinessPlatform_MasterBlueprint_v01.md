# Powerplants Business Operations Platform

## Master Business & Build Blueprint v01

**Discovery and Design Baseline — For Business Review**

| Document control | Value |
|---|---|
| Prepared for | Powerplants Australia |
| Requested by | Dean Fiedler |
| Document reference | GEN_SPC_PPABusinessPlatform_MasterBlueprint_v01 |
| Version and date | v01 — 4 September 2026 |
| Document status | Draft target-state blueprint; business and technical approval not yet recorded |
| Authoring basis | User requirements, supplied CREMS materials, prior read-only account observations and selected official sources |
| Intended audience | Executive sponsor, departmental process owners, product owner, solution architect, delivery partners and acceptance reviewers |
| Handling | Recommended internal distribution; contains business-system design information |
| Programme reference | Not assigned. GEN is used provisionally; do not reuse SOL008, which identifies the existing PPA Delivery System work |
| Supersedes | None. This is a new programme blueprint; it does not supersede the CREMS current-state specification |
| Authorisation represented | Preparation of this Markdown document only |

> **Decision requested:** Review and agree the business direction, operating responsibilities, scope boundaries and discovery priorities in this blueprint. Approval of the document does not authorise production deployment, migration, financial transactions, organisational restructuring or supplier commitments.
>
> **Reading rule:** Unless explicitly identified as a user-confirmed intention or a source observation, the architecture, workflows, requirements, priorities and targets below are proposals for the future platform. They are not claims about existing production functionality.

---

## Contents

1. [Executive direction](#01-executive-direction)
2. [Document purpose and governance](#02-document-purpose-and-governance)
3. [Evidence baseline and current-state interpretation](#03-evidence-baseline-and-current-state-interpretation)
4. [Business scope and design principles](#04-business-scope-and-design-principles)
5. [Operating model and accountability](#05-operating-model-and-accountability)
6. [End-to-end business journeys](#06-end-to-end-business-journeys)
7. [Shared information model and ownership](#07-shared-information-model-and-ownership)
8. [Conceptual platform architecture](#08-conceptual-platform-architecture)
9. [CRM capability blueprint](#09-crm-capability-blueprint)
10. [Estimating and quotation capability blueprint](#10-estimating-and-quotation-capability-blueprint)
11. [Engineering and design control capability blueprint](#11-engineering-and-design-control-capability-blueprint)
12. [Projects and commercial delivery capability blueprint](#12-projects-and-commercial-delivery-capability-blueprint)
13. [Service operations capability blueprint](#13-service-operations-capability-blueprint)
14. [Supply chain capability blueprint](#14-supply-chain-capability-blueprint)
15. [Finance and commercial controls capability blueprint](#15-finance-and-commercial-controls-capability-blueprint)
16. [Documents, knowledge and communications](#16-documents-knowledge-and-communications)
17. [Company-wide assurance and supporting functions](#17-company-wide-assurance-and-supporting-functions)
18. [Cross-module business-rule register](#18-cross-module-business-rule-register)
19. [Integration and update behaviour](#19-integration-and-update-behaviour)
20. [User experience and screen families](#20-user-experience-and-screen-families)
21. [Security and non-functional requirements](#21-security-and-non-functional-requirements)
22. [Business outcomes and measure dictionary](#22-business-outcomes-and-measure-dictionary)
23. [Controlled blueprint and specification set](#23-controlled-blueprint-and-specification-set)
24. [Delivery strategy and release sequence](#24-delivery-strategy-and-release-sequence)
25. [Proposed first operational release](#25-proposed-first-operational-release)
26. [Acceptance and assurance catalogue](#26-acceptance-and-assurance-catalogue)
27. [Migration, coexistence and cutover](#27-migration-coexistence-and-cutover)
28. [Delivery team, commercial evaluation and operations](#28-delivery-team-commercial-evaluation-and-operations)
29. [Decisions, assumptions and programme risks](#29-decisions-assumptions-and-programme-risks)
30. [Immediate work packages and review decision](#30-immediate-work-packages-and-review-decision)

Appendices: [A — Sources](#appendix-a--source-and-evidence-register) · [B — Traceability](#appendix-b--requirement-to-source-and-acceptance-traceability) · [C — Glossary](#appendix-c--controlled-business-glossary) · [D — Document assurance](#appendix-d--document-assurance-and-review-record)

---

## 01. Executive direction

### 1.1 Recommended outcome

Powerplants should develop a connected business operations platform supporting the lifecycle of a horticultural customer, facility and equipment installation: enquiry, commercial qualification, technical scoping, estimating, quotation, engineering, procurement, project delivery, commissioning, handover and ongoing service.

The proposed web application provides a consistent working environment across these activities. MYOB Acumatica remains the authoritative ERP. SharePoint remains the controlled business-document repository. Engineers continue to author designs in suitable CAD tools.

The platform should support ordinary product transactions and service visits as efficiently as it supports complex greenhouse projects. Professionalism is defined by usable workflows, reliable information, clear authority, traceable decisions and sustainable operation, as well as visual quality.

### 1.2 Business priorities

| Priority | Business outcome | Initial evidence of improvement |
|---|---|---|
| Prepared field work | Technicians receive an issued job pack and relevant history before attendance | Pack readiness, acknowledgement and dispatch-exception measures |
| Reliable scheduling | Service can see availability, rearrange appointments and identify consequences | Conflicts detected, changes acknowledged and fewer avoidable booking failures |
| Preserved customer context | Staff can identify the customer, actual site, equipment and previous work | Correct record linkage and reduced searching/re-entry |
| Commercial control | Accepted scope, pricing and subsequent changes remain traceable | Approved variations, preserved baselines and reconciled ERP references |
| Controlled delivery | Engineering, procurement, installation and commissioning dependencies are visible | Evidence-backed readiness and staged acceptance |
| Financial confidence | Users see appropriately reconciled account and project measures | Defined measures, source dates and exception visibility |
| Sustainable ownership | Powerplants can support, secure and improve the platform | Named owners, tested recovery and maintained documentation |

These are intended outcomes. Baseline performance and quantitative improvement targets are not yet established.

### 1.3 Immediate recommendation

Complete bounded discovery and validate the highest-risk assumptions before committing to a production architecture or a full replacement programme. Prepare first-pass specifications for all seven business modules; deepen the first-release specifications only after shared responsibilities and integration boundaries are agreed.

The provisional first operational release is the customer/site/equipment foundation plus a complete planned service-visit workflow. This is a recommended starting point because the user has identified concrete service problems. It is not an approved delivery commitment and must pass the release-selection process in Section 24.

### 1.4 Decisions deliberately not made in v01

- No development supplier, budget, contract, delivery date or technology stack has been selected.
- No production API, security role, accounting rule or CAD integration has been verified.
- No company reporting line or delegated financial authority has been approved.
- No existing application has been approved for retirement.
- No proposed module is assumed to require its own application, database or microservice.
- No statutory compliance, technical certification or production-readiness determination is made by this document.

---

## 02. Document purpose and governance

### 2.1 Purpose

This blueprint creates the common business and build baseline for the future programme. It is suitable for stakeholder review, discovery planning, architecture options, module scoping, delivery-partner briefing and initial acceptance planning.

It is not a physical database schema, final API contract, complete screen specification, employment structure, signed business case or production implementation manual. Those outputs depend on decisions recorded in Section 29.

### 2.2 Evidence labels

| Label | Meaning | Treatment |
|---|---|---|
| UC — User-confirmed intention or issue | Expressly stated in this conversation | Preserve as a business input; it does not prove technical implementation |
| DG — Documented guide behaviour | Described in the supplied CREMS guide | Validate before relying on it for a replacement |
| PO — Prior observation | Observed in an earlier read-only sample in this conversation | Scope- and time-limited; do not extrapolate to the whole organisation |
| ER — External reference | Official/public documentation supporting a design consideration | Does not prove Powerplants licensing, configuration or adoption |
| PR — Proposed requirement or design | Recommended future behaviour | Requires business/technical review at the applicable gate |
| UQ — Unresolved question | Missing fact, policy, threshold or decision | Keep visible with an owner role and closure evidence |

UC, DG and PO are different kinds of evidence. Agreement with a business objective does not approve a database design; a guide statement does not establish that a live integration currently works.

### 2.3 Requirement language

“Shall” in the controlled requirement and rule registers means a proposed acceptance obligation if that capability enters an approved release. “Should” is a recommendation; “may” is optional. Until approval, all new requirement rows are PR.

Requirement IDs belong to this blueprint and are not ERP references. Their families are CRM, EST, ENG, PRJ, SVC, SCM, FIN, DOC and NFR. BR identifies shared business rules; IF identifies integration contracts; AT identifies acceptance scenarios; KPI identifies measures; D identifies open decisions; R identifies programme risks.

IDs remain stable when wording is refined. Withdrawn entries are marked withdrawn with a reason rather than silently renumbered.

### 2.4 Document precedence

For target-state requirements, the approved master scope and decision register take precedence over module proposals. Module specifications add detail within those boundaries. Accepted architecture decisions govern technical implementation. Tests provide evidence of conformity; they do not silently redefine requirements.

The CREMS v05 specification remains a separate guide-derived current-state reference. Its assumptions, proposed enhancements and legacy constraints must not be imported as approved future requirements without review.

### 2.5 Change control

Every material scope or policy change records the reason, affected requirements, data/integration effects, delivery and support impact, decision owner and approval. Changes to security, money, ERP writes, issued documents and booking authority require explicit impact review.

Editorial corrections may be bundled. New versions should be driven by new evidence or decisions, not repeated expansion for its own sake.

---

## 03. Evidence baseline and current-state interpretation

### 3.1 What is established

The user has confirmed that Powerplants:

- sells products and services for commercial horticulture and delivers large greenhouse-related projects;
- uses CREMS for pre-order commercial work, Pipedrive for CRM and Smartsheet for project tracking;
- intends to retain MYOB Acumatica as the main ERP and SharePoint for documents;
- has Sales/Commercial, Estimating, Projects, Engineering, Service, and inventory/purchasing/shipping responsibilities;
- needs better issued job packs, visual technician scheduling and contextual service history;
- wants a professional, integrated web application with substantially stronger CRM capabilities.

These statements are UC inputs, not an approved organisation chart.

Powerplants’ professional-services page describes feasibility, design, engineering and project management, including involvement in horticultural developments valued from $2 million to over $40 million. Those are development values, not verified Powerplants contract values. [Powerplants Professional Services](https://powerplants.com.au/products/Professional-Services/) [SRC-06]

### 3.2 CREMS evidence to retain

The guide, stated accurate as of 1 September 2026, describes a controlled enquiry-to-order process with routing, technical questionnaires, estimate and quote versions, approvals, specialised Screen Systems configuration and MYOB conversion. [SRC-02]

For v01, the following concepts are important candidates for preservation:

- different routes for Project, Sales Order and Service Order work;
- separate opportunity, option, estimation revision, estimate and quotation concepts;
- versioned questionnaire definitions and captured answers;
- staged editing, explicit save/discard and locked commercial snapshots;
- catalogue, supplier cost, currency and pricing provenance;
- one-off item resolution before external conversion;
- recorded approval and customer-response evidence;
- recovery when one part of an external conversion succeeds and a later step fails.

The guide’s introductory “three write moments” is a simplified lifecycle explanation. Its detailed master-data and item-resolution behaviour, also discussed in the v05 report, identifies additional ERP writes. The future interface catalogue must enumerate every operation; it must not assume that only three writes exist. [SRC-02; SRC-03, Section 22]

The documented use of a prepayment answer in CREMS routing is not evidence that a deposit has been received or configured in MYOB.

### 3.3 Earlier Pipedrive and Smartsheet observations

Earlier in this conversation, a read-only review inspected Pipedrive stages and a sample of 60 recently updated open deals. Examples included maintenance agreements, controls upgrades, automation and new-facility enquiries. This supports varied work types; it is not a complete feature inventory or a statement of total pipeline size. [SRC-04]

The Smartsheet review inspected the PPA Project Delivery System prototype structure and representative sheets. It found design foundations for project tiers, readiness, deliverables, service intake, competency profiles and finance reconciliation. Some records were explicitly templates, synthetic profiles or migrated historical information. [SRC-05]

These accounts have not been re-audited for this document. No live portfolio count, financial total, schedule reliability score or production-adoption claim is asserted here.

### 3.4 Review performed for this edition

This edition rechecked the supplied DOCX’s opening purpose and relevant content, the guide chapter index, existing source extracts, selected routing/update sections of the v05 report and the existing v05 assurance report. Selected official web sources were also reviewed. It did not repeat the earlier report’s full page-by-page source audit.

The three supplied guide formats represent the same source baseline; they are not three independent confirmations. The prior audit’s conclusion is historical evidence about that report, not certification of the new platform.

### 3.5 Critical missing evidence

Before implementation, obtain the current CREMS solution/configuration exports, calculation and questionnaire rules, actual MYOB endpoints and transaction examples, approved pricing policies, current document templates, SharePoint configuration, CAD file-management details, operating procedures, real device/connectivity information, permissions and financial measure definitions.

Detailed ownership and closure requirements appear in D-001 to D-028.

---

## 04. Business scope and design principles

### 4.1 Programme capability boundary

| Capability | Target treatment | Scope note |
|---|---|---|
| CRM and customer development | Core programme domain | Retain required Pipedrive outcomes; confirm detailed parity/migration needs |
| Estimating and quotations | Core programme domain | Preserve validated CREMS strengths and improve identified workflow gaps |
| Engineering and design control | Core programme domain | Coordinate design work and releases; retain specialist authoring tools |
| Project and commercial delivery | Core programme domain | Proportionate controls for upgrades and major projects |
| Service operations | Core programme domain; first-release candidate | Includes planned and reactive work, job packs, scheduling and history |
| Supply chain coordination | Core programme domain | Integrate with authoritative ERP purchasing and stock |
| Finance visibility and controls | Core programme domain | ERP-backed transactions, definitions and controlled operational forecasts |
| Documents, search, tasks, approvals and notifications | Shared foundation | One coherent user experience with role-appropriate views |
| QHSE, competencies and biosecurity | Shared operational controls | Depth depends on actual activities and jurisdiction |
| Customer/partner portals | Later candidate | Requires external-identity and information-release design |
| Workshop/production and fleet/tool management | Conditional | Confirm business need and existing MYOB capability |
| Telemetry, remote alarms and AI assistance | Later candidate | Separate business case, access controls and supported interfaces |
| Full payroll/HR replacement, CAD editor, ERP ledger replacement | Excluded from initial programme scope | Integrate or retain appropriate systems |
| Autonomous customer-equipment control | Excluded from initial scope | Any later proposal requires a separate approved safety/security design |

### 4.2 Design principles

1. **Business outcomes first.** Each release solves a complete, measurable workflow.
2. **One authoritative owner per information element.** Domain-specific views may differ; ownership and update rights are explicit.
3. **Connected records.** Use stable references across customer, site, asset, commercial and operational records.
4. **Proportionate controls.** Apply complexity, risk and contractual criteria rather than a single financial threshold.
5. **Preserved commitments.** New prices, drawings and forecasts do not silently change previously approved or issued records.
6. **Visible exceptions.** Missing, stale, blocked, failed and unknown are meaningful states; they are not green or zero.
7. **Controlled actions.** Authority is checked for the particular record, action and state.
8. **Usable field experience.** Technicians can prepare, act and record with minimal avoidable re-entry.
9. **Supportable design.** Powerplants retains practical control of code, configuration, data and operational knowledge.
10. **Evidence before retirement.** Existing systems remain available until their replacement scope is accepted and reconciled.

### 4.3 Build, configure, integrate or retain

Each capability receives a documented option assessment. A common user experience may be achieved through custom development, supported MYOB configuration, integration or temporary retention. A full clone of every Pipedrive or Smartsheet feature is not presumed.

Compare functional fit, interface maturity, mobile suitability, security, licensing, delivery risk, whole-of-life cost, data portability and maintainability. Weighted scoring may be used after stakeholders agree the weights; scores must not conceal a disqualifying control failure.

---

## 05. Operating model and accountability

### 5.1 Proposed functional grouping

| Group | Functions | Boundaries |
|---|---|---|
| Commercial & Customer Growth | Sales & Customer Experience; Estimating & Commercial Management | Relationship ownership, qualification, pricing and commercial commitments |
| Engineering & Project Delivery | Engineering & Design; Projects & Delivery, including PMO capability | Technical authority, delivery coordination, project controls and handover |
| Supply Chain & Service Operations | Procurement, Inventory & Logistics; Service Operations & Technical Support | Materials, fulfilment, dispatch, technical support and aftercare |
| Corporate Services & Assurance | Finance & Business Performance; People & Culture; Digital Systems & Data; QHSE | Financial control, capability, systems and company-wide assurance |

This is a proposed allocation of functions. Headcount, reporting lines and job titles remain D-001/D-002 decisions. QHSE requires cross-company reach and direct executive escalation. Strategy is an executive responsibility informed by all functions.

### 5.2 Decision ownership

| Decision | Proposed accountable role | Required contributions/evidence |
|---|---|---|
| Customer relationship and opportunity qualification | Sales/account owner | Customer context and qualification evidence |
| Estimate completeness and cost basis | Estimating lead | Engineering input, supplier evidence and pricing policy |
| Price/contract exception | Delegated commercial approver | Estimating, Finance and delivery impact; authority limits |
| Technical design release | Engineering authority | Review record, defined scope and relevant competent specialists |
| Project scope, plan and handover coordination | Project Manager | Commercial baseline, readiness and acceptance evidence |
| Confirmed technician booking | Service scheduling authority | Availability, skills, travel, readiness and customer arrangements |
| Stock allocation and purchase execution | Supply Chain authority | Approved demand and current ERP information |
| Accounting treatment, invoice release and credits | Finance authority | Authorised transaction and supporting evidence |
| Service case ownership and follow-up | Service case/work-order owner | Symptoms, response commitments and outstanding actions |
| Permission or integration configuration | Designated systems owner | Data-owner authorisation, security review and audit |
| Release to production | Executive/product release authority | Acceptance, support, recovery and cutover evidence |

These process accountabilities do not transfer legal duties or override existing delegations. Names, deputies, thresholds and separation requirements must be confirmed.

### 5.3 Important cross-functional boundaries

- Sales retains the overall account relationship; Projects owns project communications; Service owns case and visit communications.
- Projects requests technician demand. Service owns the confirmed field schedule. Disputes over priorities escalate to a named operational authority.
- For commissioning, Projects coordinates delivery; Engineering approves technical criteria and reviews results; qualified personnel perform the work; Service accepts the support handover.
- Engineering assesses design changes; commercial authority approves commercial commitments; Finance determines accounting treatment.
- Supply Chain administers supplier returns/recovery; Service maintains the customer case; Finance controls credits and financial settlement.
- Business owners govern data meaning and authorised use. IT support does not automatically acquire authority to approve commercial or technical work.

### 5.4 Programme roles

Appoint an executive sponsor, product owner, process owners, solution architect, integration/data owners, acceptance lead and ongoing support owner. Dean Fiedler is the requester and proposed review coordinator; no company-wide executive delegation is inferred from that role.

The operating-model review should resolve deputies and urgent exceptions as well as ordinary approvals. A process must remain workable during leave or an incident.

---

## 06. End-to-end business journeys

### 6.1 Classification

Classify an enquiry by uncertainty, design effort, delivery complexity, labour, customer operating risk and contractual obligations. A commercial project class is distinct from the ERP document type and the current execution stage.

The existing CREMS route rules are DG evidence. Their adoption or amendment must be decided explicitly. Avoid choosing a new ERP target purely to make the interface easier.

### 6.2 Journey J-01 — Product and spare-parts sale

| Element | Target behaviour |
|---|---|
| Entry | Enquiry from an existing or prospective customer |
| Preparation | Resolve legal account, delivery site, item compatibility, quantity, price, tax basis and lead-time evidence |
| Commitment | Record accepted offer/order instructions and required financial clearance |
| Execution | Approved ERP sales-order process, supply allocation, dispatch and delivery tracking |
| Completion | Delivery/exception evidence and appropriate ERP invoice/payment visibility |
| Exceptions | Wrong item, partial delivery, backorder, cancellation, return, price revision or customer-account mismatch |
| Core rule | A forecast or quotation does not reserve stock, create a purchase commitment or establish payment receipt |

### 6.3 Journey J-02 — Planned or reactive service

| Element | Target behaviour |
|---|---|
| Entry | Support request, recurring maintenance occurrence or approved project service demand |
| Preparation | Triage issue, identify site/assets, confirm scope, coverage, urgency and work-order authority |
| Dispatch | Ready check, appointment, technician assignment and issued/acknowledged job pack |
| Execution | Travel/work entries, findings, inspections, parts, photos and required technical escalation |
| Completion | Customer acknowledgement, reviewed service report, follow-up and approved financial handoff |
| Exceptions | No access, unsafe conditions, failed repair, missing parts, extended work, declined sign-off or offline changes |
| Core rule | A ticket, work order and appointment are separate records; one visit can finish while the overall work remains open |

A critical breakdown uses the same evidence model with an authorised urgent pathway. It does not bypass mandatory safety controls or invent customer approval.

### 6.4 Journey J-03 — Equipment upgrade or retrofit

| Element | Target behaviour |
|---|---|
| Entry | Customer need, service recommendation or equipment lifecycle review |
| Preparation | Existing configuration, survey, compatibility, operating restrictions and options |
| Commitment | Approved estimate, accepted quotation and frozen commercial/design assumptions |
| Execution | Engineering package, approved materials, coordinated attendance and controlled configuration change |
| Completion | Tests, as-built updates, software/configuration backup where relevant and service handover |
| Exceptions | Undocumented existing condition, incompatibility, changed customer requirement or interrupted shutdown |
| Core rule | The existing installed configuration and the proposed configuration remain distinguishable |

### 6.5 Journey J-04 — Major greenhouse project

| Element | Target behaviour |
|---|---|
| Entry | Qualified development opportunity or tender |
| Preparation | Feasibility, client brief, business-case assumptions, tender obligations and bid/no-bid decision |
| Commitment | Accepted scope, contractual responsibilities, design basis and authorised delivery baseline |
| Execution | Work packages, design releases, supplier interfaces, procurement, logistics, site readiness and construction coordination |
| Acceptance | Package-specific testing, defect treatment, training and staged customer handover |
| Closeout | Final commercial review, controlled document set, assets, warranty triggers, support ownership and lessons learned |
| Exceptions | Variations, supplier delays, incomplete interfaces, phased operation, disputed acceptance and unconfirmed financial definitions |
| Core rule | A single “complete” percentage cannot substitute for technical acceptance, customer acceptance or commercial closure |

### 6.6 Journey J-05 — Warranty, return or supplier recovery

| Element | Target behaviour |
|---|---|
| Entry | Fault against identifiable equipment or supplied goods |
| Assessment | Confirm purchase/installation evidence, applicable terms, symptoms and cause status |
| Resolution | Authorised repair, return, replacement, loan equipment or further investigation |
| Commercial treatment | Separate customer resolution from supplier claim and any Finance-controlled credit |
| Completion | Customer communication, asset-history update and settlement/recovery status |
| Exceptions | Coverage disputed, no fault found, supplier rejection, replacement before settlement or missing serial number |
| Core rule | Customer goodwill, supplier recovery and warranty entitlement are separate decisions |

### 6.7 Mandatory handover contract

Every handover identifies the source/version, receiving owner, authorised scope, required evidence, open issues, requested dates and acceptance/rejection outcome. “Sent” or “assigned” alone does not prove acceptance.

---

## 07. Shared information model and ownership

### 7.1 Key distinctions

Customer group, legal debtor, site operator and delivery contact can differ. A physical site can contain greenhouses, blocks, functional systems and individual assets. One project can span sites; one site can have many projects and service histories.

Use a shared identity map with domain-specific records. Do not force all business concepts into one universal customer or job table.

### 7.2 Proposed authority matrix

| Information | Proposed authority | Web-platform treatment |
|---|---|---|
| Unqualified prospects and relationship activities | CRM platform, or Pipedrive during coexistence | One writable owner in each migration phase |
| ERP customer accounts, account status and financial terms | MYOB | Read with provenance; approved master-change requests only |
| Relationship contacts and stakeholder roles | CRM domain | Map shared fields explicitly to ERP contacts; prevent competing updates |
| Operational sites, facility areas and assets | Confirm per entity under D-011 | Link ERP locations and any existing equipment records; nominate an owner before production |
| Product codes, units, stock and ERP purchasing records | MYOB | Reference and coordinate; no independent authoritative stock balance |
| Product technical attributes and approved compatibility | Engineering/product owner | Versioned enrichment linked to ERP items |
| Opportunity, estimate and quote records | Current system until approved cutover; future commercial domain thereafter | Stable source links, versions and ERP mappings |
| Project financial master and posted costs/revenue | MYOB | Operational schedule and forecast fields have separately defined owners |
| Design models and native CAD relationships | Supported CAD/design-management environment | Reference controlled sources and published outputs |
| Document file content and controlled published outputs | SharePoint, subject to validated CAD storage exceptions | Metadata, relationships and issue records in the platform |
| Service orders and equipment master, if already managed in ERP | D-007/D-011 decision | Map or extend the chosen authority; avoid duplicate editable service masters |
| Appointments and dispatch | Selected scheduling authority/system | Requests from Projects; confirmed bookings under Service control |
| Actual time and parts submissions | Field capture followed by authorised review | Separate captured, approved and ERP-posted states |
| Invoices, payments, credits, deposits and ledger | MYOB | Role-sensitive visibility and reconciliation; no local accounting override |
| Identity and workforce administration | Existing approved identity/HR systems | Integrate appropriate roles, availability and competency evidence |

“MYOB is the main source of truth” does not require every technical note or design workflow to be stored in MYOB. It requires precise ownership and faithful treatment of ERP-owned information.

### 7.3 Minimum logical record families

| Record family | Minimum business content | Relationships and safeguards |
|---|---|---|
| Organisation/account | Identifier, legal/trading names, company context, status | Parent group, ERP mapping and controlled duplicate resolution |
| Person/role | Identifier, contact methods, role, consent/communication settings | Organisation/site/deal roles and effective dates |
| Site/facility/area | Identifier, address/location, operator, access and operational context | Hierarchy without confusing billing address with work location |
| Asset/system | Identifier, model/serial where applicable, status, configuration | Site, parent system, service history and lifecycle dates |
| Opportunity/option | Pursuit, owner, stage, value basis, alternative option | One forecast treatment for mutually exclusive alternatives |
| Estimate/quote | Revision, line versions, assumptions, approvals and issue | Accepted snapshot, document evidence and ERP target |
| Project/work package | Scope, owner, dates, baseline, dependencies and status | Contract, engineering releases, purchasing and acceptance |
| Case/work order/appointment | Request, authorised scope, visit assignment and state | Separate identities; multiple visits/technicians/assets supported |
| Material demand/shipment | Item, quantity, unit, dates, origin and readiness | Line-level links to projects, service work and ERP transactions |
| Document/revision/issue | Stable file identity, revision, status, purpose and issue manifest | Exact versions and permitted recipients |
| Financial reference/forecast | Source record, company, currency, date, definition and status | Actual/commitment/forecast separation and reconciliation |
| Decision/action/audit event | Actor, time, purpose, outcome and affected record/version | Immutable evidence for material changes; controlled corrections |

Physical names, keys, optional fields and retention periods belong in the architecture and module dictionaries.

### 7.4 Identity and quality controls

Carry internal stable IDs alongside human-readable business references. External mappings include source system, company/tenant, entity type, external ID and current mapping status. Never match financial records by customer name alone.

Required fields vary by lifecycle: a prospect may lack an ERP account, but an ERP order must resolve the correct company and customer. Track proposed, verified, disputed and unavailable information explicitly.

Record asset moves and configuration changes with effective dates. Preserve the historical site/configuration against which earlier work was performed.

---

## 08. Conceptual platform architecture

### 8.1 Logical structure

The architecture below describes responsibilities, not a selected technology or deployment topology.

~~~mermaid
flowchart TD
    U["Staff web and field workspace"] --> A["Identity and application access"]
    A --> B["Business modules and workflow"]
    B --> D["Operational records and audit"]
    B --> I["Integration and reconciliation"]
    I --> E["MYOB ERP"]
    I --> S["SharePoint documents"]
    I --> C["CAD and approved specialist systems"]
    I --> L["Pipedrive and Smartsheet transition"]
    E --> I
    S --> I
~~~

Connections represent controlled interfaces. They do not grant blanket bidirectional writes. The document-specific ownership matrix and approved IF contracts determine direction and authority.

### 8.2 Shared platform services

The target design should provide identity, record-level authorisation, search, task/action queues, workflow/approvals, document references, notification delivery, audit, configuration versioning, integrations and operational monitoring.

Search and notifications must respect the same permissions as the underlying records. Workflow states and financial totals must not be inferred solely by the browser.

### 8.3 Architecture decisions to evaluate

- A modular web application with explicit internal boundaries is a starting candidate; independently deployed services require a demonstrated reason.
- Evaluate the existing Microsoft environment, developer skills, support capacity, hosting constraints and licensing before selecting the stack.
- Validate mobile/offline needs on actual devices. A progressive web app or companion mobile approach may be needed; neither is assumed sufficient without testing.
- Use supported APIs and controlled integration identities. Do not bypass ERP business rules with direct database writes.
- Provide separate development, test and production environments; any operational pilot requires a controlled release.
- Keep configuration, questionnaire definitions, pricing policies and document templates versioned and deployable.

Microsoft’s architecture guidance recommends mapping business capabilities and their relationships before technology selection. This supports the discovery sequence; it does not mandate a microservices solution. [Domain analysis guidance](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis) [SRC-10]

### 8.4 Feasibility evidence before architecture approval

Demonstrate the difficult boundaries in a non-production environment after separate authorisation: a MYOB read and controlled transaction/recovery example; SharePoint access and exact-version retrieval; offline field capture and resynchronisation; concurrent booking changes; and a representative CAD link/publication workflow.

Document results, unsupported cases, licence dependencies, security assumptions and operating cost implications. A clickable HTML mock-up establishes interaction concepts only.

---

## 09. CRM capability blueprint

**Purpose:** build and maintain customer relationships while connecting commercial opportunities to actual facilities, equipment, projects and service.

**Proposed process owner:** Sales & Customer Experience. **Detailed specification:** BP-03.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| CRM-01 | Manage prospects, organisations, people, sites and stakeholder relationships | Distinguish customer group, legal account and site operator |
| CRM-02 | Manage qualified leads, opportunities, stages, next actions and close outcomes | Stages are defined and mapped; lost reasons and history retained |
| CRM-03 | Link calls, meetings, emails, notes, documents and tasks to appropriate records | Access, filing, deduplication and original message references controlled |
| CRM-04 | Support account plans, territory/sector segmentation, customer visits and follow-up | Include horticultural context and owner accountability |
| CRM-05 | Link alternatives, estimate revisions and orders to one commercial pursuit | Forecast rules prevent double counting mutually exclusive options |
| CRM-06 | Provide approved visibility of projects, service cases, assets and ERP account information | Financial and confidential notes restricted by role |
| CRM-07 | Manage post-delivery reviews, training follow-up, renewals and relevant growth actions | A service observation creates a reviewed opportunity, not an automatic customer commitment |
| CRM-08 | Preserve required Pipedrive capabilities and migration evidence | Complete a feature/data parity register before CRM cutover |

### 9.1 Pipedrive parity assessment

Classify every required feature as retain through integration, replace, improve, defer or retire by approval. Include pipelines, activities, automations, email/calendar behaviour, custom fields, filters, forecasting, permissions, reports, attachments, history and relevant add-ons.

“Same as Pipedrive” is a business aspiration until translated into testable features. The prior stage/deal sample does not establish complete parity requirements or account licensing.

### 9.2 Relationship and communication controls

Keep commercial promises, project updates and service responses in one linked history while preserving their owners. Capture consent and applicable communication preferences. Campaign tools must not turn access to customer records into permission to send marketing.

The initial service release may expose customer context without replacing Pipedrive lead management. A migration phase must nominate one writable owner for each CRM field family.

---

## 10. Estimating and quotation capability blueprint

**Purpose:** convert customer requirements into controlled, traceable commercial offers and appropriate ERP handovers.

**Proposed process owner:** Estimating & Commercial Management. **Detailed specification:** BP-04.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| EST-01 | Route work using approved scope, complexity and commercial rules | Validate existing CREMS routes; record policy version and rationale |
| EST-02 | Manage discovery, design basis, facilities, scope and versioned questionnaires | Required answers, assumptions, deferrals and approved overrides distinguishable |
| EST-03 | Manage options, revisions, estimates and quote versions | Preserve accepted versions and commercial lineage |
| EST-04 | Cost products, labour, freight, subcontractors and other permitted categories | Capture quantity, unit, source cost, currency, effective date and cost basis |
| EST-05 | Apply approved pricing, discount, margin and rounding rules | Margin and markup distinguished; no invented thresholds or hidden refresh |
| EST-06 | Preserve validated specialist configuration, including Screen Systems | Obtain formulas, ranges, parts mappings and reference cases before replacement |
| EST-07 | Route estimate and quote approvals separately where policy requires | Named authority, evidence, rejection, withdrawal and resubmission |
| EST-08 | Generate and issue controlled quotations, record customer response and prepare ERP conversion | Terms, scope and exact issued content preserved |
| EST-09 | Resolve one-off items and track conversion/reconciliation | Unknown external outcomes cannot trigger blind duplicate creation |

### 10.1 Calculation and configuration validation

Maintain a catalogue of formulas and their owners, inputs, units, precision, rounding sequence, version and reference examples. Imported catalogues, FX and supplier quotes need effective dates and provenance.

Screen Systems and questionnaire engines require their actual published definitions and representative accepted results. A user guide does not prove the hidden formula library. Build regression cases for configurations, exceptions, quantity changes, zero/invalid inputs and reruns before retiring the corresponding CREMS function.

### 10.2 Commercial baselines

Estimated cost, proposed selling price, approved price, quoted price and accepted contract value are distinct. New catalogue costs or FX comparisons are advisory until an authorised refresh/new revision is committed.

Technical assumptions and supplier allowances need expiry/review rules. A budgetary estimate or ROI scenario must be labelled separately from a firm offer.

### 10.3 Output and downstream handover

An accepted quote handover includes the exact version, authorised scope, exclusions, relevant site/assets, deliverables, material demand and contractual dates. The ERP conversion target follows validated route policy. Payment terms printed on a document do not establish ERP credit settings or paid deposits.

Post-award changes use the project/service variation process; they do not edit the historical accepted quotation.

---

## 11. Engineering and design control capability blueprint

**Purpose:** coordinate engineering work, technical decisions and released information throughout delivery and aftercare.

**Proposed process owner:** Engineering & Design. **Detailed specification:** BP-05.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| ENG-01 | Manage engineering requests, briefs, work packages and capacity | Requests identify authorised effort, owner, prerequisites and due dates |
| ENG-02 | Maintain requirements, design basis, assumptions and interface responsibilities | Open technical questions have owners and affected deliverables |
| ENG-03 | Maintain a drawing/document register linked to supported authoring systems | Native CAD relationships retained; no untested file relocation |
| ENG-04 | Manage reviews, comments, approvals, revisions and formal issues | File version, engineering revision, approval and issue purpose are separate |
| ENG-05 | Release design material requirements and approved substitutions | Map to ERP items/units without automatically purchasing |
| ENG-06 | Assess technical changes against scope, cost, delivery and installed configuration | Record impact, authority, affected recipients and any required retest |
| ENG-07 | Control commissioning criteria, as-built information and technical handover | Trace tested configuration, field redlines, approval and support references |

### 11.1 Drawing and issue control

The register identifies drawing number, title, project/work package, discipline, author, reviewer, revision, status, issue purpose, issue date, source file and superseded revision. Formal transmittals capture the exact files/revisions issued, recipient and purpose.

A working save in SharePoint is not automatically an engineering release. A drawing approved for review is not necessarily authorised for procurement or installation. Superseded information remains traceable and visibly unsuitable for current use.

### 11.2 CAD boundary

CAD package, version, file types, linked references, assemblies, external consultants and any PDM/vault solution remain unknown. Initial integration may consist of stable links and controlled published PDFs. Browser viewing, model comparison or automated material extraction requires separate validation.

Do not assume that storing native CAD files in an ordinary document library preserves their relationships. Where specialist storage is required, SharePoint holds appropriate controlled published outputs and references.

### 11.3 Technical authority

Specify who may author, review, release and amend each discipline’s deliverables. Specialist architectural or structural certification is included only where it is within the appointed scope and supported capability.

Field suggestions and marked-up drawings are proposed changes until reviewed. Service history should record the effective configuration and link to the approved technical record.

---

## 12. Projects and commercial delivery capability blueprint

**Purpose:** deliver approved work through controlled planning, engineering, materials, installation, acceptance and closeout.

**Proposed process owner:** Projects & Delivery. **Detailed specification:** BP-06.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| PRJ-01 | Initiate projects from authorised scope and apply a proportionate project class | Sales handover accepted by a named delivery owner |
| PRJ-02 | Manage work packages, milestones, predecessors, baselines and forecasts | Dependencies represent real relationships; baseline changes retain approval |
| PRJ-03 | Maintain RAID, decisions, actions and interface responsibilities | Risks, assumptions, issues and dependencies remain distinguishable |
| PRJ-04 | Coordinate engineering, procurement, site readiness and technician demand | Planned dates cannot silently override confirmed bookings |
| PRJ-05 | Control contract obligations, variations and customer commitments | Requested, priced, approved and disputed changes separated |
| PRJ-06 | Manage inspection/test plans, defects, retests and staged acceptance | Evidence relates to the tested package and revision |
| PRJ-07 | Produce approved stakeholder updates and delivery forecasts | Source dates, unresolved issues and distribution approval visible |
| PRJ-08 | Complete technical, commercial and service handover | Required documents, assets, training, support ownership and open issues accepted |

### 12.1 Planning and portfolio control

Support meaningful Gantt dependencies, working calendars, actual progress and forecast dates. Avoid a single rigid task chain for all project types. Resource demand includes engineering and other specialists as well as field technicians.

Portfolio forecasts distinguish sales probability, authorised backlog and confirmed operational bookings. Capacity planning must reflect skills, calendars and travel rather than only the number of assigned tasks.

Smartsheet’s prototype templates and controls are discovery inputs. Preserve approved intent while reassessing implementation suitability; do not copy every prototype sheet as a separate app table.

### 12.2 Contract and variation control

Maintain original and approved revised scope/value, change requests, notice dates, contractual responsibilities, supporting evidence and authorised commitments. Progress-claim milestones, retentions and securities are included only when relevant to the particular contract and reviewed by the appropriate specialists.

The Project Manager records delivery effects; commercial authority approves commitments; Finance governs financial recognition and ERP processing. Unapproved variations can be shown as exposure or scenarios, but not silently included as approved revenue.

### 12.3 Commissioning and handover

Acceptance is organised by package/system/area where appropriate. Record criteria, prerequisites, procedure version, test results, witnessing, exceptions, retest evidence and customer/internal acceptance separately.

Conditional handover may be permitted with authorised outstanding items, owners and dates. It cannot misrepresent a failed safety-critical test as passed or imply contractual acceptance beyond the recorded decision.

Technical completion, practical/customer acceptance, invoicing, payment and commercial closure are independent milestones with explicit relationships.

---

## 13. Service operations capability blueprint

**Purpose:** make every field visit prepared, schedulable, informed, recorded and connected to follow-up.

**Proposed process owner:** Service Operations & Technical Support. **Detailed specification:** BP-07.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| SVC-01 | Capture and triage tickets against customers, sites and assets | Reported symptom, urgency, customer impact and coverage recorded |
| SVC-02 | Manage authorised work orders separately from tickets and appointments | Multiple visits, technicians and affected assets supported |
| SVC-03 | Assemble, check, issue and acknowledge revision-controlled job packs | Readiness evidence precedes dispatch or an authorised exception |
| SVC-04 | Provide a visual drag-and-drop dispatch planner | Skills, availability, travel, readiness, crews and conflicts evaluated |
| SVC-05 | Control rescheduling and reassignment | Record changes/reasons, affected commitments and acknowledgement |
| SVC-06 | Present relevant site/asset history and technical context | Findings, suspected causes, unsuccessful fixes and open issues distinguishable |
| SVC-07 | Support appropriate offline preparation and field capture | Saved locally, queued, synchronised, failed and conflicted are visible states |
| SVC-08 | Capture time, travel, breaks, waiting and task labour | Planned, recorded, reviewed and billable time remain separate |
| SVC-09 | Record parts consumption, returns and further requirements | ERP posting and stock confirmation are separately evidenced |
| SVC-10 | Capture inspections, photos, readings, findings and service reports | Reported work is attributable to a visit, person and relevant asset |
| SVC-11 | Capture customer acknowledgement and exceptions | Exact report version; unavailable/declined/disputed pathways |
| SVC-12 | Manage recurring maintenance, warranty, renewals and follow-up | Coverage, recurrence rules and supplier recovery are explicit |

### 13.1 Ticket, work order and appointment

A ticket represents a request or issue. A work order authorises a defined scope. An appointment allocates attendance. An appointment can be cancelled without deleting the work order; a visit can complete without resolving the ticket.

The ERP’s existing service-order capability must be evaluated before selecting ownership. If MYOB is authoritative, the platform must link/extend that record rather than create a competing writable service master.

### 13.2 Minimum job pack

| Pack section | Required content or controlled exception |
|---|---|
| Identification | Work-order/appointment references, issue revision, site and assigned crew |
| Customer arrangements | Site contact, access instructions, agreed attendance window and permissions |
| Authorised scope | Tasks, expected outcomes, exclusions, spending/work limits and escalation contact |
| Equipment | Asset identity, model/serial where relevant and applicable configuration |
| History | Active issues, previous relevant work, findings, attempted fixes and pending advice |
| Technical information | Exact issued drawings, manuals, procedures and supporting photographs |
| Readiness | Parts/tools, collection arrangements, skills, site prerequisites and customer confirmation |
| Site controls | Relevant induction, safety, biosecurity and operating/shutdown requirements |
| Completion | Checklist, readings, tests, photographs, report and acknowledgement requirements |

Required content is driven by job type. An urgent exception records what is missing, who accepted the permitted exception, conditions and required follow-up. Mandatory safety controls cannot be waived through a general dispatch override.

### 13.3 Job-pack lifecycle

Draft → checked → issued → technician acknowledgement → use for the assigned visit. An amendment creates a new revision with a change summary and renewed acknowledgement where material.

Record prepared by, reviewed by, issue time, recipients, download status where measurable and acknowledgement. Opening a notification is not proof that the technician has read the changed scope.

### 13.4 Dispatch and rescheduling

Provide day/week/multi-week views, unassigned demand, technician rows, crew bookings, multi-day work, non-working time and customer windows. Filters may include region, skill, job type, project and readiness.

Before confirming a move, revalidate overlap, leave, skills/certification evidence, travel, parts, customer arrangements and dependent work. Record the booking version and reject conflicting concurrent edits.

Service owns confirmed bookings. A changed project date creates a rescheduling request or exception; it does not overwrite an appointment automatically. A customer-requested date, forecast date, tentative booking and confirmed appointment are distinct.

Urgent changes to disconnected technicians require direct contact and a recorded outcome. The planner must not assume instantaneous delivery to an offline device.

### 13.5 History and technical context

Show a concise “read before attending” view with links to original records. Preserve author/date, affected equipment, diagnosis confidence, work performed, unsuccessful attempts, replaced parts and unresolved items. Curated summaries and any later AI drafts must remain traceable to their source evidence.

Imported historical notes are labelled by source and verification status. Missing serial numbers or ambiguous customer matches go to review; they are not guessed.

### 13.6 Offline behaviour

The device downloads only authorised assigned work and selected related history. It records the pack revision and last successful synchronisation. Offline edits receive stable local operation identifiers and enter a visible upload queue.

On reconnect, permission, assignment and record-version checks run before acceptance. Conflicts preserve the technician’s input for review. Retried time/part/photo uploads must not duplicate records.

Cancellation and permission changes cannot be instantly enforced while a device is disconnected. Define cache expiry, managed-device controls and direct-contact procedures; validate their limits on real devices. A stale pack is never presented as verified current.

### 13.7 Completion and financial handoff

Technicians submit time, material use and findings. Reviewers approve corrections and billing classification. The customer acknowledges the presented report, with reservations recorded.

A signature does not automatically authorise extra charges, accept the whole project or establish technical correctness. After signature, material report edits create a new controlled version and appropriate acknowledgement process.

Financial processing occurs in MYOB under the approved workflow. The platform displays submission, review and external-processing status separately. An operationally complete visit may still await report review, parts reconciliation or follow-up.

### 13.8 Maintenance and response commitments

For recurring maintenance, specify the anchor date, interval, meter basis if used, next-due calculation, timezone, skipped/rescheduled occurrence treatment and duplicate prevention. Contract start, warranty start and equipment commissioning date may differ.

For response commitments, distinguish acknowledgement, response, attendance and resolution. Define business hours, holidays, severity, escalation and permitted pauses. No 24/7 service or guaranteed repair time is assumed.

---

## 14. Supply chain capability blueprint

**Purpose:** coordinate material demand, procurement and delivery readiness using authoritative ERP transactions.

**Proposed process owner:** Procurement, Inventory & Logistics. **Detailed specification:** BP-08.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| SCM-01 | Link forecast and approved demand to projects, orders and service work | Demand class and required-by date explicit |
| SCM-02 | Display ERP items, warehouses, availability and purchasing references | Stock meanings, source time and completeness visible |
| SCM-03 | Manage requisitions, approvals, supplier quotations and procurement exceptions | Approved demand does not bypass ERP purchase controls |
| SCM-04 | Track supplier commitments, manufacturing milestones and technical deliverables | Confirmed dates distinguishable from estimates |
| SCM-05 | Track inbound shipments and their line-level allocations | One shipment may serve many orders/projects; one order may use many shipments |
| SCM-06 | Coordinate receipt, inspection, shortages, damage, quarantine and partial delivery | Carrier arrival is not automatically ERP receipt or job readiness |
| SCM-07 | Coordinate picking, dispatch, delivery, returns and supplier claims | Actual ERP transaction outcome and proof/evidence linked |
| SCM-08 | Report material readiness and change impacts to delivery/service | Delays trigger review; they do not silently move confirmed bookings |

### 14.1 Inventory semantics

On hand, available, allocated/reserved, in transit, quarantined, picked, dispatched and ready for a particular job are separate states. A stock value without a warehouse, unit, source time and availability definition is insufficient for a commitment.

A requested reservation is not confirmed until the authoritative system accepts it. Revalidate at commit time to manage competing demand.

### 14.2 International procurement

Where applicable, capture supplier quotation validity, currency, stated freight/delivery terms, production readiness, shipment milestones, packed dimensions/weight, documentation and broker/forwarder references.

Estimated landed costs remain distinct from actual ERP costs and approved customer freight charges. Supplier delivery estimates must not become unconditional customer promises.

### 14.3 Material and design relationships

Keep estimated materials, released design requirements, procurement demand, purchased quantities and installed quantities distinguishable. Changes require quantity/unit mapping and approved substitutions.

Do not automatically purchase every component extracted from a drawing. Engineering release, procurement approval and financial authority remain separate.

### 14.4 Conditional workshop scope

If significant in-house assembly/fabrication is confirmed, assess production orders, released BOMs, work instructions, serialisation, testing, material consumption and rework against MYOB capabilities. This is conditional scope, not evidence that Powerplants currently operates a particular manufacturing process.

---

## 15. Finance and commercial controls capability blueprint

**Purpose:** provide dependable account/project visibility and controlled financial handoffs while preserving MYOB accounting authority.

**Proposed process owner:** Finance & Business Performance. **Detailed specification:** BP-09.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| FIN-01 | Display authorised customer-account transactions and balances | Company, currency, source time and completeness included |
| FIN-02 | Link invoices, payments, credits, deposits and applications | Invoice totals are not treated as open balances |
| FIN-03 | Support financial review of orders, work and commercial exceptions | Authority and ERP credit/payment status separately verified |
| FIN-04 | Display project budget, actuals, commitments and operational forecasts | Definitions prevent duplicated cost or unapproved revenue |
| FIN-05 | Coordinate milestone claim evidence, approved variations and relevant contract obligations | Finance controls ERP invoice/credit processing |
| FIN-06 | Reconcile imports, updates and dashboard measures | Failed/partial/outdated data cannot appear as a verified financial result |
| FIN-07 | Maintain financial measure definitions, currency and tax treatment | Definitions approved before financial dashboard acceptance |
| FIN-08 | Provide approved profitability, cash-timing and exception views | Forecast margin, accounting result, billing and cash distinguished |

### 15.1 Customer accounts

The initial account view should be read-only. Show document type, reference, original amount, outstanding amount, due date, currency, status and related applications where available. Exact fields and display semantics require endpoint validation.

Customer payments may settle multiple invoices; one invoice may have multiple applications. Credits, prepayments, reversals and unapplied amounts need separate treatment. A user must not be able to mark an ERP invoice paid in the platform.

### 15.2 Project performance

Define original budget, revised authorised budget, actual cost, open commitment, forecast remaining cost, billed amount, recognised revenue and cash collected individually.

An estimate at completion should use mutually exclusive components; remaining commitments must not be added again if already included in the remaining forecast. Define inclusion of tax, exchange effects, overhead, accruals and variations before producing margin percentages.

Profitability cannot be inferred by subtracting supplier invoices from customer invoices without an approved accounting/forecast definition. No historical financial totals are asserted in this blueprint.

### 15.3 Financial and operational authority

Finance governs the meaning of financial fields and posting decisions. Project Managers and Service reviewers contribute delivery progress, expected remaining effort and billing evidence.

Payment terms on a quote, customer signature, “report generated” flag and operational completion are not substitutes for ERP posting/payment confirmation.

Currency exposure and treasury decisions follow an approved corporate policy. No hedging product or action is authorised or recommended by this specification.

---

## 16. Documents, knowledge and communications

**Shared owners:** business document owners, Engineering, process owners and Digital Systems & Data.

| ID | Proposed requirement | Boundary/acceptance intent |
|---|---|---|
| DOC-01 | Link controlled documents using stable repository identifiers | Renaming or moving a file follows supported reference-handling rules |
| DOC-02 | Separate working versions, approved revisions and issued records | Preserve exact released/acknowledged content and issue purpose |
| DOC-03 | Generate approved quotation, job-pack, service and handover outputs | Template version, source snapshot and reviewer recorded |
| DOC-04 | Maintain approved knowledge and technical reference content | Owner, applicability, revision and review/expiry rules visible |
| DOC-05 | Manage communication drafts, approval, distribution and delivery outcomes | Sent, delivered and acknowledged are not interchangeable |
| DOC-06 | Apply access, retention and confidentiality to files and search results | App and repository permissions both enforced |

### 16.1 Document-output register

| Output | Business owner | Required issue evidence |
|---|---|---|
| Budgetary estimate or concept proposal | Sales/Estimating | Indicative status, assumptions and version |
| Customer quotation | Commercial authority | Approved content, terms, source estimate and issued version |
| Design/transmittal package | Engineering | Revision, approval, issue purpose, exact files and recipients |
| Technician job pack | Service | Scope, appointment, pack revision and acknowledgement |
| Customer service report | Service reviewer | Actual visit evidence, report version and customer acknowledgement status |
| Project progress update | Project Manager | Reviewed commentary, source date and approved audience |
| Commissioning/test record | Technical authority | Procedure, criteria, tested configuration and results |
| Customer handover pack | Project Manager | Accepted deliverables, outstanding items, assets and support owner |
| Finance supporting evidence | Finance/process owner | Transaction links and approved treatment; ERP remains accounting source |

### 16.2 SharePoint implementation boundary

Microsoft Graph describes document resources and file operations, but this does not verify Powerplants’ site configuration or permissions. The detailed architecture must specify repository IDs, access model, retention, version retrieval and issued-copy preservation. [Microsoft Graph driveItem documentation](https://learn.microsoft.com/en-us/graph/api/resources/driveitem?view=graph-rest-1.0) [SRC-08]

Do not rely on a mutable “latest file” link as historical issue evidence. Ensure the selected retention design preserves the exact issued content even where working-version history is trimmed.

### 16.3 Communications and knowledge

Email/calendar integration requires a supported provider, consent/permissions and tested filing rules. Preserve source message IDs, attachments and timestamps where approved. Access to the CRM is not blanket access to all employee mailboxes.

Technical articles should distinguish approved instructions, working notes, suspected causes and obsolete guidance. Search results show applicable equipment/configuration and status. Customer-facing outputs exclude internal margins, employee private information, credentials and unresolved internal commentary.

---

## 17. Company-wide assurance and supporting functions

### 17.1 QHSE and biosecurity

Include relevant risk assessments, safe-work evidence, inductions, inspections, incidents, corrective actions, competencies and environmental/site requirements. QHSE supports the management system; operational leaders remain responsible for applying controls.

The exact legal requirements depend on jurisdiction and work scope. Safe Work Australia’s model-law guidance identifies duties that cannot simply be transferred to another person; the platform must support applicable responsibilities rather than imply that a QHSE approval removes them. [Safe Work Australia duty guidance](https://www.safeworkaustralia.gov.au/law-and-regulation/duties-under-whs-laws/duties-pcbu) [SRC-11]

For horticultural sites, store approved access restrictions, cleaning/visitor requirements and crop-sensitive operating windows. Farm Biosecurity identifies people, vehicles and equipment as potential pathways for pest and disease movement. Requirements in the job pack should come from the relevant site plan and competent review. [Farm Biosecurity guidance](https://www.farmbiosecurity.com.au/essentials-toolkit/people-vehicles-equipment/) [SRC-12]

### 17.2 People and capability

Use appropriate existing people/identity systems for employment and private workforce records. The operational app may need approved availability, skills, certification evidence, expiry dates, training and role authorisations.

An employee being available does not prove competence for a task. A dropdown saying “current” should be traceable to the relevant evidence and reviewer. Avoid copying sensitive payroll/HR information into general project or technician views.

### 17.3 Corporate equipment and tools

If justified, track company-owned tools, test equipment, loan units and fleet reservations. Include custody, maintenance and calibration evidence where relevant. Distinguish company equipment from customer-installed assets and stock held for sale.

### 17.4 Customer success and recurring relationships

Assign post-installation reviews, training follow-up, maintenance offers and renewal actions. A recurring service agreement must have coverage, exclusions, response commitments and billing ownership.

Supplier-billed software subscriptions should not be classified as Powerplants recurring revenue. Training needs and repeated support questions can inform customer development, with an accountable person reviewing the proposed action.

### 17.5 Telemetry and AI

Telemetry/remote monitoring is later, conditional scope. Define customer consent, supported OEM access, alarm ownership, response coverage, data use and failure handling before integration.

Operational technology requires controlled security boundaries. The platform must not become an unrestricted connection from corporate systems into customer controls. [ASD operational-technology guidance](https://www.cyber.gov.au/business-government/secure-design/operational-technology-environments/principles-of-operational-technology-cyber-security) [SRC-13]

AI may later assist with permission-aware retrieval, source-linked summaries and drafts. It must not independently approve technical designs, modify equipment settings, issue quotes, authorise costs or send unreviewed customer commitments. Inaccurate output must remain correctable and traceable.

---

## 18. Cross-module business-rule register

All rows below are PR requirements. Authority names, thresholds and parameter values require the applicable D decision.

| ID | Rule | Accountable policy owner |
|---|---|---|
| BR-01 | Every ERP-linked record identifies the correct company/tenant and external entity | Finance/Data owner |
| BR-02 | Each shared field family has one writable authority during each transition phase | Data owner |
| BR-03 | Prospect, quotation and forecast demand do not themselves create financial or stock commitments | Commercial/Finance |
| BR-04 | Mutually exclusive options do not multiply a single opportunity’s forecast without an explicit reporting rule | Sales/Finance |
| BR-05 | Changes to approved price, scope, questionnaire or configuration create a reviewed version/change record | Relevant domain authority |
| BR-06 | The exact accepted quotation and its assumptions remain recoverable | Commercial authority |
| BR-07 | ERP conversion follows a validated route; target changes preserve lineage and require review | Commercial/Integration owner |
| BR-08 | Payment/deposit status comes from the authoritative financial process, not questionnaire answers | Finance |
| BR-09 | Project schedule changes propose or flag booking changes; Service confirms appointments | Service scheduling authority |
| BR-10 | Booking confirmation rechecks current availability, skills, travel and version conflicts | Service scheduling authority |
| BR-11 | Dispatch requires defined readiness evidence or an authorised permitted exception | Service manager |
| BR-12 | Issued pack/drawing changes are versioned and communicated to affected users | Document owner |
| BR-13 | Offline information shows its known revision and last sync; unseen updates are not claimed current | Service/Systems |
| BR-14 | Case, work-order, appointment, report and billing states remain separate | Service/Finance |
| BR-15 | Customer acknowledgement applies to the exact content presented and records reservations | Service/Commercial |
| BR-16 | Recorded labour/parts are not automatically approved, billable or ERP-posted | Service/Finance/Supply Chain |
| BR-17 | Design release, purchasing approval and technical acceptance are distinct decisions | Engineering/Projects |
| BR-18 | Stock readiness uses defined ERP statuses and item-level allocation, not shipment arrival alone | Supply Chain |
| BR-19 | Unknown external-write outcomes are investigated/reconciled before a new equivalent write | Integration owner |
| BR-20 | Pending, partial, failed, stale and unknown values remain visible and are not converted to success/zero | Data/report owner |
| BR-21 | Financial definitions separate actuals, commitments, forecasts, billing and cash | Finance |
| BR-22 | Permissions apply to actions, records, search, exports, attachments and notifications | Systems/Data owner |
| BR-23 | Customer technical changes and crop-sensitive shutdowns require the relevant authority | Engineering/Service/customer |
| BR-24 | Warranty coverage, goodwill, supplier recovery and financial credit are distinct decisions | Service/Commercial/Finance |

Rule implementation must include refusal behaviour, correction and audit evidence. A disabled button should explain the resolvable condition without exposing confidential information.

### 18.1 Proposed lifecycle boundaries

The following state families provide a common design vocabulary. They are proposed logical states, not assertions about existing CREMS or MYOB enum values. Module specifications must define permitted branches, reversals and exceptions; the order below does not authorise every transition.

| Record | Proposed state family | Independence and control |
|---|---|---|
| Opportunity | Open, won, lost, archived | Sales stage is configured separately; winning does not prove an ERP order exists |
| Estimate revision | Working, submitted, approved, rejected, superseded | Approval applies to a defined version and cost/pricing basis |
| Quotation version | Draft, under review, approved, issued, accepted, declined, expired, withdrawn | Issue and customer response are separate events; accepted content remains recoverable |
| Project | Proposed, authorised, active, on hold, completed, closed, cancelled | Technical, commercial and service handovers have their own evidence and outstanding-item states |
| Drawing revision | Draft, in review, released, superseded, withdrawn | Release purpose, technical approval and transmittal history remain separate |
| Service case | New, triaged, active, waiting, resolved, closed | Waiting reason and next owner are required; reopening preserves the previous closure |
| Work order | Draft, authorised, in progress, on hold, work complete, closed, cancelled | Appointment, report, billing and case states remain separately visible |
| Appointment | Tentative, confirmed, dispatched, on site, completed, cancelled, missed | Crew attendance, customer confirmation and acknowledgement need their own records |
| Job-pack revision | Draft, checked, issued, superseded, withdrawn | Download and acknowledgement are recorded per recipient against the exact revision |
| Variation | Draft, assessed, submitted, approved, rejected, withdrawn | Commercial approval does not itself release a technical design or post an ERP transaction |
| Time/parts submission | Draft, submitted, returned, approved | Billability and ERP-processing status are separate attributes/workflows |
| Financial or inventory transaction | Authoritative ERP status and approved display mapping | Preserve the actual source status; do not infer posting, settlement or availability from a local workflow |

### 18.2 Transition contract

For each permitted transition, specify the source state, requested action, actor/delegation, mandatory evidence, validation, resulting state and side effects. Record the source version, timestamp, reason and resulting document or external reference.

Business-state changes and integration completion must be distinguishable. Where an action requires an ERP commitment, expose its pending, failed or unknown outcome until reconciled. Rejection, cancellation and reopening preserve history; they do not erase issued evidence or reverse an ERP transaction by implication.

The detailed transition register belongs in the relevant module specification and must link to BR rules and AT acceptance cases. State changes initiated by automation use the same authority and evidence rules as user actions.

---

## 19. Integration and update behaviour

### 19.1 Proposed interface catalogue

| ID | Interface | Direction and authority | Validation required |
|---|---|---|---|
| IF-01 | MYOB customer/contact/location references | Read plus specifically approved master-change commands | Tenant, keys, shared-field ownership, duplicate resolution and permissions |
| IF-02 | MYOB item, price/cost and stock information | Read; controlled item-resolution/stock commands only if approved | Warehouses, units, statuses, effective dates and atomic validation |
| IF-03 | Commercial qualification, quote and order/project conversion | Approved commands and result reconciliation | Actual endpoint contracts, routes, numbering and duplicate prevention |
| IF-04 | Service orders, appointments, time and material processing | Ownership selected under D-007 | Existing capabilities, review stages, mappings and recovery |
| IF-05 | Invoices, payments, credits and project financial data | Initially read-only | Status, applications, currency/tax basis and source completeness |
| IF-06 | SharePoint files, versions, metadata and publication | Controlled document operations | Access, retention, exact issued versions and naming/move behaviour |
| IF-07 | Pipedrive transition | Approved migration/read bridge; field ownership by phase | Feature parity, histories, activities, files, IDs and delta updates |
| IF-08 | Smartsheet transition | Approved migration/read bridge; schedule ownership by phase | Dependencies, calendars, baselines, attachments and prototype status |
| IF-09 | Identity and approved email/calendar services | Scoped identity/context access and approved actions | Consent, group mapping, mailbox scope, calendar ownership and revocation |
| IF-10 | CAD/OEM or other specialist interfaces | Initially links/published outputs; later supported integrations | Formats, dependency integrity, licences, customer authority and security |

MYOB publishes a contract-based REST API for reading and changing records through defined endpoints. This establishes an integration mechanism, not Powerplants’ entitlement, endpoint coverage or production readiness. [MYOB contract-based REST API](https://enterprise-support.myob.com/adv/contract-based-rest-api) [SRC-07]

### 19.2 Five different kinds of update

| Update class | Examples | Required behaviour |
|---|---|---|
| Shared immediate save | Contact relationship, task update, appointment request | Authorisation, validation, concurrency check and audit |
| Staged working edit | Estimate lines, questionnaire answers, scope matrix | Visible unsaved state, explicit commit/discard and input preservation |
| Approved/issued snapshot | Quote, job pack, drawing issue, signed report | Exact content/version preserved; material change requires a new version |
| Device-local operation | Offline note, time entry or downloaded pack | Local status, secure scope, queue, retry and conflict handling |
| External asynchronous action | ERP conversion, upload, notification or posting request | Durable operation record, confirmed external result and reconciliation |

An autosaved draft is not an approval. A successful local save is not proof of an ERP update. A cached dashboard does not establish current credit or stock availability.

### 19.3 Command and recovery model

Every material external command should record operation ID, source/version, company, entity, requested action, actor, authority, request fingerprint, attempts, timestamps, external IDs and reconciliation status.

Suggested lifecycle: prepared → queued → processing → confirmed. Exception states include rejected, retryable failure, partial completion, unknown outcome and manual review. “Confirmed” requires the intended external result, not merely an HTTP connection or a queued message.

If a request times out after the ERP may have committed it, first look up the correlated external outcome. Application-side stable operation IDs, single-command coordination and supported external keys/lookups provide duplicate protection; native ERP idempotency support is not assumed.

Do not claim exactly-once execution from transport behaviour alone. Repeated delivery must be safe or routed to an operator for reconciliation.

### 19.4 Synchronisation and reconciliation

Define refresh strategy and maximum useful age per dataset. This may use supported notifications, polling or approved imports. Reconnection and refresh must preserve the distinction between externally sourced fields and locally owned operational fields.

Reconcile entity identity, company, source/target references, line counts, units, quantities, currency, totals and status as appropriate. Record run ID, source cutoff, completeness, exceptions and reviewer.

Time stored for exchange should have an unambiguous timezone/UTC basis; users see the relevant site/working timezone. Queensland and other state calendars must not be treated as identical.

### 19.5 Example of partial completion

If ERP project creation succeeds but app-side handover seeding fails, retain the ERP ID and mark the remaining step incomplete. An authorised recovery action repairs the missing local records after checking for existing ones. It does not create another ERP project.

Likewise, a posted accounting document is not “rolled back” by deleting a local record. Corrections follow the authoritative ERP process.

---

## 20. User experience and screen families

### 20.1 Experience principles

Use a consistent design system, terminology, search behaviour, forms, tables and action placement. Show source dates, record status and permitted next actions at the point where they affect decisions.

Prioritise a clear daily workspace over a crowded dashboard. Users should see their tasks, approvals, blocked work and relevant exceptions without browsing every module. Use colour with labels/icons rather than colour alone.

### 20.2 Initial screen catalogue

| Screen family | Primary users | Core decisions supported |
|---|---|---|
| My Work and action inbox | All staff | What needs my attention and what can I do next? |
| Customer/site overview | Sales, Projects, Service | Who is the customer and what is installed or happening here? |
| Opportunity and relationship workspace | Sales/Commercial | Qualification, next action and commercial pursuit |
| Estimate/quote workbench | Estimating/Approvers | Scope, quantities, costs, versions and approval |
| Engineering work/register view | Engineers/Reviewers | Deliverable ownership, review and release |
| Project workspace and portfolio | Project teams/Management | Dependencies, exposure, readiness and acceptance |
| Service intake/work-order view | Service coordinators | Clarification, scope, coverage and readiness |
| Visual dispatch planner | Authorised schedulers | Allocation, conflict resolution and rescheduling |
| Technician Today/job workspace | Technicians | Pack, history, tasks, time, parts and completion |
| Materials/logistics view | Supply Chain/Delivery | Availability, shipment exceptions and job readiness |
| Account/finance view | Authorised commercial/finance staff | Verified transactions and financial exceptions |
| Document/knowledge workspace | Staff by permission | Correct approved content and historical evidence |
| Administration/integration console | Authorised administrators | Configuration, access, failed operations and audit |

These are screen families. The module specifications will define fields, actions, states, navigation and component behaviour.

### 20.3 Mobile behaviour matrix

| Activity | Desktop/tablet | Phone/offline expectation |
|---|---|---|
| Daily schedule and job-pack reading | Full view | Priority use case; downloaded scope and freshness visible |
| Field history, photos, notes and checklist | Full view | Fast capture; offline scope validated |
| Time, parts and acknowledgement | Full view | Low-friction submission with durable sync status |
| Dispatch planning | Full planner | Read/limited edits as validated; no assumption of full desktop parity |
| Detailed estimating and design review | Primary work environment | Summary/review only where practical; complex editing assessed separately |
| Financial analysis | Role-controlled detailed view | Restrict to purposeful summaries and approved actions |

Offline support is a separate product requirement, not a consequence of a responsive layout.

### 20.4 Information and error states

Specify loading, empty, no access, not configured, stale, unavailable, partially loaded, unsaved, awaiting review and conflicting states. Preserve user input when a save fails where safe. Distinguish “no records” from “records could not be loaded.”

Notifications should be actionable, deduplicated and proportionate. Critical unread changes need escalation; ordinary changes can be grouped into digests. Customer messages remain governed by the relevant approval policy.

---

## 21. Security and non-functional requirements

### 21.1 Proposed acceptance requirements

| ID | Requirement | Verification and decision dependency |
|---|---|---|
| NFR-01 | Enforce identity and action/record-level authorisation on the server | Positive/negative role tests, cross-company tests and D-020 |
| NFR-02 | Preserve attributable audit for material changes and approvals | Reconstruct actor, time, source/version, reason and outcome |
| NFR-03 | Protect credentials and information in transit, storage and device caches | Security design, secret rotation and device review; no secrets in job packs |
| NFR-04 | Meet agreed response times under representative load | Draft candidate: p95 core read views within 3 seconds; dataset, device/network, exclusions and concurrency fixed under D-021 |
| NFR-05 | Provide useful degraded operation and visible external outages | Demonstrate unavailable/partial data without false success or silent commitments |
| NFR-06 | Meet agreed recovery and data-loss objectives | Restore rehearsal; candidate RPO 15 minutes and RTO 4 hours for operational records, subject to cost and business review |
| NFR-07 | Preserve offline input and resolve synchronisation safely | Device restart, duplicate retry, conflict and stale-assignment tests |
| NFR-08 | Support accessible complete workflows | Proposed WCAG 2.2 AA target; keyboard, screen-reader, reflow and touch testing |
| NFR-09 | Prevent duplicate or conflicting material commands | Concurrent booking/conversion tests and unknown-outcome recovery |
| NFR-10 | Apply approved retention, export and deletion policies | Record/document/device scope; legal holds and issued evidence addressed under D-012/D-021 |
| NFR-11 | Provide monitoring, operational alerts and support diagnostics | Integration health, queue age, failures, access events and alert ownership |
| NFR-12 | Support maintainable releases and data portability | Company-controlled repositories/configuration, tested deployment/recovery and usable exports |

Numeric values above are discussion candidates, not approved service levels or demonstrated performance. Confirm availability hours, response commitments, RPO/RTO by data class, actual load, largest files, offline duration and external dependency behaviour before G2. If a target changes, update its tests and cost assessment.

WCAG 2.2 provides testable, technology-independent accessibility criteria. A visual inspection alone cannot establish conformance. [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) [SRC-14]

### 21.2 Information access model

Define roles for business use, approval, administration and integration separately. Permissions must cover attachment URLs, previews, global search, exports, API responses, notifications and customer portal data, not only menu visibility.

Restrict sensitive financial measures, employee information and internal commercial notes. External customer/partner access requires explicit organisation/site scope and independently tested isolation.

Identity deactivation, role change and device loss require controlled revocation and recovery procedures. Offline limitations must be disclosed and mitigated rather than represented as instant revocation.

The proposed identity baseline is corporate single sign-on with multi-factor authentication, supported account recovery and a joiner/mover/leaver process. Confirm the identity provider and any external-user model under D-020. Privileged administration and integration identities require restricted scope and attributable activity; shared staff logins are unsuitable for approval or field-work attribution.

### 21.3 Production-readiness controls

Use reviewed configuration and environment separation. Protect production data used in testing. Check dependencies, secure coding, authentication, authorisation, audit and high-risk interfaces.

Specify encryption and key/secret management, audit-log protection, vulnerability remediation and security-incident handling in BP-02. The release plan should include an independent security assessment proportionate to the approved exposure, including file access and cross-customer isolation if external access is introduced.

The release decision must identify unresolved security findings and authorised treatment. No known critical access-control or data-loss defect is acceptable in the proposed pilot release.

---

## 22. Business outcomes and measure dictionary

### 22.1 Measurement governance

The measures below are proposed. Baselines and improvement targets are not yet measured. Each needs an owner, definition version, inclusion/exclusion rules, timezone, period, source cutoff and evidence of source completeness.

Do not compare unlike job classes, currencies or tax bases. Do not turn missing denominators into zero performance. Present forecast measures separately from posted financial results.

| ID | Measure and working definition | Owner / interpretation |
|---|---|---|
| KPI-01 | Pack readiness rate: eligible visits with required checked/issued pack by the agreed cutoff ÷ eligible visits | Service; record permitted exceptions separately |
| KPI-02 | Technician acknowledgement rate: required recipients acknowledging the applicable pack revision by cutoff ÷ required recipients | Service; receipt/open/read are not interchangeable |
| KPI-03 | Scheduling conflict rate: confirmed bookings with a validated unresolved conflict ÷ confirmed bookings | Service; rules/version and exclusion window defined |
| KPI-04 | Reschedule acknowledgement lag: elapsed time from confirmed material change to required acknowledgement | Service; show median/tail and outstanding changes separately |
| KPI-05 | Service report turnaround: elapsed time from visit completion to reviewed report issue | Service; distinguish draft, reviewed and issued |
| KPI-06 | First-visit resolution: eligible issues resolved on first attendance without related return within an agreed review window ÷ eligible issues | Service; planned multi-visit work excluded by agreed rule |
| KPI-07 | History linkage completeness: eligible completed visits linked to required site/assets and report ÷ eligible visits | Service/Data owner; ambiguous asset matches are exceptions |
| KPI-08 | Quotation cycle time: time from scope-ready request to approved issue | Estimating; customer-wait and internal-wait rules explicit |
| KPI-09 | Variation exposure by status: submitted/open changes by value and status; approved change value shown separately | Commercial/Projects; do not sum alternatives as revenue |
| KPI-10 | Material readiness: eligible work packages meeting all approved material prerequisites by cutoff ÷ eligible packages | Supply Chain; not container-arrival percentage |
| KPI-11 | Commissioning first-pass acceptance: eligible tests accepted without corrective retest ÷ eligible completed tests | Engineering; compare similar test classes |
| KPI-12 | Financial reconciliation exception rate: failed/unresolved items ÷ items checked in the defined run | Finance; include missing and partial source data |
| KPI-13 | Forecast final margin: approved forecast revenue less non-duplicated forecast final cost, divided by approved forecast revenue | Finance; exclude tax or other amounts according to approved definition |
| KPI-14 | Integration recovery backlog: count and age of unresolved operations by failure/unknown state | Systems/Business owner; queue acceptance is not completion |
| KPI-15 | Adoption: eligible pilot visits fully completed through the agreed workflow ÷ eligible pilot visits | Product owner; paired with user feedback and correction effort |

### 22.2 Benefits assessment

Measure preparation effort, avoidable re-entry, rework and administrative time using comparable examples before and after implementation. Any financial benefit model needs agreed volumes, rates, confidence and non-overlapping savings.

Do not promise that the platform eliminates downtime, guarantees stock, ensures retention or establishes a contractor classification. Benefits should be stated as measurable improvements supported by evidence.

---

## 23. Controlled blueprint and specification set

| ID | Core document | Content owner/reviewers | Status at v01 |
|---|---|---|---|
| BP-01 | Master Business & Build Blueprint | Product owner, sponsor and process owners | This document; draft for review |
| BP-02 | Platform Solution Architecture | Architect, Systems, data/integration owners | Planned; not generated by this task |
| BP-03 | CRM Functional & Build Blueprint | Sales/Customer Experience | Planned |
| BP-04 | Estimating & Quotation Functional & Build Blueprint | Estimating/Commercial, Engineering, Finance | Planned |
| BP-05 | Engineering & Design Control Functional & Build Blueprint | Engineering, Projects, Service | Planned |
| BP-06 | Projects & Commercial Delivery Functional & Build Blueprint | Projects, Commercial, Finance, QHSE | Planned |
| BP-07 | Service Operations Functional & Build Blueprint | Service, technicians, Finance, Supply Chain | Planned |
| BP-08 | Supply Chain Management Functional & Build Blueprint | Procurement/Inventory/Logistics, Finance | Planned |
| BP-09 | Finance & Commercial Controls Functional & Build Blueprint | Finance and operational measure owners | Planned |

### 23.1 Common module specification structure

Each module specification includes purpose/outcomes, scope, users, responsibilities, detailed journeys, screens/components, logical fields and choices, rules/calculations, states/transitions, approvals, outputs, integrations, exceptions, non-functional needs, migration, acceptance tests and unresolved decisions.

Use this blueprint’s IDs as parent references. Detailed child IDs can be added without duplicating or renaming the parent requirement. Trace every implementation story and test to its accepted source.

### 23.2 Shared controlled registers

Maintain one authoritative vocabulary and identity map, ownership/permission matrix, integration catalogue, UX/design system, document-control standard, measure dictionary, decision register, risk register and acceptance/migration plan. Initially these may be appendices rather than separate files.

Cross-module changes must identify affected specifications. A Finance definition change can affect a CRM dashboard, estimate comparison, service billing view and project report.

### 23.3 Review standard

Specifications must explain normal behaviour and refusal/recovery behaviour. Examples are labelled illustrative. Technical mappings, thresholds and policies must either cite verified evidence or remain unresolved with a closure plan.

The target is sufficient detail to build and test the selected release. Later features remain bounded outlines until their dependencies are ready.

---

## 24. Delivery strategy and release sequence

### 24.1 Programme stages and gates

| Stage | Work and outcome | Gate and required decision |
|---|---|---|
| 0 — Baseline | Review this blueprint, business outcomes, owners and boundaries | G0: endorse direction and authorise a bounded discovery scope |
| 1 — Discovery | Validate actual processes, source systems, pain baselines and capability options | G1: accept findings, choose initial release and authorise scoped feasibility/design work |
| 2 — Architecture and release design | Shared architecture, critical interface proofs, detailed release requirements and costed plan | G2: approve funded build scope, authority, targets and acceptance plan |
| 3 — Controlled development | Build in non-production; execute functional, security, integration and recovery tests | G3: approve an operational pilot with evidence and support arrangements |
| 4 — Operational pilot | Limited approved live use; monitor reconciliations, usability and outcomes | G4: accept pilot outcomes or remediate/restrict scope |
| 5 — Rollout and operation | Controlled migration, training, support and subsequent releases | G5: accept each cutover and any legacy retirement scope |

Only Stage 0 document preparation is represented by the current user authorisation. Live access changes, writes, technical experiments, procurement and deployments require appropriate later authorisation.

### 24.2 Provisional delivery waves

| Wave | Candidate scope | Dependencies and constraints |
|---|---|---|
| Wave A — Shared foundation and planned service | Identity, customer/site/asset links, documents, service preparation, dispatch, capture and reviewed handoff | Service ownership, device/offline, SharePoint and minimum MYOB reference validation |
| Wave B — CRM and estimating | Required Pipedrive outcomes, validated CREMS costing/configuration, quote control and conversion | Feature parity, formula/rule evidence and safe ERP conversion |
| Wave C — Engineering, projects and materials | Design releases, detailed project controls, procurement/logistics, commissioning and commercial variations | Shared commercial/data rules and programme-specific acceptance |
| Wave D — Extension and optimisation | Portals, advanced reporting, workshop/tools, approved monitoring and AI assistance | Separate business cases, reliable data and support capacity |

These are provisional sequencing recommendations, not fixed calendar commitments or whole-department cutovers. Basic financial controls, material readiness and engineering references are needed in Wave A; their deeper modules may follow later.

### 24.3 Release selection method

Assess business pain, breadth of benefit, dependency readiness, change effort, technical risk and operating cost. Record rejected alternatives and the reason for the selected release.

The existing MYOB service capability should be assessed as a potential foundation. Its public documentation covers service-order-related functions; Powerplants licensing and suitability remain unverified. [MYOB field services](https://enterprisesupport.myob.com/knowledge/field-services) [SRC-09]

Do not postpone the entire programme for an optional later feature. Conversely, unresolved first-release safety, authority, identity, financial or recovery boundaries cannot be treated as cosmetic backlog.

---

## 25. Proposed first operational release

### 25.1 Pilot objective

Demonstrate one complete planned service journey from accepted request to reviewed report, follow-up and a controlled financial handoff, using reliable customer/site/equipment information.

Select a small, representative cohort and bounded job types after D-004/D-015/D-016 decisions. A suitable candidate has an identifiable site, defined scope, manageable equipment history, known reviewers and available support.

Start with synthetic/non-production cases. Any live pilot is a later, separately approved activity. Do not make a critical emergency or an entire major greenhouse project the first operational trial.

### 25.2 Included capabilities

- Appropriate identity, access and customer/site/equipment links.
- Service intake, scope clarification and authoritative work-order linkage.
- Readiness checks, document selection, issued packs and technician acknowledgement.
- Visual booking and controlled rescheduling.
- Relevant history and field capture, including the approved offline scope.
- Time/parts submission, service report, customer acknowledgement and follow-up.
- Review queues, audit, integration status and a verified Finance handoff.
- Required training, help, support and recovery arrangements.

### 25.3 Explicit pilot boundaries

The initial pilot does not require replacing all CRM sales workflows, rebuilding every estimating formula, launching a customer portal, executing automatic invoice posting or integrating customer control telemetry.

If financial processing remains manual in MYOB during the pilot, document the queue, responsible person, reconciliation and returned reference. The app must show this honestly as a manual handoff, not an automated integration.

A missing read or critical identity mapping cannot be disguised as a supported feature. Restrict the pilot or resolve the dependency.

### 25.4 Exit criteria

Required AT scenarios for Wave A pass for the agreed scope; no unresolved critical access, safety-control, data-loss or duplicate-transaction defect remains. Source/target records reconcile, users can complete the workflow, and support/recovery responsibilities are exercised.

Review pack readiness, reporting turnaround, correction effort, adoption and user feedback against the agreed baseline. Pilot success authorises only the next explicitly approved scope.

---

## 26. Acceptance and assurance catalogue

### 26.1 Test governance

The following are planned scenarios, not executed software tests. Detailed scripts will specify environment, data, actor, preconditions, steps, expected results, evidence, reviewer and outcome.

Every in-scope parent requirement must acquire sufficient detailed tests before G2/G3. The catalogue is a master-level foundation, not a complete regression suite.

| ID | Scenario and action | Required observable result |
|---|---|---|
| AT-01 | Access customer/site records as permitted and unpermitted roles | Correct access; restricted search, files, exports and notifications do not leak data |
| AT-02 | Link similarly named customers in different ERP companies | Explicit correct company/account mapping; ambiguous match blocked for review |
| AT-03 | Create quotation alternatives and revise one estimate | Forecast and lineage rules preserved; accepted version unchanged |
| AT-04 | Recalculate representative estimate and Screen Systems cases | Agreed source formulas, units, rounding and approved expected results match |
| AT-05 | Push/convert an accepted quote; simulate timeout after external creation | Existing external outcome identified; no duplicate order/project and reconciliation recorded |
| AT-06 | Submit an incomplete service request for dispatch | Specific blockers shown; only permitted authorised exception path available |
| AT-07 | Issue a pack, acknowledge it, then release a material amendment | Exact versions retained; change summary and renewed acknowledgement requirement |
| AT-08 | Concurrently edit and move the same booking | One confirmed outcome; conflict detected and user input preserved |
| AT-09 | Move a project installation date with an existing technician booking | Rescheduling request/impact shown; confirmed appointment not silently overwritten |
| AT-10 | Download a job, disconnect, capture records and restart device | Authorised data remains usable; local input retained with honest freshness/status |
| AT-11 | Reconnect with changed assignment, duplicate retry and record conflict | Permissions/version checked; no lost/duplicate entries; conflict routed for review |
| AT-12 | Record labour/parts, correct an entry and submit for review | Planned, actual, approved, billable and ERP states distinguishable with audit |
| AT-13 | Capture customer acknowledgement, reservations or unavailability | Correct report version and identity/context; exception remains visible |
| AT-14 | Complete a visit that needs a return appointment | Visit can complete while work order/case remains open with owned next action |
| AT-15 | Release design, then propose a material change after procurement | Impact, approval, new revision and affected-recipient handling recorded |
| AT-16 | Receive a partial/damaged shipment serving multiple work packages | Line-level quantities/statuses correct; arrival does not falsely establish readiness |
| AT-17 | Complete commissioning with one failed test and phased handover | Failed result, retest and partial acceptance preserved; no false whole-project completion |
| AT-18 | Compare account/project views with approved ERP/source evidence | Correct company, currency, tax/status treatment and complete reconciliation |
| AT-19 | Replay maintenance generation and assess a disputed warranty | No duplicate occurrence; recurrence/coverage decisions and supplier recovery separated |
| AT-20 | Open renamed/moved document and previously issued version | Supported links resolve; historical exact issue remains available under retention rules |
| AT-21 | Rehearse migration with duplicates, missing history and changed source records | Exceptions resolved or quarantined; IDs, totals and delta treatment evidenced |
| AT-22 | Restore from backup and simulate an integration outage | Recovery objectives assessed; queues and unknown outcomes reconciled safely |
| AT-23 | Execute core workflows on representative devices/load and assistive navigation | Agreed performance/accessibility/mobile criteria met; drag-only actions have alternatives |
| AT-24 | Trace a Pipedrive activity and a Smartsheet dependency through the approved transition | Required history/semantics preserved or explicitly accepted exception recorded |

### 26.2 Minimum proposed Wave A tests

AT-01, AT-02, AT-06 through AT-14, AT-18 through AT-23 apply to the relevant first-release scope. AT-19 applies to recurring/warranty functionality only if included. Other tests are required as their capabilities enter a release.

Where a Wave A finance handoff is manual, AT-18 tests the manual process, returned references and reconciliation. It must not be marked passed for an unimplemented automatic interface.

### 26.3 Acceptance evidence

Maintain test version, requirement links, expected/actual outcomes, screen/log/reference evidence, defects, corrective action and reviewer decision. Demonstrations, role walkthroughs, operational tests and data reconciliation have different purposes.

Critical failures block the affected release. Other residual defects require explicit treatment, owner and deadline. A waiver must not be used to approve a legally prohibited or unsafe activity.

---

## 27. Migration, coexistence and cutover

### 27.1 Migration scope by source

| Source | Candidate content | Critical preservation needs |
|---|---|---|
| CREMS | Leads, opportunities, options, estimates, questions, quotes, approvals and external mappings | Accepted snapshots, formulas/rule versions, route lineage and documents |
| Pipedrive | Required organisations, people, deals, activities, notes, files and configuration | Ownership, timestamps, communications, field meanings and stage history |
| Smartsheet | Approved project information, schedules, dependencies, decisions and relevant history | Working calendars, baseline/forecast distinction, predecessor semantics and template/test classification |
| MYOB | Authoritative reference and transactional data | Company, record IDs, status, currency, application/line relationships and source cutoff |
| SharePoint/CAD | Links, classifications, permissions and controlled document records | Native references, exact issued versions and retention |

Migration does not mean moving the ERP ledger or native CAD repository into the app database.

### 27.2 Coexistence rules

For each field/record family, identify the writable owner by phase. Define freeze windows, changed-record capture, imported provenance, duplicates, conflict resolution and archive access.

Do not run uncontrolled bidirectional edits. Where Pipedrive or Smartsheet remains authoritative, the new interface must be read-only for the affected fields or route authorised requests through the agreed process.

Synthetic records, prototype templates, historical references and production records must be classified explicitly. The existing SOL008 prototype work is not automatically approved for production migration.

### 27.3 Rehearsal and cutover

Rehearse extraction, mapping, import, relationship checks, file access and reconciliation. Use record counts and control totals appropriate to each dataset; test meaningful samples and exceptions as well as totals.

Cutover requires approved scope, current source snapshot/deltas, verified permissions, reconciled target, trained users, communications, support cover, monitoring, contingency and a named decision maker.

Define when the old workflow becomes read-only and how historical records remain accessible. Retire only the accepted capability, not an entire application because one module is ready.

### 27.4 Rollback and financial correction

Distinguish rollback of an app deployment, recovery of local records and correction of external business transactions. A rollback plan must account for work performed since cutover and avoid replaying already-posted commands.

Posted ERP transactions follow the authorised correction process. A local deletion is not an accounting reversal.

---

## 28. Delivery team, commercial evaluation and operations

### 28.1 Delivery arrangement

Assess a competent internal team, implementation partner or hybrid arrangement. Required capabilities include product/process analysis, UX, application development, ERP integration, security, testing, migration and operational support.

Powerplants should have a named product owner and process reviewers regardless of delivery model. Establish company access to code repositories, deployment/configuration records, credentials through secure ownership arrangements, test evidence and technical documentation.

Any vendor contract should define deliverables, acceptance, change control, support, data/code rights, subcontractor access, ongoing licences, exit assistance and knowledge transfer.

### 28.2 Cost model

Estimate discovery, design, development, integration/configuration, licences, hosting/storage, devices, migration, testing, training, rollout, support, security maintenance and future change. Include internal reviewer time and contingency linked to actual unresolved risks.

Compare whole-of-life cost and operability rather than only initial development price. Do not reuse earlier indicative schedules or budgets for the expanded scope.

No project budget, savings figure or development duration is approved in this blueprint.

### 28.3 Operating support

Define first-line business support, technical escalation, ERP/SharePoint/OEM support boundaries, response hours, incident severity, on-call coverage if required, release windows and service reporting.

Support tools need correlation IDs and appropriately redacted diagnostics. Routine monitoring should identify stale data, growing queues, failed notifications, overdue approvals and unknown external outcomes.

Train users by role and scenario. Provide short operational guides, in-app help, supervised pilot practice and a feedback channel. Update training whenever materially changed workflows are released.

### 28.4 Governance cadence

Use a controlled backlog, decision log and release review. During discovery, focus on closing priority evidence gaps; during build, focus on accepted increments and unresolved risks; during pilot, focus on real workflow outcomes and reconciliation.

Meeting frequency and owners should be agreed by the programme team. This document does not create meetings, reminders or automated messages.

---

## 29. Decisions, assumptions and programme risks

### 29.1 Open decision register

All decisions below are **open**. Owner roles are proposed; named assignment and due dates belong in the authorised discovery plan. G references are the latest gate at which the relevant in-scope decision should close.

| ID | Decision/evidence required | Proposed owner | Closure evidence / latest gate |
|---|---|---|---|
| D-001 | Sponsor, programme mandate and review authority | Executive leadership | Named sponsor and approved discovery scope / G0 |
| D-002 | Functional ownership, staffing, deputies and delegated approvals | Executive/process owners | Responsibility and delegation matrix / G1 |
| D-003 | Programme reference and controlled naming | Product owner/data steward | Assigned reference; preserve SOL008 boundary / G0 |
| D-004 | Pain baselines, first release and pilot cohort | Product owner/Service | Comparable baseline and agreed release rationale / G1 |
| D-005 | MYOB versions, companies, licences, modules and environments | Finance/MYOB administrator | Current configuration and entitlement inventory / G1 |
| D-006 | MYOB endpoint, authentication, command and recovery contracts | Integration owner | Supported interface evidence and feasibility tests / G2 |
| D-007 | Authoritative service order/appointment/time ownership | Service/Finance/Systems | Chosen ownership model and transaction map / G1 |
| D-008 | CAD products, formats, file relationships and storage | Engineering | Supported working/published-file model / G2 before CAD scope |
| D-009 | Costing formulas, Screen Systems and questionnaire rules | Estimating/Engineering | Versioned source configuration and accepted examples / G2 before estimating replacement |
| D-010 | Route, pricing, contract and variation authority policies | Commercial/Finance | Approved rules, thresholds and exception process / G2 |
| D-011 | Customer/site/asset identity and multi-company mappings | Data owners/Finance | Master ownership, keys and duplicate-resolution rules / G1 |
| D-012 | SharePoint locations, access, retention and issued evidence | Document owners/Systems | Repository and permission/retention design / G2 |
| D-013 | Pipedrive feature parity and history requirements | Sales/Systems | Capability and migration inventory / G2 before CRM replacement |
| D-014 | Smartsheet approved processes and migration boundaries | Projects/data steward | Validated operational/prototype classification / G2 before project replacement |
| D-015 | Booking authority, calendars, travel, skills and exceptions | Service/Projects | Scheduling policy and representative examples / G1 |
| D-016 | Devices, offline duration, connectivity and lost-device treatment | Service/Systems | Device matrix, offline data scope and test results / G2 |
| D-017 | Financial measures, tax/currency treatment and reconciliation | Finance | Approved data dictionary and reconciled examples / G2 |
| D-018 | Service coverage, recurrence, warranty and response commitments | Service/Commercial | Coverage rules and contract examples / G2 for included scope |
| D-019 | QHSE, biosecurity and customer operating controls | QHSE/Engineering/Service | Applicable policies and qualified reviewer / G2 |
| D-020 | Identity, permissions, privacy and external access | Systems/data owners | Role/action/data matrix and security review / G2 |
| D-021 | Load, availability, recovery, retention and accessibility targets | Sponsor/Systems/process owners | Approved measurable NFR baseline / G2 |
| D-022 | Architecture, hosting and integration platform | Architect/Systems | Option assessment and architecture decisions / G2 |
| D-023 | Delivery team, funding, procurement and support ownership | Sponsor/Finance | Costed plan and delivery/support agreement / G2 |
| D-024 | Branding, templates, issue/signature policy and accessibility | Document owners/Commercial | Approved representative outputs / G2 |
| D-025 | Email/calendar, notifications and customer communication rules | Sales/Service/Systems | Supported integrations, scope and approval/delivery rules / G2 |
| D-026 | Migration, coexistence, reconciliation and cutover | Data owners/acceptance lead | Rehearsal results and approved cutover/rollback / G3–G5 |
| D-027 | Workshop, portals, fleet, telemetry and AI priorities | Sponsor/domain owners | Separate option/business case before inclusion / applicable G1/G2 |
| D-028 | Aftercare ownership, external partners and group-company scope | Leadership/Sales/Service | Operating boundaries and authorised relationships / G1 |

### 29.2 Working assumptions

- Existing tools continue to support their current authorised work during discovery.
- Suitable process owners and representative records can be made available; availability is not yet committed.
- A supported integration route may exist for required ERP functions; exact coverage must be proven.
- The field mobile approach can be selected after device/connectivity assessment; full offline parity is not presumed.
- Major-project controls will be proportional to actual scope, not applied unchanged to every parts sale.
- Multi-company identifiers are preserved where needed; group-company access and intercompany processing are not implicitly authorised.

If an assumption fails, raise a decision/change with the affected scope and cost rather than silently substituting a different operating model.

### 29.3 Initial programme risk register

Ratings are qualitative planning judgements, not a measured audit of current Powerplants operations.

| ID | Risk | Initial concern | Response and related decision |
|---|---|---|---|
| R-01 | Expanding scope prevents a usable first release | High | Bounded release, benefit-based prioritisation; D-004/D-027 |
| R-02 | Overlapping systems create contradictory masters | High | Field-level ownership and phase-specific write control; D-007/D-011 |
| R-03 | Required ERP function is unsupported or differently licensed | High | Verify configuration and prove critical interfaces; D-005/D-006 |
| R-04 | Hidden estimating rules produce incorrect offers | High | Obtain source rules and accepted regression examples; D-009/D-010 |
| R-05 | Offline or concurrent edits lose work or change a booking incorrectly | High | Durable queues, version checks and device tests; D-015/D-016 |
| R-06 | Incorrect financial definitions create misleading dashboards | High | Finance-owned definitions and reconciliation; D-017 |
| R-07 | Historical documents or asset context become inaccessible | High | Stable IDs, issue preservation and migration rehearsal; D-012/D-026 |
| R-08 | Broad access exposes customer, employee or commercial information | High | Role/action tests and repository alignment; D-020 |
| R-09 | Users work around a cumbersome workflow | Medium–High | Field involvement, representative pilot and measured correction effort; D-004 |
| R-10 | Delivery partner dependency or inadequate support undermines operation | High | Code/data rights, knowledge transfer and support model; D-023 |
| R-11 | Safety/biosecurity/technical authority is treated as a checkbox | High | Competent policy review and evidence-based gates; D-019 |
| R-12 | Prototype or migrated data is mistaken for verified production fact | High | Source labels, classifications and owner validation; D-014/D-026 |

---

## 30. Immediate work packages and review decision

### 30.1 Recommended next work

These are proposed activities for later authorisation, not actions performed by preparing v01.

| Work package | Output | Review owner |
|---|---|---|
| WP-01 — Business review | Comments on scope, outcomes, groups, authority and first-release proposal | Sponsor/product owner |
| WP-02 — Evidence inventory | CREMS exports, MYOB configuration, Pipedrive parity, Smartsheet classification, SharePoint/CAD inventory | Domain/data owners |
| WP-03 — Workflow workshops | Validated journeys J-01 to J-05, exceptions and handovers | Process owners |
| WP-04 — Data and authority baseline | Shared identity map, ownership matrix and action permissions | Data owners/Finance/Systems |
| WP-05 — Feasibility plan | Approved non-production proof cases for interfaces, documents, offline and scheduling | Architect/acceptance lead |
| WP-06 — Release and business case | Selected pilot, baseline measures, costs, dependencies and support plan | Sponsor/Finance/product owner |
| WP-07 — Architecture and module outlines | BP-02 and first-pass BP-03 to BP-09 with stable requirement links | Architect/process owners |
| WP-08 — First-release specification | Detailed screens, data, policies, interfaces and executable acceptance scripts | Release team/process owners |

### 30.2 Requested review disposition

Reviewers should record one of: accepted for discovery, accepted for discovery with conditions, or revise and resubmit. Record the decision, reviewer, date, conditions and affected sections.

The immediate review questions are:

1. Does the scope represent Powerplants’ intended platform, including the specialist systems to retain?
2. Are the ownership boundaries workable, especially commercial authority, technician bookings and financial processing?
3. Is the planned-service workflow the preferred first operational release, subject to discovery?
4. Who will own the open decisions and provide the required evidence?
5. What bounded discovery effort and subsequent decision date will leadership authorise?

**Current disposition: not recorded.** Preparation of this blueprint has not approved organisational changes, technical implementation, budgets, data migration or production access.

### 30.3 Definition of a successful discovery stage

The next stage is complete when the business scope is understandable, first-release dependencies have evidence, owners and interfaces are explicit, delivery options have been compared and the selected release can be estimated and tested credibly.

Document unresolved later questions without allowing them to obscure first-release blockers. Progress should lead to an executable release decision, rather than indefinite expansion of the blueprint.

---

## Appendix A — Source and evidence register

### A.1 Sources and limits

| ID | Source | Evidence class and use | Limit |
|---|---|---|---|
| SRC-01 | User instructions and requirements in this conversation, through the request for v01 | UC; goals, systems to retain, departmental scope and service issues | Organisational and technical implementation approvals are not implied |
| SRC-02 | CREMS Field Guide.docx; CREMS Field Guide.pdf; CREMS Field Guide(1).html; stated accurate 1 September 2026 | DG; current commercial workflow and source vocabulary | Alternate representations of one guide; not live code/API evidence |
| SRC-03 | GEN_RPT_CREMS_Current_State_and_Rebuild_Specification_v05.md and GEN_RPT_CREMS_v05_Content_Assurance_Audit_v01.md, dated 4 September 2026 | Secondary guide-derived report; selected sections and caveats rechecked for v01 | Its reconstruction requirements/inferences are not automatically approved target design |
| SRC-04 | Earlier Pipedrive read-only stage and 60-open-deal sample in this conversation, 4 September 2026 | PO; evidence of varied work types and existing CRM use | Not refreshed for v01; not complete parity, pipeline or adoption audit |
| SRC-05 | Earlier Smartsheet US review of workspace 5845693727303556 and representative sheets, 4 September 2026 | PO; prototype controls and source examples | Prototype/templates/synthetic/migrated evidence, not production approval |
| SRC-06 | [Powerplants Professional Services](https://powerplants.com.au/products/Professional-Services/) | ER; company business context; rechecked for v01 | Described project values are not PPA contract values |
| SRC-07 | [MYOB contract-based REST API](https://enterprise-support.myob.com/adv/contract-based-rest-api) | ER; supported integration mechanism; rechecked for v01 | Does not establish tenant-specific endpoints, permissions or licences |
| SRC-08 | [Microsoft Graph driveItem](https://learn.microsoft.com/en-us/graph/api/resources/driveitem?view=graph-rest-1.0) | ER; document-resource considerations; rechecked for v01 | Does not establish actual SharePoint configuration |
| SRC-09 | [MYOB field services](https://enterprisesupport.myob.com/knowledge/field-services) | ER; reason to assess existing ERP service capabilities; rechecked for v01 | Does not establish licensed/implemented feature scope |
| SRC-10 | [Microsoft domain analysis](https://learn.microsoft.com/en-us/azure/architecture/microservices/model/domain-analysis) | ER; business-first architecture guidance reviewed earlier in this conversation | Not a technology recommendation or mandate for microservices |
| SRC-11 | [Safe Work Australia duties guidance](https://www.safeworkaustralia.gov.au/law-and-regulation/duties-under-whs-laws/duties-pcbu) | ER; accountability context reviewed earlier in this conversation | Model-law guidance; actual jurisdiction and work scope require review |
| SRC-12 | [Farm Biosecurity: people, vehicles and equipment](https://www.farmbiosecurity.com.au/essentials-toolkit/people-vehicles-equipment/) | ER; horticultural access/hygiene context reviewed earlier in this conversation | Site requirements require customer/competent confirmation |
| SRC-13 | [ASD operational-technology security principles](https://www.cyber.gov.au/business-government/secure-design/operational-technology-environments/principles-of-operational-technology-cyber-security) | ER; controlled OT integration boundary reviewed earlier in this conversation | No assessment of actual customer networks |
| SRC-14 | [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) | ER; proposed accessibility baseline; rechecked for v01 | No implementation conformance assessment performed |

### A.2 Previously observed Smartsheet source locations

These links identify the earlier sample; access and content may change. They are not statements that the records are currently complete or approved.

- [Master Project Register — PROTOTYPE](https://app.smartsheet.com/sheets/5PPgrmXp3QJj3GF6m9q8RXgRWrwQXQQqQVq6vPc1)
- [Deliverables & Handover template — PROTOTYPE](https://app.smartsheet.com/sheets/7jxqMXFvFv6jGv6MpV3M5wrJ82hj4MV9qQ2wRfg1)
- [Site Readiness & Commissioning template — PROTOTYPE](https://app.smartsheet.com/sheets/5m6mHcJqJjJGfjR34qFj5wR6gM48JPGcXM8phXV1)
- [Service Scheduling Intake — PROTOTYPE](https://app.smartsheet.com/sheets/C3R2mv9pCQ943XCrXWpMCfWjPC33xh76PfJprgV1)
- [Financial Definitions — PROTOTYPE](https://app.smartsheet.com/sheets/ChH9Wgcc7Vx24gfQR8f4pmRrc2hJwhJj7M7Xcq51)
- [Technician Competency Profiles — PROTOTYPE](https://app.smartsheet.com/sheets/h2q5FfFVCv9PvcrmH3jRQFhvHv7xc3cGj4M9J831)

### A.3 Attachment identity

The following SHA-256 fingerprints identify the supplied files inspected as source material for this work. They identify bytes, not the truth or completeness of the described implementation.

~~~text
CREMS Field Guide.docx
188231d8ba0dbc3dbebdbd0e6a2a6ddb24c3464a7463aa61ae77c34c0da6a94a

CREMS Field Guide.pdf
94841a4b6451822029089db813aefbf8dd1c4ea43995395a3d31b53785b6aaa4

CREMS Field Guide(1).html
12a71d097130f8298cef3eaf51a7d382d31b1921a7bbecc2b42b1145f0e5e51e
~~~

---

## Appendix B — Requirement-to-source and acceptance traceability

This matrix maps requirement families and material user needs to evidence, planned detailed specifications and representative acceptance. It is not a claim that every detailed test is already written or executed.

| Need / requirement family | Evidence basis | Blueprint/specification home | Representative acceptance |
|---|---|---|---|
| Professional integrated platform and shared identity | SRC-01, SRC-02, SRC-10; proposed controls | Sections 04–08; BP-01/BP-02; BR-01/BR-02 | AT-01, AT-02, AT-21, AT-22 |
| CRM relationship development and Pipedrive outcomes; CRM-01–CRM-08 | SRC-01, SRC-04; proposed expansion | Section 09; BP-03 | AT-01, AT-02, AT-03, AT-24 |
| Estimating, questions, versions and conversion; EST-01–EST-09 | SRC-01, SRC-02, SRC-03; proposed control improvements | Section 10; BP-04 | AT-03, AT-04, AT-05 |
| Engineering/design and CAD coordination; ENG-01–ENG-07 | SRC-01, SRC-05, SRC-06; proposed expansion | Section 11; BP-05 | AT-15, AT-17, AT-20 |
| Project delivery and commercial controls; PRJ-01–PRJ-08 | SRC-01, SRC-05, SRC-06; proposed expansion | Section 12; BP-06 | AT-09, AT-15, AT-16, AT-17, AT-24 |
| Job packs, dispatch, history and field execution; SVC-01–SVC-12 | SRC-01, SRC-05, SRC-09; proposed solution to stated issues | Section 13; BP-07 | AT-06–AT-14, AT-19 |
| Inventory/purchasing/shipping integration; SCM-01–SCM-08 | SRC-01, SRC-05, SRC-07; proposed workflow | Section 14; BP-08 | AT-12, AT-16, AT-18 |
| Accounts, invoices and project performance; FIN-01–FIN-08 | SRC-01, SRC-05, SRC-07; proposed definitions/control | Section 15; BP-09 | AT-02, AT-12, AT-18 |
| SharePoint and controlled outputs; DOC-01–DOC-06 | SRC-01, SRC-02, SRC-08 | Section 16; BP-02 and module outputs | AT-01, AT-07, AT-13, AT-20 |
| QHSE, skills, biosecurity, aftercare and OT limits | SRC-01, SRC-05, SRC-11–SRC-13; proposed supporting functions | Section 17; shared policies and relevant modules | AT-06, AT-08, AT-15, AT-17, AT-19 |
| Cross-module authority and state rules; BR-01–BR-24 | User goals plus proposed control design | Section 18; every affected module | AT-01–AT-24 as applicable |
| External updates and recovery; IF-01–IF-10 | SRC-02, SRC-03, SRC-07–SRC-09; proposed interfaces | Section 19; BP-02 | AT-05, AT-11, AT-18, AT-20–AT-22, AT-24 |
| Security, UX and operability; NFR-01–NFR-12 | SRC-01, SRC-10, SRC-13, SRC-14; proposed targets | Sections 20–21; BP-02 | AT-01, AT-08, AT-10, AT-11, AT-22, AT-23 |
| Outcomes, rollout and acceptance | SRC-01; proposed programme design | Sections 22–30; all blueprints | KPI-01–KPI-15, G0–G5 and applicable AT scenarios |

Source locators for CREMS detail include “Starting an enquiry,” “The questionnaire,” “Building the cost estimate,” “Screen Systems configurations,” “Getting the estimate approved,” “Building the quote,” and “Sending it to MYOB and converting to an order.” Physical implementation remains subject to D-005/D-006/D-009.

---

## Appendix C — Controlled business glossary

| Term | Meaning in this blueprint |
|---|---|
| Account | A context-dependent record; explicitly distinguish relationship organisation from ERP legal/financial account |
| Site | Physical place where equipment or work is located |
| Facility/area | Organised subdivision of a site, such as a greenhouse or block |
| Asset | Identifiable installed/customer equipment or system with lifecycle history |
| Opportunity | One commercial pursuit; may have alternative options and revisions |
| Option | Alternative proposed solution; not automatically additional forecast revenue |
| Revision | A controlled successor version of defined content |
| Estimate | Internal cost/pricing basis with assumptions and approvals |
| Quotation | Customer-facing offer with controlled terms, scope and version |
| Route | Approved business/ERP conversion pathway |
| Project class | Level of delivery controls based on complexity/risk; distinct from route |
| Work package | Defined scope/deliverable grouping for planning and execution |
| Case/ticket | Customer request, problem or support issue |
| Work order | Authorised scope of operational work |
| Appointment | Specific attendance/resource booking against work |
| Job pack | Issued preparation information for the assigned work/visit |
| Technical release | Authorisation to use a specific design revision for a defined purpose |
| Transmittal | Record of exactly what technical documents were formally issued, to whom and why |
| As-built | Reviewed record of the installed configuration; field notes alone do not establish approval |
| Variation | Proposed or approved change to an existing commercial commitment |
| Source of truth | System/owner authoritative for the identified record or field |
| Reconciliation | Evidence that mapped source/target information agrees under approved definitions |
| Unknown outcome | An external action may have completed, but its result is not yet established |
| RPO / RTO | Maximum accepted recovery data-loss interval / target restoration duration |
| PMO | Project-governance and support capability; not automatically the owner of every project |
| QHSE | Quality, Health, Safety and Environment assurance function |
| OT | Operational technology, including customer equipment/control environments |
| PDM | Product/design data management supporting native design information and relationships |

---

## Appendix D — Document assurance and review record

### D.1 Assurance scope

The authoring review checks this document against the agreed conversation scope, source distinctions, module coverage, ownership boundaries, release proposal and internal references. Structural checks cover section sequence, register IDs, local navigation links, table structure and Markdown parsing.

Structural validation for this issue confirmed 30 numbered sections, four appendices, 34 valid internal navigation links and 44 consistently parsed Markdown tables. The controlled registers contain 66 functional requirements, 12 non-functional requirements, 24 business rules, 10 interfaces, 24 planned acceptance scenarios and 28 open decisions. Expected register sequences and referenced IDs were checked with no unresolved structural errors.

Document assurance does not constitute approval of the operating model, independent professional certification, software testing, security assessment, financial reconciliation or verification of the live source systems.

### D.2 Coverage checklist

| Review area | Location / treatment |
|---|---|
| Business concept and outcomes | Sections 01, 04 and 22 |
| Source evidence and uncertainty | Sections 02–03, 29 and Appendix A |
| Departmental responsibilities | Section 05 |
| Five complete business journeys | Section 06 |
| Shared data, architecture and authority | Sections 07–08, 18–19 |
| Seven business modules | Sections 09–15 |
| SharePoint, QHSE, people and supporting scope | Sections 16–17 |
| Mobile, UX, security and operability | Sections 13, 20–21 |
| Nine-document set and staged specification | Section 23 |
| Release strategy, pilot and acceptance | Sections 24–26 |
| Migration, delivery ownership and support | Sections 27–28 |
| Decisions, risks and immediate action plan | Sections 29–30 |
| Requirement/evidence/test linkage | Appendix B |

### D.3 Business review record

| Review role | Decision at issue | Required review |
|---|---|---|
| Executive sponsor | Not recorded | Direction, scope, ownership and discovery mandate |
| Product owner/requester | Not recorded | Coverage, priorities and open-decision ownership |
| Commercial/Estimating | Not recorded | CRM, scope, costing, pricing and commitments |
| Engineering/Projects | Not recorded | Technical authority, delivery and handover |
| Service/Supply Chain | Not recorded | Dispatch, field work, materials and support |
| Finance | Not recorded | ERP authority, financial definitions and controls |
| Systems/QHSE | Not recorded | Security, operability and applicable assurance requirements |

### D.4 Issue statement

v01 is issued for business review as a discovery and design baseline. Only this Markdown blueprint is delivered by the current task. The remaining blueprints, technical proofs, implementation, migration and production approvals remain future work.

**End of document.**
