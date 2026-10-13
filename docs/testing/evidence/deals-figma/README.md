# Deals Figma design evidence

**Date:** 13 October 2026 · **Inspector:** Codex (agent visual inspection) · **Owner review:** Pending.

Repository documentation baseline: `5eb55f0`. This contribution changes design records only. The Figma source was the user-selected r37 HTML, SHA-256 `3b0d7806907bc97e9db37f5ae7d0cedf385abb6d9ec2781b0bedd1e8e7c4ca39`.

## Delivered frames

All frames are on [Deals (proposal)](https://www.figma.com/design/epLfuDjst5hUJeqBi3eJo8/PPO---Design?node-id=549-2). Screenshots below are direct Figma exports, not screenshots imported as UI layers.

| View | Node | Viewport | Capture |
|---|---|---|---|
| Board | `549:3` | 1440 x 960 | [Board](board.png) |
| List | `555:5333` | 1440 x 960 | [List](list.png) |
| Snapshot | `555:6027` | 1440 x 960 | [Snapshot](snapshot.png) |
| Filters | `555:6470` | 1440 x 960 | [Filters](filters.png) |
| Pipeline settings | `555:6765` | 1440 x 960 | [Pipeline settings](pipeline.png) |
| Phone list | `555:7107` | 390 x 844 | [Phone](phone.png) |

## Executed inspection

- Rendered the supplied HTML and inspected its board, snapshot and filter content. Browser reference capture was 1280 x 720; the shared-shell Figma adaptation is 1440 x 960. This is an informed visual comparison, not a pixel-identical paired-viewport test.
- Created native editable text, auto-layout hierarchy, component instances and vector icons. The board contains 211 text nodes and 251 instances; the phone list contains 81 text nodes and 33 instances. The only desktop image is the reused shell logo. No complete-screen raster is embedded in a delivered frame.
- Preserved all 18 synthetic opportunities and the stage counts 4/3/7/2/2. Known open value is $1,189,150.50 and the source weighted estimate is $500,690.25. Unknown values stay “Not estimated”; illustrative probabilities remain separate from owner categories and operational policy.
- Visual passes caught and corrected vertically centred board columns, segmented-button fit, narrow input overflow, source owner/attention presentation and singular due-date copy. Final inspected inputs are 370px or 204px to match their component roots; the targeted text-containment audit found no activity/input overflow.
- Added bounded prototype navigation between the composed desktop views and close/return actions. Links were structurally verified, not exercised as a full Figma prototype interaction test. The phone filter has no desktop-sized navigation target.
- Removed temporary capture `547:2`. The accepted Leads page, shared component masters and original HTML are preserved. Local Deals component masters remain below the review screens for editing.

## Limits

Owner design acceptance, application integration, complete HTML interaction/dialog coverage, drag behaviour, saving, keyboard/screen-reader acceptance, physical devices, 320px/tablet layouts and deployment are unverified. Source-specific fixture dates were frozen on 13 October 2026. Some source actions are displayed only; the six screens are a design proposal, not a complete working application. Existing runtime r38 references and review fingerprints remain unchanged.

## Repository validation

- Naming check passed: 603 document records, 442 metadata documents, 304 Git masters; no errors.
- The `studio:check` implementation (`scripts/check-development-register.ts`, run using the existing repository's tsx loader) passed: 362 entries, 46 component entries, 208 source routes; no integrity errors. Existing 334 unreviewed and 28 stale page reviews remain visible; all 46 component reviews remain pending.
- `git diff --check` passed.
- Repository-wide foundation check passed: 22 issued sources, all 78 parent requirements, 9,431 local links and 5,917 text files checked; no errors.
- The first direct tsx invocation used a Windows drive path that Node treated as an unsupported URL scheme. Retrying with the required `file:///` URL passed; no source or dependency change was needed.
- No application tests were added or run because no application behaviour changed.


Handover: [PR #473](https://github.com/deanrfiedler-gif/powerplants-one/pull/473). CI, merge and owner acceptance remain separate.

