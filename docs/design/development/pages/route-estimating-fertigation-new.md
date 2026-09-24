# Priva Fertigation Configurator · create — design reference

Stable entry: `route:/estimating/fertigation/new`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/fertigation/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Inspect calculated results and review evidence before preparing a controlled report

## Page-specific guidance

Below the creation form, **Import a portable scope** previews a native JSON, standalone r02 JSON or native valve CSV file against the selected saved Discovery source. The preview shows the schema, the original file's SHA-256, the identity mapping (25 rows per page) and any warnings before anything is created. Confirm creates a separate native draft; the original file is never changed.

When a standalone r02 file holds fields that have no native field, the preview adds **Place held legacy fields** ([ADR-0044](../../../decisions/ADR-0044-fertigation-held-import-placement.md), feature F1 of the [workbench refinement](../../../decisions/fertigation-workbench-refinement.md)):

- One row per field family: the family and its field count, up to three values from the file (shortened to 60 characters) and a placement control. Only the project identity row (reference, customer, site) offers **Covered by the Discovery binding**; every other row offers **Keep as source note** only.
- A review checkbox names the number of held fields. Changing any placement clears it. Confirm stays disabled until every held field is placed and the checkbox is set.
- Kept values go to the notes of the native record they describe, or to a generated evidence reference named "Legacy r02 source values (unverified)"; none becomes a native technical value. The placements are stored with the import.
- A held native export (attachment bytes not carried) is not placeable; its reasons are listed and Confirm stays disabled.

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

At phone width the placement rows stack as cards: family and count, then the file values, then a full-width placement control; the page does not scroll sideways. The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Design reference (direction given, not accepted): board 10 · Import an r02 project in the [retained design board captures r01](../../../reference/ui/estimating/fertigation-design-board-r01/README.md), [captured at 1440 × 2671](../../../reference/ui/estimating/fertigation-design-board-r01/PPO-Priva-Fertigation-Design-Board-10-Import-an-r02-Project-r01.png). Native import rules differ from it in two places, both listed in the capture README. ADR-0044 allows two placements, not four, and declarations are made on the created draft, not before Confirm. No accepted visual baseline exists for this route. Implementation captures of the placement step were taken locally at 1440 × 1000 and 390 × 844 by FN-T112 (compiled build, preinstalled Chromium) on 23 September 2026. They are working evidence, not a visual review, and are not committed.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.fertigation.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
