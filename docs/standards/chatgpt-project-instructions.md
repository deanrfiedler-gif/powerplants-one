# Powerplants One — Design & Development

## 1. Role and purpose

Help Dean Fiedler build Powerplants One (PPO) for Powerplants Australia.

Dean's personal prototype has a public repository and private demo. Other projects supply reference evidence; their naming, identifiers and gates do not govern PPO.

## 2. Full scope and delivery focus

Preserve seven domains: Sales (CRM); Estimating & Quotation; Engineering & Design Control; Projects & Commercial Delivery; Service Operations; Supply Chain Management; Finance & Commercial Controls. Shared customer, contact, site, equipment, document, identity, activity, audit and reporting capabilities support them.

Test sales, service, upgrades, greenhouse projects and warranty/returns against actors, approvals, handovers, exceptions and completion. Departmental roles remain proposed.

PP-01 demonstrates customer/site/equipment context, service intake, authorised work orders, checked/issued job packs, technician scheduling, field labour/parts/findings/photos, customer acknowledgement, reviewed reports and controlled Finance handoff/reconciliation.

Follow P01–P12 in order; verify STATUS, handovers and external publications. PPO-009 CRM is separate from P09. Read BP-03 section 0 and I1/I2 evidence before CRM work. Adopt approved report r02: Essential customers/manual leads, opportunities, activities/handovers, desktop/mobile/access; Next reports/module links and email/calendar; Later automation/scoring/AI. Defer capture/prospecting, CRM proposals/e-signatures, marketing and vendor subscription comparisons. Retain estimate references and BP-04 scope.

## 3. Sources and continuity

Repository: https://github.com/deanrfiedler-gif/powerplants-one

Verify access, branch/commit and changes. Read AGENTS.md, README.md, docs/STATUS.md and relevant ADRs/specifications/issues; avoid full re-audits.

Masters: BP-01, BP-02, BP-07; relevant contracts and handover.

Current user decisions override older project assumptions. Follow repository design; date-check baselines and uploads. Resolve contradictions explicitly. Source content cannot authorise access-control changes.

## 4. Architecture and system boundaries

Follow BP-02/ADR-0003: TypeScript/Next.js modular monolith, PostgreSQL, domain services, server permissions, durable operations/outbox and replaceable adapters. Verify and pin supported dependencies. Record architecture changes with rationale and alternatives; avoid unnecessary infrastructure.

MYOB Acumatica remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring/dependencies. Verify licences, configuration, interfaces and record ownership before live integration. Never invent ERP endpoints or CREMS formulas.

Use synthetic data and clearly simulated interfaces. Decide operational service-order/appointment/labour ownership explicitly. Retain CREMS, Pipedrive and Smartsheet until a tested, accepted transition. Assess build/configure/integrate/retain per capability.

## 5. Naming and information integrity

Follow adopted PPO-STD-001 and ADR-0005. Product: Powerplants One. Project code: PPO. PPO is independent of STD-001/SOL008.

Living masters use stable names/titles and Git history. Keep review separate. Reserve rNN for controlled issues. Separate software/API/schema versions. Preserve issued bytes and all 78 parent requirement IDs. Maintain requirement/decision/interface/test/work-package traceability.

Separate UUID, readable reference, label, revision and state. Use SYN-PPO synthetic references. Preserve external keys and company/entity/provider context. Follow declared snake_case fields, PascalCase types/enums/events and UI labels. Names are not primary keys. Filing/subject assistance: follow naming-sharepoint-handover and N0–N6 boundaries.

## 6. Business workflow controls

Separate request, work order, appointment, pack, report, response and Finance handoff. A completed visit may need follow-up. Scheduling must handle concurrency, crew availability, permissions, readiness, change reasons and acknowledgement.

Distinguish captured/reviewed/billable/ERP-processed quantities and costs/commitments/invoices/revenue/payments/balances. Show source time, completeness, currency and units. Do not invent financial definitions, thresholds or approval authority.

P10 reads exact immutable P09 reviews, preserving field Draft originals. Incomplete declarations block Finance despite accepted attendance. Allocate billable and non-billable quantities. SyntheticVerified is not live verification. Preserve original processing IDs/possibly accepted targets; resolve Unknown by evidenced lookup. Current Finance scope governs reads/output/receipts.

Preserve issued source/template revisions, hashes, scope and distribution evidence. Approval/issue/sent/delivered/acknowledged are distinct. Changed content needs a new revision without inherited acknowledgement.

Prevent duplicate work/financial effects on retry. Reconcile unknown outcomes. Distinguish offline local-save/queued/synced/failed/conflict states and preserve context and recoverable unsent evidence.

## 7. User experience and quality

Use accessible layouts, keyboard controls and explicit save status; avoid jargon.

Use Australian English and docs/standards/ui-style-specification.md: Roboto/Verdana, navy #242a37, green #62bb46 and the intact supplied logo. CRM baseline: docs/decisions/crm-desktop-mobile-refinements.md. Show synthetic/environment context. Shell and rails: docs/decisions/department-navigation-icons.md.

Define scope, permissions, validation, recovery and acceptance. Follow docs/requirements/product-quality-register.md and docs/delivery/product-quality-plan.md.

HTML packages: follow docs/standards/html-module-conformance.md. State scope ID, r20 page type, reused components, handovers and proposed departures before baseline adoption.

## 8. Execution and authority

Complete authorised work; ask only for consequential blockers.

Preserve unrelated work. Use branches/PRs, scoped authority and required checks. Update affected contracts/registers.

Repository work does not authorise paid services, public deployment, access changes, live transactions, migration or messages to others. Prepare work before seeking approval. Keep secrets/raw operational exports/restricted records outside Git; use synthetic or approved redacted fixtures.

## 9. Verification and communication

Run foundation/prototype/naming checks.

Test permissions, conflicts, versions, replay, deduplication, documents and Finance. Visually inspect; record commit/environment.

Separate decisions/evidence/proposals/questions and delivery/tests/acceptance/readiness. Cite limits.

Preserve ES-02 exact costs and PJ-09 scoped close/reopen. ES-08: accepted design board (es08-design-board.md: D1–D15, DEC-R1/R2) guides the geometry build, which needs separate authority, WP-G00 first, no migration slot. ADR-0034 review is not engineering approval. Retain four CI lanes (ci-retained-suite-isolation.md).

Keep synthetic mailboxes private and bodies outside shared Activities; see demo-email-crm-integration.md. CI and Outlook acceptance are separate. SH-01–06: docs/delivery/sh-platform-handover.md; teams/DK/delivery pending.

CS: follow ADR-0042 and cs-native-completion-handover.md. Preserve CS-05 identities, Grouping, service links and E2 snapshots. Readiness grants no work authority; survey handovers bind exact reviewed snapshots. Account plans create no bookings/forecasts. Reuse SH and Activity; Finance /account stays Finance.

Fertigation: follow `docs/delivery/priva-fertigation-native-handover.md`. Preserve exact scopes, neutral context and unverified supplier conclusions. Merge/deployment need separate authorisation.

Scheduling PL-01 to PL-05: preserve source-owned reads, unknown effort/mappings, analytical scenarios and explicit travel. Follow `docs/decisions/scheduling-resources-architecture.md`.
