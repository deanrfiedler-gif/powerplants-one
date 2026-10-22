---
document_id: PPO-CONV-T2B-CONTRACT
title: Conversations T2b contract
owner: Dean Fiedler
status: Synthetic assistant core implemented; validation recorded in the draft pull request; cross-model review and owner acceptance pending
versioning: git
---

# Conversations T2b contract

Owner: Dean Fiedler. This is the local, off-by-default synthetic implementation of [PPO-CONV-T2-SCOPE](../decisions/conversations-t2-scope.md), rules T2-1 to T2-12 and answers W1 to W9. The [design](../decisions/conversations-t2b-design.md) (PPO-CONV-T2B-DESIGN) records Dean's accepted P1 to P4 and the implementation choices. The [eight-task plan](../superpowers/plans/2026-10-19-conversations-t2b.md) supplies the implementation sequence. The scope governs.

The core extends the [T1b contract](conversations-t1b.md). It adds no UI or route. Code delivery, independent review, Dean's acceptance and production readiness are separate; cross-model review has not happened.

## What exists

Migration 0110 and seed 110 support `src/assistant/`, the conversation service and the document worker.

| Part | Behaviour |
|---|---|
| Agent mention | `{ ordinal, kind: "Agent" }` uses `@{n}` in a person's message. At most one per message. Carl is one name constant, has no user row and is never a participant or the target of a human ask |
| Turn | Exactly one queued turn per tagging message, created atomically with the message. The tagger is `acted_for_id`. Concurrent workers cannot publish a second answer |
| Agent message | Immutable plain text, authored by `Agent` with no `author_id`; carries the acted-for person, turn, outcome, adapter and left-out count. The simulated adapter is labelled `Simulated` |
| Claims and sources | Append-only factual claims and gaps, with numbered source references, source type and ID, version and retrieval time. Only validated citations can be posted |
| Budget | A ceiling row per workspace and one reservation per call. Integer micro-USD, UTC calendar month, maximum US$30 |
| Worker | `scripts/document-worker.ts` calls `runAssistantTurns(10)`. Default adapter is deterministic `Simulated/simulated-1`, with zero prices and no network request. T2d adds explicit local-only Claude selection under [ADR-0061](../decisions/ADR-0061-local-claude-adapter.md) |

## Access and evidence (T2-2 to T2-4, P2, P4)

Tagging requires the anchor's existing read rules, `conversation.read`, `conversation.post` and `conversation.agent.ask` in its scope. The ask duty is checked before receipt replay. Seed 110 derives it only from live local synthetic profiles' `conversation.post` grants, retaining scope and validity. Hosted testers receive none.

The runner reloads the tagger's working company at start and before dispatch/post checks. Carl acts as that person. Evidence is read in one read-only, repeatable-read transaction. Readers are the participants who can read the thread now, plus the tagger. Each candidate must be readable by the tagger and every such reader before its fields are selected. Candidates excluded by another reader's access contribute only to `left_out`; their titles and identities never enter the adapter request.

The source-access service reuses the existing opportunity, organisation, Internal Activity and project visibility SQL. Project tasks, RAID and acceptance-stage reads use the parent project's `project.read` duty.

| Source | Permitted evidence |
|---|---|
| Opportunity | Number, title, stage, close outcome, need summary, qualification note and expected close date; never deal value |
| Organisation | Number, display name, relationship status and sector |
| Internal CRM Activity | Kind, type, summary, status, due/start timing, outcome and whether it is the anchor's next action. Only `CustomerContact` and `RelationshipReview` Activities enter deal evidence |
| Project | Number, title, lifecycle, target date, task and milestone counts, schedule dates, baseline revision/finish, next milestone and open/high-priority/overdue RAID counts |
| Project task | Title, phase, status, milestone flag, dates and progress |
| Project RAID | Kind, state, priority and due timing; no narrative |
| Acceptance stage | Reference, title, state, closeout, reassessment and due timing |

Queries select named columns and copy only their explicit DTO allowlists. Contact details, organisation notes, ERP identifiers, costs, prices, margins, deal value and non-CRM narratives are excluded. The adapter sees opaque `S1`, `S2` source IDs and permitted fields; internal record IDs, source types, versions, routes and reader identities remain server-side.

Deal evidence includes the anchor and organisation, up to ten sibling deals and twenty Internal CRM Activities, newest first. Project evidence includes up to twenty tasks, twenty open RAID entries, twenty acceptance stages and ten received deals. Every list reports returned count, limit and whether more exist. Neither an old next action nor an inaccessible one expands a window.

