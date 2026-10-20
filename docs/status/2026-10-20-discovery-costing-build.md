---
title: Discovery costing ES-02 implementation
date: 2026-10-20
---

Dean requested implementation of the accepted Discovery costing design at `/estimating/discovery/[id]/costing`. The dedicated `codex/discovery-costing-es02` branch claims the page component, page-local presentation and tests, its shell route binding, and the corresponding design register, guide and generated status/build-sequence entries. The source is the [accepted design decision](../decisions/discovery-costing-figma-design.md), Figma file "PPO - Design", page `1431:809`, named version "Discovery costing — accepted".

The implementation composes the saved discovery comparison, manual proposal grid/cards, source/date links, summary delta, review/adopt dialog and stale/pending/uncertain/legacy/permission states around the existing costing commands. The page contract, guide and shared-component consumer bindings are maintained in the same change. First costing without a saved estimate retains its existing screen. Native commands, validation, arithmetic, permissions and schema are unchanged.

[Execution evidence](../testing/evidence/discovery-costing/README.md) distinguishes browser fixtures from database proof and records local Windows limits. [PR #631](https://github.com/deanrfiedler-gif/powerplants-one/pull/631) is the review vehicle. Owner visual review is pending; code delivery, functional proof and deployment remain separate. The undrawn editor, unavailable Cost types and workspace tab handovers remain explicit review items in the page contract.
