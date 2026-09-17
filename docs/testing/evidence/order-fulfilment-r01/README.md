# Order Fulfilment & Customer Delivery r01 — verification evidence

This is **standalone synthetic design evidence**. It is not application acceptance, business approval or production readiness. No application code, database migration, dependency, service or deployment is introduced by the package it verifies.

**Subject:** [interactive HTML](../../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-r01.html) and [detailed report](../../../reference/ui/supply-chain/PPO-Order-Fulfilment-and-Customer-Delivery-Workspace-Report-r01.md)
**Sources:** [`docs/design/order-fulfilment/`](../../../design/order-fulfilment/README.md)
**Handover:** [`docs/decisions/order-fulfilment-delivery-design.md`](../../../decisions/order-fulfilment-delivery-design.md)

## Source and results

| Item | Evidence |
|---|---|
| Base commit | `main` at `0769a16dd842e9dc1c349a853036ab71949e7807`, 16 September 2026 |
| Built HTML SHA-256 | `ad331e08d6b2bb1fb5a43b3237fe7dcbd6c948a8b631d5569f350d48f5e2dfd7` |
| Deterministic build | `python3 scripts/build-order-fulfilment.py` reproduces the committed file from the sources |
| Model checks | **40 groups passed**, [original result](model-results.json) |
| Native browser checks | **32 groups passed**, no page errors and no console errors, [original result](results.json) |
| Responsive coverage | All five views at 1440, 1024, 820, 390 and 320 px — **25 measurements, maximum horizontal page overflow 0 px** |
| Screenshots | 18 PNGs captured; exact names, sizes and hashes in [visual-review.json](visual-review.json) |
| Repository checks | `python3 scripts/check_foundation.py`, `python3 scripts/check_prototype.py`, `python3 scripts/check_naming.py` — all passed |
| Conflict-marker scan | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` returned no matches |
| Syntax | `node --check` on both design scripts |

## Environment actually used

| Item | Value |
|---|---|
| Node | 22.22.2 (authoring environment) |
| Playwright | 1.56.0 (authoring environment) |
| Browser reported | 141.0.7390.37 |
| Launch mode recorded | `chrome` channel |
| Bundled executable | `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` |

**Disclosure.** The repository pins Node 24.21.0 and Playwright 1.63.0 and installs the Google Chrome channel. The authoring environment does not match those pins: it has Node 22.22.2 and Playwright 1.56.0, and `/opt/pw-browsers/chromium` is a symlink to the Playwright-bundled Chromium, so the `chrome` channel resolved to **Chromium 141.0.7390.37, not Google Chrome**. These runs are therefore a Chromium run under an unpinned Playwright, and the results must not be read as evidence under the repository's pins. `.github/workflows/order-fulfilment-design.yml` runs the same three commands under `.nvmrc`, `npm ci` and `npm run browser:install`; **the CI run is the evidence under the pins, and it had not completed when this record was written.**

## What the model checks cover

Forty groups, each asserting behaviour and, for every refusal, that the state is byte-identical afterwards:

fixture validation and collection invariants · company grant isolation across projections, queries, summaries and availability · commercial redaction at the projection for three roles, including that a search for a restricted value returns nothing · warehouse scope, including that an empty grant is no scope · partial observations as unknown rather than zero · quarantined stock present but never usable · an internally inconsistent source value preserved and excluded · unresolved unit basis never summed and never satisfying a differing unit · incoming supply promised but not usable · register condition and blocker text · requested, confirmed and expected as separately versioned commitments · reservation confirmation with a source reference · over-allocation refused without a negative remainder · competing demand where exactly one request succeeds · role and company refusals for reserve, pick, delivery capture and substitution review · picking bounded by its reservation · staging bounded by its pick · short pick requiring a finding and blocking readiness · finding review that does not alter the observation · substitution as a proposal requiring two independent positions · prepared dispatch bounded by uncommitted staged quantity · document issue that does not dispatch · physical dispatch, source shipment and delivery as three records · delivery capture bounded by the consignment · acknowledgement scoped to its exact delivery with its exclusion statement · owned shortage and refusal of a duplicate exception or follow-up · refreshed observation carrying new receipt evidence · the complete second shipment with quantity conservation · retained shortage history after completion · correction superseding without double counting · failed attempt recording no quantity and refusing an acknowledgement · unknown source outcome blocking further effect and its three reconciliation routes · idempotent replay and refusal of different content under the same identity · stale session and stale source snapshots · expected versus confirmed commitment behaviour including the automatic changed-commitment exception · recovery routing that does not rebuild SC-08 · quantity parsing · malformed session refusal and lossless round trip · one receipt and one history entry per command.

## What the native browser checks cover

Thirty-two groups in a real browser against the built file: five views and the central question · register field groups · search, filters and the empty state · a snapshot card opening contributing records and restoring filter context · the coordination-view disclaimer · the authority chain in the order drawer · stock presenting unknown, quarantined, unresolved-unit and anomalous observations as themselves · an incomplete observation being unreservable from the interface · reservation and the refusal of a second allocation · competing demand · picking and staging by the warehouse role · dispatch preparation that moves nothing · document issue that does not dispatch · physical dispatch and source shipment as separate records · delivery capture with the receiving point kept apart from the use area · acknowledgement scope and exclusions · the owned shortage becoming an exception · deduplicated follow-ups · refreshed supply and the complete second shipment · retained shortage and both shipments after completion · correction with a retained predecessor · lost response, blocked effect and recovery without duplication · simulated save failure retaining entries · partial, failed and empty source scenarios · company and identity switching without mixing records · restricted values absent from search and drawer for a non-commercial role · a read-only identity that can record nothing · reload restoring state, context and filters · damaged-session preservation and export · keyboard navigation with `:focus-visible` and a non-`none` outline · responsive coverage · phone form presentation with a 46 px navigation target.

## Defects found and fixed during verification

| Finding | Fix |
|---|---|
| A role with an empty warehouse grant received every warehouse in the company | Empty grant now means no scope. Model check added |
| Dialog close controls carried `data-close` but no `data-action`, so the delegated handler never matched them and dialogs could not be closed | `[data-close]` is matched first in the handler |
| Working-context selects were addressed by an id the helper never produced | Ids aligned; filter change handling corrected with them |
| Picking a second consignment selected an already-picked reservation, producing a spurious short-pick refusal | Pick preparation now selects the first confirmed reservation with an unpicked remainder, and the pick command bounds itself by that reservation's remainder |
| Three template expressions were unterminated, so the workspace script did not parse | Closed; `node --check` added to the routine |
| A reservation control stayed enabled on an observation with nothing unreserved | Disabled, with the reason stated in place |
| Journey and commitment styles were absent from the rescoped stylesheet | Added |
| The register progress legend wrapped to four lines per row | Compact legend in the table, full legend elsewhere, with the figures still in the bar's text alternative |
| A corrected delivery showed only the corrector, obscuring the original capturer | Both are now shown |

## Visual review

Inspected at full size: `1440-01-register.png` (register, snapshots, worklists, coordination-view disclaimer), `1440-03-stock.png` (unknown, quarantined, unresolved-unit and anomalous rows together with the derivation panel and competing-demand panel), `1440-09-correction.png` (superseded predecessor retained beside its successor, acknowledgement scope and exclusions, receiving point beside use area) and `390-picking.png` (single-column phone layout, readiness checklist, disabled controls for the current role). The remaining fourteen captures were produced by the same run and are hashed in `visual-review.json`.

## Not verified

The repository's pinned runtime and the Google Chrome channel, as disclosed above. Any application behaviour — none exists. Any MYOB Acumatica interface, field, enumeration or unit. Real-device touch behaviour; target sizes and viewport behaviour were measured, not observed on hardware. Screen-reader output. Print layout. Local storage in more than one browser. Offline capture, which is neither designed nor claimed. Owner design acceptance and business approval.

## Reproduction

```bash
python3 scripts/build-order-fulfilment.py
node scripts/check-order-fulfilment-model.mjs
node scripts/check-order-fulfilment-browser.mjs
```

Under the repository's pins, use `.nvmrc`, `npm ci` and `npm run browser:install` first. The focused workflow uploads the original results and screenshots for 14 days; the JSON and hashes retained here allow comparison afterwards. Regenerating screenshots produces new timestamped evidence, not the original run.
