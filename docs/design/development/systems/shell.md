# Application shell — working design reference

Stable entry: `system:shell`. Owner: Dean Fiedler. Status: Draft for review.

Navigation, global search, context, page guide and the authorised design-workspace entry.

## Desktop

Use the actual shared application source `src/components/product-navigation.tsx`. The shell owns branding, navigation, global search, identity and viewport allocation. Development pages occupy the workspace interior. Shared changes must be checked against every affected consumer, using the complete root stylesheet order.

## Mobile

Check 390 × 844, 320 CSS px and 200% zoom. Preserve meaningful context, labelled actions and reachable close controls. A changed header must leave adequate room for search, the existing information icon and account controls. Preserve the established mobile navigation and unsaved-work protection.

## Change discipline

The live component gallery consumes runtime tokens and the shared Button component. Preview edits are temporary and scoped to the sample. Commit durable changes to source, inspect the consumer list, compare retained references and update any accepted exception deliberately. Record independent visual, functional and release evidence; do not treat a matching token as whole-page conformance.

## Recovery and review

Restore an unwanted working-source change through a reviewed successor in Git. Preserve issued references and past acceptance evidence. Verify keyboard navigation, focus, long content, loading, read-only and error states in the owning workflow. No complete visual review is recorded for this new development surface yet.

## SH search and notification integration

The header search uses the same source registry as `/search`, with a full-results handoff and current-access preview. The notification bell lists durable personal Activity events and links to `/work/updates`; opening is not a read or business action. Preserve the merged development-workspace link and authorised development draft guide within the information control. Validate compact search, the bell, identity changes, guide opening and desktop/mobile navigation together. [SH evidence](../../../testing/evidence/sh-platform/README.md) distinguishes prior captures from post-rebase checks. No new review fingerprint is claimed.

## Protected hosted workspace

In the private hosted app, show the Design & Development shell entry only for the configured owner with an active Microsoft session. Authorise direct pages, previews, guides and reference downloads on the server too. Show the exact deployed Git commit. Hosted refresh reads that release; local refresh reads working files. Temporary examples and theme proposals never save business data or Git edits. Other testers retain their existing help and business access. Verify denied and expired sessions as well as owner access, desktop/mobile wrapping, reference isolation and preview framing. See [release and access decision](../../../decisions/hosted-design-workspace.md).

## Service phone header correction

I5 found legacy identity-dependent grid styles placing utilities over the Service navigation. The current shell flex rule now wins with local identity mounted. CRM’s deliberate second filter row remains explicit. Actual component and compiled shared-shell proofs are recorded in the [Job Pack I5 handover](../../../delivery/job-pack-integration-handover.md); owner/device review remains separate.

## Products navigation and design bindings

The permitted Sales fixture includes Products as its eighth primary destination and in More. Keep the 25 px semantic icons, fixed rail endpoints, header geometry and department-preserving Products link. Six native Products workspace routes bind their corresponding `products-native-*` records in `ui-baselines.json`; those records remain proposed compositions. The shell/conformance fixtures test exact links, source hashes and owning proof files without changing issued r17 or granting owner acceptance. The Products capability and existing permission filter continue to decide visibility. See the [Products evidence ledger](../../../testing/evidence/products-native/README.md) for the failed head and repair results.

## NAV shell evolution

The primary rail defaults to its established compact 76 px mode and expands to labelled 232 px mode. Its schema-checked preference belongs to the identity/browser, with a visit-memory fallback when storage fails. Navy `#242a37` is primary, green `#62bb46` remains a restrained brand accent, and semantic status colours remain. Roboto, logo and icons are reused. The 780/781 px shell boundary and 1200 px secondary-menu docking are retained. Sales phone destinations gain visible labels and Leads retains global Home/More/search/help. Service and Email duplicate header tabs are removed where the module already owns the same views. This is a proposed departure from retained shell r17, informed by theme r22; no issued source or baseline acceptance changes.



Ordinary Workspace lives in More and uses an eligible operational landing; Development Shell preview is presentation only. Search/page navigation reviews dirty work before changing location or preference. Exact loaded reference/title extends route breadcrumbs; denied and loading identity context clears it. Host states are maintained in navigation-fixtures.json. Screenshot inspection and owner/device acceptance are separate in the NAV ledger.

