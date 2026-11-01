# Inventory SC-05 implementation evidence

Owner: Dean Fiedler. Builder and comparison: Codex, [PR #805](https://github.com/deanrfiedler-gif/powerplants-one/pull/805), 31 October 2026. Source: [accepted Inventory design](../../../decisions/inventory-figma-design.md) and its unchanged [icon-free captures](../../../reference/ui/supply-chain/inventory-figma-r01/README.md).

## Separate statuses

- Functional proof: focused Inventory unit, database, HTTP and desktop/phone browser checks passed; native Supply regression passed. Quotation-to-Supply regression rerun is in progress; see the validation record below.
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
4. **Activity and Source evidence:** Activity contains the actual native records and versions, rather than the illustrative six events. Source evidence was not drawn and uses native source-record links. No revision event or stock movement is fabricated. Tabs omit illustrative counts.
5. **Current shared shell:** My Work, current primary rail glyphs, shared header controls and phone bottom navigation remain. The desktop header says Inventory instead of reproducing the old breadcrumb composition. The phone record header owns record position/navigation, with the item title in the page body. The tablet capture uses the existing collapse control; the shell preference remains user-controlled. No Font Awesome Pro artwork is included.
6. **Navigation and recovery:** explicit Back and Retry controls add a row above desktop records. Phone refresh has the accessible name Retry read. Record observation uses the native form instead of a new designed form. Source and Service stock handovers use existing routes. All five record views remain available on phone in a horizontally scrollable tab bar above the actions and shared bottom navigation.
7. **Register:** real results sort alphabetically, with usable visible when space permits. The synthetic search prefix and Clear filters are visible in the captures. Location choices come from the read and remain flat. Shared controls, table borders, status chips, numeric strings and spacing replace exact frame styling; no fictional row menus or counts are drawn. Snapshot changes the toolbar to its real selection actions.
8. **Responsive density:** full source references and the shared year/24-hour/AEST date format make phone list rows taller than the compact illustrative rows. At 320 px the bounded count and date wrap. Tablet context labels stack and quantity notes wrap, so less content fits above the fold. Desktop and tablet tables retain native scrolling where needed; phone pages have no horizontal overflow in the exercised case.
9. **Focus and states:** the item heading receives keyboard focus and its visible outline remains in Quantities captures. The inspected tab hover contrast and Activity screenshot timing were corrected before retaining this set. Unknown uses a truthful source-unavailable/incomplete explanation, rather than claiming that a failed network read produced an unavailable source observation. Native observation actions remain permission-dependent.

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

## Validation record

Real `npm ci` used pinned Node 24.22.2 and npm 11.19.0, without an engine override or node_modules junction. Audit reported 11 moderate findings; dependencies were unchanged. The server used `PPO_PORT=3085`, with a disposable PostgreSQL 16 cluster on loopback port 55485 and database `ppo_synthetic_test`. Unmodified-main comparison used port 3086. No shared server or database was changed.

| Check | Result |
|---|---|
| Inventory, department navigation, module workspaces, workspace styles and UI baseline unit files | 18 passed |
| Inventory database | 2 passed, including observations with different titles, incoming Shipment allocation, Unknown/zero, revoked permission, company isolation and 101 items bounded to 100 |
| Inventory HTTP | 1 passed: scoped existing endpoint, no-store read, no Product link, native record API and Shipment/Stock distinction |
| Inventory browser | 7 passed; 1 intentional duplicate capture-matrix skip. Desktop/phone keyboard, snapshot identity after a newer observation, native form, read-only handover denial, Unknown at 320 px, failed read/retry and stale response tested |
| Native Supply browser | All 30 desktop/phone cases passed, including native revision, uncertain-save recovery, stale proposals, denial and Partial evidence |
| Department-navigation browser | All 11 desktop cases passed across the initial run and the complete Sales Tasks rerun; mobile cases are intentionally excluded by that suite |
| Quotation-to-Supply browser | Final full rerun in progress; previous comparison described below |
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

Historical Supply screenshots were redirected to ignored output during regression; quotation time budgets were temporarily enlarged for local execution. Those test-file adaptations are restored before commit. The committed native Supply test changes only the SC-05 handover to `?native=1` so it continues exercising its existing form contract.
