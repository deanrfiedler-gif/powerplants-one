---
document_id: PPO-PJ09-HO
revision: r01
date: 2026-09-21
status: Local implementation and component verification; owner and hosted acceptance separate
---

# PJ-09 local implementation handover

PJ-09 is a server-backed Next.js/TypeScript/PostgreSQL workspace on `feat/pj09-staged-acceptance`, reviewed in [PR #269](https://github.com/deanrfiedler-gif/powerplants-one/pull/269). It retains PRJ-06/PRJ-08, PRJ-01–PRJ-08 relationships and OUT-13. [ADR-0033](../decisions/ADR-0033-staged-acceptance.md) records the dependency matrix, references and decisions; the [evidence record](../testing/evidence/project-acceptance-r01/README.md) maps executed checks to PJ09-01–56. Local code is not deployed or operationally approved.

## Review and restart

Review **http://127.0.0.1:3001/projects/acceptance**. The original checkout is on the owner's My Work branch and owns port 3000. PJ-09 therefore runs from `C:\Users\Dean.Fiedler\Projects\powerplants-one-pj09`; its ignored `.env.local` uses the existing synthetic development database at port 55438 and application port 3001.

```powershell
Set-Location C:\Users\Dean.Fiedler\Projects\powerplants-one-pj09
npm run db:migrate
npm run db:seed
npm run build
npm run serve:compiled
```

For source development use `npm run dev` after stopping only the PJ-09 server. `npm start` intentionally refuses production startup. If the existing local cluster is stopped after a machine reboot:

```powershell
& 'C:\Program Files\PostgreSQL\16\bin\pg_ctl.exe' start -D 'C:\Users\Dean.Fiedler\Projects\powerplants-one\tmp\en08-commissioning\tmp\pg16' -l 'C:\Users\Dean.Fiedler\Projects\powerplants-one\tmp\en08-commissioning\tmp\pg16\server.log' -o '-p 55438 -h 127.0.0.1' -t 30
```

Do not initialise or reset that data directory. Verify process/checkout identity before stopping a server. The task-owned test cluster is separate at port 55439, database `ppo_synthetic_test`. No database suite may target development.

Use the existing local synthetic identity chooser. Coordinator prepares scope, records responses, issues and closes; materials reviewer performs technical acceptance and customer authority validation; the change Service receiver independently receives; Finance reviewer records commercial disposition. These explicit seed duties are local synthetic policy, not an adopted organisation chart. `project.edit` alone grants no acceptance operation.

## Working journey

| View | Persisted behaviour |
|---|---|
| Acceptance register | Scoped project/stage queries, filters/search/order/paging, six default columns and optional Commercial, URL selection/Back, inspector and create/edit |
| Scope & readiness | Full unit ledger including unallocated/removed scope, installed/served meaning, included/excluded revisions, shared requirements, submission/return/successor, technical review and source inspection |
| Defects & outstanding work | Owned requirements and continuing obligations, due meaning/evidence, independent responsibility acceptance, source-controlled completion and canonical Activities |
| Training & handover | Distinct training/attendance/competence and backup evidence, exact manuals, source checks, immutable customer/Service OUT-13 HTML/PDF preparation/issue and independent receiving |
| Acceptance & closeout | Incoming customer evidence retained before validation, exact authority/scope, partial/returned/declined/conditional responses, separate Finance disposition, stage/project gates and explicit close/reopen/amend |
| History | Frozen revisions, requests/responses, named decisions and original files; historical closure and current reassessment; original-operation recovery |

Initial context: **Nursery irrigation upgrade**, `SYN-PPO-PRJ-000701`, Willowbank Horticulture, Nursery & propagation site. Greenhouse 01 has 12/12 accepted test evidence but as-built release remains pending. Resolve requirement opens the permitted actual EN-08 source. Customer/Service are Not requested, Commercial Not assessed and pack Not prepared.

Fixtures A–L use validated stable Project/EN-08 identities. They cover pending release, awaiting response, conditions/continuing obligations, shared holds, returned receiving, commercial dispute, partial/unknown-authority responses, missing evidence, interrupted review, closed-stage reassessment and a separate closed project. Their first persisted event anchors relative dates in the site's Australia/Brisbane civil zone; reruns retain that anchor/history. Actual lost-response/restart proof uses an additional disposable test project.

## Data and integrations

Migrations **0032–0038** are additive, preserve reserved 0016 and earlier bytes; seed 32 grants duties to existing synthetic identities only. Thirteen acceptance capabilities bring the catalogue to 87. AD-01 generated contracts/labels and migration, grant and seed assertions were reconciled. No new framework, package dependency, transport service or separate document/task store was added.

Core files: `src/projects/acceptance/{model,validation,policy,context,commands,reads,outputs,intents}.ts`, workspace/dialog components, `src/app/projects/acceptance/`, API routes and `src/app/styles/project-acceptance.css`. Shared changes cover shell/module discovery, actual My Work menu primitive, Project lifecycle/readers/schedule writes, typed Project Activity links and all-target visibility. `scripts/acceptance-scenario.ts` builds the synthetic journey through current services; registered seed reruns do not rewrite it.

Real runtime integrations: Projects, identity/grants, Activities, audit/outbox/operations, EN-08 test/release/configuration evidence and shared document rendering/storage. Labelled synthetic boundaries: supplemental training/manual/backup evidence, commercial sources, recorded customer responses and the broader local stage receiving contract. Service receiving is independently persisted; no external delivery, customer portal acknowledgment, ERP posting, SharePoint upload or controller write is claimed. Technical-only EN-08 receiving cannot approve the broader stage manifest.

Current source/template/recipient/authority checks run at commit under the shared lock order. Closed-project writes require reopening and renewed versions; original accepted schedule receipts remain unchanged. Later material source changes retain historical closeout and create reassessment plus one owned follow-up. Storage-success/database-failure and post-commit lost-response recovery retain original bytes and operation identity.

## Verification limits

The [evidence record](../testing/evidence/project-acceptance-r01/README.md) gives commands, results, screenshots, failures and PJ09-01–56 coverage. It distinguishes model, PostgreSQL, HTTP, native browser, actual process restart, CI, physical-device and owner evidence. Parent AT procedures, independent business/visual acceptance, physical phone/tablet testing and hosted deployment were not executed in this local increment.

Mockup and r22 matched their hashes and were inspected. The compiled proof includes full root stylesheet order, actual r22 specimens, My Work geometry, wide/narrow/390px screens, native Chrome 200% Page zoom, focus/Escape and a failing gutter negative control. Eleven-stage read timings are recorded without an SLA claim. Full assistive-technology and production-scale performance acceptance remain separate.

An existing document-store unit test cannot create a symbolic link under this Windows account; the same EPERM is reproduced on unmodified main. Its write-once/hash test passes with a canonical long-form TEMP path, and connected render/issue/download/recovery tests pass. No store guard or assertion was weakened. Initial parallel database runs timed out and a machine reboot interrupted execution; final suites use one database worker. Failed runs and corrected reruns remain distinguished in evidence.

## PR #269 reconciliation with main, 21 September 2026

Main `b4806af` (PR #268) is incorporated without discarding EN-06's refined register and direct workspace entry. The retained EN-07/EN-08 flex composition now lives in `src/app/styles/engineering-review-base.css`, imported before EN-06's new grid and the module overrides. Breadcrumb treatments are scoped to their corresponding module; PJ-09 retains its compact Projects breadcrumb. The duplicate EN-06 status row is reconciled with the actual merged PR #265/#268 history. No schema, grant, command receipt or document template changed in this merge.

The affected native browser check also found EN-08's existing phone inspector starting underneath the higher shared header. Its top inset now reserves the header's 64px so the close button is reachable. The original declaration is present at pre-merge `ae077b6`; this is a small compatibility correction, separate from EN-06's layout refinement. The [merge verification record](../testing/evidence/project-acceptance-r01/README.md#main-merge-verification-21-september-2026) records the executed checks and captures. Local review remains on port 3001; no hosted deployment or merge to main is performed here.

## PR #269 CI assurance repair, 21 September 2026

The retained broad Application job found three test-contract failures: CRM's pre-0032 Activity-link comparison omitted the new generated Project column; the EN-07 in-process helper returned 201 for a real 200 prerequisite resolution; P11's mobile SC-01 recovery asserted the loading state before its authorised read completed. The repair explicitly checks null additive link columns and every original value, matches the helper to the actual route, and awaits the exact successful recovery GET before checking the UI. A delayed real response and a negative control exercise the recovery boundary. It changes no runtime, migration, grant, receipt or document bytes.

The [CI repair evidence](../testing/evidence/project-acceptance-r01/pr269-ci-2026-09-21/README.md) distinguishes original failures, local database/browser results and pending CI at the repair commit. Verification uses an isolated test checkout/database; the existing compiled review app remains available at port 3001. No hosted deployment or merge to main is part of the repair.
