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

Open built-app findings:

- per-route page titles (NR-17);
- an entity indicator (NR-18);
- number search (NR-10);
- a grouped Service rail;
- two inconsistencies: the Sales phone bar shows unavailable destinations as disabled, and `application-shell-integration.md` still describes /crm canonical routes.

No owner visual review is recorded for the board.
