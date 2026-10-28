---
title: Keyboard date rollover repair and bounded build exception
date: 2026-10-29
---

### Ownership and scope

Dean selected option 1 at 22:15:06 UTC on 28 October 2026, authorising one extra, narrowly scoped test-only PR for the reproduced month-end keyboard helper defect. This contribution uses that one-off exception to the [three-build limit](../decisions/parallel-contribution-rules.md#amendment--26-october-2026-codex-build-limit); the standing limit remains unchanged. Owner: this Codex keyboard-date-rollover session. Worktree/branch: `codex/keyboard-date-rollover`, based on main `af079a2f11abb8e5c80d184d99ba0029702cee47`.

The [diagnostic on #738](https://github.com/deanrfiedler-gif/powerplants-one/pull/738#issuecomment-6481548664) reproduces October 30 plus three days as October 2 instead of November 2. Scope: `tests/helpers/quality-keyboard.ts`, focused browser regression coverage, the existing P11 test-evidence chapter and this status fragment. Preserve keyboard interaction, exact date assertions and existing callers. Application code, permissions, migrations and other contributors' branches are outside this repair.

### Verification

Draft [PR #741](https://github.com/deanrfiedler-gif/powerplants-one/pull/741) changes only the keyboard test helper, its focused regression spec and documentation. Native segmented day edits do not carry into another month. The repair temporarily selects day 1, edits year/month through observed keyboard segments, restores the destination day and tabs out; exact final-value assertions remain. The old touch-only fill fallback is removed, so unavailable keyboard editing fails explicitly.

Local Linux/Node 24.21.0/npm 11.19.0/Playwright 1.64.1 results: the original October case fails on both desktop and mobile emulation with Chromium 151.0.7922.173; the corrected 15 literal calendar cases pass on both profiles with reviewed Chrome 156.0.8078.73 (30/30). Chrome was downloaded from the official stable Debian package and extracted into a task-private temporary directory; a temporary uncommitted Playwright config selects that executable and omits the unrelated app server/warm-up. These native-input tests do not claim complete P11 execution or physical-device acceptance.

Full local unit suite: 1265/1266 pass. The unchanged P12 recovery-path test expects an owner-only rejection but this managed environment exposes `/tmp/.git`, so its earlier outside-Git guard rejects first. The same failure reproduces in the unchanged baseline recovery test and implementation at #738 head `4ac54ab91d78481a4b14c57930804d1aca62c648`; both files are identical to main. Full lint, TypeScript, production build, foundation and status checks pass locally. The initial claim used invalid level-two status headings; these are corrected here to level three. Final-head CI and genuinely independent review are pending. No PR approval, merge, deployment, visual acceptance or operational acceptance is claimed.
