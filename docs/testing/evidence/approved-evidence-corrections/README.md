# Approved time and material correction evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution: 10 October 2026 (Australia/Brisbane). Independent review and owner acceptance pending. This is synthetic backend execution, not a browser, hosted, physical-device or live ERP proof.

## Sources and execution

Main base: `8d3b5093b8561ef2c75374621be9143ae49aadd4`. Test: [approved-evidence-corrections.test.ts](../../../../tests/database/approved-evidence-corrections.test.ts). The existing fixture commands capture initially unsubmitted entries, save a completion draft, submit and approve the exact Service report, issue retained output, and separately allocate/approve the Finance handoff. The processed branch additionally completes the synthetic target and reconciliation. The implementation of `ppo.invalidate_finance_source()` was inspected in the running fully migrated database; no migration or application code is changed.

Initial test checkpoint `808d1a6d31ea59cdfae85c1b06b240a64794fe53` stopped both cases before their assertions: the new preservation helper incorrectly assumed every table had an `id` column. The repaired helper compares complete JSONB rows and also covers composite-key evidence. A preliminary type check also identified one missing `SourceEntry` annotation, fixed before the first test checkpoint. These are test-driver defects, not demonstrated application regressions.

| Test checkpoint | Observation |
|---|---|
| `808d1a6` | [Initial run](initial-tests.txt): two setup failures from the incorrect key assumption. |
| `318b3f4` | [Corrected preservation](corrected-tests.txt): six nested checks pass; both final Finance steps reject the driver's create-only `id` in a revision payload. |
| `6aa2fab` | [Correct revision payload](pre-review-tests.txt): all eight nested checks pass; ten runner tests including parents. |
| `9dae751c4db4de2e94ebaba0043950af537071f0` | [Final run](final-tests.txt): all eight nested checks pass, ten runner tests including parents, about 97 seconds. Self-review also adds explicit Finance readiness and Held/Consumed state assertions. |

No application defect was demonstrated, so no runtime fix is included. [Live invalidation function](live-invalidation.sql) retains the inspected schema definition. PT-13 is recorded as a combined synthetic backend pass at this source; all 78 parent dispositions and the issued acceptance catalogue remain unchanged.

## Procedure coverage

| Stage | Required observation |
|---|---|
| Original source | 90 MIN and 2 EA, exact approved entry IDs/versions; captured and reviewed quantities stay separate from allocated/billable values. |
| In-place/frozen refusal | Direct updates to both accepted entries fail; correction before opening the report cycle is refused. |
| Successors | Reason required; new IDs share the original roots, point to the exact predecessors and retain actor/reason/audit. Exact replay returns the original receipt; a second new successor of the old version is refused. |
| Immediate invalidation | Report becomes Draft, source readiness fails, and Finance becomes Returned before processing or ReconciliationRequired after processing. Original allocation holds and exact Finance revision remain intact. Processing cannot continue. |
| Service re-review | New submission contains the two successors; old report approval cannot be reused. Fresh review and issue restore eligibility of the new source, while the old Finance approval stays invalidated. Original HTML/PDF and accepted attendance remain unchanged. |
| Unprocessed continuation | Explicit new allocations, submission and independent Finance review are required. Old holds are released through the owning command; exactly 75 MIN / 3 EA are newly held. No target is created. |
| Processed continuation | Revision/cancellation is refused. One replay-safe correction request links the original Finance revision and outcome. Original targets, outcomes, reconciliations and consumed allocations remain unchanged. No correction/reversal is executed in an ERP. |

All original entries, report revisions/reviews/issues/presentations/references, Finance revisions/lines/source references/reviews/processing/outcomes/reconciliations/targets, attendance acceptances, receipts, audit and outbox records are checked as complete rows while allowing separately asserted successor records. Actual existing renderers generate the new report output. No storage, quantity, database command or hash response is mocked.

## Backend PR integration

- [PR #380](https://github.com/deanrfiedler-gif/powerplants-one/pull/380): merged main into its branch at `e300625310de92178eae54d9a234c4cfa674629b`, resolving only the competing document-register append by retaining both sets of rows. Its nine nested PT-18 scenarios pass (11 runner tests including two parents; wrapper 1/1). The [first local run](pr380-timeout.txt) hit its unchanged 110-second child deadline after the first procedure; the [repeat](pr380-integration.txt) passed in about 80 seconds without changing the test or deadline. Type checking passes after regenerating stale Next route types from the merged UI page moves. Foundation, prototype and naming checks pass. No application fix was attributed to the timeout or generated-type mismatch.
- [PR #379](https://github.com/deanrfiedler-gif/powerplants-one/pull/379): reviewed the existing main integration at `03f97e2daddcc7fd17bb0d58863bd0d52d5a81ed`; its three authority rechecks remain intact. [All 16 nested download scenarios pass](pr379-integration.txt) (17 runner tests including parent; wrapper 1/1) in about 51 seconds. The 13 current-head workflows originally concluded `action_required` after a Copilot-authored merge; rerunning the existing workflows under the owner account successfully queued them. No workflow, protection or approval policy was changed.

Both branches are mergeable at this checkpoint. The [dated GitHub snapshot](integration-ci-snapshot.json) retains their exact heads and check states while CI is still running; it is not a final pass. Neither PR was merged or deployed by this session.

## Validation

[Final type checking](typecheck-final.txt), [full lint](lint.txt), final targeted lint, [foundation](foundation.txt), [prototype](prototype.txt) and [naming](naming.txt) assurance pass. Logs normalize trailing whitespace only. Final self-review adds explicit readiness and consumed-allocation assertions and receives its own passing execution. No runtime files, dependencies, migrations, grants, UI pages or design-review records change. No complete local unit/database/browser sweep or runtime build is claimed for this test/evidence-only contribution.

## Reproduction and limits

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and the existing reviewed Chrome renderer. The session reuses only its own disposable loopback cluster on port 55923 with database `ppo_synthetic_test`; credentials and generated outputs stay in the private task directory outside Git. Tests reject other database names and reset the synthetic database between the two journeys. The task cluster is stopped after verification. No other cluster is reset.

```sh
node --env-file=/absolute/private/proof.env --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/approved-evidence-corrections.test.ts
```

The existing database wildcard discovers the test. This proof executes domain commands against PostgreSQL and real synthetic document storage. It does not assert browser form behaviour, actual participant understanding, operational accounting policy, live MYOB posting/reversal, customer delivery or full PP-01 acceptance. Issued procedure definitions and historical evidence remain unchanged.
