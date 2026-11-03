# Contract obligations, notices and variations — design reference

Stable entry: `scope:PJ-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/projects/commercial`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Implementation and functional proof — 31 October 2026

See the [native route contract](route-projects-commercial.md) for current controls, adaptations and exclusions, and the [evidence chapter](../../../testing/evidence/project-commercial/README.md) for executed checks. No review fingerprint or application acceptance is granted.

## Purpose and task

Implement contract obligations, notices, variations, disputed changes, dates and evidence.

1. Read the applicable obligation and exact scope
2. Record proposed/disputed changes with dated evidence
3. Track authorised notices and decisions separately

## Desktop

Accepted design: the [Contract obligations, notices and variations design decision](../../../decisions/project-commercial-figma-design.md) of 16 October 2026, with captures 01–14 (desktop 1440) and 15–16 (tablet 1024) in [design r01](../../../reference/ui/projects/project-commercial-design-r01/README.md).

- **Register:** `/projects/commercial` for one project at a time, opened from the Projects menu item "Variations & obligations". The side menu holds Variations, Obligations, Notices and Commercial basis, and Value breakdown for Finance readers. Grids are grouped by state with fixed Select and Settings columns; the control values strip sits above Variations and Value breakdown.
- **Records:** variation, obligation and basis records on the shared record layout, with a facts bar, a details column and Overview, Activities and History tabs. Decisions use a centred dialog bound to the exact version; creating a variation, recording a notice and proposing the basis use side panels.
- **Project record:** a Commercial view between Baselines and Acceptance, with the control values, Needs attention and the basis.
- Native register and record controls are implemented in draft PR #803; validation and application visual review remain separate. The Project record Commercial view is excluded while #698 is unmerged.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design: captures 17–20 in [design r01](../../../reference/ui/projects/project-commercial-design-r01/README.md). List rows under a compact values card, with the project picker and view picker; a record with Details, Overview, Activities and History tabs and a bottom action bar; decisions in a bottom sheet with 48 px buttons. Variations sits under More in the phone tab bar.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

Accepted Figma design: [Contract obligations, notices and variations design r01 captures](../../../reference/ui/projects/project-commercial-design-r01/README.md) (twenty-one icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/project-commercial-figma-design.md). Images of the notice record, the basis Sources tab, the Activities tabs, the Withdraw, Revise, Reopen and waiver dialogs, and tablet and phone versions of Obligations, Notices, Basis and Value breakdown are still missing.

## Behaviour, handovers and verification

The draft User Guide `guide.pj.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Backend implementation checkpoint — 14 October 2026

The [PJ-05 backend contract](../../../contracts/project-commercial-controls.md) and [synthetic Finance definitions](../../../contracts/project-commercial-finance-definitions.md) now govern the isolated implementation. Exact source/decision/recovery endpoints have passed local database, compiled API and real restart verification; this does not implement or visually accept this planned page. Native controls must expose original, requested, priced, approved and disputed facts separately, keep unknown and changed-source holds visible, and recover the same operation after an uncertain save. No new visual reference is available.
