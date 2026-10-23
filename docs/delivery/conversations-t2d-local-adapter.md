# Local Claude adapter operation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: T2d implementation under review; no live evaluation performed. [ADR-0062](../decisions/ADR-0062-local-claude-adapter.md), [contract](../contracts/conversations-t2b.md), [evidence](../testing/evidence/conversations-t2d/README.md).

Carl remains off by default. With the existing local-synthetic/loopback/synthetic-identity/non-production settings, `PPO_ASSISTANT=on` uses Simulated unless `PPO_ASSISTANT_PROVIDER` explicitly selects another provider. A key alone changes nothing. Simulation retains its visible label.

Claude additionally requires `PPO_ASSISTANT_PROVIDER=claude` and `PPO_ASSISTANT_MODEL=claude-sonnet-5-5`. Only the guarded server reads `PPO_ANTHROPIC_API_KEY`. Supply it privately outside Git only for a separately authorised live run. Do not put it in a browser, command line, screenshot, diagnostic or issue. This contribution used dummy credentials in code-injected tests only.

Unsupported provider/model, missing key or price, production/hosted identity, alternate API base URL, custom Anthropic headers, proxy, unsafe TLS configuration or native Node HTTP/TLS debug/key-log settings fail closed. There is no simulated fallback. The transport permits only verified-TLS POST to the Anthropic Messages destination and refuses redirects; SDK retries, SDK logs and SDK telemetry are disabled. There is no environment mock switch.

The ordinary document worker runs queued turns. Do not add a separate direct-run route. No model tools or business-write path is added. Human threads remain usable when Carl is unavailable. The existing per-reader source checks, claim withholding and tagger-only failure reason still apply.

Known ordinary input/output usage settles at the dated global standard rate, including any reasoning already included in the output total. A malformed answer is never posted but its known usage still settles. A sent call without trustworthy representable usage keeps its full reservation as Unknown and stops; do not clear it to retry. Cache/tool/unknown billing categories are refused rather than silently undercounted. Declines produce only the fixed CannotAnswer body. Credit exhaustion stops without fallback or retry.

The SDK installation changes package-lock.json. DK-06 includes that file in managed OUT-09 v3+ fingerprints: pre-change managed definitions can become DefinitionChanged and require normal reviewed republication before new pack preparation. This contribution performs no republication or deployment.

## Separate T2e gate — not executed

After T2c and T2d are accepted/integrated and independent review is resolved, Dean approves a concrete synthetic evaluation and its maximum cost. Recheck model availability/rates, provider workspace limits, credit-only/no-auto-reload controls, permitted synthetic fixtures and the US$30 PPO ledger. Confirm local-only runtime and private credential delivery without printing the key. Measure actual provider token overhead, latency and factual grounding; compare refusals and quality separately from mocked integration. Any paid smoke check counts as that authorised run and reserves before dispatch. No live call is needed to finish T2d's mocked implementation proof, and none was made here.


## Review follow-up behavior

Long Claude histories are reduced oldest-first to fit the remaining request allowance, including on retries. The exact question, newest history entry and source evidence remain intact. Answers disclose how many earlier messages were omitted for the request limit separately from access exclusions. An irreducible question/source request that is still too large fails without dispatch. Existing answers remain immutable.

Transport trust is explicitly Node's bundled CA set. System/OpenSSL CA or configuration overrides and TLS key-log flags in NODE_OPTIONS or the node command line are refused before credential access. NODE_USE_SYSTEM_CA and OPENSSL_CONF are included; this may truthfully refuse a worker inheriting such settings from its launcher. No machine trust setting is changed by this contribution.

The optional speed request field is omitted; fast mode is not requested. Unexpected regional/speed billing metadata retains Unknown. A sent HTTP rejection with no known usage also retains the reservation, including authentication/rate/credit errors. Retained reservations can exhaust available PPO budget even when a provider may have billed nothing; there is no automatic reconciliation or manual-release workflow. Do not clear them to force retries. T2e must separately verify the live usage metadata contract and overhead, under explicit live-call authorization.
