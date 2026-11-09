# Visibility-heavy list plan audit

Audit baseline: main `78a59498b5f15946b4fde1116236312e00401ba4`, 9 November 2026. Measurement and proposed follow-ups only. No application fixes.

## Corrected reference and authority

[Claude's correction](https://github.com/deanrfiedler-gif/powerplants-one/pull/877#issuecomment-6729711024) replaces the original baseline: the P01–P11 CI diagnostic read took 232.305 ms; 35 was the largest loop count among 15 logged nodes, not the full-plan maximum. The separate committed small-fixture proof records maximum 126, against 1,036 for frozen main, and candidate time 54.568 ms. These are different executions. The materialised cheap-join branch followed by visibility remains the reference pattern.

Dean's decision, given in chat in Codex's session; no [DEAN] comment: resume Prompt AA on the existing branch with no other scope change, use exhaustive `planNodes()` traversal for every measurement, and request Claude's one review on completion. [New claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/877#issuecomment-6729727885).

## Inventory method and boundaries

The scan covers `src/**/*.ts` and `src/**/*.tsx`, SQL LIMIT/OFFSET, cursor windows and imported query builders. The initial lexical scan is only a candidate generator; local SQL builders and callers must also be inspected. Single root-table queries whose visibility expands to permission/user/relationship subqueries are included as multi-table queries. Fixed bounded UI windows and selectors are included, even without a continuation control. A reader returning one aggregate SQL row containing a JSON page is included. Child lists with their own read endpoint are included; single-record workspaces containing bounded detail sections are excluded.

Tables below are physical tables referenced by the reader/query builder (joins and subqueries), not just the outer FROM. Every `scopeSql` expansion additionally reads `permission_grants` and `users`; shared/record visibility can traverse parent sites, organisations, relationships and permissions. These dependencies must not be mistaken for independent candidate rows. `jit off` means the reader explicitly issues `SET LOCAL jit = off`, not that the observed plan necessarily compiles with JIT.

`Row` means predicates or correlated subqueries in the query; `fence/row` means the reader has a CTE fence but still evaluates visibility within a fenced population or its correlated branches. These labels do not imply a safe plan. Paths and line numbers bind to the baseline above.

| Reader / source | Route or caller | Tables in reader / builder | Visibility placement | jit off | Priority |
| --- | --- | --- | --- | --- | --- |
| `src/shared/organisation-register.ts:16` — `organisationRegister` | `/api/v1/customers/register` | `organisations`, `users`, `site_parties`, `sites`, `facilities`, `opportunities`, `activities`, `activity_links` | Fence/row | Yes | 1 |
| `src/shared/sites.ts:21` — `sitesRegister` | `/api/v1/sites/register` | `sites`, `appointments`, `work_orders`, `site_parties`, `organisations`, `people`, `facilities`, `assets` | Fence/row | Yes | 2 |
| `src/activities/work-overview.ts:205` — `readWorkOverview` | `/api/v1/work/overview` | `activities`, `activity_links`, `projects`, `organisations`, `users`, `lead_candidates`, `people`, `opportunities`, `tickets`, `assets`, `sites` | Row | No | 3 |
| `src/crm/worklist.ts:36` — `listOpportunities` | `/api/v1/crm/opportunities` | `crm_stage_definitions`, `crm_pipeline_definitions`, `opportunity_events`, `opportunities`, `companies`, `users`, `organisations`, `sites`, `people`, `activities` | Fence, join and row | No | 4 |
| `src/projects/register.ts:14` — `projectRegister` | `/api/v1/projects/register` | `project_tasks`, `projects`, `organisations`, `sites`, `users` | Fence/row | No | 5 |
| `src/shared/facilities/reads.ts:270` — `registerFacilities` | `/api/v1/facilities/register` | `facilities`, `site_parties`, `sites`, `business_identities`, `assets`, `users` | Row | No | 6 |
| `src/equipment/reads.ts:39` — `equipmentRegister` | `/api/v1/equipment` | `assets`, `sites`, `facilities`, `site_parties`, `organisations`, `asset_served_facilities`, `asset_location_events` | Fence/row | No | 7 |
| `src/shared/people-register.ts:14` — `peopleRegister` | `/api/v1/people/register` | `person_company_contexts`, `people`, `relationships`, `organisations`, `sites`, `contact_notice_preferences`, `audit_events` | Fence/row | No | 8 |
| `src/conversations/reads.ts:50` — `listThreads` | `/api/v1/conversations` | `conversation_threads`, `conversation_messages`, `conversation_participants`, `conversation_asks`, `conversation_mentions`, `opportunities`, `projects` | Row | No | 9 |
| `src/estimating/workload.ts:32` — `readEstimatingWorkload` | `/api/v1/estimating/workload` | `opportunities`, `organisations`, `estimating_workspaces`, `sites`, `users`, `estimates`, `opportunity_handovers_due` | Fence/row | No | 10 |
| `src/activities/activities.ts:735` — `listActivities → listActivitiesWithClient` | `/api/v1/activities` | `activities`, `users`, `activity_links` | Row | No | Secondary window; see ranking |
| `src/activities/work-overview.ts:306` — `readWorkAgenda` | `/api/v1/work/agenda` | `activities`, `activity_links`, `projects`, `organisations`, `users`, `lead_candidates`, `people`, `opportunities`, `tickets`, `assets`, `sites` | Row | No | Secondary window; see ranking |
| `src/activities/work-overview.ts:356` — `listWork` | `/api/v1/work/actions, /api/v1/work/team` | `activity_links`, `activities`, `users`, `projects`, `organisations`, `lead_candidates`, `people`, `opportunities`, `tickets`, `assets`, `sites` | Row | No | Secondary window; see ranking |
| `src/activities/work-overview.ts:552` — `readWorkConflicts` | `/api/v1/work/conflicts` | `activities`, `activity_links`, `projects`, `organisations`, `users`, `lead_candidates`, `people`, `opportunities`, `tickets`, `assets`, `sites` | Row | No | Secondary window; see ranking |
| `src/activities/work-waiting.ts:37` — `listWorkWaiting` | `/api/v1/work/waiting` | `tickets`, `activities`, `users`, `sites`, `people` | Row | No | Secondary window; see ranking |
| `src/calls/lookup.ts:46` — `lookupNumber → context` | `/api/v1/calls/lookup` | `organisations`, `relationships`, `opportunities`, `lead_candidates`, `projects`, `activity_links`, `call_details`, `activities` | Row (bounded contextual lists) | No | Secondary window; see ranking |
| `src/conversations/reads.ts:350` — `linkableRecords` | `/api/v1/conversations/records` | `opportunities`, `projects` | Row | No | Selector: context-bound |
| `src/crm/directory.ts:120` — `readDirectory` | `/api/v1/crm/directory` | `sites`, `site_parties`, `facilities`, `opportunities`, `relationships`, `organisations`, `users` | Fence/row | No | Secondary window; see ranking |
| `src/crm/leads/reads.ts:298` — `listLeads` | `/api/v1/crm/leads` | `workspaces`, `lead_candidates`, `users`, `organisations`, `sites`, `people`, `activities` | Lateral join and row | No | Secondary window; see ranking |
| `src/crm/leads/reads.ts:423` — `leadOptions` | `/api/v1/crm/leads/options` | `companies`, `users`, `organisations`, `sites`, `site_parties`, `people`, `relationships` | Row | No | Selector: context-bound |
| `src/crm/planning-gaps.ts:34` — `listPlanningGaps` | `/api/v1/work/gaps` | `opportunities`, `users`, `organisations`, `people`, `activities` | Row | No | Secondary window; see ranking |
| `src/crm/planning-gaps.ts:84` — `listOverdueOpportunities` | `/api/v1/work/overdue-opportunities` | `opportunities`, `users`, `organisations`, `people`, `activities` | Row | No | Secondary window; see ranking |
| `src/crm/planning-gaps.ts:140` — `listPlannableParents` | `/api/v1/work/parents` | `opportunities`, `organisations`, `people`, `lead_candidates` | Row | No | Selector: context-bound |
| `src/crm/reads.ts:155` — `opportunityOptions` | `/api/v1/crm/options` | `companies`, `organisations`, `site_parties`, `sites`, `people`, `relationships`, `users` | Row | No | Selector: context-bound |
| `src/crm/worklist.ts:126` — `worklistOptions` | `/api/v1/crm/worklist-options` | `opportunities` | Row | No | Selector: context-bound |
| `src/email/service.ts:62` — `listEmail` | `/api/v1/email` | `email_messages` | Row | No | Secondary window; see ranking |
| `src/email/service.ts:103` — `emailOptions` | `/api/v1/email/[id]/options` | `opportunities` | Row | No | Selector: context-bound |
| `src/email/service.ts:242` — `readCalendar` | `/api/v1/calendar` | `email_calendar_events`, `activities`, `activity_links` | Row | No | Secondary window; see ranking |
| `src/engineering/register.ts:88` — `engineeringRegister` | `/api/v1/engineering/register` | `workspaces`, `engineering_packages`, `organisations`, `users`, `projects`, `opportunities`, `sites`, `engineering_deliverables`, `engineering_bases`, `engineering_queries`, `engineering_submittals`, `engineering_reviews`, `engineering_findings`, `engineering_issues`, `engineering_source_lineage`, `material_sources`, `material_source_changes` | Fence/row | No | Secondary window; see ranking |
| `src/engineering/service.ts:199` — `listEngineering` | `/api/v1/engineering` | `engineering_reviews`, `engineering_issues`, `engineering_deliverables`, `engineering_packages`, `organisations`, `users`, `projects`, `opportunities`, `sites`, `engineering_bases`, `engineering_queries`, `engineering_submittals`, `engineering_findings`, `engineering_source_lineage`, `material_sources`, `material_source_changes` | Row | No | Secondary window; see ranking |
| `src/engineering/service.ts:478` — `engineeringOptions` | `/api/v1/engineering/options` | `users`, `organisations`, `sites` | Row | No | Selector: context-bound |
| `src/equipment/evidence.ts:725` — `equipmentEvidence` | `/api/v1/equipment/bulletins, /api/v1/equipment/support, /api/v1/equipment/backups` | `users`, `assets`, `equipment_backup_reviews` | Row | No | Secondary window; see ranking |
| `src/equipment/evidence.ts:953` — `equipmentInstruments` | `/api/v1/equipment/instruments` | `inspection_instruments`, `inspection_instrument_uses`, `inspection_attempts`, `inspection_results` | Row | No | Secondary window; see ranking |
| `src/equipment/options.ts:11` — `equipmentOptions` | `/api/v1/equipment/options` | `companies`, `assets`, `sites`, `facilities`, `users`, `permission_grants` | Row | No | Selector: context-bound |
| `src/estimating/discovery-form-options.ts:17` — `discoveryFormOptions` | `/api/v1/estimating/workspaces/form-options` | `sites`, `site_parties`, `facilities`, `assets`, `users` | Row | No | Selector: context-bound |
| `src/estimating/fertigation/reads.ts:39` — `listScopes` | `/api/v1/estimating/fertigation` | `fertigation_scopes`, `fertigation_revisions` | Row | No | Secondary window; see ranking |
| `src/estimating/quotations/reads.ts:25` — `listQuotations` | `/api/v1/estimating/quotations` | `workspaces`, `draft_quotes`, `draft_quote_revisions`, `estimates`, `opportunities`, `quote_release_bases` | Row | No | Secondary window; see ranking |
| `src/estimating/reads.ts:14` — `estimatingOptions` | `/api/v1/estimating/options` | `estimating_workspaces`, `opportunities`, `organisations`, `sites`, `estimates` | Row | No | Selector: context-bound |
| `src/estimating/reads.ts:24` — `listEstimates` | `/api/v1/estimating/estimates` | `estimates`, `estimate_versions`, `opportunities`, `organisations` | Row | No | Secondary window; see ranking |
| `src/estimating/review/queue.ts:32` — `readEstimatingReviewQueue` | `/api/v1/estimating/reviews` | `workspaces`, `estimates`, `estimate_review_events`, `estimate_versions`, `opportunities`, `organisations`, `users`, `draft_quotes`, `quote_release_bases`, `draft_quote_revisions` | Fence/row | Yes | Secondary window; see ranking |
| `src/estimating/sources/reads.ts:19` — `listCostSources` | `/api/v1/estimating/cost-sources` | `cost_sources`, `cost_source_revisions`, `cost_source_events`, `companies` | Row | No | Secondary window; see ranking |
| `src/estimating/sources/register.ts:164` — `listCostSourceRegister` | `/api/v1/estimating/cost-sources/register` | `workspaces`, `companies`, `cost_sources`, `cost_source_revisions` | Row | No | Secondary window; see ranking |
| `src/estimating/specialist/reads.ts:50` — `listConfigurations` | `/api/v1/estimating/configurations` | `specialist_configurations`, `specialist_drafts` | Row | No | Secondary window; see ranking |
| `src/finance/reads.ts:77` — `listFinance` | `/api/v1/finance/handoffs` | `finance_events`, `finance_reviews`, `finance_processing_attempts`, `finance_handoffs`, `users`, `work_orders`, `organisations`, `finance_accounts` | Row | No | Secondary window; see ranking |
| `src/maintenance/reads.ts:622` — `options` | `/api/v1/maintenance/options` | `users`, `organisations`, `sites`, `assets` | Row | No | Selector: context-bound |
| `src/notifications/service.ts:91` — `notificationInbox` | `/api/v1/notifications` | `activities`, `notification_events`, `notification_states` | Row | No | Secondary window; see ranking |
| `src/outputs/reads.ts:261` — `listOutputs` | `/api/v1/document-outputs` | `packs`, `service_reports` | Row | No | Secondary window; see ranking |
| `src/products/imports.ts:649` — `listImports` | `/api/v1/products/imports` | `product_imports` | Row | No | Secondary window; see ranking |
| `src/products/reads.ts:21` — `listProducts` | `/api/v1/products` | `products`, `product_revisions`, `companies` | Row | No | Secondary window; see ranking |
| `src/products/relationships.ts:197` — `listRelationships` | `/api/v1/products/relationships` | `product_relationships`, `product_revisions`, `product_relationship_reviews` | Row | No | Secondary window; see ranking |
| `src/projects/acceptance/reads.ts:22` — `readWorkspace` | `/api/v1/projects/acceptance` | `workspaces`, `acceptance_stages`, `users`, `people`, `relationships`, `acceptance_events` | Row | No | Secondary window; see ranking |
| `src/projects/portfolio.ts:196` — `readPortfolio` | `/api/v1/projects/portfolio` | `projects`, `organisations`, `sites`, `users`, `people`, `project_tasks`, `project_schedule_baselines`, `activities`, `activity_links`, `project_raid_entries`, `project_raid_revisions` | Fence/row | No | Secondary window; see ranking |
| `src/projects/service.ts:103` — `listProjects` | `/api/v1/projects` | `projects`, `organisations`, `sites`, `users` | Row | No | Secondary window; see ranking |
| `src/projects/service.ts:482` — `projectOwners` | `/api/v1/projects/[id]/owners` | `people`, `relationships` | Row | No | Secondary window; see ranking |
| `src/projects/service.ts:504` — `projectOptions` | `/api/v1/projects/options` | `organisations`, `site_parties`, `sites` | Row | No | Selector: context-bound |
| `src/reports/service.ts:814` — `listReports` | `/api/v1/reports` | `service_reports`, `report_revisions`, `customer_responses`, `report_presentations`, `customer_response_contexts`, `report_follow_ups`, `activities`, `report_reviews` | Row | No | Secondary window; see ranking |
| `src/scheduling/demand.ts:54` — `readUnassignedDemand → demandSnapshot` | `/api/v1/schedule/demand` | `work_orders`, `sites`, `organisations`, `scope_revisions`, `appointments` | Row | No | Secondary window; see ranking |
| `src/scheduling/planner.ts:1201` — `listResources` | `/api/v1/selectors/resources` | `resources`, `resource_sites` | Row | No | Secondary window; see ranking |
| `src/scheduling/planner.ts:1599` — `readSchedule → scheduleSnapshot` | `/api/v1/schedule` | `appointments`, `work_orders`, `assignments`, `resources`, `resource_sites` | Row | No | Secondary window; see ranking |
| `src/scheduling/policy-impact.ts:39` — `readPolicyImpact` | `/api/v1/schedule/policy-impact` | `scheduling_policies`, `appointments`, `work_orders`, `scope_revisions`, `sites`, `users`, `scope_assets`, `assets` | Row | No | Secondary window; see ranking |
| `src/scheduling/workspace-reads.ts:87` — `readChanges` | `/api/v1/schedule/changes` | `appointments`, `work_orders`, `schedule_change_requests`, `assignments` | Row | No | Secondary window; see ranking |
| `src/service/escalations/reads.ts:98` — `caseOptions` | `/api/v1/service/escalations/options` | `workspaces`, `assets` | Row | No | Selector: context-bound |
| `src/service/escalations/reads.ts:147` — `listCases` | `/api/v1/service/escalations` | `workspaces`, `service_escalation_cases`, `users`, `service_escalation_events` | Row | No | Secondary window; see ranking |
| `src/service/findings/window.ts:12` — `readFindings → candidateWindow` | `/api/v1/service/findings` | `assignments`, `resources`, `scope_revisions`, `inspection_defects`, `service_inspection_bindings`, `inspection_results`, `incident_actions`, `incidents`, `incident_bindings`, `report_revisions`, `customer_responses`, `service_reports`, `appointments`, `work_orders`, `sites`, `assets`, `activities`, `users`, `scope_assets`, `inspection_defect_attempts`, `inspection_attempts`, `service_inspection_templates`, `schedule_follow_ups`, `finding_next_actions` | Row | No | Secondary window; see ranking |
| `src/service/intake.ts:728` — `listTickets` | `/api/v1/service/tickets` | `tickets`, `users`, `sites`, `assets` | Row | No | Secondary window; see ranking |
| `src/service/project-field-work.ts:242` — `fieldWorkCandidates` | `/api/v1/projects/[id]/field-work/candidates` | `appointments` | Row | No | Secondary window; see ranking |
| `src/service/work-orders.ts:1301` — `listWorkOrders` | `/api/v1/service/work-orders` | `work_orders`, `sites`, `organisations`, `scope_revisions`, `coverage_assessments` | Row | No | Secondary window; see ranking |
| `src/shared/contacts/reads.ts:104` — `primaryContactOptions` | `/api/v1/sites/[id]/primary-contact/options` | `people`, `person_company_contexts` | Row | No | Selector: context-bound |
| `src/shared/context.ts:18` — `companyOptions` | `/api/v1/selectors/companies` | `companies`, `sites` | Row | No | Selector: context-bound |
| `src/shared/context.ts:214` — `siteHistory` | `/api/v1/sites/[id]/history` | `history_records`, `assets` | Row | No | Secondary window; see ranking |
| `src/shared/cs/service.ts:970` — `listCs` | `src/shared/cs/http.ts → account plans, site readiness and surveys` | `activities`, `cs_record_events`, `cs_snapshots`, `users`, `site_surveys`, `sites`, `customer_plans`, `site_readiness` | Row | No | Secondary window; see ranking |
| `src/shared/facilities/reads.ts:518` — `facilityEquipment` | `/api/v1/facilities/[id]/equipment` | `asset_served_facilities`, `assets`, `facilities`, `users`, `facility_sources` | Row | No | Secondary window; see ranking |
| `src/shared/reads.ts:251` — `listShared (Organisation, Person, Site, Facility, Asset)` | `/api/v1/{customers,people,sites,facilities,assets}` | `organisations`, `people`, `sites`, `facilities`, `assets` | Row | No | Secondary window; see ranking |
| `src/shared/reads.ts:390` — `assetHistory` | `/api/v1/assets/[id]/history` | `history_records` | Row | No | Secondary window; see ranking |
| `src/supply/inventory.ts:18` — `inventory` | `/api/v1/supply/records` | `supply_records`, `companies`, `supply_usable`, `users`, `supply_allocations` | Row | No | Secondary window; see ranking |
| `src/supply/reads.ts:119` — `register` | `/api/v1/supply/records` | `supply_records` | Row | No | Secondary window; see ranking |
| `src/supply/reads.ts:274` — `options` | `/api/v1/supply/options` | `companies`, `sites`, `users`, `resources` | Row | No | Selector: context-bound |

## Ranking before measurement

Priority is a qualitative combination of join/visibility depth and primary-screen exposure, not measured production traffic. Ten measurements sample distinct query shapes on primary work/register screens; no timings were used to choose them.

1. Organisation register: multiple independently scoped aggregates and correlated follow-ups; mandatory starting point.
2. Sites register: correlated organisations, facilities, equipment and visits; mandatory starting point.
3. My Work overview: seven lateral link selections, parent joins and activity visibility, default daily queue.
4. Deals worklist: eight outer joins, activity visibility in a join, opportunity visibility, per-deal event history.
5. Projects register: parent organisation/site/user joins, correlated milestone and risk tasks and project visibility before its cursor window. Source inspection found no current screen caller for the portfolio endpoint, so the Projects screen is the measured query.
6. Facilities register: sites, parent context, equipment and organisation relationships inside a paged search.
7. Equipment register: site/facility joins and per-equipment customer/served-area visibility aggregates.
8. People register: correlated affiliations, sites, notice preferences and correction evidence inside its permitted population.
9. Conversations: anchor visibility plus message, participant, ask and mention aggregates before its limit.
10. Estimating workload: opportunity/organisation/workspace joins, combined visibility and two bounded owner windows.

The closest follow-up is Service findings (`candidateWindow`): it has the broadest cross-domain source union and several visibility predicates, but is a specialist follow-up screen rather than one of the daily primary registers chosen in this first ten. Its complexity is not evidence of safety. The existing Estimating reviews queue already has an exhaustive small-table proof and branch fences, so repeating it would add less coverage. My actions/agenda/conflicts share the overview's link/visibility builder; the API-only Project portfolio has deeper derived branches but no current screen caller; generic Projects uses the same parent visibility with fewer derived branches; CRM directory overlaps the organisation/deal population. All remain separate inventory entries, and this sampling does not classify them.

Other domain queues (finance, engineering, supply, reports, customer/site requirements, specialist configurations, quotations, cost sources, fertigation and escalation cases) have narrower source families or specialist routes. Selectors are context-bound, usually with one primary source and fewer derived aggregates. These are lower priorities for this sample, not BOUNDED findings. Notifications and planning-gap/waiting windows reuse the activity/opportunity predicates sampled above. Products/imports/relationships, email/calendar and call context have narrower record families; acceptance and equipment evidence/instruments are specialist windows; scheduling demand/policy/change/resource windows are task-specific rather than the default register entry; shared generic and record-scoped history/equipment/owner lists have fewer derived branches or a fixed parent. These complete the lower-priority groups in the table. No claim about actual screen traffic is made.

## Exclusions

- Background operations and command validation: assistant `buildEnvelope` / `source-access`, preparation/render workers, imports' command paths, scheduling `guardBooking`, change/commissioning validation and facility command `derive`. LIMIT in these functions is not an interactive list read.
- Single-record reads: customer360, contactWorkspace, stakeholders, siteContext/siteOverview, readProjectOverview, controlRead, readOutput, discoveryHistoryCounts, project commercial/specialist workspaces, and exact history/detail lookups. Their embedded bounded sections do not create separate register endpoints.
- Paging after native per-record checks without a visibility-heavy paged SQL statement: maintenance `register`, template catalogue `listTemplates`, document-library `listDocuments`/`linkedDocuments`, field `listMyJobs`, owner selector `ownerOptions`, library selectors `libraryOptions`, and Work orders `readWorkOrderRegister` (its candidate query has no LIMIT/OFFSET or cursor; it pages with array slice). These can have application fan-out, a separate risk from the requested SQL planner audit.
- Pure history/source pages with parent authorisation outside the query and no in-query visibility helper: activity/facility/project audit history, facility sourcePage, discovery versions, product revision history and similar immutable ledgers.
- SQL builders are attributed to their exported reader rather than counted twice: rowSql, projectFactsSql, registerSnapshot, leadRegisterSource, equipment projection, and finding candidateWindow. Shell search and review aggregation reuse their inventory readers rather than create new SQL shapes.

## Measurement method and reproduction

[DECIDED by Codex] Use a manual proof alongside the database tests and preserve production query settings. The existing #870 capture matches only `WITH candidates AS`, its statistics assertion names six queue tables, and its EXPLAIN helper forces JIT off. Reusing those helpers wholesale would measure the wrong statement/settings. This proof imports the unchanged exhaustive `planNodes()` traversal and adds reader-specific statement capture and table-set statistics assertions. Reversing this choice means replacing the manual harness, not changing an application reader.

Run from the repository root after `scripts/cloud-setup.sh` succeeds, using the environment-file location printed by setup:

```bash
source /workspace/.ppo-tools/env.sh
node --env-file=.env.local --import tsx tests/database/visibility-plan-audit.proof.ts --analyse-control
```

This is a destructive, disposable proof restricted to `ppo_synthetic_test`. An optional `--reader=sites` (or another measurement-table ID) runs one pair. It resets the database separately for each reader, creates native synthetic records, measures the main statement, manually runs `ANALYZE` in this proof only, then measures the identical SQL with the original binds. Never run it alongside another database suite. It is outside `tests/database/*.test.ts`, has no test registrations and asserts no loop bound on unfixed readers. No routine CI command executes it. Outputs, including full recursive plans, SQL/binds, statistics, fixture IDs, counts and reader results, go to ignored `tmp/visibility-plan-audit/<reader>.json`.

Each fixture uses the native `coordinator` session with its existing grants and the native working-company context for the synthetic CRM company. It creates 30 linked sets through `createOrganisation`, `createPerson`, `addAffiliation`, `createSite`, `createFacility`, `createAsset`, `createOpportunity`, `createProject`, `saveTask` and `startThread`. IDs are unique and each primary table's actual count is asserted between 30 and 50. No raw INSERT is added. Native seed records remain: organisations 36, people 32, sites 36, facilities 40, equipment 35, opportunities 30, projects 30, project tasks 30 and threads 30. Each thread has a message and participant; each deal has its initial overdue activity. Activities total 37, links 98, site parties 39 and affiliations 32: native commands legitimately create more than one supporting row per candidate.

The selected readers' explicit candidate/supporting table sets are in `readers[].tables`. `assertNeverAnalysed` passed before and after each unanalysed measurement: both timestamps null and both analysis counters zero for every selected table. Control counters are positive after manual `ANALYZE`. All-table statistics are also retained as `dependencies`, including shared catalogues outside those assertion sets. In all ten final saved runs, these snapshots also have zero analysis counters throughout. A preliminary Facilities run had autoanalysed shared catalogues (including permissions); a fresh disposable repeat removed that ambiguity and still measured 40 loops. Its final pair is reported below. This does not assert that every table in the database has 30–50 rows. Seed appointments/work orders have 13/10 rows; lead candidates, contact notices, conversation asks/mentions and estimating workspaces are empty. Thus the workload result covers the 30 unstarted deals and the conversation result covers anchored threads/messages, not populated workspace/ask/mention branches. These are limits of the BOUNDED findings, not evidence for those branches.

The main SELECT runs normally and is immediately explained on the same connection, retaining any transaction established by the reader and its native settings. No planner setting is added. The EXPLAIN execution follows a real read and is consequently warm; these are single-run plan observations, not end-to-end latency distributions. The control repeats the same binds, including the original time boundary. Shared hits are the root plan's total, not the sum of cumulative counters from every node. Maximum loops use **every node** from `planNodes()`, including InitPlans/SubPlans; no top-N logging contributes to the maximum. The plan's top-level JIT presence is recorded separately from `SHOW jit`.

Visible rows mean the main statement's reported total matching visible population when it has one, otherwise its returned candidate window. In particular My Work's default overview window contains eight rows; registers may report more matches than their first page. The bound is exactly ten times that recorded denominator. This is the requested diagnostic rule, not a claim of asymptotic complexity.

| Reader ID | Screen/default input used | Caller evidence |
| --- | --- | --- |
| organisations | Organisation register, empty search/default view and sort | `src/components/organisation-register.ts:101` |
| sites | Sites register, empty search/default view and sort | `src/components/sites-register.ts:135` |
| my-work | My Work overview, native default owner/time window | `src/activities/work-overview.ts:205`, `/api/v1/work/overview` |
| deals | Deals initial worklist filters: active pipeline, Open outcome, Reference sort, limit 50 | `src/crm/worklist-location.ts:4`, imported by `src/components/crm-worklist.tsx:18` |
| projects | Projects register, native default Active view/target order | `src/components/projects-register.tsx:168` |
| facilities | Facilities list, `sort=site&area_view=all`, no fixed site | `src/components/facility-register.tsx:51` |
| equipment | Equipment register, native default view/order | `src/equipment/reads.ts:39`, `/api/v1/equipment` |
| people | People register, empty search/default view and sort | `src/components/people-register.tsx:114` |
| conversations | Conversations, native default view/window | `src/conversations/reads.ts:50`, `/api/v1/conversations` |
| estimating-workload | Estimating workload, native default owner/view/order | `src/components/estimating-workload.tsx:134` |

## Measurements — 9 November 2026

PostgreSQL 16.15; Node 24.21.0. Seven AT RISK and three BOUNDED in these fixtures. Every number below comes from the full plan, not a truncated diagnostic. `U` is the never-analysed candidate-table run; `A` is its manual ANALYZE control. Classifications use U. JIT sections were absent in **both** plans for all ten reads; native JIT was off for organisations/sites and on for the other eight.

| Reader | Visible / bound | Max loops U / A | Shared hits U / A | Execution ms U / A | Classification |
| --- | ---: | ---: | ---: | ---: | --- |
| organisations | 34 / 340 | 1,400 / 1,020 | 29,488 / 18,204 | 31.019 / 26.174 | AT RISK |
| sites | 34 / 340 | 654 / 40 | 15,342 / 1,962 | 17.993 / 5.271 | AT RISK |
| my-work | 8 / 80 | 960 / 32 | 9,593 / 2,790 | 12.545 / 8.950 | AT RISK |
| deals | 30 / 300 | 1,110 / 30 | 72,355 / 3,189 | 66.519 / 6.341 | AT RISK |
| projects | 30 / 300 | 552 / 35 | 6,261 / 718 | 5.092 / 8.136 | AT RISK |
| facilities | 40 / 400 | 40 / 40 | 1,054 / 491 | 1.224 / 0.885 | BOUNDED |
| equipment | 33 / 330 | 648 / 37 | 7,241 / 642 | 5.019 / 1.445 | AT RISK |
| people | 31 / 310 | 572 / 35 | 5,093 / 1,724 | 7.856 / 3.768 | AT RISK |
| conversations | 30 / 300 | 30 / 30 | 1,653 / 1,291 | 1.967 / 2.091 | BOUNDED |
| estimating-workload | 30 / 300 | 30 / 30 | 1,427 / 1,112 | 2.641 / 1.167 | BOUNDED |

The organisation register remains above its bound after statistics exist (1,020 > 340). The other six AT RISK reads fall below their bounds in the control. Projects demonstrates why elapsed time alone is insufficient: its control has fewer loops/hits but a slower individual execution. No claim of a statistically significant speed-up is made.

## Proposed follow-ups — no fixes implemented

Node numbers below identify these saved plans and are not stable across PostgreSQL versions or reruns. Tied maximum nodes are retained in each JSON. These are smallest source-local candidates for follow-up investigation, not proven remedies. Each needs its own pull request and another full-plan measurement; do not assert that inserting a fence anywhere will suffice.

| AT RISK reader | Named maximum node without statistics | Smallest candidate change in #870's pattern | Required frozen-oracle equivalence proof |
| --- | --- | --- | --- |
| Organisation register | `Nested Loop`, `SubPlan 8`, and its `permission_grants g_3`/`users u_4` index scans: **1,400** | In `src/shared/organisation-register.ts:109`, materialise cheap site-party/site/facility pairs before `shared.read` in `area_counts`, then aggregate authorised rows by organisation. Inspect the other independently scoped aggregate branches too: the analysed control still reaches 1,020, so one branch fence is not yet demonstrated sufficient. | Freeze the old complete reader and any changed builders. Assert explicit visible/hidden organisation counts, site/facility/deal counts and follow-up labels; retain name ambiguity, empty relationships, expired parties, all view/sort/cursor boundaries and cross-company restrictions. |
| Sites register | `Nested Loop`, `SubPlan 23`, and `permission_grants g_11` index scan: **654** | In `src/shared/sites.ts:103`, fence the cheap current site-party/organisation join before organisation visibility, then aggregate visible customer labels by site. Keep existing site permission and other derived branches. | Frozen reader; assert named visible sites and absent Restricted sites, exact customer/facility/equipment/visit counts, expired parties, invisible customer labels and first/next-page sort identity. |
| My Work overview | `Index Scan` on organisations `prjo`, organisations `opo` and people `opp`: **960** | In `src/activities/work-overview.ts:129`, materialise the cheap activity/link/parent join population before evaluating the combined visibility predicates and final window. Preserve lateral link selection and optional-parent semantics. | Freeze the old row builder as well as reader if changed; oracle must not reach the new builder. Assert multiple named activity kinds and explicit counts, including hidden/deleted parents, owner/company filters, equal due dates, timezone boundaries and exact default eight-row window/overflow counts. |
| Deals worklist | `Nested Loop`, `SubPlan 3`, activity `permission_grants g_1` and `users u_1` index scans (also SubPlan 4): **1,110** | In `src/crm/worklist.ts:85`, fence cheap opportunity/context/next-activity identity joins before activity/opportunity visibility. Preserve the LEFT JOIN's null action when action visibility refuses; do not turn that into removal of the deal. | Frozen reader and changed visibility/query builders; assert 30 named Open deals in the active pipeline, hidden deal exclusion, a visible deal with an inaccessible next action, exact stages/history/counts and first/next cursors under each sort. |
| Projects register | `Nested Loop`, `SubPlan 5`, and organisation `permission_grants g_3` index scan: **552** | In `src/projects/register.ts:73`, fence project/organisation/site/user cheap joins before `projectVisibility`; then compute existing authorised task facts and cursor window. | Freeze complete reader/builders; assert named Active and closed projects, explicit overdue milestone/risk counts, missing/hidden parents, equal target dates, owner filters and cursor boundaries. |
| Equipment register | `Nested Loop`, `SubPlan 1`, and organisation `permission_grants g` index scan: **648** | In `src/equipment/reads.ts:25`, materialise cheap site-party/organisation pairs before customer visibility, then aggregate by site for the equipment projection. Retain served-facility visibility separately. | Frozen projection and reader; assert explicit located/unlocated/Restricted populations, customer labels, served areas, multiple current parties, location history and exact page/order/view counts. |
| People register | `Nested Loop`, `SubPlan 16`, and organisation `permission_grants g_7` index scan: **572** | In `src/shared/people-register.ts:79`, fence relationship/permitted-person/organisation joins before organisation visibility in `affiliations`; then aggregate the authorised relationships by person. | Freeze reader/builders; assert explicit visible people and hidden people, multiple/expired affiliations, hidden organisation labels, site links, populated notice/correction branches and exact default/filtered/cursor pages. |

Every proposed proof must compare DTOs/ordering/counts against an oracle which cannot reach any edited helper. Deep equality alone is insufficient: assert explicit record counts, kinds, states and excluded identities before comparison. Repeat the never-analysed bound on the new and frozen statements, with identical principals and binds. No equivalence proof or application improvement is claimed by this audit.

## Validation and remaining work

The ten manual pairs executed against `ppo_synthetic_test`; raw artefacts remain ignored. The inventory contains 77 reader entries (some dispatch multiple kinds). Further priorities include populated optional branches and the unmeasured readers above. Claude decides follow-up prompts, one reader per pull request. Review, ready-head full CI and business acceptance are separate from these measurements.

`npm run check` passed (studio register, full lint, TypeScript, 1,437 unit tests with no skips, production build). A final focused lint/typecheck covers the subsequent input-metadata correction in the proof. Foundation, prototype, naming, status-source, documentation unit, migration numbering, documentation-scope and whitespace results are recorded in the draft-head completion comment.

Full database/HTTP/application CI is not run for this draft; the manual audit is the targeted database evidence. Cloud setup reported browser unavailable, so browser suites are not run locally and are left to ready-head GitHub CI. No business acceptance scenario is executed and no approval, deployment or merge is claimed.

### Raw run identity

These hashes identify local ignored outputs from this execution; rerunning creates new synthetic IDs and timings and will produce different hashes. They are not a substitute for the numeric table or reproduction script.

| Raw artefact | SHA-256 |
| --- | --- |
| `organisations.json` | `f60022eef6adc1808bc338b4cdeb5bf674a13b3ebda0b8ec0effda9bd228250e` |
| `sites.json` | `65a6cd3cba30ce640bcbb2307aab6d5a8e8f90158b9f0c9905f9d67189d6c080` |
| `my-work.json` | `93bc0e8497aee5c21e1ff81e814755337ee8b473479e06e0596c149ffcee2f2b` |
| `deals.json` | `12f371c4d0e6b18973c4458b24741b8dc05aa49617c092beba455a62e35b77f3` |
| `projects.json` | `c396f9b13a8efabfc53e59e42a64a19d361563b222760f81c0ccad79e36d137a` |
| `facilities.json` | `69209553b88a20fa0745b46b4a83243311101fbf76798dc0019689141d504892` |
| `equipment.json` | `beb7bca21d350d3bb5787044ac22ca6251477a54deab83a8cdbb530065d039bc` |
| `people.json` | `f259c467014d7e5c35b1501993e92de0a199b176c3ddebdab805663bddce1092` |
| `conversations.json` | `d6087b28a3591d01366a8ccb460d7f2377e05515212c976f1466a3736e4bc4e4` |
| `estimating-workload.json` | `a60e8efc235e18d2b848ee8254f6bff5b112215d942e1df0e68715fbc627a291` |
