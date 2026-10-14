# Excel revised-workbook backend evidence

Date: 14 October 2026. Owner: Dean Fiedler. Local author verification is recorded below; independent review and owner/business acceptance remain open.

Scope: PPO-010 Step 4, XI-03/04/05/07/08. [Decision](../../../decisions/excel-import-revision-backend.md), [contract](../../../contracts/excel-import-revision.md), [plan](../../../delivery/excel-estimate-import-plan.md). Branch `codex/excel-import-revision-backend` continues first-save PR #482. This backend does not deliver native controls, quotation continuation or operational readiness.

The implementation adds exact-current-version comparisons, historical stable line mapping, explicit omission decisions and one native atomic successor with a retained revised workbook. It preserves earlier source workbooks, versions, receipts and Draft output snapshots. Migration 0096 is additive and seedless; 0093/0094 remain reserved.

## Execution ledger

The executed database cases cover manual PPO edits, added/removed/reappearing keys, reordered rows, section/source/presentation changes, kept PPO-only lines, concurrent duplicates and competing intents, stale review, current access, original-operation recovery, adapter faults and atomic transaction failures. Populated 0095 upgrade retains the entire original evidence graph, grants, users, seed receipts and exact ledger. Existing populated 0025/0092 and reserved Products upgrade obligations remain enabled.

The compiled HTTP proof exercises both new routes, authentication/origin controls, decisions, exact retained source bytes, changed/stale intent and historical recovery. The existing restart script now retains first and revised XLSX bytes plus both operations, and checks unchanged evidence and no-write replay after actual application/PostgreSQL restarts. Runtime source/checkpoint files remain ignored and synthetic.

| Check | Executed result |
|---|---|
| Reader, review, re-import and registry units | 60 passing tests: 45 reader, 9 review, 3 comparison/decisions and 3 registry. |
| PostgreSQL persistence and upgrades | 16 passing cases across first-save persistence (5), existing populated 0025/0092 upgrades (2), populated original Excel 0095 upgrade (1), re-import (6) and reserved Products installation after 0095/0096 (2). Targeted reruns followed fixture corrections and the historical-access guard. |
| Compiled HTTP | All 3 scenarios passed: validated preview, first save, and comparison/re-import. The last verifies exact successor source, operation recovery, denied foreign/observer access, origins and stale/changed intent. |
| Actual process restart | Passed after stopping/restarting the actual compiled app and PostgreSQL process: both XLSX files and complete evidence rows are exact; both original receipts recover and replay creates no rows. |
| Build / types / lint | Production build passed with TypeScript; changed runtime, scripts, helpers and tests passed ESLint. |
| Foundation / naming | Passed: 78 parent requirements, 22 issued sources and 9,532 local links; maintained project instructions 7,969 characters. |
| Live design register | studio:check passed: 362 entries, 46 components, 208 page routes; existing 334 unreviewed and 28 stale remain visible. |
| Repository integrity | git diff --check passed; migration 0095 and issued reference files unchanged. |

Execution used the isolated local PostgreSQL 16 instance and disposable `ppo_synthetic_test`, private environment/source storage and the compiled application. No operational workbook or credentials entered Git. The cross-Site regression proves the permitted successor/source can still be read while retained comparison evidence is refused when the earlier Site's internal estimating duty is withdrawn. The 101-line resolved projection is refused before storage; current version and permission changes during storage also refuse the successor. CI remains separate; the full unrelated database/browser suites were not rerun locally.

No visual review is claimed: no page or component changes. The existing design register's unreviewed/stale counts remain visible. No business acceptance, production integration or deployment is implied by automated checks.

Restart source digests: original `b632633d06482b3eb3d97774e1bf64cffdd8bb4eeabb4445e64b41668ae32211`; revised `bd8ed0cf9873c9b1f8926ca286bdd6f6c3a7b635d3a08b4fb53b8f3943870b17`. The script asserts a changed PostgreSQL postmaster start time; the application was explicitly stopped and started on the same compiled build.
