# AD-01 local team record evidence

Validated application source: `039df64103f09d804507ff226f4a35e3e11d7a4a` (initial implementation `ee327bc`), branch `codex/ad01-local-teams`, based on #427 at `f9c8c00213bc5279bcf0e5afdc688e770faf5108`. This is the local record/API foundation plus native inspection. Team membership and lead labels grant no authority. Native creation/editing, membership lifecycle, campaigns, D-020, owner acceptance and production readiness remain open.

## Checks

| Check | Result / scope |
|---|---|
| Access database regression | 81 passed across inspection, requests, application, withdrawal and local teams. The team suite contributes 15 reported tests, including its two parents. |
| New-team database contract | Exact 0081→0082 upgrade, one added local duty, unchanged users/grants/requests/sessions, immutable roster/audit/receipt, strict validation, current authority, hosted refusal/masking, concurrent create/replay, changed payload conflict, current recovery authority, forced audit rollback and 50-row pagination. |
| Compiled native browser | 45 unique checks pass: 15 inspection checks in the initial run and 30 role/team checks on the final source at 1440, 390 and 320 widths. The final set includes the three current-identity freshness cases; the initial three selector failures and corrected nine-case rerun remain recorded. Real HTTP creation/lost-response/reload recovery and origin/permission checks are distinct from mocked unavailable/denied presentation fixtures. |
| Build | All three runs pass, including TypeScript. The final run includes focus-preserving roster loading and refreshed lead/creator labels. |
| Unit/source/navigation | 19 selected tests pass: access roles/teams, shell navigation, department navigation and component catalogue. |
| Retained design | 107 model groups and 40 browser groups pass for the 136-key application contract; hosted set remains 31. |
| Source checks | Targeted ESLint and `git diff --check` pass. |
| Register and documents | Studio, foundation and naming checks pass with visual-review warnings retained; these are repository assurance, not business acceptance. |
| Historical migration/seed upgrades | 68 unique selected cases have passing evidence: 48 initial passes, four successful isolated failure replays and 16 continuation cases. The 52-result initial run was deliberately interrupted; exact selectors and case-by-case evidence are in `upgrade-files.json` and `historical-coverage.json`. |
| Parent CI regression | PR #423 mobile job exposed a test URL-capture race. The exact saved-request URL is now awaited; nine replays pass (three at each width) with the original 45-second budget. See [diagnosis](parent-mobile-regression.md). |
| Existing-demo upgrade | Five checks pass locally, including dry-run preservation, exact tester users/grants, repeat upgrade, checksum refusal and atomic rollback. No production service is invoked. |

## Reproduction

Use the repository's pinned Node/npm/Chrome and a private local environment selecting `ppo_synthetic_test` for database tests. No credential-bearing environment or connection string is stored here. Database tests run serially with a 300000 ms outer test budget; fixture-defined budgets remain in place.

- Access: `node --env-file=<private-test-env> --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/access-local-teams.test.ts tests/database/access-application.test.ts tests/database/access-withdrawal.test.ts tests/database/access-requests.test.ts tests/database/access-inspection.test.ts`.
- Historical upgrades: the initial runner used `--test-name-pattern='upgrade|fresh|combined installation|checksum|registry'`. After 52 reported results it was interrupted because “fresh” also selected unrelated behavior scenarios. The exact remaining selectors/files and independent database assignments are in `upgrade-files.json`. All completed initial results remain recorded; `historical-coverage.json` maps every selected case to passing evidence.
- Native browser: compiled local server and one-worker Playwright configuration at 1440×960, 390×844 and 320×740, `en-AU`, Chrome. Run access-inspection, access-roles and access-local-teams; the first corrected rerun selects only access-local-teams; the final source run selects access-roles and access-local-teams (30 checks).
- Retained model/browser: `node scripts/check-access-review-model.mjs` and the browser checker with only its output/repository/import paths redirected for local Windows execution. No checker assertion was changed for the environment.
- Assurance: `npm run studio:check`, `python scripts/check_foundation.py`, `python scripts/check_naming.py`, targeted ESLint, selected unit tests and `npm run build`.

## Review and limits

[Six native captures and review observations](review.md) identify the implementation commit, viewports, fixture and actual limits. Their hashes are in `captures.json`. Icon artwork was replaced with plain placeholders before capture. Existing phone title truncation, long-card scrolling and stretched grid neighbours remain visible. No accepted native Figma image, physical-device, zoom or screen-reader acceptance is claimed; review fingerprints stay pending.

[Setup and corrections](setup-and-corrections.md) explains the retained initial failures. Raw traces, session cookies, environment files and the temporary document store stay outside Git. The evidence text was screened for credential patterns without printing matched values. Issued `docs/reference/` bytes and all parent requirement IDs are preserved. No deployment or business transaction was performed.

[Draft PR #429](https://github.com/deanrfiedler-gif/powerplants-one/pull/429) carries the implementation and the parent browser-test correction. The application/capture source remains `039df64`; the additional test-file fingerprint is in `checks.json`. The original parent mobile failure remains a failed historical CI run, and final-head CI is separate from these local passes. Native creation/editing, campaigns, D-020, owner acceptance and production readiness remain open.

Handover on 12 October 2026: the temporary compiled application and both owned PostgreSQL instances are stopped; ports 3092, 55492 and 55487 have no listeners. Private configuration/data remain outside Git. See `cleanup.json`.