The last twenty messages through the tagging message form bounded history. The question, message text and narrative fields are explicitly untrusted evidence (R7). Record mentions are expanded only when every reader can open them. Earlier agent answers undergo the same per-claim withholding rule before entering evidence.

## Commands and lifecycle

Every mutation uses the existing `sharedOperation` transaction, canonical hash, audit event, receipt and `ConversationChanged` outbox path, acting as the tagger. Step IDs are deterministic hashes of the turn, step and access attempt. Model calls run outside database transactions and locks.

| Internal command | Result |
|---|---|
| Conversation `startThread` / `postMessage` | Creates the agent mention and its queued turn with the human message |
| `startTurn` | Checks current authority and the switch/price, claims a two-minute lease and reserves the first call |
| `dispatchCall` | Rechecks readers and source access, reserves before dispatch and increments the call count; replay never sends again |
| `recordCall` | Settles known usage, releases a confirmed unsent call or retains unknown usage; records only billing metadata and counters |
| `retryAccess` | Permits one envelope rebuild, preserving call/token counts and the original deadline |
| `postAnswer` | Rechecks authority, readers, sources and deadline; atomically posts the message, claims, sources, receipt and final state |
| `endTurn` | Records a terminal failure/unavailability/discard state and handles any open reservation |

`Queued` becomes `Answering`, or ends immediately if access, feature availability or budget prevents starting. `Answering` ends as `Answered`, `CannotAnswer`, `Unavailable`, `Failed` or `Discarded`. Finished turns are permanent.

Only `Answered` and `CannotAnswer` post a message (P3). A decline posts the fixed decline body, with no partial model text, and still records its usage. `Unavailable`, `Failed` and `Discarded` post nothing. The reason is returned by `readThread` only to the tagger; other participants receive the state and a null reason.

Reasons include `FeatureOff`, `BudgetSpent`, `PriceMissing`, `CreditExhausted`, `ProviderUnavailable`, `Declined`, `NoEvidence`, `InvalidCitation`, `UnsafeOutput`, `TurnLimit`, `Timeout`, `Interrupted`, `AccessChanged`, `ThreadResolved`, `ActorLostAccess`, `RateLimited`, `MalformedOutput` and `InternalError`. These are fixed codes, never raw provider errors.

An access change rebuilds evidence once; a second change discards the turn. Lost tagger authority or a resolved thread discards it immediately. An expired answering lease ends `Failed/Interrupted`, keeping open reservations `Unknown`. A late adapter result cannot post after the 60-second deadline. Carl's answer never closes a person's ask.

## Budget and limits (T2-6, T2-7)

Each call reserves its maximum allowed input/output cost before dispatch. The helper and database guard require read-committed isolation and acquire the workspace budget advisory lock before summing spend. The monthly total includes settled costs and the full amount of both reserved and unknown entries; racing turns cannot exceed the ceiling. A lower configured ceiling is allowed, a higher one is refused.

Known usage settles even if validation or posting later fails. A confirmed unsent call releases its reservation. Unknown usage remains committed, cannot be released and may only settle later if usage becomes known. A terminal ledger entry cannot fund another dispatch. Missing prices and credit exhaustion fail closed.

| Limit | Value |
|---|---|
| Calls per turn, including retries | 6 |
| Input / output tokens across the turn | 48,000 / 8,000 |
| Turn deadline | 60 seconds |
| Factual claims | 12, each at most 500 characters |
| Gaps | 5, each at most 300 characters |
| Rendered message | 4,000 characters |
| Access rebuilds | 1 |
| Safe retries for unavailable/rate-limited/malformed responses | At most two for each error type, within all turn limits |

Sent calls with unknown usage are not retried. Input estimates are checked before each call, and reported usage must fit the remaining allowance. Simulated usage is the JSON character count divided by four, rounded up. This is a deterministic fixture meter; T2d uses a provider-specific full-request UTF-8 byte bound plus explicit schema/system overhead headroom, not this simulation meter. Reported unsupported billing categories retain Unknown and stop; see [ADR-0061](../decisions/ADR-0061-local-claude-adapter.md) for its calibration limit.

## Answer checks and reads (T2-5, T2-8, T2-9, P1)

Every factual claim must cite at least one source in the supplied envelope. Unknown IDs, missing citations, mention tokens, markup, control characters, unsafe links and oversized output are refused. Sources are numbered in first-cited order. Gaps, bounded-coverage lines and a count-only left-out line are rendered explicitly.

