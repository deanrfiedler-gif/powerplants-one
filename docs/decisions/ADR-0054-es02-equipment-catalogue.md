# ADR-0054 — Versioned Estimating equipment catalogue

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 12 October 2026 (Australia/Brisbane). Status: backend implementation authorised; owner and operational acceptance separate. Amends [ADR-0035](ADR-0035-es02-structured-discovery.md). Scope: ES-02, PPO-010, EST-02/03 and the existing EST-01–EST-09 handovers; all parent IDs retained.

## Decision and source

Dean asked to continue backend work while he designs user-facing pages with Claude in Figma, then authorised the proposed versioned six-family and 108-category model: “Ok. Proceed with that work.” The classification source is his 23 September list in [the design decision, section 3](es02-design-board.md), also required by Q8 of [the accepted Figma design](es02-wizard-figma-design.md). This authorises the backend increment described here; the Figma layout remains separate work.

Reuse PostgreSQL revision JSON, TypeScript validation, the existing discovery APIs and atomic audit/receipt transactions. No new dependency or service. A mutable global category table would change the interpretation of saved revisions; replacing r01 would destroy historical meaning; deriving families from product names or old broad groups would invent an ambiguous mapping. Instead, add a frozen definition with stable internal category IDs and exact source labels.

## Representation and compatibility

Keep `schema_version: 1` / `PPO-ES02-CONFIG-r01` accepted and unchanged. Add `schema_version: 2` / `PPO-ES02-CONFIG-r02`. Exact version/definition pairs are required. New clients explicitly supply r02; existing clients and `emptyConfiguration()` still use r01. No existing source, hash, confirmation token, receipt, output, seed, permission or ID is rewritten. Copy keeps the source definition; reads never upgrade it.

The six families are Climate (17), Controls (15), Water (20), Automation (38), Structures (7) and Services (11). `src/estimating/equipment-catalogue.ts` freezes all 108 names and opaque stable category IDs; do not regenerate an ID when a label changes. Each r02 system has `family` and `category_id`; the category must belong to that exact family. `Infrastructure` stays a separate shared group with an explicit null category, outside the six-family count. No r02 Unknown/Other bucket or guessed legacy mapping is introduced. Unclassified proposals can continue under r01 until the estimator deliberately supplies a valid r02 classification. Category identity is independent of existing work tags and external ERP/product keys.

All other graph fields and the 65,536-byte canonical command limit remain. A category is classification, not product selection, unit conversion, engineering suitability, price or a costing rule. No category-to-specialist routing is inferred.

## Readiness, changes and evidence

r01 keeps its exact readiness rules. In r02, every system requires its supply description; every explicitly captured fact must be confirmed in its catalogue-defined role. Unknown/assumed/answered facts remain valid owned incomplete work. This is a bounded capture rule, not an approved technical checklist for the 108 categories; Q7's Technical details catalogue remains separate.

An explicit r01-to-r02 successor supplies every classification and passes ordinary source, ownership, optimistic-version and review checks. Surviving systems retain all captured fact fields and r01's required supply/controller-capacity/monitoring-model fields. Missing facts must be supplied as owned unknowns if unresolved. Later r02 successors preserve the captured fact fields of surviving systems. Facts may be corrected with new evidence and confirmations; a changed scope can explicitly remove the whole system. This conservative preservation rule prevents reclassification from silently clearing an outstanding requirement. No automatic transformation is offered. Downgrading an r02 option to r01, including via historical input, is refused.

Confirmation fingerprints bind the exact r02 definition and system classification. Definition changes require fresh confirmation; changed categories invalidate their system's fact acknowledgements. Comparisons include the configuration definition/schema and per-system categories, with matching based on exact IDs or existing copy lineage. Copy allocations include the actual definition and preserve classifications while reconfirming copied evidence. Saved manual costs and quotations retain their exact original discovery basis until explicit successor adoption.

## API and persistence

The existing discovery form-options read accepts optional `configuration_definition=PPO-ES02-CONFIG-r02`, returning `configuration_catalogue` with schema, definition, six families/categories and the separate infrastructure representation. Existing requests retain their response shape. Existing opportunity/workspace read/edit checks still apply; the catalogue response confers no save authority. Create, preview, Save, CopyDiscovery, history and comparison use their existing routes and revalidation. No new route or capability.

Migration 0085 extends the installed `check_estimating_configuration()` function only at checked predicates, preserving all ownership, reference, lineage and graph checks. The database validates family/category membership and successor evidence preservation. No backfill, new table, business-identity ALTER, seed, user or grant. The hosted upgrade gate is reviewed for that exact additive scope; no hosted upgrade or deployment is executed by this work.

The current UI remains r01 authoring. Its existing family-icon fallback is used for unfamiliar saved family IDs; this one-line compatibility correction adds no new selector or layout. r02 category editing and accepted Figma alignment remain future UI work; API acceptance does not claim native authoring completeness. Existing source inspection can show the exact saved configuration.

## Proof and handover

ES02-CAT-01–08 cover source parity, all valid/invalid pairs, mixed versions, confirmations, incomplete evidence, copying, current authority, SQL guards, populated 0084 preservation, exact original replay, explicit reclassification and costing/quotation lineage. Existing ES02-T scenarios and historical upgrade suites remain. [Execution evidence](../testing/evidence/estimating-catalogue/README.md) records actual outcomes and initial failures. Implementation, CI, Figma acceptance, owner review and deployment remain separate.
