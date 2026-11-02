# Customer quotation page — design reference

Stable entry: `scope:ES-05/customer-page`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `89283a16027fa90fa988d31a47a4f53dd3d1e0b1`. Proposed application destination: `/quote/[token]`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Customer-facing page within `scope:ES-05`: the quotation page customers open outside the application shell ([PPO-UI-SCOPE-ID-MAPPING-DEC](../../../decisions/ui-scope-id-mapping.md)).

1. Prepare the release from the quotation
2. Check what the customer will see
3. Review the customer views and response

A customer quotation page reviewed before any live use. This identity authorises no live customer communication.

The destination `/quote/[token]` is proposed; no route or source exists yet.

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

The decision record names the Figma page. No exact image or HTML reference is linked here. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.es.05.customer-page` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
