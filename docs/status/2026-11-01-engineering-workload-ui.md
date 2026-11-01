---
title: Engineering workload EN-01 implementation and validation
date: 2026-11-01
---

PR #707 resumes the 24 October claim from preservation commit `02355d3b` and merges current main. Dean explicitly authorised an exception to the three-build limit for this PR on 1 November; all other repository and merge gates remain.

The accepted register replaces the tab/card/drawer composition at `/engineering` with the Engineering menu, compact toolbar, grid, snapshots, selected-package panel and phone list. Rows, full matching counts and recorded-owner choices use the native register read. Reference ordering is added to the server sort. Source changes invalidate incompatible continuation and selection; CSV and sequence handovers recheck the permitted source. Inactive recorded owners remain filterable without becoming assignable. Native package commands and technical review/release authority remain unchanged.

The [route contract](../design/development/pages/route-engineering.md), [scope contract](../design/development/pages/scope-en-01.md), [read contract](../decisions/engineering-workload-backend.md), guide and isolated component bindings are updated together. The rewritten guide remains InReview and its carried-over visibility exemption is retired; general users see the guide fallback until content-owner publication.

**Validation is in progress.** Full typecheck, lint, studio, foundation, naming and status checks have passed before the latest review fixes. The selected unit suites pass 64 tests, HTTP passes both register cases, and all six register database cases pass. Four native control cases pass; two fail in existing timezone validation and are being compared with unmodified main. The first desktop captures have been inspected and their styling differences corrected; the four-width browser proof remains in progress. Claude's preliminary read-only review found navigation, retry, search and badge issues that are being corrected and tested. The [UI execution ledger](../testing/evidence/engineering-workload/2026-11-01-ui-execution.md) records the actual execution and separate pending statuses.

Implementation, functional proof, application visual review, owner acceptance and deployment are separate statuses. No migration, grant, capability or dependency is added. No visual acceptance, owner acceptance, merge or deployment is claimed.
