# Native Maintenance and Warranty contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation contract for review; business and visual acceptance pending. Authority: [ADR-0049](../decisions/ADR-0049-maintenance-warranty-native.md), BP-01 SVC-12.1–SVC-12.5 / PPO-015. Acceptance traces: AT-19, AT-33 and relevant AT-25. This is a synthetic application contract, not warranty policy.

## Resources and commands

Every resource has a stable UUID, human reference, company/customer/site scope, owner and optimistic record version. All commands use schema_version 1, operation_id and reason. A new mutation checks expected_version; immutable assessments are new identities, and case-bound assessments/claims additionally check expected_case_version. Current actor and source authority precede original receipt replay. Audit, receipt, outbox and typed rows commit through sharedOperation in one transaction. Identical retries return the original receipt; changed-content reuse conflicts. GET responses retain the existing no-store HTTP envelope and denial behaviour.

| Scope | API root under `/api/v1` | POST create / detail actions |
|---|---|---|
| MA-01 | `maintenance/agreements` | Create proposed source revision; Revise, Approve, Withdraw |
| MA-02 | `maintenance/coverage` | Create immutable entitlement assessment; historical detail is read-only |
| MA-03 | `maintenance/plans` | Create sourced plan/task revision; Revise, Review, Hold, Generate |
| MA-04 | `maintenance/due` | Generated only; Defer, Skip, Cancel; `/{id}/prepare-work`, `/{id}/receive-result` |
| MA-05 | `maintenance/renewals` | Create exact agreement review; Proposal, CustomerReview, FollowUp, CrmHandoff, ServiceHandoff, Close |
| MA-06 | `warranty/cases` | Create failure context; AddEvidence, ReviewEvidence, ReviseSource, Plan, Goodwill, Authority, UpdateCustomer, CustomerResponse, ResolveCustomer, ReviewReplacement, AssignReview; receiving subroutes as MA-04 |
| MA-07 | `warranty/supplier-recovery` | Prepare exact case package; Submission, Response, ReturnEvidence, Credit, CloseUnrecovered |

Each root provides GET register and `/{id}` GET detail. The public TypeScript validators in `src/maintenance/model.ts` and command modules define the closed payload fields. InvalidData identifies fields; VersionConflict retains the draft; SourceReviewRequired requires an owned source/receiving decision. Unknown/missing/inaccessible records remain non-disclosing. `maintenance/options` returns bounded permitted canonical selectors; it never grants command authority.

## Exact source and immutable history

Sources retain reference, revision, availability (Available, Partial, Unavailable, Unknown), source date, content/reference basis and Internal/RestrictedService/RestrictedFinance classification. Source read permissions are checked on each request, including historical revisions and linked receiving evidence. Issued source files are not ingested or changed by this command model.

Agreements retain typed site/asset/facility inclusions and exclusions alongside immutable source content. WholeSite and SelectedFacilities have distinct meanings. Explicit exclusions win. A proposed successor replaces currentness but cannot use the prior commercial decision. Dates, source availability and lifecycle must support the event before Covered is permitted; the reviewer still supplies a reasoned basis and separate causation. Dates alone never determine warranty.

Entitlements are separate from existing immutable Work Order `coverage_assessments`. The optional entitlement_assessment_id links an exact managed assessment into Work Order coverage. Saving and authorising scope recheck current entitlement, matching customer/site/assets and exact agreement reference/source revision. Existing unlinked coverage and historical payloads retain their prior semantics. A later assessment for the same event/context supersedes earlier decisions even if source bytes did not change.

## Recurrence and Service receiving

Only sourced Monthly/Quarterly recurrence is supported. Anchor and IANA timezone remain stable within a plan; monthly dates clamp to month end without drifting the anchor. Explicit generation is inclusive and bounded to the plan's 1–12 month window and at most 100 dates. The unique key is workspace + plan + original_due. Overlapping windows and retries retain one obligation. Reviewed successors apply prospectively to ungenerated dates; historical occurrences retain exact task/source revisions. Deferral changes target_date, never original_due or identity.

