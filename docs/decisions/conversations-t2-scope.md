---
document_id: PPO-CONV-T2-SCOPE
title: Conversations T2 scope, Carl answers in threads
date: 2026-10-18
owner: Dean Fiedler
status: Proposed by Claude on 18 October 2026 at Dean's instruction; not accepted; no application code, dependency, migration, capability, route or paid model request authorised by this record
versioning: git
---

# Conversations T2 scope, Carl answers in threads

This record plans build step T2 of the [AI and internal communications threads decision](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP, section 9): `@Carl` answers in threads. It is a proposal for Dean's review. It splits T2 into reviewable pull requests, proposes rules T2-1 to T2-12, lists the frames the accepted design lacks, and asks questions W1 to W9, each with a recommendation. It authorises no code. Each later slice follows `AGENTS.md` in its own pull request.

## 1. Dean's words

Quoted as written, 18 October 2026: "I accept Amendment A1 (Claude API first, credit-funded, US$30 monthly ceiling enforced in PPO, no purchased credits or auto-reload). Record my decision and plan T2."

The acceptance is recorded as Amendment A1 in [PPO-AI-DEC r03](ppo-assistant-direction.md). This record is the plan.

## 2. Where things stand

Checked against `main` at `c089e13` on 18 October 2026.

| Item | State | Consequence for T2 |
|---|---|---|
| T1b threads service | Merged: migration 0108, `src/conversations/` | A message's author must be a participant who holds `conversation.post` (a trigger in 0108), so Carl cannot write a message without a schema change |
| T1c page | In draft: design [#574](https://github.com/deanrfiedler-gif/powerplants-one/pull/574), build [#575](https://github.com/deanrfiedler-gif/powerplants-one/pull/575) | Carl's UI (T2c) waits for `/conversations` to merge |
| T1d record pages, inbox, My Work | Not started | Independent of T2 |
| AI1 runtime | `src/assistant/` does not exist. No read tool, evidence envelope, provider adapter or budget ledger exists | T2 builds the first of them. The proposal is "reuse the AI1 read tools", but there are none to reuse yet |
| Provider | A1 accepted 18 October 2026. Console workspace with a US$30 limit; Dean's key is in his local `.env.local` only | The live adapter can be built and proven locally. Specification §8's pre-call checks are still unmet |
| Design | Accepted frames show Carl's answer, its sources, the AI label and the R9 composer state ([section 14](ai-communications-threads-proposal.md#14-design-reference-and-verification)) | Missing states are listed in section 6 |
| Carl's agreement (C2) | Not recorded | "Carl" stays a working name inside the synthetic prototype (question W1) |

## 3. What T2 contains

**In T2** (proposal sections 4 and 6, autonomy level L0 only):
- **`@Carl` in the composer's `@` picker,** labelled "Carl · AI assistant" with its own icon, kept distinct from any person called Carl (C3, C5).
- **One answer for each message that tags Carl,** posted to the thread as an immutable message. It acts for the person who tagged it (R2) and uses only sources that every participant can read (R3).
- **Sources shown as chips** made with the record-link component, so the evidence is one click away. When sources were left out, the answer says how many, never which.
- **Evidence from the thread's record.** A deal thread uses the AI1 customer CRM reads (the opportunity, its organisation, and linked opportunities and CRM Activities within AI1 §6's limits). A project thread uses a new bounded project-status read. Earlier messages in the thread enter as untrusted evidence (R7).
- **`@Carl` and a person together.** Carl answers first. The person's tracked ask stays open as T1 made it, and Carl's answer ends with what the records could not answer (question W4).
- **The simulated adapter first.** A deterministic adapter, visibly labelled "Simulated", answers from the same evidence with templated text. It proves the tools, citations, permissions, budget and failure states without cost.
- **The Claude adapter second,** behind the same interface, off by default, for local live use only.
- **Fail closed (R9).** When the budget is spent, the provider is unavailable or the feature is off, Carl says it is unavailable and people still message, tag and link.

**Not in T2, and hidden rather than disabled:** "Draft with Carl" (T3), proposal cards and saving answers to records (T7), Check before sending (N1), Catch me up (N2, question W8), the start-of-day digest (N14), handover briefings (N6), the microphone and driving mode (T4), branches and summaries (T5), sharing (T6), watches and playbooks (T7), and any action at L2 or above.

## 4. Slices

