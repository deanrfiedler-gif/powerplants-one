# AD-01 durable local team records

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded prototype implementation decision under the next-step instruction; operational D-020, owner visual and security acceptance remain open.

Continue #427 at `f9c8c00213bc5279bcf0e5afdc688e770faf5108`, stacked on #423 (`988a734`) and #417 (`2579bd9`). At selection #427 had 47 queued/one skipped checks; #423 had 16 successful, five running, 30 queued/one skipped; #417 checks were cancelled. No review feedback or reported failure was present. CI remains separate from local proof.

## Bounded outcome and alternatives

Add durable local team creation and read/recovery APIs, plus saved-team inspection in the existing role catalogue. A team records an explicit name, purpose, lead and initial roster; it never grants access, assigns business work, routes reviews or makes its lead an approver. Retained examples remain separate and are never imported automatically. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06 and AT-01/AT-34. The receiving plan's attester/reviewer separation still applies to any later campaign-origin request.

Reuse PostgreSQL, Next.js, the existing session/origin boundary, canonical operation hashes, locks and audit log. No new technology is selected. Domain-owned receipts follow the existing access-request pattern; do not allocate an operational reference or business identity. Reusing access-request proposal authority was rejected because it permits a different action. Inferring teams from grants or installing the historical fixture roster was rejected. This is the command/record foundation: native creation/editing controls and the membership lifecycle follow separately; this increment's native page inspects actual saved records.

## Authority, participants and state

Creation requires an active local actor with current Workspace `admin.access.read` and new `admin.access.team.create`, with no selected working company. Read alone, request propose/approve/apply, team lead and membership confer no creation duty. Seed 83 adds one explicit duty to the existing Systems fixture only; no new user or hosted grant. All team APIs refuse hosted mode, and hosted runtime authority-table write revocations remain.

Only Create is implemented: caller-provided UUID at expected version 0 becomes Recorded version 1. Name is 1–100 characters, purpose and reason 10–1000 characters, and the initial roster has 1–20 distinct explicit user UUIDs. The lead and every member must be active local identities in the same workspace at commit. The lead may be outside the roster (as in the retained Service example); the creator may be lead/member because these labels confer no privilege or independent approval. No one is silently added. Names may repeat: UUID is identity, and it remains visible in the catalogue. These are bounded synthetic rules, not an operational team policy.

Creation time is recorded at millisecond precision for exact receipts. The initial roster is an immutable recorded fact; no historical join date, future membership validity, expiry, archive state or editing policy is invented. Later inactive people remain in the original roster, with current activity shown separately. Hosted identities appearing behind an existing ID are masked on reads. Editing, removal, lead transfer and routing remain subsequent work.

## Revalidation, concurrency and evidence

Serialize creation with the existing actor operation lock and workspace row lock. Hold users, grants and working-company tables in SHARE ROW EXCLUSIVE mode through commit so direct fixture authority/participant changes cannot race validation. Recheck acting authority after writing. Create at an existing team ID conflicts; concurrent identical actor/operation/payload retries produce one team and one receipt. Canonicalize the roster as a sorted set after rejecting duplicate UUIDs; input order has no meaning. Other fields retain normal trimmed validation.

Team, complete initial roster, immutable audit snapshot and actor-bound receipt commit atomically. Deferred database constraints prove exact row/roster/audit/receipt agreement, including creator, reason, operation, state/version and accepted time; update/delete and later roster insertion cannot rewrite evidence. A forced audit/evidence failure rolls back all effects. New team IDs do not change any grant, session, request or issued reference.

Identical replay and receipt recovery recheck the original actor's current read/create duties but return the original result even if a roster member is later inactive. Changed payload conflicts; another actor cannot recover the receipt. A lost response is resolved using the original operation ID, never guessed from a team name. No reapplication occurs on read/replay.

## API and native inspection

`POST /api/v1/admin/access/teams` accepts strict schema version 1, operation_id, team_id, expected_version: 0, name, purpose, lead_id, member_ids and reason. It returns the standard operation receipt. `GET` on that collection lists up to 50 teams with offset/has_more. `GET /api/v1/admin/access/teams/{id}` returns the original record/roster and audit-linked history with separately masked current names/activity. `GET /api/v1/admin/access/teams/operations/{id}` recovers only the current authorised original actor's receipt. Responses remain private/no-store; write origin/session checks are unchanged.

The existing `/admin/access/roles` catalogue adds a Saved local teams section using the same cards, ReadState, Button and native details. Each team displays its exact ID, recorded time, purpose, proposed-authority boundary and separately loaded roster/history. Retained examples and their fixed clock keep their own section. This is an existing-page inspection refinement under ADR-0053 rule 6, not a new page/layout choice. No Figma drawing or owner acceptance is inferred. Accepted native images remain missing. Native editing is not claimed.

## Upgrade and proof

Migration/seed 0083 extend the live capability/audit constraints and add team/evidence tables without rewriting old rows or altering business_identities. Update all exact migration/seed ledgers and grant allowlists required by AGENTS.md. Review the hosted upgrade gate: the new duty goes only to existing local Systems, all API commands refuse hosted mode, tester grant sets and runtime authority-table revocations stay unchanged. Prove populated 0082 preservation/reseed, historical upgrades including estimates across 0026 and reserved Products 0052, exact new duty and unchanged hosted users/grants.

Prove authority, local/workspace/participant boundaries, duplicate and malformed payloads, concurrent creation, current-duty loss, exact replay/recovery, immutable state/evidence and rollback. Browser checks inspect real API-created records, refresh/denial recovery and unchanged retained examples at desktop/390/320 widths. Maintain the live guide/register/component records and evidence in the same PR. This does not approve operational team membership, production use or deployment.

Opening a roster refreshes its lead/creator identity labels from the detail response. Closing it retains those newer labels until an explicit collection refresh or page change; it never falls back to an older list label. This is current-identity presentation, not a change to immutable membership or creation evidence.

Native creation now follows the [bounded form/recovery contract](access-team-creation.md). The initial-roster command, permissions, immutable evidence and membership limits above are unchanged; membership editing remains open.

## Integration — 12 October 2026

The integration after merged Projects 0081 moves this unpublished migration and seed from 0082 to 0083. Stable team/grant IDs and historical evidence retain their original bytes.


Current member access inspection follows the [bounded read contract](access-team-inspection-current.md). The initial roster and command/audit evidence stay immutable; current grant-state counts are timestamped read observations, not access inherited from a team or completed review evidence.
