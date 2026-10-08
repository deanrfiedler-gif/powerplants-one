# Site induction, risk and biosecurity review — design reference

Stable entry: `scope:FI-05`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/my-jobs/site-readiness`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Native `/my-jobs/site-readiness?appointment_id=…` consumes the exact CS-06 source for a currently assigned visit. The bare route offers a permitted-visit chooser. [Implementation decision](../../../decisions/field-readiness-native.md) and [programme evidence](../../../delivery/field-quality-native-handover.md) distinguish implementation, testing, visual review and deployment.

1. Open the exact job and review arrival/access, source owner and recorded time.
2. Explicitly select Facility/Area/Block and activity; review applicable requirements, evidence periods and work windows.
3. Record your personal review note and acknowledgement. Unmet conditions remain unresolved and must be escalated through the owning Service workflow.

The current Resource has no canonical Person binding. Individual induction remains unverified; a matching name or acknowledgement cannot satisfy it. A preparation selection never expands authorised scope or inherits a parent Facility's requirements.

## Desktop

Page type: record/evidence workspace with a visit chooser. Reuse the current shell, PageHeader, ReadState, Field, ValidationFields, Button and original-operation command status. Show visit context, explicit preparation selection, source/requirements and retained personal reviews in that order. No second navigation shell or global header. Incoming handovers: My Jobs, exact appointment/assignment and CS-06. Outgoing handovers: owning Site readiness and the same job; escalation is a retained note, not an automatically assigned Activity.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html](../../../reference/ui/quality-site-assurance/PPO-Quality-Safety-and-Site-Assurance-Workspace-r01.html)

## Behaviour, handovers and verification

The draft User Guide `guide.fi.05` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

[Executed evidence](../../../testing/evidence/field-readiness-native/README.md) records paired reference/native captures, keyboard order, wrapping, scroll ownership and desktop/phone recovery. Actual 200% browser zoom and physical-device/assistive-technology acceptance remain pending. No page-specific dialog was added. Do not replace a comparison image simply to make a test pass.

## Native adaptations and limits

Quality r01 is a proposed standalone reference. Native FI-05 uses the existing shell and vertically ordered cards instead of reproducing its multi-domain package rail. No runtime release/hold/induction policy is copied from its fixture. Exact reference captures are retained in the evidence manifest; the implementation agent inspected desktop/phone pairs. Owner visual acceptance remains pending. The source HTML remains unchanged.

Changed source/visit context refuses a stale save; the old note/snapshot remains. An uncertain command keeps its original identity for receipt recovery. The page is online only at this increment; FI-02 extension is tracked separately. Denied reads clear current source content. The global information icon maps this route to its maintained draft guide.


## Closed-visit guidance — 3 October 2026

Existing scope IDs and r20 page type remain: My Jobs uses **Register / worklist**; the job, work-order and appointment hosts use **Record detail**. No new route. Incoming context is the exact appointment, current assignment, scope and personal attendance; outgoing handovers use the existing Service work-order planned visits and appointment records. A link grants no preparation, booking, capture or technical authority.

A closed appointment shows retained personal attendance identity/times when present, otherwise explicitly says no personal arrival exists. CompletedPendingReview, Completed and Cancelled cannot offer another arrival. Stopped timer, frozen evidence, internal Service acceptance and customer response stay distinct. Proposed is not booked; unknown states are unavailable. Other visits on the same work order are scoped navigation, not inferred return lineage. The receiving appointment shows incomplete preparation versus Preparing and retains separate customer, assignment, readiness and exact-pack requirements.

Reuse ButtonLink, ReadState, ErrorNotice, Stamp, the existing booking-operation recovery and timer host. Current-source read failure removes receiving links and disables arrival/pack actions without destroying pending originals. Downloaded context strips these live actions; cached closed visits cannot create new arrival intent, while retained operations remain on their original visit. Work-order proposal validation/stale errors retain input; an uncertain response keeps the immutable original and prevents another submission until adjudicated.

Desktop 1440/1024 and phone 390/320: retain one content scroll owner, readable wrapping identifiers/history and labelled actions. Keyboard users can follow the work-order/appointment links; recovery continuation is focusable. Inspect actual 200% browser zoom independently of narrow viewports. Accepted timer r05 remains unchanged; this contextual host addition is proposed for owner review. **No accepted native closed-visit mockup exists.** Implementation captures are functional/layout observations, not visual acceptance.

See [state/action decision](../../../decisions/field-closed-visit-guidance.md), [acceptance matrix](../../../testing/field-closed-visit-acceptance.md) and [execution ledger](../../../testing/evidence/field-closed-visit/README.md). Owner, physical-device, screen-reader and independent visual reviews remain open.

## Integrated acceptance session — 3 October 2026

Use the [current owner walkthrough](../../../delivery/field-integrated-owner-walkthrough.md) and [source-specific PT ledger](../../../testing/field-integrated-acceptance-ledger.md). Desktop1440/1024, phone390/320, actual200% zoom, readable history and one content scroll owner remain required. Technical captures and keyboard automation are separate from actual human findings. Accepted timer r05 and existing scope/page/component bindings are unchanged; native closed-visit/FI07 mockup gaps and pending reviews remain visible. No fingerprint or reviewer is supplied by this guide update.

## NAV contextual navigation

Field site readiness has a specific breadcrumb. Hosted offline recovery explains unavailability; local originals retain their existing supported offline routes.

Desktop uses the existing shell with a 76 px compact or 232 px labelled primary rail. Mobile uses labelled destinations and More > Workspace; Home/search/help remain reachable. Check 320/390/780/781/1199/1200 px where applicable, long labels, visible focus and Escape/return focus. Missing accepted images remain explicit; no new accepted image or review fingerprint is recorded. Functional results and screenshot observations are in the NAV ledger; owner/device review and deployment remain separate.
