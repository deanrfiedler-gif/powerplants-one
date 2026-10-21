---
title: Conversations T2b: Carl's assistant core
date: 2026-10-20
---

The [T2b contract](../contracts/conversations-t2b.md) records Carl's assistant core: migration 0110 and seed 110, the scoped ask capability, bounded participant-readable evidence, a US$30 reservation ledger, immutable answers drawn per reader, and the deterministic simulated adapter called by the document worker. The [design](../decisions/conversations-t2b-design.md) retains Dean's accepted P1 to P4 and adds implementation notes. The [scope](../decisions/conversations-t2-scope.md) governs.

The implementation includes database proofs for concurrent turns and budget reservations, access loss and one rebuild, token/call/deadline limits, interrupted leases, citation and hostile-text refusal, content-free audit records, migration preservation and grant derivation. [Draft PR #642](https://github.com/deanrfiedler-gif/powerplants-one/pull/642) records exact check results and the confirmed Windows unit baseline failures Dean authorised recording. Browser and design-baseline CI checks remain separate from local validation.

Carl remains off by default and runs only in the full local synthetic environment. This slice adds no UI, route, live provider, dependency, paid request, hosted grant, reminder schedule, Figma edit or deployment. The required cross-model review has not happened. Dean's acceptance and production readiness remain separate. T2c, the W3 Figma chip correction before its lock-in captures, T2d's adapter and ADR, and the reply-by reminder decision still need Dean's direction.

<!-- decision-index -->
[Conversations T2b design](../decisions/conversations-t2b-design.md) (PPO-CONV-T2B-DESIGN) now has implementation notes for the simulated core, governed by the accepted T2 scope and P1 to P4. The [contract](../contracts/conversations-t2b.md) records the delivered service boundary; cross-model review and owner acceptance remain pending.
