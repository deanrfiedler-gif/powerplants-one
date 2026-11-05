# Inventory SC-05 implementation evidence

Owner: Dean Fiedler. Builder and comparison: Codex, [PR #805](https://github.com/deanrfiedler-gif/powerplants-one/pull/805), 31 October–1 November 2026. Source: [accepted Inventory design](../../../decisions/inventory-figma-design.md) and its unchanged [icon-free captures](../../../reference/ui/supply-chain/inventory-figma-r01/README.md).

## Separate statuses

- Functional proof: focused Inventory unit, database, HTTP and desktop/phone browser checks passed; native Supply regression passed. All 10 isolated quotation-to-Supply browser cases also passed on 1 November; exact sources and earlier attempts are recorded below.
- Visual comparison: all 14 retained application captures inspected against the accepted compositions at 1440, 1024, 390 and 320 px. This is a builder comparison with recorded differences, not visual acceptance.
- Owner acceptance: the 15 October decision accepts the source design. Application acceptance and independent exact-head review remain pending; no accepted application fingerprint is recorded.
- Deployment: not performed. All data and execution are local and synthetic.

## Implemented boundary

The existing Supply records GET accepts the Inventory view and projects exact company/item/unit groups from permitted Stock observations. The source scan is bounded at 2,000 records and the register at 100 items. The toolbar reports the actual rows shown, not an inferred total. Each source and both allocation ends pass native authority checks. Company scoping and `supply.read` remain mandatory.

Missing values, unavailable evidence, overlapping locations or a truncated source scan remain Unknown. Distinct location observations retain their own recorded times; the header names the latest observation. Search narrows whole exact groups, so a matching title cannot remove companion observations from a total. Incoming allocations can mention Shipment sources without adding shipment quantities to stock totals. Activity lists permitted native records mentioning the exact item; it is evidence history, not a ledger. MYOB remains the intended ERP authority.

Record observation opens the existing native form on `/supply/stock?native=1&observation=1`, with the selected source ID for revision. Existing commands, permissions, expected versions and uncertain-save recovery remain intact. No migration, capability, grant, dependency, Product mapping, stock movement or external transaction is added.

## Differences from the accepted frames

1. **Product link:** No link recorded replaces the illustrative exact match, catalogue revision and mapping attribution. Open product is disabled. Mapping persistence remains outstanding; names, SKU and family never infer a link. Linked to products is empty.
2. **Real permitted evidence:** exact native company/item/unit references, source owners, source labels, times, warehouses and bins replace illustrative fields and people. Provider/mapping metadata absent from the native read is not invented. Record owner is not presented as the person who captured an observation. Totals combine only distinct observations; overlap or missing location scope is conservative Unknown.
3. **Quantities and demand:** the existing usable-evidence rule supplies usable quantities. Bases are plain text in the shared table rather than the frame's small badges. Incoming shows actual permitted allocation rows; None recorded and partial-read Unknown are explicit. Demand readiness stays Unknown and hands over to Material demand. No job-readiness or reservation decision is made here.
4. **Activity and Source evidence:** Activity contains the actual native records and versions, rather than the illustrative six events. Source evidence was not drawn and uses native source-record links. Records retain native latest-update ordering while displaying their observation time; this differs from the illustrative observation-date timeline. No revision event or stock movement is fabricated. A plain linked timeline replaces the bordered event cards. Tabs omit illustrative counts.
5. **Current shared shell:** My Work, current primary rail glyphs, shared header controls and phone bottom navigation remain. The desktop header says Inventory instead of reproducing the old breadcrumb composition. The phone record header owns record position/navigation, with the item title in the page body. The tablet capture uses the existing collapse control; the shell preference remains user-controlled. Receiving lock-in #787 reserves Workshop after Inventory in the navigation contract, but the existing renderer withholds it because no native route exists. The capture therefore does not show Workshop. No Font Awesome Pro artwork is included.
6. **Navigation and recovery:** explicit Back and Retry controls add a row above desktop records. Phone refresh has the accessible name Retry read. Record observation uses the native form instead of a new designed form. That handover retains the Stock source record; its Back action returns without Inventory filters. Assessed source-version links explicitly open the native record, including Shipment sources; their Back action returns to the Inventory register when no Stock group exists. Source and Service stock handovers use existing routes. The Unknown phone frame’s Service stock / Retry read footer is adapted to the same disabled Product and native observation actions as other records; Retry read is the named header icon, and Service stock is available through the secondary menu. All five record views remain available on phone in a horizontally scrollable tab bar above the actions and shared bottom navigation.
7. **Register:** real results sort alphabetically, with usable visible when space permits. The synthetic search prefix and Clear filters are visible in the captures. Location choices come from the read and remain flat. Shared typography, controls, table borders, status chips, numeric strings and spacing replace exact frame styling; no fictional row menus or counts are drawn. Snapshot changes the toolbar to its real selection actions. Its shared selection colour, plain selection count, Close snapshot control, inline Open item record link, omitted compact location line and stacked metadata differ from the frame’s count pill, fixed bottom actions and compact details.
8. **Responsive density:** full source references and the shared year/24-hour/AEST date format make phone list rows taller than the compact illustrative rows. At 320 px the bounded count and date wrap. Tablet context labels stack and quantity notes wrap, so less content fits above the fold. Desktop and tablet tables retain native scrolling where needed; phone pages have no horizontal overflow in the exercised case.
9. **Focus and states:** the item heading receives keyboard focus and its visible outline remains in Quantities captures. The inspected tab hover contrast and Activity screenshot timing were corrected before retaining this set. Unknown uses a truthful source-unavailable/incomplete explanation, rather than claiming that a failed network read produced an unavailable source observation. Loading uses explicit status text rather than skeleton strips; empty results use the shared empty control. Partial and held values use their quantity rows and completeness chips rather than separate illustrated banners. Native observation actions remain permission-dependent.

These are recorded implementation differences for review, not accepted departures or a claim of pixel equivalence. Physical-device, screen-reader and owner visual review remain outstanding.

## Retained application captures

Chrome 156.0.8078.80, Playwright 1.64.1, en-AU, synthetic local server. The 1024 px rail is collapsed through its existing control; 1440 px is expanded. Images are viewport captures, not full-page screenshots. Hashes and exact source-file hashes are in [the capture manifest](capture-manifest.json); they are evidence identifiers, not approval fingerprints.

| Viewport | Register | Quantities | Activity |
|---|---|---|---|
| 1440 × 900 | [Register](captures/register-1440.png) | [Quantities](captures/quantities-1440.png) | [Activity](captures/activity-1440.png) |
| 1024 × 768 | [Register](captures/register-1024.png) | [Quantities](captures/quantities-1024.png) | [Activity](captures/activity-1024.png) |
| 390 × 844 | [Register](captures/register-390.png) | [Quantities](captures/quantities-390.png) | [Activity](captures/activity-390.png) |
| 320 × 844 | [Register](captures/register-320.png) | [Quantities](captures/quantities-320.png) | [Activity](captures/activity-320.png) |

Additional comparisons: [1440 px snapshot](captures/snapshot-1440.png) and [320 px Unknown](captures/unknown-320.png). The nine accepted source images remain byte-for-byte unchanged. No Figma reads were needed.

## Validation record — 31 October 2026

Real `npm ci` used pinned Node 24.22.2 and npm 11.19.0, without an engine override or node_modules junction. Audit reported 11 moderate findings; dependencies were unchanged. The server used `PPO_PORT=3085`, with a disposable PostgreSQL 16 cluster on loopback port 55485 and database `ppo_synthetic_test`. Unmodified-main comparison used port 3086. No shared server or database was changed.

| Check | Result |
|---|---|
| Inventory, department navigation, module workspaces, workspace styles and UI baseline unit files | 18 passed |
| Inventory database | 2 passed, including observations with different titles, incoming Shipment allocation, Unknown/zero, revoked permission, company isolation and 101 items bounded to 100 |
| Inventory HTTP | 1 passed: scoped existing endpoint, no-store read, no Product link, native record API and Shipment/Stock distinction |
| Inventory browser | 7 passed; 1 intentional duplicate capture-matrix skip. Desktop/phone keyboard, snapshot identity after a newer observation, native form, read-only handover denial, Unknown at 320 px, failed read/retry and stale response tested |
| Native Supply browser | All 30 desktop/phone cases passed, including native revision, uncertain-save recovery, stale proposals, denial and Partial evidence |
| Department-navigation browser | All 11 desktop cases passed across the initial run and the complete Sales Tasks rerun; mobile cases are intentionally excluded by that suite |
| Quotation-to-Supply browser | Interrupted: first desktop case timed out, second passed; remaining results were not recovered. Previous comparison described below |
| Typecheck | Passed with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`, repeated after the final source edit |
| Lint | Full `npm run lint` passed; changed TSX and browser files rechecked after final edits |
| Design studio | Passed: 372 entries, 52 components, no errors; 346 unreviewed and 26 stale remain visible |
| Foundation, naming, status | Passed; documentation assurance only |
| Full repository unit/database/HTTP/browser suites, production build, physical devices, screen reader, business acceptance and deployment | Not run |

Reproduce the focused browser run with the owned server running: `PPO_PORT=3085 PPO_TEST_ORIGIN=http://127.0.0.1:3085 npx playwright test -c playwright.inventory.config.ts tests/browser/inventory.spec.ts --workers=1`. This shell-neutral notation describes environment values; use the host shell's syntax. The local config omits the shared warm-up and server ownership. Inventory cases allow 180 seconds and the capture matrix 300 seconds.

### Attempts, corrections and main comparison

The initial private database attempt stopped at configuration validation before running tests; its temporary loopback configuration was corrected outside the repository. A permission-revocation test cleanup variable was corrected, then the database cases passed. A later 120-second database run timed out during synthetic setup; the unchanged assertions passed on a complete run with a 360-second local limit (92.6 seconds elapsed). One HTTP attempt returned DatabaseConnectTimeout; subsequent complete runs passed. Earlier static-check attempts interrupted without diagnostics are not counted as passing evidence.

The Sales Tasks navigation case first timed out while loading; its full focused rerun passed without an application change. An early combined browser run was interrupted after quotation fixture/flow timeouts and the older capture budget expired. An Inventory phone retry test caught the CSS refresh glyph entering the accessible name; the button now explicitly names Retry read, and all seven Inventory cases passed on the complete rerun. Capture inspection also caught Activity images taken before the tab changed and insufficient hover contrast; the final retained set follows the fixes.

The first three quotation desktop cases timed out at 300 seconds on the branch. An archive of unmodified main `1402c87b9069def4dcd4d82f291cd991cff40ca5` was compared with the same three scenarios and 300-second local budget: lost-response and unsent-original cases passed; owned-referral timed out during `/work` loading. The 2,306 application/script blobs were verified against that commit. Only the local port/config and timeout harness differed. This comparison does not establish a common cause for the branch failures; they are not labelled unrelated. The final branch run is recorded above when complete.

Historical Supply screenshots were redirected to ignored output during regression; quotation time budgets were temporarily enlarged for local execution. Those test-file adaptations are restored before commit. The native Supply test uses `?native=1` for SC-05 so it continues exercising the existing form contract. After the Markdown-guide integration, its SC-05 guide assertion also checks the preparation fallback and hidden InReview content; other Supply guide assertions are unchanged.

## Integration and resumed proof — 1 November 2026

Main `5c533e93` was merged, including Receiving lock-in PR #787 and the Markdown guide runtime. Workshop is reserved between Inventory and Dispatch & delivery in the navigation contract, and withheld from rendered navigation by its existing unavailable state. No native Workshop route exists; no route or capability was invented. It reuses the native maintenance glyph. The navigation coverage record and tests follow this composition.

The live guide is now `docs/guides/pages/guide.route-supply-stock.md`. Its rewrite retires the old carry-over exception and its single parity-fixture line. It is InReview with no invented reviewer, date or approval hash. Under [the guide publication contract](../../../guides/README.md#13-retire-a-carried-over-guide), ordinary users see the preparation fallback until it is published with genuine review evidence. Guide publication needs Dean's review and remains separate from this code delivery.

The resumed focused unit and guide-library/parity run passed all 76 cases. The isolated PostgreSQL cluster recovered after the interrupted session and now uses explicit port 15485. Its first post-recovery database test attempt failed acquiring a connection within the existing three-second boundary, before Inventory assertions; no unrelated-failure claim is made. The optimized build passed compilation, TypeScript checking and all 82 static pages. Two 360-second database attempts timed out during setup; a 1,200-second-budget attempt failed acquiring a connection before assertions. The HTTP attempt returned 503 at synthetic login. A diagnostic confirmed migration 122 with no seed receipts, and the normal fixture seed command then reached its existing 120-second statement timeout. These attempts do not establish an Inventory assertion failure or an unrelated-failure finding. After the standalone typecheck released its resources, the normal seed completed. The complete HTTP rerun passed, and all seven Inventory browser cases passed with one intentional duplicate capture-matrix skip. All 14 captures were regenerated and inspected against the accepted compositions at the four requested widths; the manifest identifies their integrated source without claiming acceptance. Standalone typecheck with the requested 8 GB setting, full lint and studio passed. The post-merge database suite subsequently passed both cases (241.3 seconds, a 1,200-second local test budget, unchanged application boundaries). Foundation, naming and status checks also passed. The subsequent isolated native Supply run passed 30 cases and department navigation passed all 11 cases. Quotation-to-Supply passed all 10 desktop/phone cases on source `6d71cd85` in 12.4 minutes, using its unchanged 120-second per-case limit.

Final scope review narrowed the new edit-loading guard to the SC-05 observation handover; other native Supply dialogs retain their original rendering condition. Assessed source-version links now explicitly retain the native view, including Shipment-only evidence. A source without Stock observations returns to the Inventory register instead of requesting a missing Stock group.

The intermediate combined navigation, quotation and Supply run was stopped after failures. Two assertions were stale after integration: Workshop had been expected as a visible link despite the native renderer withholding unavailable destinations, and the old published Inventory guide had been expected despite the new InReview guide contract. Both assertions were corrected. Other cases timed out or encountered failed reads; captured options requests returned 503, and the storage-disabled navigation failure matched a DatabaseConnectTimeout in the owned server log. No common-cause or unrelated-failure claim is made. Fresh isolated runs then passed without changing application request or connection timeouts.

The final native handover build on `eaaaca3f` passed optimized compilation, TypeScript and all 82 static pages. Its first browser launch preceded the server listen event: three cases failed at synthetic login with ECONNREFUSED, and the run was stopped before proceeding. The complete suite was restarted only after the owned server reported ready; this startup mistake is not counted as application proof.

The earlier pushed head `36cab747` also failed [Engineering CI](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/41285425213/job/124785619851) on the same incorrect Workshop expectation (nine visible links expected, eight rendered). The corrected assertion retains Workshop as a reserved unavailable destination and explicitly checks it is withheld; the complete 11-case navigation run passed locally. This is a corrected author test failure, not an unrelated-failure claim.

### Final compiled-source verification

The application build is `eaaaca3fdcf6197ec1422751e1752e451086dede`, including main `c69a0922c19e2d62b5859c57895204f5c44684c3`. Its later file changes are test/evidence corrections, not application changes. Ninety focused unit, guide and design-workspace cases passed, including the latest main's scope registrations. The native Supply run completed with 29 of 32 cases passing. Desktop SC-01 did not render its native workspace; desktop picking/POD remained in its loading state after save; phone receipt capture timed out waiting for its action. The owned server recorded database connection timeouts during the run. These are observations, not an established common cause or an unrelated-failure classification.

All six desktop/phone cases in the subsequent focused rerun passed (1.5 minutes), with unchanged application code, connection boundaries and assertions. Both assessed Shipment handover cases passed in the full run. Thus every one of the 32 cases has passing final-source execution evidence; the complete 32-case invocation itself was not all green. The earlier isolated 30-case native suite was all green. One intermediate rerun was stopped after code inspection caught the new test assuming source version 1: allocation advances the source version, and the corrected test reads the actual version before asserting its exact native link. A command attempt was not executed when automatic approval review temporarily hit its usage limit; Codex decided under the standing order to retry, and the retry succeeded. The relayed continue chat was context only, not repository evidence of owner authorisation; the [pull-request flow limits](../../../decisions/pull-request-flow-limits.md) govern concurrency.

The final-source HTTP rerun passed its scoped native endpoint case (13.9 seconds). The complete Inventory browser run passed seven cases with one intentional duplicate capture-matrix skip (2.0 minutes). All 14 new application captures were inspected against the unchanged accepted frames and states board at 1440, 1024, 390 and 320 px. The manifest now identifies the final compiled application source and actual file/image hashes; it grants no visual acceptance.

Final standalone typecheck passed with `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit`; full `npm run lint` passed. Studio passed with 377 entries, 52 components and zero errors (351 unreviewed, 26 stale). Foundation passed with all 78 requirements retained, 15,167 local links, 7,585 marker-scanned files and 220 status fragments. These are assurance results, not application acceptance.

Final naming validation passed (848 document records, 65 entry files, zero errors), and `python3 scripts/build_status.py --check` passed all 220 fragments. Full repository suites, physical-device and screen-reader checks, business acceptance and deployment were not performed locally. The owned application and private PostgreSQL server were stopped after proof.

## Review findings and main integration — 5 November 2026

This is Codex's response to [the one completed review](https://github.com/deanrfiedler-gif/powerplants-one/pull/805#issuecomment-6647751248), under the standing order. The [takeover claim](https://github.com/deanrfiedler-gif/powerplants-one/pull/805#issuecomment-6652094313) follows the explicitly released build claim. Only confirmation of the six findings and the main merge is requested.

### Merge preservation

Merge-only commit `fc7f4db3bc4d8184be10b14d1c722e284943228b` has parents `e3cfe95be7c3c1735f5a139dd3fad26cf483a166` and main `3faff7aef476904a30e878be8bdc9e95792fb4fb`; merge base is `c69a0922c19e2d62b5859c57895204f5c44684c3`. The merge was clean. Both `git diff origin/main...<head> | git patch-id --stable` results are `e824a58120c33db280e2a055d4fe85b716f61a52` for the old and merge-only heads.

Guides: **main's 367 + 0 = 367**. Register: **main's 393 + 0 = 393**. Both parse and have unique keys. Only `guide.sc.05`, `scope:SC-05` and `route:/supply/stock` differ in parsed value from the merge base. Their entry-by-entry merge matches the required result; every other main entry retains main's bytes. There were no whitespace-only entry changes to carry or discard. Main's existing trailing whitespace in unrelated Service evidence was left unchanged. The pre-commit marker scan found none.

### Findings addressed

1. The two historical status fragments and this evidence's retry account now record agent decisions under the standing order, with relayed chat as context only. The PR description was corrected through the GitHub connector and points to the governing flow limits. No concurrency exception is asserted.
2. Shipment-basis Activity links open `/supply/receipts?record=…`; Stock links retain `/supply/stock?native=1&record=…`. The accepted design's outgoing-handover row explicitly names Receiving (SC-04) for usable evidence: `docs/decisions/inventory-figma-design.md:53`. The new Inventory browser case creates a synthetic receipt, follows Activity and checks both the receipt reference and inspection finding in Receiving. It also asserts the Stock destination.
3. `filterInventory` searches all permitted observation titles in each group. The added unit case uses an older title and a differently titled latest observation, and checks older-title, latest-title and absent-title searches.
4. Closing or successfully saving the observation form removes `observation=1` with `history.replaceState`, retaining the other parameters and fragment. A new browser case checks the saved reason, reload, explicit close and unchanged history length.
5. Search waits for a 200 ms pause; unsettled input cancels the old read and clears its projection. This follows the existing application's settled-search pattern. The native Supply workspace's `false` refresh-on-focus option is applied to Inventory item details. Per-candidate authority and allocation checks remain unchanged. Batching is not attempted; the measured cost below stays open.
6. The guide retains InReview. Its source reference is updated to a full implementation SHA in this review-fix series. Publication is deferred until after the stage 3b redraw.

The [dated status fragment](../../../status/2026-11-05-inventory-review-fixes.md) records that the [flagship hold was lifted on 5 November](https://github.com/deanrfiedler-gif/powerplants-one/pull/805#issuecomment-6647521506). Inventory SC-05 remains a tier 1 flagship journey due for the stage 3b redraw under ADR-0067; its visual layer will be rebuilt after that redraw. Functional proof, visual acceptance, owner acceptance and deployment remain separate. The retained capture manifest describes the earlier captured source, not these fixes; its historical hashes and images are unchanged.

### Open read cost

These are the reviewer's measurements from the linked review, not measurements repeated in this session. Debouncing reduces reads while typing; it does not establish a faster individual read. The serial authority and label queries remain an open optimisation item, with unchanged permission rules required for any later batching.

| Records | Read | Measured time |
|---|---|---|
| 600 | Unfiltered | 1.3 s |
| 2,100 | Unfiltered | 4.5 s |
| 2,100 | Search | 6.8 s |

The previous three Supply loading failures remain evidence to investigate if they recur on the ready head; a passing rerun does not erase a failure.

### Local environment and validation

The required setup command was run normally, then repeated with network permission after the sandbox refused the proxy connection. It installed the pinned dependencies and migrated, but failed during seeding: `new row for relation "permission_grants" violates check constraint "ck_grants_capability"`. Under this task's environment rule, database and browser are unavailable, and the setup environment file was not sourced. Checks use the installed pinned Node 24.21.0 and npm 11.19.0 binaries directly.

Inventory database, Inventory HTTP, Inventory browser and native Supply browser suites: **not run here; left to GitHub CI**. No database or browser pass is inferred from earlier sessions. The Inventory HTTP test does not call reset, and the Inventory browser fixtures add no permission grants. Both new browser regressions run in each configured viewport project, without new skips or changed deadlines. No existing test expectation is changed.

All 113 paths in the changed guide/register entries and all 30 manifest/integration paths were checked and exist. Integration `component_proof`, `application_proof` and `adaptations` point to existing files. No test was moved. Final local results, the ready-page count and ready-head CI are recorded below and in the completion comment.

The initial sandboxed `npm run check` passed Studio, ESLint and TypeScript, then reported eleven unit files as `test failed`: `azure-demo`, `browser-fixture-transport`, `fertigation-request-limit`, `foundation`, `guide-library`, `login`, `proof-database`, `proof-request-scope`, `quality-asset-observer`, `quality-packet-network` and `recovery` (each under `tests/unit/` with suffix `.test.ts`). All eleven reproduced with that same file-level message on clean main `3faff7aef` in `/tmp/main-check`: **pre-existing on main in this environment**. With network permission, the full unit run executed 1,406 individual tests: 1,405 passed, one failed, none skipped or cancelled. The Inventory and Supply focused run passed 13/13.

The remaining individual failure is **pre-existing on main in this environment**: `tests/unit/recovery.test.ts`, “P12 separates checkpoint/source/destination and refuses Git paths, symlinks, hardlinks and non-private roots”. Both PR and clean-main runs fail at line 101 because `/owner-only/` does not match `Error: Recovery data must stay outside Git.` The main file runs 1 passed / 1 failed. This assertion and its expected value are unchanged.

Foundation, prototype, naming, status, Studio, documentation scope and migration-number checks passed. Foundation checked 17,531 local links and retained all 78 requirements; status checked 339 fragments. Browser discovery found both new regressions in both desktop and mobile projects; discovery is not browser execution.

The initial sandboxed production build compiled successfully, then failed with `Could not parse output from TypeScript's --showConfig.` The same build failure reproduced on clean main after copying the installed dependencies into its checkout: **pre-existing on main in this environment**. The first main-build attempt used a dependency symlink that Turbopack refused because it crossed its workspace root; that comparison setup was corrected without changing tracked source. The permitted PR build is recorded separately.

The final permitted `npm run check` again passed Studio, full ESLint and TypeScript, then passed 1,405/1,406 unit cases with only the same pre-existing recovery assertion. Because that command stops at the unit failure, `npm run build` was run separately with network permission and passed compilation, TypeScript and all 86 static pages. No required local check has an unexplained PR-only failure. The implementation is `bc1c622faacddd3256fe11e6474ca6825ad1c430`, which is the guide's full source reference.
