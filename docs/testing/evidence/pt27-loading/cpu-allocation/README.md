# PT-27 verified logical CPU allocation comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, CS-01/CS-02. [Decision](../../../../decisions/pt27-loading-performance.md#cpu-allocation-comparison--11-october-2026).

The logical-CPU constraint is verified, but it is **not a useful latency correction**. All **320 directory loads and 80 actual record openings** pass, the fixture is preserved, and every sampled role reports zero affinity violations. All cold groups still exceed three seconds. Restricting app/database work to one logical CPU nearly doubles record-opening time. No application correction is adopted from this result.

## Results

Seconds, nearest-rank p95. Cold/record n=10 and warm n=30 per viewport and position. No pooling or substituted samples.

| Viewport/action | Shared A1 | Service 1 / browsers 3 B1 | Service 1 / browsers 3 B2 | Shared A2 |
|---|---:|---:|---:|---:|
| Desktop cold | 5.908 | 4.529 | 4.479 | 4.489 |
| Desktop warm | 2.511 | 2.456 | 2.606 | 2.507 |
| Desktop record | 2.492 | 4.780 | 4.715 | 2.448 |
| Phone cold | 3.663 | 3.731 | 3.795 | 3.954 |
| Phone warm | 1.980 | 2.019 | 1.989 | 2.084 |
| Phone record | 2.245 | 4.296 | 4.432 | 2.307 |

Shared positions meet four of six timing groups each; constrained positions meet two of six each. The first desktop cold control is slower than the return control, so comparing only A1 with B1 would overstate a gain. Session-request start medians remain 1.79–3.65 seconds across cold groups. Browser/driver work is substantial in the sampled cold intervals, but request response delay and the receiving path also depend on the service allocation. These results do not establish a browser-only or server-only root cause.

The runner exposes **two physical cores**, with sibling lists `[0,1]` and `[2,3]`. The app/database CPU 0 therefore shares a physical core with browser CPU 1. This verifies logical scheduling, not separation of physical cores. The next bounded comparison assigns whole sibling groups to each side. Available memory remains above 10 GiB during measured actions and sampled swap is zero. Two-second sampling gives only 1–2 complete intervals for most cold groups, and none for A1 phone cold; do not infer precise phase CPU demand from missing intervals. Process turnover makes database CPU deltas lower bounds, with unmatched endpoints recorded explicitly.

## Source and method

[Run 38094170829](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38094170829) passes at `e51f0e18171a9a255125b268eb4af86a4efbdc58`, build `beri3We0o9b7Og1EkNBvi`. It integrates main `0e10459`; application source is unchanged since that integration. Ubuntu 24.04, four logical CPUs, the locked Node/Chrome/PostgreSQL stack, one build and one fresh declared synthetic fixture. Fresh app/browser processes, logging off, ten independent browsers and shared / constrained / constrained / shared order. Desktop 1440×1000 and phone 390×844 touch emulation retain four directory waves, exact payload/list checks and actual record clicks/taps with exact identity receiving assertions.

The 40 ms / 1.25 MB/s down / 625 kB/s up network conditions, three-second target and original 3,000/10,000/120,000 ms acquisition/statement/readiness limits remain. Chrome enters an owned cgroup CPU-set leaf with its normal user identity, binary and arguments unchanged. Effective CPU sets and observed thread masks are checked. The app/driver use taskset and the existing database service uses Docker cpuset; both positions use the same observation and launch mechanism. Owned browser helpers are cleaned up after each driver exits, and the database's original setting is restored.

Cold script transfer is 216,684 bytes and CSS 106,856 bytes in every sample. This source includes main's newer shared styles/icons; do not compare those sizes or absolute timings with older runners as a gain from CPU placement. A2 phone has additional image transfer in some samples, retained in the raw distribution. Shared memory/I/O, physical sibling contention, caches and cloud scheduling remain limitations. CDP response intervals include emulation/client event handling and do not isolate server execution. Cross-navigation browser counter differences remain excluded.

## Verification and disposition

[Summary](summary.json) validates source/build/fixture, all four allocations and complete action counts. [CI provenance](ci-provenance.json) and [57-file integrity manifest](artifacts.json) retain raw samples, screenshots, both page manifests, external process records, launcher bytes, effective CPU declarations, fixture, smoke and redaction evidence. Stored/original hashes and private-value scans pass. The [test-order failure](../cpu-allocation-interrupted/README.md) and [rejected affinity-only block](../cpu-affinity-rejected/README.md) remain separate.

Keep PR #391 draft. Neither the one-CPU service allocation nor any pool, query, session or timeout change is adopted. The original 503 attribution, full four-view PT-27, physical-device/accessibility/owner acceptance and deployment remain open. Reproduce this logical allocation with `proof=customer-cpu`; the separately declared whole-core comparison uses `proof=customer-core`.
