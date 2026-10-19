# Stakeholder update preparation and publication — design reference

Stable entry: `scope:PJ-08`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/updates`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement stakeholder-update preparation, review, exact publication, distribution and withdrawal.

1. Prepare the update from current source records
2. Review sensitive information and intended recipients
3. Publish the exact approved revision and retain distribution evidence

## Desktop

Accepted design: the [Stakeholder updates design decision](../../../decisions/stakeholder-updates-figma-design.md) of 19 October 2026 covers `/projects/updates` and the update record: the All updates register, the draft written from sources and its Sources view, Prepare to send, the approver's review beside the sources with Approve and send or Return for changes, the sent update with its delivery steps, Correct a sent update, a held update, Update settings and the project record's Updates view, with nineteen icon-free captures in [design r01](../../../reference/ui/projects/stakeholder-updates-design-r01/README.md). Departures D1–D8 and answers Q1–Q6 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 15–18 in [design r01](../../../reference/ui/projects/stakeholder-updates-design-r01/README.md): the All updates list at 390 and 320 under the compact phone header, the review with a sticky Approve and send, and the Approve and send sheet. Drafts are written on desktop and tablet (Q3).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Icon-free Figma captures: [Stakeholder updates design r01](../../../reference/ui/projects/stakeholder-updates-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Stakeholder updates design r01 captures](../../../reference/ui/projects/stakeholder-updates-design-r01/README.md) (nineteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/stakeholder-updates-figma-design.md). The cadence trigger's My Work card, Update 4 after a correction, the History view, a tablet record, the phone sent view, attachments, a PDF output and 200% zoom are not drawn. The named Figma version "Stakeholder updates — accepted" is saved.

The draft User Guide `guide.pj.08` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
