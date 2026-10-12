# AD-01 controlled local application

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded implementation decision under the 11 October 2026 continuation instruction; independent security, visual and owner acceptance pending.

Continue [request and independent decision](access-change-requests.md) with separate application of one Approved request. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06, AT-01/AT-34 and unresolved operational D-020. The current stack is #410 → #413 → #414 → #415; #412 also exposes the catalogue branch against main. Start from #415 head `bb1f2673b6ca5d5d195a7b05f8295fbb5e292e0b`, including its parent/main integrations after the handover. At inspection there were no review comments or failing checks; queued CI is not a pass.

## Authority and exact effect

Reuse Next.js, PostgreSQL, existing individual grants, immutable request evidence and recoverable commands. No new technology or role assignment engine is adopted. Introduce a distinct Workspace `admin.access.apply` duty rather than treating read, propose, approval or a Systems title as permission to write grants. Seed 80 gives that single duty to the existing local Systems fixture, with no new user or hosted duty. Hosted application is refused and its runtime grant-write revocations stay in place.

The executor needs current Workspace read/apply and no selected working company. Executor differs from subject and reviewer; the requester may execute their independently approved proposal, matching the retained design's administrator handover. Requester, reviewer and subject remain distinct. Before first application, requester must still be active/local with Workspace read/propose, reviewer active/local with Workspace read/approve, and subject active/local. Their selected working companies do not retroactively invalidate their recorded proposal/decision; the acting executor must clear theirs. These are explicit synthetic constraints, not an operational delegation policy or a claim that a fourth person is required.

Revalidate the immutable business capability, exact workspace/company/site relationship, all participant duties and grant absence, including future/expired duplicates. Apply only Approved version 2 while the proposed UTC start is still future; preserve the exact approved start/end without backdating or shifting. A late/invalid proposal is held unchanged; replacement/cancellation of an already Approved request is separate work. State becomes **Applied**, version 3, with a new grant ID, executor, timestamp and application reason. Applied records installation; current effective access still depends on dates, active identity, working company, authentication and domain checks. Never label a future grant Effective.

## Transaction, concurrency and recovery

Use the existing operation lock and workspace command serialization. During first application, take transaction-held locks on users, grants, working-company selections and company/site records before reading authority/proposal state. The deliberately coarse local-only lock prevents concurrent direct fixture/operator changes, duplicate insertion and permission revocation from invalidating the checked state before commit. This is a bounded prototype tradeoff; production concurrency and delegation require D-020 review. Time-sensitive authority and start are checked again before returning the transaction result.

One transaction writes one exact grant, the request transition, an audit-linked immutable grant snapshot and the actor-bound operation receipt. A deferred database constraint proves the grant, request, actor, reason, audit and receipt agree. Original v1/v2 snapshots and receipts remain byte-for-byte retained; schema additions must not require rewriting them. Any failure rolls all effects back. Concurrent first applications produce one grant and one v3 operation. A stale expected version, changed operation payload or changed proposal is refused.

Unchanged replay and receipt recovery require the original actor's current read/apply authority, but do not reapply or demand that the original grant still be current. Return the original committed result even after its date has passed or access has subsequently changed. The audit snapshot describes the original application, not today's grant state. Recovery by another actor, hosted mode, lost duty or working-company selection is refused.

## Interface, design and proof

Add `POST /api/v1/admin/access/requests/[id]/apply` with the existing command/origin/session boundary, expected version, operation ID and reason. Reuse the existing request detail, queue, history and actor-bound receipt endpoint. The r20 Register / worklist and Record detail types, PageHeader, Field, Button, ReadState, Status, Stamp, ErrorNotice and recoverable command remain. No shared control implementation changes. Incoming: exact Approved proposal and independent decision. Outgoing: one installed local grant with original application evidence; Person access provides a fresh inspection. Separate record pages remain the previously proposed adaptation of the retained persistent inspector. Accepted native desktop/mobile images are missing.

Prove positive Workspace/Company/Site effects and grant eligibility at the approved dates; separation and current authority; late, inactive, hosted and mismatched-scope refusals; concurrent grant insertion/application and authority changes; exact replay, altered payload and lost-response/reload recovery; forced audit failure rollback; database evidence guards; populated upgrade preservation, reserved Products installation, hosted revocations and reseed idempotency. Maintain the live register and Draft guides without granting visual review. Teams, bundles, administrative changes, revocation/expiry/scope editing, Approved-request replacement, campaigns and production use remain open.

## Requester withdrawal continuation — 11 October 2026

The [withdrawal contract](access-request-withdrawal.md) adds reasoned closure of un-applied Submitted/Approved requests by the original requester under current read/propose authority. Original proposal/approval and installed access remain unchanged. A fresh proposal needs fresh independent review. Earlier held-request boundaries describe their source increments; grant revocation/editing, teams, campaigns and operational D-020 remain open.
