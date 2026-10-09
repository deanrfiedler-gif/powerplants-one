# Powerplants One — Design & Development

## 1. Role and purpose

Public repo, private demo; PPO is independent.

## 2. Delivery

Preserve BP-01 domains and shared records.

Test joined journeys; distinguish runtime proof from owner acceptance.

PP-01: customer/site/equipment, intake, authorised work, issued packs, scheduling, field evidence, acknowledgement, reviewed reports and controlled Finance reconciliation.

Follow P01–P12, STATUS, BP-03 section 0 and BP-04. PPO-009 CRM differs from P09.

## 3. Sources and continuity

Read AGENTS.md, README, docs/STATUS.md and relevant ADRs/specs; verify Git.

User decisions govern. [CREMS is historical](../decisions/product-direction-quality.md); define and test PPO rules independently.

## 4. Architecture

BP-02/ADR-0003: TypeScript/Next.js, PostgreSQL, domain services, server permissions, durable operations/outbox and adapters. Pin dependencies; record rationale/alternatives.

MYOB Acumatica: intended ERP authority; SharePoint: business documents; native CAD: authoring/dependencies. Verify interfaces, ownership and operating rules before integration.

Use synthetic fixtures; decide service-order/appointment/labour ownership. Operational cutover needs tested acceptance. Assess build/configure/integrate/retain per capability.

## 5. Naming

Follow PPO-STD-001/ADR-0005. Product: Powerplants One; code: PPO. Independent of STD-001/SOL008.

Masters use stable names/Git history; review stays separate. Reserve rNN for controlled issues; separate software/API/schema versions. Preserve issued bytes, 78 parent IDs and requirement/decision/interface/test/work-package traceability.

Separate UUID, reference, label, revision and state. Use SYN-PPO references; retain external/company/entity/provider keys. Use snake_case fields and PascalCase types/enums/events. Names are not keys. Filing assistance follows naming-sharepoint-handover and N0–N6.

## 6. Business workflow controls

Separate request/work order/appointment/pack/report/response/Finance handoff. Completion may need follow-up. Scheduling checks concurrency, crew availability, permissions, readiness, reasons and acknowledgement.

Distinguish captured/reviewed/billable/ERP-processed quantities and costs/commitments/invoices/revenue/payments/balances. Show source time, completeness, currency and units. Do not invent financial definitions, thresholds or approval authority.

P10 reads immutable P09 reviews and preserves field Drafts. Incomplete declarations block Finance despite accepted attendance. Allocate billable/non-billable quantities. SyntheticVerified is not live verification. Preserve processing IDs/possibly accepted targets; resolve Unknown by evidenced lookup. Finance scope governs reads/output/receipts.

Preserve issued revisions, hashes, scope and distribution evidence. Approval/issue/sent/delivered/acknowledged are distinct; content changes need a new revision and acknowledgement.

Prevent duplicate work/financial effects; reconcile unknown outcomes. Distinguish offline local-save/queued/synced/failed/conflict; retain context and unsent evidence.

## 7. User experience and quality

Use Australian English, ui-style-specification.md tokens/type and intact logo. CRM: crm-desktop-mobile-refinements.md; shell/rails: department-navigation-icons.md. Show synthetic/environment context.

Scope, permissions, validation/recovery and acceptance: product-quality-{register,plan}.md.

HTML: follow html-module-conformance.md.

## 8. Execution and authority

Complete authorised work; ask only for consequential blockers.

Preserve unrelated work. Use branch/PR; merge needs authority and checks/review. Respect permissions; update specs/registers.

Repo work grants no paid service, deployment, access, transactions, migration or messaging. Keep secrets/operational data outside Git; use synthetic/redacted fixtures.

## 9. Verification

Run foundation/prototype/naming; test authority, conflicts/replay, integrity/reconciliation. Inspect screens; record environment.

ES-01–10/Excel: estimating-native-programme.md / estimating-programme-handover.md; retain estimating-cost-sources.md, PJ-09 close/reopen and es0{1,2}-design-board.md. ES-08: WP-G00 before D1–D15/DEC-R1/R2. ES-04: estimating-review.md. ES-05–07: quotation-{release,response,conversion,disposition,supply-followup}-native.md. ES-07: quotation-{reservation-reconciliation,receipt-correction,allocation-shortfall,material-resolution,task-dependency}.md. Separate each affected owner’s consent; preserve receipts, unmet Demand, holds and fresh disposition.

Mail: preserve private mailboxes and body separation (demo-email-crm-integration.md); CI is not Outlook acceptance. SH-01–06: docs/delivery/sh-platform-handover.md; teams/DK/delivery pending.

CS: follow ADR-0042 and cs-native-completion-handover.md. Preserve CS-05 identities, Grouping, service links and E2 snapshots. Readiness grants no work authority; survey handovers bind exact reviewed snapshots. Account plans create no bookings/forecasts. Reuse SH and Activity; Finance /account stays Finance.

Fertigation: priva-fertigation-native-handover.md. Retain exact scopes, neutral context and unverified supplier conclusions.

Scheduling: scheduling-policy-publication.md. Bind exact policy/head, immutable proposals, complete reviews and distinct publication duties. Recover originals; use typed Activity links. Preserve pins/reservations. Holds govern readiness/Start, including offline Start. Resolution needs controlled change/cancellation/replacement and fresh evidence; acknowledgement/Activity completion cannot clear it. Rollback needs Step 4 enforcement/parsers. Step 6 records PT-28 synthetic pass and continuous PT-30; human acceptance remains open. Retain #330, installed SQL.

Sales: lead-to-delivery-continuity.md and sales-followup-continuity.md; outcome, Won and Lead-context decisions apply. Preserve native facts, source access and Activity owners; accept, create, link and plan separately.

Equipment: ADR-0045 / equipment-native-completion-handover.md. Reuse Assets, CS, Inspection and SH; scanning is read-only. Preserve originals and historic context. Recovery grants no controller-restore authority; support grants no replacement authority.

SC-01–10: BP-08 / ADR-0049. Separate stock observations, custody, consumption, transactions and restricted credits. Live ERP: Not configured. Retain SC-08 source/hash warnings; SC-10 evidence is not owner acceptance.
FI: field-quality-native-handover.md; field-closed-visit-guidance.md. Separate return attendance. FI-05: CS-06; induction needs Person.

FI-03/04: service-inspections.md; exact bindings, owned defects, fresh retests and independent release. FI-06: field-incidents.md; separate incidents, Activities, defects and holds. Closure clears only its blocker; reopen/source change preserves output. Both online-only; no operating policy.

FI-07: field-customer-response.md separates attendance acknowledgement, exact response and internal review; preserves P09 modes/offline originals; grants no work/technical/Finance authority.

MA-01–07: maintenance-warranty-{native,handover}.md; migration 0051. Preserve due dates, entitlement and reviewed Service outcomes. Separate customer resolution/recovery/Finance; Supply bridge pending.

PT sources, owner review and benefits: field-integrated-acceptance-ledger.md.

ES-07: quotation-task-diamond.md; seven decisions; save A/B/C/D once. Retain edges, unmet Demand, fresh disposition and prior originals, merge B retained.

PD-01–05: ADR-0048; migration 0052, exact pricing revisions, four local duties. Preserve originals. No hosted grants; owner acceptance/deployment separate.

NAV: navigation-consolidation.md; retain scope/recovery. Board: navigation-architecture-board.md; NAD-08 Reports workspace is design only.
UI sequence: ui-build-sequence.md; SD-01–05 adopted; review at phase 00; regenerate with scripts/build-ui-sequence.py.
