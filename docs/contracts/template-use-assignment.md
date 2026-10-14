# DK-06 controlled template use API

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Status:** Synthetic R4 backend; independent review, owner acceptance, native controls and deployment separate.

## Scope and authority

The [decision](../decisions/template-use-assignment-backend.md) adopts exact company/site applicability for OUT-09 Internal job packs. Assignment requires explicit template.assign, template.read, pack.read, Service pack.check, current working-company/site/shared authority and the publication's original/current source authority. The publication must belong to that same company/site, retain its exact hash and remain supported by the unchanged R3 renderer. No seed grants the new duty. The assignment actor may be an author; the separate R3 publication already required an independent reviewer and publisher.

Read access requires template.read and pack.read plus current scope/source permissions. Original recovery also rechecks the actor's current assignment and Service duties, including a named predecessor's source. Normal pack preparers, checkers and issuers retain their existing domain/source duties; they do not acquire template-management grants.

## Endpoints and exact command

All paths start with /api/v1 and reuse current identity, origin, strict JSON, no-store and actor-private operation handling.

| Endpoint | Outcome |
|---|---|
| GET /document-template-use-policies?company_id=…&site_id=… | Current policy version (0 before adoption), pinned baseline, current server-time selection or hold, and permitted assignment history. Optional limit 1–50 and after UUID; filter source permissions before paging. Selection is policy resolution; the template catalogue separately reports renderer support and all new rendering rechecks it. |
| POST /document-template-use-assignments | Atomic immutable assignment, site policy-version advance, audit, original receipt and TemplateUseAssigned event. |
| GET /document-template-use-assignments/:id | Original interval and approval evidence, with derived successor/end and trusted read time. |
| GET /operations/:operation_id | Exact actor-private original receipt after current authority checks. |

Require operation_id, schema_version:1, reason, id (assignment UUID), company_id, site_id, publication_id, definition_hash, expected_policy_version, baseline_template_id, baseline_policy_version, baseline_hash, effective_from, effective_to, predecessor_id and approval_note (1–2000 characters). Every field is explicit. effective_from:null means Now, resolved once from the database clock after the workspace lock; a supplied instant must not predate that acceptance clock. effective_to:null is open-ended; otherwise it must be later than the start. predecessor_id:null means no succession. Unknown properties and caller-supplied selection clocks are refused.

The baseline is the current workspace default before first adoption and the original retained baseline thereafter. A stale policy version, hash or baseline refuses the new command. The site policy version is the command-concurrency version. Each assignment also retains the version at which it was accepted; runtime snapshot policy_version refers to that selected assignment's version, not a later scheduled change. Its use_assignment_id removes ambiguity with the legacy workspace policy version.

## Time, overlaps and recovery

Intervals are [start,end). No two intervals may cover the same instant in one scope. Naming an exact earlier open-ended predecessor explicitly ends it at the successor's start. Its stored effective_to remains null; resolved_effective_to and successor_id expose the derived boundary. An already succeeded or closed assignment cannot be implicitly changed. Backdating, cancellation and rewriting an interval are unsupported in this increment.

Before the site's first managed interval begins, preparation uses the exact pinned legacy default, provided its pointer/version/hash have not changed. Sites with no policy retain existing behaviour. After a site's managed schedule begins, gaps return TemplateUseUnavailable. An unchanged current interval remains selected when a future successor is recorded. There is no company/site hierarchy or implicit overlap precedence.

The workspace lock serialises adoption with native commands. Both application resolution and SQL guards use database time; reservation and issue INSERT guards recheck after waits and durable-file verification. A changed selected assignment or uncovered interval refuses stale in-flight issue, retaining the original bundle for review. The existing pack basis reports template/policy drift. Issued bytes, recipient records, old publications and all original receipts remain unchanged; no pack is regenerated or automatically reissued.

An unchanged accepted original replays its exact receipt (200, versus initial 201), even after succession, expiry or renderer drift, under current authority. Changed originals return OperationConflict. Unknown outcomes retain their original operation ID; read or retry that unchanged intent. Atomic rollback leaves neither a head advance nor a partial assignment/audit graph.

Migration 0094 adds empty policy/assignment tables, a derived interval view, default-denied capability, typed identity/event and guards. Existing workspace pointers, records, seeds and grants are untouched. Native controls, other families, providers and operational authority remain separate. The workspace-level catalogue's selected_by_policy retains its original meaning; policy_selection_scope explicitly labels it WorkspaceDefaultOnly, while the new site policy API resolves scoped use.

Traceability: BC-03 / DK-06 R4; DOC-03/DOC-06, OUT-09, D-012/D-024 and AT-36. [Execution evidence](../testing/evidence/template-use/README.md).
