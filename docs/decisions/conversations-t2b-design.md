---
document_id: PPO-CONV-T2B-DESIGN
title: Conversations T2b design, Carl's assistant core
date: 2026-10-19
owner: Dean Fiedler
status: T2b started by Dean on 19 October 2026; proposals P1 to P4 accepted by Dean the same day; implementation choices for review in the pull request; no UI, route, live provider or paid model request
versioning: git
---

# Conversations T2b design, Carl's assistant core

This record sets out how slice T2b of the [Conversations T2 scope](conversations-t2-scope.md) (PPO-CONV-T2-SCOPE, section 4) is built: the assistant core that lets `@Carl` answer in a thread, proven end to end with the simulated adapter. It has no UI (T2c), no live provider (T2d) and makes no paid model request (T2e). It implements rules T2-1 to T2-12 and answers W1 to W9 of the scope as accepted, and the AI1 specification ([PPO-AI-SPEC](../blueprints/ppo-assistant-specification.md)) §6 and §8 where the scope points to them. Where this record and the scope differ, the scope governs.

## 1. Dean's words

Quoted as written, 19 October 2026:

1. "Yes, plan and start T2b (assistant core with the simulated adapter, no UI, no live provider) in its own worktree and draft PR, reserving the next migration number."
2. "You don't have to make T2b as lean as the accepted rules allow. I still want it to be as professional as possible so I'm happy to wait."
3. "accept P1–P4 as recommended" — given after Claude set out its recommendation for each of P1 to P4, including the P3 refinement that only the tagger sees why a turn did not answer.

## 2. Decisions and evidence

| Item | Classification | Evidence |
|---|---|---|
| T2b is built now, in its own pull request, with migration 0110 | User decision | Quote 1 |
| Every T2 rule is built in full and proven, not trimmed to reach the UI sooner | User decision | Quote 2 |
| Rules T2-1 to T2-12, answers W1 to W9, contents and slices | User decision (18 October 2026) | [T2 scope](conversations-t2-scope.md) sections 3 to 7 |
| The capability is `conversation.agent.ask`, granted to local synthetic profiles holding `conversation.post`; hosted testers get none | User decision, W2 and W7 | T2 scope section 7 |
| The data model, turn lifecycle, ledger, envelope allowlist and runner in sections 3 to 8 | Claude's implementation choices within the accepted rules; Dean's review is in the pull request | This record |
| P1 to P4 in section 9, with the P3 refinement | User decision | Quote 3 |

## 3. How a Carl turn runs

A person posts a message that tags Carl. That message and a **turn** for it are written in one transaction, so a tag is never lost and never answered twice (T2-1: one turn per tagging message, enforced by a unique key). The turn then runs in steps, and the model call happens between them, outside every database lock (AI1 §9: "Keep provider calls outside database locks"):

| Step | What happens | Written as |
|---|---|---|
| 1. Tag | The message is posted with an `Agent` mention. The sender must hold `conversation.agent.ask` in the record's scope. The turn is created `Queued` | Part of `startThread` or `postMessage` |
| 2. Start | The runner claims a queued turn. It checks again that the person it acts for can still read and post in the thread, that Carl is switched on, that the price is known and that the budget allows the turn's first call. It reserves that call and moves the turn to `Answering`. If any check fails, the turn ends `Unavailable` with a reason and no model call | Command `Assistant:StartTurn`, acting as the tagger |
| 3. Evidence | One read-only, repeatable-read snapshot builds the evidence envelope (section 5) for the readers of the thread | Read only |
| 4. Model call | The adapter answers from the envelope. Each further call (a retry) reserves before it is made. Limits are enforced throughout (section 7) | No database transaction open |
| 5. Check | The answer's citations, markup and size are checked (section 6). An answer that fails is never posted | In memory |
| 6. Post | Access is checked again for every cited source and every reader. If it changed, the answer is discarded and the turn goes back to step 3 once. Otherwise the agent message, its claims and sources are written, the reservations are settled from the reported usage and the turn ends `Answered` or `CannotAnswer` | Command `Assistant:PostAnswer`, acting as the tagger |
| 7. End without an answer | Any other outcome ends the turn with a reason (section 4) and settles, releases or keeps each reservation as the outcome requires | Command `Assistant:EndTurn`, acting as the tagger |

