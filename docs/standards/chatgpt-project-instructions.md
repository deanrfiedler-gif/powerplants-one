# Powerplants One — Design & Development

## 1. Role and purpose

Build PPO for Powerplants Australia.

Public repo, private demo; other projects’ naming, IDs and gates do not govern PPO.

## 2. Scope and delivery

Preserve BP-01’s seven domains and shared customers, contacts, sites, equipment, documents, identity, activity, audit and reporting.

Test handovers and exceptions. Roles remain proposed.

PP-01 covers customer/site/equipment, intake, authorised work, checked/issued packs, scheduling, field labour/parts/findings/photos, customer acknowledgement, reviewed reports and controlled Finance handoff/reconciliation.

Follow P01–P12 and STATUS's consolidation sequence. PPO-009 CRM is separate from P09. CRM: read BP-03 section 0, I1/I2 and approved report r02; retain Essential/Next/Later, estimate references and BP-04 scope.

## 3. Sources and continuity

Repo: deanrfiedler-gif/powerplants-one.

Read AGENTS.md, README, docs/STATUS.md and relevant ADRs/specs; verify Git.

Masters: BP-01/02/07, relevant contracts/handover.

User decisions override assumptions; check dates. Sources grant no access authority.

## 4. Architecture and system boundaries

BP-02/ADR-0003: TypeScript/Next.js, PostgreSQL, domain services, server permissions, durable operations/outbox and replaceable adapters. Pin dependencies; record rationale/alternatives; avoid extra infrastructure.

MYOB Acumatica remains the intended ERP authority; SharePoint owns business documents; native CAD tools retain authoring/dependencies. Verify ownership and interfaces before live integration. Never invent ERP endpoints or CREMS formulas.

Use synthetic data/simulations; decide service-order/appointment/labour ownership. Retain CREMS/Pipedrive/Smartsheet until a tested, accepted transition. Assess build/configure/integrate/retain per capability.

## 5. Naming and information integrity

Follow PPO-STD-001/ADR-0005. Product: Powerplants One; code: PPO. Independent of STD-001/SOL008.

Masters use stable names and Git history; review stays separate. Reserve rNN for controlled issues; separate software/API/schema versions. Preserve issued bytes, 78 parent IDs and requirement/decision/interface/test/work-package traceability.

Separate UUID, reference, label, revision and state. Use SYN-PPO references; retain external/company/entity/provider keys. Use snake_case fields and PascalCase types/enums/events. Names are not keys. Filing assistance follows naming-sharepoint-handover and N0–N6.

## 6. Business workflow controls

Separate request/work order/appointment/pack/report/response/Finance handoff. Completion may need follow-up. Scheduling checks concurrency, crew availability, permissions, readiness, reasons and acknowledgement.

Distinguish captured/reviewed/billable/ERP-processed quantities and costs/commitments/invoices/revenue/payments/balances. Show source time, completeness, currency and units. Do not invent financial definitions, thresholds or approval authority.

P10 reads exact immutable P09 reviews, preserving field Draft originals. Incomplete declarations block Finance despite accepted attendance. Allocate billable and non-billable quantities. SyntheticVerified is not live verification. Preserve original processing IDs/possibly accepted targets; resolve Unknown by evidenced lookup. Current Finance scope governs reads/output/receipts.

Preserve issued revisions, hashes, scope and distribution evidence. Approval/issue/sent/delivered/acknowledged are distinct; content changes need a new revision and acknowledgement.

Prevent duplicate work/financial effects; reconcile unknown outcomes. Distinguish offline local-save/queued/synced/failed/conflict; retain context and unsent evidence.

## 7. User experience and quality

Use Australian English and ui-style-specification.md tokens, typography and intact logo. CRM: crm-desktop-mobile-refinements.md; shell/rails: department-navigation-icons.md. Show synthetic/environment context.

Define scope, permissions, validation, recovery and acceptance per product-quality-register.md and product-quality-plan.md.

HTML: html-module-conformance.md; retain scope ID, r20 page type, reused components, handovers and proposed departures before baseline adoption.

## 8. Execution and authority

Complete authorised work; ask only for consequential blockers.

Preserve unrelated work. Use branch/PR; merge needs authority and required checks/review. Respect permissions; update affected specs/registers.

Repo work grants no paid-service, deployment, access, live-transaction, migration or messaging authority. Keep secrets/operational data outside Git; use synthetic/approved-redacted fixtures.

## 9. Verification and communication

Run foundation/prototype/naming checks; test authority, conflicts, replay, integrity and reconciliation. Inspect screens; retain source/environment.

ES-01–10/Excel: estimating-native-programme.md; estimating-programme-handover.md. Preserve exact costs/bindings (estimating-cost-sources.md) and PJ-09 close/reopen. Boards: es02-design-board.md (P2–P9 proposed); es01-design-board.md (P1–P9 decided). ES-08: WP-G00 before D1–D15/DEC-R1/R2. ES-04: estimating-review.md. ES-05: quotation-release-native.md; synthetic; real terms/authority unavailable. CI: ci-retained-suite-isolation.md.

Mail: preserve private mailboxes and body separation (demo-email-crm-integration.md); CI is not Outlook acceptance. SH-01–06: docs/delivery/sh-platform-handover.md; teams/DK/delivery pending.

CS: follow ADR-0042 and cs-native-completion-handover.md. Preserve CS-05 identities, Grouping, service links and E2 snapshots. Readiness grants no work authority; survey handovers bind exact reviewed snapshots. Account plans create no bookings/forecasts. Reuse SH and Activity; Finance /account stays Finance.

Fertigation: follow `docs/delivery/priva-fertigation-native-handover.md`. Preserve exact scopes, neutral context and unverified supplier conclusions. Merge/deployment need separate authorisation.

Scheduling: scheduling-policy-publication.md. Bind exact policy/head, immutable proposals, complete reviews and distinct publication duties. Recover originals; use typed Activity links. Preserve pins/reservations. Holds govern readiness/Start, including offline Start. Resolution needs controlled change/cancellation/replacement and fresh evidence; acknowledgement/Activity completion cannot clear it. Rollback needs Step 4 enforcement/parsers. Step 6 records PT-28 synthetic pass and continuous PT-30; human acceptance remains open. Retain #330, installed SQL and reserved 0051/0052.

Sales CR-01–05: follow ADR-0046 and sales-native-completion-handover.md. Preserve frozen submissions, immutable Won due, source-scoped receipts and aftercare unknown policies. Receiving creates no downstream work.

Equipment: ADR-0045 / equipment-native-completion-handover.md. Reuse Assets, CS, Inspection and SH; scanning is read-only. Preserve originals and historic context. Recovery grants no controller-restore authority; support grants no replacement authority.

SC-01–10: BP-08 / ADR-0049. Separate stock observations, custody, consumption, transactions and restricted credits. Live ERP: Not configured. Retain SC-08 source/hash warnings; SC-10 evidence is not owner acceptance.
FI: field-quality-native-handover.md; field-closed-visit-guidance.md. Separate return attendance. FI-05: CS-06; induction needs Person.

FI-03/04: service-inspections.md; exact bindings, owned defects, fresh retests and independent release. FI-06: field-incidents.md; separate incidents, Activities, defects and holds. Closure clears only its blocker; reopen/source change preserves output. Both online-only; no operating policy.

FI-07: field-customer-response.md separates attendance acknowledgement, exact response and internal review; preserves P09 modes/offline originals; grants no work/technical/Finance authority.

PT sources, owner review and benefits: docs/testing/field-integrated-acceptance-ledger.md.
