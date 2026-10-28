---
title: Keyboard date rollover repair and bounded build exception
date: 2026-10-29
---

## Ownership and scope

Dean selected option 1 at 22:15:06 UTC on 28 October 2026, authorising one extra, narrowly scoped test-only PR for the reproduced month-end keyboard helper defect. This contribution uses that one-off exception to the [three-build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit); the standing limit remains unchanged. Owner: this Codex keyboard-date-rollover session. Worktree/branch: `codex/keyboard-date-rollover`, based on main `af079a2f11abb8e5c80d184d99ba0029702cee47`.

The [diagnostic on #738](https://github.com/deanrfiedler-gif/powerplants-one/pull/738#issuecomment-6481548664) reproduces October 30 plus three days as October 2 instead of November 2. Scope: `tests/helpers/quality-keyboard.ts`, focused browser regression coverage, the existing P11 test-evidence chapter and this status fragment. Preserve keyboard interaction, exact date assertions and existing callers. Application code, permissions, migrations and other contributors' branches are outside this repair.

## Verification

Initial coordination claim only. Implementation, regression proof and final-head CI are pending. No independent review, merge, deployment, visual acceptance or operational acceptance is claimed.
