---
document_id: PPO-ES08-GEOMETRY-EVIDENCE
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Published audit checkpoint; reference observations only; native implementation not started
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# ES-08 geometry audit evidence and resumption checkpoint

The user requested publication of the work to date and continuation later. The [audit](../../../delivery/es08-geometry-audit.md), [mapping register](../../../delivery/es08-geometry-mapping.md), [build plan](../../../delivery/es08-geometry-build-plan.md), [future implementation prompt](../../../delivery/es08-geometry-implementation-prompt.md) and [architecture proposal](../../../decisions/es08-screen-geometry-study.md) are drafted. The registers contain 49 field mappings and 38 calculation/output mappings. The 25 proposed acceptance cases are future work, not passed native acceptance tests.

## Isolation and baseline

The exact audited remote-main commit is `0c95c5af776c97374997623bd1070d9de480cf82`. Work is isolated on `docs/es08-screen-geometry-audit` in `tmp/en07-change-impact/tmp/es08-screen-geometry-audit`, opened in a separate VS Code window. No native source, database migration, migration registry, application test, permission or navigation was changed.

PR [#277](https://github.com/deanrfiedler-gif/powerplants-one/pull/277) **merged at 2026-09-22 10:22:56 UTC** while this checkpoint was being prepared. Its final observed head is `876e92ab288b682e85f58773c7b02e340a7ab63e`, with all 20 reported checks successful. Remote main advanced to `d6251b42f5c969f537a6397c1823f8c871e4d4d1`. The earlier OPEN observation at `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe` (18 successful/two failed checks) remains historical evidence, not current status. This audit neither repaired nor merged #277. Publication documentation is reconciled with merged main; native findings remain pinned to the original audited commit. The final fertigation changes still require WP-G00 reconciliation before implementation.

The original fertigation worktree was initially clean. Later, concurrent modifications appeared in `docs/delivery/priva-fertigation-native-handover.md`, `docs/testing/evidence/fertigation-native-r01/README.md` and `tests/database/reports.test.ts`. The concurrent session subsequently committed them; the original worktree was clean at head `876e92a` when rechecked. They were left untouched by this audit; nothing from that worktree was staged, committed, reset or rebased by this audit.

## Executed observations

- [Reference calculation probe](probe-r10.mjs) executes a bounded extraction from the retained r10 HTML, verifies its SHA-256 and checks 13 scenarios plus a one-second timeout for `partition(1,0)`. [Recorded results](r10-calculation-observations.json) were produced with Node v24.21.0. These establish reference behaviour, not independent engineering correctness.
- [Reference browser probe](probe-browser.mjs) records [Chrome observations](browser-observations.json) and screenshots at desktop 1440 × 1000 and phone 390 × 844. Chrome 153.0.8010.53 reported no page errors or outer horizontal overflow. Clicking the drawn centre of W08-L14 selected W07-L13, supporting the identified r10 hit-testing defect. This is a narrow reference observation, not a native browser acceptance suite.
- [r10 desktop](r10-desktop.png), [r10 phone](r10-phone.png) and [r02 desktop](r02-desktop.png) were visually inspected. The phone capture is a long full-page image; no claim of detailed device usability acceptance is made.
- Documentation assurance is recorded in [foundation](foundation.json), [naming](naming.json) and [package integrity](package-check.json). Their results apply to this documentation checkpoint only.

To reproduce the calculation observation, run `node docs/testing/evidence/es08-geometry-audit/probe-r10.mjs` from the repository. The browser probe additionally needs the repository's existing Playwright dependency and Chrome; run `node docs/testing/evidence/es08-geometry-audit/probe-browser.mjs` from the repository root. Both overwrite only their evidence artifacts. The r10 input is retained byte-for-byte at [the reference path](../../../reference/ui/specialist/PPO-Greenhouse-Blueprint-and-Screen-Calculator-r10.html); hashes and source authority are recorded in the audit.

No native unit, database, HTTP or compiled application browser suite was run for this documentation-only change. No database was connected, live schema verified, supplier formula accepted or engineering approval obtained. No migration number has been created or reserved.

## Resume here

Read the audit's implementation gate and the future prompt before changing code. Review the proposed mapping, contract, precision policy, source-adoption semantics and unresolved supplier assumptions. Actual implementation still requires a separate user instruction and WP-G00: resolve the concurrent contribution, refresh remote main, record its exact SHA, inspect #277 and other intervening changes, and create a fresh implementation branch/worktree from that baseline. Reconcile shared Estimating services, receipts, shell/menu integration, schema constraints and global migration checks before choosing a migration number. The audit branch is a retained checkpoint, not the future implementation base.
