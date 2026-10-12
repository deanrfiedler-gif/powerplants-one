---
document_id: PPO-ES08-FIGMA-IMPLEMENTATION-DEC
date: 2026-10-13
owner: Dean Fiedler
status: Implementation authorised by direct user request; visual acceptance and deployment evidence separate
versioning: git
---

# Screen Configurator Workbench Figma implementation

On 13 October 2026 Dean requested building the Screen Configurator Workbench in the live Powerplants One application to match the supplied Figma page, with backend improvements if needed. This authorises implementing the composition previously recorded as a [proposal](es08-figma-design.md). It does not establish that a named Figma version was saved or that Dean has reviewed the resulting application.

The source is the private **PPO - Design** file, page **ES-08 · Screen Configurator Workbench**, node `406:2`. The exact desktop, phone and state nodes remain listed in the proposal record. They were read through the Figma connector on 13 October, including child contexts for Drawings and Parts where the whole-frame response was incomplete. The file URL, Pro icon assets and unmasked Figma screenshots stay outside this public repository under ADR-0050 and ADR-0053. A named accepted version and icon-free source captures remain unrecorded.

## Scope and implementation

| Contract | Implementation |
|---|---|
| Scope | Existing `scope:ES-08`, `/estimating/configurations/{id}/{view}`; CRE-13–CRE-17, EA-16/17, AT-04/28, G06 and D-009 retained |
| Page type | r20 Form / guided workflow, with Review / comparison, Document & evidence workspace and Work queue + persistent detail supporting views |
| Host | Existing full-bleed secondary-menu workspace, fixed application top bar, one workbench scrolling content surface and fixed save footer |
| Reuse | `SecondaryMenuScope`, shared product header/rail, theme tokens, existing logo and Font Awesome Kit mapping; `WorklistMenu` for historical-run actions; ES-08 fields, segmented controls, notices, dialogs, tables and dynamic SVG sheets |
| Technology | Keep Next.js, React, TypeScript and scoped CSS. The existing implementation already supplies all seven views and exact saved behaviours. A new framework, generated Tailwind dependency or parallel backend would add cost and duplicate authority without satisfying another need |
| Incoming | Exact permitted Discovery revision, option and saved configuration proposal, with current version/authority checked by existing commands |
| Outgoing | Immutable review run and resolved set; separately priced native receiving proposal into an exact estimate version. Save, review, receiving and engineering acceptance remain distinct |

Desktop uses the record header, five-cell context strip, compact readiness checks before the view tabs, and a view-specific secondary menu. Configure has two columns; Parts uses a flush table and a 440 px modal inspection panel; Pricing puts its bridge and rounding cards below the lines; Definition uses full-width findings and parameters; History keeps Inspect beside an overflow menu. Drawings retain the same live geometry and carry the estimate and configuration in their correct title-block cells.

Phone uses the compact record header, expandable readiness details, scrolling tabs, section stepper and a persistent footer. More workbench actions exposes the save reason, calculation review, method and history. Parts working fills the screen and the drawing inspector opens as a bottom sheet. Escape and close return focus to the opener.

No migration, seed, permission, quantity formula, rate policy or command endpoint is changed. Drawing-only inputs remain remembered in this browser; they are not added to immutable run evidence. Raw invalid drafts, pending receipts, optimistic version conflicts, late-preview protection, manual review and estimate receiving continue through their existing handlers.

## Adaptations and evidence

Data and statuses come from the current record, rather than the example date, version, quantity or issue count in a static frame. Additional current findings remain visible. Editable parameter proposals are retained beside Figma's descriptive parameter columns. Responsive layouts stack at narrow desktop widths so fields and decisions remain usable. Loaded Kit icons follow the private design; repository/local fallback icons remain available when the Kit cannot load. These are declared implementation adaptations, not newly approved engineering rules.

Validation, actual captures and limits are recorded in [execution evidence](../testing/evidence/es08-figma/README.md). Owner visual acceptance, physical-device review and production readiness are independent of automated checks. Existing issued references and review fingerprints are retained.
