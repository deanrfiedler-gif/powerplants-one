# Repository consolidation and synthetic service verification

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Decision: authorised by Dean on 27 September 2026 following the repository audit. Delivery, source review, owner/device acceptance and deployment remain separate.

## Decision and scope

Consolidate the current repository and unfinished branches, complete the existing FI-01/FI-02 timer/offline increment, and verify one continuous synthetic planned-service journey. Preserve the root checkout's uncommitted planning and estimating-reference changes. Continue the existing field branch rather than recreating its work. Refresh README and STATUS from actual source, CI and deployment evidence; retain earlier observations in STATUS-log and the original handovers.

The inspected starting main is `80b2f418b90a69d267ac2e65682a5b560a8b4356`, tree `5c9ee19d6af6e12b5cb5bf464338aacba9172059`. All seven configured protected contexts pass. No pull request was open at preflight. The 26 September deployment run `36204121972` used this source and passed its database, web-health and anonymous-access checks. This observation is not a fresh signed-in journey or device acceptance.

## Migration integration order

| Sequence | Owner | Treatment |
|---|---|---|
| 0049 | Merged Supply Chain | Preserve `0049-supply-chain.sql` and its issued/applied identity unchanged. |
| 0050 | Existing FI-01/FI-02 branch | Complete and verify the additive timer/offline migration first. No seed or new capability is proposed. |
| 0051 | Unpublished Maintenance/Warranty branch | Reconcile its original 0049 proposal against merged Supply and timer source before publication. Update every registry, seed, upgrade assertion and capability consumer together. |
| 0052 | Unpublished Products branch | Reconcile its original 0049 proposal after the preceding increments, with the same complete upgrade obligations. |

These are repository integration allocations, not permission to apply unpublished schema to a working or hosted database. Refresh main before each publication; if another accepted migration has advanced the sequence, explicitly reconcile the allocation instead of changing an applied migration. Do not register a missing predecessor or advance the hosted upgrade gate without proving its actual contract. Existing disposable databases with old branch-specific migrations must be identified as such; do not relabel their applied histories.

## Verification milestone

Use the existing P07/P08/P09/P10 authorities, original-operation receipts, immutable evidence and simulated Finance adapter. Verify customer/site/equipment context, service intake, authorised work, checked and issued pack, assigned appointment, readiness and field capture, report review, exact customer response, Finance reconciliation and return-visit history. Record the commit, environment, original receipts, outputs, restart and remaining findings.

PT-28 additionally requires compatible application/schema recovery, retained unsupported originals and the scheduling-policy impact procedure. PT-30 requires the complete continuous narrative and dispositioned prerequisites. Component counts and the deployment health probe alone close neither procedure. Record the subset actually executed if any required step remains unavailable.

The current PT-27 compiled benchmark has sixteen candidate misses (p95 3.42–10.03 seconds against 3 seconds). Inspect the retained phase evidence before selecting a bounded remedy. Preserve the fixture, sample boundary and threshold; do not claim Azure response times from CI measurements. Owner visual/device/screen-reader review remains a separate obligation.

No new framework, service or external integration is selected. MYOB remains intended ERP authority, SharePoint owns business documents and native CAD retains authoring. This decision authorises synthetic repository work and reviewable PRs; it does not authorise business transactions, customer messages, operational migration or production promotion.

Execution and remaining obligations: [consolidation handover](../delivery/repository-consolidation.md).

## Next bounded acceptance increment — 27 September 2026

Dean's continuing instruction to proceed covers the local PT-28 compatible-update component after the completed return-visit proof. Reuse the existing Node/TypeScript, PostgreSQL, Chromium and owner-bound offline store under ADR-0024; select no new technology. Use two clean compiled releases and one dedicated disposable database: old schema-1 work includes six accepted originals with lost responses, one never-submitted supported original and one explicitly unsupported fixture. Apply the existing additive 0050 migration, exercise the real service-worker waiting/activation lifecycle, recover exact originals and verify immutable issued bytes. Then restart the old application against the upgraded database to verify the bounded old-command rollback path; do not downgrade schema, restore a prior database or infer rollback safety for new Timer commands or external Finance outcomes.

Changing scheduling policy is a separate business command with authority and future-booking impact requirements. The current source has no such publisher. Direct fixture/database edits cannot stand in for that procedure. Record this increment as a component result rather than complete PT-28, owner acceptance or hosted deployment.

## Publication allocation reconciliation

The [controlled scheduling-policy continuation](scheduling-policy-publication.md) reserves 0053 for an independent additive publication increment. Current registered schema ends at 0050; unpublished Maintenance/Warranty and Products retain 0051/0052. The runners apply actual registered missing versions, so those slots may remain explicit gaps. Do not register placeholders or integrate unrelated work to advance the number. Later 0051/0052 integration must prove both ascending installation and application after an installed 0053 against its actual schema. Refresh main before implementation and revise this allocation if a real collision/dependency appears. This plan changes no SQL, seed, registry or hosted upgrade gate.
