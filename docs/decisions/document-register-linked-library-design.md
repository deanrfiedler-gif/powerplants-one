---
document_id: PPO-DOCLIB-DES
title: Document Register and Linked Library design and receiving handover
revision: r01
date: 2026-09-17
owner: Dean Fiedler
status: Authorised standalone design; owner acceptance and application integration separate
source_commit: aa94dcdcb1dd08798be240325857c3d32d04af02
---

# DK-01 / DK-02 — Document Register & Linked Library

Dean authorised creating the shared document workspace with a detailed companion Markdown report. The package retains DK-01 and DK-02 from the r06 page register, DOC-01–DOC-06 parent identities, the r20 Document & evidence workspace and the maintained source/issue/distribution contract.

## Deliverable

The [HTML](../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html) provides six views: register, exact document detail, revision review, usage/impact, source exceptions and history. The [report](../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-Report-r01.md) covers the features, information, fixture catalogue, rules, conformance, recovery, limitations and receiving boundaries. [Source guide](../design/document-library/README.md); [verification](../testing/evidence/document-library-r01/README.md).

The ten fictional documents include an irrigation drawing revised from r02 to r03, a later r04 source event, unavailable historical/manual and calibration references, a source outage, a restricted placeholder, a withdrawn drawing and exact pack/quotation/report context. Findings, responses, independent acceptance, exact decisions and prepared follow-up actions persist locally.

## Source and design choices

| Area | Decision |
|---|---|
| Exact repository source | Main aa94dcdcb1dd08798be240325857c3d32d04af02; inspected independently of STATUS’s older aggregate baseline. |
| Scope identity | DK-01 primary; DK-02 supporting; r06 page register. No new domain or requirement identity. |
| Visual type | r20 Document & evidence workspace, supported by Register / worklist and Review / comparison. |
| Reuse | r20 font, tokens and primitives through the existing Supplier Pricing source family; hash-guarded source manifest. |
| Composition | Workspace-only header, six local tabs, desktop 448 px dock, flexible document view and 292 px context column; responsive cards and modal phone snapshot. |
| Proposed rules | Illustrative review-role separation, exact-version decisions, finding response acceptance and one prepared task per target. These require receiving authority confirmation. |
| Source authority | SharePoint remains intended business-document authority; PPO owns record linkage and controlled review evidence. Native CAD and MYOB boundaries remain unchanged. |
| Alternatives | A simple attachment list would omit cross-record impact and historical evidence. A native SharePoint implementation is outside this synthetic design increment and requires verified provider configuration. |

## Incoming and outgoing handovers

Incoming references need permitted business context, provider identity, exact version, applicability and availability. Source content and current status are separate. Missing/restricted versions cannot be replaced automatically with a later file.

Outgoing review evidence retains the exact source snapshot, purpose, rationale, reviewer and findings. Impact/recovery tasks remain Prepared locally; domain owners must receive and accept their own work. No review here authorises work, changes accepted quotation scope, issues a pack, sends a message or carries an acknowledgement to new content.

DK-03 remains the next output, issue and distribution design boundary. Its implementation must preserve Generated/Reviewed/Issued/Sent/Delivered/Opened/Acknowledged as distinct facts.

## Integrity and recovery

The model refuses author self-review, unresolved positive reviews, historical current-use decisions, duplicate exact decisions, stale state/source forms and duplicate prepared target actions. Valid source and decision snapshots remain unchanged after a successor. Browser failures retain form entries. Malformed state is preserved with writes paused. Scoped export and UI reads demonstrate intended visibility.

Browser storage is not a production transaction or security mechanism: simultaneous writes still require server atomicity, embedded fixtures are public to file inspection, and retention/audit controls remain receiving work. JSON export is a review copy, not a backup import. Future integration must scope the standalone stylesheet to the module host.

## Acceptance and publication boundary

The contribution contains standalone design code and documentation. It changes no runtime route, dependency, migration, live provider, production record, accepted UI baseline, deployment or access configuration. Actual results and publication source are maintained in the verification record and pull request. Owner acceptance, native-device/screen-reader checks, provider evidence and application integration remain separate.
