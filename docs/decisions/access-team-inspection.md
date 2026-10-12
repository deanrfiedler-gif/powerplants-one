# AD-01 proposed team inspection

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded implementation decision under the 11 October continuation instruction; owner visual and security acceptance remain separate.

Continue from requester withdrawal PR #423 at `988a7343f262d4c083200337b7be344b0bb3dbbd`, stacked on #417 at `2579bd9`. At selection #423 had one successful check, one running, 48 queued and one skipped; #417 checks were cancelled. Neither had review or inline feedback. These observations do not establish passing CI.

The [receiving plan](users-roles-access-review-design.md) leaves teams and attestations open. Before implementing persisted membership or campaign routing, expose the two exact retained team proposals and distinguish their example roster from current workspace identities. Preserve AD-01, NFR-01–NFR-12, CRM-08, FIN-06, AT-01/AT-34 and unresolved operational D-020.

## Read authority and provenance

Extend the existing role catalogue read and page. Require current Workspace `admin.access.read` and no selected working company before and after the read. Look up only exact source IDs for non-design-only people in the inspecting workspace and only local synthetic identities. Never match a name, infer membership from grants, resolve a design-only identity, or disclose a hosted identity behind a retained ID. An unavailable local identity has no person link. Inactive local identities remain inspectable, explicitly labelled inactive.

Preserve source team IDs, purpose, lead, example people and membership dates from `docs/design/access-review/model.js`, with its fixed 17 September 2026 example date. The dates describe the retained example, not current memberships or operational validity. Show source names separately from current local names. Do not refresh the source clock or fabricate a current team status. The lead is a source proposal, not delegated authority. Membership confers no grant or review duty, and no request/reviewer choice is prefilled from it.

## Effects and concurrency

This is a read-only transaction using the existing PostgreSQL/Next.js stack. Recheck authority after resolving current identities. Refresh hides previous data while loading or on error; a denied or working-company result cannot leave a visible roster. Existing identity-change remounting clears the page. There is no state transition, optimistic version, command receipt, idempotency key or new audit event: repeated reads evaluate current inspection authority and current local identity state without writing users, grants, sessions, requests, history or memberships. Existing separation-of-duties rules remain unchanged.

No migration, seed, capability, dependency or hosted provisioning change is required. A canonical team table was deferred because source examples are not accepted assignments. A static display with invented current membership was rejected. Persisted teams, routing and attestations need their own exact authority, lifecycle, concurrency and audit contracts; attester/reviewer independence from the receiving plan remains mandatory when implemented.

## Interface and design

`GET /api/v1/admin/access/roles` keeps its existing `items` contract and adds `teams` and `team_example_date`. The current `/admin/access/roles` page adds a Proposed teams section with the same card, details disclosure, link, ReadState and Button patterns. The existing page title and person comparison remain. This is a small refinement of the existing r20 Register / worklist under ADR-0053 rule 6; no new page, layout option or Figma design is adopted. Reuse current tokens and controls, keep roster disclosures keyboard accessible and stacked on phones.

Incoming: exact retained proposal metadata and current local identity records. Outgoing: an explicit person-inspection link, which independently rechecks access; no positive permission explanation is carried over. The retained design's team-lead preview and routing remain unimplemented. Accepted native mockups are missing. Compare the running section with the retained Roles, teams & capabilities reference at desktop and phone widths and record differences without promoting review fingerprints.

## Proof

Compare every native proposal field with the retained model. Prove exact workspace/local matching, unavailable and inactive identities, design-only collision refusal, current authority and working-company refusals, refreshed names, unchanged users/grants/audit/request evidence and existing role comparison. Browser proof covers both rosters, labelled provenance/dates, keyboard disclosure, person handover, loading/error/denial clearing and recovery at 1440, 390 and 320 px. Maintain the live page/guide and affected component records in the same PR. Functional proof, owner review, CI and deployment remain separate.
