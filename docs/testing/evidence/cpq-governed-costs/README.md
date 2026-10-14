# CPQ governed costs execution evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Synthetic backend verification, 14 October 2026. Scope BC-04/ES-02/ES-03; [decision](../../../decisions/cpq-governed-costs.md) and [API](../../../interfaces/cpq-api.md#governed-cost-and-labour-profile--schema-4). Parent PR #490 corrected source `5ce7a1a`; main `bc9e3fb` retains #489 and migration 0100. No migration/grant/dependency or deployment added.

## Local execution

Verification is in progress. The first 28 focused CPQ unit cases passed, including four new governed-cost cases. Initial database failures were test harness defects: sorting a UNION expression without a wrapping SELECT and attempting an unchanged source successor. Those fixtures were corrected; repeat results are recorded below when complete. A dependency junction was unsuitable for the application builder, so the worktree uses its own unchanged lockfile installation.

## CI, independent review and acceptance

CI and independent review of this contribution are pending. Automated checks do not confer operational approval. Source/rate owners, approved commercial policies, schema-3 combined authoring and UI controls remain separate. No merge, deployment, customer communication or external business transaction.