## Bell startup boundary

The header imports the standalone `NotificationBell`; the full Notifications workspace keeps its My Work layout and preferences dependencies at its own route. Rendering, current-authority reads, loading/error/partial states and navigation are preserved. The real desktop host opens the bell from Customers before any Notifications visit, verifies its current notice, Escape/focus return and inbox handover. The phone retains its existing hidden header bell and direct inbox entry. Compiled transfer measurements and the desktop/phone inbox regression are recorded in [first-load evidence](../../../testing/evidence/customer-first-load/README.md); owner/device and paired visual acceptance remain pending.

## Navigation architecture board (proposed)

The private claude.ai design canvas "PPO Navigation Architecture", version 26, maps the six capability domains of the 8 October 2026 brief onto the seven built department rails. It also records:

- navigation rules NR-01 to NR-20 and accessibility rules NR-A1 to NR-A7;
- cross-domain handovers HO-01 to HO-23;
- a record page pattern and a record relationship map;
- landing, attention routing and access scope tables;
- a navigation audit, AU-01 to AU-23, with its resolution record.

Current captures and Mermaid sources: [navigation-architecture-board-r02](../../../reference/ui/application-shell/navigation-architecture-board-r02/README.md). The earlier [r01](../../../reference/ui/application-shell/navigation-architecture-board-r01/README.md) set is retained unchanged. Record and decisions NAD-01 to NAD-08: [Navigation architecture board](../../../decisions/navigation-architecture-board.md).

Dean adopted NAD-08 on 9 October 2026 as a design decision. It adds an eighth workspace, Reports (proposed id `reporting`), for the governed management reports RP-01 to RP-06. Reports owns no records and edits nothing (NR-20). Adding it to the registry needs separate approval.

Everything else on the board is a proposal. The registry in `src/shell/navigation.ts` and [Navigation consolidation](../../../decisions/navigation-consolidation.md) remain the authority.

Built on 9 October 2026, under Dean's approval of professional refinements:

- **Page titles (NR-17).** Each shell page renders its own `<title>` from the breadcrumb's route metadata: record, then page or view, then department, then "Powerplants One"; for example "SYN-PPO-WO-000001 · SYN Ready for scope review · Work orders · Service — Powerplants One". A create page reads "New record · …". The business layout clears the root default title so the shell's is the only one. React updates the title in the route's commit, so the route announcer reads the new name on client navigation.
- **Sales phone bar (NR-02).** A cell the identity cannot open is hidden, as on every other surface. The bar keeps equal cells for whatever remains.
- **Number search (NR-10).** Global search also finds work orders and estimates by number, through their existing visibility-checked readers.
- **Routing note (NR-04).** `application-shell-integration.md` now carries a dated routing note: canonical routes are /sales/…, and /crm/… redirects.

- **Working company (NR-18, AU-02).** A person whose grants reach more than one company can choose a working company in the account panel, or All companies.
  - **Storage:** the choice is kept per person in `ppo.working_companies` (migration 0077).
  - **Scope:** the choice is loaded when each request resolves the signed-in identity and held for that request only. The shared access checks `scopeSql` and record-level `hasPermission` then narrow every page, search and command to the chosen company. Capability checks without a record company are unchanged, so navigation does not change. Code without a request (jobs, seeds, upgrades) is not narrowed.
  - **Safety:** the choice can only narrow access; a grant is still required. The narrowing condition names its own actor, so it cannot affect anyone else's check. A choice the grants no longer reach is ignored on every request and lapses on the next shell read.
  - **Display:** the header shows the working company beside the account name from 1200 px. Narrower screens show it in the account panel, so the fitted header geometry is unchanged. Names lead with the ERP company code because two companies may share a display name.
  - **Switching:** it reviews unsaved work, remounts the pages and locks other open tabs.
- **Grouped Service rail (AU-08).** The Service operations rail is grouped as Requests and scheduling, Field and inspections, and Assets and aftercare. Order and permissions are unchanged. A hairline separates the groups in the 76 px rail, and the expanded 232 px rail shows their headings. Each group is a labelled `role="group"`. A group with nothing the identity can open is not shown.

Still open:

