# User onboarding, learning and support — design reference

Stable entry: `scope:AD-10`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/help/onboarding`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement role-based onboarding, learning, support, feedback and release-note pages.

1. Choose the relevant role/task guidance
2. Practise the workflow using appropriate synthetic examples
3. Record unresolved questions through the actual support mechanism

## Desktop

Accepted design: the [onboarding and support design decision](../../../decisions/onboarding-support-figma-design.md) of 1 November 2026 covers Getting started, the task path, practice in progress and finished, Ask for help, My requests, What's new, the Owner view, feedback and the proposed entry points, with twenty-five icon-free captures in [design r01](../../../reference/ui/administration/onboarding-support-design-r01/README.md). The support owner's request queue, accepted the same day, is in [design r02](../../../reference/ui/administration/onboarding-support-design-r02/README.md). Where it differs from the text below, it governs. The page is not built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 12–17, 24 and 25 in [design r01](../../../reference/ui/administration/onboarding-support-design-r01/README.md): Getting started, the practice exercise and Ask for help at 390 and 320, uncertain send and offline. Inputs use 16 px text and main buttons 48 px.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The accepted mobile composition is in the design above; no application evidence exists yet. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Onboarding & support design r01 captures](../../../reference/ui/administration/onboarding-support-design-r01/README.md) (accepted Figma design, icon-free)
- [Onboarding & support design r02 capture](../../../reference/ui/administration/onboarding-support-design-r02/README.md) (accepted request queue, icon-free)

No HTML reference exists.

## Behaviour, handovers and verification

The draft User Guide `guide.ad.10` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
