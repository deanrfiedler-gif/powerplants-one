# Conversations T2e offline evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Executor: Codex. Date: 23 October 2026. Status: offline contribution in [PR #679](https://github.com/deanrfiedler-gif/powerplants-one/pull/679); Claude review of 99721da6 received via Dean; author disposition below; no live-call/cost authority or result. [Plan and gate register](../../../decisions/conversations-t2e-evaluation.md), [operator chapter](../../../delivery/conversations-t2d-local-adapter.md), [contract](../../../contracts/conversations-t2b.md).

## Environment and evidence classes

Dedicated managed worktree/branch codex/conversations-t2e-offline from main d3ccc0b79f8182fb1cd1498196f4aa2564818c0a. Shared checkout was not edited, switched or stashed. Node 24.22.1/npm 11.19.0, locked dependency install with task-owned empty npm config files; no dependency/lockfile change. Owned PostgreSQL 16 cluster on loopback 51479, database ppo_synthetic_test, disposable durability disabled, max_locks_per_transaction=1024. Test-only database identity/password are unmistakably dummy. Document storage is task-owned and outside Git.

Provider tests use actual SDK 1.1.0 with injected mocked transport and fixed dummy keys. Global fetch/HTTPS are blocked; the owned HTTPS proof intercepts https.request. No real credentials, environment/secret files or provider accounts were inspected. No live Messages, Models, token-count, validation or other provider request was made.

- **Simulated:** existing deterministic adapter/unit/database regression; zero API cost.
- **Actual SDK / mocked transport:** request options, all three fixed models, both refusal discriminators, inclusive thinking, safe metadata, transport/guard/cancellation cases.
- **Persisted synthetic integration:** real human post/queued turn/worker, checked answer/citations, ledger, audit/receipts, replay/reopen, run caps/stage/stop/source gates.
- **Live model:** none. No actual tokenizer/overhead, provider billing, grounding quality or latency measurement.

## Reproducible proof

Use the repository's normal Node test runner against an owned disposable ppo_synthetic_test with fresh explicit synthetic configuration. Do not source another contributor's environment or reuse a provider credential. The provider files install network blockers before every test path. Start an explicitly synthetic test child without inherited NODE_USE_SYSTEM_CA, OPENSSL_CONF, custom-CA/debug/key-log settings or corresponding Node flags; never inspect/dump the parent environment or change machine trust. Node's isolated test children can inherit --use-system-ca from their launcher, and the unchanged T2d guard correctly refuses it before key access. Claude reported 15 provider-test failures with that inherited setting under default isolation and 48/48 passes with --test-isolation=none. That alternate run is separate evidence, not a reason to weaken the guard or claim default isolation passed in that shell; the author did not reproduce the reviewer's parent-shell condition.

- node --import tsx --test --test-concurrency=1 tests/unit/assistant*.test.ts
- node --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/assistant*.test.ts
- 8GB TypeScript check, full-tree ESLint, existing documentation/status/naming/foundation/prototype checks.
- Existing full runtime/locked-tree dependency audit gates, with no new exception or package change.

assistant-evaluation.test.ts proves: all three model prices and inclusive reasoning; numeric/fixed-enum persistence without raw text; nine-calibration acceptance before main; one worker turn per invocation and model filtering before batch limit; calibration single call; retained Unknown after HTTP rejection/pool reopen; ten repetitions of two concurrent turns in one Node process (database-lock proof, not a multi-process test); immutable manifest/missing configuration/persisted stop; prior-month commitments/calibration cap; missing/unsupported billing and underestimated input; credit-exhausted outcome/TLS pre-key refusal; approved-evidence mismatch; source and derived Project changes; suppressed late answer after stop. Existing assistant tests cover P1/P3/access changes, citation safety, limits, replay, immutable answers, full monthly ledger and schema/upgrades.

## Execution ledger

Checkpoint: assistant unit subset **48/48 passed**, including five new evaluation unit cases. First persisted SDK/evaluation subset **15/15 passed**; expanded evaluation subset **10/10 passed** before evidence-hash and single-invocation refinements. Full affected database regression and final checks are recorded below after completion; earlier green counts do not stand in for the final changes.

