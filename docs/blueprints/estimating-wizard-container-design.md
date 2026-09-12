---
document_id: PPO-010-CONTAINER-STUDY
title: Estimating container design study
revision: r03
date: 2026-09-11
owner: Dean Fiedler - private prototype
status: Design study supporting PPO-010-CONTAINER-DEC; not adopted, supersedes nothing
work_package: PPO-010
source_commit: 6dc9fda0411ffcb694fc0c934971a8b3ffbee34c
---

# Estimating container — design study

## Status first

This is a **design study**, not a design of record. It exists to make the five propositions in [PPO-010-CONTAINER-DEC](../decisions/estimating-container-propositions.md) observable rather than theoretical.

It **does not** supersede the adopted [guided wizard design](estimating-wizard-design.md), change [BP-04](BP-04-estimating-quotation.md), or widen the increment authorised on 9 September. Everything in it — customers, sites, equipment prices, labour rates, historical records and pricing rules — is synthetic, and no rule it executes is an approved manufacturer or engineering rule.

The artefact: [`estimating-wizard-container.html`](estimating-wizard-container.html).

## How it relates to the adopted pilot

The [pilot decision](../decisions/estimating-wizard-pilot.md) authorises one repeatable supply-and-installation package, requirements through estimator adjustment to a quotation draft. Its design records what it defers: *broader line editing, package selection, server persistence, review approvals and output downloads are future integration work*, with the brief and customer fixed as context.

This study implements several of those deferred things — multiple systems across project areas, alternatives and options, line-level editing, cost types, and recorded review decisions. It is therefore **prospective design for deferred scope**, not an alternative answer to the pilot's question.

| | Adopted pilot (PPO-010-WIZARD-DESIGN r01) | This study |
|---|---|---|
| Scope | One fictional sensor package, fixed customer and brief | Multiple systems across multiple project areas |
| Screens | Four: Requirements, Proposed solution, Estimate, Quotation | Five: Requirements, Configuration, Scope & delivery, Pricing, Review |
| Line editing | One editable labour override | Any generated line, with the edit bound to its basis |
| Scope variants | Not in scope | Base, Option, Alternative, Excluded |
| Standing | **Adopted design direction** | **Study only** |

The step counts differ because the scopes differ. Reconciling them is not required before deciding the propositions, and is not attempted here.

## What the study demonstrates

Each item maps to a proposition in the decision record.

**EC-D01 — rule provenance.** Eighteen versioned rules with identifier, version, maturity, cost type, a readable driver and a source-record reference. The engine executes the registry. Every priced line carries a chip showing the rule and version that produced it, opening that rule's own evidence card and the historical record behind it.

**EC-D02 — estimator price binding.** An override records the rule version and equipment model it was entered against. Change either and it is held back rather than reapplied; the rule's figure is used and the line says so. Detachment is sticky, so configuring back to the original equipment does not silently restore the old number.

**EC-D03 — where invariants live.** A margin floor, exactly-one-alternative-per-group, scope decisions requiring reasons, lapsed supplier prices and unresolved price edits are enforced in validation and a blocker set. Reviews and blockers behave differently on purpose: open reviews are carried into a revision and recorded as open; blockers prevent one being created.

**EC-D04 — unknown amounts.** Six conditions make an amount pending. While any is present in the selected scenario, gross profit, effective margin and GST are withheld rather than computed from an incomplete cost.

**EC-D05 — money representation.** Integer minor units throughout, rounded half-away-from-zero once at gross-up. Supplier prices carry their own currency and price date; internal labour rates are never converted.

Also present, and not the subject of a proposition: cost type as a dimension with an optional margin per type, a declared contingency, revisions storing inputs and a rule manifest rather than a derived calculation, and a six-section help guide behind the header **Help** control.

## Conventions observed

Australian English, AUD with GST shown separately, Roboto/Verdana with navy `#242a37` and green `#62bb46` per the supplied brand guidance, and no brand bytes beyond the font already held in `public/brand/`. Synthetic references use the `SYN-` prefix. Dates are echoed in `dd Month yyyy` beneath every native date control, because the control renders in the browser's locale rather than the document's. Thirty-eight semantic design tokens with no literal colour value outside the token block, per [PPO-STD-001](../standards/naming-conventions.md) §13.2.

The font is embedded as base64, consistent with the other standalone previews in this folder.

## Mounting contract

Mount `#ppo-estimate-styles`, `#ppo-estimate-wizard` and `#ppo-estimate-script` inside the shared shell. Omit `#ppo-estimate-preview-frame` and the document wrapper. The root owns its gutter; set `--ppo-estimate-height` to the available host height. One fresh root per mount. Before removal, dispatch `new Event('ppo-estimate-dispose')` on the root — this detaches every listener, clears the toast timer and closes any open dialog.

## Verification

Browser checks against the file committed here, in headless Chromium (Playwright 1.56 / Chromium 1194).

| Area | Result |
|---|---|
| Behaviour regression — every control and pricing rule as a named assertion | 49 / 49 |
| End-to-end journey through the interface, including save, reload and dispose | 20 / 20 |
| Contrast at WCAG AA — five steps, three pricing views, five dialogs, six help sections, desktop and 390 px | 0 failures |
| Target size, WCAG 2.2 SC 2.5.8 | 0 controls below 24 × 24 px |
| Output escaping — script payloads in seventeen user-controlled fields | 0 executions, 0 injected elements |
| Horizontal overflow at 390 px | none |
| Console and page errors | 0 |

Render time at the fifty-system validator cap: 58 ms for the configuration step.

This is design-preview evidence, not business acceptance and not application testing.

## Limits

Not verified: screen readers, Firefox, Safari, or any real mobile device. `<dialog>`, container queries, `:has()` and `100dvh` differ enough in Safari to warrant a pass before any field use.

Not present, and belonging to application integration: server validation and permissions, immutable revisions, version-conflict handling, a governed rule registry with approval authority, server-issued identifiers, resolved customer and equipment records, live supplier pricing, document storage, ERP handoff and quotation issue. Drafts persist in browser storage only; the study keeps ten revisions and a hundred change entries and reports when older ones were discarded.

The commercial policy values in the study — margin floor, review band, discount guideline — are illustrative and carry no approval authority. They are not adopted Powerplants commercial policy.
