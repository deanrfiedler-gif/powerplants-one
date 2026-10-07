# Navigation implementation

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Review:** Pending · **Date:** 8 October 2026.

This session implements NAV-02A through NAV-06 under the current user instruction. Baseline remote default branch `main` is `4f883d145b18876840c5ce5522059c95448dc086`, identical to NAV-01. The original root checkout is older (`95c0887`) and its existing untracked worktrees remain untouched. Work is isolated on `codex/nav-implementation`.

The supplied report, route inventory, 34-scenario matrix and static JSON were read from the user's 8 October Codex outputs. They contain static evidence, not executed browser acceptance. Issued references remain unchanged.

## Ordered work

| Package | Files and dependencies | Acceptance |
|---|---|---|
| NAV-02A | Survey and Acceptance callers; bounded canonical Equipment/Activity href helpers; receiving return links; existing scoped readers | N01–N03: exact IDs, safe source return, honest denied targets, retained CRM redirects |
| NAV-02B | Existing shell registry/provider/selector/controls, Home/start, leave hooks and offline callers | N04–N10/N20: permitted landing, operational workspace availability, all-of review discovery, cancelled transitions preserve preferences and original commands, truthful hosted actions |
| NAV-03 | Registry metadata and synonyms, quotation landing reader/UI, breadcrumb context | N11–N17: all implemented indexes discoverable, device scope/date parity, bounded pagination and accurate authorized identity |
| NAV-04 | Existing primary rail/CSS, local menus, help and not-found recovery; shared tokens/components | N18–N23/N31: accessible identity-scoped collapse, mobile equivalence, active parents, focus/reflow and actual screenshot inspection |
| NAV-05 | Deal/handover/Engineering view state, estimate revision selection, reviewed-report/Finance context | N24–N30: validated shareable state, exact receiving authority, no automatic transactions; retain safe login boundary unless explicitly redesigned |
| NAV-06 | Focused fixtures/tests, development page/component/guide masters, decision/status/evidence | N01–N34 ledger with exact source/environment/results; required applicable checks, reviewable diff and PR; no merge/deployment |

No new module, grant, schema, integration, dependency or ERP endpoint is authorized or needed. MYOB, SharePoint, native CAD and independent receiving controls retain their authority. Order/installation remain existing Project/Service/Supply/commissioning journeys. Record adapters and server-bound login-return implementation are deferred unless their complete scoped contracts are established; permission-aware Home is required now.

Verification uses a task-owned loopback PostgreSQL cluster on port 5548 and named `ppo_synthetic_test`, separate from the existing user database. Its private configuration and generated documents remain outside Git. Results, screenshots and remaining fixture gaps are recorded in `docs/testing/evidence/navigation/` separately from owner acceptance and deployment.

## Delivered behaviour and source

Application checkpoint: `f1f04ba12c49003398652917b16d9c47e45edf8a`. Documentation/evidence commits follow it without changing application behaviour. Parent traceability remains NFR-01, NFR-07 and NFR-08, blueprint Sections 20–21 and AT-10/AT-11/AT-23/AT-34/AT-36. These links identify design intent, not accepted business tests. The NAV finding numbers are audit identifiers, separate from the product-quality child register.

