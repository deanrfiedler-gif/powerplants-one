---
title: My Work overview candidate cost follow-up
date: 2026-11-10
---

Codex claims the bounded My Work overview performance follow-up to the
[visibility plan audit](../testing/evidence/visibility-plan-audit/README.md).
Dean authorised the recommendation in chat on 10 November 2026. The branch
`codex/my-work-overview-candidate-cost` starts from main `df87f8ba6`.

Scope: the overview's main activity-window query in
`src/activities/work-overview.ts`, dedicated frozen-main comparison and query-plan
tests/helpers, the existing audit evidence chapter and this status fragment.
Preserve visibility, linked-record selection, returned fields, ordering, counts,
filters and the default eight-row window. Other My Work readers and B2/B3 billing
work remain separate. No migration, capability, grant, dependency, timeout or
workflow change is planned. Implementation and validation are pending.
