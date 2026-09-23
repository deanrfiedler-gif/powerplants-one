# Component catalogue — working design reference

<!-- versioning: git; committed history is authoritative -->

**Owner:** Dean Fiedler · **Stable entry:** `route:/development/design-system` · **Review:** Pending.

## Purpose and tasks

Browse PPO's real components, compare design references, inspect mapped pages and review unresolved differences. Search/filter the catalogue, select a component/state, choose a viewport and use Compare with design. Copy example links for a precise review context. Use the page register for environment-specific destinations and record parameters. Theme adjustment tools remain expandable at the bottom and export unapplied proposals.

## Desktop

Show coverage counts above search and filters; category navigation beside the selected component. Keep six labelled detail tabs, source links and review state visible. Bound horizontal scrolling inside the preview/comparison frame. Use application typography, shared controls and semantic tokens. At smaller desktop widths comparison frames stack.

## Mobile

Stack navigation above the detail pane; bound the navigation list so it does not overwhelm the page. Wrap filters/actions/tabs with 44 px targets. Inputs use 16 px text. Frame controls set actual 390/320 px child viewports, with scoped scrolling if necessary. Resize the browser separately to review the shell. Check long source paths, no page-level horizontal overflow and 200% zoom.

## Components, states and differences

Use real Button/ButtonLink, RecordTabs/RecordPanel and runtime components named by `components.json`. Example adapters supply only synthetic data and local interaction. Runnable, Host example and Reference only coverage remain distinct from Current/Not reviewed/Stale review evidence. Search has a useful no-results state. Missing references/exports fail the integrity check. Comparison and source links do not mark visual alignment approved.

## Verification and recovery

Run catalogue integrity, source/dependency drift tests, browser interaction tests and the affected application checks. Record results in the component catalogue handover. Reset discards fixture edits; Refresh rereads sources. Original HTML, page permissions and production deployment remain unchanged.
