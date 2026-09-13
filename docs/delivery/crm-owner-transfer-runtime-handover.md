---
document_id: PPO-009-TRANSFER-HO
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implemented on a branch; HV execution and exact-source review pending
source_commit: 642e283998f6e286f986d0cda53469780ed1dfbb
---

# CRM controlled owner transfer — increment C

[Issue #145](https://github.com/deanrfiedler-gif/powerplants-one/issues/145) implements the [adopted H-01–H-03 package](../decisions/audit-follow-through-policy-package.md) and reconciled [contract](../contracts/crm-opportunity-handover.md), following Won/Lost in #158. The complete #55 design publication was reread before implementation. This is one synthetic command; full AT-25, independent review and operational acceptance remain separate.

## Changed behaviour

The current opportunity owner needs explicit scoped `crm.opportunity.transfer.own` and the existing CRM/shared/Internal/Activity authority. A comparison read returns only eligible receiving owners and visible next/identification Activities with their exact versions. The reasoned POST commits one immediate owner change and one version. It rechecks the original opportunity and Activity comparisons, recipient eligibility and permissions. Activities retain their owners and outcomes; estimates, draft files and Won handover-due accountability remain independent.

The detail screen distinguishes original and current opportunity owners. The confirmation dialog retains the proposed owner/reason on a version or Activity conflict, loads the current comparison for deliberate review, and freezes the original command after a lost response. It uses existing shared dialog, permission, keyboard and recovery controls. Board/List refresh the same permitted projection. No bulk, drag, pending offer, manager override, notification or external effect is introduced.

## Integrity and permission boundary

Forward migration 0024 adds immutable `opportunity_origins` and `opportunity_owner_transfers`. Upgrade provenance captures the then-immutable owner and version at migration time. New-create provenance captures the selected owner, independently of the author. Transfer companions bind the existing event, owner chain and exact reviewed Activity versions without altering original event rows or payload hashes.

Only owner/version/update actor/time may change. Deferred checks require the exact intermediate owner chain, from/to owner, original actor, event, snapshot, accepted audit, receipt and minimal outbox. Existing context, stage, qualification, closed-outcome and immutable-history protections remain. The five-stage historical identification check uses the original qualifying owner when no contact edit is requested.

The workspace lock serialises business commands. User/grant/relationship administration does not universally share that lock, so a fixed `SECURITY DEFINER` function takes SHARE locks on the workspace's authority rows. Its search path is fixed, all tables are qualified, it returns no row content and accepts no SQL. The hosted runtime role can acquire these locks without receiving UPDATE privileges on users or grants; it cannot use the function to modify them. A restricted-role DB case explicitly checks this privilege boundary. Final permission checks also evaluate clock expiry. This prototype uses workspace-wide authority locks; larger-scale contention optimisation is not claimed.

H-03 recovery is CRM-only. The original actor/operation/record/command-specific event and accepted audit must match before today's owner equality can be waived. Current record, relationship, matching capability and original all-target Activity checks still precede receipt disclosure or payload conflict. Recovery checks the original actor, not a later recipient who may now be inactive. All non-CRM dispatch and canonical hashes are unchanged.

Seed 24 adds one synthetic receiving user with the six copied, currently effective Company A CRM/shared/Activity grants and one explicit current-owner transfer grant. The recipient gains no onward-transfer or estimating/Finance/Service permissions. A once-only receipt prevents reseeding from restoring revoked grants. Old migration and seed files are unchanged; migration registries, cross-domain upgrade assertions and reviewed hosted migration count now include 0024. No hosted upgrade is performed.

## Prepared evidence and remaining gates

Local lint, types, existing 85 unit cases and build passed before publication preparation; final checks are recorded on the PR. Local PostgreSQL and pinned Chromium execution are unavailable, so no local DB/browser pass is claimed.

| Coverage | Concrete prepared proof | Execution state |
|---|---|---|
| HV-01–04, 09, 14 | Immediate transfer, required capabilities, excluded candidates, mixed hidden Activity target, actual two-candidate signed cursor and real HTTP routes | CI pending |
| HV-05–08, 13 | Independent backends with observed workspace/authority row blocking; both queued save orders; same-key race; stale Activity completion; committed revocation before transfer; later completion/revocation after acceptance | CI pending |
| HV-10–12, 22 | Historical unknown-contact qualification; original owner distinct from author; multiple handovers; original receipt recovery; each required actor permission revoked independently; recipient revocation; changed same-key payload | CI pending |
| HV-15–16 | Desktop/390/320 keyboard comparison, 1,000-character reason and long unbroken Activity; conflict and frozen lost-response screenshots | CI and original visual review pending; complete denied/late-response matrix still requires review |
| HV-17 | Existing CRM write/verify script now preserves transfer input, origin/chain, original create/transfer receipts and payload hashes across distinct application/browser/PostgreSQL processes; I1/I2/Won/Lost proofs retained | CI pending |
| HV-18 | Injected failures at event/companion/audit/receipt/outbox; exact full-state rollback; arbitrary owner SQL and immutable history deletion refused | CI pending; expanded adversarial intermediate-chain review remains |
| HV-19–20 | Current demo upgrade full old-row comparisons, explicit new-user/grant/provenance allowlists, original migration checksums, repeated seed/migration and revoked-grant preservation | CI pending |
| HV-21 | E1 owner/saved version/quote/source/output preserved across transfer; exact stored HTML/PDF bytes; old estimator continues, recipient denied; service-report and Finance table snapshots unchanged | CI pending; full linked HTTP/browser regressions retained |

The helper is registered once inside the existing focused CRM DB file so both focused and Full Application run it. Two transfer browser cases and one HTTP case extend existing suites without replacing prior assertions. The required [HV matrix](../testing/crm-handover-verification.md) remains authoritative: prepared coverage is not equivalent to all HV obligations passed. Record exact source/checkout/tree, runtime, counts, original artifacts/hashes, failures and skips on the PR. Merge only after resolving applicable failures and outstanding proof obligations, then verify actual main and publish the bounded result. Do not close #9 or claim a production release.
