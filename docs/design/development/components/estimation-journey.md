# Complete estimation wizard

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler. **Catalogue key:** `estimation-journey`. **Coverage:** Host example. **Review:** Pending.

The actual `DiscoveryDetail` host uses the accepted Figma design with the existing revision, alternative and saved-cost services. This is a real session-bound integration example; no isolated catalogue renderer is claimed.

## Sources and consumers

The [page contract](../pages/route-estimating-discovery-id.md), [implementation decision](../../../decisions/es02-wizard-figma-implementation.md) and [immutable Figma captures](../../../reference/ui/estimating/es02-wizard-figma-design-r01/README.md) define the geometry and explicit adaptations. Consumers are the existing ES-02 record route and scope entry; the earlier theme study remains reference history.

## Figma components

**Status:** Mapped · **Location:** Components › Estimating parts, in the private "PPO - Design" Figma file

- Wizard / Context header `385:168`
- Wizard / Working-copy bar `385:165`
- Wizard / View tabs `395:3916`
- Wizard / Step `383:33`
- Wizard / Family tile `383:53`
- Wizard / Family card `410:84472`
- Wizard / Finding link `383:77`
- Wizard / Summary panel `385:13`

ES-02 wizard parts from the accepted Estimation Wizard page (383:2). The mapping is kept in `../components.json` (`figma`); node IDs are stable, and the file link stays out of this repository (ADR-0053). It records where the design component is, not visual alignment or review.

## Desktop

Desktop uses the shared 240/76 px rail, 380 px summary, five 48 px steps, full-width system grid and fixed save controls. Summary closes on Alternatives/Revisions. Requirements has larger Add cards; Configuration uses six filter tiles plus Infrastructure. Green requires evaluated confirmation.

## Mobile

Phone uses the record header, tabs, viewed alternative, step selector, system cards and full-page editor over the same draft. Back returns focus to the source system without discarding. Summary opens a sheet; the 72 px footer retains Save. The global bottom navigation is absent on this route. Table overflow stays local.

## States, keyboard and fixtures

Reuse labelled Field/SelectField, shared RecordTabs, native dialogs, validation, original-command recovery and FontAwesomeGlyph mappings. Changes/findings link to their field or evidence panel. Escape closes overlays and phone Back returns focus. Existing ES-02 scoped buttons remain a legacy exception to the shared Button migration.

`scripts/es02-fixture.ts` retains r01 and adds explicit r02 synthetic Northbank scope. `tests/browser/estimating-wizard-figma.spec.ts` covers catalogue mapping, category add, family status, save/discard, exact history and phone editing. `estimating-wizard.spec.ts` covers delayed previews, maximum scope, navigation guards, archived scope and saved costs. These host fixtures are the representative state examples.

## Differences and verification

Q6 timing fields remain a labelled proposal with no persistence. No new technical rule or equipment suitability follows from a category. Phone Alternatives/Revisions images, real devices, screen-reader review and owner acceptance remain open. See [execution evidence](../../../testing/evidence/es02-figma/README.md). Review fingerprints remain unchanged; automated tests and source presence do not approve the page.
