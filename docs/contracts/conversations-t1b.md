# Conversations T1b contract

Owner: Dean Fiedler. Status: synthetic T1b build of the accepted scope [PPO-CONV-T1-SCOPE](https://github.com/deanrfiedler-gif/powerplants-one/pull/567) (`docs/decisions/conversations-t1-scope.md`, PR #567) (rules T1-1 to T1-9, answers U1 to U4); verification and business acceptance separate. This slice has no UI, route, top-bar icon, Carl or AI. Those are T1c and later.

## What exists

Migration 0108 and seed 108 add people-only threads on deals and projects, with services in `src/conversations/`.

| Part | Behaviour |
|---|---|
| Thread | One record each (`Opportunity` or `Project`, S2 and Q3). The first thread on a record is its main thread; any reader with the post right may start more (U1). State Open or Resolved |
| Message | Immutable plain text of 1 to 4,000 characters (U2, T1-5). A correction is a new message. Placeholders `@{n}` (person) and `#{n}` (record) stand for mention n, so a record title or person name is never copied into a body |
| Mention | A person (a colleague, T1-3) or a record link stored as type and ID. Each reader sees the target from their own access; a record they cannot open is `can_open: false` with no type, ID, number or title (T1-4) |
| Participant | Creator, Tagged or Participant. Starting, being tagged and posting each add the person (U4); a tagged person who posts becomes a Participant. Last-read only advances |
| Ask | A tagged person with a question and an optional reply-by date. Closes when the person asked replies later in the thread (Answered) or marks No answer needed (theirs alone). Reading closes nothing |
| Notice | A pull projection from the audit log into `notification_events` (`source_type` Conversation, category `Mentions`) with a reason of Mention, Ask, Reminder or AskOverdue. No message prose is copied (T1-7) |

## Access (T1-1, T1-2, T1-3)

- **Read:** the reader can open the anchor record (the record's own visibility rules, including the working company) and holds `conversation.read` in that record's scope. Deals and projects therefore keep their own `crm.opportunity.read` and `project.read` rules. Access is re-evaluated on every read, so a person who loses the record loses the thread, its sidebar row, badge count, notices and receipts. Nothing of the record is stored in the thread.
- **Post:** read access plus `conversation.post` in the same scope.
- **Tag:** only a person who is active, holds `conversation.read` and can read the record. The `@` picker lists the same set. A tag outside it is refused with `TagNotPermitted`; sharing is T6.
- **Link:** the sender must be able to open the record linked.
- **Mapping to roles (U3):** seed 108 gives `conversation.read` and `conversation.post` to every active local synthetic profile for each live `crm.opportunity.read` or `project.read` grant, in the same scope and validity. Hosted demo testers (a different issuer) receive neither; exposure there is a separate decision at T1c. Both are proposed names awaiting Dean's mapping.

## Commands (T1-6)

Each is a typed command through the shared operation path: current permission before the receipt, a canonical operation hash, one transaction for the change, audit event, receipt and outbox job (`ConversationChanged`). Audit details hold identifiers only.

| Command | Result record | Notes |
|---|---|---|
| `startThread` | Thread | Creates the thread, creator participant, first message, mentions, tagged participants and asks together |
| `postMessage` | Message | Closes the author's earlier open asks in the thread; refused on a resolved thread |
| `markRead` | Thread | Moves the caller's last-read forward only |
| `resolveThread`, `reopenThread` | Thread | The creator or a participant with the post right; exact `expected_version` |
| `closeAsk` | Ask | No answer needed: the person asked only |
| `recordAskDeadline` | Ask | N7 step `Remind` or `TellAsker` |

A stored receipt is disclosed only to a person who can still read the thread.

## Reads

`listThreads` (sidebar of threads the viewer takes part in, filters All, WaitingOnYou, Mentions; or every readable thread on one record, Q4), `readThread`, `conversationBadge` (D7: threads with an unread message), `mentionablePeople`, `linkableRecords`, `projectConversationNotices` and `conversationNotices`.

## Database guards

PostgreSQL enforces: messages and mentions are append-only; the next sequence; a participant author holding the post capability; a token in a body has exactly one mention and the reverse; a message needs its accepted audit event and receipt at commit; one main thread per record; a thread keeps its anchor's company; only a state change updates a thread, with the version advanced; last-read cannot move back or pass the latest message; an ask is made by the author of the tagging message, closes once and records each N7 step once.

## Assumptions confirmed

The accepted scope did not decide these five points, so T1b built them as assumptions. On 18 October 2026 Claude recommended confirming them as written, and Dean replied: "Ok. We will proceed on that basis." They are now confirmed rules for T1c and later; a change to any of them is a new decision.

1. **A reply closes all of the person's earlier open asks in that thread.** The scope says an ask closes "when the person replies in the thread". A reply cannot name which ask it answers, so it closes every earlier open ask of that person in the thread. A per-ask reply would need composer support at T1c.
2. **N7 timing.** The reminder falls due on the reply-by date (Brisbane date); the asker is told only on a later day and only after the reminder. Nothing schedules these steps in T1b: `recordAskDeadline` records one when due and the notice projection turns it into a notice for the asked person or the asker. A job or a person opening the thread would call it at T1d or later.
3. **Resolved threads take no post.** Reopening is a separate command by the same people who may resolve.
4. **Only the person asked can mark No answer needed.** The asker cannot withdraw an ask in T1.
5. **The existing notice table is widened.** `notification_events` gains a nullable `reason`; its Activity foreign key becomes a per-source existence guard, and its CHECKs allow the Conversation source with the `Mentions` category. The Activity inbox reads are unchanged; the Conversation reader is `conversationNotices`, to be joined to the inbox at T1d.

## Boundaries

No email (T1-8), attachments, formatting, retraction, sharing, branches, watches, Carl or AI. Synthetic data only (T1-9). Business acceptance, production readiness and the Figma lock-in remain separate.

## T2c compatibility

The [T2c extension](conversations-t2b.md#t2c-ui-extension--22-october-2026) adds server-derived Agent availability and count-only participant confirmation to existing routes. Human tags, asks, navigation and original-operation recovery retain this contract. There is no generic picker endpoint or broader participant-management surface.
