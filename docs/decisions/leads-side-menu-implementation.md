---
document_id: PPO-CRM-LEADS-SIDE-MENU-IMPL
title: Leads side menu built on the shared secondary menu
date: 2026-10-18
owner: Dean Fiedler
status: User instruction implemented on a branch for review; CI, owner visual review of the application and deployment separate
source_commit: 232ab988fd1e422e6648c67855e08215be8752a7
versioning: git
---

# Leads side menu built on the shared secondary menu

On 18 October 2026 Dean asked for the application's rails and secondary menus to match the Figma Shell v2 designs ([rail and menu alignment](shell-rail-menu-figma-alignment.md)). That change left pages whose accepted design draws a menu the app never built; Leads was the first. This record builds the Leads menu that Dean accepted on 11 October 2026 ([Leads design](leads-design.md), departures L1 and L2), using reads the backend already provides ([Leads counts and follow-up reads](lead-register-backend.md)).

Scope: the existing destination `leads`, route `/sales/leads` (and `/sales/leads/[id]`, which renders the same workspace), register entry `route:/sales/leads`. No parent requirement ID, scope ID, route, read model, migration, seed, permission or capability is added or changed.

## 1. Source design

The accepted Figma page "Leads (accepted)" `190:20237`, desktop frame `190:20513`, side menu `190:20519`, at the named version "Leads — Pipedrive pattern, accepted". The menu uses the Shell v2 components v2 / Menu item `73:46`, v2 / Menu heading `73:48` and v2 / Menu edge `73:54`; the values are in the [alignment record](shell-rail-menu-figma-alignment.md#1-source-designs). The icon-free capture is [PPO-Leads-01](../reference/ui/crm/leads-design-r01/README.md).

| Row (Figma node) | Icon in Figma | Read it opens | Count key |
|---|---|---|---|
| Inbox `198:1502` | inbox | `GET /api/v1/crm/leads` (default `view=Active`) | `Active` |
| My leads `198:1507` | user | `view=MyLeads` | `MyLeads` |
| Status · New `198:1515` | bell | `status=New` | `New` |
| Status · Contacting `198:1521` | envelope | `status=Contacting` | `Contacting` |
| Status · Nurturing `198:1527` | seedling | `status=Nurturing` | `Nurturing` |
| Follow-up · Overdue `198:1535` | calendar-exclamation | `follow_up=Overdue` | `Overdue` |
| Follow-up · Next action needed `198:1541` | calendar | `follow_up=NextActionNeeded` | `NextActionNeeded` |
| Other views · Archived `198:1549` | box-archive | `view=Archived` | `Archived` |
| Other views · Disqualified `198:1555` | ban | `view=Disqualified` | `Disqualified` |
| Other views · Converted `198:1561` | circle-check | `view=Converted` | `Converted` |

Every view in the drawn menu is served by an existing read; none needed a new rule. Overdue and Next action needed are the backend's follow-up predicates (an Open or InProgress next activity due before the observation time; no usable next activity, or one marked as needing a due date), not rules defined in the page.

## 2. What changed in the application

- **Menu.** `LeadsWorkspace` mounts `SecondaryMenuFrame` with the scope id `#ppo-leads`. The rows, groups, icons and counts are listed in `src/components/leads-menu.ts`, which also turns an address into the open view and back. Choosing a view replaces only `view`, `status` and `follow_up`; search, owner, source and sort stay, and the page cursor is dropped because it is signed to the filters that made it.
- **Counts.** One `GET /api/v1/crm/leads/counts` read under the toolbar's search, owner and source, refreshed with the list (after a saved change, every 15 seconds and on window focus). The menu's own status is never sent, or every other status would count zero. A count appears only once read; if the read fails, the views still open and the menu says counts are unavailable. When some leads' next activities cannot be read (`follow_up_completeness: Partial`), the two follow-up counts show "+" and their accessible label says how many leads are not counted.
- **Removed.** The four icon tabs (Inbox, Archived, Disqualified, Converted), a View select that was hidden at every width, and Status in the Filters menu and phone filter panel, since statuses are now views. Clear filters keeps the open view.
- **Phone.** The header's "Leads menu" button opens the same menu as an overlay. The existing view picker in the Leads toolbar, which capture 04 draws as standing in for the menu, now offers the same ten views in their groups.
- **Labels.** The list footer, empty heading and phone summary name the open view ("No overdue leads", "1 lead on this page · Overdue"). Row menus still follow the lifecycle: My leads, status and follow-up views keep the Inbox row actions.
- **Icons.** Three Leads glyphs are added for the rows the shared product set does not draw: seedling, calendar and calendar-exclamation (ADR-0050 names, local fallbacks drawn). The other seven use the existing product icons.
- **Shared styles.** `#ppo-leads` joins the shared selector lists in `my-work.css` and `figma-shell.css` wherever `#ppo-cpq` is listed, which are the frame, menu, overlay, strip and edge rules. It does not join My Work's element reset or form rules, so the Leads toolbar, table and modals keep their own styling.

## 3. Not changed

The toolbar (L3), the default column order (L4), the grid's wording colours (L5), the record window (L6), the selection panel (L7), the phone list rows (L8), the rail badge (an open question in the Leads design), the read contract, permissions and every Lead command.

## 4. Verification

- Measured on the running application at 1440 × 900 against the Figma frame: 240 px menu, `#f6f7f9`, 8 px padding, rows at y = 8, 50, 92 (heading, 34 px), 128, 170, 212, 254, 290, 332, 374, 410, 452 and 494, 16 px icons, 12/16 counts, `#e3e8ee` selected row in `#355b80`. Collapse, the remembered strip, the 1024 px overlay with Escape returning focus to Show menu, and the 390 px overlay and picker were checked by hand with synthetic leads.
- `tests/unit/leads-menu.test.ts` and the side-menu case in `tests/browser/leads.spec.ts`; checks run are listed in the pull request.
- Limits: no owner visual review of the application, physical device, screen reader or zoom check. The 9 October 2026 visual review of the page stays stale. Work orders (`193:18953`) and Engineering workload (`184:1047`) have the same gap and follow as separate pull requests.
