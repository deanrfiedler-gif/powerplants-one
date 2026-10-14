# Deals Figma design evidence

**Date:** 14 October 2026 (desktop refinement); phone capture remains 13 October · **Inspector:** Codex (agent visual inspection) · **Owner review:** Pending.

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
- Created native editable text, auto-layout hierarchy, component instances and vector icons. The initial 13 October board contained 211 text nodes and 251 instances; these counts predate the 14 October component refinement. The unchanged phone list contains 81 text nodes and 33 instances. The only desktop image is the reused shell logo. No complete-screen raster is embedded in a delivered frame.
- Preserved all 18 synthetic opportunities and the stage counts 4/3/7/2/2. Known open value is $1,189,150.50 and the source weighted estimate is $500,690.25. Unknown values stay “Not estimated”; illustrative probabilities remain separate from owner categories and operational policy.
- Visual passes caught and corrected vertically centred board columns, segmented-button fit, narrow input overflow, source owner/attention presentation and singular due-date copy. Final inspected inputs are 370px or 204px to match their component roots; the targeted text-containment audit found no activity/input overflow.
- Added bounded prototype navigation between the composed desktop views and close/return actions. Links were structurally verified, not exercised as a full Figma prototype interaction test. The phone filter has no desktop-sized navigation target.
- Removed temporary capture `547:2`. The accepted Leads page, shared component masters and original HTML are preserved. Local Deals component masters remain below the review screens for editing.

## 14 October visual refinement

- Reference: Dean supplied [this stage/card screenshot](reference-columns.png), 1905 x 472. SHA-256 `29f406080e4e809f99eea8351dd1ecaad64071aa79882e637b5aba1141831c6c`. It is preserved as input evidence, not embedded as a Figma UI layer.
- Corrected paired outgoing points and incoming cut-ins across all 20 headers in the four board compositions. The final follow-up uses 8px edges and gutters, a proposed refinement of the issued 9px spacing. The white channel follows the header outline without clipped strokes.
- Polished all 72 card instances through the two existing variants: source spacing, correct expected-close and activity icons, finer icon strokes, overlapping 23px avatars, task counts and overdue/rotting colours. Cards remain 264px high; targeted width checks found no text wider than its parent.
- Refined column/card geometry after Dean specifically called out gaps and borders: 262.8px columns with 9px gutters and 244.8px cards became 264px columns with 8px gutters/insets and 248px cards. Both local card masters and all 72 instances retain 7px corners and uniform 1px inside #dce0e5 borders without effects. In the final Board export, pixel samples at all five first-card left edges return exactly #dce0e5; the previous fractional positions blended several edges.
- Increased each card stack from 1900px to 1932px, with a 2010px total column height. This restores the clipped final 20px of the seventh Quoting card and its 12px bottom padding in every board composition.
- Removed the rounded module frame and inset from all five desktop views. Each toolbar, status strip and board/list is now directly in the shared workspace. Restored the inactive Leads glyph contrast using the existing rail icon token on these instances.
- Compared the accepted Leads workspace and table (`190:20513`, header `196:23379`, default row `196:23346`). The Deals row `551:948` and new header `588:6771` reuse Grid components `74:9`, `74:11`, `74:14`, `74:18`, `74:22`, `74:26`, `74:35`, `74:48` and `74:50`. Shared masters were not changed.
- List header and all 18 rows are 40px high; body/header text uses shared 14px styles. The 1604px table scrolls horizontally within 1364px. Contact and due are separate columns; stage tags retain the exact 4/3/7/2/2 source distribution. Long cell text uses intentional single-line ellipsis.
- Inspected fresh Board, List, Snapshot, Filters and Pipeline exports at 1440 x 960. Corrected unresolved fallback surface colours and inherited stage-tag labels before the final passing renders. Board, Snapshot, Filters and Pipeline were recaptured and visually inspected after the final gap/border/height refinement; List retains its passing earlier 14 October capture. The phone PNG is unchanged from 13 October.
- The screenshot establishes requested appearance; this agent inspection does not grant owner acceptance. No application changes were made.

## Limits

Owner design acceptance, application integration, complete HTML interaction/dialog coverage, drag behaviour, saving, keyboard/screen-reader acceptance, physical devices, 320px/tablet layouts and deployment are unverified. Source-specific fixture dates were frozen on 13 October 2026. Some source actions are displayed only; the six screens are a design proposal, not a complete working application. Existing runtime r38 references and review fingerprints remain unchanged.

## Repository validation

The development-register check was rerun after the 14 October record changes and passed with the same counts below. `git diff --check` also passed. Earlier naming/foundation results remain the 13 October baseline checks.

- Naming check passed: 603 document records, 442 metadata documents, 304 Git masters; no errors.
- The `studio:check` implementation (`scripts/check-development-register.ts`, run using the existing repository's tsx loader) passed: 362 entries, 46 component entries, 208 source routes; no integrity errors. Existing 334 unreviewed and 28 stale page reviews remain visible; all 46 component reviews remain pending.
- `git diff --check` passed.
- Repository-wide foundation check passed: 22 issued sources, all 78 parent requirements, 9,431 local links and 5,917 text files checked; no errors.
- The first direct tsx invocation used a Windows drive path that Node treated as an unsupported URL scheme. Retrying with the required `file:///` URL passed; no source or dependency change was needed.
- No application tests were added or run because no application behaviour changed.


Handover: [PR #473](https://github.com/deanrfiedler-gif/powerplants-one/pull/473). CI, merge and owner acceptance remain separate.

