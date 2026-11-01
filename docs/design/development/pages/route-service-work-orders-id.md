# Work order detail — design reference

Stable entry: `route:/service/work-orders/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/work-orders/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

An app page exists here. Its wider workspace scope or newer design still needs refinement; see the linked scope areas below.

1. Confirm the record reference and customer/site context in this record workspace.
2. Confirm work authority and the exact scope
3. Review readiness and any out-of-scope findings
4. Use controlled successor scope when requirements change

## Desktop

Accepted design (12 October 2026): the [work order record page decision](../../../decisions/work-order-record-page-design.md), with captures 01–10 in [Work order record page design r01](../../../reference/ui/service/work-order-record-page-design-r01/README.md). It is the second record type on the shared record layout. The app still shows the work order as a stack of panels, and the shell parts wait for their own rollout decision.

- **Layout at 1440 × 900:** the Service rail with Work orders selected; the breadcrumb "Work orders / reference" (shell top bar amendment, 16 October 2026), which returns to the register; no secondary menu. Below the top bar come a one-row header, a state banner when one applies, the "Ready to authorise" bar, then a 380 px details column and a main column, each scrolling on its own.
- **Header:** title (the scope summary, or "Work scope needed") and the State tag, the position in the register view with previous/next, one main action chosen by state and permission (Write the scope, Review readiness, Authorise rNN or Propose a visit; none when read only), a second action where one applies, and "…" (Review a readiness criterion, Open the linked request, Compare saved version, Copy link). Below: reference, the Service owner with an avatar, and origin.
- **Readiness bar:** six checks drawn from `blockers()`: requests triaged, scope, equipment, coverage route, authority evidence, and criteria cleared (n of 5). A gap shows in amber, with words.
- **Details column:** Summary, Customer and site, Linked requests, Coverage, Equipment, Authority evidence and Origin, divided by lines.
- **Main column:** view tabs Authorisation, Scope rNN, Visits, Evidence and History. The page opens on the tab that holds the next step. Authorisation leads with a decision card listing each blocker and the action that clears it, then the five criteria. Review opens a side panel; Authorise opens a confirmation dialog with a required reason; Edit scope opens the editor in the Scope tab with a fixed save bar.
- **States:** scope needed, ready to authorise without authorise access, authorised with no visit, read only, a newer saved version while editing, a failed refresh, and a successor in draft (capture 09).

Use the application shell for navigation, search, identity and the existing information icon. Keep the page title, selected record/scope and primary action visible. Use a register/worklist for multiple records and a record/evidence workspace for an individual record. Match the linked page-specific reference where one exists; retain its accepted geometry.

At 1440 × 960 and 1024 × 768, inspect the complete shell and stylesheet order. Let long titles and unknown values wrap. Keep one owner for content scrolling. Record the actual dimensions and any approved adaptation here after paired source/application review.

## Mobile

Accepted design (12 October 2026): capture 11 in [Work order record page design r01](../../../reference/ui/service/work-order-record-page-design-r01/README.md).

- **At 390 × 844:** tapping a work order in the list opens the record page directly: back, previous/next, the State tag and authorisation status, then Details, Authorisation, Scope and Visits tabs over scrolling content, with "…", Edit scope and the main action fixed at the bottom. Evidence and History open from Details.
- **Actions:** "…" opens an action sheet with the record actions.
- **Not drawn yet:** the phone Visits tab and the phone versions of the states.

At 390 × 844 and 320 CSS px, retain the same task and record context. Stack related fields and use labelled cards for dense worklists. Keep primary actions, validation and the close control reachable. Inputs use readable 16 px text; touch controls use the shared minimum target. Do not hide a required decision or critical state solely to fit the screen.

The exact mobile composition has not been visually accepted for this entry. Retain mobile-specific evidence here when reviewed; a desktop image is not mobile evidence.

## Shared components and states

Use the global Roboto/Verdana typography and semantic tokens. Reuse the shared Button component for new controls; preserve documented existing page-specific exceptions until deliberately migrated. Use consistent primary/secondary/quiet/danger meanings. Include hover, visible focus, disabled and loading states.

Review loading, empty, filtered-empty, read-only/denied, missing context, validation error, stale revision, saving, uncertain result and success where the workflow supports them. Status must include words, not colour alone. Preserve a draft when opening guidance or inspecting a reference.

## Visual references

- [PPO-Work-Orders-Workspace-r01.html](../../../reference/ui/service/PPO-Work-Orders-Workspace-r01.html)
- Accepted Figma design: [Work order record page design r01 captures](../../../reference/ui/service/work-order-record-page-design-r01/README.md) (icon-free PNGs; design compositions, not application captures). The retained workspace HTML above stays unchanged; the accepted design replaces the panel layout when the page is built. Images of the Propose a visit form, the successor scope form and the LC-16 Sales sources panel are still missing.

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.work-orders.id` carries prerequisites, tasks, outcomes and recovery. Review that article against the running release before publication. Keep source presence, visual review, functional testing, owner acceptance and deployment separate.

