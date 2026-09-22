# Department navigation icons — implementation handover

**State:** implementation and verification in progress; no merge or deployment of navigation.

Authority: [implementation prompt r01](../reference/ui/application-shell/PPO-Department-Navigation-Icons-VS-Code-Implementation-Prompt-r01.md), [design register r02](../reference/ui/application-shell/PPO-Department-Navigation-Icon-Register-r02.md) and [decision](../decisions/department-navigation-icons.md). Supplied source bytes are retained unchanged. Exact starting base: `9fa8bd5a40232e4f432b431a235bdb34a9dbbebe`; branch `feat/department-navigation-icons`, isolated worktree `tmp/en07-change-impact/tmp/department-navigation-icons`.

PR #277 was open/draft at that starting head. It subsequently merged as `d6251b42f5c969f537a6397c1823f8c871e4d4d1`; remote main was rechecked at `c01106a884f50c2060da36333c218f93228563bf`, including separately merged ES-08 audit #278. Navigation reconciliation and final validation are pending. No ES-08 geometry document, schema or calculation is authored by this contribution.

## Destination coverage

Every requested primary position is defined in `departmentRails`; every glyph has an outline/active pair. Runtime links require explicit readiness and the existing server-derived permissions. No grant or database migration is added. My Work leads the six non-Sales rails and remains in Sales More; More is fixed below the scrolling links.

Sales wires Pulse, Leads, Deals, Activities, Tasks, Sales Inbox and Contacts. Products and Insights remain withheld: there is no shared catalogue index/service or Sales performance analysis service in the inspected source. This is the shared navigation/icon rollout with those dependencies, not a complete nine-page Sales rail.

The bounded Pulse uses existing personal lead/deal actions and existing next-step/overdue-deal projections. Tasks selects existing Task records linked to Lead/Opportunity. Both reuse My Work's exact row and completion/reschedule dialogs. The Activities scope selects existing lead/deal calls, email, meetings and site visits from the calendar; task deadlines remain on the general calendar and Tasks. Brisbane civil-day handling remains. Pulse does not invent a lead-response SLA, quotation-follow-up count or blocked-work metric that the source does not expose.

Contacts wraps the existing authorised People/Organisations directory with URL views and an identity-scoped remembered view. The current directory lists `ppo.organisations` using `shared.read` visibility and has no customer-only predicate. Existing status remains Active/Inactive/Prospect, and Person affiliations retain their role labels. No new multi-role organisation editing schema or supplier-completeness claim is introduced. Customer accounts remains Finance-specific.

Quotations selects exact permitted saved revisions from up to 100 recent authorised estimates, reusing list/read/quote guards. Programme is a project chooser opening an existing Gantt schedule with a restorable programme context. Customer accounts uses existing Finance options and rechecks each account's exact guard before returning its link. These are bounded route adapters, not new domain modules.

Detailed per-destination coverage and final executed evidence will be recorded here after compiled-browser validation.

## Validation in progress

Fourteen focused navigation/shell unit tests passed before reconciliation. Lint/typecheck/build and browser results are pending final-head verification. The first build attempts encountered Windows sandbox user-resolution and Turbopack external-dependency-junction constraints; the isolated worktree now has its own pinned dependency copy. The synthetic verification database runs on loopback port 55443, application port 3043, independently of other workstreams.

Final integration requires current-main reconciliation, preservation of all Fertigation routes, reviewed shared-file diffs and fresh navigation/shell/compiled-browser checks. Owner visual acceptance and production readiness remain separate.
