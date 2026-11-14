---
document_id: PPO-PJ07-READINESS-CONTRACT
date: 2026-11-13
owner: Dean Fiedler
status: Bounded synthetic backend contract; operational acceptance separate
source_commit: bdcdd347fcb29c3806cd23d1e85be03f972b6628
versioning: git
---

# Project delivery readiness — native evidence API

Owner: Dean Fiedler. Scope: PJ-07 / BC-06. Backend increment authorised on 13 November 2026 by “Proceed with that work”. [Implementation decision](../decisions/project-readiness-api.md). This is a synthetic internal coordination read, not a work-release decision, acceptance of a Figma proposal or recovery of the missing historical r02 design.

## Read and scope

`GET /api/v1/projects/{id}/readiness` accepts an exact Project UUID and no query parameters. It returns `schema_version: 1`, `synthetic: true`, a database `as_of`, the permitted Project's identity/version/lifecycle, three source families and an explicit assessment boundary. Unknown query keys are refused with 422; unavailable Projects return the existing non-disclosing 404. Existing local identity/origin controls and `private, no-store` responses apply. There is no write endpoint.

All source reads and authority checks execute in one repeatable-read, read-only transaction. Date-sensitive Supply promises use that transaction's clock and the demand's own timezone. Every new request checks current authority; an earlier response is not an access token. Database/service faults fail the request through the existing error response, never become an empty register or a Ready assessment.

Only exact native Project relationships are followed. Text references, same-site records and quotation values do not invent project membership. This increment reads Engineering packages, Project-origin material demands and specialist package briefs. It does not claim a complete prerequisite inventory or include indirect WorkOrder-origin demand.

## Source and authority mapping

| Family | Native relationship and reader | Exposed assessment |
|---|---|---|
| `EngineeringPackage` | `engineering_packages.project_id`; existing `engineeringRow` with Project, customer/site, working-company and Engineering authority | A recorded coordination `blocker` is `Blocked`. Otherwise `EvidenceNeeded`: Queued/In design/Awaiting information is not technical release. Exact package version, timestamp, owner and coordination facts are retained |
| `MaterialDemand` | Demand with `data.origin_kind=Project` and exact `origin_id`; existing `supplyRecord`, `factsFor`, `materialBasis` | Preserve Supply's Approved/Forecast, completeness, usable allocation, promise/date and quantity rules. Its Ready result maps to `SatisfiedForSourceScope`, never whole-project Ready. Exact demand revision, permitted allocated source revisions, allocation facts and Promise observations form the basis |
| `SpecialistPackage` | `project_specialist_packages.project_id`; existing specialist authority and historical/current `inspect` | Withdrawn packages and packages with a successor in the same workspace and Project are omitted before the candidate bound and do not contribute assessments or counts. The successor carries its own assessment under its own native authority; omission exposes no successor identity or relationship. For remaining packages, Returned briefs and a changed retained source basis are `Blocked`. Other states remain `EvidenceNeeded`; even Accepted means brief acceptance, not competence, work acceptance, award, payment or release. Exact event version and retained source hash/revisions remain visible only under native historical authority |

The Project requires its existing Project/shared/customer/site visibility. Each family also requires its native read capability in the Project's scope, before scanning it. Every candidate then passes the native full source-authority reader. Specialist evidence retains the additional commercial, Library, Engineering, Supply and linked-Activity checks already imposed by its owning workflow.

Denied candidates publish no identity, title, owner, hash, source state or numeric hidden count. A wholly inaccessible family returns `coverage: Unavailable`, `count: null`, `items: []`, regardless of whether any records exist. A candidate refused by nested source authority produces generic `Partial` coverage, with only independently permitted rows retained. These generic coverage signals do not name the hidden source or explain its access policy.

## Evidence, completeness and counting

Each item carries `kind`, native `id`, `version`, `reference` where available, `title`, `owner_id`, `source_state`, `source_status`, `state`, `reason`, `observed_at`, `source_hash`, `href` and a source-specific `basis`. `source_hash` is SHA-256 over the canonical exposed native basis, not an approval, saved PJ-07 revision or freshness token. A specialist's retained hash remains unchanged when its current source changes; `source_status: Changed` describes the comparison. A material allocation whose native source is no longer valid also reports Changed. Incomplete source evidence is not automatically a changed revision.

Material bases exclude Credit facts, customer correspondence, attachment/Activity details and financial values. Only Promise facts participate in their native readiness evaluation. Specialist bases can include commercial source identity/hash only after the native commercial authority check; no commercial amounts are projected. Source owners are the existing native owner IDs, not newly assigned readiness owners.

Each family scans at most 51 Project-bound candidates ordered by stable UUID, evaluates the first 50, and publishes only permitted items. `count_scope: PermittedCandidateWindow` applies to family counts and aggregate blocker/risk counts. `count` is the number of published items, not a total across all Project history. A 51st candidate makes coverage Partial. No filter or pagination can turn the assessment into a full-project claim; consumers needing complete inventories must use native source registers. This bounded first slice does not promise every blocker appears in its candidate window.

`coverage: Complete` means this linked-source window was fully evaluated, not that the Project prerequisites are complete. `evidence: Missing` means no linked evidence was found in a complete readable family. `evidence: Unavailable` means the family cannot be read or no permitted row could be retained in a partial window. Incomplete material evidence also makes its family's coverage Partial, even when other permitted rows exist. Consumers must retain both coverage and per-item assessment.

## Summary and release boundary

`summary.state` is Blocked if a published source item is Blocked, otherwise AtRisk if one is AtRisk, otherwise NotAssessed. Blocker/risk counts describe only those published observations. No percentages or unqualified Ready result are returned. `full_scope_assessed` and `can_release` are always false in this increment, including on an empty, fully allocated or Closed Project.

The response explicitly leaves complete prerequisite scope, technical release, site/customer agreement, crew/attendance, work preparation and commercial release unassessed. Specialist brief evidence is useful input but does not complete those requirements. A read cannot book a visit, reserve stock, accept technical work, change a forecast, clear a source blocker or post to Finance. Completing an Activity changes only that Activity; the source authority must change its evidence before the source assessment changes.

## Verification

Connected synthetic proofs cover native save → read, source version changes, exact usable allocation → scoped satisfaction, completed follow-up with blocker retained, unavailable/empty/partial families, bounded windows, another Project/company, working-company and source revocation, specialist current/stale/hidden evidence, withdrawal with and without source drift, replacement of a stale accepted brief by its successor, strict HTTP inputs, protected headers and absence of business writes. No schema/grant changes require migration. [Execution evidence](../testing/evidence/project-readiness/README.md) distinguishes executed tests, renderer limitations, CI, independent review and operational acceptance.
