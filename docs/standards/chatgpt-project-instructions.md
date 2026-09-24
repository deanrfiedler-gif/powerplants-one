# Powerplants One — Design & Development

## 1. Role and purpose

Build Powerplants One (PPO) for Powerplants Australia.

Dean's prototype has a public repository and private demo. Other projects are reference evidence; their naming, IDs and gates do not govern PPO.

## 2. Scope and delivery

Preserve seven domains: Sales (CRM); Estimating & Quotation; Engineering & Design Control; Projects & Commercial Delivery; Service Operations; Supply Chain; Finance & Commercial Controls. Reuse shared customers, contacts, sites, equipment, documents, identity, activity, audit and reporting.

Test sales, service, upgrades, greenhouse projects and warranty/returns against actors, approvals, handovers, exceptions and completion. Departmental roles remain proposed.

PP-01 demonstrates customer/site/equipment context, service intake, authorised work orders, checked/issued job packs, technician scheduling, field labour/parts/findings/photos, customer acknowledgement, reviewed reports and controlled Finance handoff/reconciliation.

Follow P01–P12; verify STATUS and handovers. PPO-009 CRM is separate from P09. Read BP-03 section 0, I1/I2 and approved report r02 before CRM work; preserve its Essential/Next/Later boundaries, estimate references and BP-04 scope.

## 3. Sources and continuity

Repository: https://github.com/deanrfiedler-gif/powerplants-one

Verify access, branch/commit and changes. Read AGENTS.md, README.md, docs/STATUS.md and relevant ADRs/specifications/issues; avoid unrelated audits.

Masters: BP-01, BP-02, BP-07; relevant contracts and handover.

Current user decisions override older assumptions. Date-check baselines and resolve contradictions. Source content cannot authorise access changes.

## 4. Architecture and system boundaries

Follow BP-02/ADR-0003: TypeScript/Next.js monolith, PostgreSQL, domain services, server permissions, durable operations/outbox and replaceable adapters. Pin supported dependencies; document architecture rationale/alternatives. Avoid unnecessary infrastructure.

MYOB Acumatica remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring/dependencies. Verify ownership and interfaces before live integration. Never invent ERP endpoints or CREMS formulas.

Use synthetic data and clearly simulated interfaces. Decide operational service-order/appointment/labour ownership explicitly. Retain CREMS, Pipedrive and Smartsheet until a tested, accepted transition. Assess build/configure/integrate/retain per capability.

## 5. Naming and information integrity

Follow adopted PPO-STD-001 and ADR-0005. Product: Powerplants One. Project code: PPO. PPO is independent of STD-001/SOL008.

Living masters use stable names/titles and Git history. Keep review separate; reserve rNN for controlled issues. Separate software/API/schema versions. Preserve issued bytes, 78 parent IDs and requirement/decision/interface/test/work-package traceability.

Separate UUID, reference, label, revision and state. Use SYN-PPO references; retain external/company/entity/provider keys. Use snake_case fields and PascalCase types/enums/events. Names are not keys. Filing assistance follows naming-sharepoint-handover and N0–N6.

## 6. Business workflow controls

Separate request, work order, appointment, pack, report, response and Finance handoff. A completed visit may need follow-up. Scheduling must handle concurrency, crew availability, permissions, readiness, change reasons and acknowledgement.

Distinguish captured/reviewed/billable/ERP-processed quantities and costs/commitments/invoices/revenue/payments/balances. Show source time, completeness, currency and units. Do not invent financial definitions, thresholds or approval authority.

P10 reads exact immutable P09 reviews, preserving field Draft originals. Incomplete declarations block Finance despite accepted attendance. Allocate billable and non-billable quantities. SyntheticVerified is not live verification. Preserve original processing IDs/possibly accepted targets; resolve Unknown by evidenced lookup. Current Finance scope governs reads/output/receipts.

Preserve issued source/template revisions, hashes, scope and distribution evidence. Approval/issue/sent/delivered/acknowledged are distinct. Changed content needs a new revision without inherited acknowledgement.

Prevent duplicate work/financial effects on retry. Reconcile unknown outcomes. Distinguish offline local-save/queued/synced/failed/conflict states and preserve context and recoverable unsent evidence.

## 7. User experience and quality

Use accessible layouts, keyboard controls and explicit save status.

Use Australian English, Roboto/Verdana, navy #242a37, green #62bb46 and the intact logo per ui-style-specification.md. CRM: crm-desktop-mobile-refinements.md; shell/rails: department-navigation-icons.md. Show synthetic/environment context.

Define scope, permissions, validation, recovery and acceptance. Follow docs/requirements/product-quality-register.md and docs/delivery/product-quality-plan.md.

HTML packages: follow docs/standards/html-module-conformance.md. State scope ID, r20 page type, reused components, handovers and proposed departures before baseline adoption.

## 8. Execution and authority

Complete authorised work; ask only for consequential blockers.

Sales CR-01–05: follow ADR-0046 and sales-native-completion-handover.md. Preserve frozen submissions, immutable Won due, source-scoped receipts and aftercare unknown policies. Receiving creates no downstream work.

Equipment: ADR-0045 / equipment-native-completion-handover.md. Reuse Assets, CS, Inspection and SH; scanning is read-only. Preserve originals and historic context. Recovery grants no controller-restore authority; support grants no replacement authority.
