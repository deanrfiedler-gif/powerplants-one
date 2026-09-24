# Equipment native workflow API

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Implementation contract for synthetic EQ-01-EQ-09; operational approval and deployment are separate. Decision: [ADR-0045](../decisions/ADR-0045-equipment-native-workflows.md).

## Reads

All routes use `/api/v1/equipment`, the current authenticated workspace and existing company/Site grants. Responses are private, no-store. Unknown and inaccessible lookup identities have one privacy-preserving result. A bounded source window is explicitly partial; source failure is not a zero count.

| Method and suffix | Contract |
|---|---|
| GET root | Canonical installed base; `q`, `site_id`, `installed_id`, `served_id`, `identity`, `lifecycle`, `page`. Thirty rows, exact permitted and filtered counts. Physical and served Facilities are distinct. |
| GET `/lookup?q=` | Exact UUID, readable Asset reference, serial or relative Equipment link. Malformed, unknown/inaccessible, ambiguous, exact, moved and removed outcomes. Never writes identity. |
| GET `/options?asset_id=` | Permitted canonical contexts and current maintenance authority; bounded selection data. |
| GET `/{asset}` | Canonical context, retained configurations/location events and controlled identity-correction handover. |
| GET `/{asset}/impact` | Exact current Asset version, configuration, parent/children, served links, open Service sources and explicit maintenance/document limits; canonical basis hash. Unreadable impact refuses review. |
| GET `/{asset}/changes` | Source-owned proposals and retained decisions, rechecked against current Asset and Service authority. |
| GET `/{asset}/timeline` | Read-only projection of technical, Service, field, Inspection, document, Activity and Equipment evidence. Original source/revision, occurred time, actor, location, confidence and state remain distinct. Each owning source's permission applies. |
| GET `/backups`, `/bulletins`, `/support` | Retained evidence portfolios; optional `asset_id`. Bulletin matches are candidates only. |
| GET `/bulletins/{id}` | Exact source revision, candidates, retained per-Asset dispositions and owned Activity handovers. |
| GET `/instruments` | Canonical Inspection certificates, renewal chain, withdrawal and source-permitted uses/readings. Snapshot assessment at use is separate from later withdrawal and current validity. |
| GET `/commissioning-backups` | Existing EN-08 Asset-linked backup evidence with owning package authority and source links. |

## Commands and recovery

All POST bodies carry schema version 1, a fresh `operation_id` and a reason. Existing `shared.edit` authority is checked at execution and original-operation recovery. No new capability or seed is added. Commands run under the existing workspace transaction lock and write immutable audit, durable receipt and outbox records. Identical retries return the original receipt; changed payload under the same operation ID is refused. Unknown results use `GET /api/v1/operations/{operation_id}` before any new operation. Client forms preserve the original operation and refuse additional changes until reconciliation.

| POST suffix | Required reviewed basis and effect |
|---|---|
| `/{asset}/changes` | Current Asset `expected_version`, exact `basis_hash`, kind, actual effective time, source/revision and consequences. Configuration supplies its exact description; move/correction supplies Site/Facility; replacement supplies a separate successor and its version. Records a proposal only. |
| `/changes/{id}/review` | Proposal `expected_version`, Apply or Reject, reason. Applying rechecks original Asset/version/impact and destination authority. Physical changes refuse unresolved parent/child, served-area and open Service relationships. Configuration successors retain original bytes. Replacement links separate identities without transferring warranties/evidence. |
| `/backups` | Exact Asset/version/configuration, protected reference/revision, capture, custodian, compatibility, procedure/revision and relationship. Retained source only; no controller restore. |
| `/backups/{id}/review` | Exact review count, Asset version/configuration and separate BackupReviewed, ProcedureReviewed, RecoveryTested or RecoveryVerified evidence. Each stage requires preceding passed evidence; final verification is independent of the tester. Repeating an earlier stage resets later current claims while retaining every event. |
| `/bulletins` | Exact bulletin revision, company, publication date, source and supported manufacturer/model/serial/configuration criteria. |
| `/bulletins/{id}/review` | Exact bulletin, Asset and prior review versions; explicit Asset disposition/source. A non-final or affected conclusion requires an existing linked owned Activity or a new canonical Activity with owner and due time. |
| `/bulletins/{id}/close` | Exact bulletin version; every candidate/reviewed Asset has a current definitive disposition. Affected work must have a completed owned Activity with an outcome. |
| `/support` | Exact Asset/version and supplier source/revision/date, explicit conclusion, uncertainty and optional support dates/replacement advice. No Asset, quotation, Project or work-authority mutation. |
| `/instruments` | Canonical instrument and exact certificate/measurement evidence. Renewal retains a predecessor/version and creates a successor; withdrawal records effective date and reason without rewriting historical use snapshots. |

Credential-like values are refused in protected evidence fields. Keep controller files, credentials and unrestricted connection strings outside normal business fields and Git. SharePoint remains intended document authority; all references here are synthetic.

## Shared handovers

SH Search continues to use canonical Asset search. Reviews & handovers projects Equipment obligations without deciding them. Canonical Activities supply My Work and notifications. Reading/archiving notifications never makes an Equipment decision. Existing saved-view targets are unchanged; Equipment register filters are URL-restorable.

CS owns Site, Facility, served-area relationships and readiness. The mobile physical-comparison acknowledgement is transient navigation context, not a canonical identity correction or permission to perform work. Inspection and Engineering retain their exact approved scope, performer/reviewer duties, calibration checks, failed findings and linked retests. Historical document revisions are never described as currently applicable merely because they are present in the timeline.

[Programme handover](../delivery/equipment-native-completion-handover.md) records implementation and executed verification separately.
