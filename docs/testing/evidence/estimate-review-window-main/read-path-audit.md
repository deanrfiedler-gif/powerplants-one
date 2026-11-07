# Queue read and page-request audit

Source: main `5a1c09fd3`, PR #866. This audits function calls, including conditional discovery/source/specialist/quotation branches, rather than assuming an imported command module is executed. See [writer inventory](writer-inventory-v3.md) for the complete read-table set and transaction classifications.

## SELECT-only domain call graph

The transaction envelope in `platform/database.ts` issues BEGIN and COMMIT (ROLLBACK on error). Those lifecycle statements are outside the read callback. Within the callback every database call is SELECT, including the candidate `WITH candidates AS (...) SELECT` and SELECTs that lock the workspace. There are no data-modifying CTEs, sequence calls or mutating stored functions on this path.

| Reachable function(s) | Further calls and SQL |
|---|---|
| `readEstimatingReviewQueue` | `queueQuery`; `requireCapability`, `hasPermission`; workspace lock SELECT; clock SELECT; candidates SELECT using `estimateVisibility`; `estimateReviewInTransaction`, `releaseInTransaction`, `queuePerson`, `queueSite`; final authority rereads; pure `inQueueView`, `queueCounts`. |
| `estimateVisibility` | Pure SQL construction via `scopeSql`, `opportunityVisibility`; discovery-root/basis/revision subqueries. |
| `estimateReviewInTransaction` | `exactBasis` for current and each historical submitted version; `reviewHistory`; `reviewAuthority`; `hasPermission`; pure `latestDecisions`, `reviewBasisHash`, `estimateSite`. It does not call `readEstimateReview` (the detail transaction wrapper). |
| `exactBasis` | `estimateContext`, `versionContext`, `sourceBindings`, `sourceContext`, `readLineage`, specialist `configuration`/`run`, `latestCostingScope`, `visibleOpportunity`; pure `versionHash`, `reviewBasis`. |
| `reviewHistory`, `queuePerson`, `queueSite` | Direct SELECTs of review events, the exact user's name, the exact site's name. |
| `reviewAuthority` | `estimateContext`/`versionContext` and `hasPermission`; read authority only, no review command or receipt mutation. |
| `estimateContext` | Estimate SELECT; `costBasisContext`, `hasPermission`, `visibleOpportunity`, `relationshipContext`, `scopedOwner`, `sourceBindings`. Edit-duty checks are still reads. |
| `versionContext` | Exact saved-version SELECT; `costBasisContext`, `sourceBindings`. |
| `costBasisContext`, `latestCostingScope` | `costBasisAvailable` (`to_regclass` SELECT), root/basis/revision/option SELECTs; `readDiscoveryTargets`; pure hash/validation. |
| `readDiscoveryTargets` → private `targets` | `visibleOpportunity`, `relationshipContext`, `visible` for Organisation/Person/Site/Facility/Asset, recursive copied-source revision SELECTs, `visibleActivity` for configured follow-ups. `targets` receives `edit=false`; its `eligibleActionOwner` edit branch is not taken. Pure `compileDiscovery` and hashing validate retained input. |
| `sourceBindings` | `sourcesAvailable` (`to_regclass` SELECT), binding/revision SELECT, `sourceContext`; does not call `insertSourceBinding` or `inheritSourceBindings`. |
| `sourceContext` | Source-header SELECT and `companyContext`; validation only. No source revision or review command runs. |
| `readLineage` | Specialist `available` (`to_regclass` SELECT), lineage and discovery-basis SELECTs; pure estimate/snapshot/line hashes and identity checks. It does not call `writeLineage`. |
| Specialist `configuration`, `run`, `draft` | `requireAvailable`/`available`, installed-definition hash SELECT, configuration/run/draft SELECTs; `workspaceAuthority`, `revisionAuthority`; hash checks, `validateInherited`. `edit=false`. |
| `workspaceAuthority`, `revisionAuthority` | Workspace/revision SELECTs, `visibleOpportunity`, `relationshipContext`; discovery revisions → `readDiscoveryTargets`, legacy revisions → `estimateContext`. No `requireDraftGroup` call, no mutation. |
| `releaseInTransaction` | `releaseAuthority`, `releasePreview`, `releaseHistory`, historical `releaseAuthority`, job SELECT, `requireCurrentRelease`, `hasPermission`; pure policy/eligibility/output-hash projection. No render/retry/prepare/approve/issue command. |
| `releaseAuthority` | `quoteContext` (twice for Prepare authority), `exactBasis`, `hasPermission`, `releaseBase`, `visibleOpportunity`, `relationshipContext`; input/template/basis hash checks. |
| `quoteContext` → `releaseRecipientAuthority` | Revision SELECT, `estimateContext`, exact release-base SELECT and hash; retained-recipient `relationshipContext`. |
| `releasePreview` → `releaseSource` | `exactBasis`, `reviewHistory`, current exact basis, `visibleOpportunity`, recipient organisation/person/site SELECT, quote-header SELECT; pure `latestDecisions`, `quoteAmounts`, `releaseHash`; `releaseTemplate`. |
| `requireCurrentRelease` | Reuses supplied authorised context/source for this read; `releaseTemplate` validates saved bytes. The unsupplied branch also uses only `releaseAuthority`/`releaseSource`. |
| `releaseBase`, `releaseHistory` | Exact base and ordered event SELECTs. |
| `releaseTemplate` → `quoteTemplate` | Reads the repository logo file, creates escaped HTML and hashes in memory. No database call, document-store write, renderer or provider call. |
| `visibleOpportunity`, `opportunityVisibility`, `relationshipContext` | Opportunity SELECT with scoped visibility; `companyContext`, `visible`, relationship/site-party SELECTs and installed-pipeline/stage check. |
| `companyContext`, `scopedOwner` | Company and exact active-user SELECTs; `hasPermission`, `visible`. |
| `visible`, `visibility` | Exact shared-table SELECT; `requireCapability`, scope subqueries for site parties/person company contexts. No shared projection/list command is called. |
| `visibleActivity`, `activityVisibility` | Activity SELECT; `crmAvailable`, `leadsAvailable`, `projectsAvailable` (`to_regclass` SELECTs), link EXISTS predicates with `opportunityVisibility`, `leadVisibility`, `projectVisibility`, `ticketVisibility`, `visibility` and `scopeSql`. These predicates do not call the corresponding command services or project/ticket detail reads. |
| `requireCapability` → `hasPermission`, `scopeSql` | Live grant/user SELECTs; `workingCompanyFor`/`workingCompanyCondition` read validated request-local memory only. No grant cache or working-company database write is introduced. |

