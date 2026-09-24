# Priva Fertigation Configurator · detail — design reference

Stable entry: `route:/estimating/fertigation/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating/fertigation/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is present in application source at ccc2251b. Review its specific workflow and release evidence; source presence does not establish deployment or full-scope acceptance.

1. Confirm the record reference and customer/site context in this record workspace.
2. Select or create the permitted configurator scope
3. Review the exact valve and master-source revisions and unresolved bindings
4. Inspect calculated results and review evidence before preparing a controlled report

## Page-specific guidance

The native record workspace carries the guidance layer raised in [Priva fertigation workbench refinement](../../../decisions/fertigation-workbench-refinement.md) (F2–F7 and F9, implemented on direction of 23 September 2026; visual review is still pending):

- **Menu.** The nine views are grouped Define the farm · Test the operating basis · Prepare the scope. A view with open findings shows a severity badge (conflict, then incomplete, then review count). The badge is hidden from the accessible name and announced through `aria-describedby`, so each view keeps its exact name. A readiness summary above the menu states the open findings and their basis (saved revision, or calculated draft).
- **Overview.** In order: what this scope can produce now (the server's own preconditions; open findings never block an output), next actions ranked conflicts first with a default responsible role, scope at a glance, capacity headroom (each entered capacity loaded by its native result on one 0–200% scale), evidence coverage, production context and saved origin.
- **Water & hydraulics.** Required head, curve head at pump peak and margin, each with a calculation trace, and a pump chart drawn at the container's real width so chart text stays 11–12 px.
- **Scope review.** Findings grouped by the view that resolves them, with severity and responsible-role filters, native codes and the affected record.
- **Declarations.** After Next actions, the Overview lists the declarations the draft needs (D-01–D-12 of the [workbench refinement](../../../decisions/fertigation-workbench-refinement.md), feature F1): the findings each addresses, a basis chip (From recorded values, Your declaration, Needs new input) and the responsible role. Declare opens **Make a declaration**, the same drawer as Resolve a conflict in a neutral tone: what the draft records, what each finding waits on, and options that are previewed by the server and applied to the working draft only. The drawer stays open after an edit so several can be made in turn. Declare also appears on Next actions rows for missing inputs.
- **Drawers.** Calculation trace (rule, inputs, evidence, where used; the engine's value only), Resolve a conflict (options restate the engine's pass condition; an unambiguous edit is previewed by the server and applied to the working draft only) and Compare draft (result, finding, candidate and input changes against the saved revision).

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

At phone width the declarations list stacks its actions under each row like Next actions, and the cockpit panels stack, capacity rows become stacked cards with the bar under the label, output rows keep their state chip, and review rows stack their actions. Drawers fill the viewport through the shared dialog. The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No exact image or HTML reference is linked. Keep this gap visible.

A proposed refinement of the r02 standalone workbench (SHA-256 `b51bf2cab7cb1af54e33a0ec739921c4ca1a08da918165d615ead347d6463ab9`) exists as a private design canvas. It covers all nine views at 1440 px, the Overview at 390 px, and import, conflict-resolution, calculation-trace, revision-compare, report, site-visit and state artboards. Its departures and proposed features are raised in [Priva fertigation workbench refinement](../../../decisions/fertigation-workbench-refinement.md). It is not accepted and is not an exact reference for this route.

Implementation captures of the guidance layer were taken locally at 1440 × 1000 and 390 × 844 against a synthetic scope (compiled build, preinstalled Chromium) on 23 September 2026. They are working evidence, not a visual review, and are not committed; no reference image is linked yet.

## Behaviour, handovers and verification

The draft User Guide `guide.page.estimating.fertigation.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
