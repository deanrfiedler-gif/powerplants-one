# Native Maintenance and Warranty handover

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Review: implementation verification in progress; owner/business/device acceptance pending. No deployment or external transaction.

## Baseline and scope

The authorised programme implements MA-01–MA-07 / SVC-12.1–SVC-12.5, linked to PPO-015 (#15), AT-19/AT-33 and relevant AT-25. Fetched main was `0f10b7fb46a8ab512e9b019573ece272cf5920b9`. Open PR #314 was unrelated ES-02 documentation. Native Equipment/Sales/Engineering/cost-source work through migration 0048 was present; MA and SC-08 native returns were absent. The original `docs/field-quality-build-plan` checkout and its unrelated edits were preserved. Implementation uses `feat/maintenance-warranty-native` in a separate worktree.

## Delivered application

Seven permission-scoped registers and seven detail workspaces use the current shell and source guides. Typed migration 0049 preserves agreements, entitlement decisions, task revisions, original-due occurrences, renewal reviews, warranty cases/customer outcomes and supplier recovery. Source revisions and decision events are immutable. The [contract](../contracts/maintenance-warranty-api.md) records exact commands, receiving rules and bounded reads; [ADR-0049](../decisions/ADR-0049-maintenance-warranty-native.md) records architecture and alternatives.

Existing Work Order coverage remains separate. Owned requests enter real Service intake; reviewed Service results are checked against exact authority, task and asset evidence. Equipment remains canonical and marks affected plans for review. Sales Aftercare reads native agreement/renewal sources. SC-08 and live ERP receiving remain explicitly unavailable; external evidence does not simulate their transactions.

## Verification ledger

Verification is ongoing. The final ledger will record exact commands/results, reviewed screenshots, baseline failures and source head. No unexecuted test or uninspected image is accepted by this document. See [evidence index](../testing/evidence/maintenance-warranty/README.md).

## Review boundaries

The original r01 HTML/report and all 78 parent requirement IDs remain unchanged. Native adaptations (cards, wrapping, disclosures, current route names/shell, server persistence) are exposed in every live page contract. Guide and visual review records remain Draft/Needs review. Local synthetic proof does not establish operational warranty policy, production integration, customer communications, owner acceptance or deployment. No live messages, credits, stock movements or bookings are caused by this implementation task.
