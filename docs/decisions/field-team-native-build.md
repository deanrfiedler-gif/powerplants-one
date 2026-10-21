---
document_id: PPO-PL02-NATIVE-BUILD
date: 2026-10-21
owner: Dean Fiedler
status: Implementation record; owner visual review pending
versioning: git
---

# Field team native build

Dean's 21 October request authorises implementation of PL-02 at `/service/technicians` and `/service/technicians/[id]` from the [accepted Field team design](field-team-figma-design.md), including D1–D8 and Q1–Q5, with Conversations excluded. The earlier design record's code-authorisation boundary remains historical. This record does not accept the implementation on Dean's behalf.

The live source is **PPO - Design**, **Field team — accepted**, page `1289:54`, notes `1295:5240` and file-index row `1318:307196`. Frame identities and unchanged retained icon-free captures are listed in the [page contract](../design/development/pages/scope-pl-02.md). Parent SVC-04/05 trace, stable PL-02 identity, MYOB/SharePoint/CAD authority and existing permission scopes are unchanged.

## Decisions applied

- Q1: Technicians is the default. Visits and Needs preparation retain their existing r05 controls under the new menu.
- Q2: the person window begins on the incoming day and covers seven days. It does not snap to Monday.
- Q3: existing schedule/resource reads publish `resource_type`, not a role. Show that value; never infer a role from a name.
- Q4: adopt the already implemented planner `laneDay` rule. Standard capacity is the published calendar intersected with 08:00–17:00, less unavailable blocks and exceptions. Booked time is the union of all returned reservations intersected with that capacity. Reservations include explicit travel and anonymous busy intervals. Proposed visits do not reserve time. Reuse the function without changing the planner or database.
- Q5: display returned reviewer IDs; no invented name lookup.
- D5: View visits carries `view=visits` and `resource_id` with day, site and display time zone. Open in planner carries the same context.
- D6/D7: seven-day availability and competence are read-only. Missing evidence is Unknown. Expired, expiring, future and inactive evidence remain distinct. A refresh or changed identity/window discards old displayed evidence.

Existing permission-scoped reads already return per-person competence evidence, source/calendar fields and reservations. No migration, capability, dependency, source transaction or new API is needed. Synthetic browser read fixtures are verification inputs only.

## Adaptations and unresolved details

The shared RegisterTable, buttons, menus, secondary-menu frame, compact phone header, record identity and read controls are reused. Field team adds only page-local compositions and CSS. The compact 40 px rows, purple avatar and availability palette are scoped accepted-design variants; shared controls/tokens retain their existing values. Pro icons use existing name mappings and runtime Kit loading; no artwork is retained.

The drawn column-settings button has no defined behaviour or persistence contract. It is disabled pending a design decision. Filter contents, row menu contents, phone evidence sheet, tablet person record and new-shell Visits/Needs preparation layouts are undrawn; use existing controls and responsive reflow and keep the gap visible. No sorting, saved view or bulk action is invented. Source data determines names, roles, counts and dates; fixture composition is not operating authority.

Certificate/renewal evidence and publication history beyond the returned bundle remain Unknown/unavailable. The later [phone header amendment](phone-header-amendment.md) P3 places position/navigation in the shared header and person name/role/status in content. Native date inputs preserve keyboard and browser picker behaviour; their date formatting differs from the drawn text picker. Tablet comparison uses the existing collapsed primary-rail state. Conversations is excluded. These are online read pages with no new offline contract.

[Execution evidence](../testing/evidence/field-team-build/README.md) separates functional checks, visual comparison, owner review and deployment. Owner visual review remains pending.