- number search for quotations and purchase orders: no reader matches their own numbers yet;
- owner visual review of the header indicator, account-panel switcher and grouped rail at 1024, 1440 and 390 px.

No owner visual review is recorded for the board.

## Owner visual review — 9 October 2026

- **Reviewer:** Dean Fiedler. He accepted Claude's proposed verdicts from the phase 00 review boards (navigation canvas version 29).
- **Result:** Refine.
- **Evidence:** [phase 00 review, session 1](../../../testing/evidence/ui-review-phase-00-r01/README.md). Synthetic data; compiled build at `a52cb01`; 1440 × 900 and 390 × 844 headless Chromium, captures for this entry.
- **Findings:** S1, S2, S4 and S7 are all fixed here once and carry to every page. The new working-company pill and grouped Service rail render as intended.
- **Scope of this record:** visual review of the captured state only. Device, screen-reader, zoom and operational acceptance remain separate. A later source change marks this review stale.

## Phase 00 refinement batch 1 — 9 October 2026

Shared findings from the [phase 00 review](../../../testing/evidence/ui-review-phase-00-r01/README.md), fixed once in the shell (SD-02). Evidence: [batch 1 recapture](../../../testing/evidence/ui-refinement-batch-1/README.md).

- **S1 contrast:** the search shortcut hint, the panel footer and the lead empty state use `--text-secondary` (about 5.6:1 on white). The axe contrast failure that 18 desktop pages shared is gone.
- **S2 phone title:** every phone header shows the current page at 17 px, weight 500, in the ink colour. Pages with their own section menu keep r07's 20 px title and the menu button. Other pages keep the home tile and the page-hierarchy button. The left control differs because only some workspaces have a section menu; that is a stated rule, not drift.
- **S3 floating button:** no change. The My Work phone page already reserves 88 px at the foot. At the end of the scroll, the last content ends above the button (692 px against 708 px). The finding came from a mid-scroll capture and is withdrawn.
- **S4 back links:** the shared `ppo-back-link` class gives back links a target of at least 24 px, or 44 px on touch screens. It is applied to My Work, the activity record, site readiness and both Sales back links. Record links inside pages are refined with those pages.
- **S7 icons:** the rail toggle shows a left or right chevron and the page-hierarchy button a list icon, so the ellipsis now only means More. The page guide and help tooltips say what each opens; their accessible names are unchanged.
- **Reviews:** these source changes mark the 28 phase 00 reviews stale. The pages need a fresh owner look before phase 00 can close (SD-05).
- **Raised, not changed:** the technician timer's idle seconds digits fail contrast (axe). They are faint by design under the accepted work timer baseline, so this is a proposed departure for the FI-01 refinement.

## Shell context stays through the session check — 9 October 2026

- **Problem:** every page load read `/api/v1/shell/context` twice. `BusinessSession` confirms the identity and then dispatches `ppo-session-ready`, and `ShellProvider` blanked its context before the re-read. For about 50–100 ms after first paint every context-dependent control re-rendered empty. The rail toggle went enabled → disabled → enabled within about 110 ms of load on the compiled build, so a click in that window did nothing. The race dates from 25 September (`80b2f418`); it failed the "N18 blocked storage" browser test in CI, which then waited for the re-read as a workaround.
- **Change:** on `ppo-session-ready`, `ShellProvider` keeps the context it already shows and replaces it with the re-read when that arrives. A failed re-read still clears the context and shows the error. The first read on mount and `reload()` (company switch, retry) still start from an empty context.
- **Identity safety:** this relies on one invariant. Every identity change (the account panel's identity and demo-role switches, sign-out, the foundation panel's switch through its `api()` helper, and a lock from another tab) dispatches `ppo-session-lock` before the new session exists, and `lock()` clears the context and drops any read in flight. A context still on screen when `ppo-session-ready` arrives was therefore read after the last lock, for the current identity, so another identity's navigation is not kept. The one gap would be a session-ready dispatched while a switch is still waiting for its new session: its re-read could return the outgoing identity until the switch's own session-ready replaces it. No current code does that, and the previous provider had the same gap. A new identity-changing path must call `lockOtherBusinessViews()` first, as every current one does. The only listener of `ppo-session-ready` is `ShellProvider`; its dispatchers are `BusinessSession` and the foundation panel.
- **Not chosen:** skipping the re-read when it follows the first load. It would save one request but would trust the mount read without confirming it against the session check.
- **Proof:** the browser test "N18 rail toggle stays enabled through the session check after load" records the toggle's disabled state every animation frame until both reads finish and requires that it never disables once enabled. The "N18 blocked storage" test clicks the first enabled toggle again, without the workaround wait. Local run on the compiled build against a disposable synthetic database: with the previous provider the probe failed 3 of 3 runs, recording enabled → disabled → enabled; with this change it passed 5 of 5. The identity-switch and lock journeys in `shell`, `shared`, `offline-identity`, `policy-impact`, `navigation-context`, `department-navigation` and the scheduling publication suite passed on desktop and phone. CI remains the authoritative run.
- **Reviews:** this is a functional change to a shared shell source. It changes no visual state, but the source fingerprint marks dependent reviews stale under the register rules; no review is re-recorded here.

