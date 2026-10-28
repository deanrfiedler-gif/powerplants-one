---
title: P05 appointment phone-menu readiness correction
date: 2026-10-28
---

Dean authorised this investigation on 28 October 2026. This Codex session owns [draft PR #733](https://github.com/deanrfiedler-gif/powerplants-one/pull/733), branch `codex/p05-phone-menu-readiness`, based on main `f2e6932a44ee68708e1e5babee8978f5d8a0b32f`. No existing pull request was merged.

The P05 journey now waits for the rendered appointment and its phone record header before the second identity switch. The identity read alone can finish while the header still has an interim Menu button; the arriving appointment replaces it with Back. See the [shell readiness record](../design/development/systems/shell.md#appointment-loading-test-readiness--28-october-2026). The correction is test synchronisation only, with no application, permission, dependency or timeout change. A controlled browser regression holds the appointment read and tests that replacement, then single Account activation, keyboard opening and focus return at 390/320 px.

Evidence inspected:
- [PR #729 failure](https://github.com/deanrfiedler-gif/powerplants-one/pull/729#issuecomment-6455766756), source `3765e19501f41d2f912836d7dea9454473c48871`, run `40581551757`, job `122464315863`, retained artifact `12777593712`.
- [PR #718 failure](https://github.com/deanrfiedler-gif/powerplants-one/pull/718#issuecomment-6457381918), source `2b310a6cfadc9f6a001e3e1f77bbb33181a98495`, run `40603005346`, retained artifact `12782093137` (executed checkout `ee372736524daae1c88d7016a9892f5e64f789eb`, tree `7ded4f6398de065dcab7908c1935ba45371e3052`).
- Both page snapshots show the same seeded appointment and final record header, without More. The #718 transport diagnostics around 23:58:11 UTC show shell requests `16222` and `16230` complete successfully in 7.7 and 19.6 ms. A long server read is not demonstrated.
- Both upload manifests exclude raw trace ZIPs. The screenshots, snapshots and server logs cannot identify the precise lost pointer sequence. The source-supported replacement mechanism must be distinguished from historically proven attribution. The hydration hypothesis in #718 is not established by these artifacts.

Local validation: Node 24.22.1 / npm 11.9.0 (npm differs from the repository pin of 11.19.0; the lockfile is unchanged); unmodified main build and all 1,167 unit tests passed. Changed tests passed TypeScript and focused ESLint checks. `studio:check` reported no errors and 26 pre-existing stale reviews; status-source validation passed. Browser execution is not yet verified: the local Chrome process is blocked by the execution sandbox's local-socket restriction, and policy rejected escalation. PostgreSQL is not running locally; no database/HTTP proof is claimed. CI results will be recorded separately. Owner/device acceptance and any other phone-menu failure mechanism remain open.
