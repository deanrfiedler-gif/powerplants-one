# Technical reviews, issues & transmittals — native design contract

Stable entry: route:/engineering/[id]/reviews/issues. Scope: EN-05; parent: ENG-04. Owner: Dean Fiedler.
Source audit: ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc. Application route: /engineering/[id]/reviews/issues.
Status: Proposed native composition; visual and owner review pending.

## Purpose and page type

Bind independent technical decisions, formal issues and recipient evidence to exact content and purpose.
r20 page type: Register / Worklist with a docked record inspector and modal command forms. Entry routes are permission-scoped package choosers. Server persistence replaces the standalone browser-local architecture.

## Workflow and fields

1. Submit an exact review with reviewed basis, one revision per document, applicable submittals/sources, purpose, reviewer and due date.
2. The reviewer records findings; named owners respond and the reviewer accepts closure. Returned work retains its original snapshot through resubmission.
3. Complete review only when sources remain current and basis blockers, findings and supplier dispositions are resolved.
4. A separate configured issuer creates the exact reviewed issue for named synthetic recipients. Issue is not sent evidence.
5. Record Sent and Delivered separately; only the named recipient records Acknowledged. Withdraw current use without erasing history.

Submission hash, frozen content, per-document revisions, purpose, policy, contributors and reviewer are retained. Issue manifest/hash, issuer, recipients and each evidence timestamp are separate.

Review Submitted → Reviewed or Returned. Issue Issued → Withdrawn. Changed upstream sources withdraw current source use and require reassessment. Sent, Delivered and Acknowledged remain separate. No configured policy means cannot review or issue.

## Desktop

At 1440 × 960 use the existing PPO shell, shared SecondaryMenuFrame, package context, search/work queue and selected-row inspector. List and inspector each own their scroll surface. At 1024 × 768 the selected inspector occupies the width with an explicit return control. Narrow screens use one workspace scroll surface for context, filters and evidence, so a short viewport never squeezes the record into an unusable strip. State words, owner, date, purpose and exact sources stay visible. Roboto/Verdana, navy/green, line, warning and focus use shared tokens. Long filenames, paths, references and hashes wrap.

## Mobile

At 390 × 844 and 320 CSS px stack labelled search/filter fields; the selected inspector replaces the list. Context, filters and the complete record share one workspace scroll surface; package/customer/site context is repeated beside the selected record. Keep decision evidence. Use shared target sizes and 16px input text on phones. Verify Tab/Shift+Tab, Escape and focus return, 200% reflow, long references, loading, empty/filtered-empty, denied/read-only, validation, stale, saving, saved and uncertain-result states.

## Shared controls and proposed departures

Reuse ProductNavigation/ProductHeader, SecondaryMenuFrame/useSecondaryMenu, Button, ErrorNotice, EN-06 Dialog focus management and the shared operation/receipt API. Engineering-specific forms are modular. Extend shared stylesheet scope registration without changing existing module defaults.

No exact dedicated EN-05 HTML or image baseline is available. The native queue, frozen inspector and evidence dialogs are proposed PPO application design.

EN-02 retains Basis & scope, Requirements, Assumptions & questions, Interfaces, Calculations & sources, Review & handover. EN-03/EN-05 compositions remain proposed pending paired review. Missing native desktop/mobile images are explicit; do not substitute an unrelated image or rewrite issued references.

## Handovers

Incoming: Engineering package and Project/Opportunity; permitted site/facilities; retained synthetic evidence and native-authoring metadata.
Outgoing: exact reviewed basis/document/issue sources through the existing EN-06 adapter to materials, change and commissioning workflows. Each receiver retains its own duties and acceptance. SharePoint remains intended document authority; native CAD retains authorship.

## Verification and review

Guide: guide.route-engineering-id-reviews-issues. The global information icon resolves route-specific native guidance and the draft development article.
Evidence: docs/delivery/engineering-native-control-handover.md. Functional proof, visual review, business acceptance and deployment are separate. Review fields remain blank until actual review; no deployment is authorised.
