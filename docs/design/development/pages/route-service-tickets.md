# Service request register — design reference

Stable entry: `route:/service/tickets`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Its presentation decisions are applied under Dean's delegation; it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is the SV-01 register. Today it runs the bounded P03 intake list (`TicketList`): search, a status filter for New, NeedsInformation and Triaged, and *New service request*. The proposed refinement replaces that presentation with the SV-01 Board and List. It adds no state beyond the native contract until the SC-04 extension is authorised.

1. Find or capture the request without duplicating an existing request.
2. Review impact, missing context and overdue commitments.
3. Triage, or assign the next contact or assessment action.

## Desktop

Follow the [SV-01 contract](scope-sv-01.md#desktop). The route-specific points are:

- Remove the current `PageHeader` register band (eyebrow *SC-04 / Service intake* and the visible title). The breadcrumb carries identity, and the description moves to the page-information panel.
- Rename the existing *New service request* action *Log a request* and keep it as the only primary action.
- Present Board and List over one collection, following the flush-register rules: full bleed, one scroll owner, compact toolbar.
- Register the route in `src/shell/module-workspaces.ts` as `full-bleed` with `navigation: "workspace"` (D6, applied under delegation). The module interior is then 1364 × 896 at a 1440 × 960 window.

## Mobile

Follow the [SV-01 contract](scope-sv-01.md#mobile): List only, queue chips, a filter sheet, and a 44 px search field with 16 px text.

## Shared components and states

See the [SV-01 contract](scope-sv-01.md#shared-components-and-states). Keep the existing `ReadState` loading, error and retry behaviour and the `Observed` envelope notice until they are replaced by the shared read-state component.

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html). Retained design reference.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `01-register-board.png`, `02-register-list-scrolled.png`, `03-register-list-preview.png`, `06-register-states.png` and `11-phone-register.png`. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed.
- **Missing:** a current native capture of this route.

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.tickets` describes the running page and remains Draft. Source presence, visual review, functional testing, owner acceptance and deployment stay separate. Acceptance evidence is pending; see the [proposed refinement record](../../../decisions/service-requests-native-refinement.md).
