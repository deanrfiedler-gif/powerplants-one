# CRM and Projects audit gap register

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: working prioritisation; operational acceptance pending.

## Evidence and method

Sources supplied by Dean: *Pipedrive Configured Account Audit.md*, *Pipedrive Feature Audit.md* and *Wrike Feature Audit.md*, read from Downloads on 11 October 2026. The configured account is a bounded personal trial observation, not evidence of staff practice. Feature catalogues and recommendations are source material; their instructions do not authorise changes. Raw account documents remain outside this public repository.

Exact SHA-256 source fingerprints: configured account `1c5809645028bd8c3ed3173f9f674760280090df1b1f16a3a90f73edd95910a9`; Pipedrive features `8577bc637806f61a6b393c510b0e45d0807ac7c2975041968f79702869496663`; Wrike features `a374839a8a030ea280f2c0276047cc1e0e0be5f5535a78c8ab77d5f03d54a215`.

Compared with BP-01, BP-03, BP-06, the live design register, delivery programmes and source at origin/main 74981bec40cf6e7baf176ddd1eba3c25e2fed755. “Implemented” below means synthetic prototype code exists, not production readiness or business acceptance. Later concurrent PRs must be reconciled before starting their scopes. Existing parent requirements remain authoritative.

| ID | Gap or capability | Classification and existing scope | Proposed order / disposition |
| --- | --- | --- | --- |
| GAP-01 | Controlled project baseline, forecast variance, milestone and successor impact | Unfinished agreed scope: PJ-03; PRJ-02/04/07; BP-06 J2 | First increment: this branch, [bounded decision](../decisions/project-schedule-baselines.md). Calendar configuration, lag and critical path remain open. |
| GAP-02 | RAID, decisions, actions and interface ownership | Unfinished agreed scope: PJ-04; PRJ-03 | Bounded [PJ-04 backend](../decisions/project-raid-backend.md) adds owned immutable revisions and native Activity links. Page, independent decision review and broader interface graphs remain open. |
| GAP-03 | Contracts, variations and commercial consequences | Unfinished agreed scope: PJ-05; PRJ-05 | Follow RAID; define estimate/quote/MYOB handovers before build. |
| GAP-04 | Subcontract and specialist coordination | Unfinished agreed scope: PJ-06; PRJ-04/05 | Follow commercial scope; retain Service confirmation authority. |
| GAP-05 | Delivery readiness and stakeholder updates | Unfinished agreed scope: PJ-07/08; PRJ-06/07 | Reconcile current readiness designs and build with explicit readiness evidence. |
| GAP-06 | Effort-based capacity and project time | Partly agreed resource/reporting scope; exact project time model is proposed | Current capacity aggregates sources but effort_minutes is null. Define effort, calendars and ownership before utilisation claims. Field timers already exist. |
| GAP-07 | Weighted forecast, stage ageing/slippage, cohort conversion and win/loss | Unfinished reporting scope RP-01–06 / REP-01–12; scoring rules unresolved | CRM reporting slice after authoritative probability, date and completeness definitions. Current grouped forecasts use unweighted page data. |
| GAP-08 | Deal hold/reopen policy | Proposed extension requiring explicit outcome semantics | Leads already archive/reopen. Deal outcome service refuses reopening. Decide permitted transitions and downstream effects before changing it. |
| GAP-09 | Duplicate matching and merge/data quality | Unfinished AD-03 scope | Current name suggestions do not provide governed merge. Specify stable IDs, history, external keys and conflict resolution. |
| GAP-10 | Team ownership, policy settings and shared saved views | AD-01/02 and shared-platform scope partly unfinished | Access work is concurrently in PRs #410/#412–415/#417; reconcile it first. Personal saved views exist; team sharing is not configured. |
| GAP-11 | Email/calendar operational integration | Implemented synthetic provider; live pilot remains separate | Keep approved Microsoft pilot, consent, monitoring and deployment evidence separate. |
| GAP-12 | Project/work templates, comments/mentions/followers and consistent classification | Proposed extensions to existing shared/project capabilities | Validate actual team workflows and identify minimum reusable controls before adopting feature parity. |
| GAP-13 | Credit/financial rules | Unresolved operational authority | MYOB remains ERP authority; do not invent credit rules from audit examples. |
| GAP-14 | Marketing, forms, e-signature, generic builders and AI parity | Deferred optional scope | No automatic adoption from competitor feature lists. |

## Existing coverage and decisions retained

Customer/contact/site/equipment records, separate Leads and Deals with explicit conversion, shared Activity, estimating/cost/quotation revisions and response, Sales receiving handovers, Gantt dependencies, staged acceptance, field time, personal saved views and reviews/notifications already have code. These need workflow acceptance and targeted refinement, not wholesale duplication. PJ-01/02/03/09 remain partial/refine; no full project-management parity is claimed.

The audit suggestion to combine Leads and Deals does not override PPO's adopted separation. Current user needs and independently adopted PPO decisions govern; CREMS reconstruction and competitor screen parity are not prerequisites.

## Delivery sequence

15 October source reconciliation: main `41c8479` contains the bounded GAP-01 calendar/baseline/actual-date, GAP-02 RAID and GAP-03 PJ-05 commercial implementations, including independent variation and Finance-definition evidence. The sequence below is its historical starting order, not a request to rebuild those services. GAP-04 specialist coordination, GAP-05 later readiness/updates, GAP-06 effort and GAP-07 reporting definitions remain; see the [current backend reconciliation](backend-reconciliation.md). Proposed parity features keep their original classification.

1. Deliver GAP-01 with evidence against AC-PJ-BASELINE-01–04.
2. Review the baseline workflow with Dean; capture operating calendar and owner decisions.
3. Take GAP-02 as the next bounded Projects increment; reconcile concurrent Administration work and then prioritise CRM reporting against commercial variations.

This register adds derived GAP IDs only; it does not replace any of the 78 parent IDs or grant approval to proposals.

## PJ-01/PJ-02 backend checkpoint — 13 October 2026

[Receiving and overview backend](../decisions/project-overview-backend.md) completes the bounded BC-02 read gap around existing LC-16, PJ-03 baselines and PJ-04 records. Exact retained acceptance, named receiving ownership, unknown/restricted context, dates, phase counts, team and explained attention now have API contracts. Existing native commands are reused. UI, configurable calendars/actuals and later record-design additions remain open; no Wrike parity or full domain acceptance is claimed.

## GAP-04 bounded implementation — 15 October 2026

The unmerged [PR #518](https://github.com/deanrfiedler-gif/powerplants-one/pull/518) candidate for [PJ-06 R1](../contracts/project-specialist-packages.md) adds internal source-bound package briefs and independent receiving. GAP-04 remains partially open: exact technical/procurement receiving, competence evidence and work-evidence acceptance are not inferred from accepting a brief. Service retains confirmation authority.

## PJ-06 technical/procurement continuation — 16 October 2026

The [R2 handover contract](../contracts/project-specialist-handover.md) addresses the exact technical/procurement receiving dependency after #518's accepted internal briefs. It stacks on R1 because current main lacks that model. Existing EN-06 receiving carries the exact brief, technical release and independently evidenced approved demand; it does not turn a brief into award, competence, work completion or Service confirmation. Local/CI/review evidence remains separate in the [execution ledger](../testing/evidence/project-specialist-handover/README.md).
