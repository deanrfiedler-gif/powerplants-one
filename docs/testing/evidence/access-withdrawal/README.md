# AD-01 request withdrawal evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: verification in progress; CI, security, visual/owner acceptance and deployment separate.

[Contract](../../../decisions/access-request-withdrawal.md). Branch `codex/ad01-request-withdrawal` starts at PR #417 `2e69c4caad0dbdaa5f298d62d1b41fb03e40f7c3`. Initial stack inspection found no reviews or comments, no #417 failures and still-running CI. Parent failures match the permission-matrix and preserved-ledger corrections already in #417; their earlier evidence remains unchanged.

The first local database run reached its 120-second limit preparing the populated 0080 fixture, before request identities or withdrawal assertions. Its dependent cases could not run correctly. The original failure is retained, not counted as a passing check. An isolated replay uses the same limit. Credentials, private configuration and raw job outputs stay outside Git. Database tests use only `ppo_synthetic_test`; browser work uses the separate disposable `ppo_synthetic`.

Accepted native desktop/mobile images, physical-device, zoom, screen-reader, independent security and owner review remain open. Teams, campaigns, installed-grant revocation/editing and operational D-020 remain open. No issued reference bytes, parent IDs, hosted grant authority, external integration or deployment are changed.
