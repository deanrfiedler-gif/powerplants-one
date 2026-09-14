---
document_id: PPO-010-E2-RUNTIME-HO
revision: r03
date: 2026-09-14
owner: Dean Fiedler - prototype owner
status: Definition comparison and current-context foundation implemented; DB proof and full E2 pending
source_commit: d779854e2f1d117abdc73e39d2bb9c73be9d5269
---

# E2 scoped discovery implementation handover

[#167](https://github.com/deanrfiedler-gif/powerplants-one/issues/167), [ADR-0025](../decisions/ADR-0025-e2-discovery-foundation.md) and the [receiving contract](../contracts/estimating-e2-design.md) govern this authorised subset. This is an isolated successor to P12 integration #166; it does not supersede P12 evidence or complete E2.

## Implemented foundation

`src/estimating/discovery.ts` contains the immutable ten-question r01 definition, strict bounded input compiler, stable content/definition hashes and explicit comparison/inheritance functions. Numeric routing is not executed: delivery classification remains Not configured. Scope readiness, Full/Express effort and open contract-review items are separate facts. An owned unknown effort or Q04 answer does not manufacture an Express choice or a delivery route.

The compiler distinguishes Empty, Deferred, Answered, Confirmed and Assumed. Active mandatory inputs need either explicit confirmation or owned unresolved evidence; absent/blank/invalid values are not zero or NoneDeclared. Conditional Q08/Q10 presence follows the named predicates. Hidden answers cannot be submitted as new confirmed data; comparison retains the exact prior values. Facilities/equipment are explicit duplicate-free IDs, with the adopted 10/100 bounds, one Site and system-membership subsets. No-site/unknown scope cannot carry equipment. Input actor/time/readiness/routing fields are refused.

Definition comparisons distinguish label changes from type/unit/choice/condition changes, removals and new required questions. The r02 Each-to-metres/Packaging example is tested only as a comparison fixture; r01 is the only executable definition. Alternative inheritance preserves copied source/hash identity, downgrades confirmation and keeps owned unresolved items. It copies no money, price or quotation. Returned compiled structures and definition-comparison copies are frozen; original input objects remain unchanged. Later edits to a proposed definition cannot alter a captured comparison.

`src/estimating/discovery-context.ts` now resolves current Opportunity/customer/contact and proposed Site relationships, exact selected Facility/equipment IDs and their observed versions/names. Preparation rechecks estimating edit permission and eligible follow-up owners; historical access rechecks current related-record visibility. It captures only explicit membership, preserves unresolved equipment identity and hashes observed context with the exact input. These internal helpers do not acquire group ownership, save a revision or bind a new Site to E1. Seven real-database cases are authored for access revocation, unrelated identities, same-company/wrong-Site membership, customer relationships, owner eligibility, no business writes and changed shared versions. Execution is pending.

## Verification and limits

Source `a22eee458978568a0343d27df38c21b6004a6f07` completed full run `34800169567`, job `103841099682`, attempt 1: 100 unit, 398/400 DB, 26 HTTP and 168 browser cases plus three explicit skips. Two new context cases failed while constructing a second current Operator for the already-operated synthetic Site, before the intended relationship assertions. The correction adds the customer's separate BillingParty relationship. The seeded operator, exclusion constraints, wrong-Site tests and revoked-customer-access assertions remain intact. Corrected-source execution remains pending; #168 now targets main after #166 merged.

Local Node 24.20.0/npm 11.19.0 lint/types and all 100 unit tests passed, including ten new E2 cases. The initial worktree build failed because a dependency symlink pointed outside Turbopack’s existing root. A local copy of the exact already installed dependency tree resolved it; the unchanged application build then passed. No compiler boundary or test assertion was loosened. The real CI target remains Node 24.21.0 and guarded Chrome. Three documentation checks preserve all 78 parents and the P01–P12 order. Current-source CI and actual-main verification belong in the eventual review publication.

The executed unit tests exercise definition, structure, readiness and comparison components of E2-A01/A03/A04. The new resolver and seven database cases passed lint/types only at this checkpoint. Authored cases do not prove PostgreSQL behaviour, capability enforcement, races, an HTTP route, saved revisions or browser journeys until actually executed. UUID validity and structural membership are not current related-record authority. No new application route or migration is introduced by this foundation.

## Next implementation obligations

1. The current shared Facility/equipment/Opportunity/Estimate schema and permissions have been inspected. Specify and implement additive formalisation of existing E1 A/r01 UUIDs and exact estimate-version basis links. Reconcile selected E2 Site with fixed E1 header/quote context before enabling an import.
2. Add one selected Active option, immutable scope/answer revisions and expected-version group locking. Admit only the adopted Draft whitelist; unknown/inaccessible group state holds mutation.
3. Reauthorise every selected record and follow-up owner at the transaction boundary, including original receipt/history reads. Preserve E1 schema-1/2 canonical results, old output bytes, fixed ownership and current safe-read authority.
4. Add explicit source comparison, partial save, branch/selection/archive/reopen and deliberate complete-basis manual-estimate integration, with no generated lines or implicit selection refresh of a quote.
5. Implement and verify desktop/390px/320px states plus actual DB/HTTP/race/upgrade/reseed/restart originals. Complete normal protected-main integration and authoritative publication before closing #167.

No E3/E4 costing policy, approval/terms, formal issue/customer response, new delivery rule, container proposition, real source integration or hosted action is adopted by this code. Full E2 and independent owner acceptance remain open.
