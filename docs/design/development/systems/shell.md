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
