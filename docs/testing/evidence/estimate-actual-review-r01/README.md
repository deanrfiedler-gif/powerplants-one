---
document_id: PPO-ES09-VERIFY
title: ES-09 Estimate-to-Actual Outcome Review r01 verification evidence
revision: r01
date: 2026-09-16
owner: Dean Fiedler
status: Executed local verification; pinned-runtime CI and owner acceptance remain separate
source_commit: 0769a16dd842e9dc1c349a853036ab71949e7807
---

# ES-09 r01 — verification evidence

This record states exactly what was executed, what passed, what was corrected and what was **not** executed. A green result here is component evidence for a documentation and design contribution. It is not business acceptance, not application behaviour and not owner acceptance of the visual design.

## 1. Source under test

Built from `main` at `0769a16dd842e9dc1c349a853036ab71949e7807`.

| Artefact | Bytes | SHA-256 |
|---|---:|---|
| `docs/reference/ui/estimate-actual-review/PPO-Estimate-to-Actual-Outcome-Review-r01.html` | 261,877 | `3775128e2bd0c571e26b5dd5c0d2decbd08e052b0f4fead3e67589be4c9d342c` |
| `docs/design/estimate-actual-review/model.js` | 82,217 | `585fc428b4fed0bcbcf75954fb2376526fadc134d5ca08e148171e27c9b7597f` |
| `docs/design/estimate-actual-review/workspace.js` | 87,676 | `0d9137fc44cdbe31a8b40eabed6b989ce24339e7ce3278fc37420f48767e89fd` |
| `docs/design/estimate-actual-review/workspace.css` | 25,072 | `967b1bd4159b2b04750081ef6bbe773f4d5161467bc850f82d726fa31daf0f48` |
| `docs/design/estimate-actual-review/template.html` | 3,296 | `446e96e4b5a7313521581d66decf3702aa01b4e7b4ff66bd00ef928dcec791b3` |
| `docs/design/estimate-actual-review/fonts.css` | 63,656 | `57b4aafb71296b18d80408cb10aa972c87f5185deafd748c7fdcfb33e2bd4bef` |

Visual source: theme board r20, SHA-256 `c68a499e857b1705d47bd6598d4b2e89526bf0861a0d234394c3da023f19b617`. Only its three embedded Roboto `@font-face` declarations were extracted; the 16 MB board is not copied into this package.

## 2. Executed checks

| Check | Command | Result |
|---|---|---|
| Deterministic assembly | `python3 scripts/build-estimate-actual-review.py` | Built; repeat build produced identical bytes |
| Model, arithmetic and command rules | `node scripts/check-estimate-actual-review-model.mjs` | **39 groups passed**, 0 failed |
| Native browser interaction | `node scripts/check-estimate-actual-review-browser.mjs` | **29 groups passed**, 0 failed, 0 page errors, 0 console errors |
| Documentation foundation | `python3 scripts/check_foundation.py` | passed |
| Prototype consistency | `python3 scripts/check_prototype.py` | passed |
| Naming and document register | `python3 scripts/check_naming.py` | passed |
| Merge-conflict marker scan | `git --no-pager grep -n -E "^(<<<<<<<\|=======$\|>>>>>>>)" -- docs` | no match |

Machine-readable results are written to `verification-evidence/estimate-actual-review/` (`model-results.json`, `results.json`) and uploaded by the focused workflow. That directory is `.gitignore`d, as it is for every other design contribution.

## 3. What the model check asserts

39 groups covering: basis separation and non-mutation; refusal to price a variation from its selling price; quantity-class preservation; refusal of commitments, customer billing and unreviewed capture as actual cost; sign convention and explicit denominators; exact quantity/rate/joint decomposition with a reconciling residual on every decomposed line; the three-way identity; commercial movement held out of the cost comparison; duplicate source keys; allocation ceilings, unit and currency guards, and the refusal of an equal split by default; preserved unallocated remainders; quantity-only comparison; completeness declaration; role and stale-version refusals; materiality and attribution rules including the retained unexplained remainder; the three finding states and the ES-10 handover refusals; provisional conclusion; source change after conclusion; successor creation; idempotent receipt recovery and changed-content conflict; observer authority; malformed-state rejection; and serialised round-trip.