Other reachable operations are pure validators, arithmetic, sorting/filtering, JSON canonicalisation, SHA-256/HMAC input handling and error construction. Imported `sharedOperation`, service writers, receipt recovery and specialist reconciliation functions are not invoked. The database proof rejects non-SELECT callback statements, including write-bearing CTEs/multiple statements, and explicitly exercises quotation/history, source-bound and specialist/discovery branches. Runtime coverage complements this source audit; it is not a claim that one fixture executes every conditional.

## Register and shell during continuation

The test is `tests/browser/estimate-reviews-register.spec.ts`, “empty awaiting-my-review windows retain native continuation beyond 25 candidates”. It awaits identity setup and all 26 native fixture commands before page navigation. During the two Next-window steps it opens no snapshot, detail link, notification panel, guide, search or account control.

| Request or operation | Trigger / overlap | Coordinator workspace row lock |
|---|---|---|
| `GET /api/v1/estimating/reviews?q=…&view=awaiting_me` at offsets 0 and 25; default-view equivalents | Register mount, query changes, focus and 15-second refresh via unchanged `useCrmResource`. Superseded requests may continue on the server. | Queue lock; proposed FOR SHARE. Concurrent queue reads therefore compatible. |
| `GET /api/v1/local-session` | BusinessSession mount on document navigation; its session-ready event can also reload shell context. | None: session/user SELECT and request working-company resolution. |
| `GET /api/v1/shell/context` | ShellProvider mount/revalidation; may overlap queue requests. | None. Capability/company/working-company SELECTs. Expired working-company cleanup is an autocommit DELETE of `working_companies`, not a workspace lock. |
| `GET /api/v1/conversations/badge` | Shell conversation controls after context resolves; focus re-read, potentially more than one mounted control. | None: read-only SELECT transaction, no workspace row lock. |
| Next document/RSC navigation, visible-link prefetch, JS/CSS/fonts/images/icons, released guides/manifest/service-worker resources | Document navigation or Next asset/prefetch machinery | No workspace FOR UPDATE. The review page itself only renders the client register; root layout reads released guides and development authority. Prefetching a route does not execute a client detail API effect. |
| `POST /api/v1/local-session` and fixture opportunity/estimate/review commands | All awaited **before** initial `page.goto`; no fixture command is started after that point. | Identity session/audit insertion has no workspace-row lock (FKs target users); native business writes use FOR UPDATE but have committed before continuation. |
| `GET /api/v1/estimating/reviews/snapshot`, estimate `/review`, quotation `/release` | Only after selecting a row/opening its exact detail; this test does neither. | FOR UPDATE retained, but cannot overlap this sequence because no call is issued. |
| `/api/v1/notifications`, shell search, `/api/development/catalog`, company selection, hosted demo role selection | Require opening the corresponding panel, entering search text, choosing company or hosted mode; none occurs here. | Not a continuation request. No conclusion about unused controls is needed to exclude them. |

The initial fixture creation may internally load detail readers while preparing commands, but the test awaits them before navigating. No background quote worker is started by this manual-line fixture. The detail route’s FOR UPDATE remains unchanged. No surviving page/shell request in this sequence holds a conflicting workspace FOR UPDATE once fixture setup completes. Browser request diagnostics are deliberately additive and will establish the **actual** queue overlap (H2) on the ready head; source analysis alone does not establish it.