Two local setup/test corrections remain visible: the first document storage path was inside Git, so seeding refused ExactDocumentUnavailable before tests; using owned storage outside Git fixed setup. A new derived-Project test incorrectly assumed saveTask leaves the Project row version unchanged; the canonical task service increments it. The fixture was corrected to add a RAID entry (a derived aggregate change without that row-version increment). This is a test-fixture correction, not a claimed baseline failure or weakened source guard.

Local completion results (the exact delivery head and CI disposition are recorded in the PR ledger):

- **48/48 assistant unit tests passed** again after the implementation refinements.
- The complete affected assistant database inventory ran **74 cases: 73 passed and the one new Project fixture failed** as explained above. The corrected actual-SDK/evaluation subset then passed **21/21** (318.8 seconds), including all 12 evaluation cases. A final focused rerun passed **1/1** after preserving FeatureOff on an unconfigured runtime-Claude path; its dummy-key getter was never read. All 74 distinct database cases therefore have passing coverage across these runs, not a claimed single green 74-case rerun.
- Final 8GB typecheck, full-tree lint plus affected-file lint after the last edit, and application build passed. Carl was explicitly off during the build; no worker/server was launched by that compile check.
- A last self-inspection found the smaller run cap was reusing the accepted UI's specifically monthly BudgetSpent reason. It now uses generic ProviderUnavailable, with no UI change. The two affected cap/concurrency cases passed **2/2** afterward; this reason-only refinement did not require another full build. Self-inspection is not independent review.
- Foundation, naming, prototype, status sources/generated view, migration numbering, documentation scope and all **22 documentation regressions passed**. All 78 parent requirement IDs remain. Generated views remain ignored; protected landing pages are unchanged.
- Development-register integrity passed; **342 unreviewed and 26 stale** entries remain visible. No visual/owner acceptance was performed or credited.
- Runtime dependency audit: **zero vulnerabilities**. Full locked-tree gate passed with the existing documented braces exception only; no new exception or dependency change.
- Full repository unit/database/HTTP/browser inventories were not repeated locally. The affected suites above and compile checks cover this contribution; complete GitHub inventories are separate. At reviewed head 99721da67f28d9726ade8f3d186b044c8b9880e0 they subsequently completed: **72 check runs, 71 successful and one intentional PT-27 skip**, verified through GitHub on 23 October 2026. All eight general database shards, ordinary browser and compiled browser groups passed ([application run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39920427499), [compiled run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39920427417)). This is reviewed-head evidence, not CI for later corrections.

The task-owned PostgreSQL cluster was stopped after validation. Claude's subsequent independent review and the author's disposition are recorded below. Existing T2d historical CI is separate from this contribution's checks. No real credentials were inspected and no live API calls were made.

## Independent review and author disposition — 23 October 2026

Dean supplied Claude's independent review of commit **99721da67f28d9726ade8f3d186b044c8b9880e0** in this task. Claude reported source/test/catalogue/documentation inspection, 48/48 local assistant unit passes with isolation disabled, naming/status passes, and no local database execution. The reviewer identified the cap wording as the sole merge blocker; other findings concerned operational readiness and recommendations. This is a user-supplied review, not a fabricated GitHub review/comment or a claim that Claude reviewed later corrections. The author verified the findings against the reviewed code and current GitHub checks.

