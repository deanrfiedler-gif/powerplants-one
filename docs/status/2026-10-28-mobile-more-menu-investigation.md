---
title: Independent mobile More-menu investigation
date: 2026-10-28
---

Owner: Codex for Dean. Separate branch `codex/mobile-more-menu-readiness`, cut from main `f2e6932a44ee68708e1e5babee8978f5d8a0b32f`. This investigation does not modify PR #731 or its technician History correction.

Scope: reproduce the intermittent phone More-dialog failure reported in PR #731's P06 browser-mobile job and the related Planner/Reports journeys; distinguish page readiness, opener replacement, menu state and event handling using real browser interaction. Preserve keyboard, focus and accessible-dialog assertions; no arbitrary sleeps, repeated clicks or expanded deadlines.

Expected files: `tests/helpers/phone-menu.ts`, a focused regression under `tests/browser/`, this status fragment, and, only if reproduction supports an application defect, the shared shell implementation and its existing design documentation/component consumer note. No migration, permission, dependency or workflow changes are planned.

At claim time the CI failure is verified, but its cause and correction are not. The implementation will be determined by controlled reproduction. No passing regression or acceptance result is claimed.
