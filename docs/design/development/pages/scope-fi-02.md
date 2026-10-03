# Offline downloads, queue and conflict recovery — design reference

Stable entry: `scope:FI-02`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/offline/index.html`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

The offline workspace and original-operation recovery already exist. Further usability/device acceptance does not make them unbuilt pages.

1. Download permitted job context before leaving coverage
2. Capture evidence and check its local-save state
3. Reconnect and review each queued operation's receipt or conflict

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

No exact image or HTML reference is linked. Keep this gap visible.

## Behaviour, handovers and verification

The draft User Guide `guide.fi.02` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current native field contract

FI-02 is the dedicated offline workspace, using its existing standalone shell and IndexedDB owner boundary. It is a Work queue + persistent detail page. Download current permitted job context explicitly; the saved timer and selected site-readiness source remain labelled cached. Start, Pause, Resume and Stop retain original operation IDs, versions and dependency order. A failed or conflicting predecessor blocks later intent. Send queued originals and redownload the resulting Time entry manifest before completion. Undo and forgotten finish require the current online timer. Readiness acknowledgement records the exact downloaded source and selected context, including before actual arrival; changed authority is not silently accepted.

Keep download, cached verification, locally saved, queued, server saved, failed, conflict and retained-for-review states distinct. On 390/320 px phones, preserve visible state, labelled controls, queue totals and retry access; do not imply that a network icon proves server acceptance. No exact standalone offline mockup is available; this remains an explicit visual-reference gap.

Incoming and outgoing handovers, source hashes and exact limitations are in [the native decision](../../../decisions/field-timer-native.md). Current evidence is in [the field programme handover](../../../delivery/field-quality-native-handover.md). Retained r05 bytes and review fingerprints are unchanged.

Current paired captures and actual 200% Chrome zoom/keyboard results are in [the timer evidence record](../../../testing/evidence/field-timer-native/README.md). Source/application evidence is separate from owner approval.


## Closed-visit guidance — 3 October 2026

Existing scope IDs and r20 page type remain: My Jobs uses **Register / worklist**; the job, work-order and appointment hosts use **Record detail**. No new route. Incoming context is the exact appointment, current assignment, scope and personal attendance; outgoing handovers use the existing Service work-order planned visits and appointment records. A link grants no preparation, booking, capture or technical authority.

A closed appointment shows retained personal attendance identity/times when present, otherwise explicitly says no personal arrival exists. CompletedPendingReview, Completed and Cancelled cannot offer another arrival. Stopped timer, frozen evidence, internal Service acceptance and customer response stay distinct. Proposed is not booked; unknown states are unavailable. Other visits on the same work order are scoped navigation, not inferred return lineage. The receiving appointment shows incomplete preparation versus Preparing and retains separate customer, assignment, readiness and exact-pack requirements.

Reuse ButtonLink, ReadState, ErrorNotice, Stamp, the existing booking-operation recovery and timer host. Current-source read failure removes receiving links and disables arrival/pack actions without destroying pending originals. Downloaded context strips these live actions; cached closed visits cannot create new arrival intent, while retained operations remain on their original visit. Work-order proposal validation/stale errors retain input; an uncertain response keeps the immutable original and prevents another submission until adjudicated.

Desktop 1440/1024 and phone 390/320: retain one content scroll owner, readable wrapping identifiers/history and labelled actions. Keyboard users can follow the work-order/appointment links; recovery continuation is focusable. Inspect actual 200% browser zoom independently of narrow viewports. Accepted timer r05 remains unchanged; this contextual host addition is proposed for owner review. **No accepted native closed-visit mockup exists.** Implementation captures are functional/layout observations, not visual acceptance.

See [state/action decision](../../../decisions/field-closed-visit-guidance.md), [acceptance matrix](../../../testing/field-closed-visit-acceptance.md) and [execution ledger](../../../testing/evidence/field-closed-visit/README.md). Owner, physical-device, screen-reader and independent visual reviews remain open.
