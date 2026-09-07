---
document_id: PPO-012-TEST
revision: r01
date: 2026-09-07
status: Authored future procedures; all Not run
owner: Dean Fiedler - private prototype
---

# Projects — acceptance procedures

[BP-06](../blueprints/BP-06-projects-commercial-delivery.md) · [Screens](../blueprints/projects-screen-specification.md)

All PA-01–PA-20 are **Not run**. Design inspection/checks are recorded separately in the handover. Use synthetic fixtures only. Proposed common fixtures: Coordinator A, milestone owner B, permitted read-only viewer C, unrelated company/site actor D and revoked actor E; two distinct customers/sites with similar names; Project A at one permitted site. Derive actual actor UUIDs from the implementation seed, not names. Record build SHA, environment, procedure version, actual result/evidence and defects when executed. Preserve existing master AT statuses.

| ID / increment | Preconditions and exercise | Observable expected result | Traceability / status |
|---|---|---|---|
| PA-01 / J1 | A creates a known-site project with an owned initial Activity, then restarts database/app and reopens it | Same UUID/reference, site/coordinator, initial action and receipt persist; no partial project on injected Activity failure | PRJ-01; AT-21; Not run |
| PA-02 / J1 | Submit same create operation concurrently twice; retry after lost response; reuse operation with altered title | One project/Activity/reference; exact original result for same payload, rejection for different payload; current permission checked on recovery | PRJ-01; AT-34; Not run |
| PA-03 / J1 | D/E request direct Project UUID, list/search/counts, history, Activity, receipt and autocomplete; C attempts writes | No data leakage or write; mixed-link Activity inaccessible if Project is denied, even with visible organisation | PRJ-01/03; AT-01/30; Not run |
| PA-04 / J1 | Mark milestone Blocked without owner/action, then with eligible action; later complete its action | Invalid command refused with no state change; valid blocker remains owned; completion preserves outcome and shows follow-up needed without silently resolving milestone | PRJ-03; AT-14; Not run |
| PA-05 / J1 | Complete designated next Activity while another actor designates it; retry both operations | No terminal Activity represented as an active next step; original outcome retained; deterministic next-action-needed projection | PRJ-03; AT-34; Not run |
| PA-06 / J1 | Enter unknown, past, earlier-than-target and weekend forecast dates; revise target/forecast with/without reason | Unknown distinct from overdue; early/late calendar-day variance correct; no calendar engine; required reason and original dates preserved | PRJ-02; AT-32 component; Not run |
| PA-07 / J1 | A and B edit same milestone version concurrently; attempt coordinator/site/customer reassociation | One permitted version wins, other proposal retained for comparison; excluded relationship/owner transfer fields rejected | PRJ-01/03; AT-34; Not run |
| PA-08 / J1 | Record health/stage update; create correction; try deleting original; complete all milestones | Original attribution/assessment retained; correction linked; no project closure, technical release, ERP change or customer acknowledgement | PRJ-07/08; AT-38 component; Not run |
| PA-09 / J1 | Search/filter/sort/page; open project/action and return; create outside current filters; simulate list failure | Same query context restored; totals match permitted query, unknown dates last; explains hidden-by-filter new record; failed load never shows zero | PRJ-07; AT-30; Not run |
| PA-10 / J1 | Keyboard-only create/update/progress; 200-character/unbroken title and 4,000-character note; 320/390 px phone and desktop | Labels/focus/error summary usable; text wraps without outer overflow; 44 px primary targets; no colour-only meaning | PRJ-01/07; AT-34; Not run |
| PA-11 / J1 | Drop connection before/after commit, check original receipt, reload unsaved form, switch actor while proposal open | Honest Saving/Saved/Save not confirmed; no duplicate on recovery; warns of unsaved loss; actor change clears sensitive proposal | PRJ-01/03; AT-34; Not run |
| PA-12 / J2 | Synthetic graph has parallel FS/SS branches, signed lag and multiple calendars; compare accepted schedule fixtures | Stable UUID graph, calendar/version and expected dates match; no conversion into single chain | PRJ-02; AT-24/32; Not run |
| PA-13 / J2 | Attempt cycle, self-edge, dangling/cross-project edge and concurrent graph updates; revise forecast | Invalid graph refused; immutable baseline remains; changed forecast/impact/reason recorded | PRJ-02; AT-32; Not run |
| PA-14 / J3 | Change project installation forecast with existing confirmed crew booking; submit request twice; Service accepts/rejects | Forecast never rewrites booking; one typed request; current Service permission/readiness/concurrency guards determine booking outcome | PRJ-04; AT-09; Not run |
| PA-15 / J4 | Enter a proposed variation and partial source financial observations under approved definitions | Proposal is not entitlement/revenue; costs/commitments/invoices/payments distinct; currency/time/completeness explicit; no fabricated totals | PRJ-05; AT-31/38; Not run |
| PA-16 / J5 | Submit test evidence, fail/retest a hold point and attempt completion without required review | Competent authority and exact criteria/revision required; failed hold remains; milestone completion cannot bypass technical release | PRJ-06; AT-17/38; Not run |
| PA-17 / J4 | Internal update contains restricted note; approve customer-safe revision then change it; revoke recipient access | Internal content excluded server-side; old approval cannot authorise changed content; suppression/access honoured; sent/delivered/acknowledged distinct | PRJ-07; AT-36; Not run |
| PA-18 / J5 | Accept one package with open defect/remaining work; attempt full closure and support handover | Partial acceptance identifies exact scope; remaining work owned; technical/customer/commercial/support lifecycles complete only on their own evidence | PRJ-08; AT-17/20/38; Not run |
| PA-19 / J1 | Invalid scope/owner/due combinations, forged actor, unsupported payload keys and HTML/script narratives | Whole command rejected where invalid; actor derived server-side; narratives rendered as text; no leakage through error messages | PRJ-01/03; AT-01/30; Not run |
| PA-20 / J1 | Complete/cancel milestone; try editing terminal evidence; create successor correction; inspect all versions | Original terminal version immutable; successor linked with reason; no accidental reopening, booking, customer acceptance or project closure | PRJ-02/08; AT-38 component; Not run |

J1 executes PA-01–PA-11 and PA-19–PA-20 plus existing affected regression suites; PA-12–PA-18 remain later scope. Broad AT-32/AT-38 are not fully passed by J1 component coverage. Source migration later also needs separate classified snapshot/delta/relationship/history/file reconciliation and fallback exercises under AT-21/24; it is not authorised by any PA row.
