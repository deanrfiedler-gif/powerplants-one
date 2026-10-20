---
title: Changes and follow-up PL-04 implementation claimed
date: 2026-10-21
---

Codex is implementing the [owner-accepted PL-04 design](../decisions/changes-follow-up-figma-design.md) on a dedicated branch and worktree. The claim covers `/schedule/changes` and the temporary comparison on `/schedule/policy-impact`, their page-local components and permitted reads, focused tests, and the matching design register, component bindings and guides. The existing policy publication controls remain in scope only for preserving access to their current workflow.

The build will reuse the shell secondary menu and compact phone header, shared register table, buttons, record tabs and existing booking commands. Synthetic fixtures will exercise period/site counts, exact-appointment handovers, stale requests, permission and read states, and desktop/tablet/390/320 layouts. P4 site readiness remains gated and Conversations is excluded. No migration, new capability or dependency is proposed. Verification is pending; owner visual review, business acceptance and deployment remain separate.
