# Service request register — design reference

Stable entry: `route:/service/tickets`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Dean accepted its recommendations (D1–D8) that day. His visual review is still to be recorded, so it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is the SV-01 register. Build plan increment I2 replaced the bounded P03 intake list (`TicketList`) with the native SV-01 Board and List (`TicketRegister`) for New, NeedsInformation and Triaged. The later stages wait for the proposed [ADR-0043](../../../decisions/ADR-0043-service-request-lifecycle.md) (D3).

1. Find or capture the request without duplicating an existing request.
2. Review impact, missing context and overdue commitments.
3. Triage, or assign the next contact or assessment action.

## Desktop

Accepted design: the [Service requests design decision](../../../decisions/service-requests-figma-design.md) of 17 October 2026, with captures 01–03 (desktop 1440 × 900) and 08 (tablet 1024) in [design r01](../../../reference/ui/service/service-requests-design-r01/README.md).

- **Register:** the Work orders grid, with queues in the side menu (D1): All open and My requests; Triage: New to triage, Urgent, Needs information and Overdue clarifications; After triage: No work order yet and Work order linked. Row checkboxes carry Open in sequence and Export list (D2, replacing 23 September D7).
- **Columns:** Request, Summary, Stage, Priority, Attention, Next action, Action due, Action owner, Customer, Site, Equipment, Linked work, Request owner, Received and Channel. Urgent and High are Tags; Normal and Low are text; unknowns read “Not confirmed” or “Not recorded” in amber.
- **Board:** one click away in the toolbar, with three lanes for the built stages (New, Needs information, Triaged).
- **Snapshot:** a row opens the large snapshot (D3), with Open request and Complete triage.
- Nothing new is built. Later stages wait for ADR-0043 (D6).

Follow the [SV-01 contract](scope-sv-01.md#desktop). The route-specific points are:

- The `PageHeader` register band is removed. A visually hidden `h1` reads *Service requests*, the breadcrumb carries identity, and the description is published to the page-information panel.
- *Log a request* replaces *New service request* and is the only primary action.
- Board and List present one collection under the flush-register rules: full bleed, one scroll owner (`.sr-scroll`) and a compact toolbar.
- The route is registered in `src/shell/module-workspaces.ts` as `full-bleed` with `navigation: "workspace"` (D6, accepted), with the `sv01-native-r01` integration entry in `docs/standards/ui-baselines.json`. The module interior is 1364 × 896 at a 1440 × 960 window and 948 × 704 at 1024 × 768 (frame 16).
- The native increment presents the three existing states (frame 14). The list shows the fourteen columns with a native source (see the SV-01 contract).

## Mobile

Accepted design: captures 09, 10 and 13 in [design r01](../../../reference/ui/service/service-requests-design-r01/README.md). List rows with the summary, received time, reference, customer and a priority Tag, then the attention line and the stage. Five states: loading, no matches with removable filter chips, could not load, view only and save refused.

Follow the [SV-01 contract](scope-sv-01.md#mobile): List only, queue chips, a full-screen filter sheet (frame 19), a no-matches state (frame 20), a 44 px search field with 16 px text, and the 320 px layout (frame 23).

## Shared components and states

See the [SV-01 contract](scope-sv-01.md#shared-components-and-states). I2 draws frame 6's loading (skeleton rows), no open requests, no matches, could not load and read-only states in the register area. A denied read still uses the shared `ReadState`. The Move dialog reuses the record page's `TriageActions` form, so changed-while-moving refusals come from the existing command and version check.

## Visual references

Accepted Figma design: [Service requests design r01 captures](../../../reference/ui/service/service-requests-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/service-requests-figma-design.md). Images of the phone Filters sheet, desktop register states, Board drag and Move, and hover states are still missing.

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html). Retained design reference.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `01-register-board.png`, `02-register-list-scrolled.png`, `03-register-list-preview.png`, `06-register-states.png` and `11-phone-register.png`. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed.
- [Board images r02](../../../reference/ui/service-cases/native-refinement-r02/README.md): `14-native-register-board.png`, `16-register-list-1024.png`, `19-phone-filters.png`, `20-phone-no-matches.png` and `23-narrow-register-320.png`. Renders of canvas version 8. Proposed.
- **Missing:** a retained native capture of this route. I2's browser spec writes captures to its CI evidence only; paired reference and application captures are increment I5.

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.tickets` was updated for the I2 register and remains Draft. Source presence, visual review, functional testing, owner acceptance and deployment stay separate.

- **Functional proof (I2):** `tests/browser/service-requests.spec.ts`:
  - board lanes and queues;
  - a keyboard Move that completes triage through the existing form, with focus following the card;
  - the fourteen list columns and the kept column choice;
  - preview docked at 1440 px and overlaid at 1024 px, with focus return;
  - read-only and could-not-load states;
  - phone cards, the filters sheet, no matches, and 320 px.

  The database and HTTP suites prove the read-model additions.
- **Native adaptations** are listed in the [build plan](../../../delivery/service-requests-integration-build-plan.md#i2-delivered-adaptations). They are proposed for Dean's visual and device review.
- **Acceptance evidence is pending;** see the [proposed refinement record](../../../decisions/service-requests-native-refinement.md).
