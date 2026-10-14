# PJ-05 exact Project commercial controls

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 14 October 2026. Status: authorised implementation decision for the bounded synthetic increment. Independent automated review is recorded in the execution evidence; operational policy and owner acceptance remain open.

Dean requested PJ-05 preparation now and a tested implementation PR after the active CPQ writer hands over. This decision retains the existing parent scope and [commercial contract](../contracts/project-commercial-controls.md), with [supporting Finance definitions](../contracts/project-commercial-finance-definitions.md).

## Context and constraints

Projects already have native receiving attribution, overview, calendars/actuals, RAID, Activities and staged closeout. Native quotation issue/response, Sales outcome evidence and exact document revisions exist. PJ-05 still lacks owned obligations, notice evidence and controlled variation decisions. Finance requires commercial states to remain separate before calculating performance, claims or cash.

A Won Sales handover may use independent narrative evidence. Therefore handover acceptance alone cannot establish quotation acceptance or an original value. The selected quotation issue/response and reviewed contract document must be bound explicitly. No production contract interpretation, MYOB endpoint, deadline or accounting treatment is invented.

Repository writing is serial. CPQ completed its #492 handover; this implementation starts from main 886c9c4 in the managed codex/pj05-commercial-controls worktree. CPQ #491/#492 add no migration and remain separate open contributions. Current main migrations through 0100 and the live amended identity, receiving and quotation-response guards were inspected before adding 0101. A reviewable PR is authorised; no merge or deployment instruction is supplied by this task.

## Decision

Extend the existing modular monolith and PostgreSQL with narrowly scoped commercial records, immutable revisions/decisions, current authority checks and native operation recovery. Keep one exact approved original basis per Project in the first increment. Treat each subsequent approved variation as its own signed delta. Retain obligation, notice, variation and accounting semantics separately.

Use default-denied commercial read/prepare/review duties with independent decisions. No seed grants them automatically. Reuse source-owning services for quotations, Sales, documents and Projects; shared Activities remain separately owned. A source-changing event holds new dependent decisions rather than recalculating a previously approved commercial basis.

Publish a scoped backend and synthetic Finance reconciliation projection before adding native page controls. Use exact decimal/minor-unit calculations, explicit unknown/changed states and no implied ERP result. Record concrete API and measured bounds in the implemented contract.

## Alternatives considered

| Alternative | Benefit | Reason not selected |
|---|---|---|
| Extend RAID free-text records with monetary fields | Small initial code change | Conflates decision, obligation, variation and financial authority; lacks exact submitted/approved pricing and source provenance |
| Treat quote/Deal value as a mutable Project contract total | Simple dashboard | Loses the issued scope, original value and requested/priced/approved distinctions; later quote changes would rewrite apparent history |
| Implement an accounting/contract management platform or add a service | Broad capabilities | Introduces dependencies, new technology and policy beyond the authorised bounded need; MYOB remains ERP authority |
| Native exact commercial records using existing infrastructure | Preserves bounded authority and connected recovery, enables later Finance/updates | Selected; requires explicit new schema, permissions and historical-upgrade proof |

## Consequences and follow-on boundaries

The first build can prove a synthetic accepted-quote-to-Project-to-variation journey and its Finance breakdown. Independent-order bases, multi-contract Projects, original-basis replacement/revalidation, operational approval policy, claims/invoices/receipts, automatic scheduling and real notice distribution remain explicit subsequent contracts. Source-loss recovery and current-authority privacy need tests as rigorous as initial approval. Existing output bytes and parent IDs remain unchanged.

No new dependency or runtime service is selected. The implementation must use a new additive migration only after handover, flush deferred identity events before any identity-table ALTER as required by AGENTS.md, and preserve historical migration/grant ledgers and hosted-upgrade review gates. New capabilities require regenerated AD-01 catalogue and matching labels/counts from LF source bytes.

## Independent review follow-up — 15 October 2026

Dean authorised independent review and correction of PR #493. A fresh automated reviewer found two P2 defects in original head `b3de155`: reuse of a Library review after a later finding was closed, and creation authority derived from a proposed owner. Both were reproduced against the original implementation. The correction checks all findings against the retained review snapshot and authorises creation from the coordinator or existing basis ownership. Service and SQL guards agree; historical source evidence and recorded owners remain unchanged. Main `cfd465f`, including merged CPQ #491, is integrated while retaining both modules' exclusive HTTP groups and documentation. Follow-up validation and review results are recorded in the execution evidence. No merge or deployment is authorised.
