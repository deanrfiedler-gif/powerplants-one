# Native synthetic cost sources — architecture decision

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 24 September 2026. Status: implementation decision under the authorised native programme; commercial policy, owner acceptance and deployment remain separate.

## Context and choice

The [native programme](estimating-native-programme.md), [E3 decision pack](../delivery/estimating-e3-decision-pack.md) and [supplier-source design](supplier-pricing-cost-sources-design.md) authorise manually authored synthetic source versions and deliberate estimate refresh. The existing PostgreSQL domain services, scoped grants, shared operations and native Next.js shell remain the implementation technology. No new dependency, service, catalogue connection or infrastructure is needed for sources. Excel parsing is a separate dependency decision before its native parser is chosen.

Store immutable source revisions and immutable review events behind a versioned source header. Submitted content cannot be edited: correction creates a successor draft with a reason. The content hash covers explicit supplier/item identity, evidence, unit, currency, source/effective dates, known expiry and quantity tiers. Source UUID, source revision UUID/number, header concurrency version and review event are distinct. A human-readable synthetic source reference is an explicitly local label, not an invented ERP key or governed record-type code.

Use AUD, excluding tax, the current quantity/price bounds and scaled-integer HALF_UP estimate arithmetic. Supplier currency conversion, unit conversions, landed allocation and commercial thresholds remain Not configured. An absent validity end date is Unknown, not perpetual supplier validity. Source review means evidence checks complete, not catalogue publication or estimate/quote approval. Reviews require an explicit scoped source-review capability, a different author and a rationale. A separately labelled synthetic reviewer fixture demonstrates that boundary; it grants no operational approval authority.

Bind adopted source evidence to individual lines of the exact immutable estimate version through sidecars. Do not change schema-1/2 JSON, historical hashes or retained manual source strings. A price refresh first shows the selected saved lines, old/new source versions and exact cost effects. One explicit original operation then checks present authority, expected source/estimate/discovery state and the reviewed comparison, and creates one estimate successor. All untouched line identities, sell prices, scope basis and specialist lineage are retained. An increase beyond a saved sell is refused under the existing synthetic arithmetic policy; the user must deliberately revise pricing, never inherit or auto-calculate it.

## Alternatives and constraints

Reuse the existing actor-bound, same-tab recoverable-command journal for these synthetic online commands. A bounded pending command retains its exact authored payload until an explicit retry or receipt reconciliation; acceptance reduces it to an operation pointer. Identity change clears mismatched journals. Unsaved form editing remains in memory. This is not an offline supplier catalogue or permission cache. An unavailable receipt never authorises a replacement operation.

The permission catalogue adds one source-review duty. Generate AD-01 into `docs/design/access-review/access-review.html`, a versionless working master, while preserving the issued r01 HTML bytes. The existing builder and model/browser checks now target that working master. Its updated catalogue is not owner acceptance of the design.

- Adding typed provenance to every legacy line would alter old command/hash contracts and fabricate evidence. Immutable sidecars allow current sources while preserving original E1/E2 bytes.
- A live supplier/ERP catalogue requires verified endpoints, entity keys and receiving/recovery authority absent from this task. Manually authored synthetic records remain explicit.
- Repricing in place or refreshing on page load would erase the reviewed basis. Preview and successor commands keep historical estimates and quotations unchanged.
- Adopting the standalone JavaScript model would bypass PostgreSQL permissions, concurrency and durable receipts. Its five-view design is UX evidence; current domain patterns own implementation.

## Delivery and integration

The source increment is stacked on workload PR #301 (`f929312`) to keep its reviewed navigation and guide changes separate while CI runs. The parent changes no schema; source work stays in its own worktree. Rebase onto integrated current main before merge, rerun the affected checks and preserve unrelated work. Current main is `ca006fb1` with migration 0044; active Equipment, Engineering and Sales worktrees also contain new migrations, so inspect and reconcile the registry at migration creation and again before integration. No number is reserved here.

Traceability: PPO-010, EST-04/05/07, ES-03, BP-02/ADR-0003 and ADR-0027. Required proof includes immutable history, explicit source adoption, no automatic repricing, exact comparison, same/different-payload replay, stale source/estimate refusal, scoped revocation, atomic rollback, original-receipt recovery and upgrade/reseed preservation. Source and quote customer-safe projections remain separate.
