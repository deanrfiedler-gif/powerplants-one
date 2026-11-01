# Engineering workload UI execution — 1 November 2026

PR #707. EN-01 / ENG-01–ENG-04. Dedicated branch `codex/engineering-workload`, starting from preservation `02355d3b` and integrated main `5c533e93`. Synthetic fixtures only. This ledger records execution, not owner acceptance.

## Current execution

Validation is in progress. Implementation checkpoints include `fd6dfb63`, `c69c047f`, `5b9f89f1` and `569ce5a3`, with merge `211cc07c` of main `26deea85`. The optimized build at `5b9f89f1` passed; the final tablet-boundary build and repeat checks are running.

| Check | Executed result |
|---|---|
| Full 8 GB typecheck, full lint, studio:check | Pass after review fixes and the current-main documentation merge; final CSS-only boundary correction is rebuilding |
| Foundation, naming, status sources | Pass; final documentation repeat pending |
| Focused register, guide library/parity and UI baseline units | 78 pass, including all five register unit cases and the development-workspace suite |
| Register HTTP checks against local dev and compiled servers | 2 pass: native coordination, full counts, Reference sort, stale continuation, identity/scope/query/method denials |
| Register database suite with the local timezone warm-up | All 7 cases pass across two invocations (six original cases plus the native positive queue lifecycle): 101 rows and full counts/filtering/Reference order across pages; missing dates; inactive recorded owners versus assignment eligibility; bound continuation; scope restrictions; late revocation |
| Native control suite in the same run | 4 pass, 2 fail in the existing site timezone validation with PostgreSQL 57014; both reproduced on unmodified main `5c533e93` |
| Browser journey | Latest replay: 8 pass, 3 intentionally skipped duplicate journeys. Paging/counts, stale reset, selected CSV/sequence, denied/partial reads and native saves pass. The added 768 px boundary check found a 767/780 px mismatch; all rules now use the verified shared 780 px threshold, with final replay pending. The required four-width comparison passed before this additional boundary check. |
| Chrome compatibility | Chrome 156.0.8078.80 with Playwright 1.64.1 passes browser:check |

The disposable PostgreSQL 16 server is bound to loopback port 55477, uses only `ppo_synthetic_test`, UTF-8 and `max_locks_per_transaction=256`. A temporary preload warms the native timezone catalogue before restoring the application query timeout to 10 seconds. The database suite setup deadline is 900 seconds on this host. No application permission, business assertion, schema, timezone rule or runtime query limit is relaxed. Both failing control cases were rerun from unmodified main `5c533e93` with the same isolated database and setup. Both reproduced PostgreSQL 57014 in `site_timezone()` while creating a fixture Site, before their intended control assertion. These are confirmed baseline/environment failures, not passing tests. The added native queue lifecycle reuses the existing synthetic Site and passes through author work, assigned review, formal issue and source withdrawal without weakening any rule.

The initial browser attempts exposed and corrected an actual blank-owner query bug. Browser/visual proof also corrected the selection panel covering pagination, a clipped phone reference header, phone sheet spacing and a breakpoint mismatch with the shared phone header. The first inspected captures exposed and corrected menu label wrapping, rail badge contrast and selection action styling. Earlier connection/setup failures and intermediate JSX/lint failures are retained in the local execution logs; they are not passing proof.

Node 24.22.2 and npm 11.19.0 satisfy the repository pin. Dependency installation used `npm ci --no-audit --no-fund`; no engine-strict override was needed. The Windows `python` executable (3.14.7) is used for the required Python checks because this host's `python3` alias is unavailable.

## Required proof

- Native all/mine/author/review/released queues and attention, scoped counts and filters beyond one page.
- Server Reference and missing-date ordering, stale continuation and inactive recorded owners.
- Source restrictions, late scope revocation, exact-package links, selected CSV and sequence revalidation.
- Existing request, version conflict and uncertain-note recovery.
- Loading, empty, denied, partial technical read, refresh/error recovery, keyboard and 320 px reflow.
- Application/reference comparison at 1440, 1024, 390 and 320 px.

## Status boundaries

Functional validation: final replay in progress. Application image comparison: desktop and phone list/snapshot/selection captures inspected, with final capture publication pending. Independent Claude review: preliminary defects assessed and fixed or answered; exact published-head review pending. Owner visual/business acceptance: not recorded. Deployment: not performed.

The accepted design references are [retained separately](../../../reference/ui/engineering/engineering-workload-design-r01/README.md). Their icon-free PNGs are immutable. New captures will use synthetic fixtures and the application's public fallback icons; no Font Awesome Pro artwork or private file identifier is retained.
