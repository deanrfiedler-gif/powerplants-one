# Estimating intake and workload — design reference

Stable entry: `scope:ES-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The native front door now reads permitted opportunity briefs alongside discovery ownership/readiness and saved-estimate links. Allocation, intake acceptance, returned-brief commands and priority policy remain Not configured. This is the first native programme increment, not completion of every ES-01 business-state transition.

1. Find the intake or existing estimate
2. Check scope completeness and required clarification
3. Review the next estimating step and open the exact discovery or saved estimate

## Desktop

Native cards stack by available container width when enlarged, preserving whole owner/status values. The scoped header avoids the legacy phone grid and reflows its centre controls when constrained. Actual native captures are retained in [workload evidence](../../../testing/evidence/estimating-native-workload/README.md); exact ES-01 comparison imagery remains missing and owner/device acceptance pending.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No exact image or HTML reference is linked. Keep this gap visible.

## Native workload contract — 24 September 2026

Reuse the current shell, PageHeader, Button/ButtonLink, ErrorNotice and Status. The r20 page type is a register/worklist. Incoming handover: canonical Opportunity UUID/company/version and need summary, plus the current estimating workspace and selected option. A post-Won Sales handover-due reference is shown as an obligation only. No accepted intake is inferred. Outgoing links retain workspace, opportunity, option and saved-estimate identity; ordinary navigation writes nothing.

Desktop: search and Apply filters remain visible; the native Readiness, owner and sort disclosure retains additional selections when collapsed. This also leaves room for the first workload card on a phone. Cards have brief, ownership/context and next-step columns. At 1000 px, next step spans the card below two source columns. At 600 px and below, card regions and expanded filters stack. Keep labels and action links visible at 390 and 320 CSS px and 200% zoom. Allow long references, briefs and owner names to wrap. Reuse navy/green semantic tokens and Roboto/Verdana; no new masthead or rail.

URL filters survive reload and browser history. Search applies literally to canonical customer, brief, title and reference before the bounded candidate window. Readiness filters apply within the 100-candidate window, explicitly labelled; counts are displayed permitted rows, not global workload. My estimating work refers to the workspace owner, not Sales ownership. The Saved estimates view preserves the existing E1 register at `/estimating?tab=estimates`.

Loading, no matches, empty permitted workload, failure, no-permission and revoked-access states remain distinct. Failed refresh clears rows rather than displaying old data as current. This page has no business command or unsaved proposal; stale writes and uncertain operations are handled in the existing destination workflow. Required response date stays Unknown; Sales action due date is separate. No automatic price, approval or issue follows from complete scope.

Native evidence and current verification: [programme handover](../../../delivery/estimating-programme-handover.md). Missing exact design image remains explicit. No baseline or owner visual acceptance is registered.

## Behaviour, handovers and verification

The draft User Guide `guide.es.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
