---
document_id: PPO-CS01-EVIDENCE
title: Customer 360 r01 verification evidence
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Design verification only; no business acceptance, device acceptance or ERP verification is claimed
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# CS-01 Customer 360 r01 — verification evidence

Subject: [`docs/reference/ui/customers/PPO-Customer-360-Workspace-r01.html`](../../../reference/ui/customers/PPO-Customer-360-Workspace-r01.html)
SHA-256 `d2b21bacfa4b709fcb9e52292b94def8b934414be9e246e4f3167490b9ba8431` · 283,946 bytes.

Both result files below were written by their own check script against that exact file.

| File | Script | Groups | Recorded |
|---|---|---:|---|
| [`model-results.json`](model-results.json) | `scripts/check-customer-360-design.mjs` | **86 passed** | 2026-09-16T10:03:00Z |
| [`native-results.json`](native-results.json) | `scripts/check-customer-360-browser.mjs` | **12 passed** | 2026-09-16T10:03:13Z |

## Model and DOM emulation — 86 groups

jsdom 27, `runScripts: 'dangerously'`, with `scrollTo`, `scrollIntoView` and the three `HTMLDialogElement` methods stubbed because jsdom does not implement the top layer.

Coverage by area: starter data and synthetic identity (4) · overview composition and attention items (5) · sales orders, quantities, dates, holds, cancellation, staleness and unmapped records (17) · accepted-quotation-versus-order and conversion (2) · deals, revisions and alternative options (4) · cases, visits, reports, findings and warranty (7) · projects and completion facts (3) · sites and equipment relationships (3) · permissions, restriction and private communications (4) · accounts, balances and the recorded Finance fixtures (8) · filters, chips, search, drill-through and return navigation (7) · customer and site context isolation (3) · activity, documents and read-completes-nothing (3) · local persistence, refused storage, unreadable bytes and escaping (5) · presentation, tokens, fonts, self-containment, identity uniqueness, keyboard and labelling (8) · no page error raised across every interaction (1).

## Native browser — 12 groups

Chromium via Playwright, headless, locale `en-AU`, timezone `Australia/Melbourne`, no network egress.

**Measured at five viewports** — horizontal page scroll on Overview, Sales orders, the order snapshot, Accounts and Cases:

| Viewport | Width | Maximum horizontal overflow | Register presentation | Smallest interactive control |
|---|---:|---:|---|---:|
| Desktop | 1440 | 0 px | Table, 6 rows | 32 px |
| Laptop | 1280 | 0 px | Table, 6 rows | 32 px |
| Tablet | 834 | 0 px | Table, 6 rows | 32 px |
| Phone | 390 | 0 px | Cards, 6 cards | 32 px |
| Narrow | 320 | 0 px | Cards, 6 cards | 32 px |

The table row count and the card count are equal at every viewport, so the two presentations represent the same matched records.

**Measured interaction:** the applied body font resolves to the embedded `PPOBoardRoboto` face at every viewport; a docked record snapshot opens at every viewport; Arrow and End move between local tabs; focus is restored to the newly activated tab, which matches `:focus-visible` and renders a solid 2 px outline; the shared choice card opens inside the viewport and closes on Escape; drill-through applies the filter and return navigation restores the overview; switching customer through the real choice card leaves no trace of the other customer; and no console error, page error or non-`file:` network request occurred in any run.

**Recorded, not asserted otherwise:** the modeless dock overlays the right of the workspace, including the customer choice card, matching the r03 dock pattern.

## Defects found by verification and fixed

| Defect | Found by | Fix | Re-measured |
|---|---|---|---|
| 68 px horizontal page overflow at 320 px | Native measurement of `scrollWidth − clientWidth` | `flex:1 1 0; min-width:0` on `.date-range input`; native date inputs will not otherwise shrink inside a flex row | 0 px at 320 px |
| Keyboard focus dropped to the document body after activating a tab | Native keyboard sequence Arrow → End | The tab keydown handler changes the view directly and restores focus to the new tab element | `tab-deals` focused, `:focus-visible` true |
| Case detail note occupied a third grid column, pushing the work-order column to a second row | Screenshot review at 1440 px | The description list and its note wrapped in one grid child | Two-column layout confirmed |

## Repository checks

Run from the repository root on this branch:

| Check | Result |
|---|---|
| `python3 scripts/check_foundation.py` | passed |
| `python3 scripts/check_prototype.py` | passed |
| `python3 scripts/check_naming.py` | passed |
| `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | no match |

## What is not evidenced

No screen reader, assistive technology or physical device was used. Colour-contrast ratios were not measured. Print output was not rendered. Only Chromium was exercised. No owner visual acceptance and no business acceptance has occurred. No MYOB endpoint, schema, permission, company definition, order-status vocabulary or financial definition has been verified against a real instance — every ERP fact in this package is fictional. No parent requirement (CRM-01, CRM-04, CRM-06, SVC-06) and no acceptance case is passed by these design checks.
