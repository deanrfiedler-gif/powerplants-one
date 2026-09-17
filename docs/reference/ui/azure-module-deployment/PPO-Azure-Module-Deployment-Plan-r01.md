---
document_id: PPO-AZURE-MODULE-DEPLOYMENT-PLAN
title: Powerplants One — Azure module deployment sequence
revision: r01
status: Proposed implementation and private testing sequence
evidence_date_utc: 2026-09-16
owner: Dean Fiedler
source_main_commit: d565a9de01b94aa7ad3fffe3a996f78c3aee589b
coverage_register: PPO-HTML-Page-Coverage-Register-r06.html
---

# Powerplants One — Azure module deployment sequence

Deploy usable, connected workflow increments into the existing private Azure application. Start by verifying the current hosted baseline, strengthen shared customer/location/document foundations, prove the planned-service journey, then extend sales through estimating, order conversion, Engineering, Projects and fulfilment. Add lifecycle services, management review and external experiences once their source workflows are reliable.

This plan accounts for **all 149 page briefs across 21 families**, including **143 core planning entries and six conditional extensions**. A brief can be a tab, form, panel or review flow. It is not necessarily an independent module, HTML file, Azure resource or deployment. The seven business domains remain CRM; Estimating & Quotation; Engineering & Design Control; Projects & Commercial Delivery; Service Operations; Supply Chain Management; and Finance & Commercial Controls.

**Recommendation:** use the existing TypeScript/Next.js modular monolith, PostgreSQL and durable worker. Implement the HTML designs as connected application features, with server permissions, persistent records and domain commands. Each release can extend several related pages within the same application.

The W00–W15 labels are proposed release-planning labels. They do not replace P01–P12, page IDs, parent requirements or existing implementation-package IDs. Waves are dependency order, not dates or duration estimates. Within a wave, follow the listed page order where a dependency exists; independent work can proceed when its prerequisites are available.

## 1. Evidence and current position

