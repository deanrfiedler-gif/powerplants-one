---
document_id: PPO-012-UI
revision: r01
date: 2026-09-07
owner: Dean Fiedler - private prototype
status: Static visual design and proposed interaction contract
---

# Projects — first-increment screens

[BP-06](BP-06-projects-commercial-delivery.md) · [Visual plates](projects-visuals/README.md) · [Acceptance](../testing/projects-acceptance.md)

## Shared layout

Use the existing [PPO UI specification](../standards/ui-style-specification.md): navy #242a37, green #62bb46, white, embedded Roboto and complete unchanged logo on navy. Green buttons use navy text. Semantic warning/error colours are existing UI extensions, not new brand colours. Supplied PDF typography and primary palette pages 17/18 and the logo were inspected; the attachment logo matches the existing repository image by SHA-256. No new corporate contact block or operational identity is introduced.

The plates are static vector layouts rasterised for review. Buttons/tabs are visual affordances only; there is no browser application, saved data or successful interaction claim. Actual J1 implementation must use semantic HTML, live permissions and durable responses. Outlined Roboto paths in the SVGs preserve typography for portable review; they are not the application's text implementation.

## PJ01 — Project register

Route proposal `/projects`. Header: Projects, short description, New project when authorised, current synthetic actor/environment. Search title/reference/customer; filters coordinator, stage, health and follow-up state; sort forecast finish ascending by default, unknown last, then UUID. Provide a clear filter panel on small screens. The plate shows a common subset of these controls.

Desktop columns: Project/customer/site/coordinator/reference; stage and health; forecast finish; next milestone and its forecast; next Activity, owner and due state. Identity opens the canonical detail; next Activity opens the existing Activity view under its own permissions. Project coordinator and Activity owner must not be assumed identical. Use a proper table with scoped headers, labelled record links and a frozen identity column/header if horizontal scrolling is needed. Do not clip long accepted text.

Summary definitions: Matching projects = exact permitted filtered count; Blocked milestones = blocked milestones within those projects; Overdue actions = designated next Activities whose known due instant has passed; Projects without finish date = those projects with unknown forecast finish. Use one consistent permission/snapshot basis and show the data as-at; query failure shows unavailable, never zeros. Do not label page-derived counts as portfolio totals. The plate contains all four synthetic records, so counts are 4/1/1/1.

Pagination proposal: server page size 25, stable cursor including sort/filter context; selection/return restores search, filters, sort and page. A changed result window offers refresh and retains filter intent. Clear filters clears search/filter criteria and resets cursor, retaining selected sort. Empty workspace offers New project if authorised; no matches offers Clear filters. No bulk selection, financial sum, export or saved view in J1.

At 780 px and below use vertically stacked project cards with the same facts and query, rather than forcing a desktop table into a narrow viewport. Customer/site/coordinator and the next action remain visible; secondary filters are collapsed initially. Targets at least 44 px; labelled focus; no hover-only essential text. At 390×844 the first card begins by 420 px; at 320 px allow text growth without horizontal page overflow. These are implementation targets, not measured responsive passes from a static plate.

## PJ02 — Project detail

Route proposal `/projects/:id`. Breadcrumb back to preserved register context; title; permanent reference; canonical customer/site links; coordinator; Active/stage/health; last accepted update time. Primary action Record update. An attention banner shows the blocked milestone and its owned next step.

Overview: target and manual forecast finish with explicit calendar-day variance, next Activity, milestone list and latest accepted update. Tabs expose Milestones & actions and History. No financial, ERP-processing or technical-release badges masquerade as project health. On phone retain title/context first, Record update, blocker, outlook, action and milestone; use one scrolling column and full-width controls. The phone plate is a 390×1080 content sample; it does not claim everything fits above the fold.

Milestones list includes owner, forecast or Date needed, state and detail/progress action. All are manual coordination milestones. History exposes original updates and corrections with actor/time, field changes and reason; corrections do not replace the original. Loading/error/denied pages must not reveal cached titles after an actor or scope change.

## PJ03 — Create project

Open a page or accessible dialog from New project. Order: title; company where multiple permitted companies exist; customer; site; coordinator; optional target/forecast; initial action summary/owner; known local due date/time+zone or Date needed. Dependent selectors revalidate on customer/company change and explicitly clear incompatible selections. No auto-selection of a similarly named customer or an out-of-scope site. Show Intake, Active, Not assessed as initial context, not hidden assumptions.

Validate title 1–200, action 1–160, scoped required relations and exactly one due-date choice. Inline errors are associated with fields and summarised at the top; focus the first invalid field, keep other entered values. Save text is “Create project”; Pending reference until durable acceptance. Save once through the original operation; only confirmed receipt permits “Project created”. Cancel/Escape requires unsaved-change handling and returns focus. If the new record does not match the retained register filters, explain that and offer Open project.

## PJ04 — Milestone and progress forms

Add: title, eligible owner, optional target date and either forecast date or Date needed. Edit dates requires reason when replacing known dates. Progress form offers only currently permitted transitions from BP-06; Blocked requires explanation and an open linked owned Activity, which may be created atomically. Complete requires completion note and explicit treatment of remaining blocker work. Cancel requires reason. Terminal milestone edit is unavailable; Create correction makes a successor and identifies the original.

Do not label Complete as Approved or use a signature. The initial milestone list can include a “Readiness review” coordination item, but completing it does not assert that operational readiness is verified.

## PJ05 — Record update / recovery

Update text is required; optional stage/health/date changes reveal their required reasons. Preview old/new dates and stage before submit. Attention/Blocked must designate an eligible open follow-up at the time of assessment. If that Activity later completes, keep the health assessment/history, show “Follow-up needed” and require the next update to reconcile it; do not silently change health or re-open a completed Activity.

| State | Visible content / recovery | Focus and data |
|---|---|---|
| Loading | Loading projects; no zero counts yet | Keep focus; announce status |
| Saving | Saving…; prevent duplicate submit | Keep proposal; preserve operation identity |
| Saved | Saved plus accepted server time | Update from server version; announce once |
| Validation failed | Specific field problem and summary | Retain other input; focus first error |
| Save failed before acceptance | Could not save; retry original operation when appropriate | Retain proposal; never claim durable save |
| Save not confirmed | Connection uncertain; Check save status | Recover original receipt before another write |
| Changed version | Compare latest accepted state with proposal | No automatic overwrite; user reapplies deliberately |
| Access changed | Generic unavailable state; Return to projects | Clear loaded/proposed sensitive content |
| Offline | Connection needed to save projects | No offline/queued/synced claim; no browser persistence |

Four [state illustrations](projects-visuals/project-recovery-states.png) show uncertainty, changed version, no matches and changed access. Other states are specified here for implementation. All UI input/output is escaped as text; no raw HTML in narratives. Future files and exports require their own explicit permission/content contract.
