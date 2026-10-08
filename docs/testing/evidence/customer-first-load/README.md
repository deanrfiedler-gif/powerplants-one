# Customers first-load evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 9 October 2026 (Australia/Brisbane). [Decision and boundaries](../../../decisions/customer-first-load.md). This is a bounded local diagnostic and unchanged-component extraction; PT-27 and owner/device acceptance remain open.

## Sources and method

| Observation | Driver/test source | Compiled application source | Build ID |
|---|---|---|---|
| Baseline | `75c33d56cb436a281872ab2a1087d9f2614bc78d` | `000181202854ce4a8318d2bc00d806c48183af17` | `7g3uZISDiEjWT5TK2rgeB` |
| Candidate | `edb486f40c4bf53f57c5fd26c62da82b48c66d13` | `bc49ca3839e50ab61511197cac4b429f48e415b5` | `wOCpjtaYTkKZUZ_-zmwQW` |
| Selected browser checks | `edb486f40c4bf53f57c5fd26c62da82b48c66d13` | Same candidate | Same candidate |

The retained baseline application files match merged main `dcec2cf`; the original compiled identity is preserved rather than relabelled. The candidate changes three application files: it moves the exact NotificationBell body into its own client module and changes the shell import. My Work layout/preferences stay in the full Notifications workspace. Identity, permission, API, data, guide and cache policies are unchanged.

Each probe uses one Chrome 154.0.8037.98 process, three sequential fresh contexts per viewport (1440×1000 and 390×844), one cold and one warm Customers visit per context, then actual mouse/touch activation of the first customer. Network conditions are 40 ms latency, 1.25 MB/s download and 625 kB/s upload. Precise JS/CSS coverage and opt-in gateway diagnostics add overhead. The reviewer paused local reads and browser use during each probe. These are separate sequential runs, without a reversed-order control, not ten-user CI or hosted/device measurements.

Both probes pass all 12 directory samples and six exact record visits. Each directory result matches the same expected content hash and rendered names, with exactly one core GET. Current identity must settle and Change identity remain enabled, with no loading/business error; actual record checks assert response 200, receiving context ID, URL, heading and settled state. Seven declared fixture tables compare equal before/after and across runs. Only the reference fingerprint is retained; after-equality is an executed assertion, not a separately retained fingerprint or whole-database claim.

## Confirmed loading boundary

The old shell imports NotificationBell from notification-workspace, whose MyWorkLayoutPreferences import brings My Work views/list/overview into Customers. The generated ApplicationFrame mapping falls from seven shared chunks to four, and the My Work SSR mapping disappears after extraction. The real browser transfer falls consistently in all six cold samples per build.

| Cold-load observation | Baseline | Candidate |
|---|---:|---:|
| JavaScript files | 15 | 13 |
| JavaScript encoded bytes | 257,595 | 225,730 |
| CSS files / encoded bytes | 8 / 101,910 | 8 / 101,910 |
| Combined JS+CSS encoded bytes | 359,505 | 327,640 |
| Static JavaScript source UTF-16 characters | 842,048 | 731,935 |

The reduction is 31,865 encoded bytes: 12.37% of JavaScript, or 8.86% of JS+CSS. Warm visits transfer zero JS/CSS bytes in both builds. Source character counts are not bytes; raw V8 coverage ranges overlap and are not summed into an unsupported unused-byte percentage.

## Descriptive timings

Each table cell is the median of three observations. Min/max and every sample remain in [summary.json](summary.json). These samples do not establish p95, concurrency performance or a material whole-page speedup.

| Ready boundary | Baseline ms | Candidate ms |
|---|---:|---:|
| Desktop cold Customers | 1,039.2 | 1,020.0 |
| Desktop warm Customers | 430.7 | 405.7 |
| Phone cold Customers | 977.8 | 914.3 |
| Phone warm Customers | 410.4 | 396.9 |
| Desktop actual customer navigation | 1,304.2 | 1,114.3 |
| Phone actual customer navigation | 1,269.0 | 1,194.7 |

