# PT-27 Customers loading evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executed 10 October 2026 (Australia/Brisbane). [Decision](../../../decisions/pt27-loading-performance.md). Local synthetic measurements; independent review and owner/device/accessibility acceptance remain separate.

## Result and scope

ProductNavigation's eight Link rendering sites now load destinations on activation. The baseline trace shows Home prefetch overlapping the identity read and Sales destination prefetch during directory loading. In the final pair, observed speculative requests fall from **940 to 0** across 80 directory samples per build. Both builds return the exact permitted directory content and pass all 20 actual record handovers. The seven declared fixture tables remain unchanged.

Desktop warm p95 improves from 3.234 to 2.520 seconds. **Cold phone p95 worsens from 5.196 to 7.407 seconds.** Five of the candidate's six groups still miss three seconds. The candidate remains a reviewable request-reduction experiment; the phone regression prevents claiming an overall performance improvement or closing PT-27. Further cold-phone investigation and controlled repeats are required before accepting that performance tradeoff.

## Final sources and method

| Run | Driver source | Compiled application source | Build |
|---|---|---|---|
| baseline-final | `698286fab91fd43c01307fd233faa7fb02c1ac84` | `794aee6c0a540189c7fcce16c7d077c21bac68c6` | `JyAXp9ixrPrA-JvFj31X2` |
| candidate-final | `698286fab91fd43c01307fd233faa7fb02c1ac84` | `698286fab91fd43c01307fd233faa7fb02c1ac84` | `tdSkRUjxSwyuFdb3WXrt9` |

Node 24.21.0, locked Playwright 1.63.0 and Chrome 155.0.8059.40; local PostgreSQL 16.15 on a task-owned `ppo_synthetic_test` cluster. The additive fixture has 1,000 organisations, 5,000 assets and 10,000 appointments. No reset or reseed occurs between runs. Font Awesome Kit is unset, exercising the existing local icon drawings.

Each build uses ten independent Chrome processes. Desktop is 1440 by 1000; phone is 390 by 844 touch emulation. Each viewport has ten fresh contexts for a cold wave, three warm waves, then actual first-customer activation in each context. Global network conditions are 40 ms latency, 1.25 MB/s download and 625 kB/s upload. Every directory GET verifies its applied network rule. Authentication setup is outside the interval; record visits retain the same global rule.

Directory timing includes exact core JSON, settled identity, enabled Change identity, no Loading indicator/business error and two animation frames. Every response matches a retained content hash, the rendered names and exactly one directory GET. Record timing starts at pointer/touch activation and checks the exact receiving URL, context ID, heading and settled state. No authority or business cache is introduced.

## All final timing groups

Nearest-rank p95: cold/record n=10 per viewport; warm n=30. Cold/record p95 is the maximum sample. Raw samples, medians and ranges are in [summary.json](summary.json).

| Viewport / action | Baseline p95 | Candidate p95 | Candidate within 3 s |
|---|---:|---:|---|
| Desktop cold Customers | 9.472 s | 8.039 s | No |
| Desktop warm Customers | 3.234 s | 2.520 s | Yes |
| Desktop actual record opening | 7.392 s | 6.466 s | No |
| Phone cold Customers | 5.196 s | 7.407 s | No |
| Phone warm Customers | 4.359 s | 3.602 s | No |
| Phone actual record opening | 4.816 s | 3.962 s | No |

These are an ordered baseline/candidate pair on a shared Windows host. Retained OS/database caches, other host activity and synchronous opt-in gateway diagnostics limit causal attribution. Earlier timings vary materially; no reversed/randomised control was completed. The observed request reduction is established, but every timing difference cannot be attributed to prefetch. Warm samples transfer zero font bytes, so the font hypothesis was not adopted. Fonts, layout, session gates, query/pool limits and the three-second target remain unchanged.

## Preserved attempts and corrections

- The original four-view sampler completed 120 reads through desktop Customers, Work order and Planner, then stopped progressing between groups. The owned server still returned health 200, with no active app database queries observed. Task-owned processes were stopped. Partial samples, detailed observations, resources and interruption are retained in `attempts/`. The stall's cause and the older 120-second phone timeout remain open; there is no completed four-view local pass.
- The focused runner's first start exceeded its initial 60-second startup loop. A missing gateway file masked the readiness error during cleanup. The failed log remains retained. Cleanup now preserves that failure and stops the owned server; startup uses the existing diagnostic's 120-second allowance with an elapsed-time bound. Measured readiness/navigation deadlines were not raised.
- The first completed pair is retained in [original-comparison](attempts/original-comparison/summary.json). Review found a misencoded ellipsis in its Loading assertion and two unintended punctuation changes in the candidate. The original timings are not the primary result. The assertion now uses an explicit Unicode escape, original application punctuation is restored, and both final builds were remeasured in full. A successful intermediate run with the corrected driver but prior application is retained in `attempts/corrected-driver-prior-app/`.
- The first selected browser run passed 12 cases and failed two saved-view logins: their helper hard-coded Origin port 3000 against this server's port 33957. The unchanged gateway correctly refused it. The helper now uses the configured origin, preserving default CI behaviour, cookies, connection handling and no-retry semantics. Both affected cases passed on rerun; original and corrected logs remain separate.

Final compiled browser and source checks are recorded in [verification.json](verification.json). The selected checks cover shell activation/Back, record receiving, identity-specific Home/Workspace, dirty preference recovery, keyboard/save/read-only behaviour, saved views and guide handovers. They do not claim a complete local browser/database suite pass.

Candidate phone-directory and desktop-record captures were inspected for readable text and controls in those sampled states. This is not owner visual, physical-phone, screen-reader or full responsive acceptance. Existing 28 stale reviews remain unchanged; no review fingerprint was copied.

## Reproduction and integrity

On a fresh, migrated and seeded disposable `ppo_synthetic_test`, set `PPO_BENCHMARK_FIXTURE=add-synthetic-load` and run `node --env-file=.env.local --import tsx scripts/quality-customer-timeline.ts prepare` once. This uses the same fixture/fingerprint/expected-directory helpers used here. Preserve that fixture across builds; do not prepare it again between samples.

Build the declared application source. Set `PPO_COMPILED_SOURCE` to its full commit, `PPO_PROOF_DIAGNOSTICS=1`, and the task-owned `PPO_PORT`/database through private configuration. Run `node --env-file=.env.local --import tsx scripts/quality-customer-comparison.ts <new-label>`. The runner refuses output reuse, checks source and exact fixture equality, and records failures without substituting samples.

Run `python scripts/summarize-customer-comparison.py <baseline-folder> <candidate-folder> <output-folder>` to validate sample counts, fixture equality and matching browser/network conditions, retain deterministic gzip bytes and report all six groups. [artifacts.json](artifacts.json) binds stored and uncompressed hashes, including retained attempts and verification logs. Raw traces, cookies, credentials and full request headers are not published.

No merge, deployment, operational integration or human acceptance follows from this contribution. PR #390's integration and fresh PT-30 owner worksheet remain with its existing session; no H01-H11 observations are filled on anyone's behalf.
