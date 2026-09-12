# Field technicians — approved design

**Decision date:** 10 September 2026

**Owner:** Dean Fiedler

**Design status:** Approved r04 baseline (10 September 2026), superseded for new work by the accepted successor r05 (12 September 2026, below); application verification and publication are recorded separately in the [handover](../delivery/field-technicians-handover.md).

Dean reviewed the refined Field Technicians container against the supplied Leads and Projects Gantt references, requested a final audit, and then instructed: “I like that version. You can lock that design into the Powerplants One app.” This adopts r04 as the Service field-operations presentation baseline. Further visual changes should preserve this baseline unless Dean requests a change.

## Preserved source

[Accepted standalone HTML r04](../reference/powerplants-one-field-technicians-r04.html) is retained byte-for-byte, including its embedded font licence. SHA-256 `b4d15630d89f0a74b795b9b2af6b83d9c4874d0e31d7e503f93d386a6555a704`; 429,584 bytes. The source manifest records the same checksum. The original has seven illustrative visits, four fictional technicians and memory-only field notes; these remain design examples.

The accepted source supersedes r01–r03 for this container. It follows the supplied `PPO-Leads-Desktop-Container-r01(1).html` and `ppo-projects-gantt-content-r10(1).html` visual references. It does not replace the separately approved application shell or adopt future commercial vendor features as delivered functionality.

## Accepted presentation

- The container owns **24 px outer padding on desktop and 16 px on phone**, inside the existing shell.
- Roboto, navy `#242a37`, green `#62bb46`, grey workspace `#f5f6f8`, white bordered surfaces, restrained status colours and a green selected-tab underline.
- Compact heading/counts, Visits / Technicians / Needs preparation views, independent search and filter state, six-column desktop tables and phone record cards.
- A right-side visit drawer with Overview / Job pack / Asset history / Field notes, keyboard tab navigation, native modal behaviour, deliberate backdrop dismissal and Close details.
- Wrapped secondary text and status labels, visible keyboard focus, and 44 px phone controls. The module does not duplicate the shared shell logo or navigation.

## Application mapping

The new `/service/technicians` route is a read-oriented entry view for existing SC-07/SC-08 records and SC-09/SC-10 field workflows. The original SVC parent IDs, SR-04/07/08/09, TR transitions and PP-01 acceptance definitions remain unchanged. This decision does not close their outstanding operational acceptance.

| Accepted concept | Existing application source and adaptation |
|---|---|
| Daily visits and team | Permission-filtered `GET /api/v1/schedule`; selected local day and optional site, with explicit Australia/Brisbane display time. Defaults to the current day. |
| Visits / equipment column | Visit scope, site, appointment and work-order references in the summary. Exact scope equipment is retrieved in the Asset history drawer; no extra per-row asset reads. |
| On-site metric / availability | The app shows actual `InProgress` **visit** counts and resource status. It does not infer location, technician presence, free capacity or valid competency from bookings or record status. Skill evidence retains its recorded status; scheduling still checks validity. |
| Preparation | Persisted dispatch hold, scope-review flag, pack requirement and current active crew. Completed, submitted-for-review and cancelled visits are excluded from preparation counts. No preparation flags does not mean dispatch is authorised. |
| Job pack | Appointment readiness and pack requirement, with links to controlled job packs and full visit readiness. No synthetic issued document or acknowledgement is created. |
| Asset history | Work-order scope matching the appointment’s exact revision ID and version; permission-checked equipment links. An unavailable or changed scope does not substitute the latest scope. |
| Field notes and handover | Links to My Jobs for durable field capture/submission and to existing owned follow-up records. The standalone memory-only note form is not installed as a second capture system. |
| Counts / recovery | Only a successful complete schedule response supplies rows and counts. Loading, failure, invalid dates and incomplete reads show unavailable values. Refresh closes details; identity changes remount the business view. |

No new API, migration, permission, offline store, dependency, commercial platform integration or production workflow is introduced. Existing commands remain the authority for assignment, dispatch, pack issue, field submission, customer acceptance and billing. New endpoints or broader capability require a separate bounded change.

## Delivery boundary

The application adapter is prepared from main `27782e1c6343461ba70a3cd9841c3ca720c6f30d`, on `feature/service-field-technicians-r04`. It is reconciled onto main `143d42bbcb62d0027a8eb52b71eb7eccdc565b12` with both status entries preserved. Design approval is complete. Passing source/unit/build checks is distinct from rendered browser verification, merge, deployment and operational acceptance. The [handover](../delivery/field-technicians-handover.md) is the current delivery evidence.

## Successor r05 — accepted 12 September 2026

Dean accepted design r05 as the successor to r04 (“I accept.”, 12 September 2026) after a rendered audit of the approved r04 and a change record tracing every change to an audit finding. r04 remains byte-identical at `docs/reference/powerplants-one-field-technicians-r04.html`; the manifest records both hashes. The successor and its records live under `docs/reference/ui/field-technicians/`.

| | |
|---|---|
| Successor HTML | [`powerplants-one-field-technicians-r05.html`](../reference/ui/field-technicians/powerplants-one-field-technicians-r05.html) · 459,515 bytes · SHA-256 `72e80f59b9ad08860e0c00ab8e531c47af0cabc40b40210b8ed0142414761af9` |
| Rationale | [Rendered audit of r04](../reference/ui/field-technicians/powerplants-one-field-technicians-audit-r04.md) and the [r05 change record](../reference/ui/field-technicians/powerplants-one-field-technicians-r05-change-record.md) |
| Presentation preserved | 24/16 px padding, palette, three views, six-column tables and phone cards, right-side drawer with four tabs, keyboard tab navigation, native modal behaviour — unchanged from the list above |

What r05 adds to the presentation baseline: six route links from the drawer to the work order, appointment, job pack (with current issue revision), full readiness, equipment record and My Jobs — the traversal the application mapping above requires and the adapter had added without a design reference; visit status limited to appointment state with a separate readiness-and-dispatch column and filter; an owned next action (coordinator or technician, action, due) derived from record state; handover scoped to the visit with a separate technician day note; a *Now* column beside *Next visit*; time and zone taken from the schedule read; a date stepper, site selector and designed loading, failed, partial and empty-day states; and the token set shared with Job Pack r03.

Recorded with the acceptance:

- The shipped `/service/technicians` adapter's links and date/site controls are to be reconciled with r05's presentation at the next bounded integration change.
- The readiness filter values (dispatch cleared / held / acknowledgement due) present the P06 dispatch component and crew responses; confirm the schedule read exposes them before the adapter adopts the filter.
- The pack reference shown for a visit is derived from the work-order number in the fixture only; the application uses the pack record's own identity.
- The fixture technician “Alex Nguyen” is renamed Sam Okoro (`SYN-PPO-PER-000003`) so that the coordinator of the same name is not shown acknowledging his own pack. The synthetic appointment `SYN-PPO-APT-000242` now matches Job Pack r03.

The application mapping and delivery boundary above are unchanged.