## Shell destination loading — PT-27

ProductNavigation retains the original main prefetch policy on desktop and phone. Both experimental reductions are withdrawn after the retained trials failed to establish a repeatable improvement. The incoming Customers page retains its normal session, current-company checks, directory and saved-view reads; outgoing links retain their exact URLs, permissions, dirty-state guard and Back behaviour. The existing directory record-link activation policy remains separate. The shell host fixture captures prefetch observations without treating a lower request count as performance acceptance.

Desktop keyboard/pointer and phone touch fixtures are in `tests/browser/shell-loading.spec.ts`, `directory-navigation.spec.ts` and `navigation-safety.spec.ts`. The [loading evidence](../../../testing/evidence/pt27-loading/README.md) records source-specific timing and receiving outcomes. Geometry, fonts, labels, icons and accepted reference bytes are unchanged. No new mockup image is needed for this transport-only change; actual captures and existing references remain separate from owner/device/visual acceptance. Existing stale reviews are preserved.

## AD-01 capability route identity

The existing Users and access destination owns the capability catalogue, capability grants and person routes. Specific page metadata precedes the generic access prefix, so the breadcrumb and browser title show the current task. The catalogue uses the register header variant; the breadcrumb supplies its visible page name. The destination permission and More entry are unchanged. Verify through the native AD-01 browser journey and navigation safety tests; no shell review is granted by this edit.

AD-01 proposed roles and person comparison keep the existing access destination with explicit task-specific breadcrumb labels. No rail or More-menu item is added. The new routes retain scope AD-01 and current server inspection authority.

AD-01 requests retain the Users and access destination with exact Access-change requests and Access request breadcrumb aliases, before the generic person route. No new menu item is added.

## Figma application increment — 13 October 2026

The [implementation decision](../../../decisions/figma-ui-implementation.md) records the exact inspected Shell v2 and My Work source frames, SH-01/SH-02 scope, r20 Overview / dashboard type, shared components and source-command handovers. The [execution ledger](../../../testing/evidence/figma-ui/README.md) separates compiled functional proof, visual comparison and remaining owner/device review.

Desktop: 240 px labelled / 76 px compact rail; preserve the saved identity preference. The My Work secondary menu is 240 px, with a 20 px collapsed edge. At 1440 × 900, content starts at x=480; toolbar 60 px, summary 64 px, content gutters 24 px and side column 320 px. Narrower interiors stack side cards. Source-backed compact activity rows use a done ring for Record outcome and an actions menu for rescheduling. The page title and freshness no longer occupy a greeting block.

Phone: 390 × 844 and 320 px containment; current page heading, Emails/Leads/Tasks with labels, flush attention and agenda lists, accessible icon-only 64 px navigation and reachable Create. Unconfigured weather remains hidden. Preserve full details, unknown counts, permission checks, focus return and draft protection. Shared tokens come from the existing theme and the explicit Shell v2 palette in `src/app/styles/figma-shell.css`; overview rules are scoped in `src/app/styles/my-work-figma.css`.

