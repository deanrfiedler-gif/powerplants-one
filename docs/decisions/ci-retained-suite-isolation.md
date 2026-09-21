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
