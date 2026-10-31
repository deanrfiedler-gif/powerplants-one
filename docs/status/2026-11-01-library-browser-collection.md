---
title: Isolate native library browser discovery
date: 2026-11-01
---

Codex corrects High finding 1 on [#706](https://github.com/deanrfiedler-gif/powerplants-one/pull/706) by moving the native spec into `tests/library-browser` and pointing its existing dedicated configuration there. Ordinary browser discovery no longer imports the environment-dependent native fixture. The disposable database guard runs before fixture setup; all three journey bodies and assertions remain unchanged.

The [evidence note](../testing/evidence/document-library/workspace/README.md#native-test-collection-isolation--1-november-2026) records isolation and preserves historical capture provenance. Exact-head Claude review, CI and native runtime proof remain pending; no acceptance, merge or deployment.
