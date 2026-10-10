# Same-name customer and Finance mapping evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Execution: 10 October 2026 (Australia/Brisbane). Source self-review completed; independent review and owner acceptance pending. Synthetic domain commands, PostgreSQL and real local document rendering/storage are exercised. No browser or live ERP execution is claimed.

## Source and results

The [PT-02 test](../../../../tests/database/finance-same-name-mapping.test.ts) starts from the combined backend branch `f4ade08a3f354202dacbf0b1a7fc6a118077cf07`. The runtime is unchanged by this contribution. The [scope decision](../../../decisions/same-name-finance-mapping.md) preserves the P10 synthetic verification boundary and AT-02/AT-30 parent mapping.

| Test source | Observed result |
|---|---|
| `a5ce7838e079c31737bd2be67e93f5cb2284ce40` | [Initial execution](initial-tests.txt) stopped at a precondition: the new test expected the provider label `PPO-SIM` where the schema correctly stores connection UUID `21000000-0000-4000-8000-000000000001`. This was a test-driver error. |
| `a63252e52a317588cd7fb1a67b1912e803d0201f` | [Corrected execution](corrected-tests.txt): all six nested checks pass, seven runner tests including the parent. |
| `ffbe9a8dc39386b01416bb98c52cab77d6a7744f` | [Earlier reviewed execution](final-tests.txt): six nested checks pass, seven runner tests, about 24 seconds. Self-review adds explicit target-update refusal and confirms temporary account permissions are restored. |
| `da0c096d2a530ab9d466e9b2983d002e26c6e5a0` | [Exact-tuple challenge](exact-tuple-tests.txt): all six nested checks pass, seven runner tests, about 38 seconds. An additional case changes only the external debtor's letter case without incrementing its source version; exact mapping integrity still blocks submission. |

The fully migrated [live schema inspection](live-context.sql) confirms immutable Finance account context, source mapping constraints and target account foreign keys. No runtime defect or runtime fix is claimed.

## Joined procedure

| Stage | Observation |
|---|---|
| Preconditions and new work | The two existing customers share the exact name SYN Greenhouse Demonstration. The command journey creates new work at SYN Q01 Demonstration Site in company A, with explicit internal customer identity, scope, readiness, visit, issued pack and acknowledgement. Field captures 90 MIN and 2 EA; separate Service approval and issue establish the exact Finance source. |
| Wrong company | Company B's account is unavailable to the default Finance preparer. Four temporary company-B grants make both accounts visible; choosing B for A's work still returns 404 `RecordUnavailable`. Exact added grants are removed and the original account options are restored. |
| Missing or ambiguous choice | Missing/null account and a display name return 422 `InvalidData`; nonexistent account UUID and a raw Proposed ERP mapping UUID return 404 `RecordUnavailable`. Actual Manual/VerifiedApi modes return 422. Disputed source mapping blocks creation with 409 `AccountContextChanged`. No handoff is created by these attempts. |
| Submission | The correct explicit account saves a Draft revision with the immutable mapping hash. Disputed, expired, future and case-changed debtor mappings (including unchanged-version drift) all block submission, report not-ready and reserve no quantities. Restoring the exact fixture allows submission. |
| Review and processing | Mapping-version change blocks Finance approval; changed debtor blocks processing claim; inactive mapping after claim blocks dispatch before its dispatch timestamp or any simulator target. Each stage continues only after exact fixture restoration. |
| Target and reconciliation | One target retains the original account/company/customer, attempt, correlation and input hash. Its two lines allocate 60 MIN and 2 EA to the correct debtor; the remaining 30 MIN has separate no-posting disposition. Every target source allocation matches an exact approved Finance line. Independent Finance reconciliation preserves the same target lines. |
| Historical identity | Updating/deleting the immutable account context and updating the target are refused. A later source debtor change marks current readiness unavailable while preserving the Reconciled handoff, complete Finance records and original target's tuple. It never creates a company-B target. |

Every refused application command compares complete before/after rows for 17 Finance/receipt/audit/outbox tables. Fixture mapping edits and exact restoration are bounded test setup, not a user-facing re-verification workflow. The suite does not delete a referenced ERP mapping or disable its constraints to manufacture a missing-source condition.

## Exact identity and validation semantics

| Context | Connection UUID | External company | External customer |
|---|---|---|---|
| Selected company A | `21000000-0000-4000-8000-000000000001` | `SYN-A` | `000Ab-C.01` |
| Refused company B | `21000000-0000-4000-8000-000000000001` | `SYN-B` | `000ab-C.01` |

The shared connection has provider label `PPO-SIM`; the UUID is its identity. The complete immutable account mapping snapshot has hash `b92098a8dc545d4cab0e4a6841b416522b27e5e9de5333d843e66b8f0eda1efe`. The exact-tuple log records the final newly created work/handoff/target IDs and processing hash. Source snapshots pin the account ID and mapping hash; targets use the constrained immutable account reference. Their tuple is preserved through that relationship, not duplicated on each line.

[BP-07 VAL-01 ACCOUNT_MAPPING_REQUIRED](../../../blueprints/BP-07-service-operations.md) names the conceptual rule. Runtime responses are the three explicit codes above; no literal `VAL-01` response is invented. Proposed ERP mapping remains Proposed, while the separate Finance fixture is SyntheticVerified. The database still rejects live Verified mappings. This qualifies the current PT-02 result as a combined synthetic backend pass, with independent review, owner observation and operational mapping acceptance open.

## Validation and integration

[Type checking](typecheck.txt), [full lint](lint.txt), [foundation](foundation.txt), [prototype](prototype.txt) and [naming](naming.txt) checks pass. Foundation retains all 78 parent requirements; its recorded checkpoint checks 7,462 local links. The [combined backend regression](combined-backend-tests.txt) passes all 41 nested scenarios across #378–#381: eight access/recovery, sixteen Service/Finance download, nine identity recovery and eight approved-correction checks (13 outer runner tests including wrappers/parents), about 259 seconds. It runs at `ffbe9a8`, whose existing runtime and four exercised regression files match combined branch `f4ade08` exactly. Merge and actual-main verification are still in progress at this checkpoint. No complete local unit/database/browser sweep or application rebuild is claimed for this test/evidence contribution. The earlier evidence directories retain their original source-specific observations.

The [read-only branch-protection snapshot](branch-protection.json) shows admin enforcement, no required approving review, and seven required contexts: documentation foundation; CRM desktop/mobile interaction; CRM header/board visuals; compiled desktop/mobile browser suite; E1 manual estimate/output/restart; Email Calendar journey/permissions; and the aggregate P01–P11/CRM application/PostgreSQL proof. Strict up-to-date status is disabled. No protection setting was changed; source self-review is not independent reviewer or owner acceptance.

## Reproduction and limits

Windows, Node 24.21.0, npm 11.19.0, PostgreSQL 16.15 and the existing Chrome renderer. Only this session's disposable loopback cluster is used: initially port 55923, then port 55924 for the final exact-tuple check after Windows reused the stopped server's old port for another connection; credentials and generated documents remain outside Git. The test refuses databases other than `ppo_synthetic_test` and resets that database before its joined procedure. It is discovered by the existing database wildcard and Finance lane; no workflow configuration changes.

```sh
node --env-file=/absolute/private/proof.env --conditions=react-server --import tsx --test --test-concurrency=1 --test-timeout=120000 tests/database/finance-same-name-mapping.test.ts
```

No new UI, capability, permanent grant, seed, migration, dependency or runtime code is introduced. Live MYOB posting, operational billing/account policy, external verification, hosted deployment, browser selection and actual participant acceptance remain outside this execution.
