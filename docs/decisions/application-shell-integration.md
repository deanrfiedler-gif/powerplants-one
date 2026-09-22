---
document_id: PPO-SHELL-DEC
title: Application Shell r17 integration
revision: r01
date: 2026-09-17
status: Authorised implementation for PR review; deployment pending
owner: Dean Fiedler
source_commit: e1b705acc5457dab6fc0b6a2f0c977132cbd2215
---

# Application Shell r17 integration

Dean authorised **Integrate Application Shell r17** as the next implementation PR, releasing the shared frame around existing working pages while the remaining modules are added. This contribution prepares that PR. Merge, Azure deployment and owner acceptance are separate from this implementation.

## Design authority and conformance

| Field | Declaration |
|---|---|
| Scope | Existing shared Application Shell in page coverage register r06; BP-01 section 8.2 shared identity, navigation and search. No new module, parent requirement or business workflow. |
| Page type | Shared application-frame variant; the r20 module-only page types continue to govern each interior. |
| Source | [Application Shell r17](../reference/ui/application-shell/PPO-Application-Shell-r17.html), SHA-256 `fd934f2d22501aec9dd96c924bb002f5fecf2db36e49264a2487c6dd9361572d`; [unchanged companion report](../reference/ui/application-shell/PPO-Application-Shell-Report-r17.md). The latest user instruction authorises integration of the r15–r17 refinements. It does not certify native visual/device acceptance. |
| Reuse | `ProductNavigation`, `ProductHeader`, `ProductIcon`, `BusinessSession`, `HeaderContent`, `SessionViewBoundary`, existing scoped shell reads, Quick add forms and record routes. Logo and existing app fonts remain local. No new framework or dependency. |
| Incoming | Actual authenticated principal, currently valid capabilities, active route, existing module contents and approved guide content. |
| Outgoing | Links to existing application pages/forms under their current server access checks. No business record is created merely by selecting a workspace or menu item. |
| Recovery | Access-loading/error and retry; planned or inaccessible navigation; validated browser preference with visit-only fallback; abort/stamp checks on identity lock; unavailable business-page guides; disconnected notification feed. |
| Departures | Runtime identity replaces standalone DF; existing pages replace the blank preview slot; actual route determines breadcrumbs and mobile workspace; permitted previews navigate to real workspace roots instead of clearing the page. More includes the existing Sales and Service destinations beyond the standalone 20-item inventory. Synthetic context moves to the More footer. |
| Existing exception | The accepted Leads phone experience deliberately hides the shared header and bottom bar and keeps its dedicated controls. This PR preserves that explicit, tested exception rather than redesigning its workflow. |
| Verification | See the [handover](../delivery/application-shell-handover.md). Source/build tests, CI interaction proof, visual review and business acceptance are separate claims. |

The older [desktop r05 integration record](desktop-shell-integration.md) remains historical evidence. Its 96px rail, 80px logo and Sales rail entries are superseded for the shared frame by r17's 76px rail, 54px logo and bottom More control. Other module design baselines and their exact issued bytes are unchanged. The shell is not added as a module-only scoped baseline to `ui-baselines.json`.

## Runtime behaviour

The header uses a single line: **Powerplants One** on `/`, then the current page label on actual page routes. Sales is the workspace name; Deals and Leads retain their canonical `/crm/…` routes and capability identifiers. Shared Customers/Contacts retain their current ownership. No data architecture is renamed.

Quick add sits 12px to the right of the globally centred desktop search field. Page guide, Quick Help and Notifications share 22px icons and 44px targets. On a phone, the compact heading shows the page name, or Powerplants One on the home template. The account avatar comes from the actual signed-in user's name. More's title and footer are outside its scrolling body. Searchable groups expose Workspaces, My workspace, Shared records and Administration & support, with ordinary links and explicit unavailable/planned states.

`GET /api/v1/shell/context` adds `navigation` (permitted destination IDs) and `can_preview`. Both are derived server-side after existing authentication. The latter is enabled only in the existing local-synthetic and private azure-demo runtimes; it is a presentation feature for authenticated demo users, not a developer role or an impersonation facility. It creates no grants. The server still checks company/site/record scope on every page read and command. No migration, new environment variable, Entra permission or Azure resource is required.

One shared provider owns context loading/retry and lock invalidation. Global search retains debounce, abort and generation guards. Identity switches, local sign-out and cross-tab locks clear displayed search data and permitted navigation; late results cannot restore them. Existing form entry permissions and server creation checks are retained.

The account popup's Development → Preview workspace offers seven workspaces. The validated r15 preference key stores only schema version and workspace ID. Available roots open with current access; a planned or denied selection leaves the current page open and explains why. On a business page, the real route wins over a stored preference so Projects or Engineering never shows Sales mobile tabs. Shared pages use the selected preference. Foundation checks remain local-only; the Documents index and Supply chain remain planned.

## Department navigation amendment — 22 September 2026

The [department navigation decision](department-navigation-icons.md) supersedes r17's desktop no-shortcuts choice under Dean's explicit implementation instruction. Seven ordered rails share one semantic outline/active icon catalogue, with logo and More fixed around scrolling shortcuts. Live links require readiness and current server-derived permissions; unavailable destinations are omitted from the rail and More. The [coverage register](../delivery/department-navigation-coverage.md) names every withheld capability.

Shared pages retain a user/workspace-scoped department preference, with URL context for reload, history and new tabs. The selector retains compatible shared pages and otherwise opens a permitted department landing or My Work. Contacts groups the existing People and general Organisations directory. Pulse, Tasks, Sales Activities, Quotations, Programme and Customer accounts reuse existing services through bounded adapters. Sales URLs and technical CRM identifiers remain unchanged. All other r17 frame decisions and dedicated mobile/offline exceptions remain.

Executed verification and concurrent-main reconciliation are in the [navigation handover](../delivery/department-navigation-icons.md). This amendment does not approve missing business modules or deployment.

## Help boundary (retained r17)

The information icon opens a separate Page guide with the current page name, shared shell instructions and a journey map. The concise Quick Help stays available. Only the shell guide is authored in the r17 source; other routes explicitly say their detailed guide is being prepared. This PR does not present navigation guidance as a completed business workflow guide.

The [contextual-help design](contextual-help.md) remains the broader proposed renderer/content lifecycle/SOP direction. Its older CRM pilot describes a previous two-stage implementation and must be reconciled with the current five-stage workflow before runtime publication. This bounded shell increment does not silently adopt that stale article, connect private SOPs or claim HELP-01–HELP-14 acceptance.
