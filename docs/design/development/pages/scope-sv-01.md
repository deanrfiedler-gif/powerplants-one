# Service desk and triage worklist — design reference

Stable entry: `scope:SV-01`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Dean accepted its recommendations (D1–D8) that day. His visual review is still to be recorded, so it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Show service requests by urgency, site, equipment, owner, impact, waiting reason and stale follow-up. Keep request state distinct from work-order and appointment state, and never let urgency bypass required work authority (r06 SV-01).

1. Find a request, or log a new one without duplicating an existing request.
2. See what needs attention first: urgent requests, overdue commitments, waiting requests and resolutions awaiting review.
3. Move a request to its next stage through the required workflow form, or open it.

The composition below comes from the [proposed native refinement](../../../decisions/service-requests-native-refinement.md). Dean accepted D1–D8 on 23 September 2026. The later stages wait for the proposed lifecycle extension, [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md) (D3). Nothing here is an accepted baseline.

## Desktop

Proposed module interior of 1364 × 896 at a 1440 × 960 window (board frames 1–6 and 14; images in [board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md) and [r02](../../../reference/ui/service-cases/native-refinement-r02/README.md)). The shell is a separate module and is not drawn.

- **Host (not drawn).** The shell supplies the 76 px rail and the 64 px header, with breadcrumb *Service / Service requests*, global search and quick add. Registered as a `full-bleed` module workspace with `navigation: "workspace"`, so the shell hides its Service tab row (D6). The module draws no masthead or title band. A visually hidden `h1` reads *Service requests*; the page description belongs in the page-information panel.
- **Toolbar** (60 px, white, full bleed), shared by Board and List:
  - Board/List segmented control.
  - *Open requests* scope menu: Open, Include closed and Closed only (D5).
  - Search, up to 340 px: *Search requests, customers, sites or callers*.
  - *Filters*: owner, priority, customer, site, equipment and category.
  - *Columns* (List only), *Saved views* as a quiet button, then the only primary action, *Log a request*.
- **Queue row** (52 px): toggles for All open, New to triage, Urgent, Waiting or needs information, Overdue commitments and Resolution review, each with a count badge.
  - Counts reflect the current scope and the non-queue filters (r02 rule).
  - On the right: the visible count (*5 requests*) and *Sort: Urgency* (urgent first, then overdue commitments, then priority, received time and reference).
- **Board.**
  - **Lanes:** New, Needs information, Triaged, Active, Waiting and Resolved; Closed is added only by the scope filter. Each lane uses a `#eceff3` surface with 8 px radius and 12 px padding, a 15 px/600 heading, a count badge and a one-line purpose.
  - **Empty lanes** collapse to 56 px, with a vertical label and an expand control. A collapsed lane stays a drop target and expands on drag-over (D2).
  - **Scrolling:** one scroll surface and no per-lane scrollers (r02 rule).
- **Card** (`sales-board` variant):
  - **Top row:** reference and priority. Urgent shows as a danger chip with a flag, High as a warning chip, and Normal as plain text.
  - **Body:** a 15 px/600 title that links to the record, then customer and site lines.
  - **Next-action block:** title, action owner, due time and relative time. An overdue action uses the danger tone and a warning icon, and is not repeated as a chip.
  - **Attention chips** wrap and are never truncated.
  - **Footer:** the accountable owner, plus labelled 32 px *Preview* and *Move* buttons.
  - **Selected state:** 2 px `#416d33` border.
- **Native increment** (frame 14, D3):
  - **Lanes:** the board shows only the three states the application moves a request through today: New, Needs information and Triaged.
  - **Queues:** All open, New to triage, Urgent, Needs information and Overdue clarifications.
  - **Next-action block:** the recorded next action, marked *no due time* because the native field has none. Where an owned clarification exists, the block shows it instead, with its owner and due time.
  - **Attention chips:** the triage blocker count from the existing gate.
  - **Linked work:** a work order shows in its own native state (*authorised*).
  - **Later stages:** lanes, queues and columns that need data only [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md) provides appear once it is built. Nothing is shown as an empty placeholder.
- **List** (frames 2 and 3): the house register table (`sales-table` with the EN-06/EN-07 register rules).
  - **Scrolling:** the table meets both edges of the module and scrolls horizontally inside one scroller. The *Request* column is pinned on the left. Once scrolled, it casts an 8 px edge shadow; a right-edge shadow shows there are more columns. Frame 2 shows the table scrolled right past the triage columns; frame 3 shows scroll position zero.
  - **Headers:** 43 px, `#f4f5f7` fill, 13 px regular `#596779` sentence case, and 1 px column separators.
  - **Rows:** 62 px, 14 px text, and 8 px × 12 px cell padding. *Request* and *Next action* wrap. *Action due*, *Customer update* and *Linked work* use two fixed lines (time then relative time; reference then its own state). Other cells stay on one line.
  - **Unknown values** read *Not recorded* or *Not confirmed* in amber words. *None* reads in grey. No cell is left blank.
  - **Selected row:** `#edf6e9` fill and a 3 px navy inset marker on the sticky cell.
  - **Footer:** 52 px. It gives the count, the sort rule and the as-at time on the left, and *1–5 of 5* with previous and next buttons on the right.
  - **No selection checkboxes:** neither r02 nor P03 has a bulk command.
