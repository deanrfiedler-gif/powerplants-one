---
document_id: PPO-012-J1-START
revision: r01
date: 2026-09-07
status: Prepared only; no implementation authority from storage
owner: Dean Fiedler - private prototype
---

# BP-06 J1 — Project register, milestones and owned follow-up starter

Use only when Dean separately invokes this bounded implementation. Read [BP-06](../blueprints/BP-06-projects-commercial-delivery.md), [screens](../blueprints/projects-screen-specification.md), [sequence](projects-implementation-plan.md), [acceptance](../testing/projects-acceptance.md) and the [handover](projects-discovery-handover.md).

Act as senior business analyst, product designer, architect, developer and quality engineer for Powerplants One, Dean's private synthetic prototype. Implement only J1: an authorised coordinator creates a project against an existing permitted customer/site with an accountable coordinator and initial owned Activity; adds manual milestones; records progress or a blocker; completes an action with its outcome; and sees the same current facts and retained history in list/detail.

Repository: https://github.com/deanrfiedler-gif/powerplants-one. Parent: PPO-012 / issue #12, distinct from service P12.

Before changing code, verify actual main, current permissions/contracts and relevant changes; read AGENTS, README, STATUS and current handovers. Verify BP-06 publication and record the current P10–P12 position. Recommended sequencing is after P12; if the new user request brings J1 forward, record that choice and keep P01–P12 ordering intact. Missing engineering policy does not block manual J1 milestones; it does block technical approval features, which are excluded.

Use the existing stack and command/receipt/Activity patterns. Add scoped typed Project/ProjectMilestone/update/event records and the Project ActivityLink target, including real foreign keys and current visibility on every mixed-link read, list, history and recovery path. Implement the already adopted PRJ reference allocator and reserve an available additive migration number only after checking concurrent increments. Preserve all existing migration/fixture/issued bytes and all 78 parents. No new independent task store or customer master.

Use BP-06's explicit state/date/owner limits. Known site required; fixed company/customer/site/coordinator; manual Intake/Planning/Delivery/Handover stage; Active project only; health NotAssessed/OnTrack/Attention/Blocked; genuine owned blocker actions; manual milestone forecast dates; immutable completion/cancellation and successor correction. No silent lifecycle changes when completing an Activity. Implement race, stale-version and uncertain-outcome recovery from the original operation.

Deliver list, detail, create, milestone/progress and update forms with keyboard access, clear saving/saved/failed/uncertain states and practical phone layout. Use the existing brand specification and exact logo. Static images illustrate layout only; implement semantic HTML with real server state. Preserve filter/search/sort/page context, scope-safe counts and long-content readability.

Run applicable foundation/prototype/naming checks and PA-01–PA-11/PA-19–PA-20 with database/API and meaningful browser cases. Inspect desktop and phone screens. PA-12–PA-18 describe later scope and remain Not run. Full master ATs do not pass by inference. Test actual restart and same-operation retries where needed to establish persistence and no duplicate records.

The actual invoking request must define repository delivery authority; follow its existing grants for dependencies, additive migrations, focused issue/branch, code/tests/docs, commits/PR and checked merge. Do useful reversible preparation before asking about genuinely missing authority. Record actual source/head/main checks and limitations in a J1 handover; prepare J2 only, then stop.

No live Smartsheet/MYOB/SharePoint writes, operational import, paid services, hosting, customer messages, portal access, quote acceptance, scheduling requests, money, Gantt engine, project reassociation or project closure is included.
