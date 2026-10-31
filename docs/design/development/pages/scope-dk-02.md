# Document viewer, revision and review workspace — design reference

Stable entry: `scope:DK-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/documents/library/[id]`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Extend the current exact issued-pack viewer to a general document/revision/review workspace.

1. Open the issued document from its owning record
2. Check scope, revision and issue purpose
3. Record review or response against that exact content where supported

## Desktop

**Accepted design, 15 October 2026:** the [Document library design decision](../../../decisions/document-library-figma-design.md), captures 03 to 06 and 08 to 14 in [Document library design r01](../../../reference/ui/document-library/document-library-figma-r01/README.md). The record at `/documents/library/{id}` (Q1) uses the shared record layout: header, a current-use strip, a details column and view tabs Overview, Revisions, Findings, Links and History. The existing `/documents/{id}` issued job-pack page stays as it is.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

**Accepted design, 15 October 2026:** captures 16 and 17 in [Document library design r01](../../../reference/ui/document-library/document-library-figma-r01/README.md): a record page with the review tag and current-use line under the header, tabs Overview, Revisions, Findings, Links and History, the current-use checks, review decision, document, context and source sections, and Download and Add revision at the bottom; at 320 px, the exact-content-unavailable state with Recover original text.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Accepted Figma design: [Document library design r01 captures](../../../reference/ui/document-library/document-library-figma-r01/README.md) (icon-free PNGs; not application captures)
- [PPO-Document-Register-and-Linked-Library-r01.html](../../../reference/ui/document-library/PPO-Document-Register-and-Linked-Library-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.dk.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Synthetic backend handover — 13 October 2026

The [backend contract](../../../decisions/document-library-backend.md) provides stable library identity, exact revisions, declared references, findings, independent review and original-content recovery through `/api/v1/document-library`. Existing exact Job Pack and Service Report services supply native bytes and source authority. Native receiving workspaces retain control of their own issued manifests and acceptance. DK-03 distribution and DK-06 template publication remain separate.

The native page shows availability, currentness and review separately; never display a later revision as an old link's content. Preserve the original save operation for recovery. A finding response awaits independent acceptance; a successor starts unreviewed. Current-use eligibility is bounded library review evidence, not work authorisation. Reuse the shell, global information icon, shared Button/control patterns and exact viewer download protection when page work is authorised.

Backend execution is recorded in [the evidence ledger](../../../testing/evidence/document-library/README.md). The standalone r01 remains the visual reference. The backend-only evidence remains historical. Native application captures and current execution are recorded in [the workspace ledger](../../../testing/evidence/document-library/workspace/README.md); desktop/mobile visual acceptance and deployment remain pending. No review fingerprint is granted by this edit.

## Accepted Figma design — 15 October 2026

The header shows the title, review state, record position, the exact revision download and the main action; "…" holds Open a finding, Add a link and Withdraw document. The current-use strip has five checks (current revision, source current, exact content available, reviewed, no unresolved findings) and says "Library evidence, not permission to work". Details: Document (number, type, revision, state, owner, audience, applicability), Context (company, customer, site, fixed at registration) and Source for the viewed revision (kind, author, size, SHA-256, registered, reason). Overview shows the review decision bound to the content hash and, for synthetic text, a read-only extract of the exact bytes; PDF sources download, with Open issued job pack for a job-pack source. Revisions lists each revision with its state and review and opens a historical revision read-only. Findings uses the Document finding card (Figma `752:3094`): Open, Awaiting review and Closed; the owner responds and someone other than the responder, holding review duty, accepts. Links lists declared links with Needs assessment for an earlier revision and Retired history; links are never retargeted. History lists immutable events 25 at a time. Adding a revision happens in a right-side panel that copies the current details; reviewing happens in a centred dialog with Reviewed or Returned, purpose and rationale.

## Native implementation — 31 October 2026

PR #706 adds the shared-shell register and exact-revision record, responsive states, native commands and permitted choice/revision reads. Number and Updated sorts now have signed continuations; Load 25 more rereads the displayed window without claiming a total. Links open their owning revision before retirement. Draft guides and consumer bindings accompany the code. See the [workspace evidence](../../../testing/evidence/document-library/workspace/README.md) for checked states, limits and screenshots. Source delivery is separate from pending visual review and owner acceptance.
