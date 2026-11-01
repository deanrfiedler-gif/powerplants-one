# Engineering workload component consumers

Owner: Dean Fiedler. EN-01 / ENG-01–ENG-04. Implementation and visual acceptance are separate.

## application-shell

Engineering rail author-action count, shared secondary menu/phone header and five-icon Engineering phone bar. The bar applies to the Engineering department; other pages retain their own content.

## register-table

Accepted 40 px single-line grid with server sorting/paging, fixed end columns, keyboard resizing, unobstructed multi-page controls and exact-source selection; flush phone rows replace the grid.

## buttons

Native request/coordination actions and read-only selection handovers; busy/denied/uncertain states retain native authority.

## fields

Existing request and coordination fields retain validation, reason, expected version and uncertain-operation recovery.

## lookup

Recorded inactive owners remain filter choices; context-bound native owner lookups alone supply assignment choices.

## validation

Native validation, stale version and original-operation retry preserve the user's authored draft.

## tabs

Deliverables, Queries and Reviews & issues preserve URL section and draft notes; unavailable technical reads withhold counts.

## menu

Shared register actions, recorded-owner/discipline choices, column settings, package actions and phone sheets.

## dialog

Overlapping package snapshot, native intake dialog and accessible phone selection sheet with Escape/focus-return and blocked-save handling. The shared EngineeringModal accepts an optional close icon while preserving its existing default. The phone snapshot uses a back icon and untruncated reference; WorklistPanel retains its shared focus behaviour with scoped sheet spacing and 44 px targets.

## read-state

Loading/empty/denied/error/stale/refresh states withhold unconfirmed facts; independent technical read failure remains explicit.

## status

Only native Queued, In design and Awaiting information chips; technical release and attention retain their native predicates.

## Evidence and limits

The [route contract](../pages/route-engineering.md) defines source-bound counts, selections and exact-package handovers. Native state fixtures and recovery checks are in `tests/browser/engineering-register.spec.ts` and `tests/browser/engineering.spec.ts`. The [execution ledger](../../../testing/evidence/engineering-workload/README.md) records actual outcomes. Phone selection uses a shared sheet rather than an unlabelled long-press gesture and remains for owner review. Missing technical facts are not zero; no utilisation, effort, availability or health score is inferred. No review fingerprint is assigned.
