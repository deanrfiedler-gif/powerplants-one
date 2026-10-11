# AD-01 request withdrawal evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: local verification in progress; CI, independent security, visual/owner acceptance and deployment separate.

[Contract](../../../decisions/access-request-withdrawal.md). [Draft PR #423](https://github.com/deanrfiedler-gif/powerplants-one/pull/423), branch `codex/ad01-request-withdrawal`, starts at PR #417 `2e69c4caad0dbdaa5f298d62d1b41fb03e40f7c3`. Initial stack inspection found no reviews/comments and no #417 failures, with CI still running. Earlier parent failures matched corrections already in #417. The parent subsequently advanced to `8800193ba9551ac3562dfce230568ff426464cfc`; merge `e71e93507f8e29082ac4a84e2cdbcfb4be4f6a79` incorporates its repaired stack and accepted design records. LC-12/LC-13 keep the parent's original-ledger boundary plus exact added version 0081. This task does not own parent integration or deployment.

## Scope and sources

Only the original requester with current local Workspace read/propose duties can withdraw an un-applied Submitted or Approved version. Closure retains proposal/approval, adds exact audit/receipt evidence and releases the pending tuple. It changes no grant or identity; a fresh proposal needs its own dates and independent decision. Migration 0081 has no seed. The hosted upgrade gate was reviewed for this schema-only closure; hosted commands remain refused.

Database source: `1e4eec78a983be30cecf6a7217f84565bc752570`. UI reason-control correction: `257af99`; integrated runtime/capture source: `e71e935`. Later documentation and test corrections retain their own Git history. Private configuration, credentials, application logs and raw job output stay outside Git. Database suites use only `ppo_synthetic_test`; browser fixtures use separate disposable `ppo_synthetic` on loopback. Assertions and normal connection/SQL timeouts are unchanged.

## Preserved failures and corrections

The first two withdrawal runs reached the new populated-0080 fixture's 120-second limit before request identities or withdrawal assertions; dependent cases then lacked those identities. Neither run is a pass. The fixture now declares a 300-second setup/test ceiling; the successful third run actually completes all nine checks in 87.6 seconds. It proves exact users/grants/audit/operations and historical ledgers, repeat migration/seeding, both source states, actor/current-duty restrictions, immutable evidence, races, rollback and original recovery. The separate unmodified-main `ba1f4e3` fresh-installation probe passes one check; this is a baseline observation, not proof of the timeout's cause.

The first existing request-suite run passes 12 checks but fails two after a database connection timeout in its direct-evidence guard check and final snapshot. FI-07's selected historical case also reaches the unchanged 120-second limit. Original logs remain retained and isolated replay results are recorded separately; no failure is erased or recast as a first-run success.

The first browser block's new reason-focus assertion assumes direct field focus. The actual shared control first focuses the error summary and offers a field link. The corrected test follows that link, then verifies the withdrawal field receives focus, alone has the error, and the independent application reason remains unchanged. Runtime focus behaviour is not changed to satisfy the assertion.

## Design and remaining work

The native closure deliberately differs from the retained simulated Draft/Submitted/Returned administrator workflow: it closes Submitted/Approved requests for their original requester only. Secondary action/neutral closed status and separate record forms remain exposed adaptations. The existing page is refined in the running app under ADR-0053; no new Figma page or accepted design is asserted.

Accepted native desktop/mobile mockup images, physical-device, zoom, screen-reader, independent security and owner review remain open. Teams, campaigns, installed-grant revocation/editing and operational D-020 remain open. All 78 parent IDs and issued reference bytes remain unchanged relative to the receiving parent. No hosted grant authority, external integration or deployment is added.
