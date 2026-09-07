---
document_id: PPO-012-PLAN
revision: r01
date: 2026-09-07
status: Proposed sequence; J1 implementation requires a new invocation
owner: Dean Fiedler - private prototype
---

# Projects — proposed bounded delivery

[BP-06](../blueprints/BP-06-projects-commercial-delivery.md) · [J1 starter](projects-first-increment-starter.md) · [Handover](projects-discovery-handover.md)

J1–J5 are local BP-06 labels under PPO-012 / issue #12; they neither renumber P01–P12 nor create new parent requirements. Only discovery/design is invoked now. Full Projects remains Wave C; the proposal brings a small coordination slice forward. Recommended J1 start is after verified P10–P12 completion; the eventual user invocation can explicitly choose earlier delivery on verified shared contracts while preserving service ordering. No date, duration or budget is promised.

| Increment | Complete user journey | Concrete prerequisites | Scope held for later |
|---|---|---|---|
| J1 Register, milestones and owned follow-up | Create a permitted one-site project → plan milestone/action → record progress/blocker → see current register and immutable history | Current main/shared contracts; accepted bounded scope; Project permissions and typed Activity target delivered and verified within J1 | Source import, project closure, Gantt, booking, money, customer output |
| J2 Schedule and structured project controls | Plan parallel work packages/tasks with real dependencies → revise forecast → inspect impact and owned RAID | Verified J1; G02 calendar/graph contract; testable baseline/forecast rules | Confirmed bookings, technical release, financial posting |
| J3 Sales and delivery handovers | Accept an exact authorised sales handover → create/link project once → request Service attendance and review changes | Verified J1; actual CRM/quotation acceptance contract; P05 current scheduling boundary and typed project request | E1 draft never treated as award; no automatic booking confirmation |
| J4 Commercial visibility and customer updates | Review source-backed commercial position and an exact customer-safe update → approve controlled distribution | G04/G06 definitions and authority; reusable issue/distribution contract; project permissions | No independent ERP ledger; live transmission/portal requires its own scope |
| J5 Verification, staged handover and closure | Review tests/deliverables/defects → accept a named package → hand over support → close the right lifecycle | BP-05 technical authority, G03, applicable commercial/Service contracts | No closure by percentage or calendar date alone |

J2 and J3 can be specified independently after J1; neither is an artificial prerequisite for the other. J4 need not wait for a full Gantt engine when its actual data/output dependencies are satisfied. Source migration is a separately accepted capability-by-capability transition, not automatically “J6”.

The broad issue #12 names PPO-001 and PPO-011 dependencies. J1 reuses existing scope/foundation and defers all technical release/test acceptance to BP-05; this design does not claim PPO-011 complete or remove it from the broad issue. Full PRJ-01–PRJ-08 acceptance remains open.

Each implemented increment needs domain/API/persistence/permission/retry checks, desktop/phone review, preservation of existing migrations and issued bytes, normal reviewable repository delivery and actual merged-main verification where merge is authorised. A design illustration is never runtime acceptance.
