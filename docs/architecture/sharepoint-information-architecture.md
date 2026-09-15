---
document_id: PPO-SP-ARCH
revision: r01
status: Proposed configuration; no tenant provisioning or live connection
owner: Dean Fiedler — personal prototype owner
date: 2026-09-15
---

# SharePoint Information Architecture and Configuration Specification

[Package](../delivery/naming-sharepoint-handover.md) · [Functional specification](../blueprints/naming-and-communication-assistance.md) · [Document contract](../contracts/document-issue-distribution.md) · [Pilot](../delivery/naming-sharepoint-pilot.md)

## 1. Design decision and boundaries

Use a dedicated private collaboration site for an isolated synthetic pilot, then a separately configured operational site when organisational ownership, access and retention are established. A modern site contains document libraries; shallow record folders organise files within each library. Separate libraries where audience, lifecycle or controls differ. No deep subsite tree, database replacement, automatic migration or tenant provisioning is performed here.

SharePoint owns business-file originals and controlled issued copies. PPO PostgreSQL owns business records, document relationships, naming operations, review/issue/distribution events and recovery. Outlook owns email originals; GitHub owns application source and development specifications. Existing native CAD authoring and dependency controls remain. Do not store secrets, database backups, live mailbox exports or all application logs in these libraries.

The six-library target is a proposal. Site URLs, existing libraries, Microsoft licensing, storage, actual tenant policies and operational role assignments have not been inspected. Microsoft supports organising content through sites, metadata and views; these exact names and arrangements are PPO design choices, not an ISO-prescribed structure. [Information architecture](https://learn.microsoft.com/en-us/sharepoint/information-architecture-modern-experience).

## 2. Site configuration

| Setting | Sandbox | Operations |
|---|---|---|
| Display name | Powerplants One — Sandbox | Powerplants One — Operations |
| Proposed URL segment | `ppo-sandbox` | `ppo-operations` |
| Purpose | Fictional service-job integration and failure/recovery proof | Authorised business document operations after acceptance |
| Initial libraries | Work Documents, Templates, Issued Documents | Add libraries below when their workflow/access model is ready |
| Membership | Named approved test users; real authentication before Microsoft connection | Company-approved groups and designated site owners |
| External sharing | Disabled for the pilot | Default internal; any customer sharing is a separate reviewed channel |
| Application identity | Dedicated test registration/resource grants | Separate operational configuration and resource grants; never reuse test credentials |
| Data | SYN-PPO examples only | Approved business information only after rollout decision |

Use short URL segments at creation and friendly display titles. Store resolved provider IDs in private configuration; these proposed strings are not actual resource IDs. Establish at least two company-authorised site owners before operational use; no person is appointed by this design. A separate restricted commercial site can be reused where its boundary is appropriate. Users of RTF Climate or another company do not inherit Powerplants Australia access merely through a shared PPO app.

## 3. Library configuration matrix

All rows inherit the baseline columns and controls in Sections 4–6. “Owner” identifies a proposed responsibility, not a confirmed person. Required metadata blocks promotion to a filed/issued state, not receipt of a recoverable incomplete upload.

| Library / URL segment | Purpose, owner and audience | Folder pattern / document types | Metadata additions and naming | Version / issue / integration treatment |
|---|---|---|---|---|
| Work Documents / `work-documents` | Working briefs, estimates, engineering packages, project/service/procurement evidence; owning process lead; permitted contributors | `<record reference> - <short description>`; brief, working estimate, site-photo, inspection evidence, supplier response | Owning work ID/reference required when filed; domain/type required; site/equipment conditional. Stable working name; original retained | Version history enabled; ordinary edits create provider versions. New upload/metadata simulation first; live writes later. Restricted cost files route to commercial location |
| Site and Equipment Records / `site-equipment` | Enduring location, installation and equipment history; technical/data owner; scoped coordination/service readers | Site folder, optionally equipment folder. Site plan, configuration, installation evidence, commissioning record | Site required; equipment required for equipment-specific record; facility/growing area optional but selected from known context | Version history; issued technical records protected under their release policy. One file may link to several jobs without duplication |
| Technical Reference / `technical-reference` | Reusable manuals, datasheets and reviewed guidance; technical knowledge owner; authorised technical readers | Manufacturer, optional product family. Supplier manual, datasheet, bulletin, knowledge note | Manufacturer/model where applicable; source reference/version; review owner/status. Preserve supplier original name with search alias | Versions and source provenance; reviewed does not prove supplier currency. Maintain supersession link and applicability |
| Templates / `templates` | Controlled output and communication definitions; template/document-control owner; maintainers edit, others use approved revisions | Document/channel type. Quotation, job pack, report, inspection, email-subject and task-notification template | Template ID/version, audience, type, approval evidence required before use. No guessed logo/contact/legal block | Separate draft and approved availability. Output binds exact approved template revision/hash. Template publication does not rewrite prior output |
| Issued Documents / `issued-documents` | Exact operational releases; authorised issuer/document controller; readers scoped to the output's audience | Owning record folder. Quotation, pack, report, published drawing, handover | Document ID/reference, issued revision, issue ID/time, classification and hash required. Use actual reference + type + rNN | No ordinary overwrite/rename of issued content. Retained snapshot/record controls and restore verified before live issue. Folder membership does not grant customer access; restricted Finance output stays restricted |
| Restricted Commercial Records / existing suitable restricted location, otherwise `commercial-records` | Internal costs/margins, confidential supplier terms, Finance evidence; company-appointed commercial/Finance owner; restricted groups | Owning record folder; working cost model, terms, Finance supporting evidence | Company/entity, classification and permitted audience required; exact source references preserved | Separate working and issued states with corresponding controls. PPO denies indirect search/preview leaks. Prefer an existing suitable Finance boundary over duplicating its source records |

Folder naming is for navigation. Do not move records when a work item closes, changes owner or converts from opportunity to project. Use views and explicit relationship links. If a library has incompatible audiences, split its security boundary before adding content; do not compensate by hiding rows in a view.

## 4. Column schema and mapping

Suggested SharePoint internal column names use a stable `PPO` prefix; PPO API/database fields retain snake_case. Microsoft built-in columns keep their own names. Column lengths/types and endpoint behaviour must be checked in the actual library pilot.

| Display label / internal name | Type | Requirement and source | Index/view use |
|---|---|---|---|
| Document title / Title | Text | Human-readable title; contributor may edit | Display and text search |
| PPO document ID / PPODocumentId | Text UUID | Automatic, immutable after registration | Indexed exact lookup; server mapping enforces uniqueness |
| Owning record ID / PPORecordId | Text UUID | Required on filing; from selected permitted record | Indexed; no arbitrary pasted record IDs |
| Record reference / PPORecordRef | Text | Automatic readable label; not identity | Indexed filter; reference search |
| Record type / PPORecordType | Controlled choice | Required; selected contract type | Filter/group |
| Business domain / PPODomain | Controlled choice | Required; seven maintained PPO domains | Filter/group; not security |
| Document type / PPODocumentType | Controlled choice | Required on filing; type catalogue in matrix | Indexed filter and naming rule |
| Organisation/site IDs / PPOOrganisationId, PPOSiteId | Text UUID | Auto from confirmed context; site conditional | Index site when expected volumes justify it |
| Facility/growing area / PPOFacilityId, PPOGrowingAreaId | Text UUID | Optional; only actual known IDs. Fixture labels do not allocate IDs | Views; labels resolved by PPO |
| Equipment ID / PPOEquipmentId | Text UUID | Required for equipment-specific document | Filter; additional equipment links live in PPO |
| Company/entity / PPOCompanyId | Text UUID | Automatic from authorised owning context | Indexed; access also enforced independently |
| Classification / PPOClassification | Controlled choice | Required; Internal, RestrictedCommercial, CustomerEligible are proposed values | Audience checks; CustomerEligible is not a share grant |
| Naming state / PPONamingState | Controlled choice | Automatic: NeedsReview, Compliant, Exception, Conflict | Indexed review queue |
| Naming rule / PPONamingRuleVersion | Text | Actual applied rule ID/version | Audit and controlled impact review |
| Original filename / PPOOriginalFilename | Text | Captured once; preserve Unicode and exact received spelling | Original-name search; restrict where sensitive |
| Content revision / PPOContentRevision | Integer | Conditional for controlled content; never inferred from filename | Compare numerically; render rNN |
| Issue ID/time / PPOIssueId, PPOIssuedAt | Text UUID / UTC date-time | Conditional, populated from committed authorised issue | Current issued views |
| Content hash / PPOContentHash | Text | Server-computed SHA-256 of exact bytes | Verification, not a retention guarantee |
| Responsible owner / PPOOwner | Person or mapped identity | Required for filed records; company directory mapping verified at pilot | My documents/owned exceptions |

Provider tenant/site/drive/item/version IDs, eTag, operation receipts, detailed name history and many-to-many relationships belong in PPO's integration records. Do not require cross-site SharePoint lookup columns to reproduce the entire PPO database. SharePoint columns are a useful projection, not independent authority for scope/revision approval.

To prevent overly burdensome forms, initially require only type, selected owning record and a useful description; derive company/reference/context. Allow unknown fields in an owned Needs filing queue. The live receiving implementation must define indexed filters/paging and verify representative volume before declaring search complete. Plain folder selection alone does not avoid SharePoint list-view thresholds.

## 5. Views and folder examples

| View | Filter/group | Who can use it |
|---|---|---|
| Needs filing / Naming review | Missing owning context or naming NeedsReview/Conflict | Permitted contributors/reviewers |
| By work record | Record type then reference | Current authorised readers |
| By site / By equipment | Exact mapped site/equipment | Scoped operational readers |
| Current issued | Actual committed issue; applicable current revision | Output audience; application shows as-at state |
| My unresolved exceptions | Responsible owner plus unresolved state | Current owner/reviewer |
| Technical reference | Manufacturer/product/type and review state | Technical readers |

Synthetic folder: `Work Documents/SYN-PPO-WO-000001 - Irrigation controller service/`. Working file: `SYN-PPO-WO-000001-site-access-notes.docx`. Filed photo: `SYN-PPO-APT-000001-controller-terminal-photo-01.png`. Issued report: `Issued Documents/SYN-PPO-WO-000001 - Irrigation controller service/SYN-PPO-RPT-000001-service-report-r01.pdf`.

These are display paths below a library; live length checks include the actual decoded server path. Follow PPO's 200-character path target and 120-character filename maximum, with explicit exceptions where necessary; Microsoft has additional platform/client constraints. Shorten a description before a stable reference or revision. Never silently truncate or add repeated `(1)` suffixes. Existing source names and dependency-sensitive folders may retain a recorded exception.

## 6. Permissions, versions, retention and issued copies

Proposed groups are Site Owners, Work Contributors, Naming Reviewers, Template Maintainers, Document Issuers, Operational Readers and Restricted Commercial Readers. Library permissions may narrow a broader site audience; use a separate site where confidentiality/ownership warrants it. Direct SharePoint access, downloads, search, thumbnails and PPO previews must agree. Customer distribution is a distinct reviewed flow; an issued-library location is not a public share. [Sharing and permissions](https://learn.microsoft.com/en-us/sharepoint/modern-experience-sharing-permissions).

Enable version history and record chosen limits explicitly before the pilot. Do not require checkout by default for ordinary coauthoring; confirm exceptions for specialised files. Working file version, PPO content revision, technical approval and issue event remain separate. Restrict issued items from ordinary editing; test the selected supported retention/record or protected-snapshot mechanism against privileged editing, version expiry, deletion and restore. An ordinary versioned library alone is not proof of immutable retention. Actual limits, retention periods, legal holds and disposal authority are unassigned decisions; no arbitrary seven-year period is adopted. [Version history](https://learn.microsoft.com/en-us/sharepoint/version-overview).

The sandbox uses fictional content with an agreed test cleanup date and content-free evidence retention. Test cleanup must check issue references and backups and keep failures owned. Production retention/restore responsibilities must be recorded separately by the company owner.

## 7. Integration and provisioning sequence

Use the existing replaceable adapter architecture. Evaluate narrowly selected resource grants and delegated versus application modes using the actual endpoints and administrator's policy. Microsoft Selected permissions require both consent and resource assignments; possession of a consented scope alone does not grant access. Do not default to tenant-wide file access or treat a configured library filter as a permission boundary. [Selected permissions](https://learn.microsoft.com/en-us/graph/permissions-selected-overview).

1. Record actual tenant, allowed test site/library, account types, owners, licences, retention and network/authentication prerequisites privately.
2. Provision only the authorised sandbox's three initial libraries, columns and groups; capture configuration IDs and a before/after inventory. Provisioning is outside this design task.
3. Connect a real authenticated test identity in an isolated PPO environment; deny the synthetic actor selector and operational destinations.
4. Read permitted metadata with paging/checkpoints; compare direct SharePoint and PPO visibility. Keep all writes disabled in this first stage.
5. Enable only approved fictional upload/folder and rename operations in later stages. Use source eTags, exact item identity, collision refusal, verified read-back and operation reconciliation.
6. Validate exact issued snapshots separately before claiming live issue. Disconnect/revoke access and restore tests must pass before operational rollout.

Graph's item update supports a name change and conditional `If-Match`; source mismatch returns 412. Name and column updates may require separate provider calls, so retain per-step receipts and reconcile partial outcomes. Preserve IDs/version/hash context; cross-library moves may require remapping and are outside the first rename pilot. [Update DriveItem](https://learn.microsoft.com/en-us/graph/api/driveitem-update?view=graph-rest-1.0).

## 8. Existing information, CAD and migration

Inventory and link existing files before moving them. Capture original name/path, provider identity/version/hash, owner, audience, referenced work/equipment, duplicate candidates and dependency risks. A suggested new name is not permission to merge/delete a duplicate. Start with reviewed isolated non-issued files; retain originals through the validated mapping and change history.

Supplier-controlled drawings/manuals and SOLIDWORKS assemblies/parts/drawings retain source names and dependencies until supported authoring/PDM procedures are verified. Use aliases for discoverability. Existing company reference numbers remain exact. Normalised estimating workbooks, if later brought into this workflow, are derivative sources linked to retained original workbook/version; this package performs no extraction or migration. Approval of a folder layout does not transfer authority from MYOB or SharePoint.

## 9. Open configuration decisions

| Decision | Evidence/owner required | Blocks |
|---|---|---|
| Actual tenant/site and ownership | Microsoft administrator and company document owner | Provisioning/connection |
| Identity, scopes and resource grants | Endpoint-specific proof and private configuration record | Every live operation |
| Operational role/access mapping, including commercial records | Company-authorised owners; direct-access negative tests | Operational data |
| Template branding/review and output acceptance | Actual document/Engineering/Commercial authorities | Live controlled issue |
| Retention, restore, hold, disposal and capacity | Company records/IT owners; configured limits and restore evidence | Operational retention claims |
| CAD/PDM dependency handling | Native authoring owner and supported procedure | Native rename/move |

These continue D-012, D-024 and D-025 and existing Engineering/integration evidence obligations. They do not block the authorised synthetic design package.
