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

**Accepted design, 15 October 2026:** the [Template management design decision](../../../decisions/template-management-figma-design.md), captures 01–15 in [Template management design r01](../../../reference/ui/template-management/template-management-figma-r01/README.md). The register at `/documents/templates` (label "Templates") follows the accepted register pattern with a required family choice, identity order, no counts, search or column sort, and a small snapshot; the definition record (`/documents/templates/{family}/{id}`) has Definition, Usage and Publication tabs and the proposal record (`/documents/templates/proposals/{id}`) has Proposal, Review, History and Publication tabs on the shared record layout. Create and Revise use the right-hand panel; Review, Publish and Assign use short centred dialogs. Site use (`/documents/templates/use`) shows what a site selects now, the pinned baseline and its intervals. The common-layout guidance below still applies where the decision is silent.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

**Accepted design, 15 October 2026:** captures 17 and 18 in [Template management design r01](../../../reference/ui/template-management/template-management-figma-r01/README.md): flush definition rows with version, template ID, support tag and a workspace-default line under a "Job pack definitions" view picker; the proposal record keeps the proposal facts, current revision, fields, review scope and base with a full-width Revise action. Site use at 320 px is capture 19; the tablet proposal record is capture 16.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Template management design r01 captures](../../../reference/ui/template-management/template-management-figma-r01/README.md) (icon-free PNGs; not application captures)
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

## Supported OUT-09 publication backend — 13 October 2026

[R3](../../../decisions/template-publication-backend.md) adds publisher readiness, exact immutable publication and historical recovery. The existing Record Workspace page type and shared controls remain the receiving basis. A future native page must show the exact reviewed revision, support fingerprint, explicit Service approval note, publisher duty, unsupported-family and stale-dependency holds. On desktop and phone, keep publication separate from policy use and provide actor-private original recovery after an uncertain result. One publication per revision; editing never changes an old publication. Incoming handover is R2 review evidence; outgoing is a supported definition for R4 controlled assignment. Other families remain drafts. No native comparison images exist and no visual review is updated. [Execution evidence](../../../testing/evidence/template-publication/README.md) records backend and renderer proof separately.

## Controlled use backend — 14 October 2026

[R4](../../../contracts/template-use-assignment.md) adds explicit OUT-09 company/site policy and immutable effective assignments. The existing Record Workspace page type remains. Future desktop/phone controls must display exact publication and support, pinned baseline, current policy version, start-inclusive/end-exclusive times, overlap/gap holds and explicit predecessor confirmation. Reuse shared record context, date/time inputs, validation, Button, dialog and table/card controls. Keep the original intent available after uncertain writes; distinguish scheduled assignment from current eligibility and retained historical issue.

Incoming handover is an exact R3 publication; outgoing is scoped versioned selection to native pack preparation and issue guards. Other families, native assignment controls and visual acceptance remain open. No new screenshots exist and no review fingerprint changes. [Execution evidence](../../../testing/evidence/template-use/README.md) records backend proof separately.

## Accepted Figma design — 15 October 2026

Desktop at 1440 × 900: the current department's rail with nothing selected (Documents is a More › Shared records page); a side menu of Definitions and Proposals, "Job pack use" › Site use, and "Other document pages" › Document library and Outputs, without counts; a toolbar with the required Family choice and, on Proposals, New proposal; and a 40 px grid. Definitions show Definition (version), Template ID, Runtime support, Integrity, Workspace default, Eligible as default, Dependencies, Renderer and Publication; Proposals show Proposal (title), State, Audience, Site, Company, Version, Current revision ID, Fingerprint and Proposal ID. Footers state the page coverage and identity order and never claim a total. The definition record shows a catalogue-facts strip ("Catalogue facts, not permission to render"), Definition, Policy and Publication sections, the exact definition text and the dependency manifest; Usage is read one kind at a time. The proposal record shows a proposal-facts strip, Proposal, Review scope and Base sections, the current revision and its ordered fields. Site use shows the selection resolved by server time, the pinned baseline and the start-inclusive, end-exclusive intervals. Page components: Template, Proposal and Use interval grid rows with headers and the phone list row (Figma `795:125`, `795:471`, `795:808`, `795:1069`). Before the build: names in the catalogue read (Q2), history order (Q3), the proposal's publication link (Q4), names from the existing reads, the visibility rule (Q6) and the backend gap G5 (managed-definition fingerprint drift).
