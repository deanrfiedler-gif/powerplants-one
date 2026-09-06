---
document_id: PPO-010-SCR
revision: r01
date: 2026-09-06
owner: Dean Fiedler - private prototype
status: Proposed screens and synthetic walkthrough; no runtime implementation
---

# Estimating screens and synthetic walkthrough

Use [BP-04](BP-04-estimating-quotation.md) for business controls and the [shared UI r03](../standards/ui-style-specification.md) for brand/typography/accessibility direction. [Interactive design preview](estimating-workspace-mockup.html) and [preview validation status](estimating-visuals/README.md) illustrate a bounded subset. They contain fictional data only, make no network calls, save nothing and reset on reload. Implemented runtime behaviour must be proved separately.

## 1. Navigation and information hierarchy

Estimating is a peer domain beside CRM and Service. Proposed routes below are design names, not live endpoints. Keep the existing PPO shell, full supplied logo on navy, green selected marker, labelled navigation and 44px primary controls. Use Roboto/Verdana, tabular right-aligned amounts, navy text on green, visible keyboard focus and natural wrapping. No decorative imagery competes with cost lines.

| Screen | Proposed route / actor | Purpose and principal controls |
|---|---|---|
| ES-01 Estimating work | `/estimating` / requester, estimator, reviewer | Owned requests/estimates with customer/opportunity, owner, state, next action and due/needed. Search/owner/state filters, explicit no-results recovery and unknown totals. No sum across alternative options. |
| ES-02 Request and routing | `/estimating/requests/:id` / Sales and receiving estimator | Existing opportunity/company context, scope, source references, requested date or unknown, receiving owner; Submit, Accept for estimating, Return with reason. Later full/Express routing shows decisive answer and inherited route. |
| ES-03 Estimate workspace | `/estimating/estimates/:id` / estimator | Customer/opportunity/option, scope/estimation revision, estimate version, owner, currency/tax basis and save state. Tabs Scope, Costing, Quotation, History. Current editable draft and immutable historical versions visibly distinct. |
| ES-04 Scope/questionnaire | workspace Scope / estimator, Engineering | Included work, exclusions, assumptions, facilities/systems/phases; later questions/flags and exact published definition. Re-snapshot compares changes and incompatible answers before save. |
| ES-05 Costing grid | workspace Costing / estimator | Description/source, category, quantity/unit, unit cost, extended cost, unit sell and sell total. Inline/edit-dialog proposals, add permitted line, discard/apply batch, source dates, known subtotal and explicit incomplete/stale totals. |
| ES-06 Options and history | workspace History / authorised reader | Option and revision tree, exact source versions, decisions and change reasons. Compare predecessor/successor. Locked actions explain why; no “latest” replacement of old content. |
| ES-07 Review | `/estimating/reviews/:id` / commercial reviewer | Exact submitted cost/scope, policy/FX evidence, deviations and questionnaire readiness. Approve/Return/Withdraw under separate actor permissions. No self-approval threshold invented. |
| ES-08 Quotation authoring/preview | workspace Quotation / quote author/reviewer | Exact estimate source, line include/print controls, grouped hidden amounts, narrative/terms/validity, customer-safe draft preview. Separate tabs for internal authoring and safe presentation. |
| ES-09 Issue and response | `/estimating/quotes/:id/issues/:issue_id` / issuer/response recorder | Exact issued bytes/template/revision, distribution evidence, stated respondent and response, reservation/decline/dispute/unavailable follow-up. New issue never inherits response. |
| ES-10 Handover/recovery | `/estimating/handovers/:id` / receiving owner/integration operator | Exact accepted scope, destination and company; per-target status and external evidence. Reconcile original outcome, recover existing target, return missing inputs; no blind “try again”. |

## 2. ES-03/05 detailed layout

Desktop: compact navy rail and white page header. Record identity and Draft status lead; owner and full reference remain visible. A single context strip shows customer/opportunity/option plus AUD and tax basis. Tabs sit above one main content surface. Costing uses a semantic table inside a labelled scroll region; description and header freeze without obscuring focus. Long descriptions wrap and row height expands.

The costing toolbar offers search and Add line only when supported. A line edit form labels quantity and unit separately, displays provenance and preserves errors/input. Committed totals and proposed totals never share an ambiguous number. A bottom save area states changes and provides Apply/Discard; runtime uses Saving/Saved/Outcome unknown only when backed by actual evidence. The preview instead says Apply to preview and explicitly states no persistence.