The baseline cold desktop medians put the last asset at 723.5 ms, session request at 740.7 ms, session finish at 799.5 ms and directory start at 830.6 ms; corresponding phone values are 687.3/713.0/767.1/799.7. These separate medians are not additive phases. The initial baseline desktop sample took 1,734.7 ms, versus 1,271.8 ms for the first candidate; process/OS startup variability is retained. Most local cold waiting precedes the directory request, but this does not identify all causes of the slower ten-user CI result. No session-gate relaxation is justified.

All 24 session/directory responses per run (48 total) match unique same-PID gateway received and 200-finished events through their numeric proof headers. CRM paths are intentionally masked as `/api/v1/crm/:other` in gateway logs; the response ID binds the exact browser path. Baseline retains 652 received = 642 finished + 10 closed-incomplete; candidate retains 641 = 631 + 10. None of the closed-incomplete requests is one of these matched core reads. Background closure is not silently converted into a successful request.

## Regression and review

[verification.json](verification.json) records two separate compiled browser runs, each five passes including its warm-up: eight functional cases total, plus two warm-ups. The first verifies desktop Customers-first notification bell, current notice, Escape/focus return, actual Open Notifications handover, explicit read/archive/source guard/preferences, and the established direct phone inbox. Both viewports also pass Workspace/guide navigation and focus. The second passes identity-specific Home/Workspace and dirty-preference pointer/keyboard/touch/workspace cancellation on both viewports. No assertion deadline or permission boundary was relaxed.

The desktop bell and phone detail captures were inspected: their observed text/actions are readable and contained in those viewports. This is not a paired reference, physical-device, screen-reader or owner acceptance review. The independent read-only reviewer confirmed the exact unchanged bell body, dependency removal, all sample/transfer counts and descriptive timing limits.

The diagnostic passed without rerunning either probe. The packaging helper initially stopped on a syntax error and then on treating the masked CRM gateway path as an exact path; both were corrected before producing the summary, retaining numeric ID correlation. Those packaging failures did not change application/test source or observations. Full typecheck, targeted lint, build, studio, foundation and naming results are retained separately in the final check record. A full local database/unit/browser sweep is not repeated for this unchanged component extraction; full contribution CI remains separate.

## Release reconciliation and remaining work

[release-snapshot.json](release-snapshot.json) records #370–#373 merged and main `dcec2cf`, with its exact time-bounded check states. Do not transfer the PRs' completed checks to main while main jobs are still running. The independently dispatched [Azure update 37842108771](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37842108771) succeeded at `dcec2cf` with immutable image `sha256:72c46317b60a958625a549262a1c4f78f11ec59f0394dec25f166dd578f86983`. The reviewer then used the existing invited SSO session to reopen a saved synthetic customer, quotation Draft and exact HTML revision 1. No new rendering, business mutation or deployment was performed. Same configured web/worker image is not actual worker execution; managed PostgreSQL minor and owner acceptance remain unverified.

The preceding #373 [ten-user profile comparison](pr373-profile-comparison.json), from [run 37785243405](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/37785243405), retains source `4738572` and executed tree `1d5ccfb`. Each profile collected 320 samples without failures, but 12/16 compiled groups missed the three-second candidate target. Customers compiled cold/warm p95 was 5,908.6/2,528.2 ms desktop and 4,134.2/2,500.2 ms phone. These are the prior contribution's results, not this candidate's or hosted timings. The older uninstrumented phone timeout remains unresolved.

The next decision belongs after this contribution's CI/review. No additional application experiment, merge, deployment dispatch or performance-acceptance claim is included. CREMS remains historical background; issued references and all 78 parent IDs are preserved.

## Reproduction and integrity

`scripts/quality-first-load.ts` asserts compiled source equality before running. Start from the declared retained fixture, set `PPO_BENCHMARK_FIXTURE=add-synthetic-load`, `PPO_PROOF_DIAGNOSTICS=1`, `PPO_PORT=3034` and the exact `PPO_COMPILED_SOURCE`; run with label baseline or candidate. Do not reseed or repair the fixture to manufacture equality. `scripts/summarize-first-load.py` retains original JSON bytes in deterministic gzip, copies complete gateway/manifest files and verifies core correlations before producing min/median/max statistics. [artifacts.json](artifacts.json) binds compressed and uncompressed evidence hashes; the final integrity record also binds source blobs and check logs. Raw traces, credentials, cookies and full headers are not published.
