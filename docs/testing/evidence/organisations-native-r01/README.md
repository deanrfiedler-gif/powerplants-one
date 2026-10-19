# Organisations CS-01 native evidence

Owner: Dean Fiedler. Status: local synthetic verification in progress; owner/device review, baseline acceptance, merge and deployment separate.

Source: [accepted Organisations D1–D7/Q1–Q4](../../../decisions/organisations-figma-design.md), [icon-free r01 captures](../../../reference/ui/customers/organisations-design-r01/README.md). Implementation: [CS-01](../../../decisions/organisations-figma-implementation.md). PR: #604. Named Figma version remains pending in the source. No live Figma calls or writes.

The isolated worktree uses its own loopback app and PostgreSQL 16 `ppo_synthetic_test` cluster, with `max_locks_per_transaction=1024`. No shared-main service/database is used. The Font Awesome Kit is unconfigured; captures show local fallback glyphs. Runtime content is authorised synthetic fixture data, not the Figma story.

## Capture pairing

Captures and final command results are being assembled. Results are not yet declared complete. Controlled loading/unavailable/denied captures are fault injection over the actual host; all other states use real source reads.

## Known adaptations for review

- The existing shell owns header/search/department navigation. Register search is an additional local control. 44 px controls accommodate touch; rows wrap real long identifiers.
- Open service remains Unknown. Work-order status does not establish closure; no combined request/order/visit calculation is invented.
- Existing Customer 360 quotations include saved estimates and Draft revisions, not a complete issued revision history. Rows identify their kind; unknown lifecycle is excluded from open/closed filters with an explanation. Financial amounts without a verified basis are omitted.
- Visits and generic customer documents have no connected customer read here; handover remains explicit. Source Partial is retained.
- Last-change author, record position and readiness are omitted or unknown. Current site roles and permitted people are actual reads. Lead selection retains explicit LC-12 review/save. Notes retain Internal visibility.
- The old Customer 360 implementation still uses bounded per-record domain authorisation reads; this change does not claim to eliminate that inherited N+1 path. The new register is one SQL snapshot with bounded signed pages.

No owner or physical-device acceptance is inferred from automated checks.
