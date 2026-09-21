# Retained Application assurance isolation

**Decision:** 22 September 2026 · **Scope:** PR #272 assurance repair requested by Dean; synthetic CI only.

## Evidence and problem

Application run [35609271386](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35609271386), source `39d65283a295efc6bc9b9cc5314dd66eaf78df0d`, failed its first attempt on mobile Intake while permitted records were loading. The same assertion failed on unchanged main `af3f045` in run [35597947794](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35597947794). On the second attempt Intake passed, but CRM identity readiness, Email/Calendar identity controls and the Finance work-order form were still loading at their existing deadlines. Two subsequent Finance failures depended on the first case's missing reconciled fixture. Original artifacts and both attempts remain failed evidence.

The second attempt ended as **cancelled**, about 151 minutes after starting, with the full database suite still running after 61 minutes. Later generic persistence, HTTP and offline phases did not run. Five development-server warm-ups took 221–374 seconds each. These observations establish a serial budget problem and development-server readiness failures; they do not establish a memory leak or the cause of variable runner latency. The separate compiled run [35609271234](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35609271234) passed all 240 applicable browser cases, with 41 configured skips, on the same source.

## Decision and alternatives

Partition the existing primary job into four matrix lanes. Each gets its own runner and disposable `ppo_synthetic_test` service, with unchanged pinned dependencies. Preserve serial execution within each lane, every original command and all actual application/PostgreSQL/browser restarts:

| Lane | Retained phases |
|---|---|
| Browser | Mobile CRM database/browser, focused I2, CRM I1 restart, full desktop/mobile browser suite |
| Finance | Focused P10 browser, original claim/reconciliation restart, Finance database suites |
| Reports | Reset refusal guards, P09 submission/response restart, focused report browser |
| Database | Entire database suite, reset, generic persistence restart, startup refusal, HTTP and quality HTTP, offline restart |

The stable **P01–P11 and CRM I1–I2 local application and PostgreSQL proof** check depends on the whole matrix and fails unless every lane succeeds. Matrix fail-fast is disabled, each lane has a 90-minute limit, and evidence artifacts have distinct names. Existing four focused P11 jobs remain unchanged. No phase becomes optional and no passing retry is substituted for a failed test.

Use the existing `playwright.compiled.config.ts` for the five primary browser invocations. This supersedes the earlier [decision to retain the primary development-server browser step](ci-compiled-browser-suite.md) for this repair. Test selection, browser channel, viewports, assertions, deadlines and warm-up remain unchanged. The standalone compiled check remains. Development-mode coverage continues in the focused P11 jobs, other module workflows and the unchanged restart/HTTP launchers. The local launcher and its production/shared-startup refusal are unchanged.

Simply increasing the 150-minute limit would leave unrelated phases competing for one serial budget. Adding retries or extending page assertions would obscure readiness failures. New infrastructure, browser dependencies and application changes are unnecessary: the repository already has the compiled launcher and isolated PostgreSQL service pattern.

## Independent fixture correction

Unchanged main's MW-DB01 date-only validation case used `now + 60 minutes` as a start and today's end as its finish. After 23:00 Brisbane, start exceeds finish, so the earlier interval validation correctly reports `starts_at`, while the test expects `due_date_only`. Use one hour before that same finish to isolate the intended contradictory date-only appointment input at any execution time. Production validation and the asserted error field are unchanged.

## Verification and limits

Local verification on Node 24.21.0/npm 11.19.0: actionlint 1.7.12, TypeScript, full ESLint, foundation and naming checks pass. A command inventory comparison confirms all 103 original primary command lines remain after normalising the five compiled-config additions; the four focused P11 jobs match the parent. The original 23:39 input reproduces `starts_at`; the corrected input produces `due_date_only` at all 1,440 minutes. Ten focused My Work units pass. The full local unit run has 201 passes and four Windows failures in document storage, recovery paths and route separators; the same failures reproduce in the unchanged main test/source versions. Fresh Linux CI remains the full-unit proof.

Database and browser execution use CI's isolated services, avoiding the other local worktree's database. Current-source run IDs and final results belong in PR #272; this decision is not a claim that a pending run passed. Business acceptance and deployment remain separate.

## Follow-up: await the original My Work read

On `7d4234a`, all four focused P11 jobs, Finance, Reports and the standalone compiled suite pass. The primary browser suite passes 239 cases and fails the last phone My Work case after switching to Coordinator. Its original screenshot shows the identity loaded, while the overview still has `aria-busy=true`. Retained numeric diagnostics show request 29062 started at 19:59:05.981 UTC and remained pending until the test closed it 5,232 ms later. The other scoped reads complete within 189 ms, with the application process largely idle and over 13 GB of system memory free. The record does not establish why this particular read was slow; replacing development compilation alone does not eliminate this assertion race.

The phone test's `open()` helper now registers a listener before navigation, awaits the original overview GET's successful response and body completion, then runs the existing five-second rendered-state assertions. No response is retried, no data is substituted and neither the assertion nor overall test deadline changes. The last Coordinator transition deliberately holds the real overview response for six seconds to exercise this order on every run. The preceding unavailable-source checks and all permission, count, layout and navigation assertions remain.

Original failed evidence is retained in Application run `35646044941`, artifact `10661096608`. The screenshot, JSON result and allowlisted request/runtime events were reviewed. Fresh corrected-source CI must prove this follow-up; the failed checkpoint remains separate from its result.

## Focused quality cleanup headroom

On `c01dc5e`, both full compiled browser runs pass 240 cases with 41 configured skips. The delayed phone My Work case passes once in each (9,217 ms standalone; 9,053 ms primary). The separate **P11 focused integrated quality and access proof** job in run `35649420044` records success for every test, evidence upload and cleanup step, yet its conclusion is cancelled: it starts at 20:10:42 UTC and completes at 20:40:44, two seconds beyond its 30-minute limit. The selected journey, retained Finance and final quality phases report 3, 7 and 13 passes respectively. Its three cold development warm-ups take 275,329, 270,153 and 278,703 ms, totalling 13 minutes 44 seconds.

Give this focused job 35 minutes, retaining its development-server configuration, all commands and individual assertion/test deadlines. This is bounded headroom for the measured complete job and evidence cleanup; it is not a rerun policy or a changed performance acceptance limit. The primary four-lane isolation remains, and the other three focused jobs remain unchanged. The cancelled check is retained as such, despite its successful component steps; the next source must receive a successful check conclusion.
