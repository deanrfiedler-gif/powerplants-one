# Create job pack — design reference

Stable entry: `route:/service/packs/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `4c8fd6dba83794f6c64aee6859cadb913401fd64`. Application destination: `/service/packs/new?appointment_id={appointment_id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Issue the checked pack and track recipient acknowledgement

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Match the linked page-specific reference; retain its accepted geometry.

The Preparation view is the accepted r03 three-column composition: a contents rail listing the nine sections, the guided form, and a rail carrying Preparation status and Where information comes from. The module container owns the scroll, not the shell's `main`.

Each section is title → linked context → any selection or read-only summary → the entry → its help text. Section 01 shows its linked context in place; sections 02 to 09 keep theirs behind **View source details**, so the nine entries stay scannable.

Measured on the compiled application, 23 September 2026 (`4c8fd6d`), Preparation view with a saved revision:

| Viewport | Preparation view columns | Module padding | Section padding | Action bar |
|---|---|---|---|---|
| 1440 × 960 | contents 220 px at x 100 / main 802 px at x 338 / rail 258 px at x 1158 | 24px | 22px | `sticky`, bottom 12px |
| 1024 × 768 | contents 194 px at x 100 / main 690 px at x 310 / the guidance rail moves beneath the form | 24px | 20px | `sticky`, bottom 12px |
| 820 × 800 | contents 194 px at x 100 / main 486 px at x 310 / the guidance rail moves beneath the form | 24px | 20px | `sticky`, bottom 12px |

No horizontal page scroll was found at any of the six viewports. The **Exact text as it will be issued** disclosure, structured section content, the source-change notice and the readiness stage groups are later increments (I4, I6, I7); this entry records only what I3 delivers.

## Mobile

At 760 CSS px and below the page is a single column. The contents rail becomes a **Jump to a section** control, entries use 16 px text, and buttons and choices keep a 44 px target.

The preparation action bar is **fixed above the application's own navigation bar** rather than sticky inside the scroll container. A sticky box may not be displaced above its containing block, and on a phone the form begins near the foot of the scrollport, so the sticky bar was clamped to the form's own top and fell behind the navigation bar — measured at 26 px of overlap at 390 px and 145 px at 320 px before the change. Fixed positioning keeps the save state and both actions clear at every scroll position; the r03 box, padding, radius and shadow are unchanged. Below 650 px of viewport height the bar returns to r03's static position.

Between 761 and 780 px the shell is already in its phone layout while this page still uses its tablet layout, so 770 px is checked explicitly alongside 390 and 320 px.

Measured mobile composition, same run:

| Viewport | Preparation view columns | Module padding | Section padding | Action bar |
|---|---|---|---|---|
| 770 × 900 | contents 194 px at x 24 / main 512 px at x 234 / the guidance rail moves beneath the form | 24px | 20px | `sticky`, bottom 12px |
| 390 × 844 | contents 358 px at x 16 / main 358 px at x 16 / the guidance rail moves beneath the form | 16px | 17px 16px | `fixed`, bottom 72px |
| 320 × 800 | contents 288 px at x 16 / main 288 px at x 16 / the guidance rail moves beneath the form | 16px | 17px 16px | `fixed`, bottom 72px |

Mobile evidence for this entry is in `docs/testing/evidence/job-pack-i3/`. It is capture evidence, not an owner's visual acceptance.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [powerplants-one-job-pack-r03.html](../../../reference/ui/job-pack/powerplants-one-job-pack-r03.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.packs.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
