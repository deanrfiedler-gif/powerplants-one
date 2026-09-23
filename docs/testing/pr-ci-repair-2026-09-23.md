# Open pull-request CI repair, 23 September 2026

Owner: Dean Fiedler. Scope: requested repair of failing open pull requests; component assurance only.

## PR #291: integrate the existing main fixes

The [compiled-browser run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35843320232) on `144b3230252d833eec29839ca12b20d6dd46ae1a` returned 313 passed, 52 skipped and two failures:

- PL01's second desktop journey clicked Plan visit before the independently loaded calendar settled. `openDemand` then found no Save proposal control. Main already waits for the calendar's complete-result text before clicking the demand card.
- ES-08's first mobile fixture reset encountered PostgreSQL `40P01` while a preceding SH page read still held locks. Main commit `e11e0b3` already drains routed fetches and current page traffic before SH teardown.

PR #291 predates both fixes. Merging main `5499df4` incorporates them without changing their assertions, deadlines, business commands or reset guards. DP-22 and the corrected local-database evidence remain intact. This is an integration repair, not a new application behaviour or a schema migration. See the [original failure investigation](evidence/cs-native-completion/README.md) for the inspected PL01 trace and bounded SH/ES-08 verification.

## PR #292: bounded diagnostic retry

[Diagnostic job 107137789433](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35847717020/job/107137789433), source `b2d7d8810a866695974897776b813a449d54a3aa`, timed out in the initial customer workspace read of the P11 mobile journey. It contains the correct `/workspace` observer. The saved lifecycle records navigation completing after 5,076 ms, the customer request starting about 7,270 ms after the observer, and the observer expiring at 15,045 ms. The test also deliberately delays the real customer response by 6,500 ms. The failure screenshot still shows Loading permitted records, not a rejected business command.

The equivalent diagnostic on #293 passed. A single unchanged-source retry is planned to distinguish transient runtime timing from a repeatable failure. GitHub refused the initial retry request because the containing workflow still had running jobs; it has not started. This does not establish a product fix or acceptance. Exact final results remain on the PR checks.

## Verification and limits

- Local `python scripts/check_foundation.py`, `python scripts/check_prototype.py` and `python scripts/check_naming.py`: all passed. Foundation checked 4,363 local links and all 78 parent requirements; `git diff --check` also passed.
- Fresh PR #291 CI: pending publication of the merge repair.
- PR #292 diagnostic retry: awaiting completion of the containing workflow; not yet started.
- PR #290 and #293 had no failed checks at inspection; their remaining jobs were still running.

The merged application, test, script, database, dependency and workflow bytes exactly match main `5499df4` (`git diff --quiet` passed). No fresh local application suite is claimed for this integration-only repair. Existing fixes retain their prior evidence; current-head CI supplies the new combined-source proof. No merge to main, deployment, production access or owner/business acceptance is performed.
