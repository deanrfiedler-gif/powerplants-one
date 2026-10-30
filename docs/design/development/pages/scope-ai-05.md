# Voice capture and transcript review — design reference

Stable entry: `scope:AI-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant/voice`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement explicit voice capture, editable transcript and names/numbers/units confirmation.

1. Start capture deliberately where supported
2. Read and correct the transcript
3. Confirm critical values before using them in a business record

## Desktop

Accepted design: the [voice capture design decision](../../../decisions/voice-capture-figma-design.md) of 31 October 2026 covers the microphone beside the AI-01 composer in the 400 px panel, the first-use explanation, recording, the transcript with the read-back, and the hand-off to the AI-02 review, with nine icon-free captures in [Voice capture design r01](../../../reference/ui/my-work/voice-capture-design-r01/README.md). D1–D17 and answers Q1–Q7 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 06 and 07 in [Voice capture design r01](../../../reference/ui/my-work/voice-capture-design-r01/README.md): ten frames at 390 and 320, full screen inside `/assistant`, with 16 px inputs, targets of 44 px or more, record and stop at 56 px, and full-width bottom actions. No real phone has been tested.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Voice capture design r01](../../../reference/ui/my-work/voice-capture-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Voice capture design r01](../../../reference/ui/my-work/voice-capture-design-r01/README.md) (nine icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/voice-capture-figma-design.md). Tablet 1024, focus-order frames and 200% zoom are not drawn. The speech-to-text service is To be decided, and building it is not decided.

The draft User Guide `guide.ai.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
