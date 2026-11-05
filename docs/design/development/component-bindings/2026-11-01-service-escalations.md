# SV-08 component consumers

## application-shell

Bound by the [SV-08 page contract](../pages/scope-sv-08.md). The synthetic case uses the existing shell, shared register, Buttons and read-state patterns. Fixtures cover diagnosis, reviewed evidence, sending facts, replies, failure, denied access and uncertain recovery. Codex inspected desktop, tablet and phone comparisons; the [comparison ledger](../../../testing/evidence/service-escalations/README.md) records differences. Owner acceptance is unrecorded.

## register-table

Bound by the [SV-08 page contract](../pages/scope-sv-08.md). The synthetic case uses the existing shell, shared register, Buttons and read-state patterns. Fixtures cover diagnosis, reviewed evidence, sending facts, replies, failure, denied access and uncertain recovery. Codex inspected desktop, tablet and phone comparisons; the [comparison ledger](../../../testing/evidence/service-escalations/README.md) records differences. Owner acceptance is unrecorded.

## buttons

Bound by the [SV-08 page contract](../pages/scope-sv-08.md). The synthetic case uses the existing shell, shared register, Buttons and read-state patterns. Fixtures cover diagnosis, reviewed evidence, sending facts, replies, failure, denied access and uncertain recovery. Codex inspected desktop, tablet and phone comparisons; the [comparison ledger](../../../testing/evidence/service-escalations/README.md) records differences. Owner acceptance is unrecorded.

## read-state

Bound by the [SV-08 page contract](../pages/scope-sv-08.md). The synthetic case uses the existing shell, shared register, Buttons and read-state patterns. Fixtures cover diagnosis, reviewed evidence, sending facts, replies, failure, denied access and uncertain recovery. Codex inspected desktop, tablet and phone comparisons; the [comparison ledger](../../../testing/evidence/service-escalations/README.md) records differences. Owner acceptance is unrecorded.


The shared My Work detail uses ButtonLink for the currently authorised source-case return link. It hides that link when the case is no longer permitted; generic editing cannot change the case-owned chase date or owner. Existing Activity execution remains available.

Review repairs, 4 November: Refresh retains the mounted register rows and marks the register busy until its read settles. A failed read still hides rows/counts. History uses the same plain-English action labels as the command controls. Browser fixtures assert retained row identity during a delayed refresh and the reply label in History; execution is left to GitHub CI because this environment has no Chrome. These changes do not grant visual acceptance.
