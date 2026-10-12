---
document_id: PPO-BACKUP-RECOVERY-EVD
owner: Dean Fiedler - prototype owner
status: Recovery review; selected contributions require their own validation and PR review
versioning: git
---

# Closed backup recovery review

Date: 12 October 2026 (Australia/Brisbane). Compared main `4228d470ca4c566a15e7c3397fc053b8f7bef4bc` with the five saved snapshots below. Dean closed their PRs and requested review for fresh recovery contributions, starting with #405. Closure is not merge or deletion authority for the saved branches. No backup branch is changed by this review.

## Disposition

| Backup | Saved source and changed files | Review result |
|---|---|---|
| [#405 — Excel import](https://github.com/deanrfiedler-gif/powerplants-one/pull/405) | `1b699b48563e29e9b9b12c7f2c6615575521c599`; seven files | Four parser modules and pinned dependencies are useful missing work. Recover as a separately tested source-reading library, with three reproduced parser corrections. The old decision must be bounded to this increment. No upload API, reconciliation, source storage, database save or complete import workflow is implied. Fresh recovery: [PR #437](https://github.com/deanrfiedler-gif/powerplants-one/pull/437), branch `codex/recover-backup-work-oct12`. |
| [#404 — Engineering](https://github.com/deanrfiedler-gif/powerplants-one/pull/404) | `2f5a4db9799486ce2783969bebf7a66f422dce39`; three files | Recover only the two verified documentation changes. The shell-heading correction already occurs in main and its history. The original test is not copied over newer shell work. |
| [#406 — Products](https://github.com/deanrfiedler-gif/powerplants-one/pull/406) | `0d5ca9ab7b738262c223a01e3b5f1b0b2d575fa5`; 136 files | No additional runtime recovery selected. Main's completed Products contribution retains the core implementation and adds revision-safe pricing/recovery, separate synthetic duties, source disclosure, updated registry bindings and current upgrade checks. The old 0049 SQL is byte-identical to main's 0052; never restore the obsolete registration. Older capture/document versions remain on the retained backup branch. |
| [#407 — CI](https://github.com/deanrfiedler-gif/powerplants-one/pull/407) | `ea873753c55427ab94e2ea5ba4437f56ad80a5d5`; six files | Every saved file blob is already reachable from main's history. Main has newer browser-read draining and responsive My Work readiness. No recovery PR needed. |
| [#408 — Maintenance/Warranty](https://github.com/deanrfiedler-gif/powerplants-one/pull/408) | `6dc1e4388d927ec4d27f8bbfd54f27232ce5f2ff`; 88 files | Every saved file blob is already reachable from main's history; 85 still match current main exactly. The remaining three documents have later integration updates. No recovery PR needed. |

## Method and limits

Compare each backup's single saved commit with its own parent to isolate the previously uncommitted changes. Compare resulting blobs with current main and with the objects reachable from main history. Counts describe exact content, not semantic acceptance:

| Backup | Changed files | Exact saved blobs already in main history |
|---|---:|---:|
| #404 | 3 | 1 |
| #405 | 7 | 0 |
| #406 | 136 | 54 |
| #407 | 6 | 6 |
| #408 | 88 | 88 |

A differing blob does not by itself identify missing behavior. For Products, the current [handover](../../../delivery/products-native-handover.md), [completion evidence](../products-native/README.md), source/component diffs and identical migration bytes distinguish later completed work from older code/captures. This review does not grant visual acceptance to either capture set. The 82 Products blobs absent from main history remain recoverable from the retained snapshot; no blanket deletion or replacement is proposed.

## Verified Engineering documentation recovery

The restored [Engineering ADR](../../../decisions/ADR-0047-engineering-native-control.md) adds the missing historical delivery checkpoint; the [handover](../../../delivery/engineering-native-control-handover.md) adds the final source-specific successful CI record and corrects the component catalogue count.

- GitHub [run 35941480105](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35941480105) is completed with conclusion `success` at source `9b72d7d37af9701b6bda136c4f9f0e3422a0b12b`. It ran on 24 September 2026. This verifies that historical run, not the current application tree.
- That exact source's `docs/design/development/components.json` has 25 entries: 19 Runnable, one Host example and five Reference only. The older handover's 24 count was stale.
- The source heading `Engineering workload & deliverables` is already present in main's shell test; the backup's test blob also occurs in main history.
- Only the two documentation files are recovered from #404. Stable parent IDs, issued reference bytes, application code and current review statuses remain unchanged.

`python scripts/check_naming.py` passed with 552 document records and no errors. `python scripts/check_foundation.py` passed with all 22 issued sources, 78 parent requirements and 8,480 checked local links; no errors. `git diff --check` passed. These are documentation checks, not current application or business acceptance. GitHub CI is tracked separately on the fresh PR. No code, migration, permission, framework, dependency, deployment or business-acceptance change is included here.
