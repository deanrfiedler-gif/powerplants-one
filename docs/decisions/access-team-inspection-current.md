# AD-01 saved-team access inspection

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded prototype continuation, 12 October 2026; owner visual/security acceptance and operational D-020 remain open.

## Receiving scope

Continue native team creation #430 at `bdd6f583b7f091da4e43f3a33a86f11db4e94b22` on `codex/ad01-team-access-inspection`. At selection #430 and parent #429 have running/queued checks, no reported failure and no review feedback. Parent #429 advanced to `83a6762`, carrying the same stable-grant-ID expectation correction as #430 plus an explanatory comment; retain that parent. Main's migration history is already incorporated. Final-head CI remains separate from local proof.

The [native creation contract](access-team-creation.md) records an immutable roster but currently gives its reader no direct route from that roster to current person access. Add a bounded read preparation step within the existing expanded saved-team card: each original member's current identity activity, recorded grant counts by current date state, and an exact person-access handover. This supports later access review without adopting a campaign, cadence, attestation, review routing, team policy or membership lifecycle. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06, AT-01/AT-34 and all 78 parent IDs.

## Authority and interpretation

Reuse the existing local-only team-detail read, current Workspace `admin.access.read`, session/privacy boundary and working-company refusal. Team creation duty is unnecessary for inspection; being the lead or a member grants no inspection authority. No new capability, seed, migration, technology or page route. No grants, sessions, roster, requests, audit events or receipts are written by this read.

Only recorded initial members are included; a lead outside the roster is not silently added. Counts cover the member's exact workspace grants across Workspace, Company and Site scopes. They count rows, not distinct capabilities, effective business access or independent approval authority. Reuse the existing catalogue grant-state rule: inactive identity takes precedence, then Scheduled, Expired and Current. A zero-grant member stays visible. Hosted identities behind an existing ID remain masked, without counts or a person-access link. A current local inactive identity remains inspectable so the owner can investigate retained grants. No authority is inherited from a team.

## Freshness, concurrency and recovery

Read-only transaction; inspection authority is checked before and after data reads. Read all member identities and grant counts in one SQL statement using its statement timestamp, so the displayed timestamp and date classification refer to the same snapshot. Historical roster/audit evidence stays distinct from current identity/grant observations. This is a point-in-time read, not a locked access decision; person handover loads a new current server read and record-level controls still apply.

Use the existing detail refresh/loading/error boundaries. An explicit Refresh member access action reloads the selected roster without resetting the creation draft. While loading or unavailable, do not display previous counts as current; ordinary retry may reload the collection and require reopening the roster. Denial clears the protected catalogue. Rapid selection changes must never attach a previous member snapshot to a different team. No idempotency key is required for a read; repeated reads do not create audit or review evidence.

## UI and proof

Small existing-page refinement under ADR-0053 rule 6: retain the existing saved-card layout, wrapped UUIDs, native list, shared Button/ButtonLink, Stamp and ReadState. Show the inspection timestamp, four labelled grant-state counts and total for each local member, plus the exact person-access link. Preserve the creation-history section and its original operation ID. No accepted Figma image is available; source-bound desktop/390/320 observations do not grant owner acceptance.

Prove exact roster inclusion, zero grants, date categories, inactive precedence, masked identity withholding, current-duty/working-company/workspace/hosted boundaries and unchanged database snapshots. Verify native read-only actor handover, refresh/failure/denial, rapid selection, phone reflow and existing creation recovery. Maintain the guide, live register, component host fixtures and evidence in this PR. Membership editing, campaigns/attestations, review routing, D-020, devices/assistive technology, owner acceptance and deployment remain open.
