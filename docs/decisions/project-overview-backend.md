---
document_id: PPO-PJ-OVERVIEW-BACKEND-DEC
date: 2026-10-13
owner: Dean Fiedler
status: Authorised backend implementation; independent review, UI and owner acceptance separate
versioning: git
---

# Projects receiving and overview backend

Dean instructed: “Proceed with the PJ-01/PJ-02 Projects backend work.” This contribution continues BC-02 after [PJ-04](project-raid-backend.md), on `codex/projects-overview-backend` based on its PR #458 head `9b87786ff27b19a1c007876beea5a50b783889f4`. PJ-04 is an explicit dependency, not assumed merged. The inspected main was `c3ff5b9`. Before final verification, the updated #458 head `0213e8dce94d94f5beadf344189c95447a79a706` was merged, retaining Work orders, Cost sources, Engineering and the current CPQ design by ancestry. Preserve PJ-01/PJ-02, PRJ-01/02/03/07 and every other parent ID.

The [accepted Project record design](project-record-page-design.md) supplies the site-local overdue rule, dates, phase counts, team and explained attention. This instruction authorises the backend reads which that earlier design deliberately left separate. The historical BP-06 proposals for manual health/stage fields and the navigation board's example thresholds are not adopted. Dean's supplied Wrike audit remains bounded reference material under the PJ-04 decision; it does not authorise competitor parity or operational rules.

## Existing authority and the completed gap

Native LC-16 already submits, clarifies, returns and accepts the exact Won handover with a named receiver. Project creation and the subsequent typed link remain independent commands. Linking compares the accepted event/source hash, receiving owner, company/customer/site and native version; an uncertain creation is recovered before linking. Exact replay returns the original receipt under current authority. No parallel receiving workflow, command, status, Activity store or implicit Project creation is added.

The new overview brings that retained receiving evidence alongside the independently saved Project. It exposes accepted event/revision/version/hash, accepting actor/time/note, current receiving owner/state, current-versus-historical attribution, source-change flag, original scope/exclusions/assumptions/unknowns and the original link comparison. A successor does not rewrite the original acceptance. The existing `source_changed` flag compares the current handover source basis; it is distinct from whether the retained acceptance is current. Activity completion alone does not change that commercial hash; a native Opportunity scope edit does. A hidden source becomes only `Restricted`; unknown/restricted is never labelled no handover. An unlinked Project says `NoLinkedSalesHandover`, which does not assert an origin or accepted sales scope.

## Reads

| Endpoint | Contract |
|---|---|
| `GET /api/v1/projects/portfolio` | Signed UUID keyset pages (1–200, default 50), literal search over permitted identity/title/customer/site, optional lifecycle, coordinator, site and attention filters. Both rows and counts use the same permission-scoped source and exact filters. Counts cover all authorised matches before the cursor, not just this page. No default lifecycle exclusion |
| `GET /api/v1/projects/:id/overview` | One Project, key dates, phase counts, milestones against an explicit saved baseline, transitive successor attention, team, original Sales receiving context, bounded current actions/RAID and recent schedule/baseline history |
| Existing `GET /api/v1/projects/:id/sales-handovers` | Reuses the same receiving projection; adds explicit accepted/current attribution without changing original content or command authority |

The overview accepts only `baseline_revision`; omitted means latest. An absent requested revision is unavailable. The project summary always identifies the latest baseline; `schedule.baseline` explicitly identifies the selected comparison. No baseline or schedule is rewritten by reading. Existing baseline/history/RAID/Activity endpoints retain detailed inspection and continuation.

Each response uses one repeatable-read, read-only PostgreSQL transaction. The extracted Sales projection accepts that existing transaction instead of opening a second snapshot. No new technology, dependency, schema, seed, user, grant, capability or migration is introduced. Existing Next route, PostgreSQL, source visibility, validation and signed cursor patterns are reused; a materialised health table or parallel writer would introduce stale authority without a requirement.

