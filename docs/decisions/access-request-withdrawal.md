# AD-01 withdrawal of un-applied requests

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded synthetic implementation decision under the 11 October continuation instruction; security, visual and owner acceptance separate.

Continue [controlled application](access-request-application.md) from PR #417 at `2e69c4c`. A request that cannot be applied before its approved start currently reserves its exact grant tuple indefinitely. Allow the original requester to close an un-applied Submitted or Approved request with a reason, preserving the proposal and any independent decision. A new proposal then uses the existing fresh submission/review/application workflow. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06, AT-01/AT-34 and operational D-020.

## Authority and state

Withdrawal requires an active local original requester with current Workspace `admin.access.read` and `admin.access.propose`, with no selected working company. Read, approval or application authority alone does not permit another person's withdrawal. No new capability, grant, user or seed is needed. Hosted commands remain refused. These are explicit prototype constraints, not an adopted operational cancellation policy; missing requester authority remains a hold, without an administrator override.

Submitted v1 becomes Withdrawn v2; Approved v2 becomes Withdrawn v3. Retain all original proposal and decision bytes. Record the withdrawal reason, current time and original requester in immutable audit/receipt evidence. Returned, Applied and Withdrawn are terminal for this command. Withdrawal never changes grants, identities, sessions or the original approval. An expired start, inactive subject or lost reviewer duty does not prevent closure: they would prevent application, not create a reason to retain an obsolete reservation. A replacement is a new request with new dates, IDs and independent approval; no approval is copied or proposal automatically submitted.

## Concurrency, idempotency and recovery

Use the existing operation lock, workspace serialization and exact expected version. Lock users, grants and working-company selections for the duration of withdrawal so direct authority changes cannot race its validation; recheck current authority before returning. Withdrawal competes with decision/application: one transition wins, the stale command fails, and an already installed grant cannot be withdrawn through this workflow. Release the existing pending-tuple reservation only on the committed terminal transition.

Write state, audit and actor-bound receipt in one transaction; a deferred constraint proves exact state/actor/reason/evidence. Retain historical snapshots without rewriting their pre-migration shape. Same-actor unchanged replay returns the original outcome under current read/propose authority even after a new request exists. Changed payload, another actor's recovery, missing current duty or working-company selection is refused. Failure rolls back all effects.

## Interface and proof

Reuse the current r20 Record detail and Register / worklist, shared Field, Button, Status, ReadState, Stamp and recovery controls. Add a reasoned secondary withdrawal form to the request detail and a Withdrawn queue filter. Explain that it closes only this request and leaves existing access unchanged. Show the retained independent decision alongside the withdrawal outcome. Hand over to a fresh request via the existing queue; no new page or unreviewed shared-control implementation.

Migration 0081 extends only request state/evidence; no new technology is adopted. Reopening or editing Approved records was rejected because it would reinterpret an independent decision. Direct grant deletion was rejected because installed-access revocation is a separate controlled workflow. Verify both source states, exact retention, terminal and authority refusals, races with decision/application, identical retries, changed payload, lost-response/reload recovery, rollback, populated 0080 upgrade and historical migration preservation. Teams, campaigns, grant revocation/editing and operational D-020 remain open. Accepted native desktop/mobile images are missing; new implementation observations do not grant owner acceptance.
