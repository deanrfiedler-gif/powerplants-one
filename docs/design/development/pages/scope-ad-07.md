# Audit history and controlled export — design reference

Stable entry: `scope:AD-07`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/admin/audit`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Expose existing audit foundations in a permission-filtered history and controlled-export workspace.

1. Find the relevant attributable history
2. Review source context and successor changes
3. Export only the permitted scope with its evidence basis

## Route gap and retained status

No `/admin/audit` route exists. On 23 September 2026 `src/app` had no audit route, page or component, and `src/app/api/v1` had no audit endpoint; `/admin` shows exceptions and `/admin/recovery/[id]` one recovery record. The workspace therefore shows `/admin/audit` as a proposed destination, matching the r05 register (`Planned route`, no linked routes).

The retained `refine` status is the imported r04 build-plan classification ("Refine existing", rank 9), carried unchanged into r05. It refers to the audit foundations this scope would expose, not to an existing page: the append-only `ppo.audit_events` table (introduced in migration 0001) and the record histories that owning modules already show, such as Facility history and Contact correction history. The issued Coverage Audit r04 classifies AD-07 as **N — New design candidate**: no dedicated screen was found. SH-04, SH-05, PL-04, DK-03 and DK-07 have the same route-less `refine` classification, so the status is kept rather than reclassified for this one scope. Any reclassification is an owner decision for the register as a whole.

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

No exact image or HTML reference is linked, and no application page exists to capture. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.ad.07` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
