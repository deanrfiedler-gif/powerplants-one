# PT-27 packet collector setup failure

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: draft. Executed 11 October 2026 Brisbane. Scope: PT-27, NFR-04, AT-23. [Predeclaration and correction](../../../../decisions/ADR-0052-pt27-network-calibration.md#second-candidate-declared-before-implementation).

This attempt fails before any shaped browser samples. The runner's iproute2 6.1 emits plain text for class statistics despite `-j`; the collector incorrectly expects JSON. Each shaped cohort stops at that collector, restores loopback's original `noqueue` discipline and records its error. All 44 direct/unshaped-relay anchor samples pass. These passing anchors do not qualify packet shaping.

[Run 38103259965](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38103259965), source `2fce332269b813041304fb79dcf129c51d9d9c97`, Chrome 155.0.8059.39, Node 24.21.0, Linux kernel 6.17.0-1022-azure, four CPUs. [CI provenance](ci-provenance.json). The guard skips the application build, fixture and all app samples; no performance claim is possible.

The [summary](summary.json) retains twelve cohorts: eight complete direct/relay anchor cohorts and four failed packet cohorts with no browser samples. The [manifest](artifacts.json) preserves all original protocol/sample/server/traffic files plus the review preparation record, with hashes for both stored and original bytes. Traffic files show no browser relay connections during the failed shaped setups and successful restoration after each. Missing class statistics are not inferred from successful configuration commands.

The repair retains raw `tc -s class` and filter text, extracts explicit class IDs/byte/packet counters with strict format checks, and adds parser regression coverage for absent, changed and duplicate observations. The [iproute2 6.1 source](https://github.com/iproute2/iproute2/blob/v6.1.0/tc/tc_class.c) confirms the plain class-output path. A new complete run is required with unchanged order, calibration criteria, deadlines and application gate. This original attempt remains failed; later samples cannot replace its missing ones.

All 55 stored/original artifact pairs and private-value scans verify. The `2fce332` summarizer reproduces this summary byte-for-byte and all 54 core manifest rows; the review preparation record is the single support file. Repair run [38103982134](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38103982134), source `11dc74f`, was cancelled while queued after local type checking found a nullable-counter guard. Its [CI record](parser-cancelled-ci.json) confirms no executed steps or samples. The corrected guard passes type checking; this cancellation is not a measured attempt.
