# CPQ published Products execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 14 October 2026 on Windows, Node 24.21.0/npm 11.19.0 and PostgreSQL 16.15, against a task-owned loopback `ppo_synthetic_test`. [Decision](../../../decisions/cpq-published-products.md), [API](../../../interfaces/cpq-api.md). Synthetic backend only; local execution, CI, independent review, operational acceptance and deployment are separate.

## Source and integration

The isolated `codex/cpq-published-products` branch began at main `b100680`. PR #489 was open at initial inspection, then merged independently at `2026-10-14T08:38:09Z` as `bc9e3fb1ac36e578178b6b0008b0c15b2e512738`. This branch was rebased onto that main before the final build, upgrade, unit, compiled API and restart checks. Its landed-cost implementation, migration 0100 and historical-upgrade assertions are retained. This CPQ contribution adds no migration, seed, capability, dependency or service. The earlier unfinished schema-2 worktree was inspected and left unchanged; selected checks/tests were adapted here. The primary working directory was not edited.

The [source manifest](source-manifest.json) records the executed implementation/test bytes and compiled build ID. [Hash compatibility](hash-compatibility.json) compares unchanged schema-1/3 definition/result hashes with the original `b100680` validator. The current main integration does not change that CPQ baseline.

## Local results

| Check | Actual result |
|---|---|
| Focused CPQ, design and Products units on integrated main | 29/29 pass: `tests/unit/cpq.test.ts`, `cpq-design.test.ts`, `products.test.ts` |
| Full unit suite before main integration | 823 cases: 820 pass, three failures described below; not claimed as a clean full-suite pass |
| Full CPQ database regression before main integration | 17/17 pass, including the seven new mapped cases, existing schemas/receipts, populated upgrades and repeat seeding. This run loaded the migration registry through 0099 before rebase; it is not presented as 0100 evidence |
| Integrated populated upgrades | 2/2 pass with `--test-name-pattern='^00' tests/database/cpq.test.ts`: populated 0085 and 0086 histories advance through 0100; original ledgers, rows, grants, identities, runs and adoption evidence remain intact; repeated migration/seeding is stable |
| Compiled HTTP on integrated main | 2/2 pass: existing `tests/http/cpq.test.ts` and new `tests/http/cpq-products.test.ts`, run sequentially against the completed build |
| Actual application/PostgreSQL restart | Pass; [retained result](restart.json). Two bound variants, one exact Conditional relationship and one generated Product line survive unchanged. Original calculation/adoption receipts recover and replay without added effects; new adoption after withdrawal is refused |
| Integrated application build and TypeScript | `npm run build` passes, including the build-time type check; standalone typecheck also passed before integration |
| Integrated lint | `npm run lint` passes |
| Live development register | `npm run studio:check` passes with no errors. Existing 334 unreviewed and 28 stale entries remain visible; this is not visual acceptance |
| Documentation and naming | `python -X utf8 scripts/check_foundation.py` and `python -X utf8 scripts/check_naming.py` pass; all 78 parent requirement IDs retained |
| Patch hygiene | `git diff --check` passes |

The new database cases prove exact published Variant/revision/hash and unit binding, company/access isolation, reviewed Conditional relationship endpoints and supersession, immutable run/adoption history, rollback of the entire estimate/evidence/receipt graph, concurrent same-operation adoption and repeat recovery, retained manual lines, changed owned-line refusal, unchanged quotation privacy and repeated migration/seeding. The unit case proves remapping invalidates an existing override basis.

The compiled HTTP helper abandons the adoption response body after the server returns committed headers. It recovers the original operation and exact estimate evidence, then withdraws the Product. Tests cover historical reads, original calculate/adopt replays, changed-payload conflicts, new-use refusal and revoked Products authority. This is a simulated lost-result client outcome, not a network fault-injection claim. The restart proof then stops and starts both real application and PostgreSQL processes, verifies a changed postmaster start time, compares the complete retained SQL graph and checks exact run/provenance/receipt responses.

## Failures and baseline controls

The full unit run's two `tests/unit/document-store.test.ts` failures report `ExactDocumentUnavailable` from Windows private-directory validation. The `tests/unit/recovery.test.ts` failure receives `Unsafe recovery directory` before the expected `/outside Git/` message. All three reproduce in an unmodified, detached current-main `bc9e3fb` control worktree with the same locked dependencies. They are retained as local baseline limitations, not fixed or counted as passing by this change.

Initial setup attempts also found missing locked packages in the primary worktree dependency cache and Windows encoding inherited by the new disposable database. This isolated checkout received `npm ci`; only its own database was recreated as UTF-8. A readiness probe made before the compiled server began listening was retried after readiness. These setup attempts are not application passes or regressions.

## Delivery and limits

The E1 workflow now runs the compiled Product API scenario and the write/verify restart proof around its existing actual PostgreSQL/application restarts. Only the compact verified restart result is uploaded; the local checkpoint includes a synthetic session token and stays ignored/private. CI results on the pull request and independent review remain separate and pending at local handover. No merge or deployment was performed.

Schema 2 retains schema-1 calculation/input features; schema-3 design plus Product binding is not implemented. Conditional relationship evidence retains its technical owner and conditions without automated application suitability or operational approval. Availability/lead time remain Unknown. Authored prices stay under existing CPQ contracts. Later manually saved estimate versions are not assigned an invented adoption: exact provenance remains available on the original adopted version. Broader fact mapping, cost/labour books, UI/Figma work, live integration, stock commitments and commercial transactions remain outside this increment.


## Independent automated review follow-up

The independent Codex review of `53d582b` identified two authority concerns in the exact-version provenance endpoint ([historical version](https://github.com/deanrfiedler-gif/powerplants-one/pull/490#discussion_r4268923230), [Products status access](https://github.com/deanrfiedler-gif/powerplants-one/pull/490#discussion_r4268923245)). The follow-up passes the validated requested version directly to native estimate authority and requires company Products read authority before any adoption/status query, including no-adoption and schema-1/3 results. No stored evidence, hash, schema or receipt is changed.

Two focused PostgreSQL regression cases pass: legacy/no-adoption status requires Products access, and a caller with current-site estimating access cannot read an older discovery site. The latter fixture retains opportunity access at the permitted site while independently denying the historical discovery site. Current-head CI and a new independent review are required after the follow-up; the earlier source manifest and execution results remain historical evidence.


### Final-head CI execution budget

Independent automated review of `5ce7a1a` [reported no major issues](https://github.com/deanrfiedler-gif/powerplants-one/pull/490#issuecomment-6165297054); both earlier access findings were addressed and resolved. The [E1 database job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38542522453/job/115780521413) was cancelled with the explicit annotation “The job has exceeded the maximum execution time of 30m0s”. Its retained combined Excel/CPQ suite needs a longer execution window. Increase only that matrix lane to 45 minutes, retaining every test and the browser lane's original deadline. This changes CI capacity, not a runtime calculation deadline or an acceptance rule. Replacement-head CI remains required; no merge or deployment.
