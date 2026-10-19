---
title: People register implementation and synthetic verification
date: 2026-10-20
---

The accepted CS-02 People register is implemented in the dedicated `codex/accepted-ui-build` worktree: `/people` and the People view of `/contacts`, with the existing Person record receiving the exact handover. Source: **PPO - Design**, page `1395:150275`, named **People — accepted**, register/tablet/phone `1395:150312`, `1395:150835`, `1395:151069`, plus the three register states. The later compact phone amendment removes repeated toolbar rows. The queue-only PR #624 merged before the application change; the application follows in a separate draft PR.

The read-only aggregate uses existing grants and tables for current affiliations, primary sites, latest company/class notice exceptions and correction timestamps. No migration, capability, dependency or operational integration is added. Existing shared menu/grid/modal/button/icon controls are reused, with one optional phone-header composition prop. The old account saved-view directory remains explicitly reachable. The [page contract](../design/development/pages/route-people.md), register, Draft guides and component consumers/fixtures record differences and missing designs.

Two database tests pass against `ppo_synthetic_test`. Browser geometry and state/filter/receiving checks pass in focused runs; final full verification is recorded in the [evidence](../testing/evidence/people-native/README.md). Full unit testing has Windows failures under investigation against unmodified main; no full green claim, owner visual/device review, deployment or business acceptance is made. The [ordered queue](../delivery/accepted-ui-build-plan.md) retains AD-01 blocked on Dean's instruction and separates each next page's prerequisites.
