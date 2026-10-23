---
document_id: PPO-CONV-T2-SCOPE
title: Conversations T2 scope, Carl answers in threads
date: 2026-10-18
owner: Dean Fiedler
status: Scope, rules T2-1 to T2-12, the recommended answers to W1 to W9 and the T2a frames accepted by Dean on 18 October 2026; named Figma version saved; no application code, dependency, migration, capability, route or paid model request authorised by this record
versioning: git
---

# Conversations T2 scope, Carl answers in threads

This record scopes build step T2 of the [AI and internal communications threads decision](ai-communications-threads-proposal.md) (PPO-AI-THREADS-PROP, section 9): `@Carl` answers in threads. It splits T2 into reviewable pull requests, sets rules T2-1 to T2-12, lists the frames the accepted design lacks, and answers questions W1 to W9. Dean accepted the scope, the rules and the recommended answers on 18 October 2026 (section 1). It authorises no code. Each later slice follows `AGENTS.md` in its own pull request.

## 1. Dean's words

Quoted as written, 18 October 2026:

1. "I accept Amendment A1 (Claude API first, credit-funded, US$30 monthly ceiling enforced in PPO, no purchased credits or auto-reload). Record my decision and plan T2." The acceptance is recorded as Amendment A1 in [PPO-AI-DEC r03](ppo-assistant-direction.md).
2. "I accept the Conversations T2 scope, rules T2-1 to T2-12 and the recommended answers to W1 to W9. Record my words, then start T2a (the missing frames in Figma)." Given after this record was presented in draft.
3. "Yes, accept the T2a frames and the 320 px departure. Save the named version "Conversations T2 — Carl answers, accepted", record my words, then plan T2b." Given after the audited and polished frames in section 6 were presented.

Dean chose each reply from answers Claude offered in the session.

| Item | Classification | Evidence |
|---|---|---|
| Plan T2 | User instruction | Quote 1 |
| The T2 contents in section 3 and slices T2a to T2e in section 4 | User decision | Quote 2 |
| Rules T2-1 to T2-12 in section 5 | User decision. Design rules, not verified operating rules; no code implements them yet | Quote 2 |
| Questions W1 to W9, with the recommended answers in section 7 | User decision, recommended answers adopted | Quote 2 |
| The frames in section 6 and the 320 px departure | User decision. Named Figma version "Conversations T2 — Carl answers, accepted", saved 18 October 2026 | Quote 3 |

## 2. Where things stand

Checked against `main` at `c089e13` on 18 October 2026.