## Definitions and completeness

- **Today:** the observation instant in the site's timezone. An incomplete milestone is overdue only when its saved finish is before that date. Due-today, completed and undated milestones are not overdue.
- **Start/forecast finish:** earliest start/latest finish only when every task has both dates and at least one task exists. Otherwise both are null, with the undated count. A partial maximum is never presented as the complete forecast.
- **Baseline finish:** latest finish in the selected immutable snapshot; baseline variance is forecast minus baseline in calendar days. Target margin is target minus forecast, also calendar days. Unknown input produces null. Neither is a working-day prediction or a booking change.
- **Phase progress:** complete and total task counts for the four existing phases. No weighted percentage or inferred delivery stage.
- **Attention:** overdue milestones, manually AtRisk tasks and their non-complete transitive successors. Each task retains its current owner and latest saved reason/version. No successor dates change.
- **Portfolio classification:** `NeedsAttention` if there are overdue milestones, AtRisk tasks, overdue visible Activities, manually High open RAID entries or overdue open RAID entries, or a fully dated forecast beyond its saved target/latest baseline. Variance flags request review directly from dates, with no tolerance threshold or health score. Otherwise `InformationNeeded` if no schedule, undated tasks, unassigned incomplete tasks, unavailable external task owners, undated open Activities or restricted Activity context exists. Otherwise `NoCurrentFlags`. Closed lifecycle is displayed as `Closed`, with retained underlying facts. These are explained coordination categories, not an overall health score, acceptance or operational assurance. A positive financial or delivery conclusion cannot be inferred from no current flags.
- **Activity dates:** native instants; overdue means an open/in-progress action due before the observation instant. All linked-source access must pass. Hidden actions contribute no identifier, label, owner, due date or numerical status count; only partial coverage is reported. Current completion removes an action from open work without changing schedule or RAID history.
- **RAID:** current revision only; open means Open or Monitoring. High is its manually saved priority. Typed Risk/Assumption/Issue/Dependency/Decision and owner remain visible. The overview returns no linked Activity identities through RAID.
- **Team:** coordinator plus distinct permitted task owners, with external contacts marked; unavailable contacts are withheld and coverage is partial. Team membership confers no access and sends no message.

Actions and RAID each preview up to 20 current rows, with `has_more`; recent history previews 20 events with source kind/version and `has_more`. Preview truncation is separate from permission completeness. Recent history is explicitly limited to Schedule and Baselines, including native lifecycle events, and is not a complete merged Activity/RAID audit feed. Portfolio attention covers saved coordination records; Sales completeness and change flags are separately exposed in the detail.

Signed page tokens bind the actor, workspace, working company, filters and page size. They are transient and fail after process restart or altered query. Each page and count is current to its response, not a frozen multi-page export; later writes/revocations may change subsequent pages. Existing active-user and grant scope applies to every read. No browser caching or new export is introduced.

## Verification and remaining scope

PJ01-01 and PJ01-HTTP01 exercise native receiving, stale link refusal, duplicate recovery, exact original attribution, successor history and source revocation. PJ02-01–04 and PJ02-HTTP01 exercise independent expected dates/counts, baselines, transitive dependencies, native Activity changes, no-write snapshots, paging/filter bindings and current company/workspace/source denial. These support the relevant AT-21/24/32/38 obligations without claiming full acceptance. The existing PJ-09 closeout proof checks the new read's closed state; the existing real PostgreSQL/process restart proof checks original overview and portfolio recovery. Actual outcomes belong in the [execution record](../testing/evidence/project-overview/README.md).

The accepted Figma page, shell rollout, full merged history, related-domain summaries/record position, project notes, SharePoint links, MYOB commercial summary and operational owner/device acceptance remain separate. PJ-03 configurable calendars/actuals remains the next BC-02 backend increment. The native page is not silently relabelled implemented by delivering these APIs. No merge, hosted deployment, external communication or business transaction follows from this work.
