# AD-01 native access inspection evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Date: 11 October 2026 (Australia/Brisbane). Branch: codex/ad01-access-review, baseline 0e10459. Scope decision: [native inspection](../../../decisions/access-review-native.md).

## Execution

Validation in progress. Do not infer a pass from implementation or from earlier design checks.

The initial focused run passed the ordinary-identity denials, exact company/site explanation, inactivity/expiry, reviewer revocation, working-company narrowing and unchanged-row read checks. Upgrade reset hit the isolated cluster's default lock limit; configured max_locks_per_transaction=512 and restarted that task-owned cluster. Hosted masking fixture initially lacked the hosted-only identity migration; the corrected test installs the actual retained migration before its fictional hosted row. These are setup corrections, not runtime changes.

## Review boundary

First read-only AD-01 increment. Roles, teams, mutations, campaign attestations and operational D-020 authority remain open. No hosted deployment, independent review, owner acceptance or physical-device/screen-reader review is claimed. Exact synthetic reference/application captures, where retained below, prove only the inspected states.
