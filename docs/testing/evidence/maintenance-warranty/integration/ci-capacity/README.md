# Maintenance integration CI capacity repair

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation diagnosis; fresh repaired-source CI and normal PR review remain required. This follow-up changes test distribution, not application code, migrations, fixtures or assertions.

PR #357 head `e17aca5b1fb2cc6241f709d11030162fa2dcc2f6` completed **49 successful checks, one cancelled database job and one failed dependent aggregate**. [Database-2](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37562875301/job/112603912391) reached the unchanged 90-minute job limit. Its test phase began at 02:42:26 UTC and recorded 436 passing cases, no failed assertion and no individual test timeout. The last passing result arrived at 04:07:51.745 UTC; cancellation followed at 04:07:53.621. No completed runner summary exists, so this is incomplete proof. [Database-1](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37562875301/job/112603912386) passed 437/437 in an 80m16s test phase.

The unmodified main comparison `fbf2ed39b0686a52d286aa55c6cfb8549672f569`, [run 37560099482](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37560099482), passed database-1 (560 cases, 54m37s job) and database-2 (396 cases, 84m09s job). The original two-shard arrangement has insufficient headroom for this combined tree. Test completions continue throughout the cancelled run; the evidence does not indicate a hung case. Variable timing and file reassignment prevent attributing a per-domain application performance regression to this change.

The [existing isolation decision](../../../../../decisions/ci-retained-suite-isolation.md) now distributes the entire database glob over three native Node shards. Every file remains serial within its isolated database. The original 120-second test limit, 90-minute job limit, all assertions and the mandatory aggregate remain. Fail-fast is still disabled. No failure is converted into a passing retry or omitted test.

## Retained diagnostic evidence

[Observations and final-head checks](observations.json) record exact source, run/job IDs, timestamps, completion gaps, case counts, complete summaries where present and SHA-256 hashes. Retained text contains only timestamped database case results, summaries and cancellation; setup/environment lines and unrelated phases are excluded. Full downloaded originals and the original database-2 artifact are retained privately. The original GitHub artifact is `P11-database-2-foundation-evidence`, ID `11460431927` (run 37562875301).

- [Cancelled contribution database-2](ci-e17aca5-database-2.txt)
- [Completed contribution database-1](ci-e17aca5-database-1.txt)
- [Completed current-main database-1](ci-main-fbf2ed3-database-1.txt)
- [Completed current-main database-2](ci-main-fbf2ed3-database-2.txt)

## Selection verification

Run `node docs/testing/evidence/maintenance-warranty/integration/ci-capacity/shard-selection.mjs` from the repository root. The [probe](shard-selection.mjs) creates synthetic marker files using every real database test filename, then executes the pinned Node runner with the existing serial/deadline arguments. It imports no application test or database helper. The [result](shard-selection.json) checks the old and new partitions for exact union and no duplicates; an additional automatically discovered failing marker must make exactly one shard exit nonzero. Temporary fixtures remain under ignored `tmp/` for diagnosis.

This verifies file selection and failure propagation only. It does not execute database cases. Fresh repaired-head CI must pass all three real database jobs and the unchanged aggregate. The original e17aca5 cancellation remains visible; the earlier local Maintenance and restart evidence remains source-bound to `34aa32a`.

Local [validation](validation.json) passed foundation and naming checks. A complete parsed workflow comparison permits only the database matrix entries to differ from `e17aca5`; source, migrations, tests and dependencies match exactly. [Artifact hashes](manifest.json) preserve the published evidence bytes. No application rebuild or repeated browser run is claimed for this configuration-only repair.
