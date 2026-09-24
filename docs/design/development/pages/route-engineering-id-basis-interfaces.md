# Design basis & interfaces — native design contract

Stable entry: route:/engineering/[id]/basis/interfaces. Scope: EN-02; parent: ENG-02. Owner: Dean Fiedler.
Source audit: ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc. Application route: /engineering/[id]/basis/interfaces.
Status: Proposed native composition; visual and owner review pending.

## Purpose and page type

Retain exact requirements, assumptions, constraints, questions, interfaces and calculation references for one controlled basis.
r20 page type: Register / Worklist with a docked record inspector and modal command forms. Entry routes are permission-scoped package choosers. Server persistence replaces the standalone browser-local architecture.

## Workflow and fields

1. Add the basis reference, title, owner, required date, purpose, scope, exclusions, facility applicability and exact sources.
2. Requirements retain acceptance criteria, source evidence, owners and affected deliverables. Assumptions & questions retain owned uncertainty and due dates.
3. Interfaces name distinct provider and receiver, required input, expected output and agreement criterion. Each person confirms their saved side.
4. Calculations & sources retains model reference, version and check evidence; PPO provides no new calculator.
5. Review & handover submits a frozen snapshot to an independent reviewer. Returned work needs a successor and accepted closure of earlier findings.

Stable-ID typed child rows belong to the versioned basis. File version, engineering revision and reviewed basis revision remain distinct. Unknown inputs and dates remain explicit.

Draft → Submitted → Reviewed or Returned. Missing sources, blocking unknown inputs, unconfirmed interface sides or absent calculation evidence prevent a positive decision. A successor requires renewed confirmation.

## Desktop

At 1440 × 960 use the existing PPO shell, shared SecondaryMenuFrame, package context, search/work queue and selected-row inspector. List and inspector each own their scroll surface. At 1024 × 768 the selected inspector occupies the width with an explicit return control. Narrow screens use one workspace scroll surface for context, filters and evidence, so a short viewport never squeezes the record into an unusable strip. State words, owner, date, purpose and exact sources stay visible. Roboto/Verdana, navy/green, line, warning and focus use shared tokens. Long filenames, paths, references and hashes wrap.

## Mobile

At 390 × 844 and 320 CSS px stack labelled search/filter fields; the selected inspector replaces the list. Context, filters and the complete record share one workspace scroll surface; package/customer/site context is repeated beside the selected record. Keep decision evidence. Use shared target sizes and 16px input text on phones. Verify Tab/Shift+Tab, Escape and focus return, 200% reflow, long references, loading, empty/filtered-empty, denied/read-only, validation, stale, saving, saved and uncertain-result states.

## Shared controls and proposed departures

Reuse ProductNavigation/ProductHeader, SecondaryMenuFrame/useSecondaryMenu, Button, ErrorNotice, EN-06 Dialog focus management and the shared operation/receipt API. Engineering-specific forms are modular. Extend shared stylesheet scope registration without changing existing module defaults.

Retained EN-02 six-view HTML: docs/reference/ui/engineering-basis/PPO-Design-Basis-and-Interface-Register-r01.html. No exact accepted native screenshot exists.

EN-02 retains Basis & scope, Requirements, Assumptions & questions, Interfaces, Calculations & sources, Review & handover. EN-03/EN-05 compositions remain proposed pending paired review. Missing native desktop/mobile images are explicit; do not substitute an unrelated image or rewrite issued references.

## Handovers

Incoming: Engineering package and Project/Opportunity; permitted site/facilities; retained synthetic evidence and native-authoring metadata.
Outgoing: exact reviewed basis/document/issue sources through the existing EN-06 adapter to materials, change and commissioning workflows. Each receiver retains its own duties and acceptance. SharePoint remains intended document authority; native CAD retains authorship.

## Verification and review

Guide: guide.route-engineering-id-basis-interfaces. The global information icon resolves route-specific native guidance and the draft development article.
Evidence: docs/delivery/engineering-native-control-handover.md. Functional proof, visual review, business acceptance and deployment are separate. Review fields remain blank until actual review; no deployment is authorised.
