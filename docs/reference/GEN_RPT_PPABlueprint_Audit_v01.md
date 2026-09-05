# Powerplants Business Operations Platform

## Master Blueprint v01 — Completeness, Evidence & Build-Readiness Audit

**Author-led assurance review — issued for business review**

| Document control | Value |
|---|---|
| Prepared for | Powerplants Australia — Dean Fiedler |
| Audit reference | GEN_RPT_PPABlueprint_Audit_v01 |
| Date | 4 September 2026 — UTC |
| Document audited | GEN_SPC_PPABusinessPlatform_MasterBlueprint_v01.md |
| Baseline | v01, 137,275 bytes; exact fingerprint in Appendix D |
| Review scope | Business completeness, source treatment, cross-module consistency, development readiness and document quality |
| Audit disposition | Strong discovery baseline; targeted amendments and release-specific specifications required |
| Findings | 16: eight P1, seven P2 and one P3; priorities defined in Section 05 |
| Changes made | This audit report only; the audited blueprint and business systems were not changed |
| Review status | Author's assessment; business-owner approval and independent technical assurance are not recorded |

> **Professional judgement:** v01 captures the main business vision, all seven core modules and the central service problems well. It does not yet capture every behaviour needed to build the complete platform. The most valuable next improvement is stronger source-to-requirement traceability, explicit interface coverage and a more concrete first-release specification. Adding more general narrative would offer less value.

---

## Contents

