---
title: Calling core review corrections
date: 2026-10-24
---

Dean authorised correcting PR #673 and merging after reviews and checks pass. Correction PR #682 targets its Claude-owned branch from a separate Codex worktree. The [calling contract](../contracts/calls.md) retains CRM-02, CRM-03, NFR-01, NFR-02 and NFR-09.

The organisation lookup uses consecutive SQL parameters. Duplicate ingest checks event ownership and current party/activity visibility. Purged identities cannot be recreated or return old receipts through command replay. Event audit details no longer copy numbers, number IDs or skip reasons. Logging discards call facts from the event, leaving its activity link, opaque source deduplication key and ordinary receipt metadata; the unissued 0118 schema enforces that separation. The original parent review's six findings are covered by focused database regressions. Existing upgrade ledgers and grants are unchanged.

Validation and independent correction review are pending. This records code work, not business acceptance, production readiness, a phone/provider integration or deployment.
