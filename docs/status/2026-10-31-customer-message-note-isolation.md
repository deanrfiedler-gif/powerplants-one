---
title: Customer message action-note isolation
date: 2026-10-31
---

Codex claims finding 2 from the [independent EC-04 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/804#pullrequestreview-5722636703): cancelled withdrawal or reconciliation reasons must not become sending or approval notes. The dedicated correction branch `codex/customer-message-note-isolation` targets `codex/customer-messages` in a one-level stack. The parent branch is not edited.

Scope: isolate sending notes from action reasons, reset unsubmitted action reasons on dismissal/opening, and cover action switching through the existing synthetic browser fixture. Update the existing communications and EC-04 page contracts. Exact journalled operation replay stays unchanged. Other six review findings remain open; implementation, execution, independent review and acceptance will be reported separately. No merge or deployment.