| Finding | Verification and disposition |
|---|---|
| 1 — cross-run allowance overclaim | **Accepted and corrected.** evaluation.ts queries member ledger state and binds the run ID/manifest. Same-run or reused-member rebinding is refused; entirely fresh messages under a new run ID receive new caps and do not inherit earlier Unknown/failure/stop gates. Plan, operator chapter and PR description now distinguish these controls from Dean's per-run approval and procedural prohibition on evasion. No workspace-wide gate is implemented or claimed. |
| 2 — manifest-less worker consumes queued members | **Accepted; runbook corrected.** turns.ts selects all Queued turns without a manifest, and commands.ts can end them as FeatureOff or start Simulated. Require a dedicated synthetic evaluation database and exclusive manifest-configured worker use from materialisation to final disposition. No durable reservation marker has been added. |
| 3 — nullable metadata ends calibration | **Verified; strict policy retained.** SDK 1.1.0 declares geo/speed/tier nullable; turns.ts requires explicit expected values after recordCall. Known representable usage settles and Missing stops the run. Null is not silently relabelled standard/global. The plan now requires acknowledgement of this first-call risk before calibration; any policy change needs a separately documented correction and offline proof. |
| 4 — stop helper is not an operator control | **Accepted; operational limits corrected.** stopEvaluation has no script/route, requires a bound turn and actorAccess, and uses a SKIP LOCKED lookup. Cease invocations first; that alone cannot suppress an in-flight answer. A successfully recorded stop suppresses posting; termination can leave Unknown for lease recovery. No access bypass or new stop endpoint is introduced. |
| 5 — no envelope/manifest preparation tool | **Verified; remaining corpus gate.** Existing hashing/buildEnvelope functions have test callers, but no operator exporter exists. Before instance approval, review a reproducible offline procedure or tested read-only helper, with correct tagger/working-company context and fitted bounds for C03/L12. No tool or approved instance inventory is claimed delivered by this correction. |
| 6 — catalogue is not machine-checked | **Verified; remaining corpus gate.** Manifest unit tests do not validate the source JSON catalogue against parent requirement IDs or excluded-sentinel placement. Require these checks during offline instance preparation; a catalogue validator remains recommended implementation work. Human review of gold/source mappings remains necessary. |
| Source freshness | Confirmed: preflight hash binds membership/coverage; dispatch/post only re-read included source versions/fields. The plan now states this limit explicitly. Full membership/coverage freshness and stale/refresh UX remain the specification §6 gap. |
| Haiku tier | Official pricing rechecked 23 October: the low tier ends at 100,000 prompt tokens; current per-turn aggregate input is 48,000. Added a pricing-source comment requiring limit/tier review together; no prices or limits changed. |
| Clean-tree check | Confirmed tracked-status check omits untracked files and is not protection against Git assume-unchanged/skip-worktree or operator administration. Content binding is not owner approval or attestation of an untrusted checkout. |
| Call ceiling | Clarified 657 as the conservative six-call arithmetic ceiling, not expected billed calls or reachable retry slots. Sent unknown errors stop immediately; known malformed output has two retries. Preserve the accepted six-call bound rather than claiming a tighter general limit without proving all access/retry paths. |
| Test isolation / race wording / CI | Documented the inherited-CA test prerequisite and reviewer-reported limitation above. Ten races means ten two-turn in-process races. Verified the reviewed-head 71-pass/one-skip CI inventory; later-head checks remain separate. |

The corrective pass changes documentation and one explanatory pricing comment only. No adapter, accounting, access, stop or test behavior is changed. Documentation validation and the exact correction commit/CI are recorded in the PR. No application/database/provider tests are repeated for this prose/comment correction. The reviewed-head application evidence above remains the relevant behavior proof.

The review and disposition are recorded in the PR description and this evidence record. No formal GitHub review submission or later independent pass is claimed. That review grants no merge permission, calibration authority, live result or Dean acceptance. Current policy does not automatically require independent re-review after every correction; no waiver is invented. Dean subsequently authorised following CI, fixing failures and merging once all required checks pass, as recorded in the [merge-authority fragment](../../../status/2026-10-23-conversations-t2e-merge-authority.md). The earlier draft-only restriction is historical; calibration and live evaluation remain unauthorised. Final-head CI and merge outcome are recorded on PR #679, separately from reviewed-head evidence.

## Safe retained artifacts

The [T2E-SYN-01 catalogue](../../../../tests/fixtures/assistant/t2e-cases.json) is proposed synthetic source material, not an approved instantiated run. Do not manufacture a live result from the mocked payloads. A later run needs Dean's approved canonical instance inventory, exact gold source/claim mappings, evidence hashes and private manifest/approval references.

Retain numeric token/byte/duration/cost measurements, fixed outcomes, model/price/commit/case/repetition/hash references and scored assertions. Raw requests/responses, provider headers/errors/identifiers, thinking/signatures, credentials and full environment dumps never enter logs, receipts, audit events or public diagnostics. Only specifically reviewed synthetic answer/oracle artifacts may enter an evaluation record; do not publish full local test logs or database dumps. Preserve failed-attempt history and Unknown reservations. No reset or release is a permission to retry.

Planning delivery, code merge, execution permission, live result, Dean's acceptance and production readiness remain separate claims.

## Offline fixture preparation — 24 October 2026

