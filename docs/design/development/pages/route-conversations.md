# Conversations — design reference

Stable entry: `route:/conversations`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Scope: PPO-AI-THREADS-PROP, step T1, slice T1c-1 ([T1c design](../../../decisions/conversations-t1c-design.md), [T1 scope](../../../decisions/conversations-t1-scope.md)). People-only threads; no Carl, AI, voice, branches or sharing.

## Purpose and task

Ask colleagues about a deal or project and keep the question with the record.

1. Open Conversations from the top bar: the action left of the Page guide, with a badge counting threads with something new (T1c-2).
2. Filter by Waiting on you or Mentions, or search by title or record number.
3. Choose New thread: pick About, write the message, tag people with `@`, switch on Ask for anyone asked a question, and start the thread.

## Desktop

The rail and top bar are the shared shell; no rail item is current, and the top bar's Conversations action is (D1). A 280 px thread sidebar in the secondary-menu grey holds New thread, Search threads, the two filters with counts, and the threads grouped under their record heading ("Deal SYN-PPO-OPP-000123 · …", uppercased by CSS). Each row shows the title (bold when unread), state (Waiting on you, Resolved, or a grey Open, which the frames do not draw) and time. With conversations, the desktop opens the top thread, preferring one waiting on the viewer; with none, the main area shows the drawn empty page. New thread is a modal dialog: About, Message with ask rows, "Title: …" with Edit, the corrected hint and Cancel or Start thread. The context panel is T1c-3. Verified at 1440 × 900 and 1024 × 768.

## Mobile

At 780 px and narrower `/conversations` is the list alone; New thread is full screen. At 320 px the list fits with no horizontal scroll. The phone header carries the Conversations action, current here. At 360 px and narrower the header keeps 4 px sides and an 18 px title, so "Conversations" stays whole, and the Page guide is in the identity menu (T1c-2; [shell record](../systems/shell.md#conversations-action-and-narrow-headers-conversations-t1c-2--18-october-2026)).

## Shared components and states

Shared shell, `Button`, `ErrorNotice`, `usePlatformResource` and `useRecoverableCommand`; styles use shared tokens (`src/conversations/components/conversations.css`), except three literal colours with no token yet: the dialog backdrop, the picker shadow and the field-error fallback. They are an exception for review, not a new palette. States: loading skeleton, empty page, list read error with Retry, no matches. The list re-reads every 30 seconds while visible, on focus and after any command, and keeps the last list during a re-read.

## Visual references

- Accepted frames: Figma file "PPO - Design", page Conversations, section 1244:3422, named version "Conversations T1 — people-only threads, accepted": desktop thread 1244:3423, empty 1244:285681, loading 1244:286085, New thread 1244:286267, pickers 1244:286385, tablet 1244:286582, phone list 1244:285233 and 1244:285524 (320).
- Departures recorded in [T1c design section 7](../../../decisions/conversations-t1c-design.md#7-changes-to-the-accepted-design): derived title line with Edit, ask rows, grey Open row state; the dialog hint was corrected on frame 1244:286305.
- No icon-free captures of the T1 frames yet: they belong to the T1c-2 lock-in, which waits for Dean's go-ahead in Figma. No implementation capture is recorded here.

## Behaviour, handovers and verification

A row opens `/conversations/[id]`. New thread accepts `?new=1&record={type}:{id}` for T1d's record pages; the record is looked up by its ID among the records the sender can link. A start that was not confirmed is shown, with Retry, the next time the dialog opens, and a start confirmed after a reload opens its thread. Tests: `tests/unit/conversations-sidebar.test.ts`, `tests/unit/conversations-composition.test.ts`, `tests/browser/conversations.spec.ts` (desktop and phone). No review fingerprint or owner acceptance is claimed; the article `guide.route-conversations` remains Draft.

The top-bar navigation proof waits for the final destination defined by T1c section 5.2: the exact preferred thread on desktop, and the populated list on phone before choosing a thread. A transient `/conversations` address is not the desktop completion state. The phone list preserves the unread count; opening the thread marks it read and updates the badge. The action remains current on both routes, including its hidden state in the compact phone record header. Verification and limits are recorded in [Conversations navigation evidence](../../../testing/evidence/conversations-navigation/README.md); this clarifies the existing contract without changing the accepted behaviour.