- **Repository:** `main` at [`d565a9de`](https://github.com/deanrfiedler-gif/powerplants-one/commit/d565a9de01b94aa7ad3fffe3a996f78c3aee589b), verified through the live GitHub branch response. This is later than the baseline shown in the STATUS header and the register’s embedded audit.
- **Coverage source:** supplied r06 HTML, read directly from the attachment. Its presentation is r06; the embedded coverage dataset remains r04, checked at `2026-09-14T20:30:44.342Z` against `42383fc2e3a85f6cf9c38c829683b14787578579`. The navigation revision does not make its implementation-status claims current.
- **Attachment SHA-256:** `672f626ddfdfc2c67287c646e97485681872b1bb29ddddedf4072917db71a770`.
- **Application already exists:** the [README](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/README.md) and [STATUS](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/STATUS.md) record merged P01–P12 code and bounded CRM, Estimating, Engineering, Projects and Email/Calendar delivery. PP-01 business acceptance remains incomplete; merged code and HTML publication are distinct evidence.
- **Newer Azure evidence:** the latest returned owner-triggered [Update Azure private demo run 34913344375](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34913344375), created 15 September 2026 UTC, succeeded on `dcabfec1b5cde1c2cf220359e6cf1c63408512d6`. Its job shows successful image build/push, database verify-or-upgrade, and web/worker image update. This is newer than the README’s `b8d33696` run. The current live Azure image, database ledger and signed-in behaviour were not directly inspected during this planning task; W00 checks them.
- **Architecture:** [BP-02](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/architecture/BP-02-platform-architecture.md) and [ADR-0003](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/decisions/ADR-0003-prototype-architecture.md) retain the modular monolith and replaceable adapter boundaries. The current [deployment workflow](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/.github/workflows/azure-demo-deploy.yml) offers `check`, `deploy` and `upgrade-and-deploy`.
- **Design priority is not deployment order:** the register’s P1/P2/P3 and new/refinement/extension classifications describe planning priority and design work. This plan sequences functional dependencies instead. No numerical completion percentage is inferred.

The register’s declared dependencies are a useful minimum, not a complete architecture. This plan also brings shared permission, identity, unit, document, financial-definition and recovery contracts forward. All interfaces remain explicitly synthetic until their live integration gate is satisfied.

## 2. Ordered deployment overview

“First wave” means the first useful bounded release or extension. Existing implemented capabilities remain available from W00. Shared workspaces gain additional source panels as those domains arrive; their first appearance does not claim their entire future scope is complete.

| Order | Deployment wave | Page briefs | Release outcome |
|---|---|---:|---|
| W00 | Azure baseline and platform controls | 7 | Establish one trustworthy online baseline and the minimum shared controls before extending business workflows. |
| W01 | Shared customer context, work and documents | 16 | Give all domains one customer/location structure and one document/work foundation. |
| W02 | Equipment, site readiness and technical evidence | 10 | Make equipment identity, horticultural constraints and technical evidence usable by Service, Estimating and Engineering. |
| W03 | Service intake, work orders, planning and job packs | 12 | Turn a request into authorised, schedulable and properly prepared work. |
| W04 | Field execution, quality, service review and Finance handoff | 10 | Complete and test the planned-service journey through field evidence, customer response and Finance reconciliation. |
| W05 | CRM, account development and governed catalogue | 10 | Extend the existing CRM into a reliable sales front end with governed product and price sources. |
| W06 | Estimating intake, costing and Screen Systems | 6 | Produce a reviewable estimate from an accepted brief and traceable calculation/cost sources. |
| W07 | Quotation lifecycle, conversion and receiving handover | 4 | Carry one exact accepted quotation into controlled conversion and an accountable receiving handover. |
| W08 | Project initiation and Engineering design control | 14 | Turn accepted sales scope into controlled project and technical delivery packages. |
| W09 | Supply Chain, order fulfilment and delivery closeout | 14 | Deliver materials and work with traceable quantities, readiness and staged closeout. |
| W10 | Maintenance, warranty, equipment lifecycle and aftercare | 12 | Support installed equipment through recurring service, warranty, supplier recovery and owned aftercare. |
| W11 | Commercial performance, learning and management reporting | 11 | Use complete, comparable records for commercial review and learning. |
| W12 | Communications and knowledge publication | 4 | Complete provider-aware communication and governed knowledge publication. |
| W13 | Customer portal and PPO Assistant | 12 | Expose mature, scoped workflows through customer self-service and reviewable assistance. |
| W14 | Verified integrations, migration rehearsals and operational readiness | 1 | Prove real source boundaries and rehearse a supportable operating transition after the synthetic journeys work. |
| W15 | Conditional extensions | 6 | Retain possible future capabilities without making them prerequisites for the core app. |

**First end-to-end acceptance target: W00–W04.** Use these waves to reconcile the delivered P01–P12 service foundation with the newer designs and prove the complete planned-service journey online. Existing CRM and estimating functionality remains available throughout; it is not removed or postponed until W05.

**Second target: W05–W07.** Lead/opportunity → scoped brief → estimate → exact issued quotation → accepted selection → simulated conversion → receiving owner.

**Third target: W08–W10.** Technical/project delivery or parts fulfilment → commissioning/acceptance → maintenance, warranty and aftercare. Parts-only fulfilment can proceed as soon as its own prerequisites are available; it does not need to wait for every Engineering feature.

**Later expansion: W11–W14.** Comparable actuals and management review, communications, portal/assistance, then verified operating integrations and transition readiness. Read-only integration discovery can run earlier; its availability must not block synthetic application testing.

## 3. Complete ordered page list and online test gates

The “Register prerequisites” column reproduces explicit page-to-page dependencies in the supplied register. “Shared foundation” means that the register lists no specific page prerequisite; it does not mean the page can bypass permissions, persistence, identity or evidence controls.

### W00 — Azure baseline and platform controls

Establish one trustworthy online baseline and the minimum shared controls before extending business workflows.

**Starting point.** P01–P12 code and hosted identity already exist. Inspect and reuse them; do not start a second application or database. AD pages below begin with bounded controls and expand with their consuming domains.

**Connected scope.** Existing shell and sign-in; permission scopes; controlled vocabulary; adapter mappings; original-operation recovery; audit; supplied retention/hold rules; release and recovery evidence. Retain existing CRM, Engineering, Projects, Estimating and Email/Calendar slices for regression testing.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 001 | AD-01 | Users, roles, teams and access review | Shared foundation |
| 002 | AD-02 | Business configuration and policy publication | Shared foundation |
| 003 | AD-05 | External mapping and reconciliation detail | Shared foundation |
| 004 | AD-04 | Integration health and exception recovery | Shared foundation |
| 005 | AD-07 | Audit history and controlled export | Shared foundation |
| 006 | AD-08 | Retention and information lifecycle | Shared foundation |
| 007 | AD-09 | Operational health, recovery and release readiness | Shared foundation |

**Online test.** An invited tester signs in, saves an existing record, reloads and sees it again. Anonymous and out-of-scope API/document requests fail. Record the actual web/worker image, database ledger and source commit; prove the selected release can be recovered without discarding saved records.

**Exit gate.** Hosted baseline verified against its actual images and ledger; applicable CI passes; private synthetic tester boundary retained. No production acceptance is implied.

### W01 — Shared customer context, work and documents

Give all domains one customer/location structure and one document/work foundation.

**Starting point.** Shared organisation, contact, site, asset and Activity services exist. Customer 360, My Work and the broader location/document workspaces are extensions; their HTML does not implement those services.

**Connected scope.** Organisation → site → facility/growing area, canonical contacts, document identity/revisions/output, templates, financial definitions, data-quality review, personal work/search/saved views, help and onboarding. Introduce Customer 360 with only delivered source panels; add sales orders and richer accounts when their sources arrive.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 008 | CS-01 | Customer register and customer 360 | Shared foundation |
| 009 | CS-02 | Contact directory and contact detail | Shared foundation |
| 010 | CS-04 | Site register and site workspace | CS-01 |
| 011 | CS-05 | Facilities and growing areas: registers, detail and forms | CS-04 |
| 012 | DK-01 | Document register and linked library | Shared foundation |
| 013 | DK-02 | Document viewer, revision and review workspace | DK-01 |
| 014 | DK-03 | Output, issue and distribution centre | DK-01 |
| 015 | DK-06 | Document and form template management | DK-01 |
| 016 | FN-06 | Financial measure definitions and reconciliation review | Shared foundation |
| 017 | AD-03 | Data-quality workbench | Shared foundation |
| 018 | SH-01 | Role-based home overview | Shared foundation |
| 019 | SH-02 | My Work action centre | Shared foundation |
| 020 | SH-04 | Global search results and record preview | Shared foundation |
| 021 | SH-05 | Personal and team saved views | Shared foundation |
| 022 | DK-07 | Page guides and contextual help coverage | Shared foundation |
| 023 | AD-10 | User onboarding, learning and support | Shared foundation |

**Online test.** Create two sites with identically named growing areas, link the correct contact and document, find the right record through search and reopen it after sign-in/reload. Restricted information stays absent from results, previews and exports; unknown source counts remain unknown.

**Exit gate.** Stable IDs and location scope flow through records, documents and Activities. Core financial measure definitions are explicit before any financial dashboard uses them.

### W02 — Equipment, site readiness and technical evidence

Make equipment identity, horticultural constraints and technical evidence usable by Service, Estimating and Engineering.

**Starting point.** Equipment r02, Site Survey, Site Access and Knowledge are design references of differing publication status. Calibration evidence is a required inspection prerequisite even though wider company-tool custody remains conditional.

**Connected scope.** Installed base; configuration and historical context; QR/manual confirmation; service/document timeline; backup references; instruments/calibration; reviewed access constraints; as-found survey; applicable knowledge; source evidence inspection. AI-03 initially provides ordinary source inspection without requiring a live AI provider.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 024 | EQ-01 | Installed-base register and equipment workspace | CS-05 |
| 025 | EQ-03 | Configuration and change history | EQ-01 |
| 026 | EQ-02 | QR lookup and equipment identity confirmation | EQ-01 |
| 027 | EQ-05 | Equipment document and service timeline | EQ-01, DK-01 |
| 028 | EQ-08 | Control configuration backup and recovery record | EQ-01, EQ-03, DK-01 |
| 029 | EQ-09 | Test instruments and calibration evidence | DK-01 |
| 030 | CS-06 | Site access and horticultural readiness | CS-05 |
| 031 | CS-08 | Site survey and as-found brief | CS-04, CS-05 |
| 032 | DK-04 | Knowledge search and article detail | DK-01 |
| 033 | AI-03 | Source and answer evidence inspection | DK-01 |

**Online test.** Confirm a pump physically in an irrigation shed that serves two blocks, record a scoped access window and survey measurement, and retrieve the exact manual and configuration. Reject an expired or inapplicable instrument/procedure basis; preserve the historical version.

**Exit gate.** Physical equipment location is distinct from served areas. Site or facility labels never establish readiness, coverage or technical permission.

### W03 — Service intake, work orders, planning and job packs

Turn a request into authorised, schedulable and properly prepared work.

**Starting point.** Reuse the P03–P06 intake, authority, booking and pack services. Integrate the Service Cases, Work Orders, planner and accepted Job Pack successor designs against those contracts.

**Connected scope.** Service triage and detail; controlled work scope; resource availability; day/week/multiweek demand; appointment detail; rescheduling and travel review; induction/readiness; issued job packs and individual acknowledgements; notifications and domain-owned approval/handover inbox.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 034 | SV-01 | Service desk and triage worklist | Shared foundation |
| 035 | SV-02 | Request detail and communication timeline | CS-04 |
| 036 | SV-03 | Work-order register and scope workspace | SV-02, CS-06 |
| 037 | PL-02 | Resource availability and competence | Shared foundation |
| 038 | PL-01 | Service planner and unassigned demand | SV-03 |
| 039 | SV-04 | Appointment coordination detail | SV-03 |
| 040 | PL-04 | Rescheduling and acknowledgement centre | PL-01 |
| 041 | PL-05 | Visit route and travel review | Shared foundation |
| 042 | FI-05 | Site induction, risk and biosecurity review | CS-06 |
| 043 | SV-05 | Job-pack preparation and issue follow-through | SV-03, DK-03 |
| 044 | SH-03 | Notification inbox and preferences | Shared foundation |
| 045 | SH-06 | Cross-module approvals and handover inbox | Shared foundation |

**Online test.** Create a request, resolve an owned information gap, authorise a work order, reserve a crew and issue the exact pack. A simultaneous conflicting booking fails safely; changed scope requires the appropriate review and fresh pack response. Reading a notification leaves the business task open.

**Exit gate.** P04 authority/readiness precedes P05 confirmation, followed by P06 exact issue/acknowledgement. No dispatch or pack shortcut bypasses work authority.

### W04 — Field execution, quality, service review and Finance handoff

Complete and test the planned-service journey through field evidence, customer response and Finance reconciliation.

**Starting point.** P07–P12 bounded code is merged. Extend the field/review/Finance designs and execute remaining integrated, physical-device and owner acceptance; do not infer acceptance from old component counts.

**Connected scope.** Technician Today; online capture then offline recovery; procedure runner; inspection defects and retests; incidents; service review/report issue; unresolved work; exact customer responses; Finance handoff and synthetic account observations.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 046 | FI-01 | Technician Today and job execution | SV-05 |
| 047 | FI-02 | Offline downloads, queue and conflict recovery | FI-01 |
| 048 | FI-03 | Inspection and commissioning form runner | SV-05, EQ-09 |
| 049 | FI-04 | Inspection review, defects and retests | FI-03 |
| 050 | FI-06 | Incident and corrective-action record | Shared foundation |
| 051 | SV-06 | Service review and controlled report workspace | FI-03 |
| 052 | SV-07 | Unresolved findings and follow-up worklist | SV-06 |
| 053 | FI-07 | Customer attendance and report response | SV-06 |
| 054 | FN-01 | Finance workspace and service-handoff follow-through | SV-06, AD-05 |
| 055 | FN-02 | Customer accounts, applications and exceptions | AD-05 |

**Online test.** Complete a synthetic visit on a phone, capture evidence offline, reconnect without duplicates, return an entry for correction, pass a successor retest, issue an exact report and record a revision-bound response. Reconcile billable quantities through a simulated Finance target, including no-posting and unknown-outcome paths; retain outstanding follow-up.

**Exit gate.** P07 → P08 → P09 → P10, then P11 integrated verification and P12 recovery/demo. Full PP-01 acceptance stays open until its remaining written procedures and owner/device checks actually pass.

### W05 — CRM, account development and governed catalogue

Extend the existing CRM into a reliable sales front end with governed product and price sources.

**Starting point.** Leads, Deals board/grid, opportunity ownership and bounded email/calendar already exist. Keep them online at W00; this wave integrates the broader CRM and catalogue designs.

**Connected scope.** Stakeholders, account/territory visits, opportunity detail/internal work, pipeline review, product/variant technical records, catalogue publication, price books, compatibility/lifecycle, controlled imports, and CRM calendar/Activities.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 056 | CS-03 | Stakeholder and relationship view | Shared foundation |
| 057 | CS-07 | Account development and visit plan | Shared foundation |
| 058 | CR-01 | Opportunity detail and internal work | Shared foundation |
| 059 | CR-04 | Pipeline insights and forecast review | Shared foundation |
| 060 | PD-01 | Catalogue and product technical workspace | Shared foundation |
| 061 | PD-02 | Catalogue authoring and publication review | Shared foundation |
| 062 | PD-03 | Price books and supplier-source maintenance | PD-01 |
| 063 | PD-04 | Compatibility, replacements and product lifecycle | PD-01 |
| 064 | PD-05 | Catalogue import and exception review | AD-03, AD-05 |
| 065 | EC-03 | Calendar and activity coordination | Shared foundation |

**Online test.** Convert or progress a lead through the adopted five-stage opportunity workflow, retain separate opportunity/Activity owners, link the exact site and products, and reopen the next action. Publish a successor price source without changing an older estimate; reject duplicate or mismapped import rows.

**Exit gate.** Qualified → Scoping → Quoting → Negotiation → Closing remains the sales stage set. Compatibility, authority and forecast probabilities are sourced, not inferred from a brand or a role label.

### W06 — Estimating intake, costing and Screen Systems

Produce a reviewable estimate from an accepted brief and traceable calculation/cost sources.

**Starting point.** Reuse E1/E2 and the adopted costing/taxonomy decisions. The source-informed Screen Systems r02 is a design with remaining mappings, ranges and engineering acceptance; broader specialist families are not enabled by it.

**Connected scope.** Sales-to-Estimating intake; estimator workload; discovery/options/revision comparison; cost-source review; Screen Systems inputs/formulas/generated parts/overrides/safe rerun; estimate review and pricing exceptions. Integrate the existing Excel estimate import design into the same revision and review process.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 066 | CR-02 | Sales-to-estimating handover | CS-08 |
| 067 | ES-01 | Estimating intake and workload | Shared foundation |
| 068 | ES-02 | Discovery, alternatives and revision comparison | CS-08 |
| 069 | ES-03 | Cost-source and supplier-price review | PD-03 |
| 070 | ES-08 | Specialist configuration workbench | Shared foundation |
| 071 | ES-04 | Estimate review and pricing exceptions | ES-03 |

**Online test.** Submit a scoped survey brief, accept it into Estimating, create alternatives, import a validated workbook and run a source-versioned Screen Systems example. Change an input, review regenerated quantities and preserve or explicitly resolve overrides. A price refresh creates a reviewed successor basis.

**Exit gate.** Historical formulas are not automatically approved current rules. Keep unvalidated ranges, part mappings, policies and supplier data visibly held; manual estimating remains usable where independently supported.

### W07 — Quotation lifecycle, conversion and receiving handover

Carry one exact accepted quotation into controlled conversion and an accountable receiving handover.

**Starting point.** ES-05/06 (#212), ES-07 (#213) and CR-03 (#215) are open design contributions at the evidence cutoff. They need completed review and application integration.

**Connected scope.** Quotation approval/output/issue/distribution; customer response/negotiation/expiry; one-off item and entity resolution; conversion preview and outcome recovery; receiving responsibility for Service, Projects or parts delivery.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 072 | ES-05 | Quotation approval, issue and distribution | ES-04, DK-03 |
| 073 | ES-06 | Quotation response and negotiation | ES-05 |
| 074 | ES-07 | One-off item resolution and conversion | ES-06, AD-05 |
| 075 | CR-03 | Won-deal receiving handover | ES-06 |

**Online test.** Approve and issue one quote revision, accept an exact option selection, reconcile a partially unknown simulated order conversion and submit the handover. Retry returns original results without duplicating confirmed targets. The receiving owner can accept, return or reject the package; changed commercial basis requires renewed acceptance.

**Exit gate.** Quotation acceptance, Opportunity Won, ERP conversion, receiving acceptance, work authorisation, booking, delivery and Finance processing remain independent. A confirmed order alone does not make a handover ready.

### W08 — Project initiation and Engineering design control

Turn accepted sales scope into controlled project and technical delivery packages.

**Starting point.** Engineering r02 intake and Projects Gantt already exist. The broader Engineering and project-commercial controls are extensions; preserve accepted prior baselines and native CAD authoring.

**Connected scope.** Project receiving/initiation; Engineering workload; design basis/interfaces; drawings and technical queries; review/transmittals; released materials/substitutions; technical changes; project health, baseline/forecast, RAID, contract variations, subcontract packages and cross-domain resource demand.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 076 | PJ-01 | Project initiation and receiving review | CR-03 |
| 077 | EN-01 | Engineering workload and deliverables | Shared foundation |
| 078 | EN-02 | Design basis and interface register | CS-08 |
| 079 | EN-03 | Drawing and controlled technical document register | EN-02, DK-01 |
| 080 | EN-04 | Technical queries and supplier submittals | Shared foundation |
| 081 | EN-05 | Technical review, approval and transmittal | EN-03 |
| 082 | EN-06 | Released materials and substitutions | EN-05, PD-04 |
| 083 | EN-07 | Engineering change-impact review | EN-05 |
| 084 | PJ-02 | Project overview and portfolio health | Shared foundation |
| 085 | PJ-03 | Baseline, forecast and dependency review | PJ-01 |
| 086 | PJ-04 | RAID, decisions and project actions | Shared foundation |
| 087 | PJ-05 | Contract obligations, notices and variations | Shared foundation |
| 088 | PJ-06 | Subcontractor and specialist packages | Shared foundation |
| 089 | PL-03 | Cross-domain resource demand and capacity | Shared foundation |

**Online test.** Receive an exact multi-area handover, assign Engineering deliverables, answer a technical query and issue an installation-purpose drawing set. Baseline a project, propose a change and expose cost/date/resource impacts without automatically changing confirmed Service bookings.

**Exit gate.** Technical review precedes material release. Project demand and forecast dates remain distinct from the scheduling service's confirmed reservations.

### W09 — Supply Chain, order fulfilment and delivery closeout

Deliver materials and work with traceable quantities, readiness and staged closeout.

**Starting point.** Supply Chain runtime is recorded as outstanding. Material Readiness r03 is a reference; Order Fulfilment #216 is an incomplete source-package upload. Recover and verify the design package before reusing it for implementation.

**Connected scope.** Demand/readiness; procurement; inbound allocations; receipts and quarantine; stock reservations; picking/dispatch; customer delivery/POD; returns/claims/credits; material-change impacts; technician stock custody; project readiness; commissioning/as-built release; published updates and staged closeout.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 090 | SC-01 | Demand and material-readiness workspace | CS-05, PD-01 |
| 091 | SC-02 | Purchasing and supplier commitments | SC-01 |
| 092 | SC-03 | Inbound shipments and line allocations | SC-02 |
| 093 | SC-04 | Receipt, inspection and quarantine | SC-03 |
| 094 | SC-05 | Stock availability and reservations | PD-01, AD-05 |
| 095 | SC-06 | Picking and dispatch preparation | SC-05 |
| 096 | SC-07 | Customer delivery and proof of delivery | SC-06 |
| 097 | SC-08 | Returns, supplier claims and credit tracking | SC-04 |
| 098 | SC-09 | Material change-impact review | SC-01 |
| 099 | SC-10 | Service stock custody and job reconciliation | SC-05, SC-06, FI-01 |
| 100 | PJ-07 | Readiness and change-impact review | SC-01, CS-06 |
| 101 | EN-08 | Commissioning basis and as-built release | EN-05, FI-04 |
| 102 | PJ-08 | Stakeholder update preparation and publication | Shared foundation |
| 103 | PJ-09 | Staged acceptance and closeout | EN-08, SV-06 |

**Online test.** Run a parts-only order through partial receipt, quarantine, reservation, pick, split delivery and a return. Also run a project material shortage through readiness review, commissioning, as-built release and area-specific closeout. Reconcile issued/used/returned/held quantities without conflating delivery with acceptance or credit.

**Exit gate.** MYOB remains the intended order, stock and accounting authority. Synthetic adapters must retain company, item, unit, source time and unknown outcomes. Receipt, usable stock, delivery, customer acceptance and Finance credit remain separate.

### W10 — Maintenance, warranty, equipment lifecycle and aftercare

Support installed equipment through recurring service, warranty, supplier recovery and owned aftercare.

**Starting point.** MA-01–MA-07 and Equipment designs extend manual coverage and shared equipment history. Sales Aftercare #217 is an incomplete source-package upload at the cutoff.

**Connected scope.** Agreements and entitlement; maintenance templates and stable due occurrences; renewals; asset movement/replacement/retirement; bulletin applicability and obsolescence; remote diagnosis/OEM escalation; warranty/customer resolution; supplier recovery and sales aftercare.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 104 | MA-01 | Agreement register and agreement detail | CS-05 |
| 105 | MA-02 | Coverage and entitlement assessment | MA-01 |
| 106 | MA-03 | Maintenance plans and task templates | MA-01, EQ-01 |
| 107 | MA-04 | Due-maintenance occurrence worklist | MA-03 |
| 108 | MA-05 | Renewals and service relationship review | MA-01 |
| 109 | EQ-04 | Equipment movement, replacement and retirement | EQ-03 |
| 110 | EQ-06 | Service bulletin applicability | EQ-01, PD-04 |
| 111 | EQ-07 | Support lifecycle and obsolescence | EQ-01, PD-04 |
| 112 | SV-08 | Remote diagnosis and OEM escalation | SV-02, EQ-01, EQ-03 |
| 113 | MA-06 | Warranty case and customer resolution | MA-02 |
| 114 | MA-07 | Supplier recovery coordination | MA-06, SC-08 |
| 115 | CR-05 | Sales aftercare and renewal worklist | Shared foundation |

**Online test.** Generate one due occurrence across repeated runs, defer it with an owned reason, and request work without silently booking it. Resolve a warranty replacement while retaining predecessor/successor history; follow the separate supplier claim and credit. Create a post-installation/renewal action that survives reload.

**Exit gate.** Maintenance occurrence ≠ appointment; warranty coverage ≠ work authority; customer resolution ≠ supplier recovery; a proposed renewal ≠ accepted terms. Remote access tooling and authority are separate from case coordination.

### W11 — Commercial performance, learning and management reporting

Use complete, comparable records for commercial review and learning.

**Starting point.** ES-09 #220 and ES-10 #221 are design proposals, not an approved estimator calibration engine. Reporting follows the source workflows and explicit definitions established earlier.

**Connected scope.** Project financial performance; milestone claims; cash timing; estimate-to-actual review; reference cases/calibration proposals; report definitions and the management, sales, project, service and Supply Chain/Finance report catalogue.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 116 | FN-03 | Project financial performance | FN-06 |
| 117 | FN-04 | Milestone claims and commercial obligations | FN-06 |
| 118 | FN-05 | Cash timing and commercial outlook | FN-06 |
| 119 | ES-09 | Estimate-to-actual outcome review | FN-06 |
| 120 | ES-10 | Reference cases and calibration proposals | ES-09 |
| 121 | RP-06 | Report definition, saved views and scheduled review | AD-03 |
| 122 | RP-01 | Management overview and report catalogue | RP-06 |
| 123 | RP-02 | Sales and quotation performance | RP-06 |
| 124 | RP-03 | Engineering and project delivery performance | RP-06 |
| 125 | RP-04 | Service, maintenance and resource performance | RP-06 |
| 126 | RP-05 | Supply and Finance trust/exceptions | RP-06 |

**Online test.** Reconcile issued estimate, accepted scope, approved changes and attributable actuals for a closed synthetic job. Keep discount, scope change and delivery variance distinct; exclude incomplete or incomparable cases. A reviewed learning proposal creates no automatic repricing. Each report drills into its defined cohort and source cutoff.

**Exit gate.** FN-06 definitions precede Finance/variance measures; ES-09 precedes ES-10; RP-06 precedes the report catalogue. Shared assets and nested areas are not double-counted.

### W12 — Communications and knowledge publication

Complete provider-aware communication and governed knowledge publication.

**Starting point.** The bounded synthetic email → linked record → Activity journey remains available from W00. This wave extends workspace behaviour; live provider consent/synchronisation/sending is a separate integration release.

**Connected scope.** Connection/sync health, inbox filing, private/shared visibility, communication drafts/attachments/audience review, delivery recovery and knowledge authoring/review/publication/withdrawal.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 127 | EC-02 | Mailbox connection and synchronisation status | Shared foundation |
| 128 | EC-01 | Connected inbox and record-linking review | Shared foundation |
| 129 | EC-04 | Communication draft, approval and delivery review | Shared foundation |
| 130 | DK-05 | Knowledge authoring, review and learning intake | DK-04 |

**Online test.** Link a synthetic message to an allowed record, create a follow-up, recover a partial sync and retain the intended visibility. Draft a message with exact attachment revisions and an uncertain-delivery state. Turn reviewed field evidence into an applicable article through technical review.

**Exit gate.** Reading/linking is not sending. Uncertain fixes stay distinct from validated procedures. Provider and sending permissions must be explicitly established before live use.

### W13 — Customer portal and PPO Assistant

Expose mature, scoped workflows through customer self-service and reviewable assistance.

**Starting point.** Portal and Assistant designs rely on internal sources delivered earlier. Portal and Assistant are independent branches within this wave and can be developed separately when their prerequisites are met.

**Connected scope.** Portal identity/site selection; support; published project updates; equipment/documents/reports; knowledge; permitted commercial views. Assistant workspace, settings, proposal review, domain drafts, voice/transcript review and recurring checks reuse existing domain commands and source inspection.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 131 | CP-01 | Portal home, organisation/site selection and access | CS-04, AD-01 |
| 132 | CP-02 | Customer support request and conversation | CP-01, SV-02 |
| 133 | CP-03 | Published project updates and customer actions | CP-01, PJ-08 |
| 134 | CP-04 | Customer equipment, documents and service reports | CP-01, DK-03 |
| 135 | CP-05 | Customer knowledge and guided support | CP-01, DK-04 |
| 136 | CP-06 | Customer quotation, variation and account views | CP-01, ES-06, FN-02 |
| 137 | AI-01 | Assistant workspace and docked/mobile conversation | SH-04 |
| 138 | AI-06 | AI assistance settings and quality review | AI-01 |
| 139 | AI-02 | AI proposal review and saved outcomes | AI-01 |
| 140 | AI-04 | Domain assistance and drafting flows | AI-02, AI-03 |
| 141 | AI-05 | Voice capture and transcript review | AI-02 |
| 142 | AI-07 | Recurring checks and automation review | AI-02 |

**Online test.** A customer sees only granted organisation/site information and exact approved publications; internal notes and restricted accounts remain inaccessible by direct URL/API. An assistant proposal cites the correct source, detects changed context and requires the existing domain review before a material action. Voice units/numbers are confirmed.

**Exit gate.** Synthetic portal personas and scripted AI may be tested first. External invitations, live AI/voice providers and customer-visible publication require their own authorised release scope and evidence.

### W14 — Verified integrations, migration rehearsals and operational readiness

Prove real source boundaries and rehearse a supportable operating transition after the synthetic journeys work.

**Starting point.** This is a conditional operational gate, not permission to connect, migrate or retire systems. AD-06 is introduced here; earlier administration, permissions, mappings, recovery, retention and training are completed for the chosen operating scope.

**Connected scope.** Start with scoped read-only MYOB/SharePoint/provider pilots, validate company/entity/field ownership and operational Service ownership, then consider separately authorised narrow writes. Rehearse migration, reconciliation, coexistence, rollback, backup/restore, tester/role onboarding and support.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 143 | AD-06 | Migration, coexistence and cutover workbench | Shared foundation |

**Online test.** Use approved/redacted samples in a dry run, reconcile counts and keys, exercise expired permissions and partial source failures, and prove recovery without duplicate business effects. Independently accept each live connector and operating journey before wider rollout.

**Exit gate.** Actual configuration/licences, document ownership, financial definitions, privacy/retention, support and recovery must be evidenced. Retain CREMS, Pipedrive and Smartsheet until a tested, accepted transition; native CAD continues authoring.

### W15 — Conditional extensions

Retain possible future capabilities without making them prerequisites for the core app.

**Starting point.** All six CX entries are explicitly conditional in the register. Their numbering here is a dependency-respecting backlog order, not a commitment to build all of them.

**Connected scope.** Company tools/loan units; workshop assembly; remote monitoring; advanced customer training/subscriptions; grower production/traceability links; water/energy improvement review.

| Sequence | Register ID | Module/page brief | Register prerequisites |
|---:|---|---|---|
| 144 | CX-01 | Company tools, loan units and calibration | Shared foundation |
| 145 | CX-02 | Workshop assembly, testing and rework | Shared foundation |
| 146 | CX-03 | Remote monitoring and alarm review | EQ-01, AD-05 |
| 147 | CX-04 | Advanced customer training and subscription coordination | PJ-09 |
| 148 | CX-05 | Grower production and traceability integration | CS-05, AD-05 |
| 149 | CX-06 | Water and energy improvement review | CX-03, RP-06 |

**Online test.** For each selected extension, first establish the business owner, source system, users and measurable outcome; then test its bounded journey and cross-domain effects. CX-06 requires usable monitoring data and report definitions.

**Exit gate.** Separate scope decisions are required. Instrument calibration evidence already exists under EQ-09; CX-01 adds wider custody. No remote-control authority or grower-production scope is inferred from the core platform.

## 4. Shared capabilities that expand across waves

The table above assigns each page ID once to make coverage auditable. The following recurring work is part of the plan and prevents early deployment from being mistaken for full completion.

| Shared capability | First useful release | Required subsequent expansion |
|---|---|---|
| AD-01 permissions and AD-07 audit | W00 current hosted identity, scoped commands and attributable changes | Add each new domain’s permissions, direct API/document/export tests and retained decision events in its own wave; test customer grants in W13 and operating access in W14. |
| AD-02 configuration and policy | W00 required vocabularies, units and explicit Not configured states | Add supplied pricing/review policies by W06–W07, contract/change policy by W08–W09, and agreement/recurrence rules by W10. A blank policy is not an automatic approval. |
| AD-04/AD-05 integration health and mapping | W00 adapter identity, operation receipts and synthetic mappings | Add item/order mapping by W05–W07, inventory/Finance reconciliation by W09–W11, and verified tenant/provider-specific mappings by W14. |
| AD-08/AD-09 retention, recovery and releases | W00 minimum evidence preservation and hosted release/recovery controls | Extend for photos/offline originals, issued documents, Finance history and customer publication as each arrives; complete the actual operating policy and recovery evidence in W14. |
| CS-01 Customer 360 | W01 canonical customer/site context and links to existing runtime sources | W04 reviewed service/account context; W05 CRM/catalogue context; W07 confirmed simulated sales-order references; W08–W09 project/fulfilment progress; W10 lifecycle/aftercare; W14 verified ERP observations. Missing sources stay unavailable, never falsely empty. |
| SH-01–SH-06 Home, work, search, views, notifications and handovers | W01 core work/search; W03 expanded notices and inbox | Add source-owned actions and safe deep links with every new domain. Completion always occurs through the owning domain’s command. |
| DK-01–DK-03/DK-06 documents, output and templates | W01 stable source identities and retained exact outputs/templates | W03 packs, W04 field reports/forms, W07 quotations, W08 transmittals, W09 updates/as-builts, W12 knowledge publication, W13 external visibility and W14 authorised SharePoint access. |
| FN-06 financial definitions | W01 explicit prototype source/quantity/currency definitions | Add reviewed project/claim/cash and variance definitions before W11 metrics, then verify actual ERP fields and operating ownership in W14. |
| DK-07 and AD-10 help/onboarding | W01 first pages and tester orientation | Add role/task guidance with every wave. W14 supplies the accepted support owner, release notes, training and operating handover. |
| Existing CRM, Email/Calendar, Gantt, Engineering and E1/E2 | W00 retained working slices | Extend in the named later waves; keep their current saved records and regression journeys passing throughout. |

## 5. Existing designs that are not separate new deployment modules

| Design or asset | Implementation placement |
|---|---|
| Application shell, login and theme/style board | W00 shared shell and tokens; apply relevant accepted baselines across every wave. r20 is a visual reference; preserve recorded component acceptance and do not silently adopt an entire unapproved study. |
| Leads, Deals board/grid and mobile CRM | Preserve current runtime at W00; broader CRM refinement belongs to W05 with CR-01/CR-04. Do not create another customer or opportunity master. |
| Customers, Sites & Growing Areas and Customer 360 | One shared customer/location implementation at W01; Customer 360 is progressively populated from source-owned modules. |
| Equipment & Installed Base | W02 foundations; later lifecycle/bulletin/replacement extensions W10. |
| My Work and Notification inbox | W01 and W03 respectively; extend source adapters per domain. |
| Quality, Safety & Site Assurance | CS-06 in W02, FI-05 in W03, FI-03/FI-04/FI-06 in W04; reuse the same exact-location and inspection records. |
| Job Pack r03 and Field Technicians r05 | Integrate accepted successors at W03 and W04 with existing server services. A later accepted design is not evidence it is already the runtime baseline. |
| Sales-to-Estimating intake and wizard/data review | W06, CR-02 and ES-01–ES-04; adopt only approved decisions and supplied rules. |
| Excel estimate import | W06 shared estimate revision workflow. Preserve validation, source basis, row exceptions and safe retry; use a supplied standard workbook. |
| Quotation Builder, quotation module and PDF/output design | W07, ES-05/ES-06 using DK-03/DK-06; interactive customer view and exact generated document remain distinct outputs. |
| Specialist Configuration Workbench | W06 ES-08, initially Screen Systems only. Future families require separate validated definitions. |
| Won-deal / Sales-to-Delivery Handover | W07 CR-03, linking exact ES-06/ES-07 evidence to Service, Projects or parts-order receivers. |
| Material Readiness & Inbound Logistics | W09 SC-01–SC-04 and SC-09. |
| Order Fulfilment & Customer Delivery | W09 SC-05–SC-07; this is not a second order master. |
| Returns, Supplier Claims & Credit Tracking | W09 SC-08, subsequently linked to W10 MA-06/MA-07 warranty and recovery. |
| Project Delivery Readiness & Change Control | W08 underlying project/change records; W09 PJ-07 consumes Engineering/material/site/resource readiness. |
| Service Agreements & Maintenance; Warranty & Customer Resolution | W10 MA-01–MA-07 with shared assets, Service work, returns and Finance outcomes. |
| Sales Aftercare & Renewal Worklist | W10 CR-05, consuming delivery and relationship outcomes. |
| Estimate-to-Actual Outcome Review; Reference Cases & Calibration Proposals | W11 ES-09 followed by ES-10. Neither automatically changes a current or historical estimate. |
| Naming & Filing / SharePoint package | Common naming/document behaviour from W01; actual SharePoint connectivity at the verified integration gate. |
| Workflow maps, coverage register and HTML index | Planning and traceability sources. They are not business modules deployed merely by publishing HTML. |

## 6. Design-package readiness at the evidence cutoff

These observations concern repository design packages, not full application readiness. Open PR status can change after this report. Before implementation, read the current receiving handover, exact accepted reference and required checks.

| Package | Observed repository position | Consequence |
|---|---|---|
| Customer 360 #219 | Merged into inspected main d565a9d; standalone design | Integrate the source-owned customer projection in W01 and expand it through later waves. |
| My Work #209, Quality/Site Assurance #208, Screen Systems r02 #210 | Merged design contributions | Reuse the designs while implementing the missing application contracts; Screen Systems approval/range/mapping questions remain. |
| Notifications #211 | Open design PR; repaired focused evidence recorded | W03 application work remains separate from completing the design review. |
| Quotation issue/response #212 and conversion #213 | Open dependent design chain; #213 is based on the quotation contribution | Preserve the chain and exact source basis before W07 implementation. |
| Site Access and Knowledge in restored upload #214 | Open design restoration; original packages recovered; linked component PR ancestry retained | Use recovered canonical sources and current receiving evidence for W02. The PR body requests its component PRs be integrated first. |
| Sales-to-Delivery Handover #215 | Open design PR | W07 requires runtime receiving contracts and actual persisted outcomes. |
| Order Fulfilment #216 | Draft, incomplete upload; original CSS/model/controller, generated HTML, report and executable checks missing | **Design-reuse blocker.** Recover and verify the original complete package before using it as the implementation reference. This does not block unrelated early waves. |
| Sales Aftercare #217 | Draft, incomplete upload with the same source/output/check categories missing | **Design-reuse blocker.** Recover the original package before W10 implementation; do not inherit unverifiable test-result claims. |
| Estimate-to-Actual #220 | Open complete successor to closed partial upload #218 | Use #220 as the design review target for W11; application data/measure contracts remain separate. |
| Reference Cases & Calibration #221 | Open ES-10 design PR | Follow ES-09; retained Draft/Partial cases must not become accepted calibration samples. |

Other gaps are functional rather than file-publication issues: supplied commercial policies, validated Screen Systems ranges/parts, operational Service ownership, source contracts, real integration capability and remaining owner/device acceptance. A prototype may represent these as synthetic examples or explicit holds; it must not silently invent them.

## 7. Azure release method for each wave

1. **Define one bounded outcome.** Name the page IDs, exact incoming/outgoing records, visual reference, persistence, permission scopes, state transitions, failure recovery and observable test journey. Choose a coherent subset of a wave for each reviewable PR.
2. **Implement against the existing application.** Reuse its shared IDs, domain services, SQL migrations, document issue and operation/outbox conventions. Carry customer/site/facility/asset context through the workflow. Do not host an isolated HTML mockup and label that functional module delivery.
3. **Verify the source and schema together.** Run applicable foundation/prototype/naming checks and required branch checks, plus meaningful module/database/browser tests. Review migration registry/checksum/upgrade implications and the exact current hosted ledger before selecting an upgrade path.
4. **Review and merge the bounded source.** Preserve original issued files and accepted baseline evidence. Keep business approval and code review as separate claims.
5. **Use the existing owner-triggered Azure workflow.** Start with `check`. Select `deploy` only when the database is compatible, or a specifically reviewed `upgrade-and-deploy` path when required. The workflow builds a fixed image and checks the operator/database before updating web and worker images. Do not reset demo data as a routine deployment step.
6. **Verify the hosted result.** Record source commit, images/revision, migration ledger, environment, test identities, timestamp and actual outcomes. Test through sign-in on desktop and a real phone where field use matters. Validate durable saves, direct API restrictions, missing/stale sources and the wave’s main exception path.
7. **Retain a tested recovery path.** Azure Container Apps uses immutable revisions and readiness checks to manage updates; previous application revisions can support rollback. Database changes and worker effects need their own compatible recovery plan: changing an image does not undo database changes. [Microsoft revision guidance](https://learn.microsoft.com/en-us/azure/container-apps/revisions) and [health probes](https://learn.microsoft.com/en-us/azure/container-apps/health-probes) describe platform mechanics; PPO acceptance additionally requires its business tests.
8. **Record the handover.** Update GitHub STATUS, the affected delivery/decision records, test evidence and coverage/implementation mapping for the actual result. State implemented, deployed, tested and owner accepted separately. Carry open issues forward with an owner and next action.

No Azure deployment, database migration, repository mutation, customer communication or live connector write was performed to produce this report.

## 8. Preserve the P01–P12 dependency order

The existing plan governs the service implementation and acceptance sequence. These waves organise subsequent integration/refinement around it; they do not restart or renumber it.

| Existing package | Continued role in this plan |
|---|---|
| P01 Foundation | W00 verify/reuse runnable application, architecture and hosted-safe identity boundary. |
| P02 Persistence, permissions and seed | W00–W01 verify/reuse scoped records, audit, receipts and durable state. |
| P03 Customer context and intake | W01–W03 extend canonical locations and owned triage. |
| P04 Work scope/coverage/readiness | W02–W03 preserve authority and reviewed readiness before scheduling. |
| P05 Planner/controlled changes | W03 prove crew conflicts, original-result recovery and explicit change acknowledgement. |
| P06 Job-pack issue/acknowledgement | W03 preserve exact outputs and individual crew response. |
| P07 Technician online capture | W04 complete the online path before claiming offline support. |
| P08 Offline queue/recovery | W04 test durable originals, identity/assignment changes, conflicts and replay. |
| P09 Review/report/customer response | W04 bind review and response to the exact entry/report revision. |
| P10 Finance handoff | W04 reconcile exact reviewed quantities and simulated outcomes. |
| P11 Integrated quality/access/usability | W04 acceptance checkpoint and regression baseline for every later wave. |
| P12 Recovery/delivery/owner demonstration | W00 inspect existing evidence; W04 complete outstanding PP-01 demonstration/recovery obligations; repeat affected recovery tests on later releases. |

The repository records P01–P12 code as merged. Full PP-01, PT-28/PT-30 and independent owner/device acceptance remain distinct from bounded P12 and PT-22 evidence. Read the current handovers before choosing the exact remaining acceptance work.

## 9. Coverage reconciliation

| Register family | Briefs | First-deployment waves |
|---|---:|---|
| SH — Home, My Work and shared navigation | 6 | W01, W03 |
| CS — Customers, contacts and sites | 8 | W01, W02, W05 |
| EQ — Equipment and installed base | 9 | W02, W10 |
| CR — CRM and sales extensions | 5 | W05, W06, W07, W10 |
| ES — Estimating and quotation extensions | 10 | W06, W07, W11 |
| EN — Engineering and design control | 8 | W08, W09 |
| PJ — Projects and commercial delivery | 9 | W08, W09 |
| SV — Service desk and work coordination | 8 | W03, W04, W10 |
| PL — Resource planning and dispatch | 5 | W03, W08 |
| FI — Field work, inspections and site assurance | 7 | W03, W04 |
| MA — Service agreements, maintenance and warranty | 7 | W10 |
| SC — Supply Chain and logistics | 10 | W09 |
| PD — Products and catalogue governance | 5 | W05 |
| FN — Finance and commercial controls | 6 | W01, W04, W11 |
| DK — Documents, knowledge and controlled publication | 7 | W01, W02, W12 |
| EC — Email, calendar and communications | 4 | W05, W12 |
| CP — Customer portal and external collaboration | 6 | W13 |
| AI — PPO Assistant and AI workflows | 7 | W02, W13 |
| RP — Reporting and management review | 6 | W11 |
| AD — Administration, data quality and operational support | 10 | W00, W01, W14 |
| CX — Conditional extensions to retain visibly | 6 | W15 |

Verification performed for this planning artifact:

- 149 source IDs extracted; 149 IDs assigned; 149 unique assignments.
- No missing, extra or duplicate page IDs.
- All 21 register families retained.
- All 138 declared dependency edges place the prerequisite before its dependent page, including within-wave ordering.
- All six CX entries retained as conditional scope; none is required to start core online testing.
- Existing P01–P12 IDs and all source page IDs retained. The plan does not modify or replace the 78 parent requirement identities.

This is planning verification. Application, browser, database and Azure acceptance tests were not executed in this task.

## 10. Next bounded implementation package

**Azure baseline verification and shared customer foundation (W00–W01).** Confirm the actual hosted source/images and database ledger, reconcile the reviewed main release with the existing Azure upgrade path, then implement the next missing customer/site/facility and Customer 360 foundation slice against the existing shell and permissions. Keep existing CRM and Service journeys working and demonstrate one saved customer → site → growing area → equipment link through the signed-in online app.

Prepare a focused branch/PR with its source references, schema review, hosted test script and recovery note. Deployment and any required hosted schema action follow the applicable authorisation and release process. There is no need to finish all remaining HTML designs before beginning this bounded work.

## 11. Source links

- [Repository guidance](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/AGENTS.md)
- [Application README](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/README.md)
- [Current project status](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/STATUS.md)
- [P01–P12 implementation plan](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/delivery/prototype-implementation-plan.md)
- [HTML design index](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/reference/ui/README.md)
- [Page coverage register r06](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html)
- [Platform architecture BP-02](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/architecture/BP-02-platform-architecture.md)
- [Architecture ADR-0003](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/decisions/ADR-0003-prototype-architecture.md)
- [Azure private demo runbook](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/delivery/azure-private-demo.md)
- [Existing Azure upgrade decision](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/docs/decisions/azure-existing-demo-upgrade.md)
- [Azure deployment workflow](https://github.com/deanrfiedler-gif/powerplants-one/blob/d565a9de01b94aa7ad3fffe3a996f78c3aee589b/.github/workflows/azure-demo-deploy.yml)
- [Latest observed successful Azure deployment workflow](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34913344375)
- Open design contributions inspected: [#211](https://github.com/deanrfiedler-gif/powerplants-one/pull/211), [#212](https://github.com/deanrfiedler-gif/powerplants-one/pull/212), [#213](https://github.com/deanrfiedler-gif/powerplants-one/pull/213), [#214](https://github.com/deanrfiedler-gif/powerplants-one/pull/214), [#215](https://github.com/deanrfiedler-gif/powerplants-one/pull/215), [#216](https://github.com/deanrfiedler-gif/powerplants-one/pull/216), [#217](https://github.com/deanrfiedler-gif/powerplants-one/pull/217), [#220](https://github.com/deanrfiedler-gif/powerplants-one/pull/220), [#221](https://github.com/deanrfiedler-gif/powerplants-one/pull/221).

The supplied attachment is the coverage authority for this report; the repository register link is provided for navigation and is not a claim of a byte-for-byte attachment comparison. Live GitHub observations supersede older STATUS/header publication claims only for the specific commit/PR/run facts checked. All deployment ordering and wave packaging above are recommendations for review, not an already adopted scope change.
