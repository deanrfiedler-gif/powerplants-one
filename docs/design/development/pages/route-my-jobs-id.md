# Technician job detail — design reference

Stable entry: `route:/my-jobs/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/my-jobs/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This page address exists in the inspected application source. Open it from a running app using an identity with the required access.

1. Confirm the record reference and customer/site context in this record workspace.
2. Open the assigned job and review the issued pack
3. Record your own start and attributable field evidence
4. Prepare completion evidence and inspect the submission result

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

Accepted presentation baseline: [field work timer r05](../../../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05.html) ([decision](../../../decisions/field-work-timer-design.md), [change record](../../../reference/ui/field-work-timer/powerplants-one-field-work-timer-r05-change-record.md)). It governs the work timer on the job page and the running-timer banner in My Jobs, at 1440, 1024, 820 and 390 px. The native timer is implemented with proposed host adaptations. Paired captures and synthetic checks are recorded in the field programme handover; owner visual and device review remain open.

## Behaviour, handovers and verification

The draft User Guide `guide.page.my-jobs.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current native field contract

FI-01 uses r20 Record detail for the job and Register / worklist for My Jobs. Accepted timer r05 supplies the scoped record header, 96/64 px clock, three readouts, visit track and activity lists. The existing shell supplies global navigation and document scrolling. The mobile timer dock clears the existing 64 px navigation and retains 44 px actions. Shared Button, ReadState, ErrorNotice, Stamp, LocalDateTimeField and original-command recovery remain the host controls.

Actual arrival stays an explicit prior action. Start work selects the original task and optional affected equipment. Pause provides immediate Break/Travel or a required note for waiting/unsafe/other. Stop closes the open stretch; completion/report review remains separate. An unresolved result retains the same original action. No allowance source exists, so the job details show Not established. Undo retains accepted intervals and appends compensation. My Jobs links back to the current personal timer; inaccessible work is not disclosed.

Proposed adaptations: host shell/document scroll, explicit arrival, unavailable allowance and immutable Undo evidence. Review loading, Running, Paused, Stopped, changed authority, competing timer, uncertain result, forgotten finish and report freeze. Source/application captures cover 1440/1024/820/390/320 px; actual 200% Chrome zoom was checked; physical devices and owner visual acceptance remain separate.

Incoming and outgoing handovers, source hashes and exact limitations are in [the native decision](../../../decisions/field-timer-native.md). Current evidence is in [the field programme handover](../../../delivery/field-quality-native-handover.md). Retained r05 bytes and review fingerprints are unchanged.

Current paired captures and actual 200% Chrome zoom/keyboard results are in [the timer evidence record](../../../testing/evidence/field-timer-native/README.md). Source/application evidence is separate from owner approval.


## Scheduling Step 4

The assigned-job list derives the scheduling hold from current durable impact evidence, retaining the existing appointment and reservation. Job detail shows the reason, responsible owner, source publication and required controlled resolution among the independent start blockers. Desktop and phone must keep the full reason readable, with wrapped identifiers and a reachable Start context/error. The server refuses current holds even when a cached flag or prior offline timestamp says otherwise. Exact accepted originals still recover; factual evidence remains recoverable. No issued Step 4 image is available. Automated captures in the Step 4 evidence directory do not confer visual/owner/device acceptance; the existing timer baseline remains distinct.


## Closed-visit guidance — 3 October 2026

Existing scope IDs and r20 page type remain: My Jobs uses **Register / worklist**; the job, work-order and appointment hosts use **Record detail**. No new route. Incoming context is the exact appointment, current assignment, scope and personal attendance; outgoing handovers use the existing Service work-order planned visits and appointment records. A link grants no preparation, booking, capture or technical authority.

A closed appointment shows retained personal attendance identity/times when present, otherwise explicitly says no personal arrival exists. CompletedPendingReview, Completed and Cancelled cannot offer another arrival. Stopped timer, frozen evidence, internal Service acceptance and customer response stay distinct. Proposed is not booked; unknown states are unavailable. Other visits on the same work order are scoped navigation, not inferred return lineage. The receiving appointment shows incomplete preparation versus Preparing and retains separate customer, assignment, readiness and exact-pack requirements.

Reuse ButtonLink, ReadState, ErrorNotice, Stamp, the existing booking-operation recovery and timer host. Current-source read failure removes receiving links and disables arrival/pack actions without destroying pending originals. Downloaded context strips these live actions; cached closed visits cannot create new arrival intent, while retained operations remain on their original visit. Work-order proposal validation/stale errors retain input; an uncertain response keeps the immutable original and prevents another submission until adjudicated.

Desktop 1440/1024 and phone 390/320: retain one content scroll owner, readable wrapping identifiers/history and labelled actions. Keyboard users can follow the work-order/appointment links; recovery continuation is focusable. Inspect actual 200% browser zoom independently of narrow viewports. Accepted timer r05 remains unchanged; this contextual host addition is proposed for owner review. **No accepted native closed-visit mockup exists.** Implementation captures are functional/layout observations, not visual acceptance.

See [state/action decision](../../../decisions/field-closed-visit-guidance.md), [acceptance matrix](../../../testing/field-closed-visit-acceptance.md) and [execution ledger](../../../testing/evidence/field-closed-visit/README.md). Owner, physical-device, screen-reader and independent visual reviews remain open.
