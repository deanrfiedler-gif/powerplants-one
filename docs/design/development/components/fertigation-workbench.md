# Fertigation workbench presentation host

Stable component: `fertigation-workbench`. Owner: Dean Fiedler. Coverage: Host example. Review: pending owner visual acceptance.

The record host combines the existing fertigation header, presentation kit and charts with shared `RecordTabs`, `RegisterTable` and `WorklistMenu`. It follows the [accepted Figma decision](../../../decisions/fertigation-figma-design.md) and [implementation scope](../../../decisions/fertigation-figma-implementation.md). Its consumer is `route:/estimating/fertigation/[id]`; it is not a generic equipment configurator.

Use `tests/helpers/fertigation-board-scope.ts` for the deterministic synthetic eight-finding/candidate-failure state. `FN-T118` in `tests/browser/fertigation.spec.ts` remaps every child identity for a new scope, creates an authorised saved host through the real Discovery API and walks all nine views, the row editor, section sheet and history. Existing tests cover editing, stale revision, denied access and ambiguous command recovery. A standalone fixture may not fabricate a business session.

## Desktop

At 1440 × 1000, preserve the two 240 px navigation columns, record header/context strip, 24 px body gutters and independently scrolling workspace. Existing saved rail preferences remain effective. Register actions stay at the right edge of bounded tables. Headings sit outside cards; charts use their native calculated values and consistent scales. Timeline end and unused-window captions occupy separate lines so neither obscures the other.

## Mobile

At 390 × 844 and 320 px, the section trigger opens a native modal with the same groups/counts. Valve rows become cards using the same filtered/paged records. The compact toolbar keeps Add valve visible; Find and filter expands the existing search and filters. History and recalculation are in Scope actions. Next actions rows expose the same resolving actions through phone menus; calculation trace links remain reachable. The Report/Save bar stays above the application tabs. Other dense registers retain bounded horizontal scrolling. Labels, states and unknown values remain visible in words.

Menu Escape returns focus to its trigger; dialog close restores focus. Selecting a row label or Edit opens the same existing inspector. Navigation does not mutate the saved proposal. Copy, restore and archive enter the retained history action workflow, which still requires the exact revision and reason. A Shortlisted tag retains an explicit Remove action.

Missing evidence: owner paired acceptance, physical touch-device/screen-reader testing, and Figma phone designs for the other seven views. No accepted fingerprint is inferred from generated screenshots. SVG system export and device-to-channel allocation remain open scope, not hidden controls.

The accepted phone valve register uses flush workspace edges and a contiguous tab/list surface; its filter and row-action controls retain their existing touch targets and native editor behavior.
