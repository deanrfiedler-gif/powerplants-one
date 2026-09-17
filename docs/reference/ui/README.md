---
document_id: PPO-UI-DESIGN-INDEX
title: HTML design index and maintenance guide
revision: r06
updated: 2026-09-17
owner: Dean Fiedler
status: Repository inventory; individual design approvals remain in linked decisions
source_commit: 9921be2439ca479135482c51fbf3ed4b28615f37
---

# Powerplants One HTML design index

Use this page to find the **latest available HTML for each design family**, its recorded approval and its implementation handover. The tables distinguish files already on `main` from contributions still in open pull requests. Keep this index at one stable path and update it in the same pull request as a new design or approval decision.

**Inventory checked:** 15 September 2026, against [main at d041de7](https://github.com/deanrfiedler-gif/powerplants-one/commit/d041de7c40e7ba73acdef3252d5f18f1bf8ccb2f). All **139 HTML paths under `docs/`** are linked below: **120 UI reference files, 15 blueprint previews and four generator templates**. This is a file count, including earlier revisions and duplicates, not a count of distinct modules. Application HTML in `src/` and `public/` is outside this inventory. Open PRs #205 and #206 are listed separately and excluded from these main-branch counts. Unpublished conversation/download files cannot be established from GitHub alone.

**Scoped additions, 16 September 2026:** ES-05 presentation correction r02, ES-06 response/negotiation r01 and ES-07 item resolution/conversion r01 with detailed reports are linked below. ES-05 r01 and customer quotation r03 remain retained references. This amendment does not repeat the dated full-inventory audit above or change existing design acceptance.

**Scoped addition, 17 September 2026:** Application Shell r17 and its exact companion report are retained with the authorised implementation contribution. This does not repeat the dated inventory audit or claim deployment.

**Scoped addition, 17 September 2026:** DK-03 Output, Issue & Distribution Centre r01 and its detailed report are linked below as a new proposed design. This does not repeat the dated inventory audit, change any existing design acceptance or claim application integration.

**Latest available does not mean approved or implemented.** A higher filename revision, a successful check or a merged pull request does not establish design approval. **Approved** requires a linked Dean decision; **Proposed** and **Uploaded reference** do not establish acceptance; **Study** is explicitly unadopted scope. Recorded desktop and phone approvals retain their separate scopes. Where filenames and embedded revision labels disagree, the discrepancy is stated instead of silently choosing a new baseline.

The [accepted UI baseline register](../../standards/ui-baselines.json) retains exact baseline hashes and application mappings. This index does not replace those controls. Consult [current project status](../../STATUS.md) and the receiving handovers for application delivery evidence. Historical handovers and uploaded closeouts may still describe their original publication or browser-review checkpoints.

New packages follow the [HTML module conformance standard](../../standards/html-module-conformance.md): existing scope ID, chosen r20 page type, reused components, handover boundaries and declared departures.

## Theme and application shell

These are the latest uploaded shared visual references. Their presence does not change accepted application baseline mappings.


| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Theme / style board | [r20](theme-style-board/powerplants-one-theme-style-board-r20.html) | Latest uploaded visual reference | Matches the supplied r20 attachment byte for byte. [Shared UI specification](../../standards/ui-style-specification.md) and accepted baseline register retain implementation authority. |
| Application shell | [r17](application-shell/PPO-Application-Shell-r17.html) · [report](application-shell/PPO-Application-Shell-Report-r17.md) · [retained r14](application-shell/PPO-Application-Shell-r14.html) | r17 integration authorised by Dean; native review remains pending | Shared-frame implementation contribution: [decision](../../decisions/application-shell-integration.md), [handover](../../delivery/application-shell-handover.md). Existing module interiors and permissions remain authoritative. |

## Shared customer and platform pages

**16 September addition:** SH-03 below is a new proposed design on this contribution. The 15 September inventory counts above remain the historical audited snapshot and exclude this new HTML and its generator template.


| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| My Work & Action Centre | [r01](my-work/PPO-My-Work-and-Action-Centre-r01.html) · [detailed report](my-work/PPO-My-Work-and-Action-Centre-Report-r01.md) | Authorised design; owner acceptance and application integration pending | Extends the existing `/work`/Activities direction with six views and source-owned actions. [Decision](../../decisions/my-work-action-centre-design.md), [verification](../../testing/evidence/my-work-r01/README.md). |
| Customers, Sites & Growing Areas | [r03](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r03.html) | Proposed refinement; owner acceptance remains separate | Shared customer/location records exist; this full workspace is a design. [Workspace handover](../../decisions/customers-sites-workspace-design.md), [r03 maps](../../decisions/customers-sites-maps-r03.md). |
| Notification inbox and preferences | [r01](notifications/PPO-Notification-Inbox-and-Preferences-r01.html) | Proposed SH-03 design; owner acceptance and application integration separate | Inbox, grouped changes, owned escalations and delivery preferences. [Detailed report](notifications/PPO-Notification-Inbox-and-Preferences-Report-r01.md) · [Handover](../../decisions/notification-inbox-preferences-design.md). |
| Customer 360 | [r01](customers/PPO-Customer-360-Workspace-r01.html) · [detailed report](customers/PPO-Customer-360-Workspace-Report-r01.md) | Proposed CS-01 workspace; owner acceptance and application integration separate | Extends the customer-location workspace with deals, sales orders, cases, projects, accounts and activity; MYOB remains the intended ERP authority and live integration is outstanding. 87 model/DOM and 12 native browser groups passed. [Design and receiving handover](../../decisions/customer-360-workspace-design.md), [evidence](../../testing/evidence/customer-360-r01/README.md), [sources](../../design/customer-360/README.md). |
| Site Access & Horticultural Readiness | [r01](site-access/PPO-Site-Access-and-Horticultural-Readiness-r01.html) | Proposed CS-06 / F08 standalone design; acceptance and integration separate | Six views with explicit facility applicability, sourced visitor/biosecurity evidence, seasonal windows, scoped preparation and retained history. [Detailed report](site-access/PPO-Site-Access-and-Horticultural-Readiness-Report-r01.md) · [Handover](../../decisions/site-access-readiness-design.md). |
| Output, Issue & Distribution Centre | [r01](output-distribution/PPO-Output-Issue-and-Distribution-Centre-r01.html) · [detailed report](output-distribution/PPO-Output-Issue-and-Distribution-Centre-Report-r01.md) | Proposed DK-03 design; owner acceptance and application integration separate | Six views cover the output queue, exact issue and bundle manifest, readiness and domain review, per-recipient distribution and responses, owned recovery and change impact. Generated, issued, sent, delivered and acknowledged stay distinct. 38 model and 36 native browser groups passed. [Design and receiving handover](../../decisions/output-issue-distribution-design.md), [verification](../../testing/evidence/output-distribution-r01/README.md), [sources](../../design/output-distribution/README.md), [build plan](../../delivery/output-issue-distribution-build-plan.md). |
| Knowledge search & article detail | [r01](knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html) | Proposed DK-04; 15 model and 13 local DOM groups passed; native visual review pending | Search, saved references, watchlist, article/source applicability and exact revision history. [Detailed companion report](knowledge/PPO-Knowledge-Search-and-Article-Detail-Report-r01.md) · [Design handover](../../decisions/knowledge-search-article-design.md). |
| Site Survey & As-Found | [r01](customers/PPO-Site-Survey-and-As-Found-Workspace-r01.html) | Proposed CS-08 workspace | [Design and receiving handover](../../decisions/site-survey-workspace-design.md). |
| Equipment & Installed Base | [r02](equipment/PPO-Equipment-and-Installed-Base-Workspace-r02.html) | Proposed refinement; not an accepted application baseline | Shared equipment context exists; this workspace/inspection experience requires integration. [Decision and receiving boundary](../../decisions/equipment-workspace-design.md). |
| Customer portal | [Working preview](../../blueprints/customer-portal-mockup.html) | Direction authorised; detailed design proposed | CP1–CP5 remain staged delivery work. [Decision](../../decisions/customer-portal-direction.md), [handover](../../delivery/customer-portal-handover.md). |
| Contextual Help / Page guide | [r01](../../blueprints/contextual-help-preview.html) | Proposed details under authorised design direction | CRM guide is the design pilot; application integration pending. [Decision and handover](../../decisions/contextual-help.md). |
| Naming & Filing | [r01](../../blueprints/naming-filing-prototype/index.html) | Authorised design package; visual acceptance separate | General naming/filing assistance and SharePoint integration remain receiving work. [Decision](../../decisions/naming-communications-sharepoint.md), [preview instructions](../../blueprints/naming-filing-prototype/README.md). |
| Quality, Safety & Site Assurance | [r01](quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html) · [Detailed report](quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-Report-r01.md) | Proposed CS-06 / FI-03–FI-06 workspace; owner acceptance separate | Source preparation, inspections, retained defects/retests, incident outcomes and scoped release. [Design and receiving handover](../../decisions/quality-site-assurance-design.md). |

## CRM and communications


| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Deals — Board / Grid | [r35](crm/ppo-deal-pipeline_r35.html) | Latest uploaded design; acceptance not established by this audit | Replaces the old board/grid preview as the latest-file navigation target. [Shared UI specification](../../standards/ui-style-specification.md), [r08 implementation decision](../../decisions/shared-ui-r08-implementation.md) and [CRM handover](../../delivery/crm-ui-design-handover.md) retain their bounded authority. |
| Leads — desktop interior | [r04, declared in HTML](../../blueprints/crm-leads-desktop-preview.html) | Approved desktop refinement | Bounded manual Leads integration is recorded. Desktop approval applies to this exact reference; the phone reference remains separate. [Approval and runtime handover](../../decisions/crm-leads-runtime.md#approved-desktop-integration--10-september-2026). |
| Leads — phone and original combined preview | [r02](../../blueprints/crm-leads-preview.html) | Approved; retained phone reference | Later desktop interior uses r04 above. [Exact approval](../../decisions/crm-leads-direction.md#approved-ui-reference), [runtime handover](../../decisions/crm-leads-runtime.md). |
| Mobile CRM design review | [filename r02](crm/ppo-mobile-ui-design-review-r02.html) | Uploaded review; embedded title says r07 | Separate from the approved Leads phone reference. See revision reconciliation below; no r07-named file is present. |
| Email workspace | [r04](email-calendar/powerplants-one-email-r04.html) | Latest uploaded design; acceptance not established by this audit | Visual workspace reference; does not replace the recorded provider/permissions contract or establish application integration. |
| Email & Calendar — standalone prototype | [Uploaded preview](email-calendar/ppo-email-calendar-prototype.html) | Uploaded reference; filename has no revision | Separate single-file prototype; do not infer a revision from the Email workspace filename. |
| Email & Calendar | [Working preview](../../blueprints/email-calendar-prototype/index.html) | Authorised r02 design package; visual acceptance separate | Bounded synthetic email/link/Activity journey exists; live provider behaviour is separate. [Design](../../decisions/email-calendar-design.md), [runtime handover](../../delivery/email-calendar-journey-handover.md), [preview instructions](../../blueprints/email-calendar-prototype/README.md). |

## Estimating and quotation

**ES-10 design contribution, 17 September 2026:** [Reference Cases & Calibration Proposals r01](reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-r01.html) · [detailed report](reference-calibration/PPO-Reference-Cases-and-Calibration-Proposals-Report-r01.md). Five-view standalone r20 design; source eligibility, retained proposal reviews and estimator evidence panel. Proposed design; owner acceptance and application integration separate. [Receiving handover](../../decisions/reference-calibration-design.md), [verification](../../testing/evidence/reference-calibration-r01/README.md). This contribution is additional to the historical inventory count above.


| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Sales → Estimating intake | [r02 preview](estimating/sales-estimating-intake-preview-r02.html) | Proposed design | [r02 change record](sales/sales-estimating-intake-change-record-r02.md). Original field-bank/design reference is retained below. |
| Wizard data review | [r02](estimation-wizard/PPO-Wizard-Data-Review-r02.html) | Latest uploaded design; acceptance not established by this audit | Distinct from the advanced estimating-container study and bounded guided pilot. |
| Quotation module | [r03](quoting/ppo-quotation-module-r03.html) | Latest uploaded design; acceptance not established by this audit | [r03 audit](quoting/ppo-quotation-audit-r03.md); separate from the legacy Quotation Builder concept below. |
| Quotation approval, issue & distribution — ES-05 | [r02](quoting/PPO-Quotation-Approval-Issue-and-Distribution-r02.html) · [Detailed report r02](quoting/PPO-Quotation-Approval-Issue-and-Distribution-Report-r02.md) · retained [r01](quoting/PPO-Quotation-Approval-Issue-and-Distribution-r01.html) and [report r01](quoting/PPO-Quotation-Approval-Issue-and-Distribution-Report-r01.md) | Proposed presentation correction; native visual and owner acceptance pending | Workspace-only composition, docked basis inspection and exact output using retained r03 customer components. Approval, issue and recipient evidence retained. [Design and receiving handover](../../decisions/quotation-approval-issue-distribution-design.md). |
| Quotation response & negotiation — ES-06 | [r01](quoting/PPO-Quotation-Response-and-Negotiation-r01.html) · [Detailed report](quoting/PPO-Quotation-Response-and-Negotiation-Report-r01.md) | Proposed extension of customer quotation r03; native visual and owner acceptance pending | Exact revision/options/signature, negotiation, unknown-response recovery and prepared ES-07 handover. [Design and receiving handover](../../decisions/quotation-response-negotiation-design.md). |
| One-off item resolution and conversion — ES-07 | [r01](quoting/PPO-One-Off-Item-Resolution-and-Conversion-r01.html) · [Detailed report](quoting/PPO-One-Off-Item-Resolution-and-Conversion-Report-r01.md) | Proposed guided workflow; native visual and owner acceptance pending | Exact ES-06 accepted basis, item operations and synchronisation, company mappings, receiving review and original-operation conversion recovery. [Design and receiving handover](../../decisions/item-resolution-conversion-design.md). |
| Quotation PDF design | [r02](quoting/ppo-quotation-pdf-design-r02.html) | Latest uploaded output design; acceptance not established by this audit | [r02 change notes](quoting/ppo-quotation-pdf-design-r02-changes.md). Output layout and the interactive quotation module are distinct references. |
| Supplier Pricing & Cost Sources | [r01](supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-r01.html) · [detailed report](supplier-pricing/PPO-Supplier-Pricing-and-Cost-Sources-Report-r01.md) | Proposed PD-03 / ES-03 design; owner acceptance and application integration separate | Five views cover exact supplier evidence, independent source review, cost provenance and deliberate draft refresh. [Design handover](../../decisions/supplier-pricing-cost-sources-design.md), [verification](../../testing/evidence/supplier-pricing-r01/README.md). |
| Estimating workspace | [Working preview](../../blueprints/estimating-workspace-mockup.html) | Discovery reference; full preview is not an application acceptance claim | E1/E2 implement bounded portions. [Discovery handover](../../delivery/estimating-discovery-handover.md), [E1 handover](../../delivery/estimating-e1-handover.md). |
| E2 options and scope discovery | [Original walkthrough](../../blueprints/estimating-e2-walkthrough.html) | Historical proposal with partial policy adoption; original routing is not current authority | Adopted E2-D02/D03 and DR-02 are implemented in bounded slices. Numeric routing and other deferred rules remain unadopted. [Current authority](../../decisions/ADR-0025-e2-discovery-foundation.md), [saved-screen handover](../../delivery/estimating-e2-screens-handover.md). |
| Guided estimating pilot | [Working preview](../../blueprints/estimating-wizard-mockup.html) | Authorised bounded pilot direction; detailed result for review | Fictional supply-and-installation rules; application wizard integration remains separate. [Pilot decision](../../decisions/estimating-wizard-pilot.md). |
| Advanced estimating container | [r03 design study](../../blueprints/estimating-wizard-container.html) | Study — explicitly not adopted; supersedes nothing | Broader line editing, systems and review scope must not be inherited as approved policy. [Five propositions](../../decisions/estimating-container-propositions.md), [study specification](../../blueprints/estimating-wizard-container-design.md). |
| Quotation Builder | [Working preview](../../blueprints/quotation-builder.html) | Proposed result under authorised design direction | E1 exact Draft output exists; this broader builder requires separate implementation. [Design decision](../../decisions/quotation-builder-design.md), [specification](../../blueprints/quotation-builder-design.md). |
| Import Excel estimate | [r01 — maintained blueprint](../../blueprints/excel-estimate-import.html) | Proposed design; operational acceptance separate | This blueprint contains later containment/table-filtering fixes absent from the same-named UI-folder copy. [Import handover](../../delivery/excel-estimate-import-handover.md); application importer remains separate. |

## Engineering, projects, service and finance


| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| Products catalogue | [r04](products/PPO-Products-Preview-r04.html) | Latest uploaded design; owner/visual acceptance not established by this audit | [Preserved r04 closeout](products/ppo-session_2026-09-12_products-catalogue-r04_closeout.md) records its original evidence and limits; its historical “unpublished” statement predates the repository upload. |
| Engineering | [r02](engineering/PPO-Engineering-Container-r02.html) | Approved | Bounded Engineering intake integration exists; wider BP-05 delivery remains separate. [Accepted decision](../../decisions/engineering-r02-integration.md), [implementation handover](../../delivery/engineering-intake-handover.md). |
| Projects Gantt | [r10](projects/ppo-projects-gantt-content-r10.html) | Uploaded design reference; accepted integration is separately recorded | [Projects Gantt integration decision](../../decisions/projects-gantt-integration.md) and [handover](../../delivery/projects-gantt-integration.md). |
| Project Delivery Readiness & Change Control | [filename r02; r01 content](projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) | Proposed design; r02 upload is byte-identical to r01 | [r01 design handover](../../decisions/project-delivery-readiness-design.md) remains the receiving record. The higher filename does not establish a revised design. |
| Projects starter workspace | [r02](../../blueprints/projects-starter-visuals/r02/projects-design-review-r02.html) | Published review package; owner design acceptance not inferred from publication | Project/Gantt capability exists separately; broader starter/commercial handover acceptance remains open. [Review package](../../blueprints/projects-starter-visuals/r02/README.md), [J1 reconciliation](../../delivery/projects-j1-reconciliation.md). |
| Supply Chain Material Readiness | [r03](supply-chain/PPO-Supply-Chain-Material-Readiness-r03.html) | Latest uploaded design; acceptance not established by this audit | [Candidate readiness contract](../../contracts/supply-chain-readiness.md); uploaded HTML does not establish Supply Chain runtime delivery. |
| Service Cases & Triage | [r02](service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html) | Proposed workspace | [Design and handover](../../decisions/service-cases-workspace-design.md). The service-folder r02 upload is an exact duplicate. |
| Work Orders | [r01](service/PPO-Work-Orders-Workspace-r01.html) | Uploaded design; acceptance not established by this audit | SV work-order visual already on main. Authorisation, booking, attendance review and billing remain distinct. |
| Service Review & Reports | [r02](service-review/PPO-Service-Review-and-Reports-Workspace-r02.html) | Proposed SV-06/SV-07 workspace; owner acceptance separate | r02 is the CI-repaired successor, despite retained r01 display labels. [Design and handover](../../decisions/service-review-reports-workspace-design.md). |
| Service Job Pack | [r02](job-pack/powerplants-one-job-pack-r02.html) | Accepted predecessor; r03 is the accepted design successor. |
| Field Technicians | [r04](field-technicians/powerplants-one-field-technicians-r04.html) | Earlier design, still the recorded implementation baseline until r05 integration. |
| Finance & Commercial Controls | [r01](finance/PPO-Finance-and-Commercial-Controls-r01.html) | Preserved for comparison with the r02 proposal. |
| Service Agreements & Maintenance | [r01](maintenance/PPO-Service-Agreements-and-Maintenance-Workspace-r01.html) | Proposed MA-01–MA-05 design; native checks and capture review complete; owner acceptance and application integration separate | Sourced coverage, recurring obligations, owned requests and renewal preparation. [Design and receiving handover](../../decisions/service-agreements-maintenance-design.md). |
| Warranty & Customer Resolution | [r01](warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) | Proposed MA-06/MA-07 design; 25 model and 17 native browser groups passed; captures reviewed; owner acceptance separate | Evidence, independent decisions, retained replacement history and outstanding supplier recovery. [Detailed companion report](warranty/PPO-Warranty-and-Customer-Resolution-Workspace-Report-r01.md) · [Handover](../../decisions/warranty-customer-resolution-design.md). |
| Specialist configuration / Screen Systems | [r02](specialist/PPO-Specialist-Configuration-Workbench-r02.html), [detailed report](specialist/PPO-Specialist-Configuration-Workbench-Report-r02.md) | Proposed source-informed successor; r01 preserved | [Design and source audit](../../decisions/specialist-screen-systems-design.md). Recovered calculations and review workflow; current mappings, ranges and engineering acceptance remain open. |

## Preserved earlier revisions


Earlier files and duplicate upload paths remain unchanged. Use the primary tables above for current navigation; an accepted predecessor may still be the implementation baseline. The complete earlier-file list appears after the workflow-map and pending-contribution tables.


## Workflow maps and page coverage

These are planning and journey references, distinct from interactive workspace designs. The latest map in a family does not establish that every page it describes has been designed or implemented.

| Reference | Latest file on main | Notes |
|---|---|---|
| HTML page coverage register | [r06](module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) | Latest available register; this audit does not recalculate its design coverage claims. |
| Administration Configuration and Operational Support Workflow Map | [r01](module-workflow-maps/PPO-Administration-Configuration-and-Operational-Support-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Assistant and User Guidance Workflow Map | [r01](module-workflow-maps/PPO-Assistant-and-User-Guidance-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Business Acceptance Training and Operational Readiness Workflow Map | [r01](module-workflow-maps/PPO-Business-Acceptance-Training-and-Operational-Readiness-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| CRM and Sales Workflow Map | [r01](module-workflow-maps/PPO-CRM-and-Sales-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Data Migration Coexistence and Cutover Workflow Map | [r01](module-workflow-maps/PPO-Data-Migration-Coexistence-and-Cutover-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Email Calendar and Communications Workflow Map | [r01](module-workflow-maps/PPO-Email-Calendar-and-Communications-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| End to End Customer Journeys and Handover Control Map | [r01](module-workflow-maps/PPO-End-to-End-Customer-Journeys-and-Handover-Control-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Engineering and Design Control Workflow Map | [r01](module-workflow-maps/PPO-Engineering-and-Design-Control-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Equipment and Installed Base Lifecycle Workflow Map | [r01](module-workflow-maps/PPO-Equipment-and-Installed-Base-Lifecycle-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Estimating and Quotation Workflow Map | [r03](module-workflow-maps/PPO-Estimating-and-Quotation-Workflow-Map-r03.html) | Uploaded planning reference; approval is not established by this inventory. |
| Estimation Wizard Workflow and Rules Map | [r01](module-workflow-maps/PPO-Estimation-Wizard-Workflow-and-Rules-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Finance and Commercial Controls Workflow Map | [r02](module-workflow-maps/PPO-Finance-and-Commercial-Controls-Workflow-Map-r02.html) | Filename r02; embedded title/metadata retain r01. Revision reconciliation is required before treating it as a new approved map. |
| Master Workflow Map Index and Coverage Audit | [r01](module-workflow-maps/PPO-Master-Workflow-Map-Index-and-Coverage-Audit-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Module Map and Journeys | [r11](module-workflow-maps/PPO-Module-Map-and-Journeys-r11.html) | Uploaded planning reference; approval is not established by this inventory. |
| Products and Catalogue Management Workflow Map | [r01](module-workflow-maps/PPO-Products-and-Catalogue-Management-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Projects and Commercial Delivery Workflow Map | [r01](module-workflow-maps/PPO-Projects-and-Commercial-Delivery-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Quality Safety and Site Assurance Workflow Map | [r01](module-workflow-maps/PPO-Quality-Safety-and-Site-Assurance-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Reporting Dashboards and Management Review Workflow Map | [r01](module-workflow-maps/PPO-Reporting-Dashboards-and-Management-Review-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Resource Planning Scheduling and Dispatch Workflow Map | [r01](module-workflow-maps/PPO-Resource-Planning-Scheduling-and-Dispatch-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Service Agreements Recurring Maintenance and Renewals Workflow Map | [r01](module-workflow-maps/PPO-Service-Agreements-Recurring-Maintenance-and-Renewals-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |
| Service Operations Workflow Map | [r01](module-workflow-maps/PPO-Service-Operations-Workflow-Map-r01.html) | Uploaded planning reference; approval is not established by this inventory. |


## Designs available in open pull requests

Checked at [PR #205](https://github.com/deanrfiedler-gif/powerplants-one/pull/205), head `95396354660f80a75ce0aef9868a8e26499cc8c0`, and [draft PR #206](https://github.com/deanrfiedler-gif/powerplants-one/pull/206), head `8c690c5111cf7ff35d865ff9628195df70384610`. These links are pinned to inspected commits. **The files below are available for review but were not on main at this audit snapshot.** They are excluded from the 139-file count. After merge, replace these pointers with relative links and reconcile the inventory; do not infer design approval from the merge.

| Page or reference | Published review file | Publication / scope |
|---|---|---|
| Scheduling & Appointments | [r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/95396354660f80a75ce0aef9868a8e26499cc8c0/docs/reference/ui/service/PPO-Scheduling-and-Appointments-Workspace-r01.html) | #205; proposed uploaded workspace. |
| Warranty & Customer Resolution / Supplier Recovery | [r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/8c690c5111cf7ff35d865ff9628195df70384610/docs/reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-r01.html) · [Detailed companion report](https://github.com/deanrfiedler-gif/powerplants-one/blob/8c690c5111cf7ff35d865ff9628195df70384610/docs/reference/ui/warranty/PPO-Warranty-and-Customer-Resolution-Workspace-Report-r01.md) | Draft #206; proposed MA-06/MA-07 design; owner acceptance and application integration remain separate. |
| Supply Chain Management workflow map | [r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/95396354660f80a75ce0aef9868a8e26499cc8c0/docs/reference/ui/module-workflow-maps/PPO-Supply-Chain-Management-Workflow-Map-r01.html) | #205; planning reference. |
| Shared Platform & Information Control workflow map | [r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/95396354660f80a75ce0aef9868a8e26499cc8c0/docs/reference/ui/module-workflow-maps/PPO-Shared-Platform-and-Information-Control-Workflow-Map-r01.html) | #205; planning reference. |
| Menu rail symbol review | [r01](https://github.com/deanrfiedler-gif/powerplants-one/blob/95396354660f80a75ce0aef9868a8e26499cc8c0/docs/reference/ui/ppo-menu-rail-symbol/ppo-menu-rail-symbol-review-r01.html) | #205; supporting visual review, separate from Shell r14. |
| Warranty generator template | [Template](https://github.com/deanrfiedler-gif/powerplants-one/blob/8c690c5111cf7ff35d865ff9628195df70384610/docs/design/warranty/template.html) | Draft #206; source template, not the standalone customer-resolution workspace. |

PR #205 also uploads 13 Deals HTML files under `deals/`, plus Maintenance r01 and Service Review r01 under `service/`. Their Git blob identities match existing main files. They are duplicate upload locations, not newer module revisions. In particular, its Service Review r01 must not replace main's repaired r02; the primary links above remain authoritative navigation targets.


## Revision and duplicate reconciliation

| Finding | Index treatment |
|---|---|
| Desktop Leads upload is named r01, while its content declares r04; it is byte-identical to the approved stable desktop preview. | Keep the approved r04 blueprint as the primary reference; retain the upload as an alias below. |
| Mobile CRM review filename says r02, while the document title says r07. | Link the actual r02-named file and disclose the title mismatch; keep the approved Leads phone design separate. |
| Project Delivery Readiness r02, r01 and the versionless upload are byte-identical; the content declares r01. | Expose the highest available filename, explicitly labelled r01 content, alongside its r01 handover. Do not infer a new design revision. |
| Service Review r02 retains r01 title/metadata but contains the documented CI repair. | Use r02 as the successor and preserve r01; the handover explains the bounded change. |
| Finance workflow-map filename says r02, while title/metadata say r01. | Disclose the mismatch alongside the latest uploaded path; approval remains unresolved by this audit. |
| Excel-import copies have the same name/revision but differ in content. | Keep the maintained blueprint containing later containment and required-table filtering fixes as primary; the UI-folder copy is historical. |
| Service Cases, the advanced estimating container and Job Pack r02 have duplicate upload locations. | Prefer the path used by the relevant handover/baseline and retain all aliases. No issued HTML was renamed, edited or removed. |

## Supporting references and generator sources

| Reference | File or source | How to use it |
|---|---|---|
| CRM discovery walkthrough | [Seven-screen wireframes](../../blueprints/crm-wireframes.html) | Supporting discovery evidence. [CRM discovery handover](../../delivery/crm-discovery-handover.md). |
| PPO × MYOB integration handbook | [Complete rendered r01 handbook](integrations/ppo-myob-integration-handbook-r01.html) | Use the complete document for review. [Discovery handover](../../decisions/myob-handbook-discovery.md); field mappings remain proposals pending installed ERP evidence. |
| MYOB handbook generator | [Template](../../design/myob-integration/template.html) · [Content](../../design/myob-integration/content.json) | Supporting source for the [generator](../../../scripts/build-myob-handbook.py), not the complete handbook. |
| Maintenance generator | [Template](../../design/maintenance/template.html) | Source template; use the standalone Maintenance workspace above for review. |
| Project Delivery Readiness generator | [Template](../../design/projects-delivery-readiness/template.html) | Source template; use the issued workspace above for review. |
| Service Review generator | [Template](../../design/service-review/template.html) | Source template; use the issued r02 workspace above for review. |

The retired CRM capture gallery is intentionally absent. Its [retirement decision](../../decisions/crm-mockup-retirement.md) retains historical recovery instructions. Theme r20 and Cases & Triage r02 are now on main and linked above; the former index's statement that these still needed to be supplied is obsolete.

## Earlier files and upload aliases

These links complete the main-branch inventory. This section includes superseded references, accepted predecessors, exact duplicates and the original intake field-bank design; they are not all obsolete in the same sense. Files above remain the primary review targets.

| Family | Preserved files | Relationship |
|---|---|---|
| Earlier blueprint previews | [crm-board-grid-mockup.html](../../blueprints/crm-board-grid-mockup.html) | Historical Deals board/grid preview; the latest uploaded Deals design is r35. |
| application-shell | [PPO-Application-Shell-r11.html](application-shell/PPO-Application-Shell-r11.html), [PPO-Application-Shell-r12.html](application-shell/PPO-Application-Shell-r12.html), [PPO-Application-Shell-r13.html](application-shell/PPO-Application-Shell-r13.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| crm | [PPO-Leads-Desktop-Container-r01.html](crm/PPO-Leads-Desktop-Container-r01.html), [ppo-deal-pipeline_r18.html](crm/ppo-deal-pipeline_r18.html), [ppo-deal-pipeline_r23.html](crm/ppo-deal-pipeline_r23.html), [ppo-deal-pipeline_r25.html](crm/ppo-deal-pipeline_r25.html), [ppo-deal-pipeline_r26.html](crm/ppo-deal-pipeline_r26.html), [ppo-deal-pipeline_r27.html](crm/ppo-deal-pipeline_r27.html), [ppo-deal-pipeline_r28.html](crm/ppo-deal-pipeline_r28.html), [ppo-deal-pipeline_r29.html](crm/ppo-deal-pipeline_r29.html), [ppo-deal-pipeline_r30.html](crm/ppo-deal-pipeline_r30.html), [ppo-deal-pipeline_r31.html](crm/ppo-deal-pipeline_r31.html), [ppo-deal-pipeline_r32.html](crm/ppo-deal-pipeline_r32.html), [ppo-deal-pipeline_r33.html](crm/ppo-deal-pipeline_r33.html), [ppo-deal-pipeline_r34.html](crm/ppo-deal-pipeline_r34.html) | Earlier Deals revisions and the exact desktop Leads upload alias; mobile review is listed above. |
| customers | [PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r01.html), [PPO-Customers-Sites-and-Growing-Areas-Workspace-r02.html](customers/PPO-Customers-Sites-and-Growing-Areas-Workspace-r02.html) | Earlier revisions retained for comparison with the r03 proposal above. |
| email-calendar | [powerplants-one-email-r03.html](email-calendar/powerplants-one-email-r03.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| engineering | [PPO-Engineering-Container-r01.html](engineering/PPO-Engineering-Container-r01.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| equipment | [PPO-Equipment-and-Installed-Base-Workspace-r01.html](equipment/PPO-Equipment-and-Installed-Base-Workspace-r01.html) | Earlier revision retained for comparison with the r02 proposal above. |
| estimating | [PPO-Estimation-Wizard-Container-r01.html](estimating/PPO-Estimation-Wizard-Container-r01.html), [PPO-Estimation-Wizard-Container-r03.html](estimating/PPO-Estimation-Wizard-Container-r03.html), [excel-estimate-import.html](estimating/excel-estimate-import.html) | Original container r01; r03 is an exact alias of the study blueprint; Excel import is an earlier copy than its maintained blueprint. |
| estimation-wizard | [PPO-Wizard-Data-Review-r01.html](estimation-wizard/PPO-Wizard-Data-Review-r01.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| field-technicians | [powerplants-one-field-technicians-r05.html](field-technicians/powerplants-one-field-technicians-r05.html), [powerplants-one-job-pack-r02.html](field-technicians/powerplants-one-job-pack-r02.html) | Field r04 remains the recorded implementation baseline; Job Pack r02 is an exact upload alias. |
| finance | [PPO-Finance-and-Commercial-Controls-r02.html](finance/PPO-Finance-and-Commercial-Controls-r02.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| job-pack | [powerplants-one-job-pack-r03.html](job-pack/powerplants-one-job-pack-r03.html) | Accepted Job Pack r02 predecessor; r03 is the approved design successor. |
| module-page-register | [PPO-HTML-Page-Coverage-Register-r02.html](module-page-register/PPO-HTML-Page-Coverage-Register-r02.html), [PPO-HTML-Page-Coverage-Register-r03.html](module-page-register/PPO-HTML-Page-Coverage-Register-r03.html), [PPO-HTML-Page-Coverage-Register-r04.html](module-page-register/PPO-HTML-Page-Coverage-Register-r04.html), [PPO-HTML-Page-Coverage-Register-r05.html](module-page-register/PPO-HTML-Page-Coverage-Register-r05.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| module-workflow-maps | [PPO-Estimating-and-Quotation-Workflow-Map-r02.html](module-workflow-maps/PPO-Estimating-and-Quotation-Workflow-Map-r02.html), [PPO-Estimating-and-Quoting-Workflow-Map-r01.html](module-workflow-maps/PPO-Estimating-and-Quoting-Workflow-Map-r01.html), [PPO-Estimating-and-Quoting-Workflow-Map-r02.html](module-workflow-maps/PPO-Estimating-and-Quoting-Workflow-Map-r02.html), [PPO-Module-Map-and-Journeys-r07.html](module-workflow-maps/PPO-Module-Map-and-Journeys-r07.html), [PPO-Module-Map-and-Journeys-r08.html](module-workflow-maps/PPO-Module-Map-and-Journeys-r08.html), [PPO-Module-Map-and-Journeys-r09.html](module-workflow-maps/PPO-Module-Map-and-Journeys-r09.html), [PPO-Module-Map-and-Journeys-r10.html](module-workflow-maps/PPO-Module-Map-and-Journeys-r10.html) | Earlier journey and estimating/quotation map revisions, including the former Quoting filename family. |
| products | [PPO-Products-Preview-r01.html](products/PPO-Products-Preview-r01.html), [PPO-Products-Preview-r02.html](products/PPO-Products-Preview-r02.html), [PPO-Products-Preview-r03.html](products/PPO-Products-Preview-r03.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| projects | [PPO-Project-Delivery-Readiness-and-Change-Control-r01.html](projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html), [project-delivery-readiness-and-change-control.html](projects/project-delivery-readiness-and-change-control.html) | r01 and versionless readiness files are exact copies of the r02-named upload, all declaring r01 content. |
| quoting | [ppo-quotation-module-r02.html](quoting/ppo-quotation-module-r02.html), [ppo-quotation-pdf-design-r01.html](quoting/ppo-quotation-pdf-design-r01.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| sales | [sales-estimating-intake-design-r01.html](sales/sales-estimating-intake-design-r01.html), [sales-estimating-intake-preview-r01.html](sales/sales-estimating-intake-preview-r01.html) | Original r01 intake field-bank/design reference and predecessor preview; the interactive successor is r02. |
| service | [PPO-Service-Cases-and-Triage-Workspace-r01.html](service/PPO-Service-Cases-and-Triage-Workspace-r01.html), [PPO-Service-Cases-and-Triage-Workspace-r02.html](service/PPO-Service-Cases-and-Triage-Workspace-r02.html) | Cases r01/r02 are exact copies of the service-cases references. |
| service-cases | [PPO-Service-Cases-and-Triage-Workspace-r01.html](service-cases/PPO-Service-Cases-and-Triage-Workspace-r01.html) | Cases r01 predecessor; r02 is the current proposed workspace. |
| service-review | [PPO-Service-Review-and-Reports-Workspace-r01.html](service-review/PPO-Service-Review-and-Reports-Workspace-r01.html) | Preserved r01 before the r02 CI repair. |
| supply-chain | [PPO-Supply-Chain-Material-Readiness-r01.html](supply-chain/PPO-Supply-Chain-Material-Readiness-r01.html), [PPO-Supply-Chain-Material-Readiness-r02.html](supply-chain/PPO-Supply-Chain-Material-Readiness-r02.html), [PPO-Supply-Chain-Material-Readiness-r02a.html](supply-chain/PPO-Supply-Chain-Material-Readiness-r02a.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |
| theme-style-board | [powerplants-one-theme-style-board-r03.html](theme-style-board/powerplants-one-theme-style-board-r03.html), [powerplants-one-theme-style-board-r05.html](theme-style-board/powerplants-one-theme-style-board-r05.html), [powerplants-one-theme-style-board-r06.html](theme-style-board/powerplants-one-theme-style-board-r06.html), [powerplants-one-theme-style-board-r07.html](theme-style-board/powerplants-one-theme-style-board-r07.html), [powerplants-one-theme-style-board-r08.html](theme-style-board/powerplants-one-theme-style-board-r08.html), [powerplants-one-theme-style-board-r09.html](theme-style-board/powerplants-one-theme-style-board-r09.html), [powerplants-one-theme-style-board-r10.html](theme-style-board/powerplants-one-theme-style-board-r10.html), [powerplants-one-theme-style-board-r11.html](theme-style-board/powerplants-one-theme-style-board-r11.html), [powerplants-one-theme-style-board-r12.html](theme-style-board/powerplants-one-theme-style-board-r12.html), [powerplants-one-theme-style-board-r13.html](theme-style-board/powerplants-one-theme-style-board-r13.html), [powerplants-one-theme-style-board-r14.html](theme-style-board/powerplants-one-theme-style-board-r14.html), [powerplants-one-theme-style-board-r15.html](theme-style-board/powerplants-one-theme-style-board-r15.html), [powerplants-one-theme-style-board-r16.html](theme-style-board/powerplants-one-theme-style-board-r16.html), [powerplants-one-theme-style-board-r17.html](theme-style-board/powerplants-one-theme-style-board-r17.html), [powerplants-one-theme-style-board-r18.html](theme-style-board/powerplants-one-theme-style-board-r18.html), [powerplants-one-theme-style-board-r19.html](theme-style-board/powerplants-one-theme-style-board-r19.html) | Earlier revisions; use the latest available family reference above, subject to its recorded approval status. |

## How to maintain the index

Dean is the design owner. Whoever adds or revises a design updates its index row in the same branch and pull request. There is no separate spreadsheet to reconcile and no schedule is created by this index.

1. **Check for an existing page.** Compare both the filename and content. Reuse its section and reference; do not upload a duplicate merely because a download has `(1)` in its name. Keep distinct desktop/phone references when their accepted scopes differ.
2. **Add the issued HTML with its revision.** For new issued visuals, use `docs/reference/ui/<module>/` and retain the agreed `rNN` filename. Preserve earlier reviewed/accepted bytes. Include required assets and instructions. Existing stable preview filenames keep their current paths and Git history; do not rename established files or break manifests merely to standardise this index.
3. **Update the row, inventory and date.** Link the new file, record its actual revision, design status, bounded implementation state and evidence. If replacing the review reference, retain the earlier file in the inventory without deleting it. If approval has not been recorded, say Proposed or Approval not recorded.
4. **Record approval explicitly.** When Dean approves a particular revision, record the date, exact file/revision, accepted scope and decision in `docs/decisions/`. Keep the accepted baseline pointer separate from a newer proposal. Update the existing baseline register and source manifest where that reference is controlled, including its exact hash; preserve predecessor records. Approval of desktop appearance does not automatically approve mobile behaviour, business rules or the whole module.
5. **Link implementation evidence when it changes.** Reconcile open-PR entries after merge so pending links do not linger. Update the application note with the relevant handover/PR and actual verification limits. An HTML upload alone does not change the implemented revision. Preserve the distinction between design approval, code delivery, acceptance and deployment.
6. **Check and publish together.** Open the HTML using its documented preview method and check its assets when HTML changed. Check index links, run the applicable documentation checks below, and create a normal pull request. Update `docs/STATUS.md` only for material status changes. Recheck the inventory if another branch added a design before merge.

GitHub renders this Markdown index directly. An HTML link normally opens source in GitHub; download a self-contained preview to open it in a browser, or follow its accompanying README for assets/generation. Do not enable public hosting merely to maintain this index.

## Copyable row template

Copy this row into the relevant table. Replace each placeholder with facts and relative Markdown links to real files. Remove the placeholders before committing; do not invent a revision or approval to fill a cell.

```markdown
| Page or workspace | Repository HTML reference | Recorded design status | Application scope and evidence |
|---|---|---|---|
| MODULE — PAGE | REVISION and relative HTML link | Proposed; approval not recorded | Design only / bounded implementation summary. Link the decision and receiving handover or PR. |
```

If a new r03 is proposed while r02 remains approved, the status cell should read: `r03 proposed; r02 remains the approved reference`, with a link to r02 and its approval decision. If no revision is declared in an existing stable HTML file, use `Working preview` and link its source/decision rather than borrowing an unrelated template's revision.

The maintenance pull request should identify: the page changed; previous and new reference; reason for the revision; actual approval evidence or its absence; implementation impact; and checks performed. Routine index-row edits use Git history. The index's own `r02` metadata identifies this maintained index edition; it is not the revision of every listed design.

## Audit result and validation

The previous index linked only **31 of the 139 HTML paths** now on main and still described a historical 28-file snapshot. This revision accounts for the **108 previously unlinked paths**, updates latest-module navigation, restores the complete rendered MYOB handbook, and separates workspace designs, workflow maps, source templates, earlier revisions and pending contributions. It compares filename revisions, embedded labels and exact duplicate content rather than ranking filenames alone.

The main-branch snapshot is reproducible from the source commit in this page's metadata. Inventory scope is `git ls-tree -r --name-only SOURCE_COMMIT -- docs` filtered to `.html`. Every path in that set has a relative link on this page; all relative file links were checked against the working tree. Pending links were checked against the inspected PR trees. All issued HTML bytes and accepted baseline hashes are preserved. No fresh browser review, application acceptance, deployment or business approval is claimed.

Run from the repository root:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
git diff --check
```

The maintenance pull request records the actual check results and publication source. Reconcile the inventory and the two pending contribution records against current main before a later update; this dated audit is not an automatic synchronisation service.

