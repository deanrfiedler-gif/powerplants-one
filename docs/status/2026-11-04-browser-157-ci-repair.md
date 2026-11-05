---
title: Chrome 157 compatibility repair for CI
date: 2026-11-04
---

Google Chrome stable moved to major 157, and the CI browser installer began supplying `157.0.8103.38`. The reviewed-major guard in `src/platform/browser.ts` then refused it, so every browser-dependent job failed before its tests on the open page builds #801, #802 and #804, and main's next run would fail the same way.

The [browser maintenance record](../decisions/browser-runtime-maintenance.md) extends the ADR-0022 range to Chrome 157 from `157.0.8103.38`, following the 21 October repair for Chrome 156. Earlier floors are kept, earlier 157 builds and major 158 stay refused, and the boundary unit tests cover each case.

Only the browser-policy unit tests ran locally, because this session has no Chrome stable. Real rendering and the browser suites on Chrome 157 are proved by this pull request's own CI. No package dependency, installer, launch flag, permission, migration or deployment changes. After this merges, each open pull request picks up the repair when it next merges main.