| Item | State | Consequence for T2 |
|---|---|---|
| T1b threads service | Merged: migration 0108, `src/conversations/` | A message's author must be a participant who holds `conversation.post` (a trigger in 0108), so Carl cannot write a message without a schema change |
| T1c page | In draft: design [#574](https://github.com/deanrfiedler-gif/powerplants-one/pull/574), build [#575](https://github.com/deanrfiedler-gif/powerplants-one/pull/575) | Carl's UI (T2c) waits for `/conversations` to merge |
| T1d record pages, inbox, My Work | Not started | Independent of T2 |
| AI1 runtime | `src/assistant/` does not exist. No read tool, evidence envelope, provider adapter or budget ledger exists | T2 builds the first of them. The proposal is "reuse the AI1 read tools", but there are none to reuse yet |
| Provider | A1 accepted 18 October 2026. The provider-side controls A1 relies on are set up; account details stay outside this public repository | The live adapter can be built and proven locally. Specification §8's pre-call checks are still unmet |
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

T2b's dependencies are met once this record is accepted: it can run in parallel with T1c and T1d, because it touches only `src/assistant/`, the conversations service and a new migration. Dependency readiness is not build authorisation. Quote 3 asks Claude to plan T2b, and building it needs Dean's own go-ahead. T2c needs T1c merged. T2d needs T2b. T2e needs T2c and T2d.

## 5. T2 rules

Proposed by Claude and accepted by Dean as the design rules for T2 (quote 2). They are not verified operating rules, and no code implements them yet.

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

**Accepted rules that also govern Carl's answers after they are posted.** T2-3 covers dispatch and posting. These already-accepted rules cover what happens afterwards:
- **Adding a participant (R8).** When someone is added to a thread whose earlier Carl messages cite sources the new person cannot read, the person adding them is warned before the add completes. R8 offers a fresh branch instead. Branches arrive in T5, so in T2 Claude reads the alternative as a new thread on the same record (U1). That reading is to be confirmed in T2c.
- **Reading later (T1-1, T1-4).** Source chips are drawn for each reader from that reader's own access, so a source the reader cannot open shows as "A record you can't open", with no title. Someone who loses access to the anchor record loses the whole thread.
- **Open for T2b and T2c, not decided here.** What a reader sees of an answer's text after they lose access to one of its cited sources other than the anchor record (an answer is immutable under T2-9). T2b proposes this with its tests before T2c builds the answer card.

## 6. Frames to draw in T2a

The accepted design shows Carl's answer card, its sources, the AI label, Catch me up and the R9 composer state (frame 1159:1775). It lacks these states, which T2a draws as proposals on the Conversations page, beside the accepted frames and without editing them:

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

**Drawn on 18 October 2026.** At Dean's instruction (quote 2), Claude drew these frames as proposals on the Figma page "Conversations" (node 1141:49) of "PPO - Design". They are in a new section, "T2 · Carl answers in threads (proposal, 18 Oct 2026)" (node 1310:307862). They are built from copies of the accepted T1 frames and use the accepted `Conversations / Message` (Author=Carl), `Avatar`, `Record link`, `Composer` and `Tag` components. No accepted frame or component was edited. The synthetic scenario: Alex asks Sam where the Green Valley controller is, then Sam tags Carl.

| Frame | Node | Shows |
|---|---|---|
| Desktop 1440 · Carl answering for Sam | 1310:307863 | Sam's `@Carl` message, then "Carl · AI assistant is answering for Sam", saying only sources everyone in the thread can see are used. The composer hint mentions Carl |
| Desktop 1440 · Carl's answer, sources and one left out | 1310:307977 | Carl's answer acting for Sam, with chips for Deal OPP-0142 and PO-2281, "1 source left out because not everyone here can see it", and Sam's ask still open |
| Tablet 1024 · Carl's answer | 1310:308091 | The same answer at 1024 px |
| Phone 390 · Carl's answer | 1310:308170 | The same answer full screen, with the source chips wrapping |
| Phone 320 · Carl's answer | 1310:308185 | The same answer at 320 px (see the departure below) |
| State · Carl's answers and when Carl can't answer | 1310:310346 | Six cases: a simulated answer with its "Simulated · no AI used" tag; nothing in the records; a declined request; stopped at its limit; Carl unavailable because the budget is spent; and a source's access changed, so the answer is discarded and answered again |
| State · `@` picker with Carl | 1310:308200 | Carl listed first under "AI assistant" with its icon, and a person called Carl Jensen shown with role (C5) |
| Notes | 1310:310564 | Scope, what stays hidden, the departure and what is not drawn |

**Audit and polish, 18 October 2026, at Dean's request.** Dean asked for an audit and visual polish ("ensure they are accurate and as professional as possible"), noting a white background behind the text of a Carl card. Claude checked every node's fills, fonts and text widths, and screenshotted each frame. Changes:
- **White patches removed.** The "Carl is answering" notices had white text columns. They now sit on the card's blue throughout, and no Carl card has a fill other than its own blue and the white source chips.
- **Left-out sources line.** "1 source left out…" is now a quieter 13 px grey line under the answer.
- **Unavailable notice.** It is neutral, white with a grey border, because Carl produced nothing.
- **Answering states.** These show three working dots.
- **Consistency.** Thread-list times match the latest message (10:20 and 10:21). Long record headings in the thread list end with an ellipsis instead of running past the sidebar edge. The simulated tag reads "Simulated answer · no AI used".

All fonts are Roboto, and no text overflows its container.

**Proposed departure:** at 320 px, Carl's name and its "acting for" line stack, and a source chip's title truncates with an ellipsis. The chip still opens the record.

**Not drawn:**
- Carl turned off. Carl is simply not listed in the picker.
- Carl's answers in the record-page list.
- The loading and empty states with Carl.

**Known difference from W3.** The accepted answer frames (1310:307977 and the tablet and phone frames built from it) show a chip for PO-2281, a purchase order. Under W3, Carl reads only the thread's own deal or project and the records AI1 §6 links to it (the opportunity, its organisation, linked opportunities and CRM Activities). A purchase order is not among them, so W3 governs and T2 builds no purchase-order source. Before the T2c lock-in captures, the chip is to be redrawn as an allowed source, such as a CRM Activity. That change touches the accepted named version, so it needs Dean's yes. Found by the Codex review of 18 October 2026.

**Accepted, 18 October 2026.** Dean accepted the frames and the 320 px departure (quote 3). At his request, Claude saved the named version **"Conversations T2 — Carl answers, accepted"** in the Figma desktop app the same day. The full title was checked in the save dialog, and the version is the newest entry in the file's version history. Two follow-ups wait for the T2c lock-in: the icon-free captures, and the File index row with the section's "(proposal)" label. Both come after the named version, so neither changes it.

## 7. Questions W1 to W9, answered

| ID | Question | Answer (the recommendation, adopted by quote 2) |
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

Building T2a to T2d makes no paid model request: the simulated adapter covers the tests, and the T2d proof can use a mocked transport. One manual live check per adapter change is one Carl turn. At specification §8's assumption (6,000 input and 1,000 output tokens, Sonnet 5.5 at US$2 and US$10 per million) it costs about US$0.022. The T2-7 turn limit caps it at US$0.176 on Sonnet 5.5 and US$0.352 on Opus 5.5, before any US-only uplift. Each check reserves against the US$30 ceiling like any other turn.

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

Accepting the scope, rules and answers is a design decision. It authorises no application code, dependency, migration, seed, capability, route, deployment or paid model request, and reserves no migration or capability number. It does not settle Carl's agreement (C2), the billing owner for operational use, real data, the hosted demo's credential, or the AD-01 sharing, speech and driving decisions; none of them blocks T2 as proposed.

## W3 amendment — 22 October 2026

Dean approved CRM Activity replacement and confirmed R8 warning/new-thread interpretation. Accepted frames were amended with a new named version and [eight icon-free captures](../reference/ui/my-work/conversations-t2-w3-r01/README.md). Earlier named versions and issued captures remain unchanged; the dated PO-2281 finding above records that earlier state. [T2c design](conversations-t2c-design.md) records exact changes and implementation adaptations. The File index and section label were updated after saving the version. P1–P4 govern over older state illustrations.
