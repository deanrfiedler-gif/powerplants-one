# CRM — I2 UI implementation guidance

**Revision:** r03 · **Date:** 6 September 2026 · **Parent:** BP-03 / PPO-009 / issue #9 · **Owner:** Dean Fiedler, private prototype · **Status:** Design input for a later authorised increment.

Read this alongside the [ordered implementation plan](crm-implementation-plan.md), [shared UI specification](../standards/ui-style-specification.md), [C01–C07 screen specification](../blueprints/crm-screen-specification.md) and [Board/Grid preview and captures](../blueprints/crm-ui-mockups/README.md). This is an additive UI handover, not the full I2 implementation starter. The active I1 workstream owns its completion handover and preparation of that starter.

## Start from the actual merged contracts

At this handover's baseline, I1 is active in [issue #39](https://github.com/deanrfiedler-gif/powerplants-one/issues/39) / draft [PR #40](https://github.com/deanrfiedler-gif/powerplants-one/pull/40), and P09 is active in [issue #36](https://github.com/deanrfiedler-gif/powerplants-one/issues/36) / draft [PR #37](https://github.com/deanrfiedler-gif/powerplants-one/pull/37). Recheck both before implementation. Complete and verify I1 first; reconcile current main, actual permissions, Activity links, reference/receipt contracts and shared styles. Do not select migration or ADR numbers from this document.

I1 keeps Enquiry → Qualified, Open outcome, owned next action and no money fields. The six screenshot-derived labels in the mockup are a future layout reference. They do not replace I1's definition or accept operational stage transitions. Money, forecast basis and exact quotation/ERP links remain separately bounded commercial work under I3 and its prerequisites. An initial I2 Board/Grid implementation can omit amount columns and totals.

## Carry the shared visual direction into C02

| Area | Implementation direction |
|---|---|
| Shared shell | Navy `#242a37`, green `#62bb46`, white; Roboto/Verdana; intact supplied green-and-white logo on navy. Adopt shared tokens/components after checking existing consumers. |
| Workspace | Retain scoped search, page title, view switch, creation action, pipeline/owner/next-action filters, result scope and sort in familiar locations. Use the product's actual navigation. |
| Board / Grid | Two presentations of the same permission-filtered query. Preserve filters, sort and search when switching; read the same detail. Counts and any future totals use the same permitted scope and completeness definition. |
| Record emphasis | Title, organisation/site context, accountable owner and next action first. Distinguish overdue, due-needed and no-next-action states; use labels as well as colour. Never substitute zero for unavailable values. |
| Stages and outcome | Render actual accepted definitions. Explicit, accessible stage action with reason/evidence/version guard; no drag-only movement. Closing, Won, customer acceptance and ERP order remain distinct. |
| Reflow | Above 780 px, one horizontal six-stage reference sequence with 250 px minimum columns and sticky headings. At ≤780 px, direct stage selector plus previous/next. Freeze Grid heading/identity; contain scrolling. First complete phone card and at least nine laptop Grid rows are review targets. Preserve the complete logo. |
| Failure/recovery | Real loading, empty, denied, unavailable, validation and stale/conflict states from the server; preserve proposals safely and remove restricted content when scope changes. Saved requires durable acceptance. |

The revised standalone preview implements view/filter/search/sort/detail, phone stage navigation, active criteria/reset and temporary creation. Creation starts in the selected pipeline, defaults to the current synthetic actor, preserves the view and offers View opportunity if outside its filters. Linked errors focus the invalid field. Titles/actions wrap at accepted lengths. The Grid shows full owner names and actual action text; the real implementation must distinguish Activity owner from opportunity owner where they differ. Eight branded state illustrations are static design references only. It contains no permissions, persistence, real stage changes, owner transfer, account-plan editing, bulk edits, export or integration. Do not copy its synthetic data model, inline event code or client totals into the application as business contracts.

## Verification for the eventual increment

Cover actual Board/Grid record and filter equivalence; direct detail/search/count scope; unavailable/partial aggregates; empty and failed loads; long text at desktop, 390 and 320 px; keyboard entry, dialog focus and an accessible stage-change alternative. Exercise server authority, concurrent edits and revoked access using real database/HTTP/browser evidence for the accepted slice.

Relevant mappings remain CRM-01/02/03/04/08, PAR-03/04/05/15, CA-02/03/05/06/07/10/11/13 and AT-25 components. The design screenshots and preview checks do not pass those business/runtime acceptance cases. Retain the broader I2 relationship scope in the plan; authorise a bounded implementation slice explicitly when ready.

The [r02 design handover](crm-ui-design-handover.md) records the audit dispositions and exact regression evidence. Saved views, sortable headers, column resizing/reordering, bulk actions and persistence remain later work. Define bulk selection scope before exposing it; do not add nonfunctional controls to imply those capabilities.

## Later accepted implementation direction

Dean has now accepted r08 and requested its shared shell and CRM implementation. The [decision](../decisions/shared-ui-r08-implementation.md) supersedes this document's older minimum-column-width and horizontal-scroll presentation rule. The current application still uses its actual Enquiry → Qualified / Open definition. [Implementation handover](shared-ui-redesign-handover.md) records current verification and publication.
