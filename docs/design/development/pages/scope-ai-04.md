# Domain assistance and drafting flows — design reference

Stable entry: `scope:AI-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/assistant/drafts`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement reviewed domain assistance and drafting with source-grounded context.

1. Provide the relevant permitted context
2. Review the draft against source facts
3. Complete domain review before sending or saving an operative change

## Desktop

Accepted design: the [Drafting and domain help design decision](../../../decisions/drafting-domain-help-figma-design.md) of 31 October 2026 covers an email reply drafted from ticked messages, a project update drafted in Stakeholder updates, and equipment help in the AI-01 panel, with fifteen icon-free captures in [design r01](../../../reference/ui/my-work/drafting-domain-help-design-r01/README.md). Drafts open in their host editors; `/assistant/drafts` is not a page in the pilot (Q6). Tablet 1024 is the email draft with the rail and side menu collapsed.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 09–14 in [design r01](../../../reference/ui/my-work/drafting-domain-help-design-r01/README.md): the My jobs Ask Carl sheet, the equipment answer and escalate, at 390 and 320. Drafting on phone is not drawn (PJ-08 Q3).

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design captures: [Drafting and domain help design r01](../../../reference/ui/my-work/drafting-domain-help-design-r01/README.md). No HTML reference is linked.

## Behaviour, handovers and verification

Accepted Figma design: [Drafting and domain help design r01 captures](../../../reference/ui/my-work/drafting-domain-help-design-r01/README.md) (fifteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/drafting-domain-help-figma-design.md). The SV-08 new-case form, tablet equipment help and 200% zoom are not drawn; building the page is not decided.

The draft User Guide `guide.ai.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
