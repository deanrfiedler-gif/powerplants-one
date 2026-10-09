# Technician Today and job execution — design reference

Stable entry: `scope:FI-01`. Owner: Dean Fiedler. Status: **Owner visual review 9 October 2026: Accept with minor fixes**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/my-jobs`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

My Jobs and job execution already exist, including start, evidence capture and completion. Remaining field refinement and acceptance are not a new missing page.

1. Open the assigned job and review the issued pack
2. Record your own start and attributable field evidence
3. Prepare completion evidence and inspect the submission result

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

The draft User Guide `guide.fi.01` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

## Current native field contract

FI-01 uses r20 Record detail for the job and Register / worklist for My Jobs. Accepted timer r05 supplies the scoped record header, 96/64 px clock, three readouts, visit track and activity lists. The existing shell supplies global navigation and document scrolling. The mobile timer dock clears the existing 64 px navigation and retains 44 px actions. Shared Button, ReadState, ErrorNotice, Stamp, LocalDateTimeField and original-command recovery remain the host controls.

Actual arrival stays an explicit prior action. Once saved, timer authority refreshes immediately so Start work can become available without a manual reload; no arrival or timer duration is inferred. Start work selects the original task and optional affected equipment. Pause provides immediate Break/Travel or a required note for waiting/unsafe/other. Stop closes the open stretch; completion/report review remains separate. An unresolved result retains the same original action. No allowance source exists, so the job details show Not established. Undo retains accepted intervals and appends compensation. My Jobs links back to the current personal timer; inaccessible work is not disclosed.

Proposed adaptations: host shell/document scroll, explicit arrival, unavailable allowance and immutable Undo evidence. Review loading, Running, Paused, Stopped, changed authority, competing timer, uncertain result, forgotten finish and report freeze. Source/application captures cover 1440/1024/820/390/320 px; actual 200% Chrome zoom was checked; physical devices and owner visual acceptance remain separate.

Incoming and outgoing handovers, source hashes and exact limitations are in [the native decision](../../../decisions/field-timer-native.md). Current evidence is in [the field programme handover](../../../delivery/field-quality-native-handover.md). Retained r05 bytes and review fingerprints are unchanged.

Current paired captures and actual 200% Chrome zoom/keyboard results are in [the timer evidence record](../../../testing/evidence/field-timer-native/README.md). Source/application evidence is separate from owner approval.

## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.


## Closed-visit guidance — 3 October 2026

Existing scope IDs and r20 page type remain: My Jobs uses **Register / worklist**; the job, work-order and appointment hosts use **Record detail**. No new route. Incoming context is the exact appointment, current assignment, scope and personal attendance; outgoing handovers use the existing Service work-order planned visits and appointment records. A link grants no preparation, booking, capture or technical authority.

A closed appointment shows retained personal attendance identity/times when present, otherwise explicitly says no personal arrival exists. CompletedPendingReview, Completed and Cancelled cannot offer another arrival. Stopped timer, frozen evidence, internal Service acceptance and customer response stay distinct. Proposed is not booked; unknown states are unavailable. Other visits on the same work order are scoped navigation, not inferred return lineage. The receiving appointment shows incomplete preparation versus Preparing and retains separate customer, assignment, readiness and exact-pack requirements.

Reuse ButtonLink, ReadState, ErrorNotice, Stamp, the existing booking-operation recovery and timer host. Current-source read failure removes receiving links and disables arrival/pack actions without destroying pending originals. Downloaded context strips these live actions; cached closed visits cannot create new arrival intent, while retained operations remain on their original visit. Work-order proposal validation/stale errors retain input; an uncertain response keeps the immutable original and prevents another submission until adjudicated.

Desktop 1440/1024 and phone 390/320: retain one content scroll owner, readable wrapping identifiers/history and labelled actions. Keyboard users can follow the work-order/appointment links; recovery continuation is focusable. Inspect actual 200% browser zoom independently of narrow viewports. Accepted timer r05 remains unchanged; this contextual host addition is proposed for owner review. **No accepted native closed-visit mockup exists.** Implementation captures are functional/layout observations, not visual acceptance.

See [state/action decision](../../../decisions/field-closed-visit-guidance.md), [acceptance matrix](../../../testing/field-closed-visit-acceptance.md) and [execution ledger](../../../testing/evidence/field-closed-visit/README.md). Owner, physical-device, screen-reader and independent visual reviews remain open.

## Integrated acceptance session — 3 October 2026

Use the [current owner walkthrough](../../../delivery/field-integrated-owner-walkthrough.md) and [source-specific PT ledger](../../../testing/field-integrated-acceptance-ledger.md). Desktop1440/1024, phone390/320, actual200% zoom, readable history and one content scroll owner remain required. Technical captures and keyboard automation are separate from actual human findings. Accepted timer r05 and existing scope/page/component bindings are unchanged; native closed-visit/FI07 mockup gaps and pending reviews remain visible. No fingerprint or reviewer is supplied by this guide update.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Accept with minor fixes.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium.
- **Findings:** Follows My jobs and the job page.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.
