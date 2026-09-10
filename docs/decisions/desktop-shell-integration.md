# Shared desktop container integration

**Decision date:** 10 September 2026 · **Status:** implementation for review; deployment pending.

Dean accepted the final shared desktop container and authorised integration into the broader Powerplants One app. The source is `PPO-Desktop-Container-r05.html`, SHA-256 `262dc3f3da7e5c48612516641a7dbe22a5c2aef3cee79ad93f9554204a904dc2`. The accepted mock-up deliberately has blank page interiors; that restriction defines the design reference, not deletion of existing application pages.

This change builds on `feature/crm-r11-board-polish` at `8aa6c01f1b839c02b70fd4ba7b0c1176db9b65a2` ([PR #75](https://github.com/deanrfiedler-gif/powerplants-one/pull/75)), which itself depends on the combined Email/CRM/private-demo branch ([PR #73](https://github.com/deanrfiedler-gif/powerplants-one/pull/73)). It must be reviewed and integrated in that order, preserving those changes. No Azure image is updated by this decision.

## Shared layout

- One 96px navy rail, seven 30px department icons, intact 80px logo image and a bottom More control. The rail does not scroll at the desktop review sizes. More scrolls internally when needed.
- One 64px header with global search, contextual Quick add, Quick Help, Notifications and existing account controls. Hover/focus labels, Escape, outside dismissal, reduced motion and visible keyboard focus are shared behaviours.
- Real page content and `SessionViewBoundary` remain in the root layout. Existing Service/Customers tabs remain beneath the header. The opportunity filter moves into its desktop page toolbar to keep its meaning distinct from global search.
- Existing mobile bottom navigation, modal menu and page search remain at 780px and below. The r05 desktop reference does not replace the mobile design.
- Account identity and hosted sign-out remain backed by the existing business session. Outside business pages, the Account control identifies the current user and leads to My Work's account controls.

## Destinations

| Location | Destination |
| --- | --- |
| Logo | Overview `/` |
| Sales / CRM | `/crm/opportunities`, including nested deals |
| Estimating & Quotation | `/estimating`, including estimates/quotes |
| Engineering, Projects, Supply Chain | Planned, no operational link |
| Service | `/schedule`, existing Service routes and My Jobs |
| Finance | `/finance/handoffs`, including other Finance routes |
| More: My workspace | `/work`, `/email` (Email & Calendar) |
| More: Customer information | `/customers`, `/people`, `/sites`, `/equipment` |
| More: Shared resources | `/service/reports`; Documents remains planned because only document-detail routes exist |
| More: Administration & support | `/admin`, `/foundation` |

No new department page, document index, notification backend, pipeline stage or business creation command is introduced.

## Read and action contracts

`GET /api/v1/shell/context` takes no query parameters. It resolves the existing authenticated principal and returns the display name plus permitted creation entry points. Both read and create/edit grants are required to offer an action. This is discoverability only: existing forms and commands recheck the selected company/site/record scope.

`GET /api/v1/shell/search?q=…` accepts 2–200 characters and rejects unknown query keys/control characters. It reuses the existing scoped readers for opportunities, organisations, people, sites, assets, activities and service requests, sequentially by domain, with at most five results per type. Results contain only ID, label, reference, type and canonical application link. A denied domain contributes no results. Other failures produce an error, not a misleading successful empty response. The UI names the supported record types and display cap; it does not imply complete coverage of all PPO data.

Search is debounced and abortable. Identity changes/sign-out clear header state synchronously, and stale responses are ignored even if the transport ignores cancellation. The existing cross-tab lock also clears the header. Foundation's local identity selector sends the same ready/lock signals. These signals carry no identity or record data.

Quick add opens existing opportunity, estimate, service-request, work-order, activity and shared-record creation forms. Current-module actions appear first; no synthetic draft form or mock-up records are copied into the app. Notifications truthfully states that the feed is not connected and displays no fabricated unread badge. Quick Help explains the implemented navigation and keyboard behaviour.

These changes support BP-01 section 8.2's shared search, identity and permission requirements while preserving the existing prototype's bounded scope and all parent requirement IDs.

## Verification and remaining work

Local pinned Node 24.20.0 / npm 11.19.0 checks pass: lint, TypeScript, all 43 unit tests and Next.js build. The actual-component review bundle also builds. The build retains the pre-existing report-template dynamic filesystem tracing warning.

New unit cases cover search projection/bounds, denied-domain omission, outage propagation, query rejection and permission-aware action ordering. A disposable database test covers search isolation across companies/workspaces and current grant revocation. Component checks cover the integrated shell at 1366×768, 1920×1080, 800×500 and 960×540, hover labels while More is open, keyboard selection/dismissal, independent page filtering and stale responses after identity lock. Existing CRM phone and retained application checks remain in the normal workflows; changed navigation selectors reflect the approved More placement and Sales label.

The earlier standalone r05 browser recheck was blocked by a browser URL security policy. It was not bypassed. Local static/build success is not browser or database acceptance. Fresh integrated-app CI, screenshot review, actual 200% browser zoom, real-device acceptance and hosted sign-in/deployment checks remain open until their results are recorded. The 960×540 viewport check alone is not proof of browser zoom behaviour.

### Initial CI and corrections

At `bb6532e4`, [CRM assurance run 34426070197](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/34426070197) passed all five database cases, including shell company/workspace isolation and revoked-grant rejection. Six retained desktop/phone component checks also passed. Three new shell component checks exposed a hover-label dismissal race and unscoped test option locators. The latter counted the CRM sort selector as well as global search. Corrections preserve the assertions and bind them to the search listbox. Tooltip dismissal now checks whether its icon or pill is still hovered/focused, and header popovers anchor to their controls as the viewport changes.

The new revocation test initially left its coordinator grant removed, causing later CRM browser setup to correctly refuse record access. Its teardown now resets the disposable fixture before those suites run. This is a test isolation correction; application permissions are not relaxed. Fresh corrected-source CI remains required.
