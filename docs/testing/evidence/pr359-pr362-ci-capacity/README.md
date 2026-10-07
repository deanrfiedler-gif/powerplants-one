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

## Integration with current main

The preceding validation belongs to first repair checkpoint `671c2a2`, before integration. GitHub could not start its PR checks because the branch conflicted with newly merged Products on main `9f06bef`. That main already contains equivalent browser/E1 separation plus four native database shards. The integration adopts both workflow files byte-for-byte from main, including renderer installation for both E1 groups and database-generated evidence upload. This supersedes the initial workflow spelling while retaining its intended repair.

Conflict resolution preserves both Products and Sales receipt authorities and exact upgrade expectations: Products 0052 plus Leads 0073/0074, followed by 0075/0076 on the stacked Deal branch. Existing Products grants, users, seed ordering and live design records remain. No new migration or permission is introduced by this repair. Combined-source validation is recorded in separate integration evidence; earlier workflow-only test counts do not describe the larger integrated suite.

An initial local upgrade invocation was refused because the disposable connection omitted the password field required by the existing configuration guard. After supplying the synthetic fixture value, the checks run only against a new loopback PostgreSQL instance on port 55439 and database `ppo_synthetic_test`. No existing local or hosted database is reset. A temporary text-encoding error in the newly appended decision paragraph was corrected before publication; foundation then passed. The original source snapshots remain unchanged.

### Lead integration checkpoint

[Lead integration results](integration-lead.json) record tested code `cfa621f`: 16 selected cross-domain/demo upgrade cases, four Products/Estimating receipt authority cases and 11 focused registry/Products/Leads units pass. Build, TypeScript, lint, workflow lint and foundation/prototype/naming/studio checks pass. The two adopted workflows exactly match main `9f06bef`; both aggregate commands reject failed, cancelled, skipped and missing dependency results. Studio retains 350 unreviewed entries; integrity success does not grant visual acceptance. No full local browser run is claimed.
