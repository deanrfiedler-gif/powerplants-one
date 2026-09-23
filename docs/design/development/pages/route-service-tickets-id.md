# Service request detail — design reference

Stable entry: `route:/service/tickets/[id]`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Its presentation decisions are applied under Dean's delegation; it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets/{id}`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route is the SV-02 record. The proposed refinement gives it a record header, a progress strip and the record tabs that r02 placed alongside its register.

1. Confirm the record reference and customer/site context in this record workspace.
2. Open the request and review its timeline and commitments.
3. Separate customer statements from verified findings.
4. Link the correct authorised work and retain unresolved questions.

## Desktop

Follow the [SV-02 contract](scope-sv-02.md#desktop). The route-specific points are:

- The shell's breadcrumb ends with the request reference.
- Register the route in `src/shell/module-workspaces.ts` as `padded` with `navigation: "workspace"` (D6, applied under delegation).
- The existing *← Service requests* link stays as the back link in the record header.
- The record keeps its heading, because it carries name, reference, stage, priority and revision. The existing-modules rule keeps record headings.

## Mobile

Follow the [SV-02 contract](scope-sv-02.md#mobile): sticky record actions above the bottom navigation, and a full-screen triage form with an error summary.

## Shared components and states

See the [SV-02 contract](scope-sv-02.md#shared-components-and-states).

## Visual references

- [PPO-Service-Cases-and-Triage-Workspace-r02.html](../../../reference/ui/service-cases/PPO-Service-Cases-and-Triage-Workspace-r02.html). Retained design reference.
- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `07-request-overview.png`, `08-request-work-visits.png`, `09-request-evidence.png`, `10-request-resolution.png`, `12-phone-request.png` and `13-phone-triage.png`. These are renders of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed.
- **Missing:** a current native capture of this route.

## Behaviour, handovers and verification

The draft User Guide `guide.page.service.tickets.id` describes the running page and remains Draft. Source presence, visual review, functional testing, owner acceptance and deployment stay separate. Acceptance evidence is pending; see the [proposed refinement record](../../../decisions/service-requests-native-refinement.md).
