---
title: Sites CS-04 implementation and short references
date: 2026-10-20
---

The [Sites implementation](../delivery/sites-cs04-build.md) continues the preflight-only PR #626 in draft PR #635. It refines `/sites` and `/sites/[id]` around the accepted Sites register/record, with permission-scoped view counts, source summaries, installed/served equipment, current compact phone controls and explicit loading/empty/error/restricted states. Dean approved the shorter Site reference convention on 20 October. Its [reference decision](../decisions/site-reference-convention.md) preserves immutable previous references and UUID links; both spellings are searchable. No migration or new capability is needed.

The CS-04 scope and both routes have updated contracts, Draft guides and shared-component consumer bindings. P4 customer readiness confirmation remains unavailable and links to CS-06. Exact verification results are tracked in the build record; owner visual review, business acceptance and deployment remain pending and separate.

<!-- decision-index -->
[Short synthetic Site references](../decisions/site-reference-convention.md) (PPO-SITE-REFERENCE-DEC) records Dean's shorter convention with previous-reference compatibility and no storage renumbering.
