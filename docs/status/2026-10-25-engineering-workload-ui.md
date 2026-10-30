---
title: Engineering workload UI implementation in progress
date: 2026-10-25
---

Owner: Codex for Dean. This dedicated branch starts from current main `2ae6f23b` and claims the accepted EN-01 Engineering workload implementation at `/engineering`. Dean requested implementation, validation and PR publication; merging and deployment remain separate.

The [accepted design](../decisions/engineering-workload-design.md) and [BC-01 register backend](../decisions/engineering-workload-backend.md) govern this work. Current UI gaps are the legacy list read and client-only sorting, missing full-match menu counts and recorded-owner choices, accepted grid/snapshot/selection presentation, and complete source-change recovery and phone states. Native technical review and release authority remain unchanged. No migration, capability, grant or new dependency is planned.

Expected shared edits are narrow Engineering entries in the existing API/native-control contracts, page/component/guide registers and their specifications, existing Engineering evidence chapter and this fragment. Other open UI claims are preserved. Implementation, functional proof, paired application captures, visual review and owner acceptance are pending. No deployment or business acceptance is claimed.
