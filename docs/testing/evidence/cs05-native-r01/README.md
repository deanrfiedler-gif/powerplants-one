# CS-05 native candidate evidence

Native implementation and bounded local verification completed on 22 September 2026 (Australia/Sydney). Branch `feat/cs05-facilities-growing-areas`, base main `af3f045`, final code candidate **`5f6e683e7c809e1850e932ed684b9dd3725d13d0`**. Documentation/evidence is committed separately. [Candidate manifest](candidate-manifest.json) records code tree, file hashes and compiled build ID. [Source manifest](source-manifest.json) preserves the supplied r02 documents and issued r03/r22 references; no issued source was edited.

The [handover](../../../delivery/facilities-growing-areas-handover.md) describes contracts, native reuse, adaptations and limits. The [80-case matrix](acceptance-matrix.md) records executed layers case by case; it is not an assertion that all manual/owner checks passed. These are authored synthetic records only. No provider connection, production transaction, deployment, merge or external communication occurred.

## Environment and outcomes

Windows; Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Playwright 1.63.0 with installed Chrome 153.0.8010.53. Compiled app on loopback 3105 and a separate `ppo_synthetic_test` database on 5545. Broad database regression used the existing guarded local test database separately. The pre-existing user server on 3000 was not replaced. The before-view used an unmodified main worktree and development server on 3106, explicitly identified in `before-after/manifest.json`; after-views use the compiled candidate.

| Check | Actual result / evidence |
|---|---|
| Full lint, typecheck, production build | Passed: `lint.txt`, `typecheck-final.txt`, `build.txt`. `lint-final.txt` rechecks final proof/test edits. Empty lint output means successful exit, not a test count. |
| Unit suite | 189 passed, four failed out of 193 (`unit.txt`). The identical four Windows/path assertions reproduce on unchanged main (`main-unit-baseline.txt`: three pass/four fail in selected suites). New Facility unit groups pass. |
| Broad DB/upgrade regression | 218 passed, 11 failed out of 229 (`database-regression.txt`). All 11 are reconciled below. This original run is retained, not relabelled as green. |
| Final focused DB run | 17/17 pass (`resolved-database.txt`): all ten Facility groups, E2 migration-27 preservation, five report cases and shared scope projections. Includes the added 55-Asset review dependency case. |
| Other timed-out DB cases | Three pass on both unchanged main (`main-db-baseline.txt`) and candidate (`regression-recheck.txt`). |
| HTTP | One composite legacy/rich API group passed (`http.txt`), including strict writes, origin/size, original replay and nested-ID authority. |
| Native Facility browser | 14 desktop/phone project cases pass across completed runs: ten in `browser-release.txt`, corrected Equipment add/end two in `browser-equipment.txt`, dock/dirty navigation two in `browser-navigation.txt`. The original release run's two missing-source fixture failures remain visible. Earlier `browser-verified.txt` was 10/10 before the expanded cases. |
| Compiled CRM/E1/E2 regressions | 32/32 passed (`browser-regression-final.txt`), real create/edit, exact quote output, discovery, cost adoption, conflict/unknown recovery and identity clearing on desktop/phone. |
| Restart | `restart/result.json`: three saved greenhouse/berry/mixed-nursery aggregates, history, immutable sources and original receipts retain digest `d62f4194d08786c76e2a70294f6a74725b7917a1dc4c292a9cb7004414cd7150` across actual app/PostgreSQL restart. Old-process cursor refuses; fresh page works. |
| Large register | `query.json`: 5,000 matching synthetic rows, 50 loaded, **seven DB queries**; 20 warmed HTTP samples, p95 register 50.8ms/detail 10.7ms. Local 500ms review target met; browser search latency and production capacity are not inferred. |
| Issued commissioning | `commissioning.json`: **two actual issued releases**, identical full-row/manifests hash `113d8e2f302e0613110c3feaa2c4773907003f9767b8f97366888f3411f31e21` before/after Facility metadata edit and sourced Asset service addition. |
| Foundation/naming | Passed: `foundation.txt`, `naming.txt`. These assure documentation/IDs, not business acceptance. PP-01 package was unchanged. |

The DB regression command selected `facilities`, `shared`, `field`, `finance-upgrade`, `offline`, `packs`, `planner`, `reports`, `leads-projects-integration`, `estimating`, `estimating-workspaces`, `mobile-crm` and `demo/upgrade`, serially. All registry/version/count expectations affected by migration/seed 0041 were reviewed. No Capability, grant or user was added.

