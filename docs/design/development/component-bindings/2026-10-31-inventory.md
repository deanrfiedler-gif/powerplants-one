# Inventory SC-05 component consumers

Owner: Dean Fiedler. Review: pending. [Design](../../../decisions/inventory-figma-design.md) · [Evidence](../../../testing/evidence/inventory/README.md).

## application-shell

SecondaryMenuFrame uses attributes to opt into the shared workspace. No secondary-menu counts; location rows are flat. Phone menu escape and focus return stay shared.

## buttons

Record observation hands to the native form; no Product link is recorded and Open product is disabled. Retry preserves filters and selection. Targets remain 44 px on phones.

## register-table

The register, quantity meanings and locations use RegisterTable. Snapshot selects one item, item links open its record. Unknown and known zero are separate fixture cases; overlapping location evidence never becomes an invented balance.

## read-state

usePlatformResource removes stale or denied content by identity/query generation. Loading, failure, retry and no-match fixtures preserve current permissions and URL state.

## Receiving lock-in integration — 1 November 2026

Merged PR #787 reserves Workshop between Inventory and Dispatch & delivery. Its existing unavailable state withholds it from rendered navigation; the contract reserves the native maintenance glyph: there is no Workshop route, new capability or manufactured handover. Inventory remains Supply-only. The rewritten Markdown guide remains InReview; its historical carry-over visibility exception is retired, and general-user publication awaits genuine review evidence under the current guide contract.
