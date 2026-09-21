---
document_id: PPO-UICONS-HO
title: Existing modules UI consistency handover
revision: r01
date: 2026-09-21
owner: Dean Fiedler
status: Implemented on a branch; CI, owner visual review and business acceptance separate
source_commit: 920b058a7ee6e20951edf36b21374f75f25dfd29
---

# Existing modules UI consistency handover

**Branch:** `refactor/existing-modules-ui-consistency`, from `main` at
`920b058a7ee6e20951edf36b21374f75f25dfd29`. The
[decision](../decisions/existing-modules-ui-consistency.md) records scope, sources, the rules applied
and every departure. This is a presentation and interaction change to the existing native application.

## Delivered

- One shared header: a route-metadata breadcrumb with `nav`/`ol`/`li` semantics and `aria-current`, no
  repeated product name, a quieter parent and a darker semibold current page, ancestors giving way
  first, and an icon-only secondary-menu trigger 12px from the breadcrumb whose empty slot reserves
  nothing.
- Global search and quick add centred as one group on the whole application viewport, rail included,
  measured in the header's own coordinate space.
- One shared secondary menu: grey `#f5f6f8`, 240px from the rail's right edge as
  `--ppo-secondary-menu-width`, a white current item with no left accent, the menu's own right border
  as the collapse target and a 24px strip with a grip as the expand target. The protruding chevron pill
  is gone.
- More's right edge derived from rail right plus the expanded menu width on a page that has secondary
  navigation, in both menu states; unchanged elsewhere.
- The duplicated title band removed from thirteen registers, with the heading kept in the accessibility
  tree, the page's own action kept in place and the description published to the page-information panel.
- The Customers and Contacts directory rebuilt as a flush register: no padded or rounded frame, no outer
  gap, one vertical scroll owner, a compact toolbar and r22 values.
- The EN-06 inspector given the docked left-only shadow.
- Service reports stops nesting a second `main` landmark inside the shell's own.

## Route and refinement matrix

Every implemented business route is listed. "Shell" means the breadcrumb, the centred
search-and-quick-add group and the icon-only menu trigger, which reach every route through the shared
header.

