# Readiness and change-impact review — design reference

Stable entry: `scope:PJ-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/readiness`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Implement consolidated readiness and change-impact review across engineering, materials, site, crew and customer prerequisites.

1. Review each source prerequisite and its timestamp
2. Assign blockers and required evidence
3. Assess a change before requesting delivery movement

## Desktop

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- Retained predecessor: [r01 HTML](../../../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r01.html), SHA-256 `a830eebb34ed44292a0906b878c9965746e7e1e8f0c870c77820cf5cd79e841b` over Git bytes.
- [r02-named HTML](../../../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02.html) currently has the same r01 bytes and embedded revision. It is not the revised r02 described by the [r02 change record](../../../reference/ui/projects/PPO-Project-Delivery-Readiness-and-Change-Control-r02-change-record.md).
- Expected r02: 247,414 bytes, SHA-256 `fce055ba5c2f750751ad5eceb33a930e0edd5881b177ec218829abdd95c66741`. Exact deliverable unavailable at the A0 audit. The register selects neither issue as the native implementation reference until this discrepancy is resolved. No exact screenshots are available for that verified r02.

The [programme audit](../../../delivery/projects-completion-programme.md) records the reachable Git history and source search. Preserve all issued bytes. The change record's responsive impact cards, clear Gantt legend, date formatting and usable tabs remain required refinements; recreating them is not proof of recovering the original issue. The native route remains unbuilt and no visual approval is inferred.

## Behaviour, handovers and verification

The draft User Guide `guide.pj.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## R10 workflow review — 26 October 2026

The [R10 workflow reconciliation](../../../decisions/r10-workflow-reconciliation.md#pj-07--source-backed-review-with-separate-delivery-decisions) recommends one worklist at the existing reserved `/projects/readiness` destination and a deliberate Readiness extension of the accepted Project record. Keep navigation unavailable until its route and permission-aware reads exist. The coordinator owns the review; source owners retain prerequisites, answers and commands. Specify whole-scope applicability, source/version/time/completeness and restricted/missing/stale states before implementing an aggregate; filters or completed Activities do not establish readiness.

Movement review creates attributable requests, not automatic date cascades, Service booking changes or financial/technical approvals. Define the owning request aggregate before registering CHG. Retain native Supply versus field-gate meanings and separate receiving/recovery for each source. Proceed toward a new reference from retained r01 and current accepted decisions with explicit provenance; do not claim recovery or acceptance of r02.

Figma proposal page `2720:87`, notes `2736:2384`, remains unaccepted. The 320px impact frame `2730:3046` hides three impacts behind a plain summary while showing the request action, and says +9 days for 19 November to 2 December without declaring working-day units (13 calendar days). Expose the full review and explicit date basis; review phone blocker assignment, change history/closing and partial request outcomes. The [direct Figma observations](../../../decisions/r10-workflow-reconciliation.md#direct-figma-observations) list exact nodes and bounded evidence.

## Native contract and correction brief — 26 October 2026

Use the [proposed PJ-07 contract](../../../contracts/project-delivery-readiness.md) for the complete delivery-step membership, source applicability/completeness, aggregate states, named receiver authority and recovery model. Its [correction brief](../../project-delivery-readiness-correction-brief.md) names the existing frames, missing states and Present-mode journeys. The Project owns a subordinate coordination request; source systems keep their native decisions and effects, including Scheduling's booking-changing Accept. Scope selection is explicit; filters never alter the assessed scope. Keep the route unavailable and review fingerprints unchanged until implementation and actual baseline review.

The contract's review corrections distinguish Evidence needed for Undetermined applicability from Not assessed native criteria. Criterion-linked Activities require source visibility on every Activity surface before follow-up is enabled. Native outcomes require source-owned operation bindings; ordinary unbound saves are Reported only. Reassignment/correction retains the outstanding native request and requires adoption, verified cancellation or reconciliation before replacement. Draw these states under the correction brief; the future acceptance examples are not executed proof or visual acceptance.
