# Discovery register native verification

Scope ES-02, route `/estimating/discovery`, implementation branch `codex/es02-discovery-register`. Owner visual review pending. Synthetic UI stories are test fixtures, not operational records or business acceptance.

Source: Figma **PPO - Design**, named version **Discovery register — Pipedrive pattern, accepted**, live corrected frames enumerated in the [page contract](../../../design/development/pages/route-estimating-discovery.md). Every desktop, tablet, phone and state frame and the notes card was read; retained icon-free references were cross-checked and remain unchanged. Private source and app captures stay outside the public repository.

## Verification on 20 October 2026

| Check | Observed result |
| --- | --- |
| `npm run studio:check` | Passed: 366 entries, 48 components, 210 routes, no errors. Review statuses remain separate. |
| `npm run typecheck` | Passed, including the post-merge shared-header integration. |
| `npm run lint` | Passed after merging main, exit 0. Changed-file ESLint also passed. |
| Discovery model unit tests | Passed, 3 tests: overlapping views, archived alternatives, withheld cost access and exact saved basis. |
| Font Awesome unit tests | Passed, 4 tests, after extending the catalogue assertion and fallback rendering proof for the new name mapping. |
| `npm run test:unit` | Initial complete run: 942 passed, 10 failed out of 952. One failure was this change's omitted icon-catalogue expectation; the focused rerun passes. The other nine reproduce on unchanged main, as detailed below. No all-green full local suite is claimed. |
| ES-02 Playwright, desktop and phone | Post-merge full run passed: 15 tests, 1 intentional skip; the phone snapshot case is intentionally skipped because phone rows open the wizard. Tests cover counts/filtering, refresh failure clearing rows/counts, retry into view-only mode, 390/320 overflow, loading/error/denied/empty/no-matches, saved-version handovers, tab keys, inert covered controls and focus return. |
| `npm run build` / ordinary local dev | Turbopack cannot resolve the worktree's node_modules junction outside its root. The same build failure reproduces on unchanged main. No successful production build is claimed locally. |
| `python scripts/check_naming.py` | Passed. |
| `python scripts/check_foundation.py` | Passed: all 78 parent requirements retained, 22 issued sources, no errors. |
| `python scripts/build-ui-sequence.py` | Regenerated successfully into ignored output, with all 366 entries placed or excluded. |
| `python scripts/build_status.py` | Regenerated STATUS and the decisions index from the status fragment. |
| Database integration | Added a projection/authority case to the existing synthetic database suite. Not run locally: the available local session returned connection failures. CI must prove it against `ppo_synthetic_test`; no database result is inferred from mocked browser reads. |

Baseline comparison used a detached, unchanged checkout of main `0ebb26a3cccb1060f67186bf9f4e97b5c6118c8c` with the same installed dependencies. Its six relevant unit files produced 23 passes and the same nine failures: two operator CLI probes, two CPQ worker workloads, two document-store private-path checks, two foundation launcher probes and one recovery private-path check. These are observed Windows baseline failures, not newly attributed regressions. The shared local installation reports Next 16.4.0 while the lockfile pins 16.4.2; CI uses the pinned installation.

The page ran through the existing Webpack test mode on a separate local port; no committed launcher configuration changed. The first browser run exposed a snapshot focus-return bug, now fixed and passing. Later reruns corrected the phone test's assumption that its hidden desktop menu remained mounted, and allowed the observed Windows URL navigation latency. After integrating main 5ebb5c0a, the page uses SecondaryMenuFrame's current phoneHeader prop for one shared registration. The full browser matrix and all seven focused unit tests pass after that integration. A verification attempt made while the preview process was stopped failed with connection refused; it was rerun once the preview was ready. The first CI failures identified the required Desktop/Mobile contract headings and the icon-catalogue expectation; both are corrected. Engineering CI static assurance passed on 963382ed after those corrections; the later database/browser stages were still running. Check the PR checks for the final pushed commit rather than treating earlier successful checks as proof of a newer commit.

## Visual comparison

| Live reference | App comparison |
| --- | --- |
| All workspaces 1400:345640, 1440 × 900 | Flush grid below the 64 px shell header and 60 px toolbar; 40 px header/rows, 240 px menu, horizontally scrollable trailing columns. Removed the old module tab band. |
| Northbank snapshot 1400:352346, 1440 × 900 | Two-column snapshot, outside close/previous/next controls, ruled footer and exact saved estimate handover. Activity and supported facts differ as documented below. |
| Tablet 1400:355129, 1024 × 900 | Captured with the existing rail preference collapsed to 76 px; 20 px menu grip and grid geometry aligned. The user's rail preference is retained. |
| Phones 1400:354630 / 1400:354952, 390/320 × 844 | 56 px shared header, 60 px toolbar, 50 px context row and 85 px rows. Corrected the four-pixel context line-height difference. No horizontal page overflow; A is omitted at 320 while another selected option remains visible. |
| Loading 1400:355914, no matches 1400:356040, error 1400:356154 | Corresponding phone states captured and exercised; no phantom rows or authoritative counts after failed reads. |
| Empty 1402:3944 and view-only 1402:4539 | Desktop states captured; Intake remains available and create actions are withheld in view-only mode. |

Remaining differences and review limits:

- Existing shared shell rules control header utility placement and title truncation at 320. Global search remains in the phone menu; no page-specific search behaviour is invented. The unavailable Reviews & approvals destination is absent from the real shell, so its reference rail/bottom-bar item and example badges are not fabricated.
- Shared buttons, chips, date formatting and the local fallback glyphs have minor differences from the frames (including `v4` rather than the snapshot's `v04`). The owner's online Kit draws the mapped Light icons; no Pro artwork is committed.
- Recent activity explicitly covers selected-option discovery revisions. The existing read does not supply the combined estimate/alternative event feed drawn in the snapshot. Recorded follow-up, system and facility facts replace unsupported growing-area counts.
- Bulk actions, column settings and More remain unavailable; their commands are unspecified. Full Revisions, denied-row composition, desktop loading/error, hover and 200% zoom references are absent. These surfaces use existing controls and stated evidence without claiming visual acceptance.

No owner visual review, deployment, operational acceptance or production readiness is claimed. The [implementation decision](../../../decisions/discovery-register-native.md) and page contract retain the open questions.
