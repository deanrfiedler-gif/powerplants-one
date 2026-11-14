---
document_id: PPO-WARRANTY-SUPPLY-RETURN-DEC
date: 2026-11-13
owner: Dean Fiedler
status: Codex implementation decision under the standing order; Claude reviewed 9e634df7, confirmation of two defect fixes pending
source_commit: e41f806a6e005b29c5b13d7f69afee8c28adb2f7
versioning: git
---

# Warranty to Supply return receiving

[DECIDED by Codex] Dean instructed proceeding with the recommended next backend work. The Finance PRs #905/#932 retain their owners. This bounded BC-06 increment connects MA-07 supplier recovery to SC-08 native customer-return receiving. It amends the missing-return-bridge boundary in [native Maintenance/Warranty](maintenance-warranty-native.md); it changes no operational warranty, stock or accounting policy.

## Choice and alternatives

Reuse the native Supply creation command inside the existing workspace transaction. Record the source bridge in an immutable `maintenance_events` event and retain two original operation receipts: Warranty preparation and native `Supply:Create`. The event's source snapshot is evidence of the handover, not another receiving master. Supply owns all later authorisation, physical receipt, quarantine, disposition and supplier movement facts.

A new RMA master or a second custody workflow would duplicate existing SC-08 rules. Automatically converting external Warranty evidence to physical receipt would falsely establish custody. A new relation/migration is unnecessary for this bounded one-return-per-claim command: the existing workspace lock serialises every writer, the immutable event identifies its target, and native Supply identity/quantity guards still apply. A future multi-return, cancellation or source-correction workflow must define its conserved identities and migration needs separately.

## Rules

1. Preparation requires current `warranty.recovery`, the original case/source access, `supply.read` and `supply.return`, plus the existing native receiving-owner checks. No capability or grant is added.
2. Bind the exact claim package, current case/evidence/assessment, latest Warranty `Authorised` return event, original demand version and current complete native delivery fact. The demand must be approved and complete, and name the exact company, site, customer and asset. The asset identity must remain verified at that site and retain the claim's serial. No lookup by name or reference establishes a link.
3. The requester supplies exact quantity, identity evidence, a bounded symptom summary and original delivery reference. Item and unit come from the demand. The quantity cannot exceed the selected delivered quantity, original demand or native remaining delivered return allowance. Existing returns consume that native allowance too.
4. Create a `Customer` return only. Creation is a preparation step; it adds no Supply authorisation, receipt, usable stock, credit or customer resolution. Supply's own Proposed → Approved authorisation and subsequent fact transitions remain mandatory. Later supplier movement uses SC-08's existing executed ReturnToSupplier disposition.
5. One bridge per claim. Distinct operation IDs recover the same original results. Competing operations cannot create another return. A stale source or failed native write leaves no bridge, native record, receipt, accepted audit or outbox job. Received/Disposed external evidence and a NotRequired decision cannot be imported as native custody.
6. Freeze the return's source fields, item, unit, requested quantity and identity evidence, and the parent demand's customer and asset once a preparation event names that demand. A native demand revision changing either identity returns `SourceReviewRequired`. The demand's optional facility is not bound by this bridge; existing native validation remains. Native owners, next actions, title and completeness can still change; native facts record actual receipt/disposition. A mistaken source selection requires a separately designed correction, not an in-place relink. Ordinary non-bridge Supply records retain their existing revision rules.
7. Warranty reads native physical facts with current Supply visibility and independently checks the current demand's customer and asset against the retained claim and case; identity drift returns `ReviewRequired`. Revocation hides the receiving IDs, details and preparation reason, and denies original bridge replay/lookup. Historical source changes do not invalidate an authorised original receipt. A current Rejected native authorisation with no receipt is explicitly `AuthorisationRejected`; incomplete evidence and unknown external outcomes keep their precedence and no complete receiving total is inferred from them. Finance credit and customer remedy are never derived from physical progress.

The 14 November 2026 corrections address only defects 1 and 2 in [Claude review 5885392190](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#pullrequestreview-5885392190), as [Dean instructed](https://github.com/deanrfiedler-gif/powerplants-one/pull/945#issuecomment-6848501977). They use the existing application revision transaction and typed refusal, with no migration, capability, grant or dependency. Confirmation of these findings remains separate from the completed full review.

Reversing this choice requires a reviewed replacement for the immutable source/operation and remaining-quantity protections. Earlier `SupplyReceivingNotIntegrated` events remain byte-for-byte unchanged and retain their historical meaning.

## Delivery and traceability

[API contract](../contracts/maintenance-warranty-api.md#warranty-to-supply-return-receiving) · [handover](../delivery/maintenance-warranty-handover.md#warranty-to-supply-backend--13-november-2026) · [execution evidence](../testing/evidence/warranty-supply-return/README.md).

MA-07, SC-08, BC-06; SVC-12.3 and the existing SCM return scope; AT-19/AT-29/AT-33. No parent IDs change. UI controls, broader TS-05 execution, owner acceptance and live ERP/supplier operations remain separate.
