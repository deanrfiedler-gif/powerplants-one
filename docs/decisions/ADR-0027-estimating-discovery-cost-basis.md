---
document_id: PPO-ADR-0027
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Selected receiving implementation design; runtime verification pending
source_commit: d574b5526d5ff5cf26e814b94682beb439241d3f
---

# ADR-0027 — Exact discovery basis for manual estimate versions

## Scope and authority

Dean authorised the audit's fourth task: connect adopted E2 scope revisions to manual costing and exact Draft quotations. This implements the receiving obligation left explicit in ADR-0026 under #167/EST-01–EST-09. It introduces no pricing formula, automatic line generation, delivery routing, approval, issue or acceptance policy. Existing manual schema-1/2 commands, arithmetic and stored originals remain supported.

## Chosen representation

Retain the existing one-Estimate-per-option constraint. Relax only the one-Estimate-per-Opportunity constraint, because one opportunity now has up to ten explicit options. Separate typed tables identify new discovery-backed Estimate roots and immutable version-to-basis links; no E1 row is backfilled with a guessed questionnaire. An existing legacy estimate and its compatibility A/r01 remain unchanged. Fresh E2 alternatives can have their own independent manual estimate.

Each bound version references the exact existing option, Discovery revision, scope/answer snapshot IDs and content/context hashes. Every successor of a bound Estimate has a binding. An ordinary price/content save inherits the previous version's exact basis; only the separate reviewed receiving command can adopt a newer current Complete discovery revision. Incomplete or unconfirmed successor scope never replaces an earlier cost basis. Scope selection/change alone creates no cost version, quote or CRM forecast effect.

The Estimate header retains its immutable original Site and initial revision as provenance. For new bound records, current and historical presentation/permission context derive from the specific version's immutable basis; they must not use the header's creation Site as the meaning of a later scope revision. Existing legacy context retains its current rules. Different related Sites across revisions are supported without changing old header fields, costs or quotation bytes. Quote preparation resolves the Site of the exact selected cost version. This is a prototype data/permission choice, not new business authority.

## Commands and user journey

The existing workspace owner selects a current Active option with Complete attributed discovery and reviews its exact basis and manually entered costing fields. A strict new receiving namespace records current workspace/option/revision expectations, source-context comparison, expected estimate version (zero on first create), operation ID and reason. It creates one Estimate for that option or appends a successor to the same bound Estimate. The user reviews included scope, exclusions, assumptions, lines and declared manual arithmetic; questionnaire facts do not generate prices or silently replace manual adjustments.

Acceptance holds the current group/estimate locks and rechecks root ownership, whole-group Draft state, current selected option, exact Complete revision and current related-record authority. A new estimate has one original header/version/binding and one receipt. Adopting changed scope appends a new cost version/binding; it never changes an existing version. Competing first creates, changed selection, changed context, stale price versions and changed payloads under an existing operation ID are refused without partial effects. An uncertain result is reconciled under the original operation.

Current authority is checked before original receipt and historical output recovery. A readable newer Site/option cannot confer permission to an older basis. Cost-internal reads and quote-safe reads retain separate capabilities, including source-reference checks that do not require internal-cost access merely to view a permitted Draft. Revoking original Site/Facility/equipment access prevents disclosure of that historical source. A removed/stale reference cannot be treated as an empty source.

New ordinary manual saves of a bound record retain its basis exactly, even after discovery has advanced; the UI labels the saved basis and any newer discovery separately. New content still respects Active/Draft group guards. Existing original render/receipt recovery remains available under current permissions after archive. No receipt or stored output is regenerated to make it match current scope.

## CRM and output

Multiple option estimates require an explicit list of permitted estimate references in CRM. Preserve the existing legacy primary reference where present, otherwise use a stable first-created reference; changing the selected discovery option must not silently switch the previous single-estimate projection. Do not add alternative amounts together or change the Opportunity forecast. Display each reference as its own estimate and expose only currently permitted rows.

Draft quotation amounts, scope and customer-safe text continue to come from one exact saved cost version. Site comes from that version's basis for bound estimates. Historic E1 and E2 Draft inputs/files remain byte-identical. Formal quote issue/response remains E4.

## Migration and verification

Migration 0027 is additive apart from replacing the Opportunity uniqueness rule with the existing option uniqueness plus explicit graph guards. New roots use deferred references so header, version and basis are atomic. Constraints require every bound cost version to match its Estimate/option/company and exact Complete Discovery snapshot. Immutable-table triggers retain original roots/bindings; legacy materialisation remains required for unrelated E1 creation and is skipped only for a fully constrained bound root. Existing migration files and workflow definitions are unchanged.

Before publication, review every exact migration assertion and the hosted-upgrade gate. Required proof: old E1 rows/DTOs/canonical receipts/files through upgrade and repeated seed; two independently costed options; same-option successor/adoption; different selected Site with correct saved/output labels and original-Site revocation; direct SQL graph/immutability refusal; races; atomic audit/receipt/outbox failure; strict HTTP/origin/permission denials; saved desktop/phone and real application/PostgreSQL restart recovery. Current-source and actual-main results must be observed separately.

Alternatives rejected: overwriting E1 A/r01 loses history; one Estimate shared by mutually exclusive options mixes scope and cost; forcing a new option for every Site change adds an unadopted business rule; retaining the creation Site in every new quotation mislabels the selected scope. Version-bound context preserves the adopted revision model without reassigning issued evidence.
