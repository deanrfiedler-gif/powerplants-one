# ADR-0061 — Local Claude Messages adapter

<!-- versioning: git; committed history is authoritative -->

Owner/decider: Dean Fiedler. Date: 22 October 2026. Status: authorised T2d implementation choice; independent review and owner acceptance pending. Codex working for Dean. [T2d plan](conversations-t2d-design.md), [T2 scope](conversations-t2-scope.md) T2-1–12/W5/W9, [A1/A2](ppo-assistant-direction.md), [ADR-0056](ADR-0056-dependency-update-and-audit-gates.md).

## Decision and alternatives

Pin official `@anthropic-ai/sdk` **1.1.0**, installed by npm with its lockfile, behind `AssistantAdapter`. Node 24.22.0/npm 11.19.0 satisfy PPO's engines; the SDK supports Node 20+ and TypeScript 5+. No engine override. Package metadata lists `standardwebhooks`, `json-schema-to-ts` and `@opentelemetry/api` dependencies; the real installation added eight locked packages and changed the existing zod 4.5.4 metadata from dev to devOptional for the SDK peer. Runtime audit reports zero vulnerabilities; the full-lock gate passes with ADR-0056’s existing braces exception, with no new exception. Raw HTTP avoids SDK defaults but duplicates typed API/error contracts and conflicts with accepted W9. An agent framework adds orchestration already owned by PPO and is unnecessary.

Pin **`claude-sonnet-5-5`** provisionally for implementation and T2e. Anthropic's versioning page identifies post-4.6 dateless model IDs as fixed snapshots, not moving aliases; serving infrastructure can still change. This matches W5; no invented date suffix or live Models API lookup. T2e determines measured suitability.

## Request and transport boundary

Explicit `PPO_ASSISTANT_PROVIDER=claude` and `PPO_ASSISTANT_MODEL=claude-sonnet-5-5` are required in addition to existing local-synthetic, loopback, synthetic-identity and non-production guards. Default remains Simulated with Carl off. Key presence does not select or enable anything. Missing/unknown provider/model fails truthfully; no fallback. Read `PPO_ANTHROPIC_API_KEY` only during guarded server execution, never at module import/factory construction.

Use one foreground `messages.create` per PPO dispatch, `maxRetries: 0`, bounded timeout and cancellation. Explicit API key/auth settings, base URL, quiet logger and `openTelemetry: false` prevent inherited SDK credentials/endpoints/debug/telemetry defaults. Supply a small owned HTTPS transport to avoid inherited global fetch dispatchers/proxies. Permit only POST `https://api.anthropic.com/v1/messages`, TLS verification enabled, no redirects, bounded response bytes. Tests inject transport in code; no environment mock switch or UI endpoint. Base-URL overrides and unsafe TLS/proxy configuration or native Node HTTP/TLS debug/key-log settings fail closed before credential access.

Only the bounded `AdapterRequest` projection enters one untrusted-data user message. Trusted instructions explicitly treat question/history/narratives as evidence, require source IDs and prohibit actions. Schema uses the supported basic JSON subset with `additionalProperties: false`; PPO enforces lengths, counts, citations and plain text independently. Sonnet 5.5 rejects `thinking: disabled`: use `thinking: {type: between_tools}` with no tools, which the model documentation says produces text only. No streaming, caching, tools, Files, Batch, provider conversation state or automatic fallback.

## Bounds, prices and outcomes

The existing six-call / 48,000-input / 8,000-output / 60-second limits and US$30 monthly reservation-first ledger remain authoritative. A provider-specific conservative input estimate counts UTF-8 bytes of the entire serialized Messages body (including trusted instructions and schema), plus a separately explicit allowance for provider-injected structured-output instructions. It is not the simulation character meter or a measured tokenizer. Provider overhead is not published as an exact bound: actual reported usage is checked; unexpected/unrepresentable usage fails closed and retains the reservation. Live token calibration remains a T2e gate, not a claim from mocked tests. No count-tokens request is introduced.

Pricing version `anthropic-sonnet-5-5-global-2026-10-22`: global standard input **US$2/M**, output **US$10/M**, stored as 2,000,000 and 10,000,000 micro-USD per million tokens. Full allowance reserves 176,000 micro-USD, using existing integer rounding. Explicit global/standard configuration avoids regional/priority uplift. No cache or tool use is requested. Reported nonzero cache creation/read, tool or other unsupported billing categories must not be discarded or priced as ordinary input: retain Unknown and stop. Only the documented inclusive thinking_tokens output detail is accepted; unknown nested billing details also retain Unknown. Ordinary input/output usage settles before parsing/citation/post failures. Refusal has no partial text and still settles known usage.

Documented billing errors/spend exhaustion stop without retry/fallback. Authentication/permission/configuration errors are unavailable. Rate limits and transient errors map to fixed codes; sent requests without known usage retain Unknown and cannot retry. Confirmed pre-transport failures release. Never infer zero usage merely from an HTTP error. Raw provider errors stay transient and never enter logs, receipts or diagnostics. Runner owns retries, each with a new reservation, within its existing bounds.

## Sources checked 22 October 2026

- [Official SDK repository](https://github.com/anthropics/anthropic-sdk-typescript), [npm metadata](https://registry.npmjs.org/@anthropic-ai%2fsdk/1.1.0), [SDK documentation](https://platform.claude.com/docs/en/cli-sdks-libraries/sdks/typescript): runtime support, two default retries, default long timeout, ANTHROPIC_LOG and fetch options. Installed source is inspected before implementation.
- [Model overview](https://platform.claude.com/docs/en/models/overview), [snapshot policy](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions), [Sonnet 5.5 changes](https://platform.claude.com/docs/en/models/sonnet-5-5/whats-new-sonnet-5-5): exact ID and thinking compatibility.
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs): output_config.format, refusal/truncation, unsupported length/count constraints, billable injected instructions and grammar caching distinct from prompt caching.
- [Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [errors](https://platform.claude.com/docs/en/api/errors): dated rates, categories and error shapes. These are public documentation reads, not provider API execution.

## Consequences and gates

The lockfile remains part of DK-06 managed OUT-09 definition fingerprints (`src/documents/publication/definition.ts`). Existing managed publications can become DefinitionChanged and require normal republication before new Job pack preparation. Legacy v1–2 and OUT-10/14 remain outside that fingerprint. T2d does not repair the template system or publish business outputs.

All automated provider proof uses unmistakably dummy credentials and the actual pinned SDK with intercepted transport. No real key is inspected, no provider request is made. Persisted integration, live model quality, Dean's acceptance and production readiness are separate. Independent different-model review is required before merge. No migration, capability or grant is added.
