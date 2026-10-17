# Create service request — design reference

Stable entry: `route:/service/tickets/new`. Owner: Dean Fiedler. Status: **Draft for visual review**. A proposed native refinement was recorded on 23 September 2026. Dean accepted its recommendations (D1–D8) that day. His visual review is still to be recorded, so it is not an accepted baseline.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/tickets/new`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Purpose and task

This route captures a new service request during a call (SV-01 task 1). Today it runs the P03 `TicketCreate` form, *Record a service request*, with company context, received channel, known requester, known site, equipment if identified, priority and the triage owner. The proposed refinement keeps those fields and adds a duplicate check beside the form.

1. Search for an existing request for the same customer, site, equipment or area before creating another.
2. Record what the caller reported, keeping observations separate from any diagnosis, with unknown values stated.
3. Either create the request, or add the call as a customer statement on the matching open request.

## Desktop

Accepted design: capture 04 in [design r01](../../../reference/ui/service/service-requests-design-r01/README.md), from the [Service requests design decision](../../../decisions/service-requests-figma-design.md) of 17 October 2026. A page (Q1) with the form in three groups (Caller and customer, Issue, Location and impact) and a “Check before creating” panel. When an open request matches the customer, site and equipment, it offers “Add as customer statement” (23 September D8). The check is a prompt, not a block; Create request stays available.

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

Accepted design: no phone frame of Log a request is drawn; the desktop groups stack in one column.

Proposed module interior of 390 × 716 (board frame 18).

- **Form:** stacks in one column, with 48 px fields and 16 px text. The frame shows it scrolled to *Location and impact*, where the equipment choice finds the match.
- **Duplicate check:** once a match exists, a sticky notice sits above *Create request* and names the matching request, its stage and priority. *Review match* opens the matches in a sheet. The notice says the check is a prompt, not a block.
- **Footer:** sticky *Cancel* and *Create request*.
- **Not drawn:** the matches sheet itself, and the 320 px form.

## Shared components and states

Uses `fields`, `lookup` (customer, site and equipment), `validation`, `status` and `buttons`. Drawn state: one strong match and one earlier request on the same equipment. Not drawn: no matches, several partial matches, and a lookup failure. A failed duplicate check must say so and still allow creation.

## Visual references

Accepted Figma design: [Service requests design r01 captures](../../../reference/ui/service/service-requests-design-r01/README.md) (thirteen icon-free PNGs; design compositions, not application captures) and its [decision](../../../decisions/service-requests-figma-design.md). Images of the phone Filters sheet, desktop register states, Board drag and Move, and hover states are still missing.

- [Board images r01](../../../reference/ui/service-cases/native-refinement-r01/README.md): `05-log-request.png` (1364 × 896). This is a render of the private claude.ai design canvas "Page Refinement Audit", version 7. Proposed.
- [Board images r02](../../../reference/ui/service-cases/native-refinement-r02/README.md): `18-phone-log-request.png` (390 × 716), a render of canvas version 8. Proposed.
- **Missing:** the 1024 × 768 layout and a current native capture of this route.

## Behaviour, handovers and verification

- **Existing command:** creating uses the existing P03 intake command.
- **Adding to an existing request:** records the call as evidence with the *Reported symptom* basis on that request (D8, accepted; see the [refinement record](../../../decisions/service-requests-native-refinement.md)). It never changes that request's priority, owner or stage.
- **Guide:** the draft User Guide `guide.page.service.tickets.new` describes the running page and remains Draft.
- **Separate statuses:** source presence, visual review, functional testing, owner acceptance and deployment stay separate.


## Native Won receiving (LC-16)

Keep this existing scope and page type. Incoming handover: exact accepted Won Sales event; outgoing: independently created native Project or Service work order and a separately reviewed typed binding. The Deal reads native receiving state and the retained Activity separately. It does not infer delivery completion from acceptance, a link or an Authorised work order.

Reuse shared Button, Field, SelectField, ErrorNotice, recoverable command journal, existing native lookup controls and record guard. Preserve the native Project Gantt and Service scope/readiness layouts. Proposed addition: a scoped Sales-context panel, explicit fixed-version comparison and create-and-return actions. Existing native form buttons remain documented legacy controls; no new theme or navigation system is introduced.

Desktop and phone: wrap reported scope and references; show original Sales revision beside current native state, owner and version. Keep Review, link reason, discard and original-recovery actions visible in normal document flow. A refresh must not silently substitute a reviewed comparison. Denied comparison reads remove its protected content. Unknown Sales site requires an explicit native site choice and does not rewrite the accepted source. New Service intake and work-order creation save independently before link review; existing native scope and authorisation controls remain.

Exact new-state mockup/HTML images are missing. Retained module references above are baseline context. Implementation captures and synthetic checks are recorded in `docs/testing/evidence/won-delivery-continuity/README.md`; they do not grant paired visual, keyboard/200% zoom, physical-device or owner acceptance. Review fingerprints remain unchanged.

## Leave protection (F42) — 16 October 2026

Typing into this form and then following the rail (phone bar), a header link, a header search result or browser Back asks before the entries are discarded. Cancel keeps the page and the typed values; OK leaves. A clean form leaves without asking, and a saved record opens without a prompt. The form registers the shared `useUnsavedChanges` guard through `useCreateDraft` (state `create-leave-guard` in [fields](../components/fields.md)). Fixture: `tests/browser/navigation-safety.spec.ts` (F42) at desktop and phone widths. Source: live-app UX audit finding F42, principle 11. No layout, control or copy change; owner review of the native prompt wording is pending.

Editing an existing request keeps its previous behaviour. A Sales handover creation keeps its recoverable command once that command blocks the form.
