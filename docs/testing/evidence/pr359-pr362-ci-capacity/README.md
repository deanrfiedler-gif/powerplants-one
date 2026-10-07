# PR #359 and #362 CI capacity repair

**Owner:** Dean Fiedler. **Review:** configuration repair; owner/business acceptance and deployment are separate. **Date:** 7 October 2026.

## Original observations

| Source | Job | Observed result |
|---|---|---|
| #359 `1343f5b9c88322f56ba6cd09e3c9aad72645f5c3` | [Primary browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37583211941/job/112667386902) | GitHub's 90-minute execution-limit annotation; phone tests still progressing; cancelled and incomplete |
| #359 same head | [Estimating E1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37583211929/job/112667387303) | GitHub's 30-minute execution-limit annotation; database phase 17m25s; cancelled during ES-08, later fertigation browser phase skipped |
| #362 `f309c04487c0df396ee202a2a3f7b6912c578b1d` | [Primary browser](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37608506386/job/112749768579) | Full browser phase: 678 passed, 79 configured skips; GitHub's 90-minute execution-limit annotation; job cancelled |

Both Application aggregate failures follow their cancelled browser lanes. #359's other 46 checks and #362's other 47 checks succeeded at this observation. #362's unchanged Estimating job succeeded in 27m37s. The logs and annotations were read directly through GitHub; raw logs remain outside this public source tree. These timings establish inadequate job headroom, not an application performance diagnosis.

## Repair and validation

The [decision](../../../decisions/ci-retained-suite-isolation.md#leads-and-deals-browser-and-estimating-budgets--7-october-2026) retains every command and actual restart boundary. Application browser project selection uses Playwright's existing project discovery, including future matching files; no filename allowlist is added. Estimating retains its original exact database and runtime commands on independent databases, with the existing clean reset beginning runtime proof. Aggregate check names remain stable and require all lanes to succeed; artifact names distinguish the new lanes.

Local workflow lint, command-preservation and native Playwright discovery comparisons are recorded in `validation.json`. Discovery enumerates tests without running them. Foundation, prototype, naming and development-register checks are recorded separately from CI. No application or database suite is claimed as rerun locally for these workflow-only changes. Fresh GitHub execution on both updated PR heads remains required; the original cancelled jobs remain failed/incomplete evidence.
