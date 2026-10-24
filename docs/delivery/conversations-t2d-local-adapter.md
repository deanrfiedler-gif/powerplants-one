# Local Claude adapter operation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: T2d merged in PR #664; T2e offline extension in PR #679 with merge authorised subject to checks; calibration and live evaluation remain unauthorised and unperformed. [ADR-0062](../decisions/ADR-0062-local-claude-adapter.md), [contract](../contracts/conversations-t2b.md), [evidence](../testing/evidence/conversations-t2d/README.md).

Carl remains off by default. With the existing local-synthetic/loopback/synthetic-identity/non-production settings, `PPO_ASSISTANT=on` uses Simulated unless `PPO_ASSISTANT_PROVIDER` explicitly selects another provider. A key alone changes nothing. Simulation retains its visible label.

Claude additionally requires `PPO_ASSISTANT_PROVIDER=claude` and an explicit supported `PPO_ASSISTANT_MODEL`. Sonnet remains `claude-sonnet-5-5`; the T2e comparison adds `claude-haiku-5-5` and `claude-opus-5-5`. Runtime Claude also requires the evaluation manifest below. Only the guarded server reads `PPO_ANTHROPIC_API_KEY`. Supply it privately outside Git only for a separately authorised live run. Do not put it in a browser, command line, screenshot, diagnostic or issue. Offline proof uses dummy credentials in code-injected tests only.

Unsupported provider/model, missing key or price, production/hosted identity, alternate API base URL, custom Anthropic headers, proxy, unsafe TLS configuration or native Node HTTP/TLS debug/key-log settings fail closed. There is no simulated fallback. The transport permits only verified-TLS POST to the Anthropic Messages destination and refuses redirects; SDK retries, SDK logs and SDK telemetry are disabled. There is no environment mock switch.

The ordinary document worker runs queued turns. Do not add a separate direct-run route. No model tools or business-write path is added. Human threads remain usable when Carl is unavailable. The existing per-reader source checks, claim withholding and tagger-only failure reason still apply.

Known ordinary input/output usage settles at the dated global standard rate, including any reasoning already included in the output total. A malformed answer is never posted but its known usage still settles. A sent call without trustworthy representable usage keeps its full reservation as Unknown and stops; do not clear it to retry. Cache/tool/unknown billing categories are refused rather than silently undercounted. Declines produce only the fixed CannotAnswer body. Credit exhaustion stops without fallback or retry.

T2d's SDK installation changed package-lock.json. DK-06 includes that file in managed OUT-09 v3+ fingerprints: pre-change managed definitions can become DefinitionChanged and require normal reviewed republication before new pack preparation. T2e changes no dependency or lockfile and performs no republication or deployment.

## Separate T2e gate — not executed

T2c and T2d are integrated; that does not grant business acceptance or paid-use authority. The [T2e plan and gate register](../decisions/conversations-t2e-evaluation.md) specifies the separate calibration, main-stage and acceptance decisions. Refresh provider controls, credit-only/no-auto-reload, permitted synthetic fixtures and available PPO commitment privately with Dean. No paid smoke test is implicit; every call belongs to an explicitly approved stage and reserves before dispatch.


## Review follow-up behavior

Long Claude histories are reduced oldest-first to fit the remaining request allowance, including on retries. The exact question, newest history entry and source evidence remain intact. Answers disclose how many earlier messages were omitted for the request limit separately from access exclusions. An irreducible question/source request that is still too large fails without dispatch. Existing answers remain immutable.

Transport trust is explicitly Node's bundled CA set. System/OpenSSL CA or configuration overrides and TLS key-log flags in NODE_OPTIONS or the node command line are refused before credential access. NODE_USE_SYSTEM_CA and OPENSSL_CONF are included; this may truthfully refuse a worker inheriting such settings from its launcher. No machine trust setting is changed by this contribution.

The optional speed request field is omitted; fast mode is not requested. Unexpected regional/speed billing metadata retains Unknown. A sent HTTP rejection with no known usage also retains the reservation, including authentication/rate/credit errors. Retained reservations can exhaust available PPO budget even when a provider may have billed nothing; there is no automatic reconciliation or manual-release workflow. Do not clear them to force retries. T2e must separately verify the live usage metadata contract and overhead, under explicit live-call authorization.

## Preparing an evaluation without authorising one

