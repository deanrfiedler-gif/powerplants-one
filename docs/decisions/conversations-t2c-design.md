---
document_id: PPO-CONV-T2C-DESIGN
title: Conversations T2c design and implementation
date: 2026-10-22
owner: Dean Fiedler
status: Implemented in draft PR 660; independent review and Dean's acceptance pending
versioning: git
---

# Conversations T2c design and implementation

Owner of this contribution: Codex, working for Dean Fiedler. Dean decides acceptance and merges. This record claims T2c, Carl in the existing Conversations UI, using the merged simulated assistant core. It adopts no new technology, migration, capability, grant or provider.

## Authority and current evidence

Dean authorised implementation on 22 October 2026: "I authorise implementation of T2c: Carl in /conversations, using the existing simulated assistant core. Deliver one reviewable draft pull request. Dean decides acceptance and merges."

The [T2 scope](conversations-t2-scope.md), [T2b design](conversations-t2b-design.md), [T2b contract](../contracts/conversations-t2b.md), [T1c design](conversations-t1c-design.md) and [threads direction](ai-communications-threads-proposal.md) govern. T2-1 to T2-12, W1 to W9 and accepted P1 to P4 remain unchanged. Scope identity is PPO-AI-THREADS-PROP, T2c; all 78 parent requirement IDs remain.

Fresh origin/main is `bb5da7d148fe60ef3cf28d1666cd41aee51e6d46`. GitHub confirms #642 and #659 merged. Migration 0110 and seed 110 already supply the assistant core; integrated history reaches 0115. Older "not built", draft and ownership-stop statements are dated evidence. No open PR or T2c issue/branch was found at the claim check. The #659 cross-model waiver applied only to that merge; no Claude review is claimed here.

## Owner decisions, 22 October 2026

Asked once at the start of this contribution. Dean replied: "Approve CRM Activity replacement (recommended)" and "Confirm warning and new-thread alternative (recommended)". These approve the two recommendations below; implementation and visual review remain separate.

| Decision | Recommendation | Current state |
|---|---|---|
| W3 accepted Figma correction | Replace PO-2281 with an allowed CRM Activity across desktop 1310:307977, tablet 1310:308091, phone 1310:308170 and 1310:308185, checking related state frames before new lock-in captures | Applied; named version verified and eight icon-free captures retained |
| R8/U1 | Warn before adding a person unable to read earlier cited sources; offer a new thread on the same record because branches belong to T5 | Implemented; count-only warning and existing new-thread flow |

Issued captures and historical named versions remain unchanged. The accepted visual reference is "Conversations T2 — Carl answers, accepted"; the 320 px stacking and source-title truncation departure is already accepted. W3 controls the implementation regardless of the invalid purchase-order illustration.

## Interface and implementation approach

Reuse the existing React components, shared tokens, record links, `readRoute`, `commandRoute`, `usePlatformResource` and `useRecoverableCommand`. Extend the existing people picker response with server-derived agent availability, scoped to the selected anchor. There is no generic picker endpoint. Carl has an Agent tag and no person ID, participant account or Ask switch; a human called Carl keeps their own identity.

The answer card consumes only the server's P1 reader projection: immutable checked plain text, safe source chips, gaps, coverage and count-only omissions. No raw answer cache or markup renderer. P3 terminal notices sit beside the triggering message; only Answered and CannotAnswer have agent messages, and only the tagger receives a reason. Every simulated answer is visibly labelled Simulated and identifies the person acted for.

Posting continues to create the human message and queued turn atomically. The existing document worker runs turns; no adapter executes in the browser or a new UI command endpoint. This follows Dean's current instruction over the historical T2b note proposing a direct runner call after post. Refresh observes persisted state and preserves drafts, human asks, recovery, navigation, context and unread behaviour.

Expected files: `src/conversations/composition.ts`, composer/picker/message/thread/workspace components and CSS; narrow `src/conversations/reads.ts` and existing route DTO support; focused unit, database, HTTP and browser tests; both Conversations page contracts, affected component/guide records, contract and status/register fragments. Final scope follows inspected interfaces. No shared shell redesign.

R8 is enforced in the existing post command, before a newly tagged person is added. The existing people read can take a thread ID and return a count-only warning with an opaque basis for each candidate. Confirmation is bound to the current cited history and that candidate's source access; a changed basis refuses the post and asks for a fresh review. Original receipts keep their existing hashes when the new acknowledgement field is omitted. No access is granted by confirmation. The fresh-thread alternative opens the existing New thread flow on the same record.

The user schema stores a display name but no assigned job role. Proposed AD-01 role bundles are explicitly not assignments. The picker therefore uses each person's stored full display name and the truthful secondary label "Person · Role not recorded", rather than inventing a role or changing the schema. This is a disclosed C5 presentation limitation; Carl remains separately labelled and identified as an AI assistant.

