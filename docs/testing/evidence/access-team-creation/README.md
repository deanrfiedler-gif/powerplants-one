# AD-01 native team creation evidence

Final application source: `999042e8926076beb12ca04f8fdf2cfa3496a6e6`. Integrated backend baseline: `9234248951e8896392b06b09c43a71e2519abcdf`; the stable-ID expectation repair is `44fbb7f`. Branch: `codex/ad01-team-creation`; [draft PR #430](https://github.com/deanrfiedler-gif/powerplants-one/pull/430), stacked on #429. See the [contract](../../../decisions/access-team-creation.md). Local proof, CI, visual observations and owner acceptance are separate.

## Scope and parent changes

The form exposes the existing immutable initial-roster API with explicit lead/member choices and the shared actor/workspace/tab recovery journal. Read-only context adds no authority. No new capability, migration, seed, membership lifecycle or review-routing policy.

Initial base #429 `a42bf5c` had a shared Systems-duty expectation failure. Repair `2968125` adds only the exact team duty to the permitted administration list, retaining all business-denial and original-grant checks; 48 real HTTP checks pass. That repair was pushed to #429.

During validation, another repository session advanced #429 to `c3a0ca6`, integrating main's Projects 0081 and placing withdrawal/team migrations at 0082/0083. This branch merges that parent. The earlier private database is stopped and preserved; final checks use a fresh synthetic instance. No in-place conversion of the old draft checksums is claimed. This PR's migration/seed files match its updated parent exactly.

## Execution

The integrated run reported 73 database cases: 69 initial passes and four failures (including the failed application parent). All cases have passing coverage after the complete 15-case application replay and the unchanged one-case Projects upgrade replay. The initial failures remain retained. Earlier-parent runs passed 44 access database and 19 selected unit/navigation checks. Final integrated units also pass all 19 checks. Build/types/lint, studio, foundation and naming pass. All 51 integrated browser checks pass; the 21 creation checks pass again against the final build after the selected-ID visual refinement. These are 51 unique browser cases, not 72 different cases.

## Corrections retained

- Parent #429 CI: the Systems administration allowlist omitted the new team-creation duty. The exact list was corrected, without changing Service/Finance refusals.
- Parent integration: access-application's expected team grant ID was incorrectly renumbered to `ad010083…`; the unchanged seed retains `ad010082…`. Commit `44fbb7f` restores that exact stable ID. The failed setup left only three Applied fixtures for the later four-fixture assertion; rerun the complete application suite after correction. No grant, seed, UUID or production rule is changed.
- Initial assurance overlapped the parent integration and reported a copy-ready instruction length of 8184. The compact guidance then omitted the literal docs/STATUS.md path, caught locally and by CI. It is restored in ad9c9c0; the corrected naming check passes at 7952 characters. Meaningful constraints and parent design directions are retained.
- The first build completed successfully while implementation refinements were still in progress. Final browser verification uses a new build after the parent merge and final application edits.

## Reproduction and boundaries

Use private environment files, PostgreSQL 16 and the repository's pinned Node/npm/Chrome. Database checks require `ppo_synthetic_test`; browser fixtures use a separate synthetic application database. Run suites serially within each database. The browser configuration uses one worker at 1440×960, 390×844 and 320×740, Chrome and en-AU. Credential-bearing configuration, raw traces, sessions and stores remain outside Git.

Native/physical-device, zoom, screen-reader, security/owner acceptance, membership editing, campaigns and D-020 remain open. Captures are implementation observations with icon artwork replaced in the DOM before capture, not accepted Figma designs. No deployment, production integration or business transaction.

The integrated Projects upgrade initially timed out in its schema-reset statement (57014, before migrations). Its unchanged isolated replay passes with the original timeout. This is recorded as a transient test failure, not proof of a migration regression or a general performance claim.

Initial native captures are retained in initial-captures/. Inspection found the closed lead select clipped its UUID on phones. The final form adds the full selected ID as wrapped text; no shared control or style changes.


## Final proof ledger

| Check | Result and evidence |
| --- | --- |
| Five integrated database files | 73 reported cases covered by passing runs: [initial 69 passes / 4 failures](logs/access-database-final.log), [complete application replay: 15 passes](logs/application-replay.log), [unchanged Projects upgrade replay: 1 pass](logs/baseline-upgrade-replay.log). Counts include the Node test parent. |
| Shared HTTP permissions | [48 passes](logs/permissions-matrix-final.log), real loopback HTTP and database checks. |
| Browser roles, saved teams and creation | [51 passes](logs/browser.log), three widths; [21 final creation rechecks](logs/browser-final.log) after the selected-ID fix. |
| Selected units/navigation/components | [19 passes](logs/units-final.log). |
| Final production compilation | [Passed](logs/build-visual-fix.log), including TypeScript and static generation. |
| TypeScript / targeted ESLint | [Explicit typecheck passed](logs/typecheck.log); [final ESLint invocation produced no diagnostics](logs/lint-visual-fix.log), exit 0. |
| Design/document assurance | Studio, foundation and naming pass; final handover logs and exact source hashes are recorded in [checks.json](checks.json). Review warnings remain visible. |
| Visual observations | [12 final viewport captures and 12 initial captures](review.md); [hash manifest](captures.json). No document-wide horizontal overflow detected. |
| Local cleanup | [Owned application and PostgreSQL services stopped](cleanup.json); private databases preserved. |

The 51-case browser run used the integrated application before the final selected-lead-ID paragraph; the unchanged roles/team-inspection tests retain that scope. The final 21-case replay and 12 final captures use application source `999042e8926076beb12ca04f8fdf2cfa3496a6e6`. Later commits contain evidence and documentation only. Browser boundary failures (lost response, storage refusal, denial and unavailable reads) are deliberately injected; database/HTTP authority proofs are separate. The final source adds no database migration or grant.

Reproduce the database run with Node's test runner, private `--env-file`, `--import tsx`, `--test --test-concurrency=1 --test-timeout=120000` and the five files `access-application`, `access-inspection`, `access-local-teams`, `access-withdrawal` and `project-baselines` under `tests/database/*.test.ts`. Replay the entire application file after its fixture setup failure; the Projects replay selects the `populated 0077 upgrade` case unchanged. Run `tests/helpers/permissions-matrix-http.ts` with the same private test-database environment and Node test runner; it starts its own loopback HTTP server using exported routes. Browser files are `access-roles.spec.ts`, `access-local-teams.spec.ts` and `access-team-creation.spec.ts`, against the compiled application, one worker with Chrome/en-AU and the three viewport sizes above. Run `npm run build`, targeted ESLint, `npm run studio:check`, `python scripts/check_foundation.py` and `python scripts/check_naming.py`.

Published logs preserve outcomes, counts and failure details; local absolute workspace/private paths are replaced by placeholders, ANSI formatting/trailing whitespace is removed, and line endings are UTF-8 LF. Empty lint logs mean successful commands with no diagnostics, not missing runs. Credential-bearing environment files, raw traces, database stores and service logs remain outside Git. Runtime: Node 24.21.0, npm 11.19.0, PostgreSQL 16.15, Chrome 155.0.8059.40 on Windows. CI is evaluated per pushed head; local proof does not grant CI completion or owner acceptance.
