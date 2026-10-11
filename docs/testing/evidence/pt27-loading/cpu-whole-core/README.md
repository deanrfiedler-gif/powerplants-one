# PT-27 whole-core allocation and retained asset stalls

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 11 October 2026 Brisbane. Review: draft. Scope: PT-27, NFR-04, AT-23, CS-01/CS-02. [Decision](../../../../decisions/pt27-loading-performance.md#cpu-allocation-comparison--11-october-2026).

The final declared CPU block verifies whole-core placement but **fails three cold readiness samples**. It retains 220 attempted directory loads: 217 pass and three time out; all 50 attempted record openings pass. Each failed browser records JavaScript requests without response headers and no session or directory request. No HTTP 503 is observed. This locates the observed stall before API bootstrap, without establishing whether the cause is browser scheduling, network emulation, transport or static-asset serving. No further application correction is adopted.

## Attempt outcomes

All four positions execute in the declared order. Each failed position stops after its failing wave; later positions remain separate attempts. Missing waves are not replaced, and incomplete positions have no interpreted latency groups in the summary.

| Position | CPU allocation | Directory loads | Actual record openings | Outcome |
|---|---|---:|---:|---|
| Shared A1 | All four logical CPUs for both sides | 9 pass / 1 timeout | 0 | Stops in desktop cold wave, synthetic user index 7 |
| Separated B1 | App/database 0,1; browsers/driver 2,3 | 80 pass | 20 pass | Complete |
| Separated B2 | App/database 0,1; browsers/driver 2,3 | 48 pass / 2 timeouts | 10 pass | Desktop completes; phone cold user indices 8 and 2 time out |
| Shared A2 | All four logical CPUs for both sides | 80 pass | 20 pass | Complete |

The workflow fails, as required. The two complete positions do not constitute a successful four-position comparison. Their retained p95 values are descriptive only: B1 desktop/phone cold 6.058/4.500 seconds and record 3.608/3.177; A2 cold 4.690/3.477 and record 2.366/2.163. Every complete cold group still misses three seconds. No pooled result, causal latency gain or acceptance follows.

## Failure boundary

Each failed sample reaches the unchanged 120,000 ms directory-response wait. Its document returns HTTP 200. All **13 JavaScript request-start events per failed browser** lack response-header events; no `/api/` request is recorded. A1 receives headers for its stylesheets; B2 user 8 has five stylesheets without headers and user 2 has eight. Image headers alone do not establish body completion. The original per-sample network arrays, errors and process records are retained unchanged.

The observer records CDP request-start, response-header and loading-finished events. It does not record loading-failed reasons or matching static-server receipt and response completion. A missing response event therefore does not identify the blocking layer or prove that the server received the request. It also cannot turn this failure into evidence of the earlier API 503 cause. The original API/session/pool investigation remains separate.

Across the whole attempts, sampled available memory stays above 10.24 GiB and swap is zero. A1/B2 whole-attempt host-CPU medians are 3.05%/3.41%, dominated by the long wait after other browsers finish; initial bursts remain visible. These aggregates do not show persistent host saturation throughout the timeout or exclude a transient/resource/transport cause. Two-second samples, process turnover and shared host I/O/cloud scheduling limit attribution; raw cross-navigation Chrome counter differences remain excluded.

## Source, method and preservation

[Run 38095136186](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38095136186) uses source `cdcdf3dfffe99ab6742ed5a16f4da5b58254890b`, build `41qFs1KN3M-VLMP-IKKx4`. Application source is unchanged from the integration of main `0e10459` at `3a626e6`. It uses one build/runner/fixture and fresh app/browser processes, with detailed application logging off. Ten browsers, desktop/phone profiles, network emulation, payload/identity assertions, three-second target and original deadlines remain unchanged.

The runner reports two complete sibling groups `[0,1]` and `[2,3]`. The profile refuses other topology. App/database and browser/driver are assigned separate complete groups in the constrained positions. Chrome uses the same normal-user binary/arguments in an owned cgroup CPU set; taskset controls app/driver and Docker controls the existing disposable database. Effective groups and **176,411 repeated sampled thread-mask checks** have zero violations. This counts repeated observations, not unique threads. Shared positions use the same launcher and observer. Owned helpers are cleaned up and the database allocation restored after each position.

Every position starts with the same seven-table fixture fingerprint. Completed B1 and A2 also retain matching post-run fingerprints. Failed A1/B2 do not reach their post-run capture; subsequent matching starts and A2's final fingerprint are retained, without inventing missing per-attempt checks or whole-database equality. No reset, repair, reseed, retry or substituted sample occurs within the block.

[Summary](summary.json), [CI provenance](ci-provenance.json) and the [49-file integrity manifest](artifacts.json) preserve every available raw sample, capture, page manifest, external log, process record, launcher, CPU declaration, fixture and compiled-smoke artifact. Both stored and decompressed hashes and the private-value scan pass. Regenerating the summary from the original download is byte-exact, as are its 45 core artifact files; four support files are retained separately. No missing capture is fabricated. The [pre-measurement test failure](../cpu-allocation-interrupted/README.md), [rejected affinity-only block](../cpu-affinity-rejected/README.md) and [valid logical-CPU block](../cpu-allocation/README.md) remain separate. All 161 stored/original artifact pairs across these four attempts verify.

## Disposition and next investigation

This completes the declared CPU investigation increment. Keep PR #391 draft and retain the earlier bounded module-import improvement. Neither CPU allocation is adopted as an application fix. The next useful work is to correlate a stalled static-asset request with browser failure/completion events and server receipt/completion, using allowlisted metadata and the unchanged workload/deadlines. That would distinguish where progress stops before changing application, network or harness behaviour; this increment does not implement another experiment.

[Prior full CI](../cpu-allocation/prior-complete-ci.json) has 52 successful checks and one skipped optional comparison at `a75fd8c`, before main integration. Final integrated-head assurance is a separate PR gate. The three-second target, original 503 attribution, full four-view PT-27, independent/owner/device/accessibility acceptance, merge and deployment remain open.
