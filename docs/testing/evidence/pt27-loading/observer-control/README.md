# PT-27 controlled observer comparison

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026. Review: draft; independent/owner acceptance pending. Scope: PT-27, NFR-04 and AT-23, existing Customers directory and record journey. [Decision](../../../../decisions/pt27-loading-performance.md#controlled-observer-comparison--10-october-2026).

## Result

The predeclared off/on/on/off block passes **320 directory loads and 80 actual record openings**, with no observed HTTP error or readiness failure. All four attempts preserve the same seven-table fixture fingerprint. The three-second target is still missed by every cold-load group: desktop p95 is 4.658–4.866 seconds and phone p95 is 3.368–3.799 seconds. Thirteen of 24 action/viewport groups meet the target; this is not full PT-27 acceptance.

The original HTTP 503 does not recur and its cause remains unproven. This block does not justify a pool, query, authentication, retry or timeout change. Detailed logging has no large consistent cold-load penalty here; the traced warm groups are somewhat slower. Four ordered attempts are insufficient to isolate observer cost from cache/order and scheduling variation. The earlier Windows timings remain separate.

## Execution and provenance

[CI run 38053140417](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38053140417) and [comparison job 114216164427](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38053140417/job/114216164427) succeed. [CI provenance](ci-provenance.json) records source `ea2a82b50371f636d4d84cb6396750fec2b1779e`, uploaded artifact `PT27-controlled-observer-evidence` (ID `11670203064`) and its digest. Build ID: `F1kIbkoqn-pZX7EH8T_fh`. Application/runtime files match the retained corrected source `4882371`; this increment changes verification tooling and documentation only.

One Ubuntu 24.04 runner, four logical CPUs, Node 24.21.0, Chrome 155.0.8059.39 and PostgreSQL 16.15. The existing fixture preparation runs once: 1,000 organisations, 5,000 assets and 10,000 appointments. Freshly seeded dates/IDs differ from the retained Windows fixture; within this block, the fixture is identical before and after every attempt. Authentication setup remains outside the measured browser actions.

The compiled smoke first verifies successful, private/no-store responses and real route-complete, acquisition and release events for local-session, shell context, directory and saved views. All four positions then use fresh app and browser processes, ten independent Chrome processes, four directory waves per viewport, exact payload/list assertions and actual record activation. Desktop is 1440×1000; phone is 390×844 with touch emulation. Network limits remain 40 ms latency, 1.25 MB/s download and 625 kB/s upload, with no exempted requests. Acquisition, statement and readiness deadlines remain 3,000 / 10,000 / 120,000 ms. No retries, substituted samples, reset or reseed occur.

## Timings

Nearest-rank p95 in seconds; cold/record n=10 and warm n=30 per viewport per attempt. Exact values and phase distributions are in [summary.json](summary.json).

| Viewport / action | Off A1 | On B1 | On B2 | Off A2 |
|---|---:|---:|---:|---:|
| Desktop cold directory | 4.866 | 4.658 | 4.856 | 4.835 |
| Desktop warm directory | 2.137 | 2.300 | 2.506 | 2.159 |
| Desktop actual record | 3.330 | 3.381 | 2.950 | 3.318 |
| Phone cold directory | 3.368 | 3.799 | 3.492 | 3.532 |
| Phone warm directory | 1.847 | 1.991 | 2.144 | 1.855 |
| Phone actual record | 2.315 | 2.211 | 2.258 | 2.309 |

## Resource and database observations

Identical external two-second sampling runs in both modes. Whole-run counters include startup, login setup and screenshots; they do not isolate application work. Missing server-process readings remain unknown, not zero. Successful-action interior statistics retain only whole intervals within the union of measured browser actions: only three intervals, about six seconds, per attempt. That small subset cannot represent all actions.

| Whole-run observation | Off A1 | On B1 | On B2 | Off A2 |
|---|---:|---:|---:|---:|
| Minimum available memory, GiB | 10.14 | 10.23 | 10.14 | 10.23 |
| Median host active CPU capacity, % | 98.49 | 97.93 | 97.24 | 98.38 |
| Median server CPU, logical cores | 0.362 | 0.397 | 0.399 | 0.368 |
| Sampled swap used | 0 | 0 | 0 | 0 |

The host is close to CPU capacity while ten browsers and the app/database share four logical CPUs. Available memory stays above 10 GiB. These observations remove the earlier severe memory shortage from this block; they do not show that memory caused the Windows failure. Host CPU includes browsers, database and runner work. Server CPU alone neither explains all host work nor isolates SQL time.

Both traced attempts record 3,560 read phases, one pool, 1,620 acquisitions and zero acquisition failures or queued waiters. Acquisition p95 is 0.508 / 0.884 ms; maxima are 816.577 / 719.878 ms. Connection lease p95 is 155.598 / 107.006 ms. Acquisition includes scheduling and connection establishment; leases include query work, callbacks and observation. No diagnostic cap is reached. Detailed pool data are deliberately absent from the off attempts.

## Interpretation and next boundary

The cold directory request begins after a median 74–78% of desktop readiness time, and 66–74% on phone, calculated per sample. Desktop median request start is 3.244–3.374 seconds after the document request; phone is 2.309–2.375 seconds. This interval contains document/assets, hydration and client/session gating. It is not proof that one asset, the session route or the database is the cause. Raw CDP finish-minus-headers differences can be negative under emulation; they are retained as event observations, not physical transfer durations. Component percentiles are not additive.

The next justified performance investigation is the cold page and session bootstrap before the directory read, while explicitly controlling for the runner's browser CPU contention. Isolate a proposed correction with the same ten-user profile and actual desktop/phone navigation before adoption. An application availability correction still requires a failing request with verified phases. The discarded prefetch policies remain withdrawn, and the current authority/deadlines remain unchanged.

Screenshots and assertions cover functional directory/record state; inspected desktop directory and phone record captures do not grant visual, device, accessibility or owner approval. Full four-view PT-27, the original local stall, hosted performance and deployment remain open.

The separate [repaired CI outcome](repair-ci.json) at source `5b0bb26` confirms full mobile **346 passed / 74 skipped** and full desktop **403 passed / 17 skipped**. The formerly failing N01 case passes in both projects; the retained-proof job also passes. Selected job-log lines and full-log hashes are recorded separately from this performance block. The recorded aggregate/newer-head status remains distinct; these successes establish neither the original socket cause nor a 503 correction.

## Reproduction and integrity

Dispatch the existing `application-compiled.yml` workflow on the declared source with input `proof=customer-observer`. Its normal PR/main/default manual assurance jobs remain intact. `scripts/quality-observer-block.py` records the protocol before execution and retains every position; it continues after a failed attempt only if that attempt's app has stopped. No existing local fixture is changed.

Run `python scripts/summarize-observer-block.py <downloaded-artifact-root> <block-label> <new-output-folder>`. The summary validates source/build/fixture/mode identity, reports incomplete attempts separately and never pools runs. [artifacts.json](artifacts.json) binds exact stored and uncompressed bytes for original results, screenshots, gateway events, external counters, logs, protocol, fixture, redaction record and compiled smoke. [Verification](verification.json) binds the analysis scripts and checks separately from the executed source. No session-value redaction was required in this block; privacy scans and original-byte hashes are verified before publication.
