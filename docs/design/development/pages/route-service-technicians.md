# Field technicians — design reference

Stable entry: `route:/service/technicians`. Owner: Dean Fiedler. Status: **Draft for visual review**.
Source baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Application destination: `/service/technicians`.
This is an editable working specification. Existing accepted page baselines take precedence over these proposed common-layout rules. A blank review record is not approval.

## Native workflow

Page type: **Record detail with existing register**. Canonical destination: `/service/technicians`. Source authority: [PPO-SCHED-ADR](../../../decisions/scheduling-resources-architecture.md).

1. Keep Field Team Visits, Technicians and Needs preparation views. In Technicians, choose Availability & competence; the resource name in Planner also opens detail.
2. Select a seven-day review window. Inspect permitted site eligibility, active/publication state, source-as-at, effective dates and calendar version/timezone.
3. Review weekly intervals, exceptions, unavailable/other-work blocks and anonymous busy reservations. Open permitted appointment records for commitments and retained history.
4. Check skill status, validity and review evidence. Expired, not-yet-valid, expiring-within-period and unknown evidence stay explicit.

Resource/calendar/competence mutation is unavailable. Synthetic skills are not statutory certificates; certificate/renewal evidence remains Unknown. No private HR fields are added.

## Desktop

Keep the accepted Field Team Visits, Technicians and Needs preparation views. Availability & competence opens a specific resource. Detail uses paired overview/calendar cards, skill evidence, then reservations and permitted commitments; resource identity, seven-day window and source versions stay explicit.

## Mobile

Stack resource evidence cards without hiding interval, validity or unknown-evidence text. Date and refresh controls remain reachable at 390 x 844 and 320 CSS px. Long UUIDs and hashes wrap. Existing Field Team filters and record navigation remain available. Review native 200% browser zoom separately; CSS-width reflow is not a substitute.

## Shared components and states

FieldTeamScreen, ResourceWorkspaceScreen, shared shell/SchedulingNavigation, Field, ReadState, Stamp and Button. No operational source editor is introduced.

Loading, empty/filtered empty, failed and denied reads remove prior evidence. Words identify Unknown and source completeness. These review pages have no source-mutation save action; analytical state is explicitly disposable.

## Handovers and authority

Incoming: exact permitted resource identity and selected review date from Planner or Field Team. Outgoing: permitted site/appointment records and retained booking history. Source publication history beyond the returned bundle, certificates and renewal evidence remain unavailable/Unknown.

## Visual references and verification

[Field Team r04](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r04.html) remains the accepted register layout; [r05](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05.html) and [its change record](../../../reference/ui/field-technicians/powerplants-one-field-technicians-r05-change-record.md) remain retained sources. No exact issued resource-detail mockup exists.


## Canonical Job Pack handover

JobPackEntry reuses shared buttons and ReadState. The current server read chooses Open job pack or permitted Prepare job pack with the exact appointment identity. No visible pack is distinct from a failed/denied read; refresh hides prior links. Desktop/phone text wraps and 44 px controls remain within the existing panel or trapped drawer. [I5 handover](../../../delivery/job-pack-integration-handover.md) records evidence; the existing appointment/booking authority is unchanged.
