---
title: Powerplants One - Shared UI style specification
revision: r05
date: 2026-09-10
status: Brand-derived visual direction; functional extensions proposed
owner: Dean Fiedler
scope: Shared visual foundation; BP-03 C02 CRM board and grid mockups
source_commit: 8bc0d903cb9da100136a8a5430bac9e6883bb27d
---

# Powerplants One - Shared UI style specification

## 1. Purpose and evidence

Use a Pipedrive-familiar opportunity workspace with the supplied Powerplants identity. This specification supports the seven PPO domains through shared navigation, typography, controls and state language. It adds no domain, permission or workflow authority.

**Brand facts:** Powerplants Brand Identity Guidelines 2026 PDF, pages 7-9, 15, 17-19 and 22-24; supplied `GEN_LGO_PPALogoPrimaryTransparent_v01_ISS.png`. The original PDF takes precedence over its Markdown transcription. The two user-supplied Pipedrive screenshots establish layout references and visible stage labels, not complete account configuration or transition policy.

**PPO baseline:** repository main was inspected at `ddc1a3cce769e011939e621d8d5f176542f48f8c` (CRM discovery PR #38). Read AGENTS, README, STATUS, BP-03, the CRM screen specification, implementation plan and applicable naming rules. This is a proposed refinement of the provisional text-only CRM styling. The r02 working edition publishes this direction into repository guidance. It changes documentation and a standalone design preview, with no application or database changes.

**Scope boundary:** BP-03-local C02; board/grid behaviour belongs to I2 and later commercial presentation, while I1 retains its bounded Enquiry -> Qualified journey with no money fields. The six displayed stages and fictional values illustrate the requested future layout. They do not change I1 or accept operational pipeline mapping. CRM-01/02/03/08, PAR-03/04/05/15 and CA-06/07/10/13 are relevant; this work does not pass those implementation cases or AT-25.

## 2. Brand foundation and colour roles

| Token / role | Value | Application / evidence |
|---|---|---|
| `--ppo-navy` | `#242a37` | Primary brand; navigation, headings and dark text. PDF p18. |
| `--ppo-green` | `#62bb46` | Primary brand; selected navigation marker and primary button fill. PDF p18. |
| `--ppo-white` | `#ffffff` | Primary brand; cards, table and controls. PDF p18. |
| `--ppo-workspace` | `#f5f6f8` | Proposed UI neutral; quiet board background. |
| `--ppo-muted` | `#606977` | Proposed secondary text, dates and supporting labels. |
| `--ppo-divider` | `#dce0e5` | Proposed decorative dividers; not a sole control boundary. |
| `--ppo-input` | `#7d8794` | Proposed visible input/button boundaries. |
| `--ppo-selected` | `#edf6e9` | Proposed subtle selected surface; always paired with a label/marker. |
| `--ppo-error` / background | `#b42318` / `#fef3f2` | Proposed overdue/error pair; icon and words required. |
| `--ppo-warning` / background | `#865900` / `#fff5df` | Proposed next-action-needed / due-date-needed pair; distinct words required. |
| Planned action text / background | `#315e43` / `#f0f7ef` | Proposed scheduled-action state, with due date. |

Brand colours are exact source values. UI neutrals and semantic colours are proposed functional extensions, not additional company-approved brand colours. Category colours from PDF p19 may be used later for their stated business categories, not assigned arbitrarily to sales stages. Light Cloud is deferred: printed RGB 157,199,199 equals `#9dc7c7`, while the printed HEX is `#9dc7d7`; neither is silently selected.

**Contrast:** navy on green measures 5.96:1; white on navy 14.37:1; muted text on white 5.55:1. White on brand green measures only 2.41:1, so use navy text for green buttons. A navy outline also makes that button boundary clear on white. For normal text target at least 4.5:1; necessary component boundaries/states target at least 3:1 against adjacent colours. These are calculated pair checks, not whole-product accessibility certification. Sources: [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## 3. Typography, logo and geometry

| Element | Rule |
|---|---|
| Typeface | Roboto; Verdana fallback. Regular 400 for body, Medium 500 for controls/cards, Bold 700 for primary headings. Light is approved by the brand but unnecessary for dense data. |
| Type scale | Page title 24 px; detail heading 20 px; stage 15 px; body/card/grid title 14 px; supporting text 12–13 px. Search and form inputs 16 px on phone; compact pipeline/stage selectors use 14 px. |
| Paragraph treatment | Normal letter spacing; left alignment; natural wrapping; no justified text, condensed type or long bold/all-capital blocks. |
| Numeric treatment | Right-aligned values; tabular numerals; AUD and tax basis visible. Display an explicit unknown instead of zero. |
| Spacing | 4 px base with optical adjustments. Main gutters 20 px desktop, 12 px phone. Board gap 10 px; card padding 7–10 px. Typical cards are 160–180 px high; long content expands naturally. |
| Controls | 44 px primary/filter/form targets and all phone title targets. Dense desktop grid record buttons may use 40 px within roughly 54 px rows. This is a PPO density policy, not an accessibility certification. Native labels and visible focus. Radii: controls 6 px, cards 7 px, dialog 10 px. |
| Table | Approximately 54 px default desktop rows; titles/references and actions wrap naturally. Freeze the opportunity identity column and header inside a bounded scroll region with opaque backgrounds and scroll padding for focus. Keep stage labels intact. |
| Navigation | Navy rail, 112 px in desktop mockup, with icons plus labels. Shared My Work, Customers, People, Sites and Service concepts retained; CRM selected. Other domain entries remain an application navigation decision. |

**Supplied logo:** use the complete transparent PNG unchanged on `#242a37`. Preserve aspect ratio and embedded transparent padding; no crop, recolour, filter, distortion, separated symbol or recreated wordmark. The file contains white lettering and corresponds to the alternate green-and-white treatment (PDF p7). The user's instruction authorises its use in these private mockups; no company-wide brand approval is claimed. Corporate distribution must follow the source's alternate-logo rules.

Render the 1254 x 1254 image at 88 x 88 CSS px. Its visible artwork bounds are approximately x110-1169 / y122-1121, giving a visible height of about 70 px, above the source's 60 px minimum. The PDF p8 clear-space diagram uses 2x the logotype letter height for the standard mark. The mockup provides at least approximately 20 px of clear space around the visible artwork, including transparent padding, and avoids shrinking the logo for phone layouts. Alwyn New is the mark's lettering reference, not the UI typeface.

Use neutral line icons for application actions, always with accessible names. The prototype uses Lucide for functional controls; these are not represented as Powerplants' supplied category artwork. No decorative brand pattern sits behind CRM data.

## 4. Shared CRM workspace and view contract

**Header:** one page identity, scoped search and synthetic actor; the full logo shares a compact navy identity header on phone. **Toolbar:** Board / Grid, New opportunity, selected pipeline and a collapsible Filters & sort panel. Owner, action and sort live in that panel; removable active-filter chips and Clear all stay visible when relevant. **Context:** Open outcome, matching count, known total, unknown count, AUD/ex-GST/unweighted basis and fixed sample as-at together. **Footer:** completeness and synthetic design revision.

| Board | Grid |
|---|---|
| Lead -> Qualification -> Estimating -> Quote -> Negotiation -> Closing, from the user's screenshot, as a reference layout only. | Same filtered records, same values, same Open outcome and same opportunity detail. |
| Stage heading, count and sum of known displayed synthetic amounts; unknown amounts stated separately. | Opportunity title and SYN-PPO reference, organisation, actual next action and its status, value, expected close, stage, full owner name and contact. |
| Card: title, organisation, value, expected close, actual next action and full owner. Contact, permanent reference, age and ERP availability remain in detail. | Semantic table; wrapped title/reference and action; right-aligned amounts; full owner visible in each row. Both views use the same owner in this synthetic fixture; real Activity ownership must follow its own contract. |
| Distinguish Overdue, Next action needed, Due date needed and planned actions by text/icons as well as colour. | ERP reference is Unavailable in detail, omitted from the default grid because all examples lack it. Do not invent an OP number or equate it with the PPO reference. |

The mockup contains 18 fictional opportunities across two illustrative pipeline labels: 15 in Systems & Projects and 3 in Products & Parts. All known amounts have one fictional basis per opportunity, AUD excluding GST; sums are raw unweighted illustrative values. No quotation accuracy, forecast, probability, revenue, order or operational completeness is implied. The default shows 15 opportunities and their known total, with two not estimated.

The Board / Grid toggle preserves pipeline, owner, action filter, search and sort during the preview. Record opening works from both views. The simplified New opportunity form adds a temporary fictional record with owner and initial next action; all input data resets on reload and nothing is sent. Preview data must not contain real customer/person/deal records from the screenshots.

**Implementation requirements:** use a single permission-filtered query contract for both views and aggregates. Retain current permissions on details, related Activities, search and receipts. Save view preference per user only when implemented; this preview uses no storage. Later column resizing/reordering, saved filters, multi-select/bulk editing, drag-and-drop and stage movement are outside this mockup. Stage movement must have an accessible form alternative, required evidence/reason, server validation, version conflict handling and durable history. Completing an Activity never silently advances the stage; Closing never implies Won, customer acceptance or an ERP order.

## 5. Responsive and state rules

Above 780 px, maintain six stages in one horizontal sequence with 250 px minimum columns and contained horizontal scrolling; never wrap the pipeline into a second row. Sticky stage headings orient long columns. At 780 px or below, show one selected stage with a direct selector, counts and previous/next controls; retain the selection across view switches. The Grid remains available with a frozen 150 px identity column on small screens. Use bounded scrolling and keep the outer page within its viewport. Secondary filters start collapsed. At 390×844 and 320×800, show a complete initial Board card with its top at or above 420 px. At 1366×768, target at least nine complete compact Grid rows. These measured design targets do not impose clipping heights on content.

Show loading, no matches, validation, unavailable, denied, saving, saved and uncertain/conflict states distinctly in implemented screens. Never translate failed loading into zero records, say Saved before durable acceptance or retain sensitive details after actor/scope changes. Preserve entered proposals safely during validation/conflict, and announce changes without moving focus unexpectedly. Normal, no-matches with recovery, detail, temporary creation and linked field validation are interactive in the preview. Eight [branded state illustrations](../blueprints/crm-ui-mockups/states.html) additionally cover loading, no matches, validation, unavailable, changed version, changed access, saving and uncertain save; these are static design examples, not implemented server behaviour. Native dialog Escape and focus return are required; essential status remains visible without hover.

## 6. Review and handover

The deliverables are this specification and reviewable board/grid mockups. Validate the actual rendered files for typography, full logo, desktop and phone fit, filter/view equivalence, known/unknown value totals, empty state, keyboard/dialog behaviour and temporary creation. Preserve actual QA evidence separately from future acceptance requirements.

The original implementation sequence required verified I1 publication, then reconciliation with the [I2 UI guidance](../delivery/crm-i2-ui-guidance.md) and current shared styles. The separately invoked [I2 handover](../delivery/crm-i2-handover.md) now records that bounded application work and its runtime evidence. Money displays remain a separately bounded commercial design choice. The specification is ready for visual review; it is not an application release or accepted Pipedrive parity.

Repository references at the inspected baseline:

- [CRM screen specification](https://github.com/deanrfiedler-gif/powerplants-one/blob/ddc1a3cce769e011939e621d8d5f176542f48f8c/docs/blueprints/crm-screen-specification.md)
- [BP-03](https://github.com/deanrfiedler-gif/powerplants-one/blob/ddc1a3cce769e011939e621d8d5f176542f48f8c/docs/blueprints/BP-03-crm.md)
- [CRM implementation sequence](https://github.com/deanrfiedler-gif/powerplants-one/blob/ddc1a3cce769e011939e621d8d5f176542f48f8c/docs/delivery/crm-implementation-plan.md)

Revision r01: first brand-derived shared UI proposal and C02 board/grid visual application; 6 September 2026.

Revision r02: repository handover; links to [CRM screen specification](../blueprints/crm-screen-specification.md), [Board/Grid preview](../blueprints/crm-board-grid-mockup.html), [original captures](../blueprints/crm-ui-mockups/README.md) and [publication handover](../delivery/crm-ui-design-handover.md). The issued r01 conversation specification remains unchanged.

Revision r03: user-authorised response to the r01 UI audit; compact shell, continuous desktop pipeline, phone stage navigation, frozen grid, complete action/owner, creation context and long-text recovery. Base `8bc0d903cb9da100136a8a5430bac9e6883bb27d`; see [r02 design handover](../delivery/crm-ui-design-handover.md). The original r01 issued outputs remain unchanged.

Creation policy: prefill the specific selected pipeline; for All pipelines, default explicitly to Systems & Projects in the form. Owner defaults to the current synthetic actor Alex Lee, regardless of owner filter. Preserve pipeline, owner, action filter, search, sort and phone stage after adding. If outside the current filters, say so and offer View opportunity. Clear all removes search/owner/action criteria while retaining pipeline and sort. Required-field errors retain other input, mark the field, link its message and focus it. Never clip accepted 200-character titles or 160-character actions, including unbroken references.


I2 application note: the [bounded implementation handover](../delivery/crm-i2-handover.md) applies these brand roles and responsive principles to the actual two-stage/Open worklist. It retains full Activity text and distinguishes action/opportunity owners; memory preferences confer no data authority. Shared-screen runtime evidence is separate from these accepted design originals. No mockup amount, owner default, pipeline or temporary model becomes a server contract.

## Accepted r08 application presentation

The later [r08 implementation decision](../decisions/shared-ui-r08-implementation.md) supersedes older presentation rules for wide navigation, green primary actions and minimum-width horizontally scrolling CRM columns. It preserves the existing domain, permission, source/completeness and save contracts. See the [handover](../delivery/shared-ui-redesign-handover.md) for actual verification and publication.

## Accepted Service Job Pack r02

Dean accepted the [full Job Pack design](../decisions/job-pack-design.md) on 10 September 2026. Preserve its internal-container presentation, 24 px desktop / 16 px mobile outer padding, original embedded Roboto, navy primary actions, green active-tab marker, white panels and compact record context. Its nine-section pack, Preparation and Revision history views extend the approved Service direction. These specific Job Pack rules supersede the earlier generic 20 px / 12 px gutter proposal for this page only. Use the exact linked r02 baseline when integrating; design acceptance does not establish browser, print or application acceptance.

## Approved Service field-operations container

[Field Technicians r04](../decisions/field-technicians-design.md) is Dean’s accepted presentation baseline for `/service/technicians`. Preserve its 24 px desktop / 16 px phone outer padding, white bordered workspace, compact Roboto table typography, green selected-tab underline and four-tab right drawer inside the shared application shell. Do not duplicate global navigation or the logo. The [handover](../delivery/field-technicians-handover.md) records bounded data adaptations and verification status.
