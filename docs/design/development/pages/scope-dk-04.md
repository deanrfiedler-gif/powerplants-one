# Knowledge search and article detail — design reference

Stable entry: `scope:DK-04`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/knowledge`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement knowledge search and article detail with applicability and controlled revision status.

1. Search for the relevant task or symptom
2. Check article applicability and review status
3. Follow the verified related procedure where required

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

Accepted design: the [Knowledge design decision](../../../decisions/knowledge-figma-design.md) of 30 October 2026 covers search with a five-value context, results with three separate statuses, an article at an exact revision, a superseded article with its successor and a suspected fix, at desktop 1440 and tablet 1024, with captures 01–06 in [design r01](../../../reference/ui/knowledge/knowledge-design-r01/README.md). Departures D1–D12 are in the decision. At 1024 the details column folds into the context strip. Nothing is built.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

Accepted design: captures 07–13 in [design r01](../../../reference/ui/knowledge/knowledge-design-r01/README.md): search from a job, article, saved offline copies and Set context at 390, and search, article and saved at 320. Compact header, 16 px inputs and one full-width 48 px main action (D12).

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [Knowledge design r01 captures](../../../reference/ui/knowledge/knowledge-design-r01/README.md) (accepted Figma design, icon-free)
- [PPO-Knowledge-Search-and-Article-Detail-r01.html](../../../reference/ui/knowledge/PPO-Knowledge-Search-and-Article-Detail-r01.html) (earlier direction)

Accepted Figma design: [Knowledge design r01 captures](../../../reference/ui/knowledge/knowledge-design-r01/README.md) (twenty-one icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/knowledge-figma-design.md). States are captures 14–20; navigation placement is capture 21. The Saved list on desktop, Browse by type, the Suggest a change form (DK-05), denied access and 200% zoom are not drawn. Authoring, review, publication and withdrawal stay with DK-05.

## Behaviour, handovers and verification

The draft User Guide `guide.dk.04` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
