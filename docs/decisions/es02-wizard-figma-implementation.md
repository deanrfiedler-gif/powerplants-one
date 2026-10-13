# Estimation Wizard Figma implementation

<!-- versioning: git; committed history is authoritative -->

**Date:** 13 October 2026. **Owner:** Dean Fiedler. **Status:** User-requested native implementation; application visual and business acceptance pending.

Dean requested the live ES-02 page using the accepted Figma page `383:2`. This authorises implementation after the [12 October design decision](es02-wizard-figma-design.md); its older statement that code work awaited instruction is historical. The [22 immutable icon-free captures](../reference/ui/estimating/es02-wizard-figma-design-r01/README.md), named version and child node IDs remain the visual source. No issued reference is rewritten.

The existing Next.js/React page, shared Shell v2, semantic tokens, RecordTabs, Field/SelectField, FontAwesomeGlyph mappings and native discovery services are retained. This requires no new technology, dependency, migration, grant or integration. A separate mock application would duplicate the working-copy and revision rules and is unnecessary. Scope ES-02, its r20 record-workspace type, parent IDs and the legacy integration key `es02-r01` stay stable.

## Delivered behaviour and boundaries

- D1–D5: one shared rail, record header and tabs, five equal status-bearing steps and independently scrolling 380 px summary. Alternatives/Revisions use the available width; the summary keeps the viewed alternative distinct from the selected alternative.
- D6–D9 and D18: Requirements has larger family cards, Configuration has compact filter tiles and a separate Infrastructure strip. Empty families are grey, incomplete families are neutral with amber status, and green requires evaluated confirmation. The two-stage Add system menu and Category field use ADR-0054's existing six-family/108-category catalogue.
- Historical r01 scopes retain their original family IDs and facts. An explicit catalogue review requires family/category choices for every existing system, preserves missing historical fact obligations as owned unknowns and changes only the draft. Saving still requires fresh server confirmations; saved revisions and cost bases are unchanged. Native creation outside this record editor retains its existing r01 default.
- D10–D13: field-linked unsaved changes, existing save review and discard guard, saved-result feedback and context actions. Existing unknown-outcome recovery and stale-source checks remain authoritative. The change count groups changed entities/answers rather than counting keystrokes.
- D14–D17: phone record header, step select, system list/full-page editor, summary sheet and fixed Summary/Save footer; tablet has a compact rail and summary bar. Back/Done retains the same draft and restores focus to the system row. Read-only users retain evidence and cost reads with editing unavailable.

The existing exact revision comparisons, Alternatives commands, pricing adoption, CPQ/fertigation links and structured evidence editors are reused. Incoming: CR-02/LC-13 accepted Sales context and permitted site/equipment references. Outgoing: immutable discovery revision, explicitly adopted manual-cost basis and Draft quotation; ES-04–ES-07 retain their separate review/issue/response/receiving responsibilities.

## Explicit adaptations and remaining design work

The current shared shell utilities and navigation permissions remain authoritative; synthetic labels and counts in Figma are not hard-coded. The owned Font Awesome kit renders existing mapped glyphs when available; public fallback glyphs remain usable without storing Pro artwork. No licensed Figma screenshot is added to the repository.

Q6's requested completion, estimated duration and agreed commitment appear as a clearly labelled proposed Timing presentation. Those fields have no adopted persistence contract, so no dates, duration or commitment are invented or saved. Q7 keeps the current typed fact catalogue. Family/category classification does not introduce a new suitability or pricing rule.

The retained Figma set does not draw phone Alternatives/Revisions. Those existing responsive views remain functional adaptations awaiting paired owner review. Evidence remains the existing accessible panel and exact confirmation workflow. Keyboard, browser viewport and synthetic persistence checks are recorded in the [execution evidence](../testing/evidence/es02-figma/README.md); real-device, screen-reader, business acceptance and deployment are separate.
