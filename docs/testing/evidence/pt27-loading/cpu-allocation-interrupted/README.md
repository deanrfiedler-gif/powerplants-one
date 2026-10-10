# PT-27 CPU allocation pre-measurement failure

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23. [Decision](../../../../decisions/pt27-loading-performance.md#cpu-allocation-comparison--11-october-2026).

[Run 38091640985](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38091640985), source `3a626e69f4755b56aca200a98146baaa0f62b8c3`, passes the application build, fixed synthetic fixture preparation, compiled diagnostic smoke and two TypeScript profile guards. It fails the Python process-role unit test before invoking the comparison driver. **Zero measurement samples were collected.** This is a test defect, not an application failure or the original HTTP 503 reproduction.

The test asserted directory enumeration order. Linux returns the correct browser/driver process membership as `[13, 10]` while Windows returned `[10, 13]`. The repair checks exact unordered membership for both roles, preserving the server-before-driver ownership assertion, thread-affinity violation assertion and private-name exclusion. Application, sampler, deadline and ten-browser workload code are unchanged by that repair. A fresh whole block is separately declared; this failed execution remains retained.

[Summary](summary.json), [captured step log](comparison-step.log.gz), [CI provenance](ci-provenance.json) and [six-file integrity manifest](artifacts.json) retain the fixture, redaction report, compiled smoke and failure output with stored/original SHA-256 hashes. The step log is rendered `gh run view --log-failed` text captured locally; the five downloaded artifact files retain their original bytes. The private-value scan passes. No readiness result, performance gain or acceptance follows from this attempt.
