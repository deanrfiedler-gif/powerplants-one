---
document_id: PPO-010-TAXONOMY-HO
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Implemented locally; exact-source and actual-main verification pending
source_commit: 233dd66ccdf2a576c0e36f2cddd374504b337fb0
---

# Manual estimating categories and Allowance handover

## Authority and result

Dean's continuing audit instruction adopts DR-01 in the [policy package](../decisions/audit-follow-through-policy-package.md). [ADR-0023](../decisions/ADR-0023-estimating-line-taxonomy.md) selects the versioned preservation design. The reconciled [E1 contract](../contracts/estimating-e1.md) is the receiving boundary; #162 carries its documentation reconciliation. This increment depends on the controlled CRM outcome/transfer sources without assigning any Estimating ownership through CRM transfer.

New manual estimates expose Product, Labour, Freight, Engineering and Subcontract with a required Yes/No Allowance choice on every line. Existing three-category versions show Allowance as Not recorded. An explicit adoption control starts an expanded proposal and requires each choice before a new version can be saved. Neither an old line nor a hidden quotation line is inferred to be an allowance. Decimal arithmetic, include/print, fixed Estimate ownership, Option A and draft-only quotation remain unchanged. Old payloads and saved quotations remain supported.

## Storage, API and recovery

Additive migration 0025 gives old estimate versions only `cost_schema_version=1`; old line/scope JSON, hashes, audit records, receipts and original outputs are unchanged. Schema-1 detail omits this new marker, preserving its old shape. CreateEstimate/SaveEstimate accept schema 2 with five categories and mandatory Boolean flags. Saved schema-2 content hashes include format 2. The installed arithmetic guard is extended only at its exact known category predicate; an unrecognised guard refuses upgrade. Old migrations are untouched. Immutable-version and existing graph checks remain active. Receipt/audit/outbox envelope versions stay 1 because their structures are unchanged; command hashes distinguish input versions and all flag content.

The current owner and scoped relationship checks precede mutation and original-receipt recovery. A lost response freezes the exact original proposal and prevents quotation preparation until resolved. Historical predecessor views retain their original allowance absence. Quote-safe projections expose neither category nor allowance; original HTML/PDF are reopened by their exact stored identities, never regenerated to manufacture successful recovery.

Use the existing exact Node/npm/PostgreSQL/Chromium setup and E1 handover commands. Normal `npm run db:migrate` followed by `npm run db:seed` applies 0025 once; it adds no seed. Use only disposable `ppo_synthetic_test` for reset/test commands. The hosted-upgrade guard was read and reviewed for the additive discriminator/predicate; no hosted upgrade, epoch reset or deployment was executed.

## Verification boundary

Implemented checks retain the original E1 suites and add two unit tests, three PostgreSQL scenarios, one HTTP scenario and one browser scenario on desktop/phone. The DB scenarios cover identical command races, changed flags under the same operation, exact schema constraints and rollback, denied related context, migration-24 original records/ledger/grants/output preservation, concurrent adoption, immutable predecessors, separate safe quotes and revoked-grant recovery denial. Existing Finance upgrade assertions compare every old field plus the explicit new default. All migration registry consumers and the hosted upgrade's added-migration count are reconciled.

The real E1 restart script retains its entire schema-1 proof and adds an independent schema-2 original, successor, three receipts and an interrupted stored quote across the same three application/browser and two PostgreSQL processes. Schema-2 recovery supplies a renderer that throws if regeneration is attempted. New browser coverage deliberately chooses blank-to-Yes/No flags, changes Engineering/Subcontract, loses an accepted response, recovers the original, reloads and reopens the legacy predecessor; desktop/phone/320px captures carry exact byte and source/run provenance.

Local Node 24.20.0/npm 11.19.0 lint, typecheck, all 87 unit cases and build passed. Three Python checks passed (78 parents; 144 document records; 45 front-matter revision comparisons). A local restart-script TS7022 inference error was corrected with explicit APIResponse/Buffer types before publication. No local PostgreSQL/browser pass is claimed because this runtime lacks the required database/browser. Every CI result must be reconciled on the exact published source. Real PostgreSQL/browser/restart and visual/output review are pending at this authored checkpoint. Preserve any failed run and its specific repair; do not replace it with a later green count. Final source/tree, actual normal merge/main, all applicable run IDs/attempts/conclusions and original evidence belong in this increment's PR publication. Automated checks are not independent review or operational acceptance.

## Remaining scope

DR-02 same-site equipment and E2 multiple options/questions follow separately. Numeric routing rules/bands/confirmation (DR-03–06), the five container propositions and E3/E4 source/approval/terms decisions remain unresolved. This increment neither derives a route nor introduces live CREMS, ERP, customer issue/acceptance, hosting or production migration. All 78 parent requirements and P01–P12 identities remain intact.
