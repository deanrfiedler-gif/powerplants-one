# AD-01 saved-team access inspection evidence

Final application/test source: `675f11f7b39d995a5161b7b01c96ac98bf04e345` on `codex/ad01-team-access-inspection`, based on #430 `bdd6f58`, with parent #429's stable-grant-ID correction `83a6762` retained through merge `8757a00`. See the [read contract](../../../decisions/access-team-inspection-current.md). Local proof, CI, implementation observations and owner acceptance remain separate.

## Scope and results

The existing local team-detail read now returns timestamped grant-row counts for each original member. Counts reuse the catalogue's state rule and do not imply effective business access, team authority or completed review. The native roster links exact local identities to Person access and withholds masked identities' counts/links. Refresh preserves the unsubmitted creation draft; loading and failures withhold old counts. No new route, migration, seed, capability, grant or dependency.

| Check | Actual result |
| --- | --- |
| Access inspection + local teams database | 45 reported cases have passing coverage. [Initial run](logs/database.log): 43 passes / 2 failures (one new fixture and its parent); [complete team replay](logs/database-replay.log): all 17 pass after fixture correction. Counts include Node parent tests; replays are not new unique cases. |
| Compiled browser | [45 passes](logs/browser.log), 15 scenarios at 1440×960, 390×844 and 320×740; includes 12 executions of the four new inspection scenarios and existing team creation/recovery. |
| Units and component records | [19 selected units/navigation checks](logs/unit.log); [2 final component-catalogue checks](logs/components-final.log) after record updates. The latter repeat two of the 19. |
| Build and lint | [Final production build](logs/build-final.log) includes TypeScript/static generation; [targeted ESLint](logs/lint-final.log) exits 0 with no diagnostics. The build started at `8e387f1`; `675f11f` changes only the delayed-response test, with identical runtime source. |
| Documentation | [Corrected studio](logs/studio-corrected.log), [naming](logs/naming.log), [foundation](logs/foundation.log). Final evidence/register follow-up results are recorded in [checks.json](checks.json). No acceptance fingerprint is assigned. |
| Captures | [Six viewport observations](review.md), [source/viewport/hash manifest](captures.json); no document-wide horizontal overflow detected. |
| Cleanup | [Owned local services stopped](cleanup.json); private synthetic stores preserved. |

## Initial failures and corrections

The first PostgreSQL restart omitted the prior explicit loopback/port options and could not bind the default listener. Restarting the preserved synthetic store with its recorded loopback/55494 options succeeded; no store was recreated or schema modified for startup. An early readiness probe preceded application listening; browser checks began only after the compiled server reported readiness.

The first new SQL fixture tried a hosted issuer before the existing hosted-boundary fixture had applied `db/demo/0001-identity.sql`; the live local issuer constraint correctly refused it. The new count test now uses local fixtures, while the existing hosted-boundary case additionally asserts withheld counts. The full team file passes on replay. No application constraint was relaxed. The initial failure remains in the log.

The first studio check rejected two host dependencies entered in the implementation-export array. They were moved to dependencies, with the actual ButtonLink export declared as a symbol/path binding. The [initial errors](logs/studio.log), corrected check and final catalogue tests remain retained. Owner review fields remain unchanged.

An initial build passed before keeping the refresh control mounted during loading; a new final build verifies that refinement. The delayed-response test now waits for the old response and rendering opportunity before asserting it cannot overwrite the selected team. No application failure is inferred from these test/record corrections.

## Reproduction and limits

Use private environment files and PostgreSQL 16.15. Node 24.21.0 / npm 11.19.0; Chrome 155.0.8059.40 on Windows, en-AU, one Playwright worker. Database commands use Node `--env-file`, `--import tsx`, `--test --test-concurrency=1 --test-timeout=120000` with `tests/database/access-inspection.test.ts` and `tests/database/access-local-teams.test.ts`; only `ppo_synthetic_test` is permitted. Replay the entire local-team file after fixture setup changes. The application uses the separate `ppo_synthetic` store on loopback 3094; preserved PostgreSQL listens on 55494.

Browser files: `access-local-teams.spec.ts`, `access-team-access.spec.ts`, `access-team-creation.spec.ts`, against the completed compiled application at the three widths above. Selected units: `access-roles`, `access-teams`, `component-catalogue`, `department-navigation`, `shell-navigation`. Run `npm run build`, targeted ESLint on the three changed source/two test files, `npm run studio:check`, `python scripts/check_foundation.py`, `python scripts/check_naming.py`, and `git diff --check`.

Database checks exercise actual row/state/authority isolation and unchanged audit/receipt snapshots. Browser failure/identity-limit fixtures deliberately inject response boundaries; their screenshots are presentation evidence, not additional database outcomes. Current membership remains the original immutable roster, with current identity/grant observations separated from its creation audit. Campaigns, attestations, membership lifecycle, review routing, operational D-020, owner visual/security acceptance, physical devices, zoom and assistive technology remain open. No deployment or business transaction.

Published logs replace local absolute paths with placeholders and remove ANSI formatting/trailing whitespace, using UTF-8 LF. Empty lint logs represent successful commands with no diagnostics. Environment files, credentials, database stores and raw traces remain outside Git. [checks.json](checks.json) pins exact Git blob source hashes and retained artifact hashes.
