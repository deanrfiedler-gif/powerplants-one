# Notice accent rule — proposed design-system departure

**Status:** Proposed. Raised for decision; not accepted. No baseline, stylesheet or application screen is changed by this record.
**Owner:** Dean Fiedler.
**Raised:** 23 September 2026, from the field work timer concept review (FI-01, `scope:FI-01`).
**Covers:** [theme style board r22](../reference/ui/theme-style-board/powerplants-one-theme-style-board-r22.html) and [Job Pack r03](../reference/ui/job-pack/powerplants-one-job-pack-r03.html), and every later baseline that reuses their notice pattern.

## Question

Should status notices keep a 3 px coloured left rule, or use an even border with the state carried by tint, icon and words?

## Context

- Job Pack r03 draws notices as `border:1px solid var(--warning-border); border-left:3px solid var(--warning-accent)` on `--warning-tint`. Field work timer r03 and r04 reuse that rule because it is the accepted pattern (r04 change record §4, decision 2).
- Theme board r22 uses the same 3 px left rule for explanatory notes: the selection-states introduction note (navy) and the next-customer-action feedback note (`--focus`).
- In reviewing timer r03, Dean rejected a 4 px coloured top border on the timer panel as a generated-interface convention and asked for a more original, professional treatment. A coloured single-edge rule on a rounded container is the same device on a different edge.
- The field work timer concept (design canvas, not a baseline) was reviewed against theme board r22 on 23 September 2026. Dean directed that it keep notices without the left rule **as a proposed departure** and that the question be raised as a design-system decision covering the board and Job Pack.

Known: the two references above and their exact rules. Assumed: no accepted baseline other than those that copied Job Pack's notice uses a different notice treatment. This was not verified across every baseline in `docs/reference/ui/`.

## Options

| Option | Treatment | Effect |
|---|---|---|
| A. Keep the rule everywhere | Current Job Pack r03 and board r22 treatment | No change. The timer concept reverts to the rule before any baseline is issued |
| B. Remove it everywhere (recommended) | 1 px border in the tone's `--*-border`, `--*-tint` or `--*-surface` fill, the icon in a white disc, bold title and body text | One notice pattern without a single-edge accent. The state is still carried by words, icon and tint. Job Pack and the board need successor revisions |
| C. Scope it | Rule kept for editorial notes on the board; removed for application notices | Two patterns to explain and maintain |

## Recommendation

Option B. The left rule adds no information that the icon, title and tint do not already carry. It is the convention Dean already rejected on the timer panel, and a single rule is easier to keep consistent across modules than a split one. Contrast is unaffected, because the rule is decorative and the text pairs are unchanged. Under forced colours, the r04 approach of a 1 px `CanvasText` border on the notice still applies.

## Out of scope

The Job Pack contents navigation uses `border-left:3px solid transparent`, filled when active. That is a navigation-selection marker, not a notice, and is not affected. Its treatment belongs with the board's selection-states chapter.

## If accepted

1. Record acceptance here with the date and Dean's words.
2. Issue successor revisions, preserving the issued bytes of the originals: Job Pack r04 (notice rule only) and theme board r23 (notes and any notice specimens). Each gets a change record.
3. Update the field work timer baseline when it is next issued, and re-run `node scripts/design-baseline-check.mjs` for the registered baselines that change.
4. Update [`ui-style-specification.md`](../standards/ui-style-specification.md) if the notice pattern is stated there.

If option A is chosen instead, the timer concept reverts to the rule and this record closes as rejected.

## Related

- Field work timer concept canvas (private claude.ai design canvas, "Field Work Timer — Concept"), system board section 5, item D.
- [Job Pack design decision](job-pack-design.md), [UI style specification](../standards/ui-style-specification.md) §7.