| Behaviour | Main files |
|---|---|
| Exact Equipment/Activity targets and safe source returns | `src/shell/context-links.ts`, `cs-workspace.tsx`, `activity-screens.tsx`, `equipment-workspace.tsx`, `projects/acceptance/workspace.tsx` |
| Useful permitted Home, workspace landing, all-of inspection discovery | `src/shell/navigation.ts`, `shell-provider.tsx`, `shell-workspace-selector.tsx`, `src/app/page.tsx`, `platform/installation.ts`, local login and `demo-gateway.ts` |
| Pointer/touch/keyboard/history review and truthful offline actions | `navigation-intent.ts`, `record-ui.tsx`, `use-unsaved-preferences.ts`, `discovery-navigation.ts`, `shell-controls.tsx`, `offline-entry.tsx` and field/report/timer consumers |
| Incremental discovery, synonyms, scoped older quotations, precise context | `navigation.ts`, `shell/reads.ts`, `estimating/estimates.ts`, `navigation-landings.tsx`, `record-identity.tsx`, `product-navigation.tsx` and authorized record publishers |
| Compact/expanded primary rail and equivalent phone meanings | `product-navigation.tsx`, `desktop-shell.css`, `styles/leads.css`, `styles/my-work.css`; existing secondary-menu docking retained |
| Shareable Deal/handover/Engineering sections and exact estimate revisions | `contact-workspace.tsx`, `crm-screens.tsx`, `sales-handover.tsx`, `engineering-workspace.tsx`, `estimating-screens.tsx` |
| Contextual Report/Finance discovery and deliberate receiving form | `finance/report-navigation.ts`, `reports/service.ts`, `report-screens.tsx`, `finance-screens.tsx` |
| Working design/help records and bounded evidence | `docs/design/development/`, NAV decision, this handover, `docs/testing/evidence/navigation/`, `scripts/verify-navigation-*.ts`, focused navigation tests |

The unchanged permissions file remains the capability authority. No grant, schema, dependency, new business module or native ERP endpoint is added. Existing CAD, MYOB and SharePoint responsibilities remain.

## Revalidated NAV-01 findings

Remote main still equals the audited commit when checked during final verification. **Already fixed: none.** Source repairs are distinguished below from remaining browser/fixture acceptance.

| Finding | Disposition | Result / limit |
|---|---|---|
| F01 | Fixed | Survey uses `/equipment/{exact-id}` and a bounded source return; missing targets show unavailable scope. Saved two-asset rendered links tested. |
| F02 | Fixed | Owned Activity uses `/work/{exact-id}` and returns to the exact stage/obligation fragment. Denied target loses identity and return link. |
| F03 | Fixed | Fixed login/app start opens permission-aware Home; `/work` is retained for activity readers; no-grant identity gets a clear state. Pack-reviewer/lead-only/field-only capability contracts have unit proof; hosted personas remain unverified. |
| F04 | Fixed | Shared intent covers shell pointer/keyboard/touch and workspace transitions; cancellation cannot persist selection. Discovery keeps priority and its original-command/history guards. Browser close limitations remain explicit. |
| F05 | Fixed | Hosted recovery describes its unavailable offline workspace; local original-operation entry remains. Gateway refusal is unchanged. Live hosted browser branch is unverified. |
| F06 | Fixed | Owned operational destinations establish available workspaces and declared landings. Shared My Work does not advertise unrelated departments; ordinary picker and Development preview are distinct. |
| F07 | Fixed | Receiving Intake, My inspections, Incidents and Inspection review have permitted More/rail entries, retaining contextual routes. |
| F08 | Fixed | Inspection discovery requires both capabilities; existing per-record scope remains authoritative. Incompatible-scope combined persona lacks a fresh fixture. |
| F09 | Fixed | All Sales links share validated day/scope/department policy, including a previously selected day. Broader access is labelled Personal Calendar. |
| F10 | Fixed within bounded source | `q`/`offset` continue through scoped estimate windows; exact quotations retain their guard. This is explicitly a partial source, not a complete quotation register. |
| F11 | Fixed within authorized publishers | Specific route/view fallbacks and loaded reference/title distinguish hierarchy from source/results returns. URL UUIDs never become identity labels. A labelled Page hierarchy disclosure exposes authorized ancestors hidden by compact header sizing; Escape restores focus. Wider conditional record variants need their own fixtures. |
| F12 | Fixed | Duplicate Service/Email header tabs removed; module menus retained. Specific Engineering/Product/Equipment/Finance/Programme parents resolve deliberately. |
| F13 | Fixed | Validated URL sections and estimate membership restore selected state. Engineering request completion clears its own guard before opening the accepted package; retained notes and uncertain recovery are preserved. |
| F14 | Fixed | Real 76/232 px primary rail control, identity/browser persistence, visit-memory fallback and labelled phone Workspace/More. Real zoom/device acceptance remains open. |
| F15 | Fixed page vocabulary; record expansion deferred | Page synonyms and Page labels are implemented. Existing scoped record search is retained; no new incomplete record adapter. |
| F16 | Implemented; combined rendered branch unresolved | Exact current-revision Finance links and deliberate source-prefilled form retain receiving checks. Scoped reader/form proof is separate from the unavailable seeded combined Report/Finance role. |
| F17 | Deferred by decision | Arbitrary return reflection remains refused. A server-bound return intent requires its own reviewed security design; permission-aware Home is delivered. |
| F18 | Fixed working guidance/recovery; review pending | Actual navigation/mobile help and truthful not-found Home recovery updated. Shell r17 and theme r22 remain distinct issued references. No owner acceptance implied. |

