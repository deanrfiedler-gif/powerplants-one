---
title: Findings review repairs retain filters and snapshot state
date: 2026-11-03
---

PR #801 integrates main `95d7b9e91` through the three resolutions explicitly authorised by Dean: main's phone-header assertion layout plus `back`, and entry-based guide/register resolutions preserving every unrelated main entry and deletion. The result has 356 unique guides and 380 unique register entries. The phone-header `back` declaration appears once. No migration, service API contract, permission, grant, protected instruction, CI or infrastructure change is introduced; #810 remains untouched.

The three findings from [Claude review 5722367067](https://github.com/deanrfiedler-gif/powerplants-one/pull/801#pullrequestreview-5722367067) are addressed. Owner and Site choices use authorised windows without their own filter and retain selected labels during empty and pending reads. Same-query reloads retain the register and selected snapshot tab; a successful next-action reload updates the versioned editor. The URL records and restores the chosen view. Refresh keeps the current window and selection. Existing assertions remain unchanged, with three unit cases and four browser scenarios added.

Executed: foundation, prototype, naming and status checks; studio; full lint/typecheck; all 1,356 units and production build through network-enabled `npm run check`; focused Findings/phone-header units (19/19); and compiled-server Findings HTTP (2/2). Three database cases passed across serial Findings, recurrence and next-action files; eight failed with `RenderOrStorageFailure`, recorded individually as **environment-blocked: browser** because cloud setup reported the browser unavailable. Ten restricted-run unit-file failures reproduced on clean main in this environment; the final network-enabled full unit run passed. [Detailed evidence and test names](../testing/evidence/service-findings/README.md#review-repairs--3-november-2026).

Browser suites, including the four added regressions, are **not run here; left to GitHub CI**. Broader database/HTTP suites and manual/device/acceptance checks are **not run here; left to GitHub CI** where applicable. Claude's one independent review already exists; only confirmation of those findings and the three conflict resolutions is requested. CI and that confirmation remain open. Dean merges; no PR merge or deployment occurred.
