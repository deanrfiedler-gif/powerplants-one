# CPQ governed costs execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic backend verification, 14 October 2026. Scope BC-04/ES-02/ES-03; [decision](../../../decisions/cpq-governed-costs.md) and [API](../../../interfaces/cpq-api.md#governed-cost-and-labour-profile--schema-4). [PR #491](https://github.com/deanrfiedler-gif/powerplants-one/pull/491) is stacked on [PR #490](https://github.com/deanrfiedler-gif/powerplants-one/pull/490). Main remains `bc9e3fb`, including #489 and migration 0100. Parent follow-up `a55c40c` changes only CI's database execution window; runtime source remains the reviewed Product foundation. No migration, grant, dependency or deployment added.

## Local execution

Environment: Node 24.21.0, npm 11.19.0, PostgreSQL 16, Chrome 155.0.8059.40 and Playwright 1.63.0. Only the task-owned disposable `ppo_synthetic_test` database was used. The original compiled proof used the `c922854` source tree. Later fixture, evidence and CI corrections are followed by the pricing-date runtime correction recorded below. [File manifest](source-manifest.json) separates that original build from the final source and verification bytes.

| Check | Actual result |
|---|---|
| CPQ, Cost Sources, cost-basis and native estimate units | 41 passed; six governed-source cases include post-override tiers, dates/minima, no fallback, strict identity/content/units, FX refusal, zero source cost and punctuation-safe attribution |
| Full CPQ/Cost Sources PostgreSQL regression | 33 passed, including the populated historical upgrades, preserved receipts/identity/grants, Product compatibility/access and native source workflows |
| Additional same-actor cross-company assertion | 1 targeted case passed after strengthening the fixture |
| Final governed-source PostgreSQL rerun | All six passed against finished runtime and strengthened fixtures |
| Compiled HTTP | Three passed in separate sequential processes: original CPQ, published Products and governed sources; current authority, stale refusal, original recovery and private/no-store responses |
| Actual application and PostgreSQL restart | Both [governed costs](restart.json) and [published Products](products-restart.json) passed after stopping/restarting the compiled application and the verified task-owned PostgreSQL instance. Exact source/review rows, run, estimate bindings, audit/outbox and receipts were unchanged; two original operations each recovered without duplicate effects. Changed/withdrawn sources still refused new adoption |
| Compiled browser regression | Two passed: existing CPQ end-to-end desktop and phone journeys; targeted run skipped the unrelated whole-application warm-up dependency |
| Application build, type check and targeted lint | Passed |
| Foundation, naming and design-register assurance | Passed. The design register still reports 334 unreviewed and 28 stale entries; no visual acceptance is inferred |
| Historical schema hashes | [Schema 1, 2 and 3 definition/input/result hashes](legacy-hashes.json) exactly match unmodified parent `5ce7a1a` |

Initial failures were corrected and retained in private execution logs: test UNION sorting and unchanged-source fixtures; a grant-expiry fixture used the wrong column; the FX test initially asserted the generic message instead of its field diagnostic. A dependency junction was unsuitable for the application builder and was retained outside the checkout; the worktree now has its own unchanged-lockfile installation. One test process overlapped that dependency move and was rerun. Shared HTTP fixtures now grant the existing source/catalogue read duties needed to inspect a previous active release, and restore grants after the revocation assertion. The first restart probe ran before the application was listening; verification passed after the explicit readiness check. These were verification/setup corrections, not relaxed production checks.

Private session checkpoints and raw logs remain outside committed evidence. The safe restart summaries contain hashes and outcome counts only. No external business records were used.

## CI, independent review and acceptance

Independent automated review of runtime head `c922854` [reported no major issues](https://github.com/deanrfiedler-gif/powerplants-one/pull/491#issuecomment-6165779713). This is automated review, not human approval. Final contribution CI and review remain separate live PR gates.

The earlier `5b0300d` [E1 browser job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38546564835/job/115794537648) failed at the governed-source HTTP fixture's read of the preceding active Product release. It reproduced the missing fixture catalogue-read grant corrected in the final follow-up; the sequential compiled HTTP and shared restart scenarios passed locally with that correction. Replacement-head CI must still confirm the integrated result.

Final-runtime head `0698a1f` received a [clean independent automated review](https://github.com/deanrfiedler-gif/powerplants-one/pull/491#issuecomment-6166149106). Its broader [P01–P11 HTTP job](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38548447524/job/115800743217) exposed concurrent interference: the governed-source test changes the shared company activation and temporarily revokes the common estimator's source access while the original CPQ test is running. A local concurrent pair reproduced the denial. `scripts/http-suite.ts` now includes governed costs in its existing exclusive fresh-database group, alongside published Products; production authority and shared-suite concurrency remain unchanged. Original CPQ, governed costs and published Products each pass separately after a fresh reset (three compiled HTTP cases). Targeted launcher lint passes. A broader local sequential attempt passed 96/98 shared cases but failed the Field restart and Job Pack checkpoint traversals after the database reset; it is not recorded as a full-suite pass or attributed to this runtime. Replacement CI remains the integrated gate.

Parent #490's `5ce7a1a` E1 database job was cancelled at the explicit 30-minute job limit while executing the retained combined suite. Follow-up `a55c40c` permits 45 minutes for that database lane, retaining every test and the browser lane's original 30-minute limit. It also [passed independent automated review](https://github.com/deanrfiedler-gif/powerplants-one/pull/490#issuecomment-6165826822); replacement-head CI is still required. The runtime worker's five-second budget is unchanged.

Direct synthetic AUD excluding tax only. FX/landed receiving, combined schema-3 authoring, native binding controls, operational source/rate owners and commercial acceptance remain separate. The next backend increment is explicit override rebase/conflict decisions and resolution of manually changed CPQ-owned lines. No merge, deployment, customer communication or external transaction.

Independent review of `16c83b0` identified a stale Product HTTP fixture hash in the verification manifest. It is corrected against committed Git blob bytes, with every listed file rechecked and the HTTP isolation launcher/CI definition included. The byte contract now explicitly uses LF Git blobs, independent of Windows checkout conversion. This evidence correction changes no runtime or test behavior. The replacement-head E1 database, compiled browser/restart aggregate and broader P01–P11 HTTP checks passed; final CI and renewed independent review remain separate.

A subsequent review found that four-digit pricing dates accepted by CPQ could exceed the native binding column range. The follow-up engine diagnostic blocks schema-4 readiness outside 0001-01-01 through 9998-12-31; schemas 1–3 and existing history are unchanged. All seven governed-cost units pass, including accepted bounds and rejected year 0000/9999. The manifest retains the original `c922854` compiled evidence separately and binds the corrected source; it does not label the old build as this new runtime. Database boundary adoption and final compiled CI are pending at this record.

The pricing-date database proof passed: year 0000/9999 runs are Blocked before adoption, and an exact `9998-12-31` adoption persisted both native source bindings. The original governed-source adoption/refresh scenario also passed in the same focused rerun (2/2). The parent source/fixture corrections are propagated into stacked rebase PR #492 for final compiled and restart regression. Automated review and replacement-head CI remain separate gates.

Schema-4 source validity also refuses year 0000 with `CpqCostSourceDateRange`: native PostgreSQL has no year zero. The live amended `cost_source_binding_guard` and pricing-date constraints were inspected, including migration 0100's replacement guard. Source effective/expiry fields are checked independently of the selected pricing date; existing saved evidence remains readable. Eight governed units and two database boundary cases pass, including refusal to publish a Ready fixture from an independently reviewed year-zero source and accepted upper-bound native adoption.
