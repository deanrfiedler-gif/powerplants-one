---
title: Rule set storage R2 (ADR-0066)
date: 2026-10-24
---

Build step R2 of [ADR-0066](../decisions/ADR-0066-configuration-rule-sets.md) stores configuration rule sets. Dean asked for it on 24 October 2026: "Yes: start ADR-0066 build step R2, storage and versioning of rule sets, as its own PR."

Migration 0119 adds synthetic rule set roots with a named engineering owner, plus:
- immutable revisions that keep their test result;
- the owner's acceptances of blocking findings;
- independent reviews;
- third-person publications, and heads.

`src/cpq/rule-set-store.ts` and `/api/v1/cpq/rule-sets` implement save, accept, review, publish and the reads, as described in the [rule set definition contract](../contracts/rule-set-definition.md). Triggers enforce the same governance when the service is bypassed. The existing `cpq.*` duties govern, so there is no new capability, grant or seed.

Evidence: five database tests, all passing on a disposable local cluster. They cover the lifecycle, owner acceptance, every governance refusal, the triggers and receipts. Every upgrade suite that pins the migration ledger now includes 0119.

Not done: the Rules studio screens (R3, after the Figma design is accepted), the Excel round trip (R4), ES-08 on rule sets (R5), and the ADR-0066 Q6 authority decision before any real rule set is stored.
