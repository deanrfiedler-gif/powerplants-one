# My Work r01 verification

The [interactive HTML](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-r01.html) and [detailed report](../../../reference/ui/my-work/PPO-My-Work-and-Action-Centre-Report-r01.md) are delivered in [PR #209](https://github.com/deanrfiedler-gif/powerplants-one/pull/209). This is standalone synthetic design evidence, with application integration and owner acceptance separate.

## Final source and results

| Item | Evidence |
|---|---|
| Checked source | `b3f83e4fe4de36cca79c8fed927409e971e5e279`, including the owner-side main merge `b9175b95b15aa24bd1fa8ece6f062cdd3c435050`. |
| HTML SHA-256 | `7e915a6d896e4c64967857e1fcd536307eab0c0394916f3d776a1b23ebdab850` |
| Focused workflow | [35044052566](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35044052566), job `104629947603`: success on 16 September 2026. |
| Runtime | Repository pins Node 24.21.0, npm 11.19.0, Playwright 1.63.0; actual native Chrome `153.0.8010.47`. |
| Model | **26 groups passed**, [original result](model-results.json). |
| Native interaction | **24 groups passed**, no browser errors; [original result](results.json). |
| Responsive coverage | All six views at 1440, 1024, 820, 390 and 320 px. No page overflow or clipped navigation in the checked views. |
| Original screenshots | 20 PNGs captured; ten final captures visually inspected, covering all six phone views plus desktop source/transition details. [Exact names, hashes and findings](visual-review.json). |
| Artifact | [10425894511](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35044052566/artifacts/10425894511), `My-Work-design-evidence`; archive SHA-256 `15111f75d2ac06a52d38331b9ec62516cd1ed59b64b1aaec4f1dc3bf7c745e0a`. Original artifact expires 30 September 2026; checks and hashes remain here. |
| Local checks | Deterministic build, focused ESLint/syntax, foundation, prototype and naming checks passed. [Documentation results](documentation-results.json). |

Native interactions cover the complete Northbank return/correct/retest/accept/release journey; unchanged original failed evidence; the open OEM action; distinct Activity/task completion; team assignment; source dependency follow-up; notification/preferences separation; saved-view lifecycle; failed/lost saves; partial/failed/empty sources; cross-tab stale-write refusal; role changes; keyboard focus; export/restore; and damaged-state recovery. Source assertions additionally check completed-release explanations, assigned task wording and all phone navigation tabs.

## Earlier evidence and corrections

The first run, [35043066415](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35043066415), checked `bebd1a2038a4a4a16f2dc035fd4bf5e8f34a38bf`. It passed two groups and stopped on a heading assertion: CSS correctly rendered `QUALITY & SITE ASSURANCE · REVIEW`, while the test expected title-case text. The test now checks the exact heading without making letter case significant. [Original failed result](initial-results.json) is retained; no source rule was relaxed.

The next run, [35043411140](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/35043411140), checked `034d370e38413a702442371d2fab8c8d3e665ce0` and passed all 24 groups. [Original prior result](prior-native-results.json) is retained. Visual inspection then found that a selected completed release retained its earlier decision-needed wording, an assigned task retained its ownership-needed wording, and phone tabs required horizontal scrolling. The final source updates those explanations, identifies the retest predecessor and distinguishes failed submissions, and wraps all navigation tabs. The final native run adds assertions for those findings and passes on the new HTML hash above.

The report/evidence-only handover commit following the checked source does not alter design sources, browser checks, generated HTML or runtime dependencies. It records exact evidence rather than inheriting unrelated application checks. Broad application CI results and main/owner acceptance must be assessed separately in the PR; no deployment is claimed here.

## Reproduction

Use the [source guide](../../../design/my-work/README.md). Run the deterministic builder, model script and native browser script under the repository's existing pins. The focused workflow uploads original results, screenshots and the synthetic session export. Retained JSON and hashes allow comparison after the 14-day artifact window; regenerating screenshots creates new timestamped evidence, not the original run.
