# Synthetic quotation release contract

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. ES-05 / PPO-010 / BP-04 EST-03/07/08 / OUT-06. Governed by the [native release decision](../decisions/quotation-release-native.md). Operational commercial terms and owner acceptance remain separate.

## Exact aggregate and commands

The existing `draft_quotes` aggregate and immutable `draft_quote_revisions` keep their identities and historical Draft preparation state. New release preparations are successor revisions in that aggregate with `PPO-SYN-RELEASE-r01`; immutable subordinate bindings and events separately record preparation, approval, issue and simulated distribution. Original E1 template/input/output bytes are retained.

GET `/api/v1/estimating/quotes/[id]/release` returns permitted exact evidence and an observed preparation fingerprint. POST suffixes `/prepare`, `/approval`, `/issue` and `/distribution` require the original operation UUID, schema 1, reason, explicit `synthetic_only: true`, current `expected_quote_version` and `expected_release_sequence`. Unknown fields are refused. The event sequence spans the whole quotation and is distinct from its preparation revision number.

| Command | Additional exact input and result |
|---|---|
| Prepare | New revision `id`, observed `basis_hash`, explicit nullable `predecessor_issue_id`. Current owner with `estimating.quote.prepare`; all three applicable ES-04 reviews and a current saved estimate are required. Creates one successor and one existing-style render job, without approval or issue |
| Approval | `outcome: Approved\|Returned`, exact `output_hash`. Explicit `estimating.quote.approve`; the owner, author and preparer cannot approve. One immutable decision per prepared revision. A return or correction requires new preparation |
| Issue | Exact `approval_id` and `output_hash`. Explicit `estimating.quote.issue`; issuer differs from preparer/owner and approver. Current source/recipient/template must still match. Retains exactly the approved original manifest and explicit preceding issue |
| Distribution | Exact `issue_id`, stable `attempt_id`, nullable `resolves_event_id` and `outcome: Unknown\|SimulatedDelivered\|SimulatedFailed`. Explicit `estimating.quote.distribute`. Records a simulation only; no external provider is called. Unknown holds a new attempt. Resolution retains the original attempt/event; a failed completed attempt may be followed by a fresh attempt identity |

The bound source includes exact saved estimate/hash, option and include/print choices, original applicable review decisions/fingerprints, customer/contact/site identifiers and record versions, opportunity version, synthetic policy/hash and exact terms/template. Recipient changes between read and preparation refuse the observed fingerprint. Content changes between preparation/approval/issue hold the next decision until a deliberate successor. Neither review nor approval transfers to changed content.

## Evidence, authority and recovery

Every read/command checks current workspace, company/site, estimate, CRM/customer/contact and source/specialist permissions. Original recipient authority also applies to existing quote read, file and renderer paths. Original receipt lookup and replay check the exact accepted revision and original duty. Revocation removes access; possession of a UUID or earlier receipt is insufficient.

Commands use the shared workspace lock, canonical input hash, expected versions and atomic event/audit/receipt/outbox. Same-operation replay returns the original receipt; different content conflicts. An unavailable receipt is inconclusive. The actor-bound same-tab journal keeps the original body and holds replacement actions until resolved. A failed or denied read removes protected content. No offline release queue is registered.

The existing leased renderer retains input/template hashes, durable original bundle, attempt history and storage reconciliation. A separate synthetic-release PDF footer is selected only for the new template. The E1 default footer remains byte-for-byte the same string; old outputs are never regenerated for issue. Approval and issue verify actual retained HTML/PDF, not just a Ready flag. Missing/corrupt output refuses the command. Issuing twice cannot create duplicate issue events. Earlier issue manifestations remain immutable after successor preparation or issue.

Migration/seed 0059 adds two local-only fictional identities and thirteen exact Company A grants: five necessary reads each, one approval duty, two issue/distribution duties. No current estimator or hosted tester gains these duties. The migration registry, exact grant/seed consumers, hosted-upgrade gate and AD-01 catalogue change together. All old seed receipts, grants and identities remain retained.

## Explicit limits and receiving work

The demonstration conditions have no commercial validity. Operative terms, thresholds, tax/FX policy, validity period, customer authentication/signature and optional commercial packages remain Not configured or unavailable. The manual journey uses one exact estimate option; no new money formula is introduced. ES-06 records responses to an exact synthetic issue and ES-07 receives/converts separately; neither response nor work is created by this contract. MYOB, SharePoint and native CAD retain their authority. No live customer communication, merge or deployment is authorised here.

See the [execution handover](../delivery/quotation-release-handover.md). Functional source, automated proof, inspected screenshots, owner acceptance and deployment remain separate.
