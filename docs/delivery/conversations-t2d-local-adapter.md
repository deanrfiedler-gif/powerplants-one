# Local Claude adapter operation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: T2d merged in PR #664; T2e offline extension in draft PR #679; no live evaluation performed. [ADR-0062](../decisions/ADR-0062-local-claude-adapter.md), [contract](../contracts/conversations-t2b.md), [evidence](../testing/evidence/conversations-t2d/README.md).

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

The source catalogue is `tests/fixtures/assistant/t2e-cases.json` (T2E-SYN-01). Materialise it through ordinary local synthetic record/message services in isolated threads, with all human messages queued before any worker starts. Review the allowlisted evidence and gold assertions; use `evaluationEvidenceHash` on each complete unfitted envelope. Record generated IDs/versions and those hashes in the reviewed instance inventory. This is read-only evidence preparation after synthetic fixture creation; it makes no provider call.

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

Stopping: cease worker invocations first. The server-only `stopEvaluation` helper, under `evaluationContext` with the original run and current tagger principal, records a durable stop through the existing operation service; it has no HTTP route. A stop during a call suppresses publication while known usage still settles. If the worker must be killed, ordinary lease recovery retains the possible sent outcome as Unknown. Do not edit ledger/audit/answer rows or manufacture a new run to bypass a stop.

Restarting the same manifest cannot replenish the cap. Counts include all months, settled usage and retained reservations. The $30 monthly ceiling remains authoritative alongside the smaller run/sub-cap. Source or approved-evidence drift, missing metadata, unknown billing and unsupported request options require stopping and a separate corrected implementation/review, not weaker TLS, a larger budget or forced release. Evaluation contains source changes by suppression; full stale-answer/refresh UX remains the separate specification gap named in the plan.

Retain only safe numeric/fixed-enum measurements and specifically reviewed synthetic artifacts per the [T2e evidence record](../testing/evidence/conversations-t2e/README.md). SDK/provider payloads, thinking/signatures, errors and credentials do not enter logs, audit, receipts or public diagnostics.
