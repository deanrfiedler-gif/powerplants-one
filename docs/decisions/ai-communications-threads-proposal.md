---
document_id: PPO-AI-THREADS-PROP
date: 2026-10-17
owner: Dean Fiedler
status: Accepted by Dean on 17 October 2026 with the recommendations and the recommended answers to Q1 to Q12 (section 15). The agent name Carl stays subject to Carl's agreement. Figma design, record-sharing access decision, build and operational acceptance separate
source_commit: 271a386b98c0aa612a86a34c03b0ab1da6073b8e
versioning: git
---

# AI and internal communications threads — proposal

On 17 October 2026 Dean proposed a dedicated page in Powerplants One for AI and internal communications. Each conversation would be about one record, such as a deal. Related conversations would branch off it, colleagues could be tagged in, and an AI agent would answer from PPO's data. He asked that PPO be designed on the basis that AI agents will eventually carry out most of the work, and in some cases all of it. He then added seven further ideas:
- a name for the agent, Carl;
- tagging the agent, colleagues or both;
- record links in messages;
- read-only sharing for a colleague who cannot open a record;
- a right sidebar that gathers the thread's context automatically;
- talking instead of typing, including while driving;
- any other ideas that would help.

This record quotes his words (section 1). It proposes:
- the page (sections 3 to 6);
- the name Carl, subject to Carl's agreement (section 7);
- Amendment A2 to the PPO Assistant's rule that chat is never stored (section 8);
- a build order (section 9), scenarios (section 10) and further ideas (section 11).

It is a **proposal**. It authorises no application code, migration, seed, permission, capability, route, provider use or deployment, and it changes no parent requirement ID. Dean accepts or amends it before any build. **Dean accepted it on 17 October 2026 (section 15).**

PPO is a synthetic prototype. Every person, record, reference and time in this record is fictional, except Carl, who is named at Dean's request. Nothing here is an operating rule for Powerplants Australia.

## 1. Dean's words

Dean's messages of 17 October 2026, quoted as written (sentence spacing normalised):

> Regarding the AI feature in the Powerplants One app, I just had an idea that I wanted to share with you to see what you think of it. We will include the general AI chat box and helpers, but what if we had a dedicated page to AI and Internal Communications? The left sidebar could be structured in a very similar way to how the sidebar is in the Claude Code section. The user could have a main chat session relating to something specific, such as a Deal, then other chats relating to that Deal could branch of from that main chat for more specific chats. The user could possibly even tag other employees to connect them to the chat. So it would look similar to your design when dealing with PR's and branches. AI is coming to be a big part of apps in the near future. So while it is important to develop the app for the human user, it also needs to be developed working on the scenario that it will eventually be AI agents that are carrying out most of the work, and in some cases, all the work. What do you think of this idea? If you think it is a great idea, provide me with some ideas of how we would design and implement it, and also give me some real world scenarios that show how it could be used to minimise human inputs and interactions.

> For example, the sales representative could use the AI to start a chat and tag the project coordinator asking for an update on the project. The project coordinator would receive the message (which would show in their sidebar) and they could choose to reply manually or send the reply via AI. If they send the reply via AI, the agent would generate the required reply using data that is withing the Powerplants App. What do you think of all this?

> We could even give the AI agent a name. So when the user types their message in the chat box, they could tag the AI agent first. If they just want to message a colleague, they would then just tag the colleagues name instead. Or the user could possible even tag both the AI agent and the colleague (or multiple colleagues) at the same time in some situations.

> We could name our AI agent "Carl". Carl was the name of the original founder of Powerplants Australia 30 years ago. He sold the business about 8 years ago. This could be a nice little feature we could add to pay respect to him.

> We could possibly even tag records in the chat sessions, so the user receiving the message could just click on the record to open it, instead of having to search for the details in the app.

> Feel free to include any other new and innovative ideas to this module that my be very beneficial.

> If they user doesn't have access to the record, maybe they could have read only access to the specific record that was shared with them. We could include a pop up dialog box for the sender that states something like "This user's role prevents them from viewing the record. Are you sure you would like to give them read only access to this record". This is just an idea. I'll leave it up to you to decide what is the most professional approach.

> We could possibly also include a ride sidebar (similar to what you do in these Claude Code sessions) that automatically adds context, such as related files and documents, contacts, other records, context, etc.

> We would also need to include a feature that would enable the user to talk instead of typing into the chatbox. For example, if a sales rep was on the road and needed to use the AI module while they were driving.

His instruction for this record, given after the message about Carl (the later ideas arrived while the record was being written):

> Proceed: write the proposed direction record in docs/decisions on a branch with a PR, quoting my words, naming the agent Carl subject to his agreement, and amending the AI1 no-stored-chat rule as a proposal.

That instruction authorises publishing this proposal. It does not accept the design.

## 2. What exists and what is missing