| Route / view | Actual implementation | Page type | Shared components | Applicable refinements | Status | Evidence / exception |
|---|---|---|---|---|---|---|
| `/work`, `/work/actions`, `/work/reviews`, `/work/team`, `/work/updates`, `/work/waiting` | `activities/components/client/my-work-shell.tsx` + `my-work-views.tsx` | Dashboard and view lists with secondary navigation | `SecondaryMenuFrame`, `HeaderContent`, `ShellControls` | Shell; menu; More; tokens. Full-bleed table rules not applicable: an overview and its lists, not a table register | Verified | Centre error 0px; menu 240px, right edge 316px from a rail right of 76px; strip 24px, content left 100px; More right edge 316px in both states; `my-work.spec.ts` and `my-work-mobile.spec.ts` pass |
| `/engineering/[id]/materials` and its five views (`mapping`, `substitutions`, `releases`, `handover`, `history`) | `engineering/materials/components/client/*` | Register and working pages with secondary navigation and a record inspector | `SecondaryMenuFrame`, `em-*` | Shell; menu; More; table already flush; left-only inspector shadow added | Verified | Table left 316px expanded and 100px collapsed, both 0px from the boundary; More right edge 316px; `engineering-materials.spec.ts` passes with A34/A35 updated |
| `/engineering/materials` | `entry-view.tsx` | Package picker | Static `data-menu="collapsed"` scope | Shell; More | Verified | Covered by `engineering-materials.spec.ts` |
| `/sales/leads`, `/crm/leads` | `leads-workspace.tsx`, `leads-desktop-list.tsx` | Primary register, full bleed | Screen-reader h1 already; own column mechanics | Shell only | Verified, already conformant | Table left 76px against a host left of 76px, no frame, radius 0, no competing scroller; `leads.spec.ts` passes |
| `/sales/opportunities`, `/crm/opportunities` | `crm-screens.tsx`, `crm-worklist*.tsx` | Board and List worklist, full bleed | Screen-reader h1; registered workspace | Shell only | Not applicable, exception | Governed by the in-force `deals-r38` baseline (`moduleWorkspaces`, `module_integrations`). Page geometry needs a baseline revision, which is the owner's decision |
| `/customers`, `/people` | `crm-directory.tsx` | Primary register table | `PageHeader` register variant | Shell; title band; flush table; compact toolbar; r22 tokens | Implemented | Table left 76px equals host left, right 1600px equals host right, radius 0, one scroll owner; the `crm-refinements.spec.ts` directory journey passes |
| `/sites`, `/equipment` | `context-screens.tsx` `LegacyContextList` | Card register | `PageHeader` register variant | Shell; title band | Implemented | Title box clipped to 1px, heading in the tree, New site and New asset still visible, description in the guide. Table rules not applicable: a card grid |
| `/estimating` | `estimating-screens.tsx` `EstimateList` | Card register | `PageHeader` register variant | Shell; title band | Implemented | Breadcrumb reads Estimating / Estimates; description in the guide |
| `/estimating/discovery` | `discovery-screens.tsx` `DiscoveryList` | Card register | `PageHeader` | Shell only | Not applied, exception | "Scope and options" is not what the breadcrumb says (Estimating / Discovery); removing it would delete identity, not a duplicate |
| `/engineering` | `engineering-workspace.tsx` | Register and panels | Own `eng-*` scope | Shell only | Not applicable, exception | Governed by the in-force `engineering-r02` baseline |
| `/projects` | `projects-screens.tsx` `ProjectRegister` | Register and Gantt | `RegisterHeading` | Shell; title band | Implemented | Clean at all seven widths; `projects-gantt.spec.ts` passes |
| `/service/tickets` | `intake-screens.tsx` `TicketList` | Queue register | `PageHeader` register variant | Shell; title band | Implemented | Breadcrumb reads Service / Service requests; `intake.spec.ts` passes |
| `/service/work-orders` | `work-order-screens.tsx` | Queue register | `PageHeader` register variant | Shell; title band | Implemented | `work-orders.spec.ts` passes apart from the harness-only case recorded below |
| `/service/packs` | `pack-screens.tsx` `PackListScreen` | List register | `RegisterHeading` | Shell; title band | Implemented | The synthetic-environment line is kept as a compact note, not a title band; `packs.spec.ts` passes |
| `/service/reports` | `report-screens.tsx` `ReportListScreen` | List register | `RegisterHeading` | Shell; title band; landmark | Implemented | Second `main` landmark removed; `reports.spec.ts` passes |
| `/service/technicians` | `field-technicians-screen.tsx` | Register with its own breadcrumb row | Own `ft-*` scope | Shell only | Not applicable, exception | Governed by the in-force `field-technicians-r04` baseline; r05 is an accepted successor that is not implemented |
| `/schedule` | `planner-screens.tsx` `PlannerScreen` | Planner canvas | Screen-reader h1 already | Shell only | Verified, already conformant | No title band; table rules not applicable to a timeline; `planner.spec.ts` passes |
| `/finance/handoffs` | `finance-screens.tsx` `FinanceQueue` | Queue register | `Frame` | Shell only | Not applied, exception | "Finance handoffs" is not what the breadcrumb says (Finance); removing it would delete identity |
| `/my-jobs` | `field-screens.tsx` `MyJobsScreen` | Technician list | `PageHeader` register variant | Shell; title band | Implemented | `field.spec.ts` passes |
| `/admin` | `exception-screens.tsx` | Landing page with cards and a list | `PageHeader` register variant | Shell; title band | Implemented | The title exactly duplicated the breadcrumb; the band is removed entirely because the page has no action, and the description is in the guide |
| `/email` | `email-screens.tsx` `EmailInbox` | Mailbox | Own `ec-*` scope | Shell only | Not applied, exception | "Email" is not what the breadcrumb says (Email & Calendar); the page's own tab row marks the current one |
| `/calendar` | `email-screens.tsx` `EmailCalendar` | Calendar | Own `ec-*` scope | Shell; title band | Implemented | Heading visually hidden with `.ppo-register-title`; the Brisbane timezone note and Refresh stay |
| `/customers/[id]`, `/customers/[id]/account`, `/customers/new`, `/people/[id]`, `/sites/[id]`, `/equipment/[id]` | `context-screens.tsx`, `finance-screens.tsx`, `shared-create-form.tsx` | Record and form | `PageHeader` record variant | Shell only | Verified | A record keeps its heading: it carries name, reference, status and version the task needs |
| `/sales/leads/[id]`, `/sales/opportunities/[id]`, `/sales/opportunities/new` and the `/crm/*` equivalents | `leads-workspace.tsx`, `crm-screens.tsx` | Record and form | — | Shell only | Verified | `crm.spec.ts`, `crm-i2.spec.ts`, `crm-refinements.spec.ts` and `leads.spec.ts` pass |
| `/estimating/new`, `/estimating/estimates/[id]`, `/estimating/quotes/[id]`, `/estimating/discovery/[id]`, `/estimating/discovery/[id]/costing`, `/estimating/discovery/new` | `estimating-screens.tsx`, `discovery-screens.tsx`, `discovery-costing.tsx` | Workbook, review and wizard | `PageHeader` record variant | Shell only | Verified | Revision, saved version, draft state and cost basis stay visible; the estimating specs pass |
| `/engineering/[id]` | `engineering-workspace.tsx` | Package record | — | Shell only | Verified | `engineering.spec.ts` passes |
| `/projects/[id]`, `/projects/new` | `projects-screens.tsx` | Schedule record and form | — | Shell only | Verified | Gantt dependencies and task hierarchy untouched |
| `/service/tickets/[id]`, `/service/tickets/new`, `/service/work-orders/[id]`, `/service/work-orders/new`, `/service/packs/[id]`, `/service/packs/new`, `/service/reports/[id]`, `/service/appointments/[id]` | `intake-screens.tsx`, `work-order-screens.tsx`, `pack-screens.tsx`, `job-pack-screen.tsx`, `report-screens.tsx`, `planner-screens.tsx` | Record, approval and preparation | `PageHeader` record variant | Shell only | Verified | Lifecycle, revision, save state and review context retained; the Job Pack r03 page keeps its own design-conformance proof |
| `/finance/handoffs/[id]`, `/finance/handoffs/new` | `finance-screens.tsx` | Record and form | `Frame` | Shell only | Verified | `finance.spec.ts` passes. The two tables here are supporting tables inside record sections; their inner wrappers are unchanged in this increment |
| `/my-jobs/[id]` | `field-screens.tsx` | Field job record | — | Shell only | Verified | `field.spec.ts` passes |
| `/work/[id]`, `/work/new` | `activity-screens.tsx` | Activity record and form | `PageHeader` record variant | Shell only | Verified | Covered by `my-work.spec.ts` |
| `/admin/recovery/[id]` | `exception-screens.tsx` `RecoveryScreen` | Evidence review record | `PageHeader` record variant | Shell only | Verified | The `quality.spec.ts` recovery case passes, including its 320px header check |
| `/documents/[id]` | `pack-screens.tsx` `DocumentScreen` | Exact issued document | `Intro` record variant | Shell only | Verified | An issued document is not a generic snapshot and is not adapted |
| `/email/[id]` | `email-screens.tsx` `EmailDetail` | Message record | — | Shell only | Verified | `email-calendar.spec.ts` passes |

