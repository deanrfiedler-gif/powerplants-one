---
document_id: PPO-ADR-0025
revision: r01
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Selected bounded implementation foundation; persistence and full E2 verification pending
source_commit: d779854e2f1d117abdc73e39d2bb9c73be9d5269
---

# ADR-0025 — Adopted E2 discovery validation and comparison

## Authority and sequence

[#167](https://github.com/deanrfiedler-gif/powerplants-one/issues/167) follows the [adopted audit policy package](audit-follow-through-policy-package.md) and [reconciled receiving contract](../contracts/estimating-e2-design.md). E2-D02/D03 and DR-02 are authorised; numeric routing, DR-03–06 and the container propositions are not. The current integration #166 owns ADR-0024 and migrations through 0025. This ADR uses the next available decision identity; it allocates no migration yet.

## Decision

Use the existing TypeScript validators and canonical hashing for a bounded server-side discovery compiler. Keep the ten adopted question IDs, types, units, choices and predicates as one immutable definition. Do not copy or execute the historical R01–R13 route evaluator. Effort is an attributed Full/Express declaration or an owned unknown; delivery classification is always Not configured in this increment.

Validate explicit Site/NoSiteRequired/Unknown scope, duplicate-free Facility/equipment membership and the three adopted system tags. Structural UUID/membership validation is not permission proof: the future transactional service must resolve every related record, version and eligible follow-up owner under current grants before accepting a snapshot or returning history/receipts. This foundation exposes no route or database command and grants no user new access.

Answers retain Empty/Deferred/Answered/Confirmed/Assumed separately, with explicit source and owned unresolved items. Required active answers need confirmation; Unknown never substitutes for a known enum/count or silently becomes zero. Q04 review need is independent of routing and does not alone prevent the narrow manual-basis readiness. Hidden answers are retained from accepted history by a deliberate successor comparison, not supplied as new hidden confirmed content. Server callers provide actor/time; request input cannot forge them or client-computed readiness.

Definition comparison evaluates stable identity, type, unit, choices, predicates and required state before any label-only compatibility claim. Incompatible/removal/new-required outcomes retain exact prior meaning; the r02 metres/packaging case remains a comparison fixture only. Branch inheritance downgrades confirmed copied answers to Answered and requires deliberate confirmation, preserving provenance. The future database layer must store immutable revisions and compare expected workspace versions; pure tests do not demonstrate those locks or persistence.

## Receiving implementation obligations

Before a migration or E1 mutation is authored, specify physical extraction of existing E1 A/r01 UUIDs and immutable estimate-version basis links, exact old/new command dispatch, one-Estimate-per-option constraints and whole-group Draft locks. Verify how a selected E2 Site relates to the existing Opportunity/Estimate Site and customer-safe quote context; never combine one site's costing basis with another site's label. Shared Facility/equipment/owner permissions require actual current-schema inspection and DB race tests. Preserve every old canonical command, receipt, scope/version and stored output byte through upgrade/reseed/restart.

This isolated foundation can be reviewed while P12 source/main verification proceeds. It is not the full E2 runtime, readiness to issue, a generic rules engine or a new operational master. Subsequent persistence, API, UI, original recovery, real permission/compatibility/browser evidence and normal main publication must complete #167 before it is closed. No pricing generation, E3/E4, hosting, live source access or customer effects are included.

## Alternatives

Reusing the standalone historical route model would execute an unadopted policy. A generic schema/rules package would add unnecessary dependency and rule-authoring scope. Client-only readiness would let submitted flags replace authoritative confirmation. All three are rejected; a small explicit immutable definition and server-derived result fit the adopted subset and can be tested independently before integration.
