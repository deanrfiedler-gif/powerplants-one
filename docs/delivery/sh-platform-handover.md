---
document_id: PPO-SH-DEL
revision: r01
date: 2026-09-23
owner: Dean Fiedler
status: Implemented with local verification recorded; source review and owner acceptance separate
source_commit: ccc2251bbba9df266cac9027ddaa9418ab9abc1d
---

# My Work and platform SH-01–SH-06 handover

Dean authorised execution of the supplied implementation prompt on 23 September 2026, with concurrent PR handling taking precedence. The clean existing worktree at `tmp/en07-change-impact` was detached at fresh main `ccc2251b`; dedicated branch `feature/sh-my-work-platform-completion` was created there after inspecting all open PRs. No unrelated working changes existed. This increment is a synthetic modular-monolith implementation, not owner acceptance, a deployed release or production integration.

## Maintained scope coverage

This table is the current runtime supplement to the issued page register. It preserves SH identifiers and parent scope: CRM-03, DOC-06, NFR-01/05/08/11 and the established F04/F06 mappings. Issued HTML, reports, blueprint references and all 78 parent IDs remain unchanged.

| Scope | Treatment and runtime outcome | Status and boundary |
|---|---|---|
| SH-01 Role-based home | Retains the existing desktop and Sales phone overview, activity commands, overdue/date-needed rules, schedule, waiting work and next-action gaps. Review summaries use SH-06, identify bounded counts and withhold totals when a source fails. | Implemented; regression evidence below. Existing unresolved business rules remain unchanged. |
| SH-02 Action centre | Preserves `/work/actions`, `/work/waiting`, `/work/team`, `/work/[id]`, `/work/new`, current filters, pagination, commands and recovery. Updates and Reviews use the same secondary menu. | Implemented; team queue remains a permitted owner/work view, never a canonical Team identity. |
| SH-03 Notifications | Real durable Activity audit-event projection, personal read/archive state, independent current owned obligations, four views, persisted category/digest/quiet-hour preferences and a shared header bell. | Implemented for Activity events; broader event adapters and external delivery are dependent. |
| SH-04 Search | One service powers compact shell search, `/search`, per-type cursors and freshly authorised previews. Adds native Facilities/growing areas and exact issued job packs to existing domain readers. | Implemented for listed sources; general Documents and Knowledge discovery depend on DK runtime. |
| SH-05 Saved views | Existing My Work storage/IDs survive. Adds an explicit target registry and reusable personal management for Search, Reviews and Notifications; create/use/update/rename/duplicate/pin/retire and conflict recovery. | Partially dependent: personal functionality implemented; team sharing is Not configured pending canonical AD-01 teams/membership. |
| SH-06 Reviews/handover | Six perspectives over real Service reports, Finance handoffs and Engineering change reviews/receiving requests. Current revision, known submission time, Date needed, source owner, return reasons and selected-detail refresh. | Implemented for connected source contracts; other domain adapters remain dependent. |

## Reconciliation with main and references

The source audit found substantial `/work` desktop/phone functionality, persisted personal views, permission-scoped shell search and Service/Finance coordination. The old STATUS statement that full My Work integration was separate and SH-03 was design-only was stale. Historical My Work decisions D10/D12 are supplemented by [ADR-0041](../decisions/ADR-0041-sh-platform-coordination.md): notification runtime is now connected, and later Engineering change state permits an additional truthful review adapter. No earlier source-owned command or overdue definition was replaced.

The Notification and Approvals/Handover r01 references supply their four/six perspectives and meaning distinctions. Current r22 styling and the existing application shell supply the rail, header, controls, menu and native dialog. No second application frame or standalone HTML application is introduced. The saved-view platform uses the same personal/version semantics while retaining the established My Work editor and storage; it does not silently migrate old IDs to a new store.

## Routes and contracts

New page: `/search?q=<query>&kind=<type>&cursor=<opaque>`. Changed interiors: `/work/reviews` (criteria/page in the URL) and `/work/updates` (four perspectives and `?notice=<id>` deep link). Existing `/work` desktop/phone and its secondary navigation receive qualified review counts. Header compact search adds **View all results**; the bell opens the canonical Notifications workspace.

| Endpoint | Behaviour |
|---|---|
| `GET /api/v1/shell/search?q=<query>` | Existing compact contract, now the shared search service; five per permitted source, no invented total. |
| `GET /api/v1/search?q=<query>&kind=<type>&cursor=<opaque>` | Twenty per type; select one type to use that source's bound cursor. Source states distinguish available, denied and unavailable. |
| `GET /api/v1/search/preview?kind=<type>&id=<id>` | Registry allowlist plus current domain detail reader; minimal current projection. |
| `GET /api/v1/notifications` | Up to 200 notices in the UI; API permits 1–500. Counts explicitly bounded; owned obligations independently queried. |
| `GET /api/v1/notifications/:id` | Current recipient and source permissions; event/current versions remain distinct. |
| `POST /api/v1/notifications/state` | Atomic explicit read/unread/archive/restore of displayed IDs with expected versions. Same desired effect may safely repeat. |
| `GET/POST /api/v1/notifications/preferences` | Personal versioned preferences; no delivery is initiated. |
| `GET/POST /api/v1/views` | Versioned personal criteria, registered target/schema validation, max twelve new-platform views. |
| `GET /api/v1/reviews` | Six perspectives, query/module/kind/owner filters and thirty-row pages within disclosed source windows. |
| `GET /api/v1/reviews/preview?id=<id>&version=<version>` | Re-resolves source/access; version mismatch requires explicit current-copy refresh. |

Reads use private/no-store responses; writes use the existing identity, JSON and same-origin boundaries. No new capability, role, grant, user or seed is introduced. Presentation preferences never grant business access. Permissions are enforced by the owning source for lists, counts, breadcrumbs, previews and source navigation.

