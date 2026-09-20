---
document_id: PPO-EN06-EVD
revision: r01
date: 2026-09-20
owner: Dean Fiedler
status: Local component evidence; not a parent acceptance pass, not owner acceptance
source_commit: 99c32aed5032393b7658713cca53aa4c1a2ab2dd
---

# EN-06 Released Materials & Substitutions: local verification, 20 September 2026

Windows 11, Node 24.21.0, npm 11.19.0, Next 16.3.4, React 19.2.8, PostgreSQL 16.15, Playwright 1.63.0 on the Chrome channel. Database `ppo_synthetic` (local synthetic). Branch `feat/en06-released-materials`. Every EN06-Axx label is task-local to build plan r02. A green result here is component evidence only: code delivery, component tests, executed acceptance and business approval remain four separate claims.

Screenshots, logs and the supplied mockup are local and git-ignored, as for My Work: `verification-evidence/engineering-materials-local-r01/` (23 captures, `restart-snapshot.json`, `my-work-desktop.log`, `reference-mockup-r04.png`).

## 1. What was run, and the result

| Check | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` on a scoped config that excludes the git-ignored `tmp/` | Clean |
| Lint | `npx eslint` on every new and changed path | Clean |
| Migration and seed, dry | 0029 then seed 29 inside a transaction on the live development schema, rolled back | 11 tables, 6 profiles, intended grants, 1 policy, identity dispatch extended, 4 shared checks intact |
| Constraints and triggers, dry | Same transaction, driven as the commands drive them, rolled back | 16 intended refusals, including a second issue taking a line to 7 of 6 EA, a rewritten or un-issued release, a self-decided alternate, a self-reviewed set, a preparer-accepted payload, procurement-ready on forecast demand and edited history. Every positive path and the deferred identity checks passed |
| Migration and seed, applied | `npm run db:migrate`, `npm run db:seed`, `npm run db:health` | Completed; ledger 0001–0029 with 0016 reserved |
| Scenario | `scripts/engineering-materials-scenario.ts`, twice | Built; server derives 8 materials, 5 ready for review, 3 needing attention, 2 proposals. The second run replayed and changed nothing |
| Registry | `node --import tsx --test tests/unit/migration-registry.test.ts` | 2 of 2 |
| Unit | `node --import tsx --test tests/unit/engineering-materials.test.ts` | 13 of 13 |
| Unit, whole suite | `npm run test:unit` | 140 of 144. The four failures are the Windows-only ones on unmodified `main`: `document-store` (2), `recovery` (1), `warm-routes` (1) |
| HTTP | `node --import tsx --test tests/http/engineering-materials.test.ts` | 1 of 1 |
| Browser, EN-06 | `npx playwright test tests/browser/engineering-materials.spec.ts --no-deps` | 5 passed: 4 on `desktop-chromium`, 1 on `mobile-chromium` |
| Browser, regressions | `engineering.spec.ts`, `shell.spec.ts` on desktop | 5 passed |
| Browser, My Work | `my-work.spec.ts` desktop; `my-work-mobile.spec.ts` phone | 10 passed; 10 passed, on the shared menu frame. The My Work review scenario was rebuilt afterwards |
| Restart | Section 3 | Identical records from a new server process |
| Captures | Section 4 | 22 viewports and states; zero page overflow, no page error, no failed request |

## 2. What was not run

- **`tests/database/engineering-materials.test.ts` is authored and was not executed.** It refuses any database but `ppo_synthetic_test`; only `ppo_synthetic` exists here and the local role cannot create databases. The guard was not defeated. It reuses the scenario helper through an in-process router, so its flows are the ones the HTTP and browser suites proved over HTTP, but its own assertions have never run. CI is its first run.
- **The registry edits in eight existing suites were not executed** for the same reason: the six applied-version lists, `atVersion(29)` and both `>=18` lists in `leads-projects-integration.test.ts`, the grant allowlist in `quality-upgrade.test.ts`, and the added-migration count and added-user assertions in `tests/demo/upgrade.test.ts`.
- **`npm run build` and the compiled-application browser suite were not run.** A build cannot run beside the development server. The development server hides timing faults that the compiled application exposes.
- No physical device, screen reader, or second browser engine was used. The 200% zoom check is a 720 CSS-pixel viewport at twice the device scale.
- `check_prototype.py` was not run: the PP-01 package is not touched.

## 3. Restart and persistence (EN06-A40)

A temporary worktree of this branch with its own install served the application on port 3100, so Dean's server on port 3000 was never stopped.

1. Through server process **43636** on :3100: a fresh package was built, line 070 received one technical and one coordination change in a single saved edit, and a release set was prepared.
2. That process was terminated; port 3100 was confirmed free.
3. A new process, **25796**, was started on :3100. Signed in afresh, it served records **identical** to the snapshot: line 070 at version 4, content revision 4, the same content hash, 40 events, release 1 in Draft.
4. Dean's separate process on :3000 served the same records.

Both task-owned processes were stopped and the worktree removed.

## 4. Visual inspection

Images were opened and looked at, not only measured. Compared at 1672×941 with mockup r04 and with `/work` at the same size.

| Capture | Observation |
|---|---|
| 02, 01 register, menu open, inspector open | Composition matches r04: one rail, one header, breadcrumb, compact context row, menu, flush register, square inspector. Departures D1–D6 of the integration record are visible and intended |
| 05 My Work beside 02 | Same panel width, title block, link height, outline icons, pale active link, navy marker, edge handle and header trigger. My Work is unchanged from `collapsible-menu.png` |
| 03, 04 default collapsed | Table runs from the rail boundary to the workspace edge; no residual track or gutter |
| 06, 07, 08 1440, 1280, 1024 | Inspector docks while the register keeps its width and overlays below that, by container query. At 1024 the header trigger is icon-only, as the shell already does for My Work |
| 09–12 820, 390, 320, short landscape | One column; the table keeps its text size inside its own scroll; final actions reachable |
| 13 200% zoom | Contained; inspector overlays |
| 16 prepare dialog | Ticking half of the pump-and-control pair shows the server's refusal, disables Prepare and lists what is left out with its owner |
| 23 breadcrumb strip | Menu open: "Engineering / Released Materials & Substitutions". Menu hidden: the destination stays whole and the module name gives way |

Defects found by looking, all fixed before this record: context actions and toolbar wrapping; column headers centred and wrapping; readiness labels wrapping; inspector rows overlapping because flex children shrank; the alternate icon falling to its own line; the set status chip sliding under the action button at 1440; the breadcrumb truncating the destination instead of the module name; a dialog closing before it could report a recovered result.

## 5. Acceptance labels

| Evidence | Labels exercised |
|---|---|
| Unit | A02 A06 A07 A08 A09 A10 A13 A14 A16 A19 A21 A22 A23 A27 A28 A36 A38 A39 |
| HTTP | A28 A41, and the replay half of A17 |
| Browser | A04 A06 A07 A09 A10 A11 A12 A13 A14 A15 A16 A17 A18 A19 A20 A22 A23 A27 A30 A33 A34 A35 A36 A37 A38 A39 A41 A42 A44, and the browser half of A40 |
| Restart proof | A40 |
| Regression suites | A45 |
| Authored, not executed | A01 A05 A24 A46, and the database halves of A04 A10 A15 A17 A18 A20 A21 A23 A41 A42 |
| Not evidenced | A03 source bytes of the off-repository EN-03/EN-05 design (the negative fixture is a separately authored coordination-only source, not that file); A25 and A26 beyond the conflict and corrupt-preference paths in the unit and browser suites; A29 by screen reader; A31 beyond the four outside tables counted in the database suite; A32 from a clean machine; A43 as a complete matrix |

No label is counted as passed on the strength of an unbuilt view, a skipped test or a screenshot alone.
