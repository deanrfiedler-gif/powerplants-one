# Conversations navigation verification

Date: 21 October 2026. Scope: Conversations T1c-2 top-bar navigation, separate from Facilities CS-05 PR #627. Owner visual review remains pending; no deployment or business acceptance is claimed.

## Failure and accepted behaviour

The [compiled desktop retry on Facilities head 95596877](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39532224280/attempts/2) completed with 549 passes and one failure in `tests/browser/conversations.spec.ts`: the top-bar test expected `/conversations` but received a thread address. The same test passed in [Application assurance 39532224257](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39532224257), which subsequently passed in full, including its last database-2 job. All Facilities cases passed in both desktop runs.

The accepted [T1c design section 5.2](../../../decisions/conversations-t1c-design.md#52-pages-and-components), existing page contract and unchanged `ConversationsHome` agree: desktop automatically opens the preferred thread; phone opens the list. The old assertion could pass at the intermediate list URL or fail after the desktop redirect. On unchanged application source from main `bd5d6e6c`, all six local baseline repetitions passed (three per viewport, 1.2 minutes); this does not reproduce the compiled CI failure locally or disprove the timing race.

## Repair

The test uses the existing synthetic API fixture to create a new thread waiting on the viewer. It asserts the top-bar link's root address, then the exact fixture thread destination on desktop. Phone must show the populated list with its unread count unchanged, then reach the exact thread through its real list link. The artificial direct navigation to the thread is removed.

The proof waits for the successful mark-read response before checking the unread count. An intermediate local attempt reached the correct destination but failed one badge poll: the trace showed a pending mark-read request and a 4.48-second badge read. The acknowledgement makes the command boundary explicit without changing the standard 45-second test or 5-second assertion deadlines. Existing badge presentation, current-page, phone header, permission and 320 px checks remain in place. There are no application, shell, workflow, dependency, migration or capability changes, and no Facilities or assistant-core files are changed.

The existing Conversations page contract, register and Australian English guide describe the accepted destinations. No new component or design decision is introduced; the shared shell action, `ConversationsHome`, `ThreadSidebar` and native thread controls remain unchanged.

## Verification

Local runtime: Windows, Node 24.22.0, Playwright 1.64.1 and Chrome 156.0.8078.48. Browser proofs use an isolated task-owned PostgreSQL 16 `ppo_synthetic_test`, existing migrations/seeds and real persistence. No shared database is reset. No credentials, browser traces or icon artwork are retained here.

- Passed: all 38 Conversations unit cases.
- Passed: final navigation test repeated three times on desktop and three on phone, six passes in 39.9 seconds, using the development server and existing deadlines.
- Passed: full `npm run lint`, `npm run typecheck`, standalone `npm run build`, `npm run studio:check` (366 entries / 48 components), naming, foundation (73 fragments / all 78 parent IDs / 13,062 local links), generated-status consistency, status/build-sequence generation and `git diff --check`.
- `npm run check` stopped at the full unit suite: 972 passed / four failed out of 976 in 110 seconds, so it is **not a pass**. Build was then run separately and passed. A clean detached checkout of unchanged main `bd5d6e6c` ran the same full unit command: 973 passed / three failed in 96.5 seconds, reproducing both document-store `ExactDocumentUnavailable` failures and the recovery directory error-message mismatch. The fourth repair-tree failure was the CPQ package workload's execution budget; it passed in main's full run and all three focused CPQ package cases passed on the repair tree (8.6 seconds). No unrelated test, deadline or implementation was changed. The CPQ failure is recorded as intermittent, not as a confirmed failing main test.
- Passed: the full Conversations browser file against the compiled app, **55 passed / seven existing viewport-specific skips in 2.5 minutes**. Command: `npx playwright test tests/browser/conversations.spec.ts --config playwright.compiled.config.ts --no-deps --reporter=list,json`, with the task-owned loopback server on port 3037. Desktop 1440 px, tablet 1024 px and phone 390/320 px cases include the exact top-bar handover, unread badge, permissions, reply/resolve, failure recovery, context panel and keyboard/focus controls. The same standard deadlines and one worker are retained; no skip was added. Linux CI remains a separate result.
- Linux CI at the final repair commit: pending. Earlier Facilities results are evidence for that commit only, not a pass for this separate repair.

The local baseline and intermediate failed attempt above are retained as limits, not counted as passing verification. Owner review and guide acceptance remain pending.
