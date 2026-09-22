---
document_id: PPO-ES08-GEOMETRY-ADR
revision: r01
date: 2026-09-22
owner: Dean Fiedler
status: Architecture proposal from authorised audit; implementation and business acceptance separate
source_commit: 0c95c5af776c97374997623bd1070d9de480cf82
---

# ES-08 Screen Geometry Study architecture proposal

The [audit](../delivery/es08-geometry-audit.md) establishes a semantic mismatch between r10's longitudinal panel-material study and the current Screen Systems cross-span cloth calculations. Richer drawings do not supersede the recovered quantity definition. This decision proposal stays within ES-08 / EST-06 / E5 and ADR-0034, retaining CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009.

The user authorised complete audit and planning while #277 remains separate. No native implementation, migration or migration-number reservation is authorised in this phase. This stable descriptive decision filename follows existing repository practice and avoids allocating a concurrent sequential ADR number. It records a proposal, not an adopted supplier/engineering definition.

## Proposed decision and rationale

1. Retain TypeScript, React/Next, PostgreSQL, the current Specialist Configuration identity, domain folder, server authority, operation receipts and immutable history. No dependency, generic rule evaluator, new service or storage platform is needed for this increment.
2. Introduce a typed `ScreenGeometryStudy` subordinate value in new draft/run schema versions, owned and saved atomically by the existing aggregate. It has no independent customer/project identity, top-level route, access grant or mutable current-result table. Initially one selected physical Facility envelope per configuration study; existing multi-Facility coverage remains source context rather than combined dimensions.
3. Keep `SS-NATIVE-EXACT-QTY-r01` and its immutable recovered bundle unchanged. Add an independently versioned pure geometry definition, numerical policy and drawing model. An explicit adapter extracts the old quantity proposal shape; absent study uses the exact legacy path, including hashes. Do not casually append keys to an object the old validator rejects.
4. A versioned mapping profile defaults to **None**. A later reviewed profile may propose semantically compatible dimension inputs, but must validate family/axis/grid/lookup conditions and require an explicit reconciliation. No r10 output directly populates CE-LINE positions or motor/drive choices. Source adoption, study review, quantity review and commercial receiving remain separate decisions.
5. Facility dimensions are scoped observations, adopted/overridden/unknown explicitly, with copied values and exact source version/hash. Current Facility objects are mutable and their history API returns audit events; retain enough values at adoption to reproduce the original source basis. Do not rely on a non-existent full historical Facility endpoint or convert ES-02 Text/Zones facts to geometry.
6. Save server-computed results, assumptions, findings, geometry definition/implementation hash, precision policy, compact panel grid/schedule and versioned canonical drawing model in the immutable run. Preserve older schemas/serializers and renderers. A saved model renders without consulting current Facility, catalogue, defaults or browser viewport. Export is an exact-run read under current authority, never a standalone JSON restore.
7. Use existing rational arithmetic for finite decimal inputs, grid and compatible products/sums. Confine non-rational trig/square-root/arc calculations to a versioned approximate numerical module. Retained results explicitly identify approximation and tolerances; they are not represented as exact rationals. The build plan specifies a proposed computational precision contract, not an installation tolerance.
8. Add a seventh local view, Geometry & drawings, within the current full-bleed `ppo-specialist` shell. Stacked front/side/plan sheets, linked numeric inspector and preliminary schedule reuse current controls and recovery. Preserve quantity cut/bay working. No new global navigation item or r10 shell.

## Alternatives considered

| Alternative | Assessment |
|---|---|
| Embed r10 in iframe / copy HTML into native page | Reject: duplicates state/context/shell, bypasses native authority and perpetuates import, hit-testing and export issues |
| Replace quantity engine with r10 | Reject: r10 lacks the 143 positions, manual finals, parts, pricing, grouping and historical rounding; axes differ |
| Add an independent GeometryStudy aggregate/service | Defer: no demonstrated separate lifecycle/reuse need; adds identity, permissions, transaction and recovery coordination |
| Store study as an unversioned extra property in schema 1 | Reject: breaks strict DTO/schema/hash contracts and historical reproduction |
| Put every drawing primitive in separate relational rows | Reject for now: no individual command/query lifecycle; compact immutable typed snapshots fit the current pattern and avoid unnecessary joins |
| Store only current inputs and redraw using latest renderer | Reject: new maths, source defaults or viewport would change historical evidence |
| Generic user-editable formula engine / new graphics framework | Reject: bounded pure family functions and SVG cover demonstrated needs; complexity/security cost lacks a proven benefit |

## Consequences and compatibility

A future additive migration is likely: `specialist_drafts` currently checks proposal schema 1. New schema-2 and source-binding checks must coexist with it, and exact run-size/identity guards remain. Prefer no new business identity and no new capability. Keep source relationships explicit and database-checked using the existing binding-guard pattern; add a subordinate relational binding only if refreshed-main inspection demonstrates that JSON checks cannot enforce the required relationship without undue complexity. Do not edit migration 0040/0041 or backfill invented studies.

Quantity hashes and results for existing schema-1 records must remain identical. For schema-2 studies, a separate review-basis hash adds relevant study/source/mapping identity conservatively without changing the old quantity calculation hash. A new receiving policy is required before geometry-bearing runs can be admitted beyond the existing exact fixture; the old server-owned policy must not accidentally accept an ignored geometry payload.

Run/renderer size and supported family count limits must be demonstrated before schema selection is final. If the declared 256 KiB request or 2 MiB snapshot bounds are exceeded by valid bounded content, return an explicit unavailable/budget error and revisit representation. Do not silently truncate data or enlarge shared limits. Drawings are preliminary study outputs; CAD, business document issue, supplier approval and live SharePoint remain separate.

## Acceptance and implementation gate

The [build plan](../delivery/es08-geometry-build-plan.md) provides WP-G00–G09 and ES08-G00–G24; the [mapping register](../delivery/es08-geometry-mapping.md) is the proposed adapter boundary. The [future prompt](../delivery/es08-geometry-implementation-prompt.md) is inert until separately invoked for implementation.

PR #277 touches shared Discovery/costing, receipt dispatch, shell integration and migration consumers. Actual implementation begins on a new worktree/branch from then-current main after concurrent work is resolved. Refresh the schema, PR diff and plan before assigning any migration number. This audit branch must remain documentation/reference/evidence only.
