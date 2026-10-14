# DK-06 supported template publication

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** User-authorised synthetic R3 implementation; independent review, owner acceptance and deployment separate.

## Decision and scope

Dean authorised R3 after [R2](document-template-drafts-backend.md). Select OUT-09 job packs for the first supported family under the [receiving plan](document-form-template-management-design.md). Reuse PostgreSQL, the TypeScript modular monolith, command receipts, audit and outbox (ADR-0003/0006). A separate immutable publication record binds the reviewed proposal, exact dependency manifest and pack template. No new framework, service or dependency is required.

The supported schema adds the reviewed title and ordered, escaped source fields to the established pack. All nine mandatory sections and original provenance remain. Requiredness checks presence of the selected existing source values; it creates no new operating criterion. Only Internal audience and the four existing OUT-09 bindings are supported. OUT-10/14 publication remains unsupported.

An explicit default-denied template.publish duty intersects template.read, current source authority and pack.check in the proposal's company/site. Contributors cannot publish. The publisher records an explicit domain approval note against the exact reviewed revision and candidate definition hash. This is attributed synthetic approval, not appointment of operational authority. Reviewer and publisher can coincide; neither can be a contributor.

## Compatibility and alternatives

Keep the existing fingerprinted renderer sources unchanged. Extend support through a new dispatcher and a separate renderer whose exact source and dependencies are fingerprinted. Editing the shared P11 renderer in place would invalidate existing version-2 definitions across three families, so it is rejected. A descriptive new version without working rendering support is also rejected.

Publication allocates the next workspace pack-template version (at least 3). Template version, schema version, renderer version, proposal revision, review and publication are distinct. Current support recomputes the literal dependency list and refuses drift. Definitions and publication evidence are immutable. Historical inspection/recovery needs current source authority but does not require today's runtime to reproduce yesterday's support.

Copying a published definition into another draft retains that source's authority boundary. Every later draft read, history and original recovery rechecks the publication's company/site and frozen/current source bindings, including when the receiving draft is at another site.

Publication never changes the pack-policy pointer, reserves a render, rewrites an output or assigns applicability. R4 retains explicit assignment/effective-time work. Existing legacy reservations and exact bytes remain unchanged. New supported definitions can be rendered against an explicit synthetic snapshot for proof; this is not policy adoption.

Migration 0093 adds one empty publication table, one default-denied capability and its identity/audit type with the deferred-identity flush. No seed, grant, user or existing record changes. Reserved 0091 remains available to parallel DK-03 work.

Traceability: BC-03 / DK-06 R3; DOC-03/DOC-06, OUT-09, D-012/D-024 and AT-36. See the [API contract](../contracts/template-publication.md) and [evidence](../testing/evidence/template-publication/README.md).