| Slice | Content | Output |
|---|---|---|
| T2a | This scope record; the missing frames in section 6, drawn in Figma as proposals; register and STATUS rows | Documentation pull request |
| T2b | Assistant core, no UI and no live provider: the adapter interface and the simulated adapter in `src/assistant/`; the evidence envelope and read tools; citation validation; the budget ledger with reservations; agent-written messages (author kind, the person acted for, cited sources, adapter label); a capability for asking Carl and its access-review chain; database tests. The draft pull request claims the next migration number | Pull request |
| T2c | Carl in `/conversations` on desktop and phone: the picker entry, the answer card with sources and labels, the answering state, and the unavailable, budget-spent and cannot-answer states; design register entry. Waits for T1c | Pull request |
| T2d | The Claude adapter: an ADR for the official SDK and the model pin; the key read only on the server from `PPO_ANTHROPIC_API_KEY`; outbound requests limited to the Anthropic API host; structured output for claims that cite source IDs; refusal and credit-exhausted handling; usage settled into the ledger. Off by default and local only | Pull request with an ADR |
| T2e | Live synthetic evaluation: a thread evaluation set and a paid run within the US$30 ceiling, after Dean approves its cost. Simulated and real-model results are recorded separately | Evaluation record |

T2b can start once this record is accepted, in parallel with T1c and T1d, because it touches only `src/assistant/`, the conversations service and a new migration. T2c needs T1c merged. T2d needs T2b. T2e needs T2c and T2d.

## 5. Proposed T2 rules

Proposed by Claude for Dean's decision. They are not verified operating rules, and no code implements them.

| ID | Rule |
|---|---|
| T2-1 | **Carl speaks only when tagged.** One answer for each message that tags it. No unprompted posts in T2 |
| T2-2 | **Carl acts for the person who tagged it** (R2). It has no user row, account or grants. Each of its messages records who it acted for, and access is that person's at dispatch |
| T2-3 | **Every participant can read every source** (R3). Evidence is limited to sources that every current participant can read at dispatch. The answer states how many sources were left out, never which. Access is checked again before the answer is posted, and an answer whose sources changed access is discarded and retried once |
| T2-4 | **Evidence envelope only.** An explicit allowlist of fields, within AI1 §6's limits (10 opportunities and 20 Activities). No contact email or phone, ERP mappings, Finance notes, costs or margins. At most the last 20 thread messages, each marked as untrusted text (R7) |
| T2-5 | **Citations are checked.** The answer's claims cite opaque source IDs. PPO checks each ID belongs to this turn's evidence and draws the chips itself. An answer with an invalid citation is not posted |
| T2-6 | **Budget first** (R9, AIA-17). Every provider call reserves its maximum cost against the US$30 monthly ceiling before dispatch, across concurrent users. The reservation settles from the reported usage; an unknown outcome keeps it. A spent budget, a missing price or the provider's "credit balance too low" reply makes Carl unavailable, not retried |
| T2-7 | **Turn limit.** Six model calls including retries, 48,000 input and 8,000 output tokens, and 60 seconds, whichever comes first (specification §8). The turn stops with a truthful partial or error state |
| T2-8 | **Labelled every time.** "Carl · AI assistant" in the picker and on every message. The simulated adapter adds "Simulated" visibly. C5 applies to any person called Carl |
| T2-9 | **Immutable answers.** Carl's answer is a thread message with author kind agent. It is never edited; a correction is a new message |
| T2-10 | **Provider boundary.** Calls are made on the server only. The key never reaches the browser, logs or the repository. Foreground Messages API requests only: no Files API, Batch, Managed Agents, provider web tools, MCP connector or code execution. Provider conversation state is never reused. Raw prompts and answers are not logged; token counts and outcomes are |
| T2-11 | **Off by default.** A feature flag keeps Carl off. The live provider runs only locally, on synthetic data |
| T2-12 | **Answer only.** L0 in T2. Carl never does what R5 forbids, and it has no tool that writes a business record |

## 6. Frames to draw in T2a

The accepted design shows Carl's answer card, its sources, the AI label, Catch me up and the R9 composer state (frame 1159:1775). It lacks these states, which T2a would draw as proposals on the Conversations page, beside the accepted frames and without editing them:

| Frame | Shows |
|---|---|
| Desktop 1440 · Carl answering | The tagging message, then "Carl is answering for Sam" in place of the answer |
| Desktop 1440 · Simulated answer | The answer card with the "Simulated" label |
| State · Sources left out | An answer that says "1 source left out because not everyone here can see it" |
| State · Carl can't answer | Nothing in the records answers the question; a declined request; a turn that stopped at its limit |
| State · Carl unavailable | Budget spent, provider unavailable or feature off, shown in the thread where Carl was tagged |
| State · `@` picker with Carl | Carl first, labelled AI, with a person called Carl shown with surname and role (C5) |
| Tablet 1024, Phone 390 and 320 · Thread with Carl's answer | The same answer and states at each size |

Catch me up and the actions under Carl's message (Make a task, Pin as decision, Branch here, Watch) stay hidden in T2, as section 3 says.

## 7. Questions W1 to W9

| ID | Question | Recommended answer |
|---|---|---|
| W1 | What is the agent called in T2, while Carl's agreement (C2) is outstanding? | "Carl", as a working name inside the synthetic prototype, which C2 allows. The name is one setting, so "PPO Assistant" (C7) can replace it everywhere |
| W2 | Who may tag Carl? | Holders of a new capability (proposed name `conversation.agent.ask`), granted to the local synthetic profiles that hold `conversation.post`. Hosted testers get none in T2 |
| W3 | Which records may Carl read in T2? | The thread's own deal or project and the records AI1 §6 links to it. Records linked with `#` elsewhere in the thread wait for a later step |
| W4 | When a message tags Carl and a person, does Carl narrow the person's question? | No. Carl answers first and says what the records could not answer. The person's ask stays open as T1 made it. Narrowing the question needs drafts (T3) |
| W5 | Which model starts the live evaluation? | Claude Sonnet 5.5, the specification's cost reference, with Claude Haiku 5.5 and Claude Opus 5.5 also run in T2e. The model is pinned from the results |
| W6 | When the model declines a request, does PPO retry on another model? | No automatic fallback, as specification §8 says. Carl posts that it can't help with that request, with no partial text, and the decline counts in the ledger |
| W7 | Does the hosted demo get Carl in T2? | No. T2 is local only. Hosted use needs its own decision on how the server gets its credential: a stored secret, or Azure workload identity federation, which avoids storing a key |
| W8 | When do Catch me up (N2) and Check before sending (N1) come? | After the T2e evaluation, as a further slice, because both reuse the same tools and budget |
| W9 | Official SDK or raw HTTP for the Claude adapter? | The official `@anthropic-ai/sdk`, chosen through an ADR in T2d. It brings typed errors, retries and structured outputs |

## 8. Cost

Building T2a to T2d makes no paid model request: the simulated adapter covers the tests, and the T2d proof can use a mocked transport. One manual live check per adapter change costs well under a cent.

T2e at specification §8's assumption (6,000 input and 1,000 output tokens a task): 30 tasks × 3 repeats on Sonnet 5.5 is about US$1.98; adding Haiku 5.5 and Opus 5.5 makes about US$6.04, and about US$9 with the 50% contingency. That fits inside the US$30 ceiling. Dean approves each paid run before it starts. Rates were checked on 16 October 2026 and are rechecked before the run.

## 9. Conformance declaration

Declared under [PPO-UI-CONFORMANCE](../standards/html-module-conformance.md).

| Field | Declaration |
|---|---|
| Scope identity | PPO-AI-THREADS-PROP, step T2, with PPO-AI-DEC r03 and PPO-AI-SPEC. No parent requirement ID is added or renamed; all 78 parent IDs remain |
| Page type (r20) | Application page with a three-region workspace, unchanged from T1 |
| Reused components | `Conversations / Message` (with its sources footer), `Record link`, `Composer`, `Avatar` and the T1 page |
| Source authority | The deal and project records and their access rules. Carl's answers are evidence, never authority |
| Incoming handovers | A thread where a person tags Carl |
| Outgoing handovers | A source chip opens the record |
| Departures | None proposed. The frames in section 6 add states the accepted design lacks |

## 10. What this record does not do

It proposes; it decides nothing until Dean accepts it. It authorises no application code, dependency, migration, seed, capability, route, deployment or paid model request, and reserves no migration or capability number. It does not settle Carl's agreement (C2), the billing owner for operational use, real data, the hosted demo's credential, or the AD-01 sharing, speech and driving decisions; none of them blocks T2 as proposed.
