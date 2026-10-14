# Document and form template management — design reference

Stable entry: `scope:DK-06`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/documents/templates`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement document/form template management, preview, applicability, approval and publication.

1. Review the template and conditional fields
2. Preview it with synthetic representative data
3. Publish the exact reviewed revision for its intended use

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Document-and-Form-Template-Management-r01.html](../../../reference/ui/template-management/PPO-Document-and-Form-Template-Management-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.dk.06` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Native backend receiving increment — 13 October 2026

[DK-06 R1](../../../decisions/template-catalogue-backend.md) supplies a read-only catalogue and usage API for OUT-09, OUT-10 and OUT-14. The [contract](../../../contracts/template-catalogue.md) separates exact retained identity, dependency manifests, current policy selection and renderer support. Usage respects native family and consumer permissions; crew drafts and Finance details remain protected. File availability is not checked, and no publication or download event is created.

The native `/documents/templates` page remains unbuilt. The retained HTML above is a standalone design source, not a deployed screen; accepted native desktop/phone comparison images are missing. A future page must expose unknown legacy dependencies, unsupported/changed definitions, scoped continuation and denied/empty reads using existing shared controls. Preserve the exact selected ID on desktop and phone, show dependency paths/hashes without clipping, and label current policy separately from support. Backend API verification is in the [execution ledger](../../../testing/evidence/template-catalogue/README.md); this does not update the visual review fingerprint.

## Managed proposal backend — 13 October 2026

[R2](../../../decisions/document-template-drafts-backend.md) now supplies scoped structured proposal, revision, review and recovery APIs under explicit default-denied duties. A future Record Workspace must show the local company/site review context, exact base, proposed field bindings, fingerprint and independent review observations. Draft, Reviewed and ChangesRequested describe proposal evidence only; publication eligibility remains false. New edits reset the current review status while historical reviews retain their exact revision.

Reuse shared record/context, form validation, status, table/card, Button and dialog controls when native authoring is implemented. Retain exact revision context and stale/uncertain original recovery on desktop and phone; no screenshot or visual acceptance is supplied by this backend increment. Incoming handover is an exact R1 base; outgoing is retained proposal/review evidence for separate R3 implementation. [R2 execution evidence](../../../testing/evidence/template-drafts/README.md) does not change the visual review fingerprint.
