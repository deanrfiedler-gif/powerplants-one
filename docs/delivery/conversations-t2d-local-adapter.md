# Local Claude adapter operation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: T2d merged in PR #664; T2e offline extension merged in PR #679; fixture preparation follow-up in draft PR #680; calibration and live evaluation remain unauthorised and unperformed. [ADR-0062](../decisions/ADR-0062-local-claude-adapter.md), [contract](../contracts/conversations-t2b.md), [evidence](../testing/evidence/conversations-t2d/README.md).

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

The source catalogue is `tests/fixtures/assistant/t2e-cases.json` (T2E-SYN-01). Materialise it through ordinary local synthetic record/message services in isolated threads, with all human messages queued before any worker starts. Review the allowlisted evidence and gold assertions; use `evaluationEvidenceHash` on each complete unfitted envelope. Record generated IDs/versions and those hashes in the reviewed instance inventory. This is read-only evidence preparation after synthetic fixture creation; it makes no provider call. The offline commands below provide catalogue validation, canonical materialisation and verified repeat export. They generate a proposed inventory only, with no live-run manifest or approval fields.

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

## Offline fixture preparation commands

Use a dedicated, task-owned local PostgreSQL cluster with `ppo_synthetic_test`, the existing migrations/seeds, synthetic identities and an explicit loopback connection. This authorises no shared-database modification. Initialise only a never-bound disposable fixture workspace; never reset, clone or recreate a bound evaluation workspace or erase Unknown, stops or commitments. Regression tests use a **different** disposable cluster from retained proposed fixtures.

Launch Node 24 with a new explicit child environment containing only the required local runtime values: `NODE_ENV=test`, `PPO_ENV=local-synthetic`, `PPO_EXPOSURE=loopback`, `PPO_IDENTITY=synthetic`, `PPO_ASSISTANT=off`, the task's fixed dummy-only local `DATABASE_URL`, and a task-owned document directory outside Git. Supply OS executable/temp paths explicitly. Do not source `.env` files, inspect the inherited environment, include any provider key, or weaken TLS. The existing SDK tests use fixed dummy keys and intercepted transport; production transport remains unchanged. Inherited system-CA flags are not imported into the controlled child.

Run from the dedicated checkout, after dependencies are installed with pinned npm and empty task-owned npm config. Create an empty private output directory outside Git. No worker, application server or other database client may run against this cluster.

```sh
node --import tsx scripts/t2e-prepare.ts validate
node --import tsx scripts/t2e-prepare.ts materialise ABSOLUTE_OUTPUT_DIRECTORY --exclusive-local-owner
node --import tsx scripts/t2e-prepare.ts export ABSOLUTE_OUTPUT_DIRECTORY --exclusive-local-owner
node --import tsx scripts/t2e-prepare.ts review ABSOLUTE_INVENTORY_FILE
```

`validate` and `review` need no database or provider configuration. `materialise` claims the output path with `preparation-started.json` before writes, creates canonical records and human messages, and saves `preparation.json` plus `proposed-inventory.json`. The latter contains generated IDs, aliases, principals/readers/company, source versions, gold-field support, excluded-source mappings, full-unfitted evidence hashes and safe numeric request/cost reports. It is deliberately a different schema from an approved manifest and cannot be installed by `parseEvaluation`. All 117 turns remain Queued. No provider adapter, worker, assistant answer, budget reservation or approval record is created.

`export` is read-only: it reconstructs evidence as the original tagger, applies the stored current working company, verifies ask/read/post authority and compares the canonical inventory hash with the saved original. Repeat reads must match. Missing/duplicate members, source/access/context changes, any consumed turn, unexpected human/agent message, changed tooling or gold mismatch refuse the operation. A file-byte hash never replaces `evaluationHash`. The command does not overwrite the baseline or offer a force flag. `--baseline ABSOLUTE_FILE` explicitly selects a different proposed inventory for exact verification; its canonical hash and full reconstructed report must still match. Preserve interrupted/failed preparations and their attempt marker for review; deleting the marker or making fresh members is not recovery authority.

The exclusive-owner argument is an operator assertion, **not a durable worker lock**. Active-client checks verify all current connections belong to this process's pool; they cannot prevent a later worker connection. Own the cluster/port from creation through disposition, do not share its launcher, never start an ordinary worker (including Off/Simulated), and stop the cluster after verified export, retaining its data. Before any separately approved execution, restart that same retained cluster and reverify the inventory; no reset or replacement run.

