# CS-08 Site surveys execution evidence

Date: 21 October 2026. Branch codex/site-surveys-cs08; draft PR #650. Integrated main: 78795dd6. Owner visual review remains pending. The independent migration review and its corrections are recorded below; the current commit review and CI outcome are tracked in PR #650. No deployment or business acceptance is claimed.

## Source and comparison

PPO - Design, named version **Site surveys — accepted**, page 1464:2918, notes 1464:4164 and index 630:2. The [page contract](../../../design/development/pages/scope-cs-08.md) maps every live source and retained reference. Issued icon-free sources remain unchanged. Original live frames and the notes card were inspected outside Git.

The captures below are the compiled local application with the locked Next.js 16.4.2 / React 19.3.1 dependencies with bounded synthetic presentation fixtures. Font Awesome icons were hidden with visibility rules before capture, retaining their geometry. No private design link, raw export or Pro artwork is included. They document an author comparison, not owner approval or a pixel-identical assertion. [Measurements](captures/measurements.json) record 21 captures, all without horizontal page overflow. Register and tab-strip overflow is contained within its own control.

| View/state | Live node | Application capture |
| --- | --- | --- |
| Desktop register, 1440×900 | 1464:2955 | [Register](captures/register-1440.png) |
| New survey, 1440×1100 | 1464:3366 | [Create](captures/create-1440.png) |
| Tablet register, 1024×900 | 1464:3695 | [Tablet](captures/register-1024.png) |
| Phone list, 390×844 | 1464:3779 | [Phone list](captures/register-390.png) |
| Scope, 1440×1234 | 1464:3055 | [Scope](captures/scope-1440.png) |
| Observations, 1440×1336 | 1468:3554 | [Observations](captures/observations-1440.png) |
| Photos, 1440×977 | 1470:2833 | [Photos](captures/photos-1440.png) |
| Follow-up, 1440×989 | 1471:2847 | [Follow-up](captures/follow-up-1440.png) |
| Review form, 1440×1187 | 1472:3102 | [Review](captures/review-form-1440.png) |
| Handover, 1440×1261 | 1473:3371 | [Handover](captures/handover-1440.png) |
| Scope, 390×844 / 320×844 | 1464:3821 / 1464:3890 | [390](captures/scope-390.png), [320](captures/scope-320.png) |
| Successor observation, 390×844 | 1478:3552 | [Observation form](captures/observation-form-390.png) |
| Loading / no reviewed surveys | 1464:3958 / 1464:4016 | [Loading](captures/loading-390.png), [Empty](captures/empty-390.png) |
| Could not load / changed scope | 1464:4059 / 1464:4095 | [Error](captures/error-390.png), [Changed source](captures/changed-source-390.png) |
| Additional runtime states | Existing read contract | [Denied](captures/denied-390.png), [Partial](captures/partial-390.png), [Review overview](captures/review-1440.png), [Desktop source comparison](captures/changed-source-1440.png) |

## Results

| Check | Result |
| --- | --- |
| Focused survey unit suite | 6 passed, including measured zero, Unknown, visit interval validation and original PNG/JPEG/WebP bytes |
| Full unit suite | 973 tests: 970 passed, 3 failed; all three reproduced on clean main 78795dd6 |
| Typecheck | Passed |
| Lint | Passed |
| Browser state/permission/handovers | 12 passed across desktop and phone against the compiled app |
| Browser real save → submit → independent review | 2 passed, desktop and phone against the compiled app |
| Shared shell label and geometry | Focused check passed after updating the accepted Site surveys label |
| Customer/location and populated survey upgrade | 8 passed against ppo_synthetic_test |
| Historical populated 0025 estimate upgrade | Passed; original identities, financial source and ledgers preserved across 0026 through 0114 |
| Studio, naming, foundation and migration numbering | Passed; 366 entries, 48 component entries, 78 parent requirements, no errors |
| Full application build | Passed with locked Next.js 16.4.2 and npm 11.19.0; the earlier local-cache build also passed |
| Locked dependency install | Passed with required npm 11.19.0; package/lock files unchanged |
| Locked-client new allocation and survey authority | 2 passed against ppo_synthetic_test |

Final commands: npm run studio:check, npm run lint, npm run typecheck, npm run test:unit and npm run build (or their identical package-script entry points); python scripts/check_naming.py, scripts/check_foundation.py, scripts/check_migrations.py, scripts/build_status.py and scripts/build-ui-sequence.py. Windows used the installed Python 3.14 executable. No new routes required studio:sync. The generated build sequence remains under ignored tmp/ by repository policy.

Initial installation refused local npm 11.19.1 because the repository pins 11.19.0. Using the required version completed the locked install. One unit run concurrent with the build also hit the CPQ owned-workload execution budget; the unchanged check passed in isolation on both this branch and clean main. This transient attempt is not represented as a pass of the full run.