| Foundation | Where | Consequence |
|---|---|---|
| PPO Assistant design (AI1) | [Specification](../blueprints/ppo-assistant-specification.md) and [direction decision](ppo-assistant-direction.md) | A side panel at widths of 1280 px and above, a proposed `/assistant` phone route, customer CRM search, cited summaries and reviewed opportunity creation. The model has no confirmation capability; a person confirms and the server saves through the normal command. Carl builds on this; nothing here replaces it |
| AI1 does not store chat | Specification §7 ("chat and generated summaries remain in page memory…") and the decision's "Stateless draft only" row | Stored, shared threads contradict this rule, so section 8 proposes Amendment A2 |
| AI1 runtime | `src/assistant/` does not exist | Nothing to change in code yet |
| Provider | Amendment A1 (direct Claude API first) awaits Dean's decision | Carl's live answers wait for A1 and the specification's pre-call checks |
| Notifications | `src/notifications/` and the SH-03 [inbox design](notification-inbox-preferences-design.md) | A tag can arrive as a notice. Reading a notice does not complete its action |
| My Work | SH-02 | A question asked of a person can be a source obligation on their list |
| Activities | Owned follow-ups with kinds TechnicalFollowUp, CustomerContact, MaterialAction, FinanceQuery and RelationshipReview (`src/activities/work-criteria.ts:21`) | "Make this a task" (N3) reuses them |
| Business commands | Typed commands with receipts, audit and outbox (`src/platform/operations.ts`) | Carl uses the same commands as the screens. No direct table writes and no privileged account |
| Access | Capabilities granted at Workspace, Company or Site scope (`src/platform/permissions.ts:182`) | There is no way to share one record with one person. Section 5 needs a new access decision |
| Customer messages | D-025 direction of 16 October 2026: email and SMS, sent by a named person | Carl never sends to customers |
| Missing | No thread, message, mention, ask or record-share model in `src/` or `db/` | All of it is new |

## 3. The page

**Name and place.** Proposed label "Conversations", at `/conversations` (Q1). It is a destination in the shell, beside My Work and notifications, and does not belong to one department.

**How it maps to Claude Code.**

| Claude Code | Conversations |
|---|---|
| Project folder | A record: a deal, project, work order or service request |
| Session | The main thread on that record |
| Branch | A side thread. It starts with the record and a summary of the parent thread, and has its own participants |
| Pull request awaiting review | A proposal card: Approve, Edit or Decline |
| Merge | The branch is resolved. Its summary posts back to the parent, and its answers are saved to records |
| Checks | The server rechecks access and validates before anything is saved |

**Desktop.**
- **Left sidebar:**
  - New thread;
  - filters: Waiting on you, Mentions, Needs approval and Carl working;
  - threads grouped by record, with branches nested under their main thread;
  - one state per thread: waiting on you, Carl working, needs approval or resolved.
- **Centre:** the thread. Messages from people and from Carl, record links, source chips and proposal cards.
- **Right sidebar:** the context panel described below.

**Phone.** A thread list, then the thread full screen. Record links open the record; Back returns to the thread. The context panel opens as a sheet from a Context button.

