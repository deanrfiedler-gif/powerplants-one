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
