---
title: Customer message action-note isolation
date: 2026-10-31
---

Codex implements finding 2 from the [independent EC-04 review](https://github.com/deanrfiedler-gif/powerplants-one/pull/804#pullrequestreview-5722636703): cancelled withdrawal or reconciliation reasons must not become sending or approval notes. The dedicated correction branch `codex/customer-message-note-isolation` targets `codex/customer-messages` in a one-level stack. The parent branch is not edited.

[Draft correction PR #811](https://github.com/deanrfiedler-gif/powerplants-one/pull/811) separates the sending/approval note from the dialog action reason. Desktop and phone withdrawal open with a blank reason, as does reconciliation. Cancel, Escape and other dialog dismissal clear that unsent reason; they leave the sending note unchanged. The command body and required-field checks use the active action's own text. Exact journalled operation replay stays unchanged. The existing communications and EC-04 page contracts describe this distinction.

Validation on Node 24.22.1/npm 11.9.0: 11 focused units, TypeScript, focused ESLint, Studio, foundation, naming, status and whitespace checks passed. Locked installation used `npm ci --engine-strict=false --ignore-scripts`; no dependency changes. Studio reports 348 unreviewed and 26 stale entries, not acceptance.

Five added browser cases cover sending/approval-note isolation at 1440/320, cancelled and escaped withdrawal, required reason/approval gating, submitted command reasons and reconciliation dismissal. Playwright discovery lists 26 cases across desktop/mobile projects (13 per project); discovery is not execution. The Reviewed variant is a UI-only fixture, not native M4 source proof. Browser prerequisite failed because stable Chrome is absent at `/opt/google/chrome/chrome`; these new cases and existing uncertain-replay browser proof were not executed here. No database/HTTP suites, build, physical-device/assistive-technology or business acceptance ran for this local-state correction.

Claude's exact-head review and browser execution remain required. Other six #804 findings and CI/merge gates remain open. No merge, application visual acceptance or deployment.
