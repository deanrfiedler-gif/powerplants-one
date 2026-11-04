---
title: P12 download diagnostic follow-up
date: 2026-10-29
---

Owner: Codex P12 investigation continuation for Dean, on dedicated branch/worktree `codex/p12-download-diagnostics` from main `dc32160b5bd9e25e87d22484d841ad52f6f0452e`. Draft #747 owns this diagnostic-only continuation.

Post-merge Application run `40954630565`, database-1 job `123731402229`, failed one P12 recovery case while 282 other database cases passed. The existing safe marker reports `download`, 38,644 elapsed milliseconds and category `error`. That phase spans the download-button click and saved-context confirmation; it does not distinguish them or establish root cause.

Changed scope: `scripts/offline-restart-proof.ts`, `tests/helpers/p12-write-diagnostics.ts`, `tests/unit/p12-write-diagnostics.test.ts`, the existing P12 handover and this fragment. Distinguish click completion from confirmation with fixed non-sensitive diagnostics. Preserve existing assertions, deadlines, production behavior and private subprocess-output suppression. No raw notice text, identifiers, URLs, profiles or exception messages will be published.

Open claims were checked before starting. No separate P12 implementation claim was found; #733 and #738 retain their Codex test streams, while merged #743 frees this continuation's slot. Guide-security and other candidates retain their owners. Local full P12 execution remains limited by unavailable supported Chrome; its installation restriction will not be bypassed. Independent review and exact-head CI are required before any readiness claim. No merge or deployment is included.

The implementation keeps `download` before the original click and records `download-confirmation` only after it resolves, before the original saved-context assertion. A small callback helper retains ordering, single execution and exact rejection; the original outer catch retains first-failure classification. The marker schema and private-output guard are unchanged. Twelve focused tests pass locally. They exercise synthetic callbacks and leakage guards, not the full browser/restore procedure. Local TypeScript, targeted ESLint, foundation/link, status, documentation scope and whitespace checks also passed. This restarted environment uses Node 24.19.0/npm 11.9.0, below the repository pins of Node 24.21.0/npm 11.19.0; pinned-runtime validation belongs to CI. Independent review and exact-head CI remain pending; root cause is unresolved. See the [P12 handover](../delivery/p12-handover.md#download-click-versus-confirmation--29-october-2026).
