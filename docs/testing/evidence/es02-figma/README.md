# Estimation Wizard Figma implementation evidence

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Prepared:** 13 October 2026. **Review:** Application owner/device acceptance pending.

Source: [implementation decision](../../../decisions/es02-wizard-figma-implementation.md), accepted page `383:2` and the [immutable Figma captures](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md). The application is the existing ES-02 record route; no reference preview is substituted for the live page.

## Fixtures and verification

`scripts/es02-fixture.ts` retains its historical r01 default and adds an explicit synthetic `r02` fixture. Northbank has three saved discovery revisions, three alternatives, four systems and saved estimate v04 at AUD 58,400 based on discovery r02. The optional fixture explicitly assigns categories; it is not an automatic historical mapping.

`tests/browser/estimating-wizard-figma.spec.ts` exercises real catalogue review, same-draft phone editing/focus return, fresh confirmation/save, original IDs/facts/cost basis, family states, category addition and confirmed discard. `estimating-wizard.spec.ts` retains exact-cost, delayed-preview, dirty-navigation, maximum-scope and archived-view proofs. Its design helper independently checks the unchanged accepted PNG hash and desktop geometry in both rail modes.

Local verification uses an isolated PostgreSQL 16 cluster containing only `ppo_synthetic_test`, a separate port and the existing local identity adapter. Local captures use public fallback glyphs with the private kit disabled. No credentials, raw operational data or Pro artwork are retained in this evidence.

Execution results are recorded below after the final source checks. Generated browser captures and traces remain local test artifacts. Source presence, automated geometry, visual inspection, business acceptance, CI and deployment are distinct.

## Limits and earlier attempts

The first focused run passed the real historical-catalogue save but found a test locator matching both hidden Requirements and visible Configuration family cards. The corrected assertion scopes to Configuration. A concurrent dev-server regeneration also left partial `.next/dev/types` output during TypeScript checking; final type/build verification is run after regeneration. Neither result is represented as a pass.

Real-device and screen-reader acceptance, phone Alternatives/Revisions mockups, Q6 timing persistence and deployment remain open. The accepted design's synthetic prices and statuses are not production rules.

## Integrated source and captured views

The implementation commit `8071877` is integrated with main `65141dc` in `ce72790`. That main update contributes the separately authorised document backend and unchanged migration 0091; this UI contribution adds no migration. The isolated local database was advanced with the normal migration runner before final browser verification. Source files and capture hashes are recorded in `source-manifest.json`.

Actual compiled-application captures with fallback icons: [desktop Configuration, 1440 × 1000](configuration-desktop.png), [phone Configuration, 390 × 844](configuration-phone.png) and [phone system editor, 390 × 844](system-phone.png). These show the saved r03 state and real r02 cost basis. They are execution evidence, not replacement Figma baselines or owner approval. Visual inspection also covered Requirements, Scope & delivery, Pricing and Review, 1024 px tablet, and 320 px phone. The narrowest page has no horizontal overflow and retains a 72 px footer.

Earlier browser attempts exposed obsolete header/summary selectors and capitalisation in the retained tests. Tests now inspect the summary from Discovery and restore the prior tab. Identity loss at 320 px is driven by a real identity change in a second tab, exercising the existing BroadcastChannel lock without navigating/reloading the protected draft. The first second-tab route was unavailable to that role and was corrected to the permitted Discovery register. One test/capture attempt ran before the rebuilt local server was listening and received connection refused; the verified run starts after the compiled server reports readiness. The phone Infrastructure wrapping found during visual inspection was fixed before these final captures.

Final checks: compiled build (including TypeScript), changed-source ESLint, design register assurance and 22 focused discovery/configuration unit tests pass. The complete compiled browser and final documentation results are recorded in the closing verification entry below. Full-repository lint and standalone TypeScript also passed earlier in this session. No hosted deployment or business transaction was performed.

## Closing verification

On the integrated source above, all **19 applicable compiled Chrome browser cases pass** across desktop and phone; five pre-existing desktop-only cases remain intentionally skipped in the mobile project. The desktop source helper also exercises 1920/1440/1280 px and both rail modes, while the existing journey captures 1024/768/390/320 px. No failing browser assertion remains.

The local Playwright wrapper changes only the origin to port 3016, omits the warm-up dependency for the already-running compiled server, uses a 120-second outer timeout and 20-second assertion wait, and redirects output to ignored local artifacts. Existing explicit test/action deadlines and all business assertions are retained. This is functional/geometry evidence, not a performance acceptance result.

The final integrated compiled build, TypeScript validation, changed-source ESLint, `npm run studio:check`, foundation assurance and naming assurance pass. The 22 focused discovery/configuration units pass. The register retains 334 unreviewed and 28 stale page reviews; all 46 component reviews remain pending. These statuses are preserved deliberately. GitHub CI, merge, hosted deployment and owner/device acceptance are not claimed by the local results.

## CI selector repair - 14 October 2026

CI on `62bf3db` found two stale assumptions beyond the focused Wizard suite: the native Fertigation handover still opened the former Estimating menu, and the E1 restart harness expected the older verbose alternative labels. The handover now uses the accepted Workspace actions menu and its real menu item. Restart assertions use the current labels and explicitly retain the selected alternative Active-state proof; original receipts, full saved state, revision comparisons and deadlines remain unchanged. Fresh CI is required for the complete desktop/mobile and three-process journeys. No application implementation, accepted image or review fingerprint changes.
