# CPQ package execution evidence

Scope: BP-04 / BC-04 / ES-02–03, authorised 15 October 2026. [Decision](../../../decisions/cpq-rule-packages.md), [API](../../../interfaces/cpq-api.md#owned-rule-and-table-packages--workflow-version-1) and [delivery plan](../../../delivery/cpq-backend-plan.md). Base `fae5b0e2480500fac8f90f3cce8dd35b2a7b889f`; decision `f8f46f4` precedes implementation `ce9d94d`; final application/test/CI source is `76625885e3f9c2ea45fe57cf618449b480882641`. Subsequent evidence-only edits do not change that compiled source.

## Local verification

[Source manifest](source-manifest.json) records build `o56tcvBRueLA2WvxbMzXR`, Node 24.21.0, application tree and committed LF source hashes. [Validation record](validation.json) records actual results and private log hashes. Raw local logs remain outside Git; session-bearing restart checkpoints are neither committed nor uploaded.

- 50 CPQ/transport/migration-registry unit cases passed. Typecheck, full lint and the compiled application build passed.
- 62 distinct serial database cases passed across the retained runs, not one uninterrupted 62-case run: the initial broad run passed 52/53; final package and populated-upgrade run passed 19/19, including the corrected historical case; three strengthened isolation/rollback cases passed again. The coverage includes existing schemas, Products, Cost Sources, quality, rebase, package ownership, table composition, publication authority, withdrawal, immutable history, atomic rollback, concurrent/repeated commands, customer quotation privacy, Project upgrades, reserved Products 0052 after 0102, and hosted-demo upgrade simulation. No hosted upgrade was performed.
- Seven distinct compiled HTTP cases passed. The new scenario deliberately discards attestation and adoption response bodies after commit, then recovers the original operations. It also verifies current access, exact private provenance, withdrawal refusal and original-operation replay.
- Desktop and phone CPQ browser journeys passed on the compiled application, with all 801 route warm-up probes reachable. The existing UI remains unchanged; this is regression proof, not acceptance of a new package UI.
- Actual application and PostgreSQL restart preserved exact package/release/run/estimate evidence and all 12 new original receipts, with zero duplicate effects. Existing quality/rebase recovery also passed with five retained receipts. [Restart record](restart.json) includes distinct application process/start times and PostgreSQL start times. Startup latency is not an accepted target.
- Foundation assurance passed 10023 links/6288 files before the final evidence additions; naming and studio checks passed. The existing 334 unreviewed and 28 stale design records remain visible. Final evidence assurance passed 10029 links/6294 files and naming; its separate log hashes are retained below.

## Retained failures and controls

Initial development runs exposed registry latest-version wiring and fixture assumptions (unchanged Cost Source successor, the existing non-disclosing error code and SQL snapshot sorting); these were corrected without changing runtime limits.

The broader database run's sole failure was the existing historical 0086 upgrade snapshot comparing every column after 0102 added nullable `package_manifest`. The original test passed on unmodified main. The corrected test still compares every original field exactly and separately proves the new field is null. That case and all 19 final upgrade/package cases passed; original logs remain identified in the validation record.

The first grouped local HTTP run sorted the legacy CPQ file after the governed Cost Source cases. Its bare actor then received 404 reading the governed active head. The ready unchanged-main control reproduced the same 404 with identical application source. A premature control probe before listening received ECONNREFUSED and is retained separately. Restoring a plain active head through the unchanged quality scenario made the legacy case pass; no access rule, assertion or deadline changed. The committed CI order already runs legacy CPQ before governed costs. New complete package/quality assessments run early, before the existing shared test population grows beyond the retained 25-estimate bound; nothing is truncated and the bound is unchanged.

## Persistence, workflow and workload evidence

Migration 0102 extends the live amended identity and audit contracts after flushing pending deferred identity events. [Live schema proof](schema.json) confirms six prior guards and the permission contract remain unchanged, every earlier identity type survives and new immutability/member/receipt guards are present. Historical expected additions are extended across the existing registry suites; populated upgrades retain original rows, grants, ledgers and receipts and prove repeat-run stability. No seed, permission grant or dependency is added. The hosted upgrade review gate advances only for this empty additive schema and existing schema-wide runtime privileges; no hosted migration/deployment occurs.

[Workflow proof](workflow.json) preserves all 30 retained Estimating database files and adds two package files to the existing native shards, with unchanged assertions, deadlines and mandatory aggregate. Static parsing/partition inspection is separate from actual GitHub CI. Safe restart/workload/source artifacts are uploaded; session-bearing checkpoints are excluded.

[Workload evidence](workload.json) retains the exact owned report and hashes. The fictional sensor family evaluates 1/10/20 instances, with three samples per case. Observed maxima were 0.5871/3.4504/7.9553 ms and 3344/28520/56491 result bytes, within explicitly authored synthetic limits of 1000 ms and 200000 bytes. These are worker evaluation/result observations, excluding startup, database and HTTP latency. They do not establish an operational workload distribution or SLA.

## Delivery gates and limits

Local verification is complete. Exact-head GitHub CI and independent automated review are separate PR gates and are not claimed by these local results. No merge or deployment by this task.

Accepted business families, real distributions, operating ownership, approved rates and service objectives remain open. Rule/table packages do not introduce new prices; schema 4 reuses existing reviewed Cost Sources and schema 3 retains its separate design contract. Ownership transfer and cross-schema composition are outside this increment. Historical schemas 1–4, values, hashes and receipts remain compatible. Human/operational acceptance remains separate from software checks and independent automated review.