The browser suite uses installed reviewed Chrome 155.0.8059.85 via an explicit executable path. The default local channel path did not exist; no runtime/browser policy was changed. Tests prove 390 and 320 px measurement layout, retained unsaved values across tabs, review/return in one form, changed-source visibility, owner/recorder exclusion, exact receiving destination/owner/snapshot payload, conflict retention, loading, empty, error, partial and denied reads. Separate database proofs verify the server authority checks and persisted handover. Earlier selector/envelope mistakes in the test harness were corrected and rerun. The last rebuild also exposed a test-launch race before the preview listener was ready; the browser suite was rerun after readiness.

The full unit non-regressions are P06 private adapter write-once, P06 immutable source lookup and P12 private recovery-path checks. Each failed with the same Windows filesystem behaviour on an unmodified, clean main worktree. They are not counted as passes. Linux CI and the independent review remain separate from these builder-run local checks.

The private PostgreSQL 16 cluster contained only ppo_synthetic_test. Local fixture seeding on unchanged 0109 exceeded its 120-second limit, so a temporary test-only preload extended statement/connection timing. Reset required a higher max_locks_per_transaction in that private cluster. Runtime timeout code is unchanged. A Windows ESM preload path error was corrected to a file URL before the final 8/8 run. No full repository database or HTTP suite has been claimed.

The first PR CI run exposed an old-schema Supply conversion incompatibility and a stale shell label expectation. Plan creation now freezes the namespace supported by the installed migration, so pre-0114 plans keep their original references while new plans use SYN-SC-. The receipt suite asserts both formats; replay does not rename an existing plan. The shell check passed locally. The corresponding disposition suite passed on [unmodified main 78795dd6](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39519918810). A local baseline receipt-upgrade attempt stopped earlier with ExactDraftUnavailable in the existing Windows document-output path; it is not a passing receipt proof. Replacement PR CI remains separate from the successful local CS-08 and migration checks above.

## Independent migration review and corrections

A separate GPT-5.6-sol reviewer inspected commit 9a296d62 and the correction diff without editing the builder branch. Scope covered migration 0114, deferred identity constraints, counter continuation and existing-reference preservation, immutable survey/photo evidence, review/handover authority, the pre-0114 Supply-plan boundary and repository-wide upgrade assertions. It found no additional migration or server defects beyond these three test findings:

- [Discovery upgrade ledger](https://github.com/deanrfiedler-gif/powerplants-one/pull/650#issuecomment-6306012651): preserve the original through-0109 ledger and expect both 0113 and 0114 as additions.
- [Document download filename](https://github.com/deanrfiedler-gif/powerplants-one/pull/650#issuecomment-6306039054): expect SYN-DOC- for a newly allocated document.
- [Job-pack return subjects](https://github.com/deanrfiedler-gif/powerplants-one/pull/650#issuecomment-6306058040): expect SYN-PACK- in both newly created return follow-ups.

All three findings are corrected. Builder-run rechecks passed on a separate disposable ppo_synthetic_test instance: the populated Discovery upgrade (1 test), checker Return and successor revision (1 test), and both compiled document-library HTTP flows (2 tests). The technician Return path was not separately rerun locally; the complete readiness suite remains a CI check. The reviewer independently checked the minimal four-assertion correction diff; its final commit-specific outcome and the latest CI state are recorded on [PR #650](https://github.com/deanrfiedler-gif/powerplants-one/pull/650). These are static review and builder verification, not owner visual approval.

## Visual differences and open questions

- New references use Dean's later approved SYN-SRV-000nnn format. Existing references and issued examples stay unchanged.
- The shared compact phone record header keeps reference, Back and More; Record observation appears in the body. This adds vertical content compared with the dedicated close-only form header in 1478:3552. Save and Cancel remain reachable in the sticky form footer.
- Native labelled start/end inputs replace the drawn combined visit interval control. Start is required for new surveys; end is optional and must follow start. A measurement unit is a labelled text field because no authoritative unit catalogue is defined. Observation recording preserves date precision, without inventing clock time.
- The current Service rail follows actual permissions and the remembered department. The tablet capture uses its existing Collapse primary navigation control, matching the collapsed state in 1464:3695; an expanded user preference is also supported. Its available links differ from the illustrative rail. Register More/settings and bulk operations have no specified action; the trailing control opens the record. Additional required columns remain horizontally reachable. Title sorting applies to the loaded page and pagination is explicit.
- Scope links, known gaps, original file metadata and caption correction records use current canonical data. Synthetic names, dates, row counts and retained history differ from the drawn examples; these captures are not replacements for the accepted reference. Visit context renders recorded site-wide observations without inventing arrival/access categories or attendance.
- Existing Activity links handle follow-up; no inline Activity creation, Conversations or document-storage connection is introduced. Current synthetic photo limits are eight originals, 1 MiB per new file and bounded static PNG/JPEG/WebP dimensions.

Open for Dean: specify register More/settings and any bulk actions; decide whether observation clock-time precision and a governed unit catalogue are needed; confirm photo limits for field use. Full-size History redesign stays outside scope. Owner visual review remains pending.
