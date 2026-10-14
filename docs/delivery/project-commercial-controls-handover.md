# Project commercial controls implementation and verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared and implemented: 14 October 2026. Status: bounded synthetic backend implemented and locally verified for PR review. Independent review, operational policy and owner acceptance remain separate.

## User instruction and writer handover

Dean authorised PJ-05 preparation followed by implementation through a tested PR after CPQ handed over. The CPQ chat **Add governed Product mapping to CPQ** completed its current turn with a concrete PR #492 handover. Its latest completed turn was checked again before publication. Main is `886c9c482c15277b7ab5f997b9567bf272b63070`, including merged #490; open #491 and its stacked #492 add no schema dependency and remain separate. No merge of those contributions is required by PJ-05.

Implementation uses managed isolated branch `codex/pj05-commercial-controls`. The primary checkout and CPQ worktrees remain unchanged. A task-owned loopback PostgreSQL instance on port 55447 and compiled application on 3165 supply the synthetic verification; no shared database/application service was reset or restarted. Live amended schema through 0100 was inspected before adding 0101.

## Delivered contract

The [commercial contract](../contracts/project-commercial-controls.md), [Finance definitions](../contracts/project-commercial-finance-definitions.md) and [decision](../decisions/project-commercial-controls.md) define this delivery. It retains the existing parent requirement and acceptance IDs.

- Exact native reported-accepted quotation, accepted Won Sales receiving and independently reviewed LibraryDocument revision supply one independently approved original basis per Project.
- Owned obligations retain explicit dates and Activity links; satisfaction and independent waiver are separate events. Notices are immutable reported occurrence evidence with correction chains.
- Exact requested and priced variations require a separate independent decision. Approved signed adjustments retain their original approved predecessor. No decision edits a Project schedule, inventory or accounting record.
- The synthetic Finance projection reconciles the whole variation register using integer cents, distinguishes unknown from zero and holds current totals when source evidence changes or becomes unavailable.
- Native scoped permissions, source authority, immutable audit/receipt/outbox evidence and actor-private operation recovery apply throughout. No default capability grants or seed are added.

Migration 0101 is additive. It flushes deferred identity events before altering identity constraints, then restores deferral. Historical upgrade assertions retain every earlier ledger entry and add only 0101; the reserved Products migration and hosted-demo privilege upgrade are separately exercised. The AD-01 catalogue contains all 153 capabilities and uses regenerated LF source hashes. No new dependency, runtime service or native commercial page is introduced.

## Verification and review

[Execution evidence](../testing/evidence/project-commercial/README.md) records the actual checks and limits. The Projects assurance workflow runs the new database/upgrade and compiled API cases and performs the repeatable application/PostgreSQL restart proof. Local checks, pull-request CI, independent review, business acceptance and deployment are separate outcomes.

The working design register and guides retain planned-page status and their existing missing visual-reference/review gaps. Backend verification does not accept an unbuilt commercial or Finance configuration page.

## Open operational decisions and next slice

- Named operational approvers and delegation thresholds; synthetic duties do not appoint employees.
- Contract interpretation, notice timing/service and evidential requirements; no inferred legal deadline or entitlement.
- Authoritative Finance sources, tax/currency/sign and accounting treatment under D-017.
- Independent-order and multi-contract bases, owner transfer and controlled original-basis reconciliation after source drift.
- Native commercial page controls, separate attachments/notice links, operational integration and owner acceptance.

The next implementation slice can expose the tested backend through native PJ-05 controls once this PR is reviewed. Merge, deployment, external transactions and customer communications are outside this instruction.

## Independent review follow-up — 15 October 2026

Dean authorised independent review and correction of PR #493. A fresh automated reviewer found two P2 defects in original head `b3de155`: reuse of a Library review after a later finding was closed, and creation authority derived from a proposed owner. Both were reproduced against the original implementation. The correction checks all findings against the retained review snapshot and authorises creation from the coordinator or existing basis ownership. Service and SQL guards agree; historical source evidence and recorded owners remain unchanged. Main `cfd465f`, including merged CPQ #491, is integrated while retaining both modules' exclusive HTTP groups and documentation. Follow-up validation and review results are recorded in the execution evidence. No merge or deployment is authorised.