Reuse the real application shell, SecondaryMenuFrame, ProductIcon/Icon, Menu and the existing Activity dialogs; no parallel renderer or new isolated fixture is claimed. The `figma-my-work-overview` host fixture and alignment item are in components.json and navigation-fixtures.json. Exact icon-free source images: `PPO-My-Work-01-Desktop-Overview-r01.png` and `PPO-My-Work-09-Phone-Overview-Actions-Activity-r01.png` in the retained My Work page-design capture set. Public standalone Shell v2 images are not supplied; the private inspected Figma frame and accepted module captures are the available reference. Runtime identity/guidance controls, unavailable counters and conditional weather are explicit adaptations. Other module interiors, My Work grids and detail/outcome overlay compositions still require their own implementation. Existing owner review fingerprints are preserved and stale; this edit grants no review.

The release-preparation pass keeps long workspace breadcrumbs whole: show the current destination, or the module while its menu is docked; Page hierarchy exposes the ancestors. The search flows between the heading and utilities. *(Superseded on 16 October 2026 by the shell top bar amendment below.)* Engineering retains its explicit shared-menu presentation, while My Work opts into Figma styling. Estimating keeps its 1244 px content-width docking rule; the wider default rail can therefore select the drawer at a viewport that docks with the compact rail. Host checks cover these distinct states without altering command or access assertions.

The ES-02 and ES-08 source comparisons verify the adopted flowing header through `tests/helpers/shell-header-geometry.ts`, alongside unchanged issued-source hashes and page-level tokens. ES-08 retains a deliberate spacing violation as a negative control. ES-02's ancestor navigation uses Page hierarchy and keeps the same dirty-proposal warnings, stay/discard outcomes and deadlines. The 240 px More panel follows the rail without moving the workspace. See the [integrated consumer correction](../../../testing/evidence/figma-ui/README.md#integrated-estimating-consumer-correction--13-october-2026) for the failed CI source and limits.

## Rail first paint and context-dependent rows — 16 October 2026

- **Problem (F13, UXB-75):** the live-app UX audit measured desktop cumulative layout shift of 0.13–0.70 against the 0.1 Q04 budget. `ShellProvider` takes the rail width from the identity's stored choice, which it can read only once `/api/v1/shell/context` names the identity. Its server snapshot was compact, and an identity with no stored choice gets the labelled rail. So most documents painted the 76 px rail and widened it to 240 px after hydration, moving the whole workspace 164 px to the right. With the compact rail a second shell source showed: on Customers, Sites, Facilities and Equipment the module tab row (44 px) appeared only when the permitted tabs arrived, pushing the page down. On the Planner the board arrived above Unassigned demand and pushed it out of view.
- **Change:**
  - The root layout reads the `ppo_shell_rail` cookie (`expanded` or `compact`; `src/shell/rail.ts`), and the server renders that width. Without the cookie it renders the labelled 240 px rail, the default for an identity with no stored choice. `ShellProvider` keeps the width already shown until the context names the identity. It then applies that identity's stored choice as before and writes the cookie whenever the identity's width changes. The cookie holds a width only: no identity, permission or preference scope. Browser storage per identity stays authoritative.
  - ProductHeader holds the module tab row while the shell context loads. A placeholder anchor with no href takes the tabs' own height and is hidden, and the row is `aria-hidden` until the permitted tabs replace it. An identity with no permitted tab still loses the row when the context arrives.
  - The Planner keeps Unassigned demand out of the layout until its first schedule read settles, so demand arrives with the board. Its own read still starts at mount, and a failed schedule read still shows it with its own state.
