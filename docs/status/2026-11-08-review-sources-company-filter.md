---
title: Company-filtered review sources retain Engineering availability
date: 2026-11-08
---

[Draft PR #869](https://github.com/deanrfiedler-gif/powerplants-one/pull/869) adds an internal company-scoped Engineering package-ID pager for review sources. It preserves the public workspace reader and #865's frozen oracle, reuses the existing authority predicates, and applies the 200-package bound within the selected company. The [SH-06/My Work handover](../delivery/sh-platform-handover.md#company-filtered-review-sources--8-november-2026) records the behaviour, refusal boundaries and synthetic authority proofs.

All ten database tests in the new company-filter proof and existing review-source regressions pass on `ppo_synthetic_test` (199.841 seconds, no skips). The filtered fixture has 64 visible packages across two companies, with 12 Engineering tasks in the selected company and one excluded task in the other. The scale proof has 206 visible packages in the other company and five in the selected company; all 12 selected tasks remain present with `bounded: false`. The native refusal seam omits exactly one package access row. Unfiltered DTO/JSON equality passes for five principals.

`npm run check` passes: studio register, full lint, type checking, all 1,437 unit tests and production build. Foundation, prototype, naming, status-source, all 44 documentation tests, migration numbering and whitespace checks also pass. The first typecheck found a conditional-page inference error; unmodified main `e67c9ea8d` passed the same compiler check, and an explicit page type fixes the candidate. The Engineering service diff adds only the pager; the public reader, route, contract, permission code and frozen oracle are byte-for-byte unchanged.

Cloud setup reports PostgreSQL ready and browser unavailable. The browser guard confirms Chrome is absent on both this branch and unmodified main, so browser suites and renderer-dependent database/HTTP proofs are not run locally and are left to GitHub CI. The full database and HTTP suites are also left to CI; local database execution targets this change's authority and regression proofs. Claude's one independent draft-head review and subsequent ready-head full CI remain pending. No merge, business approval or deployment is claimed.
