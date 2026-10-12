---
document_id: PPO-010-EXCEL-PARSER-EVD
owner: Dean Fiedler - prototype owner
status: Parser recovery validation; full workflow and owner acceptance pending
versioning: git
---

# Excel workbook parser recovery evidence

Date: 12 October 2026 (Australia/Brisbane). Recovery base: main `4228d470ca4c566a15e7c3397fc053b8f7bef4bc`. Retained source: closed [backup PR #405](https://github.com/deanrfiedler-gif/powerplants-one/pull/405), snapshot `1b699b48563e29e9b9b12c7f2c6615575521c599`. The original branch and snapshot are unchanged. [Decision and scope](../../../decisions/excel-estimate-import-native.md); parent PPO-010, EST-02–EST-05, EST-07/08 and DOC-01/02.

## Review and correction

The backup provided four parsing modules, dependency pins and an unfinished implementation decision. There was no native import route, service, migration or parser test suite. Recovering the entire intended workflow is a separate increment.

| Reproduced original defect | Corrected behavior |
|---|---|
| A string-typed formula without a cache could become blank and disappear from an otherwise empty row. | A missing cache is refused for every formula type. An explicit cached empty string remains a legitimate reserved-row value. |
| An invalid `date1904` value silently acted like the 1900 date system. | Only the declared Boolean forms are accepted, duplicate workbook property declarations are refused, and the unsupported 1904 system is refused explicitly. |
| A relationship could point at a part whose declared content type described something else. | Each permitted relationship type must match the effective content type of its target. |

All three negative cases failed with “Missing expected rejection” against the original backup modules. The corrected parser passes them. No original fixture or issued source was changed to obtain a pass.

## Executed verification

- `node --import tsx --test tests/unit/excel-workbook-reader.test.ts`: 45 tests passed, zero failed or skipped. Fixtures independently construct stored/deflated ZIPs, data descriptors and OOXML from the retained synthetic r01 dataset. They check all 12 lines, seven sections, 17 metadata keys, exact cached values, Boolean/blank/zero distinctions, hidden rows, formula provenance, source SHA-256 and actual table locators.
- Adversarial coverage includes CRC/local-index/descriptor disagreement, truncated/encrypted archives, duplicate/traversing paths, archive/expansion/entry bounds, missing/external relationships, unsupported parts, XML entities/encoding/depth/element limits, duplicate cells/rows/tables, unsupported dates, invalid cache types, exact headers and the 100-line limit.
- Runtime pins: `yauzl` 3.4.0 and `fast-xml-parser` 5.11.1, both MIT according to npm metadata. The latter already existed at this exact version transitively; it is now explicit. `@types/yauzl` 3.4.0 is development-only. `npm ci --no-audit --no-fund` installed the lockfile into this task's isolated worktree; the shared checkout dependencies were unchanged.
- `node node_modules/typescript/bin/tsc --noEmit` and targeted ESLint over the four recovered modules and two new fixture/test files passed. Prettier formatted those six TypeScript files.
- The complete local unit run, using `--test-concurrency=2`, passed 727 of 730 tests, including all 45 parser tests. The three failures were the two P06 tests in `tests/unit/document-store.test.ts` (`ExactDocumentUnavailable`) and the P12 path test in `tests/unit/recovery.test.ts` (expected `outside Git`, received `Unsafe recovery directory`). Running those two unchanged files from a clean, detached checkout of main `4228d470ca4c566a15e7c3397fc053b8f7bef4bc` on the same Windows host reproduced all three failures with the same errors; its fourth test passed. This is a recorded local baseline limitation, not a passing full unit suite. No storage/path guard or existing assertion was weakened.
- `python scripts/check_naming.py` and `python scripts/check_foundation.py` passed: 553 document records, all 22 issued sources and 78 parent requirements retained, 8,481 local links checked, no reported errors. `npm run studio:check` passed for 358 entries, 204 routes and 42 components. Existing unreviewed/stale design status remains visible; this recovery grants no visual acceptance.
- `npm audit --omit=dev --json` reports existing findings affecting `next` (critical), `sharp` (high) and `source-map-js` (high). A separate `--package-lock-only` audit of unchanged main's package files returned identical vulnerability details for all three packages. Neither newly direct runtime parser dependency was reported as vulnerable in this audit. These existing findings remain unresolved; this recovery does not upgrade unrelated framework dependencies.
- `git diff --check` passed. GitHub CI results are tracked on the fresh PR; local execution is not a claim that CI, database, browser or build checks have passed.

## Limits and next work

This reads source evidence; it does not validate business eligibility or reconcile money. For example, a populated row with a missing line reference remains visible for later validation, and raw numeric dates remain raw. Stable internal IDs, decimal/date mapping, context/authority checks, whole-file reconciliation, review, durable original storage, atomic estimate commits, immutable sidecars and receipt recovery are not implemented here. No route imports this library yet. Parser success must never be treated as permission to save an estimate.

The original delivered XLSX is not stored in this repository. These independently generated fixtures are not a replay of that binary or native Excel compatibility proof. The existing [XI-01–XI-08 acceptance](../../../contracts/excel-estimate-import.md#9-observable-acceptance-for-implementation), operational workbook compatibility, UI/visual review, owner acceptance and deployment remain separate and incomplete. No database/browser acceptance is claimed for this library increment.