Prepare-work creates one immutable receiving package and canonical New Ticket, with original asset/task identities. The Service owner supplies any missing requester/impact context, triages, prepares and authorises Work Order scope, contacts the customer, schedules and issues a pack through the existing workflows. No work request creates a booking or free work. Return visits remain owned by Service against the original request; repeated generation never creates another request for the same occurrence.

Receive-result requires a current Reviewed/Issued report revision with an Approved factual review; its immutable authorised scope must name the exact source Ticket and asset. Each original task maps once to a distinct Service scope item with the same task description and asset. Service's Complete outcomes become Maintenance Completed only when every original task matches; other outcomes yield Partial. Unrelated visits, edited descriptions, current WO links added after authority, or unreviewed reports cannot close obligations.

Equipment configuration/physical changes retain originals and cause owned ReviewRequired plan events. Warranty replacement uses canonical Equipment commands; it links a reviewed completed replacement and creates a TechnicalFollowUp Activity for future maintenance. Successor warranty dates are not generated, and maintenance does not transfer automatically.

## Warranty and recovery boundaries

Evidence references are case-insensitively unique per case. Evidence review retains exact evidence revision/source hash. Resolution plans are immutable; goodwill and Service authority name the exact plan/content hash. New content cannot reuse either decision. Covered entitlement or separate approved goodwill is required for a non-investigation remedy; missing facts are not cured by goodwill.

Customer updates retain exact completed Service result, recipient/content/revision/hash. Responses name the current update. Reservations/Disagreed/Unavailable creates an owned dated Activity. Resolution requires the current Accepted response, current completed remedy and completed earlier customer follow-ups; it leaves supplier and Finance state independent. A reviewed canonical replacement has a separately retained source bridge for its historical remedy, not a new work-authority shortcut.

Claims retain a shared UUID, exact evidence package/hash, supplier and integer minor-unit amounts with explicit currency/tax basis. Submission and response evidence dates are ordered after the failure/submission. Partial/full/rejected amounts must match the response, cannot exceed the claim or invalidate retained credits. Finance credit links require finance.reconcile, exact approval, external ERP company key, case-insensitive unique reference, date and reconciliation evidence; totals cannot exceed approval. Unrecovered disposition is separately recorded. A credit reference does not assert cash or an ERP posting.

SC-08 remains unavailable. External Authorised → Received → Disposed evidence, or a pre-movement NotRequired decision, is a Warranty-side coordination record. It does not receive stock, quarantine goods or establish warehouse custody. MYOB remains ERP authority; no endpoint or transaction is invented.

## Permissions, reads and UI

Capabilities: maintenance.read/manage/assess/agreement.approve and warranty.read/manage/assess/goodwill/recovery. Existing Service scope, Activity and finance.reconcile authority remains necessary at its boundary. Seed 49 copies only selected existing synthetic principals' scoped shared.read grants; no invited tester or new user is added. Revoked/expired grants remain revoked; seed receipts prevent replay from restoring them.

Registers admit only currently readable records. Search/state/sort/page are URL-restorable. Counts refer to the admitted set from at most 200 source candidates; Partial is explicit and pagination is 30. This bounded prototype read is not an enterprise-wide total. Native Sales Aftercare reads MA-01/MA-05 with current access. Historical facts remain immutable even when operational currentness changes.

The native shell and guides cover all fourteen list/detail routes. Forms retain drafts and observed versions, use the existing uncertain-operation recovery, and require deliberate version adoption after comparison. Owner baseline adoption, physical-device review, screen-reader review and deployment remain separate from implementation and automated proof.

Canonical Equipment replacement review can recognise an exact completed Maintenance replacement result even while its originating Service request remains administratively open. The impact snapshot retains the current report/result, latest plan, latest entitlement and exact Service/goodwill decision. Every open work order and ticket must be covered by that reviewed replacement evidence; unrelated open work remains blocking. No Service record is silently closed. Equipment remains the physical-change authority and marks existing plans ReviewRequired.
