# PT-27 rejected affinity-only CPU comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23. [Decision](../../../../decisions/pt27-loading-performance.md#cpu-allocation-comparison--11-october-2026).

[Run 38093405232](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38093405232) at `975c7e33f19c1af6797f3cc5f4e4128bc76a2db2`, build `KjRI0Tg1wcRm7HIoqnfq_`, completes all **320 directory loads and 80 real record openings** with the fixed fixture and no observed application/readiness errors. However, its allocation guard fails both constrained positions: **520 and 484 sampled thread-affinity violations** in the browser/driver role. These count repeated sampled observations, not unique threads. App and database roles have zero violations; shared positions have zero violations.

Some Chrome threads expanded their allowed CPUs to `[0,1,2,3]` despite starting under taskset on `[1,2,3]`. The reserved service CPU was therefore accessible to browser work. **Reject this as an isolation comparison.** The raw timings remain retained but do not justify a latency, service-capacity or original-503 conclusion. The summary marks the allocation invalid and excludes the constrained positions from interpreted timing groups; their original successful action samples remain unchanged in the compressed inputs.

[Summary](summary.json), [CI provenance](ci-provenance.json) and [49-file integrity manifest](artifacts.json) retain every position, fixture, manifest, screenshot, external counter, smoke and redaction record. All stored/original hashes and the private-value scan pass. The earlier [pre-measurement test defect](../cpu-allocation-interrupted/README.md) remains separate.

The next whole block adds an owned kernel CPU-set cgroup for Chrome in all four positions, with the same allowed CPU lists and pinned binary. It retains original browser arguments, ordinary user identity, app/driver placement, workload, network conditions, assertions and deadlines. Effective group CPUs and every observed thread mask must agree. No application correction or acceptance is inferred from this rejected attempt.
