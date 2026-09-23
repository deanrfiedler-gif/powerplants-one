# Request detail and communication timeline — design reference

Stable entry: `scope:SV-02`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Dean accepted its recommendations (D1–D8) that day. His visual review is still to be recorded, so it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets` (register entry); record route `/service/tickets/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Hold one service request: reported symptoms, scope questions, notes, attachments, the triage decision, coverage uncertainty and linked work and visits (r06 SV-02).

1. Open the request and review its current stage, commitments and timeline.
2. Keep customer statements separate from verified findings.
3. Triage the request, link the correct authorised work and keep unresolved questions visible.
4. Review a proposed resolution against its evidence before it is accepted.

The composition below comes from the [proposed native refinement](../../../decisions/service-requests-native-refinement.md). Dean accepted D1–D8 on 23 September 2026. The later stages wait for the proposed lifecycle extension, [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md) (D3).

## Desktop

Proposed module interior of 1364 × 896 at a 1440 × 960 window (board frames 4, 7–10 and 15; images in [board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md) and [r02](../../../reference/ui/service-cases/native-refinement-r02/README.md)). The shell is a separate module and is not drawn.

- **Host (not drawn).** The shell's breadcrumb reads *Service / Service requests / SYN-PPO-TKT-000201*. Registered as a `padded` module workspace with `navigation: "workspace"` (D6). The module draws no masthead and no selected-case dropdown: the record is the page.
- **Record header** (white, full bleed):
  - A back link to *Service requests*.
  - A 24 px/600 title with stage and priority chips beside it.
  - One meta line: reference, customer, site, received time and channel, and revision.
  - Actions on the right: *Request information* and *Update details* as secondary buttons, the stage's primary action (*Triage request* for New), and a *More* menu (link a related request, cancel request, complete history, assistant).
  - While the request waits, *Update waiting reason* replaces *Request information*, because r02 refuses a clarification in that state (frames 8 and 15).
- **Progress strip:** Capture, Triage, Coordinate and Resolution, each as an inline step with a short outcome. The current step is marked with `aria-current="step"`.
- **Record tabs** (`tabs`, 3 px green underline on the current tab): Overview, Triage & actions, Work & visits, Evidence & updates (with count) and Resolution & review.
- **Overview** (frame 7), in two columns: a flexible main column and a 372 px aside.
  - **Main column:**
    - A possible-recurrence notice (same equipment, earlier request) with *Compare* and *Link as related*.
    - *Reported issue*: the symptom, production and crop impact, backup arrangements with unconfirmed parts marked, and the reported priority, which triage confirms.
    - *Location and equipment*: site path, address and map link, affected area chips, and the equipment with its installed location and served areas.
    - *Next actions*, empty until triage.
  - **Aside:**
    - *Next customer update*: large time, relative time and *Record customer update*.
    - *Accountability*: owner, logged by, caller and received time.
    - *Activity*.
- **Triage form** (frame 4): a right-docked 560 px panel over a 40 % navy scrim.
  - **Header:** the transition (New → Triaged, with the revision), the title and the request reference.
  - **Note:** nothing moves until save; a stale revision refuses the save and keeps entries.
  - **Groups:**
    - Response decision: reviewed priority, accountable owner, priority rationale, response route, and triage decision and limitations.
    - Impact and backup.
    - Owned next action: action, person responsible and due.
    - Customer commitment: next update due, plus an escalation instruction below the fold.
  - **Footer:** *Cancel · keep in New* and *Save triage decision*.
  - **Fields:** the same as r02 (`fields`, `validation`).
- **Resolution & review** (frame 10):
  - A *Proposed resolution* panel: summary, proposer and time, then the cited evidence with its basis chip and source link.
  - A scope-of-evidence notice, then an explanation of what accepting does, then *Return for correction* and *Accept and mark resolved*. The buttons never wrap.
  - *Closure readiness* checks: no open actions; no waiting dependency, work order or visit; customer contact after the review (still required); and site and equipment recorded (advisory, D4).
  - Aside: next customer update, customer contact and completed action.
- **Work & visits** (frame 8, TKT-000203 waiting for parts):
  - An information notice states that the visit is complete but the request is not.
  - The linked work order shows its reference, title and its own state (*In progress*). It states that Work orders and Schedule own scope, state and bookings, followed by scope, parts (unconfirmed, in amber), the service note and the source, then its visit with a *Completed* chip, technician, time and note.
  - *Link other work* links an existing work order; new work needs its own scope decision in Work orders.
  - **Aside:** the waiting dependency (responsible person, next review, detail), the next customer update, and *Who owns what*, which lists the request stage, the work-order state, the visit state and part supply.
- **Evidence & updates** (frame 9, TKT-000206): the communication timeline.
  - **Filters:** toggles for All activity, Customer statements, Findings, Contacts and Actions and decisions, with counts; *Add evidence* on the right.
  - **Entries**, newest first: date and time, a basis chip, a title, the author, the text and the source.
  - **Kinds shown:** customer statement, verified finding, customer contact, action completed, and resolution proposed, which links to the review.
  - **Aside:** *Evidence basis* counts r02's five bases (reported symptom, suspected cause, attempted fix, verified finding and work completed) and explains that statements and diagnoses stay separate and that a correction supersedes a note without deleting it. *Evidence gaps* lists the missing site and equipment, with *Update details*.
