# Owned reconciliation of an unknown reservation outcome

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. 4 October 2026. Implementation decision under the authorised ES-07 increment; independent review and operational acceptance pending. ES-07 / SC-05/09 / EST-03/08/09 / SCM-01/02/08 / IF-03 / AT-05/26.

## Current-main reconciliation

Refreshed main is #344 merge `3b1daba3a3738afe8b53700de2efb9e14a28d30a`. GitHub confirms the final head `16d3767bc7f6f446169b9cd74f9f0bbb9a4e6721` and 29 successful checks. Post-merge checks were still running at initial inspection; their eventual result is recorded separately in this increment's execution evidence. No open PR or suitable unfinished dependency contribution was found. Isolated `codex/quotation-dependency-followup` preserves Excel import, other worktrees and retained proof databases. Earlier failed heads remain failed historical evidence. No deployment is inferred or performed.

## Selected action and native authority

SYN-ES07-04 extends the existing accepted Supply referral with **ReconcileReservationOutcome**. The dependency is one current `supply_facts` ExternalOutcome on the exact converted Demand, with effect Reservation and state Unknown. The existing `Supply:Fact:ExternalOutcome` command already permits a successor observation with the same source operation and effect. Apply records a Complete observation of Confirmed, Failed or Absent, an explicit observation time and original-operation lookup evidence. The original fact remains immutable. Receipt absence is never evidence of Absent.

This changes native evidence and the demand's version/history; it neither performs nor reverses the external event. Reservation commands remain Not configured. No demand classification, quantity, allocation, supplier commitment, fulfilment or stock balance changes. All common-unit decimal quantities and shared allocations remain exact. Other demands and linked Supply records remain unchanged. New observations do not erase separate Reservation facts, child records, impacts or the allocation-action hold.

Current source/quotation access, Supply read and `supply.coordinate` are required before review, execution, history or original recovery. Only the accepted referral's currently permitted owner reviews/applies. Review freezes the exact fact/predecessor, demand version, complete current dependency position, proposed native command, actor/server time and reason/evidence. Apply rechecks all current versions, acceptance, source evidence and authority under the existing workspace lock. Other unknown external outcomes on that demand require their owning reconciliation first, as the native command requires. Unsupported effects, already reconciled predecessors, partial observations and source-identity changes are held. Retain, Return and Hold remain available with their existing semantics.

## Architecture and alternatives

Reuse TypeScript/Next/PostgreSQL, the subordinate immutable event stream, original journal, operation reservations and atomic receipts/audit/outbox. Extract the existing native fact transaction body so both entry points execute the same validation and effects. Extend the existing review command; no route, capability, grant, seed, identity, framework, dependency or service is introduced. An additive migration extends checks and native evidence guards without rewriting earlier rows or installed migration bytes.

Receipt/inspection correction would affect shared usable capacity and needs a wider receiving/effects contract. Picking, movement, custody and returns carry further quantities and independently owned decisions. Purchase cancellation, approval withdrawal and reservation release have no adopted external command. A note or Activity completion would not reconcile native evidence. Original unknown reservation reconciliation is therefore the smallest useful executable dependency slice. It may leave every quotation quantity action held; fresh explicit ES-07 retention or continuing hold remains meaningful and required.

Relevant source corrections, successor issues, response/acceptance changes, dependency versions, shared-supply changes and revoked authority hold unapplied reviews. Unrelated records do not. Replacements preserve predecessors; competing work on the target remains serialized. Outcome binds the acceptance, exact review, native operation/original receipt and resulting position. Old dispositions cannot apply across the new demand version or returned outcome. A fresh ES-07 review/application resolves only its reviewed exception; independent operational holds remain.

MYOB remains intended ERP authority; SharePoint owns business documents; native CAD retains authoring. Operational signing, authority, age thresholds, item governance, commercial terms and live mappings remain Not configured. No merge, deployment, live transaction or external business communication is authorised.
