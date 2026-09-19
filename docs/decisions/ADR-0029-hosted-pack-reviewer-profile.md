---
document_id: PPO-ADR-0029
revision: r01
date: 2026-09-19
owner: Dean Fiedler
status: accepted
---

# ADR-0029 — Hosted Pack Reviewer profile

## Status

**Accepted.** Dean authorised the next hosted acceptance step on 19 September 2026.

## Related requirements and controls

| Reference | Relationship |
|---|---|
| D-020 / NFR-01 | Identity, least privilege and server-enforced action/data access |
| SVC-03 / OUT-09 | Checked, revision-controlled technician job packs |
| TR-04 | Draft pack review to Checked or Returned |
| ADR-0011 | Existing controlled job-pack lifecycle and issue separation |
| ADR-0021 | Existing ordered hosted-only migration track |

## Context and constraints

The signed-in hosted tester can now complete the booking workflow, but intentionally has no
pack authority. The next acceptance step needs an attributable reviewer without adding pack
permissions to the broad T6 booking actor. The available Microsoft account is the authentication
anchor for the private synthetic demo; requiring a second Entra account would block the current
acceptance journey and would test account administration rather than the PPO role boundary.

`pack.read`, `pack.prepare` and `pack.check` are not sufficient on their own to traverse the
current server visibility chain. The reviewer also needs the read-only dependencies
`shared.read`, `schedule.read`, `service.work_order.read` and `service.ticket.read`. None of those
dependencies grants a scheduling, work-order, contact, scope or readiness command.

Checking a pack does not clear dispatch. The existing P06 contract clears `needs_review` only
after a separate `pack.issue` actor creates and finalises the current exact output. This decision
does not add that authority.

## Options considered

1. **Add pack permissions to T6. Rejected.** This combines booking and pack-review authority and
   makes the earlier bounded-access evidence false.
2. **Require a second Microsoft account. Deferred.** This is suitable for a wider tester pilot but
   is unavailable for the current owner acceptance and adds tenant administration unrelated to
   the product control being tested.
3. **Use the broad local Coordinator. Rejected.** Hosted mode intentionally refuses local identity
   selection, and Coordinator carries unrelated issue and business permissions.
4. **Create a hosted role profile linked to the authenticated tester. Selected.** The profile has a
   separate PPO user ID, exact grants and audit events while the Entra tester remains the sign-in
   and expiry anchor.

## Decision

Add hosted migration `0003-hosted-pack-reviewer.sql` and a `demo_tester_roles` mapping. Every
current invited tester receives one linked `pack-reviewer` actor during explicit setup or the
bounded existing-demo upgrade. The application runtime may read the mapping but cannot create,
alter or grant roles. A signed-in tester can switch only between their own T6 actor and their own
linked reviewer actor. The session token stays private and unchanged; the server replaces only
the current session actor after revalidating the tester, linked role, expiry and active state.

The Pack Reviewer grants are exactly:

- read dependencies: `shared.read`, `schedule.read`, `service.work_order.read`,
  `service.ticket.read`;
- pack actions: `pack.read`, `pack.prepare`, `pack.check`.

It receives no `pack.issue`, `pack.acknowledge`, scheduling commands, work-order edits, readiness
assessment, field, report or Finance authority. T6 retains its existing 31-capability set and no
pack capability.

## Consequences and reversal

The account panel now exposes an explicit Demo role selector. Switching clears displayed business
state, records an audit event against the selected actor and opens an appropriate service page.
Disabling or expiring the parent invitation also disables access through the reviewer profile.
Reconciliation deletes sessions whose tester or linked role is disabled/expired.

The existing-demo release requires `upgrade-and-deploy`; ordinary deploy refuses the pending
hosted migration. Reversal disables the role mapping and removes active reviewer sessions. The
retained actor and audit evidence are not rewritten. Removing the feature later requires a new
hosted migration rather than editing migration 0003.

## Validation and remaining work

Unit and native PostgreSQL cases cover the exact capability set, actor separation, switching,
expiry/removal, idempotent upgrade, runtime inability to alter identity tables and preservation of
T6. The invited browser acceptance must prove preparation and a Checked decision for the moved
appointment, followed by a reload showing dispatch still held. A separately authorised issuer is
the next control if Dean chooses to complete exact pack issue; it is outside this decision.