- **Not changed:** rail geometry (240/76 px), the toggle and its accessible names, the storage schema, permissions and every destination.
- **Limits:** when a browser is shared by identities with different choices, a new identity can still see one width change after load. Smaller shifts remain on every page: the More button moves down as the rail items arrive, and the header and account panel reflow when the context arrives. On /projects most of what remains is the register's own loading line above its results (20 px), so that page sits closest to the budget. Phone layouts have no rail; their shift was already 0.
- **Proof:** "F13 desktop rail keeps its first-paint width and layout shift stays under 0.1" in `tests/browser/shell-loading.spec.ts`. It samples the rail width every animation frame from first paint and sums every layout shift without input until the network is idle. It does this on five pages at 1440 × 900, with the labelled rail and then the compact rail. Measured on the compiled build against a disposable synthetic database (coordinator); the change column is the range over three runs:

  | Page | `main`, labelled | `main`, compact | This change, labelled | This change, compact |
  |---|---|---|---|---|
  | /work | 76→240 px, 0.337 | 76 px, 0.024 | 240 px, 0.019–0.043 | 76 px, 0.023–0.053 |
  | /customers | 76→240 px, 0.334 | 76 px, 0.417 | 240 px, 0.016–0.040 | 76 px, 0.018–0.049 |
  | /projects | 76→240 px, 0.198 | 76 px, 0.078 | 240 px, 0.065–0.076 | 76 px, 0.074–0.087 |
  | /service/work-orders | 76→240 px, 0.508 | 76 px, 0.020 | 240 px, 0.032–0.059 | 76 px, 0.018–0.050 |
  | /schedule | 76→240 px, 0.688 | 76 px, 0.149 | 240 px, 0.025 | 76 px, 0.018–0.024 |

  On `main` the test fails on every labelled page (rail width) and on /customers and /schedule compact (shift). CI is the authoritative run.
- **Reviews:** a functional change to shared shell sources. It changes no accepted visual state, but source fingerprints mark dependent reviews stale under the register rules; no review is recorded here.

## Create forms ask before leaving — 16 October 2026

- **Problem (F42, principle 11):** typing into `/customers/new` or `/service/tickets/new` and then following a rail link left with no prompt, although the shared guard (`guardBrowserNavigation`, through `useUnsavedChanges`) protects most edit forms.
- **Change:** `useCreateDraft` in `src/components/record-ui.tsx` registers that guard while a create form's values differ from those it opened with, and saving releases it before the form opens the new record. It is adopted on `/customers/new` (every record kind outside the lead return, which keeps its command guard), `/service/tickets/new`, `/work/new` and `/service/work-orders/new`. A Sales handover creation keeps its recoverable command once that command blocks the form. `/sales/opportunities/new` already asked through its CRM command guard.
- **Proof:** "F42 … asks before rail, header or Back discards typed input" in `tests/browser/navigation-safety.spec.ts`, for the five routes at desktop and phone widths. A clean form leaves by the rail (phone bar), a header search result and Back without a prompt. A dirty form asks once for each, keeps the typed value on Cancel and leaves on OK. On `main` it fails for the four newly guarded routes and passes for `/sales/opportunities/new`.
- **Open:** `/finance/handoffs/new` and `/estimating/configurations/new` remain unguarded; editing an existing service request keeps its previous behaviour.

## Shell top bar amendment — 16 October 2026

Dean accepted the [Shell top bar amendment](../../../decisions/shell-top-bar-amendment.md) (Figma page "Shell top bar amendment", named version "Shell top bar amendment — accepted"; [captures r01](../../../reference/ui/application-shell/shell-top-bar-amendment-r01/README.md)). It supersedes the release-preparation breadcrumb and flowing-search paragraph above.

- **Breadcrumb (R1–R8).** `src/shell/breadcrumb.ts` names the page and, beneath something, its nearest owner as a link; never the department, never more than two items, a record by its reference alone, and never a register's default view. The full path stays in the Page hierarchy panel and the tooltip; the tab title keeps the department (NR-17). The "/" separator is hidden from screen readers.
- **Desktop requirements.** One header grid: a start zone (menu trigger, breadcrumb), the global search alone in the centre column at `clamp(232px, 28vw, 420px)` (403 px at 1440), and an end zone (Quick add 12 px from the search, utilities, account). The side columns are equal, so the search's centre is the top bar's centre on every page; the breadcrumb truncates, owner first, before it reaches the search. With the expanded rail up to 1200 px the search narrows to 220 px. From 781 to 1199 px the current page shows alone with the Page hierarchy button.
- **Mobile requirements.** Unchanged (R7): the page name only, search from its header button, Quick add from More.
- **Host fixtures.** `tests/unit/shell-breadcrumb.test.ts` (route-level rules, no access to the owner, signed out); the shared-shell, engineering and Projects browser suites for header geometry and crumb text. The `top-bar-amendment` state and the `application-shell-top-bar-amendment` alignment item are in components.json. Owner/device review of the application remains pending; no review fingerprint changes.
