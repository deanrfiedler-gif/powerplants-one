# Create activity — design reference

Stable entry: `route:/work/new`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Refine**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/work/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Search the related register for an existing record before creating another.
2. Complete the information requested by the creation form; keep unknown values explicit.
3. Review the entered context, save through the page action and inspect the resulting record/confirmation.
4. Then continue the wider workflow: Open the activity and record an outcome when completing it

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

- [PPO-My-Work-and-Action-Centre-r01.html](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.page.work.new` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## LC-17 reviewed follow-up back to Sales

Preserve the existing scope and r20 page type. Incoming context is an owned native Activity from Project delivery, Service/aftercare or Maintenance/renewal. Reuse Button, Field/SelectField, LocalDateTimeField, RecordLink, ErrorNotice, the existing Lead modal, native Deal form and actor-bound command journal. Original Activities, native qualification and receiving acknowledgement remain separate authorities.

From Project Sales context, record a customer need as an Internal CustomerContact Activity with an owner and date. In Activity detail, review existing Sales records, choose Lead or qualified Deal, independently capture through the native form if needed, then return for a fixed comparison and explicit link. A restricted, technical or completed original can create a separate Internal RelationshipReview with reviewed wording and its own date; preserve original restrictions and history. A Lead link can then open native next-action planning with the retained Activity selected. Qualification and the Deal initial action are never inferred. Aftercare receiving still requires its separate confirmed Deal reference.

Desktop: show original native links, current customer/site, Activity version/state/date, selected Sales reference/version and separate source attribution. Refresh cannot advance a frozen comparison. A stale save changes no record; discard and compare again. Unknown creation/link results expose original lookup and exact retry; permission loss clears protected comparisons. Project content remains in the existing dialog to preserve Gantt geometry.

Phone: stack fields and recovery controls, wrap names/references, retain readable labels and reachability of native modal actions. Keep the source context and all required review choices visible at 390/320 px. Preserve Escape/return-focus of the existing Project dialog. New LC-17 state mockups and accepted images are missing; this is a proposed host adaptation pending paired visual, keyboard/zoom, physical-device and owner review. Functional checks are recorded separately in `docs/testing/evidence/sales-followup-continuity/README.md`; no accepted fingerprint is supplied.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** S8. The My Work side navigation disappears on this page, unlike its siblings. Lead with the purpose and owner; move company and access class later with plain labels.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
