---
title: Isolate native library browser discovery
date: 2026-11-01
---

Codex corrects High finding 1 on [#706](https://github.com/deanrfiedler-gif/powerplants-one/pull/706) by moving the native spec into `tests/library-browser` and pointing its existing dedicated configuration there. Ordinary browser discovery no longer imports the environment-dependent native fixture. The disposable database guard runs before fixture setup; all three journey bodies and assertions remain unchanged.

The [evidence note](../testing/evidence/document-library/workspace/README.md#native-test-collection-isolation--1-november-2026) records isolation and preserves historical capture provenance. Exact-head Claude review, CI and native runtime proof remain pending; no acceptance, merge or deployment.

Claude’s [review of the collection change](https://github.com/deanrfiedler-gif/powerplants-one/pull/814#pullrequestreview-5725028721) verified isolation and found that the moved spec fell outside fixture-date maintenance. The follow-up adds `tests/library-browser/**/*.ts` to the existing date-shift glob, retaining ADR-0030’s whole-week/future-only transformation and migration/unit exclusions. A direct selection-and-transform check verifies the native due date is selected exactly once, shifts by seven days, and retains its weekday; no fixture dates are rewritten. The full report command cannot run on this runner’s Python 3.12 because the existing `Path.read_text(newline=...)` call requires a newer Python. Fresh exact-head review and native execution remain pending.