`readThread` uses a read-only, repeatable-read snapshot. Agent messages add `author_kind`, `acted_for` and `agent` metadata containing outcome, adapter, label, claims, sources and left-out count. The body is that reader's projection of the immutable answer.

A claim is withheld if the reader cannot currently open every source it cites: its text is null in the projection and its rendered replacement is “A statement from a record you can't open”. An unreadable source contains only its citation number and `can_open: false`; no type, ID, title or route. Readable labels are selected after access checks. Gaps, coverage and left-out lines remain. Stored rows never change.

## Database and logging guards

PostgreSQL guards the turn transitions, version increments, immutable final turns, one answer per turn, agent author shape, required acted-for participant and duties, matching audit/receipt, agent mention shape, append-only claims/sources, ledger transitions and monthly ceiling. Migration 0110 inspects live constraint/function definitions and refuses unexpected function shapes. Identity alterations drain and restore deferred `identity_target` checks, including the populated upgrade across 0026. Populated late-install proofs also apply reserved 0110 after 0113 and 0114, preserve the original rows, grants and ledgers, and verify that 0113's Sales/Estimating binding guard and 0114's readable-reference allocator are unchanged.

Audit events, receipts, outbox jobs, turns and ledger entries hold identifiers, hashes, fixed codes, counts and timing only. Prompt, evidence and answer text are absent from those records (T2-10). Published text belongs only in the conversation message and its claim rows; the envelope and raw adapter response remain in memory.

## Switch and boundaries

`PPO_ASSISTANT=on` is effective only with `PPO_ENV=local-synthetic`, `PPO_EXPOSURE=loopback`, `PPO_IDENTITY=synthetic`, and a non-production, non-hosted environment. It is server-side and off by default. Human threads remain available while Carl is off; a permitted tag ends `Unavailable/FeatureOff`.

T2b itself adds no write tools, provider dependency, route, picker, answer card, hosted grants, reminder scheduling or deployment. T2d now adds the separately authorised official SDK adapter; T2c's UI/review remains independent.

T2d selection requires `PPO_ASSISTANT_PROVIDER=claude` and `PPO_ASSISTANT_MODEL=claude-sonnet-5-5` in addition to every existing guard. The factory never reads a key; the adapter reads `PPO_ANTHROPIC_API_KEY` only after guards. Key presence never enables Carl. Unsupported configuration fails closed without simulation fallback. Existing runner injection remains a test seam, not a production mock switch.

The Messages transport uses fixed HTTPS destination/TLS verification and refuses redirects. SDK automatic retries, logging and telemetry are disabled. The runner retains ownership of retries/reservations/deadlines; `AssistantAdapter.inputTokens` optionally supplies the provider-specific pre-dispatch bound while simulation keeps its existing fixture meter. No worker-bypass endpoint is added. Foreground structured JSON is independently checked by PPO; refusal discards all partial model text. Known usage settles even after malformed/citation/post failures, while unknown or unrepresentable billing usage retains the full reservation and prevents retry. [Operator guidance](../delivery/conversations-t2d-local-adapter.md) and [mocked/persisted evidence](../testing/evidence/conversations-t2d/README.md) separate implementation from live evaluation.

## Proof and review

| Rules / boundary | Automated proof |
|---|---|
| Migration, seed, identities, immutable rows and guards | `assistant-schema.test.ts`, `assistant-upgrade.test.ts`, plus the existing migration/grant upgrade suites |
| Limits, prices, switch, unsafe output and citation rendering | `assistant.test.ts` |
| Reader intersection, field allowlists, windows, untrusted messages | `assistant-evidence.test.ts` |
| US$30 race, settlement, unknown usage, UTC month and stale snapshots | `assistant-budget.test.ts` |
| Atomic tagging, scoped ask duty and human asks | `assistant-thread.test.ts`, conversation validation tests |
| Per-reader claims and Activity labels | `assistant-reader-view.test.ts`, `assistant-turns.test.ts` |
| Determinism, source IDs, limits and simulated label | `assistant-simulated.test.ts`, `assistant-turns.test.ts` |
| Full lifecycle, six calls, timeout, retries, access revocation, concurrency, recovery, no text in audit and hostile evidence | `assistant-turns.test.ts` |

The draft PR records exact local check results, confirmed baseline failures and CI-only checks. The migration, capability and grants require review by a model other than the author's before merge. That review has not happened; Dean decides acceptance and merges.
