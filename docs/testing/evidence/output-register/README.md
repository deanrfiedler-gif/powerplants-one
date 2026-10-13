# DK-03 first receiving increment — execution ledger

Owner: Dean Fiedler. Synthetic prototype only. [Decision](../../../decisions/output-issue-register-backend.md) and [contract](../../../contracts/output-register.md). Branch `codex/output-issue-register-backend`, base PR #467 at `38ba7e9cc9959cfcb5048a9c75c722d16ee4654c`. Code verification, independent review, business/visual acceptance, merge and deployment remain separate.

## Execution

Local execution on 13 October 2026 used Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and the pinned Playwright/Chrome renderer against the isolated `ppo_synthetic_test` database.

- Focused units: 2 passed. TypeScript, foundation, naming and studio integrity passed.
- Database scenarios B01/B03/B04/B05 passed together. B02 and B06 subsequently passed after correcting synthetic fixtures. The first B02 fixture attempted to remove crew from a confirmed appointment; a second attempted an uncontrolled appointment state change. Both were correctly rejected by SQL. The final fixture uses native cancellation. B06 first used invalid synthetic references; the final fixture lets the native identity trigger allocate them. No guard or deadline was relaxed.
- The final NotProvided refinement prevents crew-only reads from claiming a protected draft is unissued. B03 with that assertion passed locally, and all six cases passed together in the first CI run.
- Studio reports 358 entries, 204 source routes, 330 unreviewed and 28 stale entries, with all 43 component reviews pending. No review fingerprint was promoted.
- Local full build passed. Full lint initially caught one unused restart-proof variable; that variable was corrected before the implementation commit. Lint over every changed application/test file and the final proof corrections passed.
- [Initial CI run](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38345319184), source `4597df9f08a9c6a5cf9e39fe524e9a490c83ee0d`: full `npm run check` passed, including **777 units**, lint, TypeScript, studio and build; **all six database cases passed**. The HTTP step then failed on the test's expected 404 versus native report-read 403. The application reader did not change; the final test asserts report 403 and out-of-scope pack 404 separately.
- Final local compiled HTTP: **1 passed**, covering scoped reads, strict queries, no command route and exact native PDF hash. Earlier attempts recorded startup ECONNREFUSED before readiness, the refusal expectation above, and login audit events occurring after the snapshot baseline. The final fixture establishes all authenticated sessions before the full unchanged-row snapshot; it retains the complete audit comparison.
- Real local PostgreSQL restart and a fresh application-service process: **passed**. [Retained result](restart-result.json) confirms exact native identities/hashes, the original receipt, every snapshotted business row and the migration ledger. The proof reuses the saved synthetic principals so verification does not introduce new login audit events. Native services still recheck live grants. The compiled HTTP server was stopped after use.
- Final corrected-proof CI remains separate from these completed local results. Source pins and its result will be appended before handover.

The focused suite exercises consolidated native pack/report output, permission-filtered paging, exact parent binding, assignment/working-company restrictions, failed/durable preparation and original recovery, retained superseded/withdrawn issue bytes, distinct simulated distribution/acknowledgement/report-content response, missing/corrupt bytes and authority expiry. Full business-row snapshots prove shared reads create no business effects. A visible-window fixture tests truncated totals and stable live paging.

The compiled HTTP proof checks strict queries, source refusals, GET-only routes, private cache headers and exact native report PDF hashes. A separate process restart proof checks native facts, exact hashes, original receipt, unchanged business rows and unchanged migration ledger after PostgreSQL restart.

No schema or permission contract changes, migration upgrade, new UI, new render service or delivery-provider claim is included. Native page implementation, additional output families, generic publication/distribution commands, actual delivery evidence and DK-06 template administration remain open.
