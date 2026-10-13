# Fertigation Figma implementation evidence

Date: 13 October 2026. Scope: EST-02/03/06, the existing record route and native r01 calculation. Initial captured application source: `3b9695d`; its integrated main: `d195e67`. [PR #464](https://github.com/deanrfiedler-gif/powerplants-one/pull/464) carries the implementation and current-head CI.

The [accepted Figma design](../../../decisions/fertigation-figma-design.md) and its [retained icon-free frames](../../../reference/ui/estimating/fertigation-figma-design-r01/README.md) govern appearance. Private Figma screenshots and design context were inspected alongside the compiled application. Issued reference bytes are unchanged. Owner visual acceptance of the implementation remains pending.

## Initial compiled visual evidence

The initial captured optimized build is `9AjgbmtBEUnmYEoTiP5Il`, served by the compiled local launcher against a disposable PostgreSQL 16 database named `ppo_synthetic_test`. Chromium 153.0.8010.12 captured desktop 1440 × 1000 and phone 390 × 844. The fixture is `remapScope(boardReferenceScope(), scopeId).proposal`, saved through the real CRM, Discovery and fertigation APIs; every child identity belongs to its new synthetic scope. No operational record or manufacturer authority is implied.

[manifest.json](manifest.json) records the source, build, timestamp, exact image hashes and dimensions; [geometry.json](geometry.json) records all nine desktop views with no document overflow. The two desktop rails measure 240 px each, the shell header 64 px and the content origin 480 px. All nine desktop views, the History window and the three phone compositions were visually inspected. Corrections include the overview order, phone context, filter toolbar, modal focus, row actions, pastel charts and non-overlapping timeline captions.

| State | Compiled application capture |
|---|---|
| Desktop Overview | [desktop-overview.png](desktop-overview.png) |
| Desktop Growing areas | [desktop-growing.png](desktop-growing.png) |
| Desktop Water and hydraulics | [desktop-water.png](desktop-water.png) |
| Desktop Scope review | [desktop-review.png](desktop-review.png) |
| Desktop History | [desktop-history.png](desktop-history.png) |
| Phone Overview | [phone-overview.png](phone-overview.png) |
| Phone section sheet | [phone-sections.png](phone-sections.png) |
| Phone Growing areas | [phone-growing.png](phone-growing.png) |

These public images hide semantic icon elements with visibility-only CSS, retaining their space. No layout override was injected for these final captures. The private local comparison used the existing owned SVG fallback because no hosted Font Awesome Kit was configured locally. Licensed Pro artwork and private Figma URLs are excluded. Earlier iterative screenshots that injected a working stylesheet are not included as compiled evidence.

## Executed checks

- All 125 targeted fertigation unit cases passed. The calculation/revision backend is unchanged.
- Final optimized build, TypeScript, targeted ESLint and `git diff --check` passed.
- `npm run studio:check` passed: 358 pages, 44 components, 21 runnable components, no integrity errors. Its 330 unreviewed pages, 28 stale reviews and 44 pending component reviews remain visible.
- Foundation assurance passed with all 22 issued sources and 78 parent IDs; naming assurance passed, including the project instruction length limit. These are documentation checks, not business acceptance.
- The first complete compiled browser run passed 18 of 20 cases (all ten desktop cases and eight phone cases). FN-T61 phone exceeded its original five-second saved-status deadline while the local trace recorded a 16.8-second detail refresh. FN-T07 phone exposed a test helper that checked visibility before the register loaded; the helper now waits for its phone filter control using the existing deadline. Both failures are retained as failures of that run.
- Final compiled replay of FN-T61, FN-T07 and FN-T118 passed all six desktop/phone cases on application source `3b9695d`. Together with the complete run above, all 20 scenarios have passing execution; this is not claimed as one clean full-suite run. No timeout, assertion or server ownership constraint was weakened.

FN-T118 exercises all nine destinations, desktop geometry and breadcrumbs, phone section focus/Escape and touch targets, row menu/editor equivalence, History, document overflow and unchanged saved proposal. Existing browser cases retain native create/edit/save, exact clean-context reopen, 1,000-valve responsiveness, import/placement/declarations, conflict resolution, history recovery and receiving effects. Closing an editor intentionally retains its entries; navigation tests explicitly discard those entries before leaving.

Initial CI on `2e98c28` passed the E1 static, unit and PostgreSQL lane. Its browser failures identified moved-control selectors, phone recalculation/trace access and reused fixture allocation identities; those were corrected. The intermediate `6b27131` documentation failure was the 8,000-character instruction limit after merging main; the maintained instructions now contain 7,997 characters. Current-head CI is the merge gate; earlier passes do not certify a later source.

## Shared shell integration

Integration source `a3bde50` includes main `ad9f2eb` and its shared Shell v2 rollout (PR #459). The workbench now reuses the global primary rail and phone navigation, retaining only its module-specific header/menu/interior rules. FN-T61 accepts the actual desktop Show menu trigger when the wider primary rail selects the Discovery drawer; persistence assertions and deadlines are unchanged.

The combined optimized build `LnVYfbmxBnGnHtTUE2xGP` and its TypeScript stage pass. The combined design register passes with the same coverage/review counts above. Foundation assurance passes with 22 issued sources, 78 parent IDs, 9,248 checked links and 5,788 marker-scanned files; naming passes with 598 document records and 7,998 project-instruction characters. The earlier `28b7fa7` E1 database/browser workflow completed successfully before this integration. Fresh combined-source browser, visual and CI outcomes are recorded in PR #464; the retained images above certify their stated earlier source only. No owner review fingerprint is adopted.

### Final compiled composition

Application source `7b6e1d4` finishes the flush phone valve register. Optimized build `fVlODTztNqgpmdNSSwv3Y`, its TypeScript stage and the design register pass. The fresh [combined-source manifest](shared-shell/manifest.json) records eight icon-free captures, source hashes and runtime identity; [geometry](shared-shell/geometry.json) covers all nine desktop views with no document overflow. The shared rails remain 240 px each and the shell header 64 px. The same synthetic fixture and visibility-only icon treatment described above apply.

Representative combined captures: [Overview](shared-shell/public/desktop-overview.png), [Growing areas](shared-shell/public/desktop-growing.png), [Water](shared-shell/public/desktop-water.png), [Scope review](shared-shell/public/desktop-review.png), [History](shared-shell/public/desktop-history.png), [phone Overview](shared-shell/public/phone-overview.png), [phone valve register](shared-shell/public/phone-growing.png) and [phone section sheet](shared-shell/public/phone-sections.png). The fresh comparison confirms shared-shell containment and the corrected phone register edges; this remains agent comparison, not owner acceptance.

The first combined browser attempt exposed an ambiguous FN-T61 selector matching both Show menu and Expand Estimating menu; that run was stopped after three passing cases and this failure. The selector now chooses the header Show menu / phone Estimating menu button. The native route, assertions and deadlines are unchanged. The full corrected desktop/phone run and final-head CI outcomes are recorded in PR #464, separately from the earlier source-pinned runs.

## Delivery boundaries

The shared account and Page guide controls remain accessible on the phone; navigation follows the signed-in identity's real permissions. Seven phone views have no separate accepted Figma frame, and physical-device/screen-reader acceptance has not been performed. Q8 system SVG export and device-to-channel allocation remain open. No accepted review fingerprint is inferred from these captures.

Hosted deployment and invited-account verification are recorded separately from local implementation and owner visual acceptance. The module adds no migration, seed, capability, dependency or external integration. A release containing newer main changes must use the existing guarded demo workflow and its reviewed database upgrade path.