The mockup uses three manual synthetic lines: two demonstration control modules at AUD 100 cost/150 sell each; four hours of setup at 50 cost/80 sell; one freight allowance at 40 cost/50 sell. Cost 440.00, sell 670.00, difference 230.00, margin 34.33%, markup 52.27%. Values are fictional arithmetic, AUD excluding tax with no tax calculated; they are not company rates, catalogue prices or approved pricing thresholds.

Phone: compact branded header with full 88px logo, clear domain label and no horizontal page overflow. Table becomes stacked cost cards with label/value pairs and explicit Edit controls; quotation remains available. Metadata wraps. Full screen/dialog forms use 16px inputs, visible labels and 44px targets. Desktop grid scrolling is contained. At 320px, long references/descriptions wrap; no scaled-down desktop canvas.

## 3. ES-08 quotation presentation

Internal authoring shows Included in price and Show detail separately, with concise help: hiding detail keeps the price. Customer preview lists printed rows plus a named “Included scope allowance” for hidden priced lines, and a total that reconciles. Excluded rows do not contribute and are not presented as included work. Future grouped configuration/annex detail uses BP-04's separate membership/annex rules.

The draft preview has customer and offer identity, scope, commercial table, AUD/tax basis, exclusions, assumptions and pending terms/validity. A prominent Draft — not issued label appears in both screen and print. Internal unit cost, margin, supplier details and review notes never appear in the customer preview subtree. This local authoring document contains synthetic internal data; the future customer endpoint must use a separate server-whitelisted DTO and output, not CSS hiding.

No sample terms, validity dates or signature panel are represented as operative. In production, required terms/expiry/contact/template evidence must be complete before approval/issue. The preview offers no Send/Issue/Accept buttons. A draft PDF is a later E1 output obligation; this design's HTML print CSS is not a controlled issued PDF service.

## 4. States and recovery copy

| State | Visible explanation and recovery |
|---|---|
| Loading | “Loading estimate…”; do not show zero value or an empty list as a result. |
| No results | “No estimates match these filters.” Clear search/filters retains permitted scope. |
| New/empty estimate | “No cost lines yet.” Explain required manual input and allow a line only under current permissions. |
| Invalid quantity/price | Field-specific message, linked to the input; preserve all other edits and focus the first error. |
| Dirty proposal | “Changes in this preview” in the design; runtime “Unsaved changes” with last saved vs proposed totals and explicit save/discard. |
| Saving | “Saving changes…” only during an actual request; prevent duplicate submission of that intent. |
| Saved | Runtime server-confirmed time/version; never emitted by this mockup. |
| Changed version | “This estimate changed. Your proposal is retained. Compare the current version before saving.” No silent overwrite. |
| Outcome unknown | “We could not confirm the save. Check the original outcome before retrying.” Original operation identity retained; no replacement create. |
| Stale totals | “Saved lines need recalculation. These totals cannot support approval.” Repair derived totals without creating lines again. |
| Access changed | “This estimate is no longer available to this identity.” Clear sensitive record/proposal values; return to permitted work. |
| Unavailable source | “The referenced source is unavailable.” Preserve source identity; do not substitute a current or unrelated document. |
| Locked | State and reason visible next to disabled action; supported read access still available. |

Keyboard: labelled form controls; Enter submits valid form; Escape closes dialog; focus returns to opener. Up/down controls accompany future drag reorder. Unsaved-input decisions must be accessible; no toast-only failure. Announce status changes using a polite live region. No colour-only status or icon-only commercial decisions.

## 5. Walkthrough and visual acceptance

1. Open the synthetic estimate in Costing. Check the three lines and AUD 440.00 / 670.00 totals.
2. Edit the first quantity to three. Proposed cost 540.00 and sell 820.00; apply affects the preview only. Discard/reload returns original data.
3. Enter zero quantity. The field error retains values and blocks preview application.
4. Open Quotation. Hide setup detail; total remains 670.00 and the included allowance shows 320.00. Exclude setup instead; total becomes 350.00 with no hidden allowance for that excluded line.
5. Inspect Scope and History; exact references and pending decisions remain distinguishable from application state.
6. Select Changed version, Outcome unknown, Stale totals and Access changed examples. These illustrate recovery; they are not simulated server confirmations.
7. Review desktop, 390px phone and 320px narrow views. Confirm full logo, readable values, complete labels, contained scrolling, keyboard dialog/focus and no console/network errors.

The actual QA report identifies which steps and viewports were executed. No screen illustration passes the future database/API/permission/restart/issue acceptance cases. See [acceptance](../testing/estimating-acceptance.md) and [handover](../delivery/estimating-discovery-handover.md).
