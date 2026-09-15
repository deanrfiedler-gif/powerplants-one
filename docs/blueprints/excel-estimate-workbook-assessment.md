---
document_id: PPO-010-EXCEL-ASSESS
revision: r01
date: 2026-09-15
owner: Dean Fiedler - prototype owner
status: Repository and synthetic assessment; operational examples outstanding
source_commit: dcabfec1b5cde1c2cf220359e6cf1c63408512d6
---

# Excel estimate workbook assessment

## Evidence available

The current main commit was verified as dcabfec1b5cde1c2cf220359e6cf1c63408512d6. AGENTS, README, STATUS, BP-04, E1/E2, receiving ADR-0027, estimating validation/arithmetic, shared UI guidance and naming guidance were inspected. STATUS contains older integration checkpoints; the actual tree includes the later E2 work. This assessment does not adopt stale snapshot prose as current runtime absence.

No departmental Excel workbook was attached. The available attachment is an HTML theme reference, internally titled **Powerplants One — Theme & Style Board · r16**. Its filename metadata advertises r19 elsewhere in the conversation, but those bytes are not r19. The preview uses its available navy/green, Roboto, control and shadow tokens alongside the maintained shared UI specification. No complete r19 match is claimed.

## Findings and disposition

| Finding | Design response |
|---|---|
| Existing exact saved estimate versions and Draft outputs are reusable. | Add import provenance and use the current domain write path; do not create a second pricing engine. |
| E1 currently allows 100 lines, two-decimal prices, three-decimal quantities, AUD excluding tax and a 64 KiB command. | First pilot preserves those bounds. Profile and specify any extension separately. |
| Category extension already supports Product, Labour, Freight, Engineering and Subcontract; allowance is independent. | Use the existing schema-2 taxonomy and explicit allowance choice. |
| The current line payload has no first-class section reference. | Design a version-bound section/source sidecar with resolved facility and growing-area references. Application schema work remains outstanding. |
| Excel formula caches do not establish calculation freshness or engineering adequacy. | Require recalculate/save and source review; compare line values and totals independently; no macros or refresh in importer. |
| Specialist workbooks may have legitimate different layouts. | Standardise six export tables. Allow flexible calculation sheets; later add reviewed mappings for recurring layouts. |
| Importing a newer file can overwrite manual PPO edits if treated as replacement. | Compare exact current version, preserve manual-only lines pending a keep/remove decision, commit one reviewed successor. |
| Customer quotations must not expose cost workings. | Separate internal import bundle from the existing customer-safe exact-version projection. |

## Delivered workbook structure

One populated r01 workbook is delivered as a synthetic example and reusable starting point. It has Overview, Project, Estimate lines, Scope, Sources, Calculation and PPO export sheets. The export is a distinct machine interface, not a duplicate editing surface. Calculations flow from editable inputs to estimate lines and then to summary/export. There is no business calculation dependent on an audit worksheet.

The example covers a propagation greenhouse systems upgrade: climate controller/sensors, fertigation, irrigation pipework/valves, lighting/brackets, installation, electrical subcontract allowance, engineering, freight and commissioning. Twelve lines belong to seven sections. All suppliers, references, rates and prices are fictional and do not represent Powerplants quotations or engineering recommendations.

The initial labour calculation is 2 people × 5 days × 8 hours = 80 hours. Changing to 6 days gives 96 hours, increasing cost by AUD 1,120.00 and sell by AUD 1,760.00. Initial cost is AUD 62,952.38; sell and included sell are AUD 85,607.63. Pipework tests fractional quantity and line rounding: 180.5 × 6.75 = 1,218.38 cost; 180.5 × 9.25 = 1,669.63 sell.

Input cells are amber and calculated/export areas are visually separate. The 100 prepared rows have category/unit/Yes-No validation and frozen table headings. Native formula locking is **not implemented** in this r01 export because the available authoring API did not expose verified worksheet protection. The workbook states this limitation. Native Excel recalculation, validation behaviour, protection and row extension must be checked before adopting a controlled departmental template. Visual distinction is not protection.

The 15 September quality audit corrected the reusable summary: section labels and membership now follow the Scope inputs; missing amounts suppress affected section totals; and an absent inclusion choice leaves the included total unknown. Neutral table styling replaces the default blue bands, and only the two reference columns remain frozen in wide line tables. All other populated values/formulas, worksheet names, validation and conditional-format rules were preserved. The summary is prepared for seven sections; extending that structure requires extending and checking the summary and export together. Do not sort the calculated export independently of its input rows.

## Evidence needed from the estimating department

Request two or three redacted files through an appropriate private channel: one straightforward equipment estimate, one complex greenhouse project and one specialist workbook containing representative formulas/options. Preserve formulas, units, worksheet structure and representative line volume. Remove confidential customer/supplier prices where necessary and replace values consistently so calculations still reconcile. Do not put operational workbooks in this public repository.

| Examine | Concrete question to settle |
|---|---|
| Sections and hierarchy | How are sites, facilities, growing areas, systems, phases and assemblies represented? |
| Pricing basis | Which quantities/rates use more than existing precision; are discounts or overheads embedded in sell prices? |
| Currency and landed costs | How are supplier currencies, rate direction/date, freight/duty and allocations kept from double counting? |
| Options and scope | Are alternatives mutually exclusive, optional extras or additive phases? Which scope items are unknown? |
| Formula mechanisms | Are there macros, external links, Power Query, hidden sheets, named ranges, manual overrides or solver calculations? |
| Cost evidence | Where are source dates, supplier revisions, validity and rate assumptions recorded? |
| Revisions | How are lines kept stable, manual changes reviewed and previous issued versions retained? |
| Quotation output | Which internal lines aggregate into customer sections; how are included/unprinted items treated? |
| Scale | Typical and largest line counts, sheet counts, file sizes and acceptable import time. |

The absence of these files does not block the design package. It prevents claiming operational workbook compatibility or finalising unsupported business rules. The [specification](../contracts/excel-estimate-import.md) makes those limits explicit.
