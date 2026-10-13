# DK-06 template publication API

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic R3 implementation; review, business acceptance and deployment separate.

## Boundary and authority

The [R3 decision](../decisions/template-publication-backend.md) selects OUT-09. A publication is a stable immutable UUID linked to an exact R2 revision, independent review and new pack template. Only Internal audience and R2's four existing OUT-09 source bindings are supported. All nine original mandatory sections are retained. The reviewed title and ordered labelled fields are escaped text; required fields must have nonblank source values when rendered. Unknown fields, markup properties, expressions and external resources are unsupported.

template.publish is explicit and denied by default, with no seed grant. It intersects template.read, pack.read, pack.check, shared/site/working-company and each bound source capability in the same proposal company/site. A contributor to any revision cannot publish that proposal. The independent reviewer may also publish if currently authorised. Publishing records an explicit Service approval note; it grants no operational authority.

## Endpoints

All endpoints start with /api/v1 and use existing session, origin, JSON, no-store and actor-private receipt protections.

| Method/path | Result |
|---|---|
| GET /document-template-drafts/:id/publication | Publisher-only readiness of the exact current Reviewed revision: proposal/version/hash, review ID, proposed next runtime version, exact definition and hash. Refuses blocked readiness. |
| POST /document-template-drafts/:id/publication | Atomically publish one exact reviewed supported definition. |
| GET /document-template-publications/:id | Current-permission read of immutable publication, exact approval/review snapshots and current runtime support. |
| GET /document-templates?family=OUT-09 and /document-templates/:id?family=OUT-09 | Existing catalogue now recognises the new renderer; managed rows require proposal scope/source permissions before paging or return and expose their publication_id for evidence inspection. |
| GET /operations/:operation_id | Existing actor-private original receipt, rechecking current publisher/domain and original/current source permissions. |

R2 draft endpoints retain their proposal-only flags; their false publication_eligible is not R3 readiness. Native controls remain unbuilt. Publication does not select a policy, define an effective interval or authorise a use assignment.

## Exact command

Require operation_id, schema_version:1, reason, id (publication UUID), template_id (new UUID), expected_version (proposal command version), revision_id, content_hash (proposal), review_id, runtime_version, definition_hash and approval_note (1–2000 characters). All fields are explicit; unknown properties are rejected. Obtain the version and definition hash from readiness; do not synthesize support or substitute another reviewed revision.

The new runtime version is the next workspace pack-template version, at least 3. Its supported schema is 1 and renderer contract is DK06-OUT09-1. These identities are separate. Publication captures the exact canonical definition, proposal and review snapshots, publisher, reason, approval note and trusted server timestamp.

The command uses the existing workspace transaction lock. It rejects edits, stale review IDs, changed runtime dependency fingerprints and a version consumed by another publication. Reload and independently assess a genuinely new intent. An unchanged accepted original replays its exact receipt (200 versus initial 201), even after later edits or runtime drift, under current permissions. Changed originals return OperationConflict. Do not replace an uncertain operation ID. One publication per revision is enforced; AlreadyPublished directs the caller to original recovery.

## Runtime support and preservation

The new dispatcher retains legacy v1/v2 definition/renderer source bytes. New definitions fingerprint a fixed literal source/branding/dependency manifest; retained paths are never opened. Support is recomputed, and changed/unknown definitions or missing required values refuse new rendering. Historical publication reads preserve the original even if current support changes. Current unsupported definitions are never silently substituted.

Migration 0093 adds an empty immutable publication table and default-denied capability. SQL validates exact current review, contributor independence, matching template bytes, unique revision and the audit/receipt/outbox graph. A managed template insert without publication evidence fails. PolicyOrTemplatePublished identifies TemplateDefinition, exact IDs/hashes and use_assigned:false; it does not masquerade as a scheduling policy event.

Existing policies, old definitions, jobs, revisions and issued bundles are unchanged. R4 must establish applicability, trusted time, overlap rules and stale reservation behaviour before use assignment. No publication downloads, reissues, sends or regenerates an old output. Native UI, other families, live providers, deployment and owner acceptance remain separate.

Traceability: BC-03, DOC-03/DOC-06, OUT-09, D-012/D-024 and AT-36. [Verification ledger](../testing/evidence/template-publication/README.md).
