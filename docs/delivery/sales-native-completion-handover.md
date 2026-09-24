# Sales native completion — implementation handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Native implementation delivered for review; owner acceptance, merge and deployment are separate and pending.

Starting main: `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc` (origin fetched 24 September 2026).
Branch: `feature/sales-cr01-cr05-completion`. Isolated worktree: `tmp/sales-cr01-cr05-completion`.
GitHub authentication verified; no open PRs at the starting audit. Existing equipment completion worktree is a potential shared-source overlap; it is not modified here. Migrations 0001–0044 exist with 0016 reserved.

## Starting reconciliation

CR-01 has native information/scope/stage/owner/outcome/Activity/commercial/document/history controls. CR-04 has Board/List/Forecast/Archive and retained URL state. CR-02, CR-03 and CR-05 have no native routes or services. Won handover-due is immutable and remains unchanged. ES-05/06/07 and Service Agreements are design-only on this main, so their source outcomes cannot be presented as native verified records.

Implementation order: CR-01/04; CR-02; CR-03; CR-05; integrated assurance. Existing source services, shared Activities, PostgreSQL transactions, server permissions, receipts and outbox remain authoritative. No dependencies or live adapters are introduced.

## Status and evidence

The native code, full page guides, component bindings and inspected visual evidence are delivered in [PR #303](https://github.com/deanrfiedler-gif/powerplants-one/pull/303). Final application code is `23fcb3a4e4fd8b177e03a05702800731f7b28e5a`; assurance correction `69c7427878d0373b6aab50659d61ce886907c575` isolates concurrent HTTP fixtures and waits for the actual worklist response before rendering assertions. The [evidence record](../testing/evidence/sales-native-completion/README.md) distinguishes local results, earlier CI and live exact-head checks. The PR remains the source for its current check and review status; this document does not grant merge, visual acceptance or deployment.

| Scope | Native result | Persistence and controls |
|---|---|---|
| CR-01 | `/sales/opportunities/[id]`: eight logical views; source correspondence; linked handovers/aftercare; filtered return context | Reuses CRM, Activity, Email, Estimating and document services; current visibility retained |
| CR-04 | `/sales/opportunities`: disclosure above retained Board/List/Forecast/Archive | Same permitted result page; recorded stage/date facts; denominator, as-at, partial/complete, unknown/unweighted values |
| CR-02 | `/sales/handoffs/estimating`, detail, `/estimating/intake` | Draft/Submit/Clarify/Answer/Resolve/Return/Accept/Successor; frozen content, original receipts, audit/outbox, source fingerprint |
| CR-03 | `/sales/handoffs/won` and detail | Additive aggregate references unchanged Won Due obligation; exact destination/source review; independently selected owned return follow-up; no downstream creation |
| CR-05 | `/sales/aftercare` and detail | Issued Service report source; explicit date basis, attributed feedback, commitments, shared work, Service/CRM receiving, separate training steps, guarded close/correction |

Migration 0046 adds `sales_handovers`, `sales_aftercare` and append-only `sales_workflow_events`, and extends existing identity/audit dispatch after flushing deferred identity constraints. No capability, seed, grant or package change. Source, history, list, options and receipt reads recheck related-record authority. Versioned commands use the shared original-operation journal and transactional outbox.

Current-main reconciliation: main advanced to `6c5e7c4` during validation. PR #301 adds `/estimating` workload without a frozen Sales intake aggregate. PR #302 owns migration 0045 and ADR-0045. Sales therefore uses migration 0046 and ADR-0046; no files in either other worktree are modified. Shared register, guide, receipt and migration assertions need normal merge reconciliation.

Executed local evidence:

- `python -X utf8 scripts/check_foundation.py`: passed (78 parent IDs; issued sources unchanged).
- `python -X utf8 scripts/check_prototype.py`: passed.
- `python -X utf8 scripts/check_naming.py`: passed after retaining the project-instruction limit.
- `node --import tsx scripts/check-development-register.ts`: passed; 280 entries, 126 routes, no integrity errors. Reviews remain pending.
- `node node_modules/eslint/bin/eslint.js .`: passed.
- `npm.cmd run build` and `npm.cmd run typecheck`: standard production build and TypeScript passed on final application source. An earlier webpack build also passed while resolving isolated dependencies. No dependency versions changed.
- Final focused analytics/navigation units: 12/12 passed. Broad units: 381/386 before the expected navigation assertion update. Four document-store/recovery/Windows-path failures reproduce against unchanged main runtime/tests: 3/7 selected baseline cases passed, 4 failed. Linux CI at `575ae00` passed 388/388.
- Sales database journeys initially reached 5/7 passing; two cases failed during synthetic seed setup. The upgrade case passed its focused rerun. The same seed statement timeout reproduced in unchanged-main E1-DB01 setup. Linux CI at `575ae00` passed all 61 CRM/Sales cases, including all seven Sales cases, and all 555 cases in the full database suite. The added eighth Sales test covers separate training steps, exact CRM receiving, source drift and options/receipt revocation. Its Windows attempt again timed out in seed setup before assertions; Linux CI at `69c7427` passed it within CRM/Sales 62/62. Tests, application guards and deadlines are unchanged.

The isolated PostgreSQL 16 server uses loopback port 5546 and disposable `ppo_synthetic_test`; all credentials/document bytes are outside Git. Main's normal local database is untouched. The disposable database was recreated and its server JIT disabled to investigate setup latency; SQL transaction, permission and application timeout guards were retained. This is local environment evidence, not production qualification.

New HTTP and browser journeys are included. The CRM CI job retains its existing suites and adds the new Sales database/browser cases; the application HTTP wildcard includes Sales. Browser selectors now name the eight native tabs explicitly, retaining the existing behavioural assertions.

Final compiled local Sales evidence covers all eight distinct desktop/phone journeys. The final full attempt passed 7/8; its first worklist assertion ran before the real data response. The corrected CR-01/04 replay passed 2/2, retaining the assertion and timeout. The revised HTTP fixture passed 1/1. Earlier combined CRM/Sales/navigation proof passed 26 cases, with 11 existing mobile-project skips and one browser-creation timeout before the navigation case began. CI and local results are not merged into a fictitious single passing run.

All 34 retained images were individually inspected: five native scopes at 1440 × 960, 1024 × 768, 390 × 844 and 320 × 844; four worklists/receiving queues at desktop and 320 px; five issued desktop references; and CR-05 at CSS zoom 2. CSS zoom is a reflow check, not native browser zoom or physical-device acceptance. The manifest records dimensions, hashes, source references and code provenance. The review found and fixed phone header overlap, excessive Overview prominence of secondary links and short narrative field limits. Owner/device acceptance remains unrecorded.

Latest completed Sales CI at `69c7427`: 388/388 units, 62/62 CRM/Sales database cases, 31 browser passes with two existing project skips, I2 17/17 and actual application/PostgreSQL restart verification. The broad application and compiled jobs remain independently visible in the PR; their completion is not inferred from the focused Sales result.

## Implementation and delivery inventory

- Seven new page routes: `/sales/handoffs/estimating`, `/sales/handoffs/estimating/[id]`, `/estimating/intake`, `/sales/handoffs/won`, `/sales/handoffs/won/[id]`, `/sales/aftercare`, `/sales/aftercare/[id]`. Existing Deal detail and worklist routes are refined in place.
- Domain implementation: `src/sales/handover-model.ts`, `handover-service.ts`, `aftercare-model.ts`, `aftercare-service.ts`, `aftercare-options.ts`; same-population analysis in `src/crm/insights.ts`. Command routes use the shared operation journal, current-authority receipt dispatch and outbox.
- Pages reuse PageHeader, Button, Field, SelectField, RecordTabs, error/recovery controls, shared theme and native shell. No second application shell or duplicated Activity store. The guide/register and real consumer bindings are in `docs/design/development/`; catalogue fixtures cover long Sales evidence and eight workspace tabs.
- Commits: `dc9cedf` persistence; `b836205` native pages and insights; `146368f` tests/guides; `410e6f6` retained navigation; `575ae00` phone containment and saved-revision readiness; `23fcb3a` paired layout review and receiving assurance; `69c7427` isolated HTTP source and worklist readiness. Evidence/documentation publication follows these code commits in Git history.
- Branch: `feature/sales-cr01-cr05-completion`. Worktree: `C:/Users/Dean.Fiedler/Projects/powerplants-one/tmp/sales-cr01-cr05-completion`. Base reconciled to `6c5e7c4fcbaf05d712a46989faf2cf7cabb8ba72`. The original checkout and other domain worktrees remain untouched.
- No merge or deployment was performed. No MYOB, SharePoint, customer communication, live adapter or business transaction was performed. Current check and review decisions are in [PR #303](https://github.com/deanrfiedler-gif/powerplants-one/pull/303).

## Remaining decisions and next bounded step

Owner review of the proposed native layouts and business workflow remains required for acceptance. Probability policy, default aftercare interval, satisfaction/competence definitions, contact signing authority, retention rules and automatic routing thresholds are deliberately unresolved. ES-05/06/07, native Service Agreements, ERP orders and delivered-Project source adapters remain unavailable on the reconciled main. Advanced handover evidence currently accepts validated exact source references/revisions; it is not a general document browser. No acceptance creates a Project, estimate, order, work order, booking or Finance transaction.

After this Sales package, review its exact-head checks and the paired native evidence, resolve owner feedback and reconcile concurrent Equipment/Estimating changes before any merge. Connecting an additional issued-quotation/conversion, delivery or agreement source is a separate bounded integration; it is not started by this handover.

## Reference mapping

- CR-01: [Deal Workspace r01](../reference/ui/crm/PPO-Deal-Workspace-r01.html); eight native logical views, no embedded shell.
- CR-04: [pipeline r38](../reference/ui/crm/ppo-deal-pipeline_r38.html); analytical disclosure supplements the existing worklist.
- CR-02: [intake r02](../reference/ui/estimating/sales-estimating-intake-preview-r02.html); frozen submissions and separate receiving decisions.
- CR-03: [delivery handover r01](../reference/ui/crm/PPO-Sales-to-Delivery-Handover-Workspace-r01.html); additive receiving evidence.
- CR-05: [aftercare r01](../reference/ui/sales-aftercare/PPO-Sales-Aftercare-and-Renewal-Worklist-r01.html) and [receiving contract](../contracts/sales-aftercare-receiving.md).
