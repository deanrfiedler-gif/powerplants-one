---
document_id: PPO-INT-LEADS-PROJECTS
revision: r01
date: 2026-09-10
status: Combined integration under verification; no main merge or deployment
owner: Dean Fiedler - prototype owner
---

# Leads and Projects migration reconciliation

Dean requested correction of the duplicate 0018 registrations and reconciliation/testing of the shared application changes. This is the bounded combination of Leads PR #88 at `dcbc6a3e8309ab268e839bf497e254a1663ad4e3` and Gantt PR #90 at `547a2c315d9c440b4cd34417984949ce4ecf2407`. Both are based on shell PR #84 at `6e2951e49f41e2b980da6885357230ef310f8198`. Main was `1de7821a380514712e93babd4766fc32a62f76e9` when inspected.

## Registration and compatibility

| Capability | Migration | Seed receipt |
|---|---|---|
| Manual Leads | `0018-crm-leads.sql` | 18 |
| Projects Gantt | `0019-projects-gantt.sql` | 19 |

The Gantt file is renamed only: Git blob `e7080603cb438ba87a1961608b50ed3e846c8838` is identical to PR #90's 0018 file. Leads blob `2ea0aef10f9939dd45cc1fe3476c0fa99dc04113` and both seed SQL files are unchanged. Earlier migration bytes and the Assistant reservation at 0016 remain intact.

`scripts/migration-registry.ts` is the ordered source for local and hosted setup. Migration and seed entry points reject duplicate/out-of-order registrations before SQL dispatch. Unit assurance also checks every forward SQL file is registered, excluding the deliberately separate recovery script. Existing transaction locks and checksum refusal remain.

Fresh installations and databases through main's 0017 or Leads' 0018 use the existing migration/seed commands and advance to 0019. Original migration receipts, accepted data and revoked fixture grants must survive repeat execution.

An environment that already applied PR #90's Gantt SQL under version 18 is **not** automatically compatible. The runner must refuse its differing checksum and preserve its records. Do not rewrite its ledger, change applied SQL, reset it or run the seed command after that refusal. Retain its database and source revision for a separately reviewed data-preserving recovery. No evidence of any particular local or hosted environment's migration ledger was assumed; no operational database was inspected or changed here.

## Shared application reconciliation

Both stylesheet imports, navigation destinations, Quick add actions, search sources, capability types, receipt authority branches and bounded demo capability definitions are retained. Existing permission checks remain authoritative; defining demo capabilities does not execute tester reconciliation or grant access. Projects' typed identity/audit/outbox extensions execute after Leads' extensions, preserving both.

Existing upgrade tests now expect both migration versions. Estimating's exact original-row comparison includes the new `activity_links.lead_id = null` generated column; source values are not discarded. The Leads workflow executes the combined upgrade suite, both domain database suites, shell checks and both browser suites in the same checkout. Projects retains its database restart proof.

## Verification and publication

Pinned Node 24.20.0/npm 11.19.0: lint, TypeScript, 54 unit tests and Next.js build passed locally. The retained report-template tracing warning remains. Foundation, prototype and naming checks passed; four issued sources and all 78 parent requirements remain preserved. SQL blob identity was independently compared with both source branches.

The new combined database suite covers fresh installation, main-0017 upgrade, retention of existing Leads-0018 records/receipts, migration/seed reruns, both search/actions, company/workspace isolation, receipt checks, conversion after Gantt and refusal of the original Gantt-0018 ledger. Native PostgreSQL 16.15 and pinned browser results must be established by the published CI; local package installation failed because this executor cannot perform the required package-manager user/file operations. No native PostgreSQL pass is claimed from local checks.

Initial local verification caught a test-only UUID/string type mismatch, corrected without application changes. A supplemental PGlite attempt used separate process environments and could not connect; a same-process attempt then exercised SQL and exposed comparisons against the changing `observed_at` read timestamp. The test now compares all persistent schedule content exactly and separately verifies that observation time advances. The new shell assertions were also corrected to use canonical destinations because search result IDs include a record-type prefix. All four combined cases then passed against supplemental PGlite; the focused E1-DB10 upgrade/preserved-row case passed as well. Supplemental results are not native PostgreSQL concurrency/restart acceptance. The first supplemental Chromium 152 run passed six application journeys (Leads capture/conversion and Gantt save/reload on both viewports); six other cases failed before page creation when the supplied single-process browser closed between contexts. Final results and CI links are recorded in the integration PR.

The dedicated `fix/leads-gantt-integration` branch preserves both source histories and targets the Leads branch for a focused combined review. It does not change, merge or close #88/#90, nor resolve the separate #75/#84 stack. Integrate through this reconciled branch after its required checks and prerequisite stack review; do not independently bring the original colliding registrations into main. Public publication of the underlying Leads and Gantt packages was already authorised; this follow-up implements Dean's requested reconciliation.

No main merge, Azure deployment, live migration, tester change or full CRM/Projects business acceptance is included.
