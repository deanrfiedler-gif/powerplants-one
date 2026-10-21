---
document_id: PPO-PL04-IMPLEMENTATION-DEC
title: Changes and follow-up implementation boundaries
date: 2026-10-21
owner: Dean Fiedler
status: Implementation interpretation of accepted design; owner visual review pending
---

# Changes and follow-up implementation boundaries

The [accepted PL-04 design](changes-follow-up-figma-design.md) is the design authority. This change uses synthetic records and existing permissions. It creates no migration, capability, dependency, production integration or customer communication.

D4 permits reconsidering a stale request after a fresh booking check. The older server rejected any changed schedule version before reaching that check. Dean was asked whether to implement D4 or retain the older refusal and replied, “Proceed however you believe is the most professional approach.” The implementation follows D4: remove only that unconditional refusal. Current appointment/request versions, work-order/scope authority, policy selection, original requested resource/calendar versions, competence, reservations and complete-crew validation still bind acceptance. A failed check preserves the existing booking. A pending request still reserves nothing.

Booking revisions and retained assignment identities supply named changes since the request. Missing historical details are unavailable, not inferred. The accepted-decision comparison uses the saved booking revision before the decision and its predecessor; a stale request basis is not the actual before state.

The grid uses the existing bounded, scoped Changes read. Counts use its selected-period/site population separately from an exact-appointment handover. Policy holds alone do not enter Needs review. Only Open and InProgress follow-up activities count as outstanding.

One read-only, repeatable-read detail projection combines appointment evidence with permitted pack and dispatch evidence. Existing pack permission and assignment boundaries remain in force. Unavailable evidence is labelled. P4 site readiness is explicitly gated and unconfirmed.

The existing publication, saved-record discovery and hold workflows remain under “Saved policy reviews, publication and holds”. Exact proposal/review/publication links open that disclosure. Their command authority and recovery contracts do not change.

The drawn selection checkbox and grid settings have no defined operation. They are omitted pending a defined use. Cancel request uses the shared keyboard-operable request menu and existing reason-required command. No additional confirmation dialog is drawn. The shared compact phone header supersedes the earlier phone shell; search/site/timezone use its filter sheet. No offline booking or request decision is added. Conversations is outside this change.

The saved policy editor, tablet snapshot and detailed uncertain-send screens are not drawn. Existing shared controls and unchanged-original retry remain. Code delivery, automated proof, design acceptance, owner visual review and deployment are separate. No different-model review is claimed; applicable pre-merge review remains outstanding.
