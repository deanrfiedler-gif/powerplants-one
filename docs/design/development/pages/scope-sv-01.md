# Service desk and triage worklist — design reference

Stable entry: `scope:SV-01`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026 and is not accepted.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

Show service requests by urgency, site, equipment, owner, impact, waiting reason and stale follow-up. Keep request state distinct from work-order and appointment state, and never let urgency bypass required work authority (r06 SV-01).

1. Find a request, or log a new one without duplicating an existing request.
2. See what needs attention first: urgent requests, overdue commitments, waiting requests and resolutions awaiting review.
3. Move a request to its next stage through the required workflow form, or open it.

The composition below comes from the [proposed native refinement](../../../decisions/service-requests-native-refinement.md). Its open decisions D1–D5 still apply; nothing here is an accepted baseline.

## Desktop

Proposed at 1440 × 960 (board frames 1–3).

- **Shell.** Shared rail (76 px), header (64 px) with breadcrumb *Service / Service requests*, centred global search and quick add, and the live Service tab row (44 px). No module masthead or title band. A visually hidden `h1` reads *Service requests*; the page description belongs in the page-information panel.
- **Toolbar** (56 px, white, full bleed):
  - Board/List segmented control.
  - Search, 330 px: *Search requests, customers, sites or callers*.
  - Menu buttons: *Open requests* (Open, Include closed, Closed only), *Owner*, *Priority*, and one combined *Customer, site, category* menu.
  - *Saved views* as a quiet button, then the only primary action, *Log a request*.
- **Queue row** (48 px): chips for All open, New to triage, Urgent, Waiting or needs information, Overdue commitments and Resolution review.
  - Counts reflect the current scope and the non-queue filters (r02 rule).
  - The right-hand status text gives the visible count, the sort rule and the as-at time.
- **Board.**
  - **Lanes:** New, Needs information, Triaged, Active, Waiting and Resolved; Closed is added only by the scope filter. Each lane uses a `#eceff3` surface with 8 px radius and 12 px padding, a 15 px/600 heading, a count badge and a one-line purpose.
  - **Empty lanes** collapse to 56 px, with a vertical label and an expand control. A collapsed lane stays a drop target and expands on drag-over (open decision D2).
  - **Scrolling:** one scroll surface and no per-lane scrollers (r02 rule).
- **Card** (`sales-board` variant):
  - **Top row:** reference and priority. Urgent shows as a danger chip with a flag, High as a warning chip, and Normal as plain text.
  - **Body:** a 15 px/600 title that links to the record, then customer and site lines.
  - **Next-action block:** title, action owner, due time and relative time. An overdue action uses the danger tone and a warning icon, and is not repeated as a chip.
  - **Attention chips** wrap and are never truncated.
  - **Footer:** the accountable owner, plus labelled 32 px *Preview* and *Move* buttons.
  - **Selected state:** 2 px `#416d33` border.
- **List** (`sales-table`): a flush table with the columns Request and customer, Stage, Priority, Owner, Customer update and Next action.
  - Selecting a row opens a 400 px right-side preview panel (`drawer`) with a left-only shadow.
  - The panel shows an attention banner, the next action, why it is needed, the reported facts and the customer commitment.
  - Its footer has *Move request* and *Open request*.
- **Triage from a drag or from Move:** a right-docked 560 px form over a 40 % navy scrim, detailed in the SV-02 contract. The board does not change while the form is open; cancelling keeps the request in its lane.
- **Tokens:** globals/r22 navy `#242a37`, green `#62bb46` and the status surface/border pairs; Roboto; 6 px control radius and 7–8 px card radius.
- **At 1024 × 768 (not drawn):** below 1024 px the board switches to List (r02 rule). At 1024 px the filter menus wrap to a second toolbar row rather than truncating.

## Mobile

Proposed at 390 × 844 (board frame 6).

- **Shell:** header (64 px), scrolling Service tab row (48 px) and bottom navigation (64 px).
- **Controls:**
  - Search is 44 px high with 16 px text.
  - *Filters* opens a sheet; *Log a request* is the primary button beside it.
  - Queue chips (36 px) scroll horizontally.
- **Cards** stack: reference and stage, priority, a 17 px title, customer and site, the next-action block and attention chips.
- **Presentation:** List is the only presentation below 1024 px, and the desktop Board/List preference is retained.
- **Triage** opens full screen (see SV-02).
- **At 320 px (not drawn):** chips and cards wrap without hiding the next action or an overdue state.

## Shared components and states

Uses `application-shell`, `sales-board`, `sales-table`, `drawer`, `fields`, `validation`, `status`, `buttons` and `mobile-form`. Status chips always carry words; tone is not the business state.

- **Drawn states:** normal register, collapsed empty lanes, overdue commitments, waiting for parts, resolution proposed, missing site, selected row with preview.
- **Not drawn:**
  - loading;
  - filtered-empty (keep r02's empty panel, reworded to *No matching requests*);
  - denied;
  - read-only for non-managers (Move disabled, with the reason);
  - stale-revision refusal after a drag (r02 rule: the save is refused and entries are kept).

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html), SHA-256 `23e92f96…18fa5f`. Retained design reference, delivered for review.
- Design board frames 1, 2, 3 and 6, in the private claude.ai design canvas "Page Refinement Audit", page "SV-01/02 Service requests". Proposed composition, not an approved mockup.
- **Missing:** there is no repository image of the proposed frames, and no native capture of this route after the PR #283 shell integration.

## Gaps against scope

- r06 lists equipment as a register dimension. Neither r02 nor the board has an equipment filter. Add *Equipment* to the combined filter menu before native build.
- The lane always shows the request stage. A linked work order shows as a separate neutral chip (for example `SYN-PPO-WO-000503`) and never replaces it.
- Relative times come only from recorded commitments (next customer update, action due, waiting review). No service level is invented.

## Behaviour, handovers and verification

- **Existing contract:** the native P03 contract supports New, NeedsInformation and Triaged only. Active, Waiting, Resolved and Closed need the SC-04 extension contract (open decision D3). A native increment before then can deliver this register for the existing three states.
- **Handovers:** *Open request* hands on to SV-02. *Log a request* uses the existing intake route `/service/tickets/new`.
- **Guide:** the draft User Guide `guide.sv.01` describes the running page and is not rewritten for proposed behaviour.
- **Separate statuses:** source presence, visual review, functional testing, owner acceptance and deployment stay separate.
- **Acceptance evidence is pending.** After a native build:
  - capture the board frames and the application at the same viewport and fixture state;
  - verify keyboard order, the Move alternative to dragging, focus return from the preview and the form, 200 % zoom, wrapping, scroll ownership and phone states.