[Draft PR #680](https://github.com/deanrfiedler-gif/powerplants-one/pull/680) addresses findings 5/6 with machine-checked catalogue schema 2 and canonical preparation/export. Owner: Dean; author: Codex. It remains unmerged. Claude subsequently reviewed this contribution at `f6f766482e63e0c002e5df1b90d52e8c0b2b6d96`; the disposition below distinguishes that review from later corrections. The historical #679 review and merge evidence above do not apply to this new head.

Dedicated worktree `codex/t2e-fixture-preparation`, based on verified current main `e1aeb1ad539afa10eccf46e89c2c188af8bc80a5`. Shared checkout untouched. The [plan](../../../decisions/conversations-t2e-evaluation.md#offline-fixture-preparation-follow-up--24-october-2026) records catalogue corrections and architectural choices; the [operator chapter](../../../delivery/conversations-t2d-local-adapter.md#offline-fixture-preparation-commands) owns reproducible commands and exclusive-worker limitations.

Local validation uses Node 24.22.1, exact npm 11.19.0, unchanged lockfile, empty task-owned npm configuration and a new explicit child environment. Installed npm 11.19.1 initially failed the engine gate; the required version was installed only in task storage, with no engine override. One existing unit case initially could not find Git in the minimal PATH; adding its executable directory yielded 5/5 in that family. No inherited environment/secret file or machine TLS setting was read or changed.

The first new persisted attempts found fixture errors (site-party date needed a UTC instant; per-member email/ERP uniqueness needed suffixes). These were corrected in the new preparation code, not attributed to main. Final preparation proof is 4/4: all 117 canonical members, exact gold checks, repeat hashes, unchanged turns/messages/audit/receipts/outbox/budget fingerprints, no answers/ledger, wrong principal, membership/context/source drift and actual ask-duty revocation. Tests block fetch and HTTPS. The test cluster is separate from the retained proposed corpus; no bound evaluation workspace is reset.

Evidence classes: **Persisted synthetic integration** for preparation, **offline pure construction** for request fitting/hash/catalogue, **Actual SDK / mocked transport** for inherited provider regression. No Live model evidence exists. Source/gold factual comparisons do not execute the human answer rubric. Corpus approval, exact-run/spending authority, calibration acceptance, model selection and production readiness remain pending.

No approval_reference, calibration acceptance or live-run manifest is issued.

### Retained proposed inventory

Materialised once from implementation commit `ef93b007443229cdd0100d2942dba429f97abfa1` on a separate task-owned PostgreSQL 16 loopback cluster (51483). This is a newly prepared, never-run synthetic workspace. It has no evaluation run binding and has never been reset. The regression cluster uses 51481. Both are stopped after validation; the proposed cluster and its original attempt/state/inventory files are retained outside Git. Restart that same cluster for later read-only verification, never replace it to evade an outcome.

At validator correction commit `e2bf9f7bf65ecba6318c721ecf921d70509bbd94`, catalogue-only checks were tightened to reject unsupported canonical field values and gold/definition contradictions. Read-only reinspection of the same 117 members proved that only the tool-source hash changed: all IDs, sources, gold, evidence hashes and request bounds were identical. The original private export remains intact (inventory hash `510fd742699194ca019a6e6742aa9591696eacf6fe40e84ce016a3cc07e816ac`); the corrected export is retained separately with explicit provenance. No messages, run or approval were replaced.

The [complete proposed inventory](proposed-inventory.json) retains one member per line for review; [numeric fitting/cost CSV](offline-bounds.csv) has all 117 exact rows. The public copy was checked against the generated object, inspected for the allowed synthetic-only projection and confirmed to exclude prohibited source values, message/provider bodies and approval fields. Private operator/approval mappings are absent. IDs and source facts here are synthetic; no real account material is included.

- Catalogue canonical hash: `1ff49b02b4a3df59ccd090cc4f74a5ba9a1bb98184aa20df01ffe7e6b8900b3b`.
- Proposed inventory canonical hash: `669cc3d259225413498aedf388a9911c26d89f2e13ef26f91f4159e021e4773c`.
- Canonical preparation/request source hash: `17e8dc0c92f7ea37c1a0a7dd398dfc3ab46df0a40998250b97c168bb847ed9fd`.
- **117 members = 9 calibration + 108 main**, 39 per model; 117 distinct organisations/sites/threads/triggers; **483 human messages**, **642 included source entries**, **315 exact gold-field support mappings**. O01–O10 remain ten offline proof definitions, not live members or additional turns.
- All 117 turns Queued; no assistant answers or budget entries. A second command reconstructed every unfitted envelope and matched the same inventory hash. Rerunning materialisation is refused; export does not overwrite or manufacture replacement state.

Each member binds model/stage/repetition, tagger/current company/readers, generated aliases and human-message IDs, source IDs/versions/fields, exact gold support, excluded-source mappings, evidence hash and request bounds. `evaluationEvidenceHash` covers the full unfitted envelope, including history/question/readers; retrieval times/routes are excluded by its existing semantics. `evaluationHash(report)` is the inventory hash, independent of JSON formatting. No file-byte hash is substituted for either.

### Offline fitting and price scenarios

All 117 first requests fit under the existing 48,000-input allowance; **zero irreducible first requests**. An artificially insufficient allowance is separately proved irreducible/unsent in unit tests. No network/token-count API was used. The exact question, newest entry and source items are asserted unchanged during fitting.

| Model | Turns | Request-byte range | Sum of conservative input estimates | First-call scenario with assumed 1,000 inclusive output per turn |
|---|---:|---:|---:|---:|
| Sonnet 5.5 | 39 | 3,116–37,022 | 614,075 | $1.618150 |
| Haiku 5.5 | 39 | 3,129–37,035 | 614,555 | $0.080977 |
| Opus 5.5 | 39 | 3,127–37,033 | 614,450 | $3.237800 |
| Total | 117 | | 1,843,080 | **$4.936927** |

Prices are the committed dated versions recorded in every CSV row; integer micro-USD rounding applies per turn. Calibration contributes $0.507901 and main $4.429026 to that scenario. It is an **offline estimate with an output assumption**, not actual tokenizer usage, structured-output overhead or billing. With 8,000 inclusive output per first call instead, calibration is $1.148401 and main $12.115026, total **$13.263427**. Full-turn reservations still total $20.9352. A 50% planning contingency on the 1,000-output scenario is $7.4053905, beyond the proposed $5 cap. Reservation-first admission may stop before all members even when the eventual scenario total is below $5. The corpus is not promised to finish at that cap; no cap increase or spending permission is implied.

C03 starts with 22 canonical human messages including kickoff/trigger, and L12 does likewise: the existing retrieval window returns 20, then fitting omits 9 and retains 11. C03 first-repetition bytes/input are Sonnet 37,018/45,210, Haiku 37,031/45,223 and Opus 37,029/45,221. L12 is 37,022/45,214, 37,035/45,227 and 37,033/45,225 respectively. The first two stored messages, including L12's earliest conflicting Won text, are outside the bounded retrieval window; this fixture therefore tests truthful incomplete history and current source grounding, not model resolution of a conflict it never sees. This limitation is explicit for Dean's corpus review. L04 remains the case with both conflicting current sources visible. L06 returns 10 siblings/20 Activities with both more flags true; L10 has exactly one count-only access omission.

### Validation and remaining gates

- Assistant unit regression **52/52 passed** in one final controlled-launch run; preparation adds four unit cases.
- Existing persisted SDK/evaluation/evidence regression **28/28 passed** (459.5 seconds), using intercepted transport/dummy values only.
- New persisted preparation suite **4/4 passed** (94.1 seconds), then **4/4 passed** again after the stricter catalogue validation (77.6 seconds); actual canonical materialise plus independent repeat-export commands also passed against the separately retained proposed corpus.
- The four preparation unit cases, typecheck and affected-file ESLint passed again after that correction. Foundation, naming, status and development-register integrity passed; **342 unreviewed / 26 stale** entries remain, with no visual acceptance granted. Remaining repository checks and exact-head CI are recorded on the draft PR.
- Initial claim commit `85922fd` failed documentation/merged-tree checks because its new status fragment lacked required front matter. The implementation commit corrects the fragment, and local foundation/status checks pass. No test or check was weakened.
- Claude independently reviewed head `f6f766482e63e0c002e5df1b90d52e8c0b2b6d96`. Codex inspection and CI of later corrections are author evidence, not a later Claude review. Historical #679 review remains separate.

| Gate | Disposition |
|---|---|
| Catalogue structure/counts/traceability/sentinels | Tooling and deterministic checks delivered; corrected recipe/claim meaning awaits Dean's review |
| Canonical isolated materialisation | Delivered; exact proposed instances retained; all turns queued |
| Read-only hashes/gold export | Delivered; repeat-read hash matches; source/access/context/membership negative proof passes |
| Request bounds/cost | Delivered offline; no tokenizer/overhead/actual billing or quality evidence |
| Exclusive workers | Current clients observed; separate owned cluster stopped and retained; future ownership remains procedural |
| Corpus/run/cost approval | Pending Dean; no manifest, run UUID, approval reference or acceptance hash issued |
| Billing/credit/backstops/region/retention/private key procedure | Pending non-secret confirmation for a later separately authorised run |
| Independent review and merge | Claude review at f6f76648 received; author corrections documented below, no subsequent independent pass claimed. PR remains draft and unmerged; #679 merge permission does not extend to it |
| Calibration/live evaluation/owner acceptance/production | Not performed or granted |


## Independent review of offline preparation — 24 October 2026

[Claude Opus 5.5 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/680#pullrequestreview-5635846279), posted on PR #680 at exact head `f6f766482e63e0c002e5df1b90d52e8c0b2b6d96` against main `e1aeb1ad539afa10eccf46e89c2c188af8bc80a5`. Dean pointed the author to it. The review independently recomputed the hashes, 117/483/642/315 counts and prices, checked runtime equivalence and unchanged adapter controls, and reported four local unit passes plus the CI persisted test job. It grants no corpus, merge, calibration or spending authority. The following is Codex's verified author disposition; no later independent review is claimed.

| Finding | Author disposition |
|---|---|
| 1 — baseline re-verification/re-recording | Accepted reproducibility/documentation gap. The separately retained corrected directory had passed the normal export command, but its creation was ad hoc. Added explicit `--baseline` selection and tested `rerecord` producing a separate proposed output with provenance. Original files and all corpus identities remain intact; differing instance/evidence/gold/bounds are refused. |
| 2 — L12 conflict omitted | Accepted semantic limitation. Re-described L12 and renamed its recipe to omitted-history padding; explicitly disclose its overlap with C03. No message is moved/replaced and no visible-conflict claim remains. Setup-only reannotation is proven against the exact retained evidence; any later different corpus needs separate review. |
| 3 — unsourced T2/W mapping | Accepted. The plan now records the complete proposed derived mapping with rule/parent sources and rationale. The validator checks that source table's consistency, without presenting the derivation as approved authority. |
| 4 — ineffective exclusions | Accepted. The allowed membership set excludes all excluded aliases, and record IDs are checked directly against envelope items. A negative test injects each excluded ID without sentinel text and must fail. |
| 5 — thin negative proofs | Accepted. Added an interrupted canonical preparation audit case, explicit persisted blocker counts for turns/history/commitments, Unknown-preservation proof, `wx` marker refusal and exact missing/duplicate-member error matchers. Regression fixtures remain separate from retained proposed data. |
| 6 — member-suffixed organisation gold | Accepted. Literal `organisation.display_name` gold is refused during catalogue validation; no current gold mapping changes. Future member-dependent assertions need an explicit supported representation. |
| Unverified PostgreSQL visibility note | Confirmed on task-owned PostgreSQL: the built-in non-statistics role sees NULL backend type for another role's session. Preparation now requires effective `pg_read_all_stats` privileges (`USAGE`, not merely membership) or superuser before counting clients; it makes no grant. The persisted visibility and foreign-client tests passed. |

At reviewed head, final CI was 72 checks: 71 successful and one intentional PT-27 skip, including all seven required contexts. Compiled mobile attempt 1 timed out awaiting a specialist-workbench dialog; attempt 2 passed it but failed a PL01 return-context assertion; attempt 3 passed unchanged (286 cases, 28 intentional case skips). Causes remain unconfirmed. The review observed unrelated shard failures elsewhere but neither that observation nor the retries proves a cause. Later correction-head CI is recorded separately on the PR.


Correction validation: six preparation unit cases and the initial typecheck/lint passed. Local persisted attempts with the unchanged 120-second CI timeout did not complete: combined setup first exceeded it, then full 117-member materialisation exceeded it after splitting distinct proof cases. Dependent cases consequently could not run; these are not reported as passes or attributed to a proven baseline cause. Interrupted-preparation preservation and statistics/foreign-client visibility proofs passed in the split runs. Assertions and timeout limits remain unchanged; final correction-head CI and retained-corpus command results are recorded separately.
