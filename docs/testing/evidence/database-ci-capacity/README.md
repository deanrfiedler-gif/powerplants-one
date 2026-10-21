# Native database CI capacity

Scope: Dean's separate database-2 CI timeout repair, draft implementation PR [#658](https://github.com/deanrfiedler-gif/powerplants-one/pull/658), branch `codex/database-ci-timeout`, originally based on main `f13bd157835c3fb511885cefae321ba98cc32d86`. The documentation-only claim [#657](https://github.com/deanrfiedler-gif/powerplants-one/pull/657) was externally merged by the owner account before the implementation push. The branch then integrated current main `8da0762e`; that merge adds claim/integration documentation only. The [existing isolation decision](../../../decisions/ci-retained-suite-isolation.md#native-database-capacity--21-october-2026) records the approach and alternatives. Conversations #654 and Facilities #627 remain independent.

## Diagnosis

Conversations source `63087e41f5657e1680bf8e0ac571cb1a9c8ef690` changed no application, database tests, scripts, workflow or dependencies compared with baseline `bd5d6e6c`. Its [Application assurance run 39582337742](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39582337742) did not complete: GitHub annotated database-2 with “The job has exceeded the maximum execution time of 1h30m0s”. The database phase progressed from 10:37:15 to cancellation at 12:00:55 UTC on 21 October. Its final log summary reported 448 tests passed, zero failed. The job and aggregate did not pass; later phases were not executed.

The unmodified-main [control run 39560221696](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39560221696) passed. Whole-job durations from GitHub metadata:

| Native lane | Main `bd5d6e6c` | Conversations `63087e41` |
|---|---:|---:|
| database-1 | 41m10s | 64m03s |
| database-2 | 78m44s | 90m07s, cancelled |
| database-3 | 85m21s | 85m01s |
| database-4 | 63m56s | 62m49s |

The timeout was not reproduced on main. Different runner durations and limited headroom are observed; no database deadlock, test assertion regression or cause of runner variation is claimed. The timed-out lane was still completing cases rather than failing an individual test deadline.

## Repair and local verification

The workflow selects eight native Node shards over the same complete glob. The unchanged shell command runs files serially against each lane's independent disposable `ppo_synthetic_test`, with 120-second individual deadlines and the original 90-minute job deadline. Every lane remains mandatory in the original aggregate; fail-fast stays disabled. Every other parsed workflow field and command remains identical to the baseline.

Run the retained probes from the repository root:

```sh
node docs/testing/evidence/database-ci-capacity/native-selection.mjs
python docs/testing/evidence/database-ci-capacity/validate-workflow.py
```

The first probe imports plain synthetic markers using Node 24's native support for their real `.test.ts` filenames; it never imports or executes a database test. It checks four-way/eight-way membership, no missing or repeated file, and a newly discovered deliberate failure. It omits the unnecessary `tsx` application loader from these markers; the separate whole-workflow comparison proves that the real CI command retains that loader unchanged. Its result is selection proof, not database behaviour. An initial local probe with `tsx` exceeded the marker harness's 120-second process budget during the original four-way selection on Windows; that attempt did not pass. The final lightweight marker harness retains the same file-selection, serial execution and test-deadline options. The local workflow validator uses the verification environment's existing PyYAML, compares the complete parsed workflow and executes the aggregate's actual shell for positive/negative outcomes. It checks Bash syntax for every retained shell step. No application dependency is added.

Local results on Windows with Node 24.22.0:

- **Passed:** [native selection](native-selection.json), all 184 files exactly once, 23 files in each of eight shards. Every old lane equals the union of two new lanes. Adding a 185th failing marker produces exactly one nonzero shard; it is an expected negative control.
- **Passed:** [whole-workflow comparison](workflow-validation.json), only the four-to-eight matrix extension differs in parsed YAML. All 60 retained shell steps pass Bash syntax; the actual aggregate accepts success and rejects failure, cancellation, skipped and missing results.
- **Passed:** targeted ESLint for the new JavaScript probe, naming consistency, generated-status consistency and diff checks.
- The full foundation check was started and remains running at this evidence checkpoint. Its completed outcome and exact repair-head CI results belong in the PR verification report; it is not claimed as passed here.

Real Linux application/database and remaining PR checks must run on the pushed repair commit. Local full lint, typecheck, unit, build, browser and database suites were not rerun for this matrix-only change; CI retains those checks. No actionlint executable was available locally; parsed YAML, whole-workflow comparison and actual Bash syntax/aggregate execution are the local configuration checks.

## Delivery and review boundary

CI results are pending for the repair commit. Configuration proof does not establish a completed database suite. The original cancellation remains incomplete evidence. No test, reference, deadline, assertion, permission, migration, runtime dependency, application behaviour or production service changes. No merge or deployment is authorised. Owner visual review of the separate pages remains pending; no independent review or business acceptance is claimed here.
