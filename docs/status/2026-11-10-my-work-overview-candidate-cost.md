---
title: My Work overview candidate cost follow-up
date: 2026-11-10
---
Codex owns [PR #887](https://github.com/deanrfiedler-gif/powerplants-one/pull/887),
branch `codex/my-work-overview-candidate-cost`, from main `df87f8ba6`. Dean
authorised the bounded recommendation in chat on 10 November 2026.

The overview now materialises its permitted ordered window before optional display
joins. Visibility, owner membership, link priority, filters, ordering, counts and
the default eight rows are preserved. The shared row builder and other readers
are unchanged. B2/B3 billing work remains separate.

The [audit evidence](../testing/evidence/visibility-plan-audit/README.md#my-work-overview-window-fence--10-november-2026)
records maximum loops of 960 → 32 and 2,115 → 47 at native fixture volumes 30/45,
both below the unchanged 80-loop bound. Frozen-main comparison, 24 equivalence
tests, the plan test and seven existing My Work database regressions pass against
disposable synthetic data. No migration, permission definition, grant definition,
index, dependency, planner setting or timeout changes.

Application checks and exact-head CI are recorded on the PR. Local browser tests
are unavailable per cloud setup. Independent Claude review and full ready-head CI
remain outstanding; the PR stays draft. This is code delivery evidence, not merge,
deployment, business acceptance or production readiness.
