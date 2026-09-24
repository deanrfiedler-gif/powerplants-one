# Estimating intake and workload — design reference

Stable entry: `scope:ES-01`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/estimating`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The native front door now reads permitted opportunity briefs alongside discovery ownership/readiness and saved-estimate links. Allocation, intake acceptance, returned-brief commands and priority policy remain Not configured. This is the first native programme increment, not completion of every ES-01 business-state transition.

1. Find the intake or existing estimate
2. Check scope completeness and required clarification
3. Review the next estimating step and open the exact discovery or saved estimate

**Design board r01, 24 September 2026.** A design board applies the Powerplants One design system and the running shell to this register and proposes a register with a persistent detail panel. It records one user decision: ES-01 design uses the Powerplants One design system, not the separate PHYTO system (24 September 2026). It also records five findings against the running build (B1–B5). See the [design board record](../../../decisions/es01-design-board.md).

**Design decisions, 25 September 2026.** Dean delegated the decisions on P1–P9 and O1–O2. P1–P8 were adopted, P9 adopted in part, O1 set at 1360 CSS px and O2 at the success tone, with the adjustments listed in the record. They are implemented in the native page and B1–B5 are fixed; see [Design adoption](#design-adoption--25-september-2026) below. The native workload contract below still applies except where that section amends it. Owner visual and device review remain pending.

## Desktop

Native cards stack by available container width when enlarged, preserving whole owner/status values. The scoped header avoids the legacy phone grid and reflows its centre controls when constrained. Actual native captures are retained in [workload evidence](../../../testing/evidence/estimating-native-workload/README.md); exact ES-01 comparison imagery remains missing and owner/device acceptance pending.

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

Decided and implemented (P1, P7, O1): register rows with a persistent 448 px sticky detail panel while the register is at least 1244 CSS px wide (a 1360 CSS px viewport in the standard shell), and a 448 px right-hand drawer below that. Measured on the running build: 1244 px register at 1360 (panel) and 1243 px at 1359 (drawer). These are decided adaptations awaiting owner visual review, not an accepted baseline.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

The design board draws phone compositions at 390 px (R2 full scroll, R3 filters expanded) and 320 × 700 (R4). They are design compositions, not device evidence. The implementation follows them: at 760 CSS px of register width and below, cards carry the full detail. The same applies at 200% CSS zoom of a 1440 px window.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

No accepted ES-01 image or HTML reference exists. Keep this gap visible. The proposed design board is retained for review:

- [Design board r01](../../../reference/ui/estimating/workload-design-board-r01/README.md) — 14 artboards, proposed and not accepted; key boards: [D1 · Workload desktop](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D1-Workload-Desktop-1440-r01.png) (1440 × 1400), [D2 · Saved estimates](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-D2-Saved-Estimates-Desktop-1440-r01.png) (1440 × 900), [R1 · 1024 drawer](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R1-Tablet-1024-Drawer-r01.png) (1024 × 768), [R2 · Phone 390](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R2-Phone-390-Workload-r01.png) (390 × 2112) and [R4 · Phone 320](../../../reference/ui/estimating/workload-design-board-r01/PPO-ES-01-Design-Board-R4-Phone-320-Workload-r01.png) (320 × 700)
- [Native workload evidence](../../../testing/evidence/estimating-native-workload/README.md) — captures of the first native increment, parent `f929312`
- [Design adoption evidence](../../../testing/evidence/estimating-workload-design-adoption/README.md) — captures of the running build after the 25 September decisions; not visual acceptance

## Native workload contract — 24 September 2026

Reuse the current shell, PageHeader, Button/ButtonLink, ErrorNotice and Status. The r20 page type is a register/worklist. Incoming handover: canonical Opportunity UUID/company/version and need summary, plus the current estimating workspace and selected option. A post-Won Sales handover-due reference is shown as an obligation only. No accepted intake is inferred. Outgoing links retain workspace, opportunity, option and saved-estimate identity; ordinary navigation writes nothing.

Desktop: search and Apply filters remain visible; the native Readiness, owner and sort disclosure retains additional selections when collapsed. This also leaves room for the first workload card on a phone. Cards have brief, ownership/context and next-step columns. At 1000 px, next step spans the card below two source columns. At 600 px and below, card regions and expanded filters stack. Keep labels and action links visible at 390 and 320 CSS px and 200% zoom. Allow long references, briefs and owner names to wrap. Reuse navy/green semantic tokens and Roboto/Verdana; no new masthead or rail.

URL filters survive reload and browser history. Search applies literally to canonical customer, brief, title and reference before the bounded candidate window. Readiness filters apply within the 100-candidate window, explicitly labelled; counts are displayed permitted rows, not global workload. My estimating work refers to the workspace owner, not Sales ownership. The Saved estimates view preserves the existing E1 register at `/estimating?tab=estimates`.

Loading, no matches, empty permitted workload, failure, no-permission and revoked-access states remain distinct. Failed refresh clears rows rather than displaying old data as current. This page has no business command or unsaved proposal; stale writes and uncertain operations are handled in the existing destination workflow. Required response date stays Unknown; Sales action due date is separate. No automatic price, approval or issue follows from complete scope.

Native evidence and current verification: [programme handover](../../../delivery/estimating-programme-handover.md). Missing exact design image remains explicit. No baseline or owner visual acceptance is registered.

## Design adoption — 25 September 2026

Amends the native workload contract above where they differ. Decisions and reasons: [design board record](../../../decisions/es01-design-board.md).

| Area | Implemented rule |
|---|---|
| Views (P4) | Workload and Saved estimates are link tabs with `aria-current`. Specialist configurations stays in module navigation only |
| Filters (P5) | Search, estimating owner and sort are inline, with Apply filters and Clear filters in one centred 44 px action row. In the stacked layout, readiness, owner and sort sit under one disclosure button whose label names the retained selections. Default values are left out of the URL |
| Readiness (P2, P3, O2) | The shared segmented control, each option with a permitted count from the read model's `counts`. Counts cover the same search- and owner-matched 100-candidate window, before the readiness view. Tones: attention (Scope clarification), success (Discovery complete), neutral (the other two); the words carry the state |
| Register (P1, P6) | Rows carry opportunity, readiness and ownership; the title is a selection button. The panel, drawer or phone card holds next step, ownership and dates (Required response Unknown, once), discovery alternatives, saved estimates, any Sales handover due, and Sales context |
| Drawer (P7) | `WorklistPanel` behaviour with page-scoped right-hand geometry; Escape and Done return focus to the row |
| Saved estimates (P8) | Table: estimate, customer, version, saved date and right-aligned saved sell in AUD, excluding tax. A null sell total reads Not estimated. Labelled blocks at 700 CSS px and below |
| States (P9) | Loading text, no matches, no permitted workload, failed read with rows and counts cleared plus Try loading again, and no access. Placeholder rows declined |
| Findings | B1–B5 fixed; `estimating.css` keeps its button rules for the other Estimating screens |

## Behaviour, handovers and verification

The draft User Guide `guide.es.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.
