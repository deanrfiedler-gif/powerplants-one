---
document_id: PPO-010-E2-COST-HO
revision: r02
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Exact discovery-to-costing connection implemented; runtime verification pending
source_commit: 45de8e3e2ccfdd5f13a7478c257d813dcbb570e3
---

# Exact E2 scope, manual cost versions and Draft quotations

This is audit task 4 under #167 / EST-01–EST-09, following [#168](https://github.com/deanrfiedler-gif/powerplants-one/pull/168), [#169](https://github.com/deanrfiedler-gif/powerplants-one/pull/169) and [#171](https://github.com/deanrfiedler-gif/powerplants-one/pull/171). [ADR-0027](../decisions/ADR-0027-estimating-discovery-cost-basis.md) records the representation and permission choices before implementation. This is manual synthetic costing, not adoption of E3 pricing, routing, commercial approval or issue authority.

## Implemented result

An owner selects an Active option with Complete attributed discovery and opens **Review scope for manual costing**. The separate page captures the exact current workspace, option, revision, scope/answer snapshot IDs, saved hashes and live permitted context. The owner enters or retains manual scope wording, exclusions, assumptions, source-dated lines and explicit Allowance flags, reviews the proposal and confirms a reasoned command. No questionnaire answer generates a price.

`POST /api/v1/estimating/workspaces/:id/costing/preview` is a read-only comparison. `POST .../costing` uses the strict `AdoptDiscoveryCosting` namespace with original operation identity, workspace/revision/context expectations and expected estimate version (zero before first costing). It creates the option's one estimate or an immutable successor. Workspace locks, current owner, all-target source authority, selected Active option and whole-group Draft state are rechecked inside acceptance. Changed selection, stale cost versions, incomplete scope, changed context, different same-key content and competing first creates are refused without partial records.

Migration 0027 adds typed estimate roots and immutable version-to-Discovery links. Every bound cost version has one exact Complete source in its own company, workspace and option. Root/header/initial revision consistency and every successor are checked by deferred graph constraints. New source adoption requires the current selected revision; ordinary manual saves inherit the previous exact binding. The one-Estimate-per-option rule remains. Opportunity uniqueness is relaxed only alongside these constrained roots and the retained E1 materialisation guard. Existing E1 rows receive no invented questionnaire or basis; their original A/r01, hashes, commands and DTOs remain unchanged. A legacy A workbook stays available, while a fresh alternative can carry a separately bound estimate.

Bound headers keep their original Site in storage. Current/historical permission and displayed Site use the specific version's saved basis; a later Site does not relabel an earlier quote or permit its recovery after original access is revoked. Accepted estimate receipt recovery checks the audit's exact saved version before returning or replaying the original. Quote-safe reads recheck source references with quote capability and do not require internal-cost access. Hidden historical versions/quotes are omitted from current lists. All old cost content hashes retain their original shape; immutable version links carry the distinct Discovery evidence.

The workbook labels saved and newer discovery separately. Ordinary manual saves cannot silently adopt newer scope. The adoption page keeps entered manual proposals through stale-source refusal and freezes an uncertain operation until original reconciliation. The existing identity/unsaved-work boundary applies. CRM shows separate permitted option estimates, retains an existing legacy primary or stable first-created primary, and never adds alternative values to the opportunity forecast. Exact Draft quotation source, include/print choices and stored HTML/PDF remain immutable; Site comes from the cost version's basis.

## Verification scope

Maintained Node 24.21.0/npm 11.19.0 local lint, TypeScript, 104 unit cases and application compilation passed before the final restart extension; focused types/lint were rerun with that extension. No local PostgreSQL or controlled browser runtime is available, so the following authored runtime proofs require CI:

| Surface | Proof |
|---|---|
| Unit | Strict new namespace, exact version/context requirements, payload bound, schema/issue/automatic-policy refusals and explicit expanded line flags |
| Database | Eight cases: identical/competing operations; separately costed options and stable CRM projection; incomplete successor hold plus inherited ordinary-save basis; two selected Sites and historical permission revocation; quote-only reader separation; missing/cross-option/mutable SQL bindings; audit/receipt/outbox atomic rollback and context conflict; migration-26 legacy DTO/ledger/receipt/file preservation through upgrade and repeated seed |
| HTTP | Actual preview/command/read/receipt routes, identity/source/origin/schema refusal, exact predecessor after successor, unchanged CRM envelope/version |
| Browser | Existing desktop and phone projects: create manual costs from reviewed scope, lost accepted response reconciliation, reload, unchanged old basis after discovery advancement, explicit adoption preserving manual prices, exact version Draft generation and 320px capture |
| Restart | Existing E1 write/recover/verify harness additionally carries two bound cost versions, both exact Draft sources, seven original business receipts and a durable-but-interrupted quote lease across distinct application/PostgreSQL processes. Recovery throws if it attempts to regenerate the original stored output. Source/tree/run/viewport/screenshot hash and independent process identities are retained |

