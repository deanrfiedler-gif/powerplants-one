# DK-06 template publication evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic backend verification completed 14 October 2026. Independent review, owner acceptance, native page and deployment remain separate.

Source baseline is R2 commit 96896d184cf9ae205bf00071ec1e85d951662e12, dependent on PR #472. The [decision](../../../decisions/template-publication-backend.md) selects OUT-09 only and [contract](../../../contracts/template-publication.md) separates publication from R4 assignment. [Source fingerprints and results](execution.json) retain the verified boundaries.

## Completed checks

- Initial focused run: seven cases pass (five publication database cases, populated 0092 upgrade and one support/legacy unit case).
- Combined R1/R2/R3 database run: 16/16 pass. The additional native managed-template reservation/worker proof also passes, making 17 database scenarios across these suites. Real Pack, Report and Finance records remain intact; a queued legacy pack completes, while later edits leave issued PDF bytes unchanged.
- After the final copied-base authority guard, all 11 R2/R3 database cases pass again, including actual PDF generation and native managed-definition reservation/worker recovery.
- Populated 0092 upgrade: exact old proposals, reviews, output reservations, grants, users, seeds and migration ledger survive; only 0093 is added and repeat application is inert.
- Reserved Products 0052 installation from 0025, 0092 and 0093: all three pass. The 0025 case crosses pending identity events at 0026.
- Hosted-demo upgrade suite: all six pass against the private synthetic test database. No hosted execution or publisher grant is implied.
- Final full application build passes. The broad compiled HTTP run passes 101/101; after the copied-base authority correction, all six focused library/catalogue/draft/publication API cases pass against the rebuilt application. The new case checks cross-site reads, history, list filtering, original receipt access and exact replay after authority restoration.
- Actual PostgreSQL and separate-process restart: exact publication row and actor-private original receipt reopen unchanged; evidence hash is retained in execution.json.
- Full unit suite: 795/798 pass; zero cancelled/skipped. Three unchanged Windows filesystem cases fail: two document-store cases and the recovery directory error-message assertion. [R1 baseline proof](../template-catalogue/README.md) reproduced these on untouched main a333604; the relevant source/test files still have no diff from that baseline.
- TypeScript and changed-source ESLint pass. AD-01 model: 107 groups pass with 149 capabilities. Studio: 362 entries, 46 components and 208 routes; zero integrity errors. Its 334 unreviewed and 28 stale entries remain visible. UI sequence, foundation, prototype and naming checks pass, retaining 78 parent IDs and 7997 instruction characters.

## Limits and pending checks

The AD-01 browser run fails at its first full-page screenshot with Page.captureScreenshot: Unable to capture screenshot on local Chrome 155.0.8059.40; zero completed groups. [R2](../template-drafts/README.md) reproduced this using exact unchanged-main HTML/script. No local browser pass or visual acceptance is claimed.

An initial build was deliberately stopped during compilation under local resource pressure to sequence checks and complete the catalogue evidence link. Subsequent full builds pass, including the final runtime source. CI, independent review and owner acceptance are separate; the earlier [focused CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38402305906/job/115312752569) passed at 848e227, before the final copied-base guard, and does not certify the final head.

The native worker proof uses an explicit SQL policy fixture solely to exercise the supported renderer. No R4 assignment command exists, and the publication isolation proof confirms publication itself does not move policy pointers. Existing shared renderer and R2 migration bytes are unchanged. All data is synthetic ppo_synthetic_test on PostgreSQL 16.15 and Node 24.21.0; private configuration/output logs remain outside Git.

## Shared HTTP fixture correction

R2 Application assurance job [115287652571](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38394942020/job/115287652571) ran the HTTP files concurrently against one database. Its catalogue reset failed because ppo.seed_receipts disappeared while other fixtures also reset the schema, followed by unrelated receiver failures. The test:http script now uses test-concurrency=1, matching the database suite. Assertions and request deadlines are unchanged.

Legacy HTTP fixtures now honour the configured PPO_TEST_ORIGIN/PPO_PORT (retaining port 3000 as default); the specialist child fixture inherits the loaded environment. The P06/P07 restart fixture path accepts PPO_RESTART_PROOF_DIR while preserving the CI /tmp default. Two local HTTP attempts were stopped after finding hard-coded origins in fixtures/helpers; the corrected complete compiled run passes 101/101, with zero failures, skipped or cancelled tests. This run preceded the final copied-base authority guard; focused compiled template checks verify that guard separately.
