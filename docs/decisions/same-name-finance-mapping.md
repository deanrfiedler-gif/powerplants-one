# Same-name customer and Finance mapping proof

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Recorded 10 October 2026 (Australia/Brisbane). Status: authorised synthetic regression work; independent review and owner acceptance pending.

Dean authorised completing the review and sequential merge of backend PRs #379, #380 and #381, verifying their combined result, and proceeding with the PT-02 same-name customer/debtor mapping proof alongside UI work in Claude. This contribution starts from their combined branch `f4ade08a3f354202dacbf0b1a7fc6a118077cf07` on `codex/same-name-finance-mapping`. Merge outcomes and exact check states are recorded separately in the [evidence](../testing/evidence/same-name-finance-mapping/README.md). This authorisation does not deploy the app or enable operational ERP activity.

The [PT-02 procedure](../testing/prototype-acceptance.md#pt-02--same-name-account-mapping) maps to AT-02/AT-30 and retains its parent CRM-01/SVC-06 scope. [BP-01 DAT-01/DAT-10](../blueprints/BP-01-master-blueprint.md), BP-07 VAL-01 and the [P10 physical Finance contract](../contracts/finance-handoff.md#p10-physical-implementation-amendment) govern exact identity and release. Display names do not identify an account. The synthetic connection UUID, external company key and case-sensitive external customer key remain distinct from internal company/customer/account IDs.

The proof creates a new Q01 work order through existing commands, records field evidence, obtains separate Service review and issues its report. Finance attempts wrong-company, ambiguous, missing and stale account choices before the correct explicit synthetic account completes review, processing and reconciliation. A temporary test-only grant establishes that the wrong-company refusal still holds for an actor allowed to see both accounts; the exact added grants are removed afterwards. No seed or deployed permissions change.

Existing runtime behaviour satisfies the exercised contract. `finance_accounts.mapping_snapshot` is immutable; the handoff revision pins its hash and account identity, and every simulator target retains a constrained reference to that account. The proof resolves the full tuple through those retained references, including after the current ERP mapping changes. It does not claim that every target line repeats the external tuple inline. No duplicate storage fields, migration, framework or new technology are needed.

VAL-01 is the authored validation rule, not a currently emitted API error string. The execution record distinguishes `InvalidData` (422), `RecordUnavailable` (404) and `AccountContextChanged` (409). The current schema prohibits live `Verified` ERP mappings; `SyntheticVerified` Finance contexts do not confer live verification. Actual Manual/VerifiedApi modes remain disabled. No parent acceptance, owner observation, browser behaviour or production readiness follows from these backend checks.
