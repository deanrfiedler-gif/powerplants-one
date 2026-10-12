# AD-01 local access review attestations

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded prototype decision under the next-step instruction, 12 October 2026. Operational D-020 and owner/security acceptance remain open.

## Scope and receiving boundary

Continue #433 at `1e0b806c53f8fe4cef900a75a8589cf92be593ce`, stacked on #430/#429. Selection found no failed check or review feedback; checks were still running. Main at `4a286d3` is incorporated by the parent stack. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06, AT-01/AT-34 and all parent IDs.

Implement the command/record foundation for one independent **Keep** attestation of one current recorded grant belonging to an explicit saved-team member. This advances the receiving plan's `recordReviewAttestation`; it does not complete its campaign workflow. Each attestation is a separate immutable observation, not a campaign completion or extension of access. No permission, validity, membership, request or session changes. Change/Revoke/Unable to confirm, assigned campaigns, review routing/cadence, retention and native entry controls remain receiving work. The retained design's future attester/resulting-request-reviewer separation must be implemented before connecting review-origin requests.

Reuse PostgreSQL, existing session/origin checks, canonical hashes, operation locks and audit/receipt patterns; no new technology. A separate review duty avoids inferring review authority from creation, application, membership or lead labels. No automatic import of retained review fixtures. No operational reference allocation. An API foundation is deliberately bounded; the existing native roster/person inspection remains the current user interface.

## Authority and separation

Only active local actors with current Workspace `admin.access.read` and `admin.access.review.attest` and no selected working company may attest or recover their receipt. Seed 84 explicitly adds only the review duty to the existing local Systems identity; no new user or hosted grant. All review APIs refuse hosted mode. Read authority alone can inspect records and basis, but cannot attest. The actor must differ from the subject, even when they created or lead the team. There is no inferred reviewer assignment or business delegation.

The subject must be an active local identity and an original member of the exact team in the actor's workspace. The exact grant must belong to that subject/workspace and be Current by the existing row-date rule at acceptance. Current describes the row, not effective company/site access or suitability. Refuse inactive, scheduled and expired bases. Keep is the actor's reasoned synthetic observation of that row; it neither approves business access nor overrides current permission evaluation. These restrictions are bounded prototype choices, not an adopted operational policy.

## Freshness, concurrency and idempotency

The basis read returns an opaque SHA-256 fingerprint of the exact team ID/version, subject identity/activity and full grant row plus row-date state. Its timestamp is separate from the fingerprint. A command must supply that fingerprint, explicit Keep, a 10–1000 character reason, new attestation UUID, expected version 0 and operation UUID. No client-supplied snapshot is trusted. Changes to any reviewed grant field or identity, removal, or passage across a date boundary require a fresh basis and deliberate resubmission. An unrelated grant does not change this single-row observation.

Serialize actor operations and the workspace; lock authority, participant, grant and working-company tables through commit using the existing local-command pattern. Re-read and compare the basis after acquiring locks and recheck current authority/date state immediately before returning. Authority loss while waiting refuses the write. Concurrent identical actor/operation/payload retries create one record/audit/receipt. Different payload with the same operation conflicts; an existing attestation UUID cannot be overwritten. New explicit operations may record later observations of the same row; there is no invented cadence or uniqueness window.

The original actor's identical replay and receipt recovery require current read/review authority but return the original result even when the reviewed row later changes or disappears. Another actor cannot recover that receipt. Ordinary detail inspection is available under current read authority, with hosted identities masked if their issuer later changes. Historical snapshots are explicitly historical, never presented as current access.

## Persistence and proof

Migration 0084 adds immutable review records and actor-bound operation evidence, extends the live capability/audit constraints and enforces exact record/snapshot/audit/receipt agreement with deferred constraints. The reviewed grant ID is retained in JSON evidence rather than a foreign key that would prevent later grant removal. Audit failure rolls back everything. Version 1/Recorded and decision Keep are the only implemented states. No update/delete commands.

`GET /api/v1/admin/access/reviews/basis?team_id=…&grant_id=…` reads the current basis. `POST /api/v1/admin/access/reviews` records it. Collection GET accepts exact team/subject filters and paginates at 50; `GET /reviews/{id}` inspects history and `GET /reviews/operations/{id}` recovers an original actor receipt. Existing private/no-store responses, origin and authentication boundaries apply.

Prove populated 0083 preservation, exact added duty, reseed inertness, all historical upgrade ledgers including estimates across 0026 and reserved Products 0052, and unchanged hosted authority. Exercise self-review, missing duties, wrong workspace/team/member/grant, stale/date-boundary basis, concurrent retries, queued authority loss, rollback, immutable evidence and recovery. Maintain generated capability design and affected documentation without granting review acceptance. Native review controls, campaign decisions and production use are not delivered by this increment.
