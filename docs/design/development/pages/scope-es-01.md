# Estimating intake and workload — design reference

Stable entry: `scope:ES-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The native front door now reads permitted opportunity briefs alongside discovery ownership/readiness and saved-estimate links. Allocation, intake acceptance, returned-brief commands and priority policy remain Not configured. This is the first native programme increment, not completion of every ES-01 business-state transition.

1. Find the intake or existing estimate
2. Check scope completeness and required clarification
3. Review the next estimating step and open the exact discovery or saved estimate

**Design board r01, 24 September 2026.** A design board applies the Powerplants One design system and the running shell to this register and proposes a register with a persistent detail panel. It records one user decision: ES-01 design uses the Powerplants One design system, not the separate PHYTO system (24 September 2026). Its proposals P1–P9 and open questions O1–O2 are not accepted, and it records five findings against the running build (B1–B5). See the [design board record](../../../decisions/es01-design-board.md). The native workload contract below is unchanged.

## Desktop

Native cards stack by available container width when enlarged, preserving whole owner/status values. The scoped header avoids the legacy phone grid and reflows its centre controls when constrained. Actual native captures are retained in [workload evidence](../../../testing/evidence/estimating-native-workload/README.md); exact ES-01 comparison imagery remains missing and owner/device acceptance pending.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

The design board proposes a register with a persistent 448 px detail panel at 1360 CSS px and wider (P1) and a right-hand drawer below that (P7), drawn at 1440 × 1400 (D1) and 1024 × 768 (R1). The breakpoint is open question O1. These are proposals, not approved adaptations.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

The design board draws phone compositions at 390 px (R2 full scroll, R3 filters expanded) and 320 × 700 (R4). They are design compositions, not device evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No accepted ES-01 image or HTML reference exists. Keep this gap visible. The proposed design board is retained for review:

- [Design board r01](../../../reference/ui/estimating/workload-design-board-r01/README.md) — 14 artboards, proposed and not accepted; key boards: [D1 · Workload desktop](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D1-Workload-Desktop-1440-r01.png) (1440 × 1400), [D2 · Saved estimates](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D2-Saved-Estimates-Desktop-1440-r01.png) (1440 × 900), [R1 · 1024 drawer](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R1-Tablet-1024-Drawer-r01.png) (1024 × 768), [R2 · Phone 390](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R2-Phone-390-Workload-r01.png) (390 × 2112) and [R4 · Phone 320](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R4-Phone-320-Workload-r01.png) (320 × 700)
- [Native workload evidence](../../../testing/evidence/estimating-native-workload/README.md) — captures of the running build, parent `f929312`

## Native workload contract — 24 September 2026

Reuse the current shell, PageHeader, Button/ButtonLink, ErrorNotice and Status. The r20 page type is a register/worklist. Incoming handover: canonical Opportunity UUID/company/version and need summary, plus the current estimating workspace and selected option. A post-Won Sales handover-due reference is shown as an obligation only. No accepted intake is inferred. Outgoing links retain workspace, opportunity, option and saved-estimate identity; ordinary navigation writes nothing.

Desktop: search and Apply filters remain visible; the native Readiness, owner and sort disclosure retains additional selections when collapsed. This also leaves room for the first workload card on a phone. Cards have brief, ownership/context and next-step columns. At 1000 px, next step spans the card below two source columns. At 600 px and below, card regions and expanded filters stack. Keep labels and action links visible at 390 and 320 CSS px and 200% zoom. Allow long references, briefs and owner names to wrap. Reuse navy/green semantic tokens and Roboto/Verdana; no new masthead or rail.

URL filters survive reload and browser history. Search applies literally to canonical customer, brief, title and reference before the bounded candidate window. Readiness filters apply within the 100-candidate window, explicitly labelled; counts are displayed permitted rows, not global workload. My estimating work refers to the workspace owner, not Sales ownership. The Saved estimates view preserves the existing E1 register at `/estimating?tab=estimates`.

Loading, no matches, empty permitted workload, failure, no-permission and revoked-access states remain distinct. Failed refresh clears rows rather than displaying old data as current. This page has no business command or unsaved proposal; stale writes and uncertain operations are handled in the existing destination workflow. Required response date stays Unknown; Sales action due date is separate. No automatic price, approval or issue follows from complete scope.

Native evidence and current verification: [programme handover](../../../delivery/estimating-programme-handover.md). Missing exact design image remains explicit. No baseline or owner visual acceptance is registered.

## Behaviour, handovers and verification

The draft User Guide `guide.es.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
