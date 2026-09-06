---
document_id: PPO-010-E1-START
revision: r01
date: 2026-09-06
owner: Dean Fiedler - private prototype
status: Prepared starter; requires a later explicit implementation instruction
---

# Starter — BP-04 E1 manual estimate and draft quotation

This is a prepared task statement. Discovery publication does not invoke it or advance Wave B. Dean should choose the E1 scope/sequencing and synthetic arithmetic convention before using the starter; do useful preparation if a remaining material choice blocks implementation.

---

Act as senior business analyst, product designer, solution architect, full-stack developer and quality engineer for Powerplants One, Dean Fiedler's private synthetic prototype.

Implement **only BP-04 E1 — Manual estimate and draft quotation**, after verifying the maintained readiness conditions. Repository: `https://github.com/deanrfiedler-gif/powerplants-one`. Discovery parent PPO-010 / issue #10; E1 is local to BP-04, not P13 or CRM I1.

## Objective and authority to establish in this invocation

Deliver an end-to-end synthetic journey: choose an existing permitted CRM opportunity → create one owned estimate with scope/exclusions/assumptions → enter manual product, labour and freight lines → save an exact version → create a reasoned successor → generate a customer-safe draft quotation from the exact saved version. Records/history must survive reload and distinct application/database restart.

When Dean explicitly invokes implementation, record that decision and whether the bounded synthetic E1 is brought forward from Wave B while preserving P01–P12 order. Do not infer permission for broader estimating, live pricing, formal issue, customer communication, ERP actions, access changes, paid services, hosting or migration. Use a focused implementation issue, dedicated branch, additive migration, meaningful checks and reviewable PR; merge only within the authority actually granted in the invocation and repository controls.

## Fresh baseline and mandatory reading

Verify accessible current main, exact commit, active PRs, publication records and relevant changes. The discovery inspected CRM I1 merge `c3ac9b2a`, but this is historical context, not a starting-head assumption. Verify actual merged-main/publication results before claiming the dependency accepted. Read:

- AGENTS.md, README.md, docs/STATUS.md and CONTRIBUTING.md.
- [BP-04](../blueprints/BP-04-estimating-quotation.md), [source evidence](../blueprints/estimating-evidence.md), [screen specification](../blueprints/estimating-screen-specification.md), [increment plan](estimating-implementation-plan.md) and [discovery handover](estimating-discovery-handover.md).
- [Acceptance](../testing/estimating-acceptance.md) and [synthetic arithmetic fixtures](../testing/estimating-calculation-fixtures.json). Confirm the demonstration policy is explicitly adopted for this slice; it is not CREMS/company policy.
- PPO-STD-001, shared UI specification, BP-02/03, current ADR-0003/0014/0015 and any newer relevant ADRs.
- Actual Opportunity/Activity, permissions/identity, business identity/reference, receipt/outbox, document render/issue and migration contracts. Preserve P09 and CRM behaviours.

## Required implementation behaviour

1. Reuse existing Organisation/Opportunity/company/site/person IDs and permissions. Do not create a competing CRM/customer/product master. Assign one eligible estimator; ownership does not grant access. Do not move CRM stages, add CRM money fields or replace its next action silently.
2. Separate option, estimation revision, Estimate identity/version and Quote identity/revision. First slice permits one defined-supply option, explicit manual scope and draft successors. Preserve exact predecessors and change reasons. No general route engine or multi-option lock policy.
3. Add only necessary scoped Estimating capabilities and typed records/links. Enforce current authority on reads, commands, aggregates, files, related Activities and original receipt replay. Customer-safe projections cannot include internal cost/margin fields.
4. Implement authoritative decimal arithmetic with declared supported ranges, units, currency, precision/rounding and explicit unknown handling. Begin manual AUD excluding tax with no tax calculation. Source/date and quantity basis are required for complete amounts. No operational rate, threshold or tax treatment is invented.
5. Stage changes with clear proposal versus saved totals. Use atomic expected-version batch commands with operation receipt/audit/outbox. Preserve accepted originals on retry; reject changed payload under the same operation ID. Unknown response must reconcile before a new intent. Stale totals cannot support final output claims.
6. Generate draft HTML/PDF from the exact saved version using existing durable rendering/storage principles. Prominently label Draft — not issued. Store exact source/template/output provenance and recover failed rendering. Do not create an Issued/Sent/Accepted state or signature. Include/print choices, if in the adopted E1 scope, must reconcile hidden grouped amounts and keep costs out of the safe output.
7. Use the supplied logo/brand and practical desktop/phone layouts. Implement loading, empty, validation, dirty/saving/saved, changed-version, outcome-unknown and access-loss recovery. Clear sensitive content on identity/scope changes. No offline saved claim for browser memory.

## Verification

Run the maintained foundation, prototype and naming scripts. Execute current required application checks under pinned versions. Add meaningful PostgreSQL, direct HTTP and browser tests for real permission failures, cross-company/related-record leakage, concurrency/version locks, original operation replay, exact rounding and output integrity. Prove one saved journey across separate application and database restarts; inspect desktop/390px/320px and long-content draft output.

Exercise the relevant E1 subset of EA-01/03/05/06/09/10/15/18 without marking broader cases complete. Preserve existing P09/CRM regression gates and original bytes. Do not claim owner acceptance, independent review, operational parity or production readiness from automated checks.

## Delivery and stop

Update affected design/contracts/status and record actual source/checkout/tree/runtime/test evidence, failed attempts and recovery. Publish a reviewable PR and durable handover. If normal merge is authorised, use expected-head merge after actual checks/review and verify the actual merged main; otherwise leave the reviewed PR ready. Prepare E2's maintained starter, identify remaining source/policy questions, then stop. Do not start E2 or any live integration.
