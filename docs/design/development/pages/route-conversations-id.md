# Conversation thread — design reference

Stable entry: `route:/conversations/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Scope: PPO-AI-THREADS-PROP, step T1, slice T1c-1 ([T1c design](../../../decisions/conversations-t1c-design.md), [T1 scope](../../../decisions/conversations-t1-scope.md)). People-only; no Carl, AI, voice, branches or sharing.

## Purpose and task

Read and answer one conversation about a deal or project, and close the questions you were asked.

1. Read the messages and any ask card waiting on you.
2. Reply in the composer; a reply by the asked person closes their open asks in the thread.
3. Choose No answer needed, Resolve or Reopen as the conversation requires.

## Desktop

The sidebar stays beside the thread with the open row marked current. Header: title, participant initials, state tag (Waiting on you, Open or Resolved), the record link, "Main thread · started by …, {time}", and Resolve or Reopen for the creator and participants; the "…" menu is hidden. Messages show author and time (no role line: the read carries none), `@` tags as names in link blue, and `#` links as record-link pills drawn from the reader's access; one the reader cannot open reads "A record you can't open" with no action. Ask cards sit under the message that made them. The composer has the `@` and `#` pickers, an Ask switch per tagged person (off by default) with a short question and an optional reply-by date, and Send (Ctrl+Enter). The breadcrumb reads "Conversations / {record number}". Verified at 1440 × 900 and 1024 × 768.

## Mobile

At 780 px and narrower the thread is full screen with "Back to conversations"; ask cards lose their indent and the title row wraps. Verified at 390 × 844; the 320 list is covered on the list route.

## Shared components and states

`RecordLink` (with `Project` added), `RecordIdentity`, `Button`, `ErrorNotice`, `useRecoverableCommand` (posting, resolve, reopen, No answer needed; one journalled operation per key), plain `api()` for mark-read. States: loading skeleton; a 403 or 404 read shows only "This conversation isn't available to you" and drops the thread, so a later re-read cannot draw it again; another read error keeps the last thread with "This conversation could not be refreshed. Showing what was last loaded." and Retry; a state command or a post refused because the thread changed (version conflict, resolved thread, closed ask) re-reads it, a state command with "This conversation changed while you were reading it. It has been refreshed."; a failed send keeps the text and tags with Retry; a picker that fails shows Retry and the message can still be sent; a resolved thread replaces the composer with "Reopen this conversation to reply"; a refused send (403) shows "You can read this conversation but not post in it." Drafts are held per thread above the thread's read, so they survive the 30-second re-read, a failed re-read and a resolve elsewhere. A Resolve, Reopen or No answer needed that was not confirmed shows "… has not been confirmed." with Retry and disables the other actions. Tags are atomic: an edit that touches a tag removes the whole tag, so a label never remains as plain text; a typed `@` or `#` opens the picker and stays if the picker is dismissed.

## Visual references

- Accepted frames: Figma file "PPO - Design", page Conversations, section 1244:3422, named version "Conversations T1 — people-only threads, accepted": desktop thread 1244:3423, record links 1244:286460, pickers 1244:286385, tablet 1244:286582, phone thread 1244:285266 and 1244:285578 (320).
- Departures recorded in [T1c design section 7](../../../decisions/conversations-t1c-design.md#7-changes-to-the-accepted-design). The phone "Back to conversations" link follows the accepted phone frames' Back; the role line under author names is not shown.
- No icon-free captures of the T1 frames yet: they belong to the T1c-2 lock-in, which waits for Dean's go-ahead in Figma. The top bar's Conversations action is current on a thread, and opening a thread with an unread message lowers its badge (T1c-2).

## Behaviour, handovers and verification

The record link opens `/crm/opportunities/{id}` or `/projects/{id}`. Reading marks the thread read for participants only. Tests: `tests/unit/conversations-asks.test.ts`, `tests/unit/conversations-composer.test.ts`, `tests/http/conversations.test.ts`, `tests/browser/conversations.spec.ts` (desktop and phone). No review fingerprint or owner acceptance is claimed; the article `guide.route-conversations-id` remains Draft.