- **List columns** (3,364 px in total; the *Columns* control can hide any column except *Request*):

  | Column | Width | Content |
  |---|---|---|
  | Request | 300 | Title in 700 weight, linking to the record; reference below |
  | Customer | 190 | Organisation name |
  | Priority | 104 | Urgent as a danger chip with a flag; High as a warning chip; Normal and Low as text |
  | Stage | 176 | Neutral chip with a stage icon; Waiting adds its reason (*Waiting · parts*) |
  | Attention | 230 | The one most important attention chip, or *None* |
  | Next action | 290 | Earliest open action, wrapping to two lines |
  | Action owner | 150 | Avatar and name |
  | Action due | 176 | Time and relative time; overdue in the danger tone |
  | Customer update | 186 | Next update time and relative time; overdue in the danger tone |
  | Site | 180 | Site name, or *Not confirmed* |
  | Affected areas | 176 | First area and a *+n* count badge, or *Not recorded* |
  | Equipment | 170 | Equipment name, or *Not recorded* |
  | Linked work | 230 | Work-order reference and its own state, or *None* |
  | Response route | 170 | Route from triage, or *Awaiting triage* |
  | Request owner | 150 | Avatar and name |
  | Category | 196 | Category |
  | Received | 186 | Received time |
  | Channel | 104 | Phone, Email, Internal or Other |

  **Native increment columns.** Before ADR-0043, twelve of the eighteen columns have a native source. *Customer update*, *Affected areas*, *Response route* and *Category* stay hidden until a contract supplies them, because the native Ticket has no such fields. *Action owner* and *Action due* come from the owned clarification where there is one; otherwise the owner is the triage owner and the due time reads *No due time*. *Attention* shows triage blockers and overdue clarifications.
- **Preview panel** (frame 3, `drawer`): 420 px, docked beside the table below the toolbar, with a left-only shadow.
  - **Header:** reference, a close control, a 20 px title, customer and site, and the stage and priority chips.
  - **Attention notice:** stated in words, for example *Two commitments are overdue*.
  - **Sections:** Next action, Customer commitment (with *Record customer update*), Why information is needed, and Context.
  - **Footer:** full-width *Open request* (primary) and *Move request*.
- **Triage from a drag or from Move:** a right-docked 560 px form over a 40 % navy scrim, detailed in the SV-02 contract. The board does not change while the form is open; cancelling keeps the request in its lane.
- **Log a request** (frame 5, route `/service/tickets/new`): a page with the form on the left and a 420 px *Check before creating* panel on the right.
  - **Form groups:** Caller and customer; Issue (summary, and what the customer reported, kept separate from any diagnosis); Location and impact (site, equipment, affected areas as checkboxes, category and reported priority). Impact, backup and owner can be added now or at triage.
  - **Duplicate check:** as customer, site, equipment and areas are entered, matching open requests appear with the reasons they match. The action *Add as a customer statement on TKT-000201* records the call on the open request without changing its priority, owner or stage. Earlier requests on the same equipment are listed with their outcome.
  - **The check is a prompt, not a block:** *Create request* stays available.
- **Register states** (frame 6), each shown in the table area below the toolbar:
  - loading, with skeleton rows and a status line;
  - no open requests, with *Log a request*;
  - no matches, with removable filter chips, the count of hidden requests and *Clear filters*;
  - could not load, with no stale rows and *Try again*;
  - read only, with Move disabled and the reason stated;
  - changed while moving, where the stale revision is refused, entries are kept and the request stays in its lane.
- **Tokens:** globals/r22 navy `#242a37`, green `#62bb46` and the status surface/border pairs; Roboto; 6 px control radius, 5 px status chips and 7–8 px card radius. A warning icon marks something someone must act on; a tick marks only a completed positive state.
- **At 1024 × 768** (frame 16; interior 948 × 704). Below a proposed 1200 px:
  - *Saved views* move into the scope menu;
  - *Columns* and *Sort* become 36 px icon buttons with accessible names;
  - the search field narrows to *Search requests*;
  - the queue uses the short labels All open, New, Urgent, Waiting, Overdue and Review;
  - the preview panel narrows to 380 px and overlays the table from the right, with a deeper shadow, instead of docking beside it;
  - the table keeps its full width and horizontal scroll, and the footer drops its sort description.

  Below 1024 px the board switches to List (r02 rule).

