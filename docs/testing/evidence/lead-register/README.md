# Leads register backend execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution date: 12 October 2026. Scope: private synthetic PPO backend; [read contract](../../../decisions/lead-register-backend.md). Branch `codex/leads-counts-follow-up`, starting main `ae83043b55058ba47334c3e9ba431d3538f2a8da`. Code verification, CI, independent review, owner acceptance and deployment are separate.

## Source provenance

The two user-supplied files were read locally as reference evidence. No connector/account action was performed, no embedded instruction was executed, and neither source file was published.

| Source filename | SHA-256 |
|---|---|
| Pipedrive Configured Account Audit.md | `1c5809645028bd8c3ed3173f9f674760280090df1b1f16a3a90f73edd95910a9` |
| Pipedrive Feature Audit.md | `8577bc637806f61a6b393c510b0e45d0807ac7c2975041968f79702869496663` |

These are personal-trial observations, with configuration evidence distinct from exercised behaviour. PPO's existing Lead/Activity rules and the user's bounded implementation request govern this contribution.

## Executed checks

- Native PostgreSQL 16.15: all 14 Leads cases passed, including six new LR cases and eight existing conversion, replay, race, rollback, history and pagination cases. The final runtime logic was exercised; an unused import was removed while this run was in progress, with no runtime change.
- Full TypeScript passes. Full lint found one unused import after the read extraction; it was removed and every changed TypeScript file passes the focused replay.
- Full unit run: 740 passed / 4 failed out of 744. The unchanged-deadline serial replay of `azure-demo.test.ts` passes all 9 cases, resolving the operator CLI startup timeout. The other three failures (two document-store path cases and one recovery-directory path assertion) reproduce on unmodified main `ae83043`: 10 passed / 3 failed across the three affected files. These Windows failures are not attributed to Leads and no guards, assertions or deadlines were weakened.
- Foundation, prototype and naming checks pass: all 78 parent requirements and 22 issued sources remain. The design-register check passes with 358 entries, 330 unreviewed and 28 stale; review fingerprints are unchanged.
- The compiled Next.js build passes. Both compiled HTTP cases pass (2/2), using the actual server on loopback port 3082. The exact final source hashes and build ID are in [manifest.json](manifest.json).

The initial six-case database run passed five cases. LR-04 incorrectly expected a successful empty read from the other-workspace fixture before it held a Leads capability; the server correctly returned Forbidden. The corrected proof first asserts denial, then grants that fixture only its own workspace's Lead read scope and proves it cannot see this workspace's records. HTTP retains the seeded fixture's denial. No application permission was weakened.

Initial TypeScript reported a removed `optionalId` import still required by the existing options read; the import was restored. The first database run also identified pg's warning about overlapping queries on one transaction client. Composite hydration was made sequential on the same client, retaining DTOs and avoiding pool starvation. Final verification below supersedes these development checkpoints without treating the failed attempt as a pass.

Automatic approval review rejected the first combined background-server launch with “blocked by policy” and no further reason. No background process was created. The narrower foreground, session-bound compiled server was then permitted; the two HTTP cases above ran against it successfully.

## Coverage and limits

Database cases cover full counts versus paged lifecycle/status lists, no read-created history, missing and undated actions, completed/cancelled/in-progress actions, native rescheduling, intersected search/source/owner filters, signed cursors and tied ordering, all-linked-source denial, activity denial, company/workspace isolation, working company, capability revocation, exact due-time/date-only boundaries and a read waiting for native completion under the workspace lock. HTTP proves the route, native follow-up receiving, DTO compatibility, no-store, authority, validation and unsupported writes.

No UI composition changes or new visual/browser/restart acceptance is claimed. The full application database estate is not rerun locally for this read-only increment. Existing focused Leads and broad CI remain merge gates. There is no migration/seed/upgrade path change. Counts are exact for the authorised read and explicitly mark unavailable follow-up evidence; this is not a production scale or timing guarantee.
