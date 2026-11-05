# Templates review-correction evidence

Subsequent [native completion evidence](../native-completion/README.md) records successful canonical reruns and closes the execution limits below. This earlier record remains source-bound to its original attempts.

Date: 1 November 2026. Implementer: Codex. Scope: DK-06, PR #704. Application source: `dbff42b3b8b66a3c018a9f4365818996af13c9ad`, including main `26deea85d000878ca8df2c1b7a91e1ffdedd68f6`. Later changes in this pass affect test fixtures, documentation and evidence only. The [31 October evidence](../README.md) and its capture hashes remain unchanged.

The correction filters native scope choices by `purpose=Propose` before paging and binds signed cursors to that purpose. Register and definition authoring controls require confirmed proposal duty; continuation alone grants nothing. The existing proposal panel retains Load more. Commands still make their own scope, duty, revision, review and fingerprint checks. Catalogue and proposals cover OUT-09, OUT-10 and OUT-14; publication and site assignment remain OUT-09 only.

## Executed checks

| Check | Result |
|---|---|
| Production build and TypeScript | Passed on the application source above; Node heap capped at 3 GB |
| Focused template units | 11 passed, including exact definitions, renderer invalidation and literal rendering |
| Compiled fixture browser suite | 13 passed, including 51-site paging at 320 px, read-only authoring visibility, recovery, successors and actual Chrome 200% zoom |
| Ordinary compiled-browser discovery | Passed: 1,357 tests in 143 files; the reset-enabled Templates journey is isolated under `tests/browser-native/` |
| Studio register | Passed again after integrating main's Sites focus fix |
| Foundation, naming, status and documentation scope | Passed; documentation assurance only |
| Focused application/test lint | Passed, including the follow-up database fixture and shared shell test |
| Shared shell fixture | Passed after correcting the expected count to exclude hosted-unavailable destinations; Templates href remains explicit |

The inspected desktop Definitions and 320 px Site use captures retain the accepted family selection, separate document navigation and phone stacking. Current phone-header amendments govern the shell. Synthetic row counts, actor names, baseline versus assigned state, and exact current version/fingerprint values differ deliberately from design samples. The 320 px proposal panel keeps its fixed header/footer and scrolling fields without horizontal overflow. These implementer comparisons do not grant independent visual or owner acceptance.

## Native execution limit

The latest new scope regression did not reach its assertions: repository reset failed in `scripts/database.ts` seeding with PostgreSQL `57014` (statement timeout). Those reset, seed-registry and database-connection sources are unchanged from integrated main. A separate connection probe through the unchanged database configuration reproduced the three-second connection timeout on this loaded host. This is not a completed unmodified-main suite comparison and is not sufficient to attribute every timeout to the host.

Earlier attempts included a connection timeout, a publication-upgrade test timeout, and an interrupted serial run. Another scope attempt completed reset but timed out while inserting fixture sites. The final fixture batches 55 sites in one setup transaction, lets native identity allocation supply display numbers, includes the required site grant key, and grants that fixture transaction 120 seconds. Application connection and statement limits remain unchanged. The final retry then failed during reset, before that fixture transaction.

The pre-0093 publication-upgrade fixture now uses the historical native proposal context to record its exact review. It no longer asks the new presentation projection for a publication table that did not exist at 0092. This is a test-fixture correction, not a runtime fallback. A successful rerun of this upgrade and the new native scope regression remains required; neither is reported as passed here. The revised HTTP scope assertion and native browser journey were not rerun in this pass. Earlier completed native evidence remains source-bound to 31 October.

Only the dedicated loopback database `ppo_synthetic_test` on port 55474 and compiled app on 3474 were used. Native attempts were sequenced with the Document library owner, whose database and app remain separate. No migrations, seeds, capabilities, stored review fingerprints, renderer sources or dependencies changed. GitHub checks were still queued when inspected during this pass.

## Review boundaries

Independent current-head review, composition review, owner workflow acceptance, merge and deployment are separate and pending. No manual screen-reader audit or full repository unit/lint completion is claimed. The first `npm run check` passed Studio but did not complete its subsequent chain; focused checks are listed explicitly instead.

[Execution manifest](execution.json) binds the commands, results and three inspected capture hashes. Capture files are [desktop Definitions](definitions-1440.png), [320 px Site use](site-use-320.png) and [320 px proposal fields](proposal-paging-320.png). The last captures the scrolling panel after the test selected site 51 and checked its continuation; the automated assertions, rather than that viewport image, prove paging.
