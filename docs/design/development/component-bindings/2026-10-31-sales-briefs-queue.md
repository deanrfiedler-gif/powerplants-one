# Sales briefs queue — component consumers

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. [Page contract](../pages/route-estimating-intake.md); [execution evidence](../../../testing/evidence/sales-briefs-queue/README.md). Application acceptance pending.

## application-shell

SecondaryMenuFrame opts into shared workspace styling through data-ppo-workspace="shared"; the compact phone header and current navigation remain authoritative. No CSS ID list grows.

## register-table

RegisterTable hosts fixed checkbox/action ends, 40 px cells, newest-update ordering, optional columns and explicit pagination. Counts come from the full permission-scoped submitted population.

## buttons

Shared Button/ButtonLink retain native names and focus. Sequence and CSV only operate on selected current-page revisions; the native brief owns all receiving decisions.

## menu

WorklistChoice/Menu provide customer/owner choices, search, row handovers and column visibility. The phone snapshot More keeps the shell menu and Conversations reachable.

## dialog

The large snapshot uses a native modal dialog with Escape and opener focus restoration; WorklistPanel hosts search/filter and phone selection. No receiving form is added.

## tabs

RecordTabs/RecordPanel keep Clarification initially active and Evidence keyboard reachable. Immutable revision history remains separate.

## read-state

Current-authority reads clear denied/failed evidence. Basis changes discard selection; partial counts are visibly lower bounds. The queue opts into serialized polling in useCrmResource: a slow read is allowed to finish before another timer/focus refresh starts. Explicit refresh and query/identity changes still invalidate older reads. The same opt-in applies narrowly to HandoverList’s receiving/preparation list read, preserving both Sales handover lists through slow reads. Their layout, filters, state projection and commands are unchanged. Native record reads and remaining consumers retain the hook default; native uncertain-save recovery is unchanged.
