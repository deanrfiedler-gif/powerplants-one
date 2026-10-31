# Assistant workspace and docked/mobile conversation — design reference

Stable entry: `scope:AI-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement the contextual assistant workspace/docked/mobile conversation; shell entry points or scripted previews are not a delivered assistant.

1. State the task and relevant context
2. Review the answer's evidence and limitations
3. Use ordinary business controls for any approved follow-up

## Desktop

Accepted design: the [assistant design decision](../../../decisions/assistant-figma-design.md) of 24 October 2026 covers the Ask Carl action beside Conversations in the top bar, the docked 400 px side panel at 1280 px and wider (drawn at 1440, with the rail collapsed while it is open), the full-width surface below 1280 px (drawn at 1024), customer and opportunity search, the Customer CRM summary with source chips and evidence, the hand-off to the draft review (AI-02), scope changes, Keep as a thread, and the provider and budget states, with fifteen icon-free captures in [design r01](../../../reference/ui/my-work/assistant-design-r01/README.md). Decisions D1–D18 and answers Q1–Q7 are recorded there. Nothing is built.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 13 and 14 in [design r01](../../../reference/ui/my-work/assistant-design-r01/README.md): `/assistant` full screen at 390 and 320, opened from the record's More menu, with the start, the Customer CRM summary, the composer above the keyboard (16 px text, 44 px targets), budget reached, and Back returning to the same record.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Assistant design r01](../../../reference/ui/my-work/assistant-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Assistant design r01 captures](../../../reference/ui/my-work/assistant-design-r01/README.md) (fifteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/assistant-figma-design.md). The AI-02 review fields, the AI-03 evidence page, the About Carl card, the microphone (AI2), exactly 1280 px, a search with more than 20 results, offline and hosted use are not drawn. Building it is not decided.

The draft User Guide `guide.ai.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