Every write is a typed command through the shared operation path (T1-6), so each step has its audit event and receipt under the person Carl acted for (R2, T2-2). Step operation IDs are derived from the turn, the step and the attempt, so a crashed runner that repeats a step replays the receipt instead of writing twice.

**Who runs a turn.** `runAssistantTurns(limit)` claims queued turns with `FOR UPDATE SKIP LOCKED` and a lease, in the pattern of the existing customer-message worker, and is called from `npm run documents:worker`. `runAssistantTurn(turnId)` runs one turn directly; T2c will call it straight after a post so an answer appears without waiting for the worker. A turn still `Answering` after its lease expires was interrupted after a call may have been sent: it ends `Failed` with reason `Interrupted`, and its open reservations are kept as `Unknown` (T2-6: "an unknown outcome keeps it").

**Working company.** A person's working-company choice (NR-18) narrows only their own requests. The runner works outside a request, so it applies the tagger's current working company itself before every access check, as the request would have.

## 4. Turn states

| State | Meaning | Thread shows (T2c) | Ledger |
|---|---|---|---|
| `Queued` | Tagged, not yet started | "Carl is answering for Sam" | Nothing reserved |
| `Answering` | Started; evidence and model calls in progress | "Carl is answering for Sam" | Each call reserved before it is made |
| `Answered` | An agent message with cited claims was posted | The answer card | Settled from usage |
| `CannotAnswer` | The model declined (W6) or the records hold nothing relevant; an agent message says Carl can't help with that request, with no partial text | That message | Settled; a decline counts (W6) |
| `Unavailable` | Carl is off, the budget is spent, the price is missing or the provider is unavailable or out of credit (T2-6, R9) | Carl's unavailable state; people keep messaging | Released, or settled if a call was billed |
| `Failed` | Invalid citations, unsafe output, a turn limit, a timeout, an interruption or an internal error | A truthful error state | Settled, or kept as `Unknown` |
| `Discarded` | The answer could not be posted: access changed twice, the thread was resolved, or the tagger lost access | Nothing from Carl; the reason is in the turn | Settled from usage |

Reasons are fixed codes (for example `FeatureOff`, `BudgetSpent`, `PriceMissing`, `CreditExhausted`, `ProviderUnavailable`, `Declined`, `NoEvidence`, `InvalidCitation`, `UnsafeOutput`, `TurnLimit`, `Timeout`, `Interrupted`, `AccessChanged`, `ThreadResolved`, `ActorLostAccess`). No reason carries prompt or answer text (T2-10).

## 5. The evidence envelope (T2-3, T2-4, W3, R7)

**Readers.** The readers of a turn are the thread's participants who can read the thread now, together with the person Carl acts for. A participant who has lost the anchor record has lost the whole thread (T1-1), so they are not a reader; a participant who keeps the thread is. A source enters the envelope only if every reader can open it, each checked with that record's own visibility rule for that person.

**Left-out count.** Sources the tagger can open but some reader cannot are counted, never named. Their titles and fields are not selected. The answer says "N sources left out because not everyone here can see them".