1. [Audit conclusion](#01-audit-conclusion)
2. [Method, evidence and limitations](#02-method-evidence-and-limitations)
3. [What v01 captures well](#03-what-v01-captures-well)
4. [New and refreshed evidence](#04-new-and-refreshed-evidence)
5. [Prioritised finding register](#05-prioritised-finding-register)
6. [Detailed findings and closure requirements](#06-detailed-findings-and-closure-requirements)
7. [CREMS preservation and change assessment](#07-crems-preservation-and-change-assessment)
8. [CRM parity and operational reporting](#08-crm-parity-and-operational-reporting)
9. [First-release definition required](#09-first-release-definition-required)
10. [Recommended revision and work sequence](#10-recommended-revision-and-work-sequence)
11. [What can and cannot be concluded](#11-what-can-and-cannot-be-concluded)

Appendices: [A — Requirement review](#appendix-a--review-of-every-controlled-requirement) · [B — Section and source coverage](#appendix-b--section-and-source-coverage) · [C — Evidence register](#appendix-c--evidence-register) · [D — Verification record](#appendix-d--verification-record)

---

## 01. Audit conclusion

### 1.1 Am I satisfied with v01?

I am satisfied with its business direction, breadth and treatment of important boundaries. It is a substantial, professional master blueprint and a useful basis for discovery and stakeholder review.

I would improve it before treating it as the controlling reference for a funded development release. Several requirements remain grouped at a high level, some documented CREMS behaviours lack an explicit future disposition, and the purchasing/fulfilment interface catalogue is less complete than the business capabilities it is intended to support.

The document itself acknowledges that it is a discovery baseline and that detailed specifications remain future work. This audit respects that purpose: a missing physical database schema is an expected later deliverable, whereas an unlisted business interface or an unclear requirement boundary deserves a master-level amendment.

### 1.2 Fitness for purpose

| Intended use | Assessment | Reason |
|---|---|---|
| Explain the company-wide platform concept | Suitable | Clear scope, retained systems, operating responsibilities and journeys |
| Facilitate discovery and departmental review | Suitable, with this audit | Known uncertainties and decision gates are visible |
| Brief potential delivery partners | Suitable for initial discussion | Provides business context and programme boundaries |
| Compare binding fixed-scope implementation proposals | Insufficient on its own | Required behaviour, interfaces, data and release boundaries need more precision |
| Implement the first service release | Insufficient on its own | BP-02/BP-07 and the applicable shared contracts still need to be developed |
| Replace all Pipedrive or CREMS functionality | Completeness not established | No completed feature-parity/disposition register or executed regression evidence |
| Authorise production deployment or legacy retirement | Insufficient | Business approval, testing, migration and operational evidence remain outstanding |

### 1.3 Recommended decision

Retain v01 as the issued baseline. Prepare a targeted **v02 — Scope Assurance & Development Planning Edition**, preserving its 30-section structure and stable requirement IDs.

The revision should add the missing master-level registers and incorporate the new GitHub discussion. In parallel with that document work, develop the architecture and first-service-release specifications to the depth needed for their next decision gate. The proposed name **Powerplants One** and use of GitHub remain recommendations; the user has expressed interest but has not explicitly adopted the name or authorised repository creation in this audit request.

---

## 02. Method, evidence and limitations

### 2.1 Work performed

- Resolved the exact issued v01 document and reviewed its 30 numbered sections and four appendices.
- Reviewed all 66 functional requirement rows and all 12 non-functional requirement rows; Appendix A records the result for each.
- Checked the rule, interface, acceptance, decision, risk, work-package and source registers for sequence and reference integrity.
- Re-ran Markdown structural checks, internal-navigation checks and source-file fingerprints.
- Indexed all 16 CREMS guide chapters and compared selected material behaviours directly with the guide text, supported by the existing CREMS v05 report.
- Rechecked the current Pipedrive stage listing through the connected account.
- Inspected the Smartsheet US prototype workspace's top-level inventory and four relevant folders; reconciled all six Smartsheet source links listed in v01 against returned metadata.
- Read three selected Smartsheet control/template sheets: Scheduling Conflict Rules, Project Plan & Milestones, and Financial Definitions.
- Reviewed the subsequent naming/GitHub discussion and selected official vendor documentation.

### 2.2 Evidence hierarchy

User instructions establish the intended business outcome. Supplied guide text establishes documented CREMS behaviour. Connected-system results establish the configuration or records returned at the time of retrieval. Public vendor documentation establishes possible product capabilities, subject to the actual account and configuration.

Previous reports and retrieved conversation context assist interpretation but do not replace primary configuration or transaction evidence. A prototype record labelled “Proven” or “Passed” is an observed record status; this audit has not independently re-performed the financial calculation behind it.

### 2.3 Scope limits

This is a document and requirements audit. It is not a live CREMS code audit, a complete Pipedrive account audit, a full Smartsheet portfolio audit, a financial assurance engagement or a production security assessment.

The CREMS comparison covered its full chapter inventory and targeted high-impact detail. It did not repeat a page-by-page visual audit of every guide screenshot or manually re-evaluate every statement in the approximately 70,000-word extracted guide. Consequently, this report does not claim exhaustive field/button/formula parity.

The original 60-deal Pipedrive sample described in v01 was not reproduced. The current stage retrieval provides new, narrower evidence; it does not retrospectively verify that historical sample or establish complete feature usage. The Smartsheet inspection covered selected assets, without browser rendering or changes.

No actual MYOB endpoint, SharePoint tenant policy, CAD file relationship, device behaviour or integration transaction was tested. Missing implementation evidence remains open rather than being filled with assumed technical facts.

---

## 03. What v01 captures well

### 3.1 User requirements

| Stated business need | Coverage in v01 | Audit judgement |
|---|---|---|
| A professional, integrated company web application | Sections 01, 04, 07–08 and 20–21 | Clearly captured |
| Strong CRM and relationship-development capability | Section 09 | Purpose captured; detailed parity incomplete |
| Preserve and improve CREMS estimating | Sections 03, 06 and 10 | Core concepts captured; explicit preservation decisions required |
| Project coordination and Smartsheet replacement potential | Section 12 and Section 27 | Captured; migration/reuse needs a concrete inventory |
| Engineering and CAD coordination | Section 11 | Captured as a core module, with appropriate specialist-tool boundaries |
| Tickets, maintenance and field service | Section 13 | Captured with substantial operational detail |
| Issued job packs before field work | Sections 13.2–13.3 | Directly addressed, including revisions and acknowledgement |
| Visual technician scheduling and rearrangement | Section 13.4 | Directly addressed, including concurrency and change communication |
| Previous work, issues, fixes and technician context | Sections 07.4 and 13.5 | Directly addressed, including provenance and unresolved issues |
| Labour, parts, sign-offs and reports | Sections 13.7 and 15 | Captured with separate capture, approval and ERP-processing states |
| Inventory, purchasing, shipping and logistics | Section 14 | Business scope captured; interface detail needs amendment |
| MYOB as authoritative ERP with account/invoice visibility | Sections 07, 15 and 19 | Clearly captured; transaction definitions remain to be validated |
| SharePoint document storage | Section 16 | Clearly captured, including exact issued versions and access |
| People, QHSE, systems and broader departmental responsibilities | Sections 05 and 17 | Captured at a proportionate supporting level |
| Large horticultural projects as well as routine transactions | Five journeys in Section 06 | Captured without applying major-project controls to every sale |

No core department requested in this conversation is wholly absent. The main issue is depth and traceability within the included capabilities.

### 3.2 Controls worth preserving

The document correctly separates CRM stage from ERP commitment; estimate, quote and accepted commercial baseline; customer acknowledgement from authority to charge; engineering release from purchasing approval; shipment arrival from material readiness; and operational completion from accounting closure.

It also correctly handles stale and unknown results, partial external success, offline limitations, role-sensitive information, company-specific ERP identity and phased migration. Its distinction between user intention, guide evidence and proposed future behaviour is a significant strength.

### 3.3 Structural verification

The audit reproduced the stated structural inventory: 30 numbered sections, four appendices, 34 valid internal navigation links, 44 Markdown tables, 66 functional requirements, 12 non-functional requirements, 24 business rules, 10 interface families, 24 planned acceptance scenarios and 28 open decisions. No missing sequence or undefined referenced register ID was found by the structural checks.

These counts establish document integrity. They do not establish that every business behaviour has an adequate requirement or test.

---

## 04. New and refreshed evidence

### 4.1 Pipedrive stage configuration

The current account response returned ten stage records across two pipeline IDs, with no further cursor. Pipeline names were not returned and have not been inferred.

| Pipeline ID | Stage sequence returned | Configured stage probabilities |
|---|---|---|
| 1 | Lead → Qualification → Estimating → Quote → Negotiation → Closing | 0%, 10%, 20%, 40%, 80%, 90% |
| 6 | Enquiry → Quoted → Order Confirmed → Awaiting Delivery | 10%, 40%, 90%, 95% |

The records also contain enabled deal-age/rotting settings, with thresholds varying by stage. This is concrete configuration for the CRM discovery inventory, not evidence that those probabilities are calibrated or that users consistently follow the stages.

The stage named **Lead** is a deal-pipeline stage; its name does not prove that the separate Pipedrive lead entity is being used. Likewise, **Order Confirmed** is a stage label, not proof of an ERP order, payment or closed-won deal status. Migration and forecasting rules must preserve these distinctions. [E-04]

### 4.2 Smartsheet scheduling controls

All eight records in the sampled Scheduling Conflict Rules sheet were **Design Only**, with **Enabled = False**. They describe overlap, unavailability, capacity, competency, travel, readiness, project linkage and approaching unconfirmed work. [E-06]

This confirms a useful design source. It does not prove that automated conflict prevention operates today. v01 handles prototype evidence cautiously, and that caution should be retained in v02.

### 4.3 Project dependencies and ownership

The sampled Project Plan & Milestones template contains 25 template rows, a native **Predecessors** column and returned FS/SS relationships. It also retains **Predecessor Ref**, whose text is not always equivalent to the native dependency list. For example, task PT-0006 has native predecessors `4FS, 5FS` while its legacy reference lists PT-0005. [E-07]

A migration must nominate the dependency authority and translate stable relationships; importing the legacy text alone could lose dependencies. This read did not test date recalculation or validate every project schedule.

The same template assigns **Approve design release** to Project Manager, whereas v01 proposes Engineering authority for technical release. This is a source-to-target responsibility decision, not automatically a defect in either model: the future workflow should separate coordination of the release gate from technical authorisation and document the agreed mapping. [E-07; v01 Sections 05 and 11]

### 4.4 Financial-definition controls

The sampled Financial Definitions sheet contains separate definition and reconciliation statuses. Open Committed Costs is marked **Pending Business Definition**; Invoice Register Gross Total is marked **Not Comparable** to the comparison measure, with reconciliation pending. [E-08]

The lesson for the new platform is specific: two matching values can still have an unresolved business definition, and two different values can refer to legitimately different measures. v01 explains the principle well; the release specification must implement the actual display/approval rules. This audit does not reproduce restricted financial amounts or approve any accounting treatment.

### 4.5 Source links and recent decisions

All six Smartsheet links in v01 Appendix A.2 matched resources returned by the current folder metadata inspection. Five of those linked sheets were checked at metadata level only; Financial Definitions was read, and the other read sheets were additional control/template sources. The linked Service Scheduling Intake and competency profiles were not re-audited row by row.

The later GitHub discussion is a legitimate new input for a revised blueprint. It should be recorded as development-tooling intent and proposed setup, with ownership, plan capabilities and repository creation still unresolved. **Powerplants One** remains a proposed working name. [E-09]

---

## 05. Prioritised finding register

**P1** means resolve the relevant master boundary or release-specific detail before approving the affected funded build scope; it does not prevent continuing discovery. **P2** means planned elaboration or a new input needed before the affected module/pilot is accepted. **P3** means editorial or usability improvement.

Finding types distinguish **master amendment**, **planned specification detail**, **new context** and **presentation improvement**. A detail already assigned to a later blueprint is not misrepresented as a missing business module.

| ID | Priority | Finding | Treatment |
|---|---|---|---|
| F-01 | P1 | Requirement traceability and release allocation are too aggregated | Master amendment |
| F-02 | P1 | CREMS behaviours lack a complete retain/change/defer disposition | Master amendment and BP-04 detail |
| F-03 | P1 | Pipedrive feature parity is a future instruction rather than an assessed register | Master amendment and BP-03 detail |
| F-04 | P1 | Supplier, purchasing and fulfilment interfaces are not explicitly enumerated | Master amendment |
| F-05 | P1 | First-release data contracts and shared-record ownership are unresolved | Planned BP-02/BP-07 detail |
| F-06 | P1 | Lifecycle families lack executable transitions and resolved actor mappings | Planned module detail and source-to-target decisions |
| F-07 | P1 | First-release scope lacks requirement-level dependency and readiness allocation | Master amendment |
| F-08 | P1 | Financial display, approval and reconciliation rules need concrete release definitions | Planned BP-09/shared-interface detail |
| F-09 | P2 | GitHub and proposed application naming need a controlled addendum | New context |
| F-10 | P2 | Smartsheet reuse and coexistence need an asset-level transition register | Master amendment and migration detail |
| F-11 | P2 | Engineering/project controls need explicit specialist workflow coverage | Planned BP-05/BP-06 detail |
| F-12 | P2 | Service agreements, asset lifecycle and recurrence need separate detailed contracts | Planned BP-07 detail |
| F-13 | P2 | Document-output register omits several named CREMS outputs | Master amendment |
| F-14 | P2 | Security, permissions, recovery and offline targets need testable baselines | Planned BP-02/release detail |
| F-15 | P2 | Reporting catalogue is weighted towards service and lacks some commercial measures | Master amendment and module detail |
| F-16 | P3 | Executive navigation, decision presentation and repetition can be improved | Presentation improvement |

All findings are open at issue. The audit defines corrective work; it does not claim that a revised blueprint or software implementation has been delivered.

---

## 06. Detailed findings and closure requirements

### F-01 — Trace each requirement individually

**Evidence:** v01 Appendix B maps families to broad source and AT ranges. Sections 23 and 26 correctly require more detailed traceability later, but the current document cannot demonstrate individual acceptance coverage for all 78 functional/non-functional requirements.

**Impact:** a family can appear covered while a specific feature—such as account plans, supplier quotations or approval withdrawal—has no corresponding test or release allocation.

**Required improvement:** add a row per parent requirement with source locator/evidence class, business owner, intended release, dependencies, child specification, acceptance references and verification status. Decompose bundled requirements into child IDs without renumbering their parent IDs. Separate “specified”, “implemented”, “tested” and “accepted”.

**Closure:** every in-scope parent has explicit coverage or an owned gap. Every test refers to a requirement. A deferred requirement remains visible with its rationale. **Owner:** product owner/acceptance lead; master register before relevant G2 approval.

### F-02 — Make preservation and change decisions explicit

**Evidence:** Sections 03 and 10 capture CREMS concepts but do not enumerate the material legacy behaviours listed in Section 07 of this audit. The guide contains decision precedence, branching locks, questionnaire compatibility rules, configuration rerun protections and quote-printing semantics.

**Impact:** “preserve CREMS strengths” is open to interpretation. Developers may faithfully implement the broad workflow while losing important commercial controls or intentionally changing them without a recorded decision.

**Required improvement:** create a source-to-target disposition register: preserve, improve, replace through integration, defer, or retire by business decision. Include source version/location, rationale, target requirement and regression case. Treat documented weaknesses as candidates for improvement, rather than automatically cloning them.

**Closure:** every material documented commercial behaviour has a disposition and owner; unresolved hidden formulas remain explicitly unverified. **Owner:** Estimating/Engineering with Commercial and Finance; before estimating replacement design approval.

### F-03 — Assess Pipedrive parity, including mobile sales

**Evidence:** CRM-08 and Section 9.1 request a parity register, but none is supplied. Section 20.3 describes technician mobile use and estimating summaries without a specific mobile-sales workflow. The current stage retrieval supplies concrete configuration that v01 does not list.

**Impact:** a new CRM could support opportunities and contacts yet lose the daily activity, email, reminder, mobile visit or reporting behaviours staff rely on.

**Required improvement:** inventory the actual account's fields, stages, activities, automations, email/calendar usage, reports, permissions, files, mobile needs and add-ons. Use official feature documentation as a checklist, and verify account usage separately. Section 08 provides an initial review structure.

**Closure:** each required feature has a target treatment, source evidence, migration requirement and acceptance case. Explicitly assess the user's Pipedrive-equivalence objective rather than silently reducing it. **Owner:** Sales/Systems; before CRM replacement scope approval.

### F-04 — Complete the business interface catalogue

**Evidence:** SCM-03 to SCM-07 require purchasing, supplier commitments, receipts, dispatch and returns. Section 19 lists item/stock, commercial conversion and finance interfaces but no clearly named supplier master, purchase-order header/line, purchase-receipt or shipment/return interface family.

**Impact:** the supply-chain module's business scope is broader than its enumerated integrations. Read-only coordination can still require these datasets, even when every transaction is executed in MYOB.

**Required improvement:** explicitly catalogue supplier references; requisition-to-PO handoff; PO/line status and promised dates; receipt/inspection results; stock transfers and allocations if in scope; outbound fulfilment; returns/claims; and supporting financial references. For each, choose read-only, manual handoff or supported command. Then define company, keys, status mapping, refresh, partial outcomes and reconciliation.

**Closure:** every in-scope SCM action and displayed status has an authoritative dataset or documented manual process. Endpoint support is evidenced rather than assumed. **Owner:** Supply Chain/Finance/integration owner; before the affected build scope. MYOB's public REST documentation establishes an integration mechanism, not tenant-specific coverage. [MYOB REST documentation](https://enterprise-support.myob.com/adv/contract-based-rest-api) [E-12]

### F-05 — Define first-release data contracts

**Evidence:** Section 7.3 contains useful record families but delegates physical fields and choices. D-007/D-011 leave service-order, site and asset ownership open.

**Impact:** identity, required-field rules and permissions cannot be implemented reliably until the pilot's minimum records and relationships are agreed.

**Required improvement:** define the selected release's customer/company mapping, site/operator, equipment, case, work order, appointment, pack issue, report and financial-handoff contracts. Include cardinality, uniqueness, null/unknown handling, effective dates, merge/deactivation treatment and creation authority. Preserve historical links when an asset moves or an organisation changes.

**Closure:** representative pilot cases can be represented without guessed matches or conflicting writable masters. Field dictionaries distinguish app-owned content from ERP references. **Owner:** data owners/Service/Finance/architect; D-007/D-011 and relevant BP-02/BP-07 outputs.

### F-06 — Specify transitions and resolve actor differences

**Evidence:** Section 18.1 provides state families and Section 18.2 defines a transition template. It does not yet contain a complete transition register. The Smartsheet design-release task owner differs from v01's proposed technical-release authority.

**Impact:** states such as “approved”, “confirmed” or “complete” can be assigned inconsistently unless the action, authority and evidence are precise.

**Required improvement:** write the first-release transitions with source state, command, actor, preconditions, version check, evidence, outcome, notification and failure/recovery path. Resolve whether a task owner coordinates a decision or personally authorises it. Keep technician attendance, pack acknowledgement, case resolution and billing independent.

**Closure:** positive, refusal, cancellation/reopen and concurrent-change scenarios have unambiguous expected outcomes. Source-to-target role changes are recorded as proposals until accepted. **Owner:** Service/Projects/Engineering with product and acceptance leads; before applicable G2/G3 gates.

### F-07 — Allocate a complete first-release slice

**Evidence:** Sections 24–26 propose a planned-service pilot and identify broad tests. They do not allocate each requirement to Wave A, a later wave or a manual interim process.

**Impact:** the proposed small service release could expand to include substantial CRM, asset, finance, document and supply-chain work without an explicit dependency decision.

**Required improvement:** add an allocation matrix with included capability, minimum depth, prerequisites, implementation method, data owner, acceptance and excluded/deferred behaviour. Establish cohort/job-type selection criteria and baseline collection. Explain which evidence gaps actually block the first release.

**Closure:** the selected release can be estimated and tested as an end-to-end workflow; every external/manual dependency has an owner and contingency. **Owner:** product owner/Service/architect; G1 selection and G2 scope approval.

### F-08 — Make financial assurance executable

**Evidence:** Section 15 correctly distinguishes invoices, balances, revenue, commitments, forecasts and cash. AT-18 is broad. Current Smartsheet records retain unresolved definition/comparability statuses.

**Impact:** a technically successful import can still produce a misleading account or project view.

**Required improvement:** define measure grain, source fields, company/currency, document/status inclusion, tax basis, date/cutoff, formula, application relationships, tolerances and sign treatment. Specify the UI treatment for unresolved definitions and partial/stale datasets. Define who reviews a manual handoff and how the returned ERP reference is reconciled.

**Closure:** representative normal, credit/reversal, partial-payment, unapplied-payment, negative-commitment and missing-data cases are explained by Finance-approved rules. Do not import a prototype tolerance as an approved platform policy. **Owner:** Finance; applicable first-release scope under D-017, with broader detail in BP-09.

### F-09 — Add the GitHub development foundation

**Evidence:** the user raised GitHub and naming after v01 was issued. Sections 08, 21 and 28 mention repositories and release controls generally but do not describe the proposed setup.

**Required improvement:** record the proposed organisation/repository ownership, private visibility, access roles, documentation locations, requirement-to-issue links, review workflow, automated checks, environment separation and release records. Keep credentials and operational exports outside source control. Assess plan-dependent capabilities before relying on enforcement features.

GitHub Projects supports issue-linked tables, boards and roadmaps, making it suitable for tracking the blueprint-derived development backlog. This is development tracking; the company's operational project module remains a separate business requirement. [GitHub Projects documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) [E-11]

**Closure:** a reviewed development-foundation specification and repository setup checklist, followed by separately authorised creation. **Owner:** product owner/Systems. Naming remains proposed until adopted.

### F-10 — Preserve useful Smartsheet work through an explicit transition

**Evidence:** Sections 12 and 27 discuss reuse/migration broadly. Existing work includes templates, native predecessors, central controls, legacy copies and prototype data with different authority and status.

**Required improvement:** list each asset or asset class, source ID, current purpose, evidence status, fields/formulas/dependencies to retain, target requirement, coexistence owner and retirement criteria. Resolve native Predecessors versus legacy Predecessor Ref. Record the previously user-confirmed 83-project scope as historical business context, not a newly verified active-portfolio count.

The prior constraints of no Smartsheet Resource Management and unavailable WorkApps are legacy-environment inputs; refresh entitlements only if a proposed transition depends on those products. Keep SOL008 as the separate PPA Delivery System reference.

**Closure:** agreed asset dispositions and source-to-target mappings; prototype examples remain classified and no source asset is retired merely because it resembles a new screen. **Owner:** Projects/data steward/Systems; before relevant migration/replacement.

### F-11 — Expand engineering and major-project workflow definitions

**Evidence:** ENG-02 to ENG-07 and PRJ-03 to PRJ-08 contain the major concepts, but many specialist workflows are bundled.

**Required improvement:** explicitly assess technical queries/RFIs, supplier submittals, calculation/design reviews, drawing and interface registers, change impacts, inspection/test plans, defects and commissioning packages. For Projects, define subcontractor scope, obligations, variation notices, staged acceptance and closeout evidence where applicable. Maintain the boundary between technical approval, contractual approval and Finance processing.

**Closure:** each relevant workflow has an owner, record type, state model, document/evidence outputs and acceptance cases in BP-05/BP-06. Optional specialist functions are assessed rather than automatically included. **Owner:** Engineering/Projects with Commercial, Finance and QHSE.

### F-12 — Separate service agreement and asset-lifecycle contracts

**Evidence:** SVC-12 combines recurring maintenance, warranty, renewals and follow-up. Asset history is well described but the detailed lifecycle and coverage model remain undefined.

**Required improvement:** distinguish customer equipment from stock/loan units; installation/commissioning from warranty/contract start; maintenance plan from generated occurrence; customer entitlement from supplier recovery; and response commitment from appointment scheduling. Define multiple-asset visits, replacement serials, decommissioning, contract expiry and recurrence changes without duplicate work.

**Closure:** representative recurring, warranty, replacement and return-visit scenarios preserve history and use explicit coverage rules. Include only the parts selected for the pilot. **Owner:** Service/Commercial/Engineering with Finance; BP-07 and D-018.

### F-13 — Complete the output register

**Evidence:** Section 16.1 lists nine broad outputs. The guide also documents internal estimate output, estimate-line CSV, answered questionnaire PDF, blank site-capture PDF and configuration-annexure behaviour. These are not individually listed in the master register.

**Required improvement:** give every required output a stable ID, audience, trigger, source/version, included scope, confidentiality, template, approval, storage and retention rule. Distinguish internal costs from customer-safe content and distinguish a scoped export from the whole estimation.

**Closure:** every retained guide output has a disposition and test. Generated, approved, sent, delivered and acknowledged remain separate. **Owner:** Estimating/document owners/Service; before affected output implementation.

### F-14 — Baseline non-functional and permission requirements

**Evidence:** Section 21 already includes SSO/MFA, access controls, encryption, audit, recovery, monitoring and accessibility. Numeric targets are correctly labelled discussion candidates. Detailed role/action permissions and real-device offline evidence are not yet present.

**Required improvement:** approve measurable load, availability, file-volume, recovery and device limits for the selected release. Add the role/action/data matrix, revocation and lost-device behaviour, cache scope, audit retention, deployment rollback and incident ownership. Define test evidence for asynchronous attachments, retry/conflict handling and long-lived issued records.

Distinguish software deployment from business-configuration publication. Define who may amend job types, questionnaires, pricing policies, approval rules and notification settings, how changes are validated, and what happens to work already in progress when a new version is published or withdrawn.

**Closure:** every selected NFR has an agreed target and verification method; the pilot has evidenced access isolation, recovery and offline behaviour. No assertion of WCAG conformance or security certification is made merely by specifying a target. **Owner:** Systems/architect/acceptance lead with business owners.

### F-15 — Broaden the reporting catalogue

**Evidence:** Section 22 has 15 proposed measures, with seven directly focused on service preparation, scheduling or history. CRM is represented mainly through capability prose rather than an equivalent measure catalogue.

**Required improvement:** nominate role-specific report families and decisions supported. Assess pipeline ageing/conversion, activity follow-up, quote outcomes and margin exceptions, engineering workload/review age, project schedule/change exposure, purchasing exceptions and supplier performance. Keep system reporting definitions aligned with Finance where money is involved.

**Closure:** each selected dashboard has a business owner, calculation/source definition, permitted audience, freshness rule and test. Measures are prioritised by release; this is not a request to build every dashboard in Wave A. **Owner:** domain owners/product owner/Finance.

### F-16 — Improve executive usability without uncontrolled expansion

**Evidence:** v01 has clear navigation and consistent tables, but its approximately 18,300 words repeat some authority, approval and “not yet verified” caveats across sections. Key decisions are spread between the executive section, gates, risks and open-decision register.

**Required improvement:** add a concise decision brief, a current/target/transition summary and a first-release dependency view. Consolidate repeated general caveats into document conventions while preserving warnings at the point of a meaningful action. Give risk responses and decisions accountable roles and later named owners/dates. Use a small number of purposeful diagrams where they clarify ownership or event order.

**Closure:** an executive reviewer can locate the decisions and their consequences quickly, while a delivery partner can trace a requirement without hunting across multiple registers. Preserve the current IDs and 30-section navigation. **Owner:** product owner/document editor.

---

## 07. CREMS preservation and change assessment

This is a material-behaviour sample for F-02, not a complete reconstruction register. “Broadly covered” means the concept exists in v01; it does not establish exact functional parity. Future treatments below are recommendations for review.

| Material behaviour | Source locator | v01 treatment | Decision/detail needed |
|---|---|---|---|
| Ordered route rules, including Stop and prepayment-related Sales Order routing | Guide: Starting an enquiry — Follow the routing rule yourself | Routes and need for validation covered | Preserve or deliberately change precedence; test all branches and unknown answers |
| Default option and layered option/revision/estimate/quote identities | Guide: The estimation workspace — Understand options and revisions | Alternatives and baselines broadly covered | Explicit relationship model and default-selection/forecast rules |
| Option-wide and opportunity-wide branching locks | Guide: The estimation workspace — When you cannot add a revision or an option | Version control covered at a high level | Named prohibitions, unknown-status handling and reopening/revision scenarios |
| Questionnaire re-snapshot compatibility | Guide: The estimation workspace — Bring the estimation onto the latest questionnaire | Versioned definitions mentioned | Removed-answer retention, answer-type mismatch blocking, publication and state guards |
| Staged line changes and partial totals-refresh failure | Guide: Building the cost estimate | Staged update classes covered | Distinguish successfully saved lines from stale totals and define recovery |
| Below-cost, minimum-sell and target-margin treatments | Guide: Building the cost estimate — Change the rest of a line | Pricing policy broadly covered | Separate hard stops, approval escalation and advisory warnings; validate policy precedence |
| Live pricing-policy effects on old working lines | Same costing source | Stable commercial baselines proposed | Decide evaluation timing and policy versioning explicitly; do not assume legacy live behaviour is the target |
| Landed-cost allocation across quantity and currencies | Same costing source | Quantity, FX and costs broadly covered | Golden examples for unit/line freight, duty, conversion and rounding |
| Screen Systems computed overrides and diagnostics | Guide: Screen Systems configurations — Computed & preview | Specialist configuration retained in principle | Override/reset provenance; warning versus blocking error; complete input/part mapping |
| Screen Systems draft restore and formula changes | Same Screen Systems chapter | Configuration versioning broadly covered | Draft scope, formula-change notice, deliberate blanks and revalidation |
| Rerun comparison and protection of manual edits | Guide: Screen Systems configurations — Change an applied configuration | Reruns mentioned as regression cases | Added/updated/removed/hand-edited lines, ambiguous-match warning and recovery |
| Wizard rerun versus published-recipe refresh | Same Screen Systems chapter | No explicit distinction | Prevent the wrong refresh mechanism from replacing a wizard-derived configuration |
| Quote inclusion versus document visibility | Guide: Building the quote — Change a line | Controlled quotations broadly covered | Excluding price is different from hiding detail; configuration-annexure semantics need tests |
| Group discount replaces individual discounts | Guide: Building the quote — Work with a configuration | Discount policy broadly covered | Specify replacement, excluded-part handling, section/membership controls and rounding |
| Answered and blank questionnaire exports are scope-sensitive | Guide: Documents, notes, tasks and reporting — Export the questionnaire | Not individually registered as outputs | Record selected facility/filter, snapshot, answer states and export audience |
| Interrupted enquiry creation can leave records after page exit | Guide: When something goes wrong, and using CREMS on a phone — Four traps | General recovery/offline principles present | Explicit durable enquiry recovery and duplicate prevention should be assessed as an improvement |

The future platform need not reproduce every old interaction or limitation. It does need a documented decision where behaviour changes, especially where the change affects money, scope, history or downstream conversion.

The existing v05 CREMS report is a valuable source index for the more extensive field, validation, configuration and interface catalogues. Its inferred rebuild requirements must remain distinguishable from directly documented guide behaviour. [E-02; E-03]

---

## 08. CRM parity and operational reporting

### 8.1 Proposed parity-review structure

The account audit must examine actual usage as well as nominal product capability. Pipedrive's official catalogue covers pipeline and lead management, communications, automation, reporting, mobile capabilities and optional products. It is a useful completeness checklist, not proof of Powerplants' subscriptions or usage. [Pipedrive product catalogue](https://www.pipedrive.com/en/products) [E-10]

| Capability to assess | Powerplants-specific question / acceptance focus |
|---|---|
| Lead and deal distinction | Which enquiries use separate leads, and which use a deal stage named Lead? |
| Multiple pipelines | What business work belongs in pipeline 1 versus pipeline 6, and how is this preserved? |
| Stage progression and ageing | Which required fields, probabilities, ageing alerts and close rules are authoritative? |
| Activities and next action | Can owners manage overdue follow-up, reminders, meetings and visit outcomes without re-entry? |
| Email and calendar | What accounts, filing rules, visibility, attachments and calendar updates are actually required? |
| Custom fields and segmentation | Which territory, horticultural segment, product interest and decision-maker fields are used? |
| Account relationships | Can a group, billing entity, operator, consultant and site contact have distinct roles? |
| Automation | Which triggers and conditions are used; what prevents duplicate actions and unsupported commitments? |
| Forecast and reporting | What constitutes pipeline, weighted forecast, won work and authorised backlog? |
| Products and quotations | Which catalogue/quote functions belong to the new estimating module and which remain ERP-owned? |
| Document and approval history | What issued documents, activity history and decision evidence must remain accessible? |
| Mobile sales | Can staff prepare for customer visits, search context, capture notes/photos and schedule follow-up? |
| Access and administration | Which visibility groups, owner changes, exports and administrator actions are required? |
| Optional add-ons and integrations | Which are licensed/used, and which are merely candidates for evaluation? |

For each row, capture current evidence, business criticality, required outcome, target treatment, migration content, acceptance test and owner. Optional vendor features are not automatically new programme commitments.

### 8.2 Additional report families to assess

| Domain | Candidate report decisions | Definition cautions |
|---|---|---|
| CRM | Pipeline ageing, conversion, next-action compliance, territory/account activity | Distinguish lead, stage, won status and ERP commitment |
| Estimating | Quote turnaround, win/loss, approval age, price/margin exceptions | Compare equivalent revisions and avoid counting alternatives twice |
| Engineering | Workload, overdue deliverables, open reviews and technical changes | Separate task progress from released/accepted design |
| Projects | Milestones, forecast slippage, unresolved changes, readiness and closeout | State baseline and date authority; preserve partial acceptance |
| Supply Chain | Late commitments, shortages, allocation gaps, delivery and return exceptions | Actual promised dates and line-level readiness required |
| Finance | Account ageing, unapplied cash, approved project forecast and reconciliation | Finance-approved definitions and source freshness required |

These are proposed additions to a report catalogue, not measured current results or instructions to deploy all reports immediately. Existing service measures should remain, with their baselines established before benefits are claimed.

---

## 09. First-release definition required

### 9.1 Minimum release-contract matrix

The planned-service pilot remains a reasonable candidate. Before selecting it formally, the following contract should be completed for the agreed job types and users.

| Capability | Minimum decision/data needed | Acceptance evidence |
|---|---|---|
| Customer/company identity | Correct ERP company/account; relationship owner; duplicate resolution | Similar-name and wrong-company cases handled correctly |
| Site and equipment | Work location/operator; asset identity or explicit controlled unknown; relevant history | Technician reaches the correct site/equipment context |
| Intake/work order | Scope, urgency, coverage, owner and authoritative order reference | Incomplete or unauthorised work is held for review |
| Appointment | Crew, dates/timezone, travel/availability, readiness and booking version | Concurrent moves and project-date changes have controlled outcomes |
| Job pack | Exact revision, selected source documents, issue/recipients and acknowledgement | Material amendment is visible and acknowledged against the correct revision |
| Offline work | Supported device, downloaded scope, local operation IDs, expiry and reconnect rules | Restart, loss of connectivity and stale assignment do not silently lose or duplicate work |
| Time and parts | Task/visit attribution, quantities/units, reviewer and classification | Capture, approval, billability and ERP processing are distinguishable |
| Report and sign-off | Findings, evidence, exact presented version, reservations and outstanding actions | Signature or refusal is preserved without falsely closing the whole case/project |
| Financial handoff | Manual queue or proven interface; owner; ERP result/reference | A case can be traced to the reviewed financial outcome |
| Support and operation | Access model, monitoring, outage process, recovery and trained owners | Pilot support and recovery rehearsals demonstrate the agreed capability |

Every row must then be assigned an implementation method: existing-system capability, configuration, read integration, manual handoff or custom build. “Integrated” alone is not a sufficiently precise method.

### 9.2 Examples of acceptance gaps to close

These are proposed test elaborations, not executed tests or additions already made to v01.

| Parent requirement | Existing AT anchor | Detailed case needed |
|---|---|---|
| CRM-02 | AT-24 | Migrate stage, close status, probability/ageing settings and history without treating Order Confirmed as ERP confirmation |
| EST-03 / EST-06 | AT-03 / AT-04 | Rerun a configuration after a manual line edit and a formula change; preserve or explicitly resolve each difference |
| EST-05 / EST-08 | AT-04 | Demonstrate include/exclude versus print/hide and group-discount behaviour using accepted expected totals |
| SVC-03 / DOC-02 | AT-07 | Technician downloads revision 1; revision 2 is issued while offline; reconcile acknowledgement and the work actually performed |
| SCM-03 / SCM-06 | AT-16 | One PO line is partially received and quarantined; readiness reflects only the approved usable quantity |
| FIN-02 / FIN-06 | AT-18 | A partial payment and credit affect open balance while a related metric definition remains unresolved |
| PRJ-02 / PRJ-04 | AT-09 / AT-24 | Translate native dependency relationships and calendars, then request a booking change without overwriting confirmed attendance |
| NFR-01 / DOC-06 | AT-01 | A user loses access: search, file links, export and API views reflect the change; offline-cache limitations follow the approved policy |

### 9.3 Avoid creating unnecessary dependencies

The service pilot does not require full CRM replacement, every estimating calculation, advanced CAD viewing or a customer portal. It does require sufficient identity, documents, operational authority and financial handoff to complete its selected journey reliably.

A manual MYOB handoff can be legitimate if its responsibility, status, reconciliation and workload are explicit. It must not be counted as a tested automatic API. The same principle applies to temporary Pipedrive or Smartsheet coexistence.

---

## 10. Recommended revision and work sequence

### 10.1 v02 amendment package

| Work package | Concrete output | Existing home / findings |
|---|---|---|
| AP-01 | Executive decision brief, change log and proposed name/tooling status | Sections 01–03, 28–30; F-09/F-16 |
| AP-02 | Requirement-by-requirement evidence, release and acceptance register | Appendix B/Section 23; F-01/F-07 |
| AP-03 | CREMS disposition register and Pipedrive parity inventory | Sections 09–10; F-02/F-03 |
| AP-04 | Expanded business interface catalogue and source-to-target authority decisions | Sections 07, 18–19; F-04/F-05/F-06 |
| AP-05 | Selected first-release contract and dependency map | Sections 24–26; F-05/F-07/F-12/F-14 |
| AP-06 | Smartsheet asset transition and coexistence register | Sections 12/27; F-06/F-10 |
| AP-07 | Complete output/report inventory and financial definition requirements | Sections 15–16/22; F-08/F-13/F-15 |
| AP-08 | BP-02/BP-07 detailed work scopes and BP-03–BP-09 refinement plan | Section 23; remaining planned-specification findings |

Preserve the issued v01 for comparison. The recommended v02 is a distinct document edition; it should not claim that missing tenant configuration, formulas or business approvals have become verified merely because the specification is longer.

### 10.2 Practical sequence

1. Complete the master amendments that can be supported by existing evidence: individual traceability, the initial disposition/parity inventories, explicit purchasing interface families, the output gaps and GitHub planning context.
2. Assign the first-release decisions to appropriate business/system owners and collect the minimum source examples needed to resolve them. Keep owners and due dates pending until actually assigned.
3. Select the release and define its data, state, permissions, interface and operational contracts in BP-02/BP-07, with the necessary Finance and document specifications.
4. Prove the important technical assumptions in the authorised non-production environment, then use those results to estimate and approve the funded build scope.
5. Track implementation and acceptance against stable blueprint IDs; retain the evidence for every later pilot/cutover decision.

Document-only work can progress while tenant details and business decisions are collected. Unresolved later-module questions should not prevent completing useful first-release analysis.

### 10.3 v02 acceptance criteria

The revised master should be considered ready for its next review when:

- all 78 existing parent requirements have individual evidence/release/acceptance entries, with child detail or owned gaps;
- the CREMS and Pipedrive inventories have explicit dispositions, including unresolved items;
- every selected supply-chain action/status is covered by a named interface or manual handoff;
- the proposed pilot has a coherent included/deferred/dependency matrix;
- shared record, scheduling and technical-authority decisions are explicit and retain their actual approval status;
- all retained outputs have a register entry and audience/content rules;
- new GitHub and naming inputs are incorporated without being presented as completed setup;
- remaining implementation questions have a closure owner/role, evidence requirement and relevant gate;
- structural checks pass and changes from v01 are traceable.

Passing these document criteria would establish a stronger planning baseline. It would not, by itself, establish software readiness or grant production approval.

---

## 11. What can and cannot be concluded

**Established by this audit:** the main departmental scope and stated user needs are represented; the document is structurally consistent; the sampled source evidence supports its careful distinction between prototype/reference material and a proposed future system; and 16 concrete improvement areas have been identified.

**Not established:** exhaustive CREMS/Pipedrive feature parity, complete field/choice coverage, validated financial definitions, working MYOB/SharePoint/CAD interfaces, approved staffing or first-release scope, an accepted technology stack, tested mobile/offline behaviour, or production readiness.

The appropriate action is a targeted v02 and focused supporting specifications. A further generic expansion followed by another broad assurance claim would not resolve the identified gaps.

---

## Appendix A — Review of every controlled requirement

All IDs below are present in v01. This table records the content review and next elaboration, not a software pass/fail result. F-01's individual traceability requirement applies across the register, even where another finding is the more specific reference.

### A.1 CRM — eight requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| CRM-01 | Prospects, people, sites and relationships | Retain; define identities, roles and merge behaviour | F-05 |
| CRM-02 | Leads, stages, actions and outcomes | Map actual pipelines, stage ageing and close status | F-03 |
| CRM-03 | Calls, email, notes, files and tasks | Define filing, access, duplicates and actual email/calendar scope | F-03 |
| CRM-04 | Account plans, segments, visits and follow-up | Add mobile-sales workflow and measurable account-plan outcomes | F-03/F-15 |
| CRM-05 | Alternatives and commercial lineage | Retain; specify forecast/default-option treatment | F-02/F-03 |
| CRM-06 | Integrated customer context | Define record/field visibility and source freshness | F-05/F-14 |
| CRM-07 | Reviews, training, renewals and growth | Define ownership, recurrence and reviewed opportunity creation | F-12/F-15 |
| CRM-08 | Pipedrive preservation and migration | Supply the feature-level parity/disposition register | F-03 |

### A.2 Estimating — nine requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| EST-01 | Routing | Record ordered source rules and approved target differences | F-02 |
| EST-02 | Scope and questionnaires | Specify applicability, answer states, snapshots and compatibility | F-02/F-05 |
| EST-03 | Options and versions | Preserve separate revision layers and branching guards | F-02/F-06 |
| EST-04 | Cost categories and source basis | Define quantities, units, landed costs, FX and accepted examples | F-02 |
| EST-05 | Pricing and discounts | Distinguish prohibitions, escalation, warnings and print semantics | F-02 |
| EST-06 | Screen Systems | Define input/part mapping, overrides, drafts and reruns | F-02 |
| EST-07 | Estimate/quote approval | Define actor, thresholds, withdrawal and resubmission transitions | F-06/F-14 |
| EST-08 | Quote issue and customer response | Define exact output, response evidence and issue status | F-02/F-13 |
| EST-09 | One-off items and conversion | Complete operation-specific authority, matching and recovery tests | F-02/F-04 |

### A.3 Engineering — seven requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| ENG-01 | Requests, work packages and capacity | Define authorised effort, priority and workload reporting | F-11/F-15 |
| ENG-02 | Requirements, design basis and interfaces | Assess technical-query/RFI and responsibility records | F-11 |
| ENG-03 | Drawing register and authoring links | Validate CAD relationships and published-file storage | F-11/F-14 |
| ENG-04 | Reviews, revisions and issues | Resolve technical authority and formal transmittal states | F-06/F-11 |
| ENG-05 | Design materials and substitutions | Map released material demand to ERP supply interfaces | F-04/F-11 |
| ENG-06 | Technical change | Define impacts, affected releases/recipients and retest triggers | F-06/F-11 |
| ENG-07 | Commissioning and as-built handover | Define package criteria and accepted installed configuration | F-11/F-12 |

### A.4 Projects — eight requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| PRJ-01 | Initiation and project classification | Define class criteria and accepted sales handover | F-06/F-11 |
| PRJ-02 | Schedule, dependencies and baselines | Resolve native/legacy dependency migration and calendars | F-10 |
| PRJ-03 | RAID, decisions and interfaces | Define records, escalation and responsibility relationships | F-11 |
| PRJ-04 | Engineering/material/service coordination | Specify handoff acceptance and booking-change ownership | F-06/F-07 |
| PRJ-05 | Contracts and variations | Detail approvals, obligations, notices and financial treatment | F-08/F-11 |
| PRJ-06 | Tests, defects and staged acceptance | Define criteria, retests and partial acceptance | F-11 |
| PRJ-07 | Stakeholder updates and forecasts | Register audiences, outputs and report definitions | F-13/F-15 |
| PRJ-08 | Technical/commercial/service handover | Define evidence and outstanding-item ownership | F-06/F-11/F-12 |

### A.5 Service — twelve requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| SVC-01 | Ticket intake and triage | Define urgency, coverage, site/asset identity and ownership | F-05/F-12 |
| SVC-02 | Work orders and appointments | Resolve authoritative system and lifecycle/cardinality | F-05/F-06 |
| SVC-03 | Job-pack issue and acknowledgement | Retain strong concept; define exact revision/recipient rules | F-06/F-13 |
| SVC-04 | Visual dispatch | Define availability, crew, travel, readiness and conflict rules | F-06/F-07 |
| SVC-05 | Rescheduling | Specify reasons, approval, communication and concurrent edits | F-06 |
| SVC-06 | Historical context | Define provenance, relevance, suspected/confirmed and asset changes | F-05/F-12 |
| SVC-07 | Offline work | Prove local durability, assignment changes and conflict recovery | F-14 |
| SVC-08 | Time capture | Define actual/reviewed/billable measures and correction | F-08/F-12 |
| SVC-09 | Parts use and returns | Link approval, stock identity and ERP outcomes | F-04/F-08 |
| SVC-10 | Inspections, evidence and reports | Specify forms, attachment processing and technical context | F-12/F-13 |
| SVC-11 | Customer acknowledgement | Define exact content, reservations and later amendments | F-06/F-13 |
| SVC-12 | Maintenance, warranty and follow-up | Split into testable agreement/recurrence/coverage child requirements | F-12 |

### A.6 Supply Chain — eight requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| SCM-01 | Forecast and approved demand | Define demand/commitment distinction and required dates | F-04/F-05 |
| SCM-02 | Items, warehouses and purchasing | Enumerate authoritative dataset and availability semantics | F-04 |
| SCM-03 | Requisitions, approval and supplier quotes | Add explicit supplier/PO handoff contracts | F-04 |
| SCM-04 | Supplier commitments and milestones | Define confirmed versus estimated dates and updates | F-04/F-15 |
| SCM-05 | Inbound shipment allocation | Define many-to-many line allocations and partial quantities | F-04/F-05 |
| SCM-06 | Receipt, inspection and quarantine | Specify receipt/availability rules and exceptions | F-04 |
| SCM-07 | Dispatch, returns and supplier claims | Add fulfilment/return interfaces and evidence | F-04/F-12 |
| SCM-08 | Readiness and impact reporting | Define readiness calculation and owned schedule-change requests | F-06/F-15 |

### A.7 Finance — eight requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| FIN-01 | Accounts and balances | Define fields, scope, currency, status and freshness | F-08 |
| FIN-02 | Invoice/payment/credit applications | Test partial applications, reversals and unapplied amounts | F-08 |
| FIN-03 | Financial review and exceptions | Define delegated authority and ERP credit-status checks | F-08/F-14 |
| FIN-04 | Project actuals and forecasts | Define mutually exclusive components and approved source grain | F-08 |
| FIN-05 | Claims and contract evidence | Specify claim readiness, variation and invoice handoff | F-08/F-11 |
| FIN-06 | Reconciliation | Define checks, tolerance, exceptions and display blocking | F-08 |
| FIN-07 | Measure dictionary | Obtain approved definitions, including unresolved-source cases | F-08 |
| FIN-08 | Profitability and cash timing | Register role-sensitive reports and calculation/approval status | F-08/F-15 |

### A.8 Shared documents — six requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| DOC-01 | Stable references | Validate supported move/rename and exact-version retrieval | F-13/F-14 |
| DOC-02 | Working, approved and issued content | Define immutable issue evidence and amendment behaviour | F-06/F-13 |
| DOC-03 | Generated outputs | Add omitted CREMS output types and audience rules | F-13 |
| DOC-04 | Technical knowledge | Define review, applicability, expiry and superseded treatment | F-11/F-12 |
| DOC-05 | Communication and delivery | Define approval, retry, delivery and acknowledgement outcomes | F-06/F-13 |
| DOC-06 | Access and confidentiality | Test repository/app alignment, search, links and exports | F-14 |

### A.9 Non-functional requirements — twelve requirements

| ID | Existing subject | Audit treatment / detail required | Finding |
|---|---|---|---|
| NFR-01 | Server-enforced access | Define and test action/record/field scope and isolation | F-14 |
| NFR-02 | Attributable audit | Define event content, retention and tamper protection | F-06/F-14 |
| NFR-03 | Credential/data protection | Approve identity, secret, encryption and device design | F-14 |
| NFR-04 | Performance | Baseline load, dataset, device and percentile measurement | F-14 |
| NFR-05 | Degraded operation | Test partial/stale/unavailable data and blocked actions | F-07/F-14 |
| NFR-06 | Recovery | Approve RPO/RTO by data class and rehearse restoration | F-14 |
| NFR-07 | Offline durability | Test restart, duplicate retry, conflicts and reassignment | F-14 |
| NFR-08 | Accessibility | Define representative workflows and conformance evidence | F-14 |
| NFR-09 | Duplicate/conflicting commands | Prove concurrency and unknown-outcome recovery | F-04/F-06/F-14 |
| NFR-10 | Retention/export/deletion | Define issued evidence, legal holds and device scope | F-13/F-14 |
| NFR-11 | Monitoring and alerts | Define thresholds, owners and usable diagnostics | F-14 |
| NFR-12 | Maintainability/portability | Add development/release ownership and export/recovery evidence | F-09/F-14 |

---

## Appendix B — Section and source coverage

### B.1 All 30 master sections

| Section | Review result | Follow-up |
|---|---|---|
| 01 Executive direction | Coherent business purpose and priorities | Clearer decision brief; F-07/F-16 |
| 02 Purpose/governance | Evidence classes and draft status clear | Add individual traceability; F-01 |
| 03 Evidence baseline | Appropriate limitations | Refresh source/decision entries; F-02/F-03/F-10 |
| 04 Scope/principles | All core modules and proportionate boundaries present | Keep parity/disposition decisions explicit; F-03 |
| 05 Operating model | Sensible proposed accountabilities | Resolve named authority and source differences; F-06 |
| 06 Journeys | Five useful lifecycle summaries | Detail handoff/exception contracts; F-06/F-07 |
| 07 Information model | Strong entity and source-authority distinctions | Selected-release field/relationship dictionary; F-05 |
| 08 Architecture | Appropriate conceptual level | BP-02 decisions and GitHub context; F-09/F-14 |
| 09 CRM | Relationship purpose clearly included | Actual feature parity and mobile sales; F-03 |
| 10 Estimating | Core commercial control captured | CREMS disposition and detailed regressions; F-02 |
| 11 Engineering | Core technical authority and document controls included | Specialist workflows and source roles; F-06/F-11 |
| 12 Projects | Dependencies, changes and handover included | Source transition and detailed contracts; F-10/F-11 |
| 13 Service | Strong response to stated user problems | Executable pilot and recurrence/asset contracts; F-05/F-06/F-12 |
| 14 Supply Chain | Business capability broad enough | Named interface coverage; F-04 |
| 15 Finance | Correct conceptual boundaries | Approved concrete definitions/tests; F-08 |
| 16 Documents | Good issue/version/access principles | Complete named output inventory; F-13 |
| 17 Supporting functions | Appropriate conditional scope | Relevant controls in module specifications; F-11/F-12/F-14 |
| 18 Rules/states | Valuable separation of state families | Actual transition records and permissions; F-06 |
| 19 Integrations/updates | Strong partial/unknown-result treatment | Operation-specific contracts, especially supply; F-04 |
| 20 UX/mobile | Clear screen families and field emphasis | Mobile sales and detailed first-release screens; F-03/F-07 |
| 21 Security/NFRs | Important topics already present | Measurable release baselines; F-14 |
| 22 Measures | Useful service measures and definitions | Broader report catalogue; F-15 |
| 23 Specification set | Nine-document set appropriately defined | Individual links and first-release detail; F-01/F-07 |
| 24 Delivery sequence | Sensible provisional waves/gates | Dependency and scope allocation; F-07 |
| 25 First release | Complete intended service journey | Explicit minimum scope/data/authority; F-05/F-07 |
| 26 Acceptance | Useful planned scenarios; no execution claim | Requirement-level cases and results; F-01 |
| 27 Migration | Correct one-writer and reconciliation principles | Asset-level transition and native dependencies; F-10 |
| 28 Delivery/support | Ownership, costs and support recognised | GitHub development foundation; F-09 |
| 29 Decisions/risks | Open status and proposed owner roles visible | Operational tracking and assignment; F-07/F-16 |
| 30 Next work/review | Useful review sequence | Prioritise evidence-backed amendments; F-16 |

### B.2 CREMS chapter inventory

“Inventory” means the chapter/topic list was mapped to the blueprint, not that every paragraph or screenshot was re-audited. “Targeted detail” means selected substantive passages were directly compared during this audit.

| Guide chapter | Blueprint home | Review depth this audit |
|---|---|---|
| Getting started | Sections 09/20/21 | Inventory |
| How the whole process fits together | Sections 03/06/10/19 | Inventory; secondary route/interface comparison |
| Leads | Sections 09/10 | Inventory; secondary entry-path comparison |
| Starting an enquiry | Sections 06/10/19 | Targeted detail: route precedence and unknown outcomes |
| Customers, sites and opportunities | Sections 07/09 | Inventory |
| The estimation workspace | Sections 10/18 | Targeted detail: options, branching and re-snapshot |
| Facilities and scope | Sections 07/10 | Inventory |
| The questionnaire | Sections 10/16 | Inventory; related snapshot/export detail in other chapters |
| Building the cost estimate | Section 10 | Targeted detail: line changes, thresholds, landed cost and staged saves |
| Screen Systems configurations | Section 10 | Targeted detail: preview, overrides, draft restore, apply and rerun |
| Getting the estimate approved | Sections 10/18 | Inventory; related pricing controls |
| Building the quote | Sections 10/16/18 | Targeted detail: inclusion, visibility and group discount |
| Sending it to MYOB and converting to an order | Sections 10/19 | Inventory; selected secondary interface catalogue |
| Documents, notes, tasks and reporting | Sections 09/16/20/22 | Targeted detail: scoped questionnaire outputs; secondary output register |
| When something goes wrong, and using CREMS on a phone | Sections 19–21 | Targeted detail: interrupted enquiry and mobile recovery |
| Who can do what, glossary, and what is not built yet | Sections 02/18/21 and glossary | Inventory |

No chapter family is wholly without a target home. This does not establish that every behaviour within each chapter has been retained: F-02 is required to close that assurance gap.

---

## Appendix C — Evidence register

| ID | Evidence | Use and limitation |
|---|---|---|
| E-01 | GEN_SPC_PPABusinessPlatform_MasterBlueprint_v01.md | Exact audit target; 30 sections/four appendices and controlled registers reviewed |
| E-02 | Supplied CREMS Field Guide DOCX, PDF and HTML; existing DOCX text extract | Source fingerprints verified; chapter inventory and targeted text comparison, without full screenshot audit |
| E-03 | GEN_RPT_CREMS_Current_State_and_Rebuild_Specification_v05.md | Secondary index and selected route/interface/output sections; proposed rebuild controls are not live-code proof |
| E-04 | Connected Pipedrive stage response, retrieved 4 September 2026 UTC | Ten stage records, pipeline IDs 1/6, no further cursor; no full account/feature audit |
| E-05 | Smartsheet US workspace 5845693727303556, top level and four folders | Metadata inspection; six v01 source links matched; no production approval inferred |
| E-06 | [Scheduling Conflict Rules — PROTOTYPE](https://app.smartsheet.com/sheets/rW3WQV63H7QRvC4rChgmGFgrFcc8vXH9hmqP3Hm1), sheet 8359937850691460 | Eight returned rules; Design Only and disabled; no execution testing |
| E-07 | [Project Plan & Milestones — PROTOTYPE](https://app.smartsheet.com/sheets/RqCmhPmwW794MV2w4q52gqQw2P5PpP7WMHRFH3x1), sheet 5570243312177028 | 25 returned template rows; native dependency values and role assignments inspected; no Gantt recalculation test |
| E-08 | [Financial Definitions — PROTOTYPE](https://app.smartsheet.com/sheets/ChH9Wgcc7Vx24gfQR8f4pmRrc2hJwhJj7M7Xcq51), sheet 4967587594063748 | 13 returned control rows; definition/reconciliation statuses inspected; underlying financial calculations not re-performed |
| E-09 | User requirements, subsequent GitHub/naming discussion and relevant earlier project context | User intentions distinguished from proposed name, organisation design and first-release recommendation |
| E-10 | [Pipedrive official product catalogue](https://www.pipedrive.com/en/products) | Current vendor feature checklist; not evidence of Powerplants' licensed/used features |
| E-11 | [GitHub Projects documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects) | Development-planning capability; account/plan/setup not inspected |
| E-12 | [MYOB contract-based REST API documentation](https://enterprise-support.myob.com/adv/contract-based-rest-api) | Supported integration approach; tenant endpoints, permissions and coverage unverified |

The live connector inspections were read-only. The retrieved personal context was used to reconcile earlier constraints, not as independent proof of live configuration. No Pipedrive/Smartsheet record was created, edited, enabled, moved or deleted.

The four Smartsheet folders inspected were Portfolio Controls, Technician & Resource, Project Templates and Finance/Profitability. Their immediate inventories were returned without a further page. This was not a recursive inventory of all workspace content or all project folders.

---

## Appendix D — Verification record

### D.1 Audited baseline identity

| Item | Verified value |
|---|---|
| Filename | GEN_SPC_PPABusinessPlatform_MasterBlueprint_v01.md |
| Bytes | 137,275 |
| Word count | 18,321 by whitespace-token count; includes tables and Markdown |
| SHA-256 | `5eb13042a04f1ad6d593ea06e01ca840a82a52f50a93f0f2e405d301eda6426d` |
| Source DOCX SHA-256 | `188231d8ba0dbc3dbebdbd0e6a2a6ddb24c3464a7463aa61ae77c34c0da6a94a` |
| Source PDF SHA-256 | `94841a4b6451822029089db813aefbf8dd1c4ea43995395a3d31b53785b6aaa4` |
| Source HTML SHA-256 | `12a71d097130f8298cef3eaf51a7d382d31b1921a7bbecc2b42b1145f0e5e51e` |

All three source fingerprints match those published in v01. Fingerprints establish file identity, not source accuracy or system completeness.

### D.2 Checks and results

| Check | Result | Meaning |
|---|---|---|
| v01 main section sequence | 30, complete | No missing or duplicate numbered section |
| v01 appendices | Four | Expected appendices present |
| v01 internal navigation | 34 links resolved | Structural link targets exist |
| v01 Markdown tables | 44 parsed consistently | No inconsistent column structure detected |
| v01 requirement sequences | 66 functional plus 12 NFR entries | Expected parent IDs present and ordered |
| v01 other registers | BR 24; IF 10; KPI 15; BP 9; AT 24; D 28; R 12; WP 8; SRC 14 | Expected sequences and referenced IDs checked |
| v01 source fingerprints | Three matched | Supplied source identity consistent |
| Smartsheet source permalinks | Six matched metadata | Does not prove content completeness or current operational use |
| Audit requirement appendix | All 78 v01 requirements individually reviewed | Content-review coverage; no software testing implied |
| Audit report structure | 11 sections, four appendices, 15 navigation links and 25 tables checked | No unresolved structural errors detected |
| Audit finding references | 16 detailed findings, 12 evidence entries and eight amendment packages checked | Finding priorities and cross-references consistent |

Markdown structure and code fences were parsed. The original Mermaid diagram was not rendered for visual inspection in this audit, and no full public-link or screenshot-layout audit was performed.

### D.3 Assurance boundary and issue status

This is a second author-led review, not independent third-party certification. Its finding priorities are professional planning judgements. Business owners have not yet accepted the findings, selected the pilot or approved a revised scope through this audit.

The original v01 remains the audited baseline. This report adds a traceable improvement plan and makes the remaining uncertainty explicit. It does not assert that every system detail has been captured.

**End of audit report.**
