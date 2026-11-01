# Engineering workload UI execution — 1 November 2026

PR #707. EN-01 / ENG-01–ENG-04. Dedicated branch `codex/engineering-workload`, starting from preservation `02355d3b` and integrated main `5c533e93`. Synthetic fixtures only. This ledger records execution, not owner acceptance.

## Current execution

Validation is in progress. The first full 8 GB typecheck and all five focused register unit tests pass. Chrome 156.0.8078.80 passes the repository browser check. The first database run fails during fixture setup in `site_timezone()` while enumerating `pg_timezone_names`; unmodified-main comparison is pending. An initial focused lint failure in stale-read recovery is corrected and awaits rerun.

## Required proof

- Native all/mine/author/review/released queues and attention, scoped counts and filters beyond one page.
- Server Reference and missing-date ordering, stale continuation and inactive recorded owners.
- Source restrictions, late scope revocation, exact-package links, selected CSV and sequence revalidation.
- Existing request, version conflict and uncertain-note recovery.
- Loading, empty, denied, partial technical read, refresh/error recovery, keyboard and 320 px reflow.
- Application/reference comparison at 1440, 1024, 390 and 320 px.

## Status boundaries

Functional validation: in progress. Application image comparison: pending. Independent Claude review: pending exact published head. Owner visual/business acceptance: not recorded. Deployment: not performed.

The accepted design references are [retained separately](../../../reference/ui/engineering/engineering-workload-design-r01/README.md). Their icon-free PNGs are immutable. New captures will use synthetic fixtures and the application's public fallback icons; no Font Awesome Pro artwork or private file identifier is retained.
