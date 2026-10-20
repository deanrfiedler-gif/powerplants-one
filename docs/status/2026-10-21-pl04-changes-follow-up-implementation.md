---
title: Changes and follow-up PL-04 application build
date: 2026-10-21
---

The [accepted PL-04 design](../decisions/changes-follow-up-figma-design.md) is implemented at `/schedule/changes` and `/schedule/policy-impact` in delivery draft PR #649. Early claim PR #644 contained only the claim/status entry. The build replaces stacked queue controls with counted side-menu views, a compact visit register, persistent review and responsive phone layouts; a permitted read combines current booking, request/history, job-pack and dispatch evidence. D4 now permits a stale request to reach the fresh booking check while retaining existing version, scope, policy, crew and reservation safeguards.

The register, page contracts, Australian English guides and shared-component consumer bindings are updated. P4 remains gated and unconfirmed; Conversations is excluded. No migration, capability or dependency is added. Six focused browser tests and ten focused unit tests passed. CI passed merged-tree typecheck, register and foundation checks; broader CI proof remains pending. Local database and Turbopack build limits reproduce on unchanged main. [Build evidence](../testing/evidence/changes-follow-up-build/README.md) records checks, captures, differences and remaining verification. Owner visual review, business acceptance, device review and deployment remain pending and separate from code delivery.

<!-- decision-index -->
[Changes and follow-up implementation boundaries](../decisions/changes-follow-up-implementation.md) records the D4 fresh-booking interpretation, permitted consequences read, retained policy workflows and explicit undrawn interactions. It grants no owner visual acceptance or production authority.
