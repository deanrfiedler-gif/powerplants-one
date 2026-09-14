---
document_id: PPO-010-E2-PERSIST-HO
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Workspace API and additive migration implemented; runtime verification and browser journey pending
source_commit: 8910b7b04d26d9d122d680f980fad8b559b90ce2
---

# E2 option and scope persistence handover

[Issue #167](https://github.com/deanrfiedler-gif/powerplants-one/issues/167), the [receiving contract](../contracts/estimating-e2-design.md), [ADR-0025](../decisions/ADR-0025-e2-discovery-foundation.md) and the pre-runtime [ADR-0026](../decisions/ADR-0026-e2-option-persistence.md) govern this contribution. It follows the definition/current-context foundation in #168 and the P12 integration in #166. The branch must target actual main after those dependencies; merging into a feature base is not delivery.

## Implemented scope

Migration 0026 adds one typed estimating workspace per Opportunity, one selected Active option, up to ten retained options and immutable estimation revisions with exact predecessor/current pointers. Each Discovery revision has separate scope/answer snapshot identities, the compiled adopted input, captured context and hashes, server attribution and exact relational Facility/equipment membership. Current access to every referenced record is checked before history is disclosed. Root ownership is fixed; a grant does not make a different actor its owner.

Existing E1 A/r01 UUIDs are formalised unchanged in separate LegacyManual revisions, with no invented questionnaire. Backfill and future legacy creation add compatibility records without rewriting existing estimates, commands, receipts, quote inputs or stored files. The existing one-Estimate-per-Opportunity rule remains. Existing E1 save and new quote preparation now honour the whole Draft group and active-option guard. Original accepted receipt and render-job recovery remain available under current authority after archive. Read controls reflect the new-content hold; the exact Draft recovery control remains separate.

The API creates A/r01 and selection atomically, saves scope successors, branches fresh or from an exact saved source, selects explicitly, archives an unselected option and reopens it without selecting it. Copying makes confirmed answers unconfirmed with an assigned follow-up. Fresh branches import no retained answer set. Explicit acknowledgements are required for changed/newly active confirmed answers; unchanged confirmations retain their server attribution. Hidden answers come from the accepted predecessor. The current group version, exact revision, related-context hash and server comparison hash are checked inside the shared-operation transaction. Records, audit, original receipt and outbox succeed or roll back together.

Commands use a distinct strict schema-1 namespace and the existing 64 KiB, identity, origin and no-store HTTP boundaries. `GET/POST /api/v1/estimating/workspaces`, per-workspace reads/changes, read-only preview POSTs, option actions and exact revision reads are implemented. Previews create no business receipt. Same-operation recovery checks the accepted audit record's exact revision and source references, including edit access to a former selected Site. Another selected option cannot grant access to the old receipt.

Scope readiness and Full/Express remain separate. Delivery routing is NotConfigured. Scope changes, selection and archive do not change CRM stages, amounts, Activities or accepted costing/quotation source. New legacy creation selectors exclude opportunities with an existing E2 workspace.

## Verification checkpoint

Local validation uses the available Node 24.20.0/npm 11.19.0; CI uses the maintained Node 24.21.0 and guarded Chrome. Results must be published against the exact remote source/tree after execution. The local environment has no usable PostgreSQL/renderer runtime, so migration execution, HTTP and saved browser behaviour cannot be inferred from static checks.

At this source checkpoint, local full lint, TypeScript, all 103 unit tests and the application build passed. All three documentation checks passed with 78 parent requirements, 153 document records and 52 checked front-matter revisions. These results do not yet establish that migration 0026 executes or that the new DB/HTTP cases pass.

Three new unit cases exercise strict command identity, branch/copy exclusivity and exact selection requirements. Twelve real-database cases are authored for identical/stale races; immutable source and explicit reconfirmation; copy/fresh/hidden-answer behaviour; archive/reopen/selection; revoked current and original-Site access; changed context; atomic rollback at audit/receipt/outbox; additive E1 migration/repeated seed/original HTML/PDF recovery; ten-option and relationship constraints; and unsupported group states. The unsupported-state fixture changes constraints only inside a transaction that is always rolled back. Render Pending is separately proved compatible with Draft editability. Two actual HTTP cases cover saved commands, original recovery, exact history, direct denial, invalid definitions/confirmation, payload limits and origin enforcement. Authored cases are not passing runtime evidence.

Every exact migration-registry assertion was reviewed, including the unchanged seed list (0026 adds no seed), and the existing hosted-upgrade gate was reviewed for additive records and runtime privileges. No hosted upgrade or deployment is performed by this contribution. Workflow files are unchanged.

## Remaining delivery

Complete exact-source CI, inspect original diagnostics/artifacts, add the saved desktop/phone UI and actual application/PostgreSQL restart journey, then merge normally to main and verify the actual merged result. Until those steps are published, this is an implemented API contribution, not completed E2 acceptance.

Costing import still needs the explicit receiving change described in ADR-0026: append-only version basis, multiple option estimates and selected-Site permissions/output must be resolved together before relaxing E1's fixed Site/one-Estimate constraints. E3/E4 sources, approval/terms, DR-03–DR-06, delivery rules and the five container propositions remain open. Physical-device, screen-reader and owner business acceptance remain separate.
