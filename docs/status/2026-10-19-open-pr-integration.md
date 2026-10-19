---
title: Open PR integration and verification
date: 2026-10-19
---

Dean requested review, repair and merging of the open Powerplants One pull requests. [PR #622](https://github.com/deanrfiedler-gif/powerplants-one/pull/622) integrates #606, #609, #610, #615, #616, #617, #619 and #621 in a dedicated worktree, preserving their original commits and resolving shared documentation conflicts. The integration includes the compact phone header and accepted design records, with #619's separate register/index entry files. Source review repaired stale phone action callbacks, and the first combined browser run identified one directory test still using the removed menu button; it now uses the header view chooser. [Evidence](../testing/evidence/open-pr-integration-oct19/README.md) records 31 passing targeted unit tests, a register check with no errors and passing local application/documentation checks. Final-head CI outcomes are retained with the PR checks and must pass before merging. Design acceptance, source presence, application verification and deployment remain separate; no deployment or external business transaction is part of this work.

Conversations T2b #620 was initially excluded as an unfinished implementation claim, then merged separately into main as `f5ca408e` during this work. Its changes contain a migration reservation and design/plan, not the assistant implementation; incorporating that main update does not change this delivery boundary.