Every exact migration-registry assertion and the hosted-upgrade gate was reviewed. Migration 0016 remains reserved; 0027 adds no seed or capability. Existing workflows, timeouts and dependencies are unchanged. The updated hosted gate is compatibility code, not an executed hosted migration or deployment. Tests preserve the original schema-1/2 and E2 component cases, including the corrected discovery fixtures in #169 and comparison wait in #171. No new test result is inferred from those dependency passes.

## Remaining verification and acceptance

The first source `285e78d6` failed its E1 restart extension in run [34812983052](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34812983052), job `103877834832`: the first new costing acceptance rolled back at COMMIT because SQL alias `old` was ambiguous with PostgreSQL's trigger `OLD` record. The correction renames that alias to `predecessor_basis`; no graph condition, transaction boundary, assertion or original sample is relaxed. The original run remains failed. Runtime verification of the correction is pending.

Corrected source `578125c1` passed first costing and recorded two version bases, seven original receipts and the interrupted stored quote. Restart run `34813617871` attempts 1 and 2 ended with runner shutdown signals during recovery (jobs `103879663043` and `103881536154`); neither is a restart pass. Review then found a definite proof serialization error: the checkpoint JSON converted a Buffer into an ordinary object, which could never deep-equal the fresh Buffer after restart. The proof now stores original bundle bytes in a separate private file, retains the typed document key in JSON, and checks exact bytes, key and SHA-256 after recovery. A failed byte comparison emits a bounded boolean assertion rather than a potentially huge byte-array diff. This is not evidence of the runner shutdown's cause. The application, original-byte guarantee and no-regeneration condition are unchanged; fresh source runtime verification remains necessary.

Publish the source with exact local/remote tree equality, inspect its actual CI failures and original evidence, integrate normally after its dependencies, and verify the actual merged tree. Physical device, screen-reader, independent owner demonstration, full E2 acceptance and E3/E4 policy remain separate. Formal quotations remain Draft; no customer communication, operational data migration, ERP/SharePoint write or automatic pricing is included.


## Focused verification checkpoint

Source `5047c927` passed E1 run [34814802616](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34814802616), job `103883142266`: 104 unit, 14 retained E1 DB, 3 retained E1 HTTP and 13 retained E1 browser cases. Its new cost-basis write/recover/verify stages each passed with two exact version bases and seven original receipts across actual application/PostgreSQL processes. Both original interrupted attempts remain incomplete; this later success does not establish their shutdown cause.

The eight new cost-basis database cases are now registered once through `tests/database/estimating.test.ts`, using that entrypoint's existing disposable reset lifecycle. Their bodies and assertions are unchanged, and the former standalone entrypoint is removed. This makes the existing required Estimating workflow execute all eight alongside the 14 retained E1 cases, while the full suite still executes each once. It resolves the concrete gap where all eight new SQL/history/permission/upgrade cases otherwise waited until the late broad Application stage. No workflow, timeout, dependency, application guard or expected test outcome changes. The changed test-registration source requires its own CI result.


## Full-suite HTTP refusal correction

Source `46d65048` broad Application run [34815664432](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34815664432), job `103885688355`, passed 104 unit plus three preparation cases, all 420 database cases and 178 browser cases with three explicit skips, but failed one of 30 HTTP cases. The new costing test tried to JSON-parse the local origin guard's intentional plain-text HTTP 403 response (`Local synthetic access only.`) before asserting the refusal. All 29 other HTTP cases passed; the source remains failed.

The corrected case checks the raw wrong-origin response status directly, matching the retained E1 origin-boundary case. Application-origin guards and JSON expectations for actual API responses remain unchanged. The complete costing HTTP case is registered once through the required `tests/http/estimating.test.ts` entrypoint; the former standalone test file is removed, so the full glob still executes exactly one copy. This makes the existing required Estimating workflow exercise four HTTP cases without a workflow edit, timeout, retry or assertion waiver. Fresh corrected-source verification is required.
