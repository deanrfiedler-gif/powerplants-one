# Templates native completion evidence

Date: 1 November 2026 (Australia/Brisbane). Implementer: Codex. PR #704, DK-06. Source: `e9b8e613ab400df19f3e0305e042166376c5f63f`, including main `c69a0922`. Application source and dependencies are byte-identical to the completed build at `dbff42b3`; subsequent changes are documentation and tests. This record closes the outstanding native reruns in the [earlier correction evidence](../review-corrections/README.md), without rewriting those failed attempts.

| Canonical check | Result and retained output |
|---|---|
| Native proposal-duty paging, cursor purpose/family/company binding and revocation | [1 passed](scope.tap) |
| Populated 0090 proposal upgrade and inert reapplication | [1 passed](drafts-upgrade.tap) |
| Populated 0092 publication upgrade and inert reapplication | [1 passed](publication-upgrade.tap) |
| Populated 0093 site-use upgrade and future baseline preservation | [1 passed](use-upgrade.tap) |
| Compiled native scope/publication/use reads and authority loss | [1 passed](http.tap) |
| Real browser proposal, independent review, exact publication and site assignment | [1 passed](browser.txt) |

The native paging test uses three real sites and a one-row page to exercise filtering before pagination, continuation, cursor isolation and revocation. The previous 55-site fixture exceeded its setup timeout while executing native timezone checks; the smaller fixture retains every authority assertion. The separate 51-choice/320 px browser regression remains unchanged and passed in the earlier correction run. A diagnostic first reused the successfully seeded database; the canonical result above subsequently passed its own full reset and seed.

The browser setup hook has a separate 900-second ceiling for full schema/seed setup, matching the native rerun runner. Its workflow remains bounded at 180 seconds. Application connection, statement, command, authority and recovery limits are unchanged. All database tests use only `ppo_synthetic_test` on dedicated loopback port 55474; the compiled app uses 3474. Runs were serial and coordinated with Document library.

The [new native 320 px capture](native-published-proposal-320.png) was inspected against the retained phone composition: the proposal has its exact revision, review, publication version, stacked facts and no horizontal overflow. This is implementer inspection, not independent visual acceptance.

Additional checks passed: 14 development-register units and Studio after integrating current main; focused lint for both changed native test files; status and documentation scope. The earlier final foundation and naming scans completed successfully (15,151 local links, no errors). The completed application build/TypeScript, 11 template units, 13 fixture browser cases and shared-shell comparison remain valid for the unchanged application source. Full repository lint/unit completion and manual screen-reader review are not claimed.

The three prior Claude findings are fixed or answered in the PR. Ready for review requests current-head review and full CI; it does not assert that either has passed. Owner workflow acceptance, independent composition review, merge and deployment remain separate. No migration, seed, capability, grant, renderer source or dependency was changed by these corrections.

[Execution manifest](execution.json) binds the retained logs and capture to their hashes. Native commands use `node --env-file=.env.local --import tsx --test --test-isolation=none --test-reporter=tap --test-timeout=900000` followed by each corresponding database or HTTP test path. Browser command: `node --env-file=.env.local node_modules/@playwright/test/cli.js test --config playwright.templates.config.ts tests/browser-native/templates-native.spec.ts`.