## Test-first sequence

1. Add failing composition tests for atomic Agent editing, duplication refusal, mixed human asks, serialisation and recovery. Add failing read/HTTP proofs for feature and anchor-scoped availability and P1/P3 projections.
2. Implement the narrow DTO and composer changes; prove human-only behaviour remains unchanged and unavailable Carl does not block messages.
3. Add failing presentation/browser cases for labelled answers, source wrapping, all turn states, reason privacy, access revocation, stale reads, keyboard/focus and original-operation recovery; implement the cards and refresh behaviour.
4. Once R8/U1 is settled, prove the warning against current source access before participant addition and the agreed alternative, without branching or general participant management.
5. Prove UI post through the existing worker to one persisted simulated answer with citations, including replay/reload and a mixed person ask. Keep mocked layout fixtures separate from persisted proofs. Use a non-production local-synthetic harness for enabled flows; compiled runs prove off-state and stored rendering without changing the production guard.
6. Inspect rendered 1440, 1024, 390 and 320 captures; verify keyboard, focus return, touch targets, scrolling and no horizontal overflow. Record observed departures and review status honestly.
7. Update live design/component/guide/contract records and entry CSV/status fragments. Run applicable assurance, full tracked-tree lint and unit tests, 8 GB typecheck, focused database/HTTP/browser proof and build. Run the full local database suite if backend changes or current rules require it. Preserve failed attempts and reconfirm relevant Windows baselines on unchanged current main.
8. Fetch and merge current main, rerun affected checks, push only this branch, inspect required CI including database/compiled groups, and leave the PR draft. Apply the current cross-model review rule without claiming an unavailable review or a waiver.

## Environment and evidence

Dedicated worktree from current origin/main, branch `codex/conversations-t2c-ui`; no shared-checkout edits, branch switching or stash. Node 24.22.0 and npm 11.19.0 satisfy the current engines (`>=24.21.0 <25`, npm 11.19.0), so ordinary `npm ci` was used. The private disposable PostgreSQL 16 cluster uses port 51427, database `ppo_synthetic_test`, and `max_locks_per_transaction=1024`. Heavy checks ran serially after checking host load.

The implementation is in draft PR [#660](https://github.com/deanrfiedler-gif/powerplants-one/pull/660). [Execution evidence](../testing/evidence/conversations-t2c/README.md) distinguishes completed checks, original failed attempts, unchanged-main Windows baselines and remaining CI/review requirements. No visual acceptance, review fingerprint, production readiness, deployment or business transaction is claimed.

## Approved amendment and implementation adaptations

The named version **Conversations T2 — W3 CRM Activity correction, approved** was saved and verified on 22 October 2026. Sixteen text nodes replace PO-2281 and matching purchase-order wording with CRM Activity · Supplier call. Source frame IDs remain unchanged. [Eight icon-free captures and hashes](../reference/ui/my-work/conversations-t2-w3-r01/README.md) were inspected; the File index and section label identify the accepted design and W3 correction. Historical versions and issued references remain intact.

The implementation keeps the current shell/context and follows P3 over historical partial-answer, broad-reason and automatic-retry illustrations. Source chips use validated citation numbers. People use stored names and Role not recorded. The private Kit provides sparkles; offline evidence uses a white AI mark. No separate accepted warning frame exists; its native modal and bounded copy implement Dean's confirmed R8/U1 interpretation. These adaptations do not grant implementation acceptance.

Observed Conversations CSS defects were repaired locally: surface/border/text aliases now resolve to white/line/ink, and the composer footer restores block layout and 14 px text instead of inheriting the generic site's flex/10 px footer. Geometry/colour assertions and inspected captures cover the repair.

A failing phone geometry test demonstrated the legacy picker appearing below the composer and behind bottom navigation. The thread picker now opens above the composer as drawn in the accepted T2 reference; the existing new-thread dialog uses an in-flow picker above its message field. A Close picker control adds touch dismissal with the same draft/caret/focus behaviour as Escape.

The compiled loopback launcher defaults to NODE_ENV=test. The compiled browser configuration therefore explicitly sets PPO_ASSISTANT=off and records off-state metadata. Historical-answer fixtures run the existing worker in a separate, explicitly non-production synthetic process; enabled UI-to-worker tests use the development harness. The assistant production guard is unchanged.

Node 24.22.0/npm 11.19.0 satisfy engines; ordinary npm ci installed 238 packages without override. Own PostgreSQL 16.15 cluster uses port 51427, ppo_synthetic_test, max_locks_per_transaction=1024 and disposable durability settings; server port 3147. [Execution evidence](../testing/evidence/conversations-t2c/README.md) records checks and limits. Claude review has not occurred; the T2b waiver is not reused.
