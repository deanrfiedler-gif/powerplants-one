# CPQ governed product costs and labour rates

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Backend implementation authorised 14 October 2026. Scope: BC-04, ES-02/ES-03 and existing EST receiving contracts. Review, operational acceptance and deployment remain separate.

## Decision before implementation

Continue the published Products contribution, PR #490, from corrected source `5ce7a1a`, in an isolated `codex/cpq-governed-costs` worktree. Main `bc9e3fb` includes Excel landed costs (#489). Read the live amended `cost_source_binding_guard`: it requires exact reviewed evidence, units, source label, date and selected tier, inserted in the estimate version's own transaction. Reuse that contract and the existing immutable CPQ release/run/adoption storage. No migration, grant, dependency or service is needed.

Introduce opt-in definition schema 4 over the bounded schema-1 arithmetic contract, with optional schema-2 Product references and selected Product/Labour parts bound to existing Cost Sources. At least one cost binding is required. Schemas 1, 2 and 3 retain their original validation, results and hashes. Combining schema-3 design authoring with governed sources remains separate. Extending a strict existing schema would reinterpret saved contracts; a second book database would duplicate independently reviewed Cost Sources. Neither alternative is justified here.

Each binding records native source/revision/review UUIDs, the exact revision hash, expected source header version, native reference/revision number and normalized source content. The server verifies every supplied field against retained evidence. The frozen content permits the same deterministic fixture and worker evaluation used for calculations, without external lookup or different preview prices. Existing part tiers continue to govern selling prices. Bound parts must use zero authored unit-cost markers; those markers are never a cost fallback. The selected reviewed source tier supplies the cost after quantity resolution and overrides. Unbound parts retain their existing authored costs. Only direct synthetic AUD, excluding tax, is enabled; FX and landed allocations need their existing separate receiving reviews and are not introduced here.

## Authority, history and deliberate refresh

Reuse company Cost Source read authority, independent exact-revision review, exact unit equality and `sourcePrice` date/minimum/tier rules. Unknown supplier expiry stays an explicit warning; it is not invented as an end date. Source evidence, supplier details, tiers, selected tier, pricing date and review attribution remain internal. Technical Product compatibility, stock and lead times remain separate.

Save, approval, activation, calculation and adoption recheck the exact source header version. Any later draft, review or successor therefore requires deliberate review of a new binding; never select latest automatically. The native source model has Draft/Submitted/Reviewed/Returned/Rejected, not a withdrawal state. An exact previously reviewed revision can be deliberately rebound with the current header version, consistent with native historical source selection. Missing/unreviewed evidence, revoked access, mismatched units and out-of-date pricing refuse use. Historical reads and original-operation recovery require current access and intact retained evidence, but do not require old sources to remain current.

Refresh means authoring and independently reviewing a successor CPQ release with explicit chosen source references, then calculating a successor run linked to the original. Existing comparison returns before/after exact line evidence and cost, sell, difference and margin totals. Changed source evidence changes override basis hashes, requiring explicit override review. Adoption still replaces only unchanged CPQ-owned lines and preserves unrelated manual lines and their source bindings. The shared native writer accepts explicit replacement line IDs so it can replace generated source bindings atomically, without inheriting duplicate or obsolete attribution. Existing estimate reads expose the exact typed source bindings; saved CPQ runs retain full explanation evidence. Customer quotation projection remains unchanged.

## Verification and limits

Prove exact reviewed product/labour prices, quantity tiers, unknown and expired validity, units, company/access isolation, changed sources, immutable history, deliberate refresh/margin comparison, preserved manual attribution, override safeguards, atomic rollback, concurrent/repeated commands, original-operation recovery and quotation privacy. Check legacy hashes, populated migration/reseed stability, compiled HTTP and actual application/PostgreSQL restart recovery. Record actual results separately from CI, independent review and operational acceptance.

No live source integration, new pricing policy, stock commitment, UI/Figma changes, merge or deployment. Operational owners, approved books/rates and commercial acceptance remain open.
