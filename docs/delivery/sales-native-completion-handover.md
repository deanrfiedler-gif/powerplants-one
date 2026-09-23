# Sales native completion — implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation in progress; owner acceptance and deployment pending.

Starting main: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` (origin fetched 24 September 2026).
Branch: `feature/sales-cr01-cr05-completion`. Isolated worktree: `tmp/sales-cr01-cr05-completion`.
GitHub authentication verified; no open PRs at the starting audit. Existing equipment completion worktree is a potential shared-source overlap; it is not modified here. Migrations 0001–0044 exist with 0016 reserved.

## Reconciliation

CR-01 has native information/scope/stage/owner/outcome/Activity/commercial/document/history controls. CR-04 has Board/List/Forecast/Archive and retained URL state. CR-02, CR-03 and CR-05 have no native routes or services. Won handover-due is immutable and remains unchanged. ES-05/06/07 and Service Agreements are design-only on this main, so their source outcomes cannot be presented as native verified records.

Implementation order: CR-01/04; CR-02; CR-03; CR-05; integrated assurance. Existing source services, shared Activities, PostgreSQL transactions, server permissions, receipts and outbox remain authoritative. No dependencies or live adapters are introduced.

## Status and evidence

The native code and full guides are present; final HTTP/browser and CI assurance is in progress. Owner acceptance, merge and deployment are pending.

| Scope | Native result | Persistence and controls |
|---|---|---|
| CR-01 | `/sales/opportunities/[id]`: eight logical views; source correspondence; linked handovers/aftercare; filtered return context | Reuses CRM, Activity, Email, Estimating and document services; current visibility retained |
| CR-04 | `/sales/opportunities`: disclosure above retained Board/List/Forecast/Archive | Same permitted result page; recorded stage/date facts; denominator, as-at, partial/complete, unknown/unweighted values |
| CR-02 | `/sales/handoffs/estimating`, detail, `/estimating/intake` | Draft/Submit/Clarify/Answer/Resolve/Return/Accept/Successor; frozen content, original receipts, audit/outbox, source fingerprint |
| CR-03 | `/sales/handoffs/won` and detail | Additive aggregate references unchanged Won Due obligation; exact destination/source review; independently selected owned return follow-up; no downstream creation |
| CR-05 | `/sales/aftercare` and detail | Issued Service report source; explicit date basis, attributed feedback, commitments, shared work, Service/CRM receiving, separate training steps, guarded close/correction |

Migration 0046 adds `sales_handovers`, `sales_aftercare` and append-only `sales_workflow_events`, and extends existing identity/audit dispatch after flushing deferred identity constraints. No capability, seed, grant or package change. Source, history, list, options and receipt reads recheck related-record authority. Versioned commands use the shared original-operation journal and transactional outbox.

Current-main reconciliation: main advanced to `6c5e7c4` during validation. PR #301 adds `/estimating` workload without a frozen Sales intake aggregate. PR #302 owns migration 0045 and ADR-0045. Sales therefore uses migration 0046 and ADR-0046; no files in either other worktree are modified. Shared register, guide, receipt and migration assertions need normal merge reconciliation.

Executed local evidence so far:

- `python -X utf8 scripts/check_foundation.py`: passed (78 parent IDs; issued sources unchanged).
- `python -X utf8 scripts/check_prototype.py`: passed.
- `python -X utf8 scripts/check_naming.py`: passed after retaining the project-instruction limit.
- `node --import tsx scripts/check-development-register.ts`: passed; 280 entries, 126 routes, no integrity errors. Reviews remain pending.
- `node node_modules/eslint/bin/eslint.js .`: passed.
- `node node_modules/next/dist/bin/next build`: standard Turbopack production build passed, including TypeScript. An earlier webpack build also passed while resolving isolated dependencies. No dependency versions changed.
- Focused analytics/navigation units: 7/7 passed. Broad units: 381/386 before the expected navigation assertion update. Four document-store/recovery/Windows-path failures reproduce against unchanged main runtime/tests: 3/7 selected baseline cases passed, 4 failed. The full suite will be rerun/checked by CI.
- Sales database journeys initially reached 5/7 passing (CR-02, CR-03, source drift, scope/revocation and CR-05 review/close/correction); the two failures were seed statement timeouts. A focused rerun passed the migration upgrade case; CR-04 reset again timed out. Later full reruns hit reset/seed timeouts before workflow execution. The same failure reproduced in unchanged-main E1-DB01 setup. Tests/timeouts were not weakened. Further return/referral enhancements need final run evidence.

The isolated PostgreSQL 16 server uses loopback port 5546 and disposable `ppo_synthetic_test`; all credentials/document bytes are outside Git. Main's normal local database is untouched. The disposable database was recreated and its server JIT disabled to investigate setup latency; SQL transaction, permission and application timeout guards were retained. This is local environment evidence, not production qualification.

New HTTP and browser journeys are included. The CRM CI job retains its existing suites and adds the new Sales database/browser cases; the application HTTP wildcard includes Sales. Browser selectors now name the eight native tabs explicitly, retaining the existing behavioural assertions.

Visual capture review, exact final code commit, PR/CI state and final executed counts will be recorded before final delivery. No capture or device acceptance is claimed yet.

## Reference mapping

- CR-01: [Deal Workspace r01](../reference/ui/crm/PPO-Deal-Workspace-r01.html); eight native logical views, no embedded shell.
- CR-04: [pipeline r38](../reference/ui/crm/ppo-deal-pipeline_r38.html); analytical disclosure supplements the existing worklist.
- CR-02: [intake r02](../reference/ui/estimating/sales-estimating-intake-preview-r02.html); frozen submissions and separate receiving decisions.
- CR-03: [delivery handover r01](../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html); additive receiving evidence.
- CR-05: [aftercare r01](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html) and [receiving contract](../contracts/sales-aftercare-receiving.md).
