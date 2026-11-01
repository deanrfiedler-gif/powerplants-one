# Workshop settings — design reference

Stable entry: `scope:CX-02/settings`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `89283a16027fa90fa988d31a47a4f53dd3d1e0b1`. Proposed application destination: `/admin/settings/workshop`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Settings page within `scope:CX-02`, reached from the Settings hub (`scope:AD-02`) ([PPO-UI-SCOPE-ID-MAPPING-DEC](../../../decisions/ui-scope-id-mapping.md)).

1. Open the workshop settings
2. Review the current values
3. Propose or apply a permitted change

Workshop settings reviewed, with any change recorded.

The destination `/admin/settings/workshop` is proposed; no route or source exists yet.

## Desktop

Accepted design: the [Workshop settings design decision](../../../decisions/workshop-settings-figma-design.md) of 1 November 2026 covers the overview of eight areas, a work instruction template record, the test definitions register, a test record with history, release rules, serial numbering, and the Propose, Review and Publish dialogs (captures 01–09), with tablet 1024 (capture 10). No route exists, and nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 11–14 in [design r01](../../../reference/ui/settings/workshop-settings-design-r01/README.md): the overview and the review sheet at 390 and 320, with the compact header and 16 px input text.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

Retain application evidence here when a page exists; a design capture is not application evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Workshop settings design r01 captures](../../../reference/ui/settings/workshop-settings-design-r01/README.md) (icon-free), including six states in captures 15–20. No exact HTML reference exists. The named Figma version "Workshop settings — accepted" waits for Dean.

## Behaviour, handovers and verification

The draft User Guide `guide.cx.02.settings` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

The design is owner-accepted; visual review of an application page, functional testing and deployment are separate and pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
