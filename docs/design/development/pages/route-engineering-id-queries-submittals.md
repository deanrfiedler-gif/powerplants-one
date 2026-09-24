# Technical queries & supplier submittals — native design contract

Stable entry: route:/engineering/[id]/queries/submittals. Scope: EN-04; parent: ENG-02 / ENG-04 / ENG-06. Owner: Dean Fiedler.
Source audit: ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc. Application route: /engineering/[id]/queries/submittals.
Status: Proposed native composition; visual and owner review pending.

## Purpose and page type

Retain formal owned questions, exact affected sources, technical answers and supplier dispositions separately from notes and procurement receipts.
r20 page type: Register / Worklist with a docked record inspector and modal command forms. Entry routes are permission-scoped package choosers. Server persistence replaces the standalone browser-local architecture.

## Workflow and fields

1. Add a query with exact sources, owner, requested response date, affected deliverables and review requirement.
2. The responsible owner records the formal response, resulting actions and optional same-package EN-07 change.
3. A separate technical reviewer disposes the answer where review is required.
4. Supplier submittals retain supplier/product context, optional PO reference, submitted revision, evidence, assigned reviewer and downstream actions.
5. Returned/rejected supplier content needs a successor. Technical acceptance never records a goods receipt.

Question, requester, owner, due date, exact sources, response author/date and actions remain distinct facts. A PO reference is context only.

Query Open → Answered → Resolved or Returned; no-review queries resolve on formal response. Submittal Submitted → Accepted, Returned or Rejected. Accepted content is superseded by an explicit successor.

## Desktop

At 1440 × 960 use the existing PPO shell, shared SecondaryMenuFrame, package context, search/work queue and selected-row inspector. List and inspector each own their scroll surface. At 1024 × 768 the selected inspector occupies the width with an explicit return control. Narrow screens use one workspace scroll surface for context, filters and evidence, so a short viewport never squeezes the record into an unusable strip. State words, owner, date, purpose and exact sources stay visible. Roboto/Verdana, navy/green, line, warning and focus use shared tokens. Long filenames, paths, references and hashes wrap.

## Mobile

At 390 × 844 and 320 CSS px stack labelled search/filter fields; the selected inspector replaces the list. Context, filters and the complete record share one workspace scroll surface; package/customer/site context is repeated beside the selected record. Keep decision evidence. Use shared target sizes and 16px input text on phones. Verify Tab/Shift+Tab, Escape and focus return, 200% reflow, long references, loading, empty/filtered-empty, denied/read-only, validation, stale, saving, saved and uncertain-result states.

## Shared controls and proposed departures

Reuse ProductNavigation/ProductHeader, SecondaryMenuFrame/useSecondaryMenu, Button, ErrorNotice, EN-06 Dialog focus management and the shared operation/receipt API. Engineering-specific forms are modular. Extend shared stylesheet scope registration without changing existing module defaults.

Engineering r02 conceptual source: docs/reference/ui/engineering/PPO-Engineering-Container-r02.html. The persisted query answer has exact desktop/phone implementation captures in the evidence index; other EN-04 views lack exact captures. Queries remain contextual without a new Engineering rail slot.

EN-02 retains Basis & scope, Requirements, Assumptions & questions, Interfaces, Calculations & sources, Review & handover. EN-03/EN-05 compositions remain proposed pending paired review. Inspected native desktop/phone captures and their exact routes/states are indexed in [Engineering implementation evidence](../../../testing/evidence/engineering-native-control/README.md). These are implementation captures, not an approved visual baseline; views not listed there still lack exact captures.

## Handovers

Incoming: Engineering package and Project/Opportunity; permitted site/facilities; retained synthetic evidence and native-authoring metadata.
Outgoing: exact reviewed basis/document/issue sources through the existing EN-06 adapter to materials, change and commissioning workflows. Each receiver retains its own duties and acceptance. SharePoint remains intended document authority; native CAD retains authorship.

## Verification and review

Guide: guide.route-engineering-id-queries-submittals. The global information icon resolves route-specific native guidance and the draft development article.
Evidence: docs/delivery/engineering-native-control-handover.md. Functional proof, visual review, business acceptance and deployment are separate. Review fields remain blank until actual review; no deployment is authorised.
