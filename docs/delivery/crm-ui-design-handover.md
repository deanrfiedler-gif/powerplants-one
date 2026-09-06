# PPO shared UI and CRM design handover

**Revision:** r02 · **Date:** 6 September 2026 · **Owner:** Dean Fiedler, private prototype · **Parent:** PPO-009 / [issue #9](https://github.com/deanrfiedler-gif/powerplants-one/issues/9) · **Status:** Repository design handover; implementation and acceptance remain separate.

## Audit-driven revision r02

Dean requested an audit of both pages, then authorised the design revision on 6 September 2026. The revision starts from published main `8bc0d903cb9da100136a8a5430bac9e6883bb27d`, tree `191b7f86c790201850240a55b3f81b683a52c38c` (original design PR #41). It uses the separate `docs/crm-ui-audit-revision` branch and leaves the active I1 and P09 branches untouched.

| Audit finding | Applied revision |
|---|---|
| 1. Phone records below the initial screen — High | One compact identity header, collapsed secondary filters and shorter context area. Complete first card visible at 390×844 and 320×800; full logo retained. |
| 2. Laptop pipeline wraps — High | One horizontal stage sequence, minimum 250 px columns, bounded scroll and sticky headings. Phone directly selects any stage; previous/next and retained stage selection included. |
| 3. Grid orientation disappears — High | Frozen header and opportunity title/reference column with opaque backgrounds and focus scroll padding. Qualification stays intact. |
| 4. Grid next action missing — High | Actual action description plus due/status and full owner name; contact remains in the Grid and detail. |
| 5. New opportunity changes working context — High | Selected pipeline prefilled; current synthetic actor remains the explicit owner default. Creation preserves filters/search/sort/stage and provides a View opportunity notice. |
| 6. Long accepted action clips — High | Natural wrapping of 200-character titles and 160-character actions in cards, Grid and detail; flexible card metadata. |
| 7. Readability and density — Medium | 14 px body/titles, 12–13 px supporting text, roughly 54 px desktop rows and 160–180 px typical cards. Unavailable ERP column moved to detail. |
| 8. Target and interaction consistency — Medium | Clear underlined record-opening control; no misleading whole-card hover. 44 px phone/form/filter targets; explicit 40 px dense desktop Grid policy. Linked errors focus the invalid field. |
| 9. Filter recovery — Medium | Removable active criteria, Clear all and direct no-match recovery retain the selected pipeline. Saved views, header sorting, column management and bulk editing remain later scope. |
| 10. Value basis and failure states — Medium | Currency/tax/unweighted/as-at context beside totals; consistent neutral stage rules. Eight branded exception/state illustrations accompany the interactive normal/empty/create/validation examples. |

The visual corrections for all ten findings are applied within the preview scope. The explicitly deferred workflow features above still need their own implementation contracts. Branded loading, unavailable, access, conflict, saving and uncertain-save examples are static illustrations; this revision does not simulate server authority or claim those backend behaviours work.

### Measured improvement

| Viewport / measure | Audited r01 | Revised r02 |
|---|---:|---:|
| 390×844: first Board card top | 844 px | 399 px |
| 320×800: first Board card top | 940 px | 416 px |
| 1366×768: complete initial Grid rows | 6 | 9 |
| 1366×768: pipeline stage sequence | Two rows | One horizontally scrollable row |

Measurements use CSS pixels without browser chrome. Phone first-card bottom is inside the initial viewport. Grid row counts account for the visible scroll container, not hidden rows or rows outside it.

### Revision verification and review

The actual standalone export passed `node docs/blueprints/crm-ui-design-check.mjs` using Chrome headless shell 151.0.7922.34. Its companion `crm-ui-audit-checks.mjs` exercises the observed regressions. [Local result and measurements](../blueprints/crm-ui-mockups/revision-review.json) record the exact input hash; [current asset manifest](../blueprints/crm-ui-mockups/manifest.json) retains original and revised hashes.

Checked seven viewport sizes from 320 to 1920 px; all-six-stage phone navigation; Board/Grid data/filter/sort equivalence; known/unknown totals; creation context and out-of-filter recovery; linked field validation/focus; Escape and detail focus return; horizontal keyboard scrolling; frozen table identity/headings; long input in Board/Grid/detail; a temporary 150-record uneven-stage derivative; and a focused 200% text enlargement check. Seventeen captures were generated. Desktop Board/Grid, phone, scrolled grid, long text, enlarged text, load and state illustrations were visually inspected. No runtime errors, external network calls or browser storage writes occurred.

During revision checks, a phone position exceeded the strict 420 px target by 0.18 px; spacing was adjusted and the final run passed. Visual inspection of enlarged text found metadata overlap inside cards; wrapping was corrected and a regression assertion added. Neither intermediate result is represented as a final pass. Full browser zoom, screen-reader, high-contrast and real-device acceptance remain unverified; the focused text check is not accessibility certification.

Foundation, prototype and naming checks also passed on a complete local archive of the exact baseline with this revision overlaid (39 document records, 7991 instruction characters, 78 parent dispositions retained). A first foundation attempt needed a local Git index; after preparing that index, it passed. Application checks were not run locally. The revision PR runs the existing documentation, CRM design and application workflows against its complete checkout; its check results and artifact are the publication evidence. This r02 edition is a reviewable design revision, not an application release or a merge claim. The original r01 publication is preserved by [PR #41](https://github.com/deanrfiedler-gif/powerplants-one/pull/41).

## Original r01 handover and authority

Dean authorised publication of the brand-derived shared specification, supplied logo and synthetic Board/Grid mockups, with maintained CRM and I2 guidance. The [UI specification r03](../standards/ui-style-specification.md), [C01–C07 specification r03](../blueprints/crm-screen-specification.md), [preview/captures](../blueprints/crm-ui-mockups/README.md), [I2 UI guidance](crm-i2-ui-guidance.md) and [decision note](../decisions/ui-brand-and-crm-layout.md) form the handover. The issued r01 conversation documents/captures retain their original bytes; the working specification adds repository links and scope guidance.

Baseline main was `ddc1a3cce769e011939e621d8d5f176542f48f8c` (PR #38), tree `d6d374ec30c620276e402d6a15f5adbc4d25bf02`. Work uses the dedicated `docs/ppo-ui-crm-design-handover` branch. I1 issue #39 / draft PR #40 and P09 issue #36 / draft PR #37 were active; neither branch is edited here. I1 keeps its existing scope and owns preparation of the full I2 starter. The [UI addendum](crm-i2-ui-guidance.md) is ready for it to consume.

## Source and export treatment

The original brand PDF governs exact colour, typography and logo evidence; its Markdown transcription is secondary. The logo and reattachment matched exactly. The [manifest](../blueprints/crm-ui-mockups/manifest.json) records supplied-PDF, logo and original capture hashes. Only the approved logo and synthetic design outputs enter Git. No operational Pipedrive record, original screenshot or full company PDF is committed.

The standalone HTML carries the same fictional fixture and UI as the conversation preview. Export removes the host frame, embeds only the used Lucide 1.17.0 geometries and includes font/icon notices. It uses no API, network, local/session storage or service worker; temporary creation resets on reload. It is a design document, not a new application route or hosted site.

## Original r01 verification and publication evidence

The original conversation preview passed 30 browser assertions plus a focused 390/320 px filter-reflow check using Chrome for Testing headless shell 151.0.7922.34. Full desktop Board/Grid, representative tablet/phone views and all four original specification PDF pages were visually inspected. Those original captures are preserved, not relabelled as application screenshots.

The repository export has its own repeatable `node docs/blueprints/crm-ui-design-check.mjs` check in the existing CRM design workflow. It checks the actual exported file for view/filter equivalence, known/unknown values, search/empty/detail/dialog behaviour, temporary creation/reload, keyboard focus, desktop/phone reflow, logo integrity and no network/storage. Its evidence records the source head, executed checkout/tree, input hash, captures and actual result. Existing `crm-design-check.mjs` screen/state checks remain intact.

Local export verification passed on 6 September 2026 with Chrome 151.0.7922.34 at 1800, 1024, 736, 390 and 320 px. The exported desktop Board, desktop Grid and phone Board captures were visually inspected; text, icons, complete logo and contained scrolling rendered correctly. The standalone conversion was verified independently of the original preview captures. The local authoring copy has no Git checkout/tree identity; final publication checks below use the complete CI checkout.

The publication PR records actual final results for foundation, prototype, naming, CRM design and the existing application assurance workflow. Those full repository checks run on GitHub's complete checkout; the local authoring copy contains only this handover's files and is not presented as a full application validation environment. Check runs are attached to the exact PR head/merge test tree. Merge uses the checked expected head; the PR's merged commit and current-main verification complete the publication record. No independent human review is claimed.

## Limits and next step

This changes documentation/design assets only. It does not implement CRM persistence, permissions, stage transitions, relationships, financial basis, ERP linkage or live migration. It adds no migration, grants, application dependency or deployment. All 78 parent IDs and existing acceptance statuses remain unchanged; issue #9 and AT-25 remain open/planned.

Complete and verify the active I1 work, then incorporate this visual direction into the maintained I2 starter against actual merged main. Implement the separately authorised Board/Grid slice with real server and browser evidence. Resolve operational mapping and commercial-basis questions before claiming those capabilities; the design preview is not business acceptance.