## Failure resolutions

The broad run found three fixture expectation defects: E2's upgrade comparison needed the 16 explicitly new CS-05 identity rows while asserting every old row unchanged; the E2 Facility test needed the exact current-context review/owning opportunity; shared scope counts needed the new synthetic Organisation. These were corrected without weakening authority/business assertions and pass in `resolved-database.txt`. Eight other failures were PostgreSQL `57014` setup/reset/seed timeouts, including `pg_timezone_names`, under concurrent local load. Three pass on main and candidate in the logs above; five report cases pass on unchanged main (`main-reports-baseline.txt`, 5/5) and candidate (`resolved-database.txt`). They are classified as transient setup failures after comparison, not silently discarded.

Earlier focused logs retain a fixture with Assets lacking required location events, corrected by creating both atomically; a TypeScript query-probe overload, corrected with the original query signature; and the required service source omitted by the added browser fixture, correctly refused by the server. The final equipment fixture supplies an explicit reported source and passes. Earlier UI verification caught and fixed navy tab styling/wrapped Inspect buttons; negative browser assertions now cover both. A run made while compiled server chunks were stale was followed by an explicit stop/start and completed passing runs.

The first commissioning attempt reused fixed scenario output IDs with older private stored bytes (`commissioning-initial.txt`: `OutputIdentityInUse`). The proof now allocates fresh ordinary scenario identities and creates two actual issued outputs before comparison; it does not delete or replace earlier originals. The successful result is `commissioning.txt`/`.json`.

The first broader browser attempt used existing hard-coded Origin `:3000` against the isolated `:3105` app and was stopped (`browser-regression.txt`). The four existing specs now respect `PPO_PORT`, retaining default 3000; no origin guard was relaxed. The correctly configured run passed all 32 cases. The full unit failures concern two private document-store Windows roots, one Windows unsafe-root message expectation, and relative route-path separators; all reproduce at unmodified main `af3f045`.

## Repeatable entry points

Use only a disposable database named `ppo_synthetic_test`; keep its connection outside evidence. Proof scripts enforce that database name. Configure `PPO_PORT` and the local database through environment variables; the checked-in default port remains 3000.

```text
npm run lint
npm run typecheck
npm run build
node --env-file=.env.local --import tsx --test --test-concurrency=1 tests/database/facilities.test.ts
node --env-file=.env.local --import tsx --test tests/http/facilities.test.ts
npx playwright test tests/browser/facilities.spec.ts --config=playwright.compiled.config.ts --no-deps
npx playwright test tests/browser/crm.spec.ts tests/browser/estimating.spec.ts tests/browser/estimating-discovery.spec.ts tests/browser/estimating-cost-basis.spec.ts --config=playwright.compiled.config.ts --no-deps
node --env-file=.env.local --import tsx scripts/facilities-commissioning-proof.ts
python3 scripts/check_foundation.py
python3 scripts/check_naming.py
```

`scripts/facilities-query-proof.ts` requires the actual 5,000-row query-test fixture to remain present and refuses sparse data. `scripts/facilities-restart-proof.ts write` captures originals; stop/restart the owned app and PostgreSQL cluster, then run `verify`. `restart-processes.txt` distinguishes the first failed default-port start from the successful 5545 restart. Restart/large-query proofs precede the final presentation-only receipt message; canonical schema/commands/reads are unchanged at the final code checkpoint. `scripts/facilities-before-after.ts` expects the isolated main and candidate servers. Final captures followed the completed build and explicit compiled server restart.

## Capture review and remaining acceptance

[Capture manifest](capture-manifest.json) records image hashes and original run paths; curated PNGs are under `captures/`. Browser assertions load issued r03 and r22 independently. Agent visual review covered desktop register/dock, phone table and scrolled actions, canonical detail, clearing/pin review, related equipment, accepted service ending and main/candidate Site views. No clipped whole-page content was observed in those views; phone tables intentionally scroll horizontally. The first Site after-capture was replaced after waiting for loaded rows. Traces, session cookies and duplicate intermediate capture folders are not delivered.

Owner visual/business acceptance, screen-reader and physical-device testing, external Maps handoff, the separate browser search timing budget and individual delayed picker/actor combinations remain unexecuted or partial as marked in the case matrix. Finer per-Facility ACLs and provider work/document adapters do not exist. No offline/durable browser draft recovery, production service level, ERP write or technical release is claimed.
