# Request detail and communication timeline — design reference

Stable entry: `scope:SV-02`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Its presentation decisions are applied under Dean's delegation; it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets` (register entry); record route `/service/tickets/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Hold one service request: reported symptoms, scope questions, notes, attachments, the triage decision, coverage uncertainty and linked work and visits (r06 SV-02).

1. Open the request and review its current stage, commitments and timeline.
2. Keep customer statements separate from verified findings.
3. Triage the request, link the correct authorised work and keep unresolved questions visible.
4. Review a proposed resolution against its evidence before it is accepted.

The composition below comes from the [proposed native refinement](../../../decisions/service-requests-native-refinement.md). D1, D2, D5 and D6 are applied under Dean's delegation; D3 and D4 remain open.

## Desktop

Proposed module interior of 1364 × 896 at a 1440 × 960 window (board frames 4 and 7–10; images in [board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md)). The shell is a separate module and is not drawn.

- **Host (not drawn).** The shell's breadcrumb reads *Service / Service requests / SYN-PPO-TKT-000201*. Registered as a `padded` module workspace with `navigation: "workspace"` (D6). The module draws no masthead and no selected-case dropdown: the record is the page.
- **Record header** (white, full bleed):
  - A back link to *Service requests*.
  - A 24 px/600 title with stage and priority chips beside it.
  - One meta line: reference, customer, site, received time and channel, and revision.
  - Actions on the right: *Request information* and *Update details* as secondary buttons, the stage's primary action (*Triage request* for New), and a *More* menu (link a related request, complete history, assistant).
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
  - *Closure readiness* checks: no open actions; no waiting dependency, work order or visit; customer contact after the review (still required); and site and equipment recorded (advisory; D4 is open).
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
- **Not drawn:** the *Triage & actions* tab body. r02's content and rules for it are retained.
- **At 1024 × 768 (not drawn):** the aside stacks below the main column, and header actions wrap onto a second row without hiding the primary action.

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
- **At 320 px (not drawn):** chips wrap and the action bar keeps both actions visible.

## Shared components and states

Hosted by `application-shell`. Uses `tabs`, `fields`, `validation`, `status`, `buttons`, `drawer` and `mobile-form`.

- **Drawn states:** New and Urgent with a commitment due soon; possible recurrence; Waiting with a review due and a completed visit beside unfinished work; Active with a resolution proposed; a customer contact recorded before the review; unknown site and equipment; a validation error on a phone.
- **Not drawn:** loading; denied or revoked; read-only for non-managers; a closed record with retained history; a returned resolution; phone versions of frames 8 and 9.

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96…18fa5f` (the Case workspace and Resolution & review views). Retained design reference.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `04-register-triage.png`, `07-request-overview.png`, `08-request-work-visits.png`, `09-request-evidence.png`, `10-request-resolution.png`, `12-phone-request.png` and `13-phone-triage.png`. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed composition, not an approved mockup.
- **Missing:** a native record-page capture after the PR #283 shell integration, and the 1024 × 768 and 320 px layouts.

## Behaviour, handovers and verification

- **Customer update:** the owner keeps the customer informed. Technicians and specialists record actions and evidence.
- **Work & visits** hands on to Work orders (SV-03) and Schedule (SV-04, PL-01). The request never creates or changes a booking.
- **Finance referral:** a Finance referral stays with Finance.
- **Closure** needs a successful customer contact recorded after the resolution review.
- **Existing contract:** the native record currently supports the P03 states and fields. Resolution review and the extended stages need the SC-04 extension contract (D3, open).
- **Guide:** the draft User Guide `guide.sv.02` describes the running page and is not rewritten for proposed behaviour.
- **Acceptance evidence is pending.** Compare captures of the board frames and the application at the same viewport and state, then verify:
  - keyboard order and focus into and out of the triage form;
  - Escape and focus return;
  - 200 % zoom and wrapping;
  - scroll ownership;
  - the phone states.
