# Project specialist work-evidence contract

Owner: Dean Fiedler. Status: authorised synthetic PJ-06 R3 contract; verification and business acceptance separate. Parents PRJ-04/PRJ-05/PRJ-06, SCM-03, AT-38. [Decision](../decisions/project-specialist-work-evidence.md).

## Submission and authority

`GET/POST /api/v1/projects/:id/specialist-work-evidence` uses native private/no-store, same-origin and strict JSON handling. A Submit command creates immutable version 1, state Submitted. Accept, Return or Withdraw produces terminal version 2. Corrections submit a new identity with an optional predecessor; only one successor is permitted and it must follow a terminal submission for the same specialist brief in the same Project. No prior evidence is replaced.

Common fields: schema_version 1, operation_id UUID, id UUID, expected_version (0 for Submit, 1 for decisions), action, reason (1–1000), note (1–2000). Submit additionally requires handover_id, document_id, revision_id, reviewer_id (UUIDs), scope and limitations (1–4000 each), and nullable predecessor_id. Other commands cannot change those fields. Exactly one native document revision per submission keeps the review boundary explicit; multiple records do not imply aggregate completion or percentages.

All access requires native Project, specialist, commercial, Engineering and document-source visibility. Submission and withdrawal require specialist.prepare plus the accepted brief owner or Project coordinator. Accept/Return require the fixed reviewer with specialist.work.review; preparation, brief receiving and Supply receiving never confer this duty. Reviewers must be active/scoped, have all source visibility, and differ from submitter, revision creator and original content author. No seeds or grants are added.

Submit and Accept require an Active Project, the exact accepted R2 handover, unchanged accepted brief sources and no accepted brief successor, current issued native technical release and approved demand, a Current library document with the selected current revision and current underlying source. Native library integrity reads prove the exact bytes before positive use. Scope and limitations are staff declarations retained with server-derived handover payload hash, original receiving operation, specialist ID/version and document content hash/title; clients cannot supply snapshots or hashes. Document company, customer and site must match the Project.

Return/Withdraw remain available after source drift under current historical authority, while new decisions still require an Active Project. Identical command retries and actor-private operation recovery work after source drift or Project closure, subject to current original-command permission and visibility. An inaccessible source withholds the record, history and count rather than exposing a restricted identifier. GET by id returns immutable submission, decisions and Current/Changed applicability; list uses native signed cursors and no total. Historical decisions remain distinct from present applicability. Exact document content remains served by the existing protected library route.

## Persistence and boundaries

Native workspace locking, exact expected versions, canonical operation hashes and one transaction join identities, submission, decision, audit, receipt and outbox. Database guards enforce exact source references, context, bounded immutable content, sequential terminal decisions, reviewer independence and explicit successor lineage. Failed commands roll back completely. There is no mutable completion flag, new document store or automatic downstream action.

Acceptance covers the stated evidence and scope only. It does not attest operational competence/insurance, approve commercial rates or payment, book Service, release inventory, issue a customer report or close commissioning/project obligations. SharePoint, MYOB and CAD retain authority. Further disposition when accepted sources change, reassignment, full PJ-06, UI and operational acceptance remain open.