All seventy-three implemented `page.tsx` routes under `src/app/(business)` are accounted for above.
`/foundation` is a local-only diagnostic page outside the business layout and is unchanged.

## Validation record

Node **24.21.0**, npm **11.19.0**, Playwright **1.63.0**, Chrome **153.0.8010.53**, PostgreSQL
**16.15**, database `ppo_synthetic_test` at migration 30. The browser suites ran against the
**compiled** build of this branch, served on loopback.

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| `npx eslint .` | Pass |
| `npm run build` | Pass |
| `python3 scripts/check_foundation.py` | Pass, 0 errors |
| `python3 scripts/check_naming.py` | Pass, 0 errors |
| `python3 scripts/check_prototype.py` | Pass, 0 errors |
| `npm run test:unit` | 2 failures, both reproduced on unmodified `main` in this same worktree: the `recovery.test.ts` P12 private-path case and the `warm-routes.test.ts` repository-relative-sources case. Both are artefacts of running inside a git worktree under `tmp/`; neither is a regression |
| Browser suite, desktop project | 117 passed, 11 skipped, 2 failed |
| Browser suite, mobile project | 107 passed, 21 skipped, 2 failed |
| `playwright.crm-ui.config.ts`, all three projects | 37 passed, 26 skipped, 0 failed |