## Mobile

Proposed module interior of 390 × 716 at a 390 × 844 window (board frame 11).

- **Host (not drawn):** the shell's 64 px header and 64 px bottom navigation. The Service tab row is hidden for a registered module workspace (D6).
- **Controls:**
  - Search is 44 px high with 16 px text.
  - *Filters* opens a sheet; *Log a request* is the primary button beside it.
  - Queue chips (36 px) scroll horizontally.
- **Cards** stack: reference and stage, priority, a 17 px title, customer and site, the next-action block and attention chips.
- **Presentation:** List is the only presentation below 1024 px, and the desktop Board/List preference is retained.
- **Filters sheet** (frame 19): full screen at 390 × 844, with a 44 px close control and *Clear all* in the header.
  - **Fields:** Scope first (Open requests, or Include closed, D5), then priority checkboxes, and owner, customer, site, equipment and category selects of 48 px.
  - **Footer:** a sticky *Show n requests*, where n is the live count.
- **No matches** (frame 20): the active filters appear as removable 36 px chips below the toolbar. The empty state states how many open requests are hidden and offers *Clear filters*. The other register states use frame 6's content in this layout.
- **Triage** opens full screen (see SV-02).
- **At 320 px** (frame 23; interior 320 × 440 at a 320 × 568 window):
  - *Filters* becomes a 44 px icon button, so *Log a request* keeps its label;
  - the queue chips scroll and the side gutters narrow to 12 px;
  - card text wraps, and the next-action block keeps its owner and due time on separate lines.

## Shared components and states

Hosted by `application-shell`. Uses `sales-board`, `sales-table`, `drawer`, `fields`, `validation`, `status`, `buttons` and `mobile-form`. Status chips always carry words; tone is not the business state.

- **Drawn states:** normal register, collapsed empty lanes, overdue commitments, waiting for parts, resolution proposed, missing site, unknown table values, horizontal scroll at the start and scrolled, selected row with preview, possible duplicate at capture, loading, no open requests, no matches, could not load, read only, and changed while moving.
- **Also drawn:** the native three-state board, the compact 1024 × 768 register, the phone filters sheet, phone no matches and the 320 px register.
- **Not drawn:** denied access (the register lists only permitted records, so there is no per-row denied state); phone versions of the remaining register states, which follow frame 6's content in frame 20's layout.

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96…18fa5f`. Retained design reference, delivered for review.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `01-register-board.png`, `02-register-list-scrolled.png`, `03-register-list-preview.png`, `04-register-triage.png`, `05-log-request.png`, `06-register-states.png` and `11-phone-register.png`, each 1364 × 896 except the phone image, which is 390 × 716. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed composition, not an approved mockup.
- [Board images r02](../../../reference/ui/service-cases/native-refinement-r02/README.md): `14-native-register-board.png` (1364 × 896), `16-register-list-1024.png` (948 × 704), `19-phone-filters.png` (390 × 844), `20-phone-no-matches.png` (390 × 716) and `23-narrow-register-320.png` (320 × 440). These are renders of canvas version 8. Proposed.
- **Missing:** a native capture of this route after the PR #283 shell integration.

## Gaps against scope

- r06 lists equipment as a register dimension. r02 had no equipment filter; the refinement adds *Equipment* to *Filters* and an *Equipment* column.
- The lane and the *Stage* column always show the request stage. A linked work order shows as a separate neutral chip on the card and in its own *Linked work* column, with its own state (for example `SYN-PPO-WO-000503 · In progress`). It never replaces the request stage.
- Relative times come only from recorded commitments (next customer update, action due, waiting review). No service level is invented.

## Behaviour, handovers and verification

- **Existing contract:** the application moves a request only through New, NeedsInformation and Triaged. The first native increment builds this register for those three states (D3, accepted). Active, Waiting, Resolved and Closed wait for the proposed [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md); the database already holds those values.
- **Handovers:** *Open request* hands on to SV-02. *Log a request* uses the existing intake route `/service/tickets/new`.
- **Guide:** the draft User Guide `guide.sv.01` describes the running page and is not rewritten for proposed behaviour.
- **Separate statuses:** source presence, visual review, functional testing, owner acceptance and deployment stay separate.
- **Acceptance evidence is pending.** After a native build:
  - capture the board frames and the application at the same viewport and fixture state;
  - verify keyboard order, the Move alternative to dragging, focus return from the preview and the form, 200 % zoom, wrapping, scroll ownership and phone states.
