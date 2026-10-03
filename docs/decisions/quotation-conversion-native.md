# Exact synthetic receiving and demand conversion

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Implementation authorised by the ES-07 instruction; operational policy and owner acceptance remain separate. ES-07 / EST-08/09 / IF-01/02/03 / EA-13/14 / AT-05/26. All parent IDs and issued references remain unchanged.

## Reconciliation and architecture

Refreshed main is `e3bbb76fb97bd4271bc657b0e6c2e6231ec24707`, merging ES-06 #341 after all 24 final-head checks succeeded. ES-04 #338 and ES-05 #340 are integrated. Older pre-merge handover text is superseded by that evidence. No competing ES-07 branch or open PR was found. The isolated `codex/quotation-conversion` contribution preserves Excel import, every other worktree and retained proof database. A new task-owned synthetic PostgreSQL instance supplies live-schema inspection; migration 0061 follows 0060 and preserves reservations 0051/0052.

Reuse the existing TypeScript/Next/PostgreSQL monolith, quotation aggregate, shared command transaction, permissions, actor-bound journal and native Supply Chain command contract. Append immutable receiving, line-resolution, reviewed-plan and execution evidence beneath the exact quotation revision. Separate immutable target links bind real Supply records and their original revisions to the plan. Mutable status flags would erase corrections; a standalone receipt or simulated adapter would not create the requested downstream records. No technology, dependency, service or external integration is added.

## Smallest supported target

`SYN-ES07-01` converts every included **Product** line of the one accepted manual option into a native **Supply Demand**, class **Forecast**. The existing SC contract explicitly supports fictional coordination origins, free-form item references, exact six-place quantities and separately owned follow-up. Labour, Freight, Engineering and Subcontract lines remain in the frozen commercial basis, with no material-demand effect. This is a target-type boundary, never partial commercial acceptance. Offers without Product lines have no supported target in this increment.

The target provider/configuration is explicitly `Synthetic` / `PPO-Native`, company is the source company UUID, and entity is `SupplyDemand`. Its external-key-shaped correlation identifies a native synthetic target, not an ERP mapping. No ERP customer/item/order key is manufactured. Customer/site identities are existing internal records. Exact source units must fit the existing target contract; no unit conversion, tax, FX, price or rounding rule is introduced. Frozen commercial evidence retains the authoritative saved source and issued customer-safe snapshot without repricing.

The adopted native target accepts a one-off item reference, without creating a catalogue master. Resolution therefore records an explicit **OneOff** identity scoped to the exact source line, display label, unchanged unit, evidence, actor and time. External item mapping remains Not configured. Missing, Ambiguous, Obsolete and Incompatible resolutions are visible holds. An operational catalogue binding, item creation/reactivation, synchronisation or sales-order write needs its own adopted contract; the reference HTML's hypothetical tax, item provider and eleven-target simulation are not adopted.

## Decisions, applicability and recovery

Receiving explicitly names the ES-06 preparation, issue/output and response. Received, Held and Returned are separately attributable decisions with reason, evidence and owned follow-up. Corrections name the preceding receiving decision and append; they never fabricate sending. Received rechecks current unconditioned acceptance, unresolved clarification and negotiation, current issue and retained output. Authority, signing, validity/expiry, withdrawal and operative terms remain Not configured and visible. Receiving creates no legal approval or work authority.

Existing scoped `supply.coordinate` plus full quotation/source and Supply reads govern these synthetic decisions. This is a distinct receiving duty from quotation preparation; the same fictional coordinator may hold both. Operational separation of persons is not invented. Plans bind exact receiving and response identities, all accepted source lines, exact Product resolutions, company/entity, proposed target IDs/commands and current customer/site target basis. Review is an explicit decision, separate from execution. A replacement names its predecessor and preserves it.

Only relevant source changes hold a plan: changed response, issued successor, receiving correction, Product resolution or target basis. Later unissued drafts, price observations, unrelated source records and distribution facts cannot change an issued offer. Completed targets remain facts after any later exception. A quotation aggregate cannot execute again via a changed command, replacement plan or successor issue; deliberate replacement scope is later work.

Execute all target creates and their original command receipts together with the conversion evidence in one PostgreSQL transaction, using the native Supply create implementation. Durable uniqueness on quotation aggregate and source lines complements command replay. There is no partial database execution; a lost HTTP result remains uncertain in the browser and must recover the original. Receipt absence never proves failure. Replays return the original receipt under current source and target authority, including after supersession or PostgreSQL/application restart. Linked target access also requires the original quotation's current read authority.

## Evidence and presentation

Use r20 Document & evidence workspace with guided decisions and target review, native shell, shared fields/buttons/status and the existing recoverable-command journal. Incoming ES-06 and outgoing native Supply handovers stay explicit. Exact accepted native reference images are unavailable; design, functional proof, inspected layout, visual acceptance and deployment remain separate. SQL/permission/concurrency/rollback, HTTP, compiled desktop/mobile, restart and populated upgrades must be proved. MYOB remains ERP authority, SharePoint business-document authority and CAD native authoring authority.
