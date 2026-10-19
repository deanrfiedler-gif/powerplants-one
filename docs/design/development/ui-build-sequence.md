# UI build and review sequence

The sequence is derived, not stored. Generate it from the live register when you need it:

```sh
python3 scripts/build-ui-sequence.py
```

It writes `tmp/ui-build-sequence.md` and `tmp/ui-build-sequence.json` (both ignored by Git) from [`register.json`](register.json) and the r02 build plan issued in the r05 App Page Register. To move an entry, change its register record; never edit the output. The rules (SD-01 to SD-05) and the departures from r02 are in [the decision record](../../decisions/ui-build-sequence.md).

Until 19 October 2026 both outputs were committed here and every pull request that changed the register regenerated them. Each output carries the register's hash and totals, so every design pull request conflicted with every other one. They are no longer committed ([why](../../decisions/merge-conflict-reduction.md#5-design-pull-requests-no-longer-share-generated-or-appended-files)). `python3 scripts/build-ui-sequence.py --check` derives the sequence and writes nothing; `scripts/check_foundation.py` runs it, so a register entry that cannot be placed in a phase, or a synthetic-job step that names a missing entry, still fails the Documentation assurance job. Git history keeps the last committed copy (`git show 9dad9aa5:docs/design/development/ui-build-sequence.md`).
