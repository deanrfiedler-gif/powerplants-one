# PJ-06 work-evidence execution evidence

Owner: Dean Fiedler. Synthetic only. Implementation, local validation, CI, independent review, human acceptance and deployment are separate.

Source: main `1552cfbb8efd6cea17438c2af18ba0effa4fc278`; #518 `708c6da`; #522 `459112db197e8f1b87c2c3e6591284c509a386c6` are still unmerged. This separate R3 branch depends on the exact accepted R2 handover and leaves #522 with its existing monitor. The competing PR-repair task owns its own branch; no concurrent writer owns this worktree.

The [decision](../../../decisions/project-specialist-work-evidence.md) was committed before implementation. The [contract](../../../contracts/project-specialist-work-evidence.md) records bounded scope, authority, source checks and remaining work. Live migration-0104 constraints and immutable triggers were inspected before adding 0105; private schema dump retained outside Git. No existing schema history, seed, grant, receipt or payload was rewritten.

Draft [PR #530](https://github.com/deanrfiedler-gif/powerplants-one/pull/530) contains this increment. Verification is in progress. Initial typecheck identified the missing existing-client capability label; it was added without changing any UI layout, and the pinned application build and full lint then passed. Targeted units and the generated AD-01 model passed. Full pinned units were 854/857; the same three document-store/recovery Windows path-guard failures reproduced in the unchanged `1552cfb` control (1/4 relevant tests passed). This is a baseline limitation, not a green full unit run.

Four populated upgrades passed before the review correction: historical 0025 with estimates across 0026, 0102, 0103 and 0104 to 0105. Reserved Products installation after histories 0104 and 0105 passed, retaining exact original rows/ledgers and repeat-run stability. Foundation, naming and Studio assurance passed; existing unreviewed/stale visual records remain separate.

The first independent review of `def746c` reported two database-level findings: missing deferred operation evidence and incomplete positive source guards. Direct-write regression tests reproduced an eventless record and an acceptance without operation evidence. Both are being corrected in 0105, preserving historical migration bytes. The review threads remain open until the resulting source is independently assessed. CI remains queued; no pending or skipped check is counted as a pass. Private environments, sessions and checkpoints are not publishable evidence.

Original local failures are retained privately: the closed-context fixture initially omitted native Project version/event evidence; its corrected exact schedule event passed. The byte-corruption test initially assumed an explicit storage-directory environment value, whereas the native store also supports its private default. A first review-regression run caught an incorrect SQL table name during migration setup; it is a candidate defect, not a baseline attribution. No assertion, test coverage or deadline was weakened. Final native, compiled HTTP, restart and amended-upgrade results will be recorded after execution.

Supplier identity/competence/insurance, downstream disposition, UI, operational acceptance and full PJ-06 remain open. No merge, deployment or external transaction.
