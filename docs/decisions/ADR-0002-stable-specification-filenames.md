# ADR-0002 — Stable working specification filenames

**Status:** Applied repository convention under the requested package/naming review. **Date:** 5 September 2026. **Related:** D-003/D-029; DEV-03.


> **Update — 5 September 2026:** [ADR-0005](ADR-0005-project-naming-adoption.md) supersedes the specific working-master path and external STD-001/GEN provisions below. Current master: [BP-01](../blueprints/BP-01-master-blueprint.md). Independent naming authority: [PPO-STD-001](../standards/naming-conventions.md). The stable-file and preserved-baseline principles remain in force. The text below records the earlier decision.

## Context

The user asked whether `GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md` should become `GEN_SPC_PPABusinessPlatform_MasterBlueprint.md` because GitHub tracks changes. Stable working paths reduce link churn as the specification evolves. Issued evidence still needs a recoverable identity and must not be confused with later working edits.

## Decision

Use `docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint.md` for the working master. Initially preserve its content byte-for-byte from v02. Retain the exact issued v02 baseline at `docs/reference/baselines/GEN_SPC_PPABusinessPlatform_MasterBlueprint_v02.md`, protected by the source manifest's original SHA-256 and byte count. Original history also remains at commit `0ae933be366ecdab053c853239c0766094bf293b` under the former path.

Use stable descriptive paths for working BP-02/BP-07/contracts/plans and internal edition/date/status metadata. Commits and PRs record changes. Future formal issue/export snapshots retain an explicit edition under STD-001 and record a commit/hash. A GitHub release/tag may later identify an issued package; none is created or implied here.

## Alternatives

Version in every working filename preserves visible editions but requires widespread link updates and encourages competing current files. Git history only is leaner, but this repository already validates local issued-source bytes and derives registers from that baseline. Keeping one explicit frozen source snapshot preserves that offline assurance without fetching historic Git objects for every check.

## Consequences

Update active indexes, source links, issue references and the validator. Parent registers continue deriving from the frozen issued v02; future master scope amendments need deliberate register/traceability reconciliation. Working-master changes are permitted through normal review; frozen baseline bytes remain unchanged.

Git records committed changes; it does not automatically save uncommitted edits or synchronise uploaded ChatGPT copies. File rename/history behaviour is supported by GitHub's file/history tools. See [GitHub file history](https://docs.github.com/en/repositories/working-with-files/using-files/viewing-and-understanding-files) and [renaming files](https://docs.github.com/en/repositories/working-with-files/managing-files/renaming-a-file).

This convention does not remove revision numbers from issued quotations, technician packs, reports or other business evidence. GEN remains provisional and SOL008 remains the separate PPA Smartsheet Delivery System reference.
