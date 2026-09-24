# Drawings & controlled documents — native design contract

Stable entry: scope:EN-03. Scope: EN-03; parent: ENG-03. Owner: Dean Fiedler.
Source audit: ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc. Application route: /engineering/drawings.
Status: Proposed native composition; visual and owner review pending.

## Purpose and page type

Govern stable document identities, exact native source revisions and accountable deliverables while CAD tools retain authorship and dependencies.
r20 page type: Register / Worklist with a docked record inspector and modal command forms. Entry routes are permission-scoped package choosers. Server persistence replaces the standalone browser-local architecture.

## Workflow and fields

1. Add the stable document reference, title, discipline, source type and owner.
2. Retain a new document revision with native authoring system/reference, native version, engineering revision, optional reviewed basis/configuration and published output reference/version/SHA-256.
3. Use Accountable deliverables for owner, required date, prerequisite evidence and next action.
4. Planned hours require a planning source; authorised hours require authorisation evidence. Actual effort and availability are not governed and no utilisation is calculated.
5. Open Technical reviews to bind one exact revision per document. Different documents can have different engineering revisions.

Stable document UUID/reference differs from native version, engineering revision, output version/hash, review and purpose. A deliverable may link one controlled document.

A new revision supersedes current use of the old source while retaining every historical revision. Missing prerequisite evidence is blocked work. Coordination progress never means Released.

## Desktop

At 1440 × 960 use the existing PPO shell, shared SecondaryMenuFrame, package context, search/work queue and selected-row inspector. List and inspector each own their scroll surface. At 1024 × 768 the selected inspector occupies the width with an explicit return control. Narrow screens use one workspace scroll surface for context, filters and evidence, so a short viewport never squeezes the record into an unusable strip. State words, owner, date, purpose and exact sources stay visible. Roboto/Verdana, navy/green, line, warning and focus use shared tokens. Long filenames, paths, references and hashes wrap.

## Mobile

At 390 × 844 and 320 CSS px stack labelled search/filter fields; the selected inspector replaces the list. Context, filters and the complete record share one workspace scroll surface; package/customer/site context is repeated beside the selected record. Keep decision evidence. Use shared target sizes and 16px input text on phones. Verify Tab/Shift+Tab, Escape and focus return, 200% reflow, long references, loading, empty/filtered-empty, denied/read-only, validation, stale, saving, saved and uncertain-result states.

## Shared controls and proposed departures

Reuse ProductNavigation/ProductHeader, SecondaryMenuFrame/useSecondaryMenu, Button, ErrorNotice, EN-06 Dialog focus management and the shared operation/receipt API. Engineering-specific forms are modular. Extend shared stylesheet scope registration without changing existing module defaults.

No exact dedicated EN-03 HTML or image baseline is available. This native register/inspector is proposed, informed by BP-01 ENG-03, Engineering r02 and EN-06/EN-07.

EN-02 retains Basis & scope, Requirements, Assumptions & questions, Interfaces, Calculations & sources, Review & handover. EN-03/EN-05 compositions remain proposed pending paired review. Missing native desktop/mobile images are explicit; do not substitute an unrelated image or rewrite issued references.

## Handovers

Incoming: Engineering package and Project/Opportunity; permitted site/facilities; retained synthetic evidence and native-authoring metadata.
Outgoing: exact reviewed basis/document/issue sources through the existing EN-06 adapter to materials, change and commissioning workflows. Each receiver retains its own duties and acceptance. SharePoint remains intended document authority; native CAD retains authorship.

## Verification and review

Guide: guide.en.03. The global information icon resolves route-specific native guidance and the draft development article.
Evidence: docs/delivery/engineering-native-control-handover.md. Functional proof, visual review, business acceptance and deployment are separate. Review fields remain blank until actual review; no deployment is authorised.
