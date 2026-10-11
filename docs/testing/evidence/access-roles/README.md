# AD-01 proposed-role comparison evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: verification in progress; owner acceptance and deployment separate.

## Scope and source

[Native decision](../../../decisions/access-review-native.md#proposed-role-comparison-continuation--11-october-2026). Branch codex/ad01-role-comparison; prerequisite PR #413 at 27863308e52fb35a78f34f43eb051194c34b06ba. Main ba1f4e3 is integrated. Seven retained business/approval proposals are inspected and compared against current scoped grants. Operator-owned hosted provisioning, team membership, role assignment, access-changing commands and campaigns remain outside this increment.

## Verification

The source-fidelity and route-title unit checks pass. The complete AD-01 database suite passes all 22 checks on disposable ppo_synthetic_test, including authority, expiry, scope/working-company narrowing, masking and unchanged grants/users/audit/session/working-company state. Compiled build/browser and documentation assurance results will be recorded after execution.

## Design and limits

The retained catalogue/person inspector is adapted into native Register / worklist and Record detail pages with shared controls. This is a proposed adaptation; accepted native mockup images are missing. Functional proof, implementer visual observations, owner/device/zoom/screen-reader acceptance and deployment are separate. No accepted review fingerprint is created. D-020 operational roles remain open.
