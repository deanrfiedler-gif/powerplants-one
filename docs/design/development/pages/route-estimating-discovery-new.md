# Create discovery workspace — design reference

Stable entry: `route:/estimating/discovery/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/discovery/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Check the saved cost basis before preparing a quotation

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

- [PPO-Estimation-Wizard-Container-r03.html](../../../reference/ui/estimating/PPO-Estimation-Wizard-Container-r03.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.discovery.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Accepted Sales brief link (LC-13)

Keep the existing scope ID and r20 record workspace/intake worklist page type. Incoming: exact current accepted Sales event and source facts. Outgoing: explicit immutable link to the existing native estimating workspace, selected option and scope revision. Reuse PageHeader, Button, Field, error/status controls, native details disclosure and the existing command journal. The existing CRM panel and estimating layout are retained legacy host exceptions; no shared style system changes.

From accepted Intake, open an existing workspace or create native Discovery. Show Sales problem, scope, exclusions, assumptions, unknowns and requested-date basis as reported context; do not pre-confirm Discovery answers. A successful creation returns to the handover for a separate link review. Compare both saved versions, record a reason and save the link. Keep that comparison fixed through background refresh. Separate current acceptance, source drift and historical links. A denied target displays no retained target identities. An interrupted link recovers the exact original from the actor-scoped journal, including after reload.

Desktop: place the link comparison and separate native-creation result beside the accepted brief; use labelled saved versions and wrap long reasons. Phone: stack the same controls at 390 and 320 CSS px, keep recovery controls reachable and contain scope text without horizontal overflow. Keyboard navigation must reach the native workspace and original-result controls. The new-state mockup images are missing; retain the exact existing HTML/image references above. This is a proposed additive adaptation, not adopted paired visual or owner acceptance.
