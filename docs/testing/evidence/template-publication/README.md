# DK-06 template publication evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic backend verification; final compiled checks in progress. Independent review, owner acceptance, native page and deployment remain separate.

Source baseline is R2 commit 96896d184cf9ae205bf00071ec1e85d951662e12, dependent on PR #472. The [decision](../../../decisions/template-publication-backend.md) selects OUT-09 only and [contract](../../../contracts/template-publication.md) separates publication from R4 assignment. [Source fingerprints and results](execution.json) retain the verified boundaries.

## Completed checks

- Initial focused run: seven cases pass (five publication database cases, populated 0092 upgrade and one support/legacy unit case).
- Combined R1/R2/R3 database run: 16/16 pass. The additional native managed-template reservation/worker proof also passes, making 17 database scenarios across these suites. Real Pack, Report and Finance records remain intact; a queued legacy pack completes, while later edits leave issued PDF bytes unchanged.
- Populated 0092 upgrade: exact old proposals, reviews, output reservations, grants, users, seeds and migration ledger survive; only 0093 is added and repeat application is inert.
- Reserved Products 0052 installation from 0025, 0092 and 0093: all three pass. The 0025 case crosses pending identity events at 0026.
- Hosted-demo upgrade suite: all six pass against the private synthetic test database. No hosted execution or publisher grant is implied.
- Actual PostgreSQL and separate-process restart: exact publication row and actor-private original receipt reopen unchanged; evidence hash is retained in execution.json.
- Full unit suite: 795/798 pass; zero cancelled/skipped. Three unchanged Windows filesystem cases fail: two document-store cases and the recovery directory error-message assertion. [R1 baseline proof](../template-catalogue/README.md) reproduced these on untouched main a333604; the relevant source/test files still have no diff from that baseline.
- TypeScript and changed-source ESLint pass. AD-01 model: 107 groups pass with 149 capabilities. Studio: 362 entries, 46 components and 208 routes; zero integrity errors. Its 334 unreviewed and 28 stale entries remain visible. UI sequence, foundation, prototype and naming checks pass, retaining 78 parent IDs and 7997 instruction characters.

## Limits and pending checks

The AD-01 browser run fails at its first full-page screenshot with Page.captureScreenshot: Unable to capture screenshot on local Chrome 155.0.8059.40; zero completed groups. [R2](../template-drafts/README.md) reproduced this using exact unchanged-main HTML/script. No local browser pass or visual acceptance is claimed.

An initial build was deliberately stopped during compilation under local resource pressure to sequence checks and complete the catalogue evidence link. Final full build and compiled HTTP verification are pending. CI, independent review and owner acceptance are separate.

The native worker proof uses an explicit SQL policy fixture solely to exercise the supported renderer. No R4 assignment command exists, and the publication isolation proof confirms publication itself does not move policy pointers. Existing shared renderer and R2 migration bytes are unchanged. All data is synthetic ppo_synthetic_test on PostgreSQL 16.15 and Node 24.21.0; private configuration/output logs remain outside Git.
