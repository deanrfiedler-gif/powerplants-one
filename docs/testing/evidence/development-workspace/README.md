# Development workspace — bounded execution evidence

Date: 23 September 2026. Branch: `feat/design-development-workspace`. Baseline: `ccc2251bbba9df266cac9027ddaa9418ab9abc1d`. Native preview: loopback port 3006, synthetic configuration. This evidence describes a working branch, not deployed business acceptance.

## Native browser observations

Inspected through the Codex in-app browser, independently of the blocked standalone r05 file:

- 1440 × 960: register heading, four summary cards, tab/filter controls and three-column page cards were visible. Search `ES-02` returned the correct single scope, including correctly rendered punctuation.
- Entry reader: separate local port-3000 and hosted sign-in-origin links, draft/reference status, guide and desktop/mobile reference controls were present. No external application link was used to claim per-page availability.
- Draft article: thirteen sections rendered. A non-matching search produced the empty-state message. Clicking Before you start cleared the filter and focused that heading. Back returned to the entry; the Markdown reader retrieved the intended ES-02 document with Desktop/Mobile sections.
- Escape closed the reader and returned focus to Open entry; no dialog remained open. The original ES-02 register filter was retained.
- 390 × 844 and 320 × 740: register controls reflowed; the guide used the viewport, long headings wrapped and Close remained visible. At 390 the document scroll width equalled the viewport width. This is a bounded viewport inspection, not physical-device or screen-reader acceptance.
- Theme gallery: actual shared control variants, disabled/busy states and root token values were visible. Selecting 8 px made the sample radius 8 px while the document root stayed 6 px. Primary action announced an example response; Reset returned the selection to the source default.
- Global information icon: the local Development draft guide for this page disclosure loaded the correct Theme & shared controls article with all thirteen sections. Existing shell/application help remained available.

The shell reported unavailable identity context in this isolated environment; business navigation/data and authenticated workflows were not validated. The design catalogue still operated because it uses public repository references behind the local launcher, not business data. Initial page requests showed the existing loading workspace before server content arrived.

## Automated checks

[HTTP results](http-results.json) record seven passing endpoint groups. Five new unit tests cover the local gate, route matching, link validation, coverage, reference containment and source/import invalidation. The complete 337-test suite passed 333 and failed four; the baseline main checkout passed 328 of 332 with the same failures. Two document-store tests enforce private filesystem expectations, the recovery test expects a different path rejection on Windows, and a warm-route test expects forward-slash relative paths. These baseline results do not waive CI or prove another operating system passes.

The standalone r05's [16 DOM groups](../app-page-register-r05/dom-results.json) passed separately, against its exact hash. The browser tool rejected that file URL; no alternate protocol, server or renderer was used to preview it. Native workspace screenshots/observations cannot establish the standalone document's visual quality.

Outstanding: independent visual approval, physical mobile, screen reader, 200% zoom, full operational HELP-01–HELP-14 review and hosted deployment. Final source/check/publication details are in the [handover](../../../delivery/development-workspace-handover.md).
