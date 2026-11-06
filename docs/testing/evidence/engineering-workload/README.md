# Engineering workload backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 13 October 2026. Scope: BC-01, EN-01, ENG-01/02/04, AT-01 and PT-01. Source base: main `7e4ef3b8ce28e1976fea621f9de33999c26fbe21`; branch `codex/engineering-workload-backend`.

## Contract and environment

The [read contract](../../../decisions/engineering-workload-backend.md) adds a register API over existing Engineering authority and technical rules. Existing commands and UI are unchanged. The isolated worktree uses pinned repository dependencies and a separate loopback PostgreSQL 16.15 cluster, with only `ppo_synthetic_test`. Private configuration, database files and raw local logs stay outside Git.

## Execution ledger

The final runtime is commit `3dfa98dd7bd10275434c4473dee88ec37613a3be`. The corrected HTTP test and exact normalised source hashes are retained in [execution.json](execution.json); subsequent documentation updates do not alter that runtime or compiled build.

| Check | Executed outcome |
|---|---|
| Focused and retained database tests | 17/17 pass: six register scenarios, six extended technical-control scenarios and five existing Engineering command/persistence cases. Includes native release/revision invalidation, hidden technical sources and independent site scope |
| Compiled authenticated HTTP | 2/2 pass: native Project/package creation, sorting/counts, coordination/replay, stale continuation, exact detail/list compatibility, no-store, denied/malformed reads and unsupported writes |
| Query validation units | 2/2 pass |
| Full build and TypeScript | Pass, including the new compiled route and separate no-emit check |
| ESLint | Full repository pass; corrected HTTP test separately passes |
| Foundation, prototype and naming assurance | Pass; all 78 parent IDs preserved |
| Design register | Pass: 358 entries, no integrity errors, 330 unreviewed and 28 stale reviews retained |

No browser layout changes were made. Local full unrelated unit/database/browser suites were not rerun; the Engineering CI workflow now explicitly includes the new database and compiled HTTP cases.

## Initial results and setup dispositions

- Initial focused database run: five of six tests passed, including 101 native-created packages and complete paging/counts, date/null/tie ordering, inactive recorded owners, context/working-company isolation and injected late scoped-grant revocation. The continuation test correctly received the existing `InvalidData` response but its new assertion incorrectly expected `ValidationFailed`. Corrected the assertion without changing runtime error semantics, assertions on refusal or the 120-second deadline. All remaining continuation steps passed in the final complete replay above.
- The initial compiled HTTP run passed its refusal case but the new journey assertion expected 200 for an initial coordination command. The unchanged native route uses the default command response: 201 initially, 200 on replay. Corrected only the assertion; the final complete two-case run passes against the unchanged compiled runtime. The initial query-validation unit run passed both cases.
- Private setup: an initial reset command lacked the required disposable-database opt-ins and correctly refused. The test harness supplies both and owns the isolated database. Initial Windows database startup waited on the long-lived server process; the cluster was verified independently and task-only configuration completed. A sampled long commit waited on WALWrite; no application defect, durability relaxation or performance acceptance is inferred.

## Remaining boundary

The accepted Figma page, shell rollout, export, independent/owner review, physical-device acceptance and deployment remain separate. This work provides synthetic backend evidence only. Actual effort, availability and utilisation remain unknown. Engineer filters expose recorded owners, not assignment eligibility. The engineer facet is explicitly bounded to 100 choices; counts cover all authorised matches. The existing browser UI continues using its original list.

## Publication

