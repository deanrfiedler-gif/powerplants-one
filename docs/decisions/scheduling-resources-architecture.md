# Scheduling & Resources — architecture decision

<!-- versioning: git; committed history is authoritative -->

**ID:** PPO-SCHED-ADR · **Owner:** Dean Fiedler · **Date:** 24 September 2026
**Status:** Implementation decision under the requested S1–S5 programme; visual and business acceptance separate.

## Evidence and scope

Initial main was `ca006fb1fc6b2e2bd2a9bdb509caa276d1052ffc`. The branch subsequently reconciled #299/#300 at `6c5e7c4` and #304 at `9e49a57332aacfbb45a43fdd4d17c1d031fc80fb`. The [handover](../delivery/scheduling-resources-handover.md) records the final open-PR overlaps and observed migration allocations. No Scheduling migration or capability is needed. Other worktrees remain untouched.

PL-01 and Field Team already work. Preserve their engines and accepted presentation. PL-02 adds read-only resource detail; PL-04 adds a coordination queue and explicit request comparison using existing decisions; PL-05 reviews explicit reservations and analytical visit order; PL-03 combines source-owned contributions on the server.

## Decision and alternatives

Retain BP-02 / ADR-0003's TypeScript, Next.js and PostgreSQL modular monolith. Reuse current scoped read predicates and booking commands. Add bounded repeatable-read projections, no migration, dependency, capability, calendar editor, routing provider or external write. A new scheduling authority, separate warehouse and client-side joins would duplicate source ownership and weaken version/scope controls.

Published resource bundles already include validity, evidence hashes and review identity/time. Show missing evidence as Unknown; a synthetic skill is not a statutory certificate. Expose only permitted site eligibility. Other commitments remain anonymous busy intervals when appointment detail is unavailable.

Capacity contributions retain stable domain/source IDs, versions, as-at, owner, dates and source state. Service appointments contribute reservations, not measured labour; authorised orders without a live appointment contribute undated demand. Project task duration and Engineering due dates never become effort. All current source effort is Unknown. No utilisation denominator or percentage is defined. Project/Engineering owners are not inferred to be Service resources; discipline is not silently mapped to a competency.

Each domain enforces its own read scope plus the Scheduling entry capability. Missing domain capability is explicitly unavailable, never zero demand. Bounded results disclose completeness; refresh errors never imply free capacity. Analytical scenario exclusions and sequence changes stay in browser memory, have no mutation endpoint and reset on source refresh/context change.

## Native composition and handovers

PL-01: Planning workspace, existing `/schedule`. PL-02: Record detail at `/service/technicians/[id]`, linked from the existing Field Team. PL-04: Work queue with record review at `/schedule/changes`. PL-05 and PL-03: Review/comparison at `/schedule/travel` and `/schedule/capacity`.

Reuse the current shell, semantic tokens, Button/ButtonLink, business-ui fields/read/error/status controls and existing booking/request controls. A secondary Scheduling navigation avoids more global rail items. New responsive cards stack on phones; the shell remains the vertical scroll owner.

The retained Scheduling r01 HTML is a proposed reference, not an accepted native baseline. Its unassigned-proposal definition is superseded by the current authorised work-order demand contract. Keep its source bytes and Field Team's accepted layout. New queue, resource, travel and capacity compositions are proposed native adaptations with owner visual review pending; no review fingerprint is adopted by this change.

Incoming context is current permitted source identities and versions. PL-05 hands exact appointment/resource/date context to PL-04; PL-04 uses existing appointment commands and preserves old booking history. Changed dates/crew require current contact and preparation consequences. PL-03 directs resolution to the owning domain without writing source records.

## Traceability and unresolved policy

SVC-04/05, ENG-01, PRJ-02/04, DAT-06, SC-07/08, TR-03/08/16, API-R04/C04–07 and PT-08/09/10/26 retain their meaning. Operational effort, working-time denominator, calendar/certificate ownership, cross-domain resource mapping and routing remain unresolved. They do not block truthful read-only review. No production readiness, deployment or full parent acceptance is inferred.

## Local setup finding

Unchanged main reproduced seed timeout in PostgreSQL 16.15 on Windows while the site timezone trigger scanned `pg_timezone_names`. A seed bundle runs several statements under one call; its setup-only transaction now has a bounded 120-second statement timeout. The same setup bound covers explicit synthetic reset after schema disposal also exceeded the ordinary read limit under concurrent local validation. The application pool remains at 10 seconds, and constraints, transaction atomicity and durability are unchanged. Extending all application query limits or changing historical migrations was rejected.

## Post-merge review continuity

Inspection of main `0f10b7f` found the whole programme merged through #310. The follow-up uses the existing native History API convention to retain review criteria and selected appointment, extending the allowlisted Scheduling return URL. Date/site/timezone flow through Field Team and resource detail; the Field Team default remains today. Query values are presentation criteria, never command authority. Analytical sequences/exclusions are deliberately transient and reset on refresh or changed criteria.

Calendar closures use half-open interval intersection for each displayed day and each buffered travel reservation. This corrects missing evidence without introducing a second booking validator. Open/InProgress Activities alone are outstanding follow-up; terminal Activities remain retained history. No new technology, data model, capability or operational policy is selected. [Verification](../testing/evidence/scheduling-refinement/README.md) remains separate from owner acceptance.

## Amendment — 30 October 2026: known hours and over-capacity

Dean accepted the [Capacity review design](capacity-review-figma-design.md) on 30 October 2026, including its answers to Q5 and Q6. For capacity contributions, these rules replace "All current source effort is Unknown":

- Owner-supplied planned effort on a project task and planned step hours on a workshop build count as known hours, each with its source. Service reservations stay reservations, not measured labour. Everything else stays "Effort unknown".
- Project task duration and Engineering due dates still never become effort.
- Available hours are published standard hours less leave, training and availability blocks. Extended hours are stated and never counted as available.
- A person is over capacity on a day only when known demand exceeds available hours on that day. Unknown effort is counted and shown, and never added to hours.
- Capacity is shown in hours and words. No percentage or utilisation figure is adopted.

Workshop becomes a capacity domain under the same read-scope and Unavailable rules. These are design rules for a later build. No source field, read model, route or capability changes here, and the built page keeps reporting effort as Unknown until that build.
