# Service desk and triage worklist — design reference

Stable entry: `scope:SV-01`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Its presentation decisions are applied under Dean's delegation; it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Show service requests by urgency, site, equipment, owner, impact, waiting reason and stale follow-up. Keep request state distinct from work-order and appointment state, and never let urgency bypass required work authority (r06 SV-01).

1. Find a request, or log a new one without duplicating an existing request.
2. See what needs attention first: urgent requests, overdue commitments, waiting requests and resolutions awaiting review.
3. Move a request to its next stage through the required workflow form, or open it.

The composition below comes from the [proposed native refinement](../../../decisions/service-requests-native-refinement.md). D1, D2, D5 and D6 are applied under Dean's delegation; D3 and D4 remain open. Nothing here is an accepted baseline.

## Desktop

Proposed module interior of 1364 × 896 at a 1440 × 960 window (board frames 1–4). The shell is a separate module and is not drawn.

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
- **List** (frames 2 and 3): the house register table (`sales-table` with the EN-06/EN-07 register rules).
  - **Scrolling:** the table meets both edges of the module and scrolls horizontally inside one scroller. The *Request* column is sticky on the left, with a 1 px boundary. Frame 2 shows scroll position zero, with *Action owner* partly visible.
  - **Headers:** 43 px, `#f4f5f7` fill, 13 px regular `#596779` sentence case, and 1 px column separators.
  - **Rows:** 62 px, 14 px text, and 8 px × 12 px cell padding. Only *Request* and *Next action* wrap; other cells stay on one line.
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
- **Preview panel** (frame 3, `drawer`): 420 px, docked beside the table below the toolbar, with a left-only shadow.
  - **Header:** reference, a close control, a 20 px title, customer and site, and the stage and priority chips.
  - **Attention notice:** stated in words, for example *Two commitments are overdue*.
  - **Sections:** Next action, Customer commitment (with *Record customer update*), Why information is needed, and Context.
  - **Footer:** full-width *Open request* (primary) and *Move request*.
- **Triage from a drag or from Move:** a right-docked 560 px form over a 40 % navy scrim, detailed in the SV-02 contract. The board does not change while the form is open; cancelling keeps the request in its lane.
- **Tokens:** globals/r22 navy `#242a37`, green `#62bb46` and the status surface/border pairs; Roboto; 6 px control radius, 5 px status chips and 7–8 px card radius. A warning icon marks something someone must act on; a tick marks only a completed positive state.
- **At 1024 × 768 (not drawn):** below 1024 px the board switches to List (r02 rule). At 1024 px the filter menus wrap to a second toolbar row rather than truncating.

## Mobile

Proposed module interior of 390 × 716 at a 390 × 844 window (board frame 7).

- **Host (not drawn):** the shell's 64 px header and 64 px bottom navigation. The Service tab row is hidden for a registered module workspace (D6).
- **Controls:**
  - Search is 44 px high with 16 px text.
  - *Filters* opens a sheet; *Log a request* is the primary button beside it.
  - Queue chips (36 px) scroll horizontally.
- **Cards** stack: reference and stage, priority, a 17 px title, customer and site, the next-action block and attention chips.
- **Presentation:** List is the only presentation below 1024 px, and the desktop Board/List preference is retained.
- **Triage** opens full screen (see SV-02).
- **At 320 px (not drawn):** chips and cards wrap without hiding the next action or an overdue state.

## Shared components and states

Hosted by `application-shell`. Uses `sales-board`, `sales-table`, `drawer`, `fields`, `validation`, `status`, `buttons` and `mobile-form`. Status chips always carry words; tone is not the business state.

- **Drawn states:** normal register, collapsed empty lanes, overdue commitments, waiting for parts, resolution proposed, missing site, unknown table values, horizontal scroll at position zero, selected row with preview.
- **Not drawn:**
  - loading;
  - filtered-empty (keep r02's empty panel, reworded to *No matching requests*);
  - denied;
  - read-only for non-managers (Move disabled, with the reason);
  - stale-revision refusal after a drag (r02 rule: the save is refused and entries are kept).

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96…18fa5f`. Retained design reference, delivered for review.
- Design board frames 1, 2, 3, 4 and 7, in the private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests". Proposed composition, not an approved mockup.
- **Missing:** there is no repository image of the proposed frames, and no native capture of this route after the PR #283 shell integration.

## Gaps against scope

- r06 lists equipment as a register dimension. r02 had no equipment filter; the refinement adds *Equipment* to *Filters* and an *Equipment* column.
- The lane and the *Stage* column always show the request stage. A linked work order shows as a separate neutral chip on the card and in its own *Linked work* column, with its own state (for example `SYN-PPO-WO-000503 · In progress`). It never replaces the request stage.
- Relative times come only from recorded commitments (next customer update, action due, waiting review). No service level is invented.

## Behaviour, handovers and verification

- **Existing contract:** the native P03 contract supports New, NeedsInformation and Triaged only. Active, Waiting, Resolved and Closed need the SC-04 extension contract (D3, open). A native increment before then can deliver this register for the existing three states.
- **Handovers:** *Open request* hands on to SV-02. *Log a request* uses the existing intake route `/service/tickets/new`.
- **Guide:** the draft User Guide `guide.sv.01` describes the running page and is not rewritten for proposed behaviour.
- **Separate statuses:** source presence, visual review, functional testing, owner acceptance and deployment stay separate.
- **Acceptance evidence is pending.** After a native build:
  - capture the board frames and the application at the same viewport and fixture state;
  - verify keyboard order, the Move alternative to dragging, focus return from the preview and the form, 200 % zoom, wrapping, scroll ownership and phone states.
