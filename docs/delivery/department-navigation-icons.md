# Department navigation icons — implementation handover

**State:** implemented and locally verified on the isolated branch; PR review and owner visual acceptance remain separate. No navigation merge or deployment.

Authority: [implementation prompt r01](../reference/ui/application-shell/PPO-Department-Navigation-Icons-VS-Code-Implementation-Prompt-r01.md), [design register r02](../reference/ui/application-shell/PPO-Department-Navigation-Icon-Register-r02.md) and [decision](../decisions/department-navigation-icons.md). Supplied source bytes are retained unchanged. Exact starting base: `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe`; branch `feat/department-navigation-icons`, isolated worktree `tmp/en07-change-impact/tmp/department-navigation-icons`.

PR #277 was open/draft at that starting head. It completed at `876e92ab288b682e85f58773c7b02e340a7ab63e` and merged at 2026-09-22T10:22:56Z as `d6251b42f5c969f537a6397c1823f8c871e4d4d1`. Current main `c01106a884f50c2060da36333c218f93228563bf`, including separately merged ES-08 audit #278, was merged conflict-free into this branch as `fb461236615167d36b49dee25662e488ff6b6e6e`. A final remote check still showed that main. All affected checks below ran after reconciliation. No ES-08 geometry document, schema or calculation is authored by this contribution.

Absolute worktree: C:/Users/Dean.Fiedler/Projects/powerplants-one/tmp/en07-change-impact/tmp/department-navigation-icons. Initial remote main was `0c95c5af776c97374997623bd1070d9de480cf82`. Existing Priva and ES-08 worktrees were left untouched. Shared-file review covered navigation.ts, module-workspaces.ts, shell components, shell reads/model, shared/scoped CSS, shell/browser tests and status/guidance. Module-workspaces.ts is byte-identical to reconciled main; Fertigation workspace and child routes remain registered. The resulting navigation diff changes no migration, seed, permission capability, Fertigation domain implementation or ES-08 audit file.

## Destination coverage

Every requested primary position is defined in `departmentRails`; every glyph has an outline/active pair. Runtime links require explicit readiness and the existing server-derived permissions. No grant or database migration is added. My Work leads the six non-Sales rails and remains in Sales More; More is fixed below the scrolling links.

Sales wires Pulse, Leads, Deals, Activities, Tasks, Sales Inbox and Contacts. Products and Insights remain withheld: there is no shared catalogue index/service or Sales performance analysis service in the inspected source. This is the shared navigation/icon rollout with those dependencies, not a complete nine-page Sales rail.

The bounded Pulse uses existing personal lead/deal actions and existing next-step/overdue-deal projections. Tasks selects existing Task records linked to Lead/Opportunity. Both reuse My Work's exact row and completion/reschedule dialogs. The Activities scope selects existing lead/deal calls, email, meetings and site visits from the calendar; task deadlines remain on the general calendar and Tasks. Brisbane civil-day handling remains. Pulse does not invent a lead-response SLA, quotation-follow-up count or blocked-work metric that the source does not expose.

Contacts wraps the existing authorised People/Organisations directory with URL views and an identity-scoped remembered view. The current directory lists `ppo.organisations` using `shared.read` visibility and has no customer-only predicate. Existing status remains Active/Inactive/Prospect, and Person affiliations retain their role labels. No new multi-role organisation editing schema or supplier-completeness claim is introduced. Customer accounts remains Finance-specific.

Quotations selects exact permitted saved revisions from up to 100 recent authorised estimates, reusing list/read/quote guards. Programme is a project chooser opening an existing Gantt schedule with a restorable programme context. Customer accounts uses existing Finance options and rechecks each account's exact guard before returning its link. These are bounded route adapters, not new domain modules.

The [coverage register](department-navigation-coverage.md) records all **57 canonical positions: 33 wired, 24 withheld** (My Work repeats across six departments), with route, glyph, existing access source, readiness, active parent and each missing capability.

| Department | Wired destinations |
|---|---|
| Sales | Pulse, Leads, Deals, Activities, Tasks, Sales Inbox, Contacts |
| Estimating & Quotation | My Work, Estimation wizard, Estimates, Specialist configurations, Quotations |
| Engineering & Design Control | My Work, Engineering workload, Materials & substitutions, Change review, Commissioning & as-built |
| Projects & Commercial Delivery | My Work, Projects, Programme, Acceptance & closeout |
| Service Operations | My Work, Service requests, Work orders, Schedule, Field team, Job packs, Service review, Equipment |
| Supply Chain Management | My Work; all seven business destinations withheld |
| Finance & Commercial Controls | My Work, Finance handoffs, Customer accounts |

Missing capabilities comprise Sales Products/Insights; estimating intake, supplier pricing and approvals; engineering basis/interfaces, drawings and technical reviews; project readiness, risks, variations and assurance; all seven Supply destinations; and Finance performance, claims, cash, reconciliation and exceptions. General Documents and Settings also remain withheld where no landing exists. Designs and record actions are not presented as implemented registers.