## Route, discovery and query contracts

[Current route/discovery map](../testing/evidence/navigation/route-discovery-map.json): 199 page files including five compatibility aliases; 196 canonical register entries including login/local offline; 75 shell destinations, 62 with hrefs and 13 explicitly unavailable. The only destination addition names existing Engineering Technical queries. No route is added, so `studio:sync` is unnecessary. Every operational index is classified under an owning rail/More or named module view; dynamic records retain their register and contextual source entry. This static map does not prove every rendered conditional edge.

| Contract | Validation / receiving authority |
|---|---|
| `/equipment/{id}?returnTo=...` | Exact target preserved. Return accepts only known `/surveys/{uuid}` with optional `view=overview`; equipment reader owns access. |
| `/work/{id}?returnTo=...` | Exact target preserved. Return accepts only `/projects/acceptance/stages/{uuid}#obligation-{uuid}`; Activity/stage readers own access. |
| `/calendar?day=YYYY-MM-DD&scope=sales&department=sales` | Real calendar day validated; invalid/missing day uses current Brisbane day. Rail, phone, More and search retain the same selected day. Personal Calendar omits Sales scope and is labelled separately. |
| Deal `section`; Sales handover `view`; Engineering `package_id`/`section` | Allowed view values or safe fallback; unrelated query state retained. Engineering package still passes its exact reader; sections are separate from register view. |
| Estimate `version_id` | Owning reader validates record membership. Invalid/unavailable revision falls back to a rechecked current version with `revision_status=unavailable`; no navigation save. Review remains its independent current saved-evidence workflow. |
| Quotation landing `q`/`offset` | Bounded title/reference filter (100 characters), windows of 100 scoped estimates, offset capped at 1,000,000; exact quotation access separately checked. |
| Finance form `work_order_id`/`report_id` | UUID syntax, permitted work options and source/work eligibility rechecked. Account/quantities/recipient not automatically chosen. Opening creates no handoff/posting. |
| Five `/crm/...` aliases | Existing redirects preserve supported query state: Lead index/detail; Deal index/detail/new → corresponding `/sales/...` routes. No `/assets` or `/activities` aliases conceal bad callers. |
| Authenticated start `/` | Permission-aware Home; no caller-supplied `returnTo`/external URL reflected by the gateway. |

Technical queries, every Supply view, Maintenance/Warranty subviews, Equipment portfolios, shared Contacts/Sites/Facilities and exact Documents remain present. Unavailable Settings, global Documents, native sales orders, portal and Installation remain unavailable/unimplemented. Supported installation work uses Project, Service and commissioning; quotation conversion is synthetic Supply demand, not ERP order creation.

## Review and verification

[N01–N34 execution ledger](../testing/evidence/navigation/scenario-results.csv) records source commit, environment, fixture/role, actual result and remaining gaps. [Screenshot review](../testing/evidence/navigation/screenshot-review.md) records inspected compact/expanded desktop, phone, long-menu and restricted-role captures. Neither document marks owner/device review accepted. Full logs/traces remain private; bounded result records accompany the contribution. CI, merge and deployment remain separate.
