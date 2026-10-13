# DK-06 template catalogue execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Source: `codex/template-catalogue-backend`, based on main `a333604`. Scope: [DK-06 R1](../../../decisions/template-catalogue-backend.md). Synthetic verification, independent review, owner acceptance and deployment are separate.

The local proof uses an isolated loopback PostgreSQL 16.15 cluster with only `ppo_synthetic_test`, Node 24.21.0 and npm 11.19.0. Connection configuration and private generated files remain outside the repository. No shared application/test database is reset. [Execution summary](execution.json) records tested source hashes and outcomes.

| Check | Actual result |
|---|---|
| Six database scenarios | Pass: exact retained/current definitions across three families, permission and company/workspace boundaries, signed paging, revoked grants, unsupported/changed definitions, protected crew drafts, native pack/report/Finance reservation and issue lineage. |
| Read-only proof | Pass: every row of every `ppo` business table (sessions excluded) compared before/after repeated catalogue and usage reads. Original template/consumer hashes and native states retained. A new application database pool reopens the same Finance issue. |
| Compiled HTTP journey | Pass: list, exact detail, usage, current family permissions, signed continuation, crew draft protection, strict queries and 405 on POST to all three endpoints. |
| Focused unit checks | Both pass: dependency manifest evidence and strict query validation. |
| Full local unit suite | 792/795 pass. The three failures reproduce on untouched main `a333604` in an isolated baseline checkout: two `document-store.test.ts` private-path cases and one `recovery.test.ts` Windows path case. The four-test baseline subset is 1 pass / 3 fail. No assertion or runtime policy was relaxed. |
| TypeScript and changed-source ESLint | Pass. |
| Full compiled build | Pass; all three new API routes are compiled. |
| Studio register | Pass: 362 entries, 46 components, 208 source routes, no integrity errors. 334 unreviewed and 28 stale reviews remain explicit. |
| Foundation / prototype / naming | Pass: 78 parent requirements retained; 9,430 links and 5,925 files checked; 606 document records and unchanged 7,999-character project instructions. Documentation assurance is not business acceptance. |

The existing Document Library backend workflow now runs the new database and compiled HTTP scenarios. Final-head Linux CI and independent review are separate from these local outcomes. There is no page or shared-control change, so no new browser/visual acceptance is claimed. A database-pool reconnect was tested; no new actual PostgreSQL restart claim is made by that check. Template writers, definitions, renderer sources, policies, seeds, capabilities and original outputs are unchanged.

## Retained corrections and limits

Initial authoring checks caught a missing closing brace before database execution. The first database run passed four cases and reached native Finance issue successfully, but two test expectations used the wrong existing error/result shapes (`NotFound` versus `RecordUnavailable`, and a `state` field versus the returned `issue_id`). The expectations were corrected against the native contract; the complete rerun passed all six scenarios at the unchanged 120-second deadline. The initial shared dependency folder lacked the already-adopted `yauzl` package, so a clean `npm ci` installed the exact existing lockfile in this worktree; TypeScript then passed. No dependency file changed.

Owner acceptance, the native DK-06 page, managed proposals, review/publication/use assignment and deployment remain open. R1 reads do not grant operational template approval or issue authority.
