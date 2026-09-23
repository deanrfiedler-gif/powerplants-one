# Create service request — design reference

Stable entry: `route:/service/tickets/new`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Its presentation decisions are applied under Dean's delegation; it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route captures a new service request during a call (SV-01 task 1). Today it runs the P03 `TicketCreate` form, *Record a service request*, with company context, received channel, known requester, known site, equipment if identified, priority and the triage owner. The proposed refinement keeps those fields and adds a duplicate check beside the form.

1. Search for an existing request for the same customer, site, equipment or area before creating another.
2. Record what the caller reported, keeping observations separate from any diagnosis, with unknown values stated.
3. Either create the request, or add the call as a customer statement on the matching open request.

## Desktop

Proposed module interior of 1364 × 896 at a 1440 × 960 window (board frame 5). The shell is a separate module and is not drawn. Detail is in the [SV-01 contract](scope-sv-01.md#desktop).

- **Header:** a back link to *Service requests*, the title *Log a service request*, and a line stating that the Service Manager confirms the response and assignment at triage.
- **Form:** a white panel with three groups (Caller and customer, Issue, Location and impact) and a sticky footer with the required-field note, *Cancel* and *Create request*, the only primary action.
- **Check before creating:** a 420 px panel.
  - **Matches:** each matching open request with its stage, priority, age, owner and the reasons it matches (same equipment, same site, overlapping area).
  - **Action:** *Add as a customer statement on …*, followed by what that does and does not change.
  - **History:** earlier requests on the same equipment, with their outcome.
  - **Note:** below the panel, the check is stated to be a prompt, not a block.
- **At 1024 × 768 (not drawn):** the check panel moves above the form's footer rather than disappearing.

## Mobile

Not drawn. Requirement: the form stacks in one column with 16 px inputs. The duplicate check appears as a notice above *Create request* once a match exists, and opens the matches in a sheet.

## Shared components and states

Uses `fields`, `lookup` (customer, site and equipment), `validation`, `status` and `buttons`. Drawn state: one strong match and one earlier request on the same equipment. Not drawn: no matches, several partial matches, and a lookup failure. A failed duplicate check must say so and still allow creation.

## Visual references

- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `05-log-request.png` (1364 × 896). This is a render of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed.
- **Missing:** a phone layout and a current native capture of this route.

## Behaviour, handovers and verification

- **Existing command:** creating uses the existing P03 intake command.
- **Adding to an existing request:** records the call as evidence with the *Reported symptom* basis on that request (assumed r02 model; see the [proposed refinement record](../../../decisions/service-requests-native-refinement.md)). It never changes that request's priority, owner or stage.
- **Guide:** the draft User Guide `guide.page.service.tickets.new` describes the running page and remains Draft.
- **Separate statuses:** source presence, visual review, functional testing, owner acceptance and deployment stay separate.
