# Job Pack I5 integration evidence

Owner: Dean Fiedler. Captured/inspected by Codex on 24 September 2026. Based on I7 `aed0c00`; this committing change contains I5 source. Chrome 154.0.8037.58 and Playwright 1.63.0. [Capture metadata](capture-metadata.json) records source hashes and viewport facts. Synthetic local coordinator session and the retained `tests/fixtures/job-pack-read.json` read; images imply no persisted Save. The independent baseline comparison uses an actual permitted persisted pack.

## Checks

- Actual-component suite: two passed, four deliberate duplicate-project skips; all six widths and print from Preparation.
- Compiled I4/I6/I7/I5, Field Technicians and shared-shell suite: 46 passed, seven deliberate skips (includes warm-up). After the print-header correction, the focused compiled suite passed six including warm-up, with one duplicate viewport skip.
- Safe print-content escaping regression passed. Typecheck, changed-file lint, production build, studio, foundation and naming checks passed.
- [Independent baseline evidence](baseline-evidence.json): accepted r03 hash/bytes, no reference overflow or console errors, all 41 application tokens present and identical for a permitted persisted pack. This is token comparison, not business acceptance.

## Paired inspection

`application-{1440,1024,820,770,390,320}.png` and `reference-{1440,1024,820,770,390,320}.png` retain paired viewport views. Heights: 960, 768, 800, 900, 844 and 800 CSS px; DPR 1. `preparation-{1440,390,320}.png` retains the preparation action treatment. These are viewport captures, not claims that a long phone document fits one screen.

Inspected the 1440 application/reference pair, 1024 and 770 application views, 320 application/reference pair, 390 preparation view and 200% reflow capture. Typography, paper/rail structure and shared token values follow r03. The shell, exact saved data, server readiness stages, staff provenance, prior output and immutable successor controls are the adopted adaptations. The long title and references wrap; the mobile action bar stays above the fixed navigation. Phone utility controls remain within the header after correction of the legacy identity-dependent grid. The separate CRM phone filter row remains explicit, with existing shell regressions passing.

`application-zoom-200-reflow.png` uses the effective 720 × 480 CSS viewport with DPR 2 for a 1440 × 960 display at 200%. This is browser-zoom reflow emulation, not physical browser UI/device certification. CSS zoom was discarded as a proof method because it does not rerun viewport media queries. Keyboard tab activation remains reachable in the zoom viewport. Existing source/print tests retain dialog trap/return, unchanged replay and stale draft recovery.

## A4 print

[saved-workbench-a4.pdf](saved-workbench-a4.pdf) is the final compiled browser print, made with Preparation selected and an unsaved sentinel. [Print inspection](print-inspection.json) verifies five A4 pages, reference/revision/NOT ISSUED and page count on every page, absent unsaved text/badge, and the final completion section. Inspected rendered first, second and final pages through the retained `a4-page-1.png`, `a4-page-2.png` and `a4-page-5.png`. Initial fixed-header pagination failed visual inspection and was replaced with safely CSS-escaped margin content. Workbench warning remains explicit; no controlled issue is generated or replaced by this copy.

## Source captures and remaining review

Five fresh r03 captures at 1900 × 1080 CSS px/DPR 1 are retained under `docs/reference/ui/job-pack/powerplants-one-job-pack-r03-desktop-01.png` through `-05.png` with hashes in the source manifest. They cover the header/section 01, 02–03, 04–05, 06–08 and 08–09 regions. Inspected the ending sections capture. The original five uploaded images cited in report Appendix E are unavailable; these new captures are explicitly not those historical uploads and are not application evidence. The issued HTML remains unchanged.

[token-comparison.html](token-comparison.html) and its PNG retain the three unresolved Field Technicians r05/r03 shared-core differences. Values remain unchanged for a separate owner decision. Source presence, implementation, functional checks and this limited visual inspection do not establish owner acceptance, physical device/screen-reader review or deployment.
