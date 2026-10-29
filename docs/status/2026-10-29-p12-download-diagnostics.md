---
title: P12 download diagnostic follow-up claim
date: 2026-10-29
---

Owner: Codex P12 investigation continuation for Dean, on dedicated branch/worktree `codex/p12-download-diagnostics` from main `dc32160b5bd9e25e87d22484d841ad52f6f0452e`. This is an early claim, not an implemented correction.

Post-merge Application run `40954630565`, database-1 job `123731402229`, failed one P12 recovery case while 282 other database cases passed. The existing safe marker reports `download`, 38,644 elapsed milliseconds and category `error`. That phase spans the download-button click and saved-context confirmation; it does not distinguish them or establish root cause.

Proposed scope: `scripts/offline-restart-proof.ts`, `tests/helpers/p12-write-diagnostics.ts`, `tests/unit/p12-write-diagnostics.test.ts`, the existing P12 handover and this fragment. Distinguish click completion from confirmation with fixed non-sensitive diagnostics. Preserve existing assertions, deadlines, production behavior and private subprocess-output suppression. No raw notice text, identifiers, URLs, profiles or exception messages will be published.

Open claims were checked before starting. No separate P12 implementation claim was found; #733 and #738 retain their Codex test streams, while merged #743 frees this continuation's slot. Guide-security and other candidates retain their owners. Local full P12 execution remains limited by unavailable supported Chrome; its installation restriction will not be bypassed. Independent review and exact-head CI are required before any readiness claim. No merge or deployment is included.
