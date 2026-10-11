# AD-01 native local team creation

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: bounded prototype implementation under the continuation instruction, 12 October 2026. Operational D-020 and owner visual/security acceptance remain open.

## Receiving scope and base

Continue #429 at `a42bf5c0f8534da43757e89cfa8a92a76ccf276c` on `codex/ad01-team-creation`. #427 passes its checks; #429's database-3 job rejects the new team duty in the shared Systems-grant expectation. Correct that exact expectation without relaxing business-command denial or before/after preservation checks. #423's historical mobile race is already corrected in #429. No review comments were present. #417 is now merged.

At selection, main `4a286d3` used Projects migration 0081, colliding with the draft withdrawal history. During validation another repository session updated #429 to `c3a0ca6`, integrating main and placing withdrawal/team migrations at 0082/0083. This branch merges that parent and retains its exact migration/seed files and tests. Earlier local databases are preserved; final validation uses a fresh synthetic instance. No automatic conversion of a database holding the earlier draft 0081/0082 checksums is claimed.

Add a creation form within the existing `/admin/access/roles` Saved local teams section. Reuse the [local team contract](access-local-teams.md), existing Field/SelectField/Button/ValidationFields/ReadState, unsaved-change guard and actor-scoped same-tab command journal. This is an existing-page refinement under ADR-0053 rule 6; no new layout, technology, page route, permission, migration or seed. Accepted native images are missing; source-bound captures are observations only. Preserve AD-01, all 78 parent IDs, NFR-01–NFR-12, CRM-08, FIN-06 and AT-01/AT-34.

## Authority and immutable intent

Read-only creation context requires current Workspace inspection authority and no working company. It returns only the actor's workspace/identity IDs, current creation availability and active local candidates in that workspace. A reader without creation authority gets no creation form/candidates. Hosted mode is refused. Candidate labels include exact IDs to disambiguate equal names. They are choices, never inferred members; no lead/member is preselected.

Creation still requires current local `admin.access.read` and `admin.access.team.create`. The server revalidates every participant and current duty at commit under the existing locks. Name, purpose, reason, lead and 1–20 distinct explicit members use the existing bounds. The lead may be outside the roster and the creator may participate: neither label grants access, routes review or creates independent approval. No new separation-of-duties policy is invented. Initial roster, audit and receipt remain immutable and atomic.

## Concurrency, recovery and navigation

One pending create per actor/workspace/tab uses the shared recoverable-command hook. Allocate team and operation UUIDs once before sending; persist the exact submitted payload in session storage first. Pending or in-flight commands disable editing and new creation. Lost response/reload first reads the original actor-bound receipt; only an explicit unchanged retry resends the original payload. A missing receipt is inconclusive. Storage refusal sends nothing. Identity changes remove protected form/result data; another actor cannot recover it. Current authority still gates recovery.

A confirmed receipt shows the exact team and operation IDs and offers inspection through the existing saved-team detail. It clears the editable draft on direct acceptance. Do not infer success from a same-named row or automatically create a replacement. Starting another team is explicit; accepted journal records retain only the shared minimal operation pointer. Unsaved draft navigation uses the existing guard. Refreshing candidate context explicitly discards only an unsubmitted draft; submitted recovery remains in the journal. Ordinary collection refresh does not discard the form.

## Validation and remaining scope

Prove context isolation/current duty/working company/hosted refusal without writes; native explicit selection, validation, server refusal, exact retry/reload recovery, storage refusal, actor isolation and saved-roster inspection at 1440/390/320 widths. Re-run affected access database and shared permissions checks, build/types/lint, relevant unit/navigation and register/document assurance. No migration change means this increment does not alter historical-upgrade expectations. Retain initial failures and source-bound evidence separately from review.

Membership edits, removal, lead transfer, archive/expiry, campaigns, review routing, operational policy, earlier draft-database conversion, owner/device/screen-reader acceptance and deployment remain open.