Programme's view=programme contract is consumed by the existing project schedule and supplies a return to its chooser; Projects retains creation and its normal schedule. Contacts views and department preferences are scoped per identity. My Work criteria and calendar day updates retain department URL context. Fertigation remains in Estimating More and selects Specialist configurations for its existing child routes.

## Executed validation

Windows; Node 24.21.0; Chrome 153.0.8010.53; pinned Playwright 1.63.0. The first build attempts encountered Windows sandbox user-resolution and Turbopack external-dependency-junction constraints; this worktree has its own existing pinned dependency copy, with no dependency/lockfile change. Disposable ppo_synthetic_test runs on loopback 55443 and the compiled app on 3043, independently of other workstreams.

| Check | Executed result |
|---|---|
| npm run build, lint, typecheck | Pass after reconciliation and final context fixes |
| Focused navigation/shell/work-view/CRM-location unit tests | **23 passed** |
| Full npm run test:unit | **323 passed / 4 failed**, 327 total |
| Untouched-main comparison | Same four failures at c01106a: two document-store tests, recovery private-path test and warm-routes Windows separator assertion |
| Serial department-navigation, desktop-shell and email-calendar database suites | **8 passed**; real access guards, calendar types/day boundaries and revocation |
| Compiled playwright.navigation.config.ts browser suite | **14 passed** |
| Icon component fixture | **62 outline/active pairs** rendered and visually inspected at 25px, including nine Sales icons; unavailable samples are non-links |
| check_foundation.py; check_naming.py; git diff --check | Pass; documentation assurance is not business acceptance |

Browser proof covers all seven exact permitted rails, geometry/centering, active drawings, tooltip/focus/Escape, fixed More under scrolling, shared record/reload/history/new-tab context, unavailable storage, exact Finance account selection, Programme chooser/schedule/return, preserved Fertigation navigation, existing shell cases, and restricted/explicit empty-access fixtures. The empty-access response is a labelled UI fixture; account denial uses the real server. A task with the same saved ID is displayed in Sales Tasks, Pulse and My Work, then completed through the original handler. Board/List/Forecast and populated Deals cards remain operational.

Visual inspection covers 1440x900, 1280x600, 1280x400, 390x844 phone and 720x450 reflow equivalent to 200% desktop layout zoom. **Native Chrome UI zoom at 200%, physical devices and screen-reader acceptance were not tested.** The evidence does not claim them.

QA corrected off-centre rail links, Pulse's inherited horizontal layout, disappearing exterior active-icon strokes, a focus tooltip dismissed by scrolling, My Work stripping department query context and the missing Lead visibility flag in the bounded Sales calendar. One startup connection race was rerun after server readiness.

## Evidence and next step

PR [#279](https://github.com/deanrfiedler-gif/powerplants-one/pull/279) initially exposed compatibility gaps in retained assurance at head 9c33df8: the Projects component router fixture lacked useSearchParams; shell fixtures lacked the identity preference key; assertions still expected the former empty rail, planned More entries, Opportunity wording, Service planner and Exceptions and recovery. The same-action navigation test also assumed its undated task would be on the first page of an otherwise shared test database. The repair retains geometry, access, identity, persistence and recovery checks while updating exact navigation labels/contracts and following the real cursor controls. CRM/quality proof origins now honour the configured isolated port; no app/domain or permission change is part of this repair.

Local follow-up passed 37 CRM component cases (26 existing project skips), 5 Projects component cases, all 16 retained CRM I2 desktop/mobile cases, 2 CRM empty/denied-state cases, the 4 previously failing quality cases across desktop/mobile, and the 14 compiled navigation/shell cases after accumulated CRM fixtures. The quality request helper's 6 unit cases passed. The CRM write/verify proof passed across a real restart of the navigation app and its own PostgreSQL cluster on 55443; original actions, ownership history and exact receipts persisted. The other workstream's port 3000 was untouched. Lint/typecheck passed. Updated CI remains a separate gate; local proof does not supersede it.

Repair logs remain in tmp/nav-proof: crm-ui-fix.log, projects-ui-fix.log, crm-i2-fix.log, crm-empty-fix.log, quality-fix.log, quality-helper-unit.log, navigation-ci-fix.log and crm-restart-write/verify.log. Component screenshots remain under verification-evidence/crm-ui-tests and projects-ui-tests; persisted CRM/quality traces under verification-evidence/navigation-ci-repair and crm-i1-restart. No reference screenshot baseline was replaced.

[Screenshots, hashes and changed-file manifest](../testing/evidence/department-navigation/README.md) are retained for PR review. Raw logs/traces/fixture HTML remain under tmp/nav-proof and verification-evidence/department-navigation in this worktree. The existing Leads phone exception and field/offline layouts are retained. Sales visible wording uses Deals without renaming technical opportunity contracts; affected test-label edits are narrowly scoped.

The four baseline Windows failures, 24 missing-capability positions, native zoom/device review and owner visual acceptance remain explicit limits. If main advances, review shared navigation, CSS, shell tests and Fertigation routes again, reconcile and rerun affected checks. No #277 wait remains: it merged and is reconciled.

**Exact next bounded step:** review the navigation PR and screenshots, obtain owner visual acceptance and require affected PR CI before considering merge. This handover authorises no navigation merge, hosted migration or deployment.
