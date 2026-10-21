# Appointment detail — design reference

Stable entry: `route:/service/appointments/[id]`. Owner: Dean Fiedler. Status: **Owner visual review pending for this implementation** (prior 9 October Refine review retained below).
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/appointments/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## SV-04 native implementation — 21 October 2026

**Owner visual review: pending.** Scope SV-04, r20 page type **Record detail**, route `/service/appointments/[id]`. The accepted source is the private Figma file **PPO - Design**, named version **Appointment detail — shared record layout, accepted**, authorised by [the accepted design decision](../../../decisions/appointment-detail-figma-design.md). Implementation was requested on 21 October; this does not grant review of the build.

### Source and layout contract

Page `1187:50`; brief `1187:86`; notes `1195:267235`; File index `630:2` (row `1199:50`). Desktop confirmed/held `1191:50`; tablet `1193:264207`; phone 390 `1193:263684`; phone 320 `1193:263999`. State frames: ready `1195:1202`, site overdue `1195:1438`, site not ready `1195:1685`, supply rehold `1195:1930`, proposed `1195:2153`, cancelled `1195:2409`. Reused readiness dialog `963:10299`, page dialog `1195:266625`, phone sheet `1195:266814`. Work order shared record references `315:2094` and `326:53619` inform shared state treatment. No new state artwork is asserted for those reference IDs.

Retained, unchanged source evidence: [seven icon-free captures](../../../reference/ui/service/appointment-detail-design-r01/README.md). Live frames, notes and variable definitions were inspected; capture 01 was cross-checked with the live desktop source. Native captures and exact verification results belong in [implementation evidence](../../../testing/evidence/appointment-detail-native/README.md), separate from the source images.

- D1/D2: no tabs; shared record title with state and readiness chips, readiness strip and one scrolling body. Left Summary, Customer and site, Crew; main dispatch decision, checks, pack, contact, follow-ups, requests, collapsed integrity details.
- Desktop 1440: 380 px facts; 24 px main gutters; compact ruled rows and token-based cards. Reuse the existing Service shell and Schedule rail context. No shell code changes.
- D3/D5: tablet 1024 moves facts below the main workspace. Existing shared shell breadcrumbs remain; tablet page-name-only chrome is a documented difference rather than a global shell amendment.
- D4: contact rows have a 176 px outcome column on desktop and stack on phone. No fabricated site-readiness contact is inserted into the date-contact history.
- Phone 390/320: use the later [compact phone header amendment](../../../decisions/phone-header-amendment.md); status, decision and checks lead, Visit includes customer/site and a Crew and visit details disclosure, then pack/contact/tasks. Editable visits retain 44 px bottom actions; cancelled/closed visits do not. Text wraps, including identifiers; no deliberate clipping of the 320 px source.

## Desktop

Match `1191:50` at 1440 px and `1193:264207` at 1024 px using the layout contract above. Keep one content scroll, no record tabs, 380 px desktop facts, tablet facts after the main column, and visible derived dispatch reasons. The shared workspace token block now includes only this additional host ID; no token value or other consumer is changed.

## Mobile

Match the 390/320 source families above with the adopted compact phone header, stacked contact rows, accessible disclosures, readable inputs and persistent editable-visit actions. Site-readiness dialogs remain gated. Every fact hidden from the desktop aside remains in Visit or its Crew and visit details disclosure.

### Reuse, data and handovers

Reuse `SharedRecord`, `RecordFactSection`, `PageHeader` identity publication, `Button`/`ButtonLink`, `RegisterChip`, `WorklistMenu`, `ProductIcon` (existing Font Awesome mapping), `ReadState`/`ErrorNotice`, `Stamp`, `usePhoneHeader`, the existing booking/contact/cancellation/request forms, `PolicyResolution`, `BookingRecovery` and `useBookingCommand`. Appointment-specific sections and scoped CSS are local composition, not new shared components. Shared record catalogue consumers, state fixture and alignment item are maintained in this change.

