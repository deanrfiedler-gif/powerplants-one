# Document register and linked library — design reference

Stable entry: `scope:DK-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/documents`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement a document register and linked library with contextual filters, applicability and stable source identities.

1. Find the document by business context
2. Check status and applicable revision
3. Open the authoritative source with its normal permissions

## Desktop

**Accepted design, 15 October 2026:** the [Document library design decision](../../../decisions/document-library-figma-design.md), captures 01, 02, 07 and 08 in [Document library design r01](../../../reference/ui/document-library/document-library-figma-r01/README.md). The register at `/documents` follows the accepted register pattern: quick views and filters that match the backend filters, no counts, totals or column sorting, a small snapshot panel, and registration in a right-side panel. The common-layout guidance below still applies where the decision is silent.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

**Accepted design, 15 October 2026:** capture 15 in [Document library design r01](../../../reference/ui/document-library/document-library-figma-r01/README.md): flush rows with the title, number and revision, the review tag and a current-use line, the Current documents view picker and "10 shown", and the current department's tab bar with nothing selected. The 320 px state is capture 17 (DK-02).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Document library design r01 captures](../../../reference/ui/document-library/document-library-figma-r01/README.md) (icon-free PNGs; not application captures)
- [PPO-Document-Register-and-Linked-Library-r01.html](../../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.dk.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Synthetic backend handover — 13 October 2026

The [backend contract](../../../decisions/document-library-backend.md) provides stable library identity, exact revisions, declared references, findings, independent review and original-content recovery through `/api/v1/document-library`. Existing exact Job Pack and Service Report services supply native bytes and source authority. Native receiving workspaces retain control of their own issued manifests and acceptance. DK-03 distribution and DK-06 template publication remain separate.

The native page shows availability, currentness and review separately; never display a later revision as an old link's content. Preserve the original save operation for recovery. A finding response awaits independent acceptance; a successor starts unreviewed. Current-use eligibility is bounded library review evidence, not work authorisation. Reuse the shell, global information icon, shared Button/control patterns and exact viewer download protection when page work is authorised.

Backend execution is recorded in [the evidence ledger](../../../testing/evidence/document-library/README.md). The standalone r01 remains the visual reference. The backend-only evidence remains historical. Native application captures and current execution are recorded in [the workspace ledger](../../../testing/evidence/document-library/workspace/README.md); desktop/mobile visual acceptance and deployment remain pending. No review fingerprint is granted by this edit.

## Accepted Figma design — 15 October 2026

Desktop at 1440 × 900: the current department's rail with nothing selected (Documents is a More › Shared records page); a secondary menu of views (Current documents, My documents, Withdrawn, All documents), Review (Unreviewed, Review outdated, Returned, Reviewed) and Needs attention (Content unavailable) without counts; a toolbar with Search title, number, type, Customer, Site and Owner filters and "+ Register document"; and a 40 px grid of Document, Rev, Current use, Review, Content and Source, with Type, Unresolved, Number, Source kind, Customer, Site, Owner and Updated scrolling. The footer says "End of list" or "Load 25 more" and never claims a total. Registration happens in a right-side panel: customer and site (fixed afterwards), title, type, owner, audience, applicability, source (synthetic text, issued job pack or issued service report, with an exact issue picker) and reason. Page components: Document grid row and header and the phone list row (Figma `746:42`, `746:85`, `746:99`). Before the build: register sort (Q2), a controlled type list (Q5), names from the existing customer, site and people reads, and an "issues I can register" read.

## Native implementation — 31 October 2026

PR #706 adds the shared-shell register and exact-revision record, responsive states, native commands and permitted choice/revision reads. Number and Updated sorts now have signed continuations; Load 25 more rereads the displayed window without claiming a total. Links open their owning revision before retirement. Draft guides and consumer bindings accompany the code. See the [workspace evidence](../../../testing/evidence/document-library/workspace/README.md) for checked states, limits and screenshots. Source delivery is separate from pending visual review and owner acceptance.
