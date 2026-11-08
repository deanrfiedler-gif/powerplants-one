# Queue writer inventory — criterion 2 version 3

Source: main `5a1c09fd3`, resumed from `27a7bde4`; [claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6714557257). Apply [Claude’s version 3 decision](https://github.com/deanrfiedler-gif/powerplants-one/pull/866#issuecomment-6704438201), not the superseded unconditional share-lock stop in [the retained diagnostic](writer-audit-stop.md). The original diagnostic and its JSON/source bytes remain evidence.

## Read set and audit method

Trace the actual functions, not their whole imported modules: the read imports modules that also export commands, but never invokes those commands. [Read-path and request audit](read-path-audit.md) records the reachable functions. The read set includes:

- `workspaces`, `users`, `permission_grants`, `companies`;
- `estimates`, `estimate_versions`, `estimate_review_events`, `draft_quotes`, `draft_quote_revisions`, `quote_release_bases`, `quote_release_events`, `estimate_quote_jobs`;
- `opportunities`, `organisations`, `people`, `sites`, `site_parties`, `relationships`, `person_company_contexts`, `crm_pipeline_definitions`, `crm_stage_definitions`;
- `estimate_discovery_roots`, `estimate_discovery_bases`, `estimating_options`, `estimation_revisions`, `estimating_workspaces`, `facilities`, `assets`;
- `estimate_cost_source_bindings`, `cost_source_revisions`, `cost_sources`, `estimate_specialist_lineage`, `specialist_configurations`, `specialist_definitions`, `specialist_runs`, `specialist_drafts`;
- `activities`, `activity_links`, `projects`, `lead_candidates`, `tickets` through saved discovery follow-up IDs and activity link visibility.

[Live schema evidence](live-read-dependencies.json) confirms the direct workspace FKs and SQL function writers; foreign keys do not transitively lock a grandparent row. Searched INSERT/UPDATE/DELETE/TRUNCATE and dynamic table interpolation across `src/`, `scripts/` and SQL; followed helpers back to their transaction owners, including `insertVersion`, `adoptCostingInTransaction`, `writeDraftQuote`, `inheritSourceBindings`, `writeLineage`, `insertActivity`, `activityMutation`, follow-up helpers and generic shared inserts. The table below is a conservative read-set write inventory: generic shared `insert`/`bump` helper table unions are deliberately overinclusive. Such unions do not omit a writer or substitute for checking its lock. Trigger-generated discovery rows and activities are included below. Raw test fixture SQL is setup/fault injection, not a supported concurrent application command; its arbitrary writes cannot certify an application locking invariant.

## Command transactions excluded by FOR UPDATE

Every command below calls `sharedOperation`. `src/platform/operations.ts:165–172` starts its transaction, optionally locks the operation key, then locks the principal’s workspace FOR UPDATE **before** calling authorise or mutate. Helpers use that same client. An advisory operation lock alone is not counted as a workspace lock. These commands retain their existing exclusion against a queue FOR SHARE.

| Source | Transaction owner | Read-set writes (helper unions where applicable) | Workspace lock |
|---|---|---|---|
| `src/activities/activities.ts:299` | `createActivity` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/activities/activities.ts:469` | `activityCommand` | `activities` | FOR UPDATE via `sharedOperation` |
| `src/calls/log-call.ts:22` | `logCall` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/calls/party-numbers.ts:51` | `setPartyNumbers` | `organisations`, `people` | FOR UPDATE via `sharedOperation` |
| `src/communications/service.ts:222` | `prepareCustomerMessage` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/communications/service.ts:256` | `confirmCustomerMessage` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/communications/service.ts:334` | `reconcileCustomerMessage` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/cpq/runs.ts:491` | `adoptRun` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_discovery_roots`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/amendments.ts:100` | `resolveLeadContext` | `lead_candidates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/amendments.ts:169` | `transferLeadOwner` | `lead_candidates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/service.ts:118` | `createLead` | `lead_candidates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/service.ts:172` | `changeLead` | `lead_candidates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/service.ts:260` | `planLeadAction` | `activities`, `activity_links`, `lead_candidates` | FOR UPDATE via `sharedOperation` |
| `src/crm/leads/service.ts:289` | `convertLead` | `activities`, `activity_links`, `lead_candidates`, `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/opportunities.ts:84` | `createOpportunity` | `activities`, `activity_links`, `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/opportunities.ts:197` | `qualifyOpportunity` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/opportunities.ts:263` | `planOpportunityAction` | `activities`, `activity_links`, `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/outcomes.ts:68` | `recordOpportunityOutcome` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/owner-transfer.ts:191` | `transferOpportunityOwner` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/refinements.ts:106` | `editDealInformation` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/refinements.ts:159` | `editDealScope` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/crm/refinements.ts:190` | `changeDealStage` | `opportunities` | FOR UPDATE via `sharedOperation` |
| `src/documents/packs.ts:253` | `revisePack` | `activities` | FOR UPDATE via `sharedOperation` |
| `src/documents/packs.ts:290` | `checkPack` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/documents/packs.ts:705` | `returnPack` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/documents/packs.ts:866` | `answerReturn` | `activities` | FOR UPDATE via `sharedOperation` |
| `src/email/service.ts:162` | `createEmailFollowup` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/engineering/commissioning/commands.ts:215` | `inspectionCommand` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/equipment/changes.ts:367` | `reviewEquipmentChange` | `assets` | FOR UPDATE via `sharedOperation` |
| `src/equipment/evidence.ts:508` | `reviewBulletin` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/estimating/conversion/service.ts:81` | `execute` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/estimating/cost-basis-service.ts:45` | `adoptDiscoveryCosting` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_discovery_roots`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/discovery-workspaces.ts:394` | `createDiscoveryWorkspace` | `estimating_options`, `estimating_workspaces`, `estimation_revisions` | FOR UPDATE via `sharedOperation` |
| `src/estimating/discovery-workspaces.ts:500` | `changeDiscoveryWorkspace` | `estimating_options`, `estimating_workspaces`, `estimation_revisions` | FOR UPDATE via `sharedOperation` |
| `src/estimating/discovery-workspaces.ts:611` | `changeDiscoveryOption` | `estimating_options`, `estimating_workspaces` | FOR UPDATE via `sharedOperation` |
| `src/estimating/disposition/service.ts:24` | `execute` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/estimating/import/commit.ts:123` | `commitExcelWorkbook` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_discovery_roots`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/import/pricing.ts:143` | `applyExcelSourcePricing` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/import/quotation.ts:233` | `prepareExcelQuotation` | `draft_quote_revisions`, `draft_quotes`, `estimate_quote_jobs` | FOR UPDATE via `sharedOperation` |
| `src/estimating/import/reimport.ts:100` | `reimportExcelWorkbook` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_discovery_roots`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/nursery-automation/assessment-service.ts:266` | `saveAssessment` | `estimating_workspaces` | FOR UPDATE via `sharedOperation` |
| `src/estimating/nursery-automation/service.ts:183` | `saveNursery` | `estimating_workspaces` | FOR UPDATE via `sharedOperation` |
| `src/estimating/release/service.ts:102` | `prepareRelease` | `draft_quote_revisions`, `draft_quotes`, `estimate_quote_jobs`, `quote_release_bases`, `quote_release_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/release/service.ts:193` | `approveRelease` | `quote_release_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/release/service.ts:254` | `issueRelease` | `quote_release_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/release/service.ts:339` | `recordDistribution` | `quote_release_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/review/service.ts:42` | `submitEstimateReview` | `estimate_review_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/review/service.ts:157` | `decideEstimateReview` | `estimate_review_events` | FOR UPDATE via `sharedOperation` |
| `src/estimating/service.ts:31` | `createEstimate` | `estimate_cost_source_bindings`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/service.ts:50` | `saveEstimate` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/service.ts:64` | `prepareQuote` | `draft_quote_revisions`, `draft_quotes`, `estimate_quote_jobs` | FOR UPDATE via `sharedOperation` |
| `src/estimating/sources/commands.ts:90` | `createCostSource` | `cost_source_revisions`, `cost_sources` | FOR UPDATE via `sharedOperation` |
| `src/estimating/sources/commands.ts:136` | `reviseCostSource` | `cost_source_revisions`, `cost_sources` | FOR UPDATE via `sharedOperation` |
| `src/estimating/sources/commands.ts:204` | `decideCostSource` | `cost_sources` | FOR UPDATE via `sharedOperation` |
| `src/estimating/sources/refresh.ts:267` | `applySourceRefresh` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/receiving.ts:457` | `applyReceiving` | `estimate_cost_source_bindings`, `estimate_discovery_bases`, `estimate_specialist_lineage`, `estimate_versions`, `estimates` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:125` | `createConfiguration` | `specialist_configurations`, `specialist_drafts` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:314` | `saveDraft` | `specialist_configurations`, `specialist_drafts` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:357` | `saveRun` | `specialist_configurations`, `specialist_drafts`, `specialist_runs` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:507` | `adjustResolved` | `specialist_configurations` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:625` | `archiveConfiguration` | `specialist_configurations` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:653` | `draftFromRun` | `specialist_configurations`, `specialist_drafts` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/service.ts:698` | `recordFinding` | `specialist_configurations` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/source.ts:154` | `rebaseSource` | `specialist_configurations`, `specialist_drafts` | FOR UPDATE via `sharedOperation` |
| `src/estimating/specialist/source.ts:206` | `copyConfiguration` | `specialist_configurations`, `specialist_drafts` | FOR UPDATE via `sharedOperation` |
| `src/estimating/supply-followup/material-service.ts:38` | `executeMaterial` | `activities`, `activity_links`, `projects` | FOR UPDATE via `sharedOperation` |
| `src/estimating/supply-followup/service.ts:61` | `execute` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/field/completion.ts:20` | `saveCompletionDraft` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/field/entries.ts:48` | `captureEntry` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/field/timer.ts:220` | `commandTimer` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/incidents/service.ts:240` | `incidentCommand` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/inspections/service-commands.ts:150` | `inspectionCommand` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/maintenance/receiving.ts:53` | `prepareWork` | `tickets` | FOR UPDATE via `sharedOperation` |
| `src/maintenance/receiving.ts:383` | `prepareFollowOn` | `tickets` | FOR UPDATE via `sharedOperation` |
| `src/maintenance/renewals.ts:117` | `renewalCommand` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/maintenance/warranty.ts:218` | `warrantyCommand` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/projects/acceptance/commands.ts:256` | `executeCommand` | `activities`, `activity_links`, `projects` | FOR UPDATE via `sharedOperation` |
| `src/projects/programme.ts:33` | `record` | `projects` | FOR UPDATE via `sharedOperation` |
| `src/projects/service.ts:225` | `createProject` | `projects` | FOR UPDATE via `sharedOperation` |
| `src/projects/service.ts:296` | `saveTask` | `projects` | FOR UPDATE via `sharedOperation` |
| `src/reports/service.ts:104` | `submitCompletion` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/reports/service.ts:385` | `reviewReport` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/reports/service.ts:583` | `amendReport` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/reports/service.ts:623` | `recordResponse` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/reports/worker.ts:109` | `requestReportIssue` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/sales/followup.ts:338` | `linkSalesFollowup` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/sales/followup.ts:454` | `createSalesReview` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/planner.ts:675` | `confirmAppointment` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/planner.ts:703` | `moveAppointment` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/planner.ts:727` | `cancelAppointment` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/planner.ts:802` | `recordContact` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/planner.ts:1059` | `decideChangeRequest` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/scheduling/policy-commands.ts:373` | `publishSchedulingPolicy` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/service/escalations/commands.ts:268` | `recordSupportRoute` | `assets` | FOR UPDATE via `sharedOperation` |
| `src/service/escalations/commands.ts:349` | `commandCase` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/service/findings/next-action.ts:196` | `setNextAction` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/service/intake.ts:119` | `createTicket` | `tickets` | FOR UPDATE via `sharedOperation` |
| `src/service/intake.ts:187` | `saveIntake` | `tickets` | FOR UPDATE via `sharedOperation` |
| `src/service/intake.ts:252` | `requestInformation` | `activities`, `activity_links`, `tickets` | FOR UPDATE via `sharedOperation` |
| `src/service/intake.ts:359` | `triageTicket` | `activities`, `tickets` | FOR UPDATE via `sharedOperation` |
| `src/service/statements.ts:21` | `recordTicketStatement` | `tickets` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:145` | `createOrganisation` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:211` | `createPerson` | `assets`, `facilities`, `organisations`, `people`, `person_company_contexts`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:286` | `createSite` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:383` | `createFacility` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:427` | `createAsset` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:562` | `addAffiliation` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:613` | `addSiteParty` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:673` | `proposeMapping` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:744` | `renameOrganisation` | `organisations` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:814` | `reviseAssetIdentity` | `assets` | FOR UPDATE via `sharedOperation` |
| `src/shared/commands.ts:891` | `recordHistory` | `assets`, `facilities`, `organisations`, `people`, `relationships`, `site_parties`, `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/contacts/commands.ts:50` | `revisePerson` | `people` | FOR UPDATE via `sharedOperation` |
| `src/shared/contacts/commands.ts:124` | `endAffiliation` | `organisations`, `relationships` | FOR UPDATE via `sharedOperation` |
| `src/shared/contacts/commands.ts:204` | `setSitePrimaryContact` | `sites` | FOR UPDATE via `sharedOperation` |
| `src/shared/facilities/commands.ts:351` | `createFacilityDetails` | `facilities` | FOR UPDATE via `sharedOperation` |
| `src/shared/facilities/commands.ts:418` | `reviseFacilityDetails` | `facilities` | FOR UPDATE via `sharedOperation` |
| `src/shared/facilities/commands.ts:567` | `setFacilityPin` | `facilities` | FOR UPDATE via `sharedOperation` |
| `src/shared/facilities/commands.ts:633` | `addAssetServedFacility` | `assets` | FOR UPDATE via `sharedOperation` |
| `src/shared/facilities/commands.ts:715` | `endAssetServedFacility` | `assets` | FOR UPDATE via `sharedOperation` |
| `src/supply/commands.ts:113` | `saveRecord` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/supply/commands.ts:341` | `allocate` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/supply/commands.ts:506` | `reduceAllocations` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/supply/commands.ts:900` | `recordFact` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/supply/customer-delivery.ts:178` | `recordCustomerDelivery` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |
| `src/supply/customer-delivery.ts:576` | `prepareSupplyCustomerNotice` | `activities`, `activity_links` | FOR UPDATE via `sharedOperation` |

`src/access/requests.ts`’s `applyAccessRequest` grant insertion uses the local command transaction wrapper at line 375, which locks the workspace FOR UPDATE at line 377. It is also excluded. Wrapper-dispatched variants in the table (activity, incident, inspection, acceptance, warranty, renewal, supply, specialist and discovery commands) share that one transaction owner; command variants do not bypass it.

## Other transaction owners

| Transaction | Read-set writes | Coordinator workspace lock | Disposition |
|---|---|---|---|
| `src/estimating/worker.ts:49–62` claim, `80–85` success; reached also by retry/drain entrypoints | `estimate_quote_jobs` | FOR UPDATE at 52 / 81 | Excluded. |
| `src/estimating/worker.ts:89–93` failure | `estimate_quote_jobs` | None | Pre-existing gap. Updating state/lease/error with unchanged workspace key does not run that FK check. Attempt insertion references its job, not the workspace. Unchanged by this PR. |
| `src/communications/worker.ts` claim and record | `activities`, `activity_links` through `followUp` | FOR UPDATE through `lockJob` before writes | Excluded. |
| Same worker’s `observeCustomerMessages` | `activities`, `activity_links` | FOR UPDATE before processing each workspace’s message | Excluded. |
| `src/scheduling/preparation-worker.ts:49` per-appointment transaction | `activities`, `activity_links` | FOR UPDATE at 50 | Excluded. |
| `src/offline/recovery.ts:245` `preserveRecovery` | `activities`, `activity_links` | FOR UPDATE at 247 | Excluded. |
| `src/reports/worker.ts` finalisation transaction | `activities`, `activity_links` through report follow-up | FOR UPDATE at 345 | Excluded. Its claim/durable/failure transactions write report job/attempt tables, not this read set. |
| `src/service/tickets.ts:saveDraft` | `tickets` summary/version/timestamps/updater; operation evidence outside read set | None: operation evidence FKs target users/receipts, not workspaces | Pre-existing gap; response-independence also recorded below. |
| `scripts/demo-database.ts:reconcileTesters`, including `scripts/demo-reviewer.ts:ensurePackReviewer`; also called from `upgradeExistingDemo` | `users`, `permission_grants` | Implicit KEY SHARE on new-user insertion; existing-user updates take none | Accepted argument below, per decision; unchanged files. |
| `scripts/quality-load-fixture.ts:qualityLoadFixture` | New `organisations`, `assets`; other inserted work/scheduling rows outside read set | Implicit KEY SHARE via new workspace-scoped records, no UPDATE | Safe argument below. |
| `scripts/es02-fixture.ts:createNorthbankFixture`, `restoreFixtureOwner` (also `es02-restart`) | Existing user `display_name` in individual autocommit UPDATEs | None for those UPDATEs | Pre-existing fixture-only gap. Native business commands separately take UPDATE. |
| `scripts/estimating-restart-proof.ts`, `scripts/estimating-cost-basis-restart.ts` expiry injection | Existing `estimate_quote_jobs.lease_until` | None, separate autocommit UPDATE | Pre-existing synthetic fault injection; lease_until is not selected by the queue. Native worker portions classified above. |
| `src/email/provider.ts:seedEmailProvider`, `scripts/es08-fixture.ts`, upgrade capability additions | `permission_grants` | None for grants: their FKs target users/companies, not workspaces | Grant changes are the explicitly retained exception covered by queue rechecks; no other existing read-set row is changed. |
| `scripts/database.ts:seed`; SQL seed bundles and invoked fixture helpers | New users/companies/shared/service/activity/pipeline/definition rows plus grants | KEY SHARE on inserted workspace FK rows; none for definition-only rows | Safe insertion argument below. Existing receipts prevent replay. |
| `scripts/database.ts:migrate/reset`, `scripts/demo-database.ts:migrateDemo`, `scripts/demo-upgrade.ts:upgradeExistingDemo` schema phase | DDL/backfill affecting installed read tables; reset drops schema | No general workspace-row UPDATE protocol; DDL relation locks, depending on migration | Maintenance boundary below. This PR does not authorise a schema operation concurrent with serving queue traffic. |

Scripts `email-demo-fixtures`, `prepare-owner-demo`, `t2e-preparation`, `estimating-sources-restart` and the ES-02/ES-08 fixture/restart entrypoints invoke the enumerated native commands; they do not introduce an enclosing transaction that removes those locks. `build-specialist-seed` writes a SQL source file, not a live database. `ensurePackReviewer` borrows its caller’s client, so it is not an independent transaction.

## Share-lock arguments under version 3

### Demo user reconciliation — accepted decision

`reconcileTesters` and `ensurePackReviewer` write `users` and `permission_grants`; their other demo/session/mailbox rows are not queue inputs. The [retained native probe](writer-lock-probe.json) shows implicit KEY SHARE from `users_workspace_id_fkey` on inserting a brand-new user and no workspace FOR UPDATE. On the existing-user conflict path workspace_id is unchanged, so that FK check does not run. Existing active/display-name UPDATEs take no workspace lock and were not excluded by the old queue lock; grants retain the existing recheck.

As the decision directs, the newly admitted row is a **new user**. Queue owner/submitter/reader lookups use IDs already carried by candidate/review/principal rows. A new user cannot be one of those IDs. Making it an owner or author requires an estimating command, all of which holds workspace FOR UPDATE and remains excluded. This hosted operator does not run during the browser test. This records Claude’s accepted argument; it does not reclassify the old diagnostic as a browser-cause proof or change either script.

### Legacy ticket draft — live catalog correction

`saveDraft` writes only `tickets.summary`, `version`, `updated_at`, `updated_by`, then operation receipt/audit/outbox evidence. It holds the ticket row FOR UPDATE and an operation advisory lock; neither is the coordinator workspace FOR UPDATE. The live catalog confirms that operation evidence references users/receipts, not workspaces. An FK on a user row does not recursively take a lock on that user’s workspace. Thus this transaction holds **none** on the workspace, a pre-existing gap rather than a share-lock writer. The preliminary source-only classification was corrected before delivery.

The only queue access to `tickets` is `activityVisibility` → `ticketVisibility`’s EXISTS test for a linked Ticket. It uses ticket ID/workspace, company/site, requester and asset for permission/relationship visibility. It neither projects nor predicates summary/version/timestamps/updater/status. `saveDraft` changes none of those visibility keys, inserts no ticket, and inserts no activity link. Its operation evidence is not read by this call graph. Therefore even a commit between two queue SELECTs cannot change the response, and its lock class is independently permitted as an unchanged pre-existing gap by version 3. Do not broaden this claim to a ticket intake command that changes access fields; those use sharedOperation.

### Additive quality-load fixture

`qualityLoadFixture` inserts brand-new organisations and assets, never updates existing ones. It also inserts work-order/scope/appointment rows and asset-location evidence, none of which the queue reads. Queue candidates are estimates/release bases; shared rows are read through existing opportunity/discovery/activity IDs, never an all-organisations or all-assets listing. New load rows cannot satisfy those existing references. Assigning them to a queue source requires a workspace-UPDATE command. It cannot change a queue response and does not run during the continuation test.

### Once-only seed insertions and setup boundary

The registered seed bundles insert rows; they do not UPDATE existing read-set rows. Existing receipts skip already-applied bundles. Native foreign keys prevent existing source rows from referring to a not-yet-inserted user, organisation, site, facility, asset, pipeline, configuration or definition. The additive Facilities bundle creates its own new organisation/site/facility graph; activity/link bundles create new activity IDs. No seed inserts an estimate-review Submission or quote-release candidate. New rows therefore cannot become referenced by an existing candidate without a workspace-UPDATE command. Permission-grant additions retain the explicitly accepted recheck exception. Definition-only insertion has no workspace FK and is an unchanged lock-free setup path.

Migrations/reset are schema maintenance, not a promise of online schema-version coexistence. `reset` explicitly requires the stopped application. The upgrade runner applies DDL/backfills and seed SQL under its maintenance advisory lock; that advisory lock is not claimed to exclude queue readers. On this fully migrated head, migrate has no pending read-set changes and seed has no unapplied bundles. A future migration/new seed must be audited afresh; this inventory does not certify concurrent execution of arbitrary past/future migrations or hand-written DBA/test SQL. Existing trigger writers run in the initiating transaction: legacy estimate insertion materialises discovery workspace/option/revision rows; pack/report/acceptance follow-up triggers insert new activities/links. The live catalog lists `materialise_legacy_estimate`, `pack_owned_follow_up` and `acceptance_commissioning_changed` as the SQL function writers of this read set. `materialise_new_legacy_estimate` calls the first in the estimate-creation transaction. `engineering/commissioning/commands.ts`’s `packageCommand`, `basisCommand`, `inspectionCommand`, `configurationCommand`, `releaseCommand` and `handoverCommand` all use `sharedOperation<Access>` before `bumpPackage` can fire the acceptance trigger. Pack invalidation chains originate in `issueEvent`, appointment/work-order/shared-source changes or worker finalisation; native source commands and the finalisation transactions take workspace UPDATE. Their activity insertions use fresh generated IDs, so even an external lock-free trigger invocation cannot rewrite an existing saved discovery reference. Native initiating mutations take workspace UPDATE, except the already described maintenance/setup paths. Fresh follow-up activities cannot appear in an existing saved discovery input before a workspace-UPDATE revision command references them.

## Result and pre-existing gaps

No additional **response-affecting** share/key-share writer was found in the current runtime and maintained operator/fixture paths. Existing gaps remain: quote-worker failure state, legacy ticket-draft updates, existing-user active/name updates in demo reconciliation, fixture alias UPDATEs, expiry-injection UPDATEs, and direct lock-free setup/definition/grant paths. This is not a serializable-snapshot claim: grant expiry, wall clock and those existing lock-free updates retain their previous semantics. The three user-protected files are unchanged. Runtime lock implementation and its tests are recorded separately after these prerequisites.
