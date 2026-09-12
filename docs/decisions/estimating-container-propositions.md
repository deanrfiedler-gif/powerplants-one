---
document_id: PPO-010-CONTAINER-DEC
revision: r01
date: 2026-09-11
owner: Dean Fiedler - private prototype
status: Proposed for review; nothing adopted, no scope widened
source_commit: 6dc9fda0411ffcb694fc0c934971a8b3ffbee34c
---

# Estimating container — five propositions for the deferred wizard scope

## What this is, and what it is not

Five architectural propositions about how estimating should behave when the scope deferred by the [guided wizard pilot](estimating-wizard-pilot.md) is eventually designed. Each is demonstrated in a working [design study](../blueprints/estimating-wizard-container-design.md) so the consequence can be seen rather than argued.

**Nothing here is adopted.** This record does not widen the increment Dean authorised on 9 September, does not supersede [PPO-010-WIZARD-DESIGN](../blueprints/estimating-wizard-design.md), does not change BP-04, E1's [contract](../contracts/estimating-e1.md) or [ADR-0017](ADR-0017-estimating-e1.md), and does not alter any parent requirement ID, P01–P12 order or acceptance status. It introduces no technology, migration or ADR sequence slot. D-009/D-010 and the CREMS source gaps remain open.

## Relationship to the adopted pilot

The authorised direction is bounded: *"design and prove one repeatable supply-and-installation package, from requirements through estimator adjustment to a quotation draft."* Its design states what it leaves out — **broader line editing, package selection, server persistence, review approvals and output downloads are future integration work**, and the brief and customer are fixed context in that first demonstration.

The design study behind this record implements several of those deferred things: multiple systems across multiple project areas, alternatives and options, line-level editing, cost types, and recorded review decisions. That makes it **prospective design for deferred scope, not a competing answer to the pilot's question.** The two are not in conflict and neither is superseded. Whether the deferred scope is eventually designed this way is the decision being put here.

A consequence worth stating plainly: the study is a wider increment than was authorised. Treating it as an adopted design would expand the authorised scope by implication. That is why its status is study, not design of record.

## Review the five proposed propositions

| Proposition | Concrete recommendation | Material consequence | State |
|---|---|---|---|
| **EC-D01** Rule provenance | Pricing rules live in a versioned registry — identifier, version, maturity, cost type, readable driver, source-record reference — and the engine executes that registry. Every generated line records the rule and version that produced it. | The provenance a user reads is the logic that ran, because there is only one of them. Rule maturity becomes a first-class field, so "approved" has somewhere to land. Cost: rule changes need version discipline, and a rule bump must invalidate what depends on it. | Proposed |
| **EC-D02** Estimator price binding | An estimator's price override is recorded against the rule version and equipment model it was entered on. If either changes the edit is held back, the rule's figure is used, and the line says so. Detachment is sticky: returning to the original configuration does not silently restore the old number. | A hand-entered price can never reattach to a basis nobody re-examined. Cost: the estimator must explicitly reapply or discard, which is friction exactly where friction is wanted. | Proposed |
| **EC-D03** Where invariants live | Commercial and structural invariants — margin floor, exactly one selected alternative per group, scope decisions needing reasons, lapsed supplier prices, unresolved price edits — are enforced in validation and a blocker set, not in interface event handlers. Blockers are distinct from reviews: reviews are recorded decisions that do not stop a revision; blockers do. | The rules hold on the storage-restore path and would survive being lifted into a server-side domain service. Cost: the blocker set becomes a governed list that needs an owner, and a margin floor implies a policy record with approval authority that does not yet exist. | Proposed |
| **EC-D04** Unknown amounts | An amount that is not yet known is *pending*, never zero. Six conditions produce it: pending price status, no amount recorded, unconfirmed quantity, lapsed supplier validity, no usable exchange rate, and a percentage of an incomplete base. While any exists in the selected scenario, gross profit, effective margin and tax are withheld rather than computed. | The estimate cannot quietly present an incomplete total as a complete one. Cost: more of the interface has to carry a "known subtotal" reading, and estimators see fewer finished-looking numbers early on. | Proposed |
| **EC-D05** Money representation | Amounts are held as integer minor units. Rounding is half-away-from-zero, applied once at gross-up and once at currency conversion. A supplier price carries its own currency and price date; internal labour rates are never converted. | Removes a class of floating-point and rounding inconsistency from costing, and makes a stored amount unambiguous. Cost: it is a contract-level choice — if adopted it should be reflected in the E1 contract and any schema before values are persisted, not retrofitted. | Proposed |

## What adopting any of these would require

| If adopted | Then |
|---|---|
| EC-D01, EC-D02 | BP-04 gains a rule-registry section; the registry needs an owner and an approval route before any rule is marked approved |
| EC-D03 | A commercial policy record with named approval authority; the blocker set recorded as a governed list |
| EC-D04 | The E1 contract and any estimating schema state how an unknown amount is represented and how totals behave in its presence |
| EC-D05 | The E1 contract and schema fix the stored representation before values are persisted |

Adoption of any proposition is a separate act. This record's own status stays Proposed until that happens.

## Provenance of this contribution

The design study was built from an HTML container the owner supplied, outside the repository's design track, and before the adopted pilot design was inspected. That sequence did not meet the standard set by the [pilot decision record](estimating-wizard-pilot.md), which inspected AGENTS, README, STATUS, CONTRIBUTING, naming, ADR-0003/0017, BP-04, the E1 contract, the E2 starter and the estimating implementation plan before design work. The propositions are put forward on their merits; the process gap is recorded so the contribution is not mistaken for one that followed the normal route.

## Verification of the study

The study's behaviour was checked in a browser, at the file committed to this repository: 49 named behaviour assertions, a 20-step end-to-end journey, WCAG AA contrast and target size across every view and dialog at desktop and 390 px, and script-injection payloads in seventeen user-controlled fields — all passing, with no console or page errors. Repository assurance (`check_naming`, `check_foundation`, `check_prototype`) passes.

That is design-preview evidence. It is not business acceptance, not engineering sizing, and not a test of application behaviour, which does not exist for this scope.
