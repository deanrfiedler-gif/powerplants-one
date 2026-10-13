# Document contribution integration evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. User-authorised conflict repair and merge on 13 October 2026. Synthetic verification, owner acceptance and deployment remain separate.

## Source and resolution

- Main: `5eb55f0`; Output Register #468: `0d61a943`; Output Actions #469: `54a4d1b5`; Template Catalogue #471: `b524ea63`. All are retained by ancestry in the combined #469.
- Conflicting status and completion-plan additions are retained. Generated build sequence is refreshed from the combined register; existing review fingerprints and issued references are unchanged.
- Published CPQ 0089 and Document Library 0090 retain their exact bytes. Output Distribution becomes 0091 with identical SQL. Original full-row ledgers, exact added versions, Products 0052 after 0091 and populated library/CPQ/calendar histories remain checked. The hosted gate is reviewed for the two empty distribution tables, native guard and three additive outbox kinds; no new grants or seeds.

## Reproduced CI faults and correction

[468 HTTP failure](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38347275981/job/115135553282) reports `BookingBlocked` while its fresh-fixture helper confirms a booking already changed by another HTTP file. [471 HTTP failure](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38374166693/job/115218241630) reports eight failed cases and missing business tables during the catalogue test's database reset. The actions HTTP file also resets between its two cases. These tests passed alone in their dedicated jobs but cannot share their database concurrently.

`scripts/http-suite.ts` discovers every HTTP test, runs the ordinary files with their existing concurrency, waits for completion, then resets and runs each exclusive document proof separately. It propagates failures and signals. Original test bodies, complete business snapshots, exact total counts, permission checks and deadlines are unchanged. This preserves the broad suite and the dedicated workflow coverage.

## Verification

The combined source is under verification. Initial local TypeScript identified the still-pinned registry latest version and a stale shared dependency folder; the version is reconciled to 91 and the existing lockfile-matching dependency installation is used. No package or dependency version changed. Final local checks and fresh GitHub CI are recorded below when completed. No passing result is inferred from earlier heads.
