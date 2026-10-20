---
title: Service review and reports accepted-design build
date: 2026-10-20
---

Draft PR #633 implements the [accepted Service review and reports design](../decisions/service-review-figma-design.md): the bounded 200-report grid and queues, large snapshot, tabbed report, inline exact review and existing FI-07 customer response. The register, page contracts, guides and component consumer bindings are updated together. Existing evidence, review, issue and exact-response commands remain authoritative; no migration, capability, dependency or customer sending is added.

Synthetic UI checks cover desktop, tablet, 390/320 px, read states, view-only controls, retained review input and exact response refusal. [Verification and limitations](../testing/evidence/service-review-build/README.md) separate these fixture checks from persisted database proof. Local database access was refused; Windows unit/build limitations were compared with untouched main. CI and native owner visual review remain pending. This records draft code delivery, not business acceptance, deployment or production readiness.

CI at `1434b482` exposed the phone footer covering the technician-evidence handover in P09/P11. The layout now reserves the footer's height outside the tab scroller; an added regression checks action and view-only states at 390/320 px without forced clicks. The complete synthetic page fixture run passed 12/12 after the fix. Persisted CI reruns and owner visual review remain pending; the PR stays draft.
