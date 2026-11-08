---
title: Library filter focus waits for the options reload
date: 2026-11-08
---

[Draft PR #871](https://github.com/deanrfiedler-gif/powerplants-one/pull/871)
adds an enabled-select wait and an exact count of one synthetic customer option
before the existing focus and selection in the
[document library filter test](../../tests/browser/library-workspace.spec.ts).
The More choices action changes the options query; the
[LibraryChoice control](../../src/components/library-choice.tsx) disables its
select during that reload, so focus must follow the reload. Existing assertions,
timeouts and application code are unchanged.

A search of `tests/browser/` found no other instance of focusing a LibraryChoice
select immediately after an action changes its query. The nearby Type select
has static options and is not a LibraryChoice control.

Cloud setup completed with Node 24.21.0, npm 11.19.0 and the disposable
`ppo_synthetic_test` database ready, but reported the browser unavailable.
The browser launch check confirms Chrome is absent at
`/opt/google/chrome/chrome`; local browser tests are not run and are left to
GitHub CI. The same launch failure occurs on unmodified main. Focused ESLint,
TypeScript checking, foundation, prototype, naming, status-source and migration
checks, all 44 documentation tests and whitespace validation pass. Removing
the eight added test lines restores the exact current-main test bytes.
Claude's one draft-head review and the full ready-head results,
including this test's duration in both desktop-2 lanes, remain pending.
This test-only delivery does not record business acceptance or deployment.
