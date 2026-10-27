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
- Final corrected-proof source: `5936bc9853048ddb714786d07c188c8a6d29b91e`. [CI run 38346896145](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38346896145) was queued at the 13 October 2026, 04:35 UTC handover check; no success is inferred. Application code is unchanged from the initial passing application/database CI; this commit corrects HTTP/proof fixtures and records evidence. Final local TypeScript and changed-file lint pass. Broader PR CI, independent review, owner/visual acceptance, merge and deployment remain separate.

The focused suite exercises consolidated native pack/report output, permission-filtered paging, exact parent binding, assignment/working-company restrictions, failed/durable preparation and original recovery, retained superseded/withdrawn issue bytes, distinct simulated distribution/acknowledgement/report-content response, missing/corrupt bytes and authority expiry. Full business-row snapshots prove shared reads create no business effects. A visible-window fixture tests truncated totals and stable live paging.

The compiled HTTP proof checks strict queries, source refusals, GET-only routes, private cache headers and exact native report PDF hashes. A separate process restart proof checks native facts, exact hashes, original receipt, unchanged business rows and unchanged migration ledger after PostgreSQL restart.

No schema or permission contract changes, migration upgrade, new UI, new render service or delivery-provider claim is included. Native page implementation, additional output families, generic publication/distribution commands, actual delivery evidence and DK-06 template administration remain open.

## Accepted Outputs workspace — 25 October 2026

Contribution: [PR #701](https://github.com/deanrfiedler-gif/powerplants-one/pull/701), branch `codex/outputs-workspace`, initially cut from main `60a7f7b4`. This section records the later UI contribution; the first receiving increment above retains its original scope and execution history.

The application now provides Outputs at `/documents/issues`, family-qualified Job pack and Service report records, exact older issues via `?issue=`, register views and permitted filters, selection snapshots, Issue/history/Distribution/Preparation views and phone records. Native My jobs and job-pack entry remain. OUT-09 and OUT-10 are the supported families. The register adds no generic publication authority or bulk issue action.

Q4 revision/progress reads are reused: recipient progress counts only the permitted recipient population and exact actor/hash acknowledgements. G2 adds permission-safe names and bounded source facets. Family windows are not complete totals; failed reads clear stale rows. Missing original bytes retain metadata and original responses without regeneration or successor substitution. Attendance acknowledgement, report-content acceptance, simulated distribution, opening and downloading remain separate.

Controlled actions use existing source-domain commands and exact version/review/template/job/attempt bases. Withdraw pack follows the native current-issue rule, including a successor draft. Confirmation retains the original command in actor/workspace-scoped session storage before submission; uncertain outcomes allow only original replay or receipt recovery. Source changes and permission failures require a fresh read before new work.

### Application comparison

Live accepted Figma frames and retained `docs/reference/ui/output-distribution/output-issue-figma-r01/` references were inspected. `workspace/` contains synthetic application captures at desktop, 390 px and 320 px, with external icon-kit traffic blocked. These are implementation captures, not an owner acceptance record. The current shared 56 px phone header convention applies. Native action/recovery details and truthful bounded-read notices supplement the accepted design.

### Verification disposition

The focused browser suite covers register/snapshot keyboard return, exact historical routes and files, missing bytes, denied/loading/empty reads, stale withdrawal, unknown distribution reconciliation, exact command replay across reload, report-content responses and native issue/recovery handovers. Six of seven cases passed in the first completed run; the remaining case had a duplicate count locator and was corrected. Final rerun is pending.

The interrupted native run passed DK03-C10/C11/C12 and recorded a DK03-C01 failure without its diagnostic tail. The temporary PostgreSQL cluster subsequently lacked required directories; a fresh disposable cluster is being prepared. No final native-suite pass or regression attribution is claimed from that interrupted run. Final studio, lint, TypeScript, unit, build and repository results will be recorded after execution completes.

Independent review, owner visual/business acceptance, physical-device/screen-reader observation, merge and deployment remain separate and unclaimed. No migration, new permission/grant, dependency, external provider delivery or operational integration is introduced.
