# AD-01 capability catalogue evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Status: verification in progress; owner visual, device and operational acceptance separate.

## Scope and source

This continuation of [native access inspection](../../../decisions/access-review-native.md) adds the capability catalogue, filtered grant holders and explicit person-explanation context. Base: `7ef617f949c82a69e758058f9dac51507712ef17` on PR #410. Branch: `codex/ad01-capability-catalogue`. The first increment remains a separate prerequisite PR; this record covers the incremental catalogue work.

The catalogue is exhaustive against the 132-key server Capability union. It does not adopt role bundles, teams, access-changing commands, campaign cadence or D-020 operational policy. There is no migration, seed, capability/grant change, hosted provisioning or deployment.

## Verification record

Final command results, source and capture evidence will be recorded here after execution. Tests extend `tests/database/access-inspection.test.ts` and `tests/browser/access-inspection.spec.ts`, which run in the existing application assurance suites.

The first local database attempt failed in the new pagination fixture because one SQL parameter was inferred as both UUID and text. Explicit casts correct the fixture. Its test was also ordered after the existing hosted-identity fixture setup. No passing result is inferred from the failed attempt. PostgreSQL initially could not bind the former local port; the task-owned disposable instance uses another loopback port. Environment files remain outside the repository.

## Design boundary

The retained AD-01 capabilities view combines the catalogue with proposed roles/teams and an inspector. Native catalogue/detail routes use existing cards and controls, and show only real grants. This is a proposed adaptation; accepted native mockup images are missing. Source presence, automated functional proof, paired visual observation, owner/device/zoom/screen-reader acceptance and deployment remain separate. No review fingerprint is assigned by implementation.