## 4. What the browser check asserts

29 groups covering: five views and the five-row register; named views, filters, search and recovery; separate delivery and financial completeness columns; preserved navigation context; separate issued and accepted bases with supplier sources; retained basis snapshot; basis declaration; Finance validation as a separate act; equal-split refusal and preserved remainder; unresolved shared cost and unissued credit held outside the comparison; commitment and customer-invoice refusals; submission blocking; failed save preserving the form and state; the variance table, decomposition and identity; `n/a` for an unsuitable denominator; materiality and full attribution; finding, proposal and ES-10 handover in order; no change to any estimating basis; lost-response recovery without a duplicate record; provisional-only conclusion; no originating record closed; exact reload; source change preserving the concluded result; successor creation; the restricted observer boundary across all five views; restricted search and export redaction; five viewports with no horizontal overflow; keyboard navigation, dialog Escape and the skip link; and a preserved damaged session.

## 5. Visual inspection

23 original full-page captures were taken and reviewed: 1440 px for all five views plus the conclusion, source-changed and observer states; 390 px and 320 px for all five views.

Two presentation defects and one disclosure defect were found during inspection and corrected before the final build:

| Finding | Correction |
|---|---|
| The comparison table required horizontal scrolling at 390 px and 320 px, pushing comparison columns out of view. | A phone treatment converts each comparison line into a labelled stacked card. Re-verified at both widths. |
| A reviewer's free-text explanation quoting a supplier rate remained visible to the read-only observer. | A `Restricted narrative` renderer now withholds every free-text field recorded beside a restricted value, in the page, in summaries and in the export. |
| The export retained operation-receipt payloads containing the original command text verbatim. | Receipt payloads are redacted in a restricted export and the envelope states so. |

The hashes in section 1 are the corrected build, and both check suites were re-run against it.

## 6. Browser used, and the limit on that evidence

The repository's pinned Chrome channel was **not available** in the authoring environment. The native checks ran against the bundled Chromium **141.0.7390.37** through the `PPO_BROWSER_EXECUTABLE` override that this contribution's check script provides. The result manifest records `browser_source: explicit executable /opt/pw-browsers/chromium`.

**A pass on Chromium 141 is not evidence for the pinned Chrome 153 runtime.** The focused workflow `.github/workflows/estimate-actual-review-design.yml` runs the same three commands on the pinned Node, npm and Chrome, and its result must be read from the workflow run rather than inherited from this record.

`npm ci` could not run locally: `package.json` requires Node 24.21.0 and npm 11.19.0, and the environment provided Node 22.22.2. Playwright 1.63.0 was installed standalone for the check only. **No dependency pin, lockfile or `package.json` entry was changed.**

## 7. Not executed

- Screen-reader verification.
- 200% zoom and print-pagination review.
- Physical-device review on any phone or tablet.
- Any accessibility conformance assessment. Contrast pairs follow the shared UI specification's calculated values; no certification is claimed.
- Any application, database, migration, hosted-environment or external-system test. None exists for this scope.
- Owner acceptance of the finished visual design.

## 8. What no result here establishes

No result establishes an adopted accounting definition, materiality threshold, allocation basis or variance reason registry; an approved formula or a change to one; a commercial lineage that does not exist in the schema; application behaviour; or business acceptance. Code delivery, component checks, executed acceptance and business approval remain four separate claims.

## PR repair — 16 September 2026

The complete package in #220 supersedes the abandoned partial upload #218. The source guide, template and builder are byte-identical between them; the complete decision adds a clarification that actuals without estimated basis are reported separately. No unique completed implementation is lost by closing #218.

Repository CI found an unused `owner` renderer in the controller. Removed that unused binding and rebuilt the working draft. The resulting HTML is SHA-256 `a6a235b9290715651aee516f07218a89ef421ab1d94743f248d6c1970f39e913`. Full repository lint, 39 model groups, deterministic build and foundation/prototype/naming assurance pass. The focused workflow now includes ESLint so that a standalone browser pass cannot conceal a lint failure. Historical screenshots/results above retain their original source hash; the new CI run verifies the repaired draft. No layout, calculation, role, source or operational rule changes are introduced.
