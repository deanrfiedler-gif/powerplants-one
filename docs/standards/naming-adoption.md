# Naming standard adoption and implementation record

**Date:** 5 September 2026 · **Decision:** [ADR-0005](../decisions/ADR-0005-project-naming-adoption.md) · **Owner:** Dean Fiedler · **Scope:** Private repository documentation and design contracts.

## 1. Adopted basis

Dean adopted PPO-STD-001 r02 and explicitly requested repository implementation. Powerplants One is the product and PPO its independent project code. The other project's STD-001 and SOL008 impose no naming or approval dependency.

The exact [accepted r02](../reference/baselines/PPO-STD-001-naming-conventions-r02.md) is preserved in the source manifest. The [working r03](naming-conventions.md) records adoption and current implementation status; it does not replace the accepted scheme with a different design. The working master receives an r03 naming/ownership amendment; its issued v02 remains unchanged.

**Inspected input:** `c44321e8cbbe205a482e38499016f396e2f6374d`. All 53 source files in the isolated working copy were compared by Git blob hash against that remote tree before editing.

## 2. Canonical path mapping

| Former path | Current canonical path | Treatment |
|---|---|---|
| `docs/blueprints/GEN_SPC_PPABusinessPlatform_MasterBlueprint.md` | [BP-01 master](../blueprints/BP-01-master-blueprint.md) | Rename, active references repaired, naming/ownership metadata amended; parent scope preserved |
| `docs/contracts/documents-and-issues.md` | [Document issue/distribution contract](../contracts/document-issue-distribution.md) | Rename, active references repaired, independent output naming applied |

Current navigation, package links, CSV specification locators and checker paths point to the canonical files. The old paths remain only as historical text or explicit migration aliases; there are no duplicate editable masters. ADR-0002 retains its earlier text with a supersession annotation. Original source-baseline paths remain unchanged.

## 3. Completed documentation changes

| Area | Implemented result |
|---|---|
| Naming authority | Adopted standard, ADR-0005 and active guidance identify independent PPO authority |
| Master identity | PPO-BP-01, Powerplants One / PPO and working r03 metadata; issued v02 source remains authoritative for baseline registers |
| Decisions | D-003 resolved for the private prototype; D-029 remains partially resolved for future ownership/support |
| Documentation | Root/docs indexes, blueprint register, package links, status, guidance and affected locators updated |
| Registers | Identified-document register and standing-exception register created |
| Service API | All ticket/work-order paths consolidated; existing API-C/API-R IDs and workflow semantics preserved |
| Data dictionary | Explicit atomic SYN-PPO reference allocation, offline Pending reference, aggregate/revision identity and source-key preservation |
| Document outputs | Pack/report/Finance synthetic output filenames use actual local reference and content revision |
| Project instructions | Maintained copy-ready text for the dedicated ChatGPT project; fewer than 8,000 characters |
| Checks | Existing foundation/prototype checks updated where paths changed; focused naming check added to documentation workflow |

### API route mapping

Routes below are suffixes under `/api/v1`; no deployed consumers or endpoints exist.

| Contract | Former suffix | Adopted suffix |
|---|---|---|
| API-C03 | `/work-orders/:id/authorise` | `/service/work-orders/:id/authorise` |
| API-C23 | `/work-orders/:id/close` | `/service/work-orders/:id/close` |
| API-C23 | `/tickets/:id/resolve` | `/service/tickets/:id/resolve` |
| API-C23 | `/tickets/:id/close` | `/service/tickets/:id/close` |
| API-C23 | `/tickets/:id/reopen` | `/service/tickets/:id/reopen` |

All other command/read paths retain their current contract. No compatibility aliases or new API major are implemented or implied.

### Reference allocation and implementation boundaries

The service dictionary defines ORG/SITE/AST/TKT/WO/APT/PACK/RPT/FH naming for the selected synthetic context. Existing required `display_number` fields retain their names. New Organisation/Site display references and pack/report aggregate display references are explicit design amendments. Optional Person references and later-domain record types remain optional/reserved.

UUIDs remain internal identity. A pack/report gets one readable identity shared by its content revisions. The database implementation must enforce atomic allocation and uniqueness; offline drafts show Pending reference until server allocation. No migrations, runtime generators, queues or rendered output application have been created by this documentation task.

## 4. Preserved evidence and limits

The original master v01, master v02 and audit v01 bytes/hashes remain unchanged. The accepted naming r02 is an additional manifest entry. Baseline requirements, decision questions/closure criteria and acceptance wording still derive from issued v02. Current decision resolution is recorded in separate working status/note columns.

The original 78 parent requirements, 29 decision IDs, 38 master acceptance scenarios, 30 PP-01 procedures and P01–P12 identities remain. Application procedures are still Not run. No existing requirement is declared implemented by naming adoption.

The eight open GitHub work items were inspected for the two former paths and unrelated STD-001 references; none required an issue-body update. Historical PRs/comments remain chronological evidence.

## 5. Verification and future work

Run the following in the repository:

```sh
python3 scripts/check_foundation.py
python3 scripts/check_prototype.py
python3 scripts/check_naming.py
```

**Local validation:** Passed: 4 preserved source files, 78 parent requirements, 29 decision IDs, 38 master scenarios, 30 PP-01 procedures, 12 implementation packages, 16 identified-document records and 7 standing exceptions. The copy-ready instructions contain 7,812 characters. All current local Markdown links and relevant register references resolve. Publication and merge checks are recorded in the implementing pull request and its workflow results.

The naming check validates register identities/paths, retired-path removal, case collisions in documented files, metadata and instruction length, route consistency and explicit source-reference patterns. The foundation check validates all preserved source hashes and parent/decision/acceptance traceability. These are documentation checks; they are not application or business acceptance.

Future implementation follows P01–P12. Apply adopted names while building database migrations, server reference allocation, UI labels, APIs and output generation, and test those behaviours at their appropriate work package. Verify actual vendor/customer interface requirements when live integration is authorised. The naming decision itself needs no further approval.

## 6. ChatGPT project setup

Copy the complete [project instructions](chatgpt-project-instructions.md) into the dedicated project's instructions section. This text is maintained in GitHub; changing it here does not automatically update the user's ChatGPT settings.

The instructions define roles, scope, source hierarchy, current architecture, workflow controls, autonomy, naming, verification and handover. They deliberately refer to current repository status so the dated implementation position does not become a permanent instruction.

The project can group related chats, sources and instructions; connected-source access still needs verification. [Official Projects guidance](https://learn.chatgpt.com/docs/projects)
