# AD-01 local team record evidence

Implementation: `ee327bca613567fe8ee213cff3a73c0e433009fd`, branch `codex/ad01-local-teams`, based on #427 at `f9c8c00213bc5279bcf0e5afdc688e770faf5108`. This is the local record/API foundation plus native inspection. Team membership and lead labels grant no authority. Native creation/editing, membership lifecycle, campaigns, D-020, owner acceptance and production readiness remain open.

## Checks

| Check | Result / scope |
|---|---|
| Access database regression | 81 passed across inspection, requests, application, withdrawal and local teams. The team suite contributes 15 reported tests, including its two parents. |
| New-team database contract | Exact 0081→0082 upgrade, one added local duty, unchanged users/grants/requests/sessions, immutable roster/audit/receipt, strict validation, current authority, hosted refusal/masking, concurrent create/replay, changed payload conflict, current recovery authority, forced audit rollback and 50-row pagination. |
| Compiled native browser | 33 existing access/role checks passed in the initial run; nine corrected team checks passed at 1440, 390 and 320 widths. Initial three selector failures remain recorded. Real HTTP creation/lost-response/reload recovery and origin/permission checks are distinct from mocked unavailable/denied presentation fixtures. |
| Build | Both runs pass, including TypeScript. The final run includes focus-preserving roster loading. |
| Unit/source/navigation | 19 selected tests pass: access roles/teams, shell navigation, department navigation and component catalogue. |
| Retained design | 107 model groups and 40 browser groups pass for the 136-key application contract; hosted set remains 31. |
| Source checks | Targeted ESLint and `git diff --check` pass. |
| Register and documents | Initial/final studio checks pass with review warnings retained. Foundation and naming checks recorded separately; these are repository assurance, not business acceptance. |
| Historical migration/seed upgrades | In progress; exact suite list and selector are in `upgrade-files.json`. Final results will be recorded before handover. |
| Existing-demo upgrade | Pending serial test database availability; no production service is invoked. |

## Reproduction

Use the repository's pinned Node/npm/Chrome and a private local environment selecting `ppo_synthetic_test` for database tests. No credential-bearing environment or connection string is stored here. Database tests run serially with a 300000 ms outer test budget; fixture-defined budgets remain in place.

- Access: `node --env-file=<private-test-env> --import tsx --test --test-concurrency=1 --test-timeout=300000 tests/database/access-local-teams.test.ts tests/database/access-application.test.ts tests/database/access-withdrawal.test.ts tests/database/access-requests.test.ts tests/database/access-inspection.test.ts`.
- Historical upgrades: the same runner with `--test-name-pattern='upgrade|fresh|combined installation|checksum|registry'` and the exact files in `upgrade-files.json`. Extra matches containing “fresh” are retained in the result rather than removed from evidence.
- Native browser: compiled local server and one-worker Playwright configuration at 1440×960, 390×844 and 320×740, `en-AU`, Chrome. Run access-inspection, access-roles and access-local-teams; the corrected rerun selects only access-local-teams.
- Retained model/browser: `node scripts/check-access-review-model.mjs` and the browser checker with only its output/repository/import paths redirected for local Windows execution. No checker assertion was changed for the environment.
- Assurance: `npm run studio:check`, `python scripts/check_foundation.py`, `python scripts/check_naming.py`, targeted ESLint, selected unit tests and `npm run build`.

## Review and limits

[Six native captures and review observations](review.md) identify the implementation commit, viewports, fixture and actual limits. Their hashes are in `captures.json`. Icon artwork was replaced with plain placeholders before capture. Existing phone title truncation, long-card scrolling and stretched grid neighbours remain visible. No accepted native Figma image, physical-device, zoom or screen-reader acceptance is claimed; review fingerprints stay pending.

[Setup and corrections](setup-and-corrections.md) explains the retained initial failures. Raw traces, session cookies, environment files and the temporary document store stay outside Git. The evidence text was screened for credential patterns without printing matched values. Issued `docs/reference/` bytes and all parent requirement IDs are preserved. No deployment or business transaction was performed.
