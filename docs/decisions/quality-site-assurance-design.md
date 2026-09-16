---
document_id: PPO-QA-WORKSPACE-DES
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Authorised design creation; owner acceptance and application integration separate
source_commit: a4061c43b11d6a53604ec628cdf370ee72f54f7a
---

# Quality, Safety & Site Assurance workspace

Dean authorised the recommended six-view Quality, Safety & Site Assurance HTML and a professional, detailed companion Markdown report. The design centres on readiness to proceed, evidence requiring review and corrections required before release.

## Review deliverables

- [Interactive workspace r01](../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html).
- [Detailed companion report r01](../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-Report-r01.md): 20 sections covering all views, fields, states, roles, examples, recovery, visual rules and receiving boundaries.
- [Reproducible source and check commands](../design/quality-site-assurance/README.md).
- [Actual verification record](../testing/evidence/quality-site-assurance-r01/README.md).

## Problem and delivered behaviour

Equipment r02 already demonstrates inspection and retest, while the Quality/Safety/Site Assurance map describes broader review. This contribution supplies a dedicated shared workspace connecting site sources, evidence, corrections, incidents and scoped release.

The six views are Overview, Site readiness, Inspections, Defects & retests, Incidents & actions, and Review & release. Northbank’s existing asset UUID/reference, work order, installed Irrigation room and served Glasshouse 02 remain consistent with Equipment r02. Greenhaven adds an independent incident hold; Cedar Vale retains missing criteria and owned Engineering work.

The primary journey is source confirmation → technician acknowledgement → failed pressure submission → retained reviewer return → corrective work → fresh passing retest → evidence acceptance → explicit scoped release → local receiving handover. Multiple failures reuse the open check defect. Every submission, review reason and correction is retained. A release preserves exclusions and outstanding OEM work; source changes withdraw its current applicability without deleting history.

## Source and design decisions

The contribution starts from main `a4061c43b11d6a53604ec628cdf370ee72f54f7a`, including merged Scheduling PR #205. Warranty #206 and index-audit #207 are independent contributions and are not overwritten or adopted as approved design baselines.

Visual source: [theme r20](../reference/ui/theme-style-board/powerplants-one-theme-style-board-r20.html), SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. The exact embedded Roboto declarations and established palette are reused. The module-only layout uses contiguous summary cells, labelled responsive worklists, centred forms and record-specific right-hand snapshots.

The established standalone HTML/CSS/JavaScript and Python assembly pattern from Maintenance and Service Review is retained. This is not a new technology choice: no framework, dependency, database migration, application route, external provider or hosting system is introduced. A focused CI workflow reuses the existing pinned Actions, Node/npm and native Chrome installation pattern.

Functional authority remains the [Service data dictionary](../contracts/service-data-dictionary.md), [API](../contracts/service-api.md), [document issue contract](../contracts/document-issue-distribution.md), [Equipment r02 handover](equipment-workspace-design.md), [adopted quality requirements](../requirements/product-quality-register.md) and [delivery plan](../delivery/product-quality-plan.md). The [workflow map](../reference/ui/module-workflow-maps/PPO-Quality-Safety-and-Site-Assurance-Workflow-Map-r01.html) and [coverage register](../reference/ui/module-page-register/PPO-HTML-Page-Coverage-Register-r06.html) remain preserved source references.

## Traceability

CS-06 and FI-03–FI-06 are page-coverage identifiers. F01/F02/F08 are adopted derived features. Related parent requirements are ENG-07, PRJ-06/08, SVC-03/06/10, DOC-01/02/03 and NFR-01/07/09. D-019 retains operational policy and competent-review requirements. AT-17 is demonstrated in a bounded synthetic failed-check/retest/partial-release journey; full acceptance is not claimed. The 78 original parent IDs are unchanged.

Local `SYN-QA-*` package/evidence labels are design fixture identifiers, not new production reference-allocation rules. Source owners, procedure values, event examples and role assignments are fictional.

## Verification and acceptance

The linked evidence record contains executed results and exact hashes. Local source/model/documentation checks are distinct from native rendering. Local preview navigation was blocked by the available browser, so native checks and captures are executed through the repository’s focused GitHub workflow. No alternate local browser was used to bypass the block.

The focused review completed with 27 model groups and 23 native Chrome groups passing, plus inspection of the original desktop and phone captures. Keep this as a draft contribution for owner review. Dean’s acceptance of the finished visual, real-device/screen-reader verification, operational policies, runtime integration and full application acceptance remain separate. Creating the design is authorised; the finished design is not automatically an accepted implementation baseline.

## Receiving boundaries and recovery

The HTML stores a versioned local demonstration session. It includes original-operation receipt recovery, failed-save handling, export/restore, damaged-state preservation and role display. These are not server authentication, secure incident access, tamper-proof records or a production offline queue.

Equipment, Work Orders, Field Technicians, Service Review and Project Readiness snapshots use the selected record and identify the actual receiving purpose. Reference links open repository designs. Prepared handovers are local proposals; they create no application records or notifications. Runtime delivery must reuse canonical identities, server permissions, exact immutable evidence, source/concurrency validation and receiving-domain commands.

MYOB remains ERP authority, SharePoint remains the intended controlled business-document authority, and native CAD keeps authoring responsibility. No customer/supplier communication, booking, stock/accounting movement, equipment operation, production deployment or schedule change is performed. All existing paused schedules remain paused.

Recovery is to revert this complete isolated design contribution. Existing issued HTML, accepted-baseline hashes and application data are unchanged.
