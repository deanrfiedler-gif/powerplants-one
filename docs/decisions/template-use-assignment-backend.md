# DK-06 controlled template use assignment

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** User-authorised synthetic R4 implementation; independent review, owner acceptance and deployment separate.

## Decision

Continue [R3 publication](template-publication-backend.md) for OUT-09 only, using the existing PostgreSQL transaction lock, TypeScript services, audit, actor-private receipts and outbox under ADR-0003/0006. No new dependency or service is needed. The inspected live schema has one workspace pack_policy pointer and immutable definitions; it has no scoped effective schedule.

Adopt one explicit company/site scope, fixed OUT-09 purpose and Internal audience. An assignment must reference a supported immutable R3 publication from that same scope. No company/site precedence hierarchy, wildcard applicability, other output family or arbitrary historical definition is introduced. Explicit template.assign is default-denied and intersects template.read, current publication/source authority and Service pack.check. Publication approval remains the immutable R3 record; assignment adds its own attributed Service approval note without appointing operational authority.

## Effective policy and preservation

Each accepted assignment advances the site's policy version atomically and retains its own immutable identity, exact publication/hash, interval, actor, reason and original operation. Intervals are start-inclusive/end-exclusive, with an explicit nullable open end. A null requested start means the database server's current clock after obtaining the workspace lock; an explicit start must still be in the future when accepted. Caller clocks never select the runtime template.

Assignments cannot overlap. To succeed an open-ended assignment, name its exact predecessor explicitly; its effective end is derived from the successor's start. The original row is never rewritten. Closed intervals and a predecessor already succeeded cannot be implicitly extended, shortened or replaced. Retroactive edits, cancellation and interval rewriting are outside this bounded command.

The first assignment pins the exact existing workspace default and policy version. Until the site's first managed interval begins, that unchanged legacy selection remains in force; sites without assignments keep their existing behaviour. Once the managed schedule begins, a gap fails closed. This is an explicit transition from the legacy default, not an inferred precedence rule. A changed legacy default before activation requires review and blocks preparation. Future assignments do not prematurely invalidate the currently selected interval.

Pack preparation, checking, issue reservation and worker finalisation resolve the current interval from trusted database time. Snapshots retain the assignment identity/version and exact published definition. Crossing a boundary or changing the selected assignment refuses stale in-flight issue finalisation, retaining stored original output for review. Exact accepted receipts and issued files remain recoverable under current permissions; assignments never regenerate or mutate them. Ordinary pack consumers need their domain/source permissions, not template-management duties.

## Alternatives and boundaries

Changing the workspace pointer would affect unrelated companies/sites and cannot represent effective intervals, so it is rejected. Updating old assignment rows would erase original intent; an immutable successor relation is used instead. Editing fingerprinted renderer or operations sources would invalidate retained R3 definitions, so they remain byte-for-byte unchanged; the new TemplateUseAssigned outbox kind references the immutable assignment record through the existing operation envelope.

The [receiving design](document-form-template-management-design.md) originally coupled publication and use. R3 established separate definition publication; R4 atomically binds an already published exact definition to its intended scoped policy, without republishing it. Native controls, broader applicability, other families, providers, business acceptance and deployment remain separate.

Traceability: BC-03 / DK-06 R4; DOC-03/DOC-06, OUT-09, D-012/D-024 and AT-36.
