# AD-02 implementation evidence

Owner: Codex for Dean. Branch: `codex/settings-hub`; [draft PR #802](https://github.com/deanrfiedler-gif/powerplants-one/pull/802). All policy values and proof data are synthetic; none is an operating rule.

## Separate delivery statuses

- Implementation: Settings hub, Business policies register and policy record implemented, using the native policy commands and receipt journal. No migration, capability, grant or dependency added.
- Functional proof: focused unit, database and direct HTTP proof passed; browser results and remaining limits are detailed below. Repository CI and independent exact-head review remain merge gates.
- Visual comparison: Codex inspected retained application captures against the thirteen accepted reference images. Differences below remain explicit; this is not visual acceptance.
- Owner acceptance: accepted design only. Application acceptance is not claimed.
- Deployment: not performed.

[Accepted frames](../../../reference/ui/settings/settings-hub-design-r01/README.md) remain unchanged. Application PNGs and their SHA-256/source manifest are retained in this evidence folder. No trace, session cookie, Figma file identifier or licensed icon artwork is included.

## Executed verification

- Real `npm ci` passed on Node 24.22.2 / npm 11.19.0, without an engine override or node_modules junction.
- Typecheck (`NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`), full lint, studio check, foundation, naming and status checks passed. Final focused lint/typecheck cover the later phone and proposal-version corrections. Python checks used `C:/Python314/python.exe`, because `python3` is unavailable in the tool shell.
- Two focused unit tests passed.
- Three AD-02 database tests passed: per-area visibility/direct denial, read-only seed families, atomic proposer refusal, publisher proposal authority without a new reviewer grant, stale publication refusal, exact receipt recovery, future publication versus the version actually in force, and an old proposal retaining its intended version after the head advances.
- The combined policy database/HTTP run had 15 passes and two failures. The HTTP exact-retry fixture incorrectly used the reviewer instead of the original publisher; corrected direct HTTP handler proof then passed. The isolated authority test passed after its earlier seed timeout; the same authority test passed on unmodified main. The outer HTTP wrapper with its 110-second allowance was not rerun; the direct harness took about 182 seconds.
- AD-02 browser cases for failed/pending reads, independently reviewed successor and stale publication refusal, lost committed response/exact receipt recovery, and phone loading/filtered-empty/stale/failed/empty-area/denied states passed on the final UI. The final four-width tour and repeated phone read-state test also passed (two tests, 5.3 minutes), including phone More → Propose change, Escape and focus return. All five AD-02 cases passed across these final runs. The earlier complete four-case run also passed, before later phone refinements.
- Native PL-04 successor-edit focus regression passed. The longer native publication regression reached accepted publication, identical replay/recovery, saved-record discovery and the owned Activity link, but exceeded its 600-second overall allowance at appointment handover. A later run with a 20-minute allowance again passed those publication/recovery steps but failed the appointment navigation URL assertion after 60 seconds (10.7-minute run). The trace contains no recorded confirmation dialog; the dev server compiled the appointment route. The exact navigation failure has not been reproduced on unmodified main, so it remains an unresolved regression limit and is not called unrelated. One intervening launcher attempt was rejected before setup because its local-synthetic environment flags were omitted; those flags were restored for the bounded rerun.
- Capture-tour attempts encountered local-session connection timeouts and one prolonged policy loading state. A bounded comparison using the actual unmodified-main local-session handler at `1402c87b` reproduced a cold GET 503 (`DependencyUnavailable`, server category `DatabaseConnectTimeout`); seven other cold POST/GET calls passed. The initial comparison without the local-gateway header returned LocalOnly and was discarded. Native connection/query limits are unchanged. The capture test records any recovery through the native identity chooser; it does not substitute policy responses.

The five AD-02 cases are registered in the existing isolated scheduling browser suite, with one synthetic reset per project and serial execution. This avoids publishing into the general browser suite’s shared fixture. The captured runs used the same private seeded database and actions before this registration move; final registration passed for all ten project/case combinations, and the moved file passed lint.

The complete repository database/browser suites and production build were not run locally. CI, cross-model review, owner acceptance and deployment are separate outstanding statuses.

## Design differences

- Codex decided under the standing order to hide unavailable areas on 31 October; [DECIDED by Codex](https://github.com/deanrfiedler-gif/powerplants-one/pull/802#issuecomment-6540935470) relays chat as context, not repository evidence of Dean’s acceptance. All nine catalogue entries remain, but only real permitted destinations appear. Templates has native backend support on the starting main; its management page belongs to open PR #704. There is no fabricated health result, access request or unavailable destination.
- Source rows, names, timestamps, counts and proposal branches replace the 22 October story. Readiness is actually version 3. The publication-recovery fixture has one affected booking; the separate future 420-minute fixture has none. These are synthetic test outcomes, not copied frame values.
- The current shared shell supplies its navigation, local foundation link, header and phone bottom navigation. Tablet retains the current expanded primary rail/collapsed secondary menu; hub cards use two columns there. The local runtime has no Font Awesome kit and uses the repository fallback icons.
- Register search covers name, area, scope and state, with policy-name sorting and a Waiting to publish view. The desktop shared table scrolls horizontally for later columns; phone rows retain name, area, in-force version, scope and proposal state, while the record supplies full dates and revision context. Separate Area/State dropdowns, bulk selection, column customisation and list-position previous/next controls are not implemented. The record links to All policies instead of showing a numeric list position.
- Only Terms and proposal tabs exist. Used by is record facts. There is no History, Affected work, field-readiness amendment or amendment phone sheet.
- Phone terms stack in the shared register table. More exposes Propose change, View proposal/terms and Refresh; Compare/Back and one sticky primary action retain the task. Shared native modals remain in place; the phone sheets accepted on 1 November belong to the separate unbuilt amendment, and the current bottom navigation remains.
- Propose change uses read-only fixed-term definitions, stacked fields and native date-time inputs rather than the frame's faux inputs/grid. Checks are explicitly server checks; the UI does not invent a green preflight result before the native command.
- The optional publication note falls back to explicit confirmation text for the native required reason. Proposal/review reasons remain required. This is a recorded Codex decision, not Dean's acceptance.
- Review comparison uses plain native counts and owned booking links rather than the complete designed metric/booking grid; native impact reason codes remain visible. No new duration-overage rule is invented. After the review correction, the latest reviewed live branch is shown when available, otherwise the latest live proposal, with the live branch count and a link to the original PL-04 workspace.
- Publication refusal uses native error/support-reference presentation. After refresh, an earlier review is explicitly reference only; the UI does not copy the frame's story-specific red banner. Exact uncertain-save recovery retains the original request and expected versions.
- Readiness and working-hours policies are read-only records. Record references use a Format rules/Terms workspace with eight synthetic format examples, not allocated identities or an editor. Policies and proposals receive no readable reference.
- Native date/time formatting, current read timestamps, actual synthetic profile names and additional branch context change text wrapping and vertical scroll. Supplemental uncertain/recovered states have no accepted-frame counterpart.

## Reproduction and boundaries

Private PostgreSQL 16 clusters use loopback 55482 and 55483, both named `ppo_synthetic_test`. The dedicated dev server uses `PPO_PORT=3182`; port 3000 and other contributors' services are untouched. Chrome 156.0.8078.80 / Playwright 1.64.1 captured 1440, 1024, 390 and 320 CSS-pixel widths. Test data is seeded locally; source records and accepted captures are unchanged.

Capture provenance, source hashes and exact image dimensions are recorded in `capture-manifest.json`. Only curated synthetic PNGs are committed. No application review fingerprint is marked accepted.

## Retained successor test correction — 31 October 2026

Codex addresses [Claude finding 1 on #802](https://github.com/deanrfiedler-gif/powerplants-one/pull/802#pullrequestreview-5722605727) in [child PR #812](https://github.com/deanrfiedler-gif/powerplants-one/pull/812), based on `0c89f501d20728316fed657d39a008bad3d2d55d`. The `reviewed()` fixture proposes as the publisher and reviews as the separate reviewer. The retained superseding-proposal browser scenario now creates its successor as that original publisher, matching the native predecessor-proposer guard. The expected 201, stale-review refusal, zero-publication check and successor link after reopening are unchanged. Application commands and the API-C26 authority contract are unchanged.

Executed in the correction worktree: focused ESLint and TypeScript (`tsc --noEmit`) passed; Playwright `--list --grep 'a superseding immutable proposal'` discovered both desktop and mobile cases. Dependencies were installed with `npm ci --engine-strict=false --ignore-scripts` on Node 24.22.1 / npm 11.9.0; this is not a validation of the pinned npm 11.19.0 setup.

`npm run browser:check` failed because Chrome is absent at `/opt/google/chrome/chrome`. Neither browser case was executed here. Run `npx playwright test -c playwright.scheduling.config.ts --grep 'a superseding immutable proposal'` in the configured compiled synthetic environment to verify both projects. Full database/browser suites and production build were not run for this test-only correction. Findings 2–9, the prior appointment-handover failure, CI and independent exact-head review remain open; no acceptance or deployment is claimed.

## Review corrections and main integration — 4 November 2026

This session claimed [#802](https://github.com/deanrfiedler-gif/powerplants-one/pull/802#issuecomment-6614415428) after the prior claim was released. Both starting heads matched the task: #802 `0c89f501d20728316fed657d39a008bad3d2d55d`, #812 `bd8928b2bc825efc364cc982389815ca6dab0da6`. #812 was fast-forwarded unchanged, retaining both commits and its reviewed publication scenario. Main `7ed1b2e4711adb33391a9f8aaaed14c9c55fa7df` was merged in `8d2a76822` using only the five authorised conflict resolutions. Codex did not invoke a pull-request merge; #812 becomes merged through retained ancestry when this branch is pushed. #802 remains for Dean to merge.

The navigation hunk retains the two Settings lines before main’s commercial-record line. The decision retains the native implementation section before Later amendment. The scope page keeps main’s accepted amendment and its Figma paragraph, replacing only the specified final sentence in the conflict. Guides/register start from main, insert the three AD-02 routes after their branch neighbour, and take exactly the prescribed AD-02 fields; main’s images and dependency list are retained, followed by the five specified source paths. Parsed totals are 364 guides and 388 entries, without duplicates; all other main entries are byte-equivalent as JSON values and retain main order. `studio:check` passed. Subsequent prose changes below address the review and record correction. The service API diff is confined to the AD-02 section; the two pre-existing table-row changes from the original PR have been restored to main.

| Finding | Correction or declared limit |
|---|---|
| 1 | #812 retained unchanged; `publication.spec.ts` remains byte-identical to its reviewed head. |
| 2 | Step 6 now proposes as the publisher and `review()` signs in as the separate dedicated reviewer. Every assertion remains. The Step 6 journey was not run here; left to GitHub CI, but **CI does not run `playwright.step6.config.ts`**, so that journey still needs an equipped runner. |
| 3 | Only future-start/current-head branches without a successor/publication count as live. The latest reviewed live branch takes precedence, so a newer unreviewed branch cannot hide Waiting to publish. Dead branches leave attention, next-version and branch counts. Unit cases exercise moved heads and the exact effective-start boundary; database proof covers an older reviewed branch, publication and the cleared hub. |
| 4 | Access `has_more` and the recovery look-ahead produce a visible `+` lower bound and a source-list explanation. Recovery dispositions are excluded before the 100-row limit and rechecked after reading each case. Tests cover 51 distinct access requests, 103 recovery cases, both dispositions and the exact 100-row boundary. Original recovery evidence remains in the full recovery list. |
| 5 | Side links expose `aria-current` and selected styling. All policies and Waiting to publish regain their counts. |
| 6 | Built Waiting on and Last change columns, Who can change it, saved-review future-booking counts, My account and preferences through the existing shell Account panel, and a PL-04 saved-review link to the policy record. Last change uses saved scheduling proposal/review/publication times; other families say Not recorded because the current read has no authoritative change event. Duty labels replace named role assignees because the read does not enumerate eligible reviewers/publishers. With no complete saved review there is no booking count; stale review counts are labelled reference only. These limits are also declared in the AD-02 page contract. |
| 7 | Card footer resets all padding and uses 12 px text, so the global footer’s 42 px inset and 10 px text do not apply. |
| 8 | Terms and the saved-review heading both mark a noncurrent review out of date; identity, proposal revision, head, start, successor and publication are checked. |
| 9 | Singular booking counts use “booking checked”, “booking needs” and “booking … needs attention”. |
| 10 | The decision, scope and route contracts, status fragment and evidence now identify agent decisions under the standing order. The relayed chat is context, not repository evidence of Dean’s instruction or acceptance. The historical comment is not rewritten. |

The History and Affected work tabs, field-readiness amendment record and phone propose/review/publish sheets accepted on 1 November remain separate scope and are not built. Current captured PNGs predate these fixes; no new visual, device or owner acceptance is claimed. The existing guide JSON is retained exactly as directed by the conflict resolution; its original October wording about then-unaccepted amendment sheets is historical, superseded by the page contract’s explicit accepted-but-not-built status.

### Assertion changes

Every original assertion is retained except the following obsolete expectations, each named for review:

- `tests/database/settings-hub.test.ts`: after head 2 is published, `next_version` changes from 2 to null; the old assertion encoded the dead-branch defect. Added assertions require no live proposal, zero counts and no policy attention.
- `tests/unit/shell-navigation.test.ts`: Settings changes from absent to present, explicitly permitted Settings changes from closed to open, and the empty-capability navigation list changes from `[home]` to `[settings, home]`. These assertions encoded the former unbuilt destination; the hub has no authority of its own. Added denial for `canOpen(settings, [])` retains discovery filtering.
- `tests/unit/navigation-safety.test.ts`: the empty-capability fallback changes from null to `/admin/settings`, where no permitted area is an explicit empty state. Added `homeHref([]) === null` retains the no-destination fallback.

The two navigation tests passed on clean main and failed on the original PR implementation, then passed with the corrected expectations. No runtime permission, capability, grant or navigation rule was changed by these test corrections.

### Execution in this environment

Required setup from main succeeded with Node 24.21.0, npm 11.19.0 and PostgreSQL 16.15. Its summary reported database ready, browser unavailable. Every later shell sourced `/workspace/.ppo-tools/env.sh`. Network commands were tried normally and retried with requested network access after sandbox refusal; the proxy/allowlist was preserved. The database suites ran one at a time on `ppo_synthetic_test`.

Passed: `python3 scripts/check_foundation.py` (including the design-token check), `check_prototype.py`, `check_naming.py`, `build_status.py --check` (315 fragments), standalone design tokens (63 mapped, 19 design-only, 32 unmapped baseline), and `npm run studio:check` (364 guides/388 entries). Full `npm run check` passed with requested network access: studio, ESLint, TypeScript, **1,360 unit tests**, guides/offline compilation and the Next production build. The four focused AD-02 unit tests and two corrected navigation unit files (13 tests) also passed directly. A subsequent attention-explanation wording correction was checked with focused ESLint and `git diff --check`.

Serial database results: `tests/database/settings-hub.test.ts` **5/5**, `policy-commands.test.ts` **10/10**, `policy-records.test.ts` **3/3**, and `policy-command-http.test.ts` **1/1** passed. The actual isolated HTTP wrapper completed in about 11 seconds, closing the earlier unrerun-wrapper timing limit in this environment. No other process used the database during these suites.

The first new access-pagination fixture incorrectly repeated one pending request and received `RequestConflict: A pending request or accepted operation already exists for this exact identity or grant.` It was corrected to use 51 distinct existing capabilities and passed. The same test path is absent on clean main (`Could not find .../tests/database/settings-hub.test.ts`), so no pre-existing claim is made for that fixture failure.

Initial restricted-network unit failures below were reproduced on a clean detached checkout of main `7ed1b2e47`: **pre-existing on main in this environment**. All 107 tests in those twelve comparison files (including the two navigation files) then passed on main with requested network access. These initial sandbox failures are retained as history, not outstanding code defects.

| Test file | Failing test on restricted main | Message |
|---|---|---|
| `azure-demo.test.ts` | operator CLI upgrade loads and reaches the database without an import deadlock | `spawnSync node EPERM` |
| `azure-demo.test.ts` | operator CLI verify loads and reaches the database without an import deadlock | `spawnSync node EPERM` |
| `browser-fixture-transport.test.ts` | browser fixture requests own connections, retain cookies and propagate a lost response without retry | `listen EPERM: operation not permitted 127.0.0.1` |
| `fertigation-request-limit.test.ts` | FN-T41 native HTTP rejects 2-9 MiB uploads with complete actionable JSON before closing the connection | `listen EPERM: operation not permitted 127.0.0.1` |
| `foundation.test.ts` | launcher exits before serving in production, remote or shared configurations | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build fails closed for every malformed-opener escaped guide and writes no release | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build refuses escaped guides behind delimiter-like lines and comment preambles, and writes no release | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build refuses every escape-parity guide and writes no release | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build refuses hidden escaped guides after delimiter-like YAML and leaves no release file | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build still ignores normal non-guide Markdown, including malformed non-guide metadata | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build still skips metadata with a spoiled closer and no guide key | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build still skips ordinary block-scalar front matter with no guide key | `spawnSync node EPERM` |
| `guide-library.test.ts` | spawned build still skips the comment-preamble, block-scalar and unclosed-comment controls | `spawnSync node EPERM` |
| `guide-library.test.ts` | the build fails on a malformed guide, names its file and line, and writes no release file | `spawnSync node EPERM` |
| `guide-library.test.ts` | the build fails on an escaped guide key in front matter that YAML reports an error for | `spawnSync node EPERM` |
| `guide-library.test.ts` | the build writes the release file with the visible guides | `spawnSync node EPERM` |
| `guide-library.test.ts` | the loose rule checks the line after one that ends in a backslash | `spawnSync node EPERM` |
| `guide-library.test.ts` | the loose rule reads a key that starts in its first 40 lines to its end | `spawnSync node EPERM` |
| `login.test.ts` | callback failures become bounded recovery pages without reflecting provider details | `listen EPERM: operation not permitted 127.0.0.1` |
| `login.test.ts` | hosted workspace pages, examples and references recheck owner access on direct HTTP requests | `listen EPERM: operation not permitted 127.0.0.1` |
| `login.test.ts` | installation assets are readable without a session; nothing else becomes public | `listen EPERM: operation not permitted 127.0.0.1` |
| `login.test.ts` | login rate boundary still limits provider attempts and offers honest recovery | `listen EPERM: operation not permitted 127.0.0.1` |
| `login.test.ts` | native Microsoft handoff, callback and logout preserve fixed destinations and secure cookies | `listen EPERM: operation not permitted 127.0.0.1` |
| `login.test.ts` | public login and protected routes retain distinct HTTP and access boundaries | `listen EPERM: operation not permitted 127.0.0.1` |
| `proof-database.test.ts` | database observation preserves pg callback, promise, error and release behavior without recording data | `spawnSync node EPERM` |
| `proof-request-scope.test.ts` | diagnostic scopes preserve concurrent request identities, values and original rejections without retaining request data | `spawnSync node EPERM` |
| `proof-request-scope.test.ts` | diagnostics remain disabled outside the opt-in synthetic boundary | `spawnSync node EPERM` |
| `proof-request-scope.test.ts` | unwritable diagnostics preserve the business result and original rejection | `spawnSync node EPERM` |
| `quality-asset-observer.test.ts` | real HTTP asset finish and incomplete close remain distinct without changing body or cache | `listen EPERM: operation not permitted 127.0.0.1` |
| `quality-packet-network.test.ts` | opaque relay handles fragmented and pipelined SOCKS handshakes, exact bidirectional bytes and rejects unrelated targets | `listen EPERM: operation not permitted 127.0.0.1` |

### Additional recovery-suite result

`tests/database/offline.test.ts` was run serially after the required database suites and failed **22/22**, all before the scenario body could finish creating its rendered pack. Each stack points to `tests/helpers/packs.ts:92` via `issued()` and the field fixture. Classification for every row below: **environment-blocked: browser**; setup reports Chrome unavailable. These failures are not passes, and no `ExactDraftUnavailable` error was observed in this run.

| Test | Message |
|---|---|
| P08 additive P07 upgrade preserves attendance, receipt, bytes and revoked grants | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 provisional start resolves an immutable causal reference and isolates a failed sibling | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 100 original captures replay exact receipts once and changed reuse conflicts | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 exact PNG causal chain and interrupted finalisation recover one immutable file and completion draft | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 unknown fields, wrong actor/workspace/site/appointment and unsupported payload isolate failures | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 missing and cyclic dependencies preserve siblings without accepting children | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 normal acceptance and restricted recovery are exclusive under competing original-operation locks | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 revoked permission blocks accepted normal receipt recovery and preserves local-only identity | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 revoked ordinary access requires the exact prior recovery capability and an owned immutable disposition | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 recovery retains exact private PNG and denies inactive identity or other owner byte access | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 cancelled-before-start intent never creates attendance; stale factual evidence has restricted recovery | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 withdrawn pack preserves started factual capture as review-required authority, without reopening work | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 actor-wide time overlap and immutable successor evidence remain enforced through sync | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 late audit_events failure rolls back capture and all accepted facts | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 late operation_receipts failure rolls back capture and all accepted facts | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 late outbox_jobs failure rolls back capture and all accepted facts | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 late sync_acceptances failure rolls back capture and all accepted facts | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 queued reassign refuses stale start and preserves exact original evidence in owned recovery | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 queued amend refuses stale start and preserves exact original evidence in owned recovery | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 queued scope refuses stale start and preserves exact original evidence in owned recovery | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 restricted PNG storage-success/database-failure keeps original hash and recovers one case and Activity | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |
| P08 expired prior recovery capability cannot preserve or disclose original evidence | `{"processed":true,"state":"Failed","error_code":"RenderOrStorageFailure"}` |

The same serial suite was run on a clean detached checkout of main `7ed1b2e4711adb33391a9f8aaaed14c9c55fa7df`, using the same environment and database with no concurrent database work. All 22 test names and `RenderOrStorageFailure` messages matched exactly: also **pre-existing on main in this environment**. The browser classification remains the reason these do not block this PR.

Browser execution: `tests/scheduling-browser/settings-hub.spec.ts`, `publication.spec.ts`, `successor-focus.spec.ts` on desktop/mobile, and the Step 6 journey with `playwright.step6.config.ts` were **not run here; left to GitHub CI** because setup reported browser unavailable. CI does not run the Step 6 journey. Added browser assertions cover selected links/counts, footer geometry, account opening, columns, stale-review wording, singular counts and the PL-04 handover; their execution remains outstanding. The previous appointment-handover browser limit remains for the compiled CI run; it has not been declared pre-existing.

Other repository database and browser suites were **not run here; left to GitHub CI**. Claude’s existing review is the one full independent review; confirmation of findings 2–9, unchanged #812, the five resolutions and item 10 is still pending. CI, the Step 6 equipped-runner journey and owner acceptance remain open; Codex does not merge or deploy.
