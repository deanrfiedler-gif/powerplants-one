# DK-06 managed template drafts and review evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Date:** 13 October 2026. **Status:** User-authorised synthetic backend implementation; verification and independent/business acceptance recorded separately.

## Decision and architecture

Dean requested R2 after the read-only catalogue in PR #471. Continue the TypeScript/Next.js modular monolith, PostgreSQL, shared command receipts and audit/outbox under ADR-0003 and ADR-0006. Four typed tables retain a scoped proposal, immutable revisions, independent review evidence and immutable command events. This reuses the existing transaction and recovery mechanisms; a new service, dependency, arbitrary executable template language or mutation of runtime definitions is unnecessary.

Each proposal has a stable UUID, explicit company/site context, one OUT-09/OUT-10/OUT-14 family and an exact retained base definition. These are local review scopes, not global use assignments. Schema 1 is a bounded layout proposal: title, audience and ordered fields with stable keys, labels, allowed source bindings and proposed requiredness. The binding catalogue cites existing output projection paths; it never fetches business values or executes expressions. Conditions, HTML, scripts, uploads, external URLs, arbitrary paths, new required operating rules and new renderer support are outside this schema.

Three explicit capabilities (`template.read`, `template.propose`, `template.review`) are denied by default. No seed or hosted grant is added. They intersect existing shared/site and output-family read authority in the same company/site. Each binding also requires its current source capability. Finance remains Internal and requires shared Finance access; account binding additionally requires finance.account.read. No library, preparer, reviewer or administrator role implicitly gains these duties.

## Exactness and review

Create captures an existing base template only when its retained definition matches both its SHA-256 and the caller's observed hash. Revisions preserve that base and fingerprint the canonical base/body together. A new revision always resets the proposal to Draft. Review binds the current revision ID, content hash and proposal version; any contributor to the proposal's revisions is excluded from reviewing it.

Review observations cover schema, source bindings and audience. Each records Pass/Fail/Blocked/NotRun and a narrative. Reviewed requires all three Pass; ChangesRequested retains unresolved observations. Reviewed means a recorded proposal review only, with no publication eligibility, supported runtime version, policy assignment, owner approval or release. Changed content needs fresh review.

Every accepted command atomically writes typed evidence, audit, receipt and ordinary SharedRecordUpdated outbox evidence. Version conflicts refuse stale commands. Unchanged original operations replay their original receipt under current draft and original revision/source authority; a changed payload conflicts. Actor-private generic operation recovery rechecks the same authority. Historical revisions/reviews remain available under current permissions.

## Migration and compatibility

Migration 0092 is additive after integrated 0090; 0091 is left available for the parallel DK-03 distribution integration. The registry supports gaps. Empty tables and three denied capabilities add no users, grants, seeds or business records. The identity ALTER flushes and restores deferred identity constraints. Hosted upgrade review covers ordinary table/function privileges and preserves the default-denied duties.

Existing template definitions, policies, saved revisions, render jobs, issues, byte manifests and receipts are preserved. R3 supported publication and R4 controlled assignment remain separate. The working design remains DK-06/r20 Record Workspace; R2 adds APIs, not authoring controls or an HTML package.

## Traceability and evidence

Parent DOC-03/DOC-06; OUT-09/OUT-10/OUT-14; D-012/D-024; AT-36; BC-03. See [R2 contract](../contracts/document-template-drafts.md), [original receiving sequence](document-form-template-management-design.md), [execution evidence](../testing/evidence/template-drafts/README.md) and [current status](../STATUS.md). Issued references and parent IDs are unchanged.