Incoming: exact appointment from Schedule, work-order visit or saved-command continuation. Outgoing: the exact work order, current visible pack or permitted preparation, visible follow-up Activity, customer/site and (only with existing scoped `supply.read`) the linked demand. Links grant no authority. The canonical pack endpoints are reused; the old `JobPackEntry` visual host is replaced here by a page-local read of the same entry plus its permitted pack details. The Field drawer's `JobPackEntry` remains unchanged.

The appointment projection adds customer identity, visible contact name, service-owner name and the existing supply permission flag. Parts is server-derived P1 data; no checkbox grants a pass. Current issue acknowledgements match its exact output hash; prior returns remain historical. Appointment and pack reads have separate permission/failure boundaries. A late response is discarded when its appointment read changes. Failed refresh retains evidence without live actions; denial clears it. Existing immutable-original booking recovery is preserved. Online only; no offline claim or new grants, migrations, dependencies or business integrations.

### Gated scope and explicit differences

1. P4 customer site readiness and P5 issue lead time are explicitly excluded by this implementation request. Their locations say **Not available yet**; overdue/not-ready P4 states and the drawn dialog/sheet are not executable. Date agreement is never substituted. A current **Ready to dispatch** result explicitly says P4 is not in the implemented gate.
2. The undrawn Link a demand, Parts statement and permitted-exception dialogs are not built. Q2 enables navigation to an already linked demand for supply readers; creating a link still needs a separately drawn control. Existing server exceptions display their actual outcome.
3. R2 current Parts/hold changes refresh without moving the booking. Existing R2 tasks have no structured appointment link or cause projection in this read model. The page does not infer that association from summary text, claim a previous promise or label a hold “held again” without evidence. Owner/cause/task details for that frame remain an open data-contract question.
4. Crew confirmation is labelled **Checked at confirmation**, because no live independent CrewCompetency criterion is returned. No current Pass is invented. Older readiness policies without Parts say unavailable. The existing gate remains authoritative.
5. The server does not expose record-position navigation, pack-follow-up due dates or full site-contact role fields here. Omit the invented position arrows; show exact available identity and an explicit missing value. Pack task due date is read on the task. Existing forms stay inline; no new dialog layout is invented.
6. Current policy impacts, preparation warnings, authorisation blockers and other live criteria remain visible even when absent from the static fixture. Closed visits retain work-order handover and preparation/attendance distinctions. These additions are reviewable differences, not baseline acceptance.

### Verification and open review

See [execution evidence](../../../testing/evidence/appointment-detail-native/README.md) for commands, results, screenshots, viewport comparisons and limitations. Synthetic UI fixtures exercise supported states, permissions and original-operation recovery; a database test is added for the projection, but local setup timed out before its assertions and also failed on unmodified main. The stable route and scope keys and all parent IDs remain unchanged. Build sequence and status are generated, not hand-edited.

Open for Dean: review the native visual differences; settle the undrawn demand/statement/exception controls before implementation; decide the later P4/P5 increments; provide a structured R2 cause/task association if the detailed rehold narrative is required. Owner visual, physical-device, screen-reader and business review remain pending. No deployment is claimed.


## Scheduling Step 4 integration

Preserve this entry's scope ID and page type. Reuse shared fields, Button, ReadState/ErrorNotice and existing appointment/planner controls. Incoming handovers: exact published selection, immutable impact, retained booking pin and owned Activity. Outgoing handovers: controlled appointment/resolution receipt and refreshed readiness; customer, pack, Finance and issued documents retain their separate authority.

Desktop must show the impact reason, responsible owner, source publication and permitted next action. Booking preparation follows the proposed interval and publication head, including future policies; stale saves retain entries and need fresh review. Completing an Activity or acknowledging a pack cannot clear the policy hold. Later source changes restore it. The appointment's online resolution disclosure requires controlled change/cancellation/replacement and fresh evaluation. Uncertain responses retry the original unchanged.

Cancelled appointments retain this resolution disclosure when the current server action set permits policy resolution. Cancellation still removes booking and arrival commands; the separate resolution evaluates the original policy impact and preserves its exact operation on retry. Completed and CompletedPendingReview appointments retain their existing closed-state restrictions. The Scheduling enforcement journey proves cancellation followed by one recovered resolution.

