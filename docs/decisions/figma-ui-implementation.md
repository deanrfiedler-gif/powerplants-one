---
document_id: PPO-FIGMA-UI-IMPLEMENTATION
title: Figma UI application implementation
date: 2026-10-13
owner: Dean Fiedler
status: Implementation authorised; application visual review and deployment separate
versioning: git
---

# Figma UI application implementation

Dean requested implementation of the supplied PPO Figma designs in the application on 13 October, including its shell, icons and styles, with backend extensions where needed. This authorises application work following the [accepted My Work design](my-work-page-design.md). Dean subsequently confirmed "My Work first" and instructed proceeding with the next step. The first reviewable increment is the shared shell and My Work overview on desktop and phone. Other module interiors and the remaining My Work grids/dialog compositions are subsequent increments; they are not represented as delivered here.

## Source and scope

The private PPO design file was read through the authorised Figma connection. The linked Shell page (`31:214`) is historical; the accepted module designs use Shell v2 (`73:4`). Exact inspected sources are desktop overview `404:3`, phone overview `404:181`, rail `84:197`, labelled rail `74:53`, compact rail `84:104`, More `79:51`, secondary items `73:46` and phone bar `107:149`. Their source presence does not establish application acceptance. Public provenance uses these node identifiers and the existing [icon-free My Work capture set](../reference/ui/my-work/my-work-page-design-r01/README.md); the private file URL and Font Awesome Pro artwork are not copied into the public repository.

| Conformance field | First increment |
|---|---|
| Stable scope | SH-01 role-based home; SH-02 My Work action centre; inherited shared shell. Preserve all parent IDs. |
| Canonical route / r20 page type | `/work`; Overview / dashboard; full-bleed interior. `#mw-content` owns desktop scrolling; the existing phone layout owns phone scrolling. |
| Reuse | ProductNavigation, ProductHeader, ShellProvider, SecondaryMenuFrame, existing ProductIcon/Icon mappings, Menu, saved-view/filter controls, ActivityRow, outcome/detail/reschedule dialogs and Page guide. No duplicate application shell. |
| Incoming handover | Current identity, company and capabilities; bounded source overview/navigation reads; saved criteria and existing user preferences. |
| Outgoing handover | Exact source links and existing Activity commands. The done ring opens Record outcome; it never completes on first click. Reschedule changes the same activity. Source modules retain approval, issue, conversion and business completion authority. |
| Exceptions | Loading, inaccessible/unavailable sources, unknown counts, empty results, stale reads, denied commands and retained drafts keep their existing behavior. No design sample counts are hard-coded. |
| Technology | Existing Next/React, CSS tokens, local Roboto and licensed runtime icon Kit under ADR-0053. No new framework, dependency, service, migration, seed or capability is required. An image recreation or a parallel shell would duplicate existing behavior and is rejected. |

## Implemented presentation

- Desktop uses a 240 px labelled rail, 76 px compact rail, department caption, 44 px destinations and More following the primary list. New identities start labelled; a saved rail preference remains authoritative. The 64 px header preserves search, utilities, identity and accessible hierarchy.
- My Work uses its 240 px flush secondary menu, a 20 px collapsed edge, toolbar with freshness and Customise in More actions, four summary cells, compact activity rows, notices and side cards. At 1440 px with both rails expanded, the content starts at x=480, with 24 px gutters and a 320 px side column. Narrower desktop interiors stack the side cards.
- Phone uses the page name in the header, three labelled quick actions, flush attention/agenda rows and the icon-only navy bottom bar. Accessible names, selected state, exact destinations, touch targets and the floating Create control remain.
- The existing semantic glyphs use the licensed runtime icon mechanism; no Pro SVG/font/capture bytes are added to public source. Offline/test fallback glyphs remain a distinct state, not evidence that the licensed Kit loaded.

## Explicit adaptations and remaining work

Operational Workspace selection, local synthetic identity, Page guide, development access and other permitted utilities remain reachable. Figma's sample rail/menu counters are omitted where no authoritative read exists. Each department keeps its permitted current destinations rather than inventing working screens. Weather stays hidden while no provider is configured. No provider or weather backend is introduced. Exact context, dates, years and time zone remain available even where compact display uses AEST and ellipsis; activity details retain the full content.

The overview reuses existing functioning dialogs; the accepted Figma detail/outcome overlays and all My Work subview grids still need their own implementation pass. Leads, Reviews, Quotations and other module interiors are not claimed as Figma-complete. Record/device/zoom and owner acceptance remain separate from this increment's synthetic browser proof. [Execution and comparison evidence](../testing/evidence/figma-ui/README.md) records actual results and limits. Existing review fingerprints remain untouched and become stale when their source changes.

The release-preparation pass keeps long workspace breadcrumbs whole: show the current destination, or the module while its menu is docked; Page hierarchy exposes the ancestors. The search flows between the heading and utilities. Engineering retains its explicit shared-menu presentation, while My Work opts into Figma styling. Estimating keeps its 1244 px content-width docking rule; the wider default rail can therefore select the drawer at a viewport that docks with the compact rail. Host checks cover these distinct states without altering command or access assertions.