**What is read** (W3: the thread's own record and what AI1 §6 links to it; `#` links elsewhere wait):

| Thread on | Sources, in order, with limits |
|---|---|
| A deal | The opportunity; its organisation; up to 10 other opportunities of that organisation, newest update first then ID; up to 20 Internal CRM Activities linked to the organisation or to those opportunities, newest update first then ID |
| A project | The project's status facts; up to 20 of its tasks in programme order; its open RAID entries without their free text; its acceptance stages; the deal it was received from |
| Both | Up to the last 20 thread messages before and including the tagging one, each marked untrusted |

**Field allowlist.** Every source is projected to named fields; no `SELECT *` row ever reaches the adapter. Always excluded: contact email, phone and contact preference; ERP mappings and connection IDs; organisation notes (internal and Finance); site access and biosecurity notes; costs, margins, prices, commercial amounts and the deal value (decision P2 in section 9); specialist scope; and project task notes and RAID free text. Activities are limited to `access_class = Internal`, so Restricted Service and Restricted Finance Activities never enter, even for a reader who could open them. A project's action counts differ for each reader, so the project facts leave them out.

**Untrusted text.** Message bodies and the free-text fields that are allowed (an opportunity's need summary and qualification note, an Activity's summary and outcome) are passed as data marked untrusted, never as instructions (R7, AI1 §6). In earlier messages, a record link that some reader cannot open is shown as "a record", and other links by their reference only.

**Coverage.** The envelope records for each list how many were returned, the limit, and whether more exist, so an answer never claims complete history (AI1 §6, AIA-05).

**Source IDs.** Each item has an opaque `source_id` (`S1`, `S2`, …) that is local to the turn, plus the record's type, ID, version or update time, retrieval time and a server-built route. The adapter sees only the opaque ID and the allowed fields.

## 6. Citations and answer checks (T2-5, T2-8, T2-9)

The adapter returns claims, each citing one or more `source_id`s, and gaps (what the records could not answer, W4), or a decline. PPO then:

1. rejects any `source_id` that is not in this turn's envelope, and any claim without a source (`InvalidCitation`);
2. rejects mention tokens (`@{n}`, `#{n}`), control characters, markup and links in claim or gap text (`UnsafeOutput`);
3. limits each claim to 500 characters, gaps to 300, and at most 12 claims and 5 gaps, with the rendered body within the 4,000-character message limit;
4. renders the body itself: each claim followed by its source numbers (`[1]`, `[2]`), then the gaps, then the coverage and left-out lines. It draws the chips from the stored sources, never from model text.

An agent message is immutable like every message (T2-9). It records its author kind (`Agent`), the person it acted for, the turn, the adapter label (`Simulated` or `Claude`, T2-8) and the left-out count. Its claims and sources are stored as rows, so each reader's view can be drawn from that reader's own access (decision P1).

## 7. Budget and limits (T2-6, T2-7)

**Ceiling.** The monthly ceiling is stored, not configured in the environment: one settings row for the workspace, US$30 (30,000,000 micro-dollars), written by seed 110. A database check refuses a ceiling above US$30, so raising it needs a new decision and migration. The month is the UTC calendar month, as the provider's spend limit uses.

**Reservation.** Before every model call, including retries, PPO reserves the call's maximum cost: the turn's remaining input and output token allowances at the adapter's input and output prices. The reservation is written under a workspace budget lock and a database trigger refuses it if the month's committed spend (reserved and unknown at their reserved amount, settled at their settled amount) would pass the ceiling. Concurrent turns therefore cannot overspend together.

**Settlement.** A reservation is settled from the usage the adapter reports, released if no call was sent, or kept as `Unknown` when the outcome is not known. An unknown reservation can later be settled, never released. A missing price, a spent budget or the provider's "credit balance too low" reply makes the turn `Unavailable`; it is not retried (T2-6).

**Prices.** Prices live in code with the date they were checked. The simulated adapter costs nothing, but its calls still reserve and settle (at zero), so the ledger is exercised on every turn. A price is looked up by adapter and model; an unknown pair fails closed (`PriceMissing`).

**Turn limits.** At most six model calls including retries, 48,000 input and 8,000 output tokens in total, and 60 seconds, whichever comes first. A call that would pass a token limit is not made. The runner aborts the adapter call at the deadline. The turn ends `Failed` with `TurnLimit` or `Timeout`, and any claims already validated are not posted, because a partial answer is not one the model completed. Only `ProviderUnavailable`, `RateLimited` and `MalformedOutput` are retried, at most twice each, within the limits; there is no fallback to another model (W6).

## 8. Adapter boundary and switch (T2-10, T2-11)

**Interface.** `AssistantAdapter` has a label, a model name and one method, `answer(request, signal)`. The request holds the question (the tagging message, untrusted), the envelope and the remaining token allowances. The result is an answer (claims and gaps), a decline, or a typed error (`Unavailable`, `CreditExhausted`, `RateLimited`, `MalformedOutput`, `Timeout`), always with the usage the provider reported when it reported any. T2d adds the Claude adapter behind this interface.

**Simulated adapter.** This is deterministic and makes no network request. It answers from the envelope with templated claims: the record's state, its next action and its latest Activities for a deal, or the schedule, next milestone and open RAID for a project. Each claim cites its sources. It reports token counts from the envelope's length. It does not interpret the question; it adds a gap saying so. Everything it posts is labelled `Simulated` (T2-8).

**Switch.** Carl is off unless `PPO_ASSISTANT=on` is set in a local synthetic environment (`PPO_ENV=local-synthetic`, loopback exposure, synthetic identity, not production), read on the server only (T2-11). When off, a person can still tag Carl and the turn ends `Unavailable` with `FeatureOff`, so threads keep working (R9). The name "Carl" is one constant, so "PPO Assistant" can replace it (W1, C7).

**Logging.** Turns record token counts, outcome, reason, adapter, model and timings. Prompts, evidence and answers are not logged (T2-10); the answer exists only as the posted message.

## 9. Decisions P1 to P4

Proposed by Claude and accepted by Dean on 19 October 2026 as recommended (quote 3).

| ID | Question | Decision | Why |
|---|---|---|---|
| P1 | What does a reader see of an answer after losing access to one of its cited sources other than the anchor? The scope left this to T2b (section 5, "Open for T2b and T2c") | Each claim is shown to a reader only if the reader can open every source it cites. Otherwise that claim is replaced by "A statement from a record you can't open", and its chips show "A record you can't open". Gaps, coverage and left-out lines stay. The stored answer is unchanged (T2-9) | The answer is immutable, but its words can repeat a record's contents. Hiding the claim, not the whole answer, keeps the rest useful and never shows what a reader could not open |
| P2 | Does the evidence include a deal's value? | No. Leave out `value_amount` in T2 | The allowlist excludes costs and margins; the deal value is a different field, and the conversation context panel already leaves it out. It can be added by a later decision |
| P3 | Does Carl post a message when it is unavailable, or only show a state? | Post no message for `Unavailable`, `Failed` or `Discarded`; T2c shows the state beside the tagging message. Post a message only for `Answered` and `CannotAnswer`. The tagger sees the reason (for example "Carl is switched off" or "This month's AI budget is spent"); other participants see only that Carl couldn't answer | A thread should hold what Carl said, not a log of outages, and R9 says threads work without Carl |
| P4 | Who is a reader for the "every participant can read" rule? | The participants who can read the thread now, plus the tagger | A participant who lost the anchor record cannot see the thread or the answer. Counting them would leave every later answer empty |

## 10. Data model (migration 0110, seed 110)

Migration 0110 reads the live schema, as 0108 and 0109 do, and preserves every existing row, hash, grant and receipt.

| Change | Detail |
|---|---|
| Messages | `conversation_messages` gains `author_kind` (`Person`, the default, or `Agent`), `acted_for_id`, `turn_id`, `agent_outcome`, `adapter` and `left_out_count`. `author_id` becomes nullable: a person message has an author; an agent message has none and names the person it acted for. Its guard and audit check are replaced so that an agent message needs a turn in `Answering` on the same thread, acted for by a participant holding `conversation.post` and `conversation.agent.ask`, with that person's accepted audit event and receipt |
| Mentions | Kind `Agent` (`@{n}`): at most one per message, only in a person's message |
| Claims and sources | `conversation_message_claims` (ordinal, kind `Fact` or `Gap`, text, cited source numbers) and `conversation_message_sources` (number, record type, record ID, version or time, retrieval time). Both append-only, only on agent messages |
| Turns | `assistant_turns`: thread, tagging message (unique), acted-for person, state, reason, adapter, model, attempts, call and token counters, evidence and left-out counts, answer message, lease and times. A registered identity (`AssistantTurn`) with guarded transitions; a finished turn is permanent |
| Ledger | `assistant_budget_settings` (the ceiling, at most US$30) and `assistant_budget_entries` (one row per model call: month, model, price version, maximum tokens, reserved, settled or unknown amount, usage). A trigger enforces the ceiling and the allowed transitions |
| Capability | `conversation.agent.ask` added to the grant check |
| Seed 110 | `conversation.agent.ask` for each local synthetic profile's live `conversation.post` grant, in the same scope and validity; the US$30 ceiling row. Hosted testers get nothing (W2, W7) |

## 11. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | PPO-AI-THREADS-PROP, step T2, slice T2b, with PPO-CONV-T2-SCOPE, PPO-AI-DEC r03 and PPO-AI-SPEC. No parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | None: T2b has no page or route |
| Reused components | None in the UI. The shared operation path, receipts, the conversation access rules and the existing record visibility rules |
| Source authority | The deal and project records and their access rules. Carl's answers are evidence, never authority |
| Incoming handovers | A message that tags Carl |
| Outgoing handovers | An agent message with cited sources, read by T2c |
| Departures | None from the accepted design. Section 9 records the decisions the scope left open |

## 12. What this record does not do

It adds no UI, route, live provider, dependency or paid model request, and does not deploy anything. It does not settle Carl's agreement (C2), the hosted demo's credential, real data, the billing owner for operational use, or the T2d model and SDK pin. Business acceptance, the cross-model review the migration and capability require, and production readiness are separate.

## 13. Implementation notes

Implementation choices for Dean's pull-request review; these do not amend the accepted rules or P1 to P4.

- The project evidence query uses the schedule and RAID arithmetic from `projectFactsSql()` with an explicit column projection. It omits that query's action counts, action-derived attention and reader-dependent external-owner details. Project evidence versions hash the permitted aggregate facts together with the project and acceptance versions, so a changed task, RAID state or baseline changes the source version without exposing its narrative.
- Open RAID and acceptance-stage lists each use a 20-record window, ordered by creation time and ID. A project can have more than one received sales handover, so its received deals use the same 10-record window and update-time order as opportunity evidence. Every window reports returned count, limit and whether more exist. These bounds complete the design's list-coverage rule without reading an unbounded history.
- Source routes use existing record pages: organisations open at `/customers/:id`, Activities at `/work/:id`, and task/RAID citations at their project page. No route is added.
- An included Activity carries `is_next_action` for the anchor deal. The comparison uses the stored next-action ID inside the snapshot; only the boolean reaches the adapter. An older or inaccessible next action does not expand the bounded Activity window.
- AI1 section 6 excludes non-CRM narratives. Deal evidence therefore uses the existing CRM `SALES_KINDS` (`CustomerContact` and `RelationshipReview`) as well as `Internal` access class and the Activity visibility rule. Internal technical and material Activities stay outside this envelope even when the tagger can open them.
- Budget writes require read-committed isolation, as used by `sharedOperation`. Both the helper and the ledger guard refuse a write from repeatable-read isolation: a snapshot taken before the advisory lock could otherwise miss a competing reservation. Evidence remains read-only and repeatable-read. An identical active reservation or settlement may replay; a released, unknown or settled entry cannot be reused to dispatch another call.
- Thread reads use one read-only, repeatable-read snapshot for P1. The coverage footer is recovered from the immutable body only when its original claim prefix matches and every remaining line has PPO's fixed coverage or left-out grammar. Earlier agent messages use the same rule when included in evidence; a previous answer cannot restore a source's now-hidden words.
- An agent tag checks the scoped ask duty before original-receipt replay as well as composition. This follows the shared command path's current-authority rule. Agent mentions expose the name constant without a user identity, and turn reasons are projected in SQL only for their tagger.