[PR #457](https://github.com/deanrfiedler-gif/powerplants-one/pull/457) carries the implementation and this evidence. Initial-head CI was running without a reported failure at the evidence checkpoint; final-head CI and independent review are separate. No merge or deployment is claimed.

## Accepted UI continuation

The [1 November UI execution ledger](2026-11-01-ui-execution.md) records PR #707's implementation, validation and visual comparison separately from this retained backend proof and owner acceptance.

## Review findings and main integration — 5 November 2026

Codex is finishing existing PR #707 under the [claim takeover](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#issuecomment-6647076796). The starting head was `03e82825651243ce1d39fd79e959af66665b7c06`, matching the task and [Claude's one review](https://github.com/deanrfiedler-gif/powerplants-one/pull/707#pullrequestreview-5727823296). This work requests confirmation of those findings and the merge only, not another full review. Synthetic data only; no migration, seed, capability or grant is added. The PR is not merged or deployed.

### Merge-only evidence

Commit `6cf77c15f5de5cb7adf767cf81ad7f31f15261d3` has parents `03e82825651243ce1d39fd79e959af66665b7c06` and `2f2e399c27956b7cdfd411baeedae59d51a1d218`. Main contains `Merge pull request #802` and `Merge pull request #810`, and its migration registry ends at 0124. The merge base is `c69a0922c19e2d62b5859c57895204f5c44684c3`.

Exactly the six authorised conflicts occurred:

- `src/components/header-content.tsx`: retained both count slots, with `cost-source-count` before `engineering-count`.
- `src/components/product-navigation.tsx`: retained pricing first, including main's `aria-describedby`, then Engineering. Main applies that description only to pricing, not every count; Engineering remains as the PR had it.
- `src/shell/module-workspaces.ts`: retained main's document-library and Email rows, followed by Engineering before Equipment.
- `docs/design/development/register.json`: started from main's bytes and replaced only fields changed by this PR in `route:/engineering` and `scope:EN-01`. Main's Create forms dependency precedes the eight Engineering additions; main's additional images remain. Every other entry retains main's bytes. Counts: **main's 392 + 0 entries**, unique keys. `guides.json` is main's unchanged file: **main's 367 + 0 guides**, unique keys. Both parse. No whitespace-only entry changes were found to carry forward.
- `docs/design/development/pages/route-engineering.md`: retained the PR's rewrite and rail-badge paragraph, removed the obsolete backend-continuation section, and appended main's Create forms section verbatim. The native `RequestDialog` is reused; it still says Opportunity and uses the existing leave behaviour, so this PR does not claim implementation of the later pattern's additional form changes.
- `tests/unit/fixtures/released-guide-markup.json`: neither the removed Estimating fixture nor the rewritten Engineering fixture remains. Repository search found no surviving generator for this historical fixture. Both guide-parity tests passed in the full unit run.

Patch IDs differ: old `93c6a5f59f878682a14f1478adf7a7e85ae58fdc`, merge `4643a3b24889d9dd4123913f5725b76b7fd8e88a`. A per-file added/removed-line comparison is identical for 31 of 33 files. The only differences are main's `cost-source-count` on the slot-union line and the comma moving from the former last dependency to main's new Create forms dependency. The Engineering additions are preserved in both; there is no other contribution change in the merge-only commit.

### Findings addressed

| Finding | Correction and regression evidence |
|---|---|
| 1 — return-to-window recheck | `src/components/business-ui.tsx:144` stabilises `useResource.reload`; `src/components/engineering-register.tsx:360` applies successful focus reads and clears earlier errors/notices before handling a changed source. The existing reset/denial path clears incompatible selection and restarts page one. Three new desktop/mobile focus cases cover changed, denied and temporarily failed reads in `tests/browser/engineering-register.spec.ts:172`. |
| 2 — technical and note-conflict Retry | `src/components/engineering-register-snapshot.tsx:90` guards every user-triggered read reload against pending/uncertain writes and dirty coordination. The note-conflict recovery at line 564 changes neither its note version nor its command until approved. Only confirmed receipts reload directly. The browser regression at `tests/browser/engineering-register.spec.ts:226` dismisses a dirty Retry, then proves uncertain Retry keeps fields, disabled navigation and the identical operation payload on recovery. |
| 3 — inactive recorded owner | `src/engineering/service.ts:120` exposes existing `u.active` as `owner_active`; the save eligibility rule is unchanged. Snapshot labels at `src/components/engineering-register-snapshot.tsx:315` and line 342 append `(inactive)`. `LookupField.current` (`src/components/record-ui.tsx:65`) retains a recorded label independently of eligible matches. `src/components/engineering-workspace.tsx:1332` blocks save and explains active reassignment without dropping other fields. Database assertions at `tests/database/engineering-register.test.ts:251` cover the real inactive read and unchanged server refusal; the browser presentation regression starts at `tests/browser/engineering-register.spec.ts:268`. This retains the specified agent decision under the standing order. |
| 4 — Back after Clear filters | `src/components/engineering-register.tsx:119` consumes the pending submitted-search marker when the URL changes, so a later history restoration synchronises the input. The browser case at `tests/browser/engineering-register.spec.ts:344` checks the restored query after advancing through the debounce. |
| 5 — dirty technical tabs | `src/components/engineering-workspace.tsx:1331` retains `section` in the form's own guard while keeping priority 10 above the register's retained-note guard. `src/components/record-ui.tsx:121` accepts this explicit priority; pending writes retain priority 200. The combined note/coordination regression at `tests/browser/engineering-register.spec.ts:301` changes tabs without discarding or prompting. |
| 6 — duplicate leave prompts and lost sequence | Snapshot navigation uses the shared guard once. `src/components/engineering-register.tsx:212` changes sequence state only inside the approved navigation callback. The same browser regression cancels Close and Next, checks record/position retention, then accepts one transition and returns to the retained note. The phone case also confirms that cancelling Open menu does not dispatch its shell-menu follow-up; that action now runs only inside approved navigation. |
| 7 — New request announcement | `src/components/engineering-register.tsx:1206` announces the confirmed creation, first-page reset and need to reselect in the existing live region. `tests/browser/engineering.spec.ts:67` adds an assertion to the native creation journey. |
| 8 — dead desktop selection item | Removed the desktop Select packages toggle from `src/components/engineering-register.tsx:719`. Desktop checkboxes remain directly available; the functional phone selection action remains. |
| Note — rejected continuation badge | `src/components/engineering-register.tsx:281` reloads the rail with the rejected-continuation reset. |

### Records and isolation

The three unsupported continuation/exception attributions in `docs/decisions/engineering-workload-design.md:26`, `docs/status/2026-10-25-engineering-workload-ui.md:6` and `docs/status/2026-11-01-engineering-workload-ui.md:6` now identify an agent decision under the standing order. Relayed chat is context only and grants no exception to `docs/decisions/pull-request-flow-limits.md`. The design record's additional “user-authorised implementation” phrase is corrected consistently. Owner fields remain unchanged.

The path audit checked 4,049 cited repository paths across the PR's documentation, the register and guides, module integration proof/adaptation fields and the retained evidence manifest: none is missing. A separate audit also found all 48 proof/adaptation paths in the module integration contracts present. The Engineering HTTP test does not call `reset()` and needs no exclusive-set addition. The Engineering browser fixtures add no permission grants; the new inactive-owner UI case uses a bounded read-state fixture, with real read/save eligibility separately covered by the database case. Existing test expectations, skips, viewports and deadlines are unchanged.

### Local validation

The required cloud setup completed with Node 24.21.0, npm 11.19.0, PostgreSQL ready and browser unavailable. The first restricted database invocation hit `connect EPERM 127.0.0.1:5432`; the restricted unit run also hit `listen EPERM 127.0.0.1`. Both were rerun with network access as instructed.

Passed: foundation, prototype, naming, status-source validation, explicit `npm run studio:check`, `npm run check` (Studio, full lint, TypeScript, **1,402 unit tests**, production build), and focused lint after the final regression additions. Browser test discovery includes desktop and mobile; discovery is not execution. Browser suites and new application captures: **not run here; left to GitHub CI** because the setup summary reports the browser unavailable.

The complete database selection from `git grep -l engineering tests/database` ran **528 tests: 329 passed, 199 failed, none skipped or cancelled**. All **29 direct Engineering cases passed**. Every failing file was then run in full on clean main `2f2e399c27956b7cdfd411baeedae59d51a1d218`, in the same environment with the same 120,000 ms deadline: **260 tests, 61 passed and the same 199 failed**. All failed test names and messages match, allowing only the generated temporary-directory suffix to differ. The [database comparison manifest](2026-11-05-database-comparison.json) records every name, both messages and its classification.

- **189 environment-blocked: browser**, also **pre-existing on main in this environment**: 157 `ExactDraftUnavailable`, 29 `RenderOrStorageFailure`, one missing Chrome launch, and two expected-interruption assertions whose actual error is the unavailable exact draft. The setup summary reports the browser unavailable; these exact PDF/draft paths require it.
- **10 pre-existing on main in this environment**: Project acceptance cases fail in their unchanged setup hook with `EROFS: read-only file system, mkdtemp` under the home directory. No home-path override or test weakening was made.

Migration-number validation and all **44 documentation unit tests passed**. All **five compiled Engineering HTTP cases passed** across register, control, materials and changes after a clean synthetic reset. The initial restricted reset/server/test attempts were rerun with network access. Current-head GitHub CI and confirmation of the reviewed findings remain separate from these local results and from owner visual acceptance.


### First ready-head CI and guide content review

Head `331c83deb73c51ee3db81c848941e74abe7f2590` was pushed and both the remote ref and PR API matched it. The PR was marked ready. [Engineering native assurance](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41956046235) passed its static, database, HTTP and desktop/mobile browser phases. The first full CI also exposed these corrections:

- The new temporary-focus test selected both the application's alert and Next.js's route announcer. Its locator now scopes the same error and recovery assertions to the Engineering workload region.
- The new inactive-owner test selected the native Status option `Queued` while waiting for engineer choices. Its locator now selects only options inside `Assigned engineer matches`. The expected fields, unavailable save and successful reassignment assertions are unchanged, in both projects, with the original deadline.
- [Estimating browser job 127011438778](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41956145538/job/127011438778) failed the unchanged `tests/browser/shell.spec.ts:139` page-guidance journey: `Engineering workload & deliverables` was absent. The guide title was intact, but retiring the carried-over exemption while leaving the rewritten guide InReview hid it. The superseding [guide visibility decision](../../../decisions/engineering-workload-design.md#guide-visibility-correction--5-november-2026) keeps the rewritten guide InReview and hidden until Dean reviews and publishes it, as decided by Dean in chat in Claude’s session and relayed in the confirmation, with no [DEAN] comment. The authorised shell assertion now checks the exact “being prepared” paragraph inside the Page guide dialog (`src/components/shell-page-guide.tsx:23–24`), following main’s hidden Estimating precedent (`tests/browser/estimating-workload.spec.ts:134–137`); the focus-return assertion stays intact. The PR-added real-library unit case at `tests/unit/guide-library.test.ts:369` now checks error-free loading, InReview, no carried-over source or review evidence, and no released Engineering guide.
- The mobile compiled shard also failed the unchanged `tests/browser/intake.spec.ts:35` journey at its `Possible duplicate organisations` heading. No cause or pre-existing classification is inferred from that message. The clean-main comparison and later-head CI disposition are recorded separately.

**Superseded self-publication.** Codex’s earlier agent decision to publish the guide was invalid under the guide authoring contract: Published is reserved for Dean after review, and an edit never grants review. The [guide visibility decision](../../../decisions/engineering-workload-design.md#guide-visibility-correction--5-november-2026) records the correction. The following content checks against `331c83deb73c51ee3db81c848941e74abe7f2590` are retained as implementation evidence only; they grant no publication or owner review.

The review checked every instruction group: register views and attention rules against `src/engineering/register.ts` and `src/engineering/register-presentation.ts`; whole-result sort, paging, source-bound CSV and selection against `src/components/engineering-register.tsx`; exact snapshot tab/link names, bounded history, denied technical reads and Retry guards against `src/components/engineering-register-snapshot.tsx`; eligible-owner coordination, version checks and original-operation recovery against `src/components/engineering-workspace.tsx`, `src/components/business-ui.tsx` and the active-owner server rule; phone view/action labels against `src/components/shell-phone-header.tsx`; and keyboard resizing against the register handlers. Native database and HTTP results and the passed Engineering browser workflow supply executed behaviour evidence; they are not substituted for this textual comparison.

The review corrected the shortened phone Select label, made snapshot tab/link labels exact, documented inactive-owner reassignment and guarded retry, and limited Back's selection-preservation statement to the same result set. The rewritten content is retained, but reviewer, reviewed_at and reviewed_content_hash are removed. The guide stays InReview and hidden with the existing fallback until Dean reviews and publishes it; carried_over_from and shown_before_review remain removed. These implementation checks are not content-owner review, business acceptance or operational sign-off.
