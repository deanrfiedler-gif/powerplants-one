# PR backlog integration verification

Date: 19 October 2026. Owner: Dean Fiedler. Review: pending.

[PR #598](https://github.com/deanrfiedler-gif/powerplants-one/pull/598) combines the substantive open PR heads. Its first full validation found a shared-header regression against the accepted [R9 search-centre rule](../../../decisions/shell-top-bar-amendment.md). This record is synthetic component and CI evidence, not business acceptance or deployment.

## Reproduction and cause

The E1 browser job in [run 39132506230](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/39132506230) failed the ES-02 wizard's shared header assertion. At 1280 px with the expanded rail, the search centre was 23.1953125 px left of the header centre. The extra Conversations action together with the developer workspace made the right grid column wider than the left.

Compared the real components/styles from unchanged main `01daa7ad9d187914ce3f7f469a69b5afadc98081` with integration `5f33e1f961dd43bfccd0ee557b065a2506b7b3c8`, using the same synthetic CRM component harness and local Chrome 155.0.8059.84. Main's fixture enabled the existing development flag; the integrated fixture additionally enabled the new Conversations permission and a synthetic unread count of three. Runtime source on the baseline was unchanged.

| Width / expanded rail | Main search offset | Integrated offset before fix |
| --- | ---: | ---: |
| 1440 px | 0 px | 0 px |
| 1366 px | 0 px | -8.234375 px |
| 1280 px | -0.0078125 px | -23.1953125 px |

The component harness previously omitted both settings. It now exposes them as query options and tests both rail states at 960–1920 px, including the 1200 px builder boundary and 1280/1366 px regression cases. Above 1200 px, CSS caps the search to the header width after reserving the full right-control width on both sides. Existing assertions and tolerances are retained.

At 800 px with the rail expanded, both baseline and integration have a 560 px header whose minimum columns and gaps require 592 px. That pre-existing overflow remains outside this correction; existing coverage still checks 800 px with the compact rail. Owner/device review remains pending.

## Validation

Local presentation suite: 46 passed and 38 intentionally skipped across the desktop, phone and narrow-phone projects, including all six desktop shell cases. TypeScript, focused ESLint and the development register pass. The register retains 336 unreviewed and 28 stale entries. The corrected 1280 px expanded-rail screenshot was inspected for control visibility, centred search and overlap. Full combined CI results are recorded in the integration PR; no source reference capture or owner review fingerprint is changed by this repair.
