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
node --env-file=.env.local --import tsx tests/database/visibility-plan-audit.proof.ts --analyse-control --size=30
node --env-file=.env.local --import tsx tests/database/visibility-plan-audit.proof.ts --analyse-control --size=45
node --env-file=.env.local --import tsx tests/database/visibility-plan-audit.proof.ts --analyse-control --compare
```

This is a destructive, disposable proof restricted to `ppo_synthetic_test`. An optional `--reader=sites` (or another measurement-table ID) runs one pair at the selected size. Only sizes 30 and 45 are accepted. `--compare` reads the retained two-volume files and writes `growth.json`; it does not reset or query the database. It resets the database separately for each reader, creates native synthetic records, measures the main statement, manually runs `ANALYZE` in this proof only, then measures the identical SQL with the original binds. Never run it alongside another database suite. It is outside `tests/database/*.test.ts`, has no test registrations and asserts no loop bound on unfixed readers. No routine CI command executes it. Outputs, including full recursive plans, SQL/binds, statistics, fixture IDs, counts and reader results, go to ignored `tmp/visibility-plan-audit/<reader>.json` at size 30 and `tmp/visibility-plan-audit/45/<reader>.json` at size 45. The original size-30 artefacts are retained unchanged for this comparison; their legacy `classification` fields are superseded by `growth.json`. New individual runs report only whether the screen bound was exceeded.

Both volumes use the native `coordinator` session with its existing grants and the native working-company context for the synthetic CRM company. It creates 30 or 45 linked sets through `createOrganisation`, `createPerson`, `addAffiliation`, `createSite`, `createFacility`, `createAsset`, `createOpportunity`, `createProject`, `saveTask` and `startThread`. IDs are unique and each primary table's actual count is asserted between the requested size and that size plus ten retained seed rows. No raw INSERT is added. At size 30, native seed records remain: organisations 36, people 32, sites 36, facilities 40, equipment 35, opportunities 30, projects 30, project tasks 30 and threads 30. At size 45 the actual primary counts are organisations 51, people 47, sites 51, facilities 55, equipment 50, opportunities/projects/tasks/threads 45 each. Forty-five new rows plus retained seeds is the requested approximate volume; counts are not silently truncated to 45. Each thread has a message and participant; each deal has its initial overdue activity. Activities total 37, links 98, site parties 39 and affiliations 32: native commands legitimately create more than one supporting row per candidate.

The selected readers' explicit candidate/supporting table sets are in `readers[].tables`. `assertNeverAnalysed` passed before and after each unanalysed measurement: both timestamps null and both analysis counters zero for every selected table. Control counters are positive after manual `ANALYZE`. All-table statistics are also retained as `dependencies`, including shared catalogues outside those assertion sets. In all twenty final saved runs across both volumes, these snapshots also have zero analysis counters throughout. A preliminary Facilities run had autoanalysed shared catalogues (including permissions); a fresh disposable repeat removed that ambiguity and still measured 40 loops. Its final pair is reported below. This does not assert that every table in the database has 30–50 rows. Seed appointments/work orders have 13/10 rows; lead candidates, contact notices, conversation asks/mentions and estimating workspaces are empty. Thus the workload result covers the 30 unstarted deals and the conversation result covers anchored threads/messages, not populated workspace/ask/mention branches. These are limits of the BOUNDED findings, not evidence for those branches.

The main SELECT runs normally and is immediately explained on the same connection, retaining any transaction established by the reader and its native settings. No planner setting is added. The EXPLAIN execution follows a real read and is consequently warm; these are single-run plan observations, not end-to-end latency distributions. The control repeats the same binds, including the original time boundary. Shared hits are the root plan's total, not the sum of cumulative counters from every node. Maximum loops use **every node** from `planNodes()`, including InitPlans/SubPlans; no top-N logging contributes to the maximum. The plan's top-level JIT presence is recorded separately from `SHOW jit`.

For the initial screen, the denominator was the main statement's reported total matching visible population when it had one, otherwise its returned candidate window. F1 makes each denominator explicit below and uses Facilities' separately reported total rather than counting its SQL look-ahead row. In particular My Work's default overview window contains eight rows; registers may report more matches than their first page. The bound is exactly ten times the stated denominator. This is the requested diagnostic rule, not a claim of asymptotic complexity.

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

## First-volume measurements — 9 November 2026

PostgreSQL 16.15; Node 24.21.0. The initial single-volume screen flagged seven reads above the loop bound and three below it; F1 below supersedes the original risk classification. Every number below comes from the full plan, not a truncated diagnostic. `U` is the never-analysed candidate-table run; `A` is its manual ANALYZE control. This table retains the original screen result; final classifications use both volumes below. JIT sections were absent in **both** plans for all ten reads; native JIT was off for organisations/sites and on for the other eight.

| Reader | Visible / bound | Max loops U / A | Shared hits U / A | Execution ms U / A | Single-volume screen |
| --- | ---: | ---: | ---: | ---: | --- |
| organisations | 34 / 340 | 1,400 / 1,020 | 29,488 / 18,204 | 31.019 / 26.174 | OVER SCREEN |
| sites | 34 / 340 | 654 / 40 | 15,342 / 1,962 | 17.993 / 5.271 | OVER SCREEN |
| my-work | 8 / 80 | 960 / 32 | 9,593 / 2,790 | 12.545 / 8.950 | OVER SCREEN |
| deals | 30 / 300 | 1,110 / 30 | 72,355 / 3,189 | 66.519 / 6.341 | OVER SCREEN |
| projects | 30 / 300 | 552 / 35 | 6,261 / 718 | 5.092 / 8.136 | OVER SCREEN |
| facilities | 40 / 400 | 40 / 40 | 1,054 / 491 | 1.224 / 0.885 | BOUNDED |
| equipment | 33 / 330 | 648 / 37 | 7,241 / 642 | 5.019 / 1.445 | OVER SCREEN |
| people | 31 / 310 | 572 / 35 | 5,093 / 1,724 | 7.856 / 3.768 | OVER SCREEN |
| conversations | 30 / 300 | 30 / 30 | 1,653 / 1,291 | 1.967 / 2.091 | BOUNDED |
| estimating-workload | 30 / 300 | 30 / 30 | 1,427 / 1,112 | 2.641 / 1.167 | BOUNDED |

The organisation register remains above its bound after statistics exist (1,020 > 340). The other six AT RISK reads fall below their bounds in the control. Projects demonstrates why elapsed time alone is insufficient: its control has fewer loops/hits but a slower individual execution. No claim of a statistically significant speed-up is made.

## F1: two-volume growth and final classifications

[Claude's one review](https://github.com/deanrfiedler-gif/powerplants-one/pull/877#pullrequestreview-5820770148) found that the single-volume bound did not distinguish ordinary correlated per-row subplans from super-linear repeated work. The original audit followed its acceptance criterion; this section replaces that criterion's risk interpretation.

Dean's decision, given in chat in Codex's session; no [DEAN] comment: address F1 with a second never-analysed volume, report growth/denominators, reclassify, retain the proposed fixes and re-rank them, then mark ready under rule 23 and request confirmation after the full suites. No application change is included.

All ten readers were rerun with **45 native fixture sets**, preserving the same caller, screen input, native JIT setting and SQL as the retained 30-set run. Before/after never-analysed assertions passed for all selected table sets. Manual ANALYZE controls at size 45 also passed same-SQL/binds/settings/count assertions. A preliminary 45-set People run had analysed shared dependencies, including permissions; its fresh repeat has none and is the final observation below (1,175 loops). No autovacuum setting was changed and no selected-table assertion was removed.

[DECIDED by Codex] Use a documented two-point loop-growth screen. The fixture growth factor is 45/30 = **1.5**; nominal linear and quadratic loop ratios are **1.5** and **2.25**. A reader is **BOUNDED** when its maximum loops meet the stated 10× denominator at both points. Among reads over that bound, a loop ratio above **1.875**, the midpoint between those two reference ratios, is **SUPER-LINEAR (AT RISK)**; otherwise it is **LINEAR OVER SCREEN**. This operational threshold separates the observed groups, not a statistical confidence interval or proof of asymptotic complexity. Reversing this choice means recomputing the screen from the retained raw ratios. Shared-hit and execution-time ratios are reported independently and cannot be inferred from loop ratios.

The result is **seven SUPER-LINEAR (AT RISK), zero LINEAR OVER SCREEN and three BOUNDED**. The seven loop ratios are 1.96–2.20, substantially beyond the nominal 1.5× fixture increase and near the 2.25× quadratic reference. Seed offsets mean actual table/population ratios vary; the denominator table makes that visible. The high-volume maxima remain on the same named branches as the low-volume maxima below. These observations support investigating the retained branch-fence proposals, but do not prove those fixes or reproduce #870's 5.4-second severity.

### Growth ratios (never-analysed runs)

Ratios are large/small, rounded only for display. Times are single warm EXPLAIN executions, not medians or controlled latency estimates. In particular, timing noise must not determine a growth classification.

| Reader | Max loops 30 → 45 | Loop ratio | Shared hits 30 → 45 | Hit ratio | Execution ms 30 → 45 | Time ratio | Final classification |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| organisations | 1,400 → 2,750 | 1.964× | 29,488 → 60,503 | 2.052× | 31.019 → 39.811 | 1.283× | SUPER-LINEAR (AT RISK) |
| sites | 654 → 1,309 | 2.002× | 15,342 → 20,182 | 1.315× | 17.993 → 21.086 | 1.172× | SUPER-LINEAR (AT RISK) |
| my-work | 960 → 2,115 | 2.203× | 9,593 → 70,627 | 7.362× | 12.545 → 32.450 | 2.587× | SUPER-LINEAR (AT RISK) |
| deals | 1,110 → 2,340 | 2.108× | 72,355 → 161,528 | 2.232× | 66.519 → 197.201 | 2.965× | SUPER-LINEAR (AT RISK) |
| projects | 552 → 1,169 | 2.118× | 6,261 → 13,709 | 2.190× | 5.092 → 11.565 | 2.271× | SUPER-LINEAR (AT RISK) |
| facilities | 40 → 55 | 1.375× | 1,054 → 4,617 | 4.380× | 1.224 → 2.509 | 2.050× | BOUNDED |
| equipment | 648 → 1,305 | 2.014× | 7,241 → 15,640 | 2.160× | 5.019 → 8.620 | 1.717× | SUPER-LINEAR (AT RISK) |
| people | 572 → 1,175 | 2.054× | 5,093 → 9,938 | 1.951× | 7.856 → 12.530 | 1.595× | SUPER-LINEAR (AT RISK) |
| conversations | 30 → 45 | 1.500× | 1,653 → 2,478 | 1.499× | 1.967 → 3.807 | 1.935× | BOUNDED |
| estimating-workload | 30 → 45 | 1.500× | 1,427 → 2,496 | 1.749× | 2.641 → 2.287 | 0.866× | BOUNDED |

Sites illustrates the difference between metrics: loops double while hits rise only 1.315×. Conversely Facilities' hits rise 4.380× although maximum loops track its population (40 → 55); BOUNDED here is explicitly the loop screen, not a claim of linear total work or a safe plan for every branch. Its 45-set execution is 2.509 ms. Follow-up coverage should investigate that buffer amplification before making a general safety claim. Estimating workload's lower measured time at the larger volume is also not evidence of a speed-up.

### Bound denominators

The 10× screen is not used to compare latency across readers. It retains each query's relevant population/window, with the basis named. The fixture-growth comparison is 30 → 45 native sets even when a screen window stays fixed.

| Reader | Denominator basis | Denominator 30 → 45 | Bound 30 → 45 |
| --- | --- | ---: | ---: |
| organisations | Reported visible population total | 34 → 49 | 340 → 490 |
| sites | Reported visible population total | 34 → 49 | 340 → 490 |
| my-work | Returned overview window | 8 → 8 | 80 → 80 |
| deals | Returned candidate window | 30 → 45 | 300 → 450 |
| projects | Reported visible population total | 30 → 45 | 300 → 450 |
| facilities | Reported visible population total | 40 → 55 | 400 → 550 |
| equipment | Reported visible population total | 33 → 48 | 330 → 480 |
| people | Reported visible population total | 31 → 46 | 310 → 460 |
| conversations | Returned candidate window | 30 → 45 | 300 → 450 |
| estimating-workload | Returned candidate window | 30 → 45 | 300 → 450 |

Facilities' reader reports total 55 from its separate count query (`src/shared/facilities/reads.ts:395`), while the main SQL fetches 51 rows for a 50-item page plus one look-ahead row (`:418`, `:423`). The size-45 raw capture retains that 51-row statement count; the comparison uses total 55, so the explicit bound is 550. At size 30 both counts were 40. Either interpretation stays BOUNDED, but only the stated total is used here. My Work deliberately retains its eight-item overview window; its underlying fixture grows while that denominator remains eight. Deals, Conversations and workload have unsaturated candidate windows of 30/45 in this fixture.

### Size-45 ANALYZE controls

JIT sections are absent from all twenty size-45 plans, just as at size 30. Native JIT remains off only for organisations/sites. All-table statistics snapshots after the final unanalysed runs have zero analysis counters, including dependencies beyond each selected assertion set.

| Reader | Maximum loops U / A | Shared hits U / A | Execution ms U / A |
| --- | ---: | ---: | ---: |
| organisations | 2,750 / 2,205 | 60,503 / 36,717 | 39.811 / 34.884 |
| sites | 1,309 / 55 | 20,182 / 2,775 | 21.086 / 5.686 |
| my-work | 2,115 / 47 | 70,627 / 4,790 | 32.450 / 32.324 |
| deals | 2,340 / 45 | 161,528 / 4,904 | 197.201 / 17.458 |
| projects | 1,169 / 50 | 13,709 / 1,243 | 11.565 / 2.947 |
| facilities | 55 / 55 | 4,617 / 710 | 2.509 / 1.355 |
| equipment | 1,305 / 52 | 15,640 / 963 | 8.620 / 1.881 |
| people | 1,175 / 50 | 9,938 / 2,777 | 12.530 / 10.976 |
| conversations | 45 / 45 | 2,478 / 1,981 | 3.807 / 2.953 |
| estimating-workload | 45 / 45 | 2,496 / 1,683 | 2.287 / 2.380 |

### Follow-up priority after F1

Sort the seven existing proposals by **unrounded maximum-loop growth descending**, then **size-45 shared hits descending**, then **size-45 execution time descending**. There are no loop-ratio ties here, so absolute cost is shown as the explicit secondary key rather than silently overriding growth. Small differences between ratios are not significant estimates of a complexity exponent. Deals has the largest absolute cost despite ranking third by loop growth. Claude chooses follow-up prompts; this table selects no fix.

| Rank | Existing proposal | Loop growth | Size-45 shared hits | Size-45 execution ms |
| ---: | --- | ---: | ---: | ---: |
| 1 | my-work | 2.203× | 70,627 | 32.450 |
| 2 | projects | 2.118× | 13,709 | 11.565 |
| 3 | deals | 2.108× | 161,528 | 197.201 |
| 4 | people | 2.054× | 9,938 | 12.530 |
| 5 | equipment | 2.014× | 15,640 | 8.620 |
| 6 | sites | 2.002× | 20,182 | 21.086 |
| 7 | organisations | 1.964× | 60,503 | 39.811 |

The proposed changes and frozen-oracle proof requirements below are unchanged; only their order follows the new ranking.

## Proposed follow-ups — no fixes implemented

Node numbers and counts below identify the retained size-30 plans and are not stable across PostgreSQL versions or reruns. Tied maximum nodes are retained in each JSON. These are smallest source-local candidates for follow-up investigation, not proven remedies. Each needs its own pull request and another full-plan measurement; do not assert that inserting a fence anywhere will suffice.

| AT RISK reader | Named maximum node without statistics | Smallest candidate change in #870's pattern | Required frozen-oracle equivalence proof |
| --- | --- | --- | --- |
| My Work overview | `Index Scan` on organisations `prjo`, organisations `opo` and people `opp`: **960** | In `src/activities/work-overview.ts:129`, materialise the cheap activity/link/parent join population before evaluating the combined visibility predicates and final window. Preserve lateral link selection and optional-parent semantics. | Freeze the old row builder as well as reader if changed; oracle must not reach the new builder. Assert multiple named activity kinds and explicit counts, including hidden/deleted parents, owner/company filters, equal due dates, timezone boundaries and exact default eight-row window/overflow counts. |
| Projects register | `Nested Loop`, `SubPlan 5`, and organisation `permission_grants g_3` index scan: **552** | In `src/projects/register.ts:73`, fence project/organisation/site/user cheap joins before `projectVisibility`; then compute existing authorised task facts and cursor window. | Freeze complete reader/builders; assert named Active and closed projects, explicit overdue milestone/risk counts, missing/hidden parents, equal target dates, owner filters and cursor boundaries. |
| Deals worklist | `Nested Loop`, `SubPlan 3`, activity `permission_grants g_1` and `users u_1` index scans (also SubPlan 4): **1,110** | In `src/crm/worklist.ts:85`, fence cheap opportunity/context/next-activity identity joins before activity/opportunity visibility. Preserve the LEFT JOIN's null action when action visibility refuses; do not turn that into removal of the deal. | Frozen reader and changed visibility/query builders; assert 30 named Open deals in the active pipeline, hidden deal exclusion, a visible deal with an inaccessible next action, exact stages/history/counts and first/next cursors under each sort. |
| People register | `Nested Loop`, `SubPlan 16`, and organisation `permission_grants g_7` index scan: **572** | In `src/shared/people-register.ts:79`, fence relationship/permitted-person/organisation joins before organisation visibility in `affiliations`; then aggregate the authorised relationships by person. | Freeze reader/builders; assert explicit visible people and hidden people, multiple/expired affiliations, hidden organisation labels, site links, populated notice/correction branches and exact default/filtered/cursor pages. |
| Equipment register | `Nested Loop`, `SubPlan 1`, and organisation `permission_grants g` index scan: **648** | In `src/equipment/reads.ts:25`, materialise cheap site-party/organisation pairs before customer visibility, then aggregate by site for the equipment projection. Retain served-facility visibility separately. | Frozen projection and reader; assert explicit located/unlocated/Restricted populations, customer labels, served areas, multiple current parties, location history and exact page/order/view counts. |
| Sites register | `Nested Loop`, `SubPlan 23`, and `permission_grants g_11` index scan: **654** | In `src/shared/sites.ts:103`, fence the cheap current site-party/organisation join before organisation visibility, then aggregate visible customer labels by site. Keep existing site permission and other derived branches. | Frozen reader; assert named visible sites and absent Restricted sites, exact customer/facility/equipment/visit counts, expired parties, invisible customer labels and first/next-page sort identity. |
| Organisation register | `Nested Loop`, `SubPlan 8`, and its `permission_grants g_3`/`users u_4` index scans: **1,400** | In `src/shared/organisation-register.ts:109`, materialise cheap site-party/site/facility pairs before `shared.read` in `area_counts`, then aggregate authorised rows by organisation. Inspect the other independently scoped aggregate branches too: the analysed control still reaches 1,020, so one branch fence is not yet demonstrated sufficient. | Freeze the old complete reader and any changed builders. Assert explicit visible/hidden organisation counts, site/facility/deal counts and follow-up labels; retain name ambiguity, empty relationships, expired parties, all view/sort/cursor boundaries and cross-company restrictions. |

Every proposed proof must compare DTOs/ordering/counts against an oracle which cannot reach any edited helper. Deep equality alone is insufficient: assert explicit record counts, kinds, states and excluded identities before comparison. Repeat the never-analysed bound on the new and frozen statements, with identical principals and binds. No equivalence proof or application improvement is claimed by this audit.

## Projects register candidate fences — 10 November 2026

[PR #889](https://github.com/deanrfiedler-gif/powerplants-one/pull/889) implements Dean's bounded Projects register follow-up against main `900daa9d0929c12251226c4a7ff02cce247ad9f9`. It began with a claim-only investigation while three build slots were occupied; after B2 #881 merged, the branch merged current main and froze the complete reader before implementation. B3 billing and My Work remain independent. The [shared-path coordination](https://github.com/deanrfiedler-gif/powerplants-one/pull/887#issuecomment-6754466464) places this section before the historical audit validation, leaving #887's disjoint My Work evidence intact.

Scope remains PJ01 / PPO-012 and PRJ-01, PRJ-02, PRJ-07 and PRJ-08 under the [existing register decision](../../../decisions/projects-register-native.md). Only `src/projects/register.ts` changes production code. `project_candidates` materialises the existing project/organisation/site/user inner joins and workspace restriction. `visible_projects` materialises the unchanged visibility predicate over those rows; lateral projections re-expose the original `p`, `o` and `s` aliases. `projectVisibility()` is interpolated unchanged, without any text rewrite, so nested aliases retain their SQL scopes. The original milestone lateral lookup and ordinary AtRisk-task count then run over the authorised rows. The explicit output projection, filters, counts, options, ordering, ordinal cursor lookup and public DTO remain intact. Visibility and task facts still precede the page window. No shared builder, other reader, permission/grant, schema, index, dependency, workflow, timeout or planner setting changes.

### Frozen oracle and measured result

`tests/helpers/projects-register-main.ts` contains the complete original reader from the baseline above, including validation, paging, cursor rejection, observation time and public projection. Only imports are relocated. Inverse relocation is byte-identical to main: original blob `e20c63d27933fdcf72b0538417ccfcede6c767ce`, SHA-256 `f28338afa4ba9ef4223eaef6adfd7f38172f5c0adb9167355f08e37ddedce1b1`. No helper was edited, and the oracle cannot reach the changed reader. The hash is asserted in the plan suite.

The [measurement record](2026-11-10-projects-register-candidate-cost.json) retains the native created IDs/counts, raw and public results/hashes, SQL and binds, exhaustive node metrics/paths, statistics and full raw-artefact hashes. Measurements use the unchanged native audit fixture via `auditDealFixture`, including its other supporting records and seed offsets, on disposable `ppo_synthetic_test`. PostgreSQL 16.15, Node 24.21.0, npm 11.19.0; native JIT is on and neither plan has a JIT section.

| Native projects / bound | Maximum loops baseline → fixed | Shared hits baseline → fixed | Execution ms baseline → fixed | Planning ms baseline → fixed |
| --- | ---: | ---: | ---: | ---: |
| 30 / 300 | 550 → **30** | 6,300 → 1,213 | 9.170 → 5.013 | 2.469 → 3.333 |
| 45 / 450 | 1,183 → **45** | 13,766 → 2,570 | 21.939 → 4.514 | 1.563 → 2.332 |

The denominator remains the **reported visible population**, exactly 30/45, not the SQL statement's one JSON row or a smaller page size. Every EXPLAIN node is traversed, including SubPlans and InitPlans: 59 baseline nodes and 62 fixed nodes at each volume. Every fixed node passes the 10× bound; the same assertion fails on each frozen baseline. Baseline maxima are in the repeated organisation-visibility branch. The fixture explicitly asserts every project ID and exact Active/Mine/All counts of 30/45, zero Closed/Overdue/AtRisk/NoTarget counts, null milestones, zero risks and no cursor. Both raw SQL results and complete public outputs are equal, with identical binds and a shared frozen JavaScript observation clock after fixture writes; PostgreSQL grant clocks remain real.

Loop growth over the two volumes is **2.151× → 1.500×**. Shared-hit growth is separately **2.185× → 2.119×**, and execution-time growth **2.392× → 0.900×**. Buffer growth is not claimed linear. Timings are individual warm EXPLAIN observations, not endpoint latency, distributions or production-load acceptance. Fresh UUIDs and encounter order vary, so the new baseline maxima need not equal the original audit's 552/1,169.

The ten candidate/supporting tables must be never-analysed before and after both readers, including `permission_grants`, `users` and `site_parties`. An early run exposed automatic analysis of seeded permissions during fixture creation and was rejected. The final plan test takes test-only `SHARE UPDATE EXCLUSIVE` table locks, allowing native DML and both reads while preventing concurrent auto-analysis. It changes no statistics or configuration. If auto-analysis already happened during reset/seed, that entire setup can be disposed before any fixture or reader runs, with a maximum of three setup attempts; query, equivalence and bound failures are never retried. Both recorded final volumes passed on **setup attempt 1** with null analysis timestamps and zero counters throughout. No ANALYZE command, statistics-counter clearing, disabled trigger/constraint or planner change is used. Full raw plans remain under ignored `tmp/projects-register-candidate-cost/`.

### Semantic and cursor proof

The six native projects use stable IDs `f1000000-0000-4000-8000-000000000001` through `...000006`, labelled P1–P6 below. The expectation ledger is independent of both implementations. Existing grants permit only one native Project coordinator per company; no extra grant is invented. Sam is an authorised reader of Company A's projects, with no Mine matches, which also proves permission subqueries do not accidentally bind to the project coordinator.

| Project | Company / coordinator | State / target | Explicit schedule facts |
| --- | --- | --- | --- |
| P1 | A / coordinator | Active / 2030-01-01 | One ordinary risk task. Earlier completed milestone excluded. Earliest incomplete dated milestone is overdue; a tied later ID loses. An undated AtRisk milestone does not increase task risk. |
| P2 | A / coordinator | Active / 2030-01-01 | No tasks or milestone; retained, including when Sam reads it. |
| P3 | A / coordinator | Active / null | Only an undated incomplete milestone; overdue false, risk zero. Optional primary contact and parent organisation are null. |
| P4 | A / coordinator | Closed / 2031-01-01 | Overdue milestone and risk facts retained, but excluded from active attention views. |
| P5 | A / coordinator | Active / 2029-01-01 | Ordinary non-risk task; no milestone. |
| P6 | B / Company B coordinator | Active / 2030-01-01 | Absent from A's rows/counts/options; visible to existing Company B authority. |

Company A's explicit default order is `[P5,P1,P2,P3]`; All is `[P5,P1,P2,P4,P3]`; Closed is `[P4]`; Overdue/AtRisk are `[P1]`; NoTarget is `[P3]`. Counts are `{Active:4,Mine:4,All:5,Closed:1,Overdue:1,AtRisk:1,NoTarget:1}`, with active badge 4. Sam's Mine is empty while All remains five. Company B sees only P6, Active/Mine/All=1 and the other counts zero. Customer filters group P1/P2/P4 and P3/P5; coordinator filters include the real owner and empty non-owner case. Filtered reads retain unfiltered authorised options and the active badge. The reader has no independent task-total or milestone-count field; its actual task-derived fields are preserved without inventing new fields.

The equivalence suite covers all seven views × eight sorts × both directions, case-insensitive search, reference/UUID/site search, empty matches, owner/customer combinations, null-last sorting, tied IDs, and complete cursor traversal at limits 1/2 plus a complete page. It asserts named identities, counts, options and schedule facts before comparing raw rows and every public field, including signed cursors and `observed_at`. Negative cases cover altered query/view/sort/direction/owner/customer/limit/actor, tampered signatures, denied profiles, working-company exclusions, and native completion removing an AtRisk cursor anchor with the same refresh-required 422.

P4 is closed through native commands: explicitly removed synthetic scope with its authority reference, a native Commercial Not required source and Finance disposition, then `closeProject`. No renderer, direct lifecycle update or guard bypass is used. The live schema confirms organisation/site/coordinator are mandatory foreign-key parents (organisation/site keys include company/workspace). The tests retain legal null optional parents, assert missing-parent creation and parent-deletion refusals, and re-read the unchanged projects. They do not manufacture rows with broken mandatory parents or disable constraints/triggers. Parent/company exclusions include hidden Company B labels in options as well as rows.

### Review fixes F1–F3

F1 adds a decisive parent-visibility case using the six native-created projects. In a rolled-back transaction it narrows Sam’s **existing** Company A `shared.read` grant to the Alpha site, retaining the same grant ID; it inserts no grant and leaves `project.read`/`shared.internal.read` unchanged. P1/P2/P4 are visible only through organisation Alpha’s `site_parties` relationship. P3/P5/P6 are excluded, counts are `{Active:2,Mine:0,All:3,Closed:1,Overdue:1,AtRisk:1,NoTarget:0}`, active badge 2, and options contain only Alpha and the coordinator. A constraint-checked fixture update then reassigns the existing Alpha-site party to Beta organisation. The project scope and site remain visible while Alpha organisation becomes hidden: both readers return no rows, all counts/badge zero and empty options. Mandatory project parents remain intact. These two fixture updates use SQL inside the rollback transaction, not new business commands; no guard or constraint is disabled. Raw rows, binds and all public fields match in both states.

Both exact review mutations were applied temporarily to reviewed head `7300611e` with this new test. Swapping the organisation/site rewrite targets fails the first assertion (actual `[]`, expected `[P1,P2,P4]`). Dropping both parent checks with `projectVisibility().split(" AND (EXISTS")[0]` fails the second (actual `[P1,P2,P4]`, expected `[]`). Each run exits 1 with `ERR_ASSERTION`; the restored implementation passes. No mutation is committed.

F2 removes the regex rewrite completely. The original aliases are exposed by lateral projections, preserving SQL name scoping. The refreshed 30/45 proof measures this actual SQL. The evidence now compares the emitted visibility predicate literally with the frozen statement; the inverse-rewrite check has been removed. F3 corrects the local-versus-CI wording and replaces the transient draft-state claim with the remaining review and CI gates.

### Reproduction and validation

After successful repository cloud setup, source the environment path it prints and run database files serially:

```bash
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/projects-register-equivalence.test.ts tests/database/projects-register-candidate-plan.test.ts
```

The plan test resets the disposable database at each volume and writes full SQL/binds, plans, statistics and results to ignored `tmp/projects-register-candidate-cost/{30,45}.json`. `PPO_PLAN_FROZEN_MAIN=1` applies the same bound to frozen main and must fail; the normal suite already asserts that failure at both volumes. Do not run it alongside another database suite.

All **128 new proof tests pass**: 125 semantic/cursor cases plus the oracle hash and two native-volume plan cases. **26 existing Projects database regressions** also pass (`projects-register`, `projects-gantt`, `project-programme`, `project-baselines`, `project-raid`). `npm run check` passes: Studio, full lint, TypeScript, **1,447 unit tests** and the production build. Foundation, prototype, naming, migration numbering, status-source, **44 documentation unit tests**, documentation-scope and whitespace checks pass. Browser tooling remains unavailable: `npm run browser:check` confirms Chrome is absent at `/opt/google/chrome/chrome`. Browser suites and the full database/HTTP matrix are not run locally and remain for CI.

Claude’s independent review of head `7300611e65c5304164aa72c04f1268c3c40ea662` identified F1–F3. The fixes below await focused confirmation of those findings and applicable final-head CI. No merge, deployment, business acceptance or production readiness is claimed.


## Validation and remaining work

Twenty final manual pairs across both volumes executed against `ppo_synthetic_test`; raw artefacts remain ignored. The inventory contains 77 reader entries (some dispatch multiple kinds). Further priorities include populated optional branches and the unmeasured readers above. Claude's one review identified F1, addressed above. Claude decides follow-up prompts, one reader per pull request. Ready-head full CI, confirmation of F1 and business acceptance are separate from these measurements.

`npm run check` passed (studio register, full lint, TypeScript, 1,437 unit tests with no skips, production build). The complete `npm run check` was rerun successfully for F1, as were the documentation checks; `--compare` executed against all twenty retained measurement pairs and verified matching SQL, callers, inputs, JIT settings and never-analysed statistics. All seven proposed fix/proof rows were compared byte-for-byte before and after their reorder. Foundation, prototype, naming, status-source, documentation unit, migration numbering, documentation-scope and whitespace results are recorded in the draft-head completion comment.

Full database/HTTP/application suites were not run locally; the manual audit is the targeted database evidence. Most GitHub suites skip this draft. One existing exception is `.github/workflows/crm-leads.yml:3`: its pull-request trigger and `leads` job have no draft guard, so GitHub also started the Leads acceptance workflow automatically. It was not manually dispatched or used to mark this PR ready; its head-specific state belongs in the completion comment. Changing that protected workflow is outside this audit. Cloud setup reported browser unavailable, so browser suites are not run locally and are left to ready-head GitHub CI. No business acceptance scenario is executed and no approval, deployment or merge is claimed.

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

### Size-45 raw run identity

| Raw artefact | SHA-256 |
| --- | --- |
| `45/organisations.json` | `206e6c5c44f87891f5b4f5eabd15f213c66d5f06d94948bff21b49c71a064f2f` |
| `45/sites.json` | `e29a30481acc2a16cad2e575e6f21c7af64a9a2181805d913e15f482263a1165` |
| `45/my-work.json` | `9565f28a4816b8a915fad19ee845892990a1b45c91457eb2d88c6cd1917c1fd9` |
| `45/deals.json` | `30bf632bbb11e03d6f5d22f1d34b0f45f6294eb89f47480939cbe8302577e530` |
| `45/projects.json` | `4a8be700c2461d570538b801a2b0454ae16c958997e132a1da81a708ba7353cc` |
| `45/facilities.json` | `9d4f5f07d813d22b9801ef38c591a2a08157120abdf91cd82a402d6bcf8ee7a6` |
| `45/equipment.json` | `52b7066431e7cc83dc6fc15ff00301c9d9957904ab8b45d13ee2fa1fe4ad7894` |
| `45/people.json` | `931aa9567229554eaa5279fec3c6a76f9650c16ab8c04aa67e891254d3ee1aba` |
| `45/conversations.json` | `8a9a472dd013323f6eb4ca88dae29553838372dd14f6e29c10ea95547b42abfa` |
| `45/estimating-workload.json` | `04749df54b866d19f3c8eb1db25223bf67669702bf9123ebe5848a946272768d` |
| `growth.json` | `0a9f8b0378e503ded9094a2035ddce1ef43cb4fc800fe715a0079656854e0cc1` |

## Deals candidate fences — 9 November 2026

[PR #880](https://github.com/deanrfiedler-gif/powerplants-one/pull/880) implements the first reader follow-up against main `c1dcdf8ba4d661542c8b7a454fb75b67c1c3d6be`. The [measurement record](2026-11-09-deals-candidate-cost.json) retains counts, before/after statistics, SQL hashes, maximum-node paths and exact growth ratios. PostgreSQL 16.15 and Node 24.21.0; synthetic `ppo_synthetic_test` only.

Inside the existing `permitted` CTE, `candidates` materialises the cheap opportunity/context and next-activity identity joins. `visible_opportunities` materialises the unchanged opportunity predicate, then `visible_actions` checks the unchanged activity predicate against the fenced composite row. Refusal produces a null action, retaining the deal. The action-owner name lookup, per-deal history and `can_edit` run after those fences. Keeping the action-owner lookup after the fence also prevents its index scan being multiplied by the cheap join plan. The final explicit projection preserves matching's columns, names and order and the original `row_to_json` stamp input; membership still precedes the keyset window.

| Native candidates | Maximum loops main → fixed | Shared hits main → fixed | Execution ms main → fixed |
| --- | ---: | ---: | ---: |
| 30 | 1,110 → 30 | 72,375 → 4,196 | 46.712 → 6.072 |
| 45 | 2,340 → 45 | 162,102 → 7,840 | 120.115 → 11.307 |
| Growth 45/30 | 2.108× → **1.500×** | 2.240× → 1.868× | 2.571× → 1.862× |

Every fixed-plan node, including SubPlans and InitPlans, is below 10× candidates at both volumes (bounds 300 and 450). Each candidate/visibility fence executes once with exactly 30 or 45 rows. The same assertion fails on frozen main, whose maximum remains the activity permission branch (`SubPlan 3`, including `permission_grants g_1` and `users u_1`, with `SubPlan 4` also at the maximum). The fixed maximum is ordinary per-candidate work; the full set of maximum-node paths is in the measurement record. Loop growth is linear at these two points. Shared-hit/time growth is separately reported and is not claimed to be linear; these are single warm EXPLAIN observations, not latency distributions or an asymptotic proof.

The native fixture builder is copied from the audit, with its size passed explicitly. It still creates organisations, people, affiliations, sites, facilities, equipment, opportunities, projects, tasks and conversations through native commands. There are exactly 30/45 deals and the same seed offsets as the audit. The nine audit candidate/supporting tables pass `assertNeverAnalysed` before and after both readers. No `ANALYZE`, planner setting, migration, index, grant, capability, dependency or timeout change is used. Native JIT remains on, but neither plan has a JIT section.

The frozen `tests/helpers/deals-worklist-main.ts` retains main's complete `listOpportunities`, including cursor signing and validation; only import paths are relocated. No edited helper is reached by the oracle. The equivalence suite uses 32 native deals, 16 in each pipeline, interleaving both companies in IDs, titles and creation order. Existing coordinator, Company B and quotation-approver identities supply the three authority cases; the last has no action-read grant. No grant is added or changed. Eight deals are closed (four Won, four Lost); native legacy-pipeline closure is refused, so its Closed filter is explicitly empty. Histories include three-event information changes and six-event won deals.

All **111 equivalence tests pass**: both pipelines, Open/Closed/All, Reference/Title/Newest, search on/off, every cursor through the terminal page, owner/stage/all five action-state filters and the internal all-pipelines mode. Explicit counts, named deals, stage counts, action states/nulls, edit rights, histories, expected ordering and completeness accompany `deepEqual` and `JSON.stringify` comparisons. The tests give only the two independent reader modules the same synthetic ephemeral signing key and freeze the JS read clock after native fixture writes, then compare full signed cursors and raw SQL stamps byte for byte. Real randomness is restored before creating sessions or fixture records; SQL grant clocks remain real.

Reproduce serially after cloud setup, sourcing the environment path it prints:

```bash
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/deals-worklist-equivalence.test.ts tests/database/deals-worklist-candidate-plan.test.ts
```

The plan test resets the disposable database separately at each size and writes full SQL/binds, plans, statistics and results to ignored `tmp/deals-worklist-candidate-cost/{30,45}.json`. `PPO_PLAN_FROZEN_MAIN=1` applies the bound to frozen main and must fail; the normal test also asserts that failure directly. Neither suite may run alongside another database suite.

Local application/regression checks and draft-head CI are reported on the pull request. Cloud setup lists browser tooling as unavailable, so browser suites are not run locally and remain for GitHub CI. Claude's one review and ready-head full suites remain open; no merge, business acceptance or production readiness is claimed.


## My Work overview window fence — 10 November 2026

[PR #887](https://github.com/deanrfiedler-gif/powerplants-one/pull/887) follows the My Work audit finding against main `df87f8ba675b5d7bee55150e8f1f04d718fa668f`. The [measurement record](2026-11-10-my-work-overview-candidate-cost.json) retains statistics, counts, SQL hashes, all maximum-node paths and growth ratios. This supports NFR-01 (server authorisation) and NFR-04 (read performance); it is not representative-load acceptance or a production-readiness claim.

The change is confined to the overview's main activity window. `overview_window AS MATERIALIZED` applies the unchanged visibility, filters, ordering and limit before the display joins. The original inner owner join also remains inside the fence, so membership is preserved even when an owner is missing. Every remaining lateral selection returns at most one link, and each optional parent lookup is unique. Moving those optional joins after the window therefore preserves membership, linked-record priority and null handling. The final query repeats the original ordering because CTE order alone is not an output-order guarantee. Counts, date-needed and schedule queries, other panels and other My Work readers are unchanged.

This is a narrower fence than the audit's suggested all-candidate display-join materialisation. It avoids computing display details for rows outside the returned window and leaves the shared row builder untouched. Visibility still runs before the limit; hidden rows never consume a slot. No visibility predicate, permission definition, grant definition, migration, index, dependency, timeout or planner setting changes.

| Native fixture volume | Matching activities / returned window | Maximum loops main → fixed | Shared hits main → fixed | Execution ms main → fixed |
| --- | --- | ---: | ---: | ---: |
| 30 | 32 / 8 | 960 → 32 | 9,295 → 2,620 | 18.793 → 3.578 |
| 45 | 47 / 8 | 2,115 → 47 | 42,775 → 4,392 | 84.746 → 6.445 |
| Growth 45/30 | Window stays 8 | 2.203× → **1.469×** | 4.602× → 1.676× | 4.509× → 1.801× |

The denominator remains the audit's default **eight-row window**, so every recursive plan node must stay at or below **80 loops**, including SubPlans and InitPlans. Both fixed plans pass. The same assertion is explicitly required to fail on both frozen-main plans. The window CTE executes once and returns exactly eight rows at each volume. Timing and shared-buffer observations are separate from loop growth: these are single warm EXPLAIN observations under local development load, not latency distributions or an asymptotic proof.

The proof reuses the native audit fixture already retained in `tests/helpers/deals-worklist-plan.ts`: organisations, people, affiliations, sites, facilities, assets, opportunities, projects, tasks and conversations. The two seeded activities remain in the candidate population. All eleven My Work audit tables have null manual/automatic analysis timestamps and zero analysis counters before and after both reads. There is no `ANALYZE` call or altered planner setting; native JIT remains on and neither captured plan has a JIT section.

The frozen `tests/helpers/my-work-overview-main.ts` retains main's complete reader module, private row builder and projection, with only import paths relocated. Raw query rows compare both structurally and as JSON. The public activities, counts, scope, date-needed panel, schedule, capabilities, day and timezone also compare exactly. Only the overview's observation clock is fixed; SQL permission clocks remain real.

All **24 equivalence tests and the two-volume plan test pass**, alongside the existing **seven My Work database regressions**. Named fixtures cover Project, Lead, Opportunity, Ticket, Asset, Site and Organisation links; multiple links of one type; Project precedence; optional Lead context; three activity kinds; Open/InProgress/Completed/Cancelled; two owners in Company A and a separate Company B reader; hidden parents and an expired Lead-read grant; Due/Title sorting, tied titles and due instants; limits 1/8/25; activity-type/company filters; and a fixed Brisbane clock with exact-now, day-end, next-day and cross-midnight appointment boundaries. Assertions name expected IDs, ordering, counts, completeness and linked records. Deleting linked Organisation or Lead parents is refused by the live schema; the proof asserts refusal and unchanged membership instead of disabling constraints to manufacture dangling records.

Reproduce serially after cloud setup, sourcing the environment path it prints:

```bash
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/my-work-overview-candidate-plan.test.ts tests/database/my-work-overview-equivalence.test.ts tests/database/my-work.test.ts
```

The plan test resets only disposable `ppo_synthetic_test` at each volume and writes full SQL/binds, plans, statistics and reader results to ignored `tmp/my-work-overview-candidate-cost/{30,45}.json`. `PPO_PLAN_FROZEN_MAIN=1` selects frozen main for the bound and must fail; the normal test also checks that failure directly. Run database suites serially.

Local application checks and draft-head CI are recorded on the pull request. Cloud setup reported browser tooling unavailable, so browser suites are not run locally and remain for CI. Independent Claude review and ready-head full CI remain outstanding. This branch does not change B2/B3 billing work and is not merged or deployed.

## People register affiliation fence — 10 November 2026

[PR #897](https://github.com/deanrfiedler-gif/powerplants-one/pull/897) follows the People audit finding against main `c248355e0b570bcf0a027000a123b7790a27f194`. Current main `ceaa98c45` (including merged B3) was integrated before the final proof. The [measurement record](2026-11-10-people-register-candidate-cost.json) retains source identities, statistics, fixture IDs, counts, SQL hashes, every plan node and maximum-node paths. This supports CS-02, NFR-01 and NFR-04; synthetic plan evidence is not representative-load acceptance.

Only `src/shared/people-register.ts` changes production code. `affiliation_candidates AS MATERIALIZED` performs the existing relationship/permitted-person/organisation joins and date checks before the unchanged affiliation company and organisation visibility predicates. The original #897 implementation retained the `rel` and `o` aliases through composite-row lateral projections. Claude found that those whole rows also copy unused organisation notes; the 11 November correction below replaces them with seven consumed columns while preserving the aliases and predicates. There is no SQL text or regex rewrite. The existing authorised affiliation aggregate, sites, notices, correction history, filters, ordering and cursor window remain unchanged. The candidate CTE is internal: its unauthorised relationships cannot reach public rows, counts, options or search.

| Native fixture volume | Visible total / bound | Maximum loops frozen → fixed | Shared hits frozen → fixed | Execution ms frozen → fixed |
| --- | --- | ---: | ---: | ---: |
| 30 | 31 / 310 | 569 → 35 | 5,075 → 2,321 | 6.429 → 5.629 |
| 45 | 46 / 460 | 1,172 → 50 | 9,893 → 4,190 | 17.047 → 8.435 |
| Growth 45/30 | Visible population includes one seed person | 2.060× → 1.429× | 1.949× → 1.805× | 2.652× → 1.498× |

The denominator is the audit's **reported visible total, 31/46**, not the 30/45 native fixture size, 25-item default page, 26 raw look-ahead items or one SQL result row. Every fixed-plan node passes bounds **310/460**, including SubPlans and InitPlans; the same assertion must fail on each frozen-reader plan. The original maximum is the organisation permission branch (`SubPlan 16`); the fixed maximum is primary-site permission work (`SubPlan 21`). The new candidate CTE executes once with 32/47 rows, including the shared seed person's hidden Company B affiliation, which the later unchanged checks exclude. Both plans have zero shared reads. These are single warm observations: buffer and timing growth are reported independently from loops, with no latency or asymptotic claim.

The original proof reuses the unchanged native audit fixture in `tests/helpers/deals-worklist-plan.ts`. Its organisations have no notes, so the buffer/time figures above do not cover wide organisation rows. It creates organisations, people, affiliations, sites, facilities, assets, opportunities, projects, tasks and conversations through native commands. All ten observed tables have null manual/automatic analysis timestamps and zero counters before and after both readers. Compatible table locks prevent concurrent auto-analysis during the fixture and reads, without changing PostgreSQL settings. A setup already analysed during seeding is discarded before fixture construction; at most three setups are allowed, and query/assertion failures are never retried. The retained runs used the recorded setup attempts. No manual ANALYZE, migration, index, grant, dependency, timeout or planner-setting change is used. Native JIT is on; neither plan has a JIT section.

The complete original reader is frozen in `tests/helpers/people-register-main.ts`, with only imports relocated. A test reverses those relocations and checks the baseline SHA-256. Imported builders are unchanged, so the oracle reaches no edited helper. Raw SQL rows and public outputs compare exactly, including signed cursors, **except `observed_at`**: separate real SQL statements have different observation timestamps. Each timestamp must fall between database clock samples immediately around its statement and project unchanged to the public output. No SQL, bind, result or clock is substituted.

Four semantic tests exercise all 32 view/sort/direction combinations through every one-item cursor page, including tied case-folded names, emails, phones and status, nulls last and terminal cursors. Explicit ID/count ledgers also cover inactive people, absent affiliations/sites, multiple roles, expired/future affiliations, global organisation options, organisation/search/notice filters, latest notice versions and populated native correction evidence. Company A excludes a Company B-only person and the shared seed person's Company B affiliation/site; Company B sees those records and excludes Company A-only people. A site-only observer sees only the assigned contact, no organisation options, and restricted notices/history. Other-workspace identities remain isolated. Changed filters, actor, working company, limit and tampered cursors are refused, as is a cursor whose anchor becomes inactive. Real parent-deletion guards are asserted; no constraints or triggers are disabled.

With grant validity stable throughout a statement, the affiliation's same-company organisation foreign key means the organisation term cannot exclude a row already admitted by the relationship-company term. The fixture therefore tests their combined boundary using the shared seed person's valid A/B affiliations; it does not claim an independently decisive organisation-only mutation. Both terms and their real volatile `clock_timestamp()` grant checks remain unchanged. Grant validity changing between predicate evaluations is not covered by these fixtures. Two temporary mutations were killed by the frozen-oracle comparison: replacing both affiliation permission terms with `true`, and removing the affiliation date condition. The original code was restored; the measurement record identifies each mutation and its failed test.

Reproduce serially after cloud setup, sourcing the environment path it prints:

```bash
node --env-file=.env.local --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/people-register-candidate-plan.test.ts tests/database/people-register-equivalence.test.ts tests/database/people-register.test.ts tests/database/contacts-native.test.ts tests/database/shared.test.ts tests/database/customer-communications.test.ts
```

The plan test resets only disposable `ppo_synthetic_test` separately for each volume and writes complete SQL/binds, plans, statistics and raw/public outputs to ignored `tmp/people-register-candidate-cost/{30,45}.json`. Before the production change, both bound tests failed with the original reader in both positions (557/1,196 loops); after the change the frozen reader still fails and the fixed reader passes. Plan maxima vary with fresh synthetic IDs and join order, so the retained paired measurements above are the delivery evidence.

Local checks and independent review status are recorded in the [dated status fragment](../../../status/2026-11-10-people-register-candidate-cost.md) and PR. Cloud setup reports browser tooling unavailable and the explicit browser probe fails because Chrome is absent; local browser suites remain for CI. That delivery checkpoint preceded Claude's review and the merge of #897 on 11 November. The follow-up below records the outstanding findings and correction; the historical measurements above are preserved. B3/B4, Projects and My Work work remain independent.


### People affiliation row-width correction — 11 November 2026

[PR #912](https://github.com/deanrfiedler-gif/powerplants-one/pull/912) addresses F1 from [Claude's review](https://github.com/deanrfiedler-gif/powerplants-one/pull/897#pullrequestreview-5852320590) after #897 merged into main `a55b09790039c469ae39120c1b2ec81fe8539948`. The candidate CTE now materialises only `person_id`, relationship company and role, organisation workspace/company/id and display name. Narrow lateral projections retain the original aliases for unchanged authority predicates. No organisation notes, legal name or other unused whole-row fields cross the fence. The frozen reader and original visible-population bounds are unchanged.

The new regression creates a 10,000-character low-compressibility note through `createOrganisation` and 450 affiliations through `addAffiliation`, in addition to the unchanged native 30 fixture. Stored note length and size are both 10,000; the selected person has 451 roles, the register has 31 visible people and 32 organisation options. Exact raw/public output and signed cursor equality are checked against the frozen reader, along with an explicit ledger of all 450 added roles. All observed tables remain unanalysed. PostgreSQL's observed `work_mem` is 4 MB; no settings are changed.

On unchanged merged main, the new test **fails** its zero-spill assertion with **573 temporary blocks written**. After narrowing the columns it **passes**, with zero temporary reads or writes. Both candidate versions reach 482 maximum loops in this deliberately dense fixture: the new test targets row width, not the original 10× visible-people bound for fixtures with about one affiliation per person. Original 30/45 fixtures still enforce every-node bounds of 310/460 and require the frozen reader to fail them. The test does not assert elapsed timings.

| Post-fix fixture | Frozen → narrow maximum loops | Frozen → narrow shared hits | Frozen → narrow execution ms | Narrow temporary blocks written |
| --- | ---: | ---: | ---: | ---: |
| Native 30 | 570 → 35 | 5,112 → 2,353 | 6.622 → 4.086 | 0 |
| Native 45 | 1,202 → 50 | 9,988 → 4,101 | 12.659 → 7.336 | 0 |
| Native 30 + long notes / 450 affiliations | 8,678 → 482 | 51,359 → 8,966 | 32.413 → 12.411 | 0 |

The [measurement record](2026-11-11-people-register-row-width.json) retains source and raw-capture hashes, output-equivalence hashes, candidate materialisation and maximum-node metrics, memory settings and no-analysis observations. Full fresh captures are reproducible with the same serial command above under ignored `tmp/people-register-candidate-cost/{30,45,long-notes}.json`. The retained red control used the same test against the unchanged main reader. Fresh UUIDs differ between red and green setups; cross-run timing or buffer ratios are not controlled comparisons. Each table row is a paired, single warm observation, not representative-load or latency acceptance.

F2 is a PR-metadata correction: #897's description now records Claude's review, its ready/merged state and this follow-up rather than claiming it remains draft. Original dated comments are historical evidence. Claude's confirmation of F1/F2 remains pending. Local checks and final-head CI are recorded in the [follow-up status](../../../status/2026-11-11-people-register-width-fix.md). This follow-up has not been merged or deployed.
