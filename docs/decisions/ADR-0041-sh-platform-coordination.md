---
document_id: ADR-0041
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Implemented under the authorised SH-01–SH-06 task; source review and acceptance separate
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# SH platform coordination

Continue BP-02/ADR-0003: TypeScript, Next.js and PostgreSQL in the existing modular monolith. No dependency, provider, deployment or business authority is added. SH-01/02 retain the current desktop and phone My Work implementation and its overdue and next-action definitions.

## Decisions and alternatives

- SH-04 uses one registry of permission-scoped domain readers for compact search, full results and freshly authorised previews. Per-source cursors retain domain validation; partial reads identify failed sources and never assert a whole-repository total. Facility records include permitted organisation/site context and explicitly labelled physical-parent or grouping relationships. Served-area relationships remain separate. A separate index would introduce stale authorisation and infrastructure without a present need.
- SH-03 projects existing durable Activity audit events into a recipient inbox. Event identity and source revision remain immutable; source details, ownership and required-work status are resolved afresh. Personal read/archive state and versioned channel preferences are separate tables. Projection is idempotent and can catch up from retained events; no second messaging platform or external delivery is introduced. Opening does not mark read. Required owned Activities remain visible regardless of personal state. This is the initial real event adapter, not a claim of notification coverage for every domain.
- SH-05 explicitly registers eligible targets. Existing My Work storage and IDs remain intact; additional workspace preferences use a separate versioned store and the same personal contract. Unknown criteria versions are unavailable, never silently widened. No canonical Team/membership model exists at the inspected main; team sharing remains Not configured, dependent on AD-01. A department or role is not a team.
- SH-06 coordinates source-owned Service, Finance and persisted Engineering change work. Current source identity, revision, author, assignee and known timestamps define the six perspectives. Unknown due/submission dates remain unknown. Selected details are re-resolved; stale versions require refresh. Commands remain in their owning modules. No generic approval entity or policy is created.

## Reconciliation and delivery boundaries

The older My Work record's D10/D12 and Shared platform STATUS prose are historical: Engineering changes now record review and receiving state; this increment connects notifications. Existing standalone r01 files remain unchanged as issued design references, with the current r22 shell taking precedence. SH mappings retain CRM-03, DOC-06, NFR-01/05/08/11 and the distinct F04/F06 parent mappings.

General Documents/Knowledge discovery, broader event adapters, canonical teams, external delivery and business/device acceptance remain explicit dependencies. Exact issued-job-pack readers are connected; a file URL never confers access.

At branch creation only draft PRs #281 (Chrome runtime) and #282 (Facility LF bytes) were open. Neither is copied or rewritten. Refresh/rebase current main and rerun affected checks before publication; any unmerged browser-runtime dependency must remain explicit.

PR #281 subsequently merged as `c5280be`; this branch rebased onto that main before final verification and preserved both STATUS and document-register contributions. PR #282 remains independent. No browser guard is weakened.

The subsequent open-PR refresh found #283 had published ADR-0040 for its local development workspace. This new, unmerged SH decision was renumbered from ADR-0040 to ADR-0041 before SH publication to avoid that collision. Its initial decision-before-code history remains in the branch; no parent requirement or issued reference changed.
