# ES-05 retained assurance repair

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution by Codex on 3 October 2026. This is verification evidence, not business or visual acceptance. [PR #340](https://github.com/deanrfiedler-gif/powerplants-one/pull/340).

## Failed original and baseline

- Application run [37112227931](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37112227931), head `69e0ffa`: primary browser 549 passed, one CR05 desktop failure, 79 retained configured skips. Artifact `11271134363` preserves the loading-state error context and subsequent loaded screenshot; neither is relabelled as a pass.
- The database job was cancelled at 90 minutes after 703 passing cases, with no failed assertion or completed suite summary. Main `8c14233` run `37107349827` passed all 690 then-current database cases; its whole job took 50m36s. Earlier main-source proof took 81m57s. The difference establishes variable duration, not a diagnosed cause.
- Compiled unchanged `8c14233` passes the original CR05 desktop journey. A private probe adds only a six-second hold of the original exact review response and reproduces the same five-second tab assertion failure. Relevant test/component bytes are identical on current main `48b2abd`.
- Original quotation-specific and standalone compiled CI checks passed on the failed head. Those do not substitute for the failed primary aggregate.

## Correction and reproduction

The CR05 journey now waits for its original exact saved-review GET, checks HTTP 200, completed body and exact record identity, then retains the original rendered assertions. Desktop and mobile both exercise a six-second delay of the actual response. No mock data, response retry, assertion extension or application change is introduced.

The workflow uses native `--test-shard=1/2` and `2/2` against separate disposable PostgreSQL services; each keeps serial files, 120,000 ms test deadlines and the 90-minute job limit. Both shards are mandatory; all other lanes and local `npm run test:db` remain. [Recorded decision and alternatives](../../../decisions/ci-retained-suite-isolation.md#es-05-full-database-suite-budget).

Run the retained Sales file using `playwright.compiled.config.ts` against a completed build and an isolated `ppo_synthetic_test` database. Run each database shard with the workflow's exact native Node command. Never reset the retained ES-04/ES-05 restart evidence databases.

## Validation ledger

Local Node 24.21.0 / npm 11.19.0 / PostgreSQL 16.15 / Playwright 1.63.0 / Chrome 154.0.8037.97:

- Full retained Sales desktop/mobile file: **8/8 pass together**, including both delayed CR05 journeys and the original CR01/02/03/04 cases.
- TypeScript and ESLint for the changed test: **pass**.
- Actionlint 1.7.12: **pass** for the changed workflow (ShellCheck unavailable locally).
- Studio: **pass**, 328 entries / 174 source routes / 35 components. Its 328 unreviewed records remain visible; no acceptance fingerprint is manufactured.
- Unchanged-main original CR05: **1 pass**. Delayed original negative control: **1 expected failure**, retained separately.
- Foundation, prototype and naming: **pass**; 78 parent requirements and all 22 issued source references remain unchanged.

The compiled candidate application was built at `bec9340`; this repair changes no runtime, database or script bytes from that build. Full fresh Linux CI, including both real database shards and both complete browser lanes, remains required; focused local passes do not establish its outcome. No application, schema, seed, permission, template, issued output or dependency changes belong to this repair. Both earlier restart databases, original files and unfinished worktrees remain preserved. This work performs no merge of a PR, deployment or external business action.
