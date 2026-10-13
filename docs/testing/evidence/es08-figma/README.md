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
| Naming | Passed, including the 7,996-character maintained project instructions |
| Hosted prerequisites | [Check run 38325352303](https://github.com/deanrfiedler-gif/powerplants-one/actions/runs/38325352303) passed. Check mode deployed no image and changed no business data |

Local browser environment: Node 24.21.0, Playwright 1.63.0 and stable Chrome 155.0.8059.40. The isolated runner reuses the compiled loopback server on port 3048, with one worker and a 600-second local per-test ceiling for fixture setup on the shared Windows host. Committed CI deadlines and assertions are unchanged.

The desktop seven-view tour passed locally: five drawing profiles, linked field selection, drawing-only withholding, all 143 positions, working-panel focus return, exact run export, and widths 1920/1440/1280/1024/960/390/320. Durable draft/native receiving also passed, including invalid raw input persistence, manual re-review, cancellation, exact history, retained manual estimate edits and deliberate deletions. The full local suite continues; its final outcome belongs in the PR handover rather than being inferred here.

A local recovery case missed the existing 5-second initial-heading assertion while the authorised-detail loader was pending, before recovery began. That result is retained; it is not attributed to an application regression without baseline comparison. Isolated replay and CI results are separate evidence. A later creation-case assertion was corrected to its existing visible status paragraph; editor recovery uses a notice heading. No creation or receipt handler changed.

## Visual comparison

The Figma connector supplied source contexts and pixels for all seven desktop views, collapsed-menu Configure/Drawings, phone views and working/inspector states. Exact source node IDs remain in the implementation decision and linked design record.

Measured desktop at 1440 × 900: main content starts at x=480 after two 240-pixel navigation columns; record header 101 pixels high; context strip 76.5; readiness 41.30; view tabs 45. Phone at 390 × 844: header y=0, height 64; action bar y=772, height 72. At 320 × 800 the page does not overflow horizontally and Save remains inside the viewport.

Reviewed captures include Configure, all desktop view compositions, the 440-pixel working panel and phone Configure at 390 and 320 pixels. Dynamic values, shared global header, fallback icon mode and compact finding filters are declared adaptations. History empty-state spacing was refined after the initial capture. Private local captures are diagnostic evidence; no new Figma source image or accepted review fingerprint is claimed. CI produces application captures through the browser spec.

## Setup and earlier failures

The initial dependency junction pointed outside Turbopack's root and lacked the already-declared `yauzl` dependency. Installing the unchanged lockfile resolved setup. An intermediate webpack attempt was stopped. The private PostgreSQL instance required the same higher lock capacity used by CI; a later fixture timed out during concurrent compilation and succeeded on replay without changing database deadlines.

Initial PR head `84611b7` exposed five browser failures: ambiguous headings introduced by the secondary menu, a recovery assertion selecting a hidden desktop status on phone, and phone header CSS specificity. Selectors now target the content heading/visible recovery heading; scoped phone rules remove shared header and bottom navigation. Naming caught the project-instruction length; it was shortened and rechecked. Superseded queued checks were cancelled only on this PR.

## Remaining review

Named accepted Figma version and icon-free source captures are not recorded. Physical-device, screen-reader and owner visual acceptance remain open. Final CI and deployment outcomes are recorded in the PR handover. No production rules, ERP transaction, CAD authoring or customer communication are introduced.
