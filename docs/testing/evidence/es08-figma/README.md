# ES-08 Figma implementation evidence

<!-- versioning: git; committed history is authoritative -->

Owner: Dean Fiedler. Prepared: 13 October 2026. Owner visual acceptance remains separate.

Source checkout: branch `codex/screen-configurator-figma`, based on `c3ff5b9`. Scope and source frames: [implementation decision](../../../decisions/es08-figma-implementation.md). [PR #462](https://github.com/deanrfiedler-gif/powerplants-one/pull/462) carries final-source checks and release handover. No private Figma URL, Pro artwork or unmasked source capture is retained here.

The isolated local environment uses PostgreSQL 16, disposable `ppo_synthetic_test`, the authored Northbank fixture and synthetic coordinator. Migration and seeding initialise that private instance; this increment adds no migration, seed, capability or dependency.

## Development verification

These are executed development checks, not owner acceptance or a claim that later refinements were present in an earlier build. The final PR head must pass its applicable CI checks before integration.

| Check | Observed result |
|---|---|
| Targeted unit files | 39/39 passed: specialist engine/workbench, navigation context, desktop shell and shell navigation |
| Normal Next build | Two development builds passed compilation, TypeScript and route generation. The second includes the compact phone header/footer, ordered fields and working-panel semantics. History empty-state spacing and the supplementary phone finding select are later refinements covered by final-source checks |
| Changed-file ESLint | Passed for workbench components, product navigation, browser spec and design comparison helper before the supplementary phone select |
| Development register | 358 entries, 44 components; no errors. Existing review status remains 330 unreviewed and 28 stale; this is not acceptance |
| Foundation | Passed: 22 issued references and all 78 parent requirements retained |
| Naming | Passed, including the 7,995-character maintained project instructions |
| Hosted prerequisites | [Check run 38325352303](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38325352303) passed. Check mode deployed no image and changed no business data |

Local browser environment: Node 24.21.0, Playwright 1.63.0 and stable Chrome 155.0.8059.40. The isolated runner reuses the compiled loopback server on port 3048, with one worker and a 600-second local per-test ceiling for fixture setup on the shared Windows host. Committed CI deadlines and assertions are unchanged.

The desktop seven-view tour passed locally: five drawing profiles, linked field selection, drawing-only withholding, all 143 positions, working-panel focus return, exact run export, and widths 1920/1440/1280/1024/960/390/320. Durable draft/native receiving also passed, including invalid raw input persistence, manual re-review, cancellation, exact history, retained manual estimate edits and deliberate deletions. The local batch was stopped after five desktop cases when main advanced to d195e67 and final-source integration became necessary. Two cases passed; recovery and late-preview cases missed initial loading, and the creation assertion needed the status-selector repair below. The private extended-wait replay was also stopped for integration, with no passing outcome claimed. Final combined-source CI covers the full desktop/phone suite.

Local recovery and late-preview cases missed the existing 5-second initial-heading assertion while the authorised-detail loader was pending, before recovery began. That result is retained; it is not attributed to an application regression without baseline comparison. Isolated replay and CI results are separate evidence. A later creation-case assertion was corrected to its existing visible status paragraph; editor recovery uses a notice heading. No creation or receipt handler changed.

## Visual comparison

The Figma connector supplied source contexts and pixels for all seven desktop views, collapsed-menu Configure/Drawings, phone views and working/inspector states. Exact source node IDs remain in the implementation decision and linked design record.

Measured desktop at 1440 × 900: main content starts at x=480 after two 240-pixel navigation columns; record header 101 pixels high; context strip 76.5; readiness 41.30; view tabs 45. Phone at 390 × 844: header y=0, height 64; action bar y=772, height 72. At 320 × 800 the page does not overflow horizontally and Save remains inside the viewport.

Reviewed captures include Configure, all desktop view compositions, the 440-pixel working panel and phone Configure at 390 and 320 pixels. Dynamic values, shared global header, fallback icon mode and compact finding filters are declared adaptations. History empty-state spacing was refined after the initial capture. Private local captures are diagnostic evidence; no new Figma source image or accepted review fingerprint is claimed. CI produces application captures through the browser spec.

## Setup and earlier failures

The initial dependency junction pointed outside Turbopack's root and lacked the already-declared `yauzl` dependency. Installing the unchanged lockfile resolved setup. An intermediate webpack attempt was stopped. The private PostgreSQL instance required the same higher lock capacity used by CI; a later fixture timed out during concurrent compilation and succeeded on replay without changing database deadlines.

Initial PR head `84611b7` exposed five browser failures: ambiguous headings introduced by the secondary menu, a recovery assertion selecting a hidden desktop status on phone, and phone header CSS specificity. Selectors now target the content heading/visible recovery heading; scoped phone rules remove shared header and bottom navigation. Naming caught the project-instruction length; it was shortened and rechecked. Superseded queued checks were cancelled only on this PR.

## Remaining review

Named accepted Figma version and icon-free source captures are not recorded. Physical-device, screen-reader and owner visual acceptance remain open. Final CI and deployment outcomes are recorded in the PR handover. No production rules, ERP transaction, CAD authoring or customer communication are introduced.

## Integrated source

Main d195e67 (merged backend PR #458) is retained by ancestry. The only merge conflict was the shared status insertion; both contributions were kept. The merged project instructions were shortened by ten characters without removing scope. Main adds the independently reviewed Project RAID migration 0087 and its guarded demo upgrade; ES-08 itself still changes no migration. Final release review must account for that combined main history.

## Final integrated replay

Head `137592b` passed a normal Next build (compilation, TypeScript and route generation) and changed-file lint. The isolated extended-wait replay passed accepted/unaccepted-save reload recovery, creation recovery/read-only/permission withdrawal, and ES08-T52 late-preview ordering. Its Figma layout case caught the browser-native dialog maximum width: a requested 390-pixel phone panel rendered at 356 pixels. The phone dialog rule now explicitly sets `max-width: 100vw`; replay of that correction and final-head CI are recorded separately in the PR handover. No receipt or calculation code changed.

## Shared shell integration

Head `2e6109c` passed all 12 ES-08 desktop/phone browser cases under the committed CI deadlines in [run 38330480159](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38330480159/job/115079093846), including the corrected full-width phone dialog. Its normal local build, two Figma layout cases and five supplementary phone cases also passed. This evidence precedes the shared-shell integration below.

Main `ad9f2eb` (PR #459) supplies the adopted Figma Shell v2 header and rail. The four integration conflicts preserve both status entries, both shell/component fixtures and consumers, and ES-08 source provenance. The design comparison now uses the shared flowing-header contract while retaining its deliberate search-offset negative control. The merged instructions contain 7,996 characters. Fresh combined-source validation and release evidence are recorded in PR #462; earlier captures do not establish acceptance of the new shell.

The `d30f72d` integrated source passed the normal build, changed-file lint, design-register, foundation and naming checks. Its local seven-view/responsive tour and durable draft/native receiving case passed before the replay was stopped to correct a capture finding: long ancestor breadcrumbs left a clipped fragment beside the workbench name. Scoped desktop CSS now shows the current page; Page hierarchy retains the ancestor link and Escape focus return. Fresh compiled replay and CI cover this correction.