Acceptance evidence is pending. Capture matching original-reference and application views, then verify keyboard order, focus return, 200% zoom, wrapping, scroll ownership, phone states and the relevant business journey. Do not replace a comparison image simply to make a test pass.

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


## Native Won receiving (LC-16)

Keep this existing scope and page type. Incoming handover: exact accepted Won Sales event; outgoing: independently created native Project or Service work order and a separately reviewed typed binding. The Deal reads native receiving state and the retained Activity separately. It does not infer delivery completion from acceptance, a link or an Authorised work order.

Reuse shared Button, Field, SelectField, ErrorNotice, recoverable command journal, existing native lookup controls and record guard. Preserve the native Project Gantt and Service scope/readiness layouts. Proposed addition: a scoped Sales-context panel, explicit fixed-version comparison and create-and-return actions. Existing native form buttons remain documented legacy controls; no new theme or navigation system is introduced.

Desktop and phone: wrap reported scope and references; show original Sales revision beside current native state, owner and version. Keep Review, link reason, discard and original-recovery actions visible in normal document flow. A refresh must not silently substitute a reviewed comparison. Denied comparison reads remove its protected content. Unknown Sales site requires an explicit native site choice and does not rewrite the accepted source. New Service intake and work-order creation save independently before link review; existing native scope and authorisation controls remain.

Exact new-state mockup/HTML images are missing. Retained module references above are baseline context. Implementation captures and synthetic checks are recorded in `docs/testing/evidence/won-delivery-continuity/README.md`; they do not grant paired visual, keyboard/200% zoom, physical-device or owner acceptance. Review fingerprints remain unchanged.

## Additive backend contract

The [Work orders backend](../../../decisions/work-order-register-backend.md) supplies permission-scoped register and record projections. Counts explicitly cover one authorised candidate window; they must not be presented as global menu totals. Evidence and history identify their native source scope. The existing screen and commands remain compatible; accepted Figma page integration, global counts and visual review remain pending. [Execution evidence](../../../testing/evidence/work-order-register/README.md) records actual checks. No review fingerprint is changed.

## Linked project (B1) — 30 October 2026

Proposed addition, built as an agent decision under Dean's standing order of 30 October 2026; not Dean's acceptance. When the work order belongs to a project (rule R1 of the project field work and milestone billing decision, proposed in [PR #751](https://github.com/deanrfiedler-gif/powerplants-one/pull/751)) and the reader may read that project, the state row shows "Project: {reference} · {title}" as a link to `/projects/{id}`, with "(closed)" when the project is closed. A reader who may not read the project sees nothing about it. Linking and unlinking happen on the project page, which needs both project and work-order edit; this page adds no action, layout or control.

Desktop and phone keep the existing wrapping state row; the link wraps with long titles and keeps the shared focus style. Exact images are missing. Functional evidence: `docs/testing/evidence/work-order-project-link/README.md`; no review fingerprint is changed.