- **Triage & actions** (frame 15, TKT-000203 waiting):
  - **Response decision:** response route, priority with its rationale, request owner, impact and backup (unknowns in amber words), triage notes, the escalation instruction and category.
  - **Review response:** stays visible but disabled while the request waits. The reason is shown below it: *Resume the request before changing its response*.
  - **Owned actions:** a table of action, responsible person, due time with relative time, state, and *Record outcome*. Recording an outcome completes the action or transfers it to named receiving work and a responsible person. The request stage changes only by its own decision.
  - **Clarifications:** open clarifications, or a line saying none are open and when *Request information* applies.
  - **Aside:** the waiting dependency, the next customer update, and the linked work order with its own state.
- **At 1024 × 768** (frame 17; interior 948 × 704):
  - **Header:** the title (22 px) and meta line wrap beside the actions. *Update details* moves into *More*, so the primary action stays visible.
  - **Progress strip:** keeps only the current step's note.
  - **Tabs:** 11 px side padding.
  - **Customer update:** the *Next customer update* card becomes a one-line strip above the main column, with *Record customer update*.
  - **Aside:** the other aside cards stack below the main column, two to a row.

## Mobile

Proposed module interior of 390 × 716 at a 390 × 844 window (board frame 12). The triage dialog (frame 13) covers the full 390 × 844 viewport.

- **Record page:**
  - **Header:** a back link with a 40 px target, a 21 px title, stage and priority chips, a step label (*Step 2 of 4 · Triage*) and a meta line.
  - **Tabs** scroll horizontally.
  - **Body:** a customer-update row with a *Record* link, then the recurrence notice, then the reported issue.
  - **Sticky action bar** above the bottom navigation: *Request info* and the primary *Triage request*, both 48 px high.
- **Triage form:**
  - **Layout:** full screen with no bottom navigation, a 44 px close control, and the subtitle *reference · New → Triaged*.
  - **Validation:** an error summary at the top links to the first invalid field; the drawn example is a missing response route.
  - **Fields:** 48 px, with 16 px text.
  - **Footer:** sticky *Cancel* and *Save triage decision*.
- **Work & visits** (frame 21):
  - The information notice comes first.
  - The work-order card follows: reference, title, its own state chip, parts in amber, and the completed visit row with *Open in Work orders*.
  - The waiting card comes last.
  - Sticky actions: *Request info* and *Review and resume*.
- **Evidence & updates** (frame 22):
  - Basis toggles scroll horizontally.
  - Each entry is a card with its basis chip, time, title, author and text.
  - Sticky actions: *Add evidence* and *Review resolution*.
  - The tab strip is scrolled to the current tab and fades at both edges.
- **At 320 px** (frame 24; interior 320 × 440):
  - the 19 px title and the chips wrap;
  - gutters narrow to 12 px;
  - the customer-update row keeps *Record* as a 44 px target;
  - both sticky actions stay visible at 48 px.

## Shared components and states

Hosted by `application-shell`. Uses `tabs`, `fields`, `validation`, `status`, `buttons`, `drawer` and `mobile-form`.

- **Drawn states:** New and Urgent with a commitment due soon; possible recurrence; Waiting with a review due and a completed visit beside unfinished work; Active with a resolution proposed; a customer contact recorded before the review; unknown site and equipment; a validation error on a phone.
- **Also drawn:** the Triage & actions tab with its waiting-state rule, the 1024 × 768 record, phone Work & visits and Evidence & updates, and the 320 px record.
- **Not drawn:** loading; denied or revoked; read-only for non-managers; a closed record with retained history; a returned resolution; phone Resolution & review; the *Record outcome* and *Cancel request* dialogs.

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96…18fa5f` (the Case workspace and Resolution & review views). Retained design reference.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `04-register-triage.png`, `07-request-overview.png`, `08-request-work-visits.png`, `09-request-evidence.png`, `10-request-resolution.png`, `12-phone-request.png` and `13-phone-triage.png`. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed composition, not an approved mockup. Frame 8 is superseded by r02.
- [Board images r02](../../../reference/ui/service-cases/native-refinement-r02/README.md): `08-request-work-visits.png` (corrected), `15-request-triage-actions.png`, `17-request-overview-1024.png`, `21-phone-work-visits.png`, `22-phone-evidence.png` and `24-narrow-request-320.png`. These are renders of canvas version 8. Proposed.
- **Missing:** a native record-page capture after the PR #283 shell integration.

## Behaviour, handovers and verification

- **Customer update:** the owner keeps the customer informed. Technicians and specialists record actions and evidence.
- **Work & visits** hands on to Work orders (SV-03) and Schedule (SV-04, PL-01). The request never creates or changes a booking.
- **Finance referral:** a Finance referral stays with Finance.
- **Closure** needs a successful customer contact recorded after the resolution review.
- **Existing contract:** the native record currently supports the P03 states and fields. Resolution review and the later stages wait for the proposed [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md) (D3). The first native increment builds the header, progress strip, Overview and triage form for the three existing states.
- **Guide:** the draft User Guide `guide.sv.02` describes the running page and is not rewritten for proposed behaviour.
- **Acceptance evidence is pending.** Compare captures of the board frames and the application at the same viewport and state, then verify:
  - keyboard order and focus into and out of the triage form;
  - Escape and focus return;
  - 200 % zoom and wrapping;
  - scroll ownership;
  - the phone states.
