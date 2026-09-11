# Field technicians — approved design

**Decision date:** 10 September 2026

**Owner:** Dean Fiedler

**Design status:** Approved r04 baseline; application verification and publication are recorded separately in the [handover](../delivery/field-technicians-handover.md).

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
