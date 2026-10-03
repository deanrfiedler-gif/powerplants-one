# ES-06 execution evidence

<!-- versioning: git; committed history is authoritative -->

Reviewable [PR #341](https://github.com/deanrfiedler-gif/powerplants-one/pull/341). Final-head CI and merge/deployment status are read from that PR; this ledger records completed local proof.

Owner: Dean Fiedler. Baseline `ab4acd687f6a4911ebc5f3f1bd8f09d5ff1e1547`. Task-owned Windows / Node 24.21.0 / npm 11.19.0 / PostgreSQL 16.15; exact retained issued references are unchanged. Private configuration, database files, logs and original output checkpoints remain outside Git.

Executed 3–4 October 2026. Baseline was fetched again before publication and remains unchanged. Local proof uses two new isolated clusters on ports 56560/56561; both databases are named `ppo_synthetic_test`. Earlier proof databases and Excel import work are retained. Runtime compiled from `aa20dae`; subsequent edits extend test/evidence coverage, correct a migration-ledger expectation and tighten the new migration’s nullable JSON attribution checks. [Source and capture hashes](manifest.json) identify the exact working files. Final PR-head CI is recorded on the pull request; pending/running jobs are not passes.

## Completed local checks

| Proof | Observed result |
| --- | --- |
| ES-06 PostgreSQL | 10/10: permitted/refused reports, immutable corrections, exact replay/content conflict, simultaneous submissions, superseded/material holds, scoped permission revocation, lost storage recovery, direct SQL/deferred guards and populated 0059 upgrade |
| Prior ES-04 / ES-05 PostgreSQL | 6/6 and 10/10; original reviews, controlled issue, distribution and retained outputs |
| Compiled HTTP | 7/7 across ES-04/05/06 and retained E1/DR01/E2 routes |
| Combined compiled desktop/mobile | 19/19 including warm-up: ES-04/05/06 journeys and recovery |
| Final-source response + shared catalogue desktop/mobile | 15/15 including warm-up; original recovery, uncertain outcome, exact retry, stale concurrent evidence, correction, material hold and all shared catalogue states |
| Populated upgrade sweep | Initially 18/19; one exact ledger expectation repaired. The complete affected policy-persistence suite then passed 11/11, preserving every baseline row/hash and exact additions. Other passed cases cover FI01/FI07, P05–P11, Leads, E1 and DR01 |
| Hosted demo upgrade | 5/5, including repeat upgrade and complete rollback after a late privilege failure |
| Actual application and PostgreSQL restart | Passed: unchanged estimate/version/review/quote/job/attempt/release/response/audit/outbox/receipt snapshots, seven original receipt reads and exact command replays, four original Draft/issued HTML/PDF files byte-for-byte; superseded reported acceptance and held prior preparation retained |
| Full unit suite | 574/577; three Windows private-path failures also reproduced on unchanged `ab4acd6` (P06 adapter/source and P12 recovery). Focused related unit/registry/launcher/CLI checks: 22/22 |
| Build/static assurance | Compiled build, lint, TypeScript, actionlint, foundation, prototype, naming and studio pass. Studio: 329 entries, 175 routes, 36 components, 19 runnable examples; reviews remain pending |

The independent information-only answer/confirmation follow-up passed 3/3 (warm-up plus desktop/mobile): an answer alone retains the hold, reported confirmation resolves the question, and a separate exact acceptance enables preparation. Final CI results are recorded in the PR. Browser uses pinned Chrome 154.0.8037.97 / Playwright 1.63.0. Local original logs/checkpoints are retained under the private task directory `quotation-response-20261003`; no credentials or connection strings are committed.

## Failed-run ledger and repairs

- Initial ES-06 database run: 6/8; new tests expected incorrect existing error codes. Corrected expectations to `InvalidData` / `RecordUnavailable`. Next broader run exposed a test fixture's nonexistent people column; replaced it with the actual relationship validity field. Completed 8/8, then expanded suite 10/10.
- Initial type check identified SelectField option shape and helper typing mistakes; corrected to existing contracts.
- A temporary dependency junction outside the checkout was refused by Turbopack. Preserving it inside the checkout also caused a TypeScript memory failure and foundation scan noise. Moved the preserved link outside the repository and installed the locked dependencies in this worktree. No tool limits or assertions changed.
- First broad unit run under that setup/load: 571/577, with two operator CLI deadline failures, the three Windows path failures and a launcher deadline failure. Unchanged main: 570/575, reproducing the two CLI and three path failures, but not the launcher deadline. After the setup correction, full contribution run: 574/577 (only the same three path failures). The initial launcher observation is retained, not labelled a demonstrated baseline defect.
- Populated policy upgrade initially compared a seven-entry suffix after eight additions. Updated only that suffix to eight and the label to 0060; full suite passed 11/11. Original-row comparison, exact added versions, seed/grant expectations and deadlines remain intact.
- Final schema review tightened the new report constraint so JSON null/non-string attribution and non-text conditions cannot pass SQL CHECK null semantics. Direct-insert regression proof names the exact immediate report constraint, separately from the deferred receipt guard. Its first run caught a missing test import; the import was corrected and the complete hardened-schema suite passed 10/10 (107.8 seconds), with TypeScript and focused lint passing.
- A local restart verification was attempted before the new application listener became ready and received connection refusal. After confirming the same new process was listening, verification passed against the unchanged retained checkpoint. No data was recreated or substituted.

## Visual evidence and limits

[Desktop capture](desktop.png) and [320 px capture](mobile-320.png) are original unedited final-source browser captures. Agent inspection found readable exact-offer details, wrapping hashes, accessible visible action labels and no horizontal overflow in the tested narrow state. The application owns an internal scroll region, so these captures do not imply review of every offscreen panel. They are execution evidence, not an accepted native reference or owner visual approval. Paired-reference, physical-device, screen-reader, broader zoom and independent owner acceptance remain open. No review fingerprints are promoted.

Expiry/withdrawal, respondent authority, signing and operative commercial policy remain visibly Not configured. One exact estimate option only; no partial acceptance or option combination. ES-07 receiving/item resolution/conversion remains unimplemented.

No passing retries or extended deadlines are introduced. Both database CI shards remain mandatory. This contribution does not merge, deploy, connect external systems, send business messages or execute transactions.
