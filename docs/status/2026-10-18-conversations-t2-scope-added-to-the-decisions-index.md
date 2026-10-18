---
title: Conversations T2 scope added to the decisions index
date: 2026-10-18
---

The [T2 scope record](../decisions/conversations-t2-scope.md) (PPO-CONV-T2-SCOPE) landed in main through the combined PR #583 with its register row and a STATUS entry, but without its line in the decisions index, because the PR that carried that line (#580) was closed once its content had landed. This adds the index line only. The record, its rules and Dean's acceptance are unchanged; no code, migration or route changes. Checked with `check_foundation.py`, `check_naming.py`, `check_prototype.py` and `build_status.py --check`; documentation assurance only.

<!-- decision-index -->
[Conversations T2 scope](../decisions/conversations-t2-scope.md) (PPO-CONV-T2-SCOPE) records how `@Carl` answers in threads: five slices T2a–T2e, rules T2-1 to T2-12 and the answers to W1–W9, accepted by Dean on 18 October 2026.
