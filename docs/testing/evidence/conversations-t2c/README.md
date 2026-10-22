# Conversations T2c execution evidence

Owner: Dean Fiedler. Builder: Codex. Implementation authorised; owner acceptance and cross-model review remain separate.

Draft delivery: [PR #660](https://github.com/deanrfiedler-gif/powerplants-one/pull/660), branch `codex/conversations-t2c-ui`, based on main `bb5da7d148fe60ef3cf28d1666cd41aee51e6d46`. [T2c design and test-first plan](../../../decisions/conversations-t2c-design.md) records authority, approved W3/R8 decisions and adaptations. No migration, capability, grant, dependency, provider or production integration is added.

During final CI, Dean merged current main `002af00e4e19e9aa0d12f83d36199bebe6572a1b` (Nursery documentation PR #661) into this branch and resolved the conflict, producing `614834bcbbf060dba7d06936490c85b950fd0b8a`. Codex preserved and fast-forwarded to that merge. Application, tests, scripts, dependencies and browser configuration are byte-identical to the validated T2c delivery source. The generated status and decision indexes were regenerated from both retained fragment sets to restore canonical ordering/spacing; merged documentation assurance was rerun. The Windows baseline comparison at bb5da7d1 remains applicable because the intervening main change is documentation-only. Earlier head CI reached 56 passes without a failure before the owner merge superseded it; it is not a completed final-head CI pass.

## Environment and reproducibility

Windows; Node 24.22.0, npm 11.19.0, real `npm ci` (238 installed, 239 audited), no engine override. PostgreSQL 16.15 in an owned disposable cluster, port 51427, database `ppo_synthetic_test`, `max_locks_per_transaction=1024`, 128 MB shared buffers and disposable durability settings. Server port 3147; explicitly local-synthetic, loopback and synthetic identity. Private configuration and raw diagnostic logs remain ignored under the task worktree. Neither credentials nor the private Figma link are published.

Heavy checks ran serially after inspecting PC load. The broad local database attempt was stopped when available RAM approached 1 GB. It is an incomplete attempt, not a pass; the complete affected inventory ran serially instead. No process belonging to another contribution was stopped. The shared checkout was not edited or switched; no stash, rebase or force push was used.

The compiled loopback launcher defaults to NODE_ENV=test; it is not a production runtime. `playwright.compiled.config.ts` explicitly sets PPO_ASSISTANT=off. Enabled end-to-end proof uses a separate non-production development server. The production refusal in `assistantEnabled()` is unchanged. Historical fixtures invoke the existing document worker in a separate, explicitly non-production synthetic process; no browser adapter or runner endpoint exists.

## Executed local checks

| Check | Actual result |
|---|---|
| Full unit suite, `npm run test:unit` | 1,030 cases: 1,027 pass, three Windows baseline failures reproduced on unchanged main |
| Affected unit presentation/composition/picker/validation | 19/19 pass; development workspace/catalogue checks also pass |
| Complete affected Conversations/assistant database inventory | 78/78 pass across ten files, serial, unchanged 120-second per-test deadline; 34 minutes |
| Conversations HTTP suites | 11/11 pass, including persisted worker answer, no-store reads and different-reader reason privacy |
| Enabled T2c browser suite | 16/16 pass on desktop and phone after routes were warm; includes real UI post → queued turn → existing worker → simulated answer with citations |
| Additional real worker scroll proof | 2/2 pass, verifying citations enter the viewport on desktop and phone |
| Compiled/off final browser proof | 69 pass, nine intentional skips across the complete four-file desktop/phone inventory; compiled server explicitly off; test process starts without env preloading, matching CI |
| 8 GB application typecheck and focused browser harness typecheck | Pass after picker/fixture changes |
| Full tracked-tree lint and build | Pass after picker/fixture changes; zero lint errors or warnings |
| Status, foundation, naming, migration collision and studio assurance | Pass after owner merge: 78 parent IDs, 22 issued sources, 13,264 links, 7,010 text files, 92 status fragments; 756 document records; migrations unique/registered/unreserved with open-PR check; studio 366 pages/entries and 50 components, all reviews still pending (340 unreviewed, 26 stale entries) |
| Runtime dependency audit | Zero runtime vulnerabilities; existing dev-only braces-chain findings remain covered by ADR-0056, no lockfile change |

Database command: `node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000` with `tests/database/assistant-{budget,evidence,schema,thread,turns,upgrade}.test.ts`, `conversations-agent-ui.test.ts`, `conversations-context.test.ts`, `conversations-upgrade.test.ts` and `conversations.test.ts`. The braces here abbreviate the six explicitly supplied assistant files, not a change to test inventory. This proves scoped authority, warning refusal/confirmation/replay, permission revocation, P1 withholding, P3 privacy, concurrent runners, upgrades and existing human behaviour. The full local database suite did not complete; all eight CI database shards remain separately required.

Browser commands use the locked Playwright CLI and stable Chrome channel, one worker, existing 45-second case deadline and five-second assertions. Local ignored configs point the existing two projects at port 3147 and an owned server. `tests/browser/conversations-agent.spec.ts` intercepts presentation/read responses and is explicitly mocked. `conversations-agent-worker.spec.ts` posts through the real UI and existing HTTP command, deliberately loses the accepted response, reloads the original receipt, runs `scripts/document-worker.ts`, observes one persisted answer, reruns/reloads without duplicates and verifies the human ask remains Open. `conversations-agent-stored.spec.ts` creates real historical answers through that same worker and checks off-state rendering and different-reader terminal reasons. Existing `conversations.spec.ts` supplies human navigation and context regression proof.

## Failed attempts and baseline comparison

Meaningful red tests preceded implementation: Agent composition/duplication/serialisation cases failed; picker and presentation exports did not exist; server availability/R8 cases lacked their DTO/enforcement; the warning browser case posted without a dialog. The new warning validation case failed before its strict acknowledgement schema existed. A later phone geometry test failed with the picker bottom at 843.7 px below the editor at 412.1 px; the above-composer picker and touch Close control now pass it.

The first full unit run also exposed a contribution-owned catalogue dependency binding, fixed without hiding fixtures or weakening the allowlist. The final run has only these three failures: P06 private adapter write-once/exact hashes and source lookup (`ExactDocumentUnavailable`), and P12 recovery path ordering (`Unsafe recovery directory` instead of the expected outside-Git reason). A fresh worktree at unchanged main `bb5da7d1`, real `npm ci`, and `node --import tsx --test tests/unit/document-store.test.ts tests/unit/recovery.test.ts` reproduced exactly those three failures (one pass, three fail); its Git tree remained clean. No aggregate local unit pass is claimed.

Other contribution/setup corrections are retained: the first database fixture revoked an unrelated shared capability instead of Activity read; initial human browser selectors assumed every option was a person; a browser skip callback had an invalid two-argument signature; and the stored-answer helper omitted loading `.env.local` when the test process did not receive it. The last issue was found by [compiled desktop CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39714138308/job/119612777373), not attributed to main. The helper now loads the ignored local file only when DATABASE_URL is absent and retains the disposable-database guard.

The first compiled local attempt inherited assistant-on from local flags: 67 pass, nine skip, two off-state assertion failures. Explicitly setting the compiled server off produced 69 pass, nine skip before the final picker amendment. No production guard or launcher was weakened. A cold development rerun after that amendment had 14 pass and two desktop assertion timeouts while routes compiled; the unchanged warm rerun passed 16/16, followed by the citation scroll proof. The final compiled run without env preloading initially defaulted the ignored local config to port 3000 instead of the owned server's 3147; that connection-refused setup attempt was stopped and retained as `browser-compiled-delivery.log`. The same inventory then passed 69 cases with nine intentional skips using an explicit local base URL. An accidental broad browser filename match and the memory-stopped full database attempt remain incomplete attempts. No deadlines, assertions or inventory were relaxed.

Raw original attempts are retained in ignored `tmp/t2c/`: `unit-full.log`, `unit-final.log`, `baseline-unit.log`, `database-full.log`, `database-focused.log`, `http-focused.log`, `browser-r8-red.log`, `browser-picker-position-red.log`, `browser-agent-first.log`, `browser-compiled.log`, `browser-compiled-final.log`, `browser-enabled-final.log`, `browser-enabled-warm-final.log`, `browser-worker-scroll-final.log` and CI diagnostic logs. Local paths are provenance, not public evidence links or secret-bearing log exports.

## Visual evidence and limits

Codex inspected browser-rendered 1440, 1024, 390 and 320 px captures. Cards, attribution, sources, gaps/coverage and count-only omissions were checked against the [approved W3 amendment captures](../../../reference/ui/my-work/conversations-t2-w3-r01/README.md). At 320 px attribution stacks and a long source label truncates with its permitted accessible name intact. The picker opens above the composer; warning buttons, source links and tagging tools have phone touch targets of at least 44 px. Keyboard selection, atomic backspace, Escape, focus return, warning cancellation, draft changes during preflight, wrong-thread late reads, denied refreshes, scrolling and no horizontal overflow have browser assertions.

Thirteen unmodified PNGs and exact SHA-256 hashes are retained in [captures.json](captures.json), linked to application/test source `556355218102e18c6512fa6369164ba7d3fe3263`. The compiled captures contain mocked presentation fixtures and real stored answers; the enabled worker captures show a real UI post and recovery. Phone screenshots are viewports of the scrolling workspace, not stitched pages. The worker has separate answer-top and source-scrolled views.

| Evidence | Captures |
|---|---|
| Mocked answer, turn states and responsive source projection | [1440](mocked-answer-1440.png), [1024](mocked-answer-1024.png), [390](mocked-answer-390.png), [320](mocked-answer-320.png) |
| Mocked AI/human Carl picker | [1440](mocked-picker-1440.png), [390](mocked-picker-390.png) |
| Mocked count-only participant warning | [1440](mocked-warning-1440.png), [320](mocked-warning-320.png) |
| Real stored answer, compiled/off application | [1440](persisted-stored-1440.png), [390](persisted-stored-390.png) |
| Real enabled UI post, original recovery, worker and human ask | [1440](persisted-worker-1440.png), [390 answer top](persisted-worker-390.png), [390 sources after scrolling](persisted-worker-sources-390.png) |

The current T1 shell/context breakpoints and compact phone header remain. People have stored names and Role not recorded because no assigned role exists. Public/offline captures use the white AI fallback, with the private Kit disabled. P3 takes precedence over outdated partial-answer/reason/automatic-retry illustrations. These are disclosed implementation adaptations, not new acceptance. No page/component review fingerprint was copied or marked accepted. Guides remain Draft; physical-device, screen-reader and Dean's visual acceptance are not claimed.

## CI and review

CI results belong to the published head: use [PR checks](https://github.com/deanrfiedler-gif/powerplants-one/pull/660/checks) and the delivery snapshot in the PR description for final counts and links. Earlier head `d548ccb0` passed the merged-tree check; its compiled stored-answer fixture failure above has a concrete fix and a successful final local replay without env preloading. The locked npm advisory job timed out twice at the registry bulk endpoint (five-minute timeout); a local runtime audit succeeded. [Original/retried advisory run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39714138229). No failing external check is called passed.

The seven configured branch-protection contexts were read during delivery: documentation foundation; CRM desktop/mobile persistence; CRM header/board visuals; compiled desktop/mobile aggregate; E1 manual estimate/output/restart; Email Calendar persisted journey/permissions; and P01–P11/CRM application/PostgreSQL aggregate. The application aggregate retains all eight database shards plus ordinary desktop/phone and HTTP/restart groups. CI inventory, assertions and deadlines are unchanged.

The PR remains draft. The independent review and its later correction are recorded below; CONTRIBUTING requires different-model review before merging security-control changes. The T2b waiver is not reused. Dean decides acceptance and merges; simulated implementation delivery establishes neither business acceptance nor production readiness.

## Independent review and subsequent correction — 22 October 2026

Claude (Opus 5.5) reviewed `79092a4d245c4817ebec3968a0ea8fcedc1d215b`, merge-base `002af00e`, and posted [one Low finding](https://github.com/deanrfiedler-gif/powerplants-one/pull/660#discussion_r4345608937): the R8 basis was an enumerable unkeyed digest of source access. No record content was exposed. The reviewer found no other defects in P1/P3/P4 projection, Carl availability, composition, lifecycle or R8 enforcement, confirmed that head's 72 passing checks and one intentional skip, and ran the 19 focused unit cases successfully. Database, HTTP and browser suites were not rerun locally because of host load. This is evidence for that commit only, not acceptance or a production claim.

Codex reproduced the finding in `conversations-participant-warning.test.ts`: enumerating three cited sources with one withheld identified exactly the colleague's two readable records. The initial regression run had two passes and that one failure (`tmp/t2c/review-r8-red.log`). HMAC-SHA-256 with a random 256-bit server-memory key replaces the public digest. Its existing data binding and DTO remain; restart requires fresh preflight, with original-operation recovery retained. The corrected affected unit inventory passes 22/22 (`review-r8-unit.log`). An additional HTTP proof checks GET-to-POST key consistency, rejection of another process's basis before participant writes, one saved/replayed post and the new reader's withheld sources. The HTTP file runs exclusively to isolate its temporary grant expiry, restoring the original grants afterwards.

At this correction the machine had less than 1 GB available RAM initially and later about 1.5 GB at 94% CPU load. No heavy local database/browser/build rerun was started under that load. The prior completed results above remain tied to the earlier application source; the new HTTP proof and current-head heavy checks must be judged by their actual execution results in the [PR handover/checks](https://github.com/deanrfiedler-gif/powerplants-one/pull/660/checks), not inferred from earlier passes. The unchanged UI captures remain evidence for their recorded source, with no new visual acceptance claimed. The post-review correction has not received independent follow-up review.

Main `ab2142d1` was integrated after the review. Its documentation-source rule retains the fragment sources and main's protected landing pages; generated combined views now remain ignored. No application changes came from that main integration.

## Follow-up review and remediation — 22 October 2026

Claude (Opus 5.5) reviewed `6ed76b12ac3acb6881c295e080d1cd3cf51023aa` against first parent `26aecfd3`. The original Low enumeration finding is addressed in code. Its scratch probe confirmed same-process key sharing and different-process basis rotation. The reviewer ran 22/22 focused units; no database, HTTP or browser suites were rerun locally. The review covers that commit only.

Both new findings are accepted: [Medium: non-existent grant column in the HTTP fixture](https://github.com/deanrfiedler-gif/powerplants-one/pull/660#discussion_r4346563464), and [Low: retained-post retry blocked by key rotation](https://github.com/deanrfiedler-gif/powerplants-one/pull/660#discussion_r4346563659). Final CI at that reviewed head is 68 pass, one intentional skip and four failures: HTTP, compiled desktop-2, and their two aggregates. HTTP failed before the 28 later exclusive files. The Specialist dialog failure has the earlier symptom but no confirmed cause; it is not labelled a proven baseline. These failures supersede the earlier green result for current-head assessment.

The fixture now uses the live `valid_from`/`valid_to` fields and restores exact timestamp strings. The retained-original flow requires a fresh explicit warning review after the exact server refusal, checks its receipt first, and keeps the same operation, message, tags and asks. Only validated acknowledgement metadata changes; compare-and-replace guards the active journal snapshot. A delayed original receipt wins, including a conflict after the reviewed post. A newer draft remains untouched. The HMAC and production/off guard are unchanged. Current main `e9f28b69`, including Nursery N1 migration 0116, is integrated; this correction adds no migration or grant.

Author validation so far:

| Proof | Observed result |
|---|---|
| Test-first journal cases | Two failing cases before implementation; failure log `review-followup-retry-red.log` retained |
| Focused new journal/domain plus affected T2c/shared units | 35/35 pass (`review-followup-unit.log`) |
| Application and test TypeScript | Pass with `NODE_OPTIONS=--max-old-space-size=8192` |
| Focused lint | Pass for changed source/test files |
| Status sources, naming, foundation, migration numbering | Pass; foundation checked 12,973 links and 7,041 text files; 97 status fragments |
| HTTP projection case | Passed in the first attempt |
| HTTP opaque-basis/replay case | First attempt stopped in the existing worker before R8 assertions; all six worker stages then passed in isolation. Exact R8 rerun passed, including 409 refusal, 201 save, 200 original receipt replay and withheld-source read. Original failure retained; cause unconfirmed. No complete HTTP-suite pass is inferred. |

The first browser implementation attempt reached saved messages and preserved draft/focus, but its four new cases compared untrimmed request text with canonical stored text; that test expectation was corrected to the existing trimming contract. A subsequent run had five passes and one connection reset during fixture insertion. The extra just-before-repost race setup was inspected and found absent, so no coverage claim is made for that initial variant. Its corrected setup, final broader browser outcome, rendered captures and remaining local/CI checks must be recorded from actual results below. Existing assertion deadlines and the production guard remain unchanged.

The broader enabled local-synthetic browser run executed all four affected files: **75 pass, seven viewport-specific skips, two initial desktop failures** (resolve/reopen and draft after reopen). Both failures were 5-second UI assertions, with no assertion/deadline changes; both passed unchanged on exact replay. The first resolve route spent three seconds compiling. Timing/load is plausible but no confirmed unchanged-main baseline is claimed. The broad run includes desktop/phone persisted historical projections, the real UI → queued turn → existing worker → refreshed answer with citations, human ask preservation, exact navigation/context, drafts, denied reads and stale responses.

After inspecting and correcting the missing just-before-repost fixture setup, the final targeted browser run passed **5/5 desktop** (three recovery races plus those two existing cases) and **3/3 phone**. The six recovery cases exercise no prior commit, a commit before confirmation/receipt lookup, and a commit after lookup just before the reviewed POST. Every path preserves the same operation, one persisted original message, one turn, the person's open ask and a newer draft. Cancel returns focus; successful recovery focuses Message. At 390/320 all warning buttons are at least 44 px; horizontal overflow is absent. These cases mock only the restart refusal and warning projection; final posts, operation receipts and effect counts are real. They are not an actual process-crash simulation. The separate passing HTTP case proves a real different-process basis refusal.

Rendered original-message warning captures at 1440, 390 and 320 were inspected by Codex: plain-text original/Agent/person/ask preview, count-only sources, wrapping controls and readable content within the viewport. The state reuses R8's existing native dialog and has no separately accepted Figma frame. Development-harness capture evidence does not grant owner acceptance or a review fingerprint. Earlier captures and their source manifest remain unchanged.
