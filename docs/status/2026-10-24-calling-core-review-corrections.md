---
title: Calling core review corrections
date: 2026-10-24
---

Dean authorised correcting PR #673 and merging after reviews and checks pass. Correction PR #682 targets its Claude-owned branch from a separate Codex worktree. The [calling contract](../contracts/calls.md) retains CRM-02, CRM-03, NFR-01, NFR-02 and NFR-09.

The organisation lookup uses consecutive SQL parameters. Duplicate ingest checks event ownership and current party/activity visibility. Purged identities cannot be recreated or return old receipts through command replay. Event audit details no longer copy numbers, number IDs or skip reasons. Logging discards call facts from the event, leaving its activity link, opaque source deduplication key and ordinary receipt metadata; the unissued 0118 schema enforces that separation. The original parent review's six findings are covered by focused database regressions. Existing upgrade ledgers and grants are unchanged.

Claude Opus 5.5 independently reviewed correction d943b96f and confirmed the six original production defects fixed. Its blocking finding was a regression test expecting RecordUnavailable when the entire activity.read duty was removed; the expected result is Forbidden. The follow-up tests distinguish duty loss from a hidden Internal activity and check receipt authority too. Additional findings led to corrected replay-error documentation, removal of duplicated facts from the LogCall activity audit, both sides of the event-shape constraint being tested, and an explicit limit on the unkeyed digest's privacy guarantee.

Claude's independent [follow-up at a5145c45](https://github.com/deanrfiedler-gif/powerplants-one/pull/682#pullrequestreview-5636363301) found no actionable findings and closed the prior review points. That reviewer inspected committed code only and ran no tests.

Author validation at the same executable head passed all 26 focused calling database tests: logging, events, lookup, numbers and populated 0117-to-0118 migration preservation. Typecheck, affected-file lint, status sources, documentation scope and diff checks passed; foundation retained all 78 parent IDs and migration numbering passed. The first local database attempt exceeded the unchanged 120-second limit and remains a failed attempt. The later passing run used the task-owned PostgreSQL 16.15 cluster with shared_buffers=128MB, matching CI; the earlier timeout's cause is unconfirmed. No assertion or timeout was relaxed.

Initial CI documentation, register, UI-baseline and merged-tree checks passed. The full CI runs are deferred until the separately authorised Zod security fix #683 lands, then final integration will run fresh checks. This records code work, not business acceptance, production readiness, a phone/provider integration or deployment.