Each proposed inventory has two generated review documents beside it (PR #708, 25 October 2026). `materialise` and `rerecord` write `cases.md` and `review.md` with the inventory, in the same once-only `wx` mode, and write the inventory one report field or member per line. `cases.md` holds 15 scenario cards: question, setup, the first sample's gold claims with their source identities and versions, each assessment class and the predeclared rule for every scoring dimension. `review.md` lists all 117 samples with their turn, source/exclusion/gold-binding counts, input estimate and fitted history. `export` refuses changed or missing review documents beside its baseline; only LF/CRLF conversion is tolerated. `review` checks a retained package offline: the inventory's canonical hash, its binding to the current catalogue, per-member gold against the catalogue, the tool's file layout and both documents. It reads no database, so it cannot detect corpus drift; use `export` for that. The cards are a projection of the inventory and grant no approval.

Review the proposed inventory's synthetic contents before any public copy. Keep actual approval/operator mappings private. The inventory is not a forecast of model quality or actual tokens; fitted byte estimates plus 8,192 remain uncalibrated. C03/L12 report both retrieval-window and request-fitting omissions. Gold claims with empty field support are explicitly human boundary-rubric checks or application invariants, not fabricated factual proof. Dean must approve the corrected corpus and exact run/cost independently of merging this tooling.


### Proposed re-recording after a tooling or annotation correction

Claude's review of PR #680 exposed a reproducibility gap in how the first corrected export was produced. The private corrected directory could be verified, but its creation was an ad hoc procedure. Use the tested command below for subsequent corrections. This is **not owner approval**, recovery from an evaluated outcome, or permission to replace messages.

Keep the same stopped, exclusively owned synthetic cluster and all original files. Inspect the code/catalogue diff and previous inventory. If the catalogue hash changed, save its exact previous Git version to a separate private file; the tool checks its hash. Restart the same cluster with the clean environment above. Create a new empty output directory outside Git, then run:

```sh
node --import tsx scripts/t2e-prepare.ts rerecord ORIGINAL_DIRECTORY --exclusive-local-owner --baseline PREVIOUS_INVENTORY_FILE --previous-catalogue PREVIOUS_CATALOGUE_FILE --output NEW_DIRECTORY
node --import tsx scripts/t2e-prepare.ts export NEW_DIRECTORY --exclusive-local-owner --baseline NEW_DIRECTORY/proposed-inventory.json
```

Omit `--previous-catalogue` only when the catalogue hash is unchanged. Re-recording verifies the original canonical baseline hash and catalogue binding, then rebuilds every envelope with current tools. It accepts only an identical inventory after substituting the two provenance hashes and the gold claim/assessment annotations. For a catalogue change, only reviewer annotations are accepted: setup prose, gold claim wording, assessment class, per-case `scoring` declarations, the catalogue schema version and the legacy `conflicting-padding` → `omitted-history-padding` label. None reaches a provider. Questions, record sets, recipes, gold field support, membership, messages, sources, evidence hashes and costs cannot change. The baseline's gold annotations must match its own catalogue. `rerecording-provenance.json` lists every annotation change with its previous and current value. It writes `preparation.json`, `proposed-inventory.json`, `cases.md`, `review.md` and `rerecording-provenance.json` to the new directory, with a `wx` attempt marker first. An interrupted/refused output remains claimed; no original file or database row is overwritten. Stop the retained cluster again after verification.

Review the new hash and provenance as a **proposal**. A future approved manifest must bind separately approved exact values; neither the original nor a re-recorded proposal is installable as an approved manifest. Never re-record to clear a consumed turn, Unknown, stop, commitment or source/access/context drift. PostgreSQL client counting now refuses a role without superuser or effective `pg_read_all_stats` privileges (`pg_has_role` USAGE); the tool makes no grants. Even with visibility, exclusive ownership remains the operator's continuing obligation.

The current retained proposal exposes member labels in provider-visible Organisation names and L06 sibling Opportunity titles: case/model/repetition and a `SYN T2E` marker. Prompts therefore differ across models and may reveal evaluation context. Dean must either explicitly accept that limitation for the exact inventory or separately authorise a reviewed corpus with opaque labels and an equivalence policy. Neither option is accepted by this preparation work; preserve existing fixtures and provenance, and never replace a bound run to evade a stop. See the [plan's naming limitation](../decisions/conversations-t2e-evaluation.md#retained-corpus-naming-limitation--follow-up-review).