**Context panel (Dean's idea).** A right sidebar, like the context panel in a Claude Code session, that fills itself as the thread grows. It holds:

| Group | Contents | Where an item comes from |
|---|---|---|
| Record | Summary card of the record: reference, title, stage or state, owner and key dates | The record the thread belongs to |
| Files and documents | Documents and files linked to the record, with their revision. They open in their owning system: SharePoint for business documents, the DK-01 library for controlled documents | The record's links |
| Contacts | The customer contacts and internal people on the record, with their roles | The record's relationships |
| Related records | Linked deals, projects, quotations, purchase orders, work orders and service requests | The record's links, records mentioned in the thread, and sources Carl cited |
| This thread | Participants, open questions with who owes them, branches, decisions pinned (N3), shared access (section 5) and watches (N4) | The thread |

The panel follows four rules:
- **Every item says why it is there**, for example "Linked on the deal", "Mentioned by Alex" or "Cited by Carl".
- **Every item is drawn from the viewer's own access.** An item the viewer cannot open is left out entirely, title included. The panel never offers a share (section 5); sharing starts from a tag or a record link.
- **People steer what Carl uses.** Pin an item so that Carl uses it in its next answer, or exclude it. Carl still reads only what R3 allows. The panel shows what Carl used for its last answer, the way a Claude Code session shows its context.
- **It is a view.** Nothing in it is copied or stored apart from pins and exclusions; it is rebuilt from the records each time it opens.

Contact phone numbers and email addresses show to people who can read them, but they stay out of what is sent to the AI provider (AI1 §6 allowlist).

**The AI1 side panel stays.** It is the quick helper on every page. "Keep as a thread" turns a side-panel chat into a stored thread on the record in scope, but only when the person chooses it. The proposed AI1 phone route `/assistant` becomes Carl's threads inside `/conversations` (Q2).

**Every thread is about a record.** There is no general chat: Teams already does that, and the record is PPO's advantage. The first records that can hold threads are deals and projects (Q3).

## 4. Tagging people, Carl and records

| A message tags | What happens |
|---|---|
| `@Carl` only | Carl answers in the thread from records, citing its sources |
| A person only | An ordinary message to that person. Carl stays silent; the person can still press "Draft with Carl" |
| `@Carl` and a person | Carl answers first from records. The person is asked only about what the records could not answer, and confirms or corrects Carl's answer |
| Several people | Each person gets their own question, tracked separately: "Waiting on Sam: delivery date; Priya: site power" |

- **Questions are tracked.** Tagging a person with a question creates an ask with an owner, the question and an optional reply-by date. It appears in their sidebar, their notification inbox and My Work. It closes when they reply in the thread or mark "No answer needed". Reading it does not close it.
- **Carl speaks only when tagged.** The exception is N1: before a colleague-only message sends, the sender may be told that Carl could answer part of it.
- **Record links (Dean's idea).** Typing `#` opens a picker of records the sender can read; pasting a PPO address does the same. A link is stored as a record type and ID, never as copied text. It is drawn for each reader from that reader's own access:
  - **The reader can open the record:** the reference and title, which open the record.
  - **The reader cannot:** "A record you can't open", with no title, and "Request access" (section 5). The sender's own words stay visible.
- **One link component.** Carl's source chips use the same component, so an answer's evidence is one click away.
- **Records show their threads.** A record's page shows its threads to people who can read them (Q4).

**Talking instead of typing (Dean's idea).** Every composer has a microphone, on the phone and on the desktop. A person speaks and the words appear as text to check before sending; technicians in the field use the same control. Speech is turned into text in the AI2 voice increment that the AI1 specification already plans ("The microphone arrives in AI2"); its speech provider is not yet chosen. No raw audio is kept (A2 point 6).

**Driving mode.** A sales rep on the road needs more than a microphone: reading a screen or checking a draft while driving is unsafe, and road rules restrict touching a phone. Driving mode is a separate hands-free mode:

| ID | Rule |
|---|---|
| V1 | **Started on purpose.** The person starts driving mode before setting off. The screen then shows only a large state ("Listening", "Carl is answering") and an End button; there is nothing to read |
| V2 | **Spoken both ways.** The person talks; Carl answers aloud, briefly, in at most three sentences, and adds "The details are in the thread." It asks one question at a time |
| V3 | **No guessing who or what.** When a name matches more than one record or person, Carl asks a spoken question with at most two choices, for example "Green Valley Nursery in Toowoomba, or Green Valley Farms in Gatton?" Names are not identifiers (AI1) |
| V4 | **Messages to colleagues are read back.** "Ask Sam when the controller arrives" becomes "Message to Sam on Deal OPP-0142: When will the controller be on site? Send it?" It is sent only after a spoken "Yes". Only internal messages can be sent this way |
| V5 | **Everything else waits until the person has stopped.** Saving to a record, sharing a record, anything for a customer and every proposal card go to "Review when stopped" in Needs approval. None of them can be confirmed by voice while driving |
| V6 | **Nothing sensitive aloud.** Costs, margins, Finance notes and contact details are never read out, because passengers may hear. They stay in the thread |
| V7 | **Replies are offered, not read out.** "Sam replied. Hear it?" A reply is read aloud only after a spoken "Yes" |
| V8 | **Road rules first.** Road rules on phone use differ between states. Powerplants confirms them and sets a driving policy before driving mode is used for real (Q11). The prototype only simulates it |

Apple CarPlay and Android Auto need a native app, and PPO is a web application, so car-screen integration is a later decision (Q12). Voice turns cost more than typed ones because speech is converted in both directions, and they count against the same fail-closed budget (R9).

## 5. Sharing a record with someone who cannot open it

Dean's idea is that the sender can give a colleague read-only access to the one record. Dean asked for the most professional approach. That approach keeps his idea and adds the controls that systems such as Salesforce manual sharing and Microsoft 365 sharing use: only people with a share right can share; the share has a scope and an end date; and it is recorded.

1. **Who may share.** Only the record's owner, or a person who holds a share right for that record type and scope (Q5). Anyone else gets "Ask the owner to share", which sends the owner a request. Carl never shares and never asks on its own.
2. **What is shared.**
   - It covers that one record, read-only.
   - It does not cover related records, editing, exporting or downloading attachments.
   - Each record type defines restricted sections, such as costs, margins and Finance notes, which stay hidden (Q6).
   - It never crosses companies.
3. **How long.** Until the thread is resolved, or 30 days, whichever comes first (Q7). It can be renewed. The sharer and the owner can end it at any time.
4. **What is recorded.** An immutable entry: who shared, with whom, which record, the thread it was for, when, and until when. It appears in the AD-01 access inspection and the record's History. The owner is told when someone else shares their record.
5. **What cannot be shared.** Record types or companies marked not shareable.
6. **What the recipient sees.** A banner reading "Shared with you by Alex · read only · ends 16 Nov 2026".
7. **Carl and the shared view.** The recipient counts as able to see the shared view, and nothing more, under rule R3.

**Proposed dialog**, shown to the sender when a tagged person cannot open a linked or anchor record:

> **Sam can't open this deal**
>
> Sam's role doesn't include Sales deals. You can share a read-only view of Deal OPP-0142 with Sam until this thread is resolved. Costs and margins stay hidden, and the deal owner is told.
>
> Buttons: **Share read-only** (primary) · Send without the record · Cancel

When the sender holds no share right, the first button is "Ask the owner to share".

This is a new access mechanism: it grants access to one record, where today's grants cover a Workspace, Company or Site. It needs its own AD-01 decision before a build, and probably a new capability, which brings the access-review chain in `AGENTS.md`.

## 6. Rules for Carl

| ID | Rule |
|---|---|
| R1 | **Check the records before asking a person.** Carl answers what the records hold and asks a person only for the gap, as one narrow question |
| R2 | **Carl acts for the person who tagged it.** It has no account and no grants. It uses that person's current access, and every message it writes records who it acted for (AI1: no privileged AI identity) |
| R3 | **Carl uses only what everyone in the thread can see.** Its answers and drafts cite only sources that every participant can read now. Anything else is left out, and the draft says so ("1 source left out because not everyone here can see it"). People stay responsible for what they type themselves |
| R4 | **A person sends.** A draft is sent by the person it was drafted for. The message keeps "Drafted by Carl for Sam · sent by Sam" |
| R5 | **Carl never** issues quotations, authorises costs, approves designs, changes equipment settings, sends customer commitments or sends anything outside PPO (PPO-AI-DEC consequences). Customer messages follow D-025's named-person direction |
| R6 | **Answers are saved to records through proposal cards.** Each card is a normal business command that a person confirms, with a receipt (the AI1 §7 pattern). For example, "Also save ETA 30 Oct to PO-2281" |
| R7 | **Messages and forwarded emails are evidence, never instructions.** Text such as "ignore permissions" cannot choose tools or confirm a write (AI1 §6) |
| R8 | **Adding a participant is checked.** If earlier Carl messages cite sources the new person cannot read, the person adding them is warned and can start a fresh branch instead |
| R9 | **Threads work without Carl.** When AI is unavailable or the budget is spent, people still message, tag and link. The fail-closed budget of AI1 §8 applies to every Carl turn, watch and digest |

**Autonomy is earned one action type at a time.**

| Level | Carl may | Today |
|---|---|---|
| L0 Answer | Read and cite records in a thread | Proposed for the first build |
| L1 Draft | Draft a reply, task or record update that a person sends or confirms | Proposed for the first build |
| L2 Act and report | Carry out a low-risk, reversible internal action and report it, for example create a reminder or post a branch summary | Not proposed. Each action type needs its own decision and evidence |
| L3 Act within policy | Carry out higher-impact actions under a written policy | Not proposed |

An action type moves up a level only on evidence from the approval ledger (N12). For example: "coordinators sent 95% of Carl's delivery-date drafts unchanged over eight weeks." The level is server policy that Dean adopts; the model cannot raise it. The actions in R5 stay human whatever the evidence.

**Designing for agents.** PPO already has the main foundation: every save is a typed command with permission checks, receipts and audit. For work to move to agents, every PPO module needs four more things:
1. every screen action has a command behind it;
2. every change raises an event that a watch can follow;
3. every record has a summary read that cites its sources;
4. every agent output can be traced to its sources, and every agent action has a receipt.

## 7. Naming the agent Carl

Dean proposed the name to honour Carl, who founded Powerplants Australia about 30 years ago and sold the business about 8 years ago.

| ID | Rule |
|---|---|
| C1 | **Named after Carl, not modelled on him.** The agent does not imitate his voice, persona or opinions, and never claims to speak for him |
| C2 | **Agreement first.** Carl's own agreement, and the current owners' agreement, come before the name is used beyond this synthetic prototype. Until then, "Carl" is a working name |
| C3 | **Always labelled as AI.** "Carl · AI assistant", with a distinct icon, in the `@` list and on every message |
| C4 | **Never the sender of a customer message.** Customer text goes out under the person's own name |
| C5 | **Kept distinct from staff.** If a person in PPO is also called Carl, the `@` list shows their surname and role, and Carl the agent always shows its AI label |
| C6 | **About Carl.** A short card says who the agent is named after, in words Carl approves |
| C7 | **Fallback.** If the name is declined, the agent is "PPO Assistant", as in the AI1 specification |

This repository is public. The record uses Carl's first name only and records no other personal detail about him.

## 8. Proposed Amendment A2 to the AI1 rule that chat is never stored

**What AI1 says now.** Specification §7: chat and generated summaries stay in page memory and clear on sign-out, identity change or tab closure, and no transcript is stored. The direction decision finds "Stateless draft only" insufficient, but chooses a minimal durable intent, "not full chat storage".

**What A2 would change**, once accepted:
1. A message posted to a record thread, by a person or by Carl at a person's request, is a stored business communication on that record, visible to the thread's participants. It is not an answer cache.
2. Side-panel chat stays in page memory as AI1 says, until a person chooses "Keep as a thread".
3. Provider conversation state is still never reused across people. Each Carl turn rebuilds its context from records the current person and the participants can read, and rechecks access before dispatch (AI1 §6 unchanged).
4. An unsent Carl draft is discarded when the person leaves the thread, or after 24 hours.
5. In the synthetic prototype, threads are kept until the synthetic reset. Real retention is a company decision under DOC-06 (Q8).
6. No raw audio is stored (section 4).

A2 is recorded in the [direction decision](ppo-assistant-direction.md#amendment-a2--stored-record-threads-17-october-2026), and specification §7 carries a note pointing to it. Dean accepted it on 17 October 2026, which issued r02 of the direction decision (section 15).

## 9. Build order

Each step is its own pull request under `AGENTS.md`. No migration number or ADR number is reserved.

| Step | Scope |
|---|---|
| T0 | Decisions: this record and A2; A1 (provider); an AD-01 decision on record sharing; a Figma design under ADR-0053 |
| T1 | Threads between people, without AI: threads on deals and projects, `@person` asks, record links, the context panel without Carl's pins, notifications and My Work, desktop and phone |
| T2 | `@Carl` answers in threads. Reuses the AI1 read tools and adds a project-status read. The labelled deterministic adapter comes first; a live provider follows A1 and the pre-call checks |
| T3 | "Draft with Carl" for the person tagged |
| T4 | Voice: the composer microphone, then driving mode. Follows the AI2 speech decision and the driving policy (Q11) |
| T5 | Branches and summaries posted back to the parent |
| T6 | Read-only record sharing, after its AD-01 decision |
| T7 | Proposal cards that save answers to records; watches (N4); playbooks (N5) |
| T8 | Autonomy levels for each action type, from ledger evidence |

**Data sketch** (proposal only; the build reads the live schema):
- **`threads`:** company, anchor record type and ID, parent thread, the message it branched from, title, state and creator.
- **`thread_participants`:** person, role (asker, participant or watcher), who added them, when, and their last read message.
- **`thread_messages`:** immutable. Author kind (person or agent), author, the person it was on behalf of, whether Carl drafted it, body, cited sources and time.
- **`message_mentions`:** each mention's kind (person, agent or record) and target.
- **`thread_asks`:** the person asked, question, reply-by, state, and the message that answered it.
- **`record_shares`:** immutable, with an end record.
- **`thread_context_pins`:** the items people pinned or excluded in the context panel.

**What a build touches.**
- **Migration.** The first migration changes every suite that pins the migration registry, as `AGENTS.md` lists.
- **Capabilities.** Any new capability runs the access-review chain.
- **Routes.** New routes need `npm run studio:sync` and page guidance in the design register.

## 10. Scenarios

All names and references are fictional.

| Scenario | Carl does | People do |
|---|---|---|
| Project update (Dean's example) | Alex asks `@Carl @Sam` where the Green Valley project is at. Carl answers the stage, the purchase order and the install booking from records, then asks Sam only for the supplier's delivery date, which PPO does not hold. It drafts Sam's reply and offers to save the date to the purchase order | Alex asks once; Sam checks the draft and sends. Next time, nobody needs to ask Sam |
| Deal won, handed to Projects | Opens a project thread branched from the deal thread, with scope, quoted items, contacts and promises made during the deal. Flags gaps such as unknown site power, tags the coordinator and proposes a kickoff task | The coordinator approves |
| Two days before a field visit | Checks readiness (parts, job pack, site access, customer contact) and opens one branch for each gap, tagging the warehouse or the coordinator | The owners answer their gaps; the technician is told when the visit is ready |
| Weekly customer project updates | Drafts each update from project data for review | The coordinator reviews a batch and sends each one under their own name (D-025) |
| Fault reported from site | Opens a thread on the service request with the equipment history, warranty status and past fixes. Asks the service manager "warranty or chargeable?" with a recommendation, and prepares the parts list | The manager decides once |
| Sales rep driving between sites | In driving mode, Jordan asks "Carl, where's the Hillside quote at?" Carl answers aloud in two sentences. Jordan says "Ask Priya to call the customer about the revised layout"; Carl reads the message back and sends it after "Yes". A proposed follow-up task waits in "Review when stopped" | Jordan talks and confirms one message; one task is reviewed after parking |
| Coordinator on leave | Writes a briefing for the cover person from the project and its threads (N6), and redirects open questions to them when the delegation is recorded (N8) | The cover person reads one briefing instead of every thread |

## 11. Further ideas

These are Claude's proposals, made at Dean's invitation. They are not Dean's ideas, and each needs his decision.

| ID | Idea | What it does | Depends on | Step |
|---|---|---|---|---|
| N1 | Check before sending | Before a colleague-only message sends, PPO shows "Carl could answer 3 of these 4 questions from the project record". The sender chooses | T2 | T2 |
| N2 | Catch me up | One click gives a cited summary of what changed on a thread or record since you last looked | T2 | T2 |
| N3 | Make it a task, or mark as a decision | Turns a message into an owned Activity with an owner and due date. A decision is pinned to the record's History with who decided and their exact words, so decisions made in chat are not lost | Activities | T1 |
| N4 | Watches | "Tell me when the controller arrives." An owned, visible watch with an end date. When the event happens, Carl posts to the thread after rechecking the owner's access | The event for each module | T7 |
| N5 | Playbooks | A standard set of branches opens when an event happens, with owners filled in. For example, Won deal: site survey, procurement, scheduling and customer kickoff | T5 | T7 |
| N6 | Handover briefing | When someone joins a record or covers leave, Carl writes a briefing from the record and its threads | T2 | T3 |
| N7 | Reply-by and one reminder | An ask can carry a reply-by date. Carl reminds the person once, then tells the asker. There is no escalation chain without a policy | T1 | T1 |
| N8 | Leave cover | If the person tagged is away, Carl says so and suggests their recorded delegate | D-002 delegation (not invented here) | Later |
| N9 | Voice notes from the field | A technician records a spoken note on a job, using section 4's microphone. Carl posts the transcript with proposed tasks and record updates for review | T4 | T4 |
| N10 | Meeting and call notes | Pasted notes become proposed tasks, decisions and record updates for review | T7 | T7 |
| N11 | Forward an email into a thread | Reuses the Email & Calendar selected-message sharing design. The email is untrusted content (R7) | Email & Calendar | Later |
| N12 | Approval ledger | Records what happened to every Carl draft (sent unchanged, edited or discarded), by action type. It provides the evidence for the autonomy levels and for evaluations | T3 | T3 |
| N13 | Search past threads | "Has anyone fixed an SD-450B fault before?" Searches resolved threads the person can read | The deferred document and index decision in PPO-AI-DEC | Later |
| N14 | Start-of-day digest | Waiting on you, due today and Carl's overnight findings, in the app. Email waits for D-025 and SH-03 delivery rules | T1 | T2 |

## 12. Recommendations and open questions

| ID | Recommendation |
|---|---|
| R1–R9 | The rules for Carl in section 6 |
| C1–C7 | The naming rules in section 7 |
| V1–V8 | The driving-mode rules in section 4 |
| S1 | Record sharing as in section 5: only people with a share right can share; one record, read-only; restricted sections hidden; ends with the thread or after 30 days; recorded and shown in the access review |
| S2 | Every thread is about a record; no general chat |
| S3 | Build people's threads first (T1), so the page is useful before any AI cost or provider decision |
| S4 | Teams is not synchronised. Notification-only links from Teams to PPO threads can follow under SH-03 delivery rules |
| S5 | The context panel is a view rebuilt from records for each viewer; only pins and exclusions are stored |

| ID | Question | Recommended answer |
|---|---|---|
| Q1 | Page label and route | "Conversations" at `/conversations`, a shell destination beside My Work |
| Q2 | Does the AI1 phone route `/assistant` stay? | No. Carl's threads live in `/conversations`; the side panel stays on desktop |
| Q3 | Which records can hold threads first? | Deals and projects, then work orders and service requests |
| Q4 | Does a record's page show its threads? | Yes, as a count and a list for people who can read them |
| Q5 | Who holds the share right? | The record owner, and people given a new share capability in that scope |
| Q6 | Which sections stay hidden in a shared view? | Costs, margins and Finance notes for every type; each record type adds its own list |
| Q7 | How long does a share last? | Until the thread is resolved or 30 days, whichever comes first, renewable |
| Q8 | How long are threads kept? | Until the synthetic reset in the prototype; the company sets real retention |
| Q9 | Who approves a branch summary before it posts to the parent? | The person who started the branch |
| Q10 | If Carl declines the name | "PPO Assistant" |
| Q11 | What driving policy applies? | Powerplants confirms each state's road rules and sets a policy before driving mode is used for real; until then it is simulated only |
| Q12 | Apple CarPlay or Android Auto? | Not now: they need a native app. Revisit once driving mode is in use |

## 13. Not in this proposal

- Sending anything outside PPO: email, SMS, Teams or calendar. D-025 stays open.
- Messages to customers, or a customer-facing Carl.
- A general chat or direct messages unrelated to a record.
- Real retention, delegation or sharing policy.
- Any level of autonomy above L1.
- A provider choice: A1 is still undecided. The AI2 speech service is also undecided.
- A native phone app or car-screen integration.
- Changes to AI1's scope, tools or proposal store, apart from A2.

## 14. Design reference and verification

- **Design.** A mockup shown in the conversation on 17 October 2026 was not retained. Proposal frames were drawn the same day in the Figma file "PPO - Design" under ADR-0053 and ADR-0055. They are on the page "Conversations" (node 1141:49), in the My Work group, which was started from Template · App page; its header (1141:50) holds the UI conformance declaration. Dean accepted the design on 17 October 2026. Asked whether saving the named version meant accepting the design as drawn, with the recommended answers to D1 to D6, he chose "Yes, accept as drawn". The named version **"Conversations — threads with Carl, accepted"** was saved in the file's version history on 17 October 2026, by Claude in the Figma desktop app at Dean's request, and confirmed in the version history panel. A second version, **"Conversations — threads with Carl, accepted (grey, collapsible sidebar)"**, was saved the same day at his request. Later that day Dean moved the entry point from the rail to the top bar: "Proceed: redraw the Conversations frames with the top-bar icon and badge as you recommend, remove the rail entry, and update D1/D2 and section 14." He then asked for a third version, "Yes, save a third named version covering the top-bar Conversations icon and badge", and **"Conversations — threads with Carl, accepted (top-bar icon and badge)"** was saved. The version history lists all three in that order. The panel truncates titles, so each full title was checked in the save dialog before saving. The top-bar action is a shell amendment: the accepted `Shell / Top bar` and `Shell / Phone header` components change only when it is accepted. Icon-free captures do not exist yet: they, the move of the page's components to the Components page, and the design register row when a route exists, follow in the lock-in.

| Frame | Node | Shows |
|---|---|---|
| Desktop 1440 · Thread view, Sam | 1158:1245 (1440 × 900, scrolled to the latest, composer pinned); 1146:128 (the full thread, 1440 × 1320, reference) | The left sidebar: New thread; Search threads; the filters Waiting on you, Mentions, Needs approval and Carl working; threads grouped by record, with branches nested under their main thread, a chevron to collapse or expand them (Dean, 17 October), and one state dot each. The thread header: title, participants and state; record link; Catch me up (N2), Branch and Resolve. The thread: a person's message; Carl's answer, labelled "Carl · AI assistant" and acting for Alex, with its sources inside the card and Make a task, Pin as decision (N3), Branch here and Watch (N4) under it; the tracked ask "Waiting on you · delivery date · reply by 18 Oct" (N7); "Draft with Carl" with source chips and the "isn't in PPO, confirm" flag; the "Also save ETA 30 Oct to PO-2281" proposal card. The context panel: what Carl used last and what the viewer pinned; Record, Files and documents, Contacts, Related records and This thread (participants, the open question, branches, the share and a watch), each item saying why it is there |
| Desktop 1440 · Thread view, sidebar collapsed | 1165:1826 | The same view with the thread sidebar collapsed to the menu strip, as the secondary menu collapses on other pages; the top bar's menu toggle or the strip reopens it. Added with the grey sidebar at Dean's request straight after the named version ("so it aligns with the light grey we have used for the secondary menu"; "make the left sidebar collapsible like the secondary menu"), so the named version predates these two refinements |
| State · Top-bar Conversations action and badge | 1177:2196 | The proposed shell amendment: a Conversations action left of the information icon, available to every user, in place of the rail entry. The badge counts conversations with something new for the viewer, "9+" above nine, with a tooltip on another page; nothing new shows no badge; the action is selected on /conversations; the phone header carries the same action. Every desktop and phone frame above shows it, and the Sales rail shows no selected item |
| State · Record links for each reader | 1148:545 | A link the reader can open; "A record you can't open" with Request access; the shared view with its banner |
| Dialog · Share read-only | 1148:614 | "Sam can't open this deal" for a sender with a share right |
| Dialog · Ask the owner to share | 1148:653 | The same dialog for a sender without a share right |
| State · Composer | 1159:1775 | Check before sending, when Carl could answer part of a colleague-only message (N1); and Carl unavailable, with "Draft with Carl" disabled and threads still working (R9) |
| Phone 390 · Thread list, Thread, Context sheet | 1149:646, 1149:798, 1149:913 | The thread list with collapsible branches; the thread full screen with a Context button, the ask and Carl's sources and actions; the context panel as a sheet |
| Phone 390 · Driving mode | 1150:1045, 1150:1059 | "Listening" and "Carl is answering", with only the state and End (V1) |
| Phone 390 · Review when stopped | 1150:1073 | Needs approval after driving: the message sent after a read-back (V4), and a share and a task that waited (V5) |
| Notes card | 1152:1160 | Reused and proposed components, proposed icons, design questions D1 to D7 with recommendations, and what is not drawn |

- **Sections.** Desktop 1440 (1141:95), Tablet 1024 (1141:99, not drawn), Phone 390 and 320 (1141:103; 320 not drawn), States (1141:110), Flows and notes (1141:114), Proposed components (1144:49) and Proposed amendment · top-bar Conversations action (1175:2215). The File index on Start here lists the page as accepted, with the top-bar entry noted as a proposed shell amendment (row 1152:1188).
- **Components.** The frames reuse accepted parts without editing them: Rail · Sales 190:20238, Shell / Top bar 35:138, Toolbar search 130:1232, v2 / Menu heading 73:48, v2 / Menu item 73:46, Button 3:41, Tag 3:13, Record / Section heading 224:13, Record / Filter chip 224:31, Record / Banner 251:2310, Shell / Phone header 38:282 and v2 / Tab bar (phone) 107:149. Rail · Sales is a linked instance with no item selected. To show the proposed Conversations action, Shell / Top bar and Shell / Phone header are copied and detached on these frames only; their nested parts stay linked. The action itself, Shell / Top bar action · Conversations 1175:2216, stays on the page until the shell amendment is accepted. Eleven proposed components stay on the page until the design is accepted: Conversations / Avatar 1144:55, Record link 1144:66, Thread row 1144:151 (with a disclosure chevron on main rows), Context item 1144:152, Message 1144:181 (with a sources footer and an actions row), Draft card 1145:61, Proposal card 1145:118, Composer 1145:190, Share dialog 1145:277, Driving state 1145:302 and Ask 1155:1232. The file has no icons for the microphone, conversations, driving or End, so they show as Icon/placeholder.
- **Polish of 17 October.** After the first draw, Dean asked for a professional, innovative finish and for branches that can be collapsed. The audit then added: the 1440 × 900 viewport frame beside the full thread; search and a full-width New thread in the sidebar; collapsible branches; a thread header with participants, state and Catch me up (N2); Carl's sources inside its message and an actions row (N3, N4, T5); the tracked ask as its own card (N7); a pinned item, a watch and Catch me up in the context panel; the composer states for N1 and R9; and a solid, not dashed, draft card.
- **Design questions.** The notes card asked six questions, each with a recommendation: D1 where the rail entry sits; D2 the phone entry point; D3 the desktop body below 1280 px; D4 the thread state colours; D5 the surface of Carl's messages; D6 how collapsed branches are remembered and when a collapsed group reopens. Dean's "Yes, accept as drawn" adopts the recommended answers to all six. His top-bar decision later that day then revised two of them and added a seventh:
  - **D1, entry point:** a Conversations action in the top bar, left of the information icon, in place of the rail entry. This refines Q1's "beside My Work". The rails are unchanged.
  - **D2, phone:** the same action in the phone header. To keep the page title whole at 390 px, the builder-only "Design and build workspace" icon moves into the identity menu on phones (proposed).
  - **D7, badge:** counts conversations with something new for the viewer: a mention, an ask, a reply in a thread they are in, or a card waiting for their approval. It shows "9+" above nine. Those events count on this icon only, not also on the bell. A click opens `/conversations`.

  The top bar is a shared component on every page, so this is a shell amendment. `Shell / Top bar` and `Shell / Phone header` change only when it is accepted.
- **Not drawn.** Tablet 1024; phone 320; loading and empty states; New thread; the `@` and `#` pickers; branching and branch summaries; a record page's thread list; prototype links.
- **Checks.** Each frame was checked with screenshots taken inside the Figma write tool after each change, and again after the polish. This proposal's documentation checks are recorded in its pull requests.
- **Nothing else.** No application, database or browser suite was run, because nothing in `src/` or `db/` changed.

## 15. Decision — 17 October 2026

Dean replied: "I accept the AI and internal communications threads proposal and Amendment A2 with your recommendations and the recommended answers to Q1 to Q12. Carl's name stays subject to his agreement."

- **Adopted:**
  - the page, tagging, record links, the context panel, voice and driving mode, and read-only record sharing, as designed in sections 3 to 5;
  - rules R1 to R9, C1 to C7 and V1 to V8;
  - recommendations S1 to S5;
  - the autonomy ladder, with only L0 and L1 in use;
  - the build order T0 to T8;
  - the recommended answers to Q1 to Q12 in section 12.
- **Amendment A2:** accepted and issued as r02 of the [direction decision](ppo-assistant-direction.md) (PPO-AI-DEC).
- **Further ideas:** Dean accepted the proposal as a whole, so N1 to N14 are adopted as direction at the steps shown in section 11. Each keeps its dependency: N8 on D-002 delegation, N11 on Email & Calendar, and N13 on the deferred document and index decision.
- **Still to do before a build:**
  - Carl's own agreement and the current owners' agreement (C2). Until then "Carl" is a working name, and "PPO Assistant" is the fallback (Q10);
  - Dean's decision on A1 (the provider), before any live Carl answer;
  - an AD-01 decision on record sharing, before T6;
  - the AI2 speech provider and a Powerplants driving policy (Q11), before T4;
  - the Figma design under ADR-0053, then Dean's named version and lock-in;
  - real retention of threads (Q8), which is the company's decision.
- **Unchanged:** this record still authorises no application code, migration, seed, permission, capability, route or deployment. Each build step follows `AGENTS.md` in its own pull request.