The source catalogue is `tests/fixtures/assistant/t2e-cases.json` (T2E-SYN-01). The [offline preparation procedure](#offline-corpus-preparation-and-review) materialises it through ordinary local synthetic record/message services in isolated threads, with all human messages queued before any worker starts. The exporter records `evaluationEvidenceHash` on each complete unfitted envelope, IDs/versions and fitted request bounds. Catalogue checks validate case/requirement IDs; persisted checks validate sentinel placement and exclusion under the explicit tagger and company. Review the evidence and gold assertions separately. The 6,000-input-token forecast remains an assumption, not measured live usage.

Use a dedicated synthetic evaluation database with the existing schema and retained ledger. Dedicated means exclusive worker ownership, not a new empty accounting history: preserve the workspace identity and all existing commitments; never reset or clone a database to replenish budget. From materialisation through completion or abandonment, no ordinary/background worker may run against it without the exact manifest, including between calibration and Dean's decision. A manifest-less worker selects Queued turns regardless of intended evaluation membership: Carl off can terminally mark them FeatureOff, while Simulated can consume them with unbound ledger history. These unstarted turns have no durable evaluation-reservation marker. An invalidated corpus needs review and renewed approval; do not recreate it to bypass a stop. Database isolation is a preparation requirement, not authority to provision anything in this offline correction.

The private run manifest is a bounded JSON file (maximum 64,000 bytes) with exactly these fields:

| Field | Meaning |
|---|---|
| schema_version | Integer 1 |
| run_id / workspace_id | Lowercase UUIDs; one approved run/workspace |
| source_commit | Full 40-character SHA of the clean execution checkout |
| fixture_hash / approval_reference | SHA-256 of reviewed instance inventory / separately held approval record; no raw payload or approver details in the manifest |
| cap_micro / calibration_cap_micro | Positive integer micro-USD, at most 5,000,000 / 1,650,000; calibration cannot exceed total |
| turns | At most 117 entries; each exactly message_id, evidence_hash, model, stage, case_id, repetition |
| member fields | Immutable trigger UUID, reviewed evidence SHA-256, exact supported model, Calibration or Evaluation, C01–C03 or L01–L12, repetition 1 for calibration or 1–3 for evaluation |

Compute the canonical manifest digest with `evaluationHash`; a file-byte hash is not a substitute for the canonical hash. Reviewers must verify hashes against the actual approved artifacts. No real approval manifest is committed, generated or accepted by this offline task. A hash alone does not authenticate Dean's approval.

After separate authorisation, the operator's private launcher supplies non-secret `PPO_ASSISTANT_EVALUATION_MANIFEST` (absolute JSON path), `PPO_ASSISTANT_EVALUATION_HASH`, `PPO_ASSISTANT_EVALUATION_STAGE=Calibration`, the explicit model and all existing local guards. It privately provisions the key outside Git without printing it or adding it to command history. The operator confirms completion without disclosing the value. Never ask Dean to paste a key. Do not inspect complete environment files or provider-account settings as part of this offline work.

Use the existing document worker; it processes at most one manifest turn per invocation, filtering model/stage before its limit. Observe settlement and safe metadata before invoking it again. No direct provider call or worker-bypass endpoint. After all nine successful calibrations, stop and obtain Dean's separate main-stage approval. Only then select Evaluation and supply `PPO_ASSISTANT_CALIBRATION_ACCEPTANCE`, the accepted calibration report's SHA-256. Do not use dummy hashes outside mocked tests.

Stopping: cease all future worker invocations first; do not remove the manifest and run an ordinary worker. Ceasing invocations does not cancel an already sent call or suppress its eventual answer. The server-only `stopEvaluation` helper, under `evaluationContext` with the original run and current tagger principal, records a durable stop through the existing operation service; it has no operator script or HTTP route. It requires a previously bound turn, current tagger access and an open thread; a locked turn can cause AssistantLeaseLost. It is not an unconditional operator kill switch. A successfully recorded stop during a call suppresses publication while known usage still settles. If the worker must be killed, ordinary lease recovery retains the possible sent outcome as Unknown. Do not edit ledger/audit/answer rows or manufacture a new run to bypass a stop.

Restarting the same manifest cannot replenish its cap. Counts include its members across all months, settled usage and retained reservations. A new run ID with entirely fresh messages has separate caps and does not inherit an earlier run's Unknown/failed-member/stop gate; only the separate monthly ceiling still spans runs within its month. Each exact run needs Dean's approval, and using a replacement run to evade the existing stop is prohibited. The $30 monthly ceiling remains authoritative alongside the smaller run/sub-cap. SDK 1.1.0 permits null geo/speed/tier metadata; this implementation still records Missing, settles representable known usage and stops. A first-call stop for this reason is a disclosed calibration risk requiring Dean's acknowledgement. Source or approved-evidence drift, missing metadata, unknown billing and unsupported request options require stopping and a separate corrected implementation/review, not weaker TLS, a larger budget or forced release. Evaluation contains source changes by suppression; full stale-answer/refresh UX remains the separate specification gap named in the plan.

Retain only safe numeric/fixed-enum measurements and specifically reviewed synthetic artifacts per the [T2e evidence record](../testing/evidence/conversations-t2e/README.md). SDK/provider payloads, thinking/signatures, errors and credentials do not enter logs, audit, receipts or public diagnostics.

## Offline corpus preparation and review

Use `scripts/assistant-evaluation-prepare.ts` from the dedicated worktree with pinned dependencies. It invokes no worker or provider answer method and blocks fetch/HTTP/HTTPS. Per-model meters receive a code-created off-state configuration whose credential getter throws. Do not load an existing environment file. Supply only the local synthetic database configuration created for this preparation and the usual loopback/synthetic-identity/non-production settings; set `PPO_ASSISTANT=off` and `PPO_T2E_PREPARATION=exclusive-offline-synthetic`.

Use `ppo_synthetic_test` on a task-owned loopback cluster, freshly migrated and seeded through the existing tools, with document storage outside the checkout. The full repository reset needs sufficient PostgreSQL lock capacity (local proof uses `max_locks_per_transaction=1024`). This is a new offline fixture environment, not a replacement for an existing evaluation workspace/ledger. Never reset or clone a funded run to bypass reservations. Preparation performs no reset and refuses existing assistant turns, budget entries or partial T2e threads. Database tests retain their separate explicitly disposable reset contract.

Stop ordinary/background workers and retain exclusive ownership throughout review. The environment acknowledgement is an operator prerequisite, not a cross-process worker lock. No durable reservation marker is added. An ordinary worker could consume Queued turns; verification refuses changed states and never repairs or requeues them.

Run from the worktree root with a new output directory whose parent exists:

```sh
node --import tsx scripts/assistant-evaluation-prepare.ts prepare tmp/t2e-review
node --import tsx scripts/assistant-evaluation-prepare.ts verify tmp/t2e-review
```

Preparation creates all 117 independent samples through canonical services. Its sole direct permission fixture edit narrows the seeded CRM receiver's `activity.read` to synthetic L05/L10 sites. L10's other Internal Activity has no site, proving an intersection exclusion while the visible Activity remains readable. No capability or production seed changes.

- `corpus.json` contains exact sample IDs, models/stages/repetitions, tagger/workspace/company context, aliases and excluded sentinel placements. It is not an evaluation manifest.
- `inventory.json` contains canonical fields/versions, complete pre-fit envelopes/hashes, per-model fitted request hashes/bounds, explicit gold bindings and proposed scoring applicability. Its `inventory_hash` is the canonical JSON digest of every other field, including preparation-commit/change metadata, not a raw-file-byte digest. Retrieval timestamps are retained; repeat verification compares stable evidence and verifies that complete retained content hash.
- `review.md` provides a compact sample table; `cases.md` is generated from the same inventory and provides case cards with gold bindings, model/application assessment lanes and predeclared outcome-dependent scoring rules. No answer scores or measured provider usage are manufactured.

Verify reconstructs every envelope under its original tagger/company. It checks the exact 9/108 matrix, unique messages/threads, Queued state/zero calls, canonical facts, participant omissions, ordering/coverage, sentinels in their actual excluded fields, identity stripping, question/newest-history retention, long-case fitting and zero budget entries. Altered artifacts, facts/versions or access invalidate the snapshot.

To create a new proposed snapshot of retained unconsumed instances after a correction, use a new directory:

```sh
node --import tsx scripts/assistant-evaluation-prepare.ts export tmp/t2e-review/corpus.json tmp/t2e-review-corrected
node --import tsx scripts/assistant-evaluation-prepare.ts verify tmp/t2e-review-corrected
```

Export is read-only against business records and preserves original files. It still validates catalogue facts and requires every turn Queued with zero spending. A changed hash is new review material, not continuation permission. Failed/partial preparation is retained for diagnosis; overwrite is refused. Do not edit ledger, answer or turn rows to force it through.

Review the 15 definitions and every instance mapping, particularly A2's proposed calendar date versus its UTC instant (the model receives no site timezone), L04's conflicting narratives, L06's bounded coverage, L09/L10's excluded fields and C03/L12's retained question/history. Score volunteered factual claims and citations even on L11; do not score application footers or fixed refusal wording as model quality. Apply the [outcome branches and denominator rules](../decisions/conversations-t2e-evaluation.md#fixture-matrix-and-rubric) before execution. Gold/rubric applicability needs explicit review; deterministic preparation cannot judge future answers. Bind the exact clean execution revision and fixture hashes after final implementation review. These commands provide no run ID, private approval reference, credential delivery or live authority.
