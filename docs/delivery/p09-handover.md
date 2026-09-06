# P09 — Service review, controlled reports and customer acknowledgement handover

**Updated:** 6 September 2026 · **State:** implementation and verification in progress; not published or merged. Synthetic only.

[Focused issue #36](https://github.com/deanrfiedler-gif/powerplants-one/issues/36) · [Draft PR #37](https://github.com/deanrfiedler-gif/powerplants-one/pull/37) · branch `feature/p09-service-review-reports`. Final publication identities and exact run/evidence links will be recorded externally on issue #36. This repository file is not a self-SHA or merged-main assertion.

## Delivered implementation and authority

[ADR-0014](../decisions/ADR-0014-p09-service-reports.md), [physical dictionary](../contracts/service-data-dictionary.md#p09-physical-implementation-amendment), [API amendment](../contracts/service-api.md#p09-physical-command-and-read-amendment) and [OUT-10 contract](../contracts/document-issue-distribution.md#p09-controlled-out-10-implementation) define the implemented records and commands. These supersede conceptual future-tense P09 descriptions without changing historical P07/P08 delivery evidence.

P09 implements SC-11, DAT-09, bounded OUT-10, API-C16–18 and TR-11–13. Completion drafts remain separate from immutable submissions. Every actual technician attendance has its own report and exact evidence/declarations; another person cannot submit on their behalf. The appointment moves InProgress → CompletedPendingReview on first submission and Completed only after all actual attendances are accepted. Return needs no new physical start. Accepted attendance remains immutable through report-only correction. New physical work requires existing P04/P05 return/new-visit authority. Work-order/ticket/Finance closure remains independent and unimplemented at this increment.

Service owner review decides every exact entry, retains internal reasons and returns corrections to the original technician. Approved quantities are the captured quantities of those exact versions; no financial treatment is inferred. Partial/UnableToProceed preserve tasks, uncertain asset identity, failed fixes, unresolved controls and owned follow-up. Scope/pack change requires explicit original-attendance-only disposition; it cannot waive mandatory controls or make incomplete work Complete.

Report HTML/PDF are rendered from the exact reviewed allowlisted customer projection, named permitted site contact and template. Private bytes are durably verified before final release. Original job recovery reconciles storage success/database failure; stale source/template/audience retains an owned attempt. Old outputs are never regenerated, overwritten or signed in place. HTML presentation hashes and separately retained PDF hashes remain explicit. Five response alternatives bind exact HTML presentation/revision/kind; optional synthetic PNG marks remain protected and cannot transfer to changed content. Customer response is not Finance approval, independent identity verification, whole-project acceptance or real delivery.

## Offline and physical compatibility

Migration 0009 is additive; migrations 0001–0008 and issued source snapshots stay byte-identical. P09 seed adds permission/template fixtures once and never fabricates reports/Finance records or revives revoked grants. Existing recovery grants retain their limited purpose.

IndexedDB version 2 / wire schema 1 remains compatible. Additive SubmitCompletion references the exact saved draft or original local draft dependency; CustomerResponse references already reviewed cached bytes. Old queued operations remain intact. Offline submission preparation requires a downloaded server-accepted attendance; provisional P08 starts and their captures must first synchronise, then refresh that exact attendance/version. A stale P09 original stays retained for inspection and exact retry; an online successor uses fresh explicit authority and never rewrites the queued payload. P09 originals are not offered the restricted P08 evidence-recovery action. HTML/PNG bytes and hashes are checked before transaction-complete save. Identity isolation, bounded two-job cache, 20-operation / 6 MB send batches, 30-second sender leases, explicit retries, original receipts and no background sender remain. Restricted recovery does not confer report/file access or normal P09 acceptance.

## Runtime and setup

Pinned Node 24.20.0, npm 11.19.0, PostgreSQL 16.15, Next.js 16.3.4, React 19.2.8, TypeScript 6.0.3 and Playwright 1.63.0 remain unchanged. The current scratch runtime has Node 24.19.0/npm 11.9.0 and no PostgreSQL/container engine; it is not used to bypass the exact engine requirements. Runtime proof uses the already-authorised disposable application workflow, separately from local Python documentation checks.

Use the existing [local setup](p08-handover.md#runtime-setup-and-recovery) and `.env.example`; preserve private environment values and byte directories. Apply `npm run db:migrate`, then `npm run db:seed` for the additive upgrade. `npm run dev` runs the private loopback application; `npm run documents:worker` performs bounded pack and report jobs. Report pages also expose explicit owned job recovery. `npm start` remains rejected. Reset is destructive only within the expressly guarded disposable synthetic test database; preserve normal local data and original byte directories.

Required checks remain:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
npm run check
npm run test:db
npm run test:http
npm run test:browser
```

`scripts/report-restart-proof.ts write|submit|respond|verify` executes four real application/browser phases with three PostgreSQL restarts in CI, preserving pending submission/response originals and exact accepted receipts/PNG bytes. P08's own restart and IndexedDB/service-worker/lease/schema/quota/attachment suite remains active.

## Verification and failed-run dispositions

Verification is still running. No new full PT/AT pass, independent review, owner acceptance, merged-main success or production readiness is claimed here. Preserve all 236 P01–P08 cases; the two historical P07 report-table-absence assertions are replaced with business-equivalent zero-report-record and no-Finance-table assertions. The obsolete field banner assertion now states only Finance remains incomplete. Existing PT-06 remains Passed.

| Application run | Disposition |
| --- | --- |
| [34012721210](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34012721210) | TypeScript rejected missing new appointment status union and nullable test end. Corrected types without changing guards or pins. |
| [34013654466](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34013654466) | Static/unit/build passed. Database exposed asset `description` mapping and two obsolete P07 report-table assertions. Corrected mapping and retained equivalent no-report/no-Finance effects proof. |
| [34014426568](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34014426568) | Static/unit/build and preserved baseline database cases passed; new report submissions correctly rolled back because P09 event names were missing from the strict outbox allowlist. Added those event names in migration 0009; full rerun required. |
| [34015101505](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34015101505) | Static/unit/build and exact-submission smoke passed. Strict review validation caught a fixture spreading private capture fields into the exact ID/version decision command. Corrected the fixture; strict production validation is retained. |
| [34014196121](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34014196121) | Lint rejected an unreassigned test variable. Corrected to const. Exact pinned Prettier produced review copies; these were adopted and the temporary copy step removed so generated source copies cannot enter runtime checks. |

PT-13 includes downstream handoff readiness, PT-18/23 span future Finance/selected outputs, and PT-24/28 include broader authority/policy/release conditions. Their P09 components do not manufacture full passes or P10/P11 records. PT-14's conceptual order InProgress is explicitly reconciled to the existing physical Authorised work-order model; broader whole-order/ticket closure remains outside P09. Full PT-15/PT-16 execution requires actual response/old-new-byte and page evidence, not just authored tests.

Original desktop/phone screenshots, PNG/HTML/PDF and proof records must retain scenario, viewport/page count, byte count, SHA-256, executed checkout/tree and workflow run/attempt. Final publication will link retained originals and describe every actual visual inspection and remaining limit. Private profiles, tokens and credentials are excluded from publication.

## Remaining operational dependencies and next boundary

D-024 branding/acknowledgement wording is not operationally accepted by synthetic rendering. Device security/retention, private adapter backup/restore ownership, independent review, owner acceptance and SharePoint/MYOB interfaces remain unverified. No hosting, production migration, live integrations, real customer communication or paid/access/rule changes are delivered.

The [P10 starter](p10-starter-prompt.md) is preparation only. It requires completed P09 external publication, live main/contracts/newer decisions and separate P10 authority. P09 creates no Finance handoff, allocation, billable treatment, account balance, stock transaction, invoice, payment, ERP reference or downstream fixture. Stop at P09 publication and P10 preparation.