Background appointment refresh disables resolution evaluation/save while retaining the original draft, disclosure and command receipt; denial still clears the protected host. Readiness handovers retain the complete safe appointment return target, including its original planner context. The visible return link reopens the exact Changes selection or planner context, while the integrity disclosure retains original version details.

At 390/320 px, stack fields/actions, wrap exact identifiers and keep hold/recovery text readable without horizontal overflow. Retain keyboard alternatives to drag and native disclosure/label semantics. Delayed offline Start is rechecked on reconnect and may remain ReviewRequired with original evidence retained. Publication and resolution are online only. No Step 4 issued mockup is available; the existing retained HTML remains the source reference. Additional content is a proposed visual departure pending owner review. Functional evidence: `docs/testing/evidence/scheduling-policy-enforcement/README.md`; captures and source checks do not grant visual/device/owner acceptance.

Automatic policy preparation must show failures without moving focus out of a date being edited. Save stays unavailable until complete preparation succeeds; explicit command errors retain normal focus and recovery.


## Closed-visit guidance — 3 October 2026

Existing scope IDs and r20 page type remain: My Jobs uses **Register / worklist**; the job, work-order and appointment hosts use **Record detail**. No new route. Incoming context is the exact appointment, current assignment, scope and personal attendance; outgoing handovers use the existing Service work-order planned visits and appointment records. A link grants no preparation, booking, capture or technical authority.

A closed appointment shows retained personal attendance identity/times when present, otherwise explicitly says no personal arrival exists. CompletedPendingReview, Completed and Cancelled cannot offer another arrival. Stopped timer, frozen evidence, internal Service acceptance and customer response stay distinct. Proposed is not booked; unknown states are unavailable. Other visits on the same work order are scoped navigation, not inferred return lineage. The receiving appointment shows incomplete preparation versus Preparing and retains separate customer, assignment, readiness and exact-pack requirements.

Reuse ButtonLink, ReadState, ErrorNotice, Stamp, the existing booking-operation recovery and timer host. Current-source read failure removes receiving links and disables arrival/pack actions without destroying pending originals. Downloaded context strips these live actions; cached closed visits cannot create new arrival intent, while retained operations remain on their original visit. Work-order proposal validation/stale errors retain input; an uncertain response keeps the immutable original and prevents another submission until adjudicated.

Desktop 1440/1024 and phone 390/320: retain one content scroll owner, readable wrapping identifiers/history and labelled actions. Keyboard users can follow the work-order/appointment links; recovery continuation is focusable. Inspect actual 200% browser zoom independently of narrow viewports. Accepted timer r05 remains unchanged; this contextual host addition is proposed for owner review. **No accepted native closed-visit mockup exists.** Implementation captures are functional/layout observations, not visual acceptance.

See [state/action decision](../../../decisions/field-closed-visit-guidance.md), [acceptance matrix](../../../testing/field-closed-visit-acceptance.md) and [execution ledger](../../../testing/evidence/field-closed-visit/README.md). Owner, physical-device, screen-reader and independent visual reviews remain open.

## SV-04 / FI-06 / PL-04 integration

The accepted appointment record retains the FI-06 Visit more actions menu beside desktop actions and in the visible phone status row. Opening it reads current reporting access for this exact appointment; each incident handover carries the permitted scope-item and equipment IDs. Changes and follow-up links retain their validated `returnTo` and `action=contact` or `action=move` context. The current appointment state still governs whether an editor is available. The shared record primitive is unchanged; owner visual review of this combined host remains pending. Exact incident-link coverage at 1440/390/320 is in `tests/browser/appointment-detail.spec.ts`.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** The action buttons touch the 'Current crew' heading; add the standard section gap. S5 and S6.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

Phone integration adaptation: retain the shared global More opener beside the sticky record actions so Account, module navigation and guide access survive the loaded record header replacing its temporary menu with Back. Reserve a 44 px control and left action-bar space at 390/320; closed records reserve bottom content clearance. This restores shell access using the existing control; owner visual acceptance of the dock adaptation is pending. The exact incident/global-menu fixture verifies pointer access and Escape focus return after the record loads.