Both browser failures are the same two cases in each project, and both were reproduced on unmodified
`main` in this worktree before being attributed:

- `quality-journey.spec.ts` P11 fails during fixture preparation with
  `SkillOrTravelInvalid: visit and explicit travel must fit one published working interval`. The failure
  and message are identical on `main` at `920b058`. This is the date-dependent fixture class recorded in
  [ADR-0030](../decisions/ADR-0030-test-fixture-time-dependence.md), not a presentation defect.
- `work-orders.spec.ts:77` asserts `info.config.webServer?.command`. The local configuration used here
  owns no `webServer`, so that assertion cannot hold. The failure is identical on `main` under the same
  configuration, and the case passes under the repository's own configuration.

### Measured geometry

At 1920x1080, 1440x960, 1366x768 and 1024x768 across My Work, Leads, Deals, Customers, Contacts, Sites,
Equipment, Projects, Engineering, Estimating, Discovery, Service requests, Work orders, Job packs,
Service reports, Field technicians, Service planner, Finance, My Jobs, Exceptions, Email and Calendar:

| Check | Tolerance | Measured |
|---|---|---|
| Search-and-quick-add group centre against the full application viewport centre | 2px | **0px** on every route and width, in every menu and More state |
| Gap between search and quick add | 12px | 12px |
| Expanded secondary menu, right edge | rail right plus 240px | 316px from a rail right of 76px |
| Register table against the expanded menu divider | 1px | **0px**: EN-06 at 316px, the directory at 76px against a host left of 76px |
| Register table against the collapsed strip | 1px | **0px**: 100px against a strip right of 100px |
| Collapsed strip width | 24px | 24px, and hover alone does not open it |
| More panel right edge against the expanded menu coordinate | 1px | **0px** at 316px, expanded and collapsed |
| Register title band | removed where duplicated | Title box clipped to 1px, heading still in the accessibility tree, page action still visible, description in the page-information panel |
| Outer horizontal overflow at 1920, 1440, 1366, 1024, 820, 390 and 320 | none | None, and no control lost outside a table's own horizontal scroll |

The probes that produce these numbers are committed as `tests/ui/shell-geometry.probe.mjs`,
`tests/ui/menu-more.probe.mjs`, `tests/ui/register-heading.probe.mjs`,
`tests/ui/register-table.probe.mjs` and `tests/ui/responsive.probe.mjs`. They are measurement probes
against a running application, not part of any suite.

## Open, not done and not claimed

- CI has not run: every result above is local, and the pull request's own run is the first.
- The EQ-01 build plan r02 and desktop mockup r10 are not in the repository and were not supplied. The
  written contract was implemented; nothing else is registered, hashed or described as either file, and
  no UI baseline is registered by this change.
- `/engineering`, `/service/technicians` and `/sales/opportunities` keep their page geometry under
  in-force UI baselines. Extending the register rules to them needs a baseline revision, which is the
  owner's decision.
- `/estimating/discovery`, `/finance/handoffs` and `/email` keep visible titles their breadcrumbs do not
  carry. Aligning them would mean renaming those destinations in `src/shell/navigation.ts`, which
  changes the More menu, the module tabs and the page guide; that is a naming decision, not a
  presentation one.
- `/customers`, `/people`, `/sites` and `/equipment` show two tab rows: the shell's module tabs and the
  page's own record tabs. That duplication predates this change. Removing the shell row would mean
  registering these routes as module workspaces, which is a baseline registration.
- Finance's two supporting tables inside record sections keep their inner wrappers; the supporting-table
  rule is not yet applied there.
- No physical device, assistive technology, owner visual acceptance or business acceptance is
  established by anything above.
