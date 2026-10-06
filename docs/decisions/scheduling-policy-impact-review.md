# Scheduling policy impact review

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Date:** 27 September 2026
**Status:** Bounded implementation decision under Dean's instruction to proceed; owner, visual and operational review remain separate.

## Context and decision

PT-28 / AT-35 requires changed scheduling rules to flag affected future work without silently changing bookings or issued content. ADR-0010 freezes published policies and pins bookings to their exact policy. API-C26 publication, publisher authority and owned impact tasks are still planned. The compatible-update proof does not close these obligations.

Implement the first review component within PL-04, using the existing TypeScript/Next.js/PostgreSQL stack, current permission predicates and shared controls. A read-only repeatable-read transaction compares one exact published synthetic policy with a proposed maximum visit duration and future effective instant. No new dependency, capability, migration or persistent proposal is introduced. Reserved migration allocations 0051/0052 remain unchanged.

The scenario retains all other policy terms, including the original expiry and mandatory contact/crew rules. It evaluates permitted Confirmed bookings pinned to that policy, with no actual start/end and a future start at the database snapshot time. Half-open intersection applies: a visit ending exactly at the proposed effective instant is outside the scenario; a crossing visit requires review. A duration equal to the proposed maximum fits; travel is not visit duration. Started, completed, cancelled, proposed and differently pinned work are excluded explicitly. This is a duration/effective-date comparison, not a second complete booking validator.

Return exact source identity/version/hash, proposal hash, snapshot time, appointment/schedule/assignment versions, owner identity and review reasons. Results cover only currently permitted bookings, optionally one permitted site. Refuse more than 200 matching bookings instead of silently truncating or claiming workspace completeness. An unchanged duration is valid as an effective-date-only scenario. A zero-result response is labelled within this limited comparison, never permission to publish or dispatch.

Changing input or identity removes displayed results; refresh re-evaluates current records. The user can open the existing controlled appointment/change workspace. Analysis creates no Activity, receipt, outbox event, reservation, dispatch hold, policy revision or document issue. A review reason is transient analysis, not a saved impact task or approval.

## Alternatives and trade-offs

| Alternative | Assessment |
|---|---|
| Read-only native impact review, selected | Small independently useful increment; tests boundaries and scope before introducing publication authority. Requires a later transactional publication implementation. |
| Publish a successor now through existing schedule.manage | Rejected: booking authority is not business publisher authority; no durable review/submission/head model exists. Would conceal a material authority decision. |
| Direct SQL or deployment-time policy replacement | Rejected: bypasses controlled publication, original receipts and future-work ownership; immutable issued references must remain exact. |
| Generic rule engine or separate service | Rejected: unnecessary technology and unbounded rule authoring for the predefined synthetic policy set. |

## Publication continuation

Before API-C26 can be implemented, define a dedicated synthetic publisher grant and immutable reviewed proposal, publication/impact records and effective policy selection; reconcile the migration sequence rather than occupy reserved slots. Publication must acquire the same workspace graph lock as booking commands, re-read current permissions, exact policy/proposal versions and every affected booking, and refuse stale impact evidence. Commit successor, owned impact tasks, audit/outbox and original-operation receipt atomically. Booking pins and issued bytes remain unchanged. Define how unresolved reviews affect future dispatch explicitly; do not infer it from this preview. Original receipt recovery must refuse altered retries. Future-dated rules and overlapping successor windows require deterministic selection.

Traceability: SVC-04/05, DAT-06, NFR-08, D-015/D-020, TR-03/08, API-R04, planned API-C26/EVT-12, PT-08/09/28 and AT-35. All existing parent IDs retain their scope. MYOB, SharePoint and native CAD authority are unchanged. No live integration, production deployment or business acceptance is implied.

The next bounded [publication design](scheduling-policy-publication.md) and [implementation plan](../delivery/scheduling-policy-publication-plan.md) reconcile migration allocation and define exact review, authority, selection, atomicity, impacts and recovery. This preview remains read-only.
