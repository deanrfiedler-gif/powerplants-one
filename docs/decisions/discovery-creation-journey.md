# Reviewed discovery creation and initial ownership

<!-- versioning: git -->

Owner: Dean Fiedler. Date: 20 October 2026. Status: user-authorised direction; implementation, independent review and owner visual review pending.

## Authority and scope

Dean authorised the long-term recommendation: “I am happy to proceed however is the most profession long term solution to ensure the Powerplants One app is as professional as possible. I do like UI pages that we have designed in Figma, so we may have to adjust some journeys accordingly, providing they are an improved version of course.” This follows the recommendation to implement initial estimator assignment and exact Sales linking together before the accepted creation page.

This decision applies to ES-02 `/estimating/discovery/new`, PPO-010 and EST-01–EST-09. It supersedes the separate post-create link-review journey in [LC-13](../contracts/lead-to-delivery-continuity.md#lc-13-accepted-estimating-brief-continuity) **only for the new reviewed creation flow**. Existing-workspace link review and existing clients retain their contracts. It implements Q1/Q4 of the [accepted visual decision](create-discovery-workspace-figma-design.md), without changing the accepted Figma frames or claiming acceptance of the implementation. The creator, receiver and assigned estimator can be different people.

## Behaviour

1. The signed-in creator needs existing estimating read/edit and related-record access. The initial estimator defaults to that person and can be selected from active users with the required opportunity and proposed discovery-scope access. Assignment grants no capability. The server rechecks eligibility at preview and commit. Original creator and answer attribution remain the actual actor; ownership determines subsequent workspace editing as before. Reassignment of an existing workspace is outside this page.
2. Selecting an opportunity identifies its permitted accepted Sales brief automatically. Show the exact revision and attributed content in the creation review. A current accepted brief is evidence of its receiver's earlier decision; linking it does not impersonate that receiver or record a new acceptance. Do not infer technical confirmation or silently overwrite independently entered discovery.
3. The final creation confirmation reviews owner, discovery and the exact Sales acceptance/source together. One transaction creates the workspace, Option A, first immutable discovery revision, optional exact Sales binding, audit, receipt and outbox publication. The binding records the creator as link actor and retains the original acceptance event/receiver. Existing-workspace linking keeps its existing receiver/owner rule.
4. Creation without an accepted brief remains supported. Source drift, changed acceptance, wrong opportunity, lost access or an ineligible estimator refuse new intent; retain the user's entries. Never silently downgrade an explicitly reviewed link to an unlinked success. Read restrictions must not disclose inaccessible brief details.
5. Exact retry recovers the creator's original operation even when another estimator owns the result, subject to current access to its retained sources. It never reassigns the workspace or creates a second one. Non-creation mutation recovery retains its existing owner checks. Historical receipts, payload hashes and Sales evidence remain unchanged.
6. Q2 uses existing preview validation from any wizard step. All active required questions need explicit answers or owned unresolved items; visiting every step is unnecessary. Discovery completeness, creation, costing and commercial approval remain separate.

## Rationale and alternatives

The existing UI-only compromise would retain a second navigation and link action and prevent the accepted owner selection. It remains safe for legacy clients but does not fulfil the chosen journey. Running two browser mutations for the new flow would expose partial creation/link outcomes and complicate exact retry. The chosen implementation keeps the accepted review dialog and moves the coordinated operation into the existing PostgreSQL transaction and command-journal architecture. It introduces no framework, dependency, service, grant or capability.

The existing Sales binding constraint ties receiver, link actor and workspace owner together. The prerequisite must extend its evidence checks for reviewed initial creation while retaining the existing binding branch and all historical rows. Migration 0113 is reserved; inspect the fully migrated synthetic schema and prove populated upgrades, rollback and evidence refusal. The migration is not permission to weaken accepted-source or audit requirements.

## Required evidence

Verify separate creator/receiver/estimator, wrong-scope and inactive owners, changed source/acceptance, restricted records, explicit no-brief creation, exact original retry, concurrent duplicate creation, late-failure rollback and unchanged legacy creation/linking. Check the incoming owner can actually open/edit the saved scope. Preserve all migration/seed ledgers and run the applicable upgrade proofs. The page then needs matched-frame desktop/tablet/phone/state comparison and keyboard/focus checks. Keep business acceptance and deployment separate.