## Data and architecture

[ADR-0041](../decisions/ADR-0041-sh-platform-coordination.md) precedes technology choices. Migration **0043** adds `notification_events`, `notification_states`, `notification_preferences` and `platform_view_preferences`, with workspace/user ownership, event deduplication and personal versions. It leaves `work_view_preferences`, source records and identities unchanged. The registry, all exact applied-version expectations and the hosted upgrade count/guard are updated; the hosted guard change was reviewed as additive tables with no backfill/seed and the existing generic privilege path. No `business_identities` ALTER is added.

`notifications/service.ts` catches up from accepted durable Activity audit events for the current owner. A historical event does not assert historical ownership. It copies immutable event/source identity, revision and time, and resolves display information afresh. Replaying ingestion cannot duplicate `(workspace, recipient, event)`. Old events cannot overwrite source state. Opening does not mark read; reading never acknowledges/completes business work. Required owned Activities reject archive and remain visible independently of inbox state or email preference. Group read applies to the displayed group IDs, not hidden history or other recipients.

`shell/search-service.ts` uses the source registry for compact and full search. Implemented sources: Engineering package, Lead, Project, Deal, Customer, Contact, Site, Equipment, Activity, Service request, Facility/growing area and issued job pack. Facility context uses permitted organisations, site and labelled physical-parent/grouping context; same names retain UUID identity. It does not confuse served-area/control relationships with physical containment. Issued-job-pack discovery resolves exact authorised issues before filtering/pagination. General DK discovery and Knowledge have no adapter and are disclosed as pending. All-source results are bounded samples; only a single-type source provides a cursor, never a whole-repository count.

`reviews/service.ts` provides the shared projection consumed by the full queue and overview. Service uses the existing bounded report window; Finance pages up to 500 projected tasks and Engineering up to 200 packages, all explicitly qualified. Source failures contribute no tasks from that source. Finance reviewer eligibility is not an invented named assignment; source separation of duties still applies. Unknown submission/due dates stay unknown. History contains current source records in their terminal states, not a fabricated universal decision journal. Engineering reviewer tasks are current only while that source revision is InReview. A returned proposal supplies one correction task; returned receiving work uses its explicit correction owner, deadline and reason from the latest submission. Returned to me includes the sender and any named correction owner, within source access. Details include the current version and source-owned correction/receiving information; there is no SH approve/complete/resolve command.

## Verification and evidence

[Evidence index](../testing/evidence/sh-platform/README.md) records exact commands, executed counts, responsive captures, baseline failures and final publication status. Local execution and retries are recorded separately from CI; this handover does not infer owner acceptance from either.

The unchanged baseline unit run was 328/332: four Windows-only private-document/path failures. Baseline My Work/shell database tests passed 9/9. The final full unit run was 332/336 with the same four baseline failures and all four new SH unit cases passing. Final focused SH/shell units passed 9/9; affected database cases have passing executions with two disclosed setup retries; final compiled SH browsers passed 11/11 plus five focused bell/receiver checks; final HTTP passed 1/1. Lint, typecheck, compiled build and documentation assurance passed. Exact commands and retry/baseline details are in the evidence index. No guard was weakened. Local Chrome 153.0.8010.53 passed the maintained guard.

Initial browser verification found and corrected a saved-preference JSON key-order comparison, missing Search breadcrumb metadata, a CSS-specificity collision with the existing My Work reset, and notification-row alignment. Entirely unavailable sources withhold numeric totals. The combined compiled My Work/SH/shell run passed 35 tests with 20 intentional opposite-viewport skips; all seven required widths passed the overflow checks. Captures are made after data is ready, not just after the page heading. Negative fixture responses are labelled presentation evidence; database tests provide real permission/revocation proof.

## Dependencies and acceptance

- AD-01 canonical teams/membership are absent. Team sharing remains unavailable; departments, roles, workspaces and arbitrary user lists are not substitutes.
- General Documents/Knowledge runtime and additional event adapters are not claimed. The exact issued-job-pack adapter is narrower than general document search.
- Estimate approval and Sales-to-delivery receiving task contracts are not fabricated. Service, Finance and Engineering remain authoritative for decisions, return rules, due dates, identity and audit.
- Email/push/SMS providers are not connected. Preferences persist, but there is no sender, scheduler, receipt or delivery promise.
- Owned escalations show current required Activities; no escalation threshold or new business policy is inferred.
- Browser emulation is not physical-device acceptance. Owner visual/business acceptance, production readiness, hosted migration and deployment remain separate.

## Git and concurrent work

Branch: `feature/sh-my-work-platform-completion`. Initial main: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. The later refresh found #281 merged as `c5280be7ed4b20e970d244af79d08567784a8046`, and the branch was rebased before final verification. Both STATUS contributions and the browser-runtime register revision were retained; the newer PL-01 merge record was also preserved. #282 remains open and independent. The final local browser checks use the merged guard with Chrome 153, and CI runtime evidence remains separate.

Implementation commits after rebase: `571138f` (services/persistence) and `65852d1` (application integration), followed by `e71cbe5` (source-state refinements and real review journeys). Follow-up verification and publication evidence is maintained in the evidence index. Nothing is merged or deployed by this task. The next bounded step is source/owner review of this increment and explicit disposition of its documented dependencies.

The final concurrent-work inspection also found draft PR #283 (local design register/page guides). It overlaps `src/app/layout.tsx`, `src/components/shell-controls.tsx`, STATUS and the document register. Its already-published ADR-0040 led this branch to renumber its new SH decision to **ADR-0041** before publication; no parent requirement ID changed. The draft is not copied or merged here. Future integration must retain both shell contributions and update its local page inventory for `/search` and the changed SH interiors.
